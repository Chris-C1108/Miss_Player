import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SeekStepEditor } from '../components/SeekStepEditor.js';
import { Toast } from '../../../../utils/index.js';

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
            subtext: '在底部展示主播放进度条与微秒滑块',
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
        stepPanelWrapper.style.padding = '4px 12px 10px 12px';

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
            title: '片段循环栏',
            subtext: '展示 A-B 点循环控制与多维语义时间胶囊',
            checked: this.settings.showLoopControlRow,
            onChange: (checked) => {
                this.sm.updateSetting('showLoopControlRow', checked);
                this.sm.updateControlRowsVisibility();
            }
        });
        card.appendChild(loopToggle.getElement());

        // 4. 快速预览播放时长 (秒)
        const prevDurRow = document.createElement('div');
        prevDurRow.className = 'tm-apple-row';
        prevDurRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title">⚡ 快速预览播放时长</div>
                <div class="tm-apple-row-subtext">胶囊走马灯预览时每段停留秒数 (1 ~ 30秒)</div>
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
            Toast(`快速预览时长已设为: ${val} 秒`, 1500, 'info');
        });
        card.appendChild(prevDurRow);

        // 5. 精彩重温单点时长 (秒)
        const climaxDurRow = document.createElement('div');
        climaxDurRow.className = 'tm-apple-row';
        climaxDurRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title">🌟 精彩重温单点时长</div>
                <div class="tm-apple-row-subtext">单时间戳胶囊播放秒数，A-B 区间优先播全区间</div>
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
            Toast(`精彩重温时长已设为: ${val} 秒`, 1500, 'info');
        });
        card.appendChild(climaxDurRow);

        // 6. 离开标签页自动暂停
        const pauseBlurToggle = new ToggleRow({
            title: '离开标签页自动暂停',
            subtext: '窗口失焦或切换网页时自动暂停，节省系统资源',
            checked: this.settings.pauseOnBlur !== false,
            onChange: (checked) => {
                this.sm.updateSetting('pauseOnBlur', checked);
            }
        });
        card.appendChild(pauseBlurToggle.getElement());

        // 7. 触控交互音效
        const soundToggle = new ToggleRow({
            title: '触控交互音效',
            subtext: '点击控制面板核心按键时播放轻脆听觉反馈',
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
