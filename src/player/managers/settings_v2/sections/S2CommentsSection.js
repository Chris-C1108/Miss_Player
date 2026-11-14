import {
    createGroup,
    createCard,
    createSegmentedRow
} from '../components/S2Primitives.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';

export class S2CommentsSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = createGroup(__('commentsGroupTitle') || '评论');
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

        // 1. 时间排序
        const sortRow = createSegmentedRow({
            title: __('s2SortOrder') || '评论时间排序',
            options: [
                { label: __('s2SortAsc') || '正序', value: 'asc' },
                { label: __('s2SortDesc') || '倒序', value: 'desc' }
            ],
            value: this.settings.commentSortOrder || 'asc',
            onChange: (val) => {
                this.sm.updateSetting('commentSortOrder', val);
                const commentPanel = this.sm.controlManager?.commentPanel;
                if (commentPanel) {
                    commentPanel.sortOrder = val;
                    commentPanel.updateSortButtonsUI();
                    commentPanel.renderComments();
                }
            }
        });
        card.appendChild(sortRow.element);

        // 2. 评论数据源多选芯片
        const sourcesRow = document.createElement('div');
        sourcesRow.className = 'mp-s2-row mp-s2-row--stacked';

        const textCol = document.createElement('div');
        textCol.className = 'mp-s2-row-text';

        const titleEl = document.createElement('div');
        titleEl.className = 'mp-s2-row-title';
        titleEl.textContent = __('s2CommentSources') || '启用的评论源';

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
            const enabledList = Array.isArray(this.settings.enabledCommentSources)
                ? [...this.settings.enabledCommentSources]
                : ['jable', 'javdb', 'javlibrary'];

            sources.forEach(src => {
                const isActive = enabledList.includes(src.id);
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = `mp-s2-chip ${isActive ? 'is-active' : ''}`.trim();
                chip.textContent = src.label;

                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    let next = [...enabledList];
                    if (isActive) {
                        if (next.length <= 1) {
                            Toast(__('atLeastOneSource') || '请至少保留一个评论源', 2000, 'warning');
                            return;
                        }
                        next = next.filter(id => id !== src.id);
                    } else {
                        next.push(src.id);
                    }
                    this.sm.updateSetting('enabledCommentSources', next);
                    const commentPanel = this.sm.controlManager?.commentPanel;
                    if (commentPanel) {
                        commentPanel.loadComments(1);
                    }
                    renderSourceChips();
                });

                chipsWrap.appendChild(chip);
            });
        };

        renderSourceChips();
        sourcesRow.appendChild(textCol);
        sourcesRow.appendChild(chipsWrap);
        card.appendChild(sourcesRow);

        this.element.appendChild(card);
    }
}
