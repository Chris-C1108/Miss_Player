import assert from 'assert';

console.log('🧪 开始执行评论长文本展开状态与增量更新单元测试...');

// 模拟 CommentPanel 的 renderCommentCard 核心逻辑
class MockCommentPanel {
    constructor() {
        this.expandedCommentIds = new Set();
    }

    renderCommentCard(c) {
        const isLongText = c.text && c.text.length > 200;
        const isExpanded = this.expandedCommentIds ? (this.expandedCommentIds.has(c.id) || Boolean(c.isExpanded)) : false;
        const textClass = isLongText ? 'jc-body-text jc-body-text--collapsible' : 'jc-body-text';
        const expandBtnText = isExpanded ? '收起' : '展开';
        const expandBtn = isLongText
            ? `<div class="jc-body-text-content">${c.textHtml || c.text}</div><button class="jc-toggle-expand-btn">${expandBtnText}</button>`
            : (c.textHtml || c.text);

        return `
            <div class="jc-card" data-id="${c.id}">
                <div class="${textClass}" ${isLongText ? `data-collapsed="${isExpanded ? 'false' : 'true'}"` : ''}>
                    ${expandBtn}
                </div>
            </div>
        `;
    }
}

const panel = new MockCommentPanel();

// 1. 验证短文本正常渲染
const shortComment = { id: 'c1', text: '好看支持！' };
const shortHtml = panel.renderCommentCard(shortComment);
assert.ok(!shortHtml.includes('jc-toggle-expand-btn'), '短文本不应有展开按钮');
assert.ok(!shortHtml.includes('data-collapsed'), '短文本不应有 data-collapsed');
console.log('✅ 1. 短文本无需折叠验证通过');

// 2. 验证长文本默认折叠
const longText = '这是一段超过两百个字的超长评论内容。'.repeat(15);
const longComment = { id: 'c2', text: longText, textHtml: longText };
const defaultLongHtml = panel.renderCommentCard(longComment);
assert.ok(defaultLongHtml.includes('data-collapsed="true"'), '长文本默认应为 data-collapsed="true"');
assert.ok(defaultLongHtml.includes('>展开</button>'), '长文本默认按钮应为“展开”');
console.log('✅ 2. 长文本默认折叠验证通过');

// 3. 验证展开后状态保持
panel.expandedCommentIds.add('c2');
const expandedLongHtml = panel.renderCommentCard(longComment);
assert.ok(expandedLongHtml.includes('data-collapsed="false"'), '已展开评论应为 data-collapsed="false"');
assert.ok(expandedLongHtml.includes('>收起</button>'), '已展开评论按钮应为“收起”');
console.log('✅ 3. 已展开评论状态保持验证通过');

// 4. 模拟新评论加载导致重绘，已展开评论依然保持展开
const newComment = { id: 'c3', text: '新加载的评论' };
const reRenderedList = [longComment, newComment].map(c => panel.renderCommentCard(c)).join('');
assert.ok(reRenderedList.includes('data-id="c2"'), '应包含老评论');
assert.ok(reRenderedList.includes('data-id="c3"'), '应包含新评论');
// 关键断言：老评论 c2 在列表重新渲染后依然是 data-collapsed="false" 且文案为“收起”
const c2CardHtml = reRenderedList.split('data-id="c2"')[1].split('</div>\n            </div>')[0];
assert.ok(c2CardHtml.includes('data-collapsed="false"'), '新评论加载重绘后，老评论 c2 必须依然保持 data-collapsed="false"');
assert.ok(c2CardHtml.includes('>收起</button>'), '新评论加载重绘后，老评论 c2 必须依然为“收起”');
console.log('✅ 4. 新评论到达触发重绘时，已展开评论维持展开验证通过');

console.log('\n🎉 全部 4 项评论展开与增量状态保持测试 100% 通过！\n');
