import test from 'node:test';
import assert from 'node:assert/strict';
import {
    esc,
    sanitizeCommentUrl,
    sanitizeCommentColor,
    parseBBCode,
    highlightCommentText
} from '../src/player/comments/CommentDataPipeline.js';
import { isImeConfirmEnter } from '../src/utils/dom.js';
import { renderCommentCardHtml, renderCommentSectionHtml } from '../src/player/comments/CommentCardRenderer.js';

test('XSS 净化与 Safari IME 输入守卫单元测试', async (t) => {
    await t.test('1. esc() 对五种 HTML 关键字符全量转义', () => {
        assert.equal(esc(`<img src="x" onerror='alert(1)'>&`), '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;');
        assert.equal(esc(null), '');
        assert.equal(esc(undefined), '');
        assert.equal(esc(42), '42');
    });

    await t.test('2. sanitizeCommentUrl() 拦截危险协议与协议相对 URL', () => {
        assert.equal(sanitizeCommentUrl('javascript:alert(1)'), '');
        assert.equal(sanitizeCommentUrl('  JAVASCRIPT:alert(1)  '), '');
        assert.equal(sanitizeCommentUrl('data:text/html,<script>alert(1)</script>'), '');
        assert.equal(sanitizeCommentUrl('vbscript:msgbox(1)'), '');
        assert.equal(sanitizeCommentUrl('//evil.example/phish'), '');
        assert.equal(sanitizeCommentUrl('java\nscript:alert(1)'), '');
        assert.equal(sanitizeCommentUrl('/actors/123'), 'https://c97k.com/actors/123');
        assert.equal(sanitizeCommentUrl('https://jable.tv/videos/abc/?a=1&b=2'), 'https://jable.tv/videos/abc/?a=1&b=2');
    });

    await t.test('3. sanitizeCommentColor() 拦截属性逃逸与 CSS 注入', () => {
        assert.equal(sanitizeCommentColor('red" onmouseover="alert(1)'), '');
        assert.equal(sanitizeCommentColor('red; background: url(https://evil.com)'), '');
        assert.equal(sanitizeCommentColor('expression(alert(1))'), '');
        assert.equal(sanitizeCommentColor('#ff453a'), '#ff453a');
        assert.equal(sanitizeCommentColor('rgba(255, 69, 58, 0.85)'), 'rgba(255, 69, 58, 0.85)');
        assert.equal(sanitizeCommentColor('crimson'), 'crimson');
    });

    await t.test('4. parseBBCode() / highlightCommentText() 防 XSS 载荷', () => {
        const payload = '[url=javascript:alert(1)]点击[/url] [color=red" onmouseover="alert(1)]文本[/color] <img src=x onerror=alert(1)>';
        const rendered = highlightCommentText(payload, [], []);
        assert.equal(rendered.includes('javascript:'), false);
        assert.equal(rendered.includes('onmouseover'), false);
        assert.equal(rendered.includes('<img'), false);
        assert.equal(rendered.includes('&lt;img'), true);

        const safeUrlOut = highlightCommentText('[url=https://jable.tv/test/?a=1&b=2]正常链接[/url]', [], []);
        assert.equal(safeUrlOut.includes('href="https://jable.tv/test/?a=1&amp;b=2"'), true);
        assert.equal(safeUrlOut.includes('rel="noopener noreferrer"'), true);
    });

    await t.test('5. isImeConfirmEnter() 精准拦截中/日文输入法组合与 Safari 229 键码', () => {
        assert.equal(isImeConfirmEnter({ key: 'Enter', isComposing: true, keyCode: 13 }), false);
        assert.equal(isImeConfirmEnter({ key: 'Enter', isComposing: false, keyCode: 229 }), false);
        assert.equal(isImeConfirmEnter({ key: 'a', isComposing: false, keyCode: 65 }), false);
        assert.equal(isImeConfirmEnter({ key: 'Enter', isComposing: false, keyCode: 13 }), true);
    });

    await t.test('6. CommentCardRenderer 对第三方评论元数据执行全量 XSS 转义与协议过滤', () => {
        const cardHtml = renderCommentCardHtml({
            id: 'c1" onclick="alert(1)',
            user: '<script>alert(1)</script>',
            userUrl: 'javascript:alert(1)',
            score: '5"><svg onload=alert(1)>',
            time: '2026-11-12"><img src=x onerror=alert(1)>',
            text: '普通测试正文',
            textHtml: '普通测试正文',
            spam: { label: 'SPAM', reason: '" onmouseover="alert(1)', category: '<b>ad</b>' }
        });
        assert.equal(cardHtml.includes('<script>'), false);
        assert.equal(cardHtml.includes('javascript:'), false);
        assert.equal(cardHtml.includes('c1" onclick='), false);
        assert.equal(cardHtml.includes('c1&quot; onclick=&quot;'), true);
        assert.equal(cardHtml.includes('<svg'), false);
        assert.equal(cardHtml.includes('<img'), false);
        assert.equal(cardHtml.includes('" onmouseover='), false);
        assert.equal(cardHtml.includes('&quot; onmouseover=&quot;'), true);

        const safeCardHtml = renderCommentCardHtml({
            id: 'c2',
            user: 'Alice',
            userUrl: 'https://jable.tv/users/alice/',
            text: 'ok',
            textHtml: 'ok'
        });
        assert.equal(safeCardHtml.includes('href="https://jable.tv/users/alice/"'), true);
        assert.equal(safeCardHtml.includes('rel="noopener noreferrer"'), true);

        const sectionHtml = renderCommentSectionHtml('jable', {
            sites: {
                jable: {
                    key: 'jable',
                    name: 'Jable<script>alert(1)</script>',
                    status: 'not_found',
                    filteredComments: []
                }
            },
            renderedCommentIds: new Set(),
            expandedCommentIds: new Set()
        });
        assert.equal(sectionHtml.includes('<script>'), false);
        assert.equal(sectionHtml.includes('&lt;script&gt;'), true);
    });
});
