import { getValue, setValue, deleteValue, hasGMApi } from '../utils/storage.js';
import { WebDavClient } from './WebDavClient.js';

const CLIENT_ID_KEY = 'mp_client_id';
const WEBDAV_CONFIG_KEY = 'mp_webdav_config';
const LAST_SYNC_TIME_KEY = 'mp_webdav_last_sync_time';
const TOMBSTONES_KEY = 'mp_sync_tombstones';
const SETTING_TIMESTAMPS_KEY = 'mp_setting_timestamps';

const CURRENT_SCHEMA_VERSION = 2;
const MAX_TOMBSTONE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 天墓碑保留窗口 (GC 机制)

/**
 * 获取或创建当前终端唯一 Client ID
 */
export function getOrCreateClientId() {
    let storedId = getValue(CLIENT_ID_KEY, '');
    if (storedId) return storedId;

    // 生成基于随机数与时间戳的唯一标识
    const randPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36).substring(4);
    const newId = `mp_${randPart}${timePart}`;
    
    setValue(CLIENT_ID_KEY, newId);
    return newId;
}

/**
 * 获取当前终端的人性化设备名称 (例如 "Windows / Chrome" 或 "iPhone / Safari")
 */
export function getDeviceName() {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (/iPad|iPhone|iPod/.test(ua)) os = /iPad/.test(ua) ? 'iPad' : 'iPhone';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
    else if (/Windows NT/.test(ua)) os = 'Windows';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Linux/.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/ScriptCat/i.test(ua)) browser = 'ScriptCat';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';

    return `${os} (${browser})`;
}

/**
 * 获取当前终端形态类别 ('mobile' | 'tablet' | 'desktop')
 */
export function getDeviceType() {
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) return 'tablet';
    if (/Mobile|iPhone|Android/i.test(ua)) return 'mobile';
    return 'desktop';
}

/**
 * 云同步与多设备配置管理引擎 (SyncManager)
 * 采用 CRDT / LWW-Element-Set 最终一致性算法与墓碑标记 (Tombstones)，
 * 彻底解决多端非实时异步同步时已删除打点/配置被错误回流复活的问题。
 */
export class SyncManager {
    /**
     * 获取持久化保存的 WebDAV 连接配置
     */
    static getWebDavConfig() {
        const defaultCfg = {
            url: '',
            user: '',
            pass: '',
            path: '/MissPlayer/',
            autoSync: true
        };
        const saved = getValue(WEBDAV_CONFIG_KEY, null);
        return Object.assign({}, defaultCfg, (saved && typeof saved === 'object') ? saved : {});
    }

    /**
     * 保存 WebDAV 连接配置
     */
    static saveWebDavConfig(config) {
        setValue(WEBDAV_CONFIG_KEY, config);
    }

    /**
     * 获取上次同步成功时间戳
     */
    static getLastSyncTime() {
        return getValue(LAST_SYNC_TIME_KEY, 0);
    }

    /**
     * 设置上次同步成功时间戳
     */
    static setLastSyncTime(timestamp = Date.now()) {
        setValue(LAST_SYNC_TIME_KEY, timestamp);
    }

    // =========================================================================
    //  墓碑机制 (Tombstones) 与 字段时间戳管理
    // =========================================================================

    /**
     * 获取本地删除墓碑表
     * @returns {{ markers: Object.<string, { deletedAt: number, videoKey: string }>, customSeekSteps: Object.<string, number>, videos: Object.<string, number> }}
     */
    static getLocalTombstones() {
        const defaultTombstones = {
            markers: {},
            customSeekSteps: {},
            videos: {}
        };
        const stored = getValue(TOMBSTONES_KEY, null);
        if (!stored || typeof stored !== 'object') return defaultTombstones;
        return {
            markers: (stored.markers && typeof stored.markers === 'object') ? stored.markers : {},
            customSeekSteps: (stored.customSeekSteps && typeof stored.customSeekSteps === 'object') ? stored.customSeekSteps : {},
            videos: (stored.videos && typeof stored.videos === 'object') ? stored.videos : {}
        };
    }

    /**
     * 保存本地墓碑表 (自动执行 30 天 GC)
     */
    static saveLocalTombstones(tombstones) {
        const cleaned = this.purgeExpiredTombstones(tombstones);
        setValue(TOMBSTONES_KEY, cleaned);
    }

    /**
     * 记录一个删除操作墓碑 (Tombstone)
     * @param {'markers' | 'customSeekSteps' | 'videos'} type - 删除类型
     * @param {string} id - 被删除实体的唯一标识
     * @param {string} [extraInfo=null] - 附加信息 (如 videoKey)
     */
    static recordTombstone(type, id, extraInfo = null) {
        if (!id) return;
        const tombstones = this.getLocalTombstones();
        const now = Date.now();

        if (type === 'markers') {
            tombstones.markers[id] = { deletedAt: now, videoKey: extraInfo || '' };
        } else if (type === 'customSeekSteps') {
            tombstones.customSeekSteps[id] = now;
        } else if (type === 'videos') {
            tombstones.videos[id] = now;
        }

        this.saveLocalTombstones(tombstones);
    }

    /**
     * 清除某个实体的墓碑 (当实体被重新创建或修改时)
     */
    static clearTombstone(type, id) {
        if (!id) return;
        const tombstones = this.getLocalTombstones();
        let changed = false;

        if (type === 'markers' && tombstones.markers[id]) {
            delete tombstones.markers[id];
            changed = true;
        } else if (type === 'customSeekSteps' && tombstones.customSeekSteps[id]) {
            delete tombstones.customSeekSteps[id];
            changed = true;
        } else if (type === 'videos' && tombstones.videos[id]) {
            delete tombstones.videos[id];
            changed = true;
        }

        if (changed) {
            this.saveLocalTombstones(tombstones);
        }
    }

    /**
     * 垃圾回收已超过 30 天的陈旧墓碑，避免元数据无限增长
     */
    static purgeExpiredTombstones(tombstones) {
        if (!tombstones || typeof tombstones !== 'object') {
            return { markers: {}, customSeekSteps: {}, videos: {} };
        }
        const now = Date.now();
        const cutoff = now - MAX_TOMBSTONE_AGE;

        const cleanedMarkers = {};
        if (tombstones.markers) {
            for (const [id, meta] of Object.entries(tombstones.markers)) {
                const time = typeof meta === 'object' ? meta.deletedAt : meta;
                if (time && time >= cutoff) {
                    cleanedMarkers[id] = typeof meta === 'object' ? meta : { deletedAt: time };
                }
            }
        }

        const cleanedSteps = {};
        if (tombstones.customSeekSteps) {
            for (const [step, time] of Object.entries(tombstones.customSeekSteps)) {
                if (time >= cutoff) cleanedSteps[step] = time;
            }
        }

        const cleanedVideos = {};
        if (tombstones.videos) {
            for (const [k, time] of Object.entries(tombstones.videos)) {
                if (time >= cutoff) cleanedVideos[k] = time;
            }
        }

        return {
            markers: cleanedMarkers,
            customSeekSteps: cleanedSteps,
            videos: cleanedVideos
        };
    }

    /**
     * 获取各项设置项的独立修改时间戳
     */
    static getLocalSettingTimestamps() {
        const stored = getValue(SETTING_TIMESTAMPS_KEY, null);
        return (stored && typeof stored === 'object') ? stored : {};
    }

    /**
     * 记录设置项更新修改时间
     */
    static recordSettingUpdate(key) {
        if (!key) return;
        const timestamps = this.getLocalSettingTimestamps();
        timestamps[key] = Date.now();
        setValue(SETTING_TIMESTAMPS_KEY, timestamps);
    }

    // =========================================================================
    //  数据包打包与架构迁移 (Schema Migration)
    // =========================================================================

    /**
     * 收集本地所有需同步的数据包 (Settings + Markers + Tombstones + Meta)
     */
    static gatherLocalData(playerState = null) {
        const clientId = getOrCreateClientId();
        const now = Date.now();
        const tombstones = this.getLocalTombstones();
        const settingTimestamps = this.getLocalSettingTimestamps();

        // 1. 收集 Settings 配置
        const settings = playerState?.settings || {
            showProgressBar: getValue('showProgressBar', true),
            showSeekControlRow: getValue('showSeekControlRow', true),
            showLoopControlRow: getValue('showLoopControlRow', true),
            showPlaybackControlRow: getValue('showPlaybackControlRow', true),
            enabledSeekSteps: getValue('enabledSeekSteps', ['5s', '10s', '30s', '1m', '5m', '10m']),
            customUserSeekSteps: getValue('customUserSeekSteps', []),
            showCommentsSection: getValue('showCommentsSection', true),
            enabledCommentSources: getValue('enabledCommentSources', { jable: true, javdb: true, javlibrary: false }),
            sidebarPosition: getValue('sidebarPosition', 'right'),
            sidebarHidden: getValue('sidebarHidden', false),
            preferredPlaybackRate: parseFloat(getValue('preferredPlaybackRate', 1.0)) || 1.0,
            pauseOnBlur: getValue('pauseOnBlur', true),
            telemetryEnabled: getValue('telemetryEnabled', true),
            debugMode: getValue('debugMode', false)
        };

        // 2. 收集所有视频打点数据 (tabs_*)，规范化补全 id / createdAt / updatedAt
        const markers = {};
        try {
            const processList = (cleanKey, val) => {
                if (Array.isArray(val) && val.length > 0) {
                    markers[cleanKey] = val.map(item => {
                        const m = { ...item };
                        if (!m.id) {
                            const start = Math.round((m.startTime || m.tabTime || 0) * 10);
                            const end = Math.round((m.endTime || m.tabEnd || 0) * 10);
                            m.id = `tab_${start}_${end}_${Math.random().toString(36).slice(2, 6)}`;
                        }
                        if (!m.createdAt) m.createdAt = now;
                        if (!m.updatedAt) m.updatedAt = m.createdAt;
                        return m;
                    });
                }
            };

            if (typeof GM_listValues === 'function') {
                const keys = GM_listValues();
                for (const k of keys) {
                    if (k && k.startsWith('tabs_')) {
                        processList(k, getValue(k, []));
                    }
                }
            } else {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k) {
                        let cleanKey = k;
                        if (k.startsWith('mp_')) cleanKey = k.replace(/^mp_/, '');
                        if (cleanKey.startsWith('tabs_')) {
                            processList(cleanKey, getValue(cleanKey, []));
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[SyncManager] 收集打点数据遇到异常:', e);
        }

        const deviceType = getDeviceType();
        const deviceLayouts = {
            [deviceType]: {
                sidebarPosition: getValue('sidebarPosition', 'right'),
                sidebarHidden: getValue('sidebarHidden', false),
                updatedAt: settingTimestamps.sidebarPosition || settingTimestamps.sidebarHidden || now
            }
        };

        return {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            scriptVersion: '5.6.1',
            lastModified: now,
            lastModifiedBy: clientId,
            devices: {
                [clientId]: {
                    deviceName: getDeviceName(),
                    deviceType,
                    lastSyncTime: now,
                    scriptVersion: '5.6.1'
                }
            },
            deviceLayouts,
            settings,
            settingTimestamps,
            markers,
            tombstones
        };
    }

    /**
     * 架构版本迁移管道 (保证旧版本 Schema v1 格式自动平滑向前升级为 Schema v2)
     */
    static migrateBackupSchema(data) {
        if (!data || typeof data !== 'object') return null;

        const migrated = Object.assign({}, data);

        if (!migrated.schemaVersion || migrated.schemaVersion < CURRENT_SCHEMA_VERSION) {
            migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
            if (!migrated.devices) migrated.devices = {};
            if (!migrated.settings) migrated.settings = {};
            if (!migrated.settingTimestamps) migrated.settingTimestamps = {};
            if (!migrated.markers) migrated.markers = {};
            if (!migrated.deviceLayouts) migrated.deviceLayouts = {};
            if (!migrated.tombstones) {
                migrated.tombstones = { markers: {}, customSeekSteps: {}, videos: {} };
            }
            if (!migrated.lastModified) migrated.lastModified = Date.now();

            // 为旧版本 markers 补全唯一稳定 ID 和修改时间戳
            for (const [k, list] of Object.entries(migrated.markers)) {
                if (Array.isArray(list)) {
                    migrated.markers[k] = list.map(item => {
                        const m = { ...item };
                        if (!m.id) {
                            const start = Math.round((m.startTime || m.tabTime || 0) * 10);
                            const end = Math.round((m.endTime || m.tabEnd || 0) * 10);
                            m.id = `legacy_${start}_${end}`;
                        }
                        if (!m.updatedAt) m.updatedAt = migrated.lastModified || 0;
                        if (!m.createdAt) m.createdAt = m.updatedAt;
                        return m;
                    });
                }
            }
        }

        return migrated;
    }

    /**
     * 智能 3-Way / LWW 合并算法 (Smart Merge Engine)
     * @param {Object} localData - 本地数据包
     * @param {Object} remoteData - 远端数据包
     * @param {string} clientId - 当前终端 Client ID
     * @returns {Object} 合并后的最终数据包
     */
    static mergeData(localData, remoteData, clientId) {
        if (!remoteData) return localData;
        if (!localData) return remoteData;

        const remoteMigrated = this.migrateBackupSchema(remoteData);
        const now = Date.now();

        // 1. 合并墓碑集合 (Tombstones Union with Max timestamp)
        const localTombstones = localData.tombstones || { markers: {}, customSeekSteps: {}, videos: {} };
        const remoteTombstones = remoteMigrated.tombstones || { markers: {}, customSeekSteps: {}, videos: {} };

        const mergedMarkerTombstones = {};
        for (const [id, meta] of Object.entries(remoteTombstones.markers || {})) {
            mergedMarkerTombstones[id] = typeof meta === 'object' ? meta : { deletedAt: meta };
        }
        for (const [id, meta] of Object.entries(localTombstones.markers || {})) {
            const lMeta = typeof meta === 'object' ? meta : { deletedAt: meta };
            const existing = mergedMarkerTombstones[id];
            if (!existing || lMeta.deletedAt > existing.deletedAt) {
                mergedMarkerTombstones[id] = lMeta;
            }
        }

        const mergedStepTombstones = Object.assign({}, remoteTombstones.customSeekSteps || {}, localTombstones.customSeekSteps || {});
        const mergedVideoTombstones = Object.assign({}, remoteTombstones.videos || {}, localTombstones.videos || {});

        const mergedTombstones = {
            markers: mergedMarkerTombstones,
            customSeekSteps: mergedStepTombstones,
            videos: mergedVideoTombstones
        };

        // 2. 合并设备列表 (devices)
        const mergedDevices = Object.assign({}, remoteMigrated.devices || {}, localData.devices || {});
        mergedDevices[clientId] = {
            deviceName: getDeviceName(),
            deviceType: getDeviceType(),
            lastSyncTime: now,
            scriptVersion: '5.6.1'
        };

        // 3. 字段级 LWW 合并 Settings 配置
        const localSettings = localData.settings || {};
        const remoteSettings = remoteMigrated.settings || {};
        const localTimestamps = localData.settingTimestamps || {};
        const remoteTimestamps = remoteMigrated.settingTimestamps || {};
        const mergedSettingTimestamps = {};

        const mergedSettings = {};
        const allSettingKeys = Array.from(new Set([
            ...Object.keys(localSettings),
            ...Object.keys(remoteSettings)
        ]));

        for (const key of allSettingKeys) {
            if (key === 'customUserSeekSteps' || key === 'enabledSeekSteps' || key === 'enabledCommentSources') {
                continue;
            }

            const lTime = localTimestamps[key] || localData.lastModified || 0;
            const rTime = remoteTimestamps[key] || remoteMigrated.lastModified || 0;

            if (lTime >= rTime) {
                mergedSettings[key] = localSettings[key] !== undefined ? localSettings[key] : remoteSettings[key];
                mergedSettingTimestamps[key] = lTime;
            } else {
                mergedSettings[key] = remoteSettings[key] !== undefined ? remoteSettings[key] : localSettings[key];
                mergedSettingTimestamps[key] = rTime;
            }
        }

        // 合并 customUserSeekSteps (过滤墓碑中的已删除步进)
        const rawSteps = Array.from(new Set([
            ...(Array.isArray(localSettings.customUserSeekSteps) ? localSettings.customUserSeekSteps : []),
            ...(Array.isArray(remoteSettings.customUserSeekSteps) ? remoteSettings.customUserSeekSteps : [])
        ]));
        const mergedCustomSteps = rawSteps.filter(step => {
            const deletedAt = mergedStepTombstones[step];
            return !deletedAt; // 存在墓碑则已被删除，拒绝复活
        });
        mergedSettings.customUserSeekSteps = mergedCustomSteps;

        // 合并 enabledSeekSteps
        mergedSettings.enabledSeekSteps = Array.from(new Set([
            ...(Array.isArray(localSettings.enabledSeekSteps) ? localSettings.enabledSeekSteps : []),
            ...(Array.isArray(remoteSettings.enabledSeekSteps) ? remoteSettings.enabledSeekSteps : [])
        ]));
        if (mergedSettings.enabledSeekSteps.length === 0) {
            mergedSettings.enabledSeekSteps = ['5s', '10s', '30s', '1m', '5m', '10m'];
        }

        // 合并 enabledCommentSources
        mergedSettings.enabledCommentSources = Object.assign(
            { jable: true, javdb: true, javlibrary: false },
            remoteSettings.enabledCommentSources || {},
            localSettings.enabledCommentSources || {}
        );

        // 4. 核心：CRDT / Tombstone 视频打点合并 (Markers: tabs_*)
        const localMarkers = localData.markers || {};
        const remoteMarkers = remoteMigrated.markers || {};
        const allVideoKeys = Array.from(new Set([
            ...Object.keys(localMarkers),
            ...Object.keys(remoteMarkers)
        ]));

        const mergedMarkers = {};

        for (const vKey of allVideoKeys) {
            const lList = Array.isArray(localMarkers[vKey]) ? localMarkers[vKey] : [];
            const rList = Array.isArray(remoteMarkers[vKey]) ? remoteMarkers[vKey] : [];

            const markerMap = new Map();

            // 辅助处理打点候选
            const processCandidate = (m) => {
                if (!m) return;
                const mId = m.id || `tab_${Math.round((m.startTime || m.tabTime || 0) * 10)}_${Math.round((m.endTime || m.tabEnd || 0) * 10)}`;
                const mUpdated = m.updatedAt || m.createdAt || 0;

                // 核心墓碑校验：若存在墓碑且删除时间 >= 该打点的更新时间，说明已被某一端删除，严禁回流复活！
                const tomb = mergedMarkerTombstones[mId];
                if (tomb && tomb.deletedAt >= mUpdated) {
                    return; // 墓碑拦截，丢弃已删除的打点
                }

                if (!markerMap.has(mId)) {
                    markerMap.set(mId, { ...m, id: mId, updatedAt: mUpdated });
                } else {
                    const existing = markerMap.get(mId);
                    const eUpdated = existing.updatedAt || existing.createdAt || 0;
                    if (mUpdated > eUpdated) {
                        markerMap.set(mId, { ...existing, ...m, id: mId, updatedAt: mUpdated });
                    } else if (mUpdated === eUpdated && !existing.comment && m.comment) {
                        markerMap.set(mId, { ...existing, comment: m.comment });
                    }
                }
            };

            for (const m of rList) processCandidate(m);
            for (const m of lList) processCandidate(m);

            const mergedList = Array.from(markerMap.values()).sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
            if (mergedList.length > 0) {
                mergedMarkers[vKey] = mergedList;
            } else {
                mergedMarkers[vKey] = [];
            }
        }

        // 5. 合并设备形态特异布局 (Desktop / Mobile / Tablet)
        const mergedDeviceLayouts = Object.assign(
            {},
            remoteMigrated.deviceLayouts || {},
            localData.deviceLayouts || {}
        );

        return {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            scriptVersion: '5.6.1',
            lastModified: now,
            lastModifiedBy: clientId,
            devices: mergedDevices,
            deviceLayouts: mergedDeviceLayouts,
            settings: mergedSettings,
            settingTimestamps: mergedSettingTimestamps,
            markers: mergedMarkers,
            tombstones: mergedTombstones
        };
    }

    /**
     * 将同步/合并后的数据包落盘到本地持久化存储并同步 PlayerState 实例
     */
    static applyDataToLocal(data, playerState = null) {
        if (!data) return;

        const { settings, settingTimestamps, markers, deviceLayouts, tombstones } = data;

        // 1. 持久化共通核心设置项
        if (settings && typeof settings === 'object') {
            for (const [k, v] of Object.entries(settings)) {
                setValue(k, v);
            }
        }

        // 2. 持久化设置项独立修改时间戳与墓碑
        if (settingTimestamps && typeof settingTimestamps === 'object') {
            setValue(SETTING_TIMESTAMPS_KEY, settingTimestamps);
        }
        if (tombstones && typeof tombstones === 'object') {
            this.saveLocalTombstones(tombstones);
        }

        // 3. 恢复当前终端专属形态的特异布局配置 (桌面侧栏位置与折叠状态不与移动端冲突)
        const currentDeviceType = getDeviceType();
        if (deviceLayouts && deviceLayouts[currentDeviceType]) {
            const layout = deviceLayouts[currentDeviceType];
            if (layout.sidebarPosition !== undefined) setValue('sidebarPosition', layout.sidebarPosition);
            if (layout.sidebarHidden !== undefined) setValue('sidebarHidden', layout.sidebarHidden);
        }

        // 4. 持久化打点数据 (tabs_*)：对于已清空或已被删除的视频打点，执行 deleteValue
        if (markers && typeof markers === 'object') {
            for (const [k, v] of Object.entries(markers)) {
                if (k.startsWith('tabs_')) {
                    if (Array.isArray(v) && v.length > 0) {
                        setValue(k, v);
                    } else {
                        deleteValue(k);
                    }
                }
            }
        }

        // 5. 刷新内存中 PlayerState
        if (playerState) {
            playerState.loadSettings();
        }
    }

    /**
     * 执行同步总入口
     * @param {Object} options - { mode: 'merge' | 'upload' | 'download', config: Object, playerState: PlayerState }
     * @returns {Promise<{ success: boolean, message: string, data: Object }>}
     */
    static async executeSync(options) {
        const {
            mode = 'merge',
            config = this.getWebDavConfig(),
            playerState = null
        } = options;

        if (!config.url) {
            throw new Error('未配置 WebDAV 服务器地址');
        }

        const clientId = getOrCreateClientId();
        const localData = this.gatherLocalData(playerState);

        if (mode === 'upload') {
            // ================= 向上覆盖 (本地 -> 远端) =================
            await WebDavClient.uploadBackup(config, localData);
            this.setLastSyncTime(localData.lastModified);
            return {
                success: true,
                message: '本地配置已成功向上覆盖至云端！',
                data: localData
            };
        }

        if (mode === 'download') {
            // ================= 向下覆盖 (远端 -> 本地) =================
            const remoteData = await WebDavClient.downloadBackup(config);
            if (!remoteData) {
                throw new Error('云端备份文件不存在，无法向下覆盖');
            }
            const migratedRemote = this.migrateBackupSchema(remoteData);
            this.applyDataToLocal(migratedRemote, playerState);
            this.setLastSyncTime(Date.now());
            return {
                success: true,
                message: '已成功从云端拉取配置并覆盖本地！',
                data: migratedRemote
            };
        }

        // ================= 智能合并同步 (Smart Merge) =================
        const remoteData = await WebDavClient.downloadBackup(config);
        const mergedData = this.mergeData(localData, remoteData, clientId);

        // 写回 WebDAV
        await WebDavClient.uploadBackup(config, mergedData);

        // 写回本地
        this.applyDataToLocal(mergedData, playerState);
        this.setLastSyncTime(mergedData.lastModified);

        return {
            success: true,
            message: '云端多端配置智能合并同步完成！',
            data: mergedData
        };
    }

    /**
     * 自动智能合并同步触发器
     * @param {PlayerState} [playerState=null] - 播放器状态机实例
     * @param {'startup' | 'change'} [reason='startup'] - 触发时机
     */
    static triggerAutoSync(playerState = null, reason = 'startup') {
        const config = this.getWebDavConfig();
        if (!config.url || config.autoSync === false) {
            return;
        }

        if (this._isAutoSyncing) return;

        const now = Date.now();
        const lastSync = this.getLastSyncTime();

        if (reason === 'startup') {
            // 启动时节流：若 5 分钟内已成功同步，则无需重复同步
            if (lastSync > 0 && now - lastSync < 5 * 60 * 1000) {
                return;
            }

            // 延迟 2.5 秒在后台静默执行
            setTimeout(async () => {
                try {
                    this._isAutoSyncing = true;
                    await this.executeSync({ mode: 'merge', config, playerState });
                    console.log('[SyncManager] 自动智能合并同步 (启动) 完成');
                } catch (err) {
                    console.warn('[SyncManager] 启动自动同步未完成:', err.message || err);
                } finally {
                    this._isAutoSyncing = false;
                }
            }, 2500);
            return;
        }

        if (reason === 'change') {
            // 变更时防抖：5 秒无新变更后静默在后台同步
            if (this._autoSyncDebounceTimer) {
                clearTimeout(this._autoSyncDebounceTimer);
            }
            this._autoSyncDebounceTimer = setTimeout(async () => {
                try {
                    this._isAutoSyncing = true;
                    await this.executeSync({ mode: 'merge', config, playerState });
                    console.log('[SyncManager] 自动智能合并同步 (数据变更) 完成');
                } catch (err) {
                    console.warn('[SyncManager] 数据变更自动同步未完成:', err.message || err);
                } finally {
                    this._isAutoSyncing = false;
                }
            }, 5000);
        }
    }
}
