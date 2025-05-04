# Miss NoAD Player v2.2

一个模块化的自定义视频播放器，支持多种功能和自定义控制。

## 项目结构

```
miss_noad_ver2.2
  ├── src/                  # 源代码目录
  │   ├── player/           # 模块化播放器组件
  │   │   ├── core/         # 核心功能模块
  │   │   ├── managers/     # 各种管理器
  │   │   ├── ui/           # UI组件
  │   │   └── utils/        # 播放器特定工具
  │   ├── constants/        # 常量定义
  │   ├── state/            # 状态管理
  │   ├── ui/               # 通用UI组件
  │   └── utils/            # 通用工具函数
  ├── dist/                 # 构建输出目录
  └── ref/                  # 参考资料
```

## 模块说明

### player/core
- `PlayerCore.js` - 播放器核心类，负责基本播放功能和状态管理

### player/managers
- `ControlManager.js` - 控制管理器，处理播放器控制逻辑
- `DragManager.js` - 拖拽管理器，处理拖拽相关功能
- `EventManager.js` - 事件管理器，处理事件监听和分发
- `LoopManager.js` - 循环管理器，处理视频循环播放功能
- `ProgressManager.js` - 进度管理器，处理播放进度
- `SettingsManager.js` - 设置管理器，处理播放器设置

### player/ui
- `UIManager.js` - UI管理器，处理播放器界面元素

## 使用方法

### 基本使用

```javascript
// 导入播放器
import { CustomVideoPlayer } from './src/player/index.js';

// 创建播放器实例
const player = new CustomVideoPlayer({
    containerId: 'video-container', // 容器ID
    startLooped: false,            // 是否循环播放
    startMuted: false             // 是否静音
});

// 初始化播放器
player.initialize();
```

### 高级使用

```javascript
// 导入模块化版本
import { ModularVideoPlayer } from './src/index.js';

// 创建播放器实例
const player = new ModularVideoPlayer({
    containerId: 'video-container',
    startLooped: true,
    startMuted: false,
    // 其他自定义选项...
});

// 初始化播放器
player.initialize();

// 使用播放器API
player.play();                 // 播放
player.pause();                // 暂停
player.setVolume(0.5);         // 设置音量
player.setPlaybackRate(1.5);   // 设置播放速度
player.toggleLoop();           // 切换循环播放
player.seekTo(120);            // 跳转到特定时间（秒）
```

## 构建项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 特性

- 🎮 自定义控制界面
- 🔄 视频循环播放
- ⏩ 可调整播放速度
- 🎚️ 音量控制
- 📊 进度条跳转
- 📱 响应式设计，支持移动端
- ��️ 拖拽控制
- ⌨️ 键盘快捷键支持 

