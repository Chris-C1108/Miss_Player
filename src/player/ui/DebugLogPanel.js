/**
 * 顶部居中 DEBUG 精简日志面板 (DebugLogPanel)
 * 
 * 职责：
 * 1. 顶部居中轻量悬浮胶囊，支持展开与收起，展示评论采集、WebDAV 联机、批次上传及疯狂采集的精简日志；
 * 2. 仅在 debugMode === true 时挂载显示，关闭时自动隐藏；
 * 3. 支持一键复制、清空日志，带日志级别色彩高亮与自动滚底。
 */

import { copyToClipboard, Toast } from '../../utils/index.js';

export class DebugLogPanel {
    static _container = null;
    static _isExpanded = false;
    static _logs = [];
    static _maxLogs = 150;

    /**
     * 初始化或更新调试日志面板状态
     * @param {boolean} isDebug 
     */
    static updateDebugState(isDebug) {
        if (isDebug) {
            this.ensurePanel();
            if (this._container) this._container.style.display = 'block';
        } else {
            if (this._container) this._container.style.display = 'none';
        }
    }

    /**
     * 确保面板 DOM 结构就绪
     */
    static ensurePanel() {
        if (this._container || typeof document === 'undefined') return;

        const container = document.createElement('div');
        container.className = 'tm-debug-log-panel-container';
        container.innerHTML = `
            <div class="tm-debug-log-pill" title="点击展开/收起 DEBUG 精简日志">
                <span class="tm-debug-pill-icon">🐛</span>
                <span class="tm-debug-pill-title">DEBUG 日志</span>
                <span class="tm-debug-pill-status" id="tm-debug-status-text">就绪</span>
                <span class="tm-debug-pill-arrow">▾</span>
            </div>
            <div class="tm-debug-log-box" style="display: none;">
                <div class="tm-debug-box-header">
                    <div class="tm-debug-box-title">
                        <span>🐛 DEBUG 精简日志</span>
                        <span class="tm-debug-box-count">(0)</span>
                    </div>
                    <div class="tm-debug-box-actions">
                        <button class="tm-debug-btn tm-debug-copy-btn" title="复制所有调试日志">复制</button>
                        <button class="tm-debug-btn tm-debug-clear-btn" title="清空日志">清空</button>
                        <button class="tm-debug-btn tm-debug-collapse-btn" title="收起面板">▴</button>
                    </div>
                </div>
                <div class="tm-debug-log-list">
                    <div class="tm-debug-log-empty">暂无调试日志</div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this._container = container;
        this._bindEvents();
    }

    /**
     * 绑定面板交互事件
     * @private
     */
    static _bindEvents() {
        if (!this._container) return;

        const pill = this._container.querySelector('.tm-debug-log-pill');
        const box = this._container.querySelector('.tm-debug-log-box');
        const arrow = this._container.querySelector('.tm-debug-pill-arrow');
        const copyBtn = this._container.querySelector('.tm-debug-copy-btn');
        const clearBtn = this._container.querySelector('.tm-debug-clear-btn');
        const collapseBtn = this._container.querySelector('.tm-debug-collapse-btn');

        const toggle = () => {
            this._isExpanded = !this._isExpanded;
            box.style.display = this._isExpanded ? 'flex' : 'none';
            arrow.textContent = this._isExpanded ? '▴' : '▾';
            if (this._isExpanded) {
                this._scrollToBottom();
            }
        };

        pill.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });

        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._isExpanded = false;
            box.style.display = 'none';
            arrow.textContent = '▾';
        });

        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._logs = [];
            this._renderLogs();
            Toast('已清空调试日志', 1200, 'info');
        });

        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this._logs.length === 0) {
                Toast('暂无日志可复制', 1500, 'info');
                return;
            }
            const fullText = this._logs.map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.text}`).join('\n');
            copyToClipboard(fullText);
            Toast('调试日志已复制到剪贴板', 1500, 'success');
        });
    }

    /**
     * 追加精简调试日志
     * @param {string} text - 日志文本
     * @param {'info'|'success'|'warn'|'error'} [level='info'] - 级别
     */
    static addLog(text, level = 'info') {
        if (!text) return;
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const entry = {
            id: Date.now() + Math.random().toString(36).slice(2, 6),
            time: timeStr,
            text: String(text),
            level
        };

        this._logs.push(entry);
        if (this._logs.length > this._maxLogs) {
            this._logs.shift();
        }

        // 更新状态文字
        if (this._container) {
            const statusEl = this._container.querySelector('#tm-debug-status-text');
            if (statusEl) {
                statusEl.textContent = entry.text.slice(0, 24) + (entry.text.length > 24 ? '...' : '');
                statusEl.className = `tm-debug-pill-status level-${level}`;
            }
            this._renderLogs();
        }
    }

    /**
     * 重新渲染日志列表
     * @private
     */
    static _renderLogs() {
        if (!this._container) return;
        const listEl = this._container.querySelector('.tm-debug-log-list');
        const countEl = this._container.querySelector('.tm-debug-box-count');
        if (!listEl) return;

        if (countEl) countEl.textContent = `(${this._logs.length})`;

        if (this._logs.length === 0) {
            listEl.innerHTML = '<div class="tm-debug-log-empty">暂无调试日志</div>';
            return;
        }

        listEl.innerHTML = this._logs.map(l => {
            return `<div class="tm-debug-log-row level-${l.level}"><span class="tm-log-time">[${l.time}]</span> <span class="tm-log-msg">${l.text}</span></div>`;
        }).join('');

        if (this._isExpanded) {
            this._scrollToBottom();
        }
    }

    static _scrollToBottom() {
        if (!this._container) return;
        const listEl = this._container.querySelector('.tm-debug-log-list');
        if (listEl) {
            listEl.scrollTop = listEl.scrollHeight;
        }
    }
}
