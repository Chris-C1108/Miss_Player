const globalConsole = typeof console !== 'undefined' ? console : null;

class Logger {
    constructor(prefix = '[Miss Player]') {
        this.prefix = prefix;
        if (typeof window !== 'undefined') {
            if (!window.missPlayerLogs) {
                window.missPlayerLogs = [];
            }
        }
    }

    _addLog(level, ...args) {
        if (typeof window === 'undefined') return;

        const msg = args.map(arg => {
            if (arg instanceof Error) {
                return `${arg.message}\n${arg.stack}`;
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        const logEntry = {
            time: new Date().toISOString(),
            level,
            msg: `${this.prefix} ${msg}`
        };

        window.missPlayerLogs.push(logEntry);
        
        // Keep logs size reasonable (e.g. last 500 logs)
        if (window.missPlayerLogs.length > 500) {
            window.missPlayerLogs.shift();
        }

        // Write to native console dynamically to bypass Webpack/Babel stripping
        if (globalConsole) {
            const consoleMethod = level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log');
            if (globalConsole[consoleMethod]) {
                globalConsole[consoleMethod](`${this.prefix}`, ...args);
            }
        }
    }

    log(...args) {
        this._addLog('info', ...args);
    }

    info(...args) {
        this._addLog('info', ...args);
    }

    warn(...args) {
        this._addLog('warn', ...args);
    }

    error(...args) {
        this._addLog('error', ...args);
    }

    /**
     * 获取格式化的日志文本
     * @param {string|string[]|Function} [filter] - 过滤条件
     * @returns {string}
     */
    getLogsText(filter) {
        if (typeof window === 'undefined' || !window.missPlayerLogs || window.missPlayerLogs.length === 0) {
            return 'No logs collected.';
        }
        let logs = window.missPlayerLogs;
        if (filter) {
            if (typeof filter === 'function') {
                logs = logs.filter(l => filter(l.msg));
            } else if (typeof filter === 'string') {
                const keyword = filter.toLowerCase();
                logs = logs.filter(l => l.msg.toLowerCase().includes(keyword));
            } else if (Array.isArray(filter)) {
                logs = logs.filter(l => {
                    const msgLower = l.msg.toLowerCase();
                    return filter.some(keyword => msgLower.includes(keyword.toLowerCase()));
                });
            }
        }
        return logs.map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.msg}`).join('\n');
    }

    /**
     * 拷贝日志到剪贴板
     * @param {string|string[]|Function} [filter] - 过滤条件
     * @returns {boolean} 是否成功
     */
    copyLogs(filter) {
        const text = this.getLogsText(filter);
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text);
            return true;
        }
        return false;
    }
}

export const logger = new Logger('[Miss Player]');
export default logger;
