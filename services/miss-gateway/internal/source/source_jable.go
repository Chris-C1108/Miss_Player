package source

import (
	"context"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

type SourceJable struct{}

func NewSourceJable() *SourceJable {
	return &SourceJable{}
}

func (s *SourceJable) Name() string {
	return "Jable"
}

func (s *SourceJable) Weight() int {
	return 50 // AES-128 加密备选
}

func (s *SourceJable) Delay() time.Duration {
	return 400 * time.Millisecond // 错峰延后 400ms 给明文源优先窗口
}

func (s *SourceJable) Resolve(ctx context.Context, client *http.Client, code string) (*StreamResult, error) {
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
			enrichHlsEncryptionMetadata(ctx, client, res.URL, res.Referer, res)
			return res, nil
		}
	}

	return nil, fmt.Errorf("jable未检索到流")
}

// enrichHlsEncryptionMetadata 嗅探并解析 M3U8 中的 AES-128 密钥元数据
func enrichHlsEncryptionMetadata(ctx context.Context, client *http.Client, m3u8URL, referer string, res *StreamResult) {
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
	keyRe := regexp.MustCompile(`#EXT-X-KEY:METHOD=([A-Z0-9\-]+)(?:,URI="([^"]+)")?(?:,IV=([0-9a-fA-FxX]+))?`)
	matches := keyRe.FindStringSubmatch(content)
	if len(matches) > 1 {
		res.KeyMethod = matches[1]
		if len(matches) > 2 && matches[2] != "" {
			rawURI := matches[2]
			if strings.HasPrefix(rawURI, "http") {
				res.KeyURL = rawURI
			} else {
				base, _ := url.Parse(m3u8URL)
				rel, _ := url.Parse(rawURI)
				if base != nil && rel != nil {
					res.KeyURL = base.ResolveReference(rel).String()
				}
			}

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
