# Miss Player 现代化演进与工程看板 (TODO.md)

> 本文档是 **Miss Player** 向现代油猴（Userscript）微前端架构演进的**总控看板与索引中枢**。  
> 详细任务规范已按模块拆分为专项文档进行精细化管理。所有推进必须严格遵循 [AGENTS.md](./AGENTS.md) 与 [GreasyFork&sleazyfork_rules.md](./GreasyFork&sleazyfork_rules.md)。

---

## 📊 演进阶段总览与状态索引

| 阶段 | 模块主题 | 状态 | 详细专项文档索引 |
| :---: | :--- | :---: | :--- |
| **Phase 0** | 应急合规治理与平台审查消警 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 1** | 依赖轻量化与审查脱敏 (零外部依赖) | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 2** | 工程底座现代化迁移 (Vite + Monkey) | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 3** | 界面微前端化与样式强隔离 (Shadow DOM) | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 4** | 网络层底层嗅探与响应式状态机 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 5** | 自动化 CI/CD 与合规巡检流水线 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 6** | 官方平台生态联动与版本生命周期 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 7** | 播放稳定性与交互控制台 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 8** | 智能时间胶囊与多维标签体系 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 9** | 多级评论存储与 WebDAV 拓扑 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 10** | 移动端 iOS 视口重构与番号合规收敛 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 11** | 极致性能深水区与现代架构跃迁 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 12** | 控制面板单手模式组件聚合与竖屏重构 | **达成 ✅** | [Phase 0~12 历史里程碑归档](./docs/todo/history-phases-0-to-12.md) |
| **Phase 14** | **CSS 样式架构重构与治理专项** | **达成 ✅** | **[Phase 14 专属规划方案](./docs/todo/phase-14-css-refactor.md)** |
| **Phase 13** | **苹果人本化文案重构与五国母语对齐** | **达成 ✅** | **[Phase 13 专属规划方案](./docs/todo/phase-13-copywriting.md)** |
| **Phase 15** | **UI/UX 深度优化与第三方脚本适配专项 (v5.7.1 ~ v5.7.4)** | **达成 ✅** | 详见 Release v5.7.4 |
| **Phase 16** | **全局输入框与双模层叠上下文架构重构 (内外两界隔离与端态自适应)** | **达成 ✅** | 详见 Release v5.7.64 |
| **Phase 17** | **Peach 联动生态与 WebDAV 虚拟 STRM 跨站播放闭环** | **达成 ✅** | **[Phase 17 专属规划方案](./docs/todo/phase-17-peach-strm-integration.md)** |
| **Phase 19** | **流网关 (Miss Stream Gateway) 与脚本职责收敛为「只入库」** | **达成 ✅** | **[Phase 19 设计方案](./docs/todo/phase-19-stream-gateway.md)** |
| **Phase 20** | **双轨播放热度图 (私有 WebDAV 漫游 + 社区全网高能 120 槽位量化)** | **达成 ✅** | 双轨 SVG 贝塞尔波形、Element-wise Max 漫游自愈、水位线差分增量防刷量 |
| **Phase 21** | **安全加固、Safari 全端兼容与 CSS 重构收口** | **达成 ✅** | **[Phase 21 专属规划方案](./docs/todo/phase-21-hardening-and-css-completion.md)** |
| **Phase 22** | **评论解析管线 V3 校准、等长掩码与黄金评测闭环** | **进行中 🚧** | **[Phase 22 专属规划方案](./docs/todo/phase-22-comment-parsing-v3.md)** |

- [x] **20.1** 120 分位定长字节量化编解码器 (`quantizeBinsTo120` / `expand120ToBins` / 水位线差分 / Base64 体积仅 160 字符，6 项测试全通)
- [x] **20.2** 双轨波形渲染与 WebDAV 漫游整合 (`HeatmapManager` 双轨 SVG 贝塞尔曲线、Element-wise Max 逐槽位取最大值融合、8 项测试全通)
- [x] **20.3** 播放热度跨站同步漏洞修复 (解决本地存量足迹冷启动零上云病灶、拆分 `isLocalDirty` 与 `isCloudDirty` 防 15s 定时器吞噬离散同步、新增 `durationchange` 与首帧自愈监听，v5.7.118-beta.004)
- [x] **20.4** WebDAV 双地址自适应与自动故障转移 (解决局域网缺少 NAT 回流导致的公网域名访问超时、`WebDavClient.executeWithFailover` 3.5s 灵敏截断切换、`_activeUrlCache` 活跃端点会话记忆 0ms 直连、设置面板「局域网备用」配置与动态 IP 感知，v5.7.118-beta.005)
- [x] **20.5** WebDAV 全局统一多地址架构彻底收敛 (真异常透明上抛拒绝假阴性、`checkDirectoryExists` 网络/认证异常精准抛出驱动 failover、GM_xmlhttpRequest 400ms JS 硬熔断防死挂、跨刷新 2h 持久化租约 `mp_active_webdav_lease`、私网 IP 智能协议清洗补全、Peach 模式 C 独立端点补齐 `lanUrl`、全项目 15 处 WebDAV 校验全局收口至 `WebDavClient.hasValidEndpoint`，9 项测试全通，v5.7.118-beta.006)
- [x] **20.6** WebDAV 路由器 HTML 劫持防伪、终极目录直探与全链路诊断聚合 (防光猫/路由器返回 HTML 登录页伪装 200/401/404、优先直探目标终极路径免疫 NAS 共享根目录权限拦截、私网 1.8s 极速探测、多端点全部失败聚合汇总报错详情，12 项测试全通，v5.7.118-beta.007)
- [x] **20.7** WebDAV 全局统一协议守卫 (`_davRequest`)、每 Origin 并发限流 (Max 2)、中文路径 UTF-8 百分比安全编码、`PeachService`/`PeachSection` 校验收口、配置变更自动清理租约与根目录可见性 (`Depth: 1`) 智能诊断 (19 项测试全通，v5.7.118-beta.008)
- [x] **20.8** WebDAV placeholder 与提示信息去私有 IP 与无厂商绑定重构 (清除所有 `192.168.2.250` 与单一品牌限定字样，兼容坚果云、Alist、Nextcloud 及各类私有云/NAS，20 项测试全通)

---

## ✅ 已达成：Phase 21 - 安全加固、Safari 全端兼容与 CSS 重构收口

> **背景**：基于 2026-11-12 全面代码体检，结合**油猴脚本权限边界**与 **Safari / iOS Stay 全端兼容基线（Safari 14+ / iOS 16–18+）** 严谨校准，收口历史遗留的 Phase 14 半途工程并止血真实风险。详见 **[Phase 21 专属规划方案](./docs/todo/phase-21-hardening-and-css-completion.md)**。

- [x] **21.1 油猴安全边界止血 (DOM XSS 与跨帧鉴权)**
  - [x] 修复 `CommentDataPipeline.js` `esc()` 未转义 `"`/`'`、`parseBBCode()` `[url]`/`[color]` 注入风险（补全 `http/https` 白名单与 `rel="noopener noreferrer"`，不依赖 Safari 缺失的 `Element.setHTML()`）；
  - [x] 修复 `CommentPanel.js` / `CommentCardRenderer.js` 第三方评论元字段未转义直拼；
  - [x] 收紧 `src/index.js` `MP_IFRAME_EXPAND/COLLAPSE` 的 `event.source` 校验（保留跨域 iframe 兼容性）；
  - [x] 新增 `tests/xss-sanitization.test.mjs` 覆盖 XSS 载荷、卡片渲染与 IME 输入测试并接入 CI。
- [x] **21.2 Safari / iOS Stay 输入与渲染兼容加固**
  - [x] 抽取 `isImeConfirmEnter(e)`（`!e.isComposing && e.keyCode !== 229`）修复全库 7 处中文/日文输入法误提交（精准规避 Safari WebKit bug 165004）；
  - [x] `:host` 显式声明 `color-scheme: dark;`（Safari 13+），`_common.css` 补齐 `prefers-reduced-motion: reduce`（Safari 10.1+）；
  - [x] `UIManager.js` 采用模块级缓存单例 `CSSStyleSheet`，保留 Safari 14–16.3 `<style>` 降级；
  - [x] 显式拒绝 Google/Firefox 专属且不兼容 Safari 的 API（`Element.setHTML`、`interpolate-size`、`<dialog closedby="any">`、`moveBefore`）；
  - [x] `.jc-card` 渐进增强 `content-visibility: auto; contain-intrinsic-block-size: auto 110px;`（Safari 18+ 原生加速，旧版安全忽略；移动端真机滚动手感随测试版走查）。
- [x] **21.3 Phase 14 CSS 重构续办与产物体积优化**
  - [x] 启用构建期 `cssMinify: true` 针对 `?inline` 导入剥离注释与空白（内联 CSS 降至 `150.88 KiB`）；
  - [x] Peach 图标落地方案 3A（64×64 WebP Data URI 体积直降 96%，`-48.8 KiB`）与 `_variables.css` 重复变量合并；
  - [x] 修正 `scripts/audit-css.js` 递归扫描与误报，按 4 层拓扑物理拆解为 20 个 CSS 模块（单文件均 ≤ 789 行，Grade-1 死选择器清零为 0 个），`!important` 从 97 处降至 **45 处**（Shadow DOM 内仅 26 处，`compliance-lint` 棘轮收紧至 50）；
  - [x] `UIManager.js` 模块级缓存 `CSSStyleSheet`（保留 Safari 14–16.3 `<style>` 降级）；
  - [x] 收敛 `FloatingButton.js` 魔法 `z-index: 2000000000` 至 `--z-host-player` 标尺（总产物降至 `1223.7 KiB`，其中未混淆纯 JS 占 `1036.06 KiB`，在 GreasyFork 禁止压缩混淆下安全处于 2.0 MB 红线之内）。
- [x] **21.4 上帝类渐进解耦与运行态优化**
  - [x] 从 `CommentPanel.js`（3438 ➔ 2919 行）拆出 `CommentCodePreview.js`、`CommentReportModal.js`、`CommentCardRenderer.js`，从 `UIManager.js`（2017 ➔ 1858 行）拆出 `ViewportKeyboardAdapter.js`；评估保留 `webpack.config.js` 兼容壳以满足 `AGENTS.md` §3 五处版本号强同步规范；
  - [x] 在 `src/index.js` 为 `AdBlocker` / `MediaSniffer` / `initIosInlinePlaybackGuard` 新增早期帧协议与非播放器上下文快速短路守卫（`_shouldInitMediaHooks`），避免在无关 iframe 与非目标上下文空耗。

---

## ✅ 已达成：Phase 19 - 流网关与脚本职责收敛

> **目标**：`services/miss-resolver` 升级为 `miss-gateway`，接手寻源、Referer 注入、m3u8 改写与分片代理；`.strm` 固定写 `{base}/v1/{token}/play/{CODE}.m3u8`；Miss Player 只负责通过 WebDAV 写入 `.strm`，客户端播放接力代码下线。详见 [设计方案](./docs/todo/phase-19-stream-gateway.md)。

- [x] **19.1** 拆分 `main.go` 为 `internal/source` 与 `internal/server`（行为 100% 兼容 + 8 项单元测试全通）
- [x] **19.2** 播放面 `/play`、`/pl`、`/seg`、`/key`、`/map` + 路径 token（支持同源改写、流式分片代理与 Referer 伪造，12 项测试全通）

- [x] **19.3** 缓存、catalog 持久化、上游 403 自愈、singleflight（零外部依赖合并并发请求、30分钟负缓存与切片 403 现场自愈重试，17 项测试全通）
- [x] **19.4** 实测分数调度 + 熔断 + `/metrics` + 管理面（EWMA 动态打分自适应排序、连续失败熔断、Prometheus 监控与 Bearer Token 管理面，18 项测试全通）

- [x] **19.5** MissAV 适配器（纯 Go Dean Edwards 解包混淆、可替换 PageFetcher 支持 direct/FlareSolverr、Cloudflare 盾牌 30 分钟快速熔断，21 项测试全通）
- [x] **19.6** `migrate` 子命令，迁移 NAS 上现有 292 个 `.strm`（实机 292 个文件 54ms 完成全量迁移，经 Peach `/stream?id=281` 原生点播实测 200 OK 跑通）

- [x] **19.7** 黄金集 + 端到端测试 + 验收（20 番号实机端到端 100% 成功，冷启动 P95 2034ms、热启动 P95 11ms、切片首包 P95 580ms 全绿通关）
- [x] **19.8** Miss Player：`.strm` 拼接网关地址；Peach 入库 WebDAV 三种模式（复用同步配置 + `peach-media` 默认目录 / 复用 + 自定义目录 / 单独配置，15 项 CI 全通）
- [x] **19.9** 删除 `PeachWebBridge` 中的寻源与接力代码，收缩 `@connect`（清洗 1350 行死代码，移除 5 大临时 CDN 跨域白名单，15 项 CI 全通）
- [x] **19.10 (v5.7.113-004)** iOS WebKit 原生全屏劫持彻底消解、HTML5 `:modal` inert 阻断突破、Web Components 媒体容器整装继承与退出浮钮/手势样式净化（彻底解决真机全屏抢占、黑屏与操作冻结，全量 15 项 CI 100% 通过）
- [x] **19.11 (v5.7.113-005)** 通用媒体盒模型缩放与 Web Components 挂载解耦、播放器退出单一漏斗闭环、死代码清理与 Top Layer 模态栈感知（修复拉伸平移失效、左上角退出浮钮消失与下滑报错，9大核心验证 100% 通过）
- [x] **19.12** Peach 专用令牌自动签发调研与实现：当用户进入 Peach Web 站点时，通过同源会话 API（`/api/configuration/jav-browser`）无感自动协商签发并持久化 Dedicated Token，设置面板彻底免除用户手动输入 Token 的认知负担，提供一键免输配对引导卡片与三态（未连接/仅STRM/全功能就绪）智能感知徽章。
- [x] **19.13** 外部源番号校验器与多层流媒体探针分流闭环：
  - 编写 `matcher.go` 结构化等价番号匹配算法，阻断 123AV/MissAV 模糊搜索张冠李戴；
  - 修复 MissAV/Surrit Referer、默认 UA 与 FlareSolverr 常驻 Session 4 项缺陷；
  - 深度排查定位 Cloudflare 机房脏 IP 拦截根因，并在 NAS 容器上成功实施挂载验证；
  - 整理视频流媒体节点可用性测试方法论，向 `Chris-C1108/NodeMatrix` 提交 PR #1 闭环多层流媒体探针与 123AV 穿盾分流规则。

---

## 🏗️ 已达成：Phase 17 - Peach 联动生态与 WebDAV 虚拟 STRM 跨站播放闭环

> **注**：17.5（Peach Web 播放接力）、17.8（外部解析服务）、17.9（GMHlsLoader）将由 Phase 19 流网关取代，客户端代码在 19.9 下线。

> **目标**：在 Miss Player 中集成 Peach 配对与管理，颠覆传统数十 GB 磁力离线下载模式，实现「WebDAV 秒级生成 `avcode.strm` 虚拟视频入库 + Peach Web 跨站动态寻源播放接力」双向闭环。

- [x] **17.1 核心通信与数据服务层 (`src/services/PeachService.js`)**
  - [x] 官方标准 JSON 配对解析、双写存储镜像（`mp_peach_base`, `mp_peach_token`, `mp_peach_strm_dir`）；
  - [x] 连通性握手测试 API (`GET /api/jav-browser?code=TEST-001`)；
  - [x] 馆藏状态查询 API (`GET /api/jav-browser?code=${avcode}`)；
  - [x] 资源同步对账触发器 (`POST /api/resource-sync/scan`)。
- [x] **17.2 STRM 虚拟文件生成与 WebDAV 写入管道 (`src/services/StrmIngestPipeline.js`)**
  - [x] 联动 `MediaSniffer` 智能捕获当前有效播放流；
  - [x] 遵循 Peach 规范生成合规 `.strm` 文本（首行流地址 + 元数据注释行）；
  - [x] 复用 `WebDavClient` 直写用户指定 NAS 目录；支持浏览器下载平民降级；
  - [x] 一键式全自动化联动。
- [x] **17.3 设置面板集成与 Beta 实验室卡片 (`src/player/managers/settings/sections/PeachSection.js`)**
  - [x] 受控于 `settings.betaMode`，默认关闭（Default OFF）；
  - [x] 一键粘贴配对框、密码掩码切换、连接状态指示灯与测试按键；
  - [x] 入库路径配置，符合 AppleCard 规范。
- [x] **17.4 播放器 UI 交互：入库胶囊控件与状态机**
  - [x] 控制栏挂载「入库 Peach」胶囊；
  - [x] 自动感应在库状态，避免重复写入；
  - [x] 动态进度反馈与轻量 Apple 风格 Toast。
- [x] **17.5 Peach Web 跨站识别与动态寻源播放接力 (`src/player/bridge/PeachWebBridge.js`)**
  - [x] Peach Web 播放页面检测与播放器视口接管；
  - [x] 跨站动态即时寻源引擎 (Stream Resolver)，规避 Token 过期与防盗链 403；
  - [x] GM 网络栈注入 Referer 彻底消灭死链。
- [x] **17.6 自动化门禁巡检、版本强同步与质量验收**
  - [x] `npm run lint:compliance`、`npm run bump` 与 `npm run ci:check` 全部 100% 通过 (v5.7.81)。
- [x] **17.7 多网络入口智能池化、访问 Peach Web 自动配对与媒体源巡检提醒**
  - [x] 多 Origin 候选地址池与自愈故障转移（公网域名/局域网IP/本地域名兼顾）；
  - [x] 访问 Peach Web 零输入自动配对（同源会话自动签发 Token 并落盘）；
  - [x] Peach 服务端网络拓扑自探测（自动扩充 local/lan/ip 候选池）；
  - [x] WebDAV 媒体源智能巡检与 Apple 风格挂载引导卡片。
- [x] **17.8 外部流解析微服务研发与 NAS 容器化部署 (`services/miss-resolver`)**
  - [x] 语言架构选型定稿：基于 Go 语言标准库构建极轻量独立微服务（单一静态二进制 7.1MB，常驻内存仅 8~12MB）；
  - [x] Kui-NAS (`192.168.2.250:8765`) Docker 容器化常驻运行，上游直通本地 Mihomo 容器（`192.168.2.250:7890`）代理策略分流；
  - [x] 多源动态加权竞速仲裁引擎：优先调度 123AV（纯明文无码，权重100）与 JAVVerse（纯明文无码，权重90），Jable（AES-128加密，权重50）错峰延后 400ms 作为次要兜底；
  - [x] 服务端预嗅探 M3U8 `#EXT-X-KEY` 标签，直接将 16 字节对称密钥与 IV 提取为 HEX 直出，提供双保险解密闭环；
  - [x] 服务端多路由泛兼容（`/api/resolve`、`/resolve` 与带 `?code=` 的根路径 `/`），彻底杜绝 URL 粘贴路径缺失 404。
- [x] **17.9 HLS 切片加载性能自愈与 Hls.js 官方规范对齐 (`src/player/bridge/PeachWebBridge.js`)**
  - [x] 彻底根治 15 秒超时死等：上线「域名级失效记忆锁 (`failedDomains`)」，首次 0B 逃逸后永久标记当前 CDN，后续所有切片 0ms 直连原生 fetch，切片拉取耗时从 15,000ms 暴降至 350ms，彻底终结 `video: waiting` 缓冲停滞；
  - [x] 根治切片下载 `internalException` 崩溃：在 `GMHlsLoader` 的 `constructor` 中完整初始化 Hls.js 规范的 `LoaderStats` 实例（包含 `loading, parsing, buffering`），同步更新首包与完成时间戳供 `bwEstimator` 测速消费；
  - [x] 设置菜单新增「外部解析服务器 URL」专属配置项与「测试解析」一键测速按钮；前端 `_searchRemoteScraperStream` 自动路径归一化，HUD 探针全透明输出请求 URL 与 HLS 全生命周期状态机事件。

---

## 🛡️ 已达成里程碑：Phase 16 - 全局输入框与双模层叠上下文架构重构 (v5.7.64)

> 完整架构方案与双模自适应契约见：AGENTS.md & TODO.md Phase 16

- [x] **外部宿主防线与生存隔离**：次极限值 `z-index: 2147483646` 绝对压制第三方流氓挂件（如 Peach JAV `2147483647`），宿主 Body 物理坍塌（`display: none !important`）与 `MutationObserver` 守卫彻底消除万级像素滚动空间；
- [x] **内部王国 Z-Index 标尺收敛**：`00_tokens/_zindex.css` 正式固化 10~60 规范步进标尺（`--z-base: 10` ➔ `--z-controls: 20` ➔ `--z-drawer: 30` ➔ `--z-composer: 40` ➔ `--z-modal: 50` ➔ `--z-toast: 60`），全面消灭散落的万级魔法数字；
- [x] **DOM 拓扑解耦与分层插槽拍平**：发评底栏抽屉（`.tm-comment-submit-bar-wrapper`）与遮罩从局部滚动容器拍平外移至 `playerContainer` 顶级插槽，彻底摆脱父级 `overflow: hidden` 裁剪；高光底栏脱离单手控制栏 `transform` 隔离区；
- [x] **双模响应式端态自适应分流**：移动端全宽分时吸底与 Pre-Lift 预升降；PC 宽屏 Web 端严格嵌合在右侧 380px 边栏最底部（`width: var(--sidebar-width); bottom: 0;`），严禁横跨全屏侵犯左侧视频主舞台；
- [x] **活动层状态机与声明式防穿透锁**：移动触控下声明式禁用底层非活动区 `pointer-events: none`，消除长达 12 项的脆弱 JS `closest` 白名单，彻底杜绝打字与选词时的误触收起与点击穿透；PC 端保持全区域可交互。

---

## 🛡️ 已达成里程碑：Phase 14 - CSS 样式架构重构与治理

> 完整 5 步详细清单见：[docs/todo/phase-14-css-refactor.md](./docs/todo/phase-14-css-refactor.md)

- [x] **Step 0: 宪法对齐与规范回写 (已达成 ✅)**
  - 核心红线、动静分离契约、Z-Index 标尺及双轨分层拓扑正式写入 `AGENTS.md`。
- [x] **Step 1: 静态摸排与数据量化 (已达成 ✅)**
  - 编写 `scripts/audit-css.js` 扫描 0 引用死代码与高频冲突选择器；
  - 确认并标记 `_landscape_legacy.css` 及 `_player.css` 历史包袱；
  - 完成 116 处 HTML 内嵌 style 与 442 处 el.style 动静分类清单。
- [x] **Step 3: 架构解耦、!important 清洗与双轨分离 (已达成 ✅)**
  - 全局 `!important` 数量从 **946 处断崖式压降至 98 处**（降幅 90%）；
  - `_controls.css` 压降至 6 处，`_landscape_pc.css` 压降至 14 处，`_player.css` 压降至 16 处；
  - 落地宿主轨 `01_core/_host.css` (2.7KB)，宿主 `<head>` 零污染，消除 150KB 内存双重解析；
  - 产物体积由 1092 KiB 降至 **941 KiB**，正式安全进入 1.0 MB 合规红线之内！
- [x] **Step 4: 工程化防线建设与 CI 门禁 (已达成 ✅)**
  - 接入 PostCSS 选择器嵌套深度（≤ 3 层）与 `!important` 数量封顶守卫（≤ 98 处）；
  - 静态拦截 JS 模板内嵌行内样式回潮（严限 ≤ 20 处）；
  - 全流程通过 `npm run ci:check` 门禁与 `npm run test:perf` 性能测试（启动 115ms，0 布局阻塞）。

---

## 🍎 已达成里程碑：Phase 13 - 苹果人本化文案系统性重构

> 完整场景对照表与五国语言映射字典见：[docs/todo/phase-13-copywriting.md](./docs/todo/phase-13-copywriting.md)

- [x] **13.1 核心概念收敛**：胶囊/时间胶囊 ➔ 高光 / 片段；
- [x] **13.2 居中主键三态收敛**：快览 / 正常 / 连播；
- [x] **13.3 倒数时间戳显式定稿**：转为正序 / 显示倒数；
- [x] **13.4 单手模式文案精炼**：惯用手、展开全宽 / 收起单手；
- [x] **13.5 设置面板去技术黑话**：播放控制、影片评论、云端同步；
- [x] **13.6 实验特性与关于播放器升级**；
- [x] **13.7 五国语言国际化字典全量母语对齐 (`src/constants/i18n.js`)**；
- [x] **13.8 自动化门禁巡检与性能测试验证**。

---

## 📌 执行纪律与红线备忘 (Quick Reference)

1. **绝对主键保护**：任何重构无论怎样变动，`@namespace: loadingi.local` 与主名称绝对不可变动。
2. **发版五处强同步**：每次发布新版本必须且只能严格同步递增 5 处版本号。
3. **安全透明优先**：构建产物必须保持可读，严禁为了盲目追求体积开启代码混淆 (`mangle: false`)。
4. **零宿主污染**：严格保持 Shadow DOM 物理隔离，坚决不引入通用 Tailwind 原子类。
