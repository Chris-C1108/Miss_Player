/**
 * UI 反馈提示相关的工具函数
 */

/**
 * 彻底过滤文本中的任何 emoji 符号，严格遵照 Apple 纯净微排版与系统设计哲学
 * @param {string} text 
 * @returns {string}
 */
export function stripEmojis(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * 前端领域最佳实践 Toast 停留时长计算算法
 * 参考 Nielsen Norman Group 与 Material Design 3 认知阅读模型
 * - 基准识别启动时间 (Cognitive latency): 1400ms
 * - 中文字符平均阅读速度: ~4-5 字/秒 (约 110ms/字符)
 * - 科学约束区间: 最低 1800ms (防止闪现)，最高 4200ms (防止霸屏阻滞)
 * @param {string} msg - 提示文本
 * @param {number} [explicitDuration=0] - 显式指定时长
 * @returns {number} 经过科学计算的最佳停留毫秒数
 */
export function calculateToastDuration(msg, explicitDuration = 0) {
    if (explicitDuration && explicitDuration >= 1500) {
        return explicitDuration;
    }
    const clean = stripEmojis(msg);
    const textLen = clean.length;
    const computed = 1400 + textLen * 110;
    return Math.max(1800, Math.min(4200, Math.round(computed)));
}

/**
 * Toast 消息提示函数
 * @param {string} msg - 消息内容
 * @param {number} [duration=0] - 显示时长 (默认 0 即按人机工程最佳实践动态计算)
 * @param {string} [bgColor=''] - 消息类型 / 背景颜色
 * @param {string} [textColor=''] - 文字颜色
 * @param {string} [position='top'] - 位置(top/bottom/center)
 */
export function Toast(msg, duration = 0, bgColor = '', textColor = '', position = 'top') {
    if (typeof document === 'undefined') return;

    const cleanMsg = stripEmojis(msg);
    if (!cleanMsg) return;

    let type = 'normal';
    if (bgColor) {
        const lowerColor = bgColor.toLowerCase().trim();
        if (lowerColor === 'success' || lowerColor === 'rgb(18, 187, 2)' || lowerColor.includes('green') || lowerColor.includes('50% 45%')) {
            type = 'success';
        } else if (lowerColor === 'error' || lowerColor === 'red' || lowerColor === '#ff0000' || lowerColor.includes('destructive') || lowerColor.includes('50% 40%')) {
            type = 'error';
        } else if (lowerColor === 'info' || lowerColor.includes('blue') || lowerColor.includes('anim-quick')) {
            type = 'info';
        }
    }

    const finalDuration = calculateToastDuration(cleanMsg, duration);

    // 1. 优先使用顶栏广告翻滚跑马灯 (Rolling Billboard Toast)
    try {
        const uiManager = (typeof window !== 'undefined' && window.__missPlayerUIManager) ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container')?.uiManager;
        if (uiManager && typeof uiManager.showRollingToast === 'function') {
            uiManager.showRollingToast(cleanMsg, finalDuration, type);
            return;
        }
    } catch (_) {}

    // 2. 降级：播放器顶栏尚未就绪时，在 ShadowRoot 内部呈现轻量浮层
    const toast = document.createElement('div');
    toast.className = `tm-toast tm-toast--${position}`;
    
    let customBg = '';
    let customText = '';
    
    let iconSvg = '';
    if (type === 'success') {
        toast.classList.add('tm-toast--success');
        iconSvg = `
            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    } else if (type === 'error') {
        toast.classList.add('tm-toast--error');
        iconSvg = `
            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `;
    } else if (type === 'info') {
        toast.classList.add('tm-toast--info');
        iconSvg = `
            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;
    } else if (type === 'custom') {
        toast.style.background = customBg;
        if (customText) toast.style.color = customText;
    }
    
    toast.innerHTML = `${iconSvg}<span class="tm-toast-content">${msg}</span>`;
    
    // 优先挂载于 ShadowRoot 或播放器容器，确保作用域样式生效且在全屏下不被遮盖
    const getToastContainer = () => {
        try {
            const shadowRoot = document.querySelector('miss-player-root')?.shadowRoot;
            if (shadowRoot) {
                const playerContainer = shadowRoot.querySelector('.tm-player-container');
                return playerContainer || shadowRoot;
            }
            const directContainer = document.querySelector('.tm-player-container');
            if (directContainer) return directContainer;
        } catch (_) {}
        return document.body;
    };

    const targetContainer = getToastContainer();
    targetContainer.appendChild(toast);
    
    // Trigger transition using requestAnimationFrame
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// 静态便捷方法扩展 (兼容 Toast.show 调用)
Toast.show = (msg, duration = 3000, type = '') => Toast(msg, duration, type);
