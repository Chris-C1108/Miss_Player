/**
 * 高效的定时器管理器类
 * 使用requestAnimationFrame实现更高效的定时器
 */
export class AnimationTimer {
    constructor() {
        this.timers = new Map();
    }
    
    /**
     * 设置一个基于requestAnimationFrame的延迟执行函数
     * @param {Function} callback - 回调函数 
     * @param {number} delay - 延迟时间(ms)
     * @param {string} id - 定时器ID
     * @returns {string} - 定时器ID
     */
    setTimeout(callback, delay, id = null) {
        const timerId = id || Math.random().toString(36).substr(2, 9);
        const startTime = performance.now();
        
        const timerLoop = (currentTime) => {
            if (!this.timers.has(timerId)) return;
            
            const elapsed = currentTime - startTime;
            if (elapsed >= delay) {
                callback();
                this.clearTimeout(timerId);
            } else {
                const timerData = this.timers.get(timerId);
                timerData.rafId = requestAnimationFrame(timerLoop);
                this.timers.set(timerId, timerData);
            }
        };
        
        this.timers.set(timerId, { 
            rafId: requestAnimationFrame(timerLoop),
            callback,
            type: 'timeout'
        });
        
        return timerId;
    }
    
    /**
     * 清除延迟执行函数
     * @param {string} id - 定时器ID
     */
    clearTimeout(id) {
        if (this.timers.has(id)) {
            const timerData = this.timers.get(id);
            cancelAnimationFrame(timerData.rafId);
            this.timers.delete(id);
        }
    }
    
    /**
     * 清除所有定时器
     */
    clearAll() {
        this.timers.forEach((timerData) => {
            cancelAnimationFrame(timerData.rafId);
        });
        this.timers.clear();
    }
}

// 创建全局定时器实例
export const animationTimer = new AnimationTimer(); 