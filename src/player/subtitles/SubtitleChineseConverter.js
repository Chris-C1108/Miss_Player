/**
 * SubtitleChineseConverter — 零依赖字幕简繁双向转换器
 *
 * 结合常用汉字单字双表与字幕高频多对一词组消歧表，
 * 支持 SRT / ASS(SSA) / WebVTT 格式保真转换（跳过时间戳、样式区块与覆写标签）。
 */

import { S2T_FROM, S2T_TO, T2S_FROM, T2S_TO } from './SubtitleChineseMaps.js';
import { detectSubtitleFormat } from './SubtitleFormat.js';

const S2T_PHRASE_PAIRS = [
    ['为什么', '為什麼'],
    ['干什么', '幹什麼'],
    ['方便面', '方便麵'],
    ['松一口气', '鬆一口氣'],
    ['什么', '什麼'],
    ['怎么', '怎麼'],
    ['这么', '這麼'],
    ['那么', '那麼'],
    ['多么', '多麼'],
    ['干嘛', '幹嘛'],
    ['干啥', '幹啥'],
    ['干活', '幹活'],
    ['能干', '能幹'],
    ['才干', '才幹'],
    ['骨干', '骨幹'],
    ['干部', '幹部'],
    ['干脆', '乾脆'],
    ['头发', '頭髮'],
    ['短发', '短髮'],
    ['长发', '長髮'],
    ['白发', '白髮'],
    ['黑发', '黑髮'],
    ['金发', '金髮'],
    ['假发', '假髮'],
    ['理发', '理髮'],
    ['染发', '染髮'],
    ['脱发', '脫髮'],
    ['毛发', '毛髮'],
    ['发型', '髮型'],
    ['发卡', '髮卡'],
    ['发夹', '髮夾'],
    ['皇后', '皇后'],
    ['王后', '王后'],
    ['太后', '太后'],
    ['天后', '天后'],
    ['里面', '裡面'],
    ['里边', '裡邊'],
    ['这里', '這裡'],
    ['那里', '那裡'],
    ['哪里', '哪裡'],
    ['心里', '心裡'],
    ['家里', '家裡'],
    ['夜里', '夜裡'],
    ['嘴里', '嘴裡'],
    ['怀里', '懷裡'],
    ['眼里', '眼裡'],
    ['手里', '手裡'],
    ['屋里', '屋裡'],
    ['水里', '水裡'],
    ['村里', '村裡'],
    ['店里', '店裡'],
    ['车里', '車裡'],
    ['梦里', '夢裡'],
    ['暗里', '暗裡'],
    ['私里', '私裡'],
    ['公里', '公里'],
    ['英里', '英里'],
    ['海里', '海里'],
    ['里程', '里程'],
    ['一面', '一面'],
    ['下面', '下面'],
    ['上面', '上面'],
    ['前面', '前面'],
    ['后面', '後面'],
    ['方面', '方面'],
    ['表面', '表面'],
    ['面部', '面部'],
    ['画面', '畫面'],
    ['面子', '面子'],
    ['面对', '面對'],
    ['面条', '麵條'],
    ['泡面', '泡麵'],
    ['拉面', '拉麵'],
    ['面包', '麵包'],
    ['面粉', '麵粉'],
    ['炒面', '炒麵'],
    ['汤面', '湯麵'],
    ['只身', '隻身'],
    ['一只', '一隻'],
    ['两只', '兩隻'],
    ['几只', '幾隻'],
    ['单只', '單隻'],
    ['只是', '只是'],
    ['只要', '只要'],
    ['只有', '只有'],
    ['只好', '只好'],
    ['只能', '只能'],
    ['不过', '不過'],
    ['台风', '颱風'],
    ['台湾', '台灣'],
    ['舞台', '舞台'],
    ['平台', '平台'],
    ['后台', '後台'],
    ['轻松', '輕鬆'],
    ['放松', '放鬆'],
    ['松开', '鬆開'],
    ['松手', '鬆手'],
    ['松懈', '鬆懈'],
    ['蓬松', '蓬鬆'],
    ['胡子', '鬍子'],
    ['胡须', '鬍鬚'],
    ['刮胡', '刮鬍'],
    ['分钟', '分鐘'],
    ['钟头', '鐘頭'],
    ['钟表', '鐘錶'],
    ['手表', '手錶'],
    ['闹钟', '鬧鐘'],
    ['复杂', '複雜'],
    ['重复', '重複'],
    ['反复', '反覆'],
    ['恢复', '恢復'],
    ['报复', '報復'],
    ['关系', '關係'],
    ['联系', '聯繫'],
    ['系列', '系列'],
    ['系统', '系統'],
    ['制作', '製作'],
    ['制造', '製造'],
    ['复制', '複製'],
    ['控制', '控制'],
    ['制服', '制服'],
    ['注意', '注意'],
    ['关注', '關注'],
    ['注册', '註冊'],
    ['注释', '註釋'],
    ['游戏', '遊戲'],
    ['旅游', '旅遊'],
    ['游泳', '游泳'],
    ['准备', '準備'],
    ['标准', '標準'],
    ['准确', '準確'],
    ['计划', '計劃'],
    ['划算', '划算'],
    ['脏话', '髒話'],
    ['肮脏', '骯髒'],
    ['弄脏', '弄髒'],
    ['心脏', '心臟'],
    ['内脏', '內臟'],
    ['云朵', '雲朵'],
    ['风云', '風雲'],
    ['云端', '雲端'],
    ['斗嘴', '鬥嘴'],
    ['战斗', '戰鬥'],
    ['斗争', '鬥爭'],
    ['丑陋', '醜陋'],
    ['小丑', '小醜'],
    ['出丑', '出醜'],
    ['家伙', '傢伙'],
    ['伙伴', '夥伴'],
    ['多余', '多餘'],
    ['剩余', '剩餘'],
    ['其余', '其餘'],
    ['余地', '餘地'],
    ['历来', '歷來'],
    ['历史', '歷史'],
    ['经历', '經歷'],
    ['日历', '日曆'],
    ['农历', '農曆'],
    ['采集', '採集'],
    ['采用', '採用'],
    ['采访', '採訪'],
    ['合适', '合適'],
    ['合作', '合作'],
    ['著名', '著名'],
    ['著作', '著作'],
    ['显著', '顯著'],
    ['看着', '看著'],
    ['听着', '聽著'],
    ['笑着', '笑著'],
    ['哭着', '哭著'],
    ['等着', '等著'],
    ['拿着', '拿著'],
    ['穿着', '穿著'],
    ['躺着', '躺著'],
    ['坐着', '坐著'],
    ['站着', '站著'],
    ['走着', '走著'],
    ['睡着', '睡著']
];

const T2S_PHRASE_PAIRS = [
    ['為什麼', '为什么'],
    ['幹什麼', '干什么'],
    ['什麼', '什么'],
    ['甚麼', '什么'],
    ['怎麼', '怎么'],
    ['這麼', '这么'],
    ['那麼', '那么'],
    ['多麼', '多么'],
    ['著名', '著名'],
    ['著作', '著作'],
    ['顯著', '显著'],
    ['著稱', '著称'],
    ['執著', '执着']
];

let cachedRuntime = null;

function buildMap(fromStr, toStr) {
    const map = new Map();
    const fromChars = Array.from(fromStr);
    const toChars = Array.from(toStr);
    const len = Math.min(fromChars.length, toChars.length);
    for (let i = 0; i < len; i++) {
        map.set(fromChars[i], toChars[i]);
    }
    return map;
}

function compilePhraseEngine(pairs) {
    const sorted = pairs.slice().sort((a, b) => b[0].length - a[0].length);
    const dict = new Map(sorted);
    const escaped = sorted.map(([key]) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = escaped.length ? new RegExp(escaped.join('|'), 'g') : null;
    return { dict, regex };
}

function getRuntime() {
    if (cachedRuntime) return cachedRuntime;
    const s2tMap = buildMap(S2T_FROM, S2T_TO);
    const t2sMap = buildMap(T2S_FROM, T2S_TO);
    const simpDistinct = new Set();
    const tradDistinct = new Set();

    for (const ch of s2tMap.keys()) {
        if (!t2sMap.has(ch)) simpDistinct.add(ch);
    }
    for (const ch of t2sMap.keys()) {
        if (!s2tMap.has(ch)) tradDistinct.add(ch);
    }

    cachedRuntime = {
        s2tMap,
        t2sMap,
        simpDistinct,
        tradDistinct,
        s2tPhrases: compilePhraseEngine(S2T_PHRASE_PAIRS),
        t2sPhrases: compilePhraseEngine(T2S_PHRASE_PAIRS)
    };
    return cachedRuntime;
}

function mapChars(segment, charMap) {
    let out = '';
    for (const ch of segment) {
        out += charMap.get(ch) || ch;
    }
    return out;
}

/**
 * 探测文本主体属于简体中文还是繁体中文
 * @param {string} text
 * @returns {'zh'|'zh-TW'|''}
 */
export function detectChineseScript(text) {
    const sample = String(text || '');
    if (!sample) return '';
    const { simpDistinct, tradDistinct } = getRuntime();
    let simpCount = 0;
    let tradCount = 0;
    let seen = 0;
    for (const ch of sample) {
        if (++seen > 6000) break;
        if (simpDistinct.has(ch)) simpCount++;
        else if (tradDistinct.has(ch)) tradCount++;
    }
    if (!simpCount && !tradCount) return '';
    if (tradCount > simpCount) return 'zh-TW';
    if (simpCount > tradCount) return 'zh';
    return '';
}

/**
 * 将中文文本转换为指定目标变体（'zh' 为简体，'zh-TW' 为繁体）
 * @param {string} text
 * @param {'zh'|'zh-TW'} targetLang
 * @returns {string}
 */
export function convertChineseText(text, targetLang) {
    const input = String(text || '');
    if (!input || (targetLang !== 'zh' && targetLang !== 'zh-TW')) return input;

    const runtime = getRuntime();
    const charMap = targetLang === 'zh' ? runtime.t2sMap : runtime.s2tMap;
    const { dict, regex } = targetLang === 'zh' ? runtime.t2sPhrases : runtime.s2tPhrases;

    if (!regex) {
        return mapChars(input, charMap);
    }

    let out = '';
    let lastIndex = 0;
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(input)) !== null) {
        if (match.index > lastIndex) {
            out += mapChars(input.slice(lastIndex, match.index), charMap);
        }
        out += dict.get(match[0]) || match[0];
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < input.length) {
        out += mapChars(input.slice(lastIndex), charMap);
    }
    return out;
}

function convertTaggedDialogueLine(line, targetLang, { assMode = false } = {}) {
    if (!line) return line;
    const tokenRe = assMode ? /(\{[^}]*\}|\\[Nnh])/g : /(<[^>]+>)/g;
    let out = '';
    let lastIndex = 0;
    let match;
    while ((match = tokenRe.exec(line)) !== null) {
        if (match.index > lastIndex) {
            out += convertChineseText(line.slice(lastIndex, match.index), targetLang);
        }
        out += match[0];
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
        out += convertChineseText(line.slice(lastIndex), targetLang);
    }
    return out;
}

function convertAssContent(raw, targetLang) {
    const lines = raw.split(/\r\n|\r|\n/);
    let inEvents = false;
    let textFieldIndex = 9;
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';

    return lines
        .map((line) => {
            const trimmed = line.trim();
            if (/^\[.*\]$/.test(trimmed)) {
                inEvents = /^\[events\]$/i.test(trimmed);
                return line;
            }
            if (!inEvents) return line;
            if (/^format\s*:/i.test(trimmed)) {
                const declared = trimmed.slice(trimmed.indexOf(':') + 1).split(',').map((f) => f.trim().toLowerCase());
                const idx = declared.indexOf('text');
                if (idx >= 0) textFieldIndex = idx;
                return line;
            }
            if (!/^dialogue\s*:/i.test(trimmed)) return line;

            const colonIdx = line.indexOf(':');
            const prefix = line.slice(0, colonIdx + 1);
            const body = line.slice(colonIdx + 1);
            const parts = body.split(',');
            if (parts.length <= textFieldIndex) return line;

            const head = parts.slice(0, textFieldIndex).join(',');
            const tail = parts.slice(textFieldIndex).join(',');
            const convertedTail = convertTaggedDialogueLine(tail, targetLang, { assMode: true });
            return `${prefix}${head},${convertedTail}`;
        })
        .join(eol);
}

function convertSrtOrVttContent(raw, targetLang, format) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const lines = raw.split(/\r\n|\r|\n/);
    let skipMetadataBlock = false;

    return lines
        .map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                skipMetadataBlock = false;
                return line;
            }
            if (index === 0 && format === 'vtt' && /^WEBVTT\b/i.test(trimmed.replace(/^\uFEFF/, ''))) {
                return line;
            }
            if (format === 'vtt' && /^(NOTE|STYLE|REGION)\b/i.test(trimmed)) {
                skipMetadataBlock = true;
                return line;
            }
            if (skipMetadataBlock) return line;
            if (trimmed.includes('-->')) return line;
            if (/^\d+$/.test(trimmed)) return line;
            return convertTaggedDialogueLine(line, targetLang, { assMode: false });
        })
        .join(eol);
}

/**
 * 保留 SRT / ASS / WebVTT 格式结构的前提下，转换字幕正文为目标中文变体
 * @param {string} rawContent
 * @param {string} formatHint
 * @param {'zh'|'zh-TW'} targetLang
 * @returns {{ content: string, converted: boolean }}
 */
export function convertSubtitleContent(rawContent, formatHint, targetLang) {
    const raw = String(rawContent || '');
    if (!raw || (targetLang !== 'zh' && targetLang !== 'zh-TW')) {
        return { content: raw, converted: false };
    }
    const format = detectSubtitleFormat(raw, formatHint);
    const content = format === 'ass'
        ? convertAssContent(raw, targetLang)
        : convertSrtOrVttContent(raw, targetLang, format);
    return {
        content,
        converted: content !== raw
    };
}
