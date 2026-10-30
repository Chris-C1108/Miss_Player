import assert from 'assert';
import fs from 'fs';

console.log('🧪 开始执行控制面板胶囊区域左右滑动手势守卫测试...');

const playerCss = fs.readFileSync('src/player/ui/styles/_player.css', 'utf8');
const markerSheetCss = fs.readFileSync('src/player/ui/styles/02_components/_marker_sheet.css', 'utf8');

// 1. 验证 _player.css 中 .tm-tab-scroll-container 的 pointer-events 必须为 auto，严禁为 none
const playerScrollMatch = playerCss.match(/\.tm-tab-scroll-container\s*\{([^}]+)\}/);
assert.ok(playerScrollMatch, '_player.css 必须包含 .tm-tab-scroll-container 定义');
const playerRules = playerScrollMatch[1];
assert.ok(!playerRules.includes('pointer-events: none'), '_player.css 严禁包含 pointer-events: none，否则直接杀死滑动手势！');
assert.ok(playerRules.includes('pointer-events: auto'), '_player.css 必须明确声明 pointer-events: auto');
assert.ok(playerRules.includes('touch-action: pan-x'), '_player.css 必须声明 touch-action: pan-x');
console.log('✅ 1. _player.css 胶囊滚动容器 pointer-events: auto 与 touch-action: pan-x 校验通过');

// 2. 验证 _marker_sheet.css 中 .tm-tab-scroll-container 的 pointer-events 必须为 auto
const sheetScrollMatch = markerSheetCss.match(/\.tm-tab-scroll-container\s*\{([^}]+)\}/);
assert.ok(sheetScrollMatch, '_marker_sheet.css 必须包含 .tm-tab-scroll-container 定义');
const sheetRules = sheetScrollMatch[1];
assert.ok(!sheetRules.includes('pointer-events: none'), '_marker_sheet.css 严禁包含 pointer-events: none');
assert.ok(sheetRules.includes('pointer-events: auto'), '_marker_sheet.css 必须明确声明 pointer-events: auto');
assert.ok(sheetRules.includes('touch-action: pan-x'), '_marker_sheet.css 必须声明 touch-action: pan-x');
console.log('✅ 2. _marker_sheet.css 胶囊滚动容器 pointer-events: auto 校验通过');

// 3. 验证 SingleHandManager.js 中胶囊区手势识别选择器完备性
const singleHandJs = fs.readFileSync('src/player/managers/SingleHandManager.js', 'utf8');
assert.ok(singleHandJs.includes("target?.closest?.('.tm-tab-scroll-container, .tm-tab-pill, .tm-tab-actions-capsule, .tm-loop-control-row')"), '必须包含全量胶囊区与按钮的选择器识别');
console.log('✅ 3. SingleHandManager 胶囊区触摸放行守卫校验通过');

console.log('\n🎉 全部 3 项胶囊滑动手势守卫测试 100% 通过！\n');
