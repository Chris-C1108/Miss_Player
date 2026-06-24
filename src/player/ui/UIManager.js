/**
 * UI管理器类 - 负责创建和管理播放器UI元素
 */
import { delegateEvent } from '../../utils/index.js';
import { LAYOUT_LEFT, LAYOUT_RIGHT, COMMENTS_SHOW, COMMENTS_HIDE } from '../../constants/icons.js';

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
        this.titleEl = null;             // 播放器顶部标题
        this.sidebarPosBtn = null;       // 侧栏位置切换按钮
        this.sidebarToggleBtn = null;    // 侧栏显示隐藏按钮
        
        // 侧边栏布局状态
        const state = this.playerCore.options.playerState;
        this.isSidebarHidden = state ? state.settings.sidebarHidden : false;
        this.sidebarPosition = state ? state.settings.sidebarPosition : 'right';
        
        // 窗口和安全区
        this.safeArea = { top: 44, bottom: 34 };  // 默认安全区域值
        
        // 屏幕方向状态
        this.isLandscape = false;
        
        // 控制界面状态
        this.controlsVisible = true;
        this.controlsHideTimerId = null; // 使用ID代替timeout引用
        this.isMouseOverControls = false; // 鼠标是否在控制面板上
        
        // 方向感知的手动调整高度标记及数值
        this.isCustomResizedPortrait = false;
        this.isCustomResizedLandscape = false;
        this.customHeightPortrait = null;
        this.customHeightLandscape = null;
        
        // 导入样式
        this.loadStyles();
    }

    /**
     * 手动调整高度标记的方向感知获取器
     */
    get isCustomResized() {
        return this.isLandscape ? this.isCustomResizedLandscape : this.isCustomResizedPortrait;
    }

    /**
     * 手动调整高度标记的方向感知设置器
     */
    set isCustomResized(val) {
        if (this.isLandscape) {
            this.isCustomResizedLandscape = val;
        } else {
            this.isCustomResizedPortrait = val;
        }
    }

    /**
     * 判断当前是否为悬浮控制面板模式（PC横屏或iPad竖屏及以上）
     */
    get isFloatingControlPanel() {
        return window.innerWidth >= 480;
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

        // 创建顶部标题
        this.createTitle();

        // 创建设置按钮
        this.createSettingsButton();
        
        // 创建侧边栏控制按钮
        this.createSidebarControls();
        
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
            titleEl: this.titleEl,
            sidebarPosBtn: this.sidebarPosBtn,
            sidebarToggleBtn: this.sidebarToggleBtn,
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
        
        // 显式设置z-index，确保在任何情况下都高于浮动按钮与宿主顶栏
        this.overlay.style.zIndex = '2000000000';
        
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
        this.playerContainer.style.zIndex = '2000000001';
        
        // 应用初始侧边栏状态类名
        if (this.isSidebarHidden) {
            this.playerContainer.classList.add('tm-sidebar-hidden');
        }
        if (this.sidebarPosition === 'left') {
            this.playerContainer.classList.add('tm-sidebar-left');
        }
        
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
        this.isLongPress = false; // 挂载到实例上，暴露给外部模块如 VideoSwipeManager
        this.longPressStartX = 0;
        this.longPressStartY = 0;
        
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
            this.isLongPress = false;
            
            // 记录初始触摸/指针位置
            const touch = e.type.includes('touch');
            const touchObj = touch && e.touches ? e.touches[0] : null;
            this.longPressStartX = touchObj ? touchObj.clientX : e.clientX;
            this.longPressStartY = touchObj ? touchObj.clientY : e.clientY;
            
            // 设置长按定时器 (3秒)
            longPressTimer = setTimeout(() => {
                // 触发长按事件
                isLongPress = true;
                this.isLongPress = true;
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
        
        // 指针/触摸移动事件 - 解决与拖拽/滑动的冲突
        const handlePointerMove = (e) => {
            if (longPressTimer && !isLongPress) {
                const touch = e.type.includes('touch');
                const touchObj = touch && e.touches ? e.touches[0] : null;
                if (touch && !touchObj) return;
                
                const currentX = touchObj ? touchObj.clientX : e.clientX;
                const currentY = touchObj ? touchObj.clientY : e.clientY;
                
                const deltaX = currentX - this.longPressStartX;
                const deltaY = currentY - this.longPressStartY;
                const dist = Math.hypot(deltaX, deltaY);
                
                if (dist > 10) {
                    // 滑动距离大于 10px，取消长按 3 倍速检测，防止与左右拖拽/向下滑动冲突
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
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
                this.isLongPress = false;
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
                this.isLongPress = false;
            }
        };
        
        // 添加鼠标事件监听
        this.videoWrapper.addEventListener('mousedown', handlePointerDown);
        this.videoWrapper.addEventListener('mouseup', handlePointerUp);
        this.videoWrapper.addEventListener('mousemove', handlePointerMove);
        this.videoWrapper.addEventListener('mouseleave', handlePointerLeave);
        
        // 添加触摸事件监听
        this.videoWrapper.addEventListener('touchstart', handlePointerDown, { passive: true });
        this.videoWrapper.addEventListener('touchend', handlePointerUp);
        this.videoWrapper.addEventListener('touchmove', handlePointerMove, { passive: true });
        this.videoWrapper.addEventListener('touchcancel', handlePointerLeave);
        
        // 添加点击事件用于显示/隐藏控制界面（横竖屏均有效）
        this.videoWrapper.addEventListener('click', (e) => {
            // 如果是长按触发的，不执行点击操作
            if (isLongPress) {
                return;
            }
            
            // 检查是否刚完成拖动/左右滑动操作，如果是则不触发暂停/播放或控制栏切换
            if (this.playerCore.swipeManager && typeof this.playerCore.swipeManager.wasRecentlyDragging === 'function' 
                && this.playerCore.swipeManager.wasRecentlyDragging()) {
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
            
            // 如果控制界面当前是隐藏状态，则只显示控制界面而不触发暂停（横竖屏一致）
            if (!this.controlsVisible) {
                this.showControls();
                if (this.isLandscape) {
                    this.autoHideControls();
                }
                return;
            }
            
            // 如果控制界面已显示，则切换播放/暂停状态
            togglePlayPause();
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
     * 获取视频标题
     */
    getVideoTitle() {
        // 尝试从 Jable.tv 的 h4 获取标题
        const h4 = document.querySelector('h4');
        if (h4 && h4.textContent) {
            return h4.textContent.trim();
        }
        
        // 尝试从 h1 获取
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent) {
            return h1.textContent.trim();
        }
        
        // 兜底使用页面 document.title 并且清洗掉后缀
        let title = document.title || '';
        title = title.replace(/\s*-\s*Jable\.tv.*$/i, '');
        title = title.replace(/\s*-\s*JAVLibrary.*$/i, '');
        return title.trim();
    }

    /**
     * 创建播放器顶部标题
     */
    createTitle() {
        this.titleEl = document.createElement('span');
        this.titleEl.className = 'tm-player-title';
        this.titleEl.textContent = this.getVideoTitle();
    }
    
    /**
     * 创建侧边栏控制按钮
     */
    createSidebarControls() {
        // 1. 位置切换按钮
        this.sidebarPosBtn = document.createElement('button');
        this.sidebarPosBtn.className = 'tm-sidebar-pos-button tm-control-button-base';
        this.sidebarPosBtn.style.display = 'flex';
        this.updateSidebarPosButtonIcon();
        this.sidebarPosBtn.title = this.sidebarPosition === 'right' ? '切换侧边栏到左侧' : '切换侧边栏到右侧';

        this.sidebarPosBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebarPosition();
        });

        // 2. 显示/隐藏切换按钮
        this.sidebarToggleBtn = document.createElement('button');
        this.sidebarToggleBtn.className = 'tm-sidebar-toggle-button tm-control-button-base';
        this.sidebarToggleBtn.style.display = 'flex';
        this.updateSidebarToggleButtonIcon();
        this.sidebarToggleBtn.title = this.isSidebarHidden ? '显示评论区' : '隐藏评论区';

        this.sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebarVisibility();
        });
    }

    /**
     * 更新侧栏位置按钮的图标
     */
    updateSidebarPosButtonIcon() {
        if (!this.sidebarPosBtn) return;
        this.sidebarPosBtn.innerHTML = this.sidebarPosition === 'right' ? LAYOUT_LEFT : LAYOUT_RIGHT;
    }

    /**
     * 更新侧栏隐藏按钮的图标
     */
    updateSidebarToggleButtonIcon() {
        if (!this.sidebarToggleBtn) return;
        this.sidebarToggleBtn.innerHTML = this.isSidebarHidden ? COMMENTS_SHOW : COMMENTS_HIDE;
    }

    /**
     * 切换侧栏位置 (Left/Right)
     */
    toggleSidebarPosition() {
        this.sidebarPosition = this.sidebarPosition === 'right' ? 'left' : 'right';
        
        // 更新容器类名
        if (this.sidebarPosition === 'left') {
            this.playerContainer.classList.add('tm-sidebar-left');
        } else {
            this.playerContainer.classList.remove('tm-sidebar-left');
        }
        
        // 更新图标与 title
        this.updateSidebarPosButtonIcon();
        this.sidebarPosBtn.title = this.sidebarPosition === 'right' ? '切换侧边栏到左侧' : '切换侧边栏到右侧';
        
        // 保存状态
        const state = this.playerCore.options.playerState;
        if (state) {
            state.updateSetting('sidebarPosition', this.sidebarPosition);
        }

        // 如果当前控制面板是吸附停靠状态，则自动变换吸附锚点（TL <-> TR, BL <-> BR），携带其一同切换
        const dragManager = this.playerCore.dragManager;
        if (dragManager) {
            const saved = localStorage.getItem('tm-control-panel-pos');
            if (saved) {
                try {
                    const savedData = JSON.parse(saved);
                    if (savedData.didSnap && savedData.anchorName) {
                        let newAnchor = savedData.anchorName;
                        if (this.sidebarPosition === 'left') {
                            if (newAnchor === 'TR') newAnchor = 'TL';
                            if (newAnchor === 'BR') newAnchor = 'BL';
                        } else {
                            if (newAnchor === 'TL') newAnchor = 'TR';
                            if (newAnchor === 'BL') newAnchor = 'BR';
                        }
                        
                        if (newAnchor !== savedData.anchorName) {
                            savedData.anchorName = newAnchor;
                            localStorage.setItem('tm-control-panel-pos', JSON.stringify(savedData));
                            dragManager.restoreControlPanelPosition();
                        }
                    }
                } catch (e) {
                    console.error('[UIManager] 切换侧栏位置连动控制面板吸附出错:', e);
                }
            }
        }
        
        console.log('[UIManager] 切换侧栏位置:', this.sidebarPosition);
    }

    /**
     * 切换侧栏显示/隐藏
     */
    toggleSidebarVisibility() {
        this.isSidebarHidden = !this.isSidebarHidden;
        
        // 更新容器类名
        if (this.isSidebarHidden) {
            this.playerContainer.classList.add('tm-sidebar-hidden');
            // 隐藏评论区时，如果之前是吸附状态，需要清理吸附高度排版影响
            this.playerContainer.classList.remove('tm-controls-docked-tr', 'tm-controls-docked-br');
            this.playerContainer.style.removeProperty('--docked-controls-height');
            
            // 图标与 title 更新
            this.updateSidebarToggleButtonIcon();
            this.sidebarToggleBtn.title = '显示评论区';
            
            // 连动：开启 3 秒自动隐藏控制面板计时器
            this.autoHideControls();
        } else {
            this.playerContainer.classList.remove('tm-sidebar-hidden');
            
            // 图标与 title 更新
            this.updateSidebarToggleButtonIcon();
            this.sidebarToggleBtn.title = '隐藏评论区';
            
            // 连动：强制显示控制栏 (阻止自动隐藏)
            this.showControls();
            
            // 连动：重新应用吸附排版状态
            if (this.playerCore.dragManager) {
                this.playerCore.dragManager.reapplyDockedState();
            }
        }
        
        // 动态调换按钮容器的挂载父节点，确保隐藏侧栏后按钮依然可用
        this.updateButtonContainerParent();
        
        // 保存状态
        const state = this.playerCore.options.playerState;
        if (state) {
            state.updateSetting('sidebarHidden', this.isSidebarHidden);
        }
        
        console.log('[UIManager] 切换侧栏显示状态:', this.isSidebarHidden ? '隐藏' : '显示');
    }

    /**
     * 动态调换按钮容器的挂载父节点，确保隐藏侧栏后按钮依然可见并可被点击
     */
    updateButtonContainerParent() {
        if (!this.buttonContainer) return;
        
        const commentPanel = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
        const commentsPanelEl = commentPanel && commentPanel.commentsPanel;
        const isPcLandscape = this.isLandscape && window.innerWidth >= 930 && window.innerHeight >= 400;
        
        const targetParent = (commentsPanelEl && isPcLandscape && !this.isSidebarHidden)
            ? commentsPanelEl
            : this.playerContainer;
        
        // 如果目标父节点相同，跳过
        if (this.buttonContainer.parentNode === targetParent) return;
        
        // 先淡出
        this.buttonContainer.style.opacity = '0';
        this.buttonContainer.style.transition = 'opacity 0.15s ease';
        
        // 在下一帧执行迁移
        requestAnimationFrame(() => {
            if (!this.buttonContainer) return;
            
            if (targetParent === commentsPanelEl) {
                commentsPanelEl.insertBefore(this.buttonContainer, commentsPanelEl.firstChild);
                console.log('[UIManager] 按钮容器挂载到评论区顶部');
            } else {
                if (commentsPanelEl && commentsPanelEl.parentNode === this.playerContainer) {
                    this.playerContainer.insertBefore(this.buttonContainer, commentsPanelEl);
                } else {
                    this.playerContainer.appendChild(this.buttonContainer);
                }
                console.log('[UIManager] 按钮容器挂载到主容器');
            }
            
            // 迁移后在下一帧淡入
            requestAnimationFrame(() => {
                if (!this.buttonContainer) return;
                this.buttonContainer.style.opacity = '1';
                // 清理过渡样式
                setTimeout(() => {
                    if (this.buttonContainer) {
                        this.buttonContainer.style.transition = '';
                    }
                }, 200);
            });
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
        
        // 定义强制布局更新辅助函数，确保任何方向/大小变化时 UI 不错位
        const triggerLayoutUpdate = () => {
            this.checkOrientation();
            // 无论 orientation 状态是否改变，都强制刷新关键布局和高度，防止 iOS Safari 延迟获取尺寸导致布局失效
            this.updateContainerMinHeight();
            this.updateVideoAspectRatio();
            if (this.playerCore.progressManager) {
                this.playerCore.progressManager.updateProgressBar();
                this.playerCore.progressManager.updateCurrentTimeDisplay();
            }
            this.updateButtonContainerParent();
        };

        // 使用 requestAnimationFrame 和 debounce 合并/去重更新请求
        let pendingUpdate = false;
        let rafId = null;
        let resizeTimer = null;

        const scheduleLayoutUpdate = (delay = 0) => {
            if (delay > 0) {
                setTimeout(() => scheduleLayoutUpdate(0), delay);
                return;
            }
            if (pendingUpdate) return;
            pendingUpdate = true;
            rafId = requestAnimationFrame(() => {
                pendingUpdate = false;
                triggerLayoutUpdate();
            });
        };

        // 1. screen.orientation API (现代浏览器优先)
        if (screen && screen.orientation) {
            this.screenOrientationListener = () => {
                scheduleLayoutUpdate(0);
            };
            screen.orientation.addEventListener('change', this.screenOrientationListener);
        }
        
        // 2. orientationchange 监听 (iOS Safari 兼容)
        this.orientationListener = () => {
            // 在旋转完成后单次延迟更新，确保能捕获到 iOS Safari 最终稳定的尺寸
            scheduleLayoutUpdate(200);
        };
        window.addEventListener('orientationchange', this.orientationListener);
        
        // 3. ResizeObserver 监听容器尺寸 (更精准，替代一般的 resize 乱发事件)
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                scheduleLayoutUpdate(0);
            });
            this.resizeObserver.observe(document.documentElement);
        }
        
        // 4. window resize 监听 (最后兜底 + 100ms debounce)
        this.resizeListener = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                scheduleLayoutUpdate(0);
            }, 100);
        };
        window.addEventListener('resize', this.resizeListener);
        
        // 存储清理引用，以防多次初始化或在 cleanup() 中调用
        this._cleanupLayoutSchedulers = () => {
            if (rafId) cancelAnimationFrame(rafId);
            if (resizeTimer) clearTimeout(resizeTimer);
        };
    }

    /**
     * 清理所有屏幕/大小监听器和定时器
     */
    cleanup() {
        if (this._cleanupLayoutSchedulers) {
            this._cleanupLayoutSchedulers();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.orientationListener) {
            window.removeEventListener('orientationchange', this.orientationListener);
            this.orientationListener = null;
        }
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
        if (this.screenOrientationListener && screen && screen.orientation) {
            screen.orientation.removeEventListener('change', this.screenOrientationListener);
            this.screenOrientationListener = null;
        }
        if (this.controlsHideTimerId) {
            clearTimeout(this.controlsHideTimerId);
            this.controlsHideTimerId = null;
        }
    }
    
    /**
     * 设置交互事件监听器（在DOM组装后调用）
     */
    setupInteractionListeners() {
        console.log('[UIManager] 设置交互事件监听器');
        
        // 确保overlay已创建
        if (!this.overlay) return;
        
        // 使用事件委托处理鼠标移动和触摸移动
        // 使用事件委托处理鼠标移动和触摸移动，绑定到整个 playerContainer 以支持隐藏侧栏或竖屏模式下的控制恢复
        this.playerContainer.addEventListener('mousemove', (e) => {
            if (e && e.target && e.target.closest && e.target.closest('.tm-comments-panel')) {
                return;
            }
            this.showControls();
            if (this.isLandscape) {
                this.autoHideControls();
            }
        });
        
        this.playerContainer.addEventListener('touchmove', (e) => {
            if (e && e.target && e.target.closest && e.target.closest('.tm-comments-panel')) {
                return;
            }
            this.showControls();
            if (this.isLandscape) {
                this.autoHideControls();
            }
        }, { passive: true });
        
        // 使用事件委托处理触摸事件
        this.playerContainer.addEventListener('touchstart', (e) => {
            if (e.target.closest('.tm-control-button, .tm-time-control-button, .tm-close-button, .tm-settings-button, .tm-sidebar-toggle-button')) {
                // 触摸控制按钮时重置自动隐藏计时器
                this.showControls();
                if (this.isLandscape) {
                    this.autoHideControls();
                }
                e.stopPropagation(); // 阻止冒泡到视频包装器
            }
        }, { passive: false });
        
        // 使用事件委托处理mouseenter事件
        delegateEvent(this.playerContainer, 'mouseenter', '.tm-control-buttons, .tm-settings-button, .tm-button-container, .tm-settings-panel', () => {
            this.isMouseOverControls = true;
            if (this.controlsHideTimerId) {
                clearTimeout(this.controlsHideTimerId);
                this.controlsHideTimerId = null;
            }
        });
        
        // 使用事件委托处理mouseleave事件
        delegateEvent(this.playerContainer, 'mouseleave', '.tm-control-buttons, .tm-settings-button, .tm-button-container, .tm-settings-panel', () => {
            this.isMouseOverControls = false;
            if (this.isLandscape) {
                this.autoHideControls();
            }
        });
        
    }
    
    /**
     * 检测并处理屏幕方向
     */
    checkOrientation() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // 1. 虚拟键盘激活状态下，忽略方向变更（防止键盘弹起高度骤降误判为横屏）
        const isKeyboardActive = () => {
            const el = document.activeElement;
            if (!el) return false;
            const tagName = el.tagName.toLowerCase();
            return tagName === 'textarea' || (tagName === 'input' && ['text', 'search', 'url', 'email', 'number'].includes(el.type));
        };
        
        if (isKeyboardActive()) {
            console.log('[UIManager] 键盘激活中，忽略屏幕方向检测');
            return;
        }

        // 2. 宽高比死区保护（防止在 1:1 分屏等临界比例下快速抖动）
        const ratio = w / h;
        const PORTRAIT_THRESHOLD = 0.85;
        const LANDSCAPE_THRESHOLD = 1.18;
        
        let isLandscapeNow = this.isLandscape;
        if (ratio < PORTRAIT_THRESHOLD) {
            isLandscapeNow = false;
        } else if (ratio > LANDSCAPE_THRESHOLD) {
            isLandscapeNow = true;
        }
        
        // 3. 移动端环境下，如果 screen.orientation 存在，与其物理方向保持一致（除非在分屏等极大冲突情况）
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (hasTouch && screen && screen.orientation && screen.orientation.type) {
            const screenType = screen.orientation.type;
            const screenIsLandscape = screenType.includes('landscape');
            if (ratio < PORTRAIT_THRESHOLD && screenIsLandscape) {
                isLandscapeNow = false; // 分屏模式尊重窗口比例
            } else if (ratio > LANDSCAPE_THRESHOLD && !screenIsLandscape) {
                isLandscapeNow = true;
            }
        }
        
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
        
        // 恢复或清除对应方向下的高度
        if (!this.isLandscape) {
            if (this.isCustomResizedPortrait && this.customHeightPortrait) {
                this.container.style.height = this.customHeightPortrait;
                console.log('[UIManager] 恢复用户手动调整的竖屏高度:', this.customHeightPortrait);
            }
        } else {
            // 横屏高度由 CSS 样式控制，移除行内 height
            this.container.style.height = '';
        }
        
        // 方向变化时更新容器最小高度
        this.updateContainerMinHeight();
        
        // 更新视频比例相关样式
        this.updateVideoAspectRatio();
        
        // 如果存在进度管理器，通知其刷新UI
        if (this.playerCore.progressManager) {
            this.playerCore.progressManager.updateProgressBar();
            this.playerCore.progressManager.updateCurrentTimeDisplay();
        }
        
        // 如果存在控制管理器，通知其刷新UI
        if (this.playerCore.controlManager) {
            // 更新控制面板显示
            this.updateControlPanelVisibility();
        }
        
        // 旋转后控制面板重新计算并恢复位置，防止超出视口边界
        if (this.playerCore.dragManager) {
            this.playerCore.dragManager.restoreControlPanelPosition();
        }
        
        // 横屏模式下自动隐藏控制界面（如果是手机横屏，即宽 < 930px 或高 < 400px），或显示并定时隐藏（PC大屏 >= 930px 且高 >= 400px）
        if (this.isLandscape) {
            if (window.innerWidth < 930 || window.innerHeight < 400) {
                this.hideControls(true);
            } else {
                this.showControls();
                this.autoHideControls();
            }
        } else {
            // 竖屏模式下始终显示控制界面
            this.showControls();
            // 清除任何可能存在的定时器
            if (this.controlsHideTimerId) {
                clearTimeout(this.controlsHideTimerId);
                this.controlsHideTimerId = null;
            }
        }
        
        // 屏幕方向改变时同步调整按钮栏的挂载位置
        this.updateButtonContainerParent();
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
        } else {
            // 竖屏模式下恢复默认显示
            if (progressRow) progressRow.style.display = '';
            if (seekControlRow) {
                seekControlRow.style.display = '';
            }
            if (loopControlRow) loopControlRow.style.display = '';
            if (playbackControlRow) playbackControlRow.style.display = '';
            
            // 恢复设置按钮样式
            if (this.settingsBtn) {
                this.settingsBtn.style.display = '';
                this.settingsBtn.style.backgroundColor = '';
                this.settingsBtn.style.backdropFilter = '';
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
        if (this.controlsHideTimerId) {
            clearTimeout(this.controlsHideTimerId);
            this.controlsHideTimerId = null;
        }

        // 手机竖屏场景下：控制面板显示时 评论区变暗
        if (!this.isLandscape) {
            const commentPanel = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
            if (commentPanel && commentPanel.commentsPanel) {
                commentPanel.commentsPanel.classList.add('is-dimmed');
            }
        }
    }
    
    /**
     * 隐藏控制界面
     * @param {boolean} force - 是否强制隐藏 (绕过横屏/评论区显示状态判断)
     */
    hideControls(force = false) {
        if (!this.overlay) return;
        if (!this.isLandscape && !force) return;
        
        // 如果评论区显示且不是强制隐藏，则不隐藏控制面板
        if (!this.isSidebarHidden && !force) {
            return;
        }
        
        this.overlay.classList.add('controls-hidden');
        document.body.classList.add('controls-hidden');
        this.controlsVisible = false;

        // 手机竖屏场景下：控制面板隐藏时评论区自动变亮 (解除变暗)
        if (!this.isLandscape) {
            const commentPanel = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
            if (commentPanel && commentPanel.commentsPanel) {
                commentPanel.commentsPanel.classList.remove('is-dimmed');
            }
        }
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
        if (!this.isLandscape) {
            return;
        }
        
        // 如果评论区处于显示状态，不设置自动隐藏
        if (!this.isSidebarHidden) {
            return;
        }
        
        // 如果鼠标在控制面板上，不设置自动隐藏
        if (this.isMouseOverControls) {
            return;
        }
        
        if (this.controlsHideTimerId) {
            clearTimeout(this.controlsHideTimerId);
        }
        
        // 设置3秒后自动隐藏
        this.controlsHideTimerId = setTimeout(() => {
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
        
        let minHeight = window.innerWidth * (9/16); // 默认16:9比例
        if (videoWidth && videoHeight) {
            minHeight = window.innerWidth * (videoHeight / videoWidth);
        }
        
        this.container.style.minHeight = `${minHeight}px`;
        
        if (!this.isCustomResized) {
            const defaultHeight = window.innerWidth * (4/5);
            this.container.style.height = `${defaultHeight}px`;
            console.log('[UIManager] 自动更新容器高度为默认比例高度:', defaultHeight);
        } else if (this.customHeightPortrait) {
            const currentHeight = parseFloat(this.customHeightPortrait);
            if (currentHeight < minHeight) {
                this.container.style.height = `${minHeight}px`;
                this.customHeightPortrait = `${minHeight}px`;
            } else {
                this.container.style.height = this.customHeightPortrait;
            }
        }
        
        console.log('[UIManager] 更新容器高度和最小高度:', this.container.style.height, minHeight);
    }

    /**
     * 组装DOM结构
     */
    assembleDOM() {
        // 确保先将视频包装器添加到容器
        this.container.appendChild(this.videoWrapper);
        
        // 将标题加到播放器容器中 (居中置顶，防止在竖屏下被视频遮挡)
        if (this.titleEl) {
            this.playerContainer.appendChild(this.titleEl);
        }
        
        // 将控制/侧栏按钮组装到按钮容器中 (除了标题)
        this.buttonContainer.appendChild(this.closeBtn);
        if (this.sidebarPosBtn) {
            this.buttonContainer.appendChild(this.sidebarPosBtn);
        }
        if (this.sidebarToggleBtn) {
            this.buttonContainer.appendChild(this.sidebarToggleBtn);
        }
        this.buttonContainer.appendChild(this.settingsBtn);
        
        // 将容器添加到播放器容器
        this.playerContainer.appendChild(this.container);
        
        // 将手柄容器添加到播放器容器
        this.playerContainer.appendChild(this.handleContainer);
        
        // 将评论区挂载到播放器容器，并动态挂载按钮容器到正确的位置
        const commentPanel = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
        if (commentPanel && commentPanel.commentsPanel) {
            this.playerContainer.appendChild(commentPanel.commentsPanel);
        }
        this.updateButtonContainerParent();
        
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