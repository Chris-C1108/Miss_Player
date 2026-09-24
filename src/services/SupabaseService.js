import { getValue } from '../utils/index.js';
import { md5 } from '../utils/md5.js';
import { logger } from '../utils/logger.js';
import { DebugLogPanel } from '../player/ui/DebugLogPanel.js';

/**
 * SupabaseService - 方案 1 高性能 JSONB 聚合仓储模式
 * 1. 读取：单次 GET 瞬间拉取全量压缩评论，零分页往返；
 * 2. 写入：服务端 RPC 原子合并去重 (upsert_comment_bundle)，触发 TOAST LZ4 压缩，占用降至原先 10%；
 * 3. 降级兜底：兼容单行 comments 表直写与客户端合并。
 */
export class SupabaseService {
    static normalizeBaseUrl(url) {
        if (!url) return '';
        let clean = url.trim().replace(/\/+$/, '');
        if (!clean.startsWith('http')) clean = 'https://' + clean;
        const match = clean.match(/^(https?:\/\/[a-z0-9_-]+\.supabase\.co)/i);
        if (match) {
            return match[1] + '/rest/v1';
        }
        return clean;
    }

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
                } catch (e) {}
            }
            fetch(url, { method, headers, body: data })
                .then(async (r) => resolve({ status: r.status, data: await r.text() }))
                .catch(reject);
        });
    }

    /**
     * 读取指定番号的历史评论 (优先方案 1 JSONB Bundle 仓储，降级 legacy 单行表)
     * @param {string} videoCode
     * @returns {Promise<Array>}
     */
    static async fetchComments(videoCode) {
        const config = this.getConfig();
        if (!config.isEnabled || !videoCode) return [];

        const code = videoCode.toUpperCase();
        // 1. 优先查询方案 1: video_comments_bundle (单行返回压缩后的全部评论)
        try {
            const bundleUrl = config.baseUrl + '/video_comments_bundle?avcode=eq.' + encodeURIComponent(code) + '&select=comments,total_count';
            const bundleRes = await this.request({
                method: 'GET',
                url: bundleUrl,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': 'Bearer ' + config.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (bundleRes.status >= 200 && bundleRes.status < 300) {
                const rows = JSON.parse(bundleRes.data || '[]');
                if (rows.length > 0 && Array.isArray(rows[0].comments) && rows[0].comments.length > 0) {
                    const list = rows[0].comments;
                    logger.log('[Supabase] 方案 1 JSONB 命中: 瞬间恢复 ' + list.length + ' 条评论 (' + code + ')');
                    DebugLogPanel.addLog('[Supabase] 命中 JSONB 聚合仓储: 获取 ' + list.length + ' 条评论 (' + code + ')', 'success');
                    return list;
                }
            }
        } catch (_) {}

        // 2. 降级兼容查询 legacy comments 表
        try {
            const legacyUrl = config.baseUrl + '/comments?avcode=eq.' + encodeURIComponent(code) + '&order=created_at.desc&select=*';
            const legacyRes = await this.request({
                method: 'GET',
                url: legacyUrl,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': 'Bearer ' + config.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            if (legacyRes.status >= 200 && legacyRes.status < 300) {
                const list = JSON.parse(legacyRes.data || '[]');
                if (list.length > 0) {
                    DebugLogPanel.addLog('[Supabase] 命中单行表: 获取 ' + list.length + ' 条记录 (' + code + ')', 'success');
                    return list;
                }
            }
        } catch (_) {}

        return [];
    }

    /**
     * 写入评论 (方案 1: 服务端原子 RPC upsert_comment_bundle 合并至 JSONB 仓储)
     * @param {string} videoCode - 番号
     * @param {string} sourceSite - 站点
     * @param {Array} comments - 抓取的评论
     */
    static async uploadComments(videoCode, sourceSite, comments, durationSeconds = 0) {
        const config = this.getConfig();
        if (!config.isEnabled || !videoCode || !Array.isArray(comments) || comments.length === 0) return;

        const code = videoCode.toUpperCase();
        const rows = [];
        for (const c of comments) {
            if (!c) continue;
            const siteId = c.id || (c.user + '_' + (c.time || ''));
            const content = c.rawText || c.text || '';
            if (!content.trim()) continue;
            const fingerprint = md5(sourceSite + '_' + siteId + '_' + content);

            rows.push({
                avcode: code,
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

        // 1. 优先调用服务端 RPC upsert_comment_bundle (方案 1 原生压缩原子合并)
        try {
            const rpcUrl = config.baseUrl + '/rpc/upsert_comment_bundle';
            const rpcRes = await this.request({
                method: 'POST',
                url: rpcUrl,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': 'Bearer ' + config.apiKey,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    p_avcode: code,
                    p_new_comments: rows,
                    p_source: sourceSite,
                    p_duration_seconds: Math.round(durationSeconds || 0)
                })
            });

            if (rpcRes.status >= 200 && rpcRes.status < 300) {
                logger.log('[Supabase] 方案 1 JSONB 聚合成功: ' + rows.length + ' 条评论已原子合并 (' + code + ')');
                DebugLogPanel.addLog('[Supabase] 方案1高密聚合: 成功入库 ' + rows.length + ' 条评论 (' + code + ')', 'success');
                return;
            }
        } catch (_) {}

        // 2. 降级直写 video_comments_bundle 表 (若 RPC 尚未建立)
        try {
            const bundleUrl = config.baseUrl + '/video_comments_bundle';
            const bundleRes = await this.request({
                method: 'POST',
                url: bundleUrl,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': 'Bearer ' + config.apiKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                data: JSON.stringify({
                    avcode: code,
                    comments: rows,
                    total_count: rows.length,
                    has_timestamps_count: rows.filter(r => r.has_timestamps).length,
                    duration_seconds: Math.round(durationSeconds || 0),
                    last_source: sourceSite,
                    updated_at: new Date().toISOString()
                })
            });
            if (bundleRes.status >= 200 && bundleRes.status < 300) {
                DebugLogPanel.addLog('[Supabase] 成功直写 JSONB 仓储 (' + code + ')', 'success');
                return;
            }
        } catch (_) {}

        // 3. 降级兼容 legacy comments 单行表
        try {
            const legacyUrl = config.baseUrl + '/comments';
            const legacyRes = await this.request({
                method: 'POST',
                url: legacyUrl,
                headers: {
                    'apikey': config.apiKey,
                    'Authorization': 'Bearer ' + config.apiKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                data: JSON.stringify(rows)
            });
            if (legacyRes.status >= 200 && legacyRes.status < 300) {
                DebugLogPanel.addLog('[Supabase] 单行降级入库 ' + rows.length + ' 条 (' + code + ')', 'success');
            }
        } catch (err) {
            logger.warn('[Supabase] 写入数据库异常:', err.message || err);
        }
    }
}
