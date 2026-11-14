import { S2PlaybackSection } from './sections/S2PlaybackSection.js';
import { S2CommentsSection } from './sections/S2CommentsSection.js';
import { S2ConnectionsSection } from './sections/S2ConnectionsSection.js';
import { S2AdvancedSection } from './sections/S2AdvancedSection.js';
import { SURFACE_TYPES } from '../../state/UISurfaceMachine.js';
import { ICON_X_CLOSE } from '../../../constants/icons.js';
import { __ } from '../../../constants/i18n.js';

/**
 * SettingsV2Manager — 新版统一 Apple HIG 设置面板管理器
 * 与旧版 SettingsManager 共享底层设置状态与回调，界面与入口完全独立并存，等待用户验证认可。
 */
export class SettingsV2Manager {
    constructor(playerCore, settingsManager) {
        this.playerCore = playerCore;
        this.sm = settingsManager;
        this.panel = null;
        this.scrollBody = null;
        this.isVisible = false;
        this.overlayClickHandler = null;
        this._sections = null;
        this._gestureCleanup = null;
    }

    setPanel(panelEl) {
        this.panel = panelEl;
        this._bindHeaderDismissGesture();
    }

    render() {
        if (!this.panel || !this.sm) return;

        const prevScrollTop = this.scrollBody ? this.scrollBody.scrollTop : 0;
        this.panel.innerHTML = '';

        // 1. 吸顶 Header
        const header = document.createElement('div');
        header.className = 'mp-s2-header';

        const grabber = document.createElement('div');
        grabber.className = 'mp-s2-grabber';
        header.appendChild(grabber);

        const bar = document.createElement('div');
        bar.className = 'mp-s2-header-bar';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'mp-s2-title-wrap';

        const titleEl = document.createElement('span');
        titleEl.className = 'mp-s2-title';
        titleEl.textContent = __('settings') || '设置';

        const badge = document.createElement('span');
        badge.className = 'mp-s2-pill mp-s2-pill--info';
        badge.textContent = __('s2NewBadge') || '新版';

        titleWrap.appendChild(titleEl);
        titleWrap.appendChild(badge);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'mp-s2-close';
        closeBtn.setAttribute('aria-label', __('close') || '关闭');
        closeBtn.innerHTML = ICON_X_CLOSE;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        bar.appendChild(titleWrap);
        bar.appendChild(closeBtn);
        header.appendChild(bar);
        this.panel.appendChild(header);

        // 2. 滚动主体 (4大分组，平级清晰层级)
        const scrollBody = document.createElement('div');
        scrollBody.className = 'mp-s2-scroll';
        this.scrollBody = scrollBody;

        const playbackSec = new S2PlaybackSection(this.sm);
        const commentsSec = new S2CommentsSection(this.sm);
        const connectionsSec = new S2ConnectionsSection(this.sm);
        const advancedSec = new S2AdvancedSection(this.sm);

        this._sections = { playbackSec, commentsSec, connectionsSec, advancedSec };

        scrollBody.appendChild(playbackSec.getElement());
        scrollBody.appendChild(commentsSec.getElement());
        scrollBody.appendChild(connectionsSec.getElement());
        scrollBody.appendChild(advancedSec.getElement());
        this.panel.appendChild(scrollBody);

        // 3. 移动端底部完成栏
        const footer = document.createElement('div');
        footer.className = 'mp-s2-footer';

        const doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.className = 'mp-s2-done-btn';
        doneBtn.textContent = __('done') || '完成';
        doneBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });
        footer.appendChild(doneBtn);
        this.panel.appendChild(footer);

        if (prevScrollTop > 0) {
            scrollBody.scrollTop = prevScrollTop;
        }
    }

    refreshAdvancedSection() {
        if (this._sections?.advancedSec && this.isVisible) {
            this._sections.advancedSec.refresh();
        }
    }

    open() {
        if (!this.panel) return;
        this.sm.syncState();
        this.render();
        this.isVisible = true;
        this.panel.classList.add('is-open');

        const uiManager = this.sm.uiManager || this.playerCore?.uiManager;
        const surfaceMachine = uiManager?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.activate(SURFACE_TYPES.SETTINGS_V2, () => this.close());
        } else if (uiManager?.playerContainer) {
            uiManager.playerContainer.classList.add('tm-settings-v2-active');
        }

        if (this.overlayClickHandler) {
            document.removeEventListener('click', this.overlayClickHandler, true);
        }

        this.overlayClickHandler = (e) => {
            if (!this.isVisible || !this.panel) return;
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const inPanel = path.includes(this.panel) || this.panel.contains(e.target);
            const btn = uiManager?.settingsV2Btn;
            const oldBtn = uiManager?.settingsBtn;
            const inBtn = (btn && (path.includes(btn) || btn.contains(e.target))) ||
                          (oldBtn && (path.includes(oldBtn) || oldBtn.contains(e.target)));
            if (!inPanel && !inBtn) {
                this.close();
            }
        };

        setTimeout(() => {
            if (this.isVisible) {
                document.addEventListener('click', this.overlayClickHandler, true);
            }
        }, 0);
    }

    close() {
        if (!this.isVisible && !this.panel?.classList.contains('is-open')) return;
        this.isVisible = false;
        if (this.panel) {
            this.panel.classList.remove('is-open', 'is-dragging');
            this.panel.style.transform = '';
        }

        const uiManager = this.sm?.uiManager || this.playerCore?.uiManager;
        const surfaceMachine = uiManager?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.deactivate(SURFACE_TYPES.SETTINGS_V2);
        } else if (uiManager?.playerContainer) {
            uiManager.playerContainer.classList.remove('tm-settings-v2-active');
        }

        if (this.overlayClickHandler) {
            document.removeEventListener('click', this.overlayClickHandler, true);
            this.overlayClickHandler = null;
        }
    }

    toggle() {
        if (this.isVisible) {
            this.close();
        } else {
            this.open();
        }
    }

    _bindHeaderDismissGesture() {
        if (!this.panel) return;
        if (this._gestureCleanup) {
            this._gestureCleanup();
            this._gestureCleanup = null;
        }

        let startY = 0;
        let currentDeltaY = 0;
        let isDragging = false;

        const onTouchStart = (e) => {
            if (!this.isVisible || window.innerWidth > 767) return;
            const headerEl = e.target.closest('.mp-s2-header');
            const atScrollTop = this.scrollBody && this.scrollBody.scrollTop <= 1;
            if (!headerEl && !atScrollTop) return;
            startY = e.touches[0].clientY;
            currentDeltaY = 0;
            isDragging = true;
        };

        const onTouchMove = (e) => {
            if (!isDragging || !this.panel) return;
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 0) {
                currentDeltaY = deltaY;
                this.panel.classList.add('is-dragging');
                this.panel.style.transform = `translate3d(0, ${deltaY}px, 0)`;
                if (deltaY > 12 && e.cancelable) {
                    e.preventDefault();
                }
            } else {
                currentDeltaY = 0;
                this.panel.style.transform = '';
            }
        };

        const onTouchEnd = () => {
            if (!isDragging || !this.panel) return;
            isDragging = false;
            this.panel.classList.remove('is-dragging');
            if (currentDeltaY > 95) {
                this.panel.style.transform = '';
                this.close();
            } else {
                this.panel.style.transform = '';
            }
            currentDeltaY = 0;
        };

        this.panel.addEventListener('touchstart', onTouchStart, { passive: true });
        this.panel.addEventListener('touchmove', onTouchMove, { passive: false });
        this.panel.addEventListener('touchend', onTouchEnd, { passive: true });
        this.panel.addEventListener('touchcancel', onTouchEnd, { passive: true });

        this._gestureCleanup = () => {
            this.panel.removeEventListener('touchstart', onTouchStart);
            this.panel.removeEventListener('touchmove', onTouchMove);
            this.panel.removeEventListener('touchend', onTouchEnd);
            this.panel.removeEventListener('touchcancel', onTouchEnd);
        };
    }

    cleanup() {
        this.close();
        if (this._gestureCleanup) {
            this._gestureCleanup();
            this._gestureCleanup = null;
        }
        this._sections = null;
        this.panel = null;
        this.scrollBody = null;
    }
}
