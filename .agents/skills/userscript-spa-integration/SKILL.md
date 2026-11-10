---
name: userscript-spa-integration
description: 油猴脚本 (Userscript) 与现代单页应用 (SPA) 深度集成、Shadow DOM 隔离、Top Layer 穿透、生命周期感知与容灾存储最佳实践。
---

# Userscript & SPA 深度集成规范 (Userscript SPA Integration)

本规范总结了 Miss Player 在复杂多域名第三方宿主（Jable、MissAV、Peach Web、JavDB 等）以及现代 SPA 单页应用中长期运行沉淀的实战架构法则。

---

## 1. SPA 单页路由与长效生命周期感知 (SPA Lifecycle)

现代单页应用（Vue / React / Angular 等）页面切换不触发整页刷新，仅通过 History API 或局部 DOM 替换。纯一次性 `DOMContentLoaded` 脚本注入必然在用户导航、切卡片或关闭弹窗后失活。

### 核心实践：
1. **轻量心跳巡检与动态挂载 (Heartbeat Watcher)**：
   - 针对 SPA 浮动挂件（如呼出播放器的悬浮按钮），建立 2.0~3.0 秒长效巡检定时器；
   - 检查挂件节点是否仍处于 `isConnected` 状态，若被宿主路由替换移出 DOM，立即重新装填挂载；
   - 严格避免频繁轮询产生 CPU 消耗：心跳间隔内先检测轻量标志（`isConnected`），仅在脱落时执行重建。
2. **HTML5 `<dialog>` 与 Top Layer 状态监听**：
   - 原生 `<dialog>` 弹窗通过 `showModal()` 打开后进入浏览器的 Top Layer，会压制处于普通层级的元素；
   - **反模式**：仅通过 `MutationObserver` 监听 `childList` 无法感知 `dialog` 的打开与关闭（因为原生属性改变不触发子树变更）；
   - **最佳实践**：
     - 在 `MutationObserver` 中必须显式声明 `attributeFilter: ['open', 'src']`；
     - 必须在捕获阶段监听全局原生 `close` 与 `cancel` 事件：
       ```javascript
       document.addEventListener('close', (e) => this._onDialogChange(e), true);
       document.addEventListener('cancel', (e) => this._onDialogChange(e), true);
       ```
3. **宿主模态内无损隐藏与 Layout 保全**：
   - 当播放器全屏激活需要隐藏宿主打开的 `<dialog>` 时，**严禁对宿主内部节点使用 `display: none !important`**，这会导致元素尺寸瞬间归零，若宿主挂载了 `ResizeObserver` 会引发严重的状态重置与崩溃；
   - **最佳实践**：使用 `visibility: hidden !important; pointer-events: none !important;`，既能彻底隐藏画面并阻断事件响应，又能保留 100% 原始布局尺寸。

---

## 2. Shadow DOM 隔离与跨边界事件穿透 (Shadow DOM Boundary)

油猴脚本必须通过 Web Components `<miss-player-root>` 配合 Closed/Open Shadow DOM 将自身全量 UI 封装，防止宿主页面的 CSS 污染自身，也防止自身样式泄漏破坏宿主。

### 核心实践：
1. **穿透探测严禁使用 `e.target.closest()`**：
   - 在宿主 `document` 或顶层容器上监听全局事件（如外部点击关闭弹窗、手势判定）时，如果事件源自 Shadow DOM 内部，浏览器事件模型会自动将 `e.target` 重定向为宿主自定义标签 `<miss-player-root>`；
   - 直接调用 `e.target.closest('.tm-settings-panel')` 必然返回 `null`，引发误判；
   - **最佳实践**：必须使用 `e.composedPath()` 遍历完整的跨边界事件路径：
     ```javascript
     const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
     const isInsideTarget = path.some(el => el instanceof HTMLElement && el.classList.contains('tm-settings-panel'));
     ```
2. **Web Components 媒体容器抢救与归还**：
   - 宿主页面若是 Web Components（如 `<hlsjs-video>`, `<dash-video>`, `<mux-video>`），其内部的 `<video slot="media">` 与外层自定义元素存在强插槽与 MSE 流绑定；
   - **反模式**：播放器接管时直接把内部 `<video>` 剥离并追加到自己容器，退出时又把裸 `<video>` 塞回宿主；此举会破坏 slot 绑定，导致播放器黑屏与断流；
   - **最佳实践**：接管与归还时，优先查找最外层媒体宿主：
     ```javascript
     const mountHost = innerVideo.closest('hlsjs-video, dash-video, mux-video, [data-media-host]');
     const targetToMount = mountHost || innerVideo;
     ```

---

## 3. 存储灾备双写与版本一致性 (Storage & Versioning)

油猴管理器存储（`GM_getValue`）在不同扩展（Tampermonkey / Violentmonkey / Stay / ScriptCat）中具有不同的沙箱隔离策略，极端情况下存在跨域丢失风险。

### 核心实践：
1. **三级降级存储管道**：
   - 优先读写 `GM_getValue / GM_setValue`；
   - 次级降级至同源 `localStorage`；
   - 大体积结构化数据（如播放热度图、多集切片缓存）写入 `IndexedDB`；
2. **核心红线元数据保护**：
   - `@namespace`: 永久保持不变（如 `loadingi.local`），管理器以 `(@namespace, @name)` 为主键维护版本生命周期；
   - `@name`: 脚本主名称严禁漂移；
   - 发版必须严格执行多处版本号强同步（`package.json`, `webpack.config.js`, Fallback 常量）。
