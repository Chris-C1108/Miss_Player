/**
 * Miss_Player 遥测模块 (已彻底停用 - Neutralized & Disabled)
 * 
 * 为严格遵守 SleazyFork / GreasyFork 社区规范并保护用户隐私：
 * - 永久下线并剔除全部数据收集、设备指纹分析与后台批量上报逻辑；
 * - 永久注销全部外部遥测分析服务器域名；
 * - 本模块仅保留安全的空实现接口以保障现有调用链路正常，100% 纯本地运行且不产生任何网络流量。
 */

function getScriptVersion() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return GM_info.script.version;
        }
    } catch (_) {}
    return '5.6.32';
}

export class EventCollector {
    constructor() {
        // 清理历史版本可能遗留的本地标识与缓存
        try {
            if (typeof GM_deleteValue === 'function') {
                GM_deleteValue('mp_telemetry_client_id_v2');
                GM_deleteValue('mp_telemetry_cache_v3');
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('mp_telemetry_client_id_v2');
                localStorage.removeItem('mp_telemetry_cache_v3');
            }
        } catch (_) {}
    }

    isEnabled() {
        return false;
    }

    getScriptVersion() {
        return getScriptVersion();
    }

    track() {}
    recordFeatureAction() {}
    recordVideoPlay() {}
    trackPluginTrigger() {}
    trackTimestampCollect() {}
    trackTimestampClick() {}
    checkPeriodicFlush() {}
    flush() {}
    clearCache() {}
    saveCache() {}
    loadCache() {}
}

export const telemetry = new EventCollector();
