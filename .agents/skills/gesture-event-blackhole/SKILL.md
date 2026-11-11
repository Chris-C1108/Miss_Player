---
name: gesture-event-blackhole
description: 移动端手势冲突消解、系统级全局事件黑洞、底层树物理冻结、长按穿透根治与 iOS 虚拟键盘 visualViewport 适配最佳实践。
---

# 移动端手势隔离与全局事件黑洞规范 (Gesture Event Blackhole)

在移动端浏览器（尤其是 iOS WebKit / Safari Stay）中，复杂的 UI 层叠（视频、手柄、抽屉、输入框、模态面板）极易发生手势冲突、长按误触（触发 Stay 视频下载）、视口弹性推移及键盘遮挡。本规范提供系统级的全套解决方案。

---

## 1. 系统级全局事件黑洞 (Event Blackhole Architecture)

当浮层（如设置面板、评论抽屉、标签管理面板）展示在视频区域上方时，用户手指轻微滑动或长按极易穿透到下方的 `<video>` 或宿主页面。

### 核心机制：
1. **底层 DOM 物理冻结 (Tree Freezing)**：
   - 浮层激活时，顶级状态机（`UISurfaceMachine`）必须将底层非活动区域的指针事件完全置为 `none`：
     ```javascript
     if (this.videoContainer) this.videoContainer.style.pointerEvents = 'none';
     ```
2. **事件黑洞遮罩层 (Event Sink)**：
   - 在活动浮层与底层树之间插入透明全屏事件黑洞层 `.tm-surface-event-sink`；
   - 在**捕获阶段（Capture Phase）**对所有非活动浮层的手势全部拦截并阻止默认行为与冒泡：
     ```javascript
     const blackholeEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'contextmenu', 'mousedown', 'click'];
     blackholeEvents.forEach(evtName => {
         this.eventSink.addEventListener(evtName, (e) => {
             // 仅放行活动浮层内部节点与可编辑元素
             if (this._isInsideActiveSurface(e)) return;
             e.stopPropagation();
             if (evtName !== 'touchstart') e.preventDefault();
         }, { capture: true, passive: false });
     });
     ```
   - 彻底阻断 Stay App 悬浮长按气泡、浏览器原生右键菜单、以及底层进度条的意外触发。

---

## 2. 顶级固定视口锁定与手势溢出防护 (Viewport Lock)

### 2.1 顶级容器 `touch-action: none`
- **问题**：在菜单栏或设置面板向上滑动时，滑动事件冒泡到外层容器，整个播放器被向上推起，底部露出大面积宿主空白。
- **根治方案**：
  ```css
  /* 顶级播放器容器绝对禁止整体位移与宿主橡皮筋滚动 */
  .tm-player-container {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      overflow: hidden;
      touch-action: none; /* 彻底锁定 */
  }
  ```

### 2.2 内部滚动容器专属手势白名单
- 允许纵向滚动的子容器显式声明：
  ```css
  .tm-settings-panel,
  .tm-comment-list-container {
      touch-action: pan-y;
      overscroll-behavior-y: contain; /* 阻止滚动溢出到父级 */
      -webkit-overflow-scrolling: touch;
  }
  ```
- 严格禁止在全景手势管理器中书写 `diffY < -5` 等放行上滑穿透滚动宿主的陈旧逻辑。

---

## 3. iOS 虚拟键盘 `visualViewport` 物理避让

在 iOS Safari 中，软键盘弹起不会改变 `window.innerHeight`，只会压缩 `window.visualViewport`。

### 核心机制：
1. **实时物理高度映射**：
   ```javascript
   function onViewportResize() {
       if (!window.visualViewport) return;
       const vv = window.visualViewport;
       const keyboardHeight = Math.max(0, window.innerHeight - vv.height);
       
       // 键盘弹出阈值通常为 60px
       if (keyboardHeight > 60) {
           targetBottomDrawer.style.bottom = `${keyboardHeight}px`;
       } else {
           targetBottomDrawer.style.bottom = '0px';
       }
   }
   window.visualViewport.addEventListener('resize', onViewportResize);
   window.visualViewport.addEventListener('scroll', onViewportResize);
   ```
2. **严禁在高度映射中加入条件锁**：
   - 只要 `keyboardHeight > 60`，必须无阻碍直截了当地直接设置物理 `bottom`，绝不允许被面板锁或聚焦锁提前拦截阻断。

---

## 4. 多输入框聚焦防视口跳闪 (Focus Transfer Lock)

### 核心机制：
- 当一个面板内包含多个输入框（如打点备注、用户名/密码、配置项）时，用户在输入框之间切换焦点时，浏览器会反复触发软键盘重绘与 `scrollIntoView`；
- **防跳闪规范**：
  - 调用 `input.focus({ preventScroll: true })` 杜绝原生滚动；
  - 聚焦时限制容器内部滚动偏移：只在输入框被遮挡在可视区域外时，使用轻量防抖的 `panel.scrollTo` 平滑微调，绝不可触发 `window.scrollTo`。

---

## 5. iOS WebKit 动态布局展开光标脱节 (Caret Position Desync) 根治

在 iOS Safari / WebKit 中，当输入框处于聚焦（软键盘已弹起）时，若其外层容器内突发高度动画（如向上展开抽屉、列表展开），WebKit 会缓存 0ms 时的屏幕绝对坐标，导致蓝色输入光标滞留浮空在旧位置。

### 核心机制：
1. **移除父级硬件合成层**：祖先元素严禁滥用 `will-change: transform`，避免将输入框 Caret Layer 剥离至独立纹理；
2. **输入框自立合成层**：给 `<input>` 显式设置 `transform: translateZ(0);`；
3. **分阶段微任务校准 (`realignCaret`)**：在动画过渡周期（rAF, 60ms, 180ms, 320ms）分阶段微任务重绘 Caret 矩形：
   ```javascript
   function realignCaret(input) {
       if (!input || document.activeElement !== input) return;
       const doSync = () => {
           try {
               const pos = input.selectionStart ?? input.value.length;
               input.setSelectionRange(pos, pos);
               input.blur();
               input.focus({ preventScroll: true });
           } catch (_) {}
       };
       requestAnimationFrame(doSync);
       setTimeout(doSync, 80);
       setTimeout(doSync, 200);
       setTimeout(doSync, 340);
   }
   ```

---

## 6. 收起态输入框物理禁用锁 (Disabled Physical Shield)

在移动端，抽屉收起时若仅使用 `transform: translateY(100%)` 隐藏，输入框在 DOM 中依然处于可交互状态。当用户点击底部进度条或其他控件时，iOS Safari 的触摸预测容易穿透命中隐藏输入框，或者因事件的 `e.preventDefault()` 阻止默认失焦，导致软键盘被误唤醒弹出。

### 核心机制：
1. **抽屉收起物理禁用**：
   - 抽屉收起（`closeComposer()`）时强制执行：
     ```javascript
     if (this.input) {
         this.input.blur();
         this.input.disabled = true; // 彻底物理封印
     }
     ```
   - 抽屉展开（`openComposer()`）时恢复 `this.input.disabled = false;`；
2. **CSS 渲染树剥离**：收起态类名（`.is-collapsed`）必须同时带有 `visibility: hidden !important;`；
3. **控件操作主动失焦**：在进度条点击（`handleProgressClick`）与拖拽（`startProgressDrag`）首行无条件检查并触发 `activeElement.blur()`。

---

## 7. 横屏手势上滑穿透宿主驱动 iOS Safari 原生全屏 (Safari Minimal UI)

在 iOS Safari 横屏模式下，隐藏顶部紧凑地址栏与底部工具栏（进入 Minimal UI 模式）的唯一判据是检测到宿主页面发生了真正的纵向物理滚动。

### 核心机制：
1. **横屏上滑手势放行**：
   - 全局手势拦截器在横屏上滑（`isLandscape && deltaY < 0`）时，**严禁阻止默认事件 (`e.preventDefault()`)**；
   - 并在手势移动与抬手时主动联动 `window.scrollBy` 推动宿主窗口产生微滚动位移；
2. **宿主页面横屏滚动余量**：
   - 在宿主轨 CSS 中为横屏媒体查询释放固定定位并提供微量滚动空间：
     ```css
     @media screen and (orientation: landscape) {
       html.tm-player-active,
       body.tm-player-active {
         position: static !important;
         overflow-y: scroll !important;
         -webkit-overflow-scrolling: touch !important;
         min-height: calc(100vh + 80px) !important;
       }
     }
     ```
   - 宿主页面产生微位移的一瞬间，iOS Safari 立即折叠地址栏与工具栏，进入沉浸原生全屏。

---

## 8. iOS WebKit 透明图层点击击穿与宿主输入框唤起防御 (Opaque Backing Store & Touch Bubble Guard)

### 8.1 现象与危害
在 iOS Safari 中，当全屏/半屏播放器的某个业务面板（如评论列表、说明面板）内部内容较少或留白较大，且容器背景声明为 `transparent`、外层带有 `pointer-events: none` 时：
1. WebKit 的合成器（Compositor）判定该区域**无物理实体渲染图层（Opaque Backing Store）**；
2. 用户的触摸手势会直接击穿 Shadow DOM 甚至击穿整个固定视口，命中宿主第三方页面位于该物理坐标处的原生输入框（`<input type="text">` / `<textarea>`）；
3. iOS 系统误判用户正在聚焦输入框，**直接强行弹出原生虚拟键盘**，严重破坏使用体验。

### 8.2 根治机制与三层防线
1. **Compositor 物理图层实体化 (Opaque Layer)**：
   - 业务内容承载容器严禁依赖透明背景，必须声明物理实体背景色（如 `#0b0b0e` 或深色主题色）；
   - 坚决将容器的 `pointer-events: none` 替换为 `pointer-events: auto`，在渲染树上明确声明接收并消费事件。
2. **Touch 事件非交互区域黑洞吸收 (Non-interactive StopPropagation)**：
   - 在面板容器的 `touchstart` 处理器中，对非交互控件（排除按钮、链接、文本输入框、展开折叠手柄）统一执行 `e.stopPropagation()`：
     ```javascript
     const isInteractive = !!e.target.closest('a, button, input, textarea, select, .interactive-btn, .header-toggle');
     if (!isInteractive) {
         e.stopPropagation(); // 阻止向父容器及宿主冒泡，杜绝击穿
     }
     ```
   - **绝对红线**：严禁在此处调用 `e.preventDefault()`！调用 `preventDefault()` 会破坏容器内部的原生惯性平滑滚动与橡皮筋回弹；仅阻止冒泡即可彻底阻断击穿，同时 100% 保留原生顺滑手感。


