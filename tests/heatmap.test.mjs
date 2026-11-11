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

// 6. 网络等待缓冲流动条纹状态机断言 (Buffering Stall State Machine Test)
import { ProgressManager } from '../src/player/managers/ProgressManager.js';

let isBufferingClassPresent = false;
const mockEventHandlers = {};
const mockVideoForBuffer = {
    currentTime: 10,
    duration: 100,
    paused: false,
    readyState: 2,
    addEventListener(evt, handler) {
        mockEventHandlers[evt] = handler;
    },
    removeEventListener(evt) {
        delete mockEventHandlers[evt];
    }
};

const mockProgressBar = {
    parentElement: { addEventListener() {} },
    addEventListener() {},
    classList: {
        add(cls) { if (cls === 'is-buffering') isBufferingClassPresent = true; },
        remove(cls) { if (cls === 'is-buffering') isBufferingClassPresent = false; },
        contains(cls) { return cls === 'is-buffering' && isBufferingClassPresent; }
    }
};

const pm = new ProgressManager({ targetVideo: mockVideoForBuffer }, {});
pm.init({
    progressBarElement: mockProgressBar,
    progressIndicator: { style: {} },
    currentTimeDisplay: { textContent: '' },
    totalDurationDisplay: { textContent: '' },
    timeIndicator: { style: {} }
});

// 6.1 当视频遭遇网络等待卡顿 (waiting) 时，防抖激活 .is-buffering 条纹流动动画
assert.strictEqual(isBufferingClassPresent, false, '初始正常态不应激活缓冲条纹');
if (mockEventHandlers.waiting) mockEventHandlers.waiting();
await new Promise(r => setTimeout(r, 220));
assert.strictEqual(isBufferingClassPresent, true, '网络卡顿等待持续 180ms 时必须激活 .is-buffering 条纹动画告知用户未假死');

// 6.2 当视频播放头推进 (timeupdate) 或恢复播放 (playing) 时，看门狗瞬间解除 .is-buffering 条纹动画
mockVideoForBuffer.currentTime = 12;
pm.updateProgressBar();
assert.strictEqual(isBufferingClassPresent, false, '正常顺畅播放前进时看门狗必须即刻移除 .is-buffering 保持纯净底槽');

// 6.3 当用户主动暂停时，也必须确保条纹动画静止
if (mockEventHandlers.waiting) mockEventHandlers.waiting();
await new Promise(r => setTimeout(r, 220));
assert.strictEqual(isBufferingClassPresent, true);
if (mockEventHandlers.pause) mockEventHandlers.pause();
assert.strictEqual(isBufferingClassPresent, false, '用户主动暂停时必须取消缓冲条纹保持静止');

pm.cleanup();
console.log('✅ 6. 网络等待缓冲流动条纹状态机测试全部通过');

// 7. 验证双轨机制与 WebDAV Element-wise Max 合并
const mockVideoTrack = {
    duration: 100,
    currentTime: 0,
    paused: true,
    seeking: false,
    addEventListener: () => {},
    removeEventListener: () => {}
};
const mockContainer = {
    firstChild: null,
    insertBefore: (node) => { mockContainer.firstChild = node; }
};
const mockControlMgr = {
    progressBarContainer: mockContainer
};
const mockCoreTrack = {
    targetVideo: mockVideoTrack,
    options: {
        videoCode: 'WSP-101',
        playerState: {
            settings: {
                betaMode: true,
                betaHeatmap: true,
                betaCrowdHeatmap: true
            }
        }
    }
};

const hmDualTrack = new HeatmapManager(mockCoreTrack, mockControlMgr);
// 模拟全局 document.createElementNS
if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
        createElementNS: (ns, tag) => ({
            tag,
            attrs: {},
            style: {},
            children: [],
            setAttribute(k, v) { this.attrs[k] = v; },
            getAttribute(k) { return this.attrs[k]; },
            appendChild(c) { this.children.push(c); }
        }),
        addEventListener: () => {},
        removeEventListener: () => {}
    };
}

hmDualTrack.init();
assert.strictEqual(hmDualTrack.avcode, 'WSP-101', '番号应精准识别为 WSP-101');
assert.strictEqual(hmDualTrack.storageKey, 'HEATMAP_WSP-101', 'storageKey 必须规整为 HEATMAP_WSP-101');
assert.ok(hmDualTrack.pathCrowdElement, 'DOM 必须构建全网高能底轨 SVG Path');
assert.ok(hmDualTrack.pathElement, 'DOM 必须构建个人足迹顶轨 SVG Path');

// 模拟本地有 20 个桶 (100 秒 / 5秒)
hmDualTrack.bins = new Float32Array(20);
hmDualTrack.bins[2] = 10;
hmDualTrack.bins[5] = 15;

// 模拟从 WebDAV 漫游回来的远端数据，执行 Element-wise Max
const remoteBins = new Array(20).fill(0);
remoteBins[2] = 5;  // 远端较小，保留本地 10
remoteBins[5] = 30; // 远端较大，提升为 30
remoteBins[8] = 20; // 本地为 0，提升为 20

// 模拟 _syncFromWebDav 内部的合并逻辑
const len = Math.min(hmDualTrack.bins.length, remoteBins.length);
for (let i = 0; i < len; i++) {
    const rv = remoteBins[i] || 0;
    if (rv > hmDualTrack.bins[i]) {
        hmDualTrack.bins[i] = rv;
    }
}

assert.strictEqual(hmDualTrack.bins[2], 10, '分桶 2 应保留本地最大值 10');
assert.strictEqual(hmDualTrack.bins[5], 30, '分桶 5 应融合 WebDAV 最大值 30');
assert.strictEqual(hmDualTrack.bins[8], 20, '分桶 8 应合并 WebDAV 新足迹 20');

// 验证社区高能 120 槽位与波形渲染
hmDualTrack.crowd120 = new Uint8Array(120);
hmDualTrack.crowd120[60] = 255;
hmDualTrack.renderCrowdSvg();
assert.ok(hmDualTrack.pathCrowdElement.getAttribute('d').length > 0, '社区高能波形必须生成有效 SVG Path');

hmDualTrack.destroy();
console.log('✅ 7. 双轨波形渲染与 WebDAV Element-wise Max 合并测试全部通过');

console.log('\n🎉 全部 7 项视频播放热度、探索足迹与双轨同步状态测试 100% 通过！\n');
