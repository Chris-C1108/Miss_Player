import test from 'node:test';
import assert from 'node:assert/strict';

import {
    COMMON_ZH_CHARS,
    isCommonChineseChar,
    decodeSubtitleBuffer
} from '../src/player/subtitles/SubtitleDecoder.js';
import {
    parseSubtitles,
    sanitizeCueText
} from '../src/player/subtitles/SubtitleFormat.js';
import {
    detectSubtitleLanguage,
    splitBilingualCue,
    enrichCuesWithTracks,
    formatCueForDisplayMode
} from '../src/player/subtitles/SubtitleLanguageDetector.js';
import {
    hasJapaneseKana,
    convertTaggedDialogueLine,
    convertSubtitleContent
} from '../src/player/subtitles/SubtitleChineseConverter.js';

test('Phase 1.1 SubtitleDecoder 编码嗅探与 BOM 净化', async (t) => {
    await t.test('COMMON_ZH_CHARS 字典导出与简繁高频词覆盖', () => {
        assert.ok(COMMON_ZH_CHARS instanceof Set);
        assert.ok(COMMON_ZH_CHARS.size >= 450);
        for (const ch of ['的', '这', '说', '们', '這', '說', '們', '裡', '爽', '疼']) {
            assert.equal(isCommonChineseChar(ch), true, `应命中常用字 ${ch}`);
        }
        assert.equal(isCommonChineseChar('선'), false);
        assert.equal(isCommonChineseChar('あ'), false);
        assert.equal(isCommonChineseChar('弊'), false);
    });

    await t.test('EUC-KR 字节流应正确识别为 euc-kr 而非被 GB18030 生僻字劫持', () => {
        // "선생님 너무 좋아~" in EUC-KR
        const eucKrBytes = new Uint8Array([
            0xbc, 0xb1, 0xbb, 0xfd, 0xb4, 0xd4, 0x20,
            0xb3, 0xca, 0xb9, 0xab, 0x20,
            0xc1, 0xc1, 0xbe, 0xc6, 0x7e
        ]);
        const res = decodeSubtitleBuffer(eucKrBytes);
        assert.equal(res.encoding, 'euc-kr');
        assert.equal(res.text, '선생님 너무 좋아~');
    });

    await t.test('Shift_JIS 字节流应正确识别为 shift_jis', () => {
        // "おはようございます" in Shift_JIS
        const sjisBytes = new Uint8Array([
            0x82, 0xa8, 0x82, 0xcd, 0x82, 0xe6, 0x82, 0xa4,
            0x82, 0xb2, 0x82, 0xb4, 0x82, 0xa2, 0x82, 0xdc, 0x82, 0xb7
        ]);
        const res = decodeSubtitleBuffer(sjisBytes);
        assert.equal(res.encoding, 'shift_jis');
        assert.equal(res.text, 'おはようございます');
    });

    await t.test('短词与整句 GBK 中文仍正确解码为 gb18030', () => {
        const gbkShort = new Uint8Array([0xc4, 0xe3, 0xba, 0xc3]); // "你好"
        const shortRes = decodeSubtitleBuffer(gbkShort);
        assert.equal(shortRes.encoding, 'gb18030');
        assert.equal(shortRes.text, '你好');

        // "早上好，欢迎观看" in GBK
        const gbkSentence = new Uint8Array([
            0xd4, 0xe7, 0xc9, 0xcf, 0xba, 0xc3, 0xa3, 0xac,
            0xbb, 0xb6, 0xd3, 0xad, 0xb9, 0xdb, 0xbf, 0xb4
        ]);
        const sentenceRes = decodeSubtitleBuffer(gbkSentence);
        assert.equal(sentenceRes.encoding, 'gb18030');
        assert.equal(sentenceRes.text, '早上好，欢迎观看');
    });

    await t.test('Big5 繁体中文字节流应正确解码为 big5', () => {
        // "語來慧了" in Big5
        const big5Bytes = new Uint8Array([0xbb, 0x79, 0xa8, 0xd3, 0xbc, 0x7a, 0xa4, 0x46]);
        const res = decodeSubtitleBuffer(big5Bytes);
        assert.equal(res.encoding, 'big5');
        assert.equal(res.text, '語來慧了');
    });

    await t.test('全文任意位置的 \\uFEFF (含 OCR 行中 BOM) 均被彻底剥离', () => {
        const midBomText = '\uFEFF第一句\n\uFEFF第二\uFEFF句';
        assert.equal(decodeSubtitleBuffer(midBomText).text, '第一句\n第二句');

        const utf8MidBomBytes = new TextEncoder().encode(midBomText);
        assert.equal(decodeSubtitleBuffer(utf8MidBomBytes).text, '第一句\n第二句');

        const utf8WithHeaderBom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8MidBomBytes]);
        assert.equal(decodeSubtitleBuffer(utf8WithHeaderBom).text, '第一句\n第二句');

        assert.equal(sanitizeCueText('\uFEFF第一\uFEFF句。\uFEFF'), '第一句');
    });
});

test('Phase 1.2 SubtitleFormat 容错解析（缺空行 SRT / VTT 元数据 / 行中 BOM）', async (t) => {
    await t.test('KIRM-014 风格缺失块间空行的 SRT 应精准拆分为独立 cues', () => {
        const compactSrt = [
            '1',
            '00:00:36,033 --> 00:00:36,833',
            '早上好',
            '2',
            '00:00:37,300 --> 00:00:38,633',
            '早上好',
            '\uFEFF3',
            '00:00:39,000 --> 00:00:41,000',
            '今天感觉怎么样'
        ].join('\n');

        const { format, cues } = parseSubtitles(compactSrt, 'KIRM-014.srt');
        assert.equal(format, 'srt');
        assert.equal(cues.length, 3);
        assert.deepEqual(cues[0], { start: 36.033, end: 36.833, text: '早上好' });
        assert.deepEqual(cues[1], { start: 37.3, end: 38.633, text: '早上好' });
        assert.deepEqual(cues[2], { start: 39, end: 41, text: '今天感觉怎么样' });
    });

    await t.test('有空行分隔时纯数字台词不被误当做序号吞掉', () => {
        const numericCueSrt = [
            '1',
            '00:00:01,000 --> 00:00:02,000',
            '2',
            '',
            '2',
            '00:00:03,000 --> 00:00:04,000',
            '3',
            ''
        ].join('\n');

        const { cues } = parseSubtitles(numericCueSrt, 'num.srt');
        assert.equal(cues.length, 2);
        assert.equal(cues[0].text, '2');
        assert.equal(cues[1].text, '3');
    });

    await t.test('WebVTT 跳过 NOTE / STYLE / REGION 元数据块并解析正文', () => {
        const vtt = [
            'WEBVTT',
            '',
            'NOTE 注释块内包含时间轴也不应误解析',
            '00:00.500 --> 00:00.900',
            '被注释掉的行',
            '',
            'STYLE',
            '::cue { color: #ffffff; }',
            '',
            'REGION',
            'id:top',
            '',
            '00:01.000 --> 00:03.000 align:start',
            '真实台词',
            ''
        ].join('\n');

        const { format, cues } = parseSubtitles(vtt, 'demo.vtt');
        assert.equal(format, 'vtt');
        assert.equal(cues.length, 1);
        assert.deepEqual(cues[0], { start: 1, end: 3, text: '真实台词' });
    });
});

test('Phase 1.3 SubtitleLanguageDetector 内容优先语种探测与双语分轨', async (t) => {
    await t.test('内容优先：修正误标为 en 的简体与繁体中文字幕', () => {
        const simpCues = [
            { start: 0, end: 2, text: '今天天气真好，我们一起出去吧' },
            { start: 2, end: 4, text: '这里面有很多东西需要准备' }
        ];
        const simpRes = detectSubtitleLanguage(simpCues, 'en');
        assert.equal(simpRes.detectedLang, 'zh');
        assert.equal(simpRes.primaryLang, 'zh');
        assert.equal(simpRes.trackLayout, 'mono');
        assert.equal(simpRes.isCorrupted, false);

        const tradCues = [
            { start: 0, end: 2, text: '這是一段繁體中文字幕，請開始播放影片' },
            { start: 2, end: 4, text: '這裡面還有許多內容需要檢查' }
        ];
        const tradRes = detectSubtitleLanguage(tradCues, 'en');
        assert.equal(tradRes.detectedLang, 'zh-TW');
        assert.equal(tradRes.primaryLang, 'zh-TW');
        assert.equal(tradRes.trackLayout, 'mono');
    });

    await t.test('纯日文、纯韩文、纯越南文、纯英文单语准确识别且不误判双语', () => {
        const jaRes = detectSubtitleLanguage([
            { start: 0, end: 2, text: 'おはようございます' },
            { start: 2, end: 4, text: '今日はいい天気ですね' },
            { start: 4, end: 6, text: '元気ですか' }
        ], 'zh');
        assert.equal(jaRes.detectedLang, 'ja');
        assert.equal(jaRes.trackLayout, 'mono');

        const koRes = detectSubtitleLanguage([
            { start: 0, end: 2, text: '선생님 너무 좋아' },
            { start: 2, end: 4, text: '오늘 날씨가 정말 좋네요' }
        ], 'en');
        assert.equal(koRes.detectedLang, 'ko');
        assert.equal(koRes.trackLayout, 'mono');

        const viRes = detectSubtitleLanguage([
            { start: 0, end: 2, text: 'Xin chào, hôm nay bạn khỏe không' },
            { start: 2, end: 4, text: 'Tôi rất thích bộ phim này' }
        ], 'en');
        assert.equal(viRes.detectedLang, 'vi');
        assert.equal(viRes.trackLayout, 'mono');

        const enRes = detectSubtitleLanguage([
            { start: 0, end: 2, text: 'Good morning everyone, please stay here' }
        ], 'zh');
        assert.equal(enRes.detectedLang, 'en');
        assert.equal(enRes.trackLayout, 'mono');
    });

    await t.test('捕获 EUC-KR 转 GBK 后另存为 UTF-8 的永久乱码', () => {
        const corruptedCues = [
            { start: 0, end: 2, text: '急积丛 呈公 亮酒~ 构 弊犯瘤 沥富' },
            { start: 2, end: 4, text: '坷疵 朝揪啊 沥富 亮匙夸 鞍捞 魂氓且鳖夸' },
            { start: 4, end: 6, text: '泪瘪父夸 酒流 霖厚啊 救 灯绢夸 炼陛父' }
        ];
        const res = detectSubtitleLanguage(corruptedCues, 'zh');
        assert.equal(res.trackLayout, 'corrupted');
        assert.equal(res.isCorrupted, true);
        assert.equal(res.detectedLang, 'unknown');
        assert.ok(res.commonZhRate < 0.18);
    });

    await t.test('识别 ANAV-001 / PFES-027 行内与多行双语字幕并完成分轨', () => {
        const inlineCues = [
            { start: 1, end: 3, text: '想调教你了。 調教していじめたくなっちゃった。' },
            { start: 4, end: 5, text: 'うん 嗯' },
            { start: 6, end: 8, text: '俺の言うこと聞いてね 听我说吧' }
        ];
        const langInfo = detectSubtitleLanguage(inlineCues, 'ja');
        assert.equal(langInfo.trackLayout, 'bilingual');
        assert.equal(langInfo.primaryLang, 'zh');
        assert.equal(langInfo.secondaryLang, 'ja');
        assert.equal(langInfo.detectedLang, 'zh');

        const enriched = enrichCuesWithTracks(inlineCues, langInfo);
        assert.equal(enriched[0].primaryText, '想调教你了。');
        assert.equal(enriched[0].secondaryText, '調教していじめたくなっちゃった。');
        assert.equal(enriched[1].primaryText, '嗯');
        assert.equal(enriched[1].secondaryText, 'うん');
        assert.equal(enriched[2].primaryText, '听我说吧');
        assert.equal(enriched[2].secondaryText, '俺の言うこと聞いてね');

        assert.deepEqual(formatCueForDisplayMode(enriched[0], 'primary'), {
            primary: '想调教你了。',
            secondary: '',
            text: '想调教你了。'
        });
        assert.deepEqual(formatCueForDisplayMode(enriched[0], 'secondary'), {
            primary: '調教していじめたくなっちゃった。',
            secondary: '',
            text: '調教していじめたくなっちゃった。'
        });
        assert.deepEqual(formatCueForDisplayMode(enriched[0], 'bilingual'), {
            primary: '想调教你了。',
            secondary: '調教していじめたくなっちゃった。',
            text: '想调教你了。\n調教していじめたくなっちゃった。'
        });

        const multilineSplit = splitBilingualCue('早上好\nおはようございます');
        assert.equal(multilineSplit.primaryText, '早上好');
        assert.equal(multilineSplit.secondaryText, 'おはようございます');
        assert.equal(multilineSplit.primaryLang, 'zh');
        assert.equal(multilineSplit.secondaryLang, 'ja');

        const zhEnSplit = splitBilingualCue('Good morning\n早上好');
        assert.equal(zhEnSplit.primaryText, '早上好');
        assert.equal(zhEnSplit.secondaryText, 'Good morning');
        assert.equal(zhEnSplit.secondaryLang, 'en');
    });

    await t.test('防误拆：单语内嵌夹杂词（日文句中纯汉字 / 中文句中英文名词）保持完整', () => {
        const jaInternalKanji = splitBilingualCue('もう ダメ 変態 気持ちいい');
        assert.equal(jaInternalKanji.primaryText, 'もう ダメ 変態 気持ちいい');
        assert.equal(jaInternalKanji.secondaryText, '');

        const zhInternalEn = splitBilingualCue('我买了 iPhone 手机');
        assert.equal(zhInternalEn.primaryText, '我买了 iPhone 手机');
        assert.equal(zhInternalEn.secondaryText, '');
    });
});

test('Phase 1.4 SubtitleChineseConverter 双语转换零误伤日文保护', async (t) => {
    await t.test('hasJapaneseKana 精准探测假名与长音符', () => {
        assert.equal(hasJapaneseKana('あいうえお'), true);
        assert.equal(hasJapaneseKana('カタカナ'), true);
        assert.equal(hasJapaneseKana('コーヒー'), true);
        assert.equal(hasJapaneseKana('請開始檢查這段話'), false);
    });

    await t.test('zh-TW + ja 双语 SRT 转简体时仅转换中文轨道，日文汉字与假名原封不动', () => {
        const bilingualSrt = [
            '1',
            '00:00:01,000 --> 00:00:04,000',
            '請開始檢查這段話，別發呆',
            '調教していじめたくなっちゃった。',
            '',
            '2',
            '00:00:05,000 --> 00:00:08,000',
            '<i>想調教你了。</i> 調教していじめたくなっちゃった。',
            '',
            '3',
            '00:00:09,000 --> 00:00:12,000',
            '俺の言うこと聞いてね 聽我說吧',
            ''
        ].join('\n');

        const { content, converted } = convertSubtitleContent(bilingualSrt, 'srt', 'zh');
        assert.equal(converted, true);
        assert.ok(content.includes('请开始检查这段话，别发呆\n調教していじめたくなっちゃった。'));
        assert.ok(content.includes('<i>想调教你了。</i> 調教していじめたくなっちゃった。'));
        assert.ok(content.includes('俺の言うこと聞いてね 听我说吧'));
    });

    await t.test('纯日文行与 ASS 双语行（\\N 分隔）同样零误伤日文汉字', () => {
        assert.equal(
            convertTaggedDialogueLine('もう ダメ 変態 気持ちいい', 'zh'),
            'もう ダメ 変態 気持ちいい'
        );
        assert.equal(
            convertTaggedDialogueLine('{\\c&HFFFFFF&}調教{\\c}していじめたくなっちゃった', 'zh', { assMode: true }),
            '{\\c&HFFFFFF&}調教{\\c}していじめたくなっちゃった'
        );
        assert.equal(
            convertTaggedDialogueLine('{\\pos(320,240)}想調教你了。\\N調教していじめたくなっちゃった。', 'zh', { assMode: true }),
            '{\\pos(320,240)}想调教你了。\\N調教していじめたくなっちゃった。'
        );
    });
});
