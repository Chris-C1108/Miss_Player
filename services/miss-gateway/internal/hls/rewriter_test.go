package hls

import (
	"strings"
	"testing"
)

func TestRewriteMediaPlaylist(t *testing.T) {
	raw := `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-KEY:METHOD=AES-128,URI="crypt.key",IV=0x12345678901234567890123456789012
#EXTINF:4.000,
seg-0.ts?token=upstream123
#EXTINF:4.000,
seg-1.ts
#EXT-X-ENDLIST
`
	opts := RewriteOptions{
		Token:    "testtok",
		Code:     "STARS-256",
		SourceID: "jable",
		Variant:  "0",
	}

	res, err := RewriteM3U8([]byte(raw), "https://cdn.example.com/hls/index.m3u8", opts)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.IsMaster {
		t.Errorf("expected media playlist, got master")
	}

	if len(res.Keys) != 1 || res.Keys[0] != "https://cdn.example.com/hls/crypt.key" {
		t.Errorf("unexpected keys: %+v", res.Keys)
	}

	if len(res.Segments) != 2 {
		t.Fatalf("expected 2 segments, got %d", len(res.Segments))
	}
	if res.Segments[0] != "https://cdn.example.com/hls/seg-0.ts?token=upstream123" {
		t.Errorf("unexpected segment 0: %s", res.Segments[0])
	}
	if res.Segments[1] != "https://cdn.example.com/hls/seg-1.ts" {
		t.Errorf("unexpected segment 1: %s", res.Segments[1])
	}

	rewrittenText := string(res.Rewritten)
	if !strings.Contains(rewrittenText, `URI="/v1/testtok/key/STARS-256/jable/0/0.key"`) {
		t.Errorf("rewritten text missing key route: %s", rewrittenText)
	}
	if !strings.Contains(rewrittenText, `/v1/testtok/seg/STARS-256/jable/0/0.ts`) {
		t.Errorf("rewritten text missing segment 0 route: %s", rewrittenText)
	}
	if !strings.Contains(rewrittenText, `/v1/testtok/seg/STARS-256/jable/0/1.ts`) {
		t.Errorf("rewritten text missing segment 1 route: %s", rewrittenText)
	}
}

func TestRewriteMasterPlaylist(t *testing.T) {
	raw := `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION=1920x1080
1080p/index.m3u8
`
	opts := RewriteOptions{
		Token:    "mytoken",
		Code:     "SDMU-958",
		SourceID: "123av",
	}

	res, err := RewriteM3U8([]byte(raw), "https://cdn.123av.org/hls/master.m3u8", opts)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !res.IsMaster {
		t.Errorf("expected master playlist")
	}

	if len(res.Sublists) != 2 {
		t.Fatalf("expected 2 sublists, got %d", len(res.Sublists))
	}
	if res.Sublists[0] != "https://cdn.123av.org/hls/720p/index.m3u8" {
		t.Errorf("unexpected sublist 0: %s", res.Sublists[0])
	}
	if res.Sublists[1] != "https://cdn.123av.org/hls/1080p/index.m3u8" {
		t.Errorf("unexpected sublist 1: %s", res.Sublists[1])
	}

	rewrittenText := string(res.Rewritten)
	if !strings.Contains(rewrittenText, `/v1/mytoken/pl/SDMU-958/123av/0.m3u8`) {
		t.Errorf("missing sublist 0 rewrite: %s", rewrittenText)
	}
	if !strings.Contains(rewrittenText, `/v1/mytoken/pl/SDMU-958/123av/1.m3u8`) {
		t.Errorf("missing sublist 1 rewrite: %s", rewrittenText)
	}
}

func TestRewriteFmp4Map(t *testing.T) {
	raw := `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MAP:URI="init.mp4"
#EXTINF:6.000,
chunk-0.m4s
`
	opts := RewriteOptions{
		Token:    "tok",
		Code:     "TEST-001",
		SourceID: "src",
		Variant:  "0",
	}

	res, err := RewriteM3U8([]byte(raw), "https://example.com/hls/", opts)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(res.Maps) != 1 || res.Maps[0] != "https://example.com/hls/init.mp4" {
		t.Errorf("unexpected maps: %+v", res.Maps)
	}

	rewrittenText := string(res.Rewritten)
	if !strings.Contains(rewrittenText, `URI="/v1/tok/map/TEST-001/src/0/0.mp4"`) {
		t.Errorf("missing map rewrite: %s", rewrittenText)
	}
	if !strings.Contains(rewrittenText, `/v1/tok/seg/TEST-001/src/0/0.m4s`) {
		t.Errorf("missing m4s segment rewrite: %s", rewrittenText)
	}
}
