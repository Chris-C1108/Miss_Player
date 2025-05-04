/**
 * 控制管理器类 - 负责播放器控制按钮和相关功能
 */
export class ControlManager {
    constructor(playerCore, uiElements) {
        // 核心引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
        // UI元素引用
        this.uiElements = uiElements;
        
        // 控制按钮容器和元素
        this.controlButtonsContainer = null; // 控制按钮容器
        this.playPauseButton = null;     // 播放/暂停按钮
        this.muteButton = null;          // 静音按钮
        this.progressBarElement = null;  // 进度条元素
        this.progressIndicator = null;   // 进度指示器
        this.currentTimeDisplay = null;  // 当前时间显示
        this.totalDurationDisplay = null; // 总时长显示
        this.timeIndicator = null;       // 时间指示器
        this.progressControlsContainer = null; // 进度控制容器
        
        // 暂停和倍速指示器
        this.pauseIndicator = null;      // 暂停指示器
        this.playbackRateIndicator = null; // 倍速指示器
        
        // 循环控制相关
        this.loopManager = null;         // 循环管理器实例引用
        this.loopStartMarker = null;
        this.loopEndMarker = null;
        this.loopStartDisplay = null;
        this.loopEndDisplay = null;
        
        // 拖动状态
        this.isDraggingProgress = false; // 是否正在拖动进度条
        this.clickLock = false;          // 防止快速多次点击视频区域
        this.clickLockTimeout = null;    // 点击锁定计时器
        
        // 音量控制相关
        this.volumeSlider = null;        // 音量滑杆元素
        this.volumeLevel = null;         // 音量滑杆填充条
        this.volumeValue = null;         // 音量值显示
        this.lastVolume = 1;             // 记录静音前的音量
        this.supportsVolumeControl = this.checkVolumeControlSupport(); // 检查是否支持音量控制
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
     * 初始化控制管理器
     */
    init() {
        // 创建进度条控制
        this.progressControlsContainer = this.createProgressControls();
        
        // 创建控制按钮容器
        this.controlButtonsContainer = this.createControlButtonsContainer();
        
        // 初始化事件监听器
        this.initEventListeners();
        
        // 返回创建的元素
        return {
            progressControlsContainer: this.progressControlsContainer,
            controlButtonsContainer: this.controlButtonsContainer
        };
    }
    
    /**
     * 设置循环管理器引用
     */
    setLoopManager(loopManager) {
        this.loopManager = loopManager;
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 视频时间更新监听
        this.targetVideo.addEventListener('timeupdate', this.updateProgressBar.bind(this));
        this.targetVideo.addEventListener('timeupdate', this.updateCurrentTimeDisplay.bind(this));
        
        // 视频元数据加载完成监听
        this.targetVideo.addEventListener('loadedmetadata', () => {
            this.updateProgressBar();
            this.updateLoopTimeDisplay();
            this.updateLoopMarkers();
        });
        
        // 进度条点击和拖动监听
        this.progressBarElement.addEventListener('click', this.handleProgressClick.bind(this));
        this.progressBarElement.addEventListener('mousedown', this.startProgressDrag.bind(this));
        this.progressBarElement.addEventListener('touchstart', this.startProgressDrag.bind(this), { passive: false });
        
        // 注释掉视频包装器点击事件，由UIManager统一处理
        // 视频包装器点击事件已移至UIManager，避免重复绑定和逻辑冲突
        
        // 监听视频播放状态变化，更新播放/暂停按钮
        this.targetVideo.addEventListener('play', () => {
            this.updatePlayPauseButton();
        });

        this.targetVideo.addEventListener('pause', () => {
            this.updatePlayPauseButton();
            this.showPauseIndicator(); // 显示暂停指示器
        });

        // 监听视频静音状态变化
        this.targetVideo.addEventListener('volumechange', () => {
            this.updateMuteButton();
        });

        // 监听视频倍速变化
        this.targetVideo.addEventListener('ratechange', () => {
            if (this.playbackRateSlider) {
                const currentRate = this.targetVideo.playbackRate;
                // 计算对应的百分比位置
                const percentage = ((currentRate - 0.1) / (3.0 - 0.1)) * 100;
                // 更新滑块位置（如果不是由滑块触发的变化）
                if (this.updatePlaybackRateSlider) {
                    this.updatePlaybackRateSlider(percentage);
                }
                // 显示倍速指示器
                this.showPlaybackRateIndicator(currentRate);
            }
        });
        
        // 循环功能监听
        if (this.loopManager) {
            this.targetVideo.addEventListener('timeupdate', () => {
                this.loopManager.checkAndLoop();
            });
        }
    }

    /**
     * 创建进度条控制组件
     */
    createProgressControls() {
        // 创建内置进度条控制区
        this.progressControlsContainer = document.createElement('div');
        this.progressControlsContainer.className = 'tm-progress-controls';

        // 时间显示容器 - 现在放在进度条上方
        const timeDisplayContainer = document.createElement('div');
        timeDisplayContainer.className = 'tm-time-display-container';

        // 当前时间显示
        this.currentTimeDisplay = document.createElement('span');
        this.currentTimeDisplay.className = 'tm-current-time';
        this.currentTimeDisplay.textContent = '00:00:00';

        // 剩余时间显示
        this.totalDurationDisplay = document.createElement('span');
        this.totalDurationDisplay.className = 'tm-total-duration';
        this.totalDurationDisplay.textContent = '-00:00:00';

        // 进度条容器
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'tm-progress-bar-container';

        this.progressBarElement = document.createElement('div');
        this.progressBarElement.className = 'tm-progress-bar';

        // 进度指示器
        this.progressIndicator = document.createElement('div');
        this.progressIndicator.className = 'tm-progress-indicator';


        // 进度条和指示器的鼠标/触摸事件
        progressBarContainer.addEventListener('mouseenter', () => {
            this.progressBarElement.classList.add('tm-progress-bar-expanded');
        });

        progressBarContainer.addEventListener('mouseleave', () => {
            if (!this.isDraggingProgress) {
                this.progressBarElement.classList.add('tm-progress-bar-normal');
                this.progressBarElement.classList.remove('tm-progress-bar-expanded');
            }
        });

        // 添加触摸事件，处理触摸时进度条变高
        progressBarContainer.addEventListener('touchstart', () => {
            this.progressBarElement.classList.add('tm-progress-bar-expanded');
            this.progressBarElement.classList.remove('tm-progress-bar-normal');
        }, { passive: true });

        progressBarContainer.addEventListener('touchend', () => {
            if (!this.isDraggingProgress) {
                this.progressBarElement.classList.add('tm-progress-bar-normal');
                this.progressBarElement.classList.remove('tm-progress-bar-expanded');
            }
        });

        // 添加循环标记容器
        this.loopStartMarker = document.createElement('div');
        this.loopStartMarker.className = 'tm-loop-marker tm-loop-start-marker';
        this.loopStartMarker.style.display = 'none';
        
        this.loopEndMarker = document.createElement('div');
        this.loopEndMarker.className = 'tm-loop-marker tm-loop-end-marker';
        this.loopEndMarker.style.display = 'none';

        // 添加循环区间连接元素
        this.loopRangeElement = document.createElement('div');
        this.loopRangeElement.className = 'tm-loop-range';
        this.loopRangeElement.style.display = 'none';

        // 组装时间显示
        timeDisplayContainer.appendChild(this.currentTimeDisplay);
        timeDisplayContainer.appendChild(this.totalDurationDisplay);

        // 组装进度条组件
        this.progressBarElement.appendChild(this.progressIndicator);
        progressBarContainer.appendChild(this.progressBarElement);
        progressBarContainer.appendChild(this.loopStartMarker);
        progressBarContainer.appendChild(this.loopEndMarker);
        progressBarContainer.appendChild(this.loopRangeElement);

        // 添加到进度控制容器 - 先添加时间显示，然后是进度条
        this.progressControlsContainer.appendChild(timeDisplayContainer);
        this.progressControlsContainer.appendChild(progressBarContainer);
        
        return this.progressControlsContainer;
    }

    /**
     * 创建视频控制按钮容器
     */
    createControlButtonsContainer() {
        // 创建控制按钮容器 - 固定在页面底部
        this.controlButtonsContainer = document.createElement('div');
        this.controlButtonsContainer.className = 'tm-control-buttons';

        // 创建进度条行作为第一行
        const progressRow = document.createElement('div');
        progressRow.className = 'tm-progress-row';

        // 添加进度控制区到进度条行
        progressRow.appendChild(this.progressControlsContainer);
        
        // 添加进度条行作为第一行
        this.controlButtonsContainer.appendChild(progressRow);

        // 创建第一行：快退和快进按钮
        const seekControlRow = document.createElement('div');
        seekControlRow.className = 'tm-seek-control-row';

        // 创建第二行：时间显示和循环控制按钮
        const loopControlRow = document.createElement('div');
        loopControlRow.className = 'tm-loop-control-row';

        // 创建时间显示区 - 第二行左侧
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'tm-time-display';

        // 创建循环控制区 - 第二行右侧
        const loopControl = document.createElement('div');
        loopControl.className = 'tm-loop-control';

        // 创建快退按钮组 - 左侧
        const rewindGroup = document.createElement('div');
        rewindGroup.className = 'tm-rewind-group';
        
        // 创建快进按钮组 - 右侧
        const forwardGroup = document.createElement('div');
        forwardGroup.className = 'tm-forward-group';
        
        // 创建快退按钮行（响应式容器，按钮从右到左排列）
        const rewindButtonsContainer = document.createElement('div');
        rewindButtonsContainer.className = 'tm-rewind-buttons-container';
        
        // 创建快进按钮行（响应式容器，按钮从左到右排列）
        const forwardButtonsContainer = document.createElement('div');
        forwardButtonsContainer.className = 'tm-forward-buttons-container';
        
        // 将按钮容器添加到各自的组
        rewindGroup.appendChild(rewindButtonsContainer);
        forwardGroup.appendChild(forwardButtonsContainer);
        
        // 组装组到主行
        seekControlRow.appendChild(rewindGroup);
        seekControlRow.appendChild(forwardGroup);

        // 添加快退按钮 - 按钮将按照4,3,2,1,6,5的顺序从右到左排列
        this.addTimeControlButton(rewindButtonsContainer, '-5s', () => this.seekRelative(-5));
        this.addTimeControlButton(rewindButtonsContainer, '-10s', () => this.seekRelative(-10));
        this.addTimeControlButton(rewindButtonsContainer, '-30s', () => this.seekRelative(-30));
        this.addTimeControlButton(rewindButtonsContainer, '-1m', () => this.seekRelative(-60));
        this.addTimeControlButton(rewindButtonsContainer, '-5m', () => this.seekRelative(-300));
        this.addTimeControlButton(rewindButtonsContainer, '-10m', () => this.seekRelative(-600));

        // 添加快进按钮 - 按钮将按照1,2,3,4,5,6的顺序从左到右排列
        this.addTimeControlButton(forwardButtonsContainer, '+5s', () => this.seekRelative(5));
        this.addTimeControlButton(forwardButtonsContainer, '+10s', () => this.seekRelative(10));
        this.addTimeControlButton(forwardButtonsContainer, '+30s', () => this.seekRelative(30));
        this.addTimeControlButton(forwardButtonsContainer, '+1m', () => this.seekRelative(60));
        this.addTimeControlButton(forwardButtonsContainer, '+5m', () => this.seekRelative(300));
        this.addTimeControlButton(forwardButtonsContainer, '+10m', () => this.seekRelative(600));

        // 创建时间显示
        this.currentPositionDisplay = document.createElement('span');
        this.currentPositionDisplay.className = 'tm-loop-start-position';
        this.currentPositionDisplay.textContent = '00:00:00';

        // 循环开始点按钮 (A) - 改为纯文本标签
        this.setLoopStartButton = document.createElement('span');
        this.setLoopStartButton.className = 'tm-set-loop-start-label';
        this.setLoopStartButton.innerHTML = 'A';

        // 结束时间显示
        this.durationDisplay = document.createElement('span');
        this.durationDisplay.className = 'tm-loop-end-position';
        this.durationDisplay.textContent = '00:00:00';

        // 循环结束点按钮 (B) - 改为纯文本标签
        this.setLoopEndButton = document.createElement('span');
        this.setLoopEndButton.className = 'tm-set-loop-end-label';
        this.setLoopEndButton.innerHTML = 'B';

        // 创建开始时间容器
        const startTimeContainer = document.createElement('div');
        startTimeContainer.className = 'tm-start-time-container';
        
        // 创建结束时间容器
        const endTimeContainer = document.createElement('div');
        endTimeContainer.className = 'tm-end-time-container';

        // 添加开始时间容器点击事件
        startTimeContainer.addEventListener('click', () => {
            if (this.loopManager) {
                this.loopManager.setLoopStart();
            } else {
                console.error('[ControlManager] 循环管理器未设置，无法调用setLoopStart');
            }
        });
        
        // 简化悬停效果，使用CSS处理
        startTimeContainer.addEventListener('mouseover', () => {
            // CSS已处理悬停样式
            return; // 添加空语句以避免lint错误
        });
        
        startTimeContainer.addEventListener('mouseout', () => {
            // CSS已处理离开样式
            return; // 添加空语句以避免lint错误
        });

        // 添加结束时间容器点击事件
        endTimeContainer.addEventListener('click', () => {
            if (this.loopManager) {
                this.loopManager.setLoopEnd();
            } else {
                console.error('[ControlManager] 循环管理器未设置，无法调用setLoopEnd');
            }
        });
        
        // 简化悬停效果，使用CSS处理
        endTimeContainer.addEventListener('mouseover', () => {
            // CSS已处理悬停样式
            return; // 添加空语句以避免lint错误
        });
        
        endTimeContainer.addEventListener('mouseout', () => {
            // CSS已处理离开样式
            return; // 添加空语句以避免lint错误
        });

        // 组装开始时间容器
        startTimeContainer.appendChild(this.setLoopStartButton);
        startTimeContainer.appendChild(this.currentPositionDisplay);

        // 组装结束时间容器
        endTimeContainer.appendChild(this.setLoopEndButton);
        endTimeContainer.appendChild(this.durationDisplay);

        // 添加循环按钮 - 直接在 loopControl 中创建
        const loopButton = document.createElement('div');
        loopButton.className = 'tm-loop-toggle-button';
        loopButton.innerHTML = `
            <span class="tm-loop-toggle-label">Loop</span>
            <svg width="12" height="12" style="vertical-align: middle;">
                <circle class="tm-loop-indicator-circle" cx="6" cy="6" r="5" fill="hsl(var(--shadcn-muted-foreground) / 0.5)"></circle>
            </svg>
        `;
        loopControl.appendChild(loopButton);

        // 获取创建的按钮元素
        const loopToggleButtonElement = loopButton;

        // 简化悬停效果，使用CSS处理
        loopToggleButtonElement.addEventListener('mouseover', () => {
            // CSS已处理悬停样式
            return; // 添加空语句以避免lint错误
        });

        loopToggleButtonElement.addEventListener('mouseout', () => {
            // CSS已处理离开样式
            return; // 添加空语句以避免lint错误
        });

        // 添加点击事件
        loopToggleButtonElement.addEventListener('click', () => {
            if (this.loopManager) {
                this.loopManager.toggleLoop();
            } else {
                console.error('[ControlManager] 循环管理器未设置，无法调用toggleLoop');
            }
        });

        this.loopToggleButton = loopToggleButtonElement; // 存储按钮引用

        // 组装控制区域
        timeDisplay.appendChild(startTimeContainer);
        timeDisplay.appendChild(endTimeContainer);

        loopControlRow.appendChild(timeDisplay);
        loopControlRow.appendChild(loopControl);

        this.controlButtonsContainer.appendChild(seekControlRow);
        this.controlButtonsContainer.appendChild(loopControlRow);

        // 播放控制行：播放/暂停、静音和倍速按钮
        const playbackControlRow = document.createElement('div');
        playbackControlRow.className = 'tm-playback-control-row';

        // 创建左侧区域 - 放置静音按钮和音量控制
        const leftControlsArea = document.createElement('div');
        leftControlsArea.className = 'tm-left-controls';
        leftControlsArea.style.display = 'flex';
        leftControlsArea.style.alignItems = 'center';
        leftControlsArea.style.gap = '6px';
        leftControlsArea.style.flex = '1';

        // 创建音量控制滑杆
        this.createVolumeSlider(leftControlsArea);

        // 创建中间区域 - 放置播放/暂停按钮
        const centerControlsArea = document.createElement('div');
        centerControlsArea.className = 'tm-center-controls';
        centerControlsArea.style.display = 'flex';
        centerControlsArea.style.alignItems = 'center';
        centerControlsArea.style.justifyContent = 'center';
        centerControlsArea.style.flex = '1';

        // 创建右侧区域 - 放置速度控制
        const rightControlsArea = document.createElement('div');
        rightControlsArea.className = 'tm-right-controls';
        rightControlsArea.style.display = 'flex';
        rightControlsArea.style.alignItems = 'center';
        rightControlsArea.style.justifyContent = 'flex-end';
        rightControlsArea.style.flex = '1';
        rightControlsArea.style.gap = '6px';

        // 添加这些区域到控制行
        playbackControlRow.appendChild(leftControlsArea);
        playbackControlRow.appendChild(centerControlsArea);
        playbackControlRow.appendChild(rightControlsArea);

        // 播放/暂停按钮
        this.playPauseButton = this.addControlButton(centerControlsArea, '', () => {
            if (this.targetVideo.paused) {
                this.targetVideo.play();
                this.updatePlayPauseButton();
            } else {
                this.targetVideo.pause();
                this.updatePlayPauseButton();
            }
        });

        // 创建倍速滑块控制器
        this.createPlaybackRateSlider(rightControlsArea);

        this.controlButtonsContainer.appendChild(playbackControlRow);

        // 初始化按钮状态
        this.updatePlayPauseButton();
        this.updateMuteButton();
        
        return this.controlButtonsContainer;
    }

    /**
     * 创建倍速滑块控制器
     */
    createPlaybackRateSlider(container) {
        const playbackRateSlider = document.createElement('div');
        playbackRateSlider.className = 'tm-playback-rate-slider';

        // 滑块相关常量定义
        const MIN_SPEED = 0.1;
        const MAX_SPEED = 3.0;
        const STEP = 0.1;
        let isDragging = false;
        let lastPercentage = 30; // 默认1.0倍速，范围0.1-3.0的30%
        let currentSpeed = 1.0;
        let rafId = null;

        // 滑块容器
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'tm-slider-container';

        // 滑块填充区域
        const sliderLevel = document.createElement('div');
        sliderLevel.className = 'tm-slider-level';

        // 滑块标记
        const sliderMarks = document.createElement('div');
        sliderMarks.className = 'tm-slider-marks';

        // 添加主要标记点 - 0.5x, 1.0x, 1.5x, 2.0x, 3.0x
        const marksPositions = [
            { pos: Math.round((0.5 - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 100), label: '0.5x' },
            { pos: Math.round((1.0 - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 100), label: '1.0x' },
            { pos: Math.round((1.5 - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 100), label: '1.5x' },
            { pos: Math.round((2.0 - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 100), label: '2.0x' },
            { pos: Math.round((3.0 - MIN_SPEED) / (MAX_SPEED - MIN_SPEED) * 100), label: '3.0x' }
        ];

        marksPositions.forEach(({ pos, label }) => {
            const mark = document.createElement('div');
            mark.className = 'tm-slider-mark';
            mark.style.left = `${pos}%`;
            sliderMarks.appendChild(mark);
        });

        // 滑块文本区域
        const sliderText = document.createElement('div');
        sliderText.className = 'tm-slider-text';

        // Speed标签
        const speedLabel = document.createElement('div');
        speedLabel.className = 'tm-speed-label';
        speedLabel.textContent = 'Speed';

        // 速度值显示
        const speedValue = document.createElement('div');
        speedValue.className = 'tm-speed-value';
        speedValue.textContent = '1.0x';

        // 组装DOM结构
        sliderText.appendChild(speedLabel);
        sliderText.appendChild(speedValue);
        sliderContainer.appendChild(sliderMarks);
        sliderContainer.appendChild(sliderLevel);
        sliderContainer.appendChild(sliderText);
        playbackRateSlider.appendChild(sliderContainer);
        
        // 将滑块添加到控制区域
        container.appendChild(playbackRateSlider);

        // 更新滑块函数
        const updateSlider = (percentage) => {
            sliderLevel.style.width = `${percentage}%`;
            
            // 计算速度值：从MIN_SPEED到MAX_SPEED，步长为STEP
            const speedRange = MAX_SPEED - MIN_SPEED;
            let speed = MIN_SPEED + (percentage / 100) * speedRange;
            
            // 将速度值四舍五入到最近的STEP倍数
            speed = Math.round(speed / STEP) * STEP;
            
            // 确保不超出范围
            speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
            
            // 如果速度变化，更新显示
            if (speed !== currentSpeed) {
                currentSpeed = speed;
                
                // 更新视频播放速度
                this.targetVideo.playbackRate = speed;
                
                // 更新显示文本
                speedValue.textContent = `${speed.toFixed(1)}x`;

                // 根据速度调整颜色
                speedValue.classList.remove('tm-speed-value-fast', 'tm-speed-value-slow', 'tm-speed-value-normal');
                if (speed > 1.5) {
                    speedValue.classList.add('tm-speed-value-fast');
                } else if (speed < 0.8) {
                    speedValue.classList.add('tm-speed-value-slow');
                } else {
                    speedValue.classList.add('tm-speed-value-normal');
                }
            }
        };

        // 拖动过程函数
        const drag = (e) => {
            if (!isDragging) return;
            handleDragEvent(e);
        };

        // 拖动开始函数
        const startDrag = (e) => {
            isDragging = true;
            playbackRateSlider.classList.add('dragging');
            playbackRateSlider.classList.add('tm-playback-slider-dragging');
            handleDragEvent(e);
        };

        // 拖动结束函数
        const endDrag = () => {
            if (!isDragging) return;
            
            isDragging = false;
            playbackRateSlider.classList.remove('dragging');
            playbackRateSlider.classList.remove('tm-playback-slider-dragging');
            playbackRateSlider.classList.add('tm-playback-slider-default');
            
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        // 处理拖动事件
        const handleDragEvent = (e) => {
            e.preventDefault();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const rect = sliderContainer.getBoundingClientRect();
            const width = rect.width;
            
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            
            rafId = requestAnimationFrame(() => {
                let percentage = ((clientX - rect.left) / width) * 100;
                percentage = Math.max(0, Math.min(100, percentage));
                
                // 添加吸附效果 - 预设的倍速点
                const snapPoints = marksPositions.map(mark => mark.pos);
                const snapThreshold = 5;
                
                for (const point of snapPoints) {
                    if (Math.abs(percentage - point) < snapThreshold) {
                        percentage = point;
                        
                        // 添加触觉反馈（如果设备支持）
                        if (window.navigator.vibrate) {
                            window.navigator.vibrate(5);
                        }
                        
                        break;
                    }
                }
                
                lastPercentage = percentage;
                updateSlider(percentage);
            });
        };

        // 添加事件监听
        sliderContainer.addEventListener('mousedown', startDrag, { passive: false });
        sliderContainer.addEventListener('touchstart', startDrag, { passive: false });
        
        window.addEventListener('mousemove', drag, { passive: false });
        window.addEventListener('touchmove', drag, { passive: false });
        
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
        window.addEventListener('mouseleave', endDrag);

        // 双击重置为1.0倍速
        playbackRateSlider.addEventListener('dblclick', () => {
            lastPercentage = 30; // 30%对应1.0倍速
            updateSlider(30);
        });

        // 初始更新一次滑块
        updateSlider(30);

        this.playbackRateSlider = playbackRateSlider; // 保存引用
        this.updatePlaybackRateSlider = updateSlider; // 保存更新函数
    }

    /**
     * 创建音量控制滑杆
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

            // 滑杆触摸事件
            sliderTrack.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                isDragging = true;
                volumeControl.classList.add('dragging');
                expandSlider();
                updateVolume(e.touches[0].clientX);
            }, { passive: false });

            sliderTrack.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                updateVolume(e.touches[0].clientX);
            }, { passive: false });

            sliderTrack.addEventListener('touchend', () => {
                isDragging = false;
                volumeControl.classList.remove('dragging');
                // 延迟收起滑杆
                setTimeout(collapseSlider, 1500);
            });

            // 滑杆鼠标事件
            sliderTrack.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isDragging = true;
                volumeControl.classList.add('dragging');
                expandSlider();
                updateVolume(e.clientX);
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                updateVolume(e.clientX);
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    volumeControl.classList.remove('dragging');
                    // 延迟收起滑杆
                    setTimeout(collapseSlider, 1500);
                }
            });
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
        // 先检查muted状态，确保静音图标在所有设备上正确显示
        if (this.targetVideo.muted || volume === 0) {
            return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M23 9L17 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 9L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        } else if (this.supportsVolumeControl && volume < 0.5) {
            return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        } else {
            return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.07 4.93C20.9447 6.80527 21.9979 9.34855 21.9979 12C21.9979 14.6515 20.9447 17.1947 19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
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
            // 确保滑杆宽度从2px开始（与CSS中的left: 2px对应）
            const levelWidth = Math.max(0, Math.min(100, volume * 100));
            this.volumeLevel.style.width = `calc(${levelWidth}% - 2px)`;
        }
        
        // 更新音量值显示
        if (this.volumeValue) {
            // 显示百分比，四舍五入到整数
            const volumePercent = Math.round(volume * 100);
            this.volumeValue.textContent = `${volumePercent}%`;

            // 根据音量值添加不同的类名
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
     * 更新播放/暂停按钮状态
     */
    updatePlayPauseButton() {
        if (!this.playPauseButton) return;
        
        // 根据当前视频状态更新图标
        if (this.targetVideo.paused) {
            this.playPauseButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 12L7 5V19L18 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        } else {
            this.playPauseButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4H6V20H10V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 4H14V20H18V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    }
    
    /**
     * 更新静音按钮状态
     */
    updateMuteButton() {
        if (!this.muteButton) return;
        
        // 根据当前视频状态更新图标
        if (this.targetVideo.muted) {
            this.muteButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M23 9L17 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17 9L23 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        } else {
            this.muteButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.54 5.46C20.4246 7.34535 21.4681 9.90302 21.4681 12.575C21.4681 15.247 20.4246 17.8047 18.54 19.69" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        }
    }

    /**
     * 更新进度条
     */
    updateProgressBar() {
        if (!this.targetVideo || !this.progressBarElement || !this.progressIndicator) return;

        const currentTime = this.targetVideo.currentTime;
        const duration = this.targetVideo.duration;
        
        if (isNaN(duration) || duration <= 0) return;
        
        // 计算进度百分比
        const progressPercent = (currentTime / duration) * 100;
        
        // 更新进度指示器的宽度
        this.progressIndicator.style.width = `${progressPercent}%`;
        
        // 更新时间显示
        this.updateCurrentTimeDisplay();
        
        // 如果启用了循环播放，检查是否需要循环
        if (this.loopManager && this.loopManager.loopActive && this.loopManager.loopStartTime !== null && this.loopManager.loopEndTime !== null) {
            if (currentTime >= this.loopManager.loopEndTime) {
                // 回到循环起点
                this.targetVideo.currentTime = this.loopManager.loopStartTime;
            }
        }
    }
    
    /**
     * 更新当前时间显示
     */
    updateCurrentTimeDisplay() {
        if (!this.targetVideo || !this.currentTimeDisplay || !this.totalDurationDisplay) return;

        const currentTime = this.targetVideo.currentTime;
        const duration = this.targetVideo.duration;
        
        if (isNaN(duration)) return;
        
        // 更新当前时间显示
        this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        
        // 计算并显示剩余时长，而不是总时长
        const remainingTime = duration - currentTime;
        this.totalDurationDisplay.textContent = `-${this.formatTime(remainingTime)}`;
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
            // 提取时间值和单位
            const value = parseInt(text.replace(/[+-]/g, ''));
            const unit = text.includes('m') ? 'm' : 's';
            
            // 定义透明度区间
            let opacity = 0.5; // 默认透明度
            
            // 秒级跳转按钮透明度较低
            if (unit === 's') {
                if (value <= 5) opacity = 0.5;
                else if (value <= 10) opacity = 0.6;
                else opacity = 0.7; // 30s
            } 
            // 分钟级跳转按钮透明度较高
            else if (unit === 'm') {
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

        // 检查文本是否包含时间指示
        const isRewind = text.includes('-');
        const isForward = text.includes('+');
        const pureText = text.replace(/[+-]/g, ''); // 移除加减号

        // 创建SVG图标
        const rewindSvg = `<svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-rewind-icon">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.70711 4.29289C3.31658 3.90237 2.68342 3.90237 2.29289 4.29289L-4.70711 11.2929C-5.09763 11.6834 -5.09763 12.3166 -4.70711 12.7071L2.29289 19.7071C2.68342 20.0976 3.31658 20.0976 3.70711 19.7071C4.09763 19.3166 4.09763 18.6834 3.70711 18.2929L-2.58579 12L3.70711 5.70711C4.09763 5.31658 4.09763 4.68342 3.70711 4.29289Z" fill="currentColor"/>
        </svg>`;
        
        const forwardSvg = `<svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-forward-icon">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="currentColor"/>
        </svg>`;
        
        // 设置按钮内容
        if (isRewind) {
            button.innerHTML = `<div class="tm-time-control-button-inner">${rewindSvg}<span class="tm-time-text-margin-left">${pureText}</span></div>`;
        } else if (isForward) {
            button.innerHTML = `<div class="tm-time-control-button-inner"><span class="tm-time-text-margin-right">${pureText}</span>${forwardSvg}</div>`;
        } else {
            button.textContent = text;
        }
        
        button.addEventListener('click', callback);

        // 添加悬停效果
        button.addEventListener('mouseover', () => {
            button.classList.add('tm-time-control-button-hover');
            button.classList.remove('tm-time-control-button-default');
        });

        button.addEventListener('mouseout', () => {
            button.classList.add('tm-time-control-button-default');
            button.classList.remove('tm-time-control-button-hover', 'tm-time-control-button-active', 'tm-time-control-button-after-active');
        });

        // 点击效果
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
     * 格式化时间
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * 添加控制按钮
     * @param {HTMLElement} container 按钮容器
     * @param {string} text 按钮文本
     * @param {Function} callback 点击回调函数
     * @returns {HTMLElement} 创建的按钮元素
     */
    addControlButton(container, text, callback) {
        const button = document.createElement('button');
        button.className = 'tm-control-button';
        button.textContent = text;
        
        button.addEventListener('click', callback);
        
        // 添加悬停效果
        button.addEventListener('mouseover', () => {
            button.classList.add('tm-control-button-hover');
            button.classList.remove('tm-control-button-default');
        });
        
        button.addEventListener('mouseout', () => {
            button.classList.add('tm-control-button-default');
            button.classList.remove('tm-control-button-hover');
        });
        
        container.appendChild(button);
        return button;
    }

    /**
     * 显示暂停指示器
     */
    showPauseIndicator() {
        // 如果指示器已存在，则移除它
        if (this.pauseIndicator) {
            if (this.pauseIndicator.parentNode) {
                this.pauseIndicator.parentNode.removeChild(this.pauseIndicator);
            }
            this.pauseIndicator = null;
        }
        
        // 创建暂停指示器元素
        this.pauseIndicator = document.createElement('div');
        this.pauseIndicator.className = 'tm-indicator-base tm-pause-indicator';
        
        // 设置样式定位到视频中心
        this.pauseIndicator.style.position = 'absolute';
        this.pauseIndicator.style.top = '50%';
        this.pauseIndicator.style.left = '50%';
        this.pauseIndicator.style.transform = 'translate(-50%, -50%)';
        this.pauseIndicator.style.display = 'flex';
        this.pauseIndicator.style.justifyContent = 'center';
        this.pauseIndicator.style.alignItems = 'center';
        
        // 添加暂停图标
        this.pauseIndicator.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14,6v20c0,1.1-0.9,2-2,2H8c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h4C13.1,4,14,4.9,14,6z M24,4h-4
                c-1.1,0-2,0.9-2,2v20c0,1.1,0.9,2,2,2h4c1.1,0,2-0.9,2-2V6C26,4.9,25.1,4,24,4z" fill="white"/>
            </svg>
        `;
        
        // 添加到视频包装器
        this.uiElements.videoWrapper.appendChild(this.pauseIndicator);
        
        // 延迟一帧后显示，确保过渡动画生效
        requestAnimationFrame(() => {
            this.pauseIndicator.classList.add('visible');
        });
        
        // 1秒后开始淡出
        setTimeout(() => {
            if (this.pauseIndicator) {
                this.pauseIndicator.classList.remove('visible');
                
                // 等待过渡效果完成后移除元素
                setTimeout(() => {
                    if (this.pauseIndicator && this.pauseIndicator.parentNode) {
                        this.pauseIndicator.parentNode.removeChild(this.pauseIndicator);
                        this.pauseIndicator = null;
                    }
                }, 300); // 过渡效果持续时间
            }
        }, 1000);
    }
    
    /**
     * 显示播放倍速指示器
     * @param {number} rate - 当前播放速度
     */
    showPlaybackRateIndicator(rate) {
        // 如果指示器已存在，清除之前的定时器并移除它
        if (this.playbackRateIndicator) {
            clearTimeout(this.playbackRateIndicator.hideTimeout);
            if (this.playbackRateIndicator.parentNode) {
                this.playbackRateIndicator.parentNode.removeChild(this.playbackRateIndicator);
            }
            this.playbackRateIndicator = null;
        }
        
        // 创建倍速指示器
        this.playbackRateIndicator = document.createElement('div');
        this.playbackRateIndicator.className = 'tm-indicator-base tm-playback-rate-indicator';
        
        // 设置样式
        this.playbackRateIndicator.style.position = 'absolute';
        this.playbackRateIndicator.style.top = '20%';
        this.playbackRateIndicator.style.left = '50%';
        this.playbackRateIndicator.style.transform = 'translateX(-50%)';
        
        // 设置倍速文本
        this.playbackRateIndicator.textContent = `${rate.toFixed(1)}x`;
        
        // 根据速度调整颜色
        if (rate > 1.5) {
            this.playbackRateIndicator.style.color = 'hsl(var(--shadcn-orange))';
        } else if (rate < 0.8) {
            this.playbackRateIndicator.style.color = 'hsl(var(--shadcn-blue))';
        }
        
        // 添加到视频包装器
        this.uiElements.videoWrapper.appendChild(this.playbackRateIndicator);
        
        // 延迟一帧后显示，确保过渡动画生效
        requestAnimationFrame(() => {
            this.playbackRateIndicator.classList.add('visible');
        });
        
        // 1.5秒后开始淡出
        this.playbackRateIndicator.hideTimeout = setTimeout(() => {
            if (this.playbackRateIndicator) {
                this.playbackRateIndicator.classList.remove('visible');
                
                // 等待过渡效果完成后移除元素
                setTimeout(() => {
                    if (this.playbackRateIndicator && this.playbackRateIndicator.parentNode) {
                        this.playbackRateIndicator.parentNode.removeChild(this.playbackRateIndicator);
                        this.playbackRateIndicator = null;
                    }
                }, 300); // 过渡效果持续时间
            }
        }, 1500);
    }
} 