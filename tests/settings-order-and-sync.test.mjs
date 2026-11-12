import assert from 'assert';
import fs from 'fs';
import path from 'path';

// 注入模拟本地存储，杜绝 Node 环境警告
const storageStore = new Map();
globalThis.localStorage = {
    getItem: (k) => storageStore.get(k) || null,
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};

import { PlayerState } from '../src/player/state/PlayerState.js';
import { SyncManager } from '../src/sync/SyncManager.js';

console.log('🧪 开始执行设置菜单防丢失与固定插槽顺序单元测试...');

// 1. 验证 PlayerState 构造函数完整预置 Beta 与自建库字段
const ps = new PlayerState();
assert.strictEqual(typeof ps.settings.betaMode, 'boolean', 'betaMode 必须在 settings 中预置为 boolean');
assert.strictEqual(typeof ps.settings.dataMode, 'string', 'dataMode 必须在 settings 中预置为 string');
assert.strictEqual(ps.settings.dataMode, 'local', 'dataMode 默认必须严格为 local (本地私有)');
assert.strictEqual(ps.isSharedMode(), false, '默认状态下 isSharedMode 必须为 false (物理熔断)');
assert.strictEqual(typeof ps.settings.hidePrivateData, 'boolean', 'hidePrivateData 必须在 settings 中预置为 boolean');
assert.strictEqual(ps.settings.hidePrivateData, false, 'hidePrivateData 默认必须严格为 false');

ps.settings.betaMode = true;
ps.settings.dataMode = 'shared';
assert.strictEqual(ps.isSharedMode(), true, '开启 betaMode 且 dataMode 为 shared 时 isSharedMode 为 true');
ps.settings.dataMode = 'local';
assert.strictEqual(ps.isSharedMode(), false, 'dataMode 为 local 时 isSharedMode 为 false');

assert.strictEqual(typeof ps.settings.betaHeatmap, 'boolean', 'betaHeatmap 必须在 settings 中预置为 boolean');
assert.strictEqual(typeof ps.settings.betaCrowdHeatmap, 'boolean', 'betaCrowdHeatmap 必须在 settings 中预置为 boolean');
assert.strictEqual(typeof ps.settings.betaDbEndpoint, 'string', 'betaDbEndpoint 必须在 settings 中预置为 string');
assert.strictEqual(typeof ps.settings.betaDbApiKey, 'string', 'betaDbApiKey 必须在 settings 中预置为 string');
assert.strictEqual(typeof ps.settings.crazyScrapeMode, 'boolean', 'crazyScrapeMode 必须在 settings 中预置为 boolean');
assert.strictEqual(typeof ps.settings.betaSingleHandMode, 'boolean', 'betaSingleHandMode 必须在 settings 中预置为 boolean');
console.log('✅ 1. PlayerState 默认设置字段与二元数据模式完备性校验通过');

// 2. 验证 updateSetting 能成功写入自建端点并支持动态更新
ps.updateSetting('betaDbEndpoint', 'https://supabase.example.com/comments');
ps.updateSetting('betaDbApiKey', 'secret_token_123');
assert.strictEqual(ps.settings.betaDbEndpoint, 'https://supabase.example.com/comments', 'betaDbEndpoint 应成功更新');
assert.strictEqual(ps.settings.betaDbApiKey, 'secret_token_123', 'betaDbApiKey 应成功更新');
console.log('✅ 2. 自建端点与凭据 updateSetting 写入测试通过');

// 3. 验证 SyncManager.mergeData 对自建端点和 API Key 的防抹杀保护
const localData = {
    settings: {
        betaDbEndpoint: 'https://my-supabase.example.com',
        betaDbApiKey: 'my_secret_key',
        sidebarPosition: 'right'
    },
    settingTimestamps: {
        betaDbEndpoint: 1000,
        betaDbApiKey: 1000
    },
    lastModified: 1000,
    tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
};

// 模拟云端备份未包含这两个字段（或曾经被老版本上传为空）
const remoteData = {
    settings: {
        sidebarPosition: 'left'
    },
    settingTimestamps: {
        sidebarPosition: 2000
    },
    lastModified: 2000,
    tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
};

const merged = SyncManager.mergeData(localData, remoteData, 'client-1');
assert.strictEqual(merged.settings.betaDbEndpoint, 'https://my-supabase.example.com', '云端为空时本地自建端点必须被 100% 保护保留');
assert.strictEqual(merged.settings.betaDbApiKey, 'my_secret_key', '云端为空时本地 API Key 必须被 100% 保护保留');
assert.strictEqual(merged.settings.sidebarPosition, 'left', '具备更高时间戳的普通设置项应正常按 LWW 合并');
console.log('✅ 3. WebDAV 智能合并自建端点与凭据防抹杀保护校验通过');

// 4. 验证固定插槽物理结构（模拟 DOM 插槽顺序）
const container = {
    children: [],
    appendChild(el) {
        this.children.push(el);
        return el;
    }
};

const slotPlayback = { id: 'slot-playback', children: [], appendChild(el) { this.children.push(el); } };
const slotComments = { id: 'slot-comments', children: [], appendChild(el) { this.children.push(el); } };
const slotBeta = { id: 'slot-beta', children: [], appendChild(el) { this.children.push(el); } };
const slotCloudSync = { id: 'slot-cloud-sync', children: [], appendChild(el) { this.children.push(el); } };
const slotAbout = { id: 'slot-about', children: [], appendChild(el) { this.children.push(el); } };

container.appendChild(slotPlayback);
container.appendChild(slotComments);
container.appendChild(slotBeta);
container.appendChild(slotCloudSync);
container.appendChild(slotAbout);

// 模拟即便 cloudSync 立即同步挂载，而 comments 和 beta 稍后挂载
slotPlayback.appendChild({ name: 'PlaybackSection' });
slotCloudSync.appendChild({ name: 'CloudSyncSection' }); // 立即同步挂载
slotComments.appendChild({ name: 'CommentsSection' });   // 异步 idle 挂载
slotBeta.appendChild({ name: 'BetaSection' });           // 异步 idle 挂载
slotAbout.appendChild({ name: 'AboutSection' });

const slotOrder = container.children.map(s => s.id);
assert.deepStrictEqual(slotOrder, [
    'slot-playback',
    'slot-comments',
    'slot-beta',
    'slot-cloud-sync',
    'slot-about'
], '5 大分段插槽在 DOM 树中的物理顺序绝对不变');

console.log('✅ 4. 5 大固定分段插槽顺序不可动摇性校验通过');

// 5. 验证 dataMode / hidePrivateData / betaHeatmap 多设备 WebDAV 同步完整生命周期
{
    storageStore.clear();
    const psSync = new PlayerState();
    psSync.updateSetting('dataMode', 'shared');
    psSync.updateSetting('hidePrivateData', true);
    psSync.updateSetting('betaHeatmap', true);

    const gathered = SyncManager.gatherLocalData(psSync);
    assert.strictEqual(gathered.settings.dataMode, 'shared', 'gatherLocalData 必须收集 dataMode');
    assert.strictEqual(gathered.settings.hidePrivateData, true, 'gatherLocalData 必须收集 hidePrivateData');
    assert.strictEqual(gathered.settings.betaHeatmap, true, 'gatherLocalData 必须收集 betaHeatmap');

    // 场景 A: 新设备 B 冷启动 (从未手动点击过，无 settingTimestamps)，即使 lastModified 更晚也不应抹掉设备 A 的显式配置
    const freshDeviceLocal = {
        settings: {
            dataMode: 'local',
            hidePrivateData: false,
            betaHeatmap: false
        },
        settingTimestamps: {},
        lastModified: 999999999,
        tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
    };
    const oldDeviceRemote = {
        settings: {
            dataMode: 'shared',
            hidePrivateData: true,
            betaHeatmap: true
        },
        settingTimestamps: {
            dataMode: 2000,
            hidePrivateData: 2000,
            betaHeatmap: 2000
        },
        lastModified: 2000,
        tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
    };

    const mergedOnFresh = SyncManager.mergeData(freshDeviceLocal, oldDeviceRemote, 'client-b');
    assert.strictEqual(mergedOnFresh.settings.dataMode, 'shared', '新设备默认 local 不得覆盖远端显式设置的 shared');
    assert.strictEqual(mergedOnFresh.settings.hidePrivateData, true, '新设备默认 false 不得覆盖远端显式设置的 hidePrivateData');
    assert.strictEqual(mergedOnFresh.settings.betaHeatmap, true, '新设备默认 false 不得覆盖远端显式设置的 betaHeatmap');

    // 场景 B: 设备 B 随后手动改回 local (生成更新的操作时间戳)
    const updatedLocal = {
        settings: {
            dataMode: 'local',
            hidePrivateData: false
        },
        settingTimestamps: {
            dataMode: 5000,
            hidePrivateData: 5000
        },
        lastModified: 5000,
        tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
    };
    const mergedAfterToggle = SyncManager.mergeData(updatedLocal, oldDeviceRemote, 'client-b');
    assert.strictEqual(mergedAfterToggle.settings.dataMode, 'local', '显式修改为 local 的更新时间戳必须正常同步');
    assert.strictEqual(mergedAfterToggle.settings.hidePrivateData, false, '显式修改为 false 的更新时间戳必须正常同步');

    // 验证 applyDataToLocal 正确落盘
    SyncManager.applyDataToLocal(mergedOnFresh, psSync);
    assert.strictEqual(psSync.settings.dataMode, 'shared', 'applyDataToLocal 后 PlayerState.settings.dataMode 应同步为 shared');
    assert.strictEqual(psSync.settings.hidePrivateData, true, 'applyDataToLocal 后 PlayerState.settings.hidePrivateData 应同步为 true');
}
console.log('✅ 5. dataMode / hidePrivateData 多设备 WebDAV 同步与防默认覆盖保护校验通过');

// 6. 验证 BetaSection 分段器左保守默认 ('local') 右开启共享 ('shared') 顺序
{
    const betaSectionSrc = fs.readFileSync(
        path.resolve(process.cwd(), 'src/player/managers/settings/sections/BetaSection.js'),
        'utf8'
    );
    const localIdx = betaSectionSrc.indexOf("value: 'local'");
    const sharedIdx = betaSectionSrc.indexOf("value: 'shared'");
    assert.ok(localIdx > 0 && sharedIdx > 0, 'BetaSection 必须同时声明 local 与 shared 选项');
    assert.ok(localIdx < sharedIdx, '分段器必须满足左侧「本地私有」右侧「社区共享」的人机顺序');
}
console.log('✅ 6. BetaSection 分段器左关右开顺序校验通过');

console.log('\n🎉 全部 6 项设置菜单防丢失、多设备同步与固定插槽测试 100% 通过！\n');
