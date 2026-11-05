package registry

import (
	"testing"
	"time"
)

func TestRegistryBasic(t *testing.T) {
	reg := NewRegistry(1 * time.Hour)

	sess := &StreamSession{
		Code:     "TEST-100",
		SourceID: "123av",
		Referer:  "https://123av.com/",
		Variants: map[string]*VariantSession{
			"0": {
				VariantID: "0",
				Segments:  []string{"https://cdn.example.com/seg0.ts", "https://cdn.example.com/seg1.ts"},
				Keys:      []string{"https://cdn.example.com/key0.key"},
				Maps:      []string{"https://cdn.example.com/map0.mp4"},
				Sublists:  []string{"https://cdn.example.com/720p.m3u8"},
			},
		},
	}

	reg.Set(sess)

	got, ok := reg.Get("TEST-100")
	if !ok || got.Code != "TEST-100" {
		t.Fatalf("expected to get session for TEST-100")
	}

	// 测试获取分片
	seg0, ref, ok := reg.GetSegment("TEST-100", "0", 0)
	if !ok || seg0 != "https://cdn.example.com/seg0.ts" || ref != "https://123av.com/" {
		t.Errorf("unexpected seg0: %s, ref: %s", seg0, ref)
	}

	// 测试越界
	_, _, ok = reg.GetSegment("TEST-100", "0", 99)
	if ok {
		t.Errorf("expected out of bounds segment to return false")
	}

	// 测试获取 Key
	k0, ref, ok := reg.GetKey("TEST-100", "0", 0)
	if !ok || k0 != "https://cdn.example.com/key0.key" || ref != "https://123av.com/" {
		t.Errorf("unexpected key0: %s, ref: %s", k0, ref)
	}

	// 测试获取 Map
	m0, ref, ok := reg.GetMap("TEST-100", "0", 0)
	if !ok || m0 != "https://cdn.example.com/map0.mp4" || ref != "https://123av.com/" {
		t.Errorf("unexpected map0: %s, ref: %s", m0, ref)
	}

	// 测试获取子清单
	sub0, ref, ok := reg.GetSublist("TEST-100", 0)
	if !ok || sub0 != "https://cdn.example.com/720p.m3u8" || ref != "https://123av.com/" {
		t.Errorf("unexpected sub0: %s, ref: %s", sub0, ref)
	}
}

func TestRegistryExpired(t *testing.T) {
	reg := NewRegistry(10 * time.Millisecond)

	sess := &StreamSession{
		Code:      "EXPIRE-001",
		CreatedAt: time.Now().Add(-1 * time.Minute),
		ExpiresAt: time.Now().Add(-1 * time.Second),
	}

	reg.Set(sess)

	_, ok := reg.Get("EXPIRE-001")
	if ok {
		t.Errorf("expected expired session to be treated as missing")
	}

	reg.CleanExpired()
	reg.mu.RLock()
	count := len(reg.sessions)
	reg.mu.RUnlock()

	if count != 0 {
		t.Errorf("expected session to be cleaned from map, remaining: %d", count)
	}
}
