/**
 * SubtitleManager — 字幕渲染与管理中枢
 *
 * 模型：
 * 1. 字幕层挂在播放器顶层容器，按画面矩形几何对齐（杜绝 iOS 视频合成面遮挡）
 * 2. 列表 = 全量候选（在线检索结果 + 已收藏），番号不符的候选一律屏蔽
 * 3. 「收藏」是唯一的持久化动作：收藏即优先展示 + 落盘 IndexedDB + 写入 WebDAV；取消收藏即删除
 */

import { Toast } from '../../utils/index.js';
import { __, I18n } from '../../constants/i18n.js';
import { getVideoCodeFromUrl, cleanAvCode } from '../../utils/videoCode.js';
import {
    ICON_SUBTITLE,
    ICON_X_CLOSE,
    ICON_DOWNLOAD,
    ICON_REFRESH,
    ICON_STAR,
    ICON_STAR_FILLED,
    ICON_SLIDERS,
    ICON_LYRICS,
    ICON_SPARKLES
} from '../../constants/icons.js';
import { UISurfaceMachine, SURFACE_TYPES } from '../state/UISurfaceMachine.js';
import { SubtitleEngine } from './SubtitleEngine.js';
import { SubtitleRepository } from './SubtitleRepository.js';
import { decodeSubtitleBuffer } from './SubtitleDecoder.js';
import { parseSubtitles, cuesToPlainText } from './SubtitleFormat.js';
import { convertSubtitleContent, detectChineseScript } from './SubtitleChineseConverter.js';
import { codeMatchesText } from './SubtitleCode.js';
import {
    detectSubtitleLanguage,
    enrichCuesWithTracks,
    formatCueForDisplayMode
} from './SubtitleLanguageDetector.js';
import { scoreSubtitleQuality, selectBestQualityCandidate, computeTrackContentFingerprint } from './SubtitleQualityScorer.js';
import {
    analyzeSubtitlePlot,
    buildHighlightedCueFragment,
    findHighlightRanges
} from './SubtitlePlotAnalyzer.js';
import { LlmService } from '../../services/LlmService.js';
import { analyzeSubtitleChaptersWithLlm, compressCuesForLlm, getCachedSubtitleChapters } from '../../services/LlmTasks.js';
import { AvMetadataService } from '../../services/AvMetadataService.js';
import { AiDebugLogger } from '../../services/AiDebugLogger.js';

const FONT_SIZES = ['small', 'medium', 'large'];
const PREFERRED_LANG_OPTIONS = ['auto', 'zh', 'zh-TW', 'ja', 'en', 'ko'];
const DISPLAY_MODE_OPTIONS = ['primary', 'bilingual', 'secondary'];
const CUE_TAIL_TOLERANCE = 0.35;
const CUE_LEAD_TOLERANCE = 0.25;

export function normalizeSubtitleLang(raw) {
    const code = String(raw || '').trim().toLowerCase().replace(/_/g, '-');
    if (!code) return '';
    if (
        code === 'zh' ||
        code === 'zh-cn' ||
        code === 'zh-sg' ||
        code === 'zh-hans' ||
        code === 'chi' ||
        code === 'zho' ||
        code === 'chs'
    ) {
        return 'zh';
    }
    if (
        code === 'zh-tw' ||
        code === 'zh-hk' ||
        code === 'zh-mo' ||
        code === 'zh-hant' ||
        code === 'cht'
    ) {
        return 'zh-TW';
    }
    if (code === 'ja' || code.startsWith('ja-') || code === 'jp' || code === 'jpn') return 'ja';
    if (code === 'en' || code.startsWith('en-') || code === 'eng') return 'en';
    if (code === 'ko' || code.startsWith('ko-') || code === 'kor') return 'ko';
    if (code === 'vi' || code.startsWith('vi-') || code === 'vie') return 'vi';
    return code.split('-')[0];
}

export function resolvePreferredSubtitleLang(settingValue, browserLang = I18n.userLang) {
    if (settingValue && settingValue !== 'auto') {
        const explicit = normalizeSubtitleLang(settingValue);
        if (explicit) return explicit;
    }
    return normalizeSubtitleLang(browserLang) || 'zh';
}

export function isManualFavoriteSubtitle(item) {
    return Boolean(item?.favorite && !item?.autoSaved && item?.favoriteSource !== 'auto');
}

export function getSubtitleFavoriteTier(item) {
    if (!item?.favorite) return 0;
    return isManualFavoriteSubtitle(item) ? 2 : 1;
}

export function selectBestBundleItem(bundle) {
    const items = bundle?.items || [];
    if (!items.length) return null;
    const favoriteId = bundle?.favoriteId || '';
    return items
        .slice()
        .sort((a, b) => {
            const tierDiff = getSubtitleFavoriteTier(b) - getSubtitleFavoriteTier(a);
            if (tierDiff) return tierDiff;
            const idDiff = (b.id === favoriteId ? 1 : 0) - (a.id === favoriteId ? 1 : 0);
            if (idDiff) return idDiff;
            return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        })[0];
}

export function getChineseFallbackLang(lang) {
    const norm = normalizeSubtitleLang(lang);
    if (norm === 'zh') return 'zh-TW';
    if (norm === 'zh-TW') return 'zh';
    return '';
}

export function rankPreferredCandidates(candidates, preferredLang) {
    const target = normalizeSubtitleLang(preferredLang);
    if (!target || !Array.isArray(candidates)) return [];
    const fallback = getChineseFallbackLang(target);
    return candidates
        .map((candidate) => {
            if (!candidate) return null;
            const lang = normalizeSubtitleLang(candidate.lang);
            if (lang === target) return { candidate, tier: 0 };
            if (fallback && lang === fallback) return { candidate, tier: 1 };
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return (Number(b.candidate.rating) || 0) - (Number(a.candidate.rating) || 0);
        })
        .map((entry) => entry.candidate);
}

/**
 * 当精确语种命中为空时，筛出具备潜在中文线索或疑似上游误标的可探测候选（上限 2 条）
 * @param {Array<Object>} pool
 * @param {string} preferredLang
 * @returns {Array<Object>}
 */
export function collectAmbiguousFallbackCandidates(pool = [], preferredLang = 'zh') {
    const target = normalizeSubtitleLang(preferredLang);
    if (target !== 'zh' && target !== 'zh-TW') return [];
    return (Array.isArray(pool) ? pool : [])
        .filter((c) => {
            if (!c) return false;
            const url = String(c.downloadUrl || '');
            const lang = normalizeSubtitleLang(c.lang);
            if (!lang || lang === 'unknown') return true;
            if (/[-_.]zh[-_.]?(?:cn|tw|hk|hans|hant)|[-_.](?:chs|cht)\./i.test(url)) return true;
            if (c.provider === 'subtitlecat' && /whisper|translated/i.test(c.title || '')) return true;
            return false;
        })
        .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
        .slice(0, 2);
}

/**
 * 若偏好中文变体与实际字幕文本脚本不一致（或经繁简互为备选命中），自动执行繁简转换
 * @param {Object} item
 * @param {{ format: string, cues: Array<Object> }} parsed
 * @param {string} preferredLang
 * @returns {{ item: Object, parsed: { format: string, cues: Array<Object> }, converted: boolean }}
 */
export function applyPreferredChineseConversion(item, parsed, preferredLang) {
    const target = normalizeSubtitleLang(preferredLang);
    if (!item || (target !== 'zh' && target !== 'zh-TW')) {
        return { item, parsed, converted: false };
    }
    const itemLang = normalizeSubtitleLang(item.lang);
    if (itemLang !== 'zh' && itemLang !== 'zh-TW') {
        return { item, parsed, converted: false };
    }

    const sample = cuesToPlainText(parsed?.cues || []);
    const detected = detectChineseScript(sample);

    if (target === 'zh') {
        const needsConvert = itemLang === 'zh-TW' || detected === 'zh-TW';
        if (!needsConvert) return { item, parsed, converted: false };
        const { content, converted } = convertSubtitleContent(item.content, item.format || parsed?.format, 'zh');
        const nextParsed = converted ? parseSubtitles(content, item.format || parsed?.format || '') : parsed;
        if (nextParsed?.cues?.length) {
            item.content = content;
            item.lang = 'zh';
            if (converted) {
                item.convertedFrom = 'zh-TW';
                item.langLabel = text('subtitleLangZhFromTw', '简中(繁转)');
            } else {
                item.langLabel = text('subtitleLangZh', '简中');
            }
            return { item, parsed: nextParsed, converted };
        }
        return { item, parsed, converted: false };
    }

    // target === 'zh-TW'
    if (itemLang === 'zh' && detected === 'zh-TW') {
        // 部分字幕源未区分简繁统一标记为 zh，正文已为繁体时仅修正语言标签，不做二次改写
        item.lang = 'zh-TW';
        item.langLabel = text('subtitleLangZhTw', '繁中');
        return { item, parsed, converted: false };
    }

    const needsConvert = itemLang === 'zh' || detected === 'zh';
    if (!needsConvert) return { item, parsed, converted: false };
    const { content, converted } = convertSubtitleContent(item.content, item.format || parsed?.format, 'zh-TW');
    const nextParsed = converted ? parseSubtitles(content, item.format || parsed?.format || '') : parsed;
    if (nextParsed?.cues?.length) {
        item.content = content;
        item.lang = 'zh-TW';
        if (converted) {
            item.convertedFrom = 'zh';
            item.langLabel = text('subtitleLangZhTwFromZh', '繁中(简转)');
        } else {
            item.langLabel = text('subtitleLangZhTw', '繁中');
        }
        return { item, parsed: nextParsed, converted };
    }
    return { item, parsed, converted: false };
}

const LANG_NAMES = {
    'zh': '中文',
    'zh-CN': '中文',
    'zh-TW': '繁體',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'vi': 'Tiếng Việt'
};

function text(key, fallback) {
    return __(key) || fallback;
}

function formatStamp(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function langName(row) {
    const label = String(row?.langLabel || '').trim();
    if (label) return label;
    return LANG_NAMES[row?.lang] || String(row?.lang || '').toUpperCase() || text('subtitleTitle', '字幕');
}

export class SubtitleManager {
    /**
     * @param {import('../core/PlayerCore.js').PlayerCore} playerCore
     * @param {import('../ui/UIManager.js').UIManager} uiManager
     * @param {import('../managers/ControlManager.js').ControlManager} controlManager
     */
    constructor(playerCore, uiManager, controlManager = null) {
        this.playerCore = playerCore;
        this.uiManager = uiManager;
        this.controlManager = controlManager;
        this.engine = new SubtitleEngine();

        this.avcode = '';
        this.bundle = { code: '', activeId: '', favoriteId: '', items: [], updatedAt: 0 };
        this.activeItem = null;
        this.cues = [];
        this.onlineResults = [];

        this.overlayLayer = null;
        this.overlayText = null;
        this.buttonEl = null;
        this.sheet = null;
        this.panel = null;
        this.listEl = null;
        this.sizeGroupEl = null;
        this.switchEl = null;
        this.autoBestSwitchEl = null;
        this.langGroupEl = null;
        this.displayModeGroupEl = null;
        this.fileInput = null;
        this.adjustBtn = null;
        this.lyricsView = null;
        this.lyricsScroll = null;
        this.lyricsRows = [];
        this.lyricsFollowBtn = null;
        this.lyricsTitleEl = null;
        this.lyricsCountEl = null;
        this.lyricsAnchorsBar = null;
        this.lyricsFilterBtn = null;
        this.lyricsAiBtn = null;
        this._lyricsFollow = true;
        this._lyricsAutoScrollUntil = 0;
        this._lyricIndex = -1;
        this._anchorIndex = -1;
        this._visitedCues = new Set();
        this._suppressRowClickUntil = 0;
        this._plotAnalysis = null;
        this._aiChapters = [];
        this._aiAnalyzing = false;
        this._lyricsOnlyHighlights = false;

        this._lastRenderedText = '';
        this._rafId = 0;
        this._searching = false;
        this._searchPromise = null;
        this._busyId = '';
        this._autoSearchedCodes = new Set();
        this._autoFailedIds = new Set();
        this._autoPickPromise = null;
        this._initPromise = null;
        this._applyPromise = null;

        this._onTimeUpdate = () => this.renderAt(this.targetVideo?.currentTime || 0);
        this._onSeeked = () => this.renderAt(this.targetVideo?.currentTime || 0);
        this._onPlay = () => this._startRenderLoop();
        this._onPause = () => this._stopRenderLoop();
    }

    get targetVideo() {
        return this.playerCore?.targetVideo || null;
    }

    get settings() {
        return this.playerCore?.options?.playerState?.settings || {};
    }

    /** 字幕显示总开关（存在字幕轨即默认显示） */
    get isEnabled() {
        return this.settings.subtitleEnabled !== false;
    }

    // ---------------------------------------------------------------- 生命周期

    init() {
        this.avcode = this._resolveAvcode();
        this._ensureOverlay();
        this._ensureButton();
        this._bindVideoEvents();
        const run = this._loadBundle().then(async () => {
            this._renderList();
            this._syncSwitchState();
            await this._maybeAutoPickPreferred();
            if (this.isEnabled) await this._autoApplyBest({ silent: true });
        }).finally(() => {
            if (this._initPromise === run) this._initPromise = null;
        });
        this._initPromise = run;
    }

    cleanup() {
        this._stopRenderLoop();
        const video = this.targetVideo;
        if (video) {
            video.removeEventListener('timeupdate', this._onTimeUpdate);
            video.removeEventListener('seeked', this._onSeeked);
            video.removeEventListener('play', this._onPlay);
            video.removeEventListener('pause', this._onPause);
            if (this._onVideoMeta) {
                video.removeEventListener('loadedmetadata', this._onVideoMeta);
                video.removeEventListener('emptied', this._onVideoMeta);
                this._onVideoMeta = null;
            }
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._onWindowResize) {
            window.removeEventListener('resize', this._onWindowResize);
            window.removeEventListener('orientationchange', this._onWindowResize);
            this._onWindowResize = null;
        }
        this.overlayLayer?.remove();
        this.buttonEl?.remove();
        this.sheet?.remove();
        this.overlayLayer = null;
        this.overlayText = null;
        this.buttonEl = null;
        this.sheet = null;
        this.panel = null;
        this.listEl = null;
        this.switchEl = null;
        this.autoBestSwitchEl = null;
        this.langGroupEl = null;
        this.cues = [];
        this.activeItem = null;
    }

    // ---------------------------------------------------------------- 数据层

    /**
     * 统一番号漏斗：复用 PlayerCore / 评论面板的权威番号解析入口，
     * 缺失时回落到全局 getVideoCodeFromUrl(this.targetVideo)，最后经 cleanAvCode 归一化。
     */
    _resolveAvcode() {
        const raw =
            this.playerCore?.getVideoCode?.() ||
            this.controlManager?.commentPanel?.videoCode ||
            this.playerCore?.options?.videoCode ||
            getVideoCodeFromUrl(this.targetVideo) ||
            getVideoCodeFromUrl();
        return cleanAvCode(raw) || '';
    }

    /**
     * 番号可能在评论面板异步解析后到位，这里做一次收敛同步；
     * 变更时重载该番号的字幕包，避免字幕写到错误番号名下。
     */
    async _syncAvcode() {
        const next = this._resolveAvcode();
        if (!next || next === this.avcode) return false;
        this.avcode = next;
        this.cues = [];
        this.activeItem = null;
        this.onlineResults = [];
        this._plotAnalysis = null;
        this._aiChapters = [];
        this._altTrackForLlm = null;
        this._lyricsOnlyHighlights = false;
        this.bundle = { code: next, activeId: '', favoriteId: '', items: [], updatedAt: 0 };
        this._setOverlayText('');
        const run = (async () => {
            await this._loadBundle();
            this._renderList();
            this._syncSwitchState();
            await this._maybeAutoPickPreferred();
            if (this.isEnabled) await this._autoApplyBest({ silent: true });
        })().finally(() => {
            if (this._initPromise === run) this._initPromise = null;
        });
        this._initPromise = run;
        await run;
        return true;
    }

    /**
     * 供 AI 分析前统一等待字幕就绪（依次覆盖初始化载包、在线检索、多轨择优与应用）
     * @param {{ timeoutMs?: number }} [options]
     * @returns {Promise<{ ready: boolean, cueCount: number, timedOut: boolean, pending: boolean }>}
     */
    async waitUntilReady({ timeoutMs = 8000 } = {}) {
        const deadline = Date.now() + Math.max(500, Number(timeoutMs) || 8000);
        const raceBudget = async (promise) => {
            const left = deadline - Date.now();
            if (!promise || left <= 0) return;
            await Promise.race([
                Promise.resolve(promise).catch(() => {}),
                new Promise((r) => setTimeout(r, left))
            ]);
        };

        await raceBudget(this._initPromise);
        if (
            !this.cues.length &&
            !this._searchPromise &&
            !this._autoPickPromise &&
            this.settings.subtitleAutoBest &&
            !this._hasSavedFavorite() &&
            this.avcode &&
            !this._autoSearchedCodes.has(this.avcode)
        ) {
            this._maybeAutoPickPreferred();
        }
        await raceBudget(this._searchPromise);
        await raceBudget(this._autoPickPromise);
        await raceBudget(this._applyPromise);

        const stillPending = Boolean(
            this._initPromise ||
            this._searching ||
            this._searchPromise ||
            this._autoPickPromise ||
            this._busyId ||
            this._applyPromise
        );
        return {
            ready: this.cues.length > 0,
            cueCount: this.cues.length,
            timedOut: stillPending && Date.now() >= deadline,
            pending: stillPending
        };
    }

    /** 候选是否属于当前番号（本地导入不受番号约束） */
    _isRelevant(item) {
        if (!item) return false;
        if (item.provider === 'local') return true;
        const title = String(item.title || '').trim();
        if (!title) return true;
        return !this.avcode || codeMatchesText(title, this.avcode);
    }

    async _loadBundle() {
        if (!this.avcode) return;
        try {
            this.bundle = await SubtitleRepository.load(this.avcode);
        } catch (err) {
            console.warn('[SubtitleManager] 字幕包加载失败:', err?.message);
            return;
        }

        // 历史遗留的串号字幕（其它番号的结果）随加载一并清理
        const kept = this.bundle.items.filter((item) => this._isRelevant(item));
        if (kept.length !== this.bundle.items.length) {
            this.bundle.items = kept;
            if (this.bundle.favoriteId && !kept.some((item) => item.id === this.bundle.favoriteId)) {
                this.bundle.favoriteId = '';
            }
            await this._persist();
            window.DebugLogPanel?.addLog?.('[字幕] 已清理当前番号无关的历史字幕', 'info');
        }
    }

    async _persist(options = {}) {
        if (!this.avcode) return;
        try {
            await SubtitleRepository.save(
                {
                    code: this.avcode,
                    activeId: this.bundle.activeId,
                    favoriteId: this.bundle.favoriteId,
                    items: this.bundle.items
                },
                options
            );
        } catch (err) {
            console.warn('[SubtitleManager] 字幕包保存失败:', err?.message);
        }
    }

    _updateSetting(key, value) {
        const state = this.playerCore?.options?.playerState;
        if (state?.updateSetting) state.updateSetting(key, value);
    }

    _findItem(id) {
        return this.bundle.items.find((item) => item.id === id) || null;
    }

    /** 保证字幕条目具备正文（本地缺失时从 WebDAV 补取） */
    async _ensureContent(item) {
        if (!item) return null;
        if (item.content) return item;
        const remote = await SubtitleRepository.downloadItem(item, this.avcode);
        if (remote) {
            item.content = remote;
            return item;
        }
        return null;
    }

    /** 默认展示最优字幕：手动收藏 > 自动收藏 > 评分最高 */
    async _autoApplyBest({ silent = false } = {}) {
        const best = selectBestBundleItem(this.bundle);
        if (!best) return;
        if (best.id === this.activeItem?.id) return;
        await this._applyItem(best, { silent });
    }

    // ---------------------------------------------------------------- 渲染层

    /**
     * 字幕层挂载在播放器顶层容器（与主控栏同层级），
     * 而不是视频包装器内部：iOS Safari 的硬件合成视频面会压制内部非合成 DOM，
     * 顶层挂载 + 逐帧几何对齐才能稳定压在画面上方。
     */
    _ensureOverlay() {
        const host = this.uiManager?.playerContainer;
        if (!host) return;
        if (this.overlayLayer && this.overlayLayer.isConnected) {
            this._syncOverlayGeometry();
            return;
        }

        const layer = document.createElement('div');
        layer.className = 'tm-subtitle-layer is-empty';
        const textEl = document.createElement('div');
        textEl.className = 'tm-subtitle-text';
        layer.appendChild(textEl);
        host.appendChild(layer);

        this.overlayLayer = layer;
        this.overlayText = textEl;
        this._applyFontSize(this.settings.subtitleFontSize, { persist: false });
        this._observeGeometry(host);
        this._syncOverlayGeometry();
    }

    /** 监听容器与视频尺寸变化，保持字幕层与画面矩形严格对齐 */
    _observeGeometry(host) {
        if (this._resizeObserver || typeof ResizeObserver === 'undefined') {
            this._onWindowResize = () => this._syncOverlayGeometry();
            window.addEventListener('resize', this._onWindowResize);
            window.addEventListener('orientationchange', this._onWindowResize);
            return;
        }
        this._resizeObserver = new ResizeObserver(() => this._syncOverlayGeometry());
        if (host) this._resizeObserver.observe(host);
        if (this.uiManager?.videoWrapper) this._resizeObserver.observe(this.uiManager.videoWrapper);
        const video = this.targetVideo;
        if (video) this._resizeObserver.observe(video);
    }

    /** 按 object-fit: contain 的实际画面矩形对齐字幕层（真动态几何注入） */
    _syncOverlayGeometry() {
        const layer = this.overlayLayer;
        const video = this.targetVideo;
        const host = this.uiManager?.playerContainer;
        if (!layer || !video || !host) return;

        const vRect = video.getBoundingClientRect();
        const hRect = host.getBoundingClientRect();
        if (!vRect.width || !vRect.height) return;

        let left = vRect.left - hRect.left;
        let top = vRect.top - hRect.top;
        let width = vRect.width;
        let height = vRect.height;

        const vw = video.videoWidth || 0;
        const vh = video.videoHeight || 0;
        if (vw > 0 && vh > 0) {
            const scale = Math.min(width / vw, height / vh);
            const picW = vw * scale;
            const picH = vh * scale;
            left += (width - picW) / 2;
            top += (height - picH) / 2;
            width = picW;
            height = picH;
        }

        layer.style.left = `${Math.round(left)}px`;
        layer.style.top = `${Math.round(top)}px`;
        layer.style.width = `${Math.round(width)}px`;
        layer.style.height = `${Math.round(height)}px`;
        this._layerHeight = height;
        this._applyVerticalOffset();
    }

    _applyFontSize(size, { persist = true } = {}) {
        const next = FONT_SIZES.includes(size) ? size : 'medium';
        if (this.overlayLayer) {
            FONT_SIZES.forEach((key) => this.overlayLayer.classList.toggle(`tm-subtitle-size-${key}`, key === next));
        }
        this.sizeGroupEl?.querySelectorAll('[data-size]').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.size === next);
        });
        if (persist) this._updateSetting('subtitleFontSize', next);
    }

    _bindVideoEvents() {
        const video = this.targetVideo;
        if (!video) return;
        video.addEventListener('timeupdate', this._onTimeUpdate);
        video.addEventListener('seeked', this._onSeeked);
        video.addEventListener('play', this._onPlay);
        video.addEventListener('pause', this._onPause);
        this._onVideoMeta = () => {
            this._syncOverlayGeometry();
            this._syncAvcode();
        };
        video.addEventListener('loadedmetadata', this._onVideoMeta);
        video.addEventListener('emptied', this._onVideoMeta);
        if (!video.paused) this._startRenderLoop();
    }

    _startRenderLoop() {
        if (this._rafId || !this.cues.length) return;
        const tick = () => {
            this._rafId = 0;
            if (!this.overlayLayer || !this.targetVideo || this.targetVideo.paused) return;
            this.renderAt(this.targetVideo.currentTime);
            const now = performance.now();
            if (now - (this._lastGeomSync || 0) > 250) {
                this._lastGeomSync = now;
                this._syncOverlayGeometry();
            }
            this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
    }

    _stopRenderLoop() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = 0;
    }

    /**
     * 按当前播放时刻渲染字幕文本（二分定位 + 重叠合并）
     * @param {number} currentTime
     */
    renderAt(currentTime) {
        // 先同步歌词高亮：即使当前时刻无字幕（静音区间），也要清掉上一行的活动态
        this._syncLyricHighlight();
        if (!this.cues.length || !this.isEnabled) {
            this._setOverlayText('');
            return;
        }
        const offsetSec = (Number(this.activeItem?.timeOffsetMs) || 0) / 1000;
        const time = (Number(currentTime) || 0) - offsetSec;
        let lo = 0;
        let hi = this.cues.length - 1;
        let idx = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.cues[mid].start <= time) {
                idx = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        if (idx < 0) {
            this._setOverlayText('');
            return;
        }

        const collected = [];
        for (let i = Math.max(0, idx - 2); i <= Math.min(this.cues.length - 1, idx + 1); i++) {
            const cue = this.cues[i];
            if (time >= cue.start - CUE_LEAD_TOLERANCE && time <= cue.end + CUE_TAIL_TOLERANCE) {
                collected.push(cue);
            }
        }
        collected.sort((a, b) => a.start - b.start);
        const displayMode = this.settings.subtitleDisplayMode || 'primary';
        const formatted = collected.map((cue) => formatCueForDisplayMode(cue, displayMode));
        const primaryText = formatted.map((f) => f.primary).filter(Boolean).join('\n');
        const secondaryText = displayMode === 'bilingual'
            ? formatted.map((f) => f.secondary).filter(Boolean).join('\n')
            : '';
        this._setOverlayText(primaryText, secondaryText);
    }

    _setOverlayText(value, secondaryValue = '') {
        const next = String(value || '');
        const nextSec = String(secondaryValue || '');
        const cacheKey = nextSec ? `${next}\u0000${nextSec}` : next;
        if (cacheKey === this._lastRenderedText) return;
        this._lastRenderedText = cacheKey;
        this._ensureOverlay();
        if (!this.overlayLayer || !this.overlayText) return;
        if (nextSec) {
            const primaryEl = document.createElement('span');
            primaryEl.className = 'mp-sub-overlay-primary';
            primaryEl.textContent = next;
            const secondaryEl = document.createElement('span');
            secondaryEl.className = 'mp-sub-overlay-secondary';
            secondaryEl.textContent = nextSec;
            this.overlayText.replaceChildren(primaryEl, secondaryEl);
        } else {
            this.overlayText.textContent = next;
        }
        this.overlayLayer.classList.toggle('is-empty', next.length === 0 && nextSec.length === 0);
    }

    /** 内容优先校正真实语言、双语轨道布局与字幕质量分 (SQI) */
    _inspectTrackMetadata(item, parsed) {
        const cues = parsed?.cues || [];
        if (!item || !cues.length) return { langInfo: null, quality: null };
        const hintLang = item.sourceLangHint || item.lang || '';
        const langInfo = detectSubtitleLanguage(cues, hintLang);
        const videoDurationSec = Number(this.targetVideo?.duration) || 0;
        const quality = scoreSubtitleQuality(cues, { videoDurationSec, langInfo });

        if (langInfo.detectedLang && langInfo.detectedLang !== 'unknown' && langInfo.confidence >= 0.7) {
            if (!item.sourceLangHint && item.lang && item.lang !== langInfo.detectedLang) {
                item.sourceLangHint = item.lang;
            }
            const prevNorm = normalizeSubtitleLang(item.lang);
            if (!prevNorm || prevNorm !== langInfo.detectedLang || langInfo.isCorrupted) {
                item.lang = langInfo.detectedLang;
                if (!item.convertedFrom) item.langLabel = '';
            }
        }
        item.trackLayout = langInfo.trackLayout;
        item.langInfo = langInfo;
        item.quality = quality;
        return { langInfo, quality };
    }

    // ---------------------------------------------------------------- 轨切换

    async _applyItem(item, options = {}) {
        if (!item) return;
        const run = this._runApplyItem(item, options).finally(() => {
            if (this._applyPromise === run) this._applyPromise = null;
        });
        this._applyPromise = run;
        return run;
    }

    async _runApplyItem(item, options = {}) {
        const { silent = false } = options;
        const prepared = await this._ensureContent(item);
        if (!prepared) {
            if (!silent) Toast(text('subtitleDownloadFailed', '下载失败，请换个来源试试'), 2600, 'error');
            return;
        }
        const parsed = parseSubtitles(prepared.content || '', prepared.format || '');
        const { cues, format } = parsed;
        if (!cues.length) {
            if (!silent) Toast(text('subtitleParseFailed', '字幕内容无法解析'), 2500, 'error');
            window.DebugLogPanel?.addLog?.(`[字幕] 解析失败: ${prepared.title} (${prepared.content?.length || 0} 字符)`, 'warn');
            return;
        }

        const { langInfo, quality } = this._inspectTrackMetadata(prepared, parsed);
        prepared.format = format;
        if (this.overlayText) this.overlayText.lang = prepared.lang || '';
        this.timeStepper?.setValue((Number(prepared.timeOffsetMs) || 0) / 1000);
        this.cues = enrichCuesWithTracks(cues, langInfo);
        this.activeItem = prepared;
        this.bundle.activeId = prepared.id;
        this._plotAnalysis = null;
        this._aiChapters = [];
        this._lyricsOnlyHighlights = false;
        this._lastRenderedText = '__dirty__';
        this._updateSetting('subtitleEnabled', true);
        this._syncSwitchState();
        this._updateButtonState();
        this._renderList();
        if (this.lyricsView && !this.lyricsView.classList.contains('is-hidden')) {
            this._renderLyrics();
        }
        this._ensureOverlay();
        this.renderAt(this.targetVideo?.currentTime || 0);
        if (this.targetVideo && !this.targetVideo.paused) this._startRenderLoop();
        window.DebugLogPanel?.addLog?.(`[字幕] 已挂载 ${cues.length} 条字幕: ${prepared.title}`, 'info');
        if (this.avcode && AiDebugLogger.isEnabled()) {
            const lastCue = cues[cues.length - 1];
            AiDebugLogger.recordSubtitleState(this.avcode, 'activeTrack', {
                id: prepared.id || '',
                source: prepared.source || '',
                lang: langInfo?.detectedLang || langInfo?.lang || prepared.lang || '',
                declaredLang: prepared.lang || '',
                format,
                machineTranslated: Boolean(prepared.machineTranslated),
                mtDirection: langInfo?.mtDirection || prepared.mtDirection || '',
                trackLayout: langInfo?.trackLayout || '',
                cueCount: cues.length,
                totalDurationSec: Math.round(Number(lastCue?.end || lastCue?.start || 0)),
                sqi: quality?.sqi ?? null,
                title: prepared.title || ''
            });
        }
        try {
            this.controlManager?.commentPanel?.onSubtitleApplied?.(this.avcode, this.cues);
        } catch (_) {}
        if (!silent) {
            Toast(`${text('subtitleApplied', '已应用字幕')} · ${prepared.title || format.toUpperCase()}`, 2000, 'success');
        }
    }

    _setEnabled(enabled) {
        this._updateSetting('subtitleEnabled', Boolean(enabled));
        this._syncSwitchState();
        if (!enabled) {
            this._setOverlayText('');
            this._stopRenderLoop();
            return;
        }
        if (this.activeItem) {
            this._applyItem(this.activeItem, { silent: true });
        } else {
            this._autoApplyBest({ silent: true });
        }
    }

    _syncSwitchState() {
        this.switchEl?.classList.toggle('is-checked', this.isEnabled);
        this.switchEl?.setAttribute('aria-checked', String(this.isEnabled));
        const autoBest = Boolean(this.settings.subtitleAutoBest);
        this.autoBestSwitchEl?.classList.toggle('is-checked', autoBest);
        this.autoBestSwitchEl?.setAttribute('aria-checked', String(autoBest));
        this._applyPreferredLang(this.settings.subtitlePreferredLang, { persist: false });
        this._applyDisplayMode(this.settings.subtitleDisplayMode || 'primary', { persist: false });
    }

    _updateButtonState() {
        this.buttonEl?.classList.toggle('has-active', Boolean(this.activeItem && this.cues.length));
    }

    // ---------------------------------------------------------------- 顶栏按钮

    _ensureButton() {
        if (this.buttonEl) return;
        const container = this.uiManager?.topActionsContainer;
        if (!container) return;

        const btn = document.createElement('button');
        btn.className = 'tm-subtitle-button tm-control-button-base';
        btn.type = 'button';
        btn.title = text('subtitleTitle', '字幕');
        btn.setAttribute('aria-label', text('subtitleTitle', '字幕'));
        btn.innerHTML = ICON_SUBTITLE;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._togglePanel();
        });
        container.insertBefore(btn, this.uiManager?.settingsBtn || null);
        this.buttonEl = btn;
        this._updateButtonState();
    }

    // ---------------------------------------------------------------- 面板

    _ensurePanel() {
        if (this.sheet) return;
        const host = this.uiManager?.playerContainer || this.uiManager?.overlay;
        if (!host) return;

        const sheet = document.createElement('div');
        sheet.className = 'tm-subtitle-sheet is-hidden';
        UISurfaceMachine.bindOverlayGuard(sheet, { stopMove: true });

        const panel = document.createElement('div');
        panel.className = 'tm-subtitle-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', text('subtitleTitle', '字幕'));

        panel.append(this._buildHeader(), this._buildBody());
        // 点击抽屉内面板以外的任意区域关闭（不依赖遮罩层，保持画面通透）
        sheet.addEventListener('click', (e) => {
            if (panel.contains(e.target)) return;
            this._closePanel();
        });

        sheet.append(panel);
        host.appendChild(sheet);

        this.sheet = sheet;
        this.panel = panel;
        this._renderList();
        this._syncSwitchState();
    }

    _buildHeader() {
        const head = document.createElement('div');
        head.className = 'tm-subtitle-head';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'tm-subtitle-head-title-wrap';
        const title = document.createElement('span');
        title.className = 'tm-subtitle-head-title';
        title.textContent = text('subtitleTitle', '字幕');
        titleWrap.append(title);
        if (this.avcode) {
            const code = document.createElement('span');
            code.className = 'tm-subtitle-head-code';
            code.textContent = this.avcode;
            titleWrap.append(code);
        }

        const actions = document.createElement('div');
        actions.className = 'tm-subtitle-head-actions';

        const switchLabel = document.createElement('span');
        switchLabel.className = 'tm-subtitle-show-label';
        switchLabel.textContent = text('subtitleShow', '显示字幕');

        const switchBtn = document.createElement('button');
        switchBtn.type = 'button';
        switchBtn.className = 'mp-s2-switch tm-subtitle-switch';
        switchBtn.setAttribute('role', 'switch');
        switchBtn.setAttribute('aria-checked', String(this.isEnabled));
        switchBtn.innerHTML = '<span class="mp-s2-switch-thumb"></span>';
        switchBtn.addEventListener('click', () => this._setEnabled(!this.isEnabled));
        this.switchEl = switchBtn;

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'tm-subtitle-close-btn';
        closeBtn.setAttribute('aria-label', text('subtitleClose', '关闭'));
        closeBtn.innerHTML = ICON_X_CLOSE;
        closeBtn.addEventListener('click', () => this._closePanel());

        actions.append(switchLabel, switchBtn, closeBtn);
        head.append(titleWrap, actions);
        return head;
    }

    _buildBody() {
        const body = document.createElement('div');
        body.className = 'tm-subtitle-body';
        body.append(this._buildToolbar(), this._buildAdjustPanel());

        const list = document.createElement('div');
        list.className = 'tm-subtitle-list';
        this.listEl = list;
        body.append(list, this._buildLyricsView());
        return body;
    }

    _buildToolbar() {
        const bar = document.createElement('div');
        bar.className = 'tm-subtitle-toolbar';

        const searchBtn = document.createElement('button');
        searchBtn.type = 'button';
        searchBtn.className = 'tm-subtitle-action-btn';
        searchBtn.dataset.action = 'search';
        searchBtn.innerHTML = `${ICON_REFRESH}<span>${text('subtitleSearch', '搜索')}</span>`;
        searchBtn.addEventListener('click', () => this._searchOnline());

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'tm-subtitle-action-btn';
        importBtn.dataset.action = 'import';
        importBtn.innerHTML = `${ICON_DOWNLOAD}<span>${text('subtitleImport', '导入')}</span>`;

        const adjustBtn = document.createElement('button');
        adjustBtn.type = 'button';
        adjustBtn.className = 'tm-subtitle-action-btn';
        adjustBtn.dataset.action = 'adjust';
        adjustBtn.innerHTML = `${ICON_SLIDERS}<span>${text('subtitleAdjust', '调节')}</span>`;
        this.adjustBtn = adjustBtn;
        adjustBtn.addEventListener('click', () => {
            const collapsed = this.adjustPanel?.classList.toggle('is-hidden');
            const adjusting = !collapsed;
            adjustBtn.classList.toggle('is-active', adjusting);
            // 调节时让出空间给参数行，隐藏字幕列表避免双层滚动干扰
            this.listEl?.classList.toggle('is-hidden', adjusting);
        });

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.srt,.ass,.ssa,.vtt';
        fileInput.className = 'tm-subtitle-file-input';
        fileInput.addEventListener('change', () => this._handleFileImport(fileInput));
        importBtn.addEventListener('click', () => fileInput.click());
        this.fileInput = fileInput;

        bar.append(searchBtn, importBtn, adjustBtn, fileInput);
        return bar;
    }

    /** 字幕调节面板：字号 / 上下偏移（全局） + 时间轴偏移（仅当前字幕） */
    _buildAdjustPanel() {
        const panel = document.createElement('div');
        panel.className = 'tm-subtitle-adjust is-hidden';
        this.adjustPanel = panel;

        panel.append(this._buildAdjustRow(text('subtitleFontSize', '字号'), this._buildFontSizeControl()));

        const offsetPct = Number(this.settings.subtitleVerticalOffset) || 0;
        const offsetStepper = this._buildStepper({
            value: offsetPct,
            min: -20,
            max: 60,
            step: 5,
            format: (v) => `${v > 0 ? '+' : ''}${v}%`,
            onChange: (v) => {
                this._updateSetting('subtitleVerticalOffset', v);
                this._applyVerticalOffset();
            }
        });
        panel.append(this._buildAdjustRow(text('subtitleVerticalOffset', '上下偏移'), offsetStepper.el));

        const timeSec = (Number(this.activeItem?.timeOffsetMs) || 0) / 1000;
        const timeStepper = this._buildStepper({
            value: timeSec,
            min: -10,
            max: 10,
            step: 0.2,
            format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}s`,
            onChange: (v) => this._applyTimelineOffset(v)
        });
        this.timeStepper = timeStepper;
        panel.append(
            this._buildAdjustRow(
                text('subtitleTimelineOffset', '时间轴偏移'),
                timeStepper.el,
                text('subtitleTimelineHint', '仅当前字幕')
            )
        );

        const autoBestSwitch = document.createElement('button');
        autoBestSwitch.type = 'button';
        autoBestSwitch.className = 'mp-s2-switch tm-subtitle-switch';
        autoBestSwitch.setAttribute('role', 'switch');
        autoBestSwitch.setAttribute('aria-checked', String(Boolean(this.settings.subtitleAutoBest)));
        autoBestSwitch.innerHTML = '<span class="mp-s2-switch-thumb"></span>';
        autoBestSwitch.addEventListener('click', () => this._toggleAutoBest());
        this.autoBestSwitchEl = autoBestSwitch;
        panel.append(
            this._buildAdjustRow(
                text('subtitleAutoBest', '自动选优'),
                autoBestSwitch,
                text('subtitleAutoBestHint', '自动加载并收藏'),
                { divider: true }
            )
        );

        panel.append(
            this._buildAdjustRow(
                text('subtitlePreferredLang', '偏好语言'),
                this._buildPreferredLangControl(),
                '',
                { stacked: true }
            )
        );

        panel.append(
            this._buildAdjustRow(
                text('subtitleDisplayMode', '双语显示'),
                this._buildDisplayModeControl(),
                '',
                { stacked: true }
            )
        );

        return panel;
    }

    _buildAdjustRow(labelText, controlEl, hintText = '', { divider = false, stacked = false } = {}) {
        const row = document.createElement('div');
        row.className = 'tm-subtitle-adjust-row';
        if (divider) row.classList.add('is-divider');
        if (stacked) row.classList.add('is-stacked');

        const label = document.createElement('div');
        label.className = 'tm-subtitle-adjust-label';
        label.textContent = labelText;
        if (hintText) {
            const hint = document.createElement('span');
            hint.className = 'tm-subtitle-adjust-hint';
            hint.textContent = hintText;
            label.append(hint);
        }

        row.append(label, controlEl);
        return row;
    }

    _buildDisplayModeControl() {
        const group = document.createElement('div');
        group.className = 'tm-subtitle-size-group tm-subtitle-lang-group';
        const labels = {
            primary: text('subtitleDisplayPrimary', '仅中文'),
            bilingual: text('subtitleDisplayBilingual', '双语'),
            secondary: text('subtitleDisplaySecondary', '原语')
        };
        DISPLAY_MODE_OPTIONS.forEach((mode) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tm-subtitle-size-btn';
            btn.dataset.displayMode = mode;
            btn.textContent = labels[mode];
            btn.addEventListener('click', () => this._applyDisplayMode(mode));
            group.appendChild(btn);
        });
        this.displayModeGroupEl = group;
        this._applyDisplayMode(this.settings.subtitleDisplayMode || 'primary', { persist: false });
        return group;
    }

    _applyDisplayMode(mode, { persist = true } = {}) {
        const next = DISPLAY_MODE_OPTIONS.includes(mode) ? mode : 'primary';
        this.displayModeGroupEl?.querySelectorAll('[data-display-mode]')?.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.displayMode === next);
        });
        if (persist) {
            this._updateSetting('subtitleDisplayMode', next);
            this._lastRenderedText = '__dirty__';
            this.renderAt(this.targetVideo?.currentTime || 0);
            if (this.lyricsView && !this.lyricsView.classList.contains('is-hidden')) {
                this._renderLyrics();
            }
        }
    }

    _buildPreferredLangControl() {
        const langGroup = document.createElement('div');
        langGroup.className = 'tm-subtitle-size-group tm-subtitle-lang-group';
        const labels = {
            auto: text('subtitleLangAuto', '自动'),
            zh: text('subtitleLangZh', '简中'),
            'zh-TW': text('subtitleLangZhTw', '繁中'),
            ja: text('subtitleLangJa', '日语'),
            en: text('subtitleLangEn', '英语'),
            ko: text('subtitleLangKo', '韩语')
        };
        PREFERRED_LANG_OPTIONS.forEach((lang) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tm-subtitle-size-btn';
            btn.dataset.lang = lang;
            btn.textContent = labels[lang];
            btn.addEventListener('click', () => this._applyPreferredLang(lang));
            langGroup.appendChild(btn);
        });
        this.langGroupEl = langGroup;
        this._applyPreferredLang(this.settings.subtitlePreferredLang, { persist: false });
        return langGroup;
    }

    _applyPreferredLang(lang, { persist = true } = {}) {
        const next = PREFERRED_LANG_OPTIONS.includes(lang) ? lang : 'auto';
        this.langGroupEl?.querySelectorAll('[data-lang]').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.lang === next);
        });
        if (persist) {
            this._updateSetting('subtitlePreferredLang', next);
            if (this.settings.subtitleAutoBest) {
                this._maybeAutoPickPreferred({ userAction: true });
            }
        }
    }

    _toggleAutoBest() {
        const next = !this.settings.subtitleAutoBest;
        this._updateSetting('subtitleAutoBest', next);
        this._syncSwitchState();
        if (next) {
            this._maybeAutoPickPreferred({ userAction: true });
        }
    }

    _buildFontSizeControl() {
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'tm-subtitle-size-group';
        const labels = {
            small: text('subtitleFontSmall', '小'),
            medium: text('subtitleFontMedium', '中'),
            large: text('subtitleFontLarge', '大')
        };
        FONT_SIZES.forEach((size) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tm-subtitle-size-btn';
            btn.dataset.size = size;
            btn.textContent = labels[size];
            btn.addEventListener('click', () => this._applyFontSize(size));
            sizeGroup.appendChild(btn);
        });
        this.sizeGroupEl = sizeGroup;
        this._applyFontSize(this.settings.subtitleFontSize, { persist: false });
        return sizeGroup;
    }

    /**
     * 数值步进器（−/＋ 各一档，避免滑块在薄抽屉里难以精确操作）
     * @returns {{el: HTMLElement, setValue: Function}}
     */
    _buildStepper({ value, min, max, step, format, onChange }) {
        const wrap = document.createElement('div');
        wrap.className = 'tm-subtitle-stepper';

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'tm-subtitle-stepper-btn';
        decBtn.setAttribute('aria-label', 'decrease');
        decBtn.textContent = '−';

        const valueEl = document.createElement('span');
        valueEl.className = 'tm-subtitle-stepper-value';

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'tm-subtitle-stepper-btn';
        incBtn.setAttribute('aria-label', 'increase');
        incBtn.textContent = '+';

        let current = Number(value) || 0;
        const render = () => {
            valueEl.textContent = format(current);
        };
        const set = (next, { silent = false } = {}) => {
            const clamped = Math.min(max, Math.max(min, Math.round(next / step) * step));
            const normalized = Math.round(clamped * 100) / 100;
            if (normalized === current) return;
            current = normalized;
            render();
            if (!silent) onChange(current);
        };

        decBtn.addEventListener('click', () => set(current - step));
        incBtn.addEventListener('click', () => set(current + step));
        render();
        wrap.append(decBtn, valueEl, incBtn);

        return { el: wrap, setValue: (next) => set(next, { silent: true }) };
    }

    /** 上下偏移：按「画面高度百分比」上移，正值抬高 */
    _applyVerticalOffset() {
        if (!this.overlayText) return;
        const pct = Number(this.settings.subtitleVerticalOffset) || 0;
        const layerHeight = this._layerHeight || this.overlayLayer?.getBoundingClientRect?.().height || 0;
        const lift = Math.round((layerHeight * pct) / 100);
        this.overlayText.style.transform = lift ? `translateY(${-lift}px)` : '';
    }

    /** 时间轴偏移：仅作用当前字幕轨，随条目持久化 */
    _applyTimelineOffset(seconds) {
        if (!this.activeItem) {
            Toast(text('subtitleEmptyHint', '搜索或导入字幕后即可显示'), 2000, 'info');
            return;
        }
        this.activeItem.timeOffsetMs = Math.round((Number(seconds) || 0) * 1000);
        this._lastRenderedText = '__dirty__';
        this.renderAt(this.targetVideo?.currentTime || 0);
        if (this.activeItem.favorite && this._findItem(this.activeItem.id)) {
            this._persist();
        }
    }

    /** 全量候选：已收藏 + 在线结果 + 当前播放轨（番号不符一律屏蔽） */
    _visibleRows() {
        const map = new Map();
        for (const item of this.bundle.items) {
            if (this._isRelevant(item)) map.set(item.id, item);
        }
        for (const candidate of this.onlineResults) {
            if (!this._isRelevant(candidate)) continue;
            if (!map.has(candidate.id)) map.set(candidate.id, candidate);
        }
        if (this.activeItem && !map.has(this.activeItem.id) && this._isRelevant(this.activeItem)) {
            map.set(this.activeItem.id, this.activeItem);
        }
        return Array.from(map.values()).sort((a, b) => {
            const tierDiff = getSubtitleFavoriteTier(b) - getSubtitleFavoriteTier(a);
            if (tierDiff) return tierDiff;
            const idDiff = (b.id === this.bundle.favoriteId ? 1 : 0) - (a.id === this.bundle.favoriteId ? 1 : 0);
            if (idDiff) return idDiff;
            return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        });
    }

    _renderList() {
        if (!this.listEl) return;
        const rows = this._visibleRows();

        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'tm-subtitle-hint';
            empty.textContent = this._searching
                ? text('subtitleSearching', '正在搜索…')
                : text('subtitleEmptyHint', '搜索或导入字幕后即可显示');
            this.listEl.replaceChildren(empty);
            return;
        }

        const nodes = rows.map((row) =>
            this._buildRow(row, {
                active: row.id === this.activeItem?.id,
                favorite: Boolean(row.favorite),
                downloaded: Boolean(row.content),
                busy: this._busyId === row.id
            })
        );
        this.listEl.replaceChildren(...nodes);
    }

    _buildRow(row, { active, favorite, downloaded, busy }) {
        const el = document.createElement('div');
        el.className = 'tm-subtitle-item';
        if (active) el.classList.add('is-active');
        if (favorite) el.classList.add('is-favorite');
        if (busy) el.classList.add('is-busy');
        if (!downloaded) el.classList.add('is-remote');

        const lang = document.createElement('span');
        lang.className = 'tm-subtitle-lang';
        lang.textContent = langName(row);

        const main = document.createElement('div');
        main.className = 'tm-subtitle-item-main';

        const title = document.createElement('div');
        title.className = 'tm-subtitle-item-title';
        title.textContent = row.title || row.langLabel || '';

        const meta = document.createElement('div');
        meta.className = 'tm-subtitle-item-meta';
        meta.textContent = row.providerLabel || text('subtitleFromLocal', '本地');
        if (row.trackLayout === 'bilingual') {
            const biBadge = document.createElement('span');
            biBadge.className = 'mp-sub-badge mp-sub-badge--bi';
            biBadge.textContent = text('subtitleBilingualTag', '双语');
            meta.append(' ', biBadge);
        }
        if (row.quality?.label) {
            const qBadge = document.createElement('span');
            const toneClass = row.quality.grade === 'high'
                ? 'mp-sub-badge--high'
                : (row.quality.grade === 'broken' ? 'mp-sub-badge--bad' : 'mp-sub-badge--warn');
            qBadge.className = `mp-sub-badge ${toneClass}`;
            qBadge.textContent = row.quality.label;
            meta.append(' ', qBadge);
        } else if (row.machineTranslated) {
            const mtBadge = document.createElement('span');
            mtBadge.className = 'mp-sub-badge mp-sub-badge--warn';
            mtBadge.textContent = row.originLang === 'en' && (row.lang === 'zh' || row.lang === 'zh-TW')
                ? '英转中'
                : '机翻';
            meta.append(' ', mtBadge);
        }

        main.append(title, meta);

        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'tm-subtitle-star';
        if (favorite) star.classList.add('is-on');
        star.title = text('subtitleFavorite', '收藏字幕');
        star.setAttribute('aria-label', text('subtitleFavorite', '收藏字幕'));
        star.innerHTML = favorite ? ICON_STAR_FILLED : ICON_STAR;
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleFavorite(row);
        });

        const timelineBtn = document.createElement('button');
        timelineBtn.type = 'button';
        timelineBtn.className = 'tm-subtitle-star tm-subtitle-timeline-btn';
        timelineBtn.title = text('subtitleLyrics', '时间轴');
        timelineBtn.setAttribute('aria-label', text('subtitleLyrics', '时间轴'));
        timelineBtn.innerHTML = ICON_LYRICS;
        timelineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openLyrics(row);
        });

        el.append(lang, main, star, timelineBtn);
        el.addEventListener('click', () => {
            if (el.classList.contains('is-busy')) return;
            if (Date.now() < this._suppressRowClickUntil) return;
            this._activateRow(row);
        });
        this._bindSwipeToLyrics(el, row);
        return el;
    }

    /** 歌词/时间轴视图：剧情看点锚点 + 逐条字幕微高亮 + 点击跳转 */
    _buildLyricsView() {
        const view = document.createElement('div');
        view.className = 'tm-subtitle-lyrics is-hidden';

        const head = document.createElement('div');
        head.className = 'tm-subtitle-lyrics-head';

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'tm-subtitle-lyrics-back';
        backBtn.textContent = `‹ ${text('subtitleBack', '返回')}`;
        backBtn.addEventListener('click', () => this._closeLyrics());

        const title = document.createElement('span');
        title.className = 'tm-subtitle-lyrics-title';

        const filterBtn = document.createElement('button');
        filterBtn.type = 'button';
        filterBtn.className = 'mp-sub-filter-btn is-hidden';
        filterBtn.textContent = text('subtitlePlotFilter', '看点');
        filterBtn.addEventListener('click', () => this._toggleLyricsHighlightFilter());

        const aiBtn = document.createElement('button');
        aiBtn.type = 'button';
        aiBtn.className = 'mp-sub-ai-btn is-hidden';
        aiBtn.innerHTML = `${ICON_SPARKLES}<span>${text('subtitleAiChapters', 'AI 分幕')}</span>`;
        aiBtn.addEventListener('click', () => this._runAiChapters());

        const aiRefreshBtn = document.createElement('button');
        aiRefreshBtn.type = 'button';
        aiRefreshBtn.className = 'mp-sub-ai-refresh-btn is-hidden';
        aiRefreshBtn.innerHTML = ICON_REFRESH;
        aiRefreshBtn.title = '强制重新分幕（忽略缓存）';
        aiRefreshBtn.setAttribute('aria-label', '强制重新分幕');
        aiRefreshBtn.addEventListener('click', () => this._runAiChapters({ forceRefresh: true }));

        const count = document.createElement('span');
        count.className = 'tm-subtitle-lyrics-count';

        head.append(backBtn, title, filterBtn, aiBtn, aiRefreshBtn, count);

        const anchorsBar = document.createElement('div');
        anchorsBar.className = 'mp-sub-anchors-bar is-hidden';

        const scroll = document.createElement('div');
        scroll.className = 'tm-subtitle-lyrics-scroll';
        scroll.addEventListener('scroll', () => this._onLyricsScroll(), { passive: true });

        const followBtn = document.createElement('button');
        followBtn.type = 'button';
        followBtn.className = 'tm-subtitle-lyrics-follow is-hidden';
        followBtn.textContent = text('subtitleFollow', '回到当前');
        followBtn.addEventListener('click', () => {
            this._lyricsFollow = true;
            this._anchorIndex = -1;
            followBtn.classList.add('is-hidden');
            // 静音间隙同样回位到最近的字幕行，而不是纹丝不动
            this._syncLyricHighlight({ force: true });
            this._centerLyricRow(this._anchorIndex);
        });

        view.append(head, anchorsBar, scroll, followBtn);
        this.lyricsView = view;
        this.lyricsScroll = scroll;
        this.lyricsFollowBtn = followBtn;
        this.lyricsTitleEl = title;
        this.lyricsCountEl = count;
        this.lyricsAnchorsBar = anchorsBar;
        this.lyricsFilterBtn = filterBtn;
        this.lyricsAiBtn = aiBtn;
        this.lyricsAiRefreshBtn = aiRefreshBtn;
        return view;
    }

    /** 列表行左滑进入时间轴（不拦截原生纵向滚动） */
    _bindSwipeToLyrics(el, row) {
        let startX = 0;
        let startY = 0;
        let tracking = false;
        el.addEventListener('touchstart', (e) => {
            const touch = e.touches?.[0];
            if (!touch) return;
            startX = touch.clientX;
            startY = touch.clientY;
            tracking = true;
        }, { passive: true });
        el.addEventListener('touchend', (e) => {
            if (!tracking) return;
            tracking = false;
            const touch = e.changedTouches?.[0];
            if (!touch) return;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (dx < -56 && Math.abs(dy) < 36) {
                this._suppressRowClickUntil = Date.now() + 400;
                this._openLyrics(row);
            }
        }, { passive: true });
    }

    async _openLyrics(row) {
        if (!row || this._busyId) return;
        if (row.id !== this.activeItem?.id) {
            this._busyId = row.id;
            this._renderList();
            try {
                const stored = this._findItem(row.id);
                const item = stored || (await this._downloadCandidate(row));
                if (!item) return;
                await this._applyItem(item, { silent: true });
            } finally {
                this._busyId = '';
                this._renderList();
            }
        }
        if (!this.cues.length) {
            Toast(text('subtitleEmptyHint', '搜索或导入字幕后即可显示'), 2200, 'info');
            return;
        }
        this.adjustPanel?.classList.add('is-hidden');
        this.adjustBtn?.classList.remove('is-active');
        this._lyricsFollow = true;
        this._lyricIndex = -1;
        this._anchorIndex = -1;
        this._visitedCues = new Set();
        this._lyricsOnlyHighlights = false;
        this._renderLyrics();
        this._loadCachedAiChapters();
        this.listEl?.classList.add('is-hidden');
        this.lyricsView.classList.remove('is-hidden');
        this._syncLyricHighlight({ force: true });
    }

    _closeLyrics() {
        this.lyricsView?.classList.add('is-hidden');
        this.listEl?.classList.remove('is-hidden');
        this._lyricsFollow = false;
        this._lyricIndex = -1;
    }

    _toggleLyricsHighlightFilter() {
        this._lyricsOnlyHighlights = !this._lyricsOnlyHighlights;
        this.lyricsFilterBtn?.classList.toggle('is-active', this._lyricsOnlyHighlights);
        const highlights = this._plotAnalysis?.highlightCueIndices;
        const anchorIndices = new Set(
            (this._aiChapters?.length ? this._aiChapters : this._plotAnalysis?.anchors || [])
                .map((a) => a.cueIndex)
                .filter((i) => Number.isInteger(i) && i >= 0)
        );
        this.lyricsRows.forEach((rowEl, idx) => {
            if (!this._lyricsOnlyHighlights) {
                rowEl.classList.remove('is-hidden');
                return;
            }
            const keep = Boolean(highlights?.has(idx) || anchorIndices.has(idx));
            rowEl.classList.toggle('is-hidden', !keep);
        });
    }

    _renderAnchorsBar() {
        const bar = this.lyricsAnchorsBar;
        if (!bar) return;
        const aiList = Array.isArray(this._aiChapters) ? this._aiChapters : [];
        const localList = this._plotAnalysis?.available ? this._plotAnalysis.anchors : [];
        const activeList = aiList.length
            ? aiList.map((ch) => ({
                  start: Number(ch.seconds) || 0,
                  cueIndex: this._resolveAnchorIndex(Number(ch.seconds) || 0),
                  tag: ch.tag || '看点',
                  preview: ch.headline || '',
                  source: 'ai'
              }))
            : localList;

        if (!activeList.length) {
            bar.classList.add('is-hidden');
            bar.replaceChildren();
            return;
        }

        const pills = activeList.map((anchor) => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `mp-sub-anchor-pill${anchor.source === 'ai' ? ' is-ai' : ''}`;
            if (anchor.preview) pill.title = anchor.preview;

            const ts = document.createElement('span');
            ts.className = 'mp-sub-anchor-ts';
            ts.textContent = formatStamp(anchor.start);

            const tag = document.createElement('span');
            tag.className = 'mp-sub-anchor-tag';
            tag.textContent = anchor.tag || text('subtitlePlotFilter', '看点');

            pill.append(ts, tag);
            pill.addEventListener('click', () => {
                const idx = Number.isInteger(anchor.cueIndex) && anchor.cueIndex >= 0
                    ? anchor.cueIndex
                    : this._resolveAnchorIndex(anchor.start);
                if (idx >= 0 && this.cues[idx]) {
                    this._seekToCue(idx);
                } else if (this.targetVideo) {
                    this.playerCore?.cancelInitialSeekGuard?.();
                    this.targetVideo.currentTime = Math.max(0, anchor.start);
                }
            });
            return pill;
        });

        bar.replaceChildren(...pills);
        bar.classList.remove('is-hidden');
        this.lyricsAiRefreshBtn?.classList.toggle(
            'is-hidden',
            !(LlmService.isFeatureEnabled('featureSubChapters') && aiList.length > 0)
        );
    }

    async _loadCachedAiChapters() {
        if (!this.avcode || !this.cues.length || !LlmService.isFeatureEnabled('featureSubChapters')) return;
        const targetCode = this.avcode;
        try {
            const metadata = AvMetadataService.getCachedOrDom(targetCode);
            const cached = await getCachedSubtitleChapters({
                avcode: targetCode,
                cues: this.cues,
                subtitleQuality: this.getSubtitleQuality(),
                metadata
            });
            if (this.avcode !== targetCode || !cached?.hit || !Array.isArray(cached.chapters)) return;
            this._aiChapters = cached.chapters;
            this._renderAnchorsBar();
            this._syncAnchorCueRows();
        } catch (_) {}
    }

    /** 获取当前已挂载字幕的质量评估结果 */
    getSubtitleQuality() {
        if (!this.cues.length) return null;
        if (this.activeItem?.quality) return this.activeItem.quality;
        const dur = Number(this.targetVideo?.duration) || 0;
        const quality = scoreSubtitleQuality(this.cues, { videoDurationSec: dur, langInfo: this.activeItem?.langInfo || null });
        if (this.activeItem) this.activeItem.quality = quality;
        return quality;
    }

    async _runAiChapters({ forceRefresh = false } = {}) {
        if (this._aiAnalyzing || !this.cues.length) return;
        if (!LlmService.isFeatureEnabled('featureSubChapters')) {
            Toast('请先在设置中启用 AI 服务与字幕分幕', 2400, 'info');
            return;
        }
        this._aiAnalyzing = true;
        this.lyricsAiBtn?.classList.add('is-loading');
        if (this.lyricsAiRefreshBtn) this.lyricsAiRefreshBtn.disabled = true;
        try {
            const metadata = await AvMetadataService.getMetadata(this.avcode).catch(() => null);
            const altTrack = this.getAltTrackForLlm();
            const res = await analyzeSubtitleChaptersWithLlm({
                avcode: this.avcode,
                cues: this.cues,
                subtitleQuality: this.getSubtitleQuality(),
                altCues: altTrack?.cues || null,
                altTitle: altTrack?.title || '',
                title: this.activeItem?.title || '',
                metadata,
                forceRefresh
            });
            if (res && res.ok && Array.isArray(res.chapters) && res.chapters.length) {
                this._aiChapters = res.chapters;
                this._renderAnchorsBar();
                this._syncAnchorCueRows();
                Toast(res.fromCache ? '已读取 AI 分幕缓存' : `已提炼 ${res.chapters.length} 个剧情分幕`, 2000, 'success');
            } else {
                Toast(res?.error || 'AI 分幕未返回结果，已保留本地看点', 2600, 'info');
            }
        } catch (err) {
            Toast(LlmService.redactSecrets(err?.message || 'AI 分析失败'), 2400, 'error');
        } finally {
            this._aiAnalyzing = false;
            this.lyricsAiBtn?.classList.remove('is-loading');
            if (this.lyricsAiRefreshBtn) this.lyricsAiRefreshBtn.disabled = false;
        }
    }

    refreshAiAvailability() {
        const enabled = LlmService.isFeatureEnabled('featureSubChapters');
        this.lyricsAiBtn?.classList.toggle('is-hidden', !enabled);
        this.lyricsAiRefreshBtn?.classList.toggle('is-hidden', !(enabled && this._aiChapters?.length));
        if (enabled && this.cues.length && !this._aiChapters?.length) {
            this._loadCachedAiChapters();
        }
    }

    _syncAnchorCueRows() {
        const anchorIndices = new Set(
            (this._aiChapters?.length ? this._aiChapters : this._plotAnalysis?.anchors || [])
                .map((a) => (Number.isInteger(a.cueIndex) ? a.cueIndex : this._resolveAnchorIndex(Number(a.seconds) || 0)))
                .filter((i) => Number.isInteger(i) && i >= 0)
        );
        this.lyricsRows.forEach((rowEl, idx) => {
            rowEl.classList.toggle('is-anchor-cue', anchorIndices.has(idx));
        });
    }

    _renderLyricRowText(txtEl, displayText, rawRanges) {
        if (!rawRanges?.length || typeof document.createTextNode !== 'function') {
            txtEl.textContent = displayText;
            return;
        }
        const cueRaw = String(this.cues[Number(txtEl?.dataset?.cueIndex)]?.text || '');
        const ranges = displayText === cueRaw
            ? rawRanges
            : findHighlightRanges(displayText, rawRanges.map((r) => ({ term: r.term, kind: r.kind })));
        if (!ranges.length) {
            txtEl.textContent = displayText;
            return;
        }
        const frag = buildHighlightedCueFragment(displayText, ranges, document);
        if (Array.isArray(frag)) txtEl.replaceChildren(...frag);
        else txtEl.replaceChildren(frag);
    }

    _renderLyrics() {
        if (!this.lyricsScroll) return;
        const item = this.activeItem;
        if (this.lyricsTitleEl) {
            this.lyricsTitleEl.textContent = `${langName(item || {})} · ${item?.providerLabel || ''}`.trim();
        }
        if (this.lyricsCountEl) this.lyricsCountEl.textContent = String(this.cues.length);

        const plotAnalysis = analyzeSubtitlePlot(this.cues, {
            langInfo: item?.langInfo,
            quality: item?.quality
        });
        this._plotAnalysis = plotAnalysis;
        const hasHighlights = Boolean(plotAnalysis.available && plotAnalysis.highlightCueIndices?.size);

        this.lyricsFilterBtn?.classList.toggle('is-hidden', !hasHighlights);
        this.lyricsFilterBtn?.classList.toggle('is-active', Boolean(this._lyricsOnlyHighlights && hasHighlights));
        this.lyricsAiBtn?.classList.toggle('is-hidden', !LlmService.isFeatureEnabled('featureSubChapters'));

        const displayMode = this.settings.subtitleDisplayMode || 'primary';
        const anchorIndices = new Set(
            (this._aiChapters?.length ? this._aiChapters : plotAnalysis.anchors || [])
                .map((a) => (Number.isInteger(a.cueIndex) ? a.cueIndex : this._resolveAnchorIndex(Number(a.seconds) || 0)))
                .filter((i) => Number.isInteger(i) && i >= 0)
        );

        const rows = [];
        this.cues.forEach((cue, index) => {
            const rowEl = document.createElement('button');
            rowEl.type = 'button';
            rowEl.className = 'tm-subtitle-lyric-row';
            rowEl.dataset.index = String(index);
            if (anchorIndices.has(index)) rowEl.classList.add('is-anchor-cue');

            const stamp = document.createElement('span');
            stamp.className = 'tm-subtitle-lyric-ts';
            stamp.textContent = formatStamp(cue.start);

            const txt = document.createElement('span');
            txt.className = 'tm-subtitle-lyric-text';
            txt.dataset.cueIndex = String(index);
            const displayRaw = formatCueForDisplayMode(cue, displayMode).primary || cue.text;
            const displayText = displayRaw.replace(/\n/g, ' ');
            const rawRanges = plotAnalysis.available ? plotAnalysis.cueHighlights.get(index) : null;
            this._renderLyricRowText(txt, displayText, rawRanges);

            const mark = document.createElement('span');
            mark.className = 'tm-subtitle-lyric-mark';
            mark.textContent = text('subtitleVisited', '已跳转');
            if (this._visitedCues.has(index)) mark.classList.add('is-visible');

            if (this._lyricsOnlyHighlights && hasHighlights && !plotAnalysis.highlightCueIndices.has(index) && !anchorIndices.has(index)) {
                rowEl.classList.add('is-hidden');
            }

            rowEl.append(stamp, txt, mark);
            rowEl.addEventListener('click', () => this._seekToCue(index));
            rows.push(rowEl);
        });
        this.lyricsRows = rows;
        this.lyricsScroll.replaceChildren(...rows);
        this.lyricsScroll.scrollTop = 0;
        this._renderAnchorsBar();
    }

    /** 点击歌词行跳转到对应播放进度（补偿当前字幕的时间轴偏移） */
    _seekToCue(index) {
        const cue = this.cues[index];
        if (!cue) return;
        this.playerCore?.cancelInitialSeekGuard?.();
        const offsetSec = (Number(this.activeItem?.timeOffsetMs) || 0) / 1000;
        const target = Math.max(0, cue.start + offsetSec + 0.02);
        if (this.targetVideo) this.targetVideo.currentTime = target;
        window.navigator?.vibrate?.(8);
        this._markCueVisited(index);
        this._lyricsFollow = true;
        this.lyricsFollowBtn?.classList.add('is-hidden');
        this._lyricIndex = -1;
        this._syncLyricHighlight({ force: true });
    }

    /** 标记该行已被点击跳转过（会话级，不落盘） */
    _markCueVisited(index) {
        if (index < 0) return;
        this._visitedCues.add(index);
        const rowEl = this.lyricsRows[index];
        rowEl?.querySelector?.('.tm-subtitle-lyric-mark')?.classList.add('is-visible');
        const mark = rowEl?.children?.[2];
        if (mark && mark.classList) mark.classList.add('is-visible');
    }

    _onLyricsScroll() {
        if (Date.now() < this._lyricsAutoScrollUntil) return;
        if (!this._lyricsFollow) return;
        this._lyricsFollow = false;
        this.lyricsFollowBtn?.classList.remove('is-hidden');
    }

    /**
     * 在当前时刻附近寻找「锚点行」：优先当前激活行；
     * 处于静音间隙时取前后两条字幕中距离更近的一条（典型歌词播放器行为）。
     */
    _resolveAnchorIndex(time) {
        if (!this.cues.length) return -1;
        let lo = 0;
        let hi = this.cues.length - 1;
        let prev = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (this.cues[mid].start <= time) {
                prev = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        if (prev < 0) return 0;
        const prevCue = this.cues[prev];
        const nextCue = this.cues[prev + 1];
        if (!nextCue) return prev;
        if (time <= prevCue.end + CUE_TAIL_TOLERANCE) return prev;
        const gapAfterPrev = time - prevCue.end;
        const gapBeforeNext = nextCue.start - time;
        return gapBeforeNext < gapAfterPrev ? prev + 1 : prev;
    }

    _syncLyricHighlight({ force = false } = {}) {
        if (!this.lyricsView || this.lyricsView.classList.contains('is-hidden') || !this.cues.length) return;
        const offsetSec = (Number(this.activeItem?.timeOffsetMs) || 0) / 1000;
        const time = (Number(this.targetVideo?.currentTime) || 0) - offsetSec;

        const anchorIndex = this._resolveAnchorIndex(time);

        // 跟随态：即便此刻没有字幕（静音间隙），也滚动到最近的字幕行，保持「回到当前」始终有意义
        if (this._lyricsFollow && (force || anchorIndex !== this._anchorIndex)) {
            this._anchorIndex = anchorIndex;
            this._centerLyricRow(anchorIndex);
        }

        let idx = anchorIndex;
        // 命中 start 不等于处于该行区间：间隙内不点亮活动态，避免底色长期残留
        if (idx >= 0 && (time < this.cues[idx].start - CUE_LEAD_TOLERANCE || time > this.cues[idx].end + CUE_TAIL_TOLERANCE)) {
            idx = -1;
        }

        if (!force && idx === this._lyricIndex) return;

        this.lyricsRows[this._lyricIndex]?.classList.remove('is-current');
        this._lyricIndex = idx;
        if (idx < 0) return;
        this.lyricsRows[idx]?.classList.add('is-current');
    }

    _centerLyricRow(index) {
        const rowEl = this.lyricsRows[index];
        if (!rowEl) return;
        this._lyricsAutoScrollUntil = Date.now() + 480;
        if (typeof rowEl.scrollIntoView === 'function') {
            rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    async _activateRow(row) {
        if (this._busyId) return;
        const stored = this._findItem(row.id);
        if (stored) {
            await this._applyItem(stored);
            return;
        }
        this._busyId = row.id;
        this._renderList();
        try {
            const item = await this._downloadCandidate(row);
            if (item) await this._applyItem(item);
        } finally {
            this._busyId = '';
            this._renderList();
        }
    }

    /**
     * 收藏即持久化：收藏 → 下载正文 + 优先展示 + 落盘 + 写入 WebDAV
     * 取消收藏 → 删除本地与远端副本
     */
    async _toggleFavorite(row) {
        if (this._busyId) return;
        this._busyId = row.id;
        this._renderList();
        try {
            if (row.favorite) {
                await this._unfavorite(row);
                return;
            }

            let item = this._findItem(row.id);
            if (!item) item = await this._downloadCandidate(row);
            else if (!item.content) item = await this._ensureContent(item);
            if (!item) throw new Error('SUBTITLE_UNAVAILABLE');

            item.favorite = true;
            item.autoSaved = false;
            item.favoriteSource = 'manual';
            this.bundle.favoriteId = item.id;
            this.bundle.items = [item, ...this.bundle.items.filter((entry) => entry.id !== item.id)];
            await this._persist({ dirtyItem: item });
            Toast(text('subtitleSaved', '已收藏并同步'), 1800, 'success');

            if (!this.activeItem || (this.isEnabled && this.activeItem.autoSaved)) {
                await this._applyItem(item, { silent: true });
            }
        } catch (err) {
            console.warn('[SubtitleManager] 收藏失败:', err?.message);
            Toast(text('subtitleSaveFailed', '同步失败，已存至本地'), 2400, 'error');
        } finally {
            this._busyId = '';
            this._renderList();
            this._updateButtonState();
        }
    }

    async _unfavorite(row) {
        const item = this._findItem(row.id);
        this.bundle.items = this.bundle.items.filter((entry) => entry.id !== row.id);
        if (this.bundle.favoriteId === row.id) this.bundle.favoriteId = '';
        if (this.activeItem?.id === row.id) {
            this.activeItem = null;
            this.cues = [];
            this.bundle.activeId = '';
            this._stopRenderLoop();
            this._setOverlayText('');
        }
        await this._persist();
        if (item?.file) await SubtitleRepository.deleteRemoteItem(item, this.avcode);
        Toast(text('subtitleDeleted', '已删除字幕'), 1800, 'info');
    }

    async _handleFileImport(input) {
        const file = input?.files?.[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const { text: content } = decodeSubtitleBuffer(buffer);
            const parsed = parseSubtitles(content, file.name);
            if (!parsed.cues.length) throw new Error('EMPTY');
            const item = {
                id: `local:${file.name}:${Date.now()}`,
                provider: 'local',
                providerLabel: text('subtitleFromLocal', '本地导入'),
                title: file.name.replace(/\.(srt|ass|ssa|vtt)$/i, ''),
                lang: 'zh',
                langLabel: '',
                format: parsed.format,
                content,
                addedAt: Date.now(),
                rating: 100
            };
            this._inspectTrackMetadata(item, parsed);
            await this._applyItem(item);
        } catch (err) {
            console.warn('[SubtitleManager] 导入失败:', err?.message);
            Toast(text('subtitleImportFailed', '导入失败，请检查字幕文件'), 2600, 'error');
        } finally {
            if (input) input.value = '';
        }
    }

    // ---------------------------------------------------------------- 在线检索

    async _searchOnline() {
        if (this._searchPromise) return this._searchPromise;
        if (!this.settings.betaMode) {
            Toast(text('subtitleNeedBeta', '开启实验功能后可在线搜索字幕'), 2800, 'info');
            return;
        }
        if (!this.avcode) {
            Toast(text('subtitleNoCode', '未识别影片番号'), 2500, 'error');
            return;
        }

        const run = (async () => {
            this._searching = true;
            this._renderList();
            const searchStartedAt = Date.now();
            try {
                const { candidates, errors } = await this.engine.search(this.avcode);
                const known = new Set(this.bundle.items.map((item) => item.id));
                this.onlineResults = candidates.filter(
                    (candidate) => !known.has(candidate.id) && this._isRelevant(candidate)
                );
                if (this.avcode && AiDebugLogger.isEnabled()) {
                    const langsSummary = {};
                    this.onlineResults.forEach((c) => {
                        const k = c.lang || 'unknown';
                        langsSummary[k] = (langsSummary[k] || 0) + 1;
                    });
                    AiDebugLogger.recordSubtitleState(this.avcode, 'searchOnline', {
                        durationMs: Date.now() - searchStartedAt,
                        rawCandidatesCount: candidates.length,
                        relevantCount: this.onlineResults.length,
                        langsSummary,
                        errorsCount: Array.isArray(errors) ? errors.length : 0
                    });
                }
                if (!this.onlineResults.length) {
                    Toast(
                        errors.length
                            ? text('subtitleSearchFailed', '搜索失败，请稍后重试')
                            : text('subtitleSearchEmpty', '未找到字幕，可导入本地文件'),
                        2600,
                        'info'
                    );
                }
            } catch (err) {
                console.warn('[SubtitleManager] 搜索失败:', err?.message);
                if (this.avcode && AiDebugLogger.isEnabled()) {
                    AiDebugLogger.recordSubtitleState(this.avcode, 'searchOnline', {
                        durationMs: Date.now() - searchStartedAt,
                        error: err?.message || 'SEARCH_FAILED'
                    });
                }
                Toast(text('subtitleSearchFailed', '搜索失败，请稍后重试'), 2600, 'error');
            } finally {
                this._searching = false;
                this._renderList();
            }
            await this._maybeAutoPickPreferred({ fromSearch: true });
        })().finally(() => {
            if (this._searchPromise === run) this._searchPromise = null;
        });

        this._searchPromise = run;
        return run;
    }

    /** 若当前主字幕含机翻或 Whisper 噪声且存在第二条不同内容候选轨，向 AI 暴露交叉参考副轨 */
    getAltTrackForLlm() {
        const alt = this._altTrackForLlm;
        if (!alt?.cues?.length) return null;
        const primaryQuality = this.activeItem?.quality || null;
        const primaryNoisy = Boolean(
            this.activeItem?.machineTranslated ||
            (primaryQuality && (primaryQuality.sqi < 85 || primaryQuality.reasons?.length > 0))
        );
        return primaryNoisy ? alt : null;
    }

    _hasSavedFavorite() {
        const items = this.bundle.items || [];
        if (items.some((item) => isManualFavoriteSubtitle(item))) return true;
        if (this.bundle.favoriteId) {
            const favItem = items.find((item) => item.id === this.bundle.favoriteId);
            if (favItem && (!favItem.autoSaved || (favItem.quality?.sqi ?? 100) >= 75)) {
                return true;
            }
        }
        return items.some((item) => Boolean(item.favorite) && (!item.autoSaved || (item.quality?.sqi ?? 100) >= 75));
    }

    _maybeAutoPickPreferred(options = {}) {
        if (this._autoPickPromise) return this._autoPickPromise;
        const promise = this._runAutoPickPreferred(options).finally(() => {
            if (this._autoPickPromise === promise) this._autoPickPromise = null;
        });
        this._autoPickPromise = promise;
        return promise;
    }

    async _runAutoPickPreferred({ userAction = false, fromSearch = false } = {}) {
        if (!this.settings.subtitleAutoBest || !this.avcode) return false;
        if (this._hasSavedFavorite()) return false;

        const targetCode = this.avcode;
        const preferredLang = resolvePreferredSubtitleLang(this.settings.subtitlePreferredLang, I18n.userLang);
        const collectPool = () => {
            const pool = [...this.bundle.items, ...this.onlineResults].filter(
                (entry) => this._isRelevant(entry) && !this._autoFailedIds.has(entry.id)
            );
            return Array.from(new Map(pool.map((entry) => [entry.id, entry])).values());
        };
        const collectRanked = () => rankPreferredCandidates(collectPool(), preferredLang);

        let ranked = collectRanked();
        if (!ranked.length && !fromSearch && !this._searching && !this._autoSearchedCodes.has(targetCode)) {
            if (this.settings.betaMode) {
                this._autoSearchedCodes.add(targetCode);
                try {
                    const { candidates } = await this.engine.search(targetCode);
                    if (this.avcode !== targetCode) return false;
                    const known = new Set(this.bundle.items.map((item) => item.id));
                    this.onlineResults = candidates.filter(
                        (candidate) => !known.has(candidate.id) && this._isRelevant(candidate)
                    );
                    this._renderList();
                    ranked = collectRanked();
                } catch (err) {
                    console.warn('[SubtitleManager] 自动选优搜索失败:', err?.message);
                }
            } else if (userAction && !this.bundle.items.length && !this.onlineResults.length) {
                Toast(text('subtitleNeedBeta', '开启实验功能后可在线搜索字幕'), 2800, 'info');
            }
        }

        let usingAmbiguousProbe = false;
        if (!ranked.length) {
            ranked = collectAmbiguousFallbackCandidates(collectPool(), preferredLang);
            usingAmbiguousProbe = ranked.length > 0;
        }
        if (!ranked.length) return false;

        const pickStartedAt = Date.now();
        const MAX_EVAL = 5;
        const candidatesToFetch = ranked.slice(0, MAX_EVAL);
        const evaluated = [];
        const seenFingerprints = new Set();

        const fetchOne = async (candidate) => {
            if (this.avcode !== targetCode || !this.settings.subtitleAutoBest || this._hasSavedFavorite()) {
                return null;
            }
            const stored = this._findItem(candidate.id);
            const rawItem = stored
                ? { ...(await this._ensureContent(stored)) }
                : await this._downloadCandidate(candidate, { silent: true });
            if (this.avcode !== targetCode) return null;
            if (!rawItem?.content) {
                this._autoFailedIds.add(candidate.id);
                return null;
            }
            const rawParsed = parseSubtitles(rawItem.content, rawItem.format || '');
            if (!rawParsed?.cues?.length) {
                this._autoFailedIds.add(candidate.id);
                return null;
            }
            const { langInfo, quality } = this._inspectTrackMetadata(rawItem, rawParsed);
            if (usingAmbiguousProbe) {
                const actualLang = normalizeSubtitleLang(langInfo?.detectedLang || langInfo?.lang || rawItem.lang);
                const matchesZh = actualLang === 'zh' || actualLang === 'zh-TW' || langInfo?.trackLayout === 'bilingual';
                if (!matchesZh) {
                    this._autoFailedIds.add(candidate.id);
                    return null;
                }
            }
            return { candidate, item: rawItem, parsed: rawParsed, langInfo, quality };
        };

        const settled = await Promise.allSettled(candidatesToFetch.map((c) => fetchOne(c)));
        if (this.avcode !== targetCode || !this.settings.subtitleAutoBest || this._hasSavedFavorite()) {
            return false;
        }
        for (const r of settled) {
            if (r.status !== 'fulfilled' || !r.value) continue;
            const fp = computeTrackContentFingerprint(r.value.parsed.cues);
            if (seenFingerprints.has(fp)) continue;
            seenFingerprints.add(fp);
            evaluated.push(r.value);
        }

        const picked = selectBestQualityCandidate(evaluated) || evaluated[0] || null;
        const altEntry = evaluated.find((ev) => ev !== picked && (ev.quality?.grade !== 'broken')) || null;
        this._altTrackForLlm = altEntry
            ? { id: altEntry.item?.id || '', title: altEntry.item?.title || '', sqi: altEntry.quality?.sqi ?? 0, cues: altEntry.parsed.cues }
            : null;

        if (AiDebugLogger.isEnabled()) {
            AiDebugLogger.recordSubtitleState(targetCode, 'autoPick', {
                durationMs: Date.now() - pickStartedAt,
                preferredLang,
                usingAmbiguousProbe,
                rankedCount: ranked.length,
                earlyBreak: false,
                pickedOk: Boolean(picked),
                altTrackId: this._altTrackForLlm?.id || '',
                evaluated: evaluated.map((ev) => ({
                    id: ev.item?.id || ev.candidate?.id || '',
                    source: ev.item?.source || '',
                    declaredLang: ev.candidate?.lang || '',
                    detectedLang: ev.langInfo?.detectedLang || ev.langInfo?.lang || '',
                    machineTranslated: Boolean(ev.item?.machineTranslated),
                    mtDirection: ev.langInfo?.mtDirection || ev.item?.mtDirection || '',
                    isCorrupted: Boolean(ev.langInfo?.isCorrupted),
                    sqi: ev.quality?.sqi ?? null,
                    reasons: ev.quality?.reasons || [],
                    cueCount: ev.parsed?.cues?.length ?? 0
                })),
                chosenId: picked?.item?.id || ''
            });
        }
        if (!picked || this.avcode !== targetCode) return false;

        const { item, parsed, converted } = applyPreferredChineseConversion(picked.item, picked.parsed, preferredLang);
        item.format = parsed.format;
        item.favorite = true;
        item.autoSaved = true;
        item.favoriteSource = 'auto';
        this.bundle.favoriteId = item.id;
        this.bundle.items = [item, ...this.bundle.items.filter((entry) => entry.id !== item.id)];
        await this._persist({ dirtyItem: item });
        if (this.avcode !== targetCode) return false;

        if (this.isEnabled && (!this.activeItem || this.activeItem.autoSaved)) {
            await this._applyItem(item, { silent: true });
        } else {
            this._renderList();
            this._updateButtonState();
        }
        Toast(
            converted
                ? text('subtitleAutoSavedConverted', '已自动加载并完成繁简转换')
                : text('subtitleAutoSaved', '已自动加载并收藏偏好字幕'),
            2000,
            'success'
        );
        return true;
    }

    async _downloadCandidate(candidate, { silent = false } = {}) {
        try {
            const downloaded = await this.engine.download(candidate);
            const { content, format } = downloaded;
            const item = {
                ...candidate,
                content,
                format,
                addedAt: Date.now(),
                favorite: Boolean(candidate.favorite)
            };
            if (downloaded.cues?.length) {
                this._inspectTrackMetadata(item, { format, cues: downloaded.cues });
            }
            this.onlineResults = this.onlineResults.filter((entry) => entry.id !== item.id);
            return item;
        } catch (err) {
            console.warn('[SubtitleManager] 下载失败:', err?.message);
            if (!silent) Toast(text('subtitleDownloadFailed', '下载失败，请换个来源试试'), 2600, 'error');
            return null;
        }
    }

    // ---------------------------------------------------------------- 面板开合

    _togglePanel() {
        if (this.sheet?.classList.contains('is-hidden') || !this.sheet) this._openPanel();
        else this._closePanel();
    }

    _openPanel() {
        this._ensurePanel();
        if (!this.sheet) return;
        this._syncAvcode();
        this._renderList();
        this._syncSwitchState();
        this.sheet.classList.remove('is-hidden');
        this.buttonEl?.classList.add('is-open');
        this.uiManager?.surfaceMachine?.activate?.(SURFACE_TYPES.SUBTITLE_PANEL, () => this._closePanel());

        if (!this.onlineResults.length && !this._searching && this.settings.betaMode) {
            this._searchOnline();
        }
    }

    _closePanel() {
        if (!this.sheet) return;
        this.sheet.classList.add('is-hidden');
        this.buttonEl?.classList.remove('is-open');
        this.uiManager?.surfaceMachine?.deactivate?.(SURFACE_TYPES.SUBTITLE_PANEL);
    }
}
