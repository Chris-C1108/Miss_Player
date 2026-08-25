import { formatTimeWithHours, getValue, setValue, Toast } from '../../utils/index.js';
import { getVideoCodeFromUrl } from '../../utils/videoCode.js';
import { __ } from '../../constants/i18n.js';
import { telemetry } from '../../telemetry/index.js';
import { MarkerBottomSheet } from './MarkerBottomSheet.js';
import { SyncManager } from '../../sync/index.js';

/**
 * LoopManager — Tab-Style Marker & AB Loop controller
 */
export class LoopManager {
    constructor(playerCore, uiElements, controlManager = null) {
        this.playerCore = playerCore;
        this.controlManager = controlManager || (playerCore ? playerCore.controlManager : null);
        this.targetVideo = playerCore?.targetVideo;
        this.uiElements = uiElements;

        // Progress bar markers (unchanged)
        this.loopStartMarker = null;
        this.loopEndMarker = null;
        this.loopRangeElement = null;

        // Tab bar DOM refs
        this.tabScrollContainer = null;
        this.tabAddBtn = null;
        this.progressMarkersContainer = null;

        // State
        this.tabs = [];             // Array<{id, type, startTime, endTime?, comment}>
        this.activeTabId = null;    // Currently looping/highlighted tab
        this.draftTab = null;       // In-progress draft
        this.loopActive = false;
        this.loopStartTime = null;
        this.loopEndTime = null;

        // Long-press state
        this._longPressTimer = null;
        this._longPressTriggered = false;

        // Storage
        this.storageKey = null;

        // Bottom sheet component
        this.bottomSheet = new MarkerBottomSheet(this);

        this.editingTabId = null;   // ID of the tab currently being edited inline
        this.editingTabCopy = null; // Copy of the tab data being edited inline
        this._durationFallbackBound = null;

        this.tabColors = [
            '200, 100%, 55%', // Sky Blue
            '145, 80%, 48%', // Emerald Green
            '260, 85%, 62%',  // Purple-Indigo
            '15, 95%, 58%',   // Vibrant Coral
            '330, 90%, 60%',  // Rose Pink
            '170, 85%, 42%'   // Mint/Teal
        ];

        // Bound handlers
        this._handleLoopTimeUpdate = this._handleLoopTimeUpdate.bind(this);
        this._handleOutsideClickForEdit = this._handleOutsideClickForEdit.bind(this);
    }

    get _sheetOverlay() {
        return this.bottomSheet._sheetOverlay;
    }
    set _sheetOverlay(v) {
        this.bottomSheet._sheetOverlay = v;
    }
    get _sheetPanel() {
        return this.bottomSheet._sheetPanel;
    }
    set _sheetPanel(v) {
        this.bottomSheet._sheetPanel = v;
    }
    get _sheetList() {
        return this.bottomSheet._sheetList;
    }
    set _sheetList(v) {
        this.bottomSheet._sheetList = v;
    }
    get _sheetCountBadge() {
        return this.bottomSheet._sheetCountBadge;
    }
    set _sheetCountBadge(v) {
        this.bottomSheet._sheetCountBadge = v;
    }

    setControlManager(controlManager) {
        this.controlManager = controlManager;
    }

    /**
     * Initialize with DOM refs from ControlManager
     */
    init(elements) {
        this.loopStartMarker = elements.loopStartMarker;
        this.loopEndMarker = elements.loopEndMarker;
        this.loopRangeElement = elements.loopRangeElement;
        this.progressMarkersContainer = elements.progressMarkersContainer;
        this.tabScrollContainer = elements.tabScrollContainer;
        this.tabAddBtn = elements.tabAddBtn;

        // Resolve storage key from video code
        const videoCode = getVideoCodeFromUrl();
        this.storageKey = videoCode ? `tabs_${videoCode}` : null;

        // Load saved tabs
        this._loadTabs();

        // Initialize empty draft tab
        this._resetDraftTab();

        // Render tab bar
        this.renderTabs();

        // Bind list button
        if (this.tabAddBtn) {
            this.tabAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleBottomSheet();
            });
        }

        // Translate vertical scroll wheel into horizontal scroll on the tab bar
        if (this.tabScrollContainer) {
            this.tabScrollContainer.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    this.tabScrollContainer.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }

        // Bind swipe-up gesture on tab row
        this._bindSwipeUpGesture();

        // Listen for metadata or duration change to render markers
        if (this.targetVideo) {
            this.targetVideo.addEventListener('durationchange', () => this.renderProgressMarkers());
            this.targetVideo.addEventListener('loadedmetadata', () => this.renderProgressMarkers());
        }

        // 监听多端云同步落盘事件，实时无感刷新当前视频的打点与高光片段
        this._onSyncAppliedBound = () => {
            this._loadTabs();
            this.renderTabs();
            if (this.markerBottomSheet) {
                this.markerBottomSheet.updateBottomSheet();
            }
        };
        window.addEventListener('mp_sync_applied', this._onSyncAppliedBound);

        // Parse URL hash for backward compatibility and multi-tabs support
        this._parseUrlHashParams();

        return this;
    }

    // =====================================================================
    //  Tab Rendering
    // =====================================================================
    renderTabs() {
        if (!this.tabScrollContainer) return;
        this.tabScrollContainer.innerHTML = '';

        // Render progress markers too
        this.renderProgressMarkers();

        // 1. Render all saved tabs (or their inline edit pills if currently editing)
        this.tabs.forEach(tab => {
            const pill = (this.editingTabId === tab.id)
                ? this._createEditPill(tab)
                : this._createTabPill(tab);
            this.tabScrollContainer.appendChild(pill);
        });

        // 2. Make sure draftTab is initialized
        if (!this.draftTab) {
            this._resetDraftTab();
        }

        // 3. Always append the draft tab (which is either a gray placeholder or an active draft capsule) at the end
        const draftPill = this._createDraftPill();
        this.tabScrollContainer.appendChild(draftPill);

        this._updateActiveTabProgress();
    }

    _createTabPill(tab) {
        if (!tab) return document.createElement('div');
        const index = this.tabs.findIndex(t => t && t.id === tab.id);
        const color = index !== -1 ? this.tabColors[index % this.tabColors.length] : this.tabColors[0];

        const pill = document.createElement('div');
        pill.className = 'tm-tab-pill';
        pill.dataset.tabId = tab.id || '';
        pill.style.setProperty('--tab-color', color);

        if (tab.type === 'highlight') {
            pill.textContent = formatTimeWithHours(tab.startTime);
        } else {
            pill.textContent = `${formatTimeWithHours(tab.startTime)} ~ ${formatTimeWithHours(tab.endTime)}`;
        }

        // Active state
        if (this.activeTabId === tab.id) {
            pill.classList.add('active');
        }

        // Click handler
        pill.addEventListener('click', (e) => {
            if (this._longPressTriggered) {
                this._longPressTriggered = false;
                return;
            }
            this._handleTabClick(tab);
        });

        // Long-press handlers with horizontal swipe distance threshold to avoid conflict
        let startX = 0;
        let startY = 0;
        const startLongPress = (e) => {
            this._longPressTriggered = false;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            
            this._longPressTimer = setTimeout(() => {
                this._longPressTriggered = true;
                this._handleTabLongPress(tab);
                // Haptic feedback
                if (window.navigator.vibrate) window.navigator.vibrate(15);
            }, 500);
        };
        const cancelLongPress = () => {
            if (this._longPressTimer) {
                clearTimeout(this._longPressTimer);
                this._longPressTimer = null;
            }
        };
        const moveLongPress = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (Math.hypot(dx, dy) > 8) {
                cancelLongPress();
            }
        };

        pill.addEventListener('mousedown', startLongPress);
        pill.addEventListener('touchstart', startLongPress, { passive: true });
        pill.addEventListener('mousemove', moveLongPress);
        pill.addEventListener('touchmove', moveLongPress, { passive: true });
        pill.addEventListener('mouseup', cancelLongPress);
        pill.addEventListener('mouseleave', cancelLongPress);
        pill.addEventListener('touchend', cancelLongPress);
        pill.addEventListener('touchcancel', cancelLongPress);

        return pill;
    }

    /**
     * 统一创建 AB 时间点按钮容器 DOM
     * @private
     */
    _createABTimeContainer(labelChar, timeVal, isDisabled, onClick) {
        const container = document.createElement('span');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '3px';
        container.style.padding = '2px 5px';
        container.style.borderRadius = '4px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.25)';
        container.style.fontSize = '11px';

        if (isDisabled) {
            container.style.opacity = '0.4';
            container.style.cursor = 'not-allowed';
            container.style.pointerEvents = 'none';
        } else {
            container.style.opacity = '1';
            container.style.cursor = 'pointer';
            container.style.pointerEvents = 'auto';
        }

        const label = document.createElement('span');
        label.className = `tm-draft-label ${labelChar.toLowerCase()}`;
        label.style.color = 'white';
        label.style.fontWeight = '600';
        label.textContent = labelChar;

        const time = document.createElement('span');
        time.className = `tm-draft-time${timeVal === null ? ' placeholder' : ''}`;
        time.style.color = timeVal !== null ? '#fff' : 'rgba(255,255,255,0.3)';
        time.textContent = timeVal !== null ? formatTimeWithHours(timeVal) : '--:--:--';

        container.appendChild(label);
        container.appendChild(time);
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onClick) onClick();
        });

        return container;
    }

    _createDraftPill() {
        const isPlaceholder = (this.draftTab.startTime === null && this.draftTab.endTime === null);
        const color = isPlaceholder 
            ? '0, 0%, 55%' 
            : this.tabColors[this.tabs.length % this.tabColors.length];

        const pill = document.createElement('div');
        pill.className = 'tm-tab-pill draft';
        if (isPlaceholder) {
            pill.classList.add('placeholder');
        }
        pill.style.setProperty('--tab-color', color);
        pill.style.gap = '5px';

        // Clicking anywhere on the empty placeholder pill sets start time (A)
        if (isPlaceholder) {
            pill.style.cursor = 'pointer';
            pill.addEventListener('click', () => {
                if (this.targetVideo) {
                    // Cancel active loop when starting a new draft
                    this.disableLoop();
                    this.activeTabId = null;

                    this.draftTab.startTime = this.targetVideo.currentTime;
                    this.renderTabs();
                    if (window.navigator.vibrate) window.navigator.vibrate(10);
                }
            });
        }

        // A & B containers
        const aContainer = this._createABTimeContainer('A', this.draftTab.startTime, false, () => {
            if (!this.targetVideo) return;
            this.draftTab.startTime = this.targetVideo.currentTime;
            this.renderTabs();
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        });

        const bContainer = this._createABTimeContainer('B', this.draftTab.endTime, this.draftTab.startTime === null, () => {
            if (!this.targetVideo) return;
            this.draftTab.endTime = this.targetVideo.currentTime;
            this.renderTabs();
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        });

        pill.appendChild(aContainer);
        pill.appendChild(bContainer);

        // SVGs
        const SVG_CHECK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        const SVG_CROSS = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'tm-draft-action save';
        saveBtn.innerHTML = SVG_CHECK;
        saveBtn.title = '保存标签';
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (this.draftTab.startTime === null && this.draftTab.endTime === null) {
                Toast('请至少设置一个时间点', 2000, 'error');
                return;
            }

            // Normalise the draft tab configuration
            if (this.draftTab.startTime !== null && this.draftTab.endTime !== null) {
                if (this.draftTab.endTime <= this.draftTab.startTime) {
                    Toast('结束点 (B) 必须大于开始点 (A)', 2000, 'error');
                    return;
                }
                this.draftTab.type = 'interval';
            } else {
                this.draftTab.type = 'highlight';
                if (this.draftTab.startTime === null) {
                    this.draftTab.startTime = this.draftTab.endTime;
                    this.draftTab.endTime = null;
                }
            }

            this._showCommentDialog();
        });
        pill.appendChild(saveBtn);

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'tm-draft-action cancel';
        cancelBtn.innerHTML = SVG_CROSS;
        cancelBtn.title = '取消草稿';
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._resetDraftTab();
            this.renderTabs();
        });
        pill.appendChild(cancelBtn);

        return pill;
    }

    _createEditPill(tab) {
        const index = this.tabs.findIndex(t => t.id === tab.id);
        const color = index !== -1 ? this.tabColors[index % this.tabColors.length] : this.tabColors[0];

        const pill = document.createElement('div');
        pill.className = 'tm-tab-pill draft editing';
        pill.dataset.tabId = tab.id;
        pill.style.setProperty('--tab-color', color);
        pill.style.gap = '5px';

        const copy = this.editingTabCopy;

        // A & B containers
        const aContainer = this._createABTimeContainer('A', copy.startTime, false, () => {
            if (!this.targetVideo) return;
            copy.startTime = this.targetVideo.currentTime;
            this.renderTabs();
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        });

        const bContainer = this._createABTimeContainer('B', copy.endTime, copy.startTime === null, () => {
            if (!this.targetVideo || copy.startTime === null) return;
            copy.endTime = this.targetVideo.currentTime;
            this.renderTabs();
            if (window.navigator.vibrate) window.navigator.vibrate(10);
        });

        pill.appendChild(aContainer);
        pill.appendChild(bContainer);

        // SVGs
        const SVG_EDIT = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        const SVG_CHECK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        const SVG_CROSS = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

        // Edit Comment button (✏️)
        const editCommentBtn = document.createElement('button');
        editCommentBtn.className = 'tm-draft-action edit-comment';
        editCommentBtn.innerHTML = SVG_EDIT;
        editCommentBtn.title = '编辑备注';
        editCommentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._showCommentDialog(copy);
        });
        pill.appendChild(editCommentBtn);

        // Save button (✔)
        const saveBtn = document.createElement('button');
        saveBtn.className = 'tm-draft-action save';
        saveBtn.innerHTML = SVG_CHECK;
        saveBtn.title = '保存修改';
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (copy.startTime === null && copy.endTime === null) {
                Toast('请至少设置一个时间点', 2000, 'error');
                return;
            }

            if (copy.startTime !== null && copy.endTime !== null) {
                if (copy.endTime <= copy.startTime) {
                    Toast('结束点 (B) 必须大于开始点 (A)', 2000, 'error');
                    return;
                }
                copy.type = 'interval';
            } else {
                copy.type = 'highlight';
                if (copy.startTime === null) {
                    copy.startTime = copy.endTime;
                    copy.endTime = null;
                }
            }

            // Save changes
            const idx = this.tabs.findIndex(t => t.id === tab.id);
            if (idx !== -1) {
                this.tabs[idx] = { ...copy, updatedAt: Date.now() };
                SyncManager.clearTombstone('markers', tab.id);
                this._saveTabs();
            }
            this._exitEditMode();
        });
        pill.appendChild(saveBtn);

        // Delete button (✕)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tm-draft-action cancel';
        deleteBtn.innerHTML = SVG_CROSS;
        deleteBtn.title = '删除标签';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (tab && tab.id) {
                SyncManager.recordTombstone('markers', tab.id, this.storageKey);
            }
            this.tabs = this.tabs.filter(t => t.id !== tab.id);
            if (this.activeTabId === tab.id) {
                this.disableLoop();
                this.activeTabId = null;
            }
            this._saveTabs();
            this._exitEditMode();
        });
        pill.appendChild(deleteBtn);

        return pill;
    }

    _enterEditMode(tab) {
        this.editingTabId = tab.id;
        this.editingTabCopy = { ...tab };
        this._resetDraftTab(); // Reset draft back to empty placeholder
        
        // Cancel active loop when entering edit mode
        this.disableLoop();
        this.activeTabId = null;
        
        this.renderTabs();

        // Bind outside click listener to close edit mode
        setTimeout(() => {
            document.addEventListener('click', this._handleOutsideClickForEdit);
        }, 0);
    }

    _exitEditMode() {
        this.editingTabId = null;
        this.editingTabCopy = null;
        document.removeEventListener('click', this._handleOutsideClickForEdit);
        this.renderTabs();
    }

    _handleOutsideClickForEdit(e) {
        const editingPill = this.tabScrollContainer?.querySelector('.tm-tab-pill.draft.editing');
        if (editingPill && !editingPill.contains(e.target)) {
            // Check if clicking inside player container, comment modal, overlays, bottom sheet, etc.
            if (e.target.closest('.tm-player-container, .tm-modal-overlay, .tm-comment-modal, .tm-bottom-sheet-panel, .tm-bottom-sheet-overlay')) {
                return; // don't close if interacting with player controls/video/dialogs
            }
            this._exitEditMode();
        }
    }

    // =====================================================================
    //  Tab Interactions
    // =====================================================================
    _handleTabClick(tab) {
        telemetry.track('tag_jump', {
            type: tab.type,
            has_comment: !!tab.comment
        });
        telemetry.trackTimestampClick({
            secs: tab.type === 'interval' ? [tab.startTime, tab.endTime] : tab.startTime,
            comment: tab.comment || '',
            source: 'tab_marker'
        });

        if (tab.type === 'highlight') {
            // Trigger flashing hint on the progress bar
            if (this.controlManager && typeof this.controlManager.showJumpHint === 'function') {
                this.controlManager.showJumpHint(tab.startTime);
            }
            // Jump to timestamp
            this.targetVideo.currentTime = tab.startTime;
            if (this.targetVideo.paused) {
                this.targetVideo.play().catch(() => {});
            }
            // Deactivate any current loop
            this.disableLoop();
            this.activeTabId = tab.id;
            this.renderTabs();
        } else {
            // Interval tab: toggle / switch loop
            if (this.activeTabId === tab.id && this.loopActive) {
                // 3. 若当前片段正在循环播放，则取消循环
                this.disableLoop();
                this.activeTabId = null;
                this.renderTabs();
            } else {
                // 1. 若有其他片段正在循环播放，终止那个循环，切换到当前tab循环
                this.disableLoop(); // 清除之前的循环状态

                this.activeTabId = tab.id;
                this.loopStartTime = tab.startTime;
                this.loopEndTime = tab.endTime;

                const ct = this.targetVideo ? this.targetVideo.currentTime : 0;
                const isInRange = ct >= tab.startTime && ct < tab.endTime;

                // 2. 若当前进度不在当前时间片段内，跳转到片段起点并显示提示；
                //    若在片段内，则启用循环播放，但不打断当前进度（不跳转到起点）
                if (!isInRange) {
                    if (this.controlManager && typeof this.controlManager.showJumpHint === 'function') {
                        this.controlManager.showJumpHint(tab.startTime);
                    }
                    if (this.targetVideo) {
                        this.targetVideo.currentTime = tab.startTime;
                    }
                }

                this.enableLoop();

                if (this.targetVideo && this.targetVideo.paused) {
                    this.targetVideo.play().catch(() => {});
                }
                this.renderTabs();
            }
        }
    }

    _handleTabLongPress(tab) {
        this._enterEditMode(tab);
    }

    // =====================================================================
    //  Draft Mode
    // =====================================================================
    _resetDraftTab() {
        this.draftTab = {
            id: this._generateId(),
            type: 'interval',
            startTime: null,
            endTime: null,
            comment: ''
        };
    }

    // =====================================================================
    //  Comment Dialog
    // =====================================================================
    _showCommentDialog(existingTab = null) {
        const isEdit = existingTab !== null;
        const tab = isEdit ? existingTab : this.draftTab;
        if (!tab) return;

        // 获取控制面板容器 (.tm-control-buttons)
        const parentContainer = this.uiElements?.controlButtonsContainer || 
                                this.uiElements?.controlPanel || 
                                document.querySelector('.tm-control-buttons');
        if (!parentContainer) return;

        // 移除已存在的嵌入式弹窗
        const existingPopover = parentContainer.querySelector('.tm-inline-remark-popover');
        if (existingPopover) existingPopover.remove();

        const popover = document.createElement('div');
        popover.className = 'tm-inline-remark-popover';

        popover.innerHTML = `
            <div class="tm-inline-remark-body">
                <input type="text" class="tm-inline-remark-input" placeholder="输入高光或区间备注..." value="${tab.comment || ''}" />
                <div class="tm-inline-remark-footer">
                    <button type="button" class="tm-inline-remark-btn cancel">SKIP</button>
                    <button type="button" class="tm-inline-remark-btn submit">SAVE</button>
                </div>
            </div>
        `;

        const input = popover.querySelector('.tm-inline-remark-input');
        const skipBtn = popover.querySelector('.tm-inline-remark-btn.cancel');
        const saveBtn = popover.querySelector('.tm-inline-remark-btn.submit');

        // 阻止快捷键与摸碰冒泡
        const stopProp = (e) => e.stopPropagation();
        input.addEventListener('keydown', stopProp);
        input.addEventListener('keyup', stopProp);
        input.addEventListener('keypress', stopProp);
        input.addEventListener('mousedown', stopProp);
        input.addEventListener('touchstart', stopProp);

        popover.addEventListener('click', (e) => e.stopPropagation());

        parentContainer.appendChild(popover);

        requestAnimationFrame(() => {
            popover.classList.add('visible');
            try {
                input.focus({ preventScroll: true });
            } catch (_) {
                input.focus();
            }
            input.select();
        });

        const close = () => {
            popover.classList.remove('visible');
            popover.addEventListener('transitionend', () => popover.remove(), { once: true });
        };

        const save = (comment) => {
            tab.comment = comment;
            tab.updatedAt = Date.now();
            if (isEdit) {
                if (tab.id) {
                    SyncManager.clearTombstone('markers', tab.id);
                }
                if (existingTab === this.editingTabCopy) {
                    this.renderTabs();
                } else {
                    this._saveTabs();
                    this.renderTabs();
                    this._updateBottomSheet();
                }
            } else {
                telemetry.track('tag_create', {
                    type: this.draftTab.type || (this.draftTab.endTime !== null ? 'interval' : 'highlight'),
                    has_comment: !!comment,
                    duration_sec: (this.draftTab.endTime && this.draftTab.startTime) ? Math.round(this.draftTab.endTime - this.draftTab.startTime) : 0
                });
                const now = Date.now();
                const newTab = { ...this.draftTab, comment, createdAt: now, updatedAt: now };
                this.tabs.push(newTab);
                if (newTab.id) {
                    SyncManager.clearTombstone('markers', newTab.id);
                }
                this._resetDraftTab();
                this._saveTabs();
                this._sortTabs();
                this.renderTabs();
            }
            close();
        };

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            save(input.value.trim());
        });

        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isEdit) {
                // 跳过备注：直接保存新标签
                save('');
            } else {
                // 取消修改
                close();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                save(input.value.trim());
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (!isEdit) {
                    this._resetDraftTab();
                    this.renderTabs();
                }
                close();
            }
        });
    }

    // =====================================================================
    //  Loop Engine (reused from original)
    // =====================================================================
    enableLoop() {
        if (!this.targetVideo || this.loopStartTime === null || this.loopEndTime === null) return;

        this.loopActive = true;
        telemetry.recordFeatureAction('ab_loop_set');
        telemetry.track('loop_toggle', {
            enabled: true,
            interval_sec: Math.round((this.loopEndTime - this.loopStartTime) * 10) / 10
        });

        this.targetVideo.removeEventListener('timeupdate', this._handleLoopTimeUpdate);
        this.targetVideo.addEventListener('timeupdate', this._handleLoopTimeUpdate);

        if (this.targetVideo.currentTime < this.loopStartTime || this.targetVideo.currentTime > this.loopEndTime) {
            this.targetVideo.currentTime = this.loopStartTime;
        }

        this.updateLoopMarkers();
        this.renderProgressMarkers();

        if (window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
    }

    disableLoop() {
        if (!this.loopActive) return;
        this.targetVideo.removeEventListener('timeupdate', this._handleLoopTimeUpdate);
        this.loopActive = false;
        this.loopStartTime = null;
        this.loopEndTime = null;
        this._clearAllTabProgress();
        this.updateLoopMarkers();
        this.renderProgressMarkers();
    }

    _handleLoopTimeUpdate() {
        if (!this.loopActive || this.loopStartTime === null || this.loopEndTime === null) return;
        const ct = this.targetVideo.currentTime;
        if (ct >= this.loopEndTime || ct < this.loopStartTime) {
            this.totalLoopDurationSec = (this.totalLoopDurationSec || 0) + Math.max(0, this.loopEndTime - this.loopStartTime);
            this.targetVideo.currentTime = this.loopStartTime;
        }
        this.renderProgressMarkers();
        this._updateActiveTabProgress();
    }

    _clearAllTabProgress() {
        if (!this.tabScrollContainer) return;
        const pills = this.tabScrollContainer.querySelectorAll('.tm-tab-pill');
        pills.forEach(p => p.style.background = '');
    }

    _updateActiveTabProgress() {
        if (!this.targetVideo || !this.tabScrollContainer) return;
        
        if (!this.loopActive || !this.activeTabId) {
            this._clearAllTabProgress();
            return;
        }

        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (!activeTab || activeTab.type !== 'interval') {
            this._clearAllTabProgress();
            return;
        }

        const pill = this.tabScrollContainer.querySelector(`.tm-tab-pill[data-tab-id="${this.activeTabId}"]`);
        if (!pill) return;

        const duration = activeTab.endTime - activeTab.startTime;
        if (duration <= 0) return;

        const ct = this.targetVideo.currentTime;
        const pct = Math.max(0, Math.min(100, ((ct - activeTab.startTime) / duration) * 100));

        pill.style.background = `linear-gradient(to right, hsla(var(--tab-color), 0.38) ${pct}%, hsla(var(--tab-color), 0.15) ${pct}%)`;
    }



    // =====================================================================
    //  Progress Bar Markers (preserved)
    // =====================================================================
    updateLoopMarkers() {
        if (!this.targetVideo || !this.loopStartMarker || !this.loopEndMarker) return;

        const progressBarElement = this.uiElements?.progressBar || document.querySelector('.tm-progress-bar');
        if (!progressBarElement) return;

        const duration = this.targetVideo.duration;
        if (duration <= 0) return;

        const updateMarker = (time, marker, isActive) => {
            if (time !== null && !isNaN(time) && time >= 0 && time <= duration) {
                marker.style.left = `${(time / duration) * 100}%`;
                marker.style.display = 'block';
                if (isActive) marker.classList.add('active');
                else marker.classList.remove('active');
            } else {
                marker.style.display = 'none';
                marker.classList.remove('active');
            }
        };

        updateMarker(this.loopStartTime, this.loopStartMarker, this.loopActive);
        updateMarker(this.loopEndTime, this.loopEndMarker, this.loopActive);

        if (this.loopRangeElement) {
            if (this.loopActive && this.loopStartTime !== null && this.loopEndTime !== null) {
                const startPos = (this.loopStartTime / duration) * 100;
                const endPos = (this.loopEndTime / duration) * 100;
                const width = endPos - startPos;
                if (width > 0) {
                    this.loopRangeElement.style.left = `${startPos}%`;
                    this.loopRangeElement.style.width = `${width}%`;
                    this.loopRangeElement.style.display = 'block';
                    this.loopRangeElement.classList.add('active');
                } else {
                    this.loopRangeElement.style.display = 'none';
                }
            } else {
                this.loopRangeElement.classList.remove('active');
                this.loopRangeElement.style.display = 'none';
            }
        }
    }

    // Compat shim: called by EventManager on metadata load
    updateLoopTimeDisplay() {
        // No-op: tab pills show the times directly
    }

    // Compat shim: called by CustomVideoPlayer
    _updateUI() {
        this.renderTabs();
        this.updateLoopMarkers();
    }

    // =====================================================================
    //  URL Hash Backward Compat & Multi-Tabs Parsing
    // =====================================================================
    _parseUrlHashParams() {
        let paramsToParse = [];

        // 1. Parse window.location.hash
        if (window.location.hash) {
            let hash = window.location.hash.substring(1);
            if (hash.startsWith('t=')) hash = hash.substring(2);
            const segments = hash.split(',').map(s => {
                let clean = s.trim();
                if (clean.startsWith('t=')) clean = clean.substring(2);
                return clean;
            }).filter(Boolean);
            paramsToParse.push(...segments);
        }

        // 2. Parse query parameters in window.location.search (e.g. ?t=75-90 or ?start=10&end=20)
        if (window.location.search) {
            const urlParams = new URLSearchParams(window.location.search);
            const tParam = urlParams.get('t');
            if (tParam) {
                const segments = tParam.split(',').map(s => {
                    let clean = s.trim();
                    if (clean.startsWith('t=')) clean = clean.substring(2);
                    return clean;
                }).filter(Boolean);
                paramsToParse.push(...segments);
            }
            const startParam = urlParams.get('start');
            const endParam = urlParams.get('end');
            if (startParam) {
                if (endParam) {
                    paramsToParse.push(`${startParam}-${endParam}`);
                } else {
                    paramsToParse.push(startParam);
                }
            }
        }

        if (paramsToParse.length === 0) return;

        // 3. 清理 URL 中的时间戳/参数，避免 missav 站自带的循环播放与脚本冲突
        try {
            const url = new URL(window.location.href);
            let urlChanged = false;
            if (url.hash) {
                url.hash = '';
                urlChanged = true;
            }
            if (url.searchParams.has('t')) {
                url.searchParams.delete('t');
                urlChanged = true;
            }
            if (url.searchParams.has('start')) {
                url.searchParams.delete('start');
                urlChanged = true;
            }
            if (url.searchParams.has('end')) {
                url.searchParams.delete('end');
                urlChanged = true;
            }
            if (urlChanged) {
                window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            }
        } catch (e) {
            console.error('[MissPlayer] Failed to clear URL query/hash params:', e);
        }

        const handleMeta = () => {
            if (!this.targetVideo) return;
            let firstTabToActivate = null;

            paramsToParse.forEach(segment => {
                if (segment.includes('-')) {
                    const [startStr, endStr] = segment.split('-');
                    const startSec = this._parseTimeString(startStr);
                    const endSec = this._parseTimeString(endStr);
                    if (startSec !== null && endSec !== null) {
                        let existingTab = this.tabs.find(t =>
                            t.type === 'interval' &&
                            Math.abs(t.startTime - startSec) < 1 &&
                            Math.abs(t.endTime - endSec) < 1
                        );
                        if (!existingTab) {
                            existingTab = {
                                id: this._generateId(),
                                type: 'interval',
                                startTime: startSec,
                                endTime: endSec,
                                comment: 'From URL'
                            };
                            this.tabs.push(existingTab);
                        }
                        if (!firstTabToActivate) {
                            firstTabToActivate = existingTab;
                        }
                    }
                } else {
                    const sec = this._parseTimeString(segment);
                    if (sec !== null) {
                        let existingTab = this.tabs.find(t =>
                            t.type === 'highlight' && Math.abs(t.startTime - sec) < 1
                        );
                        if (!existingTab) {
                            existingTab = {
                                id: this._generateId(),
                                type: 'highlight',
                                startTime: sec,
                                comment: 'From URL'
                            };
                            this.tabs.push(existingTab);
                        }
                        if (!firstTabToActivate) {
                            firstTabToActivate = existingTab;
                        }
                    }
                }
            });

            // Save, sort, and render all converted tabs
            this._saveTabs();
            this._sortTabs();
            this.renderTabs();

            // Activate the first tab
            if (firstTabToActivate) {
                if (firstTabToActivate.type === 'highlight') {
                    this.targetVideo.currentTime = firstTabToActivate.startTime;
                    if (this.targetVideo.paused) {
                        this.targetVideo.play().catch(() => {});
                    }
                    this.disableLoop();
                    this.activeTabId = firstTabToActivate.id;
                } else {
                    this.disableLoop();
                    this.activeTabId = firstTabToActivate.id;
                    this.loopStartTime = firstTabToActivate.startTime;
                    this.loopEndTime = firstTabToActivate.endTime;
                    this.enableLoop();
                }
                this.renderTabs();
            }

            if (this.targetVideo) {
                this.targetVideo.removeEventListener('loadedmetadata', handleMeta);
            }
        };

        if (this.targetVideo.readyState >= 1) handleMeta();
        else this.targetVideo.addEventListener('loadedmetadata', handleMeta);
    }

    _parseTimeString(timeString) {
        if (!timeString) return null;
        const clean = timeString.trim();

        // 1. Check hh:mm:ss
        const matchHms = clean.match(/^(\d{2}):(\d{2}):(\d{2})$/);
        if (matchHms) {
            return parseInt(matchHms[1], 10) * 3600 + parseInt(matchHms[2], 10) * 60 + parseInt(matchHms[3], 10);
        }

        // 2. Check mm:ss
        const matchMs = clean.match(/^(\d{1,2}):(\d{2})$/);
        if (matchMs) {
            return parseInt(matchMs[1], 10) * 60 + parseInt(matchMs[2], 10);
        }

        // 3. Check pure number (seconds)
        if (clean.match(/^\d+(\.\d+)?$/)) {
            return parseFloat(clean);
        }

        return null;
    }

    // =====================================================================
    //  Bottom Sheet (delegated to MarkerBottomSheet)
    // =====================================================================
    _bindSwipeUpGesture() {
        return this.bottomSheet.bindSwipeUpGesture();
    }

    _toggleBottomSheet() {
        return this.bottomSheet.toggle();
    }

    _updatePanelPosition() {
        return this.bottomSheet.updatePanelPosition();
    }

    _openBottomSheet() {
        return this.bottomSheet.open();
    }

    _closeBottomSheet() {
        return this.bottomSheet.close();
    }

    _createBottomSheet() {
        return this.bottomSheet.createBottomSheet();
    }

    _updateBottomSheet() {
        return this.bottomSheet.updateBottomSheet();
    }

    renderProgressMarkers() {
        if (!this.progressMarkersContainer || !this.targetVideo) return;
        this.progressMarkersContainer.innerHTML = '';

        // Hide legacy markers so they don't interfere
        if (this.loopStartMarker) this.loopStartMarker.style.display = 'none';
        if (this.loopEndMarker) this.loopEndMarker.style.display = 'none';
        if (this.loopRangeElement) this.loopRangeElement.style.display = 'none';

        const duration = this.targetVideo.duration;
        if (duration <= 0 || isNaN(duration)) {
            // Robust retry fallback: if duration is not loaded yet, listen to timeupdate to render when ready
            if (!this._durationFallbackBound) {
                this._durationFallbackBound = () => {
                    if (!this.targetVideo) return;
                    const dur = this.targetVideo.duration;
                    if (dur > 0 && !isNaN(dur)) {
                        this.renderProgressMarkers();
                        if (this.targetVideo) {
                            this.targetVideo.removeEventListener('timeupdate', this._durationFallbackBound);
                        }
                        this._durationFallbackBound = null;
                    }
                };
                this.targetVideo.addEventListener('timeupdate', this._durationFallbackBound);
            }
            return;
        }

        this.tabs.forEach((tab, index) => {
            const color = this.tabColors[index % this.tabColors.length];
            const startPct = (tab.startTime / duration) * 100;

            if (tab.type === 'highlight') {
                // Highlight point: little vertical tick directly inside the progress bar
                const tick = document.createElement('div');
                tick.className = 'tm-progress-marker-tick';
                tick.style.left = `${startPct}%`;
                tick.style.setProperty('--tab-color', color);
                tick.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleTabClick(tab);
                });
                this.progressMarkersContainer.appendChild(tick);
            } else if (tab.type === 'interval') {
                const endPct = (tab.endTime / duration) * 100;
                const widthPct = endPct - startPct;
                if (widthPct <= 0) return;

                if (this.loopActive && this.activeTabId === tab.id) {
                    // 1. Base active loop range (full width from start to end, light color)
                    const baseRange = document.createElement('div');
                    baseRange.className = 'tm-active-loop-unplayed';
                    baseRange.style.left = `${startPct}%`;
                    baseRange.style.width = `${widthPct}%`;
                    baseRange.style.setProperty('--tab-color', color);
                    this.progressMarkersContainer.appendChild(baseRange);

                    // 2. Played active loop progress (from start to current time, darker color)
                    const clampedCurrent = Math.max(tab.startTime, Math.min(tab.endTime, this.targetVideo.currentTime));
                    const playedPct = ((clampedCurrent - tab.startTime) / duration) * 100;
                    if (playedPct > 0) {
                        const played = document.createElement('div');
                        played.className = 'tm-active-loop-played';
                        played.style.left = `${startPct}%`;
                        played.style.width = `${playedPct}%`;
                        played.style.setProperty('--tab-color', color);
                        this.progressMarkersContainer.appendChild(played);
                    }

                    // Start boundary tick
                    const startTick = document.createElement('div');
                    startTick.className = 'tm-active-loop-boundary start';
                    startTick.style.left = `${startPct}%`;
                    startTick.style.setProperty('--tab-color', color);
                    this.progressMarkersContainer.appendChild(startTick);

                    // End boundary tick
                    const endTick = document.createElement('div');
                    endTick.className = 'tm-active-loop-boundary end';
                    endTick.style.left = `${endPct}%`;
                    endTick.style.setProperty('--tab-color', color);
                    this.progressMarkersContainer.appendChild(endTick);
                } else {
                    // Inactive loop range: thin translucent bar below bottom edge
                    const range = document.createElement('div');
                    range.className = 'tm-progress-marker-range';
                    range.style.left = `${startPct}%`;
                    range.style.width = `${widthPct}%`;
                    range.style.setProperty('--tab-color', color);
                    range.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this._handleTabClick(tab);
                    });
                    this.progressMarkersContainer.appendChild(range);
                }
            }
        });
    }

    // =====================================================================
    //  Persistence
    // =====================================================================
    _sortTabs() {
        this.tabs.sort((a, b) => a.startTime - b.startTime);
    }

    _saveTabs() {
        if (!this.storageKey) return;
        const now = Date.now();
        this.tabs = this.tabs.map(t => {
            const copy = { ...t };
            if (!copy.createdAt) copy.createdAt = now;
            if (!copy.updatedAt) copy.updatedAt = now;
            return copy;
        });
        this._sortTabs();
        setValue(this.storageKey, this.tabs);

        // 触发自动智能合并同步 (数据变更，防抖 5 秒)
        try {
            SyncManager.triggerAutoSync(this.playerCore?.options?.playerState, 'change');
        } catch (_) {}

        // 遥测上报：收集/标记的时间戳与时间片段
        try {
            if (Array.isArray(this.tabs) && this.tabs.length > 0) {
                const latest = this.tabs[this.tabs.length - 1];
                if (latest) {
                    telemetry.trackTimestampCollect({
                        type: latest.type || 'point',
                        startTime: latest.startTime,
                        endTime: latest.endTime,
                        comment: latest.comment || ''
                    });
                }
            }
        } catch (_) {}
    }

    _loadTabs() {
        if (!this.storageKey) {
            this.tabs = [];
            return;
        }
        const saved = getValue(this.storageKey, []);
        const now = Date.now();
        this.tabs = (Array.isArray(saved) ? saved : [])
            .filter(t => t && typeof t === 'object')
            .map(t => {
                const item = { ...t };
                if (!item.id) item.id = this._generateId();
                if (!item.createdAt) item.createdAt = now;
                if (!item.updatedAt) item.updatedAt = item.createdAt;
                return item;
            });
        this._sortTabs();
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // =====================================================================
    //  Lifecycle
    // =====================================================================
    cleanup() {
        this.disableLoop();
        document.removeEventListener('click', this._handleOutsideClickForEdit);
        if (this.targetVideo && this._durationFallbackBound) {
            this.targetVideo.removeEventListener('timeupdate', this._durationFallbackBound);
            this._durationFallbackBound = null;
        }
        if (this.bottomSheet) {
            this.bottomSheet.cleanup();
        }
        if (this._longPressTimer) {
            clearTimeout(this._longPressTimer);
            this._longPressTimer = null;
        }
    }
}