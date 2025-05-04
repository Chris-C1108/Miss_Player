/**
 * 请求拦截类
 * 负责拦截和阻止广告相关网络请求
 */

/**
 * 请求拦截类
 */
class RequestBlocker {
  /**
   * 创建请求拦截实例
   * @param {Object} config - 广告屏蔽配置
   */
  constructor(config) {
    this.config = config;
  }
  
  /**
   * 拦截XMLHttpRequest和Fetch请求
   */
  blockTrackingRequests() {
    // 拦截XMLHttpRequest
    const originalXHR = XMLHttpRequest.prototype.open;
    const config = this.config;
    
    // 使用普通函数而不是箭头函数，保留正确的this上下文
    XMLHttpRequest.prototype.open = function(method, url) {
      if (typeof url === 'string' && config.shouldBlockUrl(url)) {
        // 返回一个虚拟方法，避免脚本错误
        this.send = function(){};
        this.onload = null;
        this.onerror = null;
        return;
      }
      return originalXHR.apply(this, arguments);
    };

    // 拦截Fetch请求
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // 处理 Request 对象作为参数的情况
      let urlToCheck = url;
      if (url instanceof Request) {
        urlToCheck = url.url;
      }
      
      if (typeof urlToCheck === 'string' && config.shouldBlockUrl(urlToCheck)) {
        // 返回一个解析为空的Response，避免错误
        return Promise.resolve(new Response('', {
          status: 200,
          headers: {'Content-Type': 'text/plain'}
        }));
      }
      return originalFetch.apply(this, arguments);
    };
  }

  /**
   * 拦截iframe加载
   */
  blockIframeLoading() {
    const createElementOriginal = document.createElement;
    const config = this.config;
    
    document.createElement = function(tag) {
      const element = createElementOriginal.call(document, tag);
      if (tag.toLowerCase() === 'iframe') {
        // 正确实现src属性的拦截
        let originalSrc = element.src;
        Object.defineProperty(element, 'src', {
          set: function(value) {
            if (typeof value === 'string' && config.shouldBlockUrl(value)) {
              console.log('拦截iframe:', value);
              return;
            }
            originalSrc = value;
          },
          get: function() {
            return originalSrc;
          }
        });
        
        // 监控setAttribute
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && typeof value === 'string' && config.shouldBlockUrl(value)) {
            console.log('拦截iframe setAttribute:', value);
            return;
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      return element;
    };
  }
  
  /**
   * 阻止弹窗
   */
  blockPopups() {
    window.open = function() { return null; };
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.open = function() { return null; };
    }
  }
  
  /**
   * 初始化所有拦截功能
   */
  init() {
    this.blockIframeLoading();
    this.blockTrackingRequests();
    this.blockPopups();
    console.log('请求拦截已启用');
  }
}

export default RequestBlocker; 