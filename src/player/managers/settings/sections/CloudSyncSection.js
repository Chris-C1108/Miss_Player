import { AppleCard } from '../components/AppleCard.js';
import { SyncManager } from '../../../../sync/index.js';

export class CloudSyncSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.isExpanded = false;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const config = SyncManager.getWebDavConfig();
        const hasConfig = Boolean(config.url);

        const card = new AppleCard();

        // 紧凑折叠 Header 行 (默认折叠，只占 40px 高度)
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-apple-accordion-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'tm-apple-accordion-title';
        titleDiv.innerHTML = `
            <span>☁️ 云端同步 (WebDAV)</span>
        `;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'tm-apple-accordion-meta';
        metaDiv.innerHTML = `
            <span style="color: ${hasConfig ? '#30d158' : 'rgba(255,255,255,0.4)'};">
                ${hasConfig ? '● 已配置' : '○ 未配置'}
            </span>
            <span class="tm-apple-accordion-arrow ${this.isExpanded ? 'expanded' : ''}">▼</span>
        `;

        headerRow.appendChild(titleDiv);
        headerRow.appendChild(metaDiv);
        card.appendChild(headerRow);

        // 详细表单容器 (默认隐藏)
        const bodyWrap = document.createElement('div');
        bodyWrap.style.display = this.isExpanded ? 'block' : 'none';
        bodyWrap.style.borderTop = '1px solid rgba(255, 255, 255, 0.06)';

        const webDavCard = this.sm._createWebDavSyncCard();
        webDavCard.style.padding = '10px 12px';
        webDavCard.style.background = 'transparent';
        webDavCard.style.border = 'none';
        bodyWrap.appendChild(webDavCard);

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
