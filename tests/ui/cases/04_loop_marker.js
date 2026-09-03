module.exports = {
    id: '04_loop_marker',
    name: 'A-B 循环与打点标签控制',
    category: 'markers',

    async run({ cdp, sessionId, oracle }) {
        const loopSelector = await oracle.resolve('loopRow', cdp, sessionId);

        const loopState = await cdp.evaluate(`
            (function() {
                const loopRow = document.querySelector('${loopSelector}');
                if (!loopRow) return null;

                const buttons = Array.from(loopRow.querySelectorAll('button')).map(b => ({
                    className: b.className,
                    title: b.title || '',
                    text: b.innerText.trim()
                }));

                const draftDisplay = loopRow.querySelector('.tm-draft-display, [class*="draft"]');
                const isDraftVisible = draftDisplay ? window.getComputedStyle(draftDisplay).display !== 'none' : false;

                return {
                    hasLoopRow: true,
                    buttons,
                    isDraftVisible
                };
            })()
        `, sessionId);

        if (!loopState) {
            return {
                passed: false,
                error: `未找到打点控制栏，选择器: ${loopSelector}`
            };
        }

        const assertions = [];
        if (loopState.buttons.length < 2) {
            assertions.push(`打点栏按钮数量过少: ${loopState.buttons.length}`);
        }

        return {
            passed: assertions.length === 0,
            details: loopState,
            assertions
        };
    }
};
