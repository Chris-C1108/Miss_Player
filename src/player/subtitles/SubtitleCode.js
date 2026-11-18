/**
 * SubtitleCode — 字幕检索番号标准化与清洗层
 *
 * 职责：
 * 1. 复用项目统一的番号解析引擎（src/utils/videoCode.js），杜绝散落正则
 * 2. 剥离字幕文件名常见的域名水印、扩展名、分辨率与版本后缀
 * 3. 生成检索变体（有无连字符、大小写、前导零差异），提升源站召回率
 */

import { matchAvCodeFromText, getVideoCodeFromUrl } from '../../utils/videoCode.js';

/** 文件名噪音：`www.xxx.com@` 域名水印、常见后缀 */
const DOMAIN_WATERMARK = /^(?:[a-z0-9-]+\.)+[a-z]{2,}[@_\-\s]*/i;
const FILE_EXT = /\.(?:mp4|mkv|avi|wmv|mov|ts|m2ts|srt|ass|ssa|vtt|zip|rar|7z)$/i;
const TAIL_SUFFIX = /(?:[-_.\s](?:c|uc|leak|uncensored|ch|zh|cn|cht|eng|jpn|sub|subs|hdr|fhd|uhd|\d{3,4}p|x26[45]|h26[45]|hevc|aac|10bit))+$/i;

/**
 * 清洗番号噪音文本
 * @param {string} raw
 * @returns {string}
 */
export function stripSubtitleNoise(raw) {
    let text = String(raw || '').trim();
    if (!text) return '';
    try {
        text = decodeURIComponent(text);
    } catch (_) {
        /* 已是明文，忽略 */
    }
    text = text.replace(/[_]+/g, ' ').trim();
    let prev = '';
    while (prev !== text) {
        prev = text;
        text = text.replace(DOMAIN_WATERMARK, '').replace(FILE_EXT, '').replace(TAIL_SUFFIX, '').trim();
    }
    return text.replace(/^[-\s_.]+|[-\s_.]+$/g, '');
}

/**
 * 从任意文本 / 链接 / 文件名提取权威番号
 * @param {string} input
 * @returns {string} 形如 `IPX-343`，无法识别时返回空串
 */
export function canonicalizeSubtitleCode(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    if (/^(?:https?:)?\/\//i.test(raw)) {
        const fromUrl = getVideoCodeFromUrl(raw);
        if (fromUrl) return fromUrl;
    }
    return matchAvCodeFromText(stripSubtitleNoise(raw)) || matchAvCodeFromText(raw) || '';
}

/**
 * 归一化比对键：仅保留字母数字并抹平数字前导零
 * @param {string} text
 * @returns {string}
 */
export function normalizeCodeKey(text) {
    return String(text || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .replace(/\d+/g, (digits) => digits.replace(/^0+(?=\d)/, ''));
}

/**
 * 严格校验文本中是否真实命中目标番号（过滤源站模糊匹配噪音）
 * @param {string} text
 * @param {string} code
 * @returns {boolean}
 */
export function codeMatchesText(text, code) {
    const canonical = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!canonical) return false;
    // 按字母段 / 数字段切分，段间允许任意分隔符，数字段自动抹平前导零
    const segments = canonical.match(/[A-Z]+|\d+/g) || [];
    const pattern = segments
        .map((seg) => (/^\d/.test(seg) ? `0*${seg.replace(/^0+/, '') || seg}` : seg))
        .join('[^A-Z0-9]*');
    // 前后边界断言：必须独立成词，杜绝 IPX-343 命中 IPX-3431
    const re = new RegExp(`(?:^|[^A-Z0-9])${pattern}(?![0-9])`);
    return re.test(String(text || '').toUpperCase());
}

/**
 * 生成检索变体（去重后的候选查询串）
 * @param {string} code
 * @returns {string[]}
 */
export function buildSearchVariants(code) {
    const canonical = String(code || '').trim();
    if (!canonical) return [];
    const variants = new Set([canonical, canonical.toLowerCase()]);
    const compact = canonical.replace(/-/g, '');
    variants.add(compact);
    variants.add(compact.toLowerCase());

    const parts = canonical.match(/^([A-Za-z0-9]+)-(\d+)$/);
    if (parts) {
        const digits = parts[2];
        const stripped = digits.replace(/^0+/, '') || digits;
        variants.add(`${parts[1]}-${stripped}`);
        variants.add(`${parts[1]}${stripped}`);
        if (digits.length < 5) variants.add(`${parts[1]}-${digits.padStart(5, '0')}`);
    }
    return Array.from(variants).filter(Boolean);
}
