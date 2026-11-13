#!/usr/bin/env node
/**
 * 评论识别引擎离线黄金基准评测脚本 (Stage C-1)
 *
 * 计算指标：
 * - 时间戳 Precision / Recall / F0.5（偏向精确率，惩罚误报）
 * - 番号（含同系列尾号推导）Precision / Recall / F0.5
 * - 倒数时间 False Positive Rate (FPR) & Accuracy
 * - 解析总耗时 (ms)
 *
 * 用法：
 *   node scripts/eval-comment-pipeline.mjs           # 打印详细报告
 *   node scripts/eval-comment-pipeline.mjs --strict  # 低于基线阈值时以非 0 退出（用于 CI 门禁）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { processComment } from '../src/player/comments/CommentDataPipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GOLD_PATH = path.resolve(__dirname, '../tests/fixtures/comment-pipeline-gold.json');
const STRICT = process.argv.includes('--strict');

const THRESHOLDS = {
    tsF05: 0.96,
    avF05: 0.96,
    cdFprMax: 0.02,
    cdAccMin: 0.97,
    maxElapsedMs: 500
};

function normTsValue(sec) {
    if (Array.isArray(sec)) {
        const sorted = [...sec].map(n => Math.round(n)).sort((a, b) => a - b);
        return `R:${sorted.join('~')}`;
    }
    return `S:${Math.round(sec)}`;
}

function computeF05(tp, fp, fn) {
    const precision = (tp + fp) === 0 ? 1 : tp / (tp + fp);
    const recall = (tp + fn) === 0 ? 1 : tp / (tp + fn);
    const beta2 = 0.25; // F0.5: beta = 0.5 => beta^2 = 0.25
    const denom = beta2 * precision + recall;
    const f05 = denom === 0 ? 0 : ((1 + beta2) * precision * recall) / denom;
    return { precision, recall, f05 };
}

function matchCounts(predList, expList, keyFn) {
    const expCounts = new Map();
    for (const item of expList) {
        const k = keyFn(item);
        expCounts.set(k, (expCounts.get(k) || 0) + 1);
    }
    let tp = 0;
    let fp = 0;
    for (const item of predList) {
        const k = keyFn(item);
        const rem = expCounts.get(k) || 0;
        if (rem > 0) {
            tp++;
            expCounts.set(k, rem - 1);
        } else {
            fp++;
        }
    }
    let fn = 0;
    for (const rem of expCounts.values()) fn += rem;
    return { tp, fp, fn };
}

const raw = JSON.parse(fs.readFileSync(GOLD_PATH, 'utf8'));
const cases = raw.cases || [];

let tsTp = 0, tsFp = 0, tsFn = 0;
let avTp = 0, avFp = 0, avFn = 0;
let cdTp = 0, cdFp = 0, cdTn = 0, cdFn = 0;
const failures = [];

const t0 = performance.now();
for (const c of cases) {
    const res = processComment(c.text, c.avcode, c.duration || 7200);
    const predTs = res.timestamps.map(t => t.seconds);
    const expTs = c.expectedTs || [];
    const tsM = matchCounts(predTs, expTs, normTsValue);
    tsTp += tsM.tp;
    tsFp += tsM.fp;
    tsFn += tsM.fn;

    const predAv = (res.avcodes || []).map(x => String(x).toUpperCase());
    const expAv = (c.expectedAv || []).map(x => String(x).toUpperCase());
    const avM = matchCounts(predAv, expAv, x => x);
    avTp += avM.tp;
    avFp += avM.fp;
    avFn += avM.fn;

    const predCd = Boolean(res.isCountdownComment);
    const expCd = Boolean(c.expectedCd);
    if (predCd && expCd) cdTp++;
    else if (predCd && !expCd) cdFp++;
    else if (!predCd && expCd) cdFn++;
    else cdTn++;

    if (tsM.fp > 0 || tsM.fn > 0 || avM.fp > 0 || avM.fn > 0 || predCd !== expCd) {
        failures.push({
            id: c.id,
            avcode: c.avcode,
            text: c.text.slice(0, 80),
            predTs,
            expTs,
            predAv,
            expAv,
            predCd,
            expCd
        });
    }
}
const elapsedMs = performance.now() - t0;

const tsMetrics = computeF05(tsTp, tsFp, tsFn);
const avMetrics = computeF05(avTp, avFp, avFn);
const cdFpr = (cdFp + cdTn) === 0 ? 0 : cdFp / (cdFp + cdTn);
const cdAcc = cases.length === 0 ? 1 : (cdTp + cdTn) / cases.length;

console.log(`📊 Gold Benchmark 评测结果 (${cases.length} cases, ${elapsedMs.toFixed(2)} ms)`);
console.log(`   [时间戳] TP=${tsTp} FP=${tsFp} FN=${tsFn} | P=${(tsMetrics.precision * 100).toFixed(2)}% R=${(tsMetrics.recall * 100).toFixed(2)}% F0.5=${(tsMetrics.f05 * 100).toFixed(2)}%`);
console.log(`   [番号]   TP=${avTp} FP=${avFp} FN=${avFn} | P=${(avMetrics.precision * 100).toFixed(2)}% R=${(avMetrics.recall * 100).toFixed(2)}% F0.5=${(avMetrics.f05 * 100).toFixed(2)}%`);
console.log(`   [倒数]   TP=${cdTp} FP=${cdFp} FN=${cdFn} TN=${cdTn} | FPR=${(cdFpr * 100).toFixed(2)}% Acc=${(cdAcc * 100).toFixed(2)}%`);

if (failures.length > 0) {
    console.log(`\n⚠️ 偏差用例 (${failures.length}):`);
    for (const f of failures) {
        console.log(`  - ${f.id} [${f.avcode}] "${f.text}"`);
        if (JSON.stringify(f.predTs) !== JSON.stringify(f.expTs)) console.log(`      TS pred=${JSON.stringify(f.predTs)} exp=${JSON.stringify(f.expTs)}`);
        if (JSON.stringify(f.predAv) !== JSON.stringify(f.expAv)) console.log(`      AV pred=${JSON.stringify(f.predAv)} exp=${JSON.stringify(f.expAv)}`);
        if (f.predCd !== f.expCd) console.log(`      CD pred=${f.predCd} exp=${f.expCd}`);
    }
}

if (STRICT) {
    const violations = [];
    if (tsMetrics.f05 < THRESHOLDS.tsF05) violations.push(`Timestamp F0.5 ${(tsMetrics.f05 * 100).toFixed(2)}% < ${(THRESHOLDS.tsF05 * 100).toFixed(2)}%`);
    if (avMetrics.f05 < THRESHOLDS.avF05) violations.push(`AV F0.5 ${(avMetrics.f05 * 100).toFixed(2)}% < ${(THRESHOLDS.avF05 * 100).toFixed(2)}%`);
    if (cdFpr > THRESHOLDS.cdFprMax) violations.push(`Countdown FPR ${(cdFpr * 100).toFixed(2)}% > ${(THRESHOLDS.cdFprMax * 100).toFixed(2)}%`);
    if (cdAcc < THRESHOLDS.cdAccMin) violations.push(`Countdown Acc ${(cdAcc * 100).toFixed(2)}% < ${(THRESHOLDS.cdAccMin * 100).toFixed(2)}%`);
    if (elapsedMs > THRESHOLDS.maxElapsedMs) violations.push(`Elapsed ${elapsedMs.toFixed(1)}ms > ${THRESHOLDS.maxElapsedMs}ms`);
    if (violations.length > 0) {
        console.error('\n❌ Strict benchmark gate failed:\n  - ' + violations.join('\n  - '));
        process.exit(1);
    }
    console.log('\n✅ Strict Gold Benchmark gate passed!');
}
