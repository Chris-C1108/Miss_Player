export class SegmentedControl {
    constructor({
        options = [],
        value = '',
        onChange = null,
        className = '',
        id = ''
    } = {}) {
        this.options = options;
        this.value = value || (options[0] ? options[0].value : '');
        this.onChange = onChange;

        this.element = document.createElement('div');
        this.element.className = `tm-segmented-control ${className}`.trim();
        if (id) this.element.id = id;

        this._render();
    }

    _render() {
        this.element.innerHTML = '';
        this.element.style.cssText = 'display: flex; background: rgba(0, 0, 0, 0.28); border-radius: 8px; padding: 2px; position: relative; gap: 2px; border: 1px solid rgba(255, 255, 255, 0.08);';

        this.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `tm-segmented-btn ${opt.value === this.value ? 'active' : ''}`;
            btn.textContent = opt.label;
            btn.dataset.value = opt.value;
            
            const isSelected = opt.value === this.value;
            btn.style.cssText = `
                flex: 1;
                font-size: 11.5px;
                font-weight: ${isSelected ? '600' : '400'};
                color: ${isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'};
                background: ${isSelected ? 'rgba(255, 255, 255, 0.16)' : 'transparent'};
                border: none;
                border-radius: 6px;
                padding: 6px 8px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                white-space: nowrap;
                outline: none;
            `;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setValue(opt.value);
            });

            this.element.appendChild(btn);
        });
    }

    setValue(nextVal) {
        if (this.value === nextVal) return;
        this.value = nextVal;

        const btns = this.element.querySelectorAll('.tm-segmented-btn');
        btns.forEach((btn) => {
            const isSelected = btn.dataset.value === this.value;
            btn.classList.toggle('active', isSelected);
            btn.style.fontWeight = isSelected ? '600' : '400';
            btn.style.color = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
            btn.style.background = isSelected ? 'rgba(255, 255, 255, 0.16)' : 'transparent';
        });

        if (typeof this.onChange === 'function') {
            this.onChange(this.value);
        }
    }

    getElement() {
        return this.element;
    }
}
