/**
 * SubtitleCode — 字幕候选番号校验（统一复用全局番号解析引擎）
 *
 * 番号识别与归一化一律委托 `src/utils/videoCode.js`，本文件仅提供
 * 「候选字幕是否属于当前番号」这一层比对语义，严禁另造正则或解析器。
 */

import { matchAvCodeFromText, cleanAvCode } from '../../utils/videoCode.js';

/**
 * 归一化比对键：抹平分隔符与数字前导零差异
 * @param {string} code
 * @returns {string}
 */
function normalizeCodeKey(code) {
    return String(code || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .replace(/\d+/g, (digits) => digits.replace(/^0+(?=\d)/, ''));
}

/**
 * 候选文本是否命中目标番号
 * 走全局 PARSER_RULES 管道解析文本，再与目标番号归一化比对，
 * 因此天然继承技术黑名单、路由黑名单与假阳性熔断能力。
 * @param {string} text 字幕标题 / 文件名 / URL
 * @param {string} code 目标番号
 * @returns {boolean}
 */
export function codeMatchesText(text, code) {
    const target = normalizeCodeKey(cleanAvCode(code));
    if (!target) return false;
    const parsed = matchAvCodeFromText(String(text || ''));
    if (!parsed) return false;
    return normalizeCodeKey(parsed) === target;
}
