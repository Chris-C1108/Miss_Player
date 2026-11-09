import { __ } from '../../constants/i18n.js';
import { Toast, createModal } from '../../utils/index.js';
import { isSiteDomain, getSiteUrls } from '../../constants/domains.js';
import { logger } from '../../utils/logger.js';
import { formatSeconds } from '../comments/index.js';
import { UIManager } from '../ui/UIManager.js';

const JABLE_DOMAINS = getSiteUrls('JABLE');

/**
 * CommentComposer — 负责评论编辑输入栏、时间戳标签选择、跨域表单提交与登录认证模态框
 */
export class CommentComposer {
    /**
     * @param {import('./CommentPanel.js').CommentPanel} panel - 宿主 CommentPanel 实例
     */
    constructor(panel) {
        this.panel = panel;
        this.selectedTagIds = new Set();
        this.commentInput = null;
        this.tagSelectModal = null;
        this.tagSelectList = null;
        this._lastStatusCheckTime = 0;
        this._lastInputTouchTime = 0;
    }

    get playerCore() {
        return this.panel.playerCore;
    }

    get videoCode() {
        return this.panel.videoCode;
    }

    get jableWorkingDomain() {
        return this.panel.jableWorkingDomain;
    }

    get commentsPanel() {
        return this.panel.commentsPanel;
    }

    get siteLoginStates() {
        return this.panel.siteLoginStates;
    }

    getTabs() {
        return this.panel.getTabs();
    }

    getLoopManager() {
        return this.panel.getLoopManager();
    }

    /**
     * 检测目标站点是否可以发表评论（校验番号、页面存在性、登录状态）
     */
    async checkCanComment() {
        if (!this.videoCode) {
            Toast('无法获取影片番号，无法发表评论', 2000, 'error');
            return null;
        }

        const domain = this.jableWorkingDomain || JABLE_DOMAINS[0];
        const targetUrl = `${domain}/videos/${this.videoCode.toLowerCase().trim()}/`;

        return new Promise((resolve) => {
            let completed = false;
            let req = null;
            const timer = setTimeout(() => {
                if (!completed) {
                    completed = true;
                    if (req && typeof req.abort === 'function') {
                        try { req.abort(); } catch (e) { }
                    }
                    Toast('检测评论环境超时，请稍后重试', 2000, 'error');
                    resolve(null);
                }
            }, 6000);

            req = GM_xmlhttpRequest({
                method: 'GET',
                url: targetUrl,
                timeout: 6000,
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'referer': domain,
                    'User-Agent': navigator.userAgent
                },
                onload: (response) => {
                    if (completed) return;
                    completed = true;
                    clearTimeout(timer);

                    if (response.status === 404) {
                        this.panel.jableVideoExists = false;
                        this.showTipModal('提示', '该影片在 Jable.tv 上未发布，无法发表评论。');
                        resolve(null);
                        return;
                    }

                    if (response.status >= 200 && response.status < 300) {
                        this.panel.jableVideoExists = true;
                        const html = response.responseText;
                        const doc = new DOMParser().parseFromString(html, 'text/html');

                        const commentForm = Array.from(doc.querySelectorAll('form')).find(form =>
                            form.querySelector('input[name="action"][value="add_comment"]') ||
                            form.querySelector('input[name="action"][value="add_comment_video"]')
                        ) || doc.querySelector('form[id*="comment"]') || doc.querySelector('form[action*="comment"]');

                        if (!commentForm) {
                            this.showLoginPromptModal(domain);
                            resolve(null);
                        } else {
                            resolve({ commentForm, targetUrl, domain });
                        }
                    } else {
                        Toast(`检测失败: HTTP ${response.status}`, 2000, 'error');
                        resolve(null);
                    }
                },
                onerror: (err) => {
                    if (completed) return;
                    completed = true;
                    clearTimeout(timer);
                    logger.error('[CommentComposer] 检测 Jable 失败:', err);
                    Toast('网络请求失败，请稍后重试', 2000, 'error');
                    resolve(null);
                },
                ontimeout: () => {
                    if (completed) return;
                    completed = true;
                    clearTimeout(timer);
                    Toast('网络请求超时，请稍后重试', 2000, 'error');
                    resolve(null);
                }
            });
        });
    }

    initCommentSubmitBar(panelEl) {
        const container = panelEl || this.commentsPanel;
        if (!container) return;
        this.selectedTagIds = new Set();

        const addTagBtn = container.querySelector('.tm-comment-add-tag-btn');
        const commentInput = container.querySelector('.tm-comment-text-input');
        const sendBtn = container.querySelector('.tm-comment-send-btn');
        const tagSelectModal = container.querySelector('.tm-comment-tag-select-modal');
        const selectAllBtn = container.querySelector('.tm-tag-select-all-btn');
        const deselectAllBtn = container.querySelector('.tm-tag-deselect-all-btn');
        const closeBtn = container.querySelector('.tm-tag-select-close-btn');
        const tagSelectList = container.querySelector('.tm-tag-select-list');
        const fabBtn = container.querySelector('.tm-comment-fab-btn');
        const backdrop = container.querySelector('.tm-comment-backdrop');
        const submitBarWrapper = container.querySelector('.tm-comment-submit-bar-wrapper');
        const closeBarBtn = container.querySelector('.tm-comment-close-bar-btn');

        this.addTagBtn = addTagBtn;
        this.sendBtn = sendBtn;
        this.commentInput = commentInput;
        this.tagSelectModal = tagSelectModal;
        this.tagSelectList = tagSelectList;
        this.fabBtn = fabBtn;
        this.backdrop = backdrop;
        this.submitBarWrapper = submitBarWrapper;
        this.closeBarBtn = closeBarBtn;

        // 阻断高光标签列表纵向触控滑动冒泡至外层播放器视口容器，确保丝滑 60fps 原生滚动
        if (tagSelectModal) {
            tagSelectModal.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        // 绑定悬浮评论按钮 (FAB) 点击唤起输入底栏
        if (fabBtn) {
            fabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openComposer();
            });
        }

        // 绑定背景遮罩点击收起
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                e.stopPropagation();
                // 幽灵误触防御 (Ghost Click Guard): 若 450ms 内触碰过输入框或面板刚刚位移，严禁意外关闭发评底栏
                if (Date.now() - (this._lastInputTouchTime || 0) < 450) {
                    return;
                }
                this.closeComposer();
            });
        }

        // 绑定输入栏右侧收起按钮
        if (closeBarBtn) {
            closeBarBtn.addEventListener('mousedown', (e) => {
                if (e.cancelable) e.preventDefault();
            });
            closeBarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeComposer();
            });
        }

        // 阻断输入栏内部点击冒泡至背景遮罩，并记录最后触碰时间
        if (submitBarWrapper) {
            submitBarWrapper.addEventListener('click', (e) => e.stopPropagation());
            submitBarWrapper.addEventListener('touchstart', () => {
                this._lastInputTouchTime = Date.now();
            }, { passive: true });
            submitBarWrapper.addEventListener('pointerdown', () => {
                this._lastInputTouchTime = Date.now();
            }, { passive: true });
        }

        // 阻止播放快捷键冒泡，放行原生打字与手势链路
        if (commentInput) {
            const stopKeyProp = (e) => e.stopPropagation();
            commentInput.addEventListener('keydown', stopKeyProp);
            commentInput.addEventListener('keyup', stopKeyProp);
            commentInput.addEventListener('keypress', stopKeyProp);

            commentInput.addEventListener('touchstart', () => {
                this._lastInputTouchTime = Date.now();
            }, { passive: true });
            commentInput.addEventListener('mousedown', () => {
                this._lastInputTouchTime = Date.now();
            });

            // 评论暂存功能：输入即自动静默暂存至 sessionStorage，防止用户误退丢失心得
            commentInput.addEventListener('input', () => {
                this.saveCommentDraft();
            });

            commentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendBtn?.click();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeComposer();
                }
            });
        }

        // 辅助绑定：在 iOS Safari 下点击工具按钮时不抢夺输入框焦点，防止虚拟键盘闪烁收起
        const bindToolbarBtn = (btn, handler) => {
            if (!btn) return;
            let lastTouchExecTime = 0;
            let activeInputBeforePress = null;

            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (e.cancelable) e.preventDefault();
            });

            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                activeInputBeforePress = this.getActiveInputElement();
                if (e.pointerType === 'mouse' && e.cancelable) {
                    e.preventDefault();
                }
            });

            btn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                activeInputBeforePress = this.getActiveInputElement();
                if (e.cancelable) e.preventDefault();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (e.cancelable) e.preventDefault();
                lastTouchExecTime = Date.now();
                handler(e);
                const targetInput = activeInputBeforePress || this.commentInput;
                if (targetInput && !this.submitBarWrapper?.classList.contains('is-collapsed')) {
                    try {
                        targetInput.focus({ preventScroll: true });
                    } catch (_) {
                        targetInput.focus();
                    }
                }
            }, { passive: false });

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (Date.now() - lastTouchExecTime < 450) return;
                handler(e);
                const targetInput = activeInputBeforePress || this.commentInput;
                if (targetInput && !this.submitBarWrapper?.classList.contains('is-collapsed')) {
                    try {
                        targetInput.focus({ preventScroll: true });
                    } catch (_) {
                        targetInput.focus();
                    }
                }
            });
        };

        // 加号 (+) 按钮事件：展开/收起高光时间戳标签选择浮层（保持输入框焦点与 iOS 键盘常驻）
        bindToolbarBtn(addTagBtn, () => {
            this.toggleTagSelectModal();
        });

        // 发送 (Send) 按钮事件：防止 iOS Safari 在按压瞬间提前失焦导致底栏下沉丢失点击，随后触发检测并发表评论
        if (sendBtn) {
            sendBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (e.cancelable) e.preventDefault();
            });
            sendBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
            }, { passive: true });
            sendBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                sendBtn.disabled = true;
                const canComment = await this.checkCanComment();
                sendBtn.disabled = false;
                if (!canComment) return;

                this.handleSendComment();
            });
        }

        // 全选按钮
        bindToolbarBtn(selectAllBtn, () => {
            const tabs = this.getTabs();
            this.selectedTagIds = new Set(tabs.map(t => t.id));
            this.renderTagSelectList();
            this.updateTagButtonBadge();
        });

        // 取消全选按钮
        bindToolbarBtn(deselectAllBtn, () => {
            this.selectedTagIds.clear();
            this.renderTagSelectList();
            this.updateTagButtonBadge();
        });

        // 关闭标签选择浮层按钮
        bindToolbarBtn(closeBtn, () => {
            this.closeTagSelectModal();
        });

        this.updateTagButtonBadge();
    }

    /**
     * 获取当前在评论发表栏内处于聚焦状态的输入框（兼容 Shadow DOM）
     */
    getActiveInputElement() {
        const root = this.submitBarWrapper?.getRootNode?.();
        const active = (root && root.activeElement) ? root.activeElement : document.activeElement;
        if (active && this.submitBarWrapper?.contains(active) && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            return active;
        }
        return this.commentInput || null;
    }

    /**
     * 同步更新加号按钮上的已勾选高光片段数量徽标与激活态
     */
    updateTagButtonBadge() {
        const tabs = this.getTabs() || [];
        const validIds = new Set(tabs.map(t => t.id));
        for (const id of this.selectedTagIds) {
            if (!validIds.has(id)) this.selectedTagIds.delete(id);
        }
        const count = this.selectedTagIds.size;
        if (this.addTagBtn) {
            this.addTagBtn.classList.toggle('has-selected', count > 0);
            this.addTagBtn.classList.toggle('is-open', Boolean(this.tagSelectModal?.classList.contains('visible')));
            const badge = this.addTagBtn.querySelector('.tm-add-tag-badge');
            if (badge) {
                badge.textContent = `${count}`;
                badge.classList.toggle('is-hidden', count === 0);
            }
        }
    }

    /**
     * 展开评论输入底栏抽屉
     */
    openComposer() {
        if (!this.submitBarWrapper) return;
        this._lastInputTouchTime = Date.now();
        const surfaceMachine = this.panel?.uiManager?.surfaceMachine || this.panel?.playerCore?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.activate('comment-composer', () => this.closeComposer());
        }
        this.submitBarWrapper.classList.remove('is-collapsed');
        if (this.backdrop) this.backdrop.classList.remove('is-hidden');
        if (this.panel?.commentsPanel) {
            this.panel.commentsPanel.classList.add('has-composer-open');
        }
        if (typeof this.panel?.setDimmed === 'function') {
            this.panel.setDimmed(false);
        }
        if (this.panel?.uiManager && !this.panel.uiManager.isLandscape) {
            this.panel.uiManager.hideControls(true);
        }
        const playerContainer = this.submitBarWrapper.closest('.tm-player-container') ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container');
        if (playerContainer) {
            playerContainer.classList.add('has-composer-active');
        }
        if (this.fabBtn) this.fabBtn.classList.add('is-hidden');

        // 预设默认勾选全部已有标签，并通过徽标清晰告知用户已附带数量
        const tabs = this.getTabs();
        if (this.selectedTagIds.size === 0 && tabs.length > 0) {
            this.selectedTagIds = new Set(tabs.map(t => t.id));
        }
        this.updateTagButtonBadge();

        // 自动恢复未发送的评论暂存草稿
        this.restoreCommentDraft();

        // 原生无阻碍聚焦输入框
        if (this.commentInput) {
            try {
                this.commentInput.focus({ preventScroll: true });
            } catch (_) {
                this.commentInput.focus();
            }
        }
    }

    /**
     * 收起评论输入底栏抽屉
     */
    closeComposer() {
        if (!this.submitBarWrapper) return;
        if (this.commentInput) {
            this.commentInput.blur();
        }
        this.closeTagSelectModal();
        this.submitBarWrapper.classList.add('is-collapsed');
        if (this.backdrop) this.backdrop.classList.add('is-hidden');
        if (this.panel?.commentsPanel) {
            this.panel.commentsPanel.classList.remove('has-composer-open');
        }
        const playerContainer = this.submitBarWrapper.closest('.tm-player-container') ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container');
        if (playerContainer) {
            playerContainer.classList.remove('has-composer-active');
        }
        if (this.fabBtn) this.fabBtn.classList.remove('is-hidden');
        const surfaceMachine = this.panel?.uiManager?.surfaceMachine || this.panel?.playerCore?.surfaceMachine;
        if (surfaceMachine) {
            surfaceMachine.deactivate('comment-composer');
        }
    }

    /**
     * 获取评论暂存的 Storage Key (基于当前影片番号独立隔离)
     */
    getDraftStorageKey() {
        const avcode = this.panel?.videoCode || this.videoCode || (typeof getVideoCodeFromUrl === 'function' ? getVideoCodeFromUrl() : '') || 'default';
        return 'mp_comment_draft_' + String(avcode).toLowerCase().trim();
    }

    /**
     * 保存评论暂存草稿
     */
    saveCommentDraft() {
        if (!this.commentInput) return;
        try {
            const val = this.commentInput.value;
            if (val && val.trim()) {
                sessionStorage.setItem(this.getDraftStorageKey(), val);
            } else {
                sessionStorage.removeItem(this.getDraftStorageKey());
            }
        } catch (_) {}
    }

    /**
     * 恢复未发送的评论暂存草稿
     */
    restoreCommentDraft() {
        if (!this.commentInput) return;
        try {
            const draft = sessionStorage.getItem(this.getDraftStorageKey());
            if (draft && !this.commentInput.value) {
                this.commentInput.value = draft;
            }
        } catch (_) {}
    }

    /**
     * 清理评论草稿
     */
    clearCommentDraft() {
        try {
            sessionStorage.removeItem(this.getDraftStorageKey());
        } catch (_) {}
    }

    toggleTagSelectModal() {
        if (!this.tagSelectModal) return;
        if (this.tagSelectModal.classList.contains('visible')) {
            this.closeTagSelectModal();
        } else {
            this.openTagSelectModal();
        }
    }

    openTagSelectModal() {
        if (!this.tagSelectModal) return;
        const tabs = this.getTabs();
        if (this.selectedTagIds.size === 0 && tabs.length > 0) {
            this.selectedTagIds = new Set(tabs.map(t => t.id));
        }
        this.renderTagSelectList();
        this.tagSelectModal.classList.add('visible');
        this.updateTagButtonBadge();
    }

    closeTagSelectModal() {
        if (!this.tagSelectModal) return;
        this.tagSelectModal.classList.remove('visible');
        this.updateTagButtonBadge();
    }

    renderTagSelectList() {
        if (!this.tagSelectList) return;
        this.tagSelectList.innerHTML = '';

        const tabs = this.getTabs();
        const lm = this.getLoopManager();
        this.updateTagButtonBadge();

        if (tabs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tm-tag-select-empty';
            empty.textContent = '暂无高光片段，可在播放控制栏点击 + 打点';
            this.tagSelectList.appendChild(empty);
            return;
        }

        tabs.forEach((tab, index) => {
            const color = tab.color || (lm ? lm.tabColors[index % lm.tabColors.length] : '200, 100%, 55%');
            const row = document.createElement('div');
            row.className = 'tm-tag-select-item';

            // 勾选复选框（保持输入框焦点不丢失）
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'tm-tag-checkbox';
            checkbox.checked = this.selectedTagIds.has(tab.id);
            let activeInputBeforeCheck = null;
            checkbox.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                activeInputBeforeCheck = this.getActiveInputElement();
                if (e.cancelable) e.preventDefault();
            });
            checkbox.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                activeInputBeforeCheck = this.getActiveInputElement();
            }, { passive: true });
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                if (checkbox.checked) {
                    this.selectedTagIds.add(tab.id);
                } else {
                    this.selectedTagIds.delete(tab.id);
                }
                this.updateTagButtonBadge();
                if (activeInputBeforeCheck && !this.submitBarWrapper?.classList.contains('is-collapsed')) {
                    try {
                        activeInputBeforeCheck.focus({ preventScroll: true });
                    } catch (_) {
                        activeInputBeforeCheck.focus();
                    }
                }
            });

            // 时间胶囊 (支持点击即时跳转视频对应进度，同时保持输入框焦点)
            const timeContainer = document.createElement('div');
            timeContainer.className = 'tm-sheet-item-time-container';
            timeContainer.title = '点击跳转到此高光时间';

            let activeInputBeforeSeek = null;
            timeContainer.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                activeInputBeforeSeek = this.getActiveInputElement();
                if (e.cancelable) e.preventDefault();
            });
            timeContainer.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                activeInputBeforeSeek = this.getActiveInputElement();
                if (e.cancelable) e.preventDefault();
            }, { passive: false });

            const onSeek = (e) => {
                e.stopPropagation();
                this._lastInputTouchTime = Date.now();
                const targetVid = this.panel?.videoPlayer?.playerCore?.targetVideo || 
                                  document.querySelector('miss-player-root')?.shadowRoot?.querySelector('video') || 
                                  document.querySelector('video');
                if (targetVid && tab.startTime !== null && tab.startTime !== undefined) {
                    targetVid.currentTime = tab.startTime;
                    Toast(`已跳转至 ${formatSeconds(tab.startTime)}`, 1500, 'info');
                }
                const targetInput = activeInputBeforeSeek || this.commentInput;
                if (targetInput && !this.submitBarWrapper?.classList.contains('is-collapsed')) {
                    try {
                        targetInput.focus({ preventScroll: true });
                    } catch (_) {
                        targetInput.focus();
                    }
                }
            };
            let lastSeekTouchTime = 0;
            timeContainer.addEventListener('touchend', (e) => {
                if (e.cancelable) e.preventDefault();
                lastSeekTouchTime = Date.now();
                onSeek(e);
            }, { passive: false });
            timeContainer.addEventListener('click', (e) => {
                if (Date.now() - lastSeekTouchTime < 450) return;
                onSeek(e);
            });

            if (tab.type === 'highlight') {
                const pill = document.createElement('button');
                pill.type = 'button';
                pill.className = 'tm-sheet-time-pill';
                pill.style.setProperty('--tab-color', color);
                pill.textContent = formatSeconds(tab.startTime);
                timeContainer.appendChild(pill);
            } else {
                const pill = document.createElement('div');
                pill.className = 'tm-sheet-time-pill interval';
                pill.style.setProperty('--tab-color', color);

                const startSpan = document.createElement('span');
                startSpan.className = 'tm-time-part start';
                startSpan.textContent = formatSeconds(tab.startTime);

                const sepSpan = document.createElement('span');
                sepSpan.className = 'tm-time-sep';
                sepSpan.textContent = '~';

                const endSpan = document.createElement('span');
                endSpan.className = 'tm-time-part end';
                endSpan.textContent = formatSeconds(tab.endTime);

                pill.appendChild(startSpan);
                pill.appendChild(sepSpan);
                pill.appendChild(endSpan);
                timeContainer.appendChild(pill);
            }

            // 可修改备注文本框 (16px 防 iOS 自动缩放)
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tm-tag-remark-input';
            input.placeholder = '添加片段备注...';
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
                    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }, 150);
            });

            input.addEventListener('input', (e) => {
                tab.comment = e.target.value;
                if (lm) {
                    lm._saveTabs();
                    lm.renderTabs();
                }
            });

            input.addEventListener('change', () => {
                if (lm) {
                    lm._saveTabs();
                    lm.renderTabs();
                }
            });

            row.appendChild(checkbox);
            row.appendChild(timeContainer);
            row.appendChild(input);
            this.tagSelectList.appendChild(row);
        });
    }

    async handleSendComment() {
        const tabs = this.getTabs();
        const selectedTabs = tabs.filter(t => this.selectedTagIds.has(t.id));
        const commentText = (this.commentInput ? this.commentInput.value : '').trim();

        if (selectedTabs.length === 0 && !commentText) {
            Toast('请勾选高光片段或输入评论内容', 2000, 'warning');
            return;
        }

        const lines = [];
        selectedTabs.forEach(tab => {
            const remark = (tab.comment || '').trim();
            const remarkStr = remark ? ` ${remark} ；` : ' ；';
            if (tab.type === 'highlight') {
                const timeStr = formatSeconds(tab.startTime);
                lines.push(`[${timeStr}]${remarkStr}`);
            } else {
                const startStr = formatSeconds(tab.startTime);
                const endStr = formatSeconds(tab.endTime);
                lines.push(`[${startStr} ~ ${endStr}]${remarkStr}`);
            }
        });

        if (commentText) {
            lines.push(commentText);
        }

        const finalContent = lines.join('\n');
        await this.submitComment(finalContent);
    }

    async submitComment(commentText) {
        const checkRes = await this.checkCanComment();
        if (!checkRes) return;
        const { commentForm, targetUrl, domain } = checkRes;

        const sendBtn = this.sendBtn || this.submitBarWrapper?.querySelector('.tm-comment-send-btn') || this.commentsPanel?.querySelector('.tm-comment-send-btn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = '发送中...';
        }

        const resetBtn = () => {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.textContent = __('send');
            }
        };

        const provider = window.loginManager && window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));

        try {
            let success = false;
            if (provider && typeof provider.publishComment === 'function') {
                success = await provider.publishComment(commentText, { videoCode: this.videoCode, commentForm, targetUrl, domain });
            } else {
                success = await new Promise((resolve) => {
                    const bodyParams = new URLSearchParams();
                    commentForm.querySelectorAll('input').forEach(input => {
                        if (input.name && input.type !== 'submit') {
                            bodyParams.append(input.name, input.value);
                        }
                    });

                    const formTextarea = commentForm.querySelector('textarea');
                    const textareaName = formTextarea ? formTextarea.name : 'comment';
                    bodyParams.append(textareaName, commentText);

                    let actionUrl = commentForm.getAttribute('action') || '';
                    if (actionUrl.startsWith('/')) {
                        actionUrl = `${domain}${actionUrl}`;
                    } else if (!actionUrl.startsWith('http')) {
                        actionUrl = targetUrl;
                    }

                    logger.log(`[CommentComposer] 正在提交评论: ${actionUrl}`);

                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: actionUrl,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'referer': targetUrl,
                            'origin': domain,
                            'User-Agent': navigator.userAgent
                        },
                        data: bodyParams.toString(),
                        withCredentials: true,
                        onload: (res) => {
                            if (res.status === 200 || res.status === 302) {
                                const resHtml = res.responseText || '';
                                if (resHtml.includes('error-field') || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
                                    const docErr = new DOMParser().parseFromString(resHtml, 'text/html');
                                    const errEl = docErr.querySelector('.error') || docErr.querySelector('.err') || docErr.querySelector('.message-error');
                                    const errMsg = errEl ? errEl.textContent.trim() : '评论提交失败，可能包含敏感词或触发了频率限制。';
                                    Toast(errMsg, 3000, 'error');
                                    resolve(false);
                                } else {
                                    Toast('评论发表成功！', 2000, 'success');
                                    resolve(true);
                                }
                            } else {
                                Toast(`提交失败: HTTP ${res.status}`, 2000, 'error');
                                resolve(false);
                            }
                        },
                        onerror: (err) => {
                            logger.error('[CommentComposer] 提交评论失败:', err);
                            Toast('网络请求出错，请重试', 2000, 'error');
                            resolve(false);
                        }
                    });
                });
            }

            resetBtn();
            if (success) {
                if (this.commentInput) this.commentInput.value = '';
                this.clearCommentDraft();
                this.selectedTagIds.clear();
                this.closeTagSelectModal();
                this.closeComposer();
                setTimeout(() => this.panel.handleRetry(), 500);
            }
        } catch (err) {
            resetBtn();
            logger.error('[CommentComposer] 发表评论过程出现异常:', err);
            Toast('发表评论失败', 2000, 'error');
        }
    }

    async handlePublishComment() {
        if (!this.videoCode) {
            Toast('无法获取影片番号，无法发表评论', 2000, 'error');
            return;
        }

        const domain = this.jableWorkingDomain || JABLE_DOMAINS[0];
        const targetUrl = `${domain}/videos/${this.videoCode.toLowerCase().trim()}/`;

        // 显示加载提示
        const publishBtn = this.commentsPanel.querySelector('.tm-comments-panel-publish-btn');
        const originalText = publishBtn ? publishBtn.textContent : '发表';
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.textContent = '检测中...';
            publishBtn.classList.toggle('is-submitting', true);
        }

        const resetBtn = () => {
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = originalText;
                publishBtn.classList.toggle('is-submitting', false);
            }
        };

        logger.log(`[CommentComposer] 正在检测 Jable 页面与登录态: ${targetUrl}`);

        let completed = false;
        let req = null;
        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                resetBtn();
                if (req && typeof req.abort === 'function') {
                    try { req.abort(); } catch (e) { }
                }
                logger.error('[CommentComposer] 检测 Jable 页面超时');
                Toast('网络请求超时，请稍后重试', 2000, 'error');
            }
        }, 6000);

        req = GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            timeout: 6000,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'referer': domain,
                'User-Agent': navigator.userAgent
            },
            onload: (response) => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resetBtn();
                if (response.status === 404) {
                    this.panel.jableVideoExists = false;
                    this.showTipModal('提示', '该影片在 Jable.tv 上未发布，无法发表评论。');
                    return;
                }

                if (response.status >= 200 && response.status < 300) {
                    this.panel.jableVideoExists = true;
                    const html = response.responseText;
                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    // 查找评论表单
                    const commentForm = Array.from(doc.querySelectorAll('form')).find(form =>
                        form.querySelector('input[name="action"][value="add_comment"]') ||
                        form.querySelector('input[name="action"][value="add_comment_video"]')
                    ) || doc.querySelector('form[id*="comment"]') || doc.querySelector('form[action*="comment"]');

                    if (!commentForm) {
                        this.showLoginPromptModal(domain);
                    } else {
                        this.showCommentInputModal(commentForm, targetUrl, domain);
                    }
                } else {
                    Toast(`检测失败: HTTP ${response.status}`, 2000, 'error');
                }
            },
            onerror: (err) => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resetBtn();
                logger.error('[CommentComposer] 检测 Jable 失败:', err);
                Toast('网络请求失败，请稍后重试', 2000, 'error');
            },
            ontimeout: () => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resetBtn();
                logger.error('[CommentComposer] 检测 Jable 超时');
                Toast('网络请求超时，请稍后重试', 2000, 'error');
            }
        });
    }

    showTipModal(title, message) {
        const { modal, close } = createModal(`
            <div class="tm-custom-modal-content">
                <div class="tm-custom-modal-title">${title}</div>
                <div class="tm-custom-modal-message">${message}</div>
                <button class="tm-custom-modal-close-btn">确定</button>
            </div>
        `);
        modal.querySelector('.tm-custom-modal-close-btn').addEventListener('click', close);
    }

    showLoginPromptModal(domain) {
        this.showLoginModal(domain, null, '登录后即可直接发表评论与高光片段');
    }

    showLoginModal(domain, onSuccess, subtitleText = '') {
        let provider = null;
        if (window.loginManager && domain) {
            provider = window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));
        }
        if (!provider && window.loginManager) {
            provider = window.loginManager.getMatchingProvider();
        }
        const siteTitle = provider ? (provider.siteKey === 'JABLE' ? 'Jable.tv' : provider.siteKey === 'MISSAV' ? 'MissAV' : provider.siteKey) : 'Jable.tv';
        const subtitleHtml = subtitleText
            ? `<div class="mp-composer-modal-subtitle">${subtitleText}</div>`
            : `<div class="mp-composer-modal-subtitle">输入账号凭据以同步站点登录态</div>`;

        const { modal, close } = createModal(`
            <div class="tm-custom-modal-content mp-composer-modal-card">
                <div class="mp-composer-modal-title">登录 ${siteTitle}</div>
                ${subtitleHtml}
                <div class="mp-composer-form">
                    <div class="mp-composer-form-field">
                        <label class="mp-composer-label">账号 / 邮箱</label>
                        <input type="text" class="tm-login-username" placeholder="请输入用户名或邮箱" autocomplete="username" />
                    </div>
                    <div class="mp-composer-form-field">
                        <label class="mp-composer-label">密码</label>
                        <input type="password" class="tm-login-password" placeholder="请输入密码" autocomplete="current-password" />
                    </div>
                    <label class="mp-composer-checkbox-row" for="tm-login-remember">
                        <input type="checkbox" id="tm-login-remember" class="tm-tag-checkbox mp-composer-checkbox" checked />
                        <span class="mp-composer-checkbox-label">记住密码并开启自动登录</span>
                    </label>
                </div>
                <div class="mp-composer-modal-buttons">
                    <button type="button" class="tm-custom-modal-cancel-btn">取消</button>
                    <button type="button" class="tm-custom-modal-submit-btn">登录</button>
                </div>
            </div>
        `);

        const cancelBtn = modal.querySelector('.tm-custom-modal-cancel-btn');
        cancelBtn.addEventListener('click', close);

        const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');
        const usernameInput = modal.querySelector('.tm-login-username');
        const passwordInput = modal.querySelector('.tm-login-password');

        const bindModalInput = (inputEl) => {
            if (!inputEl) return;
            const stopKeyProp = (e) => e.stopPropagation();
            inputEl.addEventListener('keydown', stopKeyProp);
            inputEl.addEventListener('keyup', stopKeyProp);
            inputEl.addEventListener('keypress', stopKeyProp);
            const handleFocus = (e) => {
                inputEl.focus({ preventScroll: true });
                if (e.cancelable && e.type === 'mousedown') {
                    e.preventDefault();
                }
            };
            inputEl.addEventListener('mousedown', handleFocus);
            inputEl.addEventListener('touchstart', handleFocus, { passive: true });
        };
        bindModalInput(usernameInput);
        bindModalInput(passwordInput);

        if (window.loginManager) {
            usernameInput.value = window.loginManager.userEmail || '';
            passwordInput.value = window.loginManager.userPassword || '';
        }

        submitBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const remember = modal.querySelector('#tm-login-remember').checked;

            if (!username || !password) {
                Toast('用户名和密码不能为空', 2000, 'warning');
                return;
            }

            usernameInput.disabled = true;
            passwordInput.disabled = true;
            submitBtn.disabled = true;
            submitBtn.textContent = '登录中...';
            cancelBtn.disabled = true;

            try {
                if (!provider && window.loginManager && domain) {
                    provider = window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));
                }

                const loginSuccess = provider
                    ? await provider.login(username, password, domain)
                    : false;

                if (loginSuccess) {
                    if (window.loginManager) {
                        window.loginManager.handleLoginInfoChange({
                            email: username,
                            password: password,
                            autoLogin: remember
                        });
                    }
                    this.updateAllSiteLoginStatuses(true);
                    close();
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    } else if ((this.commentInput && this.commentInput.value.trim()) || this.selectedTagIds.size > 0) {
                        setTimeout(() => this.handleSendComment(), 350);
                    }
                } else {
                    usernameInput.disabled = false;
                    passwordInput.disabled = false;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '登录';
                    cancelBtn.disabled = false;
                }
            } catch (err) {
                console.error('[CommentComposer] 弹窗登录失败:', err);
                Toast('登录失败，请重试', 2000, 'error');
                usernameInput.disabled = false;
                passwordInput.disabled = false;
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
                cancelBtn.disabled = false;
            }
        });

        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitBtn.click();
            }
        });
    }

    showCommentInputModal(commentForm, targetUrl, domain) {
        const { modal, close } = createModal(`
            <div class="tm-custom-modal-content">
                <div class="tm-custom-modal-title">发表评论</div>
                <textarea class="tm-comment-input-textarea" placeholder="写下你的精彩评论..." maxlength="1000"></textarea>
                <div class="mp-composer-modal-buttons">
                    <button class="tm-custom-modal-cancel-btn">取消</button>
                    <button class="tm-custom-modal-submit-btn">提交</button>
                </div>
            </div>
        `);

        const textarea = modal.querySelector('.tm-comment-input-textarea');
        const handleTextareaFocus = (e) => {
            textarea.focus({ preventScroll: true });
            if (e.cancelable && e.type === 'mousedown') {
                e.preventDefault();
            }
        };
        textarea.addEventListener('mousedown', handleTextareaFocus);
        textarea.addEventListener('touchstart', handleTextareaFocus, { passive: true });

        try {
            textarea.focus({ preventScroll: true });
        } catch (_) {
            textarea.focus();
        }

        const cancelBtn = modal.querySelector('.tm-custom-modal-cancel-btn');
        cancelBtn.addEventListener('click', close);

        const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');

        submitBtn.addEventListener('click', () => {
            const commentText = textarea.value.trim();
            if (!commentText) {
                Toast('评论内容不能为空', 2000, 'warning');
                return;
            }
            if (commentText.length < 3) {
                Toast('评论内容太少，至少输入3个字', 2000, 'warning');
                return;
            }

            textarea.disabled = true;
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            cancelBtn.disabled = true;

            const provider = window.loginManager && window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));

            (async () => {
                try {
                    let success = false;
                    if (provider && typeof provider.publishComment === 'function') {
                        success = await provider.publishComment(commentText, { videoCode: this.videoCode, commentForm, targetUrl, domain });
                    } else {
                        success = await new Promise((resolve) => {
                            const bodyParams = new URLSearchParams();
                            commentForm.querySelectorAll('input').forEach(input => {
                                if (input.name && input.type !== 'submit') {
                                    bodyParams.append(input.name, input.value);
                                }
                            });

                            const formTextarea = commentForm.querySelector('textarea');
                            const textareaName = formTextarea ? formTextarea.name : 'comment';
                            bodyParams.append(textareaName, commentText);

                            let actionUrl = commentForm.getAttribute('action') || '';
                            if (actionUrl.startsWith('/')) {
                                actionUrl = `${domain}${actionUrl}`;
                            } else if (!actionUrl.startsWith('http')) {
                                actionUrl = targetUrl;
                            }

                            logger.log(`[CommentComposer] 正在向 Jable 提交评论: ${actionUrl}`);

                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: actionUrl,
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'referer': targetUrl,
                                    'origin': domain,
                                    'User-Agent': navigator.userAgent
                                },
                                data: bodyParams.toString(),
                                withCredentials: true,
                                onload: (res) => {
                                    if (res.status === 200 || res.status === 302) {
                                        const resHtml = res.responseText || '';
                                        if (resHtml.includes('error-field') || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
                                            const docErr = new DOMParser().parseFromString(resHtml, 'text/html');
                                            const errEl = docErr.querySelector('.error') || docErr.querySelector('.err') || docErr.querySelector('.message-error');
                                            const errMsg = errEl ? errEl.textContent.trim() : '评论提交失败，可能包含敏感词或触发了频率限制。';
                                            Toast(errMsg, 3000, 'error');
                                            resolve(false);
                                        } else {
                                            Toast('评论发表成功！', 2000, 'success');
                                            resolve(true);
                                        }
                                    } else {
                                        Toast(`提交失败: HTTP ${res.status}`, 2000, 'error');
                                        resolve(false);
                                    }
                                },
                                onerror: (err) => {
                                    logger.error('[CommentComposer] 提交评论失败:', err);
                                    Toast('网络请求出错，请重试', 2000, 'error');
                                    resolve(false);
                                }
                            });
                        });
                    }

                    if (success) {
                        close();
                        setTimeout(() => this.panel.handleRetry(), 500);
                    } else {
                        textarea.disabled = false;
                        submitBtn.disabled = false;
                        submitBtn.textContent = '提交';
                        cancelBtn.disabled = false;
                    }
                } catch (err) {
                    logger.error('[CommentComposer] 发表评论失败:', err);
                    textarea.disabled = false;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '提交';
                    cancelBtn.disabled = false;
                }
            })();
        });

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitBtn.click();
            }
        });
    }

    /**
     * 异步更新指定站点的登录状态
     * @param {string} siteKey 
     */
    async updateSiteLoginStatus(siteKey) {
        const provider = this.panel.getLoginProviderForSite(siteKey);
        if (!provider) return;
        try {
            const isLoggedIn = await provider.checkLoginStatus();
            if (this.siteLoginStates[siteKey] !== isLoggedIn) {
                this.siteLoginStates[siteKey] = isLoggedIn;
                this.panel.updateLoginBadgeDOM(siteKey);
            }
        } catch (e) {
            console.error(`[CommentComposer] 检查 ${siteKey} 登录状态出错:`, e);
        }
    }

    /**
     * 异步检查并更新所有支持登录的站点的登录状态
     * @param {boolean} [force=false] - 是否强制覆盖频控锁
     */
    updateAllSiteLoginStatuses(force = false) {
        const now = Date.now();
        if (!force && this._lastStatusCheckTime && (now - this._lastStatusCheckTime < 60000)) {
            return; // 60秒内避免重复发送跨域登录校验请求，保护网络带宽与防止 CF 拦截
        }
        this._lastStatusCheckTime = now;

        const siteKeys = Object.keys(this.siteLoginStates);
        for (const siteKey of siteKeys) {
            this.updateSiteLoginStatus(siteKey);
        }
    }

    async checkLoginStatus() {
        try {
            if (window.loginManager) {
                const provider = window.loginManager.getMatchingProvider();
                if (provider && typeof provider.checkLoginStatus === 'function') {
                    return await provider.checkLoginStatus();
                }
            }
            if (isSiteDomain('MISSAV')) {
                const loginButton = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
                const userAvatar = document.querySelector('.avatar') || document.querySelector('.user-menu');
                return !loginButton || !!userAvatar;
            } else if (isSiteDomain('JABLE')) {
                const logoutBtn = document.querySelector('a[href*="logout"]') || document.querySelector('.user-avatar');
                const loginBtn = document.querySelector('a[href*="login"]');
                return !!logoutBtn || !loginBtn;
            }
        } catch (e) {
            console.error('[CommentComposer] Check login error:', e);
        }
        return true; // 默认返回已登录以保持向前兼容
    }
}
