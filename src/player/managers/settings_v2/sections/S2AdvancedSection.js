import {
    createGroup,
    createToggleRow,
    createSegmentedRow,
    createAccordionCard,
    bindTwoStepConfirm
} from '../components/S2Primitives.js';
import { DebugLogPanel } from '../../../ui/DebugLogPanel.js';
import { ViewportDebugHUD } from '../../../ui/ViewportDebugHUD.js';
import { CrazyScraper } from '../../../comments/CrazyScraper.js';
import { CommentCacheManager } from '../../../comments/CommentCacheManager.js';
import {
    getCurrentVersion,
    detectScriptHandler,
    getCleanScriptUrl,
    dispatchScriptInstall,
    GITHUB_COMMITS_URL
} from '../../../../services/SleazyForkService.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';
import {
    ICON_FLASK,
    ICON_TERMINAL,
    ICON_INFO_CIRCLE,
    ICON_REFRESH,
    ICON_DOWNLOAD,
    ICON_EXTERNAL_LINK
} from '../../../../constants/icons.js';

export class S2AdvancedSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = createGroup(__('s2AdvancedGroup') || '高级与关于');
        this.aboutAccordion = null;
        this._render();
    }

    getElement() {
        return this.element;
    }

    refresh() {
        this._render();
    }

    _buildBetaAccordion() {
        const isBetaOn = Boolean(this.settings.betaMode);
        const isExpanded = this.sm ? this.sm.isSectionExpanded('s2_beta', false) : false;

        return createAccordionCard({
            iconSvg: ICON_FLASK,
            title: __('s2BetaLabs') || '实验功能',
            statusText: isBetaOn ? (__('s2Enabled') || '已开启') : (__('s2Disabled') || '已关闭'),
            statusTone: isBetaOn ? 'info' : 'muted',
            expanded: isExpanded,
            onToggle: (open) => {
                if (this.sm) this.sm.setSectionExpanded('s2_beta', open);
            },
            buildBody: (body, { setStatus }) => {
                const subWrap = document.createElement('div');
                subWrap.className = `mp-s2-conditional ${isBetaOn ? '' : 'is-hidden'}`.trim();

                const masterRow = createToggleRow({
                    title: __('betaMode') || '开启实验功能',
                    checked: isBetaOn,
                    onChange: (checked) => {
                        this.sm.updateSetting('betaMode', checked);
                        subWrap.classList.toggle('is-hidden', !checked);
                        setStatus(checked ? (__('s2Enabled') || '已开启') : (__('s2Disabled') || '已关闭'), checked ? 'info' : 'muted');

                        const shMgr = this.sm.controlManager?.singleHandManager || this.sm.playerCore?.singleHandManager;
                        if (shMgr && typeof shMgr.refreshVisibility === 'function') {
                            shMgr.refreshVisibility();
                        }
                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm && typeof hm.refreshBetaState === 'function') {
                            hm.refreshBetaState();
                        }
                    }
                });
                body.appendChild(masterRow.element);

                // 1. 竖屏单手模式
                const singleHandRow = createToggleRow({
                    title: __('betaSingleHandMode') || '竖屏单手模式',
                    checked: this.settings.betaSingleHandMode !== false,
                    onChange: (checked) => {
                        this.sm.updateSetting('betaSingleHandMode', checked);
                        const shMgr = this.sm.controlManager?.singleHandManager || this.sm.playerCore?.singleHandManager;
                        if (shMgr && typeof shMgr.refreshVisibility === 'function') {
                            shMgr.refreshVisibility();
                        }
                    }
                });
                subWrap.appendChild(singleHandRow.element);

                // 2. 开播定位首个片段
                const firstCapRow = createToggleRow({
                    title: __('betaFirstCapsulePlay') || '开播定位首个高光',
                    checked: Boolean(this.settings.betaFirstCapsulePlay),
                    onChange: (checked) => {
                        this.sm.updateSetting('betaFirstCapsulePlay', checked);
                    }
                });
                subWrap.appendChild(firstCapRow.element);

                // 3. 防误删除撤销
                const undoRow = createToggleRow({
                    title: __('betaCapsuleUndo') || '片段删除撤销',
                    subtext: __('betaCapsuleUndoDesc') || '删除后保留 60 秒可撤销',
                    checked: this.settings.betaCapsuleUndo !== false,
                    onChange: (checked) => {
                        this.sm.updateSetting('betaCapsuleUndo', checked);
                    }
                });
                subWrap.appendChild(undoRow.element);

                // 4. 深链分享还原
                const deepLinkRow = createToggleRow({
                    title: __('betaDeepLinking') || '高光链接还原',
                    checked: this.settings.betaDeepLinking !== false,
                    onChange: (checked) => {
                        this.sm.updateSetting('betaDeepLinking', checked);
                    }
                });
                subWrap.appendChild(deepLinkRow.element);

                // 5. 播放热度曲线 + 数据模式子区块
                const hmSubWrap = document.createElement('div');
                hmSubWrap.className = `mp-s2-conditional ${this.settings.betaHeatmap ? '' : 'is-hidden'}`.trim();

                const heatmapRow = createToggleRow({
                    title: __('betaHeatmap') || '播放热度曲线',
                    checked: Boolean(this.settings.betaHeatmap),
                    onChange: (checked) => {
                        this.sm.updateSetting('betaHeatmap', checked);
                        hmSubWrap.classList.toggle('is-hidden', !checked);
                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm && typeof hm.refreshBetaState === 'function') {
                            hm.refreshBetaState();
                        }
                    }
                });
                subWrap.appendChild(heatmapRow.element);

                const dataModeRow = createSegmentedRow({
                    title: __('dataModeTitle') || '热度数据模式',
                    options: [
                        { label: __('dataModeLocal') || '本地私有', value: 'local' },
                        { label: __('dataModeShared') || '社区共享', value: 'shared' }
                    ],
                    value: this.settings.dataMode === 'shared' ? 'shared' : 'local',
                    onChange: (val) => {
                        this.sm.updateSetting('dataMode', val);
                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm && typeof hm.refreshBetaState === 'function') {
                            hm.refreshBetaState();
                        }
                    }
                });
                hmSubWrap.appendChild(dataModeRow.element);

                const hidePrivateRow = createToggleRow({
                    title: __('hidePrivateData') || '仅观察全网波形',
                    checked: Boolean(this.settings.hidePrivateData),
                    onChange: (checked) => {
                        this.sm.updateSetting('hidePrivateData', checked);
                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm && typeof hm.setPrivateDataHidden === 'function') {
                            hm.setPrivateDataHidden(checked);
                        }
                    }
                });
                hmSubWrap.appendChild(hidePrivateRow.element);

                subWrap.appendChild(hmSubWrap);
                body.appendChild(subWrap);
            }
        }).element;
    }

    _buildDebugAccordion() {
        const isDebugOn = Boolean(this.settings.debugMode);
        const isExpanded = this.sm ? this.sm.isSectionExpanded('s2_debug', false) : false;

        return createAccordionCard({
            iconSvg: ICON_TERMINAL,
            title: __('s2DebugCache') || '调试与缓存',
            statusText: isDebugOn ? (__('s2DebugActive') || '调试开启') : (__('s2NormalState') || '正常'),
            statusTone: isDebugOn ? 'warn' : 'muted',
            expanded: isExpanded,
            onToggle: (open) => {
                if (this.sm) this.sm.setSectionExpanded('s2_debug', open);
            },
            buildBody: (body, { setStatus }) => {
                const debugRow = createToggleRow({
                    title: __('debugModeTitle') || '悬浮调试日志',
                    checked: isDebugOn,
                    onChange: (checked) => {
                        this.sm.updateSetting('debugMode', checked);
                        DebugLogPanel.updateDebugState(checked);
                        setStatus(checked ? (__('s2DebugActive') || '调试开启') : (__('s2NormalState') || '正常'), checked ? 'warn' : 'muted');
                    }
                });
                body.appendChild(debugRow.element);

                const preloadRow = createToggleRow({
                    title: __('crazyScrapeTitle') || '后台静默预载评论',
                    checked: Boolean(this.settings.crazyScrapeMode),
                    onChange: (checked) => {
                        this.sm.updateSetting('crazyScrapeMode', checked);
                        if (checked) {
                            CrazyScraper.start(this.sm.controlManager?.commentPanel?.videoCode || '');
                        } else {
                            CrazyScraper.stop();
                        }
                    }
                });
                body.appendChild(preloadRow.element);

                const hudRow = createToggleRow({
                    title: '视口物理探针 (HUD)',
                    checked: Boolean(this.settings.viewportDebugEnabled),
                    onChange: (checked) => {
                        this.sm.updateSetting('viewportDebugEnabled', checked);
                        const uiMgr = this.sm.uiManager || this.sm.playerCore?.uiManager;
                        if (checked) {
                            ViewportDebugHUD.init(uiMgr?.playerContainer, uiMgr?.shadowRoot);
                        } else {
                            ViewportDebugHUD.destroy();
                        }
                    }
                });
                body.appendChild(hudRow.element);

                const actionForm = document.createElement('div');
                actionForm.className = 'mp-s2-form';

                const clearBtn = document.createElement('button');
                clearBtn.type = 'button';
                clearBtn.className = 'mp-s2-btn mp-s2-btn--danger';
                const normalHtml = `<span>${__('betaClearCache') || '清空本地离线评论缓存'}</span>`;
                clearBtn.innerHTML = normalHtml;

                bindTwoStepConfirm(clearBtn, {
                    normalHtml,
                    confirmText: '确认彻底清空本地缓存?',
                    onConfirm: async () => {
                        clearBtn.disabled = true;
                        clearBtn.textContent = '清理中…';
                        await CommentCacheManager.clearAll();
                        CrazyScraper._completedCodes.clear();
                        CrazyScraper._scannedCodes.clear();
                        CrazyScraper._avcodeDurations.clear();
                        clearBtn.disabled = false;
                        clearBtn.innerHTML = normalHtml;
                        Toast('已彻底清空本地评论缓存', 2000, 'success');
                    }
                });

                actionForm.appendChild(clearBtn);
                body.appendChild(actionForm);
            }
        }).element;
    }

    _buildAboutAccordion() {
        const currentVersion = getCurrentVersion();
        const updateInfo = this.sm?._latestUpdateInfo;
        const hasUpdate = Boolean(updateInfo?.hasUpdate);
        const latestVer = updateInfo?.latestVersion || currentVersion;
        const isChecking = Boolean(this.sm?._isCheckingUpdate);
        const isExpanded = this.sm ? this.sm.isSectionExpanded('s2_about', false) : false;

        let statusText = `v${currentVersion}`;
        let statusTone = 'muted';
        if (isChecking) {
            statusText = '检查中…';
            statusTone = 'info';
        } else if (hasUpdate) {
            statusText = `新版 v${latestVer}`;
            statusTone = 'warn';
        }

        this.aboutAccordion = createAccordionCard({
            iconSvg: ICON_INFO_CIRCLE,
            title: __('s2About') || '版本与更新',
            statusText,
            statusTone,
            expanded: isExpanded,
            onToggle: (open) => {
                if (this.sm) this.sm.setSectionExpanded('s2_about', open);
            },
            buildBody: (body) => {
                const currentChannel = this.settings.updateChannel || 'stable';
                const isBetaChannel = currentChannel === 'beta';
                const meta = updateInfo?.meta;

                // 1. 更新通道
                const channelRow = createSegmentedRow({
                    title: __('updateChannelTitle') || '更新通道',
                    subtext: isBetaChannel ? 'GitHub dev 分支即时测试版' : 'SleazyFork 稳定正式版',
                    options: [
                        { label: __('channelStable') || '正式版', value: 'stable' },
                        { label: __('channelBeta') || '测试版', value: 'beta' }
                    ],
                    value: currentChannel,
                    onChange: (val) => {
                        this.sm.updateSetting('updateChannel', val);
                        this.sm._latestUpdateInfo = null;
                        this.sm.checkUpdate(false, false).finally(() => {
                            this.refresh();
                        });
                    }
                });
                body.appendChild(channelRow.element);

                // 2. 自动检查更新
                const autoCheckRow = createToggleRow({
                    title: __('autoCheckUpdateTitle') || '启动时自动检查更新',
                    checked: this.settings.autoCheckUpdate !== false,
                    onChange: (checked) => {
                        this.sm.updateSetting('autoCheckUpdate', checked);
                    }
                });
                body.appendChild(autoCheckRow.element);

                // 3. 版本信息与操作按钮区
                const form = document.createElement('div');
                form.className = 'mp-s2-form';

                const metaLine = document.createElement('div');
                metaLine.className = 'mp-s2-meta-line';
                const verSpan = document.createElement('span');
                verSpan.textContent = `当前版本: v${currentVersion}`;
                const dateSpan = document.createElement('span');
                dateSpan.textContent = meta?.code_updated_at ? `发布: ${meta.code_updated_at.split('T')[0]}` : 'Miss Player';
                metaLine.appendChild(verSpan);
                metaLine.appendChild(dateSpan);
                form.appendChild(metaLine);

                if (hasUpdate) {
                    const notice = document.createElement('div');
                    notice.className = 'mp-s2-status-box is-ok';
                    notice.textContent = `发现新版本 v${latestVer} (${isBetaChannel ? 'GitHub dev' : 'SleazyFork'})`;
                    form.appendChild(notice);
                }

                const actions = document.createElement('div');
                actions.className = 'mp-s2-actions';

                const checkBtn = document.createElement('button');
                checkBtn.type = 'button';
                checkBtn.className = 'mp-s2-btn mp-s2-btn--primary';
                checkBtn.disabled = isChecking;
                checkBtn.innerHTML = `${ICON_REFRESH} <span>${isChecking ? '检查中…' : (__('checkUpdateNow') || '检查更新')}</span>`;
                checkBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.sm.checkUpdate(true, true);
                    this.refresh();
                });
                actions.appendChild(checkBtn);

                const handler = detectScriptHandler();
                const cleanUrl = getCleanScriptUrl(currentChannel, meta);
                const installLabel = handler === 'stay'
                    ? 'Stay 更新/安装'
                    : (handler === 'scriptcat' ? '脚本猫更新/安装' : '一键更新/安装');

                const installBtn = document.createElement('button');
                installBtn.type = 'button';
                installBtn.className = 'mp-s2-btn';
                installBtn.innerHTML = `${ICON_DOWNLOAD} <span>${installLabel}</span>`;
                installBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetHandler = handler === 'unknown' ? 'tampermonkey' : handler;
                    dispatchScriptInstall(targetHandler, cleanUrl, {
                        isUpdate: hasUpdate,
                        onToast: (msg, type) => Toast.show(msg, 2500, type)
                    });
                });
                actions.appendChild(installBtn);

                const logBtn = document.createElement('button');
                logBtn.type = 'button';
                logBtn.className = 'mp-s2-btn';
                logBtn.innerHTML = `${ICON_EXTERNAL_LINK} <span>${__('updateChangelog') || '版本日志'}</span>`;
                logBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const logUrl = isBetaChannel
                        ? GITHUB_COMMITS_URL
                        : 'https://sleazyfork.org/scripts/453300/versions';
                    if (typeof GM_openInTab === 'function') {
                        GM_openInTab(logUrl, { active: true });
                    } else {
                        window.open(logUrl, '_blank');
                    }
                });
                actions.appendChild(logBtn);

                form.appendChild(actions);
                body.appendChild(form);
            }
        });

        return this.aboutAccordion.element;
    }

    _render() {
        const oldLabel = this.element.querySelector('.mp-s2-group-label');
        this.element.innerHTML = '';
        if (oldLabel) this.element.appendChild(oldLabel);

        this.element.appendChild(this._buildBetaAccordion());
        this.element.appendChild(this._buildDebugAccordion());
        this.element.appendChild(this._buildAboutAccordion());
    }
}
