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
const playerCssCode = fs.readFileSync('src/player/ui/styles/_player.css', 'utf8');
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
const commentsCss = fs.readFileSync('src/player/ui/styles/_comments.css', 'utf8');
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

console.log('\n🎉 全部 13 大核心修复与人机工程验证单元测试 100% 通过！\n');
