import { getVideoDurationSeconds, parseDurationFromBadge } from '../../utils/dom.js';
import { SyncManager, WebDavClient } from '../../sync/index.js';
import { isValidAvCode, matchAvCodeFromText } from '../../utils/videoCode.js';
import { isSiteDomain } from '../../constants/domains.js';
import { SupabaseService } from '../../services/SupabaseService.js';
/**
 * 疯狂采集模式引擎 (CrazyScraper)
 * 
 * 职责：
 * 1. 扫描当前宿主页面中的所有关联番号 (推荐视频、侧边栏、合集等)；
 * 2. 严格遵循反爬安全规范：单并发串行排队、2.5~4.0s 随机抖动延时、429 自动退避、域名动态轮换；
 * 3. 抓取有效评论并自动沉淀至 CommentDebugCollector (WebDAV 语料库) 与 CommentCacheManager (原生 IndexedDB)；
 * 4. 状态与进度实时汇报至顶部的 DebugLogPanel 面板；
 * 5. 严格受控于 debugMode 与 crazyScrapeMode 开关，关闭即时熔断停止。
 */

import { fetchJableComments, JABLE_DOMAINS } from '../controls/CommentScraper.js';
import { processComment } from '../comments/CommentDataPipeline.js';
import { CommentDebugCollector } from './CommentDebugCollector.js';
import { CommentCacheManager } from './CommentCacheManager.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import { logger } from '../../utils/logger.js';
import { getValue } from '../../utils/storage.js';

// 常用正规番号特征正则
const AVCODE_REGEX = /([a-zA-Z]{2,6})[-_\s]?(\d{2,5})(?:-c|_c|-4k)?/gi;

export class CrazyScraper {
    static _isRunning = false;
    static _shouldStop = false;
    static _scannedCodes = new Set();
    static _completedCodes = new Set();
    static _avcodeDurations = new Map();

    /**
     * 判断当前是否允许运行疯狂采集
     * @returns {boolean}
     */
    static isEnabled() {
        const isDebug = Boolean(getValue('debugMode', false));
        const isCrazy = Boolean(getValue('crazyScrapeMode', false));
        return isDebug && isCrazy && CommentDebugCollector.isEnabled();
    }

    /**
     * 启动宿主页面全量番号扫描与排队采集
     * @param {string} [currentAvcode] - 当前正在播放的主番号
     */
    static async start(currentAvcode = '') {
        if (!this.isEnabled()) return;
        if (this._isRunning) {
            logger.debug('[CrazyScraper] 疯狂采集引擎已在运行中，跳过重复启动');
            return;
        }

        this._isRunning = true;
        this._shouldStop = false;

        const candidateCodes = this.scanHostPageAvcodes(currentAvcode);
        if (candidateCodes.length === 0) {
            DebugLogPanel.addLog('[疯狂采集] 宿主页面未匹配到其他有效番号', 'info');
            this._isRunning = false;
            return;
        }

        DebugLogPanel.addLog(`[疯狂采集] 启动！宿主页面扫描到 ${candidateCodes.length} 个候选番号，开始排队采集...`, 'info');

        // 单并发串行执行
        let currentIndex = 0;
        for (const code of candidateCodes) {
            if (this._shouldStop || !this.isEnabled()) {
                DebugLogPanel.addLog('[疯狂采集] 收到停止信号，采集队列已安全中止', 'warn');
                break;
            }

            currentIndex++;
            await this._scrapeSingleAvcode(code, currentIndex, candidateCodes.length);

            // 严格反爬：随机等待 2.5 ~ 4.0 秒 (Jitter Delay)
            if (currentIndex < candidateCodes.length && !this._shouldStop && this.isEnabled()) {
                const sleepMs = 2500 + Math.floor(Math.random() * 1500);
                await this._sleep(sleepMs);
            }
        }

        if (!this._shouldStop && this.isEnabled()) {
            DebugLogPanel.addLog(`[疯狂采集] 全部 ${candidateCodes.length} 个番号排队采集任务执行完毕`, 'success');
        }

        this._isRunning = false;
        this._shouldStop = false;
    }

    /**
     * 中止当前采集队列
     */
    static stop() {
        if (this._isRunning) {
            this._shouldStop = true;
            logger.debug('[CrazyScraper] 触发停止信号');
        }
    }

    /**
     * 扫描宿主页面中的所有关联番号
     * @param {string} [currentAvcode] 
     * @returns {string[]}
     */
        static scanHostPageAvcodes(currentAvcode = '') {
        const found = new Set();
        const currentUpper = String(currentAvcode || '').toUpperCase();

        try {
            // 全面扫描当前页面中的所有 <a> 链接与视频卡片节点
            const links = document.querySelectorAll('a[href]');
            const currentHost = (typeof window !== 'undefined' && window.location) ? window.location.hostname : '';
            const nonVideoRouteRegex = /\/(tags?|genres?|categories|category|makers?|actress(?:es)?|actors?|series|channels?|models?|stars?|users?|search|popular|latest|ranking|playlists?|forum|news|help|about|dmca|terms|privacy)\b/i;

            for (const a of links) {
                const href = a.getAttribute('href') || '';
                if (!href || href.startsWith('#') || href.startsWith('javascript:') || /\.(css|js|png|jpg|jpeg|gif|svg|ico)$/i.test(href)) {
                    continue;
                }

                // A. 跨域与外链广告熔断：排除第三方外链与广告追踪链接
                let urlObj;
                try {
                    urlObj = new URL(href, (typeof window !== 'undefined' ? window.location.href : 'https://missav.ai'));
                } catch (_) {
                    continue;
                }

                const linkHost = urlObj.hostname;
                const isTrustedHost = !currentHost || linkHost === currentHost ||
                    isSiteDomain('MISSAV', linkHost) ||
                    isSiteDomain('JABLE', linkHost) ||
                    isSiteDomain('JAVDB', linkHost) ||
                    isSiteDomain('JAVLIBRARY', linkHost);
                if (!isTrustedHost) {
                    continue;
                }

                // B. 排除标签、分类、演员、合集等非视频路由
                const pathname = urlObj.pathname.toLowerCase();
                if (nonVideoRouteRegex.test(pathname)) {
                    continue;
                }

                // C. 针对 Jable 宿主页面的专属过滤：非 /videos/ 路径不是视频
                if (currentHost && isSiteDomain('JABLE', currentHost) && !pathname.includes('/videos/')) {
                    continue;
                }

                // D. 针对 JavDB 宿主页面的专属过滤：非 /v/ 或 /videos/ 路径不是视频
                if (currentHost && isSiteDomain('JAVDB', currentHost) && !/\/(?:v|videos)\//i.test(pathname)) {
                    continue;
                }

                // 1. 优先从 URL 路径末尾分段精准提取 (如 /cn/mvsd-617, /videos/ssis-123/, /miaa-598)
                let cleanPath = urlObj.pathname.replace(/\/+$/, '');
                const segments = cleanPath.split('/').filter(Boolean);
                const lastSegment = segments.length > 0 ? segments[segments.length - 1] : '';

                let code = matchAvCodeFromText(lastSegment);
                // 2. 兜底从链接文本或 title 属性提取 (仅在当前节点为视频卡片结构时允许)
                if (!code) {
                    const isLikelyCard = a.querySelector('img') || a.closest('.video-img-box, .grid-item, .video-item, .item, .movie-card, .col, li');
                    if (isLikelyCard) {
                        code = matchAvCodeFromText(a.getAttribute('title') || a.textContent || '');
                    }
                }

                if (code && isValidAvCode(code)) {
                    const upper = code.toUpperCase();
                    // Jable 源站未收录 MissAV 专属内部 DM-xxx 企划，跳过避免无效 404
                    if (upper.startsWith('DM-')) continue;
                                        if (upper !== currentUpper && !this._completedCodes.has(upper)) {
                        found.add(upper);

                        // 全方位探测该视频卡片上的时长徽章 (Tailwind/Bootstrap/通用结构兼容)
                        let durSec = 0;
                        let card = a.closest('.video-img-box, .grid-item, .video-item, .item, .movie-card, .col, li, div.relative');
                        if (!card) {
                            let p = a.parentElement;
                            for (let i = 0; i < 4 && p && p !== document.body; i++) {
                                if (p.querySelector('img') || p.classList.contains('relative') || p.tagName === 'LI') {
                                    card = p;
                                    break;
                                }
                                p = p.parentElement;
                            }
                        }
                        if (!card) card = a.parentElement;

                        if (card) {
                            // 检查卡片内所有纯文本叶子节点
                            const allNodes = card.querySelectorAll('span, div, time, p, label');
                            for (const node of allNodes) {
                                if (node.children.length === 0) {
                                    const txt = (node.textContent || '').trim();
                                    if (txt.length >= 4 && txt.length <= 10) {
                                        const s = parseDurationFromBadge(txt);
                                        if (s > 60) {
                                            durSec = s;
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        if (durSec > 0) {
                            this._avcodeDurations.set(upper, durSec);
                        }
                    }
                }
            }
        } catch (e) {
            logger.debug('[CrazyScraper] 扫描宿主页面番号异常:', e);
        }

        return Array.from(found);
    }

static async _scrapeSingleAvcode(code, index, total) {
        if (this._completedCodes.has(code)) return;
        this._completedCodes.add(code);

        const forceRescrape = Boolean(getValue('crazyForceRescrape', false));

        if (!forceRescrape) {
            // 1. 本地 IndexedDB 离线缓存防重 (已采集则跳过)
            try {
                const localRecord = await CommentCacheManager.getAsync(code);
                if (localRecord && localRecord.sites && Object.values(localRecord.sites).some(s => s && s.comments && s.comments.length > 0)) {
                    DebugLogPanel.addLog(`[疯狂采集] (${index}/${total}) ${code} 本地已存在评论，跳过重复采集`, 'info');
                    return;
                }
            } catch (_) {}

            // 2. Supabase 方案 1 JSONB 聚合仓储防重 (云端已收录则跳过)
            try {
                const remoteComments = await SupabaseService.fetchComments(code);
                if (remoteComments && remoteComments.length > 0) {
                    DebugLogPanel.addLog(`[疯狂采集] (${index}/${total}) ${code} Supabase 已收录 (${remoteComments.length}条)，跳过重复采集`, 'info');
                    return;
                }
            } catch (_) {}

            // 3. WebDAV 独立文件防重 (/MissPlayer/comments/[AVCODE].json 已收录则跳过)
            try {
                const config = SyncManager.getWebDavConfig();
                if (config && config.url) {
                    const subPath = `comments/${code.toUpperCase()}.json`;
                    const wdData = await WebDavClient.downloadBackup(config, subPath);
                    if (wdData && Array.isArray(wdData.comments) && wdData.comments.length > 0) {
                        DebugLogPanel.addLog(`[疯狂采集] (${index}/${total}) ${code} WebDAV 已收录 (${wdData.comments.length}条)，跳过重复采集`, 'info');
                        return;
                    }
                }
            } catch (_) {}
        } else {
            DebugLogPanel.addLog(`[疯狂采集] (${index}/${total}) ${code} 强制覆盖模式已开启，重新全量爬取并更新时长`, 'info');
        }

        DebugLogPanel.addLog(`[疯狂采集] (${index}/${total}) 正在抓取 ${code}...`, 'info');

        let domainIndex = 0;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            if (this._shouldStop || !this.isEnabled()) return;

            try {
                let page = 1;
                let allProcessed = [];
                let totalCount = 0;
                let hasMore = true;
                let workingDomain = '';
                const collectedPages = new Set();
                const maxPages = 15;

                while (hasMore && page <= maxPages) {
                    if (this._shouldStop || !this.isEnabled()) return;
                    const res = await fetchJableComments(code, page, domainIndex);
                    if (!res || !Array.isArray(res.comments) || res.comments.length === 0) break;
                    workingDomain = res.domain || workingDomain;
                    totalCount = res.totalCount || totalCount;
                    collectedPages.add(page);
                    const pageProcessed = res.comments.map((c, idx) => {
                        const proc = processComment(c.text, code, 10800);
                        return { ...c, ...proc, _originalIndex: allProcessed.length + idx };
                    });
                    allProcessed.push(...pageProcessed);
                    hasMore = Boolean(res.hasMore);
                    if (!hasMore) break;
                    page++;
                    await this._sleep(800 + Math.random() * 600);
                }
                if (allProcessed.length === 0) {
                    DebugLogPanel.addLog('[疯狂采集] ' + code + ' 暂无评论或未在源站收录', 'info');
                    return;
                }
                const stats = { jable: totalCount || allProcessed.length, total: totalCount || allProcessed.length };
                CommentDebugCollector.collectComments(code, allProcessed, 10800, stats);
                const currentVideoCode = (typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean).pop() || '').toUpperCase() : '');
                let durSec = this._avcodeDurations.get(code) || 0;
                if (!durSec && code === currentVideoCode) {
                    durSec = getVideoDurationSeconds();
                }
                // 从已抓取评论的最大时间戳推导保底视频物理时长
                if (!durSec && Array.isArray(allProcessed) && allProcessed.length > 0) {
                    let maxTs = 0;
                    for (const c of allProcessed) {
                        if (Array.isArray(c.timestamps)) {
                            for (const t of c.timestamps) {
                                if (t.seconds && t.seconds > maxTs) {
                                    maxTs = Math.round(t.seconds);
                                }
                            }
                        }
                    }
                    if (maxTs > 300) {
                        durSec = maxTs;
                    }
                }
                SupabaseService.uploadComments(code, 'jable', allProcessed, durSec);
                CommentCacheManager.saveSiteCache(code, 'jable', { key: 'jable', status: 'loaded', comments: allProcessed, totalCount: stats.jable, hasMore: false, currentPage: page, collectedPages, workingDomain });
                DebugLogPanel.addLog('[疯狂采集] ✅ ' + code + ' 全量采集完成 (获取 ' + allProcessed.length + ' 条评论，总计 ' + stats.jable + ' 条)', 'success');
                return;
            } catch (err) {
                const msg = err.message || '';
                // 遇到 429 / 频控 / 盾牌，自动退避
                if (msg.includes('429') || msg.includes('503') || msg.includes('Cloudflare')) {
                    DebugLogPanel.addLog(`[疯狂采集] ${code} 遇到源站频控，休眠退避 12 秒并轮换域名...`, 'warn');
                    await this._sleep(12000);
                    domainIndex = (domainIndex + 1) % JABLE_DOMAINS.length;
                    retryCount++;
                } else {
                    DebugLogPanel.addLog(`[疯狂采集] ${code} 抓取跳过: ${msg.slice(0, 30)}`, 'warn');
                    return;
                }
            }
        }
    }

    static _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
