/**
 * 统一凭据管理器
 * 负责多站点凭据的安全存储、读取和清除，支持跨域/平行域名凭据共享与密码轻量混淆
 */
import { getLocalStorage, setLocalStorage } from '../utils/index.js';

const OBFUSCATION_SALT = "MissPlayerSalt_2026";
const OBFUSCATION_PREFIX = "_mp_obf_:";

/**
 * 字符异或混淆
 * @param {string} text - 待混淆的字符串
 * @returns {string} 混淆后的字符串
 */
function xorObfuscate(text) {
    if (!text) return "";
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ OBFUSCATION_SALT.charCodeAt(i % OBFUSCATION_SALT.length));
    }
    try {
        return OBFUSCATION_PREFIX + btoa(encodeURIComponent(result));
    } catch (e) {
        return OBFUSCATION_PREFIX + result;
    }
}

/**
 * 字符异或还原
 * @param {string} text - 待还原的字符串
 * @returns {string} 还原后的字符串
 */
function xorDeobfuscate(text) {
    if (!text) return "";
    
    // 如果不以魔数前缀开头，判定为旧版本明文密码，直接返回原密码进行就地兼容
    if (!text.startsWith(OBFUSCATION_PREFIX)) {
        return text;
    }

    // 剔除前缀
    const rawObfuscated = text.substring(OBFUSCATION_PREFIX.length);
    let decoded = rawObfuscated;
    try {
        decoded = decodeURIComponent(atob(rawObfuscated));
    } catch (e) {
        // 兼容未编码的数据
    }
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ OBFUSCATION_SALT.charCodeAt(i % OBFUSCATION_SALT.length));
    }
    return result;
}

export class CredentialManager {
    /**
     * 获取指定站点的凭据信息
     * @param {string} siteKey - 站点唯一 Key (如 'MISSAV', 'JABLE')
     * @returns {Object} 凭据对象 { email, password, autoLogin }
     */
    static get(siteKey) {
        const prefix = siteKey || '';
        const emailKey = `${prefix}_autologin_userEmail`;
        const passwordKey = `${prefix}_autologin_userPassword`;
        const autoLoginKey = `${prefix}_autologin_autoLogin`;

        let email = '';
        let passwordObfuscated = '';
        let autoLogin = true;

        // 1. 优先尝试从油猴的 GM 存储中获取 (跨域共享)
        if (typeof GM_getValue === 'function') {
            try {
                email = GM_getValue(emailKey, '');
                passwordObfuscated = GM_getValue(passwordKey, '');
                autoLogin = GM_getValue(autoLoginKey, true);
            } catch (e) {
                console.debug(`[CredentialManager] GM_getValue 获取失败:`, e);
            }
        }

        // 2. 如果油猴存储中为空，退回到本地的 LocalStorage
        if (!email) {
            email = getLocalStorage(emailKey, '');
            passwordObfuscated = getLocalStorage(passwordKey, '');
            autoLogin = getLocalStorage(autoLoginKey, true);

            // 兼容旧版本键名 (向后兼容)
            if (!email) {
                const legacyEmailKey = `${prefix}_autologin_username`; // 可能存在旧版键名
                const legacyEmail = getLocalStorage('autologin_userEmail', '') || getLocalStorage(legacyEmailKey, '');
                if (legacyEmail) {
                    email = legacyEmail;
                    passwordObfuscated = getLocalStorage('autologin_userPassword', '');
                    autoLogin = getLocalStorage('autologin_autoLogin', true);
                    
                    // 自动同步到新命名规则
                    this.save(siteKey, email, xorDeobfuscate(passwordObfuscated), autoLogin);
                }
            }
        }

        // 3. 解析混淆的密码
        let password = '';
        if (passwordObfuscated) {
            password = xorDeobfuscate(passwordObfuscated);
            
            // 数据自愈升级：如果读取出来的存储密文没有 OBFUSCATION_PREFIX 前缀，说明是明文，自动执行升级保存
            if (!passwordObfuscated.startsWith(OBFUSCATION_PREFIX) && email) {
                console.log(`[CredentialManager] 监测到站点 [${siteKey}] 使用旧版明文凭据，正在自动加密升级存储...`);
                this.save(siteKey, email, password, autoLogin);
            }
        }

        return {
            email,
            password,
            autoLogin: !!autoLogin
        };
    }

    /**
     * 保存指定站点的凭据信息
     * @param {string} siteKey - 站点唯一 Key
     * @param {string} email - 邮箱/用户名
     * @param {string} password - 明文密码
     * @param {boolean} autoLogin - 是否开启自动登录
     */
    static save(siteKey, email, password, autoLogin) {
        if (!siteKey) return;
        const prefix = siteKey;
        const emailKey = `${prefix}_autologin_userEmail`;
        const passwordKey = `${prefix}_autologin_userPassword`;
        const autoLoginKey = `${prefix}_autologin_autoLogin`;

        const passwordObfuscated = password ? xorObfuscate(password) : '';

        // 1. 尝试保存到油猴存储 GM 中
        if (typeof GM_setValue === 'function') {
            try {
                GM_setValue(emailKey, email);
                GM_setValue(passwordKey, passwordObfuscated);
                GM_setValue(autoLoginKey, autoLogin);
            } catch (e) {
                console.debug(`[CredentialManager] GM_setValue 保存失败:`, e);
            }
        }

        // 2. 同时双向同步保存到 LocalStorage 中
        setLocalStorage(emailKey, email);
        setLocalStorage(passwordKey, passwordObfuscated);
        setLocalStorage(autoLoginKey, autoLogin);
    }

    /**
     * 清除指定站点的凭据信息
     * @param {string} siteKey - 站点唯一 Key
     */
    static clear(siteKey) {
        if (!siteKey) return;
        const prefix = siteKey;
        const emailKey = `${prefix}_autologin_userEmail`;
        const passwordKey = `${prefix}_autologin_userPassword`;
        const autoLoginKey = `${prefix}_autologin_autoLogin`;

        if (typeof GM_deleteValue === 'function') {
            try {
                GM_deleteValue(emailKey);
                GM_deleteValue(passwordKey);
                GM_deleteValue(autoLoginKey);
            } catch (e) {
                console.debug(`[CredentialManager] GM_deleteValue 失败:`, e);
            }
        }

        // 清除本地 LocalStorage 中的数据
        try {
            localStorage.removeItem(emailKey);
            localStorage.removeItem(passwordKey);
            localStorage.removeItem(autoLoginKey);
        } catch (e) {
            console.debug(`[CredentialManager] 清除 LocalStorage 失败:`, e);
        }
    }
}
