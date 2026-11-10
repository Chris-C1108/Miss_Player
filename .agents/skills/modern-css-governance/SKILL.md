---
name: modern-css-governance
description: Shadow DOM 隔离环境下的原生现代 CSS 架构、零 !important 治理、全宽盒模型闭合、Z-Index 标尺与动静分离规范。
---

# 现代 CSS 架构与样式治理规范 (Modern CSS Governance)

在多域名复杂的第三方宿主环境及油猴脚本开发中，样式混乱是导致 UI 穿透、晃动与体积失控的根源。本规范确立严格的技术禁令与架构标准。

---

## 1. 核心技术红线与禁令 (Blacklist & Hard Mandates)

### 1.1 严禁引入 Tailwind CSS 等外部大型原子化框架
- **原因**：原子类（如 `.flex`, `.text-sm`）打包进 Userscript 会急剧膨胀代码体积，且在宿主页面（尤其是非 Shadow DOM 元素）上极易引发灾难性的全局样式污染；
- **规范**：100% 采用原生现代 CSS + CSS 自定义属性（Tokens）体系。

### 1.2 严格治理 `!important` 滥用
- **原因**：Shadow DOM 内部已有天然的样式物理隔离，宿主页面的样式根本无法穿透进来，内部组件无需通过 `!important` 争夺特异度；
- **红线**：全项目 Shadow DOM 内部仅允许极少数最高优先级的全局可见性状态类使用 `!important`（如 `.is-hidden { display: none !important; }`），常规样式严禁使用；
- **门禁**：通过 CI 门禁硬性检测 `!important` 总量预算（<= 101），一旦超标强制中断构建。

### 1.3 统一 Z-Index 标尺系统，消灭魔法数字
- **禁止**：随意书写 `z-index: 2147483647`、`9999` 或 `2000000000`；
- **规范**：必须统一使用阶梯标尺变量（10 ~ 60 级）：
  - `--z-player-base: 10;` ➔ 播放器视口基础层
  - `--z-controls: 20;` ➔ 控制栏与一体化胶囊
  - `--z-sidebar: 30;` ➔ 侧边辅助条与固定抽屉
  - `--z-popover: 40;` ➔ 浮动气泡、悬浮预览
  - `--z-modal: 50;` ➔ 全屏对话框、管理面板
  - `--z-toast: 60;` ➔ 全局轻量提示 Toast

### 1.4 选择器嵌套深度严禁超过 3 层 (Nesting <= 3)
- **原因**：过深的选择器（如 `.a .b .c .d .e`）会导致 CSS 解析引擎性能急剧下降，造成移动端滚动掉帧，且破坏特异度维护性；
- **规范**：通过 BEM 或模块化语义类名扁平化结构，保持特异度轻量。

---

## 2. 盒模型闭合与防溢出契约 (Box-Sizing Enforcement)

### 2.1 全宽盒模型强制闭合
- **现象**：元素声明了 `width: 100%`，但因为带有内边距（`padding`）或边框（`border`），由于默认 `box-sizing: content-box`，实际物理宽度变为 `100% + padding*2`，撑爆父容器产生横向溢出与左右晃动；
- **规范**：凡带有内边距的 full-width 组件，必须显式声明：
  ```css
  box-sizing: border-box;
  max-width: 100%;
  ```

### 2.2 纵向滚动容器手势防横移
- **规范**：所有垂直滚动区域（如评论列表、设置抽屉、状态盒）必须显式声明：
  ```css
  touch-action: pan-y;
  overflow-x: hidden;
  overscroll-behavior-x: none;
  ```
  严禁任何触控手势穿透到底层宿主页面引发横向位移与意外晃动。

---

## 3. JS 样式动静分离契约 (Dynamic vs Static Styles Contract)

在 JS 操作 DOM 样式时，必须严格区分**真动态数学逻辑**与**伪动态表现逻辑**：

### 3.1 🔴 严禁在 JS 中操控静态表现（伪动态）
- **禁止**：
  ```javascript
  // 错误范例：在 JS 中书写 CSS 表现
  el.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
  el.style.padding = '10px 12px';
  el.style.background = 'transparent';
  el.style.border = 'none';
  ```
- **规范**：全部移入 CSS 样式表封装为语义化类名，通过 `el.classList.add('tm-apple-nested-card')` 声明式调度。

### 3.2 🟢 允许在 JS 中计算的真动态（数学物理逻辑）
- 仅限于依赖运行时瞬时物理计算的属性：
  - 动态高度计算：`container.style.height = `${clampedHeight}px`;`
  - 虚拟键盘避让：`composer.style.bottom = `${keyboardHeight}px`;`
  - Minimap 拖拽位移：`el.style.transform = `translate3d(${x}px, ${y}px, 0)`;`
- **注意**：手势释放或吸附后，必须清除行内绝对坐标，将表现归还 CSS 类。
