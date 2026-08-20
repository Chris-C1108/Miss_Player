import { __ } from '../../constants/i18n.js';
import { Toast, createModal } from '../../utils/index.js';
import { isSiteDomain, getSiteUrls } from '../../constants/domains.js';
import { logger } from '../../utils/logger.js';
import { formatSeconds } from '../comments/index.js';

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

        this.commentInput = commentInput;
        this.tagSelectModal = tagSelectModal;
        this.tagSelectList = tagSelectList;

        // 阻止快捷键冒泡
        if (commentInput) {
            const stopProp = (e) => e.stopPropagation();
            commentInput.addEventListener('keydown', stopProp);
            commentInput.addEventListener('keyup', stopProp);
            commentInput.addEventListener('keypress', stopProp);
            commentInput.addEventListener('mousedown', stopProp);
            commentInput.addEventListener('touchstart', stopProp);

            // 聚焦输入框时触发检测
            commentInput.addEventListener('focus', () => {
                this.checkCanComment();
            });

            commentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendBtn?.click();
                }
            });
        }

        // 加号 (+) 按钮事件：即时零延迟弹出模态框
        if (addTagBtn) {
            addTagBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTagSelectModal();
            });
        }

        // 发送 (Send) 按钮事件：触发检测并发表评论
        if (sendBtn) {
            sendBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                sendBtn.disabled = true;
                const canComment = await this.checkCanComment();
                sendBtn.disabled = false;
                if (!canComment) return;

                this.handleSendComment();
            });
        }

        // 全选按钮
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabs = this.getTabs();
                this.selectedTagIds = new Set(tabs.map(t => t.id));
                this.renderTagSelectList();
            });
        }

        // 取消全选按钮
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedTagIds.clear();
                this.renderTagSelectList();
            });
        }

        // 关闭模态框按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTagSelectModal();
            });
        }
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
    }

    closeTagSelectModal() {
        if (!this.tagSelectModal) return;
        this.tagSelectModal.classList.remove('visible');
    }

    renderTagSelectList() {
        if (!this.tagSelectList) return;
        this.tagSelectList.innerHTML = '';

        const tabs = this.getTabs();
        const lm = this.getLoopManager();

        if (tabs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tm-tag-select-empty';
            empty.textContent = '暂无时间戳标签，可在播放控制器添加';
            this.tagSelectList.appendChild(empty);
            return;
        }

        tabs.forEach((tab, index) => {
            const color = lm ? lm.tabColors[index % lm.tabColors.length] : '200, 100%, 55%';
            const row = document.createElement('div');
            row.className = 'tm-tag-select-item';

            // 勾选复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'tm-tag-checkbox';
            checkbox.checked = this.selectedTagIds.has(tab.id);
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    this.selectedTagIds.add(tab.id);
                } else {
                    this.selectedTagIds.delete(tab.id);
                }
            });

            // 时间胶囊
            const timeContainer = document.createElement('div');
            timeContainer.className = 'tm-sheet-item-time-container';

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

            // 可修改备注文本框
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tm-tag-remark-input';
            input.placeholder = '添加备注...';
            input.value = tab.comment || '';

            const stopProp = (e) => e.stopPropagation();
            input.addEventListener('keydown', stopProp);
            input.addEventListener('keyup', stopProp);
            input.addEventListener('keypress', stopProp);
            input.addEventListener('mousedown', stopProp);
            input.addEventListener('touchstart', stopProp);

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
            Toast('请勾选时间戳标签或输入评论内容', 2000, 'warning');
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

        const sendBtn = this.commentsPanel.querySelector('.tm-comment-send-btn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
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
                this.selectedTagIds.clear();
                this.closeTagSelectModal();
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
            publishBtn.style.opacity = '0.7';
        }

        const resetBtn = () => {
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = originalText;
                publishBtn.style.opacity = '1';
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
            <div class="tm-custom-modal-title">${title}</div>
            <div class="tm-custom-modal-message">${message}</div>
            <button class="tm-custom-modal-close-btn">确定</button>
        `);
        modal.querySelector('.tm-custom-modal-close-btn').addEventListener('click', close);
    }

    showLoginPromptModal(domain) {
        const { modal, close } = createModal(`
            <div class="tm-custom-modal-title">发表评论</div>
            <div class="tm-custom-modal-message">需要有 Jable 登录态才能发表评论，请先登录。</div>
            <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">
                <button class="tm-custom-modal-cancel-btn">取消</button>
                <button class="tm-custom-modal-login-btn">去登录</button>
            </div>
        `);

        modal.querySelector('.tm-custom-modal-cancel-btn').addEventListener('click', close);
        modal.querySelector('.tm-custom-modal-login-btn').addEventListener('click', () => {
            close();
            this.showLoginModal(domain);
        });
    }

    showLoginModal(domain, onSuccess) {
        let provider = null;
        if (window.loginManager && domain) {
            provider = window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));
        }
        if (!provider && window.loginManager) {
            provider = window.loginManager.getMatchingProvider();
        }
        const siteTitle = provider ? (provider.siteKey === 'JABLE' ? 'Jable.tv' : provider.siteKey === 'MISSAV' ? 'MissAV' : provider.siteKey) : 'Jable.tv';

        const { modal, close } = createModal(`
            <div class="tm-custom-modal-title" style="margin-bottom: 15px;">登录 ${siteTitle}</div>
            <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; text-align: left; box-sizing: border-box;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">用户名 / 邮箱</label>
                    <input type="text" class="tm-login-username" placeholder="请输入用户名或邮箱" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">密码</label>
                    <input type="password" class="tm-login-password" placeholder="请输入密码" />
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                    <input type="checkbox" id="tm-login-remember" checked style="cursor: pointer;" />
                    <label for="tm-login-remember" style="font-size: 12px; color: hsl(var(--shadcn-muted-foreground)); cursor: pointer; user-select: none;">记住密码并开启自动登录</label>
                </div>
            </div>
            <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%; margin-top: 20px;">
                <button class="tm-custom-modal-cancel-btn">取消</button>
                <button class="tm-custom-modal-submit-btn">登录</button>
            </div>
        `);

        const cancelBtn = modal.querySelector('.tm-custom-modal-cancel-btn');
        cancelBtn.addEventListener('click', close);

        const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');
        const usernameInput = modal.querySelector('.tm-login-username');
        const passwordInput = modal.querySelector('.tm-login-password');

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
                    } else {
                        setTimeout(() => this.handlePublishComment(), 500);
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
            <div class="tm-custom-modal-title">发表评论</div>
            <textarea class="tm-comment-input-textarea" placeholder="写下你的精彩评论..." maxlength="1000"></textarea>
            <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">
                <button class="tm-custom-modal-cancel-btn">取消</button>
                <button class="tm-custom-modal-submit-btn">提交</button>
            </div>
        `);

        const textarea = modal.querySelector('.tm-comment-input-textarea');
        textarea.focus();

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
