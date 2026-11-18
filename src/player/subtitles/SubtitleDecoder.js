/**
 * SubtitleDecoder — 字幕字节流编码嗅探与净化层
 *
 * 迅雷 / 网盘上的老字幕大量来自 Windows 压制组，编码可能是
 * UTF-8(BOM) / UTF-16LE / GBK / GB18030 / BIG5。
 * 统一按「BOM 优先 -> UTF-8 严格校验 -> 区位编码评分择优」三级漏斗解码，
 * 彻底根治直接读 responseText 产生的乱码与替换字符。
 */

const LEGACY_CANDIDATES = ['gb18030', 'big5', 'shift_jis', 'euc-kr', 'windows-1252'];

function toUint8Array(input) {
    if (!input) return new Uint8Array(0);
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (input.buffer instanceof ArrayBuffer) return new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength);
    if (typeof input === 'string') return new TextEncoder().encode(input);
    return new Uint8Array(0);
}

function isDecoderSupported(label) {
    try {
        // eslint-disable-next-line no-new
        new TextDecoder(label);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 文本健康度评分：替换字符与不可打印控制符重罚，CJK 与可打印字符加权
 * @param {string} text
 * @returns {number}
 */
function scoreDecodedText(text) {
    if (!text) return -1e6;
    const sample = text.slice(0, 4000);
    let bad = 0;
    let cjk = 0;
    let printable = 0;
    for (let i = 0; i < sample.length; i++) {
        const code = sample.charCodeAt(i);
        if (code === 0xfffd || code === 0 || (code < 9 && code !== 0)) {
            bad++;
        } else if (code >= 0x4e00 && code <= 0x9fff) {
            cjk++;
        } else if (code === 10 || code === 13 || code === 9 || code >= 0x20) {
            printable++;
        }
    }
    return (cjk * 3 + printable) / sample.length - (bad * 30) / sample.length;
}

function decodeWith(label, bytes) {
    try {
        return new TextDecoder(label, { fatal: false }).decode(bytes);
    } catch (_) {
        return null;
    }
}

/**
 * 解码字幕字节流
 * @param {ArrayBuffer|Uint8Array|string} input
 * @returns {{text: string, encoding: string}}
 */
export function decodeSubtitleBuffer(input) {
    if (typeof input === 'string') {
        return { text: input.replace(/^\uFEFF/, ''), encoding: 'utf-8' };
    }
    const bytes = toUint8Array(input);
    if (!bytes.length) return { text: '', encoding: 'utf-8' };

    // 1. BOM 精确判定
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        const text = decodeWith('utf-8', bytes.subarray(3)) ?? '';
        return { text: text.replace(/^\uFEFF/, ''), encoding: 'utf-8-bom' };
    }
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        const text = decodeWith('utf-16le', bytes.subarray(2)) ?? '';
        return { text: text.replace(/^\uFEFF/, ''), encoding: 'utf-16le' };
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        const text = decodeWith('utf-16be', bytes.subarray(2)) ?? '';
        return { text: text.replace(/^\uFEFF/, ''), encoding: 'utf-16be' };
    }

    // 2. UTF-8 严格校验（唯一可信的先行尝试）
    try {
        const strict = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        return { text: strict.replace(/^\uFEFF/, ''), encoding: 'utf-8' };
    } catch (_) {
        /* 非合法 UTF-8，进入区位编码评分 */
    }

    // 3. 区位编码择优：GB18030 优先（GBK 超集），其余按健康度打分
    let best = { text: '', encoding: 'gb18030', score: -Infinity };
    for (const label of LEGACY_CANDIDATES) {
        if (!isDecoderSupported(label)) continue;
        const decoded = decodeWith(label, bytes);
        if (!decoded) continue;
        const score = scoreDecodedText(decoded);
        if (score > best.score) best = { text: decoded, encoding: label, score };
        // GB18030 已取得高健康度时无需继续试探
        if (best.score > 0.92) break;
    }

    if (best.text) return { text: best.text.replace(/^\uFEFF/, ''), encoding: best.encoding };

    const fallback = decodeWith('utf-8', bytes) ?? '';
    return { text: fallback.replace(/^\uFEFF/, ''), encoding: 'utf-8-lossy' };
}
