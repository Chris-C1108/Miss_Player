/**
 * MissAV网站登录提供程序
 */
import { LoginUtils } from './utils.js';
import { I18n } from '../constants/i18n.js';

export class MissavLoginProvider {
    /**
     * 构造函数
     */
    constructor() {
        // 域名列表 - 支持多个平行域名
        this.domains = [
            'missav.ws',
            'missav.ai',
            'missav.com',
            'thisav.com'
        ];
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
     * 登录处理函数
     * @param {string} email - 用户邮箱
     * @param {string} password - 用户密码
     * @returns {Promise<boolean>} 登录是否成功
     */
    async login(email, password) {
        if (!email || !password) {
            LoginUtils.toast(I18n.translate('accountNull'), 2000, '#FF0000', '#ffffff', 'top');
            return false;
        }
        
        try {
            // 使用MissAV的登录API
            const response = await fetch('https://missav.ws/cn/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    remember: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('登录错误:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: errorText
                });
                LoginUtils.toast(`登录失败: ${errorText}`, 2000, '#FF0000', '#ffffff', 'top');
                throw new Error(I18n.translate('networkFailed'));
            }

            // 处理响应
            let data;
            if (response.headers.get('Content-Type')?.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error(I18n.translate('loginFailed'), {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: text
                });
                LoginUtils.toast(I18n.translate('loginFailed'), 2000, '#FF0000', '#ffffff', 'top');
                throw new Error(I18n.translate('loginFailed'));
            }

            console.log('登录成功:', data);
            LoginUtils.toast(I18n.translate('loginSuccess'), 2000, 'rgb(18, 187, 2)', '#ffffff', 'top');
            
            // 登录成功后刷新页面
            setTimeout(() => {
                location.reload();
            }, 1000);
            
            return true;
        } catch (error) {
            LoginUtils.toast(`错误发生: ${error.message}`, 2000, '#FF0000', '#ffffff', 'top');
            return false;
        }
    }

    /**
     * 检查登录状态
     * @returns {Promise<boolean>} 是否已登录
     */
    async checkLoginStatus() {
        try {
            // 尝试使用API检测登录状态
            const isLoggedIn = await this.checkLoginByAPI();
            if (isLoggedIn !== null) {
                return isLoggedIn;
            }
            
            // API检测失败时，尝试DOM检测
            return this.checkLoginByDOM();
        } catch (error) {
            console.error('检查登录状态时出错:', error);
            return false;
        }
    }
    
    /**
     * 使用API检测登录状态
     * @returns {Promise<boolean|null>} 登录状态或null(检测失败)
     */
    async checkLoginByAPI() {
        try {
            const url = 'https://missav.ws/api/actresses/1016525/view';
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include' // 确保发送cookies
            });
            
            if (!response.ok) {
                return null; // API检测失败
            }
            
            const data = await response.json();
            return data.user !== null; // 用户不为null则已登录
        } catch (error) {
            console.debug('API登录状态检查出错:', error.message);
            return null; // 检测过程出错
        }
    }
    
    /**
     * 使用DOM元素检测登录状态
     * @returns {boolean} 是否已登录
     */
    checkLoginByDOM() {
        try {
            // 检查页面上的各种可能表明登录状态的元素
            const loginButton = document.querySelector('button[x-on\\:click="currentPage = \'login\'"]');
            const userAvatar = document.querySelector('.relative.ml-3 img.h-8.w-8.rounded-full');
            const userMenu = document.querySelector('[x-data="{userDropdownOpen: false}"]');
            
            // 如果没有登录按钮或有用户相关元素，说明可能已登录
            return !loginButton || userAvatar || userMenu;
        } catch (error) {
            console.debug('DOM检测登录状态时出错:', error.message);
            return false;
        }
    }
    
    /**
     * 添加自动登录选项到登录表单
     * @param {Function} onLoginInfoChange - 登录信息变更回调
     * @returns {Promise<void>}
     */
    async addAutoLoginOption(onLoginInfoChange) {
        try {
            // 等待登录表单加载完成
            const loginRememberContainer = await LoginUtils.waitForElement('form[x-show="currentPage === \'login\'"] .relative.flex.items-start.justify-between');
            
            // 创建自动登录选项
            const autoLoginDiv = document.createElement('div');
            autoLoginDiv.className = 'flex';
            autoLoginDiv.innerHTML = `
                <div class="flex items-center h-5">
                    <input id="auto_login" type="checkbox" class="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded __text_mode_custom_bg__">
                </div>
                <div class="ml-3 text-sm">
                    <label for="auto_login" class="font-medium text-nord4">${I18n.translate('autoLogin')}</label>
                </div>
            `;
            
            // 获取"记住我"元素
            const rememberMeDiv = loginRememberContainer.querySelector('.flex');
            
            // 在记住我和忘记密码之间插入自动登录选项
            rememberMeDiv.parentNode.insertBefore(autoLoginDiv, rememberMeDiv.nextSibling);
            
            // 加载自动登录设置状态，默认为勾选状态
            const autoLogin = LoginUtils.getValue('autoLogin', true);
            document.getElementById('auto_login').checked = autoLogin;
            
            // 监听自动登录复选框变化
            document.getElementById('auto_login').addEventListener('change', () => {
                const isAutoLogin = document.getElementById('auto_login').checked;
                LoginUtils.setValue('autoLogin', isAutoLogin);
                if (onLoginInfoChange) {
                    onLoginInfoChange({ autoLogin: isAutoLogin });
                }
            });
            
            // 监听登录表单提交
            const loginForm = document.querySelector('form[x-show="currentPage === \'login\'"]');
            if (loginForm) {
                // 监听登录按钮点击
                const loginButton = loginForm.querySelector('button[type="submit"]');
                if (loginButton) {
                    loginButton.addEventListener('click', () => {
                        setTimeout(() => {
                            const emailInput = document.getElementById('login_email');
                            const passwordInput = document.getElementById('login_password');
                            const autoLoginCheckbox = document.getElementById('auto_login');
                            
                            if (emailInput && passwordInput && autoLoginCheckbox && autoLoginCheckbox.checked) {
                                const email = emailInput.value;
                                const password = passwordInput.value;
                                
                                // 保存登录信息
                                LoginUtils.setValue('userEmail', email);
                                LoginUtils.setValue('userPassword', password);
                                
                                if (onLoginInfoChange) {
                                    onLoginInfoChange({
                                        email,
                                        password,
                                        autoLogin: true
                                    });
                                }
                            }
                        }, 100);
                    });
                }
            }
        } catch (error) {
            console.error('添加自动登录选项时出错:', error);
        }
    }
} 