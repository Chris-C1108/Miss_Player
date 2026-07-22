/**
 * 剪贴板统一工具函数
 */

/**
 * 复制文本到系统剪贴板（依次尝试 GM_setClipboard, navigator.clipboard, 降级 textarea）
 * @param {string} text - 目标文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
    if (typeof GM_setClipboard === 'function') {
        try {
            GM_setClipboard(text);
            return true;
        } catch {
            // 继续向下退回
        }
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // 继续向下退回
        }
    }

    // 最后的 textarea 降级选区复制
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    } catch (err) {
        console.error('[clipboard] 复制到剪贴板失败:', err);
        return false;
    }
}
