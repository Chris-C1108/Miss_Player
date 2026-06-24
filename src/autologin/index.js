/**
 * 自动登录模块 - 主入口
 * 支持多个网站的自动登录功能
 */
import { LoginManager } from './LoginManager.js';
import { BaseLoginProvider } from './BaseLoginProvider.js';
import { MissavLoginProvider } from './MissavLoginProvider.js';
import { JableLoginProvider } from './JableLoginProvider.js';
import { CredentialManager } from './CredentialManager.js';
import { CrossDomainBridge } from './CrossDomainBridge.js';

// 导出所有模块，方便外部调用或定制扩展
export {
    LoginManager,
    BaseLoginProvider,
    MissavLoginProvider,
    JableLoginProvider,
    CredentialManager,
    CrossDomainBridge
};

/**
 * 初始化自动登录模块
 * @returns {Promise<LoginManager>} 初始化后的登录管理器实例
 */
export async function initAutoLogin() {
    try {
        const loginManager = new LoginManager();
        await loginManager.init();
        return loginManager;
    } catch (error) {
        console.error('自动登录模块初始化失败:', error);
        return null;
    }
}