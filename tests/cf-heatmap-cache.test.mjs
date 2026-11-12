import assert from 'node:assert/strict';
import worker from '../services/cf-heatmap-cache/worker.js';

console.log('--- 测试 Cloudflare Worker 边缘缓存网关 ---');

// Mock caches
const mockCacheStore = new Map();
globalThis.caches = {
    default: {
        async match(request) {
            const key = request.url || request;
            const hit = mockCacheStore.get(key);
            return hit ? hit.clone() : null;
        },
        async put(request, response) {
            const key = request.url || request;
            mockCacheStore.set(key, response.clone());
        }
    }
};

const mockCtx = {
    waitUntil(promise) {
        // noop or wait
        Promise.resolve(promise);
    }
};

// 1. OPTIONS 预检请求
{
    const req = new Request('https://worker.local/v1/heatmap/WSP-101', { method: 'OPTIONS' });
    const res = await worker.fetch(req, {}, mockCtx);
    assert.equal(res.status, 204, 'OPTIONS 应返回 204');
    assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
    console.log('✔ 测试 1 通过: OPTIONS 预检正常');
}

// 2. 405 Method Not Allowed
{
    const req = new Request('https://worker.local/v1/heatmap/WSP-101', { method: 'POST' });
    const res = await worker.fetch(req, {}, mockCtx);
    assert.equal(res.status, 405, 'POST 应返回 405');
    console.log('✔ 测试 2 通过: 非 GET 请求正确拦截 (405)');
}

// 3. 404 非法路径
{
    const req = new Request('https://worker.local/unknown/path', { method: 'GET' });
    const res = await worker.fetch(req, {}, mockCtx);
    assert.equal(res.status, 404, '非法路径应返回 404');
    console.log('✔ 测试 3 通过: 非法路由 404');
}

// 4. 环境变量缺失 500
{
    const req = new Request('https://worker.local/v1/heatmap/WSP-101', { method: 'GET' });
    const res = await worker.fetch(req, {}, mockCtx);
    assert.equal(res.status, 500, '缺少凭据应返回 500');
    console.log('✔ 测试 4 通过: 凭据缺失正确防护 (500)');
}

// 5. URL 智能清洗与 Supabase 回源查询
{
    let fetchedUrl = '';
    let fetchedHeaders = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        fetchedUrl = url;
        fetchedHeaders = options.headers;
        // 构造一个 120 字节全 0 的 bytea 响应 (hex: \x0000... 240 个字符)
        const hex = '00'.repeat(120);
        return new Response(JSON.stringify([{
            avcode: 'WSP-101',
            heatmap: `\\x${hex}`,
            total_samples: 5,
            duration_seconds: 7200
        }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    };

    try {
        const env = {
            SUPABASE_URL: 'https://daosvqbphybjsgvpujil.supabase.co/rest/v1/comments',
            SUPABASE_ANON_KEY: 'test-anon-key'
        };

        const req = new Request('https://worker.local/v1/heatmap/wsp-101', { method: 'GET' });
        const res = await worker.fetch(req, env, mockCtx);
        assert.equal(res.status, 200, '查询成功应返回 200');

        // 验证 URL 智能清洗是否剥离了 /rest/v1/comments
        assert.ok(
            fetchedUrl.startsWith('https://daosvqbphybjsgvpujil.supabase.co/rest/v1/video_crowd_heatmap?'),
            `回源 URL 必须智能修正为 video_crowd_heatmap 表，当前为: ${fetchedUrl}`
        );
        assert.equal(fetchedHeaders.apikey, 'test-anon-key');

        const data = await res.json();
        assert.equal(data.found, true);
        assert.equal(data.avcode, 'WSP-101');
        assert.equal(data.totalSamples, 5);
        assert.equal(data.durationSeconds, 7200);
        assert.equal(data.heatmap.length, 160, '120 字节 base64 长度必须恒定为 160 字符');

        console.log('✔ 测试 5 通过: URL 智能清洗、Bytea 转 Base64 均符合规范');

        // 验证缓存命中 (HIT)
        const cachedRes = await worker.fetch(req, env, mockCtx);
        assert.equal(cachedRes.status, 200);
        assert.equal(cachedRes.headers.get('CF-Edge-Cache'), 'HIT', '二次请求应命中边缘缓存');
        console.log('✔ 测试 6 通过: 边缘 24 小时缓存命中 (HIT) 验证成功');
    } finally {
        globalThis.fetch = originalFetch;
    }
}

console.log('🎉 Cloudflare Worker 全部测试 100% 通过！\n');
