import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const readFile = (rel) => fs.readFileSync(path.join(rootDir, rel), 'utf8');

/**
 * 从源码中抽取静态方法体并编译为可执行函数（纯字符串逻辑，无需 DOM 环境）
 */
function extractStaticMethod(source, methodName) {
    const startIdx = source.indexOf(`static ${methodName}(`);
    assert.notEqual(startIdx, -1, `未找到 static ${methodName}(`);
    const braceStart = source.indexOf('{', startIdx);
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                const body = source.slice(braceStart + 1, i);
                // eslint-disable-next-line no-new-func
                return new Function('rawSource', 'commentId', body);
            }
        }
    }
    throw new Error(`未找到 ${methodName} 方法体结束大括号`);
}

test('1. inferSiteKey 以 site_comment_id 前缀为权威推断真实站点（串源核心回归）', () => {
    const panelSrc = readFile('src/player/controls/CommentPanel.js');
    const inferSiteKey = extractStaticMethod(panelSrc, 'inferSiteKey');

    // 显式来源字符串
    assert.equal(inferSiteKey('jable', '1'), 'jable');
    assert.equal(inferSiteKey('JAVDB', '1'), 'javdb');
    assert.equal(inferSiteKey('javlibrary', '1'), 'javlib');
    assert.equal(inferSiteKey('javlib-review', '1'), 'javlib');

    // 关键回归：来源字段被历史 BUG 错标为 jable，但 ID 前缀指向 JavDB
    assert.equal(inferSiteKey('jable', 'javdb-api-3-5'), 'javdb');
    assert.equal(inferSiteKey('jable', 'javdb-html-1-0'), 'javdb');
    assert.equal(inferSiteKey('jable', 'javlib-comments-2-7'), 'javlib');
    assert.equal(inferSiteKey('jable', 'javlib-review-1-3'), 'javlib');

    // 来源字段完全缺失时的兜底
    assert.equal(inferSiteKey(undefined, 'javdb-api-1-0'), 'javdb');
    assert.equal(inferSiteKey('', 'javlib-comments-1-1'), 'javlib');
    assert.equal(inferSiteKey(undefined, '9461234'), 'jable');
    assert.equal(inferSiteKey(null, null), 'jable');
});

test('2. CommentPanel 具备跨站点分桶归一化自愈能力', () => {
    const panelSrc = readFile('src/player/controls/CommentPanel.js');

    assert.ok(panelSrc.includes('_normalizeSiteBuckets()'), '缺少 _normalizeSiteBuckets 定义');
    assert.ok(panelSrc.includes('_inferCommentSite(c)'), '缺少 _inferCommentSite 调用');

    // 缓存恢复后必须自愈旧脏缓存
    const restoreIdx = panelSrc.indexOf('\n    _restoreSitesFromCache(');
    assert.notEqual(restoreIdx, -1, '未找到 _restoreSitesFromCache 定义');
    const restoreBody = panelSrc.slice(restoreIdx, restoreIdx + 4000);
    assert.ok(restoreBody.includes('this._normalizeSiteBuckets()'), '缓存恢复未执行分桶归一化');

    // 重解析回写时必须先归一化，且只上传真实归属本站点的评论
    const reprocessIdx = panelSrc.indexOf('\n    reprocessComments(');
    assert.notEqual(reprocessIdx, -1, '未找到 reprocessComments 定义');
    const reprocessBody = panelSrc.slice(reprocessIdx, reprocessIdx + 4000);
    assert.ok(reprocessBody.includes('this._normalizeSiteBuckets()'), 'reprocessComments 未执行分桶归一化');
    assert.ok(
        reprocessBody.includes('this._inferCommentSite(c) === sKey'),
        'reprocessComments 未按站点过滤上传评论（存在跨站点串源回写风险）'
    );
});

test('3. 远端 / WebDAV 合并按「来源字段 + 评论 ID」双通道分桶', () => {
    const panelSrc = readFile('src/player/controls/CommentPanel.js');

    const remoteIdx = panelSrc.indexOf('\n    _mergeRemoteComments(');
    assert.notEqual(remoteIdx, -1, '未找到 _mergeRemoteComments 定义');
    const remoteBody = panelSrc.slice(remoteIdx, remoteIdx + 1500);
    assert.ok(
        remoteBody.includes('item.source_site || item.source || item.site'),
        '_mergeRemoteComments 未兼容三种来源字段'
    );
    assert.ok(
        remoteBody.includes('item.site_comment_id || item.id'),
        '_mergeRemoteComments 未将评论 ID 传入分桶推断'
    );

    const webdavIdx = panelSrc.indexOf('\n    _mergeWebdavComments(');
    assert.notEqual(webdavIdx, -1, '未找到 _mergeWebdavComments 定义');
    const webdavBody = panelSrc.slice(webdavIdx, webdavIdx + 1500);
    assert.ok(
        webdavBody.includes('item.source_site || item.source || item.site'),
        '_mergeWebdavComments 未兼容三种来源字段'
    );
    assert.ok(
        webdavBody.includes('item.site_comment_id || item.id'),
        '_mergeWebdavComments 未将评论 ID 传入分桶推断'
    );
});

test('4. 源站采集结果必须显式携带 source_site 归属', () => {
    const panelSrc = readFile('src/player/controls/CommentPanel.js');
    const mapIdx = panelSrc.indexOf('const processed = (res.comments || []).map(');
    assert.notEqual(mapIdx, -1, '未找到源站采集 processed 映射');
    const mapBody = panelSrc.slice(mapIdx, mapIdx + 500);
    assert.ok(mapBody.includes('source_site: siteKey'), '采集结果未标注 source_site，后续会被误判进 jable 桶');
});

test('5. SupabaseService.uploadComments 具备跨站点串源入库守卫', () => {
    const svcSrc = readFile('src/services/SupabaseService.js');
    const fnIdx = svcSrc.indexOf('static async uploadComments(');
    assert.notEqual(fnIdx, -1);
    const fnBody = svcSrc.slice(fnIdx, fnIdx + 3000);

    assert.ok(fnBody.includes('normalizedSite'), 'uploadComments 未归一站点标识');
    assert.ok(fnBody.includes("idLower.startsWith('javdb')"), '缺少 JavDB ID 前缀判定');
    assert.ok(fnBody.includes("idLower.startsWith('javlib')"), '缺少 JavLib ID 前缀判定');
    assert.ok(fnBody.includes('if (idSite && idSite !== normalizedSite) continue;'), '缺少跨站点串源丢弃守卫');
    assert.ok(
        fnBody.includes("md5(normalizedSite + '_' + siteId + '_' + content)"),
        '指纹未使用归一站点，仍会产生双写指纹'
    );
    assert.ok(fnBody.includes('source_site: normalizedSite'), '入库行未使用归一站点');
    assert.ok(fnBody.includes('p_source: normalizedSite'), 'RPC 来源未归一');
});

test('6. CommentDebugCollector 采集调试数据按真实站点归一', () => {
    const collectorSrc = readFile('src/player/comments/CommentDebugCollector.js');
    assert.ok(
        collectorSrc.includes('c.source_site || c.site || c.source'),
        '未兼容 Provider 的 site 字段（历史串源根因）'
    );
    assert.ok(collectorSrc.includes('source_site: siteKey'), '调试数据未写入归一 source_site');
    assert.ok(collectorSrc.includes('const key = `${siteKey}_${c.id}`'), '去重键未使用归一站点');
});

test('7. Supabase 历史脏数据修复迁移存在且幂等可重复执行', () => {
    const migrationPath = 'supabase/migrations/20261117000000_normalize_comment_source_site.sql';
    assert.ok(fs.existsSync(path.join(rootDir, migrationPath)), '缺少 source_site 归一化修复迁移');

    const sql = readFile(migrationPath);
    assert.ok(sql.includes('normalize_bundle_comment_sources'), '缺少修复函数');
    assert.ok(sql.includes("jsonb_set(value, '{source_site}'"), '缺少按 ID 前缀重标 source_site');
    assert.ok(sql.includes("like 'javdb%'"), '缺少 JavDB 前缀重标');
    assert.ok(sql.includes("like 'javlib%'"), '缺少 JavLib 前缀重标');
    assert.ok(sql.includes("~ '^[0-9]+$'"), '缺少 Jable 纯数字 ID 重标');
    assert.ok(sql.includes('distinct on ('), '缺少去重逻辑（历史双写指纹会残留重复）');
    assert.ok(!sql.includes('delete from'), '修复迁移不应直接删除行，须靠去重聚合收敛');
});
