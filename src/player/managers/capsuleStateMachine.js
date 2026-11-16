/**
 * 收藏片段胶囊完整状态机 (Highlight & Interval Capsule FSM)
 *
 * 纯函数、零 DOM 依赖的状态评估与主焦点裁决引擎：
 * 1. 互斥主状态 (Priority Order):
 *    editing > looping > inside > near > idle
 * 2. 正交修饰状态:
 *    - isPrimary: 全局唯一"主焦点"胶囊（按 层级 > 最短距离 > 更紧凑区间 > 切换滞回 裁决），驱动自动居中滚动与强焦点态
 *    - progress:  区间片段在 looping / inside 态下的 0~1 播放进度（驱动 GPU scaleX 填充层）
 *    - isSelectedHighlight: 单点高光点击后的当前选中标识（离开邻近区后自动退场，防止永久粘滞）
 * 3. 非对称人体工学邻近窗口 + 滞回防抖 (Hysteresis):
 *    - 常规视频：提前 6.0s 预告进入 near，离开 4.0s 后淡出；已处于 near/inside 时退出边界外扩 1.5s 防止临界抖动
 *    - 超短视频 (< 24s)：按比例收窄窗口，避免全列表同时高亮
 */

export const CAPSULE_STATES = Object.freeze({
    IDLE: 'idle',
    NEAR: 'near',
    INSIDE: 'inside',
    LOOPING: 'looping',
    EDITING: 'editing'
});

export const DRAFT_CAPSULE_STATES = Object.freeze({
    EMPTY: 'draft-empty',
    A_MARKED: 'draft-a-marked',
    READY: 'draft-ready',
    EDITING: 'draft-editing'
});

export const PROXIMITY_CONFIG = Object.freeze({
    NEAR_LEAD_SEC: 6.0,
    NEAR_TRAIL_SEC: 4.0,
    HYSTERESIS_SEC: 1.5,
    HIGHLIGHT_HIT_LEAD_SEC: 1.5,
    HIGHLIGHT_HIT_TRAIL_SEC: 3.0,
    HIGHLIGHT_HIT_HYSTERESIS_SEC: 0.75,
    INTERVAL_INSIDE_HYSTERESIS_SEC: 0.5,
    PRIMARY_SWITCH_HYSTERESIS_SEC: 1.2
});

const STATE_TIER_RANK = Object.freeze({
    [CAPSULE_STATES.EDITING]: 4,
    [CAPSULE_STATES.LOOPING]: 3,
    [CAPSULE_STATES.INSIDE]: 2,
    [CAPSULE_STATES.NEAR]: 1,
    [CAPSULE_STATES.IDLE]: 0
});

/**
 * 计算自适应邻近窗口（兼容超短视频与常规长片）
 * @param {number} duration 视频总时长（秒），未知或 <= 0 时按常规长片处理
 */
export function getAdaptiveProximityWindows(duration = 0) {
    if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0 && duration < 24) {
        const leadSec = Math.max(1.5, Math.min(PROXIMITY_CONFIG.NEAR_LEAD_SEC, duration * 0.25));
        const trailSec = Math.max(1.0, Math.min(PROXIMITY_CONFIG.NEAR_TRAIL_SEC, duration * 0.18));
        const hysteresisSec = Math.min(PROXIMITY_CONFIG.HYSTERESIS_SEC, leadSec * 0.25);
        return {
            leadSec,
            trailSec,
            hysteresisSec,
            hitLeadSec: Math.min(PROXIMITY_CONFIG.HIGHLIGHT_HIT_LEAD_SEC, leadSec * 0.6),
            hitTrailSec: Math.min(PROXIMITY_CONFIG.HIGHLIGHT_HIT_TRAIL_SEC, trailSec * 0.75),
            hitHysteresisSec: Math.min(PROXIMITY_CONFIG.HIGHLIGHT_HIT_HYSTERESIS_SEC, hysteresisSec * 0.6),
            intervalInsideHysteresisSec: Math.min(PROXIMITY_CONFIG.INTERVAL_INSIDE_HYSTERESIS_SEC, hysteresisSec * 0.5)
        };
    }

    return {
        leadSec: PROXIMITY_CONFIG.NEAR_LEAD_SEC,
        trailSec: PROXIMITY_CONFIG.NEAR_TRAIL_SEC,
        hysteresisSec: PROXIMITY_CONFIG.HYSTERESIS_SEC,
        hitLeadSec: PROXIMITY_CONFIG.HIGHLIGHT_HIT_LEAD_SEC,
        hitTrailSec: PROXIMITY_CONFIG.HIGHLIGHT_HIT_TRAIL_SEC,
        hitHysteresisSec: PROXIMITY_CONFIG.HIGHLIGHT_HIT_HYSTERESIS_SEC,
        intervalInsideHysteresisSec: PROXIMITY_CONFIG.INTERVAL_INSIDE_HYSTERESIS_SEC
    };
}

function getTabBounds(tab) {
    if (!tab || typeof tab.startTime !== 'number' || Number.isNaN(tab.startTime)) {
        return null;
    }
    if (tab.type === 'interval' && typeof tab.endTime === 'number' && !Number.isNaN(tab.endTime)) {
        const minT = Math.min(tab.startTime, tab.endTime);
        const maxT = Math.max(tab.startTime, tab.endTime);
        return { minT, maxT, spanSec: maxT - minT, isInterval: true };
    }
    return { minT: tab.startTime, maxT: tab.startTime, spanSec: 0, isInterval: false };
}

function computeDistanceToBounds(curTime, bounds) {
    if (curTime < bounds.minT) return bounds.minT - curTime;
    if (curTime > bounds.maxT) return curTime - bounds.maxT;
    return 0;
}

/**
 * 评估单个草稿胶囊状态
 */
export function evaluateDraftCapsuleState(draftTab, { isEditing = false } = {}) {
    if (!draftTab) return DRAFT_CAPSULE_STATES.EMPTY;
    if (isEditing) return DRAFT_CAPSULE_STATES.EDITING;
    const hasA = draftTab.startTime !== null && draftTab.startTime !== undefined;
    const hasB = draftTab.endTime !== null && draftTab.endTime !== undefined;
    if (hasA && hasB) return DRAFT_CAPSULE_STATES.READY;
    if (hasA) return DRAFT_CAPSULE_STATES.A_MARKED;
    return DRAFT_CAPSULE_STATES.EMPTY;
}

/**
 * 判断单点高光胶囊的选中态是否仍有效（离开邻近窗口后自动释放）
 */
export function isHighlightTabWithinWindow(tab, curTime, duration = 0) {
    if (!tab || tab.type !== 'highlight' || typeof curTime !== 'number' || Number.isNaN(curTime)) {
        return false;
    }
    const bounds = getTabBounds(tab);
    if (!bounds) return false;
    const w = getAdaptiveProximityWindows(duration);
    const pad = w.hysteresisSec;
    return curTime >= bounds.minT - w.leadSec - pad && curTime <= bounds.maxT + w.trailSec + pad;
}

/**
 * 评估全部已保存胶囊的瞬时状态并裁决唯一主焦点 (isPrimary)
 *
 * @param {Object} params
 * @param {Array<Object>} params.tabs
 * @param {number} params.curTime
 * @param {number} [params.duration=0]
 * @param {string|null} [params.activeTabId=null]
 * @param {boolean} [params.loopActive=false]
 * @param {string|null} [params.editingTabId=null]
 * @param {Map<string, Object>|null} [params.prevStates=null]
 * @param {string|null} [params.prevPrimaryTabId=null]
 * @returns {{ byId: Map<string, Object>, primaryTabId: string|null, nearCount: number, insideCount: number }}
 */
export function evaluateCapsuleStates({
    tabs = [],
    curTime = 0,
    duration = 0,
    activeTabId = null,
    loopActive = false,
    editingTabId = null,
    prevStates = null,
    prevPrimaryTabId = null
} = {}) {
    const byId = new Map();
    const validTime = typeof curTime === 'number' && Number.isFinite(curTime);
    const w = getAdaptiveProximityWindows(duration);

    let nearCount = 0;
    let insideCount = 0;
    const proximityCandidates = [];

    for (const tab of tabs) {
        if (!tab || !tab.id) continue;
        const bounds = getTabBounds(tab);
        const prev = prevStates instanceof Map ? prevStates.get(tab.id) : null;
        const prevState = prev ? prev.state : CAPSULE_STATES.IDLE;

        const wasInsideOrLoop = prevState === CAPSULE_STATES.INSIDE || prevState === CAPSULE_STATES.LOOPING;
        const wasNearOrHigher = wasInsideOrLoop || prevState === CAPSULE_STATES.NEAR;

        let state = CAPSULE_STATES.IDLE;
        let distanceSec = Infinity;
        let progress = null;
        let spanSec = bounds ? bounds.spanSec : 0;
        let startTime = bounds ? bounds.minT : 0;

        const isEditing = editingTabId === tab.id;
        const isLooping = Boolean(loopActive && activeTabId === tab.id && tab.type === 'interval');
        const isSelectedHighlight = Boolean(!loopActive && activeTabId === tab.id && tab.type === 'highlight');

        if (validTime && bounds) {
            distanceSec = computeDistanceToBounds(curTime, bounds);
        }

        if (isEditing) {
            state = CAPSULE_STATES.EDITING;
        } else if (isLooping) {
            state = CAPSULE_STATES.LOOPING;
            if (validTime && bounds && bounds.spanSec > 0) {
                const rawRatio = (curTime - bounds.minT) / bounds.spanSec;
                progress = Math.max(0, Math.min(1, rawRatio));
            } else {
                progress = 0;
            }
        } else if (validTime && bounds) {
            if (bounds.isInterval) {
                const insidePad = wasInsideOrLoop ? w.intervalInsideHysteresisSec : 0;
                const nearHyst = wasNearOrHigher ? w.hysteresisSec : 0;

                if (curTime >= bounds.minT - insidePad && curTime <= bounds.maxT + insidePad) {
                    state = CAPSULE_STATES.INSIDE;
                    insideCount += 1;
                    if (bounds.spanSec > 0) {
                        progress = Math.max(0, Math.min(1, (curTime - bounds.minT) / bounds.spanSec));
                    }
                } else if (curTime >= bounds.minT - w.leadSec - nearHyst && curTime <= bounds.maxT + w.trailSec + nearHyst) {
                    state = CAPSULE_STATES.NEAR;
                    nearCount += 1;
                }
            } else {
                const hitHyst = wasInsideOrLoop ? w.hitHysteresisSec : 0;
                const nearHyst = wasNearOrHigher ? w.hysteresisSec : 0;

                if (curTime >= bounds.minT - w.hitLeadSec - hitHyst && curTime <= bounds.maxT + w.hitTrailSec + hitHyst) {
                    state = CAPSULE_STATES.INSIDE;
                    insideCount += 1;
                } else if (curTime >= bounds.minT - w.leadSec - nearHyst && curTime <= bounds.maxT + w.trailSec + nearHyst) {
                    state = CAPSULE_STATES.NEAR;
                    nearCount += 1;
                }
            }
        }

        const entry = {
            id: tab.id,
            type: tab.type || 'highlight',
            state,
            tier: STATE_TIER_RANK[state] ?? 0,
            isPrimary: false,
            isSelectedHighlight: isSelectedHighlight && state !== CAPSULE_STATES.IDLE,
            distanceSec,
            spanSec,
            startTime,
            progress
        };

        byId.set(tab.id, entry);

        if (state === CAPSULE_STATES.INSIDE || state === CAPSULE_STATES.NEAR) {
            proximityCandidates.push(entry);
        }
    }

    // 裁决全局唯一主焦点 (primaryTabId)
    let primaryTabId = null;

    if (editingTabId && byId.has(editingTabId)) {
        primaryTabId = editingTabId;
    } else if (loopActive && activeTabId && byId.has(activeTabId)) {
        primaryTabId = activeTabId;
    } else if (proximityCandidates.length > 0) {
        proximityCandidates.sort((a, b) => {
            if (b.tier !== a.tier) return b.tier - a.tier;
            if (Math.abs(a.distanceSec - b.distanceSec) > 0.05) {
                return a.distanceSec - b.distanceSec;
            }
            if (Math.abs(a.spanSec - b.spanSec) > 0.5) {
                return a.spanSec - b.spanSec;
            }
            return a.startTime - b.startTime;
        });

        let winner = proximityCandidates[0];

        // 切换滞回守卫：若上一次主焦点仍处于同一层级且距离差小于阈值，保持稳定不来回跳动
        if (prevPrimaryTabId && prevPrimaryTabId !== winner.id && byId.has(prevPrimaryTabId)) {
            const prevPrimary = byId.get(prevPrimaryTabId);
            if (prevPrimary.tier === winner.tier && prevPrimary.tier > 0) {
                const distAdvantage = prevPrimary.distanceSec - winner.distanceSec;
                const sameSpan = Math.abs(prevPrimary.spanSec - winner.spanSec) <= 0.5;
                if (sameSpan && distAdvantage < PROXIMITY_CONFIG.PRIMARY_SWITCH_HYSTERESIS_SEC) {
                    winner = prevPrimary;
                }
            }
        }

        primaryTabId = winner.id;
    }

    if (primaryTabId && byId.has(primaryTabId)) {
        byId.get(primaryTabId).isPrimary = true;
    }

    return {
        byId,
        primaryTabId,
        nearCount,
        insideCount
    };
}

const ALL_STATE_CLASSES = [
    'is-idle',
    'is-near',
    'near',
    'is-inside',
    'is-looping',
    'looping',
    'is-editing',
    'editing',
    'is-primary',
    'is-active',
    'active'
];

/**
 * 将状态评估结果原子同步到 DOM 节点（胶囊 / 进度条锚点 / BottomSheet 行）
 * @param {HTMLElement} el
 * @param {Object|null} entry
 * @param {{ includeCompatActive?: boolean, syncProgressVar?: boolean }} [options]
 */
export function applyCapsuleStateClasses(el, entry, { includeCompatActive = true, syncProgressVar = false } = {}) {
    if (!el || !el.classList) return;

    for (const cls of ALL_STATE_CLASSES) {
        el.classList.remove(cls);
    }

    if (!entry) {
        el.classList.add('is-idle');
        if (syncProgressVar && el.style) {
            el.style.setProperty('--tab-progress', '0');
        }
        return;
    }

    switch (entry.state) {
        case CAPSULE_STATES.EDITING:
            el.classList.add('is-editing', 'editing');
            if (includeCompatActive) el.classList.add('is-active', 'active');
            break;
        case CAPSULE_STATES.LOOPING:
            el.classList.add('is-looping', 'looping');
            if (includeCompatActive) el.classList.add('is-active', 'active');
            break;
        case CAPSULE_STATES.INSIDE:
            el.classList.add('is-inside');
            if (includeCompatActive && entry.isSelectedHighlight) el.classList.add('is-active', 'active');
            break;
        case CAPSULE_STATES.NEAR:
            el.classList.add('is-near', 'near');
            if (includeCompatActive && entry.isSelectedHighlight) el.classList.add('is-active', 'active');
            break;
        case CAPSULE_STATES.IDLE:
        default:
            el.classList.add('is-idle');
            break;
    }

    if (entry.isPrimary) {
        el.classList.add('is-primary');
    }

    if (syncProgressVar && el.style) {
        const pct = typeof entry.progress === 'number' && Number.isFinite(entry.progress)
            ? Math.max(0, Math.min(1, entry.progress))
            : 0;
        el.style.setProperty('--tab-progress', pct.toFixed(4));
    }
}
