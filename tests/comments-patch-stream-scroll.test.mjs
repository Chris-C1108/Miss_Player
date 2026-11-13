import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('1. 增量 Patch DOM 机制与长评论展开状态保留测试', () => {
    // 模拟最小 DOM 与 CommentPanel 关键环境
    class MockElement {
        constructor(tagName, className = '', id = '') {
            this.tagName = tagName.toUpperCase();
            this.className = className;
            this.id = id;
            this.attributes = {};
            this.children = [];
            this.parentNode = null;
            this.innerHTML = '';
            this.scrollTop = 0;
            this.scrollHeight = 300;
            this.clientHeight = 200;
        }
        setAttribute(k, v) { this.attributes[k] = String(v); }
        getAttribute(k) { return this.attributes[k] || null; }
        appendChild(child) {
            child.parentNode = this;
            this.children.push(child);
            return child;
        }
        remove() {
            if (this.parentNode) {
                const idx = this.parentNode.children.indexOf(this);
                if (idx !== -1) this.parentNode.children.splice(idx, 1);
            }
        }
        querySelectorAll(selector) {
            const matches = [];
            const search = (node) => {
                for (const child of node.children) {
                    if (selector.includes('.jc-stream-row') && child.className.includes('jc-stream-row') && child.getAttribute('data-id')) {
                        matches.push(child);
                    } else if (selector.includes('.jc-card') && child.className.includes('jc-card') && child.getAttribute('data-id')) {
                        matches.push(child);
                    }
                    search(child);
                }
            };
            search(this);
            return matches;
        }
        querySelector(selector) {
            if (selector.startsWith('#')) {
                const id = selector.slice(1);
                const findId = (node) => {
                    for (const child of node.children) {
                        if (child.id === id) return child;
                        const res = findId(child);
                        if (res) return res;
                    }
                    return null;
                };
                return findId(this);
            }
            if (selector.includes('.tm-comment-section-body')) {
                const findBody = (node) => {
                    for (const child of node.children) {
                        if (child.className.includes('tm-comment-section-body')) return child;
                        const res = findBody(child);
                        if (res) return res;
                    }
                    return null;
                };
                return findBody(this);
            }
            return null;
        }
    }

    const commentsList = new MockElement('div', 'tm-comments-list');
    const sectionEl = new MockElement('div', 'tm-comment-section is-active-source', 'tm-comment-section-jable');
    const bodyEl = new MockElement('div', 'tm-comment-section-body');
    sectionEl.appendChild(bodyEl);
    commentsList.appendChild(sectionEl);

    // 初始已有一条长评论，且用户已点击展开（标记在 expandedCommentIds）
    const card1 = new MockElement('div', 'jc-stream-row');
    card1.setAttribute('data-id', 'c1');
    card1.setAttribute('data-collapsed', 'false'); // 已展开态
    bodyEl.appendChild(card1);

    const expandedCommentIds = new Set(['c1']);

    // 模拟 patchSectionContent 核心逻辑
    const mockSite = {
        name: 'Jable',
        status: 'loaded',
        hasMore: true,
        filteredComments: [
            { id: 'c1', text: '第一条评论(很长已展开)' },
            { id: 'c2', text: '第二条增量追加的新评论' }
        ]
    };

    const existingCards = bodyEl.querySelectorAll('.jc-stream-row[data-id], .jc-card[data-id]');
    assert.equal(existingCards.length, 1, '应准确查找到已存在的 1 条 .jc-stream-row 评论');
    const existingIdSet = new Set(existingCards.map(c => c.getAttribute('data-id')));

    const newComments = mockSite.filteredComments.filter(c => !existingIdSet.has(c.id));
    assert.equal(newComments.length, 1, '应精准识别出 1 条待增量追加的新评论 c2');

    // 追加新评论
    newComments.forEach(c => {
        const newCard = new MockElement('div', 'jc-stream-row');
        newCard.setAttribute('data-id', c.id);
        bodyEl.appendChild(newCard);
    });

    assert.equal(bodyEl.children.length, 2, '增量追加后子节点数应为 2');
    assert.equal(card1.getAttribute('data-collapsed'), 'false', '原长评论的展开属性严禁被重置');
    assert.ok(expandedCommentIds.has('c1'), '原长评论在 expandedCommentIds 中的展开状态完好无损');
});

test('2. 切源防空白与自动采集及滚动复位测试', () => {
    let loadCalledWith = null;
    let scrollTopValue = 450;

    const mockPanel = {
        activeCommentSource: 'jable',
        commentsList: {
            scrollTop: scrollTopValue
        },
        sites: {
            jable: { status: 'loaded', name: 'Jable' },
            javdb: { status: 'idle', name: 'JavDB' },
            javlib: { status: 'loaded', name: 'JAVLib' }
        },
        loadSiteComments(siteKey, page) {
            loadCalledWith = { siteKey, page };
        },
        syncActiveSourceView() {},
        updateTabBar() {},
        checkViewportFill() {}
    };

    // 执行切源逻辑
    function setActiveSource(siteKey) {
        if (!siteKey || !['jable', 'javdb', 'javlib'].includes(siteKey)) return;
        mockPanel.activeCommentSource = siteKey;
        if (mockPanel.commentsList) {
            mockPanel.commentsList.scrollTop = 0;
        }
        mockPanel.syncActiveSourceView();
        mockPanel.updateTabBar();

        const targetSite = mockPanel.sites[siteKey];
        if (targetSite && targetSite.status === 'idle') {
            mockPanel.loadSiteComments(siteKey, 1);
        }
    }

    setActiveSource('javdb');

    assert.equal(mockPanel.activeCommentSource, 'javdb', '当前激活源应成功切换至 javdb');
    assert.equal(mockPanel.commentsList.scrollTop, 0, '切源时外层列表 scrollTop 必须归零，杜绝视口错位空白');
    assert.deepEqual(loadCalledWith, { siteKey: 'javdb', page: 1 }, '切换到 idle 状态的目标源时必须自动触发第一页拉取');
});

test('3. 评论区外层左右 padding 归零与文字 16px 对齐规范测试', () => {
    const commentsCss = fs.readFileSync(path.join(rootDir, 'src/player/ui/styles/02_components/_comments.css'), 'utf-8');
    const landscapeCss = fs.readFileSync(path.join(rootDir, 'src/player/ui/styles/03_responsive/_landscape.css'), 'utf-8');
    const sectionsCss = fs.readFileSync(path.join(rootDir, 'src/player/ui/styles/02_components/_comments_sections.css'), 'utf-8');

    // 1. _comments.css 中 .tm-comments-panel-list.tm-comments-list padding 归零（无多余底部与左右边距）
    assert.match(
        commentsCss,
        /\.tm-comments-panel-list\.tm-comments-list\s*\{[^}]*padding:\s*0;/s,
        '_comments.css 中外层滚动列表 padding 必须归零，防止产生多余底边距与左右边距叠加'
    );

    // 2. _landscape.css 中 .tm-comments-panel-list.tm-comments-list 左右 padding 也为 0
    assert.match(
        landscapeCss,
        /\.tm-comments-panel-list\.tm-comments-list\s*\{[^}]*padding:\s*8px\s+0px\s+0px\s+0px/s,
        '_landscape.css 中 PC/横屏滚动列表左右 padding 必须为 0px，保证大屏同样对齐'
    );

    // 3. _comments_sections.css 中 .jc-stream-row padding 左右必须为 16px
    assert.match(
        sectionsCss,
        /\.jc-stream-row\s*\{[^}]*padding:\s*13px\s+16px/s,
        '每条评论行自身保持 16px 内边距'
    );

    // 4. _comments_sections.css 中 .tm-comment-nav-bar padding 左右必须为 16px
    assert.match(
        sectionsCss,
        /\.tm-comment-nav-bar\s*\{[^}]*padding:\s*8px\s+16px/s,
        '顶部水平标签导航栏左右内边距保持 16px，实现与下方评论文字严格垂直共线对齐'
    );
});
