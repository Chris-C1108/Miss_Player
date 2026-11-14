import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { __ } from '../../../../constants/i18n.js';

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
        header.textContent = __('commentsGroupTitle') || '影片评论';
        this.element.appendChild(header);

        const card = new AppleCard();

        const subpanelWrapper = document.createElement('div');
        subpanelWrapper.className = 'tm-settings-subpanel-wrap';
        subpanelWrapper.style.display = this.settings.showCommentsSection ? 'block' : 'none';

        const commentsToggle = new ToggleRow({
            title: __('showComments') || '显示评论',
            subtext: __('showCommentsDesc') || '',
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
        sourcesRow.className = 'tm-apple-row tm-apple-row--column';

        const sourcesTop = document.createElement('div');
        sourcesTop.className = 'tm-apple-row-title';
        sourcesTop.textContent = __('commentSources') || '评论来源';
        sourcesRow.appendChild(sourcesTop);

        const subtext = __('commentSourcesDesc') || '';
        if (subtext) {
            const sourcesSub = document.createElement('div');
            sourcesSub.className = 'tm-apple-row-subtext';
            sourcesSub.textContent = subtext;
            sourcesRow.appendChild(sourcesSub);
        }

        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'tm-settings-sources-subpanel';

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
            title: __('filterTimeOnly') || '只看时间',
            subtext: __('filterTimeOnlyDesc') || '仅显示含时间标记的评论',
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
