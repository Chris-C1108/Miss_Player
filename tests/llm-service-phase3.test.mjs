import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// 1. Cleanly mock global browser/userscript primitives before importing source modules
const storageMap = new Map();
globalThis.localStorage = {
    getItem(k) {
        return storageMap.has(k) ? storageMap.get(k) : null;
    },
    setItem(k, v) {
        storageMap.set(k, String(v));
    },
    removeItem(k) {
        storageMap.delete(k);
    },
    clear() {
        storageMap.clear();
    }
};

globalThis.window = {
    location: {
        hostname: 'missav.ws',
        href: 'https://missav.ws/cn/ssis-001'
    }
};

let gmCallLog = [];
let mockGmResponder = null;

globalThis.GM_xmlhttpRequest = (opts) => {
    gmCallLog.push({
        method: opts.method,
        url: opts.url,
        headers: opts.headers || {},
        data: opts.data ?? null,
        timeout: opts.timeout
    });

    if (typeof mockGmResponder === 'function') {
        queueMicrotask(() => mockGmResponder(opts));
    } else {
        queueMicrotask(() => {
            opts.onerror?.({ statusText: 'MOCK_NOT_CONFIGURED' });
        });
    }
    return { abort: () => {} };
};

const {
    LlmService,
    LlmCache,
    LLM_KEY_ENABLED,
    LLM_KEY_BASE_URL,
    LLM_KEY_API_KEY,
    LLM_KEY_MODEL,
    LLM_KEY_TIMEOUT_MS,
    filterAndSortTextModels
} = await import('../src/services/LlmService.js');

const { SyncManager } = await import('../src/sync/SyncManager.js');

const {
    compressCuesForLlm,
    analyzeSubtitleChaptersWithLlm,
    summarizeCommentsWithLlm,
    getCachedCommentBrief,
    autoTagMarkerWithLlm,
    mergeAutoTagsIntoComment
} = await import('../src/services/LlmTasks.js');

const { SEMANTIC_TAG_TAXONOMY } = await import('../src/player/managers/tagTaxonomy.js');
const { buildAiConnectionAccordion } = await import('../src/player/managers/settings_v2/sections/S2AiSectionBuilder.js');
const { ICON_EYE, ICON_EYE_OFF } = await import('../src/constants/icons.js');

function resetState() {
    storageMap.clear();
    gmCallLog = [];
    mockGmResponder = null;
    LlmCache.clearMemoryCache();
}

describe('Phase 3: LlmService URL & Config Hygiene', () => {
    beforeEach(resetState);

    it('sanitizeBaseUrl enforces HTTPS on public hosts and allows HTTP only on local/LAN/Tailscale without embedded credentials', () => {
        assert.equal(LlmService.sanitizeBaseUrl('https://api.openai.com/v1/'), 'https://api.openai.com/v1');
        assert.equal(LlmService.sanitizeBaseUrl('https://openrouter.ai/api/v1///'), 'https://openrouter.ai/api/v1');
        assert.equal(LlmService.sanitizeBaseUrl('http://192.168.2.250:11434/v1/'), 'http://192.168.2.250:11434/v1');
        assert.equal(LlmService.sanitizeBaseUrl('http://10.0.0.8:11434'), 'http://10.0.0.8:11434');
        assert.equal(LlmService.sanitizeBaseUrl('http://172.16.10.2:8080/v1'), 'http://172.16.10.2:8080/v1');
        assert.equal(LlmService.sanitizeBaseUrl('http://localhost:11434/v1'), 'http://localhost:11434/v1');
        assert.equal(LlmService.sanitizeBaseUrl('http://127.0.0.1:11434'), 'http://127.0.0.1:11434');
        assert.equal(LlmService.sanitizeBaseUrl('http://[::1]:11434/v1'), 'http://[::1]:11434/v1');
        assert.equal(LlmService.sanitizeBaseUrl('http://macmini.local:11434'), 'http://macmini.local:11434');
        assert.equal(LlmService.sanitizeBaseUrl('http://ollama.home.lan:11434'), 'http://ollama.home.lan:11434');
        assert.equal(LlmService.sanitizeBaseUrl('http://gpu-node.tailnet.ts.net:11434/v1'), 'http://gpu-node.tailnet.ts.net:11434/v1');

        // Reject public plain HTTP, out-of-range RFC1918, embedded credentials, non-http schemes
        assert.equal(LlmService.sanitizeBaseUrl('http://api.openai.com/v1'), '');
        assert.equal(LlmService.sanitizeBaseUrl('http://172.32.0.1:11434'), '');
        assert.equal(LlmService.sanitizeBaseUrl('https://user:pass@api.openai.com/v1'), '');
        assert.equal(LlmService.sanitizeBaseUrl('https://token@openrouter.ai/api/v1'), '');
        assert.equal(LlmService.sanitizeBaseUrl('ftp://example.com/v1'), '');
        assert.equal(LlmService.sanitizeBaseUrl('http://192.168.1.x:11434/v1'), '');
    });

    it('resolveChatEndpoint & resolveModelsEndpoint handle bare hosts, /v1, /api/v1, /v1beta/openai, and full /chat/completions', () => {
        assert.equal(
            LlmService.resolveChatEndpoint('http://192.168.2.250:11434'),
            'http://192.168.2.250:11434/v1/chat/completions'
        );
        assert.equal(
            LlmService.resolveModelsEndpoint('http://192.168.2.250:11434'),
            'http://192.168.2.250:11434/v1/models'
        );

        assert.equal(
            LlmService.resolveChatEndpoint('https://api.openai.com/v1/'),
            'https://api.openai.com/v1/chat/completions'
        );
        assert.equal(
            LlmService.resolveModelsEndpoint('https://api.openai.com/v1/'),
            'https://api.openai.com/v1/models'
        );

        assert.equal(
            LlmService.resolveChatEndpoint('https://openrouter.ai/api/v1'),
            'https://openrouter.ai/api/v1/chat/completions'
        );
        assert.equal(
            LlmService.resolveModelsEndpoint('https://openrouter.ai/api/v1'),
            'https://openrouter.ai/api/v1/models'
        );

        assert.equal(
            LlmService.resolveChatEndpoint('https://generativelanguage.googleapis.com/v1beta/openai'),
            'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
        );
        assert.equal(
            LlmService.resolveModelsEndpoint('https://generativelanguage.googleapis.com/v1beta/openai'),
            'https://generativelanguage.googleapis.com/v1beta/openai/models'
        );

        assert.equal(
            LlmService.resolveChatEndpoint('https://relay.example.com/custom/chat/completions'),
            'https://relay.example.com/custom/chat/completions'
        );
        assert.equal(
            LlmService.resolveModelsEndpoint('https://relay.example.com/custom/chat/completions'),
            'https://relay.example.com/custom/models'
        );
    });

    it('saveConfig / getConfig clamp timeoutMs, trim inputs, allow clearing baseUrl, and check storage keys', () => {
        assert.equal(LLM_KEY_ENABLED, 'mp_llm_enabled');
        assert.equal(LLM_KEY_BASE_URL, 'mp_llm_base_url');
        assert.equal(LLM_KEY_API_KEY, 'mp_llm_api_key');
        assert.equal(LLM_KEY_MODEL, 'mp_llm_model');
        assert.equal(LLM_KEY_TIMEOUT_MS, 'mp_llm_timeout_ms');

        assert.equal(LlmService.isConfigured(), false);
        assert.equal(LlmService.isEnabled(), false);

        LlmService.saveConfig({
            enabled: true,
            baseUrl: '  https://openrouter.ai/api/v1/  ',
            apiKey: '  sk-test-secret-9988  ',
            model: '  deepseek/deepseek-chat  ',
            timeoutMs: 999999
        });

        const cfg = LlmService.getConfig();
        assert.equal(cfg.enabled, true);
        assert.equal(cfg.baseUrl, 'https://openrouter.ai/api/v1');
        assert.equal(cfg.apiKey, 'sk-test-secret-9988');
        assert.equal(cfg.model, 'deepseek/deepseek-chat');
        assert.equal(cfg.timeoutMs, 120000);
        assert.equal(LlmService.isConfigured(), true);
        assert.equal(LlmService.isEnabled(), true);

        LlmService.saveConfig({ timeoutMs: 100, baseUrl: '' });
        const cfgCleared = LlmService.getConfig();
        assert.equal(cfgCleared.timeoutMs, 5000);
        assert.equal(cfgCleared.baseUrl, '');
        assert.equal(LlmService.isConfigured(), false);
    });
});

describe('Phase 3: Secret Redaction, Refusal Detection, JSON Parsing & Connection Testing', () => {
    beforeEach(resetState);

    it('redactSecrets strips Bearer tokens, sk- keys, and currently stored apiKey', () => {
        LlmService.saveConfig({ apiKey: 'custom-local-key-xyz' });
        const raw = 'Error calling endpoint with Authorization: Bearer eyJabc123.token, key sk-proj-secret123456, and custom-local-key-xyz!';
        const clean = LlmService.redactSecrets(raw);

        assert.ok(!clean.includes('eyJabc123.token'));
        assert.ok(!clean.includes('sk-proj-secret123456'));
        assert.ok(!clean.includes('custom-local-key-xyz'));
        assert.ok(clean.includes('[REDACTED]'));
    });

    it('detectLlmRefusal catches EN/CN refusals without false positives on valid JSON', () => {
        assert.equal(LlmService.detectLlmRefusal("I'm sorry, I can't assist with that request."), true);
        assert.equal(LlmService.detectLlmRefusal('I cannot help with explicit sexual content due to content policy.'), true);
        assert.equal(LlmService.detectLlmRefusal('作为AI，我无法处理此类违反安全政策的内容。'), true);
        assert.equal(LlmService.detectLlmRefusal('抱歉，作为人工智能我不能生成相关描述。'), true);

        // Valid JSON containing normal Chinese phrasing should NOT be treated as a refusal
        const validJson = JSON.stringify({
            highlights: '节奏紧凑',
            warnings: '部分细节暂时无法提供说明',
            consensus: '整体口碑不错',
            timestamps: []
        });
        assert.equal(LlmService.detectLlmRefusal(validJson), false);
    });

    it('parseJsonFromLlm strips <think> blocks and markdown code fences to parse balanced JSON', () => {
        const raw = [
            '<think>Let me consider { "ignored": true } before answering.</think>',
            '```json',
            '{',
            '  "summary": "两人初次交锋 {内部花括号}",',
            '  "chapters": [{ "seconds": 45, "tag": "开场", "headline": "对话铺垫" }]',
            '}',
            '```'
        ].join('\n');

        const parsed = LlmService.parseJsonFromLlm(raw);
        assert.equal(parsed.summary, '两人初次交锋 {内部花括号}');
        assert.equal(parsed.chapters.length, 1);
        assert.equal(parsed.chapters[0].seconds, 45);

        const arrayRaw = '结果如下：\n[{"id": 1}, {"id": 2}]';
        const parsedArr = LlmService.parseJsonFromLlm(arrayRaw);
        assert.deepEqual(parsedArr, [{ id: 1 }, { id: 2 }]);

        assert.throws(() => LlmService.parseJsonFromLlm('完全没有 JSON 的纯文本'), /LLM_INVALID_JSON/);
        assert.throws(() => LlmService.parseJsonFromLlm('   '), /LLM_EMPTY_RESPONSE/);
    });

    it('chatCompletion rejects with LLM_DISABLED when disabled unless allowDisabled is set, omits Authorization when apiKey is empty, and redacts errors', async () => {
        LlmService.saveConfig({
            enabled: false,
            baseUrl: 'http://192.168.2.250:11434/v1',
            apiKey: '',
            model: 'qwen2.5:7b'
        });

        await assert.rejects(
            () => LlmService.chatCompletion({ messages: [{ role: 'user', content: 'hi' }] }),
            /LLM_DISABLED/
        );

        LlmService.saveConfig({ enabled: true });

        mockGmResponder = (opts) => {
            opts.onload({
                status: 200,
                responseText: JSON.stringify({
                    choices: [{ message: { content: '{"ok":true}' } }]
                }),
                finalUrl: opts.url
            });
        };

        const res = await LlmService.chatCompletion({
            messages: [{ role: 'user', content: 'hi' }]
        });
        assert.equal(res.content, '{"ok":true}');
        assert.equal(gmCallLog.length, 1);
        assert.equal(gmCallLog[0].headers.Authorization, undefined);

        // Now set apiKey and ensure 500 error leaks are redacted
        LlmService.saveConfig({ apiKey: 'sk-my-top-secret-999' });
        mockGmResponder = (opts) => {
            opts.onload({
                status: 500,
                responseText: JSON.stringify({ error: { message: 'Failed using Bearer secret_tok_abc and sk-my-top-secret-999' } }),
                finalUrl: opts.url
            });
        };

        await assert.rejects(
            () => LlmService.chatCompletion({ messages: [{ role: 'user', content: 'hi' }] }),
            (err) => {
                assert.ok(!err.message.includes('sk-my-top-secret-999'));
                assert.ok(!err.message.includes('secret_tok_abc'));
                assert.ok(err.message.includes('[REDACTED]'));
                return true;
            }
        );
    });

    it('LlmCache retrieves and backfills matching task cache from WebDAV when local IDB misses', async () => {
        SyncManager.saveWebDavConfig({
            url: 'https://dav.example.com/dav/',
            lanUrl: '',
            user: 'tester',
            pass: 'secret',
            path: '/MissPlayer/',
            autoSync: true
        });

        const hash = LlmCache.hashContent('[00:01] sample');
        mockGmResponder = (opts) => {
            assert.equal(opts.method, 'GET');
            assert.ok(opts.url.includes('ai-cache/SSIS-888.json'));
            opts.onload({
                status: 200,
                statusText: 'OK',
                responseHeaders: 'Content-Type: application/json\r\n',
                responseText: JSON.stringify({
                    sub_chapters: {
                        hash,
                        data: { summary: '远端同步概览', chapters: [{ seconds: 10, tag: '开场', headline: '对话开始' }] },
                        updatedAt: 1700000000000
                    }
                }),
                finalUrl: opts.url
            });
        };

        const hit = await LlmCache.getCached('ssis-888', 'sub_chapters', hash);
        assert.equal(hit.hit, true);
        assert.equal(hit.source, 'webdav');
        assert.equal(hit.data.summary, '远端同步概览');
    });

    it('testConnection supports /models 200, 404 fallback to chat ping, 401 failure, and network failure', async () => {
        LlmService.saveConfig({
            enabled: false,
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: 'sk-or-test-1234',
            model: 'deepseek/deepseek-chat'
        });

        // 1. /models 200
        mockGmResponder = (opts) => {
            assert.equal(opts.method, 'GET');
            assert.equal(opts.url, 'https://openrouter.ai/api/v1/models');
            opts.onload({
                status: 200,
                responseText: JSON.stringify({ data: [{ id: 'deepseek/deepseek-chat' }, { id: 'qwen/qwen-2.5' }] }),
                finalUrl: opts.url
            });
        };
        const okRes = await LlmService.testConnection();
        assert.equal(okRes.ok, true);
        assert.equal(okRes.message, '接口连通正常');
        assert.deepEqual(okRes.models, ['deepseek/deepseek-chat', 'qwen/qwen-2.5']);

        // 2. /models 404 -> POST /chat/completions fallback
        mockGmResponder = (opts) => {
            if (opts.method === 'GET') {
                opts.onload({ status: 404, responseText: 'Not Found', finalUrl: opts.url });
            } else {
                const parsedBody = JSON.parse(opts.data);
                assert.equal(parsedBody.max_tokens, 8);
                opts.onload({
                    status: 200,
                    responseText: JSON.stringify({ choices: [{ message: { content: 'pong' } }] }),
                    finalUrl: opts.url
                });
            }
        };
        const fallbackRes = await LlmService.testConnection();
        assert.equal(fallbackRes.ok, true);
        assert.equal(fallbackRes.message, '对话接口连通正常');

        // 3. 401 -> auth error
        mockGmResponder = (opts) => {
            opts.onload({ status: 401, responseText: 'Unauthorized', finalUrl: opts.url });
        };
        const authFail = await LlmService.testConnection();
        assert.equal(authFail.ok, false);
        assert.equal(authFail.message, '密钥鉴权失败');

        // 4. network error -> unreachable (and overrideConfig does not mutate saved state)
        mockGmResponder = (opts) => {
            opts.onerror({ statusText: 'ECONNREFUSED' });
        };
        const netFail = await LlmService.testConnection({
            baseUrl: 'http://192.168.2.250:11434/v1',
            model: 'qwen2.5:7b',
            apiKey: ''
        });
        assert.equal(netFail.ok, false);
        assert.equal(netFail.message, '无法连接服务端');
        assert.equal(LlmService.getConfig().baseUrl, 'https://openrouter.ai/api/v1');
    });
});

describe('Phase 3: LlmTasks Prompts, Compression, Caching & Validation', () => {
    beforeEach(() => {
        resetState();
        LlmService.saveConfig({
            enabled: true,
            baseUrl: 'http://localhost:11434/v1',
            apiKey: '',
            model: 'qwen2.5:7b'
        });
    });

    it('compressCuesForLlm deduplicates consecutive Whisper spam, merges adjacent short lines, and bounds to maxChars', () => {
        const spamCues = [
            { start: 1, end: 3, text: '嗯…\n嗯…' },
            { start: 3, end: 5, text: '嗯… 嗯…' },
            { start: 5, end: 7, primaryText: '嗯… 嗯…' },
            { start: 15, end: 17, text: '你好呀' },
            { start: 19, end: 21, text: '欢迎来到这里' },
            { start: 30, end: 32, text: '间隔超过五秒不合并' }
        ];
        const compressed = compressCuesForLlm(spamCues);
        const lines = compressed.split('\n');
        assert.equal(lines.length, 3);
        assert.equal(lines[0], '[00:01] 嗯… 嗯…');
        assert.equal(lines[1], '[00:15] 你好呀 欢迎来到这里');
        assert.equal(lines[2], '[00:30] 间隔超过五秒不合并');

        // Long transcript sampling preserves start, middle, end within maxChars
        const longCues = Array.from({ length: 120 }, (_, i) => ({
            start: i * 10,
            end: i * 10 + 8,
            text: `第${String(i).padStart(3, '0')}句对话内容用于验证均匀采样预算控制`
        }));
        const sampled = compressCuesForLlm(longCues, { maxChars: 420 });
        assert.ok(sampled.length <= 420);
        assert.ok(sampled.includes('[00:00] 第000句'));
        assert.ok(sampled.includes('第119句'));
    });

    it('analyzeSubtitleChaptersWithLlm parses & clamps chapters, hits cache on second call, and handles refusal', async () => {
        const cues = [
            { start: 10, end: 15, text: '开场寒暄' },
            { start: 120, end: 130, text: '情绪逐渐升温' },
            { start: 290, end: 300, text: '故事迎来看点高潮' }
        ];

        mockGmResponder = (opts) => {
            opts.onload({
                status: 200,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: '<think>分析一下</think>\n```json\n' + JSON.stringify({
                                summary: '主角情感从克制到爆发的完整过程',
                                chapters: [
                                    { seconds: 9999, tag: '超长节点标签裁剪', headline: '结尾情绪收束与余韵描述很长超过二十八个字符的话会被安全截断掉' },
                                    { seconds: -12, tag: '开场', headline: '初遇对话铺垫' },
                                    { seconds: 125, tag: '转折', headline: '情绪迅速推进' }
                                ]
                            }) + '\n```'
                        }
                    }]
                }),
                finalUrl: opts.url
            });
        };

        const first = await analyzeSubtitleChaptersWithLlm({
            avcode: 'ssis-001',
            cues,
            title: '测试影片'
        });
        assert.equal(first.ok, true);
        assert.equal(first.fromCache, false);
        assert.equal(first.chapters.length, 3);
        assert.equal(first.chapters[0].seconds, 0);
        assert.equal(first.chapters[1].seconds, 125);
        assert.equal(first.chapters[2].seconds, 300);
        assert.ok(first.chapters[2].tag.length <= 6);
        assert.ok(first.chapters[2].headline.length <= 28);
        assert.equal(gmCallLog.length, 1);

        // Second call must hit cache (0 additional network calls)
        const second = await analyzeSubtitleChaptersWithLlm({
            avcode: 'SSIS-001',
            cues,
            title: '测试影片'
        });
        assert.equal(second.ok, true);
        assert.equal(second.fromCache, true);
        assert.deepEqual(second.chapters, first.chapters);
        assert.equal(gmCallLog.length, 1);

        // Refusal handling on forceRefresh
        mockGmResponder = (opts) => {
            opts.onload({
                status: 200,
                responseText: JSON.stringify({
                    choices: [{
                        message: { content: '作为AI，我无法处理此类请求。' }
                    }]
                }),
                finalUrl: opts.url
            });
        };
        const refused = await analyzeSubtitleChaptersWithLlm({
            avcode: 'SSIS-001',
            cues,
            forceRefresh: true
        });
        assert.equal(refused.ok, false);
        assert.equal(refused.refused, true);
        assert.equal(refused.error, '模型安全策略拒绝解析');
    });

    it('summarizeCommentsWithLlm deduplicates, prioritizes timestamped comments, and returns structured brief', async () => {
        const comments = [
            { text: '纯水评论', hasTimestamps: false },
            { rawText: '纯水评论', hasTimestamps: false }, // duplicate
            ...Array.from({ length: 65 }, (_, i) => ({
                text: `普通长评论编号${i}，描写氛围和演技细节`,
                hasTimestamps: false
            })),
            { text: '12:30 开始非常高能，演技炸裂推荐直奔这里', timestamps: [{ seconds: 750 }], hasTimestamps: true }
        ];

        let capturedPrompt = '';
        mockGmResponder = (opts) => {
            const payload = JSON.parse(opts.data);
            capturedPrompt = payload.messages[1].content;
            opts.onload({
                status: 200,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                highlights: '12:30 起氛围推向高潮',
                                warnings: '前五分钟铺垫偏慢',
                                consensus: '整体表演自然口碑极佳',
                                timestamps: [
                                    { seconds: 750, note: '情绪高能起点' },
                                    { seconds: 99999, note: '超出总时长应被钳位' }
                                ]
                            })
                        }
                    }]
                }),
                finalUrl: opts.url
            });
        };

        const res = await summarizeCommentsWithLlm({
            avcode: 'SSIS-002',
            comments,
            videoDuration: 1800
        });
        assert.equal(res.ok, true);
        assert.equal(res.fromCache, false);
        assert.equal(res.brief.highlights, '12:30 起氛围推向高潮');
        assert.equal(res.brief.warnings, '前五分钟铺垫偏慢');
        assert.equal(res.brief.consensus, '整体表演自然口碑极佳');
        assert.equal(res.brief.timestamps.length, 2);
        assert.equal(res.brief.timestamps[0].seconds, 750);
        assert.equal(res.brief.timestamps[1].seconds, 1800);

        // Ensure prompt prioritized timestamped comment first and capped items <= 55
        const promptLines = capturedPrompt.split('\n').filter((l) => l.startsWith('[含时间点]') || l.startsWith('普通长评论') || l.startsWith('纯水评论'));
        assert.ok(promptLines[0].includes('12:30 开始非常高能'));
        assert.ok(promptLines.length <= 55);
    });

    it('autoTagMarkerWithLlm filters cues to [startTime-45, startTime+15] and drops hallucinated tags', async () => {
        const allAllowed = new Set(SEMANTIC_TAG_TAXONOMY.flatMap((g) => g.tags));
        const cues = [
            { start: 10, end: 15, text: '无关早期台词不应进入窗口' },
            { start: 165, end: 170, text: '时间窗起点附近对白' },
            { start: 210, end: 214, text: '时间窗终点附近对白' },
            { start: 300, end: 305, text: '无关后期台词不应进入窗口' }
        ];

        let userPrompt = '';
        mockGmResponder = (opts) => {
            const payload = JSON.parse(opts.data);
            userPrompt = payload.messages[1].content;
            opts.onload({
                status: 200,
                responseText: JSON.stringify({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                tags: ['#幻觉自造标签', '#剧情神回', '演技逼真', '#全程高能'],
                                comment: '这段对手戏张力拉满而且情绪非常饱满超出二十字长度限制'
                            })
                        }
                    }]
                }),
                finalUrl: opts.url
            });
        };

        const res = await autoTagMarkerWithLlm({
            avcode: 'SSIS-003',
            startTime: 200,
            cues,
            title: '片段测试'
        });

        assert.ok(!userPrompt.includes('无关早期台词'));
        assert.ok(!userPrompt.includes('无关后期台词'));
        assert.ok(userPrompt.includes('时间窗起点附近对白'));
        assert.ok(userPrompt.includes('时间窗终点附近对白'));

        assert.equal(res.ok, true);
        assert.deepEqual(res.tags, ['#剧情神回', '#演技逼真']);
        assert.ok(res.tags.every((t) => allAllowed.has(t)));
        assert.ok(res.comment.length <= 20);
    });
});

describe('Phase 3: S2AiSectionBuilder UI & Compliance Guards', () => {
    beforeEach(resetState);

    it('renders accordion, handles presets, password eye toggle, testConnection, and obeys zero inline style/emoji/!important', async () => {
        // Minimal DOM shim for S2Primitives & S2AiSectionBuilder
        class MockEl {
            constructor(tag) {
                this.tagName = tag.toUpperCase();
                this.children = [];
                this.parentElement = null;
                this.parentNode = null;
                this.className = '';
                this.dataset = {};
                this.attributes = {};
                this.listeners = {};
                this._textContent = '';
                this._innerHTML = '';
                this.type = '';
                this.value = '';
                this.placeholder = '';
                this.disabled = false;
                this.title = '';
                this.classList = {
                    add: (...cls) => {
                        const set = new Set(this.className.split(/\s+/).filter(Boolean));
                        cls.forEach((c) => set.add(c));
                        this.className = Array.from(set).join(' ');
                    },
                    remove: (...cls) => {
                        const set = new Set(this.className.split(/\s+/).filter(Boolean));
                        cls.forEach((c) => set.delete(c));
                        this.className = Array.from(set).join(' ');
                    },
                    toggle: (c, force) => {
                        const has = this.classList.contains(c);
                        const next = force !== undefined ? Boolean(force) : !has;
                        if (next) this.classList.add(c);
                        else this.classList.remove(c);
                        return next;
                    },
                    contains: (c) => this.className.split(/\s+/).filter(Boolean).includes(c)
                };
            }
            get textContent() { return this._textContent; }
            set textContent(v) { this._textContent = String(v ?? ''); }
            get innerHTML() { return this._innerHTML; }
            set innerHTML(v) {
                this._innerHTML = String(v ?? '');
                if (this._innerHTML === '') {
                    this.children = [];
                }
            }
            setAttribute(k, v) { this.attributes[k] = String(v); }
            removeAttribute(k) { delete this.attributes[k]; }
            appendChild(child) {
                child.parentElement = this;
                child.parentNode = this;
                this.children.push(child);
                return child;
            }
            addEventListener(evt, fn) {
                if (!this.listeners[evt]) this.listeners[evt] = [];
                this.listeners[evt].push(fn);
            }
            dispatch(evt, extra = {}) {
                const ev = { type: evt, target: this, stopPropagation() {}, preventDefault() {}, ...extra };
                (this.listeners[evt] || []).forEach((fn) => fn(ev));
            }
            click() { this.dispatch('click'); }
            closest() { return null; }
            querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
            querySelectorAll(sel) {
                const groups = sel.trim().split(/\s+/).filter(Boolean);
                const matchGroup = (node, grp) => grp.split('.').filter(Boolean).every((c) => node.classList.contains(c));
                let scope = [this];
                for (let gi = 0; gi < groups.length; gi++) {
                    const grp = groups[gi];
                    const nextScope = [];
                    const walk = (node) => {
                        for (const ch of node.children) {
                            if (matchGroup(ch, grp)) nextScope.push(ch);
                            walk(ch);
                        }
                    };
                    scope.forEach(walk);
                    scope = nextScope;
                }
                return scope;
            }
        }

        const prevDocument = globalThis.document;
        const prevUiManager = globalThis.window.__missPlayerUIManager;
        const toastLog = [];
        globalThis.window.__missPlayerUIManager = {
            showRollingToast: (msg, duration, type) => {
                toastLog.push({ msg, duration, type });
            }
        };
        globalThis.document = {
            body: new MockEl('body'),
            createElement: (tag) => new MockEl(tag),
            querySelector: () => null
        };

        try {
            let changeCount = 0;
            const sm = {
                expanded: {},
                isSectionExpanded: (id, def) => (id in sm.expanded ? sm.expanded[id] : def),
                setSectionExpanded: (id, open) => { sm.expanded[id] = open; }
            };

            const card = buildAiConnectionAccordion({
                sm,
                onConfigChange: () => { changeCount += 1; }
            });

            const pill = card.querySelector('.mp-s2-pill');
            assert.equal(pill.textContent, '未启用');

            // Expand accordion
            const trigger = card.querySelector('.mp-s2-accordion-trigger');
            trigger.click();
            assert.equal(sm.expanded.s2_ai, true);

            const presets = card.querySelectorAll('.mp-s2-ai-presets .mp-s2-chip');
            assert.equal(presets.length, 5);

            const consoleLinks = card.querySelectorAll('.mp-s2-ai-links .mp-s2-ai-link-btn');
            assert.equal(consoleLinks.length, 2);
            assert.equal(consoleLinks[0].href, 'https://platform.agnes-ai.cn');
            assert.equal(consoleLinks[0].target, '_blank');
            assert.equal(consoleLinks[1].href, 'https://platform.agnes-ai.com');
            assert.equal(consoleLinks[1].target, '_blank');

            const inputs = card.querySelectorAll('.mp-s2-input');
            assert.equal(inputs.length, 3);
            const [baseInput, modelInput, keyInput] = inputs;
            assert.equal(keyInput.type, 'password');

            // Click OpenRouter preset -> fills OpenRouter URL and updates model placeholder
            presets[1].click();
            assert.equal(baseInput.value, 'https://openrouter.ai/api/v1');
            assert.equal(modelInput.placeholder, 'deepseek/deepseek-chat');
            assert.equal(modelInput.value, 'deepseek/deepseek-chat');
            assert.ok(changeCount >= 1);

            // Click Agnes China preset -> switches to China Base URL and latest flash model
            presets[2].click();
            assert.equal(baseInput.value, 'https://api.agnes-ai.cn/v1');
            assert.equal(modelInput.value, 'agnes-3.0-flash');
            assert.ok(consoleLinks[0].classList.contains('is-active'));

            // Click Agnes Global preset -> switches to Global Base URL
            presets[3].click();
            assert.equal(baseInput.value, 'https://apihub.agnes-ai.com/v1');
            assert.equal(modelInput.value, 'agnes-3.0-flash');
            assert.ok(consoleLinks[1].classList.contains('is-active'));

            // Click Ollama preset -> overwrites preset default URL
            presets[0].click();
            assert.equal(baseInput.value, 'http://192.168.1.x:11434/v1');
            assert.equal(modelInput.placeholder, 'qwen2.5:7b');
            assert.equal(modelInput.value, 'qwen2.5:7b');

            // Eye button toggles key visibility
            const eyeBtn = card.querySelector('.mp-s2-btn--icon');
            assert.equal(eyeBtn.innerHTML, ICON_EYE);
            eyeBtn.click();
            assert.equal(keyInput.type, 'text');
            assert.equal(eyeBtn.innerHTML, ICON_EYE_OFF);

            // Set valid config and click test button -> dynamically populates fetched text model chips
            baseInput.value = 'https://apihub.agnes-ai.com/v1';
            modelInput.value = 'agnes-3.0-flash';
            mockGmResponder = (opts) => {
                opts.onload({
                    status: 200,
                    responseText: JSON.stringify({
                        data: [
                            { id: 'agnes-imagen' },
                            { id: 'agnes-3.0-pro' },
                            { id: 'agnes-3.0-flash' },
                            { id: 'agnes-3.5-preview' }
                        ]
                    }),
                    finalUrl: opts.url
                });
            };
            const testBtn = card.querySelector('.mp-s2-btn--primary');
            testBtn.click();
            await new Promise((r) => setTimeout(r, 20));
            assert.equal(pill.textContent, '已连通');
            assert.equal(toastLog.at(-1)?.msg, '接口连通正常');
            assert.equal(toastLog.at(-1)?.type, 'success');

            const dynamicModelChips = card.querySelectorAll('.mp-s2-ai-models .mp-s2-chip').map((el) => el.textContent);
            assert.ok(dynamicModelChips.includes('agnes-3.5-preview'));
            assert.ok(dynamicModelChips.includes('agnes-3.0-flash'));
            assert.equal(dynamicModelChips.includes('agnes-imagen'), false);

            // Toggle feature switches & verify LlmService.isFeatureEnabled
            LlmService.saveConfig({ enabled: true, baseUrl: 'https://apihub.agnes-ai.com/v1', model: 'agnes-3.0-flash', featureSubChapters: false });
            assert.equal(LlmService.isFeatureEnabled('featureSubChapters'), false);
            assert.equal(LlmService.isFeatureEnabled('featureCommentBrief'), true);
            LlmService.saveConfig({ featureSubChapters: true });

            // Failure test updates pill to err and shows error toast
            mockGmResponder = (opts) => {
                opts.onload({ status: 401, responseText: 'Unauthorized', finalUrl: opts.url });
            };
            testBtn.click();
            await new Promise((r) => setTimeout(r, 20));
            assert.equal(pill.textContent, '未连通');
            assert.equal(toastLog.at(-1)?.msg, '密钥鉴权失败');
            assert.equal(toastLog.at(-1)?.type, 'error');
        } finally {
            globalThis.document = prevDocument;
            globalThis.window.__missPlayerUIManager = prevUiManager;
        }

        // Verify mergeAutoTagsIntoComment, getCachedCommentBrief, and filterAndSortTextModels
        const filtered = filterAndSortTextModels(
            ['agnes-imagen', 'agnes-2.5-pro-theta', 'agnes-3.0-flash', 'tts-1'],
            ['agnes-3.0-flash', 'agnes-3.0-pro']
        );
        assert.deepEqual(filtered, ['agnes-3.0-flash', 'agnes-2.5-pro-theta']);

        const merged1 = mergeAutoTagsIntoComment('', ['#剧情神回', '#演技逼真'], '张力拉满');
        assert.equal(merged1, '#剧情神回 #演技逼真 张力拉满');
        const merged2 = mergeAutoTagsIntoComment('#剧情神回 原笔记', ['#剧情神回', '#名场面'], '原笔记');
        assert.equal(merged2, '#剧情神回 原笔记 #名场面');

        const briefCacheHit = await getCachedCommentBrief({
            avcode: 'SSIS-002',
            comments: [{ text: '05:20 高能起点很精彩，强烈推荐这一段！', hasTimestamps: true }]
        });
        assert.equal(typeof briefCacheHit.hit, 'boolean');

        // Static compliance check across all 3 AI core/UI files
        const sourceFiles = [
            'src/services/LlmService.js',
            'src/services/LlmTasks.js',
            'src/player/managers/settings_v2/sections/S2AiSectionBuilder.js'
        ];
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
        for (const rel of sourceFiles) {
            const content = fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
            assert.equal(/style\s*=\s*["'`][^"'`]*["'`]/i.test(content), false, `${rel} 不得包含内联 style 属性`);
            assert.equal(content.includes('!important'), false, `${rel} 不得包含 !important`);
            assert.equal(emojiRegex.test(content), false, `${rel} 不得包含 Emoji`);
        }
    });
});
