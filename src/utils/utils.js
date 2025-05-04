/**
 * 工具类 - 通用功能函数集合
 */
export class Utils {
    // 缓存常用的检测结果
    static _cache = {
        isIOS: null,
        safeAreaInsets: null, 
        lastOrientation: null
    };

    // 主题颜色相关
    static _theme = {
        original: {
            light: null,
            dark: null
        }
    };

    /**
     * 节流函数 - 限制函数执行频率
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 延迟时间(ms)
     * @returns {Function} - 节流后的函数
     */
    static throttle(fn, delay = 200) {
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
    static debounce(fn, delay = 200) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
                timer = null;
            }, delay);
        };
    }

    /**
     * 检测是否为iOS设备
     * @returns {boolean} - 是否为iOS设备
     */
    static isIOS() {
        if (this._cache.isIOS === null) {
            this._cache.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        }
        return this._cache.isIOS;
    }

    /**
     * 检测是否为Safari浏览器
     * @returns {boolean} - 是否为Safari浏览器
     */
    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    /**
     * 检测是否为竖屏模式
     * @returns {boolean} - 是否为竖屏模式
     */
    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    /**
     * 检查设备和屏幕方向
     * @returns {boolean} - 当前是否为竖屏状态
     */
    static checkDeviceAndOrientation() {
        return this.isPortrait();
    }

    /**
     * 获取设备安全区域尺寸
     * @returns {Object} - 安全区域尺寸 {top, right, bottom, left}
     */
    static getSafeAreaInsets() {
        const defaultTopInset = 44;    // 默认顶部安全区域
        const defaultBottomInset = 34; // 默认底部安全区域
        const defaultSideInset = 16;   // 默认左右安全区域

        const style = window.getComputedStyle(document.documentElement);
        return {
            top: parseInt(style.getPropertyValue('--sat') || 
                style.getPropertyValue('--safe-area-inset-top') || '0', 10) || defaultTopInset,
            right: parseInt(style.getPropertyValue('--sar') || 
                style.getPropertyValue('--safe-area-inset-right') || '0', 10) || defaultSideInset,
            bottom: parseInt(style.getPropertyValue('--sab') || 
                style.getPropertyValue('--safe-area-inset-bottom') || '0', 10) || defaultBottomInset,
            left: parseInt(style.getPropertyValue('--sal') || 
                style.getPropertyValue('--safe-area-inset-left') || '0', 10) || defaultSideInset
        };
    }

    /**
     * 创建带样式的HTML元素
     * @param {string} tag - HTML标签名
     * @param {string} className - CSS类名
     * @param {string} style - 内联样式
     * @returns {HTMLElement} - 创建的元素
     */
    static createElementWithStyle(tag, className, style) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (style) element.style.cssText = style;
        return element;
    }

    /**
     * 创建SVG图标
     * @param {string} path - SVG路径
     * @param {number} size - 图标大小
     * @returns {SVGElement} - SVG图标元素
     */
    static createSVGIcon(path, size = 24) {
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
     * 检测页面中是否存在视频元素
     * @returns {HTMLVideoElement|null} - 找到的视频元素或null
     */
    static findVideoElement() {
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
     * 格式化时间为 mm:ss 或 hh:mm:ss
     * @param {number} seconds - 秒数
     * @returns {string} - 格式化后的时间字符串
     */
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * 设置或更新Safari的主题色
     * @param {string} color - 主题色
     * @param {boolean} saveOriginal - 是否保存原始颜色值
     */
    static updateSafariThemeColor(color = '#000000', saveOriginal = false) {
        // 仅在Safari浏览器中执行
        if (!this.isSafari() && !this.isIOS()) return;

        // 获取当前主题色标签
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        // 保存原始颜色值（如果需要）
        if (saveOriginal && metaThemeColor && !this._theme.original.dark) {
            this._theme.original.dark = metaThemeColor.content;
        }
        
        // 如果标签不存在，创建新标签
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        // 设置颜色值
        metaThemeColor.content = color;
    }

    /**
     * 恢复Safari的原始主题色
     */
    static restoreSafariThemeColor() {
        // 仅在有保存的原始颜色时恢复
        if (this._theme.original.dark) {
            this.updateSafariThemeColor(this._theme.original.dark);
        } else {
            // 如果没有原始颜色，移除主题色标签
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor && metaThemeColor.parentNode) {
                metaThemeColor.parentNode.removeChild(metaThemeColor);
            }
        }
    }
} 