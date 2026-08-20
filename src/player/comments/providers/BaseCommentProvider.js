/**
 * BaseCommentProvider — 评论源抽象基类
 * 定义统一的跨站点评论抓取与解析契约
 */
export class BaseCommentProvider {
    /**
     * @param {string} siteKey - 站点标识 ('jable' | 'javlib' | 'javdb')
     */
    constructor(siteKey) {
        this.siteKey = siteKey;
    }

    /**
     * 获取指定番号的评论列表
     * @param {string} avCode - 目标番号
     * @param {number} [page=1] - 请求页码
     * @param {Object} [options={}] - 附加选项 (如 videoId, movieId, domain 等)
     * @returns {Promise<{comments: Array, totalCount: number, hasMore: boolean, domain?: string, source?: string}>}
     */
    async fetchComments(avCode, page = 1, options = {}) {
        throw new Error(`[BaseCommentProvider] fetchComments not implemented for site: ${this.siteKey}`);
    }
}
