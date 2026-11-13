import assert from 'assert';
import fs from 'fs';
import { registerHooks } from 'node:module';
import {
    processComment,
    parseTimestamps,
    extractAVCodes,
    highlightCommentText,
    applyCommentCountdown
} from '../src/player/comments/CommentDataPipeline.js';
import { SupabaseService } from '../src/services/SupabaseService.js';
import { SleazyForkService, getCurrentVersion } from '../src/services/SleazyForkService.js';

registerHooks({
    load(url, context, nextLoad) {
        if (url.split('?')[0].endsWith('.css')) {
            return { format: 'module', shortCircuit: true, source: 'export default "";' };
        }
        return nextLoad(url, context);
    }
});

const { showCommentReportModal } = await import('../src/player/comments/CommentReportModal.js');

console.log('🧪 开始执行评论识别引擎优化、同系列番号与上报机制单元测试...');

// -------------------------------------------------------------
// 1. Supabase 41 条用户上报真实案例全覆盖回归
// -------------------------------------------------------------
{
    // [1] 点/斜杠噪点 (.2 ..8 ....5/6 .....0/2/4/6)
    const r1 = processComment('.2 ..8 ....5/6 .....0/2/4/6', 'STARS-256', 7200);
    assert.strictEqual(r1.timestamps.length, 0, '[1] 纯点斜杠噪点不应识别出时间戳');
    assert.strictEqual(r1.isCountdownComment, false, '[1] 不应误判倒计时');

    // [2] [4] [5] [9] [13] [25] [29] [35] [38] 各种中文评分表达
    const ratings = [
        '题材5分，百褶袜5分，颜值4分，破解5分，无中出1分',
        '【9分】可爱！小只！（6分的标准是本片值得完整看一遍）',
        '外表8分，演技5分，气质5分。',
        '【6分】还可以。（6分的标准是值得收藏）',
        '5分！5分！5分！！！',
        '颜值3分，泡芙5分，破解5分',
        '颜 7 分左右 皮肤略黑 整体稍显一般',
        '综合可以打5分。',
        '给4分半吧\n第一幕还可以'
    ];
    for (const txt of ratings) {
        const res = processComment(txt, 'IPX-811', 7200);
        assert.strictEqual(res.timestamps.length, 0, `评分文本不应识别为时间戳: ${txt}`);
        assert.strictEqual(res.isCountdownComment, false, `评分文本不应触发倒计时: ${txt}`);
    }

    // [3] 28:10 本片超经典 (maskBlacklist 边界保护防止吞掉 "10 本")
    const r3 = processComment('13.41还行，28:10 本片超经典，41:07、55:11、59:30、1:12:00', 'STARS-256', 7200);
    const r3Secs = r3.timestamps.map(t => t.seconds);
    assert.ok(r3Secs.includes(1690), '[3] 28:10 本片 必须完整保留 1690s');
    assert.strictEqual(r3Secs.length, 6, '[3] 应识别全部 6 个时间戳');

    // [6] 中文小时数字 ("一小时40分钟")
    const r6 = processComment('一小时40分钟，做爱这么快乐吗', 'SNOS-183', 7200);
    assert.deepStrictEqual(r6.timestamps.map(t => t.seconds), [6000], '[6] 一小时40分钟应为 6000s');

    // [7] 45min的69式，1h10min的浴室口角
    const r7 = processComment('45min的69式，1h10min的浴室口角，绝了', 'SNOS-183', 7200);
    assert.deepStrictEqual(r7.timestamps.map(t => t.seconds), [2700, 4200], '[7] 应保留 45min(2700) 与 1h10min(4200)，过滤 69式');

    // [8] 每日签到比分 (1/1, 0/1)
    const r8 = processComment('每日簽到：水也:一般(1/1)，博士:Nice Body(1/1)，XO : ?(0/1))', 'SNOS-183', 7200);
    assert.strictEqual(r8.timestamps.length, 0, '[8] 1/1、0/1 不应误判时间戳');

    // [10] 纯数字串 + Context 防污染 (1513，1170，293)
    const r10 = processComment('1513，1170，293', 'IPX-811', 7200);
    assert.strictEqual(r10.timestamps.length, 0, '[10] 纯数字串不应出时间戳');
    assert.strictEqual(r10.avcodes.length, 0, '[10] 纯多组数字不应拼出 IPX-811-1513 或虚假番号');

    // [11] 2:29:25 vs 2:29:15 (仅差 10 秒的正文描述，不应误判倒计时)
    const r11 = processComment('结尾2：29：25左右很不错，2：29：15秒处切换镜头', 'REAL-902', 10800);
    assert.strictEqual(r11.isCountdownComment, false, '[11] 跨度仅 10s 的正文提及不应误判为倒计时');
    assert.deepStrictEqual(r11.timestamps.map(t => t.seconds), [8965, 8955]);

    // [12] 高潮6啊
    const r12 = processComment('快结婚被前男友草高潮6啊', 'IPX-811', 7200);
    assert.strictEqual(r12.timestamps.length, 0, '[12] 高潮6啊 不应误判为 6 分钟');

    // [14] 1h47min30 2h
    const r14 = processComment('1h47min30 2h', 'MIKR-068', 10800);
    assert.deepStrictEqual(r14.timestamps.map(t => t.seconds), [6450, 7200], '[14] 1h47min30 应识别为 6450s');

    // [16] 破折号区间 1:46:00—1:47:45
    const r16 = processComment('1:46:00—1:47:45 实用的顶峰，射了无数次', 'MIAA-710', 10800);
    assert.deepStrictEqual(r16.timestamps[0].seconds, [6360, 6465], '[16] 全角破折号区间应解析为 [6360, 6465]');

    // [19] 5.6發 & [20] 1.5g
    assert.strictEqual(processComment('肯定是尻個5.6發來表示尊敬', 'MIDV-207', 7200).timestamps.length, 0, '[19] 5.6發不应识别');
    assert.strictEqual(processComment('画质跟1.5g的也没差', 'KIRM-055', 7200).timestamps.length, 0, '[20] 1.5g不应识别');

    // [24] 连字符 H-MM-SS (0-44-59)
    const r24 = processComment('精彩瞬间   0-44-59', 'CAWD-796', 7200);
    assert.deepStrictEqual(r24.timestamps.map(t => t.seconds), [2699], '[24] 0-44-59 应识别为 2699s');

    // [30] 动作持续时间/不足20分钟 & [31] 1秒不落 & [32] #2026.8.11 & [33] 早上5点半
    assert.strictEqual(processComment('带丝袜插入时间不足20分钟太短了', 'SNOS-334', 7200).timestamps.length, 0, '[30] 不足20分钟为时长评价');
    assert.strictEqual(processComment('1秒不落 忍住看完了全片', 'SNOS-334', 7200).timestamps.length, 0, '[31] 1秒不落为成语');
    assert.strictEqual(processComment('#2026.8.11这就冲上历史排行榜第二了？', 'SNOS-334', 7200).timestamps.length, 0, '[32] 年月日不应截断为 8.11');
    assert.strictEqual(processComment('现在是早上5点半，我从凌晨1点看，射了5次', 'SNOS-334', 7200).timestamps.length, 0, '[33] 现实时间不应识别');

    // [34] 预告1.29，1.30秒 (MM.SS 语义消歧)
    const r34 = processComment('预告1.29，1.30秒，截个图', 'SNOS-334', 7200);
    assert.deepStrictEqual(r34.timestamps.map(t => t.seconds), [89, 90], '[34] 预告 1.29/1.30秒 应按 MM.SS 解析为 89s, 90s');

    // [37] 混合冒号小数点 2:02.34 & [39] 2.6发推 & [40] 1小时06 & [41] 连续25秒
    const r37 = processComment('倒口2:02.34、2:19.12\n火车便当2:22.28', 'MIAA-490', 10800);
    assert.deepStrictEqual(r37.timestamps.map(t => t.seconds), [7354, 8352, 8548], '[37] H:MM.SS 混合格式应完整解析');
    assert.strictEqual(processComment('二叶2.6发推说今天拍新作', 'MISM-368', 7200).timestamps.length, 0, '[39] 2.6发推为日期');
    assert.deepStrictEqual(processComment('1小时06快休克了吧', 'CKCK-011', 7200).timestamps.map(t => t.seconds), [3960], '[40] 1小时06 应解析为 3960s');
    assert.deepStrictEqual(processComment('尤其55：35开始，连续25秒快速喉桩，01:06:20结束', 'CKCK-011', 7200).timestamps.map(t => t.seconds), [3335, 3980], '[41] 连续25秒应忽略，保留 55:35 与 01:06:20');
}

// -------------------------------------------------------------
// 2. 31,685 条真实语料库高频难点验证
// -------------------------------------------------------------
{
    // 1位小数评分/版本号 (47/47 误报清零)
    assert.strictEqual(parseTimestamps('整体 9.7 吧，节奏很稳', 7200).validTimestamps.length, 0, '1位小数评分不应识别');
    // 多维评分卡
    assert.strictEqual(parseTimestamps('颜值17（满分20），胸11（满分15），臀15（满分15），腰腿9，皮肤10，演技8，服装8，总分86', 7200).validTimestamps.length, 0, '多维评分卡不应识别');
    // 连续40多分钟、3秒3秒快进、最强00后、666
    assert.strictEqual(parseTimestamps('连续被干40多分钟，3秒3秒快进看的，最强00后 666', 7200).validTimestamps.length, 0, '持续时长/快进步长/00后/666 不应识别');
    // 四小时片子不触发虚假倒计时
    assert.strictEqual(processComment('四小时片子居然只在 2.54 射了一次', 'ABF-021', 14400).isCountdownComment, false, '四小时片子不应误判倒计时');
    // 1.36-1.43.58 正序范围否定假倒计时
    const sone = processComment('1.36-1.43.58，插28.30', 'SONE-033', 7200);
    assert.strictEqual(sone.isCountdownComment, false, '存在正序时间区间时不应误判倒计时');
    // 1.39.00-1尾 不应拼为 L4
    const cawd = processComment('1.39.00-1尾', 'CAWD-426', 7200);
    assert.deepStrictEqual(cawd.timestamps.map(t => t.seconds), [5940], '1.39.00-1尾 不应把 1尾 吞入区间');
    // 1:1:12 单数字分钟 H:M:SS
    const miab = processComment('40:00-1:1:12', 'MIAB-174', 7200);
    assert.deepStrictEqual(miab.timestamps[0].seconds, [2400, 3672], '40:00-1:1:12 应解析为 [2400, 3672]');
    // 负数区间双重反转修复 (-1:42:07~-1:42:04)
    const doa = processComment('-1:42:07~-1:42:04', 'DOA-041', 7200);
    assert.strictEqual(doa.isCountdownComment, true);
    assert.deepStrictEqual(doa.timestamps[0].seconds, [1073, 1076], '负数倒计时区间应正序换算为 [1073, 1076]');
    const toggledBack = applyCommentCountdown(doa.timestamps, 7200, false);
    assert.deepStrictEqual(toggledBack[0].seconds, [6127, 6124], '关闭倒计时换算应还原为原始偏移 [6127, 6124]');
}

// -------------------------------------------------------------
// 3. 同系列残缺番号识别与高亮联动验证
// -------------------------------------------------------------
{
    const c1 = processComment('看预告片感觉一般般啊，远不如490', 'AEGE-045', 7200);
    assert.deepStrictEqual(c1.avcodes, ['AEGE-490'], '同系列简称 490 应补全为 AEGE-490');
    assert.ok(c1.textHtml.includes('data-code="AEGE-490"'), '高亮 HTML 必须包含可点击的 data-code="AEGE-490"');

    const c2 = processComment('这部没有528的嫌弃脸，没有398的自愿性，我最喜欢641', 'IPX-811', 7200);
    assert.deepStrictEqual(c2.avcodes, ['IPX-528', 'IPX-398', 'IPX-641'], '多同系列简称应全部补全且不误抓时间戳');
    assert.strictEqual(c2.timestamps.length, 0, '398 等已识别为番号的数字不得重复落入 L5 时间戳');

    // 显式跨系列串联不得被当前片 prefix 抢占
    const c3 = processComment('还在DDSC-031、036里玩过，SSIS-465與437也不错', 'MISM-363', 7200);
    assert.ok(c3.avcodes.includes('DDSC-036'), 'DDSC-031、036 应识别 DDSC-036');
    assert.ok(c3.avcodes.includes('SSIS-437'), 'SSIS-465與437 应识别 SSIS-437');
    assert.ok(!c3.avcodes.includes('MISM-036') && !c3.avcodes.includes('MISM-437'), '严禁串联尾号污染为当前系列');

    // ipx 292 不得污染为 IPZZ-292
    const c4 = processComment('ipx 292 才是巅峰', 'IPZZ-248', 7200);
    assert.deepStrictEqual(c4.avcodes, ['IPX-292']);

    // 身高/黑话/4位数刷屏/磁链屏蔽
    assert.deepStrictEqual(extractAVCodes('180，腹肌，大，还有2486和155这样的矮瘦子，24小时，magnet:?xt=urn:btih:abc490def', 'IPX-811'), []);

    // highlightCommentText 支持同系列部分尾号独立高亮
    const html = highlightCommentText('继398后又一神作', [], ['IPX-398'], { contextPrefix: 'IPX-811' });
    assert.ok(html.includes('data-code="IPX-398"') && html.includes('>398</span>'), '同系列尾号 398 应包裹为可点击预览链接');
}

// -------------------------------------------------------------
// 4. CommentPanel 调用契约与 Supabase 上报方案升级验证
// -------------------------------------------------------------
{
    const panelSrc = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');
    assert.ok(
        !panelSrc.includes('processComment(item.content_raw, duration'),
        'CommentPanel._mergeRemoteComments 不得再误传 duration 作为 contextPrefix'
    );
    assert.ok(
        !panelSrc.includes('processComment(item.text, duration'),
        'CommentPanel._mergeWebdavComments 不得再误传 duration 作为 contextPrefix'
    );
    assert.ok(
        panelSrc.includes('highlightCommentText(comment.rawText || comment.text, comment.timestamps, comment.avcodes || [], { contextPrefix: this.videoCode })'),
        'toggleCommentCountdown 重渲染时必须传入 contextPrefix'
    );

    const migSrc = fs.readFileSync('supabase/migrations/20261113000000_upgrade_comment_reports.sql', 'utf8');
    assert.ok(migSrc.includes('parser_snapshot jsonb') && migSrc.includes('reason_code text'), 'migration 应包含结构化诊断列');

    const reportModalSrc = fs.readFileSync('src/player/comments/CommentReportModal.js', 'utf8');
    assert.ok(
        reportModalSrc.includes('<div class="tm-report-modal-dialog">') &&
        reportModalSrc.includes("extraClass: 'tm-report-modal-overlay'"),
        'CommentReportModal 必须用 tm-report-modal-dialog 包裹并传入 extraClass，避免 Flex 遮罩横向排布坍塌'
    );

    // 模拟 v2 RPC 尚未部署 (返回 404) 时自动降级至 v1 6参数 RPC 并附带 [diag: ...]
    const origIsShared = SupabaseService.isSharedMode;
    const origGetConfig = SupabaseService.getConfig;
    const origRequest = SupabaseService.request;
    const capturedCalls = [];
    try {
        SupabaseService.isSharedMode = () => true;
        SupabaseService.getConfig = () => ({ isEnabled: true, baseUrl: 'https://example.supabase.co/rest/v1', apiKey: 'test' });
        SupabaseService.request = async (opts) => {
            capturedCalls.push({ url: opts.url, data: JSON.parse(opts.data) });
            // 第一次调用 12 参数 RPC 模拟 404，第二次调用 6 参数 RPC 成功
            if (capturedCalls.length === 1) return { status: 404, responseText: 'Not Found' };
            return { status: 200, responseText: '{"success":true}' };
        };

        const ok = await SupabaseService.submitCommentReport({
            videoCode: 'IPX-811',
            commentId: 'c_100',
            userName: 'tester',
            commentText: '28:10 本片超经典',
            reason: '漏抓或算错',
            reasonCode: 'missed_or_wrong_time',
            userNote: '漏抓了开头',
            expectedHint: '28:10',
            scriptVersion: '5.7.118-beta.029',
            sourceSite: 'jable',
            videoDuration: 7200,
            parserSnapshot: {
                timestamps: [{ raw: '28:10', seconds: 1690, level: 'L1' }],
                avcodes: ['IPX-398'],
                isCountdown: false,
                countdownApplied: false,
                flaggedItems: ['ts:28:10']
            }
        });

        assert.strictEqual(ok, true, 'RPC v2 -> v1 兼容降级应返回 true');
        assert.strictEqual(capturedCalls.length, 2, '应先尝试 v2 12 参数再降级 v1 6 参数');
        assert.strictEqual(capturedCalls[0].data.p_reason_code, 'missed_or_wrong_time');
        assert.strictEqual(capturedCalls[0].data.p_video_duration, 7200);
        assert.ok(capturedCalls[1].data.p_user_note.includes('[diag:'), '降级载荷必须在 user_note 中保留诊断摘要');
        assert.ok(capturedCalls[1].data.p_user_note.includes('expect=28:10'), '降级载荷必须包含期望答案');
    } finally {
        SupabaseService.isSharedMode = origIsShared;
        SupabaseService.getConfig = origGetConfig;
        SupabaseService.request = origRequest;
    }
}

// -------------------------------------------------------------
// 5. Phase 22 V3 跨层消歧、动态校准与等长掩码回归验证 (R-01 ~ R-18)
// -------------------------------------------------------------
{
    // R-01 & R-02: 4层交叉消歧（孤立番号尾号与同系列斜杠列表不再被 L5 抢占）
    const r01 = processComment('398是梦开始的地方', 'IPX-451', 7200);
    assert.deepStrictEqual(r01.avcodes, ['IPX-398'], 'R-01: 句首 398 应优先识别为 IPX-398');
    assert.strictEqual(r01.timestamps.length, 0, 'R-01: IPX-398 不得残余 L5 时间戳');

    const r02 = processComment('145/232/256好像就这三部流出', 'STARS-145', 7200);
    assert.deepStrictEqual(r02.avcodes, ['STARS-145', 'STARS-232', 'STARS-256'], 'R-02: 同系列斜杠列表应整体识别为番号');
    assert.strictEqual(r02.timestamps.length, 0, 'R-02: 同系列斜杠列表不得被 L5 斜杠吞并');
    assert.ok(r02.textHtml.includes('data-code="STARS-145"') && r02.textHtml.includes('data-code="STARS-232"') && r02.textHtml.includes('data-code="STARS-256"'), '145/232/256 必须全部渲染为可点击番号胶囊');

    // 真机截图实测修复：裸 27m、全片/冲击近两小时防误报、两小时后的强度、1h47m到50m 小时继承、就只有一小时五十一分
    const scr2 = processComment('27m姿势封面回收，对这种不好好读书出来援交的小母狗就要用这种姿势干。1h13m四人轮流冲击小母狗', 'STARS-256', 7200);
    assert.deepStrictEqual(scr2.timestamps.map(t => t.seconds), [1620, 4380], '27m 与 1h13m 均应识别为时间戳');

    const scr3 = processComment('这么猛烈冲击近两小时，感觉神经早已经迟钝了', 'STARS-256', 7200);
    assert.strictEqual(scr3.timestamps.length, 0, '猛烈冲击近两小时为持续时长，不得误标时间戳');

    const scr4 = processComment('全片两小时基本上95都是这个姿势', 'STARS-256', 7200);
    assert.strictEqual(scr4.timestamps.length, 0, '全片两小时为片长描述，不得误标时间戳');

    const scr5 = processComment('两小时后的强度不错，值得收藏', 'XRW-813', 7200);
    assert.deepStrictEqual(scr5.timestamps.map(t => t.seconds), [7200], '两小时后含定位锚点，应识别为 7200s');

    const scr6 = processComment('1h17m这个姿势表情绝了，还有1h30m和1h47m到50m', 'SONE-016', 7200);
    assert.strictEqual(scr6.isCountdownComment, false, '1h47m到50m 不得误判为倒计时');
    assert.deepStrictEqual(scr6.timestamps.map(t => t.seconds), [4620, 5400, [6420, 6600]], '50m 应继承 1h 变为 1h50m (6600s)');

    const scr7 = processComment('就只有一小时五十一分有点看头', 'MIDE-849', 7200);
    assert.deepStrictEqual(scr7.timestamps.map(t => t.seconds), [6660], '就只有一小时五十一分应识别为 6660s');

    // R-03 & R-15 & R-17: 多连写分钟、中文零分钟、小时链继承
    const r03 = processComment('95、104、114、118分钟连续4发中出', 'MIAA-710', 10800);
    assert.deepStrictEqual(r03.timestamps.map(t => t.seconds), [5700, 6240, 6840, 7080], 'R-03: 顿号分隔多分钟均应独立提取');

    const r15 = processComment('一小时零四分40秒开始', 'ABW-118', 7200);
    assert.deepStrictEqual(r15.timestamps.map(t => t.seconds), [3880], 'R-15: 一小时零四分40秒应准确识别为 3880s');

    const r17 = processComment('2h13，18，30舔脚', 'PRED-772', 10800);
    assert.deepStrictEqual(r17.timestamps.map(t => t.seconds), [7980, 8280, 9000], 'R-17: 2h13 后紧跟 18、30 应继承 2h 量纲');

    // R-18: 两段式边界跨 hourLimit 序列统一降维
    const r18 = processComment('2:28, 3:03太顶了', 'IPZZ-243', 7200);
    assert.deepStrictEqual(r18.timestamps.map(t => t.seconds), [148, 183], 'R-18: 2:28 与 3:03 应统一校准为 MM:SS');
    assert.strictEqual(r18.isCountdownComment, false, 'R-18: 不得因量纲跳变误判为倒计时');

    // R-04 / R-14 / R-16 / 日期 & 三围屏蔽
    const r04 = processComment('11月7号上映...我日117快点来啊！', 'PRED-193', 7200);
    assert.deepStrictEqual(r04.avcodes, [], 'R-04: 日期衍生数字 117 不得误推导为 PRED-117');

    const r14 = processComment('这部片子居然长达150min，前120min节奏不错', 'IPZZ-046', 10800);
    assert.strictEqual(r14.timestamps.length, 0, 'R-14: 片长描述 150min / 120min 不得误标为跳转时间点');

    const r16 = processComment('身高160 三围84-58-85 身材真好', 'ABF-132', 7200);
    assert.strictEqual(r16.timestamps.length, 0, 'R-16: 三围 84-58-85 不得误识别为 H-MM-SS');

    // 混合正序区间的局部非负倒序归正 & 发售月日屏蔽
    const royd = processComment('1:45:50~1:15:15 1:23:45~1:24:20 2:04:25~2:05:25', 'ROYD-112', 10800);
    assert.strictEqual(royd.isCountdownComment, false, '含正序区间的评论不应误判为倒计时');
    assert.deepStrictEqual(royd.timestamps[0].seconds, [4515, 6350], '非倒计时评论的局部逆序区间应归正为 [min, max]');

    const predDate = processComment('新作预告 PRED-515 11.21', 'PRED-505', 7200);
    assert.deepStrictEqual(predDate.avcodes, ['PRED-515']);
    assert.strictEqual(predDate.timestamps.length, 0, '番号后的发售月日 11.21 不得误抓为时间戳');

    // B-3: 位置精确高亮（避免误把 "打10分" 的 10 高亮）与 L5 轻量视觉降噪类
    const dupProc = processComment('打10分，后面10分钟和2h13，18都超神', 'ABW-196', 10800);
    assert.ok(!dupProc.textHtml.includes('打<span class="jc-time-link'), '打10分 中的 10 不得被高亮');
    assert.ok(dupProc.textHtml.includes('后面<span class="jc-time-link'), '10分钟 应在正确位置被高亮');
    assert.ok(dupProc.textHtml.includes('is-low-confidence'), 'L5 胶囊应附带 .is-low-confidence 轻量降噪类名');

    // Report v2 去重迁移与智能默认弹窗检查
    const dedupSql = fs.readFileSync('supabase/migrations/20261113000001_dedup_comment_reports.sql', 'utf8');
    assert.ok(dedupSql.includes('report_fingerprint') && dedupSql.includes('report_count'), 'Report 去重迁移必须定义指纹与计数列');
    const modalSrc = fs.readFileSync('src/player/comments/CommentReportModal.js', 'utf8');
    assert.ok(modalSrc.includes('pipelineVersion') && modalSrc.includes('commentHash'), 'ReportModal 必须携带 pipelineVersion 与 commentHash 快照');

    // ReportModal 版本获取与真实 DOM 点击提交链路回归（防止 SleazyForkService.getCurrentVersion 缺失导致提交无响应）
    assert.strictEqual(typeof getCurrentVersion(), 'string', 'getCurrentVersion() 必须返回有效版本字符串');
    assert.strictEqual(SleazyForkService.getCurrentVersion(), getCurrentVersion(), 'SleazyForkService.getCurrentVersion() 静态代理必须可用');

    // 轻量 DOM 仿真执行 showCommentReportModal -> 点击问题类型 -> 点击提交
    const prevDoc = globalThis.document;
    const prevWin = globalThis.window;
    const prevRaf = globalThis.requestAnimationFrame;
    const prevSubmit = SupabaseService.submitCommentReport;
    const prevFetch = globalThis.fetch;
    try {
        globalThis.requestAnimationFrame = (fn) => { fn(); return 0; };
        const listeners = new WeakMap();
        const makeEl = (tag) => {
            const attrs = new Map();
            const classes = new Set();
            const el = {
                tagName: tag.toUpperCase(),
                children: [],
                style: {},
                value: '',
                disabled: false,
                textContent: '',
                dataset: {},
                parentNode: null,
                classList: {
                    add: (...c) => c.forEach(x => classes.add(x)),
                    remove: (...c) => c.forEach(x => classes.delete(x)),
                    toggle: (c, f) => (f === undefined ? (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true)) : (f ? (classes.add(c), true) : (classes.delete(c), false))),
                    contains: (c) => classes.has(c)
                },
                get className() { return Array.from(classes).join(' '); },
                set className(v) { classes.clear(); String(v || '').split(/\s+/).filter(Boolean).forEach(x => classes.add(x)); },
                setAttribute(k, v) { attrs.set(k, String(v)); },
                getAttribute(k) { return attrs.get(k) ?? null; },
                appendChild(c) { c.parentNode = el; el.children.push(c); return c; },
                removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); c.parentNode = null; return c; },
                addEventListener(type, fn) {
                    if (!listeners.has(el)) listeners.set(el, {});
                    const map = listeners.get(el);
                    if (!map[type]) map[type] = [];
                    map[type].push(fn);
                },
                removeEventListener() {},
                async dispatch(type, evt = {}) {
                    const map = listeners.get(el) || {};
                    for (const fn of (map[type] || [])) {
                        await fn({ target: el, currentTarget: el, preventDefault() {}, stopPropagation() {}, cancelable: true, ...evt });
                    }
                },
                focus() {},
                blur() {},
                select() {},
                closest() { return null; },
                contains(x) { return x === el || el.children.some(c => c.contains?.(x)); },
                querySelector() { return null; },
                querySelectorAll() { return []; },
                set innerHTML(html) {
                    el._html = String(html || '');
                },
                get innerHTML() { return el._html || ''; }
            };
            return el;
        };

        const body = makeEl('body');
        const createdNodes = [];
        globalThis.document = {
            body,
            documentElement: makeEl('html'),
            createElement: (t) => { const n = makeEl(t); createdNodes.push(n); return n; },
            querySelector: () => null,
            addEventListener: () => {},
            removeEventListener: () => {}
        };
        globalThis.window = {
            innerWidth: 390,
            innerHeight: 844,
            location: { href: 'https://jable.tv/videos/ipx-811/', hostname: 'jable.tv' },
            addEventListener: () => {},
            removeEventListener: () => {}
        };

        // 为 modal.innerHTML 提供真实结构化子控件映射，验证完整点击提交链路
        let submittedPayload = null;
        SupabaseService.submitCommentReport = async (payload) => {
            submittedPayload = payload;
            return true;
        };

        const origCreateEl = globalThis.document.createElement;
        let reportModalEl = null;
        const reasonBtns = [makeEl('button'), makeEl('button')];
        reasonBtns[0].dataset.reasonCode = 'false_timestamp';
        reasonBtns[0].dataset.reasonLabel = '错标';
        reasonBtns[0].classList.add('active');
        reasonBtns[1].dataset.reasonCode = 'missed_or_wrong_time';
        reasonBtns[1].dataset.reasonLabel = '漏标/不准';
        const presetsEl = makeEl('div');
        const smartInput = makeEl('input');
        const expandNoteBtn = makeEl('button');
        const cancelBtn = makeEl('button');
        const submitBtn = makeEl('button');
        submitBtn.className = 'tm-custom-modal-submit-btn';
        submitBtn.textContent = '提交';

        globalThis.document.createElement = (tag) => {
            const node = origCreateEl(tag);
            const origDesc = Object.getOwnPropertyDescriptor(node, 'innerHTML');
            Object.defineProperty(node, 'innerHTML', {
                set(v) {
                    origDesc.set.call(this, v);
                    if (String(v).includes('tm-report-modal-dialog')) {
                        reportModalEl = node;
                        node.querySelector = (sel) => {
                            if (sel === '.tm-report-quick-presets') return presetsEl;
                            if (sel === '.tm-report-smart-input') return smartInput;
                            if (sel === '.tm-report-expand-note-btn') return expandNoteBtn;
                            if (sel === '.tm-custom-modal-cancel-btn') return cancelBtn;
                            if (sel === '.tm-custom-modal-submit-btn') return submitBtn;
                            return makeEl('div');
                        };
                        node.querySelectorAll = (sel) => {
                            if (sel === '.tm-report-chip') return reasonBtns;
                            if (sel === '.tm-report-diag-pill') return [];
                            return [];
                        };
                    }
                },
                get() { return origDesc.get.call(this); }
            });
            return node;
        };

        showCommentReportModal({
            comment: {
                id: 'c-submit-test',
                user: 'Tester',
                rawText: '这段挺好 27m 开始',
                text: '这段挺好 27m 开始',
                timestamps: [{ raw: '27m', seconds: 1620, level: 'L3', confidence: 'high', isCountdown: false }],
                avcodes: []
            },
            videoCode: 'STARS-256',
            videoDuration: 7200,
            sourceSite: 'Jable'
        });

        assert.ok(reportModalEl, 'showCommentReportModal 应成功创建弹窗容器');
        await reasonBtns[1].dispatch('click');
        smartInput.value = '27:00';
        await submitBtn.dispatch('click');

        assert.ok(submittedPayload, '点击提交按钮必须实际触发 SupabaseService.submitCommentReport');
        assert.strictEqual(submittedPayload.reasonCode, 'missed_or_wrong_time', '提交 payload 必须包含当前选中的 reasonCode');
        assert.strictEqual(submittedPayload.expectedHint, '27:00', '漏标/不准输入框内容必须映射到 expectedHint');
        assert.strictEqual(submittedPayload.scriptVersion, getCurrentVersion(), '提交 payload 必须携带正确 scriptVersion');
    } finally {
        globalThis.document = prevDoc;
        globalThis.window = prevWin;
        globalThis.requestAnimationFrame = prevRaf;
        SupabaseService.submitCommentReport = prevSubmit;
        globalThis.fetch = prevFetch;
    }
}

console.log('🎉 全部评论识别优化、同系列番号补全与上报机制回归测试通过！');
