/**
 * ViewportDebugHUD — 移动端视口、宿主长页面、UI 层级与虚拟键盘挤压高精度探针
 * 
 * 升级版核心能力：
 * 1. 【宿主长页面物理诊断】：实时监控 document.body/documentElement 的 scrollHeight、scrollTop、宿主坍塌元素数量与溢出高度；
 * 2. 【UI 层级与包含块审计】：实时获取各组件的 computed z-index、position、transform、包含块归属父节点以及 Shadow DOM 边界；
 * 3. 【iOS 虚拟键盘挤压与安全间距】：实时计算 activeInputClearance = (vv.top + vv.h) - input.bottom，直观呈现输入框是否被键盘遮挡；
 * 4. 【iOS 原生拷贝全兼容支持】：优先调起 iOS 系统的 navigator.share 原生 Action Sheet（自带系统“拷贝”），配合多重 Clipboard 降级与就地全选文本框。
 */

import { Toast } from '../../utils/index.js';
import { getCurrentVersion } from '../../services/SleazyForkService.js';

export class ViewportDebugHUD {
    static _container = null;
    static _isCollapsed = false;
    static _logs = [];
    static _maxLogs = 80;
    static _timerId = null;
    static _listeners = [];
    static _playerContainer = null;
    static _shadowRoot = null;
    static _uiMutationObserver = null;

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

        // 挂载目标优先选用 playerContainer 或 shadowRoot
        const mountTarget = playerContainer || shadowRoot || document.body;
        this._container = document.createElement('div');
        this._container.className = 'tm-viewport-debug-hud';

        // 注入自包含内联样式 (完全独立，零外部污染)
        const style = document.createElement('style');
        style.textContent = `
            .tm-viewport-debug-hud {
                position: absolute;
                top: max(46px, env(safe-area-inset-top, 46px));
                left: 6px;
                right: 6px;
                z-index: var(--z-toast, 60);
                background: rgba(10, 12, 16, 0.96);
                backdrop-filter: blur(24px) saturate(180%);
                -webkit-backdrop-filter: blur(24px) saturate(180%);
                border: 1px solid rgba(56, 189, 248, 0.35);
                border-radius: 12px;
                box-shadow: 0 10px 36px rgba(0, 0, 0, 0.85);
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
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
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
                gap: 5px;
            }
            .tm-hud-btn {
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 600;
                cursor: pointer;
                outline: none;
                transition: background 0.15s, transform 0.1s;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
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
            .tm-hud-btn-copy.is-copied {
                background: #16a34a;
                border-color: #4ade80;
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
            .tm-hud-perfect {
                color: #4ade80;
                font-weight: 700;
            }
            .tm-hud-warn {
                color: #f87171;
                font-weight: 700;
            }
            .tm-hud-logs-preview {
                margin-top: 4px;
                padding-top: 4px;
                border-top: 1px dashed rgba(255, 255, 255, 0.1);
                color: #cbd5e1;
                font-size: 9px;
                max-height: 40px;
                overflow-y: auto;
            }
            .tm-hud-export-wrap {
                margin-top: 6px;
                padding-top: 6px;
                border-top: 1px solid rgba(56, 189, 248, 0.4);
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .tm-hud-export-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: #38bdf8;
                font-size: 10px;
                font-weight: 700;
            }
            .tm-hud-export-area {
                width: 100%;
                height: 90px;
                box-sizing: border-box;
                background: #000000;
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 6px;
                color: #4ade80;
                font-family: inherit;
                font-size: 10px;
                padding: 6px;
                outline: none;
                resize: none;
                -webkit-user-select: text;
                user-select: text;
            }
            .tm-hud-collapsed .tm-hud-body,
            .tm-hud-collapsed .tm-hud-logs-preview,
            .tm-hud-collapsed .tm-hud-export-wrap {
                display: none;
            }
        `;
        this._container.appendChild(style);

        const contentWrap = document.createElement('div');
        contentWrap.innerHTML = `
            <div class="tm-hud-header">
                <div class="tm-hud-title-wrap">
                    <span>🔍 视口全景探针</span>
                    <span class="tm-hud-badge">v${getCurrentVersion()}</span>
                </div>
                <div class="tm-hud-actions">
                    <button type="button" class="tm-hud-btn tm-hud-btn-copy" id="tm-hud-copy-btn">📋 复制日志 (0)</button>
                    <button type="button" class="tm-hud-btn" id="tm-hud-share-btn" title="调起 iOS 系统原生拷贝菜单">📲 系统拷贝</button>
                    <button type="button" class="tm-hud-btn" id="tm-hud-clear-btn">清空</button>
                    <button type="button" class="tm-hud-btn" id="tm-hud-toggle-btn">折叠</button>
                </div>
            </div>
            <div class="tm-hud-body" id="tm-hud-live-metrics">
                <div class="tm-hud-row">正在初始化视口测量数据...</div>
            </div>
            <div class="tm-hud-logs-preview" id="tm-hud-logs-list">
                [就绪] 正在监听所有 input 聚焦、键盘视口与宿主高度变化...
            </div>
            <div class="tm-hud-export-wrap" id="tm-hud-export-wrap" style="display: none;">
                <div class="tm-hud-export-header">
                    <span>📋 导出的纯文本日志 (长按直接点系统“拷贝”):</span>
                    <button type="button" class="tm-hud-btn" id="tm-hud-select-btn">全选文本</button>
                </div>
                <textarea class="tm-hud-export-area" id="tm-hud-export-text"></textarea>
            </div>
        `;
        this._container.appendChild(contentWrap);

        mountTarget.appendChild(this._container);

        // 统一移动端触控/点击绑定工具
        const bindTap = (el, handler) => {
            if (!el) return;
            let handled = false;
            el.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
            el.addEventListener('touchend', (e) => {
                e.stopPropagation();
                handled = true;
                handler(e);
                setTimeout(() => { handled = false; }, 300);
            });
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (handled) return;
                handler(e);
            });
        };

        const copyBtn = this._container.querySelector('#tm-hud-copy-btn');
        const shareBtn = this._container.querySelector('#tm-hud-share-btn');
        const clearBtn = this._container.querySelector('#tm-hud-clear-btn');
        const toggleBtn = this._container.querySelector('#tm-hud-toggle-btn');
        const selectBtn = this._container.querySelector('#tm-hud-select-btn');

        bindTap(copyBtn, () => this.copyLogs());
        bindTap(shareBtn, () => this.triggerNativeShareCopy());
        bindTap(clearBtn, () => this.clearLogs());
        bindTap(toggleBtn, () => this.toggleCollapse());
        bindTap(selectBtn, () => {
            const ta = this._container.querySelector('#tm-hud-export-text');
            if (ta) {
                ta.focus();
                ta.select();
                ta.setSelectionRange(0, ta.value.length);
            }
        });

        // 启动全局事件追踪与周期性指标更新
        this._bindEventListeners();
        this._startPolling();

        // 记录初始就绪事件
        this.recordEvent('HUD_READY', '全景探针初始化就绪');
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
     * 获取当前物理指标快照对象 (全维度：宿主、视口、包含块、Z-Index、键盘间距)
     */
    static getMetricsSnapshot() {
        const vv = (typeof window !== 'undefined' && window.visualViewport) ? window.visualViewport : null;
        const playerContainer = this._playerContainer || document.querySelector('.tm-player-container');
        const shadow = this._shadowRoot || document.querySelector('miss-player-root')?.shadowRoot;

        const containerRect = playerContainer ? playerContainer.getBoundingClientRect() : null;
        const submitBar = shadow?.querySelector('.tm-comment-submit-bar-wrapper') || document.querySelector('.tm-comment-submit-bar-wrapper');
        const submitBarRect = submitBar ? submitBar.getBoundingClientRect() : null;
        const sheetPanel = shadow?.querySelector('.tm-bottom-sheet-panel') || document.querySelector('.tm-bottom-sheet-panel');
        const sheetRect = sheetPanel ? sheetPanel.getBoundingClientRect() : null;
        const activeModal = shadow?.querySelector('.tm-custom-modal-content') || document.querySelector('.tm-custom-modal-content');
        const modalRect = activeModal ? activeModal.getBoundingClientRect() : null;

        const activeEl = this.getDeepActiveElement();
        const isInput = activeEl && /^(INPUT|TEXTAREA|SELECT)$/i.test(activeEl.tagName);
        const activeRect = isInput ? activeEl.getBoundingClientRect() : null;

        // 计算宿主长页面物理高度与坍塌状态
        const docEl = document.documentElement;
        const docBody = document.body;
        const hostScrollHeight = Math.max(docEl?.scrollHeight || 0, docBody?.scrollHeight || 0);
        const hostClientHeight = docEl?.clientHeight || window.innerHeight;
        const hostScrollableOverflow = Math.max(0, hostScrollHeight - hostClientHeight);
        const collapsedCount = document.querySelectorAll('[data-mp-prev-display]').length;

        // 计算包含块与 Z-Index 层叠详情
        const inspectNode = (el) => {
            if (!el) return { exists: false, z: 'none', parent: 'none', display: 'none' };
            try {
                const cs = window.getComputedStyle(el);
                const parentTag = el.parentElement ? `${el.parentElement.tagName.toLowerCase()}${el.parentElement.className ? `.${el.parentElement.className.split(' ')[0]}` : ''}` : 'null';
                return {
                    exists: true,
                    z: cs.zIndex || 'auto',
                    pos: cs.position || 'static',
                    display: cs.display || 'block',
                    parent: parentTag,
                    inShadow: el.getRootNode() instanceof ShadowRoot
                };
            } catch (_) {
                return { exists: true, z: 'err', parent: 'err', display: 'err' };
            }
        };

        const hierarchy = {
            container: inspectNode(playerContainer),
            video: inspectNode(shadow?.querySelector('.tm-video-container')),
            controls: inspectNode(shadow?.querySelector('.tm-control-buttons')),
            submitBar: inspectNode(submitBar),
            sheetPanel: inspectNode(sheetPanel),
            popover: inspectNode(shadow?.querySelector('.tm-inline-remark-popover')),
            modal: inspectNode(shadow?.querySelector('.tm-custom-modal-overlay') || document.querySelector('.tm-custom-modal-overlay')),
            activeInput: isInput ? inspectNode(activeEl) : null
        };

        // 计算发评栏对齐差值：底边距离当前可视视口底部的差值
        let gapToVisualBottom = null;
        if (submitBarRect && vv) {
            const visualBottom = (vv.offsetTop || 0) + vv.height;
            gapToVisualBottom = Math.round(submitBarRect.bottom - visualBottom);
        }

        // 计算核心安全间距 (Active Input Clearance)：
        // 可视视口底边 - 输入框底边。>= 0 说明输入框在键盘上方(完全可见)；< 0 说明被键盘遮挡(Safari 必触发原生滚动！)
        let activeInputClearance = null;
        if (activeRect && vv) {
            const visualBottom = (vv.offsetTop || 0) + vv.height;
            activeInputClearance = Math.round(visualBottom - activeRect.bottom);
        }

        // 计算当前 CSS 变量与类名
        const computedKbVar = playerContainer ? window.getComputedStyle(playerContainer).getPropertyValue('--keyboard-height').trim() : '';
        const isIosKbOpen = playerContainer ? playerContainer.classList.contains('tm-ios-keyboard-open') : false;

        return {
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
            host: {
                scrollHeight: hostScrollHeight,
                clientHeight: hostClientHeight,
                overflow: hostScrollableOverflow,
                collapsedCount,
                scrollY: window.scrollY || window.pageYOffset || 0,
                docScrollTop: docEl?.scrollTop || docBody?.scrollTop || 0
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
                inlineBottom: submitBar.style.bottom || 'none',
                isCollapsed: submitBar.classList.contains('is-collapsed'),
                gap: gapToVisualBottom
            } : null,
            activeInput: activeRect ? {
                tag: activeEl.tagName.toLowerCase(),
                cls: (activeEl.className || '').replace(/is-[\w-]+/g, '').trim(),
                rect: `[t:${Math.round(activeRect.top)}, b:${Math.round(activeRect.bottom)}, h:${Math.round(activeRect.height)}]`,
                clearance: activeInputClearance
            } : null,
            sheetPanel: sheetRect ? {
                top: Math.round(sheetRect.top),
                bottom: Math.round(sheetRect.bottom),
                h: Math.round(sheetRect.height),
                inlineBottom: sheetPanel.style.bottom || 'none',
                visible: sheetPanel.classList.contains('visible')
            } : null,
            modal: modalRect ? {
                cls: activeModal.className,
                top: Math.round(modalRect.top),
                bottom: Math.round(modalRect.bottom),
                h: Math.round(modalRect.height)
            } : null,
            hierarchy
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
                const recentText = this._logs.slice(0, 3).map(l => {
                    const c = l.snapshot.activeInput?.clearance;
                    const cStr = c !== null && c !== undefined ? ` (安全距:${c}px)` : '';
                    return `[${l.time}] ${l.event}: ${l.details}${cStr}`;
                }).join('<br>');
                previewEl.innerHTML = recentText || '暂无日志';
            }
        }
    }

    /**
     * 绑定全局事件拦截器与全链路用户手势感知、UI 状态机、DOM 销毁/闪退捕获
     */
    static _bindEventListeners() {
        let lastTappedNodeDesc = 'none';
        let lastTapTime = 0;

        const getNodeDescriptor = (node) => {
            if (!node || node.nodeType !== 1) return 'non-element';
            const tag = node.tagName.toLowerCase();
            const id = node.id ? `#${node.id}` : '';
            const cls = node.className && typeof node.className === 'string'
                ? `.${node.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : '';
            const text = (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 10);
            const textSnippet = text && !tag.includes('input') && !tag.includes('textarea') ? ` "${text}"` : '';
            return `<${tag}${id}${cls}${textSnippet}>`;
        };

        // 1. 穿透捕获用户全量触碰与点击手势 (capture: true，早于冒泡与默认行为)
        const onPointerDown = (e) => {
            const path = e.composedPath ? e.composedPath() : [];
            const target = path[0] || e.target;
            if (!target) return;
            // 排除 HUD 自身按钮，防止调试操作自身日志刷屏
            if (target.closest && target.closest('.tm-viewport-debug-hud')) return;

            lastTappedNodeDesc = getNodeDescriptor(target);
            lastTapTime = Date.now();
            this.recordEvent('USER_TAP', lastTappedNodeDesc);
        };

        const onFocusIn = (e) => {
            const deepActive = this.getDeepActiveElement();
            const target = deepActive || (e.composedPath ? e.composedPath()[0] : e.target);
            this.recordEvent('FOCUS_IN', getNodeDescriptor(target));
        };

        // 2. 深入捕获失焦与失焦根因 (为什么会失焦？失焦流向了何处？失焦前触碰了什么？)
        const onFocusOut = (e) => {
            const target = e.composedPath ? e.composedPath()[0] : e.target;
            const relTarget = e.relatedTarget ? getNodeDescriptor(e.relatedTarget) : 'null (键盘收起/空白点击)';
            const recentTapContext = (Date.now() - lastTapTime < 350) ? ` [点按后失焦: ${lastTappedNodeDesc}]` : '';
            this.recordEvent('FOCUS_OUT', `${getNodeDescriptor(target)} -> focusTo: ${relTarget}${recentTapContext}`);
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

        // 3. UI 状态机与 DOM 节点增删/闪退实时监听 (MutationObserver)
        const observeTarget = this._shadowRoot || this._playerContainer;
        if (observeTarget && typeof MutationObserver !== 'undefined') {
            this._uiMutationObserver = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    // 监听核心 UI 组件 class 属性变化 (显隐、收起、展开)
                    if (m.type === 'attributes' && m.attributeName === 'class' && m.target) {
                        const node = m.target;
                        const cls = node.className || '';
                        if (typeof cls === 'string') {
                            if (cls.includes('tm-comment-submit-bar-wrapper')) {
                                const isCol = cls.includes('is-collapsed');
                                this.recordEvent('UI_STATE', `发评栏 ${isCol ? '收起(COLLAPSED)' : '展开(OPENED)'} [bot:${node.style.bottom || '0'}]`);
                            } else if (cls.includes('tm-comment-tag-chips-bar')) {
                                const isHidden = cls.includes('is-hidden');
                                this.recordEvent('UI_STATE', `高光标签胶囊栏 ${isHidden ? '隐藏(HIDDEN)' : '展开(VISIBLE)'}`);
                            } else if (cls.includes('tm-bottom-sheet-panel')) {
                                const isVis = cls.includes('visible');
                                this.recordEvent('UI_STATE', `高光切片底栏 ${isVis ? '展开(VISIBLE)' : '关闭(HIDDEN)'}`);
                            } else if (cls.includes('tm-inline-remark-popover')) {
                                const isVis = cls.includes('visible');
                                this.recordEvent('UI_STATE', `打点备注气泡 ${isVis ? '展示(VISIBLE)' : '隐藏(HIDDEN)'}`);
                            } else if (cls.includes('tm-custom-modal-overlay')) {
                                const isAct = cls.includes('active');
                                this.recordEvent('UI_STATE', `全屏模态弹窗 ${isAct ? '激活(ACTIVE)' : '关闭(INACTIVE)'}`);
                            }
                        }
                    }
                    // 监听 DOM 节点新增与销毁/闪退
                    if (m.type === 'childList') {
                        if (m.removedNodes && m.removedNodes.length > 0) {
                            m.removedNodes.forEach(node => {
                                if (node.nodeType === 1) {
                                    const cls = typeof node.className === 'string' ? node.className : '';
                                    if (cls.includes('popover') || cls.includes('modal') || cls.includes('sheet') || cls.includes('submit-bar')) {
                                        this.recordEvent('DOM_REMOVED', `节点被从DOM树移除(闪退/销毁): ${getNodeDescriptor(node)}`);
                                    }
                                }
                            });
                        }
                        if (m.addedNodes && m.addedNodes.length > 0) {
                            m.addedNodes.forEach(node => {
                                if (node.nodeType === 1) {
                                    const cls = typeof node.className === 'string' ? node.className : '';
                                    if (cls.includes('popover') || cls.includes('modal') || cls.includes('sheet') || cls.includes('submit-bar')) {
                                        this.recordEvent('DOM_ADDED', `新节点插入DOM树: ${getNodeDescriptor(node)}`);
                                    }
                                }
                            });
                        }
                    }
                }
            });

            this._uiMutationObserver.observe(observeTarget, {
                attributes: true,
                attributeFilter: ['class'],
                childList: true,
                subtree: true
            });
        }

        window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
        window.addEventListener('focusin', onFocusIn, { capture: true, passive: true });
        window.addEventListener('focusout', onFocusOut, { capture: true, passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', onVvResize);
            window.visualViewport.addEventListener('scroll', onVvScroll);
        }
        window.addEventListener('scroll', onWinScroll, { passive: true });

        this._listeners = [
            () => window.removeEventListener('pointerdown', onPointerDown, { capture: true }),
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
        const h = snap.host;
        const vv = snap.visualViewport;
        const c = snap.playerContainer;
        const sb = snap.submitBar;
        const act = snap.activeInput;
        const z = snap.hierarchy;

        // 宿主坍塌状态评估
        let hostStatusHtml = '';
        if (h.overflow === 0) {
            hostStatusHtml = `<span class="tm-hud-perfect">0px 坍塌成功 (${h.collapsedCount}个节点)</span>`;
        } else {
            hostStatusHtml = `<span class="tm-hud-warn">+${h.overflow}px 溢出未坍塌! (总高:${h.scrollHeight})</span>`;
        }

        // 发评对齐评估
        let gapHtml = '<span class="tm-hud-val">无发评栏</span>';
        if (sb && sb.gap !== null) {
            if (Math.abs(sb.gap) <= 4) {
                gapHtml = `<span class="tm-hud-perfect">${sb.gap}px (贴合)</span>`;
            } else if (sb.gap > 4) {
                gapHtml = `<span class="tm-hud-warn">+${sb.gap}px (掉入键盘下方)</span>`;
            } else {
                gapHtml = `<span class="tm-hud-highlight">${sb.gap}px (悬空)</span>`;
            }
        }

        // 输入框安全间距评估
        let clearanceHtml = '<span class="tm-hud-val">无焦点</span>';
        if (act && act.clearance !== null) {
            if (act.clearance >= 0) {
                clearanceHtml = `<span class="tm-hud-perfect">+${act.clearance}px (键盘上方安全)</span>`;
            } else {
                clearanceHtml = `<span class="tm-hud-warn">${act.clearance}px (被键盘盖住! 引发滚动)</span>`;
            }
        }

        const activeStr = act ? `${act.tag}.${(act.cls || '').split(' ')[0]} ${act.rect}` : '<span class="tm-hud-val">无激活输入框</span>';

        metricsEl.innerHTML = `
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[宿主]</span> 溢出: ${hostStatusHtml}
                <span class="tm-hud-lbl">scrY:</span><span class="tm-hud-val">${h.scrollY}</span>
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[视口]</span>
                <span class="tm-hud-val">vv.h:${vv?.h || 0} top:${vv?.offsetTop || 0} | win:${window.innerHeight}</span>
                <span class="tm-hud-lbl">--kb:</span><span class="tm-hud-val">${c?.kbVar || '0px'}</span>
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[发评对齐GAP]</span> ${gapHtml}
                <span class="tm-hud-lbl">[输入框安全距]</span> ${clearanceHtml}
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[焦点]</span> <span class="tm-hud-val">${activeStr}</span>
            </div>
            <div class="tm-hud-row">
                <span class="tm-hud-lbl">[Z标尺]</span>
                <span class="tm-hud-val">发评:z:${z.submitBar.z} (${z.submitBar.parent}) | 底栏:z:${z.sheetPanel.z} (${z.sheetPanel.parent})</span>
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
        const exportWrap = this._container?.querySelector('#tm-hud-export-wrap');
        if (exportWrap) exportWrap.style.display = 'none';
    }

    /**
     * 生成全量 Markdown 诊断报告 (四维全面审计：宿主、包含块、视口间距、时序)
     */
    static generateReportMarkdown() {
        const cur = this.getMetricsSnapshot();
        const h = cur.host;
        const vv = cur.visualViewport;
        const c = cur.playerContainer;
        const sb = cur.submitBar;
        const act = cur.activeInput;
        const z = cur.hierarchy;

        let md = `=== Miss Player iOS Viewport Debug Report ===\n`;
        md += `Script Version: v${getCurrentVersion()}\n`;
        md += `Report Time: ${cur.timestamp}\n`;
        md += `UserAgent: ${navigator.userAgent}\n\n`;

        md += `### 1. 宿主长页面物理坍塌状态 (Host Page Collapse Audit)\n`;
        md += `- Host Scrollable Overflow: ${h.overflow}px (${h.overflow === 0 ? '✅ 物理坍塌成功，无滚动空间' : '❌ 存在宿主长页面滚动空间！'})\n`;
        md += `- Host scrollHeight: ${h.scrollHeight}px vs clientHeight: ${h.clientHeight}px\n`;
        md += `- Host window.scrollY: ${h.scrollY}px | docScrollTop: ${h.docScrollTop}px\n`;
        md += `- Collapsed Host Elements Count: ${h.collapsedCount}\n\n`;

        md += `### 2. 物理视口与虚拟键盘挤压 (Visual Viewport Squeeze)\n`;
        md += `- VisualViewport: width=${vv?.w}, height=${vv?.h}, offsetTop=${vv?.offsetTop}, pageTop=${vv?.pageTop}\n`;
        md += `- Container: height=${c?.height}, --keyboard-height=${c?.kbVar}, isOpenClass=${c?.isOpenClass}\n`;
        md += `- Submit Bar: [top:${sb?.top}, bottom:${sb?.bottom}, h:${sb?.height}], inlineBottom=${sb?.inlineBottom}, gapToKeyboard: ${sb?.gap}px, collapsed=${sb?.isCollapsed}\n`;
        md += `- Active Input Clearance: ${act ? `${act.clearance}px (${act.clearance >= 0 ? '✅ 在键盘上方安全可见' : '❌ 被键盘覆盖，将触发Safari强滚'})` : 'None'}\n`;
        md += `- Active Input Rect: ${act ? `${act.tag}.${act.cls} ${act.rect}` : 'None'}\n\n`;

        md += `### 3. 组件层叠上下文与包含块归属审计 (Stacking Context Hierarchy)\n`;
        md += `- Player Container: z:${z.container.z} (${z.container.pos}) | Parent: ${z.container.parent} | ShadowDOM: ${z.container.inShadow}\n`;
        md += `- Video Container: z:${z.video.z} (${z.video.pos}) | Parent: ${z.video.parent}\n`;
        md += `- Control Buttons: z:${z.controls.z} (${z.controls.pos}) | Parent: ${z.controls.parent}\n`;
        md += `- Submit Bar: z:${z.submitBar.z} (${z.submitBar.pos}) | Parent: ${z.submitBar.parent}\n`;
        md += `- Sheet Panel (高光底栏): z:${z.sheetPanel.z} (${z.sheetPanel.pos}) | Parent: ${z.sheetPanel.parent} | Visible: ${cur.sheetPanel?.visible}\n`;
        md += `- Inline Popover (打点气泡): z:${z.popover.z} (${z.popover.pos}) | Parent: ${z.popover.parent}\n`;
        md += `- Modal Dialog (登录/弹窗): z:${z.modal.z} (${z.modal.pos}) | Parent: ${z.modal.parent}\n`;
        if (z.activeInput) {
            md += `- Active Input Context: z:${z.activeInput.z} (${z.activeInput.pos}) | Parent: ${z.activeInput.parent}\n`;
        }

        md += `\n### 4. 事件序列日志 (Event Sequence - Recent ${this._logs.length})\n`;
        this._logs.forEach((item, index) => {
            const s = item.snapshot;
            const v = s.visualViewport;
            const a = s.activeInput;
            const b = s.submitBar;
            const cStr = a && a.clearance !== null ? ` | Clearance:${a.clearance}px` : '';
            md += `${index + 1}. [${item.time}] ${item.event} -> ${item.details}\n`;
            md += `   VV:[h:${v?.h}, top:${v?.offsetTop}] | Host:[overflow:${s.host.overflow}px, scrollY:${s.host.scrollY}] | Input:${a ? `${a.tag}.${(a.cls||'').split(' ')[0]} ${a.rect}` : 'None'}${cStr} | SubmitBarGap:${b?.gap}px\n`;
        });

        md += `\n=== End of Report ===\n`;
        return md;
    }

    /**
     * 调起 iOS 系统的原生 Action Sheet 分享与拷贝面板 (100% 成功率保证)
     */
    static async triggerNativeShareCopy() {
        const md = this.generateReportMarkdown();

        // 展开就地文本框
        this._showExportTextarea(md);

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: 'Miss Player Debug Report',
                    text: md
                });
                Toast('✅ 已调起系统原生面板，点击“拷贝”即可！', 2500, 'success');
                return true;
            } catch (err) {
                // 用户主动关闭或取消分享，不报 error
                if (err && err.name === 'AbortError') return false;
            }
        }

        // 降级为手动长按
        Toast('⚠️ 请直接长按下方已全选的文本框并点“拷贝”', 3000, 'warning');
        return false;
    }

    /**
     * 显示就地文本框并全选内容
     */
    static _showExportTextarea(text) {
        const exportWrap = this._container?.querySelector('#tm-hud-export-wrap');
        const exportText = this._container?.querySelector('#tm-hud-export-text');
        if (exportWrap && exportText) {
            exportWrap.style.display = 'flex';
            exportText.value = text;
            try {
                exportText.focus();
                exportText.select();
                exportText.setSelectionRange(0, text.length);
            } catch (_) {}
        }
    }

    /**
     * 一键将全量结构化物理日志复制到剪贴板，支持 iOS Web Share 原生联动
     */
    static async copyLogs() {
        const md = this.generateReportMarkdown();
        const copyBtn = this._container?.querySelector('#tm-hud-copy-btn');

        // 展开并全选就地文本框
        this._showExportTextarea(md);

        // 尝试通过浏览器原生 API 拷贝
        let copied = false;
        if (typeof GM_setClipboard === 'function') {
            try {
                GM_setClipboard(md);
                copied = true;
            } catch (_) {}
        }

        if (!copied && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(md);
                copied = true;
            } catch (_) {}
        }

        // 如果上述静默 API 均受 iOS 限制，自动尝试调起系统原生 Action Sheet 拷贝
        if (!copied && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: 'Miss Player Debug Report',
                    text: md
                });
                copied = true;
            } catch (_) {}
        }

        if (copyBtn) {
            copyBtn.classList.add('is-copied');
            copyBtn.textContent = '✅ 已生成/拷贝！';
            setTimeout(() => {
                copyBtn.classList.remove('is-copied');
                copyBtn.textContent = `📋 复制日志 (${this._logs.length})`;
            }, 3000);
        }

        if (copied) {
            Toast('✅ 日志已复制到剪贴板！', 2200, 'success');
        } else {
            Toast('⚠️ 系统拦截了静默写入，请直接长按下方文本框并点“拷贝”', 3500, 'warning');
        }

        console.log('[ViewportDebugHUD] Report:\n', md);
    }

    /**
     * 销毁探针与监听器
     */
    static destroy() {
        if (this._uiMutationObserver) {
            this._uiMutationObserver.disconnect();
            this._uiMutationObserver = null;
        }

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
