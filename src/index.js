import { initCSSVariables } from './constants/index.js';
import { FloatingButton } from './player/ui/FloatingButton.js';
import { PlayerState } from './player/state/PlayerState.js';
import { Utils } from './utils/utils.js';
import { initAutoLogin } from './autologin/index.js';
import AdBlocker from './adblock';
import { initUserExperienceEnhancer, earlyUrlRedirector } from './userExperienceEnhancer';
import { I18n, __ } from './constants/i18n.js';

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
    
    // 更新viewport内容，添加viewport-fit=cover以支持安全区域
    viewportMeta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
    console.log(`[${__('scriptName')}] ${__('viewportConfigured')}`);
}

/**
 * 脚本入口函数
 */
(function() {
    'use strict';

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
        initCSSVariables();
        
        // 控制台日志 - 便于调试
        console.log(`[${__('scriptName')}] ${__('stylesInjected')}`);
    }
    
    /**
     * 启动脚本
     */
    async function startScript() {
        try {
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

    // 确保在 document idle 时执行
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(startScript, 100); // 延迟100ms确保DOM完全加载
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(startScript, 100));
    }
})();

/**
 * 统一导出API，使用模块化版本
 */
export { CustomVideoPlayer as default } from './player/index.js';

// 导出工具类和其他组件
export { Utils } from './utils/utils.js';
export { VideoSwipeManager } from './player/managers/videoSwipeManager.js';
export { UserExperienceEnhancer } from './userExperienceEnhancer';
export { I18n, __ } from './constants/i18n.js';

// 为兼容性考虑，同时导出为ModularVideoPlayer
export { CustomVideoPlayer as ModularVideoPlayer } from './player/index.js'; 