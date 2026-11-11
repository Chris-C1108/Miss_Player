/**
 * WebDavClient 双地址自适应与自动故障转移 (LAN / WAN Failover) 单元测试
 */

import assert from 'assert';
import { WebDavClient } from '../src/sync/WebDavClient.js';

console.log('🧪 开始运行 WebDavClient 双地址自适应 (LAN/WAN Failover) 单元测试...\n');

// 测试 1: 候选地址提取与去重
{
    console.log('▶ 测试 1: 候选地址提取与去重 (getCandidateUrls)');
    const cfg1 = { url: 'https://dav.loadingi.fnos.net:443', lanUrl: 'http://192.168.2.250:5005' };
    const candidates1 = WebDavClient.getCandidateUrls(cfg1);
    assert.deepStrictEqual(candidates1, [
        'https://dav.loadingi.fnos.net:443',
        'http://192.168.2.250:5005'
    ]);

    // 重复地址自动去重
    const cfg2 = { url: 'http://192.168.2.250:5005', lanUrl: 'http://192.168.2.250:5005' };
    const candidates2 = WebDavClient.getCandidateUrls(cfg2);
    assert.deepStrictEqual(candidates2, ['http://192.168.2.250:5005']);

    // 仅配置主地址
    const cfg3 = { url: 'https://dav.jianguoyun.com/dav/', lanUrl: '' };
    const candidates3 = WebDavClient.getCandidateUrls(cfg3);
    assert.deepStrictEqual(candidates3, ['https://dav.jianguoyun.com/dav/']);
    console.log('  ✓ 候选地址提取与去重正确\n');
}

// 测试 2: 单地址正常执行
{
    console.log('▶ 测试 2: 单地址正常执行');
    const config = { url: 'https://dav.example.com', user: 'u', pass: 'p' };
    let calledUrl = null;
    const res = await WebDavClient.executeWithFailover(config, async (activeCfg) => {
        calledUrl = activeCfg.url;
        return { ok: true };
    });
    assert.strictEqual(calledUrl, 'https://dav.example.com');
    assert.strictEqual(res.ok, true);
    console.log('  ✓ 单地址执行正确\n');
}

// 测试 3: 主地址网络超时，自动切换备用地址并更新活跃记忆
{
    console.log('▶ 测试 3: 主地址网络超时，自动切换备用地址并更新活跃记忆');
    WebDavClient._activeUrlCache.clear();

    const config = {
        url: 'https://dav.loadingi.fnos.net:443',
        lanUrl: 'http://192.168.2.250:5005',
        user: 'admin',
        pass: 'pass'
    };

    const callHistory = [];
    const res = await WebDavClient.executeWithFailover(config, async (activeCfg) => {
        callHistory.push(activeCfg.url);
        if (activeCfg.url === 'https://dav.loadingi.fnos.net:443') {
            throw new Error(`WebDAV 请求超时 (${activeCfg._failoverTimeout}ms)`);
        }
        return { data: 'from_lan', source: activeCfg.url };
    });

    assert.deepStrictEqual(callHistory, [
        'https://dav.loadingi.fnos.net:443',
        'http://192.168.2.250:5005'
    ]);
    assert.strictEqual(res.data, 'from_lan');

    // 验证活跃记忆已保存
    const cacheKey = `${config.url}#${config.user}`;
    assert.strictEqual(WebDavClient._activeUrlCache.get(cacheKey), 'http://192.168.2.250:5005');
    console.log('  ✓ 成功无缝切换至备用内网地址并记录会话活跃记忆\n');
}

// 测试 4: 命中活跃记忆，后续请求优先走已成功的备用地址
{
    console.log('▶ 测试 4: 活跃端点记忆生效，后续调用优先直连已验证的内网地址');
    const config = {
        url: 'https://dav.loadingi.fnos.net:443',
        lanUrl: 'http://192.168.2.250:5005',
        user: 'admin',
        pass: 'pass'
    };

    const callHistory = [];
    const res = await WebDavClient.executeWithFailover(config, async (activeCfg) => {
        callHistory.push(activeCfg.url);
        return { success: true, url: activeCfg.url };
    });

    // 此时应该首选 http://192.168.2.250:5005，无需再次请求超时主地址
    assert.deepStrictEqual(callHistory, ['http://192.168.2.250:5005']);
    assert.strictEqual(res.url, 'http://192.168.2.250:5005');
    console.log('  ✓ 优先命中活跃记忆，0ms 直连成功\n');
}

// 测试 5: 401 认证错误禁止盲目切换
{
    console.log('▶ 测试 5: 401/403 认证错误快速抛出，禁止盲目切换');
    WebDavClient._activeUrlCache.clear();

    const config = {
        url: 'https://dav.loadingi.fnos.net:443',
        lanUrl: 'http://192.168.2.250:5005',
        user: 'admin',
        pass: 'wrong_pass'
    };

    const callHistory = [];
    let thrownError = null;
    try {
        await WebDavClient.executeWithFailover(config, async (activeCfg) => {
            callHistory.push(activeCfg.url);
            throw new Error('认证失败 (401): 密码错误');
        });
    } catch (err) {
        thrownError = err;
    }

    assert(thrownError !== null, '必须抛出认证错误');
    assert.strictEqual(thrownError.message, '认证失败 (401): 密码错误');
    // 认证错误只尝试了一次，绝不盲目切换重试
    assert.deepStrictEqual(callHistory, ['https://dav.loadingi.fnos.net:443']);
    console.log('  ✓ 401 认证错误快速抛出，未发生无效切换\n');
}

// 测试 6: checkFileExists 带自动故障转移
{
    console.log('▶ 测试 6: checkFileExists 具备双地址自适应');
    WebDavClient._activeUrlCache.clear();

    // Mock WebDavClient.request
    const origRequest = WebDavClient.request;
    const requestedUrls = [];
    WebDavClient.request = async (opts) => {
        requestedUrls.push(opts.url);
        if (opts.url.includes('dav.loadingi.fnos.net')) {
            throw new Error('网络连接失败 (ECONNREFUSED)');
        }
        return { status: 200, statusText: 'OK' };
    };

    const config = {
        url: 'https://dav.loadingi.fnos.net:443',
        lanUrl: 'http://192.168.2.250:5005',
        user: 'admin',
        pass: 'pass'
    };

    const exists = await WebDavClient.checkFileExists(config, '/MissPlayer/MIZD-380.strm');
    assert.strictEqual(exists, true);
    assert(requestedUrls.some(u => u.includes('192.168.2.250:5005')));

    // 恢复 request
    WebDavClient.request = origRequest;
    console.log('  ✓ checkFileExists 双地址自适应测试通过\n');
}

console.log('🎉 WebDavClient 双地址自适应 (LAN/WAN Failover) 6 项单元测试全部通过！\n');
