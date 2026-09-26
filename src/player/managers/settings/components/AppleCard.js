export class AppleCard {
    constructor({ className = '', id = '' } = {}) {
        this.element = document.createElement('div');
        this.element.className = `tm-apple-card ${className}`.trim();
        if (id) this.element.id = id;
    }

    appendChild(child) {
        if (child) this.element.appendChild(child);
        return this;
    }

    getElement() {
        return this.element;
    }
}
