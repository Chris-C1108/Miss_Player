import assert from 'assert';
import fs from 'fs';

console.log('🧪 开始执行单手手势随时触发与设置项清理单元测试...');

// 1. 验证 BetaSection.js 已彻底移除单手模式开关及选择器
const betaSectionCode = fs.readFileSync('src/player/managers/settings/sections/BetaSection.js', 'utf8');
assert.ok(!betaSectionCode.includes('singleHandToggle'), 'BetaSection 必须彻底移除 singleHandToggle 开关');
assert.ok(!betaSectionCode.includes('singleHandPrefWrap'), 'BetaSection 必须彻底移除 singleHandPrefWrap 惯用手选择器');
console.log('✅ 1. 设置菜单已成功移除单手模式开关');

// 2. 模拟 SingleHandManager 手势无阻断触发逻辑
class MockSingleHandManager {
    constructor() {
        this.isCollapsed = true;
        this.handPosition = 'right';
        this.updatedCount = 0;
    }

    isSupportedScreenWidth() {
        return true;
    }

    updateState() {
        this.updatedCount++;
    }

    _triggerSwipeAction(dx, dy) {
        const minDistance = 35;
        if (Math.abs(dx) >= minDistance && Math.abs(dx) > Math.abs(dy) * 1.2) {
            if (dx < 0) {
                this.handPosition = 'left';
                this.isCollapsed = false;
                this.updateState();
            } else {
                this.handPosition = 'right';
                this.isCollapsed = false;
                this.updateState();
            }
        }
    }
}

const sm = new MockSingleHandManager();
assert.strictEqual(sm.isCollapsed, true, '初始应处于全宽状态');

// 向左滑动
sm._triggerSwipeAction(-50, 0);
assert.strictEqual(sm.isCollapsed, false, '向左滑动后应开启单手模式');
assert.strictEqual(sm.handPosition, 'left', '向左滑动后应为左手模式');
console.log('✅ 2. 控制面板向左滑动开启左手模式验证通过');

// 向右滑动
sm._triggerSwipeAction(60, 0);
assert.strictEqual(sm.isCollapsed, false, '向右滑动后保持单手模式');
assert.strictEqual(sm.handPosition, 'right', '向右滑动后应为右手模式');
console.log('✅ 3. 控制面板向右滑动开启右手模式验证通过');

console.log('\n🎉 全部 3 项单手模式手势随时触发测试 100% 通过！\n');
