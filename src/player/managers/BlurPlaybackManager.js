import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import { getValue } from '../../utils/index.js';

/**
 * 失焦与后台播放控制器 (Blur & Background Playback Manager)
 * 1. 当 pauseOnBlur === true (默认为开)：页面离开或失焦时自动暂停视频
 * 2. 当 pauseOnBlur === false (允许后台播放)：欺骗宿主页面的 Visibility / Focus 检测，拦截 blur / visibilitychange 事件，并防止宿主脚本私自暂停
 * 3. 缓冲区停滞自动恢复 (Buffer Stall Auto-Recovery)：
 *    当视频在前台播放中因缓冲不足 (BUFFER_STALL) 或宿主看门狗暂停时，保持播放意图，并在缓冲就绪后自动起播，跳过微小缓冲空洞 (Micro Gap)
 */
export class BlurPlaybackManager {
    static isInitialized = false;

    /**
     * 优化宿主 HLS 缓冲配置（扩大前向缓冲区预加载，减少网络微抖动引发的 stall）
     */
    static optimizeHlsBuffer() {
        try {
            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            if (win.Hls && win.Hls.DefaultConfig) {
                // 将默认 30s 前向缓冲提升至 60s，最大缓冲上限提升至 120s
                win.Hls.DefaultConfig.maxBufferLength = Math.max(win.Hls.DefaultConfig.maxBufferLength || 30, 60);
                win.Hls.DefaultConfig.maxMaxBufferLength = Math.max(win.Hls.DefaultConfig.maxMaxBufferLength || 600, 120);
                win.Hls.DefaultConfig.maxBufferSize = Math.max(win.Hls.DefaultConfig.maxBufferSize || 60000000, 80000000);
                // 提高对缓冲微小空洞的容忍度 (0.5s -> 0.8s)，避免卡死
                win.Hls.DefaultConfig.maxBufferHole = Math.max(win.Hls.DefaultConfig.maxBufferHole || 0.5, 0.8);
            }
            const hlsInstance = win.hls || win.player?.hls;
            if (hlsInstance && hlsInstance.config) {
                hlsInstance.config.maxBufferLength = Math.max(hlsInstance.config.maxBufferLength || 30, 60);
                hlsInstance.config.maxMaxBufferLength = Math.max(hlsInstance.config.maxMaxBufferLength || 600, 120);
                hlsInstance.config.maxBufferHole = Math.max(hlsInstance.config.maxBufferHole || 0.5, 0.8);
            }
        } catch (_) {}
    }

    /**
     * 全局初始化（在脚本启动时尽早注入 Document API 劫持与全局事件拦截器）
     */
    static initGlobal(playerState = null) {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.optimizeHlsBuffer();

        const isPauseOnBlurEnabled = () => {
            if (playerState?.settings?.pauseOnBlur !== undefined) {
                return playerState.settings.pauseOnBlur;
            }
            const val = getValue('pauseOnBlur', true);
            return val === true || val === 'true';
        };

        // 1. 劫持 document.hidden
        try {
            Object.defineProperty(document, 'hidden', {
                get: () => {
                    return isPauseOnBlurEnabled() ? false : false;
                },
                configurable: true
            });
        } catch (_) {}

        // 2. 劫持 document.visibilityState
        try {
            Object.defineProperty(document, 'visibilityState', {
                get: () => {
                    return isPauseOnBlurEnabled() ? 'visible' : 'visible';
                },
                configurable: true
            });
        } catch (_) {}

        // 3. 劫持 document.hasFocus
        try {
            Object.defineProperty(document, 'hasFocus', {
                value: () => true,
                configurable: true
            });
        } catch (_) {}

        // 4. 拦截失焦与可见性变化事件传播 (仅在 pauseOnBlur === false 时拦截)
        const blurEvents = [
            'visibilitychange',
            'webkitvisibilitychange',
            'mozvisibilitychange',
            'blur',
            'focusout',
            'pagehide'
        ];

        blurEvents.forEach(eventType => {
            const handler = (e) => {
                if (!isPauseOnBlurEnabled()) {
                    // 允许后台播放：立即终止事件向宿主网页的任何监听器传播
                    e.stopImmediatePropagation();
                }
            };
            window.addEventListener(eventType, handler, true);
            document.addEventListener(eventType, handler, true);
        });
    }

    /**
     * 为具体播放器实例挂载视频失焦与恢复监听
     */
    static attachPlayer(targetVideo, playerCore) {
        if (!targetVideo) return;

        let userInteracted = false;
        let wasPlaying = !targetVideo.paused;
        let recoveryTimer = null;
        let recoveryAttempts = 0;
        let isRecovering = false;

        const isPauseOnBlurEnabled = () => {
            if (playerCore?.options?.playerState?.settings?.pauseOnBlur !== undefined) {
                return playerCore.options.playerState.settings.pauseOnBlur;
            }
            const val = getValue('pauseOnBlur', true);
            return val === true || val === 'true';
        };

        const cancelRecovery = () => {
            if (recoveryTimer) {
                clearTimeout(recoveryTimer);
                recoveryTimer = null;
            }
            recoveryAttempts = 0;
            isRecovering = false;
        };

        // 追踪用户真实手势交互 (防止误把宿主自动暂停或卡顿暂停当成用户主动暂停)
        const markUserInteraction = () => {
            userInteracted = true;
            // 一旦用户主动操作，立即取消自动恢复状态，以用户的意图为准
            cancelRecovery();
            setTimeout(() => {
                userInteracted = false;
            }, 600);
        };

        ['click', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, markUserInteraction, { capture: true, passive: true });
        });

        targetVideo.addEventListener('play', () => {
            wasPlaying = true;
            cancelRecovery();
        });

        targetVideo.addEventListener('playing', () => {
            wasPlaying = true;
            cancelRecovery();
        });

        targetVideo.addEventListener('waiting', () => {
            // 原生进入 waiting 说明正在缓冲数据，用户意图仍然是播放中
            if (!targetVideo.paused) {
                wasPlaying = true;
            }
        });

        // 检测并跳过微小缓冲空洞 (Micro Gap)
        const checkAndJumpBufferHole = () => {
            try {
                const ct = targetVideo.currentTime;
                const buffered = targetVideo.buffered;
                if (!buffered || buffered.length === 0) return false;
                for (let i = 0; i < buffered.length; i++) {
                    const start = buffered.start(i);
                    // 如果播放头卡在某个已缓冲片段稍前处（微小空洞隙缝 <= 0.35s）
                    if (ct < start && (start - ct) <= 0.35) {
                        const newTime = start + 0.05;
                        console.log('[MissPlayer] 检测到缓冲区微空洞，微调跳跃:', ct.toFixed(2), '->', newTime.toFixed(2));
                        targetVideo.currentTime = newTime;
                        return true;
                    }
                }
            } catch (_) {}
            return false;
        };

        // 尝试自动恢复起播
        const attemptAutoResume = (triggerReason = 'stall') => {
            if (!targetVideo.paused || targetVideo.ended || userInteracted || !wasPlaying) {
                cancelRecovery();
                return;
            }

            // 若页面已被切到后台且开启了失焦暂停，则终止自动恢复
            if ((document.hidden || document.visibilityState === 'hidden') && isPauseOnBlurEnabled()) {
                cancelRecovery();
                wasPlaying = false;
                return;
            }

            recoveryAttempts++;

            // 达到 2 次重试后尝试检测并跳过缓冲区微小空隙
            if (recoveryAttempts >= 2) {
                checkAndJumpBufferHole();
            }

            // 检查就绪状态：readyState >= 3 (HAVE_FUTURE_DATA 或 HAVE_ENOUGH_DATA)
            if (targetVideo.readyState >= 3) {
                targetVideo.play().then(() => {
                    const curTime = targetVideo.currentTime ? targetVideo.currentTime.toFixed(2) : 0;
                    DebugLogPanel.addLog('[RECOVER] 缓冲恢复: 自动恢复播放成功 (' + triggerReason + ') 进度=' + curTime + 's', 'info');
                    console.log('[MissPlayer Diagnostic] 自动恢复播放成功 (' + triggerReason + ') 进度=' + curTime + 's');
                    cancelRecovery();
                }).catch(() => {
                    // 若 play() 被浏览器策略或状态暂时拒绝，继续调度重试
                    scheduleRetry(triggerReason);
                });
            } else {
                scheduleRetry(triggerReason);
            }
        };

        const scheduleRetry = (triggerReason) => {
            if (recoveryTimer) clearTimeout(recoveryTimer);
            if (recoveryAttempts > 30) {
                // 重试达 30 次（约 15~20 秒）仍然无法加载，停止空转
                console.warn('[MissPlayer] 缓冲超时重试已达上限，停止自动重试');
                cancelRecovery();
                return;
            }
            const delay = Math.min(300 + recoveryAttempts * 100, 1500);
            recoveryTimer = setTimeout(() => {
                attemptAutoResume(triggerReason);
            }, delay);
        };

        // 当视频底层缓冲充盈触发 canplay / canplaythrough 时，若处于非用户主动暂停且恢复中，立即触发起播
        const onBufferReady = () => {
            if (isRecovering && targetVideo.paused && !userInteracted && wasPlaying && !targetVideo.ended) {
                attemptAutoResume('canplay_ready');
            }
        };

        targetVideo.addEventListener('canplay', onBufferReady);
        targetVideo.addEventListener('canplaythrough', onBufferReady);
        targetVideo.addEventListener('error', cancelRecovery);

        // 监听视频暂停事件
        targetVideo.addEventListener('pause', () => {
            const stack = (new Error().stack || '');
            let triggerSource = 'UNKNOWN';
            if (userInteracted) {
                triggerSource = 'USER_INTERACTION';
            } else if (targetVideo.ended) {
                triggerSource = 'VIDEO_ENDED';
            } else if (document.hidden || document.visibilityState === 'hidden') {
                triggerSource = 'PAGE_HIDDEN_OR_BLUR';
            } else if (targetVideo.readyState < 3 || targetVideo.networkState === 2) {
                triggerSource = 'BUFFER_STALL';
            } else if (stack.includes('MissPlayer') || stack.includes('CustomVideoPlayer') || stack.includes('PlaybackController') || stack.includes('LoopManager')) {
                triggerSource = 'MISS_PLAYER_INTERNAL';
            } else {
                triggerSource = 'HOST_SCRIPT_TRIGGERED';
            }

            const diagInfo = {
                source: triggerSource,
                currentTime: targetVideo.currentTime ? targetVideo.currentTime.toFixed(2) : 0,
                duration: targetVideo.duration ? targetVideo.duration.toFixed(2) : 0,
                readyState: targetVideo.readyState,
                networkState: targetVideo.networkState,
                userInteracted,
                documentHidden: document.hidden
            };

            DebugLogPanel.addLog('[PAUSE] 视频暂停: [' + triggerSource + '] 进度=' + diagInfo.currentTime + 's', triggerSource === 'HOST_SCRIPT_TRIGGERED' ? 'warn' : 'info');
            console.warn('[MissPlayer Diagnostic] 自动暂停分析 【' + triggerSource + '】: 进度=' + diagInfo.currentTime + 's, 就绪=' + diagInfo.readyState + ', 缓冲=' + diagInfo.networkState + ', 失焦=' + diagInfo.documentHidden, diagInfo, '\nStack:', stack);

            // 1. 若是用户主动交互暂停、视频正常播放结束、或 MissPlayer 内部控制器主动调用的暂停：
            if (triggerSource === 'USER_INTERACTION' || triggerSource === 'VIDEO_ENDED' || triggerSource === 'MISS_PLAYER_INTERNAL') {
                cancelRecovery();
                wasPlaying = false;
                return;
            }

            // 2. 若是失焦 / 切后台导致的暂停：
            if (triggerSource === 'PAGE_HIDDEN_OR_BLUR') {
                cancelRecovery();
                if (isPauseOnBlurEnabled()) {
                    wasPlaying = false;
                    return;
                }
                // 用户关闭了“失焦暂停”（允许后台播放）：延时拉起播放
                if (wasPlaying && !targetVideo.ended) {
                    setTimeout(() => {
                        if (targetVideo.paused && !targetVideo.ended && wasPlaying) {
                            targetVideo.play().catch(() => {});
                        }
                    }, 150);
                }
                return;
            }

            // 3. 核心修复：在前台播放时因 BUFFER_STALL、HOST_SCRIPT_TRIGGERED 或 UNKNOWN 触发的非用户暂停：
            // 用户没有点击暂停，视频前一刻仍在播放，绝不能丢弃 wasPlaying 意图，进入自动恢复状态！
            if (wasPlaying && !targetVideo.ended) {
                isRecovering = true;
                // 尝试优化 HLS 缓冲区
                BlurPlaybackManager.optimizeHlsBuffer();
                // 立即或微延时调度自动恢复
                attemptAutoResume(triggerSource);
            }
        }, true);

        // 页面可见性变化监听
        const handleVisibilityChange = () => {
            if (isPauseOnBlurEnabled()) {
                // 开启“失焦后停止播放”：离开页面或窗口失焦时主动暂停
                if (document.hidden || document.visibilityState === 'hidden') {
                    cancelRecovery();
                    if (targetVideo && !targetVideo.paused) {
                        targetVideo.pause();
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleVisibilityChange);
    }
}
