package cache

import (
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestSingleflight(t *testing.T) {
	g := NewGroup()
	var execCount int32

	var wg sync.WaitGroup
	const callers = 10
	wg.Add(callers)

	for i := 0; i < callers; i++ {
		go func() {
			defer wg.Done()
			val, err := g.Do("test-key", func() (interface{}, error) {
				atomic.AddInt32(&execCount, 1)
				time.Sleep(50 * time.Millisecond)
				return "resolved-url", nil
			})
			if err != nil || val != "resolved-url" {
				t.Errorf("unexpected result: val=%v, err=%v", val, err)
			}
		}()
	}

	wg.Wait()

	if atomic.LoadInt32(&execCount) != 1 {
		t.Fatalf("expected function to execute exactly once, but ran %d times", execCount)
	}
}

func TestCatalogPersistence(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "catalog-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	catFile := filepath.Join(tmpDir, "catalog.json")
	cat := NewCatalog(catFile)

	cat.Set(CatalogEntry{
		Code:     "STARS-256",
		SourceID: "123av",
		PageURL:  "https://123av.com/cn/v/stars-256",
	})

	if err := cat.Save(); err != nil {
		t.Fatalf("failed to save catalog: %v", err)
	}

	// 重新载入验证持久化
	catReloaded := NewCatalog(catFile)
	entry, ok := catReloaded.Get("STARS-256")
	if !ok || entry.SourceID != "123av" || entry.PageURL != "https://123av.com/cn/v/stars-256" {
		t.Errorf("unexpected reloaded entry: %+v", entry)
	}
}

func TestNegativeCache(t *testing.T) {
	cat := NewCatalog("")

	if cat.IsNegative("NOTFOUND-001") {
		t.Errorf("initial code should not be negative")
	}

	cat.MarkNegative("NOTFOUND-001", 50*time.Millisecond)
	if !cat.IsNegative("NOTFOUND-001") {
		t.Errorf("code should be negative after marking")
	}

	time.Sleep(60 * time.Millisecond)
	if cat.IsNegative("NOTFOUND-001") {
		t.Errorf("code should expire from negative cache")
	}
}
