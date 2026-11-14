/**
 * Miss Player — Playwright 多设备并发 UI 截图审查系统
 *
 * 核心目标：
 *   供 AI 视觉审查模型 (Vision AI) 自动或半自动批量审查 UI 异常、
 *   布局错位、Safe Area 适配、WebDAV 表单回显、Apple 设计规范落地。
 *
 * 流程：
 *   1. 本地轻量 HTTP 服务托管 ref/index.html
 *   2. 注入 GM API Polyfill（包含 WebDAV 配置预置）
 *   3. 注入 dist/miss_player.user.js 最新构建产物
 *   4. 7 种主流尺寸设备并发执行：
 *      - Step 1: 浮动唤醒按钮 (FAB)
 *      - Step 2: 播放器主界面 (Player Core + 控制条)
 *      - Step 3: Apple 风格设置面板 (Settings Overview)
 *      - Step 4: WebDAV 云同步详情卡片 (WebDAV Expanded)
 *   5. 产出规范化命名截图：{yyyymmdd-hhmm}_{version}_{device}_{step}.png
 *   6. 导出 AI 审查引导清单 (ai-review-manifest.json) 与交互式 HTML 报表
 *
 * 使用：
 *   node tests/ui-screenshots/screenshot.js
 *   node tests/ui-screenshots/screenshot.js --open
 *   node tests/ui-screenshots/screenshot.js --devices=desktop_1080p,iphone_portrait
 */

const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ────────────────────────────────────────────────────────
// 常量与配置
// ────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const HTML_PATH = path.join(PROJECT_ROOT, 'ref/index.html');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'dist/miss_player.user.js');
const POLYFILL_PATH = path.join(__dirname, 'gm-polyfill.js');
const OUTPUT_DIR = path.join(__dirname, 'snapshots');

const PKG = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
const VERSION = PKG.version;

// 用户指定的 WebDAV 预设连接参数
const WEBDAV_CONFIG = {
  url: 'https://dav.loadingi.fnos.net:443',
  username: 'chen',
  password: 'Chen@2026',
  path: '/backup_configs/MissPlayer/',
};

// 7 大测试视口规格矩阵
const DEVICES = {
  desktop_1080p: {
    label: '桌面标准 16:9 (1080p)',
    category: 'desktop',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  desktop_ultrawide: {
    label: '桌面带鱼屏 21:9',
    category: 'desktop',
    viewport: { width: 2560, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  laptop_1440: {
    label: '笔记本 16:10 (MacBook Retina)',
    category: 'laptop',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  },
  ipad_landscape: {
    label: 'iPad 横屏 4:3',
    category: 'tablet',
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  ipad_portrait: {
    label: 'iPad 竖屏 3:4',
    category: 'tablet',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  iphone_portrait: {
    label: 'iPhone 竖屏 9:19.5 (单手模式)',
    category: 'mobile',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  iphone_landscape: {
    label: 'iPhone 横屏 19.5:9 (全屏观影)',
    category: 'mobile',
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};

// ────────────────────────────────────────────────────────
// 辅助函数
// ────────────────────────────────────────────────────────

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function startLocalServer(port = 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath;
      const url = req.url.split('?')[0];

      if (url === '/' || url === '/index.html') {
        filePath = HTML_PATH;
      } else if (url.startsWith('/dist/')) {
        filePath = path.join(PROJECT_ROOT, url);
      } else {
        filePath = path.join(path.dirname(HTML_PATH), url.slice(1));
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.mp4': 'video/mp4',
        '.json': 'application/json; charset=utf-8',
      };

      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port, url: `http://127.0.0.1:${addr.port}` });
    });
    server.on('error', reject);
  });
}

// ────────────────────────────────────────────────────────
// 单设备审查快照流水线
// ────────────────────────────────────────────────────────

async function captureDevice(browser, baseUrl, deviceKey, deviceConfig, timestamp, polyfillCode, scriptCode) {
  const { label, viewport, deviceScaleFactor, isMobile, hasTouch } = deviceConfig;
  const tag = `[${deviceKey}]`;
  const shotsTaken = [];

  console.log(`  ${tag} 启动 (${viewport.width}×${viewport.height} @${deviceScaleFactor}x) ...`);

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    isMobile,
    hasTouch,
    userAgent: isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    ignoreHTTPSErrors: true,
  });

  // 1. 注入 WebDAV 配置
  await context.addInitScript({
    content: `window.__MP_WEBDAV_CONFIG__ = ${JSON.stringify(WEBDAV_CONFIG)};`,
  });

  // 2. 注入 GM Polyfill
  await context.addInitScript({
    content: polyfillCode.replace('__VERSION__', VERSION),
  });

  // 3. 注入油猴脚本
  await context.addInitScript({ content: scriptCode });

  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // 导航至测试页
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('video', { timeout: 10000 });

    // 等待浮动唤醒按钮渲染
    await page.waitForSelector('.tm-floating-button', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(400);

    // ── 截图 1: 浮动唤醒按钮 (FAB) ──
    const shotFabName = `${timestamp}_${VERSION}_${deviceKey}_1_fab.png`;
    const shotFabPath = path.join(OUTPUT_DIR, shotFabName);
    await page.screenshot({ path: shotFabPath, fullPage: false });
    shotsTaken.push({ step: '1_fab', name: shotFabName, path: shotFabPath, title: '浮动唤醒按钮' });
    console.log(`  ${tag} 📸 1/4 FAB 就绪`);

    // 点击浮动按钮进入播放器
    await page.click('.tm-floating-button', { force: true });

    // 等待 Shadow DOM 挂载 (display:contents 特性需用 attached)
    await page.waitForSelector('miss-player-root', { state: 'attached', timeout: 10000 });

    // 等待播放器视窗与主控件挂载
    await page.waitForFunction(
      () => {
        const root = document.querySelector('miss-player-root');
        if (!root || !root.shadowRoot) return false;
        const sr = root.shadowRoot;
        return !!(
          sr.querySelector('[class*="viewport"]') ||
          sr.querySelector('[class*="controls"]') ||
          sr.querySelector('[class*="control"]') ||
          sr.querySelector('video')
        );
      },
      { timeout: 10000 }
    );

    // 唤醒横屏防自动休眠隐藏：模拟手势激活控制条
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.evaluate(() => {
      document.body.classList.remove('controls-hidden');
      const root = document.querySelector('miss-player-root');
      if (root && root.shadowRoot) {
        const c = root.shadowRoot.querySelector('.tm-control-buttons, .tm-control-panel');
        if (c) c.classList.remove('is-hidden');
      }
    });

    await page.waitForTimeout(1000);

    // ── 截图 2: 播放器主界面 (Player Core) ──
    const shotPlayerName = `${timestamp}_${VERSION}_${deviceKey}_2_player.png`;
    const shotPlayerPath = path.join(OUTPUT_DIR, shotPlayerName);
    await page.screenshot({ path: shotPlayerPath, fullPage: false });
    shotsTaken.push({ step: '2_player', name: shotPlayerName, path: shotPlayerPath, title: '播放器主界面' });
    console.log(`  ${tag} 📸 2/4 播放器就绪`);

    // ── 截图 3: Apple 风格设置面板 (Settings Overview) ──
    const openedSettings = await page.evaluate(() => {
      const root = document.querySelector('miss-player-root');
      if (!root || !root.shadowRoot) return false;
      const sr = root.shadowRoot;
      const btn = sr.querySelector(
        '[class*="settings"], [data-action="settings"], button[aria-label*="设置"], button[title*="设置"]'
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (openedSettings) {
      await page.waitForTimeout(700);
      const shotSettingsName = `${timestamp}_${VERSION}_${deviceKey}_3_settings.png`;
      const shotSettingsPath = path.join(OUTPUT_DIR, shotSettingsName);
      await page.screenshot({ path: shotSettingsPath, fullPage: false });
      shotsTaken.push({ step: '3_settings', name: shotSettingsName, path: shotSettingsPath, title: '设置面板 (概览)' });
      console.log(`  ${tag} 📸 3/4 设置面板就绪`);

      // ── 截图 4: WebDAV 云同步卡片展开态 (WebDAV Hydrated & Expanded) ──
      const webdavExpanded = await page.evaluate(async () => {
        const root = document.querySelector('miss-player-root');
        if (!root || !root.shadowRoot) return false;
        const sr = root.shadowRoot;

        // 寻找设置容器并滚动至底部触发视口水合
        // 寻找设置容器并滚动至底部触发视口水合
        const panel = sr.querySelector('.tm-settings-panel');
        if (panel) {
          panel.scrollTop = panel.scrollHeight;
        }

        // 轮询等待 WebDAV 手风琴水合完成 (最多等待 2000ms)
        let targetHeader = null;
        for (let i = 0; i < 20; i++) {
          if (panel) panel.scrollTop = panel.scrollHeight;
          await new Promise((r) => setTimeout(r, 100));
          const headers = sr.querySelectorAll('.tm-apple-accordion-header');
          for (const h of headers) {
            if (
              h.textContent.includes('云端同步') ||
              h.textContent.includes('WebDAV') ||
              h.textContent.includes('Cloud Sync') ||
              h.textContent.includes('Sync')
            ) {
              targetHeader = h;
              break;
            }
          }
          if (targetHeader) break;
        }

        if (targetHeader) {
          targetHeader.click();
          // 手风琴点击展开后再次滚动到底部，将整个 WebDAV 表单及操作按钮完整展示出来
          await new Promise((r) => setTimeout(r, 400));
          if (panel) {
            panel.scrollTop = panel.scrollHeight;
          }
          return true;
        }
        return false;
      });

      if (webdavExpanded) {
        await page.waitForTimeout(600);
        const shotWebdavName = `${timestamp}_${VERSION}_${deviceKey}_4_webdav.png`;
        const shotWebdavPath = path.join(OUTPUT_DIR, shotWebdavName);
        await page.screenshot({ path: shotWebdavPath, fullPage: false });
        shotsTaken.push({ step: '4_webdav', name: shotWebdavName, path: shotWebdavPath, title: 'WebDAV 展开表单' });
        console.log(`  ${tag} 📸 4/4 WebDAV 卡片就绪`);
      }
    }

    return {
      deviceKey,
      label,
      viewport,
      success: true,
      shots: shotsTaken,
      errors,
    };
  } catch (err) {
    console.error(`  ${tag} ❌ 失败: ${err.message}`);
    const failName = `${timestamp}_${VERSION}_${deviceKey}_FAIL.png`;
    const failPath = path.join(OUTPUT_DIR, failName);
    try {
      await page.screenshot({ path: failPath, fullPage: false });
      shotsTaken.push({ step: 'fail', name: failName, path: failPath, title: '异常现场快照' });
    } catch (_) {}

    return {
      deviceKey,
      label,
      viewport,
      success: false,
      error: err.message,
      shots: shotsTaken,
      errors,
    };
  } finally {
    await context.close();
  }
}

// ────────────────────────────────────────────────────────
// AI 审查引导清单 (Manifest) 生成器
// ────────────────────────────────────────────────────────

function generateAiManifest(timestamp, results, outputDir) {
  const manifestPath = path.join(outputDir, `${timestamp}_${VERSION}_ai-review-manifest.json`);

  const manifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    sessionTimestamp: timestamp,
    scriptVersion: VERSION,
    purpose: 'Miss Player 自动化 UI 视觉审查 (Vision AI Review Pipeline)',
    reviewChecklist: [
      {
        id: 'CHECK-01',
        category: 'Apple Design & 毛玻璃',
        description: '面板背景是否正确呈现 backdrop-filter: blur() 毛玻璃层级，有无生硬纯黑/纯白遮罩',
      },
      {
        id: 'CHECK-02',
        category: 'Safe Area 与单手易触区',
        description: 'iPhone 竖屏底部是否避让 env(safe-area-inset-bottom)，核心胶囊/按钮是否在大拇指易达区 (下半部)',
      },
      {
        id: 'CHECK-03',
        category: '文字截断与几何溢出',
        description: '标题 MIAB-592、秒数胶囊 (5s~10m)、连播/快览文案是否发生折行挤压或被边框裁剪',
      },
      {
        id: 'CHECK-04',
        category: 'WebDAV 配置状态回显',
        description: '云端同步卡片是否正确回显“● 已配置”，表单展开后是否正确显示预置的服务器地址与用户名 chen',
      },
      {
        id: 'CHECK-05',
        category: '横竖屏自适应与侧边栏',
        description: 'PC 宽屏与超宽屏下控制栏是否正确定位至右下角；移动端横屏是否保持全宽纯净观影',
      },
    ],
    devices: results.map((r) => ({
      key: r.deviceKey,
      name: r.label,
      resolution: `${r.viewport.width}x${r.viewport.height}`,
      success: r.success,
      screenshots: r.shots.map((s) => ({
        step: s.step,
        title: s.title,
        fileName: s.name,
        filePath: s.path,
      })),
      errorsLogged: r.errors || [],
    })),
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  return manifestPath;
}

// ────────────────────────────────────────────────────────
// 视觉报表 HTML 生成器
// ────────────────────────────────────────────────────────

function generateReport(timestamp, results, outputDir, manifestPath) {
  const reportPath = path.join(outputDir, `${timestamp}_${VERSION}_report.html`);

  const cards = results
    .map((r) => {
      const shotsHtml = r.shots
        .map(
          (s) => `
          <div class="shot-card">
            <div class="shot-meta">
              <span class="shot-step">${s.step}</span>
              <span class="shot-title">${s.title}</span>
            </div>
            <a href="${s.name}" target="_blank" rel="noreferrer">
              <img src="${s.name}" alt="${s.title}" loading="lazy"/>
            </a>
            <p class="shot-name"><code>${s.name}</code></p>
          </div>`
        )
        .join('');

      const badge = r.success
        ? '<span class="badge pass">PASS</span>'
        : '<span class="badge fail">FAIL</span>';

      return `
        <div class="device-section">
          <div class="device-header">
            <div>
              <h2>${r.label}</h2>
              <span class="device-sub">设备标识: <code>${r.deviceKey}</code> &nbsp;|&nbsp; 分辨率: ${r.viewport.width} × ${r.viewport.height}</span>
            </div>
            ${badge}
          </div>
          ${r.error ? `<div class="error-banner">❌ ${escapeHtml(r.error)}</div>` : ''}
          <div class="shots-grid">${shotsHtml}</div>
        </div>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Miss Player UI 审查快照 — ${timestamp} v${VERSION}</title>
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #12141c;
      --border: #222634;
      --text: #f0f3f8;
      --muted: #8b949e;
      --accent: #0a84ff;
      --pass: #30d158;
      --fail: #ff453a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px;
      line-height: 1.5;
    }
    .container { max-width: 1600px; margin: 0 auto; }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
    }
    h1 { font-size: 26px; font-weight: 700; }
    .subtitle { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .meta-pills { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .pill {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
    }
    .pill strong { color: var(--accent); }
    .device-section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .device-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .device-header h2 { font-size: 19px; font-weight: 600; }
    .device-sub { color: var(--muted); font-size: 13px; margin-top: 2px; }
    .badge {
      padding: 5px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .5px;
    }
    .badge.pass { background: rgba(48,209,88,.15); color: var(--pass); border: 1px solid rgba(48,209,88,.3); }
    .badge.fail { background: rgba(255,69,58,.15); color: var(--fail); border: 1px solid rgba(255,69,58,.3); }
    .error-banner {
      background: rgba(255,69,58,.1);
      border: 1px solid rgba(255,69,58,.3);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      color: var(--fail);
      font-size: 13px;
    }
    .shots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 20px;
    }
    .shot-card {
      background: rgba(0,0,0,.3);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      transition: transform .2s, border-color .2s;
    }
    .shot-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .shot-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .shot-step {
      background: rgba(255,255,255,.08);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: monospace;
      color: var(--muted);
    }
    .shot-title { font-size: 13px; font-weight: 600; }
    .shot-card img {
      width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
      border: 1px solid var(--border);
      background: #000;
    }
    .shot-name {
      margin-top: 10px;
      font-size: 11px;
      color: var(--muted);
      word-break: break-all;
    }
    .ai-checklist {
      background: rgba(10,132,255,.06);
      border: 1px solid rgba(10,132,255,.25);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .ai-checklist h3 { font-size: 16px; color: var(--accent); margin-bottom: 10px; }
    .ai-checklist ul { padding-left: 20px; font-size: 13px; color: var(--muted); }
    .ai-checklist li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🎬 Miss Player UI 审查快照</h1>
        <p class="subtitle">Playwright + 油猴脚本 + 7 大核心视口多端并发视觉测试</p>
      </div>
      <div class="meta-pills">
        <span class="pill">版本: <strong>v${VERSION}</strong></span>
        <span class="pill">时间: <strong>${timestamp}</strong></span>
        <span class="pill">通过率: <strong>${results.filter((r) => r.success).length}/${results.length}</strong></span>
        <a class="pill" href="${path.basename(manifestPath)}" style="color:var(--accent); text-decoration:none;" download>📄 AI Manifest</a>
      </div>
    </header>

    <div class="ai-checklist">
      <h3>🤖 AI 视觉审查自检清单 (AI Inspection Objectives)</h3>
      <ul>
        <li><strong>[FAB 唤醒态]</strong> 呼吸光晕浮动按钮在竖屏时是否正居中贴近屏幕底部，在横屏时是否停泊于右下角</li>
        <li><strong>[主播放器]</strong> 居中播放胶囊、快进快退 6 挡按钮矩阵、莫兰迪色系是否按 2-4 字规范呈现无溢出</li>
        <li><strong>[Apple 设置面板]</strong> 磨砂毛玻璃卡片层次是否清晰，开关与滑块是否符合 HIG 标准，去技术黑话</li>
        <li><strong>[WebDAV 云同步]</strong> 云端同步手风琴是否显示“● 已配置”，展开后是否准确回显预设服务器与账户名</li>
        <li><strong>[Safe Area 避让]</strong> 移动端刘海区与底部手势条是否完全避让，无元素重叠或下边缘穿透</li>
      </ul>
    </div>

    ${cards}
  </div>
</body>
</html>`;

  fs.writeFileSync(reportPath, html, 'utf8');
  return reportPath;
}

// ────────────────────────────────────────────────────────
// CLI 主流程
// ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const shouldOpen = args.includes('--open');
  const deviceFilter = args.find((a) => a.startsWith('--devices='));
  const selectedDevices = deviceFilter
    ? deviceFilter.replace('--devices=', '').split(',').map((s) => s.trim())
    : Object.keys(DEVICES);

  console.log('\n==========================================================');
  console.log('  Miss Player — Playwright 多设备并发 UI 截图审查系统');
  console.log('==========================================================');
  console.log(`  版本:   v${VERSION}`);
  console.log(`  设备:   ${selectedDevices.length} 个视口矩阵`);
  console.log(`  脚本:   ${SCRIPT_PATH}`);
  console.log(`  WebDAV: ${WEBDAV_CONFIG.url} (用户: ${WEBDAV_CONFIG.username})`);
  console.log('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const polyfillCode = fs.readFileSync(POLYFILL_PATH, 'utf8');
  let scriptCode = fs.readFileSync(SCRIPT_PATH, 'utf8');
  scriptCode = scriptCode.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*\n?/, '');

  const { server, url: baseUrl } = await startLocalServer();
  console.log(`  🌐 本地渲染服务器: ${baseUrl}`);

  const timestamp = getTimestamp();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  console.log(`  🚀 Chromium 内核就绪，开始多端并发截图...\n`);
  console.log('  ----------------------------------------------------------');

  const tasks = selectedDevices
    .filter((key) => DEVICES[key])
    .map((key) => captureDevice(browser, baseUrl, key, DEVICES[key], timestamp, polyfillCode, scriptCode));

  const results = await Promise.all(tasks);

  console.log('  ----------------------------------------------------------');

  // 生成 AI 审查清单与 HTML 报告
  const manifestPath = generateAiManifest(timestamp, results, OUTPUT_DIR);
  const reportPath = generateReport(timestamp, results, OUTPUT_DIR, manifestPath);

  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;
  const totalScreenshots = fs.readdirSync(OUTPUT_DIR).filter(
    (f) => f.startsWith(`${timestamp}_${VERSION}_`) && f.endsWith('.png')
  ).length;

  console.log(`\n  📊 审查快照完成:`);
  console.log(`     ✅ 视口通过:   ${passed} / ${results.length}`);
  console.log(`     📸 生成截图:   ${totalScreenshots} 张`);
  console.log(`     📄 AI Manifest: ${manifestPath}`);
  console.log(`     🌐 视觉报告:   ${reportPath}`);
  console.log(`     📁 产物目录:   ${OUTPUT_DIR}\n`);

  await browser.close();
  server.close();

  if (shouldOpen) {
    const { exec } = require('child_process');
    exec(`open "${reportPath}"`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n❌ 审查流水线致命异常:', err);
  process.exit(1);
});
