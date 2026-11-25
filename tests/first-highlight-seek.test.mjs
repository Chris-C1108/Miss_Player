import assert from 'node:assert';
import fs from 'node:fs';

class MockHTMLVideoElement {}
globalThis.HTMLVideoElement = MockHTMLVideoElement;
globalThis.document = {
    addEventListener() {},
    removeEventListener() {}
};

const { PlayerCore, getTheaterSessionKey, shouldTriggerInitialHighlight } = await import('../src/player/core/PlayerCore.js');

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

    // 模拟到达目标位置并短暂播放 (< 1s)
    video.seeking = false;
    video.currentTime = 650.0;
    video.emit('seeked');
    video.currentTime = 650.5;
    video.emit('timeupdate');

    // 关键断言：播放不到 1 秒时守卫仍必须处于激活态，不能过早撤防！
    assert.strictEqual(typeof core._initialSeekGuardCancel, 'function', '播放不到 1 秒时守卫不得提前撤防');

    // 模拟播放 0.5 秒后被宿主脚本/HLS/Safari 强行跳回视频开头 (0s)
    video.currentTime = 0;
    video.emit('seeking');
    assert.strictEqual(video.currentTime, 650, '播放不到 1 秒跳回 0 时，守卫必须立即拉回 650s');

    // 模拟拉回后继续稳定播放超过 2.5 秒
    video.currentTime = 650.1;
    video.emit('timeupdate');
    assert.strictEqual(typeof core._initialSeekGuardCancel, 'function', '刚拉回仍需继续观察稳定窗口');
    video.currentTime = 652.8;
    video.emit('timeupdate');

    assert.strictEqual(core._initialSeekGuardCancel, null, '连续稳定播放 >= 2.5s 后守卫应自动解除');
    assert.strictEqual(video.listenerCount('timeupdate'), 0, '撤防后必须清理 timeupdate 监听');
    console.log('✅ 2. readyState=1 定位并播放 < 1s 后被跳回 0 的场景已成功拉回并稳定后撤防');
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

    // timeupdate 在目标附近连续推进 >= 2.5s 后撤防
    video.currentTime = 320.4;
    video.emit('timeupdate');
    assert.strictEqual(typeof core._initialSeekGuardCancel, 'function', '仅推进 0.4s 时不得提前撤防');
    video.currentTime = 323.0;
    video.emit('timeupdate');
    assert.strictEqual(core._initialSeekGuardCancel, null, '确认连续稳定播放 >= 2.5s 后应撤防');
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
    const pmSrc = fs.readFileSync('src/player/managers/ProgressManager.js', 'utf8');
    const assembleIdx = cvpSrc.indexOf('uiManager.assembleDOM();');
    const armIdx = cvpSrc.indexOf('this.playerCore.armInitialHighlightSeek(');
    const restoreIdx = cvpSrc.indexOf('this.playerCore.restoreVideoState({');
    assert.ok(assembleIdx !== -1 && armIdx !== -1 && restoreIdx !== -1, '关键调用点必须存在');
    assert.ok(assembleIdx < armIdx && armIdx < restoreIdx, '必须先 assembleDOM()，再安装首个高光守卫，最后调用 restoreVideoState({ skipTimeRestore })');
    assert.ok(
        cvpSrc.includes('this.playerCore.hasEnteredTheaterBefore(') &&
        cvpSrc.includes('this.playerCore.markTheaterEntered(') &&
        cvpSrc.includes('shouldTriggerInitialHighlight('),
        'CustomVideoPlayer 必须记录并校验退出重入状态'
    );
    assert.ok(
        pmSrc.includes('this.playerCore?.cancelInitialSeekGuard?.()'),
        'ProgressManager 手动点击/拖拽进度条时必须立即撤防开播定位守卫'
    );
    console.log('✅ 6. CustomVideoPlayer 启动初始化时序与退出重入接线验证通过');
}

// 7. 验证「中途退出播放器后再次点击浮动按钮重入」不再跳回首个高光，而是继续当前视频播放进度
{
    const video = createMockVideo({ readyState: 2, duration: 3600, currentTime: 0, paused: true });
    video.dataset = {};
    const callingButton = {
        _floatingButtonInstance: {}
    };
    const playerSettings = { betaMode: true, betaFirstCapsulePlay: true };
    const sessionKey = getTheaterSessionKey(video, 'IPX-777', { pathname: '/cn/ipx-777' });
    assert.strictEqual(sessionKey, 'code:IPX-777');

    // 首次进入播放器：允许从首个高光开播，并打上已进入标记
    const core1 = new PlayerCore({ callingButton });
    core1.targetVideo = video;
    assert.strictEqual(core1.hasEnteredTheaterBefore(sessionKey), false);
    assert.strictEqual(
        shouldTriggerInitialHighlight({
            playerSettings,
            hasTabs: true,
            hasUrlDeepLink: false,
            hasEnteredBefore: core1.hasEnteredTheaterBefore(sessionKey)
        }),
        true,
        '首次打开播放器应触发开播定位首个高光'
    );
    core1.markTheaterEntered(sessionKey);

    // 模拟播放到 1234 秒后中途退出播放器（新建/关闭实例）
    video.currentTime = 1234;
    core1.cancelInitialSeekGuard();

    // 再次点击浮动按钮重入同一视频：新建 PlayerCore，继续 1234s 播放，绝不跳回首个高光
    const core2 = new PlayerCore({ callingButton });
    core2.targetVideo = video;
    core2.videoState = { currentTime: video.currentTime, playbackRate: 1.0 };
    const enteredBefore = core2.hasEnteredTheaterBefore(sessionKey);
    assert.strictEqual(enteredBefore, true, '同一视频节点重入必须识别为已进入过播放器');
    assert.strictEqual(
        shouldTriggerInitialHighlight({
            playerSettings,
            hasTabs: true,
            hasUrlDeepLink: false,
            hasEnteredBefore: enteredBefore
        }),
        false,
        '退出重入后不得再从首个高光位置播放'
    );

    // 模拟移动 Shadow DOM 导致重入瞬间 currentTime 被重置回 0：restoreVideoState 应恢复至 1234s
    video.currentTime = 0;
    core2.restoreVideoState({ skipTimeRestore: false });
    assert.strictEqual(video.currentTime, 1234, '重入后必须继续当前视频播放进度 1234s');

    // 即使宿主框架在退出后替换了新的 <video> 节点，只要是同一浮动按钮与同一视频 Key，也识别为重入
    const recreatedVideo = createMockVideo({ readyState: 2, duration: 3600, currentTime: 980, paused: true });
    recreatedVideo.dataset = {};
    const core3 = new PlayerCore({ callingButton });
    core3.targetVideo = recreatedVideo;
    assert.strictEqual(
        core3.hasEnteredTheaterBefore(sessionKey),
        true,
        '宿主重建 video 节点时应通过 FloatingButton 会话记录识别为重入'
    );

    // SPA 切换到另一部番号 SSIS-001 时，视为新视频首次开播，仍允许触发首个高光
    const nextKey = getTheaterSessionKey(recreatedVideo, 'SSIS-001', { pathname: '/cn/ssis-001' });
    assert.strictEqual(core3.hasEnteredTheaterBefore(nextKey), false, '切换到新番号时应重新允许首次高光开播');
    console.log('✅ 7. 退出后点击浮动按钮重入续播（含宿主重建 video 与 SPA 换片隔离）验证通过');
}

console.log('🎉 「开播定位首个高光」所有单元测试全部通过！');
