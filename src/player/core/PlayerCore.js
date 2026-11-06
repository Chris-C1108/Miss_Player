import { restoreSafariThemeColor, findVideoElement, getValue, setValue } from '../../utils/index.js';
import { PeachWebBridge } from '../bridge/PeachWebBridge.js';
import { getVideoCodeFromUrl } from '../../utils/videoCode.js';
import { enforceInlinePlayback } from '../../utils/iosInline.js';

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
        
        // 用户主动临时暂停意图锁 (若用户在开播/缓冲期点击暂停，坚决阻断任何后续自动起播与宿主偷跑)
        this.userPauseIntent = false;

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
        
        // 查找目标视频 (优先使用外部透传的已探测目标视频，若无则自动在 DOM 中探测)
        this.targetVideo = this.options.targetVideo || this.findTargetVideo();
        
        if (!this.targetVideo) {
            console.error('[PlayerCore] 未找到视频元素');
            // 如果是从浮动按钮调用的，则重新显示按钮
            if (this.callingButton) {
                this.callingButton.classList.remove('is-hidden');
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
        const existingRoots = document.querySelectorAll('miss-player-root');
        existingRoots.forEach(r => {
            try {
                // 深度抢救：如果旧的 miss-player-root 内部还包含着被劫持的目标视频，先放回宿主 body，防止视频元素被彻底销毁
                const innerVideo = r.shadowRoot?.querySelector('video');
                if (innerVideo && innerVideo.parentNode) {
                    document.body.appendChild(innerVideo);
                }
                r.remove();
            } catch (_) {}
        });
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
        return findVideoElement(true);
    }

    /**
     * 保存视频状态
     */
    saveVideoState() {
        if (!this.targetVideo) return;

        // 智能探测自定义媒体宿主容器 (Web Components / 框架播放器包装层如 hlsjs-video, dash-video, mux-video)
        // 核心原则：若视频托管在 Custom Media Element 内部，绝不能强行拔除 video 破坏内部 slot 绑定与流引擎管道！
        const customHost = this.targetVideo.closest('hlsjs-video, dash-video, mux-video, [data-media-host]');
        this.mediaHostElement = customHost || this.targetVideo;

        this.originalParent = this.mediaHostElement.parentNode;
        this.originalIndex = this.originalParent ? Array.from(this.originalParent.children).indexOf(this.mediaHostElement) : -1;

        // 插入原位隐藏占位符，防止将 mediaHostElement 移入播放器浮层后原网页布局发生高度塌陷 (消除 CLS 累计布局偏移)
        try {
            if (this.originalParent && !this.videoPlaceholder) {
                this.videoPlaceholder = document.createElement('div');
                this.videoPlaceholder.className = 'mp-video-placeholder';
                this.originalParent.insertBefore(this.videoPlaceholder, this.mediaHostElement);
            }
        } catch (_) {}

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
            
            // 防止宿主或浏览器在元数据加载/可播放时强制将 playbackRate 重置为 1.0
            const restoreSpeedOnReady = () => {
                if (this.targetVideo && this.targetVideo.playbackRate !== validSpeed) {
                    this.targetVideo.playbackRate = validSpeed;
                }
            };
            this.targetVideo.addEventListener('loadedmetadata', restoreSpeedOnReady, { once: true });
            this.targetVideo.addEventListener('canplay', restoreSpeedOnReady, { once: true });
            
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
                // 核心熔断：若用户已提前表达了临时暂停意图，坚决放弃任何起播尝试！
                if (this.userPauseIntent) {
                    console.log('[PlayerCore] 用户已提前设定临时暂停，放弃自动起播');
                    return;
                }
                
                // 确保 playsinline 属性就绪，防止被移动端全屏劫持
                enforceInlinePlayback(this.targetVideo);

                // iOS WebKit 行内播放关键防线：起播初期锁定静音，建立稳定行内图层，彻底阻断系统全屏弹出
                const originalMuted = this.targetVideo.muted;
                const needTempMute = !originalMuted;
                if (needTempMute) {
                    this.targetVideo.muted = true;
                }

                const playPromise = this.targetVideo.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (needTempMute && this.targetVideo) {
                            setTimeout(() => {
                                if (this.targetVideo && !this.userPauseIntent) {
                                    this.targetVideo.muted = originalMuted;
                                }
                            }, 100);
                        }
                    }).catch(error => {
                        console.warn('[PlayerCore] 正常起播被浏览器策略拦截:', error);
                        // 当 Peach 虚拟 STRM 流因过期或不支持返回 NotSupportedError 时，自动启动现场动态寻源接力
                        if (error.name === 'NotSupportedError' && PeachWebBridge.isPeachInstance()) {
                            console.log('[PlayerCore] Peach 原生流不可用，自动启动现场动态寻源接力...');
                            const avcode = getVideoCodeFromUrl(this.targetVideo);
                            if (avcode) {
                                PeachWebBridge.takeOverPlayback(this.targetVideo, avcode);
                            }
                            return;
                        }
                        // 如果因为浏览器自动播放策略阻止有声播放，降级为静音自动起播
                        if (error.name === 'NotAllowedError' || !this.targetVideo.muted) {
                            console.log('[PlayerCore] 尝试降级为静音自动起播...');
                            this.targetVideo.muted = true;
                            const mutedPromise = this.targetVideo.play();
                            if (mutedPromise !== undefined) {
                                mutedPromise.then(() => {
                                    console.log('[PlayerCore] 静音自动起播成功');
                                    // 挂载全局一次性交互监听，用户一旦点击/触碰屏幕尝试解除静音 (受默认静音设置保护)
                                    const unmuteOnInteract = () => {
                                        const isDefaultMutedEnabled = Boolean(getValue('defaultMuted', true));
                                        if (!isDefaultMutedEnabled && this.targetVideo) {
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
                    if (this.userPauseIntent) {
                        console.log('[PlayerCore] 视频就绪但检测到用户已主动暂停，坚决拦截起播');
                        return;
                    }
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
    close(overlay, container, playerContainer, rootHost) {
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
        
        // 恢复原始的视频或媒体宿主容器样式和属性
        const nodeToRestore = this.mediaHostElement || this.targetVideo;
        if (this.originalParent && nodeToRestore) {
            if (nodeToRestore.parentNode !== this.originalParent) {
                if (this.originalParent.isConnected) {
                    // 优先替换原位置占位符
                    if (this.videoPlaceholder && this.videoPlaceholder.parentNode) {
                        this.videoPlaceholder.parentNode.replaceChild(nodeToRestore, this.videoPlaceholder);
                        this.videoPlaceholder = null;
                    } else if (this.originalIndex !== -1 && this.originalParent.childNodes.length > this.originalIndex) {
                        this.originalParent.insertBefore(nodeToRestore, this.originalParent.childNodes[this.originalIndex]);
                    } else {
                        this.originalParent.appendChild(nodeToRestore);
                    }
                } else {
                    // 若原宿主容器已在单页路由中被销毁，安全将视频放回 body 避免节点孤立
                    try { document.body.appendChild(nodeToRestore); } catch (_) {}
                }
                
                // 移除自定义样式
                nodeToRestore.style.width = '';
                nodeToRestore.style.height = '';
                nodeToRestore.style.maxHeight = '';
                nodeToRestore.style.margin = '';
                nodeToRestore.style.position = '';

                // 始终保持 playsinline 属性，防止 Safari / 移动端在退出播放器或二次加载时被系统全屏劫持
                enforceInlinePlayback(this.targetVideo);

                // 若处于 Safari 原生系统全屏中，主动退出
                if (this.targetVideo.webkitDisplayingFullscreen && typeof this.targetVideo.webkitExitFullscreen === 'function') {
                    try { this.targetVideo.webkitExitFullscreen(); } catch (_) {}
                }
            }
        }
        
        // 移除叠加层
        if (rootHost && rootHost.parentNode) {
            rootHost.parentNode.removeChild(rootHost);
        }
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
            this.callingButton.classList.remove('is-hidden');
        }
    }
} 