import { ReactiveStore } from '../../utils/reactiveStore.js';
import { getValue, setValue } from '../../utils/index.js';
import { SyncManager } from '../../sync/index.js';

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
            telemetryEnabled: false,         // 遥测功能开关 (帮助改进)
            debugMode: false,               // DEBUG 模式
            sidebarPosition: 'right',       // 评论侧边栏位置 ('left' | 'right')
            sidebarHidden: false,           // 评论侧边栏是否隐藏 (true | false)
            preferredPlaybackRate: 1.0,     // 默认/首选播放速度
            pauseOnBlur: true,              // 页面离开/失焦后停止播放 (默认为开)
            buttonSoundEnabled: true        // 控制面板按钮点击音效 (默认为开)
        };
    }

    /**
     * 加载保存的设置
     */
    loadSettings() {
        try {
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

            this.settings.telemetryEnabled = false;
            this.settings.debugMode = getBool('debugMode', false);
            this.settings.sidebarPosition = getValue('sidebarPosition', 'right') || 'right';
            this.settings.sidebarHidden = getBool('sidebarHidden', false);
            const rawSpeed = parseFloat(getValue('preferredPlaybackRate', 1.0));
            this.settings.preferredPlaybackRate = (!isNaN(rawSpeed) && rawSpeed >= 0.5 && rawSpeed <= 4.0) ? rawSpeed : 1.0;
            this.settings.pauseOnBlur = getBool('pauseOnBlur', true);
            this.settings.buttonSoundEnabled = getBool('buttonSoundEnabled', true);
        } catch (error) {
            console.error('[PlayerState] 加载设置失败:', error);
        }
    }
    
    /**
     * 保存设置
     */

    /**
     * 开启跨标签页状态响应式同步
     * @param {Function} [onRemoteChange] 远端标签页状态变更回调 (key, newVal, oldVal) => void
     */
    initReactiveSync(onRemoteChange = null) {
        if (this._reactiveStore) return;
        const MONITORED_SETTINGS = [
            'showProgressBar',
            'showSeekControlRow',
            'showLoopControlRow',
            'showPlaybackControlRow',
            'showCommentsSection',
            'enabledCommentSources',
            'sidebarPosition',
            'sidebarHidden',
            'preferredPlaybackRate',
            'pauseOnBlur',
            'buttonSoundEnabled'
        ];

        this._reactiveStore = new ReactiveStore(this.settings);
        this._reactiveStore.enableCrossTabSync(MONITORED_SETTINGS);

        for (const key of MONITORED_SETTINGS) {
            this._reactiveStore.subscribe(key, (newVal, oldVal, isRemote) => {
                if (isRemote) {
                    this.settings[key] = newVal;
                    if (typeof onRemoteChange === 'function') {
                        try {
                            onRemoteChange(key, newVal, oldVal);
                        } catch (e) {
                            console.error('[PlayerState] 跨标签响应回调异常:', e);
                        }
                    }
                }
            });
        }
    }

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
            setValue('telemetryEnabled', false);
            setValue('debugMode', this.settings.debugMode);
            setValue('sidebarPosition', this.settings.sidebarPosition);
            setValue('sidebarHidden', this.settings.sidebarHidden);
            setValue('preferredPlaybackRate', this.settings.preferredPlaybackRate);
            setValue('pauseOnBlur', this.settings.pauseOnBlur);
            setValue('buttonSoundEnabled', this.settings.buttonSoundEnabled);
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
            try {
                SyncManager.recordSettingUpdate(key);
            } catch (_) {}
        }
    }
} 