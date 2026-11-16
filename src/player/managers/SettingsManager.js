import { getValue, setValue, Toast } from "../../utils/index.js";
import { __ } from "../../constants/i18n.js";
import { telemetry } from "../../telemetry/index.js";
import { SleazyForkService } from "../../services/SleazyForkService.js";
import { sanitizeSeekStepList } from "../state/PlayerState.js";
import { playTapSound } from "../../utils/sound.js";
import { DebugLogPanel } from "../ui/DebugLogPanel.js";
import { CrazyScraper } from "../comments/CrazyScraper.js";

/**
 * SettingsManager — 设置状态、持久化和检查更新控制器
 * 所有设置 UI 渲染已统一收敛至 SettingsV2Manager；本类专注底层状态同步、控制行可见性与更新检测。
 */
export class SettingsManager {
    constructor(playerCore, uiElements = {}, uiManager = null, controlManager = null) {
        this.playerCore = playerCore;
        this.uiManager = uiManager || (playerCore ? playerCore.uiManager : null);
        this.controlManager = controlManager || (playerCore ? playerCore.controlManager : null);
        this.settingsV2Manager = null;
        this.uiElements = uiElements || {};
        this.settingsPanel = this.uiElements.settingsPanel || null;

        this._latestUpdateInfo = null;
        this._isCheckingUpdate = false;
        this._sectionExpandedStates = {
            cloudSync: false,
            about: false
        };

        this.settings = {
            showProgressBar: true,
            showSeekControlRow: true,
            showLoopControlRow: true,
            showPlaybackControlRow: true,
            enabledSeekSteps: ['5s', '10s', '30s', '1m', '5m', '10m'],
            customUserSeekSteps: [],
            showCommentsSection: true,
            enabledCommentSources: { jable: true, javdb: true, javlibrary: false },
            telemetryEnabled: false,
            debugMode: false,
            debugFilterHasNumbers: false,
            crazyScrapeMode: false,
            pauseOnBlur: true,
            buttonSoundEnabled: true,
            defaultMuted: true,
            muteResetMinutes: 5,
            betaPlayMode: 'normal',
            previewDurationSeconds: 5,
            climaxDurationSeconds: 60,
            betaMode: false,
            betaFirstCapsulePlay: false,
            betaColorPlayMode: 'preview',
            betaCapsuleUndo: true,
            betaDeepLinking: true,
            betaDbEndpoint: '',
            betaDbApiKey: '',
            viewportDebugEnabled: false,
            autoCheckUpdate: true,
            updateChannel: 'stable'
        };

        this.loadSettings();
    }

    /**
     * 读取或写入区块折叠状态
     */
    isSectionExpanded(sectionId, defaultVal = false) {
        try {
            const stored = localStorage.getItem(`mp_sec_exp_${sectionId}`);
            if (stored !== null) return stored === 'true';
        } catch (e) { /* ignore */ }
        return defaultVal;
    }

    setSectionExpanded(sectionId, isExpanded) {
        try {
            localStorage.setItem(`mp_sec_exp_${sectionId}`, isExpanded ? 'true' : 'false');
        } catch (e) { /* ignore */ }
    }

    /**
     * 刷新“版本与更新”区块（单一设置面板）
     */
    refreshAboutSection() {
        if (this.settingsV2Manager) {
            this.settingsV2Manager.refreshAdvancedSection();
        }
    }

    /**
     * 刷新“云端同步”区块
     */
    refreshCloudSyncSection() {
        if (this.settingsV2Manager?.refreshConnectionsSection) {
            this.settingsV2Manager.refreshConnectionsSection();
        }
    }

    /**
     * 执行检查更新（自动与手动共用；有更新时仅通过“更新/安装”按钮呼吸灯发光提示）
     * @param {boolean} isManual - 是否由用户主动点击触发
     * @param {boolean} bypassCache - 是否穿透本地缓存
     */
    async checkUpdate(isManual = false, bypassCache = false) {
        if (this._isCheckingUpdate) return null;
        this._isCheckingUpdate = true;
        this.refreshAboutSection();

        try {
            const channel = this.settings.updateChannel || 'stable';
            const res = await SleazyForkService.checkUpdate(bypassCache, channel);
            this._latestUpdateInfo = res;
            this._isCheckingUpdate = false;

            if (res && res.success) {
                if (!res.hasUpdate && isManual) {
                    Toast.show(__('alreadyLatest') || '当前已是最新版本', 2500, 'success');
                }
            } else if (isManual) {
                Toast.show(__('checkUpdateError') || '检查更新失败，请稍后重试', 3000, 'error');
            }

            this.refreshAboutSection();
            return res;
        } catch (err) {
            this._isCheckingUpdate = false;
            if (isManual) {
                Toast.show(__('checkUpdateError') || '检查更新失败，请稍后重试', 3000, 'error');
            }
            this.refreshAboutSection();
            return null;
        }
    }

    /**
     * 设置关联的管理器与 UI 元素引用
     */
    setManagers(uiManager, controlManager, uiElements) {
        this.uiManager = uiManager;
        this.controlManager = controlManager;
        this.uiElements = uiElements;

        if (this.settingsV2Manager && uiManager?.settingsPanel) {
            this.settingsV2Manager.setPanel(uiManager.settingsPanel);
        }

        return this;
    }

    /**
     * 初始化设置管理器
     */
    init() {
        this.syncState();
        DebugLogPanel.updateDebugState(this.settings.debugMode);
        if (CrazyScraper.isEnabled()) {
            setTimeout(() => CrazyScraper.start(this.controlManager?.commentPanel?.videoCode || ''), 2500);
        }
        this.updateControlRowsVisibility();

        // 播放器初始化 3 秒后静默检查一次更新（仅内部刷新状态与呼吸灯）
        const runSilentCheck = () => {
            if (this._latestUpdateInfo) return;
            this.checkUpdate(false, false);
        };

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => setTimeout(runSilentCheck, 2500));
        } else {
            setTimeout(runSilentCheck, 3000);
        }

        return this;
    }

    /**
     * 同步 PlayerState 中的数据引用
     */
    syncState() {
        const state = this.playerCore?.options?.playerState;
        if (state && state.settings) {
            this.settings = state.settings;
        } else {
            this.loadSettings();
        }
    }

    /**
     * 重新创建控制面板中的快进快退按钮行
     */
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

    /**
     * 切换并更新设置面板的可见状态（统一委托给 SettingsV2Manager）
     */
    toggleSettingsPanel() {
        playTapSound();
        this.settingsV2Manager?.toggle();
    }

    /**
     * 关闭设置面板
     */
    closeSettingsPanel() {
        this.settingsV2Manager?.close();
    }

    /**
     * 清理设置管理器资源
     */
    cleanup() {
        this.closeSettingsPanel();
    }

    /**
     * 加载设置
     */
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
            this.settings.updateChannel = getValue('updateChannel', 'stable') === 'beta' ? 'beta' : 'stable';
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

    /**
     * 保存设置
     */
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
            setValue('defaultMuted', Boolean(this.settings.defaultMuted));
            setValue('muteResetMinutes', this.settings.muteResetMinutes || 5);
            setValue('autoCheckUpdate', this.settings.autoCheckUpdate !== false);
            setValue('updateChannel', this.settings.updateChannel || 'stable');
            setValue('betaPlayMode', this.settings.betaPlayMode || 'normal');
            setValue('previewDurationSeconds', this.settings.previewDurationSeconds || 5);
            setValue('climaxDurationSeconds', this.settings.climaxDurationSeconds || 60);
            setValue('betaMode', Boolean(this.settings.betaMode));
            setValue('betaFirstCapsulePlay', Boolean(this.settings.betaFirstCapsulePlay));
            setValue('betaColorPlayMode', this.settings.betaColorPlayMode || 'preview');
            setValue('betaCapsuleUndo', Boolean(this.settings.betaCapsuleUndo));
            setValue('betaDeepLinking', Boolean(this.settings.betaDeepLinking));
            setValue('betaDbEndpoint', this.settings.betaDbEndpoint || '');
            setValue('betaDbApiKey', this.settings.betaDbApiKey || '');
            setValue('viewportDebugEnabled', Boolean(this.settings.viewportDebugEnabled));
        }
    }

    /**
     * 更新控制行的可见性
     */
    updateControlRowsVisibility() {
        const controlButtonsContainer = this.controlManager?.controlButtonsContainer || this.uiElements?.controlButtonsContainer || this.uiManager?.shadowRoot?.querySelector('.tm-control-buttons') || document.querySelector('.tm-control-buttons');
        if (!controlButtonsContainer) return;

        const seekControlRow = controlButtonsContainer.querySelector('.tm-seek-control-row');
        const loopControlRow = controlButtonsContainer.querySelector('.tm-loop-control-row');
        const playbackControlRow = controlButtonsContainer.querySelector('.tm-playback-control-row');
        const progressRow = controlButtonsContainer.querySelector('.tm-progress-row');

        if (progressRow) {
            progressRow.classList.toggle('is-hidden', !this.settings.showProgressBar);
        }

        if (seekControlRow) {
            seekControlRow.classList.remove('is-hidden');
        }

        if (loopControlRow) {
            loopControlRow.classList.toggle('is-hidden', !this.settings.showLoopControlRow);
        }

        if (playbackControlRow) {
            playbackControlRow.classList.toggle('is-hidden', !this.settings.showPlaybackControlRow);
        }
    }

    /**
     * 更新指定设置项
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        const state = this.playerCore?.options?.playerState;
        if (state) {
            state.updateSetting(key, value);
        } else {
            this.saveSettings();
        }

        telemetry.track('setting_toggle_ui', { key, value });
        if (key === 'debugMode') {
            telemetry.track('setting_debug_mode', { debug_mode: !!value });
        }

        if (key.startsWith('show') && key.endsWith('Row')) {
            this.updateControlRowsVisibility();
        }

        if (key === 'defaultMuted' || key === 'muteResetMinutes') {
            if (this.controlManager?.volumeController) {
                this.controlManager.volumeController.onSettingsChanged();
            }
        }

        if (key === 'betaMode' || key === 'dataMode') {
            this.refreshCrazyScrapeAvailability();
        }
    }

    /**
     * 销毁与清理设置管理器资源
     */
    cleanup() {
        this.settingsV2Manager?.cleanup?.();
        this.settingsPanel = null;
    }

    /**
     * 刷新疯狂采集模式前置条件可用状态（需开启实验功能社区共享 或 配置 WebDAV）
     */
    refreshCrazyScrapeAvailability() {
        this.settingsV2Manager?.refreshCrazyAvailability?.();
    }
}
