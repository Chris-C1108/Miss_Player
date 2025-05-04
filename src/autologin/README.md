# 自动登录模块

这个模块提供了一套灵活的自动登录系统，可以在不同网站上自动保存和应用登录信息。

## 功能特点

- 多网站支持 - 设计为可扩展的架构，可以轻松添加新网站支持
- 自动登录选项 - 在登录表单中提供"自动登录"选项
- 安全存储 - 使用本地存储保存登录信息
- 多语言支持 - 内置多种语言的用户界面文本

## 当前支持的网站

- MissAV (missav.ws, missav.ai, missav.com, thisav.com)

## 使用方法

```javascript
// 导入自动登录模块
import { initAutoLogin } from './autologin/index.js';

// 初始化自动登录功能
const loginManager = await initAutoLogin();
```

## 模块结构

- `index.js` - 主入口，提供导出和自动初始化
- `LoginManager.js` - 登录管理器，负责整体流程和提供者选择
- `MissavLoginProvider.js` - MissAV网站的登录提供者实现
- `utils.js` - 工具函数，包括Toast通知、存储访问等
- `i18n.js` - 多语言支持

## 扩展支持新网站

要添加对新网站的支持，需要：

1. 创建一个新的登录提供者类，实现必要的接口方法
2. 在 `LoginManager.js` 中注册新的提供者

例如，创建新的登录提供者：

```javascript
export class NewSiteLoginProvider {
    constructor() {
        this.domains = ['example.com', 'example.org'];
    }
    
    isSupportedSite() {
        const currentDomain = window.location.hostname;
        return this.domains.some(domain => currentDomain.includes(domain));
    }
    
    // 实现其他必要的方法...
}
```

然后在 `LoginManager.js` 中注册：

```javascript
// 登录提供者列表
this.providers = [
    new MissavLoginProvider(),
    new NewSiteLoginProvider()
];
``` 