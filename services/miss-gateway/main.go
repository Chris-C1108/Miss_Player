package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"miss-gateway/internal/migrator"
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
	// 检查是否运行 migrate 一次性迁移子命令
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		fs := flag.NewFlagSet("migrate", flag.ExitOnError)
		dir := fs.String("dir", "/media", "STRM 媒体文件所在目录")
		base := fs.String("base", "http://host.docker.internal:8765", "流网关播放基准地址")
		token := fs.String("token", "dev", "写入 STRM 的安全播放 Token")
		cat := fs.String("catalog", "data/catalog.json", "Catalog 持久化元数据路径")
		dry := fs.Bool("dry-run", false, "模拟执行，不落盘修改真实文件")
		_ = fs.Parse(os.Args[2:])

		log.Printf("🚀 启动 .strm 批量迁移工具: dir=%s, base=%s, token=%s, dry-run=%v", *dir, *base, *token, *dry)
		rep, err := migrator.RunMigrate(migrator.MigrateOptions{
			Dir:         *dir,
			BaseURL:     *base,
			Token:       *token,
			CatalogPath: *cat,
			DryRun:      *dry,
		})
		if err != nil {
			log.Fatalf("❌ 迁移失败: %v", err)
		}
		fmt.Printf("✅ 迁移执行完毕! 总计: %d, 已迁移: %d, 已跳过: %d, 失败: %d (耗时: %dms)\n",
			rep.Total, rep.Migrated, rep.Skipped, rep.Failed, rep.ElapsedMs)
		return
	}

	port := getEnv("PORT", "8765")
	proxyURL := getEnv("PROXY_URL", "http://192.168.2.250:7890")
	tokensRaw := getEnv("TOKENS", "")
	adminToken := getEnv("ADMIN_TOKEN", "")
	sourceOrderRaw := getEnv("SOURCE_ORDER", "")
	tokens := parseTokens(tokensRaw)

	// 1. 初始化 HTTP 传输管道（支持 Mihomo 代理分流）
	client := source.NewHTTPClient(proxyURL, 12*time.Second)

	// 2. 初始化 MissAV 抓取器 (支持 direct 或 flaresolverr)
	var missavFetcher source.PageFetcher = &source.DirectFetcher{}
	if getEnv("MISSAV_FETCHER", "") == "flaresolverr" {
		flaresolverrURL := getEnv("FLARESOLVERR_URL", "http://127.0.0.1:8191/v1")
		flaresolverrProxy := getEnv("FLARESOLVERR_PROXY", proxyURL)
		missavFetcher = source.NewFlareSolverrFetcher(flaresolverrURL, flaresolverrProxy)
		log.Printf("🛡️ MissAV 启用 FlareSolverr 自动过盾: %s (出网代理: %s)", flaresolverrURL, flaresolverrProxy)
	}
	missavDomains := parseTokens(getEnv("MISSAV_DOMAINS", "missav.ai,missav.ws"))
	missavSource := source.NewSourceMissAv(missavDomains, missavFetcher)

	// 3. 装配外部片源适配器 (123AV: 100, JAVVerse: 90, MissAV: 80, Jable: 50)
	manager := source.NewManager(
		client,
		source.NewSource123Av(),
		source.NewSourceJavVerse(),
		missavSource,
		source.NewSourceJable(),
	)

	// 用户自定义固定偏好覆盖
	if sourceOrderRaw != "" {
		order := parseTokens(sourceOrderRaw)
		manager.SetFixedOrder(order)
		log.Printf("⚙️ 启用用户指定固定片源优先级: %v", order)
	}

	// 4. 构建 HTTP 路由与服务 (刚性红线: 冷启动必须在 4.5 秒内返回，严禁超时导致播放器崩溃)
	timeoutDuration := 4500 * time.Millisecond
	if tStr := getEnv("TIMEOUT", ""); tStr != "" {
		if tVal, err := strconv.Atoi(tStr); err == nil && tVal > 0 {
			timeoutDuration = time.Duration(tVal) * time.Millisecond
		}
	}

	cfg := server.Config{
		Port:       port,
		ProxyURL:   proxyURL,
		Version:    "2.0.0",
		WaitWindow: 3200 * time.Millisecond, // 3.2s 加权竞速窗口
		Timeout:    timeoutDuration,         // 4.5s 刚性硬超时
		Tokens:     tokens,
		AdminToken: adminToken,
	}

	srv := server.NewServer(cfg, manager)

	if len(tokens) > 0 {
		log.Printf("🔒 已启用安全播放 Token 访问控制 (有效令牌数: %d)", len(tokens))
	} else {
		log.Printf("⚠️ 未配置安全播放 Token，处于开放模式")
	}

	if adminToken != "" {
		log.Printf("🔑 已启用管理面鉴权保护 (Admin Token 保护)")
	}

	log.Printf("🚀 Miss Player 流网关服务启动于 :%s (代理: %s)", port, proxyURL)
	if err := http.ListenAndServe(":"+port, srv.Routes()); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
