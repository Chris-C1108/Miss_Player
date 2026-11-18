/**
 * SubtitleEngine — 字幕多源采集引擎（零依赖，可独立复用）
 *
 * 四层管道：
 *   1. SubtitleCode  番号标准化清洗
 *   2. Provider 并发调度 + 独立熔断（单源异常绝不阻塞其他源）
 *   3. 置信度评分 + 去重排序（cid / 直链双维度）
 *   4. SubtitleFormat 解析 + 编码嗅探（decodeSubtitleBuffer）
 */

import { fetchBinaryWithTransport } from '../../utils/http.js';
import { decodeSubtitleBuffer } from './SubtitleDecoder.js';
import { parseSubtitles } from './SubtitleFormat.js';
import { codeMatchesText } from './SubtitleCode.js';
import { XunleiSubtitleProvider } from './providers/XunleiSubtitleProvider.js';
import { SubtitleCatProvider } from './providers/SubtitleCatProvider.js';

const PROVIDER_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, tag = 'TIMEOUT') {
    let timer = null;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(tag)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class SubtitleEngine {
    constructor() {
        this.providers = [new XunleiSubtitleProvider(), new SubtitleCatProvider()];
    }

    /**
     * 多源并发检索（单源失败独立熔断）
     * @param {string} code 标准化番号
     * @returns {Promise<{candidates: Array<Object>, errors: Array<{provider:string,message:string}>}>}
     */
    async search(code) {
        const errors = [];
        const results = await Promise.allSettled(
            this.providers.map(async (provider) => {
                try {
                    const list = await withTimeout(provider.search(code), PROVIDER_TIMEOUT_MS, `${provider.id}_TIMEOUT`);
                    return Array.isArray(list) ? list : [];
                } catch (err) {
                    errors.push({ provider: provider.id, message: err?.message || 'UNKNOWN' });
                    return [];
                }
            })
        );

        const flat = results
            .filter((r) => r.status === 'fulfilled' && Array.isArray(r.value))
            .flatMap((r) => r.value);

        return { candidates: this._rank(flat, code), errors };
    }

    /**
     * 置信度评分 + 双维度去重排序
     * @param {Array<Object>} list
     * @param {string} code
     * @returns {Array<Object>}
     */
    _rank(list, code) {
        const byUrl = new Set();
        const byTitle = new Set();
        const ranked = [];
        for (const candidate of list) {
            if (!candidate?.downloadUrl) continue;
            const urlKey = candidate.downloadUrl.split('?')[0];
            if (byUrl.has(urlKey)) continue;
            // 同名同格式同语言视为同一份字幕的不同哈希副本，只保留排序靠前一条
            const titleKey = `${candidate.provider}|${String(candidate.title || '').toLowerCase().replace(/\s+/g, '')}|${candidate.format}|${candidate.lang}`;
            if (byTitle.has(titleKey)) continue;
            byUrl.add(urlKey);
            byTitle.add(titleKey);

            let score = Number(candidate.baseScore) || 60;
            if (candidate.format === 'ass') score += 6;
            if (codeMatchesText(`${candidate.title || ''}`, code)) score += 4;
            if (candidate.machineTranslated) score -= 8;
            if (candidate.lang === 'zh' || candidate.lang === 'zh-TW') score += 3;

            ranked.push({ ...candidate, rating: Math.max(1, Math.min(99, Math.round(score))) });
        }
        return ranked.sort((a, b) => b.rating - a.rating);
    }

    /**
     * 下载并标准化候选字幕
     * @param {Object} candidate
     * @returns {Promise<{content:string, format:string, cues:Array<Object>, encoding:string}>}
     */
    async download(candidate) {
        if (!candidate?.downloadUrl) throw new Error('SUBTITLE_URL_MISSING');
        const res = await fetchBinaryWithTransport(candidate.downloadUrl, {
            timeout: 20000,
            headers: { Accept: '*/*' }
        });
        if (res.status < 200 || res.status >= 400) throw new Error(`SUBTITLE_HTTP_${res.status}`);

        const { text, encoding } = decodeSubtitleBuffer(res.buffer);
        const { format, cues } = parseSubtitles(text, candidate.format || candidate.downloadUrl);
        if (!cues.length) throw new Error('SUBTITLE_EMPTY');
        return { content: text, format, cues, encoding };
    }
}
