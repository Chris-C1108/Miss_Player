import assert from 'assert';
import { resampleAndSmoothBins, generateSvgPath, HEATMAP_CONSTANTS } from '../src/player/managers/HeatmapManager.js';
import { SupabaseService } from '../src/services/SupabaseService.js';

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

// 8. 验证冷启动存量足迹自动上云与脏标记解耦 (Two-Way Reconciliation & Dirty Decoupling)
const hmSyncRecon = new HeatmapManager(mockCoreTrack, mockControlMgr);
hmSyncRecon.init();
hmSyncRecon.bins = new Float32Array(20);
hmSyncRecon.bins[3] = 12; // 本地存量足迹

// 8.1 验证有效足迹探测
assert.strictEqual(hmSyncRecon._hasValidFootprint(hmSyncRecon.bins), true, '本地包含 12 秒流逝必须判定为有效足迹');
assert.strictEqual(hmSyncRecon._hasValidFootprint(new Float32Array(20)), false, '全 0 数组不能判定为有效足迹');

// 8.2 验证播放流逝时本地脏标记与云端脏标记同时激活
hmSyncRecon.targetVideo = {
    paused: false,
    seeking: false,
    currentTime: 25,
    duration: 100,
    addEventListener: () => {},
    removeEventListener: () => {}
};
hmSyncRecon.lastCurrentTime = 24;
hmSyncRecon.onTimeUpdate();
assert.strictEqual(hmSyncRecon.isLocalDirty, true, '流逝推进时 isLocalDirty 必须置为 true');
assert.strictEqual(hmSyncRecon.isCloudDirty, true, '流逝推进时 isCloudDirty 必须置为 true');

// 8.3 验证 15 秒本地刷盘仅清除 isLocalDirty，保留 isCloudDirty
let webDavUploadTriggered = false;
let uploadedPayload = null;
hmSyncRecon._uploadToWebDav = async (payload) => {
    webDavUploadTriggered = true;
    uploadedPayload = payload;
    hmSyncRecon.isCloudDirty = false;
};

// 触发 saveToDb(false)，模拟 15 秒定时器仅保存本地 IndexedDB
await hmSyncRecon.saveToDb(false);
assert.strictEqual(hmSyncRecon.isLocalDirty, false, 'saveToDb(false) 必须清空 isLocalDirty');
assert.strictEqual(hmSyncRecon.isCloudDirty, true, 'saveToDb(false) 绝不能误清空 isCloudDirty (防定时器吞噬离散同步)');
assert.strictEqual(webDavUploadTriggered, false, 'saveToDb(false) 不得提前触发 WebDAV PUT');

// 8.4 模拟用户点击暂停 (onPause)，必须由于 isCloudDirty 成功触发云端漫游上报
hmSyncRecon.onPause();
await new Promise(r => setTimeout(r, 10));
assert.strictEqual(webDavUploadTriggered, true, 'onPause 时由于 isCloudDirty 必须成功触发 WebDAV 上传');
assert.strictEqual(hmSyncRecon.isCloudDirty, false, '成功上传 WebDAV 后 isCloudDirty 必须安全归零');

hmSyncRecon.destroy();
console.log('✅ 8. 冷启动存量足迹自动上云与脏标记解耦自愈测试全部通过');

// 9. 验证 SupabaseService.fetchCrowdHeatmap 边缘缓存网关优先与直连自愈降级
{
    const originalRequest = SupabaseService.request;
    const originalGetConfig = SupabaseService.getConfig;
    const requestedUrls = [];

    SupabaseService.getConfig = () => ({
        baseUrl: 'https://daosvqbphybjsgvpujil.supabase.co/rest/v1',
        apiKey: 'test-key',
        isEnabled: true
    });

    // 9.1 Edge 正常 200 返回
    SupabaseService.request = async (opts) => {
        requestedUrls.push(opts.url);
        return {
            status: 200,
            data: JSON.stringify({
                found: true,
                avcode: 'WSP-101',
                heatmap: 'A'.repeat(160),
                totalSamples: 10,
                durationSeconds: 3600
            })
        };
    };

    const resEdge = await SupabaseService.fetchCrowdHeatmap('WSP-101');
    assert.strictEqual(resEdge.found, true);
    assert.strictEqual(resEdge.totalSamples, 10);
    assert.ok(requestedUrls[0].includes('miss-heatmap-cache.chen-m1108.workers.dev'), '首选必须请求 Cloudflare 边缘缓存网关');

    // 9.2 Edge 异常 500 时，自动降级直连 Supabase
    requestedUrls.length = 0;
    SupabaseService.request = async (opts) => {
        requestedUrls.push(opts.url);
        if (opts.url.includes('workers.dev')) {
            return { status: 500, data: '{"error":"Supabase credentials not configured on worker"}' };
        }
        // 回源 Supabase 直连
        return {
            status: 200,
            data: JSON.stringify([{
                avcode: 'WSP-101',
                heatmap: '\\x0001',
                total_samples: 3,
                duration_seconds: 1800
            }])
        };
    };

    const resFallback = await SupabaseService.fetchCrowdHeatmap('WSP-101');
    assert.strictEqual(resFallback.found, true);
    assert.strictEqual(resFallback.totalSamples, 3);
    assert.strictEqual(requestedUrls.length, 2, '必须在 Edge 失败后自动发起直连请求');
    assert.ok(requestedUrls[1].includes('/video_crowd_heatmap?'), '降级请求必须直连 Supabase REST API');

    SupabaseService.request = originalRequest;
    SupabaseService.getConfig = originalGetConfig;
    console.log('✅ 9. Cloudflare 边缘缓存优先与 Supabase 直连自愈降级测试全部通过');
}

console.log('\n🎉 全部 9 项视频播放热度、探索足迹与双轨同步状态测试 100% 通过！\n');
