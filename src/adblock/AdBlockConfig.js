/**
 * 广告屏蔽配置管理类
 * 负责管理和提供各网站的广告屏蔽配置
 */

/**
 * 配置管理类
 */
class AdBlockConfig {
  /**
   * 创建配置管理实例
   * @param {Object} siteConfig - 站点特定配置
   */
  constructor(siteConfig = {}) {
    // 广告选择器
    this.adSelectors = siteConfig.adSelectors || [];
    
    // 自定义样式
    this.customStyles = siteConfig.customStyles || [];
    
    // 被阻止的URL模式集合
    this.blockedUrlPatternsSet = new Set(siteConfig.blockedUrlPatterns || []);
    
    // 预编译的广告关键词正则表达式
    this.adKeywordsRegex = /ads|analytics|tracker|affiliate|stat|pixel|banner|pop|click|outstream\.video|vast|vmap|preroll|midroll|postroll|adserve/i;
  }
  
  /**
   * 检查配置是否为空
   * @returns {boolean} 是否为空配置
   */
  isEmpty() {
    return this.adSelectors.length === 0 && 
           this.customStyles.length === 0 && 
           this.blockedUrlPatternsSet.size === 0;
  }
  
  /**
   * 检查URL是否应当被阻止
   * @param {string} url - 待检查的URL
   * @returns {boolean} 是否应当阻止
   */
  shouldBlockUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // 使用预编译的正则表达式检查
    if (this.adKeywordsRegex.test(url)) {
      return true;
    }
    
    // 使用Set的has方法更快地检查特定域名
    for (const pattern of this.blockedUrlPatternsSet) {
      if (url.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }
}

export default AdBlockConfig; 