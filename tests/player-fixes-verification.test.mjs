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

console.log('\n🎉 全部 5 大核心修复与人机工程验证单元测试 100% 通过！\n');
