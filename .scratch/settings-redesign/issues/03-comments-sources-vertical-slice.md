# 03: 评论区与数据源板块垂直切片 (Comments & Data Sources Vertical Slice)

**What to build:** 端到端实现第 2 分段「评论与数据」。包含评论区总展示开关、多数据源（Jable / JavDB / JavLibrary）独立勾选、数字/时间戳评论过滤器以及数据源开启时的子面板平滑折叠展开。

**Blocked by:** 01: 设置面板基础框架与 Apple Inset-Grouped 样式系统 (Shell & Design Tokens)

**Status:** completed

- [x] 完成 CommentsSection 业务分段组件开发并挂载。
- [x] 实现“是否展示评论区”总开关与宿主侧边栏的局部显隐联动，切换时不发生界面全量重刷与滚动跳跃。
- [x] 实现 Jable、JavDB、JavLibrary 三大数据源的独立勾选 Badge 矩阵，勾选状态即时更新抓取策略。
- [x] 集成数字/时间戳评论过滤器开关，开启时联动 CommentPanel 仅保留带时间线评论。
- [x] 所有评论设置项双向绑定响应式状态机并持久化。
