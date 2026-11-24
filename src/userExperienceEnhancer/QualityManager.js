/**
 * 视频画质管理类
 * 负责在页面空闲或播放器就绪时自动切换至最高可用画质（支持 Plyr 与 HLS.js 多清晰度流）
 */
import { getValue } from '../utils/storage.js';

export class QualityManager {
    constructor() {
        this.maxAttempts = 8;        // 最大尝试次数
        this.attemptInterval = 1000; // 尝试间隔时间(ms)
    }

    /**
     * 获取当前是否开启自动最高画质
     * @returns {boolean}
     */
    isAutoQualityEnabled() {
        const val = getValue('autoHighestQuality', true);
        return val !== false && val !== 'false';
    }

    /**
     * 自动设置最高画质 (延迟至空闲状态执行，避免主线程关键渲染阻塞)
     */
    setupAutoHighestQuality() {
        if (!this.isAutoQualityEnabled()) {
            return;
        }

        const executeQualitySetup = () => {
            if (!this.isAutoQualityEnabled()) return;
            if (this.setHighestQualitySingle()) {
                return;
            }

            let attempts = 0;
            const checkInterval = setInterval(() => {
                if (!this.isAutoQualityEnabled() || this.setHighestQualitySingle() || ++attempts >= this.maxAttempts) {
                    clearInterval(checkInterval);
                }
            }, this.attemptInterval);
        };

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(executeQualitySetup, { timeout: 4000 });
        } else {
            setTimeout(executeQualitySetup, 1500);
        }
    }

    /**
     * 立即执行一次最高画质切换（供设置开关开启时主动调用）
     * @returns {boolean}
     */
    applyNow() {
        return this.setHighestQualitySingle({ allowInTheater: true });
    }

    /**
     * 收集页面可用的 Hls.js 实例（兼容 window.hls / player.hls / hlsjs-video）
     * @param {any} win
     * @param {any} player
     * @returns {any[]}
     */
    _collectHlsInstances(win, player) {
        const candidates = [
            win?.hls,
            typeof window !== 'undefined' ? window.hls : null,
            player?.hls
        ];

        if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
            try {
                document.querySelectorAll('hlsjs-video, video').forEach((el) => {
                    if (el && el.hls) candidates.push(el.hls);
                });
            } catch (_) {}
        }

        const unique = [];
        for (const inst of candidates) {
            if (inst && Array.isArray(inst.levels) && inst.levels.length > 1 && !unique.includes(inst)) {
                unique.push(inst);
            }
        }
        return unique;
    }

    /**
     * 将 Hls.js 实例切换至最高分辨率/码率流
     * @param {any} hls
     * @param {{ isTheaterActive?: boolean }} [opts]
     * @returns {boolean}
     */
    _upgradeHlsLevel(hls, { isTheaterActive = false } = {}) {
        const levels = hls?.levels;
        if (!Array.isArray(levels) || levels.length <= 1) return false;

        let bestIdx = 0;
        let bestScore = -1;
        for (let i = 0; i < levels.length; i++) {
            const lvl = levels[i] || {};
            const height = Number(lvl.height) || 0;
            const width = Number(lvl.width) || 0;
            const bitrate = Number(lvl.bitrate) || 0;
            const score = height * 1e9 + width * 1e5 + bitrate;
            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }

        if (hls.autoLevelCapping !== undefined && hls.autoLevelCapping !== -1) {
            hls.autoLevelCapping = -1;
        }
        if (hls.nextLevel !== bestIdx) {
            hls.nextLevel = bestIdx;
        }

        // 影院播放期仅更新 nextLevel 无缝升频；未进入影院或处于暂停态时可立即切换 currentLevel
        const mediaPaused = Boolean(hls.media?.paused);
        if (!isTheaterActive || mediaPaused) {
            if (hls.loadLevel !== undefined && hls.loadLevel !== bestIdx) {
                hls.loadLevel = bestIdx;
            }
            if (hls.currentLevel !== bestIdx) {
                hls.currentLevel = bestIdx;
            }
        }
        return true;
    }

    /**
     * 执行单次设置最高画质尝试
     * @param {{ allowInTheater?: boolean }} [options]
     * @returns {boolean} 是否成功设置
     */
    setHighestQualitySingle(options = {}) {
        const { allowInTheater = false } = options || {};
        try {
            const isTheaterActive = typeof document !== 'undefined' && Boolean(document.body?.classList?.contains('tm-player-active'));

            // 若 Miss Player 影院模式已接管播放且非显式调用，避免后台延迟轮询重装载流并重置播放进度
            if (isTheaterActive && !allowInTheater) {
                return true;
            }

            const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : (typeof window !== 'undefined' ? window : null);
            const player = win?.player || (typeof window !== 'undefined' ? window.player : null);

            let upgraded = false;

            // 1. 优先尝试升级 Hls.js levels（支持 MissAV / Jable / 123AV / 网关承接页等）
            const hlsList = this._collectHlsInstances(win, player);
            for (const hls of hlsList) {
                if (this._upgradeHlsLevel(hls, { isTheaterActive })) {
                    upgraded = true;
                }
            }

            // 2. 兼顾 Plyr 原生 quality 控制器（仅在非影院激活态调用，防止 Plyr setter 重载流重置进度）
            if (!isTheaterActive && player && player.config && player.config.quality && Array.isArray(player.config.quality.options) && player.config.quality.options.length > 0) {
                const rawOptions = player.config.quality.options;
                const numericOptions = rawOptions.map((o) => Number(o)).filter((n) => Number.isFinite(n));
                const maxQuality = numericOptions.length > 0 ? Math.max(...numericOptions) : rawOptions[0];
                const currentQuality = typeof player.quality === 'number'
                    ? player.quality
                    : player.config.quality.selected;

                if (currentQuality !== maxQuality) {
                    player.quality = maxQuality;
                    player.config.quality.selected = maxQuality;
                    if (typeof player.quality === 'function') {
                        player.quality(maxQuality);
                    }
                }
                upgraded = true;
            }

            return upgraded;
        } catch (error) {
            console.error('[QualityManager] 设置最高画质时出错:', error);
            return false;
        }
    }
}
