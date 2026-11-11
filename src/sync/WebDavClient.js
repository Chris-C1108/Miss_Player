import { getValue, setValue } from '../utils/storage.js';

const ACTIVE_ENDPOINT_STORAGE_KEY = 'mp_active_webdav_lease';
const ACTIVE_LEASE_TTL_MS = 2 * 60 * 60 * 1000; // 2 小时租约有效期

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
     * 每 Origin 并发限流队列 (防止 fnOS FN Connect 等对瞬间高并发限频掐断或假报 401/405)
     * @type {Map<string, { active: number, queue: Function[] }>}
     */
    static _originLimiters = new Map();

    /**
     * 单个 Origin 最大并发请求数
     */
    static MAX_CONCURRENT_PER_ORIGIN = 2;

    /**
     * 清空活跃端点租约记忆 (配置变更后立即重置路由优先级)
     */
    static clearEndpointLease() {
        this._activeUrlCache.clear();
        try {
            setValue(ACTIVE_ENDPOINT_STORAGE_KEY, {});
        } catch (_) {}
    }

    /**
     * 提取 URL 的 Origin 键用于并发队列隔离
     * @param {string} url
     * @returns {string}
     */
    static _getOriginKey(url) {
        if (!url || typeof url !== 'string') return 'default';
        const match = url.match(/^(https?:\/\/[^/]+)/i);
        return match ? match[1].toLowerCase() : url.split('/')[0].toLowerCase();
    }

    /**
     * 针对单个 Origin 执行并发槽位限流调度 (Max 2 in-flight per origin)
     * @param {string} url
     * @param {Function} taskFn
     * @returns {Promise<any>}
     */
    static async _runWithOriginLimit(url, taskFn) {
        const originKey = this._getOriginKey(url);
        let state = this._originLimiters.get(originKey);
        if (!state) {
            state = { active: 0, queue: [] };
            this._originLimiters.set(originKey, state);
        }

        if (state.active >= this.MAX_CONCURRENT_PER_ORIGIN) {
            await new Promise((resolve) => {
                state.queue.push(resolve);
            });
        }

        state.active++;
        try {
            return await taskFn();
        } finally {
            state.active = Math.max(0, state.active - 1);
            if (state.queue.length > 0) {
                const next = state.queue.shift();
                if (next) next();
            } else if (state.active === 0) {
                this._originLimiters.delete(originKey);
            }
        }
    }

    /**
     * 获取指定配置当前缓存的活跃端点 (内存优先，持久化租约兜底)
     * @param {string} cacheKey 
     * @returns {string|null}
     */
    static _getActiveEndpoint(cacheKey) {
        if (!cacheKey) return null;
        if (this._activeUrlCache.has(cacheKey)) {
            return this._activeUrlCache.get(cacheKey);
        }
        try {
            const raw = getValue(ACTIVE_ENDPOINT_STORAGE_KEY, null);
            if (raw && typeof raw === 'object' && raw[cacheKey]) {
                const lease = raw[cacheKey];
                if (lease && lease.url && Date.now() - (lease.time || 0) < ACTIVE_LEASE_TTL_MS) {
                    this._activeUrlCache.set(cacheKey, lease.url);
                    return lease.url;
                }
            }
        } catch (_) {}
        return null;
    }

    /**
     * 设置指定配置的活跃端点 (同时更新内存与持久化租约)
     * @param {string} cacheKey 
     * @param {string} activeUrl 
     */
    static _setActiveEndpoint(cacheKey, activeUrl) {
        if (!cacheKey || !activeUrl) return;
        this._activeUrlCache.set(cacheKey, activeUrl);
        try {
            let record = getValue(ACTIVE_ENDPOINT_STORAGE_KEY, {});
            if (!record || typeof record !== 'object') record = {};
            record[cacheKey] = {
                url: activeUrl,
                time: Date.now()
            };
            setValue(ACTIVE_ENDPOINT_STORAGE_KEY, record);
        } catch (_) {}
    }

    /**
     * 判断主机名是否为私有局域网 IP、本地回环或私有域名
     * @param {string} hostname 
     * @returns {boolean}
     */
    static isPrivateNetworkHost(hostname) {
        if (!hostname) return false;
        const h = hostname.toLowerCase().split(':')[0];
        return h === 'localhost' ||
               h === '127.0.0.1' ||
               h === '::1' ||
               /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
               /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h) ||
               /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h) ||
               h.endsWith('.local') ||
               h.endsWith('.lan') ||
               h.endsWith('.internal');
    }

    /**
     * 全局唯一判定：WebDAV 配置是否至少包含一个有效端点 (主地址或局域网备用地址)
     * @param {Object} config
     * @returns {boolean}
     */
    static hasValidEndpoint(config) {
        return Boolean(
            config && (
                (typeof config.url === 'string' && config.url.trim().length > 0) ||
                (typeof config.lanUrl === 'string' && config.lanUrl.trim().length > 0)
            )
        );
    }

    /**
     * 规范化与清洗端点 URL 格式，自动补齐缺省协议 (私网默认 http://，公网默认 https://)
     * @param {string} rawUrl 
     * @returns {string}
     */
    static sanitizeEndpointUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        let url = rawUrl.trim();
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) {
            const hostPart = url.split('/')[0];
            if (this.isPrivateNetworkHost(hostPart)) {
                url = 'http://' + url;
            } else {
                url = 'https://' + url;
            }
        }
        return url.replace(/\/+$/, '');
    }

    /**
     * 获取 WebDAV 候选地址列表 (按主地址、局域网备用地址去重提取并规范化清洗)
     * @param {Object} config - { url, lanUrl }
     * @returns {string[]}
     */
    static getCandidateUrls(config) {
        if (!config) return [];
        const candidates = [];
        if (config.url && typeof config.url === 'string' && config.url.trim()) {
            const cleanMain = this.sanitizeEndpointUrl(config.url);
            if (cleanMain) candidates.push(cleanMain);
        }
        if (config.lanUrl && typeof config.lanUrl === 'string' && config.lanUrl.trim()) {
            const cleanLan = this.sanitizeEndpointUrl(config.lanUrl);
            if (cleanLan && !candidates.includes(cleanLan)) {
                candidates.push(cleanLan);
            }
        }
        return candidates;
    }

    /**
     * 判断响应体是否为 HTML 网页劫持（如路由器/光猫管理页、防火墙拦截页、Wi-Fi认证页）
     * @param {Object} res
     * @returns {boolean}
     */
    static _isHtmlResponse(res) {
        if (!res || typeof res.data !== 'string') return false;
        const head = res.data.trim().slice(0, 200).toLowerCase();
        return head.startsWith('<!doctype html') ||
               head.startsWith('<html') ||
               head.includes('<head>') ||
               head.includes('<title>');
    }

    /**
     * 判断是否为网络错误或超时错误 (可触发向备用地址故障转移)
     * @param {Error|any} err 
     * @returns {boolean}
     */
    static _isNetworkError(err) {
        if (!err) return false;
        const msg = String(err?.message || err || '').toLowerCase();
        // 优先识别网关/路由器网页拦截或重定向拦截，允许无缝切换备用地址
        if (msg.includes('网页拦截') ||
            msg.includes('重定向拦截') ||
            msg.includes('网关异常') ||
            msg.includes('响应异常') ||
            msg.includes('目录不存在且无法自动创建') ||
            msg.includes('无法自动创建') ||
            msg.includes('禁止自动新建') ||
            msg.includes('无任何可见文件夹') ||
            msg.includes('大小写不匹配') ||
            msg.includes('实际位于') ||
            msg.includes('无权创建子目录')) {
            return true;
        }
        // 遇到真实 WebDAV 401/403 账号密码权限错误，绝不可作为网络故障转移
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
               msg.includes('http [0]') ||
               msg.includes('abort') ||
               msg.includes('terminated');
    }

    /**
     * 执行带双地址自动故障转移 (LAN / WAN Failover) 的 WebDAV 操作
     * @param {Object} config - WebDAV 配置 { url, lanUrl, user, pass, path }
     * @param {Function} actionFn - 接收当前有效 activeConfig 并返回 Promise 的操作函数
     * @returns {Promise<any>}
     */
    static async executeWithFailover(config, actionFn) {
        if (!config || (!config.url && !config.lanUrl)) {
            throw new Error('WebDAV 服务器地址不能为空');
        }
        if (config._isFailoverActive) {
            return actionFn(config);
        }
        const candidates = this.getCandidateUrls(config);
        if (candidates.length === 0) {
            throw new Error('WebDAV 服务器地址不能为空');
        }
        if (candidates.length === 1) {
            const singleCfg = Object.assign({}, config, {
                url: candidates[0],
                _isFailoverActive: true
            });
            return actionFn(singleCfg);
        }

        const cacheKey = `${candidates[0]}#${config.user || ''}`;
        const cachedActive = this._getActiveEndpoint(cacheKey);

        // 依据历史成功记录调整优先级
        let orderedCandidates = [...candidates];
        if (cachedActive && orderedCandidates.includes(cachedActive)) {
            orderedCandidates = [cachedActive, ...orderedCandidates.filter(u => u !== cachedActive)];
        }

        const attemptRecords = [];
        for (let i = 0; i < orderedCandidates.length; i++) {
            const candidateUrl = orderedCandidates[i];
            const isLast = (i === orderedCandidates.length - 1);
            const hostPart = (candidateUrl.split('://')[1] || candidateUrl).split('/')[0];
            const isLanCandidate = this.isPrivateNetworkHost(hostPart);
            // 多候选时：私网地址采用 1.8 秒极速探测，公网采用 3.0 秒灵敏超时截断；最后一个候选放宽到 15 秒
            const timeout = isLast ? 15000 : (isLanCandidate ? 1800 : 3000);
            const activeConfig = Object.assign({}, config, {
                url: candidateUrl,
                _failoverTimeout: timeout,
                _isFailoverActive: true
            });

            try {
                const result = await actionFn(activeConfig);
                // 成功，更新活跃记忆与持久化租约
                this._setActiveEndpoint(cacheKey, candidateUrl);
                return result;
            } catch (err) {
                const errMsg = String(err?.message || err || '未知错误');
                attemptRecords.push({ url: candidateUrl, msg: errMsg });
                const canRetry = this._isNetworkError(err);
                if (!canRetry) {
                    throw err;
                }
                if (isLast) {
                    if (attemptRecords.length > 1) {
                        const firstMsg = attemptRecords[0].msg;
                        const allSameMsg = attemptRecords.every(r => r.msg === firstMsg);
                        const summaryText = allSameMsg
                            ? `所有端点均连接失败 (${attemptRecords.map(r => r.url).join(', ')}): ${firstMsg}`
                            : `所有端点均连接失败 (${attemptRecords.map(r => `[${r.url}] ${r.msg}`).join(' | ')})`;
                        const summaryErr = new Error(summaryText);
                        summaryErr.cause = err;
                        throw summaryErr;
                    }
                    throw err;
                }
                console.warn(`[WebDavClient] 端点 ${candidateUrl} 连接未响应 (${errMsg})，正在自动无缝切换备用端点...`);
            }
        }

        throw new Error(attemptRecords.map(r => `[${r.url}] ${r.msg}`).join(' | ') || 'WebDAV 连接失败');
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
        let url = this.sanitizeEndpointUrl(baseUrl);
        if (!url) return '';

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
     * 对路径的各个分段进行 UTF-8 百分比安全编码 (解决 Safari / Stay 对中文路径如 /我的文件/ 静默失败，同时避免对 %XX 二次编码)
     * @param {string} rawPath
     * @returns {string}
     */
    static _encodePathSegments(rawPath) {
        if (!rawPath || typeof rawPath !== 'string') return '';
        return rawPath.split('/').map((seg) => {
            if (!seg) return '';
            try {
                const decoded = decodeURIComponent(seg);
                return encodeURIComponent(decoded);
            } catch (_) {
                return encodeURIComponent(seg);
            }
        }).join('/');
    }

    /**
     * 规范化 WebDAV URL 和路径拼接，并严格校验目录/文件斜杠规则 (防 301 重定向导致 Auth 标头丢失，兼顾非 ASCII 路径编码)
     * @param {string} baseUrl - WebDAV 服务器基础地址
     * @param {string} path - 相对或绝对路径
     * @param {string} [username=''] - 用户名
     * @returns {string} 完整的规范化 URL
     */
    static normalizeUrl(baseUrl, path = '', username = '') {
        if (!baseUrl) return '';
        let cleanBase = this.normalizeProviderUrl(baseUrl, username);
        // 若基础地址自带含非 ASCII 或空格的挂载子路径，一并安全编码
        const originMatch = cleanBase.match(/^(https?:\/\/[^/]+)(\/.*)$/i);
        if (originMatch && /[^\x21-\x7E]/.test(originMatch[2])) {
            cleanBase = originMatch[1] + this._encodePathSegments(originMatch[2]);
        }

        let cleanPath = (path || '').trim();
        if (cleanPath && !cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }
        if (cleanPath) {
            cleanPath = this._encodePathSegments(cleanPath);
        }

        return cleanBase + cleanPath;
    }

    /**
     * 执行底层 HTTP 请求 (优先调用 GM_xmlhttpRequest，内置每 Origin 并发限流、超时硬熔断与异常捕获)
     * @param {Object} options - 请求配置
     * @returns {Promise<{ status: number, statusText: string, data: string, headers: Object }>}
     */
    static request(options) {
        return this._runWithOriginLimit(options?.url, () => this._rawRequest(options));
    }

    /**
     * 实际底层 HTTP 传输执行器
     * @private
     */
    static _rawRequest(options) {
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
                let gmTimer = null;
                let reqHandle = null;
                const clearGmTimer = () => {
                    if (gmTimer) {
                        clearTimeout(gmTimer);
                        gmTimer = null;
                    }
                };
                const gmResolve = (res) => {
                    clearGmTimer();
                    safeResolve(res);
                };
                const gmReject = (err) => {
                    clearGmTimer();
                    safeReject(err);
                };

                try {
                    // 硬熔断定时器：防止部分管理器 (如 Safari Stay) 忽略 timeout 参数导致长时间 hang 死
                    gmTimer = setTimeout(() => {
                        try {
                            if (reqHandle && typeof reqHandle.abort === 'function') {
                                reqHandle.abort();
                            }
                        } catch (_) {}
                        gmReject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
                    }, timeout + 400);

                    reqHandle = gmXhr({
                        method,
                        url,
                        headers: mergedHeaders,
                        data,
                        timeout,
                        anonymous: false,
                        onload: (res) => {
                            if (!res || res.status === 0) {
                                gmReject(new Error(`网络连接失败 (HTTP [0]): 无法访问 ${url}`));
                                return;
                            }
                            gmResolve({
                                status: res.status,
                                statusText: res.statusText,
                                data: res.responseText || '',
                                response: res.response
                            });
                        },
                        ontimeout: () => {
                            gmReject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
                        },
                        onerror: (err) => {
                            const msg = err?.error || err?.statusText || (err?.status ? `HTTP [${err.status}]` : '网络连接失败，请检查服务器地址或跨域权限');
                            gmReject(new Error(msg));
                        },
                        onabort: () => {
                            gmReject(new Error('请求被中止'));
                        }
                    });
                } catch (e) {
                    gmReject(e);
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
     * 统一 WebDAV 协议守卫请求包装器 (一处治理所有子功能: 识别 HTML 劫持、3xx 重定向、401/403 认证铁闸、5xx 网关异常)
     * @param {Object} options - 请求参数
     * @param {Object} [guardOpts] - 守卫选项
     * @param {boolean} [guardOpts.throwOn403=true] - 403 是否抛出不可转移的认证错误 (MKCOL 权限诊断场景可设为 false)
     * @returns {Promise<{ status: number, statusText: string, data: string }>}
     */
    static async _davRequest(options, guardOpts = {}) {
        const { throwOn403 = true } = guardOpts;
        const res = await this.request(options);

        // 优先拦截路由器/光猫劫持页面或网页登录页 (WebDAV 协议正常绝不返回 HTML，即使伴随 200/401/403/404)
        if (this._isHtmlResponse(res)) {
            throw new Error(`网关或路由器网页拦截 (HTTP ${res.status}): 端点返回了 HTML 而非 WebDAV 协议`);
        }
        if (res.status === 401 || (res.status === 403 && throwOn403)) {
            throw new Error(`认证失败 (${res.status}): 请检查用户名与应用密码/授权码`);
        }
        if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
            throw new Error(`WebDAV 重定向拦截 (HTTP ${res.status}): 请检查是否缺少内网回流或路径格式`);
        }
        if (res.status >= 500) {
            throw new Error(`服务器网关异常 (HTTP ${res.status})`);
        }
        return res;
    }

    /**
     * 安全解码 URI 路径段
     * @param {string} raw
     * @returns {string}
     */
    static _decodePathSafe(raw) {
        if (!raw || typeof raw !== 'string') return '';
        try {
            return decodeURIComponent(raw);
        } catch (_) {
            return raw;
        }
    }

    /**
     * 解析 PROPFIND Depth: 1 返回的 XML，提取直属子目录名称清单 (纯正则零 DOMParser 依赖，兼容浏览器与 Node)
     * @param {string} xmlText
     * @param {string} baseDirUrl
     * @returns {string[]}
     */
    static _parseWebDavChildDirs(xmlText, baseDirUrl) {
        if (!xmlText || typeof xmlText !== 'string') return [];
        const rawBasePath = (baseDirUrl || '').replace(/^https?:\/\/[^/]+/i, '') || '/';
        let decodedBase = this._decodePathSafe(rawBasePath).replace(/\/+$/, '') + '/';
        if (!decodedBase.startsWith('/')) decodedBase = '/' + decodedBase;

        const blocks = xmlText.match(/<(?:[a-zA-Z0-9_-]+:)?response\b[\s\S]*?<\/(?:[a-zA-Z0-9_-]+:)?response>/gi);
        const items = blocks && blocks.length > 0 ? blocks : [xmlText];
        const result = [];
        const seen = new Set();

        for (const block of items) {
            const hrefMatches = [...block.matchAll(/<(?:[a-zA-Z0-9_-]+:)?href>([\s\S]*?)<\/(?:[a-zA-Z0-9_-]+:)?href>/gi)];
            for (const m of hrefMatches) {
                const rawHref = (m[1] || '').trim();
                if (!rawHref) continue;
                const isCollection = rawHref.endsWith('/') || /<(?:[a-zA-Z0-9_-]+:)?collection\b/i.test(block);
                if (blocks && blocks.length > 0 && !isCollection) continue;

                const hrefPathRaw = /^https?:\/\//i.test(rawHref)
                    ? (rawHref.replace(/^https?:\/\/[^/]+/i, '') || '/')
                    : rawHref;
                let decodedHref = this._decodePathSafe(hrefPathRaw);
                if (!decodedHref.startsWith('/')) decodedHref = '/' + decodedHref;
                const normHref = decodedHref.replace(/\/+$/, '') + '/';

                if (normHref === decodedBase) continue; // 跳过目录自身
                if (normHref.startsWith(decodedBase)) {
                    const rel = normHref.slice(decodedBase.length).replace(/^\/+|\/+$/g, '');
                    if (rel && !rel.includes('/') && !seen.has(rel)) {
                        seen.add(rel);
                        result.push(rel);
                    }
                }
            }
        }
        return result;
    }

    /**
     * 列举远端指定目录的直属子文件夹清单 (PROPFIND Depth: 1)
     * @param {string} baseUrl
     * @param {string} dirPath
     * @param {string} user
     * @param {string} pass
     * @param {number} [timeout=5000]
     * @returns {Promise<{ ok: boolean, dirs: string[] }>}
     */
    static async _listDirectoryDirs(baseUrl, dirPath, user, pass, timeout = 5000) {
        const normPath = (dirPath || '/').replace(/\/+$/, '') + '/';
        const targetUrl = this.normalizeUrl(baseUrl, normPath, user);
        try {
            const res = await this._davRequest({
                method: 'PROPFIND',
                url: targetUrl,
                user,
                pass,
                timeout: Math.min(timeout, 5000),
                headers: {
                    'Depth': '1'
                }
            });
            if (res.status === 207 || res.status === 200) {
                return {
                    ok: true,
                    dirs: this._parseWebDavChildDirs(res.data || '', targetUrl)
                };
            }
            return { ok: false, dirs: [] };
        } catch (err) {
            if (this._isNetworkError(err) && !String(err?.message || '').includes('目录')) {
                throw err;
            }
            return { ok: false, dirs: [] };
        }
    }

    /**
     * 当目标目录无法自动创建时，探测 WebDAV 根目录可见范围并生成精确可操作诊断结论
     * @private
     */
    static async _diagnoseDirectoryFailure(baseUrl, user, pass, cleanPath, timeout, lastMkcolStatus) {
        const statusHint = lastMkcolStatus ? ` (MKCOL HTTP ${lastMkcolStatus})` : '';
        const segments = cleanPath.split('/').filter(Boolean);
        const firstSeg = segments[0] || '';

        try {
            const rootListing = await this._listDirectoryDirs(baseUrl, '/', user, pass, timeout);
            if (!rootListing.ok) {
                return `WebDAV 目录不存在且无法自动创建${statusHint}，请在服务器手动创建: ${cleanPath}`;
            }

            const visibleRoots = rootListing.dirs;
            if (visibleRoots.length === 0) {
                return `WebDAV 根目录无任何可见文件夹${statusHint}。若使用飞牛 fnOS，请在「系统设置 → 文件共享协议 → WebDAV → 可见文件夹范围」重新勾选授权文件夹；或手动创建: ${cleanPath}`;
            }

            if (firstSeg) {
                const exactRoot = visibleRoots.find(d => d === firstSeg);
                if (!exactRoot) {
                    const caseRoot = visibleRoots.find(d => d.toLowerCase() === firstSeg.toLowerCase());
                    if (caseRoot) {
                        return `目录大小写不匹配${statusHint}：服务器根目录存在「/${caseRoot}/」，请将备份目录首段改为「/${caseRoot}/」`;
                    }

                    // 探测常见的个人默认根容器 (例如 fnOS「我的文件」、Nextcloud「files」等，最多 2 次轻探测)
                    const wrapperCandidates = visibleRoots.filter(d => /^(我的文件|my\s*files?|home|files|dav)$/i.test(d)).slice(0, 2);
                    for (const wrapper of wrapperCandidates) {
                        const subListing = await this._listDirectoryDirs(baseUrl, `/${wrapper}/`, user, pass, timeout);
                        if (subListing.ok) {
                            const matchedSub = subListing.dirs.find(d => d.toLowerCase() === firstSeg.toLowerCase());
                            if (matchedSub) {
                                const correctedTail = [matchedSub, ...segments.slice(1)].join('/');
                                return `检测到「/${firstSeg}」实际位于「/${wrapper}/」下${statusHint}，请将备份目录改为: /${wrapper}/${correctedTail}/`;
                            }
                        }
                    }

                    const rootPreview = visibleRoots.slice(0, 6).join(', ');
                    return `WebDAV 根目录禁止自动新建一级文件夹${statusHint}。当前可见根目录: [${rootPreview}]，请将备份目录设为其中已有文件夹的子目录（如 /${visibleRoots[0]}${cleanPath}）或检查可见文件夹范围`;
                }

                // 一级目录已可见但深层目录创建失败 -> 检查二级大小写或只读权限
                if (segments.length >= 2) {
                    const subListing = await this._listDirectoryDirs(baseUrl, `/${exactRoot}/`, user, pass, timeout);
                    if (subListing.ok) {
                        const secondSeg = segments[1];
                        const caseSub = subListing.dirs.find(d => d !== secondSeg && d.toLowerCase() === secondSeg.toLowerCase());
                        if (caseSub) {
                            return `子目录大小写不匹配${statusHint}：「/${exactRoot}/」下存在「${caseSub}」，请调整备份目录大小写`;
                        }
                    }
                }
                return `根目录「/${exactRoot}/」已存在但无法创建子目录${statusHint}，请检查账号「${user || ''}」对该目录是否有读写权限（勿设为只读），或手动创建: ${cleanPath}`;
            }
        } catch (diagErr) {
            // 若探测根目录本身触发了网络/HTML/3xx 故障转移条件，直接上抛给 executeWithFailover
            if (this._isNetworkError(diagErr) && !String(diagErr?.message || '').includes('目录')) {
                throw diagErr;
            }
        }

        return `WebDAV 目录不存在且无法自动创建${statusHint}，请在服务器手动创建: ${cleanPath}`;
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
        const res = await this._davRequest({
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
        throw new Error(`WebDAV 目录探测响应异常 (HTTP ${res.status})`);
    }

    /**
     * 逐级嗅探并创建 WebDAV 专用目录内部实现 (优先直探目标终极路径 -> 无斜杠容错 -> 404 时逐级 MKCOL -> 根目录可见性诊断)
     * @private
     */
    static async _ensureDirectoryInternal(config) {
        const { url, user, pass, path = '/MissPlayer/', _failoverTimeout } = config;
        const reqTimeout = _failoverTimeout || 15000;
        let cleanPath = (path || '/MissPlayer/').trim();
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        if (!cleanPath.endsWith('/')) cleanPath = cleanPath + '/';

        // 0. 终极目标路径优先直探：避免 NAS 共享文件夹根挂载点禁止 PROPFIND/MKCOL 误卡住已有子目录
        const finalDirUrl = this.normalizeUrl(url, cleanPath, user);
        const directExists = await this.checkDirectoryExists(finalDirUrl, user, pass, reqTimeout);
        if (directExists) {
            return;
        }

        // 0.5 末尾斜杠严格敏感网关容错探测 (仅接收明确 207/200)
        const noSlashUrl = finalDirUrl.replace(/\/+$/, '');
        if (noSlashUrl && noSlashUrl !== finalDirUrl && cleanPath !== '/') {
            try {
                const altRes = await this._davRequest({
                    method: 'PROPFIND',
                    url: noSlashUrl,
                    user,
                    pass,
                    timeout: reqTimeout,
                    headers: { 'Depth': '0' }
                });
                if (altRes.status === 207 || altRes.status === 200) {
                    return;
                }
            } catch (altErr) {
                if (this._isNetworkError(altErr) || String(altErr?.message || '').includes('认证失败')) {
                    throw altErr;
                }
            }
        }

        const segments = cleanPath.split('/').filter(Boolean);
        let currentPath = '';
        let lastMkcolStatus = null;

        for (const seg of segments) {
            currentPath += '/' + seg;
            const dirUrlWithSlash = this.normalizeUrl(url, currentPath + '/', user);

            // 1. 目录级嗅探：先探测该层级目录是否存在 (网络错误会直接抛出并触发故障转移)
            const exists = await this.checkDirectoryExists(dirUrlWithSlash, user, pass, reqTimeout);
            if (exists) {
                continue; // 该层级已存在，继续检测下一级
            }

            // 2. 该层级不存在，发送 MKCOL 创建目录 (403 交由下层权限诊断而非直接死判密码错)
            try {
                const res = await this._davRequest({
                    method: 'MKCOL',
                    url: dirUrlWithSlash,
                    user,
                    pass,
                    timeout: reqTimeout
                }, { throwOn403: false });
                lastMkcolStatus = res.status;
                // 201 Created: 成功创建; 405: 目录已存在或根目录禁止建级; 200/204: 成功; 415: 已存在或网关不支持空body
                if (res.status === 201 || res.status === 200 || res.status === 204 || res.status === 415) {
                    continue;
                }
                if (res.status === 405 || res.status === 403) {
                    // 某些网盘 (如 fnOS) 对根目录 MKCOL 返回 405，先记下状态码并继续检查或诊断
                    console.warn(`[WebDavClient] MKCOL 创建目录 ${currentPath} 返回 HTTP ${res.status}`);
                    continue;
                }
                console.warn(`[WebDavClient] MKCOL 创建目录 ${currentPath} 遇到状态码: ${res.status}`);
            } catch (err) {
                if (this._isNetworkError(err) || String(err?.message || '').includes('认证失败')) {
                    throw err;
                }
                console.warn(`[WebDavClient] MKCOL 创建目录 ${currentPath} 遇到异常:`, err.message || err);
            }
        }

        // 最终校验目标根目录是否就绪
        const finalExists = await this.checkDirectoryExists(finalDirUrl, user, pass, reqTimeout);
        if (!finalExists) {
            const diagMessage = await this._diagnoseDirectoryFailure(url, user, pass, cleanPath, reqTimeout, lastMkcolStatus);
            throw new Error(diagMessage);
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
                // 发送 GET 探测备份文件是否存在或连通 (走统一协议守卫)
                const res = await this._davRequest({
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

                const isLan = config.lanUrl && (
                    this.sanitizeEndpointUrl(activeCfg.url) === this.sanitizeEndpointUrl(config.lanUrl) ||
                    this.isPrivateNetworkHost((activeCfg.url.split('://')[1] || activeCfg.url).split('/')[0])
                );
                const suffix = isLan ? ' (局域网直连)' : ' (公网域名)';

                // 200 (文件已存在) 或 404 (连接正常且目录就绪，文件尚未创建) 均代表认证及连通成功！
                if (res.status === 200 || res.status === 204 || res.status === 207) {
                    return {
                        success: true,
                        activeUrl: activeCfg.url,
                        message: `WebDAV 连接成功${suffix}，已检测到云端备份！`
                    };
                }

                if (res.status === 404) {
                    return {
                        success: true,
                        activeUrl: activeCfg.url,
                        message: `WebDAV 目录已自动就绪${suffix}，随时可同步数据！`
                    };
                }

                return {
                    success: true,
                    activeUrl: activeCfg.url,
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
                const res = await this._davRequest({
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

                throw new Error(`下载失败，WebDAV 响应异常 (HTTP ${res.status})`);
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
                let res = await this._davRequest({
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
                    res = await this._davRequest({
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

                if (res.status === 200 || res.status === 201 || res.status === 204) {
                    return {
                        success: true,
                        status: res.status
                    };
                }

                throw new Error(`上传失败，WebDAV 响应异常 (HTTP ${res.status})`);
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

            const res = await this._davRequest({
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
            throw new Error(`上传文件失败，WebDAV 响应异常 (HTTP ${res.status})`);
        });
    }

    /**
     * 探测 WebDAV 上指定文件是否存在 (带双地址自动故障转移，经统一协议守卫拦截 HTML/5xx/3xx)
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
                const res = await this._davRequest({
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
