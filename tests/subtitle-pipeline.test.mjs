import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSubtitles, cuesToVtt, detectSubtitleFormat, sanitizeCueText } from '../src/player/subtitles/SubtitleFormat.js';
import { decodeSubtitleBuffer } from '../src/player/subtitles/SubtitleDecoder.js';
import { codeMatchesText } from '../src/player/subtitles/SubtitleCode.js';
import { matchAvCodeFromText, cleanAvCode } from '../src/utils/videoCode.js';
import { SubtitleEngine } from '../src/player/subtitles/SubtitleEngine.js';

test('SubtitlePipeline 字幕采集与解析单元测试', async (t) => {
    await t.test('1. SRT 解析：时间轴、多行与内联标签', () => {
        const srt = [
            '1',
            '00:00:01,000 --> 00:00:04,000',
            '你好，世界',
            '第二行',
            '',
            '2',
            '00:00:05,500 --> 00:00:07,000',
            '<i>斜体</i>测试',
            ''
        ].join('\n');
        const { format, cues } = parseSubtitles(srt, 'demo.srt');
        assert.equal(format, 'srt');
        assert.equal(cues.length, 2);
        assert.equal(cues[0].start, 1);
        assert.equal(cues[0].end, 4);
        assert.equal(cues[0].text, '你好，世界\n第二行');
        assert.equal(cues[1].text, '斜体测试');
    });

    await t.test('2. ASS 解析：Format 声明、覆写标签与文本内逗号', () => {
        const ass = [
            '[Script Info]',
            'Title: demo',
            '',
            '[Events]',
            'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
            'Dialogue: 0,0:00:01.20,0:00:03.50,Default,,0,0,0,,{\\pos(320,240)}第一句\\N第二句',
            'Dialogue: 0,0:00:04.00,0:00:06.00,Default,,0,0,0,,纯文本, 带逗号',
            ''
        ].join('\n');
        const { format, cues } = parseSubtitles(ass, 'demo.ass');
        assert.equal(format, 'ass');
        assert.equal(cues.length, 2);
        assert.equal(cues[0].start, 1.2);
        assert.equal(cues[0].end, 3.5);
        assert.equal(cues[0].text, '第一句\n第二句');
        assert.equal(cues[1].text, '纯文本, 带逗号');
    });

    await t.test('3. WebVTT 解析与格式探测', () => {
        const vtt = 'WEBVTT\n\n00:01.000 --> 00:03.000\nHello\n';
        const { format, cues } = parseSubtitles(vtt, 'demo.vtt');
        assert.equal(format, 'vtt');
        assert.equal(cues.length, 1);
        assert.equal(cues[0].start, 1);
        assert.equal(cues[0].end, 3);
        assert.equal(detectSubtitleFormat('[Events]\nDialogue: 0,0:00:01.00,0:00:02.00,,,', ''), 'ass');
    });

    await t.test('4. cuesToVtt 输出合法 WebVTT 头与时间轴', () => {
        const out = cuesToVtt([{ start: 1, end: 2.5, text: '甲' }]);
        assert.ok(out.startsWith('WEBVTT'));
        assert.ok(out.includes('00:00:01.000 --> 00:00:02.500'));
        assert.ok(out.includes('甲'));
    });

    await t.test('5. sanitizeCueText 剥离特效标签并归一空白', () => {
        assert.equal(sanitizeCueText('{\\fad(200,200)}<b>文本</b>\\N第二行'), '文本\n第二行');
        assert.equal(sanitizeCueText('  A   B  '), 'A B');
    });

    await t.test('6. GBK/UTF-16/UTF-8 编码嗅探', () => {
        const gbk = new Uint8Array([0xc4, 0xe3, 0xba, 0xc3]); // “你好” GBK
        const gbkResult = decodeSubtitleBuffer(gbk);
        assert.equal(gbkResult.text, '你好');
        assert.equal(gbkResult.encoding, 'gb18030');

        const utf16 = new Uint8Array([0xff, 0xfe, 0x60, 0x4f, 0x7d, 0x59]); // “你好” UTF-16LE
        assert.equal(decodeSubtitleBuffer(utf16).text, '你好');

        const utf8Bom = new Uint8Array([0xef, 0xbb, 0xbf, 0xe4, 0xbd, 0xa0, 0xe5, 0xa5, 0xbd]);
        const bomResult = decodeSubtitleBuffer(utf8Bom);
        assert.equal(bomResult.text, '你好');
        assert.equal(bomResult.encoding, 'utf-8-bom');
    });

    await t.test('7. 番号识别统一走全局解析引擎', () => {
        assert.equal(matchAvCodeFromText('www.example.com@IPX-343-C.mp4'), 'IPX-343');
        assert.equal(matchAvCodeFromText('IPX-343.1080p.srt'), 'IPX-343');
        assert.equal(matchAvCodeFromText('259LUXU-1234'), '259LUXU-1234');
        assert.equal(cleanAvCode('ipx-343'), 'IPX-343');
    });

    await t.test('8. 番号比对可抹平前导零差异', () => {
        assert.equal(codeMatchesText('IPX-00343 中文字幕', 'IPX-343'), true);
        assert.equal(codeMatchesText('IPX-3431', 'IPX-343'), false);
        assert.equal(codeMatchesText('IPX-343.zh DS-zh-CN', 'IPX-343'), true);
        assert.equal(codeMatchesText('简体[SRT]IPX-343', 'IPX-343'), true);
    });

    await t.test('9. 排序引擎：同源重复项去重且按质量降序', () => {
        const engine = new SubtitleEngine();
        const ranked = engine._rank([
            { downloadUrl: 'https://a/1.srt', title: 'IPX-343', provider: 'xunlei', format: 'srt', lang: 'zh', baseScore: 88 },
            { downloadUrl: 'https://a/1.srt?dup=1', title: 'IPX-343', provider: 'xunlei', format: 'srt', lang: 'zh', baseScore: 88 },
            { downloadUrl: 'https://b/2.srt', title: 'IPX-343', provider: 'subtitlecat', format: 'srt', lang: 'zh', baseScore: 62, machineTranslated: true },
            { downloadUrl: 'https://c/3.ass', title: 'IPX-343', provider: 'xunlei', format: 'ass', lang: 'zh', baseScore: 88 }
        ], 'IPX-343');

        assert.equal(ranked.length, 3);
        assert.equal(ranked[0].format, 'ass');
        assert.ok(ranked[0].rating >= ranked[1].rating);
        assert.ok(ranked[1].rating > ranked[2].rating);
        assert.equal(ranked[2].machineTranslated, true);
    });
});
