module.exports = {
    id: '05_comment_system',
    name: '评论区数据展示与时间格式化合规',
    category: 'comments',

    async run({ cdp, sessionId, oracle }) {
        const panelSelector = await oracle.resolve('commentsPanel', cdp, sessionId);
        const cardSelector = await oracle.resolve('commentCards', cdp, sessionId);

        const commentState = await cdp.evaluate(`
            (function() {
                const panel = document.querySelector('${panelSelector}');
                if (!panel) return { hasPanel: false };

                const badges = Array.from(document.querySelectorAll('.tm-source-badge, [class*="source-badge"]')).map(b => ({
                    text: b.innerText.trim(),
                    className: b.className
                }));

                const cards = Array.from(document.querySelectorAll('${cardSelector}')).map(card => {
                    const timeEl = card.querySelector('.jc-t, [class*="time"], [class*="date"]');
                    const userEl = card.querySelector('.jc-u, [class*="user"], [class*="author"]');
                    const textEl = card.querySelector('.jc-body-text, [class*="text"], [class*="content"]');
                    const scoreEl = card.querySelector('.jc-score-badge, [class*="score"]');

                    return {
                        id: card.getAttribute('data-id') || '',
                        time: timeEl ? timeEl.innerText.trim() : '',
                        user: userEl ? userEl.innerText.trim() : '',
                        textLen: textEl ? textEl.innerText.trim().length : 0,
                        score: scoreEl ? scoreEl.innerText.trim() : ''
                    };
                });

                return {
                    hasPanel: true,
                    badges,
                    cardCount: cards.length,
                    invalidDateCount: cards.filter(c => c.time === 'Invalid Date' || c.time.includes('Invalid')).length,
                    sampleCards: cards.slice(0, 5)
                };
            })()
        `, sessionId);

        const assertions = [];
        if (!commentState.hasPanel) {
            return { passed: false, error: `未找到评论面板，选择器: ${panelSelector}` };
        }

        // 核心质量断言：严禁出现 Invalid Date 脏数据渲染
        if (commentState.invalidDateCount > 0) {
            assertions.push(`🚨 严重缺陷：检测到 ${commentState.invalidDateCount} 条评论时间格式化异常，渲染为 "Invalid Date"！`);
        }

        return {
            passed: assertions.length === 0,
            details: commentState,
            assertions
        };
    }
};
