import { PlayerCore } from './core/PlayerCore.js';
import { UIManager } from './ui/UIManager.js';
import { ControlManager } from './managers/ControlManager.js';
import { DragManager } from './managers/DragManager.js';
import { LoopManager } from './managers/LoopManager.js';
import { ProgressManager } from './managers/ProgressManager.js';
import { EventManager } from './managers/EventManager.js';
import { SettingsManager } from './managers/SettingsManager.js';
import { VideoSwipeManager } from './managers/videoSwipeManager.js';
import { updateSafariThemeColor, Toast } from '../utils/index.js';
import { __ } from '../constants/i18n.js';

/**
 * 自定义视频播放器控制器 - 模块化重构版本
 */
export class CustomVideoPlayer {
    constructor(options = {}) {
        console.log('[CustomVideoPlayer] 初始化...');
        
        // 创建核心播放器
        this.playerCore = new PlayerCore(options);
        
        // 保存调用按钮引用
        this.callingButton = options.callingButton || null;
        
        // 初始化管理器
        this.managers = {};
        
        // 初始状态
        this.initialized = false;
    }

    /**
     * 初始化播放器
     */
    init() {
        if (this.initialized) return;
        
        // 标记播放器激活状态，以便 CSS 隐藏宿主干扰元素
        document.body.classList.add('tm-player-active');
        document.documentElement.classList.add('tm-player-active');
        
        // 保存并隐藏网页浏览器滚动条，同时禁用默认的橡皮筋弹性滚动效果
        this._scrollbarStyle = document.createElement('style');
        this._scrollbarStyle.id = 'tm-hide-scrollbar-style';
        this._scrollbarStyle.innerHTML = `
            html::-webkit-scrollbar, body::-webkit-scrollbar {
                display: none !important;
            }
            html, body {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                overscroll-behavior: none !important;
                overscroll-behavior-y: none !important;
            }
        `;
        document.head.appendChild(this._scrollbarStyle);
        
        // 如果PlayerCore不存在，重新创建
        if (!this.playerCore) {
            this.playerCore = new PlayerCore({
                callingButton: this.callingButton
            });
        }
        
        // 初始化核心播放器
        this.playerCore.init();
        
        if (!this.playerCore.targetVideo) {
            console.error('[CustomVideoPlayer] 核心初始化失败: 未找到视频元素');
            Toast(__('loadingError') || 'Failed to load video', 3000, 'error');
            // 如果是从浮动按钮调用的，则重新显示按钮
            if (this.callingButton) {
                this.callingButton.style.display = 'flex';
            }
            return;
        }
        
        // 创建UI管理器
        const uiManager = new UIManager(this.playerCore);
        const uiElements = uiManager.createUI();
        this.managers.uiManager = uiManager;
        this.playerCore.uiManager = uiManager; // 注册到 playerCore 以供全局访问
        
        // 创建设置管理器
        const settingsManager = new SettingsManager(this.playerCore, uiElements);
        settingsManager.init();
        this.managers.settingsManager = settingsManager;
        
        // 创建控制管理器
        const controlManager = new ControlManager(this.playerCore, uiElements);
        controlManager.init();
        this.managers.controlManager = controlManager;
        
        // 将控制管理器设置到playerCore上，以便UIManager可以访问到它
        this.playerCore.controlManager = controlManager;
        
        // 创建进度管理器
        const progressManager = new ProgressManager(this.playerCore, uiElements);
        this.playerCore.progressManager = progressManager;
        progressManager.init({
            progressBarElement: controlManager.progressBarElement,
            progressIndicator: controlManager.progressIndicator,
            currentTimeDisplay: controlManager.currentTimeDisplay,
            totalDurationDisplay: controlManager.totalDurationDisplay,
            timeIndicator: controlManager.timeIndicator
        });
        this.managers.progressManager = progressManager;
        
        // 创建循环管理器
        const loopManager = new LoopManager(this.playerCore, uiElements);
        loopManager.init({
            loopStartMarker: controlManager.loopStartMarker,
            loopEndMarker: controlManager.loopEndMarker,
            loopRangeElement: controlManager.loopRangeElement,
            progressMarkersContainer: controlManager.progressMarkersContainer,
            tabScrollContainer: controlManager.tabScrollContainer,
            tabAddBtn: controlManager.tabAddBtn,
        });
        this.managers.loopManager = loopManager;
        
        // 设置循环管理器引用到控制管理器
        controlManager.setLoopManager(loopManager);
        
        // 创建拖动管理器
        const dragManager = new DragManager(this.playerCore, uiElements);
        dragManager.init();
        this.managers.dragManager = dragManager;
        this.playerCore.dragManager = dragManager; // 注册到 playerCore 以供全局访问
        
        // 初始化VideoSwipeManager
        if (this.playerCore.targetVideo && uiElements.videoWrapper && uiElements.handle) {
            console.log('[CustomVideoPlayer] 初始化SwipeManager...');
            this.swipeManager = new VideoSwipeManager(
                this.playerCore.targetVideo,
                uiElements.videoWrapper,
                uiElements.handle,
                uiElements,
                () => this.close()
            );
            this.swipeManager.playerCore = this.playerCore; // 关联 playerCore 到 swipeManager
            this.playerCore.swipeManager = this.swipeManager; // 注册到 playerCore 以供全局访问
            this.managers.swipeManager = this.swipeManager;
        }
        
        // 创建事件管理器 - 必须在所有其他管理器之后创建
        const eventManager = new EventManager(this.playerCore, uiElements, this.managers);
        eventManager.init();
        this.managers.eventManager = eventManager;
        
        // 组装DOM - 移到所有管理器初始化之后
        uiManager.assembleDOM();
        
        // 应用设置
        settingsManager.updateControlRowsVisibility();
        
        // 恢复视频状态
        this.playerCore.restoreVideoState();
        
        // 更新进度条
        progressManager.updateProgressBar();
        
        // 更新当前时间显示
        progressManager.updateCurrentTimeDisplay();
        
        // 为iOS设备的Safari浏览器设置统一 of safe area背景色
        updateSafariThemeColor('#000000', true);
        
        // 视频元数据就绪后统一更新 UI 和位置
        const runUIUpdates = () => {
            if (this.swipeManager) {
                this.swipeManager.updateSize();
            }
            dragManager.updateHandlePosition();
            if (loopManager) {
                loopManager._updateUI();
                loopManager.updateLoopTimeDisplay();
                loopManager.updateLoopMarkers();
            }
            if (progressManager) {
                progressManager.updateProgressBar();
                progressManager.updateCurrentTimeDisplay();
            }
        };

        if (this.playerCore.targetVideo.readyState >= 1) { // HAVE_METADATA
            requestAnimationFrame(() => {
                setTimeout(runUIUpdates, 50); // 极小延迟确保 DOM 尺寸布局渲染完毕
            });
        } else {
            this.playerCore.targetVideo.addEventListener('loadedmetadata', runUIUpdates, { once: true });
        }
        
        this.initialized = true;
        console.log('[CustomVideoPlayer] 初始化完成');
    }

    /**
     * 关闭播放器
     */
    close() {
        // 恢复网页浏览器滚动条
        if (this._scrollbarStyle) {
            this._scrollbarStyle.remove();
            this._scrollbarStyle = null;
        }
        
        // 移除播放器激活状态标记
        document.body.classList.remove('tm-player-active');
        document.documentElement.classList.remove('tm-player-active');

        // 调用PlayerCore的close方法
        this.playerCore.close(
            this.managers.uiManager.overlay, 
            this.managers.uiManager.container,
            this.managers.uiManager.playerContainer
        );
        
        // 清理事件监听器
        if (this.managers.eventManager) {
            this.managers.eventManager.cleanup();
        }
        
        // 清理SwipeManager
        if (this.swipeManager) {
            this.swipeManager.destroy();
            this.swipeManager = null;
        }
        
        // 清理所有管理器
        for (const key in this.managers) {
            if (this.managers[key] && typeof this.managers[key].cleanup === 'function') {
                this.managers[key].cleanup();
            }
            this.managers[key] = null;
        }
        
        // 重置状态
        this.initialized = false;
        this.managers = {};
        this.playerCore = null;
    }
} 