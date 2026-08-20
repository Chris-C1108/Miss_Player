// ==UserScript==
// @name         Miss_Player POC (7mmtv & SupJav & Jav.sb 全能无广告模态播放器)
// @namespace    https://github.com/Chris-C1108/Miss_Player
// @version      0.23.0
// @description  POC：彻底禁用 Worker 规避 CSP 拦截（完美解决 SupJav 解复用异常），Jav.sb 坏片预剔除，全站点瞬间起播
// @author       Antigravity
// @match        *://*.7mmtv.sx/*
// @match        *://7mmtv.sx/*
// @match        *://*.7mmtv.tv/*
// @match        *://7mmtv.tv/*
// @match        *://*.supjav.com/*
// @match        *://supjav.com/*
// @match        *://*.supremejav.com/*
// @match        *://*.jav.sb/*
// @match        *://jav.sb/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      *
// @connect      *.googleusercontent.com
// @connect      *.googleapis.com
// @connect      *.turbosplayer.com
// @connect      *.turboviplay.com
// @connect      *.turbovidhls.com
// @connect      *.18av.mov
// @connect      *.streamsuperpro.com
// @connect      *.fc2stream.tv
// @connect      *.cdn-centaurus.com
// @connect      *.shop
// @connect      supjav.com
// @connect      supremejav.com
// @connect      jav.sb
// @connect      7mmtv.sx
// @connect      7mmtv.tv
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const host = window.location.hostname;
    if (!(host.includes('7mmtv') || host.includes('supjav') || host.includes('supremejav') || host.includes('jav.sb'))) return;
    if (window.self !== window.top) return;

    const gw = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

    console.log('%c[Miss_Player POC v0.23.0] 启动！站点: ' + host, 'background:#ec4899; color:#fff; font-size:14px; font-weight:bold; padding:4px 8px; border-radius:4px;');

    let extractedSources = [];
    let currentQualityIndex = 0;
    let currentStreamQuery = '';
    let hlsInstance = null;
    let modalElements = null;
    let isModalOpen = false;
    let isExtracting = false;
    let hasExtractedSuccessfully = false;
    let scanInterval = null;
    let lastProcessedSrc = '';

    // ==========================================
    // 精准生成每个 CDN 所需的特定请求头
    // ==========================================

    function getHeadersForUrl(url) {
        const headers = {
            'User-Agent': navigator.userAgent,
            'Accept': '*/*'
        };

        // Google Drive / Google CDN 严禁携带第三方 Referer，否则触发 429
        if (url.includes('googleusercontent.com') || url.includes('google.com') || url.includes('googleapis.com')) {
            headers['Origin'] = 'https://turbovidhls.com';
            return headers;
        }

        if (url.includes('.shop') || url.includes('fc2stream') || url.includes('centaurus')) {
            headers['Referer'] = 'https://fc2stream.tv/';
            headers['Origin'] = 'https://fc2stream.tv';
            return headers;
        }

        if (url.includes('18av.mov') || url.includes('jav.sb') || url.includes('get_file.php')) {
            headers['Referer'] = 'https://jav.sb/';
            headers['Origin'] = 'https://jav.sb';
            return headers;
        }

        if (url.includes('streamsuperpro') || url.includes('7mmtv')) {
            headers['Referer'] = 'https://7mmtv.sx/';
            return headers;
        }

        if (url.includes('turbosplayer') || url.includes('turboviplay') || url.includes('turbovid')) {
            headers['Referer'] = 'https://turbovidhls.com/';
            headers['Origin'] = 'https://turbovidhls.com';
            return headers;
        }

        headers['Referer'] = window.location.href;
        return headers;
    }

    function gmFetch(url, responseType) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: responseType || 'text',
                headers: getHeadersForUrl(url),
                timeout: 15000,
                onload: (r) => r.status >= 200 && r.status < 400 ? resolve(responseType === 'arraybuffer' ? r.response : r.responseText) : reject(new Error('HTTP ' + r.status)),
                onerror: () => reject(new Error('GM error: ' + url)),
                ontimeout: () => reject(new Error('GM timeout: ' + url))
            });
        });
    }

    // ==========================================
    // 智能 M3U8 净化器：剔除 404 缺失切片
    // ==========================================

    async function sanitizeM3u8Playlist(m3u8Text) {
        const lines = m3u8Text.split('\n');
        const segments = [];
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].trim();
            if (l.startsWith('http') || (l.endsWith('.jpg') || l.endsWith('.ts') || l.endsWith('.m4s'))) {
                segments.push({ url: l, lineIdx: i, infIdx: i > 0 && lines[i - 1].trim().startsWith('#EXTINF') ? i - 1 : -1 });
            }
        }
        if (!segments.length) return m3u8Text;

        const testCount = Math.min(6, segments.length);
        const badIndices = new Set();

        await Promise.all(segments.slice(0, testCount).map(async (seg) => {
            try {
                await gmFetch(seg.url, 'arraybuffer');
            } catch (e) {
                console.warn('[Miss_Player POC] 🔍 探测到 CDN 坏切片，从播放列表剔除:', seg.url);
                badIndices.add(seg.lineIdx);
                if (seg.infIdx !== -1) badIndices.add(seg.infIdx);
            }
        }));

        if (badIndices.size === 0) return m3u8Text;

        const filtered = lines.filter((_, idx) => !badIndices.has(idx));
        console.log('%c[Miss_Player POC] 播放列表净化完成，已剔除 ' + (badIndices.size / 2) + ' 个坏切片', 'color:#10b981;font-weight:bold;');
        return filtered.join('\n');
    }

    // ==========================================
    // 跨沙箱 GM 桥接函数
    // ==========================================

    const bridgeFn = function (rawUrl, isBinary, onDone) {
        let url = rawUrl;
        if (!url.includes('?') && currentStreamQuery && (url.includes('.jpg') || url.includes('.ts') || url.includes('.m4s') || url.includes('.png'))) {
            url += currentStreamQuery;
        }

        const shortUrl = url.length > 70 ? url.substring(0, 35) + '...' + url.substring(url.length - 30) : url;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: isBinary ? 'arraybuffer' : 'text',
            headers: getHeadersForUrl(url),
            timeout: 20000,
            onload: function (res) {
                if (res.status >= 200 && res.status < 400) {
                    if (isBinary && res.response) {
                        try {
                            const blob = new Blob([res.response], { type: 'video/MP2T' });
                            const blobUrl = URL.createObjectURL(blob);
                            onDone(null, blobUrl, true, res.response.byteLength || 0);
                        } catch (e) {
                            console.error('[GMBridge] Blob 构造失败:', e);
                            onDone('BLOB_ERROR: ' + e.message, null, false, 0);
                        }
                    } else {
                        onDone(null, res.responseText || '', false, (res.responseText || '').length);
                    }
                } else {
                    console.warn('[GMBridge] 响应状态码异常:', res.status, shortUrl);
                    onDone('HTTP_' + res.status, null, false, 0);
                }
            },
            onerror: function (e) {
                console.error('[GMBridge] 网络错误:', shortUrl, e);
                onDone('NETWORK_ERROR', null, false, 0);
            },
            ontimeout: function () {
                console.warn('[GMBridge] 请求超时:', shortUrl);
                onDone('TIMEOUT', null, false, 0);
            }
        });
    };

    gw.__mpBridge = bridgeFn;
    window.__mpBridge = bridgeFn;

    // ==========================================
    // 注入页面上下文 Loader (符合 Hls.js 1.5.x 规范)
    // ==========================================

    function injectPageLoader() {
        const s = document.createElement('script');
        s.textContent = '(' + function () {
            function createHlsStats() {
                return {
                    aborted: false,
                    loaded: 0,
                    retry: 0,
                    total: 0,
                    chunkCount: 0,
                    bwEstimate: 0,
                    loading: { start: 0, first: 0, end: 0 },
                    parsing: { start: 0, end: 0 },
                    buffering: { start: 0, first: 0, end: 0 }
                };
            }

            window.__MissPlayerLoader = /** @class */ (function () {
                function GMBridgeLoader(config) {
                    this.config = config;
                    this.stats = createHlsStats();
                    this.context = null;
                    this._fetchCtrl = null;
                }

                GMBridgeLoader.prototype.destroy = function () {
                    this.abort();
                };

                GMBridgeLoader.prototype.abort = function () {
                    this.stats.aborted = true;
                    if (this._fetchCtrl) {
                        try { this._fetchCtrl.abort(); } catch (e) {}
                    }
                };

                GMBridgeLoader.prototype.load = function (context, config, callbacks) {
                    var self = this;
                    self.context = context;
                    self.stats = createHlsStats();
                    var url = context.url;
                    var isBin = context.responseType === 'arraybuffer';
                    var tStart = performance.now();
                    self.stats.loading.start = tStart;

                    // 本地 Blob 列表直接读取
                    if (url.startsWith('blob:') && !isBin) {
                        fetch(url)
                            .then(function (r) { return r.text(); })
                            .then(function (txt) {
                                self.stats.loaded = txt.length;
                                self.stats.total = txt.length;
                                self.stats.loading.end = performance.now();
                                callbacks.onSuccess({ url: url, data: txt }, self.stats, context, null);
                            })
                            .catch(function (e) {
                                callbacks.onError({ code: 0, text: 'BlobFetch: ' + e.message }, context, null);
                            });
                        return;
                    }

                    var bridge = window.__mpBridge;
                    if (typeof bridge !== 'function') {
                        console.error('[GMBridgeLoader] __mpBridge 不可用!');
                        callbacks.onError({ code: 0, text: 'Bridge unavailable' }, context, null);
                        return;
                    }

                    bridge(url, isBin, function (err, data, isBlobUrl, size) {
                        var tEnd = performance.now();
                        self.stats.loading.first = tStart + 20;
                        self.stats.loading.end = tEnd;
                        self.stats.loaded = size || 0;
                        self.stats.total = size || 0;

                        if (err) {
                            console.warn('[GMBridgeLoader] 资源加载失败:', url, err);
                            if (err === 'TIMEOUT' && callbacks.onTimeout) {
                                callbacks.onTimeout(self.stats, context, null);
                            } else {
                                var errCode = (typeof err === 'string' && err.includes('404')) ? 404 : 0;
                                callbacks.onError({ code: errCode, text: String(err) }, context, null);
                            }
                            return;
                        }

                        if (isBlobUrl && data) {
                            var ctrl = new AbortController();
                            self._fetchCtrl = ctrl;
                            fetch(data, { signal: ctrl.signal })
                                .then(function (r) { return r.arrayBuffer(); })
                                .then(function (ab) {
                                    URL.revokeObjectURL(data);
                                    var len = ab ? ab.byteLength : 0;
                                    self.stats.loaded = len;
                                    self.stats.total = len;
                                    self.stats.loading.end = performance.now();
                                    callbacks.onSuccess(
                                        { url: url, data: ab },
                                        self.stats,
                                        context,
                                        null
                                    );
                                })
                                .catch(function (e) {
                                    URL.revokeObjectURL(data);
                                    console.error('[GMBridgeLoader] Blob 读取失败:', e);
                                    callbacks.onError({ code: 0, text: 'BlobFetch: ' + e.message }, context, null);
                                });
                        } else {
                            var len = data ? data.length : 0;
                            self.stats.loaded = len;
                            self.stats.total = len;
                            self.stats.loading.end = performance.now();
                            callbacks.onSuccess(
                                { url: url, data: data || '' },
                                self.stats,
                                context,
                                null
                            );
                        }
                    });
                };

                return GMBridgeLoader;
            })();

            console.log('[Miss_Player POC] 页面 Loader 类注入就绪');
        } + ')()';
        (document.head || document.documentElement).appendChild(s);
        s.remove();
    }

    // ==========================================
    // 动态加载 Hls.js 到页面上下文
    // ==========================================

    function ensureHlsLoaded() {
        return new Promise(function (resolve) {
            if (gw.Hls) return resolve(gw.Hls);

            const cdnUrls = [
                'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.7/hls.min.js',
                'https://unpkg.com/hls.js@1.5.7/dist/hls.min.js',
                'https://cdn.bootcdn.net/ajax/libs/hls.js/1.5.7/hls.min.js'
            ];
            let i = 0;
            function tryNext() {
                if (i >= cdnUrls.length) return resolve(null);
                const sc = document.createElement('script');
                sc.src = cdnUrls[i++];
                sc.onload = function () {
                    console.log('[Miss_Player POC] Hls.js 加载就绪 (页面上下文)');
                    resolve(gw.Hls || window.Hls);
                };
                sc.onerror = function () { sc.remove(); tryNext(); };
                (document.head || document.documentElement).appendChild(sc);
            }
            tryNext();
        });
    }

    // ==========================================
    // 顶部状态横幅
    // ==========================================

    function showTopBanner(text, bg) {
        let b = document.getElementById('poc-top-banner');
        if (!b) {
            b = document.createElement('div');
            b.id = 'poc-top-banner';
            b.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:36px;line-height:36px;color:#fff;font:bold 13px system-ui,sans-serif;text-align:center;z-index:2147483647;box-shadow:0 2px 10px rgba(0,0,0,.3);transition:background .3s;';
            document.documentElement.appendChild(b);
        }
        b.style.background = bg || '#ec4899';
        b.textContent = '⚡ ' + text;
    }

    // ==========================================
    // 多站点流提取器
    // ==========================================

    function resolveSupjavRedirect(html) {
        const m = html.match(/var\s+OLID\s*=\s*['"]([^'"]+)['"]/);
        return m ? 'https://lk1.supremejav.com/supjav.php?c=' + m[1].split('').reverse().join('') : null;
    }

    async function extractJavSb(iframe) {
        const src = iframe.src || iframe.getAttribute('src');
        let fileId;
        try { fileId = new URL(src, location.origin).searchParams.get('src'); } catch (e) { const m = src.match(/[?&]src=([^&]+)/); fileId = m ? m[1] : null; }
        if (!fileId) return null;
        console.log('[Miss_Player POC] Jav.sb 资源 ID:', fileId);
        showTopBanner('正在获取 Jav.sb 播放鉴权...', '#3b82f6');
        try {
            const tj = JSON.parse(await gmFetch('https://jav.sb/token.php?file=' + fileId));
            const ky_ = fileId + '@' + tj.ts;
            let sign = ky_;
            try { const fn = gw.encrypt; if (typeof fn === 'function') sign = fn(ky_); } catch (e) {}
            const cd = JSON.parse(await gmFetch(`https://jav.sb/save_m3u8_cache.php?file=${fileId}&token=${tj.token}&ts=${tj.ts}&sign=${sign}`));
            console.log('[Miss_Player POC] Jav.sb Cache 响应:', cd);

            const ss = [];
            if (cd.m3u8_file) {
                const p = cd.m3u8_file + '&sign=' + sign;
                const m3u8Url = p.startsWith('http') ? p : 'https://jav.sb' + p;
                showTopBanner('正在净化 Jav.sb 播放切片...', '#3b82f6');
                const rawM3u8 = await gmFetch(m3u8Url);
                const cleanM3u8 = await sanitizeM3u8Playlist(rawM3u8);
                const blob = new Blob([cleanM3u8], { type: 'application/vnd.apple.mpegurl' });
                const cleanUrl = URL.createObjectURL(blob);
                ss.push({ src: cleanUrl, label: '1080P 超清流 (Jav.sb)', size: 1080 });
            }
            return ss.length ? ss : null;
        } catch (e) { console.error('[Miss_Player POC] Jav.sb 提取失败:', e); return null; }
    }

    function extractStreamsUniversal(html) {
        const list = [];
        const spM = html.match(/const\s+videoSources\s*=\s*(\[[^\]]+\])/);
        if (spM) { try { Function('"use strict"; return (' + spM[1] + ')')().forEach(s => list.push({ src: s.src, label: s.size + 'P', size: +s.size || 0 })); if (list.length) return list; } catch (e) {} }

        let unpacked = '';
        const pm = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]+?\.split\('\|'\)\)\)/);
        if (pm) { try { unpacked = eval(pm[0].replace(/^eval/, '')); } catch (e) {} }

        [unpacked, html].filter(Boolean).some(text => {
            const lm = text.match(/(?:var\s+)?links\s*=\s*(\{[\s\S]*?\});/);
            if (lm) { try { const lk = Function('"use strict"; return (' + lm[1] + ')')(); if (lk.hls3) list.push({ src: lk.hls3, label: 'SW 高清 (1080P)', size: 1080 }); if (lk.hls2) list.push({ src: lk.hls2, label: 'SW 标清 (720P)', size: 720 }); } catch (e) {} }
            const jm = text.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["'](https?:\/\/[^"']+)["']/i);
            if (jm) list.push({ src: jm[1], label: 'JWPlayer 源', size: 720 });
            (text.match(/https?:\/\/[^\s"'<>]+\.(?:m3u8|txt)(?:\?[^\s"'<>]*)?/gi) || []).forEach(u => { if (!list.some(x => x.src === u)) list.push({ src: u, label: 'HLS 流', size: 720 }); });
            return list.length > 0;
        });
        return list;
    }

    async function extractFromIframe(iframe) {
        if (!iframe || hasExtractedSuccessfully) return;
        const src = iframe.src || iframe.getAttribute('src');
        if (!src || src === 'about:blank' || src === lastProcessedSrc || isExtracting) return;

        isExtracting = true;
        lastProcessedSrc = src;
        console.log('[Miss_Player POC] 发现目标 iframe 并开始解析:', src);
        showTopBanner('正在解析视频流...', '#3b82f6');

        try {
            let sources = null;
            if (host.includes('jav.sb') || src.includes('videojs.html')) {
                sources = await extractJavSb(iframe);
            } else {
                const url = src.startsWith('http') ? src : location.protocol + src;
                let html = await gmFetch(url);
                if (url.includes('supjav.php?l=') || html.includes('var OLID')) {
                    const next = resolveSupjavRedirect(html);
                    if (next) { console.log('[Miss_Player POC] 穿透 SupJav ->', next); html = await gmFetch(next); }
                }
                sources = extractStreamsUniversal(html);
            }

            if (sources && sources.length) {
                sources.sort((a, b) => b.size - a.size);
                extractedSources = sources;
                currentQualityIndex = 0;
                hasExtractedSuccessfully = true;
                if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }

                console.log('%c[Miss_Player POC] 视频流提取成功 (已锁定防抖)!', 'color:#10b981;font-weight:bold;', sources);
                showTopBanner('✓ 成功提取 (' + sources[0].label + ') - 模态框正在就绪自动播放', '#10b981');
                attachHeroOverlay(iframe);
                openModal(true);
                try { iframe.style.opacity = '0.01'; iframe.style.pointerEvents = 'none'; } catch (_) {}
            } else {
                showTopBanner('⚠️ 未能提取到播放流', '#f59e0b');
            }
        } catch (err) {
            console.error('[Miss_Player POC] 提取异常:', err);
            showTopBanner('❌ 拉取失败: ' + err.message, '#ef4444');
        } finally {
            isExtracting = false;
        }
    }

    // ==========================================
    // 大按钮覆盖层
    // ==========================================

    function attachHeroOverlay(iframe) {
        const p = iframe.parentElement || document.getElementById('player') || document.getElementById('mvspan_2');
        if (!p || p.querySelector('#poc-hero-overlay')) return;
        p.style.position = 'relative';
        const h = document.createElement('div');
        h.id = 'poc-hero-overlay';
        h.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.88);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;cursor:pointer;backdrop-filter:blur(6px);';
        h.innerHTML = '<div style="background:#ec4899;color:#fff;padding:14px 28px;border-radius:30px;font-size:16px;font-weight:bold;box-shadow:0 8px 25px rgba(236,72,153,.6);display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">▶</span> 立即进入 Miss_Player 纯净播放</div><div style="color:#e4e4e7;font-size:12px;margin-top:10px;">去广告 • 自动起播 • 进度快进快退</div>';
        h.onclick = function () {
            openModal(false, true);
        };
        p.appendChild(h);
    }

    // ==========================================
    // 模态框播放器
    // ==========================================

    function fmt(s) {
        if (!s || isNaN(s)) return '00:00';
        s = Math.floor(s);
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        const p = n => String(n).padStart(2, '0');
        return h ? h + ':' + p(m) + ':' + p(ss) : p(m) + ':' + p(ss);
    }

    function createModalPlayer() {
        if (modalElements) return modalElements;

        const ov = document.createElement('div');
        ov.id = 'poc-player-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:2147483640;display:none;justify-content:center;align-items:center;opacity:0;transition:opacity .2s;';

        const md = document.createElement('div');
        md.id = 'poc-player-modal';
        md.style.cssText = 'width:94%;max-width:1100px;background:#18181b;border-radius:12px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.1);display:flex;flex-direction:column;transform:scale(.96);transition:transform .2s;position:relative;';

        const t = document.title ? document.title.split('-')[0].trim() : 'Miss_Player 纯净播放';

        md.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#27272a;color:#f4f4f5;border-bottom:1px solid #3f3f46;">
            <div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">
                <span style="color:#ec4899;margin-right:6px;">⚡</span>${t}
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <div id="poc-quality-bar" style="display:flex;gap:6px;"></div>
                <button id="poc-close-btn" style="background:#3f3f46;border:none;color:#f4f4f5;font-size:16px;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;" title="关闭 (Esc)">✕</button>
            </div>
        </div>
        <div style="position:relative;background:#000;width:100%;height:60vh;min-height:360px;max-height:660px;display:flex;justify-content:center;align-items:center;cursor:pointer;" id="poc-video-wrap">
            <video id="poc-core-video" style="width:100%;height:100%;object-fit:contain;background:#000;" playsinline webkit-playsinline></video>
            <!-- 静音提示浮层 -->
            <div id="poc-unmute-badge" style="position:absolute;top:16px;left:16px;background:rgba(236,72,153,.92);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:bold;display:none;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,.6);z-index:10;cursor:pointer;">
                <span>🔊</span> 浏览器已静音自动起播，点击此处解除静音
            </div>
            <!-- 居中暂停/播放大图标 -->
            <div id="poc-center-play-icon" style="position:absolute;width:64px;height:64px;background:rgba(0,0,0,.65);border-radius:50%;display:none;justify-content:center;align-items:center;color:#fff;font-size:28px;pointer-events:none;transition:opacity .2s;">▶</div>
        </div>
        <div style="padding:14px 20px;background:#18181b;display:flex;flex-direction:column;gap:12px;user-select:none;">
            <!-- 进度条 -->
            <div style="display:flex;align-items:center;gap:14px;">
                <span id="poc-time-cur" style="color:#e4e4e7;font-size:13px;font-variant-numeric:tabular-nums;min-width:48px;">00:00</span>
                <input type="range" id="poc-seek-bar" min="0" max="100" value="0" step="0.1" style="flex:1;accent-color:#ec4899;cursor:pointer;height:6px;">
                <span id="poc-time-dur" style="color:#71717a;font-size:13px;font-variant-numeric:tabular-nums;min-width:48px;">00:00</span>
            </div>
            <!-- 控制按钮栏 -->
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <button id="poc-play-btn" style="background:#ec4899;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:13px;cursor:pointer;min-width:58px;">播放</button>
                    <button class="poc-step-btn" data-step="-60" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">-60s</button>
                    <button class="poc-step-btn" data-step="-10" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">-10s</button>
                    <button class="poc-step-btn" data-step="10" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">+10s</button>
                    <button class="poc-step-btn" data-step="60" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">+60s</button>
                </div>
                <!-- 章节定位 -->
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="color:#71717a;font-size:12px;">定位:</span>
                    <button class="poc-pct-btn" data-pct="0.1" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">10%</button>
                    <button class="poc-pct-btn" data-pct="0.25" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">25%</button>
                    <button class="poc-pct-btn" data-pct="0.5" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">50%</button>
                    <button class="poc-pct-btn" data-pct="0.75" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">75%</button>
                    <button class="poc-pct-btn" data-pct="0.9" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">90%</button>
                </div>
                <!-- 音量、倍速与全屏 -->
                <div style="display:flex;align-items:center;gap:8px;">
                    <button id="poc-mute-btn" style="background:#27272a;color:#f4f4f5;border:none;padding:5px 8px;border-radius:6px;font-size:12px;cursor:pointer;" title="静音切换">🔊</button>
                    <select id="poc-speed-select" style="background:#27272a;color:#f4f4f5;border:none;padding:5px 8px;border-radius:6px;font-size:12px;cursor:pointer;">
                        <option value="0.75">0.75x</option><option value="1.0" selected>1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2.0">2.0x</option>
                    </select>
                    <button id="poc-fullscreen-btn" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;">全屏</button>
                </div>
            </div>
        </div>`;

        ov.appendChild(md);
        (document.body || document.documentElement).appendChild(ov);

        const v = md.querySelector('#poc-core-video');
        const vw = md.querySelector('#poc-video-wrap');
        const pb = md.querySelector('#poc-play-btn');
        const sb = md.querySelector('#poc-seek-bar');
        const tc = md.querySelector('#poc-time-cur');
        const td = md.querySelector('#poc-time-dur');
        const cb = md.querySelector('#poc-close-btn');
        const sp = md.querySelector('#poc-speed-select');
        const fs = md.querySelector('#poc-fullscreen-btn');
        const mb = md.querySelector('#poc-mute-btn');
        const ub = md.querySelector('#poc-unmute-badge');
        const cpi = md.querySelector('#poc-center-play-icon');

        function doPlay() {
            const p = v.play();
            if (p !== undefined && typeof p.then === 'function') {
                p.then(() => {
                    console.log('[Miss_Player POC] ▶️ 播放成功 (muted:', v.muted, ')');
                    pb.textContent = '暂停';
                    cpi.style.display = 'none';
                    if (v.muted) ub.style.display = 'flex';
                }).catch(err => {
                    if (err.name === 'AbortError') {
                        const onReady = () => {
                            v.removeEventListener('canplay', onReady);
                            v.play().catch(() => {});
                        };
                        v.addEventListener('canplay', onReady);
                        return;
                    }
                    console.warn('[Miss_Player POC] 浏览器限制有声起播，降级为静音自动播放:', err.name);
                    v.muted = true;
                    v.play().then(() => {
                        console.log('[Miss_Player POC] ▶️ 静音起播成功!');
                        pb.textContent = '暂停';
                        cpi.style.display = 'none';
                        ub.style.display = 'flex';
                        mb.textContent = '🔇';
                    }).catch(e2 => {
                        console.warn('[Miss_Player POC] 自动起播等待用户点击');
                        pb.textContent = '播放';
                        cpi.style.display = 'flex';
                    });
                });
            }
        }

        function doPause() {
            v.pause();
            pb.textContent = '播放';
            cpi.style.display = 'flex';
        }

        function togglePlay() {
            if (v.paused) doPlay();
            else doPause();
        }

        function unmute() {
            v.muted = false;
            ub.style.display = 'none';
            mb.textContent = '🔊';
            console.log('[Miss_Player POC] 🔊 已解除静音');
            if (v.paused) doPlay();
        }

        pb.onclick = (e) => { e.stopPropagation(); togglePlay(); };
        vw.onclick = (e) => {
            if (e.target === ub || ub.contains(e.target)) {
                unmute();
                return;
            }
            togglePlay();
        };
        ub.onclick = (e) => { e.stopPropagation(); unmute(); };

        v.onplay = () => { pb.textContent = '暂停'; cpi.style.display = 'none'; };
        v.onpause = () => { pb.textContent = '播放'; cpi.style.display = 'flex'; };

        mb.onclick = () => {
            v.muted = !v.muted;
            mb.textContent = v.muted ? '🔇' : '🔊';
            if (!v.muted) ub.style.display = 'none';
        };

        v.ontimeupdate = () => {
            if (v.duration && !sb.matches(':active')) {
                sb.value = (v.currentTime / v.duration) * 100;
                tc.textContent = fmt(v.currentTime);
                td.textContent = fmt(v.duration);
            }
        };

        sb.oninput = () => {
            if (v.duration) tc.textContent = fmt((sb.value / 100) * v.duration);
        };
        sb.onchange = () => {
            if (v.duration) {
                v.currentTime = (sb.value / 100) * v.duration;
                if (v.paused) doPlay();
            }
        };

        md.querySelectorAll('.poc-step-btn').forEach(b => {
            b.onclick = (e) => {
                e.stopPropagation();
                if (v.duration) {
                    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + +b.dataset.step));
                    if (v.paused) doPlay();
                }
            };
        });

        md.querySelectorAll('.poc-pct-btn').forEach(b => {
            b.onclick = (e) => {
                e.stopPropagation();
                if (v.duration) {
                    v.currentTime = v.duration * +b.dataset.pct;
                    if (v.paused) doPlay();
                }
            };
        });

        sp.onchange = () => { v.playbackRate = +sp.value || 1; };
        fs.onclick = () => {
            if (!document.fullscreenElement) md.requestFullscreen().catch(() => v.requestFullscreen());
            else document.exitFullscreen();
        };

        cb.onclick = closeModal;
        ov.onclick = (e) => { if (e.target === ov) closeModal(); };

        window.addEventListener('keydown', (e) => {
            if (!isModalOpen) return;
            if (e.key === 'Escape') closeModal();
            else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlay(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); if (v.duration) v.currentTime = Math.min(v.duration, v.currentTime + (e.shiftKey ? 60 : 10)); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); if (v.duration) v.currentTime = Math.max(0, v.currentTime - (e.shiftKey ? 60 : 10)); }
            else if (e.key === 'm' || e.key === 'M') { mb.click(); }
        });

        modalElements = {
            overlay: ov,
            modal: md,
            video: v,
            qualityBar: md.querySelector('#poc-quality-bar'),
            unmuteBadge: ub,
            doPlay,
            doPause,
            unmute
        };
        return modalElements;
    }

    async function loadHlsStream(source, preserveTime, forceUnmute) {
        const els = createModalPlayer();
        const video = els.video, qualityBar = els.qualityBar;
        const lastTime = preserveTime ? (video.currentTime || 0) : 0;

        console.log('[Miss_Player POC] 🚀 开始载入视频流:', source.label, source.src);

        const qIdx = source.src.indexOf('?');
        currentStreamQuery = qIdx !== -1 ? source.src.substring(qIdx) : '';

        qualityBar.innerHTML = '';
        extractedSources.forEach((s, idx) => {
            const btn = document.createElement('button');
            btn.textContent = s.label;
            btn.style.cssText = 'background:' + (s.src === source.src ? '#ec4899' : '#3f3f46') + ';color:#fff;border:none;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;';
            btn.onclick = (e) => {
                e.stopPropagation();
                currentQualityIndex = idx;
                loadHlsStream(s, true, true);
            };
            qualityBar.appendChild(btn);
        });

        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }

        if (!gw.__MissPlayerLoader) {
            injectPageLoader();
            await new Promise(r => setTimeout(r, 50));
        }

        const H = await ensureHlsLoaded();

        if (H && H.isSupported() && gw.__MissPlayerLoader) {
            console.log('[Miss_Player POC] 🎬 初始化 Hls.js 实例 (Loader: GMBridgeLoader, Worker: false)');

            hlsInstance = new H({
                loader: gw.__MissPlayerLoader,
                enableWorker: false,          // 核心修复: 禁用 Worker 规避页面 CSP 拦截导致解复用器错乱
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                autoStartLoad: true
            });

            hlsInstance.loadSource(source.src);
            hlsInstance.attachMedia(video);

            hlsInstance.on(H.Events.MANIFEST_PARSED, function () {
                console.log('%c[Miss_Player POC] ✅ M3U8 解析完毕，立即触发自动播放!', 'color:#10b981; font-weight:bold; font-size:14px;');
                showTopBanner('▶ 自动播放中 - ' + source.label, '#10b981');
                if (lastTime > 0) video.currentTime = lastTime;
                if (forceUnmute) video.muted = false;
                els.doPlay();
            });

            hlsInstance.on(H.Events.FRAG_LOADED, function (ev, data) {
                console.log('[Miss_Player POC] ✅ 分片已载入: sn=' + data.frag.sn + ', time=[' + data.frag.start + ' - ' + (data.frag.start + data.frag.duration) + 's]');
            });

            hlsInstance.on(H.Events.FRAG_BUFFERED, function (ev, data) {
                console.log('[Miss_Player POC] 📦 分片已写入缓冲 (sn=' + data.frag.sn + ')');
                els.doPlay();
            });

            hlsInstance.on(H.Events.ERROR, function (ev, data) {
                console.warn('[Miss_Player POC] HLS 事件通知:', data.type, data.details, 'fatal:', data.fatal);
                if (data.fatal) {
                    if (data.type === H.ErrorTypes.NETWORK_ERROR) {
                        console.warn('[Miss_Player POC] 网络异常，自动重试恢复...');
                        hlsInstance.startLoad();
                    } else if (data.type === H.ErrorTypes.MEDIA_ERROR) {
                        console.warn('[Miss_Player POC] 媒体异常，执行恢复...');
                        hlsInstance.recoverMediaError();
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source.src;
            if (lastTime > 0) video.currentTime = lastTime;
            if (forceUnmute) video.muted = false;
            els.doPlay();
        } else {
            console.error('[Miss_Player POC] 播放器引擎初始化失败');
            showTopBanner('❌ 播放引擎加载失败', '#ef4444');
        }
    }

    function openModal(isAuto, forceUnmute) {
        if (!extractedSources.length) {
            if (!isAuto) triggerExtraction();
            return;
        }
        const els = createModalPlayer();
        els.overlay.style.display = 'flex';
        setTimeout(() => { els.overlay.style.opacity = '1'; els.modal.style.transform = 'scale(1)'; }, 10);
        isModalOpen = true;
        document.body.style.overflow = 'hidden';

        if (!hlsInstance) {
            loadHlsStream(extractedSources[currentQualityIndex], false, forceUnmute);
        } else {
            if (forceUnmute) els.unmute();
            els.doPlay();
        }
    }

    function closeModal() {
        if (!modalElements) return;
        modalElements.overlay.style.opacity = '0';
        modalElements.modal.style.transform = 'scale(.96)';
        if (modalElements.doPause) modalElements.doPause();
        setTimeout(() => { modalElements.overlay.style.display = 'none'; document.body.style.overflow = ''; isModalOpen = false; }, 200);
    }

    // ==========================================
    // 扫描与探测
    // ==========================================

    function triggerExtraction() {
        if (hasExtractedSuccessfully) return false;
        const frames = document.querySelectorAll('iframe');
        for (let i = 0; i < frames.length; i++) {
            const s = frames[i].src || frames[i].getAttribute('src');
            if (s && (s.includes('supjav.php') || s.includes('supremejav') || s.includes('mmsi02') || s.includes('fc2stream') || s.includes('turbovid') || s.includes('play.php') || s.includes('streamwish') || s.includes('videojs.html') || (frames[i].closest && (frames[i].closest('#mvspan_2') || frames[i].closest('#player'))))) {
                extractFromIframe(frames[i]);
                return true;
            }
        }
        return false;
    }

    function init() {
        showTopBanner(host + ' POC 已激活，正在就绪自动播放...');
        injectPageLoader();
        scanInterval = setInterval(() => {
            if (hasExtractedSuccessfully) {
                if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
                return;
            }
            triggerExtraction();
        }, 800);

        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-server,.btn-cd,#mvspan_1,.cd-server,.tab-server,.btn-stream,.tab-link')) {
                lastProcessedSrc = '';
                hasExtractedSuccessfully = false;
                if (!scanInterval) {
                    scanInterval = setInterval(triggerExtraction, 800);
                }
                setTimeout(triggerExtraction, 800);
                setTimeout(triggerExtraction, 2200);
            }
        });
    }

    const api = {
        open: () => openModal(false, true),
        extract: () => { lastProcessedSrc = ''; hasExtractedSuccessfully = false; triggerExtraction(); },
        getSources: () => extractedSources
    };
    gw.MissPlayerPOC = api;
    window.MissPlayerPOC = api;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
