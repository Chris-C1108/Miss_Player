package cache

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type CatalogEntry struct {
	Code      string    `json:"code"`
	SourceID  string    `json:"sourceId"`
	PageURL   string    `json:"pageUrl,omitempty"`
	WorkID    string    `json:"workId,omitempty"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Catalog struct {
	mu       sync.RWMutex
	filePath string
	entries  map[string]CatalogEntry
	negative map[string]time.Time
	dirty    bool
}

func NewCatalog(filePath string) *Catalog {
	c := &Catalog{
		filePath: filePath,
		entries:  make(map[string]CatalogEntry),
		negative: make(map[string]time.Time),
	}

	c.load()
	return c
}

func (c *Catalog) load() {
	if c.filePath == "" {
		return
	}
	data, err := os.ReadFile(c.filePath)
	if err != nil {
		return
	}

	var list []CatalogEntry
	if err := json.Unmarshal(data, &list); err == nil {
		c.mu.Lock()
		for _, e := range list {
			c.entries[e.Code] = e
		}
		c.mu.Unlock()
	}
}

// Save 将目录原子落盘
func (c *Catalog) Save() error {
	c.mu.Lock()
	if !c.dirty || c.filePath == "" {
		c.mu.Unlock()
		return nil
	}

	list := make([]CatalogEntry, 0, len(c.entries))
	for _, e := range c.entries {
		list = append(list, e)
	}
	c.dirty = false
	c.mu.Unlock()

	dir := filepath.Dir(c.filePath)
	if dir != "" && dir != "." {
		_ = os.MkdirAll(dir, 0755)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	tmpFile := c.filePath + ".tmp"
	if err := os.WriteFile(tmpFile, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmpFile, c.filePath)
}

func (c *Catalog) Set(entry CatalogEntry) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if entry.UpdatedAt.IsZero() {
		entry.UpdatedAt = time.Now()
	}
	c.entries[entry.Code] = entry
	delete(c.negative, entry.Code) // 成功收录时移除负缓存
	c.dirty = true
}

func (c *Catalog) Get(code string) (CatalogEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.entries[code]
	return e, ok
}

// MarkNegative 标记全网未收录 (30分钟负缓存，杜绝反复死等)
func (c *Catalog) MarkNegative(code string, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.negative[code] = time.Now().Add(ttl)
}

// IsNegative 检查是否处于负缓存冷却期
func (c *Catalog) IsNegative(code string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	exp, ok := c.negative[code]
	if !ok {
		return false
	}
	if time.Now().After(exp) {
		return false
	}
	return true
}
