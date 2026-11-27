/**
 * AvMetadataService — 轻量化多源影片元数据采集与格式化服务（参考 searchAV 路由与限频守卫）
 *
 * 职责：
 * 1. L0: 内存 + IndexedDB (STORES.MEDIA, 7天 TTL) 双层缓存
 * 2. L1: 宿主页面 DOM 零网络提取（MissAV / Jable / 通用 OpenGraph）
 * 3. L2: 缺失关键字段时的跨站结构化补全（商业番 JavBus 优先 -> JavDB API/HTML 限频；FC2/无码 jdforrepam -> fc2hub）
 * 4. 输出紧凑高密度的结构化元数据文本，注入各 BYOK AI 任务上下文
 */

import { fetchWithTransport } from '../utils/http.js';
import { getValue, setValue } from '../utils/storage.js';
import { idbGet, idbSet, idbGetAll, idbDelete, STORES } from '../utils/indexedDB.js';
import { cleanAvCode } from '../utils/videoCode.js';
import { jbBuildSignature, jbApiGetOnce, JAVDB_DOMAINS } from '../player/comments/providers/JavDbCommentProvider.js';
import { AiDebugLogger } from './AiDebugLogger.js';

const META_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const L2_TOTAL_TIMEOUT_MS = 5500;
const JAVDB_RATE_KEY = 'mp_meta_javdb_ts';
const JAVDB_RATE_WINDOW_MS = 5 * 60 * 1000;
const JAVDB_RATE_MAX = 10;
const JB_API_BASE = 'https://jdforrepam.com/api';

const memoryCache = new Map();
const inflightMap = new Map();

function normalizeCode(raw) {
    return cleanAvCode(String(raw || '').trim()) || String(raw || '').trim().toUpperCase();
}

function cleanText(raw, maxLen = 400) {
    return String(raw || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function uniqueCleanList(arr, maxItems = 15, maxLen = 28) {
    const out = [];
    const seen = new Set();
    for (const item of Array.isArray(arr) ? arr : []) {
        const val = cleanText(item, maxLen);
        if (!val || seen.has(val.toLowerCase())) continue;
        seen.add(val.toLowerCase());
        out.push(val);
        if (out.length >= maxItems) break;
    }
    return out;
}

function parseHtmlDoc(html) {
    if (!html || typeof DOMParser === 'undefined') return null;
    try {
        return new DOMParser().parseFromString(String(html), 'text/html');
    } catch (_) {
        return null;
    }
}

function textMatchesCode(haystack, avcode) {
    const code = normalizeCode(avcode);
    if (!code || !haystack) return false;
    const upper = String(haystack).toUpperCase();
    if (upper.includes(code)) return true;
    const compactCode = code.replace(/[-_]/g, '');
    const compactHay = upper.replace(/[-_]/g, '');
    return compactCode.length >= 4 && compactHay.includes(compactCode);
}

function sanitizeTitle(rawTitle, avcode) {
    let title = cleanText(rawTitle, 180);
    if (!title) return '';
    title = title
        .replace(/\s*[-|–—]\s*(?:MissAV|Jable\.?TV|JavBus|JavDB|JAVLibrary|123AV|FC2HUB).*$/i, '')
        .replace(/^\s*(?:免费高清|在線觀看|在线观看|Watch)\s*/i, '');
    if (avcode) {
        const escaped = avcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        title = title.replace(new RegExp(`^\\s*${escaped}\\s*[-|:：]?\\s*`, 'i'), '');
    }
    return cleanText(title, 140);
}

/**
 * 判断是否属于 FC2 / 素人 / 无码片番号（优先走 JavDB API / FC2HUB）
 * @param {string} avcode
 * @returns {boolean}
 */
export function isFc2OrUncensoredCode(avcode) {
    const code = normalizeCode(avcode);
    if (!code) return false;
    return /^(?:FC2(?:[-_]PPV)?[-_]?\d+|1PONDO?[-_]?\d+|CARIB(?:BEAN)?[-_]?\d+|HEYZO[-_]?\d+|PACO(?:PAPA)?[-_]?\d+|TOKYO[-_]?HOT|\d{6}[-_]\d{3})/i.test(code);
}

/**
 * 合并多个来源的元数据对象（优先保留信息更完整者，集合字段去重合并）
 * @param  {...Object} items
 * @returns {Object}
 */
export function mergeAvMetadata(...items) {
    const valid = items.filter((item) => item && typeof item === 'object');
    const avcode = normalizeCode(valid.find((i) => i.avcode)?.avcode || '');
    const result = {
        avcode,
        title: '',
        synopsis: '',
        actresses: [],
        tags: [],
        studio: '',
        series: '',
        releaseDate: '',
        sources: [],
        fetchedAt: Date.now()
    };

    const actresses = [];
    const tags = [];
    const sources = [];

    for (const item of valid) {
        if (item.title && item.title.length > result.title.length) {
            result.title = cleanText(item.title, 140);
        }
        if (item.synopsis && item.synopsis.length > result.synopsis.length) {
            result.synopsis = cleanText(item.synopsis, 320);
        }
        if (!result.studio && item.studio) result.studio = cleanText(item.studio, 40);
        if (!result.series && item.series) result.series = cleanText(item.series, 40);
        if (!result.releaseDate && item.releaseDate) result.releaseDate = cleanText(item.releaseDate, 20);
        if (Array.isArray(item.actresses)) actresses.push(...item.actresses);
        if (Array.isArray(item.tags)) tags.push(...item.tags);
        if (Array.isArray(item.sources)) sources.push(...item.sources);
    }

    result.actresses = uniqueCleanList(actresses, 10, 24);
    result.tags = uniqueCleanList(tags, 16, 24);
    result.sources = uniqueCleanList(sources, 8, 24);
    return result;
}

/**
 * L1: 从当前宿主页面 DOM 提取零网络元数据
 * @param {Document} doc
 * @param {string} avcode
 * @param {string} [hostname]
 * @returns {Object|null}
 */
const NAV_ACTRESS_JUNK_RE = /^(?:按女優|按女优|按主題|按主题|女優排行|女优排行|排行榜?|全部|更多|首頁|首页|Ranking|Top\s*\d*)$/i;
const DATE_NAV_RE = /\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+20\d{2}\b/i;
const LEADING_SYMBOL_JUNK_RE = /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const SEO_BOILERPLATE_RE = /(?:免費高清AV|免费高清AV|無需下載看到飽|无需下载看到饱|Watch\s+.*?\s+free\s+online)/i;

function isInChromeOrSidebar(el) {
    try {
        return Boolean(el?.closest?.('nav, header, footer, aside, .sidebar, .navbar, [role="navigation"]'));
    } catch (_) {
        return false;
    }
}

function isJunkLabel(val) {
    if (!val) return true;
    const clean = val.trim();
    if (clean.length <= 1) return true;
    if (NAV_ACTRESS_JUNK_RE.test(clean) || DATE_NAV_RE.test(clean) || LEADING_SYMBOL_JUNK_RE.test(clean)) {
        return true;
    }
    return false;
}

function isPollutedSynopsis(rawDesc, code) {
    if (!rawDesc) return true;
    if (SEO_BOILERPLATE_RE.test(rawDesc)) return true;
    const otherCodes = rawDesc.match(/\b([A-Z]{2,6}-\d{2,5})\b/gi) || [];
    if (otherCodes.length > 0 && !textMatchesCode(rawDesc, code)) {
        return true;
    }
    return false;
}

export function extractMetadataFromDocument(doc, avcode, hostname = '') {
    const code = normalizeCode(avcode);
    if (!doc || !code) return null;

    const urlStr = String(doc?.location?.href || '');
    const h1Text = cleanText(doc.querySelector?.('h1')?.textContent || '', 200);
    const ogTitle = cleanText(doc.querySelector?.('meta[property="og:title"]')?.getAttribute?.('content') || '', 200);
    const docTitle = cleanText(doc.title || '', 200);

    // 校验当前页面确实是目标番号详情页，防止列表页/首页污染
    const matchesCurrentPage =
        textMatchesCode(urlStr, code) ||
        textMatchesCode(h1Text, code) ||
        textMatchesCode(ogTitle, code) ||
        textMatchesCode(docTitle, code);
    if (!matchesCurrentPage) return null;

    const rawDescCandidates = [
        doc.querySelector?.('meta[name="description"]')?.getAttribute?.('content') || '',
        doc.querySelector?.('meta[property="og:description"]')?.getAttribute?.('content') || '',
        !isInChromeOrSidebar(doc.querySelector?.('.text-secondary')) ? (doc.querySelector?.('.text-secondary')?.textContent || '') : '',
        !isInChromeOrSidebar(doc.querySelector?.('div.mb-1')) ? (doc.querySelector?.('div.mb-1')?.textContent || '') : ''
    ];
    let synopsis = '';
    for (const candidate of rawDescCandidates) {
        const cleaned = cleanText(candidate, 320);
        if (cleaned && !isPollutedSynopsis(cleaned, code)) {
            synopsis = cleaned;
            break;
        }
    }

    const actresses = [];
    const tags = [];
    let studio = '';
    let series = '';
    let releaseDate = '';

    const host = String(hostname || doc?.location?.hostname || '').toLowerCase();
    const scopeEl = doc.querySelector?.('.video-info, .info-header, main, article, #site-content') || doc;
    const selectorsActress = host.includes('jable')
        ? '.models a, a[href*="/models/"]'
        : 'a[href*="/actresses/"], .models a, .star-name a';
    const selectorsTags = host.includes('jable')
        ? '.tags a, .cat a, a[href*="/tags/"], a[href*="/categories/"]'
        : 'a[href*="/genres/"], a[href*="/tags/"], .tags a';

    const actressNodes = scopeEl.querySelectorAll?.(selectorsActress) || doc.querySelectorAll?.(selectorsActress) || [];
    actressNodes.forEach?.((a) => {
        if (isInChromeOrSidebar(a)) return;
        const altName = cleanText(
            a.querySelector?.('img')?.getAttribute?.('alt') ||
            a.querySelector?.('img')?.getAttribute?.('title') ||
            a.getAttribute?.('data-original-title') ||
            a.getAttribute?.('title') ||
            '',
            24
        );
        const textName = cleanText(a.textContent, 24);
        const val = (!isJunkLabel(altName) && altName.length >= textName.length) ? altName : textName;
        if (!isJunkLabel(val)) actresses.push(val);
    });

    const tagNodes = scopeEl.querySelectorAll?.(selectorsTags) || doc.querySelectorAll?.(selectorsTags) || [];
    tagNodes.forEach?.((a) => {
        if (isInChromeOrSidebar(a)) return;
        const val = cleanText(a.textContent, 24);
        if (!isJunkLabel(val)) tags.push(val);
    });

    const makerEl = doc.querySelector?.('a[href*="/makers/"], a[href*="/studio/"]');
    if (makerEl && !isInChromeOrSidebar(makerEl)) studio = cleanText(makerEl.textContent, 40);
    const seriesEl = doc.querySelector?.('a[href*="/series/"]');
    if (seriesEl && !isInChromeOrSidebar(seriesEl)) series = cleanText(seriesEl.textContent, 40);

    const timeEl = doc.querySelector?.('time[datetime], meta[property="video:release_date"]');
    if (timeEl) {
        releaseDate = cleanText(
            timeEl.getAttribute?.('datetime') || timeEl.getAttribute?.('content') || timeEl.textContent || '',
            20
        );
    }

    const title = sanitizeTitle(h1Text || ogTitle || docTitle, code);
    const merged = mergeAvMetadata({
        avcode: code,
        title,
        synopsis: synopsis && synopsis !== title ? synopsis : '',
        actresses,
        tags,
        studio,
        series,
        releaseDate,
        sources: ['dom']
    });
    return (merged.title || merged.actresses.length || merged.tags.length || merged.synopsis) ? merged : null;
}

/**
 * 解析 JavBus 详情页 HTML（参考 searchAV 选择器）
 * @param {string} html
 * @param {string} avcode
 * @returns {Object|null}
 */
export function parseJavBusDetailHtml(html, avcode) {
    const doc = parseHtmlDoc(html);
    if (!doc) return null;
    const code = normalizeCode(avcode);
    const rawTitle = doc.querySelector?.('h3')?.textContent || doc.title || '';
    if (!textMatchesCode(rawTitle, code) && !textMatchesCode(doc.body?.textContent || '', code)) {
        return null;
    }

    const actresses = [];
    doc.querySelectorAll?.('.star-name a')?.forEach?.((a) => {
        const name = cleanText(a.textContent, 24);
        if (name) actresses.push(name);
    });

    const tags = [];
    const genreChecks = doc.querySelectorAll?.('input[name="gr_sel"]') || [];
    if (genreChecks.length > 0) {
        genreChecks.forEach((chk) => {
            const labelText = cleanText(chk.nextSibling?.textContent || chk.nextElementSibling?.textContent || '', 24);
            if (labelText) tags.push(labelText);
        });
    } else {
        doc.querySelectorAll?.('.genre a, span.genre label a')?.forEach?.((a) => {
            const name = cleanText(a.textContent, 24);
            if (name) tags.push(name);
        });
    }

    let releaseDate = '';
    let studio = '';
    let series = '';
    doc.querySelectorAll?.('.info p, .header')?.forEach?.((el) => {
        const txt = cleanText(el.parentElement?.textContent || el.textContent || '', 100);
        if (/發行日期:|发行日期:/.test(txt)) {
            const m = txt.match(/(\d{4}-\d{2}-\d{2})/);
            if (m) releaseDate = m[1];
        } else if (/製作商:|制作商:/.test(txt) && !studio) {
            studio = cleanText(txt.replace(/^.*?(?:製作商:|制作商:)/, ''), 40);
        } else if (/系列:/.test(txt) && !series) {
            series = cleanText(txt.replace(/^.*?系列:/, ''), 40);
        }
    });

    return mergeAvMetadata({
        avcode: code,
        title: sanitizeTitle(rawTitle, code),
        actresses,
        tags,
        studio,
        series,
        releaseDate,
        sources: ['javbus']
    });
}

/**
 * 解析 JavDB 详情页 HTML（参考 searchAV `.panel-block` 解析规则）
 * @param {string} html
 * @param {string} avcode
 * @returns {Object|null}
 */
export function parseJavDbDetailHtml(html, avcode) {
    const doc = parseHtmlDoc(html);
    if (!doc) return null;
    const code = normalizeCode(avcode);
    const rawTitle = doc.querySelector?.('h2.title strong, h2.title')?.textContent || doc.title || '';

    const actresses = [];
    const tags = [];
    let releaseDate = '';
    let studio = '';
    let series = '';

    doc.querySelectorAll?.('.panel-block')?.forEach?.((block) => {
        const label = cleanText(block.querySelector?.('strong')?.textContent || '', 24);
        const fullText = cleanText(block.textContent || '', 220);
        if (/日期/.test(label) || /日期:/.test(fullText)) {
            const m = fullText.match(/(\d{4}-\d{2}-\d{2})/);
            if (m) releaseDate = m[1];
        } else if (/片商|發行|制作/.test(label)) {
            const a = block.querySelector?.('a');
            studio = cleanText(a?.textContent || fullText.replace(label, ''), 40);
        } else if (/系列/.test(label)) {
            const a = block.querySelector?.('a');
            series = cleanText(a?.textContent || fullText.replace(label, ''), 40);
        } else if (/類別|类别|標籤|标签/.test(label)) {
            const links = block.querySelectorAll?.('a') || [];
            if (links.length > 0) {
                links.forEach((a) => {
                    const t = cleanText(a.textContent, 24);
                    if (t) tags.push(t);
                });
            } else {
                const rawTags = cleanText(block.lastElementChild?.textContent || '', 200);
                rawTags.split(/[\s,、\u00A0]+/).forEach((t) => {
                    if (t) tags.push(t);
                });
            }
        } else if (/演員|演员/.test(label)) {
            block.querySelectorAll?.('a')?.forEach?.((a) => {
                const next = a.nextElementSibling;
                if (!next || next.classList?.contains('female') || !next.classList?.contains('male')) {
                    const name = cleanText(a.textContent, 24);
                    if (name) actresses.push(name);
                }
            });
        }
    });

    const title = sanitizeTitle(rawTitle, code);
    if (!title && !tags.length && !actresses.length) return null;
    return mergeAvMetadata({
        avcode: code,
        title,
        actresses,
        tags,
        studio,
        series,
        releaseDate,
        sources: ['javdb']
    });
}

/**
 * 解析 FC2HUB 详情页 HTML（参考 searchAV `.fc2-title` 与 meta keywords）
 * @param {string} html
 * @param {string} avcode
 * @returns {Object|null}
 */
export function parseFc2HubDetailHtml(html, avcode) {
    const doc = parseHtmlDoc(html);
    if (!doc) return null;
    const code = normalizeCode(avcode);
    const titleEl = doc.querySelector?.('.fc2-title, h1');
    const rawTitle = cleanText(titleEl?.textContent || '', 180);
    if (!rawTitle) return null;

    const keywords = doc.querySelector?.('meta[name~="keywords"]')?.getAttribute?.('content') || '';
    const codeNum = (code.match(/(\d{5,8})$/) || [])[1] || '';
    const tags = keywords
        .split(',')
        .map((k) => cleanText(k, 24))
        .filter((k) => k && !textMatchesCode(k, code) && (!codeNum || k !== codeNum));
    const pubTime = doc.querySelector?.('meta[property~="videos:published_time"]')?.getAttribute?.('content') || '';
    const releaseDate = cleanText(pubTime, 10);

    return mergeAvMetadata({
        avcode: code,
        title: sanitizeTitle(rawTitle, code),
        tags,
        studio: 'FC2',
        releaseDate,
        sources: ['fc2hub']
    });
}

/**
 * 将元数据格式化为紧凑、适合写入 LLM Prompt 的结构化上下文
 * @param {Object|null} meta
 * @returns {string}
 */
export function formatMetadataForLlm(meta) {
    if (!meta || typeof meta !== 'object') return '';
    const lines = [];
    if (meta.title) lines.push(`片名: ${cleanText(meta.title, 120)}`);
    if (Array.isArray(meta.actresses) && meta.actresses.length > 0) {
        lines.push(`演员: ${meta.actresses.slice(0, 6).join('、')}`);
    }
    const studioPart = [meta.studio, meta.series].filter(Boolean).join(' · ');
    if (studioPart) lines.push(`片商/系列: ${studioPart}`);
    if (Array.isArray(meta.tags) && meta.tags.length > 0) {
        lines.push(`分类标签: ${meta.tags.slice(0, 12).join(' / ')}`);
    }
    if (meta.synopsis) {
        lines.push(`剧情简介: ${cleanText(meta.synopsis, 240)}`);
    }
    return lines.join('\n').slice(0, 520);
}

function canCallJavdbHtmlRateLimited() {
    try {
        const now = Date.now();
        const stored = getValue(JAVDB_RATE_KEY, []);
        const recent = (Array.isArray(stored) ? stored : [])
            .map(Number)
            .filter((ts) => Number.isFinite(ts) && now - ts < JAVDB_RATE_WINDOW_MS);
        if (recent.length >= JAVDB_RATE_MAX) {
            return false;
        }
        recent.push(now);
        setValue(JAVDB_RATE_KEY, recent);
        return true;
    } catch (_) {
        return true;
    }
}

async function fetchFromJavBus(code) {
    const candidates = [code];
    const zeroMatch = code.match(/^([A-Z]+)-(\d{2})$/);
    if (zeroMatch) candidates.push(`${zeroMatch[1]}-0${zeroMatch[2]}`);

    for (const candidateCode of candidates) {
        try {
            const res = await fetchWithTransport(`https://www.javbus.com/${encodeURIComponent(candidateCode)}`, {
                preferGM: true,
                timeout: 4000,
                headers: { Accept: 'text/html' }
            });
            if (res.status === 404) continue;
            if (res.status >= 200 && res.status < 300 && res.html) {
                const parsed = parseJavBusDetailHtml(res.html, code);
                if (parsed) return parsed;
            }
            break;
        } catch (_) {
            break;
        }
    }
    return null;
}

async function fetchFromJavDbApi(code) {
    try {
        const sign = jbBuildSignature();
        const searchRes = await jbApiGetOnce(`${JB_API_BASE}/v2/search`, {
            q: code,
            page: 1,
            type: 'movie',
            limit: 1,
            movie_type: 'all',
            from_recent: 'false',
            movie_filter_by: 'all',
            movie_sort_by: 'relevance'
        }, {
            'accept-language': 'zh-TW',
            host: 'jdforrepam.com',
            jdsignature: sign
        });
        const movie = searchRes?.data?.movies?.[0];
        if (!movie?.id) return null;

        const detailRes = await jbApiGetOnce(`${JB_API_BASE}/v1/movies/${encodeURIComponent(movie.id)}`, {}, {
            'accept-language': 'zh-TW',
            host: 'jdforrepam.com',
            jdsignature: sign
        });
        const m = detailRes?.data?.movie || movie;
        const actresses = (Array.isArray(m.actors) ? m.actors : [])
            .filter((a) => !a?.gender || a.gender === 'female')
            .map((a) => a?.name)
            .filter(Boolean);
        const tags = (Array.isArray(m.tags) ? m.tags : [])
            .map((t) => (typeof t === 'string' ? t : t?.name))
            .filter(Boolean);

        return mergeAvMetadata({
            avcode: code,
            title: sanitizeTitle(m.title || '', code),
            actresses,
            tags,
            studio: m.maker_name || m.publisher_name || '',
            series: m.series_name || '',
            releaseDate: cleanText(m.release_date || '', 10),
            sources: ['javdb_api']
        });
    } catch (_) {
        return null;
    }
}

async function fetchFromJavDbHtml(code) {
    if (!canCallJavdbHtmlRateLimited()) return null;
    const domain = JAVDB_DOMAINS[0] || 'https://javdb.com';
    try {
        const searchRes = await fetchWithTransport(`${domain}/search?q=${encodeURIComponent(code)}&f=all`, {
            preferGM: true,
            timeout: 4000,
            headers: { Accept: 'text/html' }
        });
        if (searchRes.status < 200 || searchRes.status >= 300 || !searchRes.html) return null;
        if (/cf-challenge|Turnstile/i.test(searchRes.html)) return null;

        if (searchRes.finalUrl && searchRes.finalUrl.includes('/v/')) {
            return parseJavDbDetailHtml(searchRes.html, code);
        }

        const doc = parseHtmlDoc(searchRes.html);
        const linkEl = Array.from(doc?.querySelectorAll?.('.movie-list .item a[href^="/v/"], a[href^="/v/"]') || [])
            .find((a) => textMatchesCode(a.textContent || a.getAttribute?.('title') || '', code));
        const href = linkEl?.getAttribute?.('href');
        if (!href) return null;

        const detailUrl = href.startsWith('http') ? href : `${domain}${href}`;
        const detailRes = await fetchWithTransport(detailUrl, {
            preferGM: true,
            timeout: 4000,
            headers: { Accept: 'text/html' }
        });
        if (detailRes.status >= 200 && detailRes.status < 300 && detailRes.html && !/cf-challenge|Turnstile/i.test(detailRes.html)) {
            return parseJavDbDetailHtml(detailRes.html, code);
        }
        return null;
    } catch (_) {
        return null;
    }
}

async function fetchFromFc2Hub(code) {
    const m = code.match(/FC2(?:[-_]PPV)?[-_]?(\d{5,8})/i);
    if (!m) return null;
    try {
        const searchRes = await fetchWithTransport(`https://fc2hub.com/search?kw=${encodeURIComponent(m[1])}`, {
            preferGM: true,
            timeout: 4000,
            headers: { Accept: 'text/html' }
        });
        if (searchRes.status >= 200 && searchRes.status < 300 && searchRes.html) {
            return parseFc2HubDetailHtml(searchRes.html, code);
        }
    } catch (_) {}
    return null;
}

function isMetadataFresh(record) {
    if (!record || typeof record !== 'object') return false;
    return (Date.now() - (Number(record.fetchedAt) || 0)) < META_TTL_MS;
}

export class AvMetadataService {
    static clearMemoryCache() {
        memoryCache.clear();
        inflightMap.clear();
    }

    /**
     * 清理本地 IndexedDB + 内存中的影片元数据缓存 (`av_meta:*`)
     * @returns {Promise<{ clearedCount: number }>}
     */
    static async clearLocalCache() {
        this.clearMemoryCache();
        let clearedCount = 0;
        try {
            const all = await idbGetAll(STORES.MEDIA);
            for (const rec of Array.isArray(all) ? all : []) {
                if (typeof rec?.key === 'string' && rec.key.startsWith('av_meta:')) {
                    if (await idbDelete(STORES.MEDIA, rec.key)) clearedCount += 1;
                }
            }
        } catch (_) {}
        return { clearedCount };
    }

    /**
     * 零网络读取：内存 / 本地页面 DOM 元数据
     * @param {string} avcode
     * @returns {Object|null}
     */
    static getCachedOrDom(avcode) {
        const code = normalizeCode(avcode);
        if (!code) return null;
        const mem = memoryCache.get(code);
        const dom = typeof document !== 'undefined'
            ? extractMetadataFromDocument(document, code, typeof window !== 'undefined' ? window.location?.hostname : '')
            : null;
        if (mem && isMetadataFresh(mem)) {
            return dom ? mergeAvMetadata(mem, dom) : mem;
        }
        return dom;
    }

    /**
     * 获取完整影片元数据（L0 缓存 -> L1 DOM -> L2 跨站补全），内置 5.5s 总超时兜底
     * @param {string} avcode
     * @param {{ forceRefresh?: boolean }} [options]
     * @returns {Promise<Object|null>}
     */
    static async getMetadata(avcode, { forceRefresh = false } = {}) {
        const code = normalizeCode(avcode);
        if (!code) return null;

        const startedAt = Date.now();
        const emitMetaDebug = (tier, meta, extra = {}) => {
            if (!AiDebugLogger.isEnabled()) return;
            AiDebugLogger.recordMetadataState(code, {
                tier,
                ok: Boolean(meta),
                forceRefresh: Boolean(forceRefresh),
                durationMs: Date.now() - startedAt,
                title: meta?.title || '',
                actressesCount: Array.isArray(meta?.actresses) ? meta.actresses.length : 0,
                actresses: Array.isArray(meta?.actresses) ? meta.actresses : [],
                tagsCount: Array.isArray(meta?.tags) ? meta.tags.length : 0,
                tags: Array.isArray(meta?.tags) ? meta.tags : [],
                studio: meta?.studio || '',
                series: meta?.series || '',
                releaseDate: meta?.releaseDate || '',
                synopsisLength: meta?.synopsis ? meta.synopsis.length : 0,
                sources: Array.isArray(meta?.sources) ? meta.sources : [],
                ...extra
            });
        };

        const domMeta = typeof document !== 'undefined'
            ? extractMetadataFromDocument(document, code, typeof window !== 'undefined' ? window.location?.hostname : '')
            : null;

        if (!forceRefresh) {
            const mem = memoryCache.get(code);
            if (mem && isMetadataFresh(mem) && (mem.actresses?.length || mem.tags?.length)) {
                const res = domMeta ? mergeAvMetadata(mem, domMeta) : mem;
                emitMetaDebug('l0_mem', res);
                return res;
            }
            try {
                const stored = await idbGet(STORES.MEDIA, `av_meta:${code}`);
                if (stored && isMetadataFresh(stored)) {
                    const combined = domMeta ? mergeAvMetadata(stored, domMeta) : stored;
                    memoryCache.set(code, combined);
                    if (combined.actresses?.length && combined.tags?.length) {
                        emitMetaDebug('l0_idb', combined);
                        return combined;
                    }
                }
            } catch (_) {}
        }

        if (domMeta && domMeta.title && domMeta.actresses.length > 0 && domMeta.tags.length > 0 && !forceRefresh) {
            memoryCache.set(code, domMeta);
            emitMetaDebug('l1_dom', domMeta);
            return domMeta;
        }

        if (inflightMap.has(code) && !forceRefresh) {
            return inflightMap.get(code);
        }

        const task = (async () => {
            let remoteMeta = null;
            let remoteError = '';
            const fetchRemote = async () => {
                if (isFc2OrUncensoredCode(code)) {
                    const apiMeta = await fetchFromJavDbApi(code);
                    if (apiMeta && (apiMeta.title || apiMeta.tags?.length)) return apiMeta;
                    return fetchFromFc2Hub(code);
                }
                const jbBusMeta = await fetchFromJavBus(code);
                if (jbBusMeta && (jbBusMeta.actresses?.length || jbBusMeta.tags?.length)) {
                    return jbBusMeta;
                }
                const jbApiMeta = await fetchFromJavDbApi(code);
                if (jbApiMeta && (jbApiMeta.actresses?.length || jbApiMeta.tags?.length)) {
                    return jbApiMeta;
                }
                return fetchFromJavDbHtml(code);
            };

            let timer = null;
            try {
                remoteMeta = await Promise.race([
                    fetchRemote(),
                    new Promise((resolve) => {
                        timer = setTimeout(() => {
                            remoteError = 'L2_TIMEOUT';
                            resolve(null);
                        }, L2_TOTAL_TIMEOUT_MS);
                    })
                ]);
            } catch (err) {
                remoteError = err?.message || 'L2_ERROR';
                remoteMeta = null;
            } finally {
                if (timer) clearTimeout(timer);
            }

            const merged = mergeAvMetadata(domMeta, remoteMeta);
            if (!merged.title && !merged.actresses.length && !merged.tags.length && !merged.synopsis) {
                emitMetaDebug('miss', null, { hasDomFallback: Boolean(domMeta), error: remoteError || null });
                return null;
            }

            memoryCache.set(code, merged);
            try {
                await idbSet(STORES.MEDIA, `av_meta:${code}`, merged);
            } catch (_) {}
            emitMetaDebug(remoteMeta ? 'l2_remote' : 'l1_dom_partial', merged, { error: remoteError || null });
            return merged;
        })().finally(() => {
            inflightMap.delete(code);
        });

        inflightMap.set(code, task);
        return task;
    }
}
