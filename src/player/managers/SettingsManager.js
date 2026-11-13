import { getValue, setValue, Toast } from '../../utils/index.js';
import { __ } from '../../constants/i18n.js';
import { ICON_CHEVRON_LEFT } from '../../constants/icons.js';
import { SleazyForkService, getCurrentVersion } from '../../services/SleazyForkService.js';
import { CrazyScraper } from '../comments/CrazyScraper.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import { SURFACE_TYPES } from '../state/UISurfaceMachine.js';
import { SettingsStreamScheduler } from './settings/SettingsStreamScheduler.js';
import { PlaybackSection } from './settings/sections/PlaybackSection.js';
import { CommentsSection } from './settings/sections/CommentsSection.js';
import { BetaSection } from './settings/sections/BetaSection.js';
import { CloudSyncSection } from './settings/sections/CloudSyncSection.js';
import { AboutSection } from './settings/sections/AboutSection.js';

const DEFAULT_ENABLED_SEEK_STEPS = ['5s', '10s', '30s', '1m', '5m', '10m'];

function sanitizeSeekStepList(rawList, allowEmpty = false) {
    if (!Array.isArray(rawList)) {
        return allowEmpty ? [] : [...DEFAULT_ENABLED_SEEK_STEPS];
    }
    const valid = rawList.filter((item) => typeof item === 'string' && /^\d+[sm]$/i.test(item.trim()));
    if (!allowEmpty && valid.length === 0) {
        return [...DEFAULT_ENABLED_SEEK_STEPS];
    }
    return [...new Set(valid.map((item) => item.trim().toLowerCase()))];
}

/**
 * 设置管理器类
 * 负责管理视频播放器的各项设置与分级导航面板交互
 */
export class SettingsManager {
    constructor(playerCore, uiElements) {
        this.playerCore = playerCore;
        this.uiElements = uiElements;
        this.settingsPanel = uiElements.settingsPanel;
        this.settingsViewport = null;
        this.settingsScrollBody = null;
        this.settingsSubScrollBody = null;
        this._headerTitleEl = null;
        this._headerBackBtn = null;
        this._activeSubpage = null;
        this._subpageFactories = new Map();
        this.overlayClickHandler = null;
        this.uiManager = null;
        this.controlManager = null;

        // 分区记忆状态（兼容历史调用）
        this.sectionStates = getValue('settingsSectionStates', {}) || {};

        // 更新检查状态
        this._latestUpdateInfo = null;
        this._isCheckingUpdate = false;

        // 核心设置数据映射
        this.settings = {
            showProgressBar: true,
            showSeekControlRow: true,
            showLoopControlRow: true,
            showPlaybackControlRow: true,
            enabledSeekSteps: ['5s', '10s', '30s', '1m', '5m', '10m'],
            customUserSeekSteps: [],
            showCommentsSection: true,
            enabledCommentSources: {
                jable: true,
                javdb: true,
                javlibrary: false
            },
            telemetryEnabled: false,
            debugMode: false,
            debugFilterHasNumbers: false,
            crazyScrapeMode: false,
            pauseOnBlur: true,
            buttonSoundEnabled: true,
            defaultMuted: true,
            muteResetMinutes: 5,
            autoCheckUpdate: true,
            updateChannel: 'stable',
            betaPlayMode: 'normal',
            previewDurationSeconds: 5,
            climaxDurationSeconds: 60,
            betaMode: false,
            betaFirstCapsulePlay: false,
            betaColorPlayMode: 'preview',
            betaHeatmap: true,
            dataMode: 'local',
            hidePrivateData: false,
            betaCapsuleUndo: true,
            betaDeepLinking: true,
            betaDbEndpoint: '',
            betaDbApiKey: '',
            viewportDebugEnabled: false
        };

        this.loadSettings();
    }

    setManagers(managers = {}) {
        if (managers.uiManager) this.uiManager = managers.uiManager;
        if (managers.controlManager) this.controlManager = managers.controlManager;
    }

    init() {
        this.loadSettings();
        DebugLogPanel.updateDebugState(this.settings.debugMode);
        if (this.settings.debugMode && this.settings.crazyScrapeMode) {
            setTimeout(() => CrazyScraper.start(this.controlManager?.commentPanel?.videoCode || ''), 2500);
        }

        this.updateControlRowsVisibility();

        if (this.settings.autoCheckUpdate !== false) {
            const runSilentCheck = async () => {
                try {
                    const channel = this.settings.updateChannel || 'stable';
                    const res = await this.checkUpdate(false, false, channel);
                    if (res && res.success) {
                        this._latestUpdateInfo = res;
                        this.updateSettingsBadge(res.hasUpdate);
                        if (res.hasUpdate && this.settingsPanel && this.settingsPanel.children.length) {
                            this.createSettingsPanel();
                        }
                    }
                } catch (_) {}
            };

            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => setTimeout(runSilentCheck, 2500));
            } else {
                setTimeout(runSilentCheck, 3000);
            }
        }

        return this;
    }

    updateSettingsBadge(hasUpdate) {
        const btn = this.uiElements?.settingsBtn;
        if (!btn) return;
        btn.classList.toggle('has-update', Boolean(hasUpdate));
    }

    async checkUpdate(notify = false, forceRefresh = false, channelOverride = null) {
        if (this._isCheckingUpdate) return null;
        this._isCheckingUpdate = true;
        this.refreshAboutSection();

        try {
            const channel = channelOverride || this.settings.updateChannel || 'stable';
            const res = await SleazyForkService.checkForUpdates(channel, forceRefresh);
            const currentVersion = getCurrentVersion();

            if (res && res.success) {
                this._latestUpdateInfo = res;
                this.updateSettingsBadge(res.hasUpdate);
            }
            if (notify) {
                if (res && res.success) {
                    if (res.hasUpdate) {
                        Toast.show(`${__('updateFound') || '发现新版本'}: v${res.latestVersion}`, 3500, 'success');
                    } else {
                        Toast.show(`${__('alreadyLatest') || '当前已是最新版本'} (v${currentVersion})`, 3000, 'info');
                    }
                } else {
                    Toast.show(res?.error || __('fetchFailed') || '检查更新失败', 3000, 'error');
                }
            }
            return res;
        } catch (err) {
            if (notify) {
                Toast.show(err.message || __('fetchFailed') || '检查更新失败', 3000, 'error');
            }
            return null;
        } finally {
            this._isCheckingUpdate = false;
            this.refreshAboutSection();
        }
    }

    refreshAboutSection() {
        if (this.aboutSection && typeof this.aboutSection.refresh === 'function') {
            this.aboutSection.refresh();
            return true;
        }
        return false;
    }

    refreshCloudSyncSection() {
        if (this.cloudSyncSection && typeof this.cloudSyncSection.refresh === 'function') {
            this.cloudSyncSection.refresh();
            return true;
        }
        return false;
    }

    syncState() {
        const state = this.playerCore?.options?.playerState;
        if (state && state.settings) {
            this.settings = state.settings;
        } else {
            this.loadSettings();
        }
    }

    isSectionExpanded(sectionKey, defaultExpanded = false) {
        if (this.sectionStates && this.sectionStates[sectionKey] !== undefined) {
            return Boolean(this.sectionStates[sectionKey]);
        }
        return defaultExpanded;
    }

    setSectionExpanded(sectionKey, expanded) {
        if (!this.sectionStates) this.sectionStates = {};
        this.sectionStates[sectionKey] = Boolean(expanded);
        setValue('settingsSectionStates', this.sectionStates);
    }

    /**
     * 推入设置二级页面（如快进退步长、WebDAV 云同步、Peach 媒体库）
     */
    pushSubpage(id, title, renderFn) {
        if (typeof renderFn === 'function') {
            this._subpageFactories.set(id, { title, renderFn });
        }
        if (!this.settingsViewport || !this.settingsSubScrollBody) return;

        this.settingsSubScrollBody.innerHTML = '';
        const content = typeof renderFn === 'function' ? renderFn() : null;
        if (content) {
            this.settingsSubScrollBody.appendChild(content);
        }
        this.settingsSubScrollBody.scrollTop = 0;

        this._activeSubpage = id;
        this.settingsViewport.classList.add('is-subpage-active');
        if (this._headerBackBtn) {
            this._headerBackBtn.classList.remove('is-hidden');
        }
        if (this._headerTitleEl) {
            this._headerTitleEl.textContent = title || '';
        }
    }

    /**
     * 返回设置主列表页
     */
    popSubpage() {
        this._activeSubpage = null;
        if (this.settingsViewport) {
            this.settingsViewport.classList.remove('is-subpage-active');
        }
        if (this._headerBackBtn) {
            this._headerBackBtn.classList.add('is-hidden');
        }
        if (this._headerTitleEl) {
            this._headerTitleEl.textContent = __('settingsTitle') || '设置';
        }
    }

    /**
     * 创建设置面板内容（固定 Header + 双层推入式滚动视口 + 移动端底部关闭栏）
     */
    createSettingsPanel(options = {}) {
        if (!this.settingsPanel) return;

        const prevScroller = this.settingsScrollBody || this.settingsPanel;
        const previousScrollTop = (options && options.scrollTop !== undefined)
            ? options.scrollTop
            : (prevScroller ? prevScroller.scrollTop : 0);
        const reopenSubpage = options?.reopenSubpage || null;

        this.syncState();
        this.settingsPanel.innerHTML = '';
        this.settingsPanel.style.transform = '';
        this.settingsPanel.style.transition = '';
        this._activeSubpage = null;

        if (this._scheduler) {
            this._scheduler.destroy();
            this._scheduler = null;
        }

        const stopProp = (e) => e.stopPropagation();
        const stopContextMenu = (e) => {
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const realTarget = path[0] || e.target;
            const tag = realTarget?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || Boolean(realTarget?.isContentEditable)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        };

        if (!this.settingsPanel._panelGuardsBound) {
            this.settingsPanel._panelGuardsBound = true;
            this.settingsPanel.addEventListener('click', stopProp);
            this.settingsPanel.addEventListener('dblclick', stopProp);
            this.settingsPanel.addEventListener('pointerdown', stopProp);
            this.settingsPanel.addEventListener('pointerup', stopProp);
            this.settingsPanel.addEventListener('mousedown', stopProp);
            this.settingsPanel.addEventListener('mouseup', stopProp);
            this.settingsPanel.addEventListener('wheel', stopProp, { passive: true });
            this.settingsPanel.addEventListener('contextmenu', stopContextMenu);
        }

        // 1. 固定吸顶 Header（不随列表滚动消失；二级页面左侧动态呈现“< 设置”返回键）
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-settings-apple-header';

        const grabber = document.createElement('div');
        grabber.className = 'tm-settings-sheet-grabber';
        headerRow.appendChild(grabber);

        const headerBar = document.createElement('div');
        headerBar.className = 'tm-settings-apple-header-bar';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'tm-settings-apple-header-left';

        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'tm-settings-back-btn is-hidden';
        backBtn.innerHTML = `${ICON_CHEVRON_LEFT}<span>${__('settingsBack') || '设置'}</span>`;
        backBtn.setAttribute('aria-label', __('settingsBack') || '返回设置');
        backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.popSubpage();
        });
        this._headerBackBtn = backBtn;

        const headerTitle = document.createElement('span');
        headerTitle.className = 'tm-settings-apple-title';
        headerTitle.textContent = __('settingsTitle') || '设置';
        this._headerTitleEl = headerTitle;

        headerLeft.appendChild(backBtn);
        headerLeft.appendChild(headerTitle);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'tm-settings-apple-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('aria-label', __('close') || '关闭');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeSettingsPanel();
        });

        headerBar.appendChild(headerLeft);
        headerBar.appendChild(closeBtn);
        headerRow.appendChild(headerBar);
        this.settingsPanel.appendChild(headerRow);

        // 2. 双页滑动视口（Root Page + Subpage）
        const viewport = document.createElement('div');
        viewport.className = 'tm-settings-viewport';
        this.settingsViewport = viewport;

        const scrollBody = document.createElement('div');
        scrollBody.className = 'tm-settings-scroll-body tm-settings-page tm-settings-page--root';
        this.settingsScrollBody = scrollBody;

        const subScrollBody = document.createElement('div');
        subScrollBody.className = 'tm-settings-scroll-body tm-settings-page tm-settings-page--sub';
        this.settingsSubScrollBody = subScrollBody;

        const container = document.createElement('div');
        container.className = 'tm-settings-apple-container';

        // 5 个标准化 Root 插槽（播放控制 / 影片评论 / 同步与连接 / 实验与诊断 / 关于与更新）
        const slotPlayback = document.createElement('div');
        slotPlayback.className = 'tm-settings-slot tm-settings-slot--playback';
        const slotComments = document.createElement('div');
        slotComments.className = 'tm-settings-slot tm-settings-slot--comments';
        const slotCloudSync = document.createElement('div');
        slotCloudSync.className = 'tm-settings-slot tm-settings-slot--cloudsync';
        const slotBeta = document.createElement('div');
        slotBeta.className = 'tm-settings-slot tm-settings-slot--beta';
        const slotAbout = document.createElement('div');
        slotAbout.className = 'tm-settings-slot tm-settings-slot--about';

        container.appendChild(slotPlayback);
        container.appendChild(slotComments);
        container.appendChild(slotCloudSync);
        container.appendChild(slotBeta);
        container.appendChild(slotAbout);
        scrollBody.appendChild(container);

        viewport.appendChild(scrollBody);
        viewport.appendChild(subScrollBody);
        this.settingsPanel.appendChild(viewport);

        // 3. 移动端底部拇指热区关闭栏（PC 端 CSS 自动隐藏）
        const footerBar = document.createElement('div');
        footerBar.className = 'tm-settings-apple-footer';

        const doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.className = 'tm-settings-apple-done-btn';
        doneBtn.textContent = __('done') || '完成';
        doneBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeSettingsPanel();
        });
        footerBar.appendChild(doneBtn);
        this.settingsPanel.appendChild(footerBar);

        this._bindSheetDismissGesture(headerRow);

        // 4. 分段装配设置模块
        this._scheduler = new SettingsStreamScheduler(container, this);

        this._scheduler.register('playback', () => {
            this.playbackSection = new PlaybackSection(this);
            return this.playbackSection.getElement();
        }, { defer: 'sync', targetSlot: slotPlayback });

        this._scheduler.register('comments', () => {
            this.commentsSection = new CommentsSection(this);
            return this.commentsSection.getElement();
        }, { defer: 'idle', targetSlot: slotComments });

        this._scheduler.register('cloudSync', () => {
            this.cloudSyncSection = new CloudSyncSection(this);
            return this.cloudSyncSection.getElement();
        }, { defer: 'idle', targetSlot: slotCloudSync });

        this._scheduler.register('beta', () => {
            this.betaSection = new BetaSection(this);
            return this.betaSection.getElement();
        }, { defer: 'idle', targetSlot: slotBeta });

        this._scheduler.register('about', () => {
            this.aboutSection = new AboutSection(this);
            return this.aboutSection.getElement();
        }, { defer: 'idle', targetSlot: slotAbout });

        this._scheduler.start();

        if (previousScrollTop > 0) {
            requestAnimationFrame(() => {
                if (this.settingsScrollBody) {
                    this.settingsScrollBody.scrollTop = previousScrollTop;
                }
            });
        }

        if (reopenSubpage && this._subpageFactories.has(reopenSubpage)) {
            const entry = this._subpageFactories.get(reopenSubpage);
            requestAnimationFrame(() => {
                this.pushSubpage(reopenSubpage, entry.title, entry.renderFn);
            });
        }
    }

    /**
     * 绑定移动端 Sheet 手势：下拉关闭（Header 抓手或滚回顶部继续下拉）及二级页面右滑返回
     */
    _bindSheetDismissGesture(headerRow) {
        if (!this.settingsPanel || this.settingsPanel._sheetGestureBound) return;
        this.settingsPanel._sheetGestureBound = true;

        let startY = 0;
        let startX = 0;
        let startTime = 0;
        let dragging = false;
        let fromHeader = false;
        let currentDeltaY = 0;

        const isMobileSheetViewport = () => (
            typeof window !== 'undefined' &&
            (window.innerWidth < 1024 || window.innerHeight > window.innerWidth)
        );

        const getActiveScroller = () => (
            this._activeSubpage ? this.settingsSubScrollBody : this.settingsScrollBody
        );

        const resetDragVisual = () => {
            this.settingsPanel.style.transition = 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)';
            this.settingsPanel.style.transform = '';
            setTimeout(() => {
                if (this.settingsPanel) {
                    this.settingsPanel.style.transition = '';
                }
            }, 250);
        };

        this.settingsPanel.addEventListener('touchstart', (e) => {
            if (!this.settingsPanel.classList.contains('active')) return;
            if (!isMobileSheetViewport()) return;
            if (e.touches.length !== 1) return;

            const target = e.target;
            if (target && target.closest && target.closest('input, textarea, select')) return;

            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
            startTime = Date.now();
            currentDeltaY = 0;
            fromHeader = Boolean(headerRow && headerRow.contains(target));
            dragging = false;
        }, { passive: true });

        this.settingsPanel.addEventListener('touchmove', (e) => {
            if (!this.settingsPanel.classList.contains('active')) return;
            if (!isMobileSheetViewport()) return;
            if (e.touches.length !== 1) return;

            const deltaY = e.touches[0].clientY - startY;
            const deltaX = e.touches[0].clientX - startX;
            const activeScroller = getActiveScroller();
            const scrollTop = activeScroller ? activeScroller.scrollTop : 0;

            if (!dragging) {
                if (deltaY > 8 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15 && (fromHeader || scrollTop <= 1)) {
                    dragging = true;
                    this.settingsPanel.style.transition = 'none';
                } else {
                    return;
                }
            }

            if (deltaY > 0) {
                currentDeltaY = deltaY;
                this.settingsPanel.style.transform = `translate3d(0, ${Math.min(deltaY, 320)}px, 0)`;
                if (e.cancelable) e.preventDefault();
            } else {
                currentDeltaY = 0;
                this.settingsPanel.style.transform = 'translate3d(0, 0, 0)';
            }
        }, { passive: false });

        const finishDrag = (e) => {
            if (!dragging) {
                // 二级页面左边缘右滑返回一级菜单
                if (this._activeSubpage && e?.changedTouches?.[0]) {
                    const dx = e.changedTouches[0].clientX - startX;
                    const dy = Math.abs(e.changedTouches[0].clientY - startY);
                    if (startX <= 36 && dx > 56 && dy < 40) {
                        this.popSubpage();
                    }
                }
                return;
            }
            dragging = false;
            const elapsed = Math.max(1, Date.now() - startTime);
            const velocity = currentDeltaY / elapsed;

            if (currentDeltaY >= 76 || (currentDeltaY >= 36 && velocity > 0.45)) {
                this.closeSettingsPanel();
            } else {
                resetDragVisual();
            }
            currentDeltaY = 0;
        };

        this.settingsPanel.addEventListener('touchend', finishDrag, { passive: true });
        this.settingsPanel.addEventListener('touchcancel', finishDrag, { passive: true });
    }

    rebuildControlPanelSeekRow() {
        const controlManager = this.controlManager;
        if (!controlManager || !controlManager.controlButtonsContainer || !controlManager.seekController) return;

        const oldSeekRow = controlManager.controlButtonsContainer.querySelector('.tm-seek-control-row');
        const newSeekRow = controlManager.seekController.createSeekControlRow();

        if (oldSeekRow && oldSeekRow.parentNode) {
            oldSeekRow.parentNode.replaceChild(newSeekRow, oldSeekRow);
        }
        this.updateControlRowsVisibility();
    }

    toggleSettingsPanel() {
        if (!this.settingsPanel) return;
        const isVisible = this.settingsPanel.classList.contains('active');
        if (isVisible) {
            this.closeSettingsPanel();
        } else {
            const surfaceMachine = this.uiManager?.surfaceMachine || this.playerCore?.surfaceMachine;
            if (surfaceMachine) {
                surfaceMachine.activate(SURFACE_TYPES.SETTINGS, () => {
                    if (this._activeSubpage) {
                        this.popSubpage();
                        return;
                    }
                    this.closeSettingsPanel();
                });
            }
            this.syncState();
            this.createSettingsPanel();
            this.settingsPanel.classList.add('active');
            document.body.classList.add('tm-settings-active');
            this.uiElements?.playerContainer?.classList.add('tm-settings-active');

            if (this.overlayClickHandler) {
                document.removeEventListener('click', this.overlayClickHandler, true);
                document.removeEventListener('touchstart', this.overlayClickHandler, true);
            }

            this.overlayClickHandler = (e) => {
                const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
                if (path.length > 0) {
                    const isInsideSettingsOrModal = path.some((el) => {
                        if (!(el instanceof HTMLElement)) return false;
                        if (el === this.settingsPanel || el === this.uiElements?.settingsBtn) return true;
                        const cls = typeof el.className === 'string' ? el.className : '';
                        return cls.includes('tm-settings-panel') ||
                               cls.includes('tm-settings-button') ||
                               cls.includes('tm-custom-modal-overlay');
                    });
                    if (isInsideSettingsOrModal) return;
                } else if (
                    this.settingsPanel.contains(e.target) ||
                    this.uiElements?.settingsBtn?.contains(e.target) ||
                    e.target === this.uiElements?.settingsBtn
                ) {
                    return;
                }
                this.closeSettingsPanel();
            };

            setTimeout(() => {
                if (this.overlayClickHandler && this.settingsPanel?.classList.contains('active')) {
                    document.addEventListener('click', this.overlayClickHandler, true);
                }
            }, 50);
        }
    }

    closeSettingsPanel() {
        if (!this.settingsPanel) return;
        this.popSubpage();
        this.settingsPanel.style.transition = '';
        this.settingsPanel.style.transform = '';
        this.settingsPanel.classList.remove('active');
        document.body.classList.remove('tm-settings-active');
        this.uiElements?.playerContainer?.classList.remove('tm-settings-active');

        if (this.overlayClickHandler) {
            document.removeEventListener('click', this.overlayClickHandler, true);
            this.overlayClickHandler = null;
        }
        const surfaceMachine = this.uiManager?.surfaceMachine || this.playerCore?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.deactivate(SURFACE_TYPES.SETTINGS);
        }
    }

    cleanup() {
        this.closeSettingsPanel();
        if (this._scheduler) {
            this._scheduler.destroy();
            this._scheduler = null;
        }
    }

    loadSettings() {
        const state = this.playerCore?.options?.playerState;
        if (state) {
            state.loadSettings();
            this.settings = state.settings;
        } else {
            const getBool = (key, def) => {
                const v = getValue(key, def);
                return typeof v === 'boolean' ? v : (v === 'true' ? true : (v === 'false' ? false : def));
            };

            this.settings.showProgressBar = getBool('showProgressBar', true);
            this.settings.showSeekControlRow = getBool('showSeekControlRow', true);
            this.settings.showLoopControlRow = getBool('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = getBool('showPlaybackControlRow', true);

            const rawSeekSteps = getValue('enabledSeekSteps', null);
            this.settings.enabledSeekSteps = sanitizeSeekStepList(rawSeekSteps, false);

            const rawCustomSteps = getValue('customUserSeekSteps', null);
            this.settings.customUserSeekSteps = sanitizeSeekStepList(rawCustomSteps, true);

            this.settings.showCommentsSection = getBool('showCommentsSection', true);

            const rawSources = getValue('enabledCommentSources', null);
            this.settings.enabledCommentSources = Object.assign({
                jable: true,
                javdb: true,
                javlibrary: false
            }, (rawSources && typeof rawSources === 'object') ? rawSources : {});

            this.settings.telemetryEnabled = false;
            this.settings.debugMode = getBool('debugMode', false);
            this.settings.debugFilterHasNumbers = getBool('debugFilterHasNumbers', false);
            this.settings.crazyScrapeMode = getBool('crazyScrapeMode', false);
            this.settings.pauseOnBlur = getBool('pauseOnBlur', true);
            this.settings.buttonSoundEnabled = getBool('buttonSoundEnabled', true);
            this.settings.defaultMuted = getBool('defaultMuted', true);
            this.settings.muteResetMinutes = parseInt(getValue('muteResetMinutes', 5), 10) || 5;
            this.settings.autoCheckUpdate = getBool('autoCheckUpdate', true);
            const rawPm = getValue('betaPlayMode', 'normal');
            this.settings.betaPlayMode = (rawPm === 'preview' || rawPm === 'climax') ? rawPm : 'normal';
            this.settings.previewDurationSeconds = parseInt(getValue('previewDurationSeconds', 5), 10) || 5;
            this.settings.climaxDurationSeconds = parseInt(getValue('climaxDurationSeconds', 60), 10) || 60;
            this.settings.betaMode = getBool('betaMode', false);
            this.settings.betaFirstCapsulePlay = getBool('betaFirstCapsulePlay', false);
            const rawColorMode = getValue('betaColorPlayMode', 'preview');
            this.settings.betaColorPlayMode = (rawColorMode === 'review') ? 'review' : 'preview';
            this.settings.betaCapsuleUndo = getBool('betaCapsuleUndo', true);
            this.settings.betaDeepLinking = getBool('betaDeepLinking', true);
            this.settings.betaDbEndpoint = getValue('betaDbEndpoint', '') || '';
            this.settings.betaDbApiKey = getValue('betaDbApiKey', '') || '';
            this.settings.viewportDebugEnabled = getBool('viewportDebugEnabled', false);
        }
    }

    saveSettings() {
        const state = this.playerCore?.options?.playerState;
        if (state) {
            state.saveSettings();
        } else {
            setValue('showProgressBar', this.settings.showProgressBar);
            setValue('showSeekControlRow', this.settings.showSeekControlRow);
            setValue('showLoopControlRow', this.settings.showLoopControlRow);
            setValue('showPlaybackControlRow', this.settings.showPlaybackControlRow);
            setValue('enabledSeekSteps', this.settings.enabledSeekSteps);
            setValue('showCommentsSection', this.settings.showCommentsSection);
            setValue('enabledCommentSources', this.settings.enabledCommentSources);
            setValue('telemetryEnabled', false);
            setValue('debugMode', this.settings.debugMode);
            setValue('debugFilterHasNumbers', this.settings.debugFilterHasNumbers);
            setValue('crazyScrapeMode', Boolean(this.settings.crazyScrapeMode));
            setValue('pauseOnBlur', this.settings.pauseOnBlur);
            setValue('buttonSoundEnabled', this.settings.buttonSoundEnabled);
            setValue('defaultMuted', this.settings.defaultMuted);
            setValue('muteResetMinutes', this.settings.muteResetMinutes);
            setValue('autoCheckUpdate', this.settings.autoCheckUpdate);
            setValue('betaMode', this.settings.betaMode);
            setValue('betaFirstCapsulePlay', this.settings.betaFirstCapsulePlay);
            setValue('betaColorPlayMode', this.settings.betaColorPlayMode);
            setValue('betaCapsuleUndo', this.settings.betaCapsuleUndo);
            setValue('betaDeepLinking', this.settings.betaDeepLinking);
            setValue('betaDbEndpoint', this.settings.betaDbEndpoint);
            setValue('betaDbApiKey', this.settings.betaDbApiKey);
            setValue('viewportDebugEnabled', Boolean(this.settings.viewportDebugEnabled));
        }
    }

    updateControlRowsVisibility() {
        const controlManager = this.controlManager;
        if (!controlManager) return;

        if (controlManager.progressContainer) {
            controlManager.progressContainer.classList.toggle('is-hidden', !this.settings.showProgressBar);
        }
        if (controlManager.controlButtonsContainer) {
            const seekRow = controlManager.controlButtonsContainer.querySelector('.tm-seek-control-row');
            const loopRow = controlManager.controlButtonsContainer.querySelector('.tm-loop-control-row');
            const playbackRow = controlManager.controlButtonsContainer.querySelector('.tm-playback-control-row');

            if (seekRow) seekRow.classList.toggle('is-hidden', !this.settings.showSeekControlRow);
            if (loopRow) loopRow.classList.toggle('is-hidden', !this.settings.showLoopControlRow);
            if (playbackRow) playbackRow.classList.toggle('is-hidden', !this.settings.showPlaybackControlRow);
        }
    }

    updateSetting(key, value) {
        const state = this.playerCore?.options?.playerState;
        if (state) {
            state.updateSetting(key, value);
            this.settings = state.settings;
        } else {
            this.settings[key] = value;
            this.saveSettings();
        }
    }
}
