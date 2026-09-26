/**
 * 针对云端大文件或异常畸变空对象进行预清洗，防止 JSON.parse 导致主线程严重卡死
 * @param {string} text 
 * @returns {string}
 */
function sanitizeIncomingJsonText(text) {
    if (!text || typeof text !== 'string') return text;
    // 当检测到大量空对象畸变或体积异常膨胀时，极速剔除空对象占位
    if (text.length > 100 * 1024 || text.includes('{},')) {
        console.warn('[WebDavClient] 检测到云端 JSON 包含大量异常空对象畸变，启动流式预清洗...');
        let cleaned = text.replace(/\{\s*\},?\s*/g, '');
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
        return cleaned;
    }
    return text;
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
                if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
                if (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function') {
                    return (opts) => GM.xmlHttpRequest(opts);
                }
                if (typeof window !== 'undefined' && typeof window.GM_xmlhttpRequest === 'function') {
                    return window.GM_xmlhttpRequest;
                }
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow && typeof unsafeWindow.GM_xmlhttpRequest === 'function') {
                    return unsafeWindow.GM_xmlhttpRequest;
                }
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
     * @returns {Promise<boolean>} true: 目录存在; false: 目录不存在 (404)
     */
    static async checkDirectoryExists(dirUrl, user, pass) {
        try {
            const res = await this.request({
                method: 'PROPFIND',
                url: dirUrl,
                user,
                pass,
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
     * 逐级嗅探并创建 WebDAV 专用目录 (PROPFIND 嗅探 -> MKCOL 创建)
     * 严格遵守 RFC 4918：目录 URL 末尾必须带 /，防止 301 重定向剥离鉴权头
     * @param {Object} config - { url, user, pass, path }
     */
    static async ensureDirectory(config) {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        let cleanPath = (path || '/MissPlayer/').trim();
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        if (!cleanPath.endsWith('/')) cleanPath = cleanPath + '/';

        const segments = cleanPath.split('/').filter(Boolean);
        let currentPath = '';

        for (const seg of segments) {
            currentPath += '/' + seg;
            const dirUrlWithSlash = this.normalizeUrl(url, currentPath + '/', user);

            // 1. 目录级嗅探：先探测该层级目录是否存在
            const exists = await this.checkDirectoryExists(dirUrlWithSlash, user, pass);
            if (exists) {
                continue; // 该层级已存在，继续检测下一级
            }

            // 2. 该层级不存在，发送 MKCOL 创建目录
            try {
                const res = await this.request({
                    method: 'MKCOL',
                    url: dirUrlWithSlash,
                    user,
                    pass
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
    }

    /**
     * 测试 WebDAV 连通性并自动嗅探预建目录
     * @param {Object} config - { url, user, pass, path }
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    static async testConnection(config) {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        if (!url) {
            throw new Error('WebDAV 服务器地址不能为空');
        }

        let cleanPath = (path || '/MissPlayer/').trim();
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        if (!cleanPath.endsWith('/')) cleanPath = cleanPath + '/';

        // 1. 优先执行目录级嗅探与自动创建
        await this.ensureDirectory(config);

        const fileUrl = this.normalizeUrl(url, cleanPath + 'miss_player_sync.json', user);

        try {
            // 发送 GET 探测备份文件是否存在或连通
            const res = await this.request({
                method: 'GET',
                url: fileUrl,
                user,
                pass,
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

            // 200 (文件已存在) 或 404 (连接正常且目录就绪，文件尚未创建) 均代表认证及连通成功！
            if (res.status === 200 || res.status === 204 || res.status === 207) {
                return {
                    success: true,
                    message: 'WebDAV 连接成功，已检测到云端备份！'
                };
            }

            if (res.status === 404) {
                return {
                    success: true,
                    message: 'WebDAV 目录已自动就绪，随时可同步数据！'
                };
            }

            return {
                success: true,
                message: `WebDAV 响应状态: ${res.status}`
            };
        } catch (error) {
            console.error('[WebDavClient] 测试连接失败:', error);
            throw error;
        }
    }

    /**
     * 从 WebDAV 下载备份 JSON 文件 (安全 JSON 解析与容错校验)
     * @param {Object} config - { url, user, pass, path }
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     * @returns {Promise<Object|null>} 成功返回 JSON 数据对象，若文件不存在返回 null
     */
    static async downloadBackup(config, filename = 'miss_player_sync.json') {
        const { url, user, pass, path = '/MissPlayer/' } = config;
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
                const sanitizedData = sanitizeIncomingJsonText(res.data.trim());
                try {
                    const parsed = JSON.parse(sanitizedData);
                    if (parsed && typeof parsed === 'object') {
                        return parsed;
                    }
                    throw new Error('云端备份文件内容格式畸变');
                } catch (jsonErr) {
                    console.error('[WebDavClient] 云端 JSON 解析失败:', jsonErr);
                    // 尝试智能补全因截断导致的未闭合结构
                    try {
                        const repaired = tryRepairTruncatedJson(sanitizedData);
                        if (repaired && typeof repaired === 'object' && (repaired.settings || repaired.markers)) {
                            console.warn('[WebDavClient] 成功智能补全截断云端备份 JSON 并安全恢复数据');
                            return repaired;
                        }
                    } catch (_) {}
                    throw new Error('云端备份数据损坏或被截断，已终止读取');
                }
            }

            throw new Error(`下载失败，服务器返回状态码: ${res.status}`);
        } catch (error) {
            console.error('[WebDavClient] 下载备份失败:', error);
            throw error;
        }
    }

    /**
     * 上传备份 JSON 数据至 WebDAV (写入前主动确保目录就绪)
     * @param {Object} config - { url, user, pass, path }
     * @param {Object} data - 要备份的完整 JSON 对象
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     */
    static async uploadBackup(config, data, filename = 'miss_player_sync.json') {
        const { url, user, pass, path = '/MissPlayer/' } = config;

        // 1. 上传前主动确保所有父级目录存在
        await this.ensureDirectory(config);

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
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                data: jsonString
            });

            // 遇到极端情况 404/409 时再次重试一次
            if (res.status === 404 || res.status === 409) {
                console.warn(`[WebDavClient] PUT 返回 ${res.status}，重试 ensureDirectory 并二次上传...`);
                await this.ensureDirectory(config);
                res = await this.request({
                    method: 'PUT',
                    url: fileUrl,
                    user,
                    pass,
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
    }

    /**
     * 上传任意文本/JSON文件至 WebDAV 指定子目录
     * @param {Object} config - { url, user, pass, path }
     * @param {string} subPath - 相对子路径 (如 'logs/debug/xxx.txt' 或 'comments/xxx.json')
     * @param {string|Object} content - 文件文本或 JSON 对象
     * @param {string} [contentType='text/plain; charset=utf-8'] - MIME 类型
     * @returns {Promise<{ success: boolean, status: number }>}
     */
    static async uploadFile(config, subPath, content, contentType = 'text/plain; charset=utf-8') {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        let dirPath = (path || '/MissPlayer/').trim();
        if (!dirPath.startsWith('/')) dirPath = '/' + dirPath;
        if (!dirPath.endsWith('/')) dirPath = dirPath + '/';

        let targetPath = subPath.trim();
        if (targetPath.startsWith('/')) targetPath = targetPath.slice(1);

        // 确保上级目录存在
        const lastSlash = targetPath.lastIndexOf('/');
        if (lastSlash !== -1) {
            const subDir = targetPath.slice(0, lastSlash + 1);
            await this.ensureDirectory({ ...config, path: dirPath + subDir });
        } else {
            await this.ensureDirectory(config);
        }

        const fileUrl = this.normalizeUrl(url, dirPath + targetPath, user);
        const data = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);

        const res = await this.request({
            method: 'PUT',
            url: fileUrl,
            user,
            pass,
            headers: {
                'Content-Type': contentType
            },
            data
        });

        if (res.status === 200 || res.status === 201 || res.status === 204) {
            return { success: true, status: res.status };
        }
        throw new Error(`上传文件失败，状态码: ${res.status}`);
    }

}
