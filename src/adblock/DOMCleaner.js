/**
 * DOM清理类
 * 负责移除DOM中的广告元素和监控DOM变化
 */

/**
 * DOM清理类
 */
class DOMCleaner {
  /**
   * 创建DOM清理实例
   * @param {Object} config - 广告屏蔽配置
   */
  constructor(config) {
    this.config = config;
    this.CLEANUP_THROTTLE = 500; // 节流时间：500ms
    this.observer = null; // MutationObserver实例
  }
  
  /**
   * 清理iframe - 优化为只清理新iframe
   * @param {NodeList} iframeElements - 可选的iframe元素列表
   */
  cleanIframes(iframeElements = null) {
    const iframes = iframeElements || document.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      // 只保留播放器相关iframe，移除其他广告iframe
      if (iframe.src && !iframe.src.includes('plyr.io')) {
        iframe.remove();
      }
    }
  }
  
  /**
   * 移除广告元素
   * @param {boolean} force - 是否强制清理
   */
  removeAdElements(force = false) {
    if (this.config.adSelectors.length === 0) {
      return; // 无选择器，不需要清理
    }
    
    for (let i = 0; i < this.config.adSelectors.length; i++) {
      try {
        const elements = document.querySelectorAll(this.config.adSelectors[i]);
        for (let j = 0; j < elements.length; j++) {
          elements[j].remove();
        }
      } catch (e) {
        // 忽略选择器错误
      }
    }
  }
  
  /**
   * 设置DOM变化监听
   */
  observeDOMChanges() {
    // 如果已经在观察，则不重复设置
    if (this.observer) {
      return;
    }
    
    let pendingChanges = false;
    let frameChanges = false;
    let processingTimeout = null;
    
    const processChanges = () => {
      if (pendingChanges) {
        this.removeAdElements();
        pendingChanges = false;
      }
      if (frameChanges) {
        this.cleanIframes();
        frameChanges = false;
      }
      processingTimeout = null;
    };
    
    this.observer = new MutationObserver(mutations => {
      let hasNewNodes = false;
      let hasNewIframes = false;
      
      // 快速检查是否有相关变化
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.addedNodes.length) {
          hasNewNodes = true;
          // 检查是否有新增的iframe
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (node.nodeName === 'IFRAME') {
              hasNewIframes = true;
              break;
            }
          }
        }
        if (hasNewNodes && hasNewIframes) break; // 找到所需信息后立即退出循环
      }
      
      if (hasNewNodes) {
        pendingChanges = true;
      }
      if (hasNewIframes) {
        frameChanges = true;
      }
      
      // 使用节流处理DOM变化
      if ((pendingChanges || frameChanges) && !processingTimeout) {
        processingTimeout = setTimeout(processChanges, 50);
      }
    });
    
    // 开始观察整个文档
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    console.log('DOM监听已启动');
  }
  
  /**
   * 停止DOM变化监听
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('DOM监听已停止');
    }
  }
}

export default DOMCleaner; 