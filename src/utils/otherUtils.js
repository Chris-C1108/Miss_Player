/**
 * 其他辅助工具函数
 */

/**
 * 防抖函数 - 延迟执行函数直到停止调用一段时间后
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

/**
 * 存储数据到本地存储
 * @param {string} key - 存储键名
 * @param {any} value - 存储值
 */
export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('本地存储写入失败:', e);
  }
}

/**
 * 从本地存储获取数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 获取的值
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('本地存储读取失败:', e);
    return defaultValue;
  }
}

/**
 * 检测是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @param {string} url - URL，默认为当前页面URL
 * @returns {string|null} 参数值
 */
export function getUrlParam(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export function copyToClipboard(text) {
  return new Promise((resolve) => {
    // 尝试使用现代API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(() => {
          // 降级到传统方法
          fallbackCopyToClipboard(text) ? resolve(true) : resolve(false);
        });
    } else {
      // 使用传统方法
      fallbackCopyToClipboard(text) ? resolve(true) : resolve(false);
    }
  });
}

/**
 * 传统的复制到剪贴板方法
 * @param {string} text - 要复制的文本
 * @returns {boolean} 是否复制成功
 */
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (e) {
    console.error('剪贴板复制失败:', e);
  }
  
  document.body.removeChild(textArea);
  return success;
} 