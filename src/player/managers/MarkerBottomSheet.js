import { formatTimeWithHours } from '../../utils/index.js';

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
        header.appendChild(closeBtn);

        // 滚动列表容器
        this._sheetList = document.createElement('div');
        this._sheetList.className = 'tm-bottom-sheet-list';

        this._sheetPanel.appendChild(header);
        this._sheetPanel.appendChild(this._sheetList);

        const playerContainer = this.uiElements?.container ||
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

                pill.addEventListener('click', () => {
                    this.loopManager._handleTabClick(tab);
                });

                timeContainer.appendChild(pill);
            }

            // 2. 备注文本框 (可以直接手动修改)
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
                this.loopManager.tabs = this.loopManager.tabs.filter(t => t.id !== tab.id);
                if (this.loopManager.activeTabId === tab.id) {
                    this.loopManager.disableLoop();
                    this.loopManager.activeTabId = null;
                }
                this.loopManager._saveTabs();
                this.loopManager.renderTabs();
                this.updateBottomSheet();
            });

            row.appendChild(timeContainer);
            row.appendChild(input);
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
}
