# 08: 实机自动化基准压测与性能棘轮门禁 (Performance Ratchet & Integration)

**What to build:** 在 tests/perf/run-perf.js 中落地 mp:settings-open 性能断言，对实机真实 Chrome 进行连续 20 次打开/关闭压力测试与内存泄漏审计。

**Blocked by:** 07: 全量五国多语言覆盖与旧代码收尾 (i18n & Deprecation Cleanup)

**Status:** completed

- [x] 在性能基准套件中新增设置面板打开耗时度量 (mp:settings-open)，断言首分段渲染延迟 <= 5ms。
- [x] 执行 20 次设置面板连续开闭测试，验证 DOM 节点数无悬挂泄漏，JS 堆内存波动 <= 2MB。
- [x] 在真实 Chrome (CDP 直连) 环境下实测滚动流畅度，验证无触发行重排掉帧。
- [x] 更新 docs/performance.md 与 TODO.md，记录性能重构前后实测基准对比数据。
