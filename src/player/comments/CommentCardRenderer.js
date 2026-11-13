/**
 * 评论卡片与来源分区 HTML 安全渲染器 (CommentCardRenderer)
 * 职责：统一负责评论卡片、来源分区状态块与站点登录状态徽章的 XSS 安全拼接
 */

import { __ } from '../../constants/i18n.js';
import { SITE_DOMAINS } from '../../constants/domains.js';
import { getValue } from '../../utils/index.js';
import { esc, sanitizeCommentUrl } from './CommentDataPipeline.js';

export const COMMENT_BADGE_TEXT_MAP = {
    'loading': '采集中...',
    'unreachable': '不可达',
    'not_found': '未收录',
    'empty': '暂无评论',
    'cf_shield': '需验证',
    'mobile_unsupported': '移动端浏览器不支持'
};

export function getCommentSectionBadgeText(site) {
    if (!site) return '';
    if (site.status === 'loaded') {
        return `共 ${site.filteredComments.length}${site.hasMore ? '+' : ''} 条`;
    }
    return COMMENT_BADGE_TEXT_MAP[site.status] || '';
}

export function renderLoginBadgeHtml(siteKey, siteLoginStates, provider) {
    if (!provider) return '';

    if (siteLoginStates[siteKey] === undefined || siteLoginStates[siteKey] === null) {
        if (typeof provider.getCachedLoginStatus === 'function') {
            siteLoginStates[siteKey] = provider.getCachedLoginStatus();
        }
    }

    const isLoggedIn = siteLoginStates[siteKey];
    if (isLoggedIn === true) {
        return `<span class="tm-comment-login-badge is-logged-in">已登录</span>`;
    } else if (isLoggedIn === false) {
        return `<span class="tm-comment-login-badge is-not-logged-in" title="点击登录" data-site="${esc(siteKey)}">未登录</span>`;
    }
    return `<span class="tm-comment-login-badge is-checking">检测中...</span>`;
}

export function renderCommentCardHtml(c, options = {}) {
    const { isNew = false, expandedCommentIds = null, playerCore = null } = options;
    const isLongText = c.text && c.text.length > 200;
    const isExpanded = expandedCommentIds ? (expandedCommentIds.has(c.id) || Boolean(c.isExpanded)) : false;
    const textClass = isLongText ? 'jc-body-text jc-body-text--collapsible' : 'jc-body-text';
    const expandBtnText = isExpanded ? (__('commentsCollapse') || '收起') : (__('commentsExpand') || '展开');
    const rawTextHtml = c.textHtml || c.text || '';
    const expandBtn = isLongText
        ? `<div class="jc-body-text-content">${rawTextHtml}</div><button class="jc-toggle-expand-btn">${expandBtnText}</button>`
        : rawTextHtml;

    const safeUserUrl = c.userUrl ? sanitizeCommentUrl(c.userUrl) : '';
    const safeUser = esc(c.user || '');
    const userHtml = safeUserUrl
        ? `<a href="${esc(safeUserUrl)}" target="_blank" rel="noopener noreferrer" class="jc-u">${safeUser}</a>`
        : `<span class="jc-u">${safeUser}</span>`;

    const scoreHtml = c.score ? `<span class="jc-score-badge" title="评分">${esc(c.score)}</span>` : '';
    const hasTimestamps = Array.isArray(c.timestamps) && c.timestamps.length > 0;
    const isConverted = !!c.countdownApplied;
    const btnText = isConverted
        ? (__('commentCountdownReverted') || '显示倒数')
        : (__('commentCountdownConvert') || '转为正序');
    const btnTitle = isConverted
        ? '当前已换算为实际播放时间，点击恢复显示原始倒数'
        : '若评论内容为剩余倒数时间，点击换算为实际播放时间';

    const countdownBtn = hasTimestamps
        ? `<button class="jc-countdown-btn${isConverted ? ' jc-countdown-btn--active' : ''}" title="${esc(btnTitle)}">${esc(btnText)}</button>`
        : '';
    const spamHtml = (c.spam && c.spam.label === 'SPAM')
        ? `<span class="jc-spam-badge" title="${esc(c.spam.reason || '')}">灌水: ${esc(c.spam.category || '')}</span>`
        : '';
    const safeCommentId = esc(c.id || '');
    const safeTime = (c.time && !c.time.includes('Invalid')) ? esc(c.time) : '';
    const playerState = playerCore?.playerState || playerCore?.options?.playerState;
    const showDebugReport = Boolean(
        playerState?.settings?.debugMode ||
        playerState?.settings?.showDebugReport ||
        getValue('debugMode', false)
    );

    return `
        <div class="jc-card jc-stream-row ${isNew ? 'jc-card--new' : ''} ${hasTimestamps ? 'has-timestamps' : ''}" data-id="${safeCommentId}">
            <div class="jc-guide-line ${hasTimestamps ? 'is-highlight' : ''}"></div>
            <div class="jc-row-content">
                <div class="jc-hdr jc-row-hdr">
                    <div class="jc-hdr-left jc-user-group">
                        ${userHtml}
                        ${safeTime ? `<span class="jc-t">${safeTime}</span>` : ''}
                    </div>
                    <div class="jc-hdr-right jc-badge-group">
                        ${scoreHtml}
                        ${spamHtml}
                        ${countdownBtn}
                        ${hasTimestamps ? `<button class="jc-action-btn jc-save-all-btn" title="${esc(__('saveAllHighlights') || '转存高光')}" data-comment-id="${safeCommentId}">📌 转存</button>` : ""}
                    </div>
                </div>
                <div class="${textClass}" ${isLongText ? `data-collapsed="${isExpanded ? 'false' : 'true'}"` : ''}>
                    ${expandBtn}
                </div>
                ${showDebugReport ? `
                <div class="jc-debug-rail">
                    <span class="jc-debug-meta">// dev: id=${safeCommentId}${c.source ? ` | src=${esc(c.source)}` : ''}</span>
                    <button class="jc-action-btn jc-report-btn jc-debug-report-btn" title="上报该评论" data-comment-id="${safeCommentId}">[🐛 上报]</button>
                </div>` : ''}
            </div>
        </div>
    `;
}

export function renderCommentSectionHtml(siteKey, ctx) {
    const {
        sites,
        playerCore,
        javlibVerifyingStatus,
        jableFailedDomain,
        javlibFailedDomain,
        renderedCommentIds,
        expandedCommentIds,
        renderLoginBadge,
        highlightOnly = false
    } = ctx;

    const site = sites[siteKey];
    if (!site) return '';

    const state = playerCore?.options?.playerState;
    const enabledSources = state?.settings?.enabledCommentSources || { jable: true, javdb: true, javlibrary: false };
    const isSiteEnabled = (siteKey === 'javlib')
        ? (enabledSources.javlib !== false && enabledSources.javlibrary !== false)
        : (enabledSources[siteKey] !== false);

    if (!isSiteEnabled) return '';

    let contentHtml = '';
    if (site.status === 'loading') {
        contentHtml = `
            <div class="tm-comment-loader-graphic">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
    } else if (site.status === 'unreachable') {
        contentHtml = `
            <div class="tm-comment-status-box is-unreachable">
                <p class="tm-comment-status-title">⚠️ 无法连接到 ${esc(site.name)}</p>
                <p class="tm-comment-status-desc">请检查网络代理，或该站点在当前环境不可达。</p>
            </div>
        `;
    } else if (site.status === 'mobile_unsupported') {
        contentHtml = `
            <div class="tm-comment-status-box is-unsupported">
                <p class="tm-comment-status-title">📱 该站点评论采集在移动端不可用</p>
                <p class="tm-comment-status-desc">JAVLibrary 采集需使用后台独立标签页（影子通道），移动端浏览器不支持后台静默多标签页协同。请在 PC 端浏览器查看该站点评论。</p>
            </div>
        `;
    } else if (site.status === 'not_found') {
        contentHtml = `
            <div class="tm-comment-status-box">
                <p class="tm-comment-status-title">此影片在 ${esc(site.name)} 上未找到评论。</p>
            </div>
        `;
    } else if (site.status === 'empty') {
        contentHtml = `
            <div class="tm-comment-status-box">
                <p class="tm-comment-status-title">暂无评论</p>
            </div>
        `;
    } else if (site.status === 'cf_shield') {
        if (siteKey === 'javlib' && javlibVerifyingStatus === 'verifying') {
            contentHtml = `
                <div class="tm-comments-cf-warning is-verifying">
                    <div class="tm-comments-cf-actions">
                        <div class="tm-comment-loader-graphic">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                        <span class="tm-comment-status-title">正在后台尝试自动通过 JAVLibrary 验证，请稍候...</span>
                    </div>
                </div>
            `;
        } else {
            const targetDomain = siteKey === 'jable' ? (jableFailedDomain || `https://${SITE_DOMAINS.JABLE.primary}`) :
                                 (siteKey === 'javlib' ? (javlibFailedDomain || `https://${SITE_DOMAINS.JAVLIBRARY.primary}`) :
                                 `https://${SITE_DOMAINS.JAVDB.primary}`);
            const retryBtnClass = siteKey === 'jable' ? 'tm-jable-verify-retry-btn' :
                                  (siteKey === 'javlib' ? 'tm-comments-verify-retry-btn' : 'tm-javdb-verify-retry-btn');
            contentHtml = `
                <div class="tm-comments-cf-warning">
                    <span>${esc(site.name)} 评论抓取受阻 (Cloudflare 拦截)</span>
                    <div class="tm-comments-cf-actions">
                        <a href="${esc(targetDomain)}/" target="_blank" rel="noopener noreferrer" class="tm-comments-verify-link">去验证</a>
                        <button class="${retryBtnClass} tm-comments-verify-btn">重新加载</button>
                        ${siteKey === 'javlib' ? '<button class="tm-comments-verify-copy-logs-btn tm-comments-verify-btn">复制日志</button>' : ''}
                    </div>
                </div>
            `;
        }
    } else if (site.status === 'loaded') {
        let commentsToRender = site.filteredComments;
        if (highlightOnly) {
            commentsToRender = commentsToRender.filter(c => Array.isArray(c.timestamps) && c.timestamps.length > 0);
        }

        if (highlightOnly && commentsToRender.length === 0) {
            contentHtml = `
                <div class="tm-comment-status-box is-highlight-empty">
                    <p class="tm-comment-status-title">该板块暂无带时间戳的高能评论</p>
                    <button class="tm-comment-reset-filter-btn" type="button">点击查看全部评论</button>
                </div>
            `;
        } else {
            contentHtml = commentsToRender.map(c => {
                const isNew = renderedCommentIds.size > 0 && !renderedCommentIds.has(c.id);
                return renderCommentCardHtml(c, { isNew, expandedCommentIds, playerCore });
            }).join('');

            if (site.loading) {
                contentHtml += `
                    <div class="tm-comment-bottom-loader tm-comment-loader-graphic">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
            } else if (!site.hasMore && !highlightOnly) {
                contentHtml += `
                    <div class="tm-comment-end-marker">-end-</div>
                `;
            }
        }
    }

    const badgeText = getCommentSectionBadgeText(site);
    const isCollapsed = (site.status === 'unreachable' || site.status === 'not_found' || site.status === 'mobile_unsupported' || site.collapsed);
    const loginSiteKey = siteKey === 'jable' ? 'JABLE' : (siteKey === 'javlib' ? 'JAVLIBRARY' : '');
    const loginBadgeHtml = (loginSiteKey && typeof renderLoginBadge === 'function') ? renderLoginBadge(loginSiteKey) : '';
    const titleMap = { jable: '■ Jable.tv', javlib: '■ JAVLibrary', javdb: '■ JavDB' };

    return `
        <div class="tm-comment-section${isCollapsed ? ' is-collapsed' : ''}" id="tm-comment-section-${siteKey}" data-site="${siteKey}">
            <div class="tm-comment-section-hdr" title="点击展开/折叠">
                <span class="tm-comment-section-title">${titleMap[siteKey]}</span>
                <div class="tm-comment-hdr-right">
                    ${loginBadgeHtml}
                    <span class="tm-comment-status-badge tm-status-badge-${site.status}">${badgeText}</span>
                </div>
            </div>
            <div class="tm-comment-section-body">
                ${contentHtml}
            </div>
        </div>
    `;
}
