# Agent 开发与维护准则 (AGENTS.md)

本文档定义了 AI Agent 及开发者在维护与迭代 **Miss Player** 项目时必须严格遵守的架构规范、设计标准、发版流程及安全红线。现代化微前端演进路线与任务进度追踪详见 **[TODO.md](./TODO.md)**。

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

## 🧪 Beta 模式与新特性治理规范 (Beta Feature Flag Governance)

为了保障生产环境稳定性与用户体验连续性，**即日起所有新功能、实验性特性或高阶能力必须严格受控于「Beta 模式」开关**：

1. **新功能准入原则 (Default Off in Beta)**：
   - 任何新增功能模块、实验性交互、多级网络抓取、外部数据库对接等能力，在初始开发与测试阶段，**必须挂载在设置菜单的「Beta 实验室」独立分段内**；
   - 所有 Beta 新功能默认必须保持为**关闭状态（Default OFF）**，由用户主动选择开启；
   - 核心代码执行逻辑中必须先行校验 Beta 总开关及对应子功能开关（如 `playerState.settings.betaMode && playerState.settings.betaFeatureX`），未开启时完全走原有稳定链路。

2. **特性转正与剥离标准 (Promote to Stable)**：
   - 只有在 Beta 模式下经过至少 1 个完整版本周期的真机验证、异常与边界问题彻底闭环、且未收到任何致命缺陷反馈后，经评估方可从 Beta 实验室中“转正”；
   - 转正后的功能移入设置菜单对应的正式常规分段，或作为播放器默认行为启用。

---

## ⚖️ 平台合规与分发红线 (GreasyFork & SleazyFork Rules)

所有代码编写、模块设计、依赖引入与版本发布，必须无条件遵从根目录的 **[GreasyFork&sleazyfork_rules.md](./GreasyFork&sleazyfork_rules.md)** 规范。开发过程中必须严格落实以下红线约束：

1. **绝对禁止隐瞒负面功能 (Zero Undisclosed Antifeatures)**：
   - 脚本必须保持 100% 纯本地运行，严禁加入任何用户行为监听、视频历史收集、设备指纹抓取或私有分析接口回传；
   - 严禁在元信息 @connect 中声明未经披露或不必要的私有收集端点。

2. **严禁代码混淆与压缩 (No Obfuscation / No Mangling)**：
   - webpack.config.js 中的 Terser 插件必须永久保持 mangle: false，确保编译后变量名与函数名清晰透明、完全可审计；
   - Babel 编译目标必须锁定为现代浏览器（Chrome 90+ / Safari 14+），严禁降级到古老的 ES5，避免引入携带单字母变量（a, e, r, t, o）的冗余辅助垫片（如 _classCallCheck、_typeof）。

3. **单文件体积限制 (2.0 MB Hard Limit)**：
   - 平台硬性限制单脚本体积不可超过 2.0 MB，本项目构建体积安全线控制在 1.0 MB 以内。

4. **合规审计与危机应对纪律**：
   - 收到平台举报或问询时，必须严格遵守“**代码先行修复上线 -> 携带 Commit 实证客观回复申诉**”的 SOP 流程，严禁辩解推脱，严禁私自重新发布已被下架的脚本。

---

## 🔄 会话交接与知识沉淀工作流 (Handoff & Lesson Workflow)

当会话结束、阶段性里程碑达成或需要跨 Agent 交接工作时，**必须执行以下标准化沉淀工作流**，严禁仅将信息停留在会话对话中：

1. **交接文档归档 (Handoff)**：
   - 必须生成完整的交接文档并写入：`002.devlog/yyyy-mm-dd-hhmm-handoff.md`；
   - 记录当前稳定版本号、Git Commit、已完成的核心成果拓扑、关键文件变动及下一阶段（For Next Session）任务清单；
   - 标明推荐后续 Agent 调用的关键 Skills 清单。

2. **经验教训沉淀 (Lesson Learned)**：
   - 必须将本阶段排查出的致命 Bug、隐藏陷阱、反模式及技术解决方案同步写入：`002.devlog/yyyy-mm-dd-hhmm-lesson.md`；
   - 重点记录平台合规红线教训、构建语法陷阱（如严格模式无分号 ASI、域名匹配规则）、Shadow DOM 隔离边界及异步调试经验。

3. **两份文档强关联与时间戳一致性**：
   - `yyyy-mm-dd-hhmm` 统一采用当前系统的精确本地时间戳（如 `2026-09-20-0025`）；
   - 生成后同步提交 Git 仓库进行版本受控。

4. **技能库自我成长与沉淀机制 (Skill Self-Evolution Protocol)**：
   - **核心目的**：让 AI Agent 在实战攻坚与架构探索中建立的方法论不仅停留在单个项目内，更能持续反哺通用技能库，实现 Skills 的自主成长与终身进化（Skills Self-Growth）；
   - **触发条件**：当在本项目中攻克了复杂技术难题、建立或实践了可用于通用油猴脚本中的方案最佳实践时（例如：Shadow DOM 隔离方案、Proxy 底层网络嗅探、响应式 Store、IndexedDB 高阶离线存储、WebDAV 双向分布式增量合并与墓碑 GC、SleazyFork/GreasyFork 只读 JSON API 自更检测与 Prefilled 表单预填发版）；
   - **执行规范**：
     1. 自动定位本地全局技能库目录：`C:\Users\chenahao\.agents\skills\modern-userscript`；
     2. 将提炼出的架构设计哲学、合规红线约束与开箱即用的标准实现模板同步更新至技能的 `SKILL.md` 与 `references/` 对应专题目次；
     3. 确保沉淀的内容高度通用化、解耦具体业务逻辑，使未来所有基于 `$modern-userscript` 规范的油猴项目均可直接受益并复用最佳实践。

## 🚀 开发与构建命令

* **开发监听构建**：`npm run dev`
* **生产发布打包**：`npm run build`（生成 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js`）
