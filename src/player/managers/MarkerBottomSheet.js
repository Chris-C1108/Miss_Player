import { SEMANTIC_TAG_TAXONOMY } from './tagTaxonomy.js';
import { copyToClipboard, Toast, createModal } from '../../utils/index.js';
import { formatTimeWithHours } from '../../utils/index.js';
import { SyncManager } from '../../sync/index.js';
import { LOOP_INTERVAL } from '../../constants/icons.js';

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
        this._undoBtn = null;
        this._undoTimer = null;
        this._deletedHistory = [];
        this._selectedTabIds = new Set();
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
        const parentContainer = this.tabAddBtn?.closest('.tm-control-buttons') ||
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
        if (!this._sheetOverlay || !this._sheetPanel) this.createBottomSheet();
        this.updateBottomSheet();
        this.updatePanelPosition();
        if (this._sheetOverlay) this._sheetOverlay.classList.add('visible');
        if (this._sheetPanel) this._sheetPanel.classList.add('visible');
    }

    close() {
        if (this._sheetOverlay) this._sheetOverlay.classList.remove('visible');
        if (this._sheetPanel) this._sheetPanel.classList.remove('visible');
    }

    createBottomSheet() {
        const parentContainer = this.tabAddBtn?.closest('.tm-control-buttons') ||
                                this.uiElements?.controlButtons ||
                                document.querySelector('.tm-control-buttons');
        if (!parentContainer) return;

        if (this._sheetOverlay) this._sheetOverlay.remove();
        if (this._sheetPanel) this._sheetPanel.remove();

        // 蒙版背景
        this._sheetOverlay = document.createElement('div');
        this._sheetOverlay.className = 'tm-bottom-sheet-overlay';
        this._sheetOverlay.addEventListener('click', () => this.close());

        this._sheetOverlay.addEventListener('touchmove', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        // 模态框面板 (挂载于控制面板容器内，宽度与控制面板一致，底部与 tm-loop-control-row 对齐)
        this._sheetPanel = document.createElement('div');
        this._sheetPanel.className = 'tm-bottom-sheet-panel';
        this._sheetPanel.addEventListener('click', (e) => e.stopPropagation());

        // 头部标题与关闭按钮
        const header = document.createElement('div');
        header.className = 'tm-sheet-header';

        const titleWrapper = document.createElement('div');
        titleWrapper.style.display = 'flex';
        titleWrapper.style.alignItems = 'center';
        titleWrapper.style.gap = '8px';

        const title = document.createElement('div');
        title.className = 'tm-bottom-sheet-title';
        title.textContent = '标签管理';

        const countBadge = document.createElement('span');
        countBadge.className = 'tm-sheet-count-badge';
        this._sheetCountBadge = countBadge;

        titleWrapper.appendChild(title);
        titleWrapper.appendChild(countBadge);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tm-sheet-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.title = '关闭';
        closeBtn.addEventListener('click', () => this.close());

        header.appendChild(titleWrapper);

        const headerActions = document.createElement('div');
        headerActions.style.display = 'flex';
        headerActions.style.alignItems = 'center';
        headerActions.style.gap = '8px';

        const undoBtn = document.createElement('button');
        undoBtn.className = 'tm-sheet-undo-btn';
        undoBtn.style.display = 'none';
        undoBtn.title = '撤销上次删除';
        undoBtn.style.cssText = 'background: rgba(255, 149, 0, 0.2); border: 1px solid rgba(255, 149, 0, 0.5); color: #ff9500; font-size: 11px; padding: 2px 8px; border-radius: 10px; cursor: pointer; display: none;';
        this._undoBtn = undoBtn;

        undoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = this._deletedHistory.pop();
            if (item && item.tab) {
                if (item.tab.id) {
                    SyncManager.clearTombstone('markers', item.tab.id);
                }
                this.loopManager.tabs.splice(item.index, 0, item.tab);
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
                this.updateBottomSheet();
                Toast('已撤销并恢复胶囊', 1200, 'success');
            }
            if (this._deletedHistory.length === 0) {
                undoBtn.style.display = 'none';
                if (this._undoTimer) clearInterval(this._undoTimer);
            }
        });

        headerActions.appendChild(undoBtn);
        headerActions.appendChild(closeBtn);
        header.appendChild(headerActions);

        // 滚动列表容器
        this._sheetList = document.createElement('div');
        this._sheetList.className = 'tm-bottom-sheet-list';

        this._sheetPanel.appendChild(header);

        // 批量操作工具栏 (全选/反选与分享)
        const toolbar = document.createElement('div');
        toolbar.className = 'tm-sheet-toolbar';
        toolbar.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: rgba(255, 255, 255, 0.04); border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: rgba(255,255,255,0.7); flex-shrink: 0;';

        const selectAllLabel = document.createElement('label');
        selectAllLabel.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;';
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.className = 'tm-sheet-select-all';
        selectAllLabel.appendChild(selectAllCheckbox);
        const selectAllText = document.createElement('span');
        selectAllText.textContent = '全选';
        selectAllLabel.appendChild(selectAllText);

        selectAllCheckbox.addEventListener('change', (e) => {
            const checked = e.target.checked;
            this._selectedTabIds.clear();
            if (checked) {
                this.tabs.forEach(t => this._selectedTabIds.add(t.id));
            }
            this.updateBottomSheet();
        });

        const shareBtn = document.createElement('button');
        shareBtn.className = 'tm-sheet-share-btn';
        shareBtn.style.cssText = 'background: rgba(0, 122, 255, 0.2); border: 1px solid rgba(0, 122, 255, 0.5); color: #007aff; font-size: 11px; padding: 3px 10px; border-radius: 12px; cursor: pointer; font-weight: 600;';
        shareBtn.textContent = '🔗 分享选中胶囊';
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const selected = this.tabs.filter(t => this._selectedTabIds.has(t.id));
            if (selected.length === 0) {
                Toast('请先勾选需要分享的时间胶囊', 1500, 'info');
                return;
            }
            this._showShareModal(selected);
        });

        toolbar.appendChild(selectAllLabel);
        toolbar.appendChild(shareBtn);
        this._sheetPanel.appendChild(toolbar);

        this._sheetPanel.appendChild(this._sheetList);

        const playerContainer = this.uiElements?.playerContainer ||
                                document.querySelector('.tm-player-container') ||
                                document.body;
        playerContainer.appendChild(this._sheetOverlay);

        // 挂载到控制面板容器中，保证宽度 100% 与控制面板完全对齐
        parentContainer.appendChild(this._sheetPanel);
    }

    updateBottomSheet() {
        if (!this._sheetList) return;
        this._sheetList.innerHTML = '';

        if (this._sheetCountBadge) {
            this._sheetCountBadge.textContent = `共 ${this.tabs.length} 条`;
        }

        if (this.tabs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tm-bottom-sheet-empty';
            empty.textContent = '暂无标签';
            this._sheetList.appendChild(empty);
            return;
        }

        this.tabs.forEach((tab, index) => {
            const color = this.tabColors[index % this.tabColors.length];
            const row = document.createElement('div');
            row.className = 'tm-sheet-item';
            if (this.activeTabId === tab.id) {
                row.classList.add('active');
            }

            // 1. 时间胶囊按钮容器
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
                // AB 时间片段在一个宽胶囊内显示
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

                // 如果当前时间片段正在循环播放，叠加循环图标
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

            // 复选框
            const rowCheckbox = document.createElement('input');
            rowCheckbox.type = 'checkbox';
            rowCheckbox.className = 'tm-sheet-row-checkbox';
            rowCheckbox.checked = this._selectedTabIds.has(tab.id);
            rowCheckbox.style.marginRight = '4px';
            rowCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (e.target.checked) {
                    this._selectedTabIds.add(tab.id);
                } else {
                    this._selectedTabIds.delete(tab.id);
                }
            });

            // 2. 备注文本框与保存按钮
            const remarkWrapper = document.createElement('div');
            remarkWrapper.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 4px;';

            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display: flex; align-items: center; gap: 4px; width: 100%;';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tm-sheet-item-comment-input';
            input.placeholder = '添加备注...';
            input.value = tab.comment || '';

            // 阻止按键冒泡，防止触发视频播放快捷键
            const stopProp = (e) => e.stopPropagation();
            input.addEventListener('keydown', stopProp);
            input.addEventListener('keyup', stopProp);
            input.addEventListener('keypress', stopProp);
            input.addEventListener('mousedown', stopProp);
            input.addEventListener('touchstart', stopProp);

            // 直接修改备注
            input.addEventListener('input', (e) => {
                tab.comment = e.target.value;
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
            });

            input.addEventListener('change', () => {
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
            });

            // 3. 删除按钮 (❌)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'tm-sheet-delete-btn';
            deleteBtn.innerHTML = '❌';
            deleteBtn.title = '删除标签';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
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
            });

            inputRow.appendChild(input);

            // 保存按钮 (显式保存备注)
            const saveBtn = document.createElement('button');
            saveBtn.className = 'tm-sheet-save-btn';
            saveBtn.textContent = '保存';
            saveBtn.title = '保存备注修改';
            saveBtn.style.cssText = 'background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 4px; cursor: pointer; flex-shrink: 0;';
            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tab.comment = input.value.trim();
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
                Toast('备注已保存', 1000, 'success');
            });
            inputRow.appendChild(saveBtn);

            // 语义标签展开按钮
            const tagToggleBtn = document.createElement('button');
            tagToggleBtn.textContent = '🏷️';
            tagToggleBtn.title = '选择多维语义标签';
            tagToggleBtn.style.cssText = 'background: transparent; border: none; cursor: pointer; font-size: 13px; padding: 0 2px;';
            inputRow.appendChild(tagToggleBtn);

            remarkWrapper.appendChild(inputRow);

            // 多维快捷标签选择抽屉 (点击 🏷️ 展开)
            const tagDrawer = document.createElement('div');
            tagDrawer.className = 'tm-sheet-tag-drawer';
            tagDrawer.style.cssText = 'display: none; flex-wrap: wrap; gap: 4px; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-top: 2px;';
            SEMANTIC_TAG_TAXONOMY.forEach(cat => {
                cat.tags.forEach(t => {
                    const chip = document.createElement('span');
                    chip.className = 'tm-tag-chip';
                    chip.textContent = t;
                    chip.style.cssText = 'font-size: 10px; padding: 2px 6px; border-radius: 8px; background: rgba(255,255,255,0.1); color: #ddd; cursor: pointer; user-select: none;';
                    chip.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const cur = input.value.trim();
                        input.value = cur ? (cur + ' ' + t) : t;
                        tab.comment = input.value;
                        this.loopManager._saveTabs();
                        this.loopManager.renderTabs();
                    });
                    tagDrawer.appendChild(chip);
                });
            });

            tagToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tagDrawer.style.display = (tagDrawer.style.display === 'none') ? 'flex' : 'none';
            });
            remarkWrapper.appendChild(tagDrawer);

            row.prepend(rowCheckbox);
            row.appendChild(timeContainer);
            row.appendChild(remarkWrapper);
            row.appendChild(deleteBtn);
            this._sheetList.appendChild(row);
        });
    }

    cleanup() {
        if (this._sheetOverlay) {
            this._sheetOverlay.remove();
            this._sheetOverlay = null;
        }
        if (this._sheetPanel) {
            this._sheetPanel.remove();
            this._sheetPanel = null;
            this._sheetList = null;
            this._sheetCountBadge = null;
        }
    }

    _showUndoNotification() {
        if (!this._undoBtn) return;
        if (this._undoTimer) clearInterval(this._undoTimer);
        const updateText = () => {
            const latest = this._deletedHistory[this._deletedHistory.length - 1];
            if (!latest) {
                this._undoBtn.style.display = 'none';
                if (this._undoTimer) clearInterval(this._undoTimer);
                return;
            }
            const remaining = Math.max(0, Math.ceil((latest.expireAt - Date.now()) / 1000));
            if (remaining <= 0) {
                this._deletedHistory.pop();
                this._undoBtn.style.display = 'none';
                if (this._undoTimer) clearInterval(this._undoTimer);
            } else {
                this._undoBtn.style.display = 'flex';
                this._undoBtn.textContent = `撤销 (${remaining}s)`;
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

        let mdText = `### 🎬 ${videoCode} 精彩时间胶囊分享\n\n`;
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
            <div class="tm-custom-modal-title">时间胶囊分享 (共 ${selectedTabs.length} 条)</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 12px;">已生成包含深链参数的胶囊文本，支持一键载入</div>
            <div class="tm-modal-buttons" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                <button class="tm-custom-modal-copy-url-btn" style="background: #007aff; color: #fff; padding: 8px; border-radius: 6px; border: none; cursor: pointer;">复制深链分享链接 (推荐)</button>
                <button class="tm-custom-modal-copy-md-btn" style="background: rgba(255,255,255,0.15); color: #fff; padding: 8px; border-radius: 6px; border: none; cursor: pointer;">复制 Markdown 图文排版</button>
                <button class="tm-custom-modal-close-btn" style="background: transparent; color: rgba(255,255,255,0.6); padding: 6px; border: none; cursor: pointer;">关闭</button>
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

}
