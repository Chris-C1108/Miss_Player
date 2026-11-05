package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"miss-gateway/internal/server"
	"miss-gateway/internal/source"
)

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func parseTokens(raw string) []string {
	var tokens []string
	if raw == "" {
		return tokens
	}
	for _, t := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(t); trimmed != "" {
			tokens = append(tokens, trimmed)
		}
	}
	return tokens
}

func main() {
	port := getEnv("PORT", "8765")
	proxyURL := getEnv("PROXY_URL", "http://192.168.2.250:7890")
	tokensRaw := getEnv("TOKENS", "")
	tokens := parseTokens(tokensRaw)

	// 1. 初始化 HTTP 传输管道（支持 Mihomo 代理分流）
	client := source.NewHTTPClient(proxyURL, 12*time.Second)

	// 2. 装配外部片源适配器 (123AV: 100, JAVVerse: 90, Jable: 50)
	manager := source.NewManager(
		client,
		source.NewSource123Av(),
		source.NewSourceJavVerse(),
		source.NewSourceJable(),
	)

	// 3. 构建 HTTP 路由与服务
	cfg := server.Config{
		Port:       port,
		ProxyURL:   proxyURL,
		Version:    "2.0.0",
		WaitWindow: 3500 * time.Millisecond,
		Timeout:    12 * time.Second,
		Tokens:     tokens,
	}

	srv := server.NewServer(cfg, manager)

	if len(tokens) > 0 {
		log.Printf("🔒 已启用安全 Token 访问控制 (有效令牌数: %d)", len(tokens))
	} else {
		log.Printf("⚠️ 未配置安全 Token，处于开放模式")
	}

	log.Printf("🚀 Miss Player 流网关服务启动于 :%s (代理: %s)", port, proxyURL)
	if err := http.ListenAndServe(":"+port, srv.Routes()); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
