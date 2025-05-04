// ==UserScript==
// @run-at       document-start
// @name         missav_adblk
// @description  |广告屏蔽|自动展开详情|自动高画质|重定向支持|自动登录
// @icon         https://missav.ws/img/favicon.ico
// @namespace    loadingi.local
// @version      1.6
// @author       ch
// @match        *://*.missav.ws/*
// @match        *://*.missav.ai/*
// @match        *://*.missav.com/*
// @match        *://*.thisav.com/*
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @compatible   chrome
// @compatible   firefox
// @compatible   edge
// @compatible   safari
// @license      GPL-3.0-only
// @noframes
// ==/UserScript==

// 重定向missav.com和thisav.com到missav.ws
const url = window.location.href;
if (/^https:\/\/(missav|thisav)\.com/.test(url)) {
    window.location.href = url.replace('missav.com', 'missav.ws').replace('thisav.com', 'missav.ws');
}

(function() {
    'use strict';
    
    /**
     * 工具函数命名空间
     */
    const Utils = {
        /**
         * Toast 通知函数
         */
        Toast(msg, duration = 3000, bgColor = 'rgba(0, 0, 0, 0.8)', textColor = '#fff', position = 'top') {
            let toast = document.createElement('div');
            toast.innerText = msg;
            toast.style.cssText = `
                position: fixed;
                z-index: 100000;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 15px;
                border-radius: 4px;
                color: ${textColor};
                background: ${bgColor};
                font-size: 14px;
                max-width: 80%;
                text-align: center;
                word-break: break-all;
            `;
            
            // 设置位置
            if (position === 'top') {
                toast.style.top = '10%';
            } else if (position === 'bottom') {
                toast.style.bottom = '10%';
            } else if (position === 'center') {
                toast.style.top = '50%';
                toast.style.transform = 'translate(-50%, -50%)';
            }
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 500);
            }, duration);
        },
        
        /**
         * 节流函数 - 限制函数执行频率
         */
        throttle(fn, delay) {
            let lastCall = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    return fn.apply(this, args);
                }
            };
        },
        
        /**
         * 等待DOM元素出现
         */
        waitForElement(selector, timeout = 10000, interval = 100) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                    return resolve(element);
                }
                
                const start = Date.now();
                const intervalId = setInterval(() => {
                    const element = document.querySelector(selector);
                    if (element) {
                        clearInterval(intervalId);
                        return resolve(element);
                    }
                    
                    if (Date.now() - start > timeout) {
                        clearInterval(intervalId);
                        reject(new Error(`等待元素 ${selector} 超时`));
                    }
                }, interval);
            });
        }
    };
    
    /**
     * 多语言系统
     */
    const I18n = {
        // 用户语言
        userLang: (navigator.languages && navigator.languages[0]) || navigator.language || 'en',
        
        // 语言字符串
        strings: {
            'en': {
                Accountnull: 'Error: UserEmail or UserPassword is empty.',
                loginSuccess: 'Login successful, refreshing the page.',
                Networkfailed: 'Status code error.',
                Loginfailed: 'Login failed, incorrect email or password. Check console for error details.',
                autoLogin: 'Auto Login'
            },
            'zh-CN': {
                Accountnull: '邮箱或密码为空',
                loginSuccess: '登录成功，即将刷新页面。',
                Networkfailed: '状态码错误',
                Loginfailed: '登录失败，邮箱或密码错误，可以在控制台查看错误信息。',
                autoLogin: '自动登录'
            },
            'zh-TW': {
                Accountnull: '郵箱或密碼為空',
                loginSuccess: '登錄成功，即將刷新頁面。',
                Networkfailed: '狀態碼錯誤',
                Loginfailed: '登錄失敗，郵箱或密碼錯誤，可以在控制台查看錯誤信息。',
                autoLogin: '自動登錄'
            },
            'ja': {
                Accountnull: 'エラー：メールアドレスまたはパスワードが空です。',
                loginSuccess: 'ログイン成功、ページを更新します。',
                Networkfailed: 'ステータスコードエラー',
                Loginfailed: 'ログインに失敗しました。メールアドレスまたはパスワードが間違っています。エラーの詳細はコンソールで確認できます。',
                autoLogin: '自動ログイン'
            },
            'vi': {
                Accountnull: 'Lỗi: Email hoặc mật khẩu trống.',
                loginSuccess: 'Đăng nhập thành công, đang làm mới trang.',
                Networkfailed: 'Lỗi mã trạng thái.',
                Loginfailed: 'Đăng nhập không thành công, email hoặc mật khẩu không chính xác. Xem chi tiết lỗi trên bảng điều khiển.',
                autoLogin: 'Đăng nhập tự động'
            }
        },
        
        // 翻译函数
        translate(id, lang = '') {
            const selectedLang = lang || this.userLang;
            return (this.strings[selectedLang] || this.strings.en)[id] || this.strings.en[id];
        }
    };
    
    /**
     * 配置管理类
     */
    class AdBlockConfig {
        constructor() {
            // 通用广告CSS选择器
            this.adSelectors = [
                'div[class="space-y-6 mb-6"]', //页面右侧便 视频广告
                'div[class*="root--"][class*="bottomRight--"]', //页面右下角视频广告 
                'div[class="grid md:grid-cols-2 gap-8"]', // 视频下方新域名推广
                'ul[class="mb-4 list-none text-nord14 grid grid-cols-2 gap-2"]', //视频简介下方链接推广
                'div[class="space-y-5 mb-5"]', //页面底部视频广告
                'iframe[src*="ads"]',
                'iframe[src*="banner"]',
                'iframe[src*="pop"]',
                'iframe[data-ad]',
                'iframe[id*="ads"]',
                'iframe[class*="ads"]',
                'iframe:not([src*="plyr.io"])'  // 屏蔽所有非播放器的iframe
            ];
            
            // 自定义样式修改选择器及其对应样式
            this.customStyles = [
                {// 影片列表文字标题完整显示
                    selector: 'div[class="my-2 text-sm text-nord4 truncate"]',
                    styles: 'white-space: normal !important;'
                }
                ,{// 设置页面背景色为黑色
                    selector: 'body',
                    styles: 'background-color: #000000 !important;'
                }
                ,{// 设置z-max元素的z-index
                    selector: 'div[class*="z-max"]',
                    styles: 'z-index: 9000 !important;'
                }
                
                
            ];
            
            // 使用Set存储阻止URL模式，提高查找效率
            this.blockedUrlPatternsSet = new Set([
                'exoclick.com',
                'juicyads.com',
                'popads.net',
                'adsterra.com',
                'trafficjunky.com',
                'adnium.com',
                'ad-maven.com',
                'browser-update.org',
                'mopvip.icu',
                'toppages.pw',
                'cpmstar.com',
                'propellerads.com',
                'tsyndicate.com',
                'syndication.exosrv.com',
                'ads.exosrv.com',
                'tsyndicate.com/sdk',
                'cdn.tsyndicate.com',
                'adsco.re',
                'adscpm.site',
                'a-ads.com',
                'ad-delivery.net',
                'outbrain.com',
                'taboola.com',
                'mgid.com',
                'revcontent.com',
                'adnxs.com',
                'pubmatic.com',
                'rubiconproject.com',
                'openx.net',
                'criteo.com',
                'doubleclick.net'
            ]);
            
            // 将频繁使用的广告关键词预先编译成正则表达式
            this.adKeywordsRegex = /ads|analytics|tracker|affiliate|stat|pixel|banner|pop|click|outstream\.video|vast|vmap|preroll|midroll|postroll|adserve/i;
        }
        
        /**
         * 检查URL是否应当被阻止
         */
        shouldBlockUrl(url) {
            if (!url || typeof url !== 'string') return false;
            
            // 使用预编译的正则表达式检查
            if (this.adKeywordsRegex.test(url)) {
                return true;
            }
            
            // 使用Set的has方法更快地检查特定域名
            for (const pattern of this.blockedUrlPatternsSet) {
                if (url.includes(pattern)) {
                    return true;
                }
            }
            
            return false;
        }
    }

    /**
     * 自动登录管理类
     */
    class AutoLoginManager {
        constructor() {
            this.userEmail = GM_getValue('UserEmail', '');
            this.userPassword = GM_getValue('UserPassword', '');
            this.autoLogin = GM_getValue('AutoLogin', false);
        }
        
        /**
         * 添加自动登录选项到登录表单
         */
        async addAutoLoginOption() {
            try {
                // 等待登录表单加载完成
                const loginRememberContainer = await Utils.waitForElement('form[x-show="currentPage === \'login\'"] .relative.flex.items-start.justify-between');
                
                // 创建自动登录选项
                const autoLoginDiv = document.createElement('div');
                autoLoginDiv.className = 'flex';
                autoLoginDiv.innerHTML = `
                    <div class="flex items-center h-5">
                        <input id="auto_login" type="checkbox" class="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded __text_mode_custom_bg__" ${this.autoLogin ? 'checked' : ''}>
                    </div>
                    <div class="ml-3 text-sm">
                        <label for="auto_login" class="font-medium text-nord4">${I18n.translate('autoLogin')}</label>
                    </div>
                `;
                
                // 获取"记住我"元素
                const rememberMeDiv = loginRememberContainer.querySelector('.flex');
                
                // 在记住我和忘记密码之间插入自动登录选项
                rememberMeDiv.parentNode.insertBefore(autoLoginDiv, rememberMeDiv.nextSibling);
                
                // 监听自动登录复选框变化
                document.getElementById('auto_login').addEventListener('change', () => {
                    this.autoLogin = document.getElementById('auto_login').checked;
                    GM_setValue('AutoLogin', this.autoLogin);
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
                                    this.userEmail = emailInput.value;
                                    this.userPassword = passwordInput.value;
                                    GM_setValue('UserEmail', this.userEmail);
                                    GM_setValue('UserPassword', this.userPassword);
                                }
                            }, 100);
                        });
                    }
                }
            } catch (error) {
                console.error('添加自动登录选项时出错:', error);
            }
        }
        
        /**
         * 登录函数
         */
        login() {
            if (!this.userEmail || !this.userPassword) {
                Utils.Toast(I18n.translate('Accountnull'), 2000, '#FF0000', '#ffffff', 'top');
                return;
            }
            
            fetch('https://missav.ws/cn/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: this.userEmail,
                    password: this.userPassword,
                    remember: true
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Login error:', {
                            status: response.status,
                            statusText: response.statusText,
                            responseText: text
                        });
                        Utils.Toast('Login failed: ' + text, 2000, '#FF0000', '#ffffff', 'top');
                        throw new Error(I18n.translate('Networkfailed'));
                    });
                }
                if (response.headers.get('Content-Type')?.includes('application/json')) {
                    return response.json();
                } else {
                    return response.text().then(text => {
                        console.error(I18n.translate('Loginfailed'), {
                            status: response.status,
                            statusText: response.statusText,
                            responseText: text
                        });
                        Utils.Toast(I18n.translate('Loginfailed'), 2000, '#FF0000', '#ffffff', 'top');
                        throw new Error(I18n.translate('Loginfailed'));
                    });
                }
            })
            .then(data => {
                console.log('Success:', data);
                Utils.Toast(I18n.translate('loginSuccess'), 2000, 'rgb(18, 187, 2)', '#ffffff', 'top');
                location.reload();
            })
            .catch(error => {
                Utils.Toast('An error occurred: ' + error.message, 2000, '#FF0000', '#ffffff', 'top');
            });
        }
        
        /**
         * 检查登录状态
         */
        checkLoginStatus() {
            // 恢复使用原有的有效端点，但添加错误处理
            const url = 'https://missav.ws/api/actresses/1016525/view';
            
            fetch(url, {
                method: 'GET',
                credentials: 'include' // 确保发送cookies
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    // 如果主API失败，尝试使用备用检测方法
                    this.checkLoginByDOM();
                    return null;
                }
            })
            .then(data => {
                if (data) {
                    // 原始逻辑：检查user是否为null
                    if (data.user === null) {
                        if (this.autoLogin && this.userEmail && this.userPassword) {
                            console.log('API检测：用户未登录，尝试自动登录');
                            this.login();
                        }
                    } else {
                        console.debug('API检测：用户已登录');
                    }
                }
            })
            .catch(error => {
                console.debug('API登录状态检查出错，尝试DOM检测:', error.message);
                this.checkLoginByDOM();
            });
        }

        /**
         * 使用DOM元素检测登录状态（备用方法）
         */
        checkLoginByDOM() {
            try {
                // 根据原始代码研究，检查页面上的各种可能表明登录状态的元素
                const loginButton = document.querySelector('button[x-on\\:click="currentPage = \'login\'"]');
                const userAvatar = document.querySelector('.relative.ml-3 img.h-8.w-8.rounded-full');
                const userMenu = document.querySelector('[x-data="{userDropdownOpen: false}"]');
                
                // 如果没有登录按钮或有用户相关元素，说明可能已登录
                const isLoggedIn = !loginButton || userAvatar || userMenu;
                
                if (!isLoggedIn && this.autoLogin && this.userEmail && this.userPassword) {
                    console.log('DOM检测：用户未登录，尝试自动登录');
                    this.login();
                }
                
                return isLoggedIn;
            } catch (error) {
                console.debug('DOM检测登录状态时出错:', error.message);
                // 如果DOM检测也失败，但有登录信息，还是尝试登录
                if (this.autoLogin && this.userEmail && this.userPassword) {
                    console.log('DOM检测失败，仍尝试自动登录');
                    this.login();
                }
                return false;
            }
        }
        
        /**
         * 初始化自动登录功能
         */
        init() {
            this.addAutoLoginOption();
            this.checkLoginStatus();
        }
    }

    /**
     * 样式管理类
     */
    class StyleManager {
        constructor(config) {
            this.config = config;
        }
        
        /**
         * 创建并应用样式
         */
        applyAdBlockStyles() {
            // 广告屏蔽样式
            const adBlockCSS = this.config.adSelectors.join(', ') + 
                ' { display: none !important; visibility: hidden !important; height: 0 !important; min-height: 0 !important; }';
            
            // 自定义样式
            const customCSS = this.config.customStyles.map(item => 
                `${item.selector} { ${item.styles} }`).join('\n');
            
            // 合并所有样式
            GM_addStyle(adBlockCSS + '\n' + customCSS);
        }
    }

    /**
     * DOM清理类
     */
    class DOMCleaner {
        constructor(config) {
            this.config = config;
            this.CLEANUP_THROTTLE = 500; // 节流时间：500ms
            
            // 使用节流函数包装移除广告元素的方法
            this.throttledRemoveAdElements = Utils.throttle(this.removeAdElements.bind(this), this.CLEANUP_THROTTLE);
        }
        
        /**
         * 清理iframe - 优化为只清理新iframe
         */
        cleanIframes(iframeElements = null) {
            const iframes = iframeElements || document.getElementsByTagName('iframe');
            for (let i = 0; i < iframes.length; i++) {
                const iframe = iframes[i];
                if (iframe.src && !iframe.src.includes('plyr.io')) {
                    iframe.remove();
                }
            }
        }
        
        /**
         * 移除广告元素
         */
        removeAdElements(force = false) {
            for (let i = 0; i < this.config.adSelectors.length; i++) {
                try {
                    const elements = document.querySelectorAll(this.config.adSelectors[i]);
                    for (let j = 0; j < elements.length; j++) {
                        elements[j].remove();
                    }
                } catch (e) {
                    // 忽略选择器错误
                }
            }
        }
        
        /**
         * 设置DOM变化监听
         */
        observeDOMChanges() {
            let pendingChanges = false;
            let frameChanges = false;
            let processingTimeout = null;
            
            const processChanges = () => {
                if (pendingChanges) {
                    this.removeAdElements();
                    pendingChanges = false;
                }
                if (frameChanges) {
                    this.cleanIframes();
                    frameChanges = false;
                }
                processingTimeout = null;
            };
            
            const observer = new MutationObserver(mutations => {
                let hasNewNodes = false;
                let hasNewIframes = false;
                
                // 快速检查是否有相关变化
                for (let i = 0; i < mutations.length; i++) {
                    const mutation = mutations[i];
                    if (mutation.addedNodes.length) {
                        hasNewNodes = true;
                        // 检查是否有新增的iframe
                        for (let j = 0; j < mutation.addedNodes.length; j++) {
                            const node = mutation.addedNodes[j];
                            if (node.nodeName === 'IFRAME') {
                                hasNewIframes = true;
                                break;
                            }
                        }
                    }
                    if (hasNewNodes && hasNewIframes) break; // 找到所需信息后立即退出循环
                }
                
                if (hasNewNodes) {
                    pendingChanges = true;
                }
                if (hasNewIframes) {
                    frameChanges = true;
                }
                
                // 使用节流处理DOM变化
                if ((pendingChanges || frameChanges) && !processingTimeout) {
                    processingTimeout = setTimeout(processChanges, 50);
                }
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * 请求拦截类
     */
    class RequestBlocker {
        constructor(config) {
            this.config = config;
        }
                
        /**
         * 拦截XMLHttpRequest和Fetch请求
         */
        blockTrackingRequests() {
            // 拦截XMLHttpRequest
            const originalXHR = XMLHttpRequest.prototype.open;
            const config = this.config;
            
            // 使用普通函数而不是箭头函数，保留正确的this上下文
            XMLHttpRequest.prototype.open = function(method, url) {
                if (typeof url === 'string' && config.shouldBlockUrl(url)) {
                    // 返回一个虚拟方法，避免脚本错误
                    this.send = function(){};
                    this.onload = null;
                    this.onerror = null;
                    return;
                }
                return originalXHR.apply(this, arguments);
            };

            // 拦截Fetch请求
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                // 处理 Request 对象作为参数的情况
                let urlToCheck = url;
                if (url instanceof Request) {
                    urlToCheck = url.url;
                }
                
                if (typeof urlToCheck === 'string' && config.shouldBlockUrl(urlToCheck)) {
                    // 返回一个解析为空的Response，避免错误
                    return Promise.resolve(new Response('', {
                        status: 200,
                        headers: {'Content-Type': 'text/plain'}
                    }));
                }
                return originalFetch.apply(this, arguments);
            };
        }

        /**
         * 拦截iframe加载
         */
        blockIframeLoading() {
            const createElementOriginal = document.createElement;
            const config = this.config;
            
            document.createElement = function(tag) {
                const element = createElementOriginal.call(document, tag);
                if (tag.toLowerCase() === 'iframe') {
                    // 修复：正确实现src属性的拦截
                    let originalSrc = element.src;
                    Object.defineProperty(element, 'src', {
                        set: function(value) {
                            if (typeof value === 'string' && config.shouldBlockUrl(value)) {
                                return;
                            }
                            originalSrc = value;
                        },
                        get: function() {
                            return originalSrc;
                        }
                    });
                    
                    // 监控setAttribute
                    const originalSetAttribute = element.setAttribute;
                    element.setAttribute = function(name, value) {
                        if (name === 'src' && typeof value === 'string' && config.shouldBlockUrl(value)) {
                            return;
                        }
                        return originalSetAttribute.call(this, name, value);
                    };
                }
                return element;
            };
        }
        
        /**
         * 阻止弹窗
         */
        blockPopups() {
            window.open = function() { return null; };
            unsafeWindow.open = function() { return null; };
        }
        
        /**
         * 初始化所有拦截功能
         */
        init() {
            this.blockIframeLoading();
            this.blockTrackingRequests();
            this.blockPopups();
        }
    }

    /**
     * 用户体验增强类
     */
    class UserExperienceEnhancer {
        /**
         * 自动展开视频详细信息
         */
        autoExpandDetails() {
            const expandDetails = () => {
                const showMoreButton = document.querySelector('a.text-nord13.font-medium.flex.items-center');
                if (showMoreButton) {
                    showMoreButton.click();
                }
            };
            
            // 立即尝试展开一次
            expandDetails();
            
            // 如果第一次没成功，稍后再尝试一次（页面可能还在加载中）
            setTimeout(expandDetails, 1500);
        }
        
        /**
         * 自动设置最高画质
         */
        setupAutoHighestQuality() {
            const setHighestQuality = () => {
                try {
                    // 检查播放器
                    const player = window.player || unsafeWindow.player;
                    if (!player?.config?.quality?.options?.length) return false;
                    
                    // 设置最高画质
                    const maxQuality = Math.max(...player.config.quality.options);
                    console.log('[画质] 设置:', maxQuality);
                    
                    // 同时设置属性和方法
                    player.quality = maxQuality;
                    player.config.quality.selected = maxQuality;
                    
                    if (typeof player.quality === 'function') player.quality(maxQuality);
                    return true;
                } catch (e) {
                    return false;
                }
            };

            // 立即尝试一次
            if (setHighestQuality()) return;
            
            // 失败则定时尝试
            let attempts = 0;
            const checkInterval = setInterval(() => {
                if (setHighestQuality() || ++attempts >= 20) {
                    clearInterval(checkInterval);
                }
            }, 500);
            
            // 页面完全加载后再尝试一次
            window.addEventListener('load', setHighestQuality);
        }
        
        /**
         * 初始化所有用户体验增强功能
         */
        init() {
            // DOM加载完成后执行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.autoExpandDetails();
                    this.setupAutoHighestQuality();
                });
            } else {
                this.autoExpandDetails();
                this.setupAutoHighestQuality();
            }
        }
    }

    /**
     * 主类: 广告屏蔽器
     */
    class AdBlocker {
        constructor() {
            this.config = new AdBlockConfig();
            this.styleManager = new StyleManager(this.config);
            this.domCleaner = new DOMCleaner(this.config);
            this.requestBlocker = new RequestBlocker(this.config);
            this.autoLoginManager = new AutoLoginManager();
            this.userExperienceEnhancer = new UserExperienceEnhancer();
        }
        
        /**
         * 防止被检测到AdBlock
         */
        preventDetection() {
            window.AdBlock = false;
            window.adblock = false;
            window.adsbygoogle = { loaded: true };
            unsafeWindow.AdBlock = false;
            unsafeWindow.adblock = false;
            unsafeWindow.adsbygoogle = { loaded: true };
        }
        
        /**
         * 设置定期清理
         */
        setupPeriodicCleaning() {
            // 首次运行强制清理
            this.domCleaner.removeAdElements(true);
            this.domCleaner.observeDOMChanges();
            
            // 减少检查频率，2秒一次
            setInterval(() => this.domCleaner.removeAdElements(), 2000);
        }
        
        /**
         * 初始化
         */
        init() {
            // 防止被检测
            this.preventDetection();
            
            // 应用样式（尽早执行）
            this.styleManager.applyAdBlockStyles();
            
            // 初始化请求拦截器
            this.requestBlocker.init();
            
            // 当DOM加载后执行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPeriodicCleaning());
            } else {
                this.setupPeriodicCleaning();
            }
            
            // 初始化自动登录功能
            this.autoLoginManager.init();
            
            // 初始化用户体验增强功能
            this.userExperienceEnhancer.init();
        }
    }
    
    // 启动广告屏蔽器
    const adBlocker = new AdBlocker();
    adBlocker.init();
})();
