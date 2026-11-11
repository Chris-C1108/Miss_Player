/**
 * 播放热度图 120 分位定长量化与增量差分编解码器 (HeatmapCodec)
 * 
 * 核心设计：
 * 1. 无论片长长短，统一投影至固定 120 个槽位 (Slots 0~119)，消除不同切片源时长微小误差导致的对齐困难；
 * 2. 槽位数据量化为 Uint8 (0~255)，整片数据恒定 120 字节，Base64 仅 160 字符；
 * 3. 内存与网络极度轻量，单百万番号仅占 150MB，同时满足零 GM 大数据红线与 Supabase/WebDAV 免费层级；
 * 4. 客户端提供水位线差分计算 (Watermark Delta Tracking)，从源头杜绝重复播放产生的滚雪球膨胀。
 */

export const CODEC_CONSTANTS = {
    QUANTIZE_SLOTS: 120, // 固定 120 个分位槽
    MIN_ENGAGEMENT_SECONDS: 45 // 社区高能上传最低有效观看时长门槛 (秒)
};

/**
 * 将任意长度的物理分桶数组投影量化为固定 120 槽位的 Uint8Array (0~255)
 * @param {Float32Array|Array<number>} rawBins 物理采样分桶 (例如每 5 秒一个桶)
 * @returns {Uint8Array} 固定 120 字节的定长量化数组
 */
export function quantizeBinsTo120(rawBins) {
    const slots = CODEC_CONSTANTS.QUANTIZE_SLOTS;
    const result = new Uint8Array(slots);
    if (!rawBins || rawBins.length === 0) {
        return result;
    }

    const rawLen = rawBins.length;
    const tempVals = new Float32Array(slots);
    let globalMax = 0;

    for (let i = 0; i < slots; i++) {
        const start = Math.floor(i * rawLen / slots);
        const end = Math.min(rawLen, Math.floor((i + 1) * rawLen / slots));

        let maxVal = 0;
        let sumVal = 0;
        let count = 0;

        for (let j = start; j < end; j++) {
            const v = rawBins[j] || 0;
            if (v > maxVal) maxVal = v;
            sumVal += v;
            count++;
        }

        const composite = count > 0 ? (maxVal * 0.75 + (sumVal / count) * 0.25) : maxVal;
        tempVals[i] = composite;
        if (composite > globalMax) {
            globalMax = composite;
        }
    }

    if (globalMax <= 0.01) {
        return result; // 全片未探索或时长不足
    }

    // 相对归一化至 0 ~ 255
    for (let i = 0; i < slots; i++) {
        const normalized = Math.min(1.0, tempVals[i] / globalMax);
        result[i] = Math.round(normalized * 255);
    }

    return result;
}

/**
 * 将 120 槽位定长数组还原解压为目标长度的归一化 Float32Array (0.0 ~ 1.0)
 * @param {Uint8Array|Array<number>} uint8Slots 120 槽位数组
 * @param {number} targetLength 目标分桶长度
 * @returns {Float32Array} 目标长度的分桶权重数组
 */
export function expand120ToBins(uint8Slots, targetLength) {
    const slots = CODEC_CONSTANTS.QUANTIZE_SLOTS;
    const result = new Float32Array(targetLength);
    if (!uint8Slots || uint8Slots.length === 0 || targetLength <= 0) {
        return result;
    }

    for (let j = 0; j < targetLength; j++) {
        const slotIdx = Math.min(slots - 1, Math.floor(j * slots / targetLength));
        const val = uint8Slots[slotIdx] || 0;
        result[j] = val / 255.0;
    }

    return result;
}

/**
 * 计算客户端累计数据与上次已确认水位线之间的纯增量 (Delta Tracking)
 * @param {Float32Array|Array<number>} currentBins 当前本地累计足迹
 * @param {Float32Array|Array<number>} watermarkBins 上次已确认同步的水位线快照
 * @returns {{ deltaBins: Float32Array, totalDeltaSeconds: number }}
 */
export function calculateWatermarkDelta(currentBins, watermarkBins) {
    if (!currentBins || currentBins.length === 0) {
        return { deltaBins: new Float32Array(0), totalDeltaSeconds: 0 };
    }

    const len = currentBins.length;
    const deltaBins = new Float32Array(len);
    let totalDeltaSeconds = 0;

    for (let i = 0; i < len; i++) {
        const curr = currentBins[i] || 0;
        const prev = (watermarkBins && watermarkBins[i]) ? watermarkBins[i] : 0;
        const diff = Math.max(0, curr - prev);
        deltaBins[i] = diff;
        totalDeltaSeconds += diff;
    }

    return { deltaBins, totalDeltaSeconds };
}

/**
 * Uint8Array 编码为纯净 Base64 字符串
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function uint8ArrayToBase64(bytes) {
    if (!bytes || bytes.length === 0) return '';
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Base64 字符串解码为 Uint8Array
 * @param {string} base64Str
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64Str) {
    if (!base64Str || typeof base64Str !== 'string') {
        return new Uint8Array(0);
    }
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(base64Str, 'base64'));
    }
    const binary = atob(base64Str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
