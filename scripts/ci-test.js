/**
 * Miss Player CI 自动化构建与质量核验套件
 * 
 * 职责：
 * 1. 自动执行生产打包 (Vite build)
 * 2. 自动化合规门禁扫描 (compliance-lint)
 * 3. 校验多文件版本号强一致性
 * 4. 模拟沙箱环境运行产物，确保零启动语法/运行时错误
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runStep(name, fn) {
    process.stdout.write(`▶ 正在执行: ${name}... `);
    try {
        fn();
        console.log('✅ 通过');
    } catch (err) {
        console.log('❌ 失败');
        console.error('\n' + err.message);
        process.exit(1);
    }
}

console.log('====================================================');
console.log('🚀 Miss Player 自动化 CI 构建与质量检验流程');
console.log('====================================================\n');

// 1. 版本一致性检查
runStep('版本号五处强同步校验', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = pkg.version;

    const wp = fs.readFileSync('webpack.config.js', 'utf8');
    if (!wp.includes(`version: '${version}'`)) {
        throw new Error(`webpack.config.js 未同步版本 ${version}`);
    }

    const ec = fs.readFileSync('src/telemetry/EventCollector.js', 'utf8');
    if (!ec.includes(`'${version}'`)) {
        throw new Error(`src/telemetry/EventCollector.js fallback 未同步版本 ${version}`);
    }

    const sm = fs.readFileSync('src/sync/SyncManager.js', 'utf8');
    if (!sm.includes(`'${version}'`)) {
        throw new Error(`src/sync/SyncManager.js 未同步版本 ${version}`);
    }

    const sfs = fs.readFileSync('src/services/SleazyForkService.js', 'utf8');
    if (!sfs.includes(`'${version}'`)) {
        throw new Error(`src/services/SleazyForkService.js fallback 未同步版本 ${version}`);
    }
});

// 2. 打包构建
runStep('执行 Vite 生产打包 (npm run build)', () => {
    execSync('npm run build', { stdio: 'pipe' });
    if (!fs.existsSync('dist/miss_player.user.js')) {
        throw new Error('未生成 dist/miss_player.user.js 产物！');
    }
});

// 3. 合规审查门禁
runStep('执行 GreasyFork & SleazyFork 合规门禁 (compliance-lint)', () => {
    execSync('node scripts/compliance-lint.js', { stdio: 'inherit' });
});

// 4. SleazyFork API 与版本比较单元测试
runStep('执行 SleazyFork JSON API 与版本比对单元测试', () => {
    execSync('node tests/sleazyfork.test.mjs', { stdio: 'inherit' });
});

// 4.1 VolumeController 单元测试
runStep('执行 VolumeController 与静音重置策略单元测试', () => {
    execSync('node tests/volume.test.mjs', { stdio: 'inherit' });
});

// 4.2 评论展开与增量更新状态单元测试
runStep('执行评论展开状态与增量更新单元测试', () => {
    execSync('node tests/comment-expansion.test.mjs', { stdio: 'inherit' });
});

// 4.3 胶囊编辑状态时间跳转免疫单元测试
runStep('执行胶囊编辑状态时间跳转免疫与点击守卫单元测试', () => {
    execSync('node tests/loop-edit-state.test.mjs', { stdio: 'inherit' });
});

// 4.4 控制面板显隐纯垂直动效单元测试
runStep('执行控制面板显隐纯垂直动效与防斜飞单元测试', () => {
    execSync('node tests/controls-motion.test.mjs', { stdio: 'inherit' });
});

// 4.5 胶囊区域左右滑动手势守卫单元测试
runStep('执行胶囊区域左右滑动手势守卫单元测试', () => {
    execSync('node tests/capsule-scroll.test.mjs', { stdio: 'inherit' });
});

// 4.6 设置菜单防丢失与固定插槽顺序单元测试
runStep('执行设置菜单防丢失与固定插槽顺序单元测试', () => {
    execSync('node tests/settings-order-and-sync.test.mjs', { stdio: 'inherit' });
});

// 4.7 单手手势随时触发与设置项清理单元测试
runStep('执行单手手势随时触发与设置项清理单元测试', () => {
    execSync('node tests/single-hand-gesture.test.mjs', { stdio: 'inherit' });
});

// 4.8 单手模式立柱加宽与排版防挤压单元测试
runStep('执行单手模式立柱加宽与排版防挤压单元测试', () => {
    execSync('node tests/single-hand-gutter.test.mjs', { stdio: 'inherit' });
});

// 4.9 空标签时展示空草稿胶囊单元测试
runStep('执行空标签时展示空草稿胶囊单元测试', () => {
    execSync('node tests/empty-tabs-draft.test.mjs', { stdio: 'inherit' });
});

// 4.10 控制面板各行左右垂直基准对齐单元测试
runStep('执行控制面板各行左右垂直基准对齐单元测试', () => {
    execSync('node tests/controls-alignment.test.mjs', { stdio: 'inherit' });
});

// 4.11 实验功能与自建端点防抹杀单元测试
runStep('执行实验功能与自建端点防抹杀单元测试', () => {
    execSync('node tests/beta-settings-preservation.test.mjs', { stdio: 'inherit' });
});

// 4.12 视频播放热度与探索足迹单元测试
runStep('执行视频播放热度与探索足迹单元测试', () => {
    execSync('node tests/heatmap.test.mjs', { stdio: 'inherit' });
    execSync('node tests/heatmap-codec.test.mjs', { stdio: 'inherit' });
    execSync('node tests/cf-heatmap-cache.test.mjs', { stdio: 'inherit' });
});

// 4.13 控制栏手势防冲突、胶囊无限循环、倍速持久化与手柄基准保持单元测试
runStep('执行控制栏手势防冲突、胶囊循环与视口基准单元测试', () => {
    execSync('node tests/player-fixes-verification.test.mjs', { stdio: 'inherit' });
});

// 4.14 流网关播放地址构建与 WebDAV 三种模式入库单元测试
runStep('执行流网关播放地址构建与 WebDAV 三种模式入库单元测试', () => {
    execSync('node tests/peach-gateway-ingest.test.mjs', { stdio: 'inherit' });
});

// 4.15 Peach 专用令牌自动签发与同源会话 API 单元测试
runStep('执行 Peach 专用令牌自动签发与同源会话 API 单元测试', () => {
    execSync('node tests/peach-dedicated-token.test.mjs', { stdio: 'inherit' });
});

// 4.16 UI/UX 体验与交互手势专项修复单元测试
runStep('执行 UI/UX 体验与交互手势专项修复单元测试', () => {
    execSync('node tests/ui-ux-enhancements-v19.test.mjs', { stdio: 'inherit' });
});

// 4.17 WebDAV 双地址自适应 (LAN/WAN Failover) 单元测试
runStep('执行 WebDAV 双地址自适应与自动故障转移单元测试', () => {
    execSync('node tests/webdav-failover.test.mjs', { stdio: 'inherit' });
});

// 4.18 XSS 净化与 Safari IME 输入守卫单元测试
runStep('执行 XSS 净化与 Safari IME 输入守卫单元测试', () => {
    execSync('node tests/xss-sanitization.test.mjs', { stdio: 'inherit' });
});

// 4.19 移动端时间戳收藏免长按与 ±5秒几何判重点亮单元测试
runStep('执行移动端时间戳收藏免长按与 ±5秒几何判重点亮单元测试', () => {
    execSync('node tests/mobile-timestamp-favorite.test.mjs', { stdio: 'inherit' });
});

// 4.20 评论区分区手风琴折叠展开与视口流式排布单元测试
runStep('执行评论区分区手风琴折叠展开与视口流式排布单元测试', () => {
    execSync('node tests/comments-accordion-viewport.test.mjs', { stdio: 'inherit' });
});

// 4.21 Direction B: Linear Minimalist Thread (现代流体微线条与水平标签栏) 单元测试
runStep('执行 Linear Minimalist 无框流式评论与水平多源分段栏单元测试', () => {
    execSync('node tests/comments-linear-minimalist.test.mjs', { stdio: 'inherit' });
});

// 4.22 增量 Patch DOM、切源防空白与边距对齐单元测试
runStep('执行增量 Patch DOM、切源防空白与边距对齐单元测试', () => {
    execSync('node tests/comments-patch-stream-scroll.test.mjs', { stdio: 'inherit' });
});

// 4.23 高能现场计数同步更新、JavDB 评分居右与操作按钮悬浮/触屏显隐单元测试
runStep('执行高能现场计数同步、JavDB 评分居右与操作胶囊悬浮显隐单元测试', () => {
    execSync('node tests/comments-action-hover-rating.test.mjs', { stdio: 'inherit' });
});

// 4.24 评论识别引擎优化、同系列番号补全与上报机制单元测试
runStep('执行评论识别引擎优化、同系列番号补全与上报机制单元测试', () => {
    execSync('node tests/comment-pipeline-reports.test.mjs', { stdio: 'inherit' });
    execSync('node scripts/eval-comment-pipeline.mjs --strict', { stdio: 'inherit' });
});

// 4.25 收藏片段胶囊完整状态机与邻近高亮引擎单元测试
runStep('执行收藏片段胶囊完整状态机与邻近高亮单元测试', () => {
    execSync('node tests/capsule-proximity-fsm.test.mjs', { stdio: 'inherit' });
});

// 4.26 评论多站点分桶隔离与跨站点串源自愈单元测试
runStep('执行评论多站点分桶隔离与串源自愈单元测试', () => {
    execSync('node tests/comment-site-isolation.test.mjs', { stdio: 'inherit' });
});

// 4.27 字幕采集、编码嗅探与解析管道单元测试
runStep('执行字幕采集、编码嗅探与解析管道单元测试', () => {
    execSync('node tests/subtitle-pipeline.test.mjs', { stdio: 'inherit' });
});

// 4.28 字幕层挂载层级与时间轴渲染集成测试
runStep('执行字幕层挂载层级与时间轴渲染集成测试', () => {
    execSync('node tests/subtitle-render.test.mjs', { stdio: 'inherit' });
});

// 4.29 跳转反馈统一出口测试
runStep('执行跳转反馈统一出口测试', () => {
    execSync('node tests/seek-feedback.test.mjs', { stdio: 'inherit' });
});

// 4.30 ltxlib 跨站播放双轨路由与卡片适配器测试
runStep('执行 ltxlib 跨站播放双轨路由与卡片适配器测试', () => {
    execSync('node tests/ltxlib-cross-site.test.mjs', { stdio: 'inherit' });
});

// 4.30b Stay / Safari CSP 兼容伴侣脚本静态合规与沙箱校验
runStep('执行 iOS Stay / CSP 伴侣脚本 (miss_player.ltxlib.user.js) 合规校验', () => {
    const compPath = 'dist/miss_player.ltxlib.user.js';
    const compMetaPath = 'dist/miss_player.ltxlib.meta.js';
    if (!fs.existsSync(compPath) || !fs.existsSync(compMetaPath)) {
        throw new Error('缺失 dist/miss_player.ltxlib.user.js 或 meta.js 产物！');
    }
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const compCode = fs.readFileSync(compPath, 'utf8');
    const compMeta = fs.readFileSync(compMetaPath, 'utf8');
    if (!compMeta.includes(`@version            ${pkg.version}`) && !compMeta.includes(`@version`) || !compMeta.includes(pkg.version)) {
        throw new Error(`miss_player.ltxlib.meta.js 版本未同步为 ${pkg.version}`);
    }
    if (!compMeta.includes('@inject-into        content')) {
        throw new Error('miss_player.ltxlib.user.js 必须声明 @inject-into content');
    }
    if (compMeta.includes('unsafeWindow')) {
        throw new Error('miss_player.ltxlib.user.js 严禁声明 unsafeWindow！');
    }
    const headerEnd = compCode.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length;
    const body = compCode.slice(headerEnd);
    if (body.includes('unsafeWindow')) {
        throw new Error('miss_player.ltxlib.user.js 产物体内严禁包含 unsafeWindow！');
    }
    const winRefs = body.match(/window\.[a-zA-Z()]+/g) || [];
    const stayWhitelist = new Set(['window.location', 'window.innerWidth', 'window.innerHeight', 'window.localStorage', 'window.sessionStorage', 'window.history', 'window.open()', 'window.matchMedia()', 'window.getComputedStyle()', 'window.requestAnimationFrame()']);
    const illegalWinRefs = [...new Set(winRefs)].filter((w) => !stayWhitelist.has(w));
    if (illegalWinRefs.length > 0) {
        throw new Error(`miss_player.ltxlib.user.js 包含触发 Stay page 模式注入的非白名单属性: ${illegalWinRefs.join(', ')}`);
    }

    // 模拟 Stay content 隔离环境运行伴侣脚本，校验卡片按钮挂载零报错
    const appended = [];
    const mockCover = {
        querySelector: () => null,
        appendChild: (el) => { appended.push(el); return el; }
    };
    const mockCard = {
        getAttribute: (n) => (n === 'data-code' ? 'IPX-811' : ''),
        dataset: { code: 'IPX-811' },
        querySelector: (s) => (s === '.cover' ? mockCover : null)
    };
    const makeNode = (tag = 'div') => ({
        tagName: tag.toUpperCase(),
        style: {},
        dataset: {},
        classList: { add() {}, remove() {}, contains() { return false; } },
        setAttribute() {},
        appendChild(el) { return el; },
        append() {},
        addEventListener() {},
        removeEventListener() {},
        querySelector: () => null
    });
    const docEl = makeNode('html');
    const headEl = makeNode('head');
    const bodyEl = makeNode('body');
    const compSandbox = {
        location: { hostname: 'ltxlib.dpdns.org', href: 'https://ltxlib.dpdns.org/', hash: '' },
        innerWidth: 390,
        innerHeight: 844,
        navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile Safari' },
        document: {
            readyState: 'complete',
            documentElement: docEl,
            head: headEl,
            body: bodyEl,
            createElement: (t) => makeNode(t),
            getElementById: () => null,
            querySelector: (s) => (s.includes('ltx-app') ? {} : null),
            querySelectorAll: (s) => (s === 'article.card[data-code]' ? [mockCard] : []),
            addEventListener() {},
            removeEventListener() {}
        },
        GM_addStyle() {},
        GM_getValue: (_k, d) => d,
        GM_setValue() {},
        GM_openInTab() {},
        GM_xmlhttpRequest() {},
        addEventListener() {},
        removeEventListener() {},
        setTimeout, clearTimeout, setInterval: () => 1, clearInterval: () => {},
        console: { log() {}, info() {}, warn() {}, error() {} }
    };
    compSandbox.globalThis = compSandbox;
    vm.createContext(compSandbox);
    vm.runInContext(compCode, compSandbox);
    if (appended.length !== 1 || appended[0].className !== 'mp-ltx-play-btn') {
        throw new Error('miss_player.ltxlib.user.js 未能在模拟 Stay content 沙箱中成功注入卡片按钮！');
    }
});

// 4.31 番号统一入口与历史错位数据全链路迁移测试
runStep('执行番号统一入口与历史错位数据全链路迁移测试', () => {
    execSync('node tests/avcode-unification-migration.test.mjs', { stdio: 'inherit' });
});

// 5. 沙箱无报错启动验证
runStep('无头浏览器沙箱安全启动测试', () => {
    const code = fs.readFileSync('dist/miss_player.user.js', 'utf8');

    function createMockElement(tag = 'div') {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            classList: { add() {}, remove() {}, contains() { return false; } },
            appendChild(el) { return el; },
            append() {},
            removeChild() {},
            setAttribute() {},
            addEventListener() {},
            removeEventListener() {},
            attachShadow() { return { appendChild() {}, adoptedStyleSheets: [] }; }
        };
    }

    const headEl = createMockElement('head');
    const bodyEl = createMockElement('body');
    const docEl = createMockElement('html');

    const sandbox = {
        window: {
            location: { href: 'https://missav.ai/test', hostname: 'missav.ai' },
            addEventListener() {},
            removeEventListener() {},
            fetch() {},
            document: null
        },
        document: {
            readyState: 'complete',
            head: headEl,
            body: bodyEl,
            documentElement: docEl,
            createElement(tag) { return createMockElement(tag); },
            getElementById(id) { return null; },
            querySelector() { return null; },
            querySelectorAll() { return []; },
            addEventListener() {},
            removeEventListener() {}
        },
        navigator: { userAgent: 'Mozilla/5.0 CI-Runner' },
        console: {
            log() {},
            info() {},
            debug() {},
            warn() {},
            error() {},
            trace() {}
        },
        setTimeout, clearTimeout, setInterval: () => 1, clearInterval: () => {}
    };
    sandbox.performance = {
        mark() {},
        measure() {},
        getEntriesByType() { return []; },
        getEntriesByName() { return []; },
        now() { return Date.now(); }
    };

    sandbox.window.self = sandbox.window;
    sandbox.window.top = sandbox.window;
    sandbox.window.document = sandbox.document;
    sandbox.unsafeWindow = sandbox.window;
    sandbox.XMLHttpRequest = class MockXHR {
        open() {}
        send() {}
        setRequestHeader() {}
    };
    sandbox.MutationObserver = class MockMutationObserver {
        observe() {}
        disconnect() {}
        takeRecords() { return []; }
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
});

console.log('\n====================================================');
console.log('🎉 所有 CI 检查项 100% 通过，产物已具备工业级发布品质！');
console.log('====================================================');

process.exit(0);
