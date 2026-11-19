/**
 * SubtitleManager — 字幕渲染与管理中枢
 *
 * 职责：
 * 1. 在视频区域内渲染字幕浮层（绝对定位 + GPU 合成层，绝不触发 Reflow）
 * 2. 字幕面板：总开关、全量字幕列表（本地已存 + 在线结果同列表）、收藏、字号
 * 3. 与 SubtitleRepository 协作完成 IndexedDB + WebDAV 多级存储
 */

import { Toast } from '../../utils/index.js';
import { __ } from '../../constants/i18n.js';
import { getVideoCodeFromUrl } from '../../utils/videoCode.js';
import {
    ICON_SUBTITLE,
    ICON_X_CLOSE,
    ICON_TRASH,
    ICON_DOWNLOAD,
    ICON_REFRESH,
    ICON_CHECK,
    ICON_STAR,
    ICON_STAR_FILLED
} from '../../constants/icons.js';
import { UISurfaceMachine, SURFACE_TYPES } from '../state/UISurfaceMachine.js';
import { SubtitleEngine } from './SubtitleEngine.js';
import { SubtitleRepository } from './SubtitleRepository.js';
import { decodeSubtitleBuffer } from './SubtitleDecoder.js';
import { parseSubtitles } from './SubtitleFormat.js';
import { canonicalizeSubtitleCode } from './SubtitleCode.js';

const FONT_SIZES = ['small', 'medium', 'large'];
const CUE_TAIL_TOLERANCE = 0.35;
const CUE_LEAD_TOLERANCE = 0.25;

function text(key, fallback) {
    return __(key) || fallback;
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

    _resolveAvcode() {
        const code =
            getVideoCodeFromUrl(this.targetVideo) ||
            this.controlManager?.commentPanel?.videoCode ||
            this.playerCore?.options?.videoCode ||
            '';
        return canonicalizeSubtitleCode(code) || String(code || '').toUpperCase();
    }

    async _loadBundle() {
        if (!this.avcode) return;
        try {
            this.bundle = await SubtitleRepository.load(this.avcode);
        } catch (err) {
            console.warn('[SubtitleManager] 字幕包加载失败:', err?.message);
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
        if (!best || best.id === this.bundle.activeId) return;
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
            window.addEventListener('resize', this._onWindowResize = () => this._syncOverlayGeometry());
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
        if (!video.paused) this._startRenderLoop();
        this._onVideoMeta = () => this._syncOverlayGeometry();
        video.addEventListener('loadedmetadata', this._onVideoMeta);
        video.addEventListener('emptied', this._onVideoMeta);
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
        if (!this.cues.length || !this.isEnabled) {
            this._setOverlayText('');
            return;
        }
        const time = Number(currentTime) || 0;
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
        this._upsertItem(prepared);
        this.cues = cues;
        this.activeItem = prepared;
        this.bundle.activeId = prepared.id;
        this._lastRenderedText = '__dirty__';
        this._updateSetting('subtitleEnabled', true);
        this._syncSwitchState();
        this._updateButtonState();
        this._renderList();
        this._persist({ dirtyItem: prepared });
        this._ensureOverlay();
        this.renderAt(this.targetVideo?.currentTime || 0);
        if (this.targetVideo && !this.targetVideo.paused) this._startRenderLoop();
        window.DebugLogPanel?.addLog?.(`[字幕] 已挂载 ${cues.length} 条字幕: ${prepared.title}`, 'info');
        if (!silent) {
            Toast(`${text('subtitleApplied', '已应用字幕')} · ${prepared.title || format.toUpperCase()}`, 2000, 'success');
        }
    }

    _upsertItem(item) {
        const index = this.bundle.items.findIndex((entry) => entry.id === item.id);
        if (index >= 0) this.bundle.items[index] = { ...this.bundle.items[index], ...item };
        else this.bundle.items = [item, ...this.bundle.items];
        return this.bundle.items.find((entry) => entry.id === item.id);
    }

    _setEnabled(enabled) {
        this._updateSetting('subtitleEnabled', Boolean(enabled));
        this._syncSwitchState();
        if (!enabled) {
            this._setOverlayText('');
            this._stopRenderLoop();
            return;
        }
        const active = this._findItem(this.bundle.activeId);
        if (active) {
            this._applyItem(active, { silent: true });
        } else {
            this._autoApplyBest({ silent: true }).then(() => {
                if (!this.cues.length && !this.bundle.items.length) {
                    Toast(text('subtitleEmptyHint', '搜索或导入字幕后即可显示'), 2200, 'info');
                }
            });
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

        const scrim = document.createElement('div');
        scrim.className = 'tm-subtitle-scrim';
        scrim.addEventListener('click', () => this._closePanel());

        const panel = document.createElement('div');
        panel.className = 'tm-subtitle-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', text('subtitleTitle', '字幕'));

        panel.append(this._buildHeader(), this._buildBody());
        sheet.append(scrim, panel);
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
        const code = document.createElement('span');
        code.className = 'tm-subtitle-head-code';
        code.textContent = this.avcode || '';
        titleWrap.append(title);
        if (this.avcode) titleWrap.append(code);

        const actions = document.createElement('div');
        actions.className = 'tm-subtitle-head-actions';

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

        actions.append(switchBtn, closeBtn);
        head.append(titleWrap, actions);
        return head;
    }

    _buildBody() {
        const body = document.createElement('div');
        body.className = 'tm-subtitle-body';
        body.append(this._buildToolbar());

        const list = document.createElement('div');
        list.className = 'tm-subtitle-list';
        this.listEl = list;
        body.append(list);
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

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.srt,.ass,.ssa,.vtt';
        fileInput.className = 'tm-subtitle-file-input';
        fileInput.addEventListener('change', () => this._handleFileImport(fileInput));
        importBtn.addEventListener('click', () => fileInput.click());
        this.fileInput = fileInput;

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

        bar.append(searchBtn, importBtn, fileInput, sizeGroup);
        return bar;
    }

    /** 本地已存 + 在线结果合并为单一全量列表 */
    _visibleRows() {
        const map = new Map();
        for (const item of this.bundle.items) map.set(item.id, item);
        for (const candidate of this.onlineResults) {
            if (!map.has(candidate.id)) map.set(candidate.id, candidate);
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
                active: row.id === this.bundle.activeId,
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

        const main = document.createElement('div');
        main.className = 'tm-subtitle-item-main';

        const title = document.createElement('div');
        title.className = 'tm-subtitle-item-title';
        title.textContent = row.title || row.langLabel || '';

        const metaBits = [
            row.providerLabel || text('subtitleFromLocal', '本地'),
            row.langLabel || row.lang,
            row.rating ? String(row.rating) : ''
        ].filter(Boolean);
        const meta = document.createElement('div');
        meta.className = 'tm-subtitle-item-meta';
        meta.textContent = metaBits.join(' · ');

        main.append(title, meta);
        el.append(main);

        const actions = document.createElement('div');
        actions.className = 'tm-subtitle-item-actions';

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

        const state = document.createElement('span');
        state.className = 'tm-subtitle-state';
        state.innerHTML = downloaded ? ICON_CHECK : ICON_DOWNLOAD;

        actions.append(star, state);

        if (downloaded) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'tm-subtitle-item-del';
            del.title = text('subtitleDelete', '删除字幕');
            del.setAttribute('aria-label', text('subtitleDelete', '删除字幕'));
            del.innerHTML = ICON_TRASH;
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                this._removeItem(row);
            });
            actions.append(del);
        }

        el.append(actions);
        el.addEventListener('click', () => {
            if (el.classList.contains('is-busy')) return;
            this._activateRow(row);
        });
        return el;
    }

    async _activateRow(row) {
        if (this._busyId) return;
        if (this._findItem(row.id)) {
            await this._applyItem(this._findItem(row.id));
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

    async _toggleFavorite(row) {
        if (this._busyId) return;
        this._busyId = row.id;
        this._renderList();
        try {
            let item = this._findItem(row.id);
            if (!item) item = await this._downloadCandidate(row);
            else if (!item.content) item = await this._ensureContent(item);
            if (!item) throw new Error('SUBTITLE_UNAVAILABLE');

            const next = !item.favorite;
            item.favorite = next;
            if (next) {
                this.bundle.favoriteId = item.id;
                this.bundle.items = [item, ...this.bundle.items.filter((entry) => entry.id !== item.id)];
                await this._persist({ dirtyItem: item });
                Toast(text('subtitleSaved', '已收藏并同步'), 1800, 'success');
            } else {
                if (this.bundle.favoriteId === item.id) this.bundle.favoriteId = '';
                await this._persist();
            }
        } catch (err) {
            console.warn('[SubtitleManager] 收藏失败:', err?.message);
            Toast(text('subtitleSaveFailed', '同步失败，已存至本地'), 2400, 'error');
        } finally {
            this._busyId = '';
            this._renderList();
        }
    }

    async _removeItem(row) {
        this.bundle.items = this.bundle.items.filter((entry) => entry.id !== row.id);
        if (this.bundle.activeId === row.id) {
            this.bundle.activeId = '';
            this.activeItem = null;
            this.cues = [];
            this._stopRenderLoop();
            this._setOverlayText('');
            this._updateButtonState();
        }
        if (this.bundle.favoriteId === row.id) this.bundle.favoriteId = '';
        await this._persist();
        this._renderList();
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
            this._upsertItem(item);
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
            this.onlineResults = candidates.filter((candidate) => !known.has(candidate.id));
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
            return this._upsertItem(item);
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
        this._renderList();
        this._syncSwitchState();
        this.sheet.classList.remove('is-hidden');
        this.buttonEl?.classList.add('is-open');
        this.uiManager?.surfaceMachine?.activate?.(SURFACE_TYPES.SUBTITLE_PANEL, () => this._closePanel());

        // 首次打开且无任何字幕时自动检索一次，默认给到最优字幕
        if (!this.bundle.items.length && !this.onlineResults.length && !this._searching && this.settings.betaMode) {
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
