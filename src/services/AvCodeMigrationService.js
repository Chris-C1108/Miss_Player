/**
 * AvCodeMigrationService — 历史错位番号数据自愈与多端迁移引擎
 *
 * 覆盖存储介质：
 *   1. 浏览器本地：GM_setValue / localStorage (`tabs_*`, `mp_comment_draft_*`, `mp_sync_tombstones`)
 *   2. 浏览器 IndexedDB：`MissPlayerDB` (`subtitles`, `heatmap`) 与 `MissPlayerCommentCache` (`video_comments`)
 *   3. WebDAV 云端：`miss_player_sync.json` (经 SyncManager)、`media/[AVCODE]/`、`heatmaps/[AVCODE].json`、`comments/[AVCODE].json`
 *   4. Peach STRM：`[targetDir]/[AVCODE].strm` (依据文件内 `# source:` 原址核验后重写并触发扫描)
 */

import { getValue, setValue, deleteValue, hasGMApi } from '../utils/storage.js';
import { idbGet, idbSet, idbDelete, idbGetAll, STORES } from '../utils/indexedDB.js';
import { cleanAvCode, matchAvCodeFromText, extractMissavShardCode, getVideoCodeFromUrl } from '../utils/videoCode.js';
import { codeMatchesText } from '../player/subtitles/SubtitleCode.js';
import { SubtitleRepository } from '../player/subtitles/SubtitleRepository.js';
import { WebDavClient } from '../sync/WebDavClient.js';
import { SyncManager } from '../sync/SyncManager.js';
import { PeachService } from './PeachService.js';

const ALIAS_MAP_KEY = 'mp_avcode_migrated_aliases';
const LOCAL_CANON_FLAG_KEY = 'mp_avcode_local_canon_v1';
const REMOTE_MIGRATED_PAIR_PREFIX = 'mp_avcode_remote_migrated_';

const COMMENT_CACHE_DB_NAME = 'MissPlayerCommentCache';
const COMMENT_CACHE_STORE = 'video_comments';

function normalizeUpper(code) {
    return String(code || '').trim().toUpperCase();
}

function listAllTabStorageKeys() {
    const keys = new Set();
    try {
        if (typeof GM_listValues === 'function') {
            for (const k of GM_listValues() || []) {
                if (typeof k === 'string' && k.startsWith('tabs_')) {
                    keys.add(k);
                }
            }
        }
    } catch (_) {}

    try {
        if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const raw = localStorage.key(i);
                if (!raw) continue;
                const clean = raw.replace(/^(?:mp_|missNoAD_)/, '');
                if (clean.startsWith('tabs_')) {
                    keys.add(clean);
                }
            }
        }
    } catch (_) {}

    return Array.from(keys);
}

/**
 * 合并两组时间胶囊列表（按 id 或起止时间指纹去重，更新时间新者胜）
 * @param {Array} baseList
 * @param {Array} extraList
 * @returns {Array}
 */
export function mergeCapsuleLists(baseList = [], extraList = []) {
    const map = new Map();
    const put = (item) => {
        if (!item || typeof item !== 'object') return;
        const start = Math.round((Number(item.startTime ?? item.tabTime ?? 0)) * 10);
        const end = Math.round((Number(item.endTime ?? item.tabEnd ?? 0)) * 10);
        const key = item.id || `tab_${start}_${end}`;
        const updated = Number(item.updatedAt || item.createdAt || 0);
        const existing = map.get(key);
        if (!existing) {
            map.set(key, { ...item, id: item.id || key });
            return;
        }
        const exUpdated = Number(existing.updatedAt || existing.createdAt || 0);
        if (updated > exUpdated || (updated === exUpdated && !existing.comment && item.comment)) {
            map.set(key, { ...existing, ...item, id: existing.id || item.id || key });
        }
    };
    for (const t of (Array.isArray(baseList) ? baseList : [])) put(t);
    for (const t of (Array.isArray(extraList) ? extraList : [])) put(t);
    return Array.from(map.values()).sort((a, b) => (Number(a.startTime || 0)) - (Number(b.startTime || 0)));
}

/**
 * Element-wise Max 合并两条热度足迹数组
 */
function mergeHeatmapBins(baseBins = [], extraBins = []) {
    const len = Math.max(Array.isArray(baseBins) ? baseBins.length : 0, Array.isArray(extraBins) ? extraBins.length : 0);
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
        out[i] = Math.max(Number(baseBins[i]) || 0, Number(extraBins[i]) || 0);
    }
    return out;
}

function updateTombstoneVideoKeys(wrongKey, rightKey) {
    try {
        const tombstones = SyncManager.getLocalTombstones();
        if (!tombstones || !tombstones.markers) return false;
        let changed = false;
        for (const meta of Object.values(tombstones.markers)) {
            if (meta && typeof meta === 'object' && meta.videoKey === wrongKey) {
                meta.videoKey = rightKey;
                changed = true;
            }
        }
        if (changed) SyncManager.saveLocalTombstones(tombstones);
        return changed;
    } catch (_) {
        return false;
    }
}

async function migrateCommentCacheKey(wrongCode, rightCode) {
    if (typeof indexedDB === 'undefined' || !wrongCode || !rightCode || wrongCode === rightCode) return false;
    try {
        const db = await new Promise((resolve) => {
            const req = indexedDB.open(COMMENT_CACHE_DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(COMMENT_CACHE_STORE)) {
                    d.createObjectStore(COMMENT_CACHE_STORE, { keyPath: 'videoCode' });
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = () => resolve(null);
        });
        if (!db) return false;

        const wrongRec = await new Promise((resolve) => {
            try {
                const tx = db.transaction(COMMENT_CACHE_STORE, 'readonly');
                const req = tx.objectStore(COMMENT_CACHE_STORE).get(wrongCode);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (_) {
                resolve(null);
            }
        });
        if (!wrongRec) return false;

        // 仅在同键规范化（非 DM-XX 错位）时保留并合并；若为 DM-XX 错位缓存，直接清理失效缓存
        if (!/^DM-\d+$/i.test(wrongCode)) {
            const targetRec = await new Promise((resolve) => {
                try {
                    const tx = db.transaction(COMMENT_CACHE_STORE, 'readonly');
                    const req = tx.objectStore(COMMENT_CACHE_STORE).get(rightCode);
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => resolve(null);
                } catch (_) {
                    resolve(null);
                }
            });
            if (!targetRec) {
                await new Promise((resolve) => {
                    try {
                        const tx = db.transaction(COMMENT_CACHE_STORE, 'readwrite');
                        tx.objectStore(COMMENT_CACHE_STORE).put({ ...wrongRec, videoCode: rightCode });
                        tx.oncomplete = () => resolve(true);
                        tx.onerror = () => resolve(false);
                    } catch (_) {
                        resolve(false);
                    }
                });
            }
        }

        await new Promise((resolve) => {
            try {
                const tx = db.transaction(COMMENT_CACHE_STORE, 'readwrite');
                tx.objectStore(COMMENT_CACHE_STORE).delete(wrongCode);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (_) {
                resolve(false);
            }
        });
        return true;
    } catch (_) {
        return false;
    }
}

export class AvCodeMigrationService {
    static _runningPairs = new Set();

    static getAliasMap() {
        const raw = getValue(ALIAS_MAP_KEY, {});
        return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
    }

    static recordAlias(wrongCode, rightCode) {
        const w = normalizeUpper(wrongCode);
        const r = cleanAvCode(rightCode);
        if (!w || !r || w === r) return;
        const map = this.getAliasMap();
        if (map[`tabs_${w}`] === `tabs_${r}`) return;
        map[`tabs_${w}`] = `tabs_${r}`;
        setValue(ALIAS_MAP_KEY, map);
    }

    /**
     * 同步迁移浏览器本地存储中指定 wrongCode -> rightCode 的时间胶囊与评论草稿
     * 在 LoopManager.init() 之前调用，确保首帧即可无缝展示合并后的高光胶囊
     */
    static migrateLocalTabsAndDraftSync(wrongCode, rightCode) {
        const wrongNorm = normalizeUpper(wrongCode);
        const rightNorm = cleanAvCode(rightCode) || normalizeUpper(rightCode);
        if (!wrongNorm || !rightNorm || wrongNorm === rightNorm) return false;

        let migrated = false;
        const wrongKey = `tabs_${wrongNorm}`;
        const rightKey = `tabs_${rightNorm}`;

        // 1. 扫描所有变体大小写/后缀命名的 tabs_ 键（如 tabs_miaa-490-uncensored-leak / tabs_DM-84）
        const candidateWrongKeys = new Set([wrongKey]);
        for (const k of listAllTabStorageKeys()) {
            const suffix = k.slice(5);
            if (suffix && (normalizeUpper(suffix) === wrongNorm || cleanAvCode(suffix) === rightNorm) && k !== rightKey) {
                candidateWrongKeys.add(k);
            }
        }

        let targetTabs = getValue(rightKey, []);
        if (!Array.isArray(targetTabs)) targetTabs = [];

        for (const wk of candidateWrongKeys) {
            const oldTabs = getValue(wk, []);
            if (Array.isArray(oldTabs) && oldTabs.length > 0) {
                targetTabs = mergeCapsuleLists(targetTabs, oldTabs);
                migrated = true;
            }
            if (Array.isArray(oldTabs)) {
                // 仅当旧键真实存在过时清理并记录别名
                const existsInGm = hasGMApi() && typeof GM_listValues === 'function' && (GM_listValues() || []).includes(wk);
                const existsInLs = typeof localStorage !== 'undefined' && (
                    localStorage.getItem(`mp_${wk}`) !== null || localStorage.getItem(`missNoAD_${wk}`) !== null
                );
                if (existsInGm || existsInLs) {
                    deleteValue(wk);
                    updateTombstoneVideoKeys(wk, rightKey);
                    migrated = true;
                }
            }
        }

        if (migrated) {
            if (targetTabs.length > 0) {
                setValue(rightKey, targetTabs);
            }
            this.recordAlias(wrongNorm, rightNorm);
        }

        // 2. 迁移评论草稿
        const wrongDraftKey = `mp_comment_draft_${wrongNorm.toLowerCase()}`;
        const rightDraftKey = `mp_comment_draft_${rightNorm.toLowerCase()}`;
        const wrongDraft = getValue(wrongDraftKey, '');
        if (wrongDraft) {
            const rightDraft = getValue(rightDraftKey, '');
            if (!rightDraft) {
                setValue(rightDraftKey, wrongDraft);
            }
            deleteValue(wrongDraftKey);
            migrated = true;
        }

        return migrated;
    }

    /**
     * 启动时一次性扫描全部本地变体键（大小写 / -uncensored-leak / -c 后缀等），零网络开销安全归一
     */
    static async runStartupLocalCanonicalization() {
        let changedCount = 0;

        // 1. 归一化全部 tabs_<raw> 键
        for (const key of listAllTabStorageKeys()) {
            const rawCode = key.slice(5);
            const canonical = cleanAvCode(rawCode);
            if (!canonical || key === `tabs_${canonical}`) continue;
            const oldTabs = getValue(key, []);
            const targetKey = `tabs_${canonical}`;
            if (Array.isArray(oldTabs) && oldTabs.length > 0) {
                const existing = getValue(targetKey, []);
                setValue(targetKey, mergeCapsuleLists(existing, oldTabs));
            }
            deleteValue(key);
            updateTombstoneVideoKeys(key, targetKey);
            changedCount++;
        }

        // 已执行过深度 IDB 扫描则跳过重复遍历（tabs_* 上面每次 O(N) 内存极快）
        if (getValue(LOCAL_CANON_FLAG_KEY, false)) {
            return changedCount;
        }

        // 2. 扫描 IndexedDB subtitles store：修复变体键 + 误入 DM-XX 名下但标题明确指向其他番号的条目
        try {
            const subRows = await idbGetAll(STORES.SUBTITLES);
            for (const row of subRows) {
                const key = String(row?.key || '');
                const bundle = row?.data;
                if (!key || !bundle || !Array.isArray(bundle.items)) continue;

                const canonical = cleanAvCode(key);
                if (canonical && canonical !== key) {
                    const target = (await idbGet(STORES.SUBTITLES, canonical)) || {
                        code: canonical,
                        activeId: '',
                        favoriteId: '',
                        items: [],
                        updatedAt: 0
                    };
                    const merged = SubtitleRepository._merge(target, { ...bundle, code: canonical });
                    const mergedMap = new Map(merged.bundle.items.map((it) => [it.id, it]));
                    for (const it of bundle.items) {
                        if (!it?.id) continue;
                        const cur = mergedMap.get(it.id);
                        if (!cur || (!cur.content && it.content)) {
                            mergedMap.set(it.id, { ...cur, ...it });
                        }
                    }
                    await idbSet(STORES.SUBTITLES, canonical, {
                        ...merged.bundle,
                        code: canonical,
                        items: Array.from(mergedMap.values()),
                        updatedAt: Date.now()
                    });
                    await idbDelete(STORES.SUBTITLES, key);
                    changedCount++;
                    continue;
                }

                // 若 key 为 DM-XX 且内部条目全部明确指向另一个真实番号 R（例如 title 含 MIAA-490 而非 DM-84）
                if (/^DM-\d+$/i.test(key) && bundle.items.length > 0) {
                    const hasRealDm = bundle.items.some((it) => it.provider !== 'local' && codeMatchesText(it.title || '', key));
                    if (!hasRealDm) {
                        const detectedCodes = new Set();
                        for (const it of bundle.items) {
                            const matched = matchAvCodeFromText(it?.title || '');
                            if (matched && matched !== key) detectedCodes.add(matched);
                        }
                        if (detectedCodes.size === 1) {
                            const [realCode] = Array.from(detectedCodes);
                            await this._migrateSubtitleBundleLocal(key, realCode);
                            changedCount++;
                        }
                    }
                }
            }
        } catch (_) {}

        // 3. 扫描 IndexedDB heatmap store：归一 HEATMAP_<raw>
        try {
            const hmRows = await idbGetAll(STORES.HEATMAP);
            for (const row of hmRows) {
                const key = String(row?.key || '');
                if (!key.startsWith('HEATMAP_')) continue;
                const rawCode = key.slice('HEATMAP_'.length);
                const canonical = cleanAvCode(rawCode);
                if (!canonical || key === `HEATMAP_${canonical}`) continue;
                const oldData = row?.data;
                if (oldData && Array.isArray(oldData.bins)) {
                    const targetKey = `HEATMAP_${canonical}`;
                    const targetData = await idbGet(STORES.HEATMAP, targetKey);
                    const mergedBins = mergeHeatmapBins(targetData?.bins || [], oldData.bins);
                    await idbSet(STORES.HEATMAP, targetKey, {
                        avcode: canonical,
                        duration: targetData?.duration || oldData.duration || 0,
                        binSeconds: targetData?.binSeconds || oldData.binSeconds || 5,
                        bins: mergedBins,
                        updatedAt: Date.now()
                    });
                }
                await idbDelete(STORES.HEATMAP, key);
                changedCount++;
            }
        } catch (_) {}

        setValue(LOCAL_CANON_FLAG_KEY, true);
        return changedCount;
    }

    /**
     * 针对当前页面路由分片错位（如 /dm84/cn/miaa-490 -> wrongCode='DM-84', rightCode='MIAA-490'）
     * 执行本地 + IndexedDB + WebDAV + STRM 全链路幂等迁移
     */
    static async migrateCurrentPageIfNeeded(url = (typeof window !== 'undefined' ? window.location.href : ''), rightCodeParam = '', options = {}) {
        const rightCode = cleanAvCode(rightCodeParam || getVideoCodeFromUrl(url));
        const shardWrong = extractMissavShardCode(url);
        if (!rightCode) return false;

        // 1. 始终先同步合并当前编号的变体键（如 tabs_MIAA-490-UNCENSORED-LEAK -> tabs_MIAA-490）
        const localChanged = this.migrateLocalTabsAndDraftSync(shardWrong || rightCode, rightCode);

        if (!shardWrong || shardWrong === rightCode) {
            return localChanged;
        }

        const pairKey = `${shardWrong}->${rightCode}`;
        if (this._runningPairs.has(pairKey)) return localChanged;
        this._runningPairs.add(pairKey);

        try {
            let anyMigrated = localChanged;

            // 2. 本地 IndexedDB 迁移（字幕 / 热度 / 评论缓存）
            if (await this._migrateSubtitleBundleLocal(shardWrong, rightCode)) anyMigrated = true;
            if (await this._migrateHeatmapLocal(shardWrong, rightCode, options.duration || 0)) anyMigrated = true;
            if (await migrateCommentCacheKey(shardWrong, rightCode)) anyMigrated = true;

            // 3. 远端 WebDAV + Peach STRM 迁移（单对仅检查一次，避免每次打开重复网络探测）
            const remoteFlagKey = `${REMOTE_MIGRATED_PAIR_PREFIX}${shardWrong}_${rightCode}`;
            if (!getValue(remoteFlagKey, false)) {
                const webdavChanged = await this._migrateRemoteWebDavAndStrm(shardWrong, rightCode, options.duration || 0);
                if (webdavChanged) anyMigrated = true;
                setValue(remoteFlagKey, true);
            }

            if (anyMigrated) {
                this.recordAlias(shardWrong, rightCode);
                try {
                    window.dispatchEvent(new CustomEvent('mp_avcode_migrated', {
                        detail: { wrongCode: shardWrong, rightCode }
                    }));
                } catch (_) {}
                if (localChanged) {
                    try {
                        SyncManager.triggerAutoSync(options.playerState || null, 'change');
                    } catch (_) {}
                }
            }
            return anyMigrated;
        } finally {
            this._runningPairs.delete(pairKey);
        }
    }

    static async _migrateSubtitleBundleLocal(wrongCode, rightCode) {
        try {
            const oldBundle = await idbGet(STORES.SUBTITLES, wrongCode);
            if (!oldBundle || !Array.isArray(oldBundle.items)) return false;

            const transferable = oldBundle.items.filter((it) => {
                if (!it) return false;
                if (it.provider === 'local') return true;
                return codeMatchesText(it.title || '', rightCode);
            });

            if (transferable.length > 0) {
                const target = (await idbGet(STORES.SUBTITLES, rightCode)) || {
                    code: rightCode,
                    activeId: '',
                    favoriteId: '',
                    items: [],
                    updatedAt: 0
                };
                const map = new Map((target.items || []).map((it) => [it.id, it]));
                for (const item of transferable) {
                    const prev = map.get(item.id);
                    if (!prev || (!prev.content && item.content) || (item.favorite && !prev.favorite)) {
                        map.set(item.id, { ...prev, ...item, content: item.content || prev?.content || '' });
                    }
                }
                const nextBundle = {
                    code: rightCode,
                    activeId: target.activeId || (transferable.some((i) => i.id === oldBundle.activeId) ? oldBundle.activeId : ''),
                    favoriteId: target.favoriteId || (transferable.some((i) => i.id === oldBundle.favoriteId) ? oldBundle.favoriteId : ''),
                    items: Array.from(map.values()),
                    updatedAt: Date.now()
                };
                await idbSet(STORES.SUBTITLES, rightCode, nextBundle);
            }

            // 仅当全部条目都不真正属于 wrongCode 时清理 wrongCode
            const hasRealWrong = oldBundle.items.some((it) => it && it.provider !== 'local' && codeMatchesText(it.title || '', wrongCode));
            if (!hasRealWrong) {
                await idbDelete(STORES.SUBTITLES, wrongCode);
            }
            return transferable.length > 0 || !hasRealWrong;
        } catch (_) {
            return false;
        }
    }

    static async _migrateHeatmapLocal(wrongCode, rightCode, expectedDuration = 0) {
        try {
            const wrongKey = `HEATMAP_${wrongCode}`;
            const rightKey = `HEATMAP_${rightCode}`;
            const oldData = await idbGet(STORES.HEATMAP, wrongKey);
            if (!oldData || !Array.isArray(oldData.bins) || oldData.bins.length === 0) return false;

            const targetData = await idbGet(STORES.HEATMAP, rightKey);
            const refDur = Number(expectedDuration) || Number(targetData?.duration) || 0;
            const oldDur = Number(oldData.duration) || 0;
            // 安全守卫：若两者时长明确存在且相差 > 20 秒，则可能是恰好存在同名 DM-XX 影片，不误合并
            if (refDur > 0 && oldDur > 0 && Math.abs(refDur - oldDur) > 20) {
                return false;
            }

            const mergedBins = mergeHeatmapBins(targetData?.bins || [], oldData.bins);
            await idbSet(STORES.HEATMAP, rightKey, {
                avcode: rightCode,
                duration: targetData?.duration || oldDur,
                binSeconds: targetData?.binSeconds || oldData.binSeconds || 5,
                bins: mergedBins,
                updatedAt: Date.now()
            });
            await idbDelete(STORES.HEATMAP, wrongKey);
            return true;
        } catch (_) {
            return false;
        }
    }

    static async _migrateRemoteWebDavAndStrm(wrongCode, rightCode, expectedDuration = 0) {
        let changed = false;
        const syncConfig = SyncManager.getWebDavConfig();
        const hasSyncDav = WebDavClient.hasValidEndpoint(syncConfig) && Boolean(syncConfig.user);

        // 1. WebDAV 字幕目录迁移（同时覆盖 syncConfig 下的 media/<wrongCode>/ 与 Peach STRM 目录）
        const subtitleTargets = [];
        if (hasSyncDav) {
            subtitleTargets.push({ config: syncConfig, dir: `media/${wrongCode}/` });
        }
        const peachTarget = SubtitleRepository.resolveRemoteTarget(wrongCode);
        if (peachTarget && (peachTarget.dir !== `media/${wrongCode}/` || !hasSyncDav)) {
            subtitleTargets.push(peachTarget);
        }

        for (const wrongTarget of subtitleTargets) {
            try {
                const indexPath = `${wrongTarget.dir}_index.json`;
                const rawIdx = await WebDavClient.downloadFile(wrongTarget.config, indexPath);
                const remoteIdx = typeof rawIdx === 'string' ? JSON.parse(rawIdx) : rawIdx;
                if (!remoteIdx || !Array.isArray(remoteIdx.items)) continue;
                // 若在共享 Peach 根目录 (dir === '')，仅当索引明确归属 wrongCode 时才参与迁移清理
                if (!wrongTarget.dir && normalizeUpper(remoteIdx.code) !== wrongCode) continue;

                const relevant = remoteIdx.items.filter((it) => it && (it.provider === 'local' || codeMatchesText(it.title || '', rightCode)));
                if (relevant.length > 0) {
                    const rightBundle = await SubtitleRepository.load(rightCode);
                    const map = new Map((rightBundle.items || []).map((it) => [it.id, it]));
                    let dirtyItem = null;
                    for (const item of relevant) {
                        let content = '';
                        if (item.file) {
                            const dl = await WebDavClient.downloadFile(wrongTarget.config, `${wrongTarget.dir}${item.file}`);
                            if (typeof dl === 'string') content = dl;
                        }
                        const prev = map.get(item.id);
                        const mergedItem = { ...prev, ...item, file: '', content: content || prev?.content || '' };
                        map.set(item.id, mergedItem);
                        if (mergedItem.content && !dirtyItem) dirtyItem = mergedItem;
                    }
                    await SubtitleRepository.save({
                        code: rightCode,
                        activeId: rightBundle.activeId,
                        favoriteId: rightBundle.favoriteId || remoteIdx.favoriteId || '',
                        items: Array.from(map.values())
                    }, { sync: true, dirtyItem });
                    changed = true;
                }
                const hasRealWrong = remoteIdx.items.some((it) => it && it.provider !== 'local' && codeMatchesText(it.title || '', wrongCode));
                if (!hasRealWrong) {
                    for (const it of remoteIdx.items) {
                        if (it?.file && (wrongTarget.dir || String(it.file).toUpperCase().startsWith(`${wrongCode}.`))) {
                            await WebDavClient.deleteFile(wrongTarget.config, `${wrongTarget.dir}${it.file}`).catch(() => {});
                        }
                    }
                    if (wrongTarget.dir) {
                        await WebDavClient.deleteFile(wrongTarget.config, indexPath).catch(() => {});
                    }
                    changed = true;
                }
            } catch (_) {}
        }

        if (hasSyncDav) {

            // 2. WebDAV 热度迁移 (heatmaps/DM-84.json -> heatmaps/MIAA-490.json)
            try {
                const wrongHm = await WebDavClient.downloadFile(syncConfig, `heatmaps/${wrongCode}.json`);
                if (wrongHm && Array.isArray(wrongHm.bins) && wrongHm.bins.length > 0) {
                    const rightHm = await WebDavClient.downloadFile(syncConfig, `heatmaps/${rightCode}.json`);
                    const refDur = Number(expectedDuration) || Number(rightHm?.duration) || 0;
                    const oldDur = Number(wrongHm.duration) || 0;
                    if (!(refDur > 0 && oldDur > 0 && Math.abs(refDur - oldDur) > 20)) {
                        const mergedBins = mergeHeatmapBins(rightHm?.bins || [], wrongHm.bins);
                        await WebDavClient.uploadFile(syncConfig, `heatmaps/${rightCode}.json`, {
                            avcode: rightCode,
                            duration: rightHm?.duration || oldDur,
                            binSeconds: rightHm?.binSeconds || wrongHm.binSeconds || 5,
                            bins: mergedBins,
                            updatedAt: Date.now()
                        }, 'application/json; charset=utf-8');
                        await WebDavClient.deleteFile(syncConfig, `heatmaps/${wrongCode}.json`);
                        changed = true;
                    }
                }
            } catch (_) {}

            // 3. WebDAV 空/错位评论缓存文件清理 (comments/DM-84.json)
            try {
                const wrongCm = await WebDavClient.downloadFile(syncConfig, `comments/${wrongCode}.json`);
                if (wrongCm && typeof wrongCm === 'object' && Array.isArray(wrongCm.comments) && wrongCm.comments.length === 0) {
                    await WebDavClient.deleteFile(syncConfig, `comments/${wrongCode}.json`);
                    changed = true;
                }
            } catch (_) {}
        }

        // 4. Peach STRM 文件迁移（核验文件内容中的 # source: URL 是否明确指向 rightCode）
        try {
            const effectiveWebDav = PeachService.getEffectiveWebDavConfig();
            const davCfg = effectiveWebDav?.config;
            if (effectiveWebDav?.targetDir && WebDavClient.hasValidEndpoint(davCfg) && davCfg.user) {
                const strmCfg = { ...davCfg, path: effectiveWebDav.targetDir };
                const wrongFileName = `${wrongCode}.strm`;
                const wrongStrmPath = `${effectiveWebDav.targetDir}${wrongFileName}`;
                const rawStrm = await WebDavClient.downloadFile(strmCfg, wrongFileName);
                if (typeof rawStrm === 'string' && rawStrm.trim()) {
                    const sourceMatch = rawStrm.match(/^#\s*source:\s*(.+)$/im);
                    const sourceUrl = sourceMatch ? sourceMatch[1].trim() : '';
                    const resolvedFromSource = sourceUrl ? cleanAvCode(getVideoCodeFromUrl(sourceUrl)) : '';
                    if (resolvedFromSource === rightCode) {
                        const rightFileName = `${rightCode}.strm`;
                        const rightStrmPath = `${effectiveWebDav.targetDir}${rightFileName}`;
                        const alreadyExists = await WebDavClient.checkFileExists(strmCfg, rightStrmPath, 3500);
                        if (!alreadyExists) {
                            const updatedStrm = rawStrm
                                .replace(new RegExp(`(#\\s*avcode:\\s*)${wrongCode}\\b`, 'i'), `$1${rightCode}`)
                                .replace(new RegExp(`(/)${wrongCode}(?=[/?#\\r\\n]|$)`, 'gi'), `$1${rightCode}`);
                            await WebDavClient.uploadFile(
                                strmCfg,
                                rightFileName,
                                updatedStrm,
                                'text/plain; charset=utf-8'
                            );
                        }
                        await WebDavClient.deleteFile(strmCfg, wrongStrmPath);
                        const peachCfg = PeachService.getConfig();
                        if (peachCfg.enabled && peachCfg.base && peachCfg.token) {
                            PeachService.triggerScan().catch(() => {});
                        }
                        changed = true;
                    }
                }
            }
        } catch (_) {}

        return changed;
    }
}
