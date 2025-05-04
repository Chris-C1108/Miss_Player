/**
 * 加载CSS样式
 */
export function initCSSVariables() {
    // 直接导入 CSS 文件，webpack 会通过 style-loader 处理
    require('../player/ui/style.css');
} 