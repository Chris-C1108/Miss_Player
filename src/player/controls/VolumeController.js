import { MUTE, VOLUME_LOW, VOLUME_HIGH } from '../../constants/icons.js';
import { getValue, setValue, getBool } from '../../utils/storage.js';
import { Toast } from '../../utils/index.js';
import { __ } from '../../constants/i18n.js';
import { telemetry } from '../../telemetry/index.js';

/**
 * 音量与静音控制器组件
 * 统一管理正常态与静音态交互与样式规范，支持默认静音播放及超时自动重置
 */
/**
 * 判定是否应该处于默认静音状态 (有声租约机制核心决策函数)
 * @param {object|null} playerState
 * @returns {boolean} true: 应当静音; false: 应当保持有声
 */
export function checkShouldDefaultMute(playerState = null) {
    const s = playerState?.settings;
    const defaultMuted = s ? (s.defaultMuted !== undefined ? Boolean(s.defaultMuted) : getBool('defaultMuted', true)) : getBool('defaultMuted', true);
    if (!defaultMuted) {
        return false;
    }

    const muteResetMinutes = s ? (parseInt(s.muteResetMinutes, 10) || 5) : (parseInt(getValue('muteResetMinutes', 5), 10) || 5);
    const lastUnmutedTime = Number(getValue('lastUnmutedTime', 0)) || 0;
    if (!lastUnmutedTime) {
        return true; // 从未记录过取消静音或退出/手动时处于静音状态
    }

    const elapsed = Date.now() - lastUnmutedTime;
    const resetMs = Math.max(1, muteResetMinutes) * 60 * 1000;
    return elapsed >= resetMs; // 距离上次退出/活跃超过租约时间
}

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

        this._onPlayHandler = null;
        this._onPauseHandler = null;
        this._onVisibilityChange = null;
        this._onPageHide = null;
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
            defaultMuted: s ? (s.defaultMuted !== undefined ? Boolean(s.defaultMuted) : getBool('defaultMuted', true)) : getBool('defaultMuted', true),
            muteResetMinutes: s ? (parseInt(s.muteResetMinutes, 10) || 5) : (parseInt(getValue('muteResetMinutes', 5), 10) || 5)
        };
    }

    /**
     * 判定是否应该恢复为默认静音
     * @returns {boolean}
     */
    shouldDefaultMute() {
        return checkShouldDefaultMute(this.playerCore?.options?.playerState);
    }

    /**
     * 记录当前取消静音的活跃时间戳
     */
    recordUnmutedTime() {
        setValue('lastUnmutedTime', Date.now());
    }

    /**
     * 退出或挂起时记录音频状态
     * 遵循有声租约机制：
     * 离开时若为有声播放，则保存当前退出时间戳以维持指定分钟内的有声连贯观影；
     * 若离开时为静音状态（或音量为0），则清空时间戳为 0，确保下次打开无条件保持静音防打扰。
     */
    recordExitState() {
        const { defaultMuted } = this._getSettings();
        if (!defaultMuted) return;

        if (this.targetVideo && !this.targetVideo.muted && this.targetVideo.volume > 0) {
            this.recordUnmutedTime();
        } else {
            setValue('lastUnmutedTime', 0);
        }
    }

    /**
     * 保持 API 兼容的轻量空操作 (事件驱动替代高频轮询定时器)
     */
    startUnmuteHeartbeat() {}

    /**
     * 保持 API 兼容的轻量空操作
     */
    stopUnmuteHeartbeat() {}

    /**
     * 应用初始静音策略
     */
    applyInitialMutePolicy() {
        if (!this.targetVideo) return;
        const { defaultMuted } = this._getSettings();

        if (defaultMuted) {
            if (this.shouldDefaultMute()) {
                this.targetVideo.muted = true;
            } else {
                // 处于取消静音记忆有效期内 (未超过指定分钟数)，保持有声播放
                this.targetVideo.muted = false;
                if (this.supportsVolumeControl && this.targetVideo.volume === 0) {
                    this.targetVideo.volume = this.lastVolume > 0 ? this.lastVolume : 1;
                }
                this.recordUnmutedTime();
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
            // 设置关闭
        } else if (this.targetVideo && !this.targetVideo.muted && this.targetVideo.volume > 0) {
            this.recordUnmutedTime();
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
            const currentVol = Math.round((this.targetVideo.volume || 1) * 100);
            Toast(`已取消静音 (音量 ${currentVol}%)`, 'info');
        } else {
            // 手动静音
            if (this.supportsVolumeControl) {
                this.lastVolume = this.targetVideo.volume;
                this.targetVideo.volume = 0;
            }
            this.targetVideo.muted = true;
            // 用户主动静音，清空记忆时间戳，销毁有声租约，下一次打开必定静音
            setValue('lastUnmutedTime', 0);
            Toast('已静音', 'info');
        }

        this.updateVolumeUI();
    }

    /**
     * 绑定视频播放生命周期与离开事件以维护时间戳
     * @private
     */
    _bindVideoLifecycleEvents() {
        if (!this.targetVideo) return;

        this._onPlayHandler = () => {
            if (!this.targetVideo.muted && this.targetVideo.volume > 0) {
                this.recordUnmutedTime();
            }
        };

        this._onPauseHandler = () => {
            if (!this.targetVideo.muted && this.targetVideo.volume > 0) {
                // 暂停时刻封存最新时间戳，从此刻起开始计算离线/闲置时间
                this.recordUnmutedTime();
            }
        };

        this._onVisibilityChange = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                this.recordExitState();
            }
        };

        this._onPageHide = () => {
            this.recordExitState();
        };

        this.targetVideo.addEventListener('play', this._onPlayHandler);
        this.targetVideo.addEventListener('pause', this._onPauseHandler);

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this._onVisibilityChange);
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('pagehide', this._onPageHide);
            window.addEventListener('beforeunload', this._onPageHide);
        }
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
        this.recordExitState();

        if (this.targetVideo) {
            if (this._onPlayHandler) {
                this.targetVideo.removeEventListener('play', this._onPlayHandler);
                this._onPlayHandler = null;
            }
            if (this._onPauseHandler) {
                this.targetVideo.removeEventListener('pause', this._onPauseHandler);
                this._onPauseHandler = null;
            }
        }

        if (this._onVisibilityChange && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this._onVisibilityChange);
            this._onVisibilityChange = null;
        }

        if (this._onPageHide && typeof window !== 'undefined') {
            window.removeEventListener('pagehide', this._onPageHide);
            window.removeEventListener('beforeunload', this._onPageHide);
            this._onPageHide = null;
        }

        this.volumeSlider = null;
        this.volumeButton = null;
    }
}
