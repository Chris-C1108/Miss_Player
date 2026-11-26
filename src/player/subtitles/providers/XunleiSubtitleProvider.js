/**
 * XunleiSubtitleProvider — 迅雷字幕库（Oracle 接口）适配器
 *
 * 端点：GET https://api-shoulei-ssl.xunlei.com/oracle/subtitle?name={番号}&gcid=&cid=
 * 返回：{ code: 0, result: 'ok', data: [ { cid, url, ext, duration, extra_name, ... } ] }
 *
 * 特点：网友上传的人工轴质量最高（.ass 居多），但按 name 检索会混入模糊噪音，
 * 且同一文件会以不同 cid 重复出现，必须二次校验番号 + cid 去重。
 */

import { fetchWithTransport } from '../../../utils/http.js';
import { codeMatchesText } from '../SubtitleCode.js';

const ORACLE_ENDPOINT = 'https://api-shoulei-ssl.xunlei.com/oracle/subtitle';
const CDN_HOST_REWRITE = /^http:\/\/(subtitle[^/]*\.(?:geilijiasu|xunlei)\.com)/i;

function pickArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    const candidates = [payload.data, payload.list, payload.subtitles, payload.result?.data, payload.data?.list];
    for (const item of candidates) {
        if (Array.isArray(item)) return item;
    }
    if (Array.isArray(payload.cid)) return payload.cid;
    return [];
}

function parsePayload(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return null;
    const jsonish = text.startsWith('(') || /^[\w$.]+\s*\(/.test(text) ? text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')) : text;
    try {
        return JSON.parse(jsonish);
    } catch (_) {
        return null;
    }
}

function upgradeToHttps(url) {
    return String(url || '').trim().replace(CDN_HOST_REWRITE, 'https://$1');
}

function extFromUrl(url, fallback = 'srt') {
    const match = String(url || '').match(/\.(srt|ass|ssa|vtt)(?:$|[?#])/i);
    return match ? match[1].toLowerCase() : fallback;
}

export function langLabelOf(item = {}) {
    const languages = Array.isArray(item.languages) ? item.languages.join(' ') : '';
    const structured = `${languages} ${item.language || ''} ${item.lang || ''}`.trim();
    const titleProbe = `${item.simple_name || ''} ${item.name || ''} ${item.file_name || ''} ${item.caption || ''}`.trim();
    const urlProbe = String(item.url || item.download_url || '').trim();
    const combined = `${structured} ${titleProbe} ${urlProbe}`;

    if (/(?:双[语語]|bilingual|中[日英]|[.\-_](?:chs|cht)[.\-_]?eng)/i.test(combined)) {
        return { code: 'zh', label: '双语' };
    }
    if (/(?:繁[体體]|繁中|zh[-_]?tw|zh[-_]?hk|zh[-_]?hant|\bcht\b|traditional)/i.test(combined)) {
        return { code: 'zh-TW', label: '繁体' };
    }
    if (/(?:简[体體]|简中|zh[-_]?cn|zh[-_]?hans|\bchs\b|中[文文字]|国[语語]|\bchinese\b|\bzh\b)/i.test(combined)) {
        return { code: 'zh', label: '简体' };
    }

    // 仅在未命中显式中文标记时检查日/英（使用词边界且排除 uploader 昵称噪音）
    const nonZhProbe = `${structured} ${titleProbe}`;
    if (/(?:\b(?:ja|jp|jpn|japanese)\b|日[语語文本])|[.\-_]jp\.(?:srt|ass|ssa|vtt)/i.test(nonZhProbe)) {
        return { code: 'ja', label: '日语' };
    }
    if (/(?:\b(?:en|eng|english)\b|英[语語文])|[.\-_]en\.(?:srt|ass|ssa|vtt)/i.test(nonZhProbe)) {
        return { code: 'en', label: '英语' };
    }
    return { code: 'zh', label: '中文' };
}

export class XunleiSubtitleProvider {
    constructor() {
        this.id = 'xunlei';
        this.label = '迅雷字幕库';
    }

    /**
     * 检索候选字幕
     * @param {string} code 标准化番号
     * @returns {Promise<Array<Object>>}
     */
    async search(code) {
        if (!code) return [];
        const url = `${ORACLE_ENDPOINT}?name=${encodeURIComponent(code)}&gcid=&cid=&_=${Date.now()}`;
        const res = await fetchWithTransport(url, {
            preferGM: true,
            timeout: 9000,
            headers: { Accept: 'application/json, text/plain, */*' }
        });
        if (res.status !== 200) throw new Error(`XUNLEI_HTTP_${res.status}`);

        const payload = parsePayload(res.html);
        const list = pickArray(payload);
        const seen = new Set();
        const candidates = [];

        for (const item of list) {
            if (!item || typeof item !== 'object') continue;
            const rawUrl = item.url || item.download_url || item.subtitle_url || '';
            const cid = String(item.cid || item.scid || rawUrl || '');
            if (!rawUrl || seen.has(cid)) continue;

            const displayName = String(item.simple_name || item.name || item.file_name || rawUrl.split('/').pop() || code)
                .replace(/\.(srt|ass|ssa|vtt)$/i, '');
            const matchText = `${displayName} ${item.name || ''} ${rawUrl}`;
            if (!codeMatchesText(matchText, code)) continue;

            seen.add(cid);
            const ext = String(item.ext || item.type || extFromUrl(rawUrl)).toLowerCase().replace(/^\./, '');
            const lang = langLabelOf(item);
            // 接口 duration 单位为毫秒，超过 10 万即按毫秒换算为秒
            const rawDuration = Number(item.duration) || 0;
            const durationSeconds = rawDuration > 100000 ? Math.round(rawDuration / 1000) : Math.round(rawDuration);
            candidates.push({
                id: `xunlei:${cid.slice(0, 40)}`,
                provider: this.id,
                providerLabel: this.label,
                title: displayName.replace(/\s+/g, ' ').trim().slice(0, 80),
                lang: lang.code,
                langLabel: lang.label,
                format: ext === 'ass' || ext === 'ssa' ? 'ass' : (ext === 'vtt' ? 'vtt' : 'srt'),
                downloadUrl: upgradeToHttps(rawUrl),
                durationSeconds,
                uploader: String(item.extra_name || '').slice(0, 24),
                baseScore: 88
            });
        }
        return candidates;
    }
}
