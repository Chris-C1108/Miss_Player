/**
 * Jasna-LTX Library (https://ltxlib.dpdns.org/) 卡片跨站播放适配器
 *
 * 设计约束（基于对 ltxlib 实机 DOM/CSS/CSP 与 iOS Safari Stay 源码实测）：
 * 1. 页面 CSP 锁死 default-src 'none' / script-src 'sha256-...' / media-src / worker-src / frame-ancestors，
 *    绝对禁止向宿主页面注入 <video>、hls.js 或 <iframe>，所有播放均经 CrossSitePlayRouter 跨 Origin 承接。
 * 2. 严禁在本模块及跨站伴侣构建链中引用页级沙箱句柄或非白名单全局属性，确保 Stay App 归类为 content 沙箱执行。
 * 3. Vue 3 列表筛选/排序/翻页会原地复用 article.card 节点并仅变更 data-code 属性，
 *    因此点击与悬浮预探测严禁闭包固化初始 code，必须实时从 btn.closest('article.card') 读取。
 * 4. PC 端鼠标悬浮提示最终跳转站点，并提前预热 30min 缓存实现点击 0ms 跳转；触控端长按弹出选源/入库菜单。
 */

import { CrossSitePlayRouter, CROSS_SITE_SOURCES } from '../services/CrossSitePlayRouter.js';
import { matchAvCodeFromText } from '../utils/videoCode.js';
import { PLAY, ICON_PEACH, ICON_X_CLOSE } from '../constants/icons.js';

const LONG_PRESS_MS = 450;
const HOVER_INTENT_MS = 120;

const LTX_FALLBACK_CSS = `
.mp-ltx-play-btn{position:absolute;left:8px;bottom:8px;z-index:3;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(15,16,19,.76);backdrop-filter:blur(12px) saturate(180%);-webkit-backdrop-filter:blur(12px) saturate(180%);color:#fe628e;display:grid;place-items:center;padding:0;cursor:pointer;transition:transform .15s ease,background-color .15s ease,border-color .15s ease}
.mp-ltx-play-btn::after{content:"";position:absolute;inset:-6px}
.mp-ltx-play-btn:hover{transform:scale(1.08);background:rgba(254,98,142,.22);border-color:rgba(254,98,142,.72);color:#fff}
.mp-ltx-play-btn:active{transform:scale(.94)}
.mp-ltx-play-btn.is-loading{cursor:progress;pointer-events:none;border-color:#fe628e;animation:mp-ltx-pulse .9s ease-in-out infinite}
.mp-ltx-play-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;transform:translateX(1px)}
.mp-ltx-play-icon svg{width:14px;height:14px}
.card.selectable .mp-ltx-play-btn{opacity:.2;pointer-events:none}
@media (max-width:760px){.mp-ltx-play-btn{width:34px;height:34px}}
@keyframes mp-ltx-pulse{0%,100%{box-shadow:0 0 0 0 rgba(254,98,142,.5)}50%{box-shadow:0 0 0 6px rgba(254,98,142,0)}}
.mp-ltx-modal-play-btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(254,98,142,.45);background:rgba(254,98,142,.16);color:#fff;font-size:12px;font-weight:600;cursor:pointer;margin-left:auto}
.mp-ltx-popover{position:fixed;z-index:2147483647;width:224px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(23,24,29,.92);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);box-shadow:0 14px 36px rgba(0,0,0,.55);color:#e8e8ec;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;display:flex;flex-direction:column;gap:8px}
.mp-ltx-popover-head{display:flex;align-items:center;gap:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.08)}
.mp-ltx-popover-code{font-size:12px;font-weight:700;color:#fe628e;letter-spacing:.03em}
.mp-ltx-popover-mode{font-size:11px;color:#8c8f9a;margin-left:auto}
.mp-ltx-popover-close{border:0;background:transparent;color:#8c8f9a;cursor:pointer;padding:2px;display:grid;place-items:center}
.mp-ltx-popover-item{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#e8e8ec;font-size:12px;font-weight:600;cursor:pointer;text-align:left}
.mp-ltx-popover-item.is-primary{background:rgba(254,98,142,.18);border-color:rgba(254,98,142,.45);color:#fff}
.mp-ltx-popover-ico{width:15px;height:15px;display:inline-flex;align-items:center;justify-content:center}
.mp-ltx-popover-sources{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.mp-ltx-popover-chip{padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#cfd2dc;font-size:11px;font-weight:600;cursor:pointer}
.mp-ltx-popover-chip:hover{background:rgba(122,167,255,.2);border-color:rgba(122,167,255,.5);color:#fff}
.mp-ltx-hover-tip{position:fixed;z-index:2147483646;pointer-events:none;max-width:240px;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(18,19,24,.94);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);box-shadow:0 10px 28px rgba(0,0,0,.5);color:#e8e8ec;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;display:flex;flex-direction:column;gap:2px}
.mp-ltx-hover-title{font-size:12px;font-weight:600;line-height:1.35;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mp-ltx-hover-site{color:#fe628e;font-weight:700}
.mp-ltx-hover-sub{font-size:11px;line-height:1.3;color:#9a9da8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mp-ltx-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(20,21,26,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#f3f4f8;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.45);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
`;

export class LtxLibAdapter {
    static initialized = false;
    static _observer = null;
    static _rafScheduled = false;
    static _scanTimer = null;
    static _popoverEl = null;
    static _outsideHandler = null;
    static _escHandler = null;
    static _hoverTipEl = null;
    static _hoveredBtn = null;
    static _hoverTimer = null;
    static _toastEl = null;
    static _toastTimer = null;
    static _canIngest = null;
    static _onIngest = null;
    static _onNotify = null;

    static isLtxLibSite() {
        if (typeof document === 'undefined' || typeof location === 'undefined') return false;
        if (document.querySelector('meta[name="ltx-app"]')) return true;
        const host = String(location.hostname || '').toLowerCase();
        return host === 'ltxlib.dpdns.org' || host.endsWith('.ltxlib.dpdns.org');
    }

    static configure(options = {}) {
        if (typeof options.canIngest === 'function') this._canIngest = options.canIngest;
        if (typeof options.onIngest === 'function') this._onIngest = options.onIngest;
        if (typeof options.onNotify === 'function') this._onNotify = options.onNotify;
    }

    static detectAndStart(options = {}) {
        this.configure(options);
        if (this.initialized) return true;
        if (!this.isLtxLibSite()) return false;
        // 避免主脚本与伴侣脚本同时运行时重复启动（使用 DOM dataset 跨脚本沙箱互斥）
        if (typeof document !== 'undefined' && document.documentElement?.dataset?.mpLtxActive === '1') {
            return true;
        }
        if (typeof document !== 'undefined' && document.documentElement?.dataset) {
            document.documentElement.dataset.mpLtxActive = '1';
        }
        this.init(options);
        return true;
    }

    static _notify(msg, duration = 2400, type = 'info') {
        if (this._onNotify) {
            this._onNotify(msg, duration, type);
            return;
        }
        if (typeof document === 'undefined' || !document.body) return;
        this.ensureStyles();
        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
            this._toastTimer = null;
        }
        if (!this._toastEl) {
            const el = document.createElement('div');
            el.className = 'mp-ltx-toast';
            el.setAttribute('role', 'status');
            this._toastEl = el;
        }
        this._toastEl.textContent = String(msg || '');
        if (!this._toastEl.parentNode) {
            document.body.appendChild(this._toastEl);
        }
        this._toastTimer = setTimeout(() => {
            if (this._toastEl && this._toastEl.parentNode) {
                this._toastEl.parentNode.removeChild(this._toastEl);
            }
        }, Math.max(1200, Number(duration) || 2400));
    }

    /**
     * 兜底确认完整按钮/悬浮提示/弹窗样式已注入（兼容 Stay content 模式及 document-start 丢失场景）
     */
    static ensureStyles() {
        if (typeof document === 'undefined') return;
        const probeId = 'mp-ltx-fallback-style';
        if (document.getElementById(probeId)) return;

        let alreadyStyled = false;
        try {
            const testBtn = document.querySelector('.mp-ltx-play-btn');
            if (testBtn && typeof getComputedStyle === 'function') {
                const cs = getComputedStyle(testBtn);
                const radius = parseFloat(cs.borderTopLeftRadius || '0');
                alreadyStyled = cs.position === 'absolute' && radius >= 12;
            }
        } catch (_) {}
        if (alreadyStyled) return;

        try {
            const styleEl = document.createElement('style');
            styleEl.id = probeId;
            styleEl.textContent = LTX_FALLBACK_CSS;
            (document.head || document.documentElement)?.appendChild(styleEl);
        } catch (_) {
            if (typeof GM_addStyle === 'function') {
                try { GM_addStyle(LTX_FALLBACK_CSS); } catch (_) {}
            }
        }
    }

    static init(options = {}) {
        this.configure(options);
        if (this.initialized) return;
        this.initialized = true;

        this.ensureStyles();
        this.scanAndInject(document);

        const scheduleScan = () => {
            if (this._rafScheduled) return;
            this._rafScheduled = true;
            const schedule = typeof requestAnimationFrame === 'function'
                ? requestAnimationFrame
                : (fn) => setTimeout(fn, 16);
            schedule(() => {
                this._rafScheduled = false;
                this.ensureStyles();
                this.scanAndInject(document);
            });
        };

        const root = document.documentElement || document.body;
        if (root && typeof MutationObserver === 'function') {
            this._observer = new MutationObserver(scheduleScan);
            this._observer.observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-code', 'open']
            });
        }

        // 兜底对账心跳：应对异步分页/懒加载/后台标签页 rAF 节流
        if (!this._scanTimer && typeof setInterval === 'function') {
            this._scanTimer = setInterval(() => {
                const cards = document.querySelectorAll('article.card[data-code]');
                if (cards.length > 0 && document.querySelectorAll('[data-mp-ltx-btn]').length < cards.length) {
                    this.ensureStyles();
                    this.scanAndInject(document);
                }
            }, 1200);
        }

        if (typeof addEventListener === 'function') {
            addEventListener('load', scheduleScan, { once: true });
            addEventListener('popstate', scheduleScan);
            addEventListener('hashchange', scheduleScan);
            addEventListener('scroll', () => this.hideHoverTip(), { capture: true, passive: true });
        }
    }

    /**
     * 扫描并注入所有未挂载按钮的卡片与详情弹窗
     */
    static scanAndInject(root = document) {
        if (!root || typeof root.querySelectorAll !== 'function') return;

        const cards = root.querySelectorAll('article.card[data-code]');
        for (let i = 0; i < cards.length; i++) {
            this.injectCardButton(cards[i]);
        }

        const dialogs = root.querySelectorAll('dialog.dialog[open]');
        for (let i = 0; i < dialogs.length; i++) {
            this.injectModalButton(dialogs[i]);
        }
    }

    /**
     * 实时提取卡片最新元数据（防范 Vue DOM 复用导致串号）
     */
    static extractCardMeta(card) {
        if (!card) return { code: '', title: '', poster: '' };
        const code = String(card.getAttribute('data-code') || card.dataset?.code || '').trim().toUpperCase();
        const titleEl = card.querySelector('.title-btn, h3.title');
        const imgEl = card.querySelector('.cover-btn img, .cover img');
        return {
            code,
            title: titleEl ? String(titleEl.textContent || '').trim() : '',
            poster: imgEl ? String(imgEl.getAttribute('src') || imgEl.src || '').trim() : ''
        };
    }

    static injectCardButton(card) {
        if (!card) return;
        const cover = card.querySelector('.cover');
        if (!cover || cover.querySelector('[data-mp-ltx-btn]')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mp-ltx-play-btn';
        btn.setAttribute('data-mp-ltx-btn', '1');
        btn.setAttribute('aria-label', 'Miss Player 跨站播放（右键 / 长按选源或入库）');
        btn.innerHTML = `<span class="mp-ltx-play-icon">${PLAY}</span>`;

        this._bindPlayButtonEvents(btn, () => {
            const ownerCard = btn.closest('article.card');
            return this.extractCardMeta(ownerCard);
        });

        cover.appendChild(btn);
    }

    static injectModalButton(dialog) {
        if (!dialog || dialog.querySelector('[data-mp-ltx-modal-btn]')) return;
        const header = dialog.querySelector('header, .head, .dialog-head, .dlg-head');
        if (!header) return;

        const code = matchAvCodeFromText(dialog.textContent || '');
        if (!code) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mp-ltx-modal-play-btn';
        btn.setAttribute('data-mp-ltx-modal-btn', '1');
        btn.setAttribute('aria-label', `${code} Miss Player 跨站播放`);
        btn.innerHTML = `<span class="mp-ltx-play-icon">${PLAY}</span><span>跨站播放</span>`;

        this._bindPlayButtonEvents(btn, () => ({
            code: matchAvCodeFromText(dialog.textContent || '') || code,
            title: String(header.textContent || '').trim().slice(0, 100),
            poster: ''
        }));

        header.appendChild(btn);
    }

    static _isDesktopHoverCapable(e) {
        if (e && e.pointerType) {
            return e.pointerType === 'mouse';
        }
        if (typeof matchMedia === 'function') {
            return matchMedia('(hover: hover) and (pointer: fine)').matches;
        }
        return false;
    }

    static formatHoverSummary(code, dest) {
        if (!dest) {
            return {
                siteLabel: '正在探测跳转站点…',
                subText: `${code} · 123AV / JAVVerse / MissAV / Jable`
            };
        }
        if (dest.ready && dest.sourceName) {
            const hostPart = dest.host ? `${dest.host} · ` : '';
            return {
                siteLabel: dest.sourceName,
                subText: `${hostPart}右键选源`,
                prefix: '跳转站点：'
            };
        }
        return {
            siteLabel: '暂未匹配外部片源',
            subText: `${code} · 右键可手动选源`
        };
    }

    static _positionHoverTip(anchorEl, tipEl) {
        if (!anchorEl || !tipEl || typeof anchorEl.getBoundingClientRect !== 'function') return;
        const rect = anchorEl.getBoundingClientRect();
        const tipRect = tipEl.getBoundingClientRect();
        const vw = typeof innerWidth === 'number' ? innerWidth : 1280;
        const left = Math.max(8, Math.min(rect.left, vw - tipRect.width - 8));
        const top = rect.top - tipRect.height - 8 >= 8
            ? rect.top - tipRect.height - 8
            : rect.bottom + 8;
        tipEl.style.left = `${Math.round(left)}px`;
        tipEl.style.top = `${Math.round(top)}px`;
    }

    static showHoverTip(anchorEl, code, dest = null) {
        if (typeof document === 'undefined' || !document.body || !code) return;
        this.ensureStyles();

        let tip = this._hoverTipEl;
        if (!tip) {
            tip = document.createElement('div');
            tip.className = 'mp-ltx-hover-tip';
            tip.setAttribute('role', 'tooltip');

            const titleLine = document.createElement('div');
            titleLine.className = 'mp-ltx-hover-title';
            const prefixSpan = document.createElement('span');
            prefixSpan.className = 'mp-ltx-hover-prefix';
            const siteSpan = document.createElement('span');
            siteSpan.className = 'mp-ltx-hover-site';
            titleLine.append(prefixSpan, siteSpan);

            const subLine = document.createElement('div');
            subLine.className = 'mp-ltx-hover-sub';
            tip.append(titleLine, subLine);
            this._hoverTipEl = tip;
        }

        const { prefix = '', siteLabel, subText } = this.formatHoverSummary(code, dest);
        tip.querySelector('.mp-ltx-hover-prefix').textContent = prefix;
        tip.querySelector('.mp-ltx-hover-site').textContent = siteLabel;
        tip.querySelector('.mp-ltx-hover-sub').textContent = subText;

        if (!tip.parentNode) {
            document.body.appendChild(tip);
        }
        this._positionHoverTip(anchorEl, tip);
        anchorEl.setAttribute('aria-label', `${code} ${prefix}${siteLabel}`.trim());
    }

    static hideHoverTip() {
        if (this._hoverTimer) {
            clearTimeout(this._hoverTimer);
            this._hoverTimer = null;
        }
        this._hoveredBtn = null;
        if (this._hoverTipEl && this._hoverTipEl.parentNode) {
            this._hoverTipEl.parentNode.removeChild(this._hoverTipEl);
        }
    }

    static _bindPlayButtonEvents(btn, getMeta) {
        let pressTimer = null;
        let longPressed = false;
        let startX = 0;
        let startY = 0;

        const clearPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        const stopOnly = (e) => {
            e.stopPropagation();
        };

        btn.addEventListener('pointerenter', (e) => {
            if (!this._isDesktopHoverCapable(e)) return;
            const meta = getMeta();
            if (!meta.code) return;

            this.hideHoverTip();
            this._hoveredBtn = btn;

            const cached = CrossSitePlayRouter.getCachedDestination(meta.code);
            if (cached.ready) {
                this.showHoverTip(btn, meta.code, cached);
                return;
            }

            this.showHoverTip(btn, meta.code, null);
            this._hoverTimer = setTimeout(() => {
                this._hoverTimer = null;
                if (this._hoveredBtn !== btn) return;
                CrossSitePlayRouter.previewDestination(meta.code).then((dest) => {
                    if (this._hoveredBtn !== btn) return;
                    const latestMeta = getMeta();
                    if (!latestMeta || latestMeta.code !== meta.code) return;
                    this.showHoverTip(btn, meta.code, dest);
                }).catch(() => {});
            }, HOVER_INTENT_MS);
        });

        btn.addEventListener('pointerleave', () => {
            if (this._hoveredBtn === btn) {
                this.hideHoverTip();
            }
        });

        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (this._hoveredBtn === btn) this.hideHoverTip();
            if (e.button === 2) return;
            longPressed = false;
            startX = e.clientX || 0;
            startY = e.clientY || 0;
            clearPress();
            pressTimer = setTimeout(() => {
                longPressed = true;
                this.openActionPopover(btn, getMeta());
            }, LONG_PRESS_MS);
        });

        btn.addEventListener('pointermove', (e) => {
            if (!pressTimer) return;
            const dx = Math.abs((e.clientX || 0) - startX);
            const dy = Math.abs((e.clientY || 0) - startY);
            if (dx > 8 || dy > 8) clearPress();
        });

        btn.addEventListener('pointerup', clearPress);
        btn.addEventListener('pointercancel', clearPress);
        btn.addEventListener('touchstart', stopOnly, { passive: true });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearPress();
            this.hideHoverTip();
            this.openActionPopover(btn, getMeta());
        });

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearPress();
            this.hideHoverTip();
            if (longPressed) {
                longPressed = false;
                return;
            }
            if (btn.classList.contains('is-loading')) return;
            const meta = getMeta();
            if (!meta.code) return;

            btn.classList.add('is-loading');
            try {
                await CrossSitePlayRouter.play(meta);
            } finally {
                btn.classList.remove('is-loading');
            }
        });
    }

    static closePopover() {
        if (this._popoverEl && this._popoverEl.parentNode) {
            this._popoverEl.parentNode.removeChild(this._popoverEl);
        }
        this._popoverEl = null;
        if (this._outsideHandler) {
            document.removeEventListener('click', this._outsideHandler, true);
            this._outsideHandler = null;
        }
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler, true);
            this._escHandler = null;
        }
    }

    /**
     * 打开卡片长按 / 右键操作菜单（指定片源 + Peach 一键入库 / 网关配置）
     */
    static async openActionPopover(anchorEl, meta) {
        this.closePopover();
        this.hideHoverTip();
        if (!meta || !meta.code) return;
        this.ensureStyles();

        const pop = document.createElement('div');
        pop.className = 'mp-ltx-popover';
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', `${meta.code} 播放选项`);

        const gwHint = CrossSitePlayRouter.isGatewayConfigured() ? '优先网关影院' : '纯脚本跨站直达';

        const head = document.createElement('div');
        head.className = 'mp-ltx-popover-head';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'mp-ltx-popover-code';
        titleSpan.textContent = meta.code;
        const subSpan = document.createElement('span');
        subSpan.className = 'mp-ltx-popover-mode';
        subSpan.textContent = gwHint;
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'mp-ltx-popover-close';
        closeBtn.innerHTML = ICON_X_CLOSE;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closePopover();
        });
        head.append(titleSpan, subSpan, closeBtn);
        pop.appendChild(head);

        const autoBtn = document.createElement('button');
        autoBtn.type = 'button';
        autoBtn.className = 'mp-ltx-popover-item is-primary';
        autoBtn.innerHTML = `<span class="mp-ltx-popover-ico">${PLAY}</span><span>自动最优源播放</span>`;
        autoBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            this.closePopover();
            await CrossSitePlayRouter.play(meta);
        });
        pop.appendChild(autoBtn);

        const srcGrid = document.createElement('div');
        srcGrid.className = 'mp-ltx-popover-sources';
        CROSS_SITE_SOURCES.forEach((src) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'mp-ltx-popover-chip';
            chip.textContent = src.label;
            chip.addEventListener('click', async (e) => {
                e.stopPropagation();
                this.closePopover();
                await CrossSitePlayRouter.play({ ...meta, sourceId: src.id });
            });
            srcGrid.appendChild(chip);
        });
        pop.appendChild(srcGrid);

        if (this._onIngest) {
            const peachBtn = document.createElement('button');
            peachBtn.type = 'button';
            peachBtn.className = 'mp-ltx-popover-item';
            peachBtn.innerHTML = `<span class="mp-ltx-popover-ico">${ICON_PEACH}</span><span>一键入库 Peach (.strm)</span>`;
            peachBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                this.closePopover();
                if (this._canIngest && !this._canIngest()) {
                    this._notify('请先在 Miss Player 设置中配置流网关地址后再入库', 3000, 'warning');
                    return;
                }
                try {
                    const res = await this._onIngest(meta.code);
                    this._notify(res?.message || `${meta.code} 已入库 Peach`, 2500, 'success');
                } catch (err) {
                    this._notify(`入库失败: ${err.message || err}`, 3000, 'error');
                }
            });
            pop.appendChild(peachBtn);
        } else {
            const gwBtn = document.createElement('button');
            gwBtn.type = 'button';
            gwBtn.className = 'mp-ltx-popover-item';
            gwBtn.innerHTML = `<span class="mp-ltx-popover-ico">${ICON_PEACH}</span><span>配置流网关地址</span>`;
            gwBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closePopover();
                if (typeof prompt !== 'function') return;
                const nextBase = prompt('请输入 miss-gateway 地址（留空清除，例如 http://192.168.2.250:8765）：', '');
                if (nextBase === null) return;
                const nextToken = nextBase.trim() ? (prompt('请输入网关 Token（默认 dev）：', 'dev') ?? 'dev') : '';
                CrossSitePlayRouter.setGatewayConfig({ base: nextBase, token: nextToken });
                this._notify(nextBase.trim() ? '流网关配置已保存' : '已切换为纯脚本跨站直达', 2400, 'success');
            });
            pop.appendChild(gwBtn);
        }

        document.body.appendChild(pop);
        this._popoverEl = pop;

        const rect = anchorEl.getBoundingClientRect();
        const popRect = pop.getBoundingClientRect();
        const vw = typeof innerWidth === 'number' ? innerWidth : 1280;
        const vh = typeof innerHeight === 'number' ? innerHeight : 800;
        const left = Math.max(12, Math.min(rect.left, vw - popRect.width - 12));
        const top = (rect.bottom + 8 + popRect.height <= vh - 12)
            ? rect.bottom + 8
            : Math.max(12, rect.top - popRect.height - 8);
        pop.style.left = `${Math.round(left)}px`;
        pop.style.top = `${Math.round(top)}px`;

        setTimeout(() => {
            if (this._popoverEl !== pop) return;
            this._outsideHandler = (ev) => {
                if (this._popoverEl && !this._popoverEl.contains(ev.target) && !anchorEl.contains(ev.target)) {
                    this.closePopover();
                }
            };
            this._escHandler = (ev) => {
                if (ev.key === 'Escape') this.closePopover();
            };
            document.addEventListener('click', this._outsideHandler, true);
            document.addEventListener('keydown', this._escHandler, true);
        }, 0);

        CrossSitePlayRouter.probeGatewayHealth().then(({ reachable }) => {
            if (this._popoverEl === pop) {
                subSpan.textContent = reachable ? '网关已就绪' : '纯脚本直连';
            }
        }).catch(() => {});
    }
}
