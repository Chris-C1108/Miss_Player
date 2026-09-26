import { AppleCard } from '../components/AppleCard.js';
import { getCurrentVersion } from '../../../../services/SleazyForkService.js';

export class AboutSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.isExpanded = false;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const currentVersion = getCurrentVersion();
        const updateInfo = this.sm._latestUpdateInfo;
        const hasUpdate = Boolean(updateInfo?.hasUpdate);
        const latestVer = updateInfo?.latestVersion || currentVersion;

        const card = new AppleCard();

        // 紧凑折叠 Header 行 (默认只显示版本与更新状态)
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-apple-accordion-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'tm-apple-accordion-title';
        titleDiv.innerHTML = `
            <span>ℹ️ 关于与更新</span>
        `;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'tm-apple-accordion-meta';
        metaDiv.innerHTML = `
            <span style="color: ${hasUpdate ? '#ff9f0a' : 'rgba(255,255,255,0.5)'}; font-weight: 500;">
                ${hasUpdate ? ('发现新版 v' + latestVer) : ('v' + currentVersion)}
            </span>
            <span class="tm-apple-accordion-arrow ${this.isExpanded ? 'expanded' : ''}">▼</span>
        `;

        headerRow.appendChild(titleDiv);
        headerRow.appendChild(metaDiv);
        card.appendChild(headerRow);

        // 详细关于卡片容器 (默认隐藏)
        const bodyWrap = document.createElement('div');
        bodyWrap.style.display = this.isExpanded ? 'block' : 'none';
        bodyWrap.style.borderTop = '1px solid rgba(255, 255, 255, 0.06)';

        const aboutCard = this.sm._createAboutCard();
        aboutCard.style.padding = '10px 12px';
        aboutCard.style.background = 'transparent';
        aboutCard.style.border = 'none';
        bodyWrap.appendChild(aboutCard);

        card.appendChild(bodyWrap);

        headerRow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isExpanded = !this.isExpanded;
            bodyWrap.style.display = this.isExpanded ? 'block' : 'none';
            const arrow = metaDiv.querySelector('.tm-apple-accordion-arrow');
            if (arrow) arrow.classList.toggle('expanded', this.isExpanded);
        });

        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
