import { BaseCommentProvider } from './BaseCommentProvider.js';
import { getSiteUrls } from '../../../constants/domains.js';
import { logger } from '../../../utils/logger.js';
import { fetchWithTransport, fetchWithDomainRotation, detectCloudflare } from '../../../utils/index.js';

export const JAVLIB_DOMAINS = getSiteUrls('JAVLIBRARY');

/**
 * Clean avcode specifically for JAVLibrary search matching.
 */
export function matchAvCode(a, b) {
    const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(a) === clean(b);
}

/**
 * Helper to retrieve JAVLibrary cookie from cross-domain cookiesMap, matching by hostname (ignoring www. prefix)
 * @param {string} targetDomain - The target origin/domain URL (e.g. "https://c97k.com")
 * @returns {string} The cookie value
 */
export function getJavLibCookie(targetDomain) {
    if (typeof GM_getValue !== 'function') return '';
    const cookiesMap = GM_getValue('javlib_cookies') || {};
    
    const getHost = (urlStr) => {
        try {
            return new URL(urlStr).hostname.replace(/^www\./, '');
        } catch (e) {
            return (urlStr || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        }
    };
    
    const targetHost = getHost(targetDomain);
    for (const key of Object.keys(cookiesMap)) {
        if (getHost(key) === targetHost) {
            return cookiesMap[key] || '';
        }
    }
    return '';
}

/**
 * Helper to extract video ID from redirected JAVLibrary URL
 */
export function extractVideoIdFromUrl(url) {
    if (!url) return '';
    const matchQuery = url.match(/[\?&]v=([^&]+)/);
    const matchHtml = url.match(/\/cn\/(jav[a-z0-9]+)\.html/i);
    return matchQuery ? matchQuery[1] : (matchHtml ? matchHtml[1] : '');
}

/**
 * Helper to parse JAVLibrary search HTML
 */
export function parseJavLibraryVideoIdHtml(text, cleanCode, domain) {
    if (!text || text.trim() === '') {
        throw new Error('Empty response');
    }

    if (text.includes('cf-challenge') || text.includes('Turnstile') || text.includes('Checking your browser')) {
        throw new Error('CLOUDFLARE_SHIELD');
    }

    const doc = new DOMParser().parseFromString(text, 'text/html');
    const videos = doc.querySelectorAll('.videos .video a');
    
    let foundId = '';
    for (const a of videos) {
        const idEl = a.querySelector('.id');
        if (idEl) {
            const codeText = idEl.textContent.trim();
            if (matchAvCode(codeText, cleanCode)) {
                const href = a.getAttribute('href') || '';
                const m = href.match(/v=([^&]+)/);
                if (m) {
                    foundId = m[1];
                    break;
                }
            }
        }
    }

    if (!foundId && videos.length > 0) {
        const href = videos[0].getAttribute('href') || '';
        const m = href.match(/v=([^&]+)/);
        if (m) foundId = m[1];
    }

    if (foundId) {
        logger.log(`找到 JAVLibrary ID (搜索列表): ${foundId} (工作域名: ${domain})`);
        return foundId;
    }

    const urlMatch = text.match(/videocomments\.php\?v=([^"]+)/);
    if (urlMatch) {
        logger.log(`从页面文本中解析到 JAVLibrary ID: ${urlMatch[1]} (工作域名: ${domain})`);
        return urlMatch[1];
    }

    throw new Error('Movie not found on JAVLibrary');
}

/**
 * Searches JAVLibrary by avcode and resolves to a JAVLibrary video ID (e.g. javliXXXXX)
 * @param {string} avcode - The movie番号 (e.g. IPX-123)
 * @returns {Promise<{videoId: string, domain: string}>}
 */
export async function fetchJavLibraryVideoId(avcode) {
    if (!avcode) throw new Error('Invalid AVCode');
    const cleanCode = avcode.toLowerCase().trim();
    try {
        const res = await fetchWithDomainRotation(
            JAVLIB_DOMAINS,
            domain => `${domain}/cn/vl_searchbyid.php?keyword=${encodeURIComponent(cleanCode)}`,
            { headers: { 'accept': 'text/html,application/xhtml+xml,*/*' }, timeout: 8000 }
        );
        let workingDomain = res.domain;
        if (res.finalUrl && res.finalUrl.startsWith('http')) {
            try { workingDomain = new URL(res.finalUrl).origin; } catch (e) {}
        }
        const videoId = extractVideoIdFromUrl(res.finalUrl) || parseJavLibraryVideoIdHtml(res.html, cleanCode, workingDomain);
        return { videoId, domain: workingDomain };
    } catch (err) {
        if (err.message && err.message.includes('CF_SHIELD')) {
            throw new Error(err.message);
        }
        throw err;
    }
}

/**
 * Helper to parse comments or reviews
 */
export function parseJavLibraryDataHtml(text, type, page, activeDomain) {
    if (!text || text.trim() === '') {
        throw new Error('Empty response');
    }

    if (text.includes('cf-challenge') || text.includes('Turnstile') || text.includes('Checking your browser')) {
        throw new Error(`CF_SHIELD_ON_${activeDomain}`);
    }

    const isReviews = type === 'reviews';
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const selector = isReviews ? 'table.review' : 'table.comment';
    const tables = doc.querySelectorAll(selector);
    const comments = [];

    tables.forEach((table, index) => {
        const userEl = table.querySelector('.userid a');
        const user = userEl ? userEl.textContent.trim() : 'Anonymous';
        let userUrl = userEl ? userEl.getAttribute('href') : '';
        if (userUrl) {
            if (userUrl.startsWith('.')) {
                userUrl = `${activeDomain}/cn${userUrl.substring(1)}`;
            } else if (userUrl.startsWith('/')) {
                userUrl = `${activeDomain}/cn${userUrl}`;
            } else if (!userUrl.startsWith('http')) {
                userUrl = `${activeDomain}/cn/${userUrl}`;
            }
        }

        const dateEl = table.querySelector('.date');
        const time = dateEl ? dateEl.textContent.trim() : '';

        const textarea = table.querySelector('textarea.hidden');
        const contentText = textarea ? (textarea.value || textarea.textContent || '').trim() : '';

        const ratingEl = table.querySelector('[class^="rating"]');
        const score = ratingEl ? ratingEl.getAttribute('title') : null;

        if (contentText || user !== 'Anonymous') {
            comments.push({
                id: `javlib-${type}-${page}-${index}`,
                user,
                userUrl,
                time,
                text: contentText,
                score,
                isPending: false,
                site: 'javlib'
            });
        }
    });

    const pageSelector = doc.querySelector('.page_selector');
    let hasMore = false;
    let totalCount = comments.length;
    
    if (pageSelector) {
        const nextPattern = new RegExp(`[\\?&]page=${page + 1}(?:&|$)`);
        const pageLinks = pageSelector.querySelectorAll('a');
        for (const a of pageLinks) {
            if (nextPattern.test(a.getAttribute('href') || '')) {
                hasMore = true;
                break;
            }
        }
    }

    return { comments, totalCount, hasMore };
}

/**
 * Fetch and parse comments or reviews from JAVLibrary
 * @param {string} videoId - The JAVLibrary video ID (e.g. javliXXXXX)
 * @param {string} [type='comments'] - 'comments' or 'reviews'
 * @param {number} [page=1] - Page number
 * @param {string} [domain] - The working domain resolved from ID fetching
 * @returns {Promise<{comments: Array, totalCount: number, hasMore: boolean}>}
 */
export async function fetchJavLibraryData(videoId, type = 'comments', page = 1, domain) {
    if (!videoId) throw new Error('Invalid VideoId');
    const isReviews = type === 'reviews';
    const endpoint = isReviews ? 'videoreviews.php' : 'videocomments.php';
    const activeDomain = domain || JAVLIB_DOMAINS[0];
    const url = `${activeDomain}/cn/${endpoint}?v=${videoId}&page=${page}`;

    logger.log(`[CommentScraper] 采集 JAVLibrary ${type} (Page ${page}): ${url}`);
    const res = await fetchWithTransport(url, {
        headers: {
            'accept': 'text/html,application/xhtml+xml,*/*',
            'referer': `${activeDomain}/cn/?v=${videoId}`
        },
        timeout: 10000
    });

    if (detectCloudflare(res.status, res.html)) {
        throw new Error(`CF_SHIELD_ON_${activeDomain}`);
    }
    return parseJavLibraryDataHtml(res.html, type, page, activeDomain);
}

/**
 * JAVLibrary 评论提供器
 */
export class JavLibCommentProvider extends BaseCommentProvider {
    constructor() {
        super('javlib');
        this.domains = JAVLIB_DOMAINS;
    }

    async fetchComments(avCode, page = 1, options = {}) {
        let videoId = options.videoId;
        let domain = options.domain;
        if (!videoId) {
            const idRes = await fetchJavLibraryVideoId(avCode);
            videoId = idRes.videoId;
            domain = idRes.domain;
        }
        const data = await fetchJavLibraryData(videoId, options.type || 'comments', page, domain);
        return { ...data, videoId, domain };
    }
}
