/**
 * SubtitleCatProvider — SubtitleCat 两段式 HTML 抓取适配器
 *
 * 阶段 1：GET /index.php?search={番号} 取结果列表
 * 阶段 2：并发（上限 4）抓取 /subs/... 详情页，提取
 *         · a#download_zh-CN        → 已机翻好的静态中文直链
 *         · onclick="translate_from_server_folder('zh-CN','x.srt','/subs/..')"
 *                                   → 冷门番号无静态直链，需回落到原始底本
 */

import { fetchWithTransport, detectCloudflare } from '../../../utils/http.js';
import { codeMatchesText } from '../SubtitleCode.js';

const BASE_URL = 'https://www.subtitlecat.com';
const DETAIL_CONCURRENCY = 4;
const MAX_DETAILS = 6;

function absolutize(href) {
    const raw = String(href || '').trim();
    if (!raw) return '';
    const encoded = raw.replace(/ /g, '%20');
    if (/^https?:\/\//i.test(encoded)) return encoded;
    try {
        return new URL(encoded, `${BASE_URL}/`).toString();
    } catch (_) {
        return '';
    }
}

function parseHtml(html) {
    if (typeof DOMParser === 'undefined') return null;
    try {
        return new DOMParser().parseFromString(html, 'text/html');
    } catch (_) {
        return null;
    }
}

/** 简易并发信号量：避免详情页并发过高触发 Cloudflare 429 */
async function runWithConcurrency(tasks, limit) {
    const results = [];
    let cursor = 0;
    const workers = new Array(Math.min(limit, tasks.length)).fill(null).map(async () => {
        while (cursor < tasks.length) {
            const index = cursor++;
            try {
                results[index] = await tasks[index]();
            } catch (_) {
                results[index] = null;
            }
        }
    });
    await Promise.all(workers);
    return results;
}

function extractTranslateParams(onclick) {
    const match = String(onclick || '').match(/translate_from_server_folder\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'/);
    if (!match) return null;
    return { lang: match[1], file: match[2], folder: match[3] };
}

export function guessOriginLang(rowText) {
    const text = String(rowText || '').toLowerCase();
    const translatedMatch = text.match(/translated\s+from\s+([a-z\-]+)/i);
    const hint = translatedMatch ? translatedMatch[1] : text;

    if (/\bjapanese\b|日语|日本語|\.ja(?:\.|\b)|_ja\b/i.test(hint)) return { code: 'ja', label: '日语' };
    if (/\benglish\b|英语|\.en(?:\.|\b)|-rm\.en\b|_en\b/i.test(hint)) return { code: 'en', label: '英语' };
    if (/\bchinese\b|zh-cn|zh-tw|中文|简体|繁體/i.test(hint)) return { code: 'zh', label: '中文' };
    if (/\bkorean\b|韩语|\.ko(?:\.|\b)/i.test(hint)) return { code: 'ko', label: '韩语' };
    return { code: 'unknown', label: '未知' };
}

export function resolveStaticSubtitleAnchorLang(anchorId = '', href = '') {
    const probe = `${anchorId} ${href}`.toLowerCase();
    if (/zh[-_]?tw|zh[-_]?hk|zh[-_]?hant|\bcht\b/.test(probe)) {
        return { code: 'zh-TW', label: '繁體' };
    }
    if (/zh[-_]?cn|zh[-_]?hans|\bchs\b|download_zh\b|-zh\.srt/.test(probe)) {
        return { code: 'zh', label: '中文' };
    }
    if (/download_ja|\b-ja\.srt/.test(probe)) {
        return { code: 'ja', label: '日语' };
    }
    if (/download_en|\b-en\.srt/.test(probe)) {
        return { code: 'en', label: '英语' };
    }
    return { code: 'zh', label: '中文' };
}

function isMachineTranslatedEntry(rowText, originCode, targetCode) {
    const text = String(rowText || '');
    if (/translated\s+from|whisperjav|whisper|machine/i.test(text)) return true;
    return Boolean(originCode && originCode !== 'unknown' && targetCode && originCode !== targetCode);
}

/**
 * 纯函数解析 SubtitleCat 详情页中的所有有效下载轨（可独立供单测调用）
 * @param {{ detailUrl: string, title: string, rowText: string, downloads?: number }} entry
 * @param {string} html
 * @returns {Array<Object>}
 */
export function resolveSubtitleCatDetailHtml(entry, html) {
    const doc = parseHtml(html);
    if (!doc) return [];

    const origin = guessOriginLang(entry.rowText);
    const common = {
        provider: 'subtitlecat',
        providerLabel: 'SubtitleCat',
        title: entry.title,
        format: 'srt',
        durationSeconds: 0,
        uploader: origin.code !== 'unknown' && origin.code !== 'zh' ? `原音: ${origin.label}` : '',
        originLang: origin.code,
        downloads: Number(entry.downloads) || 0
    };

    const candidates = [];
    const seenUrls = new Set();
    const staticLinks = Array.from(
        doc.querySelectorAll('a#download_zh-CN, a#download_zh-TW, a#download_zh')
    );

    for (const staticLink of staticLinks) {
        const href = absolutize(staticLink.getAttribute('href'));
        if (!href || seenUrls.has(href)) continue;
        seenUrls.add(href);

        const targetLang = resolveStaticSubtitleAnchorLang(staticLink.getAttribute('id') || '', href);
        candidates.push({
            ...common,
            id: `sc:${href.split('/').slice(-3).join('/')}`,
            lang: targetLang.code,
            langLabel: targetLang.label,
            downloadUrl: href,
            machineTranslated: isMachineTranslatedEntry(entry.rowText, origin.code, targetLang.code),
            baseScore: targetLang.code === 'zh' ? 78 : 76
        });
    }

    if (candidates.length > 0) {
        return candidates;
    }

    const onclickEls = Array.from(doc.querySelectorAll('[onclick]')).filter((el) =>
        /translate_from_server_folder/.test(el.getAttribute('onclick') || '')
    );
    const preferredEl = onclickEls.find((el) => /'zh-CN'|'zh-TW'/.test(el.getAttribute('onclick') || '')) || onclickEls[0];
    const params = preferredEl ? extractTranslateParams(preferredEl.getAttribute('onclick')) : null;
    if (params) {
        const sourceUrl = absolutize(`${params.folder}${params.file}`);
        if (sourceUrl) {
            const origLangCode = origin.code !== 'unknown' ? origin.code : 'unknown';
            return [{
                ...common,
                id: `sc:${params.folder}${params.file}`,
                lang: origLangCode,
                langLabel: origin.label,
                downloadUrl: sourceUrl,
                machineTranslated: /whisper/i.test(entry.rowText),
                baseScore: 62
            }];
        }
    }
    return [];
}

export class SubtitleCatProvider {
    constructor() {
        this.id = 'subtitlecat';
        this.label = 'SubtitleCat';
    }

    /**
     * 检索候选字幕
     * @param {string} code 标准化番号
     * @param {AbortSignal} [signal]
     * @returns {Promise<Array<Object>>}
     */
    async search(code, signal) {
        if (!code || signal?.aborted) return [];
        const searchUrl = `${BASE_URL}/index.php?search=${encodeURIComponent(code)}`;
        const res = await fetchWithTransport(searchUrl, {
            preferGM: true,
            timeout: 12000,
            headers: { Accept: 'text/html,application/xhtml+xml' }
        });
        if (detectCloudflare(res.status, res.html)) throw new Error('SUBTITLECAT_CLOUDFLARE');
        if (res.status !== 200) throw new Error(`SUBTITLECAT_HTTP_${res.status}`);

        const doc = parseHtml(res.html);
        if (!doc) return [];

        const anchors = Array.from(doc.querySelectorAll('a[href*="subs/"]'));
        const seen = new Set();
        const entries = [];
        for (const anchor of anchors) {
            const href = anchor.getAttribute('href') || '';
            if (!href || seen.has(href)) continue;
            seen.add(href);
            const row = anchor.closest('tr');
            const rowText = row ? row.textContent.replace(/\s+/g, ' ').trim() : '';
            const title = (anchor.textContent || '').replace(/\s+/g, ' ').trim();
            if (!title) continue;
            const downloads = Number((rowText.match(/(\d+)\s*download/i) || [])[1] || 0);
            entries.push({
                detailUrl: absolutize(href),
                title: title.slice(0, 80),
                rowText,
                downloads
            });
        }
        // 严格番号守卫：SubtitleCat 检索是模糊匹配，必须剔除无关影片结果
        const matched = entries.filter((entry) => codeMatchesText(`${entry.title} ${entry.rowText}`, code));
        if (!matched.length) return [];

        // 相关性优先：按下载量降序抓取详情页
        matched.sort((a, b) => b.downloads - a.downloads);

        const targets = matched.slice(0, MAX_DETAILS);
        const details = await runWithConcurrency(
            targets.map((entry) => () => this._resolveDetail(entry, signal)),
            DETAIL_CONCURRENCY
        );
        return details.flat().filter(Boolean);
    }

    async _resolveDetail(entry, signal) {
        if (signal?.aborted) return [];
        const res = await fetchWithTransport(entry.detailUrl, {
            preferGM: true,
            timeout: 12000,
            headers: { Accept: 'text/html,application/xhtml+xml' }
        });
        if (res.status !== 200 || detectCloudflare(res.status, res.html)) return [];
        return resolveSubtitleCatDetailHtml(entry, res.html);
    }
}
