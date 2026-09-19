/**
 * 本地高阶离线存储工具 (IndexedDB Storage)
 * 
 * 职责：
 * 1. 突破 localStorage / GM_setValue 字符串长度与单 key 容量限制
 * 2. 安全持久化大体量数据：A-B 切片收藏、各站点评论离线缓存、媒体流元数据
 * 3. 异步 Promise 封装，支持隐身模式异常捕获与降级
 */

const DB_NAME = 'MissPlayerDB';
const DB_VERSION = 1;

export const STORES = {
    MARKERS: 'markers',
    COMMENTS: 'comments_cache',
    MEDIA: 'media_streams'
};

let dbPromise = null;

function getDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject(new Error('IndexedDB not supported'));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.MARKERS)) {
                db.createObjectStore(STORES.MARKERS, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
                db.createObjectStore(STORES.COMMENTS, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORES.MEDIA)) {
                db.createObjectStore(STORES.MEDIA, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

/**
 * 写入数据到指定 Store
 * @param {string} storeName 表名
 * @param {string} key 键名
 * @param {any} data 数据载荷
 */
export async function idbSet(storeName, key, data) {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put({ key, data, updatedAt: Date.now() });
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn(`[IndexedDB] 写入失败 (${storeName}/${key}):`, err.message);
        return false;
    }
}

/**
 * 从指定 Store 读取数据
 * @param {string} storeName 表名
 * @param {string} key 键名
 */
export async function idbGet(storeName, key) {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ? req.result.data : null);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn(`[IndexedDB] 读取失败 (${storeName}/${key}):`, err.message);
        return null;
    }
}

/**
 * 从指定 Store 删除数据
 * @param {string} storeName 表名
 * @param {string} key 键名
 */
export async function idbDelete(storeName, key) {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn(`[IndexedDB] 删除失败 (${storeName}/${key}):`, err.message);
        return false;
    }
}
