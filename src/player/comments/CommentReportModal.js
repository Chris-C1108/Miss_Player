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
    {
        code: 'false_timestamp',
        labelKey: 'reportReasonFalseTs',
        placeholderKey: 'reportPlaceholderFalseTs',
        presets: ['reportPresetScore', 'reportPresetDuration'],
        expectLike: false
    },
    {
        code: 'missed_or_wrong_time',
        labelKey: 'reportReasonMissedTs',
        placeholderKey: 'reportPlaceholderMissedTs',
        presets: ['reportPresetMissedTime', 'reportPresetWrongCalc'],
        expectLike: true
    },
    {
        code: 'countdown_error',
        labelKey: 'reportReasonCountdown',
        placeholderKey: 'reportPlaceholderCountdown',
        presets: ['reportPresetNotCd', 'reportPresetIsCd'],
        expectLike: true
    },
    {
        code: 'avcode_error',
        labelKey: 'reportReasonAvcode',
        placeholderKey: 'reportPlaceholderAvcode',
        presets: ['reportPresetFalseCode', 'reportPresetMissedCode'],
        expectLike: true
    },
    {
        code: 'spam_missed',
        labelKey: 'reportReasonSpam',
        placeholderKey: 'reportPlaceholderFalseTs',
        presets: [],
        expectLike: false
    }
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
        pipelineVersion: 'v3',
        commentHash: comment.hash_fingerprint || null,
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

function pickDefaultReasonCode(comment, previewText) {
    const tsList = Array.isArray(comment.timestamps) ? comment.timestamps : [];
    const avList = Array.isArray(comment.avcodes) ? comment.avcodes : [];
    if (comment.isCountdownComment) return 'countdown_error';
    if (tsList.length > 0) return 'false_timestamp';
    if (/\d/.test(previewText)) return 'missed_or_wrong_time';
    if (avList.length > 0) return 'avcode_error';
    return 'spam_missed';
}

/**
 * 评论纠错弹窗（ADHD 低负荷三段式 + 格莱斯高相关性布局）
 */
export function showCommentReportModal({ comment, videoCode, videoDuration = null, sourceSite = null }) {
    if (!comment) return;

    const previewText = comment.rawText || comment.text || '';
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

    const defaultReasonCode = pickDefaultReasonCode(comment, previewText);

    const chipsHTML = REPORT_REASONS
        .map((r) => `<button type="button" class="tm-report-chip${r.code === defaultReasonCode ? ' active' : ''}" data-reason-code="${r.code}">${esc(__(r.labelKey))}</button>`)
        .join('');

    const diagSectionHTML = diagItems.length > 0
        ? `<div class="tm-report-diag-box">
                <div class="tm-report-diag-label">${esc(__('reportParsedTitle'))}</div>
                <div class="tm-report-diag-pills">
                    ${diagItems.map(item => `<button type="button" class="tm-report-diag-pill is-${item.kind}" data-diag-key="${esc(item.key)}">${esc(item.label)}</button>`).join('')}
                </div>
           </div>`
        : '';

    const html = `
        <div class="tm-report-modal-dialog">
            <div class="tm-report-modal-header">
                <div class="tm-custom-modal-title">${esc(__('reportTitle'))}</div>
            </div>
            <div class="tm-report-modal-body">
                <div class="tm-report-modal-preview">${esc(previewText)}</div>
                <div class="tm-report-chip-group">${chipsHTML}</div>
                ${diagSectionHTML}
                <div class="tm-report-context-zone">
                    <div class="tm-report-quick-presets"></div>
                    <input type="text" class="tm-report-smart-input" maxlength="160" />
                    <button type="button" class="tm-report-expand-note-btn is-hidden">${esc(__('reportAddNoteBtn'))}</button>
                </div>
            </div>
            <div class="tm-report-modal-buttons">
                <button type="button" class="tm-custom-modal-cancel-btn">${esc(__('cancel') || '取消')}</button>
                <button type="button" class="tm-custom-modal-submit-btn">${esc(__('confirm') || '提交')}</button>
            </div>
        </div>
    `;

    const { modal, close } = createModal(html, { extraClass: 'tm-report-modal-overlay' });

    let selectedReasonCode = defaultReasonCode;
    let selectedReasonLabel = __(REPORT_REASONS.find(r => r.code === defaultReasonCode)?.labelKey || REPORT_REASONS[0].labelKey);
    const flaggedItems = new Set();
    const selectedPresets = new Set();
    let forceShowSpamInput = false;

    const chips = modal.querySelectorAll('.tm-report-chip');
    const presetsEl = modal.querySelector('.tm-report-quick-presets');
    const smartInput = modal.querySelector('.tm-report-smart-input');
    const expandNoteBtn = modal.querySelector('.tm-report-expand-note-btn');

    const syncContextZone = () => {
        const reasonMeta = REPORT_REASONS.find(r => r.code === selectedReasonCode) || REPORT_REASONS[0];
        smartInput.placeholder = __(reasonMeta.placeholderKey);

        // 根据类型渲染一键免打字快捷胶囊
        presetsEl.innerHTML = '';
        if (reasonMeta.presets.length > 0) {
            presetsEl.classList.remove('is-hidden');
            for (const presetKey of reasonMeta.presets) {
                const label = __(presetKey);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `tm-report-preset-btn${selectedPresets.has(label) ? ' active' : ''}`;
                btn.textContent = label;
                btn.addEventListener('click', () => {
                    if (selectedPresets.has(label)) {
                        selectedPresets.delete(label);
                        btn.classList.remove('active');
                    } else {
                        selectedPresets.add(label);
                        btn.classList.add('active');
                    }
                });
                presetsEl.appendChild(btn);
            }
        } else {
            presetsEl.classList.add('is-hidden');
        }

        // 水贴举报默认隐藏输入框实现 1-Tap 提交；其余场景仅保留 1 个直觉输入框
        const isSpamWithoutInput = selectedReasonCode === 'spam_missed' && !forceShowSpamInput && !smartInput.value.trim();
        smartInput.classList.toggle('is-hidden', isSpamWithoutInput);
        expandNoteBtn.classList.toggle('is-hidden', !isSpamWithoutInput);
    };

    const selectReasonByCode = (code) => {
        const target = Array.from(chips).find(c => c.dataset.reasonCode === code);
        if (!target) return;
        chips.forEach(c => c.classList.remove('active'));
        target.classList.add('active');
        if (selectedReasonCode !== code) {
            selectedPresets.clear();
            forceShowSpamInput = false;
        }
        selectedReasonCode = target.dataset.reasonCode || 'other';
        selectedReasonLabel = target.textContent.trim();
        syncContextZone();
    };

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            selectReasonByCode(chip.dataset.reasonCode || 'other');
        });
    });

    expandNoteBtn.addEventListener('click', () => {
        forceShowSpamInput = true;
        syncContextZone();
        smartInput.focus();
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
                if (key.startsWith('av:')) selectReasonByCode('avcode_error');
                else if (key === 'meta:countdown') selectReasonByCode('countdown_error');
                else if (key.startsWith('ts:')) selectReasonByCode('false_timestamp');
            }
        });
    });

    syncContextZone();

    modal.querySelector('.tm-custom-modal-cancel-btn').addEventListener('click', close);
    const submitBtn = modal.querySelector('.tm-custom-modal-submit-btn');
    submitBtn.addEventListener('click', async () => {
        const dedupKey = `${videoCode || ''}::${comment.id || ''}::${selectedReasonCode}`;
        if (_submittedReportKeys.has(dedupKey)) {
            Toast(__('reportDuplicate'), 1800, 'info');
            return;
        }

        const rawInput = smartInput.value.trim();
        const reasonMeta = REPORT_REASONS.find(r => r.code === selectedReasonCode) || REPORT_REASONS[0];
        const presetText = Array.from(selectedPresets).join('；');

        // 将单输入框内容按当前问题类型精准映射回 expectedHint / userNote
        const expectedHint = (reasonMeta.expectLike && rawInput) ? rawInput : null;
        const noteParts = [];
        if (presetText) noteParts.push(presetText);
        if (!reasonMeta.expectLike && rawInput) noteParts.push(rawInput);
        const note = noteParts.join(' | ');

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
            expectedHint,
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
