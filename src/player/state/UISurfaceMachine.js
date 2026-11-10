/**
 * UISurfaceMachine — 播放器显式 UI 层级、互斥浮层状态机与 iOS 虚拟键盘焦点守卫
 *
 * 解决历史迭代中各组件各自为政导致的“隐式状态机 (Implicit State Machines)”问题：
 * 1. 统一协调四大互斥浮层 ('comment-composer' | 'marker-sheet' | 'inline-remark' | 'settings') 与顶层模态栈 ('modal')
 * 2. 提供穿透 Shadow DOM 的捕获阶段 (Capture Phase + composedPath) 外部点击收起与 Escape 栈式关闭
 * 3. 提供 iOS Safari 虚拟键盘防失焦 (bindKeepFocusAction) 与防键盘塌陷误触 (bindActionWithoutBlurShift) 原语
 */

export const SURFACE_TYPES = Object.freeze({
    NONE: 'none',
    COMMENT_COMPOSER: 'comment-composer',
    MARKER_SHEET: 'marker-sheet',
    INLINE_REMARK: 'inline-remark',
    SETTINGS: 'settings'
});

const SURFACE_CLASS_MAP = Object.freeze({
    [SURFACE_TYPES.COMMENT_COMPOSER]: 'has-composer-active',
    [SURFACE_TYPES.MARKER_SHEET]: 'has-sheet-open',
    [SURFACE_TYPES.INLINE_REMARK]: 'has-inline-remark-open',
    [SURFACE_TYPES.SETTINGS]: 'tm-settings-active'
});

export class UISurfaceMachine {
    constructor(uiManager = null) {
        this.uiManager = uiManager;
        this.activeSurface = SURFACE_TYPES.NONE;
        this._surfaceClosers = new Map();
        this._modalStack = [];
        this._keyDownHandler = this._handleGlobalKeyDown.bind(this);
        this._initialized = false;

        // 系统级焦点转移锁与输入交互时间戳 (Focus Staging Machine)
        this.isFocusLocked = false;
        this._focusLockTimer = null;
        this._lastInputInteractionTime = 0;
        this._eventSinkEl = null;

        this._handleContainerCaptureTouch = this._handleContainerCaptureTouch.bind(this);
        this._handleFocusIn = this._handleFocusIn.bind(this);
        this._handleFocusOut = this._handleFocusOut.bind(this);
    }

    init() {
        if (this._initialized || typeof document === 'undefined') return;
        this._initialized = true;
        document.addEventListener('keydown', this._keyDownHandler, true);

        // 系统级挂载全局事件黑洞与手势阻断壁垒
        const container = this.playerContainer;
        if (container) {
            container.addEventListener('touchstart', this._handleContainerCaptureTouch, true);
            container.addEventListener('pointerdown', this._handleContainerCaptureTouch, true);
            container.addEventListener('contextmenu', this._handleContainerCaptureTouch, true);
            container.addEventListener('focusin', this._handleFocusIn, true);
            container.addEventListener('focusout', this._handleFocusOut, true);
            this._ensureEventSink();
        }
    }

    get playerContainer() {
        return (
            this.uiManager?.playerContainer ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container') ||
            document.querySelector('.tm-player-container')
        );
    }

    /**
     * 判定当前 Shadow DOM 或宿主环境中是否有可编辑输入框处于活动状态
     * @returns {HTMLElement|null}
     */
    getActiveEditableElement() {
        const root = this.playerContainer?.getRootNode?.() || document;
        const active = (root && root.activeElement) ? root.activeElement : document.activeElement;
        if (!active) return null;
        const tag = active.tagName?.toLowerCase();
        return (tag === 'input' || tag === 'textarea' || Boolean(active.isContentEditable)) ? active : null;
    }

    /**
     * 申请系统级焦点转移锁定 (进入防抖保护态，锁死键盘高度与面板物理坐标)
     */
    acquireFocusLock() {
        this.isFocusLocked = true;
        this._lastInputInteractionTime = Date.now();
        if (this._focusLockTimer) {
            clearTimeout(this._focusLockTimer);
            this._focusLockTimer = null;
        }
    }

    /**
     * 释放系统级焦点转移锁定 (等待 350ms 焦点交接缓冲窗口)
     * @param {number} [delay=350]
     */
    releaseFocusLock(delay = 350) {
        if (this._focusLockTimer) {
            clearTimeout(this._focusLockTimer);
        }
        this._focusLockTimer = setTimeout(() => {
            this._focusLockTimer = null;
            const active = this.getActiveEditableElement();
            if (!active) {
                this.isFocusLocked = false;
                if (this.uiManager && typeof this.uiManager.collapseKeyboardLayout === 'function') {
                    this.uiManager.collapseKeyboardLayout();
                }
            }
        }, delay);
    }

    _handleContainerCaptureTouch(e) {
        if (!this.hasAnySurfaceOpen()) return;

        const target = e.target;
        const tag = target?.tagName?.toLowerCase();
        const isEditable = tag === 'input' || tag === 'textarea' || Boolean(target?.isContentEditable);
        if (isEditable) {
            this.acquireFocusLock();
        }

        // 核心：当浮层处于激活态时，阻断所有 Touch / Pointer / ContextMenu 事件穿透 Shadow DOM 边界冒泡至宿主 window！
        // 彻底杜绝 Stay App 或宿主页面的全局长按监听器感知到触摸手势！
        e.stopPropagation();

        // 针对非输入框的 contextmenu 直接阻断，防止原生系统菜单或外挂触发
        if (!isEditable && e.type === 'contextmenu') {
            e.preventDefault();
        }
    }

    _handleFocusIn(e) {
        const target = e.target;
        const tag = target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || Boolean(target?.isContentEditable)) {
            this.acquireFocusLock();
        }
    }

    _handleFocusOut() {
        // 当输入框失焦时，绝不立即收起布局，给予 350ms 焦点交接缓冲窗口 (Focus Transition Window)
        this.releaseFocusLock(350);
    }

    /**
     * 确保系统级全局事件黑洞网 (Event Sink Backdrop) 存在并挂载
     */
    _ensureEventSink() {
        const container = this.playerContainer;
        if (!container) return null;
        let sink = container.querySelector('.tm-surface-event-sink');
        if (!sink) {
            sink = document.createElement('div');
            sink.className = 'tm-surface-event-sink';

            // 系统级黑洞吞噬：捕获阶段拦截并吞噬所有不需要的手势与长按穿透
            const swallow = (e) => {
                e.stopPropagation();
                if (e.cancelable && e.type !== 'click') {
                    e.preventDefault();
                }
            };

            const events = [
                'touchstart', 'touchmove', 'touchend', 'touchcancel',
                'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
                'mousedown', 'mousemove', 'mouseup',
                'contextmenu', 'gesturestart', 'gesturechange', 'gestureend'
            ];
            events.forEach(evt => {
                sink.addEventListener(evt, swallow, true);
            });

            sink.addEventListener('click', (e) => {
                e.stopPropagation();
                if (Date.now() - (this._lastInputInteractionTime || 0) < 350) return;
                this.dismissTopmost();
            }, true);

            const firstPanel = container.querySelector('.tm-settings-panel, .tm-bottom-sheet-panel, .tm-comment-submit-bar-wrapper, .tm-custom-modal-overlay');
            if (firstPanel) {
                container.insertBefore(sink, firstPanel);
            } else {
                container.appendChild(sink);
            }
        }
        this._eventSinkEl = sink;
        return sink;
    }

    /**
     * 激活指定互斥浮层，自动关闭此前处于打开状态的其他互斥浮层
     * @param {string} surfaceId - SURFACE_TYPES 枚举值
     * @param {Function} [closeFn] - 该浮层的关闭回调
     */
    activate(surfaceId, closeFn = null) {
        if (!surfaceId || surfaceId === SURFACE_TYPES.NONE) return;

        if (typeof closeFn === 'function') {
            this._surfaceClosers.set(surfaceId, closeFn);
        }

        // 若当前已有其他互斥浮层处于激活态，先干净关闭旧浮层
        if (this.activeSurface !== SURFACE_TYPES.NONE && this.activeSurface !== surfaceId) {
            const prevSurface = this.activeSurface;
            const prevCloser = this._surfaceClosers.get(prevSurface);
            this.activeSurface = surfaceId;
            this._syncContainerState();
            if (typeof prevCloser === 'function') {
                try {
                    prevCloser();
                } catch (_) {}
            }
        } else {
            this.activeSurface = surfaceId;
        }

        this._syncContainerState();
    }

    /**
     * 判断当前是否有任何互斥浮层或弹窗处于打开状态
     * @returns {boolean}
     */
    hasAnySurfaceOpen() {
        return this.activeSurface !== SURFACE_TYPES.NONE || (Array.isArray(this._modalStack) && this._modalStack.length > 0);
    }

    /**
     * 停用指定浮层并同步容器状态
     * @param {string} surfaceId
     */
    deactivate(surfaceId) {
        if (this.activeSurface === surfaceId) {
            this.activeSurface = SURFACE_TYPES.NONE;
        }
        this._syncContainerState();
    }

    /**
     * 关闭当前激活的互斥浮层
     */
    closeActiveSurface() {
        if (this.activeSurface === SURFACE_TYPES.NONE) return false;
        const current = this.activeSurface;
        const closer = this._surfaceClosers.get(current);
        this.activeSurface = SURFACE_TYPES.NONE;
        this._syncContainerState();
        if (typeof closer === 'function') {
            try {
                closer();
            } catch (_) {}
        }
        return true;
    }

    /**
     * 顶层模态框入栈 (createModal)
     * @param {HTMLElement} modalEl
     * @param {Function} closeFn
     */
    pushModal(modalEl, closeFn) {
        this._modalStack = this._modalStack.filter(item => item.modalEl !== modalEl);
        this._modalStack.push({ modalEl, closeFn });
        this._syncContainerState();
    }

    /**
     * 顶层模态框出栈
     * @param {HTMLElement} modalEl
     */
    popModal(modalEl) {
        this._modalStack = this._modalStack.filter(item => item.modalEl !== modalEl);
        this._syncContainerState();
    }

    /**
     * 按 LIFO 顺序关闭最顶层弹窗或浮层 (用于 Escape 键或手势返回)
     * @returns {boolean} 是否消费了关闭动作
     */
    dismissTopmost() {
        // 1. 优先关闭最顶层 Modal
        while (this._modalStack.length > 0) {
            const top = this._modalStack.pop();
            if (top && top.modalEl && top.modalEl.isConnected) {
                if (typeof top.closeFn === 'function') {
                    top.closeFn();
                    return true;
                }
            }
        }

        // 2. 若评论发表栏内的高光选择子抽屉打开，先收起子抽屉
        if (this.activeSurface === SURFACE_TYPES.COMMENT_COMPOSER) {
            const composer = this.uiManager?.controlManager?.commentPanel?.composer;
            if (composer?.tagSelectModal?.classList?.contains('visible')) {
                composer.closeTagSelectModal();
                return true;
            }
        }

        // 3. 关闭当前互斥浮层
        if (this.activeSurface !== SURFACE_TYPES.NONE) {
            return this.closeActiveSurface();
        }

        return false;
    }

    _handleGlobalKeyDown(e) {
        if (e.key !== 'Escape') return;
        if (!document.body?.classList.contains('tm-player-active')) return;
        if (this._modalStack.length > 0 || this.activeSurface !== SURFACE_TYPES.NONE) {
            e.preventDefault();
            e.stopPropagation();
            this.dismissTopmost();
        }
    }

    _syncContainerState() {
        const container = this.playerContainer;
        const hasAny = this.hasAnySurfaceOpen();
        if (container) {
            container.dataset.activeSurface = this.activeSurface;
            container.dataset.hasOverlay = hasAny ? 'true' : 'false';
            for (const [surface, cls] of Object.entries(SURFACE_CLASS_MAP)) {
                container.classList.toggle(cls, this.activeSurface === surface);
            }
            container.classList.toggle('has-modal-open', this._modalStack.length > 0);
            container.classList.toggle('has-any-surface-open', hasAny);

            const sink = this._ensureEventSink();
            if (sink) {
                sink.classList.toggle('visible', hasAny);
            }
        }
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.toggle('tm-settings-active', this.activeSurface === SURFACE_TYPES.SETTINGS);
        }
        if (!hasAny) {
            this.isFocusLocked = false;
            if (this._focusLockTimer) {
                clearTimeout(this._focusLockTimer);
                this._focusLockTimer = null;
            }
        }
        if (this.uiManager && typeof this.uiManager.updatePortraitVideoHeight === 'function') {
            this.uiManager.updatePortraitVideoHeight();
        }
    }

    cleanup() {
        if (typeof document !== 'undefined') {
            document.removeEventListener('keydown', this._keyDownHandler, true);
            document.body?.classList.remove('tm-settings-active');
        }
        const container = this.playerContainer;
        if (container) {
            container.removeEventListener('touchstart', this._handleContainerCaptureTouch, true);
            container.removeEventListener('pointerdown', this._handleContainerCaptureTouch, true);
            container.removeEventListener('contextmenu', this._handleContainerCaptureTouch, true);
            container.removeEventListener('focusin', this._handleFocusIn, true);
            container.removeEventListener('focusout', this._handleFocusOut, true);
        }
        if (this._focusLockTimer) {
            clearTimeout(this._focusLockTimer);
            this._focusLockTimer = null;
        }
        this.isFocusLocked = false;
        this._modalStack = [];
        this._surfaceClosers.clear();
        this.activeSurface = SURFACE_TYPES.NONE;
        this._initialized = false;
    }
}

/**
 * 绑定保持输入框焦点的辅助按钮（防止 iOS Safari 点击按钮时触发 input blur 导致虚拟键盘闪退收起）
 * @param {HTMLElement} btn - 按钮或可点击元素
 * @param {Function} handler - 点击执行逻辑 (e) => void
 * @param {Function} getInputFn - 返回当前应保持焦点的输入框元素 () => HTMLInputElement|null
 * @param {Object} [options]
 * @param {boolean} [options.alwaysFocus=false] - 若为 true，即使按压前未聚焦也强制聚焦输入框；若为 false，仅在按压前已聚焦时恢复焦点
 * @param {Function} [options.onTouchTimestamp] - 记录触控时间戳的回调
 */
export function bindKeepFocusAction(btn, handler, getInputFn, options = {}) {
    if (!btn || typeof handler !== 'function') return;
    const { alwaysFocus = false, onTouchTimestamp = null } = options;
    let lastTouchExecTime = 0;
    let focusedInputBeforePress = null;

    const captureFocusState = () => {
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        const candidate = typeof getInputFn === 'function' ? getInputFn() : null;
        if (!candidate) {
            focusedInputBeforePress = null;
            return;
        }
        if (alwaysFocus) {
            focusedInputBeforePress = candidate;
            return;
        }
        const root = candidate.getRootNode?.();
        const active = (root && root.activeElement) ? root.activeElement : document.activeElement;
        focusedInputBeforePress = (active === candidate) ? candidate : null;
    };

    const restoreFocusIfNeeded = () => {
        const target = focusedInputBeforePress || (alwaysFocus && typeof getInputFn === 'function' ? getInputFn() : null);
        if (target && typeof target.focus === 'function') {
            try {
                target.focus({ preventScroll: true });
            } catch (_) {
                target.focus();
            }
        }
    };

    btn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        captureFocusState();
        if (e.cancelable) e.preventDefault();
    });

    btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        captureFocusState();
        if (e.pointerType === 'mouse' && e.cancelable) {
            e.preventDefault();
        }
    });

    btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        captureFocusState();
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        if (e.cancelable) e.preventDefault();
        lastTouchExecTime = Date.now();
        handler(e);
        restoreFocusIfNeeded();
    }, { passive: false });

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        if (Date.now() - lastTouchExecTime < 450) return;
        handler(e);
        restoreFocusIfNeeded();
    });
}

/**
 * 绑定底部浮层内的提交/关闭按钮（防止 iOS Safari 在 touchstart 阶段提前触发 input blur 导致底栏瞬间下沉 336px 丢失点击）
 * @param {HTMLElement} btn
 * @param {Function} handler
 * @param {Function} [onTouchTimestamp]
 */
export function bindActionWithoutBlurShift(btn, handler, onTouchTimestamp = null) {
    if (!btn || typeof handler !== 'function') return;
    let lastTouchExecTime = 0;

    btn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        if (e.cancelable) e.preventDefault();
    });

    btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        if (e.cancelable) e.preventDefault();
        lastTouchExecTime = Date.now();
        handler(e);
    }, { passive: false });

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof onTouchTimestamp === 'function') onTouchTimestamp(Date.now());
        if (Date.now() - lastTouchExecTime < 450) return;
        handler(e);
    });
}
