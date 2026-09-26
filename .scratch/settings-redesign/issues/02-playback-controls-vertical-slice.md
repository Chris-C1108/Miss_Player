# 02: 控制与手势板块垂直切片 (Playback & Controls Vertical Slice)

**What to build:** 端到端实现第 1 分段「控制与手势」。包含控制栏（进度条/快进退/循环栏）的微类名局部折叠切换（绝不销毁重建）、滑动三段式分段控制器（常规/预览/重温模式）及快进退步进药丸编辑。

**Blocked by:** 01: 设置面板基础框架与 Apple Inset-Grouped 样式系统 (Shell & Design Tokens)

**Status:** completed

- [x] 完成 PlaybackSection 业务分段组件开发并挂载至主外壳中。
- [x] 实现滑动三段式胶囊控制器 (SegmentedControl)，支持正常播放、快速预览、精彩重温一键切换与即时状态机联动。
- [x] 快进/快退栏开关切换时，通过局部类名平滑展开/折叠步进编辑子面板，彻底杜绝调用全量重绘，用户滚动条位置 100% 保持。
- [x] 实现快进步进药丸组 (SeekStepEditor) 的轻触选中与自定义增删逻辑，并即时同步主控栏跳转按钮。
- [x] 配置项（展示状态、连播模式、时长微调）实时持久化至 PlayerState 与本地存储。
