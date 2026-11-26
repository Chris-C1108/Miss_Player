/**
 * SubtitleLanguageDetector — 内容优先的字幕真实语言探测与双语分轨引擎
 *
 * 解决外部站点常把中文/双语字幕误标为 en、或将 EUC-KR 乱码另存为 UTF-8 的问题；
 * 同时支持多行与行内混合（中+日 / 中+英）双语字幕的精准分轨与按需展示。
 */

import { COMMON_ZH_CHARS } from './SubtitleDecoder.js';
import { detectChineseScript } from './SubtitleChineseConverter.js';

const VI_DIACRITIC_RE = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
const AV_CODE_ONLY_RE = /^[A-Z0-9]{1,6}-\d{2,6}$/i;
const SEPARATOR_TOKEN_RE = /^[/|｜\-—·•]+$/;

function isHanCode(code) {
    return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
}

function isKanaCode(code) {
    return (code >= 0x3040 && code <= 0x309f)
        || (code >= 0x30a1 && code <= 0x30fa)
        || (code >= 0x30fc && code <= 0x30ff);
}

function isHangulCode(code) {
    return (code >= 0xac00 && code <= 0xd7af) || (code >= 0x3130 && code <= 0x318f);
}

function isLatinCode(code) {
    return (code >= 0x41 && code <= 0x5a)
        || (code >= 0x61 && code <= 0x7a)
        || (code >= 0x00c0 && code <= 0x024f)
        || (code >= 0x1e00 && code <= 0x1eff);
}

function isOtherScriptLetter(code) {
    return (code >= 0x0370 && code <= 0x03ff) // Greek
        || (code >= 0x0400 && code <= 0x04ff) // Cyrillic
        || (code >= 0x0600 && code <= 0x06ff) // Arabic
        || (code >= 0x0e00 && code <= 0x0e7f); // Thai
}

function countScriptStats(text) {
    const str = String(text || '');
    let hanCount = 0;
    let commonZhCount = 0;
    let kanaCount = 0;
    let hangulCount = 0;
    let latinCount = 0;
    let viCount = 0;
    let totalChars = 0;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const code = str.charCodeAt(i);
        if (isHanCode(code)) {
            hanCount++;
            totalChars++;
            if (COMMON_ZH_CHARS.has(ch)) commonZhCount++;
        } else if (isKanaCode(code)) {
            kanaCount++;
            totalChars++;
        } else if (isHangulCode(code)) {
            hangulCount++;
            totalChars++;
        } else if (isLatinCode(code)) {
            latinCount++;
            totalChars++;
            if (VI_DIACRITIC_RE.test(ch)) viCount++;
        } else if (isOtherScriptLetter(code)) {
            totalChars++;
        }
    }

    const trimmed = str.trim();
    const hasLatinWords = /[A-Za-z]{2,}/.test(str) && !AV_CODE_ONLY_RE.test(trimmed);

    return {
        hanCount,
        commonZhCount,
        kanaCount,
        hangulCount,
        latinCount,
        viCount,
        totalChars,
        hasLatinWords
    };
}

function trimBoundarySeparators(tokens) {
    let start = 0;
    let end = tokens.length;
    while (start < end && SEPARATOR_TOKEN_RE.test(tokens[start].text)) start++;
    while (end > start && SEPARATOR_TOKEN_RE.test(tokens[end - 1].text)) end--;
    return tokens.slice(start, end);
}

function isBilingualLayoutHint(layoutHint) {
    if (!layoutHint) return false;
    if (typeof layoutHint === 'string') return layoutHint === 'bilingual';
    return layoutHint.trackLayout === 'bilingual';
}

function isCorruptedLayoutHint(layoutHint) {
    if (!layoutHint) return false;
    if (typeof layoutHint === 'string') return layoutHint === 'corrupted';
    return layoutHint.trackLayout === 'corrupted' || layoutHint.isCorrupted === true;
}

function normalizeHintLang(hint) {
    const raw = String(hint || '').trim().toLowerCase();
    if (!raw || raw === 'auto' || raw === 'unknown') return '';
    if (raw === 'zh-tw' || raw === 'zh-hk' || raw === 'zh-hant' || raw === 'cht') return 'zh-TW';
    if (raw === 'zh' || raw === 'zh-cn' || raw === 'zh-hans' || raw === 'chs') return 'zh';
    if (raw === 'ja' || raw === 'jp' || raw === 'jpn') return 'ja';
    if (raw === 'ko' || raw === 'kor') return 'ko';
    if (raw === 'en' || raw === 'eng') return 'en';
    if (raw === 'vi' || raw === 'vie') return 'vi';
    return raw;
}

function sampleCuesEvenly(cues, limit = 200) {
    if (cues.length <= limit) return cues;
    const sampled = [];
    for (let i = 0; i < limit; i++) {
        const idx = Math.floor((i * cues.length) / limit);
        sampled.push(cues[idx]);
    }
    return sampled;
}

/**
 * 拆分单条双语字幕（支持多行双语与行内空格拼接双语）
 * @param {string} text
 * @param {string|object|null} [layoutHint]
 * @returns {{ primaryText: string, secondaryText: string, primaryLang: string, secondaryLang: string, zhText: string, jaText: string }}
 */
export function splitBilingualCue(text, layoutHint = null) {
    const raw = String(text || '');
    const fallback = {
        primaryText: raw,
        secondaryText: '',
        primaryLang: '',
        secondaryLang: '',
        zhText: raw,
        jaText: ''
    };

    if (!raw.trim() || isCorruptedLayoutHint(layoutHint)) return fallback;
    const bilingualHint = isBilingualLayoutHint(layoutHint);

    // 1. 多行模式（\n）
    if (raw.includes('\n')) {
        const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
            const zhLines = [];
            const jaLines = [];
            const latinLines = [];

            for (const line of lines) {
                const stats = countScriptStats(line);
                if (stats.kanaCount > 0) {
                    jaLines.push(line);
                } else if (stats.hanCount > 0) {
                    zhLines.push(line);
                } else if (stats.hasLatinWords) {
                    latinLines.push(line);
                }
            }

            const otherLines = jaLines.length > 0 ? [...jaLines, ...latinLines] : latinLines;
            if (zhLines.length > 0 && otherLines.length > 0) {
                const zhText = zhLines.join('\n');
                const zhStats = countScriptStats(zhText);
                if (zhStats.commonZhCount >= 1 || bilingualHint) {
                    const jaText = jaLines.join('\n');
                    return {
                        primaryText: zhText,
                        secondaryText: otherLines.join('\n'),
                        primaryLang: 'zh',
                        secondaryLang: jaLines.length > 0 ? 'ja' : 'en',
                        zhText,
                        jaText
                    };
                }
            }
        }
    }

    // 2. 行内空格拼接模式（如 ANAV-001 / PFES-027：中+日 / 日+中 / 中+英）
    const tokens = raw.trim().split(/\s+/).filter(Boolean).map((tok) => ({
        text: tok,
        ...countScriptStats(tok)
    }));

    if (tokens.length >= 2) {
        let firstKanaIdx = -1;
        let lastKanaIdx = -1;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].kanaCount > 0) {
                if (firstKanaIdx < 0) firstKanaIdx = i;
                lastKanaIdx = i;
            }
        }

        if (firstKanaIdx >= 0) {
            let zhTokens = null;
            let jaTokens = null;

            if (firstKanaIdx > 0 && lastKanaIdx === tokens.length - 1) {
                zhTokens = trimBoundarySeparators(tokens.slice(0, firstKanaIdx));
                jaTokens = trimBoundarySeparators(tokens.slice(firstKanaIdx));
            } else if (firstKanaIdx === 0 && lastKanaIdx < tokens.length - 1) {
                jaTokens = trimBoundarySeparators(tokens.slice(0, lastKanaIdx + 1));
                zhTokens = trimBoundarySeparators(tokens.slice(lastKanaIdx + 1));
            }

            if (zhTokens && jaTokens && zhTokens.length > 0 && jaTokens.length > 0) {
                const zhHasLatinOnly = zhTokens.some((t) => t.hanCount === 0 && t.hasLatinWords);
                const zhHan = zhTokens.reduce((sum, t) => sum + t.hanCount, 0);
                if (!zhHasLatinOnly && zhHan >= 1) {
                    const zhText = zhTokens.map((t) => t.text).join(' ');
                    const jaText = jaTokens.map((t) => t.text).join(' ');
                    return {
                        primaryText: zhText,
                        secondaryText: jaText,
                        primaryLang: 'zh',
                        secondaryLang: 'ja',
                        zhText,
                        jaText
                    };
                }
            }
        } else {
            // 行内中+英（如 "早上好 Good morning"）
            let firstLatinIdx = -1;
            let lastLatinIdx = -1;
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].hanCount === 0 && tokens[i].hasLatinWords) {
                    if (firstLatinIdx < 0) firstLatinIdx = i;
                    lastLatinIdx = i;
                }
            }

            if (firstLatinIdx >= 0) {
                let zhTokens = null;
                let enTokens = null;
                if (firstLatinIdx > 0 && lastLatinIdx === tokens.length - 1) {
                    zhTokens = trimBoundarySeparators(tokens.slice(0, firstLatinIdx));
                    enTokens = trimBoundarySeparators(tokens.slice(firstLatinIdx));
                } else if (firstLatinIdx === 0 && lastLatinIdx < tokens.length - 1) {
                    enTokens = trimBoundarySeparators(tokens.slice(0, lastLatinIdx + 1));
                    zhTokens = trimBoundarySeparators(tokens.slice(lastLatinIdx + 1));
                }

                if (zhTokens && enTokens && zhTokens.length > 0 && enTokens.length > 0) {
                    const zhHasLatinOnly = zhTokens.some((t) => t.hanCount === 0 && t.hasLatinWords);
                    const enHasHan = enTokens.some((t) => t.hanCount > 0);
                    const zhHan = zhTokens.reduce((sum, t) => sum + t.hanCount, 0);
                    const zhCommon = zhTokens.reduce((sum, t) => sum + t.commonZhCount, 0);
                    const enWordCount = enTokens.filter((t) => t.hasLatinWords).length;
                    if (!zhHasLatinOnly && !enHasHan && zhHan >= 1 && zhCommon >= 1 && (enWordCount >= 2 || bilingualHint)) {
                        const zhText = zhTokens.map((t) => t.text).join(' ');
                        const enText = enTokens.map((t) => t.text).join(' ');
                        return {
                            primaryText: zhText,
                            secondaryText: enText,
                            primaryLang: 'zh',
                            secondaryLang: 'en',
                            zhText,
                            jaText: ''
                        };
                    }
                }
            }
        }
    }

    return fallback;
}

/**
 * 基于字幕真实内容识别语言、双语布局及已损坏乱码
 * @param {Array<{text:string}|string>} cues
 * @param {string} [hintLang]
 * @returns {{ detectedLang: string, primaryLang: string, secondaryLang: string, trackLayout: 'mono'|'bilingual'|'corrupted', isCorrupted: boolean, commonZhRate: number, confidence: number }}
 */
export function detectSubtitleLanguage(cues, hintLang = '') {
    const list = Array.isArray(cues) ? cues : [];
    const normalizedHint = normalizeHintLang(hintLang);
    if (!list.length) {
        return {
            detectedLang: normalizedHint || 'unknown',
            primaryLang: normalizedHint || 'unknown',
            secondaryLang: '',
            trackLayout: 'mono',
            isCorrupted: false,
            commonZhRate: 0,
            confidence: 0
        };
    }

    const sampled = sampleCuesEvenly(list, 200);
    let hanCount = 0;
    let commonZhCount = 0;
    let kanaCount = 0;
    let hangulCount = 0;
    let latinCount = 0;
    let viCount = 0;
    let totalChars = 0;

    let nonEmptyCueCount = 0;
    let bilingualCueCount = 0;
    let pureHanCueCount = 0;
    const zhSampleParts = [];
    const allSampleParts = [];

    for (const cue of sampled) {
        const text = typeof cue === 'string' ? cue : String(cue?.text || '');
        if (!text.trim()) continue;
        nonEmptyCueCount++;
        allSampleParts.push(text);

        const stats = countScriptStats(text);
        hanCount += stats.hanCount;
        commonZhCount += stats.commonZhCount;
        kanaCount += stats.kanaCount;
        hangulCount += stats.hangulCount;
        latinCount += stats.latinCount;
        viCount += stats.viCount;
        totalChars += stats.totalChars;

        if (stats.hanCount >= 2 && stats.kanaCount === 0 && stats.commonZhCount >= 1) {
            pureHanCueCount++;
        }

        const split = splitBilingualCue(text);
        if (split.secondaryText && split.secondaryText.trim()) {
            bilingualCueCount++;
            if (split.zhText) zhSampleParts.push(split.zhText);
        } else if (stats.hanCount > 0 && stats.kanaCount === 0) {
            zhSampleParts.push(text);
        }
    }

    const hanRatio = totalChars > 0 ? hanCount / totalChars : 0;
    const kanaRatio = totalChars > 0 ? kanaCount / totalChars : 0;
    const hangulRatio = totalChars > 0 ? hangulCount / totalChars : 0;
    const latinRatio = totalChars > 0 ? latinCount / totalChars : 0;
    const commonZhRate = hanCount > 0 ? commonZhCount / hanCount : 0;
    const bilingualRatio = nonEmptyCueCount > 0 ? bilingualCueCount / nonEmptyCueCount : 0;
    const pureHanCueRatio = nonEmptyCueCount > 0 ? pureHanCueCount / nonEmptyCueCount : 0;

    // 1. 捕获 EUC-KR 以 GBK 解码并另存为 UTF-8 的永久乱码（大量生僻汉字、极低常用字命中率）
    const isCorrupted = totalChars >= 24
        && hanRatio >= 0.45
        && kanaRatio < 0.05
        && hangulRatio < 0.05
        && commonZhRate < 0.18;

    if (isCorrupted) {
        return {
            detectedLang: 'unknown',
            primaryLang: 'unknown',
            secondaryLang: '',
            trackLayout: 'corrupted',
            isCorrupted: true,
            commonZhRate,
            confidence: 0.95
        };
    }

    // 2. 判定布局：避免纯日文字幕（约 25-35% 汉字 + 65-75% 假名，无双语分轨结构）误判为双语
    const hasSplitZhJa = kanaRatio >= 0.08
        && hanRatio >= 0.25
        && commonZhRate >= 0.20
        && (hanRatio >= 0.45 || pureHanCueRatio >= 0.15);
    const hasSplitZhEn = latinRatio >= 0.22 && hanRatio >= 0.25 && commonZhRate >= 0.20;
    const isBilingual = bilingualRatio >= 0.25 || hasSplitZhJa || hasSplitZhEn;
    const trackLayout = isBilingual ? 'bilingual' : 'mono';

    const zhSample = zhSampleParts.length ? zhSampleParts.join('\n') : allSampleParts.join('\n');

    if (trackLayout === 'bilingual') {
        const primaryLang = hanCount > 0
            ? (detectChineseScript(zhSample) || (normalizedHint === 'zh-TW' ? 'zh-TW' : 'zh'))
            : (latinCount > kanaCount ? 'en' : 'ja');
        const secondaryLang = kanaCount >= latinCount ? 'ja' : 'en';
        const confidence = Math.min(0.98, Math.max(0.75, 0.65 + bilingualRatio * 0.3));
        return {
            detectedLang: primaryLang,
            primaryLang,
            secondaryLang,
            trackLayout: 'bilingual',
            isCorrupted: false,
            commonZhRate,
            confidence
        };
    }

    // 3. 单语判定（以实际文本内容为第一真理，覆盖误标 hint）
    let detectedLang = normalizedHint || 'unknown';
    let confidence = normalizedHint ? 0.4 : 0.1;

    if (hangulRatio >= 0.25) {
        detectedLang = 'ko';
        confidence = Math.min(0.99, 0.6 + hangulRatio * 0.38);
    } else if (kanaRatio >= 0.10) {
        detectedLang = 'ja';
        confidence = Math.min(0.99, 0.6 + kanaRatio * 0.38);
    } else if (hanRatio >= 0.25) {
        detectedLang = detectChineseScript(zhSample) || (normalizedHint === 'zh-TW' ? 'zh-TW' : 'zh');
        confidence = Math.min(0.99, 0.55 + hanRatio * 0.28 + commonZhRate * 0.16);
    } else if (viCount >= 4 && latinRatio >= 0.35) {
        detectedLang = 'vi';
        confidence = Math.min(0.98, 0.6 + latinRatio * 0.32);
    } else if (latinRatio >= 0.40) {
        detectedLang = 'en';
        confidence = Math.min(0.98, 0.55 + latinRatio * 0.4);
    }

    return {
        detectedLang,
        primaryLang: detectedLang,
        secondaryLang: '',
        trackLayout: 'mono',
        isCorrupted: false,
        commonZhRate,
        confidence
    };
}

/**
 * 为 cue 列表附加双语分轨字段（保留原 start / end / text）
 * @param {Array<{start:number,end:number,text:string}>} cues
 * @param {object|null} [langInfo]
 * @returns {Array<{start:number,end:number,text:string,primaryText:string,secondaryText:string,zhText:string,jaText:string}>}
 */
export function enrichCuesWithTracks(cues, langInfo = null) {
    const list = Array.isArray(cues) ? cues : [];
    const layout = langInfo?.trackLayout || null;

    return list.map((cue) => {
        const text = String(cue?.text || '');
        if (layout === 'corrupted') {
            return {
                ...cue,
                primaryText: text,
                secondaryText: '',
                zhText: text,
                jaText: ''
            };
        }
        const split = splitBilingualCue(text, langInfo);
        if (layout !== 'bilingual' && !split.secondaryText) {
            return {
                ...cue,
                primaryText: text,
                secondaryText: '',
                zhText: text,
                jaText: ''
            };
        }
        return {
            ...cue,
            primaryText: split.primaryText,
            secondaryText: split.secondaryText,
            zhText: split.zhText,
            jaText: split.jaText
        };
    });
}

/**
 * 按显示模式输出单条 cue 渲染内容
 * @param {object} cue
 * @param {'primary'|'secondary'|'bilingual'} [mode]
 * @returns {{ primary: string, secondary: string, text: string }}
 */
export function formatCueForDisplayMode(cue, mode = 'primary') {
    const primaryBase = String(cue?.primaryText || cue?.text || '');
    const secondaryBase = String(cue?.secondaryText || '');

    if (mode === 'secondary') {
        const chosen = secondaryBase || primaryBase;
        return { primary: chosen, secondary: '', text: chosen };
    }
    if (mode === 'bilingual') {
        return {
            primary: primaryBase,
            secondary: secondaryBase,
            text: secondaryBase ? `${primaryBase}\n${secondaryBase}` : primaryBase
        };
    }
    return { primary: primaryBase, secondary: '', text: primaryBase };
}
