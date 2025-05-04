/**
 * UI管理器类 - 负责创建和管理播放器UI元素
 */
export class UIManager {
    constructor(playerCore) {
        // 核心播放器引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
        // UI 元素引用
        this.overlay = null;             // 背景遮罩
        this.container = null;           // 主容器
        this.playerContainer = null;     // 播放器容器
        this.videoWrapper = null;        // 视频包装器
        this.handleContainer = null;     // 句柄容器
        this.handle = null;              // 句柄元素
        this.closeBtn = null;            // 关闭按钮
        this.settingsBtn = null;         // 设置按钮
        this.settingsPanel = null;       // 设置面板
        this.buttonContainer = null;     // 按钮容器
        
        // 窗口和安全区
        this.safeArea = { top: 44, bottom: 34 };  // 默认安全区域值
        
        // 屏幕方向状态
        this.isLandscape = false;
        
        // 控制界面状态
        this.controlsVisible = true;
        this.controlsHideTimeout = null;
        this.isMouseOverControls = false; // 鼠标是否在控制面板上
        
        // 导入样式
        this.loadStyles();
    }

    /**
     * 加载所需的样式文件
     */
    loadStyles() {
        // 不需要内联样式，样式已迁移到 style.css 文件中
        console.log('[UIManager] 样式已从外部 CSS 文件加载');
    }

    /**
     * 创建UI界面
     */
    createUI() {
        console.log('[UIManager] createUI started.');
        // 创建遮罩和视频容器
        this.createOverlayAndContainer();

        // 创建播放器容器
        this.createPlayerContainer();

        // 创建视频包装器
        this.createVideoWrapper();

        // 创建调整手柄
        this.createResizeHandle();

        // 创建关闭按钮
        this.createCloseButton();

        // 创建设置按钮
        this.createSettingsButton();
        
        // 创建按钮容器
        this.createButtonContainer();

        // 创建设置面板
        this.createSettingsPanel();
        
        // 添加屏幕方向变化监听（只设置window事件，overlay相关事件在组装DOM后设置）
        this.setupOrientationListener();

        console.log('[UIManager] UI基础元素创建完成');
        
        return {
            overlay: this.overlay,
            container: this.container,
            playerContainer: this.playerContainer,
            videoWrapper: this.videoWrapper,
            handleContainer: this.handleContainer,
            handle: this.handle,
            closeBtn: this.closeBtn,
            settingsBtn: this.settingsBtn,
            settingsPanel: this.settingsPanel,
            buttonContainer: this.buttonContainer
        };
    }

    /**
     * 创建遮罩和容器
     */
    createOverlayAndContainer() {
        // 创建遮罩层 - 使用预定义样式类
        this.overlay = document.createElement('div');
        this.overlay.className = 'tm-video-overlay';
        
        // 显式设置z-index，确保在任何情况下都高于浮动按钮
        this.overlay.style.zIndex = '9990';
        
        // 不再手动添加paddingTop和paddingBottom，使用CSS的safe-area-inset变量

        // 计算默认高度和最小高度
        const defaultHeight = window.innerWidth * (4/5);
        const defaultMinHeight = window.innerWidth * (9/16); // 默认16:9比例

        // 创建视频容器 - 使用预定义样式类
        this.container = document.createElement('div');
        this.container.className = 'tm-video-container';
        this.container.style.height = `${defaultHeight}px`;
        this.container.style.minHeight = `${defaultMinHeight}px`;
        
        console.log('[UIManager] Container element created:', this.container);
        console.log('[UIManager] createOverlayAndContainer finished.');
    }

    /**
     * 创建播放器容器
     */
    createPlayerContainer() {
        this.playerContainer = document.createElement('div');
        this.playerContainer.className = 'tm-player-container';
        console.log('[UIManager] Player container created:', this.playerContainer);
    }

    /**
     * 创建视频包装器
     */
    createVideoWrapper() {
        this.videoWrapper = document.createElement('div');
        this.videoWrapper.className = 'tm-video-wrapper';

        // 如果已经存在视频元素，先从父节点移除
        if (this.targetVideo && this.targetVideo.parentNode) {
            this.targetVideo.parentNode.removeChild(this.targetVideo);
        }

        // 禁用原生视频控件
        this.targetVideo.controls = false;

        // 添加视频到包装器
        this.videoWrapper.appendChild(this.targetVideo);
        
        // 添加视频元数据加载事件，用于检测视频比例
        this.targetVideo.addEventListener('loadedmetadata', () => {
            this.updateVideoAspectRatio();
        });
        
        // 长按检测变量
        let longPressTimer = null;
        let isLongPress = false;
        let originalPlaybackRate = 1.0;
        
        // 鼠标/触摸按下事件 - 开始检测长按
        const handlePointerDown = (e) => {
            // 确保点击事件不是从控制按钮冒泡上来的
            if (e.target.closest('.tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button')) {
                return;
            }
            
            // 清除可能存在的定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
            
            // 记录原始播放速度
            originalPlaybackRate = this.playerCore.targetVideo.playbackRate;
            isLongPress = false;
            
            // 设置长按定时器 (3秒)
            longPressTimer = setTimeout(() => {
                // 触发长按事件
                isLongPress = true;
                // 保存当前播放速度
                originalPlaybackRate = this.playerCore.targetVideo.playbackRate;
                // 设置为3倍速
                this.playerCore.targetVideo.playbackRate = 3.0;
                
                // 添加视觉提示
                const speedIndicator = document.createElement('div');
                speedIndicator.className = 'tm-speed-indicator';
                speedIndicator.textContent = '3x';
                speedIndicator.style.position = 'absolute';
                speedIndicator.style.top = '50%';
                speedIndicator.style.left = '50%';
                speedIndicator.style.transform = 'translate(-50%, -50%)';
                speedIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                speedIndicator.style.color = 'white';
                speedIndicator.style.padding = '8px 16px';
                speedIndicator.style.borderRadius = '4px';
                speedIndicator.style.fontSize = '24px';
                speedIndicator.style.fontWeight = 'bold';
                speedIndicator.style.zIndex = '9999';
                this.videoWrapper.appendChild(speedIndicator);
                
                // 触觉反馈
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
                
                // 如果视频当前是暂停的，开始播放
                if (this.playerCore.targetVideo.paused) {
                    this.playerCore.targetVideo.play();
                }
            }, 800); // 800ms的长按时间，减少等待感
        };
        
        // 鼠标/触摸释放事件 - 结束长按
        const handlePointerUp = (e) => {
            // 清除长按定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // 如果是长按状态，恢复原始播放速度并阻止冒泡
            if (isLongPress) {
                // 恢复原始播放速度
                this.playerCore.targetVideo.playbackRate = originalPlaybackRate;
                
                // 移除速度指示器
                const speedIndicator = this.videoWrapper.querySelector('.tm-speed-indicator');
                if (speedIndicator) {
                    speedIndicator.remove();
                }
                
                // 防止触发点击事件
                e.preventDefault();
                e.stopPropagation();
                isLongPress = false;
                return;
            }
        };
        
        // 鼠标/触摸移动离开事件 - 结束长按
        const handlePointerLeave = (e) => {
            // 在鼠标/触摸离开视频区域时也要清除长按
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // 如果是长按状态，恢复原始播放速度
            if (isLongPress) {
                this.playerCore.targetVideo.playbackRate = originalPlaybackRate;
                
                // 移除速度指示器
                const speedIndicator = this.videoWrapper.querySelector('.tm-speed-indicator');
                if (speedIndicator) {
                    speedIndicator.remove();
                }
                
                isLongPress = false;
            }
        };
        
        // 添加鼠标事件监听
        this.videoWrapper.addEventListener('mousedown', handlePointerDown);
        this.videoWrapper.addEventListener('mouseup', handlePointerUp);
        this.videoWrapper.addEventListener('mouseleave', handlePointerLeave);
        
        // 添加触摸事件监听
        this.videoWrapper.addEventListener('touchstart', handlePointerDown, { passive: true });
        this.videoWrapper.addEventListener('touchend', handlePointerUp);
        this.videoWrapper.addEventListener('touchcancel', handlePointerLeave);
        
        // 添加点击事件用于显示/隐藏控制界面（横竖屏均有效）
        this.videoWrapper.addEventListener('click', (e) => {
            // 如果是长按触发的，不执行点击操作
            if (isLongPress) {
                return;
            }
            
            // 确保点击事件不是从控制按钮冒泡上来的
            if (e.target.closest('.tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button')) {
                return;
            }
            
            // 播放/暂停切换函数
            const togglePlayPause = () => {
                if (!this.playerCore.targetVideo) return;
                
                if (this.playerCore.targetVideo.paused) {
                    this.playerCore.targetVideo.play();
                } else {
                    this.playerCore.targetVideo.pause();
                    if (this.playerCore.controlManager) {
                        this.playerCore.controlManager.showPauseIndicator();
                    }
                }
                
                if (this.playerCore.controlManager) {
                    this.playerCore.controlManager.updatePlayPauseButton();
                }
            };
            
            if (this.isLandscape) {
                // 横屏模式下，如果控制界面当前是隐藏状态，则只显示控制界面而不触发暂停
                if (!this.controlsVisible) {
                    this.showControls();
                    this.autoHideControls();
                    return;
                }
                
                // 横屏模式下，如果控制界面已显示，则切换播放/暂停状态
                togglePlayPause();
            } else {
                // 竖屏模式下，直接触发暂停/播放功能
                togglePlayPause();
            }
        });
    }

    /**
     * 创建拖动调整手柄
     */
    createResizeHandle() {
        // 创建手柄容器
        this.handleContainer = document.createElement('div');
        this.handleContainer.className = 'tm-handle-container';

        // 创建手柄
        this.handle = document.createElement('div');
        this.handle.className = 'tm-resize-handle';

        // 添加透明的更大点击区域
        this.handle.insertAdjacentHTML('beforeend', `
            <div style="
                position: absolute;
                left: -10px;
                right: -10px;
                top: -15px;
                bottom: -15px;
                background: transparent;
            "></div>
        `);

        // 悬停效果
        this.handle.addEventListener('mouseenter', () => {
            this.handle.style.opacity = '1';
            this.handle.style.backgroundColor = 'hsla(var(--shadcn-foreground) / 0.8)';
        });

        this.handle.addEventListener('mouseleave', () => {
            if (!this.isDraggingHandle) {
                this.handle.style.opacity = '0.5';
                this.handle.style.backgroundColor = 'hsla(var(--shadcn-foreground) / 0.6)';
            }
        });

        // 添加拖动时的 grabbing 光标
        this.handle.addEventListener('mousedown', () => { 
            this.handle.style.cursor = 'grabbing'; 
            // 添加震动反馈
            if (window.navigator.vibrate) {
                window.navigator.vibrate(5);
            }
        });
        
        // 鼠标松开或移出手柄时恢复 grab
        document.addEventListener('mouseup', () => { 
            if (!this.isDraggingHandle) {
                this.handle.style.cursor = 'grab'; 
            }
        });

        // 添加触摸事件处理
        this.handle.addEventListener('touchstart', () => {
            this.handle.style.opacity = '1';
            this.handle.style.backgroundColor = 'hsla(var(--shadcn-foreground) / 0.8)';
            // 添加震动反馈
            if (window.navigator.vibrate) {
                window.navigator.vibrate(5);
            }
        }, { passive: true });

        this.handle.addEventListener('touchend', () => {
            if (!this.isDraggingHandle) {
                this.handle.style.opacity = '0.5';
                this.handle.style.backgroundColor = 'hsla(var(--shadcn-foreground) / 0.6)';
            }
        });

        // 将手柄添加到其容器中
        this.handleContainer.appendChild(this.handle);
    }

    /**
     * 创建关闭按钮
     */
    createCloseButton() {
        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'tm-close-button tm-control-button-base';

        // 现代化的关闭图标
        const closeIcon = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        this.closeBtn.innerHTML = closeIcon;

        // 添加悬停效果
        this.closeBtn.addEventListener('mouseenter', () => {
            this.closeBtn.style.backgroundColor = 'hsla(var(--shadcn-destructive) / 0.9)';
            this.closeBtn.style.transform = 'scale(1.1)';
        });

        this.closeBtn.addEventListener('mouseleave', () => {
            this.closeBtn.style.backgroundColor = 'hsla(var(--shadcn-background) / 0.7)';
            this.closeBtn.style.transform = 'scale(1)';
        });
    }

    /**
     * 创建设置按钮
     */
    createSettingsButton() {
        this.settingsBtn = document.createElement('button');
        this.settingsBtn.className = 'tm-settings-button tm-control-button-base';

        // 现代化的设置图标
        const settingsIcon = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.83628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        this.settingsBtn.innerHTML = settingsIcon;

        // 添加悬停效果
        this.settingsBtn.addEventListener('mouseenter', () => {
            this.settingsBtn.style.backgroundColor = 'hsla(var(--shadcn-accent) / 0.9)';
            this.settingsBtn.style.transform = 'rotate(45deg)';
        });

        this.settingsBtn.addEventListener('mouseleave', () => {
            this.settingsBtn.style.backgroundColor = 'hsla(var(--shadcn-background) / 0.7)';
            this.settingsBtn.style.transform = 'rotate(0deg)';
        });
    }
    
    /**
     * 创建设置面板
     */
    createSettingsPanel() {
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.className = 'tm-settings-panel';
        this.settingsPanel.style.display = 'none';
    }
    
    /**
     * 创建按钮容器
     */
    createButtonContainer() {
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.className = 'tm-button-container';
        this.buttonContainer.style.display = 'flex';
        this.buttonContainer.style.alignItems = 'center';
        this.buttonContainer.style.gap = '10px';
        this.buttonContainer.style.zIndex = '99999';
    }

    /**
     * 设置屏幕方向变化监听器
     */
    setupOrientationListener() {
        // 检测当前屏幕方向
        this.checkOrientation();
        
        // 添加屏幕方向变化监听
        window.addEventListener('orientationchange', () => {
            // 等待方向变化完成后再判断屏幕方向
            setTimeout(() => {
                this.checkOrientation();
            }, 300);
        });
        
        // 添加窗口大小变化监听（用于桌面端模拟和某些不支持orientationchange的设备）
        window.addEventListener('resize', () => {
            this.checkOrientation();
        });
    }
    
    /**
     * 设置交互事件监听器（在DOM组装后调用）
     */
    setupInteractionListeners() {
        console.log('[UIManager] 设置交互事件监听器');
        
        // 确保overlay已创建
        if (!this.overlay) return;
        
        // 添加鼠标移动和触摸移动监听，用于在横屏模式下保持控制界面可见
        this.overlay.addEventListener('mousemove', () => {
            if (this.isLandscape) {
                this.showControls();
                this.autoHideControls();
            }
        });
        
        this.overlay.addEventListener('touchmove', () => {
            if (this.isLandscape) {
                this.showControls();
                this.autoHideControls();
            }
        }, { passive: true });
        
        // 为控制按钮添加触摸开始事件，防止点击控制按钮时隐藏控制界面
        this.overlay.addEventListener('touchstart', (e) => {
            if (this.isLandscape && e.target.closest('.tm-control-button, .tm-time-control-button, .tm-close-button')) {
                // 触摸控制按钮时重置自动隐藏计时器
                this.showControls();
                this.autoHideControls();
                e.stopPropagation(); // 阻止冒泡到视频包装器
            }
        }, { passive: false });
        
        // 为控制面板添加鼠标进入和离开事件
        if (this.playerCore.controlManager && this.playerCore.controlManager.controlButtonsContainer) {
            const controlButtons = this.playerCore.controlManager.controlButtonsContainer;
            
            controlButtons.addEventListener('mouseenter', () => {
                this.isMouseOverControls = true;
                // 鼠标进入控制面板时，清除隐藏定时器
                if (this.controlsHideTimeout) {
                    clearTimeout(this.controlsHideTimeout);
                    this.controlsHideTimeout = null;
                }
            });
            
            controlButtons.addEventListener('mouseleave', () => {
                this.isMouseOverControls = false;
                // 鼠标离开控制面板时，重新设置自动隐藏
                if (this.isLandscape) {
                    this.autoHideControls();
                }
            });
        }
        
        // 为设置按钮和按钮容器添加鼠标进入和离开事件
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('mouseenter', () => {
                this.isMouseOverControls = true;
                if (this.controlsHideTimeout) {
                    clearTimeout(this.controlsHideTimeout);
                    this.controlsHideTimeout = null;
                }
            });
            
            this.settingsBtn.addEventListener('mouseleave', () => {
                this.isMouseOverControls = false;
                if (this.isLandscape) {
                    this.autoHideControls();
                }
            });
        }
        
        if (this.buttonContainer) {
            this.buttonContainer.addEventListener('mouseenter', () => {
                this.isMouseOverControls = true;
                if (this.controlsHideTimeout) {
                    clearTimeout(this.controlsHideTimeout);
                    this.controlsHideTimeout = null;
                }
            });
            
            this.buttonContainer.addEventListener('mouseleave', () => {
                this.isMouseOverControls = false;
                if (this.isLandscape) {
                    this.autoHideControls();
                }
            });
        }
        
        // 为设置面板添加鼠标进入和离开事件
        if (this.settingsPanel) {
            this.settingsPanel.addEventListener('mouseenter', () => {
                this.isMouseOverControls = true;
                if (this.controlsHideTimeout) {
                    clearTimeout(this.controlsHideTimeout);
                    this.controlsHideTimeout = null;
                }
            });
            
            this.settingsPanel.addEventListener('mouseleave', () => {
                this.isMouseOverControls = false;
                if (this.isLandscape) {
                    this.autoHideControls();
                }
            });
        }
    }
    
    /**
     * 检测并处理屏幕方向
     */
    checkOrientation() {
        // 通过窗口宽高比判断屏幕方向
        const isLandscapeNow = window.innerWidth > window.innerHeight;
        
        // 方向发生变化时处理
        if (this.isLandscape !== isLandscapeNow) {
            this.isLandscape = isLandscapeNow;
            this.handleOrientationChange();
        }
    }
    
    /**
     * 处理屏幕方向变化
     */
    handleOrientationChange() {
        console.log('[UIManager] 屏幕方向变化:', this.isLandscape ? '横屏' : '竖屏');
        
        // 方向变化时更新容器最小高度
        this.updateContainerMinHeight();
        
        // 更新视频比例相关样式
        this.updateVideoAspectRatio();
        
        // 如果存在控制管理器，通知其刷新UI
        if (this.playerCore.controlManager) {
            this.playerCore.controlManager.updateProgressBar();
            this.playerCore.controlManager.updateCurrentTimeDisplay();
            
            // 更新控制面板显示
            this.updateControlPanelVisibility();
        }
        
        // 横屏时隐藏调整手柄
        if (this.handleContainer) {
            this.handleContainer.style.display = this.isLandscape ? 'none' : 'flex';
        }
        
        // 横屏模式下自动显示控制界面，并设置定时隐藏
        if (this.isLandscape) {
            this.showControls();
            this.autoHideControls();
        } else {
            // 竖屏模式下始终显示控制界面
            this.showControls();
            // 清除任何可能存在的定时器
            if (this.controlsHideTimeout) {
                clearTimeout(this.controlsHideTimeout);
                this.controlsHideTimeout = null;
            }
        }
    }
    
    /**
     * 更新控制面板各行的可见性
     */
    updateControlPanelVisibility() {
        if (!this.playerCore.controlManager) return;
        
        const controlButtons = this.playerCore.controlManager.controlButtonsContainer;
        if (!controlButtons) return;
        
        // 查找各控制行
        const progressRow = controlButtons.querySelector('.tm-progress-row');
        const seekControlRow = controlButtons.querySelector('.tm-seek-control-row');
        const loopControlRow = controlButtons.querySelector('.tm-loop-control-row');
        const playbackControlRow = controlButtons.querySelector('.tm-playback-control-row');
        
        if (this.isLandscape) {
            // 横屏模式下，显示所有控制行
            if (progressRow) {
                progressRow.style.display = 'flex';
                progressRow.style.backgroundColor = 'transparent';
            }
            
            if (seekControlRow) {
                seekControlRow.style.display = 'flex';
                seekControlRow.style.justifyContent = 'center';
                seekControlRow.style.alignItems = 'center';
                seekControlRow.style.gap = '20px';
                seekControlRow.style.backgroundColor = 'transparent';
            }
            
            if (loopControlRow) {
                loopControlRow.style.display = 'flex';
                loopControlRow.style.backgroundColor = 'transparent';
            }
            
            if (playbackControlRow) {
                playbackControlRow.style.display = 'flex';
                playbackControlRow.style.backgroundColor = 'transparent';
            }
            
            // 设置按钮也显示
            if (this.settingsBtn) {
                this.settingsBtn.style.display = 'flex';
                this.settingsBtn.style.backgroundColor = 'hsla(var(--shadcn-secondary) / 0.3)';
                this.settingsBtn.style.backdropFilter = 'blur(4px)';
            }
            
            // 调整快退快进按钮组的布局
            const rewindGroup = controlButtons.querySelector('.tm-rewind-group');
            const forwardGroup = controlButtons.querySelector('.tm-forward-group');
            if (rewindGroup) {
                rewindGroup.style.width = 'auto';
                rewindGroup.style.flex = '0 1 auto';
            }
            if (forwardGroup) {
                forwardGroup.style.width = 'auto';
                forwardGroup.style.flex = '0 1 auto';
            }
        } else {
            // 竖屏模式下恢复默认显示
            if (progressRow) progressRow.style.display = '';
            if (seekControlRow) {
                seekControlRow.style.display = '';
                seekControlRow.style.justifyContent = '';
                seekControlRow.style.alignItems = '';
                seekControlRow.style.gap = '';
            }
            if (loopControlRow) loopControlRow.style.display = '';
            if (playbackControlRow) playbackControlRow.style.display = '';
            
            // 恢复设置按钮样式
            if (this.settingsBtn) {
                this.settingsBtn.style.display = '';
                this.settingsBtn.style.backgroundColor = '';
                this.settingsBtn.style.backdropFilter = '';
            }
            
            // 恢复快退快进按钮组的布局
            const rewindGroup = controlButtons.querySelector('.tm-rewind-group');
            const forwardGroup = controlButtons.querySelector('.tm-forward-group');
            if (rewindGroup) {
                rewindGroup.style.width = '';
                rewindGroup.style.flex = '';
            }
            if (forwardGroup) {
                forwardGroup.style.width = '';
                forwardGroup.style.flex = '';
            }
        }
    }
    
    /**
     * 更新视频纵横比相关样式
     */
    updateVideoAspectRatio() {
        if (!this.videoWrapper || !this.targetVideo) return;
        
        const videoWidth = this.targetVideo.videoWidth;
        const videoHeight = this.targetVideo.videoHeight;
        
        if (videoWidth && videoHeight) {
            const videoRatio = videoWidth / videoHeight;
            const isVideoPortrait = videoRatio < 1; // 视频是否为竖屏比例
            
            // 根据视频比例调整视频包装器样式
            if (isVideoPortrait) {
                this.videoWrapper.classList.add('video-portrait');
            } else {
                this.videoWrapper.classList.remove('video-portrait');
            }
            
            console.log('[UIManager] 视频比例更新:', videoRatio, isVideoPortrait ? '竖屏视频' : '横屏视频');
        }
    }
    
    /**
     * 显示控制界面
     */
    showControls() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('controls-hidden');
        document.body.classList.remove('controls-hidden');
        this.controlsVisible = true;
        
        // 清除可能存在的隐藏定时器
        if (this.controlsHideTimeout) {
            clearTimeout(this.controlsHideTimeout);
            this.controlsHideTimeout = null;
        }
    }
    
    /**
     * 隐藏控制界面
     */
    hideControls() {
        if (!this.overlay || !this.isLandscape) return;
        
        this.overlay.classList.add('controls-hidden');
        document.body.classList.add('controls-hidden');
        this.controlsVisible = false;
    }
    
    /**
     * 切换控制界面显示/隐藏
     */
    toggleControlsVisibility() {
        if (this.controlsVisible) {
            this.hideControls();
        } else {
            this.showControls();
            // 显示后设置自动隐藏
            this.autoHideControls();
        }
    }
    
    /**
     * 设置自动隐藏控制界面
     */
    autoHideControls() {
        // 只在横屏模式下设置自动隐藏
        if (!this.isLandscape) return;
        
        // 如果鼠标在控制面板上，不设置自动隐藏
        if (this.isMouseOverControls) return;
        
        // 清除可能存在的定时器
        if (this.controlsHideTimeout) {
            clearTimeout(this.controlsHideTimeout);
        }
        
        // 设置3秒后自动隐藏
        this.controlsHideTimeout = setTimeout(() => {
            this.hideControls();
        }, 3000);
    }

    /**
     * 更新视频容器的最小高度
     */
    updateContainerMinHeight() {
        if (!this.container || !this.targetVideo) return;
        
        // 横屏模式下不需要设置最小高度，CSS会处理
        if (this.isLandscape) {
            console.log('[UIManager] 横屏模式，使用CSS样式控制高度');
            return;
        }
        
        const videoWidth = this.targetVideo.videoWidth || this.targetVideo.naturalWidth;
        const videoHeight = this.targetVideo.videoHeight || this.targetVideo.naturalHeight;
        
        if (videoWidth && videoHeight) {
            // 使用视频原始比例计算最小高度
            const minHeight = window.innerWidth * (videoHeight / videoWidth);
            this.container.style.minHeight = `${minHeight}px`;
            console.log('[UIManager] 更新容器最小高度:', minHeight);
        }
    }

    /**
     * 组装DOM结构
     */
    assembleDOM() {
        // 确保先将视频包装器添加到容器
        this.container.appendChild(this.videoWrapper);
        
        // 将关闭按钮和设置按钮添加到按钮容器
        this.buttonContainer.appendChild(this.closeBtn);
        this.buttonContainer.appendChild(this.settingsBtn);
        
        // 将按钮容器添加到播放器容器
        this.playerContainer.appendChild(this.buttonContainer);
        
        // 将容器添加到播放器容器
        this.playerContainer.appendChild(this.container);
        
        // 将手柄容器添加到播放器容器
        this.playerContainer.appendChild(this.handleContainer);
        
        // 添加设置面板到播放器容器
        this.playerContainer.appendChild(this.settingsPanel);
        
        // 如果存在控制按钮，也添加到播放器容器内
        if (this.playerCore.controlManager && this.playerCore.controlManager.controlButtonsContainer) {
            this.playerContainer.appendChild(this.playerCore.controlManager.controlButtonsContainer);
        }
        
        // 将overlay添加到document.body
        document.body.appendChild(this.overlay);
        
        // 将playerContainer与overlay同级添加到document.body，而不是作为overlay的子元素
        document.body.appendChild(this.playerContainer);
        
        // 立即更新容器最小高度
        this.updateContainerMinHeight();
        
        // 在DOM组装完成后设置交互监听器
        this.setupInteractionListeners();
        
        console.log('[UIManager] DOM组装完成', {
            overlay: this.overlay.isConnected,
            playerContainer: this.playerContainer.isConnected,
            container: this.container.isConnected,
            videoWrapper: this.videoWrapper.isConnected,
            video: this.targetVideo.isConnected
        });
    }
} 