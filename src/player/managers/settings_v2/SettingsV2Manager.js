import { createGroup, createCard } from './components/S2Primitives.js';
import { S2PlaybackSection } from './sections/S2PlaybackSection.js';
import { S2CommentsSection } from './sections/S2CommentsSection.js';
import { S2ConnectionsSection } from './sections/S2ConnectionsSection.js';
import { S2AdvancedSection } from './sections/S2AdvancedSection.js';
import { SURFACE_TYPES, UISurfaceMachine } from '../../state/UISurfaceMachine.js';
import { BatchTestFloatModal } from '../../ui/BatchTestFloatModal.js';
import { LlmService } from '../../../services/LlmService.js';
import { ICON_X_CLOSE } from '../../../constants/icons.js';
import { __, I18n } from '../../../constants/i18n.js';
import { Toast } from '../../../utils/index.js';

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
        if (panelEl) {
            UISurfaceMachine.bindOverlayGuard(panelEl, { stopMove: true, stopWheel: true });
            if (LlmService.isAiDebugEnabled()) {
                setTimeout(() => {
                    if (this.panel && LlmService.isAiDebugEnabled()) {
                        BatchTestFloatModal.open({ settingsManager: this.sm, minimized: true });
                    }
                }, 0);
            }
        }
        this._bindHeaderDismissGesture();
    }

    render() {
        if (!this.panel || !this.sm) return;

        const prevScrollTop = this.scrollBody ? this.scrollBody.scrollTop : 0;
        this.panel.innerHTML = '';

        // 1. 紧凑吸顶 Header（无多余 grabber / 新版徽标）
        const header = document.createElement('div');
        header.className = 'mp-s2-header';

        const bar = document.createElement('div');
        bar.className = 'mp-s2-header-bar';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'mp-s2-title-wrap';

        const titleEl = document.createElement('span');
        titleEl.className = 'mp-s2-title';
        titleEl.textContent = __('settings') || '设置';

        titleWrap.appendChild(titleEl);

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

        scrollBody.appendChild(this._buildGlobalLangGroup());
        scrollBody.appendChild(playbackSec.getElement());
        scrollBody.appendChild(commentsSec.getElement());
        scrollBody.appendChild(connectionsSec.getElement());
        scrollBody.appendChild(advancedSec.getElement());
        this.panel.appendChild(scrollBody);

        if (prevScrollTop > 0) {
            scrollBody.scrollTop = prevScrollTop;
        }
    }

    _buildGlobalLangGroup() {
        const group = createGroup(__('globalLangTitle'));
        const card = createCard();
        const row = document.createElement('div');
        row.className = 'mp-s2-row mp-s2-row--stacked';

        const sub = document.createElement('div');
        sub.className = 'mp-s2-row-sub';
        sub.textContent = __('globalLangDesc');
        row.appendChild(sub);

        const chips = document.createElement('div');
        chips.className = 'mp-s2-chips';
        const cur = I18n.normalizeGlobalLang(this.sm?.settings?.globalLang || I18n.getGlobalLang());
        const opts = [
            { value: 'auto', label: __('globalLangAuto') },
            { value: 'zh-CN', label: '简体中文' },
            { value: 'zh-TW', label: '繁體中文' },
            { value: 'en', label: 'English' },
            { value: 'ja', label: '日本語' },
            { value: 'vi', label: 'Tiếng Việt' }
        ];
        opts.forEach((opt) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `mp-s2-chip ${cur === opt.value ? 'is-active' : ''}`.trim();
            btn.textContent = opt.label;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.sm.updateSetting('globalLang', opt.value);
                Toast(__('globalLangSaved'), 1500, 'info');
            });
            chips.appendChild(btn);
        });
        row.appendChild(chips);
        card.appendChild(row);
        group.appendChild(card);
        return group;
    }

    refreshAdvancedSection() {
        if (this._sections?.advancedSec && this.isVisible) {
            this._sections.advancedSec.refresh();
        }
    }

    refreshCrazyAvailability() {
        if (this._sections?.advancedSec) {
            this._sections.advancedSec.refreshCrazyAvailability();
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
            surfaceMachine.activate(SURFACE_TYPES.SETTINGS, () => this.close());
        } else if (uiManager?.playerContainer) {
            uiManager.playerContainer.classList.add('tm-settings-active');
        }

        if (this.overlayClickHandler) {
            document.removeEventListener('click', this.overlayClickHandler, true);
        }

        this.overlayClickHandler = (e) => {
            if (!this.isVisible || !this.panel) return;
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const inPanel = path.includes(this.panel) || this.panel.contains(e.target);
            const btn = uiManager?.settingsBtn;
            const inBtn = btn && (path.includes(btn) || btn.contains(e.target));
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
            surfaceMachine.deactivate(SURFACE_TYPES.SETTINGS);
        } else if (uiManager?.playerContainer) {
            uiManager.playerContainer.classList.remove('tm-settings-active');
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
            if (!headerEl) return;
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
        BatchTestFloatModal.destroyActive();
        if (this._gestureCleanup) {
            this._gestureCleanup();
            this._gestureCleanup = null;
        }
        this._sections = null;
        this.panel = null;
        this.scrollBody = null;
    }
}
