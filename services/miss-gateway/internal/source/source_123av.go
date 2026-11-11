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

type Source123Av struct{}

func NewSource123Av() *Source123Av {
	return &Source123Av{}
}

func (s *Source123Av) Name() string {
	return "123AV"
}

func (s *Source123Av) Weight() int {
	return 100 // 纯明文/免解密/支持无码流出
}

func (s *Source123Av) Delay() time.Duration {
	return 0 // 0ms 即时启动
}

func (s *Source123Av) Resolve(ctx context.Context, client *http.Client, code string) (*StreamResult, error) {
	cleanCode := strings.ToLower(strings.TrimSpace(code))
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

	// 通道 1: 直达详情页 (优先无码流出，其次普通版)
	variants := []struct {
		suffix  string
		variant string
	}{
		{"-uncensored-leaked", "无码流出"},
		{"", "普通版"},
	}

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
		if err == nil && resp.StatusCode == 200 {
			bodyBytes, bErr := io.ReadAll(resp.Body)
			resp.Body.Close()
			if bErr == nil {
				if res := extract123AvFromHTML(ctx, client, string(bodyBytes), code, v.variant); res != nil {
					return res, nil
				}
			}
		} else if resp != nil {
			resp.Body.Close()
		}
	}

	// 通道 2: 搜索页检索匹配兜底 (解决番号前后缀不规范问题，如带0或特殊符号)
	searchURL := fmt.Sprintf("https://123av.com/cn/search?keyword=%s", url.QueryEscape(cleanCode))
	sReq, err := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	if err == nil {
		sReq.Header.Set("User-Agent", ua)
		sReq.Header.Set("Referer", "https://123av.com/")
		sResp, sErr := client.Do(sReq)
		if sErr == nil && sResp.StatusCode == 200 {
			sBytes, _ := io.ReadAll(sResp.Body)
			sResp.Body.Close()
			sHTML := string(sBytes)

			reLink := regexp.MustCompile(`/cn/v/([a-zA-Z0-9_\-]+)`)
			links := reLink.FindAllStringSubmatch(sHTML, -1)
			seen := make(map[string]bool)

			var uncensoredCodes []string
			var normalCodes []string

			for _, lMatch := range links {
				if len(lMatch) > 1 {
					subCode := lMatch[1]
					if seen[subCode] {
						continue
					}
					seen[subCode] = true

					// 严格等价性核验：绝对拦截非目标番号 (如 wsp-160, nhdta-896 冒充 wsp-101)
					if !IsEquivalentCode(code, subCode) {
						continue
					}

					if strings.Contains(strings.ToLower(subCode), "uncensored") {
						uncensoredCodes = append(uncensoredCodes, subCode)
					} else {
						normalCodes = append(normalCodes, subCode)
					}
				}
			}

			// 优先尝试无码流出，其次普通版
			candidateCodes := append(uncensoredCodes, normalCodes...)
			for _, subCode := range candidateCodes {
				subURL := fmt.Sprintf("https://123av.com/cn/v/%s", subCode)
				subReq, _ := http.NewRequestWithContext(ctx, "GET", subURL, nil)
				subReq.Header.Set("User-Agent", ua)
				subReq.Header.Set("Referer", searchURL)
				subResp, subErr := client.Do(subReq)
				if subErr == nil && subResp.StatusCode == 200 {
					subBytes, _ := io.ReadAll(subResp.Body)
					subResp.Body.Close()
					variantName := "普通版"
					if strings.Contains(strings.ToLower(subCode), "uncensored") {
						variantName = "无码流出"
					}
					if res := extract123AvFromHTML(ctx, client, string(subBytes), code, variantName); res != nil {
						return res, nil
					}
				} else if subResp != nil {
					subResp.Body.Close()
				}
			}
		} else if sResp != nil {
			sResp.Body.Close()
		}
	}

	return nil, fmt.Errorf("123av未收录")
}

func extract123AvFromHTML(ctx context.Context, client *http.Client, bodyStr, code, variant string) *StreamResult {
	cleanBody := strings.ReplaceAll(bodyStr, `\`, "")
	re := regexp.MustCompile(`(https?)://([a-zA-Z0-9_\-\.:]+)/e/([a-zA-Z0-9_\-]+)`)
	match := re.FindStringSubmatch(cleanBody)
	if len(match) < 4 {
		return nil
	}

	scheme := match[1]
	domain := match[2]
	hashID := match[3]
	streamAPI := fmt.Sprintf("%s://%s/stream?id=%s", scheme, domain, hashID)
	embedReferer := fmt.Sprintf("%s://%s/e/%s", scheme, domain, hashID)
	ua := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

	apiReq, err := http.NewRequestWithContext(ctx, "GET", streamAPI, nil)
	if err != nil {
		return nil
	}
	apiReq.Header.Set("User-Agent", ua)
	apiReq.Header.Set("Referer", embedReferer)
	apiReq.Header.Set("Accept", "application/json")

	apiResp, err := client.Do(apiReq)
	if err != nil || apiResp.StatusCode >= 400 {
		if apiResp != nil {
			apiResp.Body.Close()
		}
		return nil
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
		return &StreamResult{
			Success:   true,
			Code:      strings.ToUpper(code),
			Source:    fmt.Sprintf("123AV (%s)", variant),
			URL:       mediaData.Media.Stream,
			Referer:   embedReferer,
			VTT:       mediaData.Media.VTT,
			Variant:   variant,
			KeyMethod: "NONE", // 纯明文无加密
		}
	}
	return nil
}
