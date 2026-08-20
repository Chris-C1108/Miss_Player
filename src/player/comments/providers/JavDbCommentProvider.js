import { BaseCommentProvider } from './BaseCommentProvider.js';
import { getSiteUrls } from '../../../constants/domains.js';
import { logger } from '../../../utils/logger.js';
import { md5 } from '../../../utils/md5.js';
import { matchAvCode } from './JavLibCommentProvider.js';

export const JAVDB_DOMAINS = getSiteUrls('JAVDB');
const JB_API_BASE = 'https://jdforrepam.com/api';

/**
 * Build JavDB signature for jdforrepam.com API requests
 */
export function jbBuildSignature() {
    const curr = Math.floor(Date.now() / 1000);
    try {
        const stored = localStorage.getItem('jb_jdsignature');
        if (stored) {
            const parts = stored.split('.');
            if (parts.length === 3 && (curr - parseInt(parts[0], 10)) <= 300) {
                return stored;
            }
        }
    } catch (e) {}
    
    const sign = `${curr}.lpw6vgqzsp.${md5(`${curr}71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa`)}`;
    try {
        localStorage.setItem('jb_jdsignature', sign);
    } catch (e) {}
    return sign;
}

/**
 * Helper to execute GM_xmlhttpRequest for JSON API
 */
export function jbApiGetOnce(url, params, headers) {
    return new Promise((resolve, reject) => {
        let fullUrl = url;
        if (params && Object.keys(params).length) {
            const qs = new URLSearchParams(params).toString();
            fullUrl += (url.includes('?') ? '&' : '?') + qs;
        }
        if (typeof GM_xmlhttpRequest === 'undefined') {
            reject(new Error('GM_xmlhttpRequest unavailable'));
            return;
        }
        GM_xmlhttpRequest({
            method: 'GET',
            url: fullUrl,
            headers: headers || {},
            timeout: 8000,
            onload: (resp) => {
                try {
                    if (resp.status >= 200 && resp.status < 300) {
                        if (resp.responseText) {
                            try {
                                resolve(JSON.parse(resp.responseText));
                            } catch (e) {
                                resolve(resp.responseText);
                            }
                        } else {
                            resolve(resp.responseText || resp);
                        }
                    } else {
                        try {
                            const errorData = JSON.parse(resp.responseText);
                            reject(errorData);
                        } catch (e) {
                            reject(new Error(resp.responseText || `HTTP ${resp.status}`));
                        }
                    }
                } catch (e) {
                    reject(e);
                }
            },
            onerror: () => reject(new Error('API 请求失败')),
            ontimeout: () => reject(new Error('API 请求超时'))
        });
    });
}

/**
 * Search JavDB for movie ID by avcode
 * Primary: HTML search on javdb.com
 * Backup: Unofficial API search on jdforrepam.com
 */
export function fetchJavdbMovieId(avcode, domainIndex = 0) {
    if (!avcode) return Promise.reject(new Error('Invalid AVCode'));
    const cleanCode = avcode.trim();
    const activeDomain = JAVDB_DOMAINS[domainIndex] || JAVDB_DOMAINS[0] || 'https://javdb.com';
    const url = `${activeDomain}/search?q=${encodeURIComponent(cleanCode)}&f=all`;

    logger.log(`[CommentScraper] 开始获取 JavDB 影片 ID，番号: ${cleanCode}, 域名: ${activeDomain}`);

    return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest === 'undefined') {
            reject(new Error('GM_xmlhttpRequest unavailable'));
            return;
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 8000,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            onload(r) {
                if (r.status === 403 || r.status === 503 || (r.responseText && (r.responseText.includes('cf-challenge') || r.responseText.includes('Turnstile')))) {
                    reject(new Error(`CF_SHIELD_ON_${activeDomain}`));
                    return;
                }
                if (r.status >= 200 && r.status < 300) {
                    if (r.finalUrl && r.finalUrl.includes('/v/')) {
                        const m = r.finalUrl.match(/\/v\/([a-zA-Z0-9]+)/);
                        if (m) {
                            resolve({ movieId: m[1], domain: activeDomain, source: 'html' });
                            return;
                        }
                    }
                    try {
                        const doc = new DOMParser().parseFromString(r.responseText, 'text/html');
                        const items = doc.querySelectorAll('.movie-list .item a[href^="/v/"], .grid-item a[href^="/v/"], a[href^="/v/"]');
                        let foundId = '';
                        for (const a of items) {
                            const href = a.getAttribute('href') || '';
                            const m = href.match(/\/v\/([a-zA-Z0-9]+)/);
                            if (m) {
                                const titleText = a.getAttribute('title') || a.textContent || '';
                                if (!cleanCode || matchAvCode(titleText, cleanCode)) {
                                    foundId = m[1];
                                    break;
                                }
                                if (!foundId) foundId = m[1];
                            }
                        }
                        if (foundId) {
                            resolve({ movieId: foundId, domain: activeDomain, source: 'html' });
                            return;
                        }
                    } catch (e) {}
                }
                reject(new Error(`HTML search failed HTTP ${r.status}`));
            },
            onerror() {
                reject(new Error('Network error'));
            },
            ontimeout() {
                reject(new Error('Timeout'));
            }
        });
    }).catch(async (htmlErr) => {
        logger.warn(`[CommentScraper] JavDB 主线搜索失败 (${htmlErr.message})，正在尝试第三方 API 备用线路...`);
        try {
            const sign = jbBuildSignature();
            const apiUrl = `${JB_API_BASE}/v2/search`;
            const apiRes = await jbApiGetOnce(apiUrl, {
                q: cleanCode,
                page: 1,
                type: 'movie',
                limit: 1,
                movie_type: 'all',
                from_recent: 'false',
                movie_filter_by: 'all',
                movie_sort_by: 'relevance'
            }, {
                'user-agent': 'Dart/3.5 (dart:io)',
                'accept-language': 'zh-TW',
                'host': 'jdforrepam.com',
                'jdsignature': sign
            });
            const movies = apiRes?.data?.movies || [];
            if (movies.length > 0 && movies[0].id) {
                logger.log(`[CommentScraper] 备用线路获取 JavDB movieId 成功: ${movies[0].id}`);
                return { movieId: movies[0].id, domain: activeDomain, source: 'api' };
            }
        } catch (apiErr) {
            logger.error(`[CommentScraper] JavDB 备用线路搜索亦失败:`, apiErr);
        }
        throw htmlErr;
    });
}

/**
 * Fetch JavDB short reviews
 * Primary: Direct webpage HTML parsing
 * Backup: Unofficial API JSON
 */
export function fetchJavdbData(movieId, page = 1, domain) {
    if (!movieId) return Promise.reject(new Error('Invalid MovieId'));
    const activeDomain = domain || JAVDB_DOMAINS[0] || 'https://javdb.com';
    const reviewUrl = `${activeDomain}/v/${movieId}/reviews?page=${page}`;

    logger.log(`[CommentScraper] 尝试 JavDB 主线获取短评 (Page ${page}): ${reviewUrl}`);

    const fetchMainLine = () => new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest === 'undefined') {
            reject(new Error('GM_xmlhttpRequest unavailable'));
            return;
        }
        GM_xmlhttpRequest({
            method: 'GET',
            url: reviewUrl,
            timeout: 10000,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            onload(r) {
                if (r.status === 403 || r.status === 503 || (r.responseText && (r.responseText.includes('cf-challenge') || r.responseText.includes('Turnstile')))) {
                    reject(new Error(`CF_SHIELD_ON_${activeDomain}`));
                    return;
                }
                if (r.status === 404) {
                    reject(new Error('HTTP 404'));
                    return;
                }
                if (r.status >= 200 && r.status < 300) {
                    const doc = new DOMParser().parseFromString(r.responseText, 'text/html');
                    const items = doc.querySelectorAll('dt.review-item');
                    const comments = [];
                    items.forEach((item, index) => {
                        if (item.classList.contains('more')) return;
                        const titleEl = item.querySelector('.review-title');
                        if (!titleEl) return;
                        
                        let userName = '匿名用户';
                        for (let child of titleEl.childNodes) {
                            if (child.nodeType === 3) {
                                const t = child.textContent.trim();
                                if (t.length > 0 && t.length < 30) {
                                    userName = t;
                                    break;
                                }
                            }
                        }
                        const timeEl = titleEl.querySelector('.time');
                        const date = timeEl ? timeEl.textContent.trim() : '';

                        const starsEl = titleEl.querySelector('.score-stars');
                        let goldCount = 0;
                        if (starsEl) {
                            goldCount = starsEl.querySelectorAll('i.icon-star:not(.gray)').length;
                        }

                        const contentEl = item.querySelector('.content p, .content');
                        const text = contentEl ? contentEl.textContent.trim() : '';

                        if (text) {
                            comments.push({
                                id: `javdb-html-${page}-${index}`,
                                user: userName,
                                time: date,
                                text: text,
                                score: goldCount,
                                isPending: false,
                                site: 'javdb'
                            });
                        }
                    });

                    let hasMore = false;
                    const pagination = doc.querySelector('.pagination');
                    if (pagination) {
                        const nextBtn = pagination.querySelector('a.pagination-next, a[rel="next"], a.pagination-link[href*="page="]');
                        if (nextBtn) hasMore = true;
                    } else if (comments.length >= 20) {
                        hasMore = true;
                    }

                    resolve({ comments, totalCount: comments.length, hasMore, source: 'html' });
                    return;
                }
                reject(new Error(`HTTP ${r.status}`));
            },
            onerror() {
                reject(new Error('Network error'));
            },
            ontimeout() {
                reject(new Error('Timeout'));
            }
        });
    });

    const fetchFallbackLine = async () => {
        logger.log(`[CommentScraper] 自动无缝切换至 JavDB 备用 API (jdforrepam.com) 抓取短评...`);
        const sign = jbBuildSignature();
        const apiUrl = `${JB_API_BASE}/v1/movies/${movieId}/reviews`;
        const res = await jbApiGetOnce(apiUrl, { page: page, sort_by: 'hotly', limit: 20 }, {
            jdSignature: sign
        });
        const reviews = res?.data?.reviews || [];
        const comments = reviews.map((item, index) => {
            const dateStr = item.created_at ? new Date(item.created_at * 1000).toLocaleDateString('zh-CN') : '';
            return {
                id: `javdb-api-${page}-${item.id || index}`,
                user: item.username || '匿名用户',
                time: dateStr,
                text: item.content || '',
                score: item.score || 0,
                likes: item.likes_count || 0,
                isPending: false,
                site: 'javdb'
            };
        });
        const hasMore = reviews.length >= 20;
        return { comments, totalCount: comments.length, hasMore, source: 'api' };
    };

    return fetchMainLine().catch(err => {
        if (err.message && err.message.startsWith('CF_SHIELD_ON_')) {
            return fetchFallbackLine().catch(() => Promise.reject(err));
        }
        return fetchFallbackLine();
    });
}

/**
 * JavDB 评论提供器
 */
export class JavDbCommentProvider extends BaseCommentProvider {
    constructor() {
        super('javdb');
        this.domains = JAVDB_DOMAINS;
    }

    async fetchComments(avCode, page = 1, options = {}) {
        let movieId = options.movieId;
        let domain = options.domain;
        if (!movieId) {
            const idRes = await fetchJavdbMovieId(avCode);
            movieId = idRes.movieId;
            domain = idRes.domain;
        }
        const data = await fetchJavdbData(movieId, page, domain);
        return { ...data, movieId, domain };
    }
}
