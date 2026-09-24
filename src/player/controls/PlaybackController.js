
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
                width: 168,              // 紧凑 184px，与左右 36px 圆形按键完美对称
                height: 40,             // 统一对齐为 36px
                morphDelay: 380,
                friction: 0.55,
                springStiffness: 320,
                enableSound: soundEnabled
            },
            onModeChange: (newMode) => {
                const prevMode = this.getPlayMode();
                if (playerState?.settings) {
                    playerState.settings.betaPlayMode = newMode;
                }
                setValue('betaPlayMode', newMode);

                if (newMode === 'normal') {
                    // 切回正常模式：停止胶囊拦截，无缝原地连续播放
                    if (this._isCapsuleLoopPlaying) {
                        this.stopCapsulePlayback(false);
                    }
                } else if (newMode === 'preview' || newMode === 'climax') {
                    // 核心逻辑升级：切换到快速预览或精彩重温模式时，
                    // 立刻从当前进度节点开始播放当前循环区域或下一个时间戳节点胶囊，无需再点击暂停与开始！
                    this._isTourEnded = false;
                    this.startCapsulePlaybackFromCurrentTime();
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
                this.startCapsulePlaybackFromCurrentTime();
            } else {
                this.targetVideo.play().catch(() => {});
            }
        } else {
            this.targetVideo.pause();
        }
        this.updatePlayPauseButton();
    }

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

    /**
     * 重构右侧倍速切换（1.0x）：
     * 尺寸精致的轻量毛玻璃小圆形胶囊（36px 圆形），与左侧静音按键形成绝对严格的左右对称！
     */
    createPlaybackRateSlider(container) {
        const playbackRateButton = document.createElement('button');
        playbackRateButton.className = 'tm-playback-rate-button';
        
        const savedSpeed = parseFloat(getValue('preferredPlaybackRate', 1.0));
        const initialSpeed = (!isNaN(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 4.0) ? savedSpeed : 1.0;
        this.targetVideo.playbackRate = initialSpeed;

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

        playbackRateButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentSpeed = this.targetVideo.playbackRate;
            let nextSpeed = 1.0;
            
            // 切换序列：1.0x -> 1.2x -> 1.5x -> 2.0x -> 1.0x
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

    /**
     * 智能定位：从当前进度节点开始播放当前循环区域或下一个时间戳节点胶囊
     */
    startCapsulePlaybackFromCurrentTime() {
        const loopManager = this.controlManager?.loopManager;
        const tabs = loopManager?.tabs || [];
        if (tabs.length === 0) {
            if (this.targetVideo.paused) {
                this.targetVideo.play().catch(() => {});
            }
            this.updatePlayPauseButton();
            return;
        }

        const ct = this.targetVideo.currentTime || 0;

        // 1. 查找当前播放位置是否正好位于某个胶囊区间内
        let targetIndex = tabs.findIndex(tab => {
            const start = (tab.startTime !== undefined && tab.startTime !== null) ? tab.startTime : (tab.time || 0);
            const end = (tab.endTime !== undefined && tab.endTime > start) ? tab.endTime : (start + 5);
            return ct >= (start - 0.2) && ct <= (end + 0.2);
        });

        // 2. 如果没在任何区间内，查找第一个时间戳在当前时间之后的胶囊
        if (targetIndex === -1) {
            targetIndex = tabs.findIndex(tab => {
                const start = (tab.startTime !== undefined && tab.startTime !== null) ? tab.startTime : (tab.time || 0);
                return start >= ct;
            });
        }

        // 3. 若所有胶囊都在当前时间之前，则回滚到第一个胶囊开始循环
        if (targetIndex === -1) {
            targetIndex = 0;
        }

        this.startCapsulePlayback(targetIndex);
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
            const configuredPreview = playerState?.settings?.previewDurationSeconds || getValue('previewDurationSeconds', 5);
            this._currentCapsuleDuration = Math.max(1, Math.min(60, parseInt(configuredPreview, 10) || 5));
        } else {
            if (tab.startTime !== undefined && tab.endTime !== undefined && tab.endTime > tab.startTime) {
                this._currentCapsuleDuration = tab.endTime - tab.startTime;
            } else {
                const configuredClimax = playerState?.settings?.climaxDurationSeconds || getValue('climaxDurationSeconds', 60);
                this._currentCapsuleDuration = Math.max(5, Math.min(300, parseInt(configuredClimax, 10) || 60));
            }
        }

        // 异步 Seeking 锁
        this._isSeekingCapsule = true;
        this.targetVideo.currentTime = startTime;

        const onSeeked = () => {
            this.targetVideo.removeEventListener('seeked', onSeeked);
            setTimeout(() => {
                this._isSeekingCapsule = false;
            }, 350);
        };
        this.targetVideo.addEventListener('seeked', onSeeked);

        // 立刻启动播放！
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
