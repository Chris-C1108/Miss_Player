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
export const CACHE_KEY_DATA_STABLE = 'mp_update_meta_cache_stable';
export const CACHE_KEY_TIME_STABLE = 'mp_update_last_check_stable';
export const CACHE_KEY_DATA_BETA = 'mp_update_meta_cache_beta';
export const CACHE_KEY_TIME_BETA = 'mp_update_last_check_beta';
export const CACHE_TTL = 12 * 60 * 60 * 1000;

export const GITHUB_RAW_META_URL = 'https://raw.githubusercontent.com/Chris-C1108/Miss_Player/main/dist/miss_player.meta.js';
export const GITHUB_RAW_USER_URL = 'https://raw.githubusercontent.com/Chris-C1108/Miss_Player/main/dist/miss_player.user.js';
export const GITHUB_COMMITS_URL = 'https://github.com/Chris-C1108/Miss_Player/commits/main';
export const SLEAZYFORK_RAW_USER_URL = 'https://update.sleazyfork.org/scripts/' + OFFICIAL_SCRIPT_ID + '/Miss%20Player%20%7C%20%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F%20%28%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8%29.user.js';

export function getCurrentVersion() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return GM_info.script.version;
        }
    } catch (_) {}
    return '5.7.113-029';
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

/**
 * 智能嗅探当前运行的用户脚本管理器
 * @returns {'stay'|'tampermonkey'|'scriptcat'|'violentmonkey'|'userscripts'|'unknown'}
 */
export function detectScriptHandler() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info) {
            const handler = (GM_info.scriptHandler || '').toLowerCase();
            if (handler.includes('stay')) return 'stay';
            if (handler.includes('tampermonkey')) return 'tampermonkey';
            if (handler.includes('scriptcat')) return 'scriptcat';
            if (handler.includes('violentmonkey')) return 'violentmonkey';
            if (handler.includes('userscripts')) return 'userscripts';
        }
    } catch (_) {}
    const isIOS = (typeof navigator !== 'undefined') && (
        /iPad|iPhone|iPod/.test(navigator.userAgent || '') || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    if (isIOS) return 'stay';
    return 'unknown';
}

/**
 * 提取纯净的目标脚本下载 URL (彻底剥离 ?_t 等破坏油猴更新覆盖判定的时间戳与额外查询参数)
 * @param {'stable'|'beta'} [channel='stable'] 
 * @param {Object} [meta] 
 * @returns {string} 纯净的 .user.js 绝对地址
 */
export function getCleanScriptUrl(channel = 'stable', meta = null) {
    const rawUrl = meta?.code_url || (channel === 'beta' ? GITHUB_RAW_USER_URL : SLEAZYFORK_RAW_USER_URL);
    return String(rawUrl).split('?')[0].split('#')[0].trim();
}

/**
 * 根据不同的管理器协议生成一键安装/更新链接
 * @param {'stay'|'tampermonkey'|'scriptcat'|'violentmonkey'|'userscripts'|'unknown'} handler 
 * @param {string} scriptUrl 纯净的 .user.js 链接
 * @returns {{ protocol: 'scheme'|'web'|'direct', url: string }}
 */
export function buildInstallProtocolUrl(handler, scriptUrl) {
    const cleanUrl = String(scriptUrl).split('?')[0].split('#')[0].trim();
    switch (handler) {
        case 'stay':
            // Stay 官方 x-callback-url 规范：stay://x-callback-url/install?scriptURL=<encodeURIComponent(url)>
            return {
                protocol: 'scheme',
                url: 'stay://x-callback-url/install?scriptURL=' + encodeURIComponent(cleanUrl)
            };
        case 'tampermonkey':
            // Tampermonkey: 官方安装跳转入口，通过 hash 传递纯净 http(s) 脚本地址
            return {
                protocol: 'web',
                url: 'https://www.tampermonkey.net/script_installation.php#url=' + cleanUrl
            };
        case 'scriptcat':
            // ScriptCat (脚本猫): 官方一键安装入口
            return {
                protocol: 'web',
                url: 'https://docs.scriptcat.org/docs/script_installation/#url=' + cleanUrl
            };
        default:
            // Violentmonkey / Userscripts / 其他：直接返回纯净脚本地址，依赖扩展自动拦截
            return {
                protocol: 'direct',
                url: cleanUrl
            };
    }
}

/**
 * 统一分发脚本安装/更新事件，处理 Toast 与宿主跳转
 * @param {'stay'|'tampermonkey'|'scriptcat'|'violentmonkey'|'userscripts'|'unknown'} handler
 * @param {string} scriptUrl 纯净的 .user.js 地址
 * @param {Object} [options]
 * @param {boolean} [options.isUpdate=false] 是否为更新操作
 * @param {Function} [options.onToast=null] 消息提示回调
 */
export function dispatchScriptInstall(handler, scriptUrl, options = {}) {
    const { isUpdate = false, onToast = null } = options;
    const targetHandler = handler || detectScriptHandler();
    const cleanUrl = String(scriptUrl).split('?')[0].split('#')[0].trim();
    const { url } = buildInstallProtocolUrl(targetHandler, cleanUrl);

    const notify = (msg, type = 'info') => {
        if (typeof onToast === 'function') {
            onToast(msg, type);
        }
    };

    if (targetHandler === 'stay') {
        notify(isUpdate ? '正在唤起 Stay 一键更新...' : '正在唤起 Stay 一键安装...', 'info');
        window.location.href = url;
    } else if (targetHandler === 'tampermonkey') {
        notify(isUpdate ? '正在跳转 Tampermonkey 一键更新...' : '正在跳转 Tampermonkey 一键安装...', 'info');
        window.open(url, '_blank');
    } else if (targetHandler === 'scriptcat') {
        notify(isUpdate ? '正在跳转脚本猫一键更新...' : '正在跳转脚本猫一键安装...', 'info');
        window.open(url, '_blank');
    } else {
        if (typeof GM_openInTab === 'function') {
            GM_openInTab(cleanUrl, { active: true });
        } else {
            window.open(cleanUrl, '_blank');
        }
        notify(isUpdate ? '已触发脚本更新安装' : '已触发脚本安装', 'success');
    }
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
                    try {
                        const data = JSON.parse(res.html);
                        if (data && data.id) return data;
                    } catch (_) {}
                }
            } catch (err) {
                lastErr = err;
            }
        }

        // Cloudflare 403 盾牌穿透兜底：从不受盾牌拦截的 update CDN 官方源抓取 meta.js 解析最新版本
        try {
            const metaUrl = 'https://update.sleazyfork.org/scripts/' + scriptId + '/Miss%20Player%20%7C%20%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F%20%28%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8%29.meta.js';
            const metaRes = await fetchWithTransport(metaUrl, { method: 'GET', timeout: 8000 });
            if (metaRes.status >= 200 && metaRes.status < 400 && metaRes.html) {
                const match = metaRes.html.match(/@version\s+([\w\.\-]+)/i);
                if (match && match[1]) {
                    return {
                        id: Number(scriptId),
                        name: 'Miss Player | 影院模式 (单手播放器)',
                        version: match[1].trim(),
                        code_url: metaUrl.replace('.meta.js', '.user.js'),
                        url: 'https://sleazyfork.org/scripts/' + scriptId,
                        code_updated_at: new Date().toISOString()
                    };
                }
            }
        } catch (e) {
            lastErr = e;
        }
        throw lastErr || new Error('FETCH_FAILED');
    }

    /**
     * 从 GitHub 直链或多源镜像加速节点获取最新测试版元数据
     * 支持用户指定的专用镜像加速节点：gh-proxy.org, ghfast.top, gh-proxy.com
     */
    static async fetchGitHubMeta() {
        const timestamp = Date.now();
        let lastErr = null;

        const rawTarget = 'https://raw.githubusercontent.com/Chris-C1108/Miss_Player/main/dist/miss_player.meta.js';
        const candidateUrls = [
            `${rawTarget}?_t=${timestamp}`,
            `https://gh-proxy.org/${rawTarget}?_t=${timestamp}`,
            `https://ghfast.top/${rawTarget}?_t=${timestamp}`,
            `https://gh-proxy.com/${rawTarget}?_t=${timestamp}`,
            `https://fastly.jsdelivr.net/gh/Chris-C1108/Miss_Player@main/dist/miss_player.meta.js?_t=${timestamp}`,
            `https://cdn.jsdelivr.net/gh/Chris-C1108/Miss_Player@main/dist/miss_player.meta.js?_t=${timestamp}`
        ];

        for (const url of candidateUrls) {
            try {
                const res = await fetchWithTransport(url, {
                    method: 'GET',
                    headers: { 'Accept': 'text/plain, */*', 'Cache-Control': 'no-cache, no-store' },
                    timeout: 5000
                });
                if (res.status >= 200 && res.status < 400 && res.html) {
                    const text = res.html;
                    const match = text.match(/@version\s+([\w\.\-]+)/i);
                    if (match && match[1]) {
                        const version = match[1].trim();
                        return {
                            id: 'github-main',
                            channel: 'beta',
                            name: 'Miss Player | 影院模式 (单手播放器)',
                            version,
                            code_url: GITHUB_RAW_USER_URL,
                            url: GITHUB_COMMITS_URL,
                            changelog_url: GITHUB_COMMITS_URL,
                            code_updated_at: new Date().toISOString()
                        };
                    }
                }
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error('FETCH_GITHUB_META_FAILED');
    }

    static async checkUpdate(force = false, channelOrScriptId = 'stable', scriptId = OFFICIAL_SCRIPT_ID) {
        let channel = 'stable';
        let targetScriptId = OFFICIAL_SCRIPT_ID;

        if (typeof channelOrScriptId === 'number' || (typeof channelOrScriptId === 'string' && /^\d+$/.test(channelOrScriptId))) {
            targetScriptId = Number(channelOrScriptId);
            channel = 'stable';
        } else if (typeof channelOrScriptId === 'string' && channelOrScriptId) {
            channel = channelOrScriptId.toLowerCase() === 'beta' ? 'beta' : 'stable';
            if (scriptId) targetScriptId = Number(scriptId) || OFFICIAL_SCRIPT_ID;
        }

        const isBeta = channel === 'beta';
        const cacheKeyData = isBeta ? CACHE_KEY_DATA_BETA : CACHE_KEY_DATA_STABLE;
        const cacheKeyTime = isBeta ? CACHE_KEY_TIME_BETA : CACHE_KEY_TIME_STABLE;
        const currentVersion = getCurrentVersion();

        if (!force) {
            try {
                const lastCheck = getValue(cacheKeyTime, 0);
                let cached = getValue(cacheKeyData, null);
                if (!cached && !isBeta) {
                    cached = getValue(CACHE_KEY_DATA, null);
                }
                if (cached && lastCheck && (Date.now() - Number(lastCheck) < CACHE_TTL)) {
                    const latestVersion = cached.version || currentVersion;
                    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0 && !cached.deleted;
                    return {
                        success: true,
                        channel,
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
            const meta = isBeta ? await this.fetchGitHubMeta() : await this.fetchScriptMeta(targetScriptId);
            meta.channel = channel;
            const latestVersion = meta.version || currentVersion;
            const hasUpdate = compareVersions(latestVersion, currentVersion) > 0 && !meta.deleted;
            setValue(cacheKeyTime, Date.now());
            setValue(cacheKeyData, meta);
            if (!isBeta) {
                setValue(CACHE_KEY_DATA, meta);
                setValue(CACHE_KEY_TIME, Date.now());
            }
            return {
                success: true,
                channel,
                hasUpdate,
                currentVersion,
                latestVersion,
                meta,
                fromCache: false
            };
        } catch (err) {
            const cached = getValue(cacheKeyData, null) || (!isBeta ? getValue(CACHE_KEY_DATA, null) : null);
            if (cached) {
                const latestVersion = cached.version || currentVersion;
                return {
                    success: true,
                    channel,
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
                channel,
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
