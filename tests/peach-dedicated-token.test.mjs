import assert from 'assert';

const storageStore = new Map();
globalThis.localStorage = {
    getItem: (k) => storageStore.get(k) || null,
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};

let mockGmHandler = null;
globalThis.GM_xmlhttpRequest = (opts) => {
    if (mockGmHandler) {
        mockGmHandler(opts);
    } else {
        setTimeout(() => {
            if (opts.onerror) opts.onerror({ statusText: 'MOCK_NOT_CONFIGURED' });
        }, 10);
    }
    return { abort: () => {} };
};

import {
    PeachService,
    PEACH_KEY_BASE,
    PEACH_KEY_TOKEN,
    PEACH_KEY_ENABLED
} from '../src/services/PeachService.js';

console.log('🧪 开始执行 Phase 19.12 Peach 专用令牌自动签发与同源会话 API 单元测试...');

// 1. 验证 PeachService.hasDedicatedToken()
PeachService.clearBase();
assert.strictEqual(PeachService.hasDedicatedToken(), false, '未配置 Token 时应当返回 false');

PeachService.saveConfig({ token: '{{SECRET_x7h2x485}}' });
assert.strictEqual(PeachService.hasDedicatedToken(), true, '配置 Token 后应当返回 true');
console.log('✅ 1. hasDedicatedToken 判定测试通过');

// 2.1 模拟分支 A: 401 鉴权受阻
mockGmHandler = (opts) => {
    setTimeout(() => {
        opts.onload({
            status: 401,
            responseText: JSON.stringify({ detail: 'unauthorized' }),
            finalUrl: opts.url
        });
    }, 5);
};

const res401 = await PeachService.acquireDedicatedToken('http://192.168.1.100:8900');
assert.strictEqual(res401.ok, false);
assert.strictEqual(res401.status, 'error');
assert.ok(res401.message.includes('401'), '401 应给出鉴权未就绪错误说明');
console.log('✅ 2.1 acquireDedicatedToken 401 鉴权受阻分支测试通过');

// 2.2 模拟分支 B: Peach 未配置网盘下载渠道 (降级为 STRM 模式)
mockGmHandler = (opts) => {
    setTimeout(() => {
        if (opts.url.includes('/api/configuration/jav-browser')) {
            opts.onload({
                status: 200,
                responseText: JSON.stringify({
                    enabled: false,
                    provider: '',
                    active_provider: '',
                    available: true,
                    providers: [], // 无可用网盘
                    problems: []
                }),
                finalUrl: opts.url
            });
        } else {
            opts.onload({ status: 404, responseText: '', finalUrl: opts.url });
        }
    }, 5);
};

PeachService.clearBase();
const resNoProvider = await PeachService.acquireDedicatedToken('http://192.168.1.100:8900');
assert.strictEqual(resNoProvider.ok, false);
assert.strictEqual(resNoProvider.status, 'strm_only');
const cfgAfterB = PeachService.getConfig();
assert.strictEqual(cfgAfterB.base, 'http://192.168.1.100:8900', '降级为 STRM 模式时仍应纳管 Base Origin');
assert.strictEqual(cfgAfterB.enabled, true, 'Base 纳管后应标记 enabled 为 true');
assert.strictEqual(PeachService.hasDedicatedToken(), false, '无网盘渠道时不应存留虚假 Token');
console.log('✅ 2.2 acquireDedicatedToken 无网盘渠道降级 STRM 模式测试通过');

// 2.3 模拟分支 C: 已配置网盘下载渠道，成功自动协商并签发 Dedicated Token
mockGmHandler = (opts) => {
    setTimeout(() => {
        if (opts.url.includes('/api/configuration/jav-browser')) {
            if (opts.method === 'POST') {
                const body = JSON.parse(opts.data);
                assert.strictEqual(body.action, 'enable');
                assert.strictEqual(body.provider, 'pikpak');
                opts.onload({
                    status: 200,
                    responseText: JSON.stringify({
                        enabled: true,
                        token: '{{SECRET_x7h2x485}}',
                        provider: 'pikpak'
                    }),
                    finalUrl: opts.url
                });
            } else {
                opts.onload({
                    status: 200,
                    responseText: JSON.stringify({
                        enabled: false,
                        provider: 'pikpak',
                        active_provider: 'pikpak',
                        available: true,
                        providers: [
                            { key: 'pikpak', label: 'PikPak', configured: true, target: true }
                        ],
                        problems: []
                    }),
                    finalUrl: opts.url
                });
            }
        } else {
            opts.onload({ status: 404, responseText: '', finalUrl: opts.url });
        }
    }, 5);
};

const resSuccess = await PeachService.acquireDedicatedToken('http://192.168.1.100:8900');
assert.strictEqual(resSuccess.ok, true);
assert.strictEqual(resSuccess.status, 'full');
assert.strictEqual(resSuccess.token, '{{SECRET_x7h2x485}}');
assert.strictEqual(PeachService.hasDedicatedToken(), true, '签发成功后 hasDedicatedToken 必须为 true');
assert.strictEqual(PeachService.getConfig().token, '{{SECRET_x7h2x485}}');
console.log('✅ 2.3 acquireDedicatedToken 协商并签发 Dedicated Token 成功分支测试通过');

// 3. 验证 testConnection() 的分级状态 (full vs strm_only)
mockGmHandler = (opts) => {
    setTimeout(() => {
        if (opts.url.includes('/healthz')) {
            opts.onload({ status: 200, responseText: JSON.stringify({ ok: true }), finalUrl: opts.url });
        } else if (opts.url.includes('/api/jav-browser?code=TEST-001')) {
            opts.onload({ status: 200, responseText: JSON.stringify({ ok: true, state: 'idle' }), finalUrl: opts.url });
        } else {
            opts.onload({ status: 404, responseText: '', finalUrl: opts.url });
        }
    }, 5);
};

const testFull = await PeachService.testConnection();
assert.strictEqual(testFull.ok, true);
assert.strictEqual(testFull.status, 'full');
assert.ok(testFull.message.includes('全功能就绪'));
console.log('✅ 3.1 testConnection 全功能就绪测试通过');

// 清空 token 模拟仅 STRM 模式
PeachService.saveConfig({ token: '' });
const testStrmOnly = await PeachService.testConnection();
assert.strictEqual(testStrmOnly.ok, true);
assert.strictEqual(testStrmOnly.status, 'strm_only');
assert.ok(testStrmOnly.message.includes('STRM'));
console.log('✅ 3.2 testConnection 仅 STRM 模式测试通过');

console.log('🎉 全部 Phase 19.12 Peach 专用令牌自动签发与同源会话 API 单元测试 100% 通过！');
