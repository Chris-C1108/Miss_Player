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

// 4. 片头自然偏置衰减测试 (Intro Bias Soft Attenuation)
// 模拟场景：用户多次点开视频试看片头（第 0 桶累积 15 秒），但中段第 100 桶是真正反复看的高潮（18 秒）
const introBiasBins = new Float32Array(500);
introBiasBins[0] = 15; // 片头 0 秒开播累计
introBiasBins[100] = 18; // 中段真实高潮

const introSampled = resampleAndSmoothBins(introBiasBins, 120);
const introHeadVal = introSampled[0];
const middlePeakVal = introSampled[Math.floor(100 / (500 / 120))];

// 中段真实高潮必须高于片头试看
assert.ok(middlePeakVal > introHeadVal * 1.5, `片头开播偏置应被平滑衰减，中段高光 (${middlePeakVal}) 必须明显高于片头 (${introHeadVal})`);
console.log('✅ 4. 片头自然偏置平滑衰减断言测试通过');

// 5. 展示开关关闭时后台静默记录断言 (Silent Tracking when Display Disabled)
import { HeatmapManager } from '../src/player/managers/HeatmapManager.js';
const mockVideo = {
    currentTime: 10,
    duration: 600,
    paused: false,
    seeking: false,
    addEventListener() {},
    removeEventListener() {}
};
const mockCore = { targetVideo: mockVideo, options: { playerState: { settings: { betaMode: false, betaHeatmap: false } } } };
const mockControl = { progressBarContainer: { insertBefore() {}, firstChild: null } };

const hm = new HeatmapManager(mockCore, mockControl);
hm.init();
hm.bins = new Float32Array(120);
assert.strictEqual(hm.isEnabled, false, '未开启设置时展示状态应为 false');

// 模拟第一次 timeupdate 建立基线
mockVideo.currentTime = 10;
hm.onTimeUpdate();
// 模拟顺播流逝 1.0 秒
mockVideo.currentTime = 11;
hm.onTimeUpdate();

assert.ok(hm.isDirty, '即使展示开关关闭，也必须标记 isDirty 为 true 进行静默记录');
assert.ok(hm.bins[2] > 0.9, `桶 2 应静默记录 1 秒播放时间 (实际: ${hm.bins[2]})`);
hm.destroy();
console.log('✅ 5. 展示开关关闭时后台静默记录断言测试通过');

console.log('\n🎉 全部 5 项视频播放热度与探索足迹测试 100% 通过！\n');
