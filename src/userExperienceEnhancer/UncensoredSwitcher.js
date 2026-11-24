import { isSiteDomain } from '../constants/domains.js';
import { getVideoCodeFromUrl, matchAvCodeFromText, NON_AV_ROUTE_SLUGS, LANGUAGE_SLUGS } from '../utils/videoCode.js';
import { getValue } from '../utils/storage.js';
import { findVideoElement } from '../utils/dom.js';
import { Toast } from '../utils/ui-feedback.js';
import { QualityManager } from './QualityManager.js';

const STRIP_SUFFIX_RE = /(?:[-_](?:chinese[-_]?subtitles?|chinese[-_]?sub|subtitles?|sub|ch|c|4k|fhd|hd|reduced[-_]mosaic))+$/i;
const REDIRECT_LOOP_KEY_PREFIX = 'mp_uncensored_nav_ts_';
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function intToBase(num, base) {
    if (num === 0) return '0';
    const b = Math.min(base, BASE62_CHARS.length);
    let n = num;
    let out = '';
    while (n > 0) {
        out = BASE62_CHARS[n % b] + out;
        n = Math.floor(n / b);
    }
    return out;
}

/**
 * 解包 Dean Edwards P.A.C.K.E.R. 混淆脚本（提取 MissAV 页面内嵌流地址）
 * @param {string} packed
 * @returns {string}
 */
export function unpackPackerJs(packed) {
    if (!packed || typeof packed !== 'string') return '';
    const rePacker = /\}\s*\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\.split\('\|'\)/g;
    let result = packed;
    let match;
    while ((match = rePacker.exec(packed)) !== null) {
        const payload = match[1];
        const radix = parseInt(match[2], 10);
        const rawCount = parseInt(match[3], 10);
        const rawKeywords = match[4];
        if (!radix || radix <= 0 || radix > 62 || Number.isNaN(rawCount)) continue;

        const keywords = rawKeywords.split('|');
        const count = Math.min(rawCount, keywords.length);
        const lookup = new Map();
        for (let i = 0; i < count; i++) {
            const word = keywords[i];
            if (word) {
                lookup.set(intToBase(i, radix), word);
            }
        }

        const unpacked = payload
            .replace(/\b\w+\b/g, (token) => (lookup.has(token) ? lookup.get(token) : token))
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\');
        result = result.replace(match[0], unpacked);
    }
    return result;
}

/**
 * 从 MissAV 视频详情页 HTML 中提取主 m3u8 播放列表地址
 * @param {string} html
 * @returns {string}
 */
export function extractMissavPlaylistUrl(html) {
    if (!html || typeof html !== 'string') return '';
    const tryExtract = (text) => {
        const mSurrit = text.match(/(https?:\/\/(?:[a-zA-Z0-9_\-.]+\.)?surrit\.com\/[a-f0-9-]+\/playlist\.m3u8)/i);
        if (mSurrit) return mSurrit[1];
        const mUrls = text.match(/urls\s*:\s*\[\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
        if (mUrls) return mUrls[1];
        const mSource = text.match(/(?:source|src|playlist)\s*[:=]\s*['"](https?:\/\/[^'"]+playlist\.m3u8[^'"]*)['"]/i);
        if (mSource) return mSource[1];
        const mM3u8 = text.match(/(https?:\/\/[^'"\s<>]+playlist\.m3u8[^'"\s<>]*)/i);
        if (mM3u8) return mM3u8[1];
        return '';
    };

    const direct = tryExtract(html);
    if (direct) return direct;

    const unpacked = unpackPackerJs(html);
    const fromUnpacked = tryExtract(unpacked);
    if (fromUnpacked) return fromUnpacked;

    // 仅当存在解包出的视频脚本上下文时，使用 UUID 拼装 surrit 标准流地址
    if (unpacked !== html) {
        const mUuid = unpacked.match(/['"]([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})['"]/i);
        if (mUuid) {
            return `https://surrit.com/${mUuid[1]}/playlist.m3u8`;
        }
    }
    return '';
}

/**
 * 判断主机名是否属于 MissAV（包含官方与常见镜像域名）
 * @param {string} hostname
 * @returns {boolean}
 */
export function isMissavHost(hostname) {
    if (!hostname || typeof hostname !== 'string') return false;
    return isSiteDomain('MISSAV', hostname) || /(?:^|\.)(?:missav[^.]*|thisav[^.]*)\./i.test(hostname);
}

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

function isValidUncensoredHtml(html, avCode) {
    if (!html || typeof html !== 'string') return true;
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    if (/(?:404\s*not\s*found|page\s*not\s*found|error\s*404|找不到页面|頁面不存在)/i.test(title)) {
        return false;
    }
    if (/Just a moment|cf-chl|Attention Required/i.test(html) && !html.toLowerCase().includes(avCode.toLowerCase())) {
        return false;
    }
    const lowerHtml = html.toLowerCase();
    if (!lowerHtml.includes(avCode.toLowerCase()) && !lowerHtml.includes(avCode.replace(/-/g, '').toLowerCase())) {
        return false;
    }
    return true;
}

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
            return thisObj ? await fn.call(thisObj, candidateUrl, opts) : await fn(candidateUrl, opts);
        } finally {
            if (timer) clearTimeout(timer);
        }
    };

    let sawHttpResult = false;

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
 * 探测并抓取候选无码版页面（同时提取内嵌 m3u8 流地址）
 * @param {string} candidateUrl
 * @param {string} avCode
 * @param {Function|null} fetchFn
 * @param {Function|null} [gmRequestFn=null]
 * @returns {Promise<{ url: string | null, streamUrl: string, transportFailed: boolean }>}
 */
export async function probeUncensoredCandidate(candidateUrl, avCode, fetchFn, gmRequestFn = null) {
    try {
        const { res, transportFailed } = await fetchCandidateResponse(candidateUrl, fetchFn, gmRequestFn);
        if (!res || !res.ok || res.status < 200 || res.status >= 300) {
            try { res?.body?.cancel?.(); } catch (_) {}
            return { url: null, streamUrl: '', transportFailed };
        }

        const finalUrl = res.url || candidateUrl;
        if (!/uncensored/i.test(finalUrl)) {
            try { res?.body?.cancel?.(); } catch (_) {}
            return { url: null, streamUrl: '', transportFailed: false };
        }
        if (extractAvCodeFromUrlOnly(finalUrl) !== avCode) {
            try { res?.body?.cancel?.(); } catch (_) {}
            return { url: null, streamUrl: '', transportFailed: false };
        }

        let streamUrl = '';
        if (typeof res.text === 'function') {
            const html = await res.text();
            if (!isValidUncensoredHtml(html, avCode)) {
                return { url: null, streamUrl: '', transportFailed: false };
            }
            streamUrl = extractMissavPlaylistUrl(html);
        } else {
            try { res?.body?.cancel?.(); } catch (_) {}
        }

        return { url: finalUrl, streamUrl, transportFailed: false };
    } catch (_) {
        return { url: null, streamUrl: '', transportFailed: true };
    }
}

/**
 * 收集页面上关联的 Hls.js 实例
 */
function findHlsInstanceForVideo(video, win) {
    const candidates = [
        video?.hls,
        win?.hls,
        typeof window !== 'undefined' ? window.hls : null,
        win?.player?.hls,
        typeof window !== 'undefined' ? window.player?.hls : null
    ];
    if (typeof unsafeWindow !== 'undefined' && unsafeWindow) {
        try {
            candidates.push(unsafeWindow.hls, unsafeWindow.player?.hls);
        } catch (_) {}
    }
    try {
        const alpineHost = video?.closest?.('[x-data]');
        if (alpineHost?._x_dataStack) {
            for (const ctx of alpineHost._x_dataStack) {
                if (ctx?.hls) candidates.push(ctx.hls);
            }
        }
        if (alpineHost?.__x?.$data?.hls) {
            candidates.push(alpineHost.__x.$data.hls);
        }
    } catch (_) {}

    for (const inst of candidates) {
        if (inst && typeof inst.loadSource === 'function') {
            return inst;
        }
    }
    return null;
}

/**
 * 原地替换当前页视频流（无需刷新跳转，优先适配 iOS Safari 原生 HLS 与可访问 Hls.js 实例）
 * @param {string} streamUrl
 * @param {{ video?: HTMLVideoElement, win?: any }} [opts]
 * @returns {boolean}
 */
export function replaceVideoStreamInPlace(streamUrl, { video = null, win = typeof window !== 'undefined' ? window : null } = {}) {
    if (!streamUrl) return false;
    const targetVideo = video || findVideoElement(false);
    if (!targetVideo) return false;

    if (targetVideo.dataset?.mpUncensoredUrl === streamUrl) {
        return true;
    }

    const wasPlaying = !targetVideo.paused;
    const prevTime = Number(targetVideo.currentTime) || 0;
    const prevRate = Number(targetVideo.playbackRate) || 1;
    const prevMuted = Boolean(targetVideo.muted);

    const hls = findHlsInstanceForVideo(targetVideo, win);
    if (hls) {
        try {
            hls.loadSource(streamUrl);
            if (hls.media !== targetVideo && typeof hls.attachMedia === 'function') {
                hls.attachMedia(targetVideo);
            }
            if (targetVideo.dataset) {
                targetVideo.dataset.mpUncensoredApplied = '1';
                targetVideo.dataset.mpUncensoredUrl = streamUrl;
            }
            if (prevTime > 3 && typeof targetVideo.addEventListener === 'function') {
                const restoreTime = () => {
                    try {
                        if (Math.abs((targetVideo.currentTime || 0) - prevTime) > 3) {
                            targetVideo.currentTime = prevTime;
                        }
                        targetVideo.playbackRate = prevRate;
                    } catch (_) {}
                };
                targetVideo.addEventListener('loadedmetadata', restoreTime, { once: true });
            }
            if (wasPlaying && typeof targetVideo.play === 'function') {
                targetVideo.play().catch(() => {});
            }
            if (typeof targetVideo.addEventListener === 'function') {
                targetVideo.addEventListener('loadedmetadata', () => {
                    try {
                        const qm = new QualityManager();
                        if (qm.isAutoQualityEnabled()) {
                            qm.applyNow();
                        }
                    } catch (_) {}
                }, { once: true });
            }
            return true;
        } catch (_) {}
    }

    // iOS / macOS Safari 原生 HLS：直接替换 <video>.src 并重载
    const canNativeHls = typeof targetVideo.canPlayType === 'function' && (
        Boolean(targetVideo.canPlayType('application/vnd.apple.mpegurl')) ||
        Boolean(targetVideo.canPlayType('application/x-mpegURL'))
    );
    if (!canNativeHls) {
        return false;
    }

    try {
        if (typeof targetVideo.querySelectorAll === 'function') {
            targetVideo.querySelectorAll('source').forEach((s) => {
                try { s.remove(); } catch (_) {}
            });
        }
        targetVideo.src = streamUrl;
        if (typeof targetVideo.load === 'function') {
            targetVideo.load();
        }
        targetVideo.muted = prevMuted;
        targetVideo.playbackRate = prevRate;

        if (targetVideo.dataset) {
            targetVideo.dataset.mpUncensoredApplied = '1';
            targetVideo.dataset.mpUncensoredUrl = streamUrl;
        }

        if (typeof targetVideo.addEventListener === 'function') {
            const onReady = () => {
                try {
                    targetVideo.playbackRate = prevRate;
                    if (prevTime > 3 && Math.abs((targetVideo.currentTime || 0) - prevTime) > 3) {
                        targetVideo.currentTime = prevTime;
                    }
                    if (wasPlaying && targetVideo.paused && typeof targetVideo.play === 'function') {
                        targetVideo.play().catch(() => {});
                    }
                } catch (_) {}
            };
            targetVideo.addEventListener('loadedmetadata', onReady, { once: true });
        }

        if (wasPlaying && typeof targetVideo.play === 'function') {
            targetVideo.play().catch(() => {});
        }
        return true;
    } catch (_) {
        return false;
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

async function waitForVideoReady(doc, maxWaitMs = 2500) {
    const start = Date.now();
    while (Date.now() - start <= maxWaitMs) {
        const video = findVideoElement(false);
        if (video && (video.currentSrc || video.src || video.querySelector?.('source'))) {
            return video;
        }
        await new Promise((r) => setTimeout(r, 150));
    }
    return findVideoElement(false);
}

export class UncensoredSwitcher {
    constructor() {
        this._isChecking = false;
        this._syncBound = false;
    }

    /**
     * 检测无码版并优先原地替换当前视频流；无法原地替换时回退至跳转到无码页
     * @param {Object} [options]
     * @param {boolean} [options.force=false]
     * @param {boolean} [options.allowInTheater=false]
     * @param {boolean} [options.navigate=true] 当原地替换不可用时是否回退到整页跳转
     * @param {boolean} [options.preferInPlace=true] 是否优先原地替换视频流
     * @param {Window} [options.win]
     * @param {Document} [options.doc]
     * @param {Function|null} [options.fetchFn]
     * @param {Function|null} [options.gmRequestFn]
     * @param {Storage} [options.storage]
     * @param {HTMLVideoElement|null} [options.video]
     * @returns {Promise<{ found: boolean, mode?: 'stream'|'navigate', url: string | null, streamUrl?: string, reason?: string }>}
     */
    async checkAndSwitch({
        force = false,
        allowInTheater = false,
        navigate = true,
        preferInPlace = true,
        win = typeof window !== 'undefined' ? window : null,
        doc = typeof document !== 'undefined' ? document : null,
        fetchFn = null,
        gmRequestFn = null,
        storage = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        video = null
    } = {}) {
        if (this._isChecking || !win?.location?.href) {
            return { found: false, url: null, reason: 'busy_or_no_window' };
        }

        const currentUrl = win.location.href;
        const pageInfo = parseMissavVideoPage(currentUrl);
        if (!pageInfo) {
            return { found: false, url: null, reason: 'ineligible_page' };
        }

        const targetVideo = video || (typeof document !== 'undefined' ? findVideoElement(false) : null);
        if (!force && targetVideo?.dataset?.mpUncensoredApplied === '1') {
            return { found: true, mode: 'stream', url: currentUrl, streamUrl: targetVideo.dataset.mpUncensoredUrl || '', reason: 'already_applied' };
        }

        if (!allowInTheater && doc?.body?.classList?.contains?.('tm-player-active')) {
            return { found: false, url: null, reason: 'theater_active' };
        }

        this._isChecking = true;
        try {
            const domMatch = findUncensoredLinkInDocument(doc, currentUrl, pageInfo.avCode);
            const candidates = domMatch
                ? [domMatch, ...buildUncensoredCandidateUrls(currentUrl).filter((u) => u !== domMatch)].slice(0, 4)
                : buildUncensoredCandidateUrls(currentUrl).slice(0, 4);

            let targetUrl = null;
            let streamUrl = '';
            let allTransportsFailed = candidates.length > 0;

            for (const candidate of candidates) {
                const probe = await probeUncensoredCandidate(candidate, pageInfo.avCode, fetchFn, gmRequestFn);
                if (!probe.transportFailed) {
                    allTransportsFailed = false;
                }
                if (probe.url) {
                    targetUrl = probe.url;
                    streamUrl = probe.streamUrl || '';
                    break;
                }
            }

            // 即使探活仅靠 DOM 命中且未知 streamUrl，如果 DOM 命中但所有 fetch 异常，仍允许跳转兜底
            if (!targetUrl && domMatch) {
                targetUrl = domMatch;
            }

            if (targetUrl && targetUrl !== currentUrl) {
                // 1. 优先原地替换视频流（iOS Safari 原生 HLS / 可访问 Hls.js 实例）
                if (preferInPlace && streamUrl) {
                    const readyVideo = video || (typeof document !== 'undefined' ? await waitForVideoReady(doc) : null);
                    if (readyVideo && replaceVideoStreamInPlace(streamUrl, { video: readyVideo, win })) {
                        return { found: true, mode: 'stream', url: targetUrl, streamUrl };
                    }
                }

                // 2. 无法原地替换时（如 Chrome 闭包 Hls.js），回退至整页跳转（带 10 秒防连续回跳保护，不永久封锁同会话）
                const navKey = `${REDIRECT_LOOP_KEY_PREFIX}${pageInfo.avCode}`;
                try {
                    const lastNav = Number(storage?.getItem?.(navKey) || 0);
                    if (!force && lastNav && (Date.now() - lastNav) < 10000) {
                        return { found: false, url: targetUrl, reason: 'recent_redirect_guard' };
                    }
                } catch (_) {}

                if (navigate) {
                    if (!allowInTheater && doc?.body?.classList?.contains?.('tm-player-active')) {
                        return { found: true, mode: 'navigate', url: targetUrl, streamUrl, reason: 'theater_active_deferred' };
                    }
                    try { storage?.setItem?.(navKey, String(Date.now())); } catch (_) {}
                    navigateToUncensoredUrl(win, targetUrl);
                }
                return { found: true, mode: 'navigate', url: targetUrl, streamUrl };
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
            this.checkAndSwitch({ force: false, allowInTheater: false, navigate: true, preferInPlace: true }).then((res) => {
                if (res?.found && res.mode === 'stream' && res.reason !== 'already_applied') {
                    Toast('已自动切换至无码版视频流', 2200, 'success');
                }
            }).catch(() => {});
        };

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
