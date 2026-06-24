import { MUTE, VOLUME_LOW, VOLUME_HIGH } from '../../constants/icons.js';

/**
 * 音量控制器组件
 */
export class VolumeController {
    constructor(playerCore, controlManager) {
        this.playerCore = playerCore;
        this.controlManager = controlManager;
        this.targetVideo = playerCore.targetVideo;
        this.uiElements = playerCore.uiElements || controlManager.uiElements;

        this.volumeSlider = null;        // 音量滑杆元素
        this.volumeLevel = null;         // 音量滑杆填充条
        this.volumeValue = null;         // 音量值显示
        this.lastVolume = 1;             // 记录静音前的音量
        this.supportsVolumeControl = this.checkVolumeControlSupport(); // 检查是否支持音量控制

        // 保存绑定的拖拽事件处理器以便移除
        this.dragHandler = null;
        this.upHandler = null;
    }

    /**
     * 检查浏览器是否支持音量控制
     * @returns {boolean} 是否支持音量控制
     */
    checkVolumeControlSupport() {
        // iOS 和 iPadOS 设备不支持 JS 控制音量
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        return !isIOS;
    }

    /**
     * 创建音量控制滑杆并添加到容器
     * @param {HTMLElement} container 滑杆容器
     */
    createVolumeSlider(container) {
        // 创建音量控制容器
        const volumeControl = document.createElement('div');
        volumeControl.className = 'tm-volume-control';

        // 创建音量图标按钮
        const volumeButton = document.createElement('button');
        volumeButton.className = 'tm-volume-button';
        volumeButton.innerHTML = this.getVolumeIcon(this.targetVideo.volume);
        
        // 创建滑杆容器
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'tm-volume-slider-container';

        // 创建滑杆轨道
        const sliderTrack = document.createElement('div');
        sliderTrack.className = 'tm-volume-slider-track';

        // 创建滑杆填充条
        this.volumeLevel = document.createElement('div');
        this.volumeLevel.className = 'tm-volume-slider-level';
        this.volumeLevel.style.width = `${this.targetVideo.volume * 100}%`;

        // 创建音量值显示
        this.volumeValue = document.createElement('div');
        this.volumeValue.className = 'tm-volume-value';
        this.volumeValue.textContent = `${Math.round(this.targetVideo.volume * 100)}%`;

        // 组装DOM结构
        sliderTrack.appendChild(this.volumeLevel);
        sliderContainer.appendChild(sliderTrack);
        sliderContainer.appendChild(this.volumeValue);
        volumeControl.appendChild(volumeButton);
        
        // 仅在支持音量控制的设备上显示滑杆
        if (this.supportsVolumeControl) {
            volumeControl.appendChild(sliderContainer);
        } else {
            // 在不支持音量控制的设备上添加特殊样式类
            volumeControl.classList.add('tm-volume-control-no-slider');
        }
        
        // 存储引用
        this.volumeSlider = volumeControl;

        // 滑杆交互相关变量
        let isDragging = false;
        let isExpanded = false;
        let expandTimeout = null;

        // 更新音量的函数
        const updateVolume = (clientX) => {
            if (!this.supportsVolumeControl) return; // 不支持音量控制时不执行

            const rect = sliderTrack.getBoundingClientRect();
            const width = rect.width;
            let percentage = ((clientX - rect.left) / width) * 100;
            percentage = Math.max(0, Math.min(100, percentage));
            
            this.targetVideo.volume = percentage / 100;
            this.targetVideo.muted = false;
            this.updateVolumeUI();
        };

        // 展开滑杆函数
        const expandSlider = () => {
            if (!this.supportsVolumeControl) return; // 不支持音量控制时不执行
            
            if (expandTimeout) {
                clearTimeout(expandTimeout);
            }
            volumeControl.classList.add('expanded');
            isExpanded = true;
        };

        // 收起滑杆函数
        const collapseSlider = () => {
            if (!this.supportsVolumeControl) return; // 不支持音量控制时不执行
            
            if (!isDragging) {
                volumeControl.classList.remove('expanded');
                isExpanded = false;
            }
        };

        // 音量按钮点击事件
        volumeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (this.supportsVolumeControl && !isExpanded) {
                // 在支持音量控制的设备上，首次点击展开滑杆
                expandSlider();
                // 3秒后自动收起
                expandTimeout = setTimeout(collapseSlider, 3000);
            } else {
                // 如果已经展开或不支持音量控制，则切换静音状态
                if (this.targetVideo.volume === 0 || this.targetVideo.muted) {
                    this.targetVideo.muted = false;
                    if (this.supportsVolumeControl) {
                        // 只在支持音量控制的设备上修改音量属性
                        this.targetVideo.volume = this.lastVolume;
                    }
                } else {
                    if (this.supportsVolumeControl) {
                        // 只在支持音量控制的设备上保存并修改音量值
                        this.lastVolume = this.targetVideo.volume;
                        this.targetVideo.volume = 0;
                    } else {
                        // 在iOS等设备上只使用muted属性
                        this.targetVideo.muted = true;
                    }
                }
                this.updateVolumeUI();
            }
        });

        // 仅在支持音量控制的设备上添加滑杆相关事件
        if (this.supportsVolumeControl) {
            // 滑杆点击事件
            sliderTrack.addEventListener('click', (e) => {
                e.stopPropagation();
                updateVolume(e.clientX);
            });

            // 使用 document 级别监听保证滑出滑槽依然可拖拽
            this.dragHandler = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                updateVolume(clientX);
            };

            this.upHandler = () => {
                if (isDragging) {
                    isDragging = false;
                    volumeControl.classList.remove('dragging');
                    // 延迟收起滑杆
                    setTimeout(collapseSlider, 1500);
                    
                    // 动态移除 document 监听器
                    document.removeEventListener('mousemove', this.dragHandler);
                    document.removeEventListener('mouseup', this.upHandler);
                    document.removeEventListener('touchmove', this.dragHandler);
                    document.removeEventListener('touchend', this.upHandler);
                    document.removeEventListener('touchcancel', this.upHandler);
                }
            };

            // 滑杆鼠标事件
            sliderTrack.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isDragging = true;
                volumeControl.classList.add('dragging');
                expandSlider();
                updateVolume(e.clientX);
                
                // 动态添加 document 监听器
                document.addEventListener('mousemove', this.dragHandler);
                document.addEventListener('mouseup', this.upHandler);
            });

            // 重写 touchstart 事件以动态添加 document 监听器
            sliderTrack.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                isDragging = true;
                volumeControl.classList.add('dragging');
                expandSlider();
                updateVolume(e.touches[0].clientX);
                
                document.addEventListener('touchmove', this.dragHandler, { passive: false });
                document.addEventListener('touchend', this.upHandler);
                document.addEventListener('touchcancel', this.upHandler);
            }, { passive: false });
        }

        // 添加到容器
        container.appendChild(volumeControl);
    }

    /**
     * 获取音量图标
     * @param {number} volume 当前音量值
     * @returns {string} 音量图标的SVG字符串
     */
    getVolumeIcon(volume) {
        if (this.targetVideo.muted || volume === 0) {
            return MUTE;
        } else if (this.supportsVolumeControl && volume < 0.5) {
            return VOLUME_LOW;
        } else {
            return VOLUME_HIGH;
        }
    }

    /**
     * 更新音量UI
     */
    updateVolumeUI() {
        if (!this.volumeSlider) return;

        let volume;
        if (this.supportsVolumeControl) {
            volume = this.targetVideo.muted ? 0 : this.targetVideo.volume;
        } else {
            // 在iOS设备上，只根据muted状态显示
            volume = this.targetVideo.muted ? 0 : 1;
        }
        
        const volumeButton = this.volumeSlider.querySelector('.tm-volume-button');
        
        // 更新音量图标
        if (volumeButton) {
            volumeButton.innerHTML = this.getVolumeIcon(volume);
        }
        
        // 如果不支持音量控制，只更新图标
        if (!this.supportsVolumeControl) return;
        
        // 更新滑杆
        if (this.volumeLevel) {
            const levelWidth = Math.max(0, Math.min(100, volume * 100));
            this.volumeLevel.style.width = `calc(${levelWidth}% - 2px)`;
        }
        
        // 更新音量值显示
        if (this.volumeValue) {
            const volumePercent = Math.round(volume * 100);
            this.volumeValue.textContent = `${volumePercent}%`;

            this.volumeValue.classList.remove('volume-high', 'volume-medium', 'volume-low', 'volume-muted');
            if (volume === 0 || this.targetVideo.muted) {
                this.volumeValue.classList.add('volume-muted');
            } else if (volume < 0.3) {
                this.volumeValue.classList.add('volume-low');
            } else if (volume < 0.7) {
                this.volumeValue.classList.add('volume-medium');
            } else {
                this.volumeValue.classList.add('volume-high');
            }
        }
    }

    /**
     * 清理资源，注销监听器以防泄漏
     */
    cleanup() {
        if (this.dragHandler) {
            document.removeEventListener('mousemove', this.dragHandler);
            this.dragHandler = null;
        }
        if (this.upHandler) {
            document.removeEventListener('mouseup', this.upHandler);
            this.upHandler = null;
        }
    }
}
