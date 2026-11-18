/**
 * SubtitleRepository — 字幕多级存储仓库
 *
 * 读取优先级：IndexedDB 本地极速 -> WebDAV 番号独立文件 -> 空
 * 写入策略：本地 IndexedDB 立即落盘 + WebDAV 节流增量漫游（跨设备共享）
 * 文件拓扑：`{WebDAV根}/subtitles/{番号}.json`，与热度足迹 heatmaps/ 完全解耦
 */

import { idbGet, idbSet, STORES } from '../../utils/indexedDB.js';
import { WebDavClient } from '../../sync/WebDavClient.js';
import { SyncManager } from '../../sync/SyncManager.js';

const SUBTITLE_DIR = 'subtitles';
const UPLOAD_THROTTLE_MS = 5000;

function normalizeKey(avcode) {
    return String(avcode || '').trim().toUpperCase();
}

function mergeItems(localItems = [], remoteItems = []) {
    const map = new Map();
    for (const item of localItems) {
        if (item && item.id) map.set(item.id, item);
    }
    let changed = false;
    for (const item of remoteItems) {
        if (!item || !item.id) continue;
        const existing = map.get(item.id);
        if (!existing || (Number(item.addedAt) || 0) > (Number(existing.addedAt) || 0)) {
            map.set(item.id, item);
            changed = true;
        }
    }
    return { items: Array.from(map.values()), changed };
}

export class SubtitleRepository {
    /**
     * 读取番号字幕包（本地优先，远端增量合并回写）
     * @param {string} avcode
     * @returns {Promise<{code:string, activeId:string, items:Array<Object>, updatedAt:number}>}
     */
    static async load(avcode) {
        const key = normalizeKey(avcode);
        const empty = { code: key, activeId: '', items: [], updatedAt: 0 };
        if (!key) return empty;

        let bundle = empty;
        try {
            const local = await idbGet(STORES.SUBTITLES, key);
            if (local && Array.isArray(local.items)) {
                bundle = {
                    code: key,
                    activeId: local.activeId || '',
                    items: local.items,
                    updatedAt: Number(local.updatedAt) || 0
                };
            }
        } catch (err) {
            console.warn('[SubtitleRepository] 本地读取失败:', err?.message);
        }

        const remoteItems = await SubtitleRepository._download(avcode);
        if (remoteItems.length) {
            const merged = mergeItems(bundle.items, remoteItems);
            if (merged.changed) {
                bundle = { ...bundle, items: merged.items, updatedAt: Date.now() };
                await SubtitleRepository.save(bundle, { sync: false });
            }
        }
        return bundle;
    }

    /**
     * 写入字幕包（本地立即落盘 + WebDAV 节流上传）
     * @param {{code:string, activeId:string, items:Array<Object>}} bundle
     * @param {{sync?: boolean}} [options]
     */
    static async save(bundle, options = {}) {
        const { sync = true } = options;
        const key = normalizeKey(bundle?.code);
        if (!key) return false;
        const payload = {
            code: key,
            activeId: bundle.activeId || '',
            items: Array.isArray(bundle.items) ? bundle.items : [],
            updatedAt: Date.now()
        };
        const localOk = await idbSet(STORES.SUBTITLES, key, payload);
        if (sync) SubtitleRepository._upload(payload);
        return localOk;
    }

    /**
     * 远端数据下载（无有效 WebDAV 配置时静默跳过）
     * @param {string} avcode
     * @returns {Promise<Array<Object>>}
     */
    static async _download(avcode) {
        try {
            const config = SyncManager.getWebDavConfig();
            if (!WebDavClient.hasValidEndpoint(config) || !config.user) return [];
            const remote = await WebDavClient.downloadFile(config, `${SUBTITLE_DIR}/${normalizeKey(avcode)}.json`);
            const parsed = typeof remote === 'string' ? JSON.parse(remote) : remote;
            return Array.isArray(parsed?.items) ? parsed.items : [];
        } catch (err) {
            console.warn('[SubtitleRepository] WebDAV 读取跳过:', err?.message);
            return [];
        }
    }

    /**
     * 远端上传（带 5 秒防重叠节流，失败静默降级，不影响本地体验）
     * @param {Object} payload
     */
    static async _upload(payload) {
        const now = Date.now();
        if (now - SubtitleRepository._lastUploadAt < UPLOAD_THROTTLE_MS) {
            clearTimeout(SubtitleRepository._pendingUploadTimer);
            SubtitleRepository._pendingUploadTimer = setTimeout(() => {
                SubtitleRepository._upload(payload);
            }, UPLOAD_THROTTLE_MS);
            return;
        }
        SubtitleRepository._lastUploadAt = now;
        try {
            const config = SyncManager.getWebDavConfig();
            if (!WebDavClient.hasValidEndpoint(config) || !config.user) return;
            const res = await WebDavClient.uploadFile(
                config,
                `${SUBTITLE_DIR}/${payload.code}.json`,
                JSON.stringify(payload),
                'application/json; charset=utf-8'
            );
            if (res && [200, 201, 204].includes(res.status)) {
                window.DebugLogPanel?.addLog?.(`[字幕] 已同步 WebDAV: subtitles/${payload.code}.json`, 'info');
            }
        } catch (err) {
            console.warn('[SubtitleRepository] WebDAV 上传跳过:', err?.message);
        }
    }
}

SubtitleRepository._lastUploadAt = 0;
SubtitleRepository._pendingUploadTimer = null;
