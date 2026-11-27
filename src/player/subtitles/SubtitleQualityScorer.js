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

const WHISPER_HALLUCINATION_RE = /谢谢观看|感谢(?:您|大家)?的?(?:观看|收看|收听|支持)|请订阅|欢迎订阅|请点赞|优优独播|WhisperJAV|字幕由/i;

const WHISPER_POLITE_NOISE_RE = /(?:^|[\s，,。.!！?？])(?:你好|谢谢|非常感谢|不客气|早上好|晚上好|你太棒了|干得好|女士[，,]?\s*你好吗|我很好|很高兴见到你|我来开门)(?:$|[\s，,。.!！?？])|\bChico\b|奇科/gi;

const SANITIZED_MT_RE = /努力工作|这是正确的|感觉真好|非常深|你可以吃它|我明白了|你做得很好|这是一只鸭子|停止努力工作|我觉得很好|对不起[，,]\s*我|请住手/;

const PURE_MOAN_CUE_RE = /^[啊嗯唔哦呃哈噢呀唉哼呼嘶呵ー〜~～!！?？。.,，\s]+$/i;

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
    let semanticMaxRun = 0;
    let shortMaxRun = 0;
    let hallucinationHits = 0;
    let politeNoiseHits = 0;
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
        if (currentRun > semanticMaxRun && !PURE_MOAN_CUE_RE.test(norm)) {
            if (norm.length <= 2) {
                if (currentRun > shortMaxRun) shortMaxRun = currentRun;
            } else {
                semanticMaxRun = currentRun;
            }
        }

        const simplified = norm ? convertChineseText(norm, 'zh') : '';
        if (WHISPER_HALLUCINATION_RE.test(norm) || (simplified && WHISPER_HALLUCINATION_RE.test(simplified))) {
            hallucinationHits += 1;
        }
        const checkTarget = simplified || norm;
        if (checkTarget) {
            const matches = checkTarget.match(WHISPER_POLITE_NOISE_RE);
            if (matches && matches.length > 0) {
                politeNoiseHits += matches.length;
            }
        }
        if (SANITIZED_MT_RE.test(norm) || (simplified && SANITIZED_MT_RE.test(simplified))) {
            mtHits += 1;
        }
    }

    const dupRate = 1 - uniqueTexts.size / cueCount;
    const mtRate = mtHits / cueCount;

    const effectiveDur = duration >= 300 ? duration : span;
    let maxGapSec = 0;
    for (let i = 1; i < cueCount; i++) {
        const prevEnd = Number(cues[i - 1]?.end ?? cues[i - 1]?.start) || 0;
        const gap = Math.max(0, (Number(cues[i]?.start) || 0) - prevEnd);
        if (gap > maxGapSec) maxGapSec = gap;
    }

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

    // 针对无视频时长或两头分布造成的超长空洞/极低密度（如 3 小时仅 90 句且中段断层 97 分钟）降权拦截
    if (effectiveDur >= 1800) {
        const cuesPerMin = cueCount / (effectiveDur / 60);
        const isExtremeSparse = cuesPerMin < 0.75;
        const hasGiantGap = maxGapSec >= 2400 && (maxGapSec / effectiveDur) >= 0.35;
        if (isExtremeSparse || hasGiantGap) {
            sqi -= (isExtremeSparse && hasGiantGap) ? 48 : 30;
            reasons.push('giant_gap_or_sparse');
        }
    }

    if (cueCount >= 40) {
        if (dupRate > 0.6) {
            sqi -= 32;
            reasons.push('high_repetition');
        } else if (dupRate > 0.48 && (cueCount < 1000 || uniqueTexts.size < 450 || dupRate > 0.56)) {
            sqi -= 20;
            reasons.push('high_repetition');
        }

        // 单字纯拟声词容忍至 <20，超短 <=2 字应答（如“是的”8连）容忍至 <10，完整短语 >=8 即拦截
        if (semanticMaxRun >= 8 || shortMaxRun >= 10 || maxRun >= 20) {
            sqi -= 15;
            reasons.push('consecutive_repetition');
        }

        const hallRate = hallucinationHits / cueCount;
        if (hallRate >= 0.015 || hallucinationHits >= 6) {
            sqi -= 15;
            reasons.push('whisper_hallucination');
        }

        const politeRate = politeNoiseHits / cueCount;
        if (politeRate >= 0.028 || (politeNoiseHits >= 12 && politeRate >= 0.015)) {
            sqi -= Math.min(34, politeNoiseHits * 2 + 12);
            reasons.push('whisper_polite_noise');
        }

        if (mtRate >= 0.025 || (mtHits >= 12 && mtRate >= 0.015)) {
            sqi -= Math.min(35, mtHits * 2 + 12);
            reasons.push('sanitized_mt');
        } else if (mtHits >= 3) {
            sqi -= Math.min(15, mtHits * 2);
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
            hallucinationHits,
            politeNoiseHits
        }
    };
}

/**
 * 生成字幕轨道内容指纹，用于在多源下载时识别同一份字幕的重复哈希副本
 * @param {Array<{start?:number,text?:string}>} cues
 * @returns {string}
 */
export function computeTrackContentFingerprint(cues) {
    if (!Array.isArray(cues) || cues.length === 0) return 'empty';
    const sampleSize = Math.min(12, cues.length);
    const parts = [];
    for (let i = 0; i < sampleSize; i++) {
        const idx = sampleSize === 1 ? 0 : Math.round((i * (cues.length - 1)) / (sampleSize - 1));
        const c = cues[idx];
        parts.push(`${Math.round(Number(c?.start) || 0)}:${normalizeCueText(c?.text).slice(0, 24)}`);
    }
    return `${cues.length}|${parts.join('|')}`;
}

function measureTimeOverlapRatio(cuesA, cuesB) {
    if (!Array.isArray(cuesA) || !Array.isArray(cuesB) || !cuesA.length || !cuesB.length) return 0;
    const bStarts = cuesB.map((c) => Number(c?.start) || 0).sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(cuesA.length / 40));
    let sampled = 0;
    let matched = 0;
    for (let i = 0; i < cuesA.length && sampled < 40; i += step) {
        sampled += 1;
        const t = Number(cuesA[i]?.start) || 0;
        let lo = 0;
        let hi = bStarts.length - 1;
        let ok = false;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const diff = bStarts[mid] - t;
            if (Math.abs(diff) <= 5) {
                ok = true;
                break;
            }
            if (diff < 0) lo = mid + 1;
            else hi = mid - 1;
        }
        if (ok) matched += 1;
    }
    return sampled > 0 ? matched / sampled : 0;
}

/**
 * 从已完成 SQI 评估的候选字幕列表中择优选择最佳轨道（支持多轨道稀疏度对比与交叉时间轴共识加权）
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
    const peerMaxCues = pool.reduce((m, e) => Math.max(m, e.parsed.cues.length), 0);

    const scoreEntry = (entry, selfIdx) => {
        let score = Number(entry?.quality?.sqi) || 0;
        if (!entry?.item?.machineTranslated) score += 8;
        else if (entry?.item?.originLang === 'en') score -= 14;

        const cues = entry.parsed.cues;
        if (peerMaxCues >= 300 && cues.length < peerMaxCues * 0.45) {
            score -= 22;
        }

        if (pool.length >= 2) {
            let bestOverlap = 0;
            for (let j = 0; j < pool.length; j++) {
                if (j === selfIdx) continue;
                const ratio = measureTimeOverlapRatio(cues, pool[j].parsed.cues);
                if (ratio > bestOverlap) bestOverlap = ratio;
            }
            if (bestOverlap >= 0.35) score += 6;
            else if (pool.length >= 3 && bestOverlap < 0.1) score -= 10;
        }
        return score;
    };

    return pool
        .map((entry, idx) => ({ entry, idx, effective: scoreEntry(entry, idx) }))
        .sort((a, b) => {
            const diff = b.effective - a.effective;
            return diff !== 0 ? diff : a.idx - b.idx;
        })[0].entry;
}
