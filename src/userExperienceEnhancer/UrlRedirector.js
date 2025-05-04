/**
 * URL重定向类
 * 负责将特定域名重定向到目标域名
 */

/**
 * URL重定向器类
 */
export class UrlRedirector {
    constructor() {
        // 配置重定向规则
        this.redirectRules = [
            {   
                // 匹配missav.com和thisav.com和 missav.ws 和 missav123.com 和 missav.live
                pattern: /^https?:\/\/(www\.)?(missav|thisav|missav123)\.com\/?|^https?:\/\/(www\.)?missav\.ws\/?|^https?:\/\/(www\.)?missav\.live\/?/i,
                targetDomain: 'missav.ai'
            }
        ];
        
        // 立即执行重定向检查
        this.immediateRedirect();
    }
    
    /**
     * 立即执行重定向检查，在页面加载最早时执行
     */
    immediateRedirect() {
        // 立即检查当前URL
        this.checkAndRedirect();
    }

    /**
     * 检查当前URL并执行重定向
     * @returns {boolean} 是否执行了重定向
     */
    checkAndRedirect() {
        const currentUrl = window.location.href;
        
        // 检查每条重定向规则
        for (const rule of this.redirectRules) {
            if (rule.pattern.test(currentUrl)) {
                console.log('[UrlRedirector] 匹配到重定向规则:', rule);
                
                // 执行重定向
                const newUrl = this.applyRedirect(currentUrl, rule);
                if (newUrl !== currentUrl) {
                    console.log('[UrlRedirector] 重定向到:', newUrl);
                    // 使用replace而不是href赋值，避免在浏览历史中留下记录
                    window.location.replace(newUrl);
                    return true;
                }
            }
        }
        
        // 未触发重定向
        return false;
    }
    
    /**
     * 应用重定向规则，生成新URL
     * @param {string} url - 当前URL
     * @param {Object} rule - 重定向规则
     * @returns {string} 重定向后的URL
     */
    applyRedirect(url, rule) {
        // 替换域名部分
        if (rule.targetDomain) {
            // 处理各种域名情况
            let newUrl = url;
            
            // 处理.com域名
            newUrl = newUrl.replace(/^(https?:\/\/)(www\.)?(missav|thisav|missav123)\.com\/?/i, `$1${rule.targetDomain}/`);
            
            // 如果URL未变化，则尝试替换.ws域名
            if (newUrl === url) {
                newUrl = url.replace(/^(https?:\/\/)(www\.)?missav\.ws\/?/i, `$1${rule.targetDomain}/`);
            }
            
            // 如果URL还未变化，则尝试替换.live域名
            if (newUrl === url) {
                newUrl = url.replace(/^(https?:\/\/)(www\.)?missav\.live\/?/i, `$1${rule.targetDomain}/`);
            }
            
            return newUrl;
        }
        
        return url;
    }
} 