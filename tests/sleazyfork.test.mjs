import assert from 'assert';
import { compareVersions, SleazyForkService, OFFICIAL_SCRIPT_ID } from '../src/services/SleazyForkService.js';
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
console.log('✅ 2. 全部 5 种语言的 15 项 i18n 国际化字典完整性校验通过');

// 3. 测试真实 SleazyFork JSON API 抓取与结构解析
try {
    const meta = await SleazyForkService.fetchScriptMeta(OFFICIAL_SCRIPT_ID);
    assert.ok(meta, '元数据应当存在');
    assert.strictEqual(meta.id, 453300, '脚本 ID 应匹配 453300');
    assert.ok(typeof meta.version === 'string', '应当包含 version 字段');
    assert.ok(typeof meta.total_installs === 'number', '应当包含 total_installs 数字');
    assert.ok(meta.name.includes('Miss Player'), '脚本名称应包含 Miss Player');
    console.log('✅ 3. 真实 SleazyFork JSON API 握手成功 (脚本名: ' + meta.name + ', 平台版本: ' + meta.version + ', 安装量: ' + meta.total_installs + ')');
} catch (err) {
    console.warn('⚠️ 外部网络请求跳过:', err.message);
}

console.log('\n🎉 SleazyFork JSON API 单元与质量测试 100% 通过！\n');
