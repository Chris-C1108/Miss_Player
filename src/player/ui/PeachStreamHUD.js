/**
 * PeachStreamHUD — Peach Web 视频流采集、代理穿透与播放诊断高精度探针
 * 
 * 核心能力：
 * 1. 【全景寻源链路追踪】：记录 Jable / 123AV / MissAV / 自建采集端每一步的请求耗时、状态码、Cloudflare 盾牌拦截状态与流地址；
 * 2. 【代理与网络透明化】：直观呈现当前请求的活跃 Origin、本地代理连通性与 CDN 切片域名，帮助用户精准排查代理节点封锁问题；
 * 3. 【播放器生命周期诊断】：实时捕获 <video> 的 loadstart、loadedmetadata、canplay、playing 以及 NotSupportedError 等错误事件；
 * 4. 【Peach 账本回写监控】：监控 /api/activity 与 /api/play 的实时进度同步心跳；
 * 5. 【一键拷贝完整排错报告】：支持将全套诊断数据格式化复制为 Markdown，极大方便用户排查与反馈。
 * 6. 【自包含样式与智能挂载】：无论在 Shadow DOM 内部、设置菜单之上、还是 Top Layer <dialog> 均能 100% 独立稳定呈现。
 */

import { Toast } from '../../utils/index.js';
import { getCurrentVersion } from '../../services/SleazyForkService.js';
import { PeachService } from '../../services/PeachService.js';

export class PeachStreamHUD {
    static _container = null;
    static _isCollapsed = false;
    static _logs = [];
    static _maxLogs = 60;
    static _currentMeta = {
        avcode: '',
        assetId: 0,
        streamUrl: '',
        streamSource: '',
        cdnDomain: '',
        playerState: 'idle',
        sourcesPipeline: []
    };

    /**
     * 初始化并在当前页面、Shadow DOM 或 <dialog> 顶层挂载诊断探针
     * @param {HTMLElement} [playerContainer=null] 播放器容器
     * @param {ShadowRoot} [shadowRoot=null] Shadow DOM 根
     */
    static init(playerContainer = null, shadowRoot = null) {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        // 智能定位最高层级的挂载目标
        const rootHost = document.querySelector('miss-player-root');
        const effectiveShadow = shadowRoot || rootHost?.shadowRoot;
        const effectiveContainer = playerContainer || effectiveShadow?.querySelector('.tm-player-container');
        const activeDialog = document.querySelector('dialog[open], [data-stage-host] dialog');
        
        // 挂载优先级：正在展示的播放器容器 > Shadow DOM > 顶层打开的 dialog > document.body
        const mountTarget = effectiveContainer || effectiveShadow || (activeDialog && activeDialog.isConnected ? activeDialog : document.body);

        // 如果已存在先更新挂载位置与展示
        if (this._container && this._container.isConnected) {
            this._container.style.display = 'block';
            if (this._container.parentElement !== mountTarget) {
                mountTarget.appendChild(this._container);
            }
            this.updateDisplay();
            return;
        }

        this._container = document.createElement('div');
        this._container.className = 'tm-peach-stream-hud';

        // 注入自包含独立内联样式 (完全独立，零外部污染，且不受 Shadow DOM 隔离限制)
        const style = document.createElement('style');
        style.textContent = `
            .tm-peach-stream-hud {
                position: fixed !important;
                top: max(56px, env(safe-area-inset-top, 56px)) !important;
                left: 12px !important;
                right: 12px !important;
                max-width: 440px !important;
                max-height: 82vh !important;
                overflow-y: auto !important;
                z-index: 2147483647 !important;
                background: rgba(12, 14, 20, 0.96) !important;
                backdrop-filter: blur(24px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
                border: 1px solid rgba(56, 189, 248, 0.45) !important;
                border-radius: 14px !important;
                padding: 12px 14px !important;
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.9) !important;
                color: #e2e8f0 !important;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                font-size: 11px !important;
                line-height: 1.4 !important;
                box-sizing: border-box !important;
                pointer-events: auto !important;
                user-select: text !important;
                -webkit-user-select: text !important;
            }
            .tm-hud-collapsed-bar {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #38bdf8 !important;
                cursor: pointer !important;
            }
            .tm-hud-dot {
                width: 8px !important;
                height: 8px !important;
                border-radius: 50% !important;
                background: #ef4444 !important;
            }
            .tm-hud-dot.is-active {
                background: #30d158 !important;
            }
            .tm-hud-expand-btn,
            .tm-hud-close-btn,
            .tm-hud-tool-btn {
                background: rgba(255, 255, 255, 0.12) !important;
                color: #e2e8f0 !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 6px !important;
                padding: 3px 8px !important;
                font-size: 10px !important;
                cursor: pointer !important;
            }
            .tm-hud-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding-bottom: 8px !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
                margin-bottom: 8px !important;
            }
            .tm-hud-title {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                color: #38bdf8 !important;
            }
            .tm-hud-version {
                font-size: 9px !important;
                padding: 1px 4px !important;
                border-radius: 4px !important;
                background: rgba(56, 189, 248, 0.2) !important;
                color: #38bdf8 !important;
            }
            .tm-hud-tools {
                display: flex !important;
                gap: 6px !important;
            }
            .tm-hud-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 6px 12px !important;
                padding: 8px !important;
                background: rgba(0, 0, 0, 0.4) !important;
                border-radius: 8px !important;
                margin-bottom: 8px !important;
            }
            .tm-hud-cell {
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .tm-hud-label { color: #94a3b8 !important; }
            .tm-hud-val { color: #cbd5e1 !important; }
            .tm-hud-val-highlight { color: #38bdf8 !important; }
            .tm-hud-section-title {
                font-weight: 700 !important;
                color: #94a3b8 !important;
                margin: 6px 0 4px 0 !important;
                font-size: 10px !important;
            }
            .tm-hud-pipeline-box {
                display: flex !important;
                flex-direction: column !important;
                gap: 4px !important;
                padding: 6px 8px !important;
                background: rgba(0, 0, 0, 0.4) !important;
                border-radius: 8px !important;
                margin-bottom: 8px !important;
            }
            .tm-hud-pipeline-item {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
            }
            .tm-hud-pipeline-name {
                font-weight: 600 !important;
                min-width: 65px !important;
                color: #e2e8f0 !important;
            }
            .tm-hud-dim {
                color: #64748b !important;
                font-size: 10px !important;
            }
            .tm-hud-logs-box {
                display: flex !important;
                flex-direction: column !important;
                gap: 3px !important;
                max-height: 140px !important;
                overflow-y: auto !important;
                padding: 6px 8px !important;
                background: rgba(0, 0, 0, 0.5) !important;
                border-radius: 8px !important;
            }
            .tm-hud-log-line {
                font-size: 10px !important;
                display: flex !important;
                gap: 6px !important;
                align-items: baseline !important;
            }
            .tm-hud-tag {
                font-weight: 700 !important;
                color: #38bdf8 !important;
                font-size: 9px !important;
            }
        `;
        this._container.appendChild(style);

        mountTarget.appendChild(this._container);

        this.updateDisplay();
        console.log('[PeachStreamHUD] 视频流采集与播放诊断探针已成功挂载至:', mountTarget);
    }

    /**
     * 销毁并移除探针
     */
    static destroy() {
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
    }

    /**
     * 记录一条流水线日志
     * @param {string} category - 类别: 'SCRAPE' | 'STREAM' | 'PLAYER' | 'PEACH'
     * @param {string} message - 日志详情
     * @param {'info'|'success'|'warn'|'error'} [level='info'] - 级别
     */
    static log(category, message, level = 'info') {
        const time = new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0');
        this._logs.push({ time, category, message, level });
        if (this._logs.length > this._maxLogs) {
            this._logs.shift();
        }
        this.updateDisplay();
    }

    /**
     * 更新当前作品与流水线元数据状态
     */
    static updateMeta(meta = {}) {
        Object.assign(this._currentMeta, meta);
        if (meta.streamUrl) {
            try {
                this._currentMeta.cdnDomain = new URL(meta.streamUrl).hostname;
            } catch (_) {}
        }
        this.updateDisplay();
    }

    /**
     * 记录源站请求结果
     */
    static recordSourceResult(sourceName, { status, elapsedMs, success, detail, isCfBlocked }) {
        const item = {
            name: sourceName,
            status,
            elapsedMs,
            success,
            detail: detail || '',
            isCfBlocked: Boolean(isCfBlocked)
        };

        const existingIdx = this._currentMeta.sourcesPipeline.findIndex(s => s.name === sourceName);
        if (existingIdx !== -1) {
            this._currentMeta.sourcesPipeline[existingIdx] = item;
        } else {
            this._currentMeta.sourcesPipeline.push(item);
        }

        const statusLabel = isCfBlocked ? '🛡️ CF 5秒盾拦截' : (success ? '✅ 成功获取' : `❌ 失败 (${status || '网络超时'})`);
        this.log('SCRAPE', `[${sourceName}] ${statusLabel} · 耗时 ${elapsedMs}ms ${detail ? `(${detail})` : ''}`, isCfBlocked ? 'warn' : (success ? 'success' : 'error'));
    }

    /**
     * 刷新并渲染 HUD 内容
     */
    static updateDisplay() {
        if (!this._container) return;

        const config = PeachService.getConfig();
        const meta = this._currentMeta;

        // 保留 style 标签，只更新内容容器
        let bodyNode = this._container.querySelector('.tm-hud-body');
        if (!bodyNode) {
            bodyNode = document.createElement('div');
            bodyNode.className = 'tm-hud-body';
            this._container.appendChild(bodyNode);
        }

        if (this._isCollapsed) {
            bodyNode.innerHTML = `
                <div class="tm-hud-collapsed-bar" title="点击展开 Peach 流采集探针">
                    <span class="tm-hud-dot ${meta.streamUrl ? 'is-active' : ''}"></span>
                    <span>🍑 流采集探针 [${meta.avcode || '未识别'}]</span>
                    <button type="button" class="tm-hud-expand-btn">展开</button>
                    <button type="button" class="tm-hud-close-btn">✕</button>
                </div>
            `;
            bodyNode.querySelector('.tm-hud-expand-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this._isCollapsed = false;
                this.updateDisplay();
            });
            bodyNode.querySelector('.tm-hud-close-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.destroy();
            });
            return;
        }

        const pipelineHtml = meta.sourcesPipeline.map(s => {
            const color = s.isCfBlocked ? '#f59e0b' : (s.success ? '#30d158' : '#ef4444');
            const icon = s.isCfBlocked ? '🛡️' : (s.success ? '✓' : '✗');
            return `
                <div class="tm-hud-pipeline-item">
                    <span class="tm-hud-pipeline-name">${s.name}:</span>
                    <span style="color: ${color}; font-weight: 600;">${icon} ${s.status || 'ERR'}</span>
                    <span class="tm-hud-dim">${s.elapsedMs}ms</span>
                    ${s.detail ? `<span class="tm-hud-dim" title="${s.detail}">${s.detail.slice(0, 24)}</span>` : ''}
                </div>
            `;
        }).join('') || '<div class="tm-hud-dim">等待寻源流水线启动...</div>';

        const logsHtml = this._logs.slice(-12).reverse().map(l => {
            const colors = { info: '#94a3b8', success: '#4ade80', warn: '#f59e0b', error: '#f87171' };
            return `
                <div class="tm-hud-log-line">
                    <span class="tm-hud-dim">[${l.time}]</span>
                    <span class="tm-hud-tag">${l.category}</span>
                    <span style="color: ${colors[l.level] || '#fff'};">${l.message}</span>
                </div>
            `;
        }).join('');

        bodyNode.innerHTML = `
            <div class="tm-hud-header">
                <div class="tm-hud-title">
                    <span>🍑 视频流采集与播放诊断探针</span>
                    <span class="tm-hud-version">v${getCurrentVersion()}</span>
                </div>
                <div class="tm-hud-tools">
                    <button type="button" class="tm-hud-tool-btn tm-hud-copy-btn" title="拷贝完整诊断报告">拷贝日志</button>
                    <button type="button" class="tm-hud-tool-btn tm-hud-collapse-btn" title="折叠探针">收起</button>
                    <button type="button" class="tm-hud-tool-btn tm-hud-close-btn" title="关闭探针">✕</button>
                </div>
            </div>

            <div class="tm-hud-grid">
                <div class="tm-hud-cell"><span class="tm-hud-label">作品番号:</span> <b class="tm-hud-val-highlight">${meta.avcode || '未识别'}</b> (ID: ${meta.assetId || 0})</div>
                <div class="tm-hud-cell"><span class="tm-hud-label">活跃通道:</span> <span class="tm-hud-val">${config.base || '未连接'}</span></div>
                <div class="tm-hud-cell"><span class="tm-hud-label">视频流源:</span> <span style="color: ${meta.streamUrl ? '#30d158' : '#ef4444'}; font-weight: 600;">${meta.streamSource || '未获得'}</span></div>
                <div class="tm-hud-cell"><span class="tm-hud-label">切片 CDN:</span> <span class="tm-hud-val" title="${meta.cdnDomain}">${meta.cdnDomain || '无'}</span></div>
            </div>

            <div class="tm-hud-section-title">📡 动态寻源流水线状态:</div>
            <div class="tm-hud-pipeline-box">
                ${pipelineHtml}
            </div>

            <div class="tm-hud-section-title">📋 诊断事件流:</div>
            <div class="tm-hud-logs-box">
                ${logsHtml || '<div class="tm-hud-dim">暂无事件记录</div>'}
            </div>
        `;

        // 绑定事件
        bodyNode.querySelector('.tm-hud-copy-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyReport();
        });
        bodyNode.querySelector('.tm-hud-collapse-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._isCollapsed = true;
            this.updateDisplay();
        });
        bodyNode.querySelector('.tm-hud-close-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.destroy();
        });
    }

    /**
     * 拷贝完整 Markdown 诊断报告至剪贴板
     */
    static copyReport() {
        const config = PeachService.getConfig();
        const meta = this._currentMeta;
        const now = new Date().toLocaleString();

        const report = [
            `# Miss Player · Peach 视频流采集与播放诊断报告`,
            `* 生成时间: ${now}`,
            `* 脚本版本: v${getCurrentVersion()}`,
            `* 页面地址: ${window.location.href}`,
            `* 目标作品番号: ${meta.avcode || '未知'} (Asset ID: ${meta.assetId})`,
            `* Peach 活跃通道: ${config.base || '未配置'}`,
            `* 已纳管 Origin 候选池: ${config.origins.join(', ')}`,
            `* 获得视频流: ${meta.streamUrl ? '是' : '否'} (来源: ${meta.streamSource || '无'})`,
            `* 切片 CDN 域名: ${meta.cdnDomain || '无'}`,
            ``,
            `## 📡 寻源流水线执行情况`,
            ...(meta.sourcesPipeline.map(s => `- **${s.name}**: ${s.isCfBlocked ? 'Cloudflare 5秒盾拦截' : (s.success ? '成功' : '失败')} (状态: ${s.status}, 耗时: ${s.elapsedMs}ms, 备注: ${s.detail})`)),
            ``,
            `## 📋 详细事件流 (最近 20 条)`,
            ...(this._logs.slice(-20).map(l => `- \`[${l.time}] [${l.category}]\` ${l.message}`)),
            ``,
            `---\n*由 Miss Player 现场探针自动生成*`
        ].join('\n');

        try {
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(report);
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(report);
            }
            Toast('已成功拷贝 Peach 诊断排错报告', 2000, 'success');
        } catch (_) {
            Toast('拷贝失败，请手动截图控制台', 2000, 'error');
        }
    }
}
