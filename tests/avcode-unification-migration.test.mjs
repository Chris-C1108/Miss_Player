import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// 模拟浏览器持久化存储环境（GM_* + localStorage + window + document）
const gmStore = new Map();
const lsStore = new Map();

globalThis.GM_getValue = (k, def) => (gmStore.has(k) ? gmStore.get(k) : def);
globalThis.GM_setValue = (k, v) => { gmStore.set(k, v); };
globalThis.GM_deleteValue = (k) => { gmStore.delete(k); };
globalThis.GM_listValues = () => Array.from(gmStore.keys());

globalThis.localStorage = {
    get length() { return lsStore.size; },
    key(i) { return Array.from(lsStore.keys())[i] || null; },
    getItem(k) { return lsStore.has(k) ? lsStore.get(k) : null; },
    setItem(k, v) { lsStore.set(k, String(v)); },
    removeItem(k) { lsStore.delete(k); },
    clear() { lsStore.clear(); }
};

globalThis.window = {
    location: {
        hostname: 'missav.ai',
        href: 'https://missav.ai/dm84/cn/miaa-490',
        pathname: '/dm84/cn/miaa-490'
    },
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {}
};

globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
    }
};

globalThis.document = {
    title: '',
    querySelector() { return null; },
    querySelectorAll() { return []; }
};

const { getVideoCodeFromUrl, matchAvCodeFromText, cleanAvCode, extractMissavShardCode } = await import('../src/utils/videoCode.js');
const { getValue, setValue, deleteValue } = await import('../src/utils/storage.js');
const { PlayerCore } = await import('../src/player/core/PlayerCore.js');
const { SubtitleManager } = await import('../src/player/subtitles/SubtitleManager.js');
const { AvCodeMigrationService } = await import('../src/services/AvCodeMigrationService.js');
const { SyncManager } = await import('../src/sync/SyncManager.js');
const { WebDavClient } = await import('../src/sync/WebDavClient.js');
const { PeachService, PEACH_KEY_ENABLED, PEACH_KEY_WEBDAV_MODE, PEACH_WEBDAV_MODE_SYNC_CUSTOM, PEACH_KEY_WEBDAV_CUSTOM_DIR } = await import('../src/services/PeachService.js');

test('1. 番号识别引擎：/dmXX/cn/ 路由分片、语言前缀与无码后缀变体归一化', () => {
    assert.equal(getVideoCodeFromUrl('https://missav.ai/dm84/cn/miaa-490'), 'MIAA-490');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/dm84/cn/miaa-490-uncensored-leak'), 'MIAA-490');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/dm84/cn/miaa-490-uncensored-leaked'), 'MIAA-490');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/cn/miaa-490'), 'MIAA-490');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/dm84/en/ipx123'), 'IPX-123');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/dm84/cn/dm-339'), 'DM-339');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/cn/dm339'), 'DM-339');
    assert.equal(getVideoCodeFromUrl('https://gateway.example.com/v1/tok/watch/MIAA-490'), 'MIAA-490');

    // 列表/分类非视频页仍严密拦截
    assert.equal(getVideoCodeFromUrl('https://missav.ai/cn/genres/asian-123'), '');
    assert.equal(getVideoCodeFromUrl('https://missav.ai/cn/tags/hot-101'), '');

    // matchAvCodeFromText 直接处理完整 URL / 标题
    assert.equal(matchAvCodeFromText('https://missav.ai/dm84/cn/miaa-490'), 'MIAA-490');
    assert.equal(matchAvCodeFromText('dm339'), 'DM-339');
    assert.equal(cleanAvCode('miaa-490-uncensored-leak'), 'MIAA-490');

    // 分片探测
    assert.equal(extractMissavShardCode('https://missav.ai/dm84/cn/miaa-490'), 'DM-84');
    assert.equal(extractMissavShardCode('https://missav.ai/cn/dm-339'), '');
});

test('2. 统一入口验证：PlayerCore 与所有子系统共享权威番号', () => {
    const core1 = new PlayerCore({});
    core1.targetVideo = {
        tagName: 'VIDEO',
        getAttribute: () => null,
        querySelectorAll: () => [],
        parentElement: null
    };
    window.location.href = 'https://missav.ai/dm84/cn/miaa-490';
    assert.equal(core1.getVideoCode({ refresh: true }), 'MIAA-490');

    window.location.href = 'https://missav.ai/dm84/cn/miaa-490-uncensored-leak';
    assert.equal(core1.getVideoCode({ refresh: true }), 'MIAA-490');

    // SubtitleManager 统一走 playerCore.getVideoCode()
    const subMgr = new SubtitleManager(core1, {}, { commentPanel: { videoCode: '' } });
    assert.equal(subMgr._resolveAvcode(), 'MIAA-490');

    // 静态结构审计：核心模块必须调用 playerCore.getVideoCode
    for (const file of [
        'src/player/controls/CommentPanel.js',
        'src/player/managers/LoopManager.js',
        'src/player/subtitles/SubtitleManager.js',
        'src/player/managers/HeatmapManager.js',
        'src/player/ui/UIManager.js',
        'src/player/CustomVideoPlayer.js'
    ]) {
        const src = fs.readFileSync(file, 'utf8');
        assert.ok(src.includes('playerCore?.getVideoCode') || src.includes('playerCore.getVideoCode'), `${file} 必须接入 PlayerCore.getVideoCode() 统一入口`);
    }
});

test('3. deleteValue 双端清理与本地胶囊/草稿同步迁移', () => {
    gmStore.clear();
    lsStore.clear();

    setValue('tabs_DM-84', [
        { id: 'c1', type: 'highlight', startTime: 120, endTime: 140, comment: 'A', updatedAt: 1000 }
    ]);
    setValue('tabs_MIAA-490-UNCENSORED-LEAK', [
        { id: 'c2', type: 'highlight', startTime: 300, endTime: 320, comment: 'B', updatedAt: 2000 }
    ]);
    setValue('tabs_MIAA-490', [
        { id: 'c1', type: 'highlight', startTime: 120, endTime: 140, comment: 'A_new', updatedAt: 1500 }
    ]);
    setValue('mp_comment_draft_dm-84', '精彩片段草稿');

    // 验证 deleteValue 会同步清理 localStorage 镜像，不再被 getValue 复活
    setValue('tmp_del_test', 'val');
    assert.equal(lsStore.get('mp_tmp_del_test'), 'val');
    deleteValue('tmp_del_test');
    assert.equal(getValue('tmp_del_test', null), null);
    assert.equal(lsStore.has('mp_tmp_del_test'), false);

    const changed = AvCodeMigrationService.migrateLocalTabsAndDraftSync('DM-84', 'MIAA-490');
    assert.equal(changed, true);

    const merged = getValue('tabs_MIAA-490', []);
    assert.equal(merged.length, 2);
    assert.equal(merged[0].comment, 'A_new');
    assert.equal(merged[1].id, 'c2');
    assert.equal(getValue('tabs_DM-84', null), null);
    assert.equal(getValue('tabs_MIAA-490-UNCENSORED-LEAK', null), null);
    assert.equal(getValue('mp_comment_draft_miaa-490', ''), '精彩片段草稿');
    assert.equal(getValue('mp_comment_draft_dm-84', ''), '');
});

test('4. SyncManager 跨端备份自动归一变体与别名键', () => {
    gmStore.clear();
    lsStore.clear();
    AvCodeMigrationService.recordAlias('DM-84', 'MIAA-490');

    const localData = {
        schemaVersion: 2,
        markers: {
            'tabs_MIAA-490': [{ id: 't1', startTime: 10, endTime: 20, updatedAt: 100 }]
        },
        tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
    };
    const remoteData = {
        schemaVersion: 2,
        markers: {
            'tabs_DM-84': [{ id: 't2', startTime: 50, endTime: 60, updatedAt: 200 }],
            'tabs_MIAA-490-UNCENSORED-LEAK': [{ id: 't3', startTime: 90, endTime: 100, updatedAt: 300 }]
        },
        tombstones: { markers: {}, customSeekSteps: {}, videos: {} }
    };

    const merged = SyncManager.mergeData(localData, remoteData, 'client_1');
    assert.equal(merged.markers['tabs_MIAA-490'].length, 3);
    assert.deepEqual(merged.markers['tabs_DM-84'], []);
    assert.deepEqual(merged.markers['tabs_MIAA-490-UNCENSORED-LEAK'], []);
});

test('5. WebDAV 字幕 / 热度 / STRM 与全链路迁移', async () => {
    gmStore.clear();
    lsStore.clear();

    // 配置 Sync WebDAV + Peach STRM 自定义目录
    setValue('mp_webdav_config', { url: 'https://dav.example.com', user: 'u', pass: 'p', path: '/MissPlayer/' });
    setValue(PEACH_KEY_ENABLED, true);
    setValue('mp_peach_base', 'https://peach.example.com');
    setValue('mp_peach_token', 'tok_123');
    setValue(PEACH_KEY_WEBDAV_MODE, PEACH_WEBDAV_MODE_SYNC_CUSTOM);
    setValue(PEACH_KEY_WEBDAV_CUSTOM_DIR, '/Media/STRM/');

    const files = new Map([
        ['/MissPlayer/heatmaps/DM-84.json', { avcode: 'DM-84', duration: 7200, binSeconds: 5, bins: [3, 0, 8] }],
        ['/MissPlayer/heatmaps/MIAA-490.json', { avcode: 'MIAA-490', duration: 7200, binSeconds: 5, bins: [1, 5, 2] }],
        ['/MissPlayer/comments/DM-84.json', { avcode: 'DM-84', comments: [] }],
        ['/Media/STRM/DM-84.strm', 'https://gw.example.com/v1/tok/play/DM-84\n# avcode: DM-84\n# source: https://missav.ai/dm84/cn/miaa-490\n'],
        ['/Media/STRM/_index.json', JSON.stringify({
            code: 'DM-84',
            activeId: 'sub1',
            favoriteId: 'sub1',
            updatedAt: 1000,
            items: [
                { id: 'sub1', title: 'MIAA-490 中文字幕', provider: 'xunlei', format: 'srt', lang: 'zh', file: 'DM-84.zh.abc.srt', favorite: true, addedAt: 1000 }
            ]
        })],
        ['/Media/STRM/DM-84.zh.abc.srt', '1\n00:00:01,000 --> 00:00:03,000\n你好\n']
    ]);

    const origDownload = WebDavClient.downloadFile;
    const origUpload = WebDavClient.uploadFile;
    const origExists = WebDavClient.checkFileExists;
    const origDelete = WebDavClient.deleteFile;
    const origScan = PeachService.triggerScan;

    const fullPathOf = (cfg, sub) => {
        const base = String(cfg?.path || '/MissPlayer/').replace(/\/+$/, '');
        const rel = String(sub || '').replace(/^\/+/, '');
        return rel.startsWith(base.replace(/^\//, '') + '/') ? `/${rel}` : `${base}/${rel}`;
    };

    WebDavClient.downloadFile = async (cfg, sub) => files.get(fullPathOf(cfg, sub)) ?? null;
    WebDavClient.uploadFile = async (cfg, sub, content) => {
        files.set(fullPathOf(cfg, sub), content);
        return { success: true, status: 201 };
    };
    WebDavClient.checkFileExists = async (cfg, p) => files.has(p.startsWith('/') ? p : `/${p}`);
    WebDavClient.deleteFile = async (cfg, sub) => {
        files.delete(fullPathOf(cfg, sub));
        return true;
    };
    let scanCalled = false;
    PeachService.triggerScan = async () => { scanCalled = true; return { ok: true }; };

    try {
        const changed = await AvCodeMigrationService.migrateCurrentPageIfNeeded(
            'https://missav.ai/dm84/cn/miaa-490',
            'MIAA-490',
            { duration: 7200 }
        );
        assert.equal(changed, true);

        // 热度 Element-wise Max 合并并删除 DM-84.json
        assert.equal(files.has('/MissPlayer/heatmaps/DM-84.json'), false);
        assert.deepEqual(files.get('/MissPlayer/heatmaps/MIAA-490.json').bins, [3, 5, 8]);

        // 空 DM-84 评论文件清理
        assert.equal(files.has('/MissPlayer/comments/DM-84.json'), false);

        // Peach STRM 重写迁移并触发扫描
        assert.equal(files.has('/Media/STRM/DM-84.strm'), false);
        const newStrm = files.get('/Media/STRM/MIAA-490.strm');
        assert.ok(newStrm.includes('/play/MIAA-490'));
        assert.ok(newStrm.includes('# avcode: MIAA-490'));
        assert.equal(scanCalled, true);

        // 旧字幕正文文件清理
        assert.equal(files.has('/Media/STRM/DM-84.zh.abc.srt'), false);
    } finally {
        WebDavClient.downloadFile = origDownload;
        WebDavClient.uploadFile = origUpload;
        WebDavClient.checkFileExists = origExists;
        WebDavClient.deleteFile = origDelete;
        PeachService.triggerScan = origScan;
    }
});
