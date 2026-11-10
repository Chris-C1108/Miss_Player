/**
 * Peach (桃子) 本地媒体管理系统服务与通信适配器
 * 
 * 职责：
 * 1. Peach 配对信息解析、校验与双写镜像持久化 (Base URL / Bearer Token)
 * 2. 多 Origin 智能地址池 (兼顾公网映射域名、局域网 IP、mDNS、localhost 等多入口)
 * 3. 故障自愈请求 (Failover): 遇到网络超时或不可达时，自动尝试地址池中的备选通道并平滑接替
 * 4. 访问 Peach Web 时的零输入自动配对 (同源会话自动签发并落盘)
 * 5. 影片在库状态感知与资源扫描对账触发器
 */

import { fetchWithTransport } from '../utils/http.js';
import { getValue, setValue } from '../utils/storage.js';
import { SyncManager } from '../sync/SyncManager.js';
import { cleanAvCode } from '../utils/videoCode.js';

export const PEACH_KEY_BASE = 'mp_peach_base';
export const PEACH_KEY_ORIGINS = 'mp_peach_origins';
export const PEACH_KEY_TOKEN = 'mp_peach_token';
export const PEACH_KEY_STRM_DIR = 'mp_peach_strm_dir';
export const PEACH_KEY_REMOTE_SCRAPER = 'mp_peach_remote_scraper';
export const PEACH_KEY_GATEWAY_BASE = 'mp_peach_gateway_base';
export const PEACH_KEY_GATEWAY_TOKEN = 'mp_peach_gateway_token';
export const PEACH_KEY_ENABLED = 'mp_peach_enabled';
export const PEACH_KEY_DISMISSED_LIB_ADVICE = 'mp_peach_dismissed_lib_advice';
export const PEACH_DEFAULT_STRM_DIR = '/Media/STRM/';

export const PEACH_KEY_WEBDAV_MODE = 'mp_peach_webdav_mode';
export const PEACH_KEY_WEBDAV_CUSTOM_DIR = 'mp_peach_webdav_custom_dir';
export const PEACH_KEY_WEBDAV_STANDALONE_URL = 'mp_peach_webdav_standalone_url';
export const PEACH_KEY_WEBDAV_STANDALONE_USER = 'mp_peach_webdav_standalone_user';
export const PEACH_KEY_WEBDAV_STANDALONE_PASS = 'mp_peach_webdav_standalone_pass';
export const PEACH_KEY_WEBDAV_STANDALONE_DIR = 'mp_peach_webdav_standalone_dir';

export const PEACH_WEBDAV_MODE_SYNC_DEFAULT = 'sync_default'; // 模式 A: 复用同步 + 默认 /MissPlayer/peach-media/
export const PEACH_WEBDAV_MODE_SYNC_CUSTOM = 'sync_custom';   // 模式 B: 复用同步 + 自定义目录
export const PEACH_WEBDAV_MODE_STANDALONE = 'standalone';     // 模式 C: 独立 WebDAV 配置

export class PeachService {
    /**
     * 解析 Peach 官方配对 JSON 或 URL
     * 格式: {"peach_pairing": 1, "base": "https://peach.example.com", "token": "..."}
     * @param {string} text - 用户输入的配对文本
     * @returns {{ base: string, token: string } | null}
     */
    static parsePairingText(text) {
        if (!text || typeof text !== 'string') return null;
        const trimmed = text.trim();
        
        // 尝试作为官方配对 JSON 解析
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const data = JSON.parse(trimmed);
                if (data.peach_pairing === 1 && typeof data.base === 'string' && typeof data.token === 'string') {
                    const cleanBase = this.sanitizeBaseUrl(data.base);
                    const cleanToken = data.token.trim();
                    if (cleanBase && cleanToken && cleanToken.length <= 256) {
                        return { base: cleanBase, token: cleanToken };
                    }
                }
            } catch (_) {}
        }

        // 容错：直接输入 Base URL
        const cleanBase = this.sanitizeBaseUrl(trimmed);
        if (cleanBase) {
            return { base: cleanBase, token: '' };
        }

        return null;
    }

    /**
     * 规范化与清洗 Peach 服务端 Origin
     * 接受 HTTPS，或针对本地/局域网/Tailscale/私有 IP 允许 HTTP
     */
    static sanitizeBaseUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        try {
            const parsed = new URL(String(rawUrl).trim());
            const hostname = parsed.hostname.toLowerCase();
            const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
            const isLanOrPrivate = isLoopback || 
                /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
                /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
                /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
                hostname.endsWith('.local') ||
                hostname.endsWith('.lan') ||
                hostname.endsWith('.ts.net'); // Tailscale 专属域名

            const isValidProtocol = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLanOrPrivate);
            if (!isValidProtocol) return '';
            if (parsed.username || parsed.password) return '';
            
            return parsed.origin;
        } catch {
            return '';
        }
    }

    /**
     * 获取所有候选 Origin 地址池 (自动去重并剔除无效值)
     * @returns {string[]}
     */
    static getOrigins() {
        let pool = [];
        try {
            const raw = getValue(PEACH_KEY_ORIGINS, '[]');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                pool = parsed.map(u => this.sanitizeBaseUrl(u)).filter(Boolean);
            }
        } catch (_) {}

        const activeBase = this.sanitizeBaseUrl(getValue(PEACH_KEY_BASE, ''));
        if (activeBase && !pool.includes(activeBase)) {
            pool.unshift(activeBase);
        }

        return Array.from(new Set(pool));
    }

    /**
     * 将新发现的 Origin 注入地址池（置顶），最多保留 8 个健康记录
     * @param {string} rawUrl 
     */
    static addOrigin(rawUrl) {
        const clean = this.sanitizeBaseUrl(rawUrl);
        if (!clean) return;

        const currentPool = this.getOrigins().filter(u => u !== clean);
        currentPool.unshift(clean);
        const limited = currentPool.slice(0, 8);
        setValue(PEACH_KEY_ORIGINS, JSON.stringify(limited));
    }

    /**
     * 切换当前首选活跃地址 (Active Base)
     * @param {string} rawUrl 
     */
    static setActiveBase(rawUrl) {
        const clean = this.sanitizeBaseUrl(rawUrl);
        if (clean) {
            setValue(PEACH_KEY_BASE, clean);
            this.addOrigin(clean);
        }
    }

    /**
     * 清空当前所有 Peach 记录的地址和 Token
     */
    static clearBase() {
        setValue(PEACH_KEY_BASE, '');
        setValue(PEACH_KEY_ORIGINS, '[]');
        setValue(PEACH_KEY_TOKEN, '');
    }

    /**
     * 删除指定的 Origin（若同时为 activeBase 则清空或切换至下一个候选）
     * @param {string} rawUrl 
     */
    static removeOrigin(rawUrl) {
        const clean = this.sanitizeBaseUrl(rawUrl);
        if (!clean) return;
        const origins = this.getOrigins().filter(u => u !== clean);
        setValue(PEACH_KEY_ORIGINS, JSON.stringify(origins));
        const activeBase = getValue(PEACH_KEY_BASE, '');
        if (activeBase === clean) {
            setValue(PEACH_KEY_BASE, origins[0] || '');
        }
    }

    /**
     * 获取当前保存的 Peach 配置
     */
    static getConfig() {
        const base = getValue(PEACH_KEY_BASE, '');
        const token = getValue(PEACH_KEY_TOKEN, '');
        const strmDir = getValue(PEACH_KEY_STRM_DIR, PEACH_DEFAULT_STRM_DIR);
        const remoteScraper = getValue(PEACH_KEY_REMOTE_SCRAPER, '');
        const gatewayBase = getValue(PEACH_KEY_GATEWAY_BASE, '') || remoteScraper || '';
        const gatewayToken = getValue(PEACH_KEY_GATEWAY_TOKEN, 'dev');
        const enabled = Boolean(getValue(PEACH_KEY_ENABLED, false));
        const origins = this.getOrigins();

        const webdavMode = getValue(PEACH_KEY_WEBDAV_MODE, PEACH_WEBDAV_MODE_SYNC_DEFAULT);
        const webdavCustomDir = getValue(PEACH_KEY_WEBDAV_CUSTOM_DIR, '') || strmDir || '/Media/STRM/';
        const webdavStandaloneUrl = getValue(PEACH_KEY_WEBDAV_STANDALONE_URL, '');
        const webdavStandaloneUser = getValue(PEACH_KEY_WEBDAV_STANDALONE_USER, '');
        const webdavStandalonePass = getValue(PEACH_KEY_WEBDAV_STANDALONE_PASS, '');
        const webdavStandaloneDir = getValue(PEACH_KEY_WEBDAV_STANDALONE_DIR, '/Media/STRM/');

        return {
            base: this.sanitizeBaseUrl(base) || (origins[0] || ''),
            origins,
            token: String(token || '').trim(),
            strmDir: String(strmDir || PEACH_DEFAULT_STRM_DIR).trim(),
            remoteScraper: String(remoteScraper || '').trim(),
            gatewayBase: String(gatewayBase || '').trim(),
            gatewayToken: String(gatewayToken || 'dev').trim(),
            enabled: enabled && Boolean(base || origins.length > 0),
            webdavMode,
            webdavCustomDir,
            webdavStandaloneUrl,
            webdavStandaloneUser,
            webdavStandalonePass,
            webdavStandaloneDir
        };
    }

    /**
     * 保存 Peach 配置并落盘双写镜像
     */
    static saveConfig({
        base,
        token,
        strmDir,
        remoteScraper,
        gatewayBase,
        gatewayToken,
        enabled,
        webdavMode,
        webdavCustomDir,
        webdavStandaloneUrl,
        webdavStandaloneUser,
        webdavStandalonePass,
        webdavStandaloneDir
    }) {
        if (typeof base === 'string') {
            const clean = this.sanitizeBaseUrl(base);
            setValue(PEACH_KEY_BASE, clean);
            if (clean) {
                this.addOrigin(clean);
            }
        }
        if (typeof token === 'string') {
            setValue(PEACH_KEY_TOKEN, token.trim());
        }
        if (typeof remoteScraper === 'string') {
            setValue(PEACH_KEY_REMOTE_SCRAPER, remoteScraper.trim());
        }
        if (typeof gatewayBase === 'string') {
            setValue(PEACH_KEY_GATEWAY_BASE, gatewayBase.trim());
        }
        if (typeof gatewayToken === 'string') {
            setValue(PEACH_KEY_GATEWAY_TOKEN, gatewayToken.trim());
        }
        if (typeof strmDir === 'string') {
            let normalized = strmDir.trim();
            if (!normalized.startsWith('/')) normalized = '/' + normalized;
            if (!normalized.endsWith('/')) normalized = normalized + '/';
            setValue(PEACH_KEY_STRM_DIR, normalized);
        }
        if (typeof webdavMode === 'string') {
            setValue(PEACH_KEY_WEBDAV_MODE, webdavMode);
        }
        if (typeof webdavCustomDir === 'string') {
            let normalized = webdavCustomDir.trim();
            if (normalized && !normalized.startsWith('/')) normalized = '/' + normalized;
            if (normalized && !normalized.endsWith('/')) normalized = normalized + '/';
            setValue(PEACH_KEY_WEBDAV_CUSTOM_DIR, normalized);
        }
        if (typeof webdavStandaloneUrl === 'string') {
            setValue(PEACH_KEY_WEBDAV_STANDALONE_URL, webdavStandaloneUrl.trim());
        }
        if (typeof webdavStandaloneUser === 'string') {
            setValue(PEACH_KEY_WEBDAV_STANDALONE_USER, webdavStandaloneUser.trim());
        }
        if (typeof webdavStandalonePass === 'string') {
            setValue(PEACH_KEY_WEBDAV_STANDALONE_PASS, webdavStandalonePass);
        }
        if (typeof webdavStandaloneDir === 'string') {
            let normalized = webdavStandaloneDir.trim();
            if (normalized && !normalized.startsWith('/')) normalized = '/' + normalized;
            if (normalized && !normalized.endsWith('/')) normalized = normalized + '/';
            setValue(PEACH_KEY_WEBDAV_STANDALONE_DIR, normalized);
        }
        if (typeof enabled === 'boolean') {
            setValue(PEACH_KEY_ENABLED, enabled);
        }
    }

    /**
     * 构建符合流网关契约的永久稳定播放地址
     * 格式: {gatewayBase}/v1/{token}/play/{AVCODE}.m3u8
     */
    static buildGatewayPlayUrl(avcode) {
        if (!avcode) return '';
        const config = this.getConfig();
        let base = config.gatewayBase || config.remoteScraper || '';
        if (!base) return '';

        base = base.replace(/\/api\/resolve\/?.*$/, '').replace(/\/+$/, '');
        const token = config.gatewayToken || 'dev';
        const cleanCode = (cleanAvCode(avcode) || avcode).toUpperCase().trim();

        return `${base}/v1/${token}/play/${cleanCode}.m3u8`;
    }

    /**
     * 计算当前生效的 WebDAV 入库存储配置与目标目录 (三种模式)
     */
    static getEffectiveWebDavConfig() {
        const peachConfig = this.getConfig();
        const syncWebDav = SyncManager.getWebDavConfig();
        const hasSync = Boolean(syncWebDav && syncWebDav.url && syncWebDav.user);

        let mode = peachConfig.webdavMode || PEACH_WEBDAV_MODE_SYNC_DEFAULT;
        if (!hasSync && mode !== PEACH_WEBDAV_MODE_STANDALONE) {
            mode = PEACH_WEBDAV_MODE_STANDALONE;
        }

        if (mode === PEACH_WEBDAV_MODE_SYNC_DEFAULT && hasSync) {
            const basePath = syncWebDav.path || '/MissPlayer/';
            const normBase = basePath.endsWith('/') ? basePath : basePath + '/';
            return {
                mode: PEACH_WEBDAV_MODE_SYNC_DEFAULT,
                config: syncWebDav,
                targetDir: normBase + 'peach-media/'
            };
        } else if (mode === PEACH_WEBDAV_MODE_SYNC_CUSTOM && hasSync) {
            let customDir = peachConfig.webdavCustomDir || peachConfig.strmDir || '/Media/STRM/';
            if (!customDir.startsWith('/')) customDir = '/' + customDir;
            if (!customDir.endsWith('/')) customDir = customDir + '/';
            return {
                mode: PEACH_WEBDAV_MODE_SYNC_CUSTOM,
                config: syncWebDav,
                targetDir: customDir
            };
        } else {
            let standaloneDir = peachConfig.webdavStandaloneDir || '/Media/STRM/';
            if (!standaloneDir.startsWith('/')) standaloneDir = '/' + standaloneDir;
            if (!standaloneDir.endsWith('/')) standaloneDir = standaloneDir + '/';
            return {
                mode: PEACH_WEBDAV_MODE_STANDALONE,
                config: {
                    url: peachConfig.webdavStandaloneUrl,
                    user: peachConfig.webdavStandaloneUser,
                    pass: peachConfig.webdavStandalonePass,
                    path: standaloneDir
                },
                targetDir: standaloneDir
            };
        }
    }

    /**
     * 测试流网关服务连通性与播放端点就绪状态
     */
    static async testGatewayConnection(customBase = '', customToken = '') {
        const config = this.getConfig();
        let base = customBase || config.gatewayBase || config.remoteScraper || '';
        if (!base) {
            return { ok: false, error: '未配置流网关地址' };
        }

        base = base.replace(/\/api\/resolve\/?.*$/, '').replace(/\/+$/, '');
        const token = customToken || config.gatewayToken || 'dev';

        // 1. 测试 /health
        const healthUrl = `${base}/health`;
        let healthOk = false;
        try {
            const hRes = await fetchWithTransport(healthUrl, { timeout: 4000 });
            if (hRes.status >= 200 && hRes.status < 400) {
                healthOk = true;
            }
        } catch (_) {}

        // 2. 测试样本 /play/STARS-256.m3u8
        const playUrl = `${base}/v1/${token}/play/STARS-256.m3u8`;
        const t0 = performance.now();
        try {
            const pRes = await fetchWithTransport(playUrl, { timeout: 8000 });
            const elapsed = Math.round(performance.now() - t0);

            if (pRes.status >= 200 && pRes.status < 400 && pRes.html && pRes.html.includes('#EXTM3U')) {
                return {
                    ok: true,
                    elapsed,
                    message: `流网关运行正常！HLS 清单就绪 (耗时: ${elapsed}ms)`
                };
            }

            if (healthOk) {
                return {
                    ok: true,
                    elapsed,
                    message: `网关服务在线 (Health OK)，测试样本已响应`
                };
            }

            return {
                ok: false,
                error: `连接异常 (HTTP ${pRes.status}): 请检查地址与 Token`
            };
        } catch (err) {
            if (healthOk) {
                return {
                    ok: true,
                    message: `网关服务在线，但测试样本暂未返回清单: ${err.message}`
                };
            }
            return { ok: false, error: `网络连接失败: ${err.message}` };
        }
    }

    /**
     * 批量导入 Peach 服务端上报的网络拓扑入口 (local_url / lan_url / ip_url)
     */
    static syncNetworkAddresses(networkPayload) {
        if (!networkPayload || typeof networkPayload !== 'object') return;
        const candidates = [
            networkPayload.local_url,
            networkPayload.lan_url,
            networkPayload.ip_url
        ];

        for (const candidate of candidates) {
            if (candidate && typeof candidate === 'string') {
                this.addOrigin(candidate);
            }
        }
    }

    /**
     * 发起经过鉴权的 Peach API 请求（支持多 Origin 智能顺位重试与故障自愈）
     */
    static async request(path, options = {}) {
        const config = this.getConfig();
        const candidateOrigins = Array.from(new Set([config.base, ...config.origins])).filter(Boolean);
        if (candidateOrigins.length === 0) {
            throw new Error('Peach 候选地址池为空');
        }

        const relativePath = path.startsWith('/') ? path : '/' + path;
        let lastError = null;

        // 依次尝试候选地址（优先活跃地址，故障时自动转移）
        for (let i = 0; i < candidateOrigins.length; i++) {
            const origin = candidateOrigins[i];
            const url = `${origin}${relativePath}`;
            const headers = {
                'Accept': 'application/json',
                ...(options.headers || {})
            };

            if (config.token) {
                headers['Authorization'] = `Bearer ${config.token}`;
            }

            if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(options.body);
            }

            try {
                const res = await fetchWithTransport(url, {
                    method: options.method || 'GET',
                    headers,
                    body: options.body,
                    timeout: options.timeout || (i === 0 ? 6000 : 4000) // 首选给 6s，备选给 4s 快速探测
                });

                if (res.status === 401 || res.status === 403) {
                    throw new Error('Peach 专用令牌无效或权限不足 (401/403)');
                }

                if (res.status >= 500) {
                    throw new Error(`Peach 服务端内部异常 (HTTP ${res.status})`);
                }

                // 若非首选地址成功响应，说明网络拓扑已切换，自动将该地址提升为当前活跃地址
                if (origin !== config.base) {
                    console.log(`[PeachService] 网络已自动平滑自愈，切换首选地址: ${origin}`);
                    this.setActiveBase(origin);
                }

                try {
                    return JSON.parse(res.html);
                } catch (_) {
                    return { raw: res.html, status: res.status };
                }
            } catch (err) {
                lastError = err;
                // 若明确是 401/403 令牌失效，不需要盲目换地址重试
                if (err.message && err.message.includes('401/403')) {
                    throw err;
                }
                console.warn(`[PeachService] 请求地址 [${origin}] 失败，尝试备用候选...`, err.message);
            }
        }

        throw lastError || new Error('所有 Peach 候选通道均不可达');
    }

    /**
     * 判断当前是否已配置并持有有效的专用令牌 (Dedicated Token)
     */
    static hasDedicatedToken() {
        const config = this.getConfig();
        return Boolean(config.token && config.token.length > 0);
    }

    /**
     * 同源会话 API 无感自动获取与签发专用令牌 (Phase 19.12)
     * 在 Peach Web 同源上下文或局域网免密模式下，直接与 /api/configuration/jav-browser 协商签发 Dedicated Token
     * 
     * @param {string} [customOrigin] - 目标 Origin (默认取 window.location.origin 或已配置 base)
     * @returns {Promise<{ ok: boolean, token?: string, status?: 'full' | 'strm_only' | 'error', provider?: string, message: string }>}
     */
    static async acquireDedicatedToken(customOrigin = '') {
        const targetOrigin = this.sanitizeBaseUrl(customOrigin) ||
            (typeof window !== 'undefined' && window.location ? this.sanitizeBaseUrl(window.location.origin) : '') ||
            this.getConfig().base;

        if (!targetOrigin) {
            return { ok: false, status: 'error', message: '未指定有效的 Peach 服务端地址' };
        }

        const configUrl = `${targetOrigin}/api/configuration/jav-browser`;

        try {
            // 1. 发起 GET 获取当前渠道配置与令牌启用状态
            const getRes = await fetchWithTransport(configUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Sec-Fetch-Site': 'same-origin'
                },
                timeout: 6000
            });

            if (getRes.status === 401 || getRes.status === 403) {
                return {
                    ok: false,
                    status: 'error',
                    message: `Peach 鉴权受阻 (HTTP ${getRes.status}): 请在当前浏览器中登录 Peach Web`
                };
            }

            if (getRes.status < 200 || getRes.status >= 300) {
                return {
                    ok: false,
                    status: 'error',
                    message: `获取 Peach 设置失败 (HTTP ${getRes.status})`
                };
            }

            let initialData = {};
            try {
                initialData = JSON.parse(getRes.html);
            } catch (_) {
                return { ok: false, status: 'error', message: 'Peach 返回设置数据格式异常' };
            }

            // 2. 智能协商最佳下载渠道 (优先满足 configured && target 的可用渠道)
            const providers = Array.isArray(initialData.providers) ? initialData.providers : [];
            const readyProvider = providers.find(p => p.configured && p.target)?.key ||
                (providers.some(p => p.key === initialData.active_provider) ? initialData.active_provider : '') ||
                (providers.some(p => p.key === initialData.provider) ? initialData.provider : '') ||
                providers[0]?.key || '';

            // 若尚未在 Peach 下载渠道配置网盘，Peach 后端会拒绝生成 Token
            if (!readyProvider) {
                // 降级为 STRM 虚拟入库模式，依然纳管 Base 地址
                this.saveConfig({
                    base: targetOrigin,
                    enabled: true
                });
                return {
                    ok: false,
                    status: 'strm_only',
                    message: 'Peach 媒体库未配置网盘账号，STRM 虚拟入库已就绪（配置网盘后可自动启用在库感知）'
                };
            }

            // 3. 发起 POST 请求自动签发专属 Dedicated Token
            const action = initialData.enabled ? 'rotate' : 'enable';
            const postRes = await fetchWithTransport(configUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Sec-Fetch-Site': 'same-origin'
                },
                body: JSON.stringify({
                    action,
                    provider: readyProvider
                }),
                timeout: 8000
            });

            if (postRes.status >= 200 && postRes.status < 300) {
                try {
                    const postData = JSON.parse(postRes.html);
                    if (postData && postData.token) {
                        this.saveConfig({
                            base: targetOrigin,
                            token: postData.token,
                            enabled: true
                        });
                        return {
                            ok: true,
                            status: 'full',
                            token: postData.token,
                            provider: readyProvider,
                            message: 'Peach 专用令牌自动签发成功！全功能已就绪'
                        };
                    }
                } catch (_) {}
            }

            // 若 POST 遇到后端校验报错，安全降级
            this.saveConfig({
                base: targetOrigin,
                enabled: true
            });
            return {
                ok: false,
                status: 'strm_only',
                message: '已连接 Peach 服务端（STRM 虚拟入库就绪，专用令牌暂未签发）'
            };
        } catch (err) {
            return {
                ok: false,
                status: 'error',
                message: `自动签发请求失败: ${err.message}`
            };
        }
    }

    /**
     * 连通性握手测试
     */
    static async testConnection() {
        const config = this.getConfig();
        const candidateOrigins = Array.from(new Set([config.base, ...config.origins])).filter(Boolean);
        if (candidateOrigins.length === 0) {
            return { ok: false, status: 'error', message: '请先填写 Peach 服务端地址' };
        }

        // 1. 首先探测通用健康检查端点 /healthz (所有 Peach 实例均支持，无任何鉴权门槛)
        let healthOk = false;
        let activeUrl = '';
        for (const origin of candidateOrigins) {
            try {
                const res = await fetchWithTransport(`${origin}/healthz`, { timeout: 4000 });
                if (res.status >= 200 && res.status < 400) {
                    healthOk = true;
                    activeUrl = origin;
                    this.setActiveBase(origin);
                    break;
                }
            } catch (_) {}
        }

        if (!healthOk) {
            return { ok: false, status: 'error', message: '无法连接到 Peach 服务端，请检查 IP、端口或网络连通性' };
        }

        // 2. 若配置了专用令牌，进一步校验番号状态查询能力 (全功能鉴权)
        if (config.token) {
            try {
                const data = await this.request('/api/jav-browser?code=TEST-001', { timeout: 5000 });
                if (data && (data.ok === true || typeof data.state === 'string' || data.detail)) {
                    return { ok: true, status: 'full', message: `连接成功 (全功能就绪: ${activeUrl})`, activeUrl };
                }
            } catch (err) {
                return {
                    ok: true,
                    status: 'strm_only',
                    message: `Peach 服务端在线 (STRM 就绪，专用令牌未生效: ${err.message})`,
                    activeUrl
                };
            }
        }

        return {
            ok: true,
            status: 'strm_only',
            message: `连接成功！Peach 服务端在线就绪 (仅 STRM 模式: ${activeUrl})`,
            activeUrl
        };
    }

    /**
     * 查询指定番号在 Peach 馆藏中的状态
     */
    static async checkCodeStatus(avcode) {
        if (!avcode) return { inLibrary: false, state: 'unknown', raw: null };
        const config = this.getConfig();
        if (!config.token) {
            // 没有令牌时静默跳过状态查询，不影响 STRM 虚拟入库
            return { inLibrary: false, state: 'no_token', raw: null };
        }
        try {
            const data = await this.request(`/api/jav-browser?code=${encodeURIComponent(avcode)}`, { timeout: 5000 });
            if (data && data.ok === true) {
                const inLibrary = data.state === 'owned' || data.state === 'ingested';
                return { inLibrary, state: data.state, raw: data };
            }
            return { inLibrary: false, state: data?.state || 'idle', raw: data };
        } catch (err) {
            return { inLibrary: false, state: 'error', error: err.message };
        }
    }

    /**
     * 触发 Peach 媒体资源扫描与刮削对账
     */
    static async triggerScan() {
        try {
            const res = await this.request('/api/resource-sync/scan', { method: 'POST', timeout: 15000 });
            return { ok: true, data: res };
        } catch (err) {
            console.warn('[PeachService] 触发资源扫描失败:', err.message);
            return { ok: false, error: err.message };
        }
    }
}
