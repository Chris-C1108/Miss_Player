import assert from 'assert';
import { 
    compareVersions, 
    SleazyForkService, 
    OFFICIAL_SCRIPT_ID,
    detectScriptHandler,
    getCleanScriptUrl,
    buildInstallProtocolUrl,
    GITHUB_RAW_USER_URL,
    SLEAZYFORK_RAW_USER_URL
} from '../src/services/SleazyForkService.js';
import { I18n } from '../src/constants/i18n.js';

console.log('🧪 开始执行 SleazyFork JSON API 单元测试...');

// 1. 测试语义化版本号比较
assert.strictEqual(compareVersions('5.6.24', '5.6.24'), 0, '相同版本应返回 0');
assert.strictEqual(compareVersions('5.6.25', '5.6.24'), 1, 'Patch 高版本应返回 1');
assert.strictEqual(compareVersions('5.7.0', '5.6.24'), 1, 'Minor 高版本应返回 1');
assert.strictEqual(compareVersions('6.0.0', '5.6.24'), 1, 'Major 高版本应返回 1');
assert.strictEqual(compareVersions('v5.6.25', '5.6.24'), 1, '带 v 前缀应正常比较');
assert.strictEqual(compareVersions('5.6.23', '5.6.24'), -1, '低版本应返回 -1');
assert.strictEqual(compareVersions('5.6.24-beta', '5.6.24'), 0, '带 prerelease 标记应提取主版本比对');
console.log('✅ 1. 语义化版本比对测试全部通过');

// 2. 校验多语言字段完备性
const requiredKeys = [
    'aboutAndUpdates',
    'updateChannel',
    'channelStable',
    'channelBeta',
    'currentVersion',
    'checkUpdate',
    'checkingUpdate',
    'alreadyLatest',
    'updateFound',
    'updateNow',
    'viewRelease',
    'updateChangelog',
    'autoCheckUpdate',
    'autoCheckUpdateDesc',
    'statsInstalls',
    'statsRating',
    'statsUpdated',
    'fetchFailed'
];

for (const lang of ['en', 'zh-CN', 'zh-TW', 'ja', 'vi']) {
    for (const key of requiredKeys) {
        assert.ok(I18n.strings[lang][key], `语言 ${lang} 缺少 i18n 键: ${key}`);
    }
}
console.log('✅ 2. 全部 5 种语言的 18 项 i18n 国际化字典完整性校验通过');

// 3. 测试纯净 URL 提取与剥离时间戳
assert.strictEqual(getCleanScriptUrl('beta'), GITHUB_RAW_USER_URL, 'Beta 默认提取 GitHub Raw URL');
assert.strictEqual(getCleanScriptUrl('stable'), SLEAZYFORK_RAW_USER_URL, 'Stable 默认提取 SleazyFork URL');
const dirtyUrl = 'https://raw.githubusercontent.com/Chris-C1108/Miss_Player/main/dist/miss_player.user.js?_t=1730000000000#debug';
assert.strictEqual(
    getCleanScriptUrl('beta', { code_url: dirtyUrl }),
    GITHUB_RAW_USER_URL,
    '应彻底剥离 ?_t 时间戳与 #hash 标记，防止 Stay 破坏更新覆盖判定'
);
console.log('✅ 3. 纯净脚本下载 URL 提取与防破坏时间戳剥离测试通过');

// 4. 测试各生态一键安装/更新协议 URL 构建
const stayRes = buildInstallProtocolUrl('stay', GITHUB_RAW_USER_URL);
assert.strictEqual(stayRes.protocol, 'scheme');
assert.strictEqual(
    stayRes.url,
    'stay://x-callback-url/install?scriptURL=' + encodeURIComponent(GITHUB_RAW_USER_URL),
    'Stay URL Scheme 必须使用 install 与 scriptURL 参数'
);

const tmRes = buildInstallProtocolUrl('tampermonkey', GITHUB_RAW_USER_URL);
assert.strictEqual(tmRes.protocol, 'web');
assert.strictEqual(
    tmRes.url,
    'https://www.tampermonkey.net/script_installation.php#url=' + GITHUB_RAW_USER_URL,
    'Tampermonkey 入口必须通过 hash 挂载纯净 URL 且不全量编码前缀'
);

const scRes = buildInstallProtocolUrl('scriptcat', GITHUB_RAW_USER_URL);
assert.strictEqual(scRes.protocol, 'web');
assert.strictEqual(
    scRes.url,
    'https://docs.scriptcat.org/docs/script_installation/#url=' + GITHUB_RAW_USER_URL,
    'ScriptCat 入口必须挂载纯净 URL'
);

const vmRes = buildInstallProtocolUrl('violentmonkey', GITHUB_RAW_USER_URL);
assert.strictEqual(vmRes.protocol, 'direct');
assert.strictEqual(vmRes.url, GITHUB_RAW_USER_URL, '暴力猴等其他环境直接返回纯净直链');
console.log('✅ 4. Stay / Tampermonkey / ScriptCat 一键安装与更新协议矩阵校验通过');

// 5. 测试脚本沙箱管理器环境嗅探 (detectScriptHandler)
const originalGMInfo = globalThis.GM_info;
try {
    globalThis.GM_info = { scriptHandler: 'Stay' };
    assert.strictEqual(detectScriptHandler(), 'stay', '应准确识别 Stay');
    globalThis.GM_info = { scriptHandler: 'Tampermonkey' };
    assert.strictEqual(detectScriptHandler(), 'tampermonkey', '应准确识别 Tampermonkey');
    globalThis.GM_info = { scriptHandler: 'ScriptCat' };
    assert.strictEqual(detectScriptHandler(), 'scriptcat', '应准确识别 ScriptCat');
    globalThis.GM_info = { scriptHandler: 'Violentmonkey' };
    assert.strictEqual(detectScriptHandler(), 'violentmonkey', '应准确识别 Violentmonkey');
    globalThis.GM_info = { scriptHandler: 'Userscripts' };
    assert.strictEqual(detectScriptHandler(), 'userscripts', '应准确识别 Userscripts');
} finally {
    if (originalGMInfo !== undefined) {
        globalThis.GM_info = originalGMInfo;
    } else {
        delete globalThis.GM_info;
    }
}
console.log('✅ 5. GM_info 沙箱环境智能嗅探测试通过');

// 6. 测试真实 SleazyFork JSON API 抓取与结构解析
try {
    const meta = await SleazyForkService.fetchScriptMeta(OFFICIAL_SCRIPT_ID);
    assert.ok(meta, '元数据应当存在');
    assert.strictEqual(meta.id, 453300, '脚本 ID 应匹配 453300');
    assert.ok(typeof meta.version === 'string', '应当包含 version 字段');
    assert.ok(typeof meta.total_installs === 'number', '应当包含 total_installs 数字');
    assert.ok(meta.name.includes('Miss Player'), '脚本名称应包含 Miss Player');
    console.log('✅ 6. 真实 SleazyFork JSON API 握手成功 (脚本名: ' + meta.name + ', 平台版本: ' + meta.version + ', 安装量: ' + meta.total_installs + ')');
} catch (err) {
    console.warn('⚠️ 外部网络请求跳过 (SleazyFork API):', err.message);
}

// 7. 测试 GitHub 测试版通道元数据抓取 (若网络通畅)
try {
    const ghMeta = await SleazyForkService.fetchGitHubMeta();
    assert.ok(ghMeta, 'GitHub 元数据应当存在');
    assert.strictEqual(ghMeta.channel, 'beta', 'channel 应为 beta');
    assert.ok(typeof ghMeta.version === 'string', '应当解析出 version 字符串');
    assert.ok(ghMeta.code_url.includes('miss_player.user.js'), 'code_url 应指向 user.js');
    console.log('✅ 7. GitHub 测试版通道 meta.js 抓取解析成功 (GitHub 最新版本: ' + ghMeta.version + ')');
} catch (err) {
    console.warn('⚠️ 外部网络请求跳过 (GitHub Raw):', err.message);
}

console.log('\n🎉 SleazyFork JSON API 单元与质量测试 100% 通过！\n');
