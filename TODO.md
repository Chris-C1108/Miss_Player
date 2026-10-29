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
| **Phase 15** | **UI/UX 深度优化与第三方脚本适配专项 (v5.7.1 ~ v5.7.2)** | **达成 ✅** | 详见 Release v5.7.2 |

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
