/**
 * Peach Web 跨站播放接力桥接器 (PeachWebBridge)
 * 
 * 职责：
 * 1. 识别当前页面是否为用户自托管的 Peach Web 实例
 * 2. 多网络入口自适应：自动将当前 Origin 加入地址池，并从 Peach 服务端探测 local/lan/ip 候选
 * 3. 访问 Peach Web 时的零输入自动配对 (同源会话自动签发并落盘 Dedicated Token)
 * 4. WebDAV 媒体库智能巡检与挂载引导 (检查 STRM 目录是否已被加入 Peach 媒体源)
 * 5. 监听 Peach 作品详情与播放视口，现场动态寻源起播 (Stream Resolver)
 */

import { PeachService, PEACH_KEY_DISMISSED_LIB_ADVICE } from '../../services/PeachService.js';
import { fetchWithTransport } from '../../utils/http.js';
import { matchAvCodeFromText } from '../../utils/videoCode.js';
import { getValue, setValue } from '../../utils/storage.js';
import { Toast } from '../../utils/index.js';

export class PeachWebBridge {
    static initialized = false;

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
     * 兼顾快速同步判定与 React SPA 异步挂载延迟
     */
    static detectAndStart() {
        if (this.initialized) return true;

        if (this.isPeachInstance()) {
            this.init();
            return true;
        }

        // 针对慢速网络与 SPA 动态挂载，启动有限轮询探测（每 250ms 探一次，持续 3 秒）
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
     * 利用用户当前在 Peach Web 上的登录态，自动获取或签发专用令牌
     */
    static async _autoPairIfNeeded() {
        const config = PeachService.getConfig();
        if (config.token && config.enabled) {
            return; // 已经完成配对且可用
        }

        try {
            console.log('[PeachWebBridge] 正在为 Miss Player 自动配对 Peach 服务端...');
            const configureUrl = `${window.location.origin}/api/configuration/jav-browser`;
            
            // 优先尝试 enable，若已开启过则尝试 rotate
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
                const data = JSON.parse(res.html);
                if (data && data.token) {
                    PeachService.saveConfig({
                        base: window.location.origin,
                        token: data.token,
                        enabled: true
                    });
                    Toast('🎉 Miss Player 已自动完成 Peach 服务端无缝配对！', 3500, 'success');
                }
            }
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

            // 检查所有媒体库下的根目录，是否有任何一个包含目标关键字
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

            // 若尚未找到 STRM 媒体源，优雅展示 Apple 引导卡片
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
            // 复制推荐路径
            try {
                if (typeof GM_setClipboard === 'function') {
                    GM_setClipboard(strmDir);
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(strmDir);
                }
            } catch (_) {}

            Toast(`已复制路径 [${strmDir}]，正在打开媒体库设置...`, 2500, 'success');
            removeCard();

            // 跳转到 Peach 媒体库设置路由
            if (window.location.pathname !== '/settings/library') {
                window.location.href = `${window.location.origin}/settings/library`;
            }
        });

        document.body.appendChild(card);
    }

    /**
     * 监听 Peach Web 内部的视频播放动作与错误状态
     */
    static _setupPlaybackWatcher() {
        const observer = new MutationObserver(() => {
            const video = document.querySelector('video');
            if (video && !video.dataset.mpBridged) {
                video.dataset.mpBridged = 'true';
                this._bindVideoEvents(video);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const video = document.querySelector('video');
        if (video && !video.dataset.mpBridged) {
            video.dataset.mpBridged = 'true';
            this._bindVideoEvents(video);
        }
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

        const container = video.parentElement;
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
    static extractCurrentAvCode() {
        const urlMatch = matchAvCodeFromText(window.location.href);
        if (urlMatch) return urlMatch;

        const titleMatch = matchAvCodeFromText(document.title);
        if (titleMatch) return titleMatch;

        const codeElement = document.querySelector('.code, [data-code], h1, h2');
        if (codeElement && codeElement.textContent) {
            const domMatch = matchAvCodeFromText(codeElement.textContent);
            if (domMatch) return domMatch;
        }

        return '';
    }

    /**
     * 处理播放失败：自动寻源并接力
     */
    static async _handlePlaybackError(video) {
        const avcode = this.extractCurrentAvCode();
        if (!avcode) return;

        Toast(`Peach 原生流已失效，Miss Player 正在现场寻源 [${avcode}]...`, 2500, 'info');
        await this.takeOverPlayback(video, avcode);
    }

    /**
     * 接管播放并启动动态寻源
     */
    static async takeOverPlayback(video, targetCode = '') {
        const avcode = targetCode || this.extractCurrentAvCode();
        if (!avcode) {
            Toast('未能识别当前作品番号', 2000, 'error');
            return;
        }

        Toast(`正在现场检索最新可用视频流: ${avcode}`, 2000, 'info');

        try {
            const streamInfo = await this.resolveDynamicStream(avcode);
            if (!streamInfo || !streamInfo.url) {
                Toast(`现场寻源未找到有效流地址: ${avcode}`, 3000, 'error');
                return;
            }

            video.src = streamInfo.url;
            video.play().then(() => {
                Toast(`已获取新鲜视频流 (${streamInfo.source})，流畅起播！`, 2500, 'success');
            }).catch(playErr => {
                console.warn('[PeachWebBridge] 自动起播受限，等待用户交互:', playErr);
            });

        } catch (err) {
            console.error('[PeachWebBridge] 现场寻源异常:', err);
            Toast(`寻源失败: ${err.message}`, 3000, 'error');
        }
    }

    /**
     * 现场动态寻源引擎 (Stream Resolver)
     */
    static async resolveDynamicStream(avcode) {
        const cleanCode = avcode.trim().toUpperCase();

        try {
            const jableStream = await this._searchJableStream(cleanCode);
            if (jableStream) return jableStream;
        } catch (jableErr) {
            console.warn('[PeachWebBridge] Jable 寻源失败:', jableErr.message);
        }

        return null;
    }

    /**
     * 从 Jable 检索流地址
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
}
