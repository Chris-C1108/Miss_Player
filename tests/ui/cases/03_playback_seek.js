module.exports = {
    id: '03_playback_seek',
    name: '步进快进/退与控制栏',
    category: 'controls',

    async run({ cdp, sessionId, oracle }) {
        const seekSelector = await oracle.resolve('seekRow', cdp, sessionId);

        const seekState = await cdp.evaluate(`
            (function() {
                const seekRow = document.querySelector('${seekSelector}');
                const buttons = seekRow ? Array.from(seekRow.querySelectorAll('button')).map(b => b.innerText.trim()) : [];
                
                // 查找时间指示器 (当前时间与剩余时间)
                const curTimeEl = document.querySelector('.tm-current-time, [class*="current-time"]');
                const remTimeEl = document.querySelector('.tm-remaining-time, [class*="remaining-time"]');
                const timeContainer = document.querySelector('.tm-time-indicator, [class*="time-indicator"]');

                // 查找音量与倍速
                const speedBtn = document.querySelector('.tm-speed-button, [class*="speed-btn"], [title*="倍速"]');
                const volumeBtn = document.querySelector('.tm-volume-button, [class*="volume-btn"]');

                return {
                    hasSeekRow: !!seekRow,
                    buttonLabels: buttons,
                    hasTimeIndicator: !!(curTimeEl || timeContainer),
                    timeText: timeContainer ? timeContainer.innerText.trim() : (curTimeEl ? curTimeEl.innerText.trim() : ''),
                    speedText: speedBtn ? speedBtn.innerText.trim() : '',
                    hasVolume: !!volumeBtn
                };
            })()
        `, sessionId);

        const assertions = [];
        if (!seekState.hasSeekRow) assertions.push(`未找到步进快进控制栏，选择器: ${seekSelector}`);
        if (seekState.buttonLabels.length < 6) assertions.push(`步进按钮数量异常，当前: ${seekState.buttonLabels.length}`);
        
        // 验证关键快退快进步长（如 5s, 10s, 30s, 1m, 5m, 10m）
        const requiredSteps = ['5s', '10s', '30s'];
        for (const step of requiredSteps) {
            if (!seekState.buttonLabels.some(lbl => lbl.includes(step))) {
                assertions.push(`步进栏缺少常见步长: ${step}`);
            }
        }

        return {
            passed: assertions.length === 0,
            details: seekState,
            assertions
        };
    }
};
