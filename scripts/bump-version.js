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

/**
 * SemVer 2.0.0 比对引擎 (防版本倒退卫兵)
 */
function parseSemVer(v) {
    const raw = String(v).replace(/^v/i, '').trim();
    const [core, ...preParts] = raw.split('-');
    const prerelease = preParts.length > 0 ? preParts.join('-') : null;
    const coreNums = core.split('.').map(n => parseInt(n, 10));
    while (coreNums.length < 3) coreNums.push(0);
    return {
        core: coreNums.slice(0, 3),
        prerelease: prerelease ? prerelease.split('.') : []
    };
}

function compareVersions(v1, v2) {
    const r1 = parseSemVer(v1);
    const r2 = parseSemVer(v2);
    for (let i = 0; i < 3; i++) {
        if (r1.core[i] > r2.core[i]) return 1;
        if (r1.core[i] < r2.core[i]) return -1;
    }
    if (r1.prerelease.length === 0 && r2.prerelease.length > 0) return 1;
    if (r1.prerelease.length > 0 && r2.prerelease.length === 0) return -1;
    if (r1.prerelease.length > 0 && r2.prerelease.length > 0) {
        const len = Math.max(r1.prerelease.length, r2.prerelease.length);
        for (let i = 0; i < len; i++) {
            const p1 = r1.prerelease[i];
            const p2 = r2.prerelease[i];
            if (p1 === undefined) return -1;
            if (p2 === undefined) return 1;
            const n1 = /^\d+$/.test(p1) ? parseInt(p1, 10) : null;
            const n2 = /^\d+$/.test(p2) ? parseInt(p2, 10) : null;
            if (n1 !== null && n2 !== null) {
                if (n1 > n2) return 1;
                if (n1 < n2) return -1;
            } else if (n1 !== null && n2 === null) {
                return -1;
            } else if (n1 === null && n2 !== null) {
                return 1;
            } else {
                const cmp = p1.localeCompare(p2);
                if (cmp !== 0) return cmp > 0 ? 1 : -1;
            }
        }
    }
    return 0;
}

function bumpPatch(version, isRelease = false) {
    // 1. 匹配方案 A 标准格式：5.7.116-beta.001 (支持 dev, beta, alpha, rc 等)
    const semverAlphaMatch = version.match(/^(\d+\.\d+\.\d+)-([a-zA-Z]+)\.(\d+)$/);
    if (semverAlphaMatch) {
        const base = semverAlphaMatch[1];
        const tag = semverAlphaMatch[2];
        if (isRelease) {
            // 从测试版转正：直接剥离预发布后缀 (如 5.7.116-beta.001 ➔ 5.7.116)
            return base;
        }
        const num = parseInt(semverAlphaMatch[3], 10) + 1;
        const width = Math.max(semverAlphaMatch[3].length, 3);
        const padded = String(num).padStart(width, '0');
        return `${base}-${tag}.${padded}`;
    }

    // 2. 兼容旧版纯数字预发布格式：5.7.116-001，自动升级为方案 A 标准格式 (5.7.116-beta.001)
    const legacyDashMatch = version.match(/^(\d+\.\d+\.\d+)-(\d+)$/);
    if (legacyDashMatch) {
        const base = legacyDashMatch[1];
        if (isRelease) {
            return base;
        }
        const num = parseInt(legacyDashMatch[2], 10) + 1;
        const width = Math.max(legacyDashMatch[2].length, 3);
        const padded = String(num).padStart(width, '0');
        return `${base}-beta.${padded}`;
    }

    // 3. 从无后缀的正式版 (如 5.7.115) 开启新一轮
    const parts = version.split('.').map(n => parseInt(n, 10));
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`非法版本号格式: ${version}，期望格式如 5.7.116 或 5.7.116-beta.001`);
    }
    parts[2] += 1;
    if (isRelease) {
        return parts.join('.');
    }
    // 开启新一轮日常开发测试：主版本号 Patch + 1 并初始化为 -beta.001
    return `${parts.join('.')}-beta.001`;
}

function run() {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    const oldVersion = pkg.version;
    const arg = process.argv[2] ? process.argv[2].trim() : '';
    const isRelease = arg === '--release' || process.argv.includes('--release');
    let targetVersion = '';

    if (arg && arg !== '--release') {
        targetVersion = arg;
    } else {
        targetVersion = bumpPatch(oldVersion, isRelease);
    }

    // 防版本倒退卫兵校验
    const cmp = compareVersions(targetVersion, oldVersion);
    if (cmp <= 0) {
        console.error(`❌ [SemVer 防倒退阻断] 目标版本 ${targetVersion} 小于或等于当前版本 ${oldVersion}！`);
        console.error(`   依据 SemVer 2.0.0 规范，具有相同主三段号时正式版高于预发布版 (例如 5.7.115 > 5.7.115-001)。`);
        console.error(`   若需发布新测试版，请指定更高的主版本号 (如 5.7.116-001)。`);
        process.exit(1);
    }

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
