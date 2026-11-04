/**
 * Peach (桃子) 本地媒体管理系统服务与通信适配器
 * 
 * 职责：
 * 1. Peach 配对信息解析、校验与双写镜像持久化 (Base URL / Bearer Token)
 * 2. 状态嗅探与可用性握手 (验证 Token 有效性与服务存活)
 * 3. 影片在库状态感知 (调用 /api/jav-browser 查询 owned / ingested)
 * 4. 资源同步扫描触发器 (调用 /api/resource-sync/scan 触发物理对账与刮削)
 * 
 * 严格遵循《AGENTS.md》安全与隐私红线：
 * - 凭据严格本地存储，杜绝外部收集与回传；
 * - 纯现代原生 ES 模块化实现。
 */

import { fetchWithTransport } from '../utils/http.js';
import { getValue, setValue } from '../utils/storage.js';

export const PEACH_KEY_BASE = 'mp_peach_base';
export const PEACH_KEY_TOKEN = 'mp_peach_token';
export const PEACH_KEY_STRM_DIR = 'mp_peach_strm_dir';
export const PEACH_KEY_ENABLED = 'mp_peach_enabled';
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
     * 限制仅接受 HTTPS，或针对本地环回地址 (localhost / 127.0.0.1) 允许 HTTP
     */
    static sanitizeBaseUrl(rawUrl) {
        try {
            const parsed = new URL(String(rawUrl).trim());
            const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
            const isValidProtocol = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLoopback);
            
            if (!isValidProtocol) return '';
            if (parsed.username || parsed.password) return '';
            
            return parsed.origin;
        } catch {
            return '';
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

        return {
            base: this.sanitizeBaseUrl(base),
            token: String(token || '').trim(),
            strmDir: String(strmDir || PEACH_DEFAULT_STRM_DIR).trim(),
            enabled: enabled && Boolean(base && token)
        };
    }

    /**
     * 保存 Peach 配置并落盘双写镜像
     */
    static saveConfig({ base, token, strmDir, enabled }) {
        if (typeof base === 'string') {
            setValue(PEACH_KEY_BASE, this.sanitizeBaseUrl(base));
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
     * 发起经过鉴权的 Peach API 请求
     */
    static async request(path, options = {}) {
        const config = this.getConfig();
        if (!config.base || !config.token) {
            throw new Error('Peach 未配置或缺少令牌');
        }

        const url = `${config.base}${path.startsWith('/') ? path : '/' + path}`;
        const headers = {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        const res = await fetchWithTransport(url, {
            method: options.method || 'GET',
            headers,
            body: options.body,
            timeout: options.timeout || 12000
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('Peach 专用令牌无效或权限不足 (401/403)');
        }

        if (res.status >= 500) {
            throw new Error(`Peach 服务端内部异常 (HTTP ${res.status})`);
        }

        try {
            return JSON.parse(res.html);
        } catch (_) {
            return { raw: res.html, status: res.status };
        }
    }

    /**
     * 连通性握手测试
     * 使用 /api/jav-browser 端点发送测试请求，验证连接与 Token 鉴权
     */
    static async testConnection() {
        const config = this.getConfig();
        if (!config.base || !config.token) {
            return { ok: false, message: '请先填写完整地址与专用令牌' };
        }

        try {
            const data = await this.request('/api/jav-browser?code=TEST-001', { timeout: 8000 });
            // 只要返回了结构且不是 401/403，说明鉴权通过且服务正常工作
            if (data && (data.ok === true || typeof data.state === 'string' || data.detail)) {
                return { ok: true, message: '连接成功，专用令牌已通过验证' };
            }
            return { ok: true, message: '连接成功' };
        } catch (err) {
            return { ok: false, message: err.message || '无法连接到 Peach 服务端' };
        }
    }

    /**
     * 查询指定番号在 Peach 馆藏中的状态
     * @param {string} avcode - 视频番号
     * @returns {Promise<{ inLibrary: boolean, state: string, raw: Object }>}
     */
    static async checkCodeStatus(avcode) {
        if (!avcode) return { inLibrary: false, state: 'unknown', raw: null };
        try {
            const data = await this.request(`/api/jav-browser?code=${encodeURIComponent(avcode)}`, { timeout: 6000 });
            if (data && data.ok === true) {
                const inLibrary = data.state === 'owned' || data.state === 'ingested';
                return { inLibrary, state: data.state, raw: data };
            }
            return { inLibrary: false, state: data?.state || 'idle', raw: data };
        } catch (err) {
            console.warn('[PeachService] 查询番号状态失败:', err.message);
            return { inLibrary: false, state: 'error', error: err.message };
        }
    }

    /**
     * 触发 Peach 媒体资源扫描与刮削对账
     * 对应官方 /api/resource-sync/scan 端点
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
