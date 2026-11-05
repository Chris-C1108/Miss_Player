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

func (m *MockSource) Name() string         { return m.name }
func (m *MockSource) Weight() int          { return m.weight }
func (m *MockSource) Delay() time.Duration { return m.delay }
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

// TestUnpackJavaScript 测试解包 Dean Edwards 混淆代码
func TestUnpackJavaScript(t *testing.T) {
	// 简单 packed 样本: eval(function(p,a,c,k,e,d)...}('0 1 2 3',4,4,'hello|world|foo|bar'.split('|')))
	packed := `eval(function(p,a,c,k,e,d){return p}('0 1 2 3',4,4,'hello|world|foo|bar'.split('|'),0,{}))`
	unpacked := UnpackJavaScript(packed)
	expected := "hello world foo bar"
	if !strings.Contains(unpacked, expected) {
		t.Errorf("unpacked result mismatch: expected %q, got %q", expected, unpacked)
	}
}

// TestMissavExtraction 测试 MissAV 页面解析与解包提取
func TestMissavExtraction(t *testing.T) {
	// 1. 测试直接包含 surrit.com 的页面
	htmlDirect := `<div><script>const hlsUrl = "https://surrit.com/abcdef12-3456-7890-abcd-ef1234567890/playlist.m3u8";</script></div>`
	res1 := extractMissavPlaylist(htmlDirect)
	if res1 != "https://surrit.com/abcdef12-3456-7890-abcd-ef1234567890/playlist.m3u8" {
		t.Errorf("unexpected direct extraction: %s", res1)
	}

	// 2. 测试混淆在 packed 脚本里的 UUID
	htmlPacked := `eval(function(p,a,c,k,e,d){return p}('0=\'1-2-3-4-5\'',6,6,'uuid|12345678|1234|1234|1234|1234567890ab'.split('|'),0,{}))`
	res2 := extractMissavPlaylist(htmlPacked)
	if res2 != "https://surrit.com/12345678-1234-1234-1234-1234567890ab/playlist.m3u8" {
		t.Errorf("unexpected packed uuid extraction: %s", res2)
	}
}

// TestMissavCloudflareChallenge 测试识别 Cloudflare 验证盾牌并返回 ErrChallenged
func TestMissavCloudflareChallenge(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`<!DOCTYPE html><html><head><title>Just a moment...</title></head><body>cf-chl-widget</body></html>`))
	}))
	defer ts.Close()

	missav := NewSourceMissAv([]string{ts.URL}, &DirectFetcher{})
	_, err := missav.Resolve(context.Background(), ts.Client(), "TEST-CHL")
	if !errors.Is(err, ErrChallenged) {
		t.Errorf("expected ErrChallenged, got: %v", err)
	}
}

// TestTrackerAndCircuitBreaker 测试动态打分与熔断状态机
func TestTrackerAndCircuitBreaker(t *testing.T) {
	tracker := NewTracker()
	tracker.failThreshold = 3
	tracker.cooldown = 50 * time.Millisecond

	// 初始应允许执行
	if !tracker.CanExecute("test-src") {
		t.Errorf("initial state should be allowed")
	}

	// 连续 3 次失败触发熔断
	tracker.RecordFailure("test-src", errors.New("fail"))
	tracker.RecordFailure("test-src", errors.New("fail"))
	tracker.RecordFailure("test-src", errors.New("fail"))

	if tracker.CanExecute("test-src") {
		t.Errorf("source should be circuit-broken after 3 failures")
	}

	src := &MockSource{name: "test-src", weight: 100}
	if score := tracker.Score(src); score != -1.0 {
		t.Errorf("expected score -1 for broken circuit, got %f", score)
	}

	// 冷却时间过后，进入半开状态并放行一次探测
	time.Sleep(60 * time.Millisecond)
	if !tracker.CanExecute("test-src") {
		t.Errorf("should allow probe after cooldown in half-open state")
	}

	// 探测成功，熔断复位
	tracker.RecordSuccess("test-src", 100*time.Millisecond)
	if !tracker.CanExecute("test-src") {
		t.Errorf("should be healthy after successful probe")
	}

	if score := tracker.Score(src); score <= 0 {
		t.Errorf("expected positive score after recovery, got %f", score)
	}

	// 测试 ErrChallenged 立即熔断
	tracker.RecordFailure("chl-src", ErrChallenged)
	if tracker.CanExecute("chl-src") {
		t.Errorf("ErrChallenged should immediately trip circuit breaker")
	}
}
