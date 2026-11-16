import {
    createGroup,
    createCard,
    createToggleRow
} from '../components/S2Primitives.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';

export class S2CommentsSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = createGroup(__('commentsGroupTitle') || '影片评论');
        this._render();
    }

    getElement() {
        return this.element;
    }

    _render() {
        const oldLabel = this.element.querySelector('.mp-s2-group-label');
        this.element.innerHTML = '';
        if (oldLabel) this.element.appendChild(oldLabel);

        const card = createCard();
        const showComments = this.settings.showCommentsSection !== false;

        const subWrap = document.createElement('div');
        subWrap.className = `mp-s2-conditional ${showComments ? '' : 'is-hidden'}`.trim();

        // 1. 显示评论开关
        const commentsToggleRow = createToggleRow({
            title: __('showComments') || '显示评论',
            checked: showComments,
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
                subWrap.classList.toggle('is-hidden', !checked);
            }
        });
        card.appendChild(commentsToggleRow.element);

        // 2. 评论数据源多选芯片 (对象映射 { jable, javdb, javlibrary })
        const sourcesRow = document.createElement('div');
        sourcesRow.className = 'mp-s2-row mp-s2-row--stacked';

        const textCol = document.createElement('div');
        textCol.className = 'mp-s2-row-text';

        const titleEl = document.createElement('div');
        titleEl.className = 'mp-s2-row-title';
        titleEl.textContent = __('commentSources') || '评论来源';

        textCol.appendChild(titleEl);

        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'mp-s2-chips';

        const sources = [
            { id: 'jable', label: 'Jable' },
            { id: 'javdb', label: 'JavDB' },
            { id: 'javlibrary', label: 'JavLibrary' }
        ];

        const renderSourceChips = () => {
            chipsWrap.innerHTML = '';
            const currentMap = this.settings.enabledCommentSources && typeof this.settings.enabledCommentSources === 'object' && !Array.isArray(this.settings.enabledCommentSources)
                ? this.settings.enabledCommentSources
                : { jable: true, javdb: true, javlibrary: true };

            sources.forEach(src => {
                const isActive = currentMap[src.id] !== false;
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = `mp-s2-chip ${isActive ? 'is-active' : ''}`.trim();
                chip.textContent = src.label;

                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const nextMap = {
                        jable: currentMap.jable !== false,
                        javdb: currentMap.javdb !== false,
                        javlibrary: currentMap.javlibrary !== false,
                        [src.id]: !isActive
                    };
                    const activeCount = Object.values(nextMap).filter(Boolean).length;
                    if (activeCount === 0) {
                        Toast(__('atLeastOneSource') || '请至少保留一个评论源', 2000, 'warning');
                        return;
                    }
                    this.sm.updateSetting('enabledCommentSources', nextMap);
                    const commentPanel = this.sm.controlManager?.commentPanel;
                    if (commentPanel && typeof commentPanel.updateCommentSources === 'function') {
                        commentPanel.updateCommentSources(nextMap);
                    }
                    renderSourceChips();
                });

                chipsWrap.appendChild(chip);
            });
        };

        renderSourceChips();
        sourcesRow.appendChild(textCol);
        sourcesRow.appendChild(chipsWrap);
        subWrap.appendChild(sourcesRow);

        // 3. 只看时间评论
        const filterNumRow = createToggleRow({
            title: __('filterTimeOnly') || '只看时间',
            checked: Boolean(this.settings.debugFilterHasNumbers),
            onChange: (checked) => {
                this.sm.updateSetting('debugFilterHasNumbers', checked);
                const commentPanel = this.sm.controlManager?.commentPanel;
                if (commentPanel && typeof commentPanel.updateFilterHasNumbers === 'function') {
                    commentPanel.updateFilterHasNumbers(checked);
                }
            }
        });
        subWrap.appendChild(filterNumRow.element);

        card.appendChild(subWrap);
        this.element.appendChild(card);
    }
}
