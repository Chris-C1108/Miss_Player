/**
 * Jable.tv 网站登录及评论提供程序
 */
import { BaseLoginProvider } from './BaseLoginProvider.js';
import { CrossDomainBridge } from './CrossDomainBridge.js';
import { getSiteDomains } from '../constants/domains.js';
import { Toast } from '../utils/index.js';

/**
 * 递归格式化错误信息，避免输出 [object Object]
 * @param {*} errors - 错误信息对象、数组或字符串
 * @param {string} defaultMsg - 默认错误信息
 * @returns {string} 格式化后的错误文本
 */
function formatErrorMessage(errors, defaultMsg = '操作失败') {
    if (!errors) return defaultMsg;
    if (typeof errors === 'string') return errors;
    if (Array.isArray(errors)) {
        if (errors.length === 0) return defaultMsg;
        return formatErrorMessage(errors[0], defaultMsg);
    }
    if (typeof errors === 'object') {
        if (errors instanceof Error) return errors.message;
        if (errors.message && typeof errors.message === 'string') return errors.message;
        if (errors.msg && typeof errors.msg === 'string') return errors.msg;
        if (errors.error && typeof errors.error === 'string') return errors.error;
        const keys = Object.keys(errors);
        if (keys.length === 0) return defaultMsg;
        return formatErrorMessage(errors[keys[0]], defaultMsg);
    }
    return String(errors);
}

export class JableLoginProvider extends BaseLoginProvider {
    constructor() {
        super({
            siteKey: 'JABLE',
            domains: getSiteDomains('JABLE'),
            selectors: {
                loginForm: 'form[action*="/login/"]',
                usernameInput: 'input[name="username"]',
                passwordInput: 'input[name="pass"]',
                submitBtn: 'button[type="submit"], input[type="submit"]',
                avatar: '.user-avatar',
                loginBtn: 'a[href*="login"]'
            }
        });

        // 启动影子代理 broker (如果是 Jable 页面)
        this.checkAndStartShadowBroker();
    }

    /**
     * 检查当前页面是否是 Jable，若是则启动影子总线监听
     */
    checkAndStartShadowBroker() {
        if (!this.isSupportedSite()) return;

        CrossDomainBridge.startBroker(this.siteKey, {
            'PUBLISH_COMMENT': async (payload) => {
                const { commentText, videoCode, videoId, commentFormHtml, targetUrl } = payload;
                let commentForm = null;
                if (commentFormHtml) {
                    const doc = new DOMParser().parseFromString(commentFormHtml, 'text/html');
                    commentForm = doc.querySelector('form');
                }

                // 本地执行发表评论（共享同源 Cookie）
                return await this.publishComment(commentText, {
                    videoCode,
                    videoId,
                    commentForm,
                    targetUrl,
                    domain: `https://${window.location.hostname}`
                });
            }
        });
    }

    /**
     * 重写登录状态检查 (Jable 没有专门的 API 检测，需要使用 DOM 检测与首页 HTML 请求判定)
     */
    async checkLoginStatus(domain) {
        const activeDomain = this.getActiveDomain(domain);
        
        // 1. 如果在 Jable 本地页面，直接通过 DOM 探测
        if (this.isSupportedSite()) {
            const isLogged = this.checkLoginByDOM();
            this.cacheLoginStatus(isLogged);
            return isLogged;
        }

        // 2. 如果是跨域调用，请求首页并分析 HTML 关键字判断登录态
        try {
            const response = await this._request(`${activeDomain}/`);
            if (!response.ok) {
                return this.getCachedLoginStatus() ?? false;
            }

            const html = await response.text();

            // 如果遇到了 Cloudflare 验证拦截，保留之前的缓存登录状态，绝不误判覆盖为未登录
            if (html.includes('cf-challenge') || html.includes('Cloudflare') || html.includes('Just a moment') || html.includes('Checking your browser')) {
                console.warn('[JableLoginProvider] 跨域登录探测遇到 Cloudflare 防护，维持缓存状态');
                return this.getCachedLoginStatus() ?? false;
            }

            const isLogged = html.includes('/logout/') || 
                   html.includes('user-avatar') || 
                   (!html.includes('/login/') && html.includes('member'));
            this.cacheLoginStatus(isLogged);
            return isLogged;
        } catch (e) {
            console.error('[JableLoginProvider] 跨域检查登录态异常:', e);
            return this.getCachedLoginStatus() ?? false;
        }
    }

    /**
     * 重写 DOM 检测，适配 Jable 特殊的 DOM 状态
     */
    checkLoginByDOM() {
        if (!this.isSupportedSite()) return false;
        try {
            const logoutBtn = document.querySelector('a[href*="logout"]') || document.querySelector('.user-avatar');
            const loginBtn = document.querySelector('a[href*="login"]');
            return !!logoutBtn || !loginBtn;
        } catch (e) {
            console.debug('[JableLoginProvider] DOM 检查登录态出错:', e);
            return false;
        }
    }

    /**
     * 执行登录
     */
    async login(username, password, options = {}) {
        let domain = '';
        let silent = false;
        if (typeof options === 'string') {
            domain = options;
        } else if (options && typeof options === 'object') {
            domain = options.domain || '';
            silent = !!options.silent;
        }

        const activeDomain = this.getActiveDomain(domain);
        if (!username || !password) {
            if (!silent) Toast('用户名和密码不能为空', 2000, 'error');
            return false;
        }

        try {
            const body = new URLSearchParams();
            body.append('username', username);
            body.append('pass', password);
            body.append('remember_me', '1');
            body.append('action', 'login');
            body.append('email_link', `${activeDomain}/email/`);
            body.append('format', 'json');
            body.append('mode', 'async');

            const response = await this._request(`${activeDomain}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest',
                    'referer': `${activeDomain}/`,
                    'origin': activeDomain
                },
                body: body.toString()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('[JableLoginProvider] 登录响应结果:', result);
            
            if (result.status === 'success' || (result.html && !result.html.includes('error-field'))) {
                this.cacheLoginStatus(true);
                if (!silent) Toast('Jable.tv 登录成功', 2000, 'success');
                return true;
            } else if (result.errors) {
                const errMsg = formatErrorMessage(result.errors, '登录失败');
                if (!silent) Toast(`登录失败: ${errMsg}`, 3000, 'error');
                return false;
            } else {
                if (!silent) Toast('登录失败，请检查账号和密码', 3000, 'error');
                return false;
            }
        } catch (error) {
            console.error('[JableLoginProvider] 登录发生异常:', error);
            if (!silent) Toast(`登录出错: ${error.message}`, 2000, 'error');
            return false;
        }
    }

    /**
     * 重定向到登录页
     */
    redirectLogin(domain) {
        const activeDomain = this.getActiveDomain(domain);
        if (typeof GM_openInTab === 'function') {
            GM_openInTab(`${activeDomain}/login/`, { active: true, insert: true, setParent: true });
        } else {
            window.open(`${activeDomain}/login/`, '_blank');
        }
    }

    /**
     * 通过影子通道提交评论
     */
    async publishCommentViaShadow(commentText, { videoCode, videoId, commentForm, targetUrl, domain }) {
        let commentFormHtml = '';
        if (commentForm) {
            const container = document.createElement('div');
            container.appendChild(commentForm.cloneNode(true));
            commentFormHtml = container.innerHTML;
        }

        return await CrossDomainBridge.sendCommand(this.siteKey, 'PUBLISH_COMMENT', {
            commentText,
            videoCode,
            videoId,
            commentFormHtml,
            targetUrl
        });
    }

    /**
     * 发表评论
     */
    async publishComment(commentText, { videoCode, videoId, commentForm, targetUrl, domain }) {
        if (!commentText) {
            Toast('评论内容不能为空', 2000, 'warning');
            return false;
        }
        if (commentText.length < 3) {
            Toast('评论内容太少，至少输入3个字', 2000, 'warning');
            return false;
        }

        // 检查当前是否在 Jable 本地页面运行
        const isJableLocal = this.isSupportedSite();

        // 如果不是在 Jable 本地，且检测到活动中的影子通道，优先走影子通道发表
        if (!isJableLocal) {
            const isShadowActive = await CrossDomainBridge.checkShadowActive(this.siteKey);
            if (isShadowActive) {
                console.log('[JableLoginProvider] 检测到 Jable 影子通道在线，优先使用影子协同发表评论');
                const success = await this.publishCommentViaShadow(commentText, { videoCode, videoId, commentForm, targetUrl, domain });
                if (success) {
                    return true;
                }
                console.log('[JableLoginProvider] 影子通道发表失败，尝试降级使用 API 直连方式提交');
            } else {
                console.log('[JableLoginProvider] 未检测到活动中的 Jable 影子通道，使用 API 直连提交');
            }
        }

        const activeDomain = this.getActiveDomain(domain);
        const activeUrl = targetUrl || `${activeDomain}/videos/${videoCode.toLowerCase()}/`;

        const bodyParams = new URLSearchParams();
        if (commentForm) {
            commentForm.querySelectorAll('input').forEach(input => {
                if (input.name && input.type !== 'submit') {
                    if (input.name !== 'format' && input.name !== 'mode') {
                        bodyParams.append(input.name, input.value);
                    }
                }
            });
            const formTextarea = commentForm.querySelector('textarea');
            const textareaName = formTextarea ? formTextarea.name : 'comment';
            bodyParams.append(textareaName, commentText);
        } else {
            bodyParams.append('action', 'add_comment');
            if (videoId) {
                bodyParams.append('video_id', videoId);
            }
            bodyParams.append('comment', commentText);
        }

        // 强制附加 AJAX JSON 响应参数
        if (!bodyParams.has('format')) {
            bodyParams.append('format', 'json');
        }
        if (!bodyParams.has('mode')) {
            bodyParams.append('mode', 'async');
        }

        let actionUrl = commentForm ? (commentForm.getAttribute('action') || '') : '';
        if (actionUrl.startsWith('/')) {
            actionUrl = `${activeDomain}${actionUrl}`;
        } else if (!actionUrl.startsWith('http')) {
            actionUrl = activeUrl;
        }

        console.log(`[JableLoginProvider] 正在发表评论: ${actionUrl}`);

        try {
            const response = await this._request(actionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-requested-with': 'XMLHttpRequest',
                    'referer': activeUrl,
                    'origin': activeDomain
                },
                body: bodyParams.toString()
            });

            if (response.status === 200 || response.status === 302) {
                const resHtml = await response.text();
                
                // 尝试解析为 JSON
                try {
                    const json = JSON.parse(resHtml);
                    console.log('[JableLoginProvider] 评论发表接口 JSON 响应:', json);
                    if (json.status === 'success') {
                        Toast('评论发表成功！', 2000, 'success');
                        return true;
                    } else if (json.errors) {
                        const errMsg = formatErrorMessage(json.errors, '评论发表失败');
                        Toast(`提交失败: ${errMsg}`, 3000, 'error');
                        return false;
                    }
                } catch (e) {
                    console.debug('[JableLoginProvider] 响应解析为 JSON 失败，退回到 HTML 检查', e);
                }

                if (resHtml.includes('error-field') || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
                    const docErr = new DOMParser().parseFromString(resHtml, 'text/html');
                    const errEl = docErr.querySelector('.error') || docErr.querySelector('.err') || docErr.querySelector('.message-error');
                    const errMsg = errEl ? errEl.textContent.trim() : '评论提交失败，可能包含敏感词或触发了频率限制。';
                    Toast(errMsg, 3000, 'error');
                    return false;
                } else {
                    Toast('评论发表成功！', 2000, 'success');
                    return true;
                }
            } else {
                Toast(`提交失败: HTTP ${response.status}`, 2000, 'error');
                return false;
            }
        } catch (err) {
            console.error('[JableLoginProvider] 发表评论失败:', err);
            Toast('网络请求出错，请重试', 2000, 'error');
            return false;
        }
    }
}
