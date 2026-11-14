# 设置菜单全量盘点与重构契约基线 (Settings Inventory & Contracts)

> **目的**：在重构设置菜单层级、布局与样式前，完整盘点当前 5 大板块（含嵌套子板块）的全部功能项、状态键、副作用联动、样式碎片及外部测试/模块强契约，确保重构零功能丢失、零副作用回归、零测试击穿。

---

## 一、全量功能与交互清单（共 32 个真实配置/操作单元）

### 1. 面板外壳与公共机制 (`SettingsManager.js`, `SettingsStreamScheduler.js`)
| 区域 / 机制 | 当前实现位置 | DOM 类名与功能行为 | 风险与已知缺陷 |
| :--- | :--- | :--- | :--- |
| **三段式 Sheet 外壳** | `SettingsManager.js:299-360` | `.tm-settings-apple-header`（`.tm-settings-sheet-grabber` + 标题 + `✕` 关闭）、`.tm-settings-scroll-body`（独立滚动体）、`.tm-settings-apple-footer`（`.tm-settings-apple-done-btn` 移动端完成按钮） | `tests/player-fixes-verification.test.mjs` Test 23 强校验这 4 个类名 |
| **下拉手势关闭** | `SettingsManager.js:440-509` | `_bindSheetDismissGesture(headerRow, scrollBody)`：抓手区下拉或滚动到顶续拉 >76px / 快速轻拂收起面板 | Test 23 强校验方法名 `_bindSheetDismissGesture` |
| **流式渐进装配** | `SettingsStreamScheduler.js` | 5 个保序插槽 `.tm-slot-{playback,comments,beta,cloud-sync,about}`：`Playback` 同步首屏渲染，`Comments/Beta` `idle` 渲染，`CloudSync/About` 默认 `viewport` 懒加载（展开态则同步） | — |
| **滚动位置记忆** | `SettingsManager.js:272, 427` | 重建面板时记住 `settingsScrollBody.scrollTop` 并通过 rAF/50/180ms 恢复 | 状态更新时暴力 `createSettingsPanel()` 整页重建，易导致输入框失焦 |
| **聚焦自动滚入视口** | `SettingsManager.js:633` | `bindSettingsFocus` 监听输入框 `focus` 并平滑滚动 | **现有 Bug**：查询的是 `.closest('.tm-settings-panel')`（已无滚动条），实际应滚动 `.tm-settings-scroll-body` |
| **表面状态机接入** | `SettingsManager.js:1265-1315` | `toggleSettingsPanel` 接入 `UISurfaceMachine`（`SURFACE_TYPES.SETTINGS`）与外部 `click` capture（`composedPath` 放行 `.tm-settings-panel` / `.tm-settings-button` / `.tm-custom-modal-overlay`） | Test 14 强校验 `SURFACE_TYPES.SETTINGS` |

---

### 2. 分段 1：播放控制 (`PlaybackSection.js`, 10 项)
| # | 控件标题 | 控件类型 | `settings` 状态键 / 默认值 | 联动副作用与校验 |
| :--- | :--- | :--- | :--- | :--- |
| 1.1 | **进度条** | `ToggleRow` | `showProgressBar` (`true`) | `sm.updateControlRowsVisibility()` |
| 1.2 | **快捷跳转** | `ToggleRow` + 嵌套子面板 | `showSeekControlRow` (`true`) | `sm.updateControlRowsVisibility()`；展开/隐藏下方步进编辑器 |
| 1.2a | └─ **步进编辑器** (`SeekStepEditor.js`) | Pill 列表 + `+` 添加 + `×` 删除 | `enabledSeekSteps` / `customUserSeekSteps` | 点击切换启用（至少保留 1 项）；`+` 弹窗（当前用 `window.prompt`）校验 `/^\d+[sm]$/i`；删除自定义项；均联动 `sm.rebuildControlPanelSeekRow()` |
| 1.3 | **片段循环** | `ToggleRow` | `showLoopControlRow` (`true`) | `sm.updateControlRowsVisibility()` |
| 1.4 | **快览时长** | `number` 输入 (`1..30` 秒) | `previewDurationSeconds` (`5`) | `change` 夹紧区间 + `Toast` |
| 1.5 | **高光时长** | `number` 输入 (`5..180` 秒) | `climaxDurationSeconds` (`60`) | `change` 夹紧区间 + `Toast` |
| 1.6 | **离开暂停** | `ToggleRow` | `pauseOnBlur` (`!== false`) | — |
| 1.7 | **默认静音** | `ToggleRow` + 嵌套子面板 | `defaultMuted` (`!== false`) | 展开/隐藏下方静音租约 |
| 1.7a | └─ **静音租约** | `number` 输入 (`1..120` 分钟) | `muteResetMinutes` (`5`) | `change` 夹紧区间 + `Toast` |
| 1.8 | **按键音效** | `ToggleRow` | `buttonSoundEnabled` (`!== false`) | — |

---

### 3. 分段 2：影片评论 (`CommentsSection.js`, 2 项)
| # | 控件标题 | 控件类型 | `settings` 状态键 / 默认值 | 联动副作用与校验 |
| :--- | :--- | :--- | :--- | :--- |
| 2.1 | **显示评论** | `ToggleRow` + 嵌套子面板 | `showCommentsSection` (`true`) | 开启时联动置 `sidebarHidden = false`、更新 `uiManager.isSidebarHidden` 与 `updateSidebarToggleButtonIcon()`；调用 `commentPanel.updateCommentsVisibility(checked)`；显隐下方评论源开关 |
| 2.1a | └─ **评论来源** | 3 枚多选胶囊 (`Jable`, `JavDB`, `JavLibrary`) | `enabledCommentSources` (`{ jable: true, javdb: true, javlibrary: false }`) | `commentPanel.loadSiteComments(1)`（开启）或 `commentPanel.renderCommentsList()`（关闭） |

---

### 4. 分段 3：实验特性 & 调试排错 (`BetaSection.js` + `PeachSection.js`, 11 项)
> **当前层级乱象核心重灾区**：`BetaSection` 一个 `AppleCard` 内同时塞了「实验功能（内含 6 项开关 + 嵌套手风琴 PeachSection）」与「调试日志（内含 3 项开关/危险按钮）」。

| # | 控件标题 | 控件类型 | `settings` / 服务键 | 联动副作用与校验 |
| :--- | :--- | :--- | :--- | :--- |
| 3.1 | **实验功能** | `ToggleRow`（总开关） | `betaMode` (`false`) | 联动 `heatmapManager.setEnabled(betaMode && betaHeatmap)`；展开/隐藏 3.1a–3.1f + Peach |
| 3.1a | └─ **首片段速播** | `ToggleRow` | `betaFirstCapsulePlay` (`false`) | — |
| 3.1b | └─ **播放热度** | `ToggleRow` | `betaHeatmap` (`false`) | `heatmapManager.setEnabled(checked)` |
| 3.1c | └─ **数据模式** | `SegmentedControl` (`local` / `shared`) | `dataMode` (`'local'`) | 动态切换说明文案；`heatmapManager.setCrowdEnabled(betaMode && val === 'shared')` + `Toast` |
| 3.1d | └─ **不显示私有数据** | `ToggleRow` | `hidePrivateData` (`false`) | `heatmapManager.setPrivateDataHidden(checked)` |
| 3.1e | └─ **防误删除** | `ToggleRow` | `betaCapsuleUndo` (`!== false`) | — |
| 3.1f | └─ **链接还原** | `ToggleRow` | `betaDeepLinking` (`!== false`) | — |
| 3.1g | └─ **Peach 入库 (Beta)** (`PeachSection.js`) | 嵌套手风琴卡片（内有独立 6 项子配置） | `PeachService` 独立存储 | 见下表 3.1g 详情 |
| 3.2 | **调试日志** | `ToggleRow`（总开关） | `debugMode` (`false`) | `DebugLogPanel.updateDebugState(checked)`；`commentPanel.updateDebugMode(checked)`；关闭时停止 `CrazyScraper` |
| 3.2a | └─ **预载评论** | `ToggleRow` | `crazyScrapeMode` (`false`) | 开启调 `CrazyScraper.start(videoCode)`，关闭调 `CrazyScraper.stop()` |
| 3.2b | └─ **视口探针** | `ToggleRow` | `viewportDebugEnabled` (`false`) | 开启调 `ViewportDebugHUD.init(playerContainer, shadowRoot)`，关闭调 `ViewportDebugHUD.destroy()` |
| 3.2c | └─ **清除缓存** | 危险操作按钮 | — | `confirm()` 后执行 `CommentCacheManager.clearAll()` + 清空 `CrazyScraper.{_completedCodes, _scannedCodes, _avcodeDurations}` |

#### 3.1g 子表：`PeachSection.js` 内部全部功能项（Test 21 强守护）
1. **头部手风琴**：标题 `Peach 入库`（带 `🍑` 图标）+ 实时连通状态徽章（`未配置` / `测试中…` / `仅入库` / `已连接` / `不可达`）。
2. **启用 Peach 入库**：`ToggleRow`（`PeachService.setEnabled`）+ 联动 `uiManager.updatePeachButtonVisibility()`。
3. **Peach 服务地址**：文本输入 + 右侧 `删除` 按钮（`.tm-peach-delete-btn`，调 `PeachService.clearBase()` + 清空状态 + 刷新按钮可见性）+ 自动解析粘贴的配对 JSON + `令牌状态`（`.tm-peach-token-status-wrap`）+ `已记住站点域列表`（`.tm-peach-origins-container`，支持逐项移除 `PeachService.removeOrigin`）+ 失焦自动测连（`_autoCheckStatus()`）。
4. **流网关地址**：文本输入（`PeachService.setGatewayBase`）+ Test 21 精确文案提示（`Peach 服务端可访问的网关地址（支持局域网 IP / host.docker.internal）。播放 Token 需在部署网关时环境变量配置（默认 dev）`）+ 失焦自动测连。
5. **写入模式**：`SegmentedControl`（`同步默认` / `自定义目录` / `独立 WebDAV`）。
   - `自定义目录`：显示 `strmDir` 输入框（`PeachService.setStrmDir`）。
   - `独立 WebDAV`：显示 `url`, `lanUrl`, `username`, `password`, `path` 5 个输入框及独立「测试连接」按钮（`WebDavClient.testConnection`）。

---

### 5. 分段 4：云端同步 WebDAV (`CloudSyncSection.js` + `SettingsManager._createWebDavSyncCard`, 7 项)
| # | 控件 / 元素 | 当前实现 | 状态 / 数据源 | 联动与问题 |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | 手风琴头部 | `☁️ 云端同步` + 配置态徽章（`● 已配置` / `○ 未配置`） | `SyncManager.getWebDavConfig()` | 使用 `.tm-apple-accordion-header`；点击展开记住 `setSectionExpanded('cloudSync', ...)` |
| 4.2 | `url` / `lanUrl` / `username` / `password` / `path` | 5 行 `.tm-webdav-row` 标签+输入框 | `SyncManager.saveWebDavConfig` | 输入变更自动保存；**样式使用独立 `.tm-webdav-*` 体系（`--shadcn-*` 变量、10px 圆角）** |
| 4.3 | 自动同步开关 | `.tm-webdav-switch-row` + 复用 `.tm-apple-switch` | `config.autoSync` | 修改配置自动持久化 |
| 4.4 | 快捷操作按钮组 | `测试连接`、`上传备份`、`下载恢复`、`强制全量`（仅在已配置+未运行态展示状态横幅） | `WebDavClient.testConnection` / `SyncManager.executeSync` | `upload`/`download` 含 `window.confirm`；完成后更新 `renderTimeText()`（上次同步时间） |

---

### 6. 分段 5：版本信息与更新 (`AboutSection.js` + `SettingsManager._createAboutCard`, 5 项)
| # | 控件 / 元素 | 当前实现 | 数据源 | 联动与 Test 20 契约 |
| :--- | :--- | :--- | :--- | :--- |
| 5.1 | 手风琴头部 | `ℹ️ 版本信息` + 版本徽章（`vX.Y.Z` 或 `发现新版本`） | `getCurrentVersion()`, `_latestUpdateInfo` | **Test 20.1**：展开立即调用 `this.sm.checkUpdate(true, false)` |
| 5.2 | 头部元数据条 | 脚本名 + 平台双轨外链（正式版 ➔ SleazyFork `453300`，测试版 ➔ GitHub）+ 协议标签 | `isBeta` | **Test 20.2**：精确校验 `platformLink.href` 与 `title` |
| 5.3 | 更新通道切换 | `SegmentedControl`（`正式版` / `测试版`） | `settings.updateChannel` | 切换通道立即触发 `checkUpdate(true, false)` |
| 5.4 | 发现新版本 / 最新状态 | 绿色更新横幅（`立即更新` + `更新日志`）或 `● 当前已是最新版本` | `_latestUpdateInfo`, `_isCheckingUpdate` | 一键安装支持 Stay (`stay://x-callback-url/...`) / Tampermonkey / ScriptCat |
| 5.5 | 检查更新 + 自动检查 | `检查更新` 按钮 + `自动检查更新` 开关 | `settings.autoCheckUpdate` | Test 20.4 校验 `.tm-about-*` 相关类名存在 |

---

## 二、当前样式与架构混乱根因诊断

1. **4 套 CSS 文件 + 4 套设计语言并存**：
   - `_settings_apple.css`（`--mp-settings-*`，`#0a84ff` 蓝，`12px` 圆角，`14px` 标题）
   - `_settings_cards.css`（`--shadcn-*`，`10px` 圆角，`32px` 高 `.tm-webdav-input`，专用 `.tm-webdav-*` / `.tm-about-*`）
   - `_settings_panels.css`（外壳定位、滚动视口、移动端响应式 Sheet）
   - `_peach.css`（独立 `.tm-peach-*` 字段行、微缩表单、内嵌小号字体与间距）
2. **视觉层级扁平化与嵌套爆炸**：
   - `BetaSection` 将 **实验开关**、**数据模式分段**、**Peach 多层级表单**、**调试排错** 全部堆进同一张大 `AppleCard` 内部，缩进线（`.tm-settings-subpanel-wrap`）再套一层手风琴（`PeachSection`），形成 **卡片 ➔ 子块 ➔ 折叠卡 ➔ 分段 ➔ 子输入** 5 层视觉深渊。
   - **标题风格分裂**：前 3 块用 Apple 大写灰字 `Group Header`，后 2 块和 `Peach` 用带 Emoji（`🍑` / `☁️` / `ℹ️`）的手风琴卡片头；且 `CloudSync`/`About` 被迫由 `SettingsManager.js` 主类硬编码 685 行 DOM 拼接。
3. **行内样式与死代码残留**：
   - `PlaybackSection` / `CommentsSection` / `BetaSection` / `PeachSection` 仍用 `element.style.display = 'block' / 'none'` 控制显隐（违反 `AGENTS.md` 动静分离契约）。
   - `AboutSection`/`SettingsManager._createAboutCard` 存在 `style="color: ..."` 内联样式；`SettingsManager.js:1208` 存在死方法 `_createToggleOption`。
   - `bindSettingsFocus` 与手风琴展开滚动仍错误指向 `.tm-settings-panel` 而非 `.tm-settings-scroll-body`。

---

## 三、重构必须严守的硬性护栏 (Guardrails)

1. **所有 32 个配置/操作项、默认值、`settings` 键名、副作用调用（`HeatmapManager`、`CommentPanel`、`UIManager`、`PeachService`、`SyncManager`、`CrazyScraper`、`ViewportDebugHUD`、`DebugLogPanel`）100% 保留**。
2. **外部单元测试契约不得静默破坏**（如需迁移类名，必须同步评估并保留兼容类名或同步更新对应校验）：
   - `tests/player-fixes-verification.test.mjs` Test 14 / 17 / 20 / 21 / 23 / 24
   - `tests/ui-screenshots/screenshot.js`（引用 `.tm-apple-accordion-header`）
3. **CSS 架构与合规门禁红线**：
   - `!important` 总量 ≤ 50（当前已达 **49/50**！重构必须**减少**而非增加 `!important`！）
   - 选择器嵌套深度 ≤ 3 层
   - JS 模板行内样式 `style="..."` ≤ 20（当前 13/20，重构目标清零设置模块内联样式）
   - 严禁依赖 `.tm-settings-panel` 作为滚动体，统一滚动 `.tm-settings-scroll-body`
   - 所有输入框、下拉、可编辑控件均由 `UISurfaceMachine` 统一隔离键盘冒泡。
