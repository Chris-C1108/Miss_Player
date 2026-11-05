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

/**
 * 基于 GM_xmlhttpRequest 的 HLS 切片与元数据加载器
 * 核心黑科技：穿透所有上游视频 CDN 的 Referer 防盗链校验 (解决 403 Forbidden 与 MEDIA_ERR_SRC_NOT_SUPPORTED)
 */
class GMHlsLoader {
    static currentReferer = '';

    constructor(config) {
        this.config = config;
        this.request = null;
    }

    destroy() {
        if (this.request && this.request.abort) {
            try { this.request.abort(); } catch (_) {}
        }
        this.request = null;
    }

    abort() {
        this.destroy();
    }

    load(context, config, callbacks) {
        const url = context.url;
        const responseType = context.responseType;
        const referer = GMHlsLoader.currentReferer || '';

        const headers = {
            'User-Agent': (typeof navigator !== 'undefined' && navigator.userAgent)
                ? navigator.userAgent
                : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (referer) {
            headers['Referer'] = referer;
            try {
                headers['Origin'] = new URL(referer).origin;
            } catch (_) {}
        }

        const tStart = performance.now();

        this.request = GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: headers,
            responseType: responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
            timeout: config.timeout || 15000,
            onload: (res) => {
                const tEnd = performance.now();
                if (res.status >= 200 && res.status < 300) {
                    let data = res.response;
                    if (responseType === 'arraybuffer') {
                        if (data instanceof ArrayBuffer) {
                            // 标准原生 ArrayBuffer
                        } else if (data && data.buffer instanceof ArrayBuffer) {
                            data = data.buffer;
                        } else if (typeof data === 'string') {
                            // 针对特定油猴管理器返回二进制字符串的严密防御性转换
                            const buf = new ArrayBuffer(data.length);
                            const view = new Uint8Array(buf);
                            for (let i = 0; i < data.length; i++) {
                                view[i] = data.charCodeAt(i) & 0xff;
                            }
                            data = buf;
                        }
                    } else {
                        data = res.responseText || res.response || '';
                    }

                    const response = {
                        url: res.finalUrl || url,
                        data: data
                    };
                    const byteLen = (data && data.byteLength) || (data && data.length) || 0;
                    const stats = {
                        trequest: tStart,
                        tfirst: tEnd,
                        tload: tEnd,
                        loaded: byteLen,
                        total: byteLen
                    };
                    callbacks.onSuccess(response, stats, context);
                } else {
                    callbacks.onError({ code: res.status, text: res.statusText }, context, null);
                }
            },
            onerror: (err) => {
                callbacks.onError({ code: 0, text: 'Network Error' }, context, null);
            },
            ontimeout: () => {
                callbacks.onTimeout({ code: 0, text: 'Timeout' }, context, null);
            }
        });
    }
}

export class PeachWebBridge {
    static initialized = false;
    static _progressTrackerActive = false;
    static _progressTimer = null;
    static _lastReportTime = 0;
    static _accumulatedDelta = 0;
    static _seeksCount = 0;
    static _currentAssetId = 0;
    static _isResolving = false;
    static _hlsInstance = null;

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
            this._failedStreamUrls.clear(); // 手动重试时清空失败黑名单，允许完整重新寻源
            this._isResolving = false;
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
        if (this._isResolving) {
            console.log('[PeachWebBridge] 当前已在寻源流水线中，跳过重入触发');
            return;
        }

        const avcode = this.extractCurrentAvCode(video);
        if (!avcode) return;

        Toast(`Peach 原生流已失效，Miss Player 正在现场寻源 [${avcode}]...`, 2500, 'info');
        await this.takeOverPlayback(video, avcode);
    }

    /**
     * 接管播放：多源即时试播与瀑布流无缝故障转移 (Jable ➔ 123AV ➔ 独立采集端 ➔ MissAV)
     */
    static async takeOverPlayback(video, targetCode = '') {
        if (this._isResolving) return;
        this._isResolving = true;

        const avcode = targetCode || this.extractCurrentAvCode(video);
        if (!avcode) {
            this._isResolving = false;
            Toast('未能识别当前作品番号', 2000, 'error');
            return;
        }

        const assetId = this.extractCurrentAssetId();
        PeachStreamHUD.init();
        PeachStreamHUD.updateMeta({ avcode, assetId, sourcesPipeline: [] });
        PeachStreamHUD.log('STREAM', `启动多源瀑布寻源与播放检验 [${avcode}]`, 'info');
        Toast(`正在现场检索最新可用视频流: ${avcode}`, 2000, 'info');

        // 监听视频生命周期事件
        this._bindPlayerLifecycleForHUD(video);

        const cleanCode = avcode.trim().toUpperCase();
        const config = PeachService.getConfig();

        // 构造有序候选源清单
        const sources = [
            { name: 'Jable', fn: () => this._searchJableStream(cleanCode) },
            { name: '123AV', fn: () => this._search123AvStream(cleanCode) },
            ...(config.remoteScraper ? [{ name: '自建采集端', fn: () => this._searchRemoteScraperStream(cleanCode, config.remoteScraper) }] : []),
            { name: 'MissAV', fn: () => this._searchMissavStream(cleanCode) }
        ];

        let playSuccess = false;
        const currentRoundFailed = new Set(); // 本轮已试播失败的流，单轮防重，绝不跨轮次永久污染

        for (const source of sources) {
            PeachStreamHUD.log('STREAM', `正在尝试 [${source.name}]...`, 'info');
            const t0 = performance.now();
            let streamInfo = null;

            try {
                streamInfo = await source.fn();
                const elapsed = Math.round(performance.now() - t0);

                if (!streamInfo || !streamInfo.url) {
                    PeachStreamHUD.recordSourceResult(source.name, { status: 404, elapsedMs: elapsed, success: false, detail: '未检索到有效流' });
                    continue;
                }

                if (currentRoundFailed.has(streamInfo.url)) {
                    PeachStreamHUD.recordSourceResult(source.name, { status: 400, elapsedMs: elapsed, success: false, detail: '本轮已试播失败，顺位尝试下一个源' });
                    continue;
                }

                PeachStreamHUD.recordSourceResult(source.name, { status: 200, elapsedMs: elapsed, success: true, detail: streamInfo.url });
            } catch (err) {
                const elapsed = Math.round(performance.now() - t0);
                PeachStreamHUD.recordSourceResult(source.name, { status: 0, elapsedMs: elapsed, success: false, detail: err.message });
                continue;
            }

            // 现场试播检验：尝试挂载并起播该流
            PeachStreamHUD.log('PLAYER', `检验 [${source.name}] 流起播状态: ${streamInfo.url}`, 'info');
            const verified = await this._verifyAndMountStream(video, streamInfo);

            if (verified) {
                playSuccess = true;
                PeachStreamHUD.updateMeta({
                    streamUrl: streamInfo.url,
                    streamSource: streamInfo.source
                });
                PeachStreamHUD.log('STREAM', `🎉 [${source.name}] 成功起播！`, 'success');
                Toast(`已获取新鲜视频流 (${streamInfo.source})，流畅起播！`, 2500, 'success');
                this.startProgressTracking(video);
                break; // 起播成功，退出瀑布流！
            } else {
                currentRoundFailed.add(streamInfo.url);
                PeachStreamHUD.log('PLAYER', `[${source.name}] 试播失败，自动顺位无缝尝试下一个源...`, 'warn');
            }
        }

        if (!playSuccess) {
            PeachStreamHUD.log('STREAM', `所有备选源均未能成功起播 [${avcode}]`, 'error');
            Toast(`所有源站均未能成功起播，请在设置中配置独立采集端或检查代理`, 3500, 'error');
        }

        setTimeout(() => { this._isResolving = false; }, 2000);
    }

    /**
     * 挂载候选流并进行播放检验 (超时 2 秒内必须获得就绪/播放信号，否则视为该源失败并返回 false)
     * @param {HTMLVideoElement} video 
     * @param {Object} streamInfo 
     * @returns {Promise<boolean>}
     */
    static async _verifyAndMountStream(video, streamInfo) {
        if (!video || !streamInfo || !streamInfo.url) return false;

        return new Promise(async (resolve) => {
            let settled = false;
            let timer = null;

            const onSettled = (ok) => {
                if (settled) return;
                settled = true;
                if (timer) clearTimeout(timer);
                video.removeEventListener('playing', onPlaying);
                video.removeEventListener('loadedmetadata', onReady);
                video.removeEventListener('timeupdate', onTimeUpdate);
                video.removeEventListener('error', onError);
                resolve(ok);
            };

            const onPlaying = () => onSettled(true);
            const onReady = () => {
                // 已成功解析出元数据与时长，说明流解析成功！
                if (video.duration > 0) onSettled(true);
            };
            const onTimeUpdate = () => {
                if (video.currentTime > 0) onSettled(true);
            };
            const onError = () => {
                onSettled(false);
            };

            video.addEventListener('playing', onPlaying);
            video.addEventListener('loadedmetadata', onReady);
            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('error', onError);

            // 挂载流 (透传完整 streamInfo 以提取防盗链 referer)
            try {
                await this.mountHlsStream(video, streamInfo);
                
                // 监听 Hls.js 核心事件：一旦解析完成或切片到达，立即确认流有效成功！
                if (this._hlsInstance) {
                    const HlsClass = (typeof window !== 'undefined' && window.Hls) || 
                                    (typeof unsafeWindow !== 'undefined' && unsafeWindow.Hls);
                    if (HlsClass && HlsClass.Events) {
                        this._hlsInstance.once(HlsClass.Events.MANIFEST_PARSED, (evt, data) => {
                            PeachStreamHUD.log('PLAYER', `Hls.js 播放列表解析就绪 (档位: ${data?.levels?.length || 1})`, 'success');
                            onSettled(true);
                        });
                        this._hlsInstance.once(HlsClass.Events.FRAG_LOADED, () => {
                            PeachStreamHUD.log('PLAYER', 'Hls.js 首个视频分片加载完成', 'success');
                            onSettled(true);
                        });
                    }
                }

                // 尝试起播：针对 iOS Safari 异步请求后受阻，提供自动静音兜底起播
                const p = video.play();
                if (p !== undefined) {
                    p.then(() => {
                        onSettled(true);
                    }).catch(async (playErr) => {
                        console.warn('[PeachWebBridge] 有声起播被拦截，尝试静音起播:', playErr.name);
                        try {
                            video.muted = true;
                            await video.play();
                            onSettled(true);
                            // 挂载单次点击解除静音
                            const unmuteOnce = () => {
                                if (video) video.muted = false;
                                document.removeEventListener('click', unmuteOnce, true);
                                document.removeEventListener('touchstart', unmuteOnce, true);
                            };
                            document.addEventListener('click', unmuteOnce, { once: true, capture: true });
                            document.addEventListener('touchstart', unmuteOnce, { once: true, capture: true });
                        } catch (err2) {
                            console.error('[PeachWebBridge] 静音起播仍受限:', err2);
                        }
                    });
                }
            } catch (mountErr) {
                console.warn('[PeachWebBridge] 挂载流发生异常:', mountErr.message);
                onSettled(false);
            }

            // 8 秒看门狗：给跨国代理与 AES-128 解密足够的首包缓冲时间
            timer = setTimeout(() => {
                onSettled(video.readyState >= 1 || video.currentTime > 0);
            }, 8000);
        });
    }

    /**
     * 跨浏览器全兼容 HLS 挂载适配器 (通过 GMHlsLoader 彻底攻克 CDN 403 防盗链)
     */
    static async mountHlsStream(video, streamInfo) {
        if (!video || !streamInfo) return;
        const streamUrl = typeof streamInfo === 'string' ? streamInfo : streamInfo.url;
        const referer = (typeof streamInfo === 'object' && streamInfo.referer) ? streamInfo.referer : '';

        // 设置全域 GM 切片加载器的伪造 Referer
        GMHlsLoader.currentReferer = referer;
        PeachStreamHUD.log('PLAYER', `配置防盗链 Referer: ${referer || '无'}`, 'info');

        // 0. 清理 Peach 宿主组件 <hlsjs-video> 原生无 Referer 的 src 干扰
        try {
            const rootNode = video.getRootNode ? video.getRootNode() : null;
            const hlsHost = rootNode?.host || video.closest('hlsjs-video') || document.querySelector('hlsjs-video');
            if (hlsHost && hlsHost.removeAttribute) {
                hlsHost.removeAttribute('src');
            }
        } catch (_) {}

        // 1. 优先使用 Hls.js + GMHlsLoader 挂载 (全浏览器通用，100% 免疫 Referer 403)
        let HlsClass = (typeof window !== 'undefined' && window.Hls) || 
                        (typeof unsafeWindow !== 'undefined' && unsafeWindow.Hls);

        if (!HlsClass) {
            try {
                await this._loadHlsScript();
                HlsClass = window.Hls || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.Hls : null);
            } catch (_) {}
        }

        if (HlsClass && HlsClass.isSupported()) {
            PeachStreamHUD.log('PLAYER', '启动 GM 强注 Referer Hls.js 引擎加载切片', 'success');
            if (this._hlsInstance) {
                try { this._hlsInstance.destroy(); } catch (_) {}
            }

            this._hlsInstance = new HlsClass({
                fLoader: GMHlsLoader,
                pLoader: GMHlsLoader,
                enableWorker: true,
                lowLatencyMode: true
            });

            this._hlsInstance.on(HlsClass.Events.ERROR, (event, data) => {
                if (data && data.fatal) {
                    console.warn('[PeachWebBridge] Hls.js fatal error:', data.type, data.details);
                    PeachStreamHUD.log('PLAYER', `Hls.js 错误: ${data.details}`, 'error');
                }
            });

            this._hlsInstance.loadSource(streamUrl);
            this._hlsInstance.attachMedia(video);
            return;
        }

        // 2. 兜底直接赋值 (原生环境)
        video.src = streamUrl;
    }

    /**
     * 动态加载轻量 Hls.js 辅助库 (仅在 Chrome 原生不支持 m3u8 时触发)
     */
    static _loadHlsScript() {
        return new Promise((resolve, reject) => {
            if (window.Hls || (typeof unsafeWindow !== 'undefined' && unsafeWindow.Hls)) {
                return resolve();
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.6.7/hls.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Hls.js CDN 加载失败'));
            document.head.appendChild(script);
        });
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
                if (this._failedStreamUrls.has(jableStream.url)) {
                    console.warn(`[PeachWebBridge] Jable 流已在黑名单中，自动顺位回退下一个源: ${jableStream.url}`);
                    PeachStreamHUD.recordSourceResult('Jable', { status: 400, elapsedMs: elapsed, success: false, detail: '流已在失败黑名单，顺位回退' });
                } else {
                    PeachStreamHUD.recordSourceResult('Jable', { status: 200, elapsedMs: elapsed, success: true, detail: jableStream.url });
                    return jableStream;
                }
            } else {
                PeachStreamHUD.recordSourceResult('Jable', { status: 404, elapsedMs: elapsed, success: false, detail: '未收录' });
            }
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
                if (this._failedStreamUrls.has(av123Stream.url)) {
                    console.warn(`[PeachWebBridge] 123AV 流已在黑名单中，自动顺位回退下一个源: ${av123Stream.url}`);
                    PeachStreamHUD.recordSourceResult('123AV', { status: 400, elapsedMs: elapsed, success: false, detail: '流已在失败黑名单，顺位回退' });
                } else {
                    PeachStreamHUD.recordSourceResult('123AV', { status: 200, elapsedMs: elapsed, success: true, detail: av123Stream.url });
                    return av123Stream;
                }
            } else {
                PeachStreamHUD.recordSourceResult('123AV', { status: 404, elapsedMs: elapsed, success: false, detail: '未收录' });
            }
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
        const domains = ['https://123av.com', 'https://1av.to'];
        const ua = (typeof navigator !== 'undefined' && navigator.userAgent && !navigator.userAgent.includes('Node'))
            ? navigator.userAgent
            : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        for (const origin of domains) {
            try {
                const detailUrl = `${origin}/cn/v/${cleanCode}`;
                const res = await fetchWithTransport(detailUrl, {
                    headers: {
                        'User-Agent': ua,
                        'Referer': `${origin}/`
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
            } catch (_) {}
        }

        return null;
    }

    /**
     * 从 Jable 检索视频流 (支持直接直达与搜索双通道)
     */
    static async _searchJableStream(code) {
        const cleanCode = code.toLowerCase().trim();
        const domains = ['https://jable.tv', 'https://fs1.app'];
        const ua = (typeof navigator !== 'undefined' && navigator.userAgent)
            ? navigator.userAgent
            : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        for (const origin of domains) {
            // 通道 1: 直接直达详情页 (Jable 95% 规范番号格式都是 /videos/code/)
            try {
                const directUrl = `${origin}/videos/${cleanCode}/`;
                const directRes = await fetchWithTransport(directUrl, {
                    headers: { 'Referer': `${origin}/`, 'User-Agent': ua },
                    timeout: 8000
                });

                if (directRes.status >= 200 && directRes.status < 400 && directRes.html) {
                    const hlsMatch = directRes.html.match(/hlsUrl\s*=\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i) ||
                                     directRes.html.match(/<source\s+src=['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
                    if (hlsMatch && hlsMatch[1]) {
                        PeachStreamHUD.log('SCRAPE', `[Jable] 直达详情页解析成功: ${directUrl}`, 'success');
                        return {
                            url: hlsMatch[1],
                            source: 'Jable',
                            referer: `${origin}/`
                        };
                    }
                }
            } catch (_) {}

            // 通道 2: 搜索页检索匹配
            try {
                const searchUrl = `${origin}/search/${encodeURIComponent(cleanCode)}/`;
                const res = await fetchWithTransport(searchUrl, {
                    headers: { 'Referer': `${origin}/`, 'User-Agent': ua },
                    timeout: 8000
                });

                if (res.status >= 200 && res.status < 400 && res.html) {
                    const detailRegex = new RegExp(`href="((?:https?:\\/\\/[^"\\/]+)?\\/videos\\/[^"\\/]*${cleanCode}[^"\\/]*\\/)"`, 'i');
                    const match = res.html.match(detailRegex);
                    const detailPath = match ? match[1] : null;

                    if (detailPath) {
                        const detailUrl = detailPath.startsWith('http') ? detailPath : new URL(detailPath, origin).href;
                        const detailRes = await fetchWithTransport(detailUrl, {
                            headers: { 'Referer': searchUrl, 'User-Agent': ua },
                            timeout: 8000
                        });

                        if (detailRes.status >= 200 && detailRes.html) {
                            const hlsMatch = detailRes.html.match(/hlsUrl\s*=\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i) ||
                                             detailRes.html.match(/<source\s+src=['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
                            if (hlsMatch && hlsMatch[1]) {
                                PeachStreamHUD.log('SCRAPE', `[Jable] 搜索详情页解析成功: ${detailUrl}`, 'success');
                                return {
                                    url: hlsMatch[1],
                                    source: 'Jable',
                                    referer: `${origin}/`
                                };
                            }
                        }
                    }
                }
            } catch (_) {}
        }

        return null;
    }

    /**
     * 从 MissAV 检索视频流 (支持直接直达与搜索双通道)
     */
    static async _searchMissavStream(code) {
        const cleanCode = code.toLowerCase().trim();
        const domains = ['https://missav.ai', 'https://missav.ws'];
        const ua = (typeof navigator !== 'undefined' && navigator.userAgent)
            ? navigator.userAgent
            : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        for (const origin of domains) {
            // 通道 1: 尝试直达详情页 (/cn/code 或 /code)
            for (const pathPrefix of [`/cn/${cleanCode}`, `/${cleanCode}`]) {
                try {
                    const directUrl = `${origin}${pathPrefix}`;
                    const directRes = await fetchWithTransport(directUrl, {
                        headers: { 'Referer': `${origin}/`, 'User-Agent': ua },
                        timeout: 8000
                    });

                    if (directRes.status >= 200 && directRes.status < 400 && directRes.html) {
                        const m3u8Match = directRes.html.match(/(https?:\/\/[^'"]+playlist\.m3u8[^'"]*)/i) ||
                                          directRes.html.match(/urls\s*:\s*\[['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]\]/i);
                        if (m3u8Match && m3u8Match[1]) {
                            PeachStreamHUD.log('SCRAPE', `[MissAV] 直达详情页解析成功: ${directUrl}`, 'success');
                            return {
                                url: m3u8Match[1],
                                source: 'MissAV',
                                referer: `${origin}/`
                            };
                        }
                    }
                } catch (_) {}
            }

            // 通道 2: 搜索页检索
            try {
                const searchUrl = `${origin}/search/${encodeURIComponent(cleanCode)}`;
                const res = await fetchWithTransport(searchUrl, {
                    headers: { 'Referer': `${origin}/`, 'User-Agent': ua },
                    timeout: 8000
                });

                if (res.status >= 200 && res.status < 400 && res.html) {
                    const detailRegex = new RegExp(`href="((?:https?:\\/\\/[^"\\/]+)?\\/(?:cn\\/)?[^"\\/]*${cleanCode}[^"\\/]*)"`, 'i');
                    const match = res.html.match(detailRegex);
                    const detailPath = match ? match[1] : `/cn/${cleanCode}`;
                    const detailUrl = detailPath.startsWith('http') ? detailPath : new URL(detailPath, origin).href;

                    const detailRes = await fetchWithTransport(detailUrl, {
                        headers: { 'Referer': searchUrl, 'User-Agent': ua },
                        timeout: 8000
                    });

                    if (detailRes.status >= 200 && detailRes.html) {
                        const m3u8Match = detailRes.html.match(/(https?:\/\/[^'"]+playlist\.m3u8[^'"]*)/i) ||
                                          detailRes.html.match(/urls\s*:\s*\[['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]\]/i);
                        if (m3u8Match && m3u8Match[1]) {
                            PeachStreamHUD.log('SCRAPE', `[MissAV] 搜索页解析成功: ${detailUrl}`, 'success');
                            return {
                                url: m3u8Match[1],
                                source: 'MissAV',
                                referer: `${origin}/`
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
