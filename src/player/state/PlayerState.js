import { getValue, setValue } from '../../utils/index.js';

/**
 * 播放器状态管理类
 */
export class PlayerState {
    constructor() {
        // 播放器设置
        this.settings = {
            showProgressBar: true,         // 显示进度条栏
            showSeekControlRow: true,       // 显示快进快退控制行
            showLoopControlRow: true,       // 显示跳转/循环控制行
            showPlaybackControlRow: true,   // 显示播放控制行
            enabledSeekSteps: ['5s', '10s', '30s', '1m', '5m', '10m'], // 选中的对称跳转步进值
            customUserSeekSteps: [],       // 用户可增删的自定义步进列表 (如 ['15s', '2m'])
            showCommentsSection: true,      // 是否展示/采集评论区
            enabledCommentSources: {        // 评论区来源控制
                jable: true,
                javdb: true,
                javlibrary: false           // 默认关闭 javlibrary
            },
            debugMode: false,               // DEBUG 模式
            sidebarPosition: 'right',       // 评论侧边栏位置 ('left' | 'right')
            sidebarHidden: false            // 评论侧边栏是否隐藏 (true | false)
        };
    }

    /**
     * 加载保存的设置
     */
    loadSettings() {
        try {
            this.settings.showProgressBar = getValue('showProgressBar', true);
            this.settings.showSeekControlRow = getValue('showSeekControlRow', true);
            this.settings.showLoopControlRow = getValue('showLoopControlRow', true);
            this.settings.showPlaybackControlRow = getValue('showPlaybackControlRow', true);
            this.settings.enabledSeekSteps = getValue('enabledSeekSteps', ['5s', '10s', '30s', '1m', '5m', '10m']);
            this.settings.customUserSeekSteps = getValue('customUserSeekSteps', []);
            this.settings.showCommentsSection = getValue('showCommentsSection', true);
            this.settings.enabledCommentSources = getValue('enabledCommentSources', {
                jable: true,
                javdb: true,
                javlibrary: false
            });
            this.settings.debugMode = getValue('debugMode', false);
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
            setValue('showProgressBar', this.settings.showProgressBar);
            setValue('showSeekControlRow', this.settings.showSeekControlRow);
            setValue('showLoopControlRow', this.settings.showLoopControlRow);
            setValue('showPlaybackControlRow', this.settings.showPlaybackControlRow);
            setValue('enabledSeekSteps', this.settings.enabledSeekSteps);
            setValue('customUserSeekSteps', this.settings.customUserSeekSteps);
            setValue('showCommentsSection', this.settings.showCommentsSection);
            setValue('enabledCommentSources', this.settings.enabledCommentSources);
            setValue('debugMode', this.settings.debugMode);
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