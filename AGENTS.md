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

### 3. 发版版本号五处强同步规范 (5-Place Version Sync) 与自动递增
每次发布新版本或向 GitHub 推送测试更新时，必须且只能同步递增以下 **5 处**版本号，任何一处脱节都将被 `npm run ci:check` 强制阻断：
1. `package.json` 中的 `"version"`
2. `webpack.config.js` 中的 `headers.version`
3. `src/telemetry/EventCollector.js` 中 `getScriptVersion()` 函数内的 fallback 版本字符串
4. `src/sync/SyncManager.js` 中 fallback `SCRIPT_VERSION` 字符串
5. `src/services/SleazyForkService.js` 中 fallback `SCRIPT_VERSION` 字符串
* **自动化推荐**：严禁手动逐个文件修改版本号，必须使用 `npm run bump` 执行原子自增（默认递增 +0.0.1 Patch 版本），或 `npm run bump -- <版本号>` 指定版本，确保 5 处强一致。

### 4. 构建产物提交规范
* 修改代码或更新版本后，必须执行 `npm run build`，确保 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js` 同步生成并一并提交 Git。

### 5. GitHub 直链元数据与 Raw URL 规范 (@downloadURL & @updateURL)
脚本元数据头必须永久声明指向 GitHub 仓库 main 分支的 Raw 资源直链：
* **固定直链值**：
  - `// @downloadURL https://raw.githubusercontent.com/Chris-C1108/Miss_Player/main/dist/miss_player.user.js`
  - `// @updateURL   https://raw.githubusercontent.com/Chris-C1108/Miss_Player/main/dist/miss_player.meta.js`
* **严禁包含空格或使用 Web 前端路径 (CRITICAL)**：
  - FORBIDDEN: `https://github.com/.../tree/main/...` 或 `blob/main/...` 或 URL 中携带空格 ➔ 此类路径返回的是 GitHub 的 HTML 网页，油猴管理器拉取时会因语法错误解析失败而中断更新。
  - USE: 必须使用 `raw.githubusercontent.com/...` 纯文本直链，保证油猴管理器能轻量读取 `meta.js` 检查版本，并在版本更新时拉取 `user.js`。

### 6. 独立 release 分支双轨发版协议与绝不切换默认分支红线 (Isolated Release Branch Protocol)
本项目采用“**GitHub main 主干滚动测试 + 远程 release 独立分支驱动 SleazyFork 正式发版**”的双轨架构：
* **双分支拓扑模型**：
  - `main` 分支：**项目唯一的全局默认分支 (Default Branch)**，也是本地工作区常驻开发分支。日常开发、快速迭代与测试更新均在 `main` 上执行，推送到 `origin main`。从 GitHub 安装测试版的用户油猴内通过 `@updateURL` 直接从 main 接收热更新；
  - `release` 分支：**生产正式发版专有分支，远程独立存在**。SleazyFork 后台设置为监听该分支的 Webhook：
    `https://raw.githubusercontent.com/Chris-C1108/Miss_Player/release/dist/miss_player.user.js`
* **绝对红线：严禁切换默认分支 (Never Switch Default Branch)**：
  - 本地与远程的默认分支必须**永久保持为 `main`**！
  - **严禁在本地执行 `git checkout release`** 或将工作区指向其他分支；
  - 必须使用原子映射推送指令：`git push origin main:release`，直接将本地经过验证的 `main` 分支代码同步至远程 `release` 分支，本地零切换、无污染！
* **用户发版意图自动化执行规则 (Trigger Word: "发版")**：
  - **只要用户在对话中指示“发版”（无论是否携带具体版本号），Agent 必须且只需按照以下 7 步标准 SOP 全自动化执行**：
    1. **门禁质检**：执行 `npm run ci:check`，确保全部自动化单元测试与合规门禁 100% 通过；
    2. **版本自增（若需要）**：执行 `npm run bump`（Patch +0.0.1）或按用户指定版本强同步 5 处；
    3. **构建产物**：执行 `npm run build`，确保 `dist/` 产物最新且无未提交修改；
    4. **提交并推送 main**：`git add . && git commit -m "..." && git push origin main`；
    5. **无缝镜像同步至 release 分支（绝不切换分支）**：执行 `git push origin main:release`，瞬间触发 SleazyFork Webhook 自动抓取上线；
    6. **创建 GitHub Tag 与 Release**：执行 `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z && gh release create vX.Y.Z dist/miss_player.user.js dist/miss_player.meta.js ...`；
    7. **确认状态**：确认工作区 clean，当前分支保持为 `main`。

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
* **SingleHandManager**：竖屏单手操控模式管理器、侧边辅助条 (Utility Gutter) 挂载、左右手镜像与全宽还原状态机

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
3. **一体化居中宽胶囊**：主控播放按键采用 92px 纯净 Apple 蓝描边宽胶囊，正常播放模式居中展示 SVG 图标，快览/连播模式直接显示紧凑文字（“快览” / “连播”），并在背景自左向右以半透粉红平滑推进倒计时进度条。
4. **单手操作至上**：核心控件（播放/暂停、快进/退、A-B 循环、清晰度切换）集中布局在屏幕下半部大拇指易触及区域。
5. **全屏与安全区适配**：全量适配 iOS Safari `env(safe-area-inset-bottom)`，监听 `visualViewport` 动态压缩视口避让软键盘。
6. **资产集中化**：禁止在业务组件内散落内联 SVG 字符串，所有图标必须集中在 `src/constants/icons.js`；所有面向用户的文案必须通过 `__('key')` 从 `src/constants/i18n.js` 读取。
7. **苹果人本化文案哲学 (HIG & Don't Make Me Think)**：
   - 彻底去技术黑话（严禁在面向用户界面出现“时序纠正”、“语料预热”、“微秒滑块”、“REST API”等内部概念）；
   - 功能名称严格收敛至 **2–4 字**；辅助说明精炼在 **20 字以内**直击给用户带来的核心收益；
   - 核心心智定稿对齐：面向用户统称“高光 / 高光片段”（消除胶囊理解门槛）、“转为正序 / 显示倒数”（直接陈述操作结果）、“快览 / 正常 / 连播”（以强动词驱动心智）。
8. **移动端竖屏「双态视口自适应机」(Adaptive Portrait Viewport)**：
   - 用户触摸/滑动评论区专注阅读时（`hideControls`），视频区域自动平滑收缩至天然物理宽高比（`naturalHeight`），最大化释放评论滚动空间；
   - 呼出控制面板（`showControls`）时，高度通过 Apple 物理阻尼曲线（`0.28s cubic-bezier(0.16, 1, 0.3, 1)`）平滑恢复为用户拖拽调整或默认的展开高度；
   - 竖屏展示评论区时，**顶部顶栏（标题、返回箭头与设置按键）始终常驻显示**，绝对不可随控制面板收缩隐藏。
9. **移动端评论发表 FAB 架构 (Floating Action Button)**：
   - 评论区底部严禁常驻占用整行的静态输入条，评论列表直通安全区底部以释放最大滚动可视面积；
   - 默认状态下右下角悬浮 42px 纯圆实色发评按钮（`.tm-comment-fab-btn`）；
   - 点击 FAB 触发底部半透明遮罩与毛玻璃抽屉输入底栏滑出并自动聚焦输入框，调起软键盘；发送完成或点击遮罩/关闭/ESC 后自动收起；
   - 联动 `visualViewport` 实现 iOS 软键盘动态避让推起。
10. **浮动圆钮统一实色化与握持偏好横向调度 (Solid Material & Hand Preference)**：
    - 悬浮发评圆钮与竖屏控制栏唤醒圆钮采用**统一实色极夜深空黑（`#1e2025`）**，严禁使用半透明背景，杜绝底层滚动内容穿透产生视觉杂质；
    - 唤醒控制栏圆钮仅在移动端竖屏且控制栏隐藏时展示，**桌面端（横屏或 PC 大屏）坚决隐藏（`display: none !important;`）**；
    - 所有浮动圆钮依据用户左右手握持偏好自动左右镜像对齐（右手靠右 `right: 16px`，左手靠左 `left: 16px`）。
11. **对称几何美学与微排版 (Symmetric Geometry & Micro-Typography)**：
    - 左右对称控件（如左侧静音键与右侧倍速键）必须保持外框绝对正圆（40px × 40px）；
    - 倍速文字（如 `1.0x`, `1.5x`）严禁降低字号，必须保持 13px 加粗（`700`），并通过微负字距（`letter-spacing: -0.6px`）实现正圆内切居中。
12. **高光操作工具圆角矩形非对称分工 (Twin-Action Tool)**：
    - 右侧高光操作组采用高度 38px、`border-radius: 8px` 的圆角矩形，在形状语义上与左侧全圆角（`9999px`）切片数据胶囊严格区分；
    - 遵循菲茨定律，面积采用非对称分配：高频打点按键（`+`）分配 60% 大靶心，低频列表管理（`☰`）分配 40% 紧凑入口。
13. **切片时序混排与色彩持久性架构闭环 (Color Permanence & Chronological Slices)**：
    - 新建草稿胶囊必须按其物理开始时间戳在胶囊序列中即时混排插入，彻底消灭“打点在末尾，保存后突然瞬移回前面”的严重画面跳跃闪变；
    - 实体色彩唯一权威：切片颜色必须以 `tab.color` 为绝对持久属性，严禁倒退为基于数组索引动态计算；
    - 草稿打点瞬间通过智能相邻避让算法分配专属莫兰迪色，打点态与保存态色彩完全同源，全列表零色彩漂移。
14. **动效坐标单一轴向约束与媒体查询绝对隔离 (Single-Axis Pure Motion)**：
    - 控制面板显隐动效严禁出现 X/Y 轴斜向复合飞入；居中悬浮模式 X 轴锁死 `-50%`，仅纯垂直 20px 微沉降与微缩放；
    - 移动端竖屏底板锁定 `transform: none`，显隐 100% 委托外层底板纯垂直 Y 轴直起直落；
    - 带有横向偏移的规则必须严格收拢在大屏/横屏媒体查询内，绝不污染手机竖屏。
15. **Shadow DOM 跨边界事件穿透检测规范 (ComposedPath Event Piercing)**：
    - 在宿主 `document` 或顶级容器上监听交互时，严禁直接使用会被 Shadow DOM 隔离重定向为 `<miss-player-root>` 的 `e.target.closest()`；
    - 必须通过 `e.composedPath()` 遍历真实事件完整路径，防止误退编辑态。
16. **异步微前端容器固定插槽保序架构 (Order-Preserved Slots)**：
    - 严禁混合使用同步与异步 `appendChild` 直接追加主容器子节点；
    - 必须预先在 DOM 中建立物理顺序绝对锁定的专属 Slot 插槽，所有分段定向装填至专属插槽内，彻底杜绝顺位错位。

---

## 💅 CSS 架构与样式治理准则 (CSS Governance & Architecture)

Miss Player 运行于复杂的多域名第三方宿主环境（Jable、MissAV、JavDB 等），必须在 SleazyFork/GreasyFork 单文件无混淆（`mangle: false`）、体积 1.0MB 安全线及 Shadow DOM 隔离的强约束下运行。所有样式开发与重构必须严格遵守以下法则：

### 1. 核心技术红线与禁令 (Blacklist & Mandates)
* **严禁引入 Tailwind CSS 及外部大型原子化框架**：
  - 严禁引入 Tailwind 等构建链及通用原子类（如 `.flex`, `.text-sm`），防止宿主页面非 Shadow DOM 元素产生灾难性样式污染；
  - 严格保持 100% 原生现代 CSS + CSS 自定义属性（Tokens）体系，杜绝打包体积膨胀。
* **严禁 HTML 模板字符串内联样式**：
  - 严禁在 JS 模版字符串中编写 `style="..."` 行内样式；所有视觉表现必须通过语义化类名由 CSS 文件统一声明。
* **严格治理 `!important` 滥用**：
  - 播放器主体已受 `<miss-player-root>` Shadow DOM 物理隔离保护，宿主样式无法穿透，内部组件严禁滥用 `!important` 争夺特异度；
  - 只有用于最高优先级全局可见性切换的状态类（如 `.is-hidden { display: none !important; }`）才允许使用 `!important`，其余场景一律通过正确的媒体查询与选择器层级管理。
* **统一 Z-Index 标尺系统，消灭魔法数字**：
  - 严禁随意书写 `z-index: 2000000000` 或 `9999` 等无序魔法数字；
  - 所有层级必须统一引用 `--z-*` 标尺（10~60 级）：
    `--z-player-base: 10;` ➔ `--z-controls: 20;` ➔ `--z-sidebar: 30;` ➔ `--z-popover: 40;` ➔ `--z-modal: 50;` ➔ `--z-toast: 60;`。
* **严禁向 `document.body` 挂载无样式的裸 DOM 节点（Shadow DOM 挂载隔离红线）**：
  - Miss Player 内部所有组件样式（除了 `<3KB` 的 `_host.css`）全部作用域封装在 `<miss-player-root>` 的 `ShadowRoot` 内部；
  - 新增组件（如 `DebugLogPanel`、弹窗、气泡提示等）必须挂载在 `playerContainer` 或 `shadowRoot` 内部，严禁直接 `document.body.appendChild(container)`；
  - 若特殊场景必须脱离 Shadow DOM 挂载至宿主 `document.body`，该组件必须自包含内嵌 `<style>` 标签或注入宿主轨，绝不允许裸节点运行。
* **第三方脚本高 Z-Index 浮动挂件生命周期声明式压制 (Third-Party Widget Suppression)**：
  - 针对宿主页面上其他第三方油猴脚本（如 Peach JAV 入库 `#peach-jav-action` 等）设置理论最大值 `z-index: 2147483647` 破坏界面的行为，严禁盲目通过提升自身 Z-Index 争抢；
  - 必须利用 Miss Player 的生命周期状态（`body.tm-player-active`），在宿主轨 `_host.css` 中声明 `display: none !important;` 进行无感隐形隔离；退出播放器时瞬间原样恢复，实现零破坏良性共存。
* **严禁在滚动容器中遗留历史死留白 (Zombie Padding Elimination)**：
  - 横向 Flex 滚动容器（如 `tm-tab-scroll-container`）内严禁使用历史遗留的大内边距（如 `padding-right: 44px`）替代布局间距，必须结合 `flex: 1` 和轻量呼吸边距释放最大可视面积。
* **全宽容器盒模型强制闭合约束 (Box-Sizing Enforcement)**：
  - 凡在组件样式中声明 `width: 100%` 并带有 `padding` 或 `border` 时，必须强制声明 `box-sizing: border-box; max-width: 100%;`，严禁依赖默认 `content-box` 导致实际物理宽度（`100% + padding*2`）撑爆父容器产生横向溢出与左右晃动。
* **纵向滚动容器手势硬约束与防击穿 (Touch Action Pan-Y & Overflow-X Lock)**：
  - 所有垂直滚动区域（如评论列表、骨架屏、状态盒）必须显式声明 `touch-action: pan-y; overflow-x: hidden; overscroll-behavior-x: none;`；Loading 骨架屏必须具备 `pointer-events: auto`，严禁触控穿透至底层宿主页面引发横向位移与橡皮筋晃动。
* **浮层组件事件全生命周期硬隔离 (Overlay Event Boundary Guard)**：
  - 所有绝对/固定定位的浮层组件（如预览浮窗、气泡提示、模态框）必须在根节点上彻底阻断所有指针事件冒泡（`pointerdown`, `touchstart`, `click`），且外部视频与控制层监听必须将其加入排除白名单，严禁点击被底层机制消费导致误唤醒控制栏。

### 2. JS 样式动静分离契约 (Dynamic vs Static Styles Contract)
在操作 DOM 样式时，必须严格区分“真动态数学逻辑”与“伪动态表现逻辑”：
* 🔴 **坚决禁止：JS 直接修改静态表现属性（伪动态）**
  - 禁止在 JS 中通过 `el.style.display = 'flex'`、`el.style.position = 'absolute'`、`el.style.opacity = '0.7'` 等操控布局或状态；
  - 必须统一封装为 CSS 状态类，通过 `el.classList.add('is-active')`、`el.classList.toggle('is-collapsed')` 进行声明式调度。
* 🔴 **坚决禁止：状态类吸附停靠时遗留行内绝对坐标 (Docked State Isolation)**
  - FORBIDDEN: 在 JS 拖拽组件进入状态类吸附停靠（如 `tm-controls-docked-*`）后，继续保留 DOM 上的行内定位样式（`style.left`, `style.top`） -> USE: 进入状态类调度时立即清空所有行内绝对坐标（置为空字符串），让 CSS 规则原生接管。
* 🟢 **严格规范：连续数学计算与响应式注入（真动态）**
  - 进度条/滑块物理位移：允许使用 `progressBar.style.transform = 'scaleX(...)'`；
  - 手势与 Minimap 拖拽：必须使用 `el.style.transform = 'translate3d(x, y, 0)'`（GPU 加速，杜绝 Reflow）；
  - 动态时间点百分比定位：允许使用 `marker.style.left = `${percent}%``；
  - 响应式环境上下文注入：允许使用 `root.style.setProperty('--keyboard-height', `${h}px`)`。

### 3. 宿主与 Shadow DOM 双轨分层拓扑 (Two-Track Style Topology)
杜绝全量 CSS 双重解析浪费（原 7,700 行 CSS 同时塞入宿主 `<head>` 与 Shadow DOM）：
* **宿主轨 (`_host.css` / 极轻量)**：
  - 仅包含脱离 Shadow DOM 挂载在 `document.body` 上的浮动唤醒按钮样式、全屏时宿主滚动条隐藏补丁；
  - 严格限制在 3 KB 以内，彻底阻断对第三方宿主网站的全局样式污染。
* **Shadow 轨 (`shadow.css` / 播放器全量样式)**：
  - 播放器所有控制条、评论面板、高光切片底栏、设置卡片等复杂 UI 样式，统一注入 `<miss-player-root>` 的 `ShadowRoot`（优先采用 `CSSStyleSheet` + `adoptedStyleSheets`，降级为内部 `<style>` 标签）；
  - 内部样式享有天然作用域隔离。

### 4. 样式目录拓扑与模块规划 (Styles Topology)
解构原 3000 行 `_player.css` 巨石文件，按单一职责清晰划分为四层结构：
```
src/player/ui/styles/
├── 00_tokens/           # 设计令牌层：基础颜色、Apple 毛玻璃材质、Z-Index 标尺
│   ├── _tokens.css
│   └── _zindex.css
├── 01_core/             # 核心基础层：视窗容器、布局骨架、动画关键帧
│   ├── _host.css        # 宿主极轻量样式 (<3KB)
│   ├── _layout.css      # 播放器视窗容器、全屏遮罩与 Safe Area 适配
│   └── _common.css      # 统一 Keyframes 动画、通用排版微类
├── 02_components/       # 业务组件层 (解构巨石，高内聚拆分)
│   ├── _controls.css    # 一体化居中播放胶囊、快进退、音量、进度条
│   ├── _comments.css    # 评论面板、评论卡片、抓取器状态、过滤栏
│   ├── _marker_sheet.css# A-B 点高光片段底栏 (MarkerBottomSheet)
│   └── _settings_apple.css # Apple 风格设置卡片、开关、分段选择器
└── 03_responsive/       # 响应式与模式适配层
    ├── _landscape.css   # PC 桌面端与移动端横屏适配 (彻底合并旧 legacy 冲突)
    └── _single_hand.css # 竖屏单手模式辅助条与左右手镜像布局
```

### 5. 命名规范与命名空间收拢
* 新增与重构的样式类名统一采用 `mp-`（Miss Player）前缀；
* 状态类统一采用 `is-*` 或 `has-*` 前缀（如 `.is-active`, `.is-collapsed`, `.is-dimmed`, `.has-badge`）；
* 逐步替换历史遗留且含义混杂的 `tm-` 与 `jc-` 前缀。

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

### 5. 配置存储双写镜像与穿透互愈双轨备份 (Dual-Store Sync & Anti-Erase)
* **镜像双写持久化**：`storage.js` 中的 `setValue` 必须同时写入 `GM_setValue`（油猴跨域持久化）与 `localStorage`（本地同源灾备）；
* **穿透互愈双读机制**：`getValue` 优先读取 GM API；若读取为空或默认值，自动穿透读取 `localStorage`，读出健康值后自动反向补写修复 GM，彻底免疫换域名、沙箱就绪时序抖动；
* **云端合并凭据非空防抹杀**：WebDAV 云端合并（`mergeData`）与下载落盘（`applyDataToLocal`）必须对私有自建凭据（`betaDbEndpoint`, `betaDbApiKey`）执行绝对非空保护，只要本地已有有效配置，严禁用云端空值抹除；
* **实验特性开启防覆盖**：只要本地开启了 `betaMode`，绝不允许云端未开启状态覆盖关停。

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

## ⚡ 性能测试与性能优先实现规范 (Performance Router)

Miss Player 严格执行性能棘轮与零长任务守卫。完整测试方法论与性能编码模式已收敛至独立文档：**[docs/performance.md](./docs/performance.md)**。

### 📌 极速操作索引 (ADHD Quick Start)
- **跑性能快照**：`npm run test:perf`（全自动 CDP 无头测试，验证 mp:* 耗时与内存）；
- **做实机排查**：在真实 Chrome 打开目标页 ➔ `F12` ➔ **Performance** 面板 ➔ 查看 mp:* Timings 彩条；
- **开发硬红线**：
  1. **首屏零预载**：未展开面板严禁提前构建 DOM（未激活时仅允许保留浮动按钮）；
  2. **动效纯 GPU**：位移一律用 `transform: translate3d()`，带毛玻璃容器必须加 `contain: paint layout;`；
  3. **读写强分离**：严禁同帧内先改样式后读几何属性（拒绝 Layout Thrashing）；
  4. **零 GM 大数据**：评论与切片本地落盘一律强制使用 IndexedDB。

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

> **知识总账前置约束**：
> - `Review docs/handoff/handoff-readme.md before major refactors, complex bug fixes, or session start.`
> - `FORBIDDEN: Repeating documented past mistakes -> USE: Consult docs/handoff/*-lesson.md or run handoff2docs.`

当会话结束、阶段性里程碑达成或需要跨 Agent 交接工作时，**必须执行以下标准化沉淀工作流**，严禁仅将信息停留在会话对话中：

1. **交接文档归档 (Handoff)**：
   - 必须生成完整的交接文档并写入：`docs/handoff/yyyy-mm-dd-hhmmss-handoff.md` 与 `002.devlog/` 镜像归档；
   - 记录当前稳定版本号、Git Commit、已完成的核心成果拓扑、关键文件变动及下一阶段（For Next Session）任务清单；
   - 标明推荐后续 Agent 调用的关键 Skills 清单。
2. **经验教训沉淀 (Lesson Learned)**：
   - 必须将本阶段排查出的致命 Bug、隐藏陷阱、反模式及技术解决方案同步写入：`docs/handoff/yyyy-mm-dd-hhmmss-lesson.md`；
   - 重点记录平台合规红线教训、构建语法陷阱、Shadow DOM 隔离边界及异步调试经验；
   - 严格落实成对反模式禁令规范：`FORBIDDEN: X -> USE: Y`。
3. **全局总账维护 (Update Ledger)**：
   - 将新归档的条目倒序追加至 `docs/handoff/handoff-readme.md` 顶行，更新频次与状态追踪。
4. **两份文档强关联与时间戳一致性**：
   - `yyyy-mm-dd-hhmmss` 统一采用当前系统的精确本地时间戳（如 `2026-10-14-180701`）；
   - 生成后同步提交 Git 仓库进行版本受控。
5. **技能库自我成长与沉淀机制 (Skill Self-Evolution Protocol)**：
   - 自动定位本地全局技能库目录：`~/.pi/agent/skills/` 或 `C:\Users\chenahao\.agents\skills\modern-userscript`；
   - 将提炼出的架构设计哲学、合规红线约束与开箱即用的标准实现模板同步更新至技能对应专题目次；
   - 确保沉淀的内容高度通用化、解耦具体业务逻辑，使未来所有油猴项目均可直接受益。

---

## 🚀 开发与构建命令

* **开发监听构建**：`npm run dev`
* **版本自增同步**：`npm run bump`（Patch +0.0.1 并原子同步 5 处）或 `npm run bump -- <version>`
* **生产发布打包**：`npm run build`（生成 `dist/miss_player.user.js`、`dist/miss_player.meta.js`、`dist/miss_player.proxy.user.js`）
* **自动化门禁质检**：`npm run ci:check`（版本五处强同步核验、打包、体积审计、合规 Lint、SleazyFork 测试与沙箱启动验证）
* **GitHub 开发测试版推送工作流 (仅推 main)**：
  `npm run bump && npm run ci:check && git add . && git commit -m "feat/fix: xxx" && git push origin main`
* **正式发版标准 SOP (用户只要说“发版”即按此流水线全自动执行，绝不切换默认分支)**：
  1. `npm run ci:check`（全项门禁检验通过）
  2. `git push origin main`（确保 main 最新）
  3. `git push origin main:release`（将 main 代码镜像直推远程 release 分支，瞬间触发 SleazyFork Webhook 自动上线，本地分支依然留在 main）
  4. `git tag -a vX.Y.Z -m "Release vX.Y.Z" && git push origin vX.Y.Z`（打 Tag 并推送）
  5. `gh release create vX.Y.Z dist/miss_player.user.js dist/miss_player.meta.js --title "vX.Y.Z ..." --notes "..."`（创建 GitHub Release）
