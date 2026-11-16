export class ToggleRow {
    constructor({
        title = '',
        subtext = '',
        checked = false,
        disabled = false,
        onChange = null,
        className = '',
        id = ''
    } = {}) {
        this.title = title;
        this.subtext = subtext;
        this.defaultSubtext = subtext;
        this.checked = Boolean(checked);
        this.disabled = Boolean(disabled);
        this.onChange = onChange;

        this.element = document.createElement('div');
        this.element.className = `tm-apple-row ${this.disabled ? 'is-disabled' : ''} ${className}`.trim();
        if (id) this.element.id = id;

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.disabled) return;
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

        this.subtextEl = document.createElement('div');
        this.subtextEl.className = 'tm-apple-row-subtext';
        this.subtextEl.textContent = this.subtext || '';
        if (!this.subtext) this.subtextEl.classList.add('is-hidden');
        left.appendChild(this.subtextEl);

        const right = document.createElement('div');
        right.className = 'tm-apple-row-right';

        this.switchBtn = document.createElement('button');
        this.switchBtn.className = `tm-apple-switch ${this.checked ? 'active' : ''}`;
        this.switchBtn.setAttribute('type', 'button');
        this.switchBtn.setAttribute('role', 'switch');
        this.switchBtn.setAttribute('aria-checked', String(this.checked));
        this.switchBtn.disabled = this.disabled;

        right.appendChild(this.switchBtn);

        this.element.appendChild(left);
        this.element.appendChild(right);
    }

    setDisabled(disabled, nextSubtext = null) {
        this.disabled = Boolean(disabled);
        this.element.classList.toggle('is-disabled', this.disabled);
        if (this.switchBtn) {
            this.switchBtn.disabled = this.disabled;
            this.switchBtn.setAttribute('aria-disabled', String(this.disabled));
        }
        if (this.subtextEl) {
            const text = nextSubtext !== null ? nextSubtext : this.defaultSubtext;
            this.subtext = text || '';
            this.subtextEl.textContent = this.subtext;
            this.subtextEl.classList.toggle('is-hidden', !this.subtext);
        }
    }

    setChecked(checked) {
        this.checked = Boolean(checked);
        if (this.switchBtn) {
            this.switchBtn.classList.toggle('active', this.checked);
            this.switchBtn.setAttribute('aria-checked', String(this.checked));
        }
    }

    toggle(forceState = null) {
        if (this.disabled && forceState === null) return;
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
