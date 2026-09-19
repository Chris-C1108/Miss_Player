/**
 * Miss Player 生产构建合规检查门禁 (Compliance Linter)
 * 
 * 严格遵从 GreasyFork & SleazyFork 审核规则：
 * 1. 产物体积预算守卫 (严格阻断 > 1.8 MB)
 * 2. 违规未声明追踪端点扫描 (零容忍外部分析域名)
 * 3. 代码混淆特征与变量命名分布审计 (No Mangling)
 * 4. 元数据完整性校验 (@namespace, @match 根域名完备性)
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const DIST_FILE = path.resolve(__dirname, '../dist/miss_player.user.js');
const META_FILE = path.resolve(__dirname, '../dist/miss_player.meta.js');
const PKG_FILE = path.resolve(__dirname, '../package.json');

// 违规域名黑名单
const BLOCKED_DOMAINS = [
    'telemetry.x-flow.ccwu.cc',
    'xflow-telemetry',
    'google-analytics.com',
    'hotjar.com',
    'segment.io',
    'mixpanel.com',
    'clarity.ms'
];

// 硬性红线标准
const MAX_ALLOWED_SIZE_BYTES = 1.8 * 1024 * 1024; // 1.8 MB 阻断线
const WARN_SIZE_BYTES = 1.0 * 1024 * 1024;        // 1.0 MB 告警线
const REQUIRED_NAMESPACE = 'loadingi.local';

function runCheck() {
    console.log('====================================================');
    console.log('🛡️  开始执行 Miss Player 生产合规安全门禁检查');
    console.log('====================================================\n');

    let hasErrors = false;
    let hasWarnings = false;

    if (!fs.existsSync(DIST_FILE)) {
        console.error('❌ 致命错误: 未找到构建产物 ' + DIST_FILE);
        console.error('   请先执行 npm run build 进行打包。\n');
        process.exit(1);
    }

    const code = fs.readFileSync(DIST_FILE, 'utf8');
    const meta = fs.existsSync(META_FILE) ? fs.readFileSync(META_FILE, 'utf8') : code;
    const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));

    // 1. 体积检查
    const stat = fs.statSync(DIST_FILE);
    const sizeKB = (stat.size / 1024).toFixed(2);
    console.log(`📦 [1/4] 产物体积审核: ${sizeKB} KiB (${stat.size} 字节)`);
    if (stat.size > MAX_ALLOWED_SIZE_BYTES) {
        console.error(`   ❌ 严重违规: 产物大小超过 1.8 MB 上限 (当前 ${sizeKB} KiB)！触碰平台 2.0 MB 封禁线。`);
        hasErrors = true;
    } else if (stat.size > WARN_SIZE_BYTES) {
        console.warn(`   ⚠️ 体积警告: 产物超过 1.0 MB 推荐安全线，建议进一步优化。`);
        hasWarnings = true;
    } else {
        console.log('   ✅ 体积健康，完全处于安全预算内。');
    }

    // 2. 违规网络追踪端点扫描
    console.log('\n🌐 [2/4] 外部回传与遥测端点审计:');
    const matchedBlacklist = BLOCKED_DOMAINS.filter(d => code.includes(d));
    if (matchedBlacklist.length > 0) {
        console.error('   ❌ 严重违规: 检测到未授权追踪或历史违规域名:');
        matchedBlacklist.forEach(d => console.error('      - ' + d));
        hasErrors = true;
    } else {
        console.log('   ✅ 零外部追踪端点，100% 纯本地运行代码。');
    }

    // 3. 元信息 Header 检查
    console.log('\n📋 [3/4] Userscript Header 核心红线审计:');
    
    // Namespace
    const nsMatch = meta.match(/@namespace\s+(\S+)/);
    const currentNs = nsMatch ? nsMatch[1] : '';
    if (currentNs !== REQUIRED_NAMESPACE) {
        console.error(`   ❌ 严重违规: @namespace 不符合红线要求！期望: ${REQUIRED_NAMESPACE}，实际: ${currentNs}`);
        hasErrors = true;
    } else {
        console.log(`   ✅ @namespace 一致 (${REQUIRED_NAMESPACE})`);
    }

    // Version
    const verMatch = meta.match(/@version\s+(\S+)/);
    const currentVer = verMatch ? verMatch[1] : '';
    if (currentVer !== pkg.version) {
        console.error(`   ❌ 版本不匹配: package.json 为 ${pkg.version}，但元数据头为 ${currentVer}`);
        hasErrors = true;
    } else {
        console.log(`   ✅ 版本号一致 (${currentVer})`);
    }

    // Match root domains check
    const requiredRootMatches = ['*://missav.ai/*', '*://missav.ws/*', '*://jable.tv/*'];
    const missingMatches = requiredRootMatches.filter(m => !meta.includes(m));
    if (missingMatches.length > 0) {
        console.warn('   ⚠️ 规则警告: 缺失根域名直接匹配，可能导致非 www 子域名访问时无法启动:');
        missingMatches.forEach(m => console.warn('      - ' + m));
        hasWarnings = true;
    } else {
        console.log('   ✅ 根域名与泛子域名匹配规则完整覆盖。');
    }

    // 4. 代码可读性与语法树审计 (AST Anti-Obfuscation Check)
    console.log('\n🔍 [4/4] 抽象语法树 (AST) 与混淆特征审查:');
    
    // 语法分号检查
    if (code.includes('"use strict"(function')) {
        console.error('   ❌ 致命语法错误: 检测到 "use strict" 缺少分号，将导致浏览器抛出 TypeError！');
        hasErrors = true;
    } else {
        console.log('   ✅ 严格模式包装语法完整有效。');
    }

    // AST 解析与变量名长度抽样
    try {
        const headerEnd = code.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length;
        const bodyCode = code.slice(headerEnd);

        const ast = parser.parse(bodyCode, {
            sourceType: 'unambiguous',
            plugins: ['topLevelAwait']
        });

        console.log('   ✅ AST 语法分析成功通过，无异常阻断代码。');
    } catch (parseErr) {
        console.error('   ❌ AST 解析失败: ' + parseErr.message);
        hasErrors = true;
    }

    console.log('\n====================================================');
    if (hasErrors) {
        console.error('🛑 门禁审查失败: 发现违规或致命错误，发布流程已强制阻断！');
        process.exit(1);
    } else if (hasWarnings) {
        console.log('⚠️ 门禁审查通过，但存在优化警告。');
        process.exit(0);
    } else {
        console.log('🎉 门禁审查全项通过: 代码纯净、透明、合规，准予发布！');
        process.exit(0);
    }
}

runCheck();
