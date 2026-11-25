import { restoreSafariThemeColor, findVideoElement, getValue, setValue } from '../../utils/index.js';
import { enforceInlinePlayback, isIosDevice } from '../../utils/iosInline.js';
import { checkShouldDefaultMute } from '../controls/VolumeController.js';
import { getVideoCodeFromUrl, cleanAvCode } from '../../utils/videoCode.js';

/**
 * 生成当前视频在页面会话内的唯一识别键，用于区分「首次开播」与「退出后重入」
 * @param {HTMLVideoElement | null} video
 * @param {string} [avCode]
 * @param {Location | { pathname?: string } | null} [loc]
 * @returns {string}
 */
export function getTheaterSessionKey(video, avCode = '', loc = (typeof window !== 'undefined' ? window.location : null)) {
    const cleanCode = avCode ? cleanAvCode(avCode) : '';
    if (cleanCode) return `code:${cleanCode}`;
    const pathname = loc && typeof loc.pathname === 'string' ? loc.pathname : '';
    if (pathname) return `path:${pathname}`;
    const src = video?.currentSrc || video?.src || '';
    if (src) return `src:${src}`;
    return 'default';
}

/**
 * 仲裁是否允许在进入播放器时自动定位到首个高光
 * 仅在首次打开当前视频时生效；中途退出后再点浮动按钮重入时必须继续当前视频进度
 * @param {{ playerSettings?: any, hasTabs?: boolean, hasUrlDeepLink?: boolean, hasEnteredBefore?: boolean }} [params]
 * @returns {boolean}
 */
export function shouldTriggerInitialHighlight({
    playerSettings = null,
    hasTabs = false,
    hasUrlDeepLink = false,
    hasEnteredBefore = false
} = {}) {
    return Boolean(
        playerSettings &&
        playerSettings.betaMode &&
        playerSettings.betaFirstCapsulePlay &&
        hasTabs &&
        !hasUrlDeepLink &&
        !hasEnteredBefore
    );
}

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
        this.videoCode = '';             // 全局唯一权威番号缓存
        this.videoState = {
            currentTime: 0,
            isPlaying: false,
            volume: 1,
            playbackRate: 1
        };
        
        // 配置和选项
        this.options = Object.assign({
            containerId: 'tm-video-container'
        }, options);
        
        // 保存调用按钮
        this.callingButton = this.options.callingButton || null;
        
        // 用户主动临时暂停意图锁 (若用户在开播/缓冲期点击暂停，坚决阻断任何后续自动起播与宿主偷跑)
        this.userPauseIntent = false;
        this._initialSeekGuardCancel = null;

        // 状态标记
        this.initialized = false;
    }

    /**
     * 取消开播首帧/首个高光定位的防回跳守卫（由用户主动拖拽/跳转触发）
     */
    cancelInitialSeekGuard() {
        if (typeof this._initialSeekGuardCancel === 'function') {
            const cancelFn = this._initialSeekGuardCancel;
            this._initialSeekGuardCancel = null;
            try { cancelFn(); } catch (_) {}
        }
    }

    /**
     * 为「开播定位首个高光」安装防回跳守卫：
     * 1. 若初始化时 readyState < 1，在 loadedmetadata 到来时自动执行首次定位；
     * 2. 若在 readyState === 1 时设置了 currentTime（进度条已显示高光位），但随后浏览器/HLS.js/iOS WebKit
     *    在 play()、loadeddata、canplay 或 playing 时将播放头重置回 0，则立即重新定位并同步进度条，
     *    直到视频在 readyState >= 2 下确认稳定在目标高光附近后自动解除；
     * 3. 任何用户主动跳转或播放器关闭均立即撤防，绝不干扰用户操作。
     * @param {number} rawTargetTime
     * @param {{ progressManager?: any, loopManager?: any }} [deps]
     */
    armInitialHighlightSeek(rawTargetTime, { progressManager = null, loopManager = null } = {}) {
        const video = this.targetVideo;
        if (!video) return;
        const baseTarget = Number(rawTargetTime);
        if (!Number.isFinite(baseTarget) || baseTarget <= 0) return;

        this.cancelInitialSeekGuard();

        const resolveTargetTime = () => {
            const dur = video.duration;
            if (Number.isFinite(dur) && dur > 0) {
                return Math.max(0, Math.min(baseTarget, Math.max(0, dur - 0.5)));
            }
            return Math.max(0, baseTarget);
        };

        const initialTarget = resolveTargetTime();
        if (initialTarget <= 0) return;

        const tolerance = Math.min(2.5, Math.max(0.4, initialTarget * 0.25));
        const maxAttempts = 12;
        let attempts = 0;
        let lastSeekStamp = 0;
        let disarmed = false;
        let isApplyingSeek = false;
        let firstStablePlayTime = null;
        let timeoutId = null;

        const getRequiredStableAdvance = () => {
            const dur = video.duration;
            const target = resolveTargetTime();
            if (Number.isFinite(dur) && dur > 0) {
                return Math.min(2.5, Math.max(0.4, (dur - target) - 0.5));
            }
            return 2.5;
        };

        const syncUiTo = (t) => {
            try {
                progressManager?.updateProgressBar?.();
                progressManager?.updateCurrentTimeDisplay?.();
                loopManager?.syncProximityState?.({ targetTime: t, forceCenter: true });
            } catch (_) {}
        };

        const disarm = () => {
            if (disarmed) return;
            disarmed = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            video.removeEventListener('loadedmetadata', onReadyEvent);
            video.removeEventListener('loadeddata', onReadyEvent);
            video.removeEventListener('canplay', onReadyEvent);
            video.removeEventListener('playing', onReadyEvent);
            video.removeEventListener('seeking', onSeeking);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('timeupdate', onTimeUpdate);
            if (this._initialSeekGuardCancel === disarm) {
                this._initialSeekGuardCancel = null;
            }
        };

        const isOutOfBounds = (cur, target) => {
            if (cur < target - tolerance) return true;
            if (firstStablePlayTime === null && cur > target + Math.max(10, tolerance)) return true;
            return false;
        };

        const applySeek = (force = false) => {
            if (disarmed || !this.targetVideo || isApplyingSeek) return;
            if (video.readyState < 1) return;

            const target = resolveTargetTime();
            if (target <= 0) {
                disarm();
                return;
            }

            const cur = Number(video.currentTime) || 0;
            if (!isOutOfBounds(cur, target)) {
                syncUiTo(cur);
                if (video.readyState >= 2 && !video.seeking && !video.paused) {
                    if (firstStablePlayTime === null) {
                        firstStablePlayTime = cur;
                    } else if ((cur - firstStablePlayTime) >= getRequiredStableAdvance()) {
                        disarm();
                    }
                }
                return;
            }

            if (!force && video.seeking && (Date.now() - lastSeekStamp < 200)) {
                return;
            }

            if (attempts >= maxAttempts) {
                disarm();
                return;
            }

            attempts += 1;
            firstStablePlayTime = null;
            lastSeekStamp = Date.now();
            isApplyingSeek = true;
            try {
                video.currentTime = target;
            } catch (_) {}
            finally {
                isApplyingSeek = false;
            }

            if (video.paused && !this.userPauseIntent && typeof video.play === 'function') {
                try {
                    const p = video.play();
                    if (p && typeof p.catch === 'function') p.catch(() => {});
                } catch (_) {}
            }
            syncUiTo(target);
        };

        const onReadyEvent = () => applySeek(false);

        const onSeeking = () => {
            if (disarmed || isApplyingSeek) return;
            if (video.readyState < 1) return;
            const target = resolveTargetTime();
            const cur = Number(video.currentTime) || 0;
            if (isOutOfBounds(cur, target)) {
                applySeek(true);
            }
        };

        const onSeeked = () => {
            if (disarmed) return;
            const target = resolveTargetTime();
            const cur = Number(video.currentTime) || 0;
            if (isOutOfBounds(cur, target)) {
                applySeek(true);
            } else {
                syncUiTo(cur);
                if (video.readyState >= 2 && !video.paused && firstStablePlayTime === null) {
                    firstStablePlayTime = cur;
                }
            }
        };

        const onTimeUpdate = () => {
            if (disarmed) return;
            const target = resolveTargetTime();
            const cur = Number(video.currentTime) || 0;
            if (isOutOfBounds(cur, target)) {
                // 若在稳定播放期前 1 秒内意外跌回视频开头，即使浏览器仍处于 seeking 也强制拉回
                applySeek(cur < target - tolerance);
            } else if (video.readyState >= 2 && !video.seeking) {
                syncUiTo(cur);
                if (!video.paused) {
                    if (firstStablePlayTime === null) {
                        firstStablePlayTime = cur;
                    } else if ((cur - firstStablePlayTime) >= getRequiredStableAdvance()) {
                        disarm();
                    }
                }
            }
        };

        video.addEventListener('loadedmetadata', onReadyEvent);
        video.addEventListener('loadeddata', onReadyEvent);
        video.addEventListener('canplay', onReadyEvent);
        video.addEventListener('playing', onReadyEvent);
        video.addEventListener('seeking', onSeeking);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('timeupdate', onTimeUpdate);

        timeoutId = setTimeout(disarm, 8000);
        this._initialSeekGuardCancel = disarm;

        if (video.readyState >= 1) {
            applySeek(true);
        }
    }

    /**
     * 全播放器唯一权威番号解析入口
     * 必须在 targetVideo 被迁移进 Shadow DOM 之前完成首轮解析，并由所有子系统共享复用
     * @param {{ refresh?: boolean }} [opts]
     * @returns {string}
     */
    resolveVideoCode({ refresh = false } = {}) {
        if (!refresh && this.videoCode) {
            return this.videoCode;
        }
        const explicit = this.options?.videoCode ? cleanAvCode(this.options.videoCode) : '';
        const resolved = explicit || getVideoCodeFromUrl(this.targetVideo) || getVideoCodeFromUrl() || '';
        const normalized = cleanAvCode(resolved) || '';
        if (normalized) {
            this.videoCode = normalized;
        }
        return this.videoCode || '';
    }

    getVideoCode({ refresh = false } = {}) {
        return this.resolveVideoCode({ refresh });
    }

    /**
     * 判断当前视频在本页会话中是否已经进入/退出过播放器
     * @param {string} sessionKey
     * @param {HTMLElement | null} [callingButton]
     * @returns {boolean}
     */
    hasEnteredTheaterBefore(sessionKey, callingButton = this.callingButton) {
        if (!sessionKey) return false;
        if (this.targetVideo?.dataset?.mpTheaterEnteredKey === sessionKey) {
            return true;
        }
        const fb = callingButton?._floatingButtonInstance;
        return Boolean(fb?._enteredTheaterKeys?.has?.(sessionKey));
    }

    /**
     * 记录当前视频已进入过播放器，防止中途退出后再次点击浮动按钮时重复从首个高光开播
     * @param {string} sessionKey
     * @param {HTMLElement | null} [callingButton]
     */
    markTheaterEntered(sessionKey, callingButton = this.callingButton) {
        if (!sessionKey) return;
        if (this.targetVideo) {
            if (!this.targetVideo.dataset) {
                this.targetVideo.dataset = {};
            }
            this.targetVideo.dataset.mpTheaterEnteredKey = sessionKey;
        }
        const fb = callingButton?._floatingButtonInstance;
        if (fb) {
            if (!fb._enteredTheaterKeys) {
                fb._enteredTheaterKeys = new Set();
            }
            fb._enteredTheaterKeys.add(sessionKey);
        }
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

        // 在视频节点移入 Shadow DOM 前锁定权威番号
        this.resolveVideoCode({ refresh: true });
        
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
                    const mountHost = innerVideo.closest('hlsjs-video, dash-video, mux-video, [data-media-host]');
                    const nodeToRescue = mountHost || innerVideo;
                    if (nodeToRescue.parentNode) {
                        document.body.appendChild(nodeToRescue);
                    }
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

        // 插入原位等尺寸占位符，防止将 mediaHostElement 移入播放器浮层后原网页视频容器发生高度塌陷或下拉透底时出现空白洞 (消除 CLS 累计布局偏移)
        try {
            if (this.originalParent && !this.videoPlaceholder) {
                const hostRect = typeof this.mediaHostElement.getBoundingClientRect === 'function'
                    ? this.mediaHostElement.getBoundingClientRect()
                    : null;
                this.videoPlaceholder = document.createElement('div');
                this.videoPlaceholder.className = 'mp-video-placeholder';
                if (hostRect && hostRect.height > 0) {
                    this.videoPlaceholder.style.width = hostRect.width > 0 ? `${Math.round(hostRect.width)}px` : '100%';
                    this.videoPlaceholder.style.height = `${Math.round(hostRect.height)}px`;
                    this.videoPlaceholder.style.backgroundColor = '#000000';
                }
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
     * @param {{ skipTimeRestore?: boolean }} [options]
     */
    restoreVideoState(options = {}) {
        const { skipTimeRestore = false } = options || {};
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
            
            // 仅在已有实际进度且未被开播高光/深链跳转接管时安全恢复播放位置，避免未就绪时抛出异常或覆盖目标跳转进度
            if (!skipTimeRestore && this.videoState && this.videoState.currentTime > 0) {
                const targetResumeTime = this.videoState.currentTime;
                const syncResumeTimeIfNeeded = () => {
                    if (!this.targetVideo) return;
                    const current = Number(this.targetVideo.currentTime) || 0;
                    if (Math.abs(current - targetResumeTime) > 0.5) {
                        try {
                            this.targetVideo.currentTime = targetResumeTime;
                        } catch (_) {}
                    }
                };
                if (this.targetVideo.readyState >= 1) {
                    syncResumeTimeIfNeeded();
                } else {
                    this.targetVideo.addEventListener('loadedmetadata', syncResumeTimeIfNeeded, { once: true });
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

                // iOS WebKit 行内播放关键防线：仅在 iOS 移动端触控环境下起播初期锁定静音，建立稳定行内图层，彻底阻断系统全屏弹出
                const originalMuted = this.targetVideo.muted;
                const needTempMute = isIosDevice() && !originalMuted;
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
                        // 如果因为浏览器自动播放策略阻止有声播放，降级为静音自动起播
                        if (error.name === 'NotAllowedError' || !this.targetVideo.muted) {
                            console.log('[PlayerCore] 尝试降级为静音自动起播...');
                            this.targetVideo.muted = true;
                            const mutedPromise = this.targetVideo.play();
                            if (mutedPromise !== undefined) {
                                mutedPromise.then(() => {
                                    console.log('[PlayerCore] 静音自动起播成功');
                                    // 挂载全局一次性交互监听，用户一旦点击/触碰屏幕尝试解除静音 (受静音租约决策保护)
                                    const unmuteOnInteract = () => {
                                        const shouldMute = checkShouldDefaultMute(this.options.playerState);
                                        if (!shouldMute && this.targetVideo) {
                                            this.targetVideo.muted = false;
                                            setValue('lastUnmutedTime', Date.now());
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
     * 立即将视频或自定义媒体宿主容器无损归还至原宿主 DOM 槽位（幂等，支持手势释放首帧 0ms 瞬时还原）
     */
    restoreMediaToHost() {
        if (!this.targetVideo) return;

        // 保存当前视频状态以便下次打开
        this.videoState.currentTime = this.targetVideo.currentTime;
        this.videoState.isPlaying = !this.targetVideo.paused;
        this.videoState.volume = this.targetVideo.volume;
        this.videoState.playbackRate = this.targetVideo.playbackRate;

        // 先在视频硬件合成表面处于活跃可见态时将其同步移回宿主原位，防止跨 Shadow DOM 边界移动已隐藏/已暂停节点触发 WebKit 重绑定黑屏
        const nodeToRestore = this.mediaHostElement || this.targetVideo;
        if (this.originalParent && nodeToRestore) {
            if (nodeToRestore.parentNode !== this.originalParent) {
                if (this.originalParent.isConnected) {
                    // 优先原位替换等尺寸占位符，实现 0ms 无重排无缝交接
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
            }
            if (this.videoPlaceholder && this.videoPlaceholder.parentNode) {
                this.videoPlaceholder.parentNode.removeChild(this.videoPlaceholder);
                this.videoPlaceholder = null;
            }

            // 彻底清空宿主视频及容器上可能残留的所有内联拖拽/动画样式，防止下滑退出后产生黑屏或位移残留
            const clearMediaStyles = (el) => {
                if (!el || !el.style) return;
                el.style.removeProperty('width');
                el.style.removeProperty('height');
                el.style.removeProperty('max-width');
                el.style.removeProperty('max-height');
                el.style.removeProperty('margin');
                el.style.removeProperty('position');
                el.style.removeProperty('transform');
                el.style.removeProperty('opacity');
                el.style.removeProperty('visibility');
                el.style.removeProperty('transition');
                el.style.removeProperty('display');
                el.style.removeProperty('cursor');
                el.style.removeProperty('will-change');
                el.style.removeProperty('object-fit');
            };
            clearMediaStyles(nodeToRestore);
            if (this.targetVideo && this.targetVideo !== nodeToRestore) {
                clearMediaStyles(this.targetVideo);
            }

            // 恢复原始 controls 状态
            if (this.videoState && typeof this.videoState.controls === 'boolean') {
                this.targetVideo.controls = this.videoState.controls;
            }

            // 始终保持 playsinline 属性，防止 Safari / 移动端在退出播放器或二次加载时被系统全屏劫持
            enforceInlinePlayback(this.targetVideo);

            // 若处于 Safari 原生系统全屏中，主动退出
            if (this.targetVideo.webkitDisplayingFullscreen && typeof this.targetVideo.webkitExitFullscreen === 'function') {
                try { this.targetVideo.webkitExitFullscreen(); } catch (_) {}
            }
        }

        // 在节点已完成 DOM 归位且保留首帧硬件合成画面后再暂停，消除解码层挂起空白
        if (!this.targetVideo.paused) {
            try { this.targetVideo.pause(); } catch (_) {}
        }
    }

    /**
     * 关闭播放器并恢复原始视频
     */
    close(overlay, container, playerContainer, rootHost) {
        this.cancelInitialSeekGuard();
        if (!overlay) return;

        // 执行幂等媒体节点归位与样式净化
        this.restoreMediaToHost();
        
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