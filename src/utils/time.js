/**
 * 时间与节流防抖相关工具函数
 */

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 节流后的函数
 */
export function throttle(fn, delay = 200) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall < delay) return;
        lastCall = now;
        return fn.apply(this, args);
    };
}

/**
 * 防抖函数 - 延迟执行直到操作停止
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 防抖后的函数
 */
export function debounce(fn, delay = 200) {
    let timer = null;
    return function(...args) {
        const context = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(context, args);
            timer = null;
        }, delay);
    };
}

/**
 * 格式化时间为 mm:ss 或 hh:mm:ss
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时间字符串 (如: 02:05 或 1:02:05)
 */
export function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * 格式化时间（强制包含小时，格式为 HH:MM:SS）
 * @param {number} timeInSeconds - 秒数
 * @returns {string} - 格式化后的时间字符串 (如: 00:02:05)
 */
export function formatTimeWithHours(timeInSeconds) {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) {
        return '00:00:00';
    }
    const totalSeconds = Math.floor(timeInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
