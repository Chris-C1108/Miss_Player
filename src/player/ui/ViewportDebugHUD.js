/**
 * ViewportDebugHUD — 移动端视口与输入框物理坐标实时探针浮层
 * 
 * 职责：
 * 1. 实时显示 window.visualViewport、window.innerHeight、playerContainer、activeElement 以及 submitBar 的真实像素坐标与差值；
 * 2. 深度穿透 Shadow DOM 实时监听捕获所有 input/textarea 的 focus、blur 以及视口 resize/scroll 事件；
 * 3. 记录事件时间序列与几何快照，支持一键将完整日志拷贝至剪贴板，供排查 iOS Safari 键盘避让物理数值。
 */

import { copyToClipboard, Toast } from '../../utils/index.js';

export class ViewportDebugHUD {
    static _container = null;
    static _isCollapsed = false;
    static _logs = [];
    static _maxLogs = 80;
    static _timerId = null;
    static _listeners = [];
    static _playerContainer = null;
    static _shadowRoot = null;

    /**
     * 初始化并在播放器顶部注入调试 HUD 探针
     * @param {HTMLElement} playerContainer 
     * @param {ShadowRoot} shadowRoot 
     */
    static init(playerContainer, shadowRoot) {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        this._playerContainer = playerContainer;
        this._shadowRoot = shadowRoot;

        // 如果已存在先销毁
        this.destroy();

        // 仅在存在 DOM 时创建
        const mountTarget = playerContainer || shadowRoot || document.body;
        this._container = document.createElement('div');
        this._container.className = 'tm-viewport-debug-hud';

        // 注入自包含内联样式 (完全独立，零污染，零外部 !important 占用)
        const style = document.createElement('style');
        style.textContent = `
            .tm-viewport-debug-hud {
                position: absolute;
                top: max(46px, env(safe-area-inset-top, 46px));
                left: 6px;
                right: 6px;
                z-index: 2000000030;
                background: rgba(12, 14, 18, 0.94);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
                color: #e2e8f0;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 10px;
                line-height: 1.35;
                padding: 6px 10px;
                box-sizing: border-box;
                pointer-events: auto;
                user-select: text;
                -webkit-user-select: text;
                transition: height 0.2s ease, opacity 0.2s ease;
            }
            .tm-hud-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                margin-bottom: 4px;
            }
            .tm-hud-title-wrap {
                display: flex;
                align-items: center;
                gap: 5px;
                font-weight: 700;
                color: #38bdf8;
                font-size: 11px;
            }
            .tm-hud-badge {
                font-size: 9px;
                padding: 1px 4px;
                border-radius: 4px;
                background: rgba(34, 197, 94, 0.2);
                color: #4ade80;
                border: 1px solid rgba(34, 197, 94, 0.4);
            }
            .tm-hud-actions {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .tm-hud-btn {
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 2px 7px;
                border-radius: 6px;
                font-size: 10px;
                cursor: pointer;
                outline: none;
                transition: background 0.15s, transform 0.1s;
            }
            .tm-hud-btn:active {
                transform: scale(0.95);
            }
            .tm-hud-btn-copy {
                background: #0284c7;
                border-color: #38bdf8;
                font-weight: 700;
                color: #ffffff;
            }
            .tm-hud-body {
                display: flex;
                flex-direction: column;
                gap: 3px;
                max-height: 140px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            .tm-hud-row {
                display: flex;
                align-items: center;
                gap: 4px;
                flex-wrap: wrap;
                word-break: break-all;
            }
            .tm-hud-lbl {
                color: #94a3b8;
                font-weight: 600;
            }
            .tm-hud-val {
                color: #f8fafc;
            }
            .tm-hud-highlight {
                color: #fbbf24;
                font-weight: 700;
            }
            .tm-hud-gap-perfect {
                color: #4ade80;
                font-weight: 700;
            }
            .tm-hud-gap-warn {
                color: #f87171;
                font-weight: 700;
            }
            .tm-hud-logs-preview {
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px dashed rgba(255, 255, 255, 0.1);
                color: #cbd5e1;
                font-size: 9px;
                max-height: 52px;
                overflow-y: auto;
            }
            .tm-hud-collapsed .tm-hud-body,
            .tm-hud-collapsed .tm-hud-logs-preview {
                display: none;
            }
        `;
        this._container.appendChild(style);

        this._container.innerHTML += `
            <div class="tm-hud-header">
                <div class="tm-hud-title-wrap">
                    <span>🔍 视口探针 HUD</span>
                    <span class="tm-hud-badge">实时</span>
                </div>
                <div class="tm-hud-actions">
                    <button type="button" class="tm-hud-btn tm-hud-btn-copy" id="tm-hud-copy-btn">📋 复制日志 (0)</button>
                    <button type="button" class="tm-hud-btn" id="tm-hud-clear-btn">清空</button>
                    <button type="button" class="tm-hud-btn" id="tm-hud-toggle-btn">折叠</button>
                </div>
            </div>
            <div class="tm-hud-body" id="tm-hud-live-metrics">
                <div class="tm-hud-row">正在初始化视口测量数据...</div>
            </div>
            <div class="tm-hud-logs-preview" id="tm-hud-logs-list">
                [就绪] 正在监听所有 input 聚焦与键盘视口变化...
            </div>
        `;

        mountTarget.appendChild(this._container);

        // 绑定按钮事件
        const copyBtn = this._container.querySelector('#tm-hud-copy-btn');
        const clearBtn = this._container.querySelector('#tm-hud-clear-btn');
        const toggleBtn = this._container.querySelector('#tm-hud-toggle-btn');

        if (copyBtn) copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyLogs();
        });

        if (clearBtn) clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearLogs();
        });

        if (toggleBtn) toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });

        // 启动全局事件追踪与周期性指标更新
        this._bindEventListeners();
        this._startPolling();

        // 记录初始就绪事件
        this.recordEvent('HUD_READY', '探针初始化就绪');
    }

    /**
     * 获取穿透 Shadow DOM 的真正 activeElement
     */
    static getDeepActiveElement() {
        let el = document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            el = el.shadowRoot.activeElement;
        }
        return el;
    }

    /**
     * 获取当前物理指标快照对象
     */
    static getMetricsSnapshot() {
        const vv = (typeof window !== 'undefined' && window.visualViewport) ? window.visualViewport : null;
        const playerContainer = this._playerContainer || document.querySelector('.tm-player-container');
        const shadow = this._shadowRoot || document.querySelector('miss-player-root')?.shadowRoot;

        const containerRect = playerContainer ? playerContainer.getBoundingClientRect() : null;
        const submitBar = shadow?.querySelector('.tm-comment-submit-bar-wrapper') || document.querySelector('.tm-comment-submit-bar-wrapper');
        const submitBarRect = submitBar ? submitBar.getBoundingClientRect() : null;
        const sheetPanel = shadow?.querySelector('.tm-bottom-sheet-panel') || document.querySelector('.tm-bottom-sheet-panel');
        const sheetRect = (sheetPanel && sheetPanel.classList.contains('visible')) ? sheetPanel.getBoundingClientRect() : null;
        const activeModal = shadow?.querySelector('.tm-custom-modal-content, .tm-comment-tag-select-modal') || document.querySelector('.tm-custom-modal-content, .tm-comment-tag-select-modal');
        const modalRect = activeModal ? activeModal.getBoundingClientRect() : null;

        const activeEl = this.getDeepActiveElement();
        const isInput = activeEl && /^(INPUT|TEXTAREA|SELECT)$/i.test(activeEl.tagName);
        const activeRect = isInput ? activeEl.getBoundingClientRect() : null;

        // 计算差值：发评栏底边距离当前可视视口底部的差值 (0 为绝对贴齐，正数=被键盘覆盖，负数=悬空)
        let gapToVisualBottom = null;
        if (submitBarRect && vv) {
            const visualBottom = (vv.offsetTop || 0) + vv.height;
            gapToVisualBottom = Math.round(submitBarRect.bottom - visualBottom);
        }

        // 计算当前 CSS 变量与类名
        const computedKbVar = playerContainer ? window.getComputedStyle(playerContainer).getPropertyValue('--keyboard-height').trim() : '';
        const isIosKbOpen = playerContainer ? playerContainer.classList.contains('tm-ios-keyboard-open') : false;

        return {
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
            window: {
                inner: `${window.innerWidth}x${window.innerHeight}`,
                screen: `${window.screen.width}x${window.screen.height}`,
                docClient: `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
                scrollY: window.scrollY,
                scrollX: window.scrollX
            },
            visualViewport: vv ? {
                w: Math.round(vv.width),
                h: Math.round(vv.height),
                offsetTop: Math.round(vv.offsetTop || 0),
                pageTop: Math.round(vv.pageTop || 0)
            } : null,
            playerContainer: containerRect ? {
                top: Math.round(containerRect.top),
                bottom: Math.round(containerRect.bottom),
                height: Math.round(containerRect.height),
                kbVar: computedKbVar,
                isOpenClass: isIosKbOpen
            } : null,
            submitBar: submitBarRect ? {
                top: Math.round(submitBarRect.top),
                bottom: Math.round(submitBarRect.bottom),
                height: Math.round(submitBarRect.height),
                transform: submitBar.style.transform || 'none',
                isCollapsed: submitBar.classList.contains('is-collapsed'),
                gap: gapToVisualBottom
            } : null,
            activeInput: activeRect ? {
                tag: activeEl.tagName.toLowerCase(),
                cls: (activeEl.className || '').replace(/is-[\w-]+/g, '').trim(),
                rect: `[t:${Math.round(activeRect.top)}, b:${Math.round(activeRect.bottom)}, h:${Math.round(activeRect.height)}]`
            } : null,
            sheetPanel: sheetRect ? {
                top: Math.round(sheetRect.top),
                bottom: Math.round(sheetRect.bottom),
                h: Math.round(sheetRect.height)
            } : null,
            modal: modalRect ? {
                cls: activeModal.className,
                top: Math.round(modalRect.top),
                bottom: Math.round(modalRect.bottom),
                h: Math.round(modalRect.height)
            } : null
        };
    }

    /**
     * 记录一条事件日志
     * @param {string} eventName 
     * @param {string} details 
     */
    static recordEvent(eventName, details = '') {
        const snap = this.getMetricsSnapshot();
        const logItem = {
            time: snap.timestamp,
            event: eventName,
            details,
            snapshot: snap
        };

        this._logs.unshift(logItem);
        if (this._logs.length > this._maxLogs) {
            this._logs.pop();
        }

        // 同步更新复制按钮计数
        if (this._container) {
            const copyBtn = this._container.querySelector('#tm-hud-copy-btn');
            if (copyBtn) {
                copyBtn.textContent = `📋 复制日志 (${this._logs.length})`;
            }

            const previewEl = this._container.querySelector('#tm-hud-logs-list');
            if (previewEl) {
                const recentText = this._logs.slice(0, 3).map(l => `[${l.time}] ${l.event}: ${l.details}`).join('<br>');
                previewEl.innerHTML = recentText || '暂无日志';
            }
        }
    }

    /**
     * 绑定全局事件拦截器
     */
    static _bindEventListeners() {
        const onFocusIn = (e) => {
            const deepActive = this.getDeepActiveElement();
            const tag = deepActive ? deepActive.tagName : (e.target?.tagName || '');
            const cls = deepActive ? deepActive.className : (e.target?.className || '');
            this.recordEvent('FOCUS_IN', `<${tag.toLowerCase()} class="${cls}">`);
        };

        const onFocusOut = (e) => {
            this.recordEvent('FOCUS_OUT', `<${(e.target?.tagName || '').toLowerCase()}>`);
        };

        const onVvResize = () => {
            const vv = window.visualViewport;
            const h = vv ? Math.round(vv.height) : 0;
            const top = vv ? Math.round(vv.offsetTop) : 0;
            this.recordEvent('VV_RESIZE', `vv.h=${h}, offTop=${top}`);
        };

        const onVvScroll = () => {
            const vv = window.visualViewport;
            const top = vv ? Math.round(vv.offsetTop) : 0;
            this.recordEvent('VV_SCROLL', `vv.offsetTop=${top}`);
        };

        const onWinScroll = () => {
            if (window.scrollY !== 0 || window.scrollX !== 0) {
                this.recordEvent('WIN_SCROLL', `scrollY=${window.scrollY}, scrollX=${window.scrollX}`);
            }
        };

        window.addEventListener('focusin', onFocusIn, { capture: true, passive: true });
        window.addEventListener('focusout', onFocusOut, { capture: true, passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', onVvResize);
            window.visualViewport.addEventListener('scroll', onVvScroll);
        }
        window.addEventListener('scroll', onWinScroll, { passive: true });

        this._listeners = [
            () => window.removeEventListener('focusin', onFocusIn, { capture: true }),
            () => window.removeEventListener('focusout', onFocusOut, { capture: true }),
            () => {
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener('resize', onVvResize);
                    window.visualViewport.removeEventListener('scroll', onVvScroll);
                }
            },
            () => window.removeEventListener('scroll', onWinScroll)
        ];
    }

    /**
     * 开启定时轮询渲染实时指标
     */
    static _startPolling() {
        if (this._timerId) clearInterval(this._timerId);
        this._timerId = setInterval(() => {
            this._renderLiveMetrics();
        }, 180);
    }

    /**
     * 渲染实时指标到 DOM
     */
    static _renderLiveMetrics() {
        if (!this._container || this._isCollapsed) return;
        const metricsEl = this._container.querySelector('#tm-hud-live-metrics');
        if (!metricsEl) return;

        const snap = this.getMetricsSnapshot();
        const vv = snap.visualViewport;
        const c = snap.playerContainer;
        const sb = snap.submitBar;
        const act = snap.activeInput;

        let gapHtml = '<span class="tm-hud-val">无发评栏</span>';
        if (sb && sb.gap !== null) {
            if (Math.abs(sb.gap) <= 4) {
                gapHtml = `<span class="tm-hud-gap-perfect">${sb.gap}px (完美对齐)</span>`;
            } else if (sb.gap > 4) {
                gapHtml = `<span class="tm-hud-gap-warn">+${sb.gap}px (掉入键盘下方)</span>`;
            } else {
                gapHtml = `<span class="tm-hud-highlight">${sb.gap}px (悬空过多)</span>`;
            }
        }

        const activeStr = act ? `${act.tag}.${(act.cls || '').split(' ')[0]} ${act.rect}` : '<span class="tm-hud-val">无激活输入框</span>';

        metricsEl.innerHTML = `
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[VV]</span>
                <span class="tm-hud-val">h:${vv?.h || 0} top:${vv?.offsetTop || 0}</span>
                <span class="tm-hud-lbl">[WIN]</span>
                <span class="tm-hud-val">innerH:${window.innerHeight} scrY:${window.scrollY}</span>
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[容器]</span>
                <span class="tm-hud-val">H:${c?.height || 0} --kb:${c?.kbVar || '0px'} 类:${c?.isOpenClass ? 'open' : 'off'}</span>
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[发评对齐GAP]</span> ${gapHtml}
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[当前激活]</span> <span class="tm-hud-val">${activeStr}</span>
            </div>
        `;
    }

    /**
     * 切换折叠状态
     */
    static toggleCollapse() {
        if (!this._container) return;
        this._isCollapsed = !this._isCollapsed;
        this._container.classList.toggle('tm-hud-collapsed', this._isCollapsed);
        const toggleBtn = this._container.querySelector('#tm-hud-toggle-btn');
        if (toggleBtn) {
            toggleBtn.textContent = this._isCollapsed ? '展开' : '折叠';
        }
    }

    /**
     * 清空日志
     */
    static clearLogs() {
        this._logs = [];
        this.recordEvent('LOG_CLEARED', '已清空历史日志');
        Toast('探针日志已清空', 1200, 'info');
    }

    /**
     * 一键将全量结构化物理日志复制到剪贴板
     */
    static copyLogs() {
        const cur = this.getMetricsSnapshot();
        const vv = cur.visualViewport;
        const w = cur.window;
        const c = cur.playerContainer;
        const sb = cur.submitBar;
        const act = cur.activeInput;

        let md = `=== Miss Player iOS Viewport Debug Report ===\n`;
        md += `Report Time: ${cur.timestamp}\n`;
        md += `UserAgent: ${navigator.userAgent}\n\n`;

        md += `### 1. 当前物理视口快照 (Current Snapshot)\n`;
        md += `- VisualViewport: width=${vv?.w}, height=${vv?.h}, offsetTop=${vv?.offsetTop}, pageTop=${vv?.pageTop}\n`;
        md += `- Window/Screen: inner=${w.inner}, screen=${w.screen}, docClient=${w.docClient}, scrollY=${w.scrollY}\n`;
        md += `- Container: height=${c?.height}, --keyboard-height=${c?.kbVar}, isOpenClass=${c?.isOpenClass}\n`;
        md += `- Active Input: ${act ? `${act.tag}.${act.cls} ${act.rect}` : 'None'}\n`;
        md += `- Submit Bar: [top:${sb?.top}, bottom:${sb?.bottom}, h:${sb?.height}], gapToKeyboard: ${sb?.gap}px, collapsed=${sb?.isCollapsed}\n`;
        if (cur.sheetPanel) {
            md += `- Sheet Panel: [top:${cur.sheetPanel.top}, bottom:${cur.sheetPanel.bottom}, h:${cur.sheetPanel.h}]\n`;
        }
        if (cur.modal) {
            md += `- Modal Dialog: class=${cur.modal.cls}, [top:${cur.modal.top}, bottom:${cur.modal.bottom}, h:${cur.modal.h}]\n`;
        }

        md += `\n### 2. 事件序列日志 (Event Sequence - Recent ${this._logs.length})\n`;
        this._logs.forEach((item, index) => {
            const s = item.snapshot;
            const v = s.visualViewport;
            const a = s.activeInput;
            const b = s.submitBar;
            md += `${index + 1}. [${item.time}] ${item.event} -> ${item.details}\n`;
            md += `   VV:[h:${v?.h}, top:${v?.offsetTop}] | Win:[innerH:${s.window.inner}, scrollY:${s.window.scrollY}] | Input:${a ? `${a.tag}.${(a.cls||'').split(' ')[0]} ${a.rect}` : 'None'} | SubmitBarGap:${b?.gap}px\n`;
        });

        md += `\n=== End of Report ===\n`;

        copyToClipboard(md);
        Toast('📋 视口探针日志已复制！请直接在对话中粘贴反馈', 2800, 'success');
        console.log('[ViewportDebugHUD] Log copied:\n', md);
    }

    /**
     * 销毁探针与监听器
     */
    static destroy() {
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = null;
        }

        if (Array.isArray(this._listeners)) {
            this._listeners.forEach(fn => {
                try { fn(); } catch (_) {}
            });
            this._listeners = [];
        }

        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
            this._container = null;
        }
    }
}
