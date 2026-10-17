import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SeekStepEditor } from '../components/SeekStepEditor.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';

export class PlaybackSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'tm-settings-group-header';
        header.textContent = '控制与播放行为';
        this.element.appendChild(header);

        const card = new AppleCard();

        // 1. 进度条栏
        const progressToggle = new ToggleRow({
            title: '进度条栏',
            subtext: '在底部展示主播放进度条与精准微调滑块',
            checked: this.settings.showProgressBar,
            onChange: (checked) => {
                this.sm.updateSetting('showProgressBar', checked);
                this.sm.updateControlRowsVisibility();
            }
        });
        card.appendChild(progressToggle.getElement());

        // 2. 快捷跳转控制栏
        const seekContainer = document.createElement('div');
        seekContainer.className = 'tm-settings-seek-group-wrap';

        const stepPanelWrapper = document.createElement('div');
        stepPanelWrapper.className = 'tm-settings-subpanel-wrap';
        stepPanelWrapper.style.display = this.settings.showSeekControlRow ? 'block' : 'none';
        stepPanelWrapper.style.padding = '4px 8px 10px 8px';

        const seekToggle = new ToggleRow({
            title: '快捷跳转控制栏',
            subtext: '在主控区显示快进/快退秒数按键',
            checked: this.settings.showSeekControlRow,
            onChange: (checked) => {
                this.sm.updateSetting('showSeekControlRow', checked);
                this.sm.updateControlRowsVisibility();
                stepPanelWrapper.style.display = checked ? 'block' : 'none';
            }
        });
        seekContainer.appendChild(seekToggle.getElement());

        this.stepEditor = new SeekStepEditor({
            defaultSteps: ['5s', '10s', '30s', '1m', '5m', '10m'],
            customSteps: this.settings.customUserSeekSteps || [],
            enabledSteps: this.settings.enabledSeekSteps || ['5s', '10s', '30s', '1m', '5m', '10m'],
            onToggleStep: (stepKey) => {
                let enabled = [...(this.settings.enabledSeekSteps || [])];
                if (enabled.includes(stepKey)) {
                    if (enabled.length <= 1) {
                        Toast('至少保留 1 个生效步进', 1500, 'warning');
                        return;
                    }
                    enabled = enabled.filter(s => s !== stepKey);
                } else {
                    enabled.push(stepKey);
                }
                this.sm.updateSetting('enabledSeekSteps', enabled);
                this.stepEditor.updateSteps({ enabledSteps: enabled });
                this.sm.rebuildControlPanelSeekRow();
            },
            onAddStep: (newStep) => {
                if (!/^\d+[sm]$/i.test(newStep)) {
                    Toast('格式无效！请使用数字+单位，如 15s 或 2m', 2500, 'warning');
                    return;
                }
                const formatted = newStep.toLowerCase();
                let custom = [...(this.settings.customUserSeekSteps || [])];
                let enabled = [...(this.settings.enabledSeekSteps || [])];
                if (!custom.includes(formatted)) custom.push(formatted);
                if (!enabled.includes(formatted)) enabled.push(formatted);

                this.sm.updateSetting('customUserSeekSteps', custom);
                this.sm.updateSetting('enabledSeekSteps', enabled);
                this.stepEditor.updateSteps({ customSteps: custom, enabledSteps: enabled });
                this.sm.rebuildControlPanelSeekRow();
                Toast('已添加自定义步进: ' + formatted, 1800, 'success');
            },
            onDeleteStep: (stepKey) => {
                let custom = (this.settings.customUserSeekSteps || []).filter(s => s !== stepKey);
                let enabled = (this.settings.enabledSeekSteps || []).filter(s => s !== stepKey);
                if (enabled.length === 0) enabled = ['5s'];

                this.sm.updateSetting('customUserSeekSteps', custom);
                this.sm.updateSetting('enabledSeekSteps', enabled);
                this.stepEditor.updateSteps({ customSteps: custom, enabledSteps: enabled });
                this.sm.rebuildControlPanelSeekRow();
                Toast('已删除自定义步进: ' + stepKey, 1800, 'info');
            }
        });

        stepPanelWrapper.appendChild(this.stepEditor.getElement());
        seekContainer.appendChild(stepPanelWrapper);
        card.appendChild(seekContainer);

        // 3. 片段循环栏
        const loopToggle = new ToggleRow({
            title: __('loopControlRow') || '片段循环',
            subtext: __('loopControlRowDesc') || '循环播放 A-B 指定区间片段',
            checked: this.settings.showLoopControlRow,
            onChange: (checked) => {
                this.sm.updateSetting('showLoopControlRow', checked);
                this.sm.updateControlRowsVisibility();
            }
        });
        card.appendChild(loopToggle.getElement());

        // 4. 快览时长 (秒)
        const prevDurRow = document.createElement('div');
        prevDurRow.className = 'tm-apple-row';
        prevDurRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title">${__('previewDuration') || '快览时长'}</div>
                <div class="tm-apple-row-subtext">${__('previewDurationDesc') || '快览模式下每个片段停留秒数'}</div>
            </div>
            <div class="tm-apple-row-right">
                <input type="number" class="tm-apple-duration-input tm-preview-dur-input" min="1" max="30" value="${this.settings.previewDurationSeconds || 5}" />
                <span style="font-size: 11px; color: rgba(255,255,255,0.4); margin-left: 6px;">秒</span>
            </div>
        `;
        const prevInput = prevDurRow.querySelector('.tm-preview-dur-input');
        prevInput.addEventListener('change', (e) => {
            const val = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 5));
            this.sm.updateSetting('previewDurationSeconds', val);
            prevInput.value = val;
            Toast(`${__('previewDuration') || '快览时长'}已设为: ${val} 秒`, 1500, 'info');
        });
        card.appendChild(prevDurRow);

        // 5. 高光时长 (秒)
        const climaxDurRow = document.createElement('div');
        climaxDurRow.className = 'tm-apple-row';
        climaxDurRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title">${__('climaxDuration') || '高光时长'}</div>
                <div class="tm-apple-row-subtext">${__('climaxDurationDesc') || '连播模式下单个时间点的播放时长'}</div>
            </div>
            <div class="tm-apple-row-right">
                <input type="number" class="tm-apple-duration-input tm-climax-dur-input" min="5" max="180" value="${this.settings.climaxDurationSeconds || 60}" />
                <span style="font-size: 11px; color: rgba(255,255,255,0.4); margin-left: 6px;">秒</span>
            </div>
        `;
        const climaxInput = climaxDurRow.querySelector('.tm-climax-dur-input');
        climaxInput.addEventListener('change', (e) => {
            const val = Math.max(5, Math.min(180, parseInt(e.target.value, 10) || 60));
            this.sm.updateSetting('climaxDurationSeconds', val);
            climaxInput.value = val;
            Toast(`${__('climaxDuration') || '高光时长'}已设为: ${val} 秒`, 1500, 'info');
        });
        card.appendChild(climaxDurRow);

        // 6. 离开暂停
        const pauseBlurToggle = new ToggleRow({
            title: __('pauseOnBlur') || '离开暂停',
            subtext: __('pauseOnBlurDesc') || '切换网页或最小化时自动暂停播放',
            checked: this.settings.pauseOnBlur !== false,
            onChange: (checked) => {
                this.sm.updateSetting('pauseOnBlur', checked);
            }
        });
        card.appendChild(pauseBlurToggle.getElement());

        // 7. 默认静音播放与超时重置
        const muteResetSubWrap = document.createElement('div');
        muteResetSubWrap.className = 'tm-settings-subpanel-wrap';
        muteResetSubWrap.style.display = Boolean(this.settings.defaultMuted) ? 'block' : 'none';

        const muteResetRow = document.createElement('div');
        muteResetRow.className = 'tm-apple-row';
        muteResetRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title">${__('muteResetMinutes') || '静音重置'}</div>
                <div class="tm-apple-row-subtext">${__('muteResetMinutesDesc') || '取消静音超时后自动恢复默认静音'}</div>
            </div>
            <div class="tm-apple-row-right">
                <input type="number" class="tm-apple-duration-input tm-mute-reset-input" min="1" max="120" value="${this.settings.muteResetMinutes || 5}" />
                <span style="font-size: 11px; color: rgba(255,255,255,0.4); margin-left: 6px;">${__('minutesUnit') || '分钟'}</span>
            </div>
        `;
        const muteResetInput = muteResetRow.querySelector('.tm-mute-reset-input');
        muteResetInput.addEventListener('change', (e) => {
            const val = Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 5));
            this.sm.updateSetting('muteResetMinutes', val);
            muteResetInput.value = val;
            Toast(`${__('muteResetMinutes') || '静音重置'}已设为: ${val} ${__('minutesUnit') || '分钟'}`, 1500, 'info');
        });
        muteResetSubWrap.appendChild(muteResetRow);

        const defaultMutedToggle = new ToggleRow({
            title: __('defaultMuted') || '默认静音',
            subtext: __('defaultMutedDesc') || '打开播放器默认静音播放',
            checked: Boolean(this.settings.defaultMuted),
            onChange: (checked) => {
                this.sm.updateSetting('defaultMuted', checked);
                muteResetSubWrap.style.display = checked ? 'block' : 'none';
            }
        });
        card.appendChild(defaultMutedToggle.getElement());
        card.appendChild(muteResetSubWrap);

        // 8. 按键音效
        const soundToggle = new ToggleRow({
            title: __('buttonSound') || '按键音效',
            subtext: __('buttonSoundDesc') || '点击核心按钮时播放轻脆触感声音',
            checked: this.settings.buttonSoundEnabled !== false,
            onChange: (checked) => {
                this.sm.updateSetting('buttonSoundEnabled', checked);
            }
        });
        card.appendChild(soundToggle.getElement());

        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
