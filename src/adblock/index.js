/**
 * 广告屏蔽模块入口
 * 此模块负责屏蔽网站上的广告内容，提供更好的用户体验
 */

import { Utils } from '../utils';
import AdBlockConfig from './AdBlockConfig';
import StyleManager from './StyleManager';
import DOMCleaner from './DOMCleaner';
import RequestBlocker from './RequestBlocker';
import missavConfig from './sites/missav';

/**
 * 根据网站URL获取适合的配置
 * @param {string} url - 当前网站URL
 * @returns {Object} 站点特定配置
 */
function getSiteConfig(url) {
  // 目前只支持missav，未来可以扩展
  if (/^https?:\/\/(www\.)?(missav|thisav)\.(com|ws|ai)/.test(url)) {
    return missavConfig;
  }
  
  // 返回默认空配置
  return {
    adSelectors: [],
    customStyles: [],
    blockedUrlPatterns: []
  };
}

/**
 * 广告屏蔽器类
 */
class AdBlocker {
  constructor() {
    const siteConfig = getSiteConfig(window.location.href);
    this.config = new AdBlockConfig(siteConfig);
    this.styleManager = new StyleManager(this.config);
    this.domCleaner = new DOMCleaner(this.config);
    this.requestBlocker = new RequestBlocker(this.config);
  }
  
  /**
   * 防止被检测到AdBlock
   */
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
  
  /**
   * 设置定期清理
   */
  setupPeriodicCleaning() {
    // 首次运行强制清理
    this.domCleaner.removeAdElements(true);
    this.domCleaner.observeDOMChanges();
    
    // 定时检查，2秒一次
    setInterval(() => this.domCleaner.removeAdElements(), 2000);
  }
  
  /**
   * 初始化广告屏蔽器
   */
  init() {
    // 检查当前网站是否需要启用广告屏蔽
    if (this.config.isEmpty()) {
      return; // 无配置，不启用
    }
    
    console.log('广告屏蔽模块已启用');
    
    // 防止被检测
    this.preventDetection();
    
    // 应用样式（尽早执行）
    this.styleManager.applyAdBlockStyles();
    
    // 初始化请求拦截器
    this.requestBlocker.init();
    
    // 当DOM加载后执行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPeriodicCleaning());
    } else {
      this.setupPeriodicCleaning();
    }
  }
}

// 导出广告屏蔽器
export default AdBlocker; 