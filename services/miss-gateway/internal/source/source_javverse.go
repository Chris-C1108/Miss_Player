package source

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

type SourceJavVerse struct{}

func NewSourceJavVerse() *SourceJavVerse {
	return &SourceJavVerse{}
}

func (s *SourceJavVerse) Name() string {
	return "JAVVerse"
}

func (s *SourceJavVerse) Weight() int {
	return 90 // 纯明文/支持无码流出
}

func (s *SourceJavVerse) Delay() time.Duration {
	return 0 // 0ms 即时启动
}

func (s *SourceJavVerse) Resolve(ctx context.Context, client *http.Client, code string) (*StreamResult, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	origin := "https://javverse.com"
	ua := DefaultUserAgent

	// 1. 尝试从轻量检索提取 workId
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
		return nil, fmt.Errorf("javverse搜索受限")
	}

	sBody, _ := io.ReadAll(sResp.Body)
	sResp.Body.Close()

	workID := extractJavverseWorkID(string(sBody), cleanCode)
	if workID == "" {
		return nil, fmt.Errorf("javverse未找到匹配作品ID")
	}

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
		return nil, fmt.Errorf("javverse会话受阻")
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

		return &StreamResult{
			Success:   true,
			Code:      cleanCode,
			Source:    sourceName,
			URL:       streamURL,
			Referer:   origin + "/",
			Variant:   data.Variant,
			KeyMethod: "NONE", // JAVVerse 纯明文 MPEG-TS
		}, nil
	}

	return nil, fmt.Errorf("javverse未能获取有效播放地址")
}

// extractJavverseWorkID 从搜索结果中安全提取与目标番号强关联的 workId
func extractJavverseWorkID(html, code string) string {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	core, hasCore := ExtractCodeCore(code)

	// 1. 优先尝试直接在 <a> 标签内部匹配 (常见的包含缩略图与标题的卡片链接)
	reLink := regexp.MustCompile(`(?i)<a[^>]+href="[^"]*/(?:[a-z]{2}/)?work/(\d+)"[^>]*>([\s\S]*?)</a>`)
	for _, m := range reLink.FindAllStringSubmatch(html, -1) {
		if len(m) > 2 {
			workID := m[1]
			content := strings.ToUpper(m[2])
			if isContentMatching(content, cleanCode, core, hasCore) {
				return workID
			}
		}
	}

	// 2. 次选：在相邻块级容器内匹配 (如 <div class="card">...<a href="...work/123">...</a>...<span>CODE</span>...</div>)
	// 按卡片常用闭合边界分割，防止跨卡片污染
	reBlock := regexp.MustCompile(`(?i)<(?:div|article|li)[^>]*>([\s\S]*?)</(?:div|article|li)>`)
	reWork := regexp.MustCompile(`/(?:[a-z]{2}/)?work/(\d+)`)
	for _, block := range reBlock.FindAllString(html, -1) {
		if isContentMatching(strings.ToUpper(block), cleanCode, core, hasCore) {
			if m := reWork.FindStringSubmatch(block); len(m) > 1 {
				return m[1]
			}
		}
	}

	return ""
}

func isContentMatching(content, cleanCode string, core CodeCore, hasCore bool) bool {
	if strings.Contains(content, cleanCode) {
		return true
	}
	if hasCore {
		compact := core.Prefix + core.Number
		hyphen := core.Prefix + "-" + core.Number
		if strings.Contains(content, hyphen) || strings.Contains(content, compact) {
			return true
		}
	}
	return false
}
