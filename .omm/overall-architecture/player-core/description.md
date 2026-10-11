播放器内核 (src/player/core/PlayerCore.js)。负责宿主页面原生 `<video>` 元素的精准定位、劫持与挂载，维护视频解码状态、异步 Seeking 防闪跳锁、物理真实时长嗅探漏斗及退出全屏时的元素安全归还。
