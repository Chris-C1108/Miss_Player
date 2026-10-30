/**
 * 存储管理工具函数 (支持 GM_getValue/GM_setValue 和 localStorage 降级)
 */

const LOCAL_STORAGE_PREFIX = 'mp_';
const LEGACY_STORAGE_PREFIX = 'missNoAD_';

/**
 * 检查是否支持 GM_getValue / GM_setValue 接口
 * @returns {boolean} 是否支持 GM 存储接口
 */
export function hasGMApi() {
    return typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
}

/**
 * 获取存储值 (支持 GM API 与 localStorage 穿透互愈双读)
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @param {boolean} [useGM=true] - 是否优先使用 GM API
 * @returns {any} 存储的数据值
 */
export function getValue(key, defaultValue = null, useGM = true) {
    try {
        let gmVal = undefined;
        const gmAvailable = useGM && hasGMApi();

        if (gmAvailable) {
            try {
                gmVal = GM_getValue(key, undefined);
            } catch (_) {}
            if (gmVal !== undefined && gmVal !== null) {
                return gmVal;
            }
        }

        // 穿透灾备：若 GM 存储未就绪或未读出有效值，穿透尝试从本地 localStorage 读取
        let localVal = defaultValue;
        let item = null;
        try {
            if (typeof localStorage !== 'undefined') {
                item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
                if (item === null) {
                    item = localStorage.getItem(LEGACY_STORAGE_PREFIX + key);
                }
            }
        } catch (_) {}

        if (item !== null) {
            try {
                localVal = JSON.parse(item);
            } catch (e) {
                localVal = item;
            }
            // 自动自愈回写：将本地读出的健康值补写回 GM 存储，完成双向自愈
            if (gmAvailable && localVal !== undefined && localVal !== null) {
                try {
                    GM_setValue(key, localVal);
                } catch (_) {}
            }
            return localVal;
        }

        return gmVal !== undefined ? gmVal : defaultValue;
    } catch (e) {
        console.error(`[Storage] 获取存储键 ${key} 失败:`, e);
        return defaultValue;
    }
}

/**
 * 获取布尔类型的存储值
 * @param {string} key - 存储键名
 * @param {boolean} [defaultValue=false] - 默认值
 * @param {boolean} [useGM=true] - 是否优先使用 GM API
 * @returns {boolean}
 */
export function getBool(key, defaultValue = false, useGM = true) {
    const v = getValue(key, defaultValue, useGM);
    return typeof v === 'boolean' ? v : (v === 'true' ? true : (v === 'false' ? false : defaultValue));
}

/**
 * 设置存储值 (支持 GM API 与 localStorage 镜像双写持久化，彻底杜绝换域名/沙箱抖动配置丢失)
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的数据值
 * @param {boolean} [useGM=true] - 是否优先使用 GM API
 */
export function setValue(key, value, useGM = true) {
    try {
        // 1. 若支持 GM API，写入油猴全局跨域持久化存储
        if (useGM && hasGMApi()) {
            try {
                GM_setValue(key, value);
            } catch (gmErr) {
                console.warn(`[Storage] GM_setValue 写入异常:`, gmErr);
            }
        }

        // 2. 同时镜像双写至 localStorage，作为无条件同域灾备
        if (typeof localStorage !== 'undefined') {
            try {
                const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
                localStorage.setItem(LOCAL_STORAGE_PREFIX + key, serializedValue);
            } catch (_) {}
        }
    } catch (e) {
        console.error(`[Storage] 设置存储键 ${key} 失败:`, e);
    }
}

/**
 * 删除存储值
 * @param {string} key - 存储键名
 * @param {boolean} [useGM=true] - 是否优先使用 GM API
 */
export function deleteValue(key, useGM = true) {
    try {
        if (useGM && typeof GM_deleteValue === 'function') {
            GM_deleteValue(key);
            return;
        }
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + key);
        localStorage.removeItem(LEGACY_STORAGE_PREFIX + key);
    } catch (e) {
        console.error(`[Storage] 删除存储键 ${key} 失败:`, e);
    }
}

/**
 * 简单 Base64 混淆函数
 * @param {string} str - 明文密码
 * @returns {string} 混淆后的密码
 */
function obfuscate(str) {
    if (!str) return '';
    try {
        // Base64 编码，然后再做反转作为简单混淆
        const b64 = btoa(unescape(encodeURIComponent(str)));
        return b64.split('').reverse().join('');
    } catch (e) {
        return str;
    }
}

/**
 * 简单 Base64 反混淆函数
 * @param {string} str - 混淆后的密码
 * @returns {string} 解开后的明文密码
 */
function deobfuscate(str) {
    if (!str) return '';
    try {
        const reversed = str.split('').reverse().join('');
        return decodeURIComponent(escape(atob(reversed)));
    } catch (e) {
        return str;
    }
}

/**
 * 原生 localStorage 写入 (指定键名)
 * @param {string} key - 完整键名
 * @param {any} value - 存储值
 */
export function setLocalStorage(key, value) {
    try {
        let valToStore = value;
        if (key === 'autologin_userPassword' && value) {
            valToStore = obfuscate(value);
        }
        localStorage.setItem(key, typeof valToStore === 'object' ? JSON.stringify(valToStore) : valToStore);
    } catch (e) {
        console.error(`[Storage] localStorage 写入键 ${key} 失败:`, e);
    }
}

/**
 * 原生 localStorage 读取 (指定键名)
 * @param {string} key - 完整键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 读取出的值或默认值
 */
export function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (item !== null) {
            if (key === 'autologin_userPassword' && typeof item === 'string') {
                return deobfuscate(item);
            }
            try {
                return JSON.parse(item);
            } catch (e) {
                return item;
            }
        }
        return defaultValue;
    } catch (e) {
        console.error(`[Storage] localStorage 读取键 ${key} 失败:`, e);
        return defaultValue;
    }
}

/**
 * 原生 localStorage 删除
 * @param {string} key - 完整键名
 */
export function deleteLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`[Storage] localStorage 删除键 ${key} 失败:`, e);
    }
}
