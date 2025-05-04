/**
 * 视频水平移动管理器 - 全新模块化设计
 */
export class VideoSwipeManager {
    constructor(videoElement, containerElement, handleElement) {
        // 核心元素引用
        this.video = videoElement;
        this.container = containerElement;
        this.handle = handleElement;

        // 状态管理
        this.offset = 0;          // 当前水平偏移量
        this.maxOffset = 0;       // 最大偏移量限制
        this.isDragging = false;  // 视频拖动状态
        this.isHandleDragging = false; // 手柄拖动状态
        this.startX = 0;          // 拖动起始X坐标
        this.startOffset = 0;     // 拖动起始偏移量
        this.lastSnapPosition = null; // 上次吸附位置，用于判断是否需要震动
        this.wasDragging = false;      // 新增：标记是否刚完成拖动操作
        this.dragEndTimestamp = 0;     // 新增：记录拖动结束的时间戳
        this.dragDistance = 0;         // 新增：记录拖动距离
        this.minDragDistance = 10;     // 新增：最小有效拖动距离（像素）

        // 视频尺寸信息
        this.videoWidth = 0;      // 视频自然宽度
        this.videoHeight = 0;     // 视频自然高度
        this.containerWidth = 0;  // 容器宽度
        this.containerHeight = 0; // 容器高度
        this.videoScale = 1;      // 视频缩放比例

        // 惯性滚动相关
        this.velocityTracker = {
            positions: [],       // 存储最近的位置记录
            lastTimestamp: 0,    // 上次记录时间
            currentVelocity: 0   // 当前速度
        };

        // 手柄惯性滚动数据
        this.handleVelocityTracker = {
            positions: [],       // 存储最近的位置记录
            lastTimestamp: 0,    // 上次记录时间
            currentVelocity: 0   // 当前速度
        };

        // 动画状态
        this.animation = {
            active: false,        // 是否有动画正在进行
            rafId: null,          // requestAnimationFrame ID
            targetOffset: 0,      // 动画目标偏移量
            startTime: 0,         // 动画开始时间
            duration: 0           // 动画持续时间
        };

        // 事件处理函数（使用箭头函数绑定this）
        this._pointerDownHandler = this._handlePointerDown.bind(this);
        this._pointerMoveHandler = this._handlePointerMove.bind(this);
        this._pointerUpHandler = this._handlePointerUp.bind(this);

        // 手柄事件处理函数
        this._handlePointerDownHandler = this._handleHandlePointerDown.bind(this);
        this._handlePointerMoveHandler = this._handleHandlePointerMove.bind(this);
        this._handlePointerUpHandler = this._handleHandlePointerUp.bind(this);

        // 初始化
        this._init();
    }

    /**
     * 初始化管理器
     */
    _init() {
        console.log('[VideoSwipeManager] 初始化管理器');
        // 设置视频元素性能相关样式，不修改原始布局样式
        this.video.style.willChange = 'transform'; // 优化性能
        this.video.style.transition = 'transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)';

        // 注意：不再设置 width, height 或 objectFit，尊重原始样式

        // 添加视频事件监听
        this.video.addEventListener('pointerdown', this._pointerDownHandler);

        // 添加手柄事件监听
        if (this.handle) {
            this.handle.style.willChange = 'transform, left'; // 优化性能
            this.handle.style.transition = 'left 0.2s cubic-bezier(0.215, 0.61, 0.355, 1), width 0.2s ease';
            this.handle.addEventListener('pointerdown', this._handlePointerDownHandler);
        }

        // 初始更新约束条件
        this._updateConstraints();
        
        // 视频加载或尺寸变化时更新约束
        this.video.addEventListener('loadedmetadata', () => {
            console.log('[VideoSwipeManager] 视频元数据加载完成，更新约束');
            this._updateConstraints();
        });
        
        this.video.addEventListener('canplay', () => {
            console.log('[VideoSwipeManager] 视频可播放，更新约束');
            this._updateConstraints();
        });
    }

    /**
     * 计算视频的有效边界和可移动范围
     * @private
     */
    _updateVideoDimensions() {
        // 获取视频自然尺寸
        this.videoWidth = this.video.videoWidth || this.video.naturalWidth || 0;
        this.videoHeight = this.video.videoHeight || this.video.naturalHeight || 0;

        // 获取容器尺寸
        this.containerWidth = this.container.offsetWidth;
        this.containerHeight = this.container.offsetHeight;

        // 如果视频或容器尺寸无效，则不继续计算
        if (this.videoWidth <= 0 || this.videoHeight <= 0 ||
            this.containerWidth <= 0 || this.containerHeight <= 0) {
            this.videoScale = 1;
            this.maxOffset = 0;
            return false;
        }

        // 获取视频元素的当前实际尺寸
        const videoRect = this.video.getBoundingClientRect();
        const actualVideoWidth = videoRect.width;
        const actualVideoHeight = videoRect.height;

        // 计算视频缩放比例
        this.videoScale = actualVideoHeight / this.videoHeight;

        // 计算最大水平偏移量 (视频超出容器的部分的一半)
        const overflow = Math.max(0, actualVideoWidth - this.containerWidth);
        this.maxOffset = overflow / 2;

        return true;
    }

    /**
     * 更新约束条件（如最大偏移量）
     */
    _updateConstraints() {
        // 更新视频尺寸和约束
        const dimensionsUpdated = this._updateVideoDimensions();

        // 如果尺寸计算失败或视频宽度不超过容器，则无需移动
        if (!dimensionsUpdated || this.maxOffset <= 0) {
            // 重置到居中位置
            this._applyOffset(0, false);
            // 更新手柄状态为禁用移动，但宽度相应设置
            this._updateHandleState(false);
            return false;
        }

        // 限制当前偏移量在新的范围内
        this.offset = Math.max(-this.maxOffset, Math.min(this.offset, this.maxOffset));

        // 应用可能调整后的偏移量
        this._applyOffset(this.offset, false);

        // 更新手柄状态为可用
        this._updateHandleState(true);

        return true;
    }

    /**
     * 应用偏移量到视频元素
     * @param {number} offset - 要应用的偏移量
     * @param {boolean} animate - 是否使用动画过渡
     */
    _applyOffset(offset, animate = true) {
        // 确保偏移量在有效范围内
        this.offset = Math.max(-this.maxOffset, Math.min(offset, this.maxOffset));

        if (animate) {
            this.video.style.transition = 'transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)';
        } else {
            this.video.style.transition = 'none';
        }

        // 使用transform而不是left，利用GPU加速
        this.video.style.transform = `translateX(${this.offset}px)`;

        // 同步更新手柄位置
        this._updateHandlePosition();

        return this;
    }

    /**
     * 更新手柄状态
     * @param {boolean} enabled - 手柄是否应该启用
     */
    _updateHandleState(enabled) {
        if (!this.handle) return;

        // 更新手柄宽度
        this._updateHandleWidth();

        if (enabled) {
            this.handle.style.cursor = 'grab';
            this.video.style.cursor = 'grab';

            // 只有在视频比容器宽时才允许移动
            const handleContainer = this.handle.parentElement;
            if (handleContainer) {
                handleContainer.style.cursor = 'grab';
            }
        } else {
            // 视频完全可见或未超出容器时，手柄宽度适应但禁用拖动
            this.handle.style.cursor = 'default';
            this.video.style.cursor = 'default';
            // 不再设置手柄位置，使用_updateHandlePosition方法统一处理
        }

        // 立即更新手柄位置以反映视频偏移
        this._updateHandlePosition();
    }

    /**
     * 更新手柄宽度
     */
    _updateHandleWidth() {
        if (!this.handle) return;

        // 使用固定的手柄宽度，不再动态计算
        const handleWidthPercent = 30; // 固定宽度30%

        // 应用手柄宽度
        this.handle.style.width = `${handleWidthPercent}%`;
    }

    /**
     * 更新手柄位置
     */
    _updateHandlePosition() {
        if (!this.handle) return;

        const handleContainer = this.handle.parentElement;
        if (!handleContainer) return;

        // 如果视频宽度不超过容器，居中显示手柄
        if (this.maxOffset <= 0) {
            // 居中手柄
            this.handle.style.left = '50%';
            this.handle.style.transform = 'translateX(-50%)';
            return;
        }

        const containerWidth = handleContainer.offsetWidth;
        const handleWidth = this.handle.offsetWidth;

        // 计算手柄可移动的范围
        const handleMovableRange = containerWidth - handleWidth;

        // 视频偏移范围: [-maxOffset, maxOffset]
        // 手柄位置范围: [0, handleMovableRange]
        // 调整为反向移动：当视频偏移为最大负值时，手柄位置为最右侧，反之亦然
        const offsetRatio = 1 - ((this.offset + this.maxOffset) / (2 * this.maxOffset));
        const handleLeftPx = offsetRatio * handleMovableRange;

        // 更新手柄位置 (使用百分比让布局更灵活)
        const handleLeftPercent = (handleLeftPx / containerWidth) * 100;
        
        // // 平滑过渡
        // if (!this.isHandleDragging) {
        //     this.handle.style.transition = 'left 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)';
        // } else {
        //     this.handle.style.transition = 'none';
        // }
        
        this.handle.style.left = `${handleLeftPercent}%`;
        this.handle.style.transform = ''; // 清除可能存在的transform
    }

    /**
     * 记录速度数据
     * @param {number} x - 当前x坐标
     */
    _trackVelocity(x) {
        const now = Date.now();
        const tracker = this.velocityTracker;

        // 添加新位置记录
        tracker.positions.push({
            x: x,
            time: now
        });

        // 只保留最近100ms内的记录
        while (
            tracker.positions.length > 1 &&
            now - tracker.positions[0].time > 100
        ) {
            tracker.positions.shift();
        }

        // 计算当前速度 (像素/毫秒)
        if (tracker.positions.length > 1) {
            const first = tracker.positions[0];
            const last = tracker.positions[tracker.positions.length - 1];
            const deltaTime = last.time - first.time;

            if (deltaTime > 0) {
                tracker.currentVelocity = (last.x - first.x) / deltaTime;
            }
        }

        tracker.lastTimestamp = now;
    }

    /**
     * 应用惯性滚动
     */
    _applyInertia() {
        if (Math.abs(this.velocityTracker.currentVelocity) < 0.1) return;
        
        // 计算最终位置
        const velocity = this.velocityTracker.currentVelocity; // 像素/毫秒
        const deceleration = 0.002; // 减速率
        const distance = (velocity * velocity) / (2 * deceleration) * Math.sign(velocity);
        
        // 计算目标偏移量（考虑边界）
        let targetOffset = this.offset + distance;
        targetOffset = Math.max(-this.maxOffset, Math.min(targetOffset, this.maxOffset));
        
        // 计算动画持续时间（速度越快，时间越长）
        const duration = Math.min(
            Math.abs(velocity / deceleration) * 0.8, // 基于物理的持续时间
            400 // 最大不超过400ms
        );
        
        // 开始动画
        this._animateTo(targetOffset, duration);
    }

    /**
     * 动画滚动到指定偏移量
     * @param {number} targetOffset - 目标偏移量
     * @param {number} duration - 动画持续时间(毫秒)
     */
    _animateTo(targetOffset, duration = 300) {
        // 取消可能正在进行的动画
        if (this.animation.active) {
            cancelAnimationFrame(this.animation.rafId);
        }
        
        // 更新动画状态
        this.animation.active = true;
        this.animation.targetOffset = targetOffset;
        this.animation.startTime = Date.now();
        this.animation.duration = duration;
        
        // 开始动画帧循环
        const animate = () => {
            const now = Date.now();
            const elapsed = now - this.animation.startTime;

            if (elapsed >= duration) {
                // 动画结束
                this._applyOffset(targetOffset, false);
                this.animation.active = false;
                return;
            }

            // 使用easeOutCubic缓动函数计算当前位置
            const progress = 1 - Math.pow(1 - elapsed / duration, 3);
            const currentOffset = this.offset + (targetOffset - this.offset) * progress;
            
            this._applyOffset(currentOffset, false);
            this.animation.rafId = requestAnimationFrame(animate);
        };
        
        this.animation.rafId = requestAnimationFrame(animate);
    }

    /**
     * 处理指针按下事件 (视频元素)
     * @param {PointerEvent} e - 指针事件
     */
    _handlePointerDown(e) {
        // 如果视频宽度不超过容器，则不处理
        if (this.maxOffset <= 0) return;
        
        // 只处理主指针
        if (!e.isPrimary) return;
        
        // 停止可能正在进行的动画
        if (this.animation.active) {
            cancelAnimationFrame(this.animation.rafId);
            this.animation.active = false;
        }

        // 初始化拖动状态
        this.isDragging = true;
        this.startX = e.clientX;
        this.startOffset = this.offset;
        this.dragDistance = 0;  // 重置拖动距离
        
        // 重置速度追踪器
        this.velocityTracker.positions = [];
        this.velocityTracker.lastTimestamp = Date.now();
        this.velocityTracker.currentVelocity = 0;

        // 记录初始位置
        this._trackVelocity(e.clientX);
        
        // 更新视觉状态
        this.video.style.cursor = 'grabbing';
        this.video.style.transition = 'none';

        // 如果支持指针捕获，捕获指针
        if (this.video.setPointerCapture) {
            this.video.setPointerCapture(e.pointerId);
        }

        // 添加事件监听
        this.video.addEventListener('pointermove', this._pointerMoveHandler);
        this.video.addEventListener('pointerup', this._pointerUpHandler);
        this.video.addEventListener('pointercancel', this._pointerUpHandler);

        // 触觉反馈 (如果设备支持)
        if (window.navigator.vibrate) {
            window.navigator.vibrate(5);
        }

        // 阻止默认行为，如文本选择
        e.preventDefault();
    }

    /**
     * 处理指针移动事件 (视频元素)
     * @param {PointerEvent} e - 指针事件
     */
    _handlePointerMove(e) {
        if (!this.isDragging || !e.isPrimary) return;
        
        // 计算位移
        const deltaX = e.clientX - this.startX;
        this.dragDistance = Math.max(this.dragDistance, Math.abs(deltaX));  // 更新最大拖动距离
        
        const newOffset = Math.max(
            -this.maxOffset,
            Math.min(this.startOffset + deltaX, this.maxOffset)
        );
        
        // 应用新偏移量
        this._applyOffset(newOffset, false);

        // 记录位置用于计算速度
        this._trackVelocity(e.clientX);
        
        // 阻止默认行为，如页面滚动
        e.preventDefault();
    }

    /**
     * 处理指针抬起/取消事件 (视频元素)
     * @param {PointerEvent} e - 指针事件
     */
    _handlePointerUp(e) {
        if (!this.isDragging || !e.isPrimary) return;
        
        // 更新状态
        this.isDragging = false;
        
        // 只有当拖动距离超过最小值时才设置拖动标记
        if (this.dragDistance > this.minDragDistance) {
            this.wasDragging = true;
            this.dragEndTimestamp = Date.now();
        } else {
            this.wasDragging = false;
        }
        
        // 释放指针捕获
        if (this.video.releasePointerCapture) {
            this.video.releasePointerCapture(e.pointerId);
        }

        // 移除事件监听
        this.video.removeEventListener('pointermove', this._pointerMoveHandler);
        this.video.removeEventListener('pointerup', this._pointerUpHandler);
        this.video.removeEventListener('pointercancel', this._pointerUpHandler);

        // 恢复视觉状态
        this.video.style.cursor = 'grab';
        
        // 应用惯性滚动
        this._applyInertia();
        
        // 阻止默认行为
        e.preventDefault();
    }

    /**
     * 处理手柄的指针按下事件
     * @param {PointerEvent} e - 指针事件
     */
    _handleHandlePointerDown(e) {
        // 如果视频宽度不超过容器，则不处理
        if (this.maxOffset <= 0) return;

        // 只处理主指针
        if (!e.isPrimary) return;

        // 停止可能正在进行的动画
        if (this.animation.active) {
            cancelAnimationFrame(this.animation.rafId);
            this.animation.active = false;
        }

        // 初始化拖动状态
        this.isHandleDragging = true;
        this.startX = e.clientX;
        this.dragDistance = 0;  // 重置拖动距离

        // 记录初始偏移和手柄位置
        this.startOffset = this.offset;
        const handleContainer = this.handle.parentElement;
        const containerWidth = handleContainer ? handleContainer.offsetWidth : 0;

        // 如果手柄容器有效，计算手柄位置比例
        if (containerWidth > 0) {
            const handleRect = this.handle.getBoundingClientRect();
            this.startHandleLeft = handleRect.left - (handleContainer.getBoundingClientRect().left);
            this.startHandleLeftPercent = (this.startHandleLeft / containerWidth) * 100;
        } else {
            this.startHandleLeft = 0;
            this.startHandleLeftPercent = 0;
        }

        // 更新视觉状态
        this.handle.style.cursor = 'grabbing';
        this.handle.style.transition = 'none';

        // 如果支持指针捕获，捕获指针
        if (this.handle.setPointerCapture) {
            this.handle.setPointerCapture(e.pointerId);
        }

        // 添加事件监听
        this.handle.addEventListener('pointermove', this._handlePointerMoveHandler);
        this.handle.addEventListener('pointerup', this._handlePointerUpHandler);
        this.handle.addEventListener('pointercancel', this._handlePointerUpHandler);

        // 触觉反馈 (如果设备支持)
        if (window.navigator.vibrate) {
            window.navigator.vibrate(5);
        }

        // 阻止默认行为
        e.preventDefault();
    }

    /**
     * 处理手柄的指针移动事件
     * @param {PointerEvent} e - 指针事件
     */
    _handleHandlePointerMove(e) {
        if (!this.isHandleDragging || !e.isPrimary) return;

        const handleContainer = this.handle.parentElement;
        if (!handleContainer) return;

        const containerWidth = handleContainer.offsetWidth;
        const handleWidth = this.handle.offsetWidth;

        // 如果容器或手柄宽度无效，则不处理
        if (containerWidth <= 0 || handleWidth <= 0) return;

        // 计算位移
        const deltaX = e.clientX - this.startX;
        this.dragDistance = Math.max(this.dragDistance, Math.abs(deltaX));  // 更新最大拖动距离

        // 计算手柄新位置 (像素)
        let newHandleLeft = this.startHandleLeft + deltaX;

        // 限制手柄位置在容器范围内
        const maxHandleLeft = containerWidth - handleWidth;
        newHandleLeft = Math.max(0, Math.min(newHandleLeft, maxHandleLeft));

        // 记录位置用于计算手柄速度
        this._trackHandleVelocity(newHandleLeft);

        // 定义吸附位置和阈值
        const snapPositions = [
            0,                  // 左侧
            maxHandleLeft / 2,  // 中间
            maxHandleLeft       // 右侧
        ];
        const snapThreshold = 15; // 吸附阈值（像素）
        let didSnap = false;

        // 检查是否需要吸附
        for (const snapPos of snapPositions) {
            if (Math.abs(newHandleLeft - snapPos) < snapThreshold) {
                // 距离小于阈值，进行吸附
                newHandleLeft = snapPos;
                didSnap = true;

                // 如果设备支持触觉反馈且之前未吸附到此位置
                if (window.navigator.vibrate && (!this.lastSnapPosition || this.lastSnapPosition !== snapPos)) {
                    window.navigator.vibrate(15); // 较强的震动表示吸附
                    this.lastSnapPosition = snapPos;
                }
                break;
            }
        }

        // 如果未吸附，重置上次吸附位置记录
        if (!didSnap) {
            this.lastSnapPosition = null;
        }

        // 计算手柄位置百分比
        const newHandleLeftPercent = (newHandleLeft / containerWidth) * 100;

        // 应用手柄位置
        this.handle.style.left = `${newHandleLeftPercent}%`;

        // 将手柄位置映射回视频偏移 - 反向移动
        // 手柄位置范围: [0, maxHandleLeft]
        // 视频偏移范围: [-this.maxOffset, this.maxOffset]
        const handleRatio = maxHandleLeft > 0 ? newHandleLeft / maxHandleLeft : 0; // 0 到 1, 避免除零
        // 改为反向映射 (1 - handleRatio) 来反转方向
        const newOffset = ((1 - handleRatio) * 2 * this.maxOffset) - this.maxOffset;

        // 应用视频偏移
        this.video.style.transform = `translateX(${newOffset}px)`;
        this.video.style.transition = 'none';
        this.offset = newOffset;

        // 阻止默认行为
        e.preventDefault();
    }

    /**
     * 处理手柄的指针抬起/取消事件
     * @param {PointerEvent} e - 指针事件
     */
    _handleHandlePointerUp(e) {
        if (!this.isHandleDragging || !e.isPrimary) return;

        // 更新状态
        this.isHandleDragging = false;
        
        // 只有当拖动距离超过最小值时才设置拖动标记
        if (this.dragDistance > this.minDragDistance) {
            this.wasDragging = true;
            this.dragEndTimestamp = Date.now();
        } else {
            this.wasDragging = false;
        }

        // 重置上次吸附位置记录，以便下次拖动时能正确触发震动
        this.lastSnapPosition = null;

        // 释放指针捕获
        if (this.handle.releasePointerCapture) {
            this.handle.releasePointerCapture(e.pointerId);
        }

        // 移除事件监听
        this.handle.removeEventListener('pointermove', this._handlePointerMoveHandler);
        this.handle.removeEventListener('pointerup', this._handlePointerUpHandler);
        this.handle.removeEventListener('pointercancel', this._handlePointerUpHandler);

        // 恢复视觉状态
        this.handle.style.cursor = 'grab';
        
        // 应用手柄惯性
        this._applyHandleInertia();

        // 阻止默认行为
        e.preventDefault();
    }

    /**
     * 记录手柄速度数据
     * @param {number} position - 当前手柄位置
     */
    _trackHandleVelocity(position) {
        const now = Date.now();
        const tracker = this.handleVelocityTracker;

        // 添加新位置记录
        tracker.positions.push({
            position: position,
            time: now
        });

        // 只保留最近100ms内的记录
        while (
            tracker.positions.length > 1 &&
            now - tracker.positions[0].time > 100
        ) {
            tracker.positions.shift();
        }

        // 计算当前速度 (像素/毫秒)
        if (tracker.positions.length > 1) {
            const first = tracker.positions[0];
            const last = tracker.positions[tracker.positions.length - 1];
            const deltaTime = last.time - first.time;

            if (deltaTime > 0) {
                tracker.currentVelocity = (last.position - first.position) / deltaTime;
            }
        }

        tracker.lastTimestamp = now;
    }

    /**
     * 应用手柄惯性滚动
     */
    _applyHandleInertia() {
        if (Math.abs(this.handleVelocityTracker.currentVelocity) < 0.1) return;

        const handleContainer = this.handle.parentElement;
        if (!handleContainer) return;

        const containerWidth = handleContainer.offsetWidth;
        const handleWidth = this.handle.offsetWidth;
        const maxHandleLeft = containerWidth - handleWidth;

        // 获取当前手柄位置（像素）
        const handleRect = this.handle.getBoundingClientRect();
        const containerRect = handleContainer.getBoundingClientRect();
        const currentHandleLeft = handleRect.left - containerRect.left;

        // 计算最终位置
        const velocity = this.handleVelocityTracker.currentVelocity; // 像素/毫秒
        const deceleration = 0.002; // 减速率
        const distance = (velocity * velocity) / (2 * deceleration) * Math.sign(velocity);
        
        // 计算目标手柄位置（考虑边界）
        let targetHandleLeft = currentHandleLeft + distance;
        targetHandleLeft = Math.max(0, Math.min(targetHandleLeft, maxHandleLeft));

        // 检查最终位置是否需要吸附
        const snapPositions = [
            0,                  // 左侧
            maxHandleLeft / 2,  // 中间
            maxHandleLeft       // 右侧
        ];
        const snapThreshold = 30; // 惯性滚动的吸附阈值更大

        // 寻找最近的吸附点
        let closestSnapPos = targetHandleLeft;
        let minDistance = Number.MAX_VALUE;
        
        for (const snapPos of snapPositions) {
            const distance = Math.abs(targetHandleLeft - snapPos);
            if (distance < snapThreshold && distance < minDistance) {
                closestSnapPos = snapPos;
                minDistance = distance;
            }
        }

        // 应用吸附
        if (minDistance < Number.MAX_VALUE) {
            targetHandleLeft = closestSnapPos;
        }

        // 计算手柄位置百分比
        const targetHandleLeftPercent = (targetHandleLeft / containerWidth) * 100;
        
        // 计算对应的视频偏移量 - 反向映射
        const handleRatio = maxHandleLeft > 0 ? targetHandleLeft / maxHandleLeft : 0;
        const targetOffset = ((1 - handleRatio) * 2 * this.maxOffset) - this.maxOffset;

        // 设置过渡效果
        this.handle.style.transition = 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.video.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // 应用最终位置
        this.handle.style.left = `${targetHandleLeftPercent}%`;
        this.video.style.transform = `translateX(${targetOffset}px)`;
        this.offset = targetOffset;

        // 触觉反馈 (如果设备支持且吸附到某个位置)
        if (minDistance < Number.MAX_VALUE && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }

        // 重置速度追踪器
        this.handleVelocityTracker.positions = [];
        this.handleVelocityTracker.currentVelocity = 0;
    }

    /**
     * 设置视频偏移量
     * @param {number} offset - 要设置的偏移量
     * @param {boolean} animate - 是否使用动画过渡
     */
    setOffset(offset, animate = true) {
        return this._applyOffset(offset, animate);
    }

    /**
     * 重置管理器到初始状态
     * @param {boolean} animate - 是否使用动画
     * @returns {VideoSwipeManager} 当前实例，支持链式调用
     */
    reset(animate = true) {
        this._applyOffset(0, animate);
        this.wasDragging = false; // 重置拖动标记
        return this;
    }

    /**
     * 更新尺寸和约束
     * @returns {VideoSwipeManager} 当前实例，支持链式调用
     */
    updateSize() {
        console.log('[VideoSwipeManager] 更新尺寸和约束');
        // 强制获取视频和容器的最新尺寸
        if (this.video && this.container) {
            // 输出诊断信息
            const videoRect = this.video.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            console.log(`[VideoSwipeManager] 视频尺寸: ${videoRect.width}x${videoRect.height}, 容器尺寸: ${containerRect.width}x${containerRect.height}`);
            
            // 更新约束
            const result = this._updateConstraints();
            console.log(`[VideoSwipeManager] 约束更新结果: ${result}, 最大偏移量: ${this.maxOffset}`);
        } else {
            console.error('[VideoSwipeManager] 视频或容器元素不存在');
        }
        return this;
    }

    /**
     * 销毁管理器并清理资源
     */
    destroy() {
        // 移除事件监听
        if (this.video) {
            this.video.removeEventListener('pointerdown', this._pointerDownHandler);
            this.video.style.transform = '';
            this.video.style.willChange = '';
            this.video.style.transition = '';
            this.video.style.cursor = '';
        }
        
        if (this.handle) {
            this.handle.removeEventListener('pointerdown', this._handlePointerDownHandler);
            this.handle.style.willChange = '';
            this.handle.style.transition = '';
            this.handle.style.left = '';
            this.handle.style.width = '';
            this.handle.style.cursor = '';
        }
        
        // 取消可能正在进行的动画
        if (this.animation.active) {
            cancelAnimationFrame(this.animation.rafId);
            this.animation.active = false;
        }

        // 重置标记
        this.wasDragging = false;
    }

    /**
     * 检查是否刚完成拖动操作
     * @param {number} threshold - 时间阈值（毫秒）
     * @returns {boolean} 是否刚完成拖动
     */
    wasRecentlyDragging(threshold = 150) {
        if (!this.wasDragging) return false;
        
        const timeSinceDragEnd = Date.now() - this.dragEndTimestamp;
        
        // 如果超过阈值，重置标记
        if (timeSinceDragEnd > threshold) {
            this.wasDragging = false;
            return false;
        }
        
        return true;
    }
} 