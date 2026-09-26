export class ToggleRow {
    constructor({
        title = '',
        subtext = '',
        checked = false,
        onChange = null,
        className = '',
        id = ''
    } = {}) {
        this.title = title;
        this.subtext = subtext;
        this.checked = Boolean(checked);
        this.onChange = onChange;

        this.element = document.createElement('div');
        this.element.className = `tm-apple-row ${className}`.trim();
        if (id) this.element.id = id;

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const left = document.createElement('div');
        left.className = 'tm-apple-row-left';

        const titleEl = document.createElement('div');
        titleEl.className = 'tm-apple-row-title';
        titleEl.textContent = this.title;
        left.appendChild(titleEl);

        if (this.subtext) {
            const subtextEl = document.createElement('div');
            subtextEl.className = 'tm-apple-row-subtext';
            subtextEl.textContent = this.subtext;
            left.appendChild(subtextEl);
        }

        const right = document.createElement('div');
        right.className = 'tm-apple-row-right';

        this.switchBtn = document.createElement('button');
        this.switchBtn.className = `tm-apple-switch ${this.checked ? 'active' : ''}`;
        this.switchBtn.setAttribute('type', 'button');
        this.switchBtn.setAttribute('role', 'switch');
        this.switchBtn.setAttribute('aria-checked', String(this.checked));

        right.appendChild(this.switchBtn);

        this.element.appendChild(left);
        this.element.appendChild(right);
    }

    toggle(forceState = null) {
        const nextState = typeof forceState === 'boolean' ? forceState : !this.checked;
        if (this.checked === nextState) return;
        this.checked = nextState;

        if (this.switchBtn) {
            this.switchBtn.classList.toggle('active', this.checked);
            this.switchBtn.setAttribute('aria-checked', String(this.checked));
        }

        if (typeof this.onChange === 'function') {
            this.onChange(this.checked);
        }
    }

    getElement() {
        return this.element;
    }
}
