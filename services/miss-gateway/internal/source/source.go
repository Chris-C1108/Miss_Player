package source

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"time"
)

// StreamResult 兼容现有解析接口协议的数据结构
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

// Source 外部片源适配器接口
type Source interface {
	Name() string
	Weight() int
	Delay() time.Duration
	Resolve(ctx context.Context, client *http.Client, code string) (*StreamResult, error)
}

// NewHTTPClient 创建统一配置的 HTTP 客户端（支持可选分流代理）
func NewHTTPClient(proxyURL string, timeout time.Duration) *http.Client {
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

	return &http.Client{
		Transport: transport,
		Timeout:   timeout,
	}
}
