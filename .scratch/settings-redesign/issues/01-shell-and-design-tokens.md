# 01: 设置面板基础框架与 Apple Inset-Grouped 样式系统 (Shell & Design Tokens)

**What to build:** 建立设置面板的现代化微模块架构目录与基础卡片样式系统（AppleCard 与 ToggleRow 原型）。构建轻量门面容器，使点击设置按钮时能够瞬间弹出一个空态、带毛玻璃背景且符合 Apple Inset-Grouped 质感的现代外壳。

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] 在 `src/player/managers/settings/` 建立解耦微模块骨架与门面容器入口。
- [x] 注入符合 Apple Inset-Grouped 设计哲学的 CSS 变量、毛玻璃卡片（AppleCard）与行容器（ToggleRow）基础样式。
- [x] 点击控制面板设置齿轮按钮，在 <= 3ms 内挂载并以 60fps GPU 位移动效唤起设置面板。
- [x] 点击面板外部半透明遮罩或按 ESC 键能够平滑关闭面板，并销毁全局监听器。
