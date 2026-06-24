import { getValue, setValue } from '../../utils/index.js';

/**
 * 播放器状态管理类
 */
export class PlayerState {
    constructor() {
        // 播放器设置
        this.settings = {
            showSeekControlRow: true,    // 显示快进快退控制行
            showLoopControlRow: true,    // 显示循环控制行
            showPlaybackControlRow: true, // 显示播放控制行
            sidebarPosition: 'right',    // 评论侧边栏位置 ('left' | 'right')
            sidebarHidden: false         // 评论侧边栏是否隐藏 (true | false)
        };
    }

    /**
     * 安全获取存储的值
     * @param {string} key - 键名
     * @param {any} defaultValue - 默认值
     * @returns {any} - 存储的值或默认值
     */
    getValue(key, defaultValue) {
        return getValue(key, defaultValue);
    }

    /**
     * 安全存储值
     * @param {string} key - 键名
     * @param {any} value - 要存储的值
     * @returns {boolean} - 是否成功存储
     */
    setValue(key, value) {
        setValue(key, value);
        return true;
    }
    
    /**
     * 加载保存的设置
     */
    loadSettings() {
        try {
            this.settings.showSeekControlRow = this.getValue('showSeekControlRow', true);
            this.settings.showLoopControlRow = this.getValue('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = this.getValue('showPlaybackControlRow', true);
            this.settings.sidebarPosition = this.getValue('sidebarPosition', 'right');
            this.settings.sidebarHidden = this.getValue('sidebarHidden', false);
        } catch (error) {
            console.error('[PlayerState] 加载设置失败:', error);
        }
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            this.setValue('showSeekControlRow', this.settings.showSeekControlRow);
            this.setValue('showLoopControlRow', this.settings.showLoopControlRow);
            this.setValue('showPlaybackControlRow', this.settings.showPlaybackControlRow);
            this.setValue('sidebarPosition', this.settings.sidebarPosition);
            this.setValue('sidebarHidden', this.settings.sidebarHidden);
        } catch (error) {
            console.error('[PlayerState] 保存设置失败:', error);
        }
    }
    
    /**
     * 更新设置
     * @param {string} key - 设置键名
     * @param {any} value - 设置值
     */
    updateSetting(key, value) {
        if (key in this.settings) {
            this.settings[key] = value;
            this.saveSettings();
        }
    }
} 