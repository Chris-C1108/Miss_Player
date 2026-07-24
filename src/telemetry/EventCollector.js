/**
 * Miss_Player 核心遥测埋点模块 (EventCollector)
 * 
 * 职责：
 * 1. 匿名客户端 ID 管理（基于终端浏览器指纹生成确定性 MD5，重装脚本依然保持一致）
 * 2. 丰富上下文数据采集 (avcode 番号、站点类型、设备/方向维度、脚本版本)
 * 3. 防抖与批量打包上报 (3 秒防抖, 页面关闭同步 flush)
 * 4. 多 Worker 节点容灾传输
 */

import { md5 } from '../utils/md5.js';
import { isMobile, isPortrait } from '../utils/device.js';
import { isSiteDomain } from '../constants/domains.js';
import { fetchWithTransport } from '../utils/http.js';
import { getVideoCodeFromUrl } from '../player/controls/CommentScraper.js';

const WORKER_URL_PRIMARY = 'https://telemetry.x-flow.ccwu.cc';
const WORKER_URL_FALLBACK = 'https://xflow-telemetry.chen-m1108.workers.dev';
const TOKEN_SALT = 'XFLOW_v6_SECRET';
const CLIENT_ID_KEY = 'mp_telemetry_client_id_v2';

/**
 * 提取确定性终端浏览器指纹
 * @returns {string} 包含硬件/浏览器特性的特征串
 */
function getDeviceFingerprintString() {
    const components = [];
    try {
        components.push(navigator.userAgent || '');
        components.push(navigator.language || '');
        components.push(navigator.hardwareConcurrency || 4);
        components.push(`${window.screen ? window.screen.width : 0}x${window.screen ? window.screen.height : 0}`);
        components.push(new Date().getTimezoneOffset());
        
        // Canvas 轻量级签名
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('MissPlayer,v1!~', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('MissPlayer,v1!~', 4, 17);
            components.push(canvas.toDataURL());
        }
    } catch (e) {
        components.push('fp_err');
    }
    return components.join('||');
}

/**
 * 生成或获取存留的持久化 client_id
 */
function getOrCreateClientId() {
    let storedId = '';
    try {
        if (typeof GM_getValue === 'function') {
            storedId = GM_getValue(CLIENT_ID_KEY, '');
        }
    } catch (_) {}

    if (!storedId) {
        try {
            storedId = localStorage.getItem(CLIENT_ID_KEY) || '';
        } catch (_) {}
    }

    if (storedId) return storedId;

    // 基于浏览器指纹生成确定性 MD5 client_id
    const fpString = getDeviceFingerprintString();
    const newId = 'mp_' + md5(fpString).slice(0, 24);

    try {
        if (typeof GM_setValue === 'function') {
            GM_setValue(CLIENT_ID_KEY, newId);
        }
    } catch (_) {}
    try {
        localStorage.setItem(CLIENT_ID_KEY, newId);
    } catch (_) {}

    return newId;
}

/**
 * 计算简单 Hash Token 防爬
 */
function genToken(ts) {
    const str = `${TOKEN_SALT}_${ts}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash).toString(36);
}

/**
 * 获取当前脚本版本
 */
function getScriptVersion() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return GM_info.script.version;
        }
    } catch (_) {}
    return '1.2.0';
}

/**
 * 获取当前站点归属
 */
function getSiteCategory() {
    if (isSiteDomain('MISSAV')) return 'MISSAV';
    if (isSiteDomain('JABLE')) return 'JABLE';
    if (isSiteDomain('JAVLIBRARY')) return 'JAVLIBRARY';
    if (isSiteDomain('JAVDB')) return 'JAVDB';
    return 'GENERIC';
}

export class EventCollector {
    constructor() {
        this.clientId = getOrCreateClientId();
        this.sessionBuffer = {
            eventCounts: {},
            avcodes: new Set(),
            totalPlaySec: 0,
            milestones: []
        };
        this.flushTimer = null;
        this.batchDelayMs = 15 * 60 * 1000; // 15分钟批量汇总刷新

        // 页面关闭/隐藏时同步刷新汇总包
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flush(true));
            window.addEventListener('pagehide', () => this.flush(true));
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.flush(true);
                }
            });
        }
    }

    /**
     * 获取设备类型/模式
     */
    getDeviceType() {
        const mob = isMobile() ? 'Mobile' : 'PC';
        const ori = isPortrait() ? 'Portrait' : 'Landscape';
        return `${mob}_${ori}`;
    }

    /**
     * 核心埋点上报函数 - 本地累加合并，大幅降低 D1 写入频次
     * @param {string} eventType 事件类型名称
     * @param {Object} [eventValue={}] 细节 Payload
     */
    track(eventType, eventValue = {}) {
        if (!eventType) return;

        const ts = Date.now();
        const avcode = getVideoCodeFromUrl() || '';

        // 1. 累加事件触发次数
        this.sessionBuffer.eventCounts[eventType] = (this.sessionBuffer.eventCounts[eventType] || 0) + 1;

        // 2. 收集番号
        if (avcode) {
            this.sessionBuffer.avcodes.add(avcode);
        }

        // 3. 收集播放时长
        if (eventType === 'player_close' && eventValue && eventValue.duration_sec) {
            const sec = parseInt(eventValue.duration_sec, 10);
            if (!isNaN(sec) && sec > 0) {
                this.sessionBuffer.totalPlaySec += sec;
            }
        }

        // 4. 重要关键节点记录到 milestones 里程碑 (上限 30 条)
        const CRITICAL_EVENTS = ['app_init', 'player_open_success', 'player_open_fail', 'player_close', 'autologin_result', 'comment_scrape_result', 'adblock_intercept'];
        if (CRITICAL_EVENTS.includes(eventType)) {
            if (this.sessionBuffer.milestones.length < 30) {
                this.sessionBuffer.milestones.push({
                    t: ts,
                    e: eventType,
                    v: eventValue
                });
            }
        }

        // 重要关键事件或特定时机触发延时 Flush
        if (eventType === 'player_close' || eventType === 'app_init') {
            this.scheduleFlush(1000);
        } else {
            this.scheduleFlush(this.batchDelayMs);
        }
    }

    /**
     * 安排防抖/定时刷新
     */
    scheduleFlush(delayMs) {
        const targetDelay = delayMs || this.batchDelayMs;
        if (this.flushTimer) {
            if (targetDelay < 10000) {
                clearTimeout(this.flushTimer);
                this.flushTimer = null;
            } else {
                return;
            }
        }
        this.flushTimer = setTimeout(() => {
            this.flushTimer = null;
            this.flush();
        }, targetDelay);
    }

    /**
     * 刷新并发送当前 Session / 小时聚合汇总数据包
     * @param {boolean} [isSync=false] 页面关闭时强制发送
     */
    async flush(isSync = false) {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        const counts = this.sessionBuffer.eventCounts;
        const countKeys = Object.keys(counts);
        if (countKeys.length === 0 && this.sessionBuffer.totalPlaySec === 0) return;

        // 导出当前缓冲区并重置
        const currentCounts = { ...counts };
        const currentPlaySec = this.sessionBuffer.totalPlaySec;
        const currentAvcodes = Array.from(this.sessionBuffer.avcodes);
        const currentMilestones = [...this.sessionBuffer.milestones];

        // 重置内存缓冲区
        this.sessionBuffer.eventCounts = {};
        this.sessionBuffer.totalPlaySec = 0;
        this.sessionBuffer.milestones = [];

        const ts = Date.now();
        const dateObj = new Date(ts);
        const dateStr = dateObj.toISOString().slice(0, 10);
        const hourOfDay = dateObj.getHours();
        const sessionId = `mp_${this.clientId}_${dateStr}_${hourOfDay}`;

        const payload = {
            is_session_summary: true,
            client_id: this.clientId,
            session_id: sessionId,
            date: dateStr,
            ts,
            hour_of_day: hourOfDay,
            host: window.location.hostname || '',
            site_category: getSiteCategory(),
            script_version: getScriptVersion(),
            device_type: this.getDeviceType(),
            total_play_sec: currentPlaySec,
            event_counts: currentCounts,
            avcodes: currentAvcodes,
            details_json: {
                milestones: currentMilestones
            }
        };

        const body = JSON.stringify(payload);
        const headers = {
            'Content-Type': 'application/json',
            'X-MP-Token': genToken(ts),
            'X-MP-Ts': String(ts)
        };

        const sendToUrl = async (baseUrl) => {
            const url = `${baseUrl}/api/mp/telemetry/events`;
            return await fetchWithTransport(url, {
                method: 'POST',
                headers,
                body,
                timeout: isSync ? 3000 : 8000
            });
        };

        try {
            const res = await sendToUrl(WORKER_URL_PRIMARY);
            if (res.status !== 200) {
                await sendToUrl(WORKER_URL_FALLBACK);
            }
        } catch (e) {
            try {
                await sendToUrl(WORKER_URL_FALLBACK);
            } catch (_) {
                // 上报失败时避免阻塞主进程
            }
        }
    }

    /**
     * 应用初始化心跳 (6小时防重)
     */
    trackAppInit() {
        const INIT_KEY = 'mp_app_init_last_ts';
        let lastSent = 0;
        try {
            if (typeof GM_getValue === 'function') {
                lastSent = parseInt(GM_getValue(INIT_KEY, '0'), 10);
            }
        } catch (_) {}
        if (!lastSent) {
            try {
                lastSent = parseInt(localStorage.getItem(INIT_KEY) || '0', 10);
            } catch (_) {}
        }

        const now = Date.now();
        if (now - lastSent < 6 * 3600 * 1000) return;

        try {
            if (typeof GM_setValue === 'function') GM_setValue(INIT_KEY, String(now));
            localStorage.setItem(INIT_KEY, String(now));
        } catch (_) {}

        this.track('app_init', {
            screen_resolution: `${window.screen ? window.screen.width : 0}x${window.screen ? window.screen.height : 0}`,
            language: navigator.language || '',
            hardware_concurrency: navigator.hardwareConcurrency || 0
        });
    }
}

export const telemetry = new EventCollector();
