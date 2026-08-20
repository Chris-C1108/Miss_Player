/**
 * CommentScraper.js — 向后兼容的聚合导出门面
 * 实际实现已深化迁移至 src/player/comments/ 目录：
 * - Provider 矩阵：src/player/comments/providers/
 * - 纯函数数据管道：src/player/comments/CommentDataPipeline.js
 */

export { cleanAvCode, getVideoCodeFromUrl } from '../../utils/videoCode.js';

// Provider 数据源与特定抓取函数
export {
    BaseCommentProvider,
    JableCommentProvider,
    fetchJableComments,
    parseCommentsHtml,
    JABLE_DOMAINS,
    JavLibCommentProvider,
    fetchJavLibraryVideoId,
    fetchJavLibraryData,
    JAVLIB_DOMAINS,
    JavDbCommentProvider,
    fetchJavdbMovieId,
    fetchJavdbData,
    JAVDB_DOMAINS
} from '../comments/index.js';

// 数据清洗、垃圾过滤、时间戳/番号提取管道
export {
    CFG,
    esc,
    normalizeText,
    stripEmojis,
    classifyComment,
    parseTimestamps,
    extractAVCodes,
    formatSeconds,
    parseBBCode,
    highlightCommentText,
    processComment
} from '../comments/CommentDataPipeline.js';
