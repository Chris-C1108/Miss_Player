import assert from 'assert';
import fs from 'fs';
import {
    checkIsTimestampFavorited,
    highlightCommentText
} from '../src/player/comments/CommentDataPipeline.js';

console.log('🧪 开始执行移动端时间戳收藏免长按与 ±5秒几何判重点亮单元测试...');

// -------------------------------------------------------------
// 1. checkIsTimestampFavorited 全几何判定场景
// -------------------------------------------------------------
const sampleTabs = [
    { id: 'tab1', type: 'highlight', startTime: 100, comment: '单点高光1' },
    { id: 'tab2', type: 'interval', startTime: 200, endTime: 300, comment: '区间高光2' },
    { id: 'tab3', type: 'interval', startTime: 500, endTime: 600, comment: '区间高光3' }
];

// 1.1 单点 vs 单点
// 相差 <= 5s 命中
const r1 = checkIsTimestampFavorited(104, sampleTabs, 5);
assert.strictEqual(r1.isFavorited, true, '相差 4 秒应命中已收藏');
assert.strictEqual(r1.matchedTab.id, 'tab1', '应匹配到 tab1');

// 相差 > 5s 未命中
const r2 = checkIsTimestampFavorited(106, sampleTabs, 5);
assert.strictEqual(r2.isFavorited, false, '相差 6 秒不应命中已收藏');

// 1.2 单点 vs 区间
// 点落在区间内部
const r3 = checkIsTimestampFavorited(250, sampleTabs, 5);
assert.strictEqual(r3.isFavorited, true, '点落在区间内应命中');

// 点落在区间两端边界 ±5s 扩展范围内
const r4 = checkIsTimestampFavorited(196, sampleTabs, 5);
assert.strictEqual(r4.isFavorited, true, '点在区间起点前 4 秒应命中');
const r5 = checkIsTimestampFavorited(304, sampleTabs, 5);
assert.strictEqual(r5.isFavorited, true, '点在区间终点后 4 秒应命中');

// 点超出区间两端 5s
const r6 = checkIsTimestampFavorited(194, sampleTabs, 5);
assert.strictEqual(r6.isFavorited, false, '点在区间起点前 6 秒不应命中');

// 1.3 区间 vs 单点
// 单点落在评论区间扩展范围内
const r7 = checkIsTimestampFavorited([95, 120], sampleTabs, 5);
assert.strictEqual(r7.isFavorited, true, 'tab1 单点 100 落在 [95, 120] 内应命中');
const r8 = checkIsTimestampFavorited([103, 120], sampleTabs, 5);
assert.strictEqual(r8.isFavorited, true, 'tab1 单点 100 在评论区间起点前 3 秒应命中');
const r9 = checkIsTimestampFavorited([106, 120], sampleTabs, 5);
assert.strictEqual(r9.isFavorited, false, 'tab1 单点 100 在评论区间起点前 6 秒不应命中');

// 1.4 区间 vs 区间
// 两区间存在部分或全部交集
const r10 = checkIsTimestampFavorited([250, 350], sampleTabs, 5);
assert.strictEqual(r10.isFavorited, true, '两区间交集应命中');
// 两区间两端边界相距 <= 5s
const r11 = checkIsTimestampFavorited([303, 350], sampleTabs, 5);
assert.strictEqual(r11.isFavorited, true, '两区间端点相距 3 秒应命中');
// 两区间两端边界相距 > 5s
const r12 = checkIsTimestampFavorited([310, 350], sampleTabs, 5);
assert.strictEqual(r12.isFavorited, false, '两区间端点相距 10 秒不应命中');

// 1.5 异常输入安全防御
assert.strictEqual(checkIsTimestampFavorited(null, sampleTabs).isFavorited, false);
assert.strictEqual(checkIsTimestampFavorited(100, []).isFavorited, false);
assert.strictEqual(checkIsTimestampFavorited(100, null).isFavorited, false);
assert.strictEqual(checkIsTimestampFavorited(NaN, sampleTabs).isFavorited, false);

console.log('✅ 1. checkIsTimestampFavorited 全几何判定场景验证通过');

// -------------------------------------------------------------
// 2. highlightCommentText 预判与已收藏点亮渲染
// -------------------------------------------------------------
const rawComment = '进门精彩在 01:40 开始，03:20 也很刺激，08:00 结束';
const timestamps = [
    { raw: '01:40', seconds: 100 }, // 命中 tab1 (100s)
    { raw: '03:20', seconds: 200 }, // 命中 tab2 (200-300s)
    { raw: '08:00', seconds: 480 }  // 未收藏
];

const renderedHtml = highlightCommentText(rawComment, timestamps, [], { tabs: sampleTabs });
// 01:40 与 03:20 应该带有 is-favorited 类
assert.ok(renderedHtml.includes("data-secs='100'") || renderedHtml.includes('data-secs="100"'), '包含 100 秒时间戳');
assert.ok(renderedHtml.includes("data-secs='200'") || renderedHtml.includes('data-secs="200"'), '包含 200 秒时间戳');
assert.ok(renderedHtml.includes("data-secs='480'") || renderedHtml.includes('data-secs="480"'), '包含 480 秒时间戳');

const link100Match = renderedHtml.match(/<span class="jc-time-link([^"]*)" data-secs=['"]100['"]/);
assert.ok(link100Match && link100Match[1].includes('is-favorited'), '100s 必须预渲染 is-favorited 类');

const link200Match = renderedHtml.match(/<span class="jc-time-link([^"]*)" data-secs=['"]200['"]/);
assert.ok(link200Match && link200Match[1].includes('is-favorited'), '200s 必须预渲染 is-favorited 类');

const link480Match = renderedHtml.match(/<span class="jc-time-link([^"]*)" data-secs=['"]480['"]/);
assert.ok(link480Match && !link480Match[1].includes('is-favorited'), '480s 未收藏不应包含 is-favorited 类');

console.log('✅ 2. highlightCommentText 预判与已收藏点亮渲染验证通过');

// -------------------------------------------------------------
// 3. CSS 规范与触屏免长按、PC悬停适配
// -------------------------------------------------------------
const commentsCss = fs.readFileSync('src/player/ui/styles/02_components/_comments.css', 'utf8');

// 3.1 移动端触屏环境：胶囊内嵌五角星免长按展示
assert.ok(commentsCss.includes('@media (hover: none) and (pointer: coarse)'), '必须具备移动端触屏专属媒体查询');
assert.ok(commentsCss.includes('touch-action: manipulation;'), '五角星按钮必须具备 touch-action: manipulation');
assert.ok(!commentsCss.includes('.show-star-btn'), '严禁遗留历史无用的 .show-star-btn 规则');

// 3.2 桌面端 hover 展开
assert.ok(commentsCss.includes('@media (hover: hover) and (pointer: fine)'), '必须具备桌面端指针悬停媒体查询');

// 3.3 已收藏状态常驻琥珀金与实心金星
assert.ok(commentsCss.includes('.jc-time-link.is-favorited'), '必须包含 .jc-time-link.is-favorited 样式');
assert.ok(commentsCss.includes('.jc-time-link.is-favorited .jc-time-star-btn .jc-star-filled'), '已收藏状态必须展示实心金星');

console.log('✅ 3. CSS 规范与触屏免长按、PC悬停适配验证通过');

// -------------------------------------------------------------
// 4. CommentPanel.js 逻辑完整性与落盘闭环
// -------------------------------------------------------------
const commentPanelJs = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');

// 4.1 handleStarClick 优先调用 addTabFromTime 正式入库落盘
assert.ok(commentPanelJs.includes('lm.addTabFromTime(secs, commentExcerpt)'), 'handleStarClick 必须调用 addTabFromTime 正式入库落盘');
assert.ok(commentPanelJs.includes('link.classList.add(\'is-favorited\')'), 'handleStarClick 必须具备乐观点亮 UI');

// 4.2 移除对 jc-time-link 的 350ms 长按定时器
assert.ok(!commentPanelJs.includes('.show-star-btn'), 'CommentPanel 严禁遗留 .show-star-btn 定时器逻辑');

// 4.3 updateFavoriteBadges 接入 checkIsTimestampFavorited 并移除历史 jc-time-add-badge 阻断
assert.ok(commentPanelJs.includes('checkIsTimestampFavorited(secs, tabs, 5)'), 'updateFavoriteBadges 必须接入 checkIsTimestampFavorited');
assert.ok(!commentPanelJs.includes('const badge = link.querySelector(\'.jc-time-add-badge\');'), 'updateFavoriteBadges 严禁使用历史错误 badge 阻断遍历');

console.log('✅ 4. CommentPanel.js 逻辑完整性与落盘闭环验证通过');

console.log('\n🎉 全部 4 大项移动端时间戳收藏免长按与 ±5秒几何判重测试 100% 通过！\n');
