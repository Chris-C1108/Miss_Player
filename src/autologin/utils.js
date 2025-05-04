/**
 * 工具函数集合 - 自动登录模块专用
 */
export class LoginUtils {
    /**
     * 显示Toast消息通知
     * @param {string} msg - 要显示的消息
     * @param {number} [duration=3000] - 显示持续时间(毫秒)
     * @param {string} [bgColor='rgba(0, 0, 0, 0.8)'] - 背景颜色
     * @param {string} [textColor='#fff'] - 文字颜色
     * @param {string} [position='top'] - 位置(top/bottom/center)
     */
    static toast(msg, duration = 3000, bgColor = 'rgba(0, 0, 0, 0.8)', textColor = '#fff', position = 'top') {
        let toast = document.createElement('div');
        toast.innerText = msg;
        toast.style.cssText = `
            position: fixed;
            z-index: 100000;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 15px;
            border-radius: 4px;
            color: ${textColor};
            background: ${bgColor};
            font-size: 14px;
            max-width: 80%;
            text-align: center;
            word-break: break-all;
        `;
        
        // 设置位置
        if (position === 'top') {
            toast.style.top = '10%';
        } else if (position === 'bottom') {
            toast.style.bottom = '10%';
        } else if (position === 'center') {
            toast.style.top = '50%';
            toast.style.transform = 'translate(-50%, -50%)';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, duration);
    }
    
    /**
     * 节流函数 - 限制函数执行频率
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 延迟时间(ms)
     * @returns {Function} - 节流后的函数
     */
    static throttle(fn, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return fn.apply(this, args);
            }
        };
    }
    
    /**
     * 等待DOM元素出现
     * @param {string} selector - CSS选择器
     * @param {number} [timeout=10000] - 超时时间(ms)
     * @param {number} [interval=100] - 检查间隔(ms)
     * @returns {Promise<Element>} - 返回找到的元素
     */
    static waitForElement(selector, timeout = 10000, interval = 100) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }
            
            const start = Date.now();
            const intervalId = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(intervalId);
                    return resolve(element);
                }
                
                if (Date.now() - start > timeout) {
                    clearInterval(intervalId);
                    reject(new Error(`等待元素 ${selector} 超时`));
                }
            }, interval);
        });
    }
    
    /**
     * 获取本地存储的数据
     * @param {string} key - 存储键名
     * @param {*} defaultValue - 默认值
     * @returns {*} - 存储的值或默认值
     */
    static getValue(key, defaultValue) {
        try {
            // 优先使用localStorage
            const value = localStorage.getItem(`autologin_${key}`);
            if (value !== null) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
            return defaultValue;
        } catch (e) {
            console.error('获取存储值失败:', e);
            return defaultValue;
        }
    }
    
    /**
     * 设置本地存储数据
     * @param {string} key - 存储键名
     * @param {*} value - 要存储的值
     */
    static setValue(key, value) {
        try {
            const storageValue = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(`autologin_${key}`, storageValue);
        } catch (e) {
            console.error('设置存储值失败:', e);
        }
    }
} 