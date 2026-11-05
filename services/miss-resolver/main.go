package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
)

type StreamResult struct {
	Success   bool   `json:"success"`
	Code      string `json:"code"`
	Source    string `json:"source,omitempty"`
	URL       string `json:"url,omitempty"`
	Referer   string `json:"referer,omitempty"`
	VTT       string `json:"vtt,omitempty"`
	Variant   string `json:"variant,omitempty"`
	KeyMethod string `json:"keyMethod,omitempty"` // AES-128 或 NONE
	KeyURL    string `json:"keyUrl,omitempty"`    // 密钥绝对地址
	KeyHex    string `json:"keyHex,omitempty"`    // 16 字节解密密钥 HEX
	KeyIV     string `json:"keyIv,omitempty"`     // 初始化向量 IV
	ElapsedMs int64  `json:"elapsedMs"`
	Error     string `json:"error,omitempty"`
}

var (
	proxyURL = getEnv("PROXY_URL", "http://192.168.2.250:7890")
	port     = getEnv("PORT", "8765")
	client   *http.Client
)

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func initClient() {
	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 20,
		IdleConnTimeout:     90 * time.Second,
	}

	if proxyURL != "" {
		if pURL, err := url.Parse(proxyURL); err == nil {
			transport.Proxy = http.ProxyURL(pURL)
			log.Printf("[Init] 启用上游代理分流: %s", proxyURL)
		} else {
			log.Printf("[Init] 代理解析失败: %v", err)
		}
	}

	client = &http.Client{
		Transport: transport,
		Timeout:   12 * time.Second,
	}
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "miss-stream-resolver",
		"version": "1.1.0",
		"proxy":   proxyURL,
		"time":    time.Now().Format(time.RFC3339),
	})
}

// 辅助函数：嗅探并解析 M3U8 中的 AES-128 密钥元数据
func enrichHlsEncryptionMetadata(ctx context.Context, m3u8URL, referer string, res *StreamResult) {
	req, err := http.NewRequestWithContext(ctx, "GET", m3u8URL, nil)
	if err != nil {
		return
	}
	if referer != "" {
		req.Header.Set("Referer", referer)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode >= 400 {
		if resp != nil {
			resp.Body.Close()
		}
		return
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return
	}

	content := string(bodyBytes)
	// 检查 #EXT-X-KEY 标签
	keyRe := regexp.MustCompile(`#EXT-X-KEY:METHOD=([A-Z0-9\-]+)(?:,URI="([^"]+)")?(?:,IV=([0-9a-fA-FxX]+))?`)
	matches := keyRe.FindStringSubmatch(content)
	if len(matches) > 1 {
		res.KeyMethod = matches[1]
		if len(matches) > 2 && matches[2] != "" {
			rawURI := matches[2]
			// 解析为绝对地址
			if strings.HasPrefix(rawURI, "http") {
				res.KeyURL = rawURI
			} else {
				base, _ := url.Parse(m3u8URL)
				rel, _ := url.Parse(rawURI)
				if base != nil && rel != nil {
					res.KeyURL = base.ResolveReference(rel).String()
				}
			}

			// 服务端预拉取 16 字节密钥并输出 HEX
			if res.KeyURL != "" {
				kReq, _ := http.NewRequestWithContext(ctx, "GET", res.KeyURL, nil)
				if referer != "" {
					kReq.Header.Set("Referer", referer)
				}
				kResp, kErr := client.Do(kReq)
				if kErr == nil && kResp.StatusCode == 200 {
					kBytes, _ := io.ReadAll(kResp.Body)
					kResp.Body.Close()
					if len(kBytes) == 16 {
						res.KeyHex = hex.EncodeToString(kBytes)
					}
				}
			}
		}
		if len(matches) > 3 {
			res.KeyIV = matches[3]
		}
	} else {
		res.KeyMethod = "NONE"
	}
}

// 123AV 源解析器 (免盾高稳定，包含高清与无码泄露版)
func resolve123Av(ctx context.Context, code string) (*StreamResult, error) {
	cleanCode := strings.ToLower(strings.TrimSpace(code))
	variants := []struct {
		suffix  string
		variant string
	}{
		{"-uncensored-leaked", "无码流出"},
		{"", "普通版"},
	}

	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

	for _, v := range variants {
		targetCode := cleanCode + v.suffix
		detailURL := fmt.Sprintf("https://123av.com/cn/v/%s", targetCode)

		req, err := http.NewRequestWithContext(ctx, "GET", detailURL, nil)
		if err != nil {
			continue
		}
		req.Header.Set("User-Agent", ua)
		req.Header.Set("Referer", "https://123av.com/")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode >= 400 {
			if resp != nil {
				resp.Body.Close()
			}
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		bodyStr := string(bodyBytes)
		re := regexp.MustCompile(`https://([a-zA-Z0-9_\-\.]+)/e/([a-zA-Z0-9_\-]+)`)
		match := re.FindStringSubmatch(bodyStr)
		if len(match) < 3 {
			continue
		}

		domain := match[1]
		hashID := match[2]
		streamAPI := fmt.Sprintf("https://%s/stream?id=%s", domain, hashID)
		embedReferer := fmt.Sprintf("https://%s/e/%s", domain, hashID)

		apiReq, err := http.NewRequestWithContext(ctx, "GET", streamAPI, nil)
		if err != nil {
			continue
		}
		apiReq.Header.Set("User-Agent", ua)
		apiReq.Header.Set("Referer", embedReferer)
		apiReq.Header.Set("Accept", "application/json")

		apiResp, err := client.Do(apiReq)
		if err != nil || apiResp.StatusCode >= 400 {
			if apiResp != nil {
				apiResp.Body.Close()
			}
			continue
		}

		apiBytes, _ := io.ReadAll(apiResp.Body)
		apiResp.Body.Close()

		var mediaData struct {
			Status string `json:"status"`
			Media  struct {
				Stream string `json:"stream"`
				VTT    string `json:"vtt"`
			} `json:"media"`
		}

		if err := json.Unmarshal(apiBytes, &mediaData); err == nil && mediaData.Media.Stream != "" {
			res := &StreamResult{
				Success:   true,
				Code:      strings.ToUpper(code),
				Source:    fmt.Sprintf("123AV (%s)", v.variant),
				URL:       mediaData.Media.Stream,
				Referer:   embedReferer,
				VTT:       mediaData.Media.VTT,
				Variant:   v.variant,
				KeyMethod: "NONE", // 123AV 纯明文无加密
			}
			return res, nil
		}
	}

	return nil, fmt.Errorf("123av未收录")
}

// Jable 源解析器 (带 AES-128 解密元数据嗅探)
func resolveJable(ctx context.Context, code string) (*StreamResult, error) {
	cleanCode := strings.ToLower(strings.TrimSpace(code))
	domains := []string{"https://fs1.app", "https://jable.tv"}
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

	for _, domain := range domains {
		directURL := fmt.Sprintf("%s/videos/%s/", domain, cleanCode)
		req, err := http.NewRequestWithContext(ctx, "GET", directURL, nil)
		if err != nil {
			continue
		}
		req.Header.Set("User-Agent", ua)
		req.Header.Set("Referer", domain+"/")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode >= 400 {
			if resp != nil {
				resp.Body.Close()
			}
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		re := regexp.MustCompile(`hlsUrl\s*=\s*['"](https?://[^'"]+\.m3u8[^'"]*)['"]`)
		match := re.FindStringSubmatch(string(bodyBytes))
		if len(match) > 1 && match[1] != "" {
			res := &StreamResult{
				Success: true,
				Code:    strings.ToUpper(code),
				Source:  "Jable",
				URL:     match[1],
				Referer: domain + "/",
				Variant: "普通版",
			}
			// 嗅探并提取 AES-128 密钥元数据
			enrichHlsEncryptionMetadata(ctx, res.URL, res.Referer, res)
			return res, nil
		}
	}

	return nil, fmt.Errorf("jable未检索到流")
}

// JAVVerse 源解析器 (免盾会话接口)
func resolveJavVerse(ctx context.Context, code string) (*StreamResult, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	origin := "https://javverse.com"
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

	// 1. 尝试从检索提取 workId
	searchURL := fmt.Sprintf("%s/en/search?q=%s", origin, url.QueryEscape(cleanCode))
	sReq, err := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	if err != nil {
		return nil, err
	}
	sReq.Header.Set("User-Agent", ua)
	sReq.Header.Set("Referer", origin+"/")

	sResp, err := client.Do(sReq)
	if err != nil || sResp.StatusCode >= 400 {
		if sResp != nil {
			sResp.Body.Close()
		}
		return nil, fmt.Errorf("javverse搜索不可达")
	}

	sBody, _ := io.ReadAll(sResp.Body)
	sResp.Body.Close()

	re := regexp.MustCompile(`/(?:[a-z]{2}/)?work/(\d+)`)
	match := re.FindStringSubmatch(string(sBody))
	if len(match) < 2 {
		return nil, fmt.Errorf("javverse未找到对应作品ID")
	}

	workID := match[1]

	// 2. 伪造 Referer 与 Origin 请求免盾播放会话
	sessionURL := fmt.Sprintf("%s/api/video/sessions", origin)
	payload := fmt.Sprintf(`{"workId":%s,"code":"%s","variant":"uncensored-leak"}`, workID, cleanCode)

	sessReq, err := http.NewRequestWithContext(ctx, "POST", sessionURL, strings.NewReader(payload))
	if err != nil {
		return nil, err
	}
	sessReq.Header.Set("Content-Type", "application/json")
	sessReq.Header.Set("Origin", origin)
	sessReq.Header.Set("Referer", fmt.Sprintf("%s/work/%s", origin, workID))
	sessReq.Header.Set("User-Agent", ua)

	sessResp, err := client.Do(sessReq)
	if err != nil || sessResp.StatusCode >= 400 {
		if sessResp != nil {
			sessResp.Body.Close()
		}
		return nil, fmt.Errorf("javverse播放会话获取失败")
	}

	sessBody, _ := io.ReadAll(sessResp.Body)
	sessResp.Body.Close()

	var data struct {
		Success     bool   `json:"success"`
		PlaylistURL string `json:"playlistUrl"`
		Variant     string `json:"variant"`
	}

	if err := json.Unmarshal(sessBody, &data); err == nil && data.Success && data.PlaylistURL != "" {
		streamURL := data.PlaylistURL
		if !strings.HasPrefix(streamURL, "http") {
			streamURL = origin + streamURL
		}
		isUncensored := data.Variant == "uncensored-leak" || data.Variant == "reduced-mosaic"
		sourceName := "JAVVerse"
		if isUncensored {
			sourceName = "JAVVerse (无码流出)"
		}

		res := &StreamResult{
			Success:   true,
			Code:      cleanCode,
			Source:    sourceName,
			URL:       streamURL,
			Referer:   origin + "/",
			Variant:   data.Variant,
			KeyMethod: "NONE", // JAVVerse 纯明文 MPEG-TS
		}
		return res, nil
	}

	return nil, fmt.Errorf("javverse未能获取有效播放地址")
}

// 调度入口：多源并发竞速与瀑布流协同调度
func handleResolve(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	code := r.URL.Query().Get("code")
	if code == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(StreamResult{
			Success: false,
			Error:   "Missing query parameter 'code'",
		})
		return
	}

	tStart := time.Now()
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	type resolverFunc func(context.Context, string) (*StreamResult, error)
	resolvers := []struct {
		name string
		fn   resolverFunc
	}{
		{"123AV", resolve123Av},
		{"Jable", resolveJable},
		{"JAVVerse", resolveJavVerse},
	}

	resultChan := make(chan *StreamResult, len(resolvers))
	var wg sync.WaitGroup

	for _, res := range resolvers {
		wg.Add(1)
		go func(name string, fn resolverFunc) {
			defer wg.Done()
			if res, err := fn(ctx, cleanCode); err == nil && res != nil && res.URL != "" {
				select {
				case resultChan <- res:
				default:
				}
			}
		}(res.name, res.fn)
	}

	go func() {
		wg.Wait()
		close(resultChan)
	}()

	var finalResult *StreamResult
	for res := range resultChan {
		if res != nil && res.Success && res.URL != "" {
			finalResult = res
			cancel()
			break
		}
	}

	elapsed := time.Since(tStart).Milliseconds()

	if finalResult != nil {
		finalResult.ElapsedMs = elapsed
		log.Printf("[Success] %s -> %s (%s) [加密: %s, KeyHex: %s] 耗时: %dms",
			cleanCode, finalResult.Source, finalResult.URL, finalResult.KeyMethod, finalResult.KeyHex, elapsed)
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(finalResult)
		return
	}

	log.Printf("[Failed] %s 暂无可用片源 耗时: %dms", cleanCode, elapsed)
	w.WriteHeader(http.StatusNotFound)
	_ = json.NewEncoder(w).Encode(StreamResult{
		Success:   false,
		Code:      cleanCode,
		ElapsedMs: elapsed,
		Error:     "所有外部源均未能解析到有效流",
	})
}

func main() {
	initClient()

	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/api/resolve", handleResolve)

	log.Printf("🚀 Miss Player 外部流解析服务启动于 :%s (代理: %s)", port, proxyURL)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
