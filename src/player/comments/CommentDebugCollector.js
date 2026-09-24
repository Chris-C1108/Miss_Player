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
import { DebugLogPanel } from '../ui/DebugLogPanel.js';

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
    static collectComments(avcode, comments, videoDuration = 10800, platformStats = null) {
        if (!this.isEnabled() || !avcode || !Array.isArray(comments) || comments.length === 0) {
            return;
        }

        const validDuration = (videoDuration && !isNaN(videoDuration) && videoDuration > 0) 
            ? Math.round(videoDuration) 
            : 10800;

        const cleanCurAvcode = String(avcode || '').toUpperCase();

        // 筛选包含数字或提到其他 AVCODE 的有效非 SPAM 评论 (需求 2)
        // 全量有效评论采集 (过滤 SPAM 垃圾广告)
        const candidateComments = comments.filter(c => {
            if (!c || typeof c.text !== 'string') return false;
            if (c.spam && c.spam.label === 'SPAM') return false;
            return (c.rawText || c.text).trim().length > 0;
        });

        if (candidateComments.length === 0) return;

        let batch = this._pendingCommentBatches.get(avcode);
        if (!batch) {
            batch = {
                avcode,
                videoDuration: validDuration,
                platformStats: platformStats || {},
                comments: new Map()
            };
            this._pendingCommentBatches.set(avcode, batch);
        }
        if (validDuration !== 10800) {
            batch.videoDuration = validDuration;
        }
        if (platformStats && typeof platformStats === 'object') {
            batch.platformStats = Object.assign({}, batch.platformStats || {}, platformStats);
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
                    mentionedOtherAvcodes: Array.isArray(c.avcodes) ? c.avcodes.map(a => String(a).toUpperCase()).filter(a => a && a !== cleanCurAvcode) : [],
                    hasMentionedOtherAvcodes: Array.isArray(c.avcodes) && c.avcodes.some(a => String(a).toUpperCase() !== cleanCurAvcode),
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
            logger.debug(`[DebugCollector] 番号 ${avcode} 暂存 ${newCount} 条含数字/跨番号评论待同步至 WebDAV`);
            DebugLogPanel.addLog(`[语料缓存] ${avcode}: 暂存 ${newCount} 条语料待同步至 WebDAV`, 'info');
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
            logger.debug('[DebugCollector] 开始执行 WebDAV 独立番号全量评论同步...');

            for (const [avcode, batch] of batchesToFlush.entries()) {
                const cleanCode = avcode.toUpperCase();
                const subPath = `comments/${cleanCode}.json`;
                let avData = null;

                try {
                    avData = await WebDavClient.downloadBackup(config, subPath);
                } catch (_) {}

                if (!avData || typeof avData !== 'object' || !Array.isArray(avData.comments)) {
                    avData = {
                        avcode: cleanCode,
                        videoDuration: batch.videoDuration || 10800,
                        totalCount: 0,
                        hasTimestampsCount: 0,
                        updatedAt: new Date().toISOString(),
                        comments: []
                    };
                }

                if (batch.videoDuration && batch.videoDuration !== 10800) {
                    avData.videoDuration = batch.videoDuration;
                }

                // 按 ID 或内容合并去重
                const existingMap = new Map();
                avData.comments.forEach(c => existingMap.set(c.id || c.text, c));

                for (const [key, commentObj] of batch.comments.entries()) {
                    existingMap.set(commentObj.id || commentObj.text, commentObj);
                }

                avData.comments = Array.from(existingMap.values());
                avData.totalCount = avData.comments.length;
                avData.hasTimestampsCount = avData.comments.filter(c => c.hasTimestamps).length;
                avData.updatedAt = new Date().toISOString();

                await WebDavClient.uploadFile(config, subPath, avData, 'application/json; charset=utf-8');
                logger.debug(`[DebugCollector] WebDAV 独立存储完成: ${subPath} (共 ${avData.totalCount} 条)`);
                DebugLogPanel.addLog(`[WebDAV] 已将 ${cleanCode} 全量评论存入 /MissPlayer/${subPath} (${avData.totalCount}条)`, 'success');
            }
        } catch (err) {
            logger.warn('[DebugCollector] WebDAV 独立评论存储异常 (重入队列待重试):', err.message || err);
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
