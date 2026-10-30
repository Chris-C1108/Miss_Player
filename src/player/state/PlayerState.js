function sanitizeSeekStepList(arr, isCustom = false) {
    if (!Array.isArray(arr)) return isCustom ? [] : ['5s', '10s', '30s', '1m', '5m', '10m'];
    const valid = arr.filter(s => typeof s === 'string' && /^\d+[sm]$/i.test(s.trim())).map(s => s.trim().toLowerCase());
    const unique = Array.from(new Set(valid));
    return isCustom ? unique.slice(0, 30) : (unique.length > 0 ? unique : ['5s', '10s', '30s', '1m', '5m', '10m']);
}

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
            debugFilterHasNumbers: false,    // 只看有数字的评论 (用于审查时间解析)
            crazyScrapeMode: false,
            crazyForceRescrape: false,         // 疯狂采集模式
            sidebarPosition: 'right',       // 评论侧边栏位置 ('left' | 'right')
            sidebarHidden: false,           // 评论侧边栏是否隐藏 (true | false)
            preferredPlaybackRate: 1.0,     // 默认/首选播放速度
            pauseOnBlur: true,              // 页面离开/失焦后停止播放 (默认为开)
            buttonSoundEnabled: true,       // 控制面板按钮点击音效 (默认为开)
            defaultMuted: false,            // 默认静音播放
            muteResetMinutes: 5,            // 取消静音后重置超时的分钟数 (默认 5 分钟)
            betaSingleHandMode: false,      // 竖屏单手模式 (Beta 默认关闭)
            singleHandPosition: 'right',    // 单手握持偏好 ('right' | 'left')
            autoCheckUpdate: true,          // 自动检查新版本 (默认为开)
            updateChannel: 'stable',        // 检查更新通道 ('stable' 正式版 | 'beta' 测试版)
            // Beta 实验室与自建数据库 (Beta Labs & Supabase)
            betaMode: false,
            betaHeatmap: false,
            betaFirstCapsulePlay: false,
            betaPlayMode: 'normal',
            previewDurationSeconds: 5,
            climaxDurationSeconds: 60,
            betaColorPlayMode: 'preview',
            betaCapsuleUndo: true,
            betaDeepLinking: true,
            betaDbEndpoint: '',
            betaDbApiKey: '',
            betaSingleHandMode: false
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
            this.settings.enabledSeekSteps = sanitizeSeekStepList(rawSeekSteps, false);
            if (Array.isArray(rawSeekSteps) && (rawSeekSteps.length !== this.settings.enabledSeekSteps.length || rawSeekSteps.some(s => typeof s !== 'string'))) {
                setValue('enabledSeekSteps', this.settings.enabledSeekSteps);
            }

            const rawCustomSteps = getValue('customUserSeekSteps', null);
            this.settings.customUserSeekSteps = sanitizeSeekStepList(rawCustomSteps, true);
            if (Array.isArray(rawCustomSteps) && (rawCustomSteps.length !== this.settings.customUserSeekSteps.length || rawCustomSteps.some(s => typeof s !== 'string'))) {
                setValue('customUserSeekSteps', this.settings.customUserSeekSteps);
            }

            this.settings.showCommentsSection = getBool('showCommentsSection', true);

            const rawSources = getValue('enabledCommentSources', null);
            this.settings.enabledCommentSources = Object.assign({
                jable: true,
                javdb: true,
                javlibrary: false
            }, (rawSources && typeof rawSources === 'object') ? rawSources : {});

            this.settings.telemetryEnabled = false;
            this.settings.debugMode = getBool('debugMode', false);
            this.settings.debugFilterHasNumbers = getBool('debugFilterHasNumbers', false);
            this.settings.crazyScrapeMode = getBool('crazyScrapeMode', false);
            this.settings.crazyForceRescrape = getBool('crazyForceRescrape', false);
            this.settings.sidebarPosition = getValue('sidebarPosition', 'right') || 'right';
            this.settings.sidebarHidden = getBool('sidebarHidden', false);
            const rawSpeed = parseFloat(getValue('preferredPlaybackRate', 1.0));
            this.settings.preferredPlaybackRate = (!isNaN(rawSpeed) && rawSpeed >= 0.5 && rawSpeed <= 4.0) ? rawSpeed : 1.0;
            this.settings.pauseOnBlur = getBool('pauseOnBlur', true);
            this.settings.buttonSoundEnabled = getBool('buttonSoundEnabled', true);
            this.settings.autoCheckUpdate = getBool('autoCheckUpdate', true);
            const rawChannel = getValue('updateChannel', 'stable');
            this.settings.updateChannel = (rawChannel === 'beta') ? 'beta' : 'stable';
            this.settings.defaultMuted = getBool('defaultMuted', false);
            this.settings.muteResetMinutes = Math.max(1, Math.min(120, parseInt(getValue('muteResetMinutes', 5), 10) || 5));
            this.settings.betaMode = getBool('betaMode', false);
            this.settings.betaHeatmap = getBool('betaHeatmap', false);
            this.settings.betaFirstCapsulePlay = getBool('betaFirstCapsulePlay', false);
            const rawPlayMode = getValue('betaPlayMode', 'normal');
            this.settings.betaPlayMode = (rawPlayMode === 'preview' || rawPlayMode === 'climax') ? rawPlayMode : 'normal';
            const rawPrevSec = parseInt(getValue('previewDurationSeconds', 5), 10);
            this.settings.previewDurationSeconds = (!isNaN(rawPrevSec) && rawPrevSec >= 1 && rawPrevSec <= 60) ? rawPrevSec : 5;
            const rawClimaxSec = parseInt(getValue('climaxDurationSeconds', 60), 10);
            this.settings.climaxDurationSeconds = (!isNaN(rawClimaxSec) && rawClimaxSec >= 5 && rawClimaxSec <= 300) ? rawClimaxSec : 60;
            const rawColorMode = getValue('betaColorPlayMode', 'preview');
            this.settings.betaColorPlayMode = (rawPlayMode === 'review') ? 'review' : 'preview';
            this.settings.betaCapsuleUndo = getBool('betaCapsuleUndo', true);
            this.settings.betaDeepLinking = getBool('betaDeepLinking', true);
            this.settings.betaDbEndpoint = getValue('betaDbEndpoint', '') || '';
            this.settings.betaDbApiKey = getValue('betaDbApiKey', '') || '';
            this.settings.betaSingleHandMode = getBool('betaSingleHandMode', false);
            this.settings.singleHandPosition = getValue('singleHandPosition', 'right') || 'right';
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
            'buttonSoundEnabled',
            'defaultMuted',
            'muteResetMinutes',
            'autoCheckUpdate',
            'updateChannel',
            'betaMode',
            'betaHeatmap',
            'betaDbEndpoint',
            'betaDbApiKey',
            'crazyScrapeMode',
            'betaSingleHandMode',
            'singleHandPosition'
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
            setValue('debugFilterHasNumbers', this.settings.debugFilterHasNumbers);
            setValue('crazyScrapeMode', this.settings.crazyScrapeMode);
            setValue('crazyForceRescrape', this.settings.crazyForceRescrape);
            setValue('sidebarPosition', this.settings.sidebarPosition);
            setValue('sidebarHidden', this.settings.sidebarHidden);
            setValue('preferredPlaybackRate', this.settings.preferredPlaybackRate);
            setValue('pauseOnBlur', this.settings.pauseOnBlur);
            setValue('buttonSoundEnabled', this.settings.buttonSoundEnabled);
            setValue('defaultMuted', Boolean(this.settings.defaultMuted));
            setValue('muteResetMinutes', this.settings.muteResetMinutes || 5);
            setValue('autoCheckUpdate', this.settings.autoCheckUpdate !== false);
            setValue('updateChannel', this.settings.updateChannel === 'beta' ? 'beta' : 'stable');
            setValue('betaMode', Boolean(this.settings.betaMode));
            setValue('betaHeatmap', Boolean(this.settings.betaHeatmap));
            setValue('betaFirstCapsulePlay', Boolean(this.settings.betaFirstCapsulePlay));
            setValue('betaPlayMode', this.settings.betaPlayMode || 'normal');
            setValue('previewDurationSeconds', this.settings.previewDurationSeconds || 5);
            setValue('climaxDurationSeconds', this.settings.climaxDurationSeconds || 60);
            setValue('betaColorPlayMode', this.settings.betaColorPlayMode || 'preview');
            setValue('betaCapsuleUndo', Boolean(this.settings.betaCapsuleUndo));
            setValue('betaDeepLinking', Boolean(this.settings.betaDeepLinking));
            setValue('betaDbEndpoint', this.settings.betaDbEndpoint || '');
            setValue('betaDbApiKey', this.settings.betaDbApiKey || '');
            setValue('betaSingleHandMode', Boolean(this.settings.betaSingleHandMode));
            setValue('singleHandPosition', this.settings.singleHandPosition || 'right');
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
        this.settings[key] = value;
        this.saveSettings();
        try {
            SyncManager.recordSettingUpdate(key);
        } catch (_) {}
    }
} 
