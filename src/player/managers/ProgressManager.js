/**
 * 进度管理器类 - 负责进度条和时间显示功能
 */
export class ProgressManager {
    constructor(playerCore, uiElements) {
        // 核心引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
        // UI元素引用
        this.uiElements = uiElements;
        this.progressBarElement = null;  // 进度条元素
        this.progressIndicator = null;   // 进度指示器
        this.currentTimeDisplay = null;  // 当前时间显示
        this.totalDurationDisplay = null; // 总时长显示
        this.timeIndicator = null;       // 时间指示器
        
        // 拖动状态
        this.isDraggingProgress = false; // 是否正在拖动进度条
        this.progressHandleMoveHandler = null; // 进度条移动事件处理函数
        this.progressHandleUpHandler = null;   // 进度条释放事件处理函数
        this.lastDragX = 0; // 上次拖动位置的X坐标
        this.isTouchDevice = 'ontouchstart' in window; // 检测是否为触摸设备
    }
    
    /**
     * 初始化进度管理器
     */
    init(progressElements) {
        this.progressBarElement = progressElements.progressBarElement;
        this.progressIndicator = progressElements.progressIndicator;
        this.currentTimeDisplay = progressElements.currentTimeDisplay;
        this.totalDurationDisplay = progressElements.totalDurationDisplay;
        this.timeIndicator = progressElements.timeIndicator;
        
        // 进度条容器元素 (父元素)
        this.progressBarContainer = this.progressBarElement.parentElement;
        
        // 添加进度条事件监听
        this.progressBarElement.addEventListener('click', this.handleProgressClick.bind(this));
        
        // 为整个进度条容器添加拖动事件监听，增加可点击/拖动区域
        this.progressBarContainer.addEventListener('mousedown', this.startProgressDrag.bind(this));
        this.progressBarContainer.addEventListener('touchstart', this.startProgressDrag.bind(this), { passive: false });
        
        // 监听视频时间更新
        this.targetVideo.addEventListener('timeupdate', this.updateProgressBar.bind(this));
        
        return this;
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
     * 格式化时间
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return '00:00:00';
        }
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainingSeconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 处理进度条点击
     */
    handleProgressClick(e) {
        // 如果正在拖动进度条，则忽略点击事件
        if (this.isDraggingProgress) return;
        
        // 获取进度条的位置信息
        const rect = this.progressBarElement.getBoundingClientRect();
        
        // 计算点击位置相对于进度条的比例 (0-1)
        const relativePos = (e.clientX - rect.left) / rect.width;
        
        // 计算目标时间
        const duration = this.targetVideo.duration;
        if (isNaN(duration)) return;
        
        const targetTime = duration * relativePos;
        
        // 设置视频当前时间
        this.targetVideo.currentTime = targetTime;
        
        // 更新进度条
        this.updateProgressBar();
    }
    
    /**
     * 相对时间跳转
     */
    seekRelative(seconds) {
        if (!this.targetVideo) return;
        
        const newTime = Math.max(0, Math.min(this.targetVideo.duration, this.targetVideo.currentTime + seconds));
        this.targetVideo.currentTime = newTime;
    }
    
    /**
     * 开始进度条拖动
     */
    startProgressDrag(e) {
        // 阻止默认行为，防止选择文本或触发其他事件
        e.preventDefault();
        e.stopPropagation();
        
        // 设置拖动状态
        this.isDraggingProgress = true;
        
        // 保存初始点击位置
        this.lastDragX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        // 保持进度条高度以获得更好的拖动体验
        this.progressBarElement.classList.add('tm-progress-bar-expanded');
        this.progressBarElement.classList.remove('tm-progress-bar-normal');
        
        // 添加拖动状态标记
        this.progressBarElement.classList.add('tm-dragging');
        
        // 显示时间指示器
        if (this.timeIndicator) {
            this.timeIndicator.style.display = 'block';
            this.timeIndicator.style.opacity = '1';
            this.updateTimeIndicator(e);
        }
        
        // 绑定移动和释放事件处理函数
        const moveHandler = this.handleProgressMove.bind(this);
        const upHandler = this.handleProgressUp.bind(this);
        
        // 清除之前可能存在的事件监听
        this.removeProgressEventListeners();
        
        // 添加事件监听 - 使用 document 以捕获所有移动事件，即使鼠标移出进度条
        if (e.type.includes('touch')) {
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', upHandler, { passive: false });
            document.addEventListener('touchcancel', upHandler, { passive: false });
        } else {
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
            document.addEventListener('mouseleave', upHandler);
        }
        
        this.progressHandleMoveHandler = moveHandler;
        this.progressHandleUpHandler = upHandler;
        
        // 立即调整到点击位置（与handleProgressClick的功能一致）
        const rect = this.progressBarElement.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        let relativePos = (clientX - rect.left) / rect.width;
        relativePos = Math.max(0, Math.min(1, relativePos));
        
        const duration = this.targetVideo.duration;
        if (!isNaN(duration)) {
            const newTime = duration * relativePos;
            this.targetVideo.currentTime = newTime;
            this.progressIndicator.style.width = `${relativePos * 100}%`;
            this.updateCurrentTimeDisplay();
        }
    }
    
    /**
     * 处理进度条拖动移动
     */
    handleProgressMove(e) {
        // 如果不是处于拖动状态，则退出
        if (!this.isDraggingProgress) return;
        
        // 阻止默认行为
        e.preventDefault();
        
        // 获取当前位置
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        // 更新时间指示器
        this.updateTimeIndicator(e);
        
        // 计算新的进度位置
        const rect = this.progressBarElement.getBoundingClientRect();
        
        // 确保进度条元素可见并有宽度
        if (rect.width <= 0) return;
        
        // 计算相对位置 (0-1)
        let relativePos = (clientX - rect.left) / rect.width;
        relativePos = Math.max(0, Math.min(1, relativePos));
        
        // 计算新时间
        const duration = this.targetVideo.duration;
        if (isNaN(duration)) return;
        
        const newTime = duration * relativePos;
        
        // 更新进度指示器位置
        this.progressIndicator.style.width = `${relativePos * 100}%`;
        
        // 实时更新视频播放位置
        this.targetVideo.currentTime = newTime;
        
        // 更新时间显示
        this.currentTimeDisplay.textContent = this.formatTime(newTime);
        const remainingTime = duration - newTime;
        this.totalDurationDisplay.textContent = `-${this.formatTime(remainingTime)}`;
        
        // 更新最后拖动位置
        this.lastDragX = clientX;
    }
    
    /**
     * 处理进度条释放
     */
    handleProgressUp(e) {
        // 如果不是处于拖动状态，则退出
        if (!this.isDraggingProgress) return;
        
        // 计算最终位置并设置视频时间
        const rect = this.progressBarElement.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? 
            (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : this.lastDragX) : 
            (e.clientX || this.lastDragX);
        
        // 计算相对位置 (0-1)
        let relativePos = (clientX - rect.left) / rect.width;
        relativePos = Math.max(0, Math.min(1, relativePos));
        
        // 设置视频当前时间
        const duration = this.targetVideo.duration;
        if (!isNaN(duration)) {
            this.targetVideo.currentTime = duration * relativePos;
        }
        
        // 隐藏时间指示器
        if (this.timeIndicator) {
            this.timeIndicator.style.opacity = '0';
        }
        
        // 移除拖动状态标记
        this.progressBarElement.classList.remove('tm-dragging');
        
        // 恢复进度条高度
        if (!this.progressBarElement.classList.contains('tm-progress-bar-hovered')) {
            this.progressBarElement.classList.add('tm-progress-bar-normal');
            this.progressBarElement.classList.remove('tm-progress-bar-expanded');
        }
        
        // 清理状态和事件
        this.isDraggingProgress = false;
        this.lastDragX = 0; // 重置拖动坐标
        
        // 移除事件监听
        this.removeProgressEventListeners();
    }
    
    /**
     * 移除进度条相关事件监听
     */
    removeProgressEventListeners() {
        if (this.progressHandleMoveHandler) {
            document.removeEventListener('mousemove', this.progressHandleMoveHandler);
            document.removeEventListener('touchmove', this.progressHandleMoveHandler);
        }
        
        if (this.progressHandleUpHandler) {
            document.removeEventListener('mouseup', this.progressHandleUpHandler);
            document.removeEventListener('touchend', this.progressHandleUpHandler);
            document.removeEventListener('touchcancel', this.progressHandleUpHandler);
            document.removeEventListener('mouseleave', this.progressHandleUpHandler);
        }
        
        this.progressHandleMoveHandler = null;
        this.progressHandleUpHandler = null;
    }
    
    /**
     * 更新时间指示器位置和内容
     */
    updateTimeIndicator(e) {
        if (!this.timeIndicator || !this.targetVideo) return;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        // 获取视频容器的位置
        const videoRect = this.uiElements.videoWrapper.getBoundingClientRect();
        const progressRect = this.progressBarElement.getBoundingClientRect();
        
        // 计算指示器位置，确保始终在视频区域内部
        let leftPos = Math.max(videoRect.left + 10, Math.min(videoRect.right - 10, clientX));
        
        // 计算垂直位置 - 放在进度条上方一定距离
        let topPos = progressRect.top - 20;
        
        // 设置指示器位置
        this.timeIndicator.style.left = `${leftPos}px`;
        this.timeIndicator.style.top = `${topPos}px`;
        
        // 计算时间
        const relativePos = (clientX - progressRect.left) / progressRect.width;
        const boundedPos = Math.max(0, Math.min(1, relativePos));
        
        const duration = this.targetVideo.duration;
        if (isNaN(duration)) return;
        
        const time = duration * boundedPos;
        
        // 更新指示器内容
        this.timeIndicator.textContent = `${this.formatTime(time)} / ${this.formatTime(duration)}`;
    }
} 