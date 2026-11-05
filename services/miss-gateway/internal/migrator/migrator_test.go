package migrator

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"miss-gateway/internal/cache"
)

func TestMigrateDryRunAndRealRun(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "strm-migrator-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// 创建模拟 .strm 文件
	file1 := filepath.Join(tmpDir, "STARS-256.strm")
	content1 := "https://missav.ai/dm31/STARS-256\n# title: Test Video 1\n"
	if err := os.WriteFile(file1, []byte(content1), 0644); err != nil {
		t.Fatalf("failed to write file1: %v", err)
	}

	file2 := filepath.Join(tmpDir, "SSIS-001.strm")
	content2 := "http://127.0.0.1/placeholder.mp4\n# avcode: SSIS-001\n"
	if err := os.WriteFile(file2, []byte(content2), 0644); err != nil {
		t.Fatalf("failed to write file2: %v", err)
	}

	catFile := filepath.Join(tmpDir, "catalog.json")

	// 1. 测试 DryRun 模式 (文件内容不应发生任何变更)
	dryOpts := MigrateOptions{
		Dir:         tmpDir,
		BaseURL:     "http://host.docker.internal:8765",
		Token:       "tok123",
		CatalogPath: catFile,
		DryRun:      true,
	}

	dryRep, err := RunMigrate(dryOpts)
	if err != nil {
		t.Fatalf("dry run failed: %v", err)
	}
	if dryRep.Total != 2 || dryRep.Migrated != 2 {
		t.Errorf("unexpected dry run counts: total=%d, migrated=%d", dryRep.Total, dryRep.Migrated)
	}

	// 验证磁盘文件未被修改
	data1, _ := os.ReadFile(file1)
	if string(data1) != content1 {
		t.Errorf("file1 should NOT be modified in dry run")
	}

	// 2. 测试真实迁移执行
	realOpts := dryOpts
	realOpts.DryRun = false

	realRep, err := RunMigrate(realOpts)
	if err != nil {
		t.Fatalf("real run failed: %v", err)
	}
	if realRep.Migrated != 2 {
		t.Errorf("expected 2 migrated files, got %d", realRep.Migrated)
	}

	// 验证文件 1 变更
	data1After, _ := os.ReadFile(file1)
	text1After := string(data1After)
	expectedURL1 := "http://host.docker.internal:8765/v1/tok123/play/STARS-256.m3u8"
	if !strings.HasPrefix(text1After, expectedURL1) {
		t.Errorf("expected file1 first line %s, got: %s", expectedURL1, text1After)
	}
	if !strings.Contains(text1After, "# origin_url: https://missav.ai/dm31/STARS-256") {
		t.Errorf("expected file1 to preserve origin_url: %s", text1After)
	}

	// 验证 Catalog 记录了 missav 页面提示
	cat := cache.NewCatalog(catFile)
	entry, ok := cat.Get("STARS-256")
	if !ok || entry.PageURL != "https://missav.ai/dm31/STARS-256" {
		t.Errorf("expected catalog hint for STARS-256: %+v", entry)
	}

	// 3. 测试幂等性 (再次执行全部判定为 skipped)
	rep2, err := RunMigrate(realOpts)
	if err != nil {
		t.Fatalf("second run failed: %v", err)
	}
	if rep2.Migrated != 0 || rep2.Skipped != 2 {
		t.Errorf("expected 0 migrated and 2 skipped in second run, got migrated=%d, skipped=%d", rep2.Migrated, rep2.Skipped)
	}
}
