import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';

export class CommentsSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'tm-settings-group-header';
        header.textContent = '评论与数据聚合';
        this.element.appendChild(header);

        const card = new AppleCard();

        const subpanelWrapper = document.createElement('div');
        subpanelWrapper.className = 'tm-settings-subpanel-wrap';
        subpanelWrapper.style.display = this.settings.showCommentsSection ? 'block' : 'none';

        const commentsToggle = new ToggleRow({
            title: '展示评论与侧边栏',
            subtext: '在播放器侧边或底部聚合多源弹幕与高赞评论',
            checked: this.settings.showCommentsSection,
            onChange: (checked) => {
                this.sm.updateSetting('showCommentsSection', checked);
                if (checked) {
                    this.sm.updateSetting('sidebarHidden', false);
                    if (this.sm.uiManager) {
                        this.sm.uiManager.isSidebarHidden = false;
                        this.sm.uiManager.updateSidebarToggleButtonIcon();
                    }
                }
                if (this.sm.controlManager?.commentPanel) {
                    this.sm.controlManager.commentPanel.updateCommentsVisibility(checked);
                }
                subpanelWrapper.style.display = checked ? 'block' : 'none';
            }
        });
        card.appendChild(commentsToggle.getElement());

        const sourcesRow = document.createElement('div');
        sourcesRow.className = 'tm-apple-row';
        sourcesRow.style.flexDirection = 'column';
        sourcesRow.style.alignItems = 'stretch';
        sourcesRow.style.gap = '8px';

        const sourcesTop = document.createElement('div');
        sourcesTop.className = 'tm-apple-row-title';
        sourcesTop.textContent = '多数据源抓取策略';
        const sourcesSub = document.createElement('div');
        sourcesSub.className = 'tm-apple-row-subtext';
        sourcesSub.textContent = '按需选择参与评论提取的站点来源';
        sourcesRow.appendChild(sourcesTop);
        sourcesRow.appendChild(sourcesSub);

        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'tm-settings-sources-subpanel';
        badgesContainer.style.display = 'flex';
        badgesContainer.style.gap = '8px';

        const sources = [
            { key: 'jable', label: 'Jable' },
            { key: 'javdb', label: 'JavDB' },
            { key: 'javlibrary', label: 'JavLibrary' }
        ];

        sources.forEach(src => {
            const badge = document.createElement('button');
            badge.type = 'button';
            const isEnabled = this.settings.enabledCommentSources?.[src.key] !== false;
            badge.className = `tm-comment-source-badge ${isEnabled ? 'enabled' : 'disabled'}`;
            badge.textContent = src.label;
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextState = !badge.classList.contains('enabled');
                badge.classList.toggle('enabled', nextState);
                badge.classList.toggle('disabled', !nextState);
                
                const current = { ...(this.settings.enabledCommentSources || {}) };
                current[src.key] = nextState;
                this.sm.updateSetting('enabledCommentSources', current);
                if (this.sm.controlManager?.commentPanel) {
                    this.sm.controlManager.commentPanel.updateCommentSources(current);
                }
            });
            badgesContainer.appendChild(badge);
        });

        sourcesRow.appendChild(badgesContainer);
        subpanelWrapper.appendChild(sourcesRow);

        const numFilterToggle = new ToggleRow({
            title: '只看时间点评论',
            subtext: '自动过滤纯文本水评，仅保留包含数字与时间戳的发言',
            checked: Boolean(this.settings.debugFilterHasNumbers),
            onChange: (checked) => {
                this.sm.updateSetting('debugFilterHasNumbers', checked);
                if (this.sm.controlManager?.commentPanel) {
                    this.sm.controlManager.commentPanel.updateDebugFilterHasNumbers(checked);
                }
            }
        });
        subpanelWrapper.appendChild(numFilterToggle.getElement());

        card.appendChild(subpanelWrapper);
        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
