import { formatTime } from '../../utils/index.js';

import { CommentPanel } from '../controls/CommentPanel.js';
import { VolumeController } from '../controls/VolumeController.js';
import { SeekController } from '../controls/SeekController.js';
import { PlaybackController } from '../controls/PlaybackController.js';

/**
 * 控制管理器类 - 负责播放器控制按钮和相关功能 (重构后的 Facade 编排器)
 */
export class ControlManager {
    constructor(playerCore, uiElements) {
        // 核心引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
        // UI元素引用
        this.uiElements = uiElements;

        // 初始化子控制器组件
        this.commentPanel = new CommentPanel(playerCore, this);
        this.volumeController = new VolumeController(playerCore, this);
        this.seekController = new SeekController(playerCore, this);
        this.playbackController = new PlaybackController(playerCore, this);
        
        // 控制按钮容器和元素
        this.controlButtonsContainer = null; // 控制按钮容器
        this.progressControlsContainer = null; // 进度控制容器

        // 共享元素引用 (暴露给 ProgressManager 和 LoopManager)
        this.progressBarElement = null;  // 进度条元素
        this.progressIndicator = null;   // 进度指示器
        this.currentTimeDisplay = null;  // 当前时间显示
        this.totalDurationDisplay = null; // 总时长显示
        this.timeIndicator = null;       // 时间指示器
        
        // 循环控制元素 (暴露给 LoopManager)
        this.loopStartMarker = null;
        this.loopEndMarker = null;
        this.loopRangeElement = null;
        
        // 标签栏元素 (暴露给 LoopManager)
        this.tabScrollContainer = null;
        this.tabAddBtn = null;
        this.progressMarkersContainer = null;
        
        // 循环管理器引用
        this.loopManager = null;

        // 支持音量控制标志，由 VolumeController 决定
        this.supportsVolumeControl = this.volumeController.supportsVolumeControl;

        // 保存绑定的事件处理器，便于清理
        this._volumeChangeHandler = null;
        this._rateChangeHandler = null;
    }

    /**
     * 兼容性 Getters：将原 ControlManager 的属性委托给子控制器
     */
    get volumeSlider() {
        return this.volumeController ? this.volumeController.volumeSlider : null;
    }

    get volumeLevel() {
        return this.volumeController ? this.volumeController.volumeLevel : null;
    }

    get volumeValue() {
        return this.volumeController ? this.volumeController.volumeValue : null;
    }

    get playbackRateSlider() {
        return this.playbackController ? this.playbackController.playbackRateSlider : null;
    }

    get playPauseButton() {
        return this.playbackController ? this.playbackController.playPauseButton : null;
    }

    get pauseIndicator() {
        return this.playbackController ? this.playbackController.pauseIndicator : null;
    }

    get playbackRateIndicator() {
        return this.playbackController ? this.playbackController.playbackRateIndicator : null;
    }

    /**
     * 兼容性方法：更新播放/暂停按钮状态
     */
    updatePlayPauseButton() {
        if (this.playbackController) {
            this.playbackController.updatePlayPauseButton();
        }
    }

    /**
     * 兼容性方法：显示视频中心的暂停指示器
     */
    showPauseIndicator() {
        if (this.playbackController) {
            this.playbackController.showPauseIndicator();
        }
    }

    /**
     * 设置循环管理器引用
     */
    setLoopManager(loopManager) {
        this.loopManager = loopManager;
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
     * 创建进度条控制组件
     */
    createProgressControls() {
        this.progressControlsContainer = document.createElement('div');
        this.progressControlsContainer.className = 'tm-progress-controls';

        // 时间显示容器
        const timeDisplayContainer = document.createElement('div');
        timeDisplayContainer.className = 'tm-time-display-container';

        this.currentTimeDisplay = document.createElement('span');
        this.currentTimeDisplay.className = 'tm-current-time';
        this.currentTimeDisplay.textContent = '00:00:00';

        this.totalDurationDisplay = document.createElement('span');
        this.totalDurationDisplay.className = 'tm-total-duration';
        this.totalDurationDisplay.textContent = '-00:00:00';

        // 进度条容器
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'tm-progress-bar-container';
        this.progressBarContainer = progressBarContainer; // 保存容器引用用于展示跳转涟漪波纹

        this.progressBarElement = document.createElement('div');
        this.progressBarElement.className = 'tm-progress-bar';

        this.progressIndicator = document.createElement('div');
        this.progressIndicator.className = 'tm-progress-indicator';

        // 进度条展开与收回 hover/touch 交互
        progressBarContainer.addEventListener('mouseenter', () => {
            this.progressBarElement.classList.add('tm-progress-bar-expanded');
        });

        progressBarContainer.addEventListener('mouseleave', () => {
            if (!this.isDraggingProgress) {
                this.progressBarElement.classList.add('tm-progress-bar-normal');
                this.progressBarElement.classList.remove('tm-progress-bar-expanded');
            }
        });

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

        // 循环播放的 A/B 标记点元素
        this.loopStartMarker = document.createElement('div');
        this.loopStartMarker.className = 'tm-loop-marker tm-loop-start-marker';
        this.loopStartMarker.style.display = 'none';
        
        this.loopEndMarker = document.createElement('div');
        this.loopEndMarker.className = 'tm-loop-marker tm-loop-end-marker';
        this.loopEndMarker.style.display = 'none';

        this.loopRangeElement = document.createElement('div');
        this.loopRangeElement.className = 'tm-loop-range';
        this.loopRangeElement.style.display = 'none';

        // 组装结构
        timeDisplayContainer.appendChild(this.currentTimeDisplay);
        timeDisplayContainer.appendChild(this.totalDurationDisplay);

        this.progressBarElement.appendChild(this.progressIndicator);
        progressBarContainer.appendChild(this.progressBarElement);

        this.progressMarkersContainer = document.createElement('div');
        this.progressMarkersContainer.className = 'tm-progress-markers-container';
        progressBarContainer.appendChild(this.progressMarkersContainer);

        progressBarContainer.appendChild(this.loopStartMarker);
        progressBarContainer.appendChild(this.loopEndMarker);
        progressBarContainer.appendChild(this.loopRangeElement);

        this.progressControlsContainer.appendChild(timeDisplayContainer);
        this.progressControlsContainer.appendChild(progressBarContainer);
        
        return this.progressControlsContainer;
    }

    /**
     * 创建控制按钮容器
     */
    createControlButtonsContainer() {
        this.controlButtonsContainer = document.createElement('div');
        this.controlButtonsContainer.className = 'tm-control-buttons';

        // 创建 PC 悬浮窗的拖拽句柄
        this.dragHandle = document.createElement('div');
        this.dragHandle.className = 'tm-control-drag-handle';
        this.dragHandle.title = '拖动移动控制面板 (双击重置位置)';
        this.controlButtonsContainer.appendChild(this.dragHandle);

        // 1. 创建评论区行作为第一个 row (由 CommentPanel 委托处理)
        const commentRow = this.commentPanel.createCommentRow();
        this.controlButtonsContainer.appendChild(commentRow);

        // 2. 进度条行作为第二个 row
        const progressRow = document.createElement('div');
        progressRow.className = 'tm-progress-row';
        this.progressRow = progressRow; // 保存行引用用于展示跳转高亮
        progressRow.appendChild(this.progressControlsContainer);
        this.controlButtonsContainer.appendChild(progressRow);

        // 3. 快退和快进按钮行 (由 SeekController 委托处理)
        const seekControlRow = this.seekController.createSeekControlRow();
        this.controlButtonsContainer.appendChild(seekControlRow);

        // 4. 标签页导航行 (Tab-Style Marker Bar)
        const loopControlRow = document.createElement('div');
        loopControlRow.className = 'tm-loop-control-row';

        this.tabScrollContainer = document.createElement('div');
        this.tabScrollContainer.className = 'tm-tab-scroll-container';

        this.tabAddBtn = document.createElement('div');
        this.tabAddBtn.className = 'tm-tab-list-btn';
        this.tabAddBtn.textContent = '☰';

        loopControlRow.appendChild(this.tabScrollContainer);
        loopControlRow.appendChild(this.tabAddBtn);
        this.controlButtonsContainer.appendChild(loopControlRow);

        // 5. 播放控制行：播放/暂停、音量和倍速滑杆
        const playbackControlRow = document.createElement('div');
        playbackControlRow.className = 'tm-playback-control-row';

        const leftControlsArea = document.createElement('div');
        leftControlsArea.className = 'tm-left-controls';
        leftControlsArea.style.display = 'flex';
        leftControlsArea.style.alignItems = 'center';
        leftControlsArea.style.gap = '6px';
        leftControlsArea.style.flex = '1';

        // 委托 VolumeController 创建音量滑杆
        this.volumeController.createVolumeSlider(leftControlsArea);

        const centerControlsArea = document.createElement('div');
        centerControlsArea.className = 'tm-center-controls';
        centerControlsArea.style.display = 'flex';
        centerControlsArea.style.alignItems = 'center';
        centerControlsArea.style.justifyContent = 'center';
        centerControlsArea.style.flex = '1';

        // 委托 PlaybackController 创建播放/暂停按钮
        this.playbackController.createPlayPauseButton(centerControlsArea);

        const rightControlsArea = document.createElement('div');
        rightControlsArea.className = 'tm-right-controls';
        rightControlsArea.style.display = 'flex';
        rightControlsArea.style.alignItems = 'center';
        rightControlsArea.style.justifyContent = 'flex-end';
        rightControlsArea.style.flex = '1';
        rightControlsArea.style.gap = '6px';

        // 委托 PlaybackController 创建倍速滑块
        this.playbackController.createPlaybackRateSlider(rightControlsArea);

        playbackControlRow.appendChild(leftControlsArea);
        playbackControlRow.appendChild(centerControlsArea);
        playbackControlRow.appendChild(rightControlsArea);
        this.controlButtonsContainer.appendChild(playbackControlRow);

        // 点击或触摸控制面板 -> 评论区变暗以突出显示控制栏
        const dimCommentsOnControlInteract = () => {
            if (this.commentPanel && this.commentPanel.commentsPanel) {
                this.commentPanel.commentsPanel.classList.add('is-dimmed');
            }
        };
        this.controlButtonsContainer.addEventListener('mousedown', dimCommentsOnControlInteract, { passive: true });
        this.controlButtonsContainer.addEventListener('touchstart', dimCommentsOnControlInteract, { passive: true });

        return this.controlButtonsContainer;
    }

    /**
     * 绑定音量和倍速的外部事件同步监听
     */
    initEventListeners() {
        // 监听视频静音及音量变化事件
        this._volumeChangeHandler = () => {
            if (this.volumeController) {
                this.volumeController.updateVolumeUI();
            }
        };
        this.targetVideo.addEventListener('volumechange', this._volumeChangeHandler);

        // 监听视频播放倍速变化事件
        this._rateChangeHandler = () => {
            if (this.playbackController) {
                const currentRate = this.targetVideo.playbackRate;
                this.playbackController.syncPlaybackRateSlider(currentRate);
            }
        };
        this.targetVideo.addEventListener('ratechange', this._rateChangeHandler);
    }

    /**
     * 触发播放时间跳转时的视觉提示 (用于评论区时间戳点击)
     * @param {number} targetSecs - 跳转的目标秒数
     */
    showJumpHint(targetSecs) {
        if (!this.progressBarContainer || !this.targetVideo) return;
        
        const duration = this.targetVideo.duration || 1;
        const percentage = Math.max(0, Math.min(100, (targetSecs / duration) * 100));
        
        // 创建绿色闪烁高亮跳转标记 (样式类似于循环标记 tm-loop-start-marker)
        const jumpMarker = document.createElement('div');
        jumpMarker.className = 'tm-jump-active';
        jumpMarker.style.left = `${percentage}%`;
        
        this.progressBarContainer.appendChild(jumpMarker);
        
        // 动画结束后自动从 DOM 树中销毁，持续时间为 3 秒
        jumpMarker.addEventListener('animationend', () => {
            jumpMarker.remove();
        });
    }

    /**
     * 销毁事件监听器和子控制器以防止内存泄漏 (Lifecycle hook)
     */
    cleanup() {
        if (this._volumeChangeHandler) {
            this.targetVideo.removeEventListener('volumechange', this._volumeChangeHandler);
            this._volumeChangeHandler = null;
        }
        if (this._rateChangeHandler) {
            this.targetVideo.removeEventListener('ratechange', this._rateChangeHandler);
            this._rateChangeHandler = null;
        }

        if (this.volumeController) {
            this.volumeController.cleanup();
        }
        if (this.playbackController) {
            this.playbackController.cleanup();
        }
    }
}