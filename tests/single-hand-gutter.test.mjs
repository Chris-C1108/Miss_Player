import assert from 'assert';
import fs from 'fs';

console.log('🧪 开始执行单手模式立柱加宽与 2 行稳定排版单元测试...');

const controlsCss = fs.readFileSync('src/player/ui/styles/_controls.css', 'utf8');
const playerCss = fs.readFileSync('src/player/ui/styles/_player.css', 'utf8');

// 1. 验证立柱外壳宽度为 48px
const gutterMatch = controlsCss.match(/\.tm-single-hand-gutter\s*\{([^}]+)\}/);
assert.ok(gutterMatch, '_controls.css 必须包含 .tm-single-hand-gutter 定义');
assert.ok(gutterMatch[1].includes('width: 48px'), '立柱外壳宽度必须加宽至 48px');
console.log('✅ 1. 立柱外壳宽度加宽至 48px 校验通过');

// 2. 验证单手模式下立柱与主控制区间距加大至 12px
assert.ok(playerCss.includes('gap: 12px'), '单手模式下控制面板与立柱间距必须加大至 12px');
console.log('✅ 2. 立柱与控制面板间距加大至 12px 校验通过');

// 3. 验证右手模式与左手模式下立柱宽度严格设为 48px
const rightGutterMatch = playerCss.match(/\.tm-player-container\.tm-single-hand-right\s+\.tm-control-panel\s+\.tm-single-hand-gutter\s*\{([^}]+)\}/);
assert.ok(rightGutterMatch, '必须包含右手模式立柱规则');
assert.ok(rightGutterMatch[1].includes('width: 48px') && rightGutterMatch[1].includes('flex: 0 0 48px'), '右手模式立柱必须为 48px');

const leftGutterMatch = playerCss.match(/\.tm-player-container\.tm-single-hand-left\s+\.tm-control-panel\s+\.tm-single-hand-gutter\s*\{([^}]+)\}/);
assert.ok(leftGutterMatch, '必须包含左手模式立柱规则');
assert.ok(leftGutterMatch[1].includes('width: 48px') && leftGutterMatch[1].includes('flex: 0 0 48px'), '左手模式立柱必须为 48px');
console.log('✅ 3. 左右手镜像模式立柱宽度统一锁定为 48px 校验通过');

// 4. 验证单手模式下跳转按钮容器保持 2 行排列规则
assert.ok(playerCss.includes('.tm-player-container.tm-single-hand-active .tm-rewind-buttons-container'), '必须包含单手模式下快退按钮专用容器规则');
assert.ok(playerCss.includes('gap: 4px'), '单手模式下按钮容器内间距必须优化为 4px 确保 2 行稳定排布');
console.log('✅ 4. 跳转按钮 2 行稳定排布规则校验通过');

console.log('\n🎉 全部 4 项单手模式立柱加宽与排版防挤压测试 100% 通过！\n');
