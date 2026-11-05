package main

import (
	"log"
	"net/http"
	"os"
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

func main() {
	port := getEnv("PORT", "8765")
	proxyURL := getEnv("PROXY_URL", "http://192.168.2.250:7890")

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
	}

	srv := server.NewServer(cfg, manager)

	log.Printf("🚀 Miss Player 流网关服务启动于 :%s (代理: %s)", port, proxyURL)
	if err := http.ListenAndServe(":"+port, srv.Routes()); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
