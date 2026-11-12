/**
 * 评论番号悬浮预览与一键复制模块 (CommentCodePreview)
 * 职责：负责评论内番号点击复制、四方 CDN 预览视频安全加载与 Shadow DOM 事件边界隔离
 */

import { __ } from '../../constants/i18n.js';
import { Toast, copyToClipboard } from '../../utils/index.js';
import { esc } from './CommentDataPipeline.js';

export class CommentCodePreview {
    constructor(panel) {
        this.panel = panel;
        this._popover = null;
        this._leaveTimer = null;
        this._currentReqId = 0;
        this._currentBlobUrl = null;
        this._onDocumentClick = null;
    }

    handleCodeClick(code, targetEl) {
        const cleanCode = (code || '').toUpperCase().trim();
        if (!cleanCode) return;

        this.copyCode(cleanCode);
        if (targetEl) {
            this.show(cleanCode, targetEl);
        }
    }

    copyCode(code) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                Toast(`番号已复制: ${code}`, 2000, 'success');
            }).catch(err => {
                console.error('Failed to copy code:', err);
                this._fallbackCopyText(code);
            });
        } else {
            this._fallbackCopyText(code);
        }
    }

    _fallbackCopyText(text) {
        copyToClipboard(text).then(success => {
            if (success) Toast(`番号已复制: ${text}`, 2000, 'success');
            else Toast(`复制失败，请手动复制: ${text}`, 3000, 'warning');
        });
    }

    show(code, targetEl) {
        if (!code || !targetEl) return;
        const cleanCode = code.toUpperCase().trim();
        const lowCode = code.toLowerCase().trim();

        if (!this._popover) {
            this._popover = document.createElement('div');
            this._popover.className = 'jc-code-preview-popover';

            // 严禁预览浮层内部交互冒泡给视频层或控制层
            const stopPop = (e) => e.stopPropagation();
            this._popover.addEventListener('pointerdown', stopPop);
            this._popover.addEventListener('mousedown', stopPop);
            this._popover.addEventListener('touchstart', stopPop, { passive: true });
            this._popover.addEventListener('touchmove', stopPop, { passive: true });
            this._popover.addEventListener('mousemove', stopPop);
            this._popover.addEventListener('click', stopPop);

            this._popover.addEventListener('mouseenter', () => {
                if (this._leaveTimer) {
                    clearTimeout(this._leaveTimer);
                    this._leaveTimer = null;
                }
            });
            this._popover.addEventListener('mouseleave', () => {
                this.hide();
            });

            // 兼容 Shadow DOM 事件穿透路径 composedPath
            this._onDocumentClick = (e) => {
                if (!this._popover || !this._popover.classList.contains('active')) return;
                const path = e.composedPath ? e.composedPath() : [];
                const isInside = path.some(el => el && el.classList && (
                    el.classList.contains('jc-code-preview-popover') ||
                    el.classList.contains('jc-code-link')
                ));
                if (!isInside) {
                    this.hide();
                }
            };
            document.addEventListener('pointerdown', this._onDocumentClick, true);
        }

        const targetParent = this.panel?.commentsPanel ||
            this.panel?.commentsPanel?.closest('.tm-player-container') ||
            this.panel?.uiElements?.playerContainer ||
            document.querySelector('miss-player-root')?.shadowRoot?.querySelector('.tm-player-container') ||
            document.body;

        if (this._popover.parentNode !== targetParent) {
            targetParent.appendChild(this._popover);
        }

        const pop = this._popover;
        pop.setAttribute('data-current-code', cleanCode);
        const loadingText = __('previewLoading') || '正在加载预览...';
        const notFoundText = __('previewNotFound') || '暂无预览小视频';
        const jumpTip = __('goToVideo') || '点击跳转到视频页面';

        pop.innerHTML = `<div class="jc-code-preview-video-wrap" title="${esc(jumpTip)}">
            <div class="jc-code-preview-loading">
                <div class="jc-code-preview-spinner"></div>
                <span>${loadingText}</span>
            </div>
            <video class="jc-code-preview-video is-hidden" loop muted playsinline referrerpolicy="no-referrer"></video>
            <div class="jc-code-preview-fallback is-hidden">
                <svg class="mp-preview-fallback-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <span>${notFoundText}</span>
            </div>
            <div class="jc-code-preview-hover-hint">
                <span>${esc(jumpTip)}</span>
            </div>
        </div>
        <div class="jc-code-preview-header">
            <span class="jc-code-preview-title">${esc(cleanCode)}</span>
            <span class="jc-code-preview-badge">Preview</span>
        </div>`;

        const videoWrap = pop.querySelector('.jc-code-preview-video-wrap');
        if (videoWrap) {
            videoWrap.style.cursor = 'pointer';
            videoWrap.addEventListener('click', (e) => {
                if (e) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (e.cancelable) e.preventDefault();
                }
                const targetUrl = `https://missav.ai/${cleanCode.toLowerCase()}`;
                if (typeof GM_openInTab === 'function') {
                    GM_openInTab(targetUrl, { active: true });
                } else {
                    window.open(targetUrl, '_blank');
                }
                this.hide();
            });
        }

        const rect = targetEl.getBoundingClientRect();
        const popWidth = 256;
        const popHeight = 180;

        let left = rect.left + (rect.width / 2) - (popWidth / 2);
        let top = rect.top - popHeight - 10;

        if (left < 10) left = 10;
        if (left + popWidth > window.innerWidth - 10) left = window.innerWidth - popWidth - 10;
        if (top < 10) {
            top = rect.bottom + 10;
        }

        pop.style.left = `${Math.round(left)}px`;
        pop.style.top = `${Math.round(top)}px`;

        requestAnimationFrame(() => {
            pop.classList.add('active');
        });

        const candidates = [
            `https://fourhoi.com/${lowCode}/preview.mp4`,
            `https://fourhoi.com/${lowCode}-uncensored-leak/preview.mp4`
        ];

        const videoEl = pop.querySelector('.jc-code-preview-video');
        const loadingEl = pop.querySelector('.jc-code-preview-loading');
        const fallbackEl = pop.querySelector('.jc-code-preview-fallback');

        let candidateIndex = 0;
        this._currentReqId = (this._currentReqId || 0) + 1;
        const reqId = this._currentReqId;

        const loadVideoBlob = (url) => {
            return new Promise((resolve, reject) => {
                if (typeof GM_xmlhttpRequest !== 'function') {
                    resolve(url);
                    return;
                }
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    responseType: 'blob',
                    headers: {
                        'Referer': 'https://missav.ai/'
                    },
                    timeout: 8000,
                    onload: (res) => {
                        if (res.status === 200 && res.response) {
                            try {
                                resolve(URL.createObjectURL(res.response));
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error(`HTTP_${res.status}`));
                        }
                    },
                    onerror: () => reject(new Error('NETWORK_ERROR')),
                    ontimeout: () => reject(new Error('TIMEOUT'))
                });
            });
        };

        const tryNextCandidate = async () => {
            if (reqId !== this._currentReqId) return;

            if (candidateIndex >= candidates.length) {
                if (loadingEl) loadingEl.classList.toggle('is-hidden', true);
                if (videoEl) videoEl.classList.toggle('is-hidden', true);
                if (fallbackEl) fallbackEl.classList.toggle('is-hidden', false);
                return;
            }

            const currentSrc = candidates[candidateIndex++];
            try {
                const playUrl = await loadVideoBlob(currentSrc);
                if (reqId !== this._currentReqId) {
                    if (playUrl.startsWith('blob:')) URL.revokeObjectURL(playUrl);
                    return;
                }
                if (this._currentBlobUrl && this._currentBlobUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(this._currentBlobUrl);
                }
                this._currentBlobUrl = playUrl;

                videoEl.src = playUrl;
                videoEl.load();
            } catch (_) {
                tryNextCandidate();
            }
        };

        videoEl.oncanplay = () => {
            if (reqId !== this._currentReqId) return;
            if (loadingEl) loadingEl.classList.toggle('is-hidden', true);
            if (fallbackEl) fallbackEl.classList.toggle('is-hidden', true);
            videoEl.classList.toggle('is-hidden', false);
            videoEl.play().catch(() => {});
        };

        videoEl.onerror = () => {
            tryNextCandidate();
        };

        tryNextCandidate();
    }

    cancelLeave() {
        if (this._leaveTimer) {
            clearTimeout(this._leaveTimer);
            this._leaveTimer = null;
        }
    }

    scheduleLeave(delay = 250) {
        this.cancelLeave();
        this._leaveTimer = setTimeout(() => {
            this.hide();
        }, delay);
    }

    hide() {
        if (this._leaveTimer) {
            clearTimeout(this._leaveTimer);
            this._leaveTimer = null;
        }
        this._currentReqId = (this._currentReqId || 0) + 1;
        if (this._currentBlobUrl && this._currentBlobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this._currentBlobUrl);
            this._currentBlobUrl = null;
        }
        if (this._popover) {
            this._popover.classList.remove('active');
            const videoEl = this._popover.querySelector('video');
            if (videoEl) {
                videoEl.pause();
                videoEl.removeAttribute('src');
                videoEl.load();
            }
        }
    }

    cleanup() {
        this.hide();
        if (this._onDocumentClick) {
            document.removeEventListener('pointerdown', this._onDocumentClick, true);
            this._onDocumentClick = null;
        }
        if (this._popover && this._popover.parentNode) {
            this._popover.parentNode.removeChild(this._popover);
        }
        this._popover = null;
    }
}
