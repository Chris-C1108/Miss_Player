
import { PLAY, PAUSE, REPLAY } from '../../constants/icons.js';

/**
 * VideoStateSwitcher
 * 
 * 遵循 Apple 界面交互设计哲学：
 * 1. 正常模式居中，左为「快速预览」，右为「精彩重温」
 * 2. 92px 纯净 Apple 宽胶囊，高斯毛玻璃 (backdrop-filter: blur(20px) saturate(180%)) 与标志 Apple 蓝描边
 * 3. 半透明隐形式底壳，去除死黑硬块，完美融入播放器半透背景
 * 4. 1:1 跟手滑动物理惯性与磁吸吸附，两阶段平滑 Morph 渐变
 * 5. 纯正弦 Web Audio 触感级微音效
 */
export class VideoStateSwitcher {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container 挂载容器
     * @param {string} [options.initialMode='normal'] 初始主状态 ('preview' | 'normal' | 'climax')
     * @param {Function} [options.onModeChange] 状态档位切换回调 (mode) => void
     * @param {Function} [options.onVariantAction] 变体操作回调 (actionType, mode) => void
     * @param {Object} [options.config] 物理参数配置
     */
    constructor(options = {}) {
        this.container = options.container;
        this.initialMode = options.initialMode || 'normal';
        this.onModeChange = options.onModeChange || (() => {});
        this.onVariantAction = options.onVariantAction || (() => {});

        // 1. 正常模式居中，左右分别是快速预览和精彩重温
        this.modes = [
            { id: 'preview', title: '快速预览', shortTitle: '预览' },
            { id: 'normal',  title: '正常模式', shortTitle: '正常' },
            { id: 'climax',  title: '精彩重温', shortTitle: '重温' }
        ];

        this.currentIndex = this.modes.findIndex(m => m.id === this.initialMode);
        if (this.currentIndex === -1) this.currentIndex = 1; // 默认居中为正常模式

        // Apple Design 精密几何与物理参数
        this.config = Object.assign({
            width: 192,              // 紧凑适度，给两侧音量和倍速留足呼吸空间
            height: 34,             // 契合 Apple 经典 32~36px 胶囊标高
            morphDelay: 420,        // 停留吸附稳定后平滑 Morph 变为按键的时延 (ms)
            friction: 0.55,         // Safari 经典惯性阻尼
            springStiffness: 320,   // 磁吸刚度，紧致清脆
            enableSound: true
        }, options.config || {});

        // 居中指示器 92px（严格契合 Miss Player 的 92px 纯净 Apple 宽胶囊设计规范）
        this.indicatorWidth = 92;
        this.slotWidth = 72;

        // 运行时状态
        this.isMorphed = false;
        this.isDragging = false;
        this.morphTimer = null;
        this.runtimeState = {
            isPlaying: false,
            isTourEnded: false,
            isCapsuleLocked: false
        };

        // 手势相关状态
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.currentTranslate = this.getTranslateForIndex(this.currentIndex);
        this.startTranslate = this.currentTranslate;
        this.moveHistory = [];
        this.hasDragged = false;
        this.isPointerDown = false;

        this.audioCtx = null;

        this.render();
        this.bindEvents();
        this.snapToIndex(this.currentIndex, false, false);
    }

    getTranslateForIndex(index) {
        return this.config.width / 2 - (index + 0.5) * this.slotWidth;
    }

    initAudioContext() {
        if (this.audioCtx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioCtx = new AudioCtx();
            }
        } catch {}
    }

    playHapticSound(type = 'tick') {
        if (!this.config.enableSound) return;
        try {
            this.initAudioContext();
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const t = this.audioCtx.currentTime;

            if (type === 'tick') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1050, t);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.025);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(840, t);
                osc.frequency.exponentialRampToValueAtTime(420, t + 0.035);
                gain.gain.setValueAtTime(0.07, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.04);
            }
        } catch {}
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'mp-switcher-wrapper select-none';
        this.wrapper.style.cssText = `
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
        `;

        // 1. 外部底壳：轻薄通透的 Apple 毛玻璃底壳，去除死黑沉闷
        this.capsuleContainer = document.createElement('div');
        this.capsuleContainer.className = 'mp-switcher-capsule';
        this.capsuleContainer.style.cssText = `
            position: relative;
            width: ${this.config.width}px;
            height: ${this.config.height}px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 9999px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.14);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.12);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%);
            cursor: grab;
            touch-action: none;
            box-sizing: border-box;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: border-color 0.25s ease, background-color 0.25s ease;
        `;

        // 2. 居中固定 Apple 宽胶囊视口指示器 (92px 纯净 Apple 蓝描边与半透明毛玻璃)
        this.indicator = document.createElement('div');
        this.indicator.className = 'mp-switcher-indicator';
        this.indicator.style.cssText = `
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translate(-50%, 0) scale(1);
            width: ${this.indicatorWidth}px;
            height: calc(100% - 4px);
            border-radius: 9999px;
            pointer-events: none;
            z-index: 10;
            background: rgba(255, 255, 255, 0.14);
            border: 1.5px solid rgba(0, 122, 255, 0.8);
            box-shadow: 0 2px 12px rgba(0, 122, 255, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
            box-sizing: border-box;
            overflow: hidden;
        `;

        // 3. 内部滑动履带
        this.track = document.createElement('div');
        this.track.className = 'mp-switcher-track';
        this.track.style.cssText = `
            display: flex;
            height: 100%;
            position: relative;
            z-index: 20;
            align-items: center;
            width: ${this.modes.length * this.slotWidth}px;
            will-change: transform;
        `;

        // 渲染各档位 Item
        this.itemElements = [];
        this.modes.forEach((mode, idx) => {
            const itemEl = document.createElement('div');
            itemEl.className = `mp-switcher-item mp-switcher-item-${mode.id}`;
            itemEl.style.cssText = `
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: ${this.slotWidth}px;
                flex-shrink: 0;
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
            `;

            // 文本标题层 (滑动时显露)
            const labelEl = document.createElement('span');
            labelEl.className = 'mp-switcher-label';
            labelEl.textContent = mode.title;
            labelEl.style.cssText = `
                font-size: 12px;
                white-space: nowrap;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.45);
                transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
                pointer-events: none;
                letter-spacing: -0.01em;
            `;

            // 变体操作层 (停留后渐变展示)
            const variantContainer = document.createElement('div');
            variantContainer.className = 'mp-switcher-variant-slot';
            variantContainer.style.cssText = `
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            `;

            itemEl.appendChild(labelEl);
            itemEl.appendChild(variantContainer);
            this.track.appendChild(itemEl);

            this.itemElements.push({
                mode,
                itemEl,
                labelEl,
                variantContainer
            });
        });

        this.capsuleContainer.appendChild(this.indicator);
        this.capsuleContainer.appendChild(this.track);
        this.wrapper.appendChild(this.capsuleContainer);

        if (this.container) {
            this.container.appendChild(this.wrapper);
        }
    }

    /**
     * 刷新居中胶囊变体 UI
     */
    updateVariantUI() {
        this.itemElements.forEach((item, idx) => {
            const isActive = idx === this.currentIndex;
            const showVariant = isActive && this.isMorphed && !this.isDragging;

            item.labelEl.style.opacity = showVariant ? '0' : '1';
            item.labelEl.style.color = isActive ? '#007aff' : 'rgba(255, 255, 255, 0.45)';
            item.labelEl.style.fontWeight = isActive ? '600' : '500';

            item.variantContainer.style.opacity = showVariant ? '1' : '0';
            item.variantContainer.style.pointerEvents = showVariant ? 'auto' : 'none';

            if (isActive) {
                item.variantContainer.innerHTML = '';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'mp-switcher-action-btn';
                btn.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    color: #007aff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    outline: none;
                    gap: 4px;
                    padding: 0 4px;
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
                    transition: transform 0.12s ease;
                `;

                const curMode = this.modes[idx].id;

                // 场景 1: 正常模式 (居中展现纯净 Apple 蓝播放/暂停按键)
                if (curMode === 'normal') {
                    btn.title = this.runtimeState.isPlaying ? '暂停' : '播放';
                    btn.innerHTML = this.runtimeState.isPlaying ? PAUSE : PLAY;
                    const svg = btn.querySelector('svg');
                    if (svg) {
                        svg.style.width = '20px';
                        svg.style.height = '20px';
                        svg.style.fill = '#007aff';
                        svg.style.stroke = 'none';
                    }
                }
                // 场景 2: 快速预览 / 精彩重温
                else {
                    // 特殊情况 A: 单胶囊循环锁定
                    if (this.runtimeState.isCapsuleLocked) {
                        btn.title = '点击取消单片段循环';
                        btn.innerHTML = `<span style="font-size:11.5px; font-weight:600; color:#ff3b30; white-space:nowrap; letter-spacing:-0.2px;">取消循环</span>`;
                    }
                    // 特殊情况 B: 胶囊全部巡播完毕
                    else if (this.runtimeState.isTourEnded) {
                        btn.title = '从第一个胶囊重新播放';
                        btn.innerHTML = `
                            <span style="font-size:12px; font-weight:600; color:#007aff; display:flex; align-items:center; gap:3px; white-space:nowrap;">
                                ${REPLAY || ''} 重播
                            </span>
                        `;
                        const svg = btn.querySelector('svg');
                        if (svg) {
                            svg.style.width = '13px';
                            svg.style.height = '13px';
                            svg.style.stroke = '#007aff';
                        }
                    }
                    // 特殊情况 C: 巡检运行中播放/暂停
                    else {
                        const modeText = (curMode === 'preview') ? '快速预览' : '精彩重温';
                        const statusIndicator = this.runtimeState.isPlaying ? '' : ' ▶';
                        btn.title = modeText + ' (点击' + (this.runtimeState.isPlaying ? '暂停' : '继续') + ')';
                        btn.innerHTML = `<span style="font-size:12px; font-weight:600; color:#007aff; white-space:nowrap; letter-spacing:-0.1px;">${modeText}${statusIndicator}</span>`;
                    }
                }

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.hasDragged) return;
                    this.playHapticSound('click');
                    this.handleVariantClick(curMode);
                });

                item.variantContainer.appendChild(btn);
            }
        });
    }

    handleVariantClick(mode) {
        if (mode === 'normal') {
            this.onVariantAction('toggle', mode);
            return;
        }

        if (this.runtimeState.isCapsuleLocked) {
            this.onVariantAction('cancel_loop', mode);
        } else if (this.runtimeState.isTourEnded) {
            this.onVariantAction('replay', mode);
        } else {
            this.onVariantAction('toggle', mode);
        }
    }

    /**
     * 吸附至指定状态档位
     */
    snapToIndex(index, animated = true, triggerSound = true, animConfig = null) {
        if (this.morphTimer) {
            clearTimeout(this.morphTimer);
            this.morphTimer = null;
        }
        this.isMorphed = false;

        const targetIndex = Math.max(0, Math.min(this.modes.length - 1, index));
        this.currentIndex = targetIndex;
        const targetTranslate = this.getTranslateForIndex(targetIndex);
        this.currentTranslate = targetTranslate;

        const safeStiffness = Math.max(100, Math.min(600, this.config.springStiffness));
        const stiffnessRatio = safeStiffness / 300;
        const defaultDuration = Math.round((0.30 / Math.sqrt(stiffnessRatio)) * 100) / 100;
        const defaultEasing = safeStiffness > 380
            ? 'cubic-bezier(0.14, 1.05, 0.24, 1)'
            : 'cubic-bezier(0.16, 1, 0.3, 1)';

        const duration = animConfig?.duration ?? defaultDuration;
        const easing = animConfig?.easing ?? defaultEasing;

        void this.track.offsetHeight;
        this.track.style.transition = animated ? `transform ${duration}s ${easing}` : 'none';
        this.track.style.transform = `translateX(${targetTranslate}px)`;

        if (triggerSound && animated) {
            this.playHapticSound('tick');
        }

        this.updateVariantUI();
        this.onModeChange(this.modes[targetIndex].id);

        this.morphTimer = setTimeout(() => {
            this.isMorphed = true;
            this.updateVariantUI();
        }, this.config.morphDelay);
    }

    bindEvents() {
        const picker = this.capsuleContainer;
        const track = this.track;
        const DRAG_THRESHOLD = 6;

        picker.addEventListener('mouseenter', () => {
            this.indicator.style.transform = 'translate(-50%, 0) scale(1.03)';
            this.indicator.style.borderColor = 'rgba(0, 122, 255, 1)';
            this.indicator.style.boxShadow = '0 4px 16px rgba(0, 122, 255, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.5)';
            this.capsuleContainer.style.borderColor = 'rgba(255, 255, 255, 0.24)';
        });
        picker.addEventListener('mouseleave', () => {
            this.indicator.style.transform = 'translate(-50%, 0) scale(1)';
            this.indicator.style.borderColor = 'rgba(0, 122, 255, 0.8)';
            this.indicator.style.boxShadow = '0 2px 12px rgba(0, 122, 255, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.4)';
            this.capsuleContainer.style.borderColor = 'rgba(255, 255, 255, 0.14)';
        });

        const forceEndDrag = (clientX) => {
            if (!this.isPointerDown && !this.isDragging) return;

            const wasDragging = this.isDragging;
            this.isPointerDown = false;
            this.isDragging = false;
            picker.style.cursor = 'grab';

            if (wasDragging) {
                this.hasDragged = true;
                setTimeout(() => { this.hasDragged = false; }, 120);

                const endX = clientX !== undefined ? clientX : this.lastX;
                const now = performance.now();

                const recentHistory = this.moveHistory.filter(p => now - p.time < 100);
                let velocity = 0;
                if (recentHistory.length >= 2) {
                    const oldest = recentHistory[0];
                    const newest = recentHistory[recentHistory.length - 1];
                    const dt = newest.time - oldest.time;
                    if (dt > 8) velocity = (newest.x - oldest.x) / dt;
                }
                this.moveHistory = [];

                const deltaX = endX - this.startX;

                const safeFriction = Math.max(0.15, Math.min(0.95, this.config.friction));
                const momentumFactor = Math.round(150 * (0.55 / safeFriction));
                const projectedDeltaX = deltaX + velocity * momentumFactor;

                const safeStiffness = Math.max(100, Math.min(600, this.config.springStiffness));
                const stiffnessRatio = safeStiffness / 300;
                const threshold = Math.round(this.slotWidth * Math.max(0.15, 0.26 - (stiffnessRatio - 1) * 0.08));

                let step = 0;
                if (projectedDeltaX < -threshold) {
                    step = Math.min(2, Math.max(1, Math.round(-projectedDeltaX / this.slotWidth)));
                } else if (projectedDeltaX > threshold) {
                    step = -Math.min(2, Math.max(1, Math.round(projectedDeltaX / this.slotWidth)));
                }

                const newIndex = Math.max(0, Math.min(this.modes.length - 1, this.currentIndex + step));
                const speed = Math.abs(velocity);
                const baseDuration = 0.30 / Math.sqrt(stiffnessRatio);
                const animDuration = Math.min(0.50, Math.max(0.18, baseDuration + speed * (0.07 / safeFriction)));

                this.snapToIndex(newIndex, true, true, { duration: animDuration });
            } else {
                track.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
                track.style.transform = `translateX(${this.getTranslateForIndex(this.currentIndex)}px)`;
                this.moveHistory = [];
            }
        };

        const onPointerMove = (e) => {
            if (!this.isPointerDown) return;

            const now = performance.now();
            this.lastX = e.clientX;
            this.moveHistory.push({ x: e.clientX, time: now });
            if (this.moveHistory.length > 8) this.moveHistory.shift();

            if (e.pointerType === 'mouse' && e.buttons === 0) {
                forceEndDrag(e.clientX);
                return;
            }

            const deltaX = e.clientX - this.startX;
            const deltaY = e.clientY - this.startY;

            if (!this.isDragging) {
                if (Math.abs(deltaX) > DRAG_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.isDragging = true;
                    picker.style.cursor = 'grabbing';
                    if (this.morphTimer) {
                        clearTimeout(this.morphTimer);
                        this.morphTimer = null;
                    }
                    this.isMorphed = false;
                    this.updateVariantUI();
                    track.style.transition = 'none';
                } else {
                    return;
                }
            }

            const pureDelta = deltaX - Math.sign(deltaX) * DRAG_THRESHOLD;
            let newTranslate = this.startTranslate + pureDelta;
            const minTranslate = this.getTranslateForIndex(this.modes.length - 1) - 20;
            const maxTranslate = this.getTranslateForIndex(0) + 20;
            newTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslate));

            this.currentTranslate = newTranslate;
            track.style.transform = `translateX(${newTranslate}px)`;
        };

        const onPointerUp = (e) => forceEndDrag(e.clientX);

        picker.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            this.isPointerDown = true;
            this.isDragging = false;
            this.hasDragged = false;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.lastX = e.clientX;
            this.startTranslate = this.currentTranslate;
            this.moveHistory = [{ x: e.clientX, time: performance.now() }];

            window.addEventListener('pointermove', onPointerMove, { passive: false });
            window.addEventListener('pointerup', onPointerUp, { once: true });
        });

        this.itemElements.forEach((item, idx) => {
            item.itemEl.addEventListener('click', (e) => {
                if (this.isDragging || this.hasDragged) return;
                if (idx !== this.currentIndex) {
                    this.snapToIndex(idx, true, true);
                }
            });
        });
    }

    setPlaybackRuntime(runtimeUpdate = {}) {
        Object.assign(this.runtimeState, runtimeUpdate);
        this.updateVariantUI();
    }

    setMode(modeId) {
        const idx = this.modes.findIndex(m => m.id === modeId);
        if (idx !== -1 && idx !== this.currentIndex) {
            this.snapToIndex(idx, true, true);
        }
    }

    setProgressFill(pct) {
        if (!this.indicator) return;
        const curMode = this.modes[this.currentIndex]?.id;
        if (curMode === 'normal' || pct <= 0) {
            this.indicator.style.background = 'rgba(255, 255, 255, 0.14)';
            return;
        }
        // 优雅的半透粉红自左向右平滑推进 (保持高透明度与毛玻璃)
        this.indicator.style.background = `linear-gradient(to right, rgba(255, 120, 130, 0.45) ${pct}%, rgba(255, 255, 255, 0.14) ${pct}%)`;
    }
}
