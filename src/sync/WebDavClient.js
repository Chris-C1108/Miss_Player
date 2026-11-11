/**
 * 针对历史版本遗留的数组连续空对象畸变进行安全清洗
 * 仅在原生 JSON.parse 失败时作为容错降级触发，严格限定在数组上下文，绝不破坏键值对象中的合法空对象 {}
 * @param {string} text 
 * @returns {string}
 */
function sanitizeArrayEmptyObjects(text) {
    if (!text || typeof text !== 'string') return text;
    if (!text.includes('{}')) return text;

    let prev;
    let cleaned = text;
    // 循环剔除数组内部（以 [ 或 , 开头）的连续空对象占位，绝不匹配冒号 : 后面的合法空对象值
    do {
        prev = cleaned;
        cleaned = cleaned.replace(/(\[|,)\s*\{\s*\}\s*(?=[,\]])/g, '$1');
    } while (cleaned !== prev);

    // 清理可能产生的 [, 与多余的连续逗号
    cleaned = cleaned.replace(/\[\s*,+/g, '[').replace(/,(\s*,)+/g, ',');
    return cleaned;
}

/**
 * 容错修补因网络截断或并发脏写导致的未闭合 JSON
 * @param {string} text 
 * @returns {Object|null}
 */
function tryRepairTruncatedJson(text) {
    if (!text || typeof text !== 'string') return null;
    let clean = text.trim();
    if (!clean.startsWith('{')) return null;

    // 逆向查找最近的一个完整结构结尾
    for (let i = clean.length - 1; i >= Math.max(0, clean.length - 4096); i--) {
        const char = clean[i];
        if (char === '}' || char === ']' || char === '"' || char === ',') {
            let candidate = clean.slice(0, i + 1);
            if (char === ',') {
                candidate = clean.slice(0, i);
            }
            let openBraces = 0;
            let openBrackets = 0;
            let inString = false;
            let escape = false;

            for (let j = 0; j < candidate.length; j++) {
                const c = candidate[j];
                if (escape) {
                    escape = false;
                    continue;
                }
                if (c === '\\') {
                    escape = true;
                    continue;
                }
                if (c === '"') {
                    inString = !inString;
                    continue;
                }
                if (!inString) {
                    if (c === '{') openBraces++;
                    else if (c === '}') openBraces = Math.max(0, openBraces - 1);
                    else if (c === '[') openBrackets++;
                    else if (c === ']') openBrackets = Math.max(0, openBrackets - 1);
                }
            }

            if (!inString && (openBraces > 0 || openBrackets > 0)) {
                let closing = '';
                for (let k = 0; k < openBrackets; k++) closing += ']';
                for (let k = 0; k < openBraces; k++) closing += '}';
                try {
                    const parsed = JSON.parse(candidate + closing);
                    if (parsed && typeof parsed === 'object') {
                        return parsed;
                    }
                } catch (_) {}
            }
        }
    }
    return null;
}

/**
 * WebDAV 协议客户端 (WebDavClient)
 * 提供基于 GM_xmlhttpRequest / fetch 的跨域 WebDAV 存储交互
 * 包含 UTF-8 安全 Base64 认证、PROPFIND 目录嗅探、MKCOL 逐级创建及各服务商自适应
 */
export class WebDavClient {
    /**
     * 活跃端点会话级内存缓存 (键: `${config.url}#${config.user}`, 值: 当前成功连接的实际 baseUrl)
     * @type {Map<string, string>}
     */
    static _activeUrlCache = new Map();

    /**
     * 获取 WebDAV 候选地址列表 (按主地址、局域网备用地址去重提取)
     * @param {Object} config - { url, lanUrl }
     * @returns {string[]}
     */
    static getCandidateUrls(config) {
        if (!config) return [];
        const candidates = [];
        if (config.url && typeof config.url === 'string' && config.url.trim()) {
            candidates.push(config.url.trim());
        }
        if (config.lanUrl && typeof config.lanUrl === 'string' && config.lanUrl.trim()) {
            const lan = config.lanUrl.trim();
            if (!candidates.includes(lan)) {
                candidates.push(lan);
            }
        }
        return candidates;
    }

    /**
     * 判断是否为网络错误或超时错误 (可触发向备用地址故障转移)
     * @param {Error|any} err 
     * @returns {boolean}
     */
    static _isNetworkError(err) {
        if (!err) return false;
        const msg = String(err?.message || err || '').toLowerCase();
        // 遇到 401/403 明确是账号密码权限错误，绝不可作为网络故障转移
        if (msg.includes('认证失败') || msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden')) {
            return false;
        }
        return msg.includes('超时') ||
               msg.includes('timeout') ||
               msg.includes('网络连接失败') ||
               msg.includes('failed to fetch') ||
               msg.includes('networkerror') ||
               msg.includes('connection refused') ||
               msg.includes('econnrefused') ||
               msg.includes('enotfound') ||
               msg.includes('net::err') ||
               msg.includes('status: 0') ||
               msg.includes('http [0]');
    }

    /**
     * 执行带双地址自动故障转移 (LAN / WAN Failover) 的 WebDAV 操作
     * @param {Object} config - WebDAV 配置 { url, lanUrl, user, pass, path }
     * @param {Function} actionFn - 接收当前有效 activeConfig 并返回 Promise 的操作函数
     * @returns {Promise<any>}
     */
    static async executeWithFailover(config, actionFn) {
        if (!config || !config.url) {
            throw new Error('WebDAV 服务器地址不能为空');
        }
        if (config._isFailoverActive) {
            return actionFn(config);
        }
        const candidates = this.getCandidateUrls(config);
        if (candidates.length <= 1) {
            return actionFn(config);
        }

        const cacheKey = `${config.url}#${config.user || ''}`;
        const cachedActive = this._activeUrlCache.get(cacheKey);

        // 依据历史成功记录调整优先级
        let orderedCandidates = [...candidates];
        if (cachedActive && orderedCandidates.includes(cachedActive)) {
            orderedCandidates = [cachedActive, ...orderedCandidates.filter(u => u !== cachedActive)];
        }

        let lastError = null;
        for (let i = 0; i < orderedCandidates.length; i++) {
            const candidateUrl = orderedCandidates[i];
            const isLast = (i === orderedCandidates.length - 1);
            // 多候选时，首选地址采用 3.5 秒灵敏超时快速截断，避免死等 15 秒；最后一个候选放宽到 15 秒
            const timeout = isLast ? 15000 : 3500;
            const activeConfig = Object.assign({}, config, {
                url: candidateUrl,
                _failoverTimeout: timeout,
                _isFailoverActive: true
            });

            try {
                const result = await actionFn(activeConfig);
                // 成功，更新活跃记忆
                this._activeUrlCache.set(cacheKey, candidateUrl);
                return result;
            } catch (err) {
                lastError = err;
                const canRetry = this._isNetworkError(err);
                if (!canRetry || isLast) {
                    throw err;
                }
                console.warn(`[WebDavClient] 端点 ${candidateUrl} 连接未响应 (${err.message})，正在自动无缝切换备用端点...`);
            }
        }

        throw lastError;
    }
    /**
     * UTF-8 安全的标准 Basic Auth 编码 (避免 btoa 遇到中文/特殊字符报 InvalidCharacterError)
     * @param {string} user - 用户名
     * @param {string} pass - 密码 / 授权码
     * @returns {Object} Headers 字典
     */
    static getAuthHeaders(user, pass) {
        if (!user && !pass) return {};
        try {
            const raw = `${user || ''}:${pass || ''}`;
            const b64 = btoa(encodeURIComponent(raw).replace(/%([0-9A-F]{2})/g, (_, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            }));
            return {
                'Authorization': `Basic ${b64}`
            };
        } catch (_) {
            return {};
        }
    }

    /**
     * 智能服务商 URL 归一化与端点补全 (适配坚果云、Nextcloud/ownCloud、InfiniCLOUD 等)
     * @param {string} baseUrl - 用户输入的 WebDAV 服务器地址
     * @param {string} [username=''] - 用户名 (用于 Nextcloud 自动补齐路径)
     * @returns {string} 清洗归一化后的基础 URL (不带尾部斜杠)
     */
    static normalizeProviderUrl(baseUrl, username = '') {
        if (!baseUrl) return '';
        let url = baseUrl.trim();
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        url = url.replace(/\/+$/, '');

        // 1. 坚果云 (Jianguoyun)：要求根端点包含 /dav
        if (/jianguoyun\.com/i.test(url) && !/\/dav$/i.test(url)) {
            url = `${url}/dav`;
        }

        // 2. Nextcloud / ownCloud：若用户仅填写主域名且未带 /remote.php/dav，自动补充标准个人端点
        if (/(?:nextcloud|owncloud)/i.test(url)) {
            if (!/\/remote\.php\/dav/i.test(url) && username) {
                url = `${url}/remote.php/dav/files/${encodeURIComponent(username.trim())}`;
            }
        }

        // 3. InfiniCLOUD (TeraCLOUD)：保持其标准 /dav 端点
        if (/teracloud\.jp/i.test(url) && !/\/dav$/i.test(url)) {
            url = `${url}/dav`;
        }

        return url;
    }

    /**
     * 规范化 WebDAV URL 和路径拼接，并严格校验目录/文件斜杠规则 (防 301 重定向导致 Auth 标头丢失)
     * @param {string} baseUrl - WebDAV 服务器基础地址
     * @param {string} path - 相对或绝对路径
     * @param {string} [username=''] - 用户名
     * @returns {string} 完整的规范化 URL
     */
    static normalizeUrl(baseUrl, path = '', username = '') {
        if (!baseUrl) return '';
        const cleanBase = this.normalizeProviderUrl(baseUrl, username);

        let cleanPath = (path || '').trim();
        if (cleanPath && !cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }

        return cleanBase + cleanPath;
    }

    /**
     * 执行底层 HTTP 请求 (优先调用 GM_xmlhttpRequest，支持超时、异常捕获与 abort)
     * @param {Object} options - 请求配置
     * @returns {Promise<{ status: number, statusText: string, data: string, headers: Object }>}
     */
    static request(options) {
        const {
            method = 'GET',
            url,
            user = '',
            pass = '',
            headers = {},
            data = null,
            timeout = 15000
        } = options;

        const authHeaders = this.getAuthHeaders(user, pass);
        const mergedHeaders = Object.assign({}, authHeaders, headers);

        return new Promise((resolve, reject) => {
            let settled = false;

            const safeResolve = (res) => {
                if (settled) return;
                settled = true;
                resolve(res);
            };

            const safeReject = (err) => {
                if (settled) return;
                settled = true;
                reject(err instanceof Error ? err : new Error(String(err)));
            };

            // 1. 优先使用油猴扩展特权网络通道 (绕过 CORS 预检与 302 重定向拦截)
            const getGmXhr = () => {
                try {
                    if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
                } catch (_) {}
                try {
                    if (typeof globalThis !== 'undefined' && typeof globalThis.GM_xmlhttpRequest === 'function') {
                        return globalThis.GM_xmlhttpRequest;
                    }
                } catch (_) {}
                try {
                    if (typeof window !== 'undefined' && typeof window.GM_xmlhttpRequest === 'function') {
                        return window.GM_xmlhttpRequest;
                    }
                } catch (_) {}
                try {
                    if (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function') {
                        return (opts) => GM.xmlHttpRequest(opts);
                    }
                } catch (_) {}
                try {
                    if (typeof unsafeWindow !== 'undefined' && unsafeWindow && typeof unsafeWindow.GM_xmlhttpRequest === 'function') {
                        return unsafeWindow.GM_xmlhttpRequest;
                    }
                } catch (_) {}
                return null;
            };
            const gmXhr = getGmXhr();
            if (gmXhr) {
                try {
                    gmXhr({
                        method,
                        url,
                        headers: mergedHeaders,
                        data,
                        timeout,
                        anonymous: false,
                        onload: (res) => {
                            safeResolve({
                                status: res.status,
                                statusText: res.statusText,
                                data: res.responseText || '',
                                response: res.response
                            });
                        },
                        ontimeout: () => {
                            safeReject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
                        },
                        onerror: (err) => {
                            const msg = err?.error || err?.statusText || (err?.status ? `HTTP [${err.status}]` : '网络连接失败，请检查服务器地址或跨域权限');
                            safeReject(new Error(msg));
                        },
                        onabort: () => {
                            safeReject(new Error('请求被中止'));
                        }
                    });
                } catch (e) {
                    safeReject(e);
                }
                return;
            }

            // 2. 浏览器原生 fetch 降级
            try {
                const fetchOpts = {
                    method,
                    headers: mergedHeaders,
                    body: (method !== 'GET' && method !== 'HEAD' && method !== 'PROPFIND') ? data : undefined
                };

                const controller = new AbortController();
                const timer = setTimeout(() => {
                    controller.abort();
                    safeReject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
                }, timeout);
                fetchOpts.signal = controller.signal;

                fetch(url, fetchOpts)
                    .then(async (res) => {
                        clearTimeout(timer);
                        const text = await res.text();
                        safeResolve({
                            status: res.status,
                            statusText: res.statusText,
                            data: text
                        });
                    })
                    .catch((err) => {
                        clearTimeout(timer);
                        // 诊断是否是预检重定向 CORS 拦截
                        const isCorsPreflightErr = err && (
                            err.name === 'TypeError' ||
                            (err.message && (err.message.includes('Failed to fetch') || err.message.includes('preflight') || err.message.includes('CORS')))
                        );
                        if (isCorsPreflightErr) {
                            console.warn('[WebDavClient] 原生 fetch 受同源策略或重定向拦截，请确保油猴脚本已授权 GM_xmlhttpRequest 权限:', err);
                        }
                        safeReject(err);
                    });
            } catch (e) {
                safeReject(e);
            }
        });
    }

    /**
     * 远端目录嗅探 (通过 PROPFIND Depth: 0 验证目录是否存在)
     * @param {string} dirUrl 目录完整 URL (以 / 结尾)
     * @param {string} user 用户名
     * @param {string} pass 密码
     * @param {number} [timeout=15000] 超时时间
     * @returns {Promise<boolean>} true: 目录存在; false: 目录不存在 (404)
     */
    static async checkDirectoryExists(dirUrl, user, pass, timeout = 15000) {
        try {
            const res = await this.request({
                method: 'PROPFIND',
                url: dirUrl,
                user,
                pass,
                timeout,
                headers: {
                    'Depth': '0'
                }
            });
            // 207 Multi-Status 或 200 OK 说明目录已存在且可访问
            if (res.status === 207 || res.status === 200) {
                return true;
            }
            // 404: 明确不存在，需要创建
            if (res.status === 404) {
                return false;
            }
            // 部分简易 WebDAV 网关对 PROPFIND 返回 405 或 415 (Unsupported Media Type)，说明目录存在或不支持探测，视为可能存在
            if (res.status === 405 || res.status === 415) {
                return true;
            }
            return false;
        } catch (_) {
            return false;
        }
    }

    /**
     * 逐级嗅探并创建 WebDAV 专用目录内部实现 (PROPFIND 嗅探 -> MKCOL 创建)
     * @private
     */
    static async _ensureDirectoryInternal(config) {
        const { url, user, pass, path = '/MissPlayer/', _failoverTimeout } = config;
        const reqTimeout = _failoverTimeout || 15000;
        let cleanPath = (path || '/MissPlayer/').trim();
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        if (!cleanPath.endsWith('/')) cleanPath = cleanPath + '/';

        const segments = cleanPath.split('/').filter(Boolean);
        let currentPath = '';

        for (const seg of segments) {
            currentPath += '/' + seg;
            const dirUrlWithSlash = this.normalizeUrl(url, currentPath + '/', user);

            // 1. 目录级嗅探：先探测该层级目录是否存在
            const exists = await this.checkDirectoryExists(dirUrlWithSlash, user, pass, reqTimeout);
            if (exists) {
                continue; // 该层级已存在，继续检测下一级
            }

            // 2. 该层级不存在，发送 MKCOL 创建目录
            try {
                const res = await this.request({
                    method: 'MKCOL',
                    url: dirUrlWithSlash,
                    user,
                    pass,
                    timeout: reqTimeout
                });
                // 201 Created: 成功创建; 405: 目录已存在; 200/204: 成功; 415: 已存在或网关不支持空body
                if (res.status === 201 || res.status === 405 || res.status === 200 || res.status === 204 || res.status === 415) {
                    continue;
                }
                console.warn(`[WebDavClient] MKCOL 创建目录 ${currentPath} 遇到状态码: ${res.status}`);
            } catch (err) {
                console.warn(`[WebDavClient] MKCOL 创建目录 ${currentPath} 遇到异常:`, err.message || err);
            }
        }

        // 最终校验目标根目录是否就绪
        const finalDirUrl = this.normalizeUrl(url, cleanPath, user);
        const finalExists = await this.checkDirectoryExists(finalDirUrl, user, pass, reqTimeout);
        if (!finalExists) {
            throw new Error(`WebDAV 目录不存在且无法自动创建，请在 WebDAV 服务器上手动创建目录: ${cleanPath}`);
        }
    }

    /**
     * 逐级嗅探并创建 WebDAV 专用目录 (带双地址自动故障转移)
     * 严格遵守 RFC 4918：目录 URL 末尾必须带 /，防止 301 重定向剥离鉴权头
     * @param {Object} config - { url, lanUrl, user, pass, path }
     */
    static async ensureDirectory(config) {
        return this.executeWithFailover(config, (activeCfg) => this._ensureDirectoryInternal(activeCfg));
    }

    /**
     * 测试 WebDAV 连通性并自动嗅探预建目录 (带双地址自动故障转移)
     * @param {Object} config - { url, lanUrl, user, pass, path }
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    static async testConnection(config) {
        return this.executeWithFailover(config, async (activeCfg) => {
            const { url, user, pass, path = '/MissPlayer/', _failoverTimeout } = activeCfg;
            const reqTimeout = _failoverTimeout || 15000;
            if (!url) {
                throw new Error('WebDAV 服务器地址不能为空');
            }

            let cleanPath = (path || '/MissPlayer/').trim();
            if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
            if (!cleanPath.endsWith('/')) cleanPath = cleanPath + '/';

            // 1. 优先执行目录级嗅探与自动创建
            await this._ensureDirectoryInternal(activeCfg);

            const fileUrl = this.normalizeUrl(url, cleanPath + 'miss_player_sync.json', user);

            try {
                // 发送 GET 探测备份文件是否存在或连通
                const res = await this.request({
                    method: 'GET',
                    url: fileUrl,
                    user,
                    pass,
                    timeout: reqTimeout,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                if (res.status === 401 || res.status === 403) {
                    throw new Error(`认证失败 (${res.status}): 请检查用户名与应用密码/授权码`);
                }

                if (res.status >= 500) {
                    throw new Error(`服务器内部错误 (${res.status})`);
                }

                const isLan = config.lanUrl && activeCfg.url === config.lanUrl.trim();
                const suffix = isLan ? ' (局域网备用)' : '';

                // 200 (文件已存在) 或 404 (连接正常且目录就绪，文件尚未创建) 均代表认证及连通成功！
                if (res.status === 200 || res.status === 204 || res.status === 207) {
                    return {
                        success: true,
                        message: `WebDAV 连接成功${suffix}，已检测到云端备份！`
                    };
                }

                if (res.status === 404) {
                    return {
                        success: true,
                        message: `WebDAV 目录已自动就绪${suffix}，随时可同步数据！`
                    };
                }

                return {
                    success: true,
                    message: `WebDAV 响应状态: ${res.status}${suffix}`
                };
            } catch (error) {
                console.error('[WebDavClient] 测试连接失败:', error);
                throw error;
            }
        });
    }

    /**
     * 从 WebDAV 下载备份 JSON 文件 (安全 JSON 解析与容错校验，带双地址自动故障转移)
     * @param {Object} config - { url, lanUrl, user, pass, path }
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     * @returns {Promise<Object|null>} 成功返回 JSON 数据对象，若文件不存在返回 null
     */
    static async downloadBackup(config, filename = 'miss_player_sync.json') {
        return this.executeWithFailover(config, async (activeCfg) => {
            const { url, user, pass, path = '/MissPlayer/', _failoverTimeout } = activeCfg;
            const reqTimeout = _failoverTimeout || 15000;
            let dirPath = (path || '/MissPlayer/').trim();
            if (!dirPath.startsWith('/')) dirPath = '/' + dirPath;
            if (!dirPath.endsWith('/')) dirPath = dirPath + '/';

            const fileUrl = this.normalizeUrl(url, dirPath + filename, user);

            try {
                const res = await this.request({
                    method: 'GET',
                    url: fileUrl,
                    user,
                    pass,
                    timeout: reqTimeout,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                if (res.status === 404) {
                    // 远端文件尚未创建
                    return null;
                }

                if (res.status === 401 || res.status === 403) {
                    throw new Error(`认证失败 (${res.status}): 请检查用户名与应用授权码`);
                }

                if (res.status >= 200 && res.status < 300) {
                    if (!res.data || !res.data.trim()) {
                        return null;
                    }
                    const rawText = res.data.trim();

                    // 1. 优先采用原生 JSON.parse（零污染、零损耗、速度极快，绝不误伤合法数据）
                    try {
                        const parsed = JSON.parse(rawText);
                        if (parsed && typeof parsed === 'object') {
                            return parsed;
                        }
                        throw new Error('云端备份文件内容格式畸变');
                    } catch (primaryErr) {
                        // 仅当原生解析确实失败时，才启动容错降级管道
                        console.warn('[WebDavClient] 原生 JSON 解析未通过，尝试安全容错清洗与补全...', primaryErr.message);

                        // 2. 尝试清洗可能存在于数组内部的畸变空对象 (仅限数组环境，绝不误伤 "key": {})
                        try {
                            const cleaned = sanitizeArrayEmptyObjects(rawText);
                            const parsedCleaned = JSON.parse(cleaned);
                            if (parsedCleaned && typeof parsedCleaned === 'object') {
                                console.warn('[WebDavClient] 成功清洗数组畸变空对象并安全恢复数据');
                                return parsedCleaned;
                            }
                        } catch (_) {}

                        // 3. 尝试智能修复因网络传输截断导致的未闭合结构
                        try {
                            const repaired = tryRepairTruncatedJson(rawText);
                            if (repaired && typeof repaired === 'object' && (repaired.settings || repaired.markers)) {
                                console.warn('[WebDavClient] 成功智能补全截断云端备份 JSON 并安全恢复数据');
                                return repaired;
                            }
                        } catch (_) {}

                        console.error('[WebDavClient] 云端备份数据损坏或被截断，已终止读取:', primaryErr);
                        throw new Error('云端备份数据损坏或被截断，已终止读取');
                    }
                }

                throw new Error(`下载失败，服务器返回状态码: ${res.status}`);
            } catch (error) {
                console.error('[WebDavClient] 下载备份失败:', error);
                throw error;
            }
        });
    }

    /**
     * 上传备份 JSON 数据至 WebDAV (写入前主动确保目录就绪，带双地址自动故障转移)
     * @param {Object} config - { url, lanUrl, user, pass, path }
     * @param {Object} data - 要备份的完整 JSON 对象
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     */
    static async uploadBackup(config, data, filename = 'miss_player_sync.json') {
        return this.executeWithFailover(config, async (activeCfg) => {
            const { url, user, pass, path = '/MissPlayer/', _failoverTimeout } = activeCfg;
            const reqTimeout = _failoverTimeout || 15000;

            // 1. 上传前主动确保所有父级目录存在
            await this._ensureDirectoryInternal(activeCfg);

            let dirPath = (path || '/MissPlayer/').trim();
            if (!dirPath.startsWith('/')) dirPath = '/' + dirPath;
            if (!dirPath.endsWith('/')) dirPath = dirPath + '/';

            const fileUrl = this.normalizeUrl(url, dirPath + filename, user);
            const jsonString = JSON.stringify(data, null, 2);

            try {
                let res = await this.request({
                    method: 'PUT',
                    url: fileUrl,
                    user,
                    pass,
                    timeout: reqTimeout,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    data: jsonString
                });

                // 遇到极端情况 404/409 时再次重试一次
                if (res.status === 404 || res.status === 409) {
                    console.warn(`[WebDavClient] PUT 返回 ${res.status}，重试 ensureDirectory 并二次上传...`);
                    await this._ensureDirectoryInternal(activeCfg);
                    res = await this.request({
                        method: 'PUT',
                        url: fileUrl,
                        user,
                        pass,
                        timeout: reqTimeout,
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8'
                        },
                        data: jsonString
                    });
                }

                if (res.status === 401 || res.status === 403) {
                    throw new Error(`认证失败 (${res.status}): 权限不足或密码错误`);
                }

                if (res.status === 200 || res.status === 201 || res.status === 204) {
                    return {
                        success: true,
                        status: res.status
                    };
                }

                throw new Error(`上传失败，服务器返回状态码: ${res.status}`);
            } catch (error) {
                console.error('[WebDavClient] 上传备份失败:', error);
                throw error;
            }
        });
    }

    /**
     * 下载 WebDAV 指定子路径文件 (如 'heatmaps/WSP-101.json')
     * @param {Object} config - { url, lanUrl, user, pass, path }
     * @param {string} subPath - 相对子路径
     * @returns {Promise<Object|string|null>} 成功返回解析后的 JSON，不存在返回 null
     */
    static async downloadFile(config, subPath) {
        return this.downloadBackup(config, subPath);
    }

    /**
     * 上传任意文本/JSON文件至 WebDAV 指定子目录 (带双地址自动故障转移)
     * @param {Object} config - { url, lanUrl, user, pass, path }
     * @param {string} subPath - 相对子路径 (如 'logs/debug/xxx.txt' 或 'comments/xxx.json')
     * @param {string|Object} content - 文件文本或 JSON 对象
     * @param {string} [contentType='text/plain; charset=utf-8'] - MIME 类型
     * @returns {Promise<{ success: boolean, status: number }>}
     */
    static async uploadFile(config, subPath, content, contentType = 'text/plain; charset=utf-8') {
        return this.executeWithFailover(config, async (activeCfg) => {
            const { url, user, pass, path = '/MissPlayer/', _failoverTimeout } = activeCfg;
            const reqTimeout = _failoverTimeout || 15000;
            let dirPath = (path || '/MissPlayer/').trim();
            if (!dirPath.startsWith('/')) dirPath = '/' + dirPath;
            if (!dirPath.endsWith('/')) dirPath = dirPath + '/';

            let targetPath = subPath.trim();
            if (targetPath.startsWith('/')) targetPath = targetPath.slice(1);

            // 智能防重叠自愈：若 targetPath 已经包含了 dirPath 的前缀，自动剥离，防止重复拼接如 /MissPlayer/MissPlayer/
            const normDirNoSlash = dirPath.replace(/^\/+|\/+$/g, '');
            if (normDirNoSlash && targetPath.startsWith(normDirNoSlash + '/')) {
                targetPath = targetPath.slice(normDirNoSlash.length + 1);
            } else if (normDirNoSlash && targetPath.startsWith(normDirNoSlash)) {
                targetPath = targetPath.slice(normDirNoSlash.length).replace(/^\/+/, '');
            }

            // 确保上级目录存在
            const lastSlash = targetPath.lastIndexOf('/');
            const uploadDir = lastSlash !== -1 ? dirPath + targetPath.slice(0, lastSlash + 1) : dirPath;
            const uploadFileName = lastSlash !== -1 ? targetPath.slice(lastSlash + 1) : targetPath;

            await this._ensureDirectoryInternal({ ...activeCfg, path: uploadDir });

            const fileUrl = this.normalizeUrl(url, uploadDir + uploadFileName, user);
            const data = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);

            const res = await this.request({
                method: 'PUT',
                url: fileUrl,
                user,
                pass,
                timeout: reqTimeout,
                headers: {
                    'Content-Type': contentType
                },
                data
            });

            if (res.status === 200 || res.status === 201 || res.status === 204) {
                return { success: true, status: res.status };
            }
            if (res.status === 404 || res.status === 409) {
                throw new Error(`WebDAV 目录不存在或路径冲突 (HTTP ${res.status})，请在 WebDAV 服务器上手动创建目录: ${uploadDir}`);
            }
            throw new Error(`上传文件失败，状态码: ${res.status}`);
        });
    }

    /**
     * 探测 WebDAV 上指定文件是否存在 (带双地址自动故障转移)
     * @param {Object} config - { url, lanUrl, user, pass }
     * @param {string} fullOrRelativePath - 文件路径
     * @param {number} [timeout=3500] - 单次探测超时
     * @returns {Promise<boolean>}
     */
    static async checkFileExists(config, fullOrRelativePath, timeout = 3500) {
        try {
            return await this.executeWithFailover(config, async (activeCfg) => {
                const reqTimeout = activeCfg._failoverTimeout || timeout;
                const fileUrl = this.normalizeUrl(activeCfg.url, fullOrRelativePath, activeCfg.user);
                const res = await this.request({
                    method: 'PROPFIND',
                    url: fileUrl,
                    user: activeCfg.user,
                    pass: activeCfg.pass,
                    headers: { 'Depth': '0' },
                    timeout: reqTimeout
                });
                return res.status === 200 || res.status === 207;
            });
        } catch (_) {
            return false;
        }
    }

}
