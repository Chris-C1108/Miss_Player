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

export const PEACH_KEY_BASE = 'mp_peach_base';
export const PEACH_KEY_ORIGINS = 'mp_peach_origins';
export const PEACH_KEY_TOKEN = 'mp_peach_token';
export const PEACH_KEY_STRM_DIR = 'mp_peach_strm_dir';
export const PEACH_KEY_ENABLED = 'mp_peach_enabled';
export const PEACH_KEY_DISMISSED_LIB_ADVICE = 'mp_peach_dismissed_lib_advice';
export const PEACH_DEFAULT_STRM_DIR = '/Media/STRM/';

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
     * 获取当前保存的 Peach 配置
     */
    static getConfig() {
        const base = getValue(PEACH_KEY_BASE, '');
        const token = getValue(PEACH_KEY_TOKEN, '');
        const strmDir = getValue(PEACH_KEY_STRM_DIR, PEACH_DEFAULT_STRM_DIR);
        const enabled = Boolean(getValue(PEACH_KEY_ENABLED, false));
        const origins = this.getOrigins();

        return {
            base: this.sanitizeBaseUrl(base) || (origins[0] || ''),
            origins,
            token: String(token || '').trim(),
            strmDir: String(strmDir || PEACH_DEFAULT_STRM_DIR).trim(),
            enabled: enabled && Boolean(token && (base || origins.length > 0))
        };
    }

    /**
     * 保存 Peach 配置并落盘双写镜像
     */
    static saveConfig({ base, token, strmDir, enabled }) {
        if (typeof base === 'string') {
            const clean = this.sanitizeBaseUrl(base);
            if (clean) {
                setValue(PEACH_KEY_BASE, clean);
                this.addOrigin(clean);
            }
        }
        if (typeof token === 'string') {
            setValue(PEACH_KEY_TOKEN, token.trim());
        }
        if (typeof strmDir === 'string') {
            let normalized = strmDir.trim();
            if (!normalized.startsWith('/')) normalized = '/' + normalized;
            if (!normalized.endsWith('/')) normalized = normalized + '/';
            setValue(PEACH_KEY_STRM_DIR, normalized);
        }
        if (typeof enabled === 'boolean') {
            setValue(PEACH_KEY_ENABLED, enabled);
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
        if (!config.token) {
            throw new Error('Peach 未配置专用令牌');
        }

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
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/json',
                ...(options.headers || {})
            };

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
     * 连通性握手测试
     */
    static async testConnection() {
        const config = this.getConfig();
        if (!config.token || (!config.base && config.origins.length === 0)) {
            return { ok: false, message: '请先填写完整地址与专用令牌' };
        }

        try {
            const data = await this.request('/api/jav-browser?code=TEST-001', { timeout: 6000 });
            if (data && (data.ok === true || typeof data.state === 'string' || data.detail)) {
                return { ok: true, message: `连接成功 (当前通道: ${this.getConfig().base})` };
            }
            return { ok: true, message: '连接成功' };
        } catch (err) {
            return { ok: false, message: err.message || '无法连接到 Peach 服务端' };
        }
    }

    /**
     * 查询指定番号在 Peach 馆藏中的状态
     */
    static async checkCodeStatus(avcode) {
        if (!avcode) return { inLibrary: false, state: 'unknown', raw: null };
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
