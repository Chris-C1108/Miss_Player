import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🧪 开始执行控制面板隐藏与呼出动效纯垂直轴与无斜飞断言测试...');

const playerCss = fs.readFileSync('src/player/ui/styles/_player.css', 'utf8');
const landscapeCss = fs.readFileSync('src/player/ui/styles/_landscape_pc.css', 'utf8');

// 1. 验证居中控制栏隐藏时，X 轴必须锁定为 -50%，严禁出现导致斜飞的错误位移
const centerHiddenMatch = playerCss.match(/body\.controls-hidden[^}]+?\.tm-control-buttons:not\(\[class\*="tm-controls-docked-"\]\)[^}]+?\{([^}]+)\}/s);
assert.ok(centerHiddenMatch, '必须包含居中控制栏隐藏状态专用规则');
const centerHiddenRules = centerHiddenMatch[1];
assert.ok(centerHiddenRules.includes('translate3d(-50%'), '居中隐藏态 X 轴必须严格保持 -50% 居中，绝不可省略为 0 导致向右斜飞');
assert.ok(centerHiddenRules.includes('20px') || centerHiddenRules.includes('24px'), '居中隐藏态 Y 轴必须为轻量垂直微沉降 (20px~24px)');
assert.ok(centerHiddenRules.includes('scale(0.96)'), '居中隐藏态必须具备 Apple 风格微缩放');
console.log('✅ 1. 居中悬浮卡片隐藏状态纯垂直锁定与微缩放断言通过');

// 2. 验证移动端竖屏下，内层 .tm-control-buttons 的 transform 必须被重置为 none，动效全权委托外层
const portraitButtonsMatch = playerCss.match(/\.tm-control-panel \.tm-control-buttons,[^}]+?\.controls-hidden \.tm-control-panel \.tm-control-buttons[^}]+?\{([^}]+)\}/s);
assert.ok(portraitButtonsMatch, '移动端竖屏必须包含内层 buttons 锁定规则');
const portraitButtonsRules = portraitButtonsMatch[1];
assert.ok(portraitButtonsRules.includes('transform: none'), '移动端竖屏下内层 buttons 必须保持 transform: none，杜绝内部斜飞');
console.log('✅ 2. 移动端竖屏底板内部元素 transform: none 锁定断言通过');

// 3. 验证外层 .tm-control-panel 隐藏时，纯垂直向下直降
const panelHiddenMatch = playerCss.match(/body\.controls-hidden \.tm-control-panel,[^}]+?\{([^}]+)\}/s);
assert.ok(panelHiddenMatch, '必须包含移动端竖屏底板隐藏规则');
const panelHiddenRules = panelHiddenMatch[1];
assert.ok(panelHiddenRules.includes('translate3d(0,'), '移动端竖屏底板隐藏时 X 轴位移必须严格为 0，纯垂直下沉');
console.log('✅ 3. 移动端竖屏底板纯垂直 Y 轴直上直下动效断言通过');

// 4. 验证 Apple 物理阻尼曲线应用
assert.ok(playerCss.includes('cubic-bezier(0.16, 1, 0.3, 1)'), '必须使用 Apple 标志性物理阻尼动效曲线');
console.log('✅ 4. Apple 物理阻尼曲线 cubic-bezier(0.16, 1, 0.3, 1) 校验通过');

console.log('\n🎉 全部 4 项控制面板显隐动效架构测试 100% 通过！\n');
