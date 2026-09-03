module.exports = {
    id: '06_settings_panel',
    name: '设置面板展开与侧边遮挡完整性',
    category: 'settings',

    async run({ cdp, sessionId, oracle }) {
        const btnSelector = await oracle.resolve('settingsButton', cdp, sessionId);
        const panelSelector = await oracle.resolve('settingsPanel', cdp, sessionId);

        // 1. 点击齿轮打开设置面板
        await cdp.evaluate(`
            (function() {
                const btn = document.querySelector('${btnSelector}');
                if (btn) btn.click();
            })()
        `, sessionId);

        await new Promise(r => setTimeout(r, 600));

        // 2. 检查设置面板状态与空间重叠几何属性
        const panelState = await cdp.evaluate(`
            (function() {
                const panel = document.querySelector('${panelSelector}');
                const sidebar = document.querySelector('.tm-comments-panel');
                if (!panel) return { hasPanel: false };

                const style = window.getComputedStyle(panel);
                const isActive = panel.classList.contains('active') || style.opacity === '1';
                const pRect = panel.getBoundingClientRect();
                const sRect = sidebar ? sidebar.getBoundingClientRect() : null;

                // 计算是否完全遮盖侧边栏左缘
                let leftGap = 0;
                if (sRect && pRect) {
                    leftGap = Math.round(pRect.left - sRect.left);
                }

                // 统计设置项与开关
                const toggles = Array.from(panel.querySelectorAll('input[type="checkbox"], .tm-toggle, [role="switch"]')).length;
                const rows = Array.from(panel.querySelectorAll('.tm-setting-item, .tm-settings-row')).map(r => r.innerText.trim());

                return {
                    hasPanel: true,
                    isActive,
                    leftGap,
                    panelWidth: Math.round(pRect.width),
                    sidebarWidth: sRect ? Math.round(sRect.width) : 0,
                    togglesCount: toggles,
                    rowsCount: rows.length
                };
            })()
        `, sessionId);

        const assertions = [];
        if (!panelState.hasPanel) {
            return { passed: false, error: `未找到设置面板，选择器: ${panelSelector}` };
        }
        if (!panelState.isActive) {
            assertions.push('点击设置按钮后面板未能激活 (缺少 .active 类或 opacity !== 1)');
        }

        // 视觉防侧漏断言：设置面板展开时不应留出大于 20px 的左隙让下层文字露头
        if (panelState.leftGap > 20) {
            assertions.push(`⚠️ 视觉间隙缺陷：设置卡片未填满侧边栏宽度 (左侧漏出 ${panelState.leftGap}px 缝隙，导致底层评论文字残损渗出)`);
        }

        // 3. 测试完毕后再次点击齿轮关闭设置面板，恢复主界面状态
        await cdp.evaluate(`
            (function() {
                const btn = document.querySelector('${btnSelector}');
                if (btn) btn.click();
            })()
        `, sessionId);
        await new Promise(r => setTimeout(r, 400));

        return {
            passed: assertions.length === 0,
            details: panelState,
            assertions
        };
    }
};
