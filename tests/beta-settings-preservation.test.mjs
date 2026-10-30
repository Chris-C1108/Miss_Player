import assert from 'assert';

const storageStore = new Map();
globalThis.localStorage = {
    getItem: (k) => storageStore.get(k) || null,
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};

import { getValue, setValue, getBool } from '../src/utils/storage.js';
import { SyncManager } from '../src/sync/SyncManager.js';

console.log('🧪 开始执行实验功能与 Supabase 设置防抹杀与双写自愈测试...');

// 1. 验证 setValue 镜像写入与 getValue 读取
setValue('test_key', 'hello_miss_player');
assert.strictEqual(getValue('test_key'), 'hello_miss_player', '基础设置与读取应正常');
console.log('✅ 1. 基础存储与读取验证通过');

// 2. 验证 SyncManager.mergeData 对 betaMode 的开启保护
const localData = {
    settings: {
        betaMode: true,
        betaDbEndpoint: 'https://my-supabase.domain.com/v1',
        betaDbApiKey: 'secret_token_abc'
    },
    settingTimestamps: {
        betaMode: 1000
    },
    lastModified: 1000,
    tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
};

// 模拟云端备份包含老旧的关闭状态
const remoteData = {
    settings: {
        betaMode: false,
        betaDbEndpoint: '',
        betaDbApiKey: ''
    },
    settingTimestamps: {
        betaMode: 900
    },
    lastModified: 2000,
    tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
};

const merged = SyncManager.mergeData(localData, remoteData, 'client-1');
assert.strictEqual(merged.settings.betaMode, true, '本地开启 betaMode 时，绝不可被云端关闭值冲垮');
assert.strictEqual(merged.settings.betaDbEndpoint, 'https://my-supabase.domain.com/v1', '自建端点必须被 100% 保护保留');
assert.strictEqual(merged.settings.betaDbApiKey, 'secret_token_abc', '自建 API Key 必须被 100% 保护保留');
console.log('✅ 2. 云端合并时 betaMode 与 Supabase 设置防抹杀断言通过');

// 3. 验证 applyDataToLocal 在面对空值时的防御性跳过
setValue('betaDbEndpoint', 'https://local-preserved.com');
setValue('betaDbApiKey', 'key-preserved');
setValue('betaMode', true);

// 模拟云端发来全空设置
const emptyRemoteData = {
    settings: {
        betaDbEndpoint: '',
        betaDbApiKey: '',
        betaMode: false,
        showProgressBar: true
    }
};

SyncManager.applyDataToLocal(emptyRemoteData);

assert.strictEqual(getValue('betaDbEndpoint'), 'https://local-preserved.com', '本地已有有效端点时，applyDataToLocal 严禁用云端空值抹除');
assert.strictEqual(getValue('betaDbApiKey'), 'key-preserved', '本地已有 API Key 时，applyDataToLocal 严禁用云端空值抹除');
assert.strictEqual(getBool('betaMode', false), true, '本地已开启 betaMode 时，applyDataToLocal 严禁用云端 false 覆盖关停');
console.log('✅ 3. applyDataToLocal 面对空值与关闭状态时的防御性保护断言通过');

console.log('\n🎉 全部 3 项实验功能与自建端点防丢失测试 100% 通过！\n');
