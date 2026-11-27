/**
 * BatchTestFloatModal — 全局最高层级「批量实测控制台」悬浮窗
 *
 * 脱离设置面板独立运行，挂载于播放器顶层容器并绑定 UISurfaceMachine 全拦截守卫：
 * - 支持展开编辑番号清单与实时查看逐片进度 / SQI / WebDAV 上传日志
 * - 支持一键最小化为顶栏状态胶囊，测试期间自由查看播放器与字幕面板
 * - 所有输入交互与长按严格隔离在悬浮窗内部，彻底阻断向宿主或 Stay App 穿透
 */

import { UISurfaceMachine } from '../state/UISurfaceMachine.js';
import { bindTwoStepConfirm } from '../managers/settings_v2/components/S2Primitives.js';
import { LlmService } from '../../services/LlmService.js';
import {
    AiBatchTestRunner,
    parseBatchCodes,
    loadSavedBatchText,
    saveBatchText
} from '../../services/AiBatchTestRunner.js';
import { SubtitleRepository } from '../subtitles/SubtitleRepository.js';
import { SyncManager, WebDavClient } from '../../sync/index.js';
import { Toast } from '../../utils/index.js';
import { ICON_SERVER, ICON_TRASH, ICON_X_CLOSE } from '../../constants/icons.js';

let activeModalInstance = null;

export class BatchTestFloatModal {
    static open(options = {}) {
        const host = options.settingsManager?.uiManager?.playerContainer
            || (typeof window !== 'undefined' ? window.__missPlayerUIManager?.playerContainer : null);
        if (!host) return null;

        if (!activeModalInstance || activeModalInstance.host !== host || !activeModalInstance.root?.isConnected) {
            activeModalInstance?.destroy();
            activeModalInstance = new BatchTestFloatModal(host, options);
        } else if (options.settingsManager) {
            activeModalInstance.sm = options.settingsManager;
        }
        activeModalInstance.show();
        if (options.minimized !== undefined) {
            activeModalInstance.setMinimized(Boolean(options.minimized));
        }
        return activeModalInstance;
    }

    static getInstance() {
        return activeModalInstance;
    }

    static destroyActive() {
        if (activeModalInstance) {
            activeModalInstance.destroy();
            activeModalInstance = null;
        }
    }

    constructor(host, { settingsManager = null } = {}) {
        this.host = host;
        this.sm = settingsManager;
        this.root = null;
        this.badgeEl = null;
        this.minBtn = null;
        this.labelEl = null;
        this.textareaEl = null;
        this.progressFillEl = null;
        this.statusEl = null;
        this.logEl = null;
        this.runBtn = null;
        this.clearCacheBtn = null;
        this.clearTextBtn = null;
        this.isMinimized = false;
        this.isVisible = false;
        this._build();
    }

    _build() {
        const root = document.createElement('div');
        root.className = 'mp-batch-float is-hidden';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-label', '批量实测控制台');

        const head = document.createElement('div');
        head.className = 'mp-batch-float-head';

        const titleGroup = document.createElement('div');
        titleGroup.className = 'mp-batch-float-title-group';
        const titleEl = document.createElement('span');
        titleEl.className = 'mp-batch-float-title';
        titleEl.textContent = '批量实测控制台';
        const badgeEl = document.createElement('span');
        badgeEl.className = 'mp-batch-float-badge';
        badgeEl.textContent = '就绪';
        titleGroup.append(titleEl, badgeEl);

        const headBtns = document.createElement('div');
        headBtns.className = 'mp-batch-float-head-btns';

        const minBtn = document.createElement('button');
        minBtn.type = 'button';
        minBtn.className = 'mp-batch-float-icon-btn';
        minBtn.title = '最小化为胶囊';
        minBtn.setAttribute('aria-label', '最小化');
        minBtn.textContent = '−';
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'mp-batch-float-icon-btn';
        closeBtn.title = '关闭';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = ICON_X_CLOSE;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (AiBatchTestRunner.isRunning()) {
                this.setMinimized(true);
                Toast('测试正在后台运行，已收起为顶部胶囊', 2000, 'info');
                return;
            }
            LlmService.saveConfig({ aiDebugEnabled: false });
            BatchTestFloatModal.destroyActive();
        });

        headBtns.append(minBtn, closeBtn);
        head.append(titleGroup, headBtns);
        head.addEventListener('click', () => {
            if (this.isMinimized) this.setMinimized(false);
        });

        const body = document.createElement('div');
        body.className = 'mp-batch-float-body';

        const labelEl = document.createElement('div');
        labelEl.className = 'mp-batch-float-label';

        const textareaEl = document.createElement('textarea');
        textareaEl.className = 'mp-batch-float-textarea';
        textareaEl.placeholder = '每行一个番号或影片链接（自动缓存），例如：\nEKDV-796\nMIDV-264';
        textareaEl.value = loadSavedBatchText();

        const syncCount = () => {
            const count = parseBatchCodes(textareaEl.value).length;
            labelEl.textContent = count > 0
                ? `待测番号清单（已识别 ${count} 部，自动缓存）`
                : '待测番号清单（每行一部，自动缓存）';
            if (!AiBatchTestRunner.isRunning() && !this.statusEl?.dataset?.sticky) {
                badgeEl.textContent = count > 0 ? `${count} 部` : '就绪';
            }
        };
        textareaEl.addEventListener('input', () => {
            saveBatchText(textareaEl.value);
            syncCount();
        });

        const track = document.createElement('div');
        track.className = 'mp-batch-float-bar-track';
        const fill = document.createElement('div');
        fill.className = 'mp-batch-float-bar-fill';
        track.appendChild(fill);

        const statusEl = document.createElement('div');
        statusEl.className = 'mp-batch-float-status';
        statusEl.textContent = '粘贴番号清单后点击下方「开始实测」';

        const logEl = document.createElement('div');
        logEl.className = 'mp-batch-float-log is-hidden';

        const actions = document.createElement('div');
        actions.className = 'mp-batch-float-actions';

        const runBtn = document.createElement('button');
        runBtn.type = 'button';
        runBtn.className = 'mp-s2-btn mp-s2-btn--primary';
        runBtn.innerHTML = `${ICON_SERVER} <span>开始实测</span>`;
        runBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleRunToggle();
        });

        const clearCacheBtn = document.createElement('button');
        clearCacheBtn.type = 'button';
        clearCacheBtn.className = 'mp-s2-btn mp-s2-btn--danger';
        const clearCacheHtml = `${ICON_TRASH} <span>清字幕缓存</span>`;
        clearCacheBtn.innerHTML = clearCacheHtml;
        bindTwoStepConfirm(clearCacheBtn, {
            normalHtml: clearCacheHtml,
            confirmText: '确认清空?',
            onConfirm: async () => {
                clearCacheBtn.disabled = true;
                const sm = this.sm || (typeof window !== 'undefined' ? window.__missPlayerUIManager?.settingsManager : null);
                const res = await SubtitleRepository.clearLocal({ subtitleManager: sm?.controlManager?.subtitleManager });
                clearCacheBtn.disabled = false;
                clearCacheBtn.innerHTML = clearCacheHtml;
                statusEl.textContent = `已清理 ${res.clearedCount} 部本地字幕缓存`;
                Toast(`已清理 ${res.clearedCount} 部字幕缓存`, 2000, 'success');
            }
        });

        const clearTextBtn = document.createElement('button');
        clearTextBtn.type = 'button';
        clearTextBtn.className = 'mp-s2-btn mp-batch-float-clear-btn';
        clearTextBtn.textContent = '清空';
        clearTextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (AiBatchTestRunner.isRunning()) return;
            textareaEl.value = '';
            saveBatchText('');
            syncCount();
        });

        actions.append(runBtn, clearCacheBtn, clearTextBtn);
        body.append(labelEl, textareaEl, track, statusEl, logEl, actions);
        root.append(head, body);

        UISurfaceMachine.bindOverlayGuard(root, { stopMove: true, stopWheel: true });
        this.host.appendChild(root);

        this.root = root;
        this.badgeEl = badgeEl;
        this.minBtn = minBtn;
        this.labelEl = labelEl;
        this.textareaEl = textareaEl;
        this.progressFillEl = fill;
        this.statusEl = statusEl;
        this.logEl = logEl;
        this.runBtn = runBtn;
        this.clearCacheBtn = clearCacheBtn;
        this.clearTextBtn = clearTextBtn;
        syncCount();
    }

    _appendLog(line) {
        if (!this.logEl || !line) return;
        this.logEl.classList.remove('is-hidden');
        const row = document.createElement('div');
        row.textContent = line;
        this.logEl.appendChild(row);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    _syncVideoLock() {
        const ui = this.sm?.uiManager || (typeof window !== 'undefined' ? window.__missPlayerUIManager : null);
        const vw = ui?.videoWrapper;
        if (!vw) return;
        const shouldFreeze = Boolean(this.isVisible && !this.isMinimized) || Boolean(ui?.surfaceMachine?.hasAnySurfaceOpen?.());
        vw.inert = shouldFreeze;
    }

    async _handleRunToggle() {
        if (AiBatchTestRunner.isRunning()) {
            AiBatchTestRunner.cancel();
            this.runBtn.disabled = true;
            this.runBtn.textContent = '正在停止…';
            return;
        }
        saveBatchText(this.textareaEl.value);
        const codes = parseBatchCodes(this.textareaEl.value);
        if (!codes.length) {
            this.badgeEl.className = 'mp-batch-float-badge is-err';
            this.badgeEl.textContent = '空清单';
            this.statusEl.textContent = '请先在清单中输入有效番号';
            Toast('未识别到有效番号', 2000, 'error');
            return;
        }
        if (!WebDavClient.hasValidEndpoint(SyncManager.getWebDavConfig())) {
            this.badgeEl.className = 'mp-batch-float-badge is-err';
            this.badgeEl.textContent = '未配同步';
            this.statusEl.textContent = '请先在设置中配置 WebDAV 服务器以保存诊断日志';
            Toast('请先配置 WebDAV 服务器', 2200, 'error');
            return;
        }

        const sm = this.sm || (typeof window !== 'undefined' ? window.__missPlayerUIManager?.settingsManager : null);
        this.runBtn.innerHTML = `${ICON_SERVER} <span>停止实测</span>`;
        this.clearCacheBtn.disabled = true;
        this.clearTextBtn.disabled = true;
        this.logEl.innerHTML = '';
        this.logEl.classList.add('is-hidden');
        this.progressFillEl.style.width = '2%';
        this.badgeEl.className = 'mp-batch-float-badge is-running';
        this.badgeEl.textContent = `0/${codes.length}`;
        this.statusEl.dataset.sticky = '1';
        this.statusEl.textContent = `启动批量实测：共 ${codes.length} 部…`;

        try {
            const summary = await AiBatchTestRunner.runBatch({
                codes,
                clearLocalSubs: true,
                forceFresh: true,
                preferredLang: sm?.settings?.subtitlePreferredLang || 'auto',
                onProgress: (p) => {
                    const pct = p.total > 0 ? Math.max(4, Math.round((p.index / p.total) * 100)) : 0;
                    if (p.phase === 'start') {
                        this.badgeEl.textContent = `${p.index}/${p.total} ${p.code}`;
                        this.statusEl.textContent = `[${p.index}/${p.total}] 正在抓取与分析 ${p.code}…`;
                        this.progressFillEl.style.width = `${Math.max(4, Math.round(((p.index - 1) / p.total) * 100))}%`;
                    } else if (p.phase === 'done') {
                        const sqiTag = p.subSqi !== null ? `SQI:${p.subSqi}` : '无字幕';
                        const upTag = p.uploadedOk ? '已上传' : `失败(${p.uploadError})`;
                        const line = `[${p.index}/${p.total}] ${p.code} · ${sqiTag} · 评${p.commentsCount} · ${upTag}`;
                        this.progressFillEl.style.width = `${pct}%`;
                        this.badgeEl.textContent = `${p.index}/${p.total}`;
                        this.statusEl.textContent = line;
                        this._appendLog(line);
                    }
                }
            });
            this.progressFillEl.style.width = '100%';
            this.badgeEl.className = 'mp-batch-float-badge is-ok';
            this.badgeEl.textContent = `${summary.completed}/${summary.total} 完成`;
            this.statusEl.textContent = `${summary.aborted ? '已中止' : '全部完成'}：成功 ${summary.completed}/${summary.total} 部，已上传 ${summary.uploadedCount} 份至 ${LlmService.getConfig().aiDebugDir}`;
            Toast(`批量实测结束 (${summary.uploadedCount}/${summary.total} 已上传)`, 2600, 'success');
        } catch (err) {
            const errMsg = LlmService.redactSecrets(err?.message || '批量实测失败');
            this.badgeEl.className = 'mp-batch-float-badge is-err';
            this.badgeEl.textContent = '异常';
            this.statusEl.textContent = errMsg;
            Toast(errMsg, 2400, 'error');
        } finally {
            this.runBtn.disabled = false;
            this.runBtn.innerHTML = `${ICON_SERVER} <span>开始实测</span>`;
            this.clearCacheBtn.disabled = false;
            this.clearTextBtn.disabled = false;
        }
    }

    setMinimized(min) {
        this.isMinimized = Boolean(min);
        this.root?.classList.toggle('is-minimized', this.isMinimized);
        if (this.minBtn) {
            this.minBtn.textContent = this.isMinimized ? '□' : '−';
            this.minBtn.title = this.isMinimized ? '展开面板' : '最小化为胶囊';
        }
        this._syncVideoLock();
    }

    toggleMinimize() {
        this.setMinimized(!this.isMinimized);
    }

    show() {
        if (!this.root) return;
        this.isVisible = true;
        this.root.classList.remove('is-hidden');
        this.setMinimized(false);
        this._syncVideoLock();
    }

    hide() {
        if (!this.root) return;
        this.isVisible = false;
        this.root.classList.add('is-hidden');
        this._syncVideoLock();
    }

    destroy() {
        this.hide();
        this.root?.remove();
        this.root = null;
    }
}
