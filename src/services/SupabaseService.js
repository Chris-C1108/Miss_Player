
import { getValue } from '../utils/index.js';
import { md5 } from '../utils/md5.js';
import { logger } from '../utils/logger.js';
import { DebugLogPanel } from '../player/ui/DebugLogPanel.js';

/**
 * SupabaseService - 负责自建评论分析数据库 (Supabase REST API) 的双向交互
 * 包含：自动归一化端点、评论批量防重 UPSERT、时间胶囊回传与多源聚合读取
 */
export class SupabaseService {
    /**
     * 规范化 Supabase REST Base URL
     * 将 https://<ref>.supabase.co 或 https://<ref>.supabase.co/rest/v1/comments 归一化为 https://<ref>.supabase.co/rest/v1
     * @param {string} url
     * @returns {string}
     */
    static normalizeBaseUrl(url) {
        if (!url) return '';
        let clean = url.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http')) clean = 'https://' + clean;
        const match = clean.match(/^(https:\/\/[a-z0-9_-]+\.supabase\.co)/i);
        if (match) {
            return `${match[1]}/rest/v1`;
        }
        return clean;
    }

    /**
     * 获取当前生效的 Supabase 配置
     */
    static getConfig() {
        const endpoint = getValue('betaDbEndpoint', '').trim();
        const apiKey = getValue('betaDbApiKey', '').trim();
        const baseUrl = this.normalizeBaseUrl(endpoint);
        return {
            baseUrl,
            apiKey,
            isEnabled: Boolean(baseUrl && apiKey)
        };
    }

    /**
     * 底层 HTTP 请求封装 (优先 GM_xmlhttpRequest 绕过宿主 CORS)
     */
    static async request(options) {
        const { method = 'GET', url, headers = {}, data = null, timeout = 12000 } = options;
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'function') {
                try {
                    GM_xmlhttpRequest({
                        method,
                        url,
                        headers,
                        data,
                        timeout,
                        onload: (res) => resolve({ status: res.status, data: res.responseText }),
                        onerror: (err) => reject(new Error(err?.statusText || 'Network Error')),
                        ontimeout: () => reject(new Error('Request Timeout'))
                    });
                    return;
                } catch (e) {
                    // 降级为原生 fetch
                }
            }
            fetch(url, { method, headers, body: data })
                .then(async (r) => resolve({ status: r.status, data: await r.text() }))
                .catch(reject);
        });
    }

    /**
     * 从 Supabase 云端拉取指定番号的历史聚合评论
     * @param {string} videoCode
     * @returns {Promise<Array>}
     */
    static async fetchComments(videoCode) {
        const config = this.getConfig();
        if (!config.isEnabled || !videoCode) return [];

        const url = `${config.baseUrl}/comments?avcode=eq.${encodeURIComponent(videoCode.toUpperCase())}&order=created_at.desc&select=*`;
        try {
            const res = await this.request({
                method: 'GET',
                url,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.status >= 200 && res.status < 300) {
                const list = JSON.parse(res.data || '[]');
                if (list.length > 0) {
                    logger.log(`[Supabase] 从云端数据库拉取到 ${list.length} 条评论 (${videoCode})`);
                    DebugLogPanel.addLog(`[Supabase] 命中云端评论库: 获取 ${list.length} 条记录 (${videoCode})`, 'success');
                }
                return list;
            }
            return [];
        } catch (e) {
            logger.debug('[Supabase] 查询云端评论异常:', e.message || e);
            return [];
        }
    }

    /**
     * 将抓取到的评论批量同步上传至 Supabase (按 hash_fingerprint 自动去重 UPSERT)
     * @param {string} videoCode - 番号
     * @param {string} sourceSite - 站点 ('jable' | 'javdb' | 'javlibrary' 等)
     * @param {Array} comments - 抓取的评论数组
     */
    static async uploadComments(videoCode, sourceSite, comments) {
        const config = this.getConfig();
        if (!config.isEnabled || !videoCode || !Array.isArray(comments) || comments.length === 0) return;

        const rows = [];
        for (const c of comments) {
            if (!c) continue;
            const siteId = c.id || (c.user + '_' + (c.time || ''));
            const content = c.rawText || c.text || '';
            if (!content.trim()) continue;
            const fingerprint = md5(`${sourceSite}_${siteId}_${content}`);

            rows.push({
                avcode: videoCode.toUpperCase(),
                source_site: sourceSite,
                site_comment_id: String(siteId),
                user_name: c.user || '匿名',
                user_url: c.userUrl || null,
                content_raw: content,
                score: c.score || null,
                is_spam: Boolean(c.spam && c.spam.label === 'SPAM'),
                spam_reason: c.spam?.reason || null,
                has_timestamps: Boolean(Array.isArray(c.timestamps) && c.timestamps.length > 0),
                hash_fingerprint: fingerprint,
                published_at: c.time || null
            });
        }

        if (rows.length === 0) return;

        const url = `${config.baseUrl}/comments`;
        try {
            const res = await this.request({
                method: 'POST',
                url,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                data: JSON.stringify(rows)
            });

            if (res.status === 201 || res.status === 200 || res.status === 204) {
                logger.log(`[Supabase] 成功同步 ${rows.length} 条 ${sourceSite} 评论至云端数据库 (${videoCode})`);
                DebugLogPanel.addLog(`[Supabase] 写入 ${rows.length} 条评论至云端库 (${videoCode})`, 'success');
            } else {
                logger.warn(`[Supabase] 同步评论遇到状态码 ${res.status}:`, res.data);
            }
        } catch (err) {
            logger.warn('[Supabase] 同步评论异常:', err.message || err);
        }
    }
}
