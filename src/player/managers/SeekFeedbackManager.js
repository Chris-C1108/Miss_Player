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
            const video = this._resolveTarget(event?.target) || this._boundVideo;
            if (!video) return;
            this._from = Number(video.currentTime) || 0;
            this._activeVideo = video;
        };
        this._onSeeked = (event) => {
            const video = this._resolveTarget(event?.target) || this._boundVideo;
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
     * 双通道绑定（缺一不可）：
     * 1) 直接绑定播放器 video —— 播放器运行在 Shadow DOM 内，原生媒体事件
     *    （seeking / seeked / timeupdate）非 composed，永远不会冒泡到 document，
     *    只有直接绑在元素上才可靠；
     * 2) document 捕获阶段兜底 —— 覆盖浅层 DOM 中由宿主直接接管的视频；
     * 3) 视频元素可能晚于管理器出现，故以重试方式等待接管，避免一次性失聪。
     */
    init() {
        if (this._startedAt) return;
        this._startedAt = Date.now();

        const root = typeof document !== 'undefined' ? document : null;
        if (root) {
            this._boundDocument = root;
            root.addEventListener('seeking', this._onSeeking, true);
            root.addEventListener('seeked', this._onSeeked, true);
        }

        this._attach();
        if (!this._boundVideo && typeof setInterval === 'function') {
            this._retryTimer = setInterval(() => this._attach(), 800);
        }
    }

    /** 等待并绑定真正的播放器视频元素 */
    _attach() {
        const video = this.playerCore?.targetVideo;
        if (!video || video === this._boundVideo) return;
        if (typeof video.addEventListener !== 'function') return;
        this._detachVideo();
        video.addEventListener('seeking', this._onSeeking);
        video.addEventListener('seeked', this._onSeeked);
        this._boundVideo = video;
        if (this._retryTimer) {
            clearInterval(this._retryTimer);
            this._retryTimer = null;
        }
    }

    _detachVideo() {
        if (!this._boundVideo) return;
        this._boundVideo.removeEventListener('seeking', this._onSeeking);
        this._boundVideo.removeEventListener('seeked', this._onSeeked);
        this._boundVideo = null;
    }

    cleanup() {
        this._startedAt = 0;
        if (this._retryTimer) {
            clearInterval(this._retryTimer);
            this._retryTimer = null;
        }
        this._detachVideo();
        if (this._boundDocument) {
            this._boundDocument.removeEventListener('seeking', this._onSeeking, true);
            this._boundDocument.removeEventListener('seeked', this._onSeeked, true);
            this._boundDocument = null;
        }
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
