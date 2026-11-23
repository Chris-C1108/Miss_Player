/**
 * Jasna-LTX Library (https://ltxlib.dpdns.org/) 卡片跨站播放适配器
 *
 * 设计约束（基于对 ltxlib 实机 DOM/CSS/CSP 实测）：
 * 1. 页面 CSP 锁死 default-src 'none' / media-src / worker-src / frame-ancestors，
 *    绝对禁止向宿主页面注入 <video>、hls.js 或 <iframe>，所有播放均经 CrossSitePlayRouter 跨 Origin 承接。
 * 2. Vue 3 列表筛选/排序/翻页会原地复用 article.card 节点并仅变更 data-code 属性，
 *    因此点击事件严禁闭包固化初始 code，必须实时从 btn.closest('article.card').dataset.code 读取。
 * 3. 主入口位于封面左下角 (.cover 内 bottom:8px left:8px)，与右下 .score、左上 .code、右上 .tools 零重叠。
 */

import { CrossSitePlayRouter, CROSS_SITE_SOURCES } from '../services/CrossSitePlayRouter.js';
import { StrmIngestPipeline } from '../services/StrmIngestPipeline.js';
import { PeachService } from '../services/PeachService.js';
import { matchAvCodeFromText } from '../utils/videoCode.js';
import { Toast } from '../utils/index.js';
import { PLAY, ICON_PEACH, ICON_X_CLOSE } from '../constants/icons.js';

const LONG_PRESS_MS = 450;

export class LtxLibAdapter {
    static initialized = false;
    static _observer = null;
    static _rafScheduled = false;
    static _popoverEl = null;
    static _outsideHandler = null;
    static _escHandler = null;

    static isLtxLibSite() {
        if (typeof document === 'undefined' || typeof window === 'undefined') return false;
        if (document.querySelector('meta[name="ltx-app"]')) return true;
        const host = String(window.location?.hostname || '').toLowerCase();
        return host === 'ltxlib.dpdns.org' || host.endsWith('.ltxlib.dpdns.org');
    }

    static detectAndStart() {
        if (this.initialized) return true;
        if (!this.isLtxLibSite()) return false;
        this.init();
        return true;
    }

    static init() {
        if (this.initialized) return;
        this.initialized = true;

        this.scanAndInject(document);

        const root = document.getElementById('app') || document.body || document.documentElement;
        if (root && typeof MutationObserver === 'function') {
            this._observer = new MutationObserver(() => {
                if (this._rafScheduled) return;
                this._rafScheduled = true;
                const schedule = typeof requestAnimationFrame === 'function'
                    ? requestAnimationFrame
                    : (fn) => setTimeout(fn, 16);
                schedule(() => {
                    this._rafScheduled = false;
                    this.scanAndInject(document);
                });
            });
            this._observer.observe(root, { childList: true, subtree: true });
        }
    }

    /**
     * 扫描并注入所有未挂载按钮的卡片与详情弹窗
     */
    static scanAndInject(root = document) {
        if (!root || typeof root.querySelectorAll !== 'function') return;

        // 1. 卡片封面左下角主播放按钮
        const cards = root.querySelectorAll('article.card[data-code]');
        for (let i = 0; i < cards.length; i++) {
            this.injectCardButton(cards[i]);
        }

        // 2. 评论 / 详情弹窗头部播放入口
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
        btn.title = 'Miss Player 跨站播放（右键 / 长按选源或入库）';
        btn.setAttribute('aria-label', 'Miss Player 跨站播放');
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
        btn.innerHTML = `<span class="mp-ltx-play-icon">${PLAY}</span><span>跨站播放</span>`;

        this._bindPlayButtonEvents(btn, () => ({
            code: matchAvCodeFromText(dialog.textContent || '') || code,
            title: String(header.textContent || '').trim().slice(0, 100),
            poster: ''
        }));

        header.appendChild(btn);
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

        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
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
            this.openActionPopover(btn, getMeta());
        });

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearPress();
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
     * 打开卡片长按 / 右键操作菜单（指定片源 + Peach 一键入库）
     */
    static async openActionPopover(anchorEl, meta) {
        this.closePopover();
        if (!meta || !meta.code) return;

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

        const peachBtn = document.createElement('button');
        peachBtn.type = 'button';
        peachBtn.className = 'mp-ltx-popover-item';
        peachBtn.innerHTML = `<span class="mp-ltx-popover-ico">${ICON_PEACH}</span><span>一键入库 Peach (.strm)</span>`;
        peachBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            this.closePopover();
            if (!PeachService.buildGatewayPlayUrl(meta.code)) {
                Toast('请先在 Miss Player 设置中配置流网关地址后再入库', 3000, 'warning');
                return;
            }
            try {
                const res = await StrmIngestPipeline.ingest({ avcode: meta.code });
                Toast(res.message || `${meta.code} 已入库 Peach`, 2500, 'success');
            } catch (err) {
                Toast(`入库失败: ${err.message || err}`, 3000, 'error');
            }
        });
        pop.appendChild(peachBtn);

        document.body.appendChild(pop);
        this._popoverEl = pop;

        // 计算视口不溢出坐标
        const rect = anchorEl.getBoundingClientRect();
        const popRect = pop.getBoundingClientRect();
        const vw = window.innerWidth || 1280;
        const vh = window.innerHeight || 800;
        const left = Math.max(12, Math.min(rect.left, vw - popRect.width - 12));
        const top = (rect.bottom + 8 + popRect.height <= vh - 12)
            ? rect.bottom + 8
            : Math.max(12, rect.top - popRect.height - 8);
        pop.style.left = `${Math.round(left)}px`;
        pop.style.top = `${Math.round(top)}px`;

        // 延后一帧挂载外部点击关闭，防止刚打开被同一次 click 误关
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

        // 异步探测网关状态并更新副标题
        CrossSitePlayRouter.probeGatewayHealth().then(({ reachable }) => {
            if (this._popoverEl === pop) {
                subSpan.textContent = reachable ? '网关已就绪' : '纯脚本直连';
            }
        }).catch(() => {});
    }
}
