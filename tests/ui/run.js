const TestRunner = require('./core/test-runner');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
    if (arg.startsWith('--viewports=')) {
        options.viewports = arg.replace('--viewports=', '').split(',').map(s => s.trim());
    }
});

async function main() {
    const runner = new TestRunner(options);
    try {
        const results = await runner.run();
        const hasFailures = results.failedCases > 0 || results.criticalAnomalies > 0;
        process.exit(hasFailures ? 1 : 0);
    } catch (e) {
        console.error('\n❌ 测试运行器异常退出:', e);
        process.exit(1);
    }
}

main();
