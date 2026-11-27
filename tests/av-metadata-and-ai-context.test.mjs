import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const storageMap = new Map();
globalThis.localStorage = {
    getItem(k) { return storageMap.has(k) ? storageMap.get(k) : null; },
    setItem(k, v) { storageMap.set(k, String(v)); },
    removeItem(k) { storageMap.delete(k); },
    clear() { storageMap.clear(); }
};

globalThis.window = {
    location: {
        hostname: 'missav.ws',
        href: 'https://missav.ws/cn/focs-264'
    }
};

let gmResponder = null;
let gmCalls = [];
globalThis.GM_xmlhttpRequest = (opts) => {
    gmCalls.push({ method: opts.method, url: opts.url, headers: opts.headers || {}, data: opts.data });
    if (typeof gmResponder === 'function') {
        queueMicrotask(() => gmResponder(opts));
    } else {
        queueMicrotask(() => opts.onload?.({ status: 404, responseText: '', finalUrl: opts.url }));
    }
    return { abort: () => {} };
};

const {
    AvMetadataService,
    extractMetadataFromDocument,
    parseJavBusDetailHtml,
    parseJavDbDetailHtml,
    parseFc2HubDetailHtml,
    mergeAvMetadata,
    formatMetadataForLlm,
    isFc2OrUncensoredCode
} = await import('../src/services/AvMetadataService.js');

const { LlmService, LlmCache, LLM_KEY_CACHE_EPOCH, sanitizeDebugDir } = await import('../src/services/LlmService.js');
const { AiDebugLogger } = await import('../src/services/AiDebugLogger.js');
const {
    AI_PROMPT_VERSION,
    buildVersionedTaskHash,
    compressCuesForLlm,
    analyzeSubtitleChaptersWithLlm,
    summarizeCommentsWithLlm,
    buildHighlightGraphWithLlm,
    autoTagMarkerWithLlm
} = await import('../src/services/LlmTasks.js');
const { selectBestQualityCandidate, scoreSubtitleQuality } = await import('../src/player/subtitles/SubtitleQualityScorer.js');
const { parseSubtitles } = await import('../src/player/subtitles/SubtitleFormat.js');
const { fetchJavdbMovieId, JAVDB_DOMAINS } = await import('../src/player/comments/providers/JavDbCommentProvider.js');
const { SyncManager } = await import('../src/sync/SyncManager.js');
const { SubtitleRepository } = await import('../src/player/subtitles/SubtitleRepository.js');
const {
    AiBatchTestRunner,
    parseBatchCodes,
    loadSavedBatchText,
    saveBatchText
} = await import('../src/services/AiBatchTestRunner.js');

function resetAll() {
    storageMap.clear();
    gmCalls = [];
    gmResponder = null;
    LlmCache.clearMemoryCache();
    AvMetadataService.clearMemoryCache();
    AiDebugLogger.resetForTests();
}

describe('AvMetadataService: DOM Extraction, Multi-Site Routing & Rate Limit', () => {
    beforeEach(resetAll);

    it('detects FC2/uncensored codes vs commercial codes accurately', () => {
        assert.equal(isFc2OrUncensoredCode('FC2-PPV-4512345'), true);
        assert.equal(isFc2OrUncensoredCode('FC2-4512345'), true);
        assert.equal(isFc2OrUncensoredCode('101223-001'), true);
        assert.equal(isFc2OrUncensoredCode('HEYZO-3210'), true);
        assert.equal(isFc2OrUncensoredCode('FOCS-264'), false);
        assert.equal(isFc2OrUncensoredCode('MIAA-490'), false);
    });

    it('extracts MissAV / Jable DOM metadata cleanly and rejects mismatched pages', () => {
        const fakeMissavDoc = {
            location: { href: 'https://missav.ws/cn/focs-264', hostname: 'missav.ws' },
            title: 'FOCS-264 痴女老板的办公室诱惑 - MissAV',
            querySelector(sel) {
                if (sel === 'h1') return { textContent: 'FOCS-264 痴女老板的办公室诱惑' };
                if (sel.includes('meta[name="description"]')) return { getAttribute: () => '新入职男下属被女上司留下加班的办公室故事。' };
                if (sel.includes('/makers/')) return { textContent: 'Fitch' };
                if (sel.includes('/series/')) return { textContent: '办公窒诱惑' };
                if (sel.includes('time[')) return { getAttribute: () => '2025-09-12', textContent: '' };
                return null;
            },
            querySelectorAll(sel) {
                if (sel.includes('/actresses/')) return [{ textContent: '沙月恵奈' }];
                if (sel.includes('/genres/')) return [{ textContent: '丝袜' }, { textContent: 'OL' }];
                return [];
            }
        };

        const meta = extractMetadataFromDocument(fakeMissavDoc, 'FOCS-264', 'missav.ws');
        assert.equal(meta.avcode, 'FOCS-264');
        assert.equal(meta.title, '痴女老板的办公室诱惑');
        assert.deepEqual(meta.actresses, ['沙月恵奈']);
        assert.deepEqual(meta.tags, ['丝袜', 'OL']);
        assert.equal(meta.studio, 'Fitch');
        assert.equal(meta.series, '办公窒诱惑');
        assert.equal(meta.releaseDate, '2025-09-12');
        assert.ok(meta.synopsis.includes('女上司'));

        const formatted = formatMetadataForLlm(meta);
        assert.ok(formatted.includes('沙月恵奈'));
        assert.ok(formatted.includes('丝袜 / OL'));

        // List/homepage without FOCS-264 must be rejected
        const wrongDoc = {
            location: { href: 'https://missav.ws/cn', hostname: 'missav.ws' },
            title: 'MissAV 首页',
            querySelector: () => null,
            querySelectorAll: () => []
        };
        assert.equal(extractMetadataFromDocument(wrongDoc, 'FOCS-264', 'missav.ws'), null);
    });

    it('parses JavBus, JavDB (.female filter), and FC2HUB HTML via DOMParser shim', () => {
        const prevDomParser = globalThis.DOMParser;
        globalThis.DOMParser = class {
            parseFromString(html) {
                const str = String(html);
                return {
                    title: (str.match(/<title>([^<]*)<\/title>/i) || [])[1] || '',
                    body: { textContent: str.replace(/<[^>]+>/g, ' ') },
                    querySelector(sel) {
                        if (sel === 'h3' || sel.includes('h2.title') || sel.includes('.fc2-title')) {
                            const m = str.match(/<(?:h3|h2|h1)[^>]*>([\s\S]*?)<\/(?:h3|h2|h1)>/i);
                            return m ? { textContent: m[1].replace(/<[^>]+>/g, ' ').trim() } : null;
                        }
                        if (sel.includes('keywords')) {
                            const m = str.match(/name="keywords"\s+content="([^"]+)"/i);
                            return m ? { getAttribute: () => m[1] } : null;
                        }
                        if (sel.includes('published_time')) {
                            const m = str.match(/property="videos:published_time"\s+content="([^"]+)"/i);
                            return m ? { getAttribute: () => m[1] } : null;
                        }
                        return null;
                    },
                    querySelectorAll(sel) {
                        if (sel.includes('.star-name a')) {
                            return [...str.matchAll(/class="star-name"[^>]*><a[^>]*>([^<]+)<\/a>/gi)]
                                .map((m) => ({ textContent: m[1] }));
                        }
                        if (sel.includes('input[name="gr_sel"]')) {
                            return [...str.matchAll(/name="gr_sel"[^>]*><a[^>]*>([^<]+)<\/a>/gi)]
                                .map((m) => ({ nextSibling: { textContent: m[1] } }));
                        }
                        if (sel.includes('.info p')) {
                            return [...str.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
                                .map((m) => ({ textContent: m[1].replace(/<[^>]+>/g, ' '), parentElement: null }));
                        }
                        if (sel.includes('.panel-block')) {
                            const blocks = [];
                            for (const bm of str.matchAll(/<div class="panel-block">([\s\S]*?)<\/div>/gi)) {
                                const inner = bm[1];
                                const label = (inner.match(/<strong>([^<]*)<\/strong>/i) || [])[1] || '';
                                const links = [...inner.matchAll(/<a[^>]*>([^<]+)<\/a>(?:<strong class="symbol (female|male)"><\/strong>)?/gi)]
                                    .map((am) => ({
                                        textContent: am[1],
                                        nextElementSibling: am[2]
                                            ? { classList: { contains: (c) => c === am[2] } }
                                            : null
                                    }));
                                blocks.push({
                                    textContent: inner.replace(/<[^>]+>/g, ' '),
                                    querySelector: (s) => (s === 'strong' ? { textContent: label } : links[0] || null),
                                    querySelectorAll: () => links,
                                    lastElementChild: { textContent: links.map((l) => l.textContent).join(' ') }
                                });
                            }
                            return blocks;
                        }
                        return [];
                    }
                };
            }
        };

        try {
            const busMeta = parseJavBusDetailHtml(`
                <h3>MIAA-490 黑丝诱惑全集</h3>
                <div class="info">
                    <p><span>發行日期:</span> 2024-03-10</p>
                    <p><span>製作商:</span> MOODYZ</p>
                    <p><span>系列:</span> 职场丝袜</p>
                </div>
                <span class="star-name"><a href="#">水卜さくら</a></span>
                <input name="gr_sel"><a href="#">丝袜</a>
                <input name="gr_sel"><a href="#">单人作品</a>
            `, 'MIAA-490');
            assert.equal(busMeta.title, '黑丝诱惑全集');
            assert.deepEqual(busMeta.actresses, ['水卜さくら']);
            assert.deepEqual(busMeta.tags, ['丝袜', '单人作品']);
            assert.equal(busMeta.studio, 'MOODYZ');
            assert.equal(busMeta.series, '职场丝袜');
            assert.equal(busMeta.releaseDate, '2024-03-10');

            const dbMeta = parseJavDbDetailHtml(`
                <h2><strong>SSIS-111</strong> 测试标题</h2>
                <div class="panel-block"><strong>日期:</strong> 2024-06-01</div>
                <div class="panel-block"><strong>片商:</strong> <a href="#">S1</a></div>
                <div class="panel-block"><strong>類別:</strong> <a href="#">巨乳</a><a href="#">单体</a></div>
                <div class="panel-block"><strong>演員:</strong> <a href="#">河北彩花</a><strong class="symbol female"></strong><a href="#">结城结弦</a><strong class="symbol male"></strong></div>
            `, 'SSIS-111');
            assert.deepEqual(dbMeta.actresses, ['河北彩花'], '男优应被 .female 过滤逻辑排除');
            assert.deepEqual(dbMeta.tags, ['巨乳', '单体']);
            assert.equal(dbMeta.studio, 'S1');

            const fc2Meta = parseFc2HubDetailHtml(`
                <h1 class="fc2-title">FC2-PPV-4512345 清纯校服少女</h1>
                <meta name="keywords" content="FC2,4512345,制服,中出">
                <meta property="videos:published_time" content="2025-01-15T00:00:00Z">
            `, 'FC2-PPV-4512345');
            assert.equal(fc2Meta.title, '清纯校服少女');
            assert.deepEqual(fc2Meta.tags, ['FC2', '制服', '中出']);
            assert.equal(fc2Meta.releaseDate, '2025-01-15');
        } finally {
            globalThis.DOMParser = prevDomParser;
        }
    });

    it('routes missing metadata cleanly to JavBus/JavDB API and respects timeout fallback', async () => {
        const prevDoc = globalThis.document;
        globalThis.document = undefined;
        try {
            gmResponder = (opts) => {
                if (opts.url.includes('javbus.com')) {
                    opts.onload({ status: 404, responseText: 'Not Found', finalUrl: opts.url });
                    return;
                }
                if (opts.url.includes('/v2/search')) {
                    opts.onload({
                        status: 200,
                        responseText: JSON.stringify({ data: { movies: [{ id: 'db-999' }] } }),
                        finalUrl: opts.url
                    });
                    return;
                }
                if (opts.url.includes('/v1/movies/db-999')) {
                    opts.onload({
                        status: 200,
                        responseText: JSON.stringify({
                            data: {
                                movie: {
                                    title: 'ABP-888 办公室绝顶企划',
                                    actors: [
                                        { name: '凉森玲梦', gender: 'female' },
                                        { name: '男优A', gender: 'male' }
                                    ],
                                    tags: [{ name: 'OL' }, { name: '黑丝' }],
                                    maker_name: 'Prestige',
                                    release_date: '2024-08-08'
                                }
                            }
                        }),
                        finalUrl: opts.url
                    });
                    return;
                }
                opts.onload({ status: 404, responseText: '', finalUrl: opts.url });
            };

            const meta = await AvMetadataService.getMetadata('ABP-888');
            assert.equal(meta.title, '办公室绝顶企划');
            assert.deepEqual(meta.actresses, ['凉森玲梦']);
            assert.deepEqual(meta.tags, ['OL', '黑丝']);
            assert.equal(meta.studio, 'Prestige');
        } finally {
            globalThis.document = prevDoc;
        }
    });
});

describe('AI Cache Versioning, Epoch Clear, Dense Subtitle Sampling & MT Comparison', () => {
    beforeEach(resetAll);

    it('invalidates stale memory & WebDAV caches when clearAll refreshes cache epoch', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-epoch'
        });

        // Pre-seed WebDAV with an old entry BEFORE epoch clear
        const oldUpdatedAt = Date.now() - 10000;
        const hash = buildVersionedTaskHash('sub_chapters', 'old-sub');
        let davDownloads = 0;
        const origGetWebDav = SyncManager.getWebDavConfig;
        SyncManager.getWebDavConfig = () => ({ url: 'https://dav.example.com/dav/', username: 'u', password: 'p' });
        gmResponder = (opts) => {
            if (opts.method === 'GET' && opts.url.includes('ai-cache/MIAA-100.json')) {
                davDownloads += 1;
                opts.onload({
                    status: 200,
                    responseText: JSON.stringify({
                        sub_chapters: { hash, data: { chapters: [{ seconds: 10, tag: '旧缓存', headline: 'old' }] }, updatedAt: oldUpdatedAt }
                    }),
                    finalUrl: opts.url
                });
                return;
            }
            opts.onload({ status: 404, responseText: '', finalUrl: opts.url });
        };

        try {
            // Epoch = 0: hits WebDAV backfill cleanly
            const beforeClear = await LlmCache.getCached('MIAA-100', 'sub_chapters', hash);
            assert.equal(beforeClear.hit, true);
            assert.equal(davDownloads, 1);

            // User clicks 清空 AI 缓存
            const clearRes = await LlmCache.clearAll();
            assert.ok(clearRes.epoch > oldUpdatedAt);
            assert.ok(LlmCache.getCacheEpoch() >= clearRes.epoch);

            // Now WebDAV still returns oldUpdatedAt (< epoch) -> MUST MISS!
            const afterClear = await LlmCache.getCached('MIAA-100', 'sub_chapters', hash);
            assert.equal(afterClear.hit, false);
        } finally {
            SyncManager.getWebDavConfig = origGetWebDav;
        }
    });

    it('hashes change automatically when model switches and metadata injects into prompts + forceRefresh bypasses cache', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-hash'
        });
        const flashHash = buildVersionedTaskHash('sub_chapters', 'same-payload');
        LlmService.saveConfig({ model: 'agnes-3.0-pro' });
        const proHash = buildVersionedTaskHash('sub_chapters', 'same-payload');
        assert.notEqual(flashHash, proHash);
        assert.ok(AI_PROMPT_VERSION.startsWith('v3'));

        let apiCount = 0;
        let lastUserPrompt = '';
        gmResponder = (opts) => {
            apiCount += 1;
            const body = JSON.parse(opts.data);
            lastUserPrompt = body.messages[1].content;
            opts.onload({
                status: 200,
                finalUrl: opts.url,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                summary: '职场反差剧情',
                                chapters: [{ seconds: 30, tag: '诱惑', headline: '丝袜高能开启' }]
                            })
                        }
                    }]
                })
            });
        };

        const cues = [{ start: 28, end: 35, text: '快把丝袜脱下来让我看看' }];
        const metadata = mergeAvMetadata({
            avcode: 'FOCS-264',
            title: '女上司丝袜教育',
            actresses: ['沙月恵奈'],
            tags: ['黑丝', 'OL']
        });

        const r1 = await analyzeSubtitleChaptersWithLlm({ avcode: 'FOCS-264', cues, metadata });
        assert.equal(r1.ok, true);
        assert.equal(apiCount, 1);
        assert.ok(lastUserPrompt.includes('沙月恵奈'));
        assert.ok(lastUserPrompt.includes('黑丝 / OL'));

        const r2 = await analyzeSubtitleChaptersWithLlm({ avcode: 'FOCS-264', cues, metadata });
        assert.equal(r2.fromCache, true);
        assert.equal(apiCount, 1);

        // forceRefresh bypasses cache!
        const r3 = await analyzeSubtitleChaptersWithLlm({ avcode: 'FOCS-264', cues, metadata, forceRefresh: true });
        assert.equal(r3.fromCache, false);
        assert.equal(apiCount, 2);

        // Verify metadata injection works for summarizeCommentsWithLlm, buildHighlightGraphWithLlm & autoTagMarkerWithLlm too
        await autoTagMarkerWithLlm({ avcode: 'FOCS-264', startTime: 30, cues, metadata });
        assert.ok(lastUserPrompt.includes('沙月恵奈'));
        await summarizeCommentsWithLlm({ avcode: 'FOCS-264', comments: [{ text: '12:00 非常推荐的片段' }], metadata });
        await buildHighlightGraphWithLlm({ avcode: 'FOCS-264', cues, comments: [{ id: 'c1', text: '绝了' }], metadata });
    });

    it('prioritizes high-density plot dialogue over pure moan fillers when cues exceed maxChars', () => {
        const cues = [];
        for (let i = 0; i < 60; i++) {
            const start = i * 25;
            if (i === 18) {
                cues.push({ start, end: start + 5, text: '快把黑丝脱下来，社长正在门口看着呢别出声' });
            } else if (i === 42) {
                cues.push({ start, end: start + 5, text: '全部内射进去吧，对不起老公我忍不住了' });
            } else {
                cues.push({ start, end: start + 3, text: i % 2 === 0 ? '嗯啊…呀' : `日常闲聊对话第 ${i} 句废话填充` });
            }
        }
        const compressed = compressCuesForLlm(cues, { maxChars: 240 });
        assert.ok(compressed.length <= 240);
        assert.ok(compressed.includes('黑丝脱下来') || compressed.includes('内射进去'), '高密度剧情台词应在严格字数预算下优先被保留');
    });

    it('ranks direct JA->ZH machine translation above 2-hop EN->ZH in selectBestQualityCandidate', () => {
        const picked = selectBestQualityCandidate([
            {
                item: { id: 'en-pivot', machineTranslated: true, originLang: 'en' },
                parsed: { cues: [{ start: 1, text: 'a' }] },
                quality: { grade: 'medium', sqi: 76 }
            },
            {
                item: { id: 'ja-direct', machineTranslated: true, originLang: 'ja' },
                parsed: { cues: [{ start: 1, text: 'b' }] },
                quality: { grade: 'medium', sqi: 72 }
            }
        ]);
        assert.equal(picked.item.id, 'ja-direct');

        const complianceFiles = ['src/services/AvMetadataService.js', 'src/services/LlmService.js', 'src/services/LlmTasks.js', 'src/services/AiDebugLogger.js'];
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
        for (const rel of complianceFiles) {
            const content = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
            assert.equal(/style\s*=\s*["'`][^"'`]*["'`]/i.test(content), false, `${rel} 不得含内联 style`);
            assert.equal(content.includes('!important'), false, `${rel} 不得含 !important`);
            assert.equal(emojiRegex.test(content), false, `${rel} 不得含 Emoji`);
        }
    });
});

describe('AiDebugLogger: Context Readiness, AI I/O Capture, Redaction & WebDAV Dir Upload', () => {
    beforeEach(resetAll);

    it('sanitizes WebDAV debug directory paths and prevents traversal', () => {
        assert.equal(sanitizeDebugDir(''), 'logs/ai-debug');
        assert.equal(sanitizeDebugDir('/ai/custom-dir/'), 'ai/custom-dir');
        assert.equal(sanitizeDebugDir('../secrets/../ai-logs//run1/'), 'secrets/ai-logs/run1');
    });

    it('captures readiness + redacted AI inputs/outputs and uploads JSON to custom WebDAV dir', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-super-secret-debug-key',
            aiDebugEnabled: true,
            aiDebugDir: '/ai-diag/round-1/'
        });

        SyncManager.saveWebDavConfig({
            url: 'https://dav.example.com/dav/',
            lanUrl: '',
            user: 'tester',
            pass: 'dav-pass',
            path: '/MissPlayer/',
            autoSync: true
        });

        const uploadedPayloads = [];
        gmResponder = (opts) => {
            if (opts.url.includes('/chat/completions')) {
                opts.onload({
                    status: 200,
                    finalUrl: opts.url,
                    responseText: JSON.stringify({
                        model: 'agnes-3.0-flash',
                        usage: { prompt_tokens: 120, completion_tokens: 45 },
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    summary: '办公室对白反转，密钥泄漏测试 sk-super-secret-debug-key',
                                    chapters: [{ seconds: 42, tag: '反转', headline: '剧情展开' }]
                                })
                            }
                        }]
                    })
                });
                return;
            }
            if (opts.method === 'PROPFIND' || opts.method === 'MKCOL') {
                opts.onload({ status: opts.method === 'PROPFIND' ? 207 : 201, responseText: '', finalUrl: opts.url });
                return;
            }
            if (opts.method === 'PUT' && opts.url.includes('/MissPlayer/ai-diag/round-1/')) {
                uploadedPayloads.push({
                    url: opts.url,
                    body: JSON.parse(opts.data)
                });
                opts.onload({ status: 201, responseText: '', finalUrl: opts.url });
                return;
            }
            opts.onload({ status: 404, responseText: '', finalUrl: opts.url });
        };

        AiDebugLogger.recordMetadataState('FOCS-264', {
            tier: 'l2_remote',
            ok: true,
            durationMs: 210,
            actressesCount: 1,
            tagsCount: 3
        });
        AiDebugLogger.recordSubtitleState('FOCS-264', 'autoPick', {
            durationMs: 430,
            pickedOk: true,
            evaluated: [{ id: 'sub-1', lang: 'zh', sqi: 86 }]
        });
        AiDebugLogger.recordCommentsState('FOCS-264', 'waitGate', {
            totalWaitMs: 320,
            backfillTriggered: false,
            afterCount: 18,
            subCuesReadyCount: 24
        });

        await analyzeSubtitleChaptersWithLlm({
            avcode: 'FOCS-264',
            cues: [{ start: 40, end: 46, text: '欢迎来到分部办公室，先坐下来喝杯茶' }],
            metadata: mergeAvMetadata({ avcode: 'FOCS-264', actresses: ['沙月恵奈'], tags: ['黑丝'] })
        });

        // Force flush to guarantee PUT completes cleanly
        const flushRes = await AiDebugLogger.flushAll({ force: true });
        assert.equal(flushRes.ok, true);
        assert.ok(uploadedPayloads.length >= 1);

        const latest = uploadedPayloads[uploadedPayloads.length - 1];
        assert.ok(latest.url.includes('/MissPlayer/ai-diag/round-1/FOCS-264_'));
        assert.ok(latest.url.endsWith('.json'));

        const jsonStr = JSON.stringify(latest.body);
        assert.equal(jsonStr.includes('sk-super-secret-debug-key'), false, 'WebDAV 日志绝对不得包含明文 API Key');
        assert.equal(latest.body.avcode, 'FOCS-264');
        assert.equal(latest.body.contextReadiness.metadata.tier, 'l2_remote');
        assert.equal(latest.body.contextReadiness.subtitles.autoPick.pickedOk, true);
        assert.equal(latest.body.contextReadiness.comments.waitGate.afterCount, 18);
        assert.equal(latest.body.aiExecutions.length, 1);
        assert.equal(latest.body.aiExecutions[0].taskType, 'sub_chapters');
        assert.equal(latest.body.aiExecutions[0].outcome, 'success_llm');
        assert.ok(latest.body.aiExecutions[0].inputContext.compressedSubPreview.includes('分部办公室'));
        assert.equal(latest.body.aiExecutions[0].llmResponse.parsedOutput.chapters[0].seconds, 42);
    });

    it('blocks polluted nav actresses/tags and cross-code sidebar synopsis in extractMetadataFromDocument', () => {
        const mkEl = (text, inNav = false, alt = '') => ({
            textContent: text,
            getAttribute: (k) => (k === 'content' ? text : ''),
            closest: (sel) => (inNav && /nav|aside/i.test(sel) ? {} : null),
            querySelector: (sel) => (sel === 'img' && alt ? { getAttribute: () => alt } : null)
        });
        const fakeDoc = {
            location: { href: 'https://jable.tv/videos/abf-029/', hostname: 'jable.tv' },
            title: 'ABF-029 完全主観×鬼イカせ 涼森玲夢',
            querySelector(sel) {
                if (sel === 'h1') return mkEl('ABF-029 完全主観×鬼イカせ 涼森玲夢');
                if (sel.includes('meta[name="description"]')) return mkEl('免費高清AV在線看，無需下載看到飽。');
                if (sel.includes('meta[property="og:description"]')) return mkEl('ABF-181 完全主觀 青野瑞希');
                if (sel.includes('.video-info')) return fakeDoc;
                return null;
            },
            querySelectorAll(sel) {
                if (sel.includes('.models')) {
                    return [
                        mkEl('👩 按女優', true),
                        mkEl('涼', false, '涼森玲夢'),
                        mkEl('女優排行 NOV 2026', false)
                    ];
                }
                if (sel.includes('.tags')) {
                    return [mkEl('📚 按主題', true), mkEl('絲襪', false)];
                }
                return [];
            }
        };

        const cleaned = extractMetadataFromDocument(fakeDoc, 'ABF-029', 'jable.tv');
        assert.deepEqual(cleaned.actresses, ['涼森玲夢']);
        assert.deepEqual(cleaned.tags, ['絲襪']);
        assert.equal(cleaned.synopsis, '');
    });

    it('resolves exact seconds via cue line index & pre-computes resolved comment timestamps without LLM math', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-v3'
        });

        let lastPrompt = '';
        let lastMaxTokens = 0;
        gmResponder = (opts) => {
            const body = JSON.parse(opts.data);
            lastPrompt = body.messages[1].content;
            lastMaxTokens = body.max_tokens;
            const isChapters = lastPrompt.includes('台词时间轴:');
            opts.onload({
                status: 200,
                finalUrl: opts.url,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify(
                                isChapters
                                    ? { summary: '三幕完整', chapters: [{ line: 0, seconds: 999, tag: '开场', headline: '居家做饭' }, { line: 2, seconds: 9999, tag: '挟持', headline: '跟踪威胁' }] }
                                    : { brief: { highlights: '看点', warnings: '暂无', consensus: '佳作' }, highlights: [{ subLine: 2, seconds: 9999, tag: '胁迫', reason: '真实台词锚点', sources: ['sub'], score: 95 }], skipZones: [], commentTags: [] }
                            )
                        }
                    }]
                })
            });
        };

        const cues = [
            { start: 91, end: 95, text: '我正在做晚饭' },
            { start: 3050, end: 3060, text: '快点清理办公室桌面' },
            { start: 10343, end: 10350, text: '留在这静静地出来，不要出声' }
        ];
        const chRes = await analyzeSubtitleChaptersWithLlm({ avcode: 'ABF-029', cues });
        assert.equal(chRes.ok, true);
        assert.equal(chRes.chapters[0].seconds, 91, '即使模型写了 seconds:999，也必须由 line:0 精确校准为 91s');
        assert.equal(chRes.chapters[1].seconds, 10343, '大于100分钟的时间点通过 line:2 精确校准为 10343s');

        const fgRes = await buildHighlightGraphWithLlm({
            avcode: 'ABF-015',
            cues,
            comments: [
                { id: 'c-cd', text: '-1:02:15 顶级' },
                { id: 'c-six', text: '015215 嗦的好棒' },
                { id: 'c-cn', text: '两个小时34分钟开始的主观后入看一次冲一次' }
            ],
            videoDuration: 12965
        });
        assert.equal(fgRes.ok, true);
        assert.equal(lastMaxTokens, 2400);
        assert.ok(lastPrompt.includes('t=9230s'), '倒数时间 -1:02:15 必须被预先校准为正向 t=9230s');
        assert.ok(lastPrompt.includes('t=6735s'), '6位紧凑格式 015215 必须被预先解析为 t=6735s');
        assert.ok(lastPrompt.includes('t=9240s'), '中文“两个小时34分钟”必须被解析为 t=9240s');
        assert.equal(fgRes.graph.highlights[0].seconds, 10343);
    });

    it('drops forged sub/inferred timestamps and zero-width skipZones when subtitles & crowdPeaks are absent', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-nosub'
        });

        gmResponder = (opts) => {
            opts.onload({
                status: 200,
                finalUrl: opts.url,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                brief: { highlights: '两小时后高能', warnings: '前段略慢', consensus: '口碑好' },
                                highlights: [
                                    { seconds: 0, endSeconds: 7200, subLine: 0, tag: '伪造字幕', reason: '无字幕捏造', sources: ['sub'], score: 90 },
                                    { seconds: 7200, endSeconds: 8400, tag: '强度峰值', reason: '2h后不错', sources: ['comment'], score: 95 },
                                    { seconds: 7210, endSeconds: 14338, tag: '重复高光', reason: '两小时后精华', sources: ['comment'], score: 88 }
                                ],
                                skipZones: [
                                    { seconds: 14338, endSeconds: 14338, reason: '结尾边界凑数' },
                                    { seconds: 0, endSeconds: 3600, reason: '前段节奏慢' }
                                ],
                                commentTags: [
                                    { idx: 0, sentiment: 'positive', isCountdown: false, inferredSeconds: 7200, note: '两小时好评' },
                                    { idx: 1, sentiment: 'critique', isCountdown: false, inferredSeconds: 3600, note: '无时间纯感想' }
                                ]
                            })
                        }
                    }]
                })
            });
        };

        const res = await buildHighlightGraphWithLlm({
            avcode: 'XRW-813',
            cues: [],
            crowdPeaks: [],
            comments: [
                { id: 'c-real', text: '两小时后的强度不错' },
                { id: 'c-nots', text: '耐看漂亮高颜值' }
            ],
            videoDuration: 14338
        });

        assert.equal(res.ok, true);
        assert.equal(res.graph.highlights.length, 1, '必须过滤掉伪造的 sub 高光与重复的 7210s 高光');
        assert.equal(res.graph.highlights[0].seconds, 7200);
        assert.equal(res.graph.skipZones.length, 1, '必须丢弃片尾零宽度 skipZone');
        assert.equal(res.graph.skipZones[0].endSeconds, 3600);
        assert.equal(res.graph.commentInsights['c-real'].sentiment, 'hype', 'positive 应归一化为 hype');
        assert.equal(res.graph.commentInsights['c-nots'].sentiment, 'warn', 'critique 应归一化为 warn');
        assert.equal(res.graph.commentInsights['c-nots'].inferredSeconds, null, '无字幕无波峰时严禁盲猜无时间评论秒数');
    });

    it('never coerces subLine=null or dummy subLine=0 on comment highlights to L0 and upgrades cached partial Chinese hour timestamps', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-subline-null'
        });

        let lastPrompt = '';
        gmResponder = (opts) => {
            const payload = JSON.parse(opts.data || '{}');
            lastPrompt = payload.messages?.map((m) => m.content).join('\n') || '';
            opts.onload({
                status: 200,
                finalUrl: opts.url,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                brief: { highlights: '多段真实高能与中字结合', warnings: '暂无明显雷点', consensus: '口碑不错' },
                                highlights: [
                                    { seconds: 9240, endSeconds: 9300, subLine: null, tag: '主观后入', reason: '两个小时34分高能', sources: ['comment'], score: 92 },
                                    { seconds: 4260, endSeconds: 4320, subLine: null, tag: '经典片段', reason: '71分钟推荐', sources: ['comment'], score: 88 },
                                    { seconds: 6735, endSeconds: 6868, subLine: 0, tag: '后半推荐', reason: '假零号subLine不覆盖', sources: ['comment'], score: 85 },
                                    { seconds: 4930, endSeconds: 5089, subLine: 1, tag: '正片对齐', reason: '真字幕行仍对齐', sources: ['sub'], score: 95 }
                                ],
                                skipZones: [],
                                commentTags: []
                            })
                        }
                    }]
                })
            });
        };

        const res = await buildHighlightGraphWithLlm({
            avcode: 'ABF-015',
            forceRefresh: true,
            cues: [
                { start: 17, end: 21, text: '你好呀，今天真热啊' },
                { start: 4942, end: 4948, text: '不要这样，已经不行了' }
            ],
            comments: [
                {
                    id: 'c-cached-partial',
                    text: '两个小时34分钟开始的主观后入，好久没看到',
                    timestamps: [{ raw: '34分钟', seconds: 2040 }]
                }
            ],
            videoDuration: 12965
        });

        assert.equal(res.ok, true);
        assert.ok(lastPrompt.includes('t=9240s'), '即使缓存评论预存了 34分钟=2040s，也必须升级为 t=9240s');
        assert.ok(!lastPrompt.includes('t=2040s'), '不应保留被截断的假 2040s');
        assert.equal(res.graph.highlights.length, 4, '4个不同时段高光绝不能因 subLine=null 合并成1个L0');
        assert.deepEqual(
            res.graph.highlights.map((h) => h.seconds),
            [4260, 4942, 6735, 9240],
            'comment 高光应保留真实 seconds，真 sub 来源仍对齐 L1(4942s)'
        );
    });

    it('penalizes Whisper polite hallucination tracks & sparse MT peers, and passes altCues cross-check to LLM', async () => {
        const { scoreSubtitleQuality, computeTrackContentFingerprint } = await import('../src/player/subtitles/SubtitleQualityScorer.js');

        // 构造含大量 "你好/谢谢/你太棒了/Chico/感谢您的观看" 的 Whisper 劣质轨 (MIAA-950 实测模式)
        const whisperBadCues = Array.from({ length: 60 }, (_, idx) => ({
            start: idx * 100 + 5,
            end: idx * 100 + 12,
            text: idx % 3 === 0
                ? '你好 谢谢 女士，你好吗 我很好 你太棒了 Chico 在等你'
                : (idx === 16 || idx === 31 ? '感谢您的观看' : `对白段落 ${idx} 今天状态不错`)
        }));
        const normalFullCues = Array.from({ length: 180 }, (_, idx) => ({
            start: idx * 35 + 5,
            end: idx * 35 + 11,
            text: `第 ${idx} 段完整对白，老板来到家里谈工作与生活细节`
        }));
        const sparseMtCues = Array.from({ length: 45 }, (_, idx) => ({
            start: idx * 140 + 5,
            end: idx * 140 + 12,
            text: `稀疏机翻台词段落 ${idx}`
        }));

        const badQ = scoreSubtitleQuality(whisperBadCues, { videoDurationSec: 6500 });
        assert.ok(badQ.reasons.includes('whisper_polite_noise'), '必须识别 Whisper 礼貌语/音译噪声簇');
        assert.ok(badQ.reasons.includes('whisper_hallucination'), '必须识别 "感谢您的观看" 等幻觉水印');
        assert.ok(badQ.sqi < 75, `Whisper 幻觉轨应显著降分，实际=${badQ.sqi}`);

        const fullQ = scoreSubtitleQuality(normalFullCues, { videoDurationSec: 6500 });
        const sparseQ = scoreSubtitleQuality(sparseMtCues, { videoDurationSec: 6500 });
        const pickedSparseVsFull = selectBestQualityCandidate([
            { item: { id: 'sparse-mt', machineTranslated: true }, parsed: { cues: sparseMtCues }, quality: sparseQ },
            { item: { id: 'full-human', machineTranslated: false }, parsed: { cues: normalFullCues }, quality: fullQ }
        ]);
        assert.equal(pickedSparseVsFull?.item?.id, 'full-human', '完整非机翻轨应稳胜残缺/稀疏轨');
        assert.equal(computeTrackContentFingerprint(whisperBadCues), computeTrackContentFingerprint([...whisperBadCues]));

        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-alt-cues'
        });
        let capturedPrompt = '';
        gmResponder = (opts) => {
            const payload = JSON.parse(opts.data || '{}');
            capturedPrompt = payload.messages?.map((m) => m.content).join('\n') || '';
            opts.onload({
                status: 200,
                finalUrl: opts.url,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                brief: { highlights: '克制客观总结', warnings: '无', consensus: '口碑良' },
                                highlights: [],
                                skipZones: [],
                                commentTags: []
                            })
                        }
                    }]
                })
            });
        };

        const fgRes = await buildHighlightGraphWithLlm({
            avcode: 'MIAA-950',
            forceRefresh: true,
            cues: [
                { start: 100, end: 110, text: '感谢您的观看' },
                { start: 994, end: 1002, text: '你好 谢谢 你太棒了 Chico' },
                { start: 2000, end: 2012, text: '老板要求加班并提出无理条件' }
            ],
            altCues: [
                { start: 994, end: 1002, text: '不要碰我，老公还在出差' }
            ],
            altTitle: '备选人工轨',
            comments: [{ id: 'c1', text: '节奏紧凑演技在线' }],
            videoDuration: 7200
        });
        assert.equal(fgRes.ok, true);
        assert.ok(!capturedPrompt.includes('感谢您的观看'), '压缩时间轴时应剔除 Whisper 水印行');
        assert.ok(capturedPrompt.includes('副字幕交叉参考'), '存在噪声时应附加副字幕交叉参考文本');
        assert.ok(capturedPrompt.includes('反幻觉硬约束'), 'Prompt 必须包含反台词物理脑补硬约束');
    });

    it('SubtitleManager waitUntilReady awaits pending init/autoPick and CommentPanel exposes -1 AI screen', async () => {
        const { SubtitleManager } = await import('../src/player/subtitles/SubtitleManager.js');
        const fakeMgr = Object.create(SubtitleManager.prototype);
        fakeMgr.avcode = 'MIAA-950';
        fakeMgr.cues = [];
        fakeMgr.playerCore = { options: { playerState: { settings: { subtitleAutoBest: true } } } };
        fakeMgr._autoSearchedCodes = new Set();
        fakeMgr._hasSavedFavorite = () => false;
        fakeMgr._initPromise = new Promise((r) => setTimeout(() => {
            fakeMgr.cues = [{ start: 10, end: 14, text: '延迟就绪字幕' }];
            r();
        }, 25));
        const gateRes = await fakeMgr.waitUntilReady({ timeoutMs: 800 });
        assert.equal(gateRes.ready, true);
        assert.equal(gateRes.cueCount, 1);

        // 超时降级场景：超过超时窗后仍返回 pending=true 供 AI 先走评论兜底再升级
        const slowMgr = Object.create(SubtitleManager.prototype);
        slowMgr.avcode = 'MIAA-950';
        slowMgr.cues = [];
        slowMgr.playerCore = { options: { playerState: { settings: { subtitleAutoBest: false } } } };
        slowMgr._autoSearchedCodes = new Set();
        slowMgr._hasSavedFavorite = () => true;
        slowMgr._initPromise = new Promise((r) => setTimeout(r, 1200));
        const timedOutRes = await slowMgr.waitUntilReady({ timeoutMs: 500 });
        assert.equal(timedOutRes.ready, false);
        assert.equal(timedOutRes.pending, true);

        const cpSrc = fs.readFileSync(path.resolve('src/player/controls/CommentPanel.js'), 'utf8');
        const subCss = fs.readFileSync(path.resolve('src/player/ui/styles/02_components/_subtitle_insights.css'), 'utf8');
        assert.ok(cpSrc.includes("key: 'ai'") && cpSrc.includes('getViewSources()'), 'CommentPanel 必须把 AI 简报作为首位 (-1 屏) 同级视图');
        assert.ok(cpSrc.includes('id="tm-comment-section-ai"'), 'CommentPanel 必须渲染 #tm-comment-section-ai 以支持左右滑动切换');
        assert.ok(cpSrc.includes('onSubtitleApplied') && cpSrc.includes('_pendingAiSubtitleUpgrade'), '字幕延迟就绪后必须支持自动补全/升级 AI 简报');
        assert.ok(subCss.includes('.mp-ai-screen-body') && subCss.includes('.mp-ai-brief-notice'), '样式表必须包含 -1 屏与降级提示样式');
    });

    it('skips LLM cleanly when subtitle is low-trust & no comment/crowd anchors exist, and filters untrusted subtitles when comments have timestamps', async () => {
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://apihub.agnes-ai.com/v1',
            model: 'agnes-3.0-flash',
            apiKey: 'sk-test-gate'
        });
        let llmCalls = 0;
        let lastUserPrompt = '';
        gmResponder = (opts) => {
            llmCalls += 1;
            const body = JSON.parse(opts.data || '{}');
            lastUserPrompt = body.messages?.[1]?.content || '';
            opts.onload({
                status: 200,
                finalUrl: opts.url,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                brief: { highlights: '仅基于评论定位', warnings: '暂无', consensus: '口碑良' },
                                highlights: [
                                    { seconds: 3853, confidence: 'high', tag: '口水高能', reason: '评论实锤', sources: ['comment'], score: 90 },
                                    { seconds: 900, confidence: 'low', tag: '猜测跳过', reason: '把握不足', sources: ['comment'], score: 80 }
                                ],
                                skipZones: [],
                                commentTags: []
                            })
                        }
                    }]
                })
            });
        };

        const badQuality = { sqi: 31, reasons: ['whisper_polite_noise', 'sanitized_mt'] };
        const fakeLongCues = Array.from({ length: 45 }, (_, i) => ({
            start: i * 100,
            end: i * 100 + 5,
            text: `Structurer 先生你好谢谢 Chico ${i}`
        }));

        // 1. NKKD-297/NKKD-351 场景：低质字幕 + 无时间戳评论 + 无波峰 -> 两次调用都直接熔断跳过，0次请求模型
        const skipCh = await analyzeSubtitleChaptersWithLlm({
            avcode: 'NKKD-297',
            cues: fakeLongCues,
            subtitleQuality: badQuality,
            forceRefresh: true
        });
        const skipFg = await buildHighlightGraphWithLlm({
            avcode: 'NKKD-297',
            cues: fakeLongCues,
            subtitleQuality: badQuality,
            comments: [{ id: 'c1', text: '这部看着挺不错的，可惜无时间点' }],
            crowdPeaks: [],
            forceRefresh: true
        });
        assert.equal(skipCh.skipped, true, '低可信字幕必须跳过 AI 分幕');
        assert.equal(skipFg.skipped, true, '低可信字幕且无任何时间戳/波峰时必须跳过 AI 融合');
        assert.equal(llmCalls, 0, '证据不足时严禁浪费 Token 强行请求模型');

        // 2. MIAA-950 场景：低质字幕 + 有真实时间戳评论 -> 隔离坏字幕正文，仅喂真实评论，并过滤 confidence=low
        const rescuedFg = await buildHighlightGraphWithLlm({
            avcode: 'MIAA-950',
            cues: fakeLongCues,
            subtitleQuality: { sqi: 55, reasons: ['whisper_polite_noise'] },
            comments: [{ id: 'c2', text: '1:04:13 想喝她的口水' }],
            crowdPeaks: [],
            videoDuration: 7200,
            forceRefresh: true
        });
        assert.equal(rescuedFg.ok, true);
        assert.equal(llmCalls, 1);
        assert.ok(!lastUserPrompt.includes('Structurer 先生'), '劣质字幕正文绝不能传入 Prompt 污染判断');
        assert.equal(rescuedFg.graph.highlights.length, 1, 'confidence=low 猜测条目必须被过滤');
        assert.equal(rescuedFg.graph.highlights[0].seconds, 3853);
    });

    it('Debug 批量实测解析缓存与全链路 WebDAV 上传应完整闭环', async () => {
        resetAll();
        const raw = [
            '# 测试清单',
            'https://missav.ws/cn/miaa-950',
            'NKKD-351, miaa-950',
            '// 注释行忽略',
            'not-a-code'
        ].join('\n');
        saveBatchText(raw);
        assert.equal(loadSavedBatchText(), raw);
        assert.deepEqual(parseBatchCodes(raw), ['MIAA-950', 'NKKD-351']);

        const clearEmpty = await SubtitleRepository.clearLocal({ codes: ['MIAA-950'] });
        assert.equal(clearEmpty.clearedCount, 0);

        SyncManager.saveWebDavConfig({
            url: 'http://192.168.1.10:5005/backup',
            username: 'chen',
            password: 'secret',
            enabled: true
        });
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'https://llm.test/v1',
            model: 'gpt-4o-mini',
            apiKey: 'sk-test',
            aiDebugEnabled: false,
            aiDebugDir: 'logs/ai-debug'
        });

        const samplePhrases = [
            '今天加班好累啊，我们先聊聊企划案进度吧。',
            '部长说这次项目非常关键，需要全力配合。',
            '外面的雨下得好大，今晚恐怕赶不上末班车了。',
            '你刚才喝了那么多酒，现在头还晕吗？',
            '别站在玄关吹风了，快进来喝杯热茶暖暖身子。',
            '其实我一直有件事想找机会跟你说清楚。',
            '手机怎么突然没电了，这里信号也不太好。',
            '门锁好像坏了，今晚只能暂时在这里过夜。'
        ];
        const uploadedPayloads = [];
        const srtContent = Array.from({ length: 48 }, (_, i) => {
            const startSec = i * 40;
            const mm1 = String(Math.floor(startSec / 60)).padStart(2, '0');
            const ss1 = String(startSec % 60).padStart(2, '0');
            const mm2 = String(Math.floor((startSec + 4) / 60)).padStart(2, '0');
            const ss2 = String((startSec + 4) % 60).padStart(2, '0');
            const lineA = samplePhrases[i % samplePhrases.length];
            const lineB = samplePhrases[Math.floor(i / samplePhrases.length) % samplePhrases.length];
            return `${i + 1}\n00:${mm1}:${ss1},000 --> 00:${mm2}:${ss2},000\n${lineA}${lineB}\n`;
        }).join('\n');

        gmResponder = (opts) => {
            const url = String(opts.url || '');
            const method = String(opts.method || 'GET').toUpperCase();
            if (url.startsWith('http://192.168.1.10:5005')) {
                if (method === 'PROPFIND') {
                    return opts.onload?.({ status: 207, responseText: '<multistatus/>', finalUrl: url });
                }
                if (method === 'PUT') {
                    uploadedPayloads.push({ url, data: JSON.parse(opts.data) });
                    return opts.onload?.({ status: 201, responseText: '', finalUrl: url });
                }
                return opts.onload?.({ status: 200, responseText: '', finalUrl: url });
            }
            if (url.includes('api-shoulei-ssl.xunlei.com')) {
                return opts.onload?.({
                    status: 200,
                    responseText: JSON.stringify({
                        code: 0,
                        data: [{ cid: 'cid1', name: 'MIAA-950.zh.srt', url: 'https://sub.test/miaa-950.srt', language: 'zh', ext: 'srt', rate: 95 }]
                    }),
                    finalUrl: url
                });
            }
            if (url.includes('https://sub.test/miaa-950.srt')) {
                const buf = new TextEncoder().encode(srtContent).buffer;
                return opts.onload?.({ status: 200, response: buf, responseText: srtContent, finalUrl: url });
            }
            if (url.includes('jdforrepam.com/api/v2/search')) {
                return opts.onload?.({ status: 200, responseText: JSON.stringify({ data: { movies: [{ id: 'mv1' }] } }), finalUrl: url });
            }
            if (url.includes('jdforrepam.com/api/v1/movies/mv1/reviews')) {
                return opts.onload?.({
                    status: 200,
                    responseText: JSON.stringify({
                        data: { reviews: [{ id: 'r1', content: '31:20 剧情转折高能', created_at: '2026-10-01', user: { name: 'u1' }, score: 5 }] }
                    }),
                    finalUrl: url
                });
            }
            if (url.includes('/chat/completions')) {
                const body = JSON.parse(opts.data || '{}');
                const sys = body.messages?.[0]?.content || '';
                if (sys.includes('场景定位分析引擎')) {
                    return opts.onload?.({
                        status: 200,
                        responseText: JSON.stringify({
                            choices: [{
                                message: {
                                    content: JSON.stringify({
                                        brief: { highlights: '31分剧情转折', warnings: '暂无明显雷点', consensus: '口碑不错' },
                                        highlights: [{ seconds: 1880, endSeconds: 1920, subLine: 47, confidence: 'high', tag: '转折', reason: '字幕与评论印证', sources: ['comment', 'sub'], score: 90 }],
                                        skipZones: [],
                                        commentTags: []
                                    })
                                }
                            }]
                        })
                    });
                }
                return opts.onload?.({
                    status: 200,
                    responseText: JSON.stringify({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    summary: '职场加班对白剧情',
                                    chapters: [{ line: 2, seconds: 80, tag: '开场', headline: '谈论企划进度' }]
                                })
                            }
                        }]
                    })
                });
            }
            return opts.onload?.({ status: 404, responseText: '', finalUrl: url });
        };

        const progressEvents = [];
        const res = await AiBatchTestRunner.runBatch({
            codes: ['MIAA-950'],
            preferredLang: 'zh',
            clearLocalSubs: true,
            forceFresh: true,
            delayMs: 0,
            onProgress: (p) => progressEvents.push(p)
        });

        assert.equal(AiDebugLogger.isEnabled(), false, '批量实测结束后必须恢复原 aiDebugEnabled 状态');
        assert.equal(res.ok, true);
        assert.equal(res.completed, 1);
        assert.equal(res.uploadedCount, 1);
        assert.equal(res.results[0].commentsCount, 1);
        assert.ok(res.results[0].subSqi >= 75);
        assert.ok(res.results[0].hlOutcome.startsWith('ok('));
        assert.ok(res.results[0].subChOutcome.startsWith('ok('));
        assert.equal(progressEvents.length, 2);

        const debugUploads = uploadedPayloads.filter((u) => u.url.includes('/logs/ai-debug/MIAA-950'));
        assert.ok(debugUploads.length >= 1, '至少上传一份 MIAA-950 完整 AI Debug 报告');
        const payload = debugUploads[debugUploads.length - 1].data;
        assert.equal(payload.avcode, 'MIAA-950');
        assert.ok(payload.contextReadiness?.subtitles?.autoPick);
        assert.ok(payload.contextReadiness?.comments?.initialLoad);
        assert.equal(payload.aiExecutions.length, 2);
    });

    it('兼容 MIAB-357 全角单箭头时间戳、拦截 ABF-015 空洞稀疏轨、JavDB 域名轮换并剔除重叠/片尾冲突', async () => {
        resetAll();
        // 1. MIAB-357 畸形时间戳恢复
        const weirdSrt = [
            '0',
            '00：00：00.000-> 00：00：03.000',
            '  aisubs.app',
            '',
            '1',
            '00:00:31.216 -> 00:01:00.528',
            '  感谢您的辛勤工作。你应该休息一下。'
        ].join('\n');
        const parsed = parseSubtitles(weirdSrt, 'MIAB-357-zh-CN.srt');
        assert.equal(parsed.cues.length, 2);
        assert.equal(Math.round(parsed.cues[1].start), 31);

        // 2. ABF-015 稀疏断层拦截（90 句跨 3.3 小时，中间 5800 秒空白断层）
        const gappyCues = [
            ...Array.from({ length: 45 }, (_, i) => ({ start: 70 + i * 90, end: 74 + i * 90, text: `前半段对话内容句子编号${i}` })),
            ...Array.from({ length: 45 }, (_, i) => ({ start: 10095 + i * 35, end: 10099 + i * 35, text: `后半段结尾内容句子编号${i}` }))
        ];
        const gapQuality = scoreSubtitleQuality(gappyCues, {});
        assert.ok(gapQuality.reasons.includes('giant_gap_or_sparse'));
        assert.ok(gapQuality.sqi < 60, `预期高断层低密度轨被明显降权，实际 ${gapQuality.sqi}`);

        // 3. JavDB 主站返回 HTTP 200 限流/登录页时自动轮换备用域名
        const prevDomParser = globalThis.DOMParser;
        globalThis.DOMParser = class {
            parseFromString(html) {
                return {
                    querySelectorAll() {
                        if (html.includes('/v/ok999')) {
                            return [{ getAttribute: (k) => (k === 'href' ? '/v/ok999' : 'MIAA-950'), textContent: 'MIAA-950' }];
                        }
                        return [];
                    }
                };
            }
        };
        try {
            gmResponder = (opts) => {
                if (opts.url.startsWith(JAVDB_DOMAINS[0])) {
                    return opts.onload?.({ status: 200, responseText: '<html>請登錄帳號</html>', finalUrl: opts.url });
                }
                if (JAVDB_DOMAINS[1] && opts.url.startsWith(JAVDB_DOMAINS[1])) {
                    return opts.onload?.({ status: 200, responseText: '<div class="movie-list"><a href="/v/ok999" title="MIAA-950"></a></div>', finalUrl: opts.url });
                }
                return opts.onload?.({ status: 404, responseText: '', finalUrl: opts.url });
            };
            if (JAVDB_DOMAINS.length >= 2) {
                const jbRes = await fetchJavdbMovieId('MIAA-950');
                assert.equal(jbRes.movieId, 'ok999');
                assert.equal(jbRes.domain, JAVDB_DOMAINS[1]);
            }
        } finally {
            globalThis.DOMParser = prevDomParser;
        }

        // 4. LlmTasks 后处理：skipZones 不得吞掉 highlights、片尾 90s 纯字幕独白过滤、分幕 <60s 合并、isCountdown 不受模型幻觉影响
        LlmService.saveConfig({ enabled: true, baseUrl: 'https://llm.test/v1', model: 'gpt-4o-mini', apiKey: 'sk-test' });
        const goodCues = Array.from({ length: 120 }, (_, i) => ({
            start: i * 60,
            end: i * 60 + 6,
            text: `场景剧情对白片段内容${i}，继续推动故事发展。`
        }));
        gmResponder = (opts) => {
            const body = JSON.parse(opts.data || '{}');
            const sys = body.messages?.[0]?.content || '';
            if (sys.includes('场景定位分析引擎')) {
                return opts.onload?.({
                    status: 200,
                    responseText: JSON.stringify({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    brief: { highlights: '中段爆发', warnings: '无', consensus: '好' },
                                    highlights: [
                                        { seconds: 3600, endSeconds: 3720, confidence: 'high', tag: '按摩致高潮/', reason: '中段强对白', sources: ['sub'], score: 90 },
                                        { seconds: 7160, endSeconds: 7200, confidence: 'high', tag: '结局', reason: '片尾独白', sources: ['sub'], score: 88 }
                                    ],
                                    skipZones: [
                                        { seconds: 3550, endSeconds: 3750, reason: '冲突避坑' },
                                        { seconds: 1000, endSeconds: 1200, reason: '中后段字幕跳跃严重（L100）' },
                                        { seconds: 0, endSeconds: 180, reason: '纯片头铺垫' }
                                    ],
                                    commentTags: [
                                        { idx: 0, sentiment: 'hype', isCountdown: true, inferredSeconds: 3600, note: '正向评论' }
                                    ]
                                })
                            }
                        }]
                    })
                });
            }
            return opts.onload?.({
                status: 200,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                summary: '完整剧情线',
                                chapters: [
                                    { seconds: 454, tag: '指令', headline: '下达指令' },
                                    { seconds: 476, tag: '重复', headline: '22秒后重复' },
                                    { seconds: 1800, tag: '推进', headline: '中段展开' }
                                ]
                            })
                        }
                    }]
                })
            });
        };

        const fgRes = await buildHighlightGraphWithLlm({
            avcode: 'MVSD-372',
            cues: goodCues,
            comments: [{ id: 'c1', text: '1:00:00 太强了', countdownApplied: false }],
            videoDuration: 7200,
            forceRefresh: true
        });
        assert.equal(fgRes.ok, true);
        assert.equal(fgRes.graph.highlights.length, 1, '片尾 90s 纯 sub 高光必须过滤');
        assert.equal(fgRes.graph.highlights[0].seconds, 3600);
        assert.equal(fgRes.graph.highlights[0].tag, '按摩致高潮', 'tag 截断末尾斜杠必须清理');
        assert.equal(fgRes.graph.skipZones.length, 1, '重叠或含字幕/L100元术语的 skipZones 必须剔除');
        assert.equal(fgRes.graph.skipZones[0].seconds, 0);
        assert.equal(fgRes.graph.commentInsights.c1.isCountdown, false, 'commentInsights.isCountdown 必须跟随真实本地校准结果');

        // 无字幕无波峰时：含“推测/若无”臆测理由的 skipZones 必须剔除
        const prevGm = gmResponder;
        gmResponder = (opts) => opts.onload?.({
            status: 200,
            responseText: JSON.stringify({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            brief: { highlights: '口爆', warnings: '无', consensus: '好' },
                            highlights: [{ seconds: 3600, endSeconds: 3660, confidence: 'high', tag: '射精', reason: '评论实锤', sources: ['comment'], score: 88 }],
                            skipZones: [{ seconds: 3600, endSeconds: 4200, reason: '推测中段铺垫若无高能可能较慢' }],
                            commentTags: []
                        })
                    }
                }]
            })
        });
        const noSubFg = await buildHighlightGraphWithLlm({
            avcode: 'ADN-384',
            cues: [],
            comments: [{ id: 'c1', text: '1:00:00 太强了' }],
            videoDuration: 7200,
            forceRefresh: true
        });
        gmResponder = prevGm;
        assert.equal(noSubFg.ok, true);
        assert.deepEqual(noSubFg.graph.skipZones, []);

        const chRes = await analyzeSubtitleChaptersWithLlm({
            avcode: 'DASD-943',
            cues: goodCues,
            forceRefresh: true
        });
        assert.equal(chRes.ok, true);
        assert.equal(chRes.chapters.length, 2, '相邻 < 60s 章节必须自动合并去重');
    });
});
