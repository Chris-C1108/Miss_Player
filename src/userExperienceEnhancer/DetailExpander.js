/**
 * 详情自动展开类
 * 负责在页面空闲时自动展开视频的详细信息，避免阻塞主线程关键渲染 (LCP/INP)
 */

import { telemetry } from '../telemetry';

/**
 * 详情展开器类
 */
export class DetailExpander {
    constructor() {
        this.maxAttempts = 3;        // 最大尝试次数
        this.attemptInterval = 1500; // 尝试间隔时间(ms)
    }

    /**
     * 展开详情的选择器
     * @type {string}
     */
    get SHOW_MORE_SELECTOR() {
        return 'a.text-nord13.font-medium.flex.items-center';
    }

    /**
     * 自动展开详情 (延迟至空闲回调，杜绝阻塞主线程渲染)
     */
    autoExpandDetails() {
        const executeExpand = () => {
            if (this.expandDetailsSingle()) return;
            
            let attempts = 0;
            const attemptInterval = setInterval(() => {
                if (this.expandDetailsSingle() || ++attempts >= this.maxAttempts) {
                    clearInterval(attemptInterval);
                }
            }, this.attemptInterval);
        };

        // 优先在浏览器空闲时调度，避开 LCP 绘制与关键交互
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(executeExpand, { timeout: 3500 });
        } else {
            setTimeout(executeExpand, 1200);
        }
    }
    
    /**
     * 执行单次展开尝试
     * @returns {boolean} 是否成功展开
     */
    expandDetailsSingle() {
        try {
            const showMoreButton = document.querySelector(this.SHOW_MORE_SELECTOR);
            if (showMoreButton) {
                // 如果按钮已被隐藏或已展开，则无需重复触发
                if (showMoreButton.offsetParent === null && showMoreButton.style.display === 'none') {
                    return true;
                }
                showMoreButton.click();
                return true;
            }
        } catch (error) {
            console.error('[DetailExpander] 展开详情时出错:', error);
        }
        return false;
    }
} 