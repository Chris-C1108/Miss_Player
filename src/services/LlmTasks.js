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
 * 压缩字幕条目为紧凑时间轴文本，去重 Whisper 连续幻听重复并合并短句
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
    return sampleLinesToBudget(lines, maxChars);
}

/**
 * 基于字幕时间轴进行影视剧作结构与情绪转折节点分析
 * @param {{ avcode: string, cues: Array, title?: string, forceRefresh?: boolean }} params
 * @returns {Promise<{ ok: boolean, fromCache?: boolean, summary?: string, chapters?: Array, refused?: boolean, error?: string }>}
 */
export async function analyzeSubtitleChaptersWithLlm({ avcode, cues, title = '', forceRefresh = false } = {}) {
    const compressed = compressCuesForLlm(cues);
    if (!compressed) {
        return { ok: false, refused: false, error: '无可用字幕内容' };
    }

    const contentHash = LlmCache.hashContent(compressed);
    if (!forceRefresh) {
        const cached = await LlmCache.getCached(avcode, 'sub_chapters', contentHash);
        if (cached.hit && cached.data) {
            return {
                ok: true,
                fromCache: true,
                summary: String(cached.data.summary || ''),
                chapters: Array.isArray(cached.data.chapters) ? cached.data.chapters : []
            };
        }
    }

    const maxCueEnd = (Array.isArray(cues) ? cues : []).reduce((max, cue) => {
        const s = Number(cue?.start) || 0;
        const e = Number(cue?.end) || 0;
        return Math.max(max, s, e);
    }, 0);

    const safeTitle = normalizeInlineText(title).slice(0, 120);
    const safeCode = normalizeInlineText(avcode).toUpperCase();

    const messages = [
        {
            role: 'system',
            content: [
                '你是一位专业的影视剧作结构与情绪转折时间轴标注编辑。',
                '请客观分析提供的台词时间轴，梳理叙事推进与情绪转折节点，严禁输出任何多余解释或 Markdown 标记，仅返回严格合法的 JSON。',
                '输出 JSON 格式必须为：',
                '{ "summary": "20字内剧情概览", "chapters": [{ "seconds": 123, "tag": "2-4字节点标签", "headline": "16字内该时段剧情看点" }] }',
                '要求：chapters 返回 5 至 8 个按 seconds 升序排列的关键节点，seconds 必须是视频总时长范围内的整数秒。'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                safeTitle ? `作品标题: ${safeTitle}` : '',
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

        return {
            ok: true,
            fromCache: false,
            summary,
            chapters
        };
    } catch (err) {
        if (err?.refused || err?.message === 'LLM_REFUSED') {
            return { ok: false, refused: true, error: '模型安全策略拒绝解析' };
        }
        return {
            ok: false,
            refused: false,
            error: LlmService.redactSecrets(err?.message || '字幕分幕解析失败')
        };
    }
}

/**
 * 构建评论去重采样文本及确定性缓存哈希
 * @param {Array} comments
 * @returns {{ digest: string, contentHash: string } | null}
 */
function buildCommentsDigest(comments = []) {
    if (!Array.isArray(comments) || comments.length === 0) return null;

    const seen = new Set();
    const candidates = [];

    for (const comment of comments) {
        if (!comment) continue;
        if (typeof comment === 'object' && comment.spam?.label === 'SPAM') continue;

        const text = normalizeInlineText(
            typeof comment === 'string'
                ? comment
                : (comment.rawText || comment.text || comment.content || '')
        );
        if (!text) continue;

        const dedupKey = text.toLowerCase().slice(0, 120);
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const hasTs = Boolean(
            typeof comment === 'object' && (
                comment.hasTimestamps ||
                (Array.isArray(comment.timestamps) && comment.timestamps.length > 0) ||
                /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(text)
            )
        );
        candidates.push({ text, hasTs });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
        if (a.hasTs !== b.hasTs) return a.hasTs ? -1 : 1;
        return b.text.length - a.text.length;
    });

    const selectedLines = [];
    let totalChars = 0;
    const MAX_ITEMS = 55;
    const MAX_CHARS = 5500;

    for (const item of candidates) {
        if (selectedLines.length >= MAX_ITEMS) break;
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
    return {
        digest,
        contentHash: LlmCache.hashContent(digest)
    };
}

/**
 * 静默读取已缓存的评论简报（不触发模型调用）
 * @param {{ avcode: string, comments: Array }} params
 * @returns {Promise<{ hit: boolean, brief?: Object }>}
 */
export async function getCachedCommentBrief({ avcode, comments } = {}) {
    const code = normalizeInlineText(avcode).toUpperCase();
    const built = buildCommentsDigest(comments);
    if (!code || !built?.contentHash) return { hit: false };
    const cached = await LlmCache.getCached(code, 'comment_brief', built.contentHash);
    if (cached.hit && cached.data) {
        return { hit: true, brief: cached.data };
    }
    return { hit: false };
}

/**
 * 提炼跨站评论口碑简报与高能时刻时间戳
 * @param {{ avcode: string, comments: Array, videoDuration?: number, forceRefresh?: boolean }} params
 * @returns {Promise<{ ok: boolean, fromCache?: boolean, brief?: Object, refused?: boolean, error?: string }>}
 */
export async function summarizeCommentsWithLlm({ avcode, comments, videoDuration = 0, forceRefresh = false } = {}) {
    const built = buildCommentsDigest(comments);
    if (!built) {
        return { ok: false, refused: false, error: '暂无可用于提炼的评论内容' };
    }

    const { digest, contentHash } = built;

    if (!forceRefresh) {
        const cached = await LlmCache.getCached(avcode, 'comment_brief', contentHash);
        if (cached.hit && cached.data) {
            return {
                ok: true,
                fromCache: true,
                brief: cached.data
            };
        }
    }

    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const durationNum = Math.max(0, Number(videoDuration) || 0);

    const messages = [
        {
            role: 'system',
            content: [
                '你是一位客观的影评整理助手，负责从观众短评中提炼核心看点、避坑提醒、口碑共识与高能时间戳。',
                '仅返回严格合法的 JSON，不要输出额外解释或 Markdown 围栏：',
                '{ "highlights": "看点1句话", "warnings": "避坑/雷点1句话(无则写暂无明显雷点)", "consensus": "口碑共识1句话", "timestamps": [{ "seconds": 123, "note": "10字内说明" }] }'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
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
            return { ok: false, refused: false, error: '模型返回格式不符合简报要求' };
        }

        const timestamps = (Array.isArray(parsed.timestamps) ? parsed.timestamps : [])
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

        return {
            ok: true,
            fromCache: false,
            brief
        };
    } catch (err) {
        if (err?.refused || err?.message === 'LLM_REFUSED') {
            return { ok: false, refused: true, error: '模型安全策略拒绝解析' };
        }
        return {
            ok: false,
            refused: false,
            error: LlmService.redactSecrets(err?.message || '评论简报生成失败')
        };
    }
}

/**
 * 基于高光起点前后时间窗字幕，从固定语义标签矩阵中自动推荐标签与短评
 * @param {{ avcode: string, startTime: number, cues: Array, title?: string }} params
 * @returns {Promise<{ ok: boolean, tags: string[], comment: string, refused?: boolean, error?: string }>}
 */
export async function autoTagMarkerWithLlm({ avcode, startTime, cues, title = '' } = {}) {
    const targetStart = Math.max(0, Number(startTime) || 0);
    const winStart = Math.max(0, targetStart - 45);
    const winEnd = targetStart + 15;

    const windowCues = (Array.isArray(cues) ? cues : []).filter((cue) => {
        const s = Number(cue?.start);
        const e = Number.isFinite(Number(cue?.end)) ? Number(cue.end) : s;
        if (!Number.isFinite(s)) return false;
        return e >= winStart && s <= winEnd;
    });

    const windowText = compressCuesForLlm(windowCues, { maxChars: 2400 });
    const safeCode = normalizeInlineText(avcode).toUpperCase();
    const safeTitle = normalizeInlineText(title).slice(0, 100);

    const messages = [
        {
            role: 'system',
            content: [
                '你是影片片段标签标注助手。请根据给定时间点前后的字幕语境，从下方允许标签列表中选择最贴切的 1 到 2 个标签，并附带一句 14 字以内短评。',
                `允许标签列表（必须原样选用，禁止自造标签）：${ALL_SEMANTIC_TAGS.join(' ')}`,
                '仅返回严格合法的 JSON：{ "tags": ["#标签1"], "comment": "14字内短评" }'
            ].join('\n')
        },
        {
            role: 'user',
            content: [
                safeCode ? `作品编号: ${safeCode}` : '',
                safeTitle ? `作品标题: ${safeTitle}` : '',
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
        return {
            ok: true,
            tags: validTags,
            comment
        };
    } catch (err) {
        if (err?.refused || err?.message === 'LLM_REFUSED') {
            return { ok: false, refused: true, error: '模型安全策略拒绝解析', tags: [], comment: '' };
        }
        return {
            ok: false,
            refused: false,
            error: LlmService.redactSecrets(err?.message || '自动打标失败'),
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
