媒体网络嗅探器 (src/network/MediaSniffer.js)。通过 Monkey-patch 劫持底层 window.fetch 与 XMLHttpRequest，静默捕获宿主网页加载的 .m3u8、.mp4 及各清晰度流媒体源地址，为播放器清晰度切换提供备用直链。
