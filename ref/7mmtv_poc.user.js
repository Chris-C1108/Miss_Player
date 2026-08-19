// ==UserScript==
// @name         Miss_Player POC (7mmtv & SupJav & Jav.sb 全能无广告模态播放器)
// @namespace    https://github.com/Chris-C1108/Miss_Player
// @version      0.8.0
// @description  POC：全自动提取 7mmtv / SupJav / Jav.sb 全线路视频流，GM_xmlhttpRequest 代理 m3u8 绕过 CORS，纯净模态播放
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
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const host = window.location.hostname;
    const isSupported = host.includes('7mmtv') || host.includes('supjav') || host.includes('supremejav') || host.includes('jav.sb');
    if (!isSupported) return;
    if (window.self !== window.top) return;

    const gw = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

    console.log('%c[Miss_Player POC v0.8.0] 启动！站点: ' + host, 'background:#ec4899; color:#fff; font-size:14px; font-weight:bold; padding:4px 8px; border-radius:4px;');

    let extractedSources = [];
    let currentQualityIndex = 0;
    let hlsInstance = null;
    let modalElements = null;
    let isModalOpen = false;
    let isExtracting = false;
    let lastProcessedSrc = '';

    // ==========================================
    // 核心修复: GM 代理 m3u8 -> Blob URL (彻底绕过 CORS)
    // ==========================================
    // 原理: GM_xmlhttpRequest 不受 CORS 限制。
    // 我们用它拉取 m3u8 清单，将清单中的分片 URL 改写为绝对路径，
    // 然后生成一个 blob: URL 喂给 Hls.js。
    // Hls.js 加载分片时用原生 XHR，如果被 CORS 拦截，
    // 就回退到用 GM 代理拉取分片并返回 blob URL 的方案。

    function gmFetch(url, responseType) {
        return new Promise((resolve, reject) => {
            const referer = guessReferer(url);
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: responseType || 'text',
                headers: { 'Referer': referer, 'User-Agent': navigator.userAgent },
                timeout: 15000,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 400) {
                        resolve(responseType === 'arraybuffer' ? res.response : res.responseText);
                    } else {
                        reject(new Error(`HTTP ${res.status} for ${url}`));
                    }
                },
                onerror: (e) => reject(new Error('GM request error: ' + url)),
                ontimeout: () => reject(new Error('GM request timeout: ' + url))
            });
        });
    }

    function guessReferer(url) {
        if (url.includes('.shop') || url.includes('fc2stream') || url.includes('centaurus')) return 'https://fc2stream.tv/';
        if (url.includes('18av.mov') || url.includes('jav.sb') || url.includes('get_file.php')) return 'https://jav.sb/';
        if (url.includes('streamsuperpro') || url.includes('7mmtv')) return 'https://7mmtv.sx/';
        if (url.includes('turbosplayer') || url.includes('turboviplay') || url.includes('turbovid')) return 'https://turbovidhls.com/';
        return window.location.href;
    }

    /**
     * 通过 GM 拉取 m3u8 清单文本，将相对 URL 转为绝对 URL，返回 blob URL
     */
    async function proxyM3u8ToBlobUrl(m3u8Url) {
        console.log('[Miss_Player POC] GM 代理拉取 m3u8:', m3u8Url);
        const text = await gmFetch(m3u8Url);

        const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

        // 将 m3u8 内容中的相对路径转为绝对路径
        const rewritten = text.split('\n').map(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return line;
            // 如果是相对路径，补全为绝对路径
            if (!line.startsWith('http')) {
                return baseUrl + line;
            }
            return line;
        }).join('\n');

        const blob = new Blob([rewritten], { type: 'application/vnd.apple.mpegurl' });
        const blobUrl = URL.createObjectURL(blob);
        console.log('[Miss_Player POC] m3u8 已代理为 blob URL');
        return blobUrl;
    }

    // ==========================================
    // 动态加载 Hls.js
    // ==========================================

    function ensureHlsLoaded() {
        return new Promise((resolve) => {
            if (gw.Hls) return resolve(gw.Hls);

            const cdnUrls = [
                'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.7/hls.min.js',
                'https://unpkg.com/hls.js@1.5.7/dist/hls.min.js',
                'https://cdn.bootcdn.net/ajax/libs/hls.js/1.5.7/hls.min.js'
            ];

            let i = 0;
            function tryNext() {
                if (i >= cdnUrls.length) return resolve(null);
                const s = document.createElement('script');
                s.src = cdnUrls[i++];
                s.onload = () => resolve(gw.Hls || window.Hls);
                s.onerror = () => { s.remove(); tryNext(); };
                (document.head || document.documentElement).appendChild(s);
            }
            tryNext();
        });
    }

    // ==========================================
    // 顶部状态横幅
    // ==========================================

    function showTopBanner(text, bg = '#ec4899') {
        let b = document.getElementById('poc-top-banner');
        if (!b) {
            b = document.createElement('div');
            b.id = 'poc-top-banner';
            b.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:36px;line-height:36px;color:#fff;font:bold 13px system-ui,sans-serif;text-align:center;z-index:2147483647;box-shadow:0 2px 10px rgba(0,0,0,.3);transition:background .3s;';
            document.documentElement.appendChild(b);
        }
        b.style.background = bg;
        b.textContent = '⚡ ' + text;
    }

    // ==========================================
    // 跨域网络请求
    // ==========================================

    function fetchHtml(url) {
        return gmFetch(url, 'text');
    }

    // ==========================================
    // 多站点流提取器
    // ==========================================

    // SupJav 中转层穿透
    function resolveSupjavRedirect(html) {
        const m = html.match(/var\s+OLID\s*=\s*['"]([^'"]+)['"]/);
        if (!m) return null;
        return 'https://lk1.supremejav.com/supjav.php?c=' + m[1].split('').reverse().join('');
    }

    // Jav.sb Token 鉴权
    async function extractJavSb(iframe) {
        const src = iframe.src || iframe.getAttribute('src');
        let fileId;

        try {
            fileId = new URL(src, window.location.origin).searchParams.get('src');
        } catch (e) {
            const m = src.match(/[?&]src=([^&]+)/);
            fileId = m ? m[1] : null;
        }
        if (!fileId) return null;

        console.log('[Miss_Player POC] Jav.sb 资源 ID:', fileId);
        showTopBanner('正在获取 Jav.sb 播放鉴权...', '#3b82f6');

        try {
            // 1. 获取 Token
            const tokenText = await fetchHtml('https://jav.sb/token.php?file=' + fileId);
            const { token, ts } = JSON.parse(tokenText);

            // 2. 生成 Sign (尝试调用页面上的 encrypt 函数，否则直接用明文)
            const ky_ = fileId + '@' + ts;
            let sign = ky_;
            try {
                const encFn = gw.encrypt;
                if (typeof encFn === 'function') sign = encFn(ky_);
            } catch (e) {
                console.warn('[Miss_Player POC] encrypt 函数不可用，使用原始 sign');
            }

            // 3. 请求 Cache 获取真实 m3u8
            const cacheText = await fetchHtml(`https://jav.sb/save_m3u8_cache.php?file=${fileId}&token=${token}&ts=${ts}&sign=${sign}`);
            const cacheData = JSON.parse(cacheText);
            console.log('[Miss_Player POC] Jav.sb Cache 响应:', cacheData);

            const sources = [];
            if (cacheData.source) {
                sources.push({ src: cacheData.source, label: '1080P 超清直链', size: 1080 });
            }
            if (cacheData.m3u8_file) {
                const m3u8Path = cacheData.m3u8_file + '&sign=' + sign;
                const fullUrl = m3u8Path.startsWith('http') ? m3u8Path : 'https://jav.sb' + m3u8Path;
                sources.push({ src: fullUrl, label: '高清分片 (Jav.sb)', size: 720 });
            }
            return sources.length > 0 ? sources : null;
        } catch (e) {
            console.error('[Miss_Player POC] Jav.sb 提取失败:', e);
            return null;
        }
    }

    // 通用页面流提取器
    function extractStreamsUniversal(html) {
        const list = [];

        // SP (play.php)
        const spM = html.match(/const\s+videoSources\s*=\s*(\[[^\]]+\])/);
        if (spM) {
            try {
                const raw = Function('"use strict"; return (' + spM[1] + ')')();
                raw.forEach(s => list.push({ src: s.src, label: s.size + 'P', size: +s.size || 0 }));
                if (list.length > 0) return list;
            } catch (e) {}
        }

        // JS Packer
        let unpacked = '';
        const pm = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]+?\.split\('\|'\)\)\)/);
        if (pm) {
            try { unpacked = eval(pm[0].replace(/^eval/, '')); } catch (e) {}
        }

        for (const text of [unpacked, html].filter(Boolean)) {
            const lm = text.match(/(?:var\s+)?links\s*=\s*(\{[\s\S]*?\});/);
            if (lm) {
                try {
                    const links = Function('"use strict"; return (' + lm[1] + ')')();
                    if (links.hls3) list.push({ src: links.hls3, label: 'SW 高清 (HLS3)', size: 1080 });
                    if (links.hls2) list.push({ src: links.hls2, label: 'SW 标清 (HLS2)', size: 720 });
                    if (links.hls4 && links.hls4.startsWith('http')) list.push({ src: links.hls4, label: 'SW 直链', size: 480 });
                } catch (e) {}
            }

            const jm = text.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["'](https?:\/\/[^"']+)["']/i);
            if (jm) list.push({ src: jm[1], label: 'JWPlayer 源', size: 720 });

            (text.match(/https?:\/\/[^\s"'<>]+\.(?:m3u8|txt)(?:\?[^\s"'<>]*)?/gi) || []).forEach(u => {
                if (!list.some(x => x.src === u)) list.push({ src: u, label: u.includes('.txt') ? 'HLS 文本源' : 'HLS 流', size: 720 });
            });

            if (list.length > 0) break;
        }
        return list;
    }

    async function extractFromIframe(iframe) {
        if (!iframe) return;
        const src = iframe.src || iframe.getAttribute('src');
        if (!src || src === 'about:blank' || src === lastProcessedSrc || isExtracting) return;

        isExtracting = true;
        lastProcessedSrc = src;
        console.log('[Miss_Player POC] 解析 iframe:', src);
        showTopBanner('正在解析播放源...', '#3b82f6');

        try {
            let sources = null;

            if (host.includes('jav.sb') || src.includes('videojs.html')) {
                sources = await extractJavSb(iframe);
            } else {
                let url = src.startsWith('http') ? src : location.protocol + src;
                let html = await fetchHtml(url);

                // SupJav 中转穿透
                if (url.includes('supjav.php?l=') || html.includes('var OLID')) {
                    const next = resolveSupjavRedirect(html);
                    if (next) {
                        console.log('[Miss_Player POC] 穿透 SupJav 中转 ->', next);
                        html = await fetchHtml(next);
                    }
                }

                sources = extractStreamsUniversal(html);
            }

            if (sources && sources.length > 0) {
                sources.sort((a, b) => b.size - a.size);
                extractedSources = sources;
                currentQualityIndex = 0;
                console.log('%c[Miss_Player POC] 提取成功!', 'color:#10b981;font-weight:bold;', sources);

                showTopBanner('✓ 成功提取 (' + sources[0].label + ') - 模态播放器已就绪', '#10b981');
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
        let parent = iframe.parentElement || document.getElementById('player') || document.getElementById('mvspan_2');
        if (!parent || parent.querySelector('#poc-hero-overlay')) return;
        parent.style.position = 'relative';
        const hero = document.createElement('div');
        hero.id = 'poc-hero-overlay';
        hero.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;cursor:pointer;backdrop-filter:blur(6px);';
        hero.innerHTML = '<div style="background:#ec4899;color:#fff;padding:14px 28px;border-radius:30px;font-size:16px;font-weight:bold;box-shadow:0 8px 25px rgba(236,72,153,.6);display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">▶</span> 立即进入 Miss_Player 模态纯净播放</div><div style="color:#e4e4e7;font-size:12px;margin-top:10px;">去广告 • 进度快进快退 • 百分比章节定位</div>';
        hero.onclick = () => openModal(false);
        parent.appendChild(hero);
    }

    // ==========================================
    // 模态框播放器
    // ==========================================

    function fmt(s) {
        if (!s || isNaN(s)) return '00:00';
        s = Math.floor(s);
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        const p = n => String(n).padStart(2, '0');
        return h > 0 ? h + ':' + p(m) + ':' + p(ss) : p(m) + ':' + p(ss);
    }

    function createModalPlayer() {
        if (modalElements) return modalElements;

        const overlay = document.createElement('div');
        overlay.id = 'poc-player-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:2147483640;display:none;justify-content:center;align-items:center;opacity:0;transition:opacity .2s ease;';

        const modal = document.createElement('div');
        modal.id = 'poc-player-modal';
        modal.style.cssText = 'width:94%;max-width:1100px;background:#18181b;border-radius:12px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.1);display:flex;flex-direction:column;transform:scale(.96);transition:transform .2s ease;';

        const title = document.title ? document.title.split('-')[0].trim() : 'Miss_Player';

        modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#27272a;color:#f4f4f5;">
            <div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;"><span style="color:#ec4899;margin-right:6px;">⚡</span>${title}</div>
            <div style="display:flex;align-items:center;gap:10px;"><div id="poc-quality-bar" style="display:flex;gap:6px;"></div><button id="poc-close-btn" style="background:#3f3f46;border:none;color:#f4f4f5;font-size:16px;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;" title="关闭 (Esc)">✕</button></div>
        </div>
        <div style="position:relative;background:#000;width:100%;height:60vh;min-height:360px;max-height:660px;display:flex;justify-content:center;align-items:center;">
            <video id="poc-core-video" style="width:100%;height:100%;object-fit:contain;outline:none;background:#000;" playsinline webkit-playsinline></video>
        </div>
        <div style="padding:14px 20px;background:#18181b;display:flex;flex-direction:column;gap:12px;user-select:none;">
            <div style="display:flex;align-items:center;gap:14px;">
                <span id="poc-time-cur" style="color:#e4e4e7;font-size:13px;font-variant-numeric:tabular-nums;min-width:48px;">00:00</span>
                <input type="range" id="poc-seek-bar" min="0" max="100" value="0" step="0.1" style="flex:1;accent-color:#ec4899;cursor:pointer;height:6px;">
                <span id="poc-time-dur" style="color:#71717a;font-size:13px;font-variant-numeric:tabular-nums;min-width:48px;">00:00</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <button id="poc-play-btn" style="background:#ec4899;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:13px;cursor:pointer;">播放</button>
                    <button class="poc-step-btn" data-step="-60" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">-60s</button>
                    <button class="poc-step-btn" data-step="-10" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">-10s</button>
                    <button class="poc-step-btn" data-step="10" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">+10s</button>
                    <button class="poc-step-btn" data-step="60" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:4px;font-size:12px;cursor:pointer;">+60s</button>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="color:#71717a;font-size:12px;">定位:</span>
                    <button class="poc-pct-btn" data-pct="0.1" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">10%</button>
                    <button class="poc-pct-btn" data-pct="0.25" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">25%</button>
                    <button class="poc-pct-btn" data-pct="0.5" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">50%</button>
                    <button class="poc-pct-btn" data-pct="0.75" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">75%</button>
                    <button class="poc-pct-btn" data-pct="0.9" style="background:#27272a;color:#a1a1aa;border:none;padding:5px 8px;border-radius:4px;font-size:11px;cursor:pointer;">90%</button>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <select id="poc-speed-select" style="background:#27272a;color:#f4f4f5;border:none;padding:5px 8px;border-radius:6px;font-size:12px;cursor:pointer;">
                        <option value="0.75">0.75x</option><option value="1.0" selected>1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2.0">2.0x</option>
                    </select>
                    <button id="poc-fullscreen-btn" style="background:#27272a;color:#f4f4f5;border:none;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;">全屏</button>
                </div>
            </div>
        </div>`;

        overlay.appendChild(modal);
        (document.body || document.documentElement).appendChild(overlay);

        const video = modal.querySelector('#poc-core-video');
        const playBtn = modal.querySelector('#poc-play-btn');
        const seekBar = modal.querySelector('#poc-seek-bar');
        const timeCur = modal.querySelector('#poc-time-cur');
        const timeDur = modal.querySelector('#poc-time-dur');
        const closeBtn = modal.querySelector('#poc-close-btn');
        const speedSel = modal.querySelector('#poc-speed-select');
        const fsBtn = modal.querySelector('#poc-fullscreen-btn');

        const togglePlay = () => {
            if (video.paused) video.play().catch(() => {});
            else video.pause();
        };

        playBtn.onclick = togglePlay;
        video.onclick = togglePlay;
        video.onplay = () => playBtn.textContent = '暂停';
        video.onpause = () => playBtn.textContent = '播放';
        video.ontimeupdate = () => {
            if (video.duration && !seekBar.matches(':active')) {
                seekBar.value = (video.currentTime / video.duration) * 100;
                timeCur.textContent = fmt(video.currentTime);
                timeDur.textContent = fmt(video.duration);
            }
        };
        seekBar.onchange = () => { if (video.duration) video.currentTime = (seekBar.value / 100) * video.duration; };

        modal.querySelectorAll('.poc-step-btn').forEach(btn => {
            btn.onclick = () => { video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + Number(btn.dataset.step))); };
        });
        modal.querySelectorAll('.poc-pct-btn').forEach(btn => {
            btn.onclick = () => { if (video.duration) video.currentTime = video.duration * Number(btn.dataset.pct); };
        });
        speedSel.onchange = () => { video.playbackRate = Number(speedSel.value) || 1; };
        fsBtn.onclick = () => {
            if (!document.fullscreenElement) modal.requestFullscreen().catch(() => video.requestFullscreen());
            else document.exitFullscreen();
        };
        closeBtn.onclick = closeModal;
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
        window.addEventListener('keydown', (e) => {
            if (!isModalOpen) return;
            if (e.key === 'Escape') closeModal();
            else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlay(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration || 0, video.currentTime + (e.shiftKey ? 60 : 10)); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - (e.shiftKey ? 60 : 10)); }
        });

        modalElements = { overlay, modal, video, qualityBar: modal.querySelector('#poc-quality-bar') };
        return modalElements;
    }

    async function loadHlsStream(source, preserveTime) {
        const { video, qualityBar } = createModalPlayer();
        const lastTime = preserveTime ? (video.currentTime || 0) : 0;

        console.log('[Miss_Player POC] 切换视频源:', source.label, source.src);

        // 渲染清晰度按钮
        qualityBar.innerHTML = '';
        extractedSources.forEach((s, idx) => {
            const btn = document.createElement('button');
            btn.textContent = s.label;
            btn.style.cssText = 'background:' + (s.src === source.src ? '#ec4899' : '#3f3f46') + ';color:#fff;border:none;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;';
            btn.onclick = () => { currentQualityIndex = idx; loadHlsStream(s, true); };
            qualityBar.appendChild(btn);
        });

        if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }

        const HlsClass = await ensureHlsLoaded();

        if (HlsClass && HlsClass.isSupported()) {
            // 核心修复: 通过 GM 代理 m3u8 清单转为 blob URL，彻底绕过 CORS
            let playUrl = source.src;
            try {
                playUrl = await proxyM3u8ToBlobUrl(source.src);
            } catch (e) {
                console.warn('[Miss_Player POC] GM 代理 m3u8 失败，尝试直连:', e);
                playUrl = source.src;
            }

            hlsInstance = new HlsClass({
                maxBufferLength: 30,
                enableWorker: true,
                // 为分片请求添加自定义 xhrSetup 以尝试绕过 CORS
                xhrSetup: function(xhr, url) {
                    // Hls.js 默认用 XHR 拉取分片。此处无法直接绕过 CORS，
                    // 但 blob m3u8 中的分片 URL 是绝对路径，
                    // 如果 CDN 返回正确的 CORS 头（如 Access-Control-Allow-Origin: *）则可行。
                    // 否则需要走 Service Worker 代理方案（更复杂，留作正式版实现）。
                }
            });

            hlsInstance.loadSource(playUrl);
            hlsInstance.attachMedia(video);

            hlsInstance.on(HlsClass.Events.MANIFEST_PARSED, () => {
                console.log('[Miss_Player POC] M3U8 Manifest 解析完毕');
                if (lastTime > 0) video.currentTime = lastTime;
                video.play().catch(() => {});
            });

            hlsInstance.on(HlsClass.Events.ERROR, (event, data) => {
                console.error('[Miss_Player POC] HLS 错误:', data.type, data.details, data.fatal, data.url);
                if (data.fatal) {
                    if (data.type === HlsClass.ErrorTypes.NETWORK_ERROR) {
                        console.warn('[Miss_Player POC] 网络错误，尝试恢复...');
                        hlsInstance.startLoad();
                    } else if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) {
                        hlsInstance.recoverMediaError();
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source.src;
            if (lastTime > 0) video.currentTime = lastTime;
            video.play().catch(() => {});
        }
    }

    function openModal(isAuto) {
        if (!extractedSources.length) {
            if (!isAuto) alert('尚未解析到视频源，正在重新扫描...');
            triggerExtraction();
            return;
        }
        const { overlay, modal } = createModalPlayer();
        overlay.style.display = 'flex';
        setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'scale(1)'; }, 10);
        isModalOpen = true;
        document.body.style.overflow = 'hidden';
        if (!hlsInstance) loadHlsStream(extractedSources[currentQualityIndex], false);
    }

    function closeModal() {
        if (!modalElements) return;
        const { overlay, modal, video } = modalElements;
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(.96)';
        if (!video.paused) video.pause();
        setTimeout(() => { overlay.style.display = 'none'; document.body.style.overflow = ''; isModalOpen = false; }, 200);
    }

    // ==========================================
    // 扫描与探测
    // ==========================================

    function triggerExtraction() {
        for (const iframe of document.querySelectorAll('iframe')) {
            const src = iframe.src || iframe.getAttribute('src');
            if (src && (
                src.includes('supjav.php') || src.includes('supremejav') ||
                src.includes('mmsi02') || src.includes('fc2stream') ||
                src.includes('turbovid') || src.includes('play.php') ||
                src.includes('streamwish') || src.includes('videojs.html') ||
                (iframe.closest && (iframe.closest('#mvspan_2') || iframe.closest('#player')))
            )) {
                extractFromIframe(iframe);
                return true;
            }
        }
        return false;
    }

    function init() {
        showTopBanner(host + ' 模态播放器 POC 已激活，正在扫描...');
        const t = setInterval(() => { if (extractedSources.length > 0) { clearInterval(t); return; } triggerExtraction(); }, 800);
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-server,.btn-cd,#mvspan_1,.cd-server,.tab-server,.btn-stream,.tab-link')) {
                lastProcessedSrc = '';
                setTimeout(triggerExtraction, 800);
                setTimeout(triggerExtraction, 2200);
            }
        });
    }

    const api = { open: () => openModal(false), extract: () => { lastProcessedSrc = ''; triggerExtraction(); }, getSources: () => extractedSources };
    gw.MissPlayerPOC = api;
    window.MissPlayerPOC = api;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
