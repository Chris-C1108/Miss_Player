# Miss Player 评论解析与纠错上报体系 · 专家评审资料总览

> **适用版本**：`v5.7.118-beta.030`（Commit `fb27094`，`dev` 分支）  
> **核心源码**：`src/player/comments/CommentDataPipeline.js`、`src/player/controls/CommentPanel.js`、`src/player/comments/CommentReportModal.js`、`src/services/SupabaseService.js`  
> **回归测试**：`tests/comment-pipeline-reports.test.mjs`（已接入 `npm run ci:check` 步骤 4.24）

---

## 1. 文档导航

| 文档 | 内容定位 | 适用读者 |
| :--- | :--- | :--- |
| [parsing-logic-spec.md](./parsing-logic-spec.md) | 端到端 5 阶段解析管线完整技术规范（垃圾分类、5 级时间戳解析、倒计时逆序换算、显式与同系列残缺番号识别、HTML 高亮与调用链契约）及真实正向案例 | 算法 / NLP / 前端架构评审专家 |
| [error-book.md](./error-book.md) | **核心错题本**：Part A 收录 Supabase 41 条用户上报及历史高发误判/漏抓的根因与修复方案；Part B 实测暴露 `v5.7.118-beta.030` 在 31,685 条真实评论中仍残余的边界错题与下阶段重构靶点 | 算法审计 / 测试 / 产品评审专家 |
| [report-schema-and-eval.md](./report-schema-and-eval.md) | 41 条真实用户上报分类统计、旧版 Report 机制缺陷复盘、Report v2 数据库 Migration + 交互式诊断弹窗 + 零停机兼容方案，以及全量语料量化对比 | 数据工程 / 后端 / 运维评审专家 |

---

## 2. 端到端处理管线总图

```text
原始评论文本 (rawText) + 当前视频番号 (videoCode) + 物理时长 (videoDuration)
   │
   ▼
[Stage 0] normalizeText() & [quote] 引用剥离
   │  全角数字/冒号转半角，剥离论坛引用块避免引用楼层干扰
   ▼
[Stage 1] classifyComment() — 垃圾与水贴拦截 (SPAM / HAM)
   │  AD_CONTACT / HARASSMENT_DOXXING / FRIEND_TAG_MEME / COPYPASTA / TECHNICAL_NOISE / LOW_QUALITY
   ▼ (HAM 继续解析)
[Stage 2] parseTimestamps() — 5 级时间戳解析流水线
   │  1) maskBlacklist()            边界守卫屏蔽评分/日期/量词/成语 + 中文小时数字映射
   │  2) extractCandidates()        L1(冒号) -> L2(点分) -> L3(中文/单位) -> L5(斜杠/孤立)
   │  3) resolveOverlaps()          高置信度优先贪心去重
   │  4) mergeRanges()              区间连接 (~ - — 到 至) 合并为 L4
   │  5) validateMatch()            播放速度/动作时长/评分/L5锚点校验 & 倒计时正负号保留
   ▼
[Stage 3] extractAVCodes() — 显式番号 + 同系列残缺尾号补全
   │  1) parseSeriesContext()       从 "IPX-811" 规范拆出 seriesPrefix="IPX", digitLen=3
   │  2) maskForAvCodeScan()        屏蔽 URL / 磁力链 / {{PERSON_*}} / BBCode
   │  3) 显式提取 (oRegExp*)        有码 / 无码 / 串联("DDSC-031、036" / "SSIS-465與437")
   │  4) 同系列残缺尾号补全         排除显式占用区间 & 时间戳区间 -> 同位数 + 语义守卫
   ▼
[Stage 4] isCountdownComment & applyCommentCountdown()
   │  识别 -HH:MM:SS 或严格降序区间/序列(span>=30s且无正序区间反证) -> T_actual = D - T_raw
   ▼
[Stage 5] highlightCommentText() & CommentReportModal v2
      生成可点击跳转/收藏的时间胶囊与番号预览链接；支持诊断胶囊标红上报
```

---

## 3. 全量实测基线 vs 优化后对比 (`v5.7.118-beta.030`)

评测样本：Supabase `comment_reports` 全量 **41 条**真实用户纠错上报 + `video_comments_bundle` 全量 **1,464 个番号 / 31,685 条真实评论**（其中含数字评论 **4,765 条**）。

| 评测维度 | 优化前 (Baseline) | 优化后 (`v5.7.118-beta.030`) | 变化与结论 |
| :--- | :---: | :---: | :--- |
| **Supabase 41 条真实上报通过率** | 存在 30+ 项已知误报/漏抓/错算 | **41 / 41 (100%)** | 全部报告案例实测修正通过 |
| **L5 孤立数字时间戳命中数** | 235 | **56 (-76.2%)** | 评分、身高、体位、年份、噪点大幅清除 |
| **上下文残缺番号命中评论数** | 224 | **94 (-58.0%)** | `IPX-811-1513` 畸形拼接归零；身高/2486/4位数刷屏清除 |
| **L2 1 位小数误报数 (`\d+\.\d`)** | 47 | **0 (-100%)** | `9.7`、`3.5`、`2.6` 等评分/日期误报彻底清零 |
| **L4 区间命中数** | 168 | **129 (-23.2%)** | 清除 `..5/6`、`1.39.00-1尾` 等断裂误并，保留 `—` 区间 |
| **L3 中文/单位时间戳命中数** | 454 | **458 (+4)** | 新增 `一小时40分钟`/`45min`/`1h47min30`，剔除 `<=10分` 评分 |

---

## 4. 提请专家重点审查的 5 个架构议题

1. **阶段顺序冲突 (`parseTimestamps` 先于 `extractAVCodes`)**：当前管线先执行 `parseTimestamps` 再将 `timestampSpans` 排除出 `extractAVCodes`。在 `"398是梦开始的地方"`（`IPX-451`）中，`L5` 先行把 `398` 抢走，导致同系列番号 `IPX-398` 漏抓。**建议评估**：将“高置信度同系列番号识别”或 `L1~L4` 与 `L5` 分离，让番号提取先于 `L5` 兜底孤立数字执行。
2. **`validationDuration = Math.max(videoDuration, 28800)` 的 8 小时宽松兜底**：当宿主视频真实时长尚未就绪（默认 `10800s`）时，8 小时阈值导致 `398`（`23880s`）等 3 位数通过时长校验并落入 `L5`。**建议评估**：对 `L5` 收紧独立时长上限（如 `<= Math.min(videoDuration, 14400)` 或仅允许 `< 240` 分钟）。
3. **无词库条件下的跨系列无前缀数字消歧**：如 `SNOS-334` 下出现 `"比肩811"`，用户实际指代行业公认名作 `IPX-811` 而非 `SNOS-811`；在无全网番号目录索引的纯客户端模式下，如何设计高频跨系列名作白名单或置信度分级。
4. **`L5` 与持续时长/年龄/三围的模式竞争**：`56` 条 `L5` 残余中仍含 `23`（`在23开始`）、`50`（`前50`）、`80`（`很棒80`）、`145/232/256`（番号斜杠列表），`260` 条 `isCountdownComment` 中仍混入 `150min / 120min`（片长对比）、`84 - 58 - 85`（三围）及 `2:28, 3:03`（非倒序正序微差）。
5. **Report v2 诊断闭环与自动回归生成**：新增 `parser_snapshot` + `flaggedItems` + `expected_hint` 后，后续可直接从 Supabase 拉取高置信度错题自动生成 `tests/` 回归用例集。
