/**
 * SubtitleManager — 字幕渲染与管理中枢
 *
 * 模型：
 * 1. 字幕层挂在播放器顶层容器，按画面矩形几何对齐（杜绝 iOS 视频合成面遮挡）
 * 2. 列表 = 全量候选（在线检索结果 + 已收藏），番号不符的候选一律屏蔽
 * 3. 「收藏」是唯一的持久化动作：收藏即优先展示 + 落盘 IndexedDB + 写入 WebDAV；取消收藏即删除
 */

import { Toast } from '../../utils/index.js';
import { __ } from '../../constants/i18n.js';
import { getVideoCodeFromUrl, cleanAvCode } from '../../utils/videoCode.js';
import {
    ICON_SUBTITLE,
    ICON_X_CLOSE,
    ICON_DOWNLOAD,
    ICON_REFRESH,
    ICON_STAR,
    ICON_STAR_FILLED,
    ICON_SLIDERS,
    ICON_LYRICS
} from '../../constants/icons.js';
import { UISurfaceMachine, SURFACE_TYPES } from '../state/UISurfaceMachine.js';
import { SubtitleEngine } from './SubtitleEngine.js';
import { SubtitleRepository } from './SubtitleRepository.js';
import { decodeSubtitleBuffer } from './SubtitleDecoder.js';
import { parseSubtitles } from './SubtitleFormat.js';
import { codeMatchesText } from './SubtitleCode.js';

const FONT_SIZES = ['small', 'medium', 'large'];
const CUE_TAIL_TOLERANCE = 0.35;
const CUE_LEAD_TOLERANCE = 0.25;

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
        this.fileInput = null;
        this.adjustBtn = null;
        this.lyricsView = null;
        this.lyricsScroll = null;
        this.lyricsRows = [];
        this.lyricsFollowBtn = null;
        this.lyricsTitleEl = null;
        this.lyricsCountEl = null;
        this._lyricsFollow = true;
        this._lyricsAutoScrollUntil = 0;
        this._lyricIndex = -1;
        this._visitedCues = new Set();
        this._suppressRowClickUntil = 0;

        this._lastRenderedText = '';
        this._rafId = 0;
        this._searching = false;
        this._busyId = '';

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
        this._loadBundle().then(() => {
            this._renderList();
            this._syncSwitchState();
            if (this.isEnabled) this._autoApplyBest({ silent: true });
        });
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
        this.cues = [];
        this.activeItem = null;
    }

    // ---------------------------------------------------------------- 数据层

    /**
     * 统一番号漏斗：优先复用播放器与评论面板已解析的权威值，
     * 缺失时才回落到全局 getVideoCodeFromUrl，最后经 cleanAvCode 归一化。
     * 严禁在本模块另造番号解析逻辑。
     */
    _resolveAvcode() {
        // 权威来源：评论采集使用的番号（页面级漏斗解析，与评论/热度全站一致）
        const raw =
            this.controlManager?.commentPanel?.videoCode ||
            this.playerCore?.options?.videoCode ||
            getVideoCodeFromUrl() ||
            getVideoCodeFromUrl(this.targetVideo);
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
        this.bundle = { code: next, activeId: '', favoriteId: '', items: [], updatedAt: 0 };
        this._setOverlayText('');
        await this._loadBundle();
        this._renderList();
        this._syncSwitchState();
        if (this.isEnabled) await this._autoApplyBest({ silent: true });
        return true;
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

    /** 默认展示最优字幕：收藏优先，其次评分最高 */
    async _autoApplyBest({ silent = false } = {}) {
        const items = this.bundle.items || [];
        if (!items.length) return;
        const favorite =
            items.find((item) => item.id === this.bundle.favoriteId) || items.find((item) => item.favorite);
        const best = favorite || items.slice().sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0];
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
        this._setOverlayText(collected.map((cue) => cue.text).join('\n'));
    }

    _setOverlayText(value) {
        const next = String(value || '');
        if (next === this._lastRenderedText) return;
        this._lastRenderedText = next;
        this._ensureOverlay();
        if (!this.overlayLayer || !this.overlayText) return;
        this.overlayText.textContent = next;
        this.overlayLayer.classList.toggle('is-empty', next.length === 0);
    }

    // ---------------------------------------------------------------- 轨切换

    async _applyItem(item, options = {}) {
        const { silent = false } = options;
        if (!item) return;
        const prepared = await this._ensureContent(item);
        if (!prepared) {
            if (!silent) Toast(text('subtitleDownloadFailed', '下载失败，请换个来源试试'), 2600, 'error');
            return;
        }
        const { cues, format } = parseSubtitles(prepared.content || '', prepared.format || '');
        if (!cues.length) {
            if (!silent) Toast(text('subtitleParseFailed', '字幕内容无法解析'), 2500, 'error');
            window.DebugLogPanel?.addLog?.(`[字幕] 解析失败: ${prepared.title} (${prepared.content?.length || 0} 字符)`, 'warn');
            return;
        }

        prepared.format = format;
        if (this.overlayText) this.overlayText.lang = prepared.lang || '';
        this.timeStepper?.setValue((Number(prepared.timeOffsetMs) || 0) / 1000);
        this.cues = cues;
        this.activeItem = prepared;
        this.bundle.activeId = prepared.id;
        this._lastRenderedText = '__dirty__';
        this._updateSetting('subtitleEnabled', true);
        this._syncSwitchState();
        this._updateButtonState();
        this._renderList();
        this._ensureOverlay();
        this.renderAt(this.targetVideo?.currentTime || 0);
        if (this.targetVideo && !this.targetVideo.paused) this._startRenderLoop();
        window.DebugLogPanel?.addLog?.(`[字幕] 已挂载 ${cues.length} 条字幕: ${prepared.title}`, 'info');
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

        return panel;
    }

    _buildAdjustRow(labelText, controlEl, hintText = '') {
        const row = document.createElement('div');
        row.className = 'tm-subtitle-adjust-row';

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
            const favDiff = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
            if (favDiff) return favDiff;
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

    /** 歌词/时间轴视图：逐条字幕 + 时间戳，点击跳转，滚动自动跟随 */
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
        const count = document.createElement('span');
        count.className = 'tm-subtitle-lyrics-count';

        head.append(backBtn, title, count);

        const scroll = document.createElement('div');
        scroll.className = 'tm-subtitle-lyrics-scroll';
        scroll.addEventListener('scroll', () => this._onLyricsScroll(), { passive: true });

        const followBtn = document.createElement('button');
        followBtn.type = 'button';
        followBtn.className = 'tm-subtitle-lyrics-follow is-hidden';
        followBtn.textContent = text('subtitleFollow', '回到当前');
        followBtn.addEventListener('click', () => {
            this._lyricsFollow = true;
            followBtn.classList.add('is-hidden');
            this._syncLyricHighlight({ force: true });
        });

        view.append(head, scroll, followBtn);
        this.lyricsView = view;
        this.lyricsScroll = scroll;
        this.lyricsFollowBtn = followBtn;
        this.lyricsTitleEl = title;
        this.lyricsCountEl = count;
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
        this._visitedCues = new Set();
        this._renderLyrics();
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

    _renderLyrics() {
        if (!this.lyricsScroll) return;
        const item = this.activeItem;
        if (this.lyricsTitleEl) {
            this.lyricsTitleEl.textContent = `${langName(item || {})} · ${item?.providerLabel || ''}`.trim();
        }
        if (this.lyricsCountEl) this.lyricsCountEl.textContent = String(this.cues.length);

        const rows = [];
        this.cues.forEach((cue, index) => {
            const rowEl = document.createElement('button');
            rowEl.type = 'button';
            rowEl.className = 'tm-subtitle-lyric-row';
            rowEl.dataset.index = String(index);

            const stamp = document.createElement('span');
            stamp.className = 'tm-subtitle-lyric-ts';
            stamp.textContent = formatStamp(cue.start);

            const txt = document.createElement('span');
            txt.className = 'tm-subtitle-lyric-text';
            txt.textContent = cue.text.replace(/\n/g, ' ');

            const mark = document.createElement('span');
            mark.className = 'tm-subtitle-lyric-mark';
            mark.textContent = text('subtitleVisited', '已跳转');
            if (this._visitedCues.has(index)) mark.classList.add('is-visible');

            rowEl.append(stamp, txt, mark);
            rowEl.addEventListener('click', () => this._seekToCue(index));
            rows.push(rowEl);
        });
        this.lyricsRows = rows;
        this.lyricsScroll.replaceChildren(...rows);
        this.lyricsScroll.scrollTop = 0;
    }

    /** 点击歌词行跳转到对应播放进度（补偿当前字幕的时间轴偏移） */
    _seekToCue(index) {
        const cue = this.cues[index];
        if (!cue) return;
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

    _syncLyricHighlight({ force = false } = {}) {
        if (!this.lyricsView || this.lyricsView.classList.contains('is-hidden') || !this.cues.length) return;
        const offsetSec = (Number(this.activeItem?.timeOffsetMs) || 0) / 1000;
        const time = (Number(this.targetVideo?.currentTime) || 0) - offsetSec;

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
        // 关键：命中 start 不等于处于该行区间，静音间隙必须清除活动态（否则底色长期残留）
        if (idx >= 0 && time > this.cues[idx].end + CUE_TAIL_TOLERANCE) idx = -1;

        if (!force && idx === this._lyricIndex) return;

        this.lyricsRows[this._lyricIndex]?.classList.remove('is-current');
        this._lyricIndex = idx;
        if (idx < 0) return;

        const rowEl = this.lyricsRows[idx];
        if (!rowEl) return;
        rowEl.classList.add('is-current');
        if (!this._lyricsFollow) return;

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
            this.bundle.favoriteId = item.id;
            this.bundle.items = [item, ...this.bundle.items.filter((entry) => entry.id !== item.id)];
            await this._persist({ dirtyItem: item });
            Toast(text('subtitleSaved', '已收藏并同步'), 1800, 'success');

            if (!this.activeItem) await this._applyItem(item, { silent: true });
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
            const { format, cues } = parseSubtitles(content, file.name);
            if (!cues.length) throw new Error('EMPTY');
            const item = {
                id: `local:${file.name}:${Date.now()}`,
                provider: 'local',
                providerLabel: text('subtitleFromLocal', '本地导入'),
                title: file.name.replace(/\.(srt|ass|ssa|vtt)$/i, ''),
                lang: 'zh',
                langLabel: '',
                format,
                content,
                addedAt: Date.now(),
                rating: 100
            };
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
        if (this._searching) return;
        if (!this.settings.betaMode) {
            Toast(text('subtitleNeedBeta', '开启实验功能后可在线搜索字幕'), 2800, 'info');
            return;
        }
        if (!this.avcode) {
            Toast(text('subtitleNoCode', '未识别影片番号'), 2500, 'error');
            return;
        }
        this._searching = true;
        this._renderList();
        try {
            const { candidates, errors } = await this.engine.search(this.avcode);
            const known = new Set(this.bundle.items.map((item) => item.id));
            this.onlineResults = candidates.filter(
                (candidate) => !known.has(candidate.id) && this._isRelevant(candidate)
            );
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
            Toast(text('subtitleSearchFailed', '搜索失败，请稍后重试'), 2600, 'error');
        } finally {
            this._searching = false;
            this._renderList();
        }
    }

    async _downloadCandidate(candidate) {
        try {
            const { content, format } = await this.engine.download(candidate);
            const item = {
                ...candidate,
                content,
                format,
                addedAt: Date.now(),
                favorite: Boolean(candidate.favorite)
            };
            this.onlineResults = this.onlineResults.filter((entry) => entry.id !== item.id);
            return item;
        } catch (err) {
            console.warn('[SubtitleManager] 下载失败:', err?.message);
            Toast(text('subtitleDownloadFailed', '下载失败，请换个来源试试'), 2600, 'error');
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
