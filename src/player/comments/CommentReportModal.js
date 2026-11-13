import { SupabaseService } from '../../services/SupabaseService.js';
import { SyncManager } from '../../sync/index.js';
import { WebDavClient } from '../../sync/WebDavClient.js';
import { SleazyForkService } from '../../services/SleazyForkService.js';
import { Toast, createModal } from '../../utils/index.js';
import { logger } from '../../utils/logger.js';
import { DebugLogPanel } from '../ui/DebugLogPanel.js';
import { __ } from '../../constants/i18n.js';
import { esc, formatSeconds } from './CommentDataPipeline.js';

const REPORT_REASONS = [
    { code: 'false_timestamp', labelKey: 'reportReasonFalseTs' },
    { code: 'missed_or_wrong_time', labelKey: 'reportReasonMissedTs' },
    { code: 'countdown_error', labelKey: 'reportReasonCountdown' },
    { code: 'avcode_error', labelKey: 'reportReasonAvcode' },
    { code: 'spam_missed', labelKey: 'reportReasonSpam' }
];

const _submittedReportKeys = new Set();

function buildParserSnapshot(comment, flaggedItems) {
    const timestamps = (comment.timestamps || []).slice(0, 16).map(t => ({
        raw: t.raw || '',
        seconds: t.seconds,
        rawSeconds: t.rawSeconds ?? null,
        level: t.level || '',
        confidence: t.confidence || '',
        isCountdown: Boolean(t.isCountdown)
    }));
    const avcodes = (comment.avcodes || []).slice(0, 16);
    return {
        timestamps,
        avcodes,
        isCountdown: Boolean(comment.isCountdownComment),
        countdownApplied: Boolean(comment.countdownApplied),
        spam: comment.spam || null,
        flaggedItems: Array.from(flaggedItems || [])
    };
}

function formatTsBadge(ts) {
    const secStr = Array.isArray(ts.seconds)
        ? `${formatSeconds(ts.seconds[0])}~${formatSeconds(ts.seconds[1])}`
        : formatSeconds(ts.seconds);
    return `${ts.raw || secStr} → ${secStr}`;
}

/**
 * 评论纠错与问题上报弹窗（含实时解析诊断条、结构化错误分类与期望答案提示）
 */
export function showCommentReportModal({ comment, videoCode, videoDuration = null, sourceSite = null }) {
    if (!comment) return;

    const previewText = (comment.rawText || comment.text || '').slice(0, 220);
    const tsList = Array.isArray(comment.timestamps) ? comment.timestamps : [];
    const avList = Array.isArray(comment.avcodes) ? comment.avcodes : [];

    const diagItems = [];
    for (const t of tsList.slice(0, 10)) {
        diagItems.push({ key: `ts:${t.raw || t.seconds}`, label: formatTsBadge(t), kind: 'ts' });
    }
    for (const code of avList.slice(0, 10)) {
        diagItems.push({ key: `av:${code}`, label: code, kind: 'av' });
    }
    if (comment.isCountdownComment) {
        diagItems.push({
            key: 'meta:countdown',
            label: comment.countdownApplied ? __('commentCountdownConvert') : __('commentCountdownReverted'),
            kind: 'cd'
        });
    }

    const chipsHTML = REPORT_REASONS
        .map((r, i) => `<span class="tm-report-chip${i === 0 ? ' active' : ''}" data-reason-code="${r.code}">${esc(__(r.labelKey))}</span>`)
        .join('');

    const diagHTML = diagItems.length > 0
        ? diagItems.map(item => `<button type="button" class="tm-report-diag-pill is-${item.kind}" data-diag-key="${esc(item.key)}">${esc(item.label)}</button>`).join('')
        : `<span class="tm-report-diag-empty">${esc(__('reportParsedNone'))}</span>`;

    const html = `
        <div class="tm-custom-modal-title">${esc(__('reportTitle'))}</div>
        <div class="tm-report-modal-hint">${esc(__('reportHint'))}</div>
        <div class="tm-report-modal-preview">${esc(previewText)}</div>
        <div class="tm-report-diag-box">
            <div class="tm-report-diag-label">${esc(__('reportParsedTitle'))}</div>
            <div class="tm-report-diag-pills">${diagHTML}</div>
        </div>
        <div class="tm-report-chip-group">${chipsHTML}</div>
        <input type="text" class="tm-report-expect-input" placeholder="${esc(__('reportExpectPlaceholder'))}" maxlength="160" />
        <textarea class="tm-report-note" placeholder="${esc(__('reportNotePlaceholder'))}" maxlength="500"></textarea>
        <div class="tm-custom-modal-buttons tm-report-modal-buttons">
            <button type="button" class="tm-custom-modal-btn tm-custom-modal-cancel-btn">${esc(__('cancel') || '取消')}</button>
            <button type="button" class="tm-custom-modal-btn tm-custom-modal-submit-btn">${esc(__('confirm') || '提交')}</button>
        </div>
    `;

    const { modal, close } = createModal(html, { customClass: 'tm-report-modal-overlay', dialogClass: 'tm-report-modal-dialog' });

    let selectedReasonCode = REPORT_REASONS[0].code;
    let selectedReasonLabel = __(REPORT_REASONS[0].labelKey);
    const flaggedItems = new Set();

    const chips = modal.querySelectorAll('.tm-report-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedReasonCode = chip.dataset.reasonCode || 'other';
            selectedReasonLabel = chip.textContent.trim();
        });
    });

    const diagPills = modal.querySelectorAll('.tm-report-diag-pill');
    diagPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const key = pill.dataset.diagKey;
            if (!key) return;
            if (flaggedItems.has(key)) {
                flaggedItems.delete(key);
                pill.classList.remove('is-flagged');
            } else {
                flaggedItems.add(key);
                pill.classList.add('is-flagged');
            }
        });
    });

    modal.querySelector('.tm-custom-modal-cancel-btn').addEventListener('click', close);
    const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');
    submitBtn.addEventListener('click', async () => {
        const dedupKey = `${videoCode || ''}::${comment.id || ''}::${selectedReasonCode}`;
        if (_submittedReportKeys.has(dedupKey)) {
            Toast(__('reportDuplicate'), 1800, 'info');
            return;
        }

        const expectedHint = modal.querySelector('.tm-report-expect-input').value.trim();
        const note = modal.querySelector('.tm-report-note').value.trim();
        const scriptVersion = SleazyForkService.getCurrentVersion();
        const parserSnapshot = buildParserSnapshot(comment, flaggedItems);

        const reportPayload = {
            videoCode,
            commentId: comment.id,
            userName: comment.user || '匿名',
            commentText: comment.rawText || comment.text || '',
            reason: selectedReasonLabel,
            reasonCode: selectedReasonCode,
            userNote: note || null,
            expectedHint: expectedHint || null,
            scriptVersion,
            sourceSite: sourceSite || comment.source_site || comment.source || null,
            videoDuration: (typeof videoDuration === 'number' && !isNaN(videoDuration) && videoDuration > 0) ? Math.round(videoDuration) : null,
            parserSnapshot,
            timestamps: comment.timestamps || null,
            reportedAt: new Date().toISOString()
        };

        DebugLogPanel.addLog(`[REPORT] 评论上报: [${selectedReasonCode}:${selectedReasonLabel}] id=${comment.id} (${videoCode})`, 'warn');
        submitBtn.textContent = __('reportSubmitting');
        submitBtn.disabled = true;

        let reportedToDb = false;
        try {
            reportedToDb = await SupabaseService.submitCommentReport(reportPayload);
        } catch (err) {
            logger.warn('[Report] Supabase 上报异常:', err);
        }

        const webdavConfig = SyncManager.getWebDavConfig();
        if (WebDavClient.hasValidEndpoint(webdavConfig)) {
            try {
                const now = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                const subPath = `logs/comment_report/${videoCode}_${ts}.json`;
                await WebDavClient.uploadFile(webdavConfig, subPath, reportPayload, 'application/json; charset=utf-8');
            } catch (_) {}
        }

        _submittedReportKeys.add(dedupKey);
        if (reportedToDb) {
            Toast(__('reportSuccess'), 2200, 'success');
        } else {
            Toast(__('reportSavedLocal'), 2000, 'info');
        }
        close();
    });
}
