import { ICON_CHEVRON_RIGHT } from '../../../../constants/icons.js';

/**
 * S2Primitives.js — Settings v2 统一原子组件库
 * 严格遵循零内联 style="..."、单一状态类调度 (.is-checked / .is-active / .is-expanded / .is-hidden)
 */

export function createGroup(labelText) {
    const group = document.createElement('section');
    group.className = 'mp-s2-group';

    if (labelText) {
        const label = document.createElement('div');
        label.className = 'mp-s2-group-label';
        label.textContent = labelText;
        group.appendChild(label);
    }

    return group;
}

export function createCard() {
    const card = document.createElement('div');
    card.className = 'mp-s2-card';
    return card;
}

export function createPill(text = '', tone = 'muted') {
    const pill = document.createElement('span');
    pill.className = `mp-s2-pill mp-s2-pill--${tone}`;
    pill.textContent = text;
    return pill;
}

export function updatePill(pill, text, tone = 'muted') {
    if (!pill) return;
    pill.className = `mp-s2-pill mp-s2-pill--${tone}`;
    pill.textContent = text;
}

export function createToggleRow({
    title = '',
    subtext = '',
    checked = false,
    onChange = null,
    className = ''
} = {}) {
    const row = document.createElement('div');
    row.className = `mp-s2-row mp-s2-row--clickable ${className}`.trim();

    const textCol = document.createElement('div');
    textCol.className = 'mp-s2-row-text';

    const titleEl = document.createElement('div');
    titleEl.className = 'mp-s2-row-title';
    titleEl.textContent = title;
    textCol.appendChild(titleEl);

    if (subtext) {
        const subEl = document.createElement('div');
        subEl.className = 'mp-s2-row-sub';
        subEl.textContent = subtext;
        textCol.appendChild(subEl);
    }

    const switchBtn = document.createElement('button');
    switchBtn.type = 'button';
    switchBtn.className = `mp-s2-switch ${checked ? 'is-checked' : ''}`.trim();
    switchBtn.setAttribute('role', 'switch');
    switchBtn.setAttribute('aria-checked', String(Boolean(checked)));
    switchBtn.innerHTML = '<span class="mp-s2-switch-thumb"></span>';

    let current = Boolean(checked);
    const setChecked = (next, emit = false) => {
        const boolVal = Boolean(next);
        if (current === boolVal && emit) return;
        current = boolVal;
        switchBtn.classList.toggle('is-checked', current);
        switchBtn.setAttribute('aria-checked', String(current));
        if (emit && typeof onChange === 'function') {
            onChange(current);
        }
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        setChecked(!current, true);
    };

    row.addEventListener('click', handleToggle);
    switchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleToggle(e);
    });

    row.appendChild(textCol);
    row.appendChild(switchBtn);

    return {
        element: row,
        setChecked,
        getChecked: () => current
    };
}

export function createSegmentedControl({
    options = [],
    value = '',
    onChange = null,
    fullWidth = false
} = {}) {
    const wrap = document.createElement('div');
    wrap.className = `mp-s2-segment ${fullWidth ? 'mp-s2-segment--full' : ''}`.trim();

    let current = value || (options[0] ? options[0].value : '');
    const buttons = [];

    const setValue = (nextVal, emit = false) => {
        if (current === nextVal && emit) return;
        current = nextVal;
        buttons.forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.value === current);
        });
        if (emit && typeof onChange === 'function') {
            onChange(current);
        }
    };

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mp-s2-segment-btn ${opt.value === current ? 'is-active' : ''}`.trim();
        btn.textContent = opt.label;
        btn.dataset.value = opt.value;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setValue(opt.value, true);
        });
        buttons.push(btn);
        wrap.appendChild(btn);
    });

    return {
        element: wrap,
        setValue,
        getValue: () => current
    };
}

export function createSegmentedRow({
    title = '',
    subtext = '',
    options = [],
    value = '',
    onChange = null,
    stacked = false
} = {}) {
    const row = document.createElement('div');
    row.className = `mp-s2-row ${stacked ? 'mp-s2-row--stacked' : ''}`.trim();

    const textCol = document.createElement('div');
    textCol.className = 'mp-s2-row-text';

    const titleEl = document.createElement('div');
    titleEl.className = 'mp-s2-row-title';
    titleEl.textContent = title;
    textCol.appendChild(titleEl);

    if (subtext) {
        const subEl = document.createElement('div');
        subEl.className = 'mp-s2-row-sub';
        subEl.textContent = subtext;
        textCol.appendChild(subEl);
    }

    const seg = createSegmentedControl({
        options,
        value,
        onChange,
        fullWidth: stacked
    });

    row.appendChild(textCol);
    row.appendChild(seg.element);

    return {
        element: row,
        control: seg
    };
}

export function bindFocusScroll(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener('focus', () => {
        const scroller = inputEl.closest('.mp-s2-scroll');
        if (!scroller) return;
        setTimeout(() => {
            const elRect = inputEl.getBoundingClientRect();
            const scrollerRect = scroller.getBoundingClientRect();
            const targetTop = scroller.scrollTop + (elRect.top - scrollerRect.top) - 72;
            scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }, 140);
    });
}

export function createField({
    label = '',
    type = 'text',
    value = '',
    placeholder = '',
    onChange = null,
    onInput = null,
    onPaste = null,
    trailingEl = null
} = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'mp-s2-field';

    if (label) {
        const labelEl = document.createElement('label');
        labelEl.className = 'mp-s2-field-label';
        labelEl.textContent = label;
        wrap.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.type = type;
    input.className = 'mp-s2-input';
    input.placeholder = placeholder;
    input.value = value ?? '';

    bindFocusScroll(input);

    if (typeof onChange === 'function') {
        input.addEventListener('change', () => onChange(input.value, input));
    }
    if (typeof onInput === 'function') {
        input.addEventListener('input', () => onInput(input.value, input));
    }
    if (typeof onPaste === 'function') {
        input.addEventListener('paste', (e) => onPaste(e, input));
    }

    if (trailingEl) {
        const row = document.createElement('div');
        row.className = 'mp-s2-input-row';
        row.appendChild(input);
        row.appendChild(trailingEl);
        wrap.appendChild(row);
    } else {
        wrap.appendChild(input);
    }

    return {
        element: wrap,
        input
    };
}

/**
 * 创建统一平级手风琴卡片 (Option B)
 */
export function createAccordionCard({
    iconSvg = '',
    title = '',
    statusText = '',
    statusTone = 'muted',
    expanded = false,
    onToggle = null,
    buildBody = null
} = {}) {
    const card = createCard();
    card.classList.add('mp-s2-accordion');
    if (expanded) card.classList.add('is-expanded');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mp-s2-accordion-trigger';
    trigger.setAttribute('aria-expanded', String(Boolean(expanded)));

    const left = document.createElement('div');
    left.className = 'mp-s2-accordion-left';

    if (iconSvg) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'mp-s2-accordion-icon';
        iconSpan.innerHTML = iconSvg;
        left.appendChild(iconSpan);
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'mp-s2-accordion-title';
    titleSpan.textContent = title;
    left.appendChild(titleSpan);

    const right = document.createElement('div');
    right.className = 'mp-s2-accordion-right';

    const pill = statusText ? createPill(statusText, statusTone) : null;
    if (pill) right.appendChild(pill);

    const chevron = document.createElement('span');
    chevron.className = 'mp-s2-chevron';
    chevron.innerHTML = ICON_CHEVRON_RIGHT;
    right.appendChild(chevron);

    trigger.appendChild(left);
    trigger.appendChild(right);

    const body = document.createElement('div');
    body.className = `mp-s2-accordion-body ${expanded ? '' : 'is-hidden'}`.trim();

    let isOpen = Boolean(expanded);
    let bodyBuilt = false;

    const ensureBody = () => {
        if (!bodyBuilt && typeof buildBody === 'function') {
            bodyBuilt = true;
            buildBody(body, {
                setStatus: (text, tone) => pill && updatePill(pill, text, tone)
            });
        }
    };

    if (isOpen) {
        ensureBody();
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        card.classList.toggle('is-expanded', isOpen);
        body.classList.toggle('is-hidden', !isOpen);
        trigger.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            ensureBody();
        }
        if (typeof onToggle === 'function') {
            onToggle(isOpen);
        }
    });

    card.appendChild(trigger);
    card.appendChild(body);

    return {
        element: card,
        body,
        pill,
        setStatus: (text, tone) => pill && updatePill(pill, text, tone),
        setExpanded: (next) => {
            isOpen = Boolean(next);
            card.classList.toggle('is-expanded', isOpen);
            body.classList.toggle('is-hidden', !isOpen);
            trigger.setAttribute('aria-expanded', String(isOpen));
            if (isOpen) ensureBody();
        }
    };
}

/**
 * 两段式防误触确认按钮 (免除原生 window.confirm 阻塞)
 */
export function bindTwoStepConfirm(btn, {
    normalHtml,
    confirmText = '确认执行?',
    onConfirm,
    timeoutMs = 3000
} = {}) {
    let awaitingConfirm = false;
    let resetTimer = null;

    const reset = () => {
        awaitingConfirm = false;
        if (resetTimer) {
            clearTimeout(resetTimer);
            resetTimer = null;
        }
        btn.classList.remove('mp-s2-btn--confirming');
        if (normalHtml !== undefined) {
            btn.innerHTML = normalHtml;
        }
    };

    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        if (!awaitingConfirm) {
            awaitingConfirm = true;
            btn.classList.add('mp-s2-btn--confirming');
            btn.textContent = confirmText;
            resetTimer = setTimeout(reset, timeoutMs);
            return;
        }
        reset();
        if (typeof onConfirm === 'function') {
            await onConfirm();
        }
    });

    return { reset };
}
