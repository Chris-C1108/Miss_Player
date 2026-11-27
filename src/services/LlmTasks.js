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

export const AI_PROMPT_VERSION = 'v2.0';

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

const ALL_SEMANTIC_TAGS = SEMANTIC_TAG_TAXONOMY.flatMap((group) =>
    Array.isArray(group?.tags) ? group.tags : []
);
const ALLOWED_TAG_SET = new Set(ALL_SEMANTIC_TAGS);

function formatMmSs(totalSeconds) {
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

/**
 * 压缩字幕条目为紧凑时间轴文本：
 * 去重 Whisper 重复行 -> 合并短句 -> 超出预算时优先保留情绪/剧情关键词高密度对白 + 全片均匀时间骨架
 * @param {Array<{ start: number, end?: number, text?: string, primaryText?: string }>} cues
 * @param {{ maxChars?: number }} [options]
 * @returns {string}
 */
export function compressCuesForLlm(cues, { maxChars = 13000 } = {}) {
    if (!Array.isArray(cues) || cues.length === 0 || maxChars <= 0) {
        return '';
    }

    const deduped = [];
    for (const cue of cues) {
        const text = normalizeInlineText(cue?.primaryText || cue?.text || '');
        if (!text) continue;

        const start = Math.max(0, Number(cue?.start) || 0);
        const rawEnd = Number(cue?.end);
        const end = Number.isFinite(rawEnd) && rawEnd >= start ? rawEnd : start;

        const last = deduped[deduped.length - 1];
        if (last && last.text === text) {
            last.end = Math.max(last.end, end);
            continue;
        }
        deduped.push({ start, end, text });
    }

    if (deduped.length === 0) return '';

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

    const lines = merged.map((item) => `[${formatMmSs(item.start)}] ${item.text}`);
    const fullText = lines.join('\n');
    if (fullText.length <= maxChars) return fullText;
    if (lines.length <= 2) return sampleLinesToBudget(lines, maxChars);

    // 信息密度分析：识别关键词高亮时刻与剧作锚点
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
    const bucketCount = 8;

    const scored = merged.map((item, idx) => {
        const isFiller = MOAN_FILLER_RE.test(item.text) && item.text.length <= 8;
        let density = 1;
        if (isFiller) {
            density = 0.05;
        } else {
            if (isNearHighlight(item.start)) density += 3;
            density += Math.min(item.text.length / 45, 1.5);
        }
        const rel = (item.start - (merged[0]?.start || 0)) / totalSpan;
        const bucket = Math.min(bucketCount - 1, Math.max(0, Math.floor(rel * bucketCount)));
        return { idx, line: lines[idx], density, bucket };
    });

    // ~65% 预算按时间桶均衡保留高密度关键词对白，~35% 预算保留全片均匀时间骨架
    const denseBudget = Math.floor(maxChars * 0.65);
    const selectedIdx = new Set();
    let denseChars = 0;

    const buckets = Array.from({ length: bucketCount }, (_, b) =>
        scored.filter((s) => s.bucket === b && s.density >= 1.2).sort((a, b2) => b2.density - a.density)
    );
    let round = 0;
    let progressed = true;
    while (progressed && denseChars < denseBudget) {
        progressed = false;
        for (let b = 0; b < bucketCount; b++) {
            const candidate = buckets[b][round];
            if (!candidate) continue;
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

    return sampleLinesToBudget(orderedLines, maxChars);
}

function buildSubtitleChapterPayload(avcode, compressed, metadata) {
    const metaText = formatMetadataForLlm(metadata);
    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const contentHash = buildVersionedTaskHash('sub_chapters', `${compressed}\n---\n${metaText}`);
    return { metaText, safeCode, contentHash };
}

/**
 * 静默读取版本化后的字幕分幕缓存（不触发模型调用）
 */
export async function getCachedSubtitleChapters({ avcode, cues, metadata = null } = {}) {
    const compressed = compressCuesForLlm(cues);
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
 * @param {{ avcode: string, cues: Array, title?: string, metadata?: Object|null, forceRefresh?: boolean }} params
 * @returns {Promise<{ ok: boolean, fromCache?: boolean, summary?: string, chapters?: Array, refused?: boolean, error?: string }>}
 */
export async function analyzeSubtitleChaptersWithLlm({ avcode, cues, title = '', metadata = null, forceRefresh = false } = {}) {
    const startedAt = Date.now();
    const compressed = compressCuesForLlm(cues);
    if (!compressed) {
        return { ok: false, refused: false, error: '无可用字幕内容' };
    }

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
                '你是一位专业的影视剧作结构与情绪转折时间轴标注编辑。',
                '请结合作品元数据（女优/片商/题材标签/简介）与台词时间轴，准确梳理叙事推进与情绪转折节点，严禁输出多余解释或 Markdown 标记，仅返回严格合法 JSON。',
                '输出 JSON 格式必须为：',
                '{ "summary": "20字内剧情概览", "chapters": [{ "seconds": 123, "tag": "2-4字节点标签", "headline": "16字内该时段剧情看点" }] }',
                '要求：chapters 返回 5 至 8 个按 seconds 升序排列的关键节点，seconds 必须是视频总时长范围内的整数秒。'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                metaText || (safeTitle ? `作品标题: ${safeTitle}` : ''),
                maxCueEnd > 0 ? `台词最大时间: ${Math.round(maxCueEnd)} 秒 (${formatMmSs(maxCueEnd)})` : '',
                '台词时间轴:',
                compressed
            ].filter(Boolean).join('\n')
        }
    ];

    try {
        const res = await LlmService.chatCompletion({
            messages,
            temperature: 0.2,
            maxTokens: 900
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
        const chapters = rawChapters
            .map((item) => {
                const secRaw = Number(item?.seconds ?? item?.time ?? item?.start);
                if (!Number.isFinite(secRaw)) return null;
                const upperBound = maxCueEnd > 0 ? maxCueEnd : Math.max(0, secRaw);
                const seconds = Math.round(Math.max(0, Math.min(upperBound, secRaw)));
                const tag = normalizeInlineText(item?.tag || '').slice(0, 6) || '节点';
                const headline = normalizeInlineText(item?.headline || item?.title || item?.desc || '').slice(0, 28);
                if (!headline && !item?.tag) return null;
                return { seconds, tag, headline };
            })
            .filter(Boolean)
            .sort((a, b) => a.seconds - b.seconds)
            .slice(0, 12);

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

/**
 * 双池配额选取高信息量评论（带时间戳评论 <=30 条 + 无时间戳长评 >=12字 <=20 条）
 * @param {Array} comments
 * @param {number} [maxItems=55]
 * @returns {Array<{ id: string, text: string, hasTs: boolean }>}
 */
function selectBalancedComments(comments = [], maxItems = 55) {
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

        const hasTs = Boolean(
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
            rankScore: Math.min(text.length, 200) + likesBonus
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

/**
 * 构建评论去重采样文本及版本化缓存哈希
 * @param {Array} comments
 * @param {Object|null} [metadata]
 * @returns {{ digest: string, metaText: string, contentHash: string } | null}
 */
function buildCommentsDigest(comments = [], metadata = null) {
    const selected = selectBalancedComments(comments, 55);
    if (selected.length === 0) return null;

    const selectedLines = [];
    let totalChars = 0;
    const MAX_CHARS = 5500;

    for (const item of selected) {
        const line = `${item.hasTs ? '[含时间点] ' : ''}${item.text.slice(0, 220)}`;
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
 * @param {{ avcode: string, comments: Array, metadata?: Object|null }} params
 * @returns {Promise<{ hit: boolean, brief?: Object }>}
 */
export async function getCachedCommentBrief({ avcode, comments, metadata = null } = {}) {
    const code = normalizeInlineText(avcode).toUpperCase();
    const built = buildCommentsDigest(comments, metadata);
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
    const built = buildCommentsDigest(comments, metadata);
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
                '你是一位客观的影评整理助手，负责结合作品元数据与观众短评提炼核心看点、避坑提醒、口碑共识与高能时间戳。',
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
            maxTokens: 750
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

function buildFusionInputs({ cues = [], comments = [], crowdPeaks = [], vibeTags = [], metadata = null }) {
    const compressedSub = Array.isArray(cues) && cues.length > 0
        ? compressCuesForLlm(cues, { maxChars: 7500 })
        : '';

    const topComments = selectBalancedComments(comments, 45);
    const commentLines = topComments.map((item, idx) => `[C${idx}] ${item.text.slice(0, 180)}`);

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
export async function getCachedHighlightGraph({ avcode, cues = [], comments = [], crowdPeaks = [], vibeTags = [], metadata = null } = {}) {
    const code = normalizeInlineText(avcode).toUpperCase();
    const { topComments, compressedSub, crowdSig, contentHash } = buildFusionInputs({ cues, comments, crowdPeaks, vibeTags, metadata });
    if (!code || (!compressedSub && topComments.length === 0 && !crowdSig)) {
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
 * 一次性融合：影片元数据 + 社区回放波峰 + 高密度字幕骨架 + 双池平衡评论文本 + 用户偏好标签
 * @param {Object} params
 * @returns {Promise<{ ok: boolean, fromCache?: boolean, graph?: Object, refused?: boolean, error?: string }>}
 */
export async function buildHighlightGraphWithLlm({
    avcode,
    cues = [],
    comments = [],
    crowdPeaks = [],
    videoDuration = 0,
    vibeTags = [],
    metadata = null,
    forceRefresh = false
} = {}) {
    const startedAt = Date.now();
    const built = buildFusionInputs({ cues, comments, crowdPeaks, vibeTags, metadata });
    if (!built.compressedSub && built.topComments.length === 0 && !built.crowdSig) {
        return { ok: false, refused: false, error: '暂无可用于联合分析的评论、字幕或热度数据' };
    }

    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const dur = Math.max(0, Number(videoDuration) || 0);
    const inputContext = {
        hasMetadata: Boolean(built.metaText),
        metaText: built.metaText,
        cueCount: Array.isArray(cues) ? cues.length : 0,
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
        ? crowdPeaks.map((p) => `${formatMmSs(p.seconds)}(强度${Math.round((Number(p.intensity) || 0) * 100)}%)`).join(', ')
        : '(暂无社区热度数据)';
    const vibePromptText = (Array.isArray(vibeTags) && vibeTags.length > 0)
        ? `用户偏好要素（排序可适当靠前）: ${vibeTags.join('、')}`
        : '';

    const messages = [
        {
            role: 'system',
            content: [
                '你是影片多模态高光分析引擎。请结合作品元数据（片名/女优/题材标签/简介）、社区回放波峰、字幕对白骨架与观众评论（标记为 [C0], [C1]...），在单次回复中输出融合高光图谱：',
                '1. highlights: 最多 8 个核心高能片段，优先融合多源共鸣与用户偏好；',
                '2. skipZones: 最多 4 个避坑/拖沓/吐槽区间（如片头拖沓、马赛克或假水戏）；',
                '3. commentTags: 仅输出值得标注的评论项，识别 sentiment(hype高能/warn避坑/neutral)、是否为剩余时间倒数(isCountdown)、以及对“无时间点好评”结合字幕和波峰反推的时间 seconds；',
                '4. brief: 1句话看点/避坑/共识总结；',
                '仅输出严格合法 JSON，禁止 Markdown 围栏与多余解释：',
                '{ "highlights": [{ "seconds": 120, "endSeconds": 180, "tag": "2-4字标签", "reason": "16字内理由", "sources": ["crowd","comment","sub"], "score": 92 }], "skipZones": [{ "seconds": 0, "endSeconds": 90, "reason": "14字内避坑说明" }], "commentTags": [{ "idx": 0, "sentiment": "hype", "isCountdown": false, "inferredSeconds": 420, "note": "10字内标签" }], "brief": { "highlights": "看点", "warnings": "避坑(无则写暂无明显雷点)", "consensus": "共识" } }'
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
                built.commentLines.length > 0 ? `观众评论:\n${built.commentLines.join('\n')}` : '观众评论: (暂无评论)'
            ].filter(Boolean).join('\n\n')
        }
    ];

    try {
        const res = await LlmService.chatCompletion({
            messages,
            temperature: 0.2,
            maxTokens: 1200
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

        const highlights = [];
        for (const item of Array.isArray(parsed.highlights) ? parsed.highlights : []) {
            const sec = clampSec(item?.seconds);
            if (sec === null) continue;
            const endSecRaw = clampSec(item?.endSeconds);
            const endSeconds = endSecRaw !== null && endSecRaw > sec ? endSecRaw : null;
            const tag = normalizeInlineText(item?.tag || '').slice(0, 6) || '高能';
            const reason = normalizeInlineText(item?.reason || '').slice(0, 24);
            const sources = Array.isArray(item?.sources)
                ? item.sources.map((s) => String(s || '').trim()).filter((s) => ['crowd', 'comment', 'sub'].includes(s))
                : [];
            const score = Math.max(1, Math.min(100, Math.round(Number(item?.score) || 80)));
            highlights.push({ seconds: sec, endSeconds, tag, reason, sources, score });
            if (highlights.length >= 8) break;
        }
        highlights.sort((a, b) => a.seconds - b.seconds);

        const skipZones = [];
        for (const z of Array.isArray(parsed.skipZones) ? parsed.skipZones : []) {
            const sec = clampSec(z?.seconds);
            if (sec === null) continue;
            const endRaw = clampSec(z?.endSeconds);
            const endSeconds = endRaw !== null && endRaw > sec ? endRaw : sec + 30;
            const reason = normalizeInlineText(z?.reason || '').slice(0, 22) || '节奏偏慢';
            skipZones.push({ seconds: sec, endSeconds, reason });
            if (skipZones.length >= 4) break;
        }

        const commentInsights = {};
        for (const ct of Array.isArray(parsed.commentTags) ? parsed.commentTags : []) {
            const idx = Number(ct?.idx);
            const target = Number.isInteger(idx) ? built.topComments[idx] : null;
            if (!target?.id) continue;
            const sentiment = ['hype', 'warn', 'neutral'].includes(ct?.sentiment) ? ct.sentiment : 'neutral';
            const inferredSeconds = clampSec(ct?.inferredSeconds);
            const note = normalizeInlineText(ct?.note || '').slice(0, 14);
            commentInsights[target.id] = {
                sentiment,
                isCountdown: Boolean(ct?.isCountdown),
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
