import {
    createGroup,
    createToggleRow,
    createSegmentedRow,
    createAccordionCard,
    bindTwoStepConfirm
} from '../components/S2Primitives.js';
import { DebugLogPanel } from '../../../ui/DebugLogPanel.js';
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
        this._crazyRow = null;
        this._render();
    }

    getElement() {
        return this.element;
    }

    refresh() {
        this._render();
    }

    refreshCrazyAvailability() {
        if (!this._crazyRow) return;
        const canEnable = CrazyScraper.canEnable();
        const desc = canEnable
            ? (__('crazyScrapeDesc') || '浏览列表时在后台自动抓取关联影片评论')
            : (__('crazyScrapeDisabledDesc') || '需开启「实验功能 → 社区共享」或配置 WebDAV 后方可启用');
        this._crazyRow.setDisabled(!canEnable, desc);
        if (!canEnable) {
            this._crazyRow.setChecked(false);
            if (this.settings.crazyScrapeMode) {
                this.sm.updateSetting('crazyScrapeMode', false);
            }
            CrazyScraper.stop();
        }
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

                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm) {
                            if (typeof hm.setEnabled === 'function') {
                                hm.setEnabled(Boolean(checked && this.settings.betaHeatmap));
                            }
                            if (typeof hm.setCrowdEnabled === 'function') {
                                hm.setCrowdEnabled(Boolean(checked && this.settings.dataMode === 'shared'));
                            }
                        }
                        this.refreshCrazyAvailability();
                    }
                });
                body.appendChild(masterRow.element);

                // 1. 开播定位首个片段
                const firstCapRow = createToggleRow({
                    title: __('betaFirstCapsulePlay') || '开播定位首个高光',
                    checked: Boolean(this.settings.betaFirstCapsulePlay),
                    onChange: (checked) => {
                        this.sm.updateSetting('betaFirstCapsulePlay', checked);
                    }
                });
                subWrap.appendChild(firstCapRow.element);

                // 2. 显示播放热度 + 仅观察全网波形子开关
                const hmSubWrap = document.createElement('div');
                hmSubWrap.className = `mp-s2-conditional ${this.settings.betaHeatmap ? '' : 'is-hidden'}`.trim();

                const heatmapRow = createToggleRow({
                    title: __('betaHeatmap') || '显示播放热度',
                    checked: Boolean(this.settings.betaHeatmap),
                    onChange: (checked) => {
                        this.sm.updateSetting('betaHeatmap', checked);
                        hmSubWrap.classList.toggle('is-hidden', !checked);
                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm && typeof hm.setEnabled === 'function') {
                            hm.setEnabled(checked);
                        }
                    }
                });
                subWrap.appendChild(heatmapRow.element);

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

                // 3. 数据模式（独立于播放热度开关：控制热度波形、评论采集共享与解析错误上报）
                const initDataMode = this.settings.dataMode === 'shared' ? 'shared' : 'local';
                const dataModeRow = createSegmentedRow({
                    title: __('dataMode') || '数据模式',
                    subtext: initDataMode === 'shared'
                        ? (__('dataModeSharedDesc') || '共享全网观看热度波形，并同步支持社区评论采集共享与解析错误上报。')
                        : (__('dataModeLocalDesc') || '断开公共网络通信，足迹、评论缓存及标记仅留存于本机与私有 WebDAV。'),
                    options: [
                        { label: __('dataModeLocal') || '本地私有', value: 'local' },
                        { label: __('dataModeShared') || '社区共享', value: 'shared' }
                    ],
                    value: initDataMode,
                    stacked: true,
                    onChange: (val) => {
                        this.sm.updateSetting('dataMode', val);
                        const subEl = dataModeRow.element.querySelector('.mp-s2-row-sub');
                        if (subEl) {
                            subEl.textContent = val === 'shared'
                                ? (__('dataModeSharedDesc') || '共享全网观看热度波形，并同步支持社区评论采集共享与解析错误上报。')
                                : (__('dataModeLocalDesc') || '断开公共网络通信，足迹、评论缓存及标记仅留存于本机与私有 WebDAV。');
                        }
                        const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                        if (hm && typeof hm.setCrowdEnabled === 'function') {
                            hm.setCrowdEnabled(Boolean(this.settings.betaMode) && val === 'shared');
                        }
                        this.refreshCrazyAvailability();
                    }
                });
                subWrap.appendChild(dataModeRow.element);

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
                        const commentPanel = this.sm.controlManager?.commentPanel;
                        if (commentPanel && typeof commentPanel.updateDebugMode === 'function') {
                            commentPanel.updateDebugMode(checked);
                        }
                        setStatus(checked ? (__('s2DebugActive') || '调试开启') : (__('s2NormalState') || '正常'), checked ? 'warn' : 'muted');
                    }
                });
                body.appendChild(debugRow.element);

                const canEnableCrazy = CrazyScraper.canEnable();
                const preloadRow = createToggleRow({
                    title: __('crazyScrapeTitle') || '疯狂采集模式',
                    subtext: canEnableCrazy
                        ? (__('crazyScrapeDesc') || '浏览列表时在后台自动抓取关联影片评论')
                        : (__('crazyScrapeDisabledDesc') || '需开启「实验功能 → 社区共享」或配置 WebDAV 后方可启用'),
                    checked: canEnableCrazy && Boolean(this.settings.crazyScrapeMode),
                    disabled: !canEnableCrazy,
                    onChange: (checked) => {
                        if (!CrazyScraper.canEnable()) {
                            this.refreshCrazyAvailability();
                            return;
                        }
                        this.sm.updateSetting('crazyScrapeMode', checked);
                        if (checked) {
                            CrazyScraper.start(this.sm.controlManager?.commentPanel?.videoCode || '');
                        } else {
                            CrazyScraper.stop();
                        }
                    }
                });
                this._crazyRow = preloadRow;
                body.appendChild(preloadRow.element);

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
        const isChecking = Boolean(this.sm?._isCheckingUpdate);
        const isExpanded = hasUpdate || (this.sm ? this.sm.isSectionExpanded('s2_about', false) : false);

        this.aboutAccordion = createAccordionCard({
            iconSvg: ICON_INFO_CIRCLE,
            title: __('s2About') || '版本与更新',
            statusText: `v${currentVersion}`,
            statusTone: 'muted',
            expanded: isExpanded,
            onToggle: (open) => {
                if (this.sm) {
                    this.sm.setSectionExpanded('s2_about', open);
                    if (open && !this.sm._latestUpdateInfo && !this.sm._isCheckingUpdate) {
                        this.sm.checkUpdate(false, false);
                    }
                }
            },
            buildBody: (body) => {
                const currentChannel = this.settings.updateChannel || 'stable';
                const isBetaChannel = currentChannel === 'beta';
                const meta = updateInfo?.meta;

                // 1. 更新通道
                const channelRow = createSegmentedRow({
                    title: __('updateChannel') || '更新通道',
                    options: [
                        { label: __('channelStable') || '正式版', value: 'stable' },
                        { label: __('channelBeta') || '测试版', value: 'beta' }
                    ],
                    value: currentChannel,
                    onChange: (val) => {
                        this.sm.updateSetting('updateChannel', val);
                        this.sm._latestUpdateInfo = null;
                        this.sm.checkUpdate(false, true).finally(() => {
                            this.refresh();
                        });
                    }
                });
                body.appendChild(channelRow.element);

                // 2. 操作按钮区
                const form = document.createElement('div');
                form.className = 'mp-s2-form';

                const actions = document.createElement('div');
                actions.className = 'mp-s2-actions';

                const checkBtn = document.createElement('button');
                checkBtn.type = 'button';
                checkBtn.className = hasUpdate ? 'mp-s2-btn' : 'mp-s2-btn mp-s2-btn--primary';
                checkBtn.disabled = isChecking;
                checkBtn.innerHTML = `${ICON_REFRESH} <span>${isChecking ? '检查中…' : (__('checkUpdate') || '检查更新')}</span>`;
                checkBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.sm.checkUpdate(true, true);
                    this.refresh();
                });
                actions.appendChild(checkBtn);

                const handler = detectScriptHandler();
                const cleanUrl = getCleanScriptUrl(currentChannel, meta);

                const installBtn = document.createElement('button');
                installBtn.type = 'button';
                installBtn.className = hasUpdate ? 'mp-s2-btn is-update-available' : 'mp-s2-btn';
                installBtn.innerHTML = `${ICON_DOWNLOAD} <span>${__('s2UpdateInstall') || '更新/安装'}</span>`;
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
