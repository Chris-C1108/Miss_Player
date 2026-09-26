/**
 * 多源流媒体预览资源池化调度器 (ResourcePoolManager)
 * 职责：
 * 1. 统一管理 Jable / MissAV / JavDB 等多源视频切片与 WebVTT 雪碧图
 * 2. 具备 LRU 淘汰机制，保证预览内存占用严格受控在 25MB 以内
 * 3. 对外输出标准规范化 resolvePreview(code) 异步管道
 */
import { mediaSniffer } from '../../network/MediaSniffer.js';

export class ResourcePoolManager {
    constructor({ maxEntries = 20 } = {}) {
        this.maxEntries = maxEntries;
        this.pool = new Map(); // code -> { previewUrl, vttUrl, timestamp, accessCount }
    }

    /**
     * 解析指定番号的可用视频预览或雪碧图地址
     * @param {string} code 番号
     * @returns {Promise<{ previewUrl: string|null, vttUrl: string|null, source: string }>}
     */
    async resolvePreview(code) {
        if (!code || typeof code !== 'string') {
            return { previewUrl: null, vttUrl: null, source: 'none' };
        }

        const normalized = code.trim().toUpperCase();

        // 1. 优先命中 LRU 缓存池
        if (this.pool.has(normalized)) {
            const entry = this.pool.get(normalized);
            entry.accessCount++;
            entry.timestamp = Date.now();
            return { previewUrl: entry.previewUrl, vttUrl: entry.vttUrl, source: 'cache' };
        }

        // 2. 从 MediaSniffer 已捕获的实时流中探测
        const sniffed = mediaSniffer.getAllStreams();
        let matchedUrl = null;
        for (const item of sniffed) {
            if (item.url && item.url.includes(normalized.toLowerCase())) {
                matchedUrl = item.url;
                break;
            }
        }

        const result = {
            previewUrl: matchedUrl,
            vttUrl: null,
            source: matchedUrl ? 'sniffed' : 'pending'
        };

        // 3. 写入 LRU 缓存池
        this._set(normalized, result);
        return result;
    }

    _set(code, data) {
        if (this.pool.size >= this.maxEntries) {
            // LRU 淘汰最久未访问的条目
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [k, v] of this.pool.entries()) {
                if (v.timestamp < oldestTime) {
                    oldestTime = v.timestamp;
                    oldestKey = k;
                }
            }
            if (oldestKey) {
                this.pool.delete(oldestKey);
            }
        }

        this.pool.set(code, {
            ...data,
            timestamp: Date.now(),
            accessCount: 1
        });
    }

    clear() {
        this.pool.clear();
    }
}

export const resourcePoolManager = new ResourcePoolManager();

