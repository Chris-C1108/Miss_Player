function sanitizeSeekStepList(arr, isCustom = false) {
    if (!Array.isArray(arr)) return isCustom ? [] : ['5s', '10s', '30s', '1m', '5m', '10m'];
    const valid = arr.filter(s => typeof s === 'string' && /^\d+[sm]$/i.test(s.trim())).map(s => s.trim().toLowerCase());
    const unique = Array.from(new Set(valid));
    return isCustom ? unique.slice(0, 30) : (unique.length > 0 ? unique : ['5s', '10s', '30s', '1m', '5m', '10m']);
}

import { getValue, setValue, Toast, playTapSound } from '../../utils/index.js';
import { telemetry } from '../../telemetry';
import { __ } from '../../constants/i18n.js';
import { SyncManager, WebDavClient, getOrCreateClientId, getDeviceName } from '../../sync/index.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import { CrazyScraper } from '../comments/CrazyScraper.js';
import { SleazyForkService, getCurrentVersion } from '../../services/SleazyForkService.js';
import {
    ICON_CLOUD_SYNC,
    ICON_CLOUD_UPLOAD,
    ICON_CLOUD_DOWNLOAD,
    ICON_EYE,
    ICON_EYE_OFF,
    ICON_CHECK,
    ICON_SERVER,
    ICON_REFRESH,
    ICON_EXTERNAL_LINK,
    ICON_DOWNLOAD,
    ICON_SPARKLES
} from '../../constants/icons.js';

/**
 * 设置管理器类 - 负责播放器设置面板及其交互功能
 */
export class SettingsManager {
    constructor(playerCore, uiElements, uiManager = null, controlManager = null) {
        // 核心引用
        this.playerCore = playerCore;
        this.uiManager = uiManager || (playerCore ? playerCore.uiManager : null);
        this.controlManager = controlManager || (playerCore ? playerCore.controlManager : null);
        this.targetVideo = playerCore?.targetVideo;
        
        // UI元素引用
        this.uiElements = uiElements;
        this.settingsPanel = uiElements.settingsPanel;
        
        // 事件处理器
        this.overlayClickHandler = null;
        
        // 用户设置
        this.settings = {
            showProgressBar: true,
            showSeekControlRow: true,
            showLoopControlRow: true,
            showPlaybackControlRow: true,
            enabledSeekSteps: ['5s', '10s', '30s', '1m', '5m', '10m'],
            showCommentsSection: true,
            enabledCommentSources: {
                jable: true,
                javdb: true,
                javlibrary: false
            },
            telemetryEnabled: false,
            debugMode: false,
            crazyScrapeMode: false,
            pauseOnBlur: true,
            buttonSoundEnabled: true,
            autoCheckUpdate: true,
            betaMode: false,
            betaFirstCapsulePlay: false,
            betaPlayMode: 'normal',
            betaColorPlayMode: 'preview',
            betaSafariMuteStyle: true,
            betaCapsuleUndo: true,
            betaDeepLinking: true,
            betaDbEndpoint: '',
            betaDbApiKey: ''
        };

        // 快进快退步进自定义展开状态
        this.showCustomSeekStepsPanel = false;
        this.isAboutExpanded = true;
        this._latestUpdateInfo = null;
        this._isCheckingUpdate = false;
    }

    setManagers(managers = {}) {
        if (managers.uiManager) this.uiManager = managers.uiManager;
        if (managers.controlManager) this.controlManager = managers.controlManager;
    }
    
    /**
     * 初始化设置管理器
     */
    init() {
        // 加载保存的设置
        this.loadSettings();
        DebugLogPanel.updateDebugState(this.settings.debugMode);
        if (this.settings.debugMode && this.settings.crazyScrapeMode) {
            setTimeout(() => CrazyScraper.start(this.controlManager?.commentPanel?.videoCode || ''), 2500);
        }
        
        // 初始应用设置到控制组件
        this.updateControlRowsVisibility();

        // 自动静默检查更新 (后台闲时执行，杜绝卡顿)
        if (this.settings.autoCheckUpdate !== false) {
            const runSilentCheck = async () => {
                try {
                    const res = await SleazyForkService.checkUpdate(false);
                    if (res && res.success) {
                        this._latestUpdateInfo = res;
                        if (res.hasUpdate) {
                            const btn = this.uiElements?.settingsBtn || this.uiManager?.settingsBtn;
                            if (btn) {
                                btn.classList.add('has-update-badge');
                                btn.setAttribute('title', `${__('updateFound') || '发现新版本'}: v${res.latestVersion}`);
                            }
                            if (this.settingsPanel && this.settingsPanel.children.length) {
                                this.createSettingsPanel();
                            }
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

        // 延迟至浏览器空闲期或首次打开时再构建庞大的设置面板 DOM，降低播放器首屏组装耗时
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => {
                if (!this.settingsPanel || !this.settingsPanel.children.length) {
                    this.createSettingsPanel();
                }
            }, { timeout: 4000 });
        } else {
            setTimeout(() => {
                if (!this.settingsPanel || !this.settingsPanel.children.length) {
                    this.createSettingsPanel();
                }
            }, 600);
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
     * 创建设置面板内容（根据截图分区设计）
     */
    createSettingsPanel() {
        if (!this.settingsPanel) return;
        this.syncState();
        this.settingsPanel.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'tm-settings-menu-container';

        // 阻止按键冒泡
        const stopProp = (e) => e.stopPropagation();
        container.addEventListener('click', stopProp);
        container.addEventListener('mousedown', stopProp);
        container.addEventListener('touchstart', stopProp);

        // =================================================================
        // SECTION 1: 遥控器 :
        // =================================================================
        const section1 = this._createSectionHeader('遥控器 :');

        // 1. 进度条栏
        const progressBarOption = this._createToggleOption(
            '进度条栏',
            'showProgressBar',
            this.settings.showProgressBar,
            (checked) => {
                this.updateSetting('showProgressBar', checked);
                this.updateControlRowsVisibility();
            }
        );

        // 2. 快进/快退栏
        const seekControlContainer = document.createElement('div');
        seekControlContainer.className = 'tm-settings-seek-wrapper';

        const seekControlOption = this._createToggleOption(
            '快进/快退栏',
            'showSeekControlRow',
            this.settings.showSeekControlRow,
            (checked) => {
                this.updateSetting('showSeekControlRow', checked);
                this.updateControlRowsVisibility();
                this.createSettingsPanel(); // 刷新子面板显示
            }
        );
        seekControlContainer.appendChild(seekControlOption);

        // 当“快进/快退栏”启用时直接展示跳转步进 Badges 子面板
        if (this.settings.showSeekControlRow) {
            const seekStepsSubPanel = this._createSeekStepsSubPanel();
            seekControlContainer.appendChild(seekStepsSubPanel);
        }

        // 3. 跳转/循环栏
        const loopControlOption = this._createToggleOption(
            '跳转/循环栏',
            'showLoopControlRow',
            this.settings.showLoopControlRow,
            (checked) => {
                this.updateSetting('showLoopControlRow', checked);
                this.updateControlRowsVisibility();
            }
        );

        section1.appendChild(progressBarOption);
        section1.appendChild(seekControlContainer);
        section1.appendChild(loopControlOption);

        // 4. 播放按钮运行模式 (正常模式 / 预览模式 / 精彩重温)
        const playModeContainer = document.createElement('div');
        playModeContainer.className = 'tm-settings-option-row';
        playModeContainer.id = 'tm-setting-playMode';
        playModeContainer.style.display = 'flex';
        playModeContainer.style.alignItems = 'center';
        playModeContainer.style.justifyContent = 'space-between';
        playModeContainer.style.padding = '8px 0';
        playModeContainer.style.borderTop = '1px solid rgba(255, 255, 255, 0.06)';
        playModeContainer.style.marginTop = '4px';

        const playModeLabelWrap = document.createElement('div');
        playModeLabelWrap.style.display = 'flex';
        playModeLabelWrap.style.flexDirection = 'column';
        playModeLabelWrap.style.gap = '2px';

        const playModeLabel = document.createElement('span');
        playModeLabel.className = 'tm-settings-label';
        playModeLabel.textContent = '播放按钮运行模式';
        playModeLabel.style.fontSize = '13px';
        playModeLabel.style.fontWeight = '600';
        playModeLabel.style.color = '#fff';

        const playModeSub = document.createElement('span');
        playModeSub.style.fontSize = '11px';
        playModeSub.style.color = 'rgba(255, 255, 255, 0.5)';
        playModeSub.textContent = '常规连贯播放、胶囊走马灯预览或高潮精彩重温';

        playModeLabelWrap.appendChild(playModeLabel);
        playModeLabelWrap.appendChild(playModeSub);

        const playModeSelect = document.createElement('select');
        playModeSelect.className = 'tm-settings-select tm-settings-playmode-select';
        playModeSelect.style.cssText = 'background: rgba(255, 255, 255, 0.12); color: #fff; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; outline: none;';
        
        const curMode = this.settings.betaPlayMode || 'normal';
        playModeSelect.innerHTML = `
            <option value="normal" ${curMode === 'normal' ? 'selected' : ''}>🎬 正常模式 (常规播放)</option>
            <option value="preview" ${curMode === 'preview' ? 'selected' : ''}>⚡ 预览模式 (各播5秒)</option>
            <option value="climax" ${curMode === 'climax' ? 'selected' : ''}>🌟 精彩重温 (区间完整/时间戳60s)</option>
        `;

        playModeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            this.updateSetting('betaPlayMode', val);
            const pb = this.controlManager?.playbackController;
            if (pb && typeof pb.updatePlayPauseButton === 'function') {
                pb.updatePlayPauseButton();
            }
            const modeNames = { normal: '正常模式', preview: '预览模式', climax: '精彩重温' };
            Toast(`已切换为: ${modeNames[val] || val}`, 2000, 'info');
        });

        playModeContainer.appendChild(playModeLabelWrap);
        playModeContainer.appendChild(playModeSelect);
        section1.appendChild(playModeContainer);

        container.appendChild(section1);

        // =================================================================
        // SECTION 2: 评论区 :
        // =================================================================
        const section2 = this._createSectionHeader('评论区 :');

        const commentsOptionContainer = document.createElement('div');
        commentsOptionContainer.className = 'tm-settings-comments-wrapper';

        const commentsToggleOption = this._createToggleOption(
            '是否展示评论区',
            'showCommentsSection',
            this.settings.showCommentsSection,
            (checked) => {
                this.updateSetting('showCommentsSection', checked);
                if (checked) {
                    // 当从关闭状态切换为开启状态时，重置用户手动隐藏侧栏配置，重新展示侧边栏
                    this.updateSetting('sidebarHidden', false);
                    if (this.uiManager) {
                        this.uiManager.isSidebarHidden = false;
                        this.uiManager.updateSidebarToggleButtonIcon();
                    }
                }
                if (this.controlManager?.commentPanel) {
                    this.controlManager.commentPanel.updateCommentsVisibility(checked);
                }
                this.createSettingsPanel(); // 刷新源 Badge 子面板
            }
        );
        commentsOptionContainer.appendChild(commentsToggleOption);

        // 仅当“是否展示评论区”开关打开时显示源 Badges 组
        if (this.settings.showCommentsSection) {
            const sourcesSubPanel = this._createCommentSourcesSubPanel();
            commentsOptionContainer.appendChild(sourcesSubPanel);
        }

        section2.appendChild(commentsOptionContainer);
        container.appendChild(section2);

        // =================================================================
        // SECTION 3: 其他 :
        // =================================================================
        const section3 = this._createSectionHeader('其他 :');

        // 1. 帮助改进 (遥测开关)
        const telemetryOption = this._createToggleOption(
            __('helpImprove') || '帮助改进',
            'telemetryEnabled',
            this.settings.telemetryEnabled !== false,
            (checked) => {
                this.updateSetting('telemetryEnabled', checked);
                if (checked) {
                    telemetry.flush(true, true);
                }
            },
            null,
            __('helpImproveDesc') || '收集必要数据用于改进功能'
        );

        let crazyOption = null;

        const debugOption = this._createToggleOption(
            'DEBUG',
            'debugMode',
            this.settings.debugMode,
            (checked) => {
                this.updateSetting('debugMode', checked);
                DebugLogPanel.updateDebugState(checked);
                if (this.controlManager?.commentPanel) {
                    this.controlManager.commentPanel.updateDebugMode(checked);
                }
                if (crazyOption) {
                    crazyOption.style.display = checked ? 'flex' : 'none';
                }
                if (clearLocalCacheBtn) {
                    clearLocalCacheBtn.style.display = checked ? 'inline-flex' : 'none';
                }
                if (!checked) {
                    CrazyScraper.stop();
                } else if (this.settings.crazyScrapeMode) {
                    CrazyScraper.start(this.controlManager?.commentPanel?.videoCode || '');
                }
            }
        );

        // 疯狂采集模式子开关 (仅在 DEBUG 开启时展示)
        crazyOption = this._createToggleOption(
            __('crazyScrapeTitle') || '疯狂采集模式',
            'crazyScrapeMode',
            Boolean(this.settings.crazyScrapeMode),
            (checked) => {
                this.updateSetting('crazyScrapeMode', checked);
                if (checked) {
                    CrazyScraper.start(this.controlManager?.commentPanel?.videoCode || '');
                } else {
                    CrazyScraper.stop();
                }
            },
            null,
            __('crazyScrapeDesc') || '自动扫描宿主页面所有关联番号，低速防爬排队采集评论语料'
        );
        crazyOption.style.display = this.settings.debugMode ? 'flex' : 'none';
        crazyOption.style.paddingLeft = '28px';

        // 清空本地评论缓存按钮
        const clearLocalCacheBtn = document.createElement('button');
        clearLocalCacheBtn.className = 'tm-about-btn tm-clear-comments-cache-btn';
        clearLocalCacheBtn.style.cssText = 'background: rgba(255, 59, 48, 0.15); border: 1px solid rgba(255, 59, 48, 0.45); color: #ff3b30; font-size: 11px; padding: 4px 10px; border-radius: 6px; cursor: pointer; margin-left: 28px; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; width: fit-content;';
        clearLocalCacheBtn.innerHTML = '<span>🗑️ 清空本地评论缓存</span>';
        clearLocalCacheBtn.title = '清空本地已采集的评论缓存 (IndexedDB 及内存)，重置已采集记录以便重新全量采集';
        clearLocalCacheBtn.style.display = this.settings.debugMode ? 'inline-flex' : 'none';
        clearLocalCacheBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            CommentCacheManager.clear();
            CrazyScraper._completedCodes.clear();
            CrazyScraper._scannedCodes.clear();
            Toast('已成功清空本地评论缓存与已抓取记录！', 2000, 'success');
        });

        // 3. 失焦后停止播放开关 (默认为开)
        const pauseOnBlurOption = this._createToggleOption(
            __('pauseOnBlur') || '失焦后停止播放',
            'pauseOnBlur',
            this.settings.pauseOnBlur !== false,
            (checked) => {
                this.updateSetting('pauseOnBlur', checked);
            },
            null,
            __('pauseOnBlurDesc') || '页面离开或失去焦点时自动暂停播放'
        );

        // 4. 按键点击音效开关 (默认为开)
        const buttonSoundOption = this._createToggleOption(
            __('buttonSound') || '按键点击音效',
            'buttonSoundEnabled',
            this.settings.buttonSoundEnabled !== false,
            (checked) => {
                this.updateSetting('buttonSoundEnabled', checked);
                if (checked) {
                    playTapSound(true);
                }
            },
            null,
            __('buttonSoundDesc') || '点击控制面板按钮时播放清脆触控反馈音效'
        );


        section3.appendChild(pauseOnBlurOption);
        section3.appendChild(buttonSoundOption);
        section3.appendChild(debugOption);
        section3.appendChild(crazyOption);
        section3.appendChild(clearLocalCacheBtn);
        container.appendChild(section3);

        // =================================================================
        // SECTION: Beta 实验室 (Beta Lab) :
        // =================================================================
        const sectionBeta = this._createSectionHeader('Beta 实验室 :');
        const betaWrapper = document.createElement('div');
        betaWrapper.className = 'tm-settings-beta-wrapper';

        let betaSubPanel = null;

        // 1. Beta 实验室总开关
        const betaMainToggle = this._createToggleOption(
            'Beta 实验室总开关',
            'betaMode',
            Boolean(this.settings.betaMode),
            (checked) => {
                this.updateSetting('betaMode', checked);
                if (betaSubPanel) {
                    betaSubPanel.style.display = checked ? 'flex' : 'none';
                }
                Toast(checked ? '已开启 Beta 实验室' : '已关闭 Beta 实验室', 1200, 'info');
            },
            null,
            '抢先体验实验性新功能，所有测试特性均在此集中受控'
        );
        betaWrapper.appendChild(betaMainToggle);

        // 2. Beta 子特性面板
        betaSubPanel = document.createElement('div');
        betaSubPanel.className = 'tm-settings-beta-subpanel';
        betaSubPanel.style.display = this.settings.betaMode ? 'flex' : 'none';
        betaSubPanel.style.flexDirection = 'column';
        betaSubPanel.style.paddingLeft = '20px';
        betaSubPanel.style.borderLeft = '2px solid hsla(var(--shadcn-primary) / 0.3)';
        betaSubPanel.style.marginLeft = '12px';
        betaSubPanel.style.marginTop = '6px';
        betaSubPanel.style.gap = '8px';

        // 子项 A: 从首个胶囊开播
        const firstCapsuleOption = this._createToggleOption(
            '开播定位至首个胶囊',
            'betaFirstCapsulePlay',
            Boolean(this.settings.betaFirstCapsulePlay),
            (checked) => {
                this.updateSetting('betaFirstCapsulePlay', checked);
            },
            null,
            '载入视频时优先从已有胶囊列表第 1 个开播；若无胶囊则恢复上次断点'
        );
        betaSubPanel.appendChild(firstCapsuleOption);

        // 子项 C: Safari 风格红色静音
        const safariMuteOption = this._createToggleOption(
            'Safari 风格高对比静音',
            'betaSafariMuteStyle',
            this.settings.betaSafariMuteStyle !== false,
            (checked) => {
                this.updateSetting('betaSafariMuteStyle', checked);
            },
            null,
            '音量归零或静音时，以 Safari 标志性红底白图标呈现'
        );
        betaSubPanel.appendChild(safariMuteOption);

        // 子项 D: 胶囊删除 60 秒撤销
        const capsuleUndoOption = this._createToggleOption(
            '胶囊删除撤销保护',
            'betaCapsuleUndo',
            this.settings.betaCapsuleUndo !== false,
            (checked) => {
                this.updateSetting('betaCapsuleUndo', checked);
            },
            null,
            '删除胶囊后 1 分钟内在管理面板提供撤销恢复按钮'
        );
        betaSubPanel.appendChild(capsuleUndoOption);

        // 子项 E: URL 参数深链导入
        const deepLinkingOption = this._createToggleOption(
            'URL 参数深链胶囊导入',
            'betaDeepLinking',
            this.settings.betaDeepLinking !== false,
            (checked) => {
                this.updateSetting('betaDeepLinking', checked);
            },
            null,
            '自动识别分享链接中的时间轴与倍速参数并挂载'
        );
        betaSubPanel.appendChild(deepLinkingOption);

        // 子项 F: 评论分析外部数据库配置 (REST / Supabase / CouchDB)
        const dbConfigContainer = document.createElement('div');
        dbConfigContainer.className = 'tm-settings-option-row tm-beta-db-row';
        dbConfigContainer.style.flexDirection = 'column';
        dbConfigContainer.style.alignItems = 'flex-start';
        dbConfigContainer.style.gap = '6px';
        dbConfigContainer.innerHTML = `
            <div class="tm-settings-option-label">自建评论分析数据库 (REST API)</div>
            <div class="tm-settings-option-subtext">配置个人远端数据库端点，优先于公共源查询聚合评论</div>
            <input type="text" class="tm-settings-input tm-beta-db-url" placeholder="https://your-api.domain.com/comments" value="${this.settings.betaDbEndpoint || ''}" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 12px;" />
            <input type="password" class="tm-settings-input tm-beta-db-key" placeholder="API Key / Token (可选)" value="${this.settings.betaDbApiKey || ''}" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 12px;" />
        `;
        const dbUrlInput = dbConfigContainer.querySelector('.tm-beta-db-url');
        const dbKeyInput = dbConfigContainer.querySelector('.tm-beta-db-key');
        const saveDbConfig = () => {
            this.updateSetting('betaDbEndpoint', dbUrlInput.value.trim());
            this.updateSetting('betaDbApiKey', dbKeyInput.value.trim());
        };
        dbUrlInput.addEventListener('change', saveDbConfig);
        dbUrlInput.addEventListener('blur', saveDbConfig);
        dbKeyInput.addEventListener('change', saveDbConfig);
        dbKeyInput.addEventListener('blur', saveDbConfig);
        betaSubPanel.appendChild(dbConfigContainer);

        betaWrapper.appendChild(betaSubPanel);
        sectionBeta.appendChild(betaWrapper);
        container.appendChild(sectionBeta);

        // =================================================================
        // SECTION 4: 云端同步 (WebDAV) :
        // =================================================================
        const webdavConfig = SyncManager.getWebDavConfig();
        const hasWebdavConfig = Boolean(webdavConfig.url);
        const lastSync = SyncManager.getLastSyncTime();
        const statusSummary = hasWebdavConfig
            ? (lastSync > 0 ? ` (已配置)` : ` (未同步)`)
            : ` (点击展开)`;

        const section4 = document.createElement('div');
        section4.className = 'tm-settings-section';

        const header4 = this._createSectionHeader(
            (__('webdavTitle') || '云端同步 (WebDAV) :') + statusSummary,
            true,
            this.isWebDavExpanded || false,
            (expanded) => {
                this.isWebDavExpanded = expanded;
                if (webdavCard) {
                    webdavCard.style.display = expanded ? 'flex' : 'none';
                }
            }
        );

        const webdavCard = this._createWebDavSyncCard();
        webdavCard.style.display = this.isWebDavExpanded ? 'flex' : 'none';

        section4.appendChild(header4);
        section4.appendChild(webdavCard);
        container.appendChild(section4);

        // =================================================================
        // SECTION 5: 关于与更新 (About & Updates) :
        // =================================================================
        const currentVersion = getCurrentVersion();
        const hasUpdate = Boolean(this._latestUpdateInfo?.hasUpdate);
        const updateSummary = hasUpdate
            ? ` (${__('updateFound') || '发现新版本'} v${this._latestUpdateInfo.latestVersion})`
            : ` (v${currentVersion})`;

        const section5 = document.createElement('div');
        section5.className = 'tm-settings-section';

        const header5 = this._createSectionHeader(
            (__('aboutAndUpdates') || '关于与更新 :') + updateSummary,
            true,
            this.isAboutExpanded !== false,
            (expanded) => {
                this.isAboutExpanded = expanded;
                if (aboutCard) {
                    aboutCard.style.display = expanded ? 'flex' : 'none';
                }
            }
        );

        const aboutCard = this._createAboutCard();
        aboutCard.style.display = (this.isAboutExpanded !== false) ? 'flex' : 'none';

        section5.appendChild(header5);
        section5.appendChild(aboutCard);
        container.appendChild(section5);

        this.settingsPanel.appendChild(container);
    }

    /**
     * 创建 Section 标题与分割线 (支持可折叠选项)
     */
    _createSectionHeader(titleText, collapsible = false, isExpanded = true, onToggle = null) {
        const sectionHeaderWrap = document.createElement('div');
        sectionHeaderWrap.className = 'tm-settings-section-header-wrap';

        const header = document.createElement('div');
        header.className = `tm-settings-section-header ${collapsible ? 'collapsible' : ''}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = titleText;
        header.appendChild(titleSpan);

        if (collapsible) {
            const arrowSpan = document.createElement('span');
            arrowSpan.className = `tm-settings-header-arrow ${isExpanded ? 'expanded' : ''}`;
            arrowSpan.textContent = '▼';
            header.appendChild(arrowSpan);

            header.addEventListener('click', () => {
                const willExpand = !arrowSpan.classList.contains('expanded');
                if (willExpand) {
                    arrowSpan.classList.add('expanded');
                } else {
                    arrowSpan.classList.remove('expanded');
                }
                if (typeof onToggle === 'function') {
                    onToggle(willExpand);
                }
            });
        }

        const divider = document.createElement('div');
        divider.className = 'tm-settings-section-divider';

        sectionHeaderWrap.appendChild(header);
        sectionHeaderWrap.appendChild(divider);
        return sectionHeaderWrap;
    }

    /**
     * 创建 WebDAV 云同步卡片与控制表单
     */
    _createWebDavSyncCard() {
        const card = document.createElement('div');
        card.className = 'tm-settings-webdav-card';

        const config = SyncManager.getWebDavConfig();
        const clientId = getOrCreateClientId();
        const deviceName = getDeviceName();

        // 1. 服务器地址 (URL)
        const urlRow = document.createElement('div');
        urlRow.className = 'tm-webdav-form-row';
        const urlLabel = document.createElement('label');
        urlLabel.className = 'tm-webdav-label';
        urlLabel.textContent = __('webdavServerUrl') || '服务器地址';
        const urlInput = document.createElement('input');
        urlInput.className = 'tm-webdav-input';
        urlInput.type = 'text';
        urlInput.placeholder = 'https://dav.jianguoyun.com/dav/';
        urlInput.value = config.url || '';
        urlInput.addEventListener('change', () => {
            config.url = urlInput.value.trim();
            SyncManager.saveWebDavConfig(config);
        });
        urlRow.appendChild(urlLabel);
        urlRow.appendChild(urlInput);

        // 2. 用户名 (Username)
        const userRow = document.createElement('div');
        userRow.className = 'tm-webdav-form-row';
        const userLabel = document.createElement('label');
        userLabel.className = 'tm-webdav-label';
        userLabel.textContent = __('webdavUsername') || '用户名';
        const userInput = document.createElement('input');
        userInput.className = 'tm-webdav-input';
        userInput.type = 'text';
        userInput.placeholder = 'username@example.com';
        userInput.value = config.user || '';
        userInput.addEventListener('change', () => {
            config.user = userInput.value.trim();
            SyncManager.saveWebDavConfig(config);
        });
        userRow.appendChild(userLabel);
        userRow.appendChild(userInput);

        // 3. 密码 / 应用授权码 (Password) 带明文切换眼睛
        const passRow = document.createElement('div');
        passRow.className = 'tm-webdav-form-row';
        const passLabel = document.createElement('label');
        passLabel.className = 'tm-webdav-label';
        passLabel.textContent = __('webdavPassword') || '密码 / 应用授权码';
        
        const passInputGroup = document.createElement('div');
        passInputGroup.className = 'tm-webdav-input-group';
        
        const passInput = document.createElement('input');
        passInput.className = 'tm-webdav-input has-eye';
        passInput.type = 'password';
        passInput.placeholder = '••••••••••••';
        passInput.value = config.pass || '';
        passInput.addEventListener('change', () => {
            config.pass = passInput.value;
            SyncManager.saveWebDavConfig(config);
        });

        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'tm-webdav-eye-btn';
        eyeBtn.type = 'button';
        eyeBtn.innerHTML = ICON_EYE;
        eyeBtn.title = '切换密码可见性';
        eyeBtn.addEventListener('click', () => {
            if (passInput.type === 'password') {
                passInput.type = 'text';
                eyeBtn.innerHTML = ICON_EYE_OFF;
            } else {
                passInput.type = 'password';
                eyeBtn.innerHTML = ICON_EYE;
            }
        });

        passInputGroup.appendChild(passInput);
        passInputGroup.appendChild(eyeBtn);
        passRow.appendChild(passLabel);
        passRow.appendChild(passInputGroup);

        // 4. 备份目录路径 (Path)
        const pathRow = document.createElement('div');
        pathRow.className = 'tm-webdav-form-row';
        const pathLabel = document.createElement('label');
        pathLabel.className = 'tm-webdav-label';
        pathLabel.textContent = __('webdavBackupPath') || '备份目录路径';
        const pathInput = document.createElement('input');
        pathInput.className = 'tm-webdav-input';
        pathInput.type = 'text';
        pathInput.placeholder = '/MissPlayer/';
        pathInput.value = config.path || '/MissPlayer/';
        pathInput.addEventListener('change', () => {
            config.path = pathInput.value.trim() || '/MissPlayer/';
            SyncManager.saveWebDavConfig(config);
        });
        pathRow.appendChild(pathLabel);
        pathRow.appendChild(pathInput);

        // 5. 自动同步开关行 (Auto Sync Switch with title + subtitle)
        const autoSyncRow = document.createElement('div');
        autoSyncRow.className = 'tm-webdav-switch-row';
        
        const autoSyncInfo = document.createElement('div');
        autoSyncInfo.className = 'tm-webdav-switch-info';
        
        const autoSyncTitle = document.createElement('span');
        autoSyncTitle.className = 'tm-webdav-switch-title';
        autoSyncTitle.textContent = __('webdavAutoSync') || '自动同步';
        
        const autoSyncDesc = document.createElement('span');
        autoSyncDesc.className = 'tm-webdav-switch-desc';
        autoSyncDesc.textContent = __('webdavAutoSyncDesc') || '启动及打点修改时自动在后台静默合并';

        autoSyncInfo.appendChild(autoSyncTitle);
        autoSyncInfo.appendChild(autoSyncDesc);

        const autoSyncSwitch = document.createElement('label');
        autoSyncSwitch.className = 'tm-switch';
        const autoSyncCheckbox = document.createElement('input');
        autoSyncCheckbox.type = 'checkbox';
        autoSyncCheckbox.checked = config.autoSync !== false;
        autoSyncCheckbox.addEventListener('change', () => {
            config.autoSync = autoSyncCheckbox.checked;
            SyncManager.saveWebDavConfig(config);
            if (config.autoSync && config.url) {
                SyncManager.triggerAutoSync(this.playerCore?.options?.playerState, 'startup');
            }
        });
        const autoSyncSlider = document.createElement('span');
        autoSyncSlider.className = 'tm-slider round';
        autoSyncSwitch.appendChild(autoSyncCheckbox);
        autoSyncSwitch.appendChild(autoSyncSlider);

        autoSyncRow.appendChild(autoSyncInfo);
        autoSyncRow.appendChild(autoSyncSwitch);

        // 6. 当前设备标识
        const deviceBadge = document.createElement('div');
        deviceBadge.className = 'tm-webdav-device-badge';
        deviceBadge.innerHTML = `${ICON_SERVER} <span>${__('webdavCurrentDevice') || '当前设备'}: ${deviceName} (${clientId.slice(-6)})</span>`;

        // 7. 操作按钮容器
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'tm-webdav-actions-container';

        // 智能合并同步 (Primary Hero Button)
        const syncMergeBtn = document.createElement('button');
        syncMergeBtn.className = 'tm-webdav-btn tm-webdav-btn-primary';
        syncMergeBtn.innerHTML = `${ICON_CLOUD_SYNC} <span>${__('webdavSyncMerge') || '智能合并同步'}</span>`;

        // 次级操作三列等宽网格 (Sub-Actions Row)
        const subActions = document.createElement('div');
        subActions.className = 'tm-webdav-sub-actions';

        // 测试连接 (Secondary)
        const testBtn = document.createElement('button');
        testBtn.className = 'tm-webdav-btn tm-webdav-btn-secondary';
        testBtn.title = '测试 WebDAV 服务器连通性并创建目录';
        testBtn.innerHTML = `${ICON_CHECK} <span>${__('webdavTestConnection') || '测试连接'}</span>`;

        // 向上覆盖 (Upload Overwrite)
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'tm-webdav-btn tm-webdav-btn-secondary';
        uploadBtn.title = '将当前本地配置与打点覆盖到云端';
        uploadBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>${__('webdavUploadOverwrite') || '上传覆盖'}</span>`;

        // 向下覆盖 (Download Overwrite)
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'tm-webdav-btn tm-webdav-btn-secondary';
        downloadBtn.title = '从云端拉取配置覆盖当前设备';
        downloadBtn.innerHTML = `${ICON_CLOUD_DOWNLOAD} <span>${__('webdavDownloadOverwrite') || '下载覆盖'}</span>`;

        subActions.appendChild(testBtn);
        subActions.appendChild(uploadBtn);
        subActions.appendChild(downloadBtn);

        actionsContainer.appendChild(syncMergeBtn);
        actionsContainer.appendChild(subActions);

        // 7. 状态栏 (上次同步时间 & 状态)
        const statusBar = document.createElement('div');
        statusBar.className = 'tm-webdav-status-bar';

        const timeSpan = document.createElement('span');
        const renderTimeText = () => {
            const lastSyncTime = SyncManager.getLastSyncTime();
            const timeText = lastSyncTime > 0
                ? new Date(lastSyncTime).toLocaleString()
                : (__('webdavNeverSynced') || '尚未同步');
            timeSpan.textContent = `${__('webdavLastSync') || '上次同步'}: ${timeText}`;
        };
        renderTimeText();

        const statusBadge = document.createElement('span');
        statusBadge.className = 'tm-webdav-status-badge';
        statusBadge.style.display = 'none';

        statusBar.appendChild(timeSpan);
        statusBar.appendChild(statusBadge);

        // 保存即时配置辅助函数
        const persistCurrentInputs = () => {
            config.url = urlInput.value.trim();
            config.user = userInput.value.trim();
            config.pass = passInput.value;
            config.path = pathInput.value.trim() || '/MissPlayer/';
            SyncManager.saveWebDavConfig(config);
            return config;
        };

        const updateStatus = (text, type = 'success') => {
            this._lastWebDavStatus = { text, type, time: Date.now() };
            statusBadge.style.display = 'inline-flex';
            statusBadge.className = `tm-webdav-status-badge ${type}`;
            if (type === 'running') {
                statusBadge.innerHTML = `<span class="tm-spinner-sm"></span> <span>${text}</span>`;
            } else if (type === 'success') {
                statusBadge.innerHTML = `<span>✓</span> <span>${text}</span>`;
            } else if (type === 'error') {
                statusBadge.innerHTML = `<span>✕</span> <span>${text}</span>`;
            } else {
                statusBadge.textContent = text;
            }
        };

        // 若近期有状态更新，重新创建面板时自动恢复展示
        if (this._lastWebDavStatus && Date.now() - this._lastWebDavStatus.time < 5 * 60 * 1000) {
            updateStatus(this._lastWebDavStatus.text, this._lastWebDavStatus.type);
        }

        const setButtonsDisabled = (disabled) => {
            [syncMergeBtn, testBtn, uploadBtn, downloadBtn].forEach(b => {
                b.disabled = disabled;
            });
        };

        // --- 事件绑定 ---

        // 1. 测试连接
        testBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                updateStatus('请输入服务器地址', 'error');
                return;
            }
            setButtonsDisabled(true);
            testBtn.innerHTML = `<span>${__('webdavTesting') || '正在测试...'}</span>`;
            updateStatus('正在测试连接...', 'running');
            try {
                const res = await WebDavClient.testConnection(currentCfg);
                Toast(res.message || '连接成功！', 3000);
                updateStatus('连接正常', 'success');
            } catch (err) {
                Toast((__('webdavTestFailed') || '连接失败: ') + err.message, 4000);
                updateStatus(err.message ? `连接失败: ${err.message}` : '连接失败', 'error');
            } finally {
                testBtn.innerHTML = `${ICON_CHECK} <span>${__('webdavTestConnection') || '测试连接'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 2. 智能合并同步
        syncMergeBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                updateStatus('请输入服务器地址', 'error');
                return;
            }
            setButtonsDisabled(true);
            syncMergeBtn.innerHTML = `<span>${__('webdavSyncing') || '正在同步...'}</span>`;
            updateStatus('正在智能合并同步...', 'running');
            try {
                const res = await SyncManager.executeSync({
                    mode: 'merge',
                    config: currentCfg,
                    playerState: this.playerCore?.options?.playerState
                });
                Toast(res.message || '云端多端合并同步成功！', 3000);
                this._lastWebDavStatus = { text: '同步成功', type: 'success', time: Date.now() };
                this.createSettingsPanel(); // 刷新面板显示最新合并设置与状态徽标
            } catch (err) {
                Toast((__('webdavSyncFailed') || '同步失败: ') + err.message, 4500);
                updateStatus(err.message ? `同步失败: ${err.message}` : '同步失败', 'error');
                syncMergeBtn.innerHTML = `${ICON_CLOUD_SYNC} <span>${__('webdavSyncMerge') || '智能合并同步'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 3. 向上覆盖 (Upload Overwrite)
        uploadBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                updateStatus('请输入服务器地址', 'error');
                return;
            }
            if (!window.confirm(__('webdavConfirmUpload') || '确定要将当前本地配置强制覆盖到云端吗？')) {
                return;
            }
            setButtonsDisabled(true);
            uploadBtn.innerHTML = `<span>${__('webdavSyncing') || '正在上传...'}</span>`;
            updateStatus('正在上传覆盖云端...', 'running');
            try {
                const res = await SyncManager.executeSync({
                    mode: 'upload',
                    config: currentCfg,
                    playerState: this.playerCore?.options?.playerState
                });
                Toast(res.message || '已成功覆盖云端备份！', 3000);
                updateStatus('已上传覆盖', 'success');
                renderTimeText();
            } catch (err) {
                Toast((__('webdavSyncFailed') || '上传失败: ') + err.message, 4500);
                updateStatus(err.message ? `上传失败: ${err.message}` : '上传失败', 'error');
            } finally {
                uploadBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>${__('webdavUploadOverwrite') || '上传覆盖'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 4. 向下覆盖 (Download Overwrite)
        downloadBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                updateStatus('请输入服务器地址', 'error');
                return;
            }
            if (!window.confirm(__('webdavConfirmDownload') || '确定要从云端拉取配置并覆盖本地吗？')) {
                return;
            }
            setButtonsDisabled(true);
            downloadBtn.innerHTML = `<span>${__('webdavSyncing') || '正在下载...'}</span>`;
            updateStatus('正在从云端拉取覆盖...', 'running');
            try {
                const res = await SyncManager.executeSync({
                    mode: 'download',
                    config: currentCfg,
                    playerState: this.playerCore?.options?.playerState
                });
                Toast(res.message || '已成功从云端覆盖本地！', 3000);
                this._lastWebDavStatus = { text: '已下载覆盖', type: 'success', time: Date.now() };
                this.createSettingsPanel(); // 刷新面板显示最新覆盖设置与状态徽标
            } catch (err) {
                Toast((__('webdavSyncFailed') || '下载失败: ') + err.message, 4500);
                updateStatus(err.message ? `下载失败: ${err.message}` : '下载失败', 'error');
                downloadBtn.innerHTML = `${ICON_CLOUD_DOWNLOAD} <span>${__('webdavDownloadOverwrite') || '下载覆盖'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 组装卡片
        card.appendChild(urlRow);
        card.appendChild(userRow);
        card.appendChild(passRow);
        card.appendChild(pathRow);
        card.appendChild(autoSyncRow);
        card.appendChild(deviceBadge);
        card.appendChild(actionsContainer);
        card.appendChild(statusBar);

        return card;
    }

    /**
     * 创建“关于与更新”卡片 (基于 SleazyFork 官方 JSON API)
     */
    _createAboutCard() {
        const card = document.createElement('div');
        card.className = 'tm-settings-about-card';

        const currentVersion = getCurrentVersion();
        const updateInfo = this._latestUpdateInfo;
        const meta = updateInfo?.meta;
        const hasUpdate = Boolean(updateInfo?.hasUpdate);
        const latestVer = updateInfo?.latestVersion || currentVersion;

        // 1. 顶部 Header (品牌名 + 版本徽章 + SleazyFork 快捷跳转)
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-about-header-row';

        const brandWrap = document.createElement('div');
        brandWrap.className = 'tm-about-brand-wrap';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'tm-about-brand-title';
        titleSpan.textContent = 'Miss Player';

        const versionBadge = document.createElement('span');
        versionBadge.className = `tm-about-version-badge ${hasUpdate ? 'is-update' : ''}`;
        versionBadge.innerHTML = hasUpdate
            ? `${ICON_SPARKLES} NEW v${latestVer}`
            : `v${currentVersion}`;
        versionBadge.title = hasUpdate ? `可升级至 v${latestVer}` : `当前运行版本 v${currentVersion}`;

        brandWrap.appendChild(titleSpan);
        brandWrap.appendChild(versionBadge);

        const sleazyLink = document.createElement('a');
        sleazyLink.className = 'tm-about-link-btn';
        sleazyLink.href = meta?.url || 'https://sleazyfork.org/scripts/453300';
        sleazyLink.target = '_blank';
        sleazyLink.rel = 'noopener noreferrer';
        sleazyLink.title = __('viewRelease') || 'SleazyFork 主页';
        sleazyLink.innerHTML = `<span>SleazyFork</span> ${ICON_EXTERNAL_LINK}`;

        headerRow.appendChild(brandWrap);
        headerRow.appendChild(sleazyLink);
        card.appendChild(headerRow);

        // 2. 社区活跃度指标（来自 SleazyFork JSON API）
        const statsGrid = document.createElement('div');
        statsGrid.className = 'tm-about-stats-grid';

        const formatNumber = (num) => {
            if (num === null || num === undefined) return '--';
            const n = Number(num);
            return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
        };

        const totalInstalls = meta?.total_installs !== undefined ? formatNumber(meta.total_installs) : (updateInfo ? '5.6k+' : '--');
        const fanScore = meta?.fan_score !== undefined ? `${meta.fan_score}` : '--';
        const updatedDate = meta?.code_updated_at ? meta.code_updated_at.split('T')[0] : '--';

        const createStatBox = (val, label) => {
            const box = document.createElement('div');
            box.className = 'tm-about-stat-box';
            const valEl = document.createElement('span');
            valEl.className = 'tm-about-stat-val';
            valEl.textContent = val;
            const lblEl = document.createElement('span');
            lblEl.className = 'tm-about-stat-lbl';
            lblEl.textContent = label;
            box.appendChild(valEl);
            box.appendChild(lblEl);
            return box;
        };

        statsGrid.appendChild(createStatBox(totalInstalls, __('statsInstalls') || '总安装量'));
        statsGrid.appendChild(createStatBox(fanScore, __('statsRating') || '好评评分'));
        statsGrid.appendChild(createStatBox(updatedDate, __('statsUpdated') || '代码更新'));
        card.appendChild(statsGrid);

        // 3. 若检测到新版本，渲染高亮提醒与立即升级区域
        if (hasUpdate) {
            const updateBanner = document.createElement('div');
            updateBanner.className = 'tm-about-update-banner';

            const bannerTitle = document.createElement('div');
            bannerTitle.className = 'tm-about-update-title';
            bannerTitle.innerHTML = `${ICON_SPARKLES} <strong>${__('updateFound') || '发现新版本'} v${latestVer}</strong>`;

            const bannerDesc = document.createElement('div');
            bannerDesc.className = 'tm-about-update-desc';
            bannerDesc.textContent = `当前安装为 v${currentVersion}，新版本已在 SleazyFork 发布 (${updatedDate})。`;

            const bannerActions = document.createElement('div');
            bannerActions.className = 'tm-about-update-actions';

            const updateNowBtn = document.createElement('button');
            updateNowBtn.className = 'tm-about-btn tm-about-btn--primary';
            updateNowBtn.innerHTML = `${ICON_DOWNLOAD} <span>${__('updateNow') || '立即更新'}</span>`;
            updateNowBtn.addEventListener('click', () => {
                const codeUrl = meta?.code_url || `https://update.sleazyfork.org/scripts/453300/Miss%20Player%20%7C%20%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F%20%28%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8%29.user.js`;
                if (typeof GM_openInTab === 'function') {
                    GM_openInTab(codeUrl, { active: true });
                } else {
                    window.open(codeUrl, '_blank');
                }
                Toast.show(__('updating') || '已触发脚本更新安装', 3000, 'success');
            });

            const changelogBtn = document.createElement('button');
            changelogBtn.className = 'tm-about-btn tm-about-btn--secondary';
            changelogBtn.innerHTML = `${ICON_EXTERNAL_LINK} <span>${__('updateChangelog') || '版本日志'}</span>`;
            changelogBtn.addEventListener('click', () => {
                const versionsUrl = 'https://sleazyfork.org/scripts/453300/versions';
                if (typeof GM_openInTab === 'function') {
                    GM_openInTab(versionsUrl, { active: true });
                } else {
                    window.open(versionsUrl, '_blank');
                }
            });

            bannerActions.appendChild(updateNowBtn);
            bannerActions.appendChild(changelogBtn);
            updateBanner.appendChild(bannerTitle);
            updateBanner.appendChild(bannerDesc);
            updateBanner.appendChild(bannerActions);
            card.appendChild(updateBanner);
        }

        // 4. 手动检查更新操作行
        const checkRow = document.createElement('div');
        checkRow.className = 'tm-about-check-row';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'tm-about-btn tm-about-btn--check';
        checkBtn.innerHTML = `${ICON_REFRESH} <span>${this._isCheckingUpdate ? (__('checkingUpdate') || '正在检查...') : (__('checkUpdate') || '检查更新')}</span>`;
        if (this._isCheckingUpdate) {
            checkBtn.disabled = true;
            checkBtn.classList.add('is-loading');
        }

        checkBtn.addEventListener('click', async () => {
            if (this._isCheckingUpdate) return;
            this._isCheckingUpdate = true;
            checkBtn.disabled = true;
            checkBtn.classList.add('is-loading');
            checkBtn.innerHTML = `${ICON_REFRESH} <span>${__('checkingUpdate') || '正在检查...'}</span>`;

            try {
                const res = await SleazyForkService.checkUpdate(true);
                this._latestUpdateInfo = res;
                if (res.success) {
                    if (res.hasUpdate) {
                        Toast.show(`${__('updateFound') || '发现新版本'}: v${res.latestVersion}`, 3500, 'success');
                        const btn = this.uiElements?.settingsBtn || this.uiManager?.settingsBtn;
                        if (btn) btn.classList.add('has-update-badge');
                    } else {
                        Toast.show(`${__('alreadyLatest') || '当前已是最新版本'} (v${currentVersion})`, 3000, 'success');
                        const btn = this.uiElements?.settingsBtn || this.uiManager?.settingsBtn;
                        if (btn) btn.classList.remove('has-update-badge');
                    }
                } else {
                    Toast.show(res.error || __('fetchFailed') || '检查更新失败', 3000, 'error');
                }
            } catch (err) {
                Toast.show(err.message || __('fetchFailed') || '检查更新失败', 3000, 'error');
            } finally {
                this._isCheckingUpdate = false;
                this.createSettingsPanel();
            }
        });

        checkRow.style.display = 'flex';
        checkRow.style.gap = '8px';
        checkRow.style.flexWrap = 'wrap';

        const reinstallBtn = document.createElement('button');
        reinstallBtn.className = 'tm-about-btn tm-about-btn--reinstall';
        reinstallBtn.style.cssText = 'background: rgba(255, 149, 0, 0.18); border: 1px solid rgba(255, 149, 0, 0.45); color: #ff9500; font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600;';
        reinstallBtn.innerHTML = '<span>⚡ 强制重新安装</span>';
        reinstallBtn.title = '无论版本号是否变化，直接唤起油猴重新安装最新发布代码 (带时间戳刷新缓存，开发测试利器)';
        reinstallBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const timestamp = Date.now();
            const installUrl = 'https://update.sleazyfork.org/scripts/453300/Miss%20Player%20%7C%20%E5%BD%B1%E9%99%A2%E6%A8%A1%E5%BC%8F%20%28%E5%8D%95%E6%89%8B%E6%92%AD%E6%94%BE%E5%99%A8%29.user.js?_t=' + timestamp;
            Toast('正在跳转油猴强制重新安装...', 2000, 'info');
            if (typeof GM_openInTab === 'function') {
                GM_openInTab(installUrl, { active: true });
            } else {
                window.open(installUrl, '_blank');
            }
        });

        checkRow.appendChild(checkBtn);
        checkRow.appendChild(reinstallBtn);
        card.appendChild(checkRow);

        // 5. 自动检查更新开关行
        const autoCheckOption = this._createToggleOption(
            __('autoCheckUpdate') || '自动检查更新',
            'autoCheckUpdate',
            this.settings.autoCheckUpdate !== false,
            (checked) => {
                this.updateSetting('autoCheckUpdate', checked);
            },
            null,
            __('autoCheckUpdateDesc') || '启动时定期静默检查并在设置按钮提示新版本'
        );
        card.appendChild(autoCheckOption);

        return card;
    }

    /**
     * 创建标准开关选项行
     */
    _createToggleOption(labelText, settingKey, initialValue, onChange, extraElement = null, subText = null) {
        const row = document.createElement('div');
        row.className = 'tm-settings-option-row';
        row.id = `tm-setting-${settingKey}`;

        const labelWrapper = document.createElement('div');
        labelWrapper.className = 'tm-settings-label-wrapper';

        const textWrapper = document.createElement('div');
        textWrapper.className = 'tm-settings-text-wrapper';

        const label = document.createElement('span');
        label.className = 'tm-settings-label';
        label.textContent = labelText;
        textWrapper.appendChild(label);

        if (subText) {
            const sub = document.createElement('span');
            sub.className = 'tm-settings-subtext';
            sub.textContent = subText;
            textWrapper.appendChild(sub);
        }

        labelWrapper.appendChild(textWrapper);

        if (extraElement) {
            labelWrapper.appendChild(extraElement);
        }

        // 开关组件
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'tm-toggle-switch';
        toggleContainer.style.pointerEvents = 'none'; // 避免子元素事件拦截或与行点击冲突

        const isChecked = Boolean(initialValue);
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = isChecked;
        toggleInput.className = 'tm-toggle-input';

        const toggleSlider = document.createElement('span');
        toggleSlider.className = isChecked ? 'tm-toggle-slider checked' : 'tm-toggle-slider';

        toggleContainer.appendChild(toggleInput);
        toggleContainer.appendChild(toggleSlider);

        const toggleSwitch = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const nextChecked = !toggleInput.checked;
            toggleInput.checked = nextChecked;
            toggleSlider.className = nextChecked ? 'tm-toggle-slider checked' : 'tm-toggle-slider';
            
            if (typeof onChange === 'function') {
                onChange(nextChecked);
            }
        };

        row.addEventListener('click', toggleSwitch);

        row.appendChild(labelWrapper);
        row.appendChild(toggleContainer);

        return row;
    }



    /**
     * 创建跳转步进 (Seek Steps) Badges 组合面板（包含默认6个 + 用户自定义 + 新增按钮 + 长按删除功能）
     */
    _createSeekStepsSubPanel() {
        const subPanel = document.createElement('div');
        subPanel.className = 'tm-settings-seek-steps-subpanel';

        // 鼠标滚轮转横向滚动
        subPanel.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                subPanel.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        // 默认 6 个预设步进
        const defaultSteps = ['5s', '10s', '30s', '1m', '5m', '10m'];
        // 用户自定义步进列表
        const customSteps = Array.isArray(this.settings.customUserSeekSteps) ? this.settings.customUserSeekSteps : [];
        // 当前选中的步进列表
        const enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? this.settings.enabledSeekSteps : ['5s', '10s', '30s', '1m', '5m', '10m'];

        // 所有展示的步进项 (预设 + 自定义，且去重)
        const allDisplaySteps = [...defaultSteps];
        customSteps.forEach(step => {
            if (!allDisplaySteps.includes(step)) {
                allDisplaySteps.push(step);
            }
        });

        // 渲染每一个步进 Badge
        allDisplaySteps.forEach(stepKey => {
            const isDefault = defaultSteps.includes(stepKey);
            const isEnabled = enabledSteps.includes(stepKey);

            const badge = document.createElement('button');
            badge.type = 'button';
            badge.className = `tm-seek-step-badge${isEnabled ? ' enabled' : ' disabled'}`;
            badge.textContent = stepKey;

            // 短按与长按判别
            let isLongPressTriggered = false;
            let longPressTimer = null;

            const startLongPress = (e) => {
                isLongPressTriggered = false;
                longPressTimer = setTimeout(() => {
                    isLongPressTriggered = true;
                    if (isDefault) {
                        Toast('默认 6 个预设步进不支持删除', 2000, 'warning');
                    } else {
                        // 长按删除自定义步进
                        this._deleteCustomSeekStep(stepKey);
                    }
                }, 600);
            };

            const cancelLongPress = () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            };

            badge.addEventListener('mousedown', startLongPress);
            badge.addEventListener('mouseup', cancelLongPress);
            badge.addEventListener('mouseleave', cancelLongPress);

            badge.addEventListener('touchstart', startLongPress, { passive: true });
            badge.addEventListener('touchend', cancelLongPress);
            badge.addEventListener('touchcancel', cancelLongPress);

            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isLongPressTriggered) return;

                let steps = [...enabledSteps];
                if (isEnabled) {
                    steps = steps.filter(s => s !== stepKey);
                } else {
                    steps.push(stepKey);
                }

                this.updateSetting('enabledSeekSteps', steps);
                this.rebuildControlPanelSeekRow();
                this.createSettingsPanel();
            });

            subPanel.appendChild(badge);
        });

        // 渲染第 7 个/末尾的 '+' 按钮
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'tm-seek-step-add-btn';
        addBtn.textContent = '+';

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 点击后替换为文本输入框
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tm-seek-step-input';
            input.placeholder = '_s / _m';

            let isSubmitted = false;

            const submitValue = () => {
                if (isSubmitted) return;
                isSubmitted = true;

                const rawVal = input.value.trim().toLowerCase();
                if (!rawVal) {
                    this.createSettingsPanel();
                    return;
                }

                // 验证格式: 仅允许数字 + s 或 m (例如 15s, 2m, 45s)
                if (!/^\d+[sm]$/.test(rawVal)) {
                    Toast('格式错误，请填写如 15s 或 2m', 2500, 'warning');
                    this.createSettingsPanel();
                    return;
                }

                this._addCustomSeekStep(rawVal);
            };

            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    submitValue();
                } else if (evt.key === 'Escape') {
                    isSubmitted = true;
                    this.createSettingsPanel();
                }
            });

            input.addEventListener('blur', () => {
                submitValue();
            });

            subPanel.replaceChild(input, addBtn);
            input.focus();
        });

        subPanel.appendChild(addBtn);

        return subPanel;
    }

    /**
     * 添加新的自定义跳转步进
     */
    _addCustomSeekStep(newStep) {
        let customSteps = Array.isArray(this.settings.customUserSeekSteps) ? [...this.settings.customUserSeekSteps] : [];
        let enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? [...this.settings.enabledSeekSteps] : [];

        if (!customSteps.includes(newStep)) {
            customSteps.push(newStep);
        }
        if (!enabledSteps.includes(newStep)) {
            enabledSteps.push(newStep);
        }

        SyncManager.clearTombstone('customSeekSteps', newStep);
        this.updateSetting('customUserSeekSteps', customSteps);
        this.updateSetting('enabledSeekSteps', enabledSteps);
        this.rebuildControlPanelSeekRow();
        this.createSettingsPanel();
        Toast(`已添加自定义步进 ${newStep}`, 2000, 'success');
    }

    /**
     * 删除指定的自定义跳转步进
     */
    _deleteCustomSeekStep(targetStep) {
        let customSteps = Array.isArray(this.settings.customUserSeekSteps) ? [...this.settings.customUserSeekSteps] : [];
        let enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? [...this.settings.enabledSeekSteps] : [];

        customSteps = customSteps.filter(s => s !== targetStep);
        enabledSteps = enabledSteps.filter(s => s !== targetStep);

        SyncManager.recordTombstone('customSeekSteps', targetStep);
        this.updateSetting('customUserSeekSteps', customSteps);
        this.updateSetting('enabledSeekSteps', enabledSteps);
        this.rebuildControlPanelSeekRow();
        this.createSettingsPanel();
        Toast(`已删除自定义步进 ${targetStep}`, 2000, 'info');
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
     * 创建评论源 (Jable, JavDB, Javlibrary) Badges 子面板
     */
    _createCommentSourcesSubPanel() {
        const subPanel = document.createElement('div');
        subPanel.className = 'tm-settings-sources-subpanel';

        const sources = [
            { key: 'jable', name: 'Jable' },
            { key: 'javdb', name: 'JavDB' },
            { key: 'javlibrary', name: 'Javlibrary' }
        ];

        const enabledSources = this.settings.enabledCommentSources || { jable: true, javdb: true, javlibrary: false };

        sources.forEach(source => {
            const isEnabled = !!enabledSources[source.key];
            const badge = document.createElement('button');
            badge.type = 'button';
            // 亮色/边框代表启用，变暗/灰色代表禁用
            badge.className = `tm-source-badge${isEnabled ? ' enabled' : ' disabled'}`;
            badge.textContent = source.name;

            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextSources = { ...this.settings.enabledCommentSources };
                nextSources[source.key] = !isEnabled;
                this.updateSetting('enabledCommentSources', nextSources);
                if (this.controlManager?.commentPanel) {
                    this.controlManager.commentPanel.updateCommentSources();
                }
                this.createSettingsPanel();
            });

            subPanel.appendChild(badge);
        });

        return subPanel;
    }

    /**
     * 切换设置面板显示状态
     */
    toggleSettingsPanel() {
        if (!this.settingsPanel) return;
        const isVisible = this.settingsPanel.classList.contains('active');
        if (isVisible) {
            this.closeSettingsPanel();
        } else {
            this.syncState();
            this.createSettingsPanel();
            this.settingsPanel.classList.add('active');
            document.body.classList.add('tm-settings-active');
            this.uiElements?.playerContainer?.classList.add('tm-settings-active');
            
            // 点击外部遮罩或其它区域关闭设置面板
            this.overlayClickHandler = (e) => {
                if (!this.settingsPanel.contains(e.target) && 
                    !this.uiElements?.settingsBtn?.contains(e.target) &&
                    e.target !== this.uiElements?.settingsBtn) {
                    this.closeSettingsPanel();
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', this.overlayClickHandler);
                document.addEventListener('touchstart', this.overlayClickHandler, { passive: true });
            }, 50);
        }
    }
    
    /**
     * 关闭设置面板
     */
    closeSettingsPanel() {
        if (!this.settingsPanel) return;
        this.settingsPanel.classList.remove('active');
        document.body.classList.remove('tm-settings-active');
        this.uiElements?.playerContainer?.classList.remove('tm-settings-active');
        
        if (this.overlayClickHandler) {
            document.removeEventListener('click', this.overlayClickHandler);
            document.removeEventListener('touchstart', this.overlayClickHandler);
            this.overlayClickHandler = null;
        }
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
            this.settings.crazyScrapeMode = getBool('crazyScrapeMode', false);
            this.settings.pauseOnBlur = getBool('pauseOnBlur', true);
            this.settings.buttonSoundEnabled = getBool('buttonSoundEnabled', true);
            this.settings.autoCheckUpdate = getBool('autoCheckUpdate', true);
            const rawPm = getValue('betaPlayMode', 'normal');
            this.settings.betaPlayMode = (rawPm === 'preview' || rawPm === 'climax') ? rawPm : 'normal';
            this.settings.betaMode = getBool('betaMode', false);
            this.settings.betaFirstCapsulePlay = getBool('betaFirstCapsulePlay', false);
            const rawPlayMode = getValue('betaColorPlayMode', 'preview');
            this.settings.betaColorPlayMode = (rawPlayMode === 'review') ? 'review' : 'preview';
            this.settings.betaSafariMuteStyle = getBool('betaSafariMuteStyle', true);
            this.settings.betaCapsuleUndo = getBool('betaCapsuleUndo', true);
            this.settings.betaDeepLinking = getBool('betaDeepLinking', true);
            this.settings.betaDbEndpoint = getValue('betaDbEndpoint', '') || '';
            this.settings.betaDbApiKey = getValue('betaDbApiKey', '') || '';
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
            setValue('crazyScrapeMode', Boolean(this.settings.crazyScrapeMode));
            setValue('pauseOnBlur', this.settings.pauseOnBlur);
            setValue('buttonSoundEnabled', this.settings.buttonSoundEnabled);
            setValue('autoCheckUpdate', this.settings.autoCheckUpdate !== false);
            setValue('betaPlayMode', this.settings.betaPlayMode || 'normal');
            setValue('betaMode', Boolean(this.settings.betaMode));
            setValue('betaFirstCapsulePlay', Boolean(this.settings.betaFirstCapsulePlay));
            setValue('betaColorPlayMode', this.settings.betaColorPlayMode || 'preview');
            setValue('betaSafariMuteStyle', Boolean(this.settings.betaSafariMuteStyle));
            setValue('betaCapsuleUndo', Boolean(this.settings.betaCapsuleUndo));
            setValue('betaDeepLinking', Boolean(this.settings.betaDeepLinking));
            setValue('betaDbEndpoint', this.settings.betaDbEndpoint || '');
            setValue('betaDbApiKey', this.settings.betaDbApiKey || '');
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
            progressRow.style.display = this.settings.showProgressBar ? 'flex' : 'none';
        }
        
        if (seekControlRow) {
            seekControlRow.style.display = this.settings.showSeekControlRow ? 'flex' : 'none';
        }

        if (loopControlRow) {
            loopControlRow.style.display = this.settings.showLoopControlRow ? 'flex' : 'none';
        }

        if (playbackControlRow) {
            playbackControlRow.style.display = this.settings.showPlaybackControlRow ? 'flex' : 'none';
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
    }
}
