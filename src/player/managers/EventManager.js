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
        
        // 初始化调试日志窗口并挂载到 window 上 (已关闭)
        // window.tmDebugLogger = new DebugLogger();
        // window.tmDebugLogger.init();
        
        // 绑定基本方法
        this.handleWindowResizeBound = this.handleWindowResize.bind(this);
        this.handleContainerResizeBound = this.handleContainerResize.bind(this);
        
        // 调试窗口滚动事件 (已关闭，不绑定以优化滚动性能)
        this.handleWindowScrollDebugBound = null;

        // 追踪触碰起始坐标
        this._touchStartX = 0;
        this._touchStartY = 0;
        this.handleTouchStartBound = (e) => {
            if (e.touches && e.touches.length > 0) {
                this._touchStartX = e.touches[0].clientX;
                this._touchStartY = e.touches[0].clientY;
                if (e.target.closest('.tm-video-container')) {
                    if (window.tmDebugLogger) {
                        window.tmDebugLogger.log(`touchStart video. Y: ${this._touchStartY}, scrollY: ${window.scrollY}`);
                    }
                }
            }
        };

        // 阻止右键/长按菜单
        this.handleContextMenuBound = (e) => {
            e.preventDefault();
        };

        // 阻止穿透滚动逻辑：除视频画面区域和可滚动评论内容外，阻止默认的 touchmove/wheel 事件以防止穿透到原始网页
        this.handleScrollPreventionBound = (e) => {
            // 允许视频画面区域穿透（唯独上滑触发底层网页滚动，下滑用于推出播放器）
            if (e.target.closest('.tm-video-container')) {
                if (e.type === 'touchmove') {
                    if (e.touches && e.touches.length > 0) {
                        const currentY = e.touches[0].clientY;
                        const diffY = currentY - this._touchStartY;
                        this._lastTouchY = currentY;

                        // diffY < -5 表示手指向上滑动（Swiping Up），即网页向下滚动
                        if (diffY < -5) {
                            if (window.tmDebugLogger) {
                                window.tmDebugLogger.log(`touchmove video [SWIPE UP]. diffY: ${diffY}, scrollY: ${window.scrollY}. Allow!`);
                            }
                            return; // 允许原生滚动穿透，获得完全丝滑的系统原生滚动体验且无任何闪跳！
                        } else {
                            if (window.tmDebugLogger) {
                                window.tmDebugLogger.log(`touchmove video [SWIPE DOWN/OTHER]. diffY: ${diffY}, scrollY: ${window.scrollY}. Block!`);
                            }
                        }
                    }
                } else if (e.type === 'wheel') {
                    // deltaY > 0 表示滚轮向下滚动，即页面向下移动（相当于上滑手势）
                    if (e.deltaY > 0) {
                        if (window.tmDebugLogger) {
                            window.tmDebugLogger.log(`wheel video [DOWN]. delta: ${e.deltaY}, scrollY: ${window.scrollY}. Allow!`);
                        }
                        return; // 允许原生滚动穿透
                    } else {
                        if (window.tmDebugLogger) {
                            window.tmDebugLogger.log(`wheel video [UP/OTHER]. delta: ${e.deltaY}, scrollY: ${window.scrollY}. Block!`);
                        }
                    }
                }
                
                // 其他滑动方向（如向下滑动或向上滚轮）在视频区域被拦截，阻止穿透
                if (e.cancelable) {
                    e.preventDefault();
                }
                return;
            }

            // 针对水平滚动容器（标签页栏与评论源选项卡），只允许水平滑动，阻止垂直滑动以防穿透
            const horizontalScrollContainer = e.target.closest('.tm-tab-scroll-container, .tm-comments-tabs');
            if (horizontalScrollContainer) {
                if (e.type === 'touchmove') {
                    if (e.touches && e.touches.length > 0) {
                        const currentX = e.touches[0].clientX;
                        const currentY = e.touches[0].clientY;
                        const diffX = Math.abs(currentX - this._touchStartX);
                        const diffY = Math.abs(currentY - this._touchStartY);
                        
                        if (diffY > diffX) {
                            if (e.cancelable) {
                                e.preventDefault();
                            }
                            if (window.tmDebugLogger) {
                                window.tmDebugLogger.log(`horizontal touchmove vertical block. diffY: ${currentY - this._touchStartY}`);
                            }
                        } else {
                            if (window.tmDebugLogger) {
                                window.tmDebugLogger.log(`horizontal touchmove allow. diffX: ${currentX - this._touchStartX}`);
                            }
                        }
                    }
                }
                return;
            }
            
            // 允许评论区内部滚动容器正常在组件内滚动，配合 overscroll-behavior: contain 防止边界穿透
            if (e.target.closest('.tm-comment-section-body, .tm-bottom-sheet-panel, .tm-bottom-sheet-list')) {
                return;
            }
            
            // 阻止其他所有组件的穿透滚动
            if (e.cancelable) {
                e.preventDefault();
            }
        };
        
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
        
        // 阻止穿透滚动：除视频画面区域和可滚动评论内容外，阻止默认的 touchmove/wheel 事件以防止穿透到原始网页
        this._toggleScrollListeners(true);
        
        // 设置视频事件监听器
        this.initVideoEventListeners();
    }

    /**
     * 切换穿透滚动与上下文菜单监听器
     * @private
     */
    _toggleScrollListeners(add = true) {
        const method = add ? 'addEventListener' : 'removeEventListener';
        [this.uiElements.playerContainer, this.uiElements.overlay].forEach(el => {
            if (!el) return;
            el[method]('touchstart', this.handleTouchStartBound, { passive: true });
            el[method]('touchmove', this.handleScrollPreventionBound, { passive: false });
            el[method]('wheel', this.handleScrollPreventionBound, { passive: false });
            el[method]('contextmenu', this.handleContextMenuBound);
        });
    }
    
    /**
     * 初始化视频事件监听器
     */
    initVideoEventListeners() {
        // 视频元数据加载完成监听
        this.handleMetadataLoadedBound = () => {
            if (this.managers.progressManager) this.managers.progressManager.updateProgressBar();
            if (this.managers.loopManager) {
                this.managers.loopManager.updateLoopTimeDisplay();
                this.managers.loopManager.updateLoopMarkers();
            }
            this._notifyLayoutChanged();
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

            // 初始大小确定，更新评论区初始位置
            if (this.managers.controlManager && this.managers.controlManager.commentPanel) {
                this.managers.controlManager.commentPanel.updatePosition();
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

            // 视频尺寸变化时更新评论区位置
            if (this.managers.controlManager && this.managers.controlManager.commentPanel) {
                this.managers.controlManager.commentPanel.updatePosition();
            }
        };
        this.targetVideo.addEventListener('resize', this.handleVideoResizeBound);
        
        // 监听视频播放状态变化
        this.handlePlayBound = () => {
            // 每次播放时二次强化 inline 播放属性，防止宿主脚本动态移除或重构导致 iOS 进入默认全屏
            if (this.targetVideo) {
                this.targetVideo.setAttribute('playsinline', 'true');
                this.targetVideo.setAttribute('webkit-playsinline', 'true');
                this.targetVideo.setAttribute('x5-playsinline', 'true');
                this.targetVideo.playsInline = true;
                this.targetVideo.webkitPlaysInline = true;
            }

            if (this.managers.controlManager) {
                this.managers.controlManager.updatePlayPauseButton();
            }
            // 播放时如果处于横屏，设置定时隐藏控制界面
            if (this.playerCore.uiManager && this.playerCore.uiManager.isLandscape) {
                this.playerCore.uiManager.autoHideControls();
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
            this.managers.dragManager.restoreControlPanelPosition();
        }
        
        // 更新SwipeManager以处理动态视频宽度
        if (this.managers.swipeManager) {
            this.managers.swipeManager.updateSize();
        }

        // 同步更新评论区全屏面板的 Top 偏移量
        if (this.managers.controlManager && this.managers.controlManager.commentPanel) {
            this.managers.controlManager.commentPanel.updatePosition();
        }
    }
    
    /**
     * 处理容器大小变化 (由 ResizeObserver 触发)
     */
    /**
     * 统一通知相关 Manager 布局和尺寸发生改变
     * @private
     */
    _notifyLayoutChanged() {
        if (this.managers.dragManager) this.managers.dragManager.updateHandlePosition();
        if (this.managers.uiManager) this.managers.uiManager.updateContainerMinHeight();
        if (this.managers.swipeManager) this.managers.swipeManager.updateSize();
        if (this.managers.controlManager?.commentPanel) this.managers.controlManager.commentPanel.updatePosition();
    }

    /**
     * 处理容器大小调整事件
     */
    handleContainerResize() {
        this._notifyLayoutChanged();
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
        
        // 移除穿透滚动阻止事件
        this._toggleScrollListeners(false);
        if (this.handleWindowScrollDebugBound) {
            window.removeEventListener('scroll', this.handleWindowScrollDebugBound);
        }
        if (window.tmDebugLogger) {
            window.tmDebugLogger.destroy();
            window.tmDebugLogger = null;
        }
    }
} 