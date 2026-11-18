/**
 * SubtitleManager — 字幕渲染与管理中枢
 *
 * 职责：
 * 1. 在视频区域内渲染字幕浮层（绝对定位 + GPU 友好，绝不触发 Reflow）
 * 2. 字幕轨切换面板（本地已存 / 在线检索 / 本地文件导入）
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
    ICON_REFRESH
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
        this.bundle = { code: '', activeId: '', items: [], updatedAt: 0 };
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

        this._lastRenderedText = '';
        this._lastCueIndex = -1;
        this._rafId = 0;
        this._searching = false;
        this._downloadingId = '';
        this._fileInput = null;

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

    get isEnabled() {
        return this.settings.subtitleEnabled !== false;
    }

    // ---------------------------------------------------------------- 生命周期

    init() {
        this.avcode = this._resolveAvcode();
        this._ensureOverlay();
        this._ensureButton();
        this._ensurePanel();
        this._bindVideoEvents();
        this._loadBundle().then(() => {
            this._renderList();
            if (this.isEnabled && this.bundle.items.length) {
                const target =
                    this.bundle.items.find((item) => item.id === this.bundle.activeId) || this.bundle.items[0];
                this._applyItem(target, { silent: true });
            }
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
        }
        this.overlayLayer?.remove();
        this.buttonEl?.remove();
        this.sheet?.remove();
        this.overlayLayer = null;
        this.buttonEl = null;
        this.sheet = null;
        this.panel = null;
        this.listEl = null;
        this.cues = [];
        this.activeItem = null;
    }

    // ---------------------------------------------------------------- 番号与存储

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
                { code: this.avcode, activeId: this.bundle.activeId, items: this.bundle.items },
                options
            );
        } catch (err) {
            console.warn('[SubtitleManager] 字幕包保存失败:', err?.message);
        }
    }

    _updateSetting(key, value) {
        const state = this.playerCore?.options?.playerState;
        if (state?.updateSetting) {
            state.updateSetting(key, value);
        }
    }

    // ---------------------------------------------------------------- 渲染层

    _ensureOverlay() {
        if (this.overlayLayer) return;
        const wrapper = this.uiManager?.videoWrapper;
        if (!wrapper) return;

        const layer = document.createElement('div');
        layer.className = 'tm-subtitle-layer is-empty';
        const textEl = document.createElement('div');
        textEl.className = 'tm-subtitle-text';
        layer.appendChild(textEl);
        wrapper.appendChild(layer);

        this.overlayLayer = layer;
        this.overlayText = textEl;
        this._applyFontSize(this.settings.subtitleFontSize, { persist: false });
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
    }

    _startRenderLoop() {
        if (this._rafId || !this.cues.length) return;
        const tick = () => {
            this._rafId = 0;
            if (!this.overlayLayer || !this.targetVideo || this.targetVideo.paused) return;
            this.renderAt(this.targetVideo.currentTime);
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
        if (idx !== this._lastCueIndex) this._lastCueIndex = idx;

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
        if (!this.overlayLayer || !this.overlayText) return;
        this.overlayText.textContent = next;
        this.overlayLayer.classList.toggle('is-empty', next.length === 0);
    }

    // ---------------------------------------------------------------- 轨切换

    _applyItem(item, options = {}) {
        const { silent = false } = options;
        if (!item) {
            this._detach();
            return;
        }
        const { cues, format } = parseSubtitles(item.content || '', item.format || 'srt');
        if (!cues.length) {
            if (!silent) Toast(text('subtitleParseFailed', '字幕内容无法解析'), 2500, 'error');
            return;
        }
        this.cues = cues;
        this.activeItem = item;
        this.bundle.activeId = item.id;
        this._lastCueIndex = -1;
        this._lastRenderedText = '__dirty__';
        this._updateSetting('subtitleEnabled', true);
        this._updateButtonState();
        this._renderList();
        this._persist();
        this.renderAt(this.targetVideo?.currentTime || 0);
        if (this.targetVideo && !this.targetVideo.paused) this._startRenderLoop();
        if (!silent) {
            Toast(
                `${text('subtitleApplied', '已应用字幕')} · ${item.title || item.langLabel || format.toUpperCase()}`,
                2000,
                'success'
            );
        }
    }

    _detach({ silent = false } = {}) {
        this._stopRenderLoop();
        this.cues = [];
        this.activeItem = null;
        this.bundle.activeId = '';
        this._setOverlayText('');
        this._updateSetting('subtitleEnabled', false);
        this._updateButtonState();
        this._renderList();
        this._persist({ sync: false });
        if (!silent) Toast(text('subtitleOffToast', '已关闭字幕'), 1800, 'info');
    }

    _updateButtonState() {
        this.buttonEl?.classList.toggle('has-active', Boolean(this.activeItem));
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
        panel.className = 'tm-subtitle-panel is-hidden';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', text('subtitleTitle', '字幕'));

        const head = document.createElement('div');
        head.className = 'tm-subtitle-head';
        const title = document.createElement('span');
        title.className = 'tm-subtitle-head-title';
        title.textContent = text('subtitleTitle', '字幕');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'tm-subtitle-close-btn';
        closeBtn.setAttribute('aria-label', text('subtitleClose', '关闭'));
        closeBtn.innerHTML = ICON_X_CLOSE;
        closeBtn.addEventListener('click', () => this._closePanel());
        head.append(title, closeBtn);

        const body = document.createElement('div');
        body.className = 'tm-subtitle-body';
        body.append(this._buildToolbar(), this._buildList());

        panel.append(head, body);
        sheet.append(scrim, panel);
        host.appendChild(sheet);

        this.sheet = sheet;
        this.panel = panel;
        this._renderList();
    }

    _buildToolbar() {
        const bar = document.createElement('div');
        bar.className = 'tm-subtitle-toolbar';

        const searchBtn = document.createElement('button');
        searchBtn.type = 'button';
        searchBtn.className = 'tm-subtitle-action-btn';
        searchBtn.dataset.action = 'search';
        searchBtn.innerHTML = `${ICON_REFRESH}<span>${text('subtitleSearch', '搜索字幕')}</span>`;
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
        this._fileInput = fileInput;

        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'tm-subtitle-size-group';
        const sizeLabels = {
            small: text('subtitleFontSmall', '小'),
            medium: text('subtitleFontMedium', '中'),
            large: text('subtitleFontLarge', '大')
        };
        FONT_SIZES.forEach((size) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tm-subtitle-size-btn';
            btn.dataset.size = size;
            btn.textContent = sizeLabels[size];
            btn.addEventListener('click', () => this._applyFontSize(size));
            sizeGroup.appendChild(btn);
        });
        this.sizeGroupEl = sizeGroup;

        bar.append(searchBtn, importBtn, fileInput, sizeGroup);
        return bar;
    }

    _buildList() {
        const list = document.createElement('div');
        list.className = 'tm-subtitle-list';
        this.listEl = list;
        return list;
    }

    _renderList() {
        if (!this.listEl) return;

        const rows = [];
        rows.push(this._buildItemRow(
            {
                id: '__off__',
                title: text('subtitleOff', '关闭字幕'),
                meta: this.avcode || '',
                langLabel: ''
            },
            { active: !this.bundle.activeId, onSelect: () => this._detach() }
        ));

        if (this.bundle.items.length) {
            const label = document.createElement('div');
            label.className = 'tm-subtitle-section-label';
            label.textContent = `${text('subtitleMine', '我的字幕')} · ${this.bundle.items.length}`;
            rows.push(label);

            this.bundle.items.forEach((item) => {
                rows.push(this._buildItemRow(item, {
                    active: item.id === this.bundle.activeId,
                    onSelect: () => this._applyItem(item),
                    onRemove: () => this._removeItem(item)
                }));
            });
        }

        if (this.onlineResults.length) {
            const label = document.createElement('div');
            label.className = 'tm-subtitle-section-label';
            label.textContent = `${text('subtitleOnline', '在线结果')} · ${this.onlineResults.length}`;
            rows.push(label);

            this.onlineResults.forEach((candidate) => {
                normalizeCandidateRow(candidate);
                rows.push(this._buildItemRow(
                    {
                        id: candidate.id,
                        title: candidate.title,
                        meta: `${candidate.providerLabel} · ${candidate.langLabel} · ${candidate.rating}`,
                        badge: this._downloadingId === candidate.id
                            ? text('subtitleDownloading', '下载中…')
                            : text('subtitleDownload', '下载'),
                        busy: this._downloadingId === candidate.id
                    },
                    {
                        active: candidate.id === this.bundle.activeId,
                        onSelect: () => this._downloadCandidate(candidate)
                    }
                ));
            });
        } else if (this._searching) {
            const empty = document.createElement('div');
            empty.className = 'tm-subtitle-hint';
            empty.textContent = text('subtitleSearching', '正在搜索…');
            rows.push(empty);
        }

        this.listEl.replaceChildren(...rows);
    }

    _buildItemRow(item, options = {}) {
        const { active = false, badge = '', busy = false, onSelect = null, onRemove = null } = options;
        const row = document.createElement('div');
        row.className = 'tm-subtitle-item';
        if (active) row.classList.add('is-active');
        if (busy) row.classList.add('is-busy');

        const main = document.createElement('div');
        main.className = 'tm-subtitle-item-main';
        const titleEl = document.createElement('div');
        titleEl.className = 'tm-subtitle-item-title';
        titleEl.textContent = item.title || '';
        const metaEl = document.createElement('div');
        metaEl.className = 'tm-subtitle-item-meta';
        metaEl.textContent = item.meta || '';
        main.append(titleEl);
        if (item.meta) main.append(metaEl);
        row.appendChild(main);

        if (badge) {
            const badgeEl = document.createElement('span');
            badgeEl.className = 'tm-subtitle-item-badge';
            badgeEl.textContent = badge;
            row.appendChild(badgeEl);
        }

        if (onRemove) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'tm-subtitle-item-del';
            delBtn.setAttribute('aria-label', text('subtitleDelete', '删除字幕'));
            delBtn.title = text('subtitleDelete', '删除字幕');
            delBtn.innerHTML = ICON_TRASH;
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onRemove();
            });
            row.appendChild(delBtn);
        }

        if (onSelect) {
            row.addEventListener('click', () => {
                if (row.classList.contains('is-busy')) return;
                onSelect();
            });
        }
        return row;
    }

    async _removeItem(item) {
        this.bundle.items = this.bundle.items.filter((entry) => entry.id !== item.id);
        if (this.bundle.activeId === item.id) {
            this._detach({ silent: true });
        }
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
            this.bundle.items = [item, ...this.bundle.items];
            this._applyItem(item);
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
        // 网络采集属实验能力：受 Beta 实验室总开关约束，默认关闭
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
            this.onlineResults = candidates.filter((c) => !this.bundle.items.some((item) => item.id === c.id));
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
        if (this._downloadingId) return;
        this._downloadingId = candidate.id;
        this._renderList();
        try {
            const { content, format } = await this.engine.download(candidate);
            const item = {
                id: candidate.id,
                provider: candidate.provider,
                providerLabel: candidate.providerLabel,
                title: candidate.title,
                lang: candidate.lang,
                langLabel: candidate.langLabel,
                format,
                content,
                addedAt: Date.now(),
                rating: candidate.rating
            };
            this.bundle.items = [item, ...this.bundle.items.filter((entry) => entry.id !== item.id)];
            this.onlineResults = this.onlineResults.filter((entry) => entry.id !== item.id);
            this._applyItem(item);
        } catch (err) {
            console.warn('[SubtitleManager] 下载失败:', err?.message);
            Toast(text('subtitleDownloadFailed', '下载失败，请换个来源试试'), 2600, 'error');
        } finally {
            this._downloadingId = '';
            this._renderList();
        }
    }

    // ---------------------------------------------------------------- 面板开合

    _togglePanel() {
        if (this.sheet?.classList.contains('is-hidden')) this._openPanel();
        else this._closePanel();
    }

    _openPanel() {
        this._ensurePanel();
        if (!this.sheet) return;
        this._renderList();
        this.sheet.classList.remove('is-hidden');
        this.panel.classList.remove('is-hidden');
        this.buttonEl?.classList.add('is-open');
        this.uiManager?.surfaceMachine?.activate?.(SURFACE_TYPES.SUBTITLE_PANEL, () => this._closePanel());
    }

    _closePanel() {
        if (!this.sheet) return;
        this.sheet.classList.add('is-hidden');
        this.panel.classList.add('is-hidden');
        this.buttonEl?.classList.remove('is-open');
        this.uiManager?.surfaceMachine?.deactivate?.(SURFACE_TYPES.SUBTITLE_PANEL);
    }
}

/** 候选数据规范化：防止源站脏字段破坏列表渲染 */
function normalizeCandidateRow(candidate) {
    if (!candidate.langLabel) candidate.langLabel = '';
    if (!Number.isFinite(candidate.rating)) candidate.rating = 60;
}
