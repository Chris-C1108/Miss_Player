/**
 * SubtitleDecoder — 字幕字节流编码嗅探与净化层
 *
 * 迅雷 / 网盘上的老字幕大量来自 Windows 压制组，编码可能是
 * UTF-8(BOM) / UTF-16LE / GBK / GB18030 / BIG5 / Shift_JIS / EUC-KR。
 * 统一按「BOM 优先 -> UTF-8 严格校验 -> 全量区位编码公平评分择优」三级漏斗解码，
 * 彻底根治直接读 responseText 产生的乱码与替换字符。
 */

const LEGACY_CANDIDATES = ['gb18030', 'big5', 'shift_jis', 'euc-kr', 'windows-1252'];

const COMMON_ZH_CHAR_LIST = [
    '的一是不了人我在有他这为之大来以个中上们到说国和地也子时道出而要于就下得可你年生自会那后能对着事其里所去行过家十用发天如然作方成者多日都三小军二无同么经法当起与好看学进种将还分此心前面又定见只主没公从',
    '們這說個來沒麼還讓請嗎啊呢吧哦嗯好很太要別快真對錯會點給樣為什經機關進後從應該話聲聽問題實滿歡喜舒爽痛快這裏裡操射插舔吸硬濕爽疼愛吃嘴臉奶胸腿屁股脫穿',
    '她它把被给让叫请吗啊呢吧哦嗯哈呀哇哪谁什怎几多少很太最更真对错会点给样应该话声听问题实满欢喜舒痛快操射插舔吸硬湿疼爱吃嘴脸奶胸腿屁股脱穿',
    '知道觉得认为希望喜欢感觉明白理解意思说话告诉问回答听看笑哭想念怕痒死活动停走跑跳坐站躺睡醒洗摸抱亲吻咬吹找帮变忘送放拿带玩买卖写读唱等做住',
    '开始结束继续等待改变完成准备决定选择允许拒绝接受放弃坚持相信怀疑担心害怕紧张轻松开心快乐幸福痛苦难过生气高兴男女爸妈哥姐弟妹夫妻朋友同学老板医生护士先生小姐太太',
    '房间床桌椅门窗灯水电车路店工作钱分钟秒今明昨早晚夜身体头眼鼻耳舌牙手脚指腰乳肉皮骨红白黑冷热干软紧粗细长短大小高低轻重深浅新旧好坏美丑真假香甜',
    '四五六七八九百千万两半第次件条张根只些块片口声句字事东西如果虽然但是因为所以而且却并或及跟离向往衣裤鞋袜帽包被枕敢肯愿须刚曾竟倒偏难易极差',
    '國為時於會後發對無經當學進種將還此見只沒從覺認希感寫讀買賣電圖畫幫助親愛告訴問答聽哭動走坐站睡親咬開門燈車錢雙隻處邊間數全每各別另這樣那樣怎麼哪裡外旁',
    '頭體腳緊關始結束繼續準備決定選擇堅持懷疑擔心緊張輕鬆快樂高興生氣難過變帶褲襪邊願須剛難極誰幾最'
].join('');

export const COMMON_ZH_CHARS = new Set(Array.from(COMMON_ZH_CHAR_LIST));

const COMMON_KO_SYLLABLES = new Set('은는이가요다하어아그서좋너무');

/**
 * 判断字符是否为高频现代常用中文字（含简繁与对白高频词）
 * @param {string} ch
 * @returns {boolean}
 */
export function isCommonChineseChar(ch) {
    return typeof ch === 'string' && ch.length > 0 && COMMON_ZH_CHARS.has(ch);
}

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
 * 文本健康度评分：
 * - 替换字符与非法控制符重罚 (-30)
 * - 高频常用中文 (+5.0) 显著高于生僻 CJK (+0.7)，防止 EUC-KR 伪装成 GBK 生僻字抢跑
 * - 韩文音节 (+4.8, 常用助词/音节 +0.8) 与日文假名 (+5.2) 按母语分布公平竞争
 * @param {string} text
 * @param {string} [label]
 * @returns {number}
 */
function scoreDecodedText(text, label = '') {
    if (!text) return -1e6;
    const sample = text.slice(0, 4000);
    let score = 0;
    let bad = 0;
    let commonZhCount = 0;

    for (let i = 0; i < sample.length; i++) {
        const ch = sample[i];
        const code = sample.charCodeAt(i);
        if (code === 0xfffd || code < 9 || (code > 13 && code < 0x20)) {
            bad++;
            score -= 30;
        } else if (COMMON_ZH_CHARS.has(ch)) {
            commonZhCount++;
            score += 5.0;
        } else if (code >= 0x4e00 && code <= 0x9fff) {
            score += 0.7;
        } else if (code >= 0xac00 && code <= 0xd7af) {
            score += COMMON_KO_SYLLABLES.has(ch) ? 5.6 : 4.8;
        } else if (code >= 0x3040 && code <= 0x30ff) {
            score += 5.2;
        } else if (code === 10 || code === 13 || code === 9 || (code >= 0x20 && code <= 0x7e)) {
            score += 1.0;
        }
    }

    let normalized = score / sample.length;
    if (label === 'gb18030' && commonZhCount >= 2 && bad === 0) {
        normalized += 0.05;
    }
    return normalized;
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
        return { text: input.replace(/\uFEFF/g, ''), encoding: 'utf-8' };
    }
    const bytes = toUint8Array(input);
    if (!bytes.length) return { text: '', encoding: 'utf-8' };

    // 1. BOM 精确判定
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        const text = decodeWith('utf-8', bytes.subarray(3)) ?? '';
        return { text: text.replace(/\uFEFF/g, ''), encoding: 'utf-8-bom' };
    }
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        const text = decodeWith('utf-16le', bytes.subarray(2)) ?? '';
        return { text: text.replace(/\uFEFF/g, ''), encoding: 'utf-16le' };
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        const text = decodeWith('utf-16be', bytes.subarray(2)) ?? '';
        return { text: text.replace(/\uFEFF/g, ''), encoding: 'utf-16be' };
    }

    // 2. UTF-8 严格校验（唯一可信的先行尝试）
    try {
        const strict = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        return { text: strict.replace(/\uFEFF/g, ''), encoding: 'utf-8' };
    } catch (_) {
        /* 非合法 UTF-8，进入区位编码评分 */
    }

    // 3. 区位编码全量公平评分择优（取消早停，确保 EUC-KR / Shift_JIS / Big5 / GB18030 公平竞争）
    let best = { text: '', encoding: 'gb18030', score: -Infinity };
    for (const label of LEGACY_CANDIDATES) {
        if (!isDecoderSupported(label)) continue;
        const decoded = decodeWith(label, bytes);
        if (!decoded) continue;
        const score = scoreDecodedText(decoded, label);
        if (score > best.score) best = { text: decoded, encoding: label, score };
    }

    if (best.text) return { text: best.text.replace(/\uFEFF/g, ''), encoding: best.encoding };

    const fallback = decodeWith('utf-8', bytes) ?? '';
    return { text: fallback.replace(/\uFEFF/g, ''), encoding: 'utf-8-lossy' };
}
