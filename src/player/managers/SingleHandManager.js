import { DOCK_SWITCH_LEFT, DOCK_SWITCH_RIGHT, EXPAND_FULL } from '../../constants/icons.js';
import { __ } from '../../constants/i18n.js';
import { Toast, playTapSound } from '../../utils/index.js';

/**
 * SingleHandManager - 竖屏单手操控模式管理器
 * 
 * 严格遵从输入法单手模式人机工程与 Apple 极简美学：
 * 1. 负责大屏竖屏下控制面板的单手收拢、左右手镜像与全宽还原
 * 2. 侧边辅助立柱 (Utility Gutter)：上部“还原”按键 + 下部“切换左右”超大触控靶心按钮
 * 3. 动态高度同步 (ResizeObserver) 确保立柱与主控制面板严丝合缝
 * 4. 手势交互：在 tm-seek-control-row 区域向左或向右滑动开启左手/右手模式
 * 5. 遵从 Beta 实验室开关治理，Default OFF，安全无副作用
 */
export class SingleHandManager {
    constructor(playerCore, controlManager, uiManager = null) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.uiManager = uiManager;
        this.playerState = playerCore?.options?.playerState;

        // 运行时状态
        this.isCollapsed = false; // 是否处于全宽状态 (true: 全宽隐藏立柱, false: 单手立柱激活)
        this.gutterElement = null;
        this.btnRestore = null;
        this.btnSwitchHand = null;
        this.switchIconContainer = null;
        this.restoreIconContainer = null;

        // 手势相关状态
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._isSwipeTracking = false;
        this._isFromCapsuleScroll = false;
        this._pointerStartX = 0;
        this._pointerStartY = 0;
        this._isPointerTracking = false;
        this._preventClickUntil = 0;

        this._resizeHandler = null;
        this._ro = null;
        this._swipeHost = null;
        this._swipeTouchStartHandler = null;
        this._swipeTouchMoveHandler = null;
        this._swipeTouchEndHandler = null;
        this._swipePointerDownHandler = null;
        this._swipePointerUpHandler = null;
        this._swipeClickHandler = null;
    }

    setUiManager(uiManager) {
        this.uiManager = uiManager;
    }

    get isBetaEnabled() {
        const state = this.playerState || this.playerCore?.options?.playerState;
        return Boolean(state?.settings?.betaMode && state?.settings?.betaSingleHandMode);
    }

    get handPosition() {
        const state = this.playerState || this.playerCore?.options?.playerState;
        return state?.settings?.singleHandPosition || 'right';
    }

    set handPosition(pos) {
        const state = this.playerState || this.playerCore?.options?.playerState;
        if (state) {
            state.updateSetting('singleHandPosition', pos);
        }
    }

    init() {
        this.createGutter();
        this._bindEvents();
        this.updateState();
    }

    createGutter() {
        if (this.gutterElement) return;

        this.gutterElement = document.createElement('div');
        this.gutterElement.className = 'tm-single-hand-gutter';

        // 1. 上部：“还原”全宽按钮
        this.btnRestore = document.createElement('button');
        this.btnRestore.type = 'button';
        this.btnRestore.className = 'tm-gutter-btn-top';
        this.btnRestore.title = __('expandFullWidth');

        this.restoreIconContainer = document.createElement('div');
        this.restoreIconContainer.className = 'tm-gutter-icon-wrap';
        this.restoreIconContainer.innerHTML = EXPAND_FULL;
        this.btnRestore.appendChild(this.restoreIconContainer);

        this.btnRestore.addEventListener('click', (e) => {
            e.stopPropagation();
            playTapSound();
            this.isCollapsed = true;
            this.updateState();
            Toast(__('restoredFullWidth') || '已还原为全宽模式', 1200, 'info');
        });

        // 2. 下部：“切换左右”超大触控靶心按钮
        this.btnSwitchHand = document.createElement('button');
        this.btnSwitchHand.type = 'button';
        this.btnSwitchHand.className = 'tm-gutter-btn-bottom';
        this.btnSwitchHand.title = __('switchHandLeft');

        this.switchIconContainer = document.createElement('div');
        this.switchIconContainer.className = 'tm-gutter-switch-icon-wrap';
        this.switchIconContainer.innerHTML = this.handPosition === 'right' ? DOCK_SWITCH_LEFT : DOCK_SWITCH_RIGHT;

        this.btnSwitchHand.appendChild(this.switchIconContainer);

        this.btnSwitchHand.addEventListener('click', (e) => {
            e.stopPropagation();
            playTapSound();
            const nextPos = this.handPosition === 'right' ? 'left' : 'right';
            this.handPosition = nextPos;
            this.updateState();
            Toast(nextPos === 'right' ? __('switchedToRightHand') : __('switchedToLeftHand'), 1200, 'info');
        });

        this.gutterElement.appendChild(this.btnRestore);
        this.gutterElement.appendChild(this.btnSwitchHand);

        const parentPanel = this.controlManager?.controlPanel;
        const container = this.uiManager?.playerContainer;
        if (parentPanel) {
            parentPanel.appendChild(this.gutterElement);
        } else if (container) {
            container.appendChild(this.gutterElement);
        }
    }

    _bindEvents() {
        this._resizeHandler = () => {
            this.updateState();
        };
        window.addEventListener('resize', this._resizeHandler, { passive: true });
        window.addEventListener('orientationchange', this._resizeHandler, { passive: true });

        // 使用 ResizeObserver 同步立柱高度与主控制栏完全一致
        if (typeof ResizeObserver !== 'undefined') {
            this._ro = new ResizeObserver(() => {
                this._syncHeight();
            });
            const ctrlBar = this.controlManager?.controlButtonsContainer;
            if (ctrlBar) {
                this._ro.observe(ctrlBar);
            }
        }

        // 绑定 tm-seek-control-row 区域的向左/向右滑动手势
        this._bindSwipeGesture();
    }

    /**
     * 绑定快进/快退行 (tm-seek-control-row) 滑动手势
     * 向左滑动开启左手单手模式，向右滑动开启右手单手模式
     */
    _bindSwipeGesture() {
        const hostEl = this.controlManager?.controlButtonsContainer || this.uiManager?.playerContainer;
        if (!hostEl) return;
        this._swipeHost = hostEl;

        // 1. Touch 触控事件 (移动端核心)
        this._swipeTouchStartHandler = (e) => {
            if (!this.isPortrait()) return;
            const target = e.target;
            // 排除拖动进度条滑块的情况
            if (target?.closest?.('.tm-progress-bar-container, .tm-slider-handle')) {
                this._isSwipeTracking = false;
                return;
            }
            if (!target?.closest?.('.tm-control-buttons, .tm-control-panel, .tm-seek-control-row')) {
                this._isSwipeTracking = false;
                return;
            }
            const touch = e.touches[0];
            if (!touch) return;
            this._touchStartX = touch.clientX;
            this._touchStartY = touch.clientY;
            this._isSwipeTracking = true;
            // 记录触摸是否源自高光胶囊横向滚动区 (保留胶囊原生横向滚动，坚决不被左右手切换干扰)
            this._isFromCapsuleScroll = Boolean(target?.closest?.('.tm-tab-scroll-container'));
        };

        this._swipeTouchMoveHandler = (e) => {
            if (!this._isSwipeTracking) return;
            const touch = e.touches[0];
            if (!touch) return;
            const dx = touch.clientX - this._touchStartX;
            const dy = touch.clientY - this._touchStartY;

            // 核心保护：若触摸源自胶囊横向滚动区，水平滑动必须完全放行给浏览器原生滚动，绝不阻止默认行为
            if (this._isFromCapsuleScroll) {
                if (Math.abs(dx) >= Math.abs(dy)) {
                    return;
                }
                // 仅在明确向下轻扫时才拦截原生纵向滚动
                if (dy > 15 && dy > Math.abs(dx) * 1.5 && e.cancelable) {
                    e.preventDefault();
                }
                return;
            }

            // 在控制面板其他非胶囊滚动区：水平滑移主导或明显的向下手势时阻止原生滚动，保持纯净手势交互
            if ((Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) || (dy > 10 && dy > Math.abs(dx))) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        };

        this._swipeTouchEndHandler = (e) => {
            if (!this._isSwipeTracking) return;
            this._isSwipeTracking = false;
            const touch = e.changedTouches[0];
            if (!touch) return;
            const dx = touch.clientX - this._touchStartX;
            const dy = touch.clientY - this._touchStartY;
            this._triggerSwipeAction(dx, dy);
        };

        // 2. Pointer 事件 (支持桌面 DevTools 触控模拟与鼠标拖动测试)
        this._swipePointerDownHandler = (e) => {
            if (e.pointerType === 'touch') return;
            if (!this.isPortrait()) return;
            if (e.button !== 0) return;
            if (e.target?.closest?.('.tm-progress-bar-container, .tm-slider-handle')) return;
            if (!e.target?.closest?.('.tm-control-buttons, .tm-control-panel, .tm-seek-control-row')) return;
            this._pointerStartX = e.clientX;
            this._pointerStartY = e.clientY;
            this._isPointerTracking = true;
            this._isFromCapsuleScroll = Boolean(e.target?.closest?.('.tm-tab-scroll-container'));
        };

        this._swipePointerUpHandler = (e) => {
            if (!this._isPointerTracking) return;
            this._isPointerTracking = false;
            const dx = e.clientX - this._pointerStartX;
            const dy = e.clientY - this._pointerStartY;
            this._triggerSwipeAction(dx, dy);
        };

        // 3. Click 捕获拦截 (滑动触发后防误触快退/快进时间步进按钮)
        this._swipeClickHandler = (e) => {
            if (Date.now() < this._preventClickUntil) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        };

        hostEl.addEventListener('touchstart', this._swipeTouchStartHandler, { passive: false });
        hostEl.addEventListener('touchmove', this._swipeTouchMoveHandler, { passive: false });
        hostEl.addEventListener('touchend', this._swipeTouchEndHandler, { passive: true });
        hostEl.addEventListener('pointerdown', this._swipePointerDownHandler, { passive: true });
        hostEl.addEventListener('pointerup', this._swipePointerUpHandler, { passive: true });
        hostEl.addEventListener('click', this._swipeClickHandler, true);
    }

    _triggerSwipeAction(dx, dy) {
        const minDistance = 35; // 触发手势的最小位移阈值

        // 1. 下滑手势：在控制面板上向下滑动，快速收起/隐藏控制面板
        if (dy >= minDistance && dy > Math.abs(dx) * 1.2) {
            this._preventClickUntil = Date.now() + 350;
            if (window.navigator?.vibrate) {
                window.navigator.vibrate(5);
            }
            const uiManager = this.uiManager || this.playerCore?.uiManager;
            if (uiManager) {
                uiManager.hideControls(true);
            }
            return;
        }

        // 核心保护：若手势源自胶囊横向滚动区，绝对不触发左右手模式切换，保证胶囊横向浏览 100% 顺畅自由
        if (this._isFromCapsuleScroll) {
            return;
        }

        // 2. 左右滑动手势：在开启 Beta 单手模式时，向左/向右滑动切换左手/右手布局 (仅在非胶囊滚动区触发)
        if (this.isBetaEnabled && Math.abs(dx) >= minDistance && Math.abs(dx) > Math.abs(dy) * 1.2) {
            this._preventClickUntil = Date.now() + 350;
            playTapSound();

            // 限制更窄的屏幕 (如 <380px 的旧机型/SE/mini) 不支持开启单手模式
            if (!this.isSupportedScreenWidth()) {
                Toast(__('screenTooNarrowForSingleHand') || '屏幕较窄，无需开启单手模式', 1500, 'info');
                return;
            }

            if (dx < 0) {
                // 向左滑动 -> 开启左手单手模式
                this.handPosition = 'left';
                this.isCollapsed = false;
                this.updateState();
                Toast(__('switchedToLeftHand') || '已切换至左手模式', 1200, 'info');
            } else {
                // 向右滑动 -> 开启右手单手模式
                this.handPosition = 'right';
                this.isCollapsed = false;
                this.updateState();
                Toast(__('switchedToRightHand') || '已切换至右手模式', 1200, 'info');
            }
        }
    }

    /**
     * 判断当前屏幕宽度是否支持单手模式
     * 限制更窄的屏幕 (如 <380px 的 iPhone SE、mini 及老旧窄屏设备) 不支持开启单手模式；
     * 限制中大屏平板及桌面视口 (>600px，如 600~942px iPad 竖屏) 坚决不开启单手模式；
     * 仅支持 380px ~ 600px 的标准手机及大屏竖屏手机。
     */
    isSupportedScreenWidth() {
        const width = window.innerWidth || document.documentElement?.clientWidth || 0;
        return width >= 380 && width <= 600;
    }

    _syncHeight() {
        if (!this.gutterElement) return;
        if (this.isCollapsed) {
            this.gutterElement.style.height = '';
            return;
        }
        const ctrlBar = this.controlManager?.controlButtonsContainer;
        if (ctrlBar && ctrlBar.offsetHeight > 0) {
            this.gutterElement.style.height = `${ctrlBar.offsetHeight}px`;
        }
    }

    isPortrait() {
        if (window.matchMedia && window.matchMedia('(orientation: portrait)').matches) {
            return true;
        }
        return window.innerHeight > window.innerWidth;
    }

    updateState() {
        const container = this.uiManager?.playerContainer;
        const parentPanel = this.controlManager?.controlPanel;
        if (!container) return;

        // 始终同步用户的握持手偏好类名 (供浮动按钮、控制按钮左右横向对齐调度)
        const pos = this.handPosition;
        const isLeft = pos === 'left';
        container.classList.toggle('tm-hand-left', isLeft);
        container.classList.toggle('tm-hand-right', !isLeft);

        const commentsPanel = this.controlManager?.commentPanel?.commentsPanel;
        if (commentsPanel) {
            commentsPanel.classList.toggle('tm-hand-left', isLeft);
            commentsPanel.classList.toggle('tm-hand-right', !isLeft);
        }

        // 若 DOM 尚未挂载，优先挂载至 tm-control-panel，兜底主容器
        if (this.gutterElement) {
            if (parentPanel && !parentPanel.contains(this.gutterElement)) {
                parentPanel.appendChild(this.gutterElement);
            } else if (!parentPanel && !container.contains(this.gutterElement)) {
                container.appendChild(this.gutterElement);
            }
        }

        const isPortrait = this.isPortrait();
        const supportedWidth = this.isSupportedScreenWidth();
        const active = this.isBetaEnabled && isPortrait && supportedWidth;

        if (!active || this.isCollapsed) {
            // 全宽模式或更窄屏幕：移除所有单手类名，彻底隐藏侧栏立柱，取消单独悬浮角标方案
            container.classList.remove('tm-single-hand-active', 'tm-single-hand-right', 'tm-single-hand-left', 'tm-single-hand-full');
            if (this.gutterElement) {
                this.gutterElement.style.display = 'none';
                this.gutterElement.style.height = '';
            }
            return;
        }

        container.classList.add('tm-single-hand-active');
        if (this.gutterElement) {
            this.gutterElement.style.display = 'flex';
        }

        // 单手模式激活中：完整两段式立柱
        container.classList.remove('tm-single-hand-full');
        if (this.btnSwitchHand) {
            this.btnSwitchHand.style.display = 'flex';
        }
        if (this.restoreIconContainer) {
            this.restoreIconContainer.innerHTML = EXPAND_FULL;
        }
        if (this.btnRestore) {
            this.btnRestore.title = __('expandFullWidth');
        }

        if (pos === 'left') {
            container.classList.remove('tm-single-hand-right');
            container.classList.add('tm-single-hand-left');
            if (this.switchIconContainer) {
                this.switchIconContainer.innerHTML = DOCK_SWITCH_RIGHT;
            }
            if (this.btnSwitchHand) {
                this.btnSwitchHand.title = __('switchHandRight');
            }
        } else {
            container.classList.remove('tm-single-hand-left');
            container.classList.add('tm-single-hand-right');
            if (this.switchIconContainer) {
                this.switchIconContainer.innerHTML = DOCK_SWITCH_LEFT;
            }
            if (this.btnSwitchHand) {
                this.btnSwitchHand.title = __('switchHandLeft');
            }
        }

        this._syncHeight();
    }

    destroy() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            window.removeEventListener('orientationchange', this._resizeHandler);
            this._resizeHandler = null;
        }
        if (this._ro) {
            this._ro.disconnect();
            this._ro = null;
        }
        if (this._swipeHost) {
            if (this._swipeTouchStartHandler) this._swipeHost.removeEventListener('touchstart', this._swipeTouchStartHandler);
            if (this._swipeTouchMoveHandler) this._swipeHost.removeEventListener('touchmove', this._swipeTouchMoveHandler);
            if (this._swipeTouchEndHandler) this._swipeHost.removeEventListener('touchend', this._swipeTouchEndHandler);
            if (this._swipePointerDownHandler) this._swipeHost.removeEventListener('pointerdown', this._swipePointerDownHandler);
            if (this._swipePointerUpHandler) this._swipeHost.removeEventListener('pointerup', this._swipePointerUpHandler);
            if (this._swipeClickHandler) this._swipeHost.removeEventListener('click', this._swipeClickHandler, true);
            this._swipeHost = null;
        }
        if (this.gutterElement && this.gutterElement.parentNode) {
            this.gutterElement.parentNode.removeChild(this.gutterElement);
            this.gutterElement = null;
        }
    }
}

