# Specification: 设置菜单全新 UI/UX 重构与异步流式分块装配 (Settings Redesign Spec)

## Problem Statement

当前 Miss Player 的设置菜单在长期迭代中累积了超过 1830 行单体代码 (`SettingsManager.js`)，导致用户在视觉、交互与性能上遭遇以下痛点：
1. **视觉层次深且杂乱**：所有选项以单一纵向超长列表堆叠（高度常超 2000px），包含大量裸露的调试术语与技术黑话，缺乏卡片聚合感与视觉焦点。
2. **交互体验僵硬与位置丢失**：修改开关（如切换控制栏或评论区）会触发整个面板全量销毁与粗暴重建，导致用户的滚动条位置被强行重置回顶部，视觉频繁闪烁。
3. **单手操作不友好**：在移动端与竖屏视口下，设置面板全屏铺满且关键关闭与高频选项距离大拇指触控热区过远。
4. **性能阻塞与掉帧风险**：首次点击设置齿轮时，一次性同步生成 890+ 个 DOM 节点并注入复杂表单（WebDAV、版本卡片、统计面板），耗时超过 20ms，突破 16.6ms 单帧预算，存在明显掉帧和可感知的卡顿。

---

## Solution

基于现代化 Web SPA 范式与 Apple Inset-Grouped 设计系统，全面重构设置菜单的 UI、UX、布局、文案、结构、逻辑与性能：
1. **Apple Inset-Grouped 分组设计**：引入五大聚合分段卡片（播放与手势、评论与数据、云端同步、实验室与高级、关于与更新），采用现代半透明材质与毛玻璃 (Backdrop Glass)，提供三段式平滑切换胶囊 (Segmented Control) 与统一 Apple Switch。
2. **细粒度局部响应 (No Full Re-renders)**：开关联动仅触发子容器的局部高度折叠或状态切换，彻底杜绝整体 DOM 销毁重建，严格保留当前滚动位置。
3. **人本化文案与全量 i18n 覆盖**：将“DEBUG”、“URL 参数深链”、“疯狂采集”等直男技术术语重写为通俗易懂的场景价值语言，所有文案集中纳入五国语言字典。
4. **分块异步流式装配调度器 (Chunked Streaming Assembly)**：
   - 首次点击展开时，仅同步装配第一分段（高频控制项）与占位骨架，在 ≤ 3ms 内完成首屏极速呈现（节点数从 890+ 压降至 30 个以内）；
   - 次级与重型卡片（WebDAV 凭据表单、关于与统计卡片）交由 `requestIdleCallback` 或滚动可见性 (IntersectionObserver) 分批异步水合，保证主线程 60fps 丝滑响应。

---

## User Stories

1. As a 移动端单手用户, I want 核心播放设置位于拇指易触达的视口中下部, so that 我无需吃力调整手姿即可完成配置。
2. As a 用户, I want 点击设置图标瞬间无感呼出菜单 (≤ 5ms), so that 我不会感到界面有任何掉帧或迟钝。
3. As a 用户, I want 切换“快进/快退栏”或“评论区”开关时页面平滑联动且不重置滚动条, so that 我可以连续配置多个选项而无需重新滚动找位置。
4. As a 普通观影用户, I want 看到通俗易懂的功能介绍 (如“智能跳过片头”而非“开播定位至首个胶囊”), so that 我能清晰理解每个开关对观影体验的具体影响。
5. As a 多语言用户 (英文/繁体/日语/越南语), I want 设置菜单中 100% 的标题、选项、辅助说明与反馈气泡均使用母语展示, so that 不会出现中英夹杂的未翻译突兀文案。
6. As a 深度影迷, I want 通过三段式直观胶囊在“常规连贯播放”、“快速预览”与“精彩重温”间一键切换, so that 我能一目了然看清当前选中的模式。
7. As a 用户, I want 在增删快进跳转步进时能够即点即改、长按或点击删除单个标签, so that 我可以完全定制自己的专属快进退档位。
8. As a 跨设备用户, I want WebDAV 配置卡片展示醒目的连接状态指示灯 (已连接/未配置/同步中), so that 我能秒级感知云端胶囊同步是否健康。
9. As a 用户, I want 在输入 WebDAV 凭据或自建数据库地址后获得明确的保存与测试成功反馈, so that 我确信我的凭据已安全持久化。
10. As a 探索型用户, I want 在独立的“Beta 实验室”分类中体验前沿特性 (如 Safari 静音风格、误删防呆恢复), so that 实验特性不会干扰日常稳定播放。
11. As a 开发者或高级用户, I want 调试日志、强制重新爬取与清空本地评论缓存被整齐收敛在“高级排错”分组中, so that 避免高危操作被日常手势误触。
12. As a 用户, I want 在关于卡片中看到清晰的当前版本、最新版本状态及一键检查更新按钮, so that 我可以及时获取最新修复与功能。
13. As a 弱网/低配设备用户, I want 设置菜单在滑动时不会触发大面积重排或图层撕裂, so that 菜单滚动全程稳定在 60fps。

---

## Implementation Decisions

### 1. 架构模块解耦与职责收敛
将原本 1800+ 行的单体 `SettingsManager.js` 解构为单职微模块群：
- **SettingsManager (主控制器)**：仅负责面板生命周期（打开/关闭/外部遮罩）、键盘与快捷键监听、流式水合调度。
- **SettingsStore (适配器)**：集中管理与 `PlayerState` 和 `GM_Storage` 的双向读写与事件订阅，杜绝各组件私自操作底层存储。
- **Components (原子与分子级 UI 控件库)**：
  - `AppleCard`：带 Inset-Grouped 圆角、统一内边距与渐变细分割线的基础卡片容器。
  - `ToggleRow`：具备独立局部响应能力的标准开关行，支持副标题说明与 Badge 挂载。
  - `SegmentedControl`：纯 CSS Transform 动画驱动的滑动分段控制器。
  - `SeekStepEditor`：标签药丸增删联动组件。
- **Sections (业务分段装配器)**：
  - `PlaybackSection`：控制条开关、连播模式选择器、预览时长微调、跳转步进。
  - `CommentsSection`：评论展示、数据源矩阵选择、数字时间戳过滤器。
  - `CloudSyncSection`：WebDAV 状态徽章、输入表单、手动双向同步面板。
  - `BetaSection`：实验特性群、高危排错工具、外部 API 接入。
  - `AboutSection`：版本比对、更新检测、SleazyFork 跳转、本地存储统计。

### 2. 局部响应机制 (Zero-Full-Rerender Protocol)
- 废弃所有在子项变更时直接调用 `this.createSettingsPanel()` 的实现；
- 建立子组件绑定表：例如当“快进/快退栏”开关关闭时，仅通过微类名 `is-hidden` 优雅折叠步进编辑子面板，零 DOM 销毁。

### 3. 分块流式装配调度 (Chunked Streaming Hydration)
- 首次激活生命周期：
```text
toggleSettingsPanel() 
  -> 挂载 Panel 容器与骨架
  -> 同步挂载 Section 1 (PlaybackSection) [耗时 <= 3ms]
  -> 触发 active 动画 (0-100ms 纯 GPU 位移)
  -> requestIdleCallback() 异步依次装配 Section 2 & 4
  -> Section 3 (WebDAV) 与 Section 5 (About) 监听 IntersectionObserver 进入视口时实例化
```

### 4. 样式令牌化与纯 CSS 变量驱动
- 清理 JS 中散落的所有内联色彩、阴影与边框样式，全量统一为 `var(--shadcn-*)` 与设置面板专有 CSS 变量；
- 所有列表动画位移均走 `transform: translate3d`，严禁修改 `top` / `height` 等触发布局重排的属性；
- 设置面板常驻 `contain: paint layout;`，将样式重绘限制在面板内部。

---

## Testing Decisions

### 1. 外部行为黑盒测试 (External Behavior Only)
- 测试不触碰组件内部私有变量，仅以用户真实视角通过 CDP / DOM 行为验证：
  - 点击齿轮按钮，面板是否携带 `.active` 类名且进入视口；
  - 点击开关后，对应的播放器控制栏是否在 DOM 中动态展示或隐藏；
  - 修改跳转步进后，主控界面的跳转按钮是否立即同步更新对应秒数；
  - 切换连播模式后，播放控制器的运行模式状态是否同步更新。

### 2. 性能与帧率门禁测试 (Performance Ratchet)
- **挂载时间测试**：在 `tests/perf/run-perf.js` 中扩充 `mp:settings-open` 性能埋点，断言用户点击到第一分段渲染完成的耗时必须 **<= 5ms**（原基线 20.9ms）；
- **内存泄漏审计**：连续打开/关闭设置面板 20 次，断言 DOM 节点数量无残留增长，JS 堆内存波动在 2MB 以内。

### 3. 适用测试基础设施
- 复用本地 CDP 无头与实机压测套件 `tests/perf/mock-host.html` 与 `tests/perf/run-perf.js`。

---

## Out of Scope

1. **设置项跨设备云端全自动冲突仲裁算法重构**（仍沿用现有 `SyncManager` 的增量时间戳与墓碑机制，本次仅优化其配置 UI 与交互）。
2. **多语言自动翻译引擎对接**（依然由本地编译期多语言字典集中管理，不引入运行时网络翻译）。
3. **播放核心音视频解码管线修改**（设置菜单只负责分发用户偏好到状态机，不涉及播放内核底层修改）。

---

## Further Notes

- 重构过程必须严格遵守 AGENTS.md 中的五处版本号强同步规范与油猴安全红线。
- 保证新旧版本配置文件与 `GM_getValue` 键名的 100% 向后兼容，已有用户的自定义步进和偏好设置升级后无缝迁移。
