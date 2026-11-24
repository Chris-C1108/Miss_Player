import assert from 'node:assert';
import fs from 'node:fs';

class MockHTMLVideoElement {}
globalThis.HTMLVideoElement = MockHTMLVideoElement;
globalThis.document = {
    addEventListener() {},
    removeEventListener() {}
};

const { PlayerCore } = await import('../src/player/core/PlayerCore.js');

console.log('🧪 开始执行「开播定位首个高光」防回跳与状态仲裁单元测试...');

function createMockVideo({ readyState = 1, duration = 3600, currentTime = 0, paused = true } = {}) {
    const listeners = new Map();
    const video = Object.assign(new MockHTMLVideoElement(), {
        readyState,
        duration,
        currentTime,
        paused,
        ended: false,
        seeking: false,
        muted: false,
        playbackRate: 1,
        controls: false,
        volume: 1,
        setAttribute() {},
        getAttribute() { return null; },
        addEventListener(type, fn) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(fn);
        },
        removeEventListener(type, fn) {
            listeners.get(type)?.delete(fn);
        },
        emit(type) {
            const set = listeners.get(type);
            if (!set) return;
            for (const fn of [...set]) {
                fn({ target: video, type });
            }
        },
        play() {
            video.paused = false;
            return Promise.resolve();
        },
        pause() {
            video.paused = true;
        },
        listenerCount(type) {
            return listeners.get(type)?.size || 0;
        }
    });
    return video;
}

// 1. 验证 PlayerCore.restoreVideoState 在 skipTimeRestore=true 时不覆盖当前位置
{
    const video = createMockVideo({ readyState: 0, duration: 3600, currentTime: 0 });
    const core = new PlayerCore({});
    core.targetVideo = video;
    core.videoState = { currentTime: 1.25, playbackRate: 1.0 };

    core.restoreVideoState({ skipTimeRestore: true });
    video.readyState = 1;
    video.currentTime = 420;
    video.emit('loadedmetadata');

    assert.strictEqual(
        video.currentTime,
        420,
        'skipTimeRestore=true 时，loadedmetadata 不应将 currentTime 覆盖回 videoState.currentTime'
    );
    console.log('✅ 1a. skipTimeRestore=true (readyState=0 -> loadedmetadata) 未覆盖高光进度');
}

{
    const video = createMockVideo({ readyState: 2, duration: 3600, currentTime: 420 });
    const core = new PlayerCore({});
    core.targetVideo = video;
    core.videoState = { currentTime: 12.5, playbackRate: 1.0 };

    core.restoreVideoState({ skipTimeRestore: true });
    assert.strictEqual(
        video.currentTime,
        420,
        'skipTimeRestore=true 时，readyState>=1 也不应覆盖高光进度'
    );
    console.log('✅ 1b. skipTimeRestore=true (readyState>=1) 未覆盖高光进度');
}

{
    const video = createMockVideo({ readyState: 2, duration: 3600, currentTime: 0 });
    const core = new PlayerCore({});
    core.targetVideo = video;
    core.videoState = { currentTime: 88, playbackRate: 1.0 };

    core.restoreVideoState();
    assert.strictEqual(
        video.currentTime,
        88,
        '默认未传 skipTimeRestore 时，仍应正常恢复 videoState.currentTime'
    );
    console.log('✅ 1c. 默认 restoreVideoState 正常恢复断点');
}

// 2. 验证 readyState=1 时定位到首个高光后，若 HLS/Safari 在起播阶段将进度重置回 0，守卫立即拉回高光并稳定后撤防
{
    const video = createMockVideo({ readyState: 1, duration: 3600, currentTime: 0, paused: true });
    const core = new PlayerCore({});
    core.targetVideo = video;

    let progressBarCalls = 0;
    const proximityTargets = [];
    const progressManager = {
        updateProgressBar() { progressBarCalls++; },
        updateCurrentTimeDisplay() {}
    };
    const loopManager = {
        syncProximityState({ targetTime }) { proximityTargets.push(targetTime); }
    };

    core.armInitialHighlightSeek(650, { progressManager, loopManager });

    // 初始化后立即定位至 650s，进度条同步刷新
    assert.strictEqual(video.currentTime, 650, 'readyState=1 时应立即定位至首个高光 650s');
    assert.ok(progressBarCalls >= 1, '应同步刷新进度条');

    // 模拟浏览器/HLS.js/Safari 在起播阶段 (loadeddata/canplay/playing) 将 currentTime 意外重置回 0
    video.paused = false;
    video.readyState = 2;
    video.currentTime = 0;
    video.emit('playing');

    assert.strictEqual(video.currentTime, 650, '起播时被重置回 0 后，守卫必须立即拉回 650s');
    assert.ok(proximityTargets.includes(650), '应同步胶囊邻近态到 650s');

    // 模拟到达目标位置并稳定播放
    video.seeking = false;
    video.currentTime = 650.2;
    video.emit('seeked');

    assert.strictEqual(core._initialSeekGuardCancel, null, '稳定后守卫应自动解除');
    assert.strictEqual(video.listenerCount('timeupdate'), 0, '撤防后必须清理 timeupdate 监听');
    console.log('✅ 2. readyState=1 定位后被起播重置回 0 的场景已成功拉回并自动撤防');
}

// 3. 验证 readyState=0 时延后到 loadedmetadata 才定位，且抗住后续 canplay 重置
{
    const video = createMockVideo({ readyState: 0, duration: NaN, currentTime: 0, paused: true });
    const core = new PlayerCore({});
    core.targetVideo = video;

    core.armInitialHighlightSeek(320, {});

    // readyState=0 时不得提前设置 currentTime
    assert.strictEqual(video.currentTime, 0, 'readyState=0 时暂不强制写入 currentTime');

    // 元数据到来
    video.readyState = 1;
    video.duration = 2400;
    video.emit('loadedmetadata');
    assert.strictEqual(video.currentTime, 320, 'loadedmetadata 后应立即定位至 320s');

    // canplay 时再次被宿主/流引擎重置回 0
    video.readyState = 3;
    video.paused = false;
    video.currentTime = 0;
    video.emit('canplay');
    assert.strictEqual(video.currentTime, 320, 'canplay 重置回 0 时守卫必须再次拉回 320s');

    // timeupdate 在目标附近正常推进后撤防
    video.currentTime = 320.4;
    video.emit('timeupdate');
    assert.strictEqual(core._initialSeekGuardCancel, null, '确认稳定播放后应撤防');
    console.log('✅ 3. readyState=0 延迟定位与 canplay 防重置验证通过');
}

// 4. 验证用户主动跳转时立即撤防，绝不把用户拉回首个高光
{
    const video = createMockVideo({ readyState: 1, duration: 3600, currentTime: 0, paused: true });
    const core = new PlayerCore({});
    core.targetVideo = video;

    core.armInitialHighlightSeek(900, {});
    assert.strictEqual(video.currentTime, 900);

    // 用户点击恢复断点或拖动进度条到 10s
    core.cancelInitialSeekGuard();
    video.readyState = 3;
    video.paused = false;
    video.currentTime = 10;
    video.emit('playing');
    video.emit('timeupdate');

    assert.strictEqual(video.currentTime, 10, '用户主动撤防并跳转后，绝不允许被拉回 900s');
    console.log('✅ 4. 用户主动跳转立即撤防验证通过');
}

// 5. 验证目标时间超过视频总时长时安全钳位
{
    const video = createMockVideo({ readyState: 1, duration: 100, currentTime: 0, paused: true });
    const core = new PlayerCore({});
    core.targetVideo = video;

    core.armInitialHighlightSeek(120, {});
    assert.strictEqual(video.currentTime, 99.5, '超过总时长的高光应钳位至 duration - 0.5');
    core.cancelInitialSeekGuard();
    console.log('✅ 5. 超出总时长高光钳位验证通过');
}

// 6. 验证 CustomVideoPlayer 初始化源码时序：assembleDOM 在 armInitialHighlightSeek 与 restoreVideoState 之前
{
    const cvpSrc = fs.readFileSync('src/player/CustomVideoPlayer.js', 'utf8');
    const assembleIdx = cvpSrc.indexOf('uiManager.assembleDOM();');
    const armIdx = cvpSrc.indexOf('this.playerCore.armInitialHighlightSeek(');
    const restoreIdx = cvpSrc.indexOf('this.playerCore.restoreVideoState({');
    assert.ok(assembleIdx !== -1 && armIdx !== -1 && restoreIdx !== -1, '关键调用点必须存在');
    assert.ok(assembleIdx < armIdx && armIdx < restoreIdx, '必须先 assembleDOM()，再安装首个高光守卫，最后调用 restoreVideoState({ skipTimeRestore })');
    console.log('✅ 6. CustomVideoPlayer 启动初始化时序验证通过');
}

console.log('🎉 「开播定位首个高光」所有单元测试全部通过！');
