# ⚡ Miss Player 性能调优与测试体系 (Performance Guide)

> **给 ADHD 读者的 10 秒极速指引**：
> - **测性能**：终端跑 `npm run test:perf`（全自动）或在 DevTools Performance 面板录制看 `mp:*` 轨道。
> - **写代码**：DOM 必须按需挂载、手势一律走 `transform`、大文本存 IndexedDB、严禁在同帧内先改 style 后读布局属性。

---

## 🎯 4 大硬性性能红线 (The 4 Hard Baselines)

| 场景 | 指标 | 红线阈值 | 现网实测状态 |
| :--- | :--- | :--- | :--- |
| **首屏注入** | DOM 挂载增量 | **≤ 10 个** | 当前仅 2 个（极简浮钮） |
| **主控交互** | Play/Seek INP 时延 | **≤ 16 ms** (60fps) | 当前 3.5 ~ 8.6 ms |
| **常驻内存** | JS Heap 占用 | **≤ 30 MB** | 当前 27.5 MB |
| **主线程阻塞** | 单任务长任务 (Long Task) | **0 个 > 50ms** | 交互期间零长任务 |

---

## 🛠️ 怎么测性能？(How to Profile)

### 方案 A：CI 自动化无头快照（最省心，代码提交前必跑）
```bash
npm run test:perf
```
- 自动启动隔离 Chrome 实例并挂载 CDP。
- 自动断言 `mp:early-init`（≤50ms）与 `mp:startup`（≤120ms）。
- 测完自动杀死进程，零副作用。

### 方案 B：真实 Chrome 实机分析（排查复杂交互时用）
1. 确保 Chrome 开启远程调试或装有 `huashu-chrome` 扩展。
2. 运行 UI 巡检套件：
```bash
npm run test:ui
```
3. 查阅 `tests/ui/cases/00_performance_snapshot.js` 产出的 `ScriptDuration` 与 `JSHeapUsedMB`。

### 方案 C：DevTools 视觉排查（抓掉帧时用）
1. 打开目标视频页，按 `F12` ➔ 切到 **Performance** 面板。
2. 点录制 ➔ 点击播放或拖拽进度 ➔ 停止录制。
3. 展开 **Timings** 轨道：直接查看 `mp:*` 命名的彩条耗时。

---

## ⏱️ 内置性能标记速查表 (User Timing Markers)

| 标记 / Measure | 所属阶段 | 含义与警戒线 |
| :--- | :--- | :--- |
| `mp:module-loaded` | 模块初始化 | ES Module 文件顶层开始解析 |
| `mp:adblock-done` | 早期拦截 | 广告拦截器挂载完成 |
| `mp:early-init` | 早期区间 | 早期同步初始化耗时（警戒线: > 50ms） |
| `mp:state-created` | 状态就绪 | PlayerState 构造完成 |
| `mp:ui-ready` | 首屏就绪 | 浮动按钮挂载，用户可点击 |
| `mp:startup` | 启动全周期 | 从加载到浮钮挂载完成（警戒线: > 120ms） |
| `mp:theater-init` | 影院模式激活 | 从点击浮钮到影院播放器完全可用（警戒线: > 80ms） |

---

## 🚀 性能优先实现模式 (Performance-First Coding Rules)

日常开发新增特性时，必须无条件遵循以下规则：

### 1. DOM 必须按需挂载 (Lazy Mounting)
- **禁止在 `startScript` 或空闲期预渲染面板**（如设置面板、评论抽屉、标签编辑器）。
- **必须在用户首次真实点击对应按钮时动态构建**。
- 批量插入子节点时，必须先挂到 `DocumentFragment`，一次性 `appendChild`。

### 2. 动画与手势纯 GPU 化 (Zero-Reflow)
- 位移手势（Minimap、进度拖拽、弹层进出）**一律使用 `transform: translate3d(x, y, 0)`**。
- 绝对禁止动态修改 `top` / `left` / `width` / `height`。
- 带 `backdrop-filter` 的面板必须显式声明 `contain: paint layout;`，阻断样式向外污染。

### 3. 读写分离，严禁强制同步重排 (No Layout Thrashing)
- **反模式**：先写样式（`el.style.width = '100px'`）再立刻读取尺寸（`el.offsetWidth`）。
- **正确姿势**：在 `pointerdown` 时预先获取并缓存容器几何尺寸；在 `pointermove` 中仅使用缓存值进行位置映射计算。

### 4. 存储分级与零 GM 存储红线
- **禁止往 `GM_getValue` 塞大体积数据**（大文本、评论体、长缓存）。
- 所有高频读写或大数据必须使用原生异步 `src/utils/indexedDB.js`（`MissPlayerDB`）。

