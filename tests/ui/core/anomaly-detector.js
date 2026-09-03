/**
 * AnomalyDetector: 自动视觉与数据缺陷自进化感应器
 * 负责在各视口与步骤下，深度扫描 DOM 状态与样式，精准捕获前端缺陷
 */

class AnomalyDetector {
    /**
     * 对目标容器及其子节点执行全局健康与视觉巡检
     */
    static async scan(cdp, sessionId, options = {}) {
        const result = await cdp.evaluate(`
            (function() {
                const anomalies = [];

                // 1. 脏数据/格式化崩塌检测 (Invalid Date, undefined, NaN, [object Object])
                const textNodes = [];
                const walk = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                let n;
                while (n = walk.nextNode()) {
                    const val = n.nodeValue.trim();
                    if (!val) continue;
                    
                    // 仅检测 Miss Player 相关的容器
                    const parent = n.parentElement;
                    if (!parent) continue;
                    const inMp = parent.closest('[class*="tm-"], [class*="jc-"], #tm-theater-modal');
                    if (!inMp) continue;

                    if (val.includes('Invalid Date')) {
                        anomalies.push({
                            type: 'DIRTY_DATA_INVALID_DATE',
                            severity: 'CRITICAL',
                            message: '检测到时间解析失败，渲染为 "Invalid Date"',
                            elementTag: parent.tagName,
                            className: parent.className,
                            textSnippet: val,
                            xpath: parent.getAttribute('data-id') || parent.className
                        });
                    }

                    if (val === 'undefined' || val === 'NaN' || val.includes('[object Object]')) {
                        anomalies.push({
                            type: 'DIRTY_DATA_LEAK',
                            severity: 'HIGH',
                            message: '检测到底层 JS 原始未定义或对象泄露至 UI 文本: ' + val,
                            elementTag: parent.tagName,
                            className: parent.className
                        });
                    }
                }

                // 2. 侧边栏与设置面板侧溢/遮挡缺陷检测 (Background text leakage)
                const settingsPanel = document.querySelector('.tm-settings-panel.active');
                const commentsPanel = document.querySelector('.tm-comments-panel');
                if (settingsPanel && commentsPanel) {
                    const sRect = settingsPanel.getBoundingClientRect();
                    const cRect = commentsPanel.getBoundingClientRect();
                    // 如果设置面板比侧边栏窄超过 20px，且下方有可见评论，判定为侧溢漏字缺陷
                    const leftGap = sRect.left - cRect.left;
                    if (leftGap > 20) {
                        anomalies.push({
                            type: 'VISUAL_OVERLAY_GAP',
                            severity: 'WARNING',
                            message: \`设置面板展开时，左侧存在 \${Math.round(leftGap)}px 间隙未完全遮盖底层评论内容，导致背景文字侧溢\`,
                            metrics: { leftGap, settingsWidth: sRect.width, sidebarWidth: cRect.width }
                        });
                    }
                }

                // 3. 元素隐藏/塌陷异常 (存在文本但尺寸为 0)
                const controlButtons = Array.from(document.querySelectorAll('.tm-control-buttons button, .tm-comments-panel button'));
                controlButtons.forEach(btn => {
                    const style = window.getComputedStyle(btn);
                    if (style.display !== 'none' && style.visibility !== 'hidden') {
                        const rect = btn.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) {
                            anomalies.push({
                                type: 'LAYOUT_ZERO_DIMENSION',
                                severity: 'HIGH',
                                message: '控制按钮尺寸塌陷为 0',
                                className: btn.className,
                                title: btn.title || btn.innerText
                            });
                        }
                    }
                });

                // 4. 容器意外横向滚动溢出检测 (Horizontal scroll overflow)
                const scrollContainers = Array.from(document.querySelectorAll('.tm-comments-panel, .tm-settings-panel, .tm-comments-list'));
                scrollContainers.forEach(el => {
                    if (el.scrollWidth > el.clientWidth + 2) {
                        anomalies.push({
                            type: 'LAYOUT_HORIZONTAL_OVERFLOW',
                            severity: 'MEDIUM',
                            message: '容器出现非预期的横向滚动条或宽度溢出',
                            className: el.className,
                            overflowPixels: el.scrollWidth - el.clientWidth
                        });
                    }
                });

                return anomalies;
            })()
        `, sessionId);

        return result || [];
    }
}

module.exports = AnomalyDetector;
