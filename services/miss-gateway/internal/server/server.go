package server

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"miss-gateway/internal/cache"
	"miss-gateway/internal/hls"
	"miss-gateway/internal/registry"
	"miss-gateway/internal/source"
)

type Config struct {
	Port        string
	ProxyURL    string
	Version     string
	CatalogPath string
	WaitWindow  time.Duration
	Timeout     time.Duration
	Tokens      []string
	AdminToken  string
}

type Server struct {
	cfg          Config
	manager      *source.Manager
	registry     *registry.Registry
	catalog      *cache.Catalog
	singleflight *cache.Group
	mux          *http.ServeMux
	client       *http.Client
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
	if cfg.CatalogPath == "" {
		cfg.CatalogPath = "data/catalog.json"
	}

	s := &Server{
		cfg:          cfg,
		manager:      mgr,
		registry:     registry.NewRegistry(2 * time.Hour),
		catalog:      cache.NewCatalog(cfg.CatalogPath),
		singleflight: cache.NewGroup(),
		mux:          http.NewServeMux(),
		client:       mgr.Client(),
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

	// Phase 19 管理面与监控度量路由
	s.mux.HandleFunc("GET /metrics", s.handleMetrics)
	s.mux.HandleFunc("GET /v1/admin/sources", s.handleAdminSources)
	s.mux.HandleFunc("GET /v1/admin/status/{code}", s.handleAdminStatus)
	s.mux.HandleFunc("POST /v1/admin/purge/{code}", s.handleAdminPurge)

	// 根路径兼容回退
	s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("code") != "" {
			s.handleResolve(w, r)
		} else {
			s.handleHealth(w, r)
		}
	})
}

// validateAdminToken 校验管理接口 Bearer Token
func (s *Server) validateAdminToken(r *http.Request) bool {
	if s.cfg.AdminToken == "" {
		return true // 未配置管理密钥时放行 (开发模式)
	}

	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if subtle.ConstantTimeCompare([]byte(token), []byte(s.cfg.AdminToken)) == 1 {
			return true
		}
	}

	// 备选支持 query ?token=
	queryToken := r.URL.Query().Get("token")
	if queryToken != "" && subtle.ConstantTimeCompare([]byte(queryToken), []byte(s.cfg.AdminToken)) == 1 {
		return true
	}

	return false
}

// handleMetrics 导出标准 Prometheus 纯文本格式监控度量
func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")

	snapshots := s.manager.Tracker().Snapshot()
	var b strings.Builder

	b.WriteString("# HELP gateway_source_requests_total Total upstream requests by source and status\n")
	b.WriteString("# TYPE gateway_source_requests_total counter\n")
	for _, st := range snapshots {
		b.WriteString(fmt.Sprintf("gateway_source_requests_total{source=\"%s\",status=\"success\"} %d\n", st.Name, st.SuccessRequests))
		b.WriteString(fmt.Sprintf("gateway_source_requests_total{source=\"%s\",status=\"fail\"} %d\n", st.Name, st.FailRequests))
	}

	b.WriteString("\n# HELP gateway_source_latency_milliseconds Exponentially weighted latency in milliseconds\n")
	b.WriteString("# TYPE gateway_source_latency_milliseconds gauge\n")
	for _, st := range snapshots {
		b.WriteString(fmt.Sprintf("gateway_source_latency_milliseconds{source=\"%s\"} %.2f\n", st.Name, st.EwmaLatencyMs))
	}

	b.WriteString("\n# HELP gateway_source_circuit_state Current circuit state (0=closed, 1=open, 2=half-open)\n")
	b.WriteString("# TYPE gateway_source_circuit_state gauge\n")
	for _, st := range snapshots {
		stateVal := 0
		switch st.CircuitState {
		case "open":
			stateVal = 1
		case "half-open":
			stateVal = 2
		}
		b.WriteString(fmt.Sprintf("gateway_source_circuit_state{source=\"%s\"} %d\n", st.Name, stateVal))
	}

	_, _ = w.Write([]byte(b.String()))
}

// handleAdminSources 管理接口：查看全部片源健康指标与熔断状态
func (s *Server) handleAdminSources(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	if !s.validateAdminToken(r) {
		http.Error(w, "Unauthorized: invalid admin token", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	snapshots := s.manager.Tracker().Snapshot()
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"sources": snapshots,
	})
}

// handleAdminStatus 管理接口：查看指定番号的当前缓存会话
func (s *Server) handleAdminStatus(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	if !s.validateAdminToken(r) {
		http.Error(w, "Unauthorized: invalid admin token", http.StatusUnauthorized)
		return
	}

	code := strings.ToUpper(r.PathValue("code"))
	session, exists := s.registry.Get(code)
	catEntry, hasCatalog := s.catalog.Get(code)
	isNegative := s.catalog.IsNegative(code)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"code":       code,
		"cached":     exists,
		"isNegative": isNegative,
		"catalog":    hasCatalog,
		"entry":      catEntry,
		"session":    session,
	})
}

// handleAdminPurge 管理接口：清空指定番号的缓存与负缓存，强制触发重新寻源
func (s *Server) handleAdminPurge(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	if !s.validateAdminToken(r) {
		http.Error(w, "Unauthorized: invalid admin token", http.StatusUnauthorized)
		return
	}

	code := strings.ToUpper(r.PathValue("code"))
	// 标记过期以清空注册表
	s.registry.Set(&registry.StreamSession{
		Code:      code,
		ExpiresAt: time.Now().Add(-1 * time.Hour),
	})
	s.registry.CleanExpired()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"code":    code,
		"message": "Purged successfully",
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

	// 1. 检查负缓存，如果在冷却期内直接 404
	if s.catalog.IsNegative(cleanCode) {
		http.Error(w, "Stream not found (negative cache cooling)", http.StatusNotFound)
		return
	}

	// 2. 检查注册表已就绪缓存
	session, exists := s.registry.Get(cleanCode)
	if exists && session != nil {
		if v, ok := session.Variants["0"]; ok && len(v.RewrittenM3U8) > 0 {
			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
			w.Header().Set("Cache-Control", "no-store")
			if r.Method != http.MethodHead {
				_, _ = w.Write(v.RewrittenM3U8)
			}
			return
		}
	}

	// 3. 缓存未命中，使用 Singleflight 合并并发寻源请求
	val, err := s.singleflight.Do("play:"+cleanCode, func() (interface{}, error) {
		ctx, cancel := context.WithTimeout(context.Background(), s.cfg.Timeout)
		defer cancel()

		res, err := s.manager.ResolveWeighted(ctx, cleanCode, s.cfg.WaitWindow)
		if err != nil || res == nil || res.URL == "" {
			s.catalog.MarkNegative(cleanCode, 30*time.Minute)
			return nil, fmt.Errorf("stream not found")
		}

		// 拉取上游原始 M3U8 清单
		mReq, err := http.NewRequestWithContext(ctx, "GET", res.URL, nil)
		if err != nil {
			return nil, err
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
			return nil, fmt.Errorf("upstream m3u8 fetch failed")
		}

		mBytes, err := io.ReadAll(mResp.Body)
		mResp.Body.Close()
		if err != nil {
			return nil, err
		}

		sourceSlug := strings.ToLower(strings.Split(res.Source, " ")[0])
		rewritten, err := hls.RewriteM3U8(mBytes, res.URL, hls.RewriteOptions{
			Token:    token,
			Code:     cleanCode,
			SourceID: sourceSlug,
			Variant:  "0",
		})
		if err != nil {
			return nil, err
		}

		// 存入注册表
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

		// 记录至持久化 Catalog
		s.catalog.Set(cache.CatalogEntry{
			Code:     cleanCode,
			SourceID: sourceSlug,
			PageURL:  res.Referer,
		})
		go func() { _ = s.catalog.Save() }()

		return rewritten.Rewritten, nil
	})

	if err != nil {
		log.Printf("[Play] %s 寻源失败: %v", cleanCode, err)
		http.Error(w, "Stream not found", http.StatusNotFound)
		return
	}

	rewrittenBytes := val.([]byte)
	w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
	w.Header().Set("Cache-Control", "no-store")
	if r.Method != http.MethodHead {
		_, _ = w.Write(rewrittenBytes)
	}
}

// refreshStreamSession 上游 403 过期自愈刷新
func (s *Server) refreshStreamSession(ctx context.Context, code string) (*registry.StreamSession, error) {
	val, err := s.singleflight.Do("refresh:"+code, func() (interface{}, error) {
		res, err := s.manager.ResolveWeighted(ctx, code, s.cfg.WaitWindow)
		if err != nil || res == nil || res.URL == "" {
			return nil, fmt.Errorf("re-resolve failed: %w", err)
		}

		mReq, err := http.NewRequestWithContext(ctx, "GET", res.URL, nil)
		if err != nil {
			return nil, err
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
			return nil, fmt.Errorf("re-fetch upstream playlist failed")
		}

		mBytes, err := io.ReadAll(mResp.Body)
		mResp.Body.Close()
		if err != nil {
			return nil, err
		}

		sourceSlug := strings.ToLower(strings.Split(res.Source, " ")[0])
		rewritten, err := hls.RewriteM3U8(mBytes, res.URL, hls.RewriteOptions{
			Token:    "refreshed",
			Code:     code,
			SourceID: sourceSlug,
			Variant:  "0",
		})
		if err != nil {
			return nil, err
		}

		newSession := &registry.StreamSession{
			Code:         code,
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
		log.Printf("✨ [Self-Healing] 成功自愈刷新番号 %s 的流列表 (分片数: %d)", code, len(rewritten.Segments))
		return newSession, nil
	})

	if err != nil {
		return nil, err
	}
	return val.(*registry.StreamSession), nil
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

	// 首次尝试代理拉取
	status := s.proxyUpstreamResource(w, r, upstreamURL, referer, "video/mp2t")

	// 若遭遇上游 403 或 410 (Token 过期)，启动弹性自愈刷新并重试一次
	if status == http.StatusForbidden || status == http.StatusGone {
		log.Printf("⚠️ [Segment 403] %s 上游 Token 过期，尝试现场自愈...", code)
		ctx, cancel := context.WithTimeout(r.Context(), s.cfg.Timeout)
		defer cancel()

		if _, rErr := s.refreshStreamSession(ctx, code); rErr == nil {
			if freshURL, freshRef, freshOk := s.registry.GetSegment(code, variant, idx); freshOk && freshURL != "" {
				s.proxyUpstreamResource(w, r, freshURL, freshRef, "video/mp2t")
			}
		}
	}
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

// proxyUpstreamResource 流式代理上游媒体资源，返回上游 HTTP 状态码
func (s *Server) proxyUpstreamResource(w http.ResponseWriter, r *http.Request, upstreamURL, referer, fallbackMime string) int {
	uReq, err := http.NewRequestWithContext(r.Context(), r.Method, upstreamURL, nil)
	if err != nil {
		http.Error(w, "Failed to create upstream request", http.StatusInternalServerError)
		return http.StatusInternalServerError
	}

	if referer != "" {
		uReq.Header.Set("Referer", referer)
	}
	uReq.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

	if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
		uReq.Header.Set("Range", rangeHeader)
	}
	if ifRangeHeader := r.Header.Get("If-Range"); ifRangeHeader != "" {
		uReq.Header.Set("If-Range", ifRangeHeader)
	}

	uResp, err := s.client.Do(uReq)
	if err != nil {
		http.Error(w, "Upstream request failed", http.StatusBadGateway)
		return http.StatusBadGateway
	}
	defer uResp.Body.Close()

	if uResp.StatusCode >= 400 {
		return uResp.StatusCode
	}

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
		buf := make([]byte, 32*1024)
		_, _ = io.CopyBuffer(w, uResp.Body, buf)
	}
	return uResp.StatusCode
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
