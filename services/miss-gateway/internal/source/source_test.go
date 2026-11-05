package source

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// TestExtract123AvFromHTML 测试从 HTML 提取 123AV 嵌入流地址
func TestExtract123AvFromHTML(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/stream") {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{
				"status": "success",
				"media": {
					"stream": "https://cdn.example.com/hls/test.m3u8",
					"vtt": "https://cdn.example.com/sub.vtt"
				}
			}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	mockHTML := `<div><iframe src="` + strings.ReplaceAll(ts.URL, "/", `\/`) + `\/e\/TEST1234"></iframe></div>`

	res := extract123AvFromHTML(context.Background(), ts.Client(), mockHTML, "TEST-001", "普通版")
	if res == nil {
		t.Fatalf("expected non-nil StreamResult")
	}
	if !res.Success || res.URL != "https://cdn.example.com/hls/test.m3u8" {
		t.Errorf("unexpected StreamResult: %+v", res)
	}
	if res.KeyMethod != "NONE" {
		t.Errorf("expected KeyMethod NONE, got %s", res.KeyMethod)
	}
}

// TestEnrichHlsEncryptionMetadata 测试从 M3U8 嗅探 AES-128 Key
func TestEnrichHlsEncryptionMetadata(t *testing.T) {
	keyBytes := []byte("0123456789abcdef") // 16 bytes
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/video.key" {
			_, _ = w.Write(keyBytes)
			return
		}
		if r.URL.Path == "/index.m3u8" {
			_, _ = w.Write([]byte(`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-KEY:METHOD=AES-128,URI="` + "/video.key" + `",IV=0x1234567890abcdef
#EXTINF:4.000,
seg1.ts
`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	res := &StreamResult{Code: "TEST-002"}
	enrichHlsEncryptionMetadata(context.Background(), ts.Client(), ts.URL+"/index.m3u8", "", res)

	if res.KeyMethod != "AES-128" {
		t.Errorf("expected AES-128, got %s", res.KeyMethod)
	}
	if res.KeyHex != "30313233343536373839616263646566" {
		t.Errorf("unexpected KeyHex: %s", res.KeyHex)
	}
	if res.KeyIV != "0x1234567890abcdef" {
		t.Errorf("unexpected KeyIV: %s", res.KeyIV)
	}
}

// MockSource 模拟片源
type MockSource struct {
	name   string
	weight int
	delay  time.Duration
	result *StreamResult
	err    error
}

func (m *MockSource) Name() string           { return m.name }
func (m *MockSource) Weight() int            { return m.weight }
func (m *MockSource) Delay() time.Duration   { return m.delay }
func (m *MockSource) Resolve(ctx context.Context, client *http.Client, code string) (*StreamResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.result, nil
}

// TestManagerResolveWeighted 测试高权重即时熔断
func TestManagerResolveWeighted(t *testing.T) {
	src1 := &MockSource{
		name:   "HighPriority",
		weight: 100,
		delay:  10 * time.Millisecond,
		result: &StreamResult{Success: true, URL: "http://high.example.com", Source: "High"},
	}
	src2 := &MockSource{
		name:   "LowPriorityDelayed",
		weight: 50,
		delay:  100 * time.Millisecond,
		result: &StreamResult{Success: true, URL: "http://low.example.com", Source: "Low"},
	}

	mgr := NewManager(http.DefaultClient, src1, src2)
	res, err := mgr.ResolveWeighted(context.Background(), "ABC-123", 500*time.Millisecond)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if res.Source != "High" {
		t.Errorf("expected High priority source, got %s", res.Source)
	}
}

// TestManagerAllFailed 测试全部失败返回错误
func TestManagerAllFailed(t *testing.T) {
	src := &MockSource{
		name:   "FailingSource",
		weight: 50,
		err:    errors.New("not found"),
	}

	mgr := NewManager(http.DefaultClient, src)
	_, err := mgr.ResolveWeighted(context.Background(), "NONE-999", 50*time.Millisecond)
	if err == nil {
		t.Fatalf("expected error when all sources fail")
	}
}
