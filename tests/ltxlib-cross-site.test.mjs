import assert from 'assert';

const storageStore = new Map();
const gmStore = new Map();

globalThis.localStorage = {
    getItem: (k) => (storageStore.has(k) ? storageStore.get(k) : null),
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};
globalThis.GM_getValue = (k, def) => (gmStore.has(k) ? gmStore.get(k) : def);
globalThis.GM_setValue = (k, v) => { gmStore.set(k, v); };
globalThis.window = globalThis.window || { location: { hostname: 'ltxlib.dpdns.org', href: 'https://ltxlib.dpdns.org/' } };

import {
    CrossSitePlayRouter,
    isEquivalentAvCode,
    CROSS_SITE_HANDOFF_KEY
} from '../src/services/CrossSitePlayRouter.js';
import { LtxLibAdapter } from '../src/adapters/LtxLibAdapter.js';
import { PeachService } from '../src/services/PeachService.js';

console.log('🧪 开始执行 ltxlib 跨站播放双轨路由与适配器单元测试...');

// 1. 番号等价性与防子串假阳性
assert.strictEqual(isEquivalentAvCode('WSP-101', '/cn/v/wsp-101-uncensored-leaked'), true);
assert.strictEqual(isEquivalentAvCode('WSP-101', '/cn/v/wsp-1010'), false);
assert.strictEqual(isEquivalentAvCode('IPX-811', 'ipx0811'), true);
assert.strictEqual(isEquivalentAvCode('IPX-811', 'ipx-0811'), true);
assert.strictEqual(isEquivalentAvCode('IPX-811', 'ipx-812'), false);
assert.strictEqual(isEquivalentAvCode('FC2-PPV-2849102', '2849102'), true);
console.log('✅ 1. isEquivalentAvCode 等价匹配与防子串误判测试通过');

// 2. 轨道 A：网关同源影院页 URL 构建（meta 进 hash，不进 query/path）
PeachService.saveConfig({
    gatewayBase: 'http://192.168.2.250:8765/',
    gatewayToken: 'tok_abc'
});
const watchUrl = CrossSitePlayRouter.buildGatewayWatchUrl(
    { base: 'http://192.168.2.250:8765', token: 'tok_abc' },
    'ipx-811',
    { sourceId: '123av', title: 'Test Title', poster: 'https://pics.dmm.co.jp/test.jpg' }
);
assert.ok(watchUrl.startsWith('http://192.168.2.250:8765/v1/tok_abc/watch/IPX-811?src=123av#'));
assert.ok(watchUrl.includes('title=Test+Title') || watchUrl.includes('title=Test%20Title'));
assert.ok(watchUrl.includes('poster=https'));
console.log('✅ 2. 轨道 A 网关同源影院页 URL 构建测试通过');

// 3. 轨道 B：123AV / JAVVerse / Jable / MissAV 轻量探活 + CF 熔断
const mockTransport = async (url) => {
    if (url.includes('123av.com/cn/v/ipx-811-uncensored-leaked')) {
        return { status: 200, html: '<iframe src="https://javplayer.me/e/xyz999"></iframe>', finalUrl: url };
    }
    if (url.includes('javverse.com/en/search')) {
        return {
            status: 200,
            html: '<div class="card"><a href="/work/45678">STARS-256 经典</a></div>',
            finalUrl: url
        };
    }
    if (url.includes('jable.tv/videos/cawd-243/')) {
        return { status: 200, html: '<script>var hlsUrl = "https://cdn.example/cawd.m3u8";</script>', finalUrl: url };
    }
    if (url.includes('missav')) {
        return { status: 403, html: 'Just a moment... cf-challenge', finalUrl: url };
    }
    return { status: 404, html: '', finalUrl: url };
};

const r123 = await CrossSitePlayRouter.probe123Av('IPX-811', mockTransport);
assert.strictEqual(r123.sourceId, '123av');
assert.ok(r123.sourceName.includes('无码流出'));

const rJv = await CrossSitePlayRouter.probeJavVerse('STARS-256', mockTransport);
assert.strictEqual(rJv.url, 'https://javverse.com/work/45678');

const rJable = await CrossSitePlayRouter.probeJable('CAWD-243', mockTransport);
assert.strictEqual(rJable.sourceId, 'jable');

const rMissBlocked = await CrossSitePlayRouter.probeMissAv('SSIS-001', mockTransport, { allowDirectFallback: false });
assert.strictEqual(rMissBlocked, null);
console.log('✅ 3. 轨道 B 四源轻量探活与 MissAV Cloudflare 熔断测试通过');

// 4. 跨站 60s 一次性租约消费语义
CrossSitePlayRouter.writeHandoffLease({
    code: 'IPX-811',
    source: '123AV (无码流出)',
    targetUrl: 'https://123av.com/cn/v/ipx-811-uncensored-leaked'
});
// 非目标站点不消费
assert.strictEqual(CrossSitePlayRouter.consumeHandoffLease('example.com'), null);
// 目标站点一次消费即清
const consumed = CrossSitePlayRouter.consumeHandoffLease('123av.com');
assert.strictEqual(consumed.code, 'IPX-811');
assert.strictEqual(CrossSitePlayRouter.consumeHandoffLease('123av.com'), null);
console.log('✅ 4. 跨站 60s 一次性接力租约测试通过');

// 5. LtxLibAdapter Vue 3 DOM 原地复用防串号测试
let currentCode = 'IPX-811';
let currentTitle = 'First Title';
const fakeCard = {
    getAttribute: (name) => (name === 'data-code' ? currentCode : ''),
    dataset: { code: 'IPX-811' },
    querySelector: (sel) => {
        if (sel.includes('title')) return { textContent: currentTitle };
        if (sel.includes('img')) return { getAttribute: () => 'https://pics.dmm.co.jp/a.jpg' };
        return null;
    }
};
assert.strictEqual(LtxLibAdapter.extractCardMeta(fakeCard).code, 'IPX-811');
// 模拟 Vue 原地更新同一 card 节点
currentCode = 'ABW-087';
fakeCard.dataset.code = 'ABW-087';
currentTitle = 'Second Title';
const metaAfterReuse = LtxLibAdapter.extractCardMeta(fakeCard);
assert.strictEqual(metaAfterReuse.code, 'ABW-087');
assert.strictEqual(metaAfterReuse.title, 'Second Title');
console.log('✅ 5. LtxLibAdapter Vue 3 节点原地复用实时读取测试通过');

console.log('🎉 全部 5 项 ltxlib 跨站播放测试 100% 通过！');
