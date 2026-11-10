import { SEMANTIC_TAG_TAXONOMY } from './tagTaxonomy.js';
import { copyToClipboard, Toast, createModal } from '../../utils/index.js';
import { formatTimeWithHours } from '../../utils/index.js';
import { SyncManager } from '../../sync/index.js';
import { __ } from '../../constants/i18n.js';
import { LOOP_INTERVAL, CLOSE_LINE, ICON_TAG, ICON_TRASH, ICON_SHARE_LINK, ICON_UNDO } from '../../constants/icons.js';
import { UIManager } from '../ui/UIManager.js';
import { SURFACE_TYPES, bindKeepFocusAction, bindActionWithoutBlurShift } from '../state/UISurfaceMachine.js';

/**
 * MarkerBottomSheet — 循环片段与时间戳标签管理底部浮层面板
 */
export class MarkerBottomSheet {
    /**
     * @param {import('./LoopManager.js').LoopManager} loopManager
     */
    constructor(loopManager) {
        this.loopManager = loopManager;
        this._sheetOverlay = null;
        this._sheetPanel = null;
        this._sheetList = null;
        this._sheetCountBadge = null;
        this._selectAllCheckbox = null;
        this._shareBtn = null;
        this._undoBtn = null;
        this._undoTimer = null;
        this._deletedHistory = [];
        this._selectedTabIds = new Set();
        this._lastInputTouchTime = 0;
    }

    get tabs() {
        return this.loopManager.tabs;
    }

    get activeTabId() {
        return this.loopManager.activeTabId;
    }

    get tabColors() {
        return this.loopManager.tabColors;
    }

    get tabAddBtn() {
        return this.loopManager.tabAddBtn;
    }

    get tabScrollContainer() {
        return this.loopManager.tabScrollContainer;
    }

    get targetVideo() {
        return this.loopManager.targetVideo;
    }

    get uiElements() {
        return this.loopManager.uiElements;
    }

    bindSwipeUpGesture() {
        const el = this.tabScrollContainer?.parentElement; // .tm-loop-control-row
        if (!el) return;

        let startY = 0;
        let startX = 0;
        let tracking = false;

        el.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startY = touch.clientY;
            startX = touch.clientX;
            tracking = true;
        }, { passive: true });

        el.addEventListener('touchend', (e) => {
            if (!tracking) return;
            tracking = false;
            const touch = e.changedTouches[0];
            const dy = touch.clientY - startY;
            const dx = Math.abs(touch.clientX - startX);
            // Swipe up: dy < -40 and more vertical than horizontal
            if (dy < -40 && Math.abs(dy) > dx) {
                e.stopPropagation();
                this.open();
            }
        });
    }

    toggle() {
        if (this._sheetPanel && this._sheetPanel.classList.contains('visible')) {
            this.close();
        } else {
            this.open();
        }
    }

    updatePanelPosition() {
        if (!this._sheetPanel) return;
        const isLandscape = (typeof window !== 'undefined' && window.innerWidth > window.innerHeight);
        if (!isLandscape) {
            // 移动端竖屏下：作为标准的顶级全宽 BottomSheet，清空所有行内绝对坐标，完全交由纯 CSS 规则与键盘自适应调度
            this._sheetPanel.style.bottom = '';
            this._sheetPanel.style.maxHeight = '';
            return;
        }

        const parentContainer = this.tabAddBtn?.closest('.tm-control-buttons') ||
                                this.loopManager?.controlManager?.controlButtonsContainer ||
                                this.uiElements?.controlButtons ||
                                document.querySelector('.tm-control-buttons');
        const loopRow = this.tabAddBtn?.closest('.tm-loop-control-row') || this.tabAddBtn?.parentElement;
        const handleContainer = this.uiElements?.handleContainer || document.querySelector('.tm-handle-container');
        
        if (parentContainer && loopRow) {
            const parentRect = parentContainer.getBoundingClientRect();
            const loopRect = loopRow.getBoundingClientRect();
            // 计算从 parentContainer 底部到 loopRow 底部的距离，作为 bottom 偏移量
            const bottomOffset = Math.max(0, parentRect.bottom - loopRect.bottom);
            this._sheetPanel.style.bottom = `${bottomOffset}px`;

            if (handleContainer) {
                const handleRect = handleContainer.getBoundingClientRect();
                // 顶部低于 handleContainer
                const availableHeight = loopRect.bottom - handleRect.bottom - 10;
                if (availableHeight > 80) {
                    this._sheetPanel.style.maxHeight = `${availableHeight}px`;
                    return;
                }
            }
        }
        this._sheetPanel.style.maxHeight = 'calc(100vh - 120px)';
    }

    open() {
        const surfaceMachine = this.loopManager?.playerCore?.surfaceMachine || this.loopManager?.controlManager?.uiManager?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.activate(SURFACE_TYPES.MARKER_SHEET, () => this.close());
        }
        if (!this._sheetOverlay || !this._sheetPanel) this.createBottomSheet();
        this.updateBottomSheet();
        this.updatePanelPosition();
        if (this._sheetOverlay) this._sheetOverlay.classList.add('visible');
        if (this._sheetPanel) this._sheetPanel.classList.add('visible');
        const playerContainer = this._sheetPanel?.closest?.('.tm-player-container') ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container');
        if (playerContainer) {
            playerContainer.classList.add('has-sheet-open');
        }
    }

    close() {
        if (this._sheetPanel) {
            const root = this._sheetPanel.getRootNode?.();
            const active = (root && root.activeElement) ? root.activeElement : document.activeElement;
            if (active && this._sheetPanel.contains(active) && typeof active.blur === 'function') {
                active.blur();
            }
            this._sheetPanel.classList.remove('visible');
        }
        if (this._sheetOverlay) this._sheetOverlay.classList.remove('visible');
        const playerContainer = this._sheetPanel?.closest?.('.tm-player-container') ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container');
        if (playerContainer) {
            playerContainer.classList.remove('has-sheet-open');
        }
        const surfaceMachine = this.loopManager?.playerCore?.surfaceMachine || this.loopManager?.controlManager?.uiManager?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.deactivate(SURFACE_TYPES.MARKER_SHEET);
        }
    }

    createBottomSheet() {
        const parentContainer = this.tabAddBtn?.closest('.tm-control-buttons') ||
                                this.loopManager?.controlManager?.controlButtonsContainer ||
                                this.uiElements?.controlButtons ||
                                document.querySelector('.tm-control-buttons');
        if (!parentContainer) return;

        if (this._sheetOverlay) this._sheetOverlay.remove();
        if (this._sheetPanel) this._sheetPanel.remove();

        // 蒙版背景
        this._sheetOverlay = document.createElement('div');
        this._sheetOverlay.className = 'tm-bottom-sheet-overlay';
        this._sheetOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
            // 幽灵误触防御 (Ghost Click Guard): 若 450ms 内触碰过输入框或面板刚刚位移，严禁意外关闭高光底栏
            if (Date.now() - (this._lastInputTouchTime || 0) < 450) {
                return;
            }
            this.close();
        });

        this._sheetOverlay.addEventListener('touchmove', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        // 模态框面板
        this._sheetPanel = document.createElement('div');
        this._sheetPanel.className = 'tm-bottom-sheet-panel';
        this._sheetPanel.addEventListener('click', (e) => e.stopPropagation());
        this._sheetPanel.addEventListener('touchstart', () => {
            this._lastInputTouchTime = Date.now();
        }, { passive: true });
        this._sheetPanel.addEventListener('pointerdown', () => {
            this._lastInputTouchTime = Date.now();
        }, { passive: true });

        const stopContextMenu = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || Boolean(e.target?.isContentEditable)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        };
        this._sheetOverlay.addEventListener('contextmenu', stopContextMenu, true);
        this._sheetPanel.addEventListener('contextmenu', stopContextMenu, true);

        // 统一单行顶栏：全选 + 标题 + 数量徽标 | 撤销 + 分享 + 关闭
        const header = document.createElement('div');
        header.className = 'tm-sheet-header';

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'mp-sheet-title-wrap';

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.className = 'tm-sheet-select-all tm-tag-checkbox';
        selectAllCheckbox.title = '全选 / 取消全选';
        this._selectAllCheckbox = selectAllCheckbox;

        selectAllCheckbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const checked = e.target.checked;
            this._selectedTabIds.clear();
            if (checked) {
                this.tabs.forEach(t => this._selectedTabIds.add(t.id));
            }
            this.updateBottomSheet();
        });

        const title = document.createElement('div');
        title.className = 'tm-bottom-sheet-title';
        title.textContent = __('sheetTitle') || '高光片段';

        const countBadge = document.createElement('span');
        countBadge.className = 'tm-sheet-count-badge';
        this._sheetCountBadge = countBadge;

        titleWrapper.appendChild(selectAllCheckbox);
        titleWrapper.appendChild(title);
        titleWrapper.appendChild(countBadge);

        const headerActions = document.createElement('div');
        headerActions.className = 'mp-sheet-header-actions';

        const undoBtn = document.createElement('button');
        undoBtn.className = 'tm-sheet-undo-btn mp-sheet-undo-btn';
        undoBtn.title = __('undoDelete') || '撤销删除';
        this._undoBtn = undoBtn;

        bindActionWithoutBlurShift(undoBtn, () => {
            const item = this._deletedHistory.pop();
            if (item && item.tab) {
                if (item.tab.id) {
                    SyncManager.clearTombstone('markers', item.tab.id);
                }
                this.loopManager.tabs.splice(item.index, 0, item.tab);
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
                this.updateBottomSheet();
                Toast(__('undoRestored') || '已恢复片段', 1200, 'success');
            }
            if (this._deletedHistory.length === 0) {
                undoBtn.classList.remove('is-active');
                if (this._undoTimer) clearInterval(this._undoTimer);
            }
        }, (t) => { this._lastInputTouchTime = t; });

        const shareBtn = document.createElement('button');
        shareBtn.className = 'tm-sheet-share-btn mp-sheet-share-btn';
        shareBtn.title = __('shareSelected') || '分享高光片段';
        this._shareBtn = shareBtn;
        this._syncShareBtnLabel();

        bindActionWithoutBlurShift(shareBtn, () => {
            if (this.tabs.length === 0) {
                Toast('暂无可分享的高光片段', 1400, 'info');
                return;
            }
            const selected = this._selectedTabIds.size > 0
                ? this.tabs.filter(t => this._selectedTabIds.has(t.id))
                : [...this.tabs];
            if (selected.length === 0) {
                Toast(__('selectToShare') || '请先勾选需要分享的片段', 1500, 'info');
                return;
            }
            this._showShareModal(selected);
        }, (t) => { this._lastInputTouchTime = t; });

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tm-sheet-close-btn';
        closeBtn.innerHTML = CLOSE_LINE;
        closeBtn.title = __('cancel') || '关闭';
        bindActionWithoutBlurShift(closeBtn, () => this.close(), (t) => { this._lastInputTouchTime = t; });

        headerActions.appendChild(undoBtn);
        headerActions.appendChild(shareBtn);
        headerActions.appendChild(closeBtn);

        header.appendChild(titleWrapper);
        header.appendChild(headerActions);

        // 滚动列表容器
        this._sheetList = document.createElement('div');
        this._sheetList.className = 'tm-bottom-sheet-list';

        this._sheetPanel.appendChild(header);
        this._sheetPanel.appendChild(this._sheetList);

        const rootHost = document.querySelector('miss-player-root');
        const shadow = rootHost?.shadowRoot;
        const playerContainer = shadow?.querySelector('.tm-player-container') ||
                                this.loopManager?.controlManager?.playerCore?.uiManager?.playerContainer ||
                                shadow;
        if (!playerContainer) return;
        playerContainer.appendChild(this._sheetOverlay);

        // 统一直接挂载到 Shadow DOM 内部顶级容器，彻底阻断挂在宿主 document.body 导致的 Safari 原生滚动暴走
        playerContainer.appendChild(this._sheetPanel);
    }

    _syncShareBtnLabel() {
        if (!this._shareBtn) return;
        const selectedCount = this.tabs.filter(t => this._selectedTabIds.has(t.id)).length;
        const label = selectedCount > 0 ? `分享 (${selectedCount})` : '分享';
        this._shareBtn.innerHTML = `${ICON_SHARE_LINK}<span>${label}</span>`;
        this._shareBtn.classList.toggle('is-disabled', this.tabs.length === 0);
        if (this._selectAllCheckbox) {
            const hasTabs = this.tabs.length > 0;
            this._selectAllCheckbox.classList.toggle('is-hidden', !hasTabs);
            this._selectAllCheckbox.checked = hasTabs && selectedCount === this.tabs.length;
        }
    }

    updateBottomSheet() {
        if (!this._sheetList) return;
        this._sheetList.innerHTML = '';

        // 清理已不存在的选中 ID
        const validIds = new Set(this.tabs.map(t => t.id));
        for (const id of this._selectedTabIds) {
            if (!validIds.has(id)) this._selectedTabIds.delete(id);
        }

        if (this._sheetCountBadge) {
            this._sheetCountBadge.textContent = `${this.tabs.length}`;
        }
        this._syncShareBtnLabel();

        if (this.tabs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tm-bottom-sheet-empty';
            empty.textContent = '暂无高光片段，点击进度条右上方 + 即可打点';
            this._sheetList.appendChild(empty);
            return;
        }

        this.tabs.forEach((tab, index) => {
            const color = tab.color || this.tabColors[index % this.tabColors.length];
            const row = document.createElement('div');
            row.className = 'tm-sheet-item';
            if (this.activeTabId === tab.id) {
                row.classList.add('active');
            }

            const mainRow = document.createElement('div');
            mainRow.className = 'tm-sheet-item-main';

            // 1. 圆形复选框
            const rowCheckbox = document.createElement('input');
            rowCheckbox.type = 'checkbox';
            rowCheckbox.className = 'tm-sheet-row-checkbox mp-sheet-row-checkbox tm-tag-checkbox';
            rowCheckbox.checked = this._selectedTabIds.has(tab.id);
            rowCheckbox.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (e.cancelable) e.preventDefault();
            });
            rowCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (e.target.checked) {
                    this._selectedTabIds.add(tab.id);
                } else {
                    this._selectedTabIds.delete(tab.id);
                }
                this._syncShareBtnLabel();
            });

            // 2. 时间胶囊按钮容器
            const timeContainer = document.createElement('div');
            timeContainer.className = 'tm-sheet-item-time-container';

            if (tab.type === 'highlight') {
                const pill = document.createElement('button');
                pill.className = 'tm-sheet-time-pill';
                pill.style.setProperty('--tab-color', color);
                pill.textContent = formatTimeWithHours(tab.startTime);
                pill.title = '跳转到此时间';
                pill.addEventListener('click', () => {
                    this.loopManager._handleTabClick(tab);
                });
                timeContainer.appendChild(pill);
            } else {
                const pill = document.createElement('div');
                pill.className = 'tm-sheet-time-pill interval';
                pill.style.setProperty('--tab-color', color);

                const startSpan = document.createElement('span');
                startSpan.className = 'tm-time-part start';
                startSpan.textContent = formatTimeWithHours(tab.startTime);
                startSpan.title = '跳转到起点并开始循环';
                startSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.loopManager._handleTabClick(tab);
                });

                const sepSpan = document.createElement('span');
                sepSpan.className = 'tm-time-sep';
                sepSpan.textContent = '~';

                const endSpan = document.createElement('span');
                endSpan.className = 'tm-time-part end';
                endSpan.textContent = formatTimeWithHours(tab.endTime);
                endSpan.title = '跳转到终点';
                endSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.targetVideo) {
                        this.targetVideo.currentTime = tab.endTime;
                    }
                });

                pill.appendChild(startSpan);
                pill.appendChild(sepSpan);
                pill.appendChild(endSpan);

                if (this.loopManager.activeTabId === tab.id && this.loopManager.loopActive) {
                    pill.classList.add('looping');
                    const overlay = document.createElement('div');
                    overlay.className = 'tm-tab-loop-overlay';
                    overlay.innerHTML = LOOP_INTERVAL;
                    pill.appendChild(overlay);
                }

                pill.addEventListener('click', () => {
                    this.loopManager._handleTabClick(tab);
                });

                timeContainer.appendChild(pill);
            }

            // 3. 备注输入框（实时自动保存 + 内嵌语义标签开关）
            const inputRow = document.createElement('div');
            inputRow.className = 'mp-sheet-input-row';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tm-sheet-item-comment-input';
            input.placeholder = '添加备注...';
            input.value = tab.comment || '';

            const stopKeyProp = (e) => {
                e.stopPropagation();
                if (e.type === 'keydown' && e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                }
            };
            input.addEventListener('keydown', stopKeyProp);
            input.addEventListener('keyup', stopKeyProp);
            input.addEventListener('keypress', stopKeyProp);

            input.addEventListener('touchstart', () => {
                this._lastInputTouchTime = Date.now();
            }, { passive: true });
            input.addEventListener('mousedown', () => {
                this._lastInputTouchTime = Date.now();
            });
            input.addEventListener('focus', () => {
                this._lastInputTouchTime = Date.now();
                setTimeout(() => {
                    if (this._sheetPanel?.classList.contains('visible')) {
                        this._scrollToRow(row);
                    }
                }, 160);
            });

            let saveFeedbackTimer = null;
            const flashSaved = () => {
                input.classList.add('is-saved');
                if (saveFeedbackTimer) clearTimeout(saveFeedbackTimer);
                saveFeedbackTimer = setTimeout(() => input.classList.remove('is-saved'), 650);
            };

            input.addEventListener('input', (e) => {
                tab.comment = e.target.value;
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
            });

            input.addEventListener('change', () => {
                tab.comment = input.value.trim();
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
                flashSaved();
            });

            // 语义标签展开按钮（内嵌于输入框右侧）
            const tagToggleBtn = document.createElement('button');
            tagToggleBtn.type = 'button';
            tagToggleBtn.className = 'mp-sheet-tag-toggle-btn';
            tagToggleBtn.innerHTML = ICON_TAG;
            tagToggleBtn.title = '快捷语义标签';

            inputRow.appendChild(input);
            inputRow.appendChild(tagToggleBtn);

            // 4. 删除按钮 (精炼矢量图标)
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'tm-sheet-delete-btn';
            deleteBtn.innerHTML = ICON_TRASH;
            deleteBtn.title = '删除片段';
            bindActionWithoutBlurShift(deleteBtn, () => {
                const removedIndex = this.loopManager.tabs.findIndex(t => t.id === tab.id);
                this._deletedHistory.push({ tab: { ...tab }, index: removedIndex, expireAt: Date.now() + 60000 });
                this._selectedTabIds.delete(tab.id);

                if (tab && tab.id) {
                    SyncManager.recordTombstone('markers', tab.id, this.loopManager.storageKey);
                }
                this.loopManager.tabs = this.loopManager.tabs.filter(t => t.id !== tab.id);
                this._showUndoNotification();
                if (this.loopManager.activeTabId === tab.id) {
                    this.loopManager.disableLoop();
                    this.loopManager.activeTabId = null;
                }
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
                this.updateBottomSheet();
            }, (t) => { this._lastInputTouchTime = t; });

            // 多维快捷标签选择抽屉 (位于 mainRow 下方，展开时自然撑开行高，绝不裁切)
            const tagDrawer = document.createElement('div');
            tagDrawer.className = 'tm-sheet-tag-drawer mp-sheet-tag-drawer';

            const syncChipSelectedState = () => {
                const currentTokens = new Set((input.value || '').split(/\s+/).filter(Boolean));
                tagDrawer.querySelectorAll('.mp-sheet-tag-chip').forEach(chipEl => {
                    chipEl.classList.toggle('is-selected', currentTokens.has(chipEl.dataset.tag));
                });
            };

            SEMANTIC_TAG_TAXONOMY.forEach(cat => {
                cat.tags.forEach(t => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = 'tm-tag-chip mp-sheet-tag-chip';
                    chip.dataset.tag = t;
                    chip.textContent = t;
                    // 若用户原本正聚焦输入框打字，点按语义标签芯片时保持 iOS 键盘与光标不消失
                    bindKeepFocusAction(chip, () => {
                        const tokens = (input.value || '').split(/\s+/).filter(Boolean);
                        const idx = tokens.indexOf(t);
                        if (idx >= 0) {
                            tokens.splice(idx, 1);
                        } else {
                            tokens.push(t);
                        }
                        input.value = tokens.join(' ');
                        tab.comment = input.value;
                        this.loopManager._saveTabs();
                        this.loopManager.renderTabs();
                        syncChipSelectedState();
                        flashSaved();
                    }, () => input, {
                        alwaysFocus: false,
                        onTouchTimestamp: (ts) => { this._lastInputTouchTime = ts; }
                    });
                    tagDrawer.appendChild(chip);
                });
            });
            syncChipSelectedState();
            input.addEventListener('input', syncChipSelectedState);

            // 点击输入框右侧标签图标展开/收起语义标签抽屉：若当前输入框正处于聚焦态，保持焦点与 iOS 虚拟键盘不闪退
            bindKeepFocusAction(tagToggleBtn, () => {
                const isOpen = tagDrawer.classList.toggle('is-open');
                tagToggleBtn.classList.toggle('is-active', isOpen);
                if (isOpen) {
                    setTimeout(() => {
                        this._scrollToRow(row);
                    }, 180);
                }
            }, () => input, {
                alwaysFocus: false,
                onTouchTimestamp: (ts) => { this._lastInputTouchTime = ts; }
            });

            mainRow.appendChild(rowCheckbox);
            mainRow.appendChild(timeContainer);
            mainRow.appendChild(inputRow);
            mainRow.appendChild(deleteBtn);

            row.appendChild(mainRow);
            row.appendChild(tagDrawer);
            this._sheetList.appendChild(row);
        });
    }

    cleanup() {
        if (this._undoTimer) {
            clearInterval(this._undoTimer);
            this._undoTimer = null;
        }
        if (this._sheetOverlay) {
            this._sheetOverlay.remove();
            this._sheetOverlay = null;
        }
        if (this._sheetPanel) {
            this._sheetPanel.remove();
            this._sheetPanel = null;
            this._sheetList = null;
            this._sheetCountBadge = null;
            this._selectAllCheckbox = null;
            this._shareBtn = null;
            this._undoBtn = null;
        }
    }

    _showUndoNotification() {
        if (!this._undoBtn) return;
        if (this._undoTimer) clearInterval(this._undoTimer);
        const updateText = () => {
            const latest = this._deletedHistory[this._deletedHistory.length - 1];
            if (!latest) {
                this._undoBtn.classList.remove('is-active');
                if (this._undoTimer) clearInterval(this._undoTimer);
                return;
            }
            const remaining = Math.max(0, Math.ceil((latest.expireAt - Date.now()) / 1000));
            if (remaining <= 0) {
                this._deletedHistory.pop();
                this._undoBtn.classList.remove('is-active');
                if (this._undoTimer) clearInterval(this._undoTimer);
            } else {
                this._undoBtn.classList.add('is-active');
                this._undoBtn.innerHTML = `${ICON_UNDO}<span>撤销 ${remaining}s</span>`;
            }
        };
        updateText();
        this._undoTimer = setInterval(updateText, 1000);
    }

    _showShareModal(selectedTabs) {
        const videoCode = this.loopManager.videoCode || (typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : 'VIDEO');
        const currentSpeed = this.targetVideo?.playbackRate || 1.0;
        const currentUrl = (typeof window !== 'undefined') ? window.location.href.split('#')[0] : '';
        const posterUrl = this.targetVideo?.poster || '';

        const payload = {
            c: videoCode,
            s: currentSpeed,
            t: selectedTabs.map(tab => ({
                t: tab.type,
                a: tab.startTime,
                b: tab.endTime || null,
                m: tab.comment || ''
            }))
        };

        const jsonStr = JSON.stringify(payload);
        const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
        const deepLinkUrl = `${currentUrl}#mp_capsules=${encoded}`;

        let mdText = `### 🎬 ${videoCode} 精彩高光片段分享\n\n`;
        if (posterUrl) mdText += `![封面](${posterUrl})\n\n`;
        mdText += `> 推荐播放倍速: **${currentSpeed}x**\n\n`;
        selectedTabs.forEach((tab, i) => {
            const timeStr = (tab.type === 'interval')
                ? `[${formatTimeWithHours(tab.startTime)} ~ ${formatTimeWithHours(tab.endTime)}]`
                : `[${formatTimeWithHours(tab.startTime)}]`;
            mdText += `${i + 1}. **${timeStr}** ${tab.comment || '精彩片段'}\n`;
        });
        mdText += `\n👉 [在 Miss Player 中一键导入播放](${deepLinkUrl})\n`;
        mdText += `*由 Miss Player 单手播放器生成*\n`;

        const { modal, close } = createModal(`
            <div class="tm-custom-modal-title">高光片段分享 (共 ${selectedTabs.length} 条)</div>
            <div class="mp-sheet-share-desc">已生成包含分享链接的片段文本，支持一键载入</div>
            <div class="tm-modal-buttons mp-sheet-share-actions">
                <button class="tm-custom-modal-copy-url-btn mp-sheet-share-btn-copy-url">复制分享链接 (推荐)</button>
                <button class="tm-custom-modal-copy-md-btn mp-sheet-share-btn-copy-md">复制 Markdown 图文排版</button>
                <button class="tm-custom-modal-close-btn mp-sheet-share-btn-close">关闭</button>
            </div>
        `);

        modal.querySelector('.tm-custom-modal-copy-url-btn').addEventListener('click', () => {
            copyToClipboard(deepLinkUrl);
            Toast('深链分享链接已复制！打开自动载入', 2000, 'success');
            close();
        });

        modal.querySelector('.tm-custom-modal-copy-md-btn').addEventListener('click', () => {
            copyToClipboard(mdText);
            Toast('Markdown 图文排版已复制！', 2000, 'success');
            close();
        });

        modal.querySelector('.tm-custom-modal-close-btn').addEventListener('click', close);
    }

    /**
     * 将指定项目行平滑滚动至抽屉列表视口中央 (局部列表滚动，绝不触发祖先容器滚动)
     */
    _scrollToRow(row) {
        if (!row || !this._sheetList) return;
        const list = this._sheetList;
        const relativeTop = row.offsetTop - list.offsetTop;
        list.scrollTo({
            top: Math.max(0, relativeTop - (list.clientHeight / 2) + (row.clientHeight / 2)),
            behavior: 'smooth'
        });
        const shadow = this.loopManager?.playerCore?.uiManager?.shadowRoot || document.querySelector('miss-player-root')?.shadowRoot;
        const container = shadow?.querySelector('.tm-player-container');
        if (container && (container.scrollTop !== 0 || container.scrollLeft !== 0)) {
            container.scrollTop = 0;
            container.scrollLeft = 0;
        }
        if (window.scrollY !== 0 || window.scrollX !== 0) {
            window.scrollTo(0, 0);
        }
    }

}
