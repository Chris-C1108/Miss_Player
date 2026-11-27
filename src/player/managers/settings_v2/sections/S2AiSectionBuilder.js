/**
 * S2AiSectionBuilder — Settings V2 AI 服务手风琴配置卡片
 *
 * 严格遵循 Apple HIG 与现代 CSS 治理规范：
 * - 零内联样式，零强制覆盖，零 Emoji
 * - 密钥仅存本机，绝不同步至 WebDAV / 社区库
 */

import {
    createAccordionCard,
    createToggleRow,
    createField,
    updatePill,
    bindTwoStepConfirm,
    bindFocusScroll
} from '../components/S2Primitives.js';
import { LlmService, LlmCache, filterAndSortTextModels } from '../../../../services/LlmService.js';
import { AiDebugLogger } from '../../../../services/AiDebugLogger.js';
import { parseBatchCodes, loadSavedBatchText } from '../../../../services/AiBatchTestRunner.js';
import { BatchTestFloatModal } from '../../../ui/BatchTestFloatModal.js';
import { SubtitleRepository } from '../../../subtitles/SubtitleRepository.js';
import { SyncManager, WebDavClient } from '../../../../sync/index.js';
import { Toast } from '../../../../utils/index.js';
import {
    ICON_EYE,
    ICON_EYE_OFF,
    ICON_EXTERNAL_LINK,
    ICON_SERVER,
    ICON_TRASH,
    ICON_CLOUD_UPLOAD
} from '../../../../constants/icons.js';

const PRESET_OLLAMA = {
    id: 'ollama',
    label: '本地 Ollama',
    baseUrl: 'http://192.168.1.x:11434/v1',
    basePlaceholder: 'http://192.168.1.x:11434/v1',
    modelDefault: 'qwen2.5:7b',
    modelPlaceholder: 'qwen2.5:7b',
    recommendedModels: ['qwen2.5:7b', 'qwen2.5:14b', 'deepseek-r1:8b']
};

const PRESET_OPENROUTER = {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    basePlaceholder: 'https://openrouter.ai/api/v1',
    modelDefault: 'deepseek/deepseek-chat',
    modelPlaceholder: 'deepseek/deepseek-chat',
    recommendedModels: ['deepseek/deepseek-chat', 'google/gemini-2.5-flash']
};

const PRESET_AGNES_CN = {
    id: 'agnes-cn',
    label: 'Agnes 中国站',
    baseUrl: 'https://api.agnes-ai.cn/v1',
    basePlaceholder: 'https://api.agnes-ai.cn/v1',
    modelDefault: 'agnes-3.0-flash',
    modelPlaceholder: 'agnes-3.0-flash',
    recommendedModels: ['agnes-3.0-flash', 'agnes-3.0-pro', 'agnes-2.5-pro-theta'],
    consoleUrl: 'https://platform.agnes-ai.cn'
};

const PRESET_AGNES_GLOBAL = {
    id: 'agnes-global',
    label: 'Agnes 国际站',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    basePlaceholder: 'https://apihub.agnes-ai.com/v1',
    modelDefault: 'agnes-3.0-flash',
    modelPlaceholder: 'agnes-3.0-flash',
    recommendedModels: ['agnes-3.0-flash', 'agnes-3.0-pro', 'agnes-2.5-pro-theta'],
    consoleUrl: 'https://platform.agnes-ai.com'
};

const PRESET_CUSTOM = {
    id: 'custom',
    label: '自定义',
    baseUrl: '',
    basePlaceholder: 'https://api.example.com/v1',
    modelDefault: '',
    modelPlaceholder: 'gpt-4o-mini',
    recommendedModels: []
};

const AI_PRESETS = [
    PRESET_OLLAMA,
    PRESET_OPENROUTER,
    PRESET_AGNES_CN,
    PRESET_AGNES_GLOBAL,
    PRESET_CUSTOM
];

const PRESET_DEFAULT_URLS = new Set([
    PRESET_OLLAMA.baseUrl,
    PRESET_OPENROUTER.baseUrl,
    PRESET_AGNES_CN.baseUrl,
    PRESET_AGNES_GLOBAL.baseUrl
]);

const PRESET_DEFAULT_MODELS = new Set(
    AI_PRESETS.map((p) => p.modelDefault).filter(Boolean)
);

function resolveStatusMeta(cfg) {
    if (!cfg?.enabled) {
        return { text: '未启用', tone: 'muted' };
    }
    if (cfg.baseUrl && cfg.model) {
        return { text: '已配置', tone: 'ok' };
    }
    return { text: '待完善', tone: 'warn' };
}

function detectInitialPresetId(baseUrl) {
    const clean = String(baseUrl || '').toLowerCase();
    if (!clean) return 'ollama';
    if (clean.includes('agnes-ai.cn')) return 'agnes-cn';
    if (clean.includes('agnes-ai.com')) return 'agnes-global';
    if (clean.includes('openrouter.ai')) return 'openrouter';
    if (
        clean.includes('localhost') ||
        clean.includes('127.0.0.1') ||
        clean.includes('192.168.') ||
        clean.includes(':11434') ||
        clean.includes('.local') ||
        clean.includes('.lan') ||
        clean.includes('.ts.net')
    ) {
        return 'ollama';
    }
    return 'custom';
}

function createConsoleLink(label, href, titleText) {
    const link = document.createElement('a');
    link.className = 'mp-s2-btn mp-s2-ai-link-btn';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = titleText || href;
    link.innerHTML = `<span>${label}</span>${ICON_EXTERNAL_LINK}`;
    link.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    return link;
}

/**
 * 构建 AI 服务手风琴配置卡片 DOM
 * @param {{ sm?: Object, iconSvg?: string, onConfigChange?: Function|null }} [options]
 * @returns {HTMLElement}
 */
export function buildAiConnectionAccordion({ sm = null, iconSvg = '', onConfigChange = null } = {}) {
    const initialCfg = LlmService.getConfig();
    const initialStatus = resolveStatusMeta(initialCfg);
    const isExpanded = sm && typeof sm.isSectionExpanded === 'function'
        ? sm.isSectionExpanded('s2_ai', false)
        : false;

    const accordion = createAccordionCard({
        iconSvg: iconSvg || ICON_SERVER,
        title: 'AI 服务',
        statusText: initialStatus.text,
        statusTone: initialStatus.tone,
        expanded: isExpanded,
        onToggle: (open) => {
            if (sm && typeof sm.setSectionExpanded === 'function') {
                sm.setSectionExpanded('s2_ai', open);
            }
        },
        buildBody: (body, { setStatus }) => {
            const cfg = LlmService.getConfig();
            let activePresetId = detectInitialPresetId(cfg.baseUrl);
            let enableRow = null;
            let baseField = null;
            let modelField = null;
            let keyField = null;
            let subChaptersRow = null;
            let commentBriefRow = null;
            let highlightFusionRow = null;
            let autoTagRow = null;
            let autoTagOnMarkRow = null;
            let featuresBox = null;
            let autoTagMarkWrap = null;
            let aiDebugRow = null;
            let aiDebugWrap = null;
            let aiDebugDirInput = null;
            let aiDebugHint = null;
            let fetchedModels = [];
            let activeVibeTags = Array.isArray(cfg.vibeTags) ? [...cfg.vibeTags] : [];

            const syncHeaderPill = (text, tone) => {
                const pillEl = body.parentElement?.querySelector?.('.mp-s2-pill');
                if (pillEl) {
                    updatePill(pillEl, text, tone);
                } else {
                    setStatus(text, tone);
                }
            };

            const syncDebugHint = (debugDir) => {
                if (!aiDebugHint) return;
                const wdCfg = SyncManager.getWebDavConfig();
                if (!WebDavClient.hasValidEndpoint(wdCfg)) {
                    aiDebugHint.textContent = '提示：请先在下方「WebDAV 同步」配置服务器地址与凭据';
                    return;
                }
                const root = String(wdCfg.path || '/MissPlayer/').replace(/\/+$/, '') || '/MissPlayer';
                const summary = AiDebugLogger.getSummary();
                const execInfo = summary.sessionCount > 0
                    ? ` · 已记录 ${summary.sessionCount} 部 / ${summary.totalExecutions} 次调用`
                    : '';
                aiDebugHint.textContent = `存储路径: ${root}/${debugDir}/${execInfo}`;
            };

            const syncFeatureVisibility = (enabledVal, autoTagVal, aiDebugVal) => {
                if (featuresBox) {
                    featuresBox.classList.toggle('is-hidden', !enabledVal);
                }
                if (autoTagMarkWrap) {
                    autoTagMarkWrap.classList.toggle('is-hidden', !autoTagVal);
                }
                if (aiDebugWrap) {
                    aiDebugWrap.classList.toggle('is-hidden', !aiDebugVal);
                }
            };

            const persistConfig = () => {
                const prev = LlmService.getConfig();
                const saved = LlmService.saveConfig({
                    enabled: enableRow ? enableRow.getChecked() : prev.enabled,
                    baseUrl: baseField ? baseField.input.value : '',
                    model: modelField ? modelField.input.value : '',
                    apiKey: keyField ? keyField.input.value : '',
                    featureSubChapters: subChaptersRow ? subChaptersRow.getChecked() : prev.featureSubChapters,
                    featureCommentBrief: commentBriefRow ? commentBriefRow.getChecked() : prev.featureCommentBrief,
                    featureHighlightFusion: highlightFusionRow ? highlightFusionRow.getChecked() : prev.featureHighlightFusion,
                    featureAutoTag: autoTagRow ? autoTagRow.getChecked() : prev.featureAutoTag,
                    autoTagOnMark: autoTagOnMarkRow ? autoTagOnMarkRow.getChecked() : prev.autoTagOnMark,
                    vibeTags: activeVibeTags,
                    aiDebugEnabled: aiDebugRow ? aiDebugRow.getChecked() : prev.aiDebugEnabled,
                    aiDebugDir: aiDebugDirInput ? aiDebugDirInput.value : prev.aiDebugDir
                });
                if (aiDebugDirInput && aiDebugDirInput.value !== saved.aiDebugDir) {
                    aiDebugDirInput.value = saved.aiDebugDir;
                }
                syncFeatureVisibility(saved.enabled, saved.featureAutoTag, saved.aiDebugEnabled);
                syncDebugHint(saved.aiDebugDir);
                const meta = resolveStatusMeta(saved);
                syncHeaderPill(meta.text, meta.tone);
                if (typeof onConfigChange === 'function') {
                    onConfigChange(saved);
                }
                return saved;
            };

            // 1. 启用总开关
            enableRow = createToggleRow({
                title: '启用 AI 服务',
                subtext: '用于字幕分幕、评论简报与高光打标，手动触发不自动消耗',
                checked: Boolean(cfg.enabled),
                onChange: () => {
                    persistConfig();
                }
            });
            body.appendChild(enableRow.element);

            // 2. 表单主体
            const form = document.createElement('div');
            form.className = 'mp-s2-form';

            // 2.1 服务商快捷预设
            const presetsWrap = document.createElement('div');
            presetsWrap.className = 'mp-s2-chips mp-s2-ai-presets';

            const linksWrap = document.createElement('div');
            linksWrap.className = 'mp-s2-ai-links';
            const cnLink = createConsoleLink(
                '获取 Agnes Key（中国站）',
                PRESET_AGNES_CN.consoleUrl,
                '打开 Agnes AI 中国站控制台 (platform.agnes-ai.cn)'
            );
            const globalLink = createConsoleLink(
                '获取 Agnes Key（国际站）',
                PRESET_AGNES_GLOBAL.consoleUrl,
                '打开 Agnes AI 国际站控制台 (platform.agnes-ai.com)'
            );
            cnLink.dataset.preset = PRESET_AGNES_CN.id;
            globalLink.dataset.preset = PRESET_AGNES_GLOBAL.id;
            linksWrap.appendChild(cnLink);
            linksWrap.appendChild(globalLink);

            const presetButtons = new Map();
            const updatePresetHighlight = () => {
                presetButtons.forEach((btn, id) => {
                    btn.classList.toggle('is-active', id === activePresetId);
                });
                cnLink.classList.toggle('is-active', activePresetId === PRESET_AGNES_CN.id);
                globalLink.classList.toggle('is-active', activePresetId === PRESET_AGNES_GLOBAL.id);
            };

            const modelsWrap = document.createElement('div');
            modelsWrap.className = 'mp-s2-chips mp-s2-ai-models';

            const renderModelChips = () => {
                const preset = AI_PRESETS.find((p) => p.id === activePresetId) || PRESET_CUSTOM;
                const baseList = fetchedModels.length > 0
                    ? fetchedModels
                    : (preset.recommendedModels || []);
                const unique = filterAndSortTextModels(baseList, preset.recommendedModels).slice(0, 6);
                const currentModel = modelField ? modelField.input.value.trim() : '';

                modelsWrap.innerHTML = '';
                modelsWrap.classList.toggle('is-hidden', unique.length === 0);

                unique.forEach((modelId) => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = `mp-s2-chip ${modelId === currentModel ? 'is-active' : ''}`.trim();
                    chip.textContent = modelId;
                    chip.dataset.model = modelId;
                    chip.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (modelField) {
                            modelField.input.value = modelId;
                        }
                        renderModelChips();
                        persistConfig();
                    });
                    modelsWrap.appendChild(chip);
                });
            };

            AI_PRESETS.forEach((preset) => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = `mp-s2-chip ${preset.id === activePresetId ? 'is-active' : ''}`.trim();
                chip.textContent = preset.label;
                chip.dataset.preset = preset.id;

                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activePresetId = preset.id;
                    fetchedModels = [];
                    updatePresetHighlight();

                    if (baseField && modelField) {
                        baseField.input.placeholder = preset.basePlaceholder;
                        modelField.input.placeholder = preset.modelPlaceholder;

                        const currentBase = baseField.input.value.trim();
                        if (preset.id === 'custom') {
                            if (PRESET_DEFAULT_URLS.has(currentBase)) {
                                baseField.input.value = '';
                            }
                        } else if (!currentBase || PRESET_DEFAULT_URLS.has(currentBase)) {
                            baseField.input.value = preset.baseUrl;
                        }

                        const currentModel = modelField.input.value.trim();
                        if (preset.id === 'custom') {
                            if (PRESET_DEFAULT_MODELS.has(currentModel)) {
                                modelField.input.value = '';
                            }
                        } else if (!currentModel || PRESET_DEFAULT_MODELS.has(currentModel)) {
                            modelField.input.value = preset.modelDefault || '';
                        }
                    }
                    renderModelChips();
                    persistConfig();
                });

                presetButtons.set(preset.id, chip);
                presetsWrap.appendChild(chip);
            });

            // 2.2 接口地址、模型名称与本机密钥
            const activePreset = AI_PRESETS.find((p) => p.id === activePresetId) || PRESET_OLLAMA;

            baseField = createField({
                label: '接口地址',
                value: cfg.baseUrl || '',
                placeholder: activePreset.basePlaceholder || PRESET_OLLAMA.basePlaceholder,
                onChange: () => {
                    const detected = detectInitialPresetId(baseField.input.value);
                    if (detected !== activePresetId) {
                        activePresetId = detected;
                        fetchedModels = [];
                        updatePresetHighlight();
                        renderModelChips();
                    }
                    persistConfig();
                }
            });

            modelField = createField({
                label: '模型名称',
                value: cfg.model || '',
                placeholder: activePreset.modelPlaceholder || PRESET_OLLAMA.modelPlaceholder,
                onChange: () => {
                    renderModelChips();
                    persistConfig();
                }
            });
            modelField.element.appendChild(modelsWrap);

            let keyVisible = false;
            const eyeBtn = document.createElement('button');
            eyeBtn.type = 'button';
            eyeBtn.className = 'mp-s2-btn mp-s2-btn--icon';
            eyeBtn.innerHTML = ICON_EYE;
            eyeBtn.title = '显示或隐藏密钥';
            eyeBtn.setAttribute('aria-label', '显示或隐藏密钥');

            keyField = createField({
                label: '密钥 (本地模型可留空)',
                type: 'password',
                value: cfg.apiKey || '',
                placeholder: 'sk-...',
                trailingEl: eyeBtn,
                onChange: () => {
                    persistConfig();
                }
            });

            eyeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                keyVisible = !keyVisible;
                keyField.input.type = keyVisible ? 'text' : 'password';
                eyeBtn.innerHTML = keyVisible ? ICON_EYE_OFF : ICON_EYE;
            });

            const hintLine = document.createElement('div');
            hintLine.className = 'mp-s2-meta-line';
            hintLine.textContent = '密钥仅存本机，不同步至云端；中国站与国际站底座地址相互独立';

            // 2.3 状态提示框与连通性测试按钮
            const statusBox = document.createElement('div');
            statusBox.className = 'mp-s2-status-box is-hidden';

            const actionsRow = document.createElement('div');
            actionsRow.className = 'mp-s2-actions';

            const testBtn = document.createElement('button');
            testBtn.type = 'button';
            testBtn.className = 'mp-s2-btn mp-s2-btn--primary';
            testBtn.innerHTML = `${ICON_SERVER} <span>测试 AI 连通性</span>`;

            testBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                persistConfig();
                testBtn.disabled = true;
                syncHeaderPill('测试中…', 'info');
                statusBox.className = 'mp-s2-status-box is-running';
                statusBox.textContent = '正在检测 AI 接口连通性…';

                try {
                    const res = await LlmService.testConnection();
                    if (res && res.ok) {
                        if (Array.isArray(res.models) && res.models.length > 0) {
                            const preset = AI_PRESETS.find((p) => p.id === activePresetId);
                            fetchedModels = filterAndSortTextModels(res.models, preset?.recommendedModels);
                            if (modelField && !modelField.input.value.trim() && fetchedModels[0]) {
                                modelField.input.value = fetchedModels[0];
                                persistConfig();
                            }
                            renderModelChips();
                        }
                        const modelCountNote = Array.isArray(res.models) && res.models.length > 0
                            ? `（可用模型 ${res.models.length} 个）`
                            : '';
                        const okMsg = `${res.message || '接口连通正常'}${modelCountNote}`;
                        syncHeaderPill('已连通', 'ok');
                        statusBox.className = 'mp-s2-status-box is-ok';
                        statusBox.textContent = okMsg;
                        Toast(res.message || '接口连通正常', 2200, 'success');
                    } else {
                        const errMsg = res?.message || '无法连接服务端';
                        syncHeaderPill('未连通', 'err');
                        statusBox.className = 'mp-s2-status-box is-err';
                        statusBox.textContent = errMsg;
                        Toast(errMsg, 2500, 'error');
                    }
                } catch (err) {
                    const fallbackMsg = LlmService.redactSecrets(err?.message || '无法连接服务端');
                    syncHeaderPill('未连通', 'err');
                    statusBox.className = 'mp-s2-status-box is-err';
                    statusBox.textContent = fallbackMsg;
                    Toast(fallbackMsg, 2500, 'error');
                } finally {
                    testBtn.disabled = false;
                }
            });

            const clearCacheBtn = document.createElement('button');
            clearCacheBtn.type = 'button';
            clearCacheBtn.className = 'mp-s2-btn mp-s2-btn--danger';
            clearCacheBtn.innerHTML = `${ICON_TRASH} <span>清空 AI 缓存</span>`;
            bindTwoStepConfirm(clearCacheBtn, {
                idleHtml: `${ICON_TRASH} <span>清空 AI 缓存</span>`,
                confirmHtml: '<span>确认清空全部缓存？</span>',
                onConfirm: async () => {
                    const res = await LlmCache.clearAll();
                    statusBox.className = 'mp-s2-status-box is-ok';
                    statusBox.textContent = `已清空本地 AI 缓存（${res.clearedLocal} 项）并忽略云端历史版本`;
                    Toast('AI 缓存已清空，下次将强制重算', 2200, 'success');
                    if (typeof onConfigChange === 'function') {
                        onConfigChange(LlmService.getConfig());
                    }
                }
            });

            actionsRow.appendChild(testBtn);
            actionsRow.appendChild(clearCacheBtn);

            // 2.4 AI 能力按需分项开关
            featuresBox = document.createElement('div');
            featuresBox.className = 'mp-s2-conditional mp-s2-ai-features';

            subChaptersRow = createToggleRow({
                title: 'AI 字幕分幕',
                subtext: '字幕面板显示 AI 分幕按钮并提炼剧情节点',
                checked: Boolean(cfg.featureSubChapters),
                onChange: () => persistConfig()
            });

            commentBriefRow = createToggleRow({
                title: 'AI 评论简报',
                subtext: '评论区显示 AI 简报入口，归纳看点与避坑',
                checked: Boolean(cfg.featureCommentBrief),
                onChange: () => persistConfig()
            });

            highlightFusionRow = createToggleRow({
                title: 'AI 高能融合',
                subtext: '联合字幕、评论极性与热度推算高光及避坑区间',
                checked: Boolean(cfg.featureHighlightFusion),
                onChange: () => persistConfig()
            });

            autoTagRow = createToggleRow({
                title: 'AI 高光打标',
                subtext: '片段列表提供依据台词的智能填标按钮',
                checked: Boolean(cfg.featureAutoTag),
                onChange: () => persistConfig()
            });

            autoTagMarkWrap = document.createElement('div');
            autoTagMarkWrap.className = 'mp-s2-conditional';
            autoTagOnMarkRow = createToggleRow({
                title: '打点自动填标',
                subtext: '新增空白高光后自动匹配字幕写入标签',
                checked: Boolean(cfg.autoTagOnMark),
                onChange: () => persistConfig()
            });
            autoTagMarkWrap.appendChild(autoTagOnMarkRow.element);

            const vibeSection = document.createElement('div');
            vibeSection.className = 'mp-s2-field';
            const vibeLabel = document.createElement('span');
            vibeLabel.className = 'mp-s2-field-label';
            vibeLabel.textContent = '高能偏好（本地权重参考）';
            const vibeChipsWrap = document.createElement('div');
            vibeChipsWrap.className = 'mp-s2-chips mp-s2-ai-vibes';
            const PRESET_VIBES = ['剧情反转', '黑丝制服', '极致反差', '紧凑高潮', '对白张力'];
            const renderVibeChips = () => {
                vibeChipsWrap.innerHTML = '';
                PRESET_VIBES.forEach((tag) => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    const isOn = activeVibeTags.includes(tag);
                    chip.className = `mp-s2-chip ${isOn ? 'is-active' : ''}`.trim();
                    chip.textContent = tag;
                    chip.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (activeVibeTags.includes(tag)) {
                            activeVibeTags = activeVibeTags.filter((x) => x !== tag);
                        } else if (activeVibeTags.length < 4) {
                            activeVibeTags = [...activeVibeTags, tag];
                        }
                        renderVibeChips();
                        persistConfig();
                    });
                    vibeChipsWrap.appendChild(chip);
                });
            };
            renderVibeChips();
            vibeSection.appendChild(vibeLabel);
            vibeSection.appendChild(vibeChipsWrap);

            featuresBox.appendChild(subChaptersRow.element);
            featuresBox.appendChild(commentBriefRow.element);
            featuresBox.appendChild(highlightFusionRow.element);
            featuresBox.appendChild(autoTagRow.element);
            featuresBox.appendChild(autoTagMarkWrap);
            featuresBox.appendChild(vibeSection);

            // 2.5 AI 专项调试开关与 WebDAV 指定目录
            aiDebugRow = createToggleRow({
                title: 'AI 调试录制 (WebDAV)',
                subtext: '保存字幕/评论/元数据就绪状态及 AI 输入输出至 WebDAV',
                checked: Boolean(cfg.aiDebugEnabled),
                onChange: () => persistConfig()
            });

            aiDebugWrap = document.createElement('div');
            aiDebugWrap.className = 'mp-s2-conditional mp-s2-ai-debug-box';

            const debugDirField = document.createElement('div');
            debugDirField.className = 'mp-s2-field';
            const debugDirLabel = document.createElement('label');
            debugDirLabel.className = 'mp-s2-field-label';
            debugDirLabel.textContent = 'WebDAV 保存子目录（相对同步根目录）';
            aiDebugDirInput = document.createElement('input');
            aiDebugDirInput.type = 'text';
            aiDebugDirInput.className = 'mp-s2-debug-input';
            aiDebugDirInput.placeholder = 'logs/ai-debug';
            aiDebugDirInput.value = cfg.aiDebugDir || 'logs/ai-debug';
            bindFocusScroll(aiDebugDirInput);
            aiDebugDirInput.addEventListener('change', () => persistConfig());
            debugDirField.appendChild(debugDirLabel);
            debugDirField.appendChild(aiDebugDirInput);

            aiDebugHint = document.createElement('div');
            aiDebugHint.className = 'mp-s2-meta-line';

            const flushDebugBtn = document.createElement('button');
            flushDebugBtn.type = 'button';
            flushDebugBtn.className = 'mp-s2-btn';
            flushDebugBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>立即上传当前 AI 诊断</span>`;
            flushDebugBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                persistConfig();
                if (!WebDavClient.hasValidEndpoint(SyncManager.getWebDavConfig())) {
                    statusBox.className = 'mp-s2-status-box is-err';
                    statusBox.textContent = '请先在下方「WebDAV 同步」配置服务器地址与凭据';
                    Toast('请先配置 WebDAV 服务器', 2200, 'error');
                    return;
                }
                flushDebugBtn.disabled = true;
                try {
                    const res = await AiDebugLogger.flushAll({ force: true });
                    syncDebugHint(LlmService.getConfig().aiDebugDir);
                    if (res.uploadedCount > 0) {
                        const lastPath = res.paths[res.paths.length - 1];
                        statusBox.className = 'mp-s2-status-box is-ok';
                        statusBox.textContent = `已上传 ${res.uploadedCount} 份 AI 诊断报告至 WebDAV: ${lastPath}`;
                        Toast(`已上传 AI 诊断 (${res.uploadedCount} 份)`, 2200, 'success');
                    } else {
                        const msg = res.errors?.[0] || '当前暂无待上传的 AI 会话记录';
                        statusBox.className = 'mp-s2-status-box is-running';
                        statusBox.textContent = msg;
                        Toast(msg, 2200, 'info');
                    }
                } catch (err) {
                    const errMsg = LlmService.redactSecrets(err?.message || '上传 AI 诊断失败');
                    statusBox.className = 'mp-s2-status-box is-err';
                    statusBox.textContent = errMsg;
                    Toast(errMsg, 2400, 'error');
                } finally {
                    flushDebugBtn.disabled = false;
                }
            });

            // 2.6 批量无头实测（独立全局最高悬浮窗）与本地字幕缓存清理
            const debugActionsRow = document.createElement('div');
            debugActionsRow.className = 'mp-s2-actions';

            const openFloatBtn = document.createElement('button');
            openFloatBtn.type = 'button';
            openFloatBtn.className = 'mp-s2-btn mp-s2-btn--primary';
            const savedCount = parseBatchCodes(loadSavedBatchText()).length;
            openFloatBtn.innerHTML = `${ICON_SERVER} <span>${savedCount > 0 ? `全局实测悬浮窗 (${savedCount})` : '打开全局实测悬浮窗'}</span>`;
            openFloatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                persistConfig();
                if (sm?.settingsV2Manager?.close) {
                    sm.settingsV2Manager.close();
                } else {
                    sm?.closeSettings?.();
                }
                const modal = BatchTestFloatModal.open({ settingsManager: sm });
                if (!modal) {
                    Toast('请先进入播放器页面后再打开实测悬浮窗', 2200, 'info');
                }
            });

            const clearSubCacheBtn = document.createElement('button');
            clearSubCacheBtn.type = 'button';
            clearSubCacheBtn.className = 'mp-s2-btn mp-s2-btn--danger';
            const clearSubHtml = `${ICON_TRASH} <span>清理本地字幕缓存</span>`;
            clearSubCacheBtn.innerHTML = clearSubHtml;

            bindTwoStepConfirm(clearSubCacheBtn, {
                normalHtml: clearSubHtml,
                confirmText: '确认清空?',
                onConfirm: async () => {
                    clearSubCacheBtn.disabled = true;
                    const res = await SubtitleRepository.clearLocal({ subtitleManager: sm?.controlManager?.subtitleManager });
                    clearSubCacheBtn.disabled = false;
                    clearSubCacheBtn.innerHTML = clearSubHtml;
                    statusBox.className = 'mp-s2-status-box is-ok';
                    statusBox.textContent = `已清理 ${res.clearedCount} 部字幕缓存`;
                    Toast(`已清理 ${res.clearedCount} 部字幕缓存`, 2000, 'success');
                }
            });

            debugActionsRow.appendChild(openFloatBtn);
            debugActionsRow.appendChild(clearSubCacheBtn);

            aiDebugWrap.appendChild(debugDirField);
            aiDebugWrap.appendChild(aiDebugHint);
            aiDebugWrap.appendChild(flushDebugBtn);
            aiDebugWrap.appendChild(debugActionsRow);

            updatePresetHighlight();
            renderModelChips();
            syncFeatureVisibility(Boolean(cfg.enabled), Boolean(cfg.featureAutoTag), Boolean(cfg.aiDebugEnabled));
            syncDebugHint(cfg.aiDebugDir || 'logs/ai-debug');

            form.appendChild(presetsWrap);
            form.appendChild(linksWrap);
            form.appendChild(baseField.element);
            form.appendChild(modelField.element);
            form.appendChild(keyField.element);
            form.appendChild(hintLine);
            form.appendChild(actionsRow);
            form.appendChild(statusBox);
            form.appendChild(featuresBox);
            form.appendChild(aiDebugRow.element);
            form.appendChild(aiDebugWrap);
            body.appendChild(form);
        }
    });

    return accordion.element;
}
