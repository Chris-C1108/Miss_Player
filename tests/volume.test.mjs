import assert from 'node:assert';
import { VolumeController, checkShouldDefaultMute } from '../src/player/controls/VolumeController.js';
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
    setValue('lastUnmutedTime', 0);
    setValue('lastExplicitMuteTime', 0);
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
    setValue('lastExplicitMuteTime', 0);
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
    setValue('lastExplicitMuteTime', 0);
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
    setValue('lastExplicitMuteTime', 0);
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

// 测试用例 9: checkShouldDefaultMute 核心纯函数断言测试
{
    setValue('lastUnmutedTime', 0);
    setValue('lastExplicitMuteTime', 0);
    // 默认开启，无时间戳 -> 应当静音
    assert.strictEqual(checkShouldDefaultMute({ settings: { defaultMuted: true, muteResetMinutes: 5 } }), true);
    // 显式关闭 -> 不应静音
    assert.strictEqual(checkShouldDefaultMute({ settings: { defaultMuted: false } }), false);

    // 存在近期时间戳 (2 分钟前) -> 处于租约内，不应静音
    setValue('lastUnmutedTime', Date.now() - 2 * 60 * 1000);
    assert.strictEqual(checkShouldDefaultMute({ settings: { defaultMuted: true, muteResetMinutes: 5 } }), false);

    // 存在超时时间戳 (10 分钟前) -> 超时租约失效，应当静音
    setValue('lastUnmutedTime', Date.now() - 10 * 60 * 1000);
    assert.strictEqual(checkShouldDefaultMute({ settings: { defaultMuted: true, muteResetMinutes: 5 } }), true);
    console.log('✅ 9. checkShouldDefaultMute 纯函数断言测试通过');
}

// 测试用例 10: 跨标签意图继承测试 (Tab A 有声播放，Tab B 后来主动静音，Tab A 重入时同步静音)
{
    const baseTime = Date.now() - 2 * 60 * 1000; // 2 分钟前
    setValue('lastUnmutedTime', baseTime);
    setValue('lastExplicitMuteTime', 0);

    const videoA = createMockVideo();
    videoA.muted = false;
    videoA.volume = 1;
    const playerCoreA = createMockPlayerCore(videoA, true, 5);
    const vcA = new VolumeController(playerCoreA, {});
    vcA._localLastAudibleTime = baseTime;

    // Tab B 在 1 分钟前执行主动静音 (比 Tab A 的 baseTime 更晚)
    const laterMuteTime = Date.now() - 1 * 60 * 1000;
    setValue('lastExplicitMuteTime', laterMuteTime);

    // Tab A 执行重入网关判定
    assert.strictEqual(vcA.shouldDefaultMute(), true, '检测到外部后发主动静音，Tab A 重入时应判定为需静音');
    vcA.onReentry();
    assert.strictEqual(videoA.muted, true, 'Tab A 触发 onReentry 后应自动置为静音');
    console.log('✅ 10. 跨标签外部后发主动静音意图重入继承测试通过');
}

// 测试用例 11: 跨标签独立播放测试 (Tab B 仅有声播放未主动静音，Tab A 切回时维持有声)
{
    const baseTime = Date.now() - 1 * 60 * 1000; // 1 分钟前
    setValue('lastUnmutedTime', Date.now()); // 全局租约最新有效
    setValue('lastExplicitMuteTime', baseTime - 10000); // 外部静音发生在更早之前，非后发

    const videoA = createMockVideo();
    videoA.muted = false;
    videoA.volume = 0.9;
    const playerCoreA = createMockPlayerCore(videoA, true, 5);
    const vcA = new VolumeController(playerCoreA, {});
    vcA._localLastAudibleTime = baseTime;

    assert.strictEqual(vcA.shouldDefaultMute(), false, '无后发主动静音且在租约内，Tab A 重入时不应静音');
    vcA.onReentry();
    assert.strictEqual(videoA.muted, false, 'Tab A 触发 onReentry 后应保持有声连贯观影');
    console.log('✅ 11. 跨标签有效租约内无干扰连贯保持测试通过');
}

// 测试用例 12: checkShouldDefaultMute 的跨标签时间戳时序边界断言
{
    const playerState = { settings: { defaultMuted: true, muteResetMinutes: 5 } };
    const now = Date.now();

    // 1. lastExplicitMuteTime (30秒前) 晚于 Tab A 上次有声 (50秒前) 且晚于全局取消静音 -> 触发静音
    setValue('lastUnmutedTime', now - 60000); // 60秒前
    setValue('lastExplicitMuteTime', now - 30000); // 30秒前后发主动静音
    assert.strictEqual(checkShouldDefaultMute(playerState, now - 50000), true);

    // 2. 外部主动静音发生在 50 秒前，但随后在 30 秒前取消了静音 -> 全局最新是有声，保持有声
    setValue('lastExplicitMuteTime', now - 50000); // 50秒前
    setValue('lastUnmutedTime', now - 30000); // 30秒前用户又取消了静音
    assert.strictEqual(checkShouldDefaultMute(playerState, now - 30000), false);

    // 3. 全局静音已生效 (lastExplicitMuteTime > lastUnmutedTime)，冷启动 (local=0) -> 必须静音
    setValue('lastUnmutedTime', now - 60000);
    setValue('lastExplicitMuteTime', now - 40000);
    assert.strictEqual(checkShouldDefaultMute(playerState, 0), true);
    console.log('✅ 12. 跨标签时间戳时序边界断言测试通过');
}

console.log('🎉 VolumeController 全部单元测试 100% 通过！');
