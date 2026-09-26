# 06: 云端同步与关于板块垂直切片 (Cloud Sync & About Vertical Slice)

**What to build:** 端到端实现第 3 分段「云端同步 (WebDAV)」与第 5 分段「关于与更新」。采用 IntersectionObserver 视口延迟水合，包含 WebDAV 实时连接状态指示灯、凭据安全保存与测试联动、SleazyFork 版本比对徽章与本地存储统计表格。

**Blocked by:** 04: 分块流式装配调度器 (Chunked Streaming Hydration Engine)

**Status:** completed

- [x] 完成 CloudSyncSection 与 AboutSection 业务组件开发，并支持视口接近时懒加载水合。
- [x] WebDAV 卡片展示实时状态指示灯（已连接 / 未配置 / 错误 / 同步中），输入服务器、用户名、密码后具备一键保存与测试连接反馈。
- [x] 保留手动增量同步与冲突覆盖策略操作入口，同步日志支持折叠与状态提示。
- [x] 关于卡片展示脚本最新版本与当前版本徽章对比、SleazyFork 官方源跳转外链、自动检查更新开关。
- [x] 展示运行时本地存储（IndexedDB / GM 存储）空间占用与胶囊统计小部件。
