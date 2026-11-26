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
    updatePill
} from '../components/S2Primitives.js';
import { LlmService } from '../../../../services/LlmService.js';
import { Toast } from '../../../../utils/index.js';
import { ICON_EYE, ICON_EYE_OFF, ICON_SERVER } from '../../../../constants/icons.js';

const PRESET_OLLAMA = {
    id: 'ollama',
    label: '本地 Ollama',
    baseUrl: 'http://192.168.1.x:11434/v1',
    basePlaceholder: 'http://192.168.1.x:11434/v1',
    modelPlaceholder: 'qwen2.5:7b'
};

const PRESET_OPENROUTER = {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    basePlaceholder: 'https://openrouter.ai/api/v1',
    modelPlaceholder: 'deepseek/deepseek-chat'
};

const PRESET_CUSTOM = {
    id: 'custom',
    label: '自定义',
    baseUrl: '',
    basePlaceholder: 'https://api.example.com/v1',
    modelPlaceholder: 'gpt-4o-mini'
};

const AI_PRESETS = [PRESET_OLLAMA, PRESET_OPENROUTER, PRESET_CUSTOM];
const PRESET_DEFAULT_URLS = new Set([PRESET_OLLAMA.baseUrl, PRESET_OPENROUTER.baseUrl]);

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

            const syncHeaderPill = (text, tone) => {
                const pillEl = body.parentElement?.querySelector?.('.mp-s2-pill');
                if (pillEl) {
                    updatePill(pillEl, text, tone);
                } else {
                    setStatus(text, tone);
                }
            };

            const persistConfig = () => {
                const saved = LlmService.saveConfig({
                    enabled: enableRow ? enableRow.getChecked() : LlmService.getConfig().enabled,
                    baseUrl: baseField ? baseField.input.value : '',
                    model: modelField ? modelField.input.value : '',
                    apiKey: keyField ? keyField.input.value : ''
                });
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

            const presetButtons = new Map();
            const updatePresetHighlight = () => {
                presetButtons.forEach((btn, id) => {
                    btn.classList.toggle('is-active', id === activePresetId);
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
                    }
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
                    persistConfig();
                }
            });

            modelField = createField({
                label: '模型名称',
                value: cfg.model || '',
                placeholder: activePreset.modelPlaceholder || PRESET_OLLAMA.modelPlaceholder,
                onChange: () => {
                    persistConfig();
                }
            });

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
            hintLine.textContent = '密钥仅存本机，不同步至云端';

            // 2.3 状态提示框与连通性测试按钮
            const statusBox = document.createElement('div');
            statusBox.className = 'mp-s2-status-box is-hidden';

            const actionsRow = document.createElement('div');
            actionsRow.className = 'mp-s2-actions mp-s2-actions--single';

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

            actionsRow.appendChild(testBtn);

            form.appendChild(presetsWrap);
            form.appendChild(baseField.element);
            form.appendChild(modelField.element);
            form.appendChild(keyField.element);
            form.appendChild(hintLine);
            form.appendChild(actionsRow);
            form.appendChild(statusBox);
            body.appendChild(form);
        }
    });

    return accordion.element;
}
