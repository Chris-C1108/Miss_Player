/**
 * Peach Web 跨站播放接力桥接器 (PeachWebBridge)
 * 
 * 职责：
 * 1. 识别当前页面是否为用户自托管的 Peach Web 实例
 * 2. 多网络入口自适应：自动将当前 Origin 加入地址池，并从 Peach 服务端探测 local/lan/ip 候选
 * 3. 访问 Peach Web 时的零输入自动配对 (同源会话自动签发并落盘 Dedicated Token)
 * 4. WebDAV 媒体库智能巡检与挂载引导 (检查 STRM 目录是否已被加入 Peach 媒体源)
 * 5. 跨站动态即时寻源引擎 (Stream Resolver)：从 Jable / MissAV 动态抓取带合法签名的有效流
 * 6. Peach 原生观看进度与续播状态双向回写管线 (兼容 /api/activity 与 /api/play 账本记录)
 */

import { PeachService, PEACH_KEY_DISMISSED_LIB_ADVICE } from '../../services/PeachService.js';
import { fetchWithTransport } from '../../utils/http.js';
import { findVideoElement } from '../../utils/dom.js';
import { matchAvCodeFromText, getVideoCodeFromUrl } from '../../utils/videoCode.js';
import { getValue, setValue } from '../../utils/storage.js';
import { Toast } from '../../utils/index.js';
import { PeachStreamHUD } from '../ui/PeachStreamHUD.js';

export class PeachWebBridge {
    static initialized = false;
    static _progressTrackerActive = false;
    static _progressTimer = null;
    static _lastReportTime = 0;
    static _accumulatedDelta = 0;
    static _seeksCount = 0;
    static _currentAssetId = 0;

    /**
     * 判断当前页面是否为 Peach Web 实例
     * 基于 Peach 官方静态 HTML 骨架、DOM 结构、本地存储与脚本标识多维交叉判定
     */
    static isPeachInstance() {
        const config = PeachService.getConfig();
        const currentOrigin = window.location.origin;

        // 1. 已配置或已纳管的 Origin 地址池直接命中
        if (config.base && currentOrigin === config.base) {
            return true;
        }
        if (Array.isArray(config.origins) && config.origins.includes(currentOrigin)) {
            return true;
        }

        // 2. 网页标题核心特征（Peach 官方静态模板固定包含 "Peach" 或 "蜜桃"）
        if (document.title && (document.title.includes('Peach') || document.title.includes('蜜桃'))) {
            return true;
        }

        // 3. 官方真实 DOM 骨架特征（web/index.html 源码实证）
        if (document.querySelector('#appRoot') || document.querySelector('[data-batch-dock]')) {
            return true;
        }

        if (document.querySelector('script[src*="peach-app"]') || 
            document.querySelector('link[href*="peach-app"]') ||
            document.querySelector('link[href*="board.css"]')) {
            return true;
        }

        // 4. 本地存储特征（Peach 初始化时必然写入）
        try {
            if (localStorage.getItem('peach.settings.v1') || 
                localStorage.getItem('peach.high-contrast') ||
                sessionStorage.getItem('peach.library')) {
                return true;
            }
        } catch (_) {}

        // 5. Peach 官方元数据与专属 SVG 符号特征
        if (document.querySelector('meta[name="peach-userscript-bridge"]') ||
            document.querySelector('symbol#i-player-play') ||
            document.querySelector('symbol#i-player-volume') ||
            document.querySelector('symbol#i-theater-enter')) {
            return true;
        }

        return false;
    }

    /**
     * 动态探测并启动 Peach Web 桥接
     */
    static detectAndStart() {
        if (this.initialized) return true;

        if (this.isPeachInstance()) {
            this.init();
            return true;
        }

        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            if (this.initialized || attempts > 12) {
                clearInterval(timer);
                return;
            }
            if (this.isPeachInstance()) {
                clearInterval(timer);
                this.init();
            }
        }, 250);

        return false;
    }

    /**
     * 初始化 Peach Web 桥接与自动化管线
     */
    static init() {
        if (this.initialized) return;
        if (!this.isPeachInstance()) return;

        this.initialized = true;
        console.log('[PeachWebBridge] 检测到运行在 Peach Web 实例，启动自动管线...');

        // 1. 多 Origin 自动捕获与活跃地址更新
        PeachService.addOrigin(window.location.origin);
        PeachService.setActiveBase(window.location.origin);

        // 2. 访问 Peach Web 时的零门槛自动配对
        this._autoPairIfNeeded();

        // 3. 异步获取服务端自报的网络拓扑入口 (自动扩充多通道地址池)
        this._syncNetworkTopology();

        // 4. WebDAV 媒体源巡检与引导
        this._checkMediaLibraryAdvice();

        // 5. 监听播放视口与错误接力
        this._setupPlaybackWatcher();
    }

    /**
     * 零门槛同源自动配对
     */
    static async _autoPairIfNeeded() {
        const config = PeachService.getConfig();
        if (config.token && config.enabled) {
            return;
        }

        try {
            console.log('[PeachWebBridge] 正在为 Miss Player 自动配对 Peach 服务端...');
            const configureUrl = `${window.location.origin}/api/configuration/jav-browser`;
            
            let res = await fetchWithTransport(configureUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'enable' }),
                timeout: 8000
            });

            if (res.status >= 400) {
                res = await fetchWithTransport(configureUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'rotate' }),
                    timeout: 8000
                });
            }

            if (res.status >= 200 && res.status < 300) {
                try {
                    const data = JSON.parse(res.html);
                    if (data && data.token) {
                        PeachService.saveConfig({
                            base: window.location.origin,
                            token: data.token,
                            enabled: true
                        });
                        Toast('🎉 Miss Player 已自动完成 Peach 全功能配对！', 3500, 'success');
                        return;
                    }
                } catch (_) {}
            }

            // 降级兜底：未配置云下载网盘无法签发专用令牌时，依然标记当前实例已连接 (STRM 虚拟入库模式)
            PeachService.saveConfig({
                base: window.location.origin,
                enabled: true
            });
            Toast('🎉 已连接 Peach 服务端（STRM 虚拟入库就绪）', 3000, 'success');
        } catch (err) {
            console.warn('[PeachWebBridge] 自动配对轻量提示:', err.message);
        }
    }

    /**
     * 探测 Peach 服务端上报的本地局域网 / mDNS 入口，扩充多候选池
     */
    static async _syncNetworkTopology() {
        try {
            const res = await fetchWithTransport(`${window.location.origin}/api/configuration`, {
                timeout: 8000
            });
            if (res.status >= 200 && res.status < 300) {
                const data = JSON.parse(res.html);
                if (data && data.network) {
                    PeachService.syncNetworkAddresses(data.network);
                    console.log('[PeachWebBridge] 已自动同步 Peach 多网络入口候选池:', PeachService.getOrigins());
                }
            }
        } catch (_) {}
    }

    /**
     * 智能检查 WebDAV STRM 目录是否已作为媒体源添加到 Peach 中
     */
    static async _checkMediaLibraryAdvice() {
        const dismissed = Boolean(getValue(PEACH_KEY_DISMISSED_LIB_ADVICE, false));
        if (dismissed) return;

        try {
            const config = PeachService.getConfig();
            const targetStrmDir = config.strmDir || '/Media/STRM/';
            const keyword = targetStrmDir.replace(/^\/+|\/+$/g, '').toLowerCase() || 'strm';

            const res = await fetchWithTransport(`${window.location.origin}/api/libraries`, {
                timeout: 8000
            });

            if (res.status < 200 || res.status >= 300) return;
            const data = JSON.parse(res.html);
            const libraries = Array.isArray(data?.libraries) ? data.libraries : [];

            let found = false;
            for (const lib of libraries) {
                const roots = Array.isArray(lib.roots) ? lib.roots : [];
                for (const r of roots) {
                    const loc = String(r.location || '').toLowerCase();
                    const rootPath = String(r.root || r.path || '').toLowerCase();
                    if (loc.includes(keyword) || rootPath.includes(keyword) || loc.includes('strm') || rootPath.includes('strm')) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }

            if (!found) {
                setTimeout(() => this._renderLibraryAdvisorCard(targetStrmDir), 1500);
            }
        } catch (err) {
            console.warn('[PeachWebBridge] 媒体库检查略过:', err.message);
        }
    }

    /**
     * 在页面右下角渲染 Apple 风格媒体库建议悬浮卡片
     */
    static _renderLibraryAdvisorCard(strmDir) {
        if (document.querySelector('.tm-peach-advisor-card')) return;

        const card = document.createElement('div');
        card.className = 'tm-peach-advisor-card';
        card.innerHTML = `
            <div class="tm-peach-advisor-header">
                <div class="tm-peach-advisor-title">
                    <span>🍑</span>
                    <span>Miss Player · 媒体源建议</span>
                </div>
                <button type="button" class="tm-peach-advisor-close" aria-label="关闭">✕</button>
            </div>
            <div class="tm-peach-advisor-desc">
                检测到 Peach 媒体库尚未包含虚拟视频目录。建议将 WebDAV 写入路径 <span class="tm-peach-advisor-path">${strmDir}</span> 登记到 Peach 媒体库，即可在入库时享受自动封面刮削与秒级点播！
            </div>
            <div class="tm-peach-advisor-actions">
                <button type="button" class="tm-peach-advisor-btn-primary tm-peach-advisor-go">复制路径并前往设置</button>
                <button type="button" class="tm-peach-advisor-btn-sub tm-peach-advisor-later">稍后</button>
                <button type="button" class="tm-peach-advisor-btn-sub tm-peach-advisor-never">不再提醒</button>
            </div>
        `;

        const closeBtn = card.querySelector('.tm-peach-advisor-close');
        const goBtn = card.querySelector('.tm-peach-advisor-go');
        const laterBtn = card.querySelector('.tm-peach-advisor-later');
        const neverBtn = card.querySelector('.tm-peach-advisor-never');

        const removeCard = () => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            setTimeout(() => card.remove(), 250);
        };

        closeBtn.addEventListener('click', removeCard);
        laterBtn.addEventListener('click', removeCard);

        neverBtn.addEventListener('click', () => {
            setValue(PEACH_KEY_DISMISSED_LIB_ADVICE, true);
            removeCard();
            Toast('已记住选择，不再弹出该建议', 2000, 'info');
        });

        goBtn.addEventListener('click', () => {
            try {
                if (typeof GM_setClipboard === 'function') {
                    GM_setClipboard(strmDir);
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(strmDir);
                }
            } catch (_) {}

            Toast(`已复制路径 [${strmDir}]，正在打开媒体库设置...`, 2500, 'success');
            removeCard();

            if (window.location.pathname !== '/settings/library') {
                window.location.href = `${window.location.origin}/settings/library`;
            }
        });

        document.body.appendChild(card);
    }

    /**
     * 监听 Peach Web 内部的视频播放动作与错误状态 (穿透 Shadow DOM)
     */
    static _setupPlaybackWatcher() {
        const check = () => {
            const video = findVideoElement();
            if (video && !video.dataset.mpBridged) {
                video.dataset.mpBridged = 'true';
                this._bindVideoEvents(video);
            }
        };

        const observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });
        check();
    }

    /**
     * 绑定目标视频事件，智能感知 403/410 或失效 STRM 流
     */
    static _bindVideoEvents(video) {
        video.addEventListener('error', () => {
            console.warn('[PeachWebBridge] 检测到 Peach 原生播放报错，尝试分析是否为虚拟 STRM...');
            this._handlePlaybackError(video);
        });

        this._injectRelayButton(video);
    }

    /**
     * 在 Peach Web 播放器界面注入轻量接力按键
     */
    static _injectRelayButton(video) {
        if (document.querySelector('.tm-peach-relay-btn')) return;

        const container = document.querySelector('[data-stage-media]') || video.parentElement;
        if (!container) return;

        const relayBtn = document.createElement('button');
        relayBtn.className = 'tm-peach-relay-btn';
        relayBtn.type = 'button';
        relayBtn.textContent = '✨ Miss Player 接力起播';

        relayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.takeOverPlayback(video);
        });

        container.appendChild(relayBtn);
    }

    /**
     * 提取当前 Peach 播放界面的番号
     */
    static extractCurrentAvCode(video = null) {
        const targetVideo = video || findVideoElement();
        const code = getVideoCodeFromUrl(targetVideo);
        if (code) return code;

        const peachNodes = document.querySelectorAll('[data-stage-side], [data-item-detail], dialog#stage, [data-stage-host], .code, [data-code]');
        for (const el of peachNodes) {
            const m = matchAvCodeFromText(el.textContent || '');
            if (m) return m;
        }

        return matchAvCodeFromText(document.title) || matchAvCodeFromText(window.location.href) || '';
    }

    /**
     * 提取当前 Peach 播放界面的作品资产 ID
     */
    static extractCurrentAssetId() {
        const urlMatch = window.location.pathname.match(/\/assets\/(\d+)/);
        if (urlMatch) return parseInt(urlMatch[1], 10);
        const video = findVideoElement();
        if (video && video.src) {
            const idMatch = video.src.match(/[?&]id=(\d+)/);
            if (idMatch) return parseInt(idMatch[1], 10);
        }
        return 0;
    }

    /**
     * 处理播放失败：自动寻源并接力
     */
    static async _handlePlaybackError(video) {
        const avcode = this.extractCurrentAvCode(video);
        if (!avcode) return;

        Toast(`Peach 原生流已失效，Miss Player 正在现场寻源 [${avcode}]...`, 2500, 'info');
        await this.takeOverPlayback(video, avcode);
    }

    /**
     * 接管播放并启动动态寻源与进度回写管线
     */
    static async takeOverPlayback(video, targetCode = '') {
        const avcode = targetCode || this.extractCurrentAvCode(video);
        if (!avcode) {
            Toast('未能识别当前作品番号', 2000, 'error');
            return;
        }

        const assetId = this.extractCurrentAssetId();
        PeachStreamHUD.init();
        PeachStreamHUD.updateMeta({ avcode, assetId, sourcesPipeline: [] });
        PeachStreamHUD.log('STREAM', `启动现场即时寻源流水线 [${avcode}]`, 'info');
        Toast(`正在现场检索最新可用视频流: ${avcode}`, 2000, 'info');

        try {
            const streamInfo = await this.resolveDynamicStream(avcode);
            if (!streamInfo || !streamInfo.url) {
                PeachStreamHUD.log('STREAM', `所有源站寻源均未成功 [${avcode}]`, 'error');
                Toast(`现场寻源未找到有效流地址: ${avcode}`, 3000, 'error');
                return;
            }

            PeachStreamHUD.updateMeta({
                streamUrl: streamInfo.url,
                streamSource: streamInfo.source
            });
            PeachStreamHUD.log('STREAM', `已锁定视频流: ${streamInfo.url} (来源: ${streamInfo.source})`, 'success');

            // 监听视频生命周期事件
            this._bindPlayerLifecycleForHUD(video);

            video.src = streamInfo.url;
            video.play().then(() => {
                PeachStreamHUD.log('PLAYER', '视频成功起播！', 'success');
                Toast(`已获取新鲜视频流 (${streamInfo.source})，流畅起播！`, 2500, 'success');
                this.startProgressTracking(video);
            }).catch(playErr => {
                PeachStreamHUD.log('PLAYER', `自动播放被浏览器策略限制: ${playErr.name || playErr.message}`, 'warn');
                console.warn('[PeachWebBridge] 自动起播受限，等待用户交互:', playErr);
                this.startProgressTracking(video);
            });

        } catch (err) {
            PeachStreamHUD.log('STREAM', `寻源异常: ${err.message}`, 'error');
            console.error('[PeachWebBridge] 现场寻源异常:', err);
            Toast(`寻源失败: ${err.message}`, 3000, 'error');
        }
    }

    /**
     * 监控播放器原生生命周期并输出至 HUD
     */
    static _bindPlayerLifecycleForHUD(video) {
        if (!video || video.dataset.mpHudBound) return;
        video.dataset.mpHudBound = 'true';

        video.addEventListener('loadstart', () => PeachStreamHUD.log('PLAYER', 'video: loadstart (开始加载元数据)', 'info'));
        video.addEventListener('loadedmetadata', () => PeachStreamHUD.log('PLAYER', `video: loadedmetadata (时长: ${Math.round(video.duration || 0)}s, 尺寸: ${video.videoWidth}x${video.videoHeight})`, 'success'));
        video.addEventListener('canplay', () => PeachStreamHUD.log('PLAYER', 'video: canplay (已完成初始缓冲，可播放)', 'info'));
        video.addEventListener('playing', () => PeachStreamHUD.log('PLAYER', 'video: playing (正在播放中)', 'success'));
        video.addEventListener('waiting', () => PeachStreamHUD.log('PLAYER', 'video: waiting (缓冲卡顿等待数据)', 'warn'));
        video.addEventListener('error', (e) => {
            const err = video.error;
            const codeMap = { 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
            const desc = err ? `${codeMap[err.code] || 'UNKNOWN'} (${err.message || '格式不支持或上游 CDN 防盗链拦截'})` : '未知错误';
            PeachStreamHUD.log('PLAYER', `video 播放异常: ${desc}`, 'error');
        });
    }

    /**
     * 现场多源动态寻源引擎 (Stream Resolver)
     * 支持本地直连 (Jable/123AV) 与自建独立无盾采集端 (Remote Scraper API) 动静分离回退
     */
    static async resolveDynamicStream(avcode) {
        const cleanCode = avcode.trim().toUpperCase();
        const config = PeachService.getConfig();

        // 1. 首选 Jable 寻源 (本地直连)
        const t0 = performance.now();
        try {
            console.log(`[PeachWebBridge] 正在尝试从 Jable 寻源: ${cleanCode}`);
            const jableStream = await this._searchJableStream(cleanCode);
            const elapsed = Math.round(performance.now() - t0);
            if (jableStream) {
                PeachStreamHUD.recordSourceResult('Jable', { status: 200, elapsedMs: elapsed, success: true, detail: jableStream.url });
                return jableStream;
            }
            PeachStreamHUD.recordSourceResult('Jable', { status: 404, elapsedMs: elapsed, success: false, detail: '未收录' });
        } catch (jableErr) {
            const elapsed = Math.round(performance.now() - t0);
            PeachStreamHUD.recordSourceResult('Jable', { status: 0, elapsedMs: elapsed, success: false, detail: jableErr.message });
            console.warn('[PeachWebBridge] Jable 寻源失败:', jableErr.message);
        }

        // 2. 次选 123AV 寻源 (本地免盾直连，收录极全长片/合辑，如 PBD-491)
        const t1 = performance.now();
        try {
            console.log(`[PeachWebBridge] 正在尝试从 123AV 寻源: ${cleanCode}`);
            const av123Stream = await this._search123AvStream(cleanCode);
            const elapsed = Math.round(performance.now() - t1);
            if (av123Stream) {
                PeachStreamHUD.recordSourceResult('123AV', { status: 200, elapsedMs: elapsed, success: true, detail: av123Stream.url });
                return av123Stream;
            }
            PeachStreamHUD.recordSourceResult('123AV', { status: 404, elapsedMs: elapsed, success: false, detail: '未收录' });
        } catch (av123Err) {
            const elapsed = Math.round(performance.now() - t1);
            PeachStreamHUD.recordSourceResult('123AV', { status: 0, elapsedMs: elapsed, success: false, detail: av123Err.message });
            console.warn('[PeachWebBridge] 123AV 寻源失败:', av123Err.message);
        }

        // 3. 动静分离独立采集端 (Remote Scraper API)
        // 彻底解决本地客户端代理触发 Cloudflare 盾牌的问题，由远端采集端解析 HTML，客户端直连 CDN 切片
        if (config.remoteScraper) {
            const t2 = performance.now();
            try {
                console.log(`[PeachWebBridge] 正在尝试从自建独立采集端寻源: ${config.remoteScraper}`);
                const remoteStream = await this._searchRemoteScraperStream(cleanCode, config.remoteScraper);
                const elapsed = Math.round(performance.now() - t2);
                if (remoteStream) {
                    PeachStreamHUD.recordSourceResult('自建采集端', { status: 200, elapsedMs: elapsed, success: true, detail: remoteStream.url });
                    return remoteStream;
                }
                PeachStreamHUD.recordSourceResult('自建采集端', { status: 404, elapsedMs: elapsed, success: false, detail: '未解析到流' });
            } catch (remoteErr) {
                const elapsed = Math.round(performance.now() - t2);
                PeachStreamHUD.recordSourceResult('自建采集端', { status: 0, elapsedMs: elapsed, success: false, detail: remoteErr.message });
                console.warn('[PeachWebBridge] 独立采集端寻源失败:', remoteErr.message);
            }
        }

        // 4. 备选 MissAV 本地寻源 (兜底)
        const t3 = performance.now();
        try {
            console.log(`[PeachWebBridge] 正在尝试从 MissAV 寻源: ${cleanCode}`);
            const missavStream = await this._searchMissavStream(cleanCode);
            const elapsed = Math.round(performance.now() - t3);
            if (missavStream) {
                PeachStreamHUD.recordSourceResult('MissAV', { status: 200, elapsedMs: elapsed, success: true, detail: missavStream.url });
                return missavStream;
            }
            PeachStreamHUD.recordSourceResult('MissAV', { status: 403, elapsedMs: elapsed, success: false, isCfBlocked: true, detail: 'Cloudflare 盾牌拦截或未收录' });
        } catch (missavErr) {
            const elapsed = Math.round(performance.now() - t3);
            PeachStreamHUD.recordSourceResult('MissAV', { status: 0, elapsedMs: elapsed, success: false, isCfBlocked: true, detail: missavErr.message });
            console.warn('[PeachWebBridge] MissAV 寻源失败:', missavErr.message);
        }

        return null;
    }

    /**
     * 从独立自建采集端 (Remote Scraper API) 获取流地址 (动静分离架构)
     */
    static async _searchRemoteScraperStream(code, endpoint) {
        const url = endpoint.includes('?') ? `${endpoint}&code=${encodeURIComponent(code)}` : `${endpoint}?code=${encodeURIComponent(code)}`;
        const res = await fetchWithTransport(url, {
            headers: { 'Accept': 'application/json' },
            timeout: 10000
        });

        if (res.status >= 200 && res.status < 400 && res.html) {
            try {
                const data = JSON.parse(res.html);
                const streamUrl = data.url || data.stream || data.streamUrl || data.m3u8;
                if (streamUrl && typeof streamUrl === 'string') {
                    return {
                        url: streamUrl,
                        source: data.source || '自建采集端',
                        referer: data.referer || ''
                    };
                }
            } catch (_) {}
        }
        return null;
    }

    /**
     * 从 123AV 动态检索视频流 (无 Cloudflare 盾，收录 PBD-491 等大量长片与合辑)
     */
    static async _search123AvStream(code) {
        const cleanCode = code.toLowerCase().trim();
        const detailUrl = `https://123av.com/cn/v/${cleanCode}`;
        const ua = (typeof navigator !== 'undefined' && navigator.userAgent && !navigator.userAgent.includes('Node'))
            ? navigator.userAgent
            : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        const res = await fetchWithTransport(detailUrl, {
            headers: {
                'User-Agent': ua,
                'Referer': 'https://123av.com/'
            },
            timeout: 8000
        });

        if (res.status >= 200 && res.status < 400 && res.html) {
            // 归一化 HTML 中的 JSON 转义斜杠 (\/)
            const cleanHtml = res.html.replace(/\\+\//g, '/');
            // 提取播放器 embed url (例如: https://sadie-shop.site/e/KXDGPWY2)
            const match = cleanHtml.match(/https:\/\/([^\/"]+)\/e\/([a-zA-Z0-9_-]+)/i);
            
            if (match) {
                const domain = match[1];
                const hashId = match[2];
                const streamApiUrl = `https://${domain}/stream?id=${hashId}`;
                const embedPageUrl = `https://${domain}/e/${hashId}`;

                const apiRes = await fetchWithTransport(streamApiUrl, {
                    headers: {
                        'Referer': embedPageUrl,
                        'User-Agent': ua,
                        'Accept': 'application/json'
                    },
                    timeout: 8000
                });

                if (apiRes.status >= 200 && apiRes.html) {
                    try {
                        const data = JSON.parse(apiRes.html);
                        if (data && data.media && data.media.stream) {
                            return {
                                url: data.media.stream,
                                source: '123AV',
                                referer: `https://${domain}/`
                            };
                        }
                    } catch (_) {}
                }
            }
        }

        return null;
    }

    /**
     * 从 Jable 检索视频流
     */
    static async _searchJableStream(code) {
        const searchUrl = `https://jable.tv/search/${encodeURIComponent(code)}/`;
        const res = await fetchWithTransport(searchUrl, {
            headers: {
                'Referer': 'https://jable.tv/',
                'User-Agent': navigator.userAgent
            },
            timeout: 8000
        });

        if (res.status >= 200 && res.status < 400 && res.html) {
            const detailRegex = new RegExp(`href="(https:\\/\\/jable\\.tv\\/videos\\/[^"]*${code.toLowerCase()}[^"]*\\/)"`, 'i');
            const match = res.html.match(detailRegex);
            const detailUrl = match ? match[1] : null;

            if (detailUrl) {
                const detailRes = await fetchWithTransport(detailUrl, {
                    headers: { 'Referer': searchUrl, 'User-Agent': navigator.userAgent },
                    timeout: 8000
                });

                if (detailRes.status >= 200 && detailRes.html) {
                    const hlsMatch = detailRes.html.match(/hlsUrl\s*=\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i) ||
                                     detailRes.html.match(/<source\s+src=['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
                    if (hlsMatch && hlsMatch[1]) {
                        return {
                            url: hlsMatch[1],
                            source: 'Jable',
                            referer: 'https://jable.tv/'
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * 从 MissAV 检索视频流
     */
    static async _searchMissavStream(code) {
        const domains = ['https://missav.ai', 'https://missav.ws'];
        for (const origin of domains) {
            try {
                const searchUrl = `${origin}/search/${encodeURIComponent(code)}`;
                const res = await fetchWithTransport(searchUrl, {
                    headers: { 'Referer': origin, 'User-Agent': navigator.userAgent },
                    timeout: 8000
                });

                if (res.status >= 200 && res.status < 400 && res.html) {
                    const detailRegex = new RegExp(`href="(${origin}\\/cn\\/[^"]*${code.toLowerCase()}[^"]*)"`, 'i');
                    const match = res.html.match(detailRegex);
                    const detailUrl = match ? match[1] : `${origin}/cn/${code.toLowerCase()}`;

                    const detailRes = await fetchWithTransport(detailUrl, {
                        headers: { 'Referer': searchUrl, 'User-Agent': navigator.userAgent },
                        timeout: 8000
                    });

                    if (detailRes.status >= 200 && detailRes.html) {
                        const m3u8Match = detailRes.html.match(/(https?:\/\/[^'"]+playlist\.m3u8[^'"]*)/i) ||
                                          detailRes.html.match(/urls\s*:\s*\[['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]\]/i);
                        if (m3u8Match && m3u8Match[1]) {
                            return {
                                url: m3u8Match[1],
                                source: 'MissAV',
                                referer: origin
                            };
                        }
                    }
                }
            } catch (_) {}
        }

        return null;
    }

    /**
     * 启动与 Peach 服务端的播放进度双向回写管线 (兼容 /api/activity 与 /api/play)
     */
    static startProgressTracking(video) {
        if (!video) return;
        const assetId = this.extractCurrentAssetId();
        if (!assetId) {
            console.log('[PeachWebBridge] 未能解析到当前 Peach assetId，跳过进度回写');
            return;
        }

        this._currentAssetId = assetId;
        this._lastReportTime = video.currentTime || 0;
        this._accumulatedDelta = 0;
        this._seeksCount = 0;

        // 首次通知 Peach 开播
        fetchWithTransport(`${window.location.origin}/api/play`, {
            method: 'POST',
            body: JSON.stringify({ id: assetId }),
            timeout: 5000
        }).catch(() => {});

        // 上报活动数据函数
        const flushActivity = (ended = false) => {
            if (!this._currentAssetId || !video) return;
            const pos = Math.round(video.currentTime || 0);
            const dur = Math.round(video.duration || 0);
            const delta = Math.round(this._accumulatedDelta);

            // 本地写入恢复续播
            try {
                localStorage.setItem(`peach.playback.v1:item:${this._currentAssetId}`, String(pos));
            } catch (_) {}

            if (delta <= 0 && !ended && this._seeksCount === 0) return;

            fetchWithTransport(`${window.location.origin}/api/activity`, {
                method: 'POST',
                body: JSON.stringify({
                    id: this._currentAssetId,
                    position: pos,
                    duration: dur,
                    delta: Math.max(0, delta),
                    ended: Boolean(ended),
                    seeks: this._seeksCount
                }),
                timeout: 5000
            }).then(res => {
                if (res.status >= 200 && res.status < 300) {
                    PeachStreamHUD.log('PEACH', `观看进度已同步至账本: pos=${pos}s, delta=+${delta}s`, 'success');
                    try {
                        const data = JSON.parse(res.html);
                        if (data && data.real_ratio != null) {
                            const realTxt = document.getElementById('realTxt');
                            const realBar = document.getElementById('realBar');
                            const percent = Math.min(data.real_ratio, 1) * 100;
                            if (realTxt) realTxt.textContent = `${percent.toFixed(0)}%`;
                            if (realBar) realBar.style.width = `${percent.toFixed(1)}%`;
                        }
                    } catch (_) {}
                }
            }).catch(err => {
                PeachStreamHUD.log('PEACH', `进度上报异常: ${err.message}`, 'warn');
            });

            this._accumulatedDelta = 0;
            this._seeksCount = 0;
        };

        // 清理旧定时器
        if (this._progressTimer) {
            clearInterval(this._progressTimer);
        }

        // 定时每 10 秒向 Peach 回写一次进度
        this._progressTimer = setInterval(() => {
            if (!video.paused && !video.seeking) {
                flushActivity(false);
            }
        }, 10000);

        // 监听视频关键节点
        video.addEventListener('timeupdate', () => {
            const cur = video.currentTime;
            const diff = cur - this._lastReportTime;
            if (!video.paused && !video.seeking && diff > 0 && diff < 3) {
                this._accumulatedDelta += diff;
            }
            this._lastReportTime = cur;
        });

        video.addEventListener('seeking', () => {
            this._seeksCount++;
        });

        video.addEventListener('pause', () => flushActivity(false));
        video.addEventListener('ended', () => flushActivity(true));
        window.addEventListener('pagehide', () => flushActivity(false));

        console.log(`[PeachWebBridge] 已建立 Peach 服务端进度回写管线 (assetId: ${assetId})`);
    }

    /**
     * 停止进度回写并清理
     */
    static stopProgressTracking() {
        if (this._progressTimer) {
            clearInterval(this._progressTimer);
            this._progressTimer = null;
        }
    }
}
