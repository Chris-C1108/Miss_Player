import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    CAPSULE_STATES,
    DRAFT_CAPSULE_STATES,
    evaluateCapsuleStates,
    evaluateDraftCapsuleState,
    applyCapsuleStateClasses,
    isHighlightTabWithinWindow,
    getAdaptiveProximityWindows
} from '../src/player/managers/capsuleStateMachine.js';

console.log('🧪 开始验证收藏片段胶囊状态机与邻近高亮引擎...');

// 1. 基础五态流转：idle -> near (-6s/+4s) -> inside -> near -> idle（含滞回防抖）
{
    const tabs = [
        { id: 'h1', type: 'highlight', startTime: 100 },
        { id: 'i1', type: 'interval', startTime: 200, endTime: 220 }
    ];

    // 远离 -> idle
    let res = evaluateCapsuleStates({ tabs, curTime: 50, duration: 600 });
    assert.equal(res.byId.get('h1').state, CAPSULE_STATES.IDLE);
    assert.equal(res.byId.get('i1').state, CAPSULE_STATES.IDLE);
    assert.equal(res.primaryTabId, null);

    // 提前 5.5s 预告进入 near（非对称 lead 6.0s）
    res = evaluateCapsuleStates({ tabs, curTime: 94.5, duration: 600, prevStates: res.byId, prevPrimaryTabId: res.primaryTabId });
    assert.equal(res.byId.get('h1').state, CAPSULE_STATES.NEAR);
    assert.equal(res.byId.get('h1').isPrimary, true);
    assert.equal(res.primaryTabId, 'h1');

    // 到达单点高光命中窗 [-1.5s, +3.0s] -> inside
    res = evaluateCapsuleStates({ tabs, curTime: 100.8, duration: 600, prevStates: res.byId, prevPrimaryTabId: res.primaryTabId });
    assert.equal(res.byId.get('h1').state, CAPSULE_STATES.INSIDE);
    assert.equal(res.byId.get('h1').isPrimary, true);

    // 离开单点后 4.8s（超出 trail 4.0s，但在滞回 +1.5s = 5.5s 内）-> 仍保持 near 不闪烁
    res = evaluateCapsuleStates({ tabs, curTime: 104.8, duration: 600, prevStates: res.byId, prevPrimaryTabId: res.primaryTabId });
    assert.equal(res.byId.get('h1').state, CAPSULE_STATES.NEAR);

    // 超过滞回边界 105.6s -> 回到 idle
    res = evaluateCapsuleStates({ tabs, curTime: 105.6, duration: 600, prevStates: res.byId, prevPrimaryTabId: res.primaryTabId });
    assert.equal(res.byId.get('h1').state, CAPSULE_STATES.IDLE);
    assert.equal(res.primaryTabId, null);

    // 进入区间片段内部 -> inside 且输出精确 0~1 progress
    res = evaluateCapsuleStates({ tabs, curTime: 210, duration: 600 });
    assert.equal(res.byId.get('i1').state, CAPSULE_STATES.INSIDE);
    assert.equal(res.byId.get('i1').progress, 0.5);
    assert.equal(res.byId.get('i1').isPrimary, true);
}

// 2. 多胶囊并发邻近裁决：最近距离胜出 + 更紧凑区间胜出 + 切换滞回守卫
{
    const tabs = [
        { id: 'tA', type: 'highlight', startTime: 100 },
        { id: 'tB', type: 'highlight', startTime: 104 },
        { id: 'outer', type: 'interval', startTime: 300, endTime: 400 },
        { id: 'inner', type: 'interval', startTime: 320, endTime: 335 }
    ];

    // 在 103.5s 时，tB 距 0.5s，tA 距 3.5s（tB 为 inside，tA 为 near）-> 必须选 tB 而非数组靠前的 tA
    const r1 = evaluateCapsuleStates({ tabs, curTime: 103.5, duration: 600 });
    assert.equal(r1.byId.get('tA').state, CAPSULE_STATES.NEAR);
    assert.equal(r1.byId.get('tB').state, CAPSULE_STATES.INSIDE);
    assert.equal(r1.primaryTabId, 'tB');

    // 在 101.6s 时先锁定 tA 为 primary；随后轻微移到 102.1s（tB 仅近 0.2s < 1.2s 滞回）-> 保持 tA 不抖动
    const lockA = evaluateCapsuleStates({ tabs, curTime: 101.6, duration: 600 });
    assert.equal(lockA.primaryTabId, 'tA');
    const holdA = evaluateCapsuleStates({
        tabs,
        curTime: 102.1,
        duration: 600,
        prevStates: lockA.byId,
        prevPrimaryTabId: lockA.primaryTabId
    });
    assert.equal(holdA.primaryTabId, 'tA');

    // 同时命中宽区间与紧凑子区间时 -> 更紧凑的子区间成为唯一主焦点
    const nested = evaluateCapsuleStates({ tabs, curTime: 325, duration: 600 });
    assert.equal(nested.byId.get('outer').state, CAPSULE_STATES.INSIDE);
    assert.equal(nested.byId.get('inner').state, CAPSULE_STATES.INSIDE);
    assert.equal(nested.primaryTabId, 'inner');
    assert.equal(nested.byId.get('outer').isPrimary, false);
}

// 3. 互斥优先级：editing > looping > inside > near > idle
{
    const tabs = [
        { id: 'h1', type: 'highlight', startTime: 100 },
        { id: 'i1', type: 'interval', startTime: 200, endTime: 220 }
    ];

    // 循环中的区间即使当前帧刚离开边界也归为 looping（直到外部 checkAndExitLoopIfOutside 退出）
    const rLoop = evaluateCapsuleStates({
        tabs,
        curTime: 210,
        duration: 600,
        activeTabId: 'i1',
        loopActive: true
    });
    assert.equal(rLoop.byId.get('i1').state, CAPSULE_STATES.LOOPING);
    assert.equal(rLoop.byId.get('i1').progress, 0.5);
    assert.equal(rLoop.primaryTabId, 'i1');

    // 编辑态优先级最高，压倒循环态与邻近态
    const rEdit = evaluateCapsuleStates({
        tabs,
        curTime: 210,
        duration: 600,
        activeTabId: 'i1',
        loopActive: true,
        editingTabId: 'h1'
    });
    assert.equal(rEdit.byId.get('h1').state, CAPSULE_STATES.EDITING);
    assert.equal(rEdit.primaryTabId, 'h1');
}

// 4. 超短视频自适应窗口 + 单点高光选中释放判定
{
    const shortWin = getAdaptiveProximityWindows(12);
    assert.ok(shortWin.leadSec <= 3.1 && shortWin.leadSec >= 1.5, '12s 短视频邻近前瞻窗口应按比例收窄');

    const hTab = { id: 'h1', type: 'highlight', startTime: 100 };
    assert.equal(isHighlightTabWithinWindow(hTab, 98, 600), true);
    assert.equal(isHighlightTabWithinWindow(hTab, 130, 600), false);
}

// 5. 草稿胶囊四态 + DOM classList / --tab-progress 同步器
{
    assert.equal(evaluateDraftCapsuleState(null), DRAFT_CAPSULE_STATES.EMPTY);
    assert.equal(evaluateDraftCapsuleState({ startTime: null, endTime: null }), DRAFT_CAPSULE_STATES.EMPTY);
    assert.equal(evaluateDraftCapsuleState({ startTime: 12, endTime: null }), DRAFT_CAPSULE_STATES.A_MARKED);
    assert.equal(evaluateDraftCapsuleState({ startTime: 12, endTime: 24 }), DRAFT_CAPSULE_STATES.READY);
    assert.equal(evaluateDraftCapsuleState({ startTime: 12, endTime: 24 }, { isEditing: true }), DRAFT_CAPSULE_STATES.EDITING);

    const fakeClassSet = new Set(['tm-tab-pill', 'near', 'active']);
    const fakeProps = new Map();
    const fakeEl = {
        classList: {
            add: (...cls) => cls.forEach(c => fakeClassSet.add(c)),
            remove: (...cls) => cls.forEach(c => fakeClassSet.delete(c)),
            contains: (c) => fakeClassSet.has(c)
        },
        style: {
            setProperty: (k, v) => fakeProps.set(k, v)
        }
    };

    applyCapsuleStateClasses(fakeEl, {
        state: CAPSULE_STATES.INSIDE,
        isPrimary: true,
        isSelectedHighlight: false,
        progress: 0.42
    }, { includeCompatActive: true, syncProgressVar: true });

    assert.equal(fakeClassSet.has('is-inside'), true);
    assert.equal(fakeClassSet.has('is-primary'), true);
    assert.equal(fakeClassSet.has('near'), false);
    assert.equal(fakeClassSet.has('active'), false);
    assert.equal(fakeProps.get('--tab-progress'), '0.4200');
}

// 6. 源码契约：LoopManager / MarkerBottomSheet / CSS 接入完整状态机且无 inline linear-gradient
{
    const loopJs = fs.readFileSync('src/player/managers/LoopManager.js', 'utf8');
    const sheetJs = fs.readFileSync('src/player/managers/MarkerBottomSheet.js', 'utf8');
    const markerCss = fs.readFileSync('src/player/ui/styles/02_components/_marker_sheet.css', 'utf8');
    const panelCss = fs.readFileSync('src/player/ui/styles/02_components/_control_panel.css', 'utf8');

    assert.ok(loopJs.includes('evaluateCapsuleStates'), 'LoopManager 必须接入 evaluateCapsuleStates');
    assert.ok(loopJs.includes('syncProximityState'), 'LoopManager 必须具备统一 syncProximityState 同步入口');
    assert.ok(loopJs.includes("addEventListener('seeked'"), 'LoopManager 必须监听 seeked 实现暂停拖动即时高亮');
    assert.ok(loopJs.includes('tm-tab-progress-fill'), 'LoopManager 必须为区间胶囊渲染 GPU 进度填充层');
    assert.ok(!loopJs.includes('linear-gradient('), 'LoopManager 禁止使用 inline pill.style.background linear-gradient');
    assert.ok(sheetJs.includes('applyCapsuleStateClasses'), 'MarkerBottomSheet 必须同步胶囊邻近态');
    assert.ok(markerCss.includes('.tm-tab-pill.is-inside') && markerCss.includes('.tm-tab-pill.is-primary'), 'CSS 必须定义完整胶囊状态层次');
    assert.ok(markerCss.includes('.tm-tab-loop-badge'), 'CSS 必须提供不遮挡时间文本的 .tm-tab-loop-badge');
    assert.ok(panelCss.includes('.tm-progress-marker-tick.is-near') && panelCss.includes('.tm-progress-marker-range.is-inside'), '进度条标记必须与胶囊状态联动高亮');
}

console.log('✅ 收藏片段胶囊状态机与邻近高亮全部测试通过！');
