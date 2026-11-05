/**
 * Peach Web 自动化管线与媒体源巡检桥接器 (PeachWebBridge)
 * 
 * 职责：
 * 1. 识别当前页面是否为用户自托管的 Peach Web 实例
 * 2. 多网络入口自适应：自动将当前 Origin 加入地址池，并从 Peach 服务端探测 local/lan/ip 候选
 * 3. 访问 Peach Web 时的零输入自动配对 (同源会话自动签发并落盘 Dedicated Token)
 * 4. WebDAV 媒体库智能巡检与挂载引导 (检查 STRM 目录是否已被加入 Peach 媒体源)
 * 
 * 注：Phase 19 起，寻源与防盗链 HLS 切片代理已全量下放至服务端「流网关 (miss-gateway)」，
 * 客户端不再需要任何瀑布寻源与 GM 切片加载器。
 */

import { PeachService, PEACH_KEY_DISMISSED_LIB_ADVICE } from '../../services/PeachService.js';
import { fetchWithTransport } from '../../utils/http.js';
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

            if (res.status >= 200 && res.status < 300) {
                const libraries = JSON.parse(res.html);
                if (Array.isArray(libraries)) {
                    let hasStrmSource = false;
                    for (const lib of libraries) {
                        const roots = Array.isArray(lib.roots) ? lib.roots : [];
                        for (const r of roots) {
                            const loc = String(r.location || '').toLowerCase();
                            const rootPath = String(r.root || '').toLowerCase();
                            if (loc.includes(keyword) || rootPath.includes(keyword) || loc.includes('strm') || rootPath.includes('strm')) {
                                hasStrmSource = true;
                                break;
                            }
                        }
                        if (hasStrmSource) break;
                    }

                    if (!hasStrmSource) {
                        this._renderLibraryAdvisorCard(targetStrmDir);
                    }
                }
            }
        } catch (_) {}
    }

    /**
     * 渲染精致的 Apple 风格媒体库设置引导毛玻璃卡片
     */
    static _renderLibraryAdvisorCard(strmDir) {
        if (document.querySelector('.tm-peach-advisor-card')) return;

        const card = document.createElement('div');
        card.className = 'tm-peach-advisor-card';
        card.innerHTML = `
            <div class="tm-peach-advisor-header">
                <div class="tm-peach-advisor-title">🍑 Peach 媒体库未绑定虚拟 STRM 目录</div>
                <button type="button" class="tm-peach-advisor-close" title="不再提示">×</button>
            </div>
            <div class="tm-peach-advisor-desc">
                检测到 Peach 媒体库尚未包含虚拟视频目录。建议将 WebDAV 写入路径 <span class="tm-peach-advisor-path">${strmDir}</span> 登记到 Peach 媒体库，即可在入库时享受自动封面刮削与秒级点播！
            </div>
            <div class="tm-peach-advisor-actions">
                <button type="button" class="tm-peach-advisor-btn-primary">复制路径并前往媒体库</button>
                <button type="button" class="tm-peach-advisor-btn-dismiss">暂不提醒</button>
            </div>
        `;

        const closeBtn = card.querySelector('.tm-peach-advisor-close');
        const dismissBtn = card.querySelector('.tm-peach-advisor-btn-dismiss');
        const primaryBtn = card.querySelector('.tm-peach-advisor-btn-primary');

        const doDismiss = () => {
            setValue(PEACH_KEY_DISMISSED_LIB_ADVICE, true);
            card.remove();
        };

        closeBtn.addEventListener('click', doDismiss);
        dismissBtn.addEventListener('click', doDismiss);

        primaryBtn.addEventListener('click', () => {
            try {
                if (typeof GM_setClipboard === 'function') {
                    GM_setClipboard(strmDir);
                } else {
                    navigator.clipboard.writeText(strmDir);
                }
            } catch (_) {
                navigator.clipboard.writeText(strmDir);
            }
            Toast(`已复制路径 [${strmDir}]，正在打开媒体库设置...`, 2500, 'success');
            setTimeout(() => {
                window.location.href = `${window.location.origin}/settings/library`;
            }, 600);
            card.remove();
        });

        document.body.appendChild(card);
    }
}
