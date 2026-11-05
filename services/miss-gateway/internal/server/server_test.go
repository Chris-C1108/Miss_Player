package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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

func TestResolveMissingCode(t *testing.T) {
	mgr := source.NewManager(http.DefaultClient)
	s := NewServer(Config{Port: "8765"}, mgr)

	req := httptest.NewRequest("GET", "/api/resolve", nil)
	w := httptest.NewRecorder()

	s.Routes().ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d", w.Code)
	}
}

func TestResolveSuccess(t *testing.T) {
	src := &mockSource{
		name:   "Mock",
		weight: 100,
		result: &source.StreamResult{
			Success: true,
			Code:    "STARS-256",
			URL:     "https://cdn.example.com/stream.m3u8",
			Source:  "MockSource",
		},
	}
	mgr := source.NewManager(http.DefaultClient, src)
	s := NewServer(Config{Port: "8765"}, mgr)

	req := httptest.NewRequest("GET", "/api/resolve?code=stars-256", nil)
	w := httptest.NewRecorder()

	s.Routes().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w.Code)
	}

	var res source.StreamResult
	if err := json.NewDecoder(w.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !res.Success || res.Code != "STARS-256" || res.URL != "https://cdn.example.com/stream.m3u8" {
		t.Errorf("unexpected StreamResult: %+v", res)
	}
}

func TestResolveOptionsCORS(t *testing.T) {
	mgr := source.NewManager(http.DefaultClient)
	s := NewServer(Config{Port: "8765"}, mgr)

	req := httptest.NewRequest("OPTIONS", "/api/resolve", nil)
	w := httptest.NewRecorder()

	s.Routes().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for OPTIONS, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("missing CORS header: %v", w.Header())
	}
}
