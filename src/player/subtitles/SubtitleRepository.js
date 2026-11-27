/**
 * SubtitleRepository — 字幕多级存储仓库
 *
 * 本地层：IndexedDB `subtitles` store（含字幕正文，离线极速读取）
 * 远端层：WebDAV 番号独立目录
 *   · 若已配置 Peach STRM 目录 → 直接写入该目录（与 .strm 同源，Peach 侧可直接使用）
 *   · 否则在同步目录下创建 `media/{番号}/`
 *
 * 远端目录内容：
 *   `_index.json`  轻量索引（标题/语言/评分/收藏/file 映射）
 *   `{番号}.{lang}.{hash}.{ext}`  可直接被播放器/播放盒读取的字幕正文
 */

import { idbGet, idbSet, idbDelete, idbGetAll, STORES } from '../../utils/indexedDB.js';
import { WebDavClient } from '../../sync/WebDavClient.js';
import { SyncManager } from '../../sync/SyncManager.js';
import { PeachService } from '../../services/PeachService.js';

const INDEX_FILE = '_index.json';
const UPLOAD_THROTTLE_MS = 1200;
const REMOTE_DIR_PREFIX = 'media';

function normalizeKey(avcode) {
    return String(avcode || '').trim().toUpperCase();
}

function shortHash(text) {
    let hash = 0;
    const str = String(text || '');
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36).slice(-5);
}

function safeSegment(text, fallback = 'sub') {
    const cleaned = String(text || '')
        .replace(/[\\/:*?"<>|\s]+/g, '')
        .slice(0, 24);
    return cleaned || fallback;
}

function isManualFavoriteItem(item) {
    return Boolean(item?.favorite && !item?.autoSaved && item?.favoriteSource !== 'auto');
}

function buildFileName(avcode, item) {
    const lang = safeSegment(item.lang || item.langLabel || 'sub', 'sub');
    const ext = String(item.format || 'srt').toLowerCase().replace(/[^a-z]/g, '') || 'srt';
    return `${normalizeKey(avcode)}.${lang}.${shortHash(item.id)}.${ext}`;
}

export class SubtitleRepository {
    /**
     * 解析远端存储目标
     * @param {string} avcode
     * @returns {{config: Object, dir: string}|null}
     */
    static resolveRemoteTarget(avcode) {
        const syncConfig = SyncManager.getWebDavConfig();
        if (!WebDavClient.hasValidEndpoint(syncConfig) || !syncConfig.user) return null;

        try {
            const peach = PeachService.getConfig();
            if (peach && peach.enabled) {
                const effective = PeachService.getEffectiveWebDavConfig();
                if (effective?.targetDir && effective?.config) {
                    // Peach 目录即字幕落盘目录，直接从该目录取文件名
                    return { config: { ...effective.config, path: effective.targetDir }, dir: '' };
                }
            }
        } catch (_) {
            /* Peach 未启用或读取失败时回落同步目录 */
        }

        return { config: syncConfig, dir: `${REMOTE_DIR_PREFIX}/${normalizeKey(avcode)}/` };
    }

    /**
     * 读取番号字幕包（本地优先，远端索引合并）
     * @param {string} avcode
     * @returns {Promise<{code:string, activeId:string, favoriteId:string, items:Array<Object>, updatedAt:number}>}
     */
    static async load(avcode) {
        const code = normalizeKey(avcode);
        const empty = { code, activeId: '', favoriteId: '', items: [], updatedAt: 0 };
        if (!code) return empty;

        let bundle = empty;
        try {
            const local = await idbGet(STORES.SUBTITLES, code);
            if (local && Array.isArray(local.items)) {
                bundle = {
                    code,
                    activeId: local.activeId || '',
                    favoriteId: local.favoriteId || '',
                    items: local.items,
                    updatedAt: Number(local.updatedAt) || 0
                };
            }
        } catch (err) {
            console.warn('[SubtitleRepository] 本地读取失败:', err?.message);
        }

        const remote = await SubtitleRepository._downloadIndex(code);
        if (remote && Array.isArray(remote.items) && remote.items.length) {
            const merged = SubtitleRepository._merge(bundle, remote);
            if (merged.changed) {
                bundle = merged.bundle;
                idbSet(STORES.SUBTITLES, code, bundle);
            }
        }
        return bundle;
    }

    /**
     * 写入字幕包（本地立即落盘 + 远端节流同步）
     * @param {{code:string, activeId:string, favoriteId:string, items:Array<Object>}} bundle
     * @param {{sync?: boolean, dirtyItem?: Object|null}} [options]
     */
    static async save(bundle, options = {}) {
        const { sync = true, dirtyItem = null } = options;
        const code = normalizeKey(bundle?.code);
        if (!code) return false;

        const payload = {
            code,
            activeId: bundle.activeId || '',
            favoriteId: bundle.favoriteId || '',
            items: Array.isArray(bundle.items) ? bundle.items : [],
            updatedAt: Date.now()
        };
        const localOk = await idbSet(STORES.SUBTITLES, code, payload);
        if (sync) SubtitleRepository._scheduleRemoteSync(payload, dirtyItem);
        return localOk;
    }

    /**
     * 拉取远端字幕正文（跨设备漫游时本地缺失内容的补全通道）
     * @param {Object} item
     * @param {string} avcode
     * @returns {Promise<string>}
     */
    static async downloadItem(item, avcode) {
        const target = SubtitleRepository.resolveRemoteTarget(avcode);
        if (!target || !item?.file) return '';
        try {
            const raw = await WebDavClient.downloadFile(target.config, `${target.dir}${item.file}`);
            return typeof raw === 'string' ? raw : '';
        } catch (err) {
            console.warn('[SubtitleRepository] 远端字幕下载失败:', err?.message);
            return '';
        }
    }

    /**
     * 删除远端字幕正文（取消收藏时调用，避免目录里堆积孤儿文件）
     * @param {Object} item
     * @param {string} avcode
     * @returns {Promise<boolean>}
     */
    static async deleteRemoteItem(item, avcode) {
        const target = SubtitleRepository.resolveRemoteTarget(avcode);
        if (!target || !item?.file) return false;
        return WebDavClient.deleteFile(target.config, `${target.dir}${item.file}`);
    }

    /**
     * 清理本地 IndexedDB 字幕缓存（支持按番号局部清理或全量清空）
     * @param {{ codes?: string[]|null }} [options]
     * @returns {Promise<{ clearedCount: number }>}
     */
    static async clearLocal({ codes = null } = {}) {
        if (Array.isArray(codes) && codes.length > 0) {
            const keys = Array.from(new Set(codes.map((c) => normalizeKey(c)).filter(Boolean)));
            let clearedCount = 0;
            for (const key of keys) {
                if (await idbDelete(STORES.SUBTITLES, key)) clearedCount += 1;
            }
            return { clearedCount };
        }
        const rows = await idbGetAll(STORES.SUBTITLES);
        let clearedCount = 0;
        for (const row of rows) {
            if (row?.key && await idbDelete(STORES.SUBTITLES, row.key)) clearedCount += 1;
        }
        return { clearedCount };
    }

    static _merge(localBundle, remoteIndex) {
        const map = new Map(localBundle.items.map((item) => [item.id, item]));
        let changed = false;
        for (const remoteItem of remoteIndex.items) {
            if (!remoteItem?.id) continue;
            const existing = map.get(remoteItem.id);
            if (!existing) {
                map.set(remoteItem.id, { ...remoteItem, content: '' });
                changed = true;
                continue;
            }
            const existingManual = isManualFavoriteItem(existing);
            const remoteManual = isManualFavoriteItem(remoteItem);
            const remoteNewer = (Number(remoteItem.addedAt) || 0) > (Number(existing.addedAt) || 0);
            if (remoteNewer || (remoteItem.favorite && !existing.favorite) || (remoteManual && !existingManual)) {
                const manualWins = existingManual || remoteManual;
                map.set(remoteItem.id, {
                    ...existing,
                    ...remoteItem,
                    content: existing.content || '',
                    favorite: Boolean(remoteItem.favorite || existing.favorite),
                    autoSaved: manualWins ? false : Boolean(remoteItem.autoSaved ?? existing.autoSaved),
                    favoriteSource: manualWins
                        ? 'manual'
                        : (remoteItem.favoriteSource || existing.favoriteSource || (remoteItem.autoSaved ? 'auto' : undefined))
                });
                changed = true;
            }
        }
        const localFav = localBundle.favoriteId ? map.get(localBundle.favoriteId) : null;
        const remoteFav = remoteIndex.favoriteId ? map.get(remoteIndex.favoriteId) : null;
        let favoriteId = localBundle.favoriteId || remoteIndex.favoriteId || '';
        if (isManualFavoriteItem(remoteFav) && !isManualFavoriteItem(localFav)) {
            favoriteId = remoteFav.id;
        } else if (!isManualFavoriteItem(localFav)) {
            const anyManual = Array.from(map.values()).find((item) => isManualFavoriteItem(item));
            if (anyManual) favoriteId = anyManual.id;
        }
        if (favoriteId !== localBundle.favoriteId) changed = true;
        return { changed, bundle: { ...localBundle, favoriteId, items: Array.from(map.values()) } };
    }

    static async _downloadIndex(avcode) {
        const target = SubtitleRepository.resolveRemoteTarget(avcode);
        if (!target) return null;
        try {
            const raw = await WebDavClient.downloadFile(target.config, `${target.dir}${INDEX_FILE}`);
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (_) {
            return null;
        }
    }

    static _scheduleRemoteSync(payload, dirtyItem) {
        const now = Date.now();
        const elapsed = now - SubtitleRepository._lastSyncAt;
        clearTimeout(SubtitleRepository._pendingTimer);
        const run = () => {
            SubtitleRepository._lastSyncAt = Date.now();
            SubtitleRepository._syncRemote(payload, dirtyItem);
        };
        if (elapsed >= UPLOAD_THROTTLE_MS) run();
        else SubtitleRepository._pendingTimer = setTimeout(run, UPLOAD_THROTTLE_MS - elapsed);
    }

    static async _syncRemote(payload, dirtyItem) {
        const target = SubtitleRepository.resolveRemoteTarget(payload.code);
        if (!target) return;
        const { config, dir } = target;

        try {
            // 1. 先落盘字幕正文，保证索引引用的文件一定存在
            const items = payload.items.map((item) => {
                const file = item.file || buildFileName(payload.code, item);
                return { ...item, file };
            });

            const uploadList = dirtyItem
                ? items.filter((item) => item.id === dirtyItem.id && item.content)
                : [];

            for (const item of uploadList) {
                await WebDavClient.uploadFile(
                    config,
                    `${dir}${item.file}`,
                    item.content,
                    'text/plain; charset=utf-8'
                );
            }

            // 2. 索引只保留元数据，杜绝每次同步回传全部字幕正文
            const index = {
                code: payload.code,
                activeId: payload.activeId,
                favoriteId: payload.favoriteId,
                updatedAt: payload.updatedAt,
                items: items.map(({ content, ...meta }) => meta)
            };
            const res = await WebDavClient.uploadFile(
                config,
                `${dir}${INDEX_FILE}`,
                JSON.stringify(index),
                'application/json; charset=utf-8'
            );
            if (res && [200, 201, 204].includes(res.status)) {
                window.DebugLogPanel?.addLog?.(`[字幕] 已同步 WebDAV: ${dir}${INDEX_FILE}`, 'info');
            }
        } catch (err) {
            console.warn('[SubtitleRepository] WebDAV 同步跳过:', err?.message);
        }
    }
}

SubtitleRepository._lastSyncAt = 0;
SubtitleRepository._pendingTimer = null;
