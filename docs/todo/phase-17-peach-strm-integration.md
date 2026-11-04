# Phase 17 专属规划方案：Peach 联动生态与 WebDAV 虚拟 STRM 跨站播放闭环

> **状态**：实施中 🟡  
> **关联里程碑**：TODO.md Phase 17 / AGENTS.md 准则动态对齐  
> **核心目标**：在 Miss Player 中集成 Peach 配对与管理，颠覆传统繁重的数十 GB 磁力离线下载流程，创新实现「WebDAV 秒级生成 `avcode.strm` 虚拟视频入库 + Peach Web 跨站动态寻源播放接力」双向闭环。

---

## 🏗️ 架构拓扑与数据管道设计

```
[ 源站播放页 (Jable / MissAV) ]
  │
  ├─ 1. MediaSniffer 毫秒级捕获当前 m3u8 流地址
  ├─ 2. StrmIngestPipeline 构造合规 [AVCODE].strm 文件 (首行流地址 + 元数据注释)
  ├─ 3. 复用 WebDavClient 将 .strm 原子 PUT 到用户 NAS 的 Peach 媒体目录
  └─ 4. PeachService 触发 Peach 原生 POST /api/resource-sync/scan 对账刮削
        │
        ▼ (Peach 0秒自动刮削封面、女优与标签)
[ Peach Web 管理中心 (自托管实例) ]
  │
  ├─ 5. Miss Player 注入 Peach Web 播放页 (@match 用户自定义 Peach origin)
  ├─ 6. 识别虚拟 STRM 资产并接管播放视口，挂载 Miss Player 标志性播放核心
  └─ 7. 遇到失效/防盗链流时，启动后台跨站寻源引擎，现场通过 GM 栈动态拉取最新鲜可用流 (带 Referer) 跨站起播！
```

---

## 📋 全流程实施任务清单 (Task Breakdown)

### 17.1 核心通信与数据服务层 (`src/services/PeachService.js`)
- [x] **17.1.1 配对信息解析器**：支持解析与校验官方标准 JSON `{"peach_pairing":1,"base":"...","token":"..."}`，提取 `base` 与 `token`；
- [x] **17.1.2 存储镜像与非空保护**：通过 `src/utils/storage.js` 持久化 `mp_peach_base`, `mp_peach_token`, `mp_peach_strm_dir`，具备同源灾备双写；
- [x] **17.1.3 连通性测试握手**：实现 `testConnection()`，调用 `GET /api/jav-browser?code=TEST-001` 验证 Token 有效性与服务存活；
- [x] **17.1.4 馆藏状态查询 API**：实现 `checkCodeStatus(avcode)`，调用 `GET /api/jav-browser?code=${avcode}`，判断当前番号是否已在库（`owned` / `ingested`）；
- [x] **17.1.5 扫描对账触发器**：实现 `triggerScan()`，调用 `POST /api/resource-sync/scan` 触发媒体目录文件对账与刮削。

### 17.2 STRM 虚拟文件生成与 WebDAV 写入管道 (`src/services/StrmIngestPipeline.js`)
- [x] **17.2.1 流地址捕获器**：联动 `MediaSniffer.getLatestStream()` 与当前 `<video src>`，智能提取当前影片的有效播放流；
- [x] **17.2.2 规范 STRM 文本构造**：严格遵循 Peach `src/peach/strm.py` 格式生成纯文本（首行合规流地址 + `# avcode:` / `# source:` 元数据注释行）；
- [x] **17.2.3 WebDAV 远程直写**：利用现有 `WebDavClient.uploadFile(config, subPath, content)`，将 `[AVCODE].strm` 写入指定的 STRM 媒体目录；
- [x] **17.2.4 浏览器下载平民降级**：若未配置 WebDAV，支持生成 Blob 并通过浏览器下载直出 `.strm` 文件供本地归档；
- [x] **17.2.5 全流程自动化联动**：完成「流捕获 ➔ 生成 ➔ 落盘 ➔ 调用 Peach 扫描」一键式无感自动化。

### 17.3 设置面板集成与 Beta 实验室卡片 (`src/player/managers/settings/sections/PeachSection.js`)
- [x] **17.3.1 Beta 实验室准入**：受控于 `settings.betaMode` 与 `settings.peachEnabled`，挂载在 BetaSection 内部；
- [x] **17.3.2 一键粘贴配对框**：支持直接粘贴配对 JSON 自动提取，支持密码掩码与“显示/隐藏”令牌切换；
- [x] **17.3.3 连接状态与测试按键**：提供“● 已连接 / ○ 未连接”状态指示灯与一键“测试连接”按钮；
- [x] **17.3.4 入库路径与通道配置**：配置 WebDAV STRM 存放子目录（如 `/Media/STRM/`）；
- [x] **17.3.5 Apple 风格微排版**：严格继承 `AppleCard` 与语义化 CSS 类名，消灭模板行内 style。

### 17.4 播放器 UI 交互：入库胶囊控件与状态机
- [x] **17.4.1 控制栏控件挂载**：在顶栏快捷操作区（`topActionsContainer`）挂载精致 `ICON_PEACH` 胶囊；
- [x] **17.4.2 智能状态感应**：视频加载后异步探测 `checkPeachStatus(avcode)`，若已在库自动显示绿色已入库高亮；
- [x] **17.4.3 操作反馈与 Toast**：入库执行过程中提供 loading 旋转反馈，完成后弹出 Apple 风格 Toast。

### 17.5 Peach Web 跨站识别与动态寻源播放接力 (`src/player/bridge/PeachWebBridge.js`)
- [x] **17.5.1 动态注册与站点识别**：检测当前页面是否为用户配置的 Peach Web 端或具有 Peach 特征；
- [x] **17.5.2 播放器视口接管**：在 Peach Web 播放页面检测到当前播放为虚拟 STRM，提供「Miss Player 接力起播」悬浮操作；
- [x] **17.5.3 跨站动态即时寻源引擎 (Stream Resolver)**：当流失效时后台通过 GM 栈向 Jable 动态检索 AVCODE 获取当期最新鲜有效流；
- [x] **17.5.4 防盗链注入与流畅起播**：注入对应宿主站的 `Referer`，彻底消灭防盗链 403 死链。

### 17.6 门禁巡检、版本强同步与质量验收
- [x] **17.6.1 合规与样式门禁**：执行 `npm run lint:compliance` 确保 100% 通过；
- [x] **17.6.2 版本强同步自增**：执行 `npm run bump` 同步 5 处版本；
- [x] **17.6.3 生产构建验证**：执行 `npm run ci:check` 验证完整包体积与打包无误。

### 17.7 多网络入口智能池化、访问 Peach Web 自动配对与媒体源巡检提醒
- [x] **17.7.1 多 Origin 智能地址池 (`PeachService.js`)**：支持管理公网域名、局域网 IP、mDNS、localhost 等多候选地址（`mp_peach_origins`），并发/顺位故障自愈（Failover）；
- [x] **17.7.2 访问 Peach Web 零输入自动配对 (`PeachWebBridge.js`)**：检测到访问 Peach Web 时，以同源会话自动签发/获取 Dedicated Token，自动开启 Peach 联动，消除手动复制粘贴繁琐流程；
- [x] **17.7.3 多网络地址池动态自扩充**：读取 Peach 服务端 `network_payload`（`local_url` / `lan_url` / `ip_url`），自动将当前设备多网络入口注入地址池；
- [x] **17.7.4 WebDAV 媒体源智能巡检与提醒引导**：查询 Peach 已登记媒体库（`/api/libraries`），若未包含 STRM 虚拟视频目录，以 Apple 毛玻璃卡片提醒并引导一键跳转 `/settings/library`。
