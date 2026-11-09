import { findVideoElement, createElementWithStyle, getSafeAreaInsets, isPortrait } from '../../utils/index.js';
import { enforceInlinePlayback } from '../../utils/iosInline.js';
import { CustomVideoPlayer } from '../index.js';
import { FLOATING_PLAY } from '../../constants/icons.js';
import { telemetry } from '../../telemetry';

/**
 * 浮动按钮类
 */
export class FloatingButton {
    constructor(options = {}) {
        this.button = null;
        this.videoPlayer = null;
        this.resizeTimeout = null;
        this.playerState = options.playerState || null;
        this.videoCheckInterval = null;
        this.mutationObserver = null;
        this._listenersAttached = false;
        this._handleResize = this.handleResize.bind(this);
    }

    /**
     * 初始化浮动按钮
     */
    init() {
        // 清理可能存在的旧按钮
        this.cleanupExistingButtons();
        
        // 检查页面是否存在视频元素
        if (findVideoElement(true)) {
            // 创建新按钮
            this.createButton();
            
            // 监听窗口大小变化与屏幕方向变化
            this.setupOrientationListeners();
            
            // 监听DOM变化，处理视频元素的动态添加/移除
            this.setupMutationObserver();
            
            console.log('[FloatingButton] 已创建浮动按钮，页面中存在视频元素');
        } else {
            console.log('[FloatingButton] 页面中未检测到视频元素，不显示浮动按钮');
            
            // 开始周期性检查视频元素
            this.startVideoElementCheck();
            
            // 监听DOM变化，处理视频元素的动态添加
            this.setupMutationObserver();
        }
    }
    
    /**
     * 统一绑定屏幕方向与视口变化监听器
     */
    setupOrientationListeners() {
        if (this._listenersAttached) return;
        this._listenersAttached = true;
        
        window.addEventListener('resize', this._handleResize);
        window.addEventListener('orientationchange', this._handleResize);
        
        if (window.matchMedia) {
            this._portraitMediaQuery = window.matchMedia('(orientation: portrait)');
            if (this._portraitMediaQuery.addEventListener) {
                this._portraitMediaQuery.addEventListener('change', this._handleResize);
            } else if (this._portraitMediaQuery.addListener) {
                this._portraitMediaQuery.addListener(this._handleResize);
            }
        }
        
        if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
            window.screen.orientation.addEventListener('change', this._handleResize);
        }

        // 监听原生 <dialog> 关闭或取消事件，及时将浮钮归位至 body
        if (!this._dialogCloseHandler) {
            this._dialogCloseHandler = (e) => {
                if (e && e.target && (e.target.tagName === 'DIALOG' || e.target.id === 'stage')) {
                    this.ensureTopLayerMount();
                }
            };
            document.addEventListener('close', this._dialogCloseHandler, true);
            document.addEventListener('cancel', this._dialogCloseHandler, true);
            document.addEventListener('toggle', this._dialogCloseHandler, true);
        }
    }
    
    /**
     * 设置MutationObserver监听DOM变化
     */
    setupMutationObserver() {
        // 清理可能存在的旧观察者
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // 创建新的观察者
        this.mutationObserver = new MutationObserver(this.handleDomMutations.bind(this));
        
        // 开始观察整个文档的变化 (包含子树增删与关键模态属性变动)
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['open', 'src']
        });
    }
    
    /**
     * 判断播放器当前是否处于激活状态
     */
    isPlayerActive() {
        return Boolean(
            (document.body && document.body.classList.contains('tm-player-active')) ||
            (document.documentElement && document.documentElement.classList.contains('tm-player-active')) ||
            document.querySelector('miss-player-root')
        );
    }

    /**
     * 获取当前处于打开/激活状态的原生模态 dialog (例如 Peach 的 <dialog id="stage">)
     */
    getActiveDialog() {
        const candidates = document.querySelectorAll('dialog[open], dialog#stage, [data-stage-host] dialog, [data-stage-dialog]');
        for (const d of candidates) {
            if (!d || !d.isConnected) continue;
            if (d.open || d.hasAttribute('open')) return d;
            try {
                const style = window.getComputedStyle(d);
                if (style && style.display !== 'none' && style.visibility !== 'hidden') {
                    return d;
                }
            } catch (_) {}
        }
        return null;
    }

    /**
     * 确保浮动按钮在 Top Layer 模态层 (如原生 <dialog open>) 中依然可见不被遮挡，并保持容器末位子节点以获得同级最高绘制顺位
     */
    ensureTopLayerMount() {
        if (!this.button) return;
        try {
            // 查找当前页面上处于打开状态的原生模态 dialog（例如 Peach 的 <dialog id="stage" open>）
            const activeDialog = this.getActiveDialog();
            const targetContainer = (activeDialog && activeDialog.isConnected) ? activeDialog : document.body;
            if (!targetContainer) return;

            if (this.button.parentElement !== targetContainer || targetContainer.lastElementChild !== this.button) {
                targetContainer.appendChild(this.button);
            }
        } catch (_) {}
    }

    /**
     * 判定当前设备是否为 iPad 平板端（短边 ≥ 600px）或 PC 桌面端（精确指针）
     * 手机端（短边 < 600px 的触屏设备，含横竖屏）返回 false -> 底部居中
     * iPad 及 PC 端返回 true -> 右下角显示
     */
    isTabletOrDesktop() {
        const vw = window.innerWidth || document.documentElement?.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement?.clientHeight || 0;
        const hasFinePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
        return (vw >= 600 && vh >= 600) || hasFinePointer;
    }

    /**
     * 空间碰撞检测与动态避让引擎 (Universal Spatial Hit-Test Anti-Occlusion)
     * 探测基准锚点区域是否存在宿主固定底栏、批量操作坞 ([data-batch-dock]) 或第三方插件悬浮钮，动态计算避让偏移量
     */
    _resolveCollisionOffsets() {
        if (typeof document === 'undefined' || typeof document.elementsFromPoint !== 'function') {
            return { offsetX: 0, offsetY: 0 };
        }

        const vw = window.innerWidth || document.documentElement?.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement?.clientHeight || 0;
        if (vw <= 0 || vh <= 0) {
            return { offsetX: 0, offsetY: 0 };
        }

        const isCornerMode = this.isTabletOrDesktop();
        const btnSize = 56;
        const half = btnSize / 2;
        const baseBottom = isCornerMode ? 24 : 20;
        const baseRight = 24;

        const baseCenterX = isCornerMode ? (vw - baseRight - half) : (vw / 2);
        const baseCenterY = vh - baseBottom - half;

        const probePoints = [
            [baseCenterX, baseCenterY],
            [baseCenterX - 18, baseCenterY + 18],
            [baseCenterX + 18, baseCenterY + 18],
            [baseCenterX - 18, baseCenterY - 18],
            [baseCenterX + 18, baseCenterY - 18]
        ];

        const visited = new Set();
        let maxLiftY = 0;

        for (const [px, py] of probePoints) {
            if (px < 0 || px > vw || py < 0 || py > vh) continue;
            let hitElements = [];
            try {
                hitElements = document.elementsFromPoint(px, py) || [];
            } catch (_) {
                continue;
            }

            for (const rawEl of hitElements) {
                if (!rawEl || rawEl === this.button || this.button?.contains(rawEl)) continue;

                let node = rawEl;
                for (let depth = 0; depth < 5 && node && node !== document.body && node !== document.documentElement; depth++, node = node.parentElement) {
                    if (visited.has(node)) continue;
                    const tag = (node.tagName || '').toUpperCase();
                    if (tag === 'DIALOG' || tag === 'VIDEO' || tag === 'HLSJS-VIDEO' || tag === 'CANVAS' || tag === 'MISS-PLAYER-ROOT') {
                        continue;
                    }

                    let style;
                    try {
                        style = window.getComputedStyle(node);
                    } catch (_) {
                        continue;
                    }
                    if (!style || style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || style.pointerEvents === 'none') {
                        continue;
                    }

                    const rect = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null;
                    if (!rect || rect.width <= 0 || rect.height <= 0) continue;

                    // 排除全屏背景容器或页面主体内容层
                    if (rect.width >= vw * 0.95 && rect.height >= vh * 0.45) continue;

                    const isFixedOrSticky = style.position === 'fixed' || style.position === 'sticky';
                    const isExplicitDockOrControl = typeof node.matches === 'function' && node.matches(
                        '[data-batch-dock], #peach-jav-action, [id*="peach-jav"], [class*="floating"], [class*="fab"], button, a[href], [role="button"]'
                    );

                    if ((isFixedOrSticky && rect.height < vh * 0.4) || (isExplicitDockOrControl && rect.width <= 420 && rect.height <= 140)) {
                        visited.add(node);
                        // 若障碍物位于视口下半区且与基准按钮区域发生垂直交叠，计算向上抬升避让距离 (留出 12px 呼吸间距)
                        if (rect.top > vh * 0.45 && rect.bottom > (vh - baseBottom - btnSize)) {
                            const neededLift = Math.round((vh - baseBottom) - rect.top + 12);
                            if (neededLift > maxLiftY) {
                                maxLiftY = neededLift;
                            }
                        }
                    }
                }
            }
        }

        const safeLiftY = Math.max(0, Math.min(maxLiftY, Math.round(vh * 0.35)));
        return { offsetX: 0, offsetY: safeLiftY };
    }

    /**
     * 处理DOM变化
     */
    handleDomMutations() {
        if (this.isPlayerActive()) {
            if (this.button) this.button.style.display = 'none';
            return;
        }

        // 持续守护心跳：确保 SPA 页面切换或视频关闭后巡检计时器始终常驻
        if (!this.videoCheckInterval) {
            this.startVideoElementCheck();
        }

        // 使用防抖函数限制调用频率
        if (this.mutationTimeout) clearTimeout(this.mutationTimeout);
        
        this.mutationTimeout = setTimeout(() => {
            this.ensureTopLayerMount();
            const hasVideo = findVideoElement(true);
            
            // 如果有视频元素但没有按钮，创建按钮
            if (hasVideo && !this.button) {
                this.createButton();
                this.setupOrientationListeners();
                console.log('[FloatingButton] DOM变化检测到视频元素，已创建浮动按钮');
            } 
            // 如果有按钮但没有视频元素，隐藏按钮
            else if (!hasVideo && this.button) {
                this.button.style.display = 'none';
                console.log('[FloatingButton] DOM变化检测到视频元素已移除，已隐藏浮动按钮');
            }
            // 如果有视频元素且有按钮，确保按钮显示并更新位置
            else if (hasVideo && this.button) {
                if (this.button.style.display === 'none') {
                    this.button.style.display = 'flex';
                    console.log('[FloatingButton] DOM变化检测到视频元素已添加，已显示浮动按钮');
                }
                this.updateButtonPosition();
            }
        }, 250);
    }

    /**
     * 开始周期性检查视频元素
     * 针对动态加载视频的网站 (尤其是 Peach Web / YouTube 等 SPA 架构)，保持心跳巡检，确保跨页点播时浮钮即时就绪
     */
    startVideoElementCheck() {
        // 清除可能存在的旧计时器
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
        }
        
        // 设置新计时器，每 1.5 秒心跳巡检一次
        this.videoCheckInterval = setInterval(() => {
            if (this.isPlayerActive()) {
                if (this.button) this.button.style.display = 'none';
                return;
            }
            const hasVideo = findVideoElement(true);
            if (hasVideo) {
                // 只有当按钮不存在时才创建
                if (!this.button) {
                    // 找到视频元素，创建按钮
                    this.createButton();
                    this.setupOrientationListeners();
                    console.log('[FloatingButton] 定时检测到视频元素，已创建浮动按钮');
                } else {
                    if (this.button.style.display === 'none') {
                        // 按钮存在但被隐藏，重新显示并更新位置
                        this.button.style.display = 'flex';
                        console.log('[FloatingButton] 定时检测到视频元素，已显示浮动按钮');
                    }
                    this.ensureTopLayerMount();
                    this.updateButtonPosition();
                }
            } else if (this.button && this.button.style.display !== 'none') {
                this.button.style.display = 'none';
            }
        }, 1500);
    }

    /**
     * 清理可能存在的旧浮动按钮
     */
    cleanupExistingButtons() {
        // 查找所有现有的浮动按钮
        const existingButtons = document.querySelectorAll('.tm-floating-button');
        
        if (existingButtons.length > 0) {
            console.log(`[FloatingButton] 清理 ${existingButtons.length} 个现有浮动按钮`);
            
            existingButtons.forEach(button => {
                if (button && button.parentNode) {
                    button.parentNode.removeChild(button);
                }
            });
        }
    }

    /**
     * 处理窗口大小与屏幕方向变化
     */
    handleResize() {
        if (this.isPlayerActive()) {
            if (this.button) this.button.style.display = 'none';
            return;
        }
        // 第一时间立即刷新定位，防止转屏过渡闪烁
        if (this.button && this.button.style.display !== 'none') {
            this.updateButtonPosition();
        }
        
        // 使用节流防抖限制高频重排，并在视口尺寸稳定后再次确认位置
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        
        this.resizeTimeout = setTimeout(() => {
            // 检查页面是否存在视频元素
            if (findVideoElement(true)) {
                if (this.button) {
                    this.button.style.display = 'flex';
                    this.updateButtonPosition();
                }
            } else if (this.button) {
                this.button.style.display = 'none';
            }
        }, 150);
    }

    /**
     * 创建浮动按钮
     */
    createButton() {
        // 创建浮动按钮 - 由宿主轨 _host.css 统一管控布局，JS 仅注入防碰撞动态 CSS 变量
        this.button = createElementWithStyle('button', 'tm-floating-button');

        this.button.innerHTML = FLOATING_PLAY;

        // 添加点击与触控事件处理器 (移动端 touchend + 桌面端 click 双轨触发与防重点击)
        let isHandlingClick = false;
        const onTrigger = (e) => {
            if (isHandlingClick) return;
            isHandlingClick = true;
            if (e && e.cancelable && e.type === 'touchend') {
                e.preventDefault();
            }
            if (e) e.stopPropagation();
            this.handleButtonClick();
            setTimeout(() => { isHandlingClick = false; }, 800);
        };

        this.button.addEventListener('touchend', onTrigger, { passive: false });
        this.button.addEventListener('click', onTrigger);

        // 显示按钮
        this.button.style.display = 'flex';
        this.button._floatingButtonInstance = this;

        // 初始挂载至正确层级与动态防遮挡位置更新
        this.ensureTopLayerMount();
        this.updateButtonPosition();

        return this.button;
    }

    /**
     * 更新按钮位置：由 _host.css 响应式媒体查询负责设备分档锚点（手机端底部居中，iPad/PC 右下角），
     * JS 仅负责 Top Layer 末位挂载与注入 --mp-fab-offset-x / --mp-fab-offset-y 空间避让令牌
     */
    updateButtonPosition() {
        if (!this.button) return;
        if (this.isPlayerActive()) {
            this.button.style.display = 'none';
            return;
        }
        this.ensureTopLayerMount();

        // 清理可能残留的历史行内坐标覆盖，交由 _host.css 声明式分档规则接管
        this.button.style.removeProperty('left');
        this.button.style.removeProperty('right');
        this.button.style.removeProperty('bottom');
        this.button.style.removeProperty('transform');

        // 动态探测宿主固定底栏/悬浮按钮遮挡并注入避让偏移量（正值 offsetY 叠加在 bottom 上实现向上抬升避让）
        const { offsetX, offsetY } = this._resolveCollisionOffsets();
        const nextX = `${offsetX}px`;
        const nextY = `${offsetY}px`;
        if (this.button.style.getPropertyValue('--mp-fab-offset-x') !== nextX) {
            this.button.style.setProperty('--mp-fab-offset-x', nextX);
        }
        if (this.button.style.getPropertyValue('--mp-fab-offset-y') !== nextY) {
            this.button.style.setProperty('--mp-fab-offset-y', nextY);
        }
    }

    /**
     * 处理按钮点击
     */
    handleButtonClick() {
        // 遥测上报：浮窗按钮被点击，记录触发站点和视频信息
        telemetry.trackPluginTrigger();

        const targetNode = findVideoElement(true);

        // 如果命中的是播放器 iframe，直接通知内部或最大化
        if (targetNode && targetNode.tagName === 'IFRAME') {
            console.log('[FloatingButton] 命中播放器 iframe，发送跨帧全屏广播');
            try {
                targetNode.contentWindow.postMessage({ type: 'MP_TRIGGER_PLAYER' }, '*');
            } catch (_) {}
            targetNode.classList.toggle('tm-iframe-expanded');
            if (!document.getElementById('tm-iframe-expand-style')) {
                const style = document.createElement('style');
                style.id = 'tm-iframe-expand-style';
                style.textContent = `
                    iframe.tm-iframe-expanded {
                        position: fixed !important;
                        inset: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        z-index: 2000000000 !important;
                        border: none !important;
                    }
                `;
                document.head.appendChild(style);
            }
            return;
        }

        // 在用户直接点击手势的调用栈顶端尝试预热激活视频元素 (必须先设置 playsinline 属性，防止 Safari 自动跳入系统全屏播放器)
        const preTargetVideo = (targetNode && targetNode.tagName === 'VIDEO') ? targetNode : findVideoElement(false);
        
        // 若当前页面尚未完成视频渲染挂载，启动极速探针重试，避免静默失败
        if (!preTargetVideo) {
            console.warn('[FloatingButton] 初始未找到视频元素，等待异步渲染...');
            Toast(__('loadingVideo') || '正在定位视频源...', 1500, 'info');
            setTimeout(() => {
                const retryVideo = findVideoElement(false);
                if (retryVideo) {
                    this.handleButtonClick();
                } else {
                    Toast(__('videoNotFound') || '未检测到视频，请确认视频已在页面上加载', 3000, 'warning');
                    this.button.style.display = 'flex';
                }
            }, 600);
            return;
        }

        if (preTargetVideo) {
            enforceInlinePlayback(preTargetVideo);

            // 如果处于 Safari 系统全屏播放中，主动退出
            if (preTargetVideo.webkitDisplayingFullscreen && typeof preTargetVideo.webkitExitFullscreen === 'function') {
                try { preTargetVideo.webkitExitFullscreen(); } catch (_) {}
            }
        }

        // 立即隐藏按钮，给用户极速的交互反馈
        this.button.style.display = 'none';
        
        // 将耗时的 DOM 创建与播放器组装拆解至 requestAnimationFrame，使点击响应时间降至 < 3ms (大幅降低 INP 延迟)
        requestAnimationFrame(() => {
            // 每次点击都创建新的视频播放器实例，并透传预热获取到的目标视频节点
            this.videoPlayer = new CustomVideoPlayer({
                playerState: this.playerState,
                callingButton: this.button,  // 确保传递按钮引用
                targetVideo: preTargetVideo
            });
            
            // 初始化播放器
            this.videoPlayer.init();
        });
    }

    /**
     * 移除浮动按钮
     */
    remove() {
        if (this.button && this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
        
        // 移除屏幕方向与视口监听器
        if (this._listenersAttached) {
            window.removeEventListener('resize', this._handleResize);
            window.removeEventListener('orientationchange', this._handleResize);
            
            if (this._portraitMediaQuery) {
                if (this._portraitMediaQuery.removeEventListener) {
                    this._portraitMediaQuery.removeEventListener('change', this._handleResize);
                } else if (this._portraitMediaQuery.removeListener) {
                    this._portraitMediaQuery.removeListener(this._handleResize);
                }
            }
            
            if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener) {
                window.screen.orientation.removeEventListener('change', this._handleResize);
            }
            if (this._dialogCloseHandler) {
                document.removeEventListener('close', this._dialogCloseHandler, true);
                document.removeEventListener('cancel', this._dialogCloseHandler, true);
                document.removeEventListener('toggle', this._dialogCloseHandler, true);
                this._dialogCloseHandler = null;
            }
            this._listenersAttached = false;
        }
        
        // 清除计时器
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
            this.mutationTimeout = null;
        }
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
            this.videoCheckInterval = null;
        }
        
        // 断开MutationObserver
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // 清除引用
        this.button = null;
    }
} 