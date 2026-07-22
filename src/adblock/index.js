/**
 * 广告屏蔽集成模块 (AdBlocker)
 * 整合配置管理、DOM 元素清理、样式注入与网络请求拦截
 */

import missavConfig from './sites/missav.js';

class AdBlockConfig {
  constructor(siteConfig = {}) {
    this.adSelectors = siteConfig.adSelectors || [];
    this.customStyles = siteConfig.customStyles || [];
    this.blockedUrlPatternsSet = new Set(siteConfig.blockedUrlPatterns || []);
    this.adKeywordsRegex = /ads|analytics|tracker|affiliate|stat|pixel|banner|pop|click|outstream\.video|vast|vmap|preroll|midroll|postroll|adserve/i;
  }
  
  isEmpty() {
    return this.adSelectors.length === 0 && 
           this.customStyles.length === 0 && 
           this.blockedUrlPatternsSet.size === 0;
  }
  
  shouldBlockUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (this.adKeywordsRegex.test(url)) return true;
    for (const pattern of this.blockedUrlPatternsSet) {
      if (url.includes(pattern)) return true;
    }
    return false;
  }
}

class StyleManager {
  constructor(config) {
    this.config = config;
  }
  
  applyAdBlockStyles() {
    if (this.config.adSelectors.length === 0 && this.config.customStyles.length === 0) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'adblock-styles';
    styleElement.type = 'text/css';
    
    let css = '';
    if (this.config.adSelectors.length > 0) {
      css += this.config.adSelectors.join(', ') + 
        ' { display: none !important; visibility: hidden !important; height: 0 !important; min-height: 0 !important; }';
    }
    if (this.config.customStyles.length > 0) {
      css += '\n' + this.config.customStyles.map(item => `${item.selector} { ${item.styles} }`).join('\n');
    }
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }
}

class DOMCleaner {
  constructor(config) {
    this.config = config;
    this.observer = null;
  }
  
  cleanIframes(iframeElements = null) {
    const iframes = iframeElements || document.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      if (iframe.src && !iframe.src.includes('plyr.io')) {
        iframe.remove();
      }
    }
  }
  
  removeAdElements() {
    if (this.config.adSelectors.length === 0) return;
    for (let i = 0; i < this.config.adSelectors.length; i++) {
      try {
        const elements = document.querySelectorAll(this.config.adSelectors[i]);
        for (let j = 0; j < elements.length; j++) {
          elements[j].remove();
        }
      } catch (e) {}
    }
  }
  
  observeDOMChanges() {
    if (this.observer) return;
    let pendingChanges = false;
    let frameChanges = false;
    let processingTimeout = null;
    
    const processChanges = () => {
      if (pendingChanges) { this.removeAdElements(); pendingChanges = false; }
      if (frameChanges) { this.cleanIframes(); frameChanges = false; }
      processingTimeout = null;
    };
    
    this.observer = new MutationObserver(mutations => {
      let hasNewNodes = false;
      let hasNewIframes = false;
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.addedNodes.length) {
          hasNewNodes = true;
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            if (mutation.addedNodes[j].nodeName === 'IFRAME') {
              hasNewIframes = true;
              break;
            }
          }
        }
        if (hasNewNodes && hasNewIframes) break;
      }
      if (hasNewNodes) pendingChanges = true;
      if (hasNewIframes) frameChanges = true;
      if ((pendingChanges || frameChanges) && !processingTimeout) {
        processingTimeout = setTimeout(processChanges, 50);
      }
    });
    
    this.observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

class RequestBlocker {
  constructor(config) {
    this.config = config;
  }
  
  blockTrackingRequests() {
    const originalXHR = XMLHttpRequest.prototype.open;
    const config = this.config;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (typeof url === 'string' && config.shouldBlockUrl(url)) {
        this.send = function(){};
        this.onload = null;
        this.onerror = null;
        return;
      }
      return originalXHR.apply(this, arguments);
    };

    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      let urlToCheck = url instanceof Request ? url.url : url;
      if (typeof urlToCheck === 'string' && config.shouldBlockUrl(urlToCheck)) {
        return Promise.resolve(new Response('', { status: 200, headers: {'Content-Type': 'text/plain'} }));
      }
      return originalFetch.apply(this, arguments);
    };
  }

  blockIframeLoading() {
    const createElementOriginal = document.createElement;
    const config = this.config;
    document.createElement = function(tag) {
      const element = createElementOriginal.call(document, tag);
      if (tag.toLowerCase() === 'iframe') {
        let originalSrc = element.src;
        Object.defineProperty(element, 'src', {
          set: function(value) {
            if (typeof value === 'string' && config.shouldBlockUrl(value)) return;
            originalSrc = value;
          },
          get: function() { return originalSrc; }
        });
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && typeof value === 'string' && config.shouldBlockUrl(value)) return;
          return originalSetAttribute.call(this, name, value);
        };
      }
      return element;
    };
  }
  
  blockPopups() {
    window.open = function() { return null; };
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.open = function() { return null; };
    }
  }
  
  init() {
    this.blockIframeLoading();
    this.blockTrackingRequests();
    this.blockPopups();
  }
}

/**
 * 广告屏蔽器主控类
 */
class AdBlocker {
  constructor() {
    const isMissav = /^https?:\/\/(www\.)?(missav|thisav)\.(com|ws|ai)/.test(window.location.href);
    const siteConfig = isMissav ? missavConfig : {};
    this.config = new AdBlockConfig(siteConfig);
    this.styleManager = new StyleManager(this.config);
    this.domCleaner = new DOMCleaner(this.config);
    this.requestBlocker = new RequestBlocker(this.config);
  }
  
  preventDetection() {
    window.AdBlock = false;
    window.adblock = false;
    window.adsbygoogle = { loaded: true };
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.AdBlock = false;
      unsafeWindow.adblock = false;
      unsafeWindow.adsbygoogle = { loaded: true };
    }
  }
  
  setupPeriodicCleaning() {
    this.domCleaner.removeAdElements();
    this.domCleaner.observeDOMChanges();
    setInterval(() => this.domCleaner.removeAdElements(), 2000);
  }
  
  init() {
    if (this.config.isEmpty()) return;
    this.preventDetection();
    this.styleManager.applyAdBlockStyles();
    this.requestBlocker.init();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPeriodicCleaning());
    } else {
      this.setupPeriodicCleaning();
    }
  }
}

export default AdBlocker;