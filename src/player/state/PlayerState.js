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
     * 加载保存的设置
     */
    loadSettings() {
        try {
            this.settings.showSeekControlRow = getValue('showSeekControlRow', true);
            this.settings.showLoopControlRow = getValue('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = getValue('showPlaybackControlRow', true);
            this.settings.sidebarPosition = getValue('sidebarPosition', 'right');
            this.settings.sidebarHidden = getValue('sidebarHidden', false);
        } catch (error) {
            console.error('[PlayerState] 加载设置失败:', error);
        }
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            setValue('showSeekControlRow', this.settings.showSeekControlRow);
            setValue('showLoopControlRow', this.settings.showLoopControlRow);
            setValue('showPlaybackControlRow', this.settings.showPlaybackControlRow);
            setValue('sidebarPosition', this.settings.sidebarPosition);
            setValue('sidebarHidden', this.settings.sidebarHidden);
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