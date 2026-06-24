import { REWIND, FORWARD } from '../../constants/icons.js';

/**
 * 进度跳转控制器组件
 */
export class SeekController {
    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore.targetVideo;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;
    }

    /**
     * 相对时间跳转
     * @param {number} seconds 跳转的秒数，正数表示向前，负数表示向后
     */
    seekRelative(seconds) {
        if (!this.targetVideo) return;
        const newTime = Math.max(0, Math.min(this.targetVideo.duration, this.targetVideo.currentTime + seconds));
        this.targetVideo.currentTime = newTime;
    }

    /**
     * 创建并组装快进/快退按钮行
     * @returns {HTMLElement} 包含跳转按钮的行容器
     */
    createSeekControlRow() {
        const seekControlRow = document.createElement('div');
        seekControlRow.className = 'tm-seek-control-row';

        // 创建快退按钮组 - 左侧
        const rewindGroup = document.createElement('div');
        rewindGroup.className = 'tm-rewind-group';
        
        // 创建快进按钮组 - 右侧
        const forwardGroup = document.createElement('div');
        forwardGroup.className = 'tm-forward-group';
        
        // 创建快退按钮行（响应式容器）
        const rewindButtonsContainer = document.createElement('div');
        rewindButtonsContainer.className = 'tm-rewind-buttons-container';
        
        // 创建快进按钮行（响应式容器）
        const forwardButtonsContainer = document.createElement('div');
        forwardButtonsContainer.className = 'tm-forward-buttons-container';
        
        // 将按钮容器添加到各自的组
        rewindGroup.appendChild(rewindButtonsContainer);
        forwardGroup.appendChild(forwardButtonsContainer);
        
        // 组装组到主行
        seekControlRow.appendChild(rewindGroup);
        seekControlRow.appendChild(forwardGroup);

        // 添加快退按钮 - 从右到左排列：-5s, -10s, -30s, -1m, -5m, -10m
        this.addTimeControlButton(rewindButtonsContainer, '-5s', () => this.seekRelative(-5));
        this.addTimeControlButton(rewindButtonsContainer, '-10s', () => this.seekRelative(-10));
        this.addTimeControlButton(rewindButtonsContainer, '-30s', () => this.seekRelative(-30));
        this.addTimeControlButton(rewindButtonsContainer, '-1m', () => this.seekRelative(-60));
        this.addTimeControlButton(rewindButtonsContainer, '-5m', () => this.seekRelative(-300));
        this.addTimeControlButton(rewindButtonsContainer, '-10m', () => this.seekRelative(-600));

        // 添加快进按钮 - 从左到右排列：+5s, +10s, +30s, +1m, +5m, +10m
        this.addTimeControlButton(forwardButtonsContainer, '+5s', () => this.seekRelative(5));
        this.addTimeControlButton(forwardButtonsContainer, '+10s', () => this.seekRelative(10));
        this.addTimeControlButton(forwardButtonsContainer, '+30s', () => this.seekRelative(30));
        this.addTimeControlButton(forwardButtonsContainer, '+1m', () => this.seekRelative(60));
        this.addTimeControlButton(forwardButtonsContainer, '+5m', () => this.seekRelative(300));
        this.addTimeControlButton(forwardButtonsContainer, '+10m', () => this.seekRelative(600));

        return seekControlRow;
    }

    /**
     * 添加时间控制按钮
     * @param {HTMLElement} container 按钮容器
     * @param {string} text 按钮文本
     * @param {Function} callback 点击回调函数
     * @returns {HTMLElement} 创建的按钮元素
     */
    addTimeControlButton(container, text, callback) {
        // 计算透明度：根据跳转时间计算透明度
        const calculateOpacity = (text) => {
            const value = parseInt(text.replace(/[+-]/g, ''));
            const unit = text.includes('m') ? 'm' : 's';
            let opacity = 0.5; // 默认透明度
            
            if (unit === 's') {
                if (value <= 5) opacity = 0.5;
                else if (value <= 10) opacity = 0.6;
                else opacity = 0.7; // 30s
            } else if (unit === 'm') {
                if (value === 1) opacity = 0.8;
                else if (value === 5) opacity = 0.9;
                else opacity = 1.0; // 10m
            }
            return opacity;
        };
        
        const opacity = calculateOpacity(text);
        
        const button = document.createElement('button');
        button.className = 'tm-time-control-button';
        button.style.backgroundColor = `hsl(var(--shadcn-secondary) / ${opacity})`;

        const isRewind = text.includes('-');
        const isForward = text.includes('+');
        const pureText = text.replace(/[+-]/g, '');

        if (isRewind) {
            button.innerHTML = `<div class="tm-time-control-button-inner">${REWIND}<span class="tm-time-text-margin-left">${pureText}</span></div>`;
        } else if (isForward) {
            button.innerHTML = `<div class="tm-time-control-button-inner"><span class="tm-time-text-margin-right">${pureText}</span>${FORWARD}</div>`;
        } else {
            button.textContent = text;
        }
        
        button.addEventListener('click', callback);

        // 添加悬停/点击微交互类名
        button.addEventListener('mouseover', () => {
            button.classList.add('tm-time-control-button-hover');
            button.classList.remove('tm-time-control-button-default');
        });

        button.addEventListener('mouseout', () => {
            button.classList.add('tm-time-control-button-default');
            button.classList.remove('tm-time-control-button-hover', 'tm-time-control-button-active', 'tm-time-control-button-after-active');
        });

        button.addEventListener('mousedown', () => {
            button.classList.add('tm-time-control-button-active');
            button.classList.remove('tm-time-control-button-hover', 'tm-time-control-button-default', 'tm-time-control-button-after-active');
        });

        button.addEventListener('mouseup', () => {
            button.classList.add('tm-time-control-button-after-active');
            button.classList.remove('tm-time-control-button-active', 'tm-time-control-button-hover', 'tm-time-control-button-default');
        });

        container.appendChild(button);
        return button;
    }
}
