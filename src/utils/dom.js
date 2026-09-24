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
            // logger.debug('[Utils] 通过选择器找到视频:', selector);
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

/**
 * 为按钮生成 Material 风格的波纹扩散动画 (Ripple Effect)
 * 从指针点击的精确坐标位置为圆心，自 scale(0) 扩散至 scale(2.6) 并在 ~0.6s 内淡出移除
 * @param {MouseEvent|PointerEvent|TouchEvent} event - 点击事件对象
 * @param {HTMLElement} button - 承载波纹的容器元素
 * @param {string} [color] - 可选自定义波纹背景色
 * @returns {HTMLElement|null} 生成的波纹元素
 */
export function createRipple(event, button, color) {
    if (!button || typeof button.getBoundingClientRect !== 'function') return null;

    const r = button.getBoundingClientRect();
    const size = Math.max(r.width, r.height);

    // 获取指针相对于视口的精确坐标，兼顾触控事件与键盘触发回退
    let clientX = r.left + r.width / 2;
    let clientY = r.top + r.height / 2;

    if (event) {
        if (typeof event.clientX === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else if (event.touches && event.touches[0]) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.changedTouches && event.changedTouches[0]) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        }
    }

    const x = clientX - r.left - size / 2;
    const y = clientY - r.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple tm-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    if (color) {
        ripple.style.background = color;
    }

    button.appendChild(ripple);

    const removeRipple = () => {
        ripple.removeEventListener('animationend', removeRipple);
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    };

    ripple.addEventListener('animationend', removeRipple, { once: true });
    setTimeout(removeRipple, 650);

    return ripple;
}

/**
 * 高鲁棒性视频总时长提取器 (按真实 <video> -> Meta 标签 -> 播放器 UI 文本 -> 页面元数据多层级提取)
 * @param {HTMLVideoElement|null} [videoElement] 
 * @returns {number} 视频总秒数 (整数)
 */
export function getVideoDurationSeconds(videoElement = null) {
    // 1. 直取 HTML5 <video> 元素物理时长
    const v = videoElement || document.querySelector('.tm-video-wrapper video, video');
    if (v && v.duration && !isNaN(v.duration) && v.duration > 0 && v.duration !== Infinity) {
        return Math.round(v.duration);
    }

    if (typeof document === 'undefined') return 0;

    // 2. 从页面 Meta 标头提取 (MissAV / Jable / JavDB / OpenGraph)
    const metaDur = document.querySelector('meta[property="video:duration"], meta[property="og:video:duration"], meta[name="duration"]');
    if (metaDur) {
        const val = parseInt(metaDur.getAttribute('content'), 10);
        if (!isNaN(val) && val > 0) return val;
    }

    // 3. 从播放器 UI 文本提取 (如 Plyr, Video.js, Jable 播放条时间)
    const durationEl = document.querySelector('.plyr__time--duration, .vjs-duration-display, .total-time, .duration, span.time-duration');
    if (durationEl && durationEl.textContent) {
        const m = durationEl.textContent.trim().match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/);
        if (m) {
            const h = m[1] ? parseInt(m[1], 10) : 0;
            const min = parseInt(m[2], 10);
            const sec = parseInt(m[3], 10);
            const total = h * 3600 + min * 60 + sec;
            if (total > 0) return total;
        }
    }

    // 4. 从 JavDB / Jable 详情面板文本提取 (例如 "120 分鐘" / "120 分钟")
    const panelEls = document.querySelectorAll('.video-meta-panel .value, .video-info .value, .header-video-duration');
    for (const el of panelEls) {
        const m = (el.textContent || '').match(/(\d{1,3})\s*分[鐘钟]/);
        if (m) {
            return parseInt(m[1], 10) * 60;
        }
    }

    return 0;
}


/**
 * 从文本或时长徽章中精准解析秒数 (支持 HH:MM:SS 和 MM:SS，如 02:14:35, 124:35, 58:12)
 * @param {string} txt
 * @returns {number} 秒数 (未匹配则返回 0)
 */
export function parseDurationFromBadge(txt) {
    if (!txt || typeof txt !== 'string') return 0;
    const clean = txt.trim();
    // 1. HH:MM:SS (例如 02:14:35 或 1:35:20)
    const m1 = clean.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (m1) {
        return parseInt(m1[1], 10) * 3600 + parseInt(m1[2], 10) * 60 + parseInt(m1[3], 10);
    }
    // 2. MM:SS (例如 124:35 或 58:12，注意分钟可为 3 位数)
    const m2 = clean.match(/^(\d{1,3}):(\d{2})$/);
    if (m2) {
        return parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
    }
    return 0;
}
