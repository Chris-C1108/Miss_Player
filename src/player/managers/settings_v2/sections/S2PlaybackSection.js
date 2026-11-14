import {
    createGroup,
    createCard,
    createToggleRow,
    createSegmentedRow
} from '../components/S2Primitives.js';
import { Toast, isImeConfirmEnter } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';

export class S2PlaybackSection {
    constructor(settingsManager, refreshFn = null) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.refreshFn = refreshFn;
        this.element = createGroup(__('playbackGroupTitle') || '播放与控制');
        this._render();
    }

    getElement() {
        return this.element;
    }

    _sanitizeStepValue(raw) {
        const val = String(raw || '').trim().toLowerCase();
        if (!/^\d+[sm]$/.test(val)) return null;
        const num = parseInt(val, 10);
        if (num <= 0 || num > 999) return null;
        return val;
    }

    _buildSeekStepsSubbox() {
        const subbox = document.createElement('div');
        subbox.className = `mp-s2-subbox ${this.settings.showSeekControlRow !== false ? '' : 'is-hidden'}`.trim();

        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'mp-s2-chips';

        const defaultSteps = ['5s', '10s', '30s', '1m', '5m', '10m'];
        const customSteps = Array.isArray(this.settings.customSeekSteps) ? this.settings.customSeekSteps : [];
        const enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? [...this.settings.enabledSeekSteps] : [...defaultSteps];

        const renderChips = () => {
            chipsWrap.innerHTML = '';
            const allSteps = [...defaultSteps];
            customSteps.forEach(s => {
                if (!allSteps.includes(s)) allSteps.push(s);
            });

            allSteps.forEach(stepKey => {
                const isDefault = defaultSteps.includes(stepKey);
                const isEnabled = enabledSteps.includes(stepKey);

                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = `mp-s2-chip ${isEnabled ? 'is-active' : ''}`.trim();

                const labelSpan = document.createElement('span');
                labelSpan.textContent = stepKey;
                chip.appendChild(labelSpan);

                if (!isDefault) {
                    const rm = document.createElement('span');
                    rm.className = 'mp-s2-chip-remove';
                    rm.textContent = '×';
                    rm.title = '删除自定义步长';
                    rm.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const cIdx = customSteps.indexOf(stepKey);
                        if (cIdx !== -1) customSteps.splice(cIdx, 1);
                        const eIdx = enabledSteps.indexOf(stepKey);
                        if (eIdx !== -1) enabledSteps.splice(eIdx, 1);
                        this.sm.updateSetting('customSeekSteps', [...customSteps]);
                        this.sm.updateSetting('enabledSeekSteps', [...enabledSteps]);
                        this.sm.rebuildControlPanelSeekRow();
                        renderChips();
                    });
                    chip.appendChild(rm);
                }

                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = enabledSteps.indexOf(stepKey);
                    if (idx !== -1) {
                        if (enabledSteps.length <= 1) {
                            Toast(__('atLeastOneSeekStep') || '至少保留一个跳转步长', 1800, 'warning');
                            return;
                        }
                        enabledSteps.splice(idx, 1);
                    } else {
                        enabledSteps.push(stepKey);
                    }
                    this.sm.updateSetting('enabledSeekSteps', [...enabledSteps]);
                    this.sm.rebuildControlPanelSeekRow();
                    renderChips();
                });

                chipsWrap.appendChild(chip);
            });

            // 内联自定义步长输入 (免除 window.prompt)
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'mp-s2-chip mp-s2-chip--add';
            addBtn.textContent = __('s2CustomAdd') || '+ 自定义';

            const inputWrap = document.createElement('div');
            inputWrap.className = 'mp-s2-chip-input-wrap is-hidden';

            const stepInput = document.createElement('input');
            stepInput.type = 'text';
            stepInput.className = 'mp-s2-chip-input';
            stepInput.placeholder = '如 15s';
            stepInput.maxLength = 6;

            const confirmAddBtn = document.createElement('button');
            confirmAddBtn.type = 'button';
            confirmAddBtn.className = 'mp-s2-chip is-active';
            confirmAddBtn.textContent = '✓';

            const commitCustomStep = () => {
                const parsed = this._sanitizeStepValue(stepInput.value);
                if (!parsed) {
                    Toast('格式如 15s 或 2m', 1800, 'warning');
                    stepInput.focus();
                    return;
                }
                if (!defaultSteps.includes(parsed) && !customSteps.includes(parsed)) {
                    customSteps.push(parsed);
                    this.sm.updateSetting('customSeekSteps', [...customSteps]);
                }
                if (!enabledSteps.includes(parsed)) {
                    enabledSteps.push(parsed);
                    this.sm.updateSetting('enabledSeekSteps', [...enabledSteps]);
                }
                this.sm.rebuildControlPanelSeekRow();
                renderChips();
            };

            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addBtn.classList.add('is-hidden');
                inputWrap.classList.remove('is-hidden');
                stepInput.value = '';
                stepInput.focus();
            });

            confirmAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                commitCustomStep();
            });

            stepInput.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (isImeConfirmEnter(e)) {
                    e.preventDefault();
                    commitCustomStep();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    inputWrap.classList.add('is-hidden');
                    addBtn.classList.remove('is-hidden');
                }
            });

            inputWrap.appendChild(stepInput);
            inputWrap.appendChild(confirmAddBtn);
            chipsWrap.appendChild(addBtn);
            chipsWrap.appendChild(inputWrap);
        };

        renderChips();
        subbox.appendChild(chipsWrap);
        return subbox;
    }

    _buildDurationStepperRow() {
        const row = document.createElement('div');
        row.className = 'mp-s2-row mp-s2-row--stacked';

        const textCol = document.createElement('div');
        textCol.className = 'mp-s2-row-text';

        const titleEl = document.createElement('div');
        titleEl.className = 'mp-s2-row-title';
        titleEl.textContent = __('s2ClipDurations') || '快览与连播时长';
        textCol.appendChild(titleEl);

        const grid = document.createElement('div');
        grid.className = 'mp-s2-stepper-grid';

        const createCell = (label, settingKey, fallbackVal) => {
            const cell = document.createElement('div');
            cell.className = 'mp-s2-stepper-cell';

            const lbl = document.createElement('span');
            lbl.className = 'mp-s2-stepper-label';
            lbl.textContent = label;

            const box = document.createElement('div');
            box.className = 'mp-s2-stepper-box';

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '3';
            input.max = '300';
            input.className = 'mp-s2-num-input';
            input.value = String(this.settings[settingKey] ?? fallbackVal);

            input.addEventListener('change', () => {
                let val = parseInt(input.value, 10);
                if (Number.isNaN(val) || val < 3) val = 3;
                if (val > 300) val = 300;
                input.value = String(val);
                this.sm.updateSetting(settingKey, val);
                if (this.sm.controlManager && typeof this.sm.controlManager.updateBetaPlayModeUI === 'function') {
                    this.sm.controlManager.updateBetaPlayModeUI();
                }
                Toast(`${label}已设为 ${val} 秒`, 1200, 'info');
            });

            const unit = document.createElement('span');
            unit.className = 'mp-s2-unit';
            unit.textContent = 's';

            box.appendChild(input);
            box.appendChild(unit);
            cell.appendChild(lbl);
            cell.appendChild(box);
            return cell;
        };

        grid.appendChild(createCell(__('modePreviewShort') || '快览', 'previewDurationSeconds', 5));
        grid.appendChild(createCell(__('modeReplayShort') || '连播', 'climaxDurationSeconds', 60));

        row.appendChild(textCol);
        row.appendChild(grid);
        return row;
    }

    _render() {
        const oldLabel = this.element.querySelector('.mp-s2-group-label');
        this.element.innerHTML = '';
        if (oldLabel) this.element.appendChild(oldLabel);

        const card = createCard();

        // 1. 遥控器运行模式
        const remoteRow = createSegmentedRow({
            title: __('s2RemoteMode') || '遥控器模式',
            options: [
                { label: __('s2RemotePrecise') || '精准', value: 'precise' },
                { label: __('s2RemoteStandard') || '标准', value: 'standard' }
            ],
            value: this.settings.remoteControlMode || 'precise',
            onChange: (val) => {
                this.sm.updateSetting('remoteControlMode', val);
                if (this.sm.controlManager && typeof this.sm.controlManager.updateRemoteModeUI === 'function') {
                    this.sm.controlManager.updateRemoteModeUI();
                }
            }
        });
        card.appendChild(remoteRow.element);

        // 2. 快速跳转行 + 内联步进编辑抽屉
        const seekSubbox = this._buildSeekStepsSubbox();
        const seekRow = createToggleRow({
            title: __('showSeekControlRow') || '快速跳转行',
            checked: this.settings.showSeekControlRow !== false,
            onChange: (checked) => {
                this.sm.updateSetting('showSeekControlRow', checked);
                seekSubbox.classList.toggle('is-hidden', !checked);
                this.sm.updateControlRowsVisibility();
            }
        });
        card.appendChild(seekRow.element);
        card.appendChild(seekSubbox);

        // 3. 底部模式切换行 (不含进度条与高亮切片开关)
        const modeRow = createToggleRow({
            title: __('s2ModeRow') || '底部模式切换',
            checked: this.settings.showModeControlRow !== false,
            onChange: (checked) => {
                this.sm.updateSetting('showModeControlRow', checked);
                this.sm.updateControlRowsVisibility();
            }
        });
        card.appendChild(modeRow.element);

        // 4. 点选色彩行播放模式
        const colorModeRow = createSegmentedRow({
            title: __('s2CapsuleClickMode') || '点选胶囊模式',
            options: [
                { label: __('s2PreviewLabel') || '快览', value: 'preview' },
                { label: __('s2ReviewLabel') || '回味', value: 'review' }
            ],
            value: this.settings.betaColorPlayMode || 'preview',
            onChange: (val) => {
                this.sm.updateSetting('betaColorPlayMode', val);
                if (this.sm.controlManager && typeof this.sm.controlManager.updateBetaPlayModeUI === 'function') {
                    this.sm.controlManager.updateBetaPlayModeUI();
                }
            }
        });
        card.appendChild(colorModeRow.element);

        // 5. 快览 / 连播时长步进
        card.appendChild(this._buildDurationStepperRow());

        // 6. 按键音效
        const soundRow = createToggleRow({
            title: __('buttonSound') || '按键音效',
            checked: this.settings.buttonSoundEnabled !== false,
            onChange: (checked) => {
                this.sm.updateSetting('buttonSoundEnabled', checked);
            }
        });
        card.appendChild(soundRow.element);

        this.element.appendChild(card);
    }
}
