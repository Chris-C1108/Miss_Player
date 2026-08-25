/**
 * WebDAV 协议客户端 (WebDavClient)
 * 提供基于 GM_xmlhttpRequest / fetch 的跨域 WebDAV 存储交互
 */
export class WebDavClient {
    /**
     * 构建认证请求头
     * @param {string} user - 用户名
     * @param {string} pass - 密码 / 授权码
     * @returns {Object} Headers 字典
     */
    static getAuthHeaders(user, pass) {
        if (!user && !pass) return {};
        try {
            const token = btoa(unescape(encodeURIComponent(`${user || ''}:${pass || ''}`)));
            return {
                'Authorization': `Basic ${token}`
            };
        } catch (_) {
            return {};
        }
    }

    /**
     * 规范化 WebDAV URL 和路径拼接
     * @param {string} baseUrl - WebDAV 服务器基础地址
     * @param {string} path - 相对或绝对路径
     * @returns {string} 完整的规范化 URL
     */
    static normalizeUrl(baseUrl, path = '') {
        if (!baseUrl) return '';
        let url = baseUrl.trim();
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        // 移除 baseUrl 尾部斜杠
        url = url.replace(/\/+$/, '');

        // 规范化 path
        let cleanPath = (path || '').trim();
        if (cleanPath && !cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }

        return url + cleanPath;
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
            timeout = 12000
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

            // 1. 优先使用 GM_xmlhttpRequest
            if (typeof GM_xmlhttpRequest === 'function') {
                try {
                    GM_xmlhttpRequest({
                        method,
                        url,
                        headers: mergedHeaders,
                        data,
                        timeout,
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
                        safeReject(err);
                    });
            } catch (e) {
                safeReject(e);
            }
        });
    }

    /**
     * 测试 WebDAV 连通性
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

        const fileUrl = this.normalizeUrl(url, cleanPath + 'miss_player_sync.json');

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
                throw new Error(`认证失败 (${res.status}): 请检查用户名与密码/Token`);
            }

            if (res.status >= 500) {
                throw new Error(`服务器错误 (${res.status})`);
            }

            // 若返回 200 (文件已存在) 或 404 (连接正常，文件尚未创建) 均代表认证及连通成功！
            if (res.status === 200 || res.status === 404 || res.status === 204 || res.status === 207) {
                return {
                    success: true,
                    message: 'WebDAV 连接成功！'
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
     * 递归确保 WebDAV 上的专用目录存在 (通过 MKCOL 创建)
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
            const dirUrlWithSlash = this.normalizeUrl(url, currentPath + '/');

            try {
                const res = await this.request({
                    method: 'MKCOL',
                    url: dirUrlWithSlash,
                    user,
                    pass
                });
                // 201: 已创建, 405: 目录已存在(合法), 200/204: 成功
                if (res.status === 201 || res.status === 405 || res.status === 200 || res.status === 204) {
                    continue;
                }
            } catch (err) {
                // 忽略创建目录的非致命异常
                console.warn(`[WebDavClient] MKCOL 创建目录 ${currentPath} 遇到状态:`, err.message || err);
            }
        }
    }

    /**
     * 从 WebDAV 下载备份 JSON 文件
     * @param {Object} config - { url, user, pass, path }
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     * @returns {Promise<Object|null>} 成功返回 JSON 数据对象，若文件不存在返回 null
     */
    static async downloadBackup(config, filename = 'miss_player_sync.json') {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        let dirPath = (path || '/MissPlayer/').trim();
        if (!dirPath.startsWith('/')) dirPath = '/' + dirPath;
        if (!dirPath.endsWith('/')) dirPath = dirPath + '/';

        const fileUrl = this.normalizeUrl(url, dirPath + filename);

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
                throw new Error(`认证失败 (${res.status}): 请检查用户名与密码/Token`);
            }

            if (res.status >= 200 && res.status < 300) {
                if (!res.data || !res.data.trim()) {
                    return null;
                }
                return JSON.parse(res.data);
            }

            throw new Error(`下载失败，服务器返回状态码: ${res.status}`);
        } catch (error) {
            console.error('[WebDavClient] 下载备份失败:', error);
            throw error;
        }
    }

    /**
     * 上传备份 JSON 数据至 WebDAV (支持 404/409 自动创建目录并重试)
     * @param {Object} config - { url, user, pass, path }
     * @param {Object} data - 要备份的完整 JSON 对象
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     */
    static async uploadBackup(config, data, filename = 'miss_player_sync.json') {
        const { url, user, pass, path = '/MissPlayer/' } = config;

        let dirPath = (path || '/MissPlayer/').trim();
        if (!dirPath.startsWith('/')) dirPath = '/' + dirPath;
        if (!dirPath.endsWith('/')) dirPath = dirPath + '/';

        const fileUrl = this.normalizeUrl(url, dirPath + filename);
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

            // 如果遇到 404 / 409 (父目录未创建)，自动创建目录并重试 PUT
            if (res.status === 404 || res.status === 409) {
                console.warn(`[WebDavClient] PUT 返回 ${res.status}，自动创建目录并重试上传...`);
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
}
