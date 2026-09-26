# 05: 实验特性与高级排错板块垂直切片 (Beta & Advanced Vertical Slice)

**What to build:** 端到端实现第 4 分段「实验室与高级工具」。整合受控实验特性（首个胶囊开播、Safari 静音、误删 60 秒撤销、深链导入、外部数据库接入）与开发者工具（日志面板开闭、爬虫预热、清空本地缓存二次确认）。

**Blocked by:** 04: 分块流式装配调度器 (Chunked Streaming Hydration Engine)

**Status:** completed

- [x] 完成 BetaSection 业务分段组件开发，并注册进流式装配调度流水线。
- [x] 严格遵从 AGENTS.md 的 Beta Feature Flag 治理规范：Beta 总开关控制全局实验子项，默认 Default OFF。
- [x] 实现开播定位首个胶囊、Safari 静音风格、胶囊 60 秒防误删撤销、深链导入等实验特性的局部受控绑定。
- [x] 实现外部 REST / Supabase 数据库地址与 API Key 输入绑定，提供失焦或回车时的保存提示。
- [x] 收敛高级开发者工具：DEBUG 模式开关、疯狂采集引擎触发、清空本地 IndexedDB 评论缓存的二次确认与异步清理反馈。
