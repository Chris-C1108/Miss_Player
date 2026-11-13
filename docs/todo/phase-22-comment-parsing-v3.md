# Phase 22：评论解析管线 V3 校准、等长掩码与黄金评测闭环

> **关联评审**：[`docs/specs/comment-parsing/README.md`](../specs/comment-parsing/README.md) · [`parsing-logic-spec.md`](../specs/comment-parsing/parsing-logic-spec.md) · [`error-book.md`](../specs/comment-parsing/error-book.md) · [`report-schema-and-eval.md`](../specs/comment-parsing/report-schema-and-eval.md)  
> **前置基线**：`v5.7.118-beta.030`（Commit `17a362b`）

---

## 🎯 核心目标

在 **纯本地零外部模型依赖、单包 < 1MB 无混淆、CSS `!important <= 50`** 的工程约束下，基于 **5 领域专家评审 + 31,685 条真实数据库评论 + 41 条 Supabase 用户上报** 的实证结果，分阶段根治错题本 Part B（`R-01 ~ R-18`）的残余结构性缺陷，并建立可量化的 `Precision / Recall / F0.5` 黄金集评测门禁。

---

## 📋 分阶段实施清单

### 阶段 A：P0 核心准确率与信号校准升级（`CommentDataPipeline.js`）
- [x] **A-1 管线四层交叉消歧重排序**：
  - 将原先「L1~L5 全部时间戳 ➔ extractAVCodes」的顺序重构为：
    1. `L1 ~ L4` 高置信度时间戳提取与 Span 锁定（`parseTimestamps(text, dur, { includeL5: false })`）；
    2. `extractAVCodes` 提取显式番号 + 同系列尾号（仅避开 `L1~L4` 区间，不再被未验证的 `L5` 抢占）；
    3. 将 `L1~L4` 区间 + 已命中番号区间合并为 `excludeSpans`，仅在剩余文本上激活 `L5`（斜杠 / 孤立数字）。
  - 已验证根治：`R-01`（`IPX-451: 398是梦开始的地方`）、`R-02`（`STARS-145: 145/232/256`）。
- [x] **A-2 两段式时间动态校准（实证修正版）**：
  - 保留中文 AV 评论 `1:41` / `1.45` 省略 `:00` 的高频习惯先验（不盲目一刀切改 `MM:SS`）；
  - 实现 `calibrateTwoPartCandidates()`：处理 `hourLimit` 边界、超片长自动降维与 **同句序列同量纲一致性校准**（无 `H:MM:SS` 锚点且跨 `hourLimit` 边界触发超片长或伪倒序时整组降维 `MM:SS`）。
  - 已验证根治：`R-18`（`IPZZ-243: 2:28, 3:03`）。
- [x] **A-3 收紧 `validationDuration` 8 小时兜底**：
  - 实现 `getValidationDuration()`：已知真实片长上限锁死为 `Math.ceil(videoDuration * 1.05)`（取消 `Math.max(..., 28800)`）；未知片长时 `L1~L4 <= 14400s`（4h），`L5 <= 10800s`（180 分钟）。
- [x] **A-4 补全 Part B 残余精准规则（`R-04` ~ `R-17`）**：
  - **R-15**：`RE_L3_HMS` / `RE_L3_HM` + `parseMinuteToken()` 支持 `一小时零四分40秒` ➔ `3880s`；
  - **R-16**：`BLACKLIST_RULES` 新增三围屏蔽（含裸体围度 `84-58-85`）；
  - **R-17**：`PRED-772: 2h13，18，30` 链式继承修复，以及 `ROYD-112` 非倒计时评论局部逆序归正 `[min, max]`；
  - **R-14**：新增片长对比屏蔽（`本来150min，现在120min`）；
  - **R-04 ~ R-11**：补齐排名（`前50`/`第N部`）、年份简写（`在23开始`）、体位（`69吃鸡`/`口交，69，后入`）、句末无单位赞美（`很棒80`）、`mentionedDateNums` 与发售月日屏蔽。

### 阶段 B：P1 等长掩码、预编译提速与精确高亮
- [x] **B-1 等长空白掩码重构（`maskBlacklist`）**：
  - 全量 `BLACKLIST_RULES` 统一采用 `padSpaceMask = (m) => ' '.repeat(m.length)`，全管线共享同一套 `[start, end)` 原文坐标。
- [x] **B-2 模块级正则预编译与 Fast-Path 短路**：
  - 将 `BLACKLIST_RULES` 与 `RE_L1_*`/`RE_L2_*`/`RE_L3_*`/`RE_L5_*` 提升至模块顶层静态常量；增加零数字 Fast-Path 短路。
- [x] **B-3 精确区间高亮、L5 视觉降噪与上报联动**：
  - `highlightCommentText` 实现 `ts.index` 距离优先匹配，对 `level === 'L5'` 追加 `.is-low-confidence`（`_comments.css` 严格 0 `!important`）；
  - `CommentReportModal.js` 新增智能默认分类预选、诊断胶囊点击自动切换分类、`pipelineVersion: 'v3'` & `commentHash` 快照。

### 阶段 C：黄金评测集门禁、全量验证与工程收敛
- [x] **C-1 黄金标注评测集与 Precision / Recall / F0.5 指标**：
  - 创建 134 条黄金集 `tests/fixtures/comment-pipeline-gold.json` 与 `scripts/eval-comment-pipeline.mjs`（`npm run eval:comments`，接入 `scripts/ci-test.js` 4.24）；
  - 实测 134 cases（44.61 ms）：时间戳 `P=100% R=100% F0.5=100%`，番号 `P=100% R=100% F0.5=100%`，倒数 `FPR=0.00% Acc=100%`；31,685 条真实库耗时 `768 ms`（~24 µs/条），`L5` 降至 `41`（-82.6%），`ctxAv` 降至 `86`（-61.6%）。
- [x] **C-2 Report v2 服务端增量去重聚合（SQL Migration）**：
  - 新增 `supabase/migrations/20261113000001_dedup_comment_reports.sql`，引入 `report_fingerprint` 唯一索引与 `report_count` 累加去重 RPC。
- [x] **C-3 文档同步与版本构筑推送**：
  - 已更新 `docs/specs/comment-parsing/`，同步晋升 `v5.7.118-beta.031` 并通过 `npm run ci:check` 与 Handoff/Lesson 归档。
