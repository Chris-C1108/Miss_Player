/**
 * Video code extraction utilities
 */
import { isSiteDomain } from '../constants/domains.js';

/**
 * Clean and normalize AV code
 * @param {string} code - Raw code string
 * @returns {string} Cleaned code
 */
export function cleanAvCode(code) {
    if (!code) return '';
    let result = code.toLowerCase().trim();

    const suffixes = [
        '-uncensored-leak',
        '-uncensored',
        '-english-subtitle',
        '-chinese-subtitle',
        '-subtitle',
        '-leak',
        '-c'
    ];

    let changed = true;
    while (changed) {
        changed = false;
        for (const suffix of suffixes) {
            if (result.endsWith(suffix)) {
                result = result.slice(0, -suffix.length);
                changed = true;
                break;
            }
        }
    }

    const stdMatch = result.match(/^([a-z]+)-?(\d+)$/i);
    if (stdMatch) {
        return `${stdMatch[1]}-${stdMatch[2]}`.toLowerCase();
    }

    return result;
}

/**
 * Extract video code from URL
 * @param {string} url - URL to parse
 * @returns {string} Extracted video code
 */
export function getVideoCodeFromUrl(url = window.location.href) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        let code = '';

        // Jable.tv: /videos/miaa-598/
        if (isSiteDomain('JABLE', urlObj.hostname)) {
            const match = path.match(/\/videos\/([^/]+)/i);
            if (match) code = match[1];
        }

        // MissAV: /cn/miaa-598 or /miaa-598
        if (!code && isSiteDomain('MISSAV', urlObj.hostname)) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                code = segments[segments.length - 1];
            }
        }

        // Generic fallback: match alphanumeric hyphen alphanumeric
        if (!code) {
            const genericMatch = path.match(/\/([a-z0-9]+-[a-z0-9]+)/i);
            if (genericMatch) {
                code = genericMatch[1];
            }
        }

        // Last fallback: last segment of path
        if (!code) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                code = segments[segments.length - 1];
            }
        }

        if (code) {
            return cleanAvCode(code);
        }
    } catch (e) {
        console.error('[VideoCode] Failed to parse video code from URL:', e);
    }
    return '';
}
