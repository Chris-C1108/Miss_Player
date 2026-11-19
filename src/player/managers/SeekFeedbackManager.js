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

const MIN_DELTA_SECONDS = 1;      // 小于 1 秒视为微调，不打扰
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

        this._onSeeking = (event) => {
            const video = this._resolveTarget(event?.target);
            if (!video) return;
            this._from = Number(video.currentTime) || 0;
            this._activeVideo = video;
        };
        this._onSeeked = (event) => {
            const video = this._resolveTarget(event?.target);
            if (!video) return;
            this._activeVideo = video;
            this._announce(video);
        };
    }

    /**
     * 事件目标校验：捕获阶段收到的 seeked 必须来自播放器视频。
     * 播放器尚未接管视频时（targetVideo 为空）允许先认领事件目标，
     * 避免因绑定时视频元素缺失而永久失聪。
     */
    _resolveTarget(el) {
        if (!el || el.tagName !== 'VIDEO') return null;
        const owned = this.playerCore?.targetVideo;
        if (!owned) {
            if (this._claimedVideo && this._claimedVideo !== el) return null;
            this._claimedVideo = el;
            return el;
        }
        return owned === el ? el : null;
    }

    get targetVideo() {
        return this.playerCore?.targetVideo || null;
    }

    /**
     * 绑定在 document 捕获阶段：媒体事件不冒泡，但捕获阶段会流经祖先，
     * 因此无论视频元素何时被播放器接管都能稳定收到，杜绝「绑定时还没有 video」的失聪。
     */
    init() {
        if (this._bound) return;
        this._bound = true;
        this._startedAt = Date.now();
        const root = typeof document !== 'undefined' ? document : null;
        if (!root) return;
        root.addEventListener('seeking', this._onSeeking, true);
        root.addEventListener('seeked', this._onSeeked, true);
    }

    cleanup() {
        if (!this._bound) return;
        this._bound = false;
        const root = typeof document !== 'undefined' ? document : null;
        if (!root) return;
        root.removeEventListener('seeking', this._onSeeking, true);
        root.removeEventListener('seeked', this._onSeeked, true);
    }

    _announce(eventVideo) {
        const video = eventVideo || this._activeVideo || this.targetVideo;
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

        try {
            this.controlManager?.showJumpHint?.(to);
        } catch (_) { /* 指示器失败不影响播报 */ }
        if (typeof Toast === 'function') {
            Toast(`${__('jumpedTo') || '已跳转至'} ${formatTime(to)}`, 1200, 'info');
        }
    }
}
