/**
 * WebDavClient 双地址自适应与自动故障转移 (LAN / WAN Failover) 单元测试
 */

import assert from 'assert';
import { WebDavClient } from '../src/sync/WebDavClient.js';
import { setValue } from '../src/utils/storage.js';

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
    assert.deepStrictEqual(candidates3, ['https://dav.jianguoyun.com/dav']);
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

// 测试 7: 私网 IP 智能协议补全与端点规范化
{
    console.log('▶ 测试 7: 私网 IP 智能协议补全与端点规范化');
    // 内网 IP 缺省协议自动补充 http://
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('192.168.2.250:5005'), 'http://192.168.2.250:5005');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('10.0.0.1:8080/'), 'http://10.0.0.1:8080');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('localhost:5005'), 'http://localhost:5005');
    // 公网域名缺省协议自动补充 https://
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('dav.loadingi.fnos.net:443'), 'https://dav.loadingi.fnos.net:443');
    // 已带协议的保持原样
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('http://nas.lan:5005/'), 'http://nas.lan:5005');
    console.log('  ✓ 智能协议补全与规范化清洗正确\n');
}

// 测试 8: testConnection 全流程自适应 (主地址超时，自动切换备用地址并返回局域网直连提示)
{
    console.log('▶ 测试 8: testConnection 全流程自适应 (公网超时无缝切备用)');
    WebDavClient._activeUrlCache.clear();

    const origRequest = WebDavClient.request;
    const requestedUrls = [];
    WebDavClient.request = async (opts) => {
        requestedUrls.push(opts.url);
        // 模拟公网域名在内网发起 PROPFIND 或 GET 时网络超时
        if (opts.url.includes('dav.loadingi.fnos.net')) {
            throw new Error(`WebDAV 请求超时 (${opts.timeout}ms)`);
        }
        // 备用内网地址正常响应
        if (opts.method === 'PROPFIND') {
            return { status: 207, statusText: 'Multi-Status' };
        }
        if (opts.method === 'GET') {
            return { status: 200, statusText: 'OK', data: '{}' };
        }
        return { status: 200, statusText: 'OK' };
    };

    const config = {
        url: 'https://dav.loadingi.fnos.net:443',
        lanUrl: '192.168.2.250:5005', // 测试未带 http:// 自动补全
        user: 'admin',
        pass: 'pass'
    };

    const result = await WebDavClient.testConnection(config);
    assert.strictEqual(result.success, true);
    assert(result.message.includes('局域网直连'), `提示消息应标明局域网直连: ${result.message}`);
    assert(requestedUrls.some(u => u.includes('192.168.2.250:5005')), '必须成功调用内网备用地址');

    WebDavClient.request = origRequest;
    console.log('  ✓ testConnection 全流程自适应测试通过\n');
}

// 测试 9: hasValidEndpoint 校验
{
    console.log('▶ 测试 9: hasValidEndpoint 全局有效端点判定');
    assert.strictEqual(WebDavClient.hasValidEndpoint({ url: 'https://foo.com' }), true);
    assert.strictEqual(WebDavClient.hasValidEndpoint({ lanUrl: 'http://192.168.1.1' }), true);
    assert.strictEqual(WebDavClient.hasValidEndpoint({ url: '', lanUrl: '' }), false);
    assert.strictEqual(WebDavClient.hasValidEndpoint(null), false);
    console.log('  ✓ hasValidEndpoint 判定正确\n');
}

// 测试 10: 路由器 HTML 登录页劫持 (200 / 401 HTML) 精准识破并无缝切换内网
{
    console.log('▶ 测试 10: 识破路由器 200/401 HTML 劫持并切往备用内网端点');
    WebDavClient._activeUrlCache.clear();
    setValue('mp_active_webdav_lease', {});

    const origRequest = WebDavClient.request;
    const calledUrls = [];
    WebDavClient.request = async (opts) => {
        calledUrls.push(opts.url);
        if (opts.url.includes('dav.loadingi.fnos.net')) {
            // 模拟光猫/路由器在 443 返回了一个带 401 或 200 的网页登录界面
            return {
                status: 401,
                statusText: 'Unauthorized',
                data: '<!DOCTYPE html><html><head><title>Router Admin</title></head><body>Login</body></html>'
            };
        }
        if (opts.method === 'PROPFIND') {
            return { status: 207, statusText: 'Multi-Status', data: '<?xml version="1.0"?><D:multistatus/>' };
        }
        if (opts.method === 'GET') {
            return { status: 404, statusText: 'Not Found', data: '' };
        }
        return { status: 200, statusText: 'OK', data: '' };
    };

    const config = {
        url: 'https://dav.loadingi.fnos.net:443',
        lanUrl: 'http://192.168.2.250:5005',
        user: 'chen',
        pass: 'pass',
        path: '/backup_configs/MissPlayer/'
    };

    const res = await WebDavClient.testConnection(config);
    assert.strictEqual(res.success, true);
    assert(res.message.includes('局域网直连'), `应当切到局域网直连: ${res.message}`);
    assert(calledUrls.some(u => u.includes('dav.loadingi.fnos.net')), '先探测了主地址');
    assert(calledUrls.some(u => u.includes('192.168.2.250:5005')), '识破 HTML 劫持后切到内网地址');

    WebDavClient.request = origRequest;
    console.log('  ✓ 路由器 HTML 劫持识破与切换测试通过\n');
}

// 测试 11: 终极目标路径优先直探，免疫父目录权限限制
{
    console.log('▶ 测试 11: 终极目标路径优先直探，免疫 NAS 父目录共享权限拦截');
    WebDavClient._activeUrlCache.clear();
    setValue('mp_active_webdav_lease', {});

    const origRequest = WebDavClient.request;
    const requestedPaths = [];
    WebDavClient.request = async (opts) => {
        requestedPaths.push(opts.url);
        if (opts.url.endsWith('/backup_configs/')) {
            // 模拟共享根目录禁止列举，返回 403
            return { status: 403, statusText: 'Forbidden', data: '' };
        }
        if (opts.url.endsWith('/backup_configs/MissPlayer/')) {
            return { status: 207, statusText: 'Multi-Status', data: '<D:multistatus/>' };
        }
        return { status: 404, statusText: 'Not Found', data: '' };
    };

    await WebDavClient.ensureDirectory({
        url: 'http://192.168.2.250:5005',
        user: 'chen',
        pass: 'pass',
        path: '/backup_configs/MissPlayer/'
    });

    assert.deepStrictEqual(requestedPaths, ['http://192.168.2.250:5005/backup_configs/MissPlayer/']);

    WebDavClient.request = origRequest;
    console.log('  ✓ 目标目录优先直探免疫父目录拦截测试通过\n');
}

// 测试 12: 所有候选端点全部失败时，错误需聚合展示各端点的真实报错
{
    console.log('▶ 测试 12: 全端点均失败时暴露全链路详细诊断误差');
    WebDavClient._activeUrlCache.clear();
    setValue('mp_active_webdav_lease', {});

    const origRequest = WebDavClient.request;
    WebDavClient.request = async (opts) => {
        if (opts.url.includes('dav.loadingi.fnos.net')) {
            throw new Error('WebDAV 请求超时 (3000ms)');
        }
        throw new Error('网络连接失败 (HTTP [0]): 无法访问 http://192.168.2.250:5005');
    };

    let caughtErr = null;
    try {
        await WebDavClient.testConnection({
            url: 'https://dav.loadingi.fnos.net:443',
            lanUrl: 'http://192.168.2.250:5005',
            user: 'chen',
            pass: 'pass',
            path: '/backup_configs/MissPlayer/'
        });
    } catch (e) {
        caughtErr = e;
    }

    assert(caughtErr !== null, '必须抛出错误');
    assert(caughtErr.message.includes('dav.loadingi.fnos.net'), `应包含主地址报错详情: ${caughtErr.message}`);
    assert(caughtErr.message.includes('192.168.2.250:5005'), `应包含备用地址报错详情: ${caughtErr.message}`);

    WebDavClient.request = origRequest;
    console.log('  ✓ 多端点全失败聚合诊断输出测试通过\n');
}

console.log('🎉 WebDavClient 双地址自适应 (LAN/WAN Failover) 12 项单元测试全部通过！\n');
