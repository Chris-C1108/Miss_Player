# Agent 开发与维护准则 (AGENTS.md)

本文档定义了 AI Agent 及开发者在维护与迭代 **Miss Player** 项目时必须严格遵守的架构规范、发版流程及安全红线。

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

## 🛠️ 项目架构与技术规范

### 1. 核心技术栈
* **构建系统**：Webpack 5 + Babel + Terser + PostCSS + webpack-userscript
* **跨域与特权 API**：`GM_xmlhttpRequest`, `GM_setValue`, `GM_getValue`, `GM_setClipboard`, `GM_notification`
* **视频播放引擎**：Hls.js (MSE) + 原生 `<video>` 元素

### 2. 遥测与数据隐私 (Telemetry)
* **隐私开关**：所有遥测上报均受用户设置中的隐私开关 (`telemetryEnabled`) 控制，必须通过 `telemetry.isEnabled()` 校验。
* **上报频次控制**：本地持久化缓存（1小时定期聚合批量上报），严禁在用户每次点击时触发高频网络请求。
* **防重策略**：`app_init` 心跳内置 6 小时本地去重机制。

### 3. 跨站点适配与防盗链原则
* 请求 Google Drive / `lh3.googleusercontent.com` 等特殊 CDN 时，严禁携带外部网站的 `Referer` 头。
* iframe 跨域通信使用 `unsafeWindow.__mpBridge` 与 `GM_xmlhttpRequest` 进行二进制安全桥接。
