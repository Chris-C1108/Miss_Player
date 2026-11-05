package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"miss-gateway/internal/source"
)

type Config struct {
	Port       string
	ProxyURL   string
	Version    string
	WaitWindow time.Duration
	Timeout    time.Duration
}

type Server struct {
	cfg     Config
	manager *source.Manager
	mux     *http.ServeMux
}

func NewServer(cfg Config, mgr *source.Manager) *Server {
	if cfg.WaitWindow == 0 {
		cfg.WaitWindow = 3500 * time.Millisecond
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 12 * time.Second
	}
	if cfg.Version == "" {
		cfg.Version = "2.0.0"
	}

	s := &Server{
		cfg:     cfg,
		manager: mgr,
		mux:     http.NewServeMux(),
	}

	s.setupRoutes()
	return s
}

func (s *Server) Routes() http.Handler {
	return s.mux
}

func (s *Server) setupRoutes() {
	s.mux.HandleFunc("/health", s.handleHealth)
	s.mux.HandleFunc("/api/resolve", s.handleResolve)
	s.mux.HandleFunc("/resolve", s.handleResolve)
	s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("code") != "" {
			s.handleResolve(w, r)
		} else {
			s.handleHealth(w, r)
		}
	})
}

func (s *Server) enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"service": "miss-stream-gateway",
		"version": s.cfg.Version,
		"proxy":   s.cfg.ProxyURL,
		"time":    time.Now().Format(time.RFC3339),
	})
}

func (s *Server) handleResolve(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	code := r.URL.Query().Get("code")
	if code == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(source.StreamResult{
			Success: false,
			Error:   "Missing query parameter 'code'",
		})
		return
	}

	tStart := time.Now()
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	ctx, cancel := context.WithTimeout(r.Context(), s.cfg.Timeout)
	defer cancel()

	bestResult, err := s.manager.ResolveWeighted(ctx, cleanCode, s.cfg.WaitWindow)
	elapsed := time.Since(tStart).Milliseconds()

	if err == nil && bestResult != nil {
		bestResult.ElapsedMs = elapsed
		log.Printf("[Success] %s -> %s (%s) [加密: %s, KeyHex: %s] 耗时: %dms",
			cleanCode, bestResult.Source, bestResult.URL, bestResult.KeyMethod, bestResult.KeyHex, elapsed)
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(bestResult)
		return
	}

	log.Printf("[Failed] %s 暂无可用片源 耗时: %dms", cleanCode, elapsed)
	w.WriteHeader(http.StatusNotFound)
	_ = json.NewEncoder(w).Encode(source.StreamResult{
		Success:   false,
		Code:      cleanCode,
		ElapsedMs: elapsed,
		Error:     "所有外部源均未能解析到有效流",
	})
}
