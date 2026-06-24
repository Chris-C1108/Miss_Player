/**
 * UI 反馈提示相关的工具函数
 */

/**
 * Toast 消息提示函数
 * @param {string} msg - 消息内容
 * @param {number} [duration=3000] - 显示时长(毫秒)
 * @param {string} [bgColor='rgba(0, 0, 0, 0.8)'] - 背景颜色
 * @param {string} [textColor='#fff'] - 文字颜色
 * @param {string} [position='top'] - 位置(top/bottom/center)
 */
export function Toast(msg, duration = 3000, bgColor = '', textColor = '', position = 'top') {
    const toast = document.createElement('div');
    toast.className = `tm-toast tm-toast--${position}`;
    
    let type = 'normal';
    let customBg = '';
    let customText = '';
    
    if (bgColor) {
        const lowerColor = bgColor.toLowerCase().trim();
        if (lowerColor === 'success' || lowerColor === 'rgb(18, 187, 2)' || lowerColor.includes('green') || lowerColor.includes('50% 45%')) {
            type = 'success';
        } else if (lowerColor === 'error' || lowerColor === 'red' || lowerColor === '#ff0000' || lowerColor.includes('destructive') || lowerColor.includes('50% 40%')) {
            type = 'error';
        } else if (lowerColor === 'info' || lowerColor.includes('blue') || lowerColor.includes('anim-quick')) {
            type = 'info';
        } else {
            type = 'custom';
            customBg = bgColor;
            customText = textColor;
        }
    }
    
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
    
    document.body.appendChild(toast);
    
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
