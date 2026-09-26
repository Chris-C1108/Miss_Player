const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const DEBUG_PORT = 9227;
const MOCK_PAGE = path.resolve(__dirname, 'mock-host.html');
const DIST_SCRIPT = path.resolve(__dirname, '../../dist/miss_player.user.js');

// ── Utilities ──────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getWsUrl() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:' + DEBUG_PORT + '/json/version', res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body).webSocketDebuggerUrl); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function getPages() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:' + DEBUG_PORT + '/json/list', res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

class SimpleCDP {
    constructor(wsUrl) { this.wsUrl = wsUrl; this.ws = null; this.id = 1; this.handlers = []; }
    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.on('open', resolve);
            this.ws.on('error', reject);
            this.ws.on('message', data => {
                const msg = JSON.parse(data.toString());
                this.handlers = this.handlers.filter(h => {
                    if (h.id === msg.id) { h.resolve(msg); return false; }
                    return true;
                });
            });
        });
    }
    send(method, params) {
        return new Promise((resolve, reject) => {
            const id = this.id++;
            this.handlers.push({ id, resolve });
            this.ws.send(JSON.stringify({ id, method, params: params || {} }));
            setTimeout(() => reject(new Error('CDP timeout: ' + method)), 10000);
        });
    }
    async evaluate(expr) {
        const r = await this.send('Runtime.evaluate', {
            expression: expr, returnByValue: true, awaitPromise: true
        });
        if (r.result && r.result.result) return r.result.result.value;
        if (r.result && r.result.exceptionDetails) {
            throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
        }
        return undefined;
    }
    close() { if (this.ws) this.ws.close(); }
}

// ── Main ───────────────────────────────────────────────────

async function main() {
    console.log('\n==========================================================');
    console.log('⚡ Miss Player 性能基准测试');
    console.log('==========================================================\n');

    // 1. Launch Chrome
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const mockUrl = 'file://' + MOCK_PAGE;

    console.log('[1/5] 启动 Chrome (debug port ' + DEBUG_PORT + ')...');
    const chrome = spawn(chromePath, [
        '--remote-debugging-port=' + DEBUG_PORT,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--user-data-dir=/tmp/mp-perf-chrome-' + Date.now(),
        '--window-size=1280,800',
        mockUrl
    ], { stdio: 'ignore', detached: true });

    chrome.unref();
    await sleep(3000);

    let cdp;
    try {
        // 2. Connect CDP
        console.log('[2/5] 连接 CDP...');
        const pages = await getPages();
        const target = pages.find(p => p.type === 'page' && p.url.includes('mock-host'));
        if (!target) throw new Error('未找到 mock 测试页面');

        cdp = new SimpleCDP(target.webSocketDebuggerUrl);
        await cdp.connect();
        await cdp.send('Runtime.enable');
        await cdp.send('Performance.enable');

        // 3. Inject GM_* stubs
        console.log('[3/5] 注入 GM_* 沙箱桩函数...');
        await cdp.evaluate(`
            window.GM_getValue = function(k, d) { return d; };
            window.GM_setValue = function() {};
            window.GM_deleteValue = function() {};
            window.GM_listValues = function() { return []; };
            window.GM_xmlhttpRequest = function(opts) {
                if (opts.onerror) opts.onerror({ status: 0 });
            };
            window.GM_setClipboard = function() {};
            window.GM_addStyle = function(css) {
                var s = document.createElement('style');
                s.textContent = css;
                document.head.appendChild(s);
                return s;
            };
            window.GM_registerMenuCommand = function() {};
            window.GM_openInTab = function() {};
            window.GM_notification = function() {};
            window.GM_info = { script: { version: '5.6.37' } };
            window.GM = {
                getValue: async function(k, d) { return d; },
                setValue: async function() {},
                deleteValue: async function() {},
                listValues: async function() { return []; },
                xmlHttpRequest: window.GM_xmlhttpRequest,
                info: window.GM_info
            };
            'stubs ready';
        `);

        // 4. Inject the userscript and measure
        console.log('[4/5] 注入 Miss Player 脚本并采集性能数据...');

        // Take baseline metrics BEFORE injection
        const baselineRes = await cdp.send('Performance.getMetrics');
        const baseline = Object.fromEntries(
            baselineRes.result.metrics.map(function(e) { return [e.name, e.value]; })
        );

        // Read and inject the script
        const scriptCode = fs.readFileSync(DIST_SCRIPT, 'utf8');
        // Strip the userscript header block
        const codeBody = scriptCode.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, '');

        try {
            await cdp.evaluate(codeBody);
        } catch (e) {
            // Some errors are expected (network requests, missing DOM elements)
            // The performance marks should still have fired
        }

        await sleep(1500); // Wait for async init

        // Take post-injection metrics
        const postRes = await cdp.send('Performance.getMetrics');
        const post = Object.fromEntries(
            postRes.result.metrics.map(function(e) { return [e.name, e.value]; })
        );

        // 5. Collect User Timing marks
        console.log('[5/5] 采集 User Timing 标记...\n');

        const timings = await cdp.evaluate(`
            (function() {
                var marks = performance.getEntriesByType('mark')
                    .filter(function(e) { return e.name.indexOf('mp:') === 0; })
                    .map(function(e) { return { name: e.name, time: Math.round(e.startTime * 100) / 100 }; });
                var measures = performance.getEntriesByType('measure')
                    .filter(function(e) { return e.name.indexOf('mp:') === 0; })
                    .map(function(e) { return { name: e.name, duration: Math.round(e.duration * 100) / 100 }; });
                return { marks: marks, measures: measures };
            })()
        `);

        // ── Report ─────────────────────────────────────────

        console.log('──────────────────────────────────────────────────────────');
        console.log('📊 CDP Performance Metrics (脚本注入增量)');
        console.log('──────────────────────────────────────────────────────────');

        const scriptDelta = ((post.ScriptDuration || 0) - (baseline.ScriptDuration || 0)) * 1000;
        const taskDelta = ((post.TaskDuration || 0) - (baseline.TaskDuration || 0)) * 1000;
        const layoutDelta = ((post.LayoutDuration || 0) - (baseline.LayoutDuration || 0)) * 1000;
        const heapDelta = ((post.JSHeapUsedSize || 0) - (baseline.JSHeapUsedSize || 0)) / 1024 / 1024;

        console.log('  ScriptDuration 增量:  ' + scriptDelta.toFixed(1) + ' ms');
        console.log('  TaskDuration 增量:    ' + taskDelta.toFixed(1) + ' ms');
        console.log('  LayoutDuration 增量:  ' + layoutDelta.toFixed(1) + ' ms');
        console.log('  JSHeap 增量:          ' + heapDelta.toFixed(2) + ' MB');
        console.log('  JSHeap 总量:          ' + ((post.JSHeapUsedSize || 0) / 1024 / 1024).toFixed(2) + ' MB');

        console.log('');
        console.log('──────────────────────────────────────────────────────────');
        console.log('⏱️  User Timing 标记 (mp:*)');
        console.log('──────────────────────────────────────────────────────────');

        if (timings && timings.marks && timings.marks.length > 0) {
            timings.marks.forEach(function(m) {
                console.log('  [mark]    ' + m.name.padEnd(28) + m.time + ' ms');
            });
        } else {
            console.log('  ⚠️  未检测到 mp:* 标记');
        }

        console.log('');
        if (timings && timings.measures && timings.measures.length > 0) {
            var thresholds = { 'mp:early-init': 50, 'mp:startup': 120, 'mp:theater-init': 80 };
            timings.measures.forEach(function(m) {
                var threshold = thresholds[m.name];
                var status = '✅';
                if (threshold && m.duration > threshold) status = '❌ 超过 ' + threshold + 'ms 阈值';
                console.log('  [measure] ' + m.name.padEnd(28) + m.duration + ' ms  ' + status);
            });
        } else {
            console.log('  ⚠️  未检测到 mp:* measure');
        }

        console.log('');
        console.log('==========================================================');
        console.log('测试完毕');
        console.log('==========================================================\n');

    } finally {
        if (cdp) cdp.close();
        // Kill Chrome
        try { process.kill(-chrome.pid); } catch (e) {}
        try { execSync('pkill -f "mp-perf-chrome"', { stdio: 'ignore' }); } catch (e) {}
    }
}

main().catch(e => {
    console.error('❌ 性能测试失败:', e.message);
    try { execSync('pkill -f "mp-perf-chrome"', { stdio: 'ignore' }); } catch (_) {}
    process.exit(1);
});

