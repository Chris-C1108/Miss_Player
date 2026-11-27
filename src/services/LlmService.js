/**
 * LlmService & LlmCache — BYOK OpenAI-Compatible AI 服务层与双层结果缓存
 *
 * 职责：
 * 1. 管理本地持久化配置（默认关闭，API Key 仅存本机，不同步至云端）
 * 2. 安全校验接口地址（强制 HTTPS，仅对 localhost / 私网 LAN / .local / .lan / .ts.net 放行 HTTP，禁止内嵌凭据）
 * 3. 解析 /chat/completions 与 /models 端点、脱敏密钥、识别模型安全策略拒绝、剥离 <think> 与 Markdown 代码块解析 JSON
 * 4. 统一通过 fetchWithTransport (preferGM: true) 发起跨域请求与连通性探测
 * 5. 提供 IndexedDB + WebDAV 远端漫游的确定性哈希缓存（LlmCache）
 */

import { fetchWithTransport } from '../utils/http.js';
import { getValue, setValue } from '../utils/storage.js';
import { idbGet, idbSet, idbDelete, idbGetAll, STORES } from '../utils/indexedDB.js';
import { WebDavClient } from '../sync/WebDavClient.js';
import { SyncManager } from '../sync/SyncManager.js';

export const LLM_KEY_ENABLED = 'mp_llm_enabled';
export const LLM_KEY_BASE_URL = 'mp_llm_base_url';
export const LLM_KEY_API_KEY = 'mp_llm_api_key';
export const LLM_KEY_MODEL = 'mp_llm_model';
export const LLM_KEY_TIMEOUT_MS = 'mp_llm_timeout_ms';
export const LLM_KEY_FEAT_SUB_CHAPTERS = 'mp_llm_feat_sub_chapters';
export const LLM_KEY_FEAT_COMMENT_BRIEF = 'mp_llm_feat_comment_brief';
export const LLM_KEY_FEAT_AUTO_TAG = 'mp_llm_feat_auto_tag';
export const LLM_KEY_AUTO_TAG_ON_MARK = 'mp_llm_auto_tag_on_mark';
export const LLM_KEY_FEAT_HIGHLIGHT_FUSION = 'mp_llm_feat_highlight_fusion';
export const LLM_KEY_VIBE_TAGS = 'mp_llm_vibe_tags';
export const LLM_KEY_CACHE_EPOCH = 'mp_llm_cache_epoch';
export const LLM_KEY_AI_DEBUG_ENABLED = 'mp_llm_debug_enabled';
export const LLM_KEY_AI_DEBUG_WEBDAV_DIR = 'mp_llm_debug_webdav_dir';
export const LLM_KEY_PROVIDERS = 'mp_llm_providers';
export const LLM_KEY_ACTIVE_PROVIDER_ID = 'mp_llm_active_provider_id';

export const DEFAULT_AI_DEBUG_DIR = 'logs/ai-debug';

export const AI_PROVIDER_PRESETS = [
    {
        id: 'agnes-cn',
        label: 'Agnes 中国站',
        baseUrl: 'https://api.agnes-ai.cn/v1',
        basePlaceholder: 'https://api.agnes-ai.cn/v1',
        modelPlaceholder: 'agnes-3.0-flash',
        consoleUrl: 'https://platform.agnes-ai.cn'
    },
    {
        id: 'agnes-global',
        label: 'Agnes 国际站',
        baseUrl: 'https://apihub.agnes-ai.com/v1',
        basePlaceholder: 'https://apihub.agnes-ai.com/v1',
        modelPlaceholder: 'agnes-3.0-flash',
        consoleUrl: 'https://platform.agnes-ai.com'
    },
    {
        id: 'gemini',
        label: 'Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        basePlaceholder: 'https://generativelanguage.googleapis.com/v1beta/openai',
        modelPlaceholder: 'gemini-2.5-flash',
        consoleUrl: 'https://aistudio.google.com/apikey'
    },
    {
        id: 'openai-compat',
        label: 'OpenAI 兼容',
        baseUrl: '',
        basePlaceholder: 'https://api.openai.com/v1',
        modelPlaceholder: 'gpt-4o-mini',
        consoleUrl: ''
    }
];

export function detectProviderPresetId(baseUrl) {
    const clean = String(baseUrl || '').toLowerCase();
    if (clean.includes('agnes-ai.cn')) return 'agnes-cn';
    if (clean.includes('agnes-ai.com')) return 'agnes-global';
    if (clean.includes('generativelanguage.googleapis.com')) return 'gemini';
    return 'openai-compat';
}

export function getPresetMeta(presetId) {
    return AI_PROVIDER_PRESETS.find((p) => p.id === presetId) || AI_PROVIDER_PRESETS[3];
}

export function parseApiKeys(raw) {
    const arr = Array.isArray(raw)
        ? raw
        : String(raw ?? '').split(/[\r\n,;]+/);
    const seen = new Set();
    const out = [];
    for (const item of arr) {
        const key = String(item || '').trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(key);
    }
    return out;
}

export function maskApiKey(rawKey) {
    const key = String(rawKey || '').trim();
    if (!key) return '';
    if (key.length <= 8) return `${key.slice(0, 2)}***`;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function sanitizeDebugDir(rawDir) {
    const clean = String(rawDir ?? '')
        .trim()
        .replace(/\\/g, '/')
        .split('/')
        .map((seg) => seg.trim())
        .filter((seg) => seg && seg !== '.' && seg !== '..')
        .join('/');
    return clean || DEFAULT_AI_DEBUG_DIR;
}

function normalizeVibeTags(raw) {
    let arr = [];
    if (Array.isArray(raw)) {
        arr = raw;
    } else if (typeof raw === 'string' && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed;
        } catch (_) {
            arr = raw.split(/[,\s]+/);
        }
    }
    const seen = new Set();
    const out = [];
    for (const item of arr) {
        const clean = String(item || '').replace(/^#+/, '').trim().slice(0, 12);
        if (!clean || seen.has(clean)) continue;
        seen.add(clean);
        out.push(clean);
        if (out.length >= 6) break;
    }
    return out;
}

const NON_CHAT_MODEL_RE = /(?:imagen|sora|veo|kling|runway|seedance|midjourney|flux|stable-diffusion|dall-e|embedding|whisper|tts|audio|speech|realtime|sys1|-image$|\/image)/i;

/**
 * 过滤并排序文本对话模型列表，将推荐/最新模型置前
 * @param {string[]} rawModels
 * @param {string[]} [preferredModels]
 * @returns {string[]}
 */
export function filterAndSortTextModels(rawModels = [], preferredModels = []) {
    const seen = new Set();
    const cleaned = [];
    for (const item of Array.isArray(rawModels) ? rawModels : []) {
        const id = String(item || '').trim();
        if (!id || seen.has(id) || NON_CHAT_MODEL_RE.test(id)) continue;
        seen.add(id);
        cleaned.push(id);
    }
    const rankMap = new Map();
    (Array.isArray(preferredModels) ? preferredModels : []).forEach((id, idx) => {
        const clean = String(id || '').trim();
        if (clean && !rankMap.has(clean)) rankMap.set(clean, idx);
    });
    return cleaned.sort((a, b) => {
        const ra = rankMap.has(a) ? rankMap.get(a) : Number.MAX_SAFE_INTEGER;
        const rb = rankMap.has(b) ? rankMap.get(b) : Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return 0;
    });
}

const DEFAULT_TIMEOUT_MS = 60000;
const MIN_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 120000;
const TEST_CONNECTION_TIMEOUT_MS = 10000;

const REFUSAL_PHRASES = [
    'i cannot',
    "i can't assist",
    "i'm sorry, i can't",
    "sorry, i can't",
    'i am unable to',
    'violates our policy',
    'content policy',
    'explicit sexual',
    '作为ai',
    '作为 ai',
    '作为一个ai',
    '作为一个 ai',
    '作为人工智能',
    '无法协助',
    '无法提供',
    '无法处理此类',
    '违反安全政策',
    '涉及不当内容',
    '我不能生成'
];

const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const RE_LAN_192 = new RegExp(`^192\\.168\\.${IPV4_OCTET}\\.${IPV4_OCTET}$`);
const RE_LAN_10 = new RegExp(`^10\\.${IPV4_OCTET}\\.${IPV4_OCTET}\\.${IPV4_OCTET}$`);
const RE_LAN_172 = new RegExp(`^172\\.(1[6-9]|2\\d|3[01])\\.${IPV4_OCTET}\\.${IPV4_OCTET}$`);

function parseBooleanValue(val, fallback = false) {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val === null || val === undefined ? fallback : Boolean(val);
}

function clampTimeout(rawTimeout, fallback = DEFAULT_TIMEOUT_MS) {
    const num = Number(rawTimeout);
    if (!Number.isFinite(num) || num <= 0) return fallback;
    return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, Math.round(num)));
}

function isPrivateOrLoopbackHost(hostname) {
    if (!hostname) return false;
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1') {
        return true;
    }
    if (RE_LAN_192.test(h) || RE_LAN_10.test(h) || RE_LAN_172.test(h)) {
        return true;
    }
    if (
        (h.endsWith('.local') && h.length > 6) ||
        (h.endsWith('.lan') && h.length > 4) ||
        (h.endsWith('.ts.net') && h.length > 7)
    ) {
        return true;
    }
    return false;
}

function stripThinkBlocks(text) {
    return String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function stripMarkdownFences(text) {
    return String(text || '')
        .replace(/```(?:json)?\s*/gi, '')
        .replace(/```/g, '')
        .trim();
}

/**
 * 字符串感知的括号配对提取器：从文本中定位并解析第一个合法 JSON 对象或数组
 * @param {string} sourceText
 * @returns {{ parsed: any, jsonText: string } | null}
 */
function extractFirstBalancedJson(sourceText) {
    const text = String(sourceText || '');
    for (let start = 0; start < text.length; start++) {
        const opener = text[start];
        if (opener !== '{' && opener !== '[') continue;

        const stack = [opener === '{' ? '}' : ']'];
        let inString = false;
        let escaped = false;

        for (let i = start + 1; i < text.length; i++) {
            const ch = text[i];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }

            if (ch === '"') {
                inString = true;
            } else if (ch === '{') {
                stack.push('}');
            } else if (ch === '[') {
                stack.push(']');
            } else if (ch === '}' || ch === ']') {
                if (stack.length === 0 || stack[stack.length - 1] !== ch) {
                    break;
                }
                stack.pop();
                if (stack.length === 0) {
                    const candidate = text.slice(start, i + 1);
                    try {
                        const parsed = JSON.parse(candidate);
                        return { parsed, jsonText: candidate };
                    } catch (_) {
                        break;
                    }
                }
            }
        }
    }
    return null;
}

function extractMessageContent(payload) {
    const choice = payload?.choices?.[0];
    if (!choice) return '';
    const msgContent = choice.message?.content;
    if (typeof msgContent === 'string') return msgContent;
    if (Array.isArray(msgContent)) {
        return msgContent
            .map((part) => (typeof part === 'string' ? part : (part?.text || '')))
            .join('');
    }
    if (typeof choice.text === 'string') return choice.text;
    return '';
}

let rrProviderCursor = 0;
const rrKeyCursors = new Map();

export class LlmService {
    /**
     * 校验并规范化 LLM Base URL
     * @param {string} rawUrl
     * @returns {string}
     */
    static sanitizeBaseUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        const trimmed = rawUrl.trim();
        if (!trimmed) return '';
        try {
            const parsed = new URL(trimmed);
            if (!parsed.hostname) return '';
            if (parsed.username || parsed.password) return '';

            const isHttps = parsed.protocol === 'https:';
            const isAllowedHttp = parsed.protocol === 'http:' && isPrivateOrLoopbackHost(parsed.hostname);
            if (!isHttps && !isAllowedHttp) return '';

            const pathNoTrailing = (parsed.pathname || '').replace(/\/+$/, '');
            return `${parsed.origin}${pathNoTrailing}`;
        } catch (_) {
            return '';
        }
    }

    /**
     * 解析对话补全接口地址
     * @param {string} baseUrl
     * @returns {string}
     */
    static resolveChatEndpoint(baseUrl) {
        const clean = this.sanitizeBaseUrl(baseUrl);
        if (!clean) return '';
        const lower = clean.toLowerCase();
        if (lower.endsWith('/chat/completions')) {
            return clean;
        }
        if (
            lower.endsWith('/v1') ||
            lower.endsWith('/api/v1') ||
            lower.endsWith('/v1beta/openai')
        ) {
            return `${clean}/chat/completions`;
        }
        return `${clean}/v1/chat/completions`;
    }

    /**
     * 解析模型列表探活接口地址
     * @param {string} baseUrl
     * @returns {string}
     */
    static resolveModelsEndpoint(baseUrl) {
        const clean = this.sanitizeBaseUrl(baseUrl);
        if (!clean) return '';
        const lower = clean.toLowerCase();
        if (lower.endsWith('/chat/completions')) {
            return `${clean.slice(0, -'/chat/completions'.length)}/models`;
        }
        if (
            lower.endsWith('/v1') ||
            lower.endsWith('/api/v1') ||
            lower.endsWith('/v1beta/openai')
        ) {
            return `${clean}/models`;
        }
        if (/\/v1(?:\/|$)/i.test(lower)) {
            return `${clean}/models`;
        }
        return `${clean}/v1/models`;
    }

    static sanitizeProvider(raw, fallbackIdx = 0) {
        const src = raw && typeof raw === 'object' ? raw : {};
        const cleanBase = 'baseUrl' in src ? this.sanitizeBaseUrl(src.baseUrl) : '';
        const presetId = src.presetId && AI_PROVIDER_PRESETS.some((p) => p.id === src.presetId)
            ? src.presetId : detectProviderPresetId(cleanBase);
        const preset = getPresetMeta(presetId);
        const id = String(src.id || presetId || `openai-compat-${fallbackIdx + 1}`).trim() || `provider-${fallbackIdx + 1}`;
        const apiKeys = parseApiKeys(Array.isArray(src.apiKeys) && src.apiKeys.length > 0 ? src.apiKeys : (src.apiKey || ''));
        return {
            id,
            presetId,
            name: String(src.name || preset.label || id).trim(),
            baseUrl: cleanBase,
            model: String(src.model || '').trim(),
            apiKeys,
            apiKey: apiKeys[0] || '',
            enabled: parseBooleanValue(src.enabled, true),
            models: Array.isArray(src.models) ? filterAndSortTextModels(src.models) : []
        };
    }

    static getConfig() {
        const enabled = parseBooleanValue(getValue(LLM_KEY_ENABLED, false), false);
        const legacyBaseUrl = this.sanitizeBaseUrl(getValue(LLM_KEY_BASE_URL, ''));
        const legacyApiKey = String(getValue(LLM_KEY_API_KEY, '') || '').trim();
        const legacyModel = String(getValue(LLM_KEY_MODEL, '') || '').trim();

        let rawProviders = getValue(LLM_KEY_PROVIDERS, []);
        if (typeof rawProviders === 'string') {
            try { rawProviders = JSON.parse(rawProviders); } catch (_) { rawProviders = []; }
        }
        const seenIds = new Set();
        let providers = (Array.isArray(rawProviders) ? rawProviders : [])
            .map((item, idx) => this.sanitizeProvider(item, idx))
            .filter((p) => p.id && !seenIds.has(p.id) && seenIds.add(p.id));

        if (providers.length === 0 && (legacyBaseUrl || legacyModel || legacyApiKey)) {
            const pid = detectProviderPresetId(legacyBaseUrl);
            providers = [this.sanitizeProvider({
                id: pid, presetId: pid, name: getPresetMeta(pid).label,
                baseUrl: legacyBaseUrl, model: legacyModel, apiKeys: parseApiKeys(legacyApiKey), enabled: true
            })];
        }

        let activeProviderId = String(getValue(LLM_KEY_ACTIVE_PROVIDER_ID, '') || '').trim();
        const active = providers.find((p) => p.id === activeProviderId) || providers[0] || null;
        activeProviderId = active ? active.id : (activeProviderId || 'agnes-cn');
        const apiKeys = active ? [...active.apiKeys] : parseApiKeys(legacyApiKey);

        return {
            enabled,
            baseUrl: active ? active.baseUrl : legacyBaseUrl,
            apiKey: apiKeys[0] || '',
            apiKeys,
            model: active ? active.model : legacyModel,
            providers,
            activeProviderId,
            timeoutMs: clampTimeout(getValue(LLM_KEY_TIMEOUT_MS, DEFAULT_TIMEOUT_MS), DEFAULT_TIMEOUT_MS),
            featureSubChapters: parseBooleanValue(getValue(LLM_KEY_FEAT_SUB_CHAPTERS, true), true),
            featureCommentBrief: parseBooleanValue(getValue(LLM_KEY_FEAT_COMMENT_BRIEF, true), true),
            featureAutoTag: parseBooleanValue(getValue(LLM_KEY_FEAT_AUTO_TAG, true), true),
            autoTagOnMark: parseBooleanValue(getValue(LLM_KEY_AUTO_TAG_ON_MARK, false), false),
            featureHighlightFusion: parseBooleanValue(getValue(LLM_KEY_FEAT_HIGHLIGHT_FUSION, true), true),
            vibeTags: normalizeVibeTags(getValue(LLM_KEY_VIBE_TAGS, [])),
            aiDebugEnabled: parseBooleanValue(getValue(LLM_KEY_AI_DEBUG_ENABLED, false), false),
            aiDebugDir: sanitizeDebugDir(getValue(LLM_KEY_AI_DEBUG_WEBDAV_DIR, DEFAULT_AI_DEBUG_DIR))
        };
    }

    static saveConfig(patch = {}) {
        const prev = this.getConfig();
        const next = {
            ...prev,
            providers: prev.providers.map((p) => ({ ...p, apiKeys: [...p.apiKeys], models: [...(p.models || [])] }))
        };

        for (const [k, def] of [
            ['enabled', false], ['featureSubChapters', true], ['featureCommentBrief', true],
            ['featureAutoTag', true], ['autoTagOnMark', false], ['featureHighlightFusion', true], ['aiDebugEnabled', false]
        ]) {
            if (k in patch) next[k] = parseBooleanValue(patch[k], def);
        }
        if ('timeoutMs' in patch) next.timeoutMs = clampTimeout(patch.timeoutMs, prev.timeoutMs);
        if ('vibeTags' in patch) next.vibeTags = normalizeVibeTags(patch.vibeTags);
        if ('aiDebugDir' in patch) next.aiDebugDir = sanitizeDebugDir(patch.aiDebugDir);
        if ('providers' in patch && Array.isArray(patch.providers)) {
            const seenIds = new Set();
            next.providers = patch.providers
                .map((item, idx) => this.sanitizeProvider(item, idx))
                .filter((p) => p.id && !seenIds.has(p.id) && seenIds.add(p.id));
        }
        if ('activeProviderId' in patch) {
            next.activeProviderId = String(patch.activeProviderId || '').trim() || next.activeProviderId;
        }

        const hasScalar = 'baseUrl' in patch || 'model' in patch || 'apiKey' in patch || 'apiKeys' in patch;
        if (hasScalar) {
            const nextBase = 'baseUrl' in patch ? (String(patch.baseUrl ?? '').trim() === '' ? '' : this.sanitizeBaseUrl(patch.baseUrl)) : prev.baseUrl;
            const nextModel = 'model' in patch ? String(patch.model ?? '').trim() : prev.model;
            const nextKeys = 'apiKeys' in patch ? parseApiKeys(patch.apiKeys) : ('apiKey' in patch ? parseApiKeys(patch.apiKey) : [...prev.apiKeys]);
            let idx = next.providers.findIndex((p) => p.id === next.activeProviderId);
            if (idx < 0 && next.providers.length > 0 && !('activeProviderId' in patch)) idx = 0;
            if (idx >= 0) {
                next.providers[idx] = this.sanitizeProvider({ ...next.providers[idx], baseUrl: nextBase, model: nextModel, apiKeys: nextKeys }, idx);
                next.activeProviderId = next.providers[idx].id;
            } else if (nextBase || nextModel || nextKeys.length > 0) {
                const pid = detectProviderPresetId(nextBase);
                const created = this.sanitizeProvider({
                    id: next.activeProviderId || pid, presetId: pid, name: getPresetMeta(pid).label,
                    baseUrl: nextBase, model: nextModel, apiKeys: nextKeys, enabled: true
                });
                next.providers.push(created);
                next.activeProviderId = created.id;
            }
        }

        const active = next.providers.find((p) => p.id === next.activeProviderId) || next.providers[0] || null;
        if (active) {
            next.activeProviderId = active.id;
            next.baseUrl = active.baseUrl;
            next.model = active.model;
            next.apiKeys = [...active.apiKeys];
            next.apiKey = active.apiKeys[0] || '';
        } else {
            next.baseUrl = '';
            next.model = '';
            next.apiKeys = [];
            next.apiKey = '';
        }

        for (const [storageKey, val] of [
            [LLM_KEY_ENABLED, next.enabled], [LLM_KEY_BASE_URL, next.baseUrl], [LLM_KEY_API_KEY, next.apiKey],
            [LLM_KEY_MODEL, next.model], [LLM_KEY_TIMEOUT_MS, next.timeoutMs],
            [LLM_KEY_FEAT_SUB_CHAPTERS, next.featureSubChapters], [LLM_KEY_FEAT_COMMENT_BRIEF, next.featureCommentBrief],
            [LLM_KEY_FEAT_AUTO_TAG, next.featureAutoTag], [LLM_KEY_AUTO_TAG_ON_MARK, next.autoTagOnMark],
            [LLM_KEY_FEAT_HIGHLIGHT_FUSION, next.featureHighlightFusion], [LLM_KEY_VIBE_TAGS, next.vibeTags],
            [LLM_KEY_AI_DEBUG_ENABLED, next.aiDebugEnabled], [LLM_KEY_AI_DEBUG_WEBDAV_DIR, next.aiDebugDir],
            [LLM_KEY_PROVIDERS, next.providers], [LLM_KEY_ACTIVE_PROVIDER_ID, next.activeProviderId]
        ]) {
            setValue(storageKey, val);
        }
        return next;
    }

    static getRotationPool(cfg = null) {
        const resolved = cfg || this.getConfig();
        const ready = (Array.isArray(resolved.providers) ? resolved.providers : [])
            .filter((p) => p && p.enabled !== false && p.baseUrl && p.model);
        if (ready.length > 0) return ready;
        if (resolved.baseUrl && resolved.model) {
            const keys = parseApiKeys(resolved.apiKeys?.length ? resolved.apiKeys : resolved.apiKey);
            return [{
                id: resolved.activeProviderId || detectProviderPresetId(resolved.baseUrl),
                baseUrl: resolved.baseUrl,
                model: resolved.model,
                apiKeys: keys,
                enabled: true
            }];
        }
        return [];
    }

    static isConfigured() {
        return this.getRotationPool().length > 0;
    }

    static isEnabled() {
        const cfg = this.getConfig();
        return Boolean(cfg.enabled && this.getRotationPool(cfg).length > 0);
    }

    static isAiDebugEnabled() {
        return parseBooleanValue(getValue(LLM_KEY_AI_DEBUG_ENABLED, false), false);
    }

    /**
     * 判断特定 AI 子功能是否开启（同时依赖 AI 总开关及至少一个有效提供商就绪）
     * @param {'featureSubChapters'|'featureCommentBrief'|'featureAutoTag'|'autoTagOnMark'|'featureHighlightFusion'} [featureKey]
     * @returns {boolean}
     */
    static isFeatureEnabled(featureKey = '') {
        const cfg = this.getConfig();
        if (!cfg.enabled || this.getRotationPool(cfg).length === 0) return false;
        if (!featureKey) return true;
        return Boolean(cfg[featureKey]);
    }

    /**
     * 脱敏错误日志或提示文本中的全部 API Key / Bearer Token
     * @param {string} text
     * @returns {string}
     */
    static redactSecrets(text) {
        if (text === null || text === undefined) return '';
        let out = String(text);
        const cfg = this.getConfig();
        const secrets = new Set();
        const scalarKey = String(getValue(LLM_KEY_API_KEY, '') || '').trim();
        if (scalarKey.length >= 4) secrets.add(scalarKey);
        for (const k of cfg.apiKeys || []) {
            if (k && k.length >= 4) secrets.add(k);
        }
        for (const p of cfg.providers || []) {
            for (const k of p.apiKeys || []) {
                if (k && k.length >= 4) secrets.add(k);
            }
        }
        const sorted = Array.from(secrets).sort((a, b) => b.length - a.length);
        for (const secret of sorted) {
            const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            out = out.replace(new RegExp(escaped, 'g'), '[REDACTED]');
        }
        out = out.replace(/\bBearer\s+(?!\[REDACTED\])[^\s"';,]+/gi, 'Bearer [REDACTED]');
        out = out.replace(/\bsk-[A-Za-z0-9_-]{3,}(?:\.[A-Za-z0-9_-]+)*/g, '[REDACTED]');
        return out;
    }

    /**
     * 检测模型是否以安全策略/身份声明拒绝执行任务
     * @param {string} text
     * @returns {boolean}
     */
    static detectLlmRefusal(text) {
        if (!text || typeof text !== 'string') return false;
        const visible = stripThinkBlocks(text) || text;
        const normalized = visible
            .replace(/[\u2018\u2019]/g, "'")
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        const hasRefusalPhrase = REFUSAL_PHRASES.some((phrase) => normalized.includes(phrase));
        if (!hasRefusalPhrase) return false;

        const cleaned = stripMarkdownFences(visible);
        const extracted = extractFirstBalancedJson(cleaned);
        if (!extracted) return true;

        const { parsed, jsonText } = extracted;
        const isStructuredPayload =
            (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ||
            (Array.isArray(parsed) && parsed.some((item) => item && typeof item === 'object'));

        if (!isStructuredPayload) return true;

        const outsideProse = cleaned
            .replace(jsonText, ' ')
            .replace(/[\u2018\u2019]/g, "'")
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        if (outsideProse.length >= 12 && REFUSAL_PHRASES.some((p) => outsideProse.includes(p))) {
            return true;
        }
        return false;
    }

    /**
     * 从模型返回文本中剥离思考标签与代码围栏并解析首个合法 JSON
     * @param {string|Object} raw
     * @returns {any}
     */
    static parseJsonFromLlm(raw) {
        const source = (raw && typeof raw === 'object' && typeof raw.content === 'string')
            ? raw.content
            : raw;
        if (typeof source !== 'string' || !source.trim()) {
            throw new Error('LLM_EMPTY_RESPONSE: 模型返回内容为空');
        }

        const trimmed = stripMarkdownFences(stripThinkBlocks(source));
        const firstBrace = trimmed.search(/[{[]/);
        const direct = extractFirstBalancedJson(trimmed);
        if (direct && (firstBrace < 0 || trimmed.indexOf(direct.jsonText) === firstBrace)) {
            return direct.parsed;
        }

        // 兜底修复模型偶发漏左引号 ("key": 文本",) 或末尾多逗号导致的根节点解析跌落片段问题
        const repaired = trimmed
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/("(?:[^"\\]|\\.)+"\s*:\s*)([^"\s[{\d\-tfn][^\n"]*?)"(\s*(?:,|}|\]))/g, '$1"$2"$3');
        const salvaged = extractFirstBalancedJson(repaired);
        if (salvaged) return salvaged.parsed;
        if (direct) return direct.parsed;

        throw new Error('LLM_INVALID_JSON: 无法从模型响应中提取有效 JSON');
    }

    static resetRotationState() {
        rrProviderCursor = 0;
        rrKeyCursors.clear();
    }

    static _pushRotatedKeys(out, providerId, baseUrl, model, rawKeys, cursorKey) {
        const keys = Array.isArray(rawKeys) && rawKeys.length > 0 ? rawKeys : [''];
        const start = (rrKeyCursors.get(cursorKey) || 0) % keys.length;
        rrKeyCursors.set(cursorKey, (start + 1) % 1000000);
        for (let i = 0; i < keys.length; i++) {
            out.push({ providerId, baseUrl, model, apiKey: keys[(start + i) % keys.length] });
        }
    }

    static _buildRotationCandidates(override, cfg) {
        const out = [];
        if (override) {
            const baseUrl = this.sanitizeBaseUrl(override.baseUrl);
            const model = String(override.model || '').trim();
            if (!baseUrl || !model) throw new Error('LLM_NOT_CONFIGURED: 请先配置接口地址与模型名称');
            const keys = parseApiKeys(override.apiKeys?.length ? override.apiKeys : (override.apiKey || ''));
            this._pushRotatedKeys(out, override.id || detectProviderPresetId(baseUrl), baseUrl, model, keys, `override:${baseUrl}`);
            return out;
        }
        const pool = this.getRotationPool(cfg);
        if (pool.length === 0) throw new Error('LLM_NOT_CONFIGURED: 请先配置接口地址与模型名称');
        const pStart = rrProviderCursor % pool.length;
        rrProviderCursor = (rrProviderCursor + 1) % 1000000;
        for (let i = 0; i < pool.length; i++) {
            const p = pool[(pStart + i) % pool.length];
            this._pushRotatedKeys(out, p.id, p.baseUrl, p.model, p.apiKeys, p.id);
        }
        return out;
    }

    static async _dispatchSingleChat(cand, messages, { temperature, maxTokens, timeoutMs, allowTransientRetry }) {
        const endpoint = this.resolveChatEndpoint(cand.baseUrl);
        if (!endpoint) {
            throw new Error('LLM_INVALID_BASE_URL');
        }
        const headers = { 'Content-Type': 'application/json' };
        if (cand.apiKey) {
            headers.Authorization = `Bearer ${cand.apiKey}`;
        }
        const bodyJson = JSON.stringify({
            model: cand.model,
            messages,
            temperature,
            max_tokens: maxTokens
        });

        let res = null;
        const maxAttempts = allowTransientRetry ? 2 : 1;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                res = await fetchWithTransport(endpoint, {
                    method: 'POST',
                    headers,
                    body: bodyJson,
                    timeout: timeoutMs,
                    preferGM: true
                });
                if (attempt + 1 < maxAttempts && (res.status === 502 || res.status === 503 || res.status === 504)) continue;
                break;
            } catch (reqErr) {
                const msg = String(reqErr?.message || '');
                if (attempt + 1 < maxAttempts && /NETWORK_TIMEOUT|NETWORK_ERROR|TIMEOUT/i.test(msg)) continue;
                throw reqErr;
            }
        }

        if (res.status === 401 || res.status === 403) {
            throw new Error(`LLM_AUTH_FAILED (${res.status}): 密钥鉴权失败`);
        }
        if (res.status < 200 || res.status >= 300) {
            let errDetail = '';
            try {
                const errJson = JSON.parse(res.html || '{}');
                errDetail = errJson?.error?.message || errJson?.message || '';
            } catch (_) {
                errDetail = String(res.html || '').slice(0, 160);
            }
            throw new Error(`LLM_HTTP_${res.status}${errDetail ? `: ${errDetail}` : ''}`);
        }

        let payload;
        try {
            payload = JSON.parse(res.html || '');
        } catch (_) {
            throw new Error('LLM_INVALID_RESPONSE: 服务端返回非 JSON 响应');
        }

        const content = extractMessageContent(payload);
        if (!content || !content.trim()) {
            throw new Error('LLM_EMPTY_RESPONSE: 模型返回内容为空');
        }

        if (this.detectLlmRefusal(content)) {
            const refusedErr = new Error('LLM_REFUSED');
            refusedErr.refused = true;
            throw refusedErr;
        }

        return {
            content,
            model: payload?.model || cand.model,
            usage: payload?.usage || null,
            providerId: cand.providerId
        };
    }

    /**
     * 发起 OpenAI-Compatible Chat Completions 请求（支持多 Key / 多提供商轮询与自动故障转移）
     * @param {Object} params
     * @param {Object} [options]
     * @returns {Promise<{ content: string, model: string, usage: Object|null, providerId?: string }>}
     */
    static async chatCompletion(
        { messages, temperature = 0.2, maxTokens = 900, timeoutMs = null, allowDisabled = false, bypassEnabled = false, configOverride = null } = {},
        options = {}
    ) {
        const override = options?.configOverride || configOverride;
        const cfg = this.getConfig();
        const canBypassEnabled = Boolean(options?.allowDisabled || options?.bypassEnabled || allowDisabled || bypassEnabled);

        if (!override && !cfg.enabled && !canBypassEnabled && this.getRotationPool(cfg).length > 0) {
            throw new Error('LLM_DISABLED');
        }
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('LLM_INVALID_MESSAGES');
        }

        const candidates = this._buildRotationCandidates(override, cfg);
        if (!override && !cfg.enabled && !canBypassEnabled) {
            throw new Error('LLM_DISABLED');
        }

        const effectiveTimeout = clampTimeout(timeoutMs || cfg.timeoutMs, cfg.timeoutMs);
        const allowTransientRetry = candidates.length === 1;
        let lastErr = null;

        for (const cand of candidates) {
            try {
                return await this._dispatchSingleChat(cand, messages, {
                    temperature,
                    maxTokens,
                    timeoutMs: effectiveTimeout,
                    allowTransientRetry
                });
            } catch (err) {
                lastErr = err;
            }
        }

        if (lastErr?.refused || lastErr?.message === 'LLM_REFUSED') {
            throw lastErr;
        }
        const safeMsg = this.redactSecrets(lastErr?.message || String(lastErr || 'LLM_REQUEST_FAILED'));
        throw new Error(safeMsg);
    }

    static _resolveTargetConfig(overrideConfig) {
        const saved = this.getConfig();
        if (!overrideConfig) return saved;
        return {
            enabled: overrideConfig.enabled ?? saved.enabled,
            baseUrl: 'baseUrl' in overrideConfig ? this.sanitizeBaseUrl(overrideConfig.baseUrl) : saved.baseUrl,
            apiKeys: parseApiKeys(
                overrideConfig.apiKeys?.length ? overrideConfig.apiKeys
                    : ('apiKey' in overrideConfig ? overrideConfig.apiKey : saved.apiKeys)
            ),
            model: 'model' in overrideConfig ? String(overrideConfig.model ?? '').trim() : saved.model,
            timeoutMs: saved.timeoutMs
        };
    }

    /** 从 /models 获取可用模型列表 */
    static async fetchModels(overrideConfig = null) {
        const cfg = this._resolveTargetConfig(overrideConfig);
        if (!cfg.baseUrl) return { ok: false, message: '请填写有效的接口地址', models: [] };
        const endpoint = this.resolveModelsEndpoint(cfg.baseUrl);
        const keys = cfg.apiKeys?.length > 0 ? cfg.apiKeys : [''];
        let sawAuthFail = false;

        for (const key of keys) {
            try {
                const res = await fetchWithTransport(endpoint, {
                    method: 'GET',
                    headers: key ? { Authorization: `Bearer ${key}` } : {},
                    timeout: TEST_CONNECTION_TIMEOUT_MS,
                    preferGM: true
                });
                if (res.status === 401 || res.status === 403) { sawAuthFail = true; continue; }
                if (res.status >= 200 && res.status < 300) {
                    const parsed = JSON.parse(res.html || '{}');
                    const list = Array.isArray(parsed?.data) ? parsed.data : (Array.isArray(parsed?.models) ? parsed.models : null);
                    if (list) {
                        return { ok: true, message: '接口连通正常', models: list.map((x) => (typeof x === 'string' ? x : (x?.id || x?.name || ''))).filter(Boolean) };
                    }
                    return { ok: false, message: '', models: [], unsupported: true };
                }
                if (res.status === 404 || res.status === 405 || res.status === 501) {
                    return { ok: false, message: '', models: [], unsupported: true };
                }
                return { ok: false, message: this.redactSecrets(`服务端响应异常 (HTTP ${res.status})`), models: [] };
            } catch (_) {
                return { ok: false, message: '无法连接服务端', models: [] };
            }
        }
        return sawAuthFail
            ? { ok: false, message: '密钥鉴权失败', models: [], authFailed: true }
            : { ok: false, message: '无法连接服务端', models: [] };
    }

    /** 测试 AI 接口与模型连通性 */
    static async testConnection(overrideConfig = null) {
        const cfg = this._resolveTargetConfig(overrideConfig);
        if (!cfg.baseUrl) return { ok: false, message: '请填写有效的接口地址', models: [] };
        if (!cfg.model) return { ok: false, message: '请先填写模型名称', models: [] };

        const modelsRes = await this.fetchModels(cfg);
        if (modelsRes.ok) return { ok: true, message: modelsRes.message, models: modelsRes.models };
        if (!modelsRes.unsupported) return { ok: false, message: modelsRes.message || '无法连接服务端', models: [] };

        const endpoint = this.resolveChatEndpoint(cfg.baseUrl);
        const keys = cfg.apiKeys?.length > 0 ? cfg.apiKeys : [''];
        let sawAuthFail = false;

        for (const key of keys) {
            const headers = { 'Content-Type': 'application/json' };
            if (key) headers.Authorization = `Bearer ${key}`;
            try {
                const res = await fetchWithTransport(endpoint, {
                    method: 'POST', headers,
                    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: 'ping' }], temperature: 0, max_tokens: 8 }),
                    timeout: TEST_CONNECTION_TIMEOUT_MS, preferGM: true
                });
                if (res.status === 401 || res.status === 403) { sawAuthFail = true; continue; }
                if (res.status >= 200 && res.status < 300) {
                    const parsed = JSON.parse(res.html || '{}');
                    if (Array.isArray(parsed?.choices)) return { ok: true, message: '对话接口连通正常', models: [] };
                }
                return { ok: false, message: this.redactSecrets(`对话接口异常 (HTTP ${res.status})`), models: [] };
            } catch (_) {
                return { ok: false, message: '无法连接服务端', models: [] };
            }
        }
        return { ok: false, message: sawAuthFail ? '密钥鉴权失败' : '无法连接服务端', models: [] };
    }
}

const memoryCache = new Map();

function buildCacheKey(code, taskType) {
    return `ai_cache:${code}:${taskType}`;
}

export class LlmCache {
    /**
     * 确定性 FNV-1a 32-bit 十六进制摘要
     * @param {string} str
     * @returns {string}
     */
    static hashContent(str) {
        let hash = 0x811c9dc5;
        const input = String(str ?? '');
        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
    }

    /**
     * 读取当前缓存纪元时间戳（清空缓存时刷新，用于使历史 IDB/WebDAV 旧结果自然失效）
     * @returns {number}
     */
    static getCacheEpoch() {
        return Number(getValue(LLM_KEY_CACHE_EPOCH, 0)) || 0;
    }

    /**
     * 清空本地 AI 缓存并刷新纪元，阻断 WebDAV 历史旧版本回填
     * @returns {Promise<{ clearedLocal: number, epoch: number }>}
     */
    static async clearAll() {
        memoryCache.clear();
        let clearedLocal = 0;
        try {
            const all = await idbGetAll(STORES.MEDIA);
            for (const rec of Array.isArray(all) ? all : []) {
                if (typeof rec?.key === 'string' && rec.key.startsWith('ai_cache:')) {
                    const ok = await idbDelete(STORES.MEDIA, rec.key);
                    if (ok) clearedLocal += 1;
                }
            }
        } catch (_) {}

        const prevEpoch = this.getCacheEpoch();
        const epoch = Math.max(Date.now(), prevEpoch + 1);
        setValue(LLM_KEY_CACHE_EPOCH, epoch);
        return { clearedLocal, epoch };
    }

    /**
     * 清空进程内内存二级兜底缓存（主要供测试环境隔离使用）
     */
    static clearMemoryCache() {
        memoryCache.clear();
    }

    /**
     * 读取 AI 任务缓存（IndexedDB 优先 -> 内存兜底 -> WebDAV 跨端回填，受 Cache Epoch 失效门控保护）
     * @param {string} avcode
     * @param {string} taskType
     * @param {string} contentHash
     * @returns {Promise<{ hit: boolean, source?: string, data: any }>}
     */
    static async getCached(avcode, taskType, contentHash) {
        const code = String(avcode || '').trim().toUpperCase();
        if (!code || !taskType) {
            return { hit: false, data: null };
        }

        const cacheKey = buildCacheKey(code, taskType);
        const epoch = this.getCacheEpoch();
        const isNotStale = (rec) => !(epoch > 0 && (Number(rec?.updatedAt) || 0) < epoch);

        try {
            const rec = await idbGet(STORES.MEDIA, cacheKey);
            if (rec && rec.hash === contentHash && rec.data && isNotStale(rec)) {
                memoryCache.set(cacheKey, rec);
                return { hit: true, source: 'idb', data: rec.data };
            }
        } catch (_) {}

        const memRec = memoryCache.get(cacheKey);
        if (memRec && memRec.hash === contentHash && memRec.data && isNotStale(memRec)) {
            return { hit: true, source: 'memory', data: memRec.data };
        }

        const cfg = SyncManager.getWebDavConfig();
        if (WebDavClient.hasValidEndpoint(cfg)) {
            try {
                const remote = await WebDavClient.downloadFile(cfg, `ai-cache/${code}.json`);
                const remoteEntry = remote && typeof remote === 'object' ? remote[taskType] : null;
                if (remoteEntry && remoteEntry.hash === contentHash && remoteEntry.data && isNotStale(remoteEntry)) {
                    const data = remoteEntry.data;
                    const rec = {
                        hash: contentHash,
                        data,
                        updatedAt: Number(remoteEntry.updatedAt) || Date.now()
                    };
                    memoryCache.set(cacheKey, rec);
                    try {
                        await idbSet(STORES.MEDIA, cacheKey, rec);
                    } catch (_) {}
                    return { hit: true, source: 'webdav', data };
                }
            } catch (_) {}
        }

        return { hit: false, data: null };
    }

    /**
     * 写入 AI 任务缓存（本地立即落盘，WebDAV 静默增量合并）
     * @param {string} avcode
     * @param {string} taskType
     * @param {string} contentHash
     * @param {any} data
     * @returns {Promise<boolean>}
     */
    static async setCached(avcode, taskType, contentHash, data) {
        const code = String(avcode || '').trim().toUpperCase();
        if (!code || !taskType) return false;

        const cacheKey = buildCacheKey(code, taskType);
        const rec = {
            hash: contentHash,
            data,
            updatedAt: Date.now()
        };

        memoryCache.set(cacheKey, rec);
        try {
            await idbSet(STORES.MEDIA, cacheKey, rec);
        } catch (_) {}

        const cfg = SyncManager.getWebDavConfig();
        if (WebDavClient.hasValidEndpoint(cfg)) {
            Promise.resolve().then(async () => {
                try {
                    let existing = {};
                    try {
                        const remote = await WebDavClient.downloadFile(cfg, `ai-cache/${code}.json`);
                        if (remote && typeof remote === 'object' && !Array.isArray(remote)) {
                            existing = remote;
                        }
                    } catch (_) {}

                    const merged = {
                        ...existing,
                        [taskType]: {
                            hash: contentHash,
                            data,
                            updatedAt: rec.updatedAt
                        }
                    };
                    await WebDavClient.uploadFile(
                        cfg,
                        `ai-cache/${code}.json`,
                        merged,
                        'application/json; charset=utf-8'
                    );
                } catch (_) {}
            });
        }

        return true;
    }
}
