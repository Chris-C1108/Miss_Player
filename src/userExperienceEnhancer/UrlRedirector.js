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
                pattern: /^https?:\/\/(www\.)?(missav|thisav|missav\.ws|missav123)\.com\/|^https?:\/\/(www\.)?missav\.live\//i,
                targetDomain: 'missav.ai'
            }
        ];
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
                    window.location.href = newUrl;
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
            // 处理.com后缀的域名
            let newUrl = url.replace(/^(https?:\/\/)(www\.)?(missav|thisav|missav\.ws|missav123)\.com\//i, `$1${rule.targetDomain}/`);
            
            // 如果URL未变化，则尝试替换.live后缀的域名
            if (newUrl === url) {
                newUrl = url.replace(/^(https?:\/\/)(www\.)?missav\.live\//i, `$1${rule.targetDomain}/`);
            }
            
            return newUrl;
        }
        
        // 如果有自定义替换逻辑，可以在这里添加
        
        return url;
    }
} 