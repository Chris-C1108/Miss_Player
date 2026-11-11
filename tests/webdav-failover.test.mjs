/**
 * WebDavClient 双地址自适应与自动故障转移单元测试
 */

import assert from 'assert';
import { WebDavClient } from '../src/sync/WebDavClient.js';
import { SyncManager } from '../src/sync/SyncManager.js';
import { PeachService } from '../src/services/PeachService.js';
import { setValue } from '../src/utils/storage.js';

const __memStore = new Map();
globalThis.GM_getValue = (k, def) => (__memStore.has(k) ? __memStore.get(k) : def);
globalThis.GM_setValue = (k, v) => __memStore.set(k, v);

console.log('🧪 开始运行 WebDavClient 双地址自适应与全局协议守卫单元测试...\n');

// 测试 1: 候选地址提取与去重
{
    console.log('▶ 测试 1: 候选地址提取与去重 (getCandidateUrls)');
    const cfg1 = { url: 'https://dav.example.com:443', lanUrl: 'http://192.168.1.100:8080' };
    const candidates1 = WebDavClient.getCandidateUrls(cfg1);
    assert.deepStrictEqual(candidates1, [
        'https://dav.example.com:443',
        'http://192.168.1.100:8080'
    ]);

    // 重复地址自动去重
    const cfg2 = { url: 'http://192.168.1.100:8080', lanUrl: 'http://192.168.1.100:8080' };
    const candidates2 = WebDavClient.getCandidateUrls(cfg2);
    assert.deepStrictEqual(candidates2, ['http://192.168.1.100:8080']);

    // 仅配置主地址 (例如坚果云)
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
    WebDavClient.clearEndpointLease();

    const config = {
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'admin',
        pass: 'pass'
    };

    const callHistory = [];
    const res = await WebDavClient.executeWithFailover(config, async (activeCfg) => {
        callHistory.push(activeCfg.url);
        if (activeCfg.url === 'https://dav.example.com:443') {
            throw new Error(`WebDAV 请求超时 (${activeCfg._failoverTimeout}ms)`);
        }
        return { data: 'from_lan', source: activeCfg.url };
    });

    assert.deepStrictEqual(callHistory, [
        'https://dav.example.com:443',
        'http://192.168.1.100:8080'
    ]);
    assert.strictEqual(res.data, 'from_lan');

    // 验证活跃记忆已保存
    const cacheKey = `${config.url}#${config.user}`;
    assert.strictEqual(WebDavClient._activeUrlCache.get(cacheKey), 'http://192.168.1.100:8080');
    console.log('  ✓ 成功无缝切换至备用地址并记录会话活跃记忆\n');
}

// 测试 4: 命中活跃记忆，后续请求优先走已成功的备用地址
{
    console.log('▶ 测试 4: 活跃端点记忆生效，后续调用优先直连已验证的备用地址');
    const config = {
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'admin',
        pass: 'pass'
    };

    const callHistory = [];
    const res = await WebDavClient.executeWithFailover(config, async (activeCfg) => {
        callHistory.push(activeCfg.url);
        return { success: true, url: activeCfg.url };
    });

    assert.deepStrictEqual(callHistory, ['http://192.168.1.100:8080']);
    assert.strictEqual(res.url, 'http://192.168.1.100:8080');
    console.log('  ✓ 优先命中活跃记忆，0ms 直连成功\n');
}

// 测试 5: 401 认证错误禁止盲目切换
{
    console.log('▶ 测试 5: 401/403 认证错误快速抛出，禁止盲目切换');
    WebDavClient.clearEndpointLease();

    const config = {
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'admin',
        pass: 'wrongpass'
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
    assert.deepStrictEqual(callHistory, ['https://dav.example.com:443']);
    console.log('  ✓ 401 认证错误快速抛出，未发生无效切换\n');
}

// 测试 6: checkFileExists 带自动故障转移
{
    console.log('▶ 测试 6: checkFileExists 具备双地址自适应');
    WebDavClient.clearEndpointLease();

    const origRequest = WebDavClient.request;
    const requestedUrls = [];
    WebDavClient.request = async (opts) => {
        requestedUrls.push(opts.url);
        if (opts.url.includes('dav.example.com')) {
            throw new Error('网络连接失败 (ECONNREFUSED)');
        }
        return { status: 200, statusText: 'OK' };
    };

    const config = {
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'admin',
        pass: 'pass'
    };

    const exists = await WebDavClient.checkFileExists(config, '/MissPlayer/MIZD-380.strm');
    assert.strictEqual(exists, true);
    assert(requestedUrls.some(u => u.includes('192.168.1.100:8080')));

    WebDavClient.request = origRequest;
    console.log('  ✓ checkFileExists 双地址自适应测试通过\n');
}

// 测试 7: 私网 IP 智能协议补全与端点规范化
{
    console.log('▶ 测试 7: 私网 IP 智能协议补全与端点规范化');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('192.168.1.100:8080'), 'http://192.168.1.100:8080');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('10.0.0.1:8080/'), 'http://10.0.0.1:8080');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('localhost:8080'), 'http://localhost:8080');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('dav.example.com:443'), 'https://dav.example.com:443');
    assert.strictEqual(WebDavClient.sanitizeEndpointUrl('http://nas.lan:8080/'), 'http://nas.lan:8080');
    console.log('  ✓ 智能协议补全与规范化清洗正确\n');
}

// 测试 8: testConnection 全流程自适应 (主地址超时，自动切换备用地址并返回内网直连提示)
{
    console.log('▶ 测试 8: testConnection 全流程自适应 (主地址超时无缝切备用)');
    WebDavClient.clearEndpointLease();

    const origRequest = WebDavClient.request;
    const requestedUrls = [];
    WebDavClient.request = async (opts) => {
        requestedUrls.push(opts.url);
        if (opts.url.includes('dav.example.com')) {
            throw new Error(`WebDAV 请求超时 (${opts.timeout}ms)`);
        }
        if (opts.method === 'PROPFIND') {
            return { status: 207, statusText: 'Multi-Status' };
        }
        if (opts.method === 'GET') {
            return { status: 200, statusText: 'OK', data: '{}' };
        }
        return { status: 200, statusText: 'OK' };
    };

    const config = {
        url: 'https://dav.example.com:443',
        lanUrl: '192.168.1.100:8080',
        user: 'admin',
        pass: 'pass'
    };

    const result = await WebDavClient.testConnection(config);
    assert.strictEqual(result.success, true);
    assert(result.message.includes('内网直连'), `提示消息应标明内网直连: ${result.message}`);
    assert(requestedUrls.some(u => u.includes('192.168.1.100:8080')), '必须成功调用内网备用地址');

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

// 测试 10: 路由器 HTML 登录页劫持 (200 / 401 HTML) 精准识破并无缝切换备用地址
{
    console.log('▶ 测试 10: 识破网关 200/401 HTML 劫持并切往备用端点');
    WebDavClient.clearEndpointLease();

    const origRequest = WebDavClient.request;
    const calledUrls = [];
    WebDavClient.request = async (opts) => {
        calledUrls.push(opts.url);
        if (opts.url.includes('dav.example.com')) {
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
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass',
        path: '/backup_configs/MissPlayer/'
    };

    const res = await WebDavClient.testConnection(config);
    assert.strictEqual(res.success, true);
    assert(res.message.includes('内网直连'), `应当切到内网直连: ${res.message}`);
    assert(calledUrls.some(u => u.includes('dav.example.com')), '先探测了主地址');
    assert(calledUrls.some(u => u.includes('192.168.1.100:8080')), '识破 HTML 劫持后切到内网地址');

    WebDavClient.request = origRequest;
    console.log('  ✓ 网关 HTML 劫持识破与切换测试通过\n');
}

// 测试 11: 终极目标路径优先直探，免疫父目录权限限制
{
    console.log('▶ 测试 11: 终极目标路径优先直探，免疫父目录权限拦截');
    WebDavClient.clearEndpointLease();

    const origRequest = WebDavClient.request;
    const requestedPaths = [];
    WebDavClient.request = async (opts) => {
        requestedPaths.push(opts.url);
        if (opts.url.endsWith('/backup_configs/')) {
            return { status: 403, statusText: 'Forbidden', data: '' };
        }
        if (opts.url.endsWith('/backup_configs/MissPlayer/')) {
            return { status: 207, statusText: 'Multi-Status', data: '<D:multistatus/>' };
        }
        return { status: 404, statusText: 'Not Found', data: '' };
    };

    await WebDavClient.ensureDirectory({
        url: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass',
        path: '/backup_configs/MissPlayer/'
    });

    assert.deepStrictEqual(requestedPaths, ['http://192.168.1.100:8080/backup_configs/MissPlayer/']);

    WebDavClient.request = origRequest;
    console.log('  ✓ 目标目录优先直探免疫父目录拦截测试通过\n');
}

// 测试 12: 所有候选端点全部失败时，错误需聚合展示各端点的真实报错
{
    console.log('▶ 测试 12: 全端点均失败时暴露全链路详细诊断误差');
    WebDavClient.clearEndpointLease();

    const origRequest = WebDavClient.request;
    WebDavClient.request = async (opts) => {
        if (opts.url.includes('dav.example.com')) {
            throw new Error('WebDAV 请求超时 (3000ms)');
        }
        throw new Error('网络连接失败 (HTTP [0]): 无法访问 http://192.168.1.100:8080');
    };

    let caughtErr = null;
    try {
        await WebDavClient.testConnection({
            url: 'https://dav.example.com:443',
            lanUrl: 'http://192.168.1.100:8080',
            user: 'user',
            pass: 'pass',
            path: '/backup_configs/MissPlayer/'
        });
    } catch (e) {
        caughtErr = e;
    }

    assert(caughtErr !== null, '必须抛出错误');
    assert(caughtErr.message.includes('dav.example.com'), `应包含主地址报错详情: ${caughtErr.message}`);
    assert(caughtErr.message.includes('192.168.1.100:8080'), `应包含备用地址报错详情: ${caughtErr.message}`);

    WebDavClient.request = origRequest;
    console.log('  ✓ 多端点全失败聚合诊断输出测试通过\n');
}

// 测试 13: 统一协议守卫 _davRequest 覆盖 downloadBackup / uploadFile / checkFileExists 遇 HTML/502 无缝切备用
{
    console.log('▶ 测试 13: downloadBackup / uploadFile / checkFileExists 遇 HTML/502 全面切换至 lanUrl');
    const origRequest = WebDavClient.request;

    // 13a. downloadBackup 遇主地址返回 200 HTML 劫持 -> 无缝切备用拿真实 JSON
    WebDavClient.clearEndpointLease();
    WebDavClient.request = async (opts) => {
        if (opts.url.includes('dav.example.com')) {
            return { status: 200, statusText: 'OK', data: '<html><body>Portal</body></html>' };
        }
        return { status: 200, statusText: 'OK', data: JSON.stringify({ markers: { a: 1 } }) };
    };
    const dlRes = await WebDavClient.downloadBackup({
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass'
    }, 'heatmaps/WSP-101.json');
    assert.deepStrictEqual(dlRes, { markers: { a: 1 } });

    // 13b. uploadFile 遇主地址返回 502 Bad Gateway -> 无缝切备用完成上传
    WebDavClient.clearEndpointLease();
    const putTargets = [];
    WebDavClient.request = async (opts) => {
        if (opts.url.includes('dav.example.com')) {
            return { status: 502, statusText: 'Bad Gateway', data: '' };
        }
        putTargets.push(`${opts.method} ${opts.url}`);
        if (opts.method === 'PROPFIND') return { status: 207, statusText: 'Multi-Status', data: '<D:multistatus/>' };
        return { status: 201, statusText: 'Created', data: '' };
    };
    const upRes = await WebDavClient.uploadFile({
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass',
        path: '/MissPlayer/'
    }, 'comments/WSP-101.json', { hello: 'world' });
    assert.strictEqual(upRes.success, true);
    assert(putTargets.some(t => t.includes('PUT http://192.168.1.100:8080/MissPlayer/comments/WSP-101.json')));

    // 13c. checkFileExists 遇主地址 302 重定向 -> 切备用探测返回 true
    WebDavClient.clearEndpointLease();
    WebDavClient.request = async (opts) => {
        if (opts.url.includes('dav.example.com')) {
            return { status: 302, statusText: 'Found', data: '' };
        }
        return { status: 207, statusText: 'Multi-Status', data: '' };
    };
    const existsRes = await WebDavClient.checkFileExists({
        url: 'https://dav.example.com:443',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass'
    }, '/Media/STRM/WSP-101.strm');
    assert.strictEqual(existsRes, true);

    WebDavClient.request = origRequest;
    console.log('  ✓ 全链路子功能统一协议守卫切换测试通过\n');
}

// 测试 14: 中文及非 ASCII 路径 UTF-8 安全百分比编码 (防 Safari / Stay 静默失败且不二次编码)
{
    console.log('▶ 测试 14: 非 ASCII 路径段 UTF-8 百分比安全编码');
    const url1 = WebDavClient.normalizeUrl('http://192.168.1.100:8080', '/我的文件/backup_configs/MissPlayer/');
    assert.strictEqual(url1, 'http://192.168.1.100:8080/%E6%88%91%E7%9A%84%E6%96%87%E4%BB%B6/backup_configs/MissPlayer/');
    const url2 = WebDavClient.normalizeUrl('http://192.168.1.100:8080', '/%E6%88%91%E7%9A%84%E6%96%87%E4%BB%B6/backup_configs/MissPlayer/');
    assert.strictEqual(url2, url1);
    const url3 = WebDavClient.normalizeUrl('http://192.168.1.100:8080', '/MissPlayer/comments/WSP-101.json');
    assert.strictEqual(url3, 'http://192.168.1.100:8080/MissPlayer/comments/WSP-101.json');
    console.log('  ✓ UTF-8 路径百分比编码及防二次编码测试通过\n');
}

// 测试 15: 每 Origin 并发队列限流 (MAX_CONCURRENT_PER_ORIGIN = 2)
{
    console.log('▶ 测试 15: 每 Origin 并发限流 (Max 2 in-flight per origin)');
    const origRaw = WebDavClient._rawRequest;
    let currentActive = 0;
    let peakActive = 0;
    WebDavClient._rawRequest = async () => {
        currentActive++;
        if (currentActive > peakActive) peakActive = currentActive;
        await new Promise(r => setTimeout(r, 25));
        currentActive--;
        return { status: 200, statusText: 'OK', data: '' };
    };

    await Promise.all([1, 2, 3, 4, 5].map(i =>
        WebDavClient.request({ method: 'GET', url: `http://192.168.1.100:8080/file${i}.json` })
    ));
    assert(peakActive <= 2, `单 Origin 峰值并发不可超过 2，实际: ${peakActive}`);
    assert.strictEqual(peakActive, 2, '应充分利用 2 路并发槽位');

    WebDavClient._rawRequest = origRaw;
    console.log('  ✓ 每 Origin 并发限流器测试通过\n');
}

// 测试 16: WebDAV 根目录 MKCOL 405 智能自检诊断 (通用非限定提示 + 识别嵌套子目录)
{
    console.log('▶ 测试 16: WebDAV 根目录 MKCOL 405 智能自检诊断 (通用无品牌绑定 + 嵌套子目录识别)');
    WebDavClient.clearEndpointLease();
    const origRequest = WebDavClient.request;

    // 16a. 根目录仅可见「我的文件」，且目标实际正位于「/我的文件/」下
    WebDavClient.request = async (opts) => {
        const pathname = new URL(opts.url).pathname;
        if (opts.method === 'PROPFIND' && opts.headers?.Depth === '1') {
            if (pathname === '/') {
                return {
                    status: 207,
                    data: `<?xml version="1.0" encoding="utf-8"?>
                    <D:multistatus xmlns:D="DAV:">
                        <D:response><D:href>/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response>
                        <D:response><D:href>/%E6%88%91%E7%9A%84%E6%96%87%E4%BB%B6/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response>
                    </D:multistatus>`
                };
            }
            if (decodeURIComponent(pathname) === '/我的文件/') {
                return {
                    status: 207,
                    data: `<?xml version="1.0" encoding="utf-8"?>
                    <D:multistatus xmlns:D="DAV:">
                        <D:response><D:href>/%E6%88%91%E7%9A%84%E6%96%87%E4%BB%B6/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response>
                        <D:response><D:href>/%E6%88%91%E7%9A%84%E6%96%87%E4%BB%B6/backup_configs/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response>
                    </D:multistatus>`
                };
            }
        }
        if (opts.method === 'PROPFIND') return { status: 404, data: '' };
        if (opts.method === 'MKCOL') return { status: 405, data: '' };
        return { status: 404, data: '' };
    };

    let errNested = null;
    try {
        await WebDavClient.testConnection({
            url: 'https://dav.example.com:443',
            lanUrl: 'http://192.168.1.100:8080',
            user: 'user',
            pass: 'pass',
            path: '/backup_configs/MissPlayer/'
        });
    } catch (e) {
        errNested = e;
    }
    assert(errNested && errNested.message.includes('/我的文件/backup_configs/MissPlayer/'), `应精准提示真实位于 /我的文件/ 下: ${errNested?.message}`);
    const matchCount = (errNested.message.match(/实际位于/g) || []).length;
    assert.strictEqual(matchCount, 1, `相同错误双端点应合并去重展示: ${errNested.message}`);

    // 16b. 根目录可见列表为空 -> 提示通用授权目录检查，不得绑定特定 NAS 品牌名称
    WebDavClient.clearEndpointLease();
    WebDavClient.request = async (opts) => {
        if (opts.method === 'PROPFIND' && opts.headers?.Depth === '1') {
            return {
                status: 207,
                data: `<D:multistatus><D:response><D:href>/</D:href></D:response></D:multistatus>`
            };
        }
        if (opts.method === 'PROPFIND') return { status: 404, data: '' };
        if (opts.method === 'MKCOL') return { status: 405, data: '' };
        return { status: 404, data: '' };
    };
    let errEmpty = null;
    try {
        await WebDavClient.ensureDirectory({
            url: 'http://192.168.1.100:8080',
            user: 'user',
            pass: 'pass',
            path: '/backup_configs/MissPlayer/'
        });
    } catch (e) {
        errEmpty = e;
    }
    assert(errEmpty && errEmpty.message.includes('授权目录'), `空根目录应给出通用授权目录提示: ${errEmpty?.message}`);
    assert(!errEmpty.message.includes('飞牛') && !errEmpty.message.includes('fnOS'), `报错不得限定特定厂商 NAS: ${errEmpty?.message}`);

    WebDavClient.request = origRequest;
    console.log('  ✓ 通用根目录可见性诊断与无厂商绑定测试通过\n');
}

// 测试 17: 无末尾斜杠 PROPFIND 容错匹配
{
    console.log('▶ 测试 17: 无末尾斜杠 PROPFIND 207 容错放行');
    const origRequest = WebDavClient.request;
    WebDavClient.request = async (opts) => {
        if (opts.method === 'PROPFIND' && opts.url.endsWith('/MissPlayer/')) {
            return { status: 404, data: '' };
        }
        if (opts.method === 'PROPFIND' && opts.url.endsWith('/MissPlayer')) {
            return { status: 207, data: '<D:multistatus/>' };
        }
        return { status: 404, data: '' };
    };
    await WebDavClient.ensureDirectory({
        url: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass',
        path: '/MissPlayer/'
    });
    WebDavClient.request = origRequest;
    console.log('  ✓ 无末尾斜杠 PROPFIND 容错放行测试通过\n');
}

// 测试 18: PeachService.getEffectiveWebDavConfig 仅配 lanUrl 也能正常继承模式 A/B
{
    console.log('▶ 测试 18: PeachService 仅配置 lanUrl 时全局识别为有效同步端点');
    const origSync = SyncManager.getWebDavConfig();
    SyncManager.saveWebDavConfig({
        url: '',
        lanUrl: 'http://192.168.1.100:8080',
        user: 'user',
        pass: 'pass',
        path: '/我的文件/MissPlayer/',
        autoSync: true
    });
    PeachService.saveConfig({ webdavMode: 'sync_default' });
    const effective = PeachService.getEffectiveWebDavConfig();
    assert.strictEqual(effective.mode, 'sync_default');
    assert.strictEqual(effective.config.lanUrl, 'http://192.168.1.100:8080');
    assert.strictEqual(effective.targetDir, '/我的文件/MissPlayer/peach-media/');
    SyncManager.saveWebDavConfig(origSync);
    console.log('  ✓ PeachService lanUrl 全局一致性识别测试通过\n');
}

// 测试 19: 修改 WebDAV 地址/用户名时自动清理活跃端点租约
{
    console.log('▶ 测试 19: SyncManager.saveWebDavConfig 端点变更自动清空租约');
    WebDavClient._setActiveEndpoint('https://dav.example.com#user', 'http://192.168.1.100:8080');
    assert.strictEqual(
        WebDavClient._getActiveEndpoint('https://dav.example.com#user'),
        'http://192.168.1.100:8080'
    );
    SyncManager.saveWebDavConfig({
        url: 'https://new.example.com',
        lanUrl: 'http://192.168.1.101:8080',
        user: 'user',
        pass: 'pass',
        path: '/MissPlayer/'
    });
    assert.strictEqual(WebDavClient._getActiveEndpoint('https://dav.example.com#user'), null);
    console.log('  ✓ 配置变更自动清空租约测试通过\n');
}

// 测试 20: 坚果云等纯公网 WebDAV 及公网备用镜像文案中性化
{
    console.log('▶ 测试 20: 坚果云单地址与公网备用地址连接提示中性化');
    WebDavClient.clearEndpointLease();
    const origRequest = WebDavClient.request;

    // 20a. 坚果云单地址直连 -> 不出现多余的「公网域名」或「内网」字样
    WebDavClient.request = async (opts) => {
        if (opts.method === 'PROPFIND') return { status: 207, data: '<D:multistatus/>' };
        if (opts.method === 'GET') return { status: 200, data: '{}' };
        return { status: 200, data: '' };
    };
    const jgyRes = await WebDavClient.testConnection({
        url: 'https://dav.jianguoyun.com/dav/',
        user: 'demo@example.com',
        pass: 'app-pass',
        path: '/MissPlayer/'
    });
    assert.strictEqual(jgyRes.success, true);
    assert(!jgyRes.message.includes('公网') && !jgyRes.message.includes('内网'), `坚果云单地址提示应简洁中性: ${jgyRes.message}`);

    // 20b. 主地址失败切换到公网备用镜像地址 -> 标明「(备用地址)」
    WebDavClient.clearEndpointLease();
    WebDavClient.request = async (opts) => {
        if (opts.url.includes('dav.jianguoyun.com')) {
            return { status: 503, data: '' };
        }
        if (opts.method === 'PROPFIND') return { status: 207, data: '<D:multistatus/>' };
        if (opts.method === 'GET') return { status: 404, data: '' };
        return { status: 200, data: '' };
    };
    const mirrorRes = await WebDavClient.testConnection({
        url: 'https://dav.jianguoyun.com/dav/',
        lanUrl: 'https://backup-dav.example.com/dav/',
        user: 'demo@example.com',
        pass: 'app-pass',
        path: '/MissPlayer/'
    });
    assert.strictEqual(mirrorRes.success, true);
    assert(mirrorRes.message.includes('备用地址'), `非私网备用地址应提示备用地址: ${mirrorRes.message}`);

    WebDavClient.request = origRequest;
    console.log('  ✓ 坚果云单地址与备用镜像提示中性化测试通过\n');
}

console.log('🎉 WebDavClient 全局双地址容灾与协议守卫 20 项单元测试全部通过！\n');
