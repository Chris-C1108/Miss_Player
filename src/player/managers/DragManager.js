/**
 * 拖动管理器类 - 负责拖动和大小调整功能
 */
export class DragManager {
    constructor(playerCore, uiElements) {
        // 核心引用
        this.playerCore = playerCore;
        this.targetVideo = playerCore.targetVideo;
        
        // UI元素引用
        this.uiElements = uiElements;
        this.container = uiElements.container;
        this.handle = uiElements.handle;
        
        // 拖动状态管理
        this.isDraggingHandle = false;   // 是否正在拖动句柄
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.handleMoveHandler = null;   // 句柄移动事件处理函数
        this.handleEndHandler = null;    // 句柄释放事件处理函数
    }
    
    /**
     * 初始化拖动管理器
     */
    init() {
        // 设置拖动处理事件
        this.handle.addEventListener('mousedown', this.startHandleDrag.bind(this));
        this.handle.addEventListener('touchstart', this.startHandleDrag.bind(this), { passive: false });
        
        return this;
    }
    
    /**
     * 更新手柄位置
     */
    updateHandlePosition() {
        if (!this.uiElements.handleContainer || !this.container) return;
        
        // 获取视频容器的位置信息
        const containerRect = this.container.getBoundingClientRect();
        const videoWrapperRect = this.uiElements.videoWrapper.getBoundingClientRect();
        
        // 设置手柄位置在视频容器下方
        this.uiElements.handleContainer.style.top = `${videoWrapperRect.bottom}px`;
    }
    
    /**
     * 开始手柄拖动 (只处理Y轴，X轴由swipeManager处理)
     */
    startHandleDrag(e) {
        this.isDraggingHandle = true;
        this.handle.style.cursor = 'grabbing';

        const touch = e.type.includes('touch');
        this.startY = touch ? e.touches[0].clientY : e.clientY;
        this.startHeight = this.container.offsetHeight;

        const moveHandler = this._handleDragMove.bind(this);
        const endHandler = this._handleDragEnd.bind(this);

        if (touch) {
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler);
            document.addEventListener('touchcancel', endHandler);
        } else {
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', endHandler);
        }

        // 存储事件处理函数以便移除
        this.handleMoveHandler = moveHandler;
        this.handleEndHandler = endHandler;

        e.preventDefault();
    }

    /**
     * 手柄移动处理 (只处理Y轴)
     */
    _handleDragMove(e) {
        if (!this.isDraggingHandle) return;
        e.preventDefault();

        const touch = e.type.includes('touch');
        const currentY = touch ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - this.startY;

        // 获取容器当前的最小高度作为约束
        const minHeight = parseFloat(this.container.style.minHeight) || window.innerWidth * (9/16);
        
        // 处理Y轴 (调整高度)
        const newHeight = Math.max(minHeight, this.startHeight + deltaY);
        this.container.style.height = newHeight + 'px';

        // updateHandlePosition会被ResizeObserver自动调用
    }

    /**
     * 手柄拖动结束
     */
    _handleDragEnd(e) {
        if (!this.isDraggingHandle) return;
        this.isDraggingHandle = false;
        this.handle.style.cursor = 'grab';

        // 移除监听器
        document.removeEventListener('touchmove', this.handleMoveHandler);
        document.removeEventListener('touchend', this.handleEndHandler);
        document.removeEventListener('touchcancel', this.handleEndHandler);
        document.removeEventListener('mousemove', this.handleMoveHandler);
        document.removeEventListener('mouseup', this.handleEndHandler);

        // 清理存储的引用
        this.handleMoveHandler = null;
        this.handleEndHandler = null;

        if (e.type.startsWith('touch')) {
            e.preventDefault();
        }
    }

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(event) {
        if (event.button !== 0) return; // 只处理左键点击

        this.isDraggingHandle = true;
        this.startY = event.clientY;
        this.startHeight = this.uiElements.handleContainer.offsetHeight;
        this.handleMoveHandler = this.handleMouseMove.bind(this);
        this.handleEndHandler = this.handleMouseUp.bind(this);

        // 添加事件监听器
        document.addEventListener('mousemove', this.handleMoveHandler);
        document.addEventListener('mouseup', this.handleEndHandler);

        // 更新手柄位置
        this.updateHandlePosition();
    }

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
        if (!this.isDraggingHandle) return;

        const deltaY = event.clientY - this.startY;
        const newHeight = this.startHeight + deltaY;

        if (newHeight < 50 || newHeight > 200) return; // 限制手柄高度范围

        this.uiElements.handleContainer.style.height = `${newHeight}px`;
        this.updateHandlePosition();
    }

    /**
     * 处理鼠标释放事件
     */
    handleMouseUp(event) {
        this.isDraggingHandle = false;

        // 移除事件监听器
        document.removeEventListener('mousemove', this.handleMoveHandler);
        document.removeEventListener('mouseup', this.handleEndHandler);

        // 更新手柄位置
        this.updateHandlePosition();
    }

    /**
     * 处理鼠标离开事件
     */
    handleMouseLeave(event) {
        this.isDraggingHandle = false;

        // 移除事件监听器
        document.removeEventListener('mousemove', this.handleMoveHandler);
        document.removeEventListener('mouseup', this.handleEndHandler);

        // 更新手柄位置
        this.updateHandlePosition();
    }
} 