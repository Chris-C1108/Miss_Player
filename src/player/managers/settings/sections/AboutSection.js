import { AppleCard } from '../components/AppleCard.js';

export class AboutSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'tm-settings-group-header';
        header.textContent = '关于与更新';
        this.element.appendChild(header);

        const card = new AppleCard();
        const aboutCard = this.sm._createAboutCard();
        aboutCard.style.padding = '12px 14px';
        aboutCard.style.background = 'transparent';
        aboutCard.style.border = 'none';

        card.appendChild(aboutCard);
        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
