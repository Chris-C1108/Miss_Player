/**
 * 统一模态框生命周期与 DOM 工具
 */

/**
 * 创建并显示一个全屏居中模态框
 * @param {string} contentHTML - 模态框内部 HTML 内容
 * @param {Object} [options] - 配置项
 * @param {Function} [options.onClose] - 关闭回调
 * @param {string} [options.extraClass] - 额外 CSS 类名
 * @returns {{ modal: HTMLElement, close: Function }}
 */
export function createModal(contentHTML, options = {}) {
    const { onClose, extraClass = '' } = options;

    const modal = document.createElement('div');
    modal.className = `tm-custom-modal-overlay ${extraClass}`.trim();
    modal.innerHTML = contentHTML;

    const close = () => {
        modal.classList.remove('active');
        const removeModal = () => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            modal.removeEventListener('transitionend', removeModal);
            if (typeof onClose === 'function') onClose();
        };
        modal.addEventListener('transitionend', removeModal, { once: true });
        // 兜底预防 transitionend 未触发
        setTimeout(removeModal, 350);
    };

    // 点击背景空白处关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            close();
        }
    });

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    return { modal, close };
}
