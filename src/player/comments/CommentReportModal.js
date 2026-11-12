/**
 * 评论问题上报模态框 (CommentReportModal)
 * 职责：负责将存在时间解析误差、倒序或垃圾水贴等问题的单条评论同步至 Supabase 与 WebDAV
 */

import { SupabaseService } from '../../services/SupabaseService.js';
import { SyncManager } from '../../sync/index.js';
import { WebDavClient } from '../../sync/WebDavClient.js';
import { Toast, createModal } from '../../utils/index.js';
import { logger } from '../../utils/logger.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import { esc } from './CommentDataPipeline.js';

export function showCommentReportModal({ comment, videoCode }) {
    let selectedReason = "时间解析错误";
    const { modal, close } = createModal(
        `<div class="tm-report-modal-dialog"><div class="tm-custom-modal-title">评论问题上报</div><div class="tm-report-modal-hint">问题将上报至 Supabase 数据库用于算法分析与模型微调</div><div class="tm-report-modal-preview">${esc(comment.rawText || comment.text || "")}</div><div class="tm-report-chip-group"><span class="tm-report-chip active">时间解析错误</span><span class="tm-report-chip">倒序时间需过滤</span><span class="tm-report-chip">垃圾水贴</span><span class="tm-report-chip">漏抓关键片段</span></div><textarea class="tm-report-note" placeholder="附加补充说明 (可选)..."></textarea><div class="tm-report-modal-buttons"><button class="tm-custom-modal-cancel-btn">取消</button><button class="tm-custom-modal-submit-btn">提交上报</button></div></div>`,
        { extraClass: "tm-report-modal-overlay" }
    );

    const chips = modal.querySelectorAll(".tm-report-chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedReason = chip.textContent;
        });
    });

    const reportNote = modal.querySelector(".tm-report-note");
    if (reportNote) {
        const handleNoteFocus = (e) => {
            reportNote.focus({ preventScroll: true });
            if (e.cancelable && e.type === 'mousedown') {
                e.preventDefault();
            }
        };
        reportNote.addEventListener('mousedown', handleNoteFocus);
        reportNote.addEventListener('touchstart', handleNoteFocus, { passive: true });
    }

    modal.querySelector(".tm-custom-modal-cancel-btn").addEventListener("click", close);
    const submitBtn = modal.querySelector(".tm-custom-modal-submit-btn");
    submitBtn.addEventListener("click", async () => {
        const note = modal.querySelector(".tm-report-note").value.trim();
        const reportPayload = {
            videoCode,
            commentId: comment.id,
            userName: comment.user || "匿名",
            commentText: comment.rawText || comment.text || "",
            reason: selectedReason,
            userNote: note || null,
            timestamps: comment.timestamps || null,
            reportedAt: new Date().toISOString()
        };
        DebugLogPanel.addLog(`[REPORT] 评论上报: [${selectedReason}] id=${comment.id} (${videoCode})`, "warn");
        submitBtn.textContent = "上报中...";
        submitBtn.disabled = true;

        // 1. 优先上报至 Supabase 数据库
        let reportedToDb = false;
        try {
            reportedToDb = await SupabaseService.submitCommentReport(reportPayload);
        } catch (err) {
            logger.warn("[Report] Supabase 上报异常:", err);
        }

        // 2. 同时支持 WebDAV 归档备份
        const webdavConfig = SyncManager.getWebDavConfig();
        if (WebDavClient.hasValidEndpoint(webdavConfig)) {
            try {
                const now = new Date();
                const pad = (n) => String(n).padStart(2, "0");
                const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                const subPath = `logs/comment_report/${videoCode}_${ts}.json`;
                await WebDavClient.uploadFile(webdavConfig, subPath, reportPayload, "application/json; charset=utf-8");
            } catch (_) {}
        }

        if (reportedToDb) {
            Toast("上报成功！已同步至云端数据库用于改进", 2200, "success");
        } else {
            Toast("已记录上报信息至调试日志", 2000, "info");
        }
        close();
    });
}
