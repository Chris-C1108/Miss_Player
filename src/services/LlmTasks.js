/**
 * LlmTasks — 面向 Miss Player 业务场景的 AI Prompt 编排、提示词压缩与结构化校验层
 *
 * 任务覆盖：
 * 1. compressCuesForLlm: 字幕去重、短句合并与均匀抽样压缩
 * 2. analyzeSubtitleChaptersWithLlm: 字幕剧情结构与时间轴节点分幕
 * 3. summarizeCommentsWithLlm: 跨站评论去重聚合、口碑简报与高能时刻提炼
 * 4. autoTagMarkerWithLlm: 局部时间窗语境下的合规语义标签自动打标
 */

import { LlmService, LlmCache } from './LlmService.js';
import { SEMANTIC_TAG_TAXONOMY } from '../player/managers/tagTaxonomy.js';
import { analyzeSubtitlePlot } from '../player/subtitles/SubtitlePlotAnalyzer.js';
import { formatMetadataForLlm } from './AvMetadataService.js';
import { AiDebugLogger } from './AiDebugLogger.js';
import { scoreSubtitleQuality } from '../player/subtitles/SubtitleQualityScorer.js';

export const AI_PROMPT_VERSION = 'v3.4';

/**
 * 计算带 Prompt 版本与当前模型 ID 的确定性缓存摘要，保证调优或切换模型后旧缓存自动失效
 * @param {string} taskType
 * @param {string} payloadStr
 * @returns {string}
 */
export function buildVersionedTaskHash(taskType, payloadStr) {
    const model = LlmService.getConfig().model || '';
    return LlmCache.hashContent(`${AI_PROMPT_VERSION}|${model}|${taskType}|${payloadStr}`);
}

const MOAN_FILLER_RE = /^[啊嗯哦哈呜唔呀呐噢唉呀啊哈\.…!！?？\s~～、，,]+$/;
const LOW_INFO_PLEA_RE = /^(?:[嗯啊哦哈呜唔呀呐嘿呃喂]+|[不别停等算]+(?:了吧|了|啊|呀|哦)?|等等|停下来|不要|别碰我|好舒服|我做不到|对不起|没关系|是的|我知道了)[,，.。!！?？\s…~～]*$/;
const WHISPER_NOISE_LINE_RE = /谢谢观看|感谢(?:您|大家)?的?(?:观看|收看|收听|支持)|请订阅|欢迎订阅|优优独播|WhisperJAV|字幕由/i;
const WHISPER_GREETING_TOKEN_RE = /(?:你好|谢谢|非常感谢|你太棒了|干得好|女士[，,]?\s*你好吗|我很好|Chico|奇科)/g;

const ALL_SEMANTIC_TAGS = SEMANTIC_TAG_TAXONOMY.flatMap((group) =>
    Array.isArray(group?.tags) ? group.tags : []
);
const ALLOWED_TAG_SET = new Set(ALL_SEMANTIC_TAGS);

function formatMmSs(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    if (s >= 3600) {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const rem = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function formatLegacyMmSs(totalSeconds) {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function normalizeInlineText(raw) {
    return String(raw || '')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sampleLinesToBudget(lines, maxChars) {
    if (!Array.isArray(lines) || lines.length === 0 || maxChars <= 0) return '';
    const full = lines.join('\n');
    if (full.length <= maxChars) return full;
    if (lines.length === 1) return lines[0].slice(0, maxChars);

    const buildSample = (count) => {
        if (count <= 1) return lines[0].slice(0, maxChars);
        const picked = [];
        let prevIdx = -1;
        for (let i = 0; i < count; i++) {
            const idx = Math.round((i * (lines.length - 1)) / (count - 1));
            if (idx !== prevIdx) {
                picked.push(lines[idx]);
                prevIdx = idx;
            }
        }
        return picked.join('\n');
    };

    const twoEnds = buildSample(2);
    if (twoEnds.length > maxChars) {
        return lines[0].slice(0, maxChars);
    }

    let lo = 2;
    let hi = lines.length;
    let best = twoEnds;

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const candidate = buildSample(mid);
        if (candidate.length <= maxChars) {
            best = candidate;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    return best;
}

function selectCompressedEntries(cues, { maxChars = 13000, indexed = false } = {}) {
    if (!Array.isArray(cues) || cues.length === 0 || maxChars <= 0) {
        return { text: '', lineSeconds: new Map() };
    }

    const deduped = [];
    for (const cue of cues) {
        const text = normalizeInlineText(cue?.primaryText || cue?.text || '');
        if (!text || WHISPER_NOISE_LINE_RE.test(text)) continue;

        const start = Math.max(0, Number(cue?.start) || 0);
        const rawEnd = Number(cue?.end);
        const end = Number.isFinite(rawEnd) && rawEnd >= start ? rawEnd : start;

        const last = deduped[deduped.length - 1];
        if (last && last.text === text) {
            last.end = Math.max(last.end, end);
            continue;
        }
        // 连续重复低信息求饶/喘息短句（45s 内同文本直接去重），防止挤占后续真正场景切换台词预算
        if (LOW_INFO_PLEA_RE.test(text) && text.length <= 16) {
            const recentSame = deduped.slice(-4).some((prev) => prev.text === text && (start - prev.start) <= 45);
            if (recentSame) continue;
        }
        deduped.push({ start, end, text });
    }

    if (deduped.length === 0) return { text: '', lineSeconds: new Map() };

    const merged = [];
    for (const item of deduped) {
        const prev = merged[merged.length - 1];
        if (prev) {
            const gap = item.start - prev.end;
            const combined = `${prev.text} ${item.text}`;
            if (gap <= 5 && combined.length <= 60) {
                prev.text = combined;
                prev.end = Math.max(prev.end, item.end);
                continue;
            }
        }
        merged.push({ ...item });
    }

    const lineSeconds = new Map();
    const lines = merged.map((item, idx) => {
        const sec = Math.round(item.start);
        lineSeconds.set(idx, sec);
        if (indexed) {
            return `[L${idx}|t=${sec}s|${formatMmSs(sec)}] ${item.text}`;
        }
        return `[${formatLegacyMmSs(sec)}] ${item.text}`;
    });

    const fullText = lines.join('\n');
    if (fullText.length <= maxChars) return { text: fullText, lineSeconds };
    if (lines.length <= 2) return { text: sampleLinesToBudget(lines, maxChars), lineSeconds };

    let highlightStarts = [];
    try {
        const plot = analyzeSubtitlePlot(cues);
        if (plot?.highlightCueIndices?.size) {
            for (const cueIdx of plot.highlightCueIndices) {
                const s = Number(cues[cueIdx]?.start);
                if (Number.isFinite(s)) highlightStarts.push(s);
            }
        }
        for (const anchor of plot?.anchors || []) {
            const s = Number(anchor?.start);
            if (Number.isFinite(s)) highlightStarts.push(s);
        }
    } catch (_) {}

    const isNearHighlight = (sec) => highlightStarts.some((hs) => Math.abs(hs - sec) <= 10);
    const totalSpan = Math.max(1, (merged[merged.length - 1]?.start || 0) - (merged[0]?.start || 0));
    const bucketCount = 10;

    const scored = merged.map((item, idx) => {
        const isMoan = MOAN_FILLER_RE.test(item.text) && item.text.length <= 10;
        const isLowPlea = LOW_INFO_PLEA_RE.test(item.text) && item.text.length <= 16;
        const greetingHits = (item.text.match(WHISPER_GREETING_TOKEN_RE) || []).length;
        let density = 1;
        if (isMoan) {
            density = 0.05;
        } else if (greetingHits >= 2) {
            density = 0.08;
        } else if (isLowPlea) {
            density = 0.12;
        } else {
            if (isNearHighlight(item.start)) density += 3;
            density += Math.min(item.text.length / 42, 1.8);
            const prevGap = idx > 0 ? (item.start - merged[idx - 1].end) : 0;
            // 超过 30 秒静默间隔后出现的首句对白极可能是新场景开场，显著提权
            if (prevGap >= 30 && item.text.length >= 6) {
                density += 2.6;
            }
        }
        const rel = (item.start - (merged[0]?.start || 0)) / totalSpan;
        const bucket = Math.min(bucketCount - 1, Math.max(0, Math.floor(rel * bucketCount)));
        return { idx, line: lines[idx], density, bucket };
    });

    const denseBudget = Math.floor(maxChars * 0.68);
    const selectedIdx = new Set();
    let denseChars = 0;

    const buckets = Array.from({ length: bucketCount }, (_, b) =>
        scored.filter((s) => s.bucket === b && s.density >= 1.15).sort((a, b2) => b2.density - a.density)
    );
    let round = 0;
    let progressed = true;
    while (progressed && denseChars < denseBudget) {
        progressed = false;
        const roundCandidates = [];
        for (let b = 0; b < bucketCount; b++) {
            const candidate = buckets[b][round];
            if (candidate) roundCandidates.push(candidate);
        }
        roundCandidates.sort((a, b) => b.density - a.density);
        for (const candidate of roundCandidates) {
            progressed = true;
            const addLen = candidate.line.length + (selectedIdx.size > 0 ? 1 : 0);
            if (denseChars + addLen > denseBudget) continue;
            selectedIdx.add(candidate.idx);
            denseChars += addLen;
        }
        round += 1;
    }

    const skeletonBudget = Math.max(0, maxChars - denseChars);
    if (skeletonBudget >= 80) {
        const skeletonText = sampleLinesToBudget(lines, skeletonBudget);
        const skeletonSet = new Set(skeletonText.split('\n'));
        scored.forEach((item) => {
            if (skeletonSet.has(item.line)) {
                selectedIdx.add(item.idx);
            }
        });
    }

    const orderedLines = Array.from(selectedIdx)
        .sort((a, b) => a - b)
        .map((idx) => lines[idx]);

    return {
        text: sampleLinesToBudget(orderedLines, maxChars),
        lineSeconds
    };
}

/**
 * 压缩字幕条目为紧凑时间轴文本：
 * 去重 Whisper 重复行 -> 合并短句 -> 超出预算时优先保留高密度对白与场景切换开场 + 全片均匀时间骨架
 * @param {Array<{ start: number, end?: number, text?: string, primaryText?: string }>} cues
 * @param {{ maxChars?: number }} [options]
 * @returns {string}
 */
export function compressCuesForLlm(cues, { maxChars = 13000 } = {}) {
    return selectCompressedEntries(cues, { maxChars, indexed: false }).text;
}

function buildSubtitleChapterPayload(avcode, compressed, metadata) {
    const metaText = formatMetadataForLlm(metadata);
    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const contentHash = buildVersionedTaskHash('sub_chapters', `${compressed}\n---\n${metaText}`);
    return { metaText, safeCode, contentHash };
}

const BAD_SUB_TRUST_REASONS = new Set([
    'corrupted_or_empty',
    'truncated',
    'whisper_polite_noise',
    'sanitized_mt',
    'high_repetition',
    'giant_gap_or_sparse'
]);

/**
 * 第一性原理上下文可信度与信息价值评估门禁：
 * 判断字幕是否可信、是否存在带时间戳评论或社区波峰，决定是否值得调用 LLM（宁缺毋滥）
 */
export function assessAiContextValue({ cues = [], subtitleQuality = null, comments = [], crowdPeaks = [], videoDuration = 0 } = {}) {
    const cueCount = Array.isArray(cues) ? cues.length : 0;
    const quality = subtitleQuality || (cueCount >= 40 ? scoreSubtitleQuality(cues, { videoDurationSec: videoDuration }) : null);
    const subSqi = quality ? (Number(quality.sqi) || 0) : (cueCount > 0 ? 85 : 0);
    const subReasons = Array.isArray(quality?.reasons) ? quality.reasons : [];
    const hasBadSubFlag = subReasons.some((r) => BAD_SUB_TRUST_REASONS.has(r));
    const isSubTrustworthy = cueCount > 0 && (!quality || (subSqi >= 75 && !hasBadSubFlag));

    const balanced = selectBalancedComments(comments, 45, videoDuration);
    const tsCommentCount = balanced.filter((c) => Array.isArray(c.resolvedTs) && c.resolvedTs.length > 0).length;
    const crowdPeakCount = Array.isArray(crowdPeaks) ? crowdPeaks.length : 0;

    return {
        cueCount,
        subSqi,
        subReasons,
        isSubTrustworthy,
        tsCommentCount,
        crowdPeakCount,
        commentsCount: balanced.length,
        worthSubChapters: isSubTrustworthy,
        worthHighlightGraph: isSubTrustworthy || tsCommentCount >= 1 || crowdPeakCount >= 1
    };
}

/**
 * 静默读取版本化后的字幕分幕缓存（不触发模型调用）
 */
export async function getCachedSubtitleChapters({ avcode, cues, subtitleQuality = null, metadata = null } = {}) {
    const ctxValue = assessAiContextValue({ cues, subtitleQuality });
    if (!ctxValue.worthSubChapters) return { hit: false };
    const { text: compressed } = selectCompressedEntries(cues, { maxChars: 13000, indexed: true });
    if (!compressed || !avcode) return { hit: false };
    const { contentHash } = buildSubtitleChapterPayload(avcode, compressed, metadata);
    const cached = await LlmCache.getCached(avcode, 'sub_chapters', contentHash);
    if (cached.hit && Array.isArray(cached.data?.chapters)) {
        return {
            hit: true,
            summary: String(cached.data.summary || ''),
            chapters: cached.data.chapters
        };
    }
    return { hit: false };
}

/**
 * 基于字幕时间轴进行影视剧作结构与情绪转折节点分析
 * @param {{ avcode: string, cues: Array, subtitleQuality?: Object|null, altCues?: Array|null, altTitle?: string, title?: string, metadata?: Object|null, forceRefresh?: boolean }} params
 * @returns {Promise<{ ok: boolean, skipped?: boolean, fromCache?: boolean, summary?: string, chapters?: Array, refused?: boolean, error?: string }>}
 */
export async function analyzeSubtitleChaptersWithLlm({ avcode, cues, subtitleQuality = null, altCues = null, altTitle = '', title = '', metadata = null, forceRefresh = false } = {}) {
    const startedAt = Date.now();
    const ctxValue = assessAiContextValue({ cues, subtitleQuality });
    if (!ctxValue.cueCount) {
        return { ok: false, skipped: true, refused: false, error: '无可用字幕内容' };
    }
    if (!ctxValue.worthSubChapters) {
        const skipMsg = `当前字幕可信度过低 (SQI ${ctxValue.subSqi})，已跳过 AI 分幕以避免幻觉`;
        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'sub_chapters',
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: 'skipped_low_signal',
            error: 'SUBTITLE_UNTRUSTWORTHY',
            inputContext: {
                cueCount: ctxValue.cueCount,
                subSqi: ctxValue.subSqi,
                subReasons: ctxValue.subReasons
            }
        });
        return { ok: false, skipped: true, refused: false, error: skipMsg };
    }
    const { text: compressed, lineSeconds } = selectCompressedEntries(cues, { maxChars: 13000, indexed: true });
    if (!compressed) {
        return { ok: false, skipped: true, refused: false, error: '无可用字幕内容' };
    }
    const altCompressed = Array.isArray(altCues) && altCues.length > 0
        ? selectCompressedEntries(altCues, { maxChars: 2200, indexed: false }).text
        : '';

    const { metaText, safeCode, contentHash } = buildSubtitleChapterPayload(avcode, compressed, metadata);
    const maxCueEnd = (Array.isArray(cues) ? cues : []).reduce((max, cue) => {
        const s = Number(cue?.start) || 0;
        const e = Number(cue?.end) || 0;
        return Math.max(max, s, e);
    }, 0);
    const inputContext = {
        hasMetadata: Boolean(metaText),
        metaText,
        cueCount: Array.isArray(cues) ? cues.length : 0,
        maxCueEndSec: Math.round(maxCueEnd),
        compressedSubLength: compressed.length,
        compressedSubPreview: compressed
    };

    if (!forceRefresh) {
        const cached = await LlmCache.getCached(avcode, 'sub_chapters', contentHash);
        if (cached.hit && cached.data) {
            const summary = String(cached.data.summary || '');
            const chapters = Array.isArray(cached.data.chapters) ? cached.data.chapters : [];
            AiDebugLogger.recordAiExecution(avcode, {
                taskType: 'sub_chapters',
                promptVersion: AI_PROMPT_VERSION,
                forceRefresh,
                durationMs: Date.now() - startedAt,
                outcome: 'success_cache',
                cache: { status: 'hit', source: cached.source || 'local', contentHash },
                inputContext,
                llmResponse: { parsedOutput: { summary, chapters } }
            });
            return {
                ok: true,
                fromCache: true,
                summary,
                chapters
            };
        }
    }

    const safeTitle = normalizeInlineText(title).slice(0, 120);

    const messages = [
        {
            role: 'system',
            content: [
                '严谨的剧情时间轴编辑。台词带 `[L行号|t=秒数s|时分秒]`。',
                '反幻觉硬约束(台词≠画面)：夸张比喻/欲求(如想要/要射了/全吞)按言语理解，禁脑补未实锤动作；遇敬语噪声或与副字幕矛盾则忽略。',
                '只基于真实对白输出严格 JSON（禁 Markdown 围栏）：',
                '{ "summary": "20字内剧情概览", "chapters": [{ "line": 12, "seconds": 123, "tag": "2-4字", "headline": "16字内剧情" }] }',
                '返回 3-8 个按时间升序的真实节点，准确填 `line` 与 `seconds`。'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                metaText || (safeTitle ? `作品标题: ${safeTitle}` : ''),
                maxCueEnd > 0 ? `台词最大时间: ${Math.round(maxCueEnd)} 秒 (${formatMmSs(maxCueEnd)})` : '',
                '台词时间轴:',
                compressed,
                altCompressed ? `副字幕交叉参考(${normalizeInlineText(altTitle).slice(0, 40) || '备选轨'}):\n${altCompressed}` : ''
            ].filter(Boolean).join('\n')
        }
    ];

    try {
        const res = await LlmService.chatCompletion({
            messages,
            temperature: 0.15,
            maxTokens: 1100
        });
        const parsed = LlmService.parseJsonFromLlm(res.content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            AiDebugLogger.recordAiExecution(avcode, {
                taskType: 'sub_chapters',
                model: res?.model,
                promptVersion: AI_PROMPT_VERSION,
                forceRefresh,
                durationMs: Date.now() - startedAt,
                outcome: 'error',
                error: 'INVALID_JSON_FORMAT',
                cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash },
                inputContext,
                llmResponse: { responseModel: res?.model || '', usage: res?.usage || null, rawContent: res?.content || '' }
            });
            return { ok: false, refused: false, error: '模型返回格式不符合分幕要求' };
        }

        const summary = normalizeInlineText(parsed.summary || '').slice(0, 40);
        const rawChapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
        const chaptersRaw = rawChapters
            .map((item) => {
                const lineNum = Number(item?.line ?? item?.cueLine ?? item?.idx);
                const resolvedFromLine = Number.isInteger(lineNum) && lineSeconds.has(lineNum)
                    ? lineSeconds.get(lineNum)
                    : null;
                const secRaw = resolvedFromLine !== null
                    ? resolvedFromLine
                    : Number(item?.seconds ?? item?.time ?? item?.start);
                if (!Number.isFinite(secRaw)) return null;
                const upperBound = maxCueEnd > 0 ? maxCueEnd : Math.max(0, secRaw);
                const seconds = Math.round(Math.max(0, Math.min(upperBound, secRaw)));
                const tag = normalizeInlineText(item?.tag || '').slice(0, 6) || '节点';
                const headline = normalizeInlineText(item?.headline || item?.title || item?.desc || '').slice(0, 28);
                if (!headline && !item?.tag) return null;
                return { seconds, tag, headline };
            })
            .filter(Boolean)
            .sort((a, b) => a.seconds - b.seconds);
        const dedupedChapters = [];
        for (const ch of chaptersRaw) {
            if (dedupedChapters.some((kept) => (ch.seconds - kept.seconds) < 60)) continue;
            dedupedChapters.push(ch);
            if (dedupedChapters.length >= 12) break;
        }
        const chapters = dedupedChapters;

        const data = { summary, chapters };
        await LlmCache.setCached(avcode, 'sub_chapters', contentHash, data);

        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'sub_chapters',
            model: res?.model,
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: 'success_llm',
            cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash },
            inputContext,
            llmResponse: {
                responseModel: res?.model || '',
                usage: res?.usage || null,
                rawContent: res?.content || '',
                parsedOutput: data,
                validationStats: { rawChaptersCount: rawChapters.length, validChaptersCount: chapters.length }
            }
        });

        return {
            ok: true,
            fromCache: false,
            summary,
            chapters
        };
    } catch (err) {
        const isRefused = Boolean(err?.refused || err?.message === 'LLM_REFUSED');
        const safeErr = isRefused ? '模型安全策略拒绝解析' : LlmService.redactSecrets(err?.message || '字幕分幕解析失败');
        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'sub_chapters',
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: isRefused ? 'refused' : 'error',
            error: safeErr,
            cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash },
            inputContext
        });
        if (isRefused) {
            return { ok: false, refused: true, error: safeErr };
        }
        return {
            ok: false,
            refused: false,
            error: safeErr
        };
    }
}

function extractResolvedSecondsForComment(commentObj, rawText, videoDuration = 0) {
    const dur = Math.max(0, Number(videoDuration) || 0);
    const out = [];
    const seen = new Set();
    const pushSec = (sec, isCountdown = false) => {
        const rounded = Math.round(Number(sec));
        if (!Number.isFinite(rounded) || rounded < 0) return;
        if (dur > 0 && rounded > dur) return;
        if (seen.has(rounded)) return;
        seen.add(rounded);
        out.push({ seconds: rounded, isCountdown });
    };

    const tsList = typeof commentObj === 'object' && Array.isArray(commentObj?.timestamps)
        ? commentObj.timestamps
        : [];
    const appliedCountdown = Boolean(typeof commentObj === 'object' && commentObj?.countdownApplied);

    const hmsReplacements = new Map();
    const hmsWordMatches = [];
    {
        const text = String(rawText || '');
        const cnDigitMap = { 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
        const hmsWordRe = /(?:([一二两兩三四五六七八九]|\d{1,2})\s*(?:[个個]\s*)?(?:h|小時|小时))(?:\s*(?:[零又]\s*)?(\d{1,2})\s*(?:m|分鐘|分钟|分))?(?:\s*(\d{1,2})\s*(?:s|秒)?)?|(?:(\d{1,3})\s*(?:m|分鐘|分钟|分)\s*(\d{1,2})\s*(?:s|秒)?)/gi;
        let hm;
        while ((hm = hmsWordRe.exec(text)) !== null) {
            if (hm[1] !== undefined) {
                const hours = cnDigitMap[hm[1]] !== undefined ? cnDigitMap[hm[1]] : Number(hm[1]);
                const mins = Number(hm[2]) || 0;
                const secs = Number(hm[3]) || 0;
                const total = hours * 3600 + mins * 60 + secs;
                hmsWordMatches.push(total);
                if (hours > 0 && mins > 0) {
                    const partial = mins * 60 + secs;
                    if (!dur || total <= dur) hmsReplacements.set(partial, total);
                }
            } else if (hm[4] !== undefined) {
                hmsWordMatches.push(Number(hm[4]) * 60 + (Number(hm[5]) || 0));
            }
        }
    }

    if (tsList.length > 0) {
        for (const t of tsList) {
            const rawStr = String(t?.raw || '');
            const isExplicitNeg = /^\s*-\s*\d/.test(rawStr);
            const rawSec = Array.isArray(t?.rawSeconds) ? t.rawSeconds[0] : (t?.rawSeconds ?? (Array.isArray(t?.seconds) ? t.seconds[0] : t?.seconds));
            const curSec = Array.isArray(t?.seconds) ? t.seconds[0] : t?.seconds;

            if (appliedCountdown && Number.isFinite(Number(curSec))) {
                pushSec(curSec, true);
            } else if (isExplicitNeg && dur > 0 && Number.isFinite(Number(rawSec)) && rawSec > 0 && rawSec < dur) {
                pushSec(dur - rawSec, true);
            } else if (Number.isFinite(Number(curSec))) {
                const roundedCur = Math.round(Number(curSec));
                const upgraded = !t?.isCountdown && hmsReplacements.has(roundedCur) ? hmsReplacements.get(roundedCur) : curSec;
                pushSec(upgraded, Boolean(t?.isCountdown));
            }
        }
    } else {
        // 兜底解析文本中的时间戳格式 (-H:MM:SS, H:MM:SS, MM:SS, 2h18m, 28m30, 015215)
        const text = String(rawText || '');
        const colonRe = /(^|[^\d])(-\s*)?(?:(\d{1,2})[:.])?(\d{1,2})[:.](\d{2})(?!\d)/g;
        let m;
        while ((m = colonRe.exec(text)) !== null) {
            const neg = Boolean(m[2]);
            const a = Number(m[3]);
            const b = Number(m[4]);
            const c = Number(m[5]);
            if (b >= 60 && m[3] === undefined && a !== undefined) continue;
            if (c >= 60) continue;
            const total = m[3] !== undefined ? (a * 3600 + b * 60 + c) : (b * 60 + c);
            if (neg && dur > 0 && total < dur) {
                pushSec(dur - total, true);
            } else {
                pushSec(total, false);
            }
        }
        for (const hmsSec of hmsWordMatches) {
            pushSec(hmsSec, false);
        }
        const compactSixRe = /(?:^|[^\d])([0-4]\d)([0-5]\d)([0-5]\d)(?:$|[^\d])/g;
        while ((m = compactSixRe.exec(text)) !== null) {
            const total = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
            if (total > 0 && (!dur || total <= dur)) {
                pushSec(total, false);
            }
        }
    }

    return out;
}

/**
 * 双池配额选取高信息量评论（带时间戳评论 <=30 条 + 无时间戳长评 >=12字 <=20 条），并预注入精确整数秒标注
 * @param {Array} comments
 * @param {number} [maxItems=55]
 * @param {number} [videoDuration=0]
 * @returns {Array<{ id: string, text: string, hasTs: boolean, resolvedTs: Array }>}
 */
function selectBalancedComments(comments = [], maxItems = 55, videoDuration = 0) {
    if (!Array.isArray(comments) || comments.length === 0) return [];
    const seen = new Set();
    const tsPool = [];
    const longPool = [];

    for (const c of comments) {
        if (!c) continue;
        if (typeof c === 'object' && c.spam?.label === 'SPAM') continue;
        const text = normalizeInlineText(typeof c === 'string' ? c : (c.rawText || c.text || c.content || ''));
        if (text.length < 3) continue;
        const dedupKey = text.toLowerCase().slice(0, 120);
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const resolvedTs = extractResolvedSecondsForComment(c, text, videoDuration);
        const hasTs = resolvedTs.length > 0 || Boolean(
            typeof c === 'object' && (
                c.hasTimestamps ||
                (Array.isArray(c.timestamps) && c.timestamps.length > 0) ||
                /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(text)
            )
        );
        const likesBonus = Number(c?.likes) > 0 ? 30 : 0;
        const entry = {
            id: typeof c === 'object' && c.id !== undefined && c.id !== null ? String(c.id) : '',
            text,
            hasTs,
            resolvedTs,
            rankScore: Math.min(text.length, 200) + likesBonus + (resolvedTs.length > 0 ? 15 : 0)
        };
        if (hasTs) {
            tsPool.push(entry);
        } else if (text.length >= 12) {
            longPool.push(entry);
        } else {
            longPool.push({ ...entry, rankScore: entry.rankScore - 20 });
        }
    }

    tsPool.sort((a, b) => b.rankScore - a.rankScore);
    longPool.sort((a, b) => b.rankScore - a.rankScore);

    const tsCap = Math.min(30, maxItems);
    const pickedTs = tsPool.slice(0, tsCap);
    const remainingCap = Math.max(0, maxItems - pickedTs.length);
    const longCap = Math.max(remainingCap, Math.min(20, maxItems));
    const pickedLong = longPool.slice(0, longCap);

    return [...pickedTs, ...pickedLong].slice(0, maxItems);
}

function formatCommentTsPrefix(entry, idxLabel = '') {
    const tsTags = (entry.resolvedTs || [])
        .slice(0, 4)
        .map((t) => `t=${t.seconds}s(${formatMmSs(t.seconds)}${t.isCountdown ? ',倒数已转正' : ''})`);
    const idxPart = idxLabel ? `[${idxLabel}] ` : '';
    if (tsTags.length > 0) {
        return `${idxPart}[含时间点] [${tsTags.join(', ')}] `;
    }
    if (entry.hasTs) {
        return `${idxPart}[含时间点] `;
    }
    return idxPart;
}

/**
 * 构建评论去重采样文本及版本化缓存哈希
 * @param {Array} comments
 * @param {Object|null} [metadata]
 * @param {number} [videoDuration=0]
 * @returns {{ digest: string, metaText: string, contentHash: string } | null}
 */
function buildCommentsDigest(comments = [], metadata = null, videoDuration = 0) {
    const selected = selectBalancedComments(comments, 55, videoDuration);
    if (selected.length === 0) return null;

    const selectedLines = [];
    let totalChars = 0;
    const MAX_CHARS = 5800;

    for (const item of selected) {
        const prefix = formatCommentTsPrefix(item, '');
        const line = `${prefix}${item.text.slice(0, 220)}`;
        const addedLen = line.length + (selectedLines.length > 0 ? 1 : 0);
        if (totalChars + addedLen > MAX_CHARS) {
            if (selectedLines.length === 0) {
                selectedLines.push(line.slice(0, MAX_CHARS));
            }
            break;
        }
        selectedLines.push(line);
        totalChars += addedLen;
    }

    const digest = selectedLines.join('\n');
    const metaText = formatMetadataForLlm(metadata);
    return {
        digest,
        metaText,
        contentHash: buildVersionedTaskHash('comment_brief', `${digest}\n---\n${metaText}`)
    };
}

/**
 * 静默读取已缓存的评论简报（不触发模型调用）
 * @param {{ avcode: string, comments: Array, videoDuration?: number, metadata?: Object|null }} params
 * @returns {Promise<{ hit: boolean, brief?: Object }>}
 */
export async function getCachedCommentBrief({ avcode, comments, videoDuration = 0, metadata = null } = {}) {
    const code = normalizeInlineText(avcode).toUpperCase();
    const built = buildCommentsDigest(comments, metadata, videoDuration);
    if (!code || !built?.contentHash) return { hit: false };
    const cached = await LlmCache.getCached(code, 'comment_brief', built.contentHash);
    if (cached.hit && cached.data) {
        return { hit: true, brief: cached.data };
    }
    return { hit: false };
}

/**
 * 提炼跨站评论口碑简报与高能时刻时间戳
 * @param {{ avcode: string, comments: Array, videoDuration?: number, metadata?: Object|null, forceRefresh?: boolean }} params
 * @returns {Promise<{ ok: boolean, fromCache?: boolean, brief?: Object, refused?: boolean, error?: string }>}
 */
export async function summarizeCommentsWithLlm({ avcode, comments, videoDuration = 0, metadata = null, forceRefresh = false } = {}) {
    const startedAt = Date.now();
    const built = buildCommentsDigest(comments, metadata, videoDuration);
    if (!built) {
        return { ok: false, refused: false, error: '暂无可用于提炼的评论内容' };
    }

    const { digest, metaText, contentHash } = built;
    const durationNum = Math.max(0, Number(videoDuration) || 0);
    const inputContext = {
        hasMetadata: Boolean(metaText),
        metaText,
        commentsTotal: Array.isArray(comments) ? comments.length : 0,
        commentsDigestLength: digest.length,
        commentsDigestPreview: digest,
        videoDurationSec: Math.round(durationNum)
    };

    if (!forceRefresh) {
        const cached = await LlmCache.getCached(avcode, 'comment_brief', contentHash);
        if (cached.hit && cached.data) {
            AiDebugLogger.recordAiExecution(avcode, {
                taskType: 'comment_brief',
                promptVersion: AI_PROMPT_VERSION,
                forceRefresh,
                durationMs: Date.now() - startedAt,
                outcome: 'success_cache',
                cache: { status: 'hit', source: cached.source || 'local', contentHash },
                inputContext,
                llmResponse: { parsedOutput: cached.data }
            });
            return {
                ok: true,
                fromCache: true,
                brief: cached.data
            };
        }
    }

    const safeCode = normalizeInlineText(avcode).toUpperCase();

    const messages = [
        {
            role: 'system',
            content: [
                '你是一位客观严谨的影评整理助手，负责结合作品元数据与观众短评提炼核心看点、避坑提醒、口碑共识与高能时间戳。',
                '评论中 `[含时间点] [t=XXXs(...)]` 已由本地解析器精确换算为视频整数秒（倒数时间亦已校准），输出 `timestamps` 时请直接采用该 `t` 值；严禁自行心算时间格式或编造未提及的时间点。',
                '仅返回严格合法的 JSON，不要输出额外解释或 Markdown 围栏：',
                '{ "highlights": "看点1句话", "warnings": "避坑/雷点1句话(无则写暂无明显雷点)", "consensus": "口碑共识1句话", "timestamps": [{ "seconds": 123, "note": "10字内说明" }] }'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                metaText,
                durationNum > 0 ? `影片时长: ${Math.round(durationNum)} 秒 (${formatMmSs(durationNum)})` : '',
                '观众评论样本:',
                digest
            ].filter(Boolean).join('\n')
        }
    ];

    try {
        const res = await LlmService.chatCompletion({
            messages,
            temperature: 0.2,
            maxTokens: 1100
        });
        const parsed = LlmService.parseJsonFromLlm(res.content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            AiDebugLogger.recordAiExecution(avcode, {
                taskType: 'comment_brief',
                model: res?.model,
                promptVersion: AI_PROMPT_VERSION,
                forceRefresh,
                durationMs: Date.now() - startedAt,
                outcome: 'error',
                error: 'INVALID_JSON_FORMAT',
                cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash },
                inputContext,
                llmResponse: { responseModel: res?.model || '', usage: res?.usage || null, rawContent: res?.content || '' }
            });
            return { ok: false, refused: false, error: '模型返回格式不符合简报要求' };
        }

        const rawTs = Array.isArray(parsed.timestamps) ? parsed.timestamps : [];
        const timestamps = rawTs
            .map((ts) => {
                const secRaw = Number(ts?.seconds ?? ts?.time);
                if (!Number.isFinite(secRaw) || secRaw < 0) return null;
                const seconds = durationNum > 0
                    ? Math.round(Math.min(durationNum, secRaw))
                    : Math.round(secRaw);
                const note = normalizeInlineText(ts?.note || ts?.label || ts?.desc || '').slice(0, 16);
                if (!note) return null;
                return { seconds, note };
            })
            .filter(Boolean)
            .sort((a, b) => a.seconds - b.seconds)
            .slice(0, 10);

        const brief = {
            highlights: normalizeInlineText(parsed.highlights || '') || '暂无明显看点',
            warnings: normalizeInlineText(parsed.warnings || '') || '暂无明显雷点',
            consensus: normalizeInlineText(parsed.consensus || '') || '暂无明显口碑共识',
            timestamps
        };

        await LlmCache.setCached(avcode, 'comment_brief', contentHash, brief);

        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'comment_brief',
            model: res?.model,
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: 'success_llm',
            cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash },
            inputContext,
            llmResponse: {
                responseModel: res?.model || '',
                usage: res?.usage || null,
                rawContent: res?.content || '',
                parsedOutput: brief,
                validationStats: { rawTimestampsCount: rawTs.length, validTimestampsCount: timestamps.length }
            }
        });

        return {
            ok: true,
            fromCache: false,
            brief
        };
    } catch (err) {
        const isRefused = Boolean(err?.refused || err?.message === 'LLM_REFUSED');
        const safeErr = isRefused ? '模型安全策略拒绝解析' : LlmService.redactSecrets(err?.message || '评论简报生成失败');
        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'comment_brief',
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: isRefused ? 'refused' : 'error',
            error: safeErr,
            cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash },
            inputContext
        });
        if (isRefused) {
            return { ok: false, refused: true, error: safeErr };
        }
        return {
            ok: false,
            refused: false,
            error: safeErr
        };
    }
}

/**
 * 基于高光起点前后时间窗字幕与元数据，从固定语义标签矩阵中自动推荐标签与短评
 * @param {{ avcode: string, startTime: number, cues: Array, title?: string, metadata?: Object|null }} params
 * @returns {Promise<{ ok: boolean, tags: string[], comment: string, refused?: boolean, error?: string }>}
 */
export async function autoTagMarkerWithLlm({ avcode, startTime, cues, title = '', metadata = null } = {}) {
    const startedAt = Date.now();
    const targetStart = Math.max(0, Number(startTime) || 0);
    const winStart = Math.max(0, targetStart - 60);
    const winEnd = targetStart + 30;

    const windowCues = (Array.isArray(cues) ? cues : []).filter((cue) => {
        const s = Number(cue?.start);
        const e = Number.isFinite(Number(cue?.end)) ? Number(cue.end) : s;
        if (!Number.isFinite(s)) return false;
        return e >= winStart && s <= winEnd;
    });

    const windowText = compressCuesForLlm(windowCues, { maxChars: 2400 });
    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const safeTitle = normalizeInlineText(title).slice(0, 100);
    const metaText = formatMetadataForLlm(metadata);
    const inputContext = {
        hasMetadata: Boolean(metaText),
        metaText,
        startTime: targetStart,
        winStart,
        winEnd,
        windowCueCount: windowCues.length,
        windowText: windowText || ''
    };

    const messages = [
        {
            role: 'system',
            content: [
                '你是影片片段标签标注助手。请根据作品元数据及给定时间点前后的字幕语境，从下方允许标签列表中选择最贴切的 1 到 2 个标签，并附带一句 14 字以内短评。',
                `允许标签列表（必须原样选用，禁止自造标签）：${ALL_SEMANTIC_TAGS.join(' ')}`,
                '仅返回严格合法的 JSON：{ "tags": ["#标签1"], "comment": "14字内短评" }'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                metaText || (safeTitle ? `作品标题: ${safeTitle}` : ''),
                `目标时间点: ${formatMmSs(targetStart)} (${Math.round(targetStart)}s)`,
                `局部字幕语境 [${formatMmSs(winStart)} - ${formatMmSs(winEnd)}]:`,
                windowText || '(该时间窗暂无字幕对话)'
            ].filter(Boolean).join('\n')
        }
    ];

    try {
        const res = await LlmService.chatCompletion({
            messages,
            temperature: 0.2,
            maxTokens: 250
        });
        const parsed = LlmService.parseJsonFromLlm(res.content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            AiDebugLogger.recordAiExecution(avcode, {
                taskType: 'auto_tag',
                model: res?.model,
                promptVersion: AI_PROMPT_VERSION,
                durationMs: Date.now() - startedAt,
                outcome: 'error',
                error: 'INVALID_JSON_FORMAT',
                inputContext,
                llmResponse: { responseModel: res?.model || '', usage: res?.usage || null, rawContent: res?.content || '' }
            });
            return { ok: false, refused: false, error: '模型返回格式不符合打标要求', tags: [], comment: '' };
        }

        const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
        const validTags = [];
        for (const rawTag of rawTags) {
            const clean = normalizeInlineText(rawTag);
            if (!clean) continue;
            const normalizedTag = clean.startsWith('#') ? clean : `#${clean}`;
            if (ALLOWED_TAG_SET.has(normalizedTag) && !validTags.includes(normalizedTag)) {
                validTags.push(normalizedTag);
                if (validTags.length >= 2) break;
            }
        }

        const comment = normalizeInlineText(parsed.comment || '').slice(0, 20);
        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'auto_tag',
            model: res?.model,
            promptVersion: AI_PROMPT_VERSION,
            durationMs: Date.now() - startedAt,
            outcome: 'success_llm',
            inputContext,
            llmResponse: {
                responseModel: res?.model || '',
                usage: res?.usage || null,
                rawContent: res?.content || '',
                parsedOutput: { tags: validTags, comment },
                validationStats: { rawTagsCount: rawTags.length, acceptedTagsCount: validTags.length }
            }
        });

        return {
            ok: true,
            tags: validTags,
            comment
        };
    } catch (err) {
        const isRefused = Boolean(err?.refused || err?.message === 'LLM_REFUSED');
        const safeErr = isRefused ? '模型安全策略拒绝解析' : LlmService.redactSecrets(err?.message || '自动打标失败');
        AiDebugLogger.recordAiExecution(avcode, {
            taskType: 'auto_tag',
            promptVersion: AI_PROMPT_VERSION,
            durationMs: Date.now() - startedAt,
            outcome: isRefused ? 'refused' : 'error',
            error: safeErr,
            inputContext
        });
        if (isRefused) {
            return { ok: false, refused: true, error: safeErr, tags: [], comment: '' };
        }
        return {
            ok: false,
            refused: false,
            error: safeErr,
            tags: [],
            comment: ''
        };
    }
}

/**
 * 将 AI 返回的语义标签与短评无损合并进现有高光备注中
 * @param {string} existingComment
 * @param {string[]} [tags]
 * @param {string} [aiComment]
 * @returns {string}
 */
export function mergeAutoTagsIntoComment(existingComment = '', tags = [], aiComment = '') {
    const base = String(existingComment || '').trim();
    const parts = base ? [base] : [];
    const existingSet = new Set(base.split(/\s+/).filter(Boolean));

    for (const tag of Array.isArray(tags) ? tags : []) {
        const cleanTag = normalizeInlineText(tag);
        if (cleanTag && !existingSet.has(cleanTag)) {
            existingSet.add(cleanTag);
            parts.push(cleanTag);
        }
    }

    const cleanComment = normalizeInlineText(aiComment);
    if (cleanComment && !base.includes(cleanComment)) {
        parts.push(cleanComment);
    }

    return parts.join(' ').trim();
}

/**
 * 从 120 槽位社区全网热度数据中提取波峰时间戳（局部极大值 + 25s 邻峰合并）
 * @param {Uint8Array|number[]} crowd120
 * @param {number} durationSec
 * @param {number} [topK]
 * @returns {Array<{ seconds: number, intensity: number }>}
 */
export function extractCrowdPeaks(crowd120, durationSec, topK = 6) {
    const len = crowd120?.length || 0;
    const dur = Number(durationSec) || 0;
    if (!len || dur <= 10) return [];

    let sum = 0;
    let maxVal = 0;
    for (let i = 0; i < len; i++) {
        const v = Number(crowd120[i]) || 0;
        sum += v;
        if (v > maxVal) maxVal = v;
    }
    if (maxVal <= 0) return [];

    const mean = sum / len;
    let varSum = 0;
    for (let i = 0; i < len; i++) {
        const d = (Number(crowd120[i]) || 0) - mean;
        varSum += d * d;
    }
    const std = Math.sqrt(varSum / len);
    const threshold = Math.max(mean + 0.35 * std, maxVal * 0.25);

    const rawPeaks = [];
    for (let i = 0; i < len; i++) {
        const cur = Number(crowd120[i]) || 0;
        if (cur < threshold) continue;
        const left = i > 0 ? (Number(crowd120[i - 1]) || 0) : 0;
        const right = i + 1 < len ? (Number(crowd120[i + 1]) || 0) : 0;
        if (cur >= left && cur >= right) {
            const seconds = Math.max(1, Math.min(Math.floor(dur - 1), Math.round(((i + 0.5) / len) * dur)));
            rawPeaks.push({ seconds, intensity: Number((cur / maxVal).toFixed(2)) });
        }
    }

    rawPeaks.sort((a, b) => b.intensity - a.intensity);
    const merged = [];
    for (const peak of rawPeaks) {
        if (merged.some((m) => Math.abs(m.seconds - peak.seconds) < 25)) continue;
        merged.push(peak);
        if (merged.length >= topK) break;
    }
    return merged.sort((a, b) => a.seconds - b.seconds);
}

const COUNTDOWN_TEXT_RE = /倒数|倒計時|倒计时|还剩|還剩|还有\s*\d+|countdown|remaining/i;

/**
 * 启发式识别“剩余时间倒数型”评论 ID（单条多点严格递减或含显式倒数语义）
 * @param {Array} comments
 * @param {number} [videoDuration]
 * @returns {Set<string>}
 */
export function detectCountdownComments(comments = [], videoDuration = 0) {
    const hits = new Set();
    const dur = Number(videoDuration) || 0;
    for (const c of Array.isArray(comments) ? comments : []) {
        if (!c || c.countdownApplied || !Array.isArray(c.timestamps) || c.timestamps.length === 0) continue;
        const raw = String(c.rawText || c.text || '');
        const hasKeyword = COUNTDOWN_TEXT_RE.test(raw);
        const points = c.timestamps
            .map((t) => Number(Array.isArray(t.rawSeconds ?? t.seconds) ? (t.rawSeconds ?? t.seconds)[0] : (t.rawSeconds ?? t.seconds)))
            .filter((n) => Number.isFinite(n) && n >= 0 && (!dur || n <= dur));

        let isStrictDescending = false;
        if (points.length >= 2) {
            isStrictDescending = points.every((val, idx) => idx === 0 || (points[idx - 1] - val) >= 15);
        }
        if (hasKeyword || isStrictDescending) {
            if (c.id !== undefined && c.id !== null) hits.add(String(c.id));
        }
    }
    return hits;
}

function buildFusionInputs({ cues = [], comments = [], crowdPeaks = [], videoDuration = 0, vibeTags = [], metadata = null }) {
    const indexedSub = Array.isArray(cues) && cues.length > 0
        ? selectCompressedEntries(cues, { maxChars: 7500, indexed: true })
        : { text: '', lineSeconds: new Map() };
    const compressedSub = indexedSub.text;

    const topComments = selectBalancedComments(comments, 45, videoDuration);
    const commentLines = topComments.map((item, idx) => `${formatCommentTsPrefix(item, `C${idx}`)}${item.text.slice(0, 180)}`);

    const crowdSig = (Array.isArray(crowdPeaks) ? crowdPeaks : [])
        .map((p) => `${Math.round(Number(p.seconds) || 0)}:${p.intensity ?? ''}`)
        .join(',');
    const vibeKey = (Array.isArray(vibeTags) ? vibeTags : []).join(',');
    const metaText = formatMetadataForLlm(metadata);
    const contentHash = buildVersionedTaskHash(
        'highlight_graph',
        `${compressedSub}\n---\n${commentLines.join('\n')}\n---\n${crowdSig}\n---\n${vibeKey}\n---\n${metaText}`
    );

    return {
        compressedSub,
        lineSeconds: indexedSub.lineSeconds,
        topComments,
        commentLines,
        crowdSig,
        vibeKey,
        metaText,
        contentHash
    };
}

/**
 * 静默读取缓存的高能融合图谱（0 请求消耗）
 * @param {Object} params
 * @returns {Promise<{ hit: boolean, graph?: Object }>}
 */
export async function getCachedHighlightGraph({ avcode, cues = [], subtitleQuality = null, comments = [], crowdPeaks = [], videoDuration = 0, vibeTags = [], metadata = null } = {}) {
    const code = normalizeInlineText(avcode).toUpperCase();
    const ctxValue = assessAiContextValue({ cues, subtitleQuality, comments, crowdPeaks, videoDuration });
    if (!code || !ctxValue.worthHighlightGraph) {
        return { hit: false };
    }
    const effectiveCues = ctxValue.isSubTrustworthy ? cues : [];
    const { topComments, compressedSub, crowdSig, contentHash } = buildFusionInputs({ cues: effectiveCues, comments, crowdPeaks, videoDuration, vibeTags, metadata });
    if (!compressedSub && topComments.length === 0 && !crowdSig) {
        return { hit: false };
    }
    const cached = await LlmCache.getCached(code, 'highlight_graph', contentHash);
    if (cached.hit && cached.data) {
        return { hit: true, graph: cached.data };
    }
    return { hit: false };
}

/**
 * 单请求多模态联合融合引擎（高能现场 2.0）
 * 一次性融合：影片元数据 + 社区回放波峰 + 高密度字幕骨架 + 双池平衡评论文本(预解析秒数) + 用户偏好标签
 * @param {Object} params
 * @returns {Promise<{ ok: boolean, skipped?: boolean, fromCache?: boolean, graph?: Object, refused?: boolean, error?: string }>}
 */
export async function buildHighlightGraphWithLlm({
    avcode,
    cues = [],
    subtitleQuality = null,
    altCues = null,
    altTitle = '',
    comments = [],
    crowdPeaks = [],
    videoDuration = 0,
    vibeTags = [],
    metadata = null,
    forceRefresh = false
} = {}) {
    const startedAt = Date.now();
    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const dur = Math.max(0, Number(videoDuration) || 0);
    const ctxValue = assessAiContextValue({ cues, subtitleQuality, comments, crowdPeaks, videoDuration: dur });

    if (!ctxValue.worthHighlightGraph) {
        const skipReason = ctxValue.cueCount > 0 && !ctxValue.isSubTrustworthy
            ? `字幕噪声过高 (SQI ${ctxValue.subSqi}) 且暂无时间点评论或热度波峰，已跳过 AI 定位以避免幻觉`
            : '暂无高可信字幕、带时间点评论或热度波峰，已跳过 AI 定位';
        AiDebugLogger.recordAiExecution(safeCode, {
            taskType: 'highlight_graph',
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: 'skipped_low_signal',
            error: 'LOW_SIGNAL_NO_ANCHOR',
            inputContext: {
                cueCount: ctxValue.cueCount,
                subSqi: ctxValue.subSqi,
                subReasons: ctxValue.subReasons,
                commentsTotal: ctxValue.commentsCount,
                tsCommentCount: ctxValue.tsCommentCount,
                crowdPeaksCount: ctxValue.crowdPeakCount
            }
        });
        return { ok: false, skipped: true, refused: false, error: skipReason };
    }

    const effectiveCues = ctxValue.isSubTrustworthy ? cues : [];
    const effectiveAltCues = ctxValue.isSubTrustworthy ? altCues : null;
    const built = buildFusionInputs({ cues: effectiveCues, comments, crowdPeaks, videoDuration: dur, vibeTags, metadata });
    const altCompressed = Array.isArray(effectiveAltCues) && effectiveAltCues.length > 0
        ? selectCompressedEntries(effectiveAltCues, { maxChars: 2000, indexed: false }).text
        : '';
    if (!built.compressedSub && built.topComments.length === 0 && !built.crowdSig) {
        return { ok: false, skipped: true, refused: false, error: '暂无可用于联合分析的评论、字幕或热度数据' };
    }
    const inputContext = {
        hasMetadata: Boolean(built.metaText),
        metaText: built.metaText,
        cueCount: Array.isArray(effectiveCues) ? effectiveCues.length : 0,
        compressedSubLength: built.compressedSub.length,
        compressedSubPreview: built.compressedSub,
        commentsTotal: Array.isArray(comments) ? comments.length : 0,
        sampledCommentsCount: built.topComments.length,
        commentsDigestLength: built.commentLines.join('\n').length,
        commentsDigestPreview: built.commentLines.join('\n'),
        crowdPeaksCount: Array.isArray(crowdPeaks) ? crowdPeaks.length : 0,
        crowdPeaks: Array.isArray(crowdPeaks) ? crowdPeaks : [],
        vibeTags: Array.isArray(vibeTags) ? vibeTags : [],
        videoDurationSec: Math.round(dur)
    };

    if (!forceRefresh && safeCode) {
        const cached = await LlmCache.getCached(safeCode, 'highlight_graph', built.contentHash);
        if (cached.hit && cached.data) {
            AiDebugLogger.recordAiExecution(safeCode, {
                taskType: 'highlight_graph',
                promptVersion: AI_PROMPT_VERSION,
                forceRefresh,
                durationMs: Date.now() - startedAt,
                outcome: 'success_cache',
                cache: { status: 'hit', source: cached.source || 'local', contentHash: built.contentHash },
                inputContext,
                llmResponse: { parsedOutput: cached.data }
            });
            return { ok: true, fromCache: true, graph: cached.data };
        }
    }

    const crowdPromptText = (Array.isArray(crowdPeaks) && crowdPeaks.length > 0)
        ? crowdPeaks.map((p) => `t=${Math.round(Number(p.seconds) || 0)}s(${formatMmSs(p.seconds)},强度${Math.round((Number(p.intensity) || 0) * 100)}%)`).join(', ')
        : '(暂无社区热度数据)';
    const vibePromptText = (Array.isArray(vibeTags) && vibeTags.length > 0)
        ? `用户偏好要素（排序可适当靠前）: ${vibeTags.join('、')}`
        : '';

    const hasSub = Boolean(built.compressedSub);
    const hasCrowd = Array.isArray(crowdPeaks) && crowdPeaks.length > 0;
    const commentTsSet = new Set();
    for (const c of built.topComments) {
        for (const t of c.resolvedTs || []) {
            if (Number.isFinite(t?.seconds)) commentTsSet.add(t.seconds);
        }
    }
    const commentTsList = Array.from(commentTsSet);

    const groundingRule = !hasSub && !hasCrowd
        ? '无字幕无波峰：highlights 禁引用 sub 或编造，仅取评论 `[t=...s]`（无则 []）；skipZones 禁臆测；commentTags.inferredSeconds 填 null！'
        : (!hasSub
            ? '无字幕：禁填 sub 或 subLine，仅结合评论 `[t=...s]` 与波峰定位！'
            : '时间点直接复用字幕/波峰/评论 `t=...s`，禁心算编造！');

    const messages = [
        {
            role: 'system',
            content: [
                '你是严谨的 AV 场景定位分析引擎，只做准确定位高能与转折（宁缺毋滥，严禁猜测）。',
                groundingRule,
                '反幻觉硬约束(台词≠画面)：1) 结合片名/标签定基调——纯口交无插入前情禁脑补内射，孤立词禁脑补肛交/双穴；2) 挑逗/夸张/否定词禁当已发生；3) 禁把许愿抱怨嫁接无关时刻；4) 仅输出实锤高光(0-5条，不确定写 low 或留空 [])。',
                '输出顺序：',
                '1. brief: 1句话看点/避坑/共识；',
                '2. highlights: 0-5条实锤高能（禁片尾独白，tag用2-4字勿带/）；',
                '3. skipZones: 最多3个拖沓区间（勿重highlights，禁写字幕/行号/推测，无则[]）；',
                '4. commentTags: 最多8条归类；无依据时 inferredSeconds 填 null；',
                '仅输出合法 JSON：',
                hasSub
                    ? '{ "brief": { "highlights": "看点", "warnings": "避坑", "consensus": "共识" }, "highlights": [{ "seconds": 120, "endSeconds": 180, "subLine": 12, "confidence": "high", "tag": "标签", "reason": "依据", "sources": ["crowd","comment","sub"], "score": 92 }], "skipZones": [{ "seconds": 0, "endSeconds": 90, "reason": "避坑" }], "commentTags": [{ "idx": 0, "sentiment": "hype", "inferredSeconds": 420, "note": "标签" }] }'
                    : '{ "brief": { "highlights": "看点", "warnings": "避坑", "consensus": "共识" }, "highlights": [{ "seconds": 120, "endSeconds": 180, "confidence": "high", "tag": "标签", "reason": "依据", "sources": ["comment"], "score": 92 }], "skipZones": [], "commentTags": [{ "idx": 0, "sentiment": "hype", "inferredSeconds": null, "note": "标签" }] }'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                built.metaText,
                dur > 0 ? `总时长: ${Math.round(dur)}秒 (${formatMmSs(dur)})` : '',
                vibePromptText,
                `社区回放波峰: ${crowdPromptText}`,
                built.compressedSub ? `字幕对白:\n${built.compressedSub}` : '字幕对白: (暂无字幕)',
                altCompressed ? `副字幕交叉参考(${normalizeInlineText(altTitle).slice(0, 40) || '备选轨'}):\n${altCompressed}` : '',
                built.commentLines.length > 0 ? `观众评论:\n${built.commentLines.join('\n')}` : '观众评论: (暂无评论)'
            ].filter(Boolean).join('\n\n')
        }
    ];

    try {
        const res = await LlmService.chatCompletion({
            messages,
            temperature: 0.15,
            maxTokens: 2400
        });
        const parsed = LlmService.parseJsonFromLlm(res.content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            AiDebugLogger.recordAiExecution(safeCode, {
                taskType: 'highlight_graph',
                model: res?.model,
                promptVersion: AI_PROMPT_VERSION,
                forceRefresh,
                durationMs: Date.now() - startedAt,
                outcome: 'error',
                error: 'INVALID_JSON_FORMAT',
                cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash: built.contentHash },
                inputContext,
                llmResponse: { responseModel: res?.model || '', usage: res?.usage || null, rawContent: res?.content || '' }
            });
            return { ok: false, refused: false, error: '模型返回的高能图谱格式异常' };
        }

        const clampSec = (val) => {
            if (val === null || val === undefined || val === '') return null;
            const n = Math.round(Number(val));
            if (!Number.isFinite(n) || n < 0) return null;
            return dur > 0 ? Math.min(Math.floor(dur), n) : n;
        };

        const rawHighlights = [];
        for (const item of Array.isArray(parsed.highlights) ? parsed.highlights : []) {
            const conf = String(item?.confidence || '').trim().toLowerCase();
            if (conf === 'low') continue;
            const rawSources = Array.isArray(item?.sources)
                ? item.sources.map((s) => String(s || '').trim()).filter((s) => ['crowd', 'comment', 'sub'].includes(s))
                : [];
            // 无字幕时禁止伪造 'sub' 来源高光
            const sources = rawSources.filter((s) => (hasSub || s !== 'sub') && (hasCrowd || s !== 'crowd'));
            if (!hasSub && rawSources.includes('sub') && sources.length === 0) {
                continue;
            }
            const rawSubLine = item?.subLine;
            const hasValidSubLineProp = rawSubLine !== null && rawSubLine !== undefined && rawSubLine !== '' && typeof rawSubLine !== 'boolean';
            const subLineNum = hasValidSubLineProp ? Number(rawSubLine) : NaN;
            const rawItemSec = clampSec(item?.seconds);
            // 仅当来源明确包含 sub 且 subLine 为有效整数行号时才用字幕行时间反查（严防 Number(null)===0 覆写所有评论高光）
            let fromSubLine = (hasSub && sources.includes('sub') && Number.isInteger(subLineNum) && built.lineSeconds?.has(subLineNum))
                ? built.lineSeconds.get(subLineNum)
                : null;
            if (fromSubLine !== null && subLineNum === 0 && rawItemSec !== null && Math.abs(rawItemSec - fromSubLine) > 180) {
                fromSubLine = null;
            }
            if (fromSubLine !== null && rawItemSec !== null && Math.abs(rawItemSec - fromSubLine) > 60 && (sources.includes('comment') || sources.includes('crowd'))) {
                const anchored = commentTsList.some((cts) => Math.abs(cts - rawItemSec) <= 15)
                    || (Array.isArray(crowdPeaks) && crowdPeaks.some((p) => Math.abs(Number(p?.seconds) - rawItemSec) <= 15));
                if (anchored) fromSubLine = null;
            }
            const sec = fromSubLine !== null ? clampSec(fromSubLine) : rawItemSec;
            if (sec === null) continue;
            // 无字幕且无波峰时，高光时间必须与真实评论中出现过的时间相近（<= 120s 容差）
            if (!hasSub && !hasCrowd) {
                if (commentTsList.length === 0) continue;
                const backed = commentTsList.some((cts) => Math.abs(cts - sec) <= 120);
                if (!backed) continue;
            }
            if (dur >= 600 && sec >= dur - 90 && !sources.includes('comment') && !sources.includes('crowd') && /(?:结局|片尾|收尾|尾声|定格)/.test(`${item?.tag || ''}${item?.reason || ''}`)) {
                continue;
            }
            const endSecRaw = clampSec(item?.endSeconds);
            const endSeconds = (endSecRaw !== null && endSecRaw > sec && (endSecRaw - sec) <= 1800) ? endSecRaw : null;
            const tag = normalizeInlineText(item?.tag || '').slice(0, 6).replace(/[/|、]+$/, '') || '高能';
            const reason = normalizeInlineText(item?.reason || '').slice(0, 36);
            const score = Math.max(1, Math.min(100, Math.round(Number(item?.score) || 80)));
            if (score < 50) continue;
            rawHighlights.push({ seconds: sec, endSeconds, tag, reason, sources, score });
        }
        // 邻近 45 秒内去重合并，保留高分高光（宁缺毋滥，上限 5 条）
        rawHighlights.sort((a, b) => b.score - a.score);
        const highlights = [];
        for (const h of rawHighlights) {
            if (highlights.some((kept) => Math.abs(kept.seconds - h.seconds) < 45)) continue;
            highlights.push(h);
            if (highlights.length >= 5) break;
        }
        highlights.sort((a, b) => a.seconds - b.seconds);

        const skipZones = [];
        for (const z of Array.isArray(parsed.skipZones) ? parsed.skipZones : []) {
            const sec = clampSec(z?.seconds);
            if (sec === null) continue;
            const endRaw = clampSec(z?.endSeconds);
            if (endRaw === null || endRaw <= sec || (endRaw - sec) < 15) continue;
            if (dur > 0 && sec >= Math.floor(dur) - 15) continue;
            const overlapsHighlight = highlights.some((h) => {
                const hEnd = h.endSeconds || (h.seconds + 30);
                return h.seconds <= endRaw + 20 && hEnd >= sec - 20;
            });
            if (overlapsHighlight) continue;
            const reason = normalizeInlineText(z?.reason || '').slice(0, 28);
            if (!reason || /(?:字幕|L\d+|跳跃|推测|若无)/i.test(reason)) continue;
            skipZones.push({ seconds: sec, endSeconds: endRaw, reason });
            if (skipZones.length >= 3) break;
        }

        const normalizeSentiment = (rawSent) => {
            const s = String(rawSent || '').trim().toLowerCase();
            if (s === 'hype' || s === 'positive') return 'hype';
            if (s === 'warn' || s === 'critique' || s === 'negative' || s === 'dislike') return 'warn';
            return 'neutral';
        };

        const commentInsights = {};
        for (const ct of Array.isArray(parsed.commentTags) ? parsed.commentTags : []) {
            const idx = Number(ct?.idx);
            const target = Number.isInteger(idx) ? built.topComments[idx] : null;
            if (!target?.id) continue;
            const sentiment = normalizeSentiment(ct?.sentiment);
            let inferredSeconds = clampSec(ct?.inferredSeconds);
            const hasExplicitTs = Array.isArray(target.resolvedTs) && target.resolvedTs.length > 0;
            if ((!hasSub && !hasCrowd && !hasExplicitTs) || (inferredSeconds !== null && inferredSeconds <= 5 && !hasExplicitTs)) {
                inferredSeconds = null;
            }
            const note = normalizeInlineText(ct?.note || '').slice(0, 14);
            commentInsights[target.id] = {
                sentiment,
                isCountdown: Boolean(target.countdownApplied),
                inferredSeconds,
                note
            };
        }

        const rawBrief = parsed.brief && typeof parsed.brief === 'object' ? parsed.brief : {};
        const graph = {
            highlights,
            skipZones,
            commentInsights,
            brief: {
                highlights: normalizeInlineText(rawBrief.highlights || '') || '已融合多模态信号识别核心高能片段',
                warnings: normalizeInlineText(rawBrief.warnings || '') || '暂无明显雷点',
                consensus: normalizeInlineText(rawBrief.consensus || '') || '可配合进度条推荐节点快速跳转',
                timestamps: highlights.map((h) => ({ seconds: h.seconds, note: `${h.tag}${h.reason ? ' · ' + h.reason : ''}` }))
            }
        };

        if (safeCode) {
            await LlmCache.setCached(safeCode, 'highlight_graph', built.contentHash, graph);
        }

        AiDebugLogger.recordAiExecution(safeCode, {
            taskType: 'highlight_graph',
            model: res?.model,
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: 'success_llm',
            cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash: built.contentHash },
            inputContext,
            llmResponse: {
                responseModel: res?.model || '',
                usage: res?.usage || null,
                rawContent: res?.content || '',
                parsedOutput: graph,
                validationStats: {
                    highlightsCount: highlights.length,
                    skipZonesCount: skipZones.length,
                    commentInsightsCount: Object.keys(commentInsights).length
                }
            }
        });

        return { ok: true, fromCache: false, graph };
    } catch (err) {
        const isRefused = Boolean(err?.refused || err?.message === 'LLM_REFUSED');
        const safeErr = isRefused ? '模型安全策略拒绝解析' : LlmService.redactSecrets(err?.message || '高能融合分析失败');
        AiDebugLogger.recordAiExecution(safeCode, {
            taskType: 'highlight_graph',
            promptVersion: AI_PROMPT_VERSION,
            forceRefresh,
            durationMs: Date.now() - startedAt,
            outcome: isRefused ? 'refused' : 'error',
            error: safeErr,
            cache: { status: forceRefresh ? 'bypassed' : 'miss', contentHash: built.contentHash },
            inputContext
        });
        if (isRefused) {
            return { ok: false, refused: true, error: safeErr };
        }
        return {
            ok: false,
            refused: false,
            error: safeErr
        };
    }
}
