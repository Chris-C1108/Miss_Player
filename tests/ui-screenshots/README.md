# Miss Player 自动化 UI 截图审查系统 (Vision AI Ready)

本方案基于 **Playwright + GM API 模拟层 (Polyfill) + 多设备并发矩阵** 实现，专为 **AI 视觉审查 (Vision AI Review)** 与自动化前端防劣化设计。

---

## 🎯 核心设计目标

1. **零外部脚本管理器依赖**：无需用户预先安装 Tampermonkey/Violentmonkey 插件，通过轻量 `gm-polyfill.js` 在 Playwright 原生上下文中无感挂载油猴核心 API（`GM_getValue` / `GM_setValue` / `GM_xmlhttpRequest` 等）。
2. **多端并发与真实比例**：覆盖桌面超宽屏、标准 1080p、MacBook Retina、iPad 横竖屏、iPhone 单手竖屏与横屏全景等 7 种屏幕规格，多 Worker 并发运行，数十秒内完成全矩阵捕获。
3. **真实业务流程全状态快照**：
   - `1_fab`: 页面加载后的浮动呼吸光晕按钮态
   - `2_player`: 点击按钮唤醒 Shadow DOM 播放器主界面
   - `3_settings`: 打开 Apple 风格毛玻璃设置面板
   - `4_webdav`: 触发视口懒加载、展开 WebDAV 云同步卡片并回显预设配置
4. **命名规整与时间追溯**：
   - 规则：`yyyymmdd-hhmm_{version}_{device}_{step}.png`
   - 示例：`20261012-1507_5.7.0_iphone_portrait_2_player.png`
5. **AI 机器可读审查引导清单**：
   - 每次生成配套 `ai-review-manifest.json`，提供结构化设备分辨率、截图路径与 5 项细分 UI 审查目标（Apple HIG 毛玻璃、Safe Area 避让、文字溢出折行、WebDAV 配置回显、横竖屏自适应）。

---

## 📐 设备规格矩阵 (7 大视口)

| 设备 Key | 场景 / 命名 | 分辨率 (宽×高) | DPR | 触控 / 移动端 |
|---|---|---|---|---|
| `desktop_1080p` | 桌面标准 (16:9) | 1920 × 1080 | 1.0x | 否 |
| `desktop_ultrawide` | 桌面带鱼屏 (21:9) | 2560 × 1080 | 1.0x | 否 |
| `laptop_1440` | 笔记本 (MacBook 16:10) | 1440 × 900 | 2.0x | 否 |
| `ipad_landscape` | iPad 横屏 (4:3) | 1024 × 768 | 2.0x | 是 |
| `ipad_portrait` | iPad 竖屏 (3:4) | 768 × 1024 | 2.0x | 是 |
| `iphone_portrait` | iPhone 竖屏 (单手模式 9:19.5) | 390 × 844 | 3.0x | 是 |
| `iphone_landscape` | iPhone 横屏 (全屏观影 19.5:9) | 844 × 390 | 3.0x | 是 |

---

## 🚀 极速运行

```bash
# 全设备并发截图并生成报表
npm run test:screenshot

# 截图完成后自动在浏览器打开 HTML 可视化报告
npm run test:screenshot:open

# 仅测试指定设备
node tests/ui-screenshots/screenshot.js --devices=desktop_1080p,iphone_portrait
```

---

## ☁️ WebDAV 预注入配置规范

测试流程中自动在浏览器会话启动前注入用户配置的 WebDAV 凭据：
* **URL**: `https://dav.loadingi.fnos.net:443`
* **用户名**: `chen`
* **密码**: `Chen@2026`
* **路径**: `/backup_configs/MissPlayer/`

注入方式通过 `tests/ui-screenshots/gm-polyfill.js` 同步向 `mp_webdav_config` 聚合键及降级平铺键写入数据，确保 `SyncManager.getWebDavConfig()` 立即读取并在 UI 上显示“● 已配置”。

---

## 📂 目录结构与产物

```
tests/ui-screenshots/
├── gm-polyfill.js                 # 油猴 GM API 浏览器垫片
├── screenshot.js                  # Playwright 并发截图调度核心
├── README.md                      # 本说明文档
└── snapshots/                     # 产物目录 (已加入 .gitignore)
    ├── yyyymmdd-hhmm_5.7.0_ai-review-manifest.json   # AI 视觉审查引导清单
    ├── yyyymmdd-hhmm_5.7.0_report.html              # 可视化 HTML 聚合报告
    └── yyyymmdd-hhmm_5.7.0_{device}_{step}.png      # 各阶段高精度实景截图
```

---

## 🤖 AI 视觉审查 Checklist (AI Inspection Checklist)

当 AI 审查这些快照时，应重点逐项校验：
1. **[CHECK-01] 毛玻璃与背景层次**：容器背景是否具备 `backdrop-filter: blur(20px)`，是否存在死黑或高对比突兀色块。
2. **[CHECK-02] Safe Area 避让**：在 iPhone 竖屏 (`iphone_portrait`) 下，底部控件是否尊重 `env(safe-area-inset-bottom)`，未与系统 Home 条重合。
3. **[CHECK-03] 文字与胶囊排版**：标题、快进退档位 (`5s`~`10m`)、连播按钮文字无折行、无截断、无挤压。
4. **[CHECK-04] WebDAV 配置卡片**：云端同步手风琴展示“● 已配置 (绿色)”，展开后服务器地址与用户名正确渲染。
5. **[CHECK-05] 响应式布局**：超宽屏与桌面端控件停靠右下角；移动端横屏无控制条遮挡主体视窗。
