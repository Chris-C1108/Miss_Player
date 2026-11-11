import assert from 'assert';

const storageStore = new Map();
globalThis.localStorage = {
    getItem: (k) => storageStore.get(k) || null,
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};

import {
    PeachService,
    PEACH_WEBDAV_MODE_SYNC_DEFAULT,
    PEACH_WEBDAV_MODE_SYNC_CUSTOM,
    PEACH_WEBDAV_MODE_STANDALONE,
    PEACH_KEY_GATEWAY_BASE,
    PEACH_KEY_GATEWAY_TOKEN,
    PEACH_KEY_WEBDAV_MODE,
    PEACH_KEY_WEBDAV_CUSTOM_DIR,
    PEACH_KEY_WEBDAV_STANDALONE_URL,
    PEACH_KEY_WEBDAV_STANDALONE_USER,
    PEACH_KEY_WEBDAV_STANDALONE_PASS,
    PEACH_KEY_WEBDAV_STANDALONE_DIR
} from '../src/services/PeachService.js';
import { SyncManager } from '../src/sync/SyncManager.js';
import { StrmIngestPipeline } from '../src/services/StrmIngestPipeline.js';
import { setValue } from '../src/utils/storage.js';

console.log('🧪 开始执行 Phase 19.8 流网关播放地址构建与 WebDAV 三种模式入库测试...');

// 1. 测试流网关播放 URL 构建
PeachService.saveConfig({
    gatewayBase: 'http://host.docker.internal:8765/api/resolve', // 故意带上旧版后缀，验证自动清洗
    gatewayToken: 'secret_tok_123'
});

const playUrl1 = PeachService.buildGatewayPlayUrl('stars-256');
assert.strictEqual(
    playUrl1,
    'http://host.docker.internal:8765/v1/secret_tok_123/play/STARS-256.m3u8',
    '流网关播放 URL 应当自动清洗旧版后缀、大写番号并包含 token'
);
console.log('✅ 1. 流网关播放 URL 规范清洗构建测试通过');

// 2. 测试 WebDAV 入库存储 - 模式 A (复用同步 + 默认 /MissPlayer/peach-media/)
SyncManager.saveWebDavConfig({
    url: 'https://dav.example.com',
    user: 'myuser',
    pass: 'mypass',
    path: '/MissPlayer/'
});

PeachService.saveConfig({
    webdavMode: PEACH_WEBDAV_MODE_SYNC_DEFAULT
});

const effA = PeachService.getEffectiveWebDavConfig();
assert.strictEqual(effA.mode, PEACH_WEBDAV_MODE_SYNC_DEFAULT);
assert.strictEqual(effA.targetDir, '/MissPlayer/peach-media/');
assert.strictEqual(effA.config.url, 'https://dav.example.com');
console.log('✅ 2. WebDAV 模式 A (同步默认目录) 测试通过');

// 3. 测试 WebDAV 入库存储 - 模式 B (复用同步 + 自定义目录)
PeachService.saveConfig({
    webdavMode: PEACH_WEBDAV_MODE_SYNC_CUSTOM,
    webdavCustomDir: 'Media/STRM' // 故意不带斜杠，验证归一化
});

const effB = PeachService.getEffectiveWebDavConfig();
assert.strictEqual(effB.mode, PEACH_WEBDAV_MODE_SYNC_CUSTOM);
assert.strictEqual(effB.targetDir, '/Media/STRM/');
assert.strictEqual(effB.config.url, 'https://dav.example.com');
console.log('✅ 3. WebDAV 模式 B (同步自定义目录) 测试通过');

// 4. 测试 WebDAV 入库存储 - 模式 C (独立 WebDAV 配置，支持局域网备用)
PeachService.saveConfig({
    webdavMode: PEACH_WEBDAV_MODE_STANDALONE,
    webdavStandaloneUrl: 'https://dav.loadingi.fnos.net:443',
    webdavStandaloneLanUrl: 'http://192.168.2.250:5005',
    webdavStandaloneUser: 'admin',
    webdavStandalonePass: 'admin123',
    webdavStandaloneDir: 'CloudDrive/STRM'
});

const effC = PeachService.getEffectiveWebDavConfig();
assert.strictEqual(effC.mode, PEACH_WEBDAV_MODE_STANDALONE);
assert.strictEqual(effC.targetDir, '/CloudDrive/STRM/');
assert.strictEqual(effC.config.url, 'https://dav.loadingi.fnos.net:443');
assert.strictEqual(effC.config.lanUrl, 'http://192.168.2.250:5005');
assert.strictEqual(effC.config.user, 'admin');
console.log('✅ 4. WebDAV 模式 C (独立 WebDAV 配置，支持局域网备用) 测试通过');

// 5. 测试 StrmIngestPipeline 生成内容规范
const strmText = StrmIngestPipeline.generateStrmContent(playUrl1, 'STARS-256', {
    sourcePage: 'https://jable.tv/videos/stars-256/',
    title: 'Test Movie Title'
});

const lines = strmText.split('\n');
assert.strictEqual(lines[0], 'http://host.docker.internal:8765/v1/secret_tok_123/play/STARS-256.m3u8');
assert.strictEqual(lines[1], '# avcode: STARS-256');
assert.strictEqual(lines[2], '# source: https://jable.tv/videos/stars-256/');
console.log('✅ 5. StrmIngestPipeline STRM 纯文本格式规范测试通过');

console.log('🎉 全部 5 项 Phase 19.8 播放地址与 WebDAV 入库测试 100% 通过！');
