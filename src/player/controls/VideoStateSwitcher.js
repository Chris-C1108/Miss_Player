import { PLAY, PAUSE, REPLAY } from '../../constants/icons.js';

/**
 * VideoStateSwitcher
 * 
 * 严格遵从 Apple 极简美学与流体滑动人机工程：
 * 1. 正常模式居中，左右对齐「快速预览」与「精彩重温」
 * 2. 宽度扩展至 216px，滑动步长增至 78px，彻底消除误触！
 * 3. 外层轨道完全透明 (transparent)，彻底消除框体多余包袱
 * 4. 状态切换滑块完全透明 (background: transparent)，纯净透视底层滑动文字，辅以极轻内倒角微光与半透边框
 * 5. 高度与两侧组件严格统一为 40px
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

        this.modes = [
            { id: 'preview', title: '快速预览', shortTitle: '预览' },
            { id: 'normal',  title: '正常模式', shortTitle: '正常' },
            { id: 'climax',  title: '精彩重温', shortTitle: '重温' }
        ];

        this.currentIndex = this.modes.findIndex(m => m.id === this.initialMode);
        if (this.currentIndex === -1) this.currentIndex = 1;

        // 统一高度 40px，宽度加宽至 216px，滑块 94px × 36px，slot 78px
        this.config = Object.assign({
            width: 216,              // 充足加宽，防止误触
            height: 40,             // 严格与两侧音量、变速胶囊统一为 40px 高度
            morphDelay: 380,
            friction: 0.55,
            springStiffness: 320,
            enableSound: true
        }, options.config || {});

        this.indicatorWidth = 94;
        this.slotWidth = 78;

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
                gain.gain.setValueAtTime(0.04, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.025);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(840, t);
                osc.frequency.exponentialRampToValueAtTime(420, t + 0.03);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.035);
            }
        } catch {}
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'mp-switcher-wrapper select-none shrink-0';
        this.wrapper.style.cssText = `
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            flex-shrink: 0;
            height: ${this.config.height}px;
        `;

        // 1. 外层轨道：完全透明！两端保留平滑渐隐遮罩
        this.capsuleContainer = document.createElement('div');
        this.capsuleContainer.className = 'mp-switcher-capsule';
        this.capsuleContainer.style.cssText = `
            position: relative;
            width: ${this.config.width}px;
            height: ${this.config.height}px;
            background: transparent;
            border-radius: 9999px;
            overflow: hidden;
            border: none;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%);
            cursor: grab;
            touch-action: none;
            box-sizing: border-box;
        `;

        // 2. 居中滑块：透明背景！让滑动时底部的文字完全清晰透视可见
        // 配合极轻的 1px solid rgba(255,255,255,0.22) 与内倒角微光
        this.indicator = document.createElement('div');
        this.indicator.className = 'mp-switcher-indicator';
        this.indicator.style.cssText = `
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translate(-50%, 0) scale(1);
            width: ${this.indicatorWidth}px;
            height: 36px;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 10;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.22);
            box-shadow: inset 0 1px 0.5px rgba(255, 255, 255, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
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

            // 两侧文字
            const labelEl = document.createElement('span');
            labelEl.className = 'mp-switcher-label';
            labelEl.textContent = mode.title;
            labelEl.style.cssText = `
                font-size: 12px;
                white-space: nowrap;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.45);
                transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), color 0.18s ease;
                pointer-events: none;
                letter-spacing: -0.1px;
            `;

            // 变体操作层
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
                transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1);
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
     * 刷新居中变体 UI
     */
    updateVariantUI() {
        this.itemElements.forEach((item, idx) => {
            const isActive = idx === this.currentIndex;
            const showVariant = isActive && this.isMorphed && !this.isDragging;

            item.labelEl.style.opacity = showVariant ? '0' : '1';
            item.labelEl.style.color = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
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
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    outline: none;
                    gap: 4px;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif;
                    transition: transform 0.12s ease;
                `;

                const curMode = this.modes[idx].id;

                // 场景 1: 正常模式 (居中展现纯白 15px 播放/暂停图标)
                if (curMode === 'normal') {
                    btn.title = this.runtimeState.isPlaying ? '暂停' : '播放';
                    btn.innerHTML = this.runtimeState.isPlaying ? PAUSE : PLAY;
                    const svg = btn.querySelector('svg');
                    if (svg) {
                        svg.style.width = '15px';
                        svg.style.height = '15px';
                        svg.style.fill = '#ffffff';
                        svg.style.stroke = 'none';
                        if (!this.runtimeState.isPlaying) {
                            svg.style.marginLeft = '1.5px';
                        }
                    }
                }
                // 场景 2: 快速预览 / 精彩重温
                else {
                    if (this.runtimeState.isCapsuleLocked) {
                        btn.title = '点击取消单片段循环';
                        btn.innerHTML = `<span style="font-size:11px; font-weight:600; color:#ff453a; white-space:nowrap; letter-spacing:-0.2px;">取消循环</span>`;
                    } else if (this.runtimeState.isTourEnded) {
                        btn.title = '从第一个胶囊重新播放';
                        btn.innerHTML = `
                            <span style="font-size:11px; font-weight:600; color:#ffffff; display:flex; align-items:center; gap:2px; white-space:nowrap;">
                                ${REPLAY || ''} 重播
                            </span>
                        `;
                        const svg = btn.querySelector('svg');
                        if (svg) {
                            svg.style.width = '11px';
                            svg.style.height = '11px';
                            svg.style.stroke = '#ffffff';
                        }
                    } else {
                        const modeText = (curMode === 'preview') ? '快速预览' : '精彩重温';
                        const statusDot = this.runtimeState.isPlaying 
                            ? '<span style="display:inline-block; width:4px; height:4px; border-radius:50%; background:#30d158; box-shadow:0 0 5px rgba(48,209,88,0.8); margin-left:2px;"></span>'
                            : '<span style="font-size:8px; margin-left:2px; opacity:0.8;">▶</span>';
                        btn.title = modeText + ' (点击' + (this.runtimeState.isPlaying ? '暂停' : '继续') + ')';
                        btn.innerHTML = `<span style="font-size:11.5px; font-weight:600; color:#ffffff; display:flex; align-items:center; white-space:nowrap; letter-spacing:-0.2px;">${modeText}${statusDot}</span>`;
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
        const defaultDuration = Math.round((0.28 / Math.sqrt(stiffnessRatio)) * 100) / 100;
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
            this.indicator.style.transform = 'translate(-50%, 0) scale(1.02)';
            this.indicator.style.borderColor = 'rgba(255, 255, 255, 0.35)';
        });
        picker.addEventListener('mouseleave', () => {
            this.indicator.style.transform = 'translate(-50%, 0) scale(1)';
            this.indicator.style.borderColor = 'rgba(255, 255, 255, 0.22)';
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
                const baseDuration = 0.28 / Math.sqrt(stiffnessRatio);
                const animDuration = Math.min(0.48, Math.max(0.18, baseDuration + speed * (0.07 / safeFriction)));

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
            const minTranslate = this.getTranslateForIndex(this.modes.length - 1) - 14;
            const maxTranslate = this.getTranslateForIndex(0) + 14;
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
            this.indicator.style.background = 'transparent';
            return;
        }
        this.indicator.style.background = `linear-gradient(to right, rgba(255, 120, 130, 0.40) ${pct}%, transparent ${pct}%)`;
    }
}
