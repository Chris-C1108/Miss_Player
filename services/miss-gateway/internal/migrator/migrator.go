package migrator

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"miss-gateway/internal/cache"
)

type MigrateOptions struct {
	Dir         string
	BaseURL     string
	Token       string
	CatalogPath string
	DryRun      bool
	ReportPath  string
}

type MigrateItem struct {
	File   string `json:"file"`
	Code   string `json:"code"`
	OldURL string `json:"oldUrl"`
	NewURL string `json:"newUrl"`
	Status string `json:"status"` // "migrated", "skipped", "failed"
	Error  string `json:"error,omitempty"`
}

type MigrateReport struct {
	StartTime  time.Time     `json:"startTime"`
	EndTime    time.Time     `json:"endTime"`
	ElapsedMs  int64         `json:"elapsedMs"`
	Total      int           `json:"total"`
	Migrated   int           `json:"migrated"`
	Skipped    int           `json:"skipped"`
	Failed     int           `json:"failed"`
	Items      []MigrateItem `json:"items"`
	DryRun     bool          `json:"dryRun"`
	BaseURL    string        `json:"baseUrl"`
	TargetDir  string        `json:"targetDir"`
}

var (
	reAvCodeComment = regexp.MustCompile(`(?i)^#\s*avcode\s*:\s*([a-zA-Z0-9_\-]+)`)
	reCodeFromExt   = regexp.MustCompile(`(?i)^([a-zA-Z0-9_\-]+)\.strm$`)
)

// ExtractCode 从 .strm 文件的注释或文件名提取番号
func ExtractCode(filename, content string) string {
	lines := strings.Split(content, "\n")
	for _, l := range lines {
		l = strings.TrimSpace(l)
		if m := reAvCodeComment.FindStringSubmatch(l); len(m) > 1 {
			return strings.ToUpper(m[1])
		}
	}

	base := filepath.Base(filename)
	if m := reCodeFromExt.FindStringSubmatch(base); len(m) > 1 {
		return strings.ToUpper(m[1])
	}
	return ""
}

// RunMigrate 执行 .strm 目录原子批量迁移
func RunMigrate(opts MigrateOptions) (*MigrateReport, error) {
	if opts.Dir == "" {
		return nil, fmt.Errorf("migrate: directory cannot be empty")
	}
	if opts.BaseURL == "" {
		return nil, fmt.Errorf("migrate: base URL cannot be empty")
	}

	opts.BaseURL = strings.TrimRight(opts.BaseURL, "/")
	tokenPart := opts.Token
	if tokenPart == "" {
		tokenPart = "dev"
	}

	var cat *cache.Catalog
	if opts.CatalogPath != "" {
		cat = cache.NewCatalog(opts.CatalogPath)
	}

	report := &MigrateReport{
		StartTime: time.Now(),
		DryRun:    opts.DryRun,
		BaseURL:   opts.BaseURL,
		TargetDir: opts.Dir,
	}

	files, err := os.ReadDir(opts.Dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	for _, fi := range files {
		if fi.IsDir() || !strings.HasSuffix(strings.ToLower(fi.Name()), ".strm") {
			continue
		}

		filePath := filepath.Join(opts.Dir, fi.Name())
		report.Total++

		data, err := os.ReadFile(filePath)
		if err != nil {
			report.Failed++
			report.Items = append(report.Items, MigrateItem{
				File:   fi.Name(),
				Status: "failed",
				Error:  err.Error(),
			})
			continue
		}

		content := string(data)
		lines := strings.Split(content, "\n")
		if len(lines) == 0 {
			report.Skipped++
			continue
		}

		firstLine := strings.TrimSpace(lines[0])
		code := ExtractCode(fi.Name(), content)
		if code == "" {
			report.Skipped++
			report.Items = append(report.Items, MigrateItem{
				File:   fi.Name(),
				Status: "skipped",
				Error:  "cannot detect avcode",
			})
			continue
		}

		newURL := fmt.Sprintf("%s/v1/%s/play/%s.m3u8", opts.BaseURL, tokenPart, code)

		// 如果已经是目标格式，跳过
		if firstLine == newURL {
			report.Skipped++
			report.Items = append(report.Items, MigrateItem{
				File:   fi.Name(),
				Code:   code,
				OldURL: firstLine,
				NewURL: newURL,
				Status: "skipped",
			})
			continue
		}

		// 构造新文本: 首行为 newURL，保留原 URL 进注释，保留已有元数据
		var newLines []string
		newLines = append(newLines, newURL)

		hasOriginUrl := false
		hasAvcodeComment := false

		for _, l := range lines[1:] {
			trimmed := strings.TrimSpace(l)
			if strings.HasPrefix(trimmed, "# origin_url:") {
				hasOriginUrl = true
			}
			if strings.HasPrefix(strings.ToLower(trimmed), "# avcode:") {
				hasAvcodeComment = true
			}
			if trimmed != "" {
				newLines = append(newLines, l)
			}
		}

		// 补充注释信息
		if !hasOriginUrl && firstLine != "" && !strings.HasPrefix(firstLine, "#") {
			newLines = append(newLines, fmt.Sprintf("# origin_url: %s", firstLine))
		}
		if !hasAvcodeComment {
			newLines = append(newLines, fmt.Sprintf("# avcode: %s", code))
		}
		newLines = append(newLines, fmt.Sprintf("# migrated_at: %s", time.Now().Format(time.RFC3339)))

		newContent := strings.Join(newLines, "\n") + "\n"

		if !opts.DryRun {
			// 原子写入: 先写 .tmp 文件再 rename
			tmpFile := filePath + ".tmp"
			if err := os.WriteFile(tmpFile, []byte(newContent), 0644); err != nil {
				report.Failed++
				report.Items = append(report.Items, MigrateItem{
					File:   fi.Name(),
					Code:   code,
					OldURL: firstLine,
					Status: "failed",
					Error:  err.Error(),
				})
				continue
			}

			if err := os.Rename(tmpFile, filePath); err != nil {
				report.Failed++
				report.Items = append(report.Items, MigrateItem{
					File:   fi.Name(),
					Code:   code,
					OldURL: firstLine,
					Status: "failed",
					Error:  err.Error(),
				})
				continue
			}
		}

		// 如果原 URL 是页面地址且配置了 catalog，写入 catalog 作为提示
		if cat != nil && firstLine != "" && (strings.Contains(firstLine, "missav") || strings.Contains(firstLine, "jable")) {
			cat.Set(cache.CatalogEntry{
				Code:     code,
				PageURL:  firstLine,
				SourceID: "hint",
			})
		}

		report.Migrated++
		report.Items = append(report.Items, MigrateItem{
			File:   fi.Name(),
			Code:   code,
			OldURL: firstLine,
			NewURL: newURL,
			Status: "migrated",
		})
	}

	if cat != nil && !opts.DryRun {
		_ = cat.Save()
	}

	report.EndTime = time.Now()
	report.ElapsedMs = report.EndTime.Sub(report.StartTime).Milliseconds()

	log.Printf("📊 [Migrate] 完成: 总计=%d, 已迁移=%d, 已跳过=%d, 失败=%d (耗时: %dms, DryRun: %v)",
		report.Total, report.Migrated, report.Skipped, report.Failed, report.ElapsedMs, report.DryRun)

	// 写出迁移报告
	reportPath := opts.ReportPath
	if reportPath == "" {
		reportPath = filepath.Join(opts.Dir, "migrate-report.json")
	}
	if !opts.DryRun {
		if rData, err := json.MarshalIndent(report, "", "  "); err == nil {
			_ = os.WriteFile(reportPath, rData, 0644)
		}
	}

	return report, nil
}
