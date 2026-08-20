
import { FloatingButton } from './player/ui/FloatingButton.js';
import { PlayerState } from './player/state/PlayerState.js';
import { initAutoLogin, CrossDomainBridge } from './autologin/index.js';
import AdBlocker from './adblock';
import { initUserExperienceEnhancer, earlyUrlRedirector } from './userExperienceEnhancer';
import { I18n, __ } from './constants/i18n.js';
import { getVideoCodeFromUrl, fetchJavLibraryVideoId, fetchJavLibraryData } from './player/controls/CommentScraper.js';
import { CommentPanel } from './player/controls/CommentPanel.js';
import { isSiteDomain } from './constants/domains.js';
import { logger } from './utils/logger.js';
import { telemetry } from './telemetry';

// 确保最早执行URL重定向检查
earlyUrlRedirector.checkAndRedirect();

/**
 * 配置viewport以支持iOS安全区域
 */
function setupViewport() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // 如果页面中没有viewport meta标签，则创建一个
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    
    // 更新viewport内容，添加viewport-fit=cover以支持安全区域，并限制缩放以防移动端意外放大
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // 监听输入框失焦事件：当软键盘收起后，自动复位页面滚动，杜绝 Safari 页面残留偏移
    document.addEventListener('focusout', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
            window.scrollTo(0, 0);
        }
    });

    console.log(`[${__('scriptName')}] ${__('viewportConfigured')}`);
}

/**
 * 脚本入口函数
 */
(function() {
    'use strict';

    // =====================================================================
    //  iframe 环境守卫：移除 noframes 后需要手动过滤
    //  - 如果在 iframe 中 且 不在 JAVLibrary 域名上 → 立刻退出
    //  - 如果在 iframe 中 且 在 JAVLibrary 域名上 → 继续执行 (iframe broker 模式)
    // =====================================================================
    const isInIframe = (window.self !== window.top);
    if (isInIframe && !isSiteDomain('JAVLIBRARY')) {
        return; // 非 JAVLib 的 iframe 环境，不注入任何逻辑
    }

    // 全局状态管理和播放器实例
    let playerState = null;
    let videoPlayerInstance = null;

    /**
     * 注入CSS样式
     */
    function injectStyles() {
        // 确保样式只注入一次
        if (document.getElementById('tm-player-styles')) return;
        
        // 配置viewport以支持安全区域
        setupViewport();
        
        // 注入CSS变量和样式
        require('./player/ui/style.css');
        
        // 控制台日志 - 便于调试
        console.log(`[${__('scriptName')}] ${__('stylesInjected')}`);
    }
    
    /**
     * 启动脚本
     */
    async function startScript() {
        try {
            // 触发 App 初始化心跳遥测上报 (6小时内防重)
            telemetry.trackAppInit();

            // 检查是否在 JAVLibrary 域名上
            if (isSiteDomain('JAVLIBRARY')) {
                handleJavLibraryVerification();
                return; // 提前退出，不在 JAVLibrary 注入播放器等无关逻辑
            }

            // 首先注入样式
            injectStyles();
            
            // 初始化用户体验增强模块（包含URL重定向功能）
            // 传递true以跳过重定向检查，因为已经在前面执行过了
            const userExperienceEnhancer = initUserExperienceEnhancer(true);
            console.log(`[${__('scriptName')}] ${__('enhancerInitialized')}`);
            
            // 创建状态管理实例
            playerState = new PlayerState();
            
            // 加载设置
            playerState.loadSettings();

            // 创建浮动按钮实例并初始化
            const floatingButton = new FloatingButton({
                playerState
            });
            
            // 初始化浮动按钮
            floatingButton.init();
            
            // 初始化自动登录模块
            const loginManager = await initAutoLogin();
            if (loginManager) {
                console.log(`[${__('scriptName')}] ${__('loginModuleInitialized')}`);
                window.loginManager = loginManager;
            }
            
            // 初始化广告屏蔽模块
            const adBlocker = new AdBlocker();
            adBlocker.init();
            
            // 控制台日志 - 便于调试
            console.log(`[${__('scriptName')}] ${__('initializationComplete')}`);
        } catch (error) {
            console.error(`[${__('scriptName')}] ${__('initializationFailed')}:`, error);
        }
    }

    /**
     * JAVLibrary 验证协同处理逻辑
     */
    function handleJavLibraryVerification() {
        const isIframeBroker = isInIframe;
        const startTime = Date.now();
        let reported = false;
        logger.log(`检测到运行在 JAVLibrary 域名上，启动验证协同助手。${isIframeBroker ? ' (iframe broker 模式)' : ''}`);

        // 启动 JAVLibrary 影子通道监听，提供本地同源拉取服务，完全绕过 Cloudflare 跨域拦截
        CrossDomainBridge.startBroker('JAVLIBRARY', {
            'FETCH_JAVLIB_DATA': async (payload) => {
                const { avcode, page } = payload;
                logger.log(`[ShadowBroker] 收到 JAVLibrary 同源抓取请求: ${avcode}, Page: ${page}`);
                
                // 本地同源获取 ID
                const idResult = await fetchJavLibraryVideoId(avcode);
                const { videoId, domain } = idResult;
                
                // 本地同源获取评论和文章
                const [cRes, rRes] = await Promise.all([
                    fetchJavLibraryData(videoId, 'comments', page, domain),
                    fetchJavLibraryData(videoId, 'reviews', page, domain)
                ]);
                
                return { idResult, cRes, rRes };
            }
        });
        
        function checkBypass() {
            // JAVLibrary 的特定标识元素：logo 或者是主界面模块，并且没有 Cloudflare 挑战元素
            const hasLogo = document.querySelector('#logo') || document.querySelector('#right') || document.querySelector('#top_bar') || document.title.includes('JAVLibrary');
            const isChallenged = document.querySelector('#cf-challenge') || document.querySelector('#turnstile-wrapper') || document.body.innerHTML.includes('Checking your browser') || document.body.innerHTML.includes('cf-challenge');
            
            logger.log(`检测验证状态中... hasLogo = ${!!hasLogo}, isChallenged = ${!!isChallenged}${isIframeBroker ? ' (iframe)' : ''}`);

            if (hasLogo && !isChallenged) {
                if (!reported) {
                    reported = true;
                    telemetry.track('javlib_cf_bypass', {
                        success: true,
                        duration_ms: Date.now() - startTime,
                        is_iframe: isIframeBroker
                    });
                }
                logger.log('JAVLibrary 页面加载成功（未被拦截/验证已通过）。');
                // 广播验证成功信号并存储 Cookie 与 UA
                if (typeof GM_setValue === 'function') {
                    const domainKey = window.location.origin;
                    let cookiesMap = {};
                    if (typeof GM_getValue === 'function') {
                        cookiesMap = GM_getValue('javlib_cookies') || {};
                    }
                    cookiesMap[domainKey] = document.cookie;
                    GM_setValue('javlib_cookies', cookiesMap);
                    GM_setValue('javlib_user_agent', navigator.userAgent);
                    GM_setValue('javlib_verified_time', Date.now());
                    logger.log(`Cookie 已保存至跨域存储: ${domainKey}, UA: ${navigator.userAgent}`);
                }
                
                // iframe broker 模式下不自动关闭，iframe 需要保持存活以持续提供同源代理服务
                if (isIframeBroker) {
                    logger.log('iframe broker 模式：页面验证通过，保持 iframe 存活以持续提供同源代理服务。');
                } else {
                    // 判断是否是协同验证窗口
                    const isVerificationTab = window.location.href.includes('cf_verify') || (typeof GM_getValue === 'function' && GM_getValue('javlib_verifying') === true);
                    if (isVerificationTab) {
                        logger.log('正在释放验证锁...');
                        if (typeof GM_setValue === 'function') {
                            GM_setValue('javlib_verifying', false); // 重置状态
                        }
                        logger.log('保持协同验证标签页开启，以作为影子 Broker 持续在后台提供同源代理服务。');
                    }
                }
                return true;
            }
            return false;
        }

        // 立即检测一次，如果没有通过，则轮询检测（因为 Cloudflare 挑战通过后页面会重载/刷新渲染）
        if (!checkBypass()) {
            const interval = setInterval(() => {
                if (checkBypass()) {
                    clearInterval(interval);
                }
            }, 1000);
            
            // 安全超时：iframe broker 模式给更长时间（60秒），独立标签页30秒
            const maxWait = isIframeBroker ? 60000 : 30000;
            setTimeout(() => {
                clearInterval(interval);
                if (!reported) {
                    reported = true;
                    telemetry.track('javlib_cf_bypass', {
                        success: false,
                        duration_ms: Date.now() - startTime,
                        is_iframe: isIframeBroker
                    });
                }
            }, maxWait);
        }
    }

    // 确保在 document idle 时执行
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(startScript, 100); // 延迟100ms确保DOM完全加载
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(startScript, 100));
    }
})();

 