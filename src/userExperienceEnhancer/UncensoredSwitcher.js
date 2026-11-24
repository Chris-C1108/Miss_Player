import { isSiteDomain } from '../constants/domains.js';
import { getVideoCodeFromUrl, matchAvCodeFromText, NON_AV_ROUTE_SLUGS, LANGUAGE_SLUGS } from '../utils/videoCode.js';
import { getValue } from '../utils/storage.js';

const STRIP_SUFFIX_RE = /(?:[-_](?:chinese[-_]?subtitles?|chinese[-_]?sub|subtitles?|sub|ch|c|4k|fhd|hd|reduced[-_]mosaic))+$/i;
const SESSION_KEY_PREFIX = 'mp_uncensored_checked_';

/**
 * 判断主机名是否属于 MissAV（包含官方与常见镜像域名）
 * @param {string} hostname
 * @returns {boolean}
 */
export function isMissavHost(hostname) {
    if (!hostname || typeof hostname !== 'string') return false;
    return isSiteDomain('MISSAV', hostname) || /(?:^|\.)(?:missav[^.]*|thisav[^.]*)\./i.test(hostname);
}

/**
 * 仅从 URL 路径本身提取番号（不读取宿主 DOM <video data-code>，防止链接比对串号）
 * @param {URL|string} urlInput
 * @returns {string}
 */
function extractAvCodeFromUrlOnly(urlInput) {
    try {
        const parsed = typeof urlInput === 'string' ? new URL(urlInput) : urlInput;
        const segments = decodeURIComponent(parsed.pathname || '').split('/').filter(Boolean);
        if (segments.length === 0) return '';
        const leaf = segments[segments.length - 1];
        return matchAvCodeFromText(leaf) || getVideoCodeFromUrl(parsed.href) || '';
    } catch (_) {
        return '';
    }
}

/**
 * 解析并校验当前 URL 是否为可切换无码版的 MissAV 影片详情页
 * @param {string} rawUrl
 * @returns {{ url: URL, avCode: string, slug: string, prefixPath: string, cleanPrefixPath: string } | null}
 */
export function parseMissavVideoPage(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch (_) {
        return null;
    }

    if (!isMissavHost(parsed.hostname)) return null;

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const slug = segments[segments.length - 1];
    const lowerSlug = slug.toLowerCase();

    if (LANGUAGE_SLUGS.has(lowerSlug) || NON_AV_ROUTE_SLUGS.has(lowerSlug)) return null;
    if (/uncensored/i.test(lowerSlug)) return null;

    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i].toLowerCase();
        if (NON_AV_ROUTE_SLUGS.has(seg)) return null;
    }

    const avCode = extractAvCodeFromUrlOnly(parsed);
    if (!avCode) return null;

    const prefixSegments = segments.slice(0, -1);
    const prefixPath = prefixSegments.length ? `/${prefixSegments.join('/')}` : '';
    const cleanPrefixSegments = prefixSegments.filter((seg, idx) => !(idx === 0 && /^dm\d+$/i.test(seg)));
    const cleanPrefixPath = cleanPrefixSegments.length ? `/${cleanPrefixSegments.join('/')}` : '';

    return { url: parsed, avCode, slug, prefixPath, cleanPrefixPath };
}

/**
 * 生成 MissAV 无码版候选 URL 列表（按命中优先级排序，同时兼容去 /dmXX/ 分片路由）
 * @param {string} rawUrl
 * @returns {string[]}
 */
export function buildUncensoredCandidateUrls(rawUrl) {
    const info = parseMissavVideoPage(rawUrl);
    if (!info) return [];

    const { url, avCode, slug, prefixPath, cleanPrefixPath } = info;
    const baseSlug = slug.replace(STRIP_SUFFIX_RE, '') || avCode.toLowerCase();
    const codeSlug = avCode.toLowerCase();

    const slugBases = Array.from(new Set([baseSlug, codeSlug].filter(Boolean)));
    const prefixes = Array.from(new Set([prefixPath, cleanPrefixPath].filter((p) => p !== undefined)));
    const suffixes = ['-uncensored-leak', '-uncensored-leaked', '-uncensored'];
    const candidates = [];

    for (const prefix of prefixes) {
        for (const base of slugBases) {
            for (const suffix of suffixes) {
                const candidate = `${url.origin}${prefix}/${base}${suffix}${url.search || ''}`;
                if (candidate !== rawUrl && !candidates.includes(candidate)) {
                    candidates.push(candidate);
                }
            }
        }
    }

    return candidates;
}

/**
 * Tier 1: 从当前页 DOM 中零请求检索同番号无码版链接
 * @param {Document} doc
 * @param {string} currentUrl
 * @param {string} avCode
 * @returns {string | null}
 */
export function findUncensoredLinkInDocument(doc, currentUrl, avCode) {
    if (!doc || typeof doc.querySelectorAll !== 'function' || !avCode) return null;
    let currentOrigin = '';
    try {
        currentOrigin = new URL(currentUrl).origin;
    } catch (_) {
        return null;
    }

    const links = Array.from(doc.querySelectorAll('a[href*="uncensored"]'));
    let fallbackMatch = null;

    for (const link of links) {
        const rawHref = link?.getAttribute?.('href') || link?.href;
        if (!rawHref) continue;

        let resolved;
        try {
            resolved = new URL(rawHref, currentUrl);
        } catch (_) {
            continue;
        }

        if (resolved.origin !== currentOrigin) continue;
        if (!/uncensored/i.test(resolved.pathname)) continue;

        const segments = resolved.pathname.split('/').filter(Boolean);
        if (segments.length === 0) continue;
        const leaf = segments[segments.length - 1].toLowerCase();
        if (!leaf.includes('-uncensored')) continue;
        if (NON_AV_ROUTE_SLUGS.has(leaf)) continue;

        const linkCode = extractAvCodeFromUrlOnly(resolved);
        if (linkCode !== avCode) continue;

        if (leaf.includes('uncensored-leak')) {
            return resolved.href;
        }
        if (!fallbackMatch) {
            fallbackMatch = resolved.href;
        }
    }

    return fallbackMatch;
}

/**
 * 判断返回 HTML 是否为软 404 或非目标视频页
 * @param {string} html
 * @param {string} avCode
 * @returns {boolean}
 */
function isValidUncensoredHtml(html, avCode) {
    if (!html || typeof html !== 'string') return true;
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    if (/(?:404\s*not\s*found|page\s*not\s*found|error\s*404|找不到页面|頁面不存在)/i.test(title)) {
        return false;
    }
    const lowerHtml = html.toLowerCase();
    if (!lowerHtml.includes(avCode.toLowerCase()) && !lowerHtml.includes(avCode.replace(/-/g, '').toLowerCase())) {
        return false;
    }
    return true;
}

/**
 * 通过 GM_xmlhttpRequest 执行兜底探活（兼容 iOS Safari Stay App 隔离沙箱与防挂死硬熔断）
 * @param {string} candidateUrl
 * @param {Function|null} gmRequestFn
 * @param {number} [timeoutMs=4500]
 * @returns {Promise<{ ok: boolean, status: number, url: string, text?: () => Promise<string> } | null>}
 */
function probeViaGM(candidateUrl, gmRequestFn, timeoutMs = 4500) {
    if (typeof gmRequestFn !== 'function') return Promise.resolve(null);
    return new Promise((resolve) => {
        let settled = false;
        let req = null;
        const finish = (val) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(val);
        };
        const timer = setTimeout(() => {
            try { req?.abort?.(); } catch (_) {}
            finish(null);
        }, timeoutMs);

        try {
            req = gmRequestFn({
                method: 'GET',
                url: candidateUrl,
                timeout: timeoutMs,
                onload: (res) => {
                    const status = Number(res?.status) || 0;
                    const body = typeof res?.responseText === 'string' ? res.responseText : '';
                    finish({
                        ok: status >= 200 && status < 300,
                        status,
                        url: res?.finalUrl || candidateUrl,
                        text: async () => body
                    });
                },
                onerror: () => finish(null),
                ontimeout: () => finish(null)
            });
        } catch (_) {
            finish(null);
        }
    });
}

/**
 * 解析当前环境可用的多通道 Fetch 函数（规避 iOS Stay unsafeWindow.fetch 绑定代理抛出 TypeError）
 * @param {Function|null} customFetchFn
 * @param {Function|null} gmRequestFn
 */
async function fetchCandidateResponse(candidateUrl, customFetchFn, gmRequestFn) {
    if (typeof customFetchFn === 'function') {
        const res = await customFetchFn(candidateUrl, {
            method: 'GET',
            credentials: 'include',
            redirect: 'follow'
        });
        return { res, transportFailed: false };
    }

    const tryNativeFetch = async (fn, thisObj) => {
        const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => {
            try { ctrl.abort(); } catch (_) {}
        }, 4500) : null;
        try {
            const opts = {
                method: 'GET',
                credentials: 'include',
                redirect: 'follow'
            };
            if (ctrl) opts.signal = ctrl.signal;
            const res = thisObj ? await fn.call(thisObj, candidateUrl, opts) : await fn(candidateUrl, opts);
            return res;
        } finally {
            if (timer) clearTimeout(timer);
        }
    };

    let sawHttpResult = false;

    // 通道 1: 当前上下文原生 fetch（在 iOS Safari Stay content script 中安全有效，不触发跨世界代理 receiver 异常）
    if (typeof fetch === 'function') {
        try {
            const res = await tryNativeFetch(fetch, null);
            if (res && res.status > 0) {
                sawHttpResult = true;
                if (res.ok || res.status === 404) {
                    return { res, transportFailed: false };
                }
            }
        } catch (_) {}
    }

    // 通道 2: 页面 unsafeWindow.fetch（仅当存在且与沙箱 fetch 不同时尝试）
    if (typeof unsafeWindow !== 'undefined' && unsafeWindow && typeof unsafeWindow.fetch === 'function') {
        try {
            const res = await tryNativeFetch(unsafeWindow.fetch, unsafeWindow);
            if (res && res.status > 0) {
                sawHttpResult = true;
                if (res.ok || res.status === 404) {
                    return { res, transportFailed: false };
                }
            }
        } catch (_) {}
    }

    // 通道 3: GM_xmlhttpRequest 兜底（由 Stay / Tampermonkey 原生网络栈携带 Cookie 发起请求）
    const gmFn = gmRequestFn || (typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null);
    if (gmFn) {
        const gmRes = await probeViaGM(candidateUrl, gmFn);
        if (gmRes && gmRes.status > 0) {
            return { res: gmRes, transportFailed: false };
        }
    }

    return { res: null, transportFailed: !sawHttpResult };
}

/**
 * Tier 2: 同源轻量探活候选无码版 URL
 * @param {string} candidateUrl
 * @param {string} avCode
 * @param {Function|null} fetchFn
 * @param {Function|null} [gmRequestFn=null]
 * @returns {Promise<{ url: string | null, transportFailed: boolean }>}
 */
export async function probeUncensoredCandidate(candidateUrl, avCode, fetchFn, gmRequestFn = null) {
    try {
        const { res, transportFailed } = await fetchCandidateResponse(candidateUrl, fetchFn, gmRequestFn);
        if (!res || !res.ok || res.status < 200 || res.status >= 300) {
            try { res?.body?.cancel?.(); } catch (_) {}
            return { url: null, transportFailed };
        }

        const finalUrl = res.url || candidateUrl;
        if (!/uncensored/i.test(finalUrl)) {
            try { res?.body?.cancel?.(); } catch (_) {}
            return { url: null, transportFailed: false };
        }
        if (extractAvCodeFromUrlOnly(finalUrl) !== avCode) {
            try { res?.body?.cancel?.(); } catch (_) {}
            return { url: null, transportFailed: false };
        }

        if (typeof res.text === 'function') {
            const html = await res.text();
            if (!isValidUncensoredHtml(html, avCode)) {
                return { url: null, transportFailed: false };
            }
        } else {
            try { res?.body?.cancel?.(); } catch (_) {}
        }

        return { url: finalUrl, transportFailed: false };
    } catch (_) {
        return { url: null, transportFailed: true };
    }
}

export function navigateToUncensoredUrl(win, targetUrl) {
    if (!win?.location || !targetUrl) return;
    try {
        if (typeof win.location.replace === 'function') {
            win.location.replace(targetUrl);
            return;
        }
    } catch (_) {}
    win.location.href = targetUrl;
}

export class UncensoredSwitcher {
    constructor() {
        this._isChecking = false;
        this._syncBound = false;
    }

    /**
     * 查找当前 MissAV 影片对应的无码版页面地址
     * @param {Object} [options]
     * @param {boolean} [options.force=false] 是否忽略当前会话已探测缓存
     * @param {boolean} [options.allowInTheater=false] 是否允许在影院激活态下探测
     * @param {boolean} [options.navigate=true] 找到后是否立即执行页面跳转
     * @param {Window} [options.win]
     * @param {Document} [options.doc]
     * @param {Function|null} [options.fetchFn]
     * @param {Function|null} [options.gmRequestFn]
     * @param {Storage} [options.storage]
     * @returns {Promise<{ found: boolean, url: string | null, reason?: string }>}
     */
    async checkAndSwitch({
        force = false,
        allowInTheater = false,
        navigate = true,
        win = typeof window !== 'undefined' ? window : null,
        doc = typeof document !== 'undefined' ? document : null,
        fetchFn = null,
        gmRequestFn = null,
        storage = typeof sessionStorage !== 'undefined' ? sessionStorage : null
    } = {}) {
        if (this._isChecking || !win?.location?.href) {
            return { found: false, url: null, reason: 'busy_or_no_window' };
        }

        const currentUrl = win.location.href;
        const pageInfo = parseMissavVideoPage(currentUrl);
        if (!pageInfo) {
            return { found: false, url: null, reason: 'ineligible_page' };
        }

        if (!allowInTheater && doc?.body?.classList?.contains?.('tm-player-active')) {
            return { found: false, url: null, reason: 'theater_active' };
        }

        const sessionKey = `${SESSION_KEY_PREFIX}${pageInfo.avCode}`;
        try {
            if (!force && storage?.getItem?.(sessionKey)) {
                return { found: false, url: null, reason: 'already_checked' };
            }
        } catch (_) {}

        this._isChecking = true;
        try {
            // 1. 优先从页面 DOM 零请求探测同番号无码版链接
            let targetUrl = findUncensoredLinkInDocument(doc, currentUrl, pageInfo.avCode);
            let allTransportsFailed = false;

            // 2. 回退至同源轻量候选 URL 探测（限制最多探测前 4 个最高概率候选）
            if (!targetUrl) {
                const candidates = buildUncensoredCandidateUrls(currentUrl).slice(0, 4);
                allTransportsFailed = candidates.length > 0;
                for (const candidate of candidates) {
                    const probe = await probeUncensoredCandidate(candidate, pageInfo.avCode, fetchFn, gmRequestFn);
                    if (!probe.transportFailed) {
                        allTransportsFailed = false;
                    }
                    if (probe.url) {
                        targetUrl = probe.url;
                        break;
                    }
                }
            }

            if (targetUrl && targetUrl !== currentUrl) {
                try { storage?.setItem?.(sessionKey, 'redirected'); } catch (_) {}
                if (navigate) {
                    if (!allowInTheater && doc?.body?.classList?.contains?.('tm-player-active')) {
                        return { found: true, url: targetUrl, reason: 'theater_active_deferred' };
                    }
                    navigateToUncensoredUrl(win, targetUrl);
                }
                return { found: true, url: targetUrl };
            }

            // 仅在得到确定 HTTP 响应时缓存 none，传输层异常时不毒化当前会话缓存
            if (!allTransportsFailed) {
                try { storage?.setItem?.(sessionKey, 'none'); } catch (_) {}
            }
            return { found: false, url: null, reason: allTransportsFailed ? 'network_error' : 'not_found' };
        } finally {
            this._isChecking = false;
        }
    }

    setupAutoSwitch() {
        if (typeof window === 'undefined' || window.self !== window.top) return;

        const triggerIfEnabled = () => {
            const enabled = getValue('autoUncensored', false);
            if (enabled !== true && enabled !== 'true') return;
            if (!parseMissavVideoPage(window.location?.href)) return;
            this.checkAndSwitch({ force: false, allowInTheater: false, navigate: true }).catch(() => {});
        };

        // 监听云同步落盘事件（若手机端通过 WebDAV 自动同步刚拉取到开启状态，立即补检一次）
        if (!this._syncBound) {
            this._syncBound = true;
            window.addEventListener('mp_sync_applied', () => {
                triggerIfEnabled();
            });
        }

        const enabled = getValue('autoUncensored', false);
        if (enabled !== true && enabled !== 'true') return;
        if (!parseMissavVideoPage(window.location?.href)) return;

        setTimeout(triggerIfEnabled, 80);
    }
}
