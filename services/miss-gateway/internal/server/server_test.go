package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"miss-gateway/internal/source"
)

type mockSource struct {
	name   string
	weight int
	delay  time.Duration
	result *source.StreamResult
}

func (m *mockSource) Name() string           { return m.name }
func (m *mockSource) Weight() int            { return m.weight }
func (m *mockSource) Delay() time.Duration   { return m.delay }
func (m *mockSource) Resolve(ctx context.Context, client *http.Client, code string) (*source.StreamResult, error) {
	return m.result, nil
}

func TestHealthEndpoint(t *testing.T) {
	mgr := source.NewManager(http.DefaultClient)
	s := NewServer(Config{Port: "8765", Version: "2.0.0"}, mgr)

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
		Port:   "8765",
		Tokens: []string{"valid-secret-token", "another-token"},
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
	// 1. 模拟上游 CDN 伺服分片与 M3U8
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
			// 校验网关是否注入了合规 Referer
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

	// 2. 构造 Mock Source 返回 cdnServer 的 m3u8 地址
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
		Port:   "8765",
		Tokens: []string{"test-token"},
	}, mgr)

	// 3. 测试 /play 入口改写
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
	if !strings.Contains(playBody, `/v1/test-token/key/STARS-256/mockcdn/0/0.key`) {
		t.Fatalf("rewritten m3u8 missing key route: %s", playBody)
	}

	// 4. 测试 /seg 代理分片拉取
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

	// 5. 测试 /key 代理拉取
	keyReq := httptest.NewRequest("GET", "/v1/test-token/key/STARS-256/mockcdn/0/0.key", nil)
	keyRec := httptest.NewRecorder()
	s.Routes().ServeHTTP(keyRec, keyReq)

	if keyRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /key, got %d", keyRec.Code)
	}
	keyData, _ := io.ReadAll(keyRec.Body)
	if string(keyData) != "1234567890abcdef" {
		t.Errorf("unexpected key payload: %s", string(keyData))
	}
}
