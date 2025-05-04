/**
 * 事件管理器类 - 负责事件监听和处理
 */
export class EventManager {
    constructor(playerCore, uiElements, managers) {
        // 核心引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
        // UI元素引用
        this.uiElements = uiElements;
        
        // 管理器引用
        this.managers = managers;
        
        // 状态变量
        this.resizeObserver = null;      // ResizeObserver 实例
        this.clickLock = false;          // 防止快速多次点击视频区域
        this.clickLockTimeout = null;    // 点击锁定计时器
    }
    
    /**
     * 初始化事件管理器
     */
    init() {
        console.log('[EventManager] 初始化事件管理器');
        
        // 绑定基本方法
        this.handleWindowResizeBound = this.handleWindowResize.bind(this);
        this.handleContainerResizeBound = this.handleContainerResize.bind(this);
        this.handleOverlayTouchMoveBound = (e) => e.preventDefault();
        
        // 初始化点击状态锁
        this.clickLock = false;
        this.clickLockTimeout = null;
        
        // 注释绑定视频包装器点击，由UIManager统一处理
        // this.handleVideoWrapperClickBound = this.handleVideoWrapperClick.bind(this);
        // this.uiElements.videoWrapper.addEventListener('click', this.handleVideoWrapperClickBound);
        
        // 绑定按钮事件
        this.handleCloseButtonClickBound = this.handleCloseButtonClick.bind(this);
        if (this.uiElements.closeBtn) {
            this.uiElements.closeBtn.addEventListener('click', this.handleCloseButtonClickBound);
        }
        
        this.handleSettingsButtonClickBound = this.handleSettingsButtonClick.bind(this);
        if (this.uiElements.settingsBtn) {
            this.uiElements.settingsBtn.addEventListener('click', this.handleSettingsButtonClickBound);
        }
        
        // 添加窗口大小变化事件
        window.addEventListener('resize', this.handleWindowResizeBound);
        
        // 设置容器大小观察器
        if (this.uiElements.container && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(this.handleContainerResizeBound);
            this.resizeObserver.observe(this.uiElements.container);
        }
        
        // 阻止overlay上的默认触摸行为，防止iOS Safari上的橡皮筋效果
        if (this.uiElements.overlay) {
            this.uiElements.overlay.addEventListener('touchmove', this.handleOverlayTouchMoveBound, { passive: false });
        }
        
        // 设置视频事件监听器
        this.initVideoEventListeners();
    }
    
    /**
     * 初始化视频事件监听器
     */
    initVideoEventListeners() {
        // 视频元数据加载完成监听
        this.handleMetadataLoadedBound = () => {
            if (this.managers.progressManager) {
                this.managers.progressManager.updateProgressBar();
            }
            
            if (this.managers.loopManager) {
                this.managers.loopManager.updateLoopTimeDisplay();
                this.managers.loopManager.updateLoopMarkers();
            }
            
            if (this.managers.dragManager) {
                this.managers.dragManager.updateHandlePosition();
            }
            
            if (this.managers.uiManager) {
                this.managers.uiManager.updateContainerMinHeight();
            }
            
            // 更新SwipeManager以处理动态视频宽度
            if (this.managers.swipeManager) {
                this.managers.swipeManager.updateSize();
            }
        };
        this.targetVideo.addEventListener('loadedmetadata', this.handleMetadataLoadedBound);
        
        // 视频可以播放时也更新容器高度
        this.handleCanPlayBound = () => {
            if (this.managers.uiManager) {
                this.managers.uiManager.updateContainerMinHeight();
            }
            
            // 更新SwipeManager以处理动态视频宽度
            if (this.managers.swipeManager) {
                this.managers.swipeManager.updateSize();
            }
        };
        this.targetVideo.addEventListener('canplay', this.handleCanPlayBound);
        
        // 视频尺寸变化时更新
        this.handleVideoResizeBound = () => {
            if (this.managers.uiManager) {
                this.managers.uiManager.updateContainerMinHeight();
            }
            
            // 更新SwipeManager以处理动态视频宽度
            if (this.managers.swipeManager) {
                this.managers.swipeManager.updateSize();
            }
        };
        this.targetVideo.addEventListener('resize', this.handleVideoResizeBound);
        
        // 监听视频播放状态变化
        this.handlePlayBound = () => {
            if (this.managers.controlManager) {
                this.managers.controlManager.updatePlayPauseButton();
            }
        };
        this.targetVideo.addEventListener('play', this.handlePlayBound);
        
        this.handlePauseBound = () => {
            if (this.managers.controlManager) {
                this.managers.controlManager.updatePlayPauseButton();
                this.managers.controlManager.showPauseIndicator();
            }
        };
        this.targetVideo.addEventListener('pause', this.handlePauseBound);
    }
    
    /**
     * 处理视频包装器点击事件
     */
    handleVideoWrapperClick(e) {
        console.log('[EventManager] 视频包装器点击事件触发');
        // 确保点击事件不被其他控制元素阻挡
        if (e.target === this.uiElements.videoWrapper || e.target === this.targetVideo) {
            // 检查锁定状态，防止快速多次触发
            if (this.clickLock) {
                console.log('[EventManager] 点击锁定中，忽略此次点击');
                return;
            }
            
            // 检查是否刚完成拖动操作，如果是则不触发暂停/播放
            if (this.managers.swipeManager && typeof this.managers.swipeManager.wasRecentlyDragging === 'function' 
                && this.managers.swipeManager.wasRecentlyDragging()) {
                console.log('[EventManager] 忽略拖动后的点击');
                return;
            }
            
            // 设置点击锁定，防止短时间内重复触发
            this.clickLock = true;
            // 清除可能存在的旧定时器
            if (this.clickLockTimeout) {
                clearTimeout(this.clickLockTimeout);
            }
            // 500毫秒后解除锁定
            this.clickLockTimeout = setTimeout(() => {
                this.clickLock = false;
                this.clickLockTimeout = null;
            }, 500);
            
            console.log('[EventManager] 触发视频点击事件，当前状态:', this.targetVideo.paused ? '已暂停' : '正在播放');
            
            if (this.targetVideo.paused) {
                this.targetVideo.play();
            } else {
                this.targetVideo.pause();
                if (this.managers.controlManager) {
                    this.managers.controlManager.showPauseIndicator();
                }
            }
            
            if (this.managers.controlManager) {
                this.managers.controlManager.updatePlayPauseButton();
            }
        }
    }
    
    /**
     * 处理关闭按钮点击事件
     */
    handleCloseButtonClick() {
        console.log('[EventManager] 处理关闭按钮点击');
        // 先移除所有事件监听器
        this.cleanup();
        // 然后关闭播放器
        this.playerCore.close(
            this.uiElements.overlay, 
            this.uiElements.container,
            this.uiElements.playerContainer
        );
    }
    
    /**
     * 处理设置按钮点击事件
     */
    handleSettingsButtonClick() {
        if (this.managers.settingsManager) {
            this.managers.settingsManager.toggleSettingsPanel();
        }
    }
    
    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        // 更新视频大小和位置
        if (this.managers.uiManager) {
            this.managers.uiManager.updateContainerMinHeight();
        }
        
        if (this.managers.dragManager) {
            this.managers.dragManager.updateHandlePosition();
        }
        
        // 更新SwipeManager以处理动态视频宽度
        if (this.managers.swipeManager) {
            this.managers.swipeManager.updateSize();
        }
    }
    
    /**
     * 处理容器大小变化 (由 ResizeObserver 触发)
     */
    handleContainerResize() {
        // 更新拖动手柄位置
        if (this.managers.dragManager) {
            this.managers.dragManager.updateHandlePosition();
        }
        
        // 更新SwipeManager以处理动态视频宽度
        if (this.managers.swipeManager) {
            this.managers.swipeManager.updateSize();
        }
    }
    
    /**
     * 清理所有事件监听器
     */
    cleanup() {
        console.log('[EventManager] 清理所有事件监听器');
        
        // 移除窗口事件
        window.removeEventListener('resize', this.handleWindowResizeBound);
        
        // 停止ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // 清除计时器
        if (this.clickLockTimeout) {
            clearTimeout(this.clickLockTimeout);
            this.clickLockTimeout = null;
        }
        
        // 视频包装器点击事件已由UIManager统一处理，此处不需要移除
        
        // 移除关闭按钮事件
        if (this.uiElements.closeBtn) {
            this.uiElements.closeBtn.removeEventListener('click', this.handleCloseButtonClickBound);
        }
        
        // 移除设置按钮事件
        if (this.uiElements.settingsBtn) {
            this.uiElements.settingsBtn.removeEventListener('click', this.handleSettingsButtonClickBound);
        }
        
        // 移除视频事件监听器
        if (this.targetVideo) {
            this.targetVideo.removeEventListener('loadedmetadata', this.handleMetadataLoadedBound);
            this.targetVideo.removeEventListener('canplay', this.handleCanPlayBound);
            this.targetVideo.removeEventListener('resize', this.handleVideoResizeBound);
            this.targetVideo.removeEventListener('play', this.handlePlayBound);
            this.targetVideo.removeEventListener('pause', this.handlePauseBound);
        }
        
        // 移除overlay的touchmove事件
        if (this.uiElements.overlay) {
            this.uiElements.overlay.removeEventListener('touchmove', this.handleOverlayTouchMoveBound);
        }
    }
} 