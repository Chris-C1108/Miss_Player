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

        this.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `tm-segmented-btn ${opt.value === this.value ? 'active' : ''}`;
            btn.textContent = opt.label;
            btn.dataset.value = opt.value;

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
            btn.classList.toggle('active', btn.dataset.value === this.value);
        });

        if (typeof this.onChange === 'function') {
            this.onChange(this.value);
        }
    }

    getElement() {
        return this.element;
    }
}
