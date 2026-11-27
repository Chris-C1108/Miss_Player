/**
 * AiBatchTestRunner — Debug 批量实测调度器（单页无头串联元数据、评论、字幕择优、AI 任务与 WebDAV 归档）
 *
 * 复用现有站点采集、SQI 优选与 LlmTasks 管道，零重复核心逻辑。
 */

import { getValue, setValue } from '../utils/storage.js';
import { matchAvCodeFromText } from '../utils/videoCode.js';
import { I18n } from '../constants/i18n.js';
import { fetchJableComments } from '../player/comments/providers/JableCommentProvider.js';
import { fetchJavdbMovieId, fetchJavdbData } from '../player/comments/providers/JavDbCommentProvider.js';
import { processComment } from '../player/comments/CommentDataPipeline.js';
import { SubtitleEngine } from '../player/subtitles/SubtitleEngine.js';
import { selectBestQualityCandidate, computeTrackContentFingerprint } from '../player/subtitles/SubtitleQualityScorer.js';
import {
    rankPreferredCandidates,
    collectAmbiguousFallbackCandidates,
    resolvePreferredSubtitleLang,
    normalizeSubtitleLang
} from '../player/subtitles/SubtitleManager.js';
import { SubtitleRepository } from '../player/subtitles/SubtitleRepository.js';
import { AvMetadataService } from './AvMetadataService.js';
import { LlmService } from './LlmService.js';
import { buildHighlightGraphWithLlm, analyzeSubtitleChaptersWithLlm } from './LlmTasks.js';
import { AiDebugLogger } from './AiDebugLogger.js';

export const BATCH_CODES_STORAGE_KEY = 'mp_ai_batch_test_codes';

const MAX_COMMENT_PAGES = 3;
const MAX_SUB_EVAL_CANDIDATES = 5;
const BETWEEN_ITEM_DELAY_MS = 1200;

let runningState = false;
let abortRequested = false;

/**
 * 解析批量输入的番号文本（支持逐行番号、URL、逗号/空格分隔，忽略 # / // 注释行并保序去重）
 * @param {string} rawText
 * @returns {string[]}
 */
export function parseBatchCodes(rawText) {
    const lines = String(rawText || '').split(/\r?\n/);
    const seen = new Set();
    const out = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
        const tokens = trimmed.split(/[\s,;]+/).filter(Boolean);
        for (const token of tokens) {
            if (token.startsWith('#')) break;
            const code = matchAvCodeFromText(token);
            if (!code || seen.has(code)) continue;
            seen.add(code);
            out.push(code);
        }
    }
    return out;
}

export function loadSavedBatchText() {
    return String(getValue(BATCH_CODES_STORAGE_KEY, '') || '');
}

export function saveBatchText(rawText) {
    setValue(BATCH_CODES_STORAGE_KEY, String(rawText || ''));
}

async function fetchPagedSiteComments(avcode) {
    const jableList = [];
    const javdbList = [];
    let jablePages = 0;
    let javdbPages = 0;
    let jableError = '';
    let javdbError = '';
    let javdbMovieId = '';

    const jableTask = (async () => {
        for (let page = 1; page <= MAX_COMMENT_PAGES; page++) {
            try {
                const res = await fetchJableComments(avcode, page);
                jablePages = page;
                const rows = Array.isArray(res?.comments) ? res.comments : [];
                if (!rows.length) break;
                jableList.push(...rows);
                if (!res?.hasMore) break;
            } catch (err) {
                jableError = err?.message || 'JABLE_ERROR';
                break;
            }
        }
    })();

    const javdbTask = (async () => {
        try {
            const found = await fetchJavdbMovieId(avcode);
            javdbMovieId = found?.movieId || '';
            const domain = found?.domain;
            if (!javdbMovieId) return;
            for (let page = 1; page <= MAX_COMMENT_PAGES; page++) {
                const res = await fetchJavdbData(javdbMovieId, page, domain);
                javdbPages = page;
                const rows = Array.isArray(res?.comments) ? res.comments : [];
                if (!rows.length) break;
                javdbList.push(...rows);
                if (!res?.hasMore) break;
            }
        } catch (err) {
            javdbError = err?.message || 'JAVDB_ERROR';
        }
    })();

    await Promise.allSettled([jableTask, javdbTask]);
    return {
        rawComments: [...jableList, ...javdbList],
        stats: {
            jableCount: jableList.length,
            jablePages,
            jableError: jableError || null,
            javdbMovieId: javdbMovieId || null,
            javdbCount: javdbList.length,
            javdbPages,
            javdbError: javdbError || null
        }
    };
}

function finalizeComments(rawComments, avcode, durationSec) {
    const out = [];
    const seen = new Set();
    for (const raw of rawComments) {
        const text = String(raw?.text || '').trim();
        if (!text) continue;
        const key = `${raw.site || ''}|${text}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const parsed = processComment(text, avcode, durationSec);
        if (parsed.spam?.label === 'SPAM') continue;
        out.push({
            ...raw,
            ...parsed
        });
    }
    return out;
}

async function evaluateSubtitlesForBatch(avcode, preferredLang) {
    const startedAt = Date.now();
    const engine = new SubtitleEngine();
    const { candidates, errors } = await engine.search(avcode);

    AiDebugLogger.recordSubtitleState(avcode, 'searchOnline', {
        durationMs: Date.now() - startedAt,
        candidatesCount: candidates.length,
        errors,
        candidates: candidates.slice(0, 10).map((c) => ({
            id: c.id,
            provider: c.provider,
            lang: c.lang,
            format: c.format,
            rating: c.rating,
            machineTranslated: Boolean(c.machineTranslated),
            originLang: c.originLang || '',
            title: String(c.title || '').slice(0, 60)
        }))
    });

    let ranked = rankPreferredCandidates(candidates, preferredLang);
    let usingAmbiguousProbe = false;
    if (!ranked.length) {
        ranked = collectAmbiguousFallbackCandidates(candidates, preferredLang);
        usingAmbiguousProbe = ranked.length > 0;
    }
    if (!ranked.length) {
        return { picked: null, altTrack: null, maxCueEnd: 0, candidatesCount: candidates.length };
    }

    const pickStartedAt = Date.now();
    const settled = await Promise.allSettled(
        ranked.slice(0, MAX_SUB_EVAL_CANDIDATES).map(async (candidate) => {
            const dl = await engine.download(candidate);
            const cues = dl?.cues;
            if (!cues?.length) return null;
            const { langInfo, quality, format, content, encoding } = dl;
            const item = {
                ...candidate,
                content,
                format: format || candidate.format || 'srt',
                lang: (langInfo?.detectedLang && langInfo.detectedLang !== 'unknown' && langInfo.confidence >= 0.7)
                    ? langInfo.detectedLang
                    : candidate.lang,
                encoding,
                langInfo,
                quality
            };
            if (usingAmbiguousProbe) {
                const actualLang = normalizeSubtitleLang(langInfo?.detectedLang || item.lang);
                if (actualLang !== 'zh' && actualLang !== 'zh-TW' && langInfo?.trackLayout !== 'bilingual') return null;
            }
            return { candidate, item, parsed: { format: item.format, cues }, langInfo, quality };
        })
    );

    const evaluated = [];
    const seenFingerprints = new Set();
    for (const r of settled) {
        if (r.status !== 'fulfilled' || !r.value) continue;
        const fp = computeTrackContentFingerprint(r.value.parsed.cues);
        if (seenFingerprints.has(fp)) continue;
        seenFingerprints.add(fp);
        evaluated.push(r.value);
    }

    const picked = selectBestQualityCandidate(evaluated) || evaluated[0] || null;
    const altEntry = evaluated.find((ev) => ev !== picked && ev.quality?.grade !== 'broken') || null;
    const altTrack = altEntry
        ? { id: altEntry.item?.id || '', title: altEntry.item?.title || '', sqi: altEntry.quality?.sqi ?? 0, cues: altEntry.parsed.cues }
        : null;

    AiDebugLogger.recordSubtitleState(avcode, 'autoPick', {
        durationMs: Date.now() - pickStartedAt,
        preferredLang,
        usingAmbiguousProbe,
        rankedCount: ranked.length,
        pickedOk: Boolean(picked),
        altTrackId: altTrack?.id || '',
        evaluated: evaluated.map((ev) => ({
            id: ev.item?.id || '',
            source: ev.item?.source || '',
            declaredLang: ev.candidate?.lang || '',
            detectedLang: ev.langInfo?.detectedLang || '',
            machineTranslated: Boolean(ev.item?.machineTranslated),
            mtDirection: ev.langInfo?.mtDirection || ev.item?.mtDirection || '',
            isCorrupted: Boolean(ev.langInfo?.isCorrupted),
            sqi: ev.quality?.sqi ?? null,
            reasons: ev.quality?.reasons || [],
            cueCount: ev.parsed?.cues?.length ?? 0
        })),
        chosenId: picked?.item?.id || ''
    });

    if (picked) {
        AiDebugLogger.recordSubtitleState(avcode, 'activeTrack', {
            trigger: 'batch_auto_pick',
            activeId: picked.item.id,
            provider: picked.item.provider || '',
            lang: picked.item.lang || '',
            cueCount: picked.parsed.cues.length,
            sqi: picked.quality?.sqi ?? null,
            grade: picked.quality?.grade || '',
            reasons: picked.quality?.reasons || [],
            trackLayout: picked.langInfo?.trackLayout || ''
        });
    }

    const cues = picked?.parsed?.cues || [];
    const maxCueEnd = cues.reduce((max, c) => Math.max(max, Number(c?.end) || Number(c?.start) || 0), 0);
    return { picked, altTrack, maxCueEnd, candidatesCount: candidates.length };
}

export class AiBatchTestRunner {
    static isRunning() {
        return runningState;
    }

    static cancel() {
        if (runningState) abortRequested = true;
    }

    /**
     * 顺序执行批量测试并将逐部完整 AI 诊断报告实时上传至 WebDAV aiDebugDir
     * @param {{ rawText?: string, codes?: string[], clearLocalSubs?: boolean, forceFresh?: boolean, preferredLang?: string, delayMs?: number, onProgress?: (p: Object) => void }} [options]
     */
    static async runBatch({
        rawText = '',
        codes = null,
        clearLocalSubs = true,
        forceFresh = true,
        preferredLang = '',
        delayMs = BETWEEN_ITEM_DELAY_MS,
        onProgress = null
    } = {}) {
        if (runningState) {
            return { ok: false, error: 'BATCH_ALREADY_RUNNING', results: [] };
        }
        const targetCodes = Array.isArray(codes) && codes.length > 0
            ? parseBatchCodes(codes.join('\n'))
            : parseBatchCodes(rawText || loadSavedBatchText());

        if (!targetCodes.length) {
            return { ok: false, error: 'NO_VALID_CODES', results: [] };
        }

        const resolvedLang = resolvePreferredSubtitleLang(preferredLang || 'auto', I18n.userLang || 'zh-CN');
        const llmEnabled = LlmService.isEnabled();
        const results = [];

        runningState = true;
        abortRequested = false;
        AiDebugLogger.setBatchRecording(true);

        try {
            for (let i = 0; i < targetCodes.length; i++) {
                if (abortRequested) break;
                const code = targetCodes[i];
                const itemStartedAt = Date.now();
                AiDebugLogger.startFreshSession(code);

                onProgress?.({
                    phase: 'start',
                    index: i + 1,
                    total: targetCodes.length,
                    code
                });

                if (clearLocalSubs) {
                    await SubtitleRepository.clearLocal({ codes: [code] });
                }

                const [metaRes, subRes, rawCommentRes] = await Promise.all([
                    AvMetadataService.getMetadata(code, { forceRefresh: forceFresh }).catch(() => null),
                    evaluateSubtitlesForBatch(code, resolvedLang).catch((err) => ({
                        picked: null,
                        altTrack: null,
                        maxCueEnd: 0,
                        candidatesCount: 0,
                        error: err?.message || 'SUB_ERR'
                    })),
                    fetchPagedSiteComments(code)
                ]);

                const estDuration = Math.round(Number(subRes?.maxCueEnd) || 0);
                const comments = finalizeComments(rawCommentRes.rawComments, code, estDuration);
                AiDebugLogger.recordCommentsState(code, 'initialLoad', {
                    mode: 'batch_test',
                    durationSec: estDuration,
                    ...rawCommentRes.stats,
                    usableCount: comments.length
                });

                const cues = subRes?.picked?.parsed?.cues || [];
                const subtitleQuality = subRes?.picked?.quality || null;
                const altCues = subRes?.altTrack?.cues || null;
                const altTitle = subRes?.altTrack?.title || '';

                let hlOutcome = 'llm_disabled';
                let subChOutcome = 'llm_disabled';

                if (llmEnabled && !abortRequested) {
                    const hl = await buildHighlightGraphWithLlm({
                        avcode: code,
                        cues,
                        subtitleQuality,
                        altCues,
                        altTitle,
                        comments,
                        videoDuration: estDuration,
                        vibeTags: LlmService.getConfig().vibeTags || [],
                        title: metaRes?.title || '',
                        metadata: metaRes,
                        forceRefresh: forceFresh
                    }).catch((err) => ({ ok: false, error: err?.message || 'HL_ERR' }));
                    hlOutcome = hl.ok
                        ? `ok(${hl.graph?.highlights?.length ?? 0})`
                        : (hl.skipped ? `skip:${hl.error}` : `err:${hl.error}`);

                    if (cues.length > 0 && !abortRequested) {
                        const ch = await analyzeSubtitleChaptersWithLlm({
                            avcode: code,
                            cues,
                            subtitleQuality,
                            altCues,
                            altTitle,
                            title: metaRes?.title || '',
                            metadata: metaRes,
                            forceRefresh: forceFresh
                        }).catch((err) => ({ ok: false, error: err?.message || 'CH_ERR' }));
                        subChOutcome = ch.ok
                            ? `ok(${ch.chapters?.length ?? 0})`
                            : (ch.skipped ? `skip:${ch.error}` : `err:${ch.error}`);
                    } else {
                        subChOutcome = 'no_sub';
                    }
                }

                const upload = await AiDebugLogger.flushSession(code, { force: true });
                const entry = {
                    code,
                    durationMs: Date.now() - itemStartedAt,
                    hasMeta: Boolean(metaRes?.title || metaRes?.tags?.length),
                    subCandidates: subRes?.candidatesCount || 0,
                    subSqi: subtitleQuality?.sqi ?? null,
                    commentsCount: comments.length,
                    hlOutcome,
                    subChOutcome,
                    uploadedOk: Boolean(upload?.ok),
                    uploadPath: upload?.path || '',
                    uploadError: upload?.error || upload?.reason || ''
                };
                results.push(entry);

                onProgress?.({
                    phase: 'done',
                    index: i + 1,
                    total: targetCodes.length,
                    ...entry
                });

                if (i + 1 < targetCodes.length && !abortRequested && delayMs > 0) {
                    await new Promise((r) => setTimeout(r, delayMs));
                }
            }
        } finally {
            AiDebugLogger.setBatchRecording(false);
            runningState = false;
        }

        const completedAborted = abortRequested;
        abortRequested = false;
        return {
            ok: true,
            aborted: completedAborted,
            total: targetCodes.length,
            completed: results.length,
            uploadedCount: results.filter((r) => r.uploadedOk).length,
            results
        };
    }
}
