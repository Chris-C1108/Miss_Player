/**
 * 自动登录模块 - 主入口
 * 支持多个网站的自动登录功能
 */
import { LoginManager } from './LoginManager.js';
import { LoginUtils } from './utils.js';
import { I18n } from '../constants/i18n.js';
import { MissavLoginProvider } from './MissavLoginProvider.js';

// 导出所有模块，方便其他模块使用
export {
    LoginManager,
    LoginUtils,
    MissavLoginProvider
};

/**
 * 初始化自动登录模块
 * @returns {Promise<LoginManager|null>} 登录管理器实例，如果初始化失败则返回null
 */
export async function initAutoLogin() {
    try {
        // 创建登录管理器
        const loginManager = new LoginManager();
        
        // 初始化管理器
        await loginManager.init();
        
        return loginManager;
    } catch (error) {
        console.error('[自动登录模块] 初始化失败:', error);
        return null;
    }
} 