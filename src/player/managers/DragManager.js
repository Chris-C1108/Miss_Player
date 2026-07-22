/**
 * 拖动管理器类 - 负责拖动和大小调整功能
 */
export class DragManager {
    constructor(playerCore, uiElements) {
        // 核心引用
        this.playerCore = playerCore;
        this.playerCore.dragManager = this; // 注册到核心播放器上以供全局访问
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
        
        // 悬浮控制面板拖拽状态管理
        this.controlButtonsContainer = null;
        this.dragHandle = null;
        this.isDraggingControlPanel = false;
        this.ctrlStartX = 0;
        this.ctrlStartY = 0;
        this.ctrlStartLeft = 0;
        this.ctrlStartTop = 0;
        this.ctrlMoveHandler = null;
        this.ctrlEndHandler = null;
    }
    
    /**
     * 初始化拖动管理器
     */
    init() {
        // 设置拖动处理事件
        this.handle.addEventListener('mousedown', this.startHandleDrag.bind(this));
        this.handle.addEventListener('touchstart', this.startHandleDrag.bind(this), { passive: false });
        
        // 初始化控制面板悬浮窗拖拽
        this.initControlPanelDrag();
        
        return this;
    }
    
    updateHandlePosition() {
        // 在 Flex 布局下，手柄位置由浏览器自动流式排版，无需手动计算 top
    }
    
    startHandleDrag(e) {
        this.isDraggingHandle = true;
        this.handle.classList.add('dragging');

        // 添加震动反馈
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(5);
        }

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

        // 标记用户手动调整了高度，防止被 resize 事件重置，同时保存对应方向的高数值
        if (this.playerCore.uiManager) {
            this.playerCore.uiManager.isCustomResized = true;
            if (!this.playerCore.uiManager.isLandscape) {
                this.playerCore.uiManager.customHeightPortrait = newHeight + 'px';
            } else {
                this.playerCore.uiManager.customHeightLandscape = newHeight + 'px';
            }
        }

        // updateHandlePosition会被ResizeObserver自动调用
     }

    /**
     * 手柄拖动结束
     */
    _handleDragEnd(e) {
        if (!this.isDraggingHandle) return;
        this.isDraggingHandle = false;
        this.handle.classList.remove('dragging');

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

    /**
     * 初始化悬浮控制面板拖拽逻辑
     */
    initControlPanelDrag() {
        // 等待一小段时间以确保 controlManager 已经完全创建了 DOM 结构
        setTimeout(() => {
            if (!this.playerCore.controlManager) return;
            
            this.controlButtonsContainer = this.playerCore.controlManager.controlButtonsContainer;
            this.dragHandle = this.playerCore.controlManager.dragHandle;
            
            if (!this.controlButtonsContainer || !this.dragHandle) return;
            
            // 绑定拖拽事件
            this.dragHandle.addEventListener('mousedown', this.startControlPanelDrag.bind(this));
            this.dragHandle.addEventListener('touchstart', this.startControlPanelDrag.bind(this), { passive: false });
            
            // 双击句柄重置位置
            this.dragHandle.addEventListener('dblclick', this.resetControlPanelPosition.bind(this));
            
            // 如果处于悬浮控制面板模式下，尝试恢复已记忆的位置
            if (this.playerCore.uiManager && this.playerCore.uiManager.isFloatingControlPanel) {
                this.restoreControlPanelPosition();
            }
        }, 100);
    }
    
    /**
     * 开始拖动悬浮控制面板
     */
    startControlPanelDrag(e) {
        // 仅在悬浮控制面板模式下允许拖拽定位
        if (!this.playerCore.uiManager || !this.playerCore.uiManager.isFloatingControlPanel) {
            return;
        }
        
        // 仅允许鼠标左键拖拽
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        this.isDraggingControlPanel = true;
        this.controlButtonsContainer.classList.add('dragging');
        
        // 拖动开始时，清除 docking 状态以保证平滑过渡
        this.updateDockedState(null, false);
        
        const touch = e.type.includes('touch');
        this.ctrlStartX = touch ? e.touches[0].clientX : e.clientX;
        this.ctrlStartY = touch ? e.touches[0].clientY : e.clientY;
        
        // 获取当前悬浮窗的位置
        const rect = this.controlButtonsContainer.getBoundingClientRect();
        this.ctrlStartLeft = rect.left;
        this.ctrlStartTop = rect.top;
        
        const moveHandler = this._handleControlPanelMove.bind(this);
        const endHandler = this._handleControlPanelEnd.bind(this);
        
        if (touch) {
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler);
            document.addEventListener('touchcancel', endHandler);
        } else {
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', endHandler);
        }
        
        this.ctrlMoveHandler = moveHandler;
        this.ctrlEndHandler = endHandler;
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * 控制面板拖拽移动
     */
    _handleControlPanelMove(e) {
        if (!this.isDraggingControlPanel) return;
        e.preventDefault();
        
        const touch = e.type.includes('touch');
        const currentX = touch ? e.touches[0].clientX : e.clientX;
        const currentY = touch ? e.touches[0].clientY : e.clientY;
        
        const deltaX = currentX - this.ctrlStartX;
        const deltaY = currentY - this.ctrlStartY;
        
        let newLeft = this.ctrlStartLeft + deltaX;
        let newTop = this.ctrlStartTop + deltaY;
        
        // 边界限制，确保控制栏留在安全可视区域内（考虑 16px 安全边距和 44px 顶部栏）
        const rect = this.controlButtonsContainer.getBoundingClientRect();
        const margin = 16;
        const headerHeight = 44;
        
        const minLeft = margin;
        const maxLeft = window.innerWidth - rect.width - margin;
        const minTop = headerHeight + margin;
        const maxTop = window.innerHeight - rect.height - margin;
        
        // 允许拖动时微弱溢出安全区，以获得更好的拖拽弹性手感
        newLeft = Math.max(minLeft - 10, Math.min(newLeft, maxLeft + 10));
        newTop = Math.max(minTop - 10, Math.min(newTop, maxTop + 10));
        
        this.controlButtonsContainer.style.left = newLeft + 'px';
        this.controlButtonsContainer.style.top = newTop + 'px';
        this.controlButtonsContainer.style.bottom = 'auto';
        this.controlButtonsContainer.style.right = 'auto';
        this.controlButtonsContainer.style.transform = 'none';
    }
    
    /**
     * 控制面板拖拽结束 (带有吸附定位算法)
     */
    _handleControlPanelEnd(e) {
        if (!this.isDraggingControlPanel) return;
        this.isDraggingControlPanel = false;
        this.controlButtonsContainer.classList.remove('dragging');
        
        const touch = e.type.startsWith('touch');
        if (touch) {
            document.removeEventListener('touchmove', this.ctrlMoveHandler);
            document.removeEventListener('touchend', this.ctrlEndHandler);
            document.removeEventListener('touchcancel', this.ctrlEndHandler);
        } else {
            document.removeEventListener('mousemove', this.ctrlMoveHandler);
            document.removeEventListener('mouseup', this.ctrlEndHandler);
        }
        
        this.ctrlMoveHandler = null;
        this.ctrlEndHandler = null;
        
        // 获取释放时的最终坐标
        const rect = this.controlButtonsContainer.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const margin = 16;
        const headerHeight = 44;
        
        let targetX = rect.left;
        let targetY = rect.top;
        
        // 8 个吸附锚点：4个角落、上下左右居中位置
        const anchors = [
            { name: 'TL', x: margin, y: headerHeight + margin },
            { name: 'TC', x: (W - w) / 2, y: headerHeight + margin },
            { name: 'TR', x: W - w - margin, y: headerHeight + margin },
            
            { name: 'LC', x: margin, y: (H - h) / 2 },
            { name: 'RC', x: W - w - margin, y: (H - h) / 2 },
            
            { name: 'BL', x: margin, y: H - h - margin },
            { name: 'BC', x: (W - w) / 2, y: H - h - margin },
            { name: 'BR', x: W - w - margin, y: H - h - margin }
        ];
        
        // 寻找距离最近的吸附锚点
        let closestAnchor = anchors[0];
        let minDist = Math.hypot(targetX - closestAnchor.x, targetY - closestAnchor.y);
        
        for (let i = 1; i < anchors.length; i++) {
            const dist = Math.hypot(targetX - anchors[i].x, targetY - anchors[i].y);
            if (dist < minDist) {
                minDist = dist;
                closestAnchor = anchors[i];
            }
        }
        
        // 磁性吸附半径为 90px，超过半径则不吸附，让用户可放在任意位置；否则吸附到最邻近锚点
        const snapRadius = 90;
        let didSnap = false;
        
        if (minDist < snapRadius) {
            targetX = closestAnchor.x;
            targetY = closestAnchor.y;
            didSnap = true;
        } else {
            // 如未吸附，也需要强制约束在安全区边界内
            const minLeft = margin;
            const maxLeft = W - w - margin;
            const minTop = headerHeight + margin;
            const maxTop = H - h - margin;
            targetX = Math.max(minLeft, Math.min(targetX, maxLeft));
            targetY = Math.max(minTop, Math.min(targetY, maxTop));
        }
        
        // 如果触发了吸附，使用平滑的过渡动画吸附归位
        if (didSnap) {
            // 触觉反馈 (如设备支持)
            if (window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
            
            // 临时添加过渡动画样式
            this.controlButtonsContainer.style.transition = 'left 0.25s cubic-bezier(0.25, 1, 0.5, 1), top 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, transform 0.3s ease';
            this.controlButtonsContainer.style.left = targetX + 'px';
            this.controlButtonsContainer.style.top = targetY + 'px';
            
            // 过渡完成后清除临时过渡样式，恢复到原始状态（避免下次拖动时出现卡顿）
            setTimeout(() => {
                if (this.controlButtonsContainer) {
                    this.controlButtonsContainer.style.transition = '';
                }
            }, 260);
        } else {
            this.controlButtonsContainer.style.left = targetX + 'px';
            this.controlButtonsContainer.style.top = targetY + 'px';
        }
        
        // 将坐标及吸附信息存储到 localStorage
        const position = {
            left: targetX,
            top: targetY,
            anchorName: didSnap ? closestAnchor.name : null,
            didSnap: didSnap
        };
        const key = this.getControlPanelStorageKey();
        localStorage.setItem(key, JSON.stringify(position));
        localStorage.setItem('tm-control-panel-pos', JSON.stringify(position));
        
        // 更新 docking 状态
        this.updateDockedState(didSnap ? closestAnchor.name : null, didSnap);
        
        if (touch) {
            e.preventDefault();
        }
        e.stopPropagation();
    }

    /**
     * 获取当前屏幕方向对应的位置存储键
     */
    getControlPanelStorageKey() {
        const isLandscape = this.playerCore.uiManager ? this.playerCore.uiManager.isLandscape : (window.innerWidth > window.innerHeight);
        return isLandscape ? 'tm-control-panel-pos-landscape' : 'tm-control-panel-pos-portrait';
    }
    
    /**
     * 恢复控制面板已存储的位置
     */
    restoreControlPanelPosition() {
        if (!this.controlButtonsContainer) return;
        
        // 如果当前非悬浮控制面板模式（例如手机竖屏下），则直接清理所有行内样式以将控制权交还给 CSS
        if (this.playerCore.uiManager && !this.playerCore.uiManager.isFloatingControlPanel) {
            this.clearControlPanelInlineStyles();
            return;
        }
        
        const key = this.getControlPanelStorageKey();
        let saved = localStorage.getItem(key);
        if (!saved) {
            saved = localStorage.getItem('tm-control-panel-pos');
        }
        if (saved) {
            try {
                const savedData = JSON.parse(saved);
                let left = savedData.left;
                let top = savedData.top;
                const anchorName = savedData.anchorName;
                const didSnap = savedData.didSnap;
                
                // 边界安全性验证 (考虑安全间距和顶部标题栏)
                const rect = this.controlButtonsContainer.getBoundingClientRect();
                const w = rect.width || 348;
                const h = rect.height || 180;
                const W = window.innerWidth;
                const H = window.innerHeight;
                const margin = 16;
                const headerHeight = 44;
                
                if (didSnap && anchorName) {
                    // 重新计算吸附位置以适应当前窗口尺寸
                    const anchors = {
                        'TL': { x: margin, y: headerHeight + margin },
                        'TC': { x: (W - w) / 2, y: headerHeight + margin },
                        'TR': { x: W - w - margin, y: headerHeight + margin },
                        'LC': { x: margin, y: (H - h) / 2 },
                        'RC': { x: W - w - margin, y: (H - h) / 2 },
                        'BL': { x: margin, y: H - h - margin },
                        'BC': { x: (W - w) / 2, y: H - h - margin },
                        'BR': { x: W - w - margin, y: H - h - margin }
                    };
                    if (anchors[anchorName]) {
                        left = anchors[anchorName].x;
                        top = anchors[anchorName].y;
                    }
                }
                
                const minLeft = margin;
                const maxLeft = W - w - margin;
                const minTop = headerHeight + margin;
                const maxTop = H - h - margin;
                
                const finalLeft = Math.max(minLeft, Math.min(left, maxLeft));
                const finalTop = Math.max(minTop, Math.min(top, maxTop));
                
                this.controlButtonsContainer.style.left = finalLeft + 'px';
                this.controlButtonsContainer.style.top = finalTop + 'px';
                this.controlButtonsContainer.style.bottom = 'auto';
                this.controlButtonsContainer.style.right = 'auto';
                this.controlButtonsContainer.style.transform = 'none';
                
                // 更新 docking 状态
                this.updateDockedState(anchorName, didSnap);
            } catch (err) {
                console.error('[DragManager] 恢复控制面板位置出错:', err);
            }
        }
    }
    
    /**
     * 更新控制栏吸附在评论区侧栏时的排版状态
     */
    updateDockedState(anchorName, didSnap) {
        if (!this.controlButtonsContainer) return;
        
        // 确保只在 PC 宽屏及大屏设备自适应环境下应用（min-width: 930px 且 landscape）
        const isPC = window.innerWidth >= 930 && window.matchMedia('(orientation: landscape)').matches;
        
        const playerContainer = this.controlButtonsContainer.closest('.tm-player-container');
        if (!playerContainer) return;
        
        // 移除之前的类
        playerContainer.classList.remove(
            'tm-controls-docked-tr', 'tm-controls-docked-br',
            'tm-controls-docked-tl', 'tm-controls-docked-bl'
        );
        
        // 检查评论区侧边栏是否被隐藏了
        const isSidebarHidden = playerContainer.classList.contains('tm-sidebar-hidden');
        const sidebarPosition = this.playerCore.options.playerState ? this.playerCore.options.playerState.settings.sidebarPosition : 'right';
        
        // 判定吸附是否属于 docked (侧边栏吸附)
        const isRightDock = sidebarPosition === 'right' && (anchorName === 'TR' || anchorName === 'BR');
        const isLeftDock = sidebarPosition === 'left' && (anchorName === 'TL' || anchorName === 'BL');
        const isDocked = isPC && didSnap && (isRightDock || isLeftDock) && !isSidebarHidden;
        
        if (isDocked) {
            const rect = this.controlButtonsContainer.getBoundingClientRect();
            const h = rect.height || 180;
            // 停靠后100%填满无边距，因此间距仅为控制面板高度本身
            playerContainer.style.setProperty('--docked-controls-height', h + 'px');
            playerContainer.classList.add(`tm-controls-docked-${anchorName.toLowerCase()}`);
        } else {
            playerContainer.style.removeProperty('--docked-controls-height');
        }
    }
    
    /**
     * 重新应用当前的吸附排版状态
     */
    reapplyDockedState() {
        const key = this.getControlPanelStorageKey();
        let saved = localStorage.getItem(key);
        if (!saved) {
            saved = localStorage.getItem('tm-control-panel-pos');
        }
        if (saved) {
            try {
                const savedData = JSON.parse(saved);
                if (savedData.didSnap && savedData.anchorName) {
                    this.updateDockedState(savedData.anchorName, savedData.didSnap);
                    return;
                }
            } catch (e) {
                console.error('[DragManager] 重新应用吸附排版状态出错:', e);
            }
        }
        this.updateDockedState(null, false);
    }
    
    /**
     * 清理行内样式以将控制权交还给 CSS (常在切出 PC 横屏时调用)
     */
    clearControlPanelInlineStyles() {
        if (!this.controlButtonsContainer) return;
        
        this.controlButtonsContainer.style.left = '';
        this.controlButtonsContainer.style.top = '';
        this.controlButtonsContainer.style.bottom = '';
        this.controlButtonsContainer.style.right = '';
        this.controlButtonsContainer.style.transform = '';
        
        // 清理 docking 状态
        this.updateDockedState(null, false);
    }
    
    /**
     * 重置控制面板位置且清空 localStorage
     */
    resetControlPanelPosition() {
        localStorage.removeItem('tm-control-panel-pos');
        localStorage.removeItem('tm-control-panel-pos-portrait');
        localStorage.removeItem('tm-control-panel-pos-landscape');
        this.clearControlPanelInlineStyles();
        console.log('[DragManager] 悬浮窗位置已重置并清除本地记忆');
    }
} 