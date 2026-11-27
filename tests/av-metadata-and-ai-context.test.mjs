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
const { selectBestQualityCandidate } = await import('../src/player/subtitles/SubtitleQualityScorer.js');
const { SyncManager } = await import('../src/sync/SyncManager.js');

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
                { id: 'c-six', text: '015215 嗦的好棒' }
            ],
            videoDuration: 12965
        });
        assert.equal(fgRes.ok, true);
        assert.equal(lastMaxTokens, 2400);
        assert.ok(lastPrompt.includes('t=9230s'), '倒数时间 -1:02:15 必须被预先校准为正向 t=9230s');
        assert.ok(lastPrompt.includes('t=6735s'), '6位紧凑格式 015215 必须被预先解析为 t=6735s');
        assert.equal(fgRes.graph.highlights[0].seconds, 10343);
    });
});
