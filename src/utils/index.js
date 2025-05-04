/**
 * 常用工具函数集合
 */

/**
 * 工具函数对象
 */
export const Utils = {
  /**
   * Toast 通知函数
   * @param {string} msg - 消息内容
   * @param {number} duration - 显示时长(毫秒)
   * @param {string} bgColor - 背景颜色
   * @param {string} textColor - 文字颜色
   * @param {string} position - 位置(top/bottom/center)
   */
  Toast(msg, duration = 3000, bgColor = 'rgba(0, 0, 0, 0.8)', textColor = '#fff', position = 'top') {
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
  },
  
  /**
   * 节流函数 - 限制函数执行频率
   * @param {Function} fn - 需要节流的函数 
   * @param {number} delay - 延迟时间(毫秒)
   * @returns {Function} 节流后的函数
   */
  throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  },
  
  /**
   * 等待DOM元素出现
   * @param {string} selector - CSS选择器 
   * @param {number} timeout - 超时时间(毫秒)
   * @param {number} interval - 检查间隔(毫秒)
   * @returns {Promise<Element>} DOM元素
   */
  waitForElement(selector, timeout = 10000, interval = 100) {
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
  },
  
  /**
   * 动态加载脚本
   * @param {string} url - 脚本URL
   * @returns {Promise<void>} 加载完成的Promise
   */
  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error(`脚本加载失败: ${url}`));
      document.head.appendChild(script);
    });
  },
  
  /**
   * 检查元素是否在视口中
   * @param {Element} element - 要检查的元素
   * @returns {boolean} 是否在视口中
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  /**
   * 格式化时间
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    const hDisplay = h > 0 ? String(h).padStart(2, '0') + ':' : '';
    const mDisplay = String(m).padStart(2, '0') + ':';
    const sDisplay = String(s).padStart(2, '0');
    
    return hDisplay + mDisplay + sDisplay;
  }
};

// 导出其他工具，如有需要
export * from './otherUtils';  // 确保这行存在时，otherUtils.js文件已存在 