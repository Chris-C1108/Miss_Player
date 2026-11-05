package source

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var ErrChallenged = errors.New("missav: cloudflare challenge detected")

type PageFetcher interface {
	Fetch(ctx context.Context, client *http.Client, urlStr, referer string) (int, string, error)
}

// DirectFetcher 默认直连抓取器
type DirectFetcher struct{}

func (d *DirectFetcher) Fetch(ctx context.Context, client *http.Client, urlStr, referer string) (int, string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", urlStr, nil)
	if err != nil {
		return 0, "", err
	}

	if referer != "" {
		req.Header.Set("Referer", referer)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, "", err
	}

	return resp.StatusCode, string(bodyBytes), nil
}

// FlareSolverrFetcher 基于 FlareSolverr API 协议的过盾抓取器
type FlareSolverrFetcher struct {
	apiURL string
}

func NewFlareSolverrFetcher(apiURL string) *FlareSolverrFetcher {
	return &FlareSolverrFetcher{
		apiURL: strings.TrimRight(apiURL, "/"),
	}
}

func (f *FlareSolverrFetcher) Fetch(ctx context.Context, client *http.Client, urlStr, referer string) (int, string, error) {
	endpoint := f.apiURL
	if !strings.HasSuffix(endpoint, "/v1") {
		endpoint += "/v1"
	}

	payload := map[string]interface{}{
		"cmd":        "request.get",
		"url":        urlStr,
		"maxTimeout": 30000,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return 0, "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(data))
	if err != nil {
		return 0, "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	var result struct {
		Status   string `json:"status"`
		Solution struct {
			URL      string `json:"url"`
			Status   int    `json:"status"`
			Response string `json:"response"`
		} `json:"solution"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return resp.StatusCode, "", err
	}

	if result.Status == "ok" {
		return result.Solution.Status, result.Solution.Response, nil
	}

	return 500, "", fmt.Errorf("flaresolverr error: %s", result.Status)
}

// SourceMissAv MissAV 外部片源适配器
type SourceMissAv struct {
	domains []string
	fetcher PageFetcher
}

func NewSourceMissAv(domains []string, fetcher PageFetcher) *SourceMissAv {
	if len(domains) == 0 {
		domains = []string{"https://missav.ai", "https://missav.ws"}
	}
	if fetcher == nil {
		fetcher = &DirectFetcher{}
	}
	return &SourceMissAv{
		domains: domains,
		fetcher: fetcher,
	}
}

func (s *SourceMissAv) Name() string {
	return "MissAV"
}

func (s *SourceMissAv) Weight() int {
	return 80 // 收录面广，作为第三顺位有力补充
}

func (s *SourceMissAv) Delay() time.Duration {
	return 300 * time.Millisecond // 错峰延后 300ms 避免拖慢 123AV / JAVVerse
}

func (s *SourceMissAv) Resolve(ctx context.Context, client *http.Client, code string) (*StreamResult, error) {
	cleanCode := strings.ToLower(strings.TrimSpace(code))

	for _, domain := range s.domains {
		if !strings.HasPrefix(domain, "http") {
			domain = "https://" + domain
		}
		domain = strings.TrimRight(domain, "/")

		// 候选路径：/cn/{code}、/{code}
		paths := []string{
			fmt.Sprintf("%s/cn/%s", domain, cleanCode),
			fmt.Sprintf("%s/%s", domain, cleanCode),
		}

		for _, pageURL := range paths {
			status, body, err := s.fetcher.Fetch(ctx, client, pageURL, domain+"/")
			if err != nil {
				continue
			}

			// 1. 识别 Cloudflare 验证盾牌
			if status == http.StatusForbidden || status == http.StatusServiceUnavailable {
				if strings.Contains(body, "Just a moment") || strings.Contains(body, "cf-chl") || strings.Contains(body, "Attention Required") {
					return nil, ErrChallenged
				}
			}

			if status >= 200 && status < 400 && body != "" {
				if streamURL := extractMissavPlaylist(body); streamURL != "" {
					return &StreamResult{
						Success:   true,
						Code:      strings.ToUpper(code),
						Source:    "MissAV",
						URL:       streamURL,
						Referer:   domain + "/",
						Variant:   "普通版",
						KeyMethod: "NONE", // surrit.com HLS 纯明文无 AES-128
					}, nil
				}
			}
		}

		// 搜索兜底检索
		searchURL := fmt.Sprintf("%s/search/%s", domain, url.QueryEscape(cleanCode))
		status, body, err := s.fetcher.Fetch(ctx, client, searchURL, domain+"/")
		if err == nil && status == 200 && body != "" {
			reDetail := regexp.MustCompile(fmt.Sprintf(`href="((?:https?://[^"/]+)?/(?:cn/)?(?:[^"/]*%s[^"/]*))"`, cleanCode))
			if match := reDetail.FindStringSubmatch(body); len(match) > 1 {
				detailPath := match[1]
				detailURL := detailPath
				if !strings.HasPrefix(detailURL, "http") {
					detailURL = domain + detailPath
				}

				dStatus, dBody, dErr := s.fetcher.Fetch(ctx, client, detailURL, searchURL)
				if dErr == nil && dStatus == 200 && dBody != "" {
					if streamURL := extractMissavPlaylist(dBody); streamURL != "" {
						return &StreamResult{
							Success:   true,
							Code:      strings.ToUpper(code),
							Source:    "MissAV",
							URL:       streamURL,
							Referer:   domain + "/",
							Variant:   "普通版",
							KeyMethod: "NONE",
						}, nil
					}
				}
			}
		}
	}

	return nil, fmt.Errorf("missav未检索到流")
}

var (
	reSurritDirect = regexp.MustCompile(`(https?://(?:[a-zA-Z0-9_\-\.]+\.)?surrit\.com/[a-f0-9\-]+/playlist\.m3u8)`)
	reM3u8Direct   = regexp.MustCompile(`(https?://[^'"]+playlist\.m3u8[^'"]*)`)
	reUrlsArray    = regexp.MustCompile(`urls\s*:\s*\[['"](https?://[^'"]+\.m3u8[^'"]*)['"]\]`)
	reUuidPattern  = regexp.MustCompile(`['"]([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})['"]`)
)

// extractMissavPlaylist 从 HTML 或解包混淆脚本中提取 m3u8 地址
func extractMissavPlaylist(html string) string {
	// 1. 直达正则匹配
	if m := reSurritDirect.FindStringSubmatch(html); len(m) > 1 {
		return m[1]
	}
	if m := reUrlsArray.FindStringSubmatch(html); len(m) > 1 {
		return m[1]
	}
	if m := reM3u8Direct.FindStringSubmatch(html); len(m) > 1 {
		return m[1]
	}

	// 2. 解包混淆 JavaScript (Dean Edwards P.A.C.K.E.R.)
	unpacked := UnpackJavaScript(html)
	if m := reSurritDirect.FindStringSubmatch(unpacked); len(m) > 1 {
		return m[1]
	}
	if m := reUrlsArray.FindStringSubmatch(unpacked); len(m) > 1 {
		return m[1]
	}
	if m := reM3u8Direct.FindStringSubmatch(unpacked); len(m) > 1 {
		return m[1]
	}

	// 3. 从解包后的 UUID 构造 surrit 标准流地址
	if m := reUuidPattern.FindStringSubmatch(unpacked); len(m) > 1 {
		uuid := m[1]
		return fmt.Sprintf("https://surrit.com/%s/playlist.m3u8", uuid)
	}

	return ""
}
