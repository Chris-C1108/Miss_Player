# Miss Player CSS 全局静态审计与摸排报告

> 生成时间：2026-11-12T16:35:32.096Z  
> 耗时：663ms | CSS 文件数：21 | JS 扫描文件数：96  
> 对应专项任务：Phase 14 (CSS Architecture Refactor) - 子任务 A

---

## 📊 一、全局核心指标总览

| 维度指标 | 数值 | 状态/说明 |
| :--- | :--- | :--- |
| **CSS 源码总行数** | **9244** 行 | 包含 8 个子模块与 1 个入口 |
| **CSS 规则总数 (Rules)** | **1013** 条 | PostCSS 解析规则总数 |
| **独立规范化选择器数** | **1102** 个 | 拆分逗号后的单一选择器 |
| **独立 CSS 类名数** | **567** 个 | 全部样式提取的 class 集合 |
| **`!important` 标记总数** | **73** 处 | 待治理（目标 < 50 处） |
| **0 引用自研类名嫌疑** | **2** 个 | `tm-*`, `mp-*`, `jc-*`, `is-*` 零引用 |
| **Grade 1 确凿死选择器** | **0** 个 | 所含类名在 JS 中全部 0 命中 |
| **重复声明选择器数** | **93** 个 | 其中跨文件重复 **51** 个 |
| **散落 `:root, :host` 变量** | **142** 个 | 散落在 3 个文件中的全局变量 |
| **无用 Keyframes 动画** | **0** 个 | CSS 与 JS 均未调用的动画 |
| **无用 CSS 变量** | **81** 个 | 未在 `var()` 或 JS 调用的变量 |

---

## 📁 二、各 CSS 文件分布明细

| 文件路径 | 行数 | 体积 | 规则数 | 选择器数 | 类名数 | !important |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/player/ui/style.css` | 20 | 0.9 KB | 0 | 0 | 0 | **0** |
| `src/player/ui/styles/00_tokens/_tokens.css` | 215 | 8.8 KB | 2 | 4 | 0 | **0** |
| `src/player/ui/styles/00_tokens/_zindex.css` | 26 | 1.0 KB | 1 | 2 | 0 | **0** |
| `src/player/ui/styles/01_core/_common.css` | 154 | 3.4 KB | 20 | 48 | 23 | **6** |
| `src/player/ui/styles/01_core/_host.css` | 181 | 4.9 KB | 25 | 43 | 9 | **19** |
| `src/player/ui/styles/01_core/_layout.css` | 732 | 18.7 KB | 75 | 115 | 48 | **16** |
| `src/player/ui/styles/02_components/_comments.css` | 744 | 18.0 KB | 76 | 108 | 47 | **7** |
| `src/player/ui/styles/02_components/_comments_sections.css` | 709 | 15.9 KB | 87 | 87 | 62 | **0** |
| `src/player/ui/styles/02_components/_composer.css` | 127 | 2.6 KB | 16 | 20 | 15 | **0** |
| `src/player/ui/styles/02_components/_control_panel.css` | 730 | 17.3 KB | 75 | 83 | 59 | **5** |
| `src/player/ui/styles/02_components/_controls.css` | 636 | 14.5 KB | 62 | 71 | 45 | **0** |
| `src/player/ui/styles/02_components/_debug.css` | 128 | 3.9 KB | 25 | 25 | 21 | **0** |
| `src/player/ui/styles/02_components/_marker_sheet.css` | 753 | 18.2 KB | 85 | 105 | 68 | **0** |
| `src/player/ui/styles/02_components/_modals.css` | 756 | 17.5 KB | 87 | 91 | 59 | **4** |
| `src/player/ui/styles/02_components/_peach.css` | 601 | 12.1 KB | 77 | 82 | 66 | **0** |
| `src/player/ui/styles/02_components/_settings_apple.css` | 587 | 12.2 KB | 67 | 67 | 48 | **0** |
| `src/player/ui/styles/02_components/_settings_cards.css` | 499 | 11.3 KB | 64 | 64 | 44 | **0** |
| `src/player/ui/styles/02_components/_settings_panels.css` | 309 | 7.6 KB | 31 | 38 | 26 | **0** |
| `src/player/ui/styles/02_components/_switcher.css` | 220 | 4.6 KB | 25 | 26 | 18 | **3** |
| `src/player/ui/styles/03_responsive/_landscape.css` | 783 | 22.5 KB | 84 | 113 | 41 | **9** |
| `src/player/ui/styles/03_responsive/_single_hand.css` | 334 | 9.7 KB | 29 | 41 | 15 | **4** |

---

## 🔁 三、最高频重复选择器 Top 10 (跨文件重灾区)

| 排名 | 重复次数 | 跨文件 | 选择器名称 | 分布所在文件 |
| :---: | :---: | :---: | :--- | :--- |
| 1 | **8 次** | ⚠️ 是 | `.tm-control-buttons` | _layout.css, _control_panel.css, _landscape.css |
| 2 | **5 次** | ⚠️ 是 | `.tm-comments-panel` | _layout.css, _comments.css, _landscape.css |
| 3 | **5 次** | ⚠️ 是 | `.tm-show-controls-float-btn` | _comments.css, _landscape.css |
| 4 | **4 次** | ⚠️ 是 | `:root` | _tokens.css, _zindex.css, _host.css |
| 5 | **4 次** | ⚠️ 是 | `:host` | _tokens.css, _zindex.css, _layout.css |
| 6 | **4 次** | ⚠️ 是 | `html.tm-player-active` | _host.css, _layout.css |
| 7 | **4 次** | ⚠️ 是 | `body.tm-player-active` | _host.css, _layout.css |
| 8 | **4 次** | ⚠️ 是 | `.tm-video-container` | _layout.css, _landscape.css |
| 9 | **4 次** | ⚠️ 是 | `.tm-sidebar-pos-button` | _layout.css, _landscape.css |
| 10 | **4 次** | ⚠️ 是 | `.tm-settings-panel` | _settings_apple.css, _settings_panels.css, _landscape.css |

### 🚨 跨文件重复选择器清单 (51 处)
- **`.tm-control-buttons`** (声明 8 次，涉及 `_layout.css`, `_control_panel.css`, `_landscape.css`)
- **`.tm-comments-panel`** (声明 5 次，涉及 `_layout.css`, `_comments.css`, `_landscape.css`)
- **`.tm-show-controls-float-btn`** (声明 5 次，涉及 `_comments.css`, `_landscape.css`)
- **`:root`** (声明 4 次，涉及 `_tokens.css`, `_zindex.css`, `_host.css`)
- **`:host`** (声明 4 次，涉及 `_tokens.css`, `_zindex.css`, `_layout.css`)
- **`html.tm-player-active`** (声明 4 次，涉及 `_host.css`, `_layout.css`)
- **`body.tm-player-active`** (声明 4 次，涉及 `_host.css`, `_layout.css`)
- **`.tm-video-container`** (声明 4 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-sidebar-pos-button`** (声明 4 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-settings-panel`** (声明 4 次，涉及 `_settings_apple.css`, `_settings_panels.css`, `_landscape.css`)
- **`.tm-player-container`** (声明 3 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-video-wrapper`** (声明 3 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-video-wrapper video`** (声明 3 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-handle-container`** (声明 3 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-sidebar-toggle-button`** (声明 3 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-player-container.has-composer-active .tm-control-buttons`** (声明 3 次，涉及 `_comments.css`, `_landscape.css`)
- **`.tm-video-minimap`** (声明 3 次，涉及 `_controls.css`, `_landscape.css`)
- **`.tm-comment-text-input`** (声明 2 次，涉及 `_common.css`, `_modals.css`)
- **`.tm-comment-input-textarea`** (声明 2 次，涉及 `_common.css`, `_modals.css`)
- **`.tm-tag-remark-input`** (声明 2 次，涉及 `_common.css`, `_modals.css`)
- **`.tm-sheet-item-comment-input`** (声明 2 次，涉及 `_common.css`, `_marker_sheet.css`)
- **`.tm-inline-remark-input`** (声明 2 次，涉及 `_common.css`, `_control_panel.css`)
- **`.tm-settings-input`** (声明 2 次，涉及 `_common.css`, `_settings_apple.css`)
- **`.tm-webdav-input`** (声明 2 次，涉及 `_common.css`, `_settings_cards.css`)
- **`.tm-apple-duration-input`** (声明 2 次，涉及 `_common.css`, `_settings_apple.css`)
- **`.tm-login-username`** (声明 2 次，涉及 `_common.css`, `_composer.css`)
- **`.tm-login-password`** (声明 2 次，涉及 `_common.css`, `_composer.css`)
- **`.tm-report-note`** (声明 2 次，涉及 `_common.css`, `_modals.css`)
- **`.tm-video-overlay`** (声明 2 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-button-container`** (声明 2 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-player-container > .tm-player-title`** (声明 2 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-player-container.tm-sidebar-hidden .tm-comments-panel`** (声明 2 次，涉及 `_layout.css`, `_landscape.css`)
- **`.tm-comments-panel::after`** (声明 2 次，涉及 `_comments.css`, `_landscape.css`)
- **`.tm-comments-panel-list.tm-comments-list`** (声明 2 次，涉及 `_comments.css`, `_landscape.css`)
- **`.tm-player-container.has-sheet-open .tm-comment-fab-btn`** (声明 2 次，涉及 `_comments.css`, `_marker_sheet.css`)
- **`.tm-player-container.has-sheet-open .tm-show-controls-float-btn`** (声明 2 次，涉及 `_comments.css`, `_marker_sheet.css`)
- **`.tm-comment-section`** (声明 2 次，涉及 `_comments_sections.css`, `_landscape.css`)
- **`.tm-comment-section:not(.is-collapsed)`** (声明 2 次，涉及 `_comments_sections.css`, `_landscape.css`)
- **`.tm-comment-section-body`** (声明 2 次，涉及 `_comments_sections.css`, `_landscape.css`)
- **`.tm-volume-control`** (声明 2 次，涉及 `_control_panel.css`, `_controls.css`)
- **`.tm-tab-scroll-container`** (声明 2 次，涉及 `_control_panel.css`, `_marker_sheet.css`)
- **`.tm-time-control-button-active`** (声明 2 次，涉及 `_control_panel.css`, `_controls.css`)
- **`.tm-time-control-button-after-active`** (声明 2 次，涉及 `_control_panel.css`, `_controls.css`)
- **`.tm-control-panel`** (声明 2 次，涉及 `_control_panel.css`, `_single_hand.css`)
- **`.tm-control-buttons.dragging`** (声明 2 次，涉及 `_control_panel.css`, `_landscape.css`)
- **`.tm-settings-label`** (声明 2 次，涉及 `_controls.css`, `_settings_panels.css`)
- **`.tm-control-buttons .tm-tab-pill`** (声明 2 次，涉及 `_controls.css`, `_landscape.css`)
- **`.tm-tab-actions-capsule`** (声明 2 次，涉及 `_controls.css`, `_marker_sheet.css`)
- **`.tm-settings-sources-subpanel`** (声明 2 次，涉及 `_settings_apple.css`, `_settings_panels.css`)
- **`.tm-about-check-row`** (声明 2 次，涉及 `_settings_apple.css`, `_settings_cards.css`)
- **`.tm-settings-panel.active`** (声明 2 次，涉及 `_settings_panels.css`, `_landscape.css`)

---

## 🌐 四、`:root, :host` 变量散落与覆写分布 (142 处)

- `--brand-pink` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _host.css
- `--brand-pink-rgb` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _host.css
- `--sidebar-width` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css
- `--mp-color-black`: 存在于 _tokens.css
- `--mp-color-white`: 存在于 _tokens.css
- `--mp-bg-pure-black`: 存在于 _tokens.css
- `--mp-bg-surface`: 存在于 _tokens.css
- `--mp-bg-surface-elevated`: 存在于 _tokens.css
- `--mp-bg-overlay`: 存在于 _tokens.css
- `--shadcn-background`: 存在于 _tokens.css
- `--shadcn-foreground`: 存在于 _tokens.css
- `--shadcn-card`: 存在于 _tokens.css
- `--shadcn-card-foreground`: 存在于 _tokens.css
- `--shadcn-popover`: 存在于 _tokens.css
- `--shadcn-popover-foreground`: 存在于 _tokens.css
- `--shadcn-primary`: 存在于 _tokens.css
- `--shadcn-primary-foreground`: 存在于 _tokens.css
- `--shadcn-secondary`: 存在于 _tokens.css
- `--shadcn-secondary-foreground`: 存在于 _tokens.css
- `--shadcn-muted`: 存在于 _tokens.css
- `--shadcn-muted-foreground`: 存在于 _tokens.css
- `--shadcn-accent`: 存在于 _tokens.css
- `--shadcn-accent-foreground`: 存在于 _tokens.css
- `--shadcn-destructive`: 存在于 _tokens.css
- `--shadcn-destructive-foreground`: 存在于 _tokens.css
- `--shadcn-border`: 存在于 _tokens.css
- `--shadcn-input`: 存在于 _tokens.css
- `--shadcn-ring`: 存在于 _tokens.css
- `--shadcn-green`: 存在于 _tokens.css
- `--shadcn-green-foreground`: 存在于 _tokens.css
- `--shadcn-blue`: 存在于 _tokens.css
- `--shadcn-blue-foreground`: 存在于 _tokens.css
- `--shadcn-red`: 存在于 _tokens.css
- `--shadcn-red-foreground`: 存在于 _tokens.css
- `--shadcn-orange`: 存在于 _tokens.css
- `--shadcn-orange-foreground`: 存在于 _tokens.css
- `--shadcn-purple`: 存在于 _tokens.css
- `--shadcn-purple-foreground`: 存在于 _tokens.css
- `--mp-color-system-blue`: 存在于 _tokens.css
- `--mp-color-system-green`: 存在于 _tokens.css
- `--mp-color-system-red`: 存在于 _tokens.css
- `--mp-color-system-orange`: 存在于 _tokens.css
- `--mp-color-system-yellow`: 存在于 _tokens.css
- `--mp-color-system-purple`: 存在于 _tokens.css
- `--mp-color-system-pink`: 存在于 _tokens.css
- `--mp-color-system-gray`: 存在于 _tokens.css
- `--mp-blur-glass`: 存在于 _tokens.css
- `--mp-blur-glass-subtle`: 存在于 _tokens.css
- `--mp-blur-glass-heavy`: 存在于 _tokens.css
- `--mp-card-bg-subtle`: 存在于 _tokens.css
- `--mp-card-bg`: 存在于 _tokens.css
- `--mp-card-bg-elevated`: 存在于 _tokens.css
- `--mp-card-bg-active`: 存在于 _tokens.css
- `--mp-card-border`: 存在于 _tokens.css
- `--mp-card-border-subtle`: 存在于 _tokens.css
- `--mp-card-border-hover`: 存在于 _tokens.css
- `--mp-settings-card-bg`: 存在于 _tokens.css
- `--mp-settings-card-border`: 存在于 _tokens.css
- `--mp-settings-card-radius`: 存在于 _tokens.css
- `--mp-settings-row-height`: 存在于 _tokens.css
- `--mp-settings-divider`: 存在于 _tokens.css
- `--mp-settings-text-primary`: 存在于 _tokens.css
- `--mp-settings-text-secondary`: 存在于 _tokens.css
- `--mp-settings-text-muted`: 存在于 _tokens.css
- `--mp-settings-switch-active`: 存在于 _tokens.css
- `--mp-settings-switch-track`: 存在于 _tokens.css
- `--mp-settings-switch-thumb`: 存在于 _tokens.css
- `--mp-morandi-sky-blue`: 存在于 _tokens.css
- `--mp-morandi-emerald`: 存在于 _tokens.css
- `--mp-morandi-indigo`: 存在于 _tokens.css
- `--mp-morandi-coral`: 存在于 _tokens.css
- `--mp-morandi-rose`: 存在于 _tokens.css
- `--mp-morandi-mint`: 存在于 _tokens.css
- `--mp-morandi-amber`: 存在于 _tokens.css
- `--mp-morandi-lavender`: 存在于 _tokens.css
- `--mp-morandi-cyan`: 存在于 _tokens.css
- `--mp-morandi-crimson`: 存在于 _tokens.css
- `--mp-color-morandi-1`: 存在于 _tokens.css
- `--mp-color-morandi-2`: 存在于 _tokens.css
- `--mp-color-morandi-3`: 存在于 _tokens.css
- `--mp-color-morandi-4`: 存在于 _tokens.css
- `--mp-color-morandi-5`: 存在于 _tokens.css
- `--mp-color-morandi-6`: 存在于 _tokens.css
- `--mp-color-morandi-7`: 存在于 _tokens.css
- `--mp-color-morandi-8`: 存在于 _tokens.css
- `--mp-color-morandi-9`: 存在于 _tokens.css
- `--mp-color-morandi-10`: 存在于 _tokens.css
- `--font-sans`: 存在于 _tokens.css
- `--mp-font-sans`: 存在于 _tokens.css
- `--mp-font-mono`: 存在于 _tokens.css
- `--mp-text-2xs`: 存在于 _tokens.css
- `--mp-text-xs`: 存在于 _tokens.css
- `--mp-text-sm`: 存在于 _tokens.css
- `--mp-text-base`: 存在于 _tokens.css
- `--mp-text-md`: 存在于 _tokens.css
- `--mp-text-lg`: 存在于 _tokens.css
- `--mp-text-xl`: 存在于 _tokens.css
- `--mp-text-2xl`: 存在于 _tokens.css
- `--mp-text-3xl`: 存在于 _tokens.css
- `--mp-font-weight-regular`: 存在于 _tokens.css
- `--mp-font-weight-medium`: 存在于 _tokens.css
- `--mp-font-weight-semibold`: 存在于 _tokens.css
- `--mp-font-weight-bold`: 存在于 _tokens.css
- `--mp-line-height-tight`: 存在于 _tokens.css
- `--mp-line-height-normal`: 存在于 _tokens.css
- `--mp-line-height-relaxed`: 存在于 _tokens.css
- `--shadcn-radius`: 存在于 _tokens.css
- `--shadcn-radius-sm`: 存在于 _tokens.css
- `--shadcn-radius-lg`: 存在于 _tokens.css
- `--mp-radius-xs`: 存在于 _tokens.css
- `--mp-radius-sm`: 存在于 _tokens.css
- `--mp-radius-md`: 存在于 _tokens.css
- `--mp-radius-lg`: 存在于 _tokens.css
- `--mp-radius-xl`: 存在于 _tokens.css
- `--mp-radius-2xl`: 存在于 _tokens.css
- `--mp-radius-full`: 存在于 _tokens.css
- `--button-sm`: 存在于 _tokens.css
- `--button-md`: 存在于 _tokens.css
- `--button-lg`: 存在于 _tokens.css
- `--button-xl`: 存在于 _tokens.css
- `--mp-touch-target-min`: 存在于 _tokens.css
- `--anim-quick`: 存在于 _tokens.css
- `--anim-smooth`: 存在于 _tokens.css
- `--anim-bounce`: 存在于 _tokens.css
- `--mp-ease-apple-spring`: 存在于 _tokens.css
- `--mp-ease-out-expo`: 存在于 _tokens.css
- `--shadow-sm`: 存在于 _tokens.css
- `--shadow-md`: 存在于 _tokens.css
- `--shadow-lg`: 存在于 _tokens.css
- `--mp-shadow-floating`: 存在于 _tokens.css
- `--mp-shadow-modal`: 存在于 _tokens.css
- `--z-host-overlay`: 存在于 _zindex.css
- `--z-host-player`: 存在于 _zindex.css
- `--z-base`: 存在于 _zindex.css
- `--z-controls`: 存在于 _zindex.css
- `--z-drawer`: 存在于 _zindex.css
- `--z-composer`: 存在于 _zindex.css
- `--z-modal`: 存在于 _zindex.css
- `--z-toast`: 存在于 _zindex.css
- `--z-player-base`: 存在于 _zindex.css
- `--z-sidebar`: 存在于 _zindex.css
- `--z-popover`: 存在于 _zindex.css

---

## ☠️ 五、死选择器与死类名候选清单 (Dead Code Candidates)

### 1. Grade 1 确凿死选择器 (Top 25 展示 / 共 0 个)
> 定义：包含自研前缀（`tm-`, `mp-`, `jc-`, `is-` 等），但所包含的类名在全量 86 个 JS 源码中命中数为 0。




### 2. 0 引用自研类名清单 (共 2 个)
- `.jc-spam` (在 CSS 中声明 2 次)
- `.mp-composer-publish-btn` (在 CSS 中声明 1 次)

### 3. 未引用的 Keyframes 动画 (0 个)
- 无

### 4. 未引用的 CSS 变量 (81 个)
- `--mp-color-black` (声明于 _tokens.css:15)
- `--mp-color-white` (声明于 _tokens.css:16)
- `--mp-bg-pure-black` (声明于 _tokens.css:17)
- `--mp-bg-surface` (声明于 _tokens.css:18)
- `--mp-bg-surface-elevated` (声明于 _tokens.css:19)
- `--mp-bg-overlay` (声明于 _tokens.css:20)
- `--shadcn-popover` (声明于 _tokens.css:29)
- `--shadcn-popover-foreground` (声明于 _tokens.css:30)
- `--shadcn-primary-foreground` (声明于 _tokens.css:32)
- `--shadcn-accent-foreground` (声明于 _tokens.css:38)
- `--shadcn-input` (声明于 _tokens.css:42)
- `--shadcn-ring` (声明于 _tokens.css:43)
- `--shadcn-green-foreground` (声明于 _tokens.css:49)
- `--shadcn-red-foreground` (声明于 _tokens.css:53)
- `--shadcn-orange-foreground` (声明于 _tokens.css:55)
- `--shadcn-purple-foreground` (声明于 _tokens.css:57)
- `--mp-color-system-blue` (声明于 _tokens.css:60)
- `--mp-color-system-green` (声明于 _tokens.css:61)
- `--mp-color-system-red` (声明于 _tokens.css:62)
- `--mp-color-system-orange` (声明于 _tokens.css:63)
- `--mp-color-system-yellow` (声明于 _tokens.css:64)
- `--mp-color-system-purple` (声明于 _tokens.css:65)
- `--mp-color-system-pink` (声明于 _tokens.css:66)
- `--mp-color-system-gray` (声明于 _tokens.css:67)
- `--mp-blur-glass` (声明于 _tokens.css:73)
- `--mp-blur-glass-subtle` (声明于 _tokens.css:74)
- `--mp-blur-glass-heavy` (声明于 _tokens.css:75)
- `--mp-card-bg-subtle` (声明于 _tokens.css:78)
- `--mp-card-bg` (声明于 _tokens.css:79)
- `--mp-card-bg-elevated` (声明于 _tokens.css:80)
- `--mp-card-bg-active` (声明于 _tokens.css:81)
- `--mp-card-border` (声明于 _tokens.css:82)
- `--mp-card-border-subtle` (声明于 _tokens.css:83)
- `--mp-card-border-hover` (声明于 _tokens.css:84)
- `--mp-settings-switch-active` (声明于 _tokens.css:95)
- `--mp-settings-switch-track` (声明于 _tokens.css:96)
- `--mp-settings-switch-thumb` (声明于 _tokens.css:97)
- `--mp-color-morandi-1` (声明于 _tokens.css:114)
- `--mp-color-morandi-2` (声明于 _tokens.css:115)
- `--mp-color-morandi-3` (声明于 _tokens.css:116)
- `--mp-color-morandi-4` (声明于 _tokens.css:117)
- `--mp-color-morandi-5` (声明于 _tokens.css:118)
- `--mp-color-morandi-6` (声明于 _tokens.css:119)
- `--mp-color-morandi-7` (声明于 _tokens.css:120)
- `--mp-color-morandi-8` (声明于 _tokens.css:121)
- `--mp-color-morandi-9` (声明于 _tokens.css:122)
- `--mp-color-morandi-10` (声明于 _tokens.css:123)
- `--mp-font-sans` (声明于 _tokens.css:129)
- `--mp-font-mono` (声明于 _tokens.css:130)
- `--mp-text-2xs` (声明于 _tokens.css:133)
- `--mp-text-xs` (声明于 _tokens.css:134)
- `--mp-text-sm` (声明于 _tokens.css:135)
- `--mp-text-base` (声明于 _tokens.css:136)
- `--mp-text-md` (声明于 _tokens.css:137)
- `--mp-text-lg` (声明于 _tokens.css:138)
- `--mp-text-xl` (声明于 _tokens.css:139)
- `--mp-text-2xl` (声明于 _tokens.css:140)
- `--mp-text-3xl` (声明于 _tokens.css:141)
- `--mp-font-weight-regular` (声明于 _tokens.css:144)
- `--mp-font-weight-medium` (声明于 _tokens.css:145)
- `--mp-font-weight-semibold` (声明于 _tokens.css:146)
- `--mp-font-weight-bold` (声明于 _tokens.css:147)
- `--mp-line-height-tight` (声明于 _tokens.css:150)
- `--mp-line-height-normal` (声明于 _tokens.css:151)
- `--mp-line-height-relaxed` (声明于 _tokens.css:152)
- `--mp-radius-xs` (声明于 _tokens.css:163)
- `--mp-radius-sm` (声明于 _tokens.css:164)
- `--mp-radius-md` (声明于 _tokens.css:165)
- `--mp-radius-lg` (声明于 _tokens.css:166)
- `--mp-radius-xl` (声明于 _tokens.css:167)
- `--mp-radius-2xl` (声明于 _tokens.css:168)
- `--mp-radius-full` (声明于 _tokens.css:169)
- `--button-sm` (声明于 _tokens.css:175)
- `--mp-touch-target-min` (声明于 _tokens.css:181)
- `--anim-bounce` (声明于 _tokens.css:191)
- `--mp-ease-apple-spring` (声明于 _tokens.css:194)
- `--mp-ease-out-expo` (声明于 _tokens.css:195)
- `--mp-shadow-floating` (声明于 _tokens.css:205)
- `--mp-shadow-modal` (声明于 _tokens.css:206)
- `--z-player-base` (声明于 _zindex.css:22)
- `--z-sidebar` (声明于 _zindex.css:23)

---

## 🎯 六、重构治理行动建议 (Refactor Next Steps)

1. **废弃旧设置面板样式**：在 `_player.css` 中有大量设置相关旧类名（如 `.tm-setting-*`, `.tm-checkbox-*`）在 JS 中命中数为 0，说明已完全被 `_settings_apple.css` 替代，可批量拔除；
2. **清理 `_landscape_legacy.css`**：该文件与 `_landscape_pc.css` 严重重复（如 `.tm-control-buttons`, `.tm-video-container`），确认可直接废弃移除；
3. **收拢 `:root, :host` 变量**：将散落在 `_variables.css`、`_settings_apple.css`、`_landscape_pc.css` 的变量统一收敛至规划的 `00_tokens/_tokens.css`；
4. **消灭重复选择器**：优先治理 Top 10 跨文件重复选择器，消除层叠特异度混乱。
