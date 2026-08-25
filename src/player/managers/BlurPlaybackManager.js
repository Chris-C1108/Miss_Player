import { getValue } from '../../utils/index.js';

/**
 * 失焦与后台播放控制器 (Blur & Background Playback Manager)
 * 1. 当 pauseOnBlur === true (默认为开)：页面离开或失焦时自动暂停视频
 * 2. 当 pauseOnBlur === false (允许后台播放)：欺骗宿主页面的 Visibility / Focus 检测，拦截 blur / visibilitychange 事件，并防止宿主脚本私自暂停
 */
export class BlurPlaybackManager {
    static isInitialized = false;

    /**
     * 全局初始化（在脚本启动时尽早注入 Document API 劫持与全局事件拦截器）
     */
    static initGlobal(playerState = null) {
        if (this.isInitialized) return;
        this.isInitialized = true;

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

        const isPauseOnBlurEnabled = () => {
            if (playerCore?.options?.playerState?.settings?.pauseOnBlur !== undefined) {
                return playerCore.options.playerState.settings.pauseOnBlur;
            }
            const val = getValue('pauseOnBlur', true);
            return val === true || val === 'true';
        };

        // 追踪用户真实手势交互 (防止误把宿主自动暂停当成用户主动暂停)
        const markUserInteraction = () => {
            userInteracted = true;
            setTimeout(() => {
                userInteracted = false;
            }, 600);
        };

        ['click', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, markUserInteraction, { capture: true, passive: true });
        });

        targetVideo.addEventListener('play', () => {
            wasPlaying = true;
        });

        // 监听视频暂停事件：若是原站脚本在后台偷偷暂停，且用户开启了允许后台播放，则自动拉起播放
        targetVideo.addEventListener('pause', () => {
            if (isPauseOnBlurEnabled()) {
                wasPlaying = false;
                return;
            }

            // 用户开启了允许后台播放 (pauseOnBlur === false)
            if (!userInteracted && wasPlaying && !targetVideo.ended) {
                setTimeout(() => {
                    if (targetVideo.paused && !targetVideo.ended && wasPlaying) {
                        targetVideo.play().catch(() => {});
                    }
                }, 150);
            } else if (userInteracted) {
                wasPlaying = false;
            }
        }, true);

        // 页面可见性变化监听
        const handleVisibilityChange = () => {
            if (isPauseOnBlurEnabled()) {
                // 开启“失焦后停止播放”：离开页面或窗口失焦时主动暂停
                if (document.hidden || document.visibilityState === 'hidden') {
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
