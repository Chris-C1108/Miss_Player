/**
 * 跨域协同影子总线 (CrossDomainBridge)
 * 提供多平行域名或跨域名之间的同源高特权操作协同机制 (基于 GM 存储值监听器)
 */
import { Toast } from '../utils/index.js';

export class CrossDomainBridge {
    /**
     * 检查特定站点的影子标签页是否在线
     * @param {string} siteKey - 站点 Key (如 'JABLE', 'MISSAV')
     * @returns {Promise<boolean>} 是否在线
     */
    static async checkShadowActive(siteKey) {
        try {
            if (typeof GM_getValue === 'function') {
                const heartbeat = await GM_getValue(`${siteKey}_SHADOW_HEARTBEAT`, 0);
                // 5 秒内有心跳更新则判定在线
                return (Date.now() - heartbeat) < 5000;
            }
        } catch (e) {
            console.debug(`[CrossDomainBridge] 检查心跳状态错误 (${siteKey}):`, e);
        }
        return false;
    }

    /**
     * 启动影子端代理监听器 (运行在目标站点同源的前台标签页中)
     * @param {string} siteKey - 站点唯一 Key
     * @param {Object} handlerMap - Action 对应的处理函数映射 { [action]: async (payload) => result }
     */
    static startBroker(siteKey, handlerMap = {}) {
        const hostname = window.location.hostname;
        console.log(`[CrossDomainBridge] 影子通道已在 ${siteKey} (${hostname}) 标签页激活。`);

        // 1. 定期发送心跳时间戳，声明此标签页正处于活跃运行状态
        //    立即发送第一个心跳（不等待 setInterval 的首次触发）
        const sendHeartbeat = () => {
            try {
                if (typeof GM_setValue === 'function') {
                    GM_setValue(`${siteKey}_SHADOW_HEARTBEAT`, Date.now());
                }
            } catch (e) {
                console.error(`[CrossDomainBridge] 发送影子心跳失败 (${siteKey}):`, e);
            }
        };
        sendHeartbeat(); // 立即发送第一个心跳
        setInterval(sendHeartbeat, 2000);

        const handleCommand = async (cmd) => {
            const { txId, action, payload } = cmd;
            const handler = handlerMap[action];

            if (handler) {
                console.log(`[CrossDomainBridge] 收到影子通道指令: ${action}, txId: ${txId}`);
                try {
                    // 执行具体操作
                    const result = await handler(payload);
                    
                    // 回传成功结果
                    if (typeof GM_setValue === 'function') {
                        GM_setValue(`${siteKey}_RES_BRIDGE`, {
                            txId,
                            status: 'SUCCESS',
                            result,
                            timestamp: Date.now()
                        });
                    }
                } catch (err) {
                    console.error(`[CrossDomainBridge] 影子指令执行失败:`, err);
                    if (typeof GM_setValue === 'function') {
                        GM_setValue(`${siteKey}_RES_BRIDGE`, {
                            txId,
                            status: 'ERROR',
                            error: err.message || '执行异常',
                            timestamp: Date.now()
                        });
                    }
                }
            } else {
                console.warn(`[CrossDomainBridge] 未找到 Action '${action}' 的处理程序`);
            }
        };

        // 2. 注册指令监听器
        try {
            if (typeof GM_addValueChangeListener === 'function') {
                GM_addValueChangeListener(`${siteKey}_CMD_BRIDGE`, async (key, oldValue, newValue) => {
                    if (!newValue) return;
                    
                    // 防御性检查：超过 10 秒的指令判定为过期，不予执行
                    if (Date.now() - newValue.timestamp > 10000) {
                        console.debug(`[CrossDomainBridge] 收到过期的指令，忽略:`, newValue);
                        return;
                    }

                    await handleCommand(newValue);
                });
            } else {
                console.log(`[CrossDomainBridge] GM_addValueChangeListener 未定义，影子通道启动轮询监听指令。`);
                let lastTxId = '';
                setInterval(async () => {
                    try {
                        if (typeof GM_getValue !== 'function') return;
                        const cmd = await GM_getValue(`${siteKey}_CMD_BRIDGE`);
                        if (cmd && cmd.txId !== lastTxId) {
                            lastTxId = cmd.txId;
                            // 防御性检查：超过 10 秒的指令判定为过期，不予执行
                            if (Date.now() - cmd.timestamp > 10000) {
                                console.debug(`[CrossDomainBridge] 轮询：收到过期的指令，忽略:`, cmd);
                                return;
                            }
                            await handleCommand(cmd);
                        }
                    } catch (e) {
                        console.debug(`[CrossDomainBridge] 轮询指令出错:`, e);
                    }
                }, 1000);
            }
        } catch (e) {
            console.error(`[CrossDomainBridge] 初始化监听器出错 (${siteKey}):`, e);
        }
    }

    /**
     * 向影子标签页发送指令并等待响应结果
     * @param {string} siteKey - 目标站点 Key
     * @param {string} action - 操作名称
     * @param {Object} payload - 参数载荷
     * @param {number} [timeout=15000] - 超时时间 (ms)
     * @returns {Promise<any>} 影子页返回的数据，如果失败则返回 false
     */
    static async sendCommand(siteKey, action, payload, timeout = 15000) {
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        console.log(`[CrossDomainBridge] 发送影子通道指令: ${action}, siteKey: ${siteKey}, txId: ${txId}`);

        return new Promise((resolve) => {
            let listenerId = null;
            let pollInterval = null;

            const cleanUp = () => {
                clearTimeout(timeoutId);
                if (listenerId && typeof GM_removeValueChangeListener === 'function') {
                    GM_removeValueChangeListener(listenerId);
                }
                if (pollInterval) {
                    clearInterval(pollInterval);
                }
            };

            // 超时保护
            const timeoutId = setTimeout(() => {
                cleanUp();
                Toast(`影子通道 [${siteKey}] 操作超时，请检查该站点的标签页是否开启`, 3000, 'error');
                resolve(false);
            }, timeout);

            const handleResponse = (res) => {
                cleanUp();
                if (res.status === 'SUCCESS') {
                    resolve(res.result !== undefined ? res.result : true);
                } else {
                    const errMsg = res.error || '执行失败';
                    Toast(`通过影子页提交失败: ${errMsg}`, 3000, 'error');
                    resolve(false);
                }
            };

            // 监听应答桥
            if (typeof GM_addValueChangeListener === 'function') {
                listenerId = GM_addValueChangeListener(`${siteKey}_RES_BRIDGE`, (key, oldValue, newValue) => {
                    if (newValue && newValue.txId === txId) {
                        handleResponse(newValue);
                    }
                });
            } else {
                console.log(`[CrossDomainBridge] GM_addValueChangeListener 未定义，使用轮询监听应答桥。`);
                pollInterval = setInterval(async () => {
                    try {
                        if (typeof GM_getValue !== 'function') return;
                        const res = await GM_getValue(`${siteKey}_RES_BRIDGE`);
                        if (res && res.txId === txId) {
                            handleResponse(res);
                        }
                    } catch (e) {
                        console.debug(`[CrossDomainBridge] 轮询应答出错:`, e);
                    }
                }, 500);
            }

            // 发送指令到指令桥
            try {
                if (typeof GM_setValue === 'function') {
                    GM_setValue(`${siteKey}_CMD_BRIDGE`, {
                        txId,
                        action,
                        payload,
                        timestamp: Date.now()
                    });
                } else {
                    throw new Error('GM_setValue is not available');
                }
            } catch (e) {
                console.error(`[CrossDomainBridge] 写入指令失败:`, e);
                cleanUp();
                resolve(false);
            }
        });
    }
}
