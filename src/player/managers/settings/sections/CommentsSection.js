import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { createGroupHeader, createPillSelector } from '../components/SettingsPrimitives.js';
import { __ } from '../../../../constants/i18n.js';
import { Toast } from '../../../../utils/index.js';

export class CommentsSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _buildSourceItems(sourcesConfig) {
        const sourceLabels = {
            jable: 'Jable',
            javdb: 'JavDB',
            javlibrary: 'JavLibrary'
        };
        return Object.keys(sourceLabels).map((key) => {
            const isEnabled = sourcesConfig[key] !== false;
            return {
                id: key,
                label: isEnabled ? `✓ ${sourceLabels[key]}` : sourceLabels[key],
                active: isEnabled,
                title: isEnabled ? `已启用 ${sourceLabels[key]}` : `点击启用 ${sourceLabels[key]}`
            };
        });
    }

    _render() {
        this.element.innerHTML = '';
        this.element.appendChild(createGroupHeader(__('commentsGroupTitle') || '影片评论'));

        const card = new AppleCard();

        const sourcesConfig = {
            jable: true,
            javdb: true,
            javlibrary: false,
            ...(this.settings.enabledCommentSources || {})
        };

        const sourcesRow = document.createElement('div');
        sourcesRow.className = 'tm-apple-row tm-apple-row--column';

        const sourcesTitle = document.createElement('div');
        sourcesTitle.className = 'tm-apple-row-title';
        sourcesTitle.textContent = __('commentSources') || '评论来源';
        sourcesRow.appendChild(sourcesTitle);

        const subtext = __('commentSourcesDesc') || '';
        if (subtext) {
            const sourcesSub = document.createElement('div');
            sourcesSub.className = 'tm-apple-row-subtext';
            sourcesSub.textContent = subtext;
            sourcesRow.appendChild(sourcesSub);
        }

        const pillSelector = createPillSelector({
            items: this._buildSourceItems(sourcesConfig),
            allowAdd: false,
            onToggle: (key) => {
                const currentlyEnabled = sourcesConfig[key] !== false;
                if (currentlyEnabled) {
                    const activeCount = ['jable', 'javdb', 'javlibrary'].filter((k) => sourcesConfig[k] !== false).length;
                    if (activeCount <= 1) {
                        Toast('至少需要保留 1 个开启的评论来源', 2000, 'warning');
                        return;
                    }
                }
                sourcesConfig[key] = !currentlyEnabled;
                const nextSources = { ...sourcesConfig };
                this.sm.updateSetting('enabledCommentSources', nextSources);
                pillSelector._update(this._buildSourceItems(nextSources));

                if (this.sm.controlManager?.commentPanel && typeof this.sm.controlManager.commentPanel.updateCommentSources === 'function') {
                    this.sm.controlManager.commentPanel.updateCommentSources(nextSources);
                }
            }
        });

        sourcesRow.appendChild(pillSelector);

        const numFilterRow = new ToggleRow({
            title: __('filterTimeOnly') || '只看时间',
            subtext: __('filterTimeOnlyDesc') || '仅显示含时间标记的评论',
            checked: Boolean(this.settings.debugFilterHasNumbers),
            onChange: (checked) => {
                this.sm.updateSetting('debugFilterHasNumbers', checked);
                if (this.sm.controlManager?.commentPanel && typeof this.sm.controlManager.commentPanel.updateDebugFilterHasNumbers === 'function') {
                    this.sm.controlManager.commentPanel.updateDebugFilterHasNumbers(checked);
                }
            }
        }).getElement();

        const syncVisibility = (show) => {
            sourcesRow.classList.toggle('is-hidden', !show);
            numFilterRow.classList.toggle('is-hidden', !show);
        };
        syncVisibility(Boolean(this.settings.showCommentsSection));

        card.appendChild(new ToggleRow({
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
                syncVisibility(checked);
            }
        }).getElement());

        card.appendChild(sourcesRow);
        card.appendChild(numFilterRow);

        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
