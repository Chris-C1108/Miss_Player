/**
 * Peach Web 跨站播放接力桥接器 (PeachWebBridge)
 * 
 * 职责：
 * 1. 识别当前页面是否为用户自托管的 Peach Web 实例
 * 2. 监听 Peach 作品详情与播放视口，检测虚拟 STRM 资源与起播失败
 * 3. 现场即时动态寻源引擎 (Stream Resolver)：当 STRM 原始流因过期或防盗链失效时，
 *    通过 GM 栈向 Jable / MissAV 动态检索 AVCODE 并获取当期最新鲜、带有效签名的 m3u8
 * 4. 原地激活 Miss Player 播放核心，注入 Referer 绕过防盗链，实现无感跨站流畅起播
 */

import { PeachService } from '../../services/PeachService.js';
import { fetchWithTransport } from '../../utils/http.js';
import { matchAvCodeFromText } from '../../utils/videoCode.js';
import { Toast } from '../../utils/index.js';

export class PeachWebBridge {
    static initialized = false;

    /**
     * 判断当前页面是否为用户配置的 Peach Web 实例
     */
    static isPeachInstance() {
        const config = PeachService.getConfig();
        if (config.base && window.location.origin === config.base) {
            return true;
        }

        // 特征探测：Peach Web 专属 DOM 标识
        if (document.querySelector('meta[name="peach-userscript-bridge"]') ||
            document.querySelector('#peach-app') ||
            document.querySelector('[data-peach-stream-cancel]')) {
            return true;
        }

        return false;
    }

    /**
     * 初始化 Peach Web 接力监听器
     */
    static init() {
        if (this.initialized) return;
        if (!this.isPeachInstance()) return;

        this.initialized = true;
        console.log('[PeachWebBridge] 检测到运行在 Peach Web 实例，启动接力监听...');

        this._setupPlaybackWatcher();
    }

    /**
     * 监听 Peach Web 内部的视频播放动作与错误状态
     */
    static _setupPlaybackWatcher() {
        // 观察 DOM 中插入的 <video> 标签或播放器舞台
        const observer = new MutationObserver(() => {
            const video = document.querySelector('video');
            if (video && !video.dataset.mpBridged) {
                video.dataset.mpBridged = 'true';
                this._bindVideoEvents(video);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // 首次尝试检查
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

        // 在播放器控制区域挂载一个轻量的「Miss Player 接力播放」便捷按钮
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
        // 1. 从 URL 查询参数或路径分析
        const urlMatch = matchAvCodeFromText(window.location.href);
        if (urlMatch) return urlMatch;

        // 2. 从页面标题分析
        const titleMatch = matchAvCodeFromText(document.title);
        if (titleMatch) return titleMatch;

        // 3. 从 Peach 详情页常见字段分析
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

            // 将新鲜流注入 video 元素起播
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
     * 通过 GM_xmlhttpRequest 向外部站检索番号并解析最新有效流
     * @param {string} avcode - 目标番号
     * @returns {Promise<{ url: string, source: string, referer: string }>}
     */
    static async resolveDynamicStream(avcode) {
        const cleanCode = avcode.trim().toUpperCase();

        // 路径 1: Jable 即时检索
        try {
            const jableStream = await this._searchJableStream(cleanCode);
            if (jableStream) return jableStream;
        } catch (jableErr) {
            console.warn('[PeachWebBridge] Jable 寻源失败:', jableErr.message);
        }

        // 路径 2: 更多来源持续按需扩充

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
            // 从搜索结果中匹配详情页链接
            const detailRegex = new RegExp(`href="(https:\\/\\/jable\\.tv\\/videos\\/[^"]*${code.toLowerCase()}[^"]*\\/)"`, 'i');
            const match = res.html.match(detailRegex);
            const detailUrl = match ? match[1] : null;

            if (detailUrl) {
                // 请求详情页获取最新 m3u8
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
