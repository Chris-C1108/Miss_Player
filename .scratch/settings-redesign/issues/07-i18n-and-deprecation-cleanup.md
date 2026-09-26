# 07: 全量五国多语言覆盖与旧代码收尾 (i18n & Deprecation Cleanup)

**What to build:** 彻底消除原 SettingsManager.js 中所有硬编码中文与技术黑话，将全部标题、副标题、错误提示和 Toast 注入 src/constants/i18n.js（中、繁、英、日、越）；彻底废弃并移除旧版 1830 行单体代码。

**Blocked by:** 05: 实验特性与高级排错板块垂直切片 (Beta & Advanced Vertical Slice), 06: 云端同步与关于板块垂直切片 (Cloud Sync & About Vertical Slice)

**Status:** completed

- [x] 将重构后的所有文案全面接入多语言机制，在 src/constants/i18n.js 中补充 5 国语言完整对照。
- [x] 全面清除调试术语和工程黑话，全部转化为通俗易懂的场景价值描述。
- [x] 彻底移除旧版 SettingsManager.js 内部的冗余陈旧函数（如 _createToggleOption 旧版硬编码实现、内联 DOM 拼接等），平稳过渡到新微模块架构。
- [x] 运行 npm run build 与 npm run ci:check，验证构建产物体积健康且零语法错误。
