/**
 * 评论多级缓存管理器 (CommentCacheManager) - 原生 IndexedDB 工业级实现
 * 
 * 核心设计决策 (为什么不用油猴 storage)：
 * 1. 评论体量与长文本 JSON 序列化极大，写入 GM_setValue 会通过 IPC 消息强占脚本管理器主进程 SQLite，导致油猴与浏览器卡死；
 * 2. 采用浏览器原生纯异步非阻塞 IndexedDB，零 IPC 消息负担，几十 MB 大容量高吞吐，彻底隔绝油猴扩展压力；
 * 3. 搭配 L1 内存高速 Map 缓存，实现页面内秒级直接恢复与页码级 (collectedPages: Set) 防重。
 */

import { logger } from '../../utils/logger.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';

const DB_NAME = 'MissPlayerCommentCache';
const DB_VERSION = 1;
const STORE_NAME = 'video_comments';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 分钟有效期

// 极简原生 IndexedDB Promise 工具封装
class IDBHelper {
    static _dbPromise = null;

    static getDB() {
        if (this._dbPromise) return this._dbPromise;
        if (typeof indexedDB === 'undefined') return Promise.resolve(null);

        this._dbPromise = new Promise((resolve) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'videoCode' });
                    }
                };
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => {
                    logger.debug('[IDBHelper] 打开 IndexedDB 失败 (降级为纯内存缓存):', e.target?.error);
                    resolve(null);
                };
            } catch (err) {
                logger.debug('[IDBHelper] IndexedDB 初始化异常:', err);
                resolve(null);
            }
        });
        return this._dbPromise;
    }

    static async get(key) {
        const db = await this.getDB();
        if (!db) return null;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (_) {
                resolve(null);
            }
        });
    }

    static async put(val) {
        const db = await this.getDB();
        if (!db || !val) return;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(val);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (_) {
                resolve(false);
            }
        });
    }

    static async delete(key) {
        const db = await this.getDB();
        if (!db) return;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.delete(key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (_) {
                resolve(false);
            }
        });
    }

    static async clear() {
        const db = await this.getDB();
        if (!db) return;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.clear();
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (_) {
                resolve(false);
            }
        });
    }
}

export class CommentCacheManager {
    // L1 内存静态高速缓存：Map<videoCode, CacheEntry>
    static _memoryCache = new Map();

    /**
     * 判断当前番号是否存在有效的本地评论缓存
     * @param {string} videoCode 
     * @returns {boolean}
     */
    static hasValidCache(videoCode) {
        const entry = this.get(videoCode);
        if (!entry || !entry.sites) return false;
        return Object.values(entry.sites).some(s => s && Array.isArray(s.comments) && s.comments.length > 0);
    }

    /**
     * 读取指定番号的评论缓存 (L1 内存秒级即时命中，同时后台异步从 IndexedDB 预热)
     * @param {string} videoCode 
     * @returns {Object|null}
     */
    static get(videoCode) {
        if (!videoCode) return null;
        const now = Date.now();

        // 1. 优先从 L1 内存缓存同步读取（零阻塞）
        const memEntry = this._memoryCache.get(videoCode);
        if (memEntry) {
            if (now - memEntry.timestamp < CACHE_TTL_MS) {
                return memEntry;
            }
            this._memoryCache.delete(videoCode);
            IDBHelper.delete(videoCode);
            return null;
        }

        // 2. 异步从 IndexedDB 预热回内存（供下次调用使用）
        IDBHelper.get(videoCode).then(dbRecord => {
            if (dbRecord && (now - (dbRecord.timestamp || 0) < CACHE_TTL_MS)) {
                if (dbRecord.sites) {
                    for (const k of Object.keys(dbRecord.sites)) {
                        const s = dbRecord.sites[k];
                        if (s && Array.isArray(s.collectedPages)) {
                            s.collectedPages = new Set(s.collectedPages);
                        }
                    }
                }
                this._memoryCache.set(videoCode, dbRecord);
            }
        }).catch(() => {});

        return null;
    }

    /**
     * 异步精确读取 (优先 L1，其次等待 IndexedDB)
     * @param {string} videoCode 
     * @returns {Promise<Object|null>}
     */
    static async getAsync(videoCode) {
        if (!videoCode) return null;
        const syncRes = this.get(videoCode);
        if (syncRes) return syncRes;

        const now = Date.now();
        const dbRecord = await IDBHelper.get(videoCode);
        if (dbRecord && (now - (dbRecord.timestamp || 0) < CACHE_TTL_MS)) {
            if (dbRecord.sites) {
                for (const k of Object.keys(dbRecord.sites)) {
                    const s = dbRecord.sites[k];
                    if (s && Array.isArray(s.collectedPages)) {
                        s.collectedPages = new Set(s.collectedPages);
                    }
                }
            }
            this._memoryCache.set(videoCode, dbRecord);
            return dbRecord;
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

        // 异步非阻塞持久化至浏览器内置 IndexedDB (彻底绕开油猴 storage)
        const idbRecord = {
            videoCode: entry.videoCode,
            timestamp: entry.timestamp,
            sites: {}
        };
        for (const k of Object.keys(entry.sites)) {
            const s = entry.sites[k];
            idbRecord.sites[k] = {
                ...s,
                collectedPages: Array.from(s.collectedPages || [1])
            };
        }
        IDBHelper.put(idbRecord).catch(() => {});
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
     * 清空指定番号或全局的评论缓存
     * @param {string} [videoCode] 
     */
/**
     * 检测并迁移油猴 storage / localStorage 中的历史评论缓存至原生 IndexedDB
     * 迁移完成后立即彻底删除油猴 storage 中的旧键，释放脚本管理器空间，防止卡死
     * @returns {Promise<number>} 迁移的记录数
     */
    static async migrateFromLegacyStorage() {
        try {
            let allKeys = [];
            if (typeof GM_listValues === 'function') {
                try {
                    allKeys = GM_listValues() || [];
                } catch (_) {}
            }
            if (typeof localStorage !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && !allKeys.includes(k)) {
                        allKeys.push(k);
                    }
                }
            }

            // 识别旧评论缓存键 (包含 mp_ccache_, ccache_, mp_comments_, comments_cache_)
            const legacyKeys = allKeys.filter(k => 
                k.startsWith('mp_ccache_') || 
                k.startsWith('ccache_') || 
                k.startsWith('mp_comments_') || 
                k.startsWith('comments_cache_')
            );

            if (legacyKeys.length === 0) return 0;

            let migratedCount = 0;
            for (const key of legacyKeys) {
                try {
                    let raw = null;
                    if (typeof GM_getValue === 'function') {
                        raw = GM_getValue(key, null);
                    }
                    if (!raw && typeof localStorage !== 'undefined') {
                        const item = localStorage.getItem(key);
                        if (item) {
                            try { raw = JSON.parse(item); } catch (_) { raw = item; }
                        }
                    }

                    if (typeof raw === 'string') {
                        try { raw = JSON.parse(raw); } catch (_) {}
                    }
                    if (raw && typeof raw === 'object') {
                        const videoCode = raw.videoCode || key.replace(/^(mp_ccache_|ccache_|mp_comments_|comments_cache_)/, '');
                        if (videoCode && raw.sites) {
                            const idbRecord = {
                                videoCode,
                                timestamp: raw.timestamp || Date.now(),
                                sites: {}
                            };
                            for (const sk of Object.keys(raw.sites)) {
                                const s = raw.sites[sk];
                                idbRecord.sites[sk] = {
                                    ...s,
                                    collectedPages: Array.isArray(s.collectedPages) ? s.collectedPages : Array.from(s.collectedPages || [1])
                                };
                            }
                            await IDBHelper.put(idbRecord);
                            migratedCount++;
                        }
                    }

                    // 迁移完毕后，彻底从油猴 storage 和 localStorage 删除，释放空间
                    if (typeof GM_deleteValue === 'function') {
                        try { GM_deleteValue(key); } catch (_) {}
                    }
                    if (typeof localStorage !== 'undefined') {
                        try { localStorage.removeItem(key); } catch (_) {}
                    }
                } catch (itemErr) {
                    logger.debug('[CommentCacheManager] 迁移单项失败:', itemErr);
                }
            }

            if (migratedCount > 0) {
                logger.log(`[CommentCacheManager] 成功将 ${migratedCount} 条旧评论缓存从油猴 storage 迁移至原生 IndexedDB，已彻底清理油猴存储！`);
                DebugLogPanel.addLog(`[数据迁移] 检测到油猴旧评论缓存，已迁移 ${migratedCount} 条记录至 IndexedDB 并彻底清除旧存储`, 'success');
            }
            return migratedCount;
        } catch (e) {
            logger.debug('[CommentCacheManager] 历史评论迁移异常:', e);
            return 0;
        }
    }

        
    /**
     * 彻底清空所有本地 IndexedDB 评论数据库、内存高速缓存及 localStorage 残留
     * @returns {Promise<boolean>}
     */
    static async clearAll() {
        this._memoryCache.clear();

        // 1. 关闭现有连接并物理清空 MissPlayerCommentCache 数据库
        if (IDBHelper._dbPromise) {
            try {
                const db = await IDBHelper._dbPromise;
                if (db && typeof db.close === 'function') db.close();
            } catch (_) {}
            IDBHelper._dbPromise = null;
        }

        if (typeof indexedDB !== 'undefined') {
            try {
                await new Promise((resolve) => {
                    const req = indexedDB.deleteDatabase(DB_NAME);
                    req.onsuccess = () => resolve(true);
                    req.onerror = () => resolve(false);
                    req.onblocked = () => resolve(false);
                });
            } catch (_) {}

            // 2. 清空通用存储 MissPlayerDB 中的 comments_cache 仓库
            try {
                await new Promise((resolve) => {
                    const req2 = indexedDB.open('MissPlayerDB', 1);
                    req2.onsuccess = (e) => {
                        const db2 = e.target.result;
                        if (db2.objectStoreNames.contains('comments_cache')) {
                            const tx = db2.transaction('comments_cache', 'readwrite');
                            tx.objectStore('comments_cache').clear();
                            tx.oncomplete = () => { db2.close(); resolve(true); };
                            tx.onerror = () => { db2.close(); resolve(false); };
                        } else {
                            db2.close();
                            resolve(true);
                        }
                    };
                    req2.onerror = () => resolve(false);
                });
            } catch (_) {}
        }

        // 3. 彻底清除 localStorage 中可能遗留的旧缓存
        if (typeof localStorage !== 'undefined') {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('mp_ccache_') || k.startsWith('ccache_') || k.startsWith('comments_cache_'))) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }

        logger.log('[CommentCacheManager] 已彻底清空所有本地 IndexedDB、内存及 Storage 评论缓存');
        DebugLogPanel.addLog('[本地存储] 已彻底清空所有 IndexedDB 离线评论数据库', 'success');
        return true;
    }

    /**
     * 自动执行墓碑增量垃圾回收 (Tombstone GC)
     * 清理超过 maxAgeDays 天未访问的过期冷评论缓存
     * @param {number} maxAgeDays 默认 30 天
     */
    static async runTombstoneGC(maxAgeDays = 30) {
        try {
            const db = await IDBHelper.getDB();
            if (!db) return 0;
            const threshold = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
            let cleanedCount = 0;

            const tx = db.transaction(STORES.COMMENTS_CACHE, 'readwrite');
            const store = tx.objectStore(STORES.COMMENTS_CACHE);
            const req = store.openCursor();

            return new Promise((resolve) => {
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const val = cursor.value;
                        if (val && val.timestamp && val.timestamp < threshold) {
                            cursor.delete();
                            cleanedCount++;
                        }
                        cursor.continue();
                    } else {
                        if (cleanedCount > 0) {
                            logger.log(`[CommentCacheManager] 墓碑垃圾回收完成，已清理 ${cleanedCount} 条超过 ${maxAgeDays} 天的过期冷缓存`);
                        }
                        resolve(cleanedCount);
                    }
                };
                req.onerror = () => resolve(0);
            });
        } catch (_) {
            return 0;
        }
    }

    static clear(videoCode) {
        if (videoCode) {
            this._memoryCache.delete(videoCode);
            IDBHelper.delete(videoCode).catch(() => {});
            logger.log(`[CommentCacheManager] 已从内存与 IndexedDB 清除番号 ${videoCode} 评论缓存`);
        } else {
            this._memoryCache.clear();
            IDBHelper.clear().catch(() => {});
            logger.log('[CommentCacheManager] 已清空全部浏览器内置评论缓存');
        }
    }
}
