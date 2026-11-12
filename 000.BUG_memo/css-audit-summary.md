# Miss Player CSS 全局静态审计与摸排报告

> 生成时间：2026-11-12T15:22:23.354Z  
> 耗时：729ms | CSS 文件数：14 | JS 扫描文件数：96  
> 对应专项任务：Phase 14 (CSS Architecture Refactor) - 子任务 A

---

## 📊 一、全局核心指标总览

| 维度指标 | 数值 | 状态/说明 |
| :--- | :--- | :--- |
| **CSS 源码总行数** | **10336** 行 | 包含 8 个子模块与 1 个入口 |
| **CSS 规则总数 (Rules)** | **1171** 条 | PostCSS 解析规则总数 |
| **独立规范化选择器数** | **1222** 个 | 拆分逗号后的单一选择器 |
| **独立 CSS 类名数** | **640** 个 | 全部样式提取的 class 集合 |
| **`!important` 标记总数** | **98** 处 | 待治理（目标 < 50 处） |
| **0 引用自研类名嫌疑** | **78** 个 | `tm-*`, `mp-*`, `jc-*`, `is-*` 零引用 |
| **Grade 1 确凿死选择器** | **112** 个 | 所含类名在 JS 中全部 0 命中 |
| **重复声明选择器数** | **135** 个 | 其中跨文件重复 **87** 个 |
| **散落 `:root, :host` 变量** | **142** 个 | 散落在 3 个文件中的全局变量 |
| **无用 Keyframes 动画** | **1** 个 | CSS 与 JS 均未调用的动画 |
| **无用 CSS 变量** | **81** 个 | 未在 `var()` 或 JS 调用的变量 |

---

## 📁 二、各 CSS 文件分布明细

| 文件路径 | 行数 | 体积 | 规则数 | 选择器数 | 类名数 | !important |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/player/ui/style.css` | 13 | 0.5 KB | 0 | 0 | 0 | **0** |
| `src/player/ui/styles/00_tokens/_tokens.css` | 215 | 8.8 KB | 2 | 4 | 0 | **0** |
| `src/player/ui/styles/00_tokens/_zindex.css` | 26 | 1.0 KB | 1 | 2 | 0 | **0** |
| `src/player/ui/styles/01_core/_host.css` | 181 | 4.9 KB | 25 | 43 | 9 | **19** |
| `src/player/ui/styles/02_components/_composer.css` | 127 | 2.6 KB | 16 | 20 | 15 | **0** |
| `src/player/ui/styles/02_components/_debug.css` | 128 | 3.9 KB | 25 | 25 | 21 | **0** |
| `src/player/ui/styles/02_components/_marker_sheet.css` | 817 | 19.5 KB | 93 | 113 | 73 | **0** |
| `src/player/ui/styles/_comments.css` | 2320 | 55.4 KB | 268 | 306 | 175 | **37** |
| `src/player/ui/styles/_common.css` | 177 | 4.0 KB | 22 | 24 | 12 | **4** |
| `src/player/ui/styles/_controls.css` | 1645 | 39.0 KB | 176 | 198 | 111 | **7** |
| `src/player/ui/styles/_landscape_pc.css` | 784 | 22.7 KB | 87 | 119 | 42 | **9** |
| `src/player/ui/styles/_player.css` | 2622 | 67.3 KB | 299 | 368 | 195 | **21** |
| `src/player/ui/styles/_settings_apple.css` | 1229 | 25.9 KB | 152 | 161 | 120 | **0** |
| `src/player/ui/styles/_variables.css` | 52 | 1.3 KB | 5 | 33 | 14 | **1** |

---

## 🔁 三、最高频重复选择器 Top 10 (跨文件重灾区)

| 排名 | 重复次数 | 跨文件 | 选择器名称 | 分布所在文件 |
| :---: | :---: | :---: | :--- | :--- |
| 1 | **8 次** | ⚠️ 是 | `:root` | _tokens.css, _zindex.css, _host.css, _landscape_pc.css, _settings_apple.css |
| 2 | **8 次** | ⚠️ 是 | `:host` | _tokens.css, _zindex.css, _landscape_pc.css, _player.css, _settings_apple.css |
| 3 | **8 次** | ⚠️ 是 | `.tm-control-buttons` | _landscape_pc.css, _player.css |
| 4 | **5 次** | ⚠️ 是 | `.tm-comments-panel` | _comments.css, _landscape_pc.css, _player.css |
| 5 | **5 次** | ⚠️ 是 | `.tm-show-controls-float-btn` | _comments.css, _landscape_pc.css |
| 6 | **5 次** | ⚠️ 是 | `.tm-settings-panel` | _landscape_pc.css, _player.css, _settings_apple.css |
| 7 | **4 次** | ⚠️ 是 | `html.tm-player-active` | _host.css, _player.css |
| 8 | **4 次** | ⚠️ 是 | `body.tm-player-active` | _host.css, _player.css |
| 9 | **4 次** | ⚠️ 是 | `.tm-floating-button` | _host.css, _common.css |
| 10 | **4 次** | ⚠️ 是 | `.tm-floating-button:hover` | _host.css, _common.css |

### 🚨 跨文件重复选择器清单 (87 处)
- **`:root`** (声明 8 次，涉及 `_tokens.css`, `_zindex.css`, `_host.css`, `_landscape_pc.css`, `_settings_apple.css`)
- **`:host`** (声明 8 次，涉及 `_tokens.css`, `_zindex.css`, `_landscape_pc.css`, `_player.css`, `_settings_apple.css`)
- **`.tm-control-buttons`** (声明 8 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-comments-panel`** (声明 5 次，涉及 `_comments.css`, `_landscape_pc.css`, `_player.css`)
- **`.tm-show-controls-float-btn`** (声明 5 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-settings-panel`** (声明 5 次，涉及 `_landscape_pc.css`, `_player.css`, `_settings_apple.css`)
- **`html.tm-player-active`** (声明 4 次，涉及 `_host.css`, `_player.css`)
- **`body.tm-player-active`** (声明 4 次，涉及 `_host.css`, `_player.css`)
- **`.tm-floating-button`** (声明 4 次，涉及 `_host.css`, `_common.css`)
- **`.tm-floating-button:hover`** (声明 4 次，涉及 `_host.css`, `_common.css`)
- **`.tm-floating-button:active`** (声明 4 次，涉及 `_host.css`, `_common.css`)
- **`.tm-video-container`** (声明 4 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container.tm-sidebar-left .tm-settings-panel`** (声明 4 次，涉及 `_landscape_pc.css`, `_settings_apple.css`)
- **`.tm-sidebar-pos-button`** (声明 4 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container.has-composer-active .tm-control-buttons`** (声明 3 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-floating-comment-panel`** (声明 3 次，涉及 `_comments.css`, `_controls.css`)
- **`.tm-volume-control`** (声明 3 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-video-minimap`** (声明 3 次，涉及 `_controls.css`, `_landscape_pc.css`)
- **`.tm-player-container`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-video-wrapper`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-video-wrapper video`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-handle-container`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container .tm-settings-panel`** (声明 3 次，涉及 `_landscape_pc.css`, `_settings_apple.css`)
- **`.tm-sidebar-toggle-button`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-settings-panel.active`** (声明 3 次，涉及 `_landscape_pc.css`, `_player.css`, `_settings_apple.css`)
- **`.tm-floating-button svg`** (声明 2 次，涉及 `_host.css`, `_common.css`)
- **`.tm-floating-button:hover svg`** (声明 2 次，涉及 `_host.css`, `_common.css`)
- **`.tm-login-username`** (声明 2 次，涉及 `_composer.css`, `_variables.css`)
- **`.tm-login-password`** (声明 2 次，涉及 `_composer.css`, `_variables.css`)
- **`.tm-debug-log-panel-container`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-pill`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-pill:hover`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-icon`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-title`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-status`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-status.level-success`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-status.level-warn`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-status.level-error`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-pill-arrow`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-box`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-box-header`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-box-title`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-box-count`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-box-actions`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-btn`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-btn:hover`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-list`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-empty`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-row`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-row .tm-log-time`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-row.level-info .tm-log-msg`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-row.level-success .tm-log-msg`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-row.level-warn .tm-log-msg`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-debug-log-row.level-error .tm-log-msg`** (声明 2 次，涉及 `_debug.css`, `_player.css`)
- **`.tm-tab-scroll-container`** (声明 2 次，涉及 `_marker_sheet.css`, `_player.css`)
- **`.tm-tab-actions-capsule`** (声明 2 次，涉及 `_marker_sheet.css`, `_controls.css`)
- **`.tm-player-container.has-sheet-open .tm-comment-fab-btn`** (声明 2 次，涉及 `_marker_sheet.css`, `_comments.css`)
- **`.tm-player-container.has-sheet-open .tm-show-controls-float-btn`** (声明 2 次，涉及 `_marker_sheet.css`, `_comments.css`)
- **`.tm-sheet-item-comment-input`** (声明 2 次，涉及 `_marker_sheet.css`, `_variables.css`)
- **`.tm-comments-panel::after`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comments-panel-list.tm-comments-list`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-input-textarea`** (声明 2 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-comment-text-input`** (声明 2 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-tag-remark-input`** (声明 2 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-comment-section`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-section:not(.is-collapsed)`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-comment-section-body`** (声明 2 次，涉及 `_comments.css`, `_landscape_pc.css`)
- **`.tm-report-note`** (声明 2 次，涉及 `_comments.css`, `_variables.css`)
- **`.tm-video-overlay *`** (声明 2 次，涉及 `_common.css`, `_variables.css`)
- **`.tm-settings-label`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-time-control-button-active`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-time-control-button-after-active`** (声明 2 次，涉及 `_controls.css`, `_player.css`)
- **`.tm-floating-panel-input`** (声明 2 次，涉及 `_controls.css`, `_variables.css`)
- **`.tm-control-buttons .tm-tab-pill`** (声明 2 次，涉及 `_controls.css`, `_landscape_pc.css`)
- **`.tm-control-buttons.dragging`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-video-overlay`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container.tm-sidebar-hidden .tm-comments-panel`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container > .tm-player-title`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-button-container`** (声明 2 次，涉及 `_landscape_pc.css`, `_player.css`)
- **`.tm-player-container .tm-settings-panel.active`** (声明 2 次，涉及 `_landscape_pc.css`, `_settings_apple.css`)
- **`.tm-player-container.tm-sidebar-left .tm-settings-panel.active`** (声明 2 次，涉及 `_landscape_pc.css`, `_settings_apple.css`)
- **`.tm-settings-sources-subpanel`** (声明 2 次，涉及 `_player.css`, `_settings_apple.css`)
- **`.tm-webdav-input`** (声明 2 次，涉及 `_player.css`, `_variables.css`)
- **`.tm-about-check-row`** (声明 2 次，涉及 `_player.css`, `_settings_apple.css`)
- **`.tm-inline-remark-input`** (声明 2 次，涉及 `_player.css`, `_variables.css`)
- **`.tm-apple-duration-input`** (声明 2 次，涉及 `_settings_apple.css`, `_variables.css`)
- **`.tm-settings-input`** (声明 2 次，涉及 `_settings_apple.css`, `_variables.css`)

---

## 🌐 四、`:root, :host` 变量散落与覆写分布 (142 处)

- `--sidebar-width` ⚠️ (在 5 处被重复声明/媒体查询修改): 存在于 _tokens.css, _landscape_pc.css
- `--brand-pink` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _host.css
- `--brand-pink-rgb` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _host.css
- `--mp-settings-card-bg` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-card-border` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-card-radius` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-row-height` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-divider` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-text-primary` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-text-secondary` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-text-muted` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-switch-active` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-switch-track` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
- `--mp-settings-switch-thumb` ⚠️ (在 2 处被重复声明/媒体查询修改): 存在于 _tokens.css, _settings_apple.css
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

### 1. Grade 1 确凿死选择器 (Top 25 展示 / 共 112 个)
> 定义：包含自研前缀（`tm-`, `mp-`, `jc-`, `is-` 等），但所包含的类名在全量 86 个 JS 源码中命中数为 0。

- `.tm-comment-filter-checkbox:hover` → 声明于: _comments.css:92 (包含类名: .tm-comment-filter-checkbox)
- `.tm-comment-filter-checkbox:checked` → 声明于: _comments.css:97 (包含类名: .tm-comment-filter-checkbox)
- `.tm-comment-filter-checkbox:checked::after` → 声明于: _comments.css:103 (包含类名: .tm-comment-filter-checkbox)
- `.tm-custom-modal-login-btn` → 声明于: _comments.css:376 (包含类名: .tm-custom-modal-login-btn)
- `.tm-custom-modal-login-btn:hover` → 声明于: _comments.css:394 (包含类名: .tm-custom-modal-login-btn)
- `.tm-custom-modal-login-btn:active` → 声明于: _comments.css:398 (包含类名: .tm-custom-modal-login-btn)
- `.jc-site` → 声明于: _comments.css:843 (包含类名: .jc-site)
- `.jc-site-jable` → 声明于: _comments.css:855 (包含类名: .jc-site-jable)
- `.jc-site-javlib` → 声明于: _comments.css:861 (包含类名: .jc-site-javlib)
- `.jc-c-sep` → 声明于: _comments.css:1022 (包含类名: .jc-c-sep)
- `.jc-emoji` → 声明于: _comments.css:1264 (包含类名: .jc-emoji)
- `.tm-comments-tab-btn` → 声明于: _comments.css:1485 (包含类名: .tm-comments-tab-btn)
- `.tm-comments-tab-btn:hover` → 声明于: _comments.css:1499 (包含类名: .tm-comments-tab-btn)
- `.tm-comments-tab-btn:active` → 声明于: _comments.css:1504 (包含类名: .tm-comments-tab-btn)
- `.jc-site-javlib-review` → 声明于: _comments.css:1567 (包含类名: .jc-site-javlib-review)
- `.tm-status-badge-loading` → 声明于: _comments.css:1745 (包含类名: .tm-status-badge-loading)
- `.tm-status-badge-unreachable` → 声明于: _comments.css:1752 (包含类名: .tm-status-badge-unreachable)
- `.tm-status-badge-not_found` → 声明于: _comments.css:1758 (包含类名: .tm-status-badge-not_found)
- `.tm-status-badge-mobile_unsupported` → 声明于: _comments.css:1764 (包含类名: .tm-status-badge-mobile_unsupported)
- `.tm-status-badge-empty` → 声明于: _comments.css:1770 (包含类名: .tm-status-badge-empty)
- `.tm-status-badge-cf_shield` → 声明于: _comments.css:1776 (包含类名: .tm-status-badge-cf_shield)
- `.tm-status-badge-loaded` → 声明于: _comments.css:1782 (包含类名: .tm-status-badge-loaded)
- `.jc-card-highlight-flash` → 声明于: _comments.css:1817 (包含类名: .jc-card-highlight-flash)
- `.tm-code-action-dialog` → 声明于: _comments.css:1988 (包含类名: .tm-code-action-dialog)
- `.tm-code-action-title` → 声明于: _comments.css:2008 (包含类名: .tm-code-action-title)

*(更多 87 个详见 css-audit-report.json)*


### 2. 0 引用自研类名清单 (共 78 个)
- `.mp-composer-publish-btn` (在 CSS 中声明 1 次)
- `.tm-comment-filter-checkbox` (在 CSS 中声明 3 次)
- `.tm-custom-modal-login-btn` (在 CSS 中声明 3 次)
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
- `.tm-comment-placeholder` (在 CSS 中声明 1 次)
- `.tm-floating-panel-input-area` (在 CSS 中声明 2 次)
- `.tm-floating-panel-input` (在 CSS 中声明 5 次)
- `.tm-floating-panel-submit` (在 CSS 中声明 4 次)
- `.has-glow` (在 CSS 中声明 1 次)
- `.tm-sheet-tab-pill` (在 CSS 中声明 1 次)
- `.tm-integrated-play-btn` (在 CSS 中声明 9 次)
- `.tm-color-capsule-play-btn` (在 CSS 中声明 4 次)
- `.tm-play-mode-btn` (在 CSS 中声明 5 次)
- `.tm-play-mode-text` (在 CSS 中声明 1 次)
- `.tm-settings-options` (在 CSS 中声明 1 次)
- `.tm-source-badge` (在 CSS 中声明 4 次)
- `.tm-pause-indicator` (在 CSS 中声明 1 次)
- `.tm-time-display` (在 CSS 中声明 1 次)
- `.tm-control-button-hover` (在 CSS 中声明 1 次)
- `.tm-control-button-default` (在 CSS 中声明 1 次)
- `.tm-apple-duration-row` (在 CSS 中声明 1 次)
- `.tm-peach-action-row` (在 CSS 中声明 1 次)
- `.tm-peach-action-btn` (在 CSS 中声明 1 次)
- `.tm-peach-origins-text` (在 CSS 中声明 1 次)
- `.tm-peach-source-action-wrap` (在 CSS 中声明 1 次)
- `.tm-peach-scraper-wrap` (在 CSS 中声明 2 次)
- `.tm-peach-scraper-input` (在 CSS 中声明 1 次)
- `.tm-peach-test-scraper-btn` (在 CSS 中声明 1 次)
- `.tm-peach-jv-login-btn` (在 CSS 中声明 2 次)
- `.tm-peach-relay-btn` (在 CSS 中声明 2 次)
- `.tm-peach-advisor-btn-sub` (在 CSS 中声明 2 次)
- `.tm-seek-step-input` (在 CSS 中声明 1 次)

### 3. 未引用的 Keyframes 动画 (1 个)
- `@keyframes tmShake` (定义于 _comments.css:1457)

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
- `--mp-settings-switch-active` (声明于 _tokens.css:95, _settings_apple.css:15)
- `--mp-settings-switch-track` (声明于 _tokens.css:96, _settings_apple.css:16)
- `--mp-settings-switch-thumb` (声明于 _tokens.css:97, _settings_apple.css:17)
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
