/**
 * 响应式跨标签状态机 (ReactiveStore)
 * 
 * 职责：
 * 1. 使用 ES6 Proxy 代理状态对象，自动打通持久化存储 (setValue)
 * 2. 依托 GM_addValueChangeListener 监听多标签/跨窗口状态变化 (remote === true)
 * 3. 实现多标签页配置热同步、播放进度跨窗口无缝响应
 */
import { getValue, setValue } from './storage.js';

export class ReactiveStore {
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.listeners = new Map(); // key -> Set<callback>
        this.changeListenerIds = new Map(); // key -> listenerId
        
        // 创建代理对象
        this.proxy = new Proxy(this.state, {
            set: (target, prop, value) => {
                const oldValue = target[prop];
                if (oldValue === value) return true;
                
                target[prop] = value;
                setValue(prop, value);
                this._notify(prop, value, oldValue, false);
                return true;
            },
            get: (target, prop) => {
                return target[prop];
            }
        });
    }

    /**
     * 初始化多标签页变更监听
     * @param {string[]} monitoredKeys 要跨标签监听的键名列表
     */
    enableCrossTabSync(monitoredKeys = []) {
        if (typeof GM_addValueChangeListener !== 'function') return;

        for (const key of monitoredKeys) {
            if (this.changeListenerIds.has(key)) continue;

            const listenerId = GM_addValueChangeListener(key, (name, oldValue, newValue, remote) => {
                if (remote) {
                    console.log(`[ReactiveStore] 接收到跨标签同步事件: ${name} ->`, newValue);
                    this.state[name] = newValue;
                    this._notify(name, newValue, oldValue, true);
                }
            });

            this.changeListenerIds.set(key, listenerId);
        }
    }

    /**
     * 订阅某个字段的状态变化
     * @param {string} key 键名
     * @param {Function} callback (newValue, oldValue, isRemote) => void
     * @returns {Function} 取消订阅函数
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        return () => {
            const set = this.listeners.get(key);
            if (set) set.delete(callback);
        };
    }

    _notify(key, newValue, oldValue, isRemote) {
        const set = this.listeners.get(key);
        if (set) {
            for (const cb of set) {
                try {
                    cb(newValue, oldValue, isRemote);
                } catch (err) {
                    console.error(`[ReactiveStore] 通知监听异常 (${key}):`, err);
                }
            }
        }
    }

    destroy() {
        if (typeof GM_removeValueChangeListener === 'function') {
            for (const id of this.changeListenerIds.values()) {
                try {
                    GM_removeValueChangeListener(id);
                } catch (_) {}
            }
        }
        this.changeListenerIds.clear();
        this.listeners.clear();
    }
}
