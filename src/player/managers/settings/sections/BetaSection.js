import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { createGroupHeader, createActionRow } from '../components/SettingsPrimitives.js';
import { __ } from '../../../../constants/i18n.js';
import { ICON_TERMINAL, ICON_TRASH } from '../../../../constants/icons.js';
import { Toast } from '../../../../utils/index.js';
import { CrazyScraper } from '../../../comments/CrazyScraper.js';
import { CommentCacheManager } from '../../../comments/CommentCacheManager.js';
import { DebugLogPanel } from '../../../ui/DebugLogPanel.js';
import { ViewportDebugHUD } from '../../../ui/ViewportDebugHUD.js';

export class BetaSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';
        this.element.appendChild(createGroupHeader(__('betaGroupTitle') || '实验与诊断'));

        // Card 1: 实验特性（扁平化平铺子项，零内部嵌套手风琴）
        const labCard = new AppleCard();

        const firstCapRow = new ToggleRow({
            title: __('betaSkipIntro') || '跳过片头',
            subtext: __('betaSkipIntroDesc') || '开播直达首个高光',
            checked: Boolean(this.settings.betaFirstCapsulePlay),
            onChange: (checked) => {
                this.sm.updateSetting('betaFirstCapsulePlay', checked);
            }
        }).getElement();

        const heatmapRow = new ToggleRow({
            title: __('betaHeatmap') || '播放热度',
            subtext: __('betaHeatmapDesc') || '进度条显示观看波形',
            checked: Boolean(this.settings.betaHeatmap),
            onChange: (checked) => {
                this.sm.updateSetting('betaHeatmap', checked);
                const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                if (hm) {
                    hm.setEnabled(Boolean(this.settings.betaMode && checked));
                }
            }
        }).getElement();

        const currentDataMode = this.settings.dataMode === 'shared' ? 'shared' : 'local';
        const dataModeRow = document.createElement('div');
        dataModeRow.className = 'tm-apple-row tm-apple-row--column';

        const dataModeHeader = document.createElement('div');
        dataModeHeader.className = 'tm-apple-row-split';

        const dataModeTitle = document.createElement('span');
        dataModeTitle.className = 'tm-apple-row-title';
        dataModeTitle.textContent = __('dataMode') || '数据模式';

        const dataModeDesc = document.createElement('div');
        dataModeDesc.className = 'tm-apple-row-subtext';
        const updateDataModeDesc = (val) => {
            dataModeDesc.textContent = val === 'shared'
                ? (__('dataModeSharedDesc') || '呈现全网观众高能波峰与热评，你的足迹亦将匿名共享。')
                : (__('dataModeLocalDesc') || '断开公共网络通信，所有足迹与标记仅留存于本机与私有云盘。');
        };
        updateDataModeDesc(currentDataMode);

        const dataModeSeg = new SegmentedControl({
            options: [
                { label: __('dataModeLocal') || '本地私有', value: 'local' },
                { label: __('dataModeShared') || '社区共享', value: 'shared' }
            ],
            value: currentDataMode,
            onChange: (val) => {
                this.sm.updateSetting('dataMode', val);
                updateDataModeDesc(val);
                const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                if (hm) {
                    hm.setCrowdEnabled(Boolean(this.settings.betaMode) && val === 'shared');
                }
                Toast(val === 'shared' ? '已切换至社区共享模式' : '已切换至本地私有模式', 1200, 'info');
            }
        });

        dataModeHeader.appendChild(dataModeTitle);
        dataModeHeader.appendChild(dataModeSeg.getElement());
        dataModeRow.appendChild(dataModeHeader);
        dataModeRow.appendChild(dataModeDesc);

        const hidePrivateRow = new ToggleRow({
            title: __('hidePrivateData') || '不显示私有数据',
            subtext: __('hidePrivateDataDesc') || '隐藏本机与云盘足迹，仅观察全网波形',
            checked: Boolean(this.settings.hidePrivateData),
            onChange: (checked) => {
                this.sm.updateSetting('hidePrivateData', checked);
                const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                if (hm) {
                    hm.setPrivateDataHidden(checked);
                }
            }
        }).getElement();

        const undoRow = new ToggleRow({
            title: __('betaCapsuleUndo') || '防误删除',
            subtext: __('betaCapsuleUndoDesc') || '删除保留 60 秒撤销',
            checked: this.settings.betaCapsuleUndo !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaCapsuleUndo', checked);
            }
        }).getElement();

        const deepLinkRow = new ToggleRow({
            title: __('betaDeepLinking') || '链接还原',
            subtext: __('betaDeepLinkingDesc') || '打开分享链接载入高光',
            checked: this.settings.betaDeepLinking !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaDeepLinking', checked);
            }
        }).getElement();

        const syncBetaRows = (enabled) => {
            const hidden = !enabled;
            firstCapRow.classList.toggle('is-hidden', hidden);
            heatmapRow.classList.toggle('is-hidden', hidden);
            dataModeRow.classList.toggle('is-hidden', hidden);
            hidePrivateRow.classList.toggle('is-hidden', hidden);
            undoRow.classList.toggle('is-hidden', hidden);
            deepLinkRow.classList.toggle('is-hidden', hidden);
        };
        syncBetaRows(Boolean(this.settings.betaMode));

        labCard.appendChild(new ToggleRow({
            title: __('betaLabTitle') || '实验功能',
            subtext: __('betaLabDesc') || '开启高光热力图、Peach 媒体库等开发特性',
            checked: Boolean(this.settings.betaMode),
            onChange: (checked) => {
                this.sm.updateSetting('betaMode', checked);
                syncBetaRows(checked);
                const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                if (hm) {
                    hm.setEnabled(Boolean(checked && this.settings.betaHeatmap));
                    hm.setCrowdEnabled(Boolean(checked && this.settings.dataMode === 'shared'));
                }
                if (typeof this.sm.refreshCloudSyncSection === 'function') {
                    this.sm.refreshCloudSyncSection();
                }
                const uiManager = this.sm.uiManager || this.sm.playerCore?.uiManager;
                if (uiManager && typeof uiManager.updatePeachButtonVisibility === 'function') {
                    uiManager.updatePeachButtonVisibility();
                }
                Toast(checked ? `已开启 ${__('betaLabTitle') || '实验功能'}` : `已关闭 ${__('betaLabTitle') || '实验功能'}`, 1200, 'info');
            }
        }).getElement());

        labCard.appendChild(firstCapRow);
        labCard.appendChild(heatmapRow);
        labCard.appendChild(dataModeRow);
        labCard.appendChild(hidePrivateRow);
        labCard.appendChild(undoRow);
        labCard.appendChild(deepLinkRow);
        this.element.appendChild(labCard.getElement());

        // Card 2: 调试与诊断（独立卡片，扁平展开无缩进黑盒）
        const debugCard = new AppleCard();

        const crazyRow = new ToggleRow({
            title: __('betaPreloadComments') || '预载评论',
            subtext: __('betaPreloadCommentsDesc') || '提前抓取关联影片评论',
            checked: Boolean(this.settings.crazyScrapeMode),
            onChange: (checked) => {
                this.sm.updateSetting('crazyScrapeMode', checked);
                if (checked) {
                    CrazyScraper.start(this.sm.controlManager?.commentPanel?.videoCode || '');
                } else {
                    CrazyScraper.stop();
                }
            }
        }).getElement();

        const viewportHudRow = new ToggleRow({
            title: '视口探针',
            subtext: '屏幕与触摸实时调试 HUD',
            checked: Boolean(this.settings.viewportDebugEnabled),
            onChange: (checked) => {
                this.sm.updateSetting('viewportDebugEnabled', checked);
                if (checked) {
                    const uiManager = this.sm.uiManager || this.sm.playerCore?.uiManager;
                    if (uiManager && uiManager.playerContainer && uiManager.shadowRoot) {
                        ViewportDebugHUD.init(uiManager.playerContainer, uiManager.shadowRoot);
                    }
                } else {
                    ViewportDebugHUD.destroy();
                }
            }
        }).getElement();

        const openLogRow = createActionRow({
            iconHtml: ICON_TERMINAL,
            title: '实时日志面板',
            subtext: '查看网络探测、评论采集与入库流水',
            actionLabel: __('openDebugPanel') || '打开面板',
            tone: 'accent',
            onAction: () => {
                if (this.sm && typeof this.sm.closeSettingsPanel === 'function') {
                    this.sm.closeSettingsPanel();
                }
                DebugLogPanel.open(this.sm.uiElements?.playerContainer);
            }
        });

        const clearCacheRow = createActionRow({
            iconHtml: ICON_TRASH,
            title: __('betaClearCache') || '清除缓存',
            subtext: __('betaClearCacheDesc') || '清空离线评论与本地缓存',
            actionLabel: '清理缓存',
            tone: 'danger',
            confirmTwice: true,
            confirmText: '再次点击确认',
            onAction: async (btn, helpers) => {
                btn.disabled = true;
                helpers.setLabel('清理中…');
                await CommentCacheManager.clearAll();
                CrazyScraper._completedCodes.clear();
                CrazyScraper._scannedCodes.clear();
                CrazyScraper._avcodeDurations.clear();
                helpers.setLabel('已清空');
                Toast('已彻底清空本地评论缓存', 2000, 'success');
                setTimeout(() => {
                    btn.disabled = false;
                    helpers.setLabel('清理缓存');
                }, 1500);
            }
        });

        const syncDebugRows = (enabled) => {
            const hidden = !enabled;
            crazyRow.classList.toggle('is-hidden', hidden);
            viewportHudRow.classList.toggle('is-hidden', hidden);
            openLogRow.classList.toggle('is-hidden', hidden);
            clearCacheRow.classList.toggle('is-hidden', hidden);
        };
        syncDebugRows(Boolean(this.settings.debugMode));

        debugCard.appendChild(new ToggleRow({
            title: __('debugMode') || '调试模式',
            subtext: __('debugModeDesc') || '查看控制台日志与采样数据',
            checked: Boolean(this.settings.debugMode),
            onChange: (checked) => {
                this.sm.updateSetting('debugMode', checked);
                DebugLogPanel.updateDebugState(checked);
                if (this.sm.controlManager?.commentPanel && typeof this.sm.controlManager.commentPanel.updateDebugMode === 'function') {
                    this.sm.controlManager.commentPanel.updateDebugMode(checked);
                }
                if (!checked) {
                    CrazyScraper.stop();
                } else if (this.settings.crazyScrapeMode) {
                    CrazyScraper.start(this.sm.controlManager?.commentPanel?.videoCode || '');
                }
                syncDebugRows(checked);
            }
        }).getElement());

        debugCard.appendChild(crazyRow);
        debugCard.appendChild(viewportHudRow);
        debugCard.appendChild(openLogRow);
        debugCard.appendChild(clearCacheRow);

        this.element.appendChild(debugCard.getElement());
    }

    getElement() {
        return this.element;
    }
}
