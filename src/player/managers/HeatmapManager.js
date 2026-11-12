import { idbGet, idbSet, STORES } from '../../utils/indexedDB.js';
import { getVideoCodeFromUrl, matchAvCodeFromText } from '../../utils/videoCode.js';
import { WebDavClient } from '../../sync/WebDavClient.js';
import { SyncManager } from '../../sync/SyncManager.js';
import { SupabaseService } from '../../services/SupabaseService.js';
import {
    quantizeBinsTo120,
    expand120ToBins,
    calculateWatermarkDelta,
    uint8ArrayToBase64,
    base64ToUint8Array,
    CODEC_CONSTANTS
} from '../../utils/heatmapCodec.js';

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
 * 具备双轨机制：
 * 1. 本地私有足迹轨：Local-First (IndexedDB) + WebDAV 独立文件漫游，打通 Peach 与全站点；
 * 2. 社区全网高能轨 (Beta Opt-in)：120 分位定长字节量化 + 水位线增量差分防膨胀上报。
 */
export class HeatmapManager {
    constructor(playerCore, controlManager, options = {}) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore?.targetVideo || null;
        this.options = options;

        this.binSeconds = HEATMAP_CONSTANTS.BIN_SECONDS;
        this.bins = null;
        this.watermarkBins = null; // 上次已上报或同步的水位线快照
        this.crowd120 = null;       // 社区 120 槽位 Uint8Array
        this.duration = 0;
        this.avcode = '';
        this.storageKey = null;

        this.isLocalDirty = false;
        this.isCloudDirty = false;
        this.lastCurrentTime = null;
        this.saveTimer = null;
        this.isEnabled = false;
        this.isCrowdEnabled = false;
        this.isPrivateDataHidden = false;

        this.svgElement = null;
        this.pathElement = null;
        this.pathCrowdElement = null;

        this.isSyncingWebDav = false;
        this.lastWebDavSyncTime = 0;

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

    get isDirty() {
        return this.isLocalDirty || this.isCloudDirty;
    }

    set isDirty(val) {
        this.isLocalDirty = Boolean(val);
        this.isCloudDirty = Boolean(val);
    }

    init() {
        const playerState = this.playerCore?.options?.playerState;
        const settings = playerState?.settings;
        this.isEnabled = Boolean(settings?.betaMode && settings?.betaHeatmap);
        this.isCrowdEnabled = Boolean(typeof playerState?.isSharedMode === 'function' 
            ? playerState.isSharedMode() 
            : (settings?.betaMode && settings?.dataMode === 'shared'));
        this.isPrivateDataHidden = Boolean(settings?.hidePrivateData);

        this._resolveStorageKey();
        this._buildDom();

        if (this.targetVideo) {
            this.targetVideo.addEventListener('timeupdate', this.onTimeUpdate);
            this.targetVideo.addEventListener('loadedmetadata', this.onLoadedMetadata);
            this.targetVideo.addEventListener('durationchange', this.onLoadedMetadata);
            this.targetVideo.addEventListener('canplay', this.onLoadedMetadata);
            this.targetVideo.addEventListener('pause', this.onPause);
            this.targetVideo.addEventListener('ended', this.onEnded);

            if (this.targetVideo.duration && !isNaN(this.targetVideo.duration) && this.targetVideo.duration > 0) {
                this.onLoadedMetadata();
            }
        }

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.onVisibilityChange);
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this.onBeforeUnload);
        }

        // 启动后台定时刷盘 (15 秒节流，仅写本地 IndexedDB，避免频繁打满 WebDAV)
        this.saveTimer = setInterval(() => {
            if (this.isLocalDirty) {
                this.saveToDb(false);
            }
            // 兜底长效云端同步：持续播放期间若累积了未上云增量且距上次同步超过 60 秒，平滑自动上传 WebDAV 与社区
            if (this.isCloudDirty && (Date.now() - this.lastWebDavSyncTime >= 60000)) {
                this.saveToDb(true);
            }
        }, HEATMAP_CONSTANTS.SAVE_INTERVAL_MS);

        this._updateVisibility();
        return this;
    }

    _resolveStorageKey() {
        let code = '';
        // 1. 优先读取上层播放器或评论面板已规整解析的权威番号
        if (this.playerCore?.options?.videoCode) {
            code = this.playerCore.options.videoCode;
        } else if (this.controlManager?.commentPanel?.videoCode) {
            code = this.controlManager.commentPanel.videoCode;
        }

        // 2. 尝试从目标视频 DOM 元素提取
        if (!code && this.targetVideo) {
            try {
                if (typeof this.targetVideo.getAttribute === 'function') {
                    code = getVideoCodeFromUrl(this.targetVideo) || '';
                }
            } catch (_) {}
        }

        // 3. 尝试从全局 URL 提取
        if (!code) {
            try {
                code = getVideoCodeFromUrl() || '';
            } catch (_) {}
        }

        // 4. Peach 站点或 SPA 模态舞台智能感知探测
        if (!code && typeof window !== 'undefined') {
            try {
                const peachNode = document.querySelector('[data-stage-side], [data-item-detail], dialog#stage, [data-stage-host]');
                if (peachNode && peachNode.textContent) {
                    const matched = matchAvCodeFromText(peachNode.textContent);
                    if (matched) code = matched;
                }
            } catch (_) {}

            if (!code) {
                code = (window.location.pathname || '').split('/').filter(Boolean).pop() || 'UNKNOWN';
            }
        }
        this.avcode = (code || 'GLOBAL').toUpperCase();
        this.storageKey = `HEATMAP_${this.avcode}`;
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

        // 1. 底层：社区全网高能波形 (Apple 珊瑚金)
        const crowdPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crowdPath.setAttribute('class', 'tm-heatmap-crowd-path');
        crowdPath.setAttribute('d', '');
        if (!this.isCrowdEnabled) {
            crowdPath.style.display = 'none';
        }
        svg.appendChild(crowdPath);

        // 2. 顶层：个人探索足迹波形 (Apple 极光蓝/纯平浅灰)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'tm-heatmap-path');
        path.setAttribute('d', '');
        if (this.isPrivateDataHidden) {
            path.style.display = 'none';
        }
        svg.appendChild(path);

        this.svgElement = svg;
        this.pathElement = path;
        this.pathCrowdElement = crowdPath;

        // 插入在 progressBarContainer 的起始位置（位于进度条下方，背景上方）
        container.insertBefore(svg, container.firstChild);
    }

    async onLoadedMetadata() {
        if (!this.targetVideo) return;
        const dur = this.targetVideo.duration;
        if (!dur || isNaN(dur) || dur <= 0) return;

        this.duration = dur;
        const totalBins = Math.max(1, Math.ceil(dur / this.binSeconds));

        // 若之前未能准确识别番号，元数据就绪后再次校准
        if (!this.avcode || this.avcode === 'GLOBAL' || this.avcode === 'UNKNOWN') {
            this._resolveStorageKey();
        }

        // 仅在首次分配或视频时长变动过大时新建数组
        if (!this.bins || Math.abs(this.bins.length - totalBins) > 2) {
            this.bins = new Float32Array(totalBins);
        }

        // 1. 本地优先：从 IndexedDB 0ms 极速恢复
        try {
            const savedData = await idbGet(STORES.HEATMAP, this.storageKey);
            if (savedData && Array.isArray(savedData.bins)) {
                const len = Math.min(this.bins.length, savedData.bins.length);
                for (let i = 0; i < len; i++) {
                    this.bins[i] = savedData.bins[i] || 0;
                }
            }
        } catch (_) {}

        // 建立水位线基准快照 (用于防重复上报的增量差分计算)
        this.watermarkBins = new Float32Array(this.bins);

        // 渲染本地足迹波形
        this.renderSvg();

        // 2. 异步漫游：从 WebDAV 读取私有足迹并双向融合
        this._syncFromWebDav();

        // 3. 社区高能：异步拉取 120 槽位全网高能数据
        if (this.isCrowdEnabled) {
            this._loadCrowdHeatmap();
        }
    }

    /**
     * 异步从 WebDAV 独立文件恢复私有足迹并执行双向 Element-wise Max 互愈漫游
     */
    async _syncFromWebDav() {
        if (this.isSyncingWebDav || !this.avcode || this.avcode === 'GLOBAL' || this.avcode === 'UNKNOWN') return;
        if (!this.bins || this.bins.length === 0) return;

        try {
            const config = SyncManager.getWebDavConfig();
            if (!WebDavClient.hasValidEndpoint(config)) return;

            this.isSyncingWebDav = true;
            const subPath = `heatmaps/${this.avcode}.json`;
            const remoteData = await WebDavClient.downloadFile(config, subPath);

            if (remoteData && Array.isArray(remoteData.bins) && remoteData.bins.length > 0) {
                let localUpdated = false;
                let needUploadBack = false;
                const len = Math.min(this.bins.length, remoteData.bins.length);

                for (let i = 0; i < len; i++) {
                    const rv = remoteData.bins[i] || 0;
                    if (rv > this.bins[i]) {
                        this.bins[i] = rv;
                        localUpdated = true;
                    } else if (this.bins[i] > rv) {
                        needUploadBack = true;
                    }
                }

                // 若本地数组较远程更长，多出来的分段若有有效播放，也需回写补全云端
                if (this.bins.length > remoteData.bins.length) {
                    for (let i = remoteData.bins.length; i < this.bins.length; i++) {
                        if (this.bins[i] > 0) {
                            needUploadBack = true;
                            break;
                        }
                    }
                }

                if (localUpdated) {
                    // 同步抬高水位线基准
                    if (this.watermarkBins) {
                        for (let i = 0; i < Math.min(this.watermarkBins.length, this.bins.length); i++) {
                            if (this.bins[i] > this.watermarkBins[i]) {
                                this.watermarkBins[i] = this.bins[i];
                            }
                        }
                    }
                    this.renderSvg();
                    // 异步更新本地 IndexedDB
                    await this.saveToDb(false);
                    window.DebugLogPanel?.addLog?.(`[Heatmap] 已从 WebDAV 合并云端足迹: ${this.avcode}`, 'success');
                }

                // 🌟 双向自愈：若本地包含远程未收录的历史波峰，立即回写补全云端 WebDAV！
                if (needUploadBack) {
                    this._uploadToWebDav();
                }
            } else {
                // 🌟 冷启动自愈：云端尚无副本 (404/空)，若本地已存在有效足迹，立即上云初始化！
                if (this._hasValidFootprint(this.bins)) {
                    this._uploadToWebDav();
                }
            }
        } catch (_) {
            // 静默容错
        } finally {
            this.isSyncingWebDav = false;
        }
    }

    /**
     * 判断当前 bins 是否包含有效播放足迹 (> 2 秒有效累积)
     */
    _hasValidFootprint(bins) {
        if (!bins || bins.length === 0) return false;
        let sum = 0;
        for (let i = 0; i < bins.length; i++) {
            if (bins[i] > 0) {
                sum += bins[i];
                if (sum > 2) return true;
            }
        }
        return false;
    }

    /**
     * 异步拉取云端社区全网高能热度图
     */
    async _loadCrowdHeatmap() {
        if (!this.isCrowdEnabled || !this.avcode || this.avcode === 'GLOBAL' || this.avcode === 'UNKNOWN') return;
        try {
            const crowdData = await SupabaseService.fetchCrowdHeatmap(this.avcode);
            if (crowdData && crowdData.heatmapBase64) {
                const uint8Arr = base64ToUint8Array(crowdData.heatmapBase64);
                if (uint8Arr && uint8Arr.length === CODEC_CONSTANTS.QUANTIZE_SLOTS) {
                    this.crowd120 = uint8Arr;
                    this.renderCrowdSvg();
                }
            }
        } catch (_) {}
    }

    onTimeUpdate() {
        if (!this.targetVideo) return;
        // 自动自愈：若元数据未在早期就绪，第一帧流逝时立即补全 bins
        if ((!this.bins || this.bins.length === 0) && this.targetVideo.duration > 0) {
            this.onLoadedMetadata();
        }
        if (!this.bins) return;

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
                this.isLocalDirty = true;
                this.isCloudDirty = true;
            }
        }
    }

    onPause() {
        if (this.isCloudDirty || this.isLocalDirty) {
            this.saveToDb(true);
        }
        if (this.isEnabled) {
            this.renderSvg();
        }
    }

    onEnded() {
        if (this.isCloudDirty || this.isLocalDirty) {
            this.saveToDb(true);
        }
        if (this.isEnabled) {
            this.renderSvg();
        }
    }

    onVisibilityChange() {
        if (document.hidden && (this.isCloudDirty || this.isLocalDirty)) {
            this.saveToDb(true);
        }
    }

    onBeforeUnload() {
        if (this.isCloudDirty || this.isLocalDirty) {
            this.saveToDb(true);
        }
    }

    /**
     * 持久化足迹至数据库
     * @param {boolean} [syncToCloud=false] 是否在离散重要时机触发 WebDAV 与社区高能增量同步
     */
    async saveToDb(syncToCloud = false) {
        if (!this.storageKey || !this.bins) return;
        this.isLocalDirty = false;

        const payload = {
            avcode: this.avcode,
            duration: this.duration,
            binSeconds: this.binSeconds,
            bins: Array.from(this.bins),
            updatedAt: Date.now()
        };

        // 立即触发 WebDAV 上传与社区增量上报 (不被本地 IndexedDB 异步排队阻滞)
        if (syncToCloud) {
            // 1. 私有云盘：只要配置了 WebDAV，无论处于哪种数据模式，始终同步写入权威备份 (数据写 2 份)
            this._uploadToWebDav(payload);
            // 2. 社区云端：仅在开启社区共享模式时上报 120 字节纯增量 (本地私有模式彻底物理阻断)
            if (this.isCrowdEnabled) {
                this._reportCrowdDelta();
            }
        }

        try {
            await idbSet(STORES.HEATMAP, this.storageKey, payload);
        } catch (err) {
            console.warn('[HeatmapManager] 存储热度失败:', err?.message);
        }
    }

    /**
     * 异步上传私有足迹至 WebDAV 独立文件
     */
    async _uploadToWebDav(payload = null) {
        if (!this.avcode || this.avcode === 'GLOBAL' || this.avcode === 'UNKNOWN') return;
        if (!payload && (!this.storageKey || !this.bins)) return;

        const now = Date.now();
        if (now - this.lastWebDavSyncTime < 5000) return; // 5秒内防并发重叠 PUT
        this.lastWebDavSyncTime = now;

        try {
            const config = SyncManager.getWebDavConfig();
            if (!WebDavClient.hasValidEndpoint(config)) return;

            const subPath = `heatmaps/${this.avcode}.json`;
            const dataToUpload = payload || {
                avcode: this.avcode,
                duration: this.duration,
                binSeconds: this.binSeconds,
                bins: Array.from(this.bins),
                updatedAt: Date.now()
            };

            const res = await WebDavClient.uploadFile(config, subPath, dataToUpload, 'application/json; charset=utf-8');
            if (res && (res.status === 200 || res.status === 201 || res.status === 204)) {
                this.isCloudDirty = false;
                window.DebugLogPanel?.addLog?.(`[Heatmap] 已向 WebDAV 漫游上传足迹: ${this.avcode}`, 'success');
            }
        } catch (err) {
            console.warn('[HeatmapManager] WebDAV 上传异常:', err?.message);
        }
    }

    /**
     * 社区全网高能增量差分上报 (带水位线防重复累计)
     */
    async _reportCrowdDelta() {
        if (!this.isCrowdEnabled || !this.avcode || this.avcode === 'GLOBAL' || this.avcode === 'UNKNOWN') return;
        if (!this.bins || !this.watermarkBins) return;

        const { deltaBins, totalDeltaSeconds } = calculateWatermarkDelta(this.bins, this.watermarkBins);
        if (totalDeltaSeconds < CODEC_CONSTANTS.MIN_ENGAGEMENT_SECONDS) {
            return; // 增量未达 45 秒有效门槛，不上报
        }

        const delta120 = quantizeBinsTo120(deltaBins);
        const deltaB64 = uint8ArrayToBase64(delta120);
        if (!deltaB64) return;

        try {
            const success = await SupabaseService.reportCrowdHeatmapDelta(this.avcode, deltaB64, this.duration);
            if (success) {
                // 成功上报后立即推进水位线
                this.watermarkBins = new Float32Array(this.bins);
            }
        } catch (_) {}
    }

    renderSvg() {
        if (!this.isEnabled || !this.pathElement || !this.bins) return;
        if (this.isPrivateDataHidden) {
            this.pathElement.style.display = 'none';
            return;
        }
        this.pathElement.style.display = '';
        try {
            const normalized = resampleAndSmoothBins(this.bins, HEATMAP_CONSTANTS.RENDER_POINTS);
            const pathD = generateSvgPath(normalized);
            this.pathElement.setAttribute('d', pathD);
        } catch (_) {}
    }

    renderCrowdSvg() {
        if (!this.pathCrowdElement) return;
        if (!this.isCrowdEnabled || !this.crowd120) {
            this.pathCrowdElement.style.display = 'none';
            return;
        }
        try {
            this.pathCrowdElement.style.display = '';
            const targetPoints = HEATMAP_CONSTANTS.RENDER_POINTS;
            const expanded = expand120ToBins(this.crowd120, targetPoints);
            const pathD = generateSvgPath(expanded);
            this.pathCrowdElement.setAttribute('d', pathD);
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

    setCrowdEnabled(enabled) {
        this.isCrowdEnabled = Boolean(enabled);
        if (this.isCrowdEnabled) {
            if (this.crowd120) {
                this.renderCrowdSvg();
            } else if (this.avcode) {
                this._loadCrowdHeatmap();
            }
        } else {
            if (this.pathCrowdElement) {
                this.pathCrowdElement.style.display = 'none';
            }
        }
    }

    setPrivateDataHidden(hidden) {
        this.isPrivateDataHidden = Boolean(hidden);
        if (this.pathElement) {
            if (this.isPrivateDataHidden) {
                this.pathElement.style.display = 'none';
            } else {
                this.pathElement.style.display = '';
                this.renderSvg();
            }
        }
    }

    _updateVisibility() {
        if (!this.svgElement) return;
        this.svgElement.style.display = (this.isEnabled || this.isCrowdEnabled) ? 'block' : 'none';
    }

    destroy() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }

        if (this.isCloudDirty || this.isLocalDirty) {
            this.saveToDb(true);
        }

        if (this.targetVideo && typeof this.targetVideo.removeEventListener === 'function') {
            this.targetVideo.removeEventListener('timeupdate', this.onTimeUpdate);
            this.targetVideo.removeEventListener('loadedmetadata', this.onLoadedMetadata);
            this.targetVideo.removeEventListener('durationchange', this.onLoadedMetadata);
            this.targetVideo.removeEventListener('canplay', this.onLoadedMetadata);
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
