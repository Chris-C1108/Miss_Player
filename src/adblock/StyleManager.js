/**
 * 样式管理类
 * 负责创建和应用广告屏蔽相关的CSS样式
 */

/**
 * 样式管理类
 */
class StyleManager {
  /**
   * 创建样式管理实例
   * @param {Object} config - 广告屏蔽配置
   */
  constructor(config) {
    this.config = config;
  }
  
  /**
   * 创建并应用广告屏蔽样式
   */
  applyAdBlockStyles() {
    // 如果无样式，则直接返回
    if (this.config.adSelectors.length === 0 && this.config.customStyles.length === 0) {
      return;
    }
    
    // 创建样式元素
    const styleElement = document.createElement('style');
    styleElement.id = 'adblock-styles';
    styleElement.type = 'text/css';
    
    // 构建广告屏蔽CSS
    let css = '';
    
    // 添加广告选择器样式
    if (this.config.adSelectors.length > 0) {
      css += this.config.adSelectors.join(', ') + 
        ' { display: none !important; visibility: hidden !important; height: 0 !important; min-height: 0 !important; }';
    }
    
    // 添加自定义样式
    if (this.config.customStyles.length > 0) {
      css += '\n' + this.config.customStyles.map(item => 
        `${item.selector} { ${item.styles} }`).join('\n');
    }
    
    // 设置样式内容
    styleElement.textContent = css;
    
    // 添加到文档头部
    document.head.appendChild(styleElement);
    
    console.log('已应用广告屏蔽样式');
  }
}

export default StyleManager; 