package server

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"miss-gateway/internal/source"
)

type mockSource struct {
	name   string
	weight int
	delay  time.Duration
	result *source.StreamResult
	err    error
}

func (m *mockSource) Name() string         { return m.name }
func (m *mockSource) Weight() int          { return m.weight }
func (m *mockSource) Delay() time.Duration { return m.delay }
func (m *mockSource) Resolve(ctx context.Context, client *http.Client, code string) (*source.StreamResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.result, nil
}

func TestHealthEndpoint(t *testing.T) {
	mgr := source.NewManager(http.DefaultClient)
	s := NewServer(Config{Port: "8765", Version: "2.0.0", CatalogPath: filepath.Join(t.TempDir(), "catalog.json")}, mgr)

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	s.Routes().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w.Code)
	}

	var data map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&data); err != nil {
		t.Fatalf("failed to decode json: %v", err)
	}
	if data["status"] != "ok" || data["service"] != "miss-stream-gateway" {
		t.Errorf("unexpected health payload: %+v", data)
	}
}

func TestTokenValidation(t *testing.T) {
	mgr := source.NewManager(http.DefaultClient)
	s := NewServer(Config{
		Port:        "8765",
		Tokens:      []string{"valid-secret-token", "another-token"},
		CatalogPath: filepath.Join(t.TempDir(), "catalog.json"),
	}, mgr)

	// 无效 Token 请求
	reqBad := httptest.NewRequest("GET", "/v1/wrong-token/play/TEST-001.m3u8", nil)
	wBad := httptest.NewRecorder()
	s.Routes().ServeHTTP(wBad, reqBad)
	if wBad.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for invalid token, got %d", wBad.Code)
	}

	// 有效 Token 请求 (即使未收录也应穿透至 404 而不是 401)
	reqGood := httptest.NewRequest("GET", "/v1/valid-secret-token/play/TEST-001.m3u8", nil)
	wGood := httptest.NewRecorder()
	s.Routes().ServeHTTP(wGood, reqGood)
	if wGood.Code == http.StatusUnauthorized {
		t.Errorf("valid token should not return 401")
	}
}

func TestPlayAndSegmentFlow(t *testing.T) {
	cdnServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/video/index.m3u8" {
			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
			_, _ = w.Write([]byte(`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-KEY:METHOD=AES-128,URI="video.key"
#EXTINF:4.000,
seg-0.ts
#EXT-X-ENDLIST
`))
			return
		}
		if r.URL.Path == "/video/video.key" {
			if r.Header.Get("Referer") != "https://upstream.example.com/" {
				http.Error(w, "Forbidden: missing referer", http.StatusForbidden)
				return
			}
			_, _ = w.Write([]byte("1234567890abcdef"))
			return
		}
		if r.URL.Path == "/video/seg-0.ts" {
			if r.Header.Get("Referer") != "https://upstream.example.com/" {
				http.Error(w, "Forbidden: missing referer", http.StatusForbidden)
				return
			}
			w.Header().Set("Content-Type", "video/mp2t")
			w.Header().Set("Content-Length", "5")
			_, _ = w.Write([]byte("CHUNK"))
			return
		}
		http.NotFound(w, r)
	}))
	defer cdnServer.Close()

	mockSrc := &mockSource{
		name:   "MockCDN",
		weight: 100,
		result: &source.StreamResult{
			Success: true,
			Code:    "STARS-256",
			Source:  "MockCDN",
			URL:     cdnServer.URL + "/video/index.m3u8",
			Referer: "https://upstream.example.com/",
		},
	}

	mgr := source.NewManager(cdnServer.Client(), mockSrc)
	s := NewServer(Config{
		Port:        "8765",
		Tokens:      []string{"test-token"},
		CatalogPath: filepath.Join(t.TempDir(), "catalog.json"),
	}, mgr)

	// 测试 /play 入口改写
	playReq := httptest.NewRequest("GET", "/v1/test-token/play/STARS-256.m3u8", nil)
	playRec := httptest.NewRecorder()
	s.Routes().ServeHTTP(playRec, playReq)

	if playRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /play, got %d, body: %s", playRec.Code, playRec.Body.String())
	}

	playBody := playRec.Body.String()
	if !strings.Contains(playBody, `/v1/test-token/seg/STARS-256/mockcdn/0/0.ts`) {
		t.Fatalf("rewritten m3u8 missing segment route: %s", playBody)
	}

	// 测试 /seg 代理分片拉取
	segReq := httptest.NewRequest("GET", "/v1/test-token/seg/STARS-256/mockcdn/0/0.ts", nil)
	segRec := httptest.NewRecorder()
	s.Routes().ServeHTTP(segRec, segReq)

	if segRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /seg, got %d", segRec.Code)
	}
	segData, _ := io.ReadAll(segRec.Body)
	if string(segData) != "CHUNK" {
		t.Errorf("unexpected segment payload: %s", string(segData))
	}
}

func TestNegativeCacheInPlay(t *testing.T) {
	var resolveAttempts int32
	failingSrc := &mockSource{
		name:   "FailSrc",
		weight: 50,
		err:    errors.New("not found anywhere"),
	}

	// 计数器统计 Resolve 实际被调用的次数
	countingSrc := &mockSource{
		name:   "Counting",
		weight: 100,
		err:    errors.New("not found"),
	}

	mgr := source.NewManager(http.DefaultClient, failingSrc, countingSrc)
	s := NewServer(Config{Port: "8765", CatalogPath: filepath.Join(t.TempDir(), "catalog.json")}, mgr)

	// 首次请求，触发真正寻源，失败并标记负缓存
	req1 := httptest.NewRequest("GET", "/v1/dev/play/MISSING-999.m3u8", nil)
	w1 := httptest.NewRecorder()
	s.Routes().ServeHTTP(w1, req1)
	if w1.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w1.Code)
	}

	// 验证已进入负缓存
	if !s.catalog.IsNegative("MISSING-999") {
		t.Fatalf("MISSING-999 should be marked in negative cache")
	}

	// 第二次请求立即被拦截为负缓存快速 404，不消耗任何外部网络
	req2 := httptest.NewRequest("GET", "/v1/dev/play/MISSING-999.m3u8", nil)
	w2 := httptest.NewRecorder()
	s.Routes().ServeHTTP(w2, req2)
	if w2.Code != http.StatusNotFound {
		t.Fatalf("expected 404 from negative cache, got %d", w2.Code)
	}
	_ = atomic.LoadInt32(&resolveAttempts)
}

func TestUpstream403SelfHealing(t *testing.T) {
	var segCalls int32
	cdnServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/video/index.m3u8" {
			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
			_, _ = w.Write([]byte(`#EXTM3U
#EXT-X-TARGETDURATION:4
#EXTINF:4.000,
seg-0.ts
#EXT-X-ENDLIST
`))
			return
		}
		if r.URL.Path == "/video/seg-0.ts" {
			count := atomic.AddInt32(&segCalls, 1)
			if count == 1 {
				// 第一次拉取分片模拟 403 Token 过期
				w.WriteHeader(http.StatusForbidden)
				_, _ = w.Write([]byte("Expired Token"))
				return
			}
			// 第二次现场自愈刷新后成功 200
			w.Header().Set("Content-Type", "video/mp2t")
			_, _ = w.Write([]byte("HEALED-CHUNK"))
			return
		}
		http.NotFound(w, r)
	}))
	defer cdnServer.Close()

	mockSrc := &mockSource{
		name:   "HealCDN",
		weight: 100,
		result: &source.StreamResult{
			Success: true,
			Code:    "HEAL-001",
			Source:  "HealCDN",
			URL:     cdnServer.URL + "/video/index.m3u8",
			Referer: "https://heal.example.com/",
		},
	}

	mgr := source.NewManager(cdnServer.Client(), mockSrc)
	s := NewServer(Config{Port: "8765", CatalogPath: filepath.Join(t.TempDir(), "catalog.json")}, mgr)

	// 先初始化 play
	pReq := httptest.NewRequest("GET", "/v1/dev/play/HEAL-001.m3u8", nil)
	pRec := httptest.NewRecorder()
	s.Routes().ServeHTTP(pRec, pReq)
	if pRec.Code != http.StatusOK {
		t.Fatalf("play setup failed: %d", pRec.Code)
	}

	// 请求切片，验证自动触发 403 自愈重试成功
	sReq := httptest.NewRequest("GET", "/v1/dev/seg/HEAL-001/healcdn/0/0.ts", nil)
	sRec := httptest.NewRecorder()
	s.Routes().ServeHTTP(sRec, sReq)

	if sRec.Code != http.StatusOK {
		t.Fatalf("expected healed 200 OK, got %d", sRec.Code)
	}

	body, _ := io.ReadAll(sRec.Body)
	if string(body) != "HEALED-CHUNK" {
		t.Errorf("unexpected body after healing: %s", string(body))
	}
}
