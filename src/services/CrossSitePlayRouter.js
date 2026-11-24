/**
 * 跨站播放双轨路由器 (CrossSitePlayRouter)
 *
 * 为纯索引站（如 ltxlib.dpdns.org，强 CSP 禁止同页加载外部媒体/Blob/Worker/Iframe）
 * 提供双轨自适应跨站播放能力：
 *   - 轨道 A（网关主轨）：若用户配置了 miss-gateway 且 /health 可达，直接打开同源影院页
 *     {GATEWAY}/v1/{TOKEN}/watch/{CODE}#title=...&poster=...
 *     网关负责 123AV/JAVVerse/MissAV/Jable 寻源、Referer 注入与 HLS 代理，零广告零 CSP 冲突。
 *   - 轨道 B（纯脚本备轨）：无网关或网关不可达时，客户端通过 GM_xmlhttpRequest 对
 *     123AV / JAVVerse / MissAV / Jable 进行轻量页面探活（含 IsEquivalentCode 防假阳性），
 *     写入 60s 一次性跨站租约后新标签打开目标站，并由 Miss Player 自动拉起影院模式。
 */

import { getSiteDomains } from '../constants/domains.js';
import { getValue, setValue } from '../utils/storage.js';
import { cleanAvCode } from '../utils/videoCode.js';

export const CROSS_SITE_HANDOFF_KEY = 'mp_cross_site_handoff';
export const CROSS_SITE_HANDOFF_TTL_MS = 60 * 1000;
const RESOLVE_CACHE_TTL_MS = 30 * 60 * 1000;
const CF_COOLDOWN_MS = 15 * 60 * 1000;
const GATEWAY_HEALTH_TTL_MS = 15 * 1000;
const THEATER_HASH_PARAM = 'mp_theater';
const PEACH_KEY_GATEWAY_BASE = 'mp_peach_gateway_base';
const PEACH_KEY_REMOTE_SCRAPER = 'mp_peach_remote_scraper';
const PEACH_KEY_GATEWAY_TOKEN = 'mp_peach_gateway_token';

const KNOWN_SUFFIX_RE = /(?:[-_](?:uncensored(?:[-_]leaked|[-_]leak)?|leaked|leak|chinese|sub|ch|c|4k|hd|fhd|reduced[-_]mosaic))+$/i;
const STANDARD_CODE_RE = /^([a-z]{2,8}|\d{3}[a-z]{2,6})[-_ ]*0*(\d+)$/i;
const FC2_CODE_RE = /^(?:fc2[-_ ]*)?(?:ppv[-_ ]*)?(\d{5,8})$/i;
const DATE_CODE_RE = /^(\d{6})[-_ ](\d{3})$/;
const TOKYO_HOT_RE = /^(cz|n|k)(\d{4})$/i;

export const CROSS_SITE_SOURCES = [
    { id: '123av', label: '123AV', weight: 100, delayMs: 0 },
    { id: 'javverse', label: 'JAVVerse', weight: 90, delayMs: 0 },
    { id: 'missav', label: 'MissAV', weight: 80, delayMs: 250 },
    { id: 'jable', label: 'Jable', weight: 50, delayMs: 350 }
];

function extractSlug(raw) {
    let s = String(raw || '').trim();
    if (s.includes('/')) {
        try {
            if (/^https?:\/\//i.test(s)) {
                s = new URL(s).pathname || s;
            }
        } catch (_) {}
        s = s.replace(/\/+$/, '');
        const parts = s.split('/');
        if (parts.length > 0) s = parts[parts.length - 1];
    }
    const dotIdx = s.lastIndexOf('.');
    if (dotIdx !== -1 && dotIdx > s.length - 6) {
        s = s.slice(0, dotIdx);
    }
    return s.trim();
}

/**
 * 提取结构化番号核心（对齐 miss-gateway/internal/source/matcher.go）
 */
export function extractCodeCore(raw) {
    let clean = extractSlug(raw).replace(KNOWN_SUFFIX_RE, '').trim();
    if (!clean) return null;

    let m = clean.match(FC2_CODE_RE);
    if (m) return { prefix: 'FC2', number: m[1], type: 'FC2' };

    m = clean.match(DATE_CODE_RE);
    if (m) return { prefix: m[1], number: m[2], type: 'DATE' };

    m = clean.match(TOKYO_HOT_RE);
    if (m) return { prefix: m[1].toUpperCase(), number: m[2], type: 'TOKYO_HOT' };

    m = clean.match(STANDARD_CODE_RE);
    if (m) {
        return { prefix: m[1].toUpperCase(), number: m[2] || '0', type: 'STANDARD' };
    }
    return null;
}

/**
 * 严格番号等价核验，防止搜索页 WSP-1010 等子串假阳性冒充 WSP-101
 */
export function isEquivalentAvCode(targetCode, candidate) {
    const coreT = extractCodeCore(targetCode);
    const coreC = extractCodeCore(candidate);
    if (coreT && coreC) {
        return coreT.prefix === coreC.prefix &&
            coreT.number === coreC.number &&
            coreT.type === coreC.type;
    }

    const norm = (v) => extractSlug(v).replace(KNOWN_SUFFIX_RE, '').replace(/[-_\s]/g, '').toUpperCase();
    const nt = norm(targetCode);
    const nc = norm(candidate);
    return Boolean(nt && nt === nc);
}

function normalizeCode(rawCode) {
    const upper = String(rawCode || '').trim().toUpperCase();
    return cleanAvCode(upper) || upper;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCloudflareBlocked(status, html = '') {
    if (status === 403 || status === 503) return true;
    if (!html) return false;
    const lower = String(html).toLowerCase();
    return lower.includes('cf-challenge') ||
        lower.includes('turnstile') ||
        lower.includes('checking your browser') ||
        lower.includes('cloudflare');
}

function defaultTransport(url, options = {}) {
    const { method = 'GET', headers = {}, timeout = 8000, body = null, preferGM = false } = options;
    const isSameOrigin = (() => {
        try {
            const targetHost = new URL(url).hostname;
            return typeof location !== 'undefined' && location.hostname === targetHost;
        } catch {
            return false;
        }
    })();

    const doGMRequest = () => {
        if (typeof GM_xmlhttpRequest === 'function') {
            return new Promise((resolve, reject) => {
                let completed = false;
                let req = null;
                const timer = setTimeout(() => {
                    if (!completed) {
                        completed = true;
                        if (req && req.abort) req.abort();
                        reject(new Error('NETWORK_TIMEOUT'));
                    }
                }, timeout);

                req = GM_xmlhttpRequest({
                    method,
                    url,
                    headers,
                    data: body,
                    timeout,
                    onload: (res) => {
                        if (completed) return;
                        completed = true;
                        clearTimeout(timer);
                        resolve({ status: res.status, html: res.responseText || '', finalUrl: res.finalUrl || url });
                    },
                    onerror: (err) => {
                        if (completed) return;
                        completed = true;
                        clearTimeout(timer);
                        reject(new Error((err && err.statusText) || 'NETWORK_ERROR'));
                    },
                    ontimeout: () => {
                        if (completed) return;
                        completed = true;
                        clearTimeout(timer);
                        reject(new Error('NETWORK_TIMEOUT'));
                    }
                });
            });
        }
        return Promise.reject(new Error('NO_TRANSPORT_AVAILABLE'));
    };

    if (!preferGM && isSameOrigin && typeof fetch === 'function') {
        return fetch(url, { method, headers, body })
            .then(async (res) => ({ status: res.status, html: await res.text(), finalUrl: res.url }))
            .catch(() => doGMRequest());
    }
    return doGMRequest();
}

function extractHost(url) {
    try {
        return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
        return '';
    }
}

function isKnownPlayDomain(hostname) {
    const host = String(hostname || '').toLowerCase();
    if (!host) return false;
    const knownHosts = [
        '123av.com',
        'javverse.com',
        ...getSiteDomains('MISSAV'),
        ...getSiteDomains('JABLE')
    ];
    return knownHosts.some((d) => host === d || host.endsWith('.' + d));
}

function getGatewayEndpoint() {
    let base = String(getValue(PEACH_KEY_GATEWAY_BASE, '') || getValue(PEACH_KEY_REMOTE_SCRAPER, '') || '').trim();
    if (!base) return null;
    base = base.replace(/\/api\/resolve\/?.*$/, '').replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(base)) return null;
    const token = String(getValue(PEACH_KEY_GATEWAY_TOKEN, 'dev') || 'dev').trim() || 'dev';
    return { base, token };
}

export class CrossSitePlayRouter {
    static _resolveCache = new Map();
    static _inflightPreviews = new Map();
    static _cfBlockedUntil = new Map();
    static _gatewayProbeCache = { base: '', ok: false, checkedAt: 0 };
    static _notifier = null;

    static setNotifier(fn) {
        this._notifier = typeof fn === 'function' ? fn : null;
    }

    static notify(msg, duration = 2400, type = 'info') {
        if (this._notifier) {
            this._notifier(msg, duration, type);
        }
    }

    static setGatewayConfig({ base = '', token = 'dev' } = {}) {
        const cleanBase = String(base || '').trim().replace(/\/+$/, '');
        const cleanToken = String(token || 'dev').trim() || 'dev';
        setValue(PEACH_KEY_GATEWAY_BASE, cleanBase);
        setValue(PEACH_KEY_GATEWAY_TOKEN, cleanToken);
        this._gatewayProbeCache = { base: '', ok: false, checkedAt: 0 };
    }

    /**
     * 轻量探活 miss-gateway /health（15s 内复用结果）
     */
    static async probeGatewayHealth(force = false, transport = defaultTransport) {
        const gw = getGatewayEndpoint();
        if (!gw) return { reachable: false, gateway: null };

        const now = Date.now();
        if (!force &&
            this._gatewayProbeCache.base === gw.base &&
            now - this._gatewayProbeCache.checkedAt < GATEWAY_HEALTH_TTL_MS) {
            return { reachable: this._gatewayProbeCache.ok, gateway: gw };
        }

        let ok = false;
        try {
            const res = await transport(`${gw.base}/health`, { preferGM: true, timeout: 900 });
            ok = res && res.status >= 200 && res.status < 400;
        } catch (_) {
            ok = false;
        }

        this._gatewayProbeCache = { base: gw.base, ok, checkedAt: now };
        return { reachable: ok, gateway: gw };
    }

    static isGatewayConfigured() {
        return Boolean(getGatewayEndpoint());
    }

    /**
     * 构造轨道 A 网关同源影院页 URL（title/poster 置于 #hash，不进服务端日志）
     */
    static buildGatewayWatchUrl(gateway, code, { sourceId = '', title = '', poster = '' } = {}) {
        const cleanCode = normalizeCode(code);
        const query = sourceId ? `?src=${encodeURIComponent(sourceId)}` : '';
        const hashParams = new URLSearchParams();
        if (title) hashParams.set('title', String(title).slice(0, 120));
        if (poster && /^https?:\/\//i.test(poster)) hashParams.set('poster', poster);
        const hash = hashParams.toString();
        return `${gateway.base}/v1/${encodeURIComponent(gateway.token)}/watch/${encodeURIComponent(cleanCode)}${query}${hash ? '#' + hash : ''}`;
    }

    /**
     * 写入跨站影院接力租约（60 秒有效，消费即销毁）
     */
    static writeHandoffLease({ code, source, targetUrl, title = '', poster = '' }) {
        setValue(CROSS_SITE_HANDOFF_KEY, {
            code: normalizeCode(code),
            source: source || '',
            targetUrl: targetUrl || '',
            title: String(title || '').slice(0, 120),
            poster: poster || '',
            createdAt: Date.now()
        });
    }

    /**
     * 为跨站直达链接附加 #mp_theater=1 接力标记，支持不同脚本沙箱间无共享存储自动拉起影院模式
     */
    static appendTheaterHash(url) {
        const raw = String(url || '').trim();
        if (!raw) return raw;
        const hashIdx = raw.indexOf('#');
        if (hashIdx === -1) {
            return `${raw}#${THEATER_HASH_PARAM}=1`;
        }
        const existingHash = raw.slice(hashIdx + 1);
        if (existingHash.includes(`${THEATER_HASH_PARAM}=`)) return raw;
        return existingHash
            ? `${raw}&${THEATER_HASH_PARAM}=1`
            : `${raw}${THEATER_HASH_PARAM}=1`;
    }

    /**
     * 在目标播放站消费 URL hash 中的 #mp_theater=1 接力标记并清理地址栏
     */
    static consumeTheaterHash(loc = (typeof location !== 'undefined' ? location : null)) {
        try {
            if (!loc || !isKnownPlayDomain(loc.hostname)) return false;
            const hash = String(loc.hash || '');
            if (!hash || !hash.includes(`${THEATER_HASH_PARAM}=1`)) return false;

            const rawParams = hash.replace(/^#/, '');
            const kept = rawParams
                .split('&')
                .filter((part) => part && part !== `${THEATER_HASH_PARAM}=1`);
            const nextHash = kept.length > 0 ? `#${kept.join('&')}` : '';
            if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
                history.replaceState(null, '', `${loc.pathname || '/'}${loc.search || ''}${nextHash}`);
            }
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * 在目标站点消费跨站接力租约，决定是否自动拉起 Miss Player 影院模式
     */
    static consumeHandoffLease(hostname = (typeof location !== 'undefined' ? location.hostname : '')) {
        try {
            const raw = getValue(CROSS_SITE_HANDOFF_KEY, null);
            if (!raw || typeof raw !== 'object') return null;

            const age = Date.now() - Number(raw.createdAt || 0);
            if (age < 0 || age > CROSS_SITE_HANDOFF_TTL_MS) {
                setValue(CROSS_SITE_HANDOFF_KEY, null);
                return null;
            }

            // 仅在匹配目标来源域名（或目标 URL 宿主）时消费，避免误伤用户在其它站点浏览
            const host = String(hostname || '').toLowerCase();
            if (!host) return null;
            let matchesTarget = false;
            try {
                if (raw.targetUrl) {
                    const targetHost = new URL(raw.targetUrl).hostname.toLowerCase();
                    if (host === targetHost || host.endsWith('.' + targetHost) || targetHost.endsWith('.' + host)) {
                        matchesTarget = true;
                    }
                }
            } catch (_) {}

            if (!matchesTarget) {
                matchesTarget = isKnownPlayDomain(host);
            }

            if (!matchesTarget) return null;

            // 一次性消费后立即清零
            setValue(CROSS_SITE_HANDOFF_KEY, null);
            return raw;
        } catch (_) {
            return null;
        }
    }

    /**
     * 123AV 轻量探活（优先无码流出）
     */
    static async probe123Av(code, transport = defaultTransport) {
        const lower = normalizeCode(code).toLowerCase();
        const candidates = [
            { url: `https://123av.com/cn/v/${lower}-uncensored-leaked`, variant: '无码流出' },
            { url: `https://123av.com/cn/v/${lower}`, variant: '普通版' }
        ];
        const hasEmbed = (html) => /https?:\/\/[a-zA-Z0-9_.\-:]+\/e\/[a-zA-Z0-9_\-]+/.test(String(html || '').replace(/\\/g, ''));

        for (const item of candidates) {
            try {
                const res = await transport(item.url, {
                    preferGM: true,
                    timeout: 4500,
                    headers: { Referer: 'https://123av.com/' }
                });
                if (res && res.status === 200 && hasEmbed(res.html)) {
                    return { sourceId: '123av', sourceName: `123AV (${item.variant})`, url: res.finalUrl || item.url, weight: 100 };
                }
            } catch (_) {}
        }

        // 搜索页兜底
        try {
            const searchUrl = `https://123av.com/cn/search?keyword=${encodeURIComponent(lower)}`;
            const sRes = await transport(searchUrl, {
                preferGM: true,
                timeout: 4500,
                headers: { Referer: 'https://123av.com/' }
            });
            if (sRes && sRes.status === 200 && sRes.html) {
                const slugs = [...sRes.html.matchAll(/\/cn\/v\/([a-zA-Z0-9_\-]+)/g)].map((m) => m[1]);
                const unique = [...new Set(slugs)].filter((slug) => isEquivalentAvCode(code, slug));
                unique.sort((a, b) => Number(b.includes('uncensored')) - Number(a.includes('uncensored')));
                for (const slug of unique.slice(0, 3)) {
                    const detailUrl = `https://123av.com/cn/v/${slug}`;
                    const dRes = await transport(detailUrl, {
                        preferGM: true,
                        timeout: 4500,
                        headers: { Referer: searchUrl }
                    });
                    if (dRes && dRes.status === 200 && hasEmbed(dRes.html)) {
                        const variant = slug.includes('uncensored') ? '无码流出' : '普通版';
                        return { sourceId: '123av', sourceName: `123AV (${variant})`, url: dRes.finalUrl || detailUrl, weight: 100 };
                    }
                }
            }
        } catch (_) {}

        return null;
    }

    /**
     * JAVVerse 轻量探活（解析搜索页 workId，严格防跨卡片串号）
     */
    static async probeJavVerse(code, transport = defaultTransport) {
        const upper = normalizeCode(code);
        const core = extractCodeCore(upper);
        const searchUrl = `https://javverse.com/en/search?q=${encodeURIComponent(upper)}`;
        const matchesCode = (snippet) => {
            const txt = String(snippet || '').toUpperCase();
            if (txt.includes(upper)) return true;
            if (core) {
                return txt.includes(`${core.prefix}-${core.number}`) || txt.includes(`${core.prefix}${core.number}`);
            }
            return false;
        };

        try {
            const res = await transport(searchUrl, {
                preferGM: true,
                timeout: 4500,
                headers: { Referer: 'https://javverse.com/' }
            });
            if (!res || res.status >= 400 || !res.html) return null;

            const linkRe = /<a[^>]+href="[^"]*\/(?:[a-z]{2}\/)?work\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
            for (const m of res.html.matchAll(linkRe)) {
                if (matchesCode(m[2])) {
                    return { sourceId: 'javverse', sourceName: 'JAVVerse', url: `https://javverse.com/work/${m[1]}`, weight: 90 };
                }
            }

            const blockRe = /<(?:div|article|li)[^>]*>[\s\S]*?<\/(?:div|article|li)>/gi;
            for (const m of res.html.matchAll(blockRe)) {
                if (matchesCode(m[0])) {
                    const wm = m[0].match(/\/(?:[a-z]{2}\/)?work\/(\d+)/i);
                    if (wm) {
                        return { sourceId: 'javverse', sourceName: 'JAVVerse', url: `https://javverse.com/work/${wm[1]}`, weight: 90 };
                    }
                }
            }
        } catch (_) {}
        return null;
    }

    /**
     * MissAV 轻量探活（带 15min Cloudflare 熔断保护）
     */
    static async probeMissAv(code, transport = defaultTransport, { allowDirectFallback = false } = {}) {
        const lower = normalizeCode(code).toLowerCase();
        const domains = getSiteDomains('MISSAV');
        const primaryUrl = `https://${domains[0] || 'missav.ai'}/cn/${lower}`;

        const blockedUntil = this._cfBlockedUntil.get('missav') || 0;
        if (Date.now() < blockedUntil) {
            return allowDirectFallback
                ? { sourceId: 'missav', sourceName: 'MissAV (需过盾)', url: primaryUrl, weight: 10, challenged: true }
                : null;
        }

        for (const domain of domains) {
            const url = `https://${domain}/cn/${lower}`;
            try {
                const res = await transport(url, {
                    preferGM: true,
                    timeout: 4500,
                    headers: { Referer: `https://${domain}/` }
                });
                if (isCloudflareBlocked(res.status, res.html)) {
                    this._cfBlockedUntil.set('missav', Date.now() + CF_COOLDOWN_MS);
                    break;
                }
                if (res.status >= 200 && res.status < 400 && /playlist\.m3u8|m3u8|surrit\.com/i.test(res.html || '')) {
                    return { sourceId: 'missav', sourceName: 'MissAV', url: res.finalUrl || url, weight: 80 };
                }
            } catch (_) {}
        }

        return allowDirectFallback
            ? { sourceId: 'missav', sourceName: 'MissAV (直达)', url: primaryUrl, weight: 10, challenged: true }
            : null;
    }

    /**
     * Jable 轻量探活
     */
    static async probeJable(code, transport = defaultTransport) {
        const lower = normalizeCode(code).toLowerCase();
        const core = extractCodeCore(code);
        const slugs = [lower];
        if (core) {
            const normSlug = `${core.prefix.toLowerCase()}-${core.number}`;
            if (normSlug !== lower) slugs.push(normSlug);
        }

        const domains = getSiteDomains('JABLE');
        for (const domain of domains) {
            for (const slug of slugs) {
                const url = `https://${domain}/videos/${slug}/`;
                try {
                    const res = await transport(url, {
                        preferGM: true,
                        timeout: 4500,
                        headers: { Referer: `https://${domain}/` }
                    });
                    if (res && res.status >= 200 && res.status < 400 && /hlsUrl\s*=/.test(res.html || '')) {
                        return { sourceId: 'jable', sourceName: 'Jable', url: res.finalUrl || url, weight: 50 };
                    }
                } catch (_) {}
            }
        }
        return null;
    }

    /**
     * 轨道 B 并发错峰探活（命中 123AV 高权源即提前返回，30min 缓存）
     */
    static async resolveClientSource(code, { sourceId = '', transport = defaultTransport } = {}) {
        const cleanCode = normalizeCode(code);
        const cacheKey = `${cleanCode}::${sourceId || 'auto'}`;
        const cached = this._resolveCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.result;
        }

        const runSingle = (id) => {
            switch (id) {
                case '123av': return this.probe123Av(cleanCode, transport);
                case 'javverse': return this.probeJavVerse(cleanCode, transport);
                case 'missav': return this.probeMissAv(cleanCode, transport, { allowDirectFallback: true });
                case 'jable': return this.probeJable(cleanCode, transport);
                default: return Promise.resolve(null);
            }
        };

        let picked = null;
        if (sourceId) {
            picked = await runSingle(sourceId);
        } else {
            const tasks = [
                this.probe123Av(cleanCode, transport),
                this.probeJavVerse(cleanCode, transport),
                sleep(250).then(() => this.probeMissAv(cleanCode, transport, { allowDirectFallback: false })),
                sleep(350).then(() => this.probeJable(cleanCode, transport))
            ];

            picked = await new Promise((resolve) => {
                let pending = tasks.length;
                let best = null;
                let settled = false;

                tasks.forEach((p) => {
                    Promise.resolve(p).then((res) => {
                        if (settled) return;
                        if (res && res.url) {
                            if (!best || res.weight > best.weight) {
                                best = res;
                            }
                            if (res.weight >= 90) {
                                settled = true;
                                resolve(best);
                                return;
                            }
                        }
                    }).finally(() => {
                        pending -= 1;
                        if (!settled && pending <= 0) {
                            settled = true;
                            resolve(best);
                        }
                    });
                });
            });

            // 全部免盾源都未命中时，兜底直达 MissAV 供用户手动过盾
            if (!picked) {
                const fallbackDomain = getSiteDomains('MISSAV')[0] || 'missav.ai';
                picked = {
                    sourceId: 'missav',
                    sourceName: 'MissAV (兜底直达)',
                    url: `https://${fallbackDomain}/cn/${cleanCode.toLowerCase()}`,
                    weight: 10,
                    challenged: true
                };
            }
        }

        if (picked && !picked.challenged) {
            this._resolveCache.set(cacheKey, {
                result: picked,
                expiresAt: Date.now() + RESOLVE_CACHE_TTL_MS
            });
        }
        return picked;
    }

    static openTab(url) {
        if (typeof GM_openInTab === 'function') {
            GM_openInTab(url, { active: true, insert: true, setParent: true });
            return;
        }
        if (typeof open === 'function') {
            open(url, '_blank', 'noopener');
        }
    }

    /**
     * 同步读取已缓存的跳转站点信息（用于 PC 端悬浮 0ms 即时提示）
     */
    static getCachedDestination(code) {
        const cleanCode = normalizeCode(code);
        if (!cleanCode) return { ready: false, track: 'none', sourceName: '', host: '' };

        const gw = getGatewayEndpoint();
        const now = Date.now();
        if (gw &&
            this._gatewayProbeCache.base === gw.base &&
            this._gatewayProbeCache.ok &&
            now - this._gatewayProbeCache.checkedAt < GATEWAY_HEALTH_TTL_MS) {
            return {
                ready: true,
                track: 'gateway',
                sourceId: 'gateway',
                sourceName: '网关影院',
                host: extractHost(gw.base),
                url: this.buildGatewayWatchUrl(gw, cleanCode)
            };
        }

        const cached = this._resolveCache.get(`${cleanCode}::auto`);
        if (cached && now < cached.expiresAt && cached.result?.url) {
            return {
                ready: true,
                track: 'client',
                sourceId: cached.result.sourceId || '',
                sourceName: cached.result.sourceName || '外部片源',
                host: extractHost(cached.result.url),
                url: cached.result.url,
                challenged: Boolean(cached.result.challenged)
            };
        }

        return {
            ready: false,
            track: gw ? 'gateway' : 'client',
            sourceName: '',
            host: gw ? extractHost(gw.base) : ''
        };
    }

    /**
     * PC 端鼠标悬浮轻量预探测最终跳转站点（并发去重 + 自动写入 30min 缓存供点击 0ms 复用）
     */
    static async previewDestination(code, { transport = defaultTransport } = {}) {
        const cleanCode = normalizeCode(code);
        if (!cleanCode) return { ready: false, track: 'none', sourceName: '', host: '' };

        const cached = this.getCachedDestination(cleanCode);
        if (cached.ready) return cached;

        if (this._inflightPreviews.has(cleanCode)) {
            return this._inflightPreviews.get(cleanCode);
        }

        const task = (async () => {
            try {
                const { reachable, gateway } = await this.probeGatewayHealth(false, transport);
                if (reachable && gateway) {
                    return {
                        ready: true,
                        track: 'gateway',
                        sourceId: 'gateway',
                        sourceName: '网关影院',
                        host: extractHost(gateway.base),
                        url: this.buildGatewayWatchUrl(gateway, cleanCode)
                    };
                }

                const resolved = await this.resolveClientSource(cleanCode, { transport });
                if (!resolved || !resolved.url) {
                    return { ready: false, track: 'client', sourceName: '', host: '' };
                }
                return {
                    ready: true,
                    track: 'client',
                    sourceId: resolved.sourceId || '',
                    sourceName: resolved.sourceName || '外部片源',
                    host: extractHost(resolved.url),
                    url: resolved.url,
                    challenged: Boolean(resolved.challenged)
                };
            } finally {
                this._inflightPreviews.delete(cleanCode);
            }
        })();

        this._inflightPreviews.set(cleanCode, task);
        return task;
    }

    /**
     * 统一跨站播放调度入口
     */
    static async play({ code, sourceId = '', title = '', poster = '', forceClient = false } = {}) {
        const cleanCode = normalizeCode(code);
        if (!cleanCode) {
            this.notify('未识别到有效影片番号', 2500, 'warning');
            return { track: 'none', ok: false };
        }

        // 1. 轨道 A：miss-gateway 可达时，直接打开同源影院页
        if (!forceClient) {
            const { reachable, gateway } = await this.probeGatewayHealth();
            if (reachable && gateway) {
                const watchUrl = this.buildGatewayWatchUrl(gateway, cleanCode, { sourceId, title, poster });
                this.openTab(watchUrl);
                return { track: 'gateway', ok: true, url: watchUrl, code: cleanCode };
            }
        }

        // 2. 轨道 B：纯脚本轻量寻源 + 60s 跨站影院租约 + URL hash 跨脚本接力
        this.notify(`正在跨站搜寻 ${cleanCode} 片源…`, 2000, 'info');
        const resolved = await this.resolveClientSource(cleanCode, { sourceId });
        if (!resolved || !resolved.url) {
            this.notify(`未在外部片源找到 ${cleanCode}`, 2800, 'warning');
            return { track: 'client', ok: false, code: cleanCode };
        }

        this.writeHandoffLease({
            code: cleanCode,
            source: resolved.sourceName,
            targetUrl: resolved.url,
            title,
            poster
        });
        this.openTab(this.appendTheaterHash(resolved.url));
        return { track: 'client', ok: true, ...resolved, code: cleanCode };
    }
}
