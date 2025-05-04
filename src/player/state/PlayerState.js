import { Utils } from '../../utils/utils.js';

/**
 * 播放器状态管理类
 */
export class PlayerState {
    constructor() {
        // 播放器设置
        this.settings = {
            showSeekControlRow: true,    // 显示快进快退控制行
            showLoopControlRow: true,    // 显示循环控制行
            showPlaybackControlRow: true // 显示播放控制行
        };

        // 添加存储方法
        this._setupStorageMethods();
    }
    
    /**
     * 设置存储方法
     * @private
     */
    _setupStorageMethods() {
        // 检查是否有油猴API可用
        this.hasGMAPI = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
    }

    /**
     * 安全获取存储的值
     * @param {string} key - 键名
     * @param {any} defaultValue - 默认值
     * @returns {any} - 存储的值或默认值
     */
    getValue(key, defaultValue) {
        try {
            if (this.hasGMAPI) {
                return GM_getValue(key, defaultValue);
            } else {
                const value = localStorage.getItem(`missNoAD_${key}`);
                return value !== null ? JSON.parse(value) : defaultValue;
            }
        } catch (e) {
            console.debug('获取存储值失败:', e);
            return defaultValue;
        }
    }

    /**
     * 安全存储值
     * @param {string} key - 键名
     * @param {any} value - 要存储的值
     * @returns {boolean} - 是否成功存储
     */
    setValue(key, value) {
        try {
            if (this.hasGMAPI) {
                GM_setValue(key, value);
                return true;
            } else {
                localStorage.setItem(`missNoAD_${key}`, JSON.stringify(value));
                return true;
            }
        } catch (e) {
            console.debug('存储值失败:', e);
            return false;
        }
    }
    
    /**
     * 加载保存的设置
     */
    loadSettings() {
        try {
            this.settings.showSeekControlRow = this.getValue('showSeekControlRow', true);
            this.settings.showLoopControlRow = this.getValue('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = this.getValue('showPlaybackControlRow', true);
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