import { getValue, setValue, hasGMApi } from '../utils/storage.js';
import { WebDavClient } from './WebDavClient.js';

const CLIENT_ID_KEY = 'mp_client_id';
const WEBDAV_CONFIG_KEY = 'mp_webdav_config';
const LAST_SYNC_TIME_KEY = 'mp_webdav_last_sync_time';
const CURRENT_SCHEMA_VERSION = 1;

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
            autoSync: false
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

    /**
     * 收集本地所有需同步的数据包 (Settings + Markers + Client Meta)
     */
    static gatherLocalData(playerState = null) {
        const clientId = getOrCreateClientId();
        const now = Date.now();

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

        // 2. 收集所有视频打点数据 (tabs_*)
        const markers = {};
        try {
            if (typeof GM_listValues === 'function') {
                const keys = GM_listValues();
                for (const k of keys) {
                    if (k && k.startsWith('tabs_')) {
                        const val = getValue(k, []);
                        if (Array.isArray(val) && val.length > 0) {
                            markers[k] = val;
                        }
                    }
                }
            } else {
                // localStorage 遍历
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k) {
                        let cleanKey = k;
                        if (k.startsWith('mp_')) cleanKey = k.replace(/^mp_/, '');
                        if (cleanKey.startsWith('tabs_')) {
                            const val = getValue(cleanKey, []);
                            if (Array.isArray(val) && val.length > 0) {
                                markers[cleanKey] = val;
                            }
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
                sidebarHidden: getValue('sidebarHidden', false)
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
            markers
        };
    }

    /**
     * 架构版本迁移管道 (保证旧版本格式自动向前兼容转化)
     */
    static migrateBackupSchema(data) {
        if (!data || typeof data !== 'object') return null;

        const migrated = Object.assign({}, data);

        // 如果没有 schemaVersion 或版本 < 1
        if (!migrated.schemaVersion || migrated.schemaVersion < 1) {
            migrated.schemaVersion = 1;
            if (!migrated.devices) migrated.devices = {};
            if (!migrated.settings) migrated.settings = {};
            if (!migrated.markers) migrated.markers = {};
            if (!migrated.lastModified) migrated.lastModified = Date.now();
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

        // 1. 合并终端设备字典 (devices)
        const mergedDevices = Object.assign({}, remoteMigrated.devices || {}, localData.devices || {});
        mergedDevices[clientId] = {
            deviceName: getDeviceName(),
            lastSyncTime: now,
            scriptVersion: '5.6.1'
        };

        // 2. 合并设置项 (Settings)
        const localSettings = localData.settings || {};
        const remoteSettings = remoteMigrated.settings || {};

        // 列表类设置做集合并集去重
        const mergedEnabledSeekSteps = Array.from(new Set([
            ...(Array.isArray(localSettings.enabledSeekSteps) ? localSettings.enabledSeekSteps : []),
            ...(Array.isArray(remoteSettings.enabledSeekSteps) ? remoteSettings.enabledSeekSteps : [])
        ]));

        const mergedCustomSteps = Array.from(new Set([
            ...(Array.isArray(localSettings.customUserSeekSteps) ? localSettings.customUserSeekSteps : []),
            ...(Array.isArray(remoteSettings.customUserSeekSteps) ? remoteSettings.customUserSeekSteps : [])
        ]));

        // 评论源字典合并
        const mergedCommentSources = Object.assign(
            { jable: true, javdb: true, javlibrary: false },
            remoteSettings.enabledCommentSources || {},
            localSettings.enabledCommentSources || {}
        );

        // 标量设置按最后修改时间 (LWW)
        const isRemoteNewer = (remoteMigrated.lastModified || 0) > (localData.lastModified || 0);
        const baseSettings = isRemoteNewer ? remoteSettings : localSettings;
        const fallbackSettings = isRemoteNewer ? localSettings : remoteSettings;

        const mergedSettings = {
            showProgressBar: baseSettings.showProgressBar !== undefined ? baseSettings.showProgressBar : fallbackSettings.showProgressBar,
            showSeekControlRow: baseSettings.showSeekControlRow !== undefined ? baseSettings.showSeekControlRow : fallbackSettings.showSeekControlRow,
            showLoopControlRow: baseSettings.showLoopControlRow !== undefined ? baseSettings.showLoopControlRow : fallbackSettings.showLoopControlRow,
            showPlaybackControlRow: baseSettings.showPlaybackControlRow !== undefined ? baseSettings.showPlaybackControlRow : fallbackSettings.showPlaybackControlRow,
            enabledSeekSteps: mergedEnabledSeekSteps.length > 0 ? mergedEnabledSeekSteps : ['5s', '10s', '30s', '1m', '5m', '10m'],
            customUserSeekSteps: mergedCustomSteps,
            showCommentsSection: baseSettings.showCommentsSection !== undefined ? baseSettings.showCommentsSection : fallbackSettings.showCommentsSection,
            enabledCommentSources: mergedCommentSources,
            sidebarPosition: baseSettings.sidebarPosition || fallbackSettings.sidebarPosition || 'right',
            sidebarHidden: baseSettings.sidebarHidden !== undefined ? baseSettings.sidebarHidden : fallbackSettings.sidebarHidden,
            preferredPlaybackRate: baseSettings.preferredPlaybackRate || fallbackSettings.preferredPlaybackRate || 1.0,
            pauseOnBlur: baseSettings.pauseOnBlur !== undefined ? baseSettings.pauseOnBlur : fallbackSettings.pauseOnBlur,
            telemetryEnabled: baseSettings.telemetryEnabled !== undefined ? baseSettings.telemetryEnabled : fallbackSettings.telemetryEnabled,
            debugMode: baseSettings.debugMode !== undefined ? baseSettings.debugMode : fallbackSettings.debugMode
        };

        // 3. 智能合并视频打点/高光片段 (Markers: tabs_*)
        const localMarkers = localData.markers || {};
        const remoteMarkers = remoteMigrated.markers || {};
        const allMarkerKeys = Array.from(new Set([...Object.keys(localMarkers), ...Object.keys(remoteMarkers)]));
        const mergedMarkers = {};

        for (const key of allMarkerKeys) {
            const lList = Array.isArray(localMarkers[key]) ? localMarkers[key] : [];
            const rList = Array.isArray(remoteMarkers[key]) ? remoteMarkers[key] : [];

            if (lList.length === 0) {
                mergedMarkers[key] = rList;
                continue;
            }
            if (rList.length === 0) {
                mergedMarkers[key] = lList;
                continue;
            }

            // 两端均存在同一视频的打点：按 (startTime_endTime / id) 指纹去重融合
            const markerMap = new Map();

            // 先入库远端
            for (const m of rList) {
                const sig = m.id || `${Math.round((m.tabTime || 0) * 10) / 10}_${Math.round((m.tabEnd || 0) * 10) / 10}`;
                markerMap.set(sig, m);
            }

            // 合并本地打点
            for (const m of lList) {
                const sig = m.id || `${Math.round((m.tabTime || 0) * 10) / 10}_${Math.round((m.tabEnd || 0) * 10) / 10}`;
                if (!markerMap.has(sig)) {
                    markerMap.set(sig, m);
                } else {
                    const existing = markerMap.get(sig);
                    // 挑选更新时间较新或备注内容更完整的版本
                    const mTime = m.updatedAt || 0;
                    const eTime = existing.updatedAt || 0;
                    if (mTime >= eTime || (!existing.tabComment && m.tabComment)) {
                        markerMap.set(sig, Object.assign({}, existing, m));
                    }
                }
            }

            mergedMarkers[key] = Array.from(markerMap.values());
        }

        // 4. 合并终端特异性布局 (Desktop / Mobile / Tablet 各自保留特有布局偏好)
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
            markers: mergedMarkers
        };
    }

    /**
     * 将同步/合并后的数据包落盘到本地持久化存储并同步 PlayerState 实例
     */
    static applyDataToLocal(data, playerState = null) {
        if (!data || !data.settings) return;

        const { settings, markers, deviceLayouts } = data;

        // 1. 持久化共通核心设置项
        for (const [k, v] of Object.entries(settings)) {
            setValue(k, v);
        }

        // 2. 恢复当前终端专属形态的特异布局配置 (桌面侧栏位置与折叠状态不与移动端冲突)
        const currentDeviceType = getDeviceType();
        if (deviceLayouts && deviceLayouts[currentDeviceType]) {
            const layout = deviceLayouts[currentDeviceType];
            if (layout.sidebarPosition !== undefined) setValue('sidebarPosition', layout.sidebarPosition);
            if (layout.sidebarHidden !== undefined) setValue('sidebarHidden', layout.sidebarHidden);
        }

        // 3. 持久化打点数据 (tabs_*)
        if (markers && typeof markers === 'object') {
            for (const [k, v] of Object.entries(markers)) {
                if (k.startsWith('tabs_') && Array.isArray(v)) {
                    setValue(k, v);
                }
            }
        }

        // 4. 刷新内存中 PlayerState
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
}
