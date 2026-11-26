/**
 * SubtitleQualityScorer — 字幕质量评分与自动择优引擎 (SQI)
 *
 * 对解析后的 cues 进行多维健康度评估：
 *   1. 损坏 / 空轨 / 重度乱码拦截
 *   2. 视频时长覆盖率与截断检测（仅对 >= 300s 长视频启用）
 *   3. 重复率 / 连续重复 / Whisper 水印幻觉检测
 *   4. 双跳净网机翻腔特征检测
 */

import { convertChineseText } from './SubtitleChineseConverter.js';

const WHISPER_HALLUCINATION_RE = /谢谢观看|请订阅|感谢您的收听|感谢收看|优优独播|WhisperJAV|字幕由/i;

const SANITIZED_MT_RE = /努力工作|这是正确的|感觉真好|非常深|你可以吃它|我明白了|你做得很好|这是一只鸭子|停止努力工作|我觉得很好|对不起[，,]\s*我|请住手/;

function normalizeCueText(raw) {
    return String(raw || '').trim().replace(/\s+/g, ' ');
}

function hasHeavyMojibake(cues) {
    let replacementCount = 0;
    let nonSpaceCount = 0;
    let affectedCues = 0;

    for (const cue of cues) {
        const text = String(cue?.text || '');
        if (!text) continue;
        let cueHits = 0;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code === 0xfffd) {
                replacementCount += 1;
                cueHits += 1;
            }
            if (code > 0x20) {
                nonSpaceCount += 1;
            }
        }
        if (cueHits > 0) affectedCues += 1;
    }

    if (nonSpaceCount === 0) return true;
    if (replacementCount / nonSpaceCount >= 0.15) return true;
    if (cues.length >= 5 && affectedCues / cues.length >= 0.25) return true;
    return false;
}

function resolveGradeAndLabel(sqi, cueCount, reasons) {
    if (reasons.includes('corrupted_or_empty') || sqi < 30) {
        return {
            grade: 'broken',
            label: reasons.includes('truncated') ? '残缺' : '异常'
        };
    }
    if ((reasons.includes('truncated') || reasons.includes('low_coverage')) && sqi < 55) {
        return { grade: 'low', label: '残缺' };
    }
    if (sqi < 55) {
        return {
            grade: 'low',
            label: reasons.includes('sanitized_mt') ? '机翻' : '异常'
        };
    }
    if (sqi < 75) {
        return {
            grade: 'medium',
            label: reasons.includes('sanitized_mt') ? '机翻' : ''
        };
    }
    return {
        grade: 'high',
        label: cueCount >= 40 ? '优质' : ''
    };
}

/**
 * 评估字幕质量并输出 SQI 分数、等级、徽章与详细指标
 * @param {Array<{start:number,end:number,text:string}>} cues
 * @param {{ videoDurationSec?: number, langInfo?: Object|null }} [options]
 * @returns {{
 *   sqi: number,
 *   grade: 'high'|'medium'|'low'|'broken',
 *   label: '优质'|'机翻'|'残缺'|'异常'|'',
 *   reasons: string[],
 *   metrics: { cueCount: number, coverage: number, dupRate: number, maxRun: number, mtRate: number, hallucinationHits: number }
 * }}
 */
export function scoreSubtitleQuality(cues, { videoDurationSec = 0, langInfo = null } = {}) {
    const cueCount = Array.isArray(cues) ? cues.length : 0;
    if (
        !Array.isArray(cues) ||
        cueCount === 0 ||
        langInfo?.isCorrupted ||
        langInfo?.trackLayout === 'corrupted' ||
        hasHeavyMojibake(cues)
    ) {
        return {
            sqi: 5,
            grade: 'broken',
            label: '异常',
            reasons: ['corrupted_or_empty'],
            metrics: {
                cueCount,
                coverage: 0,
                dupRate: 0,
                maxRun: 0,
                mtRate: 0,
                hallucinationHits: 0
            }
        };
    }

    const firstStart = Number(cues[0]?.start) || 0;
    const lastEnd = Number(cues[cueCount - 1]?.end) || 0;
    const span = Math.max(0, lastEnd - firstStart);
    const duration = Number(videoDurationSec) || 0;
    const coverage = duration > 0 ? Math.max(0, span / duration) : 0;

    const uniqueTexts = new Set();
    let prevText = null;
    let currentRun = 0;
    let maxRun = 0;
    let hallucinationHits = 0;
    let mtHits = 0;

    for (const cue of cues) {
        const norm = normalizeCueText(cue?.text);
        uniqueTexts.add(norm);
        if (norm && norm === prevText) {
            currentRun += 1;
        } else {
            currentRun = norm ? 1 : 0;
            prevText = norm;
        }
        if (currentRun > maxRun) maxRun = currentRun;

        const simplified = norm ? convertChineseText(norm, 'zh') : '';
        if (WHISPER_HALLUCINATION_RE.test(norm) || (simplified && WHISPER_HALLUCINATION_RE.test(simplified))) {
            hallucinationHits += 1;
        }
        if (SANITIZED_MT_RE.test(norm) || (simplified && SANITIZED_MT_RE.test(simplified))) {
            mtHits += 1;
        }
    }

    const dupRate = 1 - uniqueTexts.size / cueCount;
    const mtRate = mtHits / cueCount;

    let sqi = 100;
    const reasons = [];

    if (duration >= 300) {
        if (cueCount < 20 || coverage < 0.25) {
            sqi -= 55;
            reasons.push('truncated');
        } else if (coverage < 0.5) {
            sqi -= 25;
            reasons.push('low_coverage');
        }
    }

    if (cueCount >= 40) {
        if (dupRate > 0.6) {
            sqi -= 32;
            reasons.push('high_repetition');
        } else if (dupRate > 0.48) {
            sqi -= 20;
            reasons.push('high_repetition');
        }

        if (maxRun >= 8) {
            sqi -= 15;
            reasons.push('consecutive_repetition');
        }

        if (hallucinationHits >= 3) {
            sqi -= 15;
            reasons.push('whisper_hallucination');
        }

        if (mtHits >= 6 || mtRate >= 0.015) {
            sqi -= Math.min(35, mtHits * 2 + 12);
            reasons.push('sanitized_mt');
        }
    }

    const clampedSqi = Math.max(0, Math.min(100, Math.round(sqi)));
    const { grade, label } = resolveGradeAndLabel(clampedSqi, cueCount, reasons);

    return {
        sqi: clampedSqi,
        grade,
        label,
        reasons,
        metrics: {
            cueCount,
            coverage,
            dupRate,
            maxRun,
            mtRate,
            hallucinationHits
        }
    };
}

/**
 * 从已完成 SQI 评估的候选字幕列表中择优选择最佳轨道
 * @param {Array<{candidate?: Object, item?: Object, parsed?: {cues?: Array}, quality?: Object}>} evaluatedList
 * @returns {Object|null}
 */
export function selectBestQualityCandidate(evaluatedList) {
    if (!Array.isArray(evaluatedList) || evaluatedList.length === 0) return null;

    const valid = evaluatedList.filter((entry) => (
        entry &&
        Array.isArray(entry.parsed?.cues) &&
        entry.parsed.cues.length > 0 &&
        !entry.quality?.reasons?.includes('corrupted_or_empty')
    ));
    if (valid.length === 0) return null;

    const nonBroken = valid.filter((entry) => entry.quality?.grade !== 'broken');
    const pool = nonBroken.length > 0 ? nonBroken : valid;

    return pool
        .map((entry, idx) => ({ entry, idx }))
        .sort((a, b) => {
            const diff = (Number(b.entry.quality?.sqi) || 0) - (Number(a.entry.quality?.sqi) || 0);
            return diff !== 0 ? diff : a.idx - b.idx;
        })[0].entry;
}
