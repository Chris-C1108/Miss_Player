module.exports = {
    id: '01_floating_button',
    name: '浮动按钮挂载与安全区边距',
    category: 'entry',
    
    async run({ cdp, sessionId, oracle, viewport }) {
        const selector = await oracle.resolve('floatingButton', cdp, sessionId);
        
        const btnState = await cdp.evaluate(`
            (function() {
                const btn = document.querySelector('${selector}');
                if (!btn) return null;
                const style = window.getComputedStyle(btn);
                const rect = btn.getBoundingClientRect();
                return {
                    visible: style.display !== 'none' && style.visibility !== 'hidden',
                    display: style.display,
                    position: style.position,
                    zIndex: parseInt(style.zIndex, 10),
                    rect: {
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        width: rect.width,
                        height: rect.height
                    },
                    hasSvg: !!btn.querySelector('svg')
                };
            })()
        `, sessionId);

        if (!btnState) {
            return {
                passed: false,
                error: `未在页面中检索到浮动按钮，匹配选择器: ${selector}`
            };
        }

        const assertions = [];
        if (!btnState.visible) assertions.push('浮动按钮处于不可见状态');
        if (btnState.position !== 'fixed') assertions.push(`期望 position: fixed，实际: ${btnState.position}`);
        if (btnState.rect.width < 40 || btnState.rect.height < 40) assertions.push(`按钮尺寸过小: ${btnState.rect.width}x${btnState.rect.height}`);
        if (!btnState.hasSvg) assertions.push('按钮内缺少播放 SVG 图标');

        // 在移动端视口下，断言安全区外边距
        if (viewport.category === 'mobile') {
            const distanceFromBottom = viewport.height - btnState.rect.bottom;
            if (distanceFromBottom < 10) {
                assertions.push(`移动端底部距离不足 (${distanceFromBottom}px)，可能被系统 Home 键条遮挡`);
            }
        }

        return {
            passed: assertions.length === 0,
            details: btnState,
            assertions
        };
    }
};
