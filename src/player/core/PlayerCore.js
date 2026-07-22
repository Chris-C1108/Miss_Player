import { restoreSafariThemeColor, findVideoElement } from '../../utils/index.js';

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
     * 恢复视频状态
     */
    restoreVideoState() {
        try {
            // 设置默认播放速度
            this.targetVideo.playbackRate = this.defaultPlaybackRate;
            
            // 恢复播放位置
            this.targetVideo.currentTime = this.videoState.currentTime;

            // 尝试播放视频
            const playPromise = this.targetVideo.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('视频自动播放被阻止: ', error);
                    // 不再尝试静音播放，保持暂停状态
                    // 可以考虑在这里添加一个UI提示，告知用户手动点击播放按钮
                });
            }
        } catch (e) {
            console.error('尝试播放时出错: ', e);
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

                // 恢复 playsinline 属性
                const restoreAttr = (name, val) => {
                    if (val === null || val === undefined) {
                        this.targetVideo.removeAttribute(name);
                    } else {
                        this.targetVideo.setAttribute(name, val);
                    }
                };
                restoreAttr('playsinline', this.videoState.playsinline);
                restoreAttr('webkit-playsinline', this.videoState.webkitPlaysinline);
                restoreAttr('x5-playsinline', this.videoState.x5Playsinline);
                this.targetVideo.playsInline = this.videoState.playsinline === 'true';
                this.targetVideo.webkitPlaysInline = this.videoState.webkitPlaysinline === 'true';
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