# Agent 开发与维护准则 (AGENTS.md)

本文档定义了 AI Agent 及开发者在维护与迭代 **Miss Player** 项目时必须严格遵守的架构规范、设计标准、发版流程及安全红线。

---

## 🚨 核心红线：Userscript 元信息与自动更新一致性

油猴类脚本管理器（Tampermonkey、Violentmonkey、ScriptCat、Safari Userscripts/Stay 等）依赖 Userscript Header 中的元数据对脚本进行全局唯一性识别与版本生命周期管理。**以下规则为绝对红线，严禁擅自破坏：**

### 1. 严禁修改 `@namespace`（命名空间）
* **固定值**：`loadingi.local`
* **原因**：脚本管理器以 **`(@namespace, @name)` 二元组** 作为脚本的唯一主键（Unique ID）。
* **破坏后果**：一旦修改 `@namespace`（例如改为 GitHub 链接或其他命名），旧版本的用户在后台执行定时自动更新检查时，将**无法将新版本匹配到已安装的脚本**，导致自动更新静默失效，或在手动点击安装时被识别为两个互不相关的脚本产生冲突。

### 2. 严禁随意修改 `@name`（主名称与各语言本地化名）
* **固定主名称**：`Miss Player | 影院模式 (单手播放器)`
* **多语言映射**：在 `webpack.config.js` 的 `i18n` 配置中已定义各语言名称（如 `en`, `zh-CN`, `zh-TW`, `ja`, `vi`），必须保持一致。
* **原因**：修改主脚本名称会导致分发平台（SleazyFork / GreasyFork）以及客户端管理器判定脚本标识发生漂移。

### 3. 发版版本号（Version Bump）三处同步规范
每次发布新版本时，必须且只能同步递增以下 3 处版本号：
1. `package.json` 中的 `"version"`
2. `webpack.config.js` 中的 `headers.version`
3. `src/telemetry/EventCollector.js` 中 `getScriptVersion()` 函数内的 fallback 版本字符串

### 4. 构建产物提交规范
* 修改代码或更新版本后，必须执行 `npm run build`，确保 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js` 同步生成并一并提交 Git。

---

## 🏗️ 架构与模块目录拓扑

Miss Player 遵循高内聚、单一职责的模块化设计体系：

### 1. 核心与生命周期
* **主入口**：`src/index.js` — 初始化全局模块与站点路由分发
* **播放器核心**：`src/player/CustomVideoPlayer.js` 与 `src/player/core/PlayerCore.js`
* **状态机**：`src/player/state/PlayerState.js` — 集中管理播放器状态、全屏/浮层模式及用户配置

### 2. 播放器管理器 (`src/player/managers/`)
* **UIManager**：模态与视窗 DOM 构建、横竖屏自适应
* **ControlManager**：播放控制栏、清晰度/倍速切换
* **ProgressManager**：进度条更新、时间格式化与精准 Seek
* **LoopManager**：A-B 点片段循环播放、切片打点与收藏
* **DragManager**：Minimap 缩略图平移拖拽与跟手手势
* **EventManager**：集中式事件委托与生命周期监听
* **SettingsManager**：用户设置模态框与偏好持久化

### 3. 增强功能模块
* **评论系统**：`src/player/controls/CommentPanel.js` 与 `CommentScraper.js`（多源异步抓取 Jable / JavDB / JavLibrary 评论、时间戳解析与一键跳转）
* **自动登录**：`src/autologin/`（多站点凭据管理、跨域 iframe 签名桥接）
* **广告拦截**：`src/adblock/`（DOM 净化与弹窗拦截）
* **数据遥测**：`src/telemetry/`（匿名设备指纹、会话聚合、隐私开关保护）

### 4. 共享支持层
* **工具库**：`src/utils/index.js`（`storage.js`, `http.js`, `modal.js`, `clipboard.js`, `device.js`, `time.js`, `dom.js`）
* **常量与配置**：`src/constants/domains.js`（多站点域名矩阵与可用性检测）、`i18n.js`（多语言字典）、`icons.js`（统一 SVG 矢量图标）

---

## 🎨 UI/UX 与交互规范 (Apple Design)

Miss Player 严格遵循 Apple 界面交互设计哲学，注重毛玻璃质感、跟手性、空间层次与单手可用性：

1. **毛玻璃与深度层级**：统一采用 `backdrop-filter: blur(20px)` 与半透明材质（`-apple-system` 风格），避免生硬的纯色遮罩。
2. **GPU 零重排流畅度**：所有位移与缩放手势交互（如 Minimap 缩略图拖拽）一律采用 `transform: translate3d()`，杜绝触发 DOM Reflow。
3. **单手操作至上**：核心控件（播放/暂停、快进/退、A-B 循环、清晰度切换）集中布局在屏幕下半部大拇指易触及区域。
4. **全屏与安全区适配**：全量适配 iOS Safari `env(safe-area-inset-bottom)` / `env(safe-area-inset-top)`，支持横竖屏自适应旋转。
5. **资产集中化**：禁止在业务组件内散落内联 SVG 字符串，所有图标必须集中在 `src/constants/icons.js`；所有面向用户的文案必须通过 `__('key')` 从 `src/constants/i18n.js` 读取。

---

## 🌐 网络请求、跨沙箱与防盗链规范

1. **特权跨域请求**：必须使用 `GM_xmlhttpRequest` 绕过宿主页面的 CORS 限制。
2. **跨沙箱 MSE 播放架构**：
   * `Hls.js` 运行在页面主 DOM 上下文，无缝挂载 `<video>` 标签（规避浏览器对 MSE 的沙箱隔离限制）；
   * 沙箱底层通过 `unsafeWindow.__mpBridge` 与 `GM_xmlhttpRequest` 下载二进制分片并生成 Blob URL 交付。
3. **防盗链与 Referer 控制**：
   * 请求 Google Drive / `lh3.googleusercontent.com` 等特殊 CDN 时，**严禁携带外部网站的 Referer 头**，避免触发 HTTP 429 频控限制。

---

## 💾 数据持久化与遥测规范

1. **存储降级规范**：
   * 统一使用 `src/utils/storage.js` 中的 `getValue`, `setValue`, `deleteValue`。
   * 优先调用 `GM_getValue`/`GM_setValue`，在纯浏览器环境自动降级至 `localStorage`（前缀 `mp_` 并兼容旧前缀 `missNoAD_`）。
2. **遥测开发规范 (Telemetry)**：
   * **隐私受控**：上报前必须先通过 `telemetry.isEnabled()` 校验用户设置中的隐私开关。
   * **频控聚合**：本地持久化缓存（1小时定期聚合批量上报），严禁在用户单次点击时触发高频网络请求。
   * **心跳防重**：`app_init` 心跳内置 6 小时本地去重机制。

---

## 🚀 开发与构建命令

* **开发监听构建**：`npm run dev`
* **生产发布打包**：`npm run build`（生成 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js`）
