/**
 * 自动登录模块 - 主入口
 * 支持多个网站的自动登录功能
 */
import { LoginManager } from './LoginManager.js';
import { LoginUtils } from './utils.js';
import { I18n } from './i18n.js';
import { MissavLoginProvider } from './MissavLoginProvider.js';

// 导出所有模块，方便其他模块使用
export {
    LoginManager,
    LoginUtils,
    I18n,
    MissavLoginProvider
};

/**
 * 初始化自动登录模块
 * @returns {Promise<LoginManager>} 初始化后的登录管理器实例
 */
export async function initAutoLogin() {
    try {
        // 创建并初始化登录管理器
        const loginManager = new LoginManager();
        await loginManager.init();
        return loginManager;
    } catch (error) {
        console.error('自动登录模块初始化失败:', error);
        return null;
    }
} 