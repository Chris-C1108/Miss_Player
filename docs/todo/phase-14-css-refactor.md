# Phase 14: CSS 样式架构重构与治理专项计划 (CSS Architecture Refactor)

> 本文档为 Miss Player CSS 样式体系重构治理的专属工程规划与执行任务清单。  
> 相关架构规范已同步沉淀至：[AGENTS.md](../../AGENTS.md)。  
> 返回演进主看板：[TODO.md](../../TODO.md)。

---

## 📊 现状摸底与重构目标指标

| 质量维度 | 重构前现状 (Baseline) | 重构后目标 (Target) | 核心治理手段 |
| :--- | :--- | :--- | :--- |
| **CSS 源码总量** | 9 个文件，7,736 行 (`_player.css` 占 3,002 行) | 按领域拆分为 4 层 10 模块，单文件 ≤ 800 行 | 业务解耦，拆除 3000 行巨石 |
| **`!important` 数量** | **946 处** (特异度彻底失控) | **< 50 处** (仅保留全局状态隐藏类) | 借助 Shadow DOM 物理隔离，消除特异度竞态 |
| **JS 内联样式** | **440 处** `element.style.xxx` | 仅保留连续数学手势/坐标/微秒滑块真动态 | 动静分离，静态布局全面抽离为 class |
| **HTML 行内 style** | **100+ 处** `style="..."` 模板内嵌 | **0 处** (100% 纯净类名声明) | 提取组件模板类名，彻底消灭行内牛皮癣 |
| **选择器重复声明** | **86 处** (如 `.tm-control-buttons` 声明 9 次) | **0 处** 冲突声明，变量统一定义在 `_tokens.css` | 集中收拢组件声明与设计令牌 |
| **宿主与Shadow双轨** | 7,700 行 CSS 双重注入宿主 `<head>` 与 Shadow DOM | 宿主轨 `< 3 KB`，组件样式 100% 收敛在 Shadow 内 | 释放双重样式内存，零宿主污染 |

---

## 🚫 核心技术红线与方案辨析

1. **坚决否决 Tailwind CSS**：
   - 违反 SleazyFork/GreasyFork 单文件、无混淆（`mangle: false`）、1.0MB 安全线约束；
   - 杜绝通用原子类（`.flex`, `.text-sm`）在宿主页面非 Shadow DOM 元素引发的全局污染；
   - 保持 100% 原生现代 CSS + Apple 风格语义化命名（`mp-` 前缀）。
2. **严禁无差别 PurgeCSS**：
   - 针对 Miss Player 95% DOM 节点由运行时动态组装的特性，采用自研 AST 扫描脚本（`scripts/audit-css.js`）+ Chrome Coverage 组合排查，杜绝运行时样式假阳性误删。
3. **严格动静样式分离判定**：
   - **伪动态（严禁）**：`el.style.display`、`el.style.position`、`el.style.gap`、`el.style.flexDirection`；
   - **真动态（允许）**：`progressBar.style.transform`、`translate3d` 手势拖拽、`marker.style.left = ...%`、`setProperty('--keyboard-height', ...)`。

---

## 🗺️ 五步实施路线图与任务清单

### Step 0: 宪法对齐与规范回写 (已达成 ✅)
- [x] 在 `AGENTS.md` 中新增 `## 💅 CSS 架构与样式治理准则 (CSS Governance & Architecture)`；
- [x] 确立 Tailwind 禁令、行内样式禁令、动静分离契约与 Z-Index 标尺；
- [x] 确立 Shadow DOM 与宿主双轨分层架构蓝图；
- [x] 拆分 `TODO.md` 巨石文档为模块化索引结构。

---

### Step 1: 静态摸排与数据量化 (已达成 ✅)
> **目标**：不触碰业务逻辑，通过自动化只读工具摸清全部冗余与依赖关系。

- [x] **1.1 开发样式审计脚本 `scripts/audit-css.js`**
  - [x] 提取 9 个 CSS 文件中的全部选择器集合；
  - [x] 扫描 `src/**/*.js` 的 AST / 正则表达式，分析选择器引用热度；
  - [x] 输出《0 引用死代码候选清单》与《高频重复选择器清单》（生成于 `000.BUG_memo/css-audit-*`）。
- [x] **1.2 确认并标记历史包袱代码**
  - [x] 对比 `_landscape_legacy.css` (161行) 与 `_landscape_pc.css`，确定可安全剔除的重复媒体查询与 5% 黄金规则；
  - [x] 审查 `_player.css` (第 276-650 行) 设置面板样式，精准厘清已废弃旧菜单与仍被调用的活组件；
  - [x] 定位散落在 5 处文件中的 `:root, :host` 重复声明。
- [x] **1.3 Chrome DevTools Coverage 实机动态覆盖率核验与动静分类完毕**
  - [x] 完成 116 处 HTML 内嵌 `style="..."` 与 442 处 `el.style` 动静分类清单。

---

### Step 3: 架构解耦与设计系统收拢 (CSS 文件拓扑重构与 !important 治理 - 已达成 ✅)
> **目标**：拆解 3,000 行巨石，消除 946 处 `!important`，理顺 Shadow DOM 与宿主样式的关系。

- [x] **3.1 建立设计系统 Tokens 与层级标尺**
  - [x] 落成 `00_tokens/_tokens.css`：统一 Apple 纯黑底色、毛玻璃饱和度滤镜、圆角与莫兰迪色彩序列；
  - [x] 落成 `00_tokens/_zindex.css`：建立 10~60 级 Z-Index 标尺（`--z-player-base` ~ `--z-toast`），消灭魔法数字。
- [x] **3.2 横屏响应式统一合并与 legacy 退役**
  - [x] 废弃并移除 `_landscape_legacy.css`（削减 161 行，消除 38 处 `!important`）；
  - [x] 将矮屏 480px 紧凑优化与安全区避让黄金规则合入 `_landscape_pc.css`。
- [x] **3.3 解构 3,000 行巨石 `_player.css`**
  - [x] 剪除旧版菜单与废弃开关样式（削减 133 行）；
  - [x] 剥离 A-B 点高光片段底栏样式至 `02_components/_marker_sheet.css`（468 行）；
  - [x] 剥离精简调试面板样式至 `02_components/_debug.css`（127 行）；
  - [x] `_player.css` 体积大幅瘦身。
- [x] **3.4 全面清洗 900+ 处 `!important` (降幅达 90%)**
  - [x] `_controls.css`：从 384 处剧降至 6 处；
  - [x] `_landscape_pc.css`：从 294 处剧降至 14 处；
  - [x] `_player.css`：从 210 处剧降至 16 处；
  - [x] 仅保留 16 处必要的物理隔离与宿主防御性规则。
- [x] **3.5 实现宿主与 Shadow DOM 样式双轨分离 (释放 150KB 内存)**
  - [x] 建立 `01_core/_host.css`（仅 2.7 KB，包含浮动按钮与 body 状态类）；
  - [x] 改造 `src/index.js` 仅导入轻量 `_host.css` 注入宿主 `<head>`；
  - [x] 全量播放器样式组件 100% 收敛于 Shadow DOM 内部解析渲染。

---

### Step 4: 工程化防线建设与 CI 门禁 (已达成 ✅)
> **目标**：通过工具和 CI 门禁彻底固化规则，杜绝劣质样式再次流入代码库。

- [x] **4.1 配置 CSS 架构静态守卫规则**
  - [x] 限制选择器嵌套最大深度（≤ 3 层，PostCSS AST 扫描）；
  - [x] 锁定 `!important` 数量（基准上限 98 处，任何新增强制阻断）；
  - [x] 检查 JS 模板内联样式（上限 20 处，严禁任何牛皮癣回潮）。
- [x] **4.2 接入 CI 自动化流水线 (`npm run ci:check`)**
  - [x] 在 `scripts/compliance-lint.js` 中接入第 5 步《CSS 架构规范与内联样式防御》；
  - [x] 任何超标或违规均自动阻断发布。
- [x] **4.3 性能与体积双重回归验证**
  - [x] 运行 `npm run test:perf` 确认重构后 0 渲染阻塞与零长任务（启动仅 115ms）；
  - [x] 运行 `npm run build` 确保 dist 单文件体积保持在合规安全线（953 KiB < 1.0MB）。
