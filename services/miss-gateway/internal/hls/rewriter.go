package hls

import (
	"bufio"
	"bytes"
	"fmt"
	"net/url"
	"path"
	"regexp"
	"strings"
)

// RewrittenPlaylist 包含改写后的 M3U8 文本及所有子资源上游映射表
type RewrittenPlaylist struct {
	IsMaster  bool
	Rewritten []byte
	Sublists  []string // index -> 绝对上游子清单 URL
	Segments  []string // index -> 绝对上游分片 URL
	Keys      []string // index -> 绝对上游 Key URL
	Maps      []string // index -> 绝对上游 Map URL
}

var (
	reStreamInf = regexp.MustCompile(`^#EXT-X-STREAM-INF:`)
	reMediaTag  = regexp.MustCompile(`^#EXT-X-MEDIA:`)
	reKeyTag    = regexp.MustCompile(`^#EXT-X-KEY:`)
	reMapTag    = regexp.MustCompile(`^#EXT-X-MAP:`)
	reInfTag    = regexp.MustCompile(`^#EXTINF:`)

	reURIAttribute = regexp.MustCompile(`URI="([^"]+)"`)
)

// ResolveURI 解析相对于基础 URL 的绝对地址
func ResolveURI(baseURL *url.URL, refStr string) string {
	refStr = strings.TrimSpace(refStr)
	if strings.HasPrefix(refStr, "http://") || strings.HasPrefix(refStr, "https://") {
		return refStr
	}
	if baseURL == nil {
		return refStr
	}
	ref, err := url.Parse(refStr)
	if err != nil {
		return refStr
	}
	return baseURL.ResolveReference(ref).String()
}

// RewriteOptions 改写参数
type RewriteOptions struct {
	Token    string
	Code     string
	SourceID string
	Variant  string // 媒体清单所属变体，主清单下改写子清单时忽略
}

// RewriteM3U8 改写 M3U8 清单内容为完全同源的网关绝对路径
func RewriteM3U8(raw []byte, baseUpstreamURL string, opts RewriteOptions) (*RewrittenPlaylist, error) {
	// 去除 UTF-8 BOM
	raw = bytes.TrimPrefix(raw, []byte("\xef\xbb\xbf"))
	text := string(raw)
	if !strings.HasPrefix(strings.TrimSpace(text), "#EXTM3U") {
		return nil, fmt.Errorf("invalid m3u8: missing #EXTM3U header")
	}

	baseURL, _ := url.Parse(baseUpstreamURL)
	var isMaster bool

	// 快速探测是否为主清单 (包含子清单流描述)
	if strings.Contains(text, "#EXT-X-STREAM-INF") {
		isMaster = true
	}

	result := &RewrittenPlaylist{
		IsMaster: isMaster,
	}

	variantID := opts.Variant
	if variantID == "" {
		variantID = "0"
	}

	var out strings.Builder
	scanner := bufio.NewScanner(strings.NewReader(text))
	var nextIsStreamURI bool
	var nextIsSegmentURI bool

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		if trimmed == "" {
			out.WriteString(line + "\n")
			continue
		}

		// 1. 处理 #EXT-X-STREAM-INF 下一行的子清单 URI
		if nextIsStreamURI {
			nextIsStreamURI = false
			if !strings.HasPrefix(trimmed, "#") {
				absURL := ResolveURI(baseURL, trimmed)
				idx := len(result.Sublists)
				result.Sublists = append(result.Sublists, absURL)

				// 改写为同源子清单路径: /v1/{token}/pl/{code}/{src}/{i}.m3u8
				rewrittenURI := fmt.Sprintf("/v1/%s/pl/%s/%s/%d.m3u8",
					opts.Token, opts.Code, opts.SourceID, idx)
				out.WriteString(rewrittenURI + "\n")
				continue
			}
		}

		// 2. 处理 #EXTINF 下一行的分片 URI
		if nextIsSegmentURI {
			nextIsSegmentURI = false
			if !strings.HasPrefix(trimmed, "#") {
				absURL := ResolveURI(baseURL, trimmed)
				idx := len(result.Segments)
				result.Segments = append(result.Segments, absURL)

				// 提取原始文件扩展名 (.ts, .m4s, .mp4, .aac 等)
				ext := path.Ext(strings.Split(trimmed, "?")[0])
				if ext == "" {
					ext = ".ts"
				}
				ext = strings.TrimPrefix(ext, ".")

				// 改写为同源分片路径: /v1/{token}/seg/{code}/{src}/{var}/{n}.{ext}
				rewrittenURI := fmt.Sprintf("/v1/%s/seg/%s/%s/%s/%d.%s",
					opts.Token, opts.Code, opts.SourceID, variantID, idx, ext)
				out.WriteString(rewrittenURI + "\n")
				continue
			}
		}

		// 检查标志行
		if reStreamInf.MatchString(trimmed) {
			nextIsStreamURI = true
			out.WriteString(line + "\n")
			continue
		}

		if reInfTag.MatchString(trimmed) {
			nextIsSegmentURI = true
			out.WriteString(line + "\n")
			continue
		}

		// 3. 处理 #EXT-X-MEDIA 标签中的 URI 属性
		if reMediaTag.MatchString(trimmed) {
			if match := reURIAttribute.FindStringSubmatch(trimmed); len(match) > 1 {
				rawURI := match[1]
				absURL := ResolveURI(baseURL, rawURI)
				idx := len(result.Sublists)
				result.Sublists = append(result.Sublists, absURL)

				rewrittenURI := fmt.Sprintf("/v1/%s/pl/%s/%s/a%d.m3u8",
					opts.Token, opts.Code, opts.SourceID, idx)
				newLine := strings.Replace(line, `URI="`+rawURI+`"`, `URI="`+rewrittenURI+`"`, 1)
				out.WriteString(newLine + "\n")
				continue
			}
		}

		// 4. 处理 #EXT-X-KEY 标签 (AES-128 解密密钥)
		if reKeyTag.MatchString(trimmed) {
			if strings.Contains(trimmed, "METHOD=AES-128") {
				if match := reURIAttribute.FindStringSubmatch(trimmed); len(match) > 1 {
					rawURI := match[1]
					absURL := ResolveURI(baseURL, rawURI)
					idx := len(result.Keys)
					result.Keys = append(result.Keys, absURL)

					// 改写为网关同源密钥路由: /v1/{token}/key/{code}/{src}/{var}/{k}.key
					rewrittenKeyURI := fmt.Sprintf("/v1/%s/key/%s/%s/%s/%d.key",
						opts.Token, opts.Code, opts.SourceID, variantID, idx)
					newLine := strings.Replace(line, `URI="`+rawURI+`"`, `URI="`+rewrittenKeyURI+`"`, 1)
					out.WriteString(newLine + "\n")
					continue
				}
			}
		}

		// 5. 处理 #EXT-X-MAP 标签 (fMP4 初始化分段)
		if reMapTag.MatchString(trimmed) {
			if match := reURIAttribute.FindStringSubmatch(trimmed); len(match) > 1 {
				rawURI := match[1]
				absURL := ResolveURI(baseURL, rawURI)
				idx := len(result.Maps)
				result.Maps = append(result.Maps, absURL)

				rewrittenMapURI := fmt.Sprintf("/v1/%s/map/%s/%s/%s/%d.mp4",
					opts.Token, opts.Code, opts.SourceID, variantID, idx)
				newLine := strings.Replace(line, `URI="`+rawURI+`"`, `URI="`+rewrittenMapURI+`"`, 1)
				out.WriteString(newLine + "\n")
				continue
			}
		}

		// 其他未修改标签原样输出
		out.WriteString(line + "\n")
	}

	result.Rewritten = []byte(out.String())
	return result, nil
}
