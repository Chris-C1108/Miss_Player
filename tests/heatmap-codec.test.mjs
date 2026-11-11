import test from 'node:test';
import assert from 'node:assert/strict';
import {
    quantizeBinsTo120,
    expand120ToBins,
    calculateWatermarkDelta,
    uint8ArrayToBase64,
    base64ToUint8Array,
    CODEC_CONSTANTS
} from '../src/utils/heatmapCodec.js';

test('HeatmapCodec 单元测试', async (t) => {
    await t.test('1. 空输入安全边界处理', () => {
        const qEmpty = quantizeBinsTo120(null);
        assert.equal(qEmpty.length, CODEC_CONSTANTS.QUANTIZE_SLOTS);
        assert.equal(qEmpty.every(v => v === 0), true);

        const expEmpty = expand120ToBins(null, 100);
        assert.equal(expEmpty.length, 100);
        assert.equal(expEmpty.every(v => v === 0), true);

        const deltaEmpty = calculateWatermarkDelta(null, null);
        assert.equal(deltaEmpty.totalDeltaSeconds, 0);
        assert.equal(deltaEmpty.deltaBins.length, 0);
    });

    await t.test('2. 120 槽位定长量化与峰值捕捉', () => {
        // 模拟 4 小时视频，5 秒一桶，共 2880 个桶
        const totalBins = 2880;
        const raw = new Float32Array(totalBins);
        // 在中间某个区间 (例如第 1400 到 1440 桶，约 2 小时处) 模拟反复观看高光 (停留 300 秒)
        for (let i = 1400; i < 1440; i++) {
            raw[i] = 300;
        }

        const quantized = quantizeBinsTo120(raw);
        assert.equal(quantized.length, 120);

        // 验证中间对应槽位存在峰值 (接近 255)
        const peakIdx = Math.floor(1420 * 120 / totalBins);
        assert.ok(quantized[peakIdx] > 200, `峰值槽位 ${peakIdx} 数值应接近 255，实际为 ${quantized[peakIdx]}`);

        // 验证其他未探索区域槽位为 0
        assert.equal(quantized[0], 0);
        assert.equal(quantized[119], 0);
    });

    await t.test('3. 定长槽位平滑还原至不同分辨率的分桶', () => {
        const slots = new Uint8Array(120);
        slots[60] = 255; // 中间槽位满幅

        const expanded = expand120ToBins(slots, 600);
        assert.equal(expanded.length, 600);
        // 对应第 300 附近的分桶应有接近 1.0 的强度
        assert.ok(expanded[300] > 0.9, '解压后对应分桶权重应接近 1.0');
        assert.equal(expanded[0], 0);
    });

    await t.test('4. 水位线增量差分计算 (防重复累计)', () => {
        const current = new Float32Array([10, 20, 50, 0, 0]);
        const watermark = new Float32Array([10, 20, 10, 0, 0]);

        const { deltaBins, totalDeltaSeconds } = calculateWatermarkDelta(current, watermark);
        assert.equal(totalDeltaSeconds, 40); // 只有 index 2 产生了 50 - 10 = 40 秒的增量
        assert.equal(deltaBins[0], 0);
        assert.equal(deltaBins[1], 0);
        assert.equal(deltaBins[2], 40);
        assert.equal(deltaBins[3], 0);
    });

    await t.test('5. Base64 编解码一致性与体积保证', () => {
        const slots = new Uint8Array(120);
        for (let i = 0; i < 120; i++) {
            slots[i] = i * 2;
        }

        const b64 = uint8ArrayToBase64(slots);
        assert.equal(typeof b64, 'string');
        assert.equal(b64.length, 160); // 120 字节 Base64 恰好是 160 字符

        const decoded = base64ToUint8Array(b64);
        assert.equal(decoded.length, 120);
        for (let i = 0; i < 120; i++) {
            assert.equal(decoded[i], slots[i]);
        }
    });
});
