/**
 * iOS Safari 行内播放强制器 (Inline Playback Enforcer)
 * 
 * 职责：
 * 1. 严格遵循 HTML5 布尔属性规范，在所有 <video> 标签上注入 playsinline, webkit-playsinline, x5-playsinline
 * 2. 挂载全局 MutationObserver (在 document-start 第一时间监听)，对页面动态增加的视频元素及其 Shadow DOM 进行毫秒级内联赋权
 * 3. 拦截 webkitEnterFullscreen / webkitEnterFullScreen 原型链调用，杜绝宿主脚本或 iOS Safari 强制弹出原生 AVPlayerViewController
 * 4. 监听 webkitpresentationmodechanged 事件，一旦检测到脱离行内模式立即拉回 inline
 */

export function enforceInlinePlayback(video) {
    if (!video || !(video instanceof HTMLVideoElement)) return;
    if (video._mpInlineEnforced) return;
    video._mpInlineEnforced = true;

    // 1. 标准 HTML5 布尔属性注入 (严格使用空字符串 ''，严禁使用 'true' 以免被部分 WebKit 版本误判)
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');
    video.playsInline = true;
    video.webkitPlaysInline = true;

    // 2. 禁用原生画中画与系统控件弹窗干扰
    video.setAttribute('disablepictureinpicture', '');

    // 3. 原生方法拦截：防止宿主原站事件监听器偷调 iOS 系统全屏
    if (typeof video.webkitEnterFullscreen === 'function' && !video._mpHookedFullscreen) {
        video._mpHookedFullscreen = true;
        video._origWebkitEnterFullscreen = video.webkitEnterFullscreen;
        video.webkitEnterFullscreen = function() {
            console.log('[MissPlayer] 拦截到 webkitEnterFullscreen，保持在行内播放');
        };
    }
    if (typeof video.webkitEnterFullScreen === 'function' && !video._mpHookedFullScreen) {
        video._mpHookedFullScreen = true;
        video._origWebkitEnterFullScreen = video.webkitEnterFullScreen;
        video.webkitEnterFullScreen = function() {
            console.log('[MissPlayer] 拦截到 webkitEnterFullScreen，保持在行内播放');
        };
    }

    // 4. WebKit 呈现模式保护：锁定模式为 inline
    if (typeof video.webkitSetPresentationMode === 'function') {
        try { video.webkitSetPresentationMode('inline'); } catch (_) {}
    }

    // 5. 监听呈现模式变化，若被系统或外部提升至 fullscreen，立即拉回 inline
    video.addEventListener('webkitpresentationmodechanged', () => {
        if (video.webkitPresentationMode && video.webkitPresentationMode !== 'inline') {
            try {
                video.webkitSetPresentationMode('inline');
            } catch (_) {}
        }
    }, { passive: true });
}

/**
 * 全局启动 iOS 内联播放监听守卫 (在页面启动时最早执行)
 */
export function initIosInlinePlaybackGuard() {
    // 立即对 DOM 中已存在的全部 video 元素赋权
    const existingVideos = document.querySelectorAll('video');
    existingVideos.forEach(enforceInlinePlayback);

    // 深度穿透递归辅助函数
    const processNode = (node) => {
        if (!node || node.nodeType !== 1) return;
        if (node.tagName === 'VIDEO') {
            enforceInlinePlayback(node);
        } else if (typeof node.querySelectorAll === 'function') {
            const innerVideos = node.querySelectorAll('video');
            innerVideos.forEach(enforceInlinePlayback);
        }
        // 如果节点带有开放的 shadowRoot，同样深入穿透
        if (node.shadowRoot && typeof node.shadowRoot.querySelectorAll === 'function') {
            const shadowVideos = node.shadowRoot.querySelectorAll('video');
            shadowVideos.forEach(enforceInlinePlayback);
        }
    };

    // 挂载顶层 MutationObserver 实时拦截动态节点注入
    try {
        const observer = new MutationObserver((mutations) => {
            for (let i = 0; i < mutations.length; i++) {
                const added = mutations[i].addedNodes;
                for (let j = 0; j < added.length; j++) {
                    processNode(added[j]);
                }
            }
        });
        const target = document.documentElement || document.body;
        if (target) {
            observer.observe(target, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.documentElement) {
                    observer.observe(document.documentElement, { childList: true, subtree: true });
                }
            }, { once: true });
        }
    } catch (_) {}
}
