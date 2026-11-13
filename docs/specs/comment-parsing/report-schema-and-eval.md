# 用户上报机制评估、Report v2 改进方案与全量语料评测报告

---

## 1. 41 条 Supabase `comment_reports` 原始分布诊断

在改进前，从生产 Supabase 拉取全部 41 条真实用户上报记录（时间跨度：`2026-09-25` ~ `2026-11-13`），按根因聚类如下：

| 根因簇 | 占比与条数 | 典型上报案例 |
| :--- | :---: | :--- |
| **中文/小数/星级评分误判时间戳** | 13 条 (31.7%) | `【9分】`、`5分！`、`颜 7 分左右`、`4分半吧`、`题材5分...无中出1分`、`5⭐`、`打5分` |
| **动作持续时长 / 成语 / 日期 / 现实钟点误判** | 8 条 (19.5%) | `连续25秒`、`时间不足20分钟`、`1秒不落`、`#2026.8.11`、`早上5点半`、`2.6发推`、`1.5g`、`5.6發` |
| **非标准时间戳漏抓或截断** | 8 条 (19.5%) | `28:10 本片`、`一小时40分钟`、`45min`、`1h47min30`、`0-44-59`、`2:02.34`、`1:46:00—1:47:45`、`2时45分` |
| **噪点 / 体位 / 黑话误抓** | 5 条 (12.2%) | `.2 ..8 ....5/6`、`1/1 0/1`、`69式`、`高潮6啊`、`1.42.` |
| **倒计时误判** | 2 条 (4.9%) | `2:29:25 vs 2:29:15`、评分降序误触发倒计时 |
| **水贴 / 残缺番号污染 / 待查** | 5 条 (12.2%) | `1513，1170，293`（生成 `IPX-811-1513`）、`feed18940...PFES-118` 等 |

---

## 2. 旧版 Report 方案缺陷分析

通过审查旧版 `CommentReportModal.js`、`SupabaseService.js` 及 `20260924000004_fix_comment_reports_rls.sql`，发现以下 6 项严重信息损失：

1. **丢弃关键状态现场**：弹窗虽在本地组装了 `timestamps` 与 `reportedAt`，但 `SupabaseService.submitCommentReport` 仅向 `submit_comment_report` RPC 传入 6 个参数（`p_avcode, p_comment_id, p_user_name, p_comment_text, p_reason, p_user_note`），导致 **“当时解析出了什么时间戳/番号”、“是否触发了倒计时换算”、“实际影片时长是多少”** 在云端全部丢失。
2. **缺失环境维度**：未记录 `script_version`（无法判断上报来自旧版本还是当前最新版）与 `source_site`（无法区分 Jable / JavDB / MissAV 来源差异）。
3. **缺少结构化分类与期望答案**：4 个硬编码中文 Chip 缺少稳定枚举 `reason_code`，且未涵盖**“番号有误”**；用户缺少输入期望时间/番号的专用引导，导致大量 `user_note` 为空（如仅选“时间解析错误”却不知哪段错、期望是什么）。
4. **前端无多语言适配与防重复提交**：文案硬编码中文，且同一用户多次误点会产生重复脏记录。
5. **未联动 `CommentPanel` 上下文**：未传递当前视频 `videoDuration` 与 `sourceSite`。

---

## 3. Report v2 升级落地方案

### 3.1 数据库层 (`supabase/migrations/20261113000000_upgrade_comment_reports.sql`)
- 在 `public.comment_reports` 增量扩展 8 个字段：
  - `reason_code text`（结构化分类：`false_timestamp` / `missed_or_wrong_time` / `countdown_error` / `avcode_error` / `spam_missed`）
  - `script_version text`
  - `source_site text`
  - `video_duration integer`
  - `parser_snapshot jsonb`（完整记录 `timestamps[]`、`avcodes[]`、`isCountdown`、`countdownApplied`、`spam`、`flaggedItems[]`）
  - `expected_hint text`（用户填写的期望时间或番号）
  - `status text default 'open'` & `fixed_in_version text`（便于闭环追踪修复状态）
- 升级 `submit_comment_report` 至 12 参数，后 6 个参数均设置 `DEFAULT NULL`，100% 向后兼容旧版客户端。

### 3.2 服务层零停机双轨降级 (`src/services/SupabaseService.js`)
由于生产数据库 Migration 需待推送 `main` 分支触发 `.github/workflows/supabase.yml` 后生效，客户端实现**无损前向兼容**：
1. 优先请求 12 参数 RPC v2；
2. 若远程库尚未迁移（404/400），自动降级为原 6 参数 RPC v1，并将结构化诊断摘要无损附注至 `p_user_note`：
   ```text
   [diag: type=missed_or_wrong_time | v=5.7.118-beta.030 | site=jable | dur=7200s | expect=28:10 | ts=[28:10->1690(L1)] | av=[IPX-398] | flagged=[ts:28:10]]
   ```

### 3.3 交互式诊断前端 (`src/player/comments/CommentReportModal.js`)
- 展示「**当前识别结果（点击可标记误判项）**」诊断胶囊区：用户轻触误识别的时间戳或番号胶囊即可标红（写入 `flaggedItems`）；
- 新增期望时间/番号单行输入框（保持 `16px` 字号防止 iOS Safari 聚焦自动放大视口）；
- 全量补齐 5 种语言国际化（`en` / `zh-CN` / `zh-TW` / `ja` / `vi`）及会话级去重保护。

---

## 4. Phase 22 V3.3 实测指标与服务端去重升级

在完成专家评审提出的 Stage A/B/C 改造后，已于 `CommentDataPipeline.js` 与 `supabase/migrations/20261113000001_dedup_comment_reports.sql` 落地以下收敛成果：

### 4.1 141 条黄金评测集门禁（`npm run eval:comments`）
- **数据源**：`tests/fixtures/comment-pipeline-gold.json`（完整覆盖 41 条线上上报 + 18 条错题本 + 真实库正负样本 + 7 条真机截图实测修复样本）
- **实测结果**：
  - **时间戳识别**：**Precision = 100.00%, Recall = 100.00%, F0.5 = 100.00%**
  - **番号提取（含同系列尾号）**：**Precision = 100.00%, Recall = 100.00%, F0.5 = 100.00%**
  - **倒计时判定**：**FPR = 0.00%, Accuracy = 100.00%**

### 4.2 31,685 条生产语料全量跑测对比
| 指标项 | 基准旧版 | Beta.030 (V3.2) | Phase 22 V3.3 | 变化幅度 |
| :--- | :---: | :---: | :---: | :---: |
| `L5` 孤立/斜杠兜底命中 | 235 | 56 | **41** | **-82.6%** |
| 同系列尾号上下文推导 (`ctxAv`) | 224 | 94 | **86** | **-61.6%** |
| 31,685 条全量解析总耗时 | — | — | **768 ms** (~24 µs/条) | 模块级正则预编译 |

### 4.3 Report v2 去重与计数聚合 (`20261113000001_dedup_comment_reports.sql`)
- 新增 `report_fingerprint`（`md5(upper(avcode)|md5(comment_text)|reason_code)` 唯一索引）与 `report_count`；
- 重复点击或不同用户针对同一评论提交的同类上报自动合并计数（`report_count = report_count + 1`）并刷新最新诊断快照，消除 `CAWD-796` 式重复脏数据。

---

## 5. 专家评审历史建议与落地状态

结合 `error-book.md` Part B 实测残余，专家评审提出的核心演进项已落地状态如下：

1. **[已落地] 消除 `R-01 ~ R-03` 抢占冲突（Pipeline 四层重排序）**：`L1~L4` ➔ `extractAVCodes` ➔ `L5`；
2. **[已落地] 修复 `R-18` `H:MM` vs `MM:SS` 尺度断裂 (`2:28, 3:03`)**：新增 `calibrateTwoPartCandidates()` 序列同量纲一致性校准；
3. **[已落地] 补全 `R-15` 中文带“零”复合时间与 `R-16` 三围掩码**：已支持 `一小时零四分40秒` 与 `84-58-85`；
4. **[已落地] 基于 Report v2 与 41 条线上上报建立 134 条黄金集门禁**：已接入 `npm run ci:check` 4.24 阻断门禁。
