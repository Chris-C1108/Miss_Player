/**
 * DOM操作工具类
 */
export class DOMUtils {
    /**
     * 创建并设置元素样式
     * @param {string} tag - 元素标签名
     * @param {string} className - 类名
     * @param {string} styleCSS - 内联样式
     * @returns {HTMLElement} 创建的元素
     */
    static createElementWithStyle(tag, className, styleCSS) {
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
} 