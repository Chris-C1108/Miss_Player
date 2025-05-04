/**
 * 设置管理器类 - 负责播放器设置功能
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
            showSeekControlRow: true,       // 显示快进快退按钮
            showLoopControlRow: true,       // 显示循环控制按钮
            showPlaybackControlRow: true,   // 显示播放控制按钮
            showProgressBar: true,          // 显示进度条
        };
    }
    
    /**
     * 初始化设置管理器
     */
    init() {
        // 加载保存的设置
        this.loadSettings();
        
        // 创建设置面板内容
        this.createSettingsPanel();
        
        return this;
    }
    
    /**
     * 创建设置面板内容
     */
    createSettingsPanel() {
        // 添加设置选项
        const settingsOptions = document.createElement('div');
        settingsOptions.className = 'tm-settings-options';
        settingsOptions.style.display = 'flex';
        settingsOptions.style.flexDirection = 'column';
        settingsOptions.style.gap = '12px';

        // 添加显示进度条选项
        const progressBarOption = this.createSettingOption(
            '显示-进度条',
            'showProgressBar',
            this.settings.showProgressBar,
            (checked) => {
                this.settings.showProgressBar = checked;
                this.saveSettings();
                this.updateControlRowsVisibility();
            }
        );

        // 添加显示快进快退控制行选项
        const seekControlRowOption = this.createSettingOption(
            '显示-进度跳转',
            'showSeekControlRow',
            this.settings.showSeekControlRow,
            (checked) => {
                this.settings.showSeekControlRow = checked;
                this.saveSettings();
                this.updateControlRowsVisibility();
            }
        );

        // 添加显示循环控制行选项
        const loopControlRowOption = this.createSettingOption(
            '显示-循环控制',
            'showLoopControlRow',
            this.settings.showLoopControlRow,
            (checked) => {
                this.settings.showLoopControlRow = checked;
                this.saveSettings();
                this.updateControlRowsVisibility();
            }
        );

        // 添加显示播放控制行选项
        const playbackControlRowOption = this.createSettingOption(
            '显示-播放倍速',
            'showPlaybackControlRow',
            this.settings.showPlaybackControlRow,
            (checked) => {
                this.settings.showPlaybackControlRow = checked;
                this.saveSettings();
                this.updateControlRowsVisibility();
            }
        );

        settingsOptions.appendChild(progressBarOption);
        settingsOptions.appendChild(seekControlRowOption);
        settingsOptions.appendChild(loopControlRowOption);
        settingsOptions.appendChild(playbackControlRowOption);

        this.settingsPanel.appendChild(settingsOptions);
    }
    
    /**
     * 创建设置选项
     * @param {string} labelText 选项标签文本
     * @param {string} settingKey 设置键名
     * @param {boolean} initialValue 初始值
     * @param {Function} onChange 值变化时的回调函数
     * @returns {HTMLElement} 设置选项元素
     */
    createSettingOption(labelText, settingKey, initialValue, onChange) {
        const optionContainer = document.createElement('div');
        optionContainer.className = 'tm-settings-option';
        optionContainer.id = `tm-setting-${settingKey}`;

        const label = document.createElement('label');
        label.className = 'tm-settings-label';
        label.textContent = labelText;

        // 创建一个开关样式的复选框
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'tm-toggle-switch';

        // 创建一个隐藏的复选框用于状态保存
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.checked = initialValue;
        toggleInput.className = 'tm-toggle-input';

        const toggleSlider = document.createElement('span');
        toggleSlider.className = initialValue ? 'tm-toggle-slider checked' : 'tm-toggle-slider';

        // 添加 tabIndex 使其可聚焦
        optionContainer.tabIndex = 0;

        toggleContainer.appendChild(toggleInput);
        toggleContainer.appendChild(toggleSlider);

        // 添加点击处理
        const toggleSwitch = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 更新复选框状态
            toggleInput.checked = !toggleInput.checked;
            
            // 更新样式
            if (toggleInput.checked) {
                toggleSlider.className = 'tm-toggle-slider checked';
            } else {
                toggleSlider.className = 'tm-toggle-slider';
            }
            
            // 执行回调函数
            if (typeof onChange === 'function') {
                onChange(toggleInput.checked);
            }
        };

        // 让整个选项可点击
        optionContainer.addEventListener('click', toggleSwitch);

        // 添加键盘支持
        optionContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSwitch(e);
            }
        });

        optionContainer.appendChild(label);
        optionContainer.appendChild(toggleContainer);

        return optionContainer;
    }
    
    /**
     * 切换设置面板显示状态
     */
    toggleSettingsPanel() {
        const isVisible = this.settingsPanel.classList.contains('active');
        if (isVisible) {
            this.closeSettingsPanel();
        } else {
            this.settingsPanel.style.display = 'block';
            
            // 使用动画淡入
            setTimeout(() => {
                this.settingsPanel.classList.add('active');
            }, 10);
            
            // 添加点击overlay背景关闭设置面板的事件
            this.overlayClickHandler = (e) => {
                // 如果点击的不是设置面板内的元素，则关闭设置面板
                if (!this.settingsPanel.contains(e.target) && e.target !== this.uiElements.settingsBtn) {
                    this.closeSettingsPanel();
                }
            };
            
            // 延迟添加事件监听器，避免与当前点击冲突
            setTimeout(() => {
                if (this.uiElements.overlay) {
                    this.uiElements.overlay.addEventListener('click', this.overlayClickHandler);
                }
            }, 50);
        }
    }
    
    /**
     * 关闭设置面板
     */
    closeSettingsPanel() {
        this.settingsPanel.classList.remove('active');
        
        // 移除点击事件监听器
        if (this.uiElements.overlay && this.overlayClickHandler) {
            this.uiElements.overlay.removeEventListener('click', this.overlayClickHandler);
            this.overlayClickHandler = null;
        }
        
        // 等待动画完成后隐藏
        setTimeout(() => {
            this.settingsPanel.style.display = 'none';
        }, 300);
    }
    
    /**
     * 加载设置
     */
    loadSettings() {
        try {
            // 创建临时函数来获取设置
            const getValue = (key, defaultValue) => {
                try {
                    if (typeof GM_getValue === 'function') {
                        return GM_getValue(key, defaultValue);
                    } else {
                        const value = localStorage.getItem(`missNoAD_${key}`);
                        return value !== null ? JSON.parse(value) : defaultValue;
                    }
                } catch (e) {
                    console.debug(`获取${key}设置失败:`, e);
                    return defaultValue;
                }
            };
            
            // 加载设置，如果不存在则使用默认值
            this.settings.showProgressBar = getValue('showProgressBar', true);
            this.settings.showSeekControlRow = getValue('showSeekControlRow', true);
            this.settings.showLoopControlRow = getValue('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = getValue('showPlaybackControlRow', true);

        } catch (error) {
            console.error('加载设置时出错:', error);
        }
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            // 创建临时函数来保存设置
            const setValue = (key, value) => {
                try {
                    if (typeof GM_setValue === 'function') {
                        GM_setValue(key, value);
                        return true;
                    } else {
                        localStorage.setItem(`missNoAD_${key}`, JSON.stringify(value));
                        return true;
                    }
                } catch (e) {
                    console.debug(`保存${key}设置失败:`, e);
                    return false;
                }
            };
            setValue('showProgressBar', this.settings.showProgressBar);
            setValue('showSeekControlRow', this.settings.showSeekControlRow);
            setValue('showLoopControlRow', this.settings.showLoopControlRow);
            setValue('showPlaybackControlRow', this.settings.showPlaybackControlRow);

        } catch (error) {
            console.error('保存设置时出错:', error);
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
     * 更新设置项
     * @param {string} key 设置键名
     * @param {any} value 设置值
     */
    updateSetting(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.saveSettings();
            
            // 如果涉及UI可见性，更新UI
            if (key.startsWith('show') && key.endsWith('Row')) {
                this.updateControlRowsVisibility();
            }
        }
    }
} 