import { restoreSafariThemeColor, findVideoElement, getValue, setValue } from '../../utils/index.js';

/**
 * 播放器核心类 - 负责播放器的基本功能和状态管理
 */
export class PlayerCore {
    constructor(options = {}) {
        console.log('[PlayerCore] 初始化...');
        
        // 常量定义
        this.defaultPlaybackRate = 1.0;  // 默认播放速度
        
        // 状态变量
        this.targetVideo = null;         // 目标视频元素
        this.videoState = {
            currentTime: 0,
            isPlaying: false,
            volume: 1,
            playbackRate: 1
        };
        
        // 配置和选项
        this.options = Object.assign({
            containerId: 'tm-video-container',
            startMuted: false,
        }, options);
        
        // 保存调用按钮
        this.callingButton = this.options.callingButton || null;
        
        // 状态标记
        this.initialized = false;
    }

    /**
     * 初始化播放器
     */
    init() {
        if (this.initialized) return;
        
        // 清理可能存在的旧overlay
        this.cleanupExistingOverlays();
        
        // 查找目标视频
        this.targetVideo = this.findTargetVideo();
        
        if (!this.targetVideo) {
            console.error('[PlayerCore] 未找到视频元素');
            // 如果是从浮动按钮调用的，则重新显示按钮
            if (this.callingButton) {
                this.callingButton.style.display = 'flex';
            }
            return;
        }
        
        // 保存视频状态
        this.saveVideoState();

        // 初始化完成标记
        this.initialized = true;
        console.log('[PlayerCore] 核心初始化完成');
        
        return this.targetVideo;
    }

    /**
     * 清理可能存在的旧overlay元素
     */
    cleanupExistingOverlays() {
        // 查找所有现有的overlay元素
        const existingOverlays = document.querySelectorAll('.tm-video-overlay');
        
        if (existingOverlays.length > 0) {
            console.log(`[PlayerCore] 清理 ${existingOverlays.length} 个现有overlay元素`);
            
            existingOverlays.forEach(overlay => {
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
        }
    }

    /**
     * 查找页面中的视频元素
     * @returns {HTMLVideoElement|null} 找到的视频元素或null
     */
    findTargetVideo() {
        return findVideoElement();
    }

    /**
     * 保存视频状态
     */
    saveVideoState() {
        if (!this.targetVideo) return;

        this.originalParent = this.targetVideo.parentNode;
        this.originalIndex = Array.from(this.originalParent.children).indexOf(this.targetVideo);

        this.videoState = {
            currentTime: this.targetVideo.currentTime,
            isPaused: this.targetVideo.paused,
            videoSrc: this.targetVideo.src,
            posterSrc: this.targetVideo.poster,
            wasMuted: this.targetVideo.muted,
            controls: this.targetVideo.controls, // 保存原始控制组件状态
            playsinline: this.targetVideo.getAttribute('playsinline'),
            webkitPlaysinline: this.targetVideo.getAttribute('webkit-playsinline'),
            x5Playsinline: this.targetVideo.getAttribute('x5-playsinline')
        };
    }
    
    /**
     * 恢复视频状态并执行自动起播 (包含静音降级容错与手势唤醒)
     */
    restoreVideoState() {
        try {
            // 加载持久化的用户首选播放速度
            const savedSpeed = parseFloat(getValue('preferredPlaybackRate', 1.0));
            const validSpeed = (!isNaN(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 4.0) ? savedSpeed : this.defaultPlaybackRate;
            this.targetVideo.playbackRate = validSpeed;
            
            // 仅在已有实际进度时安全恢复播放位置，避免未就绪时抛出异常或打断流加载
            if (this.videoState && this.videoState.currentTime > 0) {
                if (this.targetVideo.readyState >= 1) {
                    try {
                        this.targetVideo.currentTime = this.videoState.currentTime;
                    } catch (_) {}
                } else {
                    const restoreTimeOnReady = () => {
                        if (this.targetVideo && this.videoState && this.videoState.currentTime > 0) {
                            try {
                                this.targetVideo.currentTime = this.videoState.currentTime;
                            } catch (_) {}
                        }
                    };
                    this.targetVideo.addEventListener('loadedmetadata', restoreTimeOnReady, { once: true });
                }
            }

            // 主动触发自动起播 (支持有声尝试 -> 静音降级 -> 首次触摸唤醒)
            const attemptPlay = () => {
                if (!this.targetVideo) return;
                
                // 确保 playsinline 属性就绪，防止被移动端全屏劫持
                this.targetVideo.setAttribute('playsinline', 'true');
                this.targetVideo.setAttribute('webkit-playsinline', 'true');
                this.targetVideo.setAttribute('x5-playsinline', 'true');
                this.targetVideo.playsInline = true;
                this.targetVideo.webkitPlaysInline = true;

                const playPromise = this.targetVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('[PlayerCore] 正常起播被浏览器策略拦截:', error);
                        // 如果因为浏览器自动播放策略阻止有声播放，降级为静音自动起播
                        if (error.name === 'NotAllowedError' || !this.targetVideo.muted) {
                            console.log('[PlayerCore] 尝试降级为静音自动起播...');
                            this.targetVideo.muted = true;
                            const mutedPromise = this.targetVideo.play();
                            if (mutedPromise !== undefined) {
                                mutedPromise.then(() => {
                                    console.log('[PlayerCore] 静音自动起播成功');
                                    // 挂载全局一次性交互监听，用户一旦点击/触碰屏幕立即尝试解除静音
                                    const unmuteOnInteract = () => {
                                        if (this.targetVideo) {
                                            this.targetVideo.muted = false;
                                        }
                                        document.removeEventListener('click', unmuteOnInteract, true);
                                        document.removeEventListener('touchstart', unmuteOnInteract, true);
                                    };
                                    document.addEventListener('click', unmuteOnInteract, { once: true, capture: true });
                                    document.addEventListener('touchstart', unmuteOnInteract, { once: true, capture: true });
                                }).catch(err => {
                                    console.error('[PlayerCore] 静音起播仍失败:', err);
                                });
                            }
                        }
                    });
                }
            };

            // 立即尝试起播
            attemptPlay();

            // 若视频尚未完全就绪 (readyState < 2)，在 canplay / loadeddata 时再次确保触发起播
            if (this.targetVideo.readyState < 2) {
                const onReadyToPlay = () => {
                    attemptPlay();
                    this.targetVideo.removeEventListener('canplay', onReadyToPlay);
                    this.targetVideo.removeEventListener('loadeddata', onReadyToPlay);
                };
                this.targetVideo.addEventListener('canplay', onReadyToPlay, { once: true });
                this.targetVideo.addEventListener('loadeddata', onReadyToPlay, { once: true });
            }
        } catch (e) {
            console.error('[PlayerCore] 尝试恢复视频状态与起播时出错:', e);
        }
    }
    
    /**
     * 关闭播放器并恢复原始视频
     */
    close(overlay, container, playerContainer) {
        if (!overlay) return;
        
        // 保存当前视频状态以便下次打开
        this.videoState.currentTime = this.targetVideo.currentTime;
        this.videoState.isPlaying = !this.targetVideo.paused;
        this.videoState.volume = this.targetVideo.volume;
        this.videoState.playbackRate = this.targetVideo.playbackRate;
        
        // 如果视频正在播放，暂停它
        if (!this.targetVideo.paused) {
            this.targetVideo.pause();
        }
        
        // 恢复原始的视频样式和属性
        if (this.originalParent && this.targetVideo && this.targetVideo.parentNode) {
            if (this.targetVideo.parentNode !== this.originalParent) {
                // 移动回原始位置
                if (this.originalIndex !== -1 && this.originalParent.childNodes.length > this.originalIndex) {
                    this.originalParent.insertBefore(this.targetVideo, this.originalParent.childNodes[this.originalIndex]);
                } else {
                    this.originalParent.appendChild(this.targetVideo);
                }
                
                // 移除自定义样式
                this.targetVideo.style.width = '';
                this.targetVideo.style.height = '';
                this.targetVideo.style.maxHeight = '';
                this.targetVideo.style.margin = '';
                this.targetVideo.style.position = '';

                // 始终保持 playsinline 属性，防止 Safari / 移动端在退出播放器或二次加载时被系统全屏劫持
                this.targetVideo.setAttribute('playsinline', 'true');
                this.targetVideo.setAttribute('webkit-playsinline', 'true');
                this.targetVideo.setAttribute('x5-playsinline', 'true');
                this.targetVideo.playsInline = true;
                this.targetVideo.webkitPlaysInline = true;

                // 若处于 Safari 原生系统全屏中，主动退出
                if (this.targetVideo.webkitDisplayingFullscreen && typeof this.targetVideo.webkitExitFullscreen === 'function') {
                    try { this.targetVideo.webkitExitFullscreen(); } catch (_) {}
                }
            }
        }
        
        // 移除叠加层
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        // 移除播放器容器
        if (playerContainer && playerContainer.parentNode) {
            playerContainer.parentNode.removeChild(playerContainer);
        }
        
        // 移除 body 和 html 上的播放器激活与控制隐藏状态类
        document.body.classList.remove('tm-player-active', 'controls-hidden');
        document.documentElement.classList.remove('tm-player-active', 'controls-hidden');
        
        // 恢复隐藏滚动条样式元素（如存在）
        const scrollbarStyle = document.getElementById('tm-hide-scrollbar-style');
        if (scrollbarStyle && scrollbarStyle.parentNode) {
            scrollbarStyle.parentNode.removeChild(scrollbarStyle);
        }
        
        // 如果添加了全屏切换样式，移除它
        const fullscreenStyle = document.getElementById('tm-fullscreen-style');
        if (fullscreenStyle && fullscreenStyle.parentNode) {
            fullscreenStyle.parentNode.removeChild(fullscreenStyle);
        }

        // 确保恢复宿主页面的头部/导航栏元素显隐状态
        try {
            const hostHeaders = document.querySelectorAll('header, .site-header, .header, #site-header, navbar, .navbar, .top-nav, [class*="site-header"]');
            hostHeaders.forEach(h => {
                if (h) {
                    h.style.display = '';
                    h.style.transform = '';
                    h.style.visibility = '';
                    h.style.top = '';
                    h.style.opacity = '';
                    h.classList.remove('hidden', 'is-hidden', 'header-hidden', 'hide');
                }
            });
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
        } catch (e) {
            console.error('[PlayerCore] 恢复宿主 Header 异常:', e);
        }
        
        // 重置状态
        this.initialized = false;
        
        // 恢复Safari主题色
        restoreSafariThemeColor();
        
        // 如果是从浮动按钮调用的，则重新显示按钮
        if (this.callingButton) {
            this.callingButton.style.display = 'flex';
        }
    }
} 