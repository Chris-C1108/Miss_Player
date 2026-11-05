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
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

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

	re := regexp.MustCompile(`/(?:[a-z]{2}/)?work/(\d+)`)
	match := re.FindStringSubmatch(string(sBody))
	if len(match) < 2 {
		return nil, fmt.Errorf("javverse未找到作品ID")
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
