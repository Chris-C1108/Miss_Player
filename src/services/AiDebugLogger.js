/**
 * AiDebugLogger — AI 功能、上下文就绪状态与输出结果专用 WebDAV 诊断采集器
 *
 * 职责：
 * 1. 受控于独立开关 `aiDebugEnabled`（默认关闭，开启后零侵入记录全链路诊断状态）
 * 2. 按影片番号（Session 维度）聚合三大诊断视角：
 *    - contextReadiness: 元数据 (L0/L1/L2)、字幕选优与激活轨、评论采集与 _waitForContextsReady 就绪门控
 *    - aiExecutions: 四大 AI 任务 (sub_chapters / comment_brief / highlight_graph / auto_tag) 的缓存命中、完整采样上下文与模型输入/输出
 *    - timeline: 按时间偏移排列的关键状态里程碑
 * 3. 严格通过 LlmService.redactSecrets 脱敏密钥，序列化防重放上传至用户指定的 WebDAV 目录
 */

import { cleanAvCode } from '../utils/videoCode.js';
import { WebDavClient } from '../sync/WebDavClient.js';
import { SyncManager } from '../sync/SyncManager.js';
import { LlmService, LlmCache } from './LlmService.js';

const DEBOUNCE_UPLOAD_MS = 1800;
const MAX_SESSIONS_IN_MEMORY = 8;
const MAX_TIMELINE_EVENTS = 250;
const MAX_EXECUTIONS_PER_SESSION = 40;

const sessions = new Map();
let hooksBound = false;
let batchRecordingActive = false;

function normalizeCodeKey(avcode) {
    const raw = String(avcode || '').trim();
    const cleaned = cleanAvCode(raw);
    const code = (cleaned || raw || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9._-]/g, '_');
    return code || 'UNKNOWN';
}

function formatTimestampTag(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function buildSessionId() {
    const rnd = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    return `${formatTimestampTag()}_${rnd}`;
}

function clipText(raw, maxLen = 4000) {
    if (raw === null || raw === undefined) return '';
    const redacted = LlmService.redactSecrets(String(raw));
    if (redacted.length <= maxLen) return redacted;
    return `${redacted.slice(0, maxLen)}\n...[truncated ${redacted.length - maxLen} chars]`;
}

function deepRedact(value, depth = 0) {
    if (depth > 6 || value === null || value === undefined) return value;
    if (typeof value === 'string') return LlmService.redactSecrets(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 120).map((item) => deepRedact(item, depth + 1));
    if (typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            if (/^(?:apiKey|authorization|pass|password|token)$/i.test(k)) {
                out[k] = v ? '[REDACTED]' : '';
                continue;
            }
            out[k] = deepRedact(v, depth + 1);
        }
        return out;
    }
    return String(value);
}

function resolveSafePageUrl() {
    try {
        if (typeof window === 'undefined' || !window.location) return '';
        const host = window.location.hostname || '';
        const pathname = window.location.pathname || '';
        return host ? `https://${host}${pathname}` : pathname;
    } catch (_) {
        return '';
    }
}

function resolveScriptVersion() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return String(GM_info.script.version);
        }
    } catch (_) {}
    return '';
}

function bindLifecycleFlushOnce() {
    if (hooksBound) return;
    hooksBound = true;
    try {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('pagehide', () => {
                AiDebugLogger.flushAll().catch(() => {});
            });
        }
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    AiDebugLogger.flushAll().catch(() => {});
                }
            });
        }
    } catch (_) {}
}

function getOrCreateSession(avcode) {
    const code = normalizeCodeKey(avcode);
    if (sessions.has(code)) {
        const existing = sessions.get(code);
        existing.updatedAt = new Date().toISOString();
        return existing;
    }

    if (sessions.size >= MAX_SESSIONS_IN_MEMORY) {
        const oldestKey = sessions.keys().next().value;
        if (oldestKey) {
            const old = sessions.get(oldestKey);
            if (old?.debounceTimer) clearTimeout(old.debounceTimer);
            sessions.delete(oldestKey);
        }
    }

    const sessionId = buildSessionId();
    const nowIso = new Date().toISOString();
    const session = {
        code,
        sessionId,
        fileName: `${code}_${sessionId}.json`,
        createdAtMs: Date.now(),
        startedAt: nowIso,
        updatedAt: nowIso,
        pageUrl: resolveSafePageUrl(),
        dirty: false,
        inFlightPromise: null,
        needsReupload: false,
        debounceTimer: null,
        lastUploadedAt: null,
        lastUploadedPath: '',
        lastUploadError: '',
        seqCounter: 0,
        contextReadiness: {
            metadata: null,
            subtitles: {
                searchOnline: null,
                autoPick: null,
                activeTrack: null
            },
            comments: {
                initialLoad: null,
                waitGate: null
            }
        },
        aiExecutions: [],
        timeline: []
    };
    sessions.set(code, session);
    bindLifecycleFlushOnce();
    return session;
}

function buildUploadPayload(session) {
    const cfg = LlmService.getConfig();
    return {
        schemaVersion: '1.0',
        scriptVersion: resolveScriptVersion(),
        avcode: session.code,
        sessionId: session.sessionId,
        pageUrl: session.pageUrl || resolveSafePageUrl(),
        startedAt: session.startedAt,
        updatedAt: session.updatedAt,
        llmConfigSnapshot: {
            enabled: Boolean(cfg.enabled),
            baseUrl: cfg.baseUrl || '',
            model: cfg.model || '',
            timeoutMs: cfg.timeoutMs,
            featureSubChapters: Boolean(cfg.featureSubChapters),
            featureCommentBrief: Boolean(cfg.featureCommentBrief),
            featureHighlightFusion: Boolean(cfg.featureHighlightFusion),
            featureAutoTag: Boolean(cfg.featureAutoTag),
            autoTagOnMark: Boolean(cfg.autoTagOnMark),
            vibeTags: Array.isArray(cfg.vibeTags) ? cfg.vibeTags : [],
            cacheEpoch: LlmCache.getCacheEpoch()
        },
        contextReadiness: deepRedact(session.contextReadiness),
        aiExecutions: deepRedact(session.aiExecutions),
        timeline: deepRedact(session.timeline)
    };
}

function scheduleUpload(session, immediate = false) {
    session.dirty = true;
    if (session.debounceTimer) {
        clearTimeout(session.debounceTimer);
        session.debounceTimer = null;
    }
    if (immediate) {
        return AiDebugLogger.flushSession(session.code);
    }
    session.debounceTimer = setTimeout(() => {
        session.debounceTimer = null;
        AiDebugLogger.flushSession(session.code).catch(() => {});
    }, DEBOUNCE_UPLOAD_MS);
    return Promise.resolve({ ok: true, queued: true });
}

export class AiDebugLogger {
    /**
     * 批量实测期间临时激活 AI 诊断录制（无需持久化开关）
     * @param {boolean} active
     */
    static setBatchRecording(active) {
        batchRecordingActive = Boolean(active);
    }

    /**
     * 判断 AI 专项调试开关是否开启
     * @returns {boolean}
     */
    static isEnabled() {
        return batchRecordingActive || LlmService.isAiDebugEnabled();
    }

    /**
     * 获取规范化后的 WebDAV 保存相对子目录
     * @returns {string}
     */
    static getTargetDir() {
        const cfg = LlmService.getConfig();
        return cfg.aiDebugDir || 'logs/ai-debug';
    }

    /**
     * 清理指定番号的旧内存调试会话，供批量复测获得纯净初始态
     * @param {string} avcode
     */
    static startFreshSession(avcode) {
        const code = normalizeCodeKey(avcode);
        if (!code) return;
        const prev = sessions.get(code);
        if (prev?.debounceTimer) clearTimeout(prev.debounceTimer);
        sessions.delete(code);
    }

    /**
     * 重置内存态（供单元测试隔离）
     */
    static resetForTests() {
        batchRecordingActive = false;
        for (const s of sessions.values()) {
            if (s.debounceTimer) clearTimeout(s.debounceTimer);
        }
        sessions.clear();
    }

    /**
     * 追加时间线事件
     * @param {string} avcode
     * @param {string} stage
     * @param {Object} [detail]
     * @param {boolean} [immediate=false]
     */
    static recordTimeline(avcode, stage, detail = {}, immediate = false) {
        if (!this.isEnabled() || !avcode) return;
        const session = getOrCreateSession(avcode);
        session.timeline.push({
            at: new Date().toISOString(),
            offsetMs: Math.max(0, Date.now() - session.createdAtMs),
            stage: String(stage || 'event'),
            detail: deepRedact(detail)
        });
        if (session.timeline.length > MAX_TIMELINE_EVENTS) {
            session.timeline.splice(0, session.timeline.length - MAX_TIMELINE_EVENTS);
        }
        scheduleUpload(session, immediate);
    }

    /**
     * 记录影片元数据采集就绪状态 (L0/L1/L2)
     * @param {string} avcode
     * @param {Object} payload
     */
    static recordMetadataState(avcode, payload = {}) {
        if (!this.isEnabled() || !avcode) return;
        const session = getOrCreateSession(avcode);
        const state = {
            at: new Date().toISOString(),
            ...deepRedact(payload)
        };
        session.contextReadiness.metadata = state;
        this.recordTimeline(avcode, 'context.metadata', {
            tier: state.tier || state.source || 'unknown',
            ok: Boolean(state.ok),
            durationMs: state.durationMs ?? null,
            actressesCount: state.actressesCount ?? 0,
            tagsCount: state.tagsCount ?? 0
        });
    }

    /**
     * 记录字幕搜索 / 自动选优 / 激活轨就绪状态
     * @param {string} avcode
     * @param {'searchOnline'|'autoPick'|'activeTrack'} section
     * @param {Object} payload
     */
    static recordSubtitleState(avcode, section, payload = {}) {
        if (!this.isEnabled() || !avcode || !section) return;
        const session = getOrCreateSession(avcode);
        const state = {
            at: new Date().toISOString(),
            ...deepRedact(payload)
        };
        session.contextReadiness.subtitles[section] = state;
        this.recordTimeline(avcode, `context.subtitles.${section}`, state);
    }

    /**
     * 记录评论采集与就绪门控状态
     * @param {string} avcode
     * @param {'initialLoad'|'waitGate'|'uiFallback'} section
     * @param {Object} payload
     */
    static recordCommentsState(avcode, section, payload = {}) {
        if (!this.isEnabled() || !avcode || !section) return;
        const session = getOrCreateSession(avcode);
        const state = {
            at: new Date().toISOString(),
            ...deepRedact(payload)
        };
        session.contextReadiness.comments[section] = state;
        this.recordTimeline(avcode, `context.comments.${section}`, state);
    }

    /**
     * 记录一次 AI 任务执行详情（缓存探测、上下文摘要/预览、模型原样回复、解析输出及耗时）并触发落盘
     * @param {string} avcode
     * @param {Object} execution
     * @returns {Promise<Object>}
     */
    static recordAiExecution(avcode, execution = {}) {
        if (!this.isEnabled() || !avcode) {
            return Promise.resolve({ ok: false, skipped: true });
        }
        const session = getOrCreateSession(avcode);
        session.seqCounter += 1;

        const inputCtx = execution.inputContext && typeof execution.inputContext === 'object'
            ? { ...execution.inputContext }
            : {};
        if (typeof inputCtx.compressedSubPreview === 'string') {
            inputCtx.compressedSubPreview = clipText(inputCtx.compressedSubPreview, 4800);
        }
        if (typeof inputCtx.commentsDigestPreview === 'string') {
            inputCtx.commentsDigestPreview = clipText(inputCtx.commentsDigestPreview, 4800);
        }
        if (typeof inputCtx.windowText === 'string') {
            inputCtx.windowText = clipText(inputCtx.windowText, 2600);
        }
        if (typeof inputCtx.metaText === 'string') {
            inputCtx.metaText = clipText(inputCtx.metaText, 800);
        }

        const llmRes = execution.llmResponse && typeof execution.llmResponse === 'object'
            ? { ...execution.llmResponse }
            : {};
        if (typeof llmRes.rawContent === 'string') {
            llmRes.rawContent = clipText(llmRes.rawContent, 14000);
        }

        const record = {
            seq: session.seqCounter,
            at: new Date().toISOString(),
            offsetMs: Math.max(0, Date.now() - session.createdAtMs),
            taskType: String(execution.taskType || 'unknown'),
            model: String(execution.model || LlmService.getConfig().model || ''),
            promptVersion: String(execution.promptVersion || ''),
            forceRefresh: Boolean(execution.forceRefresh),
            durationMs: Number.isFinite(execution.durationMs) ? Math.round(execution.durationMs) : 0,
            outcome: String(execution.outcome || 'unknown'),
            error: execution.error ? clipText(execution.error, 400) : null,
            cache: deepRedact(execution.cache || {}),
            inputContext: deepRedact(inputCtx),
            llmResponse: deepRedact(llmRes)
        };

        session.aiExecutions.push(record);
        if (session.aiExecutions.length > MAX_EXECUTIONS_PER_SESSION) {
            session.aiExecutions.shift();
        }
        session.timeline.push({
            at: record.at,
            offsetMs: record.offsetMs,
            stage: `ai.${record.taskType}`,
            detail: {
                seq: record.seq,
                outcome: record.outcome,
                cacheStatus: record.cache?.status || '',
                durationMs: record.durationMs,
                error: record.error
            }
        });
        if (session.timeline.length > MAX_TIMELINE_EVENTS) {
            session.timeline.splice(0, session.timeline.length - MAX_TIMELINE_EVENTS);
        }

        return scheduleUpload(session, true);
    }

    /**
     * 立即上传指定番号的诊断报告至 WebDAV
     * @param {string} avcode
     * @param {{ force?: boolean }} [options]
     * @returns {Promise<{ ok: boolean, path?: string, reason?: string }>}
     */
    static async flushSession(avcode, { force = false } = {}) {
        if (!this.isEnabled() || !avcode) {
            return { ok: false, reason: 'disabled' };
        }
        const code = normalizeCodeKey(avcode);
        const session = sessions.get(code);
        if (!session) {
            return { ok: false, reason: 'no_session' };
        }
        if (force) {
            session.dirty = true;
        }
        if (session.inFlightPromise) {
            return session.inFlightPromise;
        }
        if (!session.dirty) {
            return { ok: true, skipped: true, path: session.lastUploadedPath };
        }

        const webdavCfg = SyncManager.getWebDavConfig();
        if (!WebDavClient.hasValidEndpoint(webdavCfg)) {
            session.lastUploadError = 'WEBDAV_NOT_CONFIGURED';
            return { ok: false, reason: 'webdav_not_configured' };
        }

        if (session.debounceTimer) {
            clearTimeout(session.debounceTimer);
            session.debounceTimer = null;
        }

        const targetDir = this.getTargetDir();
        const subPath = targetDir ? `${targetDir}/${session.fileName}` : session.fileName;

        const uploadPromise = (async () => {
            let lastResult = { ok: true, skipped: true, path: session.lastUploadedPath };
            try {
                let guard = 0;
                while (session.dirty && guard < 5) {
                    guard += 1;
                    session.dirty = false;
                    const payload = buildUploadPayload(session);
                    await WebDavClient.uploadFile(
                        webdavCfg,
                        subPath,
                        payload,
                        'application/json; charset=utf-8'
                    );
                    session.lastUploadedAt = new Date().toISOString();
                    session.lastUploadedPath = subPath;
                    session.lastUploadError = '';
                    try {
                        globalThis?.window?.DebugLogPanel?.addLog?.(`[AI Debug] 已上传诊断报告 -> ${subPath}`, 'info');
                    } catch (_) {}
                    lastResult = { ok: true, path: subPath };
                }
                return lastResult;
            } catch (err) {
                session.dirty = true;
                session.lastUploadError = LlmService.redactSecrets(err?.message || 'UPLOAD_FAILED');
                return { ok: false, reason: session.lastUploadError, path: subPath };
            } finally {
                if (session.inFlightPromise === uploadPromise) {
                    session.inFlightPromise = null;
                }
            }
        })();

        session.inFlightPromise = uploadPromise;
        return uploadPromise;
    }

    /**
     * 上传当前内存中全部未落盘（或强制全部）会话诊断报告
     * @param {{ force?: boolean }} [options]
     * @returns {Promise<{ ok: boolean, uploadedCount: number, paths: string[], errors: string[] }>}
     */
    static async flushAll({ force = false } = {}) {
        if (!this.isEnabled()) {
            return { ok: false, uploadedCount: 0, paths: [], errors: ['AI Debug 未开启'] };
        }
        const codes = Array.from(sessions.keys());
        if (codes.length === 0) {
            return { ok: false, uploadedCount: 0, paths: [], errors: ['当前暂无可上传的 AI 会话记录'] };
        }
        const paths = [];
        const errors = [];
        for (const code of codes) {
            const res = await this.flushSession(code, { force });
            if (res.ok && res.path && !res.skipped) {
                paths.push(res.path);
            } else if (!res.ok && res.reason) {
                errors.push(`${code}: ${res.reason}`);
            }
        }
        return {
            ok: paths.length > 0 || errors.length === 0,
            uploadedCount: paths.length,
            paths,
            errors
        };
    }

    /**
     * 获取当前缓存会话概览（供设置面板展示）
     * @returns {{ sessionCount: number, totalExecutions: number, lastUploadedPath: string, lastUploadError: string }}
     */
    static getSummary() {
        let totalExecutions = 0;
        let lastUploadedPath = '';
        let lastUploadError = '';
        for (const s of sessions.values()) {
            totalExecutions += s.aiExecutions.length;
            if (s.lastUploadedPath) lastUploadedPath = s.lastUploadedPath;
            if (s.lastUploadError) lastUploadError = s.lastUploadError;
        }
        return {
            sessionCount: sessions.size,
            totalExecutions,
            lastUploadedPath,
            lastUploadError
        };
    }
}
