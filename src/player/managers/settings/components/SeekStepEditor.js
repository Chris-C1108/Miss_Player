import { Toast } from '../../../../utils/index.js';
import { createPillSelector } from './SettingsPrimitives.js';

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
        this._pillSelector = null;
        this._render();
    }

    _buildItems() {
        const allDisplaySteps = [...this.defaultSteps];
        this.customSteps.forEach((step) => {
            if (!allDisplaySteps.includes(step)) {
                allDisplaySteps.push(step);
            }
        });

        return allDisplaySteps.map((stepKey) => {
            const isDefault = this.defaultSteps.includes(stepKey);
            const isEnabled = this.enabledSteps.includes(stepKey);
            return {
                id: stepKey,
                label: stepKey,
                active: isEnabled,
                removable: !isDefault,
                title: isDefault ? `切换 ${stepKey}` : `自定义步长 ${stepKey}`
            };
        });
    }

    _render() {
        this.element.innerHTML = '';

        this._pillSelector = createPillSelector({
            items: this._buildItems(),
            allowAdd: true,
            onToggle: (stepKey) => {
                if (typeof this.onToggleStep === 'function') {
                    this.onToggleStep(stepKey);
                }
            },
            onDelete: (stepKey) => {
                if (typeof this.onDeleteStep === 'function') {
                    this.onDeleteStep(stepKey);
                }
            },
            onAdd: (val) => {
                const cleaned = val.trim().toLowerCase();
                if (!/^\d+[sm]$/i.test(cleaned)) {
                    Toast('格式无效！请使用数字+单位，如 45s 或 2m', 2500, 'warning');
                    return false;
                }
                if (typeof this.onAddStep === 'function') {
                    this.onAddStep(cleaned);
                }
                return true;
            }
        });

        this.element.appendChild(this._pillSelector);
    }

    updateSteps({ customSteps, enabledSteps }) {
        if (customSteps !== undefined) this.customSteps = customSteps;
        if (enabledSteps !== undefined) this.enabledSteps = enabledSteps;
        if (this._pillSelector && typeof this._pillSelector._update === 'function') {
            this._pillSelector._update(this._buildItems());
        } else {
            this._render();
        }
    }

    getElement() {
        return this.element;
    }
}
