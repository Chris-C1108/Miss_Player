/**
 * 性能快照测试用例
 *
 * 通过 CDP Performance.getMetrics 采集页面在脚本注入后的
 * ScriptDuration、TaskDuration、LayoutDuration 与 JSHeapUsedSize，
 * 并读取脚本埋入的 User Timing 标记 (mp:*) 来验证关键路径耗时。
 *
 * 运行前提：浏览器中已打开目标播放页面且 Miss Player 脚本已激活。
 */
module.exports = {
    id: '00_performance_snapshot',
    name: '性能快照与关键路径耗时',
    category: 'performance',

    async run({ cdp, sessionId, viewport }) {
        // 1. 启用 Performance 域并采集底层指标
        await cdp.send('Performance.enable', {}, sessionId);
        const { metrics } = await cdp.send('Performance.getMetrics', {}, sessionId);
        const m = Object.fromEntries(metrics.map(function(e) { return [e.name, e.value]; }));

        // 2. 读取脚本埋入的 User Timing 标记
        const userTimings = await cdp.evaluate(`
            (function() {
                var marks = performance.getEntriesByType('mark')
                    .filter(function(e) { return e.name.startsWith('mp:'); })
                    .map(function(e) { return { name: e.name, startTime: Math.round(e.startTime * 100) / 100 }; });
                var measures = performance.getEntriesByType('measure')
                    .filter(function(e) { return e.name.startsWith('mp:'); })
                    .map(function(e) {
                        return {
                            name: e.name,
                            duration: Math.round(e.duration * 100) / 100,
                            startTime: Math.round(e.startTime * 100) / 100
                        };
                    });
                return { marks: marks, measures: measures };
            })()
        `, sessionId);

        // 3. 断言
        var assertions = [];

        // 3a. 检查 User Timing 标记是否存在
        if (!userTimings || !userTimings.marks || userTimings.marks.length === 0) {
            assertions.push('未检测到 mp:* 性能标记，脚本可能未激活或版本过旧');
        }

        // 3b. 检查关键 measure 耗时
        if (userTimings && userTimings.measures) {
            for (var i = 0; i < userTimings.measures.length; i++) {
                var ms = userTimings.measures[i];
                if (ms.name === 'mp:early-init' && ms.duration > 50) {
                    assertions.push('早期初始化耗时 ' + ms.duration + 'ms，超过 50ms 阈值');
                }
                if (ms.name === 'mp:startup' && ms.duration > 120) {
                    assertions.push('完整启动耗时 ' + ms.duration + 'ms，超过 120ms 阈值');
                }
                if (ms.name === 'mp:theater-init' && ms.duration > 80) {
                    assertions.push('影院模式初始化耗时 ' + ms.duration + 'ms，超过 80ms 阈值');
                }
            }
        }

        // 3c. 堆内存 (仅记录)
        var heapMB = m.JSHeapUsedSize ? Math.round(m.JSHeapUsedSize / 1024 / 1024 * 10) / 10 : null;

        // 3d. Long Task 查询
        var longTaskCount = await cdp.evaluate(`
            (function() {
                try {
                    var entries = performance.getEntriesByType('longtask');
                    return entries ? entries.length : -1;
                } catch(e) { return -1; }
            })()
        `, sessionId);

        return {
            passed: assertions.length === 0,
            details: {
                cdpMetrics: {
                    ScriptDuration: m.ScriptDuration ? Math.round(m.ScriptDuration * 1000) + 'ms' : 'N/A',
                    TaskDuration: m.TaskDuration ? Math.round(m.TaskDuration * 1000) + 'ms' : 'N/A',
                    LayoutDuration: m.LayoutDuration ? Math.round(m.LayoutDuration * 1000) + 'ms' : 'N/A',
                    JSHeapUsedMB: heapMB !== null ? heapMB + ' MB' : 'N/A'
                },
                userTimings: userTimings,
                longTaskCount: longTaskCount >= 0 ? longTaskCount : '不支持查询'
            },
            assertions: assertions
        };
    }
};
