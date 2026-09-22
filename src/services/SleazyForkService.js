/**
 * SleazyFork / GreasyFork 官方 JSON API 交互服务
 * 
 * 职责：
 * 1. 纯本地只读查询公开 JSON 元数据，零用户行为与数据回传（严守平台合规红线）
 * 2. 缓存管理与节流机制（12 小时 TTL，杜绝高频无谓请求）
 * 3. 语义化版本号 (Semver) 准确比对
 * 4. 容错处理：主备端点自动切换 (SleazyFork -> GreasyFork)
 */

import { fetchWithTransport } from '../utils/http.js';
import { getValue, setValue } from '../utils/storage.js';

export const OFFICIAL_SCRIPT_ID = 453300;
export const CACHE_KEY_DATA = 'mp_sleazyfork_meta_cache';
export const CACHE_KEY_TIME = 'mp_sleazyfork_last_check';
export const CACHE_TTL = 12 * 60 * 60 * 1000;

export function getCurrentVersion() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return GM_info.script.version;
        }
    } catch (_) {}
    return '5.6.32';
}

export function compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const clean = (v) => String(v).replace(/^v/i, '').split('-')[0].trim();
    const p1 = clean(v1).split('.').map(n => parseInt(n, 10) || 0);
    const p2 = clean(v2).split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(p1.length, p2.length);
    for (let i = 0; i < len; i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    } 
    return 0;
}

export class SleazyForkService {
    static async fetchScriptMeta(scriptId = OFFICIAL_SCRIPT_ID) {
        const endpoints = [
            'https://sleazyfork.org/scripts/' + scriptId + '.json',
            'https://greasyfork.org/scripts/' + scriptId + '.json'
        ];
        let lastErr = null;
        for (const url of endpoints) {
            try {
                const res = await fetchWithTransport(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    timeout: 8000
                });
                if (res.status >= 200 && res.status < 400 && res.html) {
                    const data = JSON.parse(res.html);
                    if (data && data.id) return data;
                }
                throw new Error('HTTP_' + res.status);
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error('FETCH_FAILED');
    }

    static async checkUpdate(force = false, scriptId = OFFICIAL_SCRIPT_ID) {
        const currentVersion = getCurrentVersion();
        if (!force) {
            try {
                const lastCheck = getValue(CACHE_KEY_TIME, 0);
                const cached = getValue(CACHE_KEY_DATA, null);
                if (cached && lastCheck && (Date.now() - Number(lastCheck) < CACHE_TTL)) {
                    const latestVersion = cached.version || currentVersion;
                    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0 && !cached.deleted;
                    return {
                        success: true,
                        hasUpdate,
                        currentVersion,
                        latestVersion,
                        meta: cached,
                        fromCache: true
                    };
                }
            } catch (_) {}
        }
        try {
            const meta = await this.fetchScriptMeta(scriptId);
            const latestVersion = meta.version || currentVersion;
            const hasUpdate = compareVersions(latestVersion, currentVersion) > 0 && !meta.deleted;
            setValue(CACHE_KEY_TIME, Date.now());
            setValue(CACHE_KEY_DATA, meta);
            return {
                success: true,
                hasUpdate,
                currentVersion,
                latestVersion,
                meta,
                fromCache: false
            };
        } catch (err) {
            const cached = getValue(CACHE_KEY_DATA, null);
            if (cached) {
                const latestVersion = cached.version || currentVersion;
                return {
                    success: true,
                    hasUpdate: compareVersions(latestVersion, currentVersion) > 0,
                    currentVersion,
                    latestVersion,
                    meta: cached,
                    fromCache: true,
                    warning: err.message
                };
            }
            return {
                success: false,
                hasUpdate: false,
                currentVersion,
                latestVersion: currentVersion,
                meta: null,
                fromCache: false,
                error: err.message
            };
        }
    }
}
