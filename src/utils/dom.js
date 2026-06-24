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
 * 查找并检测页面中的视频元素（按优先级和尺寸大小筛选）
 * @returns {HTMLVideoElement|null} - 找到的视频元素或null
 */
export function findVideoElement() {
    let potentialVideo = null;

    // --- Strategy 1: Specific known selectors ---
    const specificSelectors = [
        '#player video',          // Common ID
        '#video video',           // Common ID
        'div.plyr__video-wrapper video', // Plyr
        '.video-js video',        // Video.js
        '#player > video',        // Direct child
        '#video-player > video',  // Another common ID
        'video[preload]:not([muted])' // Videos likely to be main content
    ];

    for (const selector of specificSelectors) {
        potentialVideo = document.querySelector(selector);
        if (potentialVideo) {
            console.log('[Utils] 通过选择器找到视频:', selector);
            return potentialVideo;
        }
    }

    // --- Strategy 2: Find all videos and prioritize ---
    const allVideos = Array.from(document.querySelectorAll('video'));

    if (allVideos.length === 0) {
        return null;
    }

    if (allVideos.length === 1) {
        return allVideos[0];
    }

    // Filter out potentially hidden or invalid videos and calculate area
    const visibleVideos = allVideos
        .map(video => ({
            element: video,
            rect: video.getBoundingClientRect(),
        }))
        .filter(item => item.rect.width > 50 && item.rect.height > 50) // Basic visibility/size check
        .map(item => ({
            ...item,
            area: item.rect.width * item.rect.height
        }))
        .sort((a, b) => b.area - a.area); // Sort by area descending

    if (visibleVideos.length > 0) {
        return visibleVideos[0].element;
    }

    // --- Strategy 3: Fallback to first video if filtering fails ---
    return allVideos[0];
}




