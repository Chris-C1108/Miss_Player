/**
 * 详情自动展开类
 * 负责自动展开视频的详细信息
 */

import { Utils } from '../utils/utils.js';

/**
 * 详情展开器类
 */
export class DetailExpander {
    constructor() {
        // 配置
        this.maxAttempts = 3;       // 最大尝试次数
        this.attemptInterval = 1000; // 尝试间隔时间(ms)
    }

    /**
     * 展开详情的选择器
     * @type {string}
     */
    get SHOW_MORE_SELECTOR() {
        return 'a.text-nord13.font-medium.flex.items-center';
    }

    /**
     * 自动展开详情
     */
    autoExpandDetails() {
        console.log('[DetailExpander] 尝试自动展开详情');
        
        // 立即尝试展开一次
        this.expandDetailsSingle();
        
        // 多次尝试，因为有时候页面加载较慢
        let attempts = 0;
        const attemptInterval = setInterval(() => {
            if (this.expandDetailsSingle() || ++attempts >= this.maxAttempts) {
                clearInterval(attemptInterval);
                console.log(`[DetailExpander] 完成尝试 (${attempts + 1}次)`);
            }
        }, this.attemptInterval);
    }
    
    /**
     * 执行单次展开尝试
     * @returns {boolean} 是否成功展开
     */
    expandDetailsSingle() {
        try {
            const showMoreButton = document.querySelector(this.SHOW_MORE_SELECTOR);
            if (showMoreButton) {
                console.log('[DetailExpander] 找到"显示更多"按钮，点击展开');
                showMoreButton.click();
                return true;
            }
        } catch (error) {
            console.error('[DetailExpander] 展开详情时出错:', error);
        }
        return false;
    }
} 