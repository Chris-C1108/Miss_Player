package registry

import (
	"fmt"
	"sync"
	"time"
)

type VariantSession struct {
	VariantID     string
	M3U8URL       string
	RewrittenM3U8 []byte
	Sublists      []string
	Segments      []string
	Keys          []string
	Maps          []string
}

type StreamSession struct {
	Code         string
	SourceID     string
	UpstreamM3U8 string
	Referer      string
	Origin       string
	CreatedAt    time.Time
	ExpiresAt    time.Time
	Variants     map[string]*VariantSession
}

type Registry struct {
	mu       sync.RWMutex
	sessions map[string]*StreamSession
	ttl      time.Duration
}

func NewRegistry(ttl time.Duration) *Registry {
	if ttl == 0 {
		ttl = 2 * time.Hour
	}
	r := &Registry{
		sessions: make(map[string]*StreamSession),
		ttl:      ttl,
	}

	// 定期清理过期会话
	go r.startCleaner(10 * time.Minute)
	return r
}

func (r *Registry) startCleaner(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		r.CleanExpired()
	}
}

func (r *Registry) CleanExpired() {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	for k, s := range r.sessions {
		if now.After(s.ExpiresAt) {
			delete(r.sessions, k)
		}
	}
}

func (r *Registry) Set(s *StreamSession) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}
	if s.ExpiresAt.IsZero() {
		s.ExpiresAt = s.CreatedAt.Add(r.ttl)
	}
	if s.Variants == nil {
		s.Variants = make(map[string]*VariantSession)
	}
	r.sessions[s.Code] = s
}

func (r *Registry) Get(code string) (*StreamSession, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.sessions[code]
	if !ok || time.Now().After(s.ExpiresAt) {
		return nil, false
	}
	return s, true
}

func (r *Registry) SetVariant(code string, v *VariantSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	s, ok := r.sessions[code]
	if !ok {
		return fmt.Errorf("session not found for code: %s", code)
	}
	if s.Variants == nil {
		s.Variants = make(map[string]*VariantSession)
	}
	s.Variants[v.VariantID] = v
	return nil
}

func (r *Registry) GetSegment(code, variantID string, index int) (upstreamURL, referer string, ok bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, exists := r.sessions[code]
	if !exists || time.Now().After(s.ExpiresAt) {
		return "", "", false
	}
	v, exists := s.Variants[variantID]
	if !exists || index < 0 || index >= len(v.Segments) {
		return "", "", false
	}
	return v.Segments[index], s.Referer, true
}

func (r *Registry) GetKey(code, variantID string, index int) (upstreamURL, referer string, ok bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, exists := r.sessions[code]
	if !exists || time.Now().After(s.ExpiresAt) {
		return "", "", false
	}
	v, exists := s.Variants[variantID]
	if !exists || index < 0 || index >= len(v.Keys) {
		return "", "", false
	}
	return v.Keys[index], s.Referer, true
}

func (r *Registry) GetMap(code, variantID string, index int) (upstreamURL, referer string, ok bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, exists := r.sessions[code]
	if !exists || time.Now().After(s.ExpiresAt) {
		return "", "", false
	}
	v, exists := s.Variants[variantID]
	if !exists || index < 0 || index >= len(v.Maps) {
		return "", "", false
	}
	return v.Maps[index], s.Referer, true
}

func (r *Registry) GetSublist(code string, index int) (upstreamURL, referer string, ok bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, exists := r.sessions[code]
	if !exists || time.Now().After(s.ExpiresAt) {
		return "", "", false
	}
	v, exists := s.Variants["0"]
	if !exists || index < 0 || index >= len(v.Sublists) {
		return "", "", false
	}
	return v.Sublists[index], s.Referer, true
}
