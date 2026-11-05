package main

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"
)

type Result struct {
	Code         string
	ColdStartMs  int64
	HotStartMs   int64
	FirstSegMs   int64
	Success      bool
	Error        string
	ResolvedSrc  string
}

func main() {
	gatewayBase := "http://192.168.2.250:8765"
	if len(os.Args) > 1 {
		gatewayBase = strings.TrimRight(os.Args[1], "/")
	}

	goldenPath := "testdata/golden.txt"
	if len(os.Args) > 2 {
		goldenPath = os.Args[2]
	}

	file, err := os.Open(goldenPath)
	if err != nil {
		fmt.Printf("❌ 无法打开黄金测试集 %s: %v\n", goldenPath, err)
		os.Exit(1)
	}
	defer file.Close()

	var codes []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" && !strings.HasPrefix(line, "#") {
			codes = append(codes, line)
		}
	}

	fmt.Printf("🚀 开始执行 Phase 19.7 黄金集实机端到端验收 (共 %d 个番号, 目标网关: %s)\n", len(codes), gatewayBase)
	fmt.Printf("--------------------------------------------------------------------------------\n")

	client := &http.Client{Timeout: 10 * time.Second}
	var results []Result

	reSeg := regexp.MustCompile(`(/v1/[^/]+/seg/[^/]+/[^/]+/[^/]+/[0-9]+\.[a-z0-9]+)`)
	rePl := regexp.MustCompile(`(/v1/[^/]+/pl/[^/]+/[^/]+/[0-9]+\.m3u8)`)

	for i, code := range codes {
		fmt.Printf("[%02d/%02d] 测试番号: %-12s ... ", i+1, len(codes), code)
		res := Result{Code: code}

		// 1. 冷启动测试
		t0 := time.Now()
		playURL := fmt.Sprintf("%s/v1/dev/play/%s.m3u8", gatewayBase, code)
		pResp, err := client.Get(playURL)
		res.ColdStartMs = time.Since(t0).Milliseconds()

		if err != nil || pResp.StatusCode != 200 {
			if pResp != nil {
				res.Error = fmt.Sprintf("HTTP %d", pResp.StatusCode)
				pResp.Body.Close()
			} else {
				res.Error = err.Error()
			}
			fmt.Printf("❌ 寻源失败 (%s, 耗时: %dms)\n", res.Error, res.ColdStartMs)
			results = append(results, res)
			continue
		}

		pBytes, _ := io.ReadAll(pResp.Body)
		pResp.Body.Close()
		pText := string(pBytes)

		// 检查是否有子清单
		var segURL string
		if matchPl := rePl.FindStringSubmatch(pText); len(matchPl) > 1 {
			plURL := gatewayBase + matchPl[1]
			plResp, plErr := client.Get(plURL)
			if plErr == nil && plResp.StatusCode == 200 {
				plBytes, _ := io.ReadAll(plResp.Body)
				plResp.Body.Close()
				if m := reSeg.FindStringSubmatch(string(plBytes)); len(m) > 1 {
					segURL = gatewayBase + m[1]
				}
			} else if plResp != nil {
				plResp.Body.Close()
			}
		} else if matchSeg := reSeg.FindStringSubmatch(pText); len(matchSeg) > 1 {
			segURL = gatewayBase + matchSeg[1]
		}

		// 2. 切片流式拉取测试
		if segURL != "" {
			t1 := time.Now()
			sResp, sErr := client.Get(segURL)
			res.FirstSegMs = time.Since(t1).Milliseconds()

			if sErr == nil && sResp.StatusCode == 200 {
				buf := make([]byte, 1024)
				_, _ = sResp.Body.Read(buf) // 读取首字节
				sResp.Body.Close()
				res.Success = true
			} else {
				if sResp != nil {
					res.Error = fmt.Sprintf("切片 HTTP %d", sResp.StatusCode)
					sResp.Body.Close()
				} else {
					res.Error = sErr.Error()
				}
			}
		} else {
			res.Error = "清单无有效切片"
		}

		// 3. 热启动测试
		t2 := time.Now()
		hResp, hErr := client.Get(playURL)
		res.HotStartMs = time.Since(t2).Milliseconds()
		if hErr == nil && hResp.StatusCode == 200 {
			hResp.Body.Close()
		}

		if res.Success {
			fmt.Printf("✅ 成功! 冷启动: %4dms | 热启动: %3dms | 分片首包: %4dms\n",
				res.ColdStartMs, res.HotStartMs, res.FirstSegMs)
		} else {
			fmt.Printf("⚠️ 清单就绪但切片失败: %s\n", res.Error)
		}
		results = append(results, res)
	}

	fmt.Printf("--------------------------------------------------------------------------------\n")
	printSummary(results)
}

func printSummary(results []Result) {
	total := len(results)
	if total == 0 {
		return
	}

	successCount := 0
	var coldLatencies []int
	var hotLatencies []int
	var segLatencies []int

	for _, r := range results {
		if r.Success {
			successCount++
			coldLatencies = append(coldLatencies, int(r.ColdStartMs))
			hotLatencies = append(hotLatencies, int(r.HotStartMs))
			segLatencies = append(segLatencies, int(r.FirstSegMs))
		}
	}

	successRate := float64(successCount) / float64(total) * 100.0
	sort.Ints(coldLatencies)
	sort.Ints(hotLatencies)
	sort.Ints(segLatencies)

	p95Cold := percentile(coldLatencies, 0.95)
	p50Cold := percentile(coldLatencies, 0.50)
	p95Hot := percentile(hotLatencies, 0.95)
	p95Seg := percentile(segLatencies, 0.95)

	fmt.Printf("📊 验收测试统计汇总 (Acceptance Report):\n")
	fmt.Printf("  • 样本总数:           %d\n", total)
	fmt.Printf("  • 可播成功率:         %.1f%%  (目标: ≥ 90%%) -> %s\n", successRate, checkPass(successRate >= 90.0))
	fmt.Printf("  • 冷启动 P50 延迟:    %d ms\n", p50Cold)
	fmt.Printf("  • 冷启动 P95 延迟:    %d ms  (目标: ≤ 4000ms) -> %s\n", p95Cold, checkPass(p95Cold <= 4000))
	fmt.Printf("  • 热启动 P95 延迟:    %d ms  (目标: ≤ 300ms)  -> %s\n", p95Hot, checkPass(p95Hot <= 300))
	fmt.Printf("  • 分片首包 P95 延迟:  %d ms  (目标: ≤ 1500ms) -> %s\n", p95Seg, checkPass(p95Seg <= 1500))
}

func percentile(list []int, p float64) int {
	if len(list) == 0 {
		return 0
	}
	idx := int(float64(len(list)-1) * p)
	return list[idx]
}

func checkPass(pass bool) string {
	if pass {
		return "🟢 PASS (达标)"
	}
	return "🔴 FAIL (未达标)"
}
