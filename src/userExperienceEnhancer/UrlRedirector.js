/**
 * URL重定向类
 * 负责将特定域名重定向到目标域名
 */

import { SITE_DOMAINS } from '../constants/domains.js';

/**
 * URL重定向器类
 */
export class UrlRedirector {
    constructor() {
        const missavPrimary = SITE_DOMAINS.MISSAV.primary;
        const missavBackups = SITE_DOMAINS.MISSAV.backups;

        // 动态构建重定向规则
        this.redirectRules = [];
        for (const backup of missavBackups) {
            const escaped = backup.replace(/\./g, '\\.');
            this.redirectRules.push({
                pattern: new RegExp(`^https?:\\/\\/(www\\.)?${escaped}\\/?`, 'i'),
                targetDomain: missavPrimary,
                backupDomain: backup
            });
        }
        
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
        if (rule.targetDomain && rule.backupDomain) {
            const escaped = rule.backupDomain.replace(/\./g, '\\.');
            const regex = new RegExp(`^(https?:\\/\\/)(www\\.)?${escaped}\\/?`, 'i');
            return url.replace(regex, `$1${rule.targetDomain}/`);
        }
        return url;
    }
} 