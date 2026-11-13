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

## 4. 专家评审后续演进建议（Roadmap Proposal）

结合 `error-book.md` Part B 实测残余，建议下一轮架构演进重点评估以下 4 项：

1. **消除 `R-01 ~ R-03` 抢占冲突（Pipeline 重排序）**：
   - 将解析管线拆为：`L1~L4` 高置信度时间提取 ➔ `extractAVCodes`（显式 + 同系列补全） ➔ `L5` 兜底孤立数字；从根源解决 `"398是梦开始的地方"` 被 `L5` 抢占。
2. **修复 `R-18` `H:MM` vs `MM:SS` 尺度断裂 Bug (`2:28, 3:03`)**：
   - `parseTwoPartTime` 目前硬编码 `a < hourLimit (3)` 即判定为 `H:MM`，导致 `"2:28, 3:03"` 被拆成 `2h28m (8880s)` 与 `3m03s (183s)` 并误触发倒计时！
   - **解法**：当同条评论内存在多组 `X:XX` 且部分 `a >= hourLimit`（或全局最大数 `< 60` 且无 `H:MM:SS` 三段式存在、且上下文连续跨度合理）时，执行**同量纲序列一致性检验**，统一按 `MM:SS` 解析为 `148s, 183s`。
3. **补全 `R-15` 中文带“零”复合时间（`一小时零四分40秒`）与 `R-16` 三围掩码**：
   - 扩展 `l3hmsRegex` / `l3hmRegex` 允许小时与分钟间出现可选 `零|又`；`maskBlacklist` 屏蔽 `三圍/三围[:：]?\s*\d{2,3}\s*[-/]\s*\d{2,3}\s*[-/]\s*\d{2,3}`。
4. **基于 Report v2 数据飞轮构建自动化回归集**：
   - 生产库收集到带 `parser_snapshot` + `expected_hint` 的新上报后，定期导出自动追加至 `tests/comment-pipeline-reports.test.mjs`。
