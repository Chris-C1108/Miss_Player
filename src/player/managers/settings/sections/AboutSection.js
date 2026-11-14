import { AppleCard } from '../components/AppleCard.js';
import { getCurrentVersion } from '../../../../services/SleazyForkService.js';
import { __ } from '../../../../constants/i18n.js';

export class AboutSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.isExpanded = this.sm ? this.sm.isSectionExpanded('about', false) : false;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    refresh() {
        this.isExpanded = this.sm ? this.sm.isSectionExpanded('about', true) : true;
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const currentVersion = getCurrentVersion();
        const updateInfo = this.sm?._latestUpdateInfo;
        const hasUpdate = Boolean(updateInfo?.hasUpdate);
        const latestVer = updateInfo?.latestVersion || currentVersion;
        const isChecking = Boolean(this.sm?._isCheckingUpdate);

        const card = new AppleCard();

        // 紧凑折叠 Header 行 (默认只显示版本与更新状态)
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-apple-accordion-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'tm-apple-accordion-title';
        titleDiv.innerHTML = `
            <span>ℹ️ ${__('aboutGroupTitle') || '版本信息'}</span>
        `;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'tm-apple-accordion-meta';

        let metaText = 'v' + currentVersion;
        let metaColor = 'rgba(255, 255, 255, 0.5)';
        if (isChecking) {
            metaText = __('checkingUpdate') || '检查更新中...';
            metaColor = '#0a84ff';
        } else if (hasUpdate) {
            metaText = '发现新版 v' + latestVer;
            metaColor = '#ff9f0a';
        }

        metaDiv.innerHTML = `
            <span style="color: ${metaColor}; font-weight: 500;">
                ${metaText}
            </span>
            <span class="tm-apple-accordion-arrow ${this.isExpanded ? 'expanded' : ''}">▼</span>
        `;

        headerRow.appendChild(titleDiv);
        headerRow.appendChild(metaDiv);
        card.appendChild(headerRow);

        // 详细关于卡片容器 (默认隐藏)
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'tm-apple-accordion-body';
        bodyWrap.style.display = this.isExpanded ? 'block' : 'none';

        const aboutCard = this.sm._createAboutCard();
        bodyWrap.appendChild(aboutCard);

        card.appendChild(bodyWrap);

        headerRow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isExpanded = !this.isExpanded;
            if (this.sm) {
                this.sm.setSectionExpanded('about', this.isExpanded);
            }
            bodyWrap.style.display = this.isExpanded ? 'block' : 'none';
            const arrow = metaDiv.querySelector('.tm-apple-accordion-arrow');
            if (arrow) arrow.classList.toggle('expanded', this.isExpanded);

            if (this.isExpanded) {
                // 展开时立即触发一次静默更新检查
                if (this.sm && typeof this.sm.checkUpdate === 'function') {
                    this.sm.checkUpdate(true, false);
                }

                requestAnimationFrame(() => {
                    const scrollContainer = this.element.closest('.tm-settings-panel') || this.element.closest('.tm-settings-apple-container') || this.element.parentElement;
                    if (scrollContainer) {
                        scrollContainer.scrollTo({
                            top: scrollContainer.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                });
            }
        });

        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
