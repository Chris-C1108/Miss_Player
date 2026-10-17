# Miss Player CSS 全局静态审计与摸排报告

> 生成时间：2026-10-12T05:06:29.099Z  
> 耗时：503ms | CSS 文件数：8 | JS 扫描文件数：86  
> 对应专项任务：Phase 14 (CSS Architecture Refactor) - 子任务 A

---

## 📊 一、全局核心指标总览

| 维度指标 | 数值 | 状态/说明 |
| :--- | :--- | :--- |
| **CSS 源码总行数** | **7820** 行 | 包含 8 个子模块与 1 个入口 |
| **CSS 规则总数 (Rules)** | **899** 条 | PostCSS 解析规则总数 |
| **独立规范化选择器数** | **903** 个 | 拆分逗号后的单一选择器 |
| **独立 CSS 类名数** | **488** 个 | 全部样式提取的 class 集合 |
| **`!important` 标记总数** | **82** 处 | 待治理（目标 < 50 处） |
| **0 引用自研类名嫌疑** | **89** 个 | `tm-*`, `mp-*`, `jc-*`, `is-*` 零引用 |
| **Grade 1 确凿死选择器** | **114** 个 | 所含类名在 JS 中全部 0 命中 |
| **重复声明选择器数** | **97** 个 | 其中跨文件重复 **45** 个 |
| **散落 `:root, :host` 变量** | **57** 个 | 散落在 3 个文件中的全局变量 |
| **无用 Keyframes 动画** | **1** 个 | CSS 与 JS 均未调用的动画 |
| **无用 CSS 变量** | **15** 个 | 未在 `var()` 或 JS 调用的变量 |

---

## 📁 二、各 CSS 文件分布明细

| 文件路径 | 行数 | 体积 | 规则数 | 选择器数 | 类名数 | !important |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/player/ui/style.css` | 13 | 0.5 KB | 0 | 0 | 0 | **0** |
| `src/player/ui/styles/_comments.css` | 2049 | 48.9 KB | 240 | 258 | 141 | **45** |
| `src/player/ui/styles/_common.css` | 160 | 3.5 KB | 21 | 21 | 11 | **0** |
| `src/player/ui/styles/_controls.css` | 1553 | 35.9 KB | 168 | 186 | 106 | **6** |
| `src/player/ui/styles/_landscape_pc.css` | 594 | 16.9 KB | 69 | 94 | 38 | **14** |
| `src/player/ui/styles/_player.css` | 3003 | 74.2 KB | 355 | 402 | 235 | **16** |
| `src/player/ui/styles/_settings_apple.css` | 346 | 7.8 KB | 41 | 42 | 27 | **0** |
| `src/player/ui/styles/_variables.css` | 102 | 3.4 KB | 5 | 26 | 8 | **1** |

---

## 🔁 三、最高频重复选择器 Top 10 (跨文件重灾区)

| 排名 | 重复次数 | 跨文件 | 选择器名称 | 分布所在文件 |
| :---: | :---: | :---: | :--- | :--- |
| 1 | **8 次** | ⚠️ 是 | `.tm-control-buttons` | _landscape_pc.css, _player.css |
| 2 | **6 次** | ⚠️ 是 | `:host` | _landscape_pc.css, _player.css, _settings_apple.css, _variables.css |
| 3 | **5 次** | ⚠️ 是 | `.tm-comments-panel` | _comments.css, _landscape_pc.css, _player.css |
| 4 | **5 次** | ⚠️ 是 | `:root` | _landscape_pc.css, _settings_apple.css, _variables.css |
| 5 | **4 次** | 否 | `.tm-control-drag-handle` | _landscape_pc.css |
| 6 | **3 次** | ⚠️ 是 | `.tm-floating-comment-panel` | _comments.css, _controls.css |
| 7 | **3 次** | ⚠️ 是 | `.tm-comment-input-textarea` | _comments.css, _variables.css |
| 8 | **3 次** | ⚠️ 是 | `.tm-volume-control` | _controls.css, _player.css |
| 9 | **3 次** | 否 | `.tm-comment-modal` | _controls.css |
| 10 | **3 次** | ⚠️ 是 | `.tm-video-container` | _landscape_pc.css, _player.css |

### 🚨 跨文件重复选择器清单 (45 处)
- **`.tm-control-buttons`** (声明 8 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`:host`** (声明 6 次，涉及 `_landscape_pc.css`, `_player.css`, `_settings_apple.css`, `_variables.css`)
- **`.tm-comments-panel`** (声明 5 次，涉及 `_comments.css`, `_landscape_pc.css`, `_player.css`)
- **`:root`** (声明 5 次，涉及 `_landscape_pc.css`, `_settings_apple.css`, `_variables.css`)
- **`.tm-floating-comment-panel`** (声明 3 次，涉及 `_comments.css`, `_controls.css`)
- **`.tm-comment-input-textarea`** (声明 3 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-volume-control`** (声明 3 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-video-container`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container.controls-hidden .tm-control-buttons`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`:host(.controls-hidden) .tm-control-buttons`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container:not(.controls-hidden) .tm-control-buttons`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`:host(:not(.controls-hidden)) .tm-control-buttons`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-tab-pill`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-settings-sources-subpanel`** (声明 3 次，涉及 `_player.css`, `_settings_apple.css`)
- **`.tm-comments-panel::after`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comments-panel-action-bar`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comments-panel-list.tm-comments-list`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-submit-bar-wrapper`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-text-input`** (声明 2 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-tag-remark-input`** (声明 2 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-comment-section`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-section:not(.is-collapsed)`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-section-body`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-settings-label`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-time-control-button-active`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-time-control-button-after-active`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-video-minimap`** (声明 2 次，涉及 `_controls.css`, `_landscape_pc.css`)
- **`.tm-floating-panel-input`** (声明 2 次，涉及 `_controls.css`, `_variables.css`)
- **`.tm-control-buttons .tm-tab-pill`** (声明 2 次，涉及 `_controls.css`, `_landscape_pc.css`)
- **`.tm-player-container.controls-hidden .tm-control-panel`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`:host(.controls-hidden) .tm-control-panel`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-player-container`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-video-wrapper`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-video-wrapper video`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-handle-container`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-control-buttons.dragging`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-video-overlay`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-sidebar-pos-button`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-sidebar-toggle-button`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-title`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-time-display`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-button-container`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-seek-step-input`** (声明 2 次，涉及 `_player.css`, `_variables.css`)
- **`.tm-inline-remark-input`** (声明 2 次，涉及 `_player.css`, `_variables.css`)
- **`.tm-sheet-item-comment-input`** (声明 2 次，涉及 `_player.css`, `_variables.css`)

---

## 🌐 四、`:root, :host` 变量散落与覆写分布 (57 处)

- `--sidebar-width` ⚠️ (在 3 处被重复声明/媒体查询修改): 存在于 _landscape_pc.css
- `--mp-settings-card-bg`: 存在于 _settings_apple.css
- `--mp-settings-card-border`: 存在于 _settings_apple.css
- `--mp-settings-card-radius`: 存在于 _settings_apple.css
- `--mp-settings-row-height`: 存在于 _settings_apple.css
- `--mp-settings-divider`: 存在于 _settings_apple.css
- `--mp-settings-text-primary`: 存在于 _settings_apple.css
- `--mp-settings-text-secondary`: 存在于 _settings_apple.css
- `--mp-settings-text-muted`: 存在于 _settings_apple.css
- `--mp-settings-switch-active`: 存在于 _settings_apple.css
- `--mp-settings-switch-track`: 存在于 _settings_apple.css
- `--mp-settings-switch-thumb`: 存在于 _settings_apple.css
- `--brand-pink`: 存在于 _variables.css
- `--brand-pink-rgb`: 存在于 _variables.css
- `--shadcn-background`: 存在于 _variables.css
- `--shadcn-foreground`: 存在于 _variables.css
- `--shadcn-card`: 存在于 _variables.css
- `--shadcn-card-foreground`: 存在于 _variables.css
- `--shadcn-popover`: 存在于 _variables.css
- `--shadcn-popover-foreground`: 存在于 _variables.css
- `--shadcn-primary`: 存在于 _variables.css
- `--shadcn-primary-foreground`: 存在于 _variables.css
- `--shadcn-secondary`: 存在于 _variables.css
- `--shadcn-secondary-foreground`: 存在于 _variables.css
- `--shadcn-muted`: 存在于 _variables.css
- `--shadcn-muted-foreground`: 存在于 _variables.css
- `--shadcn-accent`: 存在于 _variables.css
- `--shadcn-accent-foreground`: 存在于 _variables.css
- `--shadcn-destructive`: 存在于 _variables.css
- `--shadcn-destructive-foreground`: 存在于 _variables.css
- `--shadcn-border`: 存在于 _variables.css
- `--shadcn-input`: 存在于 _variables.css
- `--shadcn-ring`: 存在于 _variables.css
- `--shadcn-green`: 存在于 _variables.css
- `--shadcn-green-foreground`: 存在于 _variables.css
- `--shadcn-blue`: 存在于 _variables.css
- `--shadcn-blue-foreground`: 存在于 _variables.css
- `--shadcn-red`: 存在于 _variables.css
- `--shadcn-red-foreground`: 存在于 _variables.css
- `--shadcn-orange`: 存在于 _variables.css
- `--shadcn-orange-foreground`: 存在于 _variables.css
- `--shadcn-purple`: 存在于 _variables.css
- `--shadcn-purple-foreground`: 存在于 _variables.css
- `--shadcn-radius`: 存在于 _variables.css
- `--shadcn-radius-sm`: 存在于 _variables.css
- `--shadcn-radius-lg`: 存在于 _variables.css
- `--button-sm`: 存在于 _variables.css
- `--button-md`: 存在于 _variables.css
- `--button-lg`: 存在于 _variables.css
- `--button-xl`: 存在于 _variables.css
- `--anim-quick`: 存在于 _variables.css
- `--anim-smooth`: 存在于 _variables.css
- `--anim-bounce`: 存在于 _variables.css
- `--shadow-sm`: 存在于 _variables.css
- `--shadow-md`: 存在于 _variables.css
- `--shadow-lg`: 存在于 _variables.css
- `--font-sans`: 存在于 _variables.css

---

## ☠️ 五、死选择器与死类名候选清单 (Dead Code Candidates)

### 1. Grade 1 确凿死选择器 (Top 25 展示 / 共 114 个)
> 定义：包含自研前缀（`tm-`, `mp-`, `jc-`, `is-` 等），但所包含的类名在全量 86 个 JS 源码中命中数为 0。

- `.tm-custom-modal-content` → 声明于: _comments.css:590 (包含类名: .tm-custom-modal-content)
- `.jc-site` → 声明于: _comments.css:669 (包含类名: .jc-site)
- `.jc-site-jable` → 声明于: _comments.css:681 (包含类名: .jc-site-jable)
- `.jc-site-javlib` → 声明于: _comments.css:687 (包含类名: .jc-site-javlib)
- `.jc-c-sep` → 声明于: _comments.css:848 (包含类名: .jc-c-sep)
- `.jc-emoji` → 声明于: _comments.css:1090 (包含类名: .jc-emoji)
- `.tm-comments-tab-btn` → 声明于: _comments.css:1295 (包含类名: .tm-comments-tab-btn)
- `.tm-comments-tab-btn:hover` → 声明于: _comments.css:1309 (包含类名: .tm-comments-tab-btn)
- `.tm-comments-tab-btn:active` → 声明于: _comments.css:1314 (包含类名: .tm-comments-tab-btn)
- `.jc-site-javlib-review` → 声明于: _comments.css:1394 (包含类名: .jc-site-javlib-review)
- `.tm-status-badge-loading` → 声明于: _comments.css:1554 (包含类名: .tm-status-badge-loading)
- `.tm-status-badge-unreachable` → 声明于: _comments.css:1561 (包含类名: .tm-status-badge-unreachable)
- `.tm-status-badge-not_found` → 声明于: _comments.css:1567 (包含类名: .tm-status-badge-not_found)
- `.tm-status-badge-mobile_unsupported` → 声明于: _comments.css:1573 (包含类名: .tm-status-badge-mobile_unsupported)
- `.tm-status-badge-empty` → 声明于: _comments.css:1579 (包含类名: .tm-status-badge-empty)
- `.tm-status-badge-cf_shield` → 声明于: _comments.css:1585 (包含类名: .tm-status-badge-cf_shield)
- `.tm-status-badge-loaded` → 声明于: _comments.css:1591 (包含类名: .tm-status-badge-loaded)
- `.jc-card-highlight-flash` → 声明于: _comments.css:1648 (包含类名: .jc-card-highlight-flash)
- `.tm-code-action-dialog` → 声明于: _comments.css:1933 (包含类名: .tm-code-action-dialog)
- `.tm-code-action-title` → 声明于: _comments.css:1953 (包含类名: .tm-code-action-title)
- `.tm-code-action-code` → 声明于: _comments.css:1960 (包含类名: .tm-code-action-code)
- `.tm-code-action-buttons` → 声明于: _comments.css:1974 (包含类名: .tm-code-action-buttons)
- `.tm-code-action-btn` → 声明于: _comments.css:1981 (包含类名: .tm-code-action-btn)
- `.tm-code-action-btn:active` → 声明于: _comments.css:1996 (包含类名: .tm-code-action-btn)
- `.tm-code-action-btn--primary` → 声明于: _comments.css:2000 (包含类名: .tm-code-action-btn--primary)

*(更多 89 个详见 css-audit-report.json)*


### 2. 0 引用自研类名清单 (共 89 个)
- `.tm-custom-modal-content` (在 CSS 中声明 2 次)
- `.jc-site` (在 CSS 中声明 1 次)
- `.jc-site-jable` (在 CSS 中声明 1 次)
- `.jc-site-javlib` (在 CSS 中声明 1 次)
- `.jc-c-sep` (在 CSS 中声明 1 次)
- `.jc-spam` (在 CSS 中声明 2 次)
- `.jc-emoji` (在 CSS 中声明 1 次)
- `.tm-comments-tab-btn` (在 CSS 中声明 4 次)
- `.jc-site-javlib-review` (在 CSS 中声明 1 次)
- `.tm-status-badge-loading` (在 CSS 中声明 1 次)
- `.tm-status-badge-unreachable` (在 CSS 中声明 1 次)
- `.tm-status-badge-not_found` (在 CSS 中声明 1 次)
- `.tm-status-badge-mobile_unsupported` (在 CSS 中声明 1 次)
- `.tm-status-badge-empty` (在 CSS 中声明 1 次)
- `.tm-status-badge-cf_shield` (在 CSS 中声明 1 次)
- `.tm-status-badge-loaded` (在 CSS 中声明 1 次)
- `.jc-card-highlight-flash` (在 CSS 中声明 1 次)
- `.tm-code-action-dialog` (在 CSS 中声明 2 次)
- `.tm-code-action-title` (在 CSS 中声明 1 次)
- `.tm-code-action-code` (在 CSS 中声明 1 次)
- `.tm-code-action-buttons` (在 CSS 中声明 1 次)
- `.tm-code-action-btn` (在 CSS 中声明 2 次)
- `.tm-code-action-btn--primary` (在 CSS 中声明 2 次)
- `.tm-code-action-btn--secondary` (在 CSS 中声明 2 次)
- `.tm-toast--top` (在 CSS 中声明 2 次)
- `.tm-toast--bottom` (在 CSS 中声明 2 次)
- `.tm-toast--center` (在 CSS 中声明 2 次)
- `.tm-time-indicator` (在 CSS 中声明 1 次)
- `.tm-volume-control-no-slider` (在 CSS 中声明 2 次)
- `.tm-volume-slider-container` (在 CSS 中声明 3 次)
- `.tm-volume-slider-container-disabled` (在 CSS 中声明 1 次)
- `.tm-volume-slider-track` (在 CSS 中声明 2 次)
- `.tm-volume-slider-level` (在 CSS 中声明 2 次)
- `.tm-volume-value` (在 CSS 中声明 2 次)
- `.tm-progress-handle` (在 CSS 中声明 3 次)
- `.tm-modal-header` (在 CSS 中声明 2 次)
- `.tm-modal-title` (在 CSS 中声明 1 次)
- `.tm-modal-close` (在 CSS 中声明 4 次)
- `.tm-floating-panel-close` (在 CSS 中声明 3 次)
- `.tm-modal-content` (在 CSS 中声明 2 次)
- `.tm-comment-textarea` (在 CSS 中声明 5 次)
- `.tm-modal-footer` (在 CSS 中声明 2 次)
- `.tm-modal-button` (在 CSS 中声明 2 次)
- `.tm-modal-cancel` (在 CSS 中声明 2 次)
- `.tm-modal-submit` (在 CSS 中声明 2 次)
- `.tm-floating-panel-header` (在 CSS 中声明 1 次)
- `.tm-floating-panel-title` (在 CSS 中声明 1 次)
- `.tm-floating-panel-content` (在 CSS 中声明 2 次)
- `.tm-comment-placeholder` (在 CSS 中声明 3 次)
- `.tm-floating-panel-input-area` (在 CSS 中声明 2 次)
- `.tm-floating-panel-input` (在 CSS 中声明 5 次)
- `.tm-floating-panel-submit` (在 CSS 中声明 4 次)
- `.tm-sheet-tab-pill` (在 CSS 中声明 1 次)
- `.tm-color-capsule-play-btn` (在 CSS 中声明 3 次)
- `.tm-play-mode-btn` (在 CSS 中声明 4 次)
- `.tm-integrated-play-btn` (在 CSS 中声明 8 次)
- `.tm-play-mode-text` (在 CSS 中声明 1 次)
- `.tm-settings-options` (在 CSS 中声明 1 次)
- `.tm-time-display` (在 CSS 中声明 2 次)
- `.tm-settings-section` (在 CSS 中声明 1 次)
- `.tm-start-time-container` (在 CSS 中声明 2 次)
- `.tm-end-time-container` (在 CSS 中声明 2 次)
- `.tm-set-loop-start-label` (在 CSS 中声明 2 次)
- `.tm-set-loop-end-label` (在 CSS 中声明 2 次)
- `.tm-loop-start-position` (在 CSS 中声明 2 次)
- `.tm-loop-end-position` (在 CSS 中声明 2 次)
- `.tm-loop-toggle-button` (在 CSS 中声明 2 次)
- `.tm-start-time-container-hover` (在 CSS 中声明 1 次)
- `.tm-start-time-container-default` (在 CSS 中声明 1 次)
- `.tm-end-time-container-hover` (在 CSS 中声明 1 次)
- `.tm-end-time-container-default` (在 CSS 中声明 1 次)
- `.tm-loop-button-hover` (在 CSS 中声明 1 次)
- `.tm-loop-button-active` (在 CSS 中声明 1 次)
- `.tm-loop-button-default` (在 CSS 中声明 1 次)
- `.tm-indicator-base` (在 CSS 中声明 2 次)
- `.tm-pause-indicator` (在 CSS 中声明 1 次)
- `.tm-has-layers` (在 CSS 中声明 2 次)
- `.tm-control-button-hover` (在 CSS 中声明 1 次)
- `.tm-control-button-default` (在 CSS 中声明 1 次)
- `.tm-control-row` (在 CSS 中声明 2 次)
- `.tm-comment-row` (在 CSS 中声明 1 次)
- `.tm-comment-container` (在 CSS 中声明 2 次)
- `.tm-comment-header` (在 CSS 中声明 1 次)
- `.tm-comment-left` (在 CSS 中声明 1 次)
- `.tm-comment-title` (在 CSS 中声明 1 次)
- `.tm-comment-actions` (在 CSS 中声明 1 次)
- `.tm-comment-button` (在 CSS 中声明 3 次)
- `.tm-comment-write` (在 CSS 中声明 2 次)
- `.tm-apple-duration-row` (在 CSS 中声明 1 次)

### 3. 未引用的 Keyframes 动画 (1 个)
- `@keyframes tmShake` (定义于 _comments.css:1267)

### 4. 未引用的 CSS 变量 (15 个)
- `--mp-settings-switch-active` (声明于 _settings_apple.css:15)
- `--mp-settings-switch-track` (声明于 _settings_apple.css:16)
- `--mp-settings-switch-thumb` (声明于 _settings_apple.css:17)
- `--shadcn-popover` (声明于 _variables.css:12)
- `--shadcn-popover-foreground` (声明于 _variables.css:13)
- `--shadcn-primary-foreground` (声明于 _variables.css:15)
- `--shadcn-accent-foreground` (声明于 _variables.css:21)
- `--shadcn-input` (声明于 _variables.css:25)
- `--shadcn-ring` (声明于 _variables.css:26)
- `--shadcn-green-foreground` (声明于 _variables.css:30)
- `--shadcn-red-foreground` (声明于 _variables.css:34)
- `--shadcn-orange-foreground` (声明于 _variables.css:36)
- `--shadcn-purple-foreground` (声明于 _variables.css:38)
- `--button-sm` (声明于 _variables.css:46)
- `--anim-bounce` (声明于 _variables.css:54)

---

## 🎯 六、重构治理行动建议 (Refactor Next Steps)

1. **废弃旧设置面板样式**：在 `_player.css` 中有大量设置相关旧类名（如 `.tm-setting-*`, `.tm-checkbox-*`）在 JS 中命中数为 0，说明已完全被 `_settings_apple.css` 替代，可批量拔除；
2. **清理 `_landscape_legacy.css`**：该文件与 `_landscape_pc.css` 严重重复（如 `.tm-control-buttons`, `.tm-video-container`），确认可直接废弃移除；
3. **收拢 `:root, :host` 变量**：将散落在 `_variables.css`、`_settings_apple.css`、`_landscape_pc.css` 的变量统一收敛至规划的 `00_tokens/_tokens.css`；
4. **消灭重复选择器**：优先治理 Top 10 跨文件重复选择器，消除层叠特异度混乱。
