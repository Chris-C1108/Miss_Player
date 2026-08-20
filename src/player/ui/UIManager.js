/**
 * UI管理器类 - 负责创建和管理播放器UI元素
 */
import { delegateEvent } from '../../utils/index.js';
import { LAYOUT_LEFT, LAYOUT_RIGHT, COMMENTS_SHOW, COMMENTS_HIDE } from '../../constants/icons.js';
import {
    createOverlayElement,
    createContainerElement,
    createPlayerContainerElement,
    createResizeHandleElement,
    createCloseButtonElement,
    createSettingsButtonElement,
    createSidebarControlButtons,
    createButtonContainerElement,
    createSettingsPanelElement,
    createSpeedIndicatorElement,
    getVideoTitle
} from './_uiFactories.js';

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
        
        // 关联管理器引用
        this.managers = {};
        
        // 导入样式
        this.loadStyles();
    }

    /**
     * 注册相关管理器引用
     * @param {Object} managers 管理器字典
     */
    setManagers(managers) {
        this.managers = Object.assign({}, this.managers, managers);
    }

    get controlManager() {
        return this.managers?.controlManager || this.playerCore?.controlManager;
    }

    get progressManager() {
        return this.managers?.progressManager || this.playerCore?.progressManager;
    }

    get dragManager() {
        return this.managers?.dragManager || this.playerCore?.dragManager;
    }

    get swipeManager() {
        return this.managers?.swipeManager || this.playerCore?.swipeManager;
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
        const maxAllowedHeight = window.innerHeight * 0.8;
        const defaultHeight = Math.min(window.innerWidth * (4/5), maxAllowedHeight);
        const defaultMinHeight = Math.min(window.innerWidth * (9/16), maxAllowedHeight);

        this.overlay = createOverlayElement();
        this.container = createContainerElement(defaultHeight, defaultMinHeight);
        
        console.log('[UIManager] Container element created:', this.container);
        console.log('[UIManager] createOverlayAndContainer finished.');
    }

    /**
     * 创建播放器容器
     */
    createPlayerContainer() {
        this.playerContainer = createPlayerContainerElement(this.isSidebarHidden, this.sidebarPosition);
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

        // 禁用原生视频控件并移除 controls 属性
        if (this.targetVideo) {
            this.targetVideo.controls = false;
            this.targetVideo.removeAttribute('controls');

            // 移除非标准子节点 (如原站播放器注入在 video 内部的 div 控制/封面节点)
            Array.from(this.targetVideo.children).forEach(child => {
                const tag = child.tagName ? child.tagName.toLowerCase() : '';
                if (tag !== 'track' && tag !== 'source') {
                    try { child.remove(); } catch (e) {}
                }
            });
        }

        // 强制使用内联播放，防止 iOS Safari/微信等自动进入系统全屏播放器
        this.targetVideo.setAttribute('playsinline', 'true');
        this.targetVideo.setAttribute('webkit-playsinline', 'true');
        this.targetVideo.setAttribute('x5-playsinline', 'true');
        this.targetVideo.playsInline = true;
        this.targetVideo.webkitPlaysInline = true;

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
                const speedIndicator = createSpeedIndicatorElement('3x');
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
            if (this.swipeManager && typeof this.swipeManager.wasRecentlyDragging === 'function' 
                && this.swipeManager.wasRecentlyDragging()) {
                return;
            }
            
            // 确保点击事件不是从控制按钮冒泡上来的
            if (e.target.closest('.tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button')) {
                return;
            }
            
            // 在横屏模式下且控制面板悬浮时，点击视频画面直接切换控制面板显示/隐藏状态
            if (this.isLandscape) {
                const isDocked = !!(this.playerContainer && this.playerContainer.className.match(/tm-controls-docked-/));
                const isFloating = this.isSidebarHidden || !isDocked;
                
                if (isFloating) {
                    if (this.controlsVisible) {
                        this.hideControls();
                    } else {
                        this.showControls();
                        this.autoHideControls();
                    }
                    return;
                }
            }
            
            // 播放/暂停切换函数 (竖屏或吸附模式)
            const togglePlayPause = () => {
                if (!this.playerCore.targetVideo) return;
                
                if (this.playerCore.targetVideo.paused) {
                    this.playerCore.targetVideo.play();
                } else {
                    this.playerCore.targetVideo.pause();
                    if (this.controlManager) {
                        this.controlManager.showPauseIndicator();
                    }
                }
                
                if (this.controlManager) {
                    this.controlManager.updatePlayPauseButton();
                }
            };
            
            // 如果控制界面当前是隐藏状态，则只显示控制界面而不触发暂停
            if (!this.controlsVisible) {
                this.showControls();
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
        const { handleContainer, handle } = createResizeHandleElement();
        this.handleContainer = handleContainer;
        this.handle = handle;

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
    }

    /**
     * 创建关闭按钮
     */
    createCloseButton() {
        this.closeBtn = createCloseButtonElement();
    }

    /**
     * 创建设置按钮
     */
    createSettingsButton() {
        this.settingsBtn = createSettingsButtonElement();
    }

    /**
     * 获取视频标题
     */
    getVideoTitle() {
        return getVideoTitle();
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
        const { sidebarPosBtn, sidebarToggleBtn } = createSidebarControlButtons(this.sidebarPosition, this.isSidebarHidden);
        this.sidebarPosBtn = sidebarPosBtn;
        this.sidebarToggleBtn = sidebarToggleBtn;

        this.sidebarPosBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebarPosition();
        });

        this.sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebarVisibility();
        });

        // 根据 showCommentsSection 设置状态初始化按钮可见性
        this.updateSidebarButtonsVisibility();
    }

    /**
     * 更新侧栏控制按钮 (位置与显隐按钮) 的可见性 (当 showCommentsSection 为 false 时完全隐藏)
     */
    updateSidebarButtonsVisibility() {
        const state = this.playerCore?.options?.playerState;
        const showCommentsSection = state?.settings?.showCommentsSection ?? true;
        const displayVal = showCommentsSection ? 'flex' : 'none';

        if (this.sidebarPosBtn) {
            this.sidebarPosBtn.style.display = displayVal;
        }
        if (this.sidebarToggleBtn) {
            this.sidebarToggleBtn.style.display = displayVal;
        }
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
        const dragManager = this.dragManager;
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
            
            // 连动：开启 3 秒自动隐藏控制面板计时器 (若属于横屏悬浮面板)
            this.showControls();
            if (this.isLandscape) {
                this.autoHideControls();
            }
            
            // 连动：重新应用吸附排版状态
            if (this.dragManager) {
                this.dragManager.reapplyDockedState();
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
        
        const commentPanel = this.controlManager && this.controlManager.commentPanel;
        const commentsPanelEl = commentPanel && commentPanel.commentsPanel;
        const isPcLandscape = this.isLandscape && window.innerWidth >= 930;
        
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
        this.settingsPanel = createSettingsPanelElement();
    }
    
    /**
     * 创建按钮容器
     */
    createButtonContainer() {
        this.buttonContainer = createButtonContainerElement();
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
            if (this.progressManager) {
                this.progressManager.updateProgressBar();
                this.progressManager.updateCurrentTimeDisplay();
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
        if (this.progressManager) {
            this.progressManager.updateProgressBar();
            this.progressManager.updateCurrentTimeDisplay();
        }
        
        // 如果存在控制管理器，通知其刷新UI
        if (this.controlManager) {
            // 更新控制面板显示
            this.updateControlPanelVisibility();
        }
        
        // 旋转后控制面板重新计算并恢复位置，防止超出视口边界
        if (this.dragManager) {
            this.dragManager.restoreControlPanelPosition();
        }
        
        // 横屏模式下自动隐藏控制界面（如果是手机横屏，即宽 < 930px），或显示并定时隐藏（PC大屏 >= 930px）
        if (this.isLandscape) {
            if (window.innerWidth < 930) {
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
        if (!this.controlManager) return;
        
        const controlButtons = this.controlManager.controlButtonsContainer;
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

        // 手机竖屏场景下：控制面板显示时 评论区与拖动手柄同步变暗
        if (!this.isLandscape) {
            const commentPanel = this.controlManager && this.controlManager.commentPanel;
            if (commentPanel && commentPanel.commentsPanel) {
                commentPanel.commentsPanel.classList.add('is-dimmed');
            }
            if (this.handleContainer) {
                this.handleContainer.classList.add('is-dimmed');
            }
        }
    }
    
    /**
     * 隐藏控制界面
     * @param {boolean} force - 是否强制隐藏 (绕过横屏/吸附状态判断)
     */
    hideControls(force = false) {
        if (!this.overlay) return;
        if (!this.isLandscape && !force) return;
        
        this.overlay.classList.add('controls-hidden');
        document.body.classList.add('controls-hidden');
        this.controlsVisible = false;

        // 手机竖屏场景下：控制面板隐藏时评论区与手柄同步变亮 (解除变暗)
        if (!this.isLandscape) {
            const commentPanel = this.controlManager && this.controlManager.commentPanel;
            if (commentPanel && commentPanel.commentsPanel) {
                commentPanel.commentsPanel.classList.remove('is-dimmed');
            }
            if (this.handleContainer) {
                this.handleContainer.classList.remove('is-dimmed');
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
        
        const maxAllowedHeight = window.innerHeight * 0.8;
        let minHeight = window.innerWidth * (9/16); // 默认16:9比例
        if (videoWidth && videoHeight) {
            minHeight = window.innerWidth * (videoHeight / videoWidth);
        }
        minHeight = Math.min(minHeight, maxAllowedHeight);
        
        this.container.style.minHeight = `${minHeight}px`;
        
        if (!this.isCustomResized) {
            const defaultHeight = Math.min(window.innerWidth * (4/5), maxAllowedHeight);
            this.container.style.height = `${defaultHeight}px`;
            console.log('[UIManager] 自动更新容器高度为默认比例高度:', defaultHeight);
        } else if (this.customHeightPortrait) {
            const currentHeight = parseFloat(this.customHeightPortrait);
            if (currentHeight < minHeight) {
                this.container.style.height = `${minHeight}px`;
                this.customHeightPortrait = `${minHeight}px`;
            } else {
                const clampedHeight = Math.min(currentHeight, maxAllowedHeight);
                this.container.style.height = `${clampedHeight}px`;
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
        const commentPanel = this.controlManager && this.controlManager.commentPanel;
        if (commentPanel && commentPanel.commentsPanel) {
            this.playerContainer.appendChild(commentPanel.commentsPanel);
            
            // 手机竖屏场景下，初始化且控制面板显示时，评论区应是变暗的
            if (!this.isLandscape && this.controlsVisible) {
                commentPanel.commentsPanel.classList.add('is-dimmed');
            }
        }
        this.updateButtonContainerParent();
        
        // 添加设置面板到播放器容器
        this.playerContainer.appendChild(this.settingsPanel);
        
        // 如果存在控制按钮，也添加到播放器容器内
        if (this.controlManager && this.controlManager.controlButtonsContainer) {
            this.playerContainer.appendChild(this.controlManager.controlButtonsContainer);
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