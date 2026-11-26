import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

import { parseSubtitles } from '../src/player/subtitles/SubtitleFormat.js';
import { scoreSubtitleQuality, selectBestQualityCandidate } from '../src/player/subtitles/SubtitleQualityScorer.js';
import {
    analyzeSubtitlePlot,
    buildHighlightedCueFragment,
    findHighlightRanges,
    resolvePlotTag
} from '../src/player/subtitles/SubtitlePlotAnalyzer.js';

function makeDialogueCues(count, { spanSec = 3400, startOffset = 20, prefix = '对话内容' } = {}) {
    const step = count > 1 ? spanSec / count : 5;
    return Array.from({ length: count }, (_, idx) => {
        const start = startOffset + idx * step;
        return {
            start,
            end: start + Math.min(3.5, Math.max(1.5, step * 0.8)),
            text: `${prefix} 第${idx + 1}句 正常剧情对白`
        };
    });
}

test('SubtitleQualityScorer 质量评分与择优单元测试', async (t) => {
    await t.test('1. 优质人工翻译字幕获得高分与「优质」徽章', () => {
        const cues = makeDialogueCues(90, { spanSec: 3400, startOffset: 30 });
        const result = scoreSubtitleQuality(cues, { videoDurationSec: 3600 });

        assert.equal(result.sqi, 100);
        assert.equal(result.grade, 'high');
        assert.equal(result.label, '优质');
        assert.deepEqual(result.reasons, []);
        assert.equal(result.metrics.cueCount, 90);
        assert.ok(result.metrics.coverage > 0.9);
    });

    await t.test('2. Whisper 幻觉水印与高频重复刷屏大幅扣分', () => {
        const cues = Array.from({ length: 80 }, (_, idx) => {
            const start = idx * 40;
            const text = idx < 65 ? '谢谢观看 请订阅频道' : `普通台词 ${idx}`;
            return { start, end: start + 3, text };
        });
        const result = scoreSubtitleQuality(cues, { videoDurationSec: 3600 });

        assert.ok(result.sqi < 55, `期望低于 55，实际 ${result.sqi}`);
        assert.equal(result.grade, 'low');
        assert.equal(result.label, '异常');
        assert.ok(result.reasons.includes('high_repetition'));
        assert.ok(result.reasons.includes('consecutive_repetition'));
        assert.ok(result.reasons.includes('whisper_hallucination'));
        assert.ok(result.metrics.hallucinationHits >= 65);
        assert.ok(result.metrics.maxRun >= 65);
    });

    await t.test('3. 双跳净网机翻腔检测并打标「机翻」', () => {
        const mtLines = [
            '努力工作，不要停下来',
            '这是正确的做法',
            '我现在感觉真好',
            '它进得非常深',
            '你可以吃它没关系',
            '我明白了，继续吧',
            '你做得很好，真棒',
            '天哪，这是一只鸭子',
            '请停止努力工作',
            '我觉得很好，真的',
            '对不起，我忍不住了',
            '求你了，请住手'
        ];
        const cues = makeDialogueCues(60, { spanSec: 3300 }).map((cue, idx) => (
            idx < mtLines.length ? { ...cue, text: mtLines[idx] } : cue
        ));
        const result = scoreSubtitleQuality(cues, { videoDurationSec: 3600 });

        assert.ok(result.reasons.includes('sanitized_mt'));
        assert.equal(result.grade, 'medium');
        assert.equal(result.label, '机翻');
        assert.ok(result.sqi < 75 && result.sqi >= 55);
        assert.ok(result.metrics.mtRate >= 0.15);
    });

    await t.test('4. 仅覆盖前 4 分钟的截断字幕判定为「残缺」', () => {
        const cues = makeDialogueCues(45, { spanSec: 240, startOffset: 5 });
        const result = scoreSubtitleQuality(cues, { videoDurationSec: 3600 });

        assert.ok(result.reasons.includes('truncated'));
        assert.equal(result.sqi, 45);
        assert.equal(result.grade, 'low');
        assert.equal(result.label, '残缺');
        assert.ok(result.metrics.coverage < 0.25);
    });

    await t.test('5. 乱码 / 损坏 / 空轨统一判定为 broken 且标记「异常」', () => {
        const emptyRes = scoreSubtitleQuality([], { videoDurationSec: 3600 });
        assert.equal(emptyRes.sqi, 5);
        assert.equal(emptyRes.grade, 'broken');
        assert.equal(emptyRes.label, '异常');
        assert.deepEqual(emptyRes.reasons, ['corrupted_or_empty']);

        const flagRes = scoreSubtitleQuality(makeDialogueCues(50), {
            videoDurationSec: 3600,
            langInfo: { isCorrupted: true }
        });
        assert.equal(flagRes.grade, 'broken');
        assert.deepEqual(flagRes.reasons, ['corrupted_or_empty']);

        const mojibakeCues = Array.from({ length: 10 }, (_, idx) => ({
            start: idx * 3,
            end: idx * 3 + 2,
            text: '\uFFFD\uFFFD\uFFFD\uFFFD乱码'
        }));
        const mojibakeRes = scoreSubtitleQuality(mojibakeCues, { videoDurationSec: 120 });
        assert.equal(mojibakeRes.grade, 'broken');
        assert.equal(mojibakeRes.label, '异常');
        assert.deepEqual(mojibakeRes.reasons, ['corrupted_or_empty']);
    });

    await t.test('6. 短合成单条 SRT 测试字幕不受时长截断误杀', () => {
        const { cues } = parseSubtitles('1\n00:00:01,000 --> 00:00:04,000\n第一句测试字幕\n', 'synthetic.srt');
        const result = scoreSubtitleQuality(cues, { videoDurationSec: 0 });

        assert.ok(result.sqi >= 75);
        assert.equal(result.grade, 'high');
        assert.equal(result.label, '');
        assert.deepEqual(result.reasons, []);
    });

    await t.test('7. selectBestQualityCandidate 择优、空损剔除与单候选兜底', () => {
        const humanCues = makeDialogueCues(80, { spanSec: 3200 });
        const mtCues = makeDialogueCues(60, { spanSec: 3200 }).map((cue, idx) => (
            idx < 10 ? { ...cue, text: '努力工作，感觉真好，这是一只鸭子' } : cue
        ));
        const brokenCues = makeDialogueCues(10, { spanSec: 100 });

        const candidates = [
            {
                candidate: { id: 'broken' },
                parsed: { cues: brokenCues },
                quality: scoreSubtitleQuality(brokenCues, { videoDurationSec: 3600, langInfo: { isCorrupted: true } })
            },
            {
                candidate: { id: 'mt' },
                parsed: { cues: mtCues },
                quality: scoreSubtitleQuality(mtCues, { videoDurationSec: 3600 })
            },
            {
                candidate: { id: 'human' },
                parsed: { cues: humanCues },
                quality: scoreSubtitleQuality(humanCues, { videoDurationSec: 3600 })
            }
        ];

        const best = selectBestQualityCandidate(candidates);
        assert.equal(best.candidate.id, 'human');

        // 单一低分非损坏轨道兜底返回自身，而不是返回 null
        const truncatedCues = makeDialogueCues(10, { spanSec: 120 });
        const singleFallback = selectBestQualityCandidate([
            {
                candidate: { id: 'only-low' },
                parsed: { cues: truncatedCues },
                quality: { sqi: 20, grade: 'broken', label: '残缺', reasons: ['truncated'] }
            }
        ]);
        assert.equal(singleFallback.candidate.id, 'only-low');

        // 全部为空或损坏时返回 null
        assert.equal(selectBestQualityCandidate([
            { candidate: { id: 'empty' }, parsed: { cues: [] }, quality: { sqi: 5, grade: 'broken', reasons: ['corrupted_or_empty'] } }
        ]), null);
    });
});

test('SubtitlePlotAnalyzer 剧情锚点提取与高亮单元测试', async (t) => {
    await t.test('1. DASD-943 上下文门控回归：办公室催眠对话零误报，加入强词后精准解锁', () => {
        const officeCues = [
            { start: 60, end: 64, text: '部长，今天的催眠讲座资料准备好了' },
            { start: 66, end: 70, text: '这是我们部门的商业秘密，不能泄露' },
            { start: 72, end: 76, text: '你老公知道你加班做精油按摩吗' },
            { start: 78, end: 82, text: '大家都在看着我，稍微忍耐一下汇报' }
        ];
        const falseCheck = analyzeSubtitlePlot(officeCues);
        assert.equal(falseCheck.available, false);
        assert.equal(falseCheck.anchors.length, 0);
        assert.equal(falseCheck.cueHighlights.size, 0);

        const realPlotCues = [
            ...officeCues,
            { start: 85, end: 89, text: '被催眠之后就乖乖跪下，张开嘴含住鸡巴' }
        ];
        const trueCheck = analyzeSubtitlePlot(realPlotCues);
        assert.equal(trueCheck.available, true);
        assert.equal(trueCheck.anchors.length, 1);
        assert.ok(trueCheck.anchors[0].tag.length >= 2 && trueCheck.anchors[0].tag.length <= 4);
        assert.equal(trueCheck.anchors[0].source, 'local');
        // 催眠在第 0 句，距离强词第 4 句仅 25s (<= 30s)，因此第 0 句的「催眠」应被门控解锁并高亮
        const cue0Ranges = trueCheck.cueHighlights.get(0);
        assert.ok(cue0Ranges && cue0Ranges.some((r) => officeCues[0].text.slice(r.start, r.end) === '催眠'));
    });

    await t.test('2. MIAB-486 繁体中文字幕：精准生成锚点并无偏移定位繁体原文索引', () => {
        const tradCues = [
            { start: 100, end: 104, text: '快把她的超短裙子掀開裙子看看裡面' },
            { start: 106, end: 110, text: '用喉嚨深處把這根大陰莖整個吞下去' }
        ];
        const res = analyzeSubtitlePlot(tradCues);
        assert.equal(res.available, true);
        assert.equal(res.anchors.length, 1);

        const ranges0 = res.cueHighlights.get(0) || [];
        const slices0 = ranges0.map((r) => tradCues[0].text.slice(r.start, r.end));
        assert.ok(slices0.includes('掀開'), `实际提取片段: ${JSON.stringify(slices0)}`);
        assert.ok(slices0.includes('裙子'), `实际提取片段: ${JSON.stringify(slices0)}`);

        const ranges1 = res.cueHighlights.get(1) || [];
        const slices1 = ranges1.map((r) => tradCues[1].text.slice(r.start, r.end));
        assert.ok(slices1.includes('喉嚨深處'), `实际提取片段: ${JSON.stringify(slices1)}`);
        assert.ok(slices1.includes('陰莖'), `实际提取片段: ${JSON.stringify(slices1)}`);
    });

    await t.test('3. 日语双语救援：中文被净网词替换时，通过 secondaryText 日文关键词挽回锚点', () => {
        const cues = makeDialogueCues(45, { spanSec: 1800, prefix: '日常对话' }).map((cue, idx) => {
            if (idx === 20) {
                return { ...cue, text: '努力工作吧', secondaryText: 'これから調教の時間だよ' };
            }
            if (idx === 21) {
                return { ...cue, text: '我明白了', secondaryText: 'フェラと乳首を舐めて' };
            }
            return cue;
        });

        const res = analyzeSubtitlePlot(cues);
        assert.equal(res.available, true);
        assert.equal(res.anchors.length, 1);
        assert.ok(['调教', '口交', '前戏'].includes(res.anchors[0].tag));
    });

    await t.test('4. 30 秒词条冷却机制防止连续刷屏，同时保留锚点代表行高亮', () => {
        const cues = [
            { start: 10, end: 13, text: '快舔这根肉棒吧' },
            { start: 15, end: 18, text: '这根肉棒好大' },
            { start: 25, end: 28, text: '再含住肉棒一下' },
            { start: 45, end: 48, text: '现在继续舔肉棒' }
        ];
        const res = analyzeSubtitlePlot(cues, { cooldownSec: 30 });
        assert.equal(res.available, true);

        const anchorCueIdx = res.anchors[0].cueIndex;
        // 非锚点行的冷却检查：第 0 行(10s)出现「肉棒」，第 1 行(15s)若非锚点应被冷却
        if (anchorCueIdx !== 1) {
            const r1 = res.cueHighlights.get(1) || [];
            assert.equal(r1.some((r) => cues[1].text.slice(r.start, r.end) === '肉棒'), false);
        }
        if (anchorCueIdx !== 2) {
            const r2 = res.cueHighlights.get(2) || [];
            assert.equal(r2.some((r) => cues[2].text.slice(r.start, r.end) === '肉棒'), false);
        }
        // 第 3 行(45s) 距离 10s 已满 35s (>=30s)，应恢复高亮
        const r3 = res.cueHighlights.get(3) || [];
        assert.equal(r3.some((r) => cues[3].text.slice(r.start, r.end) === '肉棒'), true);
        // 锚点代表行必须始终保留高亮
        assert.ok(res.highlightCueIndices.has(anchorCueIdx));
    });

    await t.test('5. 损坏、零信号或极低密度长片诚实静默降级 (available: false)', () => {
        const broken = analyzeSubtitlePlot([{ start: 1, end: 3, text: '肉棒调教' }], {
            quality: { grade: 'broken' }
        });
        assert.equal(broken.available, false);
        assert.equal(broken.anchors.length, 0);

        const zeroSignal = analyzeSubtitlePlot(makeDialogueCues(30, { spanSec: 600 }));
        assert.equal(zeroSignal.available, false);

        // 100 条字幕仅 1 条含词条（hitRate = 0.01 < 0.012）
        const sparse = makeDialogueCues(100, { spanSec: 3000 });
        sparse[50].text = '跪下张开嘴含住鸡巴';
        const sparseRes = analyzeSubtitlePlot(sparse);
        assert.equal(sparseRes.available, false);
        assert.equal(sparseRes.anchors.length, 0);
    });

    await t.test('6. buildHighlightedCueFragment 零 innerHTML 注入且兼容双环境 DOM', () => {
        const xssText = '<script>alert(1)</script> 调教开始';
        const ranges = findHighlightRanges(xssText, [{ term: '调教', kind: 'plot' }]);
        assert.equal(ranges.length, 1);

        // 环境 A：FakeElement（无 createDocumentFragment / 无 createTextNode）
        const fakeNodes = [];
        const fakeDoc = {
            createElement: (tag) => ({ tagName: tag.toUpperCase(), className: '', textContent: '' })
        };
        const outA = buildHighlightedCueFragment(xssText, ranges, fakeDoc);
        assert.ok(Array.isArray(outA));
        assert.equal(outA.length, 3);
        assert.equal(outA[0].textContent, '<script>alert(1)</script> ');
        assert.equal(outA[1].tagName, 'MARK');
        assert.equal(outA[1].className, 'mp-sub-hl mp-sub-hl--plot');
        assert.equal(outA[1].textContent, '调教');
        assert.equal(outA[2].textContent, '开始');

        // 环境 B：标准 Document（含 createDocumentFragment & createTextNode）
        const stdDoc = {
            createTextNode: (txt) => ({ nodeType: 3, textContent: txt }),
            createElement: (tag) => ({ nodeType: 1, tagName: tag.toUpperCase(), className: '', textContent: '' }),
            createDocumentFragment: () => {
                const childNodes = [];
                return {
                    nodeType: 11,
                    childNodes,
                    appendChild(node) {
                        childNodes.push(node);
                        return node;
                    }
                };
            }
        };
        const outB = buildHighlightedCueFragment(xssText, ranges, stdDoc);
        assert.equal(outB.nodeType, 11);
        assert.equal(outB.childNodes.length, 3);
        assert.equal(outB.childNodes[0].nodeType, 3);
        assert.equal(outB.childNodes[0].textContent, '<script>alert(1)</script> ');
        assert.equal(outB.childNodes[1].tagName, 'MARK');
        assert.equal(outB.childNodes[1].textContent, '调教');
        fakeNodes.push(...outA);
    });

    await t.test('7. resolvePlotTag 输出精炼 2-4 字无 Emoji 标签', () => {
        const tag = resolvePlotTag(['深喉', '喉咙深处']);
        assert.equal(tag, '深喉');
        assert.equal(resolvePlotTag([]), '高能');
    });
});

test('CSS 架构合规门禁检查 (_subtitle_insights.css)', () => {
    const cssPath = path.resolve(process.cwd(), 'src/player/ui/styles/02_components/_subtitle_insights.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const stripped = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

    assert.equal(stripped.includes('!important'), false, '_subtitle_insights.css 严禁包含 !important');

    const root = postcss.parse(cssContent, { from: cssPath });
    const deep = [];
    root.walkRules((rule) => {
        if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
        rule.selectors?.forEach((sel) => {
            const depth = sel.trim().split(/[\s>+~]+/).filter(Boolean).length;
            if (depth > 3) deep.push({ sel: sel.trim(), depth });
        });
    });

    assert.deepEqual(deep, [], `存在嵌套深度超过 3 层的选择器: ${JSON.stringify(deep)}`);
});
