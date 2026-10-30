import { idbGet, idbSet, STORES } from '../../utils/indexedDB.js';
import { getVideoCodeFromUrl } from '../../utils/videoCode.js';

export const HEATMAP_CONSTANTS = {
    BIN_SECONDS: 5,        // 物理采样精度：每 5 秒为一个独立 bucket
    RENDER_POINTS: 120,    // 渲染降采样分辨率：固定 120 点
    SAVE_INTERVAL_MS: 15000 // 自动节流刷盘周期：15 秒
};

/**
 * 片头偏置平滑衰减因子 (Intro Bias Soft Attenuation)
 * 抑制因默认从 0 秒开播或试看导致的片头非喜好虚假波峰
 */
function getIntroDecayFactor(binIdx, warmupBins) {
    if (binIdx >= warmupBins) return 1.0;
    const t = binIdx / warmupBins;
    // Cubic smoothstep: 3t^2 - 2t^3
    const smoothT = t * t * (3 - 2 * t);
    return 0.32 + (0.68 * smoothT);
}

/**
 * 下采样与平滑算法（保留峰值的局部最大值 + 高斯加权平滑 + 片头偏置衰减）
 * @param {Float32Array|Array<number>} rawBins 物理分桶数据
 * @param {number} targetPoints 目标采样点数
 * @returns {Float32Array} 归一化后的点数组 (0.0 ~ 1.0)
 */
export function resampleAndSmoothBins(rawBins, targetPoints = HEATMAP_CONSTANTS.RENDER_POINTS) {
    if (!rawBins || rawBins.length === 0) {
        return new Float32Array(targetPoints);
    }

    const rawLen = rawBins.length;
    const sampled = new Float32Array(targetPoints);
    const step = rawLen / targetPoints;

    // 片头偏置缓冲区间：最大 60 秒 (12 个桶)，且不超过总片长 5%
    const warmupBins = Math.min(12, Math.max(2, Math.floor(rawLen * 0.05)));

    // 1. 保留短峰的动态下采样 (75% Max + 25% Avg) + 片头防伪峰衰减
    for (let i = 0; i < targetPoints; i++) {
        const start = Math.floor(i * step);
        const end = Math.min(rawLen, Math.floor((i + 1) * step));

        let maxVal = 0;
        let sumVal = 0;
        let count = 0;

        for (let j = start; j < end; j++) {
            const decay = getIntroDecayFactor(j, warmupBins);
            const v = (rawBins[j] || 0) * decay;
            if (v > maxVal) maxVal = v;
            sumVal += v;
            count++;
        }

        if (maxVal <= 0.01) {
            sampled[i] = 0;
        } else {
            sampled[i] = (maxVal * 0.75) + ((sumVal / Math.max(1, count)) * 0.25);
        }
    }

    // 2. 5 点移动高斯平滑滤波
    const smoothed = new Float32Array(targetPoints);
    const kernel = [0.06, 0.24, 0.40, 0.24, 0.06];

    for (let i = 0; i < targetPoints; i++) {
        if (sampled[i] <= 0.01) {
            // 未探索区间保持贴底
            smoothed[i] = 0;
            continue;
        }

        let sum = 0;
        let weightSum = 0;
        for (let k = -2; k <= 2; k++) {
            const idx = i + k;
            if (idx >= 0 && idx < targetPoints) {
                sum += sampled[idx] * kernel[k + 2];
                weightSum += kernel[k + 2];
            }
        }
        smoothed[i] = weightSum > 0 ? (sum / weightSum) : sampled[i];
    }

    // 3. 未探索 vs 反复看（Most Replayed）双轨归一化
    let globalMax = 0;
    for (let i = 0; i < targetPoints; i++) {
        if (smoothed[i] > globalMax) globalMax = smoothed[i];
    }

    const normalized = new Float32Array(targetPoints);
    if (globalMax <= 0.05) {
        return normalized; // 全片未探索或播放时间过短
    }

    for (let i = 0; i < targetPoints; i++) {
        const val = smoothed[i];
        if (val <= 0.05) {
            normalized[i] = 0; // 贴底：未探索
        } else {
            // 已探索：基线浮起 14% + 剩余 86% 反映反复重放峰值
            const ratio = Math.min(1.0, val / globalMax);
            normalized[i] = 0.14 + (ratio * 0.86);
        }
    }

    return normalized;
}

/**
 * 生成平滑的二次贝塞尔曲线 SVG Path
 * @param {Float32Array|Array<number>} points 归一化数组 (0.0 ~ 1.0)
 * @returns {string} SVG Path d 属性字符串
 */
export function generateSvgPath(points) {
    const n = points ? points.length : 0;
    if (n < 2) return '';

    // 坐标系：viewBox 0 0 100 100，0为顶部，100为底部
    // 起点：左下角 (0, 100)
    let d = 'M 0 100 ';

    const coords = [];
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 100;
        const val = points[i];
        // 顶部预留 6% 安全间距
        const y = 100 - (val * 94);
        coords.push({ x, y });
    }

    // 第一个数据点
    d += `L ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)} `;

    // 二次贝塞尔平滑连接
    for (let i = 0; i < n - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        d += `Q ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)} `;
    }

    // 最后一个数据点
    const last = coords[n - 1];
    d += `L ${last.x.toFixed(2)} ${last.y.toFixed(2)} `;

    // 闭合到底部
    d += 'L 100 100 Z';
    return d;
}

/**
 * 观看热度与探索足迹管理器 (HeatmapManager)
 */
export class HeatmapManager {
    constructor(playerCore, controlManager, options = {}) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore?.targetVideo || null;
        this.options = options;

        this.binSeconds = HEATMAP_CONSTANTS.BIN_SECONDS;
        this.bins = null;
        this.duration = 0;
        this.storageKey = null;

        this.isDirty = false;
        this.lastCurrentTime = null;
        this.saveTimer = null;
        this.isEnabled = false;

        this.svgElement = null;
        this.pathElement = null;

        this._bindMethods();
    }

    _bindMethods() {
        this.onTimeUpdate = this.onTimeUpdate.bind(this);
        this.onLoadedMetadata = this.onLoadedMetadata.bind(this);
        this.onPause = this.onPause.bind(this);
        this.onEnded = this.onEnded.bind(this);
        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        this.onBeforeUnload = this.onBeforeUnload.bind(this);
    }

    init() {
        const settings = this.playerCore?.options?.playerState?.settings;
        const isBeta = Boolean(settings?.betaMode && settings?.betaHeatmap);
        this.isEnabled = isBeta;

        this._resolveStorageKey();
        this._buildDom();

        if (this.targetVideo) {
            this.targetVideo.addEventListener('timeupdate', this.onTimeUpdate);
            this.targetVideo.addEventListener('loadedmetadata', this.onLoadedMetadata);
            this.targetVideo.addEventListener('pause', this.onPause);
            this.targetVideo.addEventListener('ended', this.onEnded);

            if (this.targetVideo.duration && !isNaN(this.targetVideo.duration)) {
                this.onLoadedMetadata();
            }
        }

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.onVisibilityChange);
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this.onBeforeUnload);
        }

        // 启动后台定时刷盘 (15 秒节流，无论展示开关是否开启均静默持久化)
        this.saveTimer = setInterval(() => {
            if (this.isDirty) {
                this.saveToDb();
            }
        }, HEATMAP_CONSTANTS.SAVE_INTERVAL_MS);

        this._updateVisibility();
        return this;
    }

    _resolveStorageKey() {
        let code = '';
        try {
            code = getVideoCodeFromUrl() || '';
        } catch (_) {}

        if (!code && typeof window !== 'undefined') {
            code = (window.location.pathname || '').split('/').filter(Boolean).pop() || 'UNKNOWN';
        }
        this.storageKey = `HEATMAP_${(code || 'GLOBAL').toUpperCase()}`;
    }

    _buildDom() {
        if (typeof document === 'undefined') return;
        const container = this.controlManager?.progressBarContainer;
        if (!container) return;

        // 如果已存在则不重复创建
        if (this.svgElement && this.svgElement.parentNode) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tm-heatmap-svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'tm-heatmap-path');
        path.setAttribute('d', '');
        svg.appendChild(path);

        this.svgElement = svg;
        this.pathElement = path;

        // 插入在 progressBarContainer 的起始位置（位于进度条下方，背景上方）
        container.insertBefore(svg, container.firstChild);
    }

    async onLoadedMetadata() {
        if (!this.targetVideo) return;
        const dur = this.targetVideo.duration;
        if (!dur || isNaN(dur) || dur <= 0) return;

        this.duration = dur;
        const totalBins = Math.max(1, Math.ceil(dur / this.binSeconds));

        // 仅在首次分配或视频时长变动过大时新建数组
        if (!this.bins || Math.abs(this.bins.length - totalBins) > 2) {
            this.bins = new Float32Array(totalBins);
        }

        // 尝试从 IndexedDB 异步恢复历史热度
        try {
            const savedData = await idbGet(STORES.HEATMAP, this.storageKey);
            if (savedData && Array.isArray(savedData.bins)) {
                const len = Math.min(this.bins.length, savedData.bins.length);
                for (let i = 0; i < len; i++) {
                    this.bins[i] = savedData.bins[i] || 0;
                }
            }
        } catch (_) {}

        this.renderSvg();
    }

    onTimeUpdate() {
        // 无论展示开关是否开启，均在后台静默记录用户播放频率
        if (!this.bins || !this.targetVideo) return;
        if (this.targetVideo.paused || this.targetVideo.seeking) {
            this.lastCurrentTime = null;
            return;
        }

        const ct = this.targetVideo.currentTime;
        if (this.lastCurrentTime === null) {
            this.lastCurrentTime = ct;
            return;
        }

        const delta = ct - this.lastCurrentTime;
        this.lastCurrentTime = ct;

        // 排除快进/快退/大幅度拖动（仅统计正常连播流逝）
        if (delta > 0 && delta < 1.5) {
            const idx = Math.floor(ct / this.binSeconds);
            if (idx >= 0 && idx < this.bins.length) {
                this.bins[idx] += delta;
                this.isDirty = true;
            }
        }
    }

    onPause() {
        if (this.isDirty) {
            this.saveToDb();
        }
        if (this.isEnabled) {
            this.renderSvg();
        }
    }

    onEnded() {
        if (this.isDirty) {
            this.saveToDb();
        }
        if (this.isEnabled) {
            this.renderSvg();
        }
    }

    onVisibilityChange() {
        if (document.hidden && this.isDirty) {
            this.saveToDb();
        }
    }

    onBeforeUnload() {
        if (this.isDirty) {
            this.saveToDb();
        }
    }

    async saveToDb() {
        if (!this.storageKey || !this.bins) return;
        this.isDirty = false;
        try {
            const payload = {
                duration: this.duration,
                binSeconds: this.binSeconds,
                bins: Array.from(this.bins),
                updatedAt: Date.now()
            };
            await idbSet(STORES.HEATMAP, this.storageKey, payload);
        } catch (err) {
            console.warn('[HeatmapManager] 存储热度失败:', err?.message);
        }
    }

    renderSvg() {
        if (!this.isEnabled || !this.pathElement || !this.bins) return;
        try {
            const normalized = resampleAndSmoothBins(this.bins, HEATMAP_CONSTANTS.RENDER_POINTS);
            const pathD = generateSvgPath(normalized);
            this.pathElement.setAttribute('d', pathD);
        } catch (_) {}
    }

    setEnabled(enabled) {
        this.isEnabled = Boolean(enabled);
        this._updateVisibility();
        if (this.isEnabled) {
            if (!this.bins && this.targetVideo?.duration) {
                this.onLoadedMetadata();
            } else {
                this.renderSvg();
            }
        }
    }

    _updateVisibility() {
        if (!this.svgElement) return;
        this.svgElement.style.display = this.isEnabled ? 'block' : 'none';
    }

    destroy() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }

        if (this.isDirty) {
            this.saveToDb();
        }

        if (this.targetVideo) {
            this.targetVideo.removeEventListener('timeupdate', this.onTimeUpdate);
            this.targetVideo.removeEventListener('loadedmetadata', this.onLoadedMetadata);
            this.targetVideo.removeEventListener('pause', this.onPause);
            this.targetVideo.removeEventListener('ended', this.onEnded);
        }

        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.onVisibilityChange);
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this.onBeforeUnload);
        }

        if (this.svgElement && this.svgElement.parentNode) {
            this.svgElement.parentNode.removeChild(this.svgElement);
        }
    }

    cleanup() {
        this.destroy();
    }
}
