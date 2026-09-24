import { MUTE, VOLUME_LOW, VOLUME_HIGH } from '../../constants/icons.js';
import { telemetry } from '../../telemetry';

/**
 * 音量控制器组件 (纯粹静音切换按钮，完全忽略 sliderContainer 存在)
 */
export class VolumeController {
    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore.targetVideo;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;

        this.volumeSlider = null;
        this.lastVolume = 1;
        this.supportsVolumeControl = this.checkVolumeControlSupport();
    }

    checkVolumeControlSupport() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        return !isIOS;
    }

    /**
     * 创建纯粹的静音控制按钮并添加到容器
     * @param {HTMLElement} container 按钮容器
     */
    createVolumeSlider(container) {
        const volumeControl = document.createElement('div');
        volumeControl.className = 'tm-volume-control';
        volumeControl.style.cssText = 'display: flex; align-items: center; justify-content: center; width: auto; height: 100%; margin: 0; padding: 0;';

        const volumeButton = document.createElement('button');
        volumeButton.className = 'tm-volume-button';
        volumeButton.innerHTML = this.getVolumeIcon(this.targetVideo.volume);
        volumeButton.title = '静音 / 取消静音';

        volumeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.targetVideo.volume === 0 || this.targetVideo.muted) {
                this.targetVideo.muted = false;
                if (this.supportsVolumeControl) {
                    this.targetVideo.volume = this.lastVolume > 0 ? this.lastVolume : 1;
                }
            } else {
                if (this.supportsVolumeControl) {
                    this.lastVolume = this.targetVideo.volume;
                    this.targetVideo.volume = 0;
                }
                this.targetVideo.muted = true;
            }
            this.updateVolumeUI();
        });

        volumeControl.appendChild(volumeButton);
        this.volumeSlider = volumeControl;
        container.appendChild(volumeControl);
    }

    getVolumeIcon(volume) {
        if (this.targetVideo.muted || volume === 0) {
            return MUTE;
        } else if (this.supportsVolumeControl && volume < 0.5) {
            return VOLUME_LOW;
        } else {
            return VOLUME_HIGH;
        }
    }

    updateVolumeUI() {
        if (!this.volumeSlider) return;

        let volume = 1;
        if (this.supportsVolumeControl) {
            volume = this.targetVideo.muted ? 0 : this.targetVideo.volume;
        } else {
            volume = this.targetVideo.muted ? 0 : 1;
        }
        
        const volumeButton = this.volumeSlider.querySelector('.tm-volume-button');
        const isMuted = Boolean(this.targetVideo.muted || volume === 0);
        if (volumeButton) {
            volumeButton.classList.toggle('is-muted', isMuted);
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
            is_muted: !!this.targetVideo.muted
        });
    }

    cleanup() {
        this.volumeSlider = null;
    }
}
