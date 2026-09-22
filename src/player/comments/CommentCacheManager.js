/**
 * 评论多级缓存管理器 (CommentCacheManager)
 * 
 * 采用工业级 Page-Aware Feed Cache 架构思想：
 * 1. L1 内存静态高速缓存：跨播放器实例在页面生命周期内实现零序列化秒开；
 * 2. L2 会话缓存 (sessionStorage)：支持页面临时前进后退/刷新，隔离不同标签页与番号，设置 15 分钟 TTL；
 * 3. 页码级防重与增量合并：精确追踪各站点已抓取页码集 (collectedPages)，彻底杜绝重复请求。
 */

import { logger } from '../../utils/logger.js';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 分钟有效期
const STORAGE_PREFIX = 'mp_ccache_';

export class CommentCacheManager {
    // L1 内存静态缓存：Map<videoCode, CacheEntry>
    static _memoryCache = new Map();

    /**
     * 判断当前番号是否存在有效的本地评论缓存
     * @param {string} videoCode 
     * @returns {boolean}
     */
    static hasValidCache(videoCode) {
        const entry = this.get(videoCode);
        if (!entry || !entry.sites) return false;
        // 至少有一个站点包含有效已加载评论
        return Object.values(entry.sites).some(s => s && Array.isArray(s.comments) && s.comments.length > 0);
    }

    /**
     * 读取指定番号的评论缓存 (L1 优先，L2 降级并做 TTL 校验)
     * @param {string} videoCode 
     * @returns {Object|null}
     */
    static get(videoCode) {
        if (!videoCode) return null;
        const now = Date.now();

        // 1. 检查 L1 内存缓存
        const memEntry = this._memoryCache.get(videoCode);
        if (memEntry) {
            if (now - memEntry.timestamp < CACHE_TTL_MS) {
                return memEntry;
            }
            this._memoryCache.delete(videoCode);
        }

        // 2. 检查 L2 会话缓存 (sessionStorage)
        try {
            if (typeof sessionStorage !== 'undefined') {
                const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${videoCode}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && (now - (parsed.timestamp || 0) < CACHE_TTL_MS)) {
                        // 还原站点数据中的 collectedPages 为 Set
                        if (parsed.sites) {
                            for (const siteKey of Object.keys(parsed.sites)) {
                                const s = parsed.sites[siteKey];
                                if (s && Array.isArray(s.collectedPages)) {
                                    s.collectedPages = new Set(s.collectedPages);
                                }
                            }
                        }
                        this._memoryCache.set(videoCode, parsed);
                        return parsed;
                    }
                    sessionStorage.removeItem(`${STORAGE_PREFIX}${videoCode}`);
                }
            }
        } catch (e) {
            logger.debug('[CommentCacheManager] 读取会话缓存异常:', e);
        }

        return null;
    }

    /**
     * 保存或更新某站点的评论数据至缓存
     * @param {string} videoCode 
     * @param {string} siteKey 
     * @param {Object} siteInstance 
     */
    static saveSiteCache(videoCode, siteKey, siteInstance) {
        if (!videoCode || !siteKey || !siteInstance) return;

        let entry = this._memoryCache.get(videoCode);
        if (!entry) {
            entry = {
                videoCode,
                timestamp: Date.now(),
                sites: {}
            };
            this._memoryCache.set(videoCode, entry);
        }

        entry.timestamp = Date.now();
        const collectedPagesArray = (siteInstance.collectedPages instanceof Set)
            ? Array.from(siteInstance.collectedPages)
            : (Array.isArray(siteInstance.collectedPages) ? siteInstance.collectedPages : [1]);

        entry.sites[siteKey] = {
            key: siteKey,
            status: siteInstance.status || 'loaded',
            comments: Array.isArray(siteInstance.comments) ? [...siteInstance.comments] : [],
            totalCount: siteInstance.totalCount || 0,
            hasMore: Boolean(siteInstance.hasMore),
            currentPage: siteInstance.currentPage || 1,
            collectedPages: new Set(collectedPagesArray),
            workingDomain: siteInstance.workingDomain || '',
            videoId: siteInstance.videoId || '',
            movieId: siteInstance.movieId || '',
            updatedAt: Date.now()
        };

        // 异步更新至 L2 sessionStorage
        this._persistToSession(videoCode, entry);
    }

    /**
     * 将缓存持久化至 sessionStorage
     * @private
     */
    static _persistToSession(videoCode, entry) {
        try {
            if (typeof sessionStorage !== 'undefined') {
                // 转换 Set 为 Array 保证合法 JSON 序列化
                const serializableSites = {};
                for (const k of Object.keys(entry.sites)) {
                    const s = entry.sites[k];
                    serializableSites[k] = {
                        ...s,
                        collectedPages: Array.from(s.collectedPages || [1])
                    };
                }
                const toStore = {
                    videoCode: entry.videoCode,
                    timestamp: entry.timestamp,
                    sites: serializableSites
                };
                sessionStorage.setItem(`${STORAGE_PREFIX}${videoCode}`, JSON.stringify(toStore));
            }
        } catch (e) {
            logger.debug('[CommentCacheManager] sessionStorage 写入跳过:', e);
        }
    }

    /**
     * 判断某站点的某页是否已经被采集过
     * @param {string} videoCode 
     * @param {string} siteKey 
     * @param {number} page 
     * @returns {boolean}
     */
    static isPageCollected(videoCode, siteKey, page) {
        const entry = this.get(videoCode);
        if (!entry || !entry.sites || !entry.sites[siteKey]) return false;
        const site = entry.sites[siteKey];
        if (site.collectedPages instanceof Set) {
            return site.collectedPages.has(page);
        }
        if (Array.isArray(site.collectedPages)) {
            return site.collectedPages.includes(page);
        }
        return false;
    }

    /**
     * 清空指定番号或全局的评论缓存 (用于用户主动点击重试或刷新)
     * @param {string} [videoCode] 
     */
    static clear(videoCode) {
        if (videoCode) {
            this._memoryCache.delete(videoCode);
            try {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.removeItem(`${STORAGE_PREFIX}${videoCode}`);
                }
            } catch (_) {}
            logger.log(`[CommentCacheManager] 已清除番号 ${videoCode} 的评论缓存`);
        } else {
            this._memoryCache.clear();
            try {
                if (typeof sessionStorage !== 'undefined') {
                    for (let i = sessionStorage.length - 1; i >= 0; i--) {
                        const key = sessionStorage.key(i);
                        if (key && key.startsWith(STORAGE_PREFIX)) {
                            sessionStorage.removeItem(key);
                        }
                    }
                }
            } catch (_) {}
            logger.log('[CommentCacheManager] 已清除所有本地评论缓存');
        }
    }
}
