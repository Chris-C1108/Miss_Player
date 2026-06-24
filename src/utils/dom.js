/**
 * DOM 操作与查询工具函数
 */

/**
 * 创建并设置元素样式
 * @param {string} tag - 元素标签名
 * @param {string} className - 类名
 * @param {string} styleCSS - 内联样式
 * @returns {HTMLElement} 创建的元素
 */
export function createElementWithStyle(tag, className, styleCSS) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (styleCSS) element.style.cssText = styleCSS;
    return element;
}

/**
 * 创建SVG图标
 * @param {string} path - SVG路径
 * @param {number} size - 图标大小
 * @returns {SVGElement} 创建的SVG元素
 */
export function createSVGIcon(path, size = 24) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    svg.appendChild(pathElement);
    
    return svg;
}

/**
 * 为元素添加事件委托
 * @param {HTMLElement} element - 父元素
 * @param {string} eventType - 事件类型
 * @param {string} selector - CSS选择器
 * @param {Function} handler - 处理函数
 * @param {Object} options - 事件选项
 */
export function delegateEvent(element, eventType, selector, handler, options) {
    element.addEventListener(eventType, (event) => {
        const target = event.target.closest(selector);
        if (target && element.contains(target)) {
            handler.call(target, event);
        }
    }, options);
}

/**
 * 等待 DOM 元素出现
 * @param {string} selector - CSS 选择器
 * @param {number} timeout - 超时时间 (毫秒)
 * @param {number} interval - 检查间隔 (毫秒)
 * @returns {Promise<Element>} DOM 元素
 */
export function waitForElement(selector, timeout = 10000, interval = 100) {
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
 * 检测页面中是否存在视频元素
 * @returns {HTMLVideoElement|null} - 找到的视频元素或null
 */
export function findVideoElement() {
    // 常见视频选择器
    const specificSelectors = [
        '#player video',          // 常见ID
        '#video video',           // 常见ID
        'div.plyr__video-wrapper video', // Plyr
        '.video-js video',        // Video.js
        '#player > video',        // 直接子元素
        '#video-player > video',  // 另一个常见ID
        'video[preload]:not([muted])', // 可能是主要内容的视频
        'video[src]',             // 带有src属性的视频
        'video.video-main',       // 主视频类
        'main video',             // 主要内容区域中的视频
        'video',                  // 所有视频（最低优先级）
    ];

    // 按优先级顺序查找视频元素
    for (const selector of specificSelectors) {
        const videos = document.querySelectorAll(selector);
        if (videos.length > 0) {
            console.log(`[Utils] 找到视频元素：${selector}`);
            return videos[0]; // 返回第一个匹配的视频元素
        }
    }

    return null; // 未找到视频元素
}

/**
 * 检查元素是否在视口中
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 是否在视口中
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * 动态加载脚本
 * @param {string} url - 脚本URL
 * @returns {Promise<void>} 加载完成的Promise
 */
export function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error(`脚本加载失败: ${url}`));
        document.head.appendChild(script);
    });
}
