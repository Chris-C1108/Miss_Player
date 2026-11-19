import test from 'node:test';
import assert from 'node:assert/strict';

import { SeekFeedbackManager } from '../src/player/managers/SeekFeedbackManager.js';

const makeVideo = (time = 0) => ({ tagName: 'VIDEO', currentTime: time });

test('SeekFeedback 跳转反馈统一出口', async (t) => {
    const calls = [];
    const playerCore = { targetVideo: makeVideo(5) };
    const controlManager = { showJumpHint: (sec) => calls.push(sec) };
    const progressManager = { isDraggingProgress: false };
    const mgr = new SeekFeedbackManager(playerCore, controlManager, progressManager);
    mgr.init();
    mgr._startedAt = 0; // 跳过开场静默窗口

    const seekTo = (from, to) => {
        playerCore.targetVideo.currentTime = from;
        mgr._onSeeking({ target: playerCore.targetVideo });
        playerCore.targetVideo.currentTime = to;
        mgr._onSeeked({ target: playerCore.targetVideo });
    };

    await t.test('大幅跳转播报一次', () => {
        calls.length = 0;
        mgr._lastAnnouncedAt = 0;
        seekTo(5, 60);
        assert.deepEqual(calls, [60]);
    });

    await t.test('微调不播报', () => {
        calls.length = 0;
        mgr._lastAnnouncedAt = 0;
        seekTo(60, 60.4);
        assert.deepEqual(calls, []);
    });

    await t.test('拖动进度条不播报', () => {
        calls.length = 0;
        mgr._lastAnnouncedAt = 0;
        progressManager.isDraggingProgress = true;
        seekTo(60, 120);
        assert.deepEqual(calls, []);
        progressManager.isDraggingProgress = false;
    });

    await t.test('片段循环自动装填不播报', () => {
        calls.length = 0;
        mgr._lastAnnouncedAt = 0;
        controlManager.loopManager = { _isSeekingCapsule: true };
        seekTo(120, 200);
        assert.deepEqual(calls, []);
        controlManager.loopManager._isSeekingCapsule = false;
    });

    await t.test('连续跳转 700ms 内合并', () => {
        calls.length = 0;
        mgr._lastAnnouncedAt = 0;
        seekTo(200, 260);
        seekTo(260, 320);
        assert.deepEqual(calls, [260], '第二次应被去重');
    });

    await t.test('播放器未接管视频时也能认领事件目标', () => {
        calls.length = 0;
        mgr._lastAnnouncedAt = 0;
        const orphan = { targetVideo: null };
        const orphanMgr = new SeekFeedbackManager(orphan, controlManager, progressManager);
        orphanMgr._startedAt = 0;
        const video = makeVideo(10);
        video.currentTime = 10;
        orphanMgr._onSeeking({ target: video });
        video.currentTime = 40;
        orphanMgr._onSeeked({ target: video });
        assert.deepEqual(calls, [40], '即使 targetVideo 为空也应播报');
    });

    mgr.cleanup();
});
