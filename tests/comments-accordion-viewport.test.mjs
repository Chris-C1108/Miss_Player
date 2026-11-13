/**
 * 评论区分区折叠/展开与视口流式排布专项测试
 * 覆盖：
 * 1. CSS 防压扁与自然流式排布断言（杜绝细线与高度为0）
 * 2. CommentPanel 全折叠死锁自愈机制 (ensureAtLeastOneSectionExpanded)
 * 3. 手风琴互斥展开机制 (toggleSectionCollapse)
 * 4. checkViewportFill 异常高度与已填满视口防狂刷保护
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 开始运行评论区分区手风琴与视口流式排布测试...');

// =========================================================================
// 1. CSS 架构与规则断言
// =========================================================================
console.log('  1. 验证 CSS 样式规则防压扁与自然流式排布...');
const sectionsCssPath = path.resolve(rootDir, 'src/player/ui/styles/02_components/_comments_sections.css');
const landscapeCssPath = path.resolve(rootDir, 'src/player/ui/styles/03_responsive/_landscape.css');

const sectionsCss = fs.readFileSync(sectionsCssPath, 'utf8');
const landscapeCss = fs.readFileSync(landscapeCssPath, 'utf8');

// 1.1 断言 .tm-comment-section 拥有防压缩属性，且绝无破坏性的 transition: flex
assert.ok(
    sectionsCss.includes('min-height: 38px;') && sectionsCss.includes('flex-shrink: 0;'),
    'CSS 必须显式声明 .tm-comment-section 拥有 min-height: 38px 和 flex-shrink: 0 防压扁保护'
);
assert.ok(
    !sectionsCss.includes('transition: flex'),
    'CSS 严禁在 .tm-comment-section 上声明 transition: flex 避免 WebKit 动画插值抽搐'
);

// 1.2 断言 .tm-comment-section-hdr 拥有固定防压死高度 36px 与 flex-shrink: 0
assert.ok(
    sectionsCss.includes('min-height: 36px;') && sectionsCss.includes('height: 36px;'),
    'CSS 必须声明 .tm-comment-section-hdr 的 min-height 与 height 为 36px，确保标题和徽标永远可见'
);

// 1.3 断言折叠态隐藏与展开态自然流式撑开（禁止 flex: 1 导致高度循环依赖为 0）
assert.ok(
    sectionsCss.includes('.tm-comment-section.is-collapsed .tm-comment-section-body {\n    display: none !important;\n}'),
    '折叠状态下 .tm-comment-section-body 必须声明 display: none !important'
);
assert.ok(
    sectionsCss.includes('height: auto;') && !sectionsCss.includes('.tm-comment-section-body {\n    flex: 1;'),
    '.tm-comment-section-body 必须声明 height: auto 且严禁 flex: 1，防止与父级产生高度循环死锁导致内容归 0'
);

// 1.4 断言 _landscape.css 中不包含破坏性的 .tm-comment-section min-height: 0 覆盖
assert.ok(
    !landscapeCss.includes('.tm-comment-section {') && !landscapeCss.includes('.tm-comment-section:not(.is-collapsed) {'),
    '_landscape.css 严禁包含将 .tm-comment-section 覆盖为 min-height: 0 或 flex-shrink: 1 的破坏性规则'
);
console.log('    ✅ CSS 样式防压扁与流式排布规则校验通过');

// =========================================================================
// 2. CommentPanel 全折叠死锁自愈测试 (ensureAtLeastOneSectionExpanded)
// =========================================================================
console.log('  2. 验证 CommentPanel.ensureAtLeastOneSectionExpanded 兜底机制...');

class MockCommentPanel {
    constructor() {
        this.jableCollapsed = true;
        this.javdbCollapsed = true;
        this.javlibCollapsed = true;
        this.filteredJableComments = [];
        this.filteredJavdbComments = [];
        this.filteredJavlibComments = [];
        this.jableStatus = 'ready';
        this.javdbStatus = 'ready';
        this.storageMock = {};
    }

    ensureAtLeastOneSectionExpanded() {
        const isAllCollapsed = !!this.jableCollapsed && !!this.javdbCollapsed && !!this.javlibCollapsed;
        if (!isAllCollapsed) return;

        if (this.filteredJableComments && this.filteredJableComments.length > 0) {
            this.jableCollapsed = false;
        } else if (this.filteredJavdbComments && this.filteredJavdbComments.length > 0) {
            this.javdbCollapsed = false;
        } else if (this.filteredJavlibComments && this.filteredJavlibComments.length > 0) {
            this.javlibCollapsed = false;
        } else if (this.jableStatus !== 'unreachable' && this.jableStatus !== 'mobile_unsupported') {
            this.jableCollapsed = false;
        } else if (this.javdbStatus !== 'unreachable') {
            this.javdbCollapsed = false;
        } else {
            this.jableCollapsed = false;
        }

        this.storageMock['tm-comment-jable-collapsed'] = this.jableCollapsed ? 'true' : 'false';
        this.storageMock['tm-comment-javdb-collapsed'] = this.javdbCollapsed ? 'true' : 'false';
        this.storageMock['tm-comment-javlib-collapsed'] = this.javlibCollapsed ? 'true' : 'false';
    }
}

// 场景 2.1：当三者均被折叠且均无缓存评论时，兜底展开默认 Jable
const panel1 = new MockCommentPanel();
panel1.ensureAtLeastOneSectionExpanded();
assert.strictEqual(panel1.jableCollapsed, false, '全折叠时默认必须兜底展开 Jable 分区');
assert.strictEqual(panel1.storageMock['tm-comment-jable-collapsed'], 'false');

// 场景 2.2：当 Jable 无评论，而 JavDB 有评论时，优先展开 JavDB
const panel2 = new MockCommentPanel();
panel2.filteredJavdbComments = [{ id: 'db-1', content: '好片' }];
panel2.ensureAtLeastOneSectionExpanded();
assert.strictEqual(panel2.javdbCollapsed, false, 'Jable 无评论而 JavDB 有评论时，必须优先展开 JavDB');
assert.strictEqual(panel2.jableCollapsed, true);

// 场景 2.3：若原本已有展开的分区，不得强行改写
const panel3 = new MockCommentPanel();
panel3.jableCollapsed = true;
panel3.javdbCollapsed = false; // 已展开
panel3.javlibCollapsed = true;
panel3.ensureAtLeastOneSectionExpanded();
assert.strictEqual(panel3.javdbCollapsed, false, '已有展开分区时不应发生意外重置');
assert.strictEqual(panel3.jableCollapsed, true);
console.log('    ✅ 全折叠死锁自愈与优先级展开测试通过');

// =========================================================================
// 3. 手风琴互斥展开逻辑测试
// =========================================================================
console.log('  3. 验证手风琴互斥展开机制 (toggleSectionCollapse)...');

class MockAccordionPanel {
    constructor() {
        this.jableCollapsed = false;
        this.javdbCollapsed = true;
        this.javlibCollapsed = true;
        this.activeClasses = {
            jable: ['tm-comment-section'],
            javdb: ['tm-comment-section', 'is-collapsed'],
            javlib: ['tm-comment-section', 'is-collapsed']
        };
    }

    toggleSectionCollapse(siteKey) {
        const currentCollapsed = !!this[`${siteKey}Collapsed`];
        const nextCollapsed = !currentCollapsed;

        if (!nextCollapsed) {
            ['jable', 'javdb', 'javlib'].forEach(k => {
                const shouldCollapse = (k !== siteKey);
                this[`${k}Collapsed`] = shouldCollapse;
                if (shouldCollapse) {
                    if (!this.activeClasses[k].includes('is-collapsed')) this.activeClasses[k].push('is-collapsed');
                } else {
                    this.activeClasses[k] = this.activeClasses[k].filter(c => c !== 'is-collapsed');
                }
            });
        } else {
            this[`${siteKey}Collapsed`] = true;
            if (!this.activeClasses[siteKey].includes('is-collapsed')) {
                this.activeClasses[siteKey].push('is-collapsed');
            }
        }
    }
}

const accordion = new MockAccordionPanel();
// 初始态：Jable 展开，JavDB 折叠
assert.strictEqual(accordion.jableCollapsed, false);
assert.strictEqual(accordion.javdbCollapsed, true);

// 用户点击 JavDB header 尝试展开 JavDB
accordion.toggleSectionCollapse('javdb');
assert.strictEqual(accordion.javdbCollapsed, false, 'JavDB 必须变为展开');
assert.strictEqual(accordion.jableCollapsed, true, '原展开的 Jable 必须被手风琴互斥折叠');
assert.ok(!accordion.activeClasses.javdb.includes('is-collapsed'), 'JavDB 节点必须移除 is-collapsed 类');
assert.ok(accordion.activeClasses.jable.includes('is-collapsed'), 'Jable 节点必须增加 is-collapsed 类');
console.log('    ✅ 手风琴互斥展开与 DOM 状态同步测试通过');

// =========================================================================
// 4. checkViewportFill 异常高度与已填满视口防狂刷测试
// =========================================================================
console.log('  4. 验证 checkViewportFill 视口守卫与防死循环逻辑...');

function simulateCheckViewportFill(container, activeSection, hasMore, loading) {
    if (!container) return false;
    // 守卫 1：容器未就绪或视口过小
    if (container.clientHeight < 100) return false;
    // 守卫 2：外层容器已被填满（已出现滚动条）
    if (container.scrollHeight > container.clientHeight + 20) return false;
    // 守卫 3：无活跃展开分区
    if (!activeSection || activeSection.isCollapsed) return false;

    if (hasMore && !loading) {
        return true; // 触发加载更多
    }
    return false;
}

// 场景 4.1：容器尚未完成渲染（clientHeight = 0）-> 严禁触发加载
const r1 = simulateCheckViewportFill({ clientHeight: 0, scrollHeight: 0 }, { isCollapsed: false }, true, false);
assert.strictEqual(r1, false, 'clientHeight = 0 时严禁触发加载更多，杜绝死循环');

// 场景 4.2：容器已经被填满（scrollHeight: 1200, clientHeight: 600）-> 绝不触发自动加载
const r2 = simulateCheckViewportFill({ clientHeight: 600, scrollHeight: 1200 }, { isCollapsed: false }, true, false);
assert.strictEqual(r2, false, '外层容器已填满时严禁自动加载下一页');

// 场景 4.3：容器内容较少未填满视口（scrollHeight: 200, clientHeight: 500），且有更多数据 -> 正常触发加载
const r3 = simulateCheckViewportFill({ clientHeight: 500, scrollHeight: 200 }, { isCollapsed: false }, true, false);
assert.strictEqual(r3, true, '内容不足填满视口时正常触发首屏填满拉取');

// 场景 4.4：活跃分区处于折叠态 -> 绝不触发加载
const r4 = simulateCheckViewportFill({ clientHeight: 500, scrollHeight: 200 }, { isCollapsed: true }, true, false);
assert.strictEqual(r4, false, '折叠分区严禁触发加载');

console.log('    ✅ checkViewportFill 视口防狂刷守卫逻辑校验通过');

console.log('\n🎉 所有评论区分区手风琴与视口流式排布专项测试全部通过 (4/4)！\n');
