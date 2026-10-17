import { MUTE, VOLUME_LOW, VOLUME_HIGH } from '../../constants/icons.js';
import { getValue, setValue, getBool } from '../../utils/storage.js';
import { __ } from '../../constants/i18n.js';
import { telemetry } from '../../telemetry/index.js';

/**
 * 音量与静音控制器组件
 * 统一管理正常态与静音态交互与样式规范，支持默认静音播放及超时自动重置
 */
export class VolumeController {
    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore.targetVideo;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;

        this.volumeSlider = null;
        this.volumeButton = null;
        this.lastVolume = 1;
        this.supportsVolumeControl = this.checkVolumeControlSupport();

        this._unmuteHeartbeatTimer = null;
        this._onPlayHandler = null;
        this._onPauseHandler = null;
        this._onEndedHandler = null;
    }

    checkVolumeControlSupport() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        return !isIOS;
    }

    /**
     * 获取静音相关设置
     * @private
     */
    _getSettings() {
        const playerState = this.playerCore?.options?.playerState;
        const s = playerState?.settings;
        return {
            defaultMuted: s ? Boolean(s.defaultMuted) : getBool('defaultMuted', false),
            muteResetMinutes: s ? (parseInt(s.muteResetMinutes, 10) || 5) : (parseInt(getValue('muteResetMinutes', 5), 10) || 5)
        };
    }

    /**
     * 判定是否应该恢复为默认静音
     * @returns {boolean}
     */
    shouldDefaultMute() {
        const { defaultMuted, muteResetMinutes } = this._getSettings();
        if (!defaultMuted) {
            return false;
        }

        const lastUnmutedTime = Number(getValue('lastUnmutedTime', 0)) || 0;
        if (!lastUnmutedTime) {
            return true; // 从未记录过取消静音或已被手动重置
        }

        const elapsed = Date.now() - lastUnmutedTime;
        const resetMs = Math.max(1, muteResetMinutes) * 60 * 1000;
        return elapsed >= resetMs; // 距离上次取消静音超过指定分钟数
    }

    /**
     * 记录当前取消静音的活跃时间戳
     */
    recordUnmutedTime() {
        setValue('lastUnmutedTime', Date.now());
    }

    /**
     * 启动每 30 秒一次的时间戳心跳更新
     */
    startUnmuteHeartbeat() {
        this.stopUnmuteHeartbeat();
        const { defaultMuted } = this._getSettings();
        if (!defaultMuted) return;

        // 每 30 秒更新记录当前时间戳 X
        this._unmuteHeartbeatTimer = setInterval(() => {
            if (this.targetVideo && !this.targetVideo.muted && this.targetVideo.volume > 0 && !this.targetVideo.paused) {
                this.recordUnmutedTime();
            }
        }, 30000);
    }

    /**
     * 停止心跳计时器
     */
    stopUnmuteHeartbeat() {
        if (this._unmuteHeartbeatTimer) {
            clearInterval(this._unmuteHeartbeatTimer);
            this._unmuteHeartbeatTimer = null;
        }
    }

    /**
     * 应用初始静音策略
     */
    applyInitialMutePolicy() {
        if (!this.targetVideo) return;
        const { defaultMuted } = this._getSettings();

        if (defaultMuted) {
            if (this.shouldDefaultMute()) {
                this.targetVideo.muted = true;
                this.stopUnmuteHeartbeat();
            } else {
                // 处于取消静音记忆有效期内 (未超过指定分钟数)，保持有声播放
                this.targetVideo.muted = false;
                if (this.supportsVolumeControl && this.targetVideo.volume === 0) {
                    this.targetVideo.volume = this.lastVolume > 0 ? this.lastVolume : 1;
                }
                this.recordUnmutedTime();
                if (!this.targetVideo.paused) {
                    this.startUnmuteHeartbeat();
                }
            }
        }

        this.updateVolumeUI();
    }

    /**
     * 设置项变更时响应
     */
    onSettingsChanged() {
        const { defaultMuted } = this._getSettings();
        if (!defaultMuted) {
            this.stopUnmuteHeartbeat();
        } else if (this.targetVideo && !this.targetVideo.muted && this.targetVideo.volume > 0) {
            this.recordUnmutedTime();
            if (!this.targetVideo.paused) {
                this.startUnmuteHeartbeat();
            }
        }
    }

    /**
     * 切换静音 / 取消静音
     */
    toggleMute() {
        if (!this.targetVideo) return;

        if (this.targetVideo.volume === 0 || this.targetVideo.muted) {
            // 手动取消静音
            this.targetVideo.muted = false;
            if (this.supportsVolumeControl) {
                this.targetVideo.volume = this.lastVolume > 0 ? this.lastVolume : 1;
            }
            this.recordUnmutedTime();
            if (!this.targetVideo.paused) {
                this.startUnmuteHeartbeat();
            }
        } else {
            // 手动静音
            if (this.supportsVolumeControl) {
                this.lastVolume = this.targetVideo.volume;
                this.targetVideo.volume = 0;
            }
            this.targetVideo.muted = true;
            this.stopUnmuteHeartbeat();
            // 用户主动静音，清空记忆时间戳，下一次打开必定静音
            setValue('lastUnmutedTime', 0);
        }

        this.updateVolumeUI();
    }

    /**
     * 绑定视频播放生命周期事件以维护时间戳心跳
     * @private
     */
    _bindVideoLifecycleEvents() {
        if (!this.targetVideo) return;

        this._onPlayHandler = () => {
            if (!this.targetVideo.muted && this.targetVideo.volume > 0) {
                this.recordUnmutedTime();
                this.startUnmuteHeartbeat();
            }
        };

        this._onPauseHandler = () => {
            if (!this.targetVideo.muted && this.targetVideo.volume > 0) {
                // 暂停时刻封存最新时间戳，从此刻起开始计算离线/闲置时间
                this.recordUnmutedTime();
            }
            this.stopUnmuteHeartbeat();
        };

        this._onEndedHandler = () => {
            this.stopUnmuteHeartbeat();
        };

        this.targetVideo.addEventListener('play', this._onPlayHandler);
        this.targetVideo.addEventListener('pause', this._onPauseHandler);
        this.targetVideo.addEventListener('ended', this._onEndedHandler);
    }

    /**
     * 创建纯粹的静音控制按钮并添加到容器
     * @param {HTMLElement} container 按钮容器
     */
    createVolumeSlider(container) {
        const volumeControl = document.createElement('div');
        volumeControl.className = 'tm-volume-control';

        const volumeButton = document.createElement('button');
        volumeButton.type = 'button';
        volumeButton.className = 'tm-volume-button';
        volumeButton.innerHTML = this.getVolumeIcon(this.targetVideo ? this.targetVideo.volume : 1);
        volumeButton.title = __('mute') || '静音';

        volumeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute();
        });

        volumeControl.appendChild(volumeButton);
        this.volumeSlider = volumeControl;
        this.volumeButton = volumeButton;
        container.appendChild(volumeControl);

        this._bindVideoLifecycleEvents();
        this.applyInitialMutePolicy();
    }

    getVolumeIcon(volume) {
        if (!this.targetVideo || this.targetVideo.muted || volume === 0) {
            return MUTE;
        } else if (this.supportsVolumeControl && volume < 0.5) {
            return VOLUME_LOW;
        } else {
            return VOLUME_HIGH;
        }
    }

    updateVolumeUI() {
        if (!this.volumeSlider || !this.targetVideo) return;

        let volume = 1;
        if (this.supportsVolumeControl) {
            volume = this.targetVideo.muted ? 0 : this.targetVideo.volume;
        } else {
            volume = this.targetVideo.muted ? 0 : 1;
        }

        const volumeButton = this.volumeButton || this.volumeSlider.querySelector('.tm-volume-button');
        const isMuted = Boolean(this.targetVideo.muted || volume === 0);

        if (volumeButton) {
            volumeButton.classList.toggle('is-muted', isMuted);
            volumeButton.title = isMuted ? (__('unmute') || '取消静音') : (__('mute') || '静音');

            const newIconHtml = this.getVolumeIcon(volume);
            const currentSvg = volumeButton.querySelector('svg');
            if (currentSvg) {
                const temp = document.createElement('div');
                temp.innerHTML = newIconHtml.trim();
                const newSvg = temp.firstElementChild;
                if (newSvg) {
                    volumeButton.replaceChild(newSvg, currentSvg);
                } else {
                    volumeButton.innerHTML = newIconHtml;
                }
            } else {
                volumeButton.innerHTML = newIconHtml;
            }
        }

        telemetry.track('volume_change', {
            volume: Math.round(volume * 100) / 100,
            is_muted: isMuted
        });
    }

    cleanup() {
        this.stopUnmuteHeartbeat();

        if (this.targetVideo) {
            if (this._onPlayHandler) {
                this.targetVideo.removeEventListener('play', this._onPlayHandler);
                this._onPlayHandler = null;
            }
            if (this._onPauseHandler) {
                this.targetVideo.removeEventListener('pause', this._onPauseHandler);
                this._onPauseHandler = null;
            }
            if (this._onEndedHandler) {
                this.targetVideo.removeEventListener('ended', this._onEndedHandler);
                this._onEndedHandler = null;
            }
        }

        this.volumeSlider = null;
        this.volumeButton = null;
    }
}
