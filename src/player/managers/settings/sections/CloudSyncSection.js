import { AppleCard } from '../components/AppleCard.js';
import { SyncManager } from '../../../../sync/index.js';

export class CloudSyncSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const config = SyncManager.getWebDavConfig();
        const hasConfig = Boolean(config.url);

        const header = document.createElement('div');
        header.className = 'tm-settings-group-header';
        header.innerHTML = `
            <span>云端同步 (WebDAV)</span>
            <span style="font-size: 10px; color: ${hasConfig ? '#30d158' : 'rgba(255,255,255,0.4)'};">
                ${hasConfig ? '● 已配置' : '○ 未配置'}
            </span>
        `;
        this.element.appendChild(header);

        const card = new AppleCard();
        const webDavCard = this.sm._createWebDavSyncCard();
        webDavCard.style.padding = '10px 12px';
        webDavCard.style.background = 'transparent';
        webDavCard.style.border = 'none';

        card.appendChild(webDavCard);
        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
