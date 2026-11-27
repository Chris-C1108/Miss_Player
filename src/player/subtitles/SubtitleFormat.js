/**
 * SubtitleFormat — 字幕文本解析与标准化层
 *
 * 支持 SRT / ASS(SSA) / WebVTT 三种主流格式，输出统一 cue 模型：
 * `{ start: 秒, end: 秒, text: 纯文本 }`
 * 解析结果直接供播放器内嵌渲染层消费，也可标准化转为 WebVTT。
 */

const HTML_ENTITIES = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
};

/** 每条字幕行末尾的标点（句读与收尾引号括号），统一剔除 */
const TRAILING_PUNCTUATION = /[。．.，,、；;：:！!？?…⋯~～·\-—"'“”‘’）)】」』》〉\]]+$/;

export function stripTrailingPunctuation(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line.replace(TRAILING_PUNCTUATION, '').trimEnd())
        .filter((line) => line.length > 0)
        .join('\n');
}

/**
 * 剥离特效标签、BOM 与控制符，保留可读纯文本
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeCueText(raw) {
    let text = String(raw || '');
    text = text.replace(/\uFEFF/g, '');            // 清除文件头与 OCR 混入行中的零宽 BOM
    text = text.replace(/\{[^}]*\}/g, '');          // ASS 覆写标签 {\pos(...)} {\fad(...)}
    text = text.replace(/<[^>]+>/g, '');            // SRT/VTT 内联样式 <i> <font>
    text = text.replace(/\\[Nn]/g, '\n');           // ASS 强制换行
    text = text.replace(/\\h/g, ' ');               // ASS 硬空格
    text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    text = text.replace(/&(nbsp|amp|lt|gt|quot|#39);/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m);
    text = text.replace(/\r/g, '');
    text = text
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim().replace(TRAILING_PUNCTUATION, '').trimEnd())
        .filter((line) => line.length > 0)
        .join('\n');
    return text.trim();
}

/**
 * 探测字幕格式
 * @param {string} text
 * @param {string} [hint] 文件名或扩展名提示
 * @returns {'srt'|'ass'|'vtt'}
 */
export function detectSubtitleFormat(text, hint = '') {
    const hinted = String(hint || '').toLowerCase();
    if (/\.vtt\b/.test(hinted)) return 'vtt';
    if (/\.(ass|ssa)\b/.test(hinted)) return 'ass';
    if (/\.srt\b/.test(hinted)) return 'srt';

    const head = String(text || '').replace(/\uFEFF/g, '').slice(0, 800);
    if (/^\s*WEBVTT/.test(head)) return 'vtt';
    if (/\[Script Info\]/i.test(head) || /\[Events\]/i.test(head) || /^\s*Dialogue\s*:/im.test(head)) return 'ass';
    return 'srt';
}

function normalizeTimeToken(raw) {
    return String(raw || '').replace(/：/g, ':').replace(/，/g, ',').replace(/．/g, '.').trim();
}

function parseTimestamp(raw, { allowShort = false } = {}) {
    const str = normalizeTimeToken(raw);
    const full = str.match(/^(\d{1,3}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
    if (full) {
        const ms = full[4] ? parseFloat(`0.${full[4]}`) : 0;
        return parseInt(full[1], 10) * 3600 + parseInt(full[2], 10) * 60 + parseInt(full[3], 10) + ms;
    }
    if (allowShort) {
        const short = str.match(/^(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
        if (short) {
            const ms = short[3] ? parseFloat(`0.${short[3]}`) : 0;
            return parseInt(short[1], 10) * 60 + parseInt(short[2], 10) + ms;
        }
    }
    return NaN;
}

const TIME_RANGE_LINE_RE = /^\s*([\d:：.,，]+)\s*(?:-{1,2}>|—>|→)\s*([\d:：.,，]+)(?:\s+.*)?$/;

function parseTimeRangeLine(line, allowShortTime) {
    const m = String(line || '').match(TIME_RANGE_LINE_RE);
    if (!m) return null;
    const start = parseTimestamp(m[1], { allowShort: allowShortTime });
    if (!Number.isFinite(start)) return null;
    const end = parseTimestamp(m[2], { allowShort: allowShortTime });
    return { start, end };
}

function normalizeCues(cues) {
    const clean = cues
        .filter((cue) => Number.isFinite(cue.start) && cue.text)
        .map((cue) => {
            const end = Number.isFinite(cue.end) && cue.end > cue.start ? cue.end : cue.start + 2;
            return { start: Math.max(0, cue.start), end, text: cue.text };
        })
        .sort((a, b) => a.start - b.start);
    return clean.filter((cue, idx) => idx === 0 || Math.abs(cue.start - clean[idx - 1].start) > 0.001 || cue.text !== clean[idx - 1].text);
}

/**
 * 基于 `-->` 时间轴行锚定的状态机解析器：
 * 兼容缺失块间空行的 SRT（如 KIRM-014 等压制源）与 WebVTT NOTE/STYLE/REGION 元数据块。
 */
function parseSrtLike(text, allowShortTime = false) {
    const normalized = String(text || '').replace(/\r\n?/g, '\n').replace(/\uFEFF/g, '');
    const lines = normalized.split('\n').map((line) => line.trim());
    const cues = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (/^(NOTE|STYLE|REGION)(?:\s|$)/i.test(line)) {
            while (i + 1 < lines.length && lines[i + 1] !== '') {
                i++;
            }
            continue;
        }

        const range = parseTimeRangeLine(line, allowShortTime);
        if (!range) continue;

        const bodyLines = [];
        let j = i + 1;
        let hitNextTimestamp = false;
        while (j < lines.length) {
            const nextLine = lines[j];
            if (nextLine === '') {
                j++;
                break;
            }
            if (parseTimeRangeLine(nextLine, allowShortTime)) {
                hitNextTimestamp = true;
                break;
            }
            bodyLines.push(nextLine);
            j++;
        }

        if (hitNextTimestamp && bodyLines.length && /^\d+$/.test(bodyLines[bodyLines.length - 1])) {
            bodyLines.pop();
        }
        i = j - 1;

        const body = sanitizeCueText(bodyLines.join('\n'));
        if (!body) continue;
        cues.push({ start: range.start, end: range.end, text: body });
    }
    return cues;
}

function parseAss(text) {
    const lines = String(text || '').replace(/\uFEFF/g, '').replace(/\r\n?/g, '\n').split('\n');
    const cues = [];
    let inEvents = false;
    let fields = ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];

    for (const line of lines) {
        const trimmed = line.trim();
        if (/^\[.*\]$/.test(trimmed)) {
            inEvents = /^\[events\]$/i.test(trimmed);
            continue;
        }
        if (!inEvents) continue;
        if (/^format\s*:/i.test(trimmed)) {
            const declared = trimmed.slice(trimmed.indexOf(':') + 1).split(',').map((f) => f.trim().toLowerCase());
            if (declared.length >= 3) fields = declared;
            continue;
        }
        if (!/^dialogue\s*:/i.test(trimmed)) continue;

        const body = line.slice(line.indexOf(':') + 1);
        const parts = body.split(',');
        const startIdx = fields.indexOf('start');
        const endIdx = fields.indexOf('end');
        const textIdx = fields.indexOf('text');
        if (startIdx < 0 || endIdx < 0 || textIdx < 0) continue;
        // Text 是最后一个字段（内部可能含逗号），需把多余分段重新合并
        const tail = parts.slice(textIdx).join(',');
        const cells = parts.slice(0, textIdx);
        cells[textIdx] = tail;

        const start = parseTimestamp(cells[startIdx]);
        const end = parseTimestamp(cells[endIdx]);
        const content = sanitizeCueText(tail);
        if (!content) continue;
        cues.push({ start, end, text: content });
    }
    return cues;
}

/**
 * 解析字幕文本为统一 cue 列表
 * @param {string} text
 * @param {string} [hint] 文件名 / 扩展名 / 格式提示
 * @returns {{format: 'srt'|'ass'|'vtt', cues: Array<{start:number,end:number,text:string}>}}
 */
export function parseSubtitles(text, hint = '') {
    const cleanText = String(text || '').replace(/\uFEFF/g, '');
    const format = detectSubtitleFormat(cleanText, hint);
    let cues = [];
    if (format === 'ass') {
        cues = parseAss(cleanText);
    } else if (format === 'vtt') {
        cues = parseSrtLike(cleanText.replace(/^\s*WEBVTT[^\n]*(\n|$)/i, ''), true);
    } else {
        cues = parseSrtLike(cleanText);
    }
    return { format, cues: normalizeCues(cues) };
}

function formatVttTime(seconds) {
    const total = Math.max(0, seconds);
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = Math.floor(total % 60);
    const ms = Math.round((total - Math.floor(total)) * 1000);
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(ms, 3)}`;
}

/**
 * cue 列表转 WebVTT 文本（可直接 Blob 挂载到 <track>）
 * @param {Array<{start:number,end:number,text:string}>} cues
 * @returns {string}
 */
export function cuesToVtt(cues) {
    const lines = ['WEBVTT', ''];
    (cues || []).forEach((cue) => {
        lines.push(`${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}`);
        lines.push(cue.text);
        lines.push('');
    });
    return lines.join('\n');
}

/**
 * 字幕转纯文本（导出 / 分享用）
 * @param {Array<{start:number,text:string}>} cues
 * @returns {string}
 */
export function cuesToPlainText(cues) {
    return (cues || []).map((cue) => cue.text).join('\n');
}
