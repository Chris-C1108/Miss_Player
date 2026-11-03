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

---

## 🏗️ 正在实施：Phase 16 - 全局输入框与双模层叠上下文架构重构

> **目标**：彻底消灭宿主侵入遮挡、移动端虚拟键盘穿透闪跳、各组件魔法 Z-Index 打架及 PC 宽屏 Web 端逻辑错位问题，建立现代化微前端层叠与输入架构。

- [x] **16.1 外部宿主防线与生存隔离 (External Stacking Defense) (已达成 ✅)**
  - [x] 宿主 Body 物理坍塌（`display: none !important`）与动态注入 `MutationObserver` 守卫；
  - [x] `<miss-player-root>` 宿主轨与播放器外壳固定层级确立为次极限值 `z-index: 2147483646`，浮动唤醒按钮确立为 `2147483640`，绝对压制第三方流氓挂件（如 Peach JAV `2147483647`）。
- [x] **16.2 内部王国 Z-Index 标尺收敛 (Internal Tokens Governance) (已达成 ✅)**
  - [x] 收敛 `src/player/ui/styles/00_tokens/_zindex.css`，正式固化内外两界与 10~60 规范步进标尺：
    `--z-base: 10` ➔ `--z-controls: 20` ➔ `--z-drawer: 30` ➔ `--z-composer: 40` ➔ `--z-modal: 50` ➔ `--z-toast: 60`；
  - [x] 全量清洗各组件样式（`_player.css`, `_comments.css`, `_controls.css`, `_landscape_pc.css`, `_common.css`, `_settings_apple.css`, `_marker_sheet.css` 等）中的散落魔法数字（9985, 9990, 9997, 9998, 100000, 100004, 100005, 2000000020, 2000000050 等），统一映射至 `--z-*`。
- [x] **16.3 DOM 拓扑解耦与分层插槽拍平 (Viewport Slot Routing) (已达成 ✅)**
  - [x] 发评底栏抽屉（`.tm-comment-submit-bar-wrapper`）与半透明遮罩从局部滚动容器 `.tm-comments-panel` 迁出，直接挂载到 `.tm-player-container` 根级插槽，彻底摆脱父级盒模型与 `overflow: hidden` 裁剪；
  - [x] 高光切片管理底栏（`.tm-bottom-sheet-panel`）彻底脱离单手控制栏 `transform` 隔离区，挂载在顶级插槽享受全宽；
  - [x] 打点即时备注气泡（`.tm-inline-remark-popover`）脱离控制栏，挂载至顶级并在上半区黄金带居中展示。
- [x] **16.4 双模响应式端态自适应分流 (Dual-Mode Responsive Adaptation) (已达成 ✅)**
  - [x] **移动端竖屏**：发评底栏全宽吸底、随虚拟键盘物理平移、触控 Pre-Lift 预升降 0 毫秒阻断 Safari 滚动扫描；
  - [x] **PC 宽屏 Web 端**：发评底栏严格嵌合在右侧 380px 边栏最底部（`bottom: 0px !important; width: var(--sidebar-width);`），严禁横跨全屏侵犯左侧视频主舞台；双栏鼠标可并行交互。
- [x] **16.5 活动层状态机与声明式防穿透锁 (Active Layer Pointer Guard) (已达成 ✅)**
  - [x] 建立 `.has-composer-active` 容器状态类联动机制；
  - [x] 声明式在移动触控下禁用底层非活动区 `pointer-events: none`，消除长达 12 项的脆弱 JS `closest` 白名单，彻底杜绝打字与选词时的误触收起与点击穿透；
  - [x] 桌面端保持 `pointer-events: auto`，保障键鼠并行操作体验。
- [x] **16.6 自动化门禁巡检、构建体积审计与发版验证 (已达成 ✅)**
  - [x] 运行 `npm run lint:compliance` 与 `npm run ci:check` 确保全项 100% 通过（!important 保持 97 处低位，14 项单元测试全过）；
  - [x] `npm run bump` 发版并推送 GitHub `main` 分支。

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
