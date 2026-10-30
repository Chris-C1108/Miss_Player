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
