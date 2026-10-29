/**
 * Miss Player 自动化版本号原子递增脚本
 * 
 * 职责：
 * 1. 默认对当前语义化版本进行 patch 递增 (+0.0.1)
 * 2. 也支持手动指定目标版本号 (node scripts/bump-version.js 5.8.0)
 * 3. 强力保证 5 处版本号原子一致性同步写入
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');
const WEBPACK_PATH = path.join(ROOT_DIR, 'webpack.config.js');
const EVENT_COLLECTOR_PATH = path.join(ROOT_DIR, 'src/telemetry/EventCollector.js');
const SYNC_MANAGER_PATH = path.join(ROOT_DIR, 'src/sync/SyncManager.js');
const SLEAZYFORK_SERVICE_PATH = path.join(ROOT_DIR, 'src/services/SleazyForkService.js');

function bumpPatch(version) {
    const parts = version.split('.').map(n => parseInt(n, 10));
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`非法版本号格式: ${version}，期望格式如 5.7.4`);
    }
    parts[2] += 1;
    return parts.join('.');
}

function run() {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    const oldVersion = pkg.version;
    const targetVersion = process.argv[2] ? process.argv[2].trim() : bumpPatch(oldVersion);

    console.log(`🚀 开始执行版本号自增与五处原子同步: ${oldVersion} ➔ ${targetVersion}`);

    // 1. package.json
    pkg.version = targetVersion;
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`  ✅ [1/5] package.json 已同步为 ${targetVersion}`);

    // 2. webpack.config.js
    let wpContent = fs.readFileSync(WEBPACK_PATH, 'utf8');
    wpContent = wpContent.replace(
        new RegExp(`version:\\s*'${oldVersion.replace(/\./g, '\\.')}'`),
        `version: '${targetVersion}'`
    );
    fs.writeFileSync(WEBPACK_PATH, wpContent, 'utf8');
    console.log(`  ✅ [2/5] webpack.config.js 已同步为 ${targetVersion}`);

    // 3. EventCollector.js
    let ecContent = fs.readFileSync(EVENT_COLLECTOR_PATH, 'utf8');
    ecContent = ecContent.replace(
        new RegExp(`return\\s*'${oldVersion.replace(/\./g, '\\.')}';`),
        `return '${targetVersion}';`
    );
    fs.writeFileSync(EVENT_COLLECTOR_PATH, ecContent, 'utf8');
    console.log(`  ✅ [3/5] src/telemetry/EventCollector.js 已同步为 ${targetVersion}`);

    // 4. SyncManager.js
    let smContent = fs.readFileSync(SYNC_MANAGER_PATH, 'utf8');
    smContent = smContent.replace(
        new RegExp(`'${oldVersion.replace(/\./g, '\\.')}';`),
        `'${targetVersion}';`
    );
    fs.writeFileSync(SYNC_MANAGER_PATH, smContent, 'utf8');
    console.log(`  ✅ [4/5] src/sync/SyncManager.js 已同步为 ${targetVersion}`);

    // 5. SleazyForkService.js
    let sfsContent = fs.readFileSync(SLEAZYFORK_SERVICE_PATH, 'utf8');
    sfsContent = sfsContent.replace(
        new RegExp(`return\\s*'${oldVersion.replace(/\./g, '\\.')}';`),
        `return '${targetVersion}';`
    );
    fs.writeFileSync(SLEAZYFORK_SERVICE_PATH, sfsContent, 'utf8');
    console.log(`  ✅ [5/5] src/services/SleazyForkService.js 已同步为 ${targetVersion}`);

    console.log(`\n🎉 版本号 ${targetVersion} 五处强同步完成！`);
}

run();
