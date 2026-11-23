package server

import (
	"fmt"
	"html"
	"net/http"
	"regexp"
	"strings"
)

var reWatchCodeSafe = regexp.MustCompile(`^[A-Z0-9][A-Z0-9_-]{1,39}$`)

// handleWatch 浏览器同源轻量化影院承接页 (/v1/{token}/watch/{code})
// 目的：彻底规避第三方索引站（如 ltxlib.dpdns.org）的强 CSP / Mixed Content / PNA 封锁，
// 提供与 /v1/{token}/play/{code}.m3u8 严格同源的 <video data-code> 承载页，
// 供 iOS Safari 原生硬解 HLS、桌面端 hls.js 播放，并自动唤起 Miss Player 影院模式。
func (s *Server) handleWatch(w http.ResponseWriter, r *http.Request) {
	s.enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	token := r.PathValue("token")
	if !s.validateToken(token) {
		http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
		return
	}

	rawCode := strings.TrimSuffix(strings.TrimSuffix(r.PathValue("code"), ".html"), ".m3u8")
	cleanCode := strings.ToUpper(strings.TrimSpace(rawCode))
	if !reWatchCodeSafe.MatchString(cleanCode) {
		http.Error(w, "Invalid code", http.StatusBadRequest)
		return
	}

	srcFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("src")))
	if srcFilter != "" && !reWatchCodeSafe.MatchString(strings.ToUpper(srcFilter)) {
		srcFilter = ""
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")

	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}

	safeCode := html.EscapeString(cleanCode)
	safeToken := html.EscapeString(token)
	safeSrc := html.EscapeString(srcFilter)

	page := fmt.Sprintf(watchPageTemplate, safeCode, safeCode, safeCode, safeCode, safeCode, safeToken, safeCode, safeSrc)
	_, _ = w.Write([]byte(page))
}

const watchPageTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0f1013">
<meta name="miss-player-auto-theater" content="1">
<title>%s · Miss Player 影院</title>
<style>
  :root {
    --bg: #0f1013;
    --panel: rgba(23, 24, 29, 0.86);
    --line: rgba(255, 255, 255, 0.10);
    --text: #e8e8ec;
    --muted: #8c8f9a;
    --pink: #fe628e;
    --pink-soft: rgba(254, 98, 142, 0.18);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%%;
    height: 100%%;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .shell {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #000;
  }
  .topbar {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: max(10px, env(safe-area-inset-top)) 14px 10px;
    background: linear-gradient(180deg, rgba(15,16,19,0.92), rgba(15,16,19,0.45));
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--line);
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }
  .badge {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #fff;
    background: var(--pink);
    padding: 3px 8px;
    border-radius: 6px;
  }
  .title {
    font-size: 13px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sources {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .sources::-webkit-scrollbar { display: none; }
  .src-btn {
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.06);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .src-btn:hover { color: #fff; border-color: rgba(255,255,255,0.28); }
  .src-btn.active {
    background: var(--pink-soft);
    color: var(--pink);
    border-color: rgba(254, 98, 142, 0.5);
  }
  .stage {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    background: #000;
  }
  video#mp-gateway-video {
    width: 100%%;
    height: 100%%;
    max-width: 100%%;
    max-height: 100%%;
    background: #000;
    object-fit: contain;
  }
  .status {
    position: absolute;
    z-index: 2;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(15, 16, 19, 0.72);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    transition: opacity 0.25s;
    padding: 20px;
    text-align: center;
  }
  .status.hidden { opacity: 0; pointer-events: none; }
  .spinner {
    width: 34px;
    height: 34px;
    border: 3px solid rgba(255,255,255,0.16);
    border-top-color: var(--pink);
    border-radius: 50%%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status-text { font-size: 14px; color: var(--text); }
  .status-sub { font-size: 12px; color: var(--muted); }
  .retry-row { display: none; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
  .status.is-error .spinner { display: none; }
  .status.is-error .retry-row { display: flex; }
  .retry-btn {
    border: 1px solid rgba(254, 98, 142, 0.45);
    background: var(--pink-soft);
    color: #fff;
    padding: 7px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="meta">
      <span class="badge">%s</span>
      <span class="title" id="mp-watch-title">%s</span>
    </div>
    <div class="sources" id="mp-watch-sources">
      <button type="button" class="src-btn" data-src="">自动</button>
      <button type="button" class="src-btn" data-src="123av">123AV</button>
      <button type="button" class="src-btn" data-src="javverse">JAVVerse</button>
      <button type="button" class="src-btn" data-src="missav">MissAV</button>
      <button type="button" class="src-btn" data-src="jable">Jable</button>
    </div>
  </header>
  <main class="stage">
    <video id="mp-gateway-video" data-code="%s" data-avcode="%s" playsinline webkit-playsinline x5-playsinline controls autoplay preload="auto"></video>
    <div class="status" id="mp-watch-status">
      <div class="spinner"></div>
      <div class="status-text" id="mp-status-text">正在竞速寻源…</div>
      <div class="status-sub" id="mp-status-sub">123AV · JAVVerse · MissAV · Jable</div>
      <div class="retry-row">
        <button type="button" class="retry-btn" id="mp-retry-btn">重试当前源</button>
      </div>
    </div>
  </main>
</div>
<script>
(function() {
  var TOKEN = %q;
  var CODE = %q;
  var INITIAL_SRC = %q;

  var hashParams = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  var metaTitle = hashParams.get('title') || '';
  var metaPoster = hashParams.get('poster') || '';
  var hashSrc = hashParams.get('src') || '';
  var currentSrc = INITIAL_SRC || hashSrc || '';

  var video = document.getElementById('mp-gateway-video');
  var titleEl = document.getElementById('mp-watch-title');
  var statusEl = document.getElementById('mp-watch-status');
  var statusText = document.getElementById('mp-status-text');
  var statusSub = document.getElementById('mp-status-sub');
  var retryBtn = document.getElementById('mp-retry-btn');
  var srcContainer = document.getElementById('mp-watch-sources');

  if (metaTitle) {
    titleEl.textContent = metaTitle;
    document.title = CODE + ' · ' + metaTitle;
  }
  if (metaPoster && /^https?:\/\//i.test(metaPoster)) {
    video.poster = metaPoster;
  }

  var hlsInstance = null;
  var hlsScriptPromise = null;

  function setActiveSrcBtn(srcId) {
    var btns = srcContainer.querySelectorAll('.src-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', (btns[i].getAttribute('data-src') || '') === (srcId || ''));
    }
  }

  function showLoading(msg, sub) {
    statusEl.classList.remove('hidden', 'is-error');
    statusText.textContent = msg || '正在加载视频流…';
    statusSub.textContent = sub || '123AV · JAVVerse · MissAV · Jable';
  }

  function showError(msg, sub) {
    statusEl.classList.remove('hidden');
    statusEl.classList.add('is-error');
    statusText.textContent = msg || '未能获取可用视频源';
    statusSub.textContent = sub || '可点击上方切换其他片源重试';
  }

  function hideStatus() {
    statusEl.classList.add('hidden');
  }

  function buildPlayUrl(srcId) {
    var base = '/v1/' + encodeURIComponent(TOKEN) + '/play/' + encodeURIComponent(CODE) + '.m3u8';
    return srcId ? (base + '?src=' + encodeURIComponent(srcId)) : base;
  }

  function loadHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsScriptPromise) return hlsScriptPromise;
    var cdns = [
      'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js',
      'https://fastly.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js'
    ];
    hlsScriptPromise = new Promise(function(resolve, reject) {
      var idx = 0;
      function tryNext() {
        if (idx >= cdns.length) {
          reject(new Error('hls.js 加载失败'));
          return;
        }
        var s = document.createElement('script');
        s.src = cdns[idx++];
        s.async = true;
        s.onload = function() {
          if (window.Hls) resolve(window.Hls);
          else tryNext();
        };
        s.onerror = tryNext;
        document.head.appendChild(s);
      }
      tryNext();
    });
    return hlsScriptPromise;
  }

  function refreshSourceInfo() {
    fetch('/v1/' + encodeURIComponent(TOKEN) + '/sources/' + encodeURIComponent(CODE))
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(info) {
        if (info && info.activeSource) {
          statusSub.textContent = '当前片源：' + info.activeSource + (info.variant ? (' · ' + info.variant) : '');
        }
      })
      .catch(function() {});
  }

  function attachStream(srcId) {
    currentSrc = srcId || '';
    setActiveSrcBtn(currentSrc);
    var playUrl = buildPlayUrl(currentSrc);
    showLoading(currentSrc ? ('正在从 ' + currentSrc.toUpperCase() + ' 寻源…') : '正在竞速寻源…');

    if (hlsInstance) {
      try { hlsInstance.destroy(); } catch (_) {}
      hlsInstance = null;
    }

    var canNativeHls = video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');
    var isSafariLike = /Safari/i.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Android/i.test(navigator.userAgent);

    if (canNativeHls && isSafariLike) {
      video.src = playUrl;
      video.load();
      video.play().catch(function() {});
      refreshSourceInfo();
      return;
    }

    loadHlsJs().then(function(Hls) {
      if (!Hls.isSupported()) {
        video.src = playUrl;
        video.load();
        return;
      }
      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 45,
        maxMaxBufferLength: 120,
        fragLoadingMaxRetry: 3,
        manifestLoadingMaxRetry: 2,
        manifestLoadingTimeOut: 15000
      });
      hlsInstance = hls;
      hls.loadSource(playUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        hideStatus();
        refreshSourceInfo();
        video.play().catch(function() {});
      });
      hls.on(Hls.Events.ERROR, function(_, data) {
        if (data && data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            showError('片源加载失败（' + (data.response && data.response.code ? ('HTTP ' + data.response.code) : '网络错误') + '）', '请尝试切换上方其他片源');
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            showError('播放器发生错误', data.details || '');
          }
        }
      });
    }).catch(function(err) {
      if (canNativeHls) {
        video.src = playUrl;
        video.load();
      } else {
        showError('HLS 引擎初始化失败', err && err.message ? err.message : '');
      }
    });
  }

  video.addEventListener('loadedmetadata', hideStatus);
  video.addEventListener('canplay', hideStatus);
  video.addEventListener('error', function() {
    showError('视频流加载失败', '该片源可能未收录此番号，请切换其他源重试');
  });

  srcContainer.addEventListener('click', function(e) {
    var btn = e.target.closest('.src-btn');
    if (!btn) return;
    attachStream(btn.getAttribute('data-src') || '');
  });
  retryBtn.addEventListener('click', function() {
    attachStream(currentSrc);
  });

  window.__MISS_GATEWAY_SWITCH_SOURCE__ = attachStream;
  attachStream(currentSrc);
})();
</script>
</body>
</html>`
