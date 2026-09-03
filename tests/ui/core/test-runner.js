const fs = require('fs');
const path = require('path');
const config = require('../config');
const CdpClient = require('./cdp-client');
const oracle = require('./selector-oracle');
const AnomalyDetector = require('./anomaly-detector');

class TestRunner {
    constructor(options = {}) {
        this.options = options;
        this.cdp = new CdpClient(config.cdp.browserWsUrl);
        this.results = {
            startTime: Date.now(),
            targetUrl: '',
            targetTitle: '',
            viewportsTested: [],
            totalCases: 0,
            passedCases: 0,
            failedCases: 0,
            criticalAnomalies: 0,
            reports: []
        };
    }

    loadCases() {
        const casesDir = path.join(__dirname, '..', 'cases');
        const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.js')).sort();
        return files.map(f => require(path.join(casesDir, f)));
    }

    async run() {
        console.log('\n=============================================================');
        console.log('🚀 Miss Player 自动化 UI 测试套件 (可复用/自进化/多屏幕比例)');
        console.log('=============================================================');
        console.log(`[CDP] 正在连接 Chrome 实例: ${config.cdp.browserWsUrl}`);
        
        await this.cdp.connect();
        console.log('[CDP] 握手成功，开始定位目标播放页面...');

        const target = await this.cdp.findTarget(config.targetFilter);
        if (!target) {
            throw new Error(`未找到匹配的 MissAV/Jable 目标页面！请确保浏览器中已打开播放页面。`);
        }

        console.log(`[Target] 已锁定目标标签页: "${target.title}"`);
        console.log(`[Target] URL: ${target.url} (${target.targetId})`);

        this.results.targetUrl = target.url;
        this.results.targetTitle = target.title;

        const sessionId = await this.cdp.attach(target.targetId);
        const cases = this.loadCases();
        const selectedViewports = this.options.viewports || Object.keys(config.viewports);

        console.log(`[Suite] 已加载 ${cases.length} 个通用测试用例，涵盖 ${selectedViewports.length} 个视口比例\n`);

        for (const vpKey of selectedViewports) {
            const vp = config.viewports[vpKey];
            if (!vp) continue;

            console.log(`-------------------------------------------------------------`);
            console.log(`📱 正在切换视口: [${vpKey}] ${vp.name} (${vp.width}x${vp.height}, DPR: ${vp.deviceScaleFactor})`);
            console.log(`-------------------------------------------------------------`);

            await this.cdp.emulateViewport(vp, sessionId);

            const vpReport = {
                viewportKey: vpKey,
                viewportName: vp.name,
                width: vp.width,
                height: vp.height,
                cases: [],
                anomalies: [],
                screenshot: null
            };

            for (const testCase of cases) {
                const caseStart = Date.now();
                process.stdout.write(`  ▶ 执行用例 [${testCase.id}] ${testCase.name} ... `);

                let caseResult;
                try {
                    caseResult = await testCase.run({
                        cdp: this.cdp,
                        sessionId,
                        oracle,
                        viewport: vp
                    });
                } catch (err) {
                    caseResult = {
                        passed: false,
                        error: err.message,
                        assertions: [`执行异常: ${err.message}`]
                    };
                }

                const duration = Date.now() - caseStart;
                this.results.totalCases++;

                if (caseResult.passed) {
                    this.results.passedCases++;
                    console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
                } else {
                    this.results.failedCases++;
                    console.log(`\x1b[31mFAIL\x1b[0m (${duration}ms)`);
                    if (caseResult.assertions && caseResult.assertions.length > 0) {
                        caseResult.assertions.forEach(a => console.log(`     └─ \x1b[33m${a}\x1b[0m`));
                    }
                }

                vpReport.cases.push({
                    id: testCase.id,
                    name: testCase.name,
                    passed: caseResult.passed,
                    duration,
                    assertions: caseResult.assertions || [],
                    details: caseResult.details || null
                });
            }

            // 执行缺陷扫描器
            process.stdout.write(`  🔍 深度扫描视觉与数据缺陷 (Anomaly Detection) ... `);
            const anomalies = await AnomalyDetector.scan(this.cdp, sessionId);
            vpReport.anomalies = anomalies;

            const criticals = anomalies.filter(a => a.severity === 'CRITICAL');
            if (criticals.length > 0) {
                this.results.criticalAnomalies += criticals.length;
                console.log(`\x1b[31m发现 ${anomalies.length} 个缺陷 (${criticals.length} 个严重)\x1b[0m`);
                criticals.forEach(c => console.log(`     └─ 🚨 [${c.type}] ${c.message}`));
            } else if (anomalies.length > 0) {
                console.log(`\x1b[33m发现 ${anomalies.length} 个次要缺陷/警告\x1b[0m`);
                anomalies.forEach(c => console.log(`     └─ ⚠️ [${c.type}] ${c.message}`));
            } else {
                console.log(`\x1b[32mCLEAN\x1b[0m (未检出缺陷)`);
            }

            // 拍摄当前视口的高清快照
            const screenshotName = `vp_${vpKey}.png`;
            const shotPath = path.join(config.paths.artifactsDir, screenshotName);
            await this.cdp.captureScreenshot(shotPath, sessionId);
            vpReport.screenshot = path.relative(config.paths.reportsDir, shotPath).replace(/\\/g, '/');

            this.results.reports.push(vpReport);
            this.results.viewportsTested.push(vpKey);
            console.log('');
        }

        // 恢复视口为初始 1920x1080 桌面态
        await this.cdp.emulateViewport(config.viewports.desktop_16_9, sessionId);

        this.results.duration = Date.now() - this.results.startTime;
        await this.cdp.close();

        // 输出并生成报表
        this.generateReports();
        return this.results;
    }

    generateReports() {
        const jsonPath = path.join(config.paths.reportsDir, 'latest_report.json');
        const htmlPath = path.join(config.paths.reportsDir, 'latest_report.html');

        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2), 'utf8');

        // 生成可视化 HTML 测试报告
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Miss Player UI 自动化测试报告</title>
    <style>
        :root {
            --bg: #0f172a;
            --card-bg: #1e293b;
            --border: #334155;
            --text: #f8fafc;
            --muted: #94a3b8;
            --pass: #10b981;
            --fail: #ef4444;
            --warn: #f59e0b;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 24px;
        }
        .header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 28px;
        }
        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
        }
        .stat-val {
            font-size: 32px;
            font-weight: 700;
            margin-top: 8px;
        }
        .vp-section {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 28px;
        }
        .vp-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        th, td {
            padding: 10px 14px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        th { color: var(--muted); font-weight: 600; }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-pass { background: rgba(16, 185, 129, 0.2); color: var(--pass); }
        .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--fail); }
        .anomaly-box {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 16px;
        }
        .screenshot-wrap {
            text-align: center;
            margin-top: 16px;
        }
        .screenshot-img {
            max-width: 100%;
            max-height: 480px;
            border-radius: 8px;
            border: 1px solid var(--border);
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Miss Player 自动化 UI 测试报告</h1>
        <p style="color: var(--muted); margin: 4px 0 0 0;">目标页面: <strong>${this.results.targetTitle}</strong> (${this.results.targetUrl})</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div style="color: var(--muted);">测试视口数</div>
            <div class="stat-val" style="color: #60a5fa;">${this.results.viewportsTested.length}</div>
        </div>
        <div class="stat-card">
            <div style="color: var(--muted);">总用例数</div>
            <div class="stat-val">${this.results.totalCases}</div>
        </div>
        <div class="stat-card">
            <div style="color: var(--muted);">通过用例</div>
            <div class="stat-val" style="color: var(--pass);">${this.results.passedCases}</div>
        </div>
        <div class="stat-card">
            <div style="color: var(--muted);">失败/异常</div>
            <div class="stat-val" style="color: var(--fail);">${this.results.failedCases}</div>
        </div>
        <div class="stat-card">
            <div style="color: var(--muted);">严重数据缺陷</div>
            <div class="stat-val" style="color: var(--warn);">${this.results.criticalAnomalies}</div>
        </div>
    </div>

    ${this.results.reports.map(r => `
        <div class="vp-section">
            <div class="vp-header">
                <div>
                    <h2 style="margin: 0;">${r.viewportName}</h2>
                    <span style="color: var(--muted); font-size: 13px;">规格: ${r.width} × ${r.height}</span>
                </div>
            </div>

            ${r.anomalies.length > 0 ? `
                <div class="anomaly-box">
                    <strong style="color: var(--fail);">🚨 缺陷探测告警 (${r.anomalies.length} 项)</strong>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                        ${r.anomalies.map(a => `<li><strong>[${a.type}]</strong> ${a.message}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <table>
                <thead>
                    <tr>
                        <th>用例 ID</th>
                        <th>用例名称</th>
                        <th>耗时</th>
                        <th>状态</th>
                        <th>断言与问题诊断</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.cases.map(c => `
                        <tr>
                            <td><code>${c.id}</code></td>
                            <td>${c.name}</td>
                            <td>${c.duration}ms</td>
                            <td><span class="badge ${c.passed ? 'badge-pass' : 'badge-fail'}">${c.passed ? 'PASS' : 'FAIL'}</span></td>
                            <td style="color: ${c.passed ? 'var(--muted)' : 'var(--fail)'};">
                                ${c.assertions.length > 0 ? c.assertions.join('<br>') : '—'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${r.screenshot ? `
                <div class="screenshot-wrap">
                    <img class="screenshot-img" src="${r.screenshot}" alt="${r.viewportName} 实景渲染快照" />
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;

        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('=============================================================');
        console.log(`📊 测试全流程执行完毕！`);
        console.log(`   - 聚合 JSON 报告: ${jsonPath}`);
        console.log(`   - 视觉 HTML 报告: ${htmlPath}`);
        console.log('=============================================================\n');
    }
}

module.exports = TestRunner;
