/**
 * 视口软键盘与 Top Layer 挂载适配器 (ViewportKeyboardAdapter)
 * 职责：处理 iOS Safari / 移动端 visualViewport 虚拟键盘物理避让，以及 <dialog open> Top Layer 继承挂载
 */

import { ViewportDebugHUD } from './ViewportDebugHUD.js';

export function mountRootHostToTopLayer(rootHost) {
    if (!rootHost) return;
    const activeTopDialog = document.querySelector('dialog[open], [data-stage-host] dialog');
    if (activeTopDialog && activeTopDialog.isConnected) {
        activeTopDialog.appendChild(rootHost);
    } else {
        document.body.appendChild(rootHost);
    }
}

export class ViewportKeyboardAdapter {
    constructor(uiManager) {
        this.ui = uiManager;
        this._visualViewportListener = null;
        this._focusInListener = null;
        this._keyboardCloseTimer = null;
        this._collapseFn = null;
    }

    attach() {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const ui = this.ui;
        const isInputFocused = () => {
            const shadowActive = ui.shadowRoot?.activeElement;
            const docActive = document.activeElement;
            const active = shadowActive || docActive;
            if (!active) return false;
            const tag = active.tagName?.toLowerCase();
            return tag === 'input' || tag === 'textarea' || Boolean(active.isContentEditable);
        };

        this._visualViewportListener = () => {
            const vv = window.visualViewport;
            const playerContainer = ui.playerContainer || document.querySelector('.tm-player-container');
            const containerHeight = playerContainer ? playerContainer.getBoundingClientRect().height : (window.innerHeight || 0);
            const vvHeight = Math.round(vv.height || containerHeight);
            const vvOffsetTop = Math.max(0, Math.round(vv.offsetTop || 0));
            const keyboardHeight = Math.max(0, Math.round(containerHeight - vvHeight - vvOffsetTop));
            const commentSubmitBar = ui.shadowRoot?.querySelector('.tm-comment-submit-bar-wrapper') || document.querySelector('.tm-comment-submit-bar-wrapper');
            const hasSubmitBar = !!commentSubmitBar;
            const isCollapsed = commentSubmitBar ? commentSubmitBar.classList.contains('is-collapsed') : null;
            ViewportDebugHUD.recordEvent('UI_VV_UPDATE', `kbH=${keyboardHeight}, vvH=${vvHeight}, bar=${hasSubmitBar ? (isCollapsed ? 'col' : 'open') : 'none'}`);
            const activeModal = ui.shadowRoot?.querySelector('.tm-custom-modal-overlay') || document.querySelector('.tm-custom-modal-overlay');

            document.documentElement.style.setProperty('--visual-viewport-height', `${vvHeight}px`);
            if (playerContainer) {
                playerContainer.style.setProperty('--visual-viewport-height', `${vvHeight}px`);
            }
            if (ui.shadowRoot?.host) {
                ui.shadowRoot.host.style.setProperty('--visual-viewport-height', `${vvHeight}px`);
            }

            const inlinePopover = ui.shadowRoot?.querySelector('.tm-inline-remark-popover') || document.querySelector('.tm-inline-remark-popover');
            const wasKeyboardOpen = Boolean(playerContainer?.classList.contains('tm-ios-keyboard-open'));

            this._collapseFn = () => {
                this._keyboardCloseTimer = null;
                if (ui.surfaceMachine?.isFocusLocked || isInputFocused()) {
                    return;
                }

                document.documentElement.style.setProperty('--keyboard-height', '0px');
                if (playerContainer) {
                    playerContainer.classList.remove('tm-ios-keyboard-open');
                    playerContainer.style.removeProperty('--keyboard-height');
                    if (playerContainer.scrollTop !== 0 || playerContainer.scrollLeft !== 0) {
                        playerContainer.scrollTop = 0;
                        playerContainer.scrollLeft = 0;
                    }
                }
                if (document.body?.classList.contains('tm-player-active')) {
                    if (window.scrollY !== 0 || window.scrollX !== 0) {
                        window.scrollTo(0, 0);
                    }
                }
                if (ui.shadowRoot?.host) {
                    ui.shadowRoot.host.style.removeProperty('--keyboard-height');
                }
                if (commentSubmitBar) {
                    commentSubmitBar.style.bottom = '0px';
                    commentSubmitBar.style.transform = '';
                }
                const sheetPanel = ui.shadowRoot?.querySelector('.tm-bottom-sheet-panel');
                if (sheetPanel) {
                    sheetPanel.style.bottom = '0px';
                    sheetPanel.style.transform = '';
                }
                if (inlinePopover) {
                    inlinePopover.style.bottom = '';
                }
                if (activeModal && activeModal.style.transform) {
                    activeModal.style.transform = '';
                }
                if (wasKeyboardOpen) {
                    ui.updatePortraitVideoHeight();
                }
            };

            if (keyboardHeight > 60) {
                if (this._keyboardCloseTimer) {
                    clearTimeout(this._keyboardCloseTimer);
                    this._keyboardCloseTimer = null;
                }

                if (document.body?.classList.contains('tm-player-active')) {
                    if (window.scrollY !== 0 || window.scrollX !== 0) {
                        window.scrollTo(0, 0);
                    }
                }
                if (playerContainer && (playerContainer.scrollTop !== 0 || playerContainer.scrollLeft !== 0)) {
                    playerContainer.scrollTop = 0;
                    playerContainer.scrollLeft = 0;
                }
                ui.constructor.lastKnownKeyboardHeight = keyboardHeight;
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                if (playerContainer) {
                    playerContainer.classList.add('tm-ios-keyboard-open');
                    playerContainer.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                }
                if (ui.shadowRoot?.host) {
                    ui.shadowRoot.host.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                }
                // 直接由 JS 行内赋予真实物理 bottom 避让，彻底突破 WebKit 对 Shadow DOM 内 CSS 变量的忽略延迟
                if (commentSubmitBar && !commentSubmitBar.classList.contains('is-collapsed')) {
                    commentSubmitBar.style.bottom = `${keyboardHeight}px`;
                    commentSubmitBar.style.transform = '';
                }
                const sheetPanel = ui.shadowRoot?.querySelector('.tm-bottom-sheet-panel');
                if (sheetPanel && sheetPanel.classList.contains('visible')) {
                    sheetPanel.style.bottom = `${keyboardHeight}px`;
                    sheetPanel.style.transform = '';
                }
                if (inlinePopover && inlinePopover.classList.contains('visible')) {
                    inlinePopover.style.bottom = `${keyboardHeight + 12}px`;
                }
                if (activeModal && activeModal.style.transform) {
                    activeModal.style.transform = '';
                }
                if (!wasKeyboardOpen) {
                    ui.updatePortraitVideoHeight();
                }
            } else {
                if (ui.surfaceMachine?.isFocusLocked || isInputFocused()) {
                    return;
                }
                if (wasKeyboardOpen) {
                    if (this._keyboardCloseTimer) {
                        clearTimeout(this._keyboardCloseTimer);
                    }
                    this._keyboardCloseTimer = setTimeout(this._collapseFn, 300);
                } else {
                    this._collapseFn();
                }
            }
        };

        window.visualViewport.addEventListener('resize', this._visualViewportListener);
        window.visualViewport.addEventListener('scroll', this._visualViewportListener);

        if (!this._focusInListener && ui.shadowRoot) {
            this._focusInListener = () => {
                if (this._keyboardCloseTimer) {
                    clearTimeout(this._keyboardCloseTimer);
                    this._keyboardCloseTimer = null;
                }
            };
            ui.shadowRoot.addEventListener('focusin', this._focusInListener, true);
        }
    }

    detach() {
        if (this._keyboardCloseTimer) {
            clearTimeout(this._keyboardCloseTimer);
            this._keyboardCloseTimer = null;
        }
        if (this._visualViewportListener && typeof window !== 'undefined' && window.visualViewport) {
            window.visualViewport.removeEventListener('resize', this._visualViewportListener);
            window.visualViewport.removeEventListener('scroll', this._visualViewportListener);
            this._visualViewportListener = null;
        }
        if (this._focusInListener && this.ui?.shadowRoot) {
            this.ui.shadowRoot.removeEventListener('focusin', this._focusInListener, true);
            this._focusInListener = null;
        }
        this._collapseFn = null;
    }
}
