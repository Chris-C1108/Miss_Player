import { getValue, setValue, Toast } from '../../utils/index.js';

/**
 * 设置管理器类 - 负责播放器设置面板及其交互功能
 */
export class SettingsManager {
    constructor(playerCore, uiElements) {
        // 核心引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
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
            debugMode: false
        };

        // 快进快退步进自定义展开状态
        this.showCustomSeekStepsPanel = false;
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
                    if (this.playerCore.uiManager) {
                        this.playerCore.uiManager.isSidebarHidden = false;
                        this.playerCore.uiManager.updateSidebarToggleButtonIcon();
                    }
                }
                if (this.playerCore.controlManager?.commentPanel) {
                    this.playerCore.controlManager.commentPanel.updateCommentsVisibility(checked);
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

        const debugOption = this._createToggleOption(
            'DEBUG',
            'debugMode',
            this.settings.debugMode,
            (checked) => {
                this.updateSetting('debugMode', checked);
                if (this.playerCore.controlManager?.commentPanel) {
                    this.playerCore.controlManager.commentPanel.updateDebugMode(checked);
                }
            }
        );

        section3.appendChild(debugOption);
        container.appendChild(section3);

        this.settingsPanel.appendChild(container);
    }

    /**
     * 创建 Section 标题与分割线
     */
    _createSectionHeader(titleText) {
        const section = document.createElement('div');
        section.className = 'tm-settings-section';

        const header = document.createElement('div');
        header.className = 'tm-settings-section-header';
        header.textContent = titleText;

        const divider = document.createElement('div');
        divider.className = 'tm-settings-section-divider';

        section.appendChild(header);
        section.appendChild(divider);
        return section;
    }

    /**
     * 创建标准开关选项行
     */
    _createToggleOption(labelText, settingKey, initialValue, onChange, extraElement = null) {
        const row = document.createElement('div');
        row.className = 'tm-settings-option-row';
        row.id = `tm-setting-${settingKey}`;

        const labelWrapper = document.createElement('div');
        labelWrapper.className = 'tm-settings-label-wrapper';

        const label = document.createElement('span');
        label.className = 'tm-settings-label';
        label.textContent = labelText;
        labelWrapper.appendChild(label);

        if (extraElement) {
            labelWrapper.appendChild(extraElement);
        }

        // 开关组件
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'tm-toggle-switch';

        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = initialValue;
        toggleInput.className = 'tm-toggle-input';

        const toggleSlider = document.createElement('span');
        toggleSlider.className = initialValue ? 'tm-toggle-slider checked' : 'tm-toggle-slider';

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
        const controlManager = this.playerCore.controlManager;
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
                if (this.playerCore.controlManager?.commentPanel) {
                    this.playerCore.controlManager.commentPanel.updateCommentSources();
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
                if (!this.settingsPanel.contains(e.target) && e.target !== this.uiElements.settingsBtn) {
                    this.closeSettingsPanel();
                }
            };
            
            setTimeout(() => {
                const overlay = this.uiElements.overlay || document.body;
                overlay.addEventListener('click', this.overlayClickHandler);
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
            const overlay = this.uiElements.overlay || document.body;
            overlay.removeEventListener('click', this.overlayClickHandler);
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
            this.settings.showProgressBar = getValue('showProgressBar', true);
            this.settings.showSeekControlRow = getValue('showSeekControlRow', true);
            this.settings.showLoopControlRow = getValue('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = getValue('showPlaybackControlRow', true);
            this.settings.enabledSeekSteps = getValue('enabledSeekSteps', ['5s', '10s', '30s', '1m', '5m', '10m']);
            this.settings.showCommentsSection = getValue('showCommentsSection', true);
            this.settings.enabledCommentSources = getValue('enabledCommentSources', {
                jable: true,
                javdb: true,
                javlibrary: false
            });
            this.settings.debugMode = getValue('debugMode', false);
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
            setValue('debugMode', this.settings.debugMode);
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
        
        if (key.startsWith('show') && key.endsWith('Row')) {
            this.updateControlRowsVisibility();
        }
    }
}