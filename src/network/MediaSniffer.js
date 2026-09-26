/**
 * 网络层媒体与数据嗅探器 (MediaSniffer)
 * 
 * 职责：
 * 1. 在 @run-at document-start 阶段安全拦截 window 与 unsafeWindow 的 fetch 与 XHR
 * 2. 实时捕获 .m3u8、.mp4、.m4s 等视频流与清晰度源地址
 * 3. 规避 DOM 正则解析滞后性与脆弱性，实现网络层零延迟捕获
 */

class MediaSniffer {
    constructor() {
        this.listeners = new Set();
        this.sniffedStreams = new Map(); // url -> { type, timestamp, quality }
        this.initialized = false;
    }

    /**
     * 初始化网络劫持
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        this._hookFetch();
        this._hookXHR();
        console.log('[MediaSniffer] 网络层媒体嗅探已就绪');
    }

    /**
     * 注册流发现监听器
     * @param {Function} callback ({ url, type, quality }) => void
     */
    onMedia(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
        }
        return () => this.listeners.delete(callback);
    }

    /**
     * 记录并广播捕获到的媒体流
     */
    recordStream(url, type = 'unknown', meta = {}) {
        if (!url || typeof url !== 'string') return;
        if (this.sniffedStreams.has(url)) return;

        // 规范化与过滤
        const streamInfo = {
            url,
            type: this._detectType(url, type),
            timestamp: Date.now(),
            ...meta
        };

        this.sniffedStreams.set(url, streamInfo);
        console.log('[MediaSniffer] 嗅探到媒体流:', streamInfo.type, url);

        for (const listener of this.listeners) {
            try {
                listener(streamInfo);
            } catch (err) {
                console.error('[MediaSniffer] 监听回调异常:', err);
            }
        }
    }

    /**
     * 获取最近捕获到的指定类型流
     */
    /**
     * 获取所有嗅探捕获到的媒体流列表
     * @returns {Array}
     */
    getAllStreams() {
        return Array.from(this.sniffedStreams.values());
    }

    getLatestStream(type = null) {
        const list = Array.from(this.sniffedStreams.values()).reverse();
        if (!type) return list[0] || null;
        return list.find(s => s.type === type) || null;
    }

    _detectType(url, hint = '') {
        const lower = url.toLowerCase();
        if (lower.includes('.m3u8') || hint === 'hls') return 'hls';
        if (lower.includes('.mp4')) return 'mp4';
        if (lower.includes('.webm')) return 'webm';
        if (lower.includes('/hls/') || lower.includes('/playlist/')) return 'hls';
        return hint || 'media';
    }

    _isMediaUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return lower.includes('.m3u8') || 
               lower.includes('.mp4') || 
               lower.includes('.webm') ||
               lower.includes('/playlist') ||
               lower.includes('/manifest');
    }

    _hookFetch() {
        const targets = [];
        if (typeof window !== 'undefined' && window.fetch) targets.push(window);
        if (typeof unsafeWindow !== 'undefined' && unsafeWindow && unsafeWindow.fetch && unsafeWindow !== window) {
            targets.push(unsafeWindow);
        }

        for (const ctx of targets) {
            const originalFetch = ctx.fetch;
            const sniffer = this;

            ctx.fetch = new Proxy(originalFetch, {
                apply(target, thisArg, args) {
                    try {
                        const req = args[0];
                        const url = typeof req === 'string' ? req : (req && req.url ? req.url : '');
                        if (sniffer._isMediaUrl(url)) {
                            sniffer.recordStream(url, 'fetch');
                        }
                    } catch (_) {}
                    return Reflect.apply(target, thisArg, args);
                }
            });
        }
    }

    _hookXHR() {
        const targets = [];
        if (typeof window !== 'undefined' && window.XMLHttpRequest) targets.push(window.XMLHttpRequest);
        if (typeof unsafeWindow !== 'undefined' && unsafeWindow && unsafeWindow.XMLHttpRequest && unsafeWindow !== window) {
            targets.push(unsafeWindow.XMLHttpRequest);
        }

        for (const XHR of targets) {
            const originalOpen = XHR.prototype.open;
            const sniffer = this;

            XHR.prototype.open = function(method, url, ...rest) {
                try {
                    if (typeof url === 'string' && sniffer._isMediaUrl(url)) {
                        sniffer.recordStream(url, 'xhr');
                    }
                } catch (_) {}
                return originalOpen.call(this, method, url, ...rest);
            };
        }
    }
}

export const mediaSniffer = new MediaSniffer();
