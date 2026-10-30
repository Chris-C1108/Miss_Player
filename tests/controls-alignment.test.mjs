import assert from 'assert';
import fs from 'fs';

console.log('🧪 开始执行控制面板各行左右垂直基准对齐测试...');

const playerCss = fs.readFileSync('src/player/ui/styles/_player.css', 'utf8');
const controlsCss = fs.readFileSync('src/player/ui/styles/_controls.css', 'utf8');
const markerSheetCss = fs.readFileSync('src/player/ui/styles/02_components/_marker_sheet.css', 'utf8');

// 1. 验证 .tm-playback-control-row 左右 padding 为 0
const playbackRowMatch = playerCss.match(/\.tm-playback-control-row\s*\{([^}]+)\}/);
assert.ok(playbackRowMatch, '必须包含 .tm-playback-control-row 样式定义');
assert.ok(playbackRowMatch[1].includes('padding: 4px 0') || playbackRowMatch[1].includes('padding: 0'), '主控行左右 padding 必须为 0 以确保对齐基准线');
console.log('✅ 1. 主控行 .tm-playback-control-row 左右零边距对齐校验通过');

// 2. 验证 .tm-playback-top-layer 左右 padding 为 0
const topLayerMatch = playerCss.match(/\.tm-playback-top-layer\s*\{([^}]+)\}/);
assert.ok(topLayerMatch, '必须包含 .tm-playback-top-layer 样式定义');
assert.ok(topLayerMatch[1].includes('padding: 0'), '上层左右控制浮层左右 padding 必须为 0');
console.log('✅ 2. 左右浮层 .tm-playback-top-layer 左右零边距对齐校验通过');

// 3. 验证 .tm-volume-control 左右 padding 为 0，且无多余 margin
const volControlMatch = controlsCss.match(/\.tm-volume-control\s*\{([^}]+)\}/);
assert.ok(volControlMatch, '必须包含 .tm-volume-control 样式定义');
assert.ok(volControlMatch[1].includes('padding: 0'), '音量外层容器 padding 必须为 0');

const volNoSliderMatch = controlsCss.match(/\.tm-volume-control-no-slider \.tm-volume-button\s*\{([^}]+)\}/);
assert.ok(volNoSliderMatch, '必须包含 .tm-volume-control-no-slider .tm-volume-button 样式定义');
assert.ok(volNoSliderMatch[1].includes('margin: 0'), '无滑块模式下音量按钮 margin 必须为 0，防止左侧缩进错位');
console.log('✅ 3. 音量按钮 .tm-volume-button 零外边距严格对齐基准线校验通过');

// 4. 验证 .tm-tab-scroll-container 左右 padding 为 0
const scrollContainerMatch = playerCss.match(/\.tm-tab-scroll-container\s*\{([^}]+)\}/);
assert.ok(scrollContainerMatch, '必须包含 .tm-tab-scroll-container 样式定义');
assert.ok(scrollContainerMatch[1].includes('padding: 5px 0') || scrollContainerMatch[1].includes('padding: 0'), '胶囊滚动容器左右 padding 必须为 0，使首个胶囊左边缘完全对齐基准线');

const markerSheetScrollMatch = markerSheetCss.match(/\.tm-tab-scroll-container\s*\{([^}]+)\}/);
assert.ok(markerSheetScrollMatch, '_marker_sheet.css 必须包含 .tm-tab-scroll-container 样式定义');
assert.ok(markerSheetScrollMatch[1].includes('padding: 5px 0') || markerSheetScrollMatch[1].includes('padding: 0'), '_marker_sheet.css 胶囊滚动容器左右 padding 必须为 0');
console.log('✅ 4. 胶囊滚动槽 .tm-tab-scroll-container 首尾零内边距对齐校验通过');

console.log('\n🎉 全部 4 项控制面板 4 大行左右对齐测试 100% 通过！\n');
