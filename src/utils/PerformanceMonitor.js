/**
 * 性能监测工具类
 * 用于测量和记录性能数据
 */
export class PerformanceMonitor {
    constructor() {
        this.measurements = {};
        this.ongoing = {};
        this.frames = [];
        this.listeners = {};
        this.isMonitoringFPS = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
    }
    
    /**
     * 开始测量
     * @param {string} name - 测量名称
     */
    startMeasure(name) {
        this.ongoing[name] = performance.now();
    }
    
    /**
     * 结束测量并记录结果
     * @param {string} name - 测量名称
     * @returns {number} - 测量结果(ms)
     */
    endMeasure(name) {
        if (!this.ongoing[name]) {
            console.warn(`未找到测量: ${name}`);
            return 0;
        }
        
        const endTime = performance.now();
        const duration = endTime - this.ongoing[name];
        
        if (!this.measurements[name]) {
            this.measurements[name] = [];
        }
        
        this.measurements[name].push(duration);
        delete this.ongoing[name];
        
        return duration;
    }
    
    /**
     * 开始监测帧率
     */
    startFPSMonitoring() {
        if (this.isMonitoringFPS) return;
        
        this.isMonitoringFPS = true;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.frames = [];
        
        const measureFPS = (timestamp) => {
            if (!this.isMonitoringFPS) return;
            
            const now = performance.now();
            const elapsed = now - this.lastFrameTime;
            
            // 每秒计算一次帧率
            if (elapsed > 1000) {
                const fps = this.frameCount * 1000 / elapsed;
                this.frames.push(fps);
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
            
            this.frameCount++;
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * 停止监测帧率
     */
    stopFPSMonitoring() {
        this.isMonitoringFPS = false;
    }
    
    /**
     * 获取平均帧率
     * @returns {number} - 平均帧率
     */
    getAverageFPS() {
        if (this.frames.length === 0) return 0;
        
        const sum = this.frames.reduce((acc, val) => acc + val, 0);
        return sum / this.frames.length;
    }
    
    /**
     * 获取指定测量的统计信息
     * @param {string} name - 测量名称
     * @returns {Object} - 统计信息
     */
    getStats(name) {
        if (!this.measurements[name] || this.measurements[name].length === 0) {
            return {
                min: 0,
                max: 0,
                avg: 0,
                count: 0
            };
        }
        
        const values = this.measurements[name];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        return {
            min,
            max,
            avg,
            count: values.length
        };
    }
}

// 创建全局性能监测实例
export const performanceMonitor = new PerformanceMonitor(); 