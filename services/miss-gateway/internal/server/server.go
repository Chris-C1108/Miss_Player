package server

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"miss-gateway/internal/hls"
	"miss-gateway/internal/registry"
	"miss-gateway/internal/source"
)

type Config struct {
	Port       string
	ProxyURL   string
	Version    string
	WaitWindow time.Duration
	Timeout    time.Duration
	Tokens     []string
}

type Server struct {
	cfg      Config
	manager  *source.Manager
	registry *registry.Registry
	mux      *http.ServeMux
	client   *http.Client
}

func NewServer(cfg Config, mgr *source.Manager) *Server {
	if cfg.WaitWindow == 0 {
		cfg.WaitWindow = 3500 * time.Millisecond
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 12 * time.Second
	}
	if cfg.Version == "" {
		cfg.Version = "2.0.0"
	}

	s := &Server{
		cfg:      cfg,
		manager:  mgr,
		registry: registry.NewRegistry(2 * time.Hour),
		mux:      http.NewServeMux(),
		client:   mgr.Client(),
	}

	if s.client == nil {
		s.client = source.NewHTTPClient(cfg.ProxyURL, 12*time.Second)
	}

	s.setupRoutes()
	return s
}

func (s *Server) Routes() http.Handler {
	return s.mux
}

func (s *Server) setupRoutes() {
	// 管理与健康检查路由
	s.mux.HandleFunc("GET /health", s.handleHealth)
	s.mux.HandleFunc("GET /api/resolve", s.handleResolve)
	s.mux.HandleFunc("OPTIONS /api/resolve", s.handleResolve)
	s.mux.HandleFunc("GET /resolve", s.handleResolve)
	s.mux.HandleFunc("OPTIONS /resolve", s.handleResolve)

	// Phase 19 播放面核心路由 (包含路径鉴权 token)
	s.mux.HandleFunc("GET /v1/{token}/play/{code}", s.handlePlay)
	s.mux.HandleFunc("HEAD /v1/{token}/play/{code}", s.handlePlay)

	s.mux.HandleFunc("GET /v1/{token}/pl/{code}/{src}/{var}", s.handlePlaylist)
	s.mux.HandleFunc("HEAD /v1/{token}/pl/{code}/{src}/{var}", s.handlePlaylist)

	s.mux.HandleFunc("GET /v1/{token}/seg/{code}/{src}/{var}/{file}", s.handleSegment)
	s.mux.HandleFunc("HEAD /v1/{token}/seg/{code}/{src}/{var}/{file}", s.handleSegment)

	s.mux.HandleFunc("GET /v1/{token}/key/{code}/{src}/{var}/{file}", s.handleKey)

	s.mux.HandleFunc("GET /v1/{token}/map/{code}/{src}/{var}/{file}", s.handleMap)
	s.mux.HandleFunc("HEAD /v1/{token}/map/{code}/{src}/{var}/{file}", s.handleMap)

	// 根路径兼容回退
	s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("code") != "" {
			s.handleResolve(w, r)
		} else {
			s.handleHealth(w, r)
		}
	})
}

// validateToken 校验路径中的鉴权令牌
func (s *Server) validateToken(token string) bool {
	if len(s.cfg.Tokens) == 0 {
		return true // 未配置令牌时开发模式放行
	}
	tokenBytes := []byte(token)
	for _, valid := range s.cfg.Tokens {
		if len(tokenBytes) == len(valid) && subtle.ConstantTimeCompare(tokenBytes, []byte(valid)) == 1 {
			return true
		}
	}
	return false
}

func (s *Server) enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Range, X-Requested-With")
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "miss-stream-gateway",
		"version": s.cfg.Version,
		"proxy":   s.cfg.ProxyURL,
		"time":    time.Now().Format(time.RFC3339),
	})
}

// handlePlay HLS 播放入口 (/v1/{token}/play/{code}.m3u8)
func (s *Server) handlePlay(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	token := r.PathValue("token")
	if !s.validateToken(token) {
		http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
		return
	}

	rawCode := r.PathValue("code")
	cleanCode := strings.ToUpper(strings.TrimSuffix(rawCode, ".m3u8"))
	if cleanCode == "" {
		http.Error(w, "Invalid code", http.StatusBadRequest)
		return
	}

	// 1. 检查注册表缓存
	session, exists := s.registry.Get(cleanCode)
	if exists && session != nil {
		if v, ok := session.Variants["0"]; ok && v.M3U8URL != "" {
			// 直接返回已改写的缓存清单
			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
			w.Header().Set("Cache-Control", "no-store")
			_, _ = w.Write(v.RewrittenM3U8)
			return
		}
	}

	// 2. 缓存未命中，调用加权竞速寻源
	ctx, cancel := context.WithTimeout(r.Context(), s.cfg.Timeout)
	defer cancel()

	res, err := s.manager.ResolveWeighted(ctx, cleanCode, s.cfg.WaitWindow)
	if err != nil || res == nil || res.URL == "" {
		log.Printf("[Play] %s 寻源失败: %v", cleanCode, err)
		http.Error(w, "Stream not found", http.StatusNotFound)
		return
	}

	// 3. 拉取上游原始 M3U8 清单
	mReq, err := http.NewRequestWithContext(ctx, "GET", res.URL, nil)
	if err != nil {
		http.Error(w, "Failed to create upstream request", http.StatusInternalServerError)
		return
	}
	if res.Referer != "" {
		mReq.Header.Set("Referer", res.Referer)
	}
	mReq.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

	mResp, err := s.client.Do(mReq)
	if err != nil || mResp.StatusCode >= 400 {
		if mResp != nil {
			mResp.Body.Close()
		}
		log.Printf("[Play] %s 上游清单获取失败: %v", cleanCode, err)
		http.Error(w, "Failed to fetch upstream playlist", http.StatusBadGateway)
		return
	}

	mBytes, err := io.ReadAll(mResp.Body)
	mResp.Body.Close()
	if err != nil {
		http.Error(w, "Failed to read upstream playlist", http.StatusBadGateway)
		return
	}

	// 4. 改写 M3U8 清单内容
	sourceSlug := strings.ToLower(strings.Split(res.Source, " ")[0])
	rewritten, err := hls.RewriteM3U8(mBytes, res.URL, hls.RewriteOptions{
		Token:    token,
		Code:     cleanCode,
		SourceID: sourceSlug,
		Variant:  "0",
	})
	if err != nil {
		log.Printf("[Play] %s 清单改写失败: %v", cleanCode, err)
		http.Error(w, "Failed to rewrite playlist", http.StatusInternalServerError)
		return
	}

	// 5. 保存进会话注册表
	newSession := &registry.StreamSession{
		Code:         cleanCode,
		SourceID:     sourceSlug,
		UpstreamM3U8: res.URL,
		Referer:      res.Referer,
		Variants: map[string]*registry.VariantSession{
			"0": {
				VariantID:     "0",
				M3U8URL:       res.URL,
				Sublists:      rewritten.Sublists,
				Segments:      rewritten.Segments,
				Keys:          rewritten.Keys,
				Maps:          rewritten.Maps,
				RewrittenM3U8: rewritten.Rewritten,
			},
		},
	}
	s.registry.Set(newSession)

	// 6. 返回改写后的清单
	w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
	w.Header().Set("Cache-Control", "no-store")
	if r.Method != http.MethodHead {
		_, _ = w.Write(rewritten.Rewritten)
	}
}

// handlePlaylist 多清晰度子清单 (/v1/{token}/pl/{code}/{src}/{var}.m3u8)
func (s *Server) handlePlaylist(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	token := r.PathValue("token")
	if !s.validateToken(token) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	code := strings.ToUpper(r.PathValue("code"))
	sourceID := r.PathValue("src")
	varParam := strings.TrimSuffix(r.PathValue("var"), ".m3u8")

	idx, err := strconv.Atoi(varParam)
	if err != nil {
		http.Error(w, "Invalid variant index", http.StatusBadRequest)
		return
	}

	upstreamSublist, referer, ok := s.registry.GetSublist(code, idx)
	if !ok || upstreamSublist == "" {
		http.Error(w, "Sublist not found", http.StatusNotFound)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), s.cfg.Timeout)
	defer cancel()

	pReq, err := http.NewRequestWithContext(ctx, "GET", upstreamSublist, nil)
	if err != nil {
		http.Error(w, "Request error", http.StatusInternalServerError)
		return
	}
	if referer != "" {
		pReq.Header.Set("Referer", referer)
	}
	pReq.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

	pResp, err := s.client.Do(pReq)
	if err != nil || pResp.StatusCode >= 400 {
		if pResp != nil {
			pResp.Body.Close()
		}
		http.Error(w, "Upstream sublist error", http.StatusBadGateway)
		return
	}

	pBytes, _ := io.ReadAll(pResp.Body)
	pResp.Body.Close()

	rewritten, err := hls.RewriteM3U8(pBytes, upstreamSublist, hls.RewriteOptions{
		Token:    token,
		Code:     code,
		SourceID: sourceID,
		Variant:  varParam,
	})
	if err != nil {
		http.Error(w, "Rewrite sublist failed", http.StatusInternalServerError)
		return
	}

	// 补充变体进注册表
	_ = s.registry.SetVariant(code, &registry.VariantSession{
		VariantID:     varParam,
		M3U8URL:       upstreamSublist,
		Segments:      rewritten.Segments,
		Keys:          rewritten.Keys,
		Maps:          rewritten.Maps,
		RewrittenM3U8: rewritten.Rewritten,
	})

	w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
	w.Header().Set("Cache-Control", "no-store")
	if r.Method != http.MethodHead {
		_, _ = w.Write(rewritten.Rewritten)
	}
}

// handleSegment 视频分片流式代理 (/v1/{token}/seg/{code}/{src}/{var}/{file})
func (s *Server) handleSegment(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	token := r.PathValue("token")
	if !s.validateToken(token) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	code := strings.ToUpper(r.PathValue("code"))
	variant := r.PathValue("var")
	file := r.PathValue("file")

	idxStr := strings.TrimSuffix(file, path.Ext(file))
	idx, err := strconv.Atoi(idxStr)
	if err != nil {
		http.Error(w, "Invalid segment index", http.StatusBadRequest)
		return
	}

	upstreamURL, referer, ok := s.registry.GetSegment(code, variant, idx)
	if !ok || upstreamURL == "" {
		http.Error(w, "Segment not found", http.StatusNotFound)
		return
	}

	// 流式透传请求至上游 CDN
	s.proxyUpstreamResource(w, r, upstreamURL, referer, "video/mp2t")
}

// handleKey AES-128 密钥代理 (/v1/{token}/key/{code}/{src}/{var}/{file})
func (s *Server) handleKey(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	token := r.PathValue("token")
	if !s.validateToken(token) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	code := strings.ToUpper(r.PathValue("code"))
	variant := r.PathValue("var")
	file := r.PathValue("file")

	idxStr := strings.TrimSuffix(file, path.Ext(file))
	idx, err := strconv.Atoi(idxStr)
	if err != nil {
		http.Error(w, "Invalid key index", http.StatusBadRequest)
		return
	}

	upstreamURL, referer, ok := s.registry.GetKey(code, variant, idx)
	if !ok || upstreamURL == "" {
		http.Error(w, "Key not found", http.StatusNotFound)
		return
	}

	s.proxyUpstreamResource(w, r, upstreamURL, referer, "application/octet-stream")
}

// handleMap fMP4 初始化分段代理 (/v1/{token}/map/{code}/{src}/{var}/{file})
func (s *Server) handleMap(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	token := r.PathValue("token")
	if !s.validateToken(token) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	code := strings.ToUpper(r.PathValue("code"))
	variant := r.PathValue("var")
	file := r.PathValue("file")

	idxStr := strings.TrimSuffix(file, path.Ext(file))
	idx, err := strconv.Atoi(idxStr)
	if err != nil {
		http.Error(w, "Invalid map index", http.StatusBadRequest)
		return
	}

	upstreamURL, referer, ok := s.registry.GetMap(code, variant, idx)
	if !ok || upstreamURL == "" {
		http.Error(w, "Map not found", http.StatusNotFound)
		return
	}

	s.proxyUpstreamResource(w, r, upstreamURL, referer, "video/mp4")
}

// proxyUpstreamResource 流式代理上游媒体资源
func (s *Server) proxyUpstreamResource(w http.ResponseWriter, r *http.Request, upstreamURL, referer, fallbackMime string) {
	uReq, err := http.NewRequestWithContext(r.Context(), r.Method, upstreamURL, nil)
	if err != nil {
		http.Error(w, "Failed to create upstream request", http.StatusInternalServerError)
		return
	}

	// 注入合规防护头
	if referer != "" {
		uReq.Header.Set("Referer", referer)
	}
	uReq.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

	// 透传客户端 Range 与 If-Range 标头 (保证 Apple TV / Safari / Infuse 拖动进度流畅)
	if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
		uReq.Header.Set("Range", rangeHeader)
	}
	if ifRangeHeader := r.Header.Get("If-Range"); ifRangeHeader != "" {
		uReq.Header.Set("If-Range", ifRangeHeader)
	}

	uResp, err := s.client.Do(uReq)
	if err != nil {
		http.Error(w, "Upstream request failed", http.StatusBadGateway)
		return
	}
	defer uResp.Body.Close()

	// 复制关键头部
	contentType := uResp.Header.Get("Content-Type")
	if contentType == "" || strings.HasPrefix(contentType, "image/") {
		contentType = fallbackMime
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "no-store")

	if cl := uResp.Header.Get("Content-Length"); cl != "" {
		w.Header().Set("Content-Length", cl)
	}
	if cr := uResp.Header.Get("Content-Range"); cr != "" {
		w.Header().Set("Content-Range", cr)
	}

	w.WriteHeader(uResp.StatusCode)

	if r.Method != http.MethodHead {
		buf := make([]byte, 32*1024) // 32KB 流式小缓冲，边读边发杜绝延迟
		_, _ = io.CopyBuffer(w, uResp.Body, buf)
	}
}

// handleResolve 现有 JSON 解析诊断接口 (兼容历史调用)
func (s *Server) handleResolve(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	code := r.URL.Query().Get("code")
	if code == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(source.StreamResult{
			Success: false,
			Error:   "Missing query parameter 'code'",
		})
		return
	}

	tStart := time.Now()
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	ctx, cancel := context.WithTimeout(r.Context(), s.cfg.Timeout)
	defer cancel()

	bestResult, err := s.manager.ResolveWeighted(ctx, cleanCode, s.cfg.WaitWindow)
	elapsed := time.Since(tStart).Milliseconds()

	if err == nil && bestResult != nil {
		bestResult.ElapsedMs = elapsed
		log.Printf("[Success] %s -> %s (%s) [加密: %s, KeyHex: %s] 耗时: %dms",
			cleanCode, bestResult.Source, bestResult.URL, bestResult.KeyMethod, bestResult.KeyHex, elapsed)
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(bestResult)
		return
	}

	log.Printf("[Failed] %s 暂无可用片源 耗时: %dms", cleanCode, elapsed)
	w.WriteHeader(http.StatusNotFound)
	_ = json.NewEncoder(w).Encode(source.StreamResult{
		Success:   false,
		Code:      cleanCode,
		ElapsedMs: elapsed,
		Error:     "所有外部源均未能解析到有效流",
	})
}
