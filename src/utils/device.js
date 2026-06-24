/**
 * 设备与浏览器环境检测工具函数
 */

// 缓存常用的检测结果
const _cache = {
    isIOS: null,
    isMobile: null
};

/**
 * 检测是否为iOS设备
 * @returns {boolean} - 是否为iOS设备
 */
export function isIOS() {
    if (_cache.isIOS === null) {
        _cache.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    return _cache.isIOS;
}

/**
 * 检测是否为Safari浏览器
 * @returns {boolean} - 是否为Safari浏览器
 */
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}


/**
 * 检测是否为竖屏模式
 * @returns {boolean} - 是否为竖屏模式
 */
export function isPortrait() {
    return window.innerHeight > window.innerWidth;
}


/**
 * 获取设备安全区域尺寸
 * @returns {Object} - 安全区域尺寸 {top, right, bottom, left}
 */
export function getSafeAreaInsets() {
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

const _theme = {
    original: {
        dark: null
    }
};

/**
 * 设置或更新Safari的主题色
 * @param {string} color - 主题色
 * @param {boolean} saveOriginal - 是否保存原始颜色值
 */
export function updateSafariThemeColor(color = '#000000', saveOriginal = false) {
    // 仅在Safari浏览器中执行
    if (!isSafari() && !isIOS()) return;

    // 获取当前主题色标签
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    // 保存原始颜色值（如果需要）
    if (saveOriginal && metaThemeColor && !_theme.original.dark) {
        _theme.original.dark = metaThemeColor.content;
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
export function restoreSafariThemeColor() {
    // 仅在有保存的原始颜色时恢复
    if (_theme.original.dark) {
        updateSafariThemeColor(_theme.original.dark);
    } else {
        // 如果没有原始颜色，移除主题色标签
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor && metaThemeColor.parentNode) {
            metaThemeColor.parentNode.removeChild(metaThemeColor);
        }
    }
}
