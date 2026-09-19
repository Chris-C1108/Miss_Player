/**
 * Miss Player 触控音效模块 (Apple HIG Tactile Sound)
 * 采用原生 Web Audio API 合成轻量清脆的 Tap 音效（正弦波 1200Hz），零第三方外部依赖
 */
import { getValue } from './storage.js';

let audioCtx = null;
let lastPlayTime = 0;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

/**
 * 播放 Tap 触控音效 (由用户交互手势如 click / pointerdown 触发)
 * 参数与原始 minimal 预设保持严格一致：
 * - 频率: 1200Hz 正弦波
 * - 增益: 0.08 峰值
 * - 包络衰减: decay 12ms, release 4ms
 * @param {boolean} [force=false] - 是否强制播放（忽略用户设置开关，常用于设置面板开启时的即时反馈）
 */
export function playTapSound(force = false) {
    try {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (now - lastPlayTime < 25) {
            return;
        }
        lastPlayTime = now;

        if (!force) {
            const isEnabled = getValue('buttonSoundEnabled', true);
            if (!isEnabled) return;
        }

        const ctx = getAudioContext();
        if (!ctx) return;

        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t0);

        // 快速包络：0.08 -> 衰减至静音
        gain.gain.setValueAtTime(0.08, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.016);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t0);
        osc.stop(t0 + 0.02);

        osc.onended = () => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch (_) {}
        };
    } catch (_) {
        // 静默捕获音频权限或环境限制，确保不影响页面核心交互
    }
}

/**
 * 别名兼容：控制面板按钮点击音效统一指向 Tap
 */
export const playButtonClickSound = playTapSound;
