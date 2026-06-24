import { __ } from '../../constants/i18n.js';
import { CLOSE_LINE, SEND, KEYBOARD } from '../../constants/icons.js';
import { Toast } from '../../utils/index.js';
import { isSiteDomain, SITE_DOMAINS, checkSiteReachability } from '../../constants/domains.js';
import { logger } from '../../utils/logger.js';
import { CrossDomainBridge } from '../../autologin/CrossDomainBridge.js';
import {
    getVideoCodeFromUrl,
    fetchJableComments,
    fetchJavLibraryVideoId,
    fetchJavLibraryData,
    processComment,
    formatSeconds,
    JAVLIB_DOMAINS,
    JABLE_DOMAINS
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
        javlibReviewsPromise: null
    };



    static preload(videoCode) {
        if (!videoCode) return;
        CommentPanel.preloadCache.videoCode = videoCode;

        logger.log(`[CommentPanel] 启动后台预加载，番号: ${videoCode}`);
        
        // 1. 预加载 Jable 评论
        let storedWorkingDomain = '';
        if (typeof GM_getValue === 'function') {
            try {
                storedWorkingDomain = GM_getValue('mp_jable_working_domain', '');
            } catch (e) {}
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

        // 2. 预加载 JAVLibrary ID
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

    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;
        this.targetVideo = playerCore.targetVideo;

        this.videoCode = '';
        this.comments = [];          // 所有采集的原始评论数据（向下兼容）
        this.filteredComments = [];  // 经过过滤后的评论数据（向下兼容）
        this.renderedCommentIds = new Set(); // 追踪已渲染的评论ID以实现新加载高亮
        this.totalCount = 0;         // 评论总数
        this.currentPage = 1;
        this.hasMore = false;
        this.filterSpam = true;      // 是否过滤灌水 (默认开启)
        this.isLoading = false;
        
        // === 分源状态 (loading|unreachable|not_found|empty|cf_shield|loaded) ===
        this.jableStatus = 'loading';   // Jable 采集状态
        this.javlibStatus = 'loading';  // JAVLibrary 采集状态

        // JAVLibrary 验证状态
        this.javlibVideoId = '';     // 缓存 JAVLibrary 的影片 ID
        this.javlibCfShield = false; // JAVLibrary Cloudflare 盾牌是否被触发
        this.javlibFailedDomain = '';
        this.javlibVerificationTab = null;      // 验证标签页句柄
        this.javlibVerifiedListenerId = null;   // 全局值监听器 ID
        this.javlibVerificationTimeout = null;  // 超时定时器
        this.javlibAutoVerifyAttempted = false; // 是否已尝试自动验证
        this.javlibVerifyingStatus = '';        // JAVLibrary 验证状态 ('verifying' | 'manual' | '')

        // Jable.tv properties
        this.jableComments = [];
        this.filteredJableComments = [];
        this.jableTotalCount = 0;
        this.jableHasMore = false;
        this.jableCurrentPage = 1;
        this.jableVideoExists = null;
        this.jableWorkingDomain = '';
        this.jableCollapsed = localStorage.getItem('tm-comment-jable-collapsed') === 'true';
        this.jableLoading = false;

        // JAVLibrary properties
        this.javlibComments = [];
        this.filteredJavlibComments = [];
        this.javlibTotalCount = 0;
        this.javlibHasMore = false;
        this.javlibCurrentPage = 1;
        this.javlibWorkingDomain = '';
        this.javlibCollapsed = localStorage.getItem('tm-comment-javlib-collapsed') === 'true';
        this.javlibLoading = false;

        // DOM 元素引用
        this.commentsPanel = null;
        this.commentsList = null;
        this.loadingElement = null;
        this.errorElement = null;
        this.countSpan = null;
        this.filterCheckbox = null;

        // 预加载可达性检测状态 (仅作提示参考，不阻断请求)
        this.jableUnreachable = false;
        this.javlibUnreachable = false;
        this.detectReachability();

        // 初始化事件委托
        this.initDelegatedEvents();
    }

    /**
     * 后台预检测 Jable 与 JAVLibrary 的网络可达性
     * 注意：检测结果仅作 UI 提示参考，不阻断实际请求（fetchXxx 有自己的域名轮询兜底）
     */
    async detectReachability() {
        try {
            const [jableOk, javlibOk] = await Promise.all([
                checkSiteReachability('JABLE'),
                checkSiteReachability('JAVLIBRARY')
            ]);
            
            this.jableUnreachable = !jableOk;
            this.javlibUnreachable = !javlibOk;
            
            console.log(`[CommentPanel] 网络预检测可达性（仅参考）：Jable.tv = ${jableOk ? '在线' : '离线/阻断'}, JAVLibrary = ${javlibOk ? '在线' : '离线/阻断'}`);
        } catch (e) {
            console.error('[CommentPanel] 可达性检测出错:', e);
        }
    }

    /**
     * 初始化全局事件委托，处理时间跳转与番号搜索
     */
    initDelegatedEvents() {
        if (!this.uiElements || !this.uiElements.playerContainer) return;

        this.uiElements.playerContainer.addEventListener('click', (e) => {
            const timeLink = e.target.closest('.jc-time-link');
            const codeLink = e.target.closest('.jc-code-link');
            const retryBtn = e.target.closest('.tm-comment-retry-btn');
            const toggleExpandBtn = e.target.closest('.jc-toggle-expand-btn');

            if (timeLink) {
                e.stopPropagation();
                const secsAttr = timeLink.getAttribute('data-secs');
                if (secsAttr) {
                    try {
                        const secs = JSON.parse(secsAttr);
                        this.handleTimeClick(secs);
                    } catch (err) {
                        const secs = parseFloat(secsAttr);
                        this.handleTimeClick(secs);
                    }
                }
            } else if (codeLink) {
                e.stopPropagation();
                const code = codeLink.getAttribute('data-code');
                if (code) {
                    this.handleCodeClick(code);
                }
            } else if (retryBtn) {
                e.stopPropagation();
                this.handleRetry();
            } else if (toggleExpandBtn) {
                e.stopPropagation();
                const collapsible = toggleExpandBtn.closest('.jc-body-text--collapsible');
                if (collapsible) {
                    const isCollapsed = collapsible.getAttribute('data-collapsed') === 'true';
                    collapsible.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
                    toggleExpandBtn.textContent = isCollapsed ? (__('commentsCollapse') || '收起') : (__('commentsExpand') || '展开');
                }
            } else {
                // 点击折叠评论的任意其他非交互位置也可以展开
                const collapsible = e.target.closest('.jc-body-text--collapsible');
                if (collapsible) {
                    const interactive = e.target.closest('.jc-time-link, .jc-code-link, a, button, input, label');
                    if (!interactive) {
                        const isCollapsed = collapsible.getAttribute('data-collapsed') === 'true';
                        if (isCollapsed) {
                            e.stopPropagation();
                            collapsible.setAttribute('data-collapsed', 'false');
                            const btn = collapsible.querySelector('.jc-toggle-expand-btn');
                            if (btn) {
                                btn.textContent = __('commentsCollapse') || '收起';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 处理评论中时间戳点击跳转，并自动恢复显示控制面板
     * @param {number|number[]} secs - 要跳转的秒数（或范围）
     */
    handleTimeClick(secs) {
        let targetSecs = secs;
        if (Array.isArray(secs)) {
            targetSecs = secs[0]; // 范围类型跳转到起点
        }
        if (this.targetVideo) {
            this.targetVideo.currentTime = targetSecs;
            this.targetVideo.play().catch(() => {});
            
            Toast(`已跳转至 ${formatSeconds(targetSecs)}`, 2000, 'info');
            
            // 点击时间戳时，恢复显示控制面板
            if (this.playerCore.uiManager) {
                this.playerCore.uiManager.showControls();
            }

            // 触发时间跳转的视觉提示
            if (this.controlManager && typeof this.controlManager.showJumpHint === 'function') {
                this.controlManager.showJumpHint(targetSecs);
            }
        }
    }

    async loadComments(page = 1) {
        if (!this.videoCode) return;
        this.isLoading = true;

        if (page === 1) {
            this.currentPage = 1;
            this.renderedCommentIds.clear(); // 刷新/首次加载时清空，防止第一页评论全部闪烁
            
            // 默认展开一个：如果两者都是展开状态，折叠 JAVLibrary
            if (!this.jableCollapsed && !this.javlibCollapsed) {
                this.javlibCollapsed = true;
            }

            // 并发触发两个源的加载 (仅在非折叠状态时触发)
            const promises = [];
            if (!this.jableCollapsed) {
                promises.push(this.loadJableComments(1));
            } else {
                this.jableStatus = 'loading';
            }
            if (!this.javlibCollapsed) {
                promises.push(this.loadJavlibComments(1));
            } else {
                this.javlibStatus = 'loading';
            }
            
            // 立即初始化渲染各分区的 Header 以及包含在内的加载动画
            this.renderCommentsList();
            
            if (promises.length > 0) {
                await Promise.allSettled(promises);
            }
        } else {
            // 加载更多
            const promises = [];
            if (this.jableHasMore && !this.jableCollapsed) {
                promises.push(this.loadJableComments(this.jableCurrentPage + 1));
            }
            if (this.javlibHasMore && !this.javlibCollapsed) {
                promises.push(this.loadJavlibComments(this.javlibCurrentPage + 1));
            }
            if (promises.length > 0) {
                await Promise.allSettled(promises);
                this.currentPage = Math.max(this.jableCurrentPage, this.javlibCurrentPage);
            }
        }

        this.isLoading = false;
    }

    async loadJableComments(page = 1) {
        if (!this.videoCode) return;
        this.jableLoading = true;
        if (page === 1) {
            this.jableStatus = 'loading';
            this.jableComments = [];
            this.filteredJableComments = [];
            this.jableTotalCount = 0;
            this.jableHasMore = false;
        } else {
            this.showBottomLoader('jable');
        }

        try {
            let jableResPromise;
            if (page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.jableCommentsPromise) {
                logger.log('[CommentPanel] 使用预加载的 Jable.tv 评论...');
                jableResPromise = CommentPanel.preloadCache.jableCommentsPromise;
            } else {
                let domainIndex = 0;
                let storedWorkingDomain = '';
                if (typeof GM_getValue === 'function') {
                    try {
                        storedWorkingDomain = GM_getValue('mp_jable_working_domain', '');
                    } catch (e) {}
                }
                const defaultDomain = this.jableWorkingDomain || storedWorkingDomain;
                if (defaultDomain) {
                    const idx = JABLE_DOMAINS.indexOf(defaultDomain);
                    if (idx !== -1) {
                        domainIndex = idx;
                    }
                }
                jableResPromise = fetchJableComments(this.videoCode, page, domainIndex);
            }

            const res = await jableResPromise;
            this.jableVideoExists = true;

            if (res.domain) {
                this.jableWorkingDomain = res.domain;
                if (typeof GM_setValue === 'function') {
                    try {
                        GM_setValue('mp_jable_working_domain', res.domain);
                    } catch (e) {}
                }
            }

            const duration = this.targetVideo ? this.targetVideo.duration : 10800;
            const processed = res.comments.map((c, idx) => {
                const proc = processComment(c.text, this.videoCode, duration);
                return {
                    ...c,
                    ...proc,
                    _timestamp: parseCommentDate(c.time),
                    _originalIndex: (page - 1) * 50 + idx
                };
            });

            if (page === 1) {
                this.jableComments = processed;
            } else {
                const existingIds = new Set(this.jableComments.map(c => c.id));
                const uniqueNew = processed.filter(c => !existingIds.has(c.id));
                this.jableComments = [...this.jableComments, ...uniqueNew];
            }

            // 按评论 ID 数值降序排序（最新评论在最前），确保分页加载时老评论始终在底部追加，绝不插入中部或顶部
            this.jableComments.sort((a, b) => {
                const idA = parseInt(a.id, 10) || 0;
                const idB = parseInt(b.id, 10) || 0;
                return idB - idA;
            });

            this.jableTotalCount = res.totalCount;
            this.jableHasMore = res.hasMore;
            this.jableStatus = this.jableComments.length === 0 ? 'empty' : 'loaded';
            this.jableCurrentPage = page;

        } catch (err) {
            logger.warn('[CommentPanel] 获取 Jable 评论失败:', err);
            if (page === 1) {
                if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
                    this.jableVideoExists = false;
                    this.jableStatus = 'not_found';
                } else if (err.message && (err.message.includes('人机验证') || err.message.includes('cf_shield') || err.message.includes('cf-challenge') || err.message.includes('Cloudflare') || err.message.includes('cloudflare'))) {
                    this.jableStatus = 'cf_shield';
                    this.jableFailedDomain = err.domain || this.jableWorkingDomain || JABLE_DOMAINS[0];
                } else {
                    this.jableStatus = 'unreachable';
                }
            } else {
                Toast(`加载更多评论失败: ${err.message || '网络连接出错'}`, 3000, 'error');
            }
        } finally {
            this.jableLoading = false;
            this.applyFilter();
            if (page === 1) {
                if (this.filteredJableComments.length === 0) {
                    this.jableCollapsed = true;
                    // 如果 Jable 没评论，但 Javlib 有评论，展开 Javlib
                    if (this.filteredJavlibComments.length > 0) {
                        this.javlibCollapsed = false;
                    }
                } else {
                    // Jable 有评论，强制 Jable 展开，Javlib 折叠
                    this.jableCollapsed = false;
                    this.javlibCollapsed = true;
                }
            }
            this.renderCommentsList();
            this.updateCommentsCount();
            this.hideBottomLoader('jable');
        }
    }

    async loadJavlibComments(page = 1) {
        if (!this.videoCode) return;
        this.javlibLoading = true;
        if (page === 1) {
            this.javlibStatus = 'loading';
            this.javlibComments = [];
            this.filteredJavlibComments = [];
            this.javlibTotalCount = 0;
            this.javlibHasMore = false;
            this.javlibCfShield = false;
            this.javlibFailedDomain = '';
        } else {
            this.showBottomLoader('javlib');
        }

        try {
            // =====================================================================
            //  影子通道优先策略：2 级降级
            //  Level 1: 检查现有影子通道（用户已开 JAVLib 标签页的 Broker）
            //  Level 2: 降级为 GM_xmlhttpRequest 直连
            // =====================================================================
            let isShadowActive = await CrossDomainBridge.checkShadowActive('JAVLIBRARY');

            // 通过影子通道获取数据
            if (isShadowActive) {
                logger.log('[CommentPanel] 检测到 JAVLibrary 影子通道在线，优先通过影子协同获取数据...');
                const shadowRes = await CrossDomainBridge.sendCommand('JAVLIBRARY', 'FETCH_JAVLIB_DATA', {
                    avcode: this.videoCode,
                    page: page
                });

                if (shadowRes) {
                    const { idResult, cRes, rRes } = shadowRes;
                    this.javlibVideoId = idResult.videoId;
                    this.javlibWorkingDomain = idResult.domain;
                    this.javlibVideoExists = true;

                    rRes.comments.forEach(c => { c.site = 'javlib-review'; });
                    const allComments = [...cRes.comments, ...rRes.comments];
                    const totalCount = cRes.totalCount + rRes.totalCount;
                    const hasMore = cRes.hasMore || rRes.hasMore;

                    const duration = this.targetVideo ? this.targetVideo.duration : 10800;
                    const processed = allComments.map((c, idx) => {
                        const proc = processComment(c.text, this.videoCode, duration);
                        return {
                            ...c,
                            ...proc,
                            _timestamp: parseCommentDate(c.time),
                            _originalIndex: (page - 1) * 50 + idx
                        };
                    });

                    if (page === 1) {
                        this.javlibComments = processed;
                    } else {
                        const existingIds = new Set(this.javlibComments.map(c => c.id));
                        const uniqueNew = processed.filter(c => !existingIds.has(c.id));
                        this.javlibComments = [...this.javlibComments, ...uniqueNew];
                    }

                    this.javlibTotalCount = totalCount;
                    this.javlibHasMore = hasMore;
                    this.javlibStatus = this.javlibComments.length === 0 ? 'empty' : 'loaded';
                    this.javlibCurrentPage = page;
                    return; // 影子抓取成功，直接返回
                }
                logger.log('[CommentPanel] JAVLibrary 影子通道同源抓取失败，降级为跨域直连抓取...');
            }

            let videoId = this.javlibVideoId;
            let workingDomain = this.javlibWorkingDomain;

            if (!videoId) {
                let idPromise;
                if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibVideoIdPromise) {
                    console.log('[CommentPanel] 使用预加载的 JAVLibrary ID...');
                    idPromise = CommentPanel.preloadCache.javlibVideoIdPromise;
                } else {
                    idPromise = fetchJavLibraryVideoId(this.videoCode);
                }

                const result = await idPromise;
                videoId = result.videoId;
                workingDomain = result.domain;
                this.javlibVideoId = videoId;
                this.javlibWorkingDomain = workingDomain;
            }

            const domain = workingDomain || JAVLIB_DOMAINS[0];
            const cPromise = page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibCommentsPromise
                ? CommentPanel.preloadCache.javlibCommentsPromise
                : fetchJavLibraryData(videoId, 'comments', page, domain);

            const rPromise = page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibReviewsPromise
                ? CommentPanel.preloadCache.javlibReviewsPromise
                : fetchJavLibraryData(videoId, 'reviews', page, domain);

            const [cRes, rRes] = await Promise.all([
                cPromise.catch(err => {
                    console.warn('[CommentPanel] 获取 JAVLibrary 评论失败:', err);
                    throw err;
                }),
                rPromise.catch(err => {
                    console.warn('[CommentPanel] 获取 JAVLibrary 文章失败:', err);
                    throw err;
                })
            ]);

            rRes.comments.forEach(c => { c.site = 'javlib-review'; });
            const allComments = [...cRes.comments, ...rRes.comments];
            const totalCount = cRes.totalCount + rRes.totalCount;
            const hasMore = cRes.hasMore || rRes.hasMore;

            const duration = this.targetVideo ? this.targetVideo.duration : 10800;
            const processed = allComments.map((c, idx) => {
                const proc = processComment(c.text, this.videoCode, duration);
                return {
                    ...c,
                    ...proc,
                    _timestamp: parseCommentDate(c.time),
                    _originalIndex: (page - 1) * 50 + idx
                };
            });

            if (page === 1) {
                this.javlibComments = processed;
            } else {
                const existingIds = new Set(this.javlibComments.map(c => c.id));
                const uniqueNew = processed.filter(c => !existingIds.has(c.id));
                this.javlibComments = [...this.javlibComments, ...uniqueNew];
            }

            this.javlibTotalCount = totalCount;
            this.javlibHasMore = hasMore;
            this.javlibStatus = this.javlibComments.length === 0 ? 'empty' : 'loaded';
            this.javlibCurrentPage = page;

        } catch (err) {
            this.handleJavlibError(err);
        } finally {
            this.javlibLoading = false;
            this.applyFilter();
            if (page === 1) {
                if (this.filteredJavlibComments.length === 0) {
                    this.javlibCollapsed = true;
                } else {
                    // Javlib 有评论。如果 Jable 此时没有评论，或者 Jable 被折叠了，我们展开 Javlib
                    if (this.filteredJableComments.length === 0 || this.jableCollapsed) {
                        this.javlibCollapsed = false;
                        this.jableCollapsed = true;
                    } else {
                        // 否则保持 Jable 展开，Javlib 折叠
                        this.javlibCollapsed = true;
                    }
                }
            }
            this.renderCommentsList();
            this.updateCommentsCount();
            this.hideBottomLoader('javlib');
        }
    }

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
     * 处理评论中番号点击，复制并跳转搜索
     * @param {string} code - 番号
     */
    handleCodeClick(code) {
        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                Toast(`番号已复制: ${code}`, 2000, 'success');
            }).catch(err => {
                console.error('Failed to copy code:', err);
                this.fallbackCopyText(code);
            });
        } else {
            this.fallbackCopyText(code);
        }
    }

    fallbackCopyText(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast(`番号已复制: ${text}`, 2000, 'success');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            Toast(`复制失败，请手动复制: ${text}`, 3000, 'warning');
        }
    }

    handleCopyAllComments() {
        const totalJable = this.jableComments ? this.jableComments.length : 0;
        const totalJavlib = this.javlibComments ? this.javlibComments.length : 0;

        if (totalJable === 0 && totalJavlib === 0) {
            Toast('暂无已加载的评论可复制', 2000, 'warning');
            return;
        }

        let lines = [];
        lines.push(`=== Miss Player Comments Copy (AVCode: ${this.videoCode || 'unknown'}) ===`);
        lines.push(`Exported At: ${new Date().toISOString()}`);
        lines.push(`Total Jable Comments: ${totalJable}`);
        lines.push(`Total JAVLibrary Comments: ${totalJavlib}`);
        lines.push('');

        lines.push('--- JABLE.TV COMMENTS ---');
        if (totalJable === 0) {
            lines.push('(No Jable comments loaded)');
        } else {
            this.jableComments.forEach((c, index) => {
                lines.push(`[Comment #${index + 1}]`);
                lines.push(`User: ${c.user}`);
                lines.push(`Time: ${c.time}`);
                lines.push(`Spam: ${c.spam.label}${c.spam.reason ? ` (Reason: ${c.spam.reason})` : ''}`);
                lines.push(`Content:`);
                lines.push(c.text);
                lines.push('--------------------');
            });
        }
        lines.push('');

        lines.push('--- JAVLIBRARY COMMENTS ---');
        if (totalJavlib === 0) {
            lines.push('(No JAVLibrary comments loaded)');
        } else {
            this.javlibComments.forEach((c, index) => {
                lines.push(`[Comment #${index + 1}]`);
                lines.push(`User: ${c.user}`);
                lines.push(`Time: ${c.time}`);
                lines.push(`Spam: ${c.spam.label}${c.spam.reason ? ` (Reason: ${c.spam.reason})` : ''}`);
                if (c.score) lines.push(`Score: ${c.score}`);
                lines.push(`Content:`);
                lines.push(c.text);
                lines.push('--------------------');
            });
        }

        const fullText = lines.join('\n');

        const doCopy = (text) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            } else {
                return new Promise((resolve, reject) => {
                    try {
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        const success = document.execCommand('copy');
                        document.body.removeChild(textarea);
                        if (success) resolve();
                        else reject(new Error('execCommand failed'));
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        };

        doCopy(fullText).then(() => {
            Toast('所有已加载的原始评论已复制到剪贴板！', 2000, 'success');
        }).catch(err => {
            console.error('Failed to copy all comments:', err);
            Toast('复制失败，请尝试在浏览器控制台手动复制', 3000, 'error');
        });
    }



    /**
     * 显示 Cloudflare 防火墙验证提示
     */
    showCloudflarePrompt(failedDomain) {
        const targetDomain = failedDomain || `https://${SITE_DOMAINS.JAVLIBRARY.primary}`;
        if (this.loadingElement) this.loadingElement.style.display = 'none';
        if (this.commentsList) this.commentsList.style.display = 'none';
        if (this.errorElement) {
            this.errorElement.style.display = 'flex';
            this.errorElement.style.flexDirection = 'column';
            this.errorElement.style.alignItems = 'center';
            this.errorElement.style.justifyContent = 'center';
            this.errorElement.style.gap = '8px';
            this.errorElement.innerHTML = `
                <div style="text-align: center; padding: 12px; font-size: 13px; color: hsl(var(--shadcn-destructive));">
                    <p style="margin: 0 0 6px 0; font-weight: 600;">触发 JAVLibrary 防火墙验证</p>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">需要您先去 JAVLibrary 完成人机验证以获得授权Cookie。</p>
                    <a href="${targetDomain}/cn/" target="_blank" class="tm-comments-verify-link" style="display: inline-block; padding: 6px 16px; font-size: 11px; background-color: hsl(var(--shadcn-blue)); color: white; border-radius: 14px; text-decoration: none; font-weight: 600; box-shadow: 0 2px 6px hsla(var(--shadcn-blue)/0.3); transition: all 0.2s;">去验证 (验证后返回重试)</a>
                    <button class="tm-comment-retry-btn" style="display: block; margin: 10px auto 0 auto; padding: 4px 12px; font-size: 10px; background-color: hsla(var(--shadcn-muted) / 0.1); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 4px; cursor: pointer; transition: all 0.2s;">我已验证，点击重试</button>
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
        this.javlibCfShield = false;
        this.javlibVerifyingStatus = '';
        
        // 验证成功后，清除所有被 Rejected 失败缓存的 ID/评论 Promises，强制下一次 loadComments 时重新请求
        CommentPanel.preloadCache.javlibVideoIdPromise = null;
        CommentPanel.preloadCache.javlibCommentsPromise = null;
        CommentPanel.preloadCache.javlibReviewsPromise = null;
        
        // 自动重载评论
        this.handleRetry();
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
        if (this.filterSpam) {
            this.filteredJableComments = this.jableComments.filter(c => c.spam.label !== 'SPAM');
            this.filteredJavlibComments = this.javlibComments.filter(c => c.spam.label !== 'SPAM');
        } else {
            this.filteredJableComments = this.jableComments;
            this.filteredJavlibComments = this.javlibComments;
        }
        // 向下兼容：维护合并列表
        this.filteredComments = [...this.filteredJableComments, ...this.filteredJavlibComments];
        this.comments = [...this.jableComments, ...this.javlibComments];
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
            <div class="tm-comment-loading tm-comments-panel-loading" style="display: none;"></div>
            <div class="tm-comment-error tm-comments-panel-error" style="display: none;"></div>
            <button class="tm-comments-panel-publish-btn">发表</button>
            <div class="tm-comments-panel-action-bar">
                <div class="tm-action-bar-left">
                    <span class="tm-comment-count">共 0 条评论</span>
                    <button class="tm-comment-copy-all-btn" title="一键复制所有加载的原始评论">${__('commentsCopyAll')}</button>
                </div>
                <div class="tm-action-bar-right">
                    <label class="tm-comment-filter-label">
                        <input type="checkbox" class="tm-comment-filter-checkbox" ${this.filterSpam ? 'checked' : ''} />
                        <span>${__('commentsFilterSpam')}</span>
                    </label>
                </div>
            </div>
            <button class="tm-show-controls-float-btn" title="显示控制面板">${KEYBOARD}</button>
        `;

        this.commentsList = this.commentsPanel.querySelector('.tm-comments-list');
        this.loadingElement = this.commentsPanel.querySelector('.tm-comment-loading');
        this.errorElement = this.commentsPanel.querySelector('.tm-comment-error');
        this.countSpan = this.commentsPanel.querySelector('.tm-comment-count');
        this.filterCheckbox = this.commentsPanel.querySelector('.tm-comment-filter-checkbox');

        // 绑定过滤器事件
        if (this.filterCheckbox) {
            this.filterCheckbox.addEventListener('change', (e) => {
                this.filterSpam = e.target.checked;
                this.applyFilter();
                this.renderCommentsList();
            });
        }

        // 绑定发表按钮事件
        const publishBtn = this.commentsPanel.querySelector('.tm-comments-panel-publish-btn');
        if (publishBtn) {
            publishBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePublishComment();
            });
        }

        // 绑定显示控制面板的浮动键盘按钮事件
        const showControlsBtn = this.commentsPanel.querySelector('.tm-show-controls-float-btn');
        if (showControlsBtn) {
            showControlsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.playerCore.uiManager) {
                    this.playerCore.uiManager.showControls();
                    this.playerCore.uiManager.autoHideControls();
                }
            });
        }

        // 绑定复制按钮事件
        const copyBtn = this.commentsPanel.querySelector('.tm-comment-copy-all-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCopyAllComments();
            });
        }

        // 绑定滑动/滚轮隐藏控制面板事件 (仅在控制面板显示时生效)
        const hideControlsOnScroll = () => {
            if (this.playerCore.uiManager && this.playerCore.uiManager.controlsVisible) {
                // 大屏设备/悬浮窗模式下（iPad 竖屏及 PC 横屏），评论区与控制面板共存，滚动时不隐藏控制栏
                if (this.playerCore.uiManager.isFloatingControlPanel) {
                    return;
                }
                this.playerCore.uiManager.hideControls(true);
            }
        };
        this.commentsList.addEventListener('touchmove', hideControlsOnScroll, { passive: true });
        
        // 滚轮滚动事件：隐藏控制栏，并在顶部向上滚动时重新计算对齐评论区顶部位置
        this.commentsList.addEventListener('wheel', (e) => {
            hideControlsOnScroll();
            
            // 向上滚动且处于列表顶部时，重新对齐评论区位置（防止用户调大视频画面后遮挡评论）
            const scrollTarget = e.target.closest('.tm-comment-section-body');
            const isAtTop = !scrollTarget || scrollTarget.scrollTop <= 5;
            if (e.deltaY < 0 && isAtTop) {
                this.updatePosition();
            }
        }, { passive: true });

        // 当用户显示区域内剩余未浏览评论不足时自动采集更多评论 (抓取 scroll 事件捕获 phase，并加入 requestAnimationFrame 节流)
        let isCheckingScroll = false;
        this.commentsList.addEventListener('scroll', (e) => {
            const scrollTarget = e.target;
            if (!scrollTarget || !scrollTarget.classList.contains('tm-comment-section-body')) return;

            if (isCheckingScroll) return;
            isCheckingScroll = true;

            requestAnimationFrame(() => {
                isCheckingScroll = false;
                const section = scrollTarget.closest('.tm-comment-section');
                if (section) {
                    const isJable = section.id === 'tm-comment-section-jable';
                    if (scrollTarget.scrollHeight - scrollTarget.scrollTop - scrollTarget.clientHeight < 350) {
                        if (isJable) {
                            this.triggerLoadMoreJable();
                        } else {
                            this.triggerLoadMoreJavlib();
                        }
                    }
                }
            });
        }, { capture: true, passive: true });

        let startY = 0;
        this.commentsList.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        this.commentsList.addEventListener('touchmove', (e) => {
            const endY = e.touches[0].clientY;
            const diffY = startY - endY;
            
            const scrollTarget = e.target.closest('.tm-comment-section-body');
            const isAtBottom = scrollTarget ? (scrollTarget.scrollHeight - scrollTarget.scrollTop - scrollTarget.clientHeight < 350) : false;
            const isAtTop = scrollTarget ? (scrollTarget.scrollTop <= 5) : true;
            
            // 向上滑动触底加载更多 (阈值设置为 350px 缓冲区，分源触发)
            if (diffY > 15 && isAtBottom && scrollTarget) {
                const isJable = scrollTarget.closest('#tm-comment-section-jable') !== null;
                if (isJable) {
                    this.triggerLoadMoreJable();
                } else {
                    this.triggerLoadMoreJavlib();
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
            const interactive = e.target.closest('a, button, input, label, .jc-time-link, .jc-code-link, .jc-toggle-expand-btn, .tm-comment-retry-btn');
            if (interactive) {
                // 如果是可交互元素，允许其正常进行相应的事件处理
                return;
            }
            
            e.stopPropagation();
            
            if (this.playerCore.uiManager) {
                // 大屏设备/悬浮窗模式下（iPad 竖屏及 PC 横屏），评论区与控制面板共存，点击空白使评论区变亮
                if (this.playerCore.uiManager.isFloatingControlPanel) {
                    this.commentsPanel.classList.remove('is-dimmed');
                    return;
                }
                
                // 手机端：如果控制面板已显示，点击空白处将其隐藏；但不允许点击空白处再次拉起/弹起控制面板
                if (this.playerCore.uiManager.controlsVisible) {
                    this.playerCore.uiManager.hideControls(true);
                }
            }
        });

        // 触碰与点击拦截处理器：处理不同终端的激活与误触隐藏逻辑
        const handleCommentTouchStart = (e) => {
            if (!this.playerCore.uiManager) return;
            
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
                this.playerCore.uiManager.showControls();
                this.playerCore.uiManager.autoHideControls();
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // 只要评论区是变暗状态，任何触摸或点击都应立即激活它并移除 is-dimmed
            if (this.commentsPanel.classList.contains('is-dimmed')) {
                this.commentsPanel.classList.remove('is-dimmed');
                if (e.cancelable) e.preventDefault();
                e.stopPropagation(); // 阻止事件传给视频区
                return;
            }
            
            const isFloating = this.playerCore.uiManager.isFloatingControlPanel;
            const controlsVisible = this.playerCore.uiManager.controlsVisible;
            
            if (isFloating) {
                // 大屏端 (PC/iPad)：任何对评论区的点击或触屏，都会使评论区重新变亮 (移除 is-dimmed)
                this.commentsPanel.classList.remove('is-dimmed');
            } else if (controlsVisible) {
                // 手机端：若控制面板已显示，用户点击/触摸评论区（排除时间戳链接）时，立即隐藏控制面板以防止误触
                if (!e.target.closest('.jc-time-link')) {
                    this.playerCore.uiManager.hideControls(true);
                }
            }
        };
        this.commentsPanel.addEventListener('touchstart', handleCommentTouchStart, { passive: false });
        this.commentsPanel.addEventListener('mousedown', handleCommentTouchStart, { passive: false });

        // PC端专用：鼠标移入评论区 -> 评论区变亮；移出评论区 -> 评论区重新变暗以突出显示控制栏
        this.commentsPanel.addEventListener('mouseenter', () => {
            if (this.playerCore.uiManager && this.playerCore.uiManager.isFloatingControlPanel) {
                this.commentsPanel.classList.remove('is-dimmed');
            }
        });
        this.commentsPanel.addEventListener('mouseleave', () => {
            if (this.playerCore.uiManager && 
                this.playerCore.uiManager.isFloatingControlPanel && 
                this.playerCore.uiManager.controlsVisible) {
                this.commentsPanel.classList.add('is-dimmed');
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
        const modal = document.createElement('div');
        modal.className = 'tm-custom-modal-overlay';
        modal.innerHTML = `
            <div class="tm-custom-modal-content">
                <div class="tm-custom-modal-title">提示</div>
                <div class="tm-custom-modal-message">评论功能开发中</div>
                <button class="tm-custom-modal-close-btn">确定</button>
            </div>
        `;
        document.body.appendChild(modal);

        // 触发过渡动画
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        const closeBtn = modal.querySelector('.tm-custom-modal-close-btn');
        const closeModal = () => {
            modal.classList.remove('active');
            modal.addEventListener('transitionend', () => {
                modal.remove();
            }, { once: true });
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    async handlePublishComment() {
        if (!this.videoCode) {
            Toast('无法获取影片番号，无法发表评论', 2000, 'error');
            return;
        }

        const domain = this.jableWorkingDomain || JABLE_DOMAINS[0];
        const targetUrl = `${domain}/videos/${this.videoCode.toLowerCase().trim()}/`;

        // 显示加载提示
        const publishBtn = this.commentsPanel.querySelector('.tm-comments-panel-publish-btn');
        const originalText = publishBtn ? publishBtn.textContent : '发表';
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.textContent = '检测中...';
            publishBtn.style.opacity = '0.7';
        }

        const resetBtn = () => {
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = originalText;
                publishBtn.style.opacity = '1';
            }
        };

        logger.log(`[CommentPanel] 正在检测 Jable 页面与登录态: ${targetUrl}`);

        let completed = false;
        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                resetBtn();
                if (req && typeof req.abort === 'function') {
                    try { req.abort(); } catch (e) {}
                }
                logger.error('[CommentPanel] 检测 Jable 页面超时');
                Toast('网络请求超时，请稍后重试', 2000, 'error');
            }
        }, 6000);

        const req = GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            timeout: 6000,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'referer': domain,
                'User-Agent': navigator.userAgent
            },
            onload: (response) => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resetBtn();
                if (response.status === 404) {
                    this.jableVideoExists = false;
                    this.showTipModal('提示', '该影片在 Jable.tv 上未发布，无法发表评论。');
                    return;
                }
                
                if (response.status >= 200 && response.status < 300) {
                    this.jableVideoExists = true;
                    const html = response.responseText;
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    
                    // 查找评论表单
                    const commentForm = Array.from(doc.querySelectorAll('form')).find(form => 
                        form.querySelector('input[name="action"][value="add_comment"]') ||
                        form.querySelector('input[name="action"][value="add_comment_video"]')
                    ) || doc.querySelector('form[id*="comment"]') || doc.querySelector('form[action*="comment"]');
                    
                    if (!commentForm) {
                        this.showLoginPromptModal(domain);
                    } else {
                        this.showCommentInputModal(commentForm, targetUrl, domain);
                    }
                } else {
                    Toast(`检测失败: HTTP ${response.status}`, 2000, 'error');
                }
            },
            onerror: (err) => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resetBtn();
                logger.error('[CommentPanel] 检测 Jable 失败:', err);
                Toast('网络请求失败，请稍后重试', 2000, 'error');
            },
            ontimeout: () => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resetBtn();
                logger.error('[CommentPanel] 检测 Jable 超时');
                Toast('网络请求超时，请稍后重试', 2000, 'error');
            }
        });
    }

    showTipModal(title, message) {
        const modal = document.createElement('div');
        modal.className = 'tm-custom-modal-overlay';
        modal.innerHTML = `
            <div class="tm-custom-modal-content">
                <div class="tm-custom-modal-title">${title}</div>
                <div class="tm-custom-modal-message">${message}</div>
                <button class="tm-custom-modal-close-btn">确定</button>
            </div>
        `;
        document.body.appendChild(modal);

        requestAnimationFrame(() => modal.classList.add('active'));

        const close = () => {
            modal.classList.remove('active');
            modal.addEventListener('transitionend', () => modal.remove(), { once: true });
        };
        modal.querySelector('.tm-custom-modal-close-btn').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }

    showLoginPromptModal(domain) {
        const modal = document.createElement('div');
        modal.className = 'tm-custom-modal-overlay';
        modal.innerHTML = `
            <div class="tm-custom-modal-content" style="max-width: 280px; width: 85%;">
                <div class="tm-custom-modal-title">发表评论</div>
                <div class="tm-custom-modal-message">需要有 Jable 登录态才能发表评论，请先登录。</div>
                <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">
                    <button class="tm-custom-modal-cancel-btn" style="background-color: hsla(var(--shadcn-muted)/0.2); color: hsl(var(--shadcn-foreground)); border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: background-color 0.2s;">取消</button>
                    <button class="tm-custom-modal-login-btn" style="background-color: hsl(var(--shadcn-blue)); color: #ffffff; border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; box-shadow: 0 4px 10px hsla(var(--shadcn-blue) / 0.3); transition: background-color 0.2s;">去登录</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        requestAnimationFrame(() => modal.classList.add('active'));

        const close = () => {
            modal.classList.remove('active');
            modal.addEventListener('transitionend', () => modal.remove(), { once: true });
        };

        modal.querySelector('.tm-custom-modal-cancel-btn').addEventListener('click', close);
        
        const loginBtn = modal.querySelector('.tm-custom-modal-login-btn');
        loginBtn.addEventListener('click', () => {
            close();
            this.showLoginModal(domain);
        });

        // Hover effects
        const cancelBtn = modal.querySelector('.tm-custom-modal-cancel-btn');
        cancelBtn.addEventListener('mouseenter', () => cancelBtn.style.backgroundColor = 'hsla(var(--shadcn-muted)/0.3)');
        cancelBtn.addEventListener('mouseleave', () => cancelBtn.style.backgroundColor = 'hsla(var(--shadcn-muted)/0.2)');
        
        loginBtn.addEventListener('mouseenter', () => loginBtn.style.backgroundColor = 'hsl(var(--shadcn-blue)/0.9)');
        loginBtn.addEventListener('mouseleave', () => loginBtn.style.backgroundColor = 'hsl(var(--shadcn-blue))');

        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }

    showLoginModal(domain) {
        const modal = document.createElement('div');
        modal.className = 'tm-custom-modal-overlay';
        modal.innerHTML = `
            <div class="tm-custom-modal-content" style="max-width: 300px; width: 85%; box-sizing: border-box; padding: 20px;">
                <div class="tm-custom-modal-title" style="margin-bottom: 15px;">登录 Jable.tv</div>
                <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; text-align: left; box-sizing: border-box;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">用户名 / 邮箱</label>
                        <input type="text" class="tm-login-username" placeholder="请输入用户名或邮箱" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid hsla(var(--shadcn-border) / 0.3); background-color: hsla(var(--shadcn-muted) / 0.1); color: hsl(var(--shadcn-foreground)); font-size: 13px; outline: none; box-sizing: border-box;" />
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">密码</label>
                        <input type="password" class="tm-login-password" placeholder="请输入密码" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid hsla(var(--shadcn-border) / 0.3); background-color: hsla(var(--shadcn-muted) / 0.1); color: hsl(var(--shadcn-foreground)); font-size: 13px; outline: none; box-sizing: border-box;" />
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                        <input type="checkbox" id="tm-login-remember" checked style="cursor: pointer;" />
                        <label for="tm-login-remember" style="font-size: 12px; color: hsl(var(--shadcn-muted-foreground)); cursor: pointer; user-select: none;">记住密码并开启自动登录</label>
                    </div>
                </div>
                <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%; margin-top: 20px;">
                    <button class="tm-custom-modal-cancel-btn" style="background-color: hsla(var(--shadcn-muted)/0.2); color: hsl(var(--shadcn-foreground)); border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: background-color 0.2s;">取消</button>
                    <button class="tm-custom-modal-submit-btn" style="background-color: hsl(var(--shadcn-blue)); color: #ffffff; border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; box-shadow: 0 4px 10px hsla(var(--shadcn-blue) / 0.3); transition: background-color 0.2s;">登录</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        requestAnimationFrame(() => modal.classList.add('active'));

        const close = () => {
            modal.classList.remove('active');
            modal.addEventListener('transitionend', () => modal.remove(), { once: true });
        };

        const cancelBtn = modal.querySelector('.tm-custom-modal-cancel-btn');
        cancelBtn.addEventListener('click', close);
        cancelBtn.addEventListener('mouseenter', () => cancelBtn.style.backgroundColor = 'hsla(var(--shadcn-muted)/0.3)');
        cancelBtn.addEventListener('mouseleave', () => cancelBtn.style.backgroundColor = 'hsla(var(--shadcn-muted)/0.2)');

        const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');
        submitBtn.addEventListener('mouseenter', () => submitBtn.style.backgroundColor = 'hsl(var(--shadcn-blue)/0.9)');
        submitBtn.addEventListener('mouseleave', () => submitBtn.style.backgroundColor = 'hsl(var(--shadcn-blue))');

        // Autofill if credentials already exist
        const usernameInput = modal.querySelector('.tm-login-username');
        const passwordInput = modal.querySelector('.tm-login-password');
        if (window.loginManager) {
            usernameInput.value = window.loginManager.userEmail || '';
            passwordInput.value = window.loginManager.userPassword || '';
        }

        submitBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const remember = modal.querySelector('#tm-login-remember').checked;

            if (!username || !password) {
                Toast('用户名和密码不能为空', 2000, 'warning');
                return;
            }

            usernameInput.disabled = true;
            passwordInput.disabled = true;
            submitBtn.disabled = true;
            submitBtn.textContent = '登录中...';
            cancelBtn.disabled = true;

            try {
                // Find matching provider (Jable)
                let provider = null;
                if (window.loginManager) {
                    provider = window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));
                }

                const loginSuccess = provider 
                    ? await provider.login(username, password, domain) 
                    : false;

                if (loginSuccess) {
                    // Save credentials globally if remember checkbox is checked
                    if (window.loginManager) {
                        window.loginManager.handleLoginInfoChange({
                            email: username,
                            password: password,
                            autoLogin: remember
                        });
                    }
                    close();
                    // Successfully logged in, retry comment detection/posting trigger
                    setTimeout(() => {
                        this.handlePublishComment();
                    }, 500);
                } else {
                    // Enable fields to retry
                    usernameInput.disabled = false;
                    passwordInput.disabled = false;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '登录';
                    cancelBtn.disabled = false;
                }
            } catch (err) {
                console.error('[CommentPanel] 弹窗登录失败:', err);
                Toast('登录失败，请重试', 2000, 'error');
                usernameInput.disabled = false;
                passwordInput.disabled = false;
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
                cancelBtn.disabled = false;
            }
        });

        // Add Enter key listener
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitBtn.click();
            }
        });

        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }

    showCommentInputModal(commentForm, targetUrl, domain) {
        const modal = document.createElement('div');
        modal.className = 'tm-custom-modal-overlay';
        modal.innerHTML = `
            <div class="tm-custom-modal-content" style="max-width: 320px; width: 90%;">
                <div class="tm-custom-modal-title">发表评论</div>
                <textarea class="tm-comment-input-textarea" placeholder="写下你的精彩评论..." style="width: 100%; height: 90px; margin: 12px 0; padding: 10px; border-radius: 8px; border: 1px solid hsla(var(--shadcn-border) / 0.3); background-color: hsla(var(--shadcn-muted) / 0.1); color: hsl(var(--shadcn-foreground)); font-size: 13px; resize: none; box-sizing: border-box; outline: none; transition: border-color 0.2s;" maxlength="1000"></textarea>
                <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">
                    <button class="tm-custom-modal-cancel-btn" style="background-color: hsla(var(--shadcn-muted)/0.2); color: hsl(var(--shadcn-foreground)); border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: background-color 0.2s;">取消</button>
                    <button class="tm-custom-modal-submit-btn" style="background-color: hsl(var(--shadcn-blue)); color: #ffffff; border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; box-shadow: 0 4px 10px hsla(var(--shadcn-blue) / 0.3); transition: background-color 0.2s;">提交</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        requestAnimationFrame(() => modal.classList.add('active'));

        const textarea = modal.querySelector('.tm-comment-input-textarea');
        textarea.focus();

        const close = () => {
            modal.classList.remove('active');
            modal.addEventListener('transitionend', () => modal.remove(), { once: true });
        };

        const cancelBtn = modal.querySelector('.tm-custom-modal-cancel-btn');
        cancelBtn.addEventListener('click', close);
        cancelBtn.addEventListener('mouseenter', () => cancelBtn.style.backgroundColor = 'hsla(var(--shadcn-muted)/0.3)');
        cancelBtn.addEventListener('mouseleave', () => cancelBtn.style.backgroundColor = 'hsla(var(--shadcn-muted)/0.2)');

        const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');
        submitBtn.addEventListener('mouseenter', () => submitBtn.style.backgroundColor = 'hsl(var(--shadcn-blue)/0.9)');
        submitBtn.addEventListener('mouseleave', () => submitBtn.style.backgroundColor = 'hsl(var(--shadcn-blue))');

        submitBtn.addEventListener('click', () => {
            const commentText = textarea.value.trim();
            if (!commentText) {
                Toast('评论内容不能为空', 2000, 'warning');
                return;
            }
            if (commentText.length < 3) {
                Toast('评论内容太少，至少输入3个字', 2000, 'warning');
                return;
            }

            textarea.disabled = true;
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            cancelBtn.disabled = true;

            const provider = window.loginManager && window.loginManager.providers.find(p => p.domains.some(d => domain.includes(d)));

            (async () => {
                try {
                    let success = false;
                    if (provider && typeof provider.publishComment === 'function') {
                        success = await provider.publishComment(commentText, { videoCode: this.videoCode, commentForm, targetUrl, domain });
                    } else {
                        success = await new Promise((resolve) => {
                            const bodyParams = new URLSearchParams();
                            commentForm.querySelectorAll('input').forEach(input => {
                                if (input.name && input.type !== 'submit') {
                                    bodyParams.append(input.name, input.value);
                                }
                            });

                            const formTextarea = commentForm.querySelector('textarea');
                            const textareaName = formTextarea ? formTextarea.name : 'comment';
                            bodyParams.append(textareaName, commentText);

                            let actionUrl = commentForm.getAttribute('action') || '';
                            if (actionUrl.startsWith('/')) {
                                actionUrl = `${domain}${actionUrl}`;
                            } else if (!actionUrl.startsWith('http')) {
                                actionUrl = targetUrl;
                            }

                            logger.log(`[CommentPanel] 正在向 Jable 提交评论: ${actionUrl}`);

                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: actionUrl,
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'referer': targetUrl,
                                    'origin': domain,
                                    'User-Agent': navigator.userAgent
                                },
                                data: bodyParams.toString(),
                                withCredentials: true,
                                onload: (res) => {
                                    if (res.status === 200 || res.status === 302) {
                                        const resHtml = res.responseText || '';
                                        if (resHtml.includes('error-field') || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
                                            const docErr = new DOMParser().parseFromString(resHtml, 'text/html');
                                            const errEl = docErr.querySelector('.error') || docErr.querySelector('.err') || docErr.querySelector('.message-error');
                                            const errMsg = errEl ? errEl.textContent.trim() : '评论提交失败，可能包含敏感词或触发了频率限制。';
                                            Toast(errMsg, 3000, 'error');
                                            resolve(false);
                                        } else {
                                            Toast('评论发表成功！', 2000, 'success');
                                            resolve(true);
                                        }
                                    } else {
                                        Toast(`提交失败: HTTP ${res.status}`, 2000, 'error');
                                        resolve(false);
                                    }
                                },
                                onerror: (err) => {
                                    logger.error('[CommentPanel] 提交评论失败:', err);
                                    Toast('网络请求出错，请重试', 2000, 'error');
                                    resolve(false);
                                }
                            });
                        });
                    }

                    if (success) {
                        close();
                        setTimeout(() => this.handleRetry(), 500);
                    } else {
                        textarea.disabled = false;
                        submitBtn.disabled = false;
                        submitBtn.textContent = '提交';
                        cancelBtn.disabled = false;
                    }
                } catch (err) {
                    logger.error('[CommentPanel] 发表评论失败:', err);
                    textarea.disabled = false;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '提交';
                    cancelBtn.disabled = false;
                }
            })();
        });

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitBtn.click();
            }
        });

        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }

    updatePosition() {
        if (!this.commentsPanel) return;

        const isLandscape = window.innerWidth > window.innerHeight;
        const isPcLandscape = isLandscape && window.innerWidth >= 930 && window.innerHeight >= 400;
        if (isLandscape && !isPcLandscape) {
            this.commentsPanel.style.display = 'none';
            return;
        }

        this.commentsPanel.style.display = 'flex';
    }

    /**
     * 显示加载中状态 (仅用于首屏/第一页加载)
     */
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
            this.loadingElement.style.flexDirection = 'column';
            this.loadingElement.style.gap = '12px';
            this.loadingElement.style.padding = '16px';
            this.loadingElement.innerHTML = `
                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">
                    <div class="jc-bd">
                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">
                            <div class="skeleton-block" style="width: 80px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                            <div class="skeleton-block" style="width: 60px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                        </div>
                        <div class="jc-body-text">
                            <div class="skeleton-block" style="width: 90%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>
                            <div class="skeleton-block" style="width: 50%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                        </div>
                    </div>
                </div>
                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">
                    <div class="jc-bd">
                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">
                            <div class="skeleton-block" style="width: 100px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                            <div class="skeleton-block" style="width: 45px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                        </div>
                        <div class="jc-body-text">
                            <div class="skeleton-block" style="width: 80%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>
                            <div class="skeleton-block" style="width: 40%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                        </div>
                    </div>
                </div>
                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">
                    <div class="jc-bd">
                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">
                            <div class="skeleton-block" style="width: 70px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                            <div class="skeleton-block" style="width: 55px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                        </div>
                        <div class="jc-body-text">
                            <div class="skeleton-block" style="width: 95%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>
                            <div class="skeleton-block" style="width: 70%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        if (this.errorElement) this.errorElement.style.display = 'none';
        if (this.commentsList) this.commentsList.style.display = 'none';
    }

    /**
     * 显示错误提示与重试按钮
     */
    showError(msg) {
        if (this.loadingElement) this.loadingElement.style.display = 'none';
        if (this.commentsList) this.commentsList.style.display = 'none';
        if (this.errorElement) {
            this.errorElement.style.display = 'flex';
            this.errorElement.style.flexDirection = 'column';
            this.errorElement.style.alignItems = 'center';
            this.errorElement.style.justifyContent = 'center';
            this.errorElement.style.gap = '10px';
            this.errorElement.style.padding = '20px';
            this.errorElement.style.boxSizing = 'border-box';
            
            this.errorElement.innerHTML = `
                <div style="text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; max-width: 280px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 13px;">${msg}</p>
                    <div style="text-align: left; background: hsla(var(--shadcn-destructive)/0.05); border: 1px solid hsla(var(--shadcn-destructive)/0.15); border-radius: 8px; padding: 10px; font-size: 11px; color: hsl(var(--shadcn-muted-foreground)); margin-bottom: 12px; box-sizing: border-box; line-height: 1.6;">
                        <span style="font-weight: 600; color: hsl(var(--shadcn-destructive)); display: block; margin-bottom: 4px;">可能的原因：</span>
                        1. 目标网站（Jable/JAVLibrary）当前不可达或网络受限。<br>
                        2. 跨域网络请求未获得脚本管理器授权（请在 Tampermonkey 弹窗中选择“总是允许”）。<br>
                        3. 被 Cloudflare 防火墙人机挑战拦截。
                    </div>
                    <button class="tm-comment-retry-btn" style="padding: 6px 16px; font-size: 11px; background-color: hsla(var(--shadcn-destructive) / 0.1); border: 1px solid hsla(var(--shadcn-destructive) / 0.3); color: hsl(var(--shadcn-destructive)); border-radius: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600; outline: none;">重新采集</button>
                </div>
            `;
        }
    }

    /**
     * 用户点击重试重新载入评论
     */
    handleRetry() {
        this.currentPage = 1;
        this.comments = [];
        this.filteredComments = [];
        
        // 彻底清除历史预加载失效 Promises，迫使重试发起真正请求
        CommentPanel.preloadCache.javlibVideoIdPromise = null;
        CommentPanel.preloadCache.javlibCommentsPromise = null;
        CommentPanel.preloadCache.javlibReviewsPromise = null;
        CommentPanel.preloadCache.jableCommentsPromise = null;

        if (this.videoCode) {
            console.log('[CommentPanel] 用户触发重新加载评论数据...');
            this.loadComments(1);
        }
    }

    /**
     * 触发加载更多 Jable 评论
     */
    triggerLoadMoreJable() {
        if (this.jableLoading || !this.jableHasMore || this.jableCollapsed) return;
        logger.log('[CommentPanel] 触发加载更多 Jable 评论...');
        this.loadJableComments(this.jableCurrentPage + 1);
    }

    /**
     * 触发加载更多 JAVLibrary 评论
     */
    triggerLoadMoreJavlib() {
        if (this.javlibLoading || !this.javlibHasMore || this.javlibCollapsed) return;
        logger.log('[CommentPanel] 触发加载更多 JAVLibrary 评论...');
        this.loadJavlibComments(this.javlibCurrentPage + 1);
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
        this.totalCount = (this.jableTotalCount || 0) + (this.javlibTotalCount || 0);
        this.hasMore = (this.jableHasMore || false) || (this.javlibHasMore || false);
        if (this.countSpan) {
            let text = (__('commentsCount') || '共 {n} 条评论').replace('{n}', this.totalCount);
            const loadings = [];
            if (this.jableLoading) loadings.push('Jable');
            if (this.javlibLoading) loadings.push('JAVLibrary');
            if (loadings.length > 0) {
                text += ` (正在采集 ${loadings.join('/')}...)`;
            }
            this.countSpan.textContent = text;
        }
    }

    renderCommentCard(c, isNew = false) {
        const textClass = c.text && c.text.length > 200 ? 'jc-body-text jc-body-text--collapsible' : 'jc-body-text';
        const expandBtn = c.text && c.text.length > 200 
            ? `<div class="jc-body-text-content">${c.textHtml}</div><button class="jc-toggle-expand-btn">${__('commentsExpand') || '展开'}</button>` 
            : c.textHtml;
            
        const userHtml = c.userUrl 
            ? `<a href="${c.userUrl}" target="_blank" class="jc-u">${c.user}</a>` 
            : `<span class="jc-u">${c.user}</span>`;
            
        const scoreHtml = c.score ? `<span class="jc-score-badge" title="评分">${c.score}</span>` : '';
        const spamHtml = (c.spam && c.spam.label === 'SPAM') ? `<span class="jc-spam-badge" title="${c.spam.reason}">灌水: ${c.spam.category}</span>` : '';
        
        return `
            <div class="jc-card ${isNew ? 'jc-card--new' : ''}" data-id="${c.id}">
                <div class="jc-bd">
                    <div class="jc-hdr">
                        <div class="jc-hdr-left">
                            <span class="jc-t">${c.time}</span>
                        </div>
                        <div class="jc-hdr-right">
                            ${userHtml}
                            ${scoreHtml}
                            ${spamHtml}
                            <span class="jc-site jc-site-${c.site || 'jable'}">${c.site === 'javlib-review' ? 'javlib-review' : (c.site || 'jable')}</span>
                        </div>
                    </div>
                    <div class="${textClass}" ${c.text && c.text.length > 200 ? 'data-collapsed="true"' : ''}>
                        ${expandBtn}
                    </div>
                </div>
            </div>
        `;
    }

    renderCommentsList() {
        if (this.loadingElement) this.loadingElement.style.display = 'none';
        if (this.errorElement) this.errorElement.style.display = 'none';
        if (this.commentsList) this.commentsList.style.display = 'flex';

        // Check auto trigger verification
        if (this.javlibStatus === 'cf_shield' && !this.javlibAutoVerifyAttempted) {
            setTimeout(() => this.startJavlibBackgroundVerification(this.javlibFailedDomain), 50);
        }

        // 1. Jable.tv Section HTML
        let jableContentHtml = '';
        if (this.jableStatus === 'loading') {
            jableContentHtml = `
                <div class="tm-comment-loader-graphic" style="display: flex; gap: 5px; padding: 16px; justify-content: center;">
                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>
                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>
                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>
                </div>
            `;
        } else if (this.jableStatus === 'unreachable') {
            jableContentHtml = `
                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; pointer-events: auto;">
                    <p style="margin: 0; font-weight: 500;">⚠️ 无法连接到 Jable.tv</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">请检查网络代理，或该站点在当前环境不可达。</p>
                </div>
            `;
        } else if (this.jableStatus === 'not_found') {
            jableContentHtml = `
                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">
                    <p style="margin: 0;">此影片在 Jable.tv 上未发布或已下架。</p>
                </div>
            `;
        } else if (this.jableStatus === 'empty') {
            jableContentHtml = `
                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">
                    <p style="margin: 0;">暂无评论</p>
                </div>
            `;
        } else if (this.jableStatus === 'cf_shield') {
            const targetDomain = this.jableFailedDomain || `https://${SITE_DOMAINS.JABLE.primary}`;
            jableContentHtml = `
                <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-destructive)/0.08); border: 1px solid hsla(var(--shadcn-destructive)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-destructive)); box-sizing: border-box; width: 100%; pointer-events: auto;">
                    <span>Jable.tv 评论由于 Cloudflare 拦截加载失败 (触发人机验证)</span>
                    <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                        <a href="${targetDomain}/" target="_blank" class="tm-comments-verify-link" style="padding: 4px 10px; background-color: hsl(var(--shadcn-destructive)); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 10px; white-space: nowrap;">去验证</a>
                    </div>
                </div>
            `;
        } else if (this.jableStatus === 'loaded') {
            jableContentHtml = this.filteredJableComments.map(c => {
                const isNew = this.renderedCommentIds.size > 0 && !this.renderedCommentIds.has(c.id);
                return this.renderCommentCard(c, isNew);
            }).join('');
            
            if (this.jableLoading) {
                jableContentHtml += `
                    <div class="tm-comment-bottom-loader tm-comment-loader-graphic">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
            } else if (!this.jableHasMore) {
                jableContentHtml += `
                    <div class="tm-comment-end-marker" style="text-align: center; padding: 4px; font-size: 10px; color: hsl(var(--shadcn-muted-foreground)); opacity: 0.6;">-end-</div>
                `;
            }
        }

        const jableBadgeText = {
            'loading': '采集中...',
            'unreachable': '不可达',
            'not_found': '未收录',
            'empty': '暂无评论',
            'cf_shield': '需验证',
            'loaded': `共 ${this.filteredJableComments.length}${this.jableHasMore ? '+' : ''} 条`
        }[this.jableStatus] || '';

        const jableIsCollapsed = (this.jableStatus === 'unreachable' || this.jableStatus === 'not_found' || this.jableCollapsed);
        const jableBodyDisplay = jableIsCollapsed ? 'none' : 'block';
        const jableHeaderHtml = `
            <div class="tm-comment-section${jableIsCollapsed ? ' is-collapsed' : ''}" id="tm-comment-section-jable">
                <div class="tm-comment-section-hdr" title="点击展开/折叠">
                    <span class="tm-comment-section-title">■ Jable.tv</span>
                    <span class="tm-comment-status-badge tm-status-badge-${this.jableStatus}">${jableBadgeText}</span>
                </div>
                <div class="tm-comment-section-body" style="display: ${jableBodyDisplay}; pointer-events: auto;">
                    ${jableContentHtml}
                </div>
            </div>
        `;

        // 2. JAVLibrary Section HTML
        let javlibContentHtml = '';
        if (this.javlibStatus === 'loading') {
            javlibContentHtml = `
                <div class="tm-comment-loader-graphic" style="display: flex; gap: 5px; padding: 16px; justify-content: center;">
                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>
                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>
                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>
                </div>
            `;
        } else if (this.javlibStatus === 'unreachable') {
            javlibContentHtml = `
                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; pointer-events: auto;">
                    <p style="margin: 0; font-weight: 500;">⚠️ 无法连接到 JAVLibrary</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">请检查网络代理，或该站点在当前环境不可达。</p>
                </div>
            `;
        } else if (this.javlibStatus === 'not_found') {
            javlibContentHtml = `
                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">
                    <p style="margin: 0;">此影片在 JAVLibrary 上暂无收录。</p>
                </div>
            `;
        } else if (this.javlibStatus === 'empty') {
            javlibContentHtml = `
                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">
                    <p style="margin: 0;">暂无评论</p>
                </div>
            `;
        } else if (this.javlibStatus === 'cf_shield') {
            const targetDomain = this.javlibFailedDomain || `https://${SITE_DOMAINS.JAVLIBRARY.primary}`;
            if (this.javlibVerifyingStatus === 'verifying') {
                javlibContentHtml = `
                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-blue)/0.08); border: 1px solid hsla(var(--shadcn-blue)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-blue)); box-sizing: border-box; width: 100%; pointer-events: auto;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="tm-comment-loader-graphic" style="display: flex; gap: 3px; padding: 0; width: auto; min-height: 0;">
                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>
                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>
                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>
                            </div>
                            <span style="font-weight: 500;">正在后台尝试自动通过 JAVLibrary 验证，请稍候...</span>
                        </div>
                    </div>
                `;
            } else if (this.javlibVerifyingStatus === 'manual') {
                javlibContentHtml = `
                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-destructive)/0.08); border: 1px solid hsla(var(--shadcn-destructive)/0.15); font-size: 11px; display: flex; flex-direction: column; gap: 8px; color: hsl(var(--shadcn-destructive)); box-sizing: border-box; width: 100%; pointer-events: auto;">
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <div style="font-weight: 600;">⚠️ JAVLibrary 验证加载受阻 (Cloudflare)</div>
                            <div style="font-size: 10px; opacity: 0.85;">自动验证超时或需手动人机验证。请点击下方按钮前往验证页面。</div>
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            <a href="${targetDomain}/cn/" target="_blank" class="tm-comments-verify-link" style="padding: 4px 10px; background-color: hsl(var(--shadcn-destructive)); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 10px; white-space: nowrap;">去手动验证</a>
                            <button class="tm-comments-verify-retry-btn" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">重新加载</button>
                            <button class="tm-comments-verify-copy-logs-btn" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">复制日志</button>
                        </div>
                    </div>
                `;
            } else {
                javlibContentHtml = `
                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-destructive)/0.08); border: 1px solid hsla(var(--shadcn-destructive)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-destructive)); box-sizing: border-box; width: 100%; pointer-events: auto;">
                        <span>JAVLibrary 评论由于 Cloudflare 拦截加载失败</span>
                        <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                            <a href="${targetDomain}/cn/" target="_blank" class="tm-comments-verify-link" style="padding: 4px 10px; background-color: hsl(var(--shadcn-destructive)); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 10px; white-space: nowrap;">去验证</a>
                            <button class="tm-comments-verify-copy-logs-btn" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s; margin-left: 4px;">复制日志</button>
                        </div>
                    </div>
                `;
            }
        } else if (this.javlibStatus === 'loaded') {
            javlibContentHtml = this.filteredJavlibComments.map(c => {
                const isNew = this.renderedCommentIds.size > 0 && !this.renderedCommentIds.has(c.id);
                return this.renderCommentCard(c, isNew);
            }).join('');

            if (this.javlibLoading) {
                javlibContentHtml += `
                    <div class="tm-comment-bottom-loader tm-comment-loader-graphic">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
            } else if (!this.javlibHasMore) {
                javlibContentHtml += `
                    <div class="tm-comment-end-marker" style="text-align: center; padding: 4px; font-size: 10px; color: hsl(var(--shadcn-muted-foreground)); opacity: 0.6;">-end-</div>
                `;
            }
        }

        const javlibBadgeText = {
            'loading': '采集中...',
            'unreachable': '不可达',
            'not_found': '未收录',
            'empty': '暂无评论',
            'cf_shield': '需验证',
            'loaded': `共 ${this.filteredJavlibComments.length}${this.javlibHasMore ? '+' : ''} 条`
        }[this.javlibStatus] || '';

        const javlibIsCollapsed = (this.javlibStatus === 'unreachable' || this.javlibStatus === 'not_found' || this.javlibCollapsed);
        const javlibBodyDisplay = javlibIsCollapsed ? 'none' : 'block';
        const javlibHeaderHtml = `
            <div class="tm-comment-section${javlibIsCollapsed ? ' is-collapsed' : ''}" id="tm-comment-section-javlib">
                <div class="tm-comment-section-hdr" title="点击展开/折叠">
                    <span class="tm-comment-section-title">■ JAVLibrary</span>
                    <span class="tm-comment-status-badge tm-status-badge-${this.javlibStatus}">${javlibBadgeText}</span>
                </div>
                <div class="tm-comment-section-body" style="display: ${javlibBodyDisplay}; pointer-events: auto;">
                    ${javlibContentHtml}
                </div>
            </div>
        `;

        if (this.commentsList) {
            // 保存每个 Section 体内部的 scrollTop 状态
            const scrollPositions = {};
            const sectionBodies = this.commentsList.querySelectorAll('.tm-comment-section-body');
            sectionBodies.forEach(body => {
                const section = body.closest('.tm-comment-section');
                if (section && section.id) {
                    scrollPositions[section.id] = body.scrollTop;
                }
            });

            // 渲染 HTML
            this.commentsList.innerHTML = jableHeaderHtml + javlibHeaderHtml;

            // 还原各板块内部滚动高度
            const newSectionBodies = this.commentsList.querySelectorAll('.tm-comment-section-body');
            newSectionBodies.forEach(body => {
                const section = body.closest('.tm-comment-section');
                if (section && section.id && scrollPositions[section.id] !== undefined) {
                    body.scrollTop = scrollPositions[section.id];
                }
            });

            // 绑定去手动验证链接的点击事件，使手动打开的验证页也能在成功后自动关闭并重载
            const verifyLinks = this.commentsList.querySelectorAll('.tm-comments-verify-link');
            verifyLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (typeof GM_setValue === 'function') {
                        GM_setValue('javlib_verifying', true);
                        GM_setValue('javlib_verifying_start_time', Date.now());
                    }
                    // 重新开启全局信号监听，以应对用户手动验证通过
                    this.startSignalListener();
                });
            });

            // 绑定验证重试按钮
            const verifyRetryBtn = this.commentsList.querySelector('.tm-comments-verify-retry-btn, .tm-comment-retry-btn');
            if (verifyRetryBtn) {
                verifyRetryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    logger.log('用户手动点击重试，清除历史验证状态并重载...');
                    this.javlibAutoVerifyAttempted = false;
                    this.javlibCfShield = false;
                    this.javlibVerifyingStatus = '';
                    
                    // 手动点击重试时，必须清空历史失败缓存的 ID/评论 Promises，否则将继续复用已失败的 Promise
                    CommentPanel.preloadCache.javlibVideoIdPromise = null;
                    CommentPanel.preloadCache.javlibCommentsPromise = null;
                    CommentPanel.preloadCache.javlibReviewsPromise = null;

                    this.loadJavlibComments(1);
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

            // 绑定分区头部的点击事件以实现折叠/展开交替
            const jableHdr = this.commentsList.querySelector('#tm-comment-section-jable .tm-comment-section-hdr');
            if (jableHdr) {
                jableHdr.addEventListener('click', () => {
                    const body = this.commentsList.querySelector('#tm-comment-section-jable .tm-comment-section-body');
                    const section = this.commentsList.querySelector('#tm-comment-section-jable');
                    if (body && section) {
                        this.jableCollapsed = !this.jableCollapsed;
                        body.style.display = this.jableCollapsed ? 'none' : 'block';
                        section.classList.toggle('is-collapsed', this.jableCollapsed);
                        localStorage.setItem('tm-comment-jable-collapsed', this.jableCollapsed);
                        
                        // 展开一个，折叠另一个
                        if (!this.jableCollapsed) {
                            this.javlibCollapsed = true;
                            localStorage.setItem('tm-comment-javlib-collapsed', 'true');
                            this.renderCommentsList();
                            
                            if (this.jableComments.length === 0 && this.jableStatus === 'loading' && !this.jableLoading) {
                                this.loadJableComments(1);
                            } else {
                                this.triggerLoadMoreJable();
                            }
                        }
                    }
                });
            }

            const javlibHdr = this.commentsList.querySelector('#tm-comment-section-javlib .tm-comment-section-hdr');
            if (javlibHdr) {
                javlibHdr.addEventListener('click', () => {
                    const body = this.commentsList.querySelector('#tm-comment-section-javlib .tm-comment-section-body');
                    const section = this.commentsList.querySelector('#tm-comment-section-javlib');
                    if (body && section) {
                        this.javlibCollapsed = !this.javlibCollapsed;
                        body.style.display = this.javlibCollapsed ? 'none' : 'block';
                        section.classList.toggle('is-collapsed', this.javlibCollapsed);
                        localStorage.setItem('tm-comment-javlib-collapsed', this.javlibCollapsed);
                        
                        // 展开一个，折叠另一个
                        if (!this.javlibCollapsed) {
                            this.jableCollapsed = true;
                            localStorage.setItem('tm-comment-jable-collapsed', 'true');
                            this.renderCommentsList();
                            
                            if (this.javlibComments.length === 0 && this.javlibStatus === 'loading' && !this.javlibLoading) {
                                this.loadJavlibComments(1);
                            } else {
                                this.triggerLoadMoreJavlib();
                            }
                        }
                    }
                });
            }

            // 记录当前已渲染的评论ID，以便下一页追加时能够识别出新评论
            (this.filteredJableComments || []).forEach(c => this.renderedCommentIds.add(c.id));
            (this.filteredJavlibComments || []).forEach(c => this.renderedCommentIds.add(c.id));

            // 当分区没有被评论填满（没有出现滚动条）且仍有更多评论可加载时，自动触发加载下一页
            setTimeout(() => {
                const activeBodies = Array.from(this.commentsList.querySelectorAll('.tm-comment-section:not(.is-collapsed) .tm-comment-section-body'));
                for (const body of activeBodies) {
                    if (body.scrollHeight > 0 && body.scrollHeight <= body.clientHeight + 10) {
                        const isJable = body.closest('#tm-comment-section-jable') !== null;
                        if (isJable && this.jableHasMore && !this.jableLoading) {
                            logger.log('[CommentPanel] Jable section viewport not filled. Auto-loading next page...');
                            this.triggerLoadMoreJable();
                        } else if (!isJable && this.javlibHasMore && !this.javlibLoading) {
                            logger.log('[CommentPanel] JAVLibrary section viewport not filled. Auto-loading next page...');
                            this.triggerLoadMoreJavlib();
                        }
                    }
                }
            }, 150);
        }
    }
    async checkLoginStatus() {
        try {
            if (window.loginManager) {
                const provider = window.loginManager.getMatchingProvider();
                if (provider && typeof provider.checkLoginStatus === 'function') {
                    return await provider.checkLoginStatus();
                }
            }
            if (isSiteDomain('MISSAV')) {
                const loginButton = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
                const userAvatar = document.querySelector('.avatar') || document.querySelector('.user-menu');
                return !loginButton || !!userAvatar;
            } else if (isSiteDomain('JABLE')) {
                const logoutBtn = document.querySelector('a[href*="logout"]') || document.querySelector('.user-avatar');
                const loginBtn = document.querySelector('a[href*="login"]');
                return !!logoutBtn || !loginBtn;
            }
        } catch (e) {
            console.error('[CommentPanel] Check login error:', e);
        }
        return true; // 默认返回已登录以保持向前兼容
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
     * 销毁生命周期
     */
    cleanup() {
        // 无需额外滚动 RAF 定时器清理，系统天然解耦
        this.cleanupJavlibVerification();
    }
}
