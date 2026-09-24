import { Toast } from '../../utils/index.js';
import { PLAY, PAUSE, PLAY_CENTER } from '../../constants/icons.js';
import { telemetry } from '../../telemetry/index.js';
import { getValue, setValue } from '../../utils/index.js';
import { VideoStateSwitcher } from './VideoStateSwitcher.js';

/**
 * 播放控制器组件 - 负责播放、暂停、3状态流体切换器、倍速滑杆及相关指示器
 */
export class PlaybackController {
    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore.targetVideo;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;

        this.playPauseButton = null;
        this.stateSwitcher = null;
        this.playbackRateSlider = null;
        this.updatePlaybackRateSliderFn = null;
        this.pauseIndicator = null;

        // 胶囊巡播运行态
        this._isCapsuleLoopPlaying = false;
        this._capsulePlayIndex = 0;
        this._currentCapsuleStartTime = 0;
        this._currentCapsuleDuration = 30;
        this._isSeekingCapsule = false;
        this._isTourEnded = false;
        this._capsuleTimeUpdateBound = this._handleCapsulePlaybackTick.bind(this);

        // 保存绑定的拖拽监听器，以便清理
        this.dragHandler = null;
        this.upHandler = null;
    }

    /**
     * 创建居中 3 状态流体切换器与播放/暂停核心交互
     * @param {HTMLElement} container 按钮容器
     * @returns {HTMLElement} 切换器容器元素
     */
    createPlayPauseButton(container) {
        const playerState = this.playerCore?.options?.playerState;
        const initialMode = this.getPlayMode();
        const soundEnabled = playerState?.settings?.buttonSoundEnabled !== false;

        this.stateSwitcher = new VideoStateSwitcher({
            container,
            initialMode,
            config: {
                width: 192,
                height: 34,
                morphDelay: 450,
                friction: 0.55,
                springStiffness: 300,
                enableSound: soundEnabled
            },
            onModeChange: (newMode) => {
                const prevMode = this.getPlayMode();
                if (playerState?.settings) {
                    playerState.settings.betaPlayMode = newMode;
                }
                setValue('betaPlayMode', newMode);

                // 如果从快速预览或精彩重温手动滑到正常模式：
                // 停止胶囊队列拦截，让视频原地连续自然播放
                if (newMode === 'normal') {
                    if (this._isCapsuleLoopPlaying) {
                        this.stopCapsulePlayback(false); // false 表示不强制暂停
                    }
                } else if (prevMode === 'normal') {
                    // 若切换进预览/重温模式，重置巡播终点状态
                    this._isTourEnded = false;
                }

                this.updatePlayPauseButton();
                telemetry.recordFeatureAction('play_mode_change', { mode: newMode });
            },
            onVariantAction: (actionType, mode) => {
                if (actionType === 'toggle') {
                    this.handleMainPlayButtonClick();
                } else if (actionType === 'replay') {
                    this._isTourEnded = false;
                    this.startCapsulePlayback(0);
                } else if (actionType === 'cancel_loop') {
                    const loopManager = this.controlManager?.loopManager;
                    if (loopManager) {
                        loopManager.disableLoop();
                        loopManager.activeTabId = null;
                        if (typeof loopManager.renderTabs === 'function') {
                            loopManager.renderTabs();
                        }
                    }
                    this.updatePlayPauseButton();
                    Toast('已取消单片段循环锁定', 1800, 'info');
                }
            }
        });

        this.playPauseButton = this.stateSwitcher.wrapper;
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

        // 快速预览 (preview) 或 精彩重温 (climax)
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

        if (this._isTourEnded) {
            this._isTourEnded = false;
            this.startCapsulePlayback(0);
            return;
        }

        if (isPaused) {
            if (!this._isCapsuleLoopPlaying) {
                this.startCapsulePlayback(this._capsulePlayIndex || 0);
            } else {
                this.targetVideo.play().catch(() => {});
            }
        } else {
            this.targetVideo.pause();
        }
        this.updatePlayPauseButton();
    }

    /**
     * 保持与 EventManager / ControlManager 现有接口的完全兼容
     */
    updatePlayPauseButton() {
        const isPaused = this.targetVideo ? this.targetVideo.paused : true;
        const loopManager = this.controlManager?.loopManager;
        const isCapsuleLocked = Boolean(loopManager && loopManager.loopActive && loopManager.activeTabId);

        if (this.stateSwitcher) {
            this.stateSwitcher.setPlaybackRuntime({
                isPlaying: !isPaused,
                isTourEnded: this._isTourEnded,
                isCapsuleLocked: isCapsuleLocked
            });
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
            else nextSpeed = 1.0;
            
            this.targetVideo.playbackRate = nextSpeed;
            setValue('preferredPlaybackRate', nextSpeed);
            this.syncPlaybackRateSlider(nextSpeed);
            telemetry.recordFeatureAction('speed_change');
            
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(5);
            }
        });
        
        container.appendChild(playbackRateButton);
        this.playbackRateSlider = playbackRateButton;
        
        this.syncPlaybackRateSlider(this.targetVideo.playbackRate);
    }

    syncPlaybackRateSlider(speed) {
        if (this.playbackRateSlider) {
            const speedText = `${speed.toFixed(1)}x`;
            
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

    cleanup() {
        this.playbackRateSlider = null;
        this.dragHandler = null;
        this.upHandler = null;
        this.stopCapsulePlayback();
    }

    startCapsulePlayback(startIndex = 0) {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (tabs.length === 0) return;

        this._isTourEnded = false;
        this._isCapsuleLoopPlaying = true;
        this._capsulePlayIndex = Math.max(0, Math.min(startIndex, tabs.length - 1));

        this.targetVideo.removeEventListener('timeupdate', this._capsuleTimeUpdateBound);
        this.targetVideo.addEventListener('timeupdate', this._capsuleTimeUpdateBound);

        this._playCurrentCapsule();
    }

    stopCapsulePlayback(shouldPause = true) {
        this._isCapsuleLoopPlaying = false;
        this.targetVideo.removeEventListener('timeupdate', this._capsuleTimeUpdateBound);
        this._setProgressFill(0);
        if (shouldPause && !this.targetVideo.paused) {
            this.targetVideo.pause();
        }
        this.updatePlayPauseButton();
    }

    _playCurrentCapsule() {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        const mode = this.getPlayMode();
        const playerState = this.playerCore?.options?.playerState;

        if (!this._isCapsuleLoopPlaying || this._capsulePlayIndex >= tabs.length) {
            this._isTourEnded = true;
            this.stopCapsulePlayback(true);
            Toast('全部精彩胶囊已播放完毕', 2500, 'success');
            return;
        }

        const tab = tabs[this._capsulePlayIndex];
        const startTime = (tab.startTime !== undefined && tab.startTime !== null) ? tab.startTime : (tab.time || 0);
        this._currentCapsuleStartTime = startTime;

        if (mode === 'preview') {
            // 从设置中获取快速预览时长 (默认 5 秒)
            const configuredPreview = playerState?.settings?.previewDurationSeconds || getValue('previewDurationSeconds', 5);
            this._currentCapsuleDuration = Math.max(1, Math.min(60, parseInt(configuredPreview, 10) || 5));
        } else {
            // 精彩重温：如果设置了完整区间 A-B，则完整播放；单点时间戳播放设置秒数 (默认 60 秒)
            if (tab.startTime !== undefined && tab.endTime !== undefined && tab.endTime > tab.startTime) {
                this._currentCapsuleDuration = tab.endTime - tab.startTime;
            } else {
                const configuredClimax = playerState?.settings?.climaxDurationSeconds || getValue('climaxDurationSeconds', 60);
                this._currentCapsuleDuration = Math.max(5, Math.min(300, parseInt(configuredClimax, 10) || 60));
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
        this.updatePlayPauseButton();
    }

    _handleCapsulePlaybackTick() {
        if (!this._isCapsuleLoopPlaying || this._isSeekingCapsule || this.targetVideo.seeking) return;
        const mode = this.getPlayMode();
        if (mode === 'normal') {
            this.stopCapsulePlayback(false);
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
        if (this.stateSwitcher) {
            this.stateSwitcher.setProgressFill(pct);
        }
    }
}
