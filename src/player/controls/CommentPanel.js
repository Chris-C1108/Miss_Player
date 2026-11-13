import { getVideoDurationSeconds } from '../../utils/dom.js';
import { SupabaseService } from '../../services/SupabaseService.js';
import { SyncManager } from '../../sync/index.js';
import { WebDavClient } from '../../sync/WebDavClient.js';
import { __ } from '../../constants/i18n.js';
import { CLOSE_LINE, SEND, KEYBOARD, ICON_COPY, ICON_EXTERNAL_LINK, ICON_COMMENT_WRITE, ICON_PLUS } from '../../constants/icons.js';
import { Toast, isMobile, getValue } from '../../utils/index.js';
import { isSiteDomain, SITE_DOMAINS, checkSiteReachability } from '../../constants/domains.js';
import { logger } from '../../utils/logger.js';
import { CrossDomainBridge } from '../../autologin/CrossDomainBridge.js';
import { JableLoginProvider } from '../../autologin/JableLoginProvider.js';
import { MissavLoginProvider } from '../../autologin/MissavLoginProvider.js';
import { telemetry } from '../../telemetry/index.js';
import { CommentComposer } from './CommentComposer.js';
import { CommentDebugCollector } from '../comments/CommentDebugCollector.js';
import { CommentCacheManager } from '../comments/CommentCacheManager.js';
import { CommentCodePreview } from '../comments/CommentCodePreview.js';
import { showCommentReportModal } from '../comments/CommentReportModal.js';
import { renderCommentCardHtml, renderCommentSectionHtml, renderLoginBadgeHtml as renderLoginBadgeHtmlHelper } from '../comments/CommentCardRenderer.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import {
    esc,
    sanitizeCommentUrl,
    getVideoCodeFromUrl,
    fetchJableComments,
    fetchJavLibraryVideoId,
    fetchJavLibraryData,
    fetchJavdbMovieId,
    fetchJavdbData,
    processComment,
    applyCommentCountdown,
    highlightCommentText,
    checkIsTimestampFavorited,
    formatSeconds,
    JAVLIB_DOMAINS,
    JABLE_DOMAINS,
    JAVDB_DOMAINS
} from './CommentScraper.js';

/**
 * 解析各种格式的评论时间为毫秒时间戳，用于跨源排序
 * @param {string} dateStr 时间字符串
 * @returns {number} 毫秒时间戳
 */
function parseCommentDate(dateStr) {
    if (!dateStr) return 0;
    const s = dateStr.trim();

    // 1. 绝对时间格式 (如: "2024-03-24 15:30:20" 或 "2024-03-24")
    if (/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}/.test(s)) {
        const d = new Date(s.replace(/-/g, '/'));
        if (!isNaN(d.getTime())) {
            return d.getTime();
        }
    }

    // 2. 相对时间格式 (如: "5天前", "2小时前", "5 days ago", "10 mins ago")
    const now = Date.now();
    const numMatch = s.match(/(\d+)/);
    if (!numMatch) {
        if (s.includes('昨天') || s.includes('yesterday')) {
            return now - 24 * 60 * 60 * 1000;
        }
        if (s.includes('前天')) {
            return now - 2 * 24 * 60 * 60 * 1000;
        }
        return 0;
    }

    const val = parseInt(numMatch[1], 10);
    if (s.includes('秒') || s.includes('second') || s.includes('sec')) {
        return now - val * 1000;
    }
    if (s.includes('分') || s.includes('minute') || s.includes('min')) {
        return now - val * 60 * 1000;
    }
    if (s.includes('小时') || s.includes('小時') || s.includes('hour') || s.includes('hr')) {
        return now - val * 60 * 60 * 1000;
    }
    if (s.includes('天') || s.includes('day') || s.includes('d')) {
        return now - val * 24 * 60 * 60 * 1000;
    }
    if (s.includes('周') || s.includes('週') || s.includes('week') || s.includes('w')) {
        return now - val * 7 * 24 * 60 * 60 * 1000;
    }
    if (s.includes('月') || s.includes('month') || s.includes('mo')) {
        return now - val * 30 * 24 * 60 * 60 * 1000;
    }
    if (s.includes('年') || s.includes('year') || s.includes('yr') || s.includes('y')) {
        return now - val * 365 * 24 * 60 * 60 * 1000;
    }

    const fallbackDate = new Date(s);
    if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.getTime();
    }
    return 0;
}

/**
 * 评论区控制面板组件 (CommentPanel)
 * 采用全屏式设计，位于视频下方（Z轴底部），与控制面板实现完美交互
 */



export class CommentPanel {
    static preloadCache = {
        videoCode: '',
        jableCommentsPromise: null,
        javlibVideoIdPromise: null,
        javlibCommentsPromise: null,
        javlibReviewsPromise: null,
        javdbMovieIdPromise: null,
        javdbCommentsPromise: null
    };

    static preload(videoCode) {
        if (!videoCode) return;

        // 读取用户设置 (与 PlayerState.loadSettings 使用相同的逐键存储方式)
        const showCommentsSection = getValue('showCommentsSection', true);
        const enabledSources = getValue('enabledCommentSources', { jable: true, javdb: true, javlibrary: false });

        if (!showCommentsSection) {
            logger.log(`[CommentPanel] 设置中未开启评论区 (showCommentsSection: false)，跳过后台预加载`);
            return;
        }

        CommentPanel.preloadCache.videoCode = videoCode;
        logger.log(`[CommentPanel] 启动后台预加载，番号: ${videoCode}`);

        // 1. 预加载 Jable 评论 (仅当开启源时)
        if (enabledSources.jable !== false) {
            let storedWorkingDomain = '';
            if (typeof GM_getValue === 'function') {
                try {
                    storedWorkingDomain = GM_getValue('mp_jable_working_domain', '');
                } catch (e) { }
            }
            let domainIndex = 0;
            if (storedWorkingDomain) {
                const idx = JABLE_DOMAINS.indexOf(storedWorkingDomain);
                if (idx !== -1) {
                    domainIndex = idx;
                }
            }
            CommentPanel.preloadCache.jableCommentsPromise = fetchJableComments(videoCode, 1, domainIndex)
                .then(res => {
                    logger.log(`[CommentPanel] 预加载 Jable 评论成功，共 ${res.comments.length} 条 (域名: ${res.domain || 'default'})`);
                    return res;
                })
                .catch(err => {
                    logger.warn(`[CommentPanel] 预加载 Jable 评论失败:`, err);
                    if (CommentPanel.preloadCache.videoCode === videoCode) {
                        CommentPanel.preloadCache.jableCommentsPromise = null;
                    }
                    throw err;
                });
        }

        // 2. 预加载 JAVLibrary ID (仅在非移动端且开启源时)
        if (!isMobile() && enabledSources.javlib !== false && enabledSources.javlibrary !== false) {
            CommentPanel.preloadCache.javlibVideoIdPromise = fetchJavLibraryVideoId(videoCode)
                .then(result => {
                    const { videoId, domain } = result;
                    logger.log(`[CommentPanel] 预加载 JAVLibrary ID 成功: ${videoId} (域名: ${domain})`);

                    // 拿到 ID 后，进一步预加载第一页的 JAVLib 评论和文章
                    CommentPanel.preloadCache.javlibCommentsPromise = fetchJavLibraryData(videoId, 'comments', 1, domain)
                        .catch(err => {
                            logger.warn('[CommentPanel] 预加载 JAVLib 评论失败:', err);
                            if (CommentPanel.preloadCache.videoCode === videoCode) {
                                CommentPanel.preloadCache.javlibCommentsPromise = null;
                            }
                            throw err;
                        });

                    CommentPanel.preloadCache.javlibReviewsPromise = fetchJavLibraryData(videoId, 'reviews', 1, domain)
                        .catch(err => {
                            logger.warn('[CommentPanel] 预加载 JAVLib 文章失败:', err);
                            if (CommentPanel.preloadCache.videoCode === videoCode) {
                                CommentPanel.preloadCache.javlibReviewsPromise = null;
                            }
                            throw err;
                        });

                    return result;
                })
                .catch(err => {
                    logger.warn(`[CommentPanel] 预加载 JAVLibrary ID 失败:`, err);
                    if (CommentPanel.preloadCache.videoCode === videoCode) {
                        CommentPanel.preloadCache.javlibVideoIdPromise = null;
                    }
                    throw err;
                });
        }

        // 3. 预加载 JavDB 短评 (仅当开启源时)
        if (enabledSources.javdb !== false) {
            CommentPanel.preloadCache.javdbMovieIdPromise = fetchJavdbMovieId(videoCode)
                .then(result => {
                    const { movieId, domain } = result;
                    logger.log(`[CommentPanel] 预加载 JavDB MovieId 成功: ${movieId} (域名: ${domain})`);
                    CommentPanel.preloadCache.javdbCommentsPromise = fetchJavdbData(movieId, 1, domain)
                        .catch(err => {
                            logger.warn('[CommentPanel] 预加载 JavDB 短评失败:', err);
                            if (CommentPanel.preloadCache.videoCode === videoCode) {
                                CommentPanel.preloadCache.javdbCommentsPromise = null;
                            }
                            throw err;
                        });
                    return result;
                })
                .catch(err => {
                    logger.warn(`[CommentPanel] 预加载 JavDB MovieId 失败:`, err);
                    if (CommentPanel.preloadCache.videoCode === videoCode) {
                        CommentPanel.preloadCache.javdbMovieIdPromise = null;
                    }
                    throw err;
                });
        }
    }

    constructor(playerCore, controlManager, uiManager = null) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.uiManager = uiManager || (playerCore ? playerCore.uiManager : null);
        this.uiElements = playerCore?.uiElements || controlManager?.uiElements;
        this.targetVideo = playerCore?.targetVideo;
        this.loopManager = null;
        this.codePreview = new CommentCodePreview(this);

        this.videoCode = '';
        this.comments = [];          // 所有采集的原始评论数据（向下兼容）
        this.filteredComments = [];  // 经过过滤后的评论数据（向下兼容）
        this.renderedCommentIds = new Set(); // 追踪已渲染的评论ID以实现新加载高亮
        this.expandedCommentIds = new Set(); // 追踪已手动展开全文的评论ID，杜绝新评论加载时折叠
        this.totalCount = 0;         // 评论总数
        this.currentPage = 1;
        this.hasMore = false;
        this.filterSpam = true;      // 是否过滤灌水 (默认开启)
        this.isLoading = false;

        // 站点登录状态缓存 (siteKey -> boolean)
        this.siteLoginStates = {
            JABLE: null
        };

        // === 统一多源数据管理 (Jable, JAVLibrary, JavDB) ===
        this.sites = {
            jable: {
                key: 'jable',
                name: 'Jable.tv',
                status: 'loading',
                comments: [],
                filteredComments: [],
                totalCount: 0,
                hasMore: false,
                currentPage: 1,
                collectedPages: new Set(),
                collapsed: localStorage.getItem('tm-comment-jable-collapsed') === 'true',
                loading: false,
                unreachable: false,
                workingDomain: ''
            },
            javlib: {
                key: 'javlib',
                name: 'JAVLibrary',
                status: 'loading',
                comments: [],
                filteredComments: [],
                totalCount: 0,
                hasMore: false,
                currentPage: 1,
                collectedPages: new Set(),
                collapsed: localStorage.getItem('tm-comment-javlib-collapsed') === 'true',
                loading: false,
                unreachable: false,
                workingDomain: '',
                videoId: ''
            },
            javdb: {
                key: 'javdb',
                name: 'JavDB',
                status: 'loading',
                comments: [],
                filteredComments: [],
                totalCount: 0,
                hasMore: false,
                currentPage: 1,
                collectedPages: new Set(),
                collapsed: localStorage.getItem('tm-comment-javdb-collapsed') === 'true',
                loading: false,
                unreachable: false,
                movieId: '',
                workingDomain: ''
            }
        };

        // 向下兼容：为原有散落属性定义 Getter/Setter 映射
        const bindSiteProp = (legacyProp, siteKey, propKey) => {
            Object.defineProperty(this, legacyProp, {
                get: () => this.sites[siteKey][propKey],
                set: (v) => { this.sites[siteKey][propKey] = v; },
                configurable: true,
                enumerable: true
            });
        };
        ['jable', 'javlib', 'javdb'].forEach(key => {
            bindSiteProp(`${key}Status`, key, 'status');
            bindSiteProp(`${key}Comments`, key, 'comments');
            bindSiteProp(`filtered${key.charAt(0).toUpperCase() + key.slice(1)}Comments`, key, 'filteredComments');
            bindSiteProp(`${key}TotalCount`, key, 'totalCount');
            bindSiteProp(`${key}HasMore`, key, 'hasMore');
            bindSiteProp(`${key}CurrentPage`, key, 'currentPage');
            bindSiteProp(`${key}Collapsed`, key, 'collapsed');
            bindSiteProp(`${key}Loading`, key, 'loading');
            bindSiteProp(`${key}Unreachable`, key, 'unreachable');
            bindSiteProp(`${key}WorkingDomain`, key, 'workingDomain');
        });
        bindSiteProp('javlibVideoId', 'javlib', 'videoId');
        bindSiteProp('javdbMovieId', 'javdb', 'movieId');

        // JAVLibrary / Jable 额外状态
        this.jableVideoExists = null;
        this.jableFailedDomain = '';
        this.javlibVideoExists = null;
        this.javlibCfShield = false; // JAVLibrary Cloudflare 盾牌是否被触发
        this.javlibFailedDomain = '';
        this.javlibVerificationTab = null;      // 验证标签页句柄
        this.javlibVerifiedListenerId = null;   // 全局值监听器 ID
        this.javlibVerificationTimeout = null;  // 超时定时器
        this.javlibAutoVerifyAttempted = false; // 是否已尝试自动验证
        this.javlibVerifyingStatus = '';        // JAVLibrary 验证状态 ('verifying' | 'manual' | '')

        // DOM 元素引用
        this.commentsPanel = null;
        this.commentsList = null;
        this.loadingElement = null;
        this.errorElement = null;

        this.composer = new CommentComposer(this);

        // 延迟后台域名探测，避免在 UI 挂载的关键帧争抢网络和主线程微任务
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => this.detectReachability(), { timeout: 4000 });
        } else {
            setTimeout(() => this.detectReachability(), 600);
        }

        // 初始化事件委托
        this.initDelegatedEvents();

        if (this.targetVideo) {
            this.handleMetadataLoadedBound = () => this.reprocessComments();
            this.targetVideo.addEventListener('loadedmetadata', this.handleMetadataLoadedBound);
            if (this.targetVideo.readyState >= 1) {
                setTimeout(() => this.reprocessComments(), 100);
            }
        }
    }

    get selectedTagIds() {
        return this.composer.selectedTagIds;
    }
    set selectedTagIds(v) {
        this.composer.selectedTagIds = v;
    }
    get commentInput() {
        return this.composer.commentInput;
    }
    set commentInput(v) {
        this.composer.commentInput = v;
    }
    get tagSelectModal() {
        return this.composer.tagSelectModal;
    }
    set tagSelectModal(v) {
        this.composer.tagSelectModal = v;
    }
    get tagSelectList() {
        return this.composer.tagSelectList;
    }
    set tagSelectList(v) {
        this.composer.tagSelectList = v;
    }

    setUiManager(uiManager) {
        this.uiManager = uiManager;
    }

    /**
     * 后台预检测 Jable 与 JAVLibrary 的网络可达性
     * 注意：检测结果仅作 UI 提示参考，不阻断实际请求（fetchXxx 有自己的域名轮询兜底）
     */
    async detectReachability() {
        try {
            const [jableOk, javlibOk, javdbOk] = await Promise.all([
                checkSiteReachability('JABLE'),
                checkSiteReachability('JAVLIBRARY'),
                checkSiteReachability('JAVDB')
            ]);

            this.jableUnreachable = !jableOk;
            this.javlibUnreachable = !javlibOk;
            this.javdbUnreachable = !javdbOk;

            console.log(`[CommentPanel] 网络预检测可达性（仅参考）：Jable.tv = ${jableOk ? '在线' : '离线/阻断'}, JAVLibrary = ${javlibOk ? '在线' : '离线/阻断'}, JavDB = ${javdbOk ? '在线' : '离线/阻断'}`);
        } catch (e) {
            console.error('[CommentPanel] 可达性检测出错:', e);
        }
    }

    setDimmed(dimmed) {
        if (!this.commentsPanel) return;
        const handleContainer = this.uiElements?.handleContainer || document.querySelector('.tm-handle-container');
        if (dimmed) {
            this.commentsPanel.classList.add('is-dimmed');
            if (handleContainer) handleContainer.classList.add('is-dimmed');
        } else {
            this.commentsPanel.classList.remove('is-dimmed');
            if (handleContainer) handleContainer.classList.remove('is-dimmed');
        }
    }

    applySettingsState() {
        const state = this.playerCore?.options?.playerState;
        if (!state) return;
        this.updateDebugMode(state.settings.debugMode ?? false);
        this.updateCommentsVisibility(state.settings.showCommentsSection ?? true);
    }

    updateDebugMode(debugMode) {
        if (!this.commentsPanel) return;
        const reportBtns = this.commentsPanel.querySelectorAll('.jc-report-btn');
        reportBtns.forEach(btn => {
            btn.classList.toggle('is-hidden', !debugMode);
        });
        // 当 debugMode 改变时重新计算数字过滤
        this.applyFilter();
        this.renderCommentsList();
    }

    updateDebugFilterHasNumbers(enabled) {
        this.applyFilter();
        this.renderCommentsList();
    }

    updateCommentsVisibility(showCommentsSection) {
        if (!this.commentsPanel) return;
        const state = this.playerCore?.options?.playerState;
        const playerContainer = this.commentsPanel.closest('.tm-player-container') || this.playerCore?.uiElements?.playerContainer;
        const uiManager = this.playerCore?.uiManager;

        if (playerContainer) {
            this.commentsPanel.classList.toggle('is-hidden', !showCommentsSection);
            if (!showCommentsSection) {
                playerContainer.classList.add('tm-sidebar-hidden');
            } else if (!state?.settings?.sidebarHidden) {
                playerContainer.classList.remove('tm-sidebar-hidden');
            }
        }

        if (uiManager && typeof uiManager.updateSidebarButtonsVisibility === 'function') {
            uiManager.updateSidebarButtonsVisibility();
        }

        this.updateCommentSources();
    }

    /**
     * 根据设置中的 enabledCommentSources 动态控制各个站点 section 的显隐与自动抓取
     */
    updateCommentSources() {
        const state = this.playerCore?.options?.playerState;
        const enabledSources = state?.settings?.enabledCommentSources || { jable: true, javdb: true, javlibrary: false };

        ['jable', 'javlib', 'javdb'].forEach(siteKey => {
            const isEnabled = (siteKey === 'javlib')
                ? (enabledSources.javlib !== false && enabledSources.javlibrary !== false)
                : (enabledSources[siteKey] !== false);

            const sectionEl = this.commentsList?.querySelector(`#tm-comment-section-${siteKey}`);
            if (sectionEl) {
                sectionEl.style.display = isEnabled ? 'block' : 'none';
            }

            // 如果该站点被开启且尚未抓取过评论，自动触发抓取
            if (isEnabled && this.sites[siteKey]?.comments?.length === 0 && this.sites[siteKey]?.status !== 'loading' && this.sites[siteKey]?.status !== 'loaded') {
                this.loadSiteComments(siteKey, 1);
            }
        });

        this.updateCommentsCount();
    }

    /**
     * 初始化全局事件委托，处理时间跳转与番号搜索
     */
    initDelegatedEvents() {
        if (!this.uiElements || !this.uiElements.playerContainer) return;

        // 移动端长按手势与防误触状态变量
        let longPressTimer = null;
        let touchStartX = 0;
        let touchStartY = 0;
        let currentLink = null;
        let isLongPressTriggered = false;

        const clearLongPress = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            currentLink = null;
        };

        this.uiElements.playerContainer.addEventListener('click', (e) => {
            const saveAllBtn = e.target.closest(".jc-save-all-btn");
            const reportBtn = e.target.closest(".jc-report-btn");
            const importDeepLinkBtn = e.target.closest(".tm-import-deep-link-btn");

            if (importDeepLinkBtn) {
                e.stopPropagation();
                const imp = (typeof window !== "undefined") ? window.__mp_imported_capsules : null;
                if (imp && Array.isArray(imp.capsules)) {
                    const lm = this.getLoopManager();
                    if (lm) {
                        imp.capsules.forEach(c => {
                            lm.addTabFromTime(c.endTime ? [c.startTime, c.endTime] : c.startTime, c.comment);
                        });
                        Toast(`已将 ${imp.capsules.length} 条外部分享高光导入时间轴`, 2000, "success");
                    }
                    window.__mp_imported_capsules = null;
                    this.renderCommentsList();
                }
                return;
            }

            if (saveAllBtn) {
                e.preventDefault();
                e.stopPropagation();
                const commentId = saveAllBtn.getAttribute("data-comment-id");
                const comment = this.findCommentById(commentId);
                if (comment && Array.isArray(comment.timestamps) && comment.timestamps.length > 0) {
                    const lm = this.getLoopManager();
                    if (lm) {
                        comment.timestamps.forEach(ts => {
                            lm.addTabFromTime(ts.seconds, comment.rawText ? comment.rawText.slice(0, 30) : (comment.text || "").slice(0, 30));
                        });
                        Toast(`已转存 ${comment.timestamps.length} 个高光片段至片段列表`, 2000, "success");
                    }
                    const shadow = this.playerCore?.uiManager?.shadowRoot || document.querySelector('miss-player-root')?.shadowRoot;
                    const container = shadow?.querySelector('.tm-player-container');
                    if (container && (container.scrollTop !== 0 || container.scrollLeft !== 0)) {
                        container.scrollTop = 0;
                        container.scrollLeft = 0;
                    }
                    if (window.scrollY !== 0 || window.scrollX !== 0) {
                        window.scrollTo(0, 0);
                    }
                }
                return;
            }

            if (reportBtn) {
                e.stopPropagation();
                const commentId = reportBtn.getAttribute('data-comment-id');
                const card = reportBtn.closest('.jc-card');
                const cardId = card ? card.getAttribute('data-id') : null;
                let comment = this.findCommentById(commentId) || (cardId ? this.findCommentById(cardId) : null);
                if (!comment && card) {
                    const textEl = card.querySelector('.jc-body-text-content') || card.querySelector('.jc-body-text');
                    const userEl = card.querySelector('.jc-u');
                    comment = {
                        id: commentId || cardId || 'unknown',
                        user: userEl ? userEl.textContent.trim() : '匿名',
                        rawText: textEl ? textEl.textContent.trim() : '',
                        text: textEl ? textEl.textContent.trim() : ''
                    };
                }
                if (comment) {
                    this._showCommentReportModal(comment);
                }
                return;
            }

            const starBtn = e.target.closest('.jc-time-star-btn');
            const countdownBtn = e.target.closest('.jc-countdown-btn');
            const timeLink = e.target.closest('.jc-time-link');
            const codeLink = e.target.closest('.jc-code-link');
            const retryBtn = e.target.closest('.tm-comment-retry-btn');
            const toggleExpandBtn = e.target.closest('.jc-toggle-expand-btn');

            // 1. 点击胶囊内嵌右侧五角星收藏按钮：触发控制面板草稿，同时跳转播放进度
            if (starBtn) {
                e.stopPropagation();
                e.preventDefault();
                const link = starBtn.closest('.jc-time-link');
                if (link) {
                    if (link._starHideTimer) {
                        clearTimeout(link._starHideTimer);
                        link._starHideTimer = null;
                    }
                    const secsAttr = link.getAttribute('data-secs');
                    if (secsAttr) {
                        let secs;
                        try {
                            secs = JSON.parse(secsAttr);
                        } catch (_) {
                            secs = parseFloat(secsAttr);
                        }
                        this.handleStarClick(secs, link);
                    }
                }
                return;
            }

            // 2. 点击时序换算按钮：双向换算正向播放时间
            if (countdownBtn) {
                e.stopPropagation();
                e.preventDefault();
                const card = countdownBtn.closest('.jc-card');
                const commentId = card ? card.getAttribute('data-id') : null;
                if (commentId) {
                    this.toggleCommentCountdown(commentId, card, countdownBtn);
                }
                return;
            }

            // 3. 点击时间胶囊本身（文字区域）：仅跳转对应时间播放，绝不添加草稿胶囊
            if (timeLink) {
                // 若本次点击是由移动端番号长按松手触发的，坚决拦截，不触发播放跳转
                if (isLongPressTriggered) {
                    e.stopPropagation();
                    e.preventDefault();
                    isLongPressTriggered = false;
                    return;
                }
                e.stopPropagation();
                const secsAttr = timeLink.getAttribute('data-secs');
                if (secsAttr) {
                    try {
                        const secs = JSON.parse(secsAttr);
                        this.handleTimeClick(secs, timeLink);
                    } catch (err) {
                        const secs = parseFloat(secsAttr);
                        this.handleTimeClick(secs, timeLink);
                    }
                }
                return;
            }

            if (codeLink) {
                if (isLongPressTriggered) {
                    e.stopPropagation();
                    e.preventDefault();
                    isLongPressTriggered = false;
                    return;
                }
                e.stopPropagation();
                const code = codeLink.getAttribute('data-code');
                if (code) {
                    this.handleCodeClick(code, codeLink);
                }
            } else if (retryBtn) {
                e.stopPropagation();
                this.handleRetry();
            }
        });

        // 监听控制栏标签变动事件，实时刷新评论区已收藏实心金星 (★) 及发评栏高光计数徽标
        this._onTabsUpdatedBound = () => {
            this.updateFavoriteBadges();
            if (this.composer && typeof this.composer.updateTagButtonBadge === 'function') {
                this.composer.updateTagButtonBadge();
            }
        };
        window.addEventListener('mp_tabs_updated', this._onTabsUpdatedBound);

        // 移动端长按番号链接预览 (400ms 长按触发)
        this.uiElements.playerContainer.addEventListener('touchstart', (e) => {
            const codeLink = e.target.closest('.jc-code-link');
            if (codeLink) {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                isLongPressTriggered = false;
                clearLongPress();
                longPressTimer = setTimeout(() => {
                    isLongPressTriggered = true;
                    const code = codeLink.getAttribute('data-code');
                    if (code) {
                        this.showCodePreview(code, codeLink);
                        if (window.navigator && typeof window.navigator.vibrate === 'function') {
                            window.navigator.vibrate(15);
                        }
                    }
                }, 400);
            }
        }, { passive: true });

        this.uiElements.playerContainer.addEventListener('touchmove', (e) => {
            if (!longPressTimer) return;
            const touch = e.touches[0];
            if (Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY) > 10) {
                clearLongPress();
            }
        }, { passive: true });

        // 番号 (jc-code-link) PC 端鼠标悬停预览处理
        this.uiElements.playerContainer.addEventListener('mouseover', (e) => {
            const codeLink = e.target.closest('.jc-code-link');
            if (codeLink) {
                this.codePreview.cancelLeave();
                const code = codeLink.getAttribute('data-code');
                if (code) {
                    this._codePreviewHoverTimer = setTimeout(() => {
                        this.showCodePreview(code, codeLink);
                    }, 200);
                }
            }
        });

        this.uiElements.playerContainer.addEventListener('mouseout', (e) => {
            const codeLink = e.target.closest('.jc-code-link');
            if (codeLink) {
                if (this._codePreviewHoverTimer) {
                    clearTimeout(this._codePreviewHoverTimer);
                    this._codePreviewHoverTimer = null;
                }
                this.codePreview.scheduleLeave(250);
            }
        });

        this.uiElements.playerContainer.addEventListener('touchend', () => {
            clearLongPress();
        });

        this.uiElements.playerContainer.addEventListener('touchcancel', () => {
            clearLongPress();
            isLongPressTriggered = false;
        });
    }

    /**
     * 处理评论中时间戳点击跳转，并自动恢复显示控制面板
     * @param {number|number[]} secs - 要跳转的秒数（或范围）
     */
    /**
     * 处理点击时间戳胶囊（文字区域）：跳转播放
     * @param {number|number[]} secs - 秒数或 [start, end]
     * @param {HTMLElement|null} link - 对应的胶囊 DOM 元素
     */
    handleTimeClick(secs, link = null) {
        let targetSecs = secs;
        let isRange = false;
        if (Array.isArray(secs)) {
            targetSecs = secs[0]; // 范围类型跳转到起点
            isRange = true;
        }

        // 遥测上报：点击时间戳跳转
        try {
            telemetry.trackTimestampClick({
                secs,
                avcode: this.videoCode || '',
                source: 'comment'
            });
        } catch (_) {}

        if (this.targetVideo) {
            if (this.playerCore) this.playerCore.userPauseIntent = false;
            if (this.controlManager?.playbackController) this.controlManager.playbackController._userPauseIntent = false;
            this.targetVideo.currentTime = targetSecs;
            this.targetVideo.play().catch(() => { });

            const isFavorited = link ? link.classList.contains('is-favorited') : false;
            const favSuffix = isFavorited ? ' (已在片段列表中)' : '';

            const toastMsg = isRange && secs.length >= 2
                ? `已跳转至区间 ${formatSeconds(secs[0])} ~ ${formatSeconds(secs[1])}${favSuffix}`
                : `已跳转至 ${formatSeconds(targetSecs)}${favSuffix}`;
            Toast(toastMsg, 2000, 'info');

            // 若属于时间区间且 LoopManager 可用，同步设置 AB 循环区间
            const lm = this.getLoopManager();
            if (isRange && secs.length >= 2 && lm && typeof lm.setLoopRange === 'function') {
                lm.setLoopRange(secs[0], secs[1]);
            }

            // 点击时间戳时，恢复显示控制面板
            if (this.uiManager) {
                this.uiManager.showControls();
            }

            // 触发时间跳转的视觉提示
            if (this.controlManager && typeof this.controlManager.showJumpHint === 'function') {
                this.controlManager.showJumpHint(targetSecs);
            }
        }
    }

    /**
     * 处理点击胶囊内部右侧五角星收藏按钮：
     * 需求：免长按直接收藏；若已收藏则提示；未收藏则正式入库并落盘
     * @param {number|number[]} secs - 秒数或 [start, end]
     * @param {HTMLElement} link - 对应的时间胶囊元素
     */
    handleStarClick(secs, link) {
        const lm = this.getLoopManager();
        const isFavorited = link ? link.classList.contains('is-favorited') : false;
        const targetSecs = Array.isArray(secs) ? secs[0] : secs;

        // 1. 触觉反馈 (Taptic Feedback)
        if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
            window.navigator.vibrate(isFavorited ? [10, 30, 10] : 15);
        }

        // 2. 同时跳转播放进度
        if (this.targetVideo && typeof targetSecs === 'number' && !isNaN(targetSecs)) {
            if (this.playerCore) this.playerCore.userPauseIntent = false;
            if (this.controlManager?.playbackController) this.controlManager.playbackController._userPauseIntent = false;
            this.targetVideo.currentTime = targetSecs;
            this.targetVideo.play().catch(() => {});
            if (this.controlManager && typeof this.controlManager.showJumpHint === 'function') {
                this.controlManager.showJumpHint(targetSecs);
            }
        }

        // 3. 恢复显示控制面板
        if (this.uiManager) {
            this.uiManager.showControls();
        }

        // 4. 已收藏状态点击反馈
        if (isFavorited) {
            Toast('该时间已在片段列表中 (误差 ≤ 5s)', 1500, 'info');
            return;
        }

        // 5. 未收藏：提取卡片评论文本作为高光备注，优先正式入库落盘
        const card = link ? link.closest('.jc-card') : null;
        let commentExcerpt = '';
        if (card) {
            const bodyContent = card.querySelector('.jc-body-text-content') || card.querySelector('.jc-body-text');
            if (bodyContent) {
                commentExcerpt = (bodyContent.innerText || bodyContent.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
            }
        }

        if (lm && typeof lm.addTabFromTime === 'function') {
            lm.addTabFromTime(secs, commentExcerpt);
        } else if (lm && typeof lm.setDraftTabFromTime === 'function') {
            lm.setDraftTabFromTime(secs);
        }

        // 乐观 UI 变色：立即点亮当前胶囊
        if (link) {
            link.classList.add('is-favorited');
            const starBtn = link.querySelector('.jc-time-star-btn');
            if (starBtn) {
                starBtn.title = '此时间已在片段列表中 (误差 ≤ 5s)';
            }
        }

        const isRange = Array.isArray(secs) && secs.length >= 2;
        const toastMsg = isRange
            ? `已收藏区间 ${formatSeconds(secs[0])} ~ ${formatSeconds(secs[1])} 并跳转播放`
            : `已收藏时间点 ${formatSeconds(targetSecs)} 并跳转播放`;
        Toast(toastMsg, 2000, 'success');
    }

    /**
     * 切换某条评论的时间倒数状态并实时换算更新卡片（需求 3）
     * @param {string|number} commentId 
     * @param {HTMLElement} card 
     * @param {HTMLElement} btn 
     */
    toggleCommentCountdown(commentId, card, btn) {
        const comment = this.findCommentById(commentId);
        if (!comment) return;

        const duration = (this.targetVideo && this.targetVideo.duration && !isNaN(this.targetVideo.duration))
            ? this.targetVideo.duration
            : 10800;

        // 切换倒数应用状态
        comment.countdownApplied = !comment.countdownApplied;

        // 重新计算并换算时间戳
        comment.timestamps = applyCommentCountdown(comment.timestamps, duration, comment.countdownApplied);

        // 重新生成高亮 HTML
        comment.textHtml = highlightCommentText(comment.rawText || comment.text, comment.timestamps, comment.avcodes || []);

        // 局部更新卡片 DOM 文本内容
        const bodyContent = card.querySelector('.jc-body-text-content');
        const bodyText = card.querySelector('.jc-body-text');
        if (bodyContent) {
            bodyContent.innerHTML = comment.textHtml;
        } else if (bodyText) {
            const expandBtn = bodyText.querySelector('.jc-toggle-expand-btn');
            if (expandBtn) {
                bodyText.innerHTML = `<div class="jc-body-text-content">${comment.textHtml}</div><button class="jc-toggle-expand-btn">${expandBtn.textContent}</button>`;
            } else {
                bodyText.innerHTML = comment.textHtml;
            }
        }

        // 更新按钮文案、样式与 title
        if (btn) {
            const isConverted = Boolean(comment.countdownApplied);
            btn.classList.toggle('jc-countdown-btn--active', isConverted);
            btn.textContent = isConverted 
                ? (__('commentCountdownReverted') || '显示倒数') 
                : (__('commentCountdownConvert') || '转为正序');
            btn.title = isConverted 
                ? '当前已换算为实际播放时间，点击恢复显示原始倒数' 
                : '若评论内容为剩余倒数时间，点击换算为实际播放时间';
        }

        const toastMsg = comment.countdownApplied ? '已换算为实际播放时间' : '已恢复显示原始倒数';
        Toast(toastMsg, 1500, 'info');

        // 收集用户手动微调倒数时间样本 (Ground Truth)
        CommentDebugCollector.recordCountdownAdjustment(this.videoCode, comment, duration);
    }

    /**
     * 查找各站点存储的评论对象
     * @param {string|number} commentId 
     * @returns {Object|null}
     */
    findCommentById(commentId) {
        if (!commentId && commentId !== 0) return null;
        const targetId = String(commentId).trim();
        for (const siteKey of Object.keys(this.sites)) {
            const site = this.sites[siteKey];
            if (site && Array.isArray(site.comments)) {
                const found = site.comments.find(c => c && (String(c.id) === targetId || String(c.site_comment_id) === targetId));
                if (found) return found;
            }
        }
        const all = [...(this.filteredJableComments || []), ...(this.filteredJavlibComments || []), ...(this.filteredJavdbComments || []), ...(this.comments || [])];
        return all.find(c => c && (String(c.id) === targetId || String(c.site_comment_id) === targetId)) || null;
    }


    async loadComments(page = 1, forceRefresh = false) {
        if (!this.videoCode) return;
        this.isLoading = true;

        if (page === 1 && !forceRefresh && CommentCacheManager.hasValidCache(this.videoCode)) {
            const cached = CommentCacheManager.get(this.videoCode);
            if (cached && cached.sites) {
                let restoredCount = 0;
                for (const siteKey of Object.keys(this.sites)) {
                    const cachedSite = cached.sites[siteKey];
                    const targetSite = this.sites[siteKey];
                    if (cachedSite && Array.isArray(cachedSite.comments) && cachedSite.comments.length > 0) {
                        targetSite.comments = [...cachedSite.comments];
                        targetSite.totalCount = cachedSite.totalCount || cachedSite.comments.length;
                        targetSite.hasMore = cachedSite.hasMore;
                        targetSite.currentPage = cachedSite.currentPage || 1;
                        targetSite.collectedPages = new Set(cachedSite.collectedPages || [1]);
                        targetSite.status = cachedSite.status || 'loaded';
                        if (cachedSite.workingDomain) targetSite.workingDomain = cachedSite.workingDomain;
                        if (cachedSite.videoId) targetSite.videoId = cachedSite.videoId;
                        if (cachedSite.movieId) targetSite.movieId = cachedSite.movieId;
                        restoredCount += cachedSite.comments.length;
                    }
                }
                if (restoredCount > 0) {
                    logger.log(`[CommentPanel] 命中本地评论缓存 (${this.videoCode})，直接恢复 ${restoredCount} 条评论展示，跳过重复网络请求。`);
                    DebugLogPanel.addLog(`[本地缓存] ${this.videoCode}: 瞬时恢复 ${restoredCount} 条评论 (零网络请求)`, 'success');
                    this.isLoading = false;
                    this.applyFilter();
                    this.renderCommentsList();
                    this.updateCommentsCount();
                    return;
                }
            }
        }

        if (page === 1) {
            this.currentPage = 1;
            this.renderedCommentIds.clear(); // 刷新/首次加载时清空，防止第一页评论全部闪烁

            // 兜底保障：杜绝全折叠死锁，确保至少一个可用分区展开
            this.ensureAtLeastOneSectionExpanded();

            // 根据设置中的 enabledCommentSources 并发触发启用源的加载
            const state = this.playerCore?.options?.playerState;
            const enabledSources = state?.settings?.enabledCommentSources || { jable: true, javdb: true, javlibrary: false };

            const promises = [];
            // 优先检查 Supabase 自建分析数据库
        try {
            const remoteComments = await SupabaseService.fetchComments(this.videoCode);
            if (remoteComments && remoteComments.length > 0) {
                this._mergeRemoteComments(remoteComments);
                this.renderCommentsList();
                this.updateCommentsCount();
            }
        } catch (_) {}

        // 检查 WebDAV 独立评论文件 (/MissPlayer/comments/[AVCODE].json)
        try {
            const webdavConfig = SyncManager.getWebDavConfig();
            if (WebDavClient.hasValidEndpoint(webdavConfig)) {
                const subPath = 'comments/' + this.videoCode.toUpperCase() + '.json';
                const wdData = await WebDavClient.downloadBackup(webdavConfig, subPath);
                if (wdData && Array.isArray(wdData.comments) && wdData.comments.length > 0) {
                    this._mergeWebdavComments(wdData.comments);
                    this.renderCommentsList();
                    this.updateCommentsCount();
                    DebugLogPanel.addLog('已从 WebDAV 独立文件加载 ' + wdData.comments.length + ' 条评论 (' + this.videoCode + ')', 'success');
                }
            }
        } catch (_) {}

        if (enabledSources.jable !== false) promises.push(this.loadJableComments(1));
            if (enabledSources.javlib !== false && enabledSources.javlibrary !== false) promises.push(this.loadJavlibComments(1));
            if (enabledSources.javdb !== false) promises.push(this.loadJavdbComments(1));

            // 立即初始化渲染各分区的 Header 以及包含在内的加载动画
            this.renderCommentsList();

            // 避开评论抓取并发连接高峰，1.5s 后静默发起后台登录态复核
            setTimeout(() => this.updateAllSiteLoginStatuses(), 1500);

            await Promise.allSettled(promises);

            // 自动联动展开：若排序第1位的 Jable 无评论，而排在后面的 JavDB / JAVLibrary 有评论，自动展开首个有评论的板块
            if (this.filteredJableComments.length === 0) {
                if (this.filteredJavdbComments.length > 0) {
                    this.jableCollapsed = true;
                    this.javdbCollapsed = false;
                    this.javlibCollapsed = true;
                } else if (this.filteredJavlibComments.length > 0) {
                    this.jableCollapsed = true;
                    this.javdbCollapsed = true;
                    this.javlibCollapsed = false;
                }
            }
            this.ensureAtLeastOneSectionExpanded();
            this.renderCommentsList();
        } else {
            // 加载更多
            const promises = [];
            if (this.jableHasMore && !this.jableCollapsed) {
                promises.push(this.loadJableComments(this.jableCurrentPage + 1));
            }
            if (this.javlibHasMore && !this.javlibCollapsed) {
                promises.push(this.loadJavlibComments(this.javlibCurrentPage + 1));
            }
            if (this.javdbHasMore && !this.javdbCollapsed) {
                promises.push(this.loadJavdbComments(this.javdbCurrentPage + 1));
            }
            if (promises.length > 0) {
                await Promise.allSettled(promises);
                this.currentPage = Math.max(this.jableCurrentPage, this.javlibCurrentPage, this.javdbCurrentPage);
            }
        }

        this.isLoading = false;
    }

    async loadSiteComments(siteKey, page = 1, forceRefresh = false) {
        if (!this.videoCode) return;
        const site = this.sites[siteKey];
        if (!site) return;

        // 页码级防重：若该页码已采集过且非强制刷新，坚决不发重复网络请求
        if (!forceRefresh && site.collectedPages && site.collectedPages.has(page)) {
            logger.log(`[CommentPanel] 站点 ${siteKey} 第 ${page} 页已在本地采集集合中，跳过重复请求。`);
            site.loading = false;
            return;
        }

        const state = this.playerCore?.options?.playerState;
        const enabledSources = state?.settings?.enabledCommentSources || { jable: true, javdb: true, javlibrary: false };
        const isSiteEnabled = (siteKey === 'javlib')
            ? (enabledSources.javlib !== false && enabledSources.javlibrary !== false)
            : (enabledSources[siteKey] !== false);

        if (!isSiteEnabled) {
            logger.log(`[CommentPanel] 站点 ${siteKey} 在设置中已禁用，取消评论抓取。`);
            site.loading = false;
            return;
        }

        if (siteKey === 'javlib' && isMobile()) {
            site.loading = false;
            site.status = 'mobile_unsupported';
            site.comments = [];
            site.filteredComments = [];
            this.applyFilter();
            this.renderCommentsList();
            this.updateCommentsCount();
            return;
        }

        site.loading = true;
        if (page === 1) {
            site.status = 'loading';
            site.comments = [];
            site.filteredComments = [];
            site.totalCount = 0;
            site.hasMore = false;
            if (siteKey === 'javlib') {
                this.javlibCfShield = false;
                this.javlibFailedDomain = '';
            }
        } else {
            this.showBottomLoader(siteKey);
        }

        try {
            let res;
            if (siteKey === 'jable') {
                let jableResPromise;
                if (page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.jableCommentsPromise) {
                    logger.log('[CommentPanel] 使用预加载的 Jable.tv 评论...');
                    jableResPromise = CommentPanel.preloadCache.jableCommentsPromise;
                } else {
                    let domainIndex = 0;
                    let storedWorkingDomain = '';
                    if (typeof GM_getValue === 'function') {
                        try { storedWorkingDomain = GM_getValue('mp_jable_working_domain', ''); } catch (e) { }
                    }
                    const defaultDomain = site.workingDomain || storedWorkingDomain;
                    if (defaultDomain) {
                        const idx = JABLE_DOMAINS.indexOf(defaultDomain);
                        if (idx !== -1) domainIndex = idx;
                    }
                    jableResPromise = fetchJableComments(this.videoCode, page, domainIndex);
                }
                res = await jableResPromise;
                this.jableVideoExists = true;
                if (res.domain) {
                    site.workingDomain = res.domain;
                    if (typeof GM_setValue === 'function') {
                        try { GM_setValue('mp_jable_working_domain', res.domain); } catch (e) { }
                    }
                }
            } else if (siteKey === 'javlib') {
                let isShadowActive = await CrossDomainBridge.checkShadowActive('JAVLIBRARY');
                if (isShadowActive) {
                    logger.log('[CommentPanel] 检测到 JAVLibrary 影子通道在线，优先通过影子协同获取数据...');
                    const shadowRes = await CrossDomainBridge.sendCommand('JAVLIBRARY', 'FETCH_JAVLIB_DATA', {
                        avcode: this.videoCode,
                        page: page
                    });
                    if (shadowRes) {
                        const { idResult, cRes, rRes } = shadowRes;
                        site.videoId = idResult.videoId;
                        site.workingDomain = idResult.domain;
                        this.javlibVideoExists = true;

                        rRes.comments.forEach(c => { c.site = 'javlib-review'; });
                        res = {
                            comments: [...cRes.comments, ...rRes.comments],
                            totalCount: cRes.totalCount + rRes.totalCount,
                            hasMore: cRes.hasMore || rRes.hasMore
                        };
                    } else {
                        logger.log('[CommentPanel] JAVLibrary 影子通道同源抓取失败，降级为跨域直连抓取...');
                    }
                }

                if (!res) {
                    let videoId = site.videoId;
                    let workingDomain = site.workingDomain;
                    if (!videoId) {
                        let idPromise;
                        if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibVideoIdPromise) {
                            logger.log('[CommentPanel] 使用预加载的 JAVLibrary ID...');
                            idPromise = CommentPanel.preloadCache.javlibVideoIdPromise;
                        } else {
                            idPromise = fetchJavLibraryVideoId(this.videoCode);
                        }
                        const result = await idPromise;
                        videoId = result.videoId;
                        workingDomain = result.domain;
                        site.videoId = videoId;
                        site.workingDomain = workingDomain;
                    }
                    const domain = workingDomain || JAVLIB_DOMAINS[0];
                    const cPromise = (page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibCommentsPromise)
                        ? CommentPanel.preloadCache.javlibCommentsPromise
                        : fetchJavLibraryData(videoId, 'comments', page, domain);

                    const rPromise = (page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibReviewsPromise)
                        ? CommentPanel.preloadCache.javlibReviewsPromise
                        : fetchJavLibraryData(videoId, 'reviews', page, domain);

                    const [cRes, rRes] = await Promise.all([
                        cPromise.catch(err => { logger.warn('[CommentPanel] 获取 JAVLibrary 评论失败:', err); throw err; }),
                        rPromise.catch(err => { logger.warn('[CommentPanel] 获取 JAVLibrary 文章失败:', err); throw err; })
                    ]);
                    rRes.comments.forEach(c => { c.site = 'javlib-review'; });
                    res = {
                        comments: [...cRes.comments, ...rRes.comments],
                        totalCount: cRes.totalCount + rRes.totalCount,
                        hasMore: cRes.hasMore || rRes.hasMore
                    };
                }
            } else if (siteKey === 'javdb') {
                let movieId = site.movieId;
                let workingDomain = site.workingDomain;
                if (!movieId) {
                    let idPromise;
                    if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javdbMovieIdPromise) {
                        logger.log('[CommentPanel] 使用预加载的 JavDB ID...');
                        idPromise = CommentPanel.preloadCache.javdbMovieIdPromise;
                    } else {
                        idPromise = fetchJavdbMovieId(this.videoCode);
                    }
                    const result = await idPromise;
                    movieId = result.movieId;
                    workingDomain = result.domain;
                    site.movieId = movieId;
                    site.workingDomain = workingDomain;
                }
                const domain = workingDomain || JAVDB_DOMAINS[0];
                const resPromise = (page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javdbCommentsPromise)
                    ? CommentPanel.preloadCache.javdbCommentsPromise
                    : fetchJavdbData(movieId, page, domain);
                res = await resPromise;
            }

            const duration = this.targetVideo ? this.targetVideo.duration : 10800;
            const processed = (res.comments || []).map((c, idx) => {
                const proc = processComment(c.text, this.videoCode, duration);
                return {
                    ...c,
                    ...proc,
                    _timestamp: parseCommentDate(c.time),
                    _originalIndex: (page - 1) * 50 + idx
                };
            });

            // 统计各平台评论总条数 (需求 2)
            const platformStats = {
                jable: this.sites.jable?.totalCount || this.sites.jable?.comments?.length || 0,
                javdb: this.sites.javdb?.totalCount || this.sites.javdb?.comments?.length || 0,
                javlib: this.sites.javlib?.totalCount || this.sites.javlib?.comments?.length || 0
            };
            platformStats.total = (platformStats.jable || 0) + (platformStats.javdb || 0) + (platformStats.javlib || 0);

            // 调试模式与 WebDAV 收集含数字或提到其他 AVCODE 的评论语料 (附带各平台总数)
            CommentDebugCollector.collectComments(this.videoCode, processed, duration, platformStats);
            // 自动同步至 Supabase 自建评论分析数据库
            const videoDuration = getVideoDurationSeconds(this.targetVideo || this.playerCore?.targetVideo);
            SupabaseService.uploadComments(this.videoCode, siteKey, processed, videoDuration);
            DebugLogPanel.addLog(`[评论采集] ${site.name} 第 ${page} 页完成 (${processed.length}条，总计${site.totalCount}条)`, 'success');

            if (!site.collectedPages) {
                site.collectedPages = new Set();
            }
            site.collectedPages.add(page);

            if (page === 1 && forceRefresh) {
                site.comments = processed;
            } else {
                const existingIds = new Set(site.comments.map(c => c.id));
                const uniqueNew = processed.filter(c => !existingIds.has(c.id));
                site.comments = [...site.comments, ...uniqueNew];
            }

            if (siteKey === 'jable') {
                site.comments.sort((a, b) => (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0));
            }

            site.totalCount = res.totalCount || site.comments.length;
            site.hasMore = res.hasMore;
            site.status = site.comments.length === 0 ? 'empty' : 'loaded';
            site.currentPage = Math.max(site.currentPage || 1, page);

            // 同步保存至本地增量评论缓存
            CommentCacheManager.saveSiteCache(this.videoCode, siteKey, site);

            // 疯狂采集模式：普通评论采集也自动采集更多页，直到结束 (全量采集)
            const isCrazy = Boolean(getValue('crazyScrapeMode', false));
            if (isCrazy && site.hasMore && page < 20) {
                setTimeout(() => {
                    if (this.videoCode === this.currentVideoCode || !this.currentVideoCode) {
                        this.loadSiteComments(siteKey, page + 1);
                    }
                }, 1000 + Math.random() * 600);
            }

        } catch (err) {
            logger.warn(`[CommentPanel] 获取 ${site.name} 评论失败:`, err);
            if (siteKey === 'javlib') {
                this.handleJavlibError(err);
            } else {
                const msg = err.message || '';
                if (msg.includes('404') || msg.includes('not found')) {
                    if (siteKey === 'jable') this.jableVideoExists = false;
                    site.status = 'not_found';
                } else if (msg.includes('人机验证') || msg.startsWith('CF_SHIELD_ON_') || msg.includes('cf-challenge') || msg.includes('Cloudflare') || msg.includes('cloudflare')) {
                    site.status = 'cf_shield';
                    if (siteKey === 'jable') {
                        this.jableFailedDomain = err.domain || site.workingDomain || JABLE_DOMAINS[0];
                    }
                } else {
                    site.status = 'unreachable';
                }
            }
            if (page === 1) {
                site.comments = [];
                site.filteredComments = [];
            }
        } finally {
            site.loading = false;
            this.applyFilter();
            // 优先尝试就地增量更新，杜绝重新渲染导致已展开卡片被折叠
            const patched = this.patchSectionContent(siteKey);
            if (!patched) {
                this.renderCommentsList();
            }
            this.updateCommentsCount();
            this.hideBottomLoader(siteKey);
        }
    }

    loadJableComments(page = 1) { return this.loadSiteComments('jable', page); }
    loadJavlibComments(page = 1) { return this.loadSiteComments('javlib', page); }
    loadJavdbComments(page = 1) { return this.loadSiteComments('javdb', page); }

    handleJavlibError(err) {
        console.warn('[CommentPanel] JAVLibrary 发生错误:', err);
        const msg = err.message || '';
        if (msg.startsWith('CF_SHIELD_ON_')) {
            this.javlibStatus = 'cf_shield';
            this.javlibCfShield = true;
            this.javlibFailedDomain = msg.replace('CF_SHIELD_ON_', '');
        } else if (msg === 'CLOUDFLARE_SHIELD') {
            this.javlibStatus = 'cf_shield';
            this.javlibCfShield = true;
        } else if (msg.includes('Movie not found') || msg.includes('404')) {
            this.javlibStatus = 'not_found';
        } else {
            this.javlibStatus = 'unreachable';
        }
    }

    /**
     * 处理评论中番号点击：仅显示视频预览浮窗，同时自动拷贝番号
     */
    handleCodeClick(code, targetEl) {
        this.codePreview.handleCodeClick(code, targetEl);
    }

    showCodePreview(code, targetEl) {
        this.codePreview.show(code, targetEl);
    }

    hideCodePreview() {
        this.codePreview.hide();
    }

    /**
     * 显示 Cloudflare 防火墙验证提示
     */
    showCloudflarePrompt(failedDomain) {
        const targetDomain = failedDomain || `https://${SITE_DOMAINS.JAVLIBRARY.primary}`;
        if (this.loadingElement) this.loadingElement.classList.add('is-hidden');
        if (this.commentsList) this.commentsList.classList.add('is-hidden');
        if (this.errorElement) {
            this.errorElement.className = 'mp-comments-error';
            this.errorElement.innerHTML = `
                <div class="mp-cf-card">
                    <p class="mp-cf-title">触发 JAVLibrary 防火墙验证</p>
                    <p class="mp-cf-desc">需要您先去 JAVLibrary 完成人机验证以获得授权Cookie。</p>
                    <a href="${targetDomain}/cn/" target="_blank" class="tm-comments-verify-link mp-cf-verify-btn">去验证 (验证后返回重试)</a>
                    <button class="tm-comment-retry-btn mp-cf-retry-btn">我已验证，点击重试</button>
                </div>
            `;
        }
    }

    /**
     * 启动 JAVLibrary 后台验证 (协同模式)
     */
    startJavlibBackgroundVerification(failedDomain) {
        if (this.javlibAutoVerifyAttempted) return;
        this.javlibAutoVerifyAttempted = true;

        const targetDomain = failedDomain || `https://${SITE_DOMAINS.JAVLIBRARY.primary}`;

        logger.log(`尝试启动 JAVLibrary 后台验证，目标域名: ${targetDomain}`);
        this.javlibVerifyingStatus = 'verifying';
        this.renderCommentsList(); // 刷新 UI 显示加载动画

        // 1. 启动验证成功信号监听
        this.startSignalListener();

        // 2. 启动后台静默验证标签页
        const verifyUrl = `${targetDomain}/cn/?cf_verify=1`;

        const now = Date.now();
        const lastVerifyStart = (typeof GM_getValue === 'function' ? GM_getValue('javlib_verifying_start_time') : 0) || 0;
        const isAlreadyVerifying = (typeof GM_getValue === 'function' && GM_getValue('javlib_verifying') === true) && (now - lastVerifyStart < 15000);

        if (isAlreadyVerifying) {
            logger.log('监测到其他标签页已经在进行 JAVLibrary 验证，本标签页仅挂载监听器。');
        } else {
            logger.log('无其他活跃验证标签页，尝试启动后台验证标签页。');
            if (typeof GM_setValue === 'function') {
                GM_setValue('javlib_verifying', true);
                GM_setValue('javlib_verifying_start_time', now);
            }

            try {
                if (typeof GM_openInTab === 'function') {
                    this.javlibVerificationTab = GM_openInTab(verifyUrl, { active: false, insert: true, pinned: true });
                    logger.log('已通过 GM_openInTab 打开后台静默验证标签页。');
                } else if (typeof GM !== 'undefined' && typeof GM.openInTab === 'function') {
                    const tabRes = GM.openInTab(verifyUrl, { active: false, insert: true, pinned: true });
                    if (tabRes && typeof tabRes.then === 'function') {
                        tabRes.then(tab => { this.javlibVerificationTab = tab; }).catch(e => {
                            logger.error('GM.openInTab 异步启动失败:', e);
                        });
                    } else {
                        this.javlibVerificationTab = tabRes;
                    }
                    logger.log('已通过 GM.openInTab 打开后台静默验证标签页。');
                } else {
                    logger.warn('GM_openInTab 和 GM.openInTab 均未定义，降级为手动验证。');
                    this.handleJavlibVerificationTimeout(failedDomain);
                    return;
                }
            } catch (e) {
                logger.error('启动后台验证标签页失败:', e);
                this.handleJavlibVerificationTimeout(failedDomain);
                return;
            }
        }

        // 3. 设置 15 秒超时定时器，如果超时未通过，则展示手动验证提示
        this.javlibVerificationTimeout = setTimeout(() => {
            logger.warn('JAVLibrary 后台验证超时，切换至手动验证提示。');
            this.handleJavlibVerificationTimeout(failedDomain);
        }, 15000);
    }

    /**
     * 处理验证成功信号
     */
    handleJavlibVerificationSuccess() {
        this.cleanupJavlibVerification();
        if (this._onTabsUpdatedBound) {
            window.removeEventListener('mp_tabs_updated', this._onTabsUpdatedBound);
            this._onTabsUpdatedBound = null;
        }
        this.javlibCfShield = false;
        this.javlibVerifyingStatus = '';

        // 自动重载 JAVLibrary 评论
        this.handleRetry('javlib');
    }

    /**
     * 处理验证超时/降级为手动验证
     */
    handleJavlibVerificationTimeout(failedDomain) {
        this.cleanupJavlibVerification(true); // 保持信号监听器，以应对用户在手动验证标签页通过验证
        this.javlibVerifyingStatus = 'manual';
        this.renderCommentsList(); // 渲染手动卡片
    }

    /**
     * 清理验证过程中的标签页、监听器和定时器
     * @param {boolean} [keepListener=false] - 是否保持信号监听器以便后续接收验证成功信号
     */
    cleanupJavlibVerification(keepListener = false) {
        // 清理超时定时器
        if (this.javlibVerificationTimeout) {
            clearTimeout(this.javlibVerificationTimeout);
            this.javlibVerificationTimeout = null;
        }

        if (!keepListener) {
            // 移除 GM 监听器
            if (this.javlibVerifiedListenerId && typeof GM_removeValueChangeListener === 'function') {
                GM_removeValueChangeListener(this.javlibVerifiedListenerId);
                this.javlibVerifiedListenerId = null;
            }

            // 清理轮询定时器
            if (this.javlibVerifiedPollInterval) {
                clearInterval(this.javlibVerifiedPollInterval);
                this.javlibVerifiedPollInterval = null;
            }
        }

        // 释放验证标签页引用，保持其在后台打开作为影子 Broker
        if (this.javlibVerificationTab) {
            logger.log('保持后台验证标签页存活，充当影子 Broker。');
            this.javlibVerificationTab = null;
        }

        // 释放验证锁
        if (typeof GM_setValue === 'function') {
            GM_setValue('javlib_verifying', false);
        }
    }

    /**
     * 开启 JAVLibrary 验证信号监听（支持全局监听器与轮询回退）
     */
    startSignalListener() {
        if (this.javlibVerifiedListenerId || this.javlibVerifiedPollInterval) return;

        if (typeof GM_addValueChangeListener === 'function') {
            this.javlibVerifiedListenerId = GM_addValueChangeListener('javlib_verified_time', (key, oldValue, newValue, remote) => {
                logger.log('监听到 JAVLibrary 验证成功信号 (监听器)！');
                this.handleJavlibVerificationSuccess();
            });
        } else {
            logger.log('GM_addValueChangeListener 未定义，使用轮询方式监听验证信号。');
            const initialTime = (typeof GM_getValue === 'function' ? GM_getValue('javlib_verified_time') : 0) || 0;
            this.javlibVerifiedPollInterval = setInterval(() => {
                const latestTime = (typeof GM_getValue === 'function' ? GM_getValue('javlib_verified_time') : 0) || 0;
                if (latestTime > initialTime) {
                    logger.log('通过轮询监听到 JAVLibrary 验证成功信号！');
                    this.handleJavlibVerificationSuccess();
                }
            }, 1000);
        }
    }

    /**
     * 过滤灌水/SPAM评论（分源独立过滤）
     */
    applyFilter() {
        const hasNumberRegex = /\d/;
        const onlyNumbers = Boolean(this.playerCore?.options?.playerState?.settings?.debugMode && this.playerCore?.options?.playerState?.settings?.debugFilterHasNumbers);

        const filterFn = (c) => {
            if (this.filterSpam && c?.spam?.label === 'SPAM') return false;
            if (onlyNumbers) {
                const text = c?.rawText || c?.text || '';
                return hasNumberRegex.test(text);
            }
            return true;
        };

        this.filteredJableComments = this.jableComments.filter(filterFn);
        this.filteredJavlibComments = this.javlibComments.filter(filterFn);
        this.filteredJavdbComments = this.javdbComments.filter(filterFn);
        // 向下兼容：维护合并列表
        this.filteredComments = [...this.filteredJableComments, ...this.filteredJavlibComments, ...this.filteredJavdbComments];
        this.comments = [...this.jableComments, ...this.javlibComments, ...this.javdbComments];
    }

    /**
     * 创建并初始化评论区 DOM
     * @returns {HTMLElement} 虚拟占位行元素 (兼容 ControlManager.js 结构)
     */
    createCommentRow() {
        // 创建统一的全屏评论面板
        this.commentsPanel = document.createElement('div');
        this.commentsPanel.className = 'tm-comments-panel';

        this.commentsPanel.innerHTML = `
            <div class="tm-comments-list tm-comments-panel-list"></div>
            <div class="tm-comment-loading tm-comments-panel-loading is-hidden"></div>
            <div class="tm-comment-error tm-comments-panel-error is-hidden"></div>
            <div class="tm-comment-backdrop is-hidden"></div>
            <div class="tm-comment-submit-bar-wrapper is-collapsed">
                <div class="tm-comment-drawer-pill" title="收起"></div>
                <div class="tm-comment-tag-select-modal">
                    <div class="tm-tag-select-header">
                        <span class="tm-tag-select-title">附带高光片段</span>
                        <div class="tm-tag-select-btn-group">
                            <button type="button" class="tm-tag-select-all-btn">全选</button>
                            <button type="button" class="tm-tag-deselect-all-btn">清空</button>
                            <button type="button" class="tm-tag-select-close-btn" title="收起片段列表">${CLOSE_LINE}</button>
                        </div>
                    </div>
                    <div class="tm-tag-select-list"></div>
                </div>
                <div class="tm-comment-submit-bar">
                    <button type="button" class="tm-comment-add-tag-btn" title="附带高光片段">
                        ${ICON_PLUS}
                        <span class="tm-add-tag-badge is-hidden">0</span>
                    </button>
                    <input type="text" class="tm-comment-text-input" placeholder="写下你的评论..." />
                    <button type="button" class="tm-comment-send-btn">${__('send')}</button>
                </div>
            </div>
            <button class="tm-comment-fab-btn" title="发表评论">${ICON_COMMENT_WRITE}</button>
            <button class="tm-show-controls-float-btn" title="显示控制面板">${KEYBOARD}</button>
        `;

        this.commentsList = this.commentsPanel.querySelector('.tm-comments-list');
        this.loadingElement = this.commentsPanel.querySelector('.tm-comment-loading');
        this.errorElement = this.commentsPanel.querySelector('.tm-comment-error');

        // 初始化评论提交栏及其事件
        this.initCommentSubmitBar();

        // 绑定显示控制面板的浮动键盘按钮事件
        const showControlsBtn = this.commentsPanel.querySelector('.tm-show-controls-float-btn');
        if (showControlsBtn) {
            showControlsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.uiManager) {
                    this.uiManager.showControls();
                    this.uiManager.autoHideControls();
                }
            });
        }

        // 应用设置状态 (同步 debugMode 等设置)
        this.applySettingsState();

        // 绑定滑动/滚轮隐藏控制面板事件 (仅在控制面板显示时生效)
        const hideControlsOnScroll = () => {
            if (this.uiManager && this.uiManager.controlsVisible) {
                // 大屏设备/悬浮窗模式下（iPad 竖屏及 PC 横屏），评论区与控制面板共存，滚动时不隐藏控制栏
                if (this.uiManager.isFloatingControlPanel) {
                    return;
                }
                this.uiManager.hideControls(true);
            }
        };
        this.commentsList.addEventListener('touchmove', hideControlsOnScroll, { passive: true });

        // 滚轮滚动事件：隐藏控制栏，并在顶部向上滚动时重新计算对齐评论区顶部位置
        this.commentsList.addEventListener('wheel', (e) => {
            hideControlsOnScroll();

            // 向上滚动且处于列表顶部时，重新对齐评论区位置（防止用户调大视频画面后遮挡评论）
            const scrollContainer = this.commentsList;
            const isAtTop = !scrollContainer || scrollContainer.scrollTop <= 5;
            if (e.deltaY < 0 && isAtTop) {
                this.updatePosition();
            }
        }, { passive: true });

        // 当用户显示区域内剩余未浏览评论不足时自动采集更多评论 (统一监听外层列表滚动，并加入 requestAnimationFrame 节流)
        let isCheckingScroll = false;
        const handleScrollLoadMore = () => {
            if (isCheckingScroll) return;
            isCheckingScroll = true;

            requestAnimationFrame(() => {
                isCheckingScroll = false;
                if (!this.commentsList) return;
                const container = this.commentsList;
                const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                if (distanceToBottom < 500) {
                    const activeSection = this.commentsList.querySelector('.tm-comment-section:not(.is-collapsed)');
                    if (activeSection) {
                        if (activeSection.id === 'tm-comment-section-jable') {
                            this.triggerLoadMoreJable();
                        } else if (activeSection.id === 'tm-comment-section-javlib') {
                            this.triggerLoadMoreJavlib();
                        } else if (activeSection.id === 'tm-comment-section-javdb') {
                            this.triggerLoadMoreJavdb();
                        }
                    }
                }
            });
        };

        this.commentsList.addEventListener('scroll', handleScrollLoadMore, { capture: true, passive: true });

        let startY = 0;
        this.commentsList.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        this.commentsList.addEventListener('touchmove', (e) => {
            const endY = e.touches[0].clientY;
            const diffY = startY - endY;

            const container = this.commentsList;
            const isAtBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 500) : false;
            const isAtTop = container ? (container.scrollTop <= 5) : true;

            // 向上滑动触底加载更多 (阈值设置为 500px 缓冲区，分源触发)
            if (diffY > 15 && isAtBottom) {
                const activeSection = this.commentsList.querySelector('.tm-comment-section:not(.is-collapsed)');
                if (activeSection) {
                    if (activeSection.id === 'tm-comment-section-jable') {
                        this.triggerLoadMoreJable();
                    } else if (activeSection.id === 'tm-comment-section-javlib') {
                        this.triggerLoadMoreJavlib();
                    } else if (activeSection.id === 'tm-comment-section-javdb') {
                        this.triggerLoadMoreJavdb();
                    }
                }
            }

            // 向下滑动且处于列表顶部时，重新计算并对齐评论区顶部位置（拉动移动被遮盖内容）
            if (diffY < -15 && isAtTop) {
                this.updatePosition();
            }
        }, { passive: true });
        // 挂载全屏面板到播放器主容器中，确保放在 tm-handle-container 后面以符合流式排版顺序
        if (this.uiElements && this.uiElements.playerContainer) {
            const handleContainer = this.uiElements.handleContainer;
            if (handleContainer && handleContainer.parentNode === this.uiElements.playerContainer) {
                this.uiElements.playerContainer.insertBefore(this.commentsPanel, handleContainer.nextSibling);
            } else {
                this.uiElements.playerContainer.appendChild(this.commentsPanel);
            }
        }

        // 绑定点击评论面板区域事件：如果是大屏/悬浮窗模式，点击空白处不切换控制面板，但使评论区变亮；
        // 如果是手机端模式，仅允许在控制面板显示时点击空白处隐藏它，不可点击空白处弹起显示控制面板
        this.commentsPanel.addEventListener('click', (e) => {
            const reportBtn = e.target.closest('.jc-report-btn');
            if (reportBtn) {
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
                console.log('[CommentPanel] 点击上报按钮触发:', reportBtn);
                DebugLogPanel.addLog('[CommentPanel] 点击上报按钮触发', 'info');
                const commentId = reportBtn.getAttribute('data-comment-id');
                const card = reportBtn.closest('.jc-card');
                const cardId = card ? card.getAttribute('data-id') : null;
                let comment = this.findCommentById(commentId) || (cardId ? this.findCommentById(cardId) : null);
                if (!comment && card) {
                    const textEl = card.querySelector('.jc-body-text-content') || card.querySelector('.jc-body-text');
                    const userEl = card.querySelector('.jc-u');
                    comment = {
                        id: commentId || cardId || 'unknown',
                        user: userEl ? userEl.textContent.trim() : '匿名',
                        rawText: textEl ? textEl.textContent.trim() : '',
                        text: textEl ? textEl.textContent.trim() : ''
                    };
                }
                if (comment) {
                    this._showCommentReportModal(comment);
                }
                return;
            }
            const interactive = e.target.closest('a, button, input, label, .jc-time-link, .jc-code-link, .jc-toggle-expand-btn, .tm-comment-retry-btn');
            const toggleExpandBtn = e.target.closest('.jc-toggle-expand-btn');
            const collapsible = e.target.closest('.jc-body-text--collapsible');

            if (toggleExpandBtn && collapsible) {
                e.stopPropagation();
                const isCollapsed = collapsible.getAttribute('data-collapsed') === 'true';
                const nextCollapsed = !isCollapsed;
                collapsible.setAttribute('data-collapsed', nextCollapsed ? 'true' : 'false');
                toggleExpandBtn.textContent = nextCollapsed ? (__('commentsExpand') || '展开') : (__('commentsCollapse') || '收起');

                const card = collapsible.closest('.jc-card');
                const cid = card ? card.getAttribute('data-id') : null;
                if (cid) {
                    if (!nextCollapsed) {
                        this.expandedCommentIds.add(cid);
                    } else {
                        this.expandedCommentIds.delete(cid);
                    }
                }
                return;
            }

            if (collapsible && !interactive) {
                const isCollapsed = collapsible.getAttribute('data-collapsed') === 'true';
                if (isCollapsed) {
                    e.stopPropagation();
                    collapsible.setAttribute('data-collapsed', 'false');
                    const btn = collapsible.querySelector('.jc-toggle-expand-btn');
                    if (btn) {
                        btn.textContent = __('commentsCollapse') || '收起';
                    }
                    const card = collapsible.closest('.jc-card');
                    const cid = card ? card.getAttribute('data-id') : null;
                    if (cid) {
                        this.expandedCommentIds.add(cid);
                    }
                    return;
                }
            }

            if (interactive) {
                // 如果是可交互元素，允许其正常进行相应的事件处理
                return;
            }

            e.stopPropagation();

            // 如果评论发表栏正处于展开态，点击评论列表空白处或非交互区域立即自动收起评论发表栏（连同高光抽屉）
            if (this.composer && this.composer.submitBarWrapper && !this.composer.submitBarWrapper.classList.contains('is-collapsed')) {
                if (Date.now() - (this.composer._lastInputTouchTime || 0) >= 60) {
                    this.composer.closeComposer();
                    return;
                }
            }

            if (this.uiManager) {
                // 大屏设备/悬浮窗模式下（iPad 竖屏及 PC 横屏），评论区与控制面板共存，点击空白使评论区变亮
                if (this.uiManager.isFloatingControlPanel) {
                    this.commentsPanel.classList.remove('is-dimmed');
                    return;
                }

                // 手机端：如果控制面板已显示，点击空白处将其隐藏；但不允许点击空白处再次拉起/弹起控制面板
                if (this.uiManager.controlsVisible) {
                    this.uiManager.hideControls(true);
                }
            }
        });

        // 触碰与点击拦截处理器：处理不同终端的激活与误触隐藏逻辑
        const handleCommentTouchStart = (e) => {
            if (!this.uiManager) return;

            // 检查是否点击了显示控制栏的浮动按钮
            let isShowControlsBtn = e.target.closest('.tm-show-controls-float-btn');
            if (!isShowControlsBtn) {
                // 回退方案：通过坐标判断，防止 iOS/Safari 在 pointer-events 混合或层级覆盖时导致 target 无法正确匹配
                const floatBtn = this.commentsPanel.querySelector('.tm-show-controls-float-btn');
                if (floatBtn && window.getComputedStyle(floatBtn).display !== 'none') {
                    const rect = floatBtn.getBoundingClientRect();
                    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
                    const clientX = touch ? touch.clientX : e.clientX;
                    const clientY = touch ? touch.clientY : e.clientY;
                    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                        isShowControlsBtn = floatBtn;
                    }
                }
            }

            if (isShowControlsBtn) {
                this.commentsPanel.classList.remove('is-dimmed');
                this.uiManager.showControls();
                this.uiManager.autoHideControls();
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
                return;
            }

            const isSubmitBar = !!e.target.closest('.jc-report-btn, .jc-save-all-btn, .jc-action-btn, .tm-comment-submit-bar-wrapper, .tm-comment-tag-select-modal, .tm-floating-comment-panel, .tm-comment-text-input, .tm-comment-add-tag-btn, .tm-comment-send-btn, .tm-comment-fab-btn, .tm-comment-backdrop');

            // 只要评论区是变暗状态，任何触摸或点击都应立即激活它并移除 is-dimmed
            if (this.commentsPanel.classList.contains('is-dimmed')) {
                this.setDimmed(false);
                // 手机竖屏模式下，激活评论区的同时隐藏控制面板
                if (!this.uiManager.isLandscape) {
                    this.uiManager.hideControls(true);
                }
                // 如果用户点击的是发表栏或弹窗控件，不阻止默认行为以允许正常聚焦输入或点击按钮
                if (!isSubmitBar) {
                    if (e.cancelable) e.preventDefault();
                    e.stopPropagation(); // 阻止事件传给视频区
                    return;
                }
            }

            const isFloating = this.uiManager.isFloatingControlPanel;
            const controlsVisible = this.uiManager.controlsVisible;

            if (isFloating) {
                // 大屏端 (PC/iPad)：任何对评论区的点击或触屏，都会使评论区重新变亮 (移除 is-dimmed)
                this.setDimmed(false);
            } else if (controlsVisible) {
                // 手机端：若控制面板已显示，用户点击/触摸评论区（排除时间戳链接与发表栏）时，立即隐藏控制面板以防止误触
                if (!e.target.closest('.jc-time-link, .tm-comment-submit-bar-wrapper, .tm-comment-tag-select-modal, .tm-floating-comment-panel, .tm-comment-fab-btn, .tm-comment-backdrop')) {
                    this.uiManager.hideControls(true);
                }
            }

            // 物理防击穿：若触摸点落在非可交互区域（非输入、非按钮、非链接、非展开手柄），彻底阻断 touch 事件冒泡至宿主页面，杜绝 iOS Safari 唤起虚拟键盘
            const isInteractive = !!e.target.closest('a, button, input, textarea, select, .jc-time-link, .jc-code-link, .jc-toggle-expand-btn, .tm-comment-retry-btn, .jc-report-btn, .jc-countdown-btn, .tm-comment-section-hdr');
            if (!isInteractive && !isSubmitBar) {
                e.stopPropagation();
            }
        };
        this.commentsPanel.addEventListener('touchstart', handleCommentTouchStart, { passive: false });
        this.commentsPanel.addEventListener('mousedown', handleCommentTouchStart, { passive: false });

        // PC端专用：鼠标移入评论区 -> 评论区变亮；移出评论区 -> 评论区重新变暗以突出显示控制栏
        this.commentsPanel.addEventListener('mouseenter', () => {
            if (this.uiManager && this.uiManager.isFloatingControlPanel) {
                this.setDimmed(false);
            }
        });
        this.commentsPanel.addEventListener('mouseleave', () => {
            if (this.uiManager &&
                this.uiManager.isFloatingControlPanel &&
                this.uiManager.controlsVisible) {
                this.setDimmed(true);
            }
        });

        // 阻止触摸事件冒泡到底层页面，防止背景页面滚动穿透
        // 注意：放行 touchmove 到 playerContainer 进行按需滚动拦截判断，防止空白处滑动穿透
        ['touchstart', 'touchend'].forEach(evt => {
            this.commentsPanel.addEventListener(evt, (e) => {
                e.stopPropagation();
            }, { passive: true });
        });

        // 延时更新位置以确保 DOM 尺寸就绪
        this.updatePosition();
        setTimeout(() => this.updatePosition(), 300);

        // 提取番号并加载评论
        this.videoCode = getVideoCodeFromUrl();
        if (this.videoCode) {
            logger.log(`[CommentPanel] 提取到当前视频番号: ${this.videoCode}，开始采集...`);
            this.loadComments(1);
        } else {
            logger.warn('[CommentPanel] 无法从当前URL解析到视频番号。');
            if (this.commentsList) {
                this.commentsList.innerHTML = `<div class="tm-comment-error">无法解析视频番号，暂不支持展示评论。</div>`;
            }
        }

        // 绑定 ResizeObserver，当评论面板大小改变（如由隐藏变为显示）时触发检查是否填满视口
        if (typeof ResizeObserver !== 'undefined' && this.commentsPanel) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.contentRect.height > 0) {
                        this.checkViewportFill();
                    }
                }
            });
            resizeObserver.observe(this.commentsPanel);
            this.commentsPanelResizeObserver = resizeObserver;
        }

        // 返回虚拟的隐藏 DOM 节点，保证不影响控制条原有的 Flex 流
        const dummyRow = document.createElement('div');
        dummyRow.className = 'tm-comment-row-placeholder';
        dummyRow.style.display = 'none';
        return dummyRow;
    }

    /**
     * 弹出“评论功能开发中”的模态框
     */
    /**
     * 弹出“评论功能开发中”的模态框 (保留备用)
     */
    showDevelopmentModal() {
        this.showTipModal('提示', '评论功能开发中');
    }

    setLoopManager(loopManager) {
        this.loopManager = loopManager;
    }

    getLoopManager() {
        return this.loopManager || 
               this.controlManager?.loopManager || 
               this.playerCore?.controlManager?.loopManager || 
               this.playerCore?.loopManager || 
               this.playerCore?.customVideoPlayer?.managers?.loopManager || 
               null;
    }

    getTabs() {
        const lm = this.getLoopManager();
        if (lm && Array.isArray(lm.tabs) && lm.tabs.length > 0) {
            return lm.tabs;
        }
        if (this.videoCode) {
            const saved = getValue(`tabs_${this.videoCode}`, []);
            if (Array.isArray(saved) && saved.length > 0) {
                return saved.filter(t => t && typeof t === 'object' && t.id);
            }
        }
        return (lm && Array.isArray(lm.tabs)) ? lm.tabs : [];
    }

    /**
     * 检测目标站点是否可以发表评论（校验番号、页面存在性、登录状态）
     */
    async checkCanComment() {
        return this.composer.checkCanComment();
    }

    initCommentSubmitBar(panelEl) {
        return this.composer.initCommentSubmitBar(panelEl || this.commentsPanel);
    }

    toggleTagSelectModal() {
        return this.composer.toggleTagSelectModal();
    }

    openTagSelectModal() {
        return this.composer.openTagSelectModal();
    }

    closeTagSelectModal() {
        return this.composer.closeTagSelectModal();
    }

    renderTagSelectList() {
        return this.composer.renderTagSelectList();
    }

    async handleSendComment() {
        return this.composer.handleSendComment();
    }

    async submitComment(commentText) {
        return this.composer.submitComment(commentText);
    }

    async handlePublishComment() {
        return this.composer.handlePublishComment();
    }

    showTipModal(title, message) {
        return this.composer.showTipModal(title, message);
    }

    showLoginPromptModal(domain) {
        return this.composer.showLoginPromptModal(domain);
    }

    showLoginModal(domain, onSuccess) {
        return this.composer.showLoginModal(domain, onSuccess);
    }

    showCommentInputModal(commentForm, targetUrl, domain) {
        return this.composer.showCommentInputModal(commentForm, targetUrl, domain);
    }

    updatePosition() {
        if (!this.commentsPanel) return;
        this.commentsPanel.classList.toggle('is-hidden', false);
    }

    /**
     * 显示加载中状态 (仅用于首屏/第一页加载)
     */
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.className = 'tm-comment-loading mp-comments-loading';
            this.loadingElement.innerHTML = `
                <div class="jc-card jc-skeleton mp-skeleton-card">
                    <div class="jc-bd">
                        <div class="jc-hdr mp-skeleton-header">
                            <div class="skeleton-block mp-skeleton-title-block"></div>
                            <div class="skeleton-block mp-skeleton-meta-block"></div>
                        </div>
                        <div class="jc-body-text">
                            <div class="skeleton-block mp-skeleton-line"></div>
                            <div class="skeleton-block mp-skeleton-line"></div>
                        </div>
                    </div>
                </div>
                <div class="jc-card jc-skeleton mp-skeleton-card">
                    <div class="jc-bd">
                        <div class="jc-hdr mp-skeleton-header">
                            <div class="skeleton-block mp-skeleton-title-block"></div>
                            <div class="skeleton-block mp-skeleton-meta-block"></div>
                        </div>
                        <div class="jc-body-text">
                            <div class="skeleton-block mp-skeleton-line"></div>
                            <div class="skeleton-block mp-skeleton-line"></div>
                        </div>
                    </div>
                </div>
                <div class="jc-card jc-skeleton mp-skeleton-card">
                    <div class="jc-bd">
                        <div class="jc-hdr mp-skeleton-header">
                            <div class="skeleton-block mp-skeleton-title-block"></div>
                            <div class="skeleton-block mp-skeleton-meta-block"></div>
                        </div>
                        <div class="jc-body-text">
                            <div class="skeleton-block mp-skeleton-line"></div>
                            <div class="skeleton-block mp-skeleton-line"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        if (this.errorElement) this.errorElement.classList.add('is-hidden');
        if (this.commentsList) this.commentsList.classList.add('is-hidden');
    }

    /**
     * 显示错误提示与重试按钮
     */
    showError(msg) {
        if (this.loadingElement) this.loadingElement.classList.add('is-hidden');
        if (this.commentsList) this.commentsList.classList.add('is-hidden');
        if (this.errorElement) {
            this.errorElement.className = 'mp-comments-error';

            this.errorElement.innerHTML = `
                <div class="mp-error-card">
                    <p class="mp-error-title">${msg}</p>
                    <div class="mp-error-detail">
                        <span class="mp-error-detail-title">可能的原因：</span>
                        1. 目标网站（Jable/JAVLibrary）当前不可达或网络受限。<br>
                        2. 跨域网络请求未获得脚本管理器授权（请在 Tampermonkey 弹窗中选择“总是允许”）。<br>
                        3. 被 Cloudflare 防火墙人机挑战拦截。
                    </div>
                    <button class="tm-comment-retry-btn mp-error-retry-btn">重新采集</button>
                </div>
            `;
        }
    }

    /**
     * 用户点击重试重新载入评论
     */
    handleRetry(site) {
        console.log(`[CommentPanel] 用户触发重新加载评论数据... site: ${site || 'all'}`);

        if (site && this.sites[site]) {
            const targetSite = this.sites[site];
            targetSite.comments = [];
            targetSite.filteredComments = [];
            targetSite.currentPage = 1;
            targetSite.collectedPages = new Set();
            targetSite.hasMore = false;
            targetSite.status = 'loading';
            if (site === 'jable') CommentPanel.preloadCache.jableCommentsPromise = null;
            if (site === 'javlib') {
                CommentPanel.preloadCache.javlibVideoIdPromise = null;
                CommentPanel.preloadCache.javlibCommentsPromise = null;
                CommentPanel.preloadCache.javlibReviewsPromise = null;
                targetSite.videoId = '';
            }
            if (site === 'javdb') {
                CommentPanel.preloadCache.javdbMovieIdPromise = null;
                CommentPanel.preloadCache.javdbCommentsPromise = null;
                targetSite.movieId = '';
            }
            this.loadSiteComments(site, 1, true);
        } else {
            // 全量清除缓存并强制刷新
            CommentCacheManager.clear(this.videoCode);
            this.loadComments(1, true);
        }
    }

    /**
     * 触发加载更多指定数据源评论
     */
    triggerLoadMore(siteKey) {
        const site = this.sites[siteKey];
        if (!site || site.loading || !site.hasMore || site.collapsed) return;
        logger.log(`[CommentPanel] 触发加载更多 ${site.name} 评论...`);
        this.loadSiteComments(siteKey, site.currentPage + 1);
    }

    triggerLoadMoreJable() { return this.triggerLoadMore('jable'); }
    triggerLoadMoreJavlib() { return this.triggerLoadMore('javlib'); }
    triggerLoadMoreJavdb() { return this.triggerLoadMore('javdb'); }

    /**
     * 智能增量更新指定数据源的评论列表（杜绝已展开卡片被重新渲染折叠与滚动跳变）
     * @param {string} siteKey - 数据源键名
     * @returns {boolean} - 是否成功增量更新
     */
    patchSectionContent(siteKey) {
        const site = this.sites[siteKey];
        if (!site || !this.commentsList) return false;

        const sectionEl = this.commentsList.querySelector(`#tm-comment-section-${siteKey}`);
        if (!sectionEl) return false;

        const bodyEl = sectionEl.querySelector('.tm-comment-section-body');
        if (!bodyEl) return false;

        // 更新 Badge 状态文本
        const badgeEl = sectionEl.querySelector('.tm-comment-status-badge');
        if (badgeEl) {
            const badgeTextMap = {
                'loading': '采集中...',
                'unreachable': '不可达',
                'not_found': '未收录',
                'empty': '暂无评论',
                'cf_shield': '需验证',
                'mobile_unsupported': '移动端浏览器不支持',
                'loaded': `共 ${site.filteredComments.length}${site.hasMore ? '+' : ''} 条`
            };
            badgeEl.textContent = badgeTextMap[site.status] || '';
            badgeEl.className = `tm-comment-status-badge tm-status-badge-${site.status}`;
        }

        if (site.status === 'loaded') {
            const existingCards = bodyEl.querySelectorAll('.jc-card[data-id]');
            const existingIdSet = new Set();
            existingCards.forEach(card => {
                const id = card.getAttribute('data-id');
                if (id) existingIdSet.add(id);
            });

            // 检查新增的评论卡片
            const newComments = site.filteredComments.filter(c => !existingIdSet.has(c.id));
            if (existingCards.length > 0 && newComments.length > 0) {
                // 清理旧的 end-marker 与 loader
                const endMarker = bodyEl.querySelector('.tm-comment-end-marker');
                if (endMarker) endMarker.remove();
                const bottomLoader = bodyEl.querySelector('.tm-comment-bottom-loader');
                if (bottomLoader) bottomLoader.remove();

                // 增量追加新卡片
                const fragment = document.createDocumentFragment();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newComments.map(c => this.renderCommentCard(c, true)).join('');
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                bodyEl.appendChild(fragment);

                // 根据加载态追加状态指示器
                if (site.loading) {
                    const loader = document.createElement('div');
                    loader.className = 'tm-comment-bottom-loader tm-comment-loader-graphic';
                    loader.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
                    bodyEl.appendChild(loader);
                } else if (!site.hasMore) {
                    const endDiv = document.createElement('div');
                    endDiv.className = 'tm-comment-end-marker';
                    endDiv.textContent = '-end-';
                    bodyEl.appendChild(endDiv);
                }

                // 记录新渲染卡片 ID
                newComments.forEach(c => this.renderedCommentIds.add(c.id));
                setTimeout(() => this.updateFavoriteBadges(), 50);
                return true;
            } else if (existingCards.length > 0 && newComments.length === 0) {
                // 内容无新卡片，仅更新加载器与 end-marker 状态
                const existingBottomLoader = bodyEl.querySelector('.tm-comment-bottom-loader');
                if (!site.loading && existingBottomLoader) {
                    existingBottomLoader.remove();
                }
                if (!site.hasMore && !bodyEl.querySelector('.tm-comment-end-marker')) {
                    const endDiv = document.createElement('div');
                    endDiv.className = 'tm-comment-end-marker';
                    endDiv.textContent = '-end-';
                    bodyEl.appendChild(endDiv);
                }
                return true;
            }
        }

        return false;
    }

    renderSectionHtml(siteKey) {
        return renderCommentSectionHtml(siteKey, {
            sites: this.sites,
            playerCore: this.playerCore,
            javlibVerifyingStatus: this.javlibVerifyingStatus,
            jableFailedDomain: this.jableFailedDomain,
            javlibFailedDomain: this.javlibFailedDomain,
            renderedCommentIds: this.renderedCommentIds,
            expandedCommentIds: this.expandedCommentIds,
            renderLoginBadge: (loginSiteKey) => this.renderLoginBadgeHtml(loginSiteKey)
        });
    }

    /**
     * 显示底部分区加载指示器
     */
    showBottomLoader(site) {
        if (!this.commentsList) return;
        const body = this.commentsList.querySelector(`#tm-comment-section-${site} .tm-comment-section-body`);
        if (!body) return;

        if (body.querySelector('.tm-comment-bottom-loader')) return;

        const loader = document.createElement('div');
        loader.className = 'tm-comment-bottom-loader tm-comment-loader-graphic';
        loader.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        body.appendChild(loader);

        // 稍微向上滚动以确保加载器在视口内可见
        setTimeout(() => {
            if (body.scrollTop + body.clientHeight >= body.scrollHeight - 50) {
                body.scrollTop = body.scrollHeight - body.clientHeight;
            }
        }, 30);
    }

    /**
     * 隐藏底部分区加载指示器
     */
    hideBottomLoader(site) {
        if (!this.commentsList) return;
        const body = this.commentsList.querySelector(`#tm-comment-section-${site} .tm-comment-section-body`);
        const loader = body?.querySelector('.tm-comment-bottom-loader');
        if (loader) {
            loader.remove();
        }
    }

    updateCommentsCount() {
        this.totalCount = (this.jableTotalCount || 0) + (this.javlibTotalCount || 0) + (this.javdbTotalCount || 0);
        this.hasMore = (this.jableHasMore || false) || (this.javlibHasMore || false) || (this.javdbHasMore || false);
    }

    renderCommentCard(c, isNew = false) {
        return renderCommentCardHtml(c, {
            isNew,
            expandedCommentIds: this.expandedCommentIds,
            playerCore: this.playerCore
        });
    }

    renderCommentsList() {
        if (this.loadingElement) this.loadingElement.classList.add('is-hidden');
        if (this.errorElement) this.errorElement.classList.add('is-hidden');
        if (this.commentsList) this.commentsList.classList.remove('is-hidden');

        // 自动触发 JAVLibrary 校验监测
        if (this.javlibStatus === 'cf_shield' && !this.javlibAutoVerifyAttempted) {
            setTimeout(() => this.startJavlibBackgroundVerification(this.javlibFailedDomain), 50);
        }

        let importedCardHtml = "";
        if (typeof window !== "undefined" && window.__mp_imported_capsules && window.__mp_imported_capsules.capsules && window.__mp_imported_capsules.capsules.length > 0) {
            const imp = window.__mp_imported_capsules;
            importedCardHtml = `<div class="jc-card jc-imported-share-card"><div class="jc-imported-share-title-row"><span class="jc-imported-share-title">🌟 外部分享片段导入 (${imp.capsules.length} 条)</span><span class="jc-imported-share-speed">推荐倍速: ${imp.speed}x</span></div><div class="jc-imported-share-desc">检测到来自分享链接的高光片段，点击一键转存到当前视频时间轴：</div><button class="tm-import-deep-link-btn">一键导入全部高光到时间轴</button></div>`;
        }
        // 动态渲染三大数据源 Section HTML
        const sectionHtmlMap = {
            jable: this.renderSectionHtml('jable'),
            javdb: this.renderSectionHtml('javdb'),
            javlib: this.renderSectionHtml('javlib')
        };

        if (this.commentsList) {
            // 自动同步当前 DOM 中所有实际处于展开状态的评论 ID，杜绝刷新列表时折叠
            if (!this.expandedCommentIds) {
                this.expandedCommentIds = new Set();
            }
            const expandedEls = this.commentsList.querySelectorAll('.jc-card[data-id] .jc-body-text--collapsible[data-collapsed="false"]');
            expandedEls.forEach(el => {
                const card = el.closest('.jc-card');
                const cid = card ? card.getAttribute('data-id') : null;
                if (cid) this.expandedCommentIds.add(cid);
            });

            // 保存外层滚动容器与各 Section 体内部的滚动状态
            const listScrollTop = this.commentsList.scrollTop;
            const scrollPositions = {};
            const sectionBodies = this.commentsList.querySelectorAll('.tm-comment-section-body');
            sectionBodies.forEach(body => {
                const section = body.closest('.tm-comment-section');
                if (section && section.id) {
                    scrollPositions[section.id] = body.scrollTop;
                }
            });

            // 动态排序：有内容的靠前，无内容的靠后；同状态维持 [jable, javdb, javlib]
            const sections = [
                { key: 'jable', html: sectionHtmlMap.jable, hasContent: (this.filteredJableComments && this.filteredJableComments.length > 0) || this.jableStatus === 'loading' },
                { key: 'javdb', html: sectionHtmlMap.javdb, hasContent: (this.filteredJavdbComments && this.filteredJavdbComments.length > 0) || this.javdbStatus === 'loading' },
                { key: 'javlib', html: sectionHtmlMap.javlib, hasContent: (this.filteredJavlibComments && this.filteredJavlibComments.length > 0) || this.javlibStatus === 'loading' }
            ];
            sections.sort((a, b) => {
                if (a.hasContent && !b.hasContent) return -1;
                if (!a.hasContent && b.hasContent) return 1;
                return 0;
            });

            // 渲染 HTML
            this.commentsList.innerHTML = sections.map(s => s.html).join('');

            // 绑定登录 Badge 点击事件
            this.bindAllLoginBadgeEvents();

            // 还原各板块内部滚动高度与外层列表滚动高度
            const newSectionBodies = this.commentsList.querySelectorAll('.tm-comment-section-body');
            newSectionBodies.forEach(body => {
                const section = body.closest('.tm-comment-section');
                if (section && section.id && scrollPositions[section.id] !== undefined) {
                    body.scrollTop = scrollPositions[section.id];
                }
            });
            if (listScrollTop > 0) {
                this.commentsList.scrollTop = listScrollTop;
            }

            // 绑定去手动验证链接的点击事件
            const verifyLinks = this.commentsList.querySelectorAll('.tm-comments-verify-link');
            verifyLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (typeof GM_setValue === 'function') {
                        GM_setValue('javlib_verifying', true);
                        GM_setValue('javlib_verifying_start_time', Date.now());
                    }
                    this.startSignalListener();
                });
            });

            // 绑定验证重试按钮 (JAVLibrary)
            const verifyRetryBtn = this.commentsList.querySelector('.tm-comments-verify-retry-btn, .tm-comment-retry-btn');
            if (verifyRetryBtn) {
                verifyRetryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    logger.log('用户手动点击 JAVLibrary 重试，清除历史验证状态并重载...');
                    this.javlibAutoVerifyAttempted = false;
                    this.javlibCfShield = false;
                    this.javlibVerifyingStatus = '';
                    this.handleRetry('javlib');
                });
            }

            // 绑定验证重试按钮 (Jable)
            const jableVerifyRetryBtn = this.commentsList.querySelector('.tm-jable-verify-retry-btn');
            if (jableVerifyRetryBtn) {
                jableVerifyRetryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    logger.log('用户手动点击 Jable.tv 重试，清除历史验证状态并重载...');
                    this.jableStatus = 'loading';
                    this.handleRetry('jable');
                });
            }

            // 绑定验证重试按钮 (JavDB)
            const javdbVerifyRetryBtn = this.commentsList.querySelector('.tm-javdb-verify-retry-btn');
            if (javdbVerifyRetryBtn) {
                javdbVerifyRetryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    logger.log('用户手动点击 JavDB 重试...');
                    this.javdbStatus = 'loading';
                    this.loadJavdbComments(1);
                });
            }

            // 绑定复制日志按钮
            const copyLogsBtns = this.commentsList.querySelectorAll('.tm-comments-verify-copy-logs-btn');
            copyLogsBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isJavlibSection = btn.closest('#tm-comment-section-javlib') !== null;
                    const filterKeywords = isJavlibSection
                        ? ['javlib', 'c97k.com', 'CrossDomainBridge', 'iframe', 'shadow']
                        : ['jable', 'fs1.app'];

                    const siteName = isJavlibSection ? 'JAVLibrary' : 'Jable.tv';

                    if (logger.copyLogs(filterKeywords)) {
                        Toast(`${siteName} 调试日志已复制到剪贴板，请发送给开发者分析！`, 3000, 'success');
                    } else {
                        Toast('复制日志失败，请手动打开控制台查看。', 3000, 'error');
                    }
                });
            });

            // 绑定分区头部的点击事件以实现手风琴折叠/展开交替
            const jableHdr = this.commentsList.querySelector('#tm-comment-section-jable .tm-comment-section-hdr');
            if (jableHdr) {
                jableHdr.addEventListener('click', () => this.toggleSectionCollapse('jable'));
            }

            const javlibHdr = this.commentsList.querySelector('#tm-comment-section-javlib .tm-comment-section-hdr');
            if (javlibHdr) {
                javlibHdr.addEventListener('click', () => this.toggleSectionCollapse('javlib'));
            }

            const javdbHdr = this.commentsList.querySelector('#tm-comment-section-javdb .tm-comment-section-hdr');
            if (javdbHdr) {
                javdbHdr.addEventListener('click', () => this.toggleSectionCollapse('javdb'));
            }

            // 记录当前已渲染的评论ID，以便下一页追加时能够识别出新评论
            (this.filteredJableComments || []).forEach(c => this.renderedCommentIds.add(c.id));
            (this.filteredJavlibComments || []).forEach(c => this.renderedCommentIds.add(c.id));
            (this.filteredJavdbComments || []).forEach(c => this.renderedCommentIds.add(c.id));

            // 当分区没有被评论填满（没有出现滚动条）且仍有更多评论可加载时，自动触发加载下一页
            this.updateFavoriteBadges();
            setTimeout(() => this.checkViewportFill(), 150);
            setTimeout(() => this.updateFavoriteBadges(), 50);
        }
    }

    /**
     * 比对用户的片段标签列表 (tabs)，对评论区中误差在 ±5 秒范围内的时间胶囊主动高亮展示实心金星 (★) 与琥珀金底色
     */
    updateFavoriteBadges() {
        if (!this.commentsList) return;
        const tabs = this.getTabs();
        const timeLinks = this.commentsList.querySelectorAll('.jc-time-link');
        if (timeLinks.length === 0) return;

        timeLinks.forEach(link => {
            const secsAttr = link.getAttribute('data-secs');
            if (!secsAttr) return;

            let secs;
            try {
                secs = JSON.parse(secsAttr);
            } catch (_) {
                secs = parseFloat(secsAttr);
            }
            if (secs === null || secs === undefined || isNaN(Array.isArray(secs) ? secs[0] : secs)) return;

            const { isFavorited } = checkIsTimestampFavorited(secs, tabs, 5);
            const starBtn = link.querySelector('.jc-time-star-btn');

            if (isFavorited) {
                link.classList.add('is-favorited');
                if (starBtn) {
                    starBtn.title = '此时间已在片段列表中 (误差 ≤ 5s)';
                }
            } else {
                link.classList.remove('is-favorited');
                if (starBtn) {
                    starBtn.title = '收藏为高光片段并跳转播放';
                }
            }
        });
    }

    /**
     * 确保至少有一个可用的评论分区处于展开状态（杜绝全折叠死锁）
     */
    ensureAtLeastOneSectionExpanded() {
        const isAllCollapsed = !!this.jableCollapsed && !!this.javdbCollapsed && !!this.javlibCollapsed;
        if (!isAllCollapsed) return;

        // 首选有内容的板块，若均无或尚未加载，优先 Jable
        if (this.filteredJableComments && this.filteredJableComments.length > 0) {
            this.jableCollapsed = false;
        } else if (this.filteredJavdbComments && this.filteredJavdbComments.length > 0) {
            this.javdbCollapsed = false;
        } else if (this.filteredJavlibComments && this.filteredJavlibComments.length > 0) {
            this.javlibCollapsed = false;
        } else if (this.jableStatus !== 'unreachable' && this.jableStatus !== 'mobile_unsupported') {
            this.jableCollapsed = false;
        } else if (this.javdbStatus !== 'unreachable') {
            this.javdbCollapsed = false;
        } else {
            this.jableCollapsed = false;
        }

        try {
            localStorage.setItem('tm-comment-jable-collapsed', this.jableCollapsed ? 'true' : 'false');
            localStorage.setItem('tm-comment-javdb-collapsed', this.javdbCollapsed ? 'true' : 'false');
            localStorage.setItem('tm-comment-javlib-collapsed', this.javlibCollapsed ? 'true' : 'false');
        } catch (_) {}
    }

    /**
     * 切换分区的展开/折叠状态（手风琴互斥展开）
     * @param {'jable'|'javdb'|'javlib'} siteKey 
     */
    toggleSectionCollapse(siteKey) {
        const currentCollapsed = !!this[`${siteKey}Collapsed`];
        const nextCollapsed = !currentCollapsed;

        if (!nextCollapsed) {
            // 用户想要展开 siteKey：手风琴互斥展开当前源，折叠其他源
            ['jable', 'javdb', 'javlib'].forEach(k => {
                const shouldCollapse = (k !== siteKey);
                this[`${k}Collapsed`] = shouldCollapse;
                try {
                    localStorage.setItem(`tm-comment-${k}-collapsed`, shouldCollapse ? 'true' : 'false');
                } catch (_) {}
                const sec = this.commentsList?.querySelector(`#tm-comment-section-${k}`);
                if (sec) {
                    sec.classList.toggle('is-collapsed', shouldCollapse);
                }
            });

            // 触发按需懒加载
            if (siteKey === 'jable') {
                if (this.jableComments.length === 0 && this.jableStatus === 'loading' && !this.jableLoading) {
                    this.loadJableComments(1);
                } else {
                    this.triggerLoadMoreJable();
                }
            } else if (siteKey === 'javdb') {
                if (this.javdbComments.length === 0 && this.javdbStatus === 'loading' && !this.javdbLoading) {
                    this.loadJavdbComments(1);
                } else {
                    this.triggerLoadMoreJavdb();
                }
            } else if (siteKey === 'javlib') {
                if (this.javlibComments.length === 0 && this.javlibStatus === 'loading' && !this.javlibLoading) {
                    this.loadJavlibComments(1);
                } else {
                    this.triggerLoadMoreJavlib();
                }
            }
        } else {
            // 用户想要折叠当前已展开的源：允许折叠，直接添加 is-collapsed
            this[`${siteKey}Collapsed`] = true;
            try {
                localStorage.setItem(`tm-comment-${siteKey}-collapsed`, 'true');
            } catch (_) {}
            const sec = this.commentsList?.querySelector(`#tm-comment-section-${siteKey}`);
            if (sec) {
                sec.classList.add('is-collapsed');
            }
        }

        this.updateFavoriteBadges();
        setTimeout(() => this.checkViewportFill(), 100);
    }

    checkViewportFill() {
        if (!this.commentsList) return;
        requestAnimationFrame(() => {
            if (!this.commentsList) return;
            const container = this.commentsList;
            if (container.clientHeight < 100) return; // 容器尚未完成渲染或视口过小

            // 如果外层列表已经被内容填满（出现滚动条），无需自动预拉取下一页
            if (container.scrollHeight > container.clientHeight + 20) return;

            const activeSection = this.commentsList.querySelector('.tm-comment-section:not(.is-collapsed)');
            if (!activeSection) return;

            const sectionId = activeSection.id || '';
            if (sectionId === 'tm-comment-section-jable' && this.jableHasMore && !this.jableLoading) {
                logger.log('[CommentPanel] Jable section viewport not filled. Auto-loading next page...');
                this.triggerLoadMoreJable();
            } else if (sectionId === 'tm-comment-section-javlib' && this.javlibHasMore && !this.javlibLoading) {
                logger.log('[CommentPanel] JAVLibrary section viewport not filled. Auto-loading next page...');
                this.triggerLoadMoreJavlib();
            } else if (sectionId === 'tm-comment-section-javdb' && this.javdbHasMore && !this.javdbLoading) {
                logger.log('[CommentPanel] JavDB section viewport not filled. Auto-loading next page...');
                this.triggerLoadMoreJavdb();
            }
        });
    }
    /**
     * 根据站点 Key 获取匹配的 LoginProvider
     * @param {string} siteKey 
     * @returns {Object|null}
     */
    getLoginProviderForSite(siteKey) {
        const keyUpper = String(siteKey || '').toUpperCase();
        if (window.loginManager && window.loginManager.providers) {
            const p = window.loginManager.providers.find(p => p.siteKey && p.siteKey.toUpperCase() === keyUpper);
            if (p) return p;
        }
        if (!this._staticProviders) {
            this._staticProviders = {
                JABLE: new JableLoginProvider(),
                MISSAV: new MissavLoginProvider()
            };
        }
        return this._staticProviders[keyUpper] || null;
    }

    /**
     * 渲染指定站点的登录 Status Badge HTML
     * @param {string} siteKey 
     * @returns {string} 若不支持登录则返回空字符串，支持则返回对应状态标签
     */
    renderLoginBadgeHtml(siteKey) {
        const provider = this.getLoginProviderForSite(siteKey);
        return renderLoginBadgeHtmlHelper(siteKey, this.siteLoginStates, provider);
    }

    /**
     * 异步更新指定站点的登录状态
     * @param {string} siteKey 
     */
    async updateSiteLoginStatus(siteKey) {
        return this.composer.updateSiteLoginStatus(siteKey);
    }

    /**
     * 异步检查并更新所有支持登录的站点的登录状态
     * @param {boolean} [force=false] - 是否强制覆盖频控锁
     */
    updateAllSiteLoginStatuses(force = false) {
        return this.composer.updateAllSiteLoginStatuses(force);
    }

    /**
     * 仅更新 DOM 中对应站点的登录 Badge 节点
     * @param {string} siteKey 
     */
    updateLoginBadgeDOM(siteKey) {
        if (!this.commentsList) return;
        const section = this.commentsList.querySelector(`#tm-comment-section-${siteKey.toLowerCase()}`);
        if (!section) return;
        const badgeContainer = section.querySelector('.tm-comment-hdr-right');
        if (!badgeContainer) return;
        const loginBadge = badgeContainer.querySelector('.tm-comment-login-badge');
        const newBadgeHtml = this.renderLoginBadgeHtml(siteKey);
        if (!newBadgeHtml) return;

        if (loginBadge) {
            const temp = document.createElement('div');
            temp.innerHTML = newBadgeHtml;
            const newBadgeEl = temp.firstElementChild;
            loginBadge.replaceWith(newBadgeEl);
            this.bindLoginBadgeEvents(newBadgeEl);
        } else {
            const temp = document.createElement('div');
            temp.innerHTML = newBadgeHtml;
            const newBadgeEl = temp.firstElementChild;
            badgeContainer.insertBefore(newBadgeEl, badgeContainer.firstChild);
            this.bindLoginBadgeEvents(newBadgeEl);
        }
    }

    /**
     * 绑定单个登录 Badge 节点的点击事件
     * @param {HTMLElement} badgeEl 
     */
    bindLoginBadgeEvents(badgeEl) {
        if (!badgeEl || !badgeEl.classList.contains('is-not-logged-in')) return;
        badgeEl.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止展开/折叠 Header
            const siteKey = badgeEl.getAttribute('data-site') || 'JABLE';
            const provider = this.getLoginProviderForSite(siteKey);
            const domain = provider ? (provider.domains && provider.domains[0] ? `https://${provider.domains[0]}` : '') : '';
            this.showLoginModal(domain, () => {
                this.updateSiteLoginStatus(siteKey);
            });
        });
    }

    /**
     * 绑定页面中所有未登录 Badge 节点的点击事件
     */
    bindAllLoginBadgeEvents() {
        if (!this.commentsList) return;
        const loginBadges = this.commentsList.querySelectorAll('.tm-comment-login-badge.is-not-logged-in');
        loginBadges.forEach(badgeEl => {
            this.bindLoginBadgeEvents(badgeEl);
        });
    }

    async checkLoginStatus() {
        return this.composer.checkLoginStatus();
    }

    /**
     * 重定向到登录页面或触发登录界面
     */
    handleLoginRedirect() {
        try {
            if (window.loginManager) {
                const provider = window.loginManager.getMatchingProvider();
                if (provider && typeof provider.redirectLogin === 'function') {
                    provider.redirectLogin();
                    return;
                }
            }
            if (isSiteDomain('MISSAV')) {
                const loginButton = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
                if (loginButton) {
                    loginButton.click();
                    Toast('请在页面登录窗口中完成登录', 3000, 'info');
                } else {
                    if (typeof GM_openInTab === 'function') {
                        GM_openInTab(`https://${SITE_DOMAINS.MISSAV.primary}/cn/login`, { active: true, insert: true, setParent: true });
                    } else {
                        window.open(`https://${SITE_DOMAINS.MISSAV.primary}/cn/login`, '_blank');
                    }
                }
            } else if (isSiteDomain('JABLE')) {
                window.location.href = '/login/';
            } else {
                Toast('未检测到当前站点的登录入口', 2000, 'error');
            }
        } catch (e) {
            console.error('[CommentPanel] Login redirect error:', e);
        }
    }

    /**
    /**
     * 重新解析和渲染已有评论的时间戳（当视频真实时长加载完成后触发）
     */
    reprocessComments() {
        if (!this.targetVideo) return;
        const duration = this.targetVideo.duration;
        if (!duration || isNaN(duration)) return;

        logger.log(`[CommentPanel] 视频元数据已加载，时长: ${duration}s。重新解析所有评论...`);

        const reprocess = (comments) => {
            return comments.map(c => {
                const proc = processComment(c.text, this.videoCode, duration);
                return { ...c, ...proc };
            });
        };

        if (this.jableComments && this.jableComments.length > 0) {
            this.jableComments = reprocess(this.jableComments);
            CommentDebugCollector.collectComments(this.videoCode, this.jableComments, duration);
        }

        if (this.javlibComments && this.javlibComments.length > 0) {
            this.javlibComments = reprocess(this.javlibComments);
            CommentDebugCollector.collectComments(this.videoCode, this.javlibComments, duration);
        }

        if (this.javdbComments && this.javdbComments.length > 0) {
            this.javdbComments = reprocess(this.javdbComments);
            CommentDebugCollector.collectComments(this.videoCode, this.javdbComments, duration);
        }

        // 更新各站点缓存中的解析数据
        for (const sKey of Object.keys(this.sites)) {
            if (this.sites[sKey].comments.length > 0) {
                CommentCacheManager.saveSiteCache(this.videoCode, sKey, this.sites[sKey]);
                // 同步将真实总时长更新至 Supabase
                SupabaseService.uploadComments(this.videoCode, sKey, this.sites[sKey].comments, Math.round(duration));
            }
        }

        this.applyFilter();
        this.renderCommentsList();
    }

    cleanup() {
        if (this.commentsPanelResizeObserver && this.commentsPanel) {
            this.commentsPanelResizeObserver.unobserve(this.commentsPanel);
            this.commentsPanelResizeObserver = null;
        }
        if (this.targetVideo && this.handleMetadataLoadedBound) {
            this.targetVideo.removeEventListener('loadedmetadata', this.handleMetadataLoadedBound);
        }
        this.cleanupJavlibVerification();
        this.codePreview.cleanup();
        if (this._onTabsUpdatedBound) {
            window.removeEventListener('mp_tabs_updated', this._onTabsUpdatedBound);
            this._onTabsUpdatedBound = null;
        }
    }

    _showCommentReportModal(comment) {
        showCommentReportModal({ comment, videoCode: this.videoCode });
    }

    _mergeRemoteComments(remoteList) {
        if (!Array.isArray(remoteList) || remoteList.length === 0) return;
        const duration = this.playerCore?.targetVideo?.duration || 10800;

        for (const item of remoteList) {
            const sKey = (item.source_site || 'jable').toLowerCase();
            const targetSite = this.sites[sKey] || this.sites.jable;
            if (!targetSite) continue;

            const exists = targetSite.comments.some(c => String(c.id) === String(item.site_comment_id) || (c.text && c.text === item.content_raw));
            if (!exists) {
                const processed = processComment(item.content_raw, duration, item.published_at);
                processed.id = item.site_comment_id;
                processed.user = item.user_name;
                processed.userUrl = item.user_url;
                processed.time = item.published_at;
                processed.score = item.score;
                targetSite.comments.push(processed);
            }
        }
        this.applyFilter();
    }


    _mergeWebdavComments(commentList) {
        if (!Array.isArray(commentList) || commentList.length === 0) return;
        const duration = this.playerCore?.targetVideo?.duration || 10800;
        for (const item of commentList) {
            const sKey = (item.source || 'jable').toLowerCase();
            const targetSite = this.sites[sKey] || this.sites.jable;
            if (!targetSite) continue;

            const exists = targetSite.comments.some(c => String(c.id) === String(item.id) || (c.text && c.text === item.text));
            if (!exists) {
                const processed = processComment(item.text, duration, item.time);
                processed.id = item.id;
                processed.user = item.user;
                processed.time = item.time;
                targetSite.comments.push(processed);
            }
        }
        this.applyFilter();
    }

}
