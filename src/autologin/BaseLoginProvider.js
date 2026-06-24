/**
 * 声明式登录提供程序基类 (BaseLoginProvider)
 * 抽离多站点的通用流程，包括同域真实 fetch / 跨域 GM 请求、双重登录态检测、声明式表单 UI 注入和账号收集
 */
import { getLocalStorage, setLocalStorage, waitForElement, Toast } from '../utils/index.js';
import { __ } from '../constants/i18n.js';
import { getSiteDomains } from '../constants/domains.js';
import { CredentialManager } from './CredentialManager.js';

export class BaseLoginProvider {
    /**
     * 构造函数
     * @param {Object} config - 声明式配置 Schema
     */
    constructor(config = {}) {
        this.config = config;
        this.siteKey = config.siteKey || '';
        this.domains = config.domains || getSiteDomains(this.siteKey) || [];
    }

    /**
     * 检查当前网站是否由本提供程序支持
     * @returns {boolean} 是否支持当前网站
     */
    isSupportedSite() {
        const currentDomain = window.location.hostname;
        return this.domains.some(domain => currentDomain.includes(domain));
    }

    /**
     * 获取当前环境下的活动域名 (带协议)
     * @param {string} [domain] - 外部传入的域名
     * @returns {string} 协议 + 域名
     */
    getActiveDomain(domain) {
        if (domain) return domain;
        const currentDomain = window.location.hostname;
        const isMatched = this.domains.some(d => currentDomain.includes(d));
        return isMatched ? window.location.origin : `https://${this.domains[0]}`;
    }

    /**
     * 统一请求方法：同源时使用页面原生 fetch（确保浏览器处理 Set-Cookie 并存入 cookie jar），
     * 跨域时回退到 GM_xmlhttpRequest。
     *
     * @param {string} url - 请求 URL
     * @param {Object} [options] - 请求选项
     * @returns {Promise<Object>} 统一格式的响应对象
     */
    async _request(url, options = {}) {
        const { method = 'GET', headers = {}, body = null, responseType = 'json' } = options;
        const isSameOrigin = url.startsWith(window.location.origin);

        if (isSameOrigin) {
            // 同源：使用页面真实的 fetch（通过 unsafeWindow 访问），确保浏览器处理 Set-Cookie 并存入 cookie jar
            const realFetch = (typeof unsafeWindow !== 'undefined' && unsafeWindow.fetch)
                ? unsafeWindow.fetch.bind(unsafeWindow)
                : (typeof window.fetch === 'function' ? window.fetch.bind(window) : null);

            if (realFetch) {
                try {
                    console.debug(`[BaseLoginProvider] 同源请求，使用原生 fetch: ${method} ${url}`);
                    const fetchOptions = {
                        method,
                        headers,
                        credentials: 'same-origin'
                    };
                    if (body) fetchOptions.body = body;

                    const res = await realFetch(url, fetchOptions);
                    return {
                        ok: res.ok,
                        status: res.status,
                        statusText: res.statusText,
                        headers: res.headers,
                        json: () => res.json(),
                        text: () => res.text()
                    };
                } catch (fetchError) {
                    console.warn(`[BaseLoginProvider] 原生 fetch 失败，降级到 GM_xmlhttpRequest:`, fetchError.message);
                }
            }
        }

        // 跨域或沙盒 fetch 不可用：回退使用 GM_xmlhttpRequest
        console.debug(`[BaseLoginProvider] 使用 GM_xmlhttpRequest: ${method} ${url}`);
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'function') {
                reject(new Error('GM_xmlhttpRequest is not available'));
                return;
            }
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                data: body,
                withCredentials: true,
                onload: (res) => {
                    resolve({
                        ok: res.status >= 200 && res.status < 300,
                        status: res.status,
                        statusText: res.statusText,
                        headers: {
                            get: (name) => {
                                const headersText = res.responseHeaders || '';
                                const match = headersText.match(new RegExp(`^${name}:\\s*(.*)$`, 'im'));
                                return match ? match[1].trim() : null;
                            }
                        },
                        json: async () => JSON.parse(res.responseText),
                        text: async () => res.responseText
                    });
                },
                onerror: reject
            });
        });
    }

    /**
     * 检查登录状态 (API + DOM 双重判定)
     * @param {string} [domain] - 指定域名
     * @returns {Promise<boolean>} 是否已登录
     */
    async checkLoginStatus(domain) {
        try {
            // 1. 尝试使用 API 探测
            const isLoggedIn = await this.checkLoginByAPI(domain);
            if (isLoggedIn !== null) {
                return isLoggedIn;
            }

            // 2. API 探测失败/不支持，降级使用 DOM 检测
            return this.checkLoginByDOM();
        } catch (error) {
            console.error(`[BaseLoginProvider] 检查登录状态出错 (${this.siteKey}):`, error);
            return false;
        }
    }

    /**
     * 通过 API 检测登录状态
     * @param {string} [domain] - 目标域名
     * @returns {Promise<boolean|null>} 登录状态或 null (不支持/探测失败)
     */
    async checkLoginByAPI(domain) {
        const apis = this.config.apis;
        if (!apis || !apis.checkStatus) return null;

        try {
            const activeOrigin = this.getActiveDomain(domain);
            const url = `${activeOrigin}${apis.checkStatus}`;
            const response = await this._request(url);
            
            if (!response.ok) {
                return null;
            }

            // 如果子类覆盖了检测函数，直接调用子类定制版
            if (typeof this.isLoggedInByAPIResponse === 'function') {
                return this.isLoggedInByAPIResponse(response);
            }

            const json = await response.json();
            const data = json.data || json;
            // 默认检测逻辑：看 data.user 或 json.user 等字段是否存在且不为空
            return data && data.user !== null && data.user !== undefined;
        } catch (error) {
            console.debug(`[BaseLoginProvider] API 检查登录状态失败 (${this.siteKey}):`, error.message);
            return null;
        }
    }

    /**
     * 通过 DOM 元素检测登录状态
     * @returns {boolean} 是否已登录
     */
    checkLoginByDOM() {
        if (!this.isSupportedSite()) return false;
        const selectors = this.config.selectors;
        if (!selectors) return false;

        try {
            const avatar = selectors.avatar ? document.querySelector(selectors.avatar) : null;
            const userMenu = selectors.userMenu ? document.querySelector(selectors.userMenu) : null;
            const loginBtn = selectors.loginBtn ? document.querySelector(selectors.loginBtn) : null;

            // 1. 如果能找到头像或用户菜单，说明已登录
            if (avatar || userMenu) return true;

            // 2. 如果找到了明确的登录按钮，说明未登录
            if (loginBtn) return false;

            // 3. 默认兜底假定未登录
            return false;
        } catch (error) {
            console.debug(`[BaseLoginProvider] DOM 检查登录状态失败 (${this.siteKey}):`, error.message);
            return false;
        }
    }

    /**
     * 声明式添加自动登录选项到登录表单，并监听用户手动登录成功以收集账号密码
     * @param {Function} [onLoginInfoChange] - 凭据变更回调
     */
    async addAutoLoginOption(onLoginInfoChange) {
        const selectors = this.config.selectors;
        if (!selectors || !selectors.loginForm) return;

        try {
            // 等待登录表单加载完成
            const form = await waitForElement(selectors.loginForm);
            if (!form) return;

            // 检查是否已经注入过，避免重复注入
            if (form.querySelector('.mp-autologin-container')) return;

            // 创建自动登录勾选框的 DOM 结构
            const autoLoginContainer = document.createElement('div');
            autoLoginContainer.className = 'mp-autologin-container';
            autoLoginContainer.style.margin = '10px 0';
            autoLoginContainer.style.display = 'flex';
            autoLoginContainer.style.alignItems = 'center';
            autoLoginContainer.style.gap = '8px';
            autoLoginContainer.innerHTML = `
                <input id="mp_auto_login" type="checkbox" style="cursor: pointer; width: 16px; height: 16px;">
                <label for="mp_auto_login" style="cursor: pointer; font-size: 13px; color: #ccc;">${__('login_autoLogin') || '自动登录 (Miss Player)'}</label>
            `;

            // 寻找合适的位置插入自动登录勾选框
            const submitBtn = selectors.submitBtn ? form.querySelector(selectors.submitBtn) : (form.querySelector('button[type="submit"]') || form.querySelector('input[type="submit"]'));
            if (submitBtn && submitBtn.parentNode) {
                submitBtn.parentNode.insertBefore(autoLoginContainer, submitBtn);
            } else {
                form.appendChild(autoLoginContainer);
            }

            // 读取已持久化的自动登录状态 (默认为勾选状态)
            const creds = CredentialManager.get(this.siteKey);
            const autoLoginCheckbox = document.getElementById('mp_auto_login');
            if (autoLoginCheckbox) {
                autoLoginCheckbox.checked = creds.autoLogin;
                
                // 监听勾选状态变化并保存
                autoLoginCheckbox.addEventListener('change', () => {
                    const isChecked = autoLoginCheckbox.checked;
                    CredentialManager.save(this.siteKey, creds.email, creds.password, isChecked);
                    if (onLoginInfoChange) {
                        onLoginInfoChange({ autoLogin: isChecked });
                    }
                });
            }

            // 监听用户提交动作，捕获账号密码
            const captureCredentials = () => {
                setTimeout(() => {
                    const usernameInput = form.querySelector(selectors.usernameInput);
                    const passwordInput = form.querySelector(selectors.passwordInput);
                    const isAutoChecked = autoLoginCheckbox ? autoLoginCheckbox.checked : false;

                    if (usernameInput && passwordInput && isAutoChecked) {
                        const email = usernameInput.value;
                        const password = passwordInput.value;
                        if (email && password) {
                            CredentialManager.save(this.siteKey, email, password, true);
                            if (onLoginInfoChange) {
                                onLoginInfoChange({ email, password, autoLogin: true });
                            }
                        }
                    }
                }, 100);
            };

            // 同时支持 submit 事件拦截以及 submit 按钮 click 拦截（确保成功捕获）
            form.addEventListener('submit', captureCredentials);
            if (submitBtn) {
                submitBtn.addEventListener('click', captureCredentials);
            }
        } catch (error) {
            console.error(`[BaseLoginProvider] 表单 UI 注入失败 (${this.siteKey}):`, error);
        }
    }

    /**
     * 默认保活逻辑 (定期被 LoginManager 调用)
     */
    async keepAlive() {
        const creds = CredentialManager.get(this.siteKey);
        if (!creds.email || !creds.password || !creds.autoLogin) {
            return;
        }

        const activeDomain = this.getActiveDomain();
        console.log(`[BaseLoginProvider] 执行后台保活登录态检查: ${this.siteKey}...`);

        try {
            const isLoggedIn = await this.checkLoginStatus(activeDomain);
            if (!isLoggedIn) {
                console.log(`[BaseLoginProvider] 登录态失效，尝试后台自动重新登录 (不刷新页面): ${this.siteKey}...`);
                await this.login(creds.email, creds.password, { reload: false, silent: true });
            } else {
                console.log(`[BaseLoginProvider] 登录态在线 (${this.siteKey})。`);
            }
        } catch (error) {
            console.error(`[BaseLoginProvider] 保活检查异常 (${this.siteKey}):`, error);
        }
    }

    /**
     * 登录行为 (由子类继承并细化提交参数和特殊 Header 处理)
     * @param {string} username 
     * @param {string} password 
     * @param {Object} [options]
     */
    async login(username, password, options = {}) {
        throw new Error('login method must be implemented by subclasses');
    }

    /**
     * 重定向到登录页面
     * @param {string} [domain] 
     */
    redirectLogin(domain) {
        throw new Error('redirectLogin method must be implemented by subclasses');
    }
}
