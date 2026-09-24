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
        this.playPauseButton.className = 'tm-control-button';
        
        this.playPauseButton.addEventListener('click', () => {
            const isPlaying = !this.targetVideo.paused;
            if (this.targetVideo.paused) {
                this.targetVideo.play();
            } else {
                this.targetVideo.pause();
            }
            this.updatePlayPauseButton();
            telemetry.track('play_toggle', { is_playing: !isPlaying });
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
        
        const isPaused = this.targetVideo.paused;
        const newSvgHtml = isPaused ? PLAY : PAUSE;
        const currentSvg = this.playPauseButton.querySelector('svg');

        if (currentSvg) {
            const temp = document.createElement('div');
            temp.innerHTML = newSvgHtml.trim();
            const newSvg = temp.firstElementChild;
            if (newSvg) {
                this.playPauseButton.replaceChild(newSvg, currentSvg);
                return;
            }
        }

        // 降级保护：保留活跃水波纹节点
        const ripples = Array.from(this.playPauseButton.querySelectorAll('.tm-ripple, .ripple'));
        this.playPauseButton.innerHTML = newSvgHtml;
        ripples.forEach(r => this.playPauseButton.appendChild(r));
    }

    /**
     * 创建倍速点击切换按钮控制器 (代替原有的滑块)
     * @param {HTMLElement} container 按钮容器
     */
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

    /**
     * 创建彩色胶囊顺序播放控制按钮
     * @param {HTMLElement} container 按钮容器
     * @returns {HTMLElement} 彩色胶囊播放按钮
     */
    createColorCapsulePlayButton(container) {
        this.colorCapsuleButton = document.createElement('button');
        this.colorCapsuleButton.className = 'tm-control-button tm-color-capsule-play-btn';
        this.colorCapsuleButton.title = '彩色胶囊连播 (点击连播/停止，长按或右键切换模式)';
        this.colorCapsuleButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" style="filter: drop-shadow(0 0 4px rgba(255, 90, 95, 0.6));">
                <defs>
                    <linearGradient id="tm-capsule-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FF5A5F" />
                        <stop offset="50%" stop-color="#8A2387" />
                        <stop offset="100%" stop-color="#00C9FF" />
                    </linearGradient>
                </defs>
                <polygon points="6,4 19,12 6,20" fill="url(#tm-capsule-gradient)" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
        `;

        this._isCapsuleLoopPlaying = false;
        this._capsulePlayIndex = 0;
        this._capsulePlayMode = 'preview';
        this._capsuleTimeUpdateBound = this._handleCapsulePlaybackTick.bind(this);

        this.colorCapsuleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCapsulePlayback();
        });

        this.colorCapsuleButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.switchCapsulePlayMode();
        });

        let pressTimer = null;
        this.colorCapsuleButton.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                this.switchCapsulePlayMode();
            }, 650);
        }, { passive: true });
        this.colorCapsuleButton.addEventListener('touchend', () => {
            if (pressTimer) clearTimeout(pressTimer);
        });

        container.appendChild(this.colorCapsuleButton);
        return this.colorCapsuleButton;
    }

    toggleCapsulePlayback() {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (tabs.length === 0) {
            Toast('当前视频暂无胶囊片段，请先在时间轴添加', 2000, 'info');
            return;
        }

        if (this._isCapsuleLoopPlaying) {
            this.stopCapsulePlayback();
            Toast('已退出胶囊连播模式', 1500, 'info');
        } else {
            this.startCapsulePlayback();
        }
    }

    startCapsulePlayback(startIndex = 0) {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (tabs.length === 0) return;

        const playerState = this.playerCore?.options?.playerState;
        this._capsulePlayMode = playerState?.settings?.betaColorPlayMode || 'preview';

        this._isCapsuleLoopPlaying = true;
        this._capsulePlayIndex = Math.max(0, Math.min(startIndex, tabs.length - 1));
        this.colorCapsuleButton?.classList.add('is-active');

        this.targetVideo.removeEventListener('timeupdate', this._capsuleTimeUpdateBound);
        this.targetVideo.addEventListener('timeupdate', this._capsuleTimeUpdateBound);

        this._playCurrentCapsule();
        this._showModeToast();
    }

    stopCapsulePlayback() {
        this._isCapsuleLoopPlaying = false;
        this.colorCapsuleButton?.classList.remove('is-active');
        this.targetVideo.removeEventListener('timeupdate', this._capsuleTimeUpdateBound);
    }

    switchCapsulePlayMode() {
        const nextMode = (this._capsulePlayMode === 'preview') ? 'review' : 'preview';
        this._capsulePlayMode = nextMode;
        const playerState = this.playerCore?.options?.playerState;
        if (playerState?.settings) {
            playerState.settings.betaColorPlayMode = nextMode;
            playerState.saveSettings();
        }
        this._showModeToast();
    }

    _showModeToast() {
        const isPreview = (this._capsulePlayMode === 'preview');
        const modeName = isPreview ? '走马灯预览 (各播30秒)' : '高潮回看 (完整区间)';
        Toast(`胶囊播放: ${modeName}`, 3000, 'info', () => {
            Toast('【预览模式】所有胶囊统一只播30秒快进预览\n【回看模式】单点时间戳播60秒，时间区间完整播放A至B点', 4000, 'info');
        });
    }

    _playCurrentCapsule() {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (!this._isCapsuleLoopPlaying || this._capsulePlayIndex >= tabs.length) {
            this.stopCapsulePlayback();
            Toast('全部胶囊连播已完成', 2000, 'success');
            return;
        }

        const tab = tabs[this._capsulePlayIndex];
        const startTime = (tab.startTime !== undefined && tab.startTime !== null) ? tab.startTime : (tab.time || 0);
        this._currentCapsuleStartTime = startTime;
        
        if (this._capsulePlayMode === 'preview') {
            this._currentCapsuleDuration = 30;
        } else {
            if (tab.startTime !== undefined && tab.endTime !== undefined && tab.endTime > tab.startTime) {
                this._currentCapsuleDuration = tab.endTime - tab.startTime;
            } else {
                this._currentCapsuleDuration = 60;
            }
        }

        this.targetVideo.currentTime = startTime;
        if (this.targetVideo.paused) {
            this.targetVideo.play().catch(() => {});
        }
        if (typeof loopManager?.setActiveTab === 'function') {
            loopManager.setActiveTab(tab.id);
        }
    }

    _handleCapsulePlaybackTick() {
        if (!this._isCapsuleLoopPlaying) return;
        const ct = this.targetVideo.currentTime;
        if (ct < this._currentCapsuleStartTime || ct >= (this._currentCapsuleStartTime + this._currentCapsuleDuration)) {
            this._capsulePlayIndex++;
            this._playCurrentCapsule();
        }
    }

}
