import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SeekStepEditor } from '../components/SeekStepEditor.js';
import { createGroupHeader, createNavRow, createValueRow } from '../components/SettingsPrimitives.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';

export class PlaybackSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this.stepEditor = null;
        this._seekNavRow = null;
        this._render();
    }

    _getEnabledStepCount() {
        const enabled = this.settings.enabledSeekSteps || ['5s', '10s', '30s', '1m', '5m', '10m'];
        return enabled.length;
    }

    _refreshSeekNavSummary() {
        if (this._seekNavRow && typeof this._seekNavRow._updateSummary === 'function') {
            this._seekNavRow._updateSummary({
                text: `已选 ${this._getEnabledStepCount()} 项`,
                tone: 'neutral'
            });
        }
    }

    _openSeekStepsSubpage() {
        const title = __('seekStepsNavTitle') || '快进退步长';
        this.sm.pushSubpage('seekSteps', title, () => {
            const pageWrap = document.createElement('div');
            pageWrap.className = 'tm-settings-subpage-stack';

            const card = new AppleCard();
            const introRow = document.createElement('div');
            introRow.className = 'tm-apple-row tm-apple-row--column';

            const introTitle = document.createElement('div');
            introTitle.className = 'tm-apple-row-title';
            introTitle.textContent = '控制栏跳转时间档位';

            const introSub = document.createElement('div');
            introSub.className = 'tm-apple-row-subtext';
            introSub.textContent = '点击胶囊切换启用状态（至少保留 1 项），支持添加秒(s)或分钟(m)自定义步长';

            introRow.appendChild(introTitle);
            introRow.appendChild(introSub);

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
                        enabled = enabled.filter((s) => s !== stepKey);
                    } else {
                        enabled.push(stepKey);
                    }
                    this.sm.updateSetting('enabledSeekSteps', enabled);
                    this.stepEditor.updateSteps({ enabledSteps: enabled });
                    this.sm.rebuildControlPanelSeekRow();
                    this._refreshSeekNavSummary();
                },
                onAddStep: (newStep) => {
                    if (!/^\d+[sm]$/i.test(newStep)) {
                        Toast('格式无效！请使用数字+单位，如 15s 或 2m', 2500, 'warning');
                        return;
                    }
                    const formatted = newStep.toLowerCase();
                    const custom = [...(this.settings.customUserSeekSteps || [])];
                    const enabled = [...(this.settings.enabledSeekSteps || [])];
                    if (!custom.includes(formatted)) custom.push(formatted);
                    if (!enabled.includes(formatted)) enabled.push(formatted);

                    this.sm.updateSetting('customUserSeekSteps', custom);
                    this.sm.updateSetting('enabledSeekSteps', enabled);
                    this.stepEditor.updateSteps({ customSteps: custom, enabledSteps: enabled });
                    this.sm.rebuildControlPanelSeekRow();
                    this._refreshSeekNavSummary();
                    Toast('已添加自定义步进: ' + formatted, 1800, 'success');
                },
                onDeleteStep: (stepKey) => {
                    const custom = (this.settings.customUserSeekSteps || []).filter((s) => s !== stepKey);
                    let enabled = (this.settings.enabledSeekSteps || []).filter((s) => s !== stepKey);
                    if (enabled.length === 0) enabled = ['5s'];

                    this.sm.updateSetting('customUserSeekSteps', custom);
                    this.sm.updateSetting('enabledSeekSteps', enabled);
                    this.stepEditor.updateSteps({ customSteps: custom, enabledSteps: enabled });
                    this.sm.rebuildControlPanelSeekRow();
                    this._refreshSeekNavSummary();
                    Toast('已删除自定义步进: ' + stepKey, 1800, 'info');
                }
            });

            introRow.appendChild(this.stepEditor.getElement());
            card.appendChild(introRow);
            pageWrap.appendChild(card.getElement());
            return pageWrap;
        });
    }

    _render() {
        this.element.innerHTML = '';
        this.element.appendChild(createGroupHeader(__('playbackGroupTitle') || '播放控制'));

        // Card 1: 界面控件与播放时长
        const controlCard = new AppleCard();

        controlCard.appendChild(new ToggleRow({
            title: __('showProgressBar') || '进度条',
            subtext: __('showProgressBarDesc') || '',
            checked: this.settings.showProgressBar,
            onChange: (checked) => {
                this.sm.updateSetting('showProgressBar', checked);
                this.sm.updateControlRowsVisibility();
            }
        }).getElement());

        this._seekNavRow = createNavRow({
            title: __('seekStepsNavTitle') || '快进退步长',
            subtext: '自定义控制栏跳转时间档位',
            badgeText: `已选 ${this._getEnabledStepCount()} 项`,
            badgeTone: 'neutral',
            onClick: () => this._openSeekStepsSubpage()
        });
        this._seekNavRow.classList.toggle('is-hidden', !this.settings.showSeekControlRow);

        controlCard.appendChild(new ToggleRow({
            title: __('showSeekControlRow') || '快捷跳转',
            subtext: __('showSeekControlRowDesc') || '',
            checked: this.settings.showSeekControlRow,
            onChange: (checked) => {
                this.sm.updateSetting('showSeekControlRow', checked);
                this.sm.updateControlRowsVisibility();
                this._seekNavRow.classList.toggle('is-hidden', !checked);
            }
        }).getElement());

        controlCard.appendChild(this._seekNavRow);

        controlCard.appendChild(new ToggleRow({
            title: __('loopControlRow') || '片段循环',
            subtext: __('loopControlRowDesc') || 'A-B 区间循环',
            checked: this.settings.showLoopControlRow,
            onChange: (checked) => {
                this.sm.updateSetting('showLoopControlRow', checked);
                this.sm.updateControlRowsVisibility();
            }
        }).getElement());

        controlCard.appendChild(createValueRow({
            title: __('previewDuration') || '快览时长',
            subtext: __('previewDurationDesc') || '单片段预览秒数',
            value: this.settings.previewDurationSeconds || 5,
            min: 1,
            max: 30,
            unit: '秒',
            onCommit: (rawVal, input) => {
                const val = Math.max(1, Math.min(30, parseInt(rawVal, 10) || 5));
                this.sm.updateSetting('previewDurationSeconds', val);
                input.value = String(val);
                Toast(`${__('previewDuration') || '快览时长'}已设为: ${val} 秒`, 1500, 'info');
            }
        }));

        controlCard.appendChild(createValueRow({
            title: __('climaxDuration') || '高光时长',
            subtext: __('climaxDurationDesc') || '连续播放单点时长',
            value: this.settings.climaxDurationSeconds || 60,
            min: 5,
            max: 180,
            unit: '秒',
            onCommit: (rawVal, input) => {
                const val = Math.max(5, Math.min(180, parseInt(rawVal, 10) || 60));
                this.sm.updateSetting('climaxDurationSeconds', val);
                input.value = String(val);
                Toast(`${__('climaxDuration') || '高光时长'}已设为: ${val} 秒`, 1500, 'info');
            }
        }));

        this.element.appendChild(controlCard.getElement());

        // Card 2: 行为与声音
        const behaviorCard = new AppleCard();

        behaviorCard.appendChild(new ToggleRow({
            title: __('pauseOnBlur') || '离开暂停',
            subtext: __('pauseOnBlurDesc') || '切页面或后台时暂停',
            checked: this.settings.pauseOnBlur !== false,
            onChange: (checked) => {
                this.sm.updateSetting('pauseOnBlur', checked);
            }
        }).getElement());

        const isDefaultMuted = this.settings.defaultMuted !== false;
        const muteResetRow = createValueRow({
            title: __('muteResetMinutes') || '静音租约',
            subtext: __('muteResetMinutesDesc') || '离开超过此时间恢复静音',
            value: this.settings.muteResetMinutes || 5,
            min: 1,
            max: 120,
            unit: __('minutesUnit') || '分钟',
            onCommit: (rawVal, input) => {
                const val = Math.max(1, Math.min(120, parseInt(rawVal, 10) || 5));
                this.sm.updateSetting('muteResetMinutes', val);
                input.value = String(val);
                Toast(`${__('muteResetMinutes') || '静音租约'}已设为: ${val} ${__('minutesUnit') || '分钟'}`, 1500, 'info');
            }
        });
        muteResetRow.classList.toggle('is-hidden', !isDefaultMuted);

        behaviorCard.appendChild(new ToggleRow({
            title: __('defaultMuted') || '默认静音',
            subtext: __('defaultMutedDesc') || '',
            checked: isDefaultMuted,
            onChange: (checked) => {
                this.sm.updateSetting('defaultMuted', checked);
                muteResetRow.classList.toggle('is-hidden', !checked);
            }
        }).getElement());

        behaviorCard.appendChild(muteResetRow);

        behaviorCard.appendChild(new ToggleRow({
            title: __('buttonSound') || '按键音效',
            subtext: __('buttonSoundDesc') || '',
            checked: this.settings.buttonSoundEnabled !== false,
            onChange: (checked) => {
                this.sm.updateSetting('buttonSoundEnabled', checked);
            }
        }).getElement());

        this.element.appendChild(behaviorCard.getElement());
    }

    getElement() {
        return this.element;
    }
}
