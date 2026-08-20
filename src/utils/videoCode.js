/**
 * Video code extraction utilities
 */
import { isSiteDomain } from '../constants/domains.js';

// 非番号的通用路径与功能页面黑名单
export const NON_AV_SLUGS = new Set([
    'search', 's', 'zh-cn', 'cn', 'en', 'tw', 'ja', 'vi', 'ko', 'th', 'ru',
    'forum', 'forum.php', 'index.html', 'index.php', 'warmup.html', 'watch',
    'login', 'register', 'signin', 'signup', 'home', 'tags', 'genres', 'actors',
    'actresses', 'makers', 'directors', 'series', 'categories', 'channels',
    'playlists', 'dmca', 'terms', 'privacy', 'about', 'help', 'contact',
    'v1_star.php', 'preview', 'member', 'vip', 'download', 'upload', 'news',
    'rank', 'ranking', 'popular', 'latest', 'release', 'recent', 'favorite',
    'history', 'videos', 'video', 'movie', 'movies', 'new', 'top', 'trending'
]);

/**
 * 判断是否为合法的番号格式
 * @param {string} code - 待检测字符串
 * @returns {boolean}
 */
export function isValidAvCode(code) {
    if (!code || typeof code !== 'string') return false;
    const s = code.trim().toLowerCase();
    if (s.length < 2 || s.length > 50) return false;
    if (NON_AV_SLUGS.has(s)) return false;
    if (s.endsWith('.html') || s.endsWith('.php') || s.endsWith('.htm') || s.endsWith('.js') || s.endsWith('.css')) return false;

    // 1. 标准番号（如 MIAA-598, SSIS-888, ABP-123, FC2-PPV-1234567, 1PONDO-010120-001, DM-339）
    if (/^[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/i.test(s) && /\d/.test(s)) {
        return true;
    }
    // 2. 紧凑番号（如 MIAA598, SSIS888, dm339）
    if (/^(dm|[a-z]{2,8})\d{2,8}$/i.test(s)) {
        return true;
    }
    // 3. 特殊前缀（如 uncensored-leak-xxx）
    if (/^uncensored-leak-[a-z0-9-]+$/i.test(s) && /\d/.test(s)) {
        return true;
    }
    return false;
}

/**
 * Clean and normalize AV code
 * @param {string} code - Raw code string
 * @returns {string} Cleaned normalized uppercase code
 */
export function cleanAvCode(code) {
    if (!code) return '';
    let result = code.trim();

    const suffixes = [
        '-uncensored-leak',
        '-uncensored',
        '-english-subtitle',
        '-chinese-subtitle',
        '-subtitle',
        '-leak',
        '-c',
        '-uc'
    ];

    let changed = true;
    while (changed) {
        changed = false;
        for (const suffix of suffixes) {
            if (result.toLowerCase().endsWith(suffix)) {
                result = result.slice(0, -suffix.length);
                changed = true;
                break;
            }
        }
    }

    // 标准化 MIAA-598 格式
    const stdMatch = result.match(/^([a-zA-Z]+)-?(\d+)$/);
    if (stdMatch) {
        return `${stdMatch[1].toUpperCase()}-${stdMatch[2]}`;
    }

    // 标准化 DM-339 / dm339 格式
    const dmMatch = result.match(/^dm-?(\d+)$/i);
    if (dmMatch) {
        return `DM-${dmMatch[1]}`;
    }

    return result.toUpperCase();
}

/**
 * Extract video code from URL
 * @param {string} url - URL to parse
 * @returns {string} Extracted video code (or empty string if non-video page)
 */
export function getVideoCodeFromUrl(url = (typeof window !== 'undefined' ? window.location.href : '')) {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const search = urlObj.search;

        let rawCandidate = '';

        // 1. Jable.tv: /videos/miaa-598/
        if (isSiteDomain('JABLE', urlObj.hostname)) {
            const match = path.match(/\/videos\/([^/?#]+)/i);
            if (match) rawCandidate = match[1];
        }

        // 2. JavDB: /v/xxx or /videos/xxx
        if (!rawCandidate && isSiteDomain('JAVDB', urlObj.hostname)) {
            const match = path.match(/\/(?:v|videos)\/([^/?#]+)/i);
            if (match) rawCandidate = match[1];
        }

        // 3. JavLibrary: ?v=javli... or ?v=...
        if (!rawCandidate && isSiteDomain('JAVLIBRARY', urlObj.hostname)) {
            const vParam = urlObj.searchParams.get('v');
            if (vParam) rawCandidate = vParam;
        }

        // 4. MissAV: /cn/miaa-598 or /miaa-598 or /dm-339
        if (!rawCandidate && isSiteDomain('MISSAV', urlObj.hostname)) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                const last = segments[segments.length - 1];
                if (!NON_AV_SLUGS.has(last.toLowerCase())) {
                    rawCandidate = last;
                }
            }
        }

        // 5. Generic fallback: match alphanumeric-digits in path
        if (!rawCandidate) {
            const genericMatch = path.match(/\/([a-zA-Z0-9]+-\d+[a-zA-Z0-9-]*)/i);
            if (genericMatch) {
                rawCandidate = genericMatch[1];
            }
        }

        // 6. Check last path segment if valid
        if (!rawCandidate) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                const last = segments[segments.length - 1];
                if (isValidAvCode(last)) {
                    rawCandidate = last;
                }
            }
        }

        if (rawCandidate && isValidAvCode(rawCandidate)) {
            return cleanAvCode(rawCandidate);
        }
    } catch (e) {
        console.error('[VideoCode] Failed to parse video code from URL:', e);
    }
    return '';
}
