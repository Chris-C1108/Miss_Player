module.exports = {
    id: '02_theater_mode',
    name: '影院模式唤起与视频容器转移',
    category: 'core_layout',

    async run({ cdp, sessionId, oracle, viewport }) {
        const btnSelector = await oracle.resolve('floatingButton', cdp, sessionId);

        // 如果未进入影院模式，触发点击进入
        await cdp.evaluate(`
            (function() {
                if (!document.body.classList.contains('tm-player-active')) {
                    const btn = document.querySelector('${btnSelector}');
                    if (btn) btn.click();
                }
            })()
        `, sessionId);

        // 等待 1s 动画稳定
        await new Promise(r => setTimeout(r, 1000));

        const theaterState = await cdp.evaluate(`
            (function() {
                const isBodyActive = document.body.classList.contains('tm-player-active');
                const videoWrapper = document.querySelector('.tm-video-wrapper');
                const videoInWrapper = videoWrapper ? videoWrapper.querySelector('video') : null;
                const placeholder = document.querySelector('.tm-video-placeholder');
                const sidebar = document.querySelector('.tm-comments-panel');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                const titleBar = document.querySelector('.tm-player-title, [class*="player-title"]');

                return {
                    isBodyActive,
                    hasVideoWrapper: !!videoWrapper,
                    hasVideoMounted: !!videoInWrapper,
                    videoSrc: videoInWrapper ? (videoInWrapper.src || videoInWrapper.currentSrc) : '',
                    hasPlaceholder: !!placeholder,
                    hasSidebar: !!sidebar,
                    sidebarRect,
                    hasTitle: !!titleBar,
                    titleText: titleBar ? titleBar.innerText.trim() : ''
                };
            })()
        `, sessionId);

        const assertions = [];
        if (!theaterState.isBodyActive) assertions.push('body 未包含 tm-player-active 类名');
        if (!theaterState.hasVideoMounted) assertions.push('主视频未挂载至 .tm-video-wrapper 容器中');
        if (!theaterState.hasPlaceholder) assertions.push('原视频宿主位置未创建 .tm-video-placeholder 占位符');

        // 在桌面分栏模式下，侧边栏宽度应保持约为 380px
        if (viewport.category === 'desktop' && theaterState.sidebarRect) {
            const width = Math.round(theaterState.sidebarRect.width);
            if (width < 340 || width > 420) {
                assertions.push(`桌面分栏侧边栏宽度异常，当前: ${width}px (期望约 380px)`);
            }
        }

        return {
            passed: assertions.length === 0,
            details: theaterState,
            assertions
        };
    }
};
