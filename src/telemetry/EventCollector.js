/**
 * Miss_Player 核心遥测埋点模块 (EventCollector v9.0)
 * 
 * 职责：
 * 1. 匿名客户端 ID 管理（基于终端浏览器指纹生成确定性 MD5）
 * 2. 丰富上下文数据采集 (avcode 番号、站点类型、设备/方向维度、脚本版本)
 * 3. 1小时定期 / 页面卸载 统一 Batch 上报 (POST /api/telemetry/unified)
 */

import { md5 } from '../utils/md5.js';
import { isMobile, isPortrait } from '../utils/device.js';
import { isSiteDomain } from '../constants/domains.js';
import { fetchWithTransport } from '../utils/http.js';
import { getVideoCodeFromUrl } from '../player/controls/CommentScraper.js';
import { getValue } from '../utils/storage.js';

const WORKER_URL_PRIMARY  = 'https://telemetry.x-flow.ccwu.cc';
const WORKER_URL_FALLBACK = 'https://xflow-telemetry.chen-m1108.workers.dev';
const TOKEN_SALT          = 'XFLOW_v6_SECRET';
const CLIENT_ID_KEY       = 'mp_telemetry_client_id_v2';
const MP_CACHE_KEY        = 'mp_telemetry_cache_v3';
const ONE_HOUR_MS         = 60 * 60 * 1000;
const MIN_FLUSH_INTERVAL_MS = 15 * 60 * 1000;

function getDeviceFingerprintString() {
    const components = [];
    try {
        components.push(navigator.userAgent || '');
        components.push(navigator.language || '');
        components.push(navigator.hardwareConcurrency || 4);
        components.push(`${window.screen ? window.screen.width : 0}x${window.screen ? window.screen.height : 0}`);
        components.push(new Date().getTimezoneOffset());
        
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
    } catch (_) {
        components.push('fp_err');
    }
    return components.join('||');
}

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

function genToken(ts) {
    const str = `${TOKEN_SALT}_${ts}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash).toString(36);
}

function getScriptVersion() {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return GM_info.script.version;
        }
    } catch (_) {}
    return '5.5.5';
}

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
        this.lastFlushTs = 0;
        this.loadCache();

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

    loadCache() {
        try {
            let raw = null;
            if (typeof GM_getValue === 'function') {
                raw = GM_getValue(MP_CACHE_KEY, null);
            }
            if (!raw && typeof localStorage !== 'undefined') {
                raw = localStorage.getItem(MP_CACHE_KEY);
            }
            if (raw) {
                const cache = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (cache) {
                    this.sessionBuffer.eventCounts = cache.eventCounts || {};
                    this.sessionBuffer.avcodes = new Set(cache.avcodes || []);
                    this.sessionBuffer.totalPlaySec = cache.totalPlaySec || 0;
                    this.sessionBuffer.milestones = cache.milestones || [];
                    this.lastFlushTs = cache.lastFlushTs || 0;
                }
            }
        } catch (_) {}
    }

    saveCache() {
        try {
            const data = JSON.stringify({
                eventCounts: this.sessionBuffer.eventCounts,
                avcodes: Array.from(this.sessionBuffer.avcodes),
                totalPlaySec: this.sessionBuffer.totalPlaySec,
                milestones: this.sessionBuffer.milestones,
                lastFlushTs: this.lastFlushTs
            });
            if (typeof GM_setValue === 'function') {
                GM_setValue(MP_CACHE_KEY, data);
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(MP_CACHE_KEY, data);
            }
        } catch (_) {}
    }

    clearCache() {
        this.sessionBuffer = {
            eventCounts: {},
            avcodes: new Set(),
            totalPlaySec: 0,
            milestones: []
        };
        this.lastFlushTs = Date.now();
        this.saveCache();
    }

    getDeviceType() {
        const mob = isMobile() ? 'Mobile' : 'PC';
        const ori = isPortrait() ? 'Portrait' : 'Landscape';
        return `${mob}_${ori}`;
    }

    track(eventType, eventValue = {}) {
        if (!eventType) return;

        const ts = Date.now();
        const avcode = getVideoCodeFromUrl() || '';

        this.sessionBuffer.eventCounts[eventType] = (this.sessionBuffer.eventCounts[eventType] || 0) + 1;

        if (avcode) {
            this.sessionBuffer.avcodes.add(avcode);
        }

        if (eventType === 'player_close' && eventValue && eventValue.duration_sec) {
            const sec = parseInt(eventValue.duration_sec, 10);
            if (!isNaN(sec) && sec > 0) {
                this.sessionBuffer.totalPlaySec += sec;
            }
        }

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

        this.saveCache();
        this.checkPeriodicFlush();
    }

    isEnabled() {
        return getValue('telemetryEnabled', true);
    }

    checkPeriodicFlush() {
        const now = Date.now();
        if (now - this.lastFlushTs >= ONE_HOUR_MS) {
            this.flush(false);
        }
    }

    async flush(isSync = false, force = false) {
        if (!this.isEnabled()) return;

        const counts = this.sessionBuffer.eventCounts;
        const countKeys = Object.keys(counts);
        if (countKeys.length === 0 && this.sessionBuffer.totalPlaySec === 0) return;

        const now = Date.now();
        if (!force) {
            if (!isSync && now - this.lastFlushTs < ONE_HOUR_MS) return;
            if (isSync && now - this.lastFlushTs < MIN_FLUSH_INTERVAL_MS && this.sessionBuffer.totalPlaySec < 30) return;
        }

        const currentCounts = { ...counts };
        const currentPlaySec = this.sessionBuffer.totalPlaySec;
        const currentAvcodes = Array.from(this.sessionBuffer.avcodes);
        const currentMilestones = [...this.sessionBuffer.milestones];

        const ts = Date.now();
        const dateObj = new Date(ts);
        const dateStr = dateObj.toISOString().slice(0, 10);
        const hourOfDay = dateObj.getHours();
        const sessionId = `mp_${this.clientId}_${dateStr}_${hourOfDay}`;

        const payload = {
            app_id: 'missplayer',
            user_id: this.clientId,
            session_id: sessionId,
            date: dateStr,
            ts,
            hour_of_day: hourOfDay,
            site_key: typeof window !== 'undefined' ? window.location.hostname || '' : '',
            site_category: getSiteCategory(),
            version: getScriptVersion(),
            device_type: this.getDeviceType(),
            total_play_sec: currentPlaySec,
            event_counts: currentCounts,
            avcodes: currentAvcodes,
            details_json: {
                milestones: currentMilestones
            },
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
        };

        const body = JSON.stringify(payload);
        const headers = {
            'Content-Type': 'application/json',
            'X-Telemetry-Token': genToken(ts),
            'X-Telemetry-Ts': String(ts)
        };

        const sendToUrl = async (baseUrl) => {
            const url = `${baseUrl}/api/telemetry/unified`;
            return await fetchWithTransport(url, {
                method: 'POST',
                headers,
                body,
                timeout: isSync ? 3000 : 8000
            });
        };

        this.clearCache();

        try {
            const res = await sendToUrl(WORKER_URL_PRIMARY);
            if (res.status !== 200) {
                await sendToUrl(WORKER_URL_FALLBACK);
            }
        } catch (_) {
            try {
                await sendToUrl(WORKER_URL_FALLBACK);
            } catch (__) {
                // 上报失败时无强求，已打点至 AE 与下次会话
            }
        }
    }

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
