import assert from 'assert';
import { resampleAndSmoothBins, generateSvgPath, HEATMAP_CONSTANTS } from '../src/player/managers/HeatmapManager.js';

console.log('🧪 开始执行视频播放热度与探索足迹单元测试...');

// 1. 空输入与全未探索断言
const emptyResult = resampleAndSmoothBins([], 100);
assert.strictEqual(emptyResult.length, 100, '应返回指定长度的目标数组');
assert.ok(emptyResult.every(v => v === 0), '全未探索时所有采样点高度必须全为 0');
console.log('✅ 1. 空输入与全 0 未探索安全回退测试通过');

// 2. 短片段高光（10 秒）在长片中不被稀释抹平测试
// 假设视频时长 2 小时 (7200 秒)，即 1440 个桶
// 在第 200 个桶（1000秒左右），用户反复观看了 2 次（每个桶 5 秒，共 2 个桶 = 10 秒精彩瞬间，每个桶累积 25 秒）
const longVideoBins = new Float32Array(1440);
// 普通片段只看了 1 次（5 秒）
longVideoBins[50] = 5;
longVideoBins[51] = 5;
// 10 秒短片段被反复看了 5 遍（25 秒）
longVideoBins[200] = 25;
longVideoBins[201] = 25;

const sampled = resampleAndSmoothBins(longVideoBins, 120);

// 找到峰值位置
let maxVal = 0;
let maxIdx = -1;
for (let i = 0; i < sampled.length; i++) {
    if (sampled[i] > maxVal) {
        maxVal = sampled[i];
        maxIdx = i;
    }
}

// 峰值应该非常显著（接近 1.0）
assert.ok(maxVal >= 0.95, `10秒短片段反复观看应形成绝对波峰 (当前: ${maxVal})`);

// 对应桶 200 映射到 120 点的位置应当在 Math.floor(200 / (1440/120)) = 16 附近
assert.ok(Math.abs(maxIdx - 16) <= 2, `波峰索引位置应当准确对应时间戳 (期望 16 附近，实际 ${maxIdx})`);

// 普通看过 1 次的片段（索引 50 对应 4 附近），高度应在基线 0.15~0.35 之间
const normalIdx = Math.floor(50 / (1440 / 120));
const normalVal = sampled[normalIdx];
assert.ok(normalVal > 0.14 && normalVal < 0.45, `普通单次观看片段应保持平缓基线 (当前: ${normalVal})`);

// 未探索区域（如桶 500 对应 41）应保持贴底 0
const unvisitedIdx = Math.floor(500 / (1440 / 120));
assert.strictEqual(sampled[unvisitedIdx], 0, '未探索区域高度必须严格为 0');
console.log('✅ 2. 10 秒短片段峰值保留与未探索贴底断言测试通过');

// 3. SVG 二次贝塞尔曲线路径生成测试
const pathD = generateSvgPath(sampled);
assert.ok(pathD.startsWith('M 0 100'), 'SVG Path 必须从左下角 (0, 100) 起始闭合');
assert.ok(pathD.endsWith('L 100 100 Z'), 'SVG Path 必须以 L 100 100 Z 闭合');
assert.ok(pathD.includes('Q '), '平滑曲线必须包含二次贝塞尔控制点指令 Q');
console.log('✅ 3. SVG 平滑贝塞尔曲线格式与闭合断言测试通过');

console.log('\n🎉 全部 3 项视频播放热度与探索足迹测试 100% 通过！\n');
