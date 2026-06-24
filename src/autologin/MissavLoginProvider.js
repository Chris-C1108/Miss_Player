/**
 * MissAV 网站登录提供程序
 */
import { BaseLoginProvider } from './BaseLoginProvider.js';
import { getSiteDomains } from '../constants/domains.js';
import { Toast } from '../utils/index.js';
import { __ } from '../constants/i18n.js';

/**
 * 获取 Cookie
 * @param {string} name - Cookie 键名
 * @returns {string|null} Cookie 值
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
}

export class MissavLoginProvider extends BaseLoginProvider {
    constructor() {
        super({
            siteKey: 'MISSAV',
            domains: getSiteDomains('MISSAV'),
            selectors: {
                loginForm: 'form[x-show="currentPage === \'login\'"]',
                usernameInput: 'input[id="login_email"]',
                passwordInput: 'input[id="login_password"]',
                submitBtn: 'button[type="submit"]',
                avatar: '.relative.ml-3 img.h-8.w-8.rounded-full',
                userMenu: '[x-data="{userDropdownOpen: false}"]',
                loginBtn: 'button[x-on\\:click="currentPage = \'login\'"]'
            },
            apis: {
                checkStatus: '/api/actresses/1016525/view',
                login: '/api/login'
            }
        });
    }

    /**
     * 实现 MissAV 的具体登录行为
     */
    async login(email, password, options = {}) {
        const { reload = true, silent = false } = options;
        if (!email || !password) {
            if (!silent) Toast(__('login_accountNull') || '账号和密码不能为空', 2000, 'error');
            return false;
        }

        try {
            // 获取 XSRF-TOKEN Cookie 用于跨域 CSRF 验证
            const xsrfCookie = getCookie('XSRF-TOKEN');
            const activeOrigin = this.getMissavOrigin();
            const apiUrl = `${activeOrigin}/api/login`;

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*'
            };

            if (xsrfCookie) {
                headers['x-xsrf-token'] = xsrfCookie;
            }

            // 使用基类的统一请求方法 (处理同源 fetch 和跨域 GM)
            const response = await this._request(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    email: email,
                    password: password,
                    remember: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[MissavLoginProvider] 登录返回错误:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: errorText
                });
                if (!silent) Toast(`登录失败: ${errorText}`, 2000, 'error');
                throw new Error(__('login_networkFailed') || '网络请求失败');
            }

            const data = await response.json();
            console.log('[MissavLoginProvider] 登录成功:', data);
            if (!silent) Toast(__('login_success') || '登录成功', 2000, 'success');

            if (reload) {
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }

            return true;
        } catch (error) {
            if (!silent) Toast(`错误发生: ${error.message}`, 2000, 'error');
            return false;
        }
    }

    /**
     * 辅助获取 Missav 活动源域名 (向下兼容原本实现)
     */
    getMissavOrigin() {
        return this.getActiveDomain();
    }

    /**
     * 实现 MissAV 重定向登录行为
     */
    redirectLogin(domain) {
        const activeDomain = this.getActiveDomain(domain);
        const loginButton = document.querySelector('button[x-on\\:click="currentPage = \'login\'"]') || 
                            document.querySelector('button[x-on\\:click*="login"]') || 
                            document.querySelector('a[href*="login"]');
        if (loginButton) {
            loginButton.click();
            Toast('请在页面登录窗口中完成登录', 3000, 'info');
        } else {
            const redirectUrl = `${activeDomain}/cn/login`;
            if (typeof GM_openInTab === 'function') {
                GM_openInTab(redirectUrl, { active: true, insert: true, setParent: true });
            } else {
                window.open(redirectUrl, '_blank');
            }
        }
    }
}