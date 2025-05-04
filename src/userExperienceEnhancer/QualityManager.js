/**
 * 视频画质管理类
 * 负责自动设置视频的最高画质
 */

/**
 * 画质管理器类
 */
export class QualityManager {
    constructor() {
        // 配置
        this.maxAttempts = 20;      // 最大尝试次数
        this.attemptInterval = 500; // 尝试间隔时间(ms)
    }

    /**
     * 自动设置最高画质
     */
    setupAutoHighestQuality() {
        console.log('[QualityManager] 尝试设置视频最高画质');
        
        // 立即尝试一次
        if (this.setHighestQualitySingle()) {
            console.log('[QualityManager] 成功设置最高画质');
            return;
        }
        
        // 失败则定时尝试
        let attempts = 0;
        const checkInterval = setInterval(() => {
            if (this.setHighestQualitySingle() || ++attempts >= this.maxAttempts) {
                clearInterval(checkInterval);
                console.log(`[QualityManager] 完成尝试 (${attempts + 1}次)`);
            }
        }, this.attemptInterval);
        
        // 页面完全加载后再尝试一次
        window.addEventListener('load', () => this.setHighestQualitySingle());
    }
    
    /**
     * 执行单次设置最高画质尝试
     * @returns {boolean} 是否成功设置
     */
    setHighestQualitySingle() {
        try {
            // 检查播放器
            const player = window.player || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.player : null);
            
            if (!player || !player.config || !player.config.quality || !player.config.quality.options || !player.config.quality.options.length) {
                return false;
            }
            
            // 设置最高画质
            const maxQuality = Math.max(...player.config.quality.options);
            console.log('[QualityManager] 设置画质:', maxQuality);
            
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