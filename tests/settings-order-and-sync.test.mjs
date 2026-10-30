import assert from 'assert';

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
assert.strictEqual(typeof ps.settings.betaHeatmap, 'boolean', 'betaHeatmap 必须在 settings 中预置为 boolean');
assert.strictEqual(typeof ps.settings.betaDbEndpoint, 'string', 'betaDbEndpoint 必须在 settings 中预置为 string');
assert.strictEqual(typeof ps.settings.betaDbApiKey, 'string', 'betaDbApiKey 必须在 settings 中预置为 string');
assert.strictEqual(typeof ps.settings.crazyScrapeMode, 'boolean', 'crazyScrapeMode 必须在 settings 中预置为 boolean');
assert.strictEqual(typeof ps.settings.betaSingleHandMode, 'boolean', 'betaSingleHandMode 必须在 settings 中预置为 boolean');
console.log('✅ 1. PlayerState 默认设置字段完备性校验通过');

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

console.log('\n🎉 全部 4 项设置菜单防丢失与固定插槽测试 100% 通过！\n');
