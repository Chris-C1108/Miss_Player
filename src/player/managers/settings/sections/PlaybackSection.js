import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
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
        header.textContent = '控制与播放模式';
        this.element.appendChild(header);

        const card = new AppleCard();

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

        const playModeRow = document.createElement('div');
        playModeRow.className = 'tm-apple-row';
        playModeRow.style.flexDirection = 'column';
        playModeRow.style.alignItems = 'stretch';
        playModeRow.style.gap = '8px';

        const playModeTop = document.createElement('div');
        playModeTop.style.display = 'flex';
        playModeTop.style.justifyContent = 'space-between';
        playModeTop.style.alignItems = 'center';

        const playModeTitle = document.createElement('div');
        playModeTitle.className = 'tm-apple-row-title';
        playModeTitle.textContent = '连续播放模式';

        const playModeSub = document.createElement('div');
        playModeSub.className = 'tm-apple-row-subtext';
        playModeSub.textContent = '切换主播放按键的默认运行机制';

        playModeTop.appendChild(playModeTitle);
        playModeRow.appendChild(playModeTop);
        playModeRow.appendChild(playModeSub);

        const curMode = this.settings.betaPlayMode || 'normal';
        const segControl = new SegmentedControl({
            options: [
                { label: '🎬 常规连播', value: 'normal' },
                { label: '⚡ 胶囊走马灯', value: 'preview' },
                { label: '🌟 精彩重温', value: 'climax' }
            ],
            value: curMode,
            onChange: (val) => {
                this.sm.updateSetting('betaPlayMode', val);
                const pb = this.sm.controlManager?.playbackController;
                if (pb && typeof pb.updatePlayPauseButton === 'function') {
                    pb.updatePlayPauseButton();
                }
                const modeNames = { normal: '常规连播', preview: '胶囊走马灯', climax: '精彩重温' };
                Toast('已切换为: ' + (modeNames[val] || val), 1500, 'info');
            }
        });

        playModeRow.appendChild(segControl.getElement());
        card.appendChild(playModeRow);

        const pauseBlurToggle = new ToggleRow({
            title: '离开标签页自动暂停',
            subtext: '窗口失焦或切换网页时自动暂停，节省系统资源',
            checked: this.settings.pauseOnBlur !== false,
            onChange: (checked) => {
                this.sm.updateSetting('pauseOnBlur', checked);
            }
        });
        card.appendChild(pauseBlurToggle.getElement());

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
