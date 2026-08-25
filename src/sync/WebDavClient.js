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
     * 执行底层 HTTP 请求 (优先调用 GM_xmlhttpRequest)
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
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method,
                    url,
                    headers: mergedHeaders,
                    data,
                    timeout,
                    onload: (res) => {
                        resolve({
                            status: res.status,
                            statusText: res.statusText,
                            data: res.responseText,
                            response: res.response
                        });
                    },
                    ontimeout: () => {
                        reject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
                    },
                    onerror: (err) => {
                        reject(new Error(err.error || `网络请求错误 [${err.status || 0}]`));
                    }
                });
            } else {
                // 浏览器原生 fetch 降级
                const fetchOpts = {
                    method,
                    headers: mergedHeaders,
                    body: (method !== 'GET' && method !== 'HEAD' && method !== 'PROPFIND') ? data : undefined
                };

                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);
                fetchOpts.signal = controller.signal;

                fetch(url, fetchOpts)
                    .then(async (res) => {
                        clearTimeout(timer);
                        const text = await res.text();
                        resolve({
                            status: res.status,
                            statusText: res.statusText,
                            data: text
                        });
                    })
                    .catch((err) => {
                        clearTimeout(timer);
                        reject(err);
                    });
            }
        });
    }

    /**
     * 测试 WebDAV 连通性并自动探测/创建专用文件夹
     * @param {Object} config - { url, user, pass, path }
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    static async testConnection(config) {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        if (!url) {
            throw new Error('WebDAV 服务器地址不能为空');
        }

        const testUrl = this.normalizeUrl(url, '/');
        
        try {
            // 1. 验证基础鉴权与服务器根连通性 (发送 PROPFIND)
            const res = await this.request({
                method: 'PROPFIND',
                url: testUrl,
                user,
                pass,
                headers: {
                    'Depth': '0',
                    'Content-Type': 'application/xml; charset=utf-8'
                }
            });

            if (res.status === 401 || res.status === 403) {
                throw new Error(`认证失败 (${res.status}): 请检查用户名与密码/Token`);
            }

            if (res.status >= 500) {
                throw new Error(`服务器错误 (${res.status})`);
            }

            // 2. 确保专用备份文件夹存在
            await this.ensureDirectory(config);

            return {
                success: true,
                message: 'WebDAV 连接与目录创建成功！'
            };
        } catch (error) {
            console.error('[WebDavClient] 测试连接失败:', error);
            throw error;
        }
    }

    /**
     * 递归确保 WebDAV 上的专用目录存在 (若不存在则通过 MKCOL 自动创建)
     * 支持带尾部斜杠与不带斜杠的双重容错探测与创建
     * @param {Object} config - { url, user, pass, path }
     */
    static async ensureDirectory(config) {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        let cleanPath = (path || '/MissPlayer/').trim();
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        if (!cleanPath.endsWith('/')) cleanPath = cleanPath + '/';

        // 拆分各层级子路径，例如 /backups/MissPlayer/ -> ['backups', 'MissPlayer']
        const segments = cleanPath.split('/').filter(Boolean);
        let currentPath = '';

        for (const seg of segments) {
            currentPath += '/' + seg;
            const dirUrlWithSlash = this.normalizeUrl(url, currentPath + '/');
            const dirUrlNoSlash = this.normalizeUrl(url, currentPath);

            let isExisting = false;

            // 1. 尝试使用 PROPFIND 探测目录是否已存在
            try {
                const propRes = await this.request({
                    method: 'PROPFIND',
                    url: dirUrlWithSlash,
                    user,
                    pass,
                    headers: { 'Depth': '0' }
                });

                if (propRes.status === 207 || (propRes.status >= 200 && propRes.status < 300)) {
                    isExisting = true;
                }
            } catch (_) {}

            if (!isExisting) {
                try {
                    const propResNoSlash = await this.request({
                        method: 'PROPFIND',
                        url: dirUrlNoSlash,
                        user,
                        pass,
                        headers: { 'Depth': '0' }
                    });
                    if (propResNoSlash.status === 207 || (propResNoSlash.status >= 200 && propResNoSlash.status < 300)) {
                        isExisting = true;
                    }
                } catch (_) {}
            }

            if (isExisting) continue;

            // 2. 目录不存在，执行 MKCOL 创建 (先尝试无斜杠，再尝试带斜杠)
            let created = false;
            try {
                const mkcolRes = await this.request({
                    method: 'MKCOL',
                    url: dirUrlNoSlash,
                    user,
                    pass
                });
                if (mkcolRes.status === 201 || mkcolRes.status === 200 || mkcolRes.status === 204 || mkcolRes.status === 405) {
                    created = true;
                }
            } catch (err) {
                console.warn(`[WebDavClient] MKCOL (no-slash) 创建目录 ${currentPath} 遇到状态:`, err);
            }

            if (!created) {
                try {
                    const mkcolResSlash = await this.request({
                        method: 'MKCOL',
                        url: dirUrlWithSlash,
                        user,
                        pass
                    });
                    if (mkcolResSlash.status === 201 || mkcolResSlash.status === 200 || mkcolResSlash.status === 204 || mkcolResSlash.status === 405) {
                        created = true;
                    }
                } catch (err) {
                    console.warn(`[WebDavClient] MKCOL (with-slash) 创建目录 ${currentPath} 遇到状态:`, err);
                }
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
     * 上传备份 JSON 数据至 WebDAV (自动确保目录已创建，支持 404/409 自动自愈重试)
     * @param {Object} config - { url, user, pass, path }
     * @param {Object} data - 要备份的完整 JSON 对象
     * @param {string} [filename='miss_player_sync.json'] - 文件名
     */
    static async uploadBackup(config, data, filename = 'miss_player_sync.json') {
        const { url, user, pass, path = '/MissPlayer/' } = config;
        
        // 1. 确保目录结构存在
        await this.ensureDirectory(config);

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

            // 如果遇到 404 / 409 (父目录未完全识别)，强制二次确保目录并重试 PUT
            if (res.status === 404 || res.status === 409) {
                console.warn(`[WebDavClient] PUT 返回 ${res.status}，强制二次创建目录并重试上传...`);
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
