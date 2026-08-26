/**
 * 视频画质管理类
 * 负责在页面空闲或播放器就绪时自动设置视频最高画质
 */

/**
 * 画质管理器类
 */
export class QualityManager {
    constructor() {
        this.maxAttempts = 6;        // 最大尝试次数
        this.attemptInterval = 1000; // 尝试间隔时间(ms)
    }

    /**
     * 自动设置最高画质 (延迟至空闲状态执行，避免主线程关键渲染阻塞)
     */
    setupAutoHighestQuality() {
        const executeQualitySetup = () => {
            if (this.setHighestQualitySingle()) {
                return;
            }
            
            let attempts = 0;
            const checkInterval = setInterval(() => {
                if (this.setHighestQualitySingle() || ++attempts >= this.maxAttempts) {
                    clearInterval(checkInterval);
                }
            }, this.attemptInterval);
        };

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(executeQualitySetup, { timeout: 4000 });
        } else {
            setTimeout(executeQualitySetup, 1500);
        }
    }
    
    /**
     * 执行单次设置最高画质尝试
     * @returns {boolean} 是否成功设置
     */
    setHighestQualitySingle() {
        try {
            const player = window.player || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.player : null);
            
            if (!player || !player.config || !player.config.quality || !player.config.quality.options || !player.config.quality.options.length) {
                return false;
            }
            
            const maxQuality = Math.max(...player.config.quality.options);
            
            // 同时设置属性和方法
            player.quality = maxQuality;
            player.config.quality.selected = maxQuality;
            
            if (typeof player.quality === 'function') {
                player.quality(maxQuality);
            }
            
            return true;
        } catch (error) {
            console.error('[QualityManager] 设置最高画质时出错:', error);
            return false;
        }
    }
} 