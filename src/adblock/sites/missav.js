/**
 * Missav网站广告屏蔽配置
 * 包含特定于missav.ws/ai/com域名的广告选择器和URL模式
 */

/**
 * missav网站的广告选择器
 */
const adSelectors = [
  'div[class="space-y-6 mb-6"]', // 页面右侧便 视频广告
  'div[class*="root--"][class*="bottomRight--"]', // 页面右下角视频广告 
  'div[class="grid md:grid-cols-2 gap-8"]', // 视频下方新域名推广
  'ul[class="mb-4 list-none text-nord14 grid grid-cols-2 gap-2"]', // 视频简介下方链接推广
  'div[class="space-y-5 mb-5"]', // 页面底部视频广告
  'iframe[src*="ads"]',
  'iframe[src*="banner"]',
  'iframe[src*="pop"]',
  'iframe[data-ad]',
  'iframe[id*="ads"]',
  'iframe[class*="ads"]',
  'iframe:not([src*="plyr.io"])' // 屏蔽所有非播放器的iframe
];

/**
 * missav网站的自定义样式
 */
const customStyles = [
  {
    // 影片列表文字标题完整显示
    selector: 'div[class="my-2 text-sm text-nord4 truncate"]',
    styles: 'white-space: normal !important;'
  },
  {
    // 设置页面背景色为黑色
    selector: 'body',
    styles: 'background-color: #000000 !important;'
  },
  {
    // 设置z-max元素的z-index
    selector: 'div[class*="z-max"]',
    styles: 'z-index: 9000 !important;'
  }
];

/**
 * 需要屏蔽的URL模式
 */
const blockedUrlPatterns = [
  'exoclick.com',
  'juicyads.com',
  'popads.net',
  'adsterra.com',
  'trafficjunky.com',
  'adnium.com',
  'ad-maven.com',
  'browser-update.org',
  'mopvip.icu',
  'toppages.pw',
  'cpmstar.com',
  'propellerads.com',
  'tsyndicate.com',
  'syndication.exosrv.com',
  'ads.exosrv.com',
  'tsyndicate.com/sdk',
  'cdn.tsyndicate.com',
  'adsco.re',
  'adscpm.site',
  'a-ads.com',
  'ad-delivery.net',
  'outbrain.com',
  'taboola.com',
  'mgid.com',
  'revcontent.com',
  'adnxs.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'criteo.com',
  'doubleclick.net'
];

// 导出missav配置
export default {
  adSelectors,
  customStyles,
  blockedUrlPatterns,
  // 未来可以添加网站特有的配置
  isVideoSite: true,
  domains: ['missav.ws', 'missav.ai', 'missav.com', 'thisav.com']
}; 