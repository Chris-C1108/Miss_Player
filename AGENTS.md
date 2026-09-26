# Agent 开发与维护准则 (AGENTS.md)

本文档是 AI Agent 与开发者在维护、演进与重构 **Miss Player** 时必须严格遵守的**系统宪法与上下文路由中枢**。本文档确立的规则优先级高于临时对话推论与外部技能默认指导。任务进度与历史里程碑追踪详见 **[TODO.md](./TODO.md)**。

---

## 🧭 功能演进与准则动态对齐规范 (Alignment with AGENTS.md)

作为项目的系统宪法与上下文路由中枢，`AGENTS.md` 必须时刻准确映射项目的真实功能拓扑与技术方向：

1. **不一致性检测**：在日常开发与用户会话中，若发现用户的需求或指令涉及项目功能的**新增、删除、修改**，或**架构设计、数据管道、产品方向**的变化与当前 `AGENTS.md` 中的规范、拓扑或约束存在不一致，Agent 严禁静默处理或单方面脱离准则。
2. **主动告知与对齐**：Agent 必须在交互中**第一时间主动向用户指出差异点**，客观说明该变更与当前 `AGENTS.md` 约定的出入，并与用户确认最终的设计与演进方向。
3. **文档同步更新**：一旦与用户完成对齐确认，必须及时将变更后的功能规范、目录拓扑、存储管道或交互约定同步回写至 `AGENTS.md`，杜绝代码演进与系统准则脱节，确保上下文连续性。

---

## 🚨 核心红线：Userscript 元信息与自动更新一致性

油猴脚本管理器（Tampermonkey、Violentmonkey、ScriptCat、Safari Stay 等）依赖 Userscript Header 中的元数据对脚本进行全局唯一识别与版本生命周期管理。**以下规则为绝对红线，严禁破坏：**

### 1. 严禁修改 `@namespace`（命名空间）
* **固定值**：`loadingi.local`
* **原因**：脚本管理器以 **`(@namespace, @name)` 二元组** 作为脚本的全局唯一主键（Unique ID）。
* **破坏后果**：一旦修改 `@namespace`，旧版本用户在后台自动检查更新时将**无法匹配新版本**，导致静默失更，或安装为两个互不相关的冲突脚本。

### 2. 严禁随意修改 `@name`（主名称与各语言本地化名）
* **固定主名称**：`Miss Player | 影院模式 (单手播放器)`
* **多语言映射**：在 `webpack.config.js` 的 `i18n` 配置中已定义各语言名称（`en`, `zh-CN`, `zh-TW`, `ja`, `vi`），必须保持一致。
* **原因**：修改主脚本名称会导致分发平台（SleazyFork / GreasyFork）以及客户端管理器判定脚本标识发生漂移。

### 3. 发版版本号五处强同步规范 (5-Place Version Sync)
每次发布新版本时，必须且只能同步递增以下 **5 处**版本号，任何一处脱节都将被 `npm run ci:check` 强制阻断：
1. `package.json` 中的 `"version"`
2. `webpack.config.js` 中的 `headers.version`
3. `src/telemetry/EventCollector.js` 中 `getScriptVersion()` 函数内的 fallback 版本字符串
4. `src/sync/SyncManager.js` 中 fallback `SCRIPT_VERSION` 字符串
5. `src/services/SleazyForkService.js` 中 fallback `SCRIPT_VERSION` 字符串

### 4. 构建产物提交规范
* 修改代码或更新版本后，必须执行 `npm run build`，确保 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js` 同步生成并一并提交 Git。

---

## 🏗️ 架构与模块目录拓扑 (Context Router)

Miss Player 遵循高内聚、单一职责的微前端模块化设计：

### 1. 核心与生命周期
* **主入口**：`src/index.js` — 全局生命周期、iframe 环境安全守卫与站点路由分发
* **播放器核心**：`src/player/CustomVideoPlayer.js` 与 `src/player/core/PlayerCore.js` — 宿主 `<video>` 元素劫持、挂载与归还
* **状态机**：`src/player/state/PlayerState.js` — 集中管理播放器状态、全屏/浮层模式、Beta 特性开关及用户偏好

### 2. 播放器管理器 (`src/player/managers/`)
* **UIManager**：模态与视窗 DOM 构建、横竖屏自适应、`visualViewport` 移动端软键盘避让
* **ControlManager**：播放控制栏总装配、一体化居中播放胶囊挂载、清晰度与倍速调节
* **ProgressManager**：进度条更新、时间格式化与微秒级 Seek
* **LoopManager**：A-B 点片段循环、时间胶囊动态居中与莫兰迪随机色彩、URL 深链参数化装载
* **MarkerBottomSheet**：胶囊标签管理面板、60秒软删除撤销、多维语义标签选择、批量分享导出
* **DragManager**：Minimap 缩略图平移拖拽与跟手手势
* **EventManager**：集中式事件委托、快捷键绑定与全屏监听
* **SettingsManager**：Apple 风格设置面板、遥控器运行模式控制、Beta 实验室、WebDAV 配置

### 3. 增强业务功能
* **评论系统**：`src/player/controls/CommentPanel.js` 与 `CommentScraper.js`（多源异步抓取 Jable / JavDB / JavLibrary、时间戳解析、逆向倒数时间校准、单条问题上报）
* **疯狂采集引擎**：`src/player/comments/CrazyScraper.js`（宿主页面全量番号多页循环爬取、四级防重跳过）
* **多维语义标签库**：`src/player/managers/tagTaxonomy.js`（体位姿势、相貌身材、行为特征等系统化标签矩阵）
* **自动登录**：`src/autologin/`（多站点凭据管理、跨域 iframe 签名桥接）
* **广告拦截**：`src/adblock/`（DOM 净化与弹窗拦截）

### 4. 服务与数据通道 (`src/services/` & `src/sync/`)
* **Supabase 服务**：`src/services/SupabaseService.js` — 方案 1 高密度 JSONB 聚合仓储读取与服务端 RPC 原子合并
* **版本检测与更新**：`src/services/SleazyForkService.js` — 官方只读 JSON API 握手与语义化 Semver 版本比对
* **WebDAV 客户端**：`src/sync/WebDavClient.js` — 跨域原子文件落盘、PROPFIND 嗅探与目录逐级自愈
* **同步协调器**：`src/sync/SyncManager.js` — 分布式双向增量合并与墓碑垃圾回收 (GC)

### 5. 共享基础设施 (`src/utils/` & `src/constants/`)
* **工具库**：`src/utils/`（`storage.js`, `reactiveStore.js`, `indexedDB.js`, `videoCode.js`, `dom.js`, `md5.js`, `modal.js`, `clipboard.js`）
* **常量与字典**：`src/constants/domains.js`（站点活跃域名矩阵）、`i18n.js`（五国语言国际化字典）、`icons.js`（矢量 SVG 图标）

---

## 🎨 UI/UX 与交互规范 (Apple Design)

Miss Player 严格遵循 Apple 界面交互设计哲学，注重毛玻璃质感、跟手性、空间层次与单手可用性：

1. **毛玻璃与深度层级**：统一采用 `backdrop-filter: blur(20px) saturate(180%)` 与半透明材质（`-apple-system` 风格），避免生硬纯色。
2. **GPU 零重排流畅度**：所有位移与缩放手势交互（如 Minimap 拖拽）一律采用 `transform: translate3d()`，杜绝触发 DOM Reflow。
3. **一体化居中宽胶囊**：主控播放按键采用 92px 纯净 Apple 蓝描边宽胶囊，正常模式居中展示 SVG 图标，预览/重温模式直接显示文字，并在背景自左向右以半透粉红平滑推进倒计时进度条。
4. **单手操作至上**：核心控件（播放/暂停、快进/退、A-B 循环、清晰度切换）集中布局在屏幕下半部大拇指易触及区域。
5. **全屏与安全区适配**：全量适配 iOS Safari `env(safe-area-inset-bottom)`，监听 `visualViewport` 动态压缩视口避让软键盘。
6. **资产集中化**：禁止在业务组件内散落内联 SVG 字符串，所有图标必须集中在 `src/constants/icons.js`；所有面向用户的文案必须通过 `__('key')` 从 `src/constants/i18n.js` 读取。

---

## 🎬 视频播放与异步 Seeking 状态机准则

在维护视频跳转与连播逻辑时，必须严格遵守以下流媒体状态机模型：

1. **防异步 Seeking 闪跳锁**：
   - 在 HTML5 `<video>` 中设置 `currentTime = startTime` 是**异步解码跳转**；
   - 跳转时必须挂起 `this._isSeekingCapsule = true` 并监听 `seeked` 事件，在触发后额外留出 350ms 缓冲才释放锁；
   - 在 `timeupdate` 监听中，当 `this._isSeekingCapsule || video.seeking` 时**必须立即 return**，严禁用 `ct < startTime` 作为跳出判定，防止产生 1 秒连环闪跳雪崩。
2. **多层级视频物理时长提取漏斗**：
   - 不得盲目信任页面刚加载时的 `video.duration`（此时往往为 `NaN`，转整数会错漏为 0）；
   - 必须通过 `getVideoDurationSeconds()` 依次穿透：`video.duration` ➔ OpenGraph Meta 标头 ➔ 播放器 UI 文本 ➔ 页面详情面板文本；
   - 监听 `loadedmetadata` 事件，当视频真实时长就绪后，自动向 Supabase 追写更新 `duration_seconds`。
3. **失焦与后台播放白名单**：
   - 在 `BlurPlaybackManager` 中精准追踪用户手势真实交互，通过堆栈诊断拦截宿主外部脚本恶意偷停。

---

## 💾 多级数据存储架构与云端数据库规范

为在平台配额与浏览器限制下实现极高性能与海量存储，项目采用四级存储管道：

### 1. 严格读取优先级管道
`IndexedDB 本地极速读取` ➔ `Supabase 方案1云端聚合仓储` ➔ `WebDAV 番号独立文件` ➔ `源站 Provider 爬取`

### 2. 存储降级与零 GM 存储红线
* **零 GM 存储评论体红线**：严禁在 `GM_getValue` 中存储大体积评论文本，防止脚本管理器 SQLite 进程卡死；
* **轻量配置降级**：配置项使用 `src/utils/storage.js`，优先调用 `GM_getValue`/`GM_setValue`，纯浏览器降级至带 `mp_` 前缀的 `localStorage`；
* **本地高阶持久化**：评论与切片本地离线存储必须使用 `src/utils/indexedDB.js` 原生异步 `MissPlayerDB`。

### 3. Supabase 方案 1 高密度 JSONB 仓储规范
为了在 Supabase 500 MB 免费额度下支撑超 500 万条高频评论：
* **必须采用番号聚合模型 (`video_comments_bundle`)**：
  - 严禁倒退回“1行=1条评论”设计（单行模式索引膨胀占 160B/行，短文本无法压缩，60万条即爆仓锁定）；
  - 以 `avcode` 为全表唯一主键索引，消除 99% 的索引膨胀；
  - 评论集合并后突破 2 KB，自动触发 Postgres 底层 **TOAST LZ4/PGLZ 强力透明压缩**（压缩比 3:1 ~ 5:1），单条物理成本降至 60~90 字节；
* **服务端原子合并函数 (`upsert_comment_bundle`)**：
  - 必须通过服务端 RPC 进行集合去重与原子 UPSERT，杜绝并发覆盖；
  - 写入时携带 `duration_seconds` 物理时长字段，且服务端设置非零保护规则，防止被 0 覆盖。

### 4. WebDAV 独立文件拓扑规范
* **严禁单一大文件合并**：严禁将全量番号评论塞入单一全局大文件；
* **按番号独立存放**：每个番号全量评论独立写入 `/MissPlayer/comments/[AVCODE].json`，单次原子 `PUT` 极速落盘，各影片彻底解耦；
* **PROPFIND 415 避坑**：发送空 Body 的 PROPFIND 请求时，**严禁携带 `Content-Type: application/xml` 标头**；必须将 415 与 405、207 一并视为目录已就绪，防止多余发起 `MKCOL` 导致刷屏黄告警。

---

## 🕷️ 爬虫引擎与实体提取规范

1. **统一收敛至番号校验引擎**：
   - 严禁爬虫模块私自使用简单的通配正则提取页面番号；
   - 必须统一接入 `src/utils/videoCode.js` 的 `matchAvCodeFromText` 与 `isValidAvCode` 分层漏斗管道；
2. **技术、欧美厂牌与假阳性前缀黑名单熔断**：
   - 日系正规番号前缀字母长度收敛至 2~6 位 (`{2,6}`)，从正则底层彻底阻断 7 位及以上的英文长词；
   - `TECHNICAL_BLACKLIST` 必须覆盖全部 12 个英文月份（`JAN` ~ `DEC`）、通用技术参数（`FPS`, `MB`, `VOL`, `H264` 等）、欧美成人厂牌（`NAUGHTY`, `BRAZZERS`, `BLACKED`, `REALITY`, `TUSHYS`, `BANG` 等）以及高频英文系统词（`UPDATE`, `POST`, `VIDEO`, `ASIAN`, `HOT` 等），严防类似 `NAUGHTY-930`、`SEP-2026` 假阳性；
   - 约束 `DM-` 等非全网通用前缀首位数字为 1~9，并避免向未收录该厂牌的源站（如 Jable）发起盲目请求导致 404 循环刷屏；
3. **宿主页面候选链接深度清洗**：
   - 跨域与广告熔断：排除所有跳往第三方外域的广告联盟或统计链接，严禁跨域提取假番号；
   - 分类路由拦截：严格排除 `/tags/`, `/genres/`, `/categories/`, `/makers/`, `/actresses/`, `/series/` 等非视频路由分段；
   - 结构上下文判定：兜底文本提取仅允许在包含封面图或处于视频卡片容器内的链接上生效；
4. **四级防重必选**：
   - 在向源站发起爬虫请求前，必须依次校验内存会话、IndexedDB、Supabase 及 WebDAV，**已收录的番号严禁重复抓取**。

---

## 🧪 Beta 模式与新特性治理规范 (Beta Feature Flag Governance)

为了保障生产环境稳定性与用户体验连续性，**即日起所有新功能、实验性特性或高阶能力必须严格受控于「Beta 模式」开关**：

1. **新功能准入原则 (Default Off in Beta)**：
   - 任何新增功能模块、实验性交互、多级网络抓取、外部数据库对接等能力，在初始开发与测试阶段，**必须挂载在设置菜单的「Beta 实验室」独立分段内**；
   - 所有 Beta 新功能默认必须保持为**关闭状态（Default OFF）**，由用户主动选择开启；
   - 核心代码执行逻辑中必须先行校验 Beta 开关（如 `playerState.settings.betaMode && playerState.settings.betaFeatureX`），未开启时完全走原有稳定链路。

2. **特性转正与剥离标准 (Promote to Stable)**：
   - 只有在 Beta 模式下经过至少 1 个完整版本周期的真机验证、异常与边界问题彻底闭环、且未收到任何致命缺陷反馈后，经评估方可从 Beta 实验室中“转正”；
   - 转正后的功能移入设置菜单对应的正式常规分段（如遥控器运行模式），或作为播放器默认行为启用。

---

## ⚖️ 平台合规与分发红线 (GreasyFork & SleazyFork Rules)

所有代码编写、模块设计、依赖引入与版本发布，必须无条件遵从根目录的 **[GreasyFork&sleazyfork_rules.md](./GreasyFork&sleazyfork_rules.md)** 规范。开发过程中必须严格落实以下红线约束：

1. **绝对禁止隐瞒负面功能 (Zero Undisclosed Antifeatures)**：
   - 脚本必须保持 100% 纯本地运行，严禁加入任何用户行为监听、视频历史收集、设备指纹抓取或私有分析接口回传；
   - 严禁在元信息 `@connect` 中声明未经披露或不必要的私有收集端点。
2. **严禁代码混淆与压缩 (No Obfuscation / No Mangling)**：
   - `webpack.config.js` 与 Vite 打包必须永久保持 `mangle: false`，确保编译后变量名与函数名清晰透明、完全可审计；
   - Babel 编译目标必须锁定为现代浏览器（Chrome 90+ / Safari 14+），严禁降级到古老的 ES5，避免引入携带单字母变量的冗余辅助垫片。
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
   - 重点记录平台合规红线教训、构建语法陷阱、Shadow DOM 隔离边界及异步调试经验。
3. **两份文档强关联与时间戳一致性**：
   - `yyyy-mm-dd-hhmm` 统一采用当前系统的精确本地时间戳（如 `2026-09-24-1838`）；
   - 生成后同步提交 Git 仓库进行版本受控。
4. **技能库自我成长与沉淀机制 (Skill Self-Evolution Protocol)**：
   - 自动定位本地全局技能库目录：`C:\Users\chenahao\.agents\skills\modern-userscript`；
   - 将提炼出的架构设计哲学、合规红线约束与开箱即用的标准实现模板同步更新至技能的 `SKILL.md` 与 `references/` 对应专题目次；
   - 确保沉淀的内容高度通用化、解耦具体业务逻辑，使未来所有基于 `$modern-userscript` 规范的油猴项目均可直接受益。

---

## 🚀 开发与构建命令

* **开发监听构建**：`npm run dev`
* **生产发布打包**：`npm run build`（生成 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js`）
* **自动化门禁质检**：`npm run ci:check`（版本五处强同步核验、打包、体积审计、合规 Lint、SleazyFork 测试与沙箱启动验证）
