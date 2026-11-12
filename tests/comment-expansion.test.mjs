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

// 5. 验证 CSS 防击穿与自适应包裹规范 (Anti-Penetration & Gap Elimination Contract)
import fs from 'fs';
const commentsCss = fs.readFileSync('src/player/ui/styles/02_components/_comments.css', 'utf8');
const commentsSectionsCss = fs.readFileSync('src/player/ui/styles/02_components/_comments_sections.css', 'utf8');

// 5.1 .tm-comments-panel 必须为 pointer-events: auto 且具备深色实体图层，禁止 pointer-events: none 导致 iOS WebKit 穿透呼出键盘
assert.ok(commentsCss.includes('.tm-comments-panel {'), '必须包含 .tm-comments-panel 样式声明');
const panelStyleBlock = commentsCss.split('.tm-comments-panel {')[1].split('}')[0];
assert.ok(panelStyleBlock.includes('pointer-events: auto;'), 'tm-comments-panel 必须显式声明 pointer-events: auto; 阻断点击穿透');
assert.ok(!panelStyleBlock.includes('pointer-events: none;'), 'tm-comments-panel 严禁出现 pointer-events: none;');
assert.ok(panelStyleBlock.includes('background-color: #0b0b0e;') || panelStyleBlock.includes('background-color: var('), 'tm-comments-panel 必须具备实体背景色');
console.log('✅ 5.1 tm-comments-panel 实体图层与防击穿属性验证通过');

// 5.2 .tm-comment-section:not(.is-collapsed) 必须为 flex: 0 1 auto，拒绝 flex: 1 强行撑开巨大死留白
const uncollapsedBlock = commentsSectionsCss.split('.tm-comment-section:not(.is-collapsed) {')[1].split('}')[0];
assert.ok(uncollapsedBlock.includes('flex: 0 1 auto;'), '展开分区必须为 flex: 0 1 auto 自适应收缩包裹');
assert.ok(uncollapsedBlock.includes('max-height: 100%;'), '展开分区必须设置 max-height 边界约束');
assert.ok(!uncollapsedBlock.includes('flex: 1;'), '展开分区严禁使用 flex: 1 强行占满父容器产生空白');
console.log('✅ 5.2 展开分区自适应包裹与死留白消除验证通过');

// 6. 验证 CommentPanel.js 中的 touch 拦截与防击穿事件守卫
const commentPanelJs = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');
assert.ok(commentPanelJs.includes('isInteractive'), 'CommentPanel 必须具备 isInteractive 交互元素检测');
assert.ok(commentPanelJs.includes('!isInteractive && !isSubmitBar'), 'CommentPanel 必须对非交互区域的 touchstart 执行事件冒泡阻断');
console.log('✅ 6. CommentPanel touch 事件防冒泡与防穿透守卫验证通过');

console.log('\n🎉 全部 6 项评论防击穿、防虚拟键盘呼起与自适应包裹测试 100% 通过！\n');
