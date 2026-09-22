/**
 * 评论调试与模型优化数据采集器 (CommentDebugCollector)
 * 
 * 仅在同时满足以下条件时工作：
 * 1. DEBUG 模式开关开启 (debugMode === true)
 * 2. 用户已配置有效的私有 WebDAV 服务器 (webdavConfig.url 存在)
 * 
 * 核心职责：
 * - 收集含数字的真实评论语料按 AVCODE 聚合存储至 WebDAV miss_player_comments_debug.json
 * - 收集用户手动调整时间倒数的样本 (Ground Truth) 存储至 WebDAV miss_player_countdown_samples.json
 * - 采用双重去重 (L1 内存键 + L2 云端字典覆盖) 与异步防抖写回，零性能干扰
 */

import { getValue } from '../../utils/storage.js';
import { SyncManager, WebDavClient } from '../../sync/index.js';
import { logger } from '../../utils/logger.js';

const COMMENTS_DEBUG_FILENAME = 'miss_player_comments_debug.json';
const COUNTDOWN_SAMPLES_FILENAME = 'miss_player_countdown_samples.json';
const DEBOUNCE_DELAY_MS = 12000; // 12秒批量防抖写回

export class CommentDebugCollector {
    // 内存已处理复合键去重集合 (source_id)
    static _processedCommentKeys = new Set();
    
    // 待同步的数字评论队列 (avcode -> { videoDuration, comments: Map(key -> comment) })
    static _pendingCommentBatches = new Map();
    static _commentSyncTimer = null;
    static _isCommentSyncing = false;

    // 待同步的手动倒数调整样本 (sampleId -> sample)
    static _pendingSamples = new Map();
    static _sampleSyncTimer = null;
    static _isSampleSyncing = false;

    /**
     * 门禁校验：DEBUG 开启且已配置 WebDAV
     * @returns {boolean}
     */
    static isEnabled() {
        try {
            const isDebug = Boolean(getValue('debugMode', false));
            if (!isDebug) return false;
            const config = SyncManager.getWebDavConfig();
            return Boolean(config && config.url && config.url.trim());
        } catch (_) {
            return false;
        }
    }

    /**
     * 收集单批评论中包含数字的有效评论
     * @param {string} avcode - 番号标识
     * @param {Array} comments - 解析后的评论对象列表
     * @param {number} videoDuration - 视频真实时长 (秒)
     */
    static collectComments(avcode, comments, videoDuration = 10800) {
        if (!this.isEnabled() || !avcode || !Array.isArray(comments) || comments.length === 0) {
            return;
        }

        const validDuration = (videoDuration && !isNaN(videoDuration) && videoDuration > 0) 
            ? Math.round(videoDuration) 
            : 10800;

        // 筛选包含数字且非 SPAM 的评论
        const candidateComments = comments.filter(c => {
            if (!c || typeof c.text !== 'string') return false;
            if (c.spam && c.spam.label === 'SPAM') return false;
            return /\d/.test(c.text);
        });

        if (candidateComments.length === 0) return;

        let batch = this._pendingCommentBatches.get(avcode);
        if (!batch) {
            batch = {
                avcode,
                videoDuration: validDuration,
                comments: new Map()
            };
            this._pendingCommentBatches.set(avcode, batch);
        }
        if (validDuration !== 10800) {
            batch.videoDuration = validDuration;
        }

        let newCount = 0;
        for (const c of candidateComments) {
            const key = `${c.source || 'unknown'}_${c.id}`;
            // 如果内存中从未记录，或数据携带时间戳变动，则压入写回队列
            if (!this._processedCommentKeys.has(key) || (c.timestamps && c.timestamps.length > 0)) {
                this._processedCommentKeys.add(key);

                const item = {
                    id: String(c.id || ''),
                    source: c.source || 'jable',
                    user: c.user || '',
                    text: c.rawText || c.text || '',
                    time: c.time || '',
                    hasTimestamps: Array.isArray(c.timestamps) && c.timestamps.length > 0,
                    isCountdownAuto: Boolean(c.isCountdownComment),
                    countdownApplied: Boolean(c.countdownApplied),
                    timestamps: Array.isArray(c.timestamps) ? c.timestamps.map(t => ({
                        raw: t.raw,
                        seconds: t.seconds,
                        rawSeconds: t.rawSeconds !== undefined ? t.rawSeconds : (t.countdownOffsets || t.seconds),
                        isCountdown: Boolean(t.isCountdown)
                    })) : [],
                    collectedAt: Date.now()
                };

                batch.comments.set(key, item);
                newCount++;
            }
        }

        if (newCount > 0) {
            logger.debug(`[DebugCollector] 番号 ${avcode} 暂存 ${newCount} 条含数字评论待同步至 WebDAV`);
            this._scheduleCommentSync();
        }
    }

    /**
     * 调度数字评论防抖合并同步
     * @private
     */
    static _scheduleCommentSync() {
        if (this._commentSyncTimer) {
            clearTimeout(this._commentSyncTimer);
        }
        this._commentSyncTimer = setTimeout(() => {
            this._flushCommentsToWebDav();
        }, DEBOUNCE_DELAY_MS);
    }

    /**
     * 执行数字评论写回 WebDAV (下载已有 -> 字典合并 -> 上传覆盖)
     * @private
     */
    static async _flushCommentsToWebDav() {
        if (this._isCommentSyncing || this._pendingCommentBatches.size === 0) return;
        if (!this.isEnabled()) {
            this._pendingCommentBatches.clear();
            return;
        }

        this._isCommentSyncing = true;
        const batchesToFlush = new Map(this._pendingCommentBatches);
        this._pendingCommentBatches.clear();

        try {
            const config = SyncManager.getWebDavConfig();
            logger.debug('[DebugCollector] 开始执行 WebDAV 评论语料库增量合并...');

            // 1. 下载已有语料库
            let remoteData = null;
            try {
                remoteData = await WebDavClient.downloadBackup(config, COMMENTS_DEBUG_FILENAME);
            } catch (dlErr) {
                logger.debug('[DebugCollector] 远端文件尚未创建或拉取失败，将初始化新文件:', dlErr.message);
            }

            if (!remoteData || typeof remoteData !== 'object' || !remoteData.videos) {
                remoteData = {
                    schemaVersion: 1,
                    description: 'Miss Player 包含数字的评论语料库 (用于分析时间戳与倒数识别)',
                    lastUpdated: Date.now(),
                    videos: {}
                };
            }

            let totalMerged = 0;
            for (const [avcode, batch] of batchesToFlush.entries()) {
                if (!remoteData.videos[avcode]) {
                    remoteData.videos[avcode] = {
                        avcode,
                        videoDuration: batch.videoDuration,
                        updatedAt: Date.now(),
                        comments: {}
                    };
                }
                const targetVideo = remoteData.videos[avcode];
                if (batch.videoDuration && batch.videoDuration !== 10800) {
                    targetVideo.videoDuration = batch.videoDuration;
                }
                targetVideo.updatedAt = Date.now();

                for (const [key, commentObj] of batch.comments.entries()) {
                    targetVideo.comments[key] = commentObj;
                    totalMerged++;
                }
            }

            remoteData.lastUpdated = Date.now();

            // 2. 上传合并后的全量语料数据
            await WebDavClient.uploadBackup(config, remoteData, COMMENTS_DEBUG_FILENAME);
            logger.debug(`[DebugCollector] 成功写回 WebDAV: 合并 ${totalMerged} 条评论至 ${COMMENTS_DEBUG_FILENAME}`);
        } catch (err) {
            logger.warn('[DebugCollector] WebDAV 评论语料写回失败 (静默忽略):', err.message || err);
            // 写回失败时，将未提交成功的数据放回待处理批次中重试
            for (const [avcode, batch] of batchesToFlush.entries()) {
                const existing = this._pendingCommentBatches.get(avcode);
                if (existing) {
                    for (const [k, v] of batch.comments.entries()) {
                        existing.comments.set(k, v);
                    }
                } else {
                    this._pendingCommentBatches.set(avcode, batch);
                }
            }
        } finally {
            this._isCommentSyncing = false;
        }
    }

    /**
     * 收集用户手动点击调整时间倒数的样本 (Ground Truth)
     * @param {string} avcode - 番号
     * @param {Object} comment - 评论数据对象
     * @param {number} videoDuration - 视频总时长
     */
    static recordCountdownAdjustment(avcode, comment, videoDuration = 10800) {
        if (!this.isEnabled() || !comment) return;

        const validDuration = (videoDuration && !isNaN(videoDuration) && videoDuration > 0)
            ? Math.round(videoDuration)
            : 10800;

        const sampleKey = `${avcode || 'unknown'}_${comment.source || 'jable'}_${comment.id}_${comment.countdownApplied ? 'on' : 'off'}`;
        
        const sample = {
            sampleId: sampleKey,
            avcode: avcode || '',
            user: comment.user || '',
            commentId: String(comment.id || ''),
            source: comment.source || 'jable',
            videoDuration: validDuration,
            commentText: comment.rawText || comment.text || '',
            action: 'toggle_countdown',
            countdownApplied: Boolean(comment.countdownApplied),
            originalTimestamps: Array.isArray(comment.timestamps) ? comment.timestamps.map(t => ({
                raw: t.raw,
                rawSeconds: t.rawSeconds !== undefined ? t.rawSeconds : (t.countdownOffsets || t.seconds)
            })) : [],
            convertedTimestamps: Array.isArray(comment.timestamps) ? comment.timestamps.map(t => ({
                raw: t.raw,
                seconds: t.seconds,
                isCountdown: Boolean(t.isCountdown)
            })) : [],
            timestamp: Date.now()
        };

        this._pendingSamples.set(sampleKey, sample);
        logger.debug(`[DebugCollector] 捕获用户倒数调整微调样本: ${sampleKey}`);

        this._scheduleSampleSync();
    }

    /**
     * 调度倒数微调样本防抖同步 (3秒快速落盘)
     * @private
     */
    static _scheduleSampleSync() {
        if (this._sampleSyncTimer) {
            clearTimeout(this._sampleSyncTimer);
        }
        this._sampleSyncTimer = setTimeout(() => {
            this._flushSamplesToWebDav();
        }, 3000);
    }

    /**
     * 执行倒数样本写回 WebDAV
     * @private
     */
    static async _flushSamplesToWebDav() {
        if (this._isSampleSyncing || this._pendingSamples.size === 0) return;
        if (!this.isEnabled()) {
            this._pendingSamples.clear();
            return;
        }

        this._isSampleSyncing = true;
        const samplesToFlush = new Map(this._pendingSamples);
        this._pendingSamples.clear();

        try {
            const config = SyncManager.getWebDavConfig();
            logger.debug('[DebugCollector] 开始同步手动倒数调整样本至 WebDAV...');

            let remoteData = null;
            try {
                remoteData = await WebDavClient.downloadBackup(config, COUNTDOWN_SAMPLES_FILENAME);
            } catch (dlErr) {
                logger.debug('[DebugCollector] 倒数样本文件尚未创建，将初始化新文件:', dlErr.message);
            }

            if (!remoteData || typeof remoteData !== 'object' || !remoteData.samples) {
                remoteData = {
                    schemaVersion: 1,
                    description: 'Miss Player 用户手动调整倒数时间的标注样本 (Ground Truth)',
                    lastUpdated: Date.now(),
                    samples: {}
                };
            }

            for (const [key, s] of samplesToFlush.entries()) {
                remoteData.samples[key] = s;
            }
            remoteData.lastUpdated = Date.now();

            await WebDavClient.uploadBackup(config, remoteData, COUNTDOWN_SAMPLES_FILENAME);
            logger.debug(`[DebugCollector] 成功写回 ${samplesToFlush.size} 条倒数调整样本至 ${COUNTDOWN_SAMPLES_FILENAME}`);
        } catch (err) {
            logger.warn('[DebugCollector] 倒数调整样本写回失败 (静默重试):', err.message || err);
            for (const [k, v] of samplesToFlush.entries()) {
                this._pendingSamples.set(k, v);
            }
        } finally {
            this._isSampleSyncing = false;
        }
    }
}
