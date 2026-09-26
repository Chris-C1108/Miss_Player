import { Toast } from '../../../../utils/index.js';

export class SeekStepEditor {
    constructor({
        defaultSteps = ['5s', '10s', '30s', '1m', '5m', '10m'],
        customSteps = [],
        enabledSteps = ['5s', '10s', '30s', '1m', '5m', '10m'],
        onToggleStep = null,
        onAddStep = null,
        onDeleteStep = null
    } = {}) {
        this.defaultSteps = defaultSteps;
        this.customSteps = customSteps;
        this.enabledSteps = enabledSteps;
        this.onToggleStep = onToggleStep;
        this.onAddStep = onAddStep;
        this.onDeleteStep = onDeleteStep;

        this.element = document.createElement('div');
        this.element.className = 'tm-settings-seek-steps-subpanel';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        this.element.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                this.element.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        const allDisplaySteps = [...this.defaultSteps];
        this.customSteps.forEach(step => {
            if (!allDisplaySteps.includes(step)) {
                allDisplaySteps.push(step);
            }
        });

        allDisplaySteps.forEach(stepKey => {
            const isDefault = this.defaultSteps.includes(stepKey);
            const isEnabled = this.enabledSteps.includes(stepKey);

            const badge = document.createElement('button');
            badge.type = 'button';
            badge.className = `tm-seek-step-badge${isEnabled ? ' enabled' : ' disabled'}`;
            badge.textContent = stepKey;

            let isLongPressTriggered = false;
            let longPressTimer = null;

            const startLongPress = () => {
                isLongPressTriggered = false;
                longPressTimer = setTimeout(() => {
                    isLongPressTriggered = true;
                    if (isDefault) {
                        Toast('默认 6 个预设步进不支持删除', 2000, 'warning');
                    } else if (typeof this.onDeleteStep === 'function') {
                        this.onDeleteStep(stepKey);
                    }
                }, 600);
            };

            const cancelLongPress = () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            };

            badge.addEventListener('mousedown', startLongPress);
            badge.addEventListener('touchstart', startLongPress, { passive: true });
            badge.addEventListener('mouseup', cancelLongPress);
            badge.addEventListener('mouseleave', cancelLongPress);
            badge.addEventListener('touchend', cancelLongPress);
            badge.addEventListener('touchcancel', cancelLongPress);

            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isLongPressTriggered) return;
                if (typeof this.onToggleStep === 'function') {
                    this.onToggleStep(stepKey);
                }
            });

            this.element.appendChild(badge);
        });

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'tm-seek-step-badge tm-seek-step-add-badge';
        addBtn.title = '添加自定义跳转秒数/分钟 (如: 15s, 2m)';
        addBtn.innerHTML = '+ 自定义';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const input = prompt('请输入自定义跳转时长 (如 15s 或 2m):', '15s');
            if (input && typeof this.onAddStep === 'function') {
                this.onAddStep(input.trim());
            }
        });

        this.element.appendChild(addBtn);
    }

    updateSteps({ customSteps, enabledSteps }) {
        if (customSteps) this.customSteps = customSteps;
        if (enabledSteps) this.enabledSteps = enabledSteps;
        this._render();
    }

    getElement() {
        return this.element;
    }
}
