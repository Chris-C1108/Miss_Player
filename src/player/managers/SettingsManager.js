import { getValue, setValue, Toast } from '../../utils/index.js';
import { telemetry } from '../../telemetry';
import { __ } from '../../constants/i18n.js';
import { SyncManager, WebDavClient, getOrCreateClientId, getDeviceName } from '../../sync/index.js';
import {
    ICON_CLOUD_SYNC,
    ICON_CLOUD_UPLOAD,
    ICON_CLOUD_DOWNLOAD,
    ICON_EYE,
    ICON_EYE_OFF,
    ICON_CHECK,
    ICON_SERVER
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
            telemetryEnabled: true,
            debugMode: false,
            pauseOnBlur: true
        };

        // 快进快退步进自定义展开状态
        this.showCustomSeekStepsPanel = false;
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
        
        // 创建设置面板内容
        this.createSettingsPanel();

        // 初始应用设置到控制组件
        this.updateControlRowsVisibility();
        
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

        const debugOption = this._createToggleOption(
            'DEBUG',
            'debugMode',
            this.settings.debugMode,
            (checked) => {
                this.updateSetting('debugMode', checked);
                if (this.controlManager?.commentPanel) {
                    this.controlManager.commentPanel.updateDebugMode(checked);
                }
            }
        );

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

        section3.appendChild(telemetryOption);
        section3.appendChild(pauseOnBlurOption);
        section3.appendChild(debugOption);
        container.appendChild(section3);

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

        // 5. 当前设备标识
        const deviceBadge = document.createElement('div');
        deviceBadge.className = 'tm-webdav-device-badge';
        deviceBadge.innerHTML = `${ICON_SERVER} <span>${__('webdavCurrentDevice') || '当前设备'}: ${deviceName} (${clientId.slice(-6)})</span>`;

        // 6. 操作按钮网格
        const actionsGrid = document.createElement('div');
        actionsGrid.className = 'tm-webdav-actions-grid';

        // 智能合并同步 (Primary)
        const syncMergeBtn = document.createElement('button');
        syncMergeBtn.className = 'tm-webdav-btn tm-webdav-btn-primary';
        syncMergeBtn.innerHTML = `${ICON_CLOUD_SYNC} <span>${__('webdavSyncMerge') || '智能合并同步'}</span>`;

        // 测试连接 (Secondary)
        const testBtn = document.createElement('button');
        testBtn.className = 'tm-webdav-btn tm-webdav-btn-secondary';
        testBtn.innerHTML = `${ICON_CHECK} <span>${__('webdavTestConnection') || '测试连接'}</span>`;

        // 向上覆盖 (Upload Overwrite)
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'tm-webdav-btn tm-webdav-btn-secondary';
        uploadBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>${__('webdavUploadOverwrite') || '向上覆盖'}</span>`;

        // 向下覆盖 (Download Overwrite)
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'tm-webdav-btn tm-webdav-btn-secondary';
        downloadBtn.innerHTML = `${ICON_CLOUD_DOWNLOAD} <span>${__('webdavDownloadOverwrite') || '向下覆盖'}</span>`;

        actionsGrid.appendChild(syncMergeBtn);
        actionsGrid.appendChild(testBtn);
        actionsGrid.appendChild(uploadBtn);
        actionsGrid.appendChild(downloadBtn);

        // 7. 状态栏 (上次同步时间 & 状态)
        const statusBar = document.createElement('div');
        statusBar.className = 'tm-webdav-status-bar';

        const lastSyncTime = SyncManager.getLastSyncTime();
        const timeText = lastSyncTime > 0
            ? new Date(lastSyncTime).toLocaleString()
            : (__('webdavNeverSynced') || '尚未同步');

        const timeSpan = document.createElement('span');
        timeSpan.textContent = `${__('webdavLastSync') || '上次同步'}: ${timeText}`;

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

        const updateStatus = (text, isSuccess) => {
            statusBadge.style.display = 'inline-flex';
            statusBadge.className = `tm-webdav-status-badge ${isSuccess ? 'success' : 'error'}`;
            statusBadge.textContent = text;
        };

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
                Toast.show(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                return;
            }
            setButtonsDisabled(true);
            testBtn.innerHTML = `<span>${__('webdavTesting') || '正在测试...'}</span>`;
            try {
                const res = await WebDavClient.testConnection(currentCfg);
                Toast.show(res.message || '连接成功！', 3000);
                updateStatus('连接正常', true);
            } catch (err) {
                Toast.show((__('webdavTestFailed') || '连接失败: ') + err.message, 4000);
                updateStatus('连接失败', false);
            } finally {
                testBtn.innerHTML = `${ICON_CHECK} <span>${__('webdavTestConnection') || '测试连接'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 2. 智能合并同步
        syncMergeBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast.show(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                return;
            }
            setButtonsDisabled(true);
            syncMergeBtn.innerHTML = `<span>${__('webdavSyncing') || '正在同步...'}</span>`;
            try {
                const res = await SyncManager.executeSync({
                    mode: 'merge',
                    config: currentCfg,
                    playerState: this.playerCore?.options?.playerState
                });
                Toast.show(res.message || '云端多端合并同步成功！', 3000);
                updateStatus('同步成功', true);
                timeSpan.textContent = `${__('webdavLastSync') || '上次同步'}: ${new Date().toLocaleString()}`;
                this.createSettingsPanel(); // 刷新面板显示最新合并设置
            } catch (err) {
                Toast.show((__('webdavSyncFailed') || '同步失败: ') + err.message, 4500);
                updateStatus('同步失败', false);
            } finally {
                syncMergeBtn.innerHTML = `${ICON_CLOUD_SYNC} <span>${__('webdavSyncMerge') || '智能合并同步'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 3. 向上覆盖 (Upload Overwrite)
        uploadBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast.show(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                return;
            }
            if (!window.confirm(__('webdavConfirmUpload') || '确定要将当前本地配置强制覆盖到云端吗？')) {
                return;
            }
            setButtonsDisabled(true);
            uploadBtn.innerHTML = `<span>${__('webdavSyncing') || '正在上传...'}</span>`;
            try {
                const res = await SyncManager.executeSync({
                    mode: 'upload',
                    config: currentCfg,
                    playerState: this.playerCore?.options?.playerState
                });
                Toast.show(res.message || '已成功覆盖云端备份！', 3000);
                updateStatus('已上传覆盖', true);
                timeSpan.textContent = `${__('webdavLastSync') || '上次同步'}: ${new Date().toLocaleString()}`;
            } catch (err) {
                Toast.show((__('webdavSyncFailed') || '上传失败: ') + err.message, 4500);
                updateStatus('上传失败', false);
            } finally {
                uploadBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>${__('webdavUploadOverwrite') || '向上覆盖'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 4. 向下覆盖 (Download Overwrite)
        downloadBtn.addEventListener('click', async () => {
            const currentCfg = persistCurrentInputs();
            if (!currentCfg.url) {
                Toast.show(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                return;
            }
            if (!window.confirm(__('webdavConfirmDownload') || '确定要从云端拉取配置并覆盖本地吗？')) {
                return;
            }
            setButtonsDisabled(true);
            downloadBtn.innerHTML = `<span>${__('webdavSyncing') || '正在下载...'}</span>`;
            try {
                const res = await SyncManager.executeSync({
                    mode: 'download',
                    config: currentCfg,
                    playerState: this.playerCore?.options?.playerState
                });
                Toast.show(res.message || '已成功从云端覆盖本地！', 3000);
                updateStatus('已下载覆盖', true);
                timeSpan.textContent = `${__('webdavLastSync') || '上次同步'}: ${new Date().toLocaleString()}`;
                this.createSettingsPanel(); // 刷新面板显示最新覆盖设置
            } catch (err) {
                Toast.show((__('webdavSyncFailed') || '下载失败: ') + err.message, 4500);
                updateStatus('下载失败', false);
            } finally {
                downloadBtn.innerHTML = `${ICON_CLOUD_DOWNLOAD} <span>${__('webdavDownloadOverwrite') || '向下覆盖'}</span>`;
                setButtonsDisabled(false);
            }
        });

        // 组装卡片
        card.appendChild(urlRow);
        card.appendChild(userRow);
        card.appendChild(passRow);
        card.appendChild(pathRow);
        card.appendChild(deviceBadge);
        card.appendChild(actionsGrid);
        card.appendChild(statusBar);

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
            this.settings.enabledSeekSteps = Array.isArray(rawSeekSteps) && rawSeekSteps.length > 0
                ? rawSeekSteps
                : ['5s', '10s', '30s', '1m', '5m', '10m'];

            const rawCustomSteps = getValue('customUserSeekSteps', null);
            this.settings.customUserSeekSteps = Array.isArray(rawCustomSteps) ? rawCustomSteps : [];

            this.settings.showCommentsSection = getBool('showCommentsSection', true);

            const rawSources = getValue('enabledCommentSources', null);
            this.settings.enabledCommentSources = Object.assign({
                jable: true,
                javdb: true,
                javlibrary: false
            }, (rawSources && typeof rawSources === 'object') ? rawSources : {});

            this.settings.telemetryEnabled = getBool('telemetryEnabled', true);
            this.settings.debugMode = getBool('debugMode', false);
            this.settings.pauseOnBlur = getBool('pauseOnBlur', true);
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
            setValue('telemetryEnabled', this.settings.telemetryEnabled);
            setValue('debugMode', this.settings.debugMode);
            setValue('pauseOnBlur', this.settings.pauseOnBlur);
        }
    }
    
    /**
     * 更新控制行的可见性
     */
    updateControlRowsVisibility() {
        const controlButtonsContainer = document.querySelector('.tm-control-buttons');
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