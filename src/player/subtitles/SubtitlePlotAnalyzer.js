/**
 * SubtitlePlotAnalyzer — 字幕高能剧情锚点提取与词条高亮引擎
 *
 * 采用三层精选词库 + 日语双语救援 + ±30s 上下文门控 + 60s 滑窗抑制 + 30s 冷却机制：
 *   - 绝不包含单字歧义词与泛化喘息拟声词，防止办公室等常规对话误报
 *   - 支持繁体字幕简繁映射后回溯原始 UTF-16 索引，确保高亮范围精准无偏移
 *   - 纯 DOM 节点构建高亮片段，杜绝 innerHTML 注入风险
 */

import { convertChineseText } from './SubtitleChineseConverter.js';

const STRONG_ACT = [
    '肉棒', '鸡巴', '老二', '大吊', '大屌', '阳具', '阴茎', '龟头', '睾丸',
    '小穴', '骚穴', '嫩穴', '蜜穴', '阴道', '阴蒂', '豆豆', '乳头', '奶头',
    '乳房', '巨乳', '奶子', '胸部', '揉胸', '摸胸', '吸奶', '子宫', '精液',
    '精子', '爱液', '淫水', '口交', '深喉', '口爆', '颜射', '乳交', '足交',
    '肛交', '肛门', '后庭', '屁眼', '潮吹', '绝顶', '射精', '内射', '中出',
    '射进去', '射在里面', '射满', '后入', '骑乘', '抽插', '猛插', '狠插',
    '顶到', '插进去', '插进来', '插到', '吞精', '吞下去', '吞掉', '含住',
    '舔', '吮吸', '吸吮', '自慰', '手淫', '勃起', '变硬', '好硬', '湿透',
    '发情', '喷水', '失禁', '痉挛', '舌吻', '喉咙深处'
];

const STRONG_PLOT = [
    '性奴', '奴隶', '调教', '屈辱', '羞耻', '羞辱', '变态', '淫荡', '骚货',
    '荡妇', '母狗', '下贱', '贱货', '堕落', '惩罚', '侵犯', '强奸', '强暴',
    '偷情', '出轨', '绿帽', '丈夫的错', '对不起老公', '别被发现', '不能被发现',
    '别出声', '不要出声', '脱掉', '脱衣服', '脱光', '脱下来', '掀开', '扒开',
    '掰开', '内裤', '胖次', '丁字裤', '胸罩', '内衣', '丝袜', '黑丝', '白丝',
    '超短裙', '没穿内裤', '诱惑', '勾引', '挑逗', '色诱', '忍不住', '憋不住',
    '饥渴', '性欲', '发骚', '色情', '下流', '好色', '色狼', '侍奉', '伺候',
    '跪下', '蹲下', '趴下', '撅起', '张开腿', '腿张开', '双腿张开', '张开嘴',
    '看着镜头', '媚药', '春药', '下药', '敏感带', '给我吃', '想舔', '想插',
    '想做爱', '做爱', '上床', '开房', '亲热'
];

const CONTEXT_PLOT = [
    '催眠', '秘密', '按摩', '精油', '拍照', '偷拍', '录像', '老公', '丈夫',
    '社长', '部长', '醉了', '睡着了', '裙子', '敏感', '忍耐', '看着我'
];

const JA_BOOST = [
    'フェラ', 'イラマ', '調教', '脱いで', '挿入', '中出し', '乳首', 'パンツ',
    '舐めて', '変態', '奴隷', 'マンコ', 'ちんぽ', 'チンポ', 'おっぱい',
    '射精', '潮吹き', '犯して', 'キス'
];

const JA_PLOT_TERMS = new Set(['調教', '脱いで', 'パンツ', '変態', '奴隷', '犯して']);

const TAG_RULES = [
    { tag: '潮吹', weight: 1.35, terms: ['潮吹', '喷水', '失禁', '绝顶', '痉挛', '潮吹き'] },
    { tag: '内射', weight: 1.3, terms: ['内射', '中出', '射进去', '射在里面', '射满', '中出し', '射精', '精液', '精子', '吞精', '吞下去', '吞掉'] },
    { tag: '深喉', weight: 1.25, terms: ['深喉', '喉咙深处', 'イラマ'] },
    { tag: '调教', weight: 1.2, terms: ['调教', '性奴', '奴隶', '母狗', '屈辱', '羞耻', '羞辱', '惩罚', '調教', '奴隷', '变态', '変態', '跪下', '蹲下', '趴下', '看着镜头', '催眠', '媚药', '春药', '下药'] },
    { tag: '背德', weight: 1.15, terms: ['偷情', '出轨', '绿帽', '丈夫的错', '对不起老公', '别被发现', '不能被发现', '别出声', '不要出声', '侵犯', '强奸', '强暴', '犯して', '老公', '丈夫', '社长', '部长', '秘密', '偷拍'] },
    { tag: '口交', weight: 1.1, terms: ['口交', '口爆', '颜射', '舔', '吮吸', '吸吮', '含住', '张开嘴', 'フェラ', '舐めて', '给我吃', '想舔'] },
    { tag: '脱衣', weight: 1.05, terms: ['脱掉', '脱衣服', '脱光', '脱下来', '掀开', '扒开', '掰开', '内裤', '胖次', '丁字裤', '胸罩', '内衣', '丝袜', '黑丝', '白丝', '超短裙', '没穿内裤', '脱いで', 'パンツ', '裙子'] },
    { tag: '挑逗', weight: 1.0, terms: ['诱惑', '勾引', '挑逗', '色诱', '忍不住', '憋不住', '饥渴', '性欲', '发骚', '色情', '下流', '好色', '色狼', '发情', '湿透', '想做爱'] },
    { tag: '前戏', weight: 0.95, terms: ['乳头', '奶头', '乳房', '巨乳', '奶子', '胸部', '揉胸', '摸胸', '吸奶', '乳交', '乳首', 'おっぱい', '舌吻', 'キス', '按摩', '精油', '敏感带', '敏感'] },
    { tag: '高能', weight: 0.85, terms: ['抽插', '猛插', '狠插', '顶到', '插进去', '插进来', '插到', '后入', '骑乘', '肉棒', '鸡巴', '老二', '大吊', '大屌', '阳具', '阴茎', '龟头', '小穴', '骚穴', '嫩穴', '蜜穴', '阴道', '阴蒂', '挿入', 'マンコ', 'ちんぽ', 'チンポ'] }
];

const TAG_TERM_LOOKUP = (() => {
    const map = new Map();
    TAG_RULES.forEach((rule, idx) => {
        rule.terms.forEach((term) => {
            if (!map.has(term)) map.set(term, { tag: rule.tag, weight: rule.weight, order: idx });
        });
    });
    return map;
})();

const SORTED_STRONG_ACT = [...STRONG_ACT].sort((a, b) => b.length - a.length);
const SORTED_STRONG_PLOT = [...STRONG_PLOT].sort((a, b) => b.length - a.length);
const SORTED_CONTEXT_PLOT = [...CONTEXT_PLOT].sort((a, b) => b.length - a.length);
const SORTED_JA_BOOST = [...JA_BOOST].sort((a, b) => b.length - a.length);

function collectMatchedTerms(text, lexicon) {
    if (!text) return [];
    const hits = [];
    for (const term of lexicon) {
        if (text.includes(term)) hits.push(term);
    }
    return hits;
}

function getCodePointOffsets(str) {
    const offsets = [0];
    let i = 0;
    while (i < str.length) {
        const cp = str.codePointAt(i);
        i += cp > 0xffff ? 2 : 1;
        offsets.push(i);
    }
    return offsets;
}

/**
 * 将匹配到的词条精准定位回原始字幕文本的 UTF-16 起止索引，兼容繁体字幕
 * @param {string} origText
 * @param {Array<{term: string, kind: 'plot'|'act'}>} termEntries
 * @returns {Array<{start: number, end: number, kind: 'plot'|'act', term: string}>}
 */
export function findHighlightRanges(origText, termEntries) {
    const raw = String(origText || '');
    if (!raw || !Array.isArray(termEntries) || termEntries.length === 0) return [];

    const simpText = convertChineseText(raw, 'zh');
    const cpOffsets = getCodePointOffsets(raw);
    const cpCount = cpOffsets.length - 1;
    const candidates = [];

    const sortedEntries = [...termEntries].sort((a, b) => b.term.length - a.term.length);

    for (const { term, kind } of sortedEntries) {
        if (!term) continue;
        if (!raw.includes(term) && !simpText.includes(term)) continue;

        const termCpLen = Array.from(term).length;
        if (termCpLen === 0 || termCpLen > cpCount) continue;

        let matched = false;
        for (let k = 0; k <= cpCount - termCpLen; k++) {
            const start = cpOffsets[k];
            const end = cpOffsets[k + termCpLen];
            const slice = raw.slice(start, end);
            if (slice === term || convertChineseText(slice, 'zh') === term) {
                candidates.push({ start, end, kind, term });
                matched = true;
            }
        }

        if (!matched) {
            let fromIdx = 0;
            while (fromIdx < raw.length) {
                const pos = raw.indexOf(term, fromIdx);
                if (pos < 0) break;
                candidates.push({ start: pos, end: pos + term.length, kind, term });
                fromIdx = pos + term.length;
            }
        }
    }

    if (candidates.length === 0) return [];

    candidates.sort((a, b) => {
        const lenDiff = (b.end - b.start) - (a.end - a.start);
        if (lenDiff !== 0) return lenDiff;
        if (a.kind !== b.kind) return a.kind === 'act' ? -1 : 1;
        return a.start - b.start;
    });

    const accepted = [];
    for (const item of candidates) {
        const overlaps = accepted.some((kept) => item.start < kept.end && item.end > kept.start);
        if (!overlaps) accepted.push(item);
    }

    return accepted.sort((a, b) => a.start - b.start);
}

/**
 * 将一组命中词条浓缩映射为 2-4 字苹果人本化剧情标签
 * @param {Iterable<string>} terms
 * @returns {string}
 */
export function resolvePlotTag(terms) {
    const scores = new Map();
    for (const term of terms || []) {
        const info = TAG_TERM_LOOKUP.get(term);
        if (!info) continue;
        const prev = scores.get(info.tag) || { tag: info.tag, score: 0, order: info.order };
        prev.score += info.weight;
        scores.set(info.tag, prev);
    }
    if (scores.size === 0) return '高能';
    return [...scores.values()].sort((a, b) => {
        const diff = b.score - a.score;
        return Math.abs(diff) > 1e-6 ? diff : a.order - b.order;
    })[0].tag;
}

function buildCuePreview(text) {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 36) return cleaned;
    return `${cleaned.slice(0, 35)}…`;
}

function createDegradedResult(hitRate = 0) {
    return {
        available: false,
        anchors: [],
        cueHighlights: new Map(),
        highlightCueIndices: new Set(),
        hitRate
    };
}

/**
 * 扫描字幕时间轴，提取剧情锚点与带 30s 冷却的高亮词条映射
 * @param {Array<{start:number,end:number,text:string,secondaryText?:string,jaText?:string}>} cues
 * @param {{
 *   langInfo?: Object|null,
 *   quality?: Object|null,
 *   maxAnchors?: number,
 *   minSeparationSec?: number,
 *   cooldownSec?: number
 * }} [options]
 */
export function analyzeSubtitlePlot(
    cues,
    { langInfo = null, quality = null, maxAnchors = 6, minSeparationSec = 180, cooldownSec = 30 } = {}
) {
    if (!Array.isArray(cues) || cues.length === 0 || quality?.grade === 'broken' || langInfo?.isCorrupted) {
        return createDegradedResult(0);
    }

    // Step 1: 逐条扫描四类信号并对 CONTEXT_PLOT 执行 ±30s 门控
    const records = cues.map((cue, index) => {
        const origText = String(cue?.text || '');
        const simpText = convertChineseText(origText, 'zh').trim();
        const jaSource = String(cue?.secondaryText || cue?.jaText || cue?.text || '');
        const actHits = collectMatchedTerms(simpText, SORTED_STRONG_ACT);
        const plotHits = collectMatchedTerms(simpText, SORTED_STRONG_PLOT);
        const contextHits = collectMatchedTerms(simpText, SORTED_CONTEXT_PLOT);
        const jaHits = collectMatchedTerms(jaSource, SORTED_JA_BOOST);
        const jaInOrigHits = jaSource === origText ? jaHits : collectMatchedTerms(origText, SORTED_JA_BOOST);

        return {
            index,
            start: Number(cue?.start) || 0,
            end: Number(cue?.end) || 0,
            origText,
            simpText,
            jaSource,
            actHits,
            plotHits,
            contextHits,
            jaHits,
            jaInOrigHits,
            hasStrong: actHits.length > 0 || plotHits.length > 0 || jaHits.length > 0,
            gatedContextHits: []
        };
    });

    const orderedRecords = [...records].sort((a, b) => a.start - b.start || a.index - b.index);

    const strongTimes = [];
    for (const rec of orderedRecords) {
        if (rec.hasStrong) strongTimes.push(rec.start);
    }

    let strongCursor = 0;
    let rawHitCues = 0;
    for (const rec of orderedRecords) {
        if (rec.contextHits.length > 0 && strongTimes.length > 0) {
            while (strongCursor < strongTimes.length && strongTimes[strongCursor] < rec.start - 30) {
                strongCursor += 1;
            }
            if (strongCursor < strongTimes.length && Math.abs(strongTimes[strongCursor] - rec.start) <= 30) {
                rec.gatedContextHits = rec.contextHits;
            }
        }

        if (rec.hasStrong || rec.gatedContextHits.length > 0) {
            rawHitCues += 1;
        }
    }

    const hitRate = cues.length > 0 ? rawHitCues / cues.length : 0;
    if (rawHitCues === 0) {
        return createDegradedResult(hitRate);
    }

    // Step 2: 60s 滑动窗口（步长 15s）评分 + 起势跃迁加权
    const minStart = orderedRecords[0].start;
    const maxStart = orderedRecords[orderedRecords.length - 1].start;
    const maxEnd = Math.max(maxStart, orderedRecords[orderedRecords.length - 1].end);
    const duration = Math.max(0, maxEnd - minStart);
    const gridStart = Math.max(0, Math.floor(minStart / 15) * 15);

    const windows = [];
    let leftIdx = 0;
    for (let wStart = gridStart; wStart <= maxStart || windows.length === 0; wStart += 15) {
        const wEnd = wStart + 60;
        while (leftIdx < orderedRecords.length && orderedRecords[leftIdx].start < wStart) {
            leftIdx += 1;
        }

        const seenSimp = new Set();
        const actSet = new Set();
        const plotSet = new Set();
        const ctxSet = new Set();
        const jaSet = new Set();
        const windowCues = [];

        for (let i = leftIdx; i < orderedRecords.length && orderedRecords[i].start < wEnd; i++) {
            const rec = orderedRecords[i];
            windowCues.push(rec);
            const dedupeKey = rec.simpText || rec.jaSource.trim();
            if (!dedupeKey || seenSimp.has(dedupeKey)) continue;
            seenSimp.add(dedupeKey);

            rec.actHits.forEach((t) => actSet.add(t));
            rec.plotHits.forEach((t) => plotSet.add(t));
            rec.gatedContextHits.forEach((t) => ctxSet.add(t));
            rec.jaHits.forEach((t) => jaSet.add(t));
        }

        const activeCategories =
            (actSet.size > 0 ? 1 : 0) +
            (plotSet.size > 0 ? 1 : 0) +
            (ctxSet.size > 0 ? 1 : 0) +
            (jaSet.size > 0 ? 1 : 0);
        const diversityBonus = activeCategories > 1 ? (activeCategories - 1) * 0.8 : 0;

        const baseScore =
            plotSet.size * 2.6 +
            actSet.size * 2.2 +
            ctxSet.size * 1.4 +
            jaSet.size * 2.2 +
            diversityBonus;

        windows.push({
            wStart,
            wEnd,
            baseScore,
            windowCues,
            allTerms: [...plotSet, ...actSet, ...ctxSet, ...jaSet]
        });

        if (wStart + 15 > maxStart && windows.length >= 1) break;
    }

    const scoredWindows = windows.map((win, idx) => {
        const prevBase = idx >= 4 ? windows[idx - 4].baseScore : 0;
        const onsetBonus = idx >= 4 ? 0.35 * Math.max(0, win.baseScore - prevBase) : 0;
        return {
            ...win,
            finalScore: win.baseScore + onsetBonus
        };
    });

    // Step 3: 贪心非极大值抑制 (NMS) 提取最终锚点
    const effectiveMinSep = duration < 600 ? Math.max(45, Math.floor(duration / 6)) : minSeparationSec;
    const scoreThreshold = cues.length < 40 ? 2.2 : 4.2;

    const candidates = scoredWindows
        .filter((win) => win.finalScore >= scoreThreshold && win.windowCues.length > 0)
        .map((win) => {
            let bestRec = null;
            let bestCueScore = -1;
            for (const rec of win.windowCues) {
                const cueScore =
                    rec.plotHits.length * 2.6 +
                    rec.actHits.length * 2.2 +
                    rec.gatedContextHits.length * 1.4 +
                    rec.jaHits.length * 2.2;
                if (cueScore > bestCueScore) {
                    bestCueScore = cueScore;
                    bestRec = rec;
                }
            }
            return { win, bestRec, bestCueScore };
        })
        .filter((item) => item.bestRec && item.bestCueScore > 0)
        .sort((a, b) => {
            const diff = b.win.finalScore - a.win.finalScore;
            return Math.abs(diff) > 1e-6 ? diff : a.win.wStart - b.win.wStart;
        });

    const selected = [];
    for (const item of candidates) {
        if (selected.length >= maxAnchors) break;
        const tooClose = selected.some((sel) => Math.abs(sel.bestRec.start - item.bestRec.start) < effectiveMinSep);
        if (!tooClose) {
            selected.push(item);
        }
    }

    selected.sort((a, b) => a.bestRec.start - b.bestRec.start);

    const anchors = selected.map(({ win, bestRec }) => ({
        start: bestRec.start,
        cueIndex: bestRec.index,
        tag: resolvePlotTag(win.allTerms),
        preview: buildCuePreview(bestRec.origText || bestRec.jaSource),
        score: Math.round(win.finalScore * 100) / 100,
        source: 'local'
    }));

    // Step 5 前置诚实降级检查：若无有效锚点或长片密度不足 1.2%，整体静默退化
    if (anchors.length === 0 || (cues.length >= 80 && hitRate < 0.012)) {
        return createDegradedResult(hitRate);
    }

    // Step 4: 构建带 30s 词条冷却的高亮词表与高亮字幕索引
    const anchorCueIndices = new Set(anchors.map((a) => a.cueIndex));
    const lastTermTime = new Map();
    const cueHighlights = new Map();
    const highlightCueIndices = new Set();

    for (const rec of orderedRecords) {
        const isAnchor = anchorCueIndices.has(rec.index);
        const termMap = new Map();

        rec.actHits.forEach((term) => termMap.set(term, 'act'));
        rec.plotHits.forEach((term) => {
            if (!termMap.has(term)) termMap.set(term, 'plot');
        });
        rec.gatedContextHits.forEach((term) => {
            if (!termMap.has(term)) termMap.set(term, 'plot');
        });
        rec.jaInOrigHits.forEach((term) => {
            if (!termMap.has(term)) termMap.set(term, JA_PLOT_TERMS.has(term) ? 'plot' : 'act');
        });

        const keptEntries = [];
        for (const [term, kind] of termMap.entries()) {
            const lastSeen = lastTermTime.get(term);
            if (!isAnchor && lastSeen !== undefined && rec.start - lastSeen < cooldownSec) {
                continue;
            }
            keptEntries.push({ term, kind });
            lastTermTime.set(term, rec.start);
        }

        if (keptEntries.length > 0) {
            const ranges = findHighlightRanges(rec.origText, keptEntries);
            if (ranges.length > 0) {
                cueHighlights.set(rec.index, ranges);
                highlightCueIndices.add(rec.index);
            }
        }

        if (isAnchor) {
            highlightCueIndices.add(rec.index);
        }
    }

    return {
        available: true,
        anchors,
        cueHighlights,
        highlightCueIndices,
        hitRate
    };
}

function createTextNodeSafe(doc, content) {
    if (typeof doc?.createTextNode === 'function') {
        return doc.createTextNode(content);
    }
    const span = doc.createElement('span');
    span.textContent = content;
    return span;
}

/**
 * 使用纯 DOM 节点构建带词条高亮的字幕片段，兼容真实 DocumentFragment 与测试 FakeElement
 * @param {string} text
 * @param {Array<{start: number, end: number, kind?: string, term?: string}>} ranges
 * @param {Document} [doc]
 * @returns {DocumentFragment|Array<Node>}
 */
export function buildHighlightedCueFragment(text, ranges, doc = document) {
    const raw = String(text || '');
    const nodes = [];

    const validRanges = (Array.isArray(ranges) ? ranges : [])
        .filter((r) => r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.start >= 0 && r.end > r.start && r.start < raw.length)
        .map((r) => ({
            start: Math.max(0, Math.floor(r.start)),
            end: Math.min(raw.length, Math.floor(r.end)),
            kind: r.kind === 'act' ? 'act' : 'plot'
        }))
        .sort((a, b) => a.start - b.start);

    let cursor = 0;
    for (const range of validRanges) {
        if (range.start < cursor) continue;
        if (range.start > cursor) {
            nodes.push(createTextNodeSafe(doc, raw.slice(cursor, range.start)));
        }
        const mark = doc.createElement('mark');
        mark.className = `mp-sub-hl mp-sub-hl--${range.kind}`;
        mark.textContent = raw.slice(range.start, range.end);
        nodes.push(mark);
        cursor = range.end;
    }

    if (cursor < raw.length || nodes.length === 0) {
        nodes.push(createTextNodeSafe(doc, raw.slice(cursor)));
    }

    if (typeof doc?.createDocumentFragment === 'function') {
        const frag = doc.createDocumentFragment();
        nodes.forEach((node) => frag.appendChild(node));
        return frag;
    }

    return nodes;
}
