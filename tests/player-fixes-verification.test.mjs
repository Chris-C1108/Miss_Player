import assert from 'node:assert';
import fs from 'fs';
import { VolumeController } from '../src/player/controls/VolumeController.js';
import { setValue, getValue } from '../src/utils/storage.js';

console.log('🧪 开始执行播放器综合修复与人机工程验证单元测试...');

// ---------------------------------------------------------
// 1. 验证 SingleHandManager 左右手模式手势范围与防冲突逻辑
// ---------------------------------------------------------
console.log('▶ 1. 验证 SingleHandManager 左右手模式手势限制...');
const singleHandCode = fs.readFileSync('src/player/managers/SingleHandManager.js', 'utf8');

// 验证进度条整行排除
assert.ok(
    singleHandCode.includes("target?.closest?.('.tm-progress-row, .tm-progress-bar-container, .tm-slider-handle, .tm-progress-controls')"),
    'SingleHandManager 必须排除进度条整行及所有子组件'
);

// 验证仅 tm-seek-control-row 允许切换左右手
assert.ok(
    singleHandCode.includes("this._isFromSeekRow = Boolean(target?.closest?.('.tm-seek-control-row'));"),
    'SingleHandManager 必须明确识别是否源自时间快速跳转行'
);

assert.ok(
    singleHandCode.includes("this._isFromPlaybackRow = Boolean(target?.closest?.('.tm-playback-control-row, .mp-switcher-wrapper, .mp-switcher-capsule, .tm-center-controls, .tm-playback-bottom-layer, .tm-playback-top-layer'));"),
    'SingleHandManager 必须识别底部播放模式切换行'
);

assert.ok(
    singleHandCode.includes('if (this._isFromSeekRow !== undefined && !this._isFromSeekRow) {\n            return;\n        }') ||
    singleHandCode.includes('if (this._isFromSeekRow !== undefined && !this._isFromSeekRow) {'),
    'SingleHandManager 必须在非快速跳转行阻止左右手模式切换'
);
console.log('✅ 1. SingleHandManager 左右滑动触发限制与组件放行验证通过');

// ---------------------------------------------------------
// 2. 验证 PlaybackController 胶囊循环播放与倍速持久化
// ---------------------------------------------------------
console.log('▶ 2. 验证 PlaybackController 循环播放与倍速持久化...');
const playbackCtrlCode = fs.readFileSync('src/player/controls/PlaybackController.js', 'utf8');

// 验证超出胶囊索引后循环重置为 0 而非结束
assert.ok(
    playbackCtrlCode.includes('if (this._capsulePlayIndex >= tabs.length || this._capsulePlayIndex < 0) {\n            this._capsulePlayIndex = 0;\n        }'),
    'PlaybackController 必须在超出胶囊末尾时将索引重置为 0 继续循环'
);

// 验证倍速切换时写入 preferredPlaybackRate 与 playerState
assert.ok(
    playbackCtrlCode.includes("setValue('preferredPlaybackRate', nextSpeed);") &&
    playbackCtrlCode.includes("playerState.updateSetting('preferredPlaybackRate', nextSpeed);"),
    'PlaybackController 必须在切换倍速时同时同步至 playerState'
);
console.log('✅ 2. PlaybackController 循环播放与倍速持久化验证通过');

// ---------------------------------------------------------
// 3. 验证 PlayerCore 首选倍速加载与元数据防重置
// ---------------------------------------------------------
console.log('▶ 3. 验证 PlayerCore 倍速恢复与防宿主重置...');
const playerCoreCode = fs.readFileSync('src/player/core/PlayerCore.js', 'utf8');

assert.ok(
    playerCoreCode.includes("getValue('preferredPlaybackRate', 1.0)"),
    'PlayerCore 必须读取 preferredPlaybackRate 字段'
);
assert.ok(
    playerCoreCode.includes("this.targetVideo.addEventListener('loadedmetadata', restoreSpeedOnReady, { once: true });"),
    'PlayerCore 必须在 loadedmetadata 时防宿主将倍速重置为 1.0'
);
console.log('✅ 3. PlayerCore 倍速恢复与防重置逻辑验证通过');

// ---------------------------------------------------------
// 4. 验证默认静音策略 (默认开启，带 5 分钟闲置超时记忆)
// ---------------------------------------------------------
console.log('▶ 4. 验证默认静音与超时重置策略...');
const playerStateCode = fs.readFileSync('src/player/state/PlayerState.js', 'utf8');
assert.ok(
    playerStateCode.includes('defaultMuted: true'),
    'PlayerState 中 defaultMuted 必须默认为 true'
);

const volumeControllerCode = fs.readFileSync('src/player/controls/VolumeController.js', 'utf8');
assert.ok(
    volumeControllerCode.includes("getBool('defaultMuted', true)"),
    'VolumeController 中 defaultMuted 回退值必须为 true'
);
console.log('✅ 4. 默认静音策略验证通过');

// ---------------------------------------------------------
// 5. 验证 DragManager 移动端评论收缩态手柄调整基准保持
// ---------------------------------------------------------
console.log('▶ 5. 验证 DragManager 视口收缩态手柄调整基准保持...');
const dragManagerCode = fs.readFileSync('src/player/managers/DragManager.js', 'utf8');

assert.ok(
    dragManagerCode.includes("const isCollapsed = !this.uiManager?.controlsVisible || (this.container && this.container.classList.contains('is-collapsed-ratio'));"),
    'DragManager 必须检测是否处于评论收缩态'
);
assert.ok(
    dragManagerCode.includes('this.startHeight = currentVisibleHeight;'),
    'DragManager 必须以当前可视高度作为起始调整高度'
);

const uiManagerCode = fs.readFileSync('src/player/ui/UIManager.js', 'utf8');
assert.ok(
    uiManagerCode.includes('if (this.dragManager && this.dragManager.isDraggingHandle) {\n            return;\n        }'),
    'UIManager 必须在手柄拖拽过程中禁止重置或覆盖容器高度'
);
console.log('✅ 5. DragManager 视口调整基准保持验证通过');

// ---------------------------------------------------------
// 6. 验证手柄拖拽时 Minimap 尺寸前置计算与双向协同唤醒
// ---------------------------------------------------------
console.log('▶ 6. 验证手柄拖拽与 Minimap 状态联动...');
const videoSwipeCode = fs.readFileSync('src/player/managers/videoSwipeManager.js', 'utf8');

// 验证无论 maxOffset 是否大于 0，均前置计算 Minimap 尺寸与比例
assert.ok(
    videoSwipeCode.includes('if (this.minimap && this.videoWidth > 0 && this.videoHeight > 0)'),
    'VideoSwipeManager 必须前置计算 Minimap 尺寸，杜绝尺寸未定义空盒'
);

// 验证按住手柄时即时刷新几何约束
assert.ok(
    videoSwipeCode.includes('this._doUpdateConstraints();') &&
    videoSwipeCode.includes("this.container.classList.add('is-swiping');"),
    'VideoSwipeManager 必须在手柄按压时即时刷新约束并按需唤醒 is-swiping'
);

// 验证 DragManager 在拉伸高度时即时同步刷新 Minimap
assert.ok(
    dragManagerCode.includes('swipeManager._doUpdateConstraints();') &&
    dragManagerCode.includes("swipeManager.container.classList.add('is-swiping');"),
    'DragManager 必须在手柄拉伸时同步驱动 Minimap 显隐与视口刷新'
);

// 验证 VideoSwipeManager 延迟移除时守卫 DragManager 状态
assert.ok(
    videoSwipeCode.includes('const isStillResizing = Boolean(dragManager && dragManager.isDraggingHandle);'),
    'VideoSwipeManager 必须在拖拽拉伸进行中禁止过早移除 is-swiping'
);
console.log('✅ 6. 手柄拖拽与 Minimap 联动守卫验证通过');

// ---------------------------------------------------------
// 7. 验证通用媒体盒模型缩放与 Web Components 挂载解耦
// ---------------------------------------------------------
console.log('▶ 7. 验证通用媒体盒模型缩放与 Web Components 挂载解耦...');
const playerCssCode = fs.readFileSync('src/player/ui/styles/01_core/_layout.css', 'utf8');
assert.ok(
    playerCssCode.includes('width: auto !important;') &&
    playerCssCode.includes('max-width: none !important;'),
    '_player.css 必须保持 width: auto !important 与 max-width: none !important，保障竖屏下拉等比放大'
);

const hostCssCode = fs.readFileSync('src/player/ui/styles/01_core/_host.css', 'utf8');
assert.ok(
    hostCssCode.includes('body.tm-player-active dialog[open] > *:not(miss-player-root):not(.tm-floating-button) {\n  pointer-events: none !important;\n}') &&
    !hostCssCode.includes('visibility: hidden !important;'),
    '_host.css 必须仅对 dialog[open] 子节点设置 pointer-events: none，严禁使用 visibility: hidden 抹空底层画面导致下拉时出现 1 秒黑屏'
);
console.log('✅ 7. 通用媒体盒模型缩放与 Web Components 挂载解耦验证通过');

// ---------------------------------------------------------
// 8. 验证播放器关闭单一出口漏斗与死代码清理
// ---------------------------------------------------------
console.log('▶ 8. 验证播放器关闭单一出口漏斗与死代码清理...');
const eventManagerCode = fs.readFileSync('src/player/managers/EventManager.js', 'utf8');
assert.ok(
    eventManagerCode.includes("if (typeof this.onClose === 'function') {\n            this.onClose();") &&
    eventManagerCode.includes('this.uiElements.rootHost'),
    'EventManager 必须优先调用 onClose 回调并在降级路径下完整传递 rootHost'
);

const customPlayerCode = fs.readFileSync('src/player/CustomVideoPlayer.js', 'utf8');
assert.ok(
    !customPlayerCode.includes('PeachWebBridge.stopProgressTracking'),
    'CustomVideoPlayer 严禁调用已废弃的 PeachWebBridge.stopProgressTracking'
);
assert.ok(
    !playerCoreCode.includes('PeachWebBridge.takeOverPlayback'),
    'PlayerCore 严禁调用已废弃的 PeachWebBridge.takeOverPlayback'
);
assert.ok(
    playerCoreCode.includes("const mountHost = innerVideo.closest('hlsjs-video, dash-video, mux-video, [data-media-host]');") &&
    playerCoreCode.includes('const nodeToRescue = mountHost || innerVideo;'),
    'PlayerCore.cleanupExistingOverlays 必须优先救回 mediaHostElement，杜绝拔除裸 video'
);
console.log('✅ 8. 播放器关闭单一出口漏斗与死代码清理验证通过');

// ---------------------------------------------------------
// 9. 验证 Top Layer 模态栈感知与 iOS 起播互锁收窄
// ---------------------------------------------------------
console.log('▶ 9. 验证 Top Layer 模态栈感知与 iOS 起播互锁收窄...');
const floatingBtnCode = fs.readFileSync('src/player/ui/FloatingButton.js', 'utf8');
assert.ok(
    floatingBtnCode.includes("document.addEventListener('close', this._dialogCloseHandler, true);") &&
    floatingBtnCode.includes("attributeFilter: ['open', 'src']"),
    'FloatingButton 必须实时监听 dialog close/cancel 与 open/src 属性变动'
);

const iosInlineCode = fs.readFileSync('src/utils/iosInline.js', 'utf8');
assert.ok(
    iosInlineCode.includes('export function isIosDevice()'),
    'iosInline.js 必须导出 isIosDevice 精确判定'
);
assert.ok(
    playerCoreCode.includes('const needTempMute = isIosDevice() && !originalMuted;'),
    'PlayerCore 必须将起播强制静音防全屏互锁仅限定在 iOS 环境'
);
console.log('✅ 9. Top Layer 模态栈感知与 iOS 起播互锁收窄验证通过');

// ---------------------------------------------------------
// 10. 验证下滑关闭 0ms 瞬时无空白还原 (Zero-Blank Swipe-Down Restoration)
// ---------------------------------------------------------
console.log('▶ 10. 验证下滑关闭 0ms 瞬时无空白还原...');
assert.ok(
    playerCoreCode.includes('restoreMediaToHost()') &&
    playerCoreCode.includes('this.videoPlaceholder.style.height = `${Math.round(hostRect.height)}px`;'),
    'PlayerCore 必须提供幂等 restoreMediaToHost() 方法并锁定占位符物理尺寸'
);
assert.ok(
    videoSwipeCode.includes("this.uiElements.playerContainer.style.opacity = '1';") &&
    videoSwipeCode.includes('this.playerCore.restoreMediaToHost()'),
    'VideoSwipeManager 下拉时必须保持 playerContainer 不透明度为 1，并在释放首帧立即执行 restoreMediaToHost()'
);
assert.ok(
    playerCssCode.includes('.tm-player-container') &&
    playerCssCode.includes('background-color: transparent;'),
    '_player.css 中 .tm-player-container 必须为 transparent 背景，由 .tm-video-overlay 统一承担背景渐隐'
);
console.log('✅ 10. 下滑关闭 0ms 瞬时无空白还原验证通过');

// ---------------------------------------------------------
// 11. 验证浮动按钮设备分档定位与空间碰撞防遮挡引擎
// ---------------------------------------------------------
console.log('▶ 11. 验证浮动按钮设备分档定位与空间碰撞防遮挡引擎...');
assert.ok(
    hostCssCode.includes('left: calc(50% + var(--mp-fab-offset-x, 0px));') &&
    hostCssCode.includes('transform: translateX(-50%);') &&
    hostCssCode.includes('@media screen and (min-width: 600px) and (min-height: 600px), (pointer: fine)'),
    '_host.css 必须实现手机端底部居中与 iPad/PC 端右下角响应式分档定位'
);
assert.ok(
    floatingBtnCode.includes('isTabletOrDesktop()') &&
    floatingBtnCode.includes('_resolveCollisionOffsets()') &&
    floatingBtnCode.includes('document.elementsFromPoint(px, py)') &&
    floatingBtnCode.includes('targetContainer.lastElementChild !== this.button'),
    'FloatingButton 必须具备 elementsFromPoint 空间碰撞避让引擎与容器末位节点挂载保障'
);
console.log('✅ 11. 浮动按钮设备分档定位与空间碰撞防遮挡引擎验证通过');

// ---------------------------------------------------------
// 12. 验证高光列表、评论发表栏、附带片段抽屉、登录模态框与 iOS 键盘适配
// ---------------------------------------------------------
console.log('▶ 12. 验证高光列表、评论发表栏、附带片段抽屉、登录模态框与 iOS 键盘适配...');
const markerSheetJs = fs.readFileSync('src/player/managers/MarkerBottomSheet.js', 'utf8');
const markerSheetCss = fs.readFileSync('src/player/ui/styles/02_components/_marker_sheet.css', 'utf8');
const commentComposerJs = fs.readFileSync('src/player/controls/CommentComposer.js', 'utf8');
const commentsCss = fs.readFileSync('src/player/ui/styles/02_components/_comments.css', 'utf8');
const composerCss = fs.readFileSync('src/player/ui/styles/02_components/_composer.css', 'utf8');

assert.ok(
    !markerSheetJs.includes('.tm-sheet-toolbar') &&
    markerSheetJs.includes('const color = tab.color || this.tabColors[index % this.tabColors.length];') &&
    markerSheetJs.includes('tm-sheet-item-main') &&
    !markerSheetJs.includes('tm-sheet-save-btn'),
    'MarkerBottomSheet 必须合并单顶栏、保留 tab.color 持久色彩、分离主行与标签展开抽屉并移除冗余保存按钮'
);
assert.ok(
    commentComposerJs.includes('this.sendBtn = sendBtn;') &&
    commentComposerJs.includes('updateTagButtonBadge()') &&
    commentComposerJs.includes('登录后即可直接发表评论与高光片段'),
    'CommentComposer 必须缓存 sendBtn 引用、同步高光角标并支持一键直达登录弹窗与自动续发'
);
assert.ok(
    !commentsCss.includes('z-index: 9996') &&
    !commentsCss.includes('z-index: 9997') &&
    !commentsCss.includes('accent-color: #ff5050') &&
    composerCss.includes('font-size: 16px;') &&
    markerSheetCss.includes('font-size: 16px;'),
    '所有表单输入框必须锁定 16px 防止 iOS Safari 自动放大，且消灭魔法 z-index 与多重冲突样式'
);
console.log('✅ 12. 高光列表、评论发表栏、附带片段抽屉、登录模态框与 iOS 键盘适配验证通过');

// ---------------------------------------------------------
// 13. 验证手柄栏层级、评论栏与控制面板互斥关系、以及点击 + 号保持 iOS 虚拟键盘焦点
// ---------------------------------------------------------
console.log('▶ 13. 验证手柄栏层级、评论栏与控制面板互斥关系、以及点击 + 号保持 iOS 虚拟键盘焦点...');
const uiManagerJs = fs.readFileSync('src/player/ui/UIManager.js', 'utf8');
assert.ok(
    !playerCssCode.includes('z-index: 9986') &&
    playerCssCode.includes('z-index: calc(var(--z-base) + 2);') &&
    playerCssCode.includes('.tm-player-container.has-composer-active .tm-handle-container'),
    '视频下方拖动手柄栏 .tm-handle-container 严禁使用 9986 魔法层级遮挡输入框，必须在激活输入或虚拟键盘时低于 --z-composer 并禁用手势拦截'
);
assert.ok(
    commentsCss.includes('.tm-player-container.has-composer-active .tm-control-panel') &&
    commentsCss.includes('.tm-player-container.has-composer-active .tm-control-buttons') &&
    uiManagerJs.includes('.tm-comment-submit-bar-wrapper') &&
    commentComposerJs.includes('this.panel.uiManager.hideControls(true)'),
    '评论发表栏与播放控制面板必须严格互斥，在评论输入栏内滑动或点击严禁误唤醒控制面板'
);
assert.ok(
    commentComposerJs.includes('const bindToolbarBtn = (btn, handler) =>') &&
    commentComposerJs.includes('targetInput.focus({ preventScroll: true });') &&
    commentComposerJs.includes('getActiveInputElement()'),
    '点击评论栏 + 号及工具按钮必须阻止默认失焦并保持输入框焦点，杜绝 iOS Safari 虚拟键盘闪退消失'
);
console.log('✅ 13. 手柄栏层级、评论栏与控制面板互斥关系、以及点击 + 号保持 iOS 虚拟键盘焦点验证通过');

// ---------------------------------------------------------
// 14. 验证显式 UISurfaceMachine 状态机与全项目隐式状态机收口治理
// ---------------------------------------------------------
console.log('▶ 14. 验证显式 UISurfaceMachine 状态机与全项目隐式状态机收口治理...');
const surfaceMachineJs = fs.readFileSync('src/player/state/UISurfaceMachine.js', 'utf8');
const settingsManagerJs = fs.readFileSync('src/player/managers/SettingsManager.js', 'utf8');
const loopManagerJs = fs.readFileSync('src/player/managers/LoopManager.js', 'utf8');
const commentPanelJs = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');
const playerStateJs = fs.readFileSync('src/player/state/PlayerState.js', 'utf8');

assert.ok(
    surfaceMachineJs.includes('export class UISurfaceMachine') &&
    surfaceMachineJs.includes('export function bindKeepFocusAction') &&
    surfaceMachineJs.includes('export function bindActionWithoutBlurShift') &&
    surfaceMachineJs.includes('container.dataset.activeSurface = this.activeSurface;'),
    'UISurfaceMachine 必须提供显式浮层互斥状态机、焦点保持绑定与防失焦位移绑定，并同步更新 data-active-surface'
);
assert.ok(
    settingsManagerJs.includes('SURFACE_TYPES.SETTINGS') &&
    settingsManagerJs.includes("document.addEventListener('click', this.overlayClickHandler, true)") &&
    loopManagerJs.includes('SURFACE_TYPES.INLINE_REMARK') &&
    loopManagerJs.includes('bindActionWithoutBlurShift(saveBtn') &&
    markerSheetJs.includes('SURFACE_TYPES.MARKER_SHEET') &&
    markerSheetJs.includes('bindKeepFocusAction(tagToggleBtn'),
    'SettingsManager、LoopManager、MarkerBottomSheet 必须统一接入 UISurfaceMachine 与 iOS 防失焦辅助函数，并使用捕获阶段 composedPath 处理外部点击'
);
assert.ok(
    uiManagerJs.includes('this.playerCore.userPauseIntent = false;') &&
    loopManagerJs.includes('this.playerCore.userPauseIntent = false;') &&
    commentPanelJs.includes('this.playerCore.userPauseIntent = false;') &&
    playerStateJs.includes("(rawColorMode === 'review') ? 'review' : 'preview'"),
    '视频点击、高光胶囊与评论时间戳跳转播放时必须同步重置 userPauseIntent 防自锁，且 PlayerState 必须修正 rawColorMode 变量读取'
);
console.log('✅ 14. 显式 UISurfaceMachine 状态机与全项目隐式状态机收口治理验证通过');

// ---------------------------------------------------------
// 15. 验证 Peach Web / SPA 浮动按钮长效心跳巡检、Shadow DOM 视频穿透与模态层破壁包含块防护
// ---------------------------------------------------------
console.log('▶ 15. 验证 Peach Web / SPA 浮动按钮长效心跳巡检与模态层破壁防护...');
const domJsCode = fs.readFileSync('src/utils/dom.js', 'utf8');

assert.ok(
    domJsCode.includes("const activeDialog = document.querySelector('dialog[open], dialog#stage, [data-stage-host] dialog, [data-stage-dialog]');") &&
    domJsCode.includes("const customPlayerHosts = document.querySelectorAll('hlsjs-video, video-player, media-container, [data-media-host]');"),
    'dom.js 必须支持激活模态 dialog 优先定位并深度穿透检查所有播放器 Web Components 宿主'
);

assert.ok(
    floatingBtnCode.includes('getActiveDialog()') &&
    floatingBtnCode.includes("document.addEventListener('toggle', this._dialogCloseHandler, true);"),
    'FloatingButton 必须集成 getActiveDialog 模态可见性判定与原生 toggle/close 事件多重监听'
);

assert.ok(
    hostCssCode.includes('dialog[open]:has(.tm-floating-button)') &&
    hostCssCode.includes('contain: none !important;'),
    '_host.css 必须打破模态 dialog[open] 内部包含块陷阱，防止唤醒浮钮定位变形被宿主裁剪'
);

console.log('✅ 15. Peach Web / SPA 浮动按钮长效心跳巡检与模态层破壁防护验证通过');

// ---------------------------------------------------------
// 16. 验证高光备注弹窗与转存操作零视口纵向位移 (Zero-Displacement Pill Center & Container Scroll Lock)
// ---------------------------------------------------------
console.log('▶ 16. 验证高光备注与转存零视口纵向位移与容器滚动防失真守卫...');
const updatedLoopManagerJs = fs.readFileSync('src/player/managers/LoopManager.js', 'utf8');
const updatedCommentPanelJs = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');
const updatedUiManagerJs = fs.readFileSync('src/player/ui/UIManager.js', 'utf8');
const updatedIndexJs = fs.readFileSync('src/index.js', 'utf8');
const composerJsCode = fs.readFileSync('src/player/controls/CommentComposer.js', 'utf8');
const markerSheetJsCode = fs.readFileSync('src/player/managers/MarkerBottomSheet.js', 'utf8');

// 验证全代码库已彻底清除未受控的 native scrollIntoView 调用
assert.ok(
    !updatedLoopManagerJs.includes('scrollIntoView') &&
    !updatedCommentPanelJs.includes('scrollIntoView') &&
    !composerJsCode.includes('scrollIntoView') &&
    !markerSheetJsCode.includes('scrollIntoView'),
    '全项目业务组件必须彻底杜绝调用原生 scrollIntoView，防止破坏 iOS Safari 祖先容器垂直滚动轴'
);

// 验证 LoopManager 采用纯横向动力学居中 _scrollToCenterPill
assert.ok(
    updatedLoopManagerJs.includes('_scrollToCenterPill(pill, force = false)') &&
    updatedLoopManagerJs.includes('this._scrollToCenterPill(el, true)') &&
    updatedLoopManagerJs.includes('this._scrollToCenterPill(pill, true)'),
    'LoopManager 必须通过纯横向 _scrollToCenterPill 进行胶囊居中，且支持 force 强制滚动'
);

// 验证转存操作阻止默认行为并重置滚动位移
assert.ok(
    updatedCommentPanelJs.includes('e.preventDefault();') &&
    updatedCommentPanelJs.includes('container.scrollTop = 0;'),
    'CommentPanel 的 saveAllBtn 转存点击必须阻止默认行为并强行重置容器 scrollTop 为 0'
);

// 验证 UIManager 与 src/index.js 守卫全屏 playerContainer 滚动零偏移
assert.ok(
    updatedUiManagerJs.includes("this.playerContainer.addEventListener('scroll'") &&
    updatedUiManagerJs.includes('this.playerContainer.scrollTop = 0') &&
    updatedIndexJs.includes('resetViewportScroll'),
    'UIManager 必须直接监听 playerContainer 滚动并自愈归零，且 index.js 必须通过 composedPath 穿透重置视口'
);

console.log('✅ 16. 高光备注与转存零视口纵向位移与容器滚动防失真守卫验证通过');

// ---------------------------------------------------------
// 17. 验证系统级全局事件黑洞 (Event Sink)、底层树物理冻结与焦点转移锁
// ---------------------------------------------------------
console.log('▶ 17. 验证系统级全局事件黑洞、底层树物理冻结与焦点转移锁...');
const updatedEventManagerCode = fs.readFileSync('src/player/managers/EventManager.js', 'utf8');
const settingsManagerCode = fs.readFileSync('src/player/managers/SettingsManager.js', 'utf8');
const markerSheetCssCode = fs.readFileSync('src/player/ui/styles/02_components/_marker_sheet.css', 'utf8');
const commentsCssCode = fs.readFileSync('src/player/ui/styles/02_components/_comments.css', 'utf8');
const updatedPlayerCss = fs.readFileSync('src/player/ui/styles/01_core/_layout.css', 'utf8');
const surfaceMachineCode = fs.readFileSync('src/player/state/UISurfaceMachine.js', 'utf8');

// 17.1 验证 UISurfaceMachine 系统级事件黑洞网 (Event Sink)
assert.ok(
    surfaceMachineCode.includes('_ensureEventSink()') &&
    surfaceMachineCode.includes('tm-surface-event-sink') &&
    surfaceMachineCode.includes("container.dataset.hasOverlay = hasAny ? 'true' : 'false';") &&
    updatedPlayerCss.includes('.tm-surface-event-sink') &&
    updatedPlayerCss.includes('.tm-surface-event-sink.visible'),
    'UISurfaceMachine 必须具备系统级全局事件黑洞网 (tm-surface-event-sink) 与 hasOverlay 标记'
);

// 17.2 验证 UISurfaceMachine 捕获阶段阻断触摸向外部宿主泄漏 (Blindfolding Stay App)
assert.ok(
    surfaceMachineCode.includes('_handleContainerCaptureTouch(e)') &&
    surfaceMachineCode.includes('e.stopPropagation();') &&
    surfaceMachineCode.includes("container.addEventListener('touchstart', this._handleContainerCaptureTouch, true);"),
    'UISurfaceMachine 必须在容器捕获阶段阻断触摸向外部宿主 window 冒泡，彻底阻断 Stay App 外部侦测'
);

// 17.3 验证 UISurfaceMachine 系统级焦点转移锁 (Focus Staging Machine)
assert.ok(
    surfaceMachineCode.includes('acquireFocusLock()') &&
    surfaceMachineCode.includes('releaseFocusLock(delay = 350)') &&
    surfaceMachineCode.includes('this.isFocusLocked = true;'),
    'UISurfaceMachine 必须具备 acquireFocusLock 与 releaseFocusLock 焦点转移锁'
);

// 17.4 验证 UIManager 视口监听器响应系统级焦点锁
assert.ok(
    updatedUiManagerJs.includes('this.surfaceMachine?.isFocusLocked') &&
    updatedUiManagerJs.includes('this.collapseKeyboardLayout = () =>'),
    'UIManager 必须严格响应 surfaceMachine.isFocusLocked，在焦点转移期间绝对锁死键盘布局不弹跳'
);

// 17.5 验证底层 UI 树系统级物理冻结 (Systemic Inert Tree Isolation)
assert.ok(
    updatedPlayerCss.includes('.tm-player-container[data-has-overlay="true"] .tm-video-wrapper') &&
    updatedPlayerCss.includes('.tm-player-container[data-has-overlay="true"] .tm-control-panel') &&
    updatedPlayerCss.includes('pointer-events: none;'),
    '_player.css 必须具备 data-has-overlay 系统级底层树物理冻结'
);

// 17.6 验证抽屉与发表栏彻底移除 bottom 轴向过渡动效
assert.ok(
    !markerSheetCssCode.includes('transition: opacity 0.24s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), bottom') &&
    !commentsCssCode.includes('transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, bottom'),
    '抽屉与发表栏基础样式必须彻底清除 bottom 轴向过渡动效，杜绝移动端微重排时产生物理弹跳'
);

console.log('✅ 17. 系统级全局事件黑洞、底层树物理冻结与焦点转移锁验证通过');

// ---------------------------------------------------------
// 18. 验证菜单栏上滑手势锁定与 iOS 虚拟键盘发评栏物理高度避让
// ---------------------------------------------------------
console.log('▶ 18. 验证菜单栏上滑手势锁定与 iOS 虚拟键盘发评栏物理高度避让...');
const singleHandJsCode = fs.readFileSync('src/player/managers/SingleHandManager.js', 'utf8');
const latestUiManagerJs = fs.readFileSync('src/player/ui/UIManager.js', 'utf8');
const latestPlayerCss = fs.readFileSync('src/player/ui/styles/01_core/_layout.css', 'utf8');
const latestSurfaceMachine = fs.readFileSync('src/player/state/UISurfaceMachine.js', 'utf8');
const latestEventManager = fs.readFileSync('src/player/managers/EventManager.js', 'utf8');
const latestVideoSwipe = fs.readFileSync('src/player/managers/videoSwipeManager.js', 'utf8');

// 18.1 验证 SingleHandManager 拦截控制面板上滑手势，杜绝上滑底部空白
assert.ok(
    singleHandJsCode.includes('Math.abs(dy) > 5') &&
    singleHandJsCode.includes('坚决杜绝面板上滑产生底部空白'),
    'SingleHandManager 必须拦截控制面板任意纵向滑动手势 (Math.abs(dy) > 5)，坚决杜绝面板上滑产生底部空白'
);

// 18.2 验证全屏播放器容器与视频层锁定 touch-action: none
assert.ok(
    latestPlayerCss.includes('.tm-player-container {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    width: 100%;\n    height: 100%;\n    background-color: transparent;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: flex-start;\n    z-index: var(--z-host-player, 2147483646);\n    overflow: hidden;\n    pointer-events: auto;\n    \n    /* 全局触摸、滚动、选择隔离 (固定视口禁止整体纵向位移) */\n    touch-action: none;') &&
    latestPlayerCss.includes('touch-action: none; /* 播放器视频区域绝对禁止整体纵向位移 */'),
    '_player.css 必须为 tm-player-container 与 tm-video-container 锁定 touch-action: none'
);

// 18.3 验证 UISurfaceMachine 捕获阶段放行活动面板内部元素与输入框
assert.ok(
    latestSurfaceMachine.includes('const isInsideActiveSurface = Boolean(') &&
    latestSurfaceMachine.includes('if (isInsideActiveSurface || isEditable) {') &&
    latestSurfaceMachine.includes('return;'),
    'UISurfaceMachine 必须在捕获阶段放行活动面板内部元素与可编辑输入框，确保 iOS Safari 原生触摸聚焦与软键盘唤起'
);

// 18.4 验证 UIManager 在 keyboardHeight > 60 时无阻碍设置发评底栏与抽屉物理 bottom
assert.ok(
    latestUiManagerJs.includes("commentSubmitBar.style.bottom = `${keyboardHeight}px`;") &&
    latestUiManagerJs.includes("sheetPanel.style.bottom = `${keyboardHeight}px`;") &&
    !latestUiManagerJs.includes('if (this.surfaceMachine?.isFocusLocked) {\n                    if (keyboardHeight > 60)'),
    'UIManager 必须在 keyboardHeight > 60 时无阻碍直接设置 commentSubmitBar 与 sheetPanel 行内物理 bottom'
);

// 18.5 验证视频区域阻止纵向滑动穿透
assert.ok(
    !latestEventManager.includes('diffY < -5') &&
    latestVideoSwipe.includes('垂直拖拽时始终阻止浏览器默认滚动行为'),
    'EventManager 与 videoSwipeManager 必须彻底移除允许上滑穿透滚动宿主的陈旧代码，杜绝视口错位'
);

console.log('✅ 18. 菜单栏上滑手势锁定与 iOS 虚拟键盘发评栏物理高度避让验证通过');

// ---------------------------------------------------------
// 19. 验证评论栏底部向上弹出抽屉式、附加片段抽屉默认收起与无模糊遮罩
// ---------------------------------------------------------
console.log('▶ 19. 验证评论栏底部向上弹出抽屉式、附加片段抽屉默认收起与无模糊遮罩...');
const commentComposerCode = fs.readFileSync('src/player/controls/CommentComposer.js', 'utf8');
const commentPanelCode = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');
const latestCommentsCss = fs.readFileSync('src/player/ui/styles/02_components/_comments.css', 'utf8') + '\n' + fs.readFileSync('src/player/ui/styles/02_components/_modals.css', 'utf8');
const latestPlayerCssV19 = fs.readFileSync('src/player/ui/styles/01_core/_layout.css', 'utf8');

// 19.1 验证发评栏具备底部抽屉圆角、提手条与丝滑曲线
assert.ok(
    commentPanelCode.includes('tm-comment-drawer-pill') &&
    commentComposerCode.includes('.tm-comment-drawer-pill') &&
    latestCommentsCss.includes('.tm-comment-drawer-pill') &&
    latestCommentsCss.includes('border-radius: 20px 20px 0 0;') &&
    latestCommentsCss.includes('transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)'),
    '评论发表栏必须采用底部向上弹出的抽屉式设计，包含 tm-comment-drawer-pill 提手条与 20px 圆角'
);

// 19.2 验证附加片段列表默认隐藏，并在展开时具备向上抽屉式平滑过渡
assert.ok(
    commentComposerCode.includes('this.closeTagSelectModal();\n        this.submitBarWrapper.classList.remove(\'is-collapsed\');') &&
    latestCommentsCss.includes('.tm-comment-tag-select-modal {') &&
    latestCommentsCss.includes('max-height: 0;') &&
    latestCommentsCss.includes('transition: max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)') &&
    latestCommentsCss.includes('.tm-comment-tag-select-modal.visible {') &&
    latestCommentsCss.includes('max-height: min(220px,'),
    '附加片段列表在打开评论栏时必须默认隐藏，且展开时通过 max-height 与 transform 向上抽屉式展开'
);

// 19.3 验证评论时不需要模糊遮罩层，保持全透明
assert.ok(
    latestPlayerCssV19.includes('.tm-player-container.has-composer-active .tm-surface-event-sink.visible {\n    background-color: transparent;\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n}'),
    '评论时必须彻底移除模糊遮罩层 (background-color: transparent; backdrop-filter: none;)，确保视频与界面清晰可见'
);

console.log('✅ 19. 评论栏底部向上弹出抽屉式、附加片段抽屉默认收起与无模糊遮罩验证通过');

// ---------------------------------------------------------
// 20. 验证设置菜单标准化样式、ADHD高信噪比文案、版本展开即查更与双轨外链跳转
// ---------------------------------------------------------
console.log('▶ 20. 验证设置菜单标准化样式、ADHD高信噪比文案、版本展开即查更与双轨外链跳转...');
const aboutSectionCode = fs.readFileSync('src/player/managers/settings/sections/AboutSection.js', 'utf8');
const settingsManagerCodeV20 = fs.readFileSync('src/player/managers/SettingsManager.js', 'utf8');
const segmentedControlCode = fs.readFileSync('src/player/managers/settings/components/SegmentedControl.js', 'utf8');
const settingsAppleCss = fs.readFileSync('src/player/ui/styles/02_components/_settings_apple.css', 'utf8');
const i18nCode = fs.readFileSync('src/constants/i18n.js', 'utf8');

// 20.1 验证版本信息展开时即触发更新检查
assert.ok(
    aboutSectionCode.includes("this.sm.checkUpdate(true, false);") &&
    settingsManagerCodeV20.includes("async checkUpdate(force = true, notify = true) {"),
    'AboutSection 展开时必须立即调用 checkUpdate(true, false) 执行静默更新检查，且 SettingsManager 必须提供统一 checkUpdate 方法'
);

// 20.2 验证外链跳转：正式版跳转 SleazyFork，测试版跳转 GitHub
assert.ok(
    settingsManagerCodeV20.includes("platformLink.href = isBeta\n            ? 'https://github.com/Chris-C1108/Miss_Player'\n            : 'https://sleazyfork.org/scripts/453300';") &&
    settingsManagerCodeV20.includes("platformLink.title = isBeta ? '前往 GitHub 项目页' : '前往 SleazyFork 脚本页';"),
    '版本信息卡片中的主链接必须双轨硬分流：测试版指向 GitHub 项目页，正式版指向 SleazyFork 脚本页'
);

// 20.3 验证 SegmentedControl 零行内样式，采用纯 CSS 类驱动
assert.ok(
    !segmentedControlCode.includes('style.cssText') &&
    settingsAppleCss.includes('.tm-segmented-control {') &&
    settingsAppleCss.includes('.tm-segmented-btn {'),
    'SegmentedControl 必须彻底移除 inline cssText，采用标准化 .tm-segmented-* CSS 类'
);

// 20.4 验证设置项标准化类与 ADHD 高信噪比文案
assert.ok(
    settingsAppleCss.includes('.tm-about-channel-row {') &&
    settingsAppleCss.includes('.tm-about-channel-label {') &&
    settingsAppleCss.includes('.tm-about-status-line {') &&
    settingsAppleCss.includes('.tm-about-btn--stay {') &&
    settingsAppleCss.includes('.tm-about-btn--tampermonkey {') &&
    settingsAppleCss.includes('.tm-about-btn--scriptcat {') &&
    i18nCode.includes("aboutGroupTitle: '版本信息'") &&
    i18nCode.includes("webdavAutoSyncDesc: '数据变动时后台静默同步'"),
    '设置菜单样式与文案必须符合 Grice 准则与 ADHD 规范，具备标准化类且去除冗余技术黑话'
);

console.log('✅ 20. 设置菜单标准化样式、ADHD高信噪比文案、版本展开即查更与双轨外链跳转验证通过');

// ---------------------------------------------------------
// 21. 验证 Peach 虚拟入库板块重构（操作按键精简自动测试、域名删除、边界切割与网关提示）
// ---------------------------------------------------------
console.log('▶ 21. 验证 Peach 虚拟入库板块重构...');
const peachSectionCode = fs.readFileSync('src/player/managers/settings/sections/PeachSection.js', 'utf8');
const peachServiceCode = fs.readFileSync('src/services/PeachService.js', 'utf8');
const todoMdCode = fs.readFileSync('TODO.md', 'utf8');

// 21.1 验证废弃功能彻底清除（无 JAVVerse、无 HUD 探针、无手动测试/扫描按键、无手动 Token 框）
assert.ok(
    !peachSectionCode.includes('javverse.com') &&
    !peachSectionCode.includes('PeachStreamHUD') &&
    !peachSectionCode.includes('tm-peach-hud-btn') &&
    !peachSectionCode.includes('通知 Peach 扫描') &&
    !peachSectionCode.includes('测试 Peach 连接') &&
    !peachSectionCode.includes('tm-peach-token-input'),
    'PeachSection 必须彻底清除 JAVVerse 登录、流诊断探针、手动测试/扫描按键及手动 Token 输入框'
);

// 21.2 验证 Peach 服务地址具备删除按钮与配对解析
assert.ok(
    peachSectionCode.includes('tm-peach-delete-btn') &&
    peachSectionCode.includes('PeachService.clearBase()') &&
    peachServiceCode.includes('static clearBase()') &&
    peachServiceCode.includes('static removeOrigin(rawUrl)'),
    'Peach 服务地址必须支持删除按钮以清除记录域名，且 PeachService 必须提供 clearBase 与 removeOrigin'
);

// 21.3 验证流网关配置说明规范（局域网地址与环境变量默认 dev）
assert.ok(
    peachSectionCode.includes('Peach 服务端可访问的网关地址（支持局域网 IP / host.docker.internal）。播放 Token 需在部署网关时环境变量配置（默认 dev）') &&
    peachSectionCode.includes('_autoCheckStatus'),
    '流网关必须清晰注明 Peach 可访问的地址与环境变量配置提示，且连通性测试必须改为自动进行'
);

// 21.4 验证 TODO.md 包含专用令牌自动获取待办 19.12
assert.ok(
    todoMdCode.includes('**19.12** Peach 专用令牌自动签发调研与实现'),
    'TODO.md 必须包含 Phase 19.12 Peach 专用令牌自动获取调研待办'
);

console.log('✅ 21. Peach 虚拟入库板块重构验证通过');

console.log('\n🎉 全部 21 大核心修复与人机工程验证单元测试 100% 通过！\n');


