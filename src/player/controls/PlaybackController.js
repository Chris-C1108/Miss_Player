import { PLAY, PAUSE, PLAY_CENTER } from '../../constants/icons.js';

/**
 * 播放控制器组件 - 负责播放、暂停、倍速滑杆及相关指示器
 */
export class PlaybackController {
    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore.targetVideo;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;

        this.playPauseButton = null;
        this.playbackRateSlider = null;
        this.updatePlaybackRateSliderFn = null;
        this.pauseIndicator = null;

        // 保存绑定的拖拽监听器，以便清理
        this.dragHandler = null;
        this.upHandler = null;
    }

    /**
     * 创建播放/暂停按钮
     * @param {HTMLElement} container 按钮容器
     * @returns {HTMLElement} 播放暂停按钮元素
     */
    createPlayPauseButton(container) {
        this.playPauseButton = document.createElement('button');
        this.playPauseButton.className = 'tm-control-button';
        
        this.playPauseButton.addEventListener('click', () => {
            if (this.targetVideo.paused) {
                this.targetVideo.play();
            } else {
                this.targetVideo.pause();
            }
            this.updatePlayPauseButton();
        });
        
        // 添加悬停效果
        this.playPauseButton.addEventListener('mouseover', () => {
            this.playPauseButton.classList.add('tm-control-button-hover');
            this.playPauseButton.classList.remove('tm-control-button-default');
        });
        
        this.playPauseButton.addEventListener('mouseout', () => {
            this.playPauseButton.classList.add('tm-control-button-default');
            this.playPauseButton.classList.remove('tm-control-button-hover');
        });
        
        container.appendChild(this.playPauseButton);
        this.updatePlayPauseButton();
        return this.playPauseButton;
    }

    /**
     * 更新播放/暂停按钮状态
     */
    updatePlayPauseButton() {
        if (!this.playPauseButton) return;
        
        if (this.targetVideo.paused) {
            this.playPauseButton.innerHTML = PLAY;
        } else {
            this.playPauseButton.innerHTML = PAUSE;
        }
    }

    /**
     * 创建倍速点击切换按钮控制器 (代替原有的滑块)
     * @param {HTMLElement} container 按钮容器
     */
    createPlaybackRateSlider(container) {
        const playbackRateButton = document.createElement('button');
        playbackRateButton.className = 'tm-playback-rate-button';
        
        // 双击重置为 1.0x
        playbackRateButton.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (this.targetVideo.playbackRate !== 1.0) {
                this.targetVideo.playbackRate = 1.0;
                this.syncPlaybackRateSlider(1.0);
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(5);
                }
            }
        });

        // 单击循环切换倍速
        playbackRateButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentSpeed = this.targetVideo.playbackRate;
            let nextSpeed = 1.0;
            
            // 计算下一个倍速：1.0x -> 1.2x -> 1.5x -> 2.0x -> 1.0x
            if (currentSpeed === 1.0) nextSpeed = 1.2;
            else if (currentSpeed === 1.2) nextSpeed = 1.5;
            else if (currentSpeed === 1.5) nextSpeed = 2.0;
            else nextSpeed = 1.0; // 其他所有倍速均重置为 1.0x
            
            this.targetVideo.playbackRate = nextSpeed;
            this.syncPlaybackRateSlider(nextSpeed);
            
            // 触觉反馈
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(5);
            }
        });
        
        container.appendChild(playbackRateButton);
        this.playbackRateSlider = playbackRateButton;
        
        // 初始同步按钮文本和状态
        this.syncPlaybackRateSlider(this.targetVideo.playbackRate);
    }

    /**
     * 提供给外部使用的同步方法，在视频的ratechange事件中被触发
     */
    syncPlaybackRateSlider(speed) {
        if (this.playbackRateSlider) {
            // 格式化展示速率，始终保留一位小数，如 1.0x, 1.2x, 1.5x, 2.0x
            const speedText = `${speed.toFixed(1)}x`;
            this.playbackRateSlider.textContent = speedText;
            
            // 刷新高亮样式
            this.playbackRateSlider.className = 'tm-playback-rate-button';
            if (speed > 1.5) {
                this.playbackRateSlider.classList.add('fast');
            } else if (speed > 1.0) {
                this.playbackRateSlider.classList.add('medium');
            } else {
                this.playbackRateSlider.classList.add('normal');
            }
        }
    }

    /**
     * 显示暂停指示器于视频中心
     */
    showPauseIndicator() {
        if (this.pauseIndicator) {
            if (this.pauseIndicator.parentNode) {
                this.pauseIndicator.parentNode.removeChild(this.pauseIndicator);
            }
            this.pauseIndicator = null;
        }
        
        this.pauseIndicator = document.createElement('div');
        this.pauseIndicator.className = 'tm-indicator-base tm-pause-indicator';
        
        this.pauseIndicator.style.position = 'absolute';
        this.pauseIndicator.style.top = '50%';
        this.pauseIndicator.style.left = '50%';
        this.pauseIndicator.style.transform = 'translate(-50%, -50%)';
        this.pauseIndicator.style.display = 'flex';
        this.pauseIndicator.style.justifyContent = 'center';
        this.pauseIndicator.style.alignItems = 'center';
        
        this.pauseIndicator.innerHTML = PLAY_CENTER;
        this.uiElements.videoWrapper.appendChild(this.pauseIndicator);
        
        requestAnimationFrame(() => {
            this.pauseIndicator.classList.add('visible');
        });
        
        setTimeout(() => {
            if (this.pauseIndicator) {
                this.pauseIndicator.classList.remove('visible');
                setTimeout(() => {
                    if (this.pauseIndicator && this.pauseIndicator.parentNode) {
                        this.pauseIndicator.parentNode.removeChild(this.pauseIndicator);
                        this.pauseIndicator = null;
                    }
                }, 300);
            }
        }, 1000);
    }


    /**
     * 销毁生命周期，防止内存泄漏
     */
    cleanup() {
        this.playbackRateSlider = null;
        this.dragHandler = null;
        this.upHandler = null;
    }
}
