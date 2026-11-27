/**
 * S2AiSectionBuilder — Settings V2 AI 服务手风琴配置卡片
 */
import {
    createAccordionCard, createToggleRow, createField,
    updatePill, bindFocusScroll
} from '../components/S2Primitives.js';
import {
    LlmService, AI_PROVIDER_PRESETS, detectProviderPresetId,
    getPresetMeta, parseApiKeys, maskApiKey, filterAndSortTextModels
} from '../../../../services/LlmService.js';
import { parseBatchCodes, loadSavedBatchText } from '../../../../services/AiBatchTestRunner.js';
import { BatchTestFloatModal } from '../../../ui/BatchTestFloatModal.js';
import { Toast } from '../../../../utils/index.js';
import { ICON_EYE, ICON_EYE_OFF, ICON_SERVER, ICON_PLUS, ICON_CHEVRON_RIGHT } from '../../../../constants/icons.js';

const PRESET_VIBES = ['剧情对白', '情绪推进', '足控丝袜', '口交深喉', '姿势体位', '语言羞辱'];

function el(tag, cls = '', text = '', onClick = null) {
    const n = document.createElement(tag);
    if (tag === 'button') n.type = 'button';
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    if (onClick) {
        n.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(e, n);
        });
    }
    return n;
}

function resolveStatusMeta(cfg) {
    if (!cfg?.enabled) return { text: '未启用', tone: 'muted' };
    const count = LlmService.getRotationPool(cfg).length;
    if (count > 1) return { text: `已配置 (${count} 节点)`, tone: 'ok' };
    return count === 1 ? { text: '已配置', tone: 'ok' } : { text: '待完善', tone: 'warn' };
}

function mergeDraftKeys(pinned, rawVal) {
    const draft = parseApiKeys(rawVal);
    if (draft.length === 0) return [...pinned];
    const seen = new Set(pinned);
    return [...pinned, ...draft.filter((k) => !seen.has(k))];
}

function hasProviderConfig(p) {
    return Boolean(p.model || (p.apiKeys && p.apiKeys.length > 0) || (p.presetId === 'openai-compat' && p.baseUrl));
}

function buildAiSectionBody(body, setStatus, onConfigChange, sm) {
    const cfg = LlmService.getConfig();
    let providers = (cfg.providers || []).map((p) => ({
        ...p, apiKeys: [...(p.apiKeys || [])], models: [...(p.models || [])]
    }));
    let activeProviderId = cfg.activeProviderId || providers[0]?.id || AI_PROVIDER_PRESETS[0].id;
    const fetchedByBase = new Map();
    providers.forEach((p) => { if (p.baseUrl && p.models?.length) fetchedByBase.set(p.baseUrl, [...p.models]); });

    let activeVibeTags = Array.isArray(cfg.vibeTags) ? [...cfg.vibeTags] : [];
    let modelMenuOpen = false;
    let keyVisible = false;

    const getActive = () => providers.find((p) => p.id === activeProviderId) || null;
    const ensureSlot = (id, presetId = '') => {
        let p = providers.find((x) => x.id === id);
        if (!p) {
            const meta = getPresetMeta(presetId || (AI_PROVIDER_PRESETS.some((x) => x.id === id) ? id : 'openai-compat'));
            p = { id, presetId: meta.id, name: meta.label, baseUrl: meta.baseUrl || '', model: '', apiKeys: [], enabled: true, models: [] };
            providers.push(p);
        }
        return p;
    };

    const syncPill = (text, tone) => {
        const pillEl = body.parentElement?.querySelector?.('.mp-s2-pill');
        if (pillEl) updatePill(pillEl, text, tone);
        else setStatus(text, tone);
    };

    const syncVisibility = (en, autoTag, dbg) => {
        featuresBox.classList.toggle('is-hidden', !en);
        autoTagMarkWrap.classList.toggle('is-hidden', !autoTag);
        aiDebugWrap.classList.toggle('is-hidden', !dbg);
    };

    const persistConfig = () => {
        const prev = LlmService.getConfig();
        const rawBase = baseField.input.value.trim();
        const rawModel = modelField.input.value.trim();
        const rawKey = keyInput.value.trim();
        let active = getActive();
        if (!active && (rawBase || rawModel || rawKey)) active = ensureSlot(activeProviderId);
        if (active) {
            active.baseUrl = LlmService.sanitizeBaseUrl(rawBase);
            active.model = rawModel;
            active.presetId = detectProviderPresetId(active.baseUrl || rawBase) || active.presetId;
            active.enabled = rotateRow.getChecked();
            active.apiKeys = mergeDraftKeys(active._pinnedKeys || active.apiKeys || [], rawKey);
            if (active.baseUrl && fetchedByBase.has(active.baseUrl)) active.models = [...fetchedByBase.get(active.baseUrl)];
        }
        const saved = LlmService.saveConfig({
            enabled: enableRow.getChecked(),
            providers: providers.filter((p) => p.id === activeProviderId || hasProviderConfig(p)),
            activeProviderId,
            featureSubChapters: subChaptersRow.getChecked(),
            featureCommentBrief: commentBriefRow.getChecked(),
            featureHighlightFusion: highlightFusionRow.getChecked(),
            featureAutoTag: autoTagRow.getChecked(),
            autoTagOnMark: autoTagOnMarkRow.getChecked(),
            vibeTags: activeVibeTags,
            aiDebugEnabled: aiDebugRow.getChecked()
        });
        providers = saved.providers.map((p) => {
            const old = providers.find((x) => x.id === p.id);
            return { ...p, apiKeys: [...(p.apiKeys || [])], _pinnedKeys: old?._pinnedKeys ? [...old._pinnedKeys] : [...(p.apiKeys || [])], models: [...(p.models || [])] };
        });
        activeProviderId = saved.activeProviderId || activeProviderId;
        syncVisibility(saved.enabled, saved.featureAutoTag, saved.aiDebugEnabled);
        const meta = resolveStatusMeta(saved);
        syncPill(meta.text, meta.tone);
        renderPoolList();
        onConfigChange?.(saved);
        return saved;
    };

    const enableRow = createToggleRow({
        title: '启用 AI 服务',
        subtext: '用于字幕分幕、评论简报与高光打标，手动触发不自动消耗',
        checked: Boolean(cfg.enabled),
        onChange: persistConfig
    });
    body.appendChild(enableRow.element);

    const form = el('div', 'mp-s2-form');
    const presetsWrap = el('div', 'mp-s2-chips mp-s2-ai-presets');
    const presetButtons = new Map();

    const updatePresetHighlight = () => {
        const pid = getActive()?.presetId || (AI_PROVIDER_PRESETS.some((p) => p.id === activeProviderId) ? activeProviderId : detectProviderPresetId(baseField?.input?.value));
        presetButtons.forEach((btn, id) => btn.classList.toggle('is-active', id === pid));
        const meta = getPresetMeta(pid);
        keyGetLink.href = meta.consoleUrl || '#';
        keyGetLink.classList.toggle('is-hidden', !meta.consoleUrl);
    };

    const renderKeyChips = () => {
        const active = getActive();
        const pinned = active ? (active._pinnedKeys || active.apiKeys || []) : [];
        keyChipsWrap.innerHTML = '';
        keyChipsWrap.classList.toggle('is-hidden', pinned.length === 0);
        pinned.forEach((k, idx) => {
            const chip = el('button', 'mp-s2-chip is-active', '', () => {
                const t = ensureSlot(activeProviderId);
                t._pinnedKeys = (t._pinnedKeys || [...(t.apiKeys || [])]).filter((_, i) => i !== idx);
                t.apiKeys = [...t._pinnedKeys];
                renderKeyChips();
                persistConfig();
            });
            chip.innerHTML = `<span>${maskApiKey(k)}</span><span class="mp-s2-chip-remove">×</span>`;
            keyChipsWrap.appendChild(chip);
        });
    };

    const renderModelOptions = (filterText = '') => {
        const base = LlmService.sanitizeBaseUrl(baseField.input.value);
        const cached = (base && fetchedByBase.get(base)) || getActive()?.models || [];
        const models = filterAndSortTextModels(cached);
        const q = String(filterText || '').trim().toLowerCase();
        const cur = modelField.input.value.trim();
        const list = q && q !== cur.toLowerCase() ? models.filter((m) => m.toLowerCase().includes(q)) : models;
        modelOptsEl.innerHTML = '';
        if (list.length === 0) {
            modelOptsEl.appendChild(el('div', 'mp-s2-combobox-empty', models.length === 0 ? '点击「刷新列表」获取模型，或直接输入' : '无匹配模型，可直接保留手动输入'));
            return;
        }
        list.forEach((id) => {
            const opt = el('button', `mp-s2-combobox-opt ${id === cur ? 'is-active' : ''}`.trim(), id, () => {
                modelField.input.value = id;
                setMenuOpen(false);
                persistConfig();
            });
            modelOptsEl.appendChild(opt);
        });
    };

    const setMenuOpen = (open) => {
        modelMenuOpen = Boolean(open);
        modelMenuEl.classList.toggle('is-hidden', !modelMenuOpen);
        modelToggleBtn.classList.toggle('is-open', modelMenuOpen);
        if (modelMenuOpen) renderModelOptions('');
    };

    const fetchModelsToMenu = async (openMenu = true) => {
        const cleanBase = LlmService.sanitizeBaseUrl(baseField.input.value);
        if (!cleanBase) return Toast('请先填写有效的接口地址', 2000, 'info');
        if (openMenu) {
            setMenuOpen(true);
            modelOptsEl.innerHTML = '<div class="mp-s2-combobox-empty">正在获取模型列表…</div>';
        }
        const active = getActive();
        const res = await LlmService.fetchModels({
            baseUrl: cleanBase,
            apiKeys: mergeDraftKeys(active?.apiKeys || [], keyInput.value)
        });
        if (res?.ok && res.models?.length > 0) {
            const filtered = filterAndSortTextModels(res.models);
            fetchedByBase.set(cleanBase, filtered);
            ensureSlot(activeProviderId).models = [...filtered];
            if (!modelField.input.value.trim() && filtered[0]) modelField.input.value = filtered[0];
            persistConfig();
            renderModelOptions('');
        } else if (openMenu) {
            modelOptsEl.innerHTML = `<div class="mp-s2-combobox-empty">${res?.message || '暂无列表，可直接输入模型名'}</div>`;
        }
    };

    const loadProvider = (id, fallback = null) => {
        activeProviderId = id;
        const p = providers.find((x) => x.id === id);
        const meta = fallback || getPresetMeta(p?.presetId || id);
        baseField.input.placeholder = meta.basePlaceholder;
        baseField.input.value = p ? (p.baseUrl || '') : (meta.baseUrl || '');
        modelField.input.placeholder = meta.modelPlaceholder;
        modelField.input.value = p ? (p.model || '') : '';
        const keys = p?.apiKeys || [];
        if (p && !p._pinnedKeys) p._pinnedKeys = keys.length > 1 ? [...keys] : [];
        keyInput.value = p && (!p._pinnedKeys || p._pinnedKeys.length === 0) ? (keys[0] || '') : '';
        rotateRow.setChecked(p ? p.enabled !== false : true);
        setMenuOpen(false);
        updatePresetHighlight();
        renderKeyChips();
        renderPoolList();
    };

    AI_PROVIDER_PRESETS.forEach((preset) => {
        const chip = el('button', 'mp-s2-chip', preset.label, () => {
            const match = providers.find((p) => p.id === preset.id || p.presetId === preset.id);
            const tid = match ? match.id : preset.id;
            if (!match) ensureSlot(tid, preset.id);
            loadProvider(tid, preset);
            persistConfig();
        });
        chip.dataset.preset = preset.id;
        presetButtons.set(preset.id, chip);
        presetsWrap.appendChild(chip);
    });

    const addCustomBtn = el('button', 'mp-s2-chip mp-s2-chip--add', '', () => {
        let seq = 1;
        while (providers.some((p) => p.id === `openai-compat-${seq}`)) seq += 1;
        const nid = `openai-compat-${seq}`;
        providers.push({ id: nid, presetId: 'openai-compat', name: `通用接口 ${seq}`, baseUrl: '', model: '', apiKeys: [], _pinnedKeys: [], enabled: true, models: [] });
        loadProvider(nid, getPresetMeta('openai-compat'));
        persistConfig();
    });
    addCustomBtn.innerHTML = `${ICON_PLUS}<span>新增接口</span>`;
    presetsWrap.appendChild(addCustomBtn);

    const initP = getActive();
    const initMeta = getPresetMeta(initP?.presetId || activeProviderId);

    const rotateRow = createToggleRow({
        title: '参与轮询调度',
        subtext: '配置多个提供商时，开启后将参与跨提供商轮询与故障切换',
        checked: initP ? initP.enabled !== false : true,
        onChange: persistConfig
    });

    const baseField = createField({
        label: '接口地址',
        value: initP ? (initP.baseUrl || '') : (cfg.baseUrl || ''),
        placeholder: initMeta.basePlaceholder,
        onChange: () => {
            const active = ensureSlot(activeProviderId);
            const detected = detectProviderPresetId(baseField.input.value);
            active.presetId = detected;
            if (detected !== 'openai-compat') active.name = getPresetMeta(detected).label;
            updatePresetHighlight();
            persistConfig();
        }
    });

    const modelToggleBtn = el('button', 'mp-s2-btn mp-s2-btn--icon mp-s2-combobox-toggle', '', () => {
        if (modelMenuOpen) return setMenuOpen(false);
        const clean = LlmService.sanitizeBaseUrl(baseField.input.value);
        const cached = (clean && fetchedByBase.get(clean)) || getActive()?.models || [];
        if (cached.length === 0 && clean) fetchModelsToMenu(true);
        else setMenuOpen(true);
    });
    modelToggleBtn.innerHTML = ICON_CHEVRON_RIGHT;
    modelToggleBtn.setAttribute('aria-label', '展开或收起模型列表');

    const modelField = createField({
        label: '模型名称',
        value: initP ? (initP.model || '') : (cfg.model || ''),
        placeholder: initMeta.modelPlaceholder,
        trailingEl: modelToggleBtn,
        onInput: (val) => { if (modelMenuOpen) renderModelOptions(val); },
        onChange: persistConfig
    });

    const modelMenuEl = el('div', 'mp-s2-combobox-menu is-hidden');
    const menuHead = el('div', 'mp-s2-combobox-head');
    menuHead.appendChild(el('span', '', 'API 模型列表'));
    menuHead.appendChild(el('button', 'mp-s2-inline-link', '刷新列表', () => fetchModelsToMenu(true)));
    const modelOptsEl = el('div', 'mp-s2-combobox-opts');
    modelMenuEl.appendChild(menuHead);
    modelMenuEl.appendChild(modelOptsEl);
    modelField.element.appendChild(modelMenuEl);

    const keyFieldWrap = el('div', 'mp-s2-field');
    const keyLabelRow = el('div', 'mp-s2-field-label-row');
    keyLabelRow.appendChild(el('label', 'mp-s2-field-label', '密钥 (支持多 Key 轮询)'));
    const keyGetLink = el('a', 'mp-s2-inline-link is-hidden', '获取密钥', () => {});
    keyGetLink.href = '#';
    keyGetLink.target = '_blank';
    keyGetLink.rel = 'noopener noreferrer';
    keyLabelRow.appendChild(keyGetLink);

    const keyInput = el('input', 'mp-s2-input');
    keyInput.type = 'password';
    keyInput.placeholder = '输入密钥，点 + 可添加多个轮询';
    const initKeys = initP?.apiKeys || cfg.apiKeys || [];
    if (initP) initP._pinnedKeys = initKeys.length > 1 ? [...initKeys] : [];
    keyInput.value = initKeys.length === 1 ? initKeys[0] : '';
    bindFocusScroll(keyInput);

    const eyeBtn = el('button', 'mp-s2-btn mp-s2-btn--icon', '', () => {
        keyVisible = !keyVisible;
        keyInput.type = keyVisible ? 'text' : 'password';
        eyeBtn.innerHTML = keyVisible ? ICON_EYE_OFF : ICON_EYE;
    });
    eyeBtn.innerHTML = ICON_EYE;
    eyeBtn.setAttribute('aria-label', '显示或隐藏密钥');

    const commitKeys = () => {
        const parsed = parseApiKeys(keyInput.value);
        if (parsed.length === 0) return;
        const active = ensureSlot(activeProviderId);
        active._pinnedKeys = mergeDraftKeys(active._pinnedKeys || [], parsed);
        active.apiKeys = [...active._pinnedKeys];
        keyInput.value = '';
        renderKeyChips();
        persistConfig();
    };
    const addKeyBtn = el('button', 'mp-s2-btn mp-s2-btn--icon mp-s2-key-add-btn', '', commitKeys);
    addKeyBtn.innerHTML = ICON_PLUS;
    addKeyBtn.setAttribute('aria-label', '添加密钥到轮询池');

    keyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commitKeys(); }
    });
    keyInput.addEventListener('change', persistConfig);

    const keyChipsWrap = el('div', 'mp-s2-chips mp-s2-key-chips is-hidden');
    const keyInputRow = el('div', 'mp-s2-input-row');
    keyInputRow.appendChild(keyInput);
    keyInputRow.appendChild(eyeBtn);
    keyInputRow.appendChild(addKeyBtn);
    keyFieldWrap.appendChild(keyLabelRow);
    keyFieldWrap.appendChild(keyInputRow);
    keyFieldWrap.appendChild(keyChipsWrap);

    const poolWrap = el('div', 'mp-s2-ai-pool is-hidden');
    const renderPoolList = () => {
        const ready = providers.filter(hasProviderConfig);
        poolWrap.innerHTML = '';
        poolWrap.classList.toggle('is-hidden', ready.length < 2);
        if (ready.length < 2) return;
        ready.forEach((item) => {
            const row = el('div', `mp-s2-pool-row ${item.id === activeProviderId ? 'is-active' : ''}`.trim());
            const mainBtn = el('button', 'mp-s2-pool-main', '', () => loadProvider(item.id));
            mainBtn.appendChild(el('span', 'mp-s2-pool-name', item.name || getPresetMeta(item.presetId).label));
            mainBtn.appendChild(el('span', 'mp-s2-pool-meta', `${item.model || '未填模型'} · ${(item.apiKeys || []).length} Key`));
            const actions = el('div', 'mp-s2-pool-actions');
            const isOn = item.enabled !== false;
            actions.appendChild(el('button', `mp-s2-pool-toggle ${isOn ? 'is-on' : ''}`.trim(), isOn ? '轮询中' : '已停用', () => {
                item.enabled = !(item.enabled !== false);
                if (item.id === activeProviderId) rotateRow.setChecked(item.enabled);
                persistConfig();
            }));
            if (ready.length > 1) {
                actions.appendChild(el('button', 'mp-s2-chip-remove', '×', () => {
                    providers = providers.filter((p) => p.id !== item.id);
                    if (activeProviderId === item.id) {
                        activeProviderId = providers[0]?.id || AI_PROVIDER_PRESETS[0].id;
                        loadProvider(activeProviderId);
                    }
                    persistConfig();
                }));
            }
            row.appendChild(mainBtn);
            row.appendChild(actions);
            poolWrap.appendChild(row);
        });
    };

    const statusBox = el('div', 'mp-s2-status-box is-hidden');
    const actionsRow = el('div', 'mp-s2-actions mp-s2-actions--single');
    const testBtn = el('button', 'mp-s2-btn mp-s2-btn--primary', '', async () => {
        const saved = persistConfig();
        const target = saved.providers?.find((p) => p.id === activeProviderId) || saved;
        testBtn.disabled = true;
        syncPill('测试中…', 'info');
        statusBox.className = 'mp-s2-status-box is-running';
        statusBox.textContent = '正在检测 AI 接口连通性…';
        try {
            const res = await LlmService.testConnection(target);
            if (res?.ok) {
                if (res.models?.length > 0) {
                    const filtered = filterAndSortTextModels(res.models);
                    const clean = LlmService.sanitizeBaseUrl(target.baseUrl);
                    if (clean) fetchedByBase.set(clean, filtered);
                    ensureSlot(activeProviderId).models = [...filtered];
                    if (!modelField.input.value.trim() && filtered[0]) modelField.input.value = filtered[0];
                    persistConfig();
                    if (modelMenuOpen) renderModelOptions('');
                }
                const note = res.models?.length > 0 ? `（可用模型 ${res.models.length} 个）` : '';
                syncPill('已连通', 'ok');
                statusBox.className = 'mp-s2-status-box is-ok';
                statusBox.textContent = `${res.message || '接口连通正常'}${note}`;
                Toast(res.message || '接口连通正常', 2200, 'success');
            } else {
                const msg = res?.message || '无法连接服务端';
                syncPill('未连通', 'err');
                statusBox.className = 'mp-s2-status-box is-err';
                statusBox.textContent = msg;
                Toast(msg, 2500, 'error');
            }
        } catch (err) {
            const msg = LlmService.redactSecrets(err?.message || '无法连接服务端');
            syncPill('未连通', 'err');
            statusBox.className = 'mp-s2-status-box is-err';
            statusBox.textContent = msg;
            Toast(msg, 2500, 'error');
        } finally {
            testBtn.disabled = false;
        }
    });
    testBtn.innerHTML = `${ICON_SERVER} <span>测试 AI 连通性</span>`;
    actionsRow.appendChild(testBtn);

    const featuresBox = el('div', 'mp-s2-conditional');
    const subChaptersRow = createToggleRow({ title: 'AI 智能分幕与总结', subtext: '对长字幕进行结构化分幕与剧情高光提炼', checked: cfg.featureSubChapters !== false, onChange: persistConfig });
    const commentBriefRow = createToggleRow({ title: 'AI 评论共识简报', subtext: '自动归纳老司机共识、高光看点与劝退避坑', checked: cfg.featureCommentBrief !== false, onChange: persistConfig });
    const highlightFusionRow = createToggleRow({ title: 'AI 高光信号融合 (实验性)', subtext: '结合字幕/热力波形/评论生成看点标签并回标无时间戳热评', checked: cfg.featureHighlightFusion !== false, onChange: persistConfig });

    const vibeWrap = el('div', 'mp-s2-field');
    vibeWrap.appendChild(el('label', 'mp-s2-field-label', 'AI 看点偏好权重 (可选，最多 6 项)'));
    const vibeChipsWrap = el('div', 'mp-s2-chips mp-s2-ai-vibes');
    const vibeBtns = new Map();
    const syncVibes = () => vibeBtns.forEach((b, id) => b.classList.toggle('is-active', activeVibeTags.includes(id)));
    PRESET_VIBES.forEach((v) => {
        const c = el('button', 'mp-s2-chip', v, () => {
            if (activeVibeTags.includes(v)) activeVibeTags = activeVibeTags.filter((x) => x !== v);
            else if (activeVibeTags.length < 6) activeVibeTags = [...activeVibeTags, v];
            else return Toast('最多选择 6 个看点偏好', 1800, 'info');
            syncVibes();
            persistConfig();
        });
        c.dataset.vibe = v;
        vibeBtns.set(v, c);
        vibeChipsWrap.appendChild(c);
    });
    syncVibes();
    vibeWrap.appendChild(vibeChipsWrap);

    const autoTagRow = createToggleRow({ title: 'AI 高光智能打标', subtext: '在标签抽屉内一键生成语义标签与一句话点评', checked: cfg.featureAutoTag !== false, onChange: persistConfig });
    const autoTagMarkWrap = el('div', 'mp-s2-conditional');
    const autoTagOnMarkRow = createToggleRow({ title: '手动标记时自动触发 AI 建议', subtext: '关闭后仅点击「AI 建议」按钮时才发起请求', checked: Boolean(cfg.autoTagOnMark), onChange: persistConfig });
    autoTagMarkWrap.appendChild(autoTagOnMarkRow.element);
    [subChaptersRow.element, commentBriefRow.element, highlightFusionRow.element, vibeWrap, autoTagRow.element, autoTagMarkWrap]
        .forEach((node) => featuresBox.appendChild(node));

    const aiDebugRow = createToggleRow({
        title: 'AI 调试录制 (WebDAV)',
        subtext: '自动继承下方 WebDAV 同步配置，开启后自动上传 AI 诊断日志',
        checked: Boolean(cfg.aiDebugEnabled),
        onChange: persistConfig
    });
    const aiDebugWrap = el('div', 'mp-s2-conditional mp-s2-ai-debug-box');
    const debugActions = el('div', 'mp-s2-actions mp-s2-actions--single');
    const openFloatBtn = el('button', 'mp-s2-btn mp-s2-btn--primary', '', () => {
        persistConfig();
        if (sm?.settingsV2Manager?.close) sm.settingsV2Manager.close();
        else sm?.closeSettings?.();
        if (!BatchTestFloatModal.open({ settingsManager: sm })) Toast('请先进入播放器页面后再打开实测悬浮窗', 2200, 'info');
    });
    const savedCount = parseBatchCodes(loadSavedBatchText()).length;
    openFloatBtn.innerHTML = `${ICON_SERVER} <span>${savedCount > 0 ? `全局实测悬浮窗 (${savedCount})` : '打开全局实测悬浮窗'}</span>`;
    debugActions.appendChild(openFloatBtn);
    aiDebugWrap.appendChild(debugActions);

    updatePresetHighlight();
    renderKeyChips();
    renderPoolList();
    syncVisibility(Boolean(cfg.enabled), Boolean(cfg.featureAutoTag), Boolean(cfg.aiDebugEnabled));

    [
        presetsWrap, rotateRow.element, baseField.element, modelField.element,
        keyFieldWrap, poolWrap, el('div', 'mp-s2-meta-line', '密钥仅存本机，不同步至云端；多 Key 与已启用提供商自动轮询'),
        actionsRow, statusBox, featuresBox, aiDebugRow.element, aiDebugWrap
    ].forEach((node) => form.appendChild(node));
    body.appendChild(form);
}

/**
 * 构建 AI 服务手风琴配置卡片 DOM
 * @param {{ sm?: Object, iconSvg?: string, onConfigChange?: Function|null }} [options]
 * @returns {HTMLElement}
 */
export function buildAiConnectionAccordion({ sm = null, iconSvg = '', onConfigChange = null } = {}) {
    const initialStatus = resolveStatusMeta(LlmService.getConfig());
    const expanded = sm?.isSectionExpanded ? sm.isSectionExpanded('s2_ai', false) : false;
    const accordion = createAccordionCard({
        iconSvg: iconSvg || ICON_SERVER,
        title: 'AI 服务',
        statusText: initialStatus.text,
        statusTone: initialStatus.tone,
        expanded,
        onToggle: (open) => sm?.setSectionExpanded?.('s2_ai', open),
        buildBody: (body, { setStatus }) => buildAiSectionBody(body, setStatus, onConfigChange, sm)
    });
    return accordion.element;
}
