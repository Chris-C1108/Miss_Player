# Phase 21: 安全加固、Safari 全端兼容与 CSS 重构收口计划

> 本文档基于 2026-11-12 全面项目体检生成，严格以 **Userscript（油猴沙箱 + 宿主共享 DOM）威胁模型** 与 **Safari / iOS Stay 全端兼容基线（Safari 14+ / iOS 16–18+）** 为约束准绳，避免照搬仅面向现代 Chrome/Firefox 网页应用的建议。  
> 返回演进主看板：[TODO.md](../../TODO.md) | 关联专项：[Phase 14 CSS 治理](./phase-14-css-refactor.md)

---

## 🧭 评估口径校准：为什么不能套用普通 Web App 标准

1. **油猴运行模型差异**：
   - 脚本拥有特权沙箱 API（`GM_xmlhttpRequest`、`GM_getValue`、`connect: *`），但渲染出来的 `<miss-player-root>` DOM 位于**宿主网页文档树**内；
   - 第三方爬取或 Supabase 回传的评论一旦触发 DOM XSS（如 `onerror=`、`javascript:`），虽不会直接读取隔离沙箱的 `GM_getValue`（开发代理产物 `miss_player.proxy.user.js` 除外），却能**在用户自动登录后的宿主站执行任意操作、窃取宿主站 Cookie，并在播放器 Shadow DOM 内伪造 WebDAV / Peach 配对钓鱼界面**；
   - 跨源视频嵌入 iframe（`avking` / `videocdn` / `plyr` 等动态镜像域名）与顶层通信时，`postMessage(..., '*')` 在多镜像场景下具有必要性，不可一刀切写死单一 Origin，但接收方必须按场景校验 `event.source`。
2. **油猴 CSS 死代码与静态分析误报**：
   - `scripts/audit-css.js` 历史报告中的“114 个死选择器 / 89 个 0 引用类名”包含大量误报（如模板字符串拼接 `tm-status-badge-${site.status}`、宿主页面穿透类名、跨文件复用类名 `tm-custom-modal-content`），**严禁按旧报告直接批量删 CSS**。
3. **Safari 兼容硬约束（拒绝 Google/Firefox 独占特性）**：
   - 本脚本重点覆盖 **iOS Safari（Stay / Userscripts）及 macOS Safari 14+**，以下通用 Web 建议经排查**不兼容或高风险，明确剔除**：
     - ❌ `Element.setHTML()`（Sanitizer API）：Safari 稳定版尚未支持，不可作安全主防线；
     - ❌ `interpolate-size: allow-keywords`：仅 Chrome/Edge 129+ 支持，Safari 与 Firefox 均不支持；
     - ❌ `<dialog closedby="any">`：`closedby` 为 Chrome 134+/Firefox 141+ 特性，Safari 不支持，且 `<dialog>` 本身不支持 Safari 14，在 Peach 宿主 `<dialog open>` Top Layer 内嵌套 `showModal()` 易触发 iOS 焦点与遮罩异常；
     - ❌ `Element.moveBefore()`：仅 Chrome 133+ 支持，Safari 不支持；
     - ❌ 无兜底依赖 `scheduler.yield()`：Safari 不支持，必须以特性检测 + `setTimeout(0)` 降级。

---

## 🛠️ 执行任务清单

### 21.1 油猴安全边界止血 (P0 — 高确定性，全浏览器零兼容风险)
- [x] **21.1.1 修复 `esc()` 引号属性逃逸 (`src/player/comments/CommentDataPipeline.js:40-44`)**
  - 改为显式 5 字符全量映射：`&`、`"`、`'`、`<`、`>`，纯 JS 实现且兼容 Node/浏览器。
- [x] **21.1.2 加固 `parseBBCode()` (`src/player/comments/CommentDataPipeline.js:995-1025`)**
  - `[url]` 经过 `sanitizeCommentUrl()` 处理，仅放行 `http:` 与 `https:` 协议，拦截 `javascript:` / `data:` / `//evil` 协议相对路径；
  - 生成的 `<a>` 补充 `rel="noopener noreferrer"`（防 WebKit `window.opener` 劫持）；
  - `[color=...]` 经过 `sanitizeCommentColor()` 校验安全色值（HEX / RGB / RGBA / 英文命名），阻断 `"` 引号闭合与 `;` 样式注入。
- [x] **21.1.3 修复 `renderCommentCard()` 未转义直拼 (`src/player/controls/CommentPanel.js:2728-2757`)**
  - 对 `c.user`、`c.score`、`c.time`、`c.id`、`c.spam.reason`、`c.spam.category` 全量套用 `esc()`；
  - 对 `c.userUrl` 经过 `sanitizeCommentUrl()` 协议校验并附加 `rel="noopener noreferrer"`。
- [x] **21.1.4 收紧跨帧 `postMessage` 接收校验 (`src/index.js:208-229`)**
  - 保留外发 `'*'` 兼容动态视频镜像，但在接收端为 `MP_IFRAME_EXPAND` / `MP_IFRAME_COLLAPSE` 严格校验 `event.source === findVideoIframeElement()?.contentWindow`，防止无关 iframe 恶意撑开播放器。
- [x] **21.1.5 补充单测回归 (`tests/xss-sanitization.test.mjs`)**
  - 覆盖 `[url=javascript:alert(1)]`、`[color=red" onmouseover="alert(1)]`、恶意 `c.user` / `c.userUrl`、属性逃逸载荷，全部通过并接入 CI。

### 21.2 Safari / iOS Stay 全端输入与渲染兼容 (P0/P1)
- [x] **21.2.1 全库 7 处 IME 输入法 Enter 误提交修复**
  - 在 `src/utils/dom.js` 新增并导出 `isImeConfirmEnter(event)`：`event.key === 'Enter' && !event.isComposing && event.keyCode !== 229`（精准规避 Safari WebKit bug 165004）；
  - 统一替换以下 7 处监听：
    - `src/player/controls/CommentComposer.js` (`255, 767, 1210, 1353`)
    - `src/player/managers/LoopManager.js` (`1197`)
    - `src/player/managers/MarkerBottomSheet.js` (`478`)
    - `src/player/managers/SettingsManager.js` (`1351`)
- [x] **21.2.2 ShadowRoot 暗色语义与减动效补齐 (Safari 10.1+ / 13+ 全支持)**
  - 在 `00_tokens/_tokens.css` 的 `:root, :host` 补充 `color-scheme: dark;`，确保 iOS/macOS Safari 原生滚动条与表单控件始终为深色模式；
  - 在 `01_core/_common.css` 增加 `@media (prefers-reduced-motion: reduce)` 规则，降低系统无障碍开启时的多余动画开销；
  - `UIManager.js` 采用模块级缓存单例 `CSSStyleSheet`，保留 Safari 14–16.3 `<style>` 降级。
- [ ] **21.2.3 渐进增强渲染与真机验证**
  - 评估在 `.jc-card` 启用 `content-visibility: auto; contain-intrinsic-block-size: auto 110px;`（需在 iOS Safari 真机验证滚动无闪烁跳动）；
  - 移动端真机联调验证。

### 21.3 Phase 14 CSS 架构治理续办与产物体积回落 (P1)
> 承接 [Phase 14 Step 2](./phase-14-css-refactor.md)，将 `dist/miss_player.user.js` 从 `1303 KiB` 压回 `1.0 MiB` 合规安全线。
- [x] **21.3.1 构建期 CSS 无损压缩（合规零风险）**
  - 保持 JS `minify: false` / `mangle: false` 不变，在 `vite.config.mjs` 启用 `cssMinify: true` 针对 `?inline` 导入剥离注释与多余空白，配合 Peach Base64 图片去重与 CSS 冗余精简。
- [x] **21.3.2 模块级 `CSSStyleSheet` 单例缓存 (`src/player/ui/UIManager.js:181`)**
  - 将 `new CSSStyleSheet(); sheet.replaceSync(playerStyles);` 提升为模块级单例缓存，避免每次重新打开播放器重复解析万行 CSS（保留 `<style>` 降级以兼容 Safari 14–16.3）。
- [x] **21.3.3 修正 `scripts/audit-css.js` 误报、清理死 CSS 与动静分离收口**
  - 升级静态审计脚本支持递归扫描全部 14 个 CSS 文件，自动识别 JS 动态模板类名前缀（如 `tm-status-badge-${...}`）与 `_host.css` 宿主压制白名单；
  - 合并 `_variables.css` 与 `00_tokens/_tokens.css` 重复变量，复用 `ICON_PEACH` 消除重复 Base64；
  - 逐一人工检索校验并清理 `_player.css`、`_controls.css`、`_comments.css`、`_settings_apple.css` 中确认 0 引用的废弃死选择器与 `@keyframes tmShake`（CSS 总量从 `10,766` 行降至 `9,415` 行，产物体积降至 `1273.25 KiB`）；
  - 将 `UIManager.js`、`SettingsManager.js` 静态 `style.display`/`style.opacity` 切换统一迁移为 `.is-hidden` 状态类；收敛 `FloatingButton.js:481` 魔法 `z-index: 2000000000` 至 `--z-host-player` 标尺。
- [ ] **21.3.4 大文件物理拆解与 1.0 MiB 体积压线收口**
  - 将 `_player.css`（2,296 行）、`_comments.css`（2,117 行）、`_controls.css`（1,218 行）按 4 层结构拆解为单文件 ≤ 800 行，进一步治理跨文件重复规则与 `!important`（当前 97 处，目标 `< 50`）；
  - 按用户选定的 Peach 图标优化方案（64×64 WebP 或 SVG）及冗余资源清理，将 `dist/miss_player.user.js` 压回 `1.0 MiB` 安全线内。

### 21.4 上帝类渐进解耦与打包债务清理 (P2)
- [ ] **21.4.1 核心大文件拆解**
  - 拆解 `CommentPanel.js`（3,438 行）为：`CommentStore`（多源状态与筛选）+ `CommentCardRenderer`（安全渲染）+ `CommentReportModal`；
  - 拆解 `UIManager.js`（2,017 行）中的 `visualViewport` 软键盘适配器与 Top-Layer 挂载管理。
- [ ] **21.4.2 单一打包源收敛与首屏按需守卫**
  - 评估移除冗余 `webpack.config.js`（将 Userscript 元数据抽为共享 JSON，避免双构建配置漂移）；
  - 评估在 `@match *://*/*` 场景下为 `AdBlocker` / `MediaSniffer` 增加非目标页快速短路选项（避免影响普通网页性能）。

---

## ✅ 验收门禁
1. `npm run ci:check` 100% 通过，`dist/miss_player.user.js` 体积回落至 **≤ 1.0 MiB**；
2. XSS 专项测试与 IME 组合输入单元测试全通；
3. iOS Safari（Stay / Userscripts）+ macOS Safari 真机验证：评论中文输入法回车不误发、评论长列表滚动无跳动、Shadow DOM 隔离与 Peach `<dialog>` Top-Layer 挂载正常。
