import assert from 'assert';

console.log('🧪 开始执行胶囊编辑状态时间跳转免疫与点击守卫单元测试...');

class MockLoopManager {
    constructor() {
        this.editingTabId = null;
        this.editingTabCopy = null;
        this.loopActive = false;
        this.loopStartTime = null;
        this.loopEndTime = null;
        this.tabs = [
            { id: 'tab-1', startTime: 60, endTime: 120, type: 'interval', comment: '测试切片' }
        ];
    }

    _enterEditMode(tab) {
        this.editingTabId = tab.id;
        this.editingTabCopy = { ...tab };
        this.disableLoop();
    }

    _exitEditMode() {
        this.editingTabId = null;
        this.editingTabCopy = null;
    }

    disableLoop() {
        this.loopActive = false;
        this.loopStartTime = null;
        this.loopEndTime = null;
    }

    checkAndExitLoopIfOutside(targetTime) {
        // 关键守卫：若当前处于胶囊编辑状态，严禁打断或退出编辑
        if (this.editingTabId) {
            return false;
        }

        if (!this.loopActive || this.loopStartTime === null || this.loopEndTime === null) {
            return false;
        }

        const isOutside = targetTime < (this.loopStartTime - 0.05) || targetTime > (this.loopEndTime + 0.05);
        if (isOutside) {
            this.disableLoop();
            return true;
        }
        return false;
    }

    _handleOutsideClickForEdit(e) {
        if (!this.editingTabId) return;

        const path = typeof e.composedPath === 'function' ? e.composedPath() : [];

        const isClickInsideEditingPill = path.some(el =>
            el && typeof el === 'object' && el.classList?.contains?.('editing') && el.classList?.contains?.('tm-tab-pill')
        );
        if (isClickInsideEditingPill) return;

        const isClickInsidePlayerOrControls = path.some(el => {
            if (!el || typeof el !== 'object') return false;
            const cls = typeof el.className === 'string' ? el.className : '';
            const tag = el.tagName ? el.tagName.toLowerCase() : '';
            return (
                tag === 'miss-player-root' ||
                cls.includes('tm-player-container') ||
                cls.includes('tm-control-panel') ||
                cls.includes('tm-progress-controls') ||
                cls.includes('tm-progress-bar') ||
                cls.includes('tm-seek-control-row') ||
                cls.includes('tm-loop-control-row') ||
                cls.includes('tm-playback-control-row')
            );
        });

        if (isClickInsidePlayerOrControls) {
            return;
        }

        this._exitEditMode();
    }
}

const lm = new MockLoopManager();
const targetTab = lm.tabs[0];

// 1. 进入编辑模式
lm._enterEditMode(targetTab);
assert.strictEqual(lm.editingTabId, 'tab-1', '进入编辑模式后 editingTabId 应为 tab-1');
console.log('✅ 1. 进入胶囊编辑模式断言通过');

// 2. 模拟时间跳转超出区间：跳到 30 秒 (小于开始时间 60s)
const resBefore = lm.checkAndExitLoopIfOutside(30);
assert.strictEqual(resBefore, false, '编辑模式下 checkAndExitLoopIfOutside 应直接返回 false');
assert.strictEqual(lm.editingTabId, 'tab-1', '时间跳转至开始时间前，编辑态必须严格保持');
console.log('✅ 2. 时间跳转至开始时间之前，编辑状态不被取消断言通过');

// 3. 模拟时间跳转超出区间：跳到 300 秒 (远大于结束时间 120s)
const resAfter = lm.checkAndExitLoopIfOutside(300);
assert.strictEqual(resAfter, false, '编辑模式下 checkAndExitLoopIfOutside 应直接返回 false');
assert.strictEqual(lm.editingTabId, 'tab-1', '时间跳转至结束时间后，编辑态必须严格保持');
console.log('✅ 3. 时间跳转至结束时间之后，编辑状态不被取消断言通过');

// 4. 模拟点击进度条内部 (Shadow DOM 冒泡路径)
const mockProgressBarClickEvent = {
    composedPath: () => [
        { tagName: 'DIV', className: 'tm-progress-bar' },
        { tagName: 'DIV', className: 'tm-progress-controls' },
        { tagName: 'DIV', className: 'tm-player-container' },
        { tagName: 'MISS-PLAYER-ROOT' }
    ]
};
lm._handleOutsideClickForEdit(mockProgressBarClickEvent);
assert.strictEqual(lm.editingTabId, 'tab-1', '点击进度条或控制栏，编辑状态绝对不能退出');
console.log('✅ 4. 进度条与播放器组件点击穿透守卫断言通过');

// 5. 模拟真正点击播放器完全外部的宿主网页元素
const mockHostOutsideClickEvent = {
    composedPath: () => [
        { tagName: 'DIV', className: 'site-body-content' },
        { tagName: 'BODY' },
        { tagName: 'HTML' }
    ]
};
lm._handleOutsideClickForEdit(mockHostOutsideClickEvent);
assert.strictEqual(lm.editingTabId, null, '点击播放器完全外部内容，应正确退出编辑状态');
console.log('✅ 5. 播放器完全外部点击退出编辑断言通过');

console.log('\n🎉 全部 5 项胶囊编辑状态时间跳转免疫测试 100% 通过！\n');
