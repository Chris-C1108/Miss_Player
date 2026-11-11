import assert from 'node:assert';
import { VolumeController } from '../src/player/controls/VolumeController.js';
import { setValue, getValue } from '../src/utils/storage.js';

console.log('🧪 开始执行 VolumeController 与静音重置策略单元测试...');

// 模拟 DOM 环境 (Node.js 下简易 mock)
try {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true
    });
} catch (_) {}
globalThis.window = { MSStream: undefined };

const mockStorage = new Map();
globalThis.localStorage = {
    getItem: (key) => mockStorage.has(key) ? mockStorage.get(key) : null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear()
};

function createMockVideo() {
    const listeners = {};
    return {
        volume: 1,
        muted: false,
        paused: false,
        addEventListener(event, cb) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(cb);
        },
        removeEventListener(event, cb) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(fn => fn !== cb);
            }
        },
        trigger(event) {
            if (listeners[event]) {
                listeners[event].forEach(fn => fn());
            }
        }
    };
}

function createMockPlayerCore(video, defaultMuted = true, muteResetMinutes = 5) {
    return {
        targetVideo: video,
        options: {
            playerState: {
                settings: {
                    defaultMuted,
                    muteResetMinutes
                }
            }
        }
    };
}

// 测试用例 1: 默认静音未开启
{
    const video = createMockVideo();
    const playerCore = createMockPlayerCore(video, false, 5);
    const vc = new VolumeController(playerCore, {});
    assert.strictEqual(vc.shouldDefaultMute(), false, '未开启 defaultMuted 时不应判定为默认静音');
    console.log('✅ 1. 未开启默认静音开关测试通过');
}

// 测试用例 2: 默认静音开启，但无历史取消静音时间戳
{
    setValue('lastUnmutedTime', 0);
    const video = createMockVideo();
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});
    assert.strictEqual(vc.shouldDefaultMute(), true, '从未取消静音时应判定为默认静音');
    console.log('✅ 2. 默认静音且无时间戳测试通过');
}

// 测试用例 3: 默认静音开启，但在 5 分钟超时时间内 (例如 2 分钟前取消静音)
{
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    setValue('lastUnmutedTime', twoMinutesAgo);
    const video = createMockVideo();
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});
    assert.strictEqual(vc.shouldDefaultMute(), false, '在 5 分钟记忆期内不应重置为静音');
    console.log('✅ 3. 记忆有效期内保持有声测试通过');
}

// 测试用例 4: 默认静音开启，但已超过 5 分钟超时时间 (例如 6 分钟前取消静音)
{
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
    setValue('lastUnmutedTime', sixMinutesAgo);
    const video = createMockVideo();
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});
    assert.strictEqual(vc.shouldDefaultMute(), true, '超过 5 分钟应重置为默认静音');
    console.log('✅ 4. 超时后自动重置为默认静音测试通过');
}

// 测试用例 5: 手动切换静音与时间戳记录
{
    const video = createMockVideo();
    video.muted = true;
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});

    // 手动取消静音
    const beforeUnmute = Date.now();
    vc.toggleMute();
    assert.strictEqual(video.muted, false, '手动取消静音后 muted 应为 false');
    const recordedTime = getValue('lastUnmutedTime', 0);
    assert.ok(recordedTime >= beforeUnmute, '手动取消静音应记录当前时间戳');

    // 手动再次静音
    vc.toggleMute();
    assert.strictEqual(video.muted, true, '手动静音后 muted 应为 true');
    assert.strictEqual(getValue('lastUnmutedTime', 0), 0, '手动静音应清空时间戳以保证下次打开依然静音');
    console.log('✅ 5. 手动取消/恢复静音及时间戳生命周期测试通过');
}

// 测试用例 6: 退出时处于有声播放状态，应记录退出时间戳
{
    setValue('lastUnmutedTime', 0);
    const video = createMockVideo();
    video.muted = false;
    video.volume = 0.8;
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});

    const beforeExit = Date.now();
    vc.recordExitState();
    const recordedTime = getValue('lastUnmutedTime', 0);
    assert.ok(recordedTime >= beforeExit, '退出时为有声状态应记录退出时间戳');
    assert.strictEqual(vc.shouldDefaultMute(), false, '记录退出时间戳后，5分钟内再次进入不应被判定为静音');
    console.log('✅ 6. 有声退出保留租约时间戳测试通过');
}

// 测试用例 7: 退出时本身处于静音状态，应清空时间戳 (销毁租约)
{
    setValue('lastUnmutedTime', Date.now()); // 预设曾有时间戳
    const video = createMockVideo();
    video.muted = true; // 退出时处于静音
    video.volume = 0.8;
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});

    vc.recordExitState();
    assert.strictEqual(getValue('lastUnmutedTime', 0), 0, '退出时处于静音应销毁时间戳');
    assert.strictEqual(vc.shouldDefaultMute(), true, '销毁时间戳后，下次进入必定静音');
    console.log('✅ 7. 静音退出彻底销毁时间戳测试通过');
}

// 测试用例 8: cleanup 时自动调用 recordExitState 并解绑事件
{
    const video = createMockVideo();
    video.muted = false;
    video.volume = 1;
    const playerCore = createMockPlayerCore(video, true, 5);
    const vc = new VolumeController(playerCore, {});

    const beforeCleanup = Date.now();
    vc.cleanup();
    assert.ok(getValue('lastUnmutedTime', 0) >= beforeCleanup, 'cleanup 应当自动触发退出状态记录');
    console.log('✅ 8. cleanup 自动触发退出音频结算测试通过');
}

console.log('🎉 VolumeController 全部单元测试 100% 通过！');
