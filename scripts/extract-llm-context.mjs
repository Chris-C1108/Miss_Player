#!/usr/bin/env node
/**
 * scripts/extract-llm-context.mjs
 * 
 * LLM 视角精简上下文提取与增量分析工具
 * 1. 抽取 Supabase 中的真实评论与物理时长
 * 2. 过滤 0 秒无效时长，置为 null，避免污染倒数分析
 * 3. 过滤无时间/数字/番号的无关纯文本
 * 4. 支持增量游标 (.extract_llm_state.json 或 --since)
 * 5. 输出精简 Markdown / JSONL / Compact 格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let pipeline = null;
let videoCodeEngine = null;

try {
    pipeline = await import(path.join(ROOT_DIR, 'src/player/comments/CommentDataPipeline.js'));
    videoCodeEngine = await import(path.join(ROOT_DIR, 'src/utils/videoCode.js'));
} catch (e) {
    // 允许规则库未就绪时的兜底运行
}

const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || 'https://daosvqbphybjsgvpujil.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OFt3-Uybbs8x0JOrbkucRg_v58QaxVJ';
const STATE_FILE = path.join(ROOT_DIR, '.extract_llm_state.json');

const args = process.argv.slice(2);
function getArg(flag, fallback = null) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return fallback;
}
const hasFlag = (flag) => args.includes(flag);

const format = getArg('--format', 'md'); // md | jsonl | compact
const limit = parseInt(getArg('--limit', '50'), 10);
const sinceArg = getArg('--since', null);
const outFile = getArg('--out', null);
const dryRun = hasFlag('--dry-run');
const resetState = hasFlag('--reset-state');

async function main() {
    let lastWatermark = null;
    if (!resetState && !sinceArg && fs.existsSync(STATE_FILE)) {
        try {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            lastWatermark = state.last_updated_at;
        } catch (_) {}
    }
    const since = sinceArg || lastWatermark;

    console.log('[Extractor] 启动提取流程... 格式: ' + format + ', 限制: ' + limit + ', 增量基准: ' + (since || '全量'));

    const url = new URL(DEFAULT_SUPABASE_URL + '/rest/v1/video_comments_bundle');
    url.searchParams.set('select', 'avcode,duration_seconds,updated_at,comments');
    url.searchParams.set('order', 'updated_at.desc');
    url.searchParams.set('limit', String(limit));
    if (since) {
        url.searchParams.set('updated_at', 'gt.' + since);
    }

    const resp = await fetch(url.toString(), {
        headers: {
            'apikey': DEFAULT_SUPABASE_KEY,
            'Authorization': 'Bearer ' + DEFAULT_SUPABASE_KEY
        }
    });

    if (!resp.ok) {
        throw new Error('Supabase API 请求失败: ' + resp.status + ' ' + resp.statusText);
    }

    const bundles = await resp.json();
    console.log('[Extractor] 成功拉取 ' + bundles.length + ' 个番号 Bundle 集合.');

    if (bundles.length === 0) {
        console.log('[Extractor] 无新增数据，结束。');
        return;
    }

    let maxUpdatedAt = since || '1970-01-01T00:00:00Z';
    const items = [];

    for (const b of bundles) {
        if (b.updated_at && b.updated_at > maxUpdatedAt) {
            maxUpdatedAt = b.updated_at;
        }

        // 核心规范：0秒无效时长置为 null，杜绝污染倒数与有效范围
        const realDuration = (b.duration_seconds && b.duration_seconds > 0) ? b.duration_seconds : null;
        const comments = Array.isArray(b.comments) ? b.comments : [];

        for (const c of comments) {
            const raw = (c.content_raw || c.text || '').trim();
            if (!/[\d:：点分秒时時間hmHMS~～\-一二三四五六七八九十]/.test(raw) && !/[a-zA-Z]{2,6}[-_ ]\d{2,5}/i.test(raw)) {
                continue;
            }
            if (/(?:magnet:\?xt=urn:btih:|ed2k:\/\/\|file\|)/i.test(raw) && raw.length > 120) {
                continue;
            }

            let baselineTs = [];
            let baselineAv = '';
            if (pipeline) {
                const tsRes = pipeline.parseTimestamps(raw, realDuration || 10800);
                if (tsRes.isValid && Array.isArray(tsRes.validTimestamps)) {
                    baselineTs = tsRes.validTimestamps.map(t => ({
                        raw: t.raw,
                        sec: t.seconds,
                        countdown: Boolean(t.isCountdown)
                    }));
                }
            }
            if (videoCodeEngine) {
                baselineAv = videoCodeEngine.matchAvCodeFromText(raw);
            }

            items.push({
                av: b.avcode,
                dur: realDuration,
                text: raw.replace(/\r?\n+/g, ' ').slice(0, 180),
                ts: baselineTs,
                otherAv: (baselineAv && baselineAv !== b.avcode) ? baselineAv : undefined
            });
        }
    }

    console.log('[Extractor] 提炼出 ' + items.length + ' 条高价值语料样本 (已排除纯字、长链接及0秒虚假时长影响).');

    let outputContent = '';
    if (format === 'md') {
        outputContent = generateMarkdownContext(items, since, maxUpdatedAt);
    } else if (format === 'jsonl') {
        outputContent = items.map(it => JSON.stringify(it)).join('\n');
    } else {
        outputContent = generateUltraCompactContext(items);
    }

    if (outFile) {
        fs.writeFileSync(outFile, outputContent, 'utf-8');
        console.log('[Extractor] 输出已保存至: ' + outFile);
    } else {
        console.log('\n--- [LLM 上下文预览 (前 2000 字符)] ---');
        console.log(outputContent.slice(0, 2000));
        console.log('...\n--- [结束预览] ---');
    }

    if (!dryRun) {
        fs.writeFileSync(STATE_FILE, JSON.stringify({
            last_updated_at: maxUpdatedAt,
            extracted_count: items.length,
            extracted_at: new Date().toISOString()
        }, null, 2), 'utf-8');
        console.log('[Extractor] 状态已保存，最新水位线: ' + maxUpdatedAt);
    }
}

function generateMarkdownContext(items, since, latest) {
    const lines = [];
    lines.push('# 评论区语义分析语料集 (LLM 精简上下文)');
    lines.push('- 抽取时间: ' + new Date().toISOString());
    lines.push('- 增量区间: ' + (since || 'Init') + ' -> ' + latest);
    lines.push('- 样本条数: ' + items.length);
    lines.push('- 约束说明: dur_s 为视频物理时长秒数，null 表示未知(严禁用 0 作倒数/上限依据)');
    lines.push('');
    lines.push('| ID | 所属番号 | 真实时长(秒) | 评论原始文本 | 现行规则提取结果 (对照) |');
    lines.push('|---|---|---|---|---|');

    items.forEach((item, idx) => {
        const id = idx + 1;
        const durStr = item.dur ? (item.dur + 's') : '未知(null)';
        const safeText = item.text.replace(/\|/g, '\\|');
        const tsSummary = item.ts.length > 0 
            ? item.ts.map(t => t.raw + '->' + JSON.stringify(t.sec) + (t.countdown ? '(倒数)' : '')).join('; ')
            : '未提取到';
        const otherAvStr = item.otherAv ? (' [提番号:' + item.otherAv + ']') : '';
        lines.push('| ' + id + ' | ' + item.av + ' | ' + durStr + ' | ' + safeText + ' | ' + tsSummary + otherAvStr + ' |');
    });

    lines.push('');
    lines.push('## 供 LLM 分析的核心提示词指引 (Prompt Tasks):');
    lines.push('1. **时间戳漏报 (False Negative)**: 识别哪些包含时间语义（如 1小时06, 35分, 22 26, 2305 紧凑分秒）的文本未被规则提取；');
    lines.push('2. **时间戳误报 (False Positive)**: 识别哪些纯数字（如 170大长腿, 36d, 7次, 2015, 13000）被误判为时间；');
    lines.push('3. **倒数/剩余时间识别**: 如 -1:35:53 或 还剩 15 分钟，结合真实时长转换；');
    lines.push('4. **时间片段/区间**: 如 45.20-48.10, 从 35分 到 40分 的起止识别；');
    lines.push('5. **跨番号提问/推荐**: 如在 CKCK-011 评论中提到 MIAB-592, RCKK-001 等其他番号提取与过滤。');

    return lines.join('\n');
}

function generateUltraCompactContext(items) {
    return items.map((it, idx) => {
        const d = it.dur !== null ? it.dur : '?';
        return '[' + (idx + 1) + '|' + it.av + '|' + d + '] ' + it.text;
    }).join('\n');
}

main().catch(err => {
    console.error('[Extractor Error]', err);
    process.exit(1);
});
