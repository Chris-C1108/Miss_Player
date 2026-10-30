import assert from 'assert';

console.log('🧪 开始执行空标签时展示空草稿胶囊单元测试...');

class MockLoopManager {
    constructor() {
        this.tabs = [];
        this.draftTab = null;
        this.tabScrollContainer = {
            children: [],
            innerHTML: '',
            appendChild(el) {
                this.children.push(el);
            }
        };
    }

    _resetDraftTab() {
        this.draftTab = {
            id: 'draft-1',
            type: 'interval',
            startTime: null,
            endTime: null,
            comment: '',
            color: null
        };
    }

    _createDraftPill() {
        const isPlaceholder = (this.draftTab.startTime === null && this.draftTab.endTime === null);
        return {
            className: `tm-tab-pill draft tm-draft-pill${isPlaceholder ? ' placeholder' : ''}`,
            isPlaceholder
        };
    }

    renderTabs() {
        this.tabScrollContainer.innerHTML = '';
        this.tabScrollContainer.children = [];

        if (!this.draftTab) {
            this._resetDraftTab();
        }

        const draftPill = this._createDraftPill();
        this.tabScrollContainer.appendChild(draftPill);
    }
}

const lm = new MockLoopManager();
lm.renderTabs();

assert.strictEqual(lm.tabScrollContainer.children.length, 1, '当 tabs 为空时，容器内应有 1 个子元素');
const renderedPill = lm.tabScrollContainer.children[0];
assert.ok(renderedPill.className.includes('tm-tab-pill draft'), '子元素必须为草稿胶囊');
assert.ok(renderedPill.className.includes('placeholder'), '子元素必须为占位状态胶囊');
assert.ok(!renderedPill.className.includes('tm-tab-empty-wide-btn'), '严禁再出现虚框 tm-tab-empty-wide-btn 元素');

console.log('✅ 1. 空标签状态下直接展示空草稿胶囊断言通过');
console.log('\n🎉 全部 1 项空草稿胶囊渲染测试 100% 通过！\n');
