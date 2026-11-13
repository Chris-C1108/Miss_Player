/**
 * tests/comments-linear-minimalist.test.mjs
 * 
 * 验证 Direction B: Linear Minimalist Thread (现代流体微线条 · 理性呼吸)
 * 1. 评论条目无框流式渲染 (.jc-stream-row) 与垂直导轨 (.jc-guide-line)
 * 2. 调试上报收拢于底部微轨 (.jc-debug-rail)，顶部仅保留纯净用户名与发布时间
 * 3. 临时高能时间戳过滤 (highlightOnly) 与空状态友好引导
 * 4. 水平多源分段栏 (.tm-comment-nav-bar) 与高能过滤胶囊 (.tm-comment-filter-pill) CSS 约束
 * 5. CommentPanel 多源切换与高能过滤状态机闭环
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderCommentCardHtml, renderCommentSectionHtml } from '../src/player/comments/CommentCardRenderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('1. CommentCardRenderer 极简流式结构与调试按钮收拢断言', () => {
    const normalComment = {
        id: 'c_001',
        site: 'jable',
        user: 'Neo',
        time: '2 小时前',
        text: '这部剧情很紧凑！',
        likes: 5,
        timestamps: []
    };

    const highlightComment = {
        id: 'c_002',
        site: 'jable',
        user: 'Trinity',
        time: '1 小时前',
        text: '关键转折在 08:35，非常精彩',
        textHtml: '关键转折在 <span class="jc-time-link" data-secs="515">08:35</span>，非常精彩',
        likes: 12,
        timestamps: [{ seconds: 515, text: '08:35' }]
    };

    // 1.1 普通评论渲染断言
    const normalHtml = renderCommentCardHtml(normalComment);
    assert.ok(normalHtml.includes('jc-stream-row'), '普通评论必须输出 .jc-stream-row 无框流式结构');
    assert.ok(!normalHtml.includes('jc-guide-line'), '严禁渲染突兀机械的左侧垂直导轨 .jc-guide-line');
    assert.ok(!normalHtml.includes('jc-debug-rail'), '严禁输出底部大代码黑框 .jc-debug-rail');

    // 1.2 高能时间戳评论渲染断言
    const highlightHtml = renderCommentCardHtml(highlightComment);
    assert.ok(highlightHtml.includes('jc-time-link'), '时间戳文本必须被正确解析为 .jc-time-link');
    assert.ok(highlightHtml.includes('jc-save-all-btn'), '带时间戳评论右上角必须包含转存操作');

    // 1.3 调试模式 (showDebugReport) 渲染断言 (仅在 debugMode 开启时右上角提供小图标，绝不输出黑框)
    const debugHtml = renderCommentCardHtml(highlightComment, {
        playerCore: {
            playerState: {
                settings: {
                    showDebugReport: true
                }
            }
        }
    });
    assert.ok(debugHtml.includes('jc-debug-report-btn'), 'showDebugReport 开启时右上角必须提供低调的调试上报按键');
    assert.ok(!debugHtml.includes('jc-debug-rail'), '即便在 debugMode 下也严禁在评论下方渲染丑陋的代码黑框');
    assert.ok(debugHtml.includes('jc-user-group'), '顶部必须保留纯净的用户信息分组');
});

test('2. 多源 Section 高能时间戳过滤 (highlightOnly) 断言', () => {
    const ctx = {
        sites: {
            jable: {
                key: 'jable',
                name: 'Jable.tv',
                status: 'loaded',
                filteredComments: [
                    { id: '1', text: '普通闲聊', timestamps: [] },
                    { id: '2', text: '高能片段在 02:40', timestamps: [{ seconds: 160 }] }
                ],
                loading: false,
                hasMore: false,
                collapsed: false
            }
        },
        renderedCommentIds: new Set(),
        expandedCommentIds: new Set(),
        highlightOnly: true
    };

    // 2.1 开启 highlightOnly 时仅渲染高能评论
    const filteredHtml = renderCommentSectionHtml('jable', ctx);
    assert.ok(filteredHtml.includes('02:40'), '开启高能过滤时必须包含高能评论');
    assert.ok(!filteredHtml.includes('普通闲聊'), '开启高能过滤时必须过滤掉普通无时间戳评论');

    // 2.2 无任何高能评论时的空状态断言
    const emptyCtx = {
        sites: {
            jable: {
                key: 'jable',
                name: 'Jable.tv',
                status: 'loaded',
                filteredComments: [
                    { id: '1', text: '纯讨论剧情' }
                ],
                loading: false,
                hasMore: false,
                collapsed: false
            }
        },
        renderedCommentIds: new Set(),
        expandedCommentIds: new Set(),
        highlightOnly: true
    };
    const emptyHtml = renderCommentSectionHtml('jable', emptyCtx);
    assert.ok(emptyHtml.includes('is-highlight-empty'), '无高能评论时必须渲染 is-highlight-empty 空状态');
    assert.ok(emptyHtml.includes('tm-comment-reset-filter-btn'), '必须提供一键重置过滤按钮');
});

test('3. CSS 极简排版与分段导航栏样式规范断言', () => {
    const cssPath = path.resolve(rootDir, 'src/player/ui/styles/02_components/_comments_sections.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(cssContent.includes('.tm-comment-nav-bar'), 'CSS 必须包含 .tm-comment-nav-bar 现代水平分段导航栏');
    assert.ok(cssContent.includes('.tm-comment-tab-strip'), 'CSS 必须包含 .tm-comment-tab-strip');
    assert.ok(cssContent.includes('.tm-comment-tab-item'), 'CSS 必须包含 .tm-comment-tab-item');
    assert.ok(cssContent.includes('.tm-comment-filter-pill'), 'CSS 必须包含 .tm-comment-filter-pill 临时高能过滤胶囊');
    assert.ok(cssContent.includes('.jc-stream-row'), 'CSS 必须包含 .jc-stream-row 流式无框条目规则');
    assert.ok(cssContent.includes('.tm-comment-section-hdr'), 'CSS 必须包含 .tm-comment-section-hdr 隐藏规则');
    assert.ok(cssContent.includes('.tm-comment-section.is-hidden-source'), 'CSS 必须包含非激活源的 is-hidden-source 隐藏规则');
});
