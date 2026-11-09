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

    const shadowHost = document.querySelector('miss-player-root');
    const playerContainer = shadowHost?.shadowRoot?.querySelector('.tm-player-container') ||
                            document.querySelector('.tm-player-container');

    let isClosing = false;
    const close = () => {
        if (isClosing) return;
        isClosing = true;
        modal.classList.remove('active');
        // 关闭模态框时主动释放内部输入框焦点，使 iOS 虚拟键盘平滑收起
        const activeInput = modal.querySelector('input:focus, textarea:focus');
        if (activeInput && typeof activeInput.blur === 'function') {
            activeInput.blur();
        }
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

    // 防止 iOS Safari 虚拟键盘打开时点击模态框内按钮在 mousedown 阶段提前触发 input blur 导致弹窗瞬移丢失点击
    modal.addEventListener('mousedown', (e) => {
        const btn = e.target?.closest?.('button');
        if (btn && modal.contains(btn) && e.cancelable) {
            e.preventDefault();
        }
    });

    // 阻止输入框内按键冒泡触发播放器快捷键，并支持 Escape 关闭当前模态框
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close();
            return;
        }
        if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') {
            e.stopPropagation();
        }
    });

    // 优先挂载在 Shadow DOM 内部的 playerContainer 中，确保继承播放器全部样式作用域、键盘自适应与 z-index 最高层级
    const targetParent = playerContainer || shadowHost?.shadowRoot || document.body;
    targetParent.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    return { modal, close };
}
