import { Toast } from '../../utils/index.js';
import { PLAY, PAUSE, PLAY_CENTER } from '../../constants/icons.js';
import { telemetry } from '../../telemetry/index.js';
import { getValue, setValue } from '../../utils/index.js';

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
        this.playPauseButton.className = 'tm-control-button tm-integrated-play-btn';

        this._isCapsuleLoopPlaying = false;
        this._capsulePlayIndex = 0;
        this._currentCapsuleStartTime = 0;
        this._currentCapsuleDuration = 30;
        this._isSeekingCapsule = false;
        this._capsuleTimeUpdateBound = this._handleCapsulePlaybackTick.bind(this);

        this.playPauseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleMainPlayButtonClick();
        });

        this.playPauseButton.addEventListener('mouseover', () => {
            this.playPauseButton.classList.add('tm-control-button-hover');
        });
        this.playPauseButton.addEventListener('mouseout', () => {
            this.playPauseButton.classList.remove('tm-control-button-hover');
        });

        container.appendChild(this.playPauseButton);
        this.updatePlayPauseButton();
        return this.playPauseButton;
    }

    getPlayMode() {
        const playerState = this.playerCore?.options?.playerState;
        const mode = playerState?.settings?.betaPlayMode || getValue('betaPlayMode', 'normal');
        return (mode === 'preview' || mode === 'climax') ? mode : 'normal';
    }

    handleMainPlayButtonClick() {
        const mode = this.getPlayMode();
        const isPaused = this.targetVideo.paused;

        if (mode === 'normal') {
            if (isPaused) {
                this.targetVideo.play().catch(() => {});
            } else {
                this.targetVideo.pause();
            }
            this.updatePlayPauseButton();
            telemetry.track('play_toggle', { is_playing: isPaused });
            return;
        }

        // 预览模式 (preview) 或 精彩重温 (climax)
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (tabs.length === 0) {
            Toast('当前视频暂无胶囊片段，请先在时间轴添加', 2000, 'info');
            if (isPaused) {
                this.targetVideo.play().catch(() => {});
            } else {
                this.targetVideo.pause();
            }
            this.updatePlayPauseButton();
            return;
        }

        if (isPaused) {
            if (!this._isCapsuleLoopPlaying) {
                this.startCapsulePlayback(0);
            } else {
                this.targetVideo.play().catch(() => {});
            }
        } else {
            this.targetVideo.pause();
        }
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        if (!this.playPauseButton) return;
        const mode = this.getPlayMode();
        const isPaused = this.targetVideo.paused;

        this.playPauseButton.classList.remove('mode-normal', 'mode-preview', 'mode-climax');
        this.playPauseButton.classList.add('mode-' + mode);

        if (mode === 'normal') {
            this.playPauseButton.style.background = '';
            const newSvgHtml = isPaused ? PLAY : PAUSE;
            const currentSvg = this.playPauseButton.querySelector('svg');
            if (currentSvg) {
                const temp = document.createElement('div');
                temp.innerHTML = newSvgHtml.trim();
                const newSvg = temp.firstElementChild;
                if (newSvg) this.playPauseButton.replaceChild(newSvg, currentSvg);
            } else {
                this.playPauseButton.innerHTML = newSvgHtml;
            }
            this.playPauseButton.title = isPaused ? '播放' : '暂停';
        } else {
            // 预览模式 or 精彩重温
            const modeText = (mode === 'preview') ? '预览模式' : '精彩重温';
            const statusIcon = isPaused ? ' ▶' : '';
            this.playPauseButton.innerHTML = '<span class=\'tm-play-mode-text\'>' + modeText + statusIcon + '</span>';
            this.playPauseButton.title = modeText + ' (点击' + (isPaused ? '开始连播' : '暂停') + ')';
        }
    }

    createPlaybackRateSlider(container) {
        const playbackRateButton = document.createElement('button');
        playbackRateButton.className = 'tm-playback-rate-button';
        
        // 从本地持久化存储中读取用户首选倍速并初始化
        const savedSpeed = parseFloat(getValue('preferredPlaybackRate', 1.0));
        const initialSpeed = (!isNaN(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 4.0) ? savedSpeed : 1.0;
        this.targetVideo.playbackRate = initialSpeed;

        // 双击重置为 1.0x 并持久化保存
        playbackRateButton.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (this.targetVideo.playbackRate !== 1.0) {
                this.targetVideo.playbackRate = 1.0;
                setValue('preferredPlaybackRate', 1.0);
                this.syncPlaybackRateSlider(1.0);
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(5);
                }
            }
        });

        // 单击循环切换倍速并持久化保存
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
            setValue('preferredPlaybackRate', nextSpeed);
            this.syncPlaybackRateSlider(nextSpeed);
            telemetry.recordFeatureAction('speed_change');
            
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
            
            // 仅更新文本节点，避免清除正在扩散的活跃水波纹元素
            let textNode = null;
            for (const child of this.playbackRateSlider.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    textNode = child;
                    break;
                }
            }
            if (textNode) {
                textNode.textContent = speedText;
            } else {
                const ripples = Array.from(this.playbackRateSlider.querySelectorAll('.tm-ripple, .ripple'));
                this.playbackRateSlider.textContent = speedText;
                ripples.forEach(r => this.playbackRateSlider.appendChild(r));
            }
            
            // 刷新高亮样式
            this.playbackRateSlider.className = 'tm-playback-rate-button';
            if (speed > 1.5) {
                this.playbackRateSlider.classList.add('fast');
            } else if (speed > 1.0) {
                this.playbackRateSlider.classList.add('medium');
            } else {
                this.playbackRateSlider.classList.add('normal');
            }

            telemetry.track('rate_change', { rate: speed });
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
    startCapsulePlayback(startIndex = 0) {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (tabs.length === 0) return;

        this._isCapsuleLoopPlaying = true;
        this._capsulePlayIndex = Math.max(0, Math.min(startIndex, tabs.length - 1));

        this.targetVideo.removeEventListener('timeupdate', this._capsuleTimeUpdateBound);
        this.targetVideo.addEventListener('timeupdate', this._capsuleTimeUpdateBound);

        this._playCurrentCapsule();
    }

    stopCapsulePlayback() {
        this._isCapsuleLoopPlaying = false;
        this.targetVideo.removeEventListener('timeupdate', this._capsuleTimeUpdateBound);
        this._setProgressFill(0);
        this.updatePlayPauseButton();
    }

    _playCurrentCapsule() {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        const mode = this.getPlayMode();

        if (!this._isCapsuleLoopPlaying || this._capsulePlayIndex >= tabs.length) {
            this.stopCapsulePlayback();
            Toast('全部精彩胶囊已播放完毕', 2500, 'success');
            return;
        }

        const tab = tabs[this._capsulePlayIndex];
        const startTime = (tab.startTime !== undefined && tab.startTime !== null) ? tab.startTime : (tab.time || 0);
        this._currentCapsuleStartTime = startTime;

        if (mode === 'preview') {
            this._currentCapsuleDuration = 5; // 预览模式严格 5 秒
        } else {
            // 精彩重温：时间区间完整播放 A 至 B 点，单点时间戳播放 60 秒
            if (tab.startTime !== undefined && tab.endTime !== undefined && tab.endTime > tab.startTime) {
                this._currentCapsuleDuration = tab.endTime - tab.startTime;
            } else {
                this._currentCapsuleDuration = 60;
            }
        }

        // Seeking 异步锁
        this._isSeekingCapsule = true;
        this.targetVideo.currentTime = startTime;

        const onSeeked = () => {
            this.targetVideo.removeEventListener('seeked', onSeeked);
            setTimeout(() => {
                this._isSeekingCapsule = false;
            }, 350);
        };
        this.targetVideo.addEventListener('seeked', onSeeked);

        if (this.targetVideo.paused) {
            this.targetVideo.play().catch(() => {});
        }
        if (typeof loopManager?.setActiveTab === 'function') {
            loopManager.setActiveTab(tab.id);
        }
        this._setProgressFill(0);
    }

    _handleCapsulePlaybackTick() {
        if (!this._isCapsuleLoopPlaying || this._isSeekingCapsule || this.targetVideo.seeking) return;
        const mode = this.getPlayMode();
        if (mode === 'normal') {
            this.stopCapsulePlayback();
            return;
        }

        const ct = this.targetVideo.currentTime;
        const elapsed = ct - this._currentCapsuleStartTime;
        const pct = Math.max(0, Math.min(100, (elapsed / this._currentCapsuleDuration) * 100));
        this._setProgressFill(pct);

        if (ct >= (this._currentCapsuleStartTime + this._currentCapsuleDuration)) {
            this._capsulePlayIndex++;
            this._playCurrentCapsule();
        }
    }

    _setProgressFill(pct) {
        if (!this.playPauseButton) return;
        const mode = this.getPlayMode();
        if (mode === 'normal') {
            this.playPauseButton.style.background = '';
            return;
        }
        // 粉红倒计时进度条背景填充 (如草图所示)
        this.playPauseButton.style.background = 'linear-gradient(to right, rgba(255, 120, 130, 0.45) ' + pct + '%, rgba(255, 255, 255, 0.12) ' + pct + '%)';
    }
}
