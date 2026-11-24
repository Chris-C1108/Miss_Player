import assert from 'node:assert';
import fs from 'node:fs';

const storageStore = new Map();
globalThis.localStorage = {
    getItem: (k) => (storageStore.has(k) ? storageStore.get(k) : null),
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};

const { setValue } = await import('../src/utils/storage.js');
const { QualityManager } = await import('../src/userExperienceEnhancer/QualityManager.js');
const {
    UncensoredSwitcher,
    parseMissavVideoPage,
    buildUncensoredCandidateUrls,
    findUncensoredLinkInDocument
} = await import('../src/userExperienceEnhancer/UncensoredSwitcher.js');
const { PlayerState } = await import('../src/player/state/PlayerState.js');
const { SyncManager } = await import('../src/sync/SyncManager.js');

console.log('🧪 开始执行「自动高画质与 MissAV 自动无码切换」单元测试...');

// 1. QualityManager: HLS.js 多清晰度升级 & 影院模式安全保护
{
    storageStore.clear();
    const hls = {
        levels: [
            { height: 480, width: 854, bitrate: 800_000 },
            { height: 1080, width: 1920, bitrate: 4_500_000 },
            { height: 720, width: 1280, bitrate: 2_000_000 }
        ],
        currentLevel: 0,
        nextLevel: 0,
        loadLevel: 0,
        autoLevelCapping: 0,
        media: { paused: false }
    };
    let plyrSetCount = 0;
    const plyr = {
        _q: 480,
        config: { quality: { options: [480, 720, 1080], selected: 480 } },
        get quality() { return this._q; },
        set quality(v) { plyrSetCount++; this._q = v; },
        hls
    };

    globalThis.window = { player: plyr, hls };
    globalThis.document = {
        title: '',
        body: { classList: { contains: () => false } },
        querySelector: () => null,
        querySelectorAll: () => []
    };

    const qm = new QualityManager();
    assert.strictEqual(qm.isAutoQualityEnabled(), true, 'autoHighestQuality 默认应为开启');
    assert.strictEqual(qm.setHighestQualitySingle(), true);
    assert.strictEqual(hls.autoLevelCapping, -1, '应解除 autoLevelCapping 限制');
    assert.strictEqual(hls.nextLevel, 1, '应选中 1080p 索引 1');
    assert.strictEqual(hls.currentLevel, 1, '非影院模式下应立即切换 currentLevel');
    assert.strictEqual(plyr.quality, 1080, 'Plyr 应切换至 1080');
    assert.strictEqual(plyrSetCount, 1);

    // 再次调用不应重复触发 Plyr setter
    qm.setHighestQualitySingle();
    assert.strictEqual(plyrSetCount, 1, '已是最高画质时不应重复赋值 player.quality');

    // 影院模式激活态：后台轮询应直接跳过；显式 applyNow 仅升频 nextLevel 不打断播放
    hls.currentLevel = 0;
    hls.nextLevel = 0;
    globalThis.document.body.classList.contains = (c) => c === 'tm-player-active';
    qm.setHighestQualitySingle({ allowInTheater: false });
    assert.strictEqual(hls.nextLevel, 0, '影院模式下后台轮询不得擅自切流');

    qm.applyNow();
    assert.strictEqual(hls.nextLevel, 1, '用户手动开启时应通过 nextLevel 无缝升频');
    assert.strictEqual(hls.currentLevel, 0, '影院播放期不应强刷 currentLevel 打断播放');
    assert.strictEqual(plyrSetCount, 1, '影院激活期不得调用 Plyr quality setter 重载流');

    // 关闭开关后应返回 false
    setValue('autoHighestQuality', false);
    assert.strictEqual(qm.isAutoQualityEnabled(), false);
    console.log('✅ 1. QualityManager HLS.js / Plyr 最高画质切换与影院保护验证通过');
}

// 2. UncensoredSwitcher: URL 识别与候选构建
{
    assert.ok(parseMissavVideoPage('https://missav.ai/dm84/cn/miaa-490'), '应识别 MissAV 标准详情页');
    assert.ok(parseMissavVideoPage('https://missav.ws/cn/ssis-888-chinese-subtitle'), '应识别 MissAV 备用域名与字幕后缀页');
    assert.ok(parseMissavVideoPage('https://missav.live/cn/abp-123'), '应识别 MissAV 镜像域名');
    assert.strictEqual(parseMissavVideoPage('https://missav.ai/cn/miaa-490-uncensored-leak'), null, '已是无码版页面不得再触发');
    assert.strictEqual(parseMissavVideoPage('https://missav.ai/cn'), null, '语言首页不得触发');
    assert.strictEqual(parseMissavVideoPage('https://missav.ai/search/miaa-490'), null, '搜索页不得触发');
    assert.strictEqual(parseMissavVideoPage('https://jable.tv/videos/miaa-490/'), null, '非 MissAV 站点不得触发');

    const cands = buildUncensoredCandidateUrls('https://missav.ai/dm84/cn/miaa-490-chinese-subtitle?ref=1');
    assert.strictEqual(
        cands[0],
        'https://missav.ai/dm84/cn/miaa-490-uncensored-leak?ref=1',
        '应保留 /dm84/cn/ 与 query，并剥离 -chinese-subtitle 生成无码候选'
    );
    assert.ok(
        cands.includes('https://missav.ai/cn/miaa-490-uncensored-leak?ref=1'),
        '还应包含剥离 /dm84/ 分片后的标准无码候选 URL'
    );
    console.log('✅ 2. UncensoredSwitcher MissAV 路由判定与候选生成验证通过');
}

// 3. UncensoredSwitcher: Tier 1 DOM 匹配、Tier 2 探活与防死循环守卫
{
    const makeStorage = () => {
        const m = new Map();
        return {
            getItem: (k) => (m.has(k) ? m.get(k) : null),
            setItem: (k, v) => m.set(k, String(v))
        };
    };

    // Tier 1: 过滤无关番号链接，精准匹配同番号无码链接
    const mockDoc = {
        body: { classList: { contains: () => false } },
        querySelectorAll: () => [
            { getAttribute: () => '/genres/uncensored' },
            { getAttribute: () => '/cn/abp-123-uncensored-leak' },
            { getAttribute: () => '/cn/miaa-490-uncensored-leak' }
        ]
    };
    const foundDom = findUncensoredLinkInDocument(mockDoc, 'https://missav.ai/cn/miaa-490', 'MIAA-490');
    assert.strictEqual(foundDom, 'https://missav.ai/cn/miaa-490-uncensored-leak', '应精准命中同番号无码链接');

    // checkAndSwitch 执行跳转并写入 sessionStorage 防回跳死循环
    let replacedUrl = null;
    const sess = makeStorage();
    const mockWin = {
        location: {
            href: 'https://missav.ai/cn/miaa-490',
            replace: (u) => { replacedUrl = u; }
        }
    };
    const switcher = new UncensoredSwitcher();
    const res1 = await switcher.checkAndSwitch({ win: mockWin, doc: mockDoc, storage: sess });
    assert.strictEqual(res1.found, true);
    assert.strictEqual(replacedUrl, 'https://missav.ai/cn/miaa-490-uncensored-leak');

    // 同会话再次访问原页不应死循环跳转
    replacedUrl = null;
    const resAgain = await switcher.checkAndSwitch({ win: mockWin, doc: mockDoc, storage: sess });
    assert.strictEqual(resAgain.found, false);
    assert.strictEqual(resAgain.reason, 'already_checked');
    assert.strictEqual(replacedUrl, null);

    // Tier 2: 同源 GET 探活，拒绝软跳转到首页或软 404 HTML
    const emptyDoc = { body: { classList: { contains: () => false } }, querySelectorAll: () => [] };
    const sess2 = makeStorage();
    const mockWin2 = {
        location: {
            href: 'https://missav.ai/cn/ipx-811',
            replace: (u) => { replacedUrl = u; }
        }
    };
    const methodsCalled = [];
    const mockFetch = async (url, opts) => {
        methodsCalled.push(opts.method);
        if (url.includes('ipx-811-uncensored-leak')) {
            return {
                ok: true,
                status: 200,
                url,
                text: async () => '<html><head><title>IPX-811 无码流出</title></head><body>ipx-811</body></html>'
            };
        }
        return { ok: false, status: 404 };
    };
    const res2 = await switcher.checkAndSwitch({
        win: mockWin2,
        doc: emptyDoc,
        fetchFn: mockFetch,
        storage: sess2
    });
    assert.deepStrictEqual(methodsCalled, ['GET']);
    assert.strictEqual(res2.found, true);
    assert.strictEqual(replacedUrl, 'https://missav.ai/cn/ipx-811-uncensored-leak');

    // 软跳转回首页必须拒绝
    const sess3 = makeStorage();
    const softRedirectFetch = async () => ({ ok: true, status: 200, url: 'https://missav.ai/cn' });
    const resSoft = await switcher.checkAndSwitch({
        win: { location: { href: 'https://missav.ai/cn/ssis-100', replace: () => {} } },
        doc: emptyDoc,
        fetchFn: softRedirectFetch,
        storage: sess3
    });
    assert.strictEqual(resSoft.found, false, '软跳转回首页不得误判为存在无码版');

    // 软 404 HTML 页面必须拒绝
    const sess4 = makeStorage();
    const soft404Fetch = async (url) => ({
        ok: true,
        status: 200,
        url,
        text: async () => '<html><head><title>404 Not Found</title></head><body>找不到页面</body></html>'
    });
    const resSoft404 = await switcher.checkAndSwitch({
        win: { location: { href: 'https://missav.ai/cn/ssis-101', replace: () => {} } },
        doc: emptyDoc,
        fetchFn: soft404Fetch,
        storage: sess4
    });
    assert.strictEqual(resSoft404.found, false, '软 404 HTML 页面不得误判为存在无码版');
    console.log('✅ 3. UncensoredSwitcher DOM 匹配、探活降级与防死循环验证通过');
}

// 4. PlayerState / SyncManager / S2PlaybackSection 设置接入验证
{
    storageStore.clear();
    const ps = new PlayerState();
    ps.loadSettings();
    assert.strictEqual(ps.settings.autoHighestQuality, true, 'PlayerState 默认开启 autoHighestQuality');
    assert.strictEqual(ps.settings.autoUncensored, false, 'PlayerState 默认关闭 autoUncensored');

    ps.updateSetting('autoHighestQuality', false);
    ps.updateSetting('autoUncensored', true);
    const gathered = SyncManager.gatherLocalData(ps);
    assert.strictEqual(gathered.settings.autoHighestQuality, false, 'SyncManager 必须收集 autoHighestQuality');
    assert.strictEqual(gathered.settings.autoUncensored, true, 'SyncManager 必须收集 autoUncensored');

    const s2Src = fs.readFileSync('src/player/managers/settings_v2/sections/S2PlaybackSection.js', 'utf8');
    assert.ok(s2Src.includes("'autoHighestQuality'"), 'S2PlaybackSection 必须包含自动画质开关');
    assert.ok(s2Src.includes("'autoUncensored'"), 'S2PlaybackSection 必须包含自动无码开关');
    console.log('✅ 4. 设置状态、云同步与设置菜单挂载验证通过');
}

console.log('🎉 「自动高画质与 MissAV 自动无码切换」所有单元测试全部通过！');
