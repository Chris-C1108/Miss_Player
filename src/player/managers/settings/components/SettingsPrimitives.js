import { ICON_CHEVRON_RIGHT, ICON_EYE, ICON_EYE_OFF, ICON_PLUS } from '../../../../constants/icons.js';
import { __ } from '../../../../constants/i18n.js';

/**
 * 统一设置界面输入焦点定位：对齐外层 `.tm-settings-scroll-body` 独立滚动视口
 */
export function scrollFieldIntoSettingsView(el) {
    if (!el || typeof el.addEventListener !== 'function') return;
    el.addEventListener('focus', () => {
        const scrollBody = el.closest('.tm-settings-scroll-body, .tm-settings-panel');
        if (!scrollBody) return;
        setTimeout(() => {
            const elRect = el.getBoundingClientRect();
            const bodyRect = scrollBody.getBoundingClientRect();
            const targetTop = scrollBody.scrollTop + (elRect.top - bodyRect.top) - 24;
            scrollBody.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }, 120);
    });
}

/**
 * 标准分组标头（唯一规范：11px 衬托小标题）
 */
export function createGroupHeader(title) {
    const header = document.createElement('div');
    header.className = 'tm-settings-group-header';
    header.textContent = title;
    return header;
}

/**
 * 标准两级导航入口行（左侧图标/主副标题 + 右侧状态摘要 + 箭头）
 */
export function createNavRow({
    iconHtml = '',
    title = '',
    subtext = '',
    badgeText = '',
    badgeTone = 'neutral', // 'neutral' | 'success' | 'warn' | 'error' | 'accent'
    disabled = false,
    onClick = null,
    className = ''
} = {}) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tm-apple-row tm-settings-nav-row${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`;

    const left = document.createElement('div');
    left.className = 'tm-settings-nav-left';

    if (iconHtml) {
        const iconWrap = document.createElement('span');
        iconWrap.className = 'tm-settings-nav-icon';
        iconWrap.innerHTML = iconHtml;
        left.appendChild(iconWrap);
    }

    const textWrap = document.createElement('div');
    textWrap.className = 'tm-apple-row-left';

    const titleEl = document.createElement('span');
    titleEl.className = 'tm-apple-row-title';
    titleEl.textContent = title;
    textWrap.appendChild(titleEl);

    const subEl = document.createElement('span');
    subEl.className = 'tm-apple-row-subtext';
    if (subtext) {
        subEl.textContent = subtext;
    } else {
        subEl.classList.add('is-hidden');
    }
    textWrap.appendChild(subEl);
    left.appendChild(textWrap);

    const right = document.createElement('div');
    right.className = 'tm-settings-nav-right';

    const badge = document.createElement('span');
    badge.className = `tm-settings-status-pill is-${badgeTone}`;
    if (badgeText) {
        badge.textContent = badgeText;
    } else {
        badge.classList.add('is-hidden');
    }

    const chevron = document.createElement('span');
    chevron.className = 'tm-settings-nav-chevron';
    chevron.innerHTML = ICON_CHEVRON_RIGHT;

    right.appendChild(badge);
    right.appendChild(chevron);

    row.appendChild(left);
    row.appendChild(right);

    if (typeof onClick === 'function') {
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            if (row.classList.contains('is-disabled')) return;
            onClick(e);
        });
    }

    row._updateSummary = ({ text, tone = 'neutral', subtext: nextSub, disabled: nextDisabled } = {}) => {
        if (text !== undefined) {
            badge.textContent = text;
            badge.classList.toggle('is-hidden', !text);
        }
        badge.className = `tm-settings-status-pill is-${tone}${!badge.textContent ? ' is-hidden' : ''}`;
        if (nextSub !== undefined) {
            subEl.textContent = nextSub;
            subEl.classList.toggle('is-hidden', !nextSub);
        }
        if (nextDisabled !== undefined) {
            row.classList.toggle('is-disabled', Boolean(nextDisabled));
        }
    };

    return row;
}

/**
 * 标准紧凑数字输入框行（左主副标题，右输入框 + 单位）
 */
export function createValueRow({
    title = '',
    subtext = '',
    value = '',
    min = 1,
    max = 999,
    step = 1,
    unit = '',
    onCommit = null,
    className = ''
} = {}) {
    const row = document.createElement('div');
    row.className = `tm-apple-row${className ? ` ${className}` : ''}`;

    const left = document.createElement('div');
    left.className = 'tm-apple-row-left';

    const titleEl = document.createElement('span');
    titleEl.className = 'tm-apple-row-title';
    titleEl.textContent = title;
    left.appendChild(titleEl);

    if (subtext) {
        const subEl = document.createElement('span');
        subEl.className = 'tm-apple-row-subtext';
        subEl.textContent = subtext;
        left.appendChild(subEl);
    }

    const right = document.createElement('div');
    right.className = 'tm-settings-inline-input-group';

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'tm-settings-num-input';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    scrollFieldIntoSettingsView(input);

    input.addEventListener('change', (e) => {
        if (typeof onCommit === 'function') {
            onCommit(input.value, input, e);
        }
    });

    right.appendChild(input);

    if (unit) {
        const unitEl = document.createElement('span');
        unitEl.className = 'tm-settings-unit-text';
        unitEl.textContent = unit;
        right.appendChild(unitEl);
    }

    row.appendChild(left);
    row.appendChild(right);
    row._input = input;
    return row;
}

/**
 * 标准动作行（支持普通动作与内联二次点击确认的危险动作，杜绝 window.confirm 弹窗）
 */
export function createActionRow({
    iconHtml = '',
    title = '',
    subtext = '',
    actionLabel = '',
    tone = 'accent', // 'accent' | 'neutral' | 'danger'
    confirmTwice = false,
    confirmText = '',
    onAction = null,
    className = ''
} = {}) {
    const row = document.createElement('div');
    row.className = `tm-apple-row tm-settings-action-row${className ? ` ${className}` : ''}`;

    const left = document.createElement('div');
    left.className = 'tm-apple-row-left';

    const titleEl = document.createElement('span');
    titleEl.className = `tm-apple-row-title${tone === 'danger' ? ' is-danger' : ''}`;
    titleEl.textContent = title;
    left.appendChild(titleEl);

    const subEl = document.createElement('span');
    subEl.className = 'tm-apple-row-subtext';
    if (subtext) {
        subEl.textContent = subtext;
    } else {
        subEl.classList.add('is-hidden');
    }
    left.appendChild(subEl);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tm-settings-action-btn is-${tone}`;

    const setBtnContent = (label) => {
        btn.innerHTML = iconHtml ? `<span class="tm-settings-action-icon">${iconHtml}</span><span>${label}</span>` : label;
    };
    setBtnContent(actionLabel);

    let confirmTimer = null;
    let armed = false;
    const disarm = () => {
        armed = false;
        if (confirmTimer) {
            clearTimeout(confirmTimer);
            confirmTimer = null;
        }
        btn.classList.remove('is-armed');
        setBtnContent(actionLabel);
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        if (confirmTwice && !armed) {
            armed = true;
            btn.classList.add('is-armed');
            btn.textContent = confirmText || __('confirmActionPrompt') || '再次点击确认';
            confirmTimer = setTimeout(disarm, 3000);
            return;
        }
        disarm();
        if (typeof onAction === 'function') {
            onAction(btn, {
                setLabel: setBtnContent,
                setSubtext: (next) => {
                    subEl.textContent = next || '';
                    subEl.classList.toggle('is-hidden', !next);
                }
            });
        }
    });

    row.appendChild(left);
    row.appendChild(btn);
    row._button = btn;
    row._subEl = subEl;
    return row;
}

/**
 * 标准表单输入行（统一服务 WebDAV / Peach / Beta 等文本输入）
 */
export function createFieldRow({
    label = '',
    hint = '',
    type = 'text',
    value = '',
    placeholder = '',
    withEyeToggle = false,
    withClearBtn = false,
    onChange = null,
    onInput = null,
    onClear = null,
    className = ''
} = {}) {
    const row = document.createElement('div');
    row.className = `tm-apple-row tm-apple-row--column tm-settings-field-row${className ? ` ${className}` : ''}`;

    const labelRow = document.createElement('div');
    labelRow.className = 'tm-settings-field-head';

    const labelEl = document.createElement('span');
    labelEl.className = 'tm-apple-row-title';
    labelEl.textContent = label;
    labelRow.appendChild(labelEl);

    if (hint) {
        const hintEl = document.createElement('span');
        hintEl.className = 'tm-apple-row-subtext';
        hintEl.textContent = hint;
        labelRow.appendChild(hintEl);
    }

    const inputShell = document.createElement('div');
    inputShell.className = 'tm-settings-field-shell';

    const input = document.createElement('input');
    input.type = type;
    input.className = 'tm-settings-field-input';
    input.value = value || '';
    if (placeholder) input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    scrollFieldIntoSettingsView(input);

    inputShell.appendChild(input);

    let eyeBtn = null;
    if (withEyeToggle) {
        eyeBtn = document.createElement('button');
        eyeBtn.type = 'button';
        eyeBtn.className = 'tm-settings-field-icon-btn';
        eyeBtn.innerHTML = ICON_EYE;
        eyeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isPwd = input.type === 'password';
            input.type = isPwd ? 'text' : 'password';
            eyeBtn.innerHTML = isPwd ? ICON_EYE_OFF : ICON_EYE;
        });
        inputShell.appendChild(eyeBtn);
    }

    let clearBtn = null;
    if (withClearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = `tm-settings-field-clear-btn${input.value ? '' : ' is-hidden'}`;
        clearBtn.textContent = '清除';
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            clearBtn.classList.add('is-hidden');
            if (typeof onClear === 'function') onClear(input);
        });
        inputShell.appendChild(clearBtn);
    }

    input.addEventListener('input', (e) => {
        if (clearBtn) {
            clearBtn.classList.toggle('is-hidden', !input.value.trim());
        }
        if (typeof onInput === 'function') onInput(input.value, input, e);
    });

    input.addEventListener('change', (e) => {
        if (typeof onChange === 'function') onChange(input.value, input, e);
    });

    row.appendChild(labelRow);
    row.appendChild(inputShell);
    row._input = input;
    row._clearBtn = clearBtn;
    return row;
}

/**
 * 统一顶部状态横幅（矢量图标 + 标题 + 副标题 + 状态胶囊）
 */
export function createStatusBanner({
    iconHtml = '',
    title = '',
    detail = '',
    badgeText = '',
    tone = 'neutral' // 'neutral' | 'success' | 'warn' | 'error' | 'accent'
} = {}) {
    const banner = document.createElement('div');
    banner.className = `tm-settings-status-banner is-${tone}`;

    if (iconHtml) {
        const iconEl = document.createElement('div');
        iconEl.className = 'tm-settings-status-banner-icon';
        iconEl.innerHTML = iconHtml;
        banner.appendChild(iconEl);
    }

    const body = document.createElement('div');
    body.className = 'tm-settings-status-banner-body';

    const titleEl = document.createElement('div');
    titleEl.className = 'tm-settings-status-banner-title';
    titleEl.textContent = title;
    body.appendChild(titleEl);

    const detailEl = document.createElement('div');
    detailEl.className = 'tm-settings-status-banner-detail';
    if (detail) {
        detailEl.textContent = detail;
    } else {
        detailEl.classList.add('is-hidden');
    }
    body.appendChild(detailEl);

    const pill = document.createElement('span');
    pill.className = `tm-settings-status-pill is-${tone}`;
    if (badgeText) {
        pill.textContent = badgeText;
    } else {
        pill.classList.add('is-hidden');
    }

    banner.appendChild(body);
    banner.appendChild(pill);

    banner._update = ({ title: nextTitle, detail: nextDetail, badgeText: nextBadge, tone: nextTone = tone } = {}) => {
        banner.className = `tm-settings-status-banner is-${nextTone}`;
        if (nextTitle !== undefined) titleEl.textContent = nextTitle;
        if (nextDetail !== undefined) {
            detailEl.textContent = nextDetail;
            detailEl.classList.toggle('is-hidden', !nextDetail);
        }
        if (nextBadge !== undefined) {
            pill.textContent = nextBadge;
        }
        pill.className = `tm-settings-status-pill is-${nextTone}${!pill.textContent ? ' is-hidden' : ''}`;
    };

    return banner;
}

/**
 * 统一多选芯片与内联新增列表（服务评论数据源、快进退步长等）
 */
export function createPillSelector({
    items = [], // [{ id, label, active, locked?, removable?, title? }]
    allowAdd = false,
    addPlaceholder = '',
    onToggle = null,
    onDelete = null,
    onAdd = null
} = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'tm-settings-pill-grid';

    const renderPills = (nextItems = items) => {
        wrap.innerHTML = '';
        nextItems.forEach((item) => {
            const chipWrap = document.createElement('div');
            chipWrap.className = 'tm-settings-pill-item';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `tm-settings-pill-btn${item.active ? ' is-active' : ''}${item.locked ? ' is-locked' : ''}`;
            btn.textContent = item.label;
            if (item.title) btn.title = item.title;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof onToggle === 'function') onToggle(item.id, item);
            });
            chipWrap.appendChild(btn);

            if (item.removable) {
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'tm-settings-pill-del';
                delBtn.textContent = '×';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof onDelete === 'function') onDelete(item.id, item);
                });
                chipWrap.appendChild(delBtn);
            }

            wrap.appendChild(chipWrap);
        });

        if (allowAdd) {
            const addTrigger = document.createElement('button');
            addTrigger.type = 'button';
            addTrigger.className = 'tm-settings-pill-add-btn';
            addTrigger.innerHTML = `${ICON_PLUS}<span>添加</span>`;

            const inlineForm = document.createElement('div');
            inlineForm.className = 'tm-settings-pill-inline-form is-hidden';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'tm-settings-pill-inline-input';
            input.placeholder = addPlaceholder || __('addStepPrompt') || '输入如 45s / 2m';
            input.autocomplete = 'off';
            scrollFieldIntoSettingsView(input);

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = 'tm-settings-pill-inline-submit';
            confirmBtn.textContent = '确定';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'tm-settings-pill-inline-cancel';
            cancelBtn.textContent = '取消';

            const closeInline = () => {
                input.value = '';
                inlineForm.classList.add('is-hidden');
                addTrigger.classList.remove('is-hidden');
            };

            const submitInline = () => {
                const val = input.value.trim();
                if (!val) {
                    closeInline();
                    return;
                }
                if (typeof onAdd === 'function') {
                    const accepted = onAdd(val);
                    if (accepted !== false) {
                        closeInline();
                    }
                }
            };

            addTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                addTrigger.classList.add('is-hidden');
                inlineForm.classList.remove('is-hidden');
                setTimeout(() => input.focus(), 30);
            });

            confirmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                submitInline();
            });
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeInline();
            });
            input.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
                    e.preventDefault();
                    submitInline();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeInline();
                }
            });

            inlineForm.appendChild(input);
            inlineForm.appendChild(confirmBtn);
            inlineForm.appendChild(cancelBtn);
            wrap.appendChild(addTrigger);
            wrap.appendChild(inlineForm);
        }
    };

    renderPills(items);
    wrap._update = (nextItems) => renderPills(nextItems);
    return wrap;
}
