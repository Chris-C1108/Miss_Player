# 04: 分块流式装配调度器 (Chunked Streaming Hydration Engine)

**What to build:** 构建流式分块异步调度核心。首屏呼出时仅同步渲染 Ticket 02 (首分段)，而将 Ticket 03 及后续重型卡片交由 requestIdleCallback 异步流式追加，并在未渲染区域放置轻量骨架屏。

**Blocked by:** 02: 控制与手势板块垂直切片 (Playback & Controls Vertical Slice), 03: 评论区与数据源板块垂直切片 (Comments & Data Sources Vertical Slice)

**Status:** completed

- [x] 实现分块流式装配调度器 (SettingsStreamScheduler)，解耦同步挂载与异步水合逻辑。
- [x] 点击设置齿轮时，主线程仅同步挂载 Section 1 (PlaybackSection) 与轻量骨架屏，首屏挂载耗时严格控制在 <= 3ms 内（DOM 节点 < 30 个）。
- [x] 利用 requestIdleCallback 在浏览器空闲时段依次无感追加后续分段，主线程长任务为 0ms。
- [x] 针对下部重型卡片（如 WebDAV 与关于卡片），建立基于 IntersectionObserver 的视口触碰水合探针。
- [x] 全流式装配过程无布局抖动 (Zero Layout Shift)。
