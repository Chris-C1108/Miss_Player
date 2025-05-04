/**
 * 用户体验增强模块入口
 * 负责管理和协调各种增强用户体验的功能
 */

import { DetailExpander } from './DetailExpander.js';
import { QualityManager } from './QualityManager.js';
import { UrlRedirector } from './UrlRedirector.js';
import { Utils } from '../utils/utils.js';

// 立即创建并执行URL重定向检查，确保在页面加载最早阶段执行
const earlyUrlRedirector = new UrlRedirector();

/**
 * 用户体验增强器类
 * 整合了自动展开详情、自动高画质、URL重定向等功能
 */
export class UserExperienceEnhancer {
    constructor() {
        this.detailExpander = new DetailExpander();
        this.qualityManager = new QualityManager();
        this.urlRedirector = earlyUrlRedirector; // 使用提前创建的重定向器实例
    }

    /**
     * 初始化用户体验增强功能
     * @param {boolean} skipRedirectCheck - 是否跳过URL重定向检查（如果在其他地方已经执行过）
     */
    init(skipRedirectCheck = false) {
        console.log('[UserExperienceEnhancer] 初始化用户体验增强功能');
        
        // 检查是否需要执行URL重定向
        if (!skipRedirectCheck) {
            // 执行URL重定向检查，如果已重定向则不继续执行后续功能
            if (this.urlRedirector.checkAndRedirect()) {
                return;
            }
        }
        
        // DOM加载完成后执行其他功能
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initFeatures();
            });
        } else {
            this.initFeatures();
        }
    }
    
    /**
     * 初始化各项功能
     */
    initFeatures() {
        try {
            this.detailExpander.autoExpandDetails();
            this.qualityManager.setupAutoHighestQuality();
        } catch (error) {
            console.error('[UserExperienceEnhancer] 初始化功能时出错:', error);
        }
    }
}

// 导出各个组件，便于单独使用
export { DetailExpander } from './DetailExpander.js';
export { QualityManager } from './QualityManager.js';
export { UrlRedirector } from './UrlRedirector.js';
export { earlyUrlRedirector }; // 导出提前初始化的实例

/**
 * 初始化用户体验增强功能
 * @param {boolean} skipRedirectCheck - 是否跳过URL重定向检查
 * @returns {UserExperienceEnhancer} 用户体验增强器实例
 */
export function initUserExperienceEnhancer(skipRedirectCheck = false) {
    const enhancer = new UserExperienceEnhancer();
    enhancer.init(skipRedirectCheck);
    return enhancer;
} 