import { Utils } from '../../utils/utils.js';
import { CustomVideoPlayer } from '../index.js';

/**
 * 浮动按钮类
 */
export class FloatingButton {
    constructor(options = {}) {
        this.button = null;
        this.videoPlayer = null;
        this.resizeTimeout = null;
        this.playerState = options.playerState || null;
        this.videoCheckInterval = null;
        this.mutationObserver = null;
    }

    /**
     * 初始化浮动按钮
     */
    init() {
        // 清理可能存在的旧按钮
        this.cleanupExistingButtons();
        
        // 检查页面是否存在视频元素
        if (Utils.findVideoElement()) {
            // 创建新按钮
            this.createButton();
            
            // 监听窗口大小变化，更新按钮位置
            window.addEventListener('resize', this.handleResize.bind(this));
            
            // 监听屏幕方向变化
            window.matchMedia("(orientation: portrait)").addEventListener("change", this.handleResize.bind(this));
            
            // 监听DOM变化，处理视频元素的动态添加/移除
            this.setupMutationObserver();
            
            console.log('[FloatingButton] 已创建浮动按钮，页面中存在视频元素');
        } else {
            console.log('[FloatingButton] 页面中未检测到视频元素，不显示浮动按钮');
            
            // 开始周期性检查视频元素
            this.startVideoElementCheck();
            
            // 监听DOM变化，处理视频元素的动态添加
            this.setupMutationObserver();
        }
    }
    
    /**
     * 设置MutationObserver监听DOM变化
     */
    setupMutationObserver() {
        // 清理可能存在的旧观察者
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // 创建新的观察者
        this.mutationObserver = new MutationObserver(this.handleDomMutations.bind(this));
        
        // 开始观察整个文档的变化
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * 处理DOM变化
     */
    handleDomMutations() {
        // 使用防抖函数限制调用频率
        if (this.mutationTimeout) clearTimeout(this.mutationTimeout);
        
        this.mutationTimeout = setTimeout(() => {
            const hasVideo = Utils.findVideoElement();
            
            // 如果有视频元素但没有按钮，创建按钮
            if (hasVideo && !this.button) {
                this.createButton();
                
                // 监听窗口大小变化，更新按钮位置
                window.addEventListener('resize', this.handleResize.bind(this));
                
                // 监听屏幕方向变化
                window.matchMedia("(orientation: portrait)").addEventListener("change", this.handleResize.bind(this));
                
                console.log('[FloatingButton] DOM变化检测到视频元素，已创建浮动按钮');
            } 
            // 如果有按钮但没有视频元素，隐藏按钮
            else if (!hasVideo && this.button) {
                this.button.style.display = 'none';
                console.log('[FloatingButton] DOM变化检测到视频元素已移除，已隐藏浮动按钮');
            }
            // 如果有视频元素且有按钮，确保按钮显示
            else if (hasVideo && this.button && this.button.style.display === 'none') {
                this.button.style.display = 'flex';
                console.log('[FloatingButton] DOM变化检测到视频元素已添加，已显示浮动按钮');
            }
        }, 300);
    }

    /**
     * 开始周期性检查视频元素
     * 针对动态加载视频的网站，可能初始加载时没有视频，但后续会加载
     */
    startVideoElementCheck() {
        // 清除可能存在的旧计时器
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
        }
        
        // 设置新计时器，每2秒检查一次
        this.videoCheckInterval = setInterval(() => {
            if (Utils.findVideoElement()) {
                // 只有当按钮不存在时才创建
                if (!this.button) {
                    // 找到视频元素，创建按钮
                    this.createButton();
                    
                    // 监听窗口大小变化，更新按钮位置
                    window.addEventListener('resize', this.handleResize.bind(this));
                    
                    // 监听屏幕方向变化
                    window.matchMedia("(orientation: portrait)").addEventListener("change", this.handleResize.bind(this));
                    
                    console.log('[FloatingButton] 定时检测到视频元素，已创建浮动按钮');
                } else if (this.button.style.display === 'none') {
                    // 按钮存在但被隐藏，重新显示
                    this.button.style.display = 'flex';
                    console.log('[FloatingButton] 定时检测到视频元素，已显示浮动按钮');
                }
                
                // 停止检查
                clearInterval(this.videoCheckInterval);
                this.videoCheckInterval = null;
            }
        }, 2000);
    }

    /**
     * 清理可能存在的旧浮动按钮
     */
    cleanupExistingButtons() {
        // 查找所有现有的浮动按钮
        const existingButtons = document.querySelectorAll('.tm-floating-button');
        
        if (existingButtons.length > 0) {
            console.log(`[FloatingButton] 清理 ${existingButtons.length} 个现有浮动按钮`);
            
            existingButtons.forEach(button => {
                if (button && button.parentNode) {
                    button.parentNode.removeChild(button);
                }
            });
        }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 使用节流函数限制调用频率
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        
        this.resizeTimeout = setTimeout(() => {
            // 检查页面是否存在视频元素
            if (Utils.findVideoElement()) {
                // 无论横屏还是竖屏都显示按钮
                this.button.style.display = 'flex';
                
                // 更新按钮位置
                this.updateButtonPosition();
            } else {
                // 没有视频元素，隐藏按钮
                if (this.button) this.button.style.display = 'none';
            }
        }, 200);
    }

    /**
     * 创建浮动按钮
     */
    createButton() {
        // 创建浮动按钮 - 使用CSS类而不是内联样式
        this.button = Utils.createElementWithStyle('button', 'tm-floating-button');

        // 使用更简洁的播放按钮SVG图标
        const icon = `
            <svg width="48" height="48" viewBox="0 0 68 48" fill="none">
                <path class="tm-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="rgb(254, 98, 142)"></path>
                <path d="M 45,24 27,14 27,34" fill="#fff"></path>
            </svg>
        `;
        this.button.innerHTML = icon;

        // 添加点击事件处理器
        this.button.addEventListener('click', () => {
            this.handleButtonClick();
        });

        // 显示按钮
        this.button.style.display = 'flex';

        // 添加到文档
        document.body.appendChild(this.button);

        // 初始位置
        this.updateButtonPosition();

        return this.button;
    }

    /**
     * 更新按钮位置，考虑安全区域和屏幕方向
     */
    updateButtonPosition() {
        if (!this.button) return;
        
        const safeArea = Utils.getSafeAreaInsets();
        
        // 获取当前屏幕方向
        const isPortrait = Utils.isPortrait();
        
        if (isPortrait) {
            // 竖屏模式 - 按钮在底部居中
            this.button.style.bottom = `${Math.max(20, safeArea.bottom)}px`;
            this.button.style.right = 'auto';
            this.button.style.left = '50%';
            // 重置transform以保持hover和active效果正常
            this.button.style.transform = 'translateX(-50%)';
        } else {
            // 横屏模式 - 按钮在右下角且加大安全距离
            this.button.style.bottom = `${Math.max(20, safeArea.bottom + 10)}px`;
            this.button.style.right = `${Math.max(20, safeArea.right + 10)}px`;
            this.button.style.left = 'auto';
            // 重置transform以保持hover和active效果正常
            this.button.style.transform = 'translateX(0)';
        }
        
        // 确保z-index始终正确设置，防止在屏幕旋转时被覆盖
        this.button.style.zIndex = '9980';
    }

    /**
     * 处理按钮点击
     */
    handleButtonClick() {
        // 隐藏按钮
        this.button.style.display = 'none';
        
        // 每次点击都创建新的视频播放器实例
        this.videoPlayer = new CustomVideoPlayer({
            playerState: this.playerState,
            callingButton: this.button  // 确保传递按钮引用
        });
        
        // 初始化播放器
        this.videoPlayer.init();
    }

    /**
     * 移除浮动按钮
     */
    remove() {
        if (this.button && this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
        
        // 移除事件监听器
        window.removeEventListener('resize', this.handleResize);
        
        // 清除计时器
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
            this.videoCheckInterval = null;
        }
        
        // 断开MutationObserver
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // 清除引用
        this.button = null;
    }
} 