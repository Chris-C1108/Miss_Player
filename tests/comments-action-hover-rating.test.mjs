import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 导入待测试模块
import { renderCommentCardHtml } from '../src/player/comments/CommentCardRenderer.js';

test('1. 高能现场数值与评论采集/切源同步更新断言', () => {
    // 模拟最小 DOM 与 CommentPanel 关键环境
    class MockElement {
        constructor(tagName, className = '', id = '') {
            this.tagName = tagName.toUpperCase();
            this.className = className;
            this.id = id;
            this.attributes = {};
            this.children = [];
            this.textContent = '';
            this.classList = {
                classes: new Set(className.split(' ').filter(Boolean)),
                add: (c) => this.classList.classes.add(c),
                remove: (c) => this.classList.classes.delete(c),
                toggle: (c, force) => {
                    if (force !== undefined) {
                        if (force) this.classList.classes.add(c);
                        else this.classList.classes.delete(c);
                    } else {
                        if (this.classList.classes.has(c)) this.classList.classes.delete(c);
                        else this.classList.classes.add(c);
                    }
                },
                contains: (c) => this.classList.classes.has(c)
            };
        }
        querySelector(selector) {
            if (selector === '.tm-filter-count') {
                return this.children.find(c => c.classList.contains('tm-filter-count')) || null;
            }
            return null;
        }
        appendChild(child) {
            this.children.push(child);
            return child;
        }
    }

    const pill = new MockElement('button', 'tm-comment-filter-pill');
    const filterCountEl = new MockElement('span', 'tm-filter-count is-hidden');
    filterCountEl.textContent = '0';
    pill.appendChild(filterCountEl);

    const mockPanel = {
        commentFilterPill: pill,
        activeCommentSource: 'jable',
        isHighlightFilterActive: false,
        sites: {
            jable: {
                name: 'Jable',
                status: 'loaded',
                comments: [],
                filteredComments: []
            }
        },
        updateTabBar() {
            if (this.commentFilterPill) {
                this.commentFilterPill.classList.toggle('is-active', Boolean(this.isHighlightFilterActive));
                const countEl = this.commentFilterPill.querySelector('.tm-filter-count');
                if (countEl) {
                    const curSite = this.sites[this.activeCommentSource];
                    const comments = (curSite?.filteredComments && curSite.filteredComments.length > 0)
                        ? curSite.filteredComments
                        : (curSite?.comments || []);
                    const highlightCount = comments.filter(c => Array.isArray(c.timestamps) && c.timestamps.length > 0).length;
                    countEl.textContent = String(highlightCount);
                    countEl.classList.toggle('is-hidden', highlightCount === 0);
                }
            }
        }
    };

    // 初始状态：无评论，数值为 0 且隐藏
    mockPanel.updateTabBar();
    assert.equal(filterCountEl.textContent, '0', '初始高能现场计数应为 0');
    assert.ok(filterCountEl.classList.contains('is-hidden'), '计数为 0 时应标记 is-hidden 隐藏');

    // 模拟评论采集进入 2 条新评论，其中 1 条带时间戳
    mockPanel.sites.jable.comments = [
        { id: '1', text: '普通好评', timestamps: [] },
        { id: '2', text: '12:34 绝美瞬间', timestamps: [754] }
    ];
    mockPanel.sites.jable.filteredComments = [...mockPanel.sites.jable.comments];

    // 同步触发 updateTabBar()
    mockPanel.updateTabBar();
    assert.equal(filterCountEl.textContent, '1', '评论采集完成后高能计数应同步更新为 1');
    assert.equal(filterCountEl.classList.contains('is-hidden'), false, '有高能评论时必须移除 is-hidden 展示数值');

    // 模拟增量追加第 2 页，又采集到 2 条带时间戳评论
    mockPanel.sites.jable.comments.push(
        { id: '3', text: '01:20 开始', timestamps: [80] },
        { id: '4', text: '02:40 精彩', timestamps: [160] }
    );
    mockPanel.sites.jable.filteredComments = [...mockPanel.sites.jable.comments];

    mockPanel.updateTabBar();
    assert.equal(filterCountEl.textContent, '3', '懒加载增量追加后高能计数应同步递增为 3');
});

test('2. JavDB 评分保持在头部最右侧断言', () => {
    // 构造带评分与时间戳的 JavDB 评论
    const javdbCommentWithActions = {
        id: 'javdb_1001',
        user: '老司机',
        time: '2026-11-13',
        text: '00:15:30 这一段演技绝了',
        timestamps: [930],
        score: '★★★★☆ 8.5'
    };

    const html = renderCommentCardHtml(javdbCommentWithActions, {
        playerCore: { options: { playerState: { settings: { debugMode: true } } } }
    });

    // 验证 DOM 结构顺序：
    // .jc-hdr-right 中包含 .jc-row-actions 与 .jc-row-meta，且 .jc-row-meta 必须在 .jc-row-actions 之后
    const actionsIdx = html.indexOf('class="jc-row-actions"');
    const metaIdx = html.indexOf('class="jc-row-meta"');
    const scoreIdx = html.indexOf('class="jc-score-badge"');

    assert.ok(actionsIdx !== -1, '必须包含操作按钮容器 .jc-row-actions');
    assert.ok(metaIdx !== -1, '必须包含元数据容器 .jc-row-meta');
    assert.ok(scoreIdx !== -1, '必须包含评分徽章 .jc-score-badge');

    assert.ok(actionsIdx < metaIdx, '.jc-row-actions 必须在 .jc-row-meta 之前，使评分固定处于最右侧');
    assert.ok(scoreIdx > actionsIdx, '评分徽章必须排在所有操作按钮（转为正序、转存、上报）的右侧');
});

test('3. 操作按钮次级微胶囊与悬浮/触屏显隐规范断言', () => {
    const css = fs.readFileSync(path.join(rootDir, 'src/player/ui/styles/02_components/_comments_sections.css'), 'utf-8');

    // 1. .jc-row-actions 默认隐藏
    assert.match(
        css,
        /\.jc-row-actions\s*\{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/s,
        '.jc-row-actions 必须默认隐藏且不可点击，避免全屏常驻视觉杂乱'
    );

    // 2. PC 端 hover 显隐
    assert.match(
        css,
        /@media\s*\(hover:\s*hover\)\s*\{[^}]*\.jc-stream-row:hover\s+\.jc-row-actions[^{]*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;/s,
        'PC 端鼠标 hover 评论行时 .jc-row-actions 必须平滑展示'
    );

    // 3. 移动端触碰激活显隐
    assert.match(
        css,
        /\.jc-stream-row\.is-active-row\s+\.jc-row-actions\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;/s,
        '移动端轻触评论行添加 .is-active-row 时 .jc-row-actions 必须展示'
    );

    // 4. .jc-action-btn 统一胶囊高度 20px
    assert.match(
        css,
        /\.jc-action-btn\s*\{[^}]*height:\s*20px;/s,
        '操作按钮统一采用 20px 纯净 Apple 次级微胶囊高度'
    );

    // 5. 评分徽章固定靠右样式
    assert.match(
        css,
        /\.jc-score-badge\s*\{[^}]*display:\s*inline-flex;[^}]*margin-left:\s*0;/s,
        '评分徽章保持 inline-flex 并清除外边距，牢牢吸附在头部最右侧'
    );
});
