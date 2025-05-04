/**
 * 登录管理器 - 负责管理多个网站的登录逻辑
 */
import { LoginUtils } from './utils.js';
import { MissavLoginProvider } from './MissavLoginProvider.js';

export class LoginManager {
    /**
     * 构造函数
     */
    constructor() {
        // 登录信息
        this.userEmail = '';
        this.userPassword = '';
        this.autoLogin = true;
        
        // 登录提供者列表
        this.providers = [
            new MissavLoginProvider()
        ];
        
        // 当前活跃的提供者
        this.activeProvider = null;
    }
    
    /**
     * 初始化登录管理器
     */
    async init() {
        // 加载存储的登录信息
        this.loadLoginInfo();
        
        // 根据当前URL选择合适的登录提供者
        this.activeProvider = this.getMatchingProvider();
        
        // 如果没有合适的提供者，不执行后续操作
        if (!this.activeProvider) {
            console.debug('没有找到匹配的登录提供者');
            return;
        }
        
        // 添加自动登录选项
        await this.activeProvider.addAutoLoginOption(this.handleLoginInfoChange.bind(this));
        
        // 检查登录状态并执行自动登录
        await this.checkLoginAndAutoLogin();
    }
    
    /**
     * 处理登录信息变更
     * @param {Object} info - 变更的登录信息
     * @param {string} [info.email] - 邮箱
     * @param {string} [info.password] - 密码
     * @param {boolean} [info.autoLogin] - 是否自动登录
     */
    handleLoginInfoChange(info) {
        if (info.email !== undefined) {
            this.userEmail = info.email;
            LoginUtils.setValue('userEmail', info.email);
        }
        
        if (info.password !== undefined) {
            this.userPassword = info.password;
            LoginUtils.setValue('userPassword', info.password);
        }
        
        if (info.autoLogin !== undefined) {
            this.autoLogin = info.autoLogin;
            LoginUtils.setValue('autoLogin', info.autoLogin);
        }
    }
    
    /**
     * 加载存储的登录信息
     */
    loadLoginInfo() {
        this.userEmail = LoginUtils.getValue('userEmail', '');
        this.userPassword = LoginUtils.getValue('userPassword', '');
        this.autoLogin = LoginUtils.getValue('autoLogin', true);
    }
    
    /**
     * 获取匹配当前网站的登录提供者
     * @returns {Object|null} 匹配的登录提供者或null
     */
    getMatchingProvider() {
        for (const provider of this.providers) {
            if (provider.isSupportedSite()) {
                return provider;
            }
        }
        return null;
    }
    
    /**
     * 检查登录状态并执行自动登录
     */
    async checkLoginAndAutoLogin() {
        if (!this.activeProvider) return;
        
        try {
            // 检查登录状态
            const isLoggedIn = await this.activeProvider.checkLoginStatus();
            
            // 如果未登录且启用了自动登录，执行登录
            if (!isLoggedIn && this.autoLogin && this.userEmail && this.userPassword) {
                console.log('用户未登录，尝试自动登录');
                await this.activeProvider.login(this.userEmail, this.userPassword);
            }
        } catch (error) {
            console.error('登录检查过程出错:', error);
        }
    }
    
    /**
     * 手动执行登录操作
     * @param {string} email - 用户邮箱
     * @param {string} password - 用户密码
     * @returns {Promise<boolean>} 登录是否成功
     */
    async login(email, password) {
        if (!this.activeProvider) {
            console.error('没有匹配的登录提供者');
            return false;
        }
        
        // 更新登录信息
        this.handleLoginInfoChange({
            email,
            password
        });
        
        // 执行登录
        return await this.activeProvider.login(email, password);
    }
} 