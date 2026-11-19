/**
 * SeekFeedbackManager — 全局跳转反馈统一出口
 *
 * 设计原则（写入 AGENTS.md 规范）：
 * 跳转反馈属于「视频元素级事件」，不属于调用点级逻辑。任何来源的跳转
 * （进度条拖动、快进快退、高光胶囊、字幕行、快捷键、深链还原）都在
 * `seeked` 事件上被统一感知并播报，禁止在各跳转点位零散调用 Toast。
 */

import { formatTime } from '../../utils/time.js';
import { Toast } from '../../utils/index.js';
import { __ } from '../../constants/i18n.js';

const MIN_DELTA_SECONDS = 3;      // 小于 3 秒视为微调，不打扰
const DEDUPE_MS = 700;            // 连续跳转合并播报
const WARMUP_MS = 2000;           // 开场还原断点不播报

export class SeekFeedbackManager {
    /**
     * @param {import('../core/PlayerCore.js').PlayerCore} playerCore
     * @param {import('./ControlManager.js').ControlManager} controlManager
     * @param {import('./ProgressManager.js').ProgressManager} progressManager
     */
    constructor(playerCore, controlManager = null, progressManager = null) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.progressManager = progressManager;

        this._from = 0;
        this._startedAt = 0;
        this._lastAnnouncedAt = 0;

        this._onSeeking = () => {
            this._from = Number(this.targetVideo?.currentTime) || 0;
        };
        this._onSeeked = () => this._announce();
    }

    get targetVideo() {
        return this.playerCore?.targetVideo || null;
    }

    init() {
        const video = this.targetVideo;
        if (!video) return;
        this._startedAt = Date.now();
        video.addEventListener('seeking', this._onSeeking);
        video.addEventListener('seeked', this._onSeeked);
    }

    cleanup() {
        const video = this.targetVideo;
        if (!video) return;
        video.removeEventListener('seeking', this._onSeeking);
        video.removeEventListener('seeked', this._onSeeked);
    }

    _announce() {
        const video = this.targetVideo;
        if (!video) return;
        const to = Number(video.currentTime) || 0;
        const delta = Math.abs(to - this._from);

        if (Date.now() - this._startedAt < WARMUP_MS) return;
        if (delta < MIN_DELTA_SECONDS) return;
        // 拖动进度条由进度条自身反馈；片段循环为自动装填，不打扰
        if (this.progressManager?.isDraggingProgress) return;
        if (this.controlManager?.loopManager?._isSeekingCapsule) return;

        const now = Date.now();
        if (now - this._lastAnnouncedAt < DEDUPE_MS) return;
        this._lastAnnouncedAt = now;

        this.controlManager?.showJumpHint?.(to);
        Toast(`${__('jumpedTo') || '已跳转至'} ${formatTime(to)}`, 1200, 'info');
    }
}
