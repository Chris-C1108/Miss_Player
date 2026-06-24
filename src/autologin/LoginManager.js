import { getLocalStorage, setLocalStorage } from '../utils/index.js';
import { MissavLoginProvider } from './MissavLoginProvider.js';
import { JableLoginProvider } from './JableLoginProvider.js';
import { CredentialManager } from './CredentialManager.js';

const COOLDOWN_DURATION = 30 * 60 * 1000; // 冷却熔断持续时间：30 分钟
const MAX_FAIL_COUNT = 3; // 最大连续失败次数，超过即熔断

export class LoginManager {
    /**
     * 构造函数
     */
    constructor() {
        // 登录信息缓存
        this.userEmail = '';
        this.userPassword = '';
        this.autoLogin = true;
        
        // 注册登录提供者列表
        this.providers = [
            new MissavLoginProvider(),
            new JableLoginProvider()
        ];
        
        // 当前匹配的活跃提供者
        this.activeProvider = null;
    }
    
    /**
     * 初始化登录管理器
     */
    async init() {
        // 根据当前 URL 选择合适的登录提供者
        this.activeProvider = this.getMatchingProvider();
        
        if (!this.activeProvider) {
            console.debug('[LoginManager] 未找到匹配当前网站域名的登录提供者');
            return;
        }

        console.log(`[LoginManager] 已选择 [${this.activeProvider.siteKey}] 作为当前页面的登录处理程序`);

        // 1. 加载持久化凭据
        this.loadLoginInfo();

        // 2. 启动登录态后台保活循环
        this.startKeepAliveLoop();
        
        // 3. 并行执行：表单 UI 注入 与 自动登录检查，互不阻塞
        const uiTask = this.activeProvider.addAutoLoginOption(this.handleLoginInfoChange.bind(this))
            .catch(err => console.debug('[LoginManager] 登录表单 UI 注入跳过或失败:', err.message));
        
        // 立即执行一次登录状态检查及自动登录
        await this.checkLoginAndAutoLogin();
        
        // 等待表单注入完成
        await uiTask;
    }
    
    /**
     * 响应登录信息变更并保存
     * @param {Object} info - 变更的凭据数据
     */
    handleLoginInfoChange(info) {
        if (!this.activeProvider) return;
        const siteKey = this.activeProvider.siteKey;

        // 获取当前最新凭据以防覆盖其他字段
        const currentCreds = CredentialManager.get(siteKey);
        
        const email = info.email !== undefined ? info.email : currentCreds.email;
        const password = info.password !== undefined ? info.password : currentCreds.password;
        const autoLogin = info.autoLogin !== undefined ? info.autoLogin : currentCreds.autoLogin;

        this.userEmail = email;
        this.userPassword = password;
        this.autoLogin = autoLogin;

        // 持久化保存
        CredentialManager.save(siteKey, email, password, autoLogin);

        // 如果用户手动更新或保存了凭据，代表他们尝试登录或修复，应立即重置该站点的熔断器
        this.resetCircuitBreaker(siteKey);
    }
    
    /**
     * 从 CredentialManager 加载保存的登录凭据
     */
    loadLoginInfo() {
        if (!this.activeProvider) return;
        const siteKey = this.activeProvider.siteKey;
        const creds = CredentialManager.get(siteKey);

        this.userEmail = creds.email;
        this.userPassword = creds.password;
        this.autoLogin = creds.autoLogin;
    }
    
    /**
     * 查找匹配当前网站域名的提供者
     * @returns {Object|null}
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
     * 检查当前状态并执行自动登录
     */
    async checkLoginAndAutoLogin() {
        if (!this.activeProvider) return;
        
        const siteKey = this.activeProvider.siteKey;
        const ATTEMPT_KEY = `mp_autologin_attempt_${siteKey}`;
        const MAX_ATTEMPTS = 1; // 单次会话页面加载时最多自动登录 1 次，防止 reload 无限死循环
        
        try {
            // 1. 检查当前是否已登录
            const isLoggedIn = await this.activeProvider.checkLoginStatus();
            
            if (isLoggedIn) {
                // 已登录，重置熔断计数器和会话尝试计数器
                this.resetCircuitBreaker(siteKey);
                try { sessionStorage.removeItem(ATTEMPT_KEY); } catch(e) {}
                console.log(`[LoginManager] 站点 [${siteKey}] 登录态正常。`);
                return;
            }
            
            // 2. 未登录，评估是否可以执行自动登录
            if (this.autoLogin && this.userEmail && this.userPassword) {
                // A. 熔断判定（冷却保护）
                if (this.isCircuitBroken(siteKey)) {
                    console.warn(`[LoginManager] 自动登录在 [${siteKey}] 上处于冷却保护期 (已连续登录失败 ${MAX_FAIL_COUNT} 次)，本次跳过。`);
                    return;
                }

                // B. 防无限重试判定
                let attempts = 0;
                try {
                    attempts = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
                } catch(e) {}
                
                if (attempts >= MAX_ATTEMPTS) {
                    console.warn(`[LoginManager] 自动登录在当前页面已尝试了 ${attempts} 次但刷新后仍未登录，已停止以防死循环。可能是浏览器阻止了 Cookie 存储。`);
                    return;
                }
                
                // 递增重试计数器
                try {
                    sessionStorage.setItem(ATTEMPT_KEY, String(attempts + 1));
                } catch(e) {}
                
                console.log(`[LoginManager] 检测到用户未登录 [${siteKey}]，尝试自动登录...`);
                const success = await this.activeProvider.login(this.userEmail, this.userPassword, { silent: true });
                
                if (success) {
                    this.resetCircuitBreaker(siteKey);
                    try { sessionStorage.removeItem(ATTEMPT_KEY); } catch(e) {}
                } else {
                    this.recordFailure(siteKey);
                }
            } else {
                console.log(`[LoginManager] 自动登录未启用或未检测到已存储的有效登录凭据 (${siteKey})。`);
            }
        } catch (error) {
            console.error(`[LoginManager] 自动登录检查出错 (${siteKey}):`, error);
            this.recordFailure(siteKey);
        }
    }
    
    /**
     * 熔断机制：检查是否处于熔断冷却中
     * @param {string} siteKey 
     * @returns {boolean}
     */
    isCircuitBroken(siteKey) {
        const failCount = getLocalStorage(`mp_circuit_fail_${siteKey}`, 0);
        const lastFailTime = getLocalStorage(`mp_circuit_last_fail_${siteKey}`, 0);

        if (failCount >= MAX_FAIL_COUNT) {
            const timePassed = Date.now() - lastFailTime;
            if (timePassed < COOLDOWN_DURATION) {
                return true; // 仍然在冷却期中
            }
            // 冷却时间已过，自动降低失败计数以提供一次重试机会
            setLocalStorage(`mp_circuit_fail_${siteKey}`, MAX_FAIL_COUNT - 1);
        }
        return false;
    }

    /**
     * 记录一次登录失败，必要时触发熔断
     * @param {string} siteKey 
     */
    recordFailure(siteKey) {
        const failCount = getLocalStorage(`mp_circuit_fail_${siteKey}`, 0) + 1;
        setLocalStorage(`mp_circuit_fail_${siteKey}`, failCount);
        setLocalStorage(`mp_circuit_last_fail_${siteKey}`, Date.now());
        
        if (failCount >= MAX_FAIL_COUNT) {
            console.error(`[LoginManager] 警告: 站点 [${siteKey}] 已连续自动登录失败 ${failCount} 次，现已触发熔断，冷却期为 ${COOLDOWN_DURATION / 60000} 分钟。`);
        }
    }

    /**
     * 重置站点的熔断状态
     * @param {string} siteKey 
     */
    resetCircuitBreaker(siteKey) {
        try {
            localStorage.removeItem(`mp_circuit_fail_${siteKey}`);
            localStorage.removeItem(`mp_circuit_last_fail_${siteKey}`);
        } catch (e) {}
    }

    /**
     * 手动触发指定登录行为
     */
    async login(email, password) {
        if (!this.activeProvider) {
            console.error('[LoginManager] 没有匹配的登录提供者');
            return false;
        }
        
        this.handleLoginInfoChange({ email, password });
        return await this.activeProvider.login(email, password);
    }

    /**
     * 启动后台保活循环
     */
    startKeepAliveLoop() {
        const interval = 10 * 60 * 1000; // 每 10 分钟检测一次
        
        // 延迟 30 秒进行第一次保活检查（避开刚加载页面时的繁忙期）
        setTimeout(() => {
            this.runKeepAlive();
        }, 30000);

        setInterval(() => {
            this.runKeepAlive();
        }, interval);
    }

    /**
     * 执行所有已注册站点的登录态保活
     */
    async runKeepAlive() {
        console.debug('[LoginManager] 启动后台提供者登录态保活检查...');
        for (const provider of this.providers) {
            const siteKey = provider.siteKey;
            
            // 如果某站已经被熔断，跳过其定时保活检查，防后台无效请求
            if (this.isCircuitBroken(siteKey)) {
                console.debug(`[LoginManager] 后台保活跳过已被熔断的站点: ${siteKey}`);
                continue;
            }

            try {
                if (typeof provider.keepAlive === 'function') {
                    await provider.keepAlive();
                }
            } catch (e) {
                console.error(`[LoginManager] 后台保活异常 (${siteKey}):`, e);
                this.recordFailure(siteKey);
            }
        }
    }
}