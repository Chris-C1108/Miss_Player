/**
 * Miss Player 触控音效模块 (Apple HIG Tactile Sound)
 * 集成 @web-kits/audio 的 Minimal 预设，在按键点击与 Tab 切换时播放 Tap 音效
 */
import { defineSound } from '@web-kits/audio';
import { tap as tapDefinition } from '../../.web-kits/minimal.js';
import { getValue } from './storage.js';

// 确保在 Safari 或旧环境下的 Web Audio 兼容性
if (typeof window !== 'undefined' && !window.AudioContext && window.webkitAudioContext) {
    window.AudioContext = window.webkitAudioContext;
}

let tapSoundVoice = null;
let lastPlayTime = 0;

/**
 * 获取或懒加载初始化 Tap 音效客户端 (@web-kits/audio minimal patch)
 * source: sine 1200Hz, decay: 0.012s, release: 0.004s, gain: 0.08
 */
function getTapSound() {
    if (!tapSoundVoice) {
        tapSoundVoice = defineSound(tapDefinition);
    }
    return tapSoundVoice;
}

/**
 * 播放 Tap 触控音效 (由用户交互手势如 click / pointerdown 触发)
 * @param {boolean} [force=false] - 是否强制播放（忽略用户设置开关，常用于设置面板开启时的即时反馈）
 */
export function playTapSound(force = false) {
    try {
        if (typeof window === 'undefined' || (!window.AudioContext && !window.webkitAudioContext)) {
            return;
        }

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (now - lastPlayTime < 25) {
            return;
        }
        lastPlayTime = now;

        if (!force) {
            const isEnabled = getValue('buttonSoundEnabled', true);
            if (!isEnabled) return;
        }

        const play = getTapSound();
        play();
    } catch (_) {
        // 静默捕获可能的音频环境或权限限制，确保不影响页面交互
    }
}

/**
 * 别名兼容：控制面板按钮点击音效统一指向 Tap
 */
export const playButtonClickSound = playTapSound;
