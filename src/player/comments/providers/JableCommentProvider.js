import { BaseCommentProvider } from './BaseCommentProvider.js';
import { getSiteUrls } from '../../../constants/domains.js';
import { logger } from '../../../utils/logger.js';
import { fetchWithDomainRotation } from '../../../utils/index.js';
import { telemetry } from '../../../telemetry/index.js';

export const JABLE_DOMAINS = getSiteUrls('JABLE');

/**
 * Jable.tv 评论解析函数
 * @param {string} html 页面 HTML
 * @param {string} domain 当前工作域名
 * @returns {{comments: Array, totalCount: number, hasMore: boolean}}
 */
export function parseCommentsHtml(html, domain = JABLE_DOMAINS[0]) {
    if (html.includes('cf-challenge') || html.includes('Turnstile') || html.includes('Checking your browser') || html.includes('cloudflare')) {
        const cfError = new Error('触发人机验证');
        cfError.status = 403;
        cfError.domain = domain;
        throw cfError;
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const comments = [];
    let totalCount = 0;
    
    // 检查是否包含评论区块或评论列表容器，若包含则说明跨域网络请求已成功
    const commentsContainer = doc.querySelector('.comments') || doc.querySelector('.comment-list') || doc.querySelector('#video_comments_video_comments');
    if (!commentsContainer) {
        throw new Error(`未能获取有效的评论数据 (可能因 Safari 跨域权限拦截，请在浏览器中直接打开并验证 ${new URL(domain).hostname})`);
    }
    
    const sub = doc.querySelector('h6.sub-title');
    if (sub) {
        const m = sub.textContent.match(/\((\d+)\)/);
        if (m) totalCount = parseInt(m[1], 10);
    }
    
    let hasMore = html.includes('載入更多') || html.includes('载入更多');

    doc.querySelectorAll('div.item[data-comment-id]').forEach(item => {
        const id = item.getAttribute('data-comment-id') || '';
        const userEl = item.querySelector('.title .pr-2 a');
        const user = userEl ? userEl.textContent.trim() : (item.querySelector('.title .pr-2') ? item.querySelector('.title .pr-2').textContent.trim() : 'Anonymous');
        let userUrl = userEl ? userEl.getAttribute('href') : '';
        
        if (userUrl && userUrl.startsWith('/')) {
            userUrl = `${domain}${userUrl}`;
        }
        
        const timeEl = item.querySelector('.title .inactive-color');
        const time = timeEl ? timeEl.textContent.trim() : '';

        const textEl = item.querySelector('.comment-text .original-text');
        let text = '', isPending = false;
        if (textEl) {
            const clone = textEl.cloneNode(true);
            clone.querySelectorAll('img').forEach(img => img.replaceWith(img.getAttribute('alt') || ''));
            text = clone.textContent.trim();
        } else {
            const pendEl = item.querySelector('.comment-text .inactive-color');
            if (pendEl && pendEl.textContent.includes('審核')) {
                isPending = true;
                text = pendEl.textContent.trim();
            }
        }
        
        if (text || user !== 'Anonymous') {
            comments.push({
                id,
                user,
                userUrl,
                time,
                text,
                isPending,
                site: 'jable'
            });
        }
    });

    if (comments.length >= 10) {
        hasMore = true;
    }

    return { comments, totalCount, hasMore };
}

/**
 * 抓取 Jable 评论的独立函数
 * @param {string} code 番号
 * @param {number} [page=1] 页码
 * @returns {Promise<{comments: Array, totalCount: number, hasMore: boolean, domain: string}>}
 */
export async function fetchJableComments(code, page = 1) {
    const slug = code.toLowerCase().trim();
    const startTime = Date.now();
    logger.log(`[CommentScraper] 开始采集 Jable 评论，番号: ${slug}, 页码: ${page}`);
    try {
        const res = await fetchWithDomainRotation(
            JABLE_DOMAINS,
            domain => `${domain}/videos/${slug}/?mode=async&function=get_block&block_id=video_comments_video_comments&sort_by=&from=${page}&ipp=10&_=${Date.now()}`,
            { headers: { 'accept': '*/*', 'x-requested-with': 'XMLHttpRequest' }, timeout: 6000 }
        );
        const parsed = parseCommentsHtml(res.html, res.domain);
        logger.log(`[CommentScraper] 成功采集到 Jable 评论，共 ${parsed.comments.length} 条 (总数: ${parsed.totalCount})`);
        
        telemetry.recordFeatureAction('comment_scrape');
        telemetry.track('comment_scrape_result', {
            site: 'jable',
            success: true,
            count: parsed.comments.length,
            duration_ms: Date.now() - startTime
        });

        return { ...parsed, domain: res.domain };
    } catch (err) {
        telemetry.track('comment_scrape_result', {
            site: 'jable',
            success: false,
            duration_ms: Date.now() - startTime
        });

        if (err.message && err.message.includes('CF_SHIELD')) {
            const cfErr = new Error('触发人机验证');
            cfErr.status = 403;
            throw cfErr;
        }
        throw err;
    }
}

/**
 * Jable 评论数据提供器
 */
export class JableCommentProvider extends BaseCommentProvider {
    constructor() {
        super('jable');
        this.domains = JABLE_DOMAINS;
    }

    async fetchComments(avCode, page = 1) {
        return fetchJableComments(avCode, page);
    }
}
