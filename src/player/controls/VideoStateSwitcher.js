import { PLAY, PAUSE, REPLAY } from '../../constants/icons.js';

/**
 * VideoStateSwitcher
 * 
 * 移植自 https://github.com/Chris-C1108/3-status-switcher-demo
 * 
 * 核心交互特性：
 * 1. 外部胶囊两端带渐变遮罩 (mask-image)，左右相邻模式露出边缘提示 (Peeking Indication)
 * 2. 居中固定 Apple 风格毛玻璃视口胶囊 (backdrop-filter: blur(16px) saturate(180%))
 * 3. 内部履带 1:1 跟手滑动物理模型，惯性衰减 (Friction) 与磁吸弹簧刚度 (Spring Stiffness)
 * 4. 两阶段 Morphing：横滑时显示清晰档位文本，居中停顿后平滑渐变为变体快捷操作按键
 * 5. Web Audio 极简纯正弦波微反馈音效 (Raphael Salaja Minimal)
 */
export class VideoStateSwitcher {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container 挂载容器
     * @param {string} [options.initialMode='normal'] 初始主状态 ('normal' | 'preview' | 'climax')
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
            { id: 'normal', title: '正常模式', shortTitle: '正常' },
            { id: 'preview', title: '快速预览', shortTitle: '预览' },
            { id: 'climax', title: '精彩重温', shortTitle: '重温' }
        ];

        this.currentIndex = Math.max(0, this.modes.findIndex(m => m.id === this.initialMode));
        if (this.currentIndex === -1) this.currentIndex = 0;

        // 经典 Safari 物理与尺寸配置
        this.config = Object.assign({
            width: 236,              // 胶囊外壳宽度 (px)
            height: 36,             // 胶囊高度 (px)
            morphDelay: 450,        // 吸附稳定后变为变体按键的时延 (ms)
            friction: 0.55,         // 惯性衰减/阻尼 (0.15 ~ 0.90)
            springStiffness: 300,   // 磁吸刚度 (100 ~ 600)
            enableSound: true       // 是否开启触感音效
        }, options.config || {});

        // 几何布局尺寸
        this.indicatorWidth = Math.min(128, Math.max(100, Math.round(this.config.width * 0.50)));
        this.slotWidth = Math.min(108, Math.max(86, Math.round(this.config.width * 0.40)));

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

        // 音效上下文
        this.audioCtx = null;

        // 初始化构建与事件绑定
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
                // Raphael Salaja 'tab-switch': 1050Hz 纯正弦
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1050, t);
                gain.gain.setValueAtTime(0.06, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.025);
            } else if (type === 'click') {
                // Raphael Salaja 'click': 840Hz -> 420Hz
                osc.type = 'sine';
                osc.frequency.setValueAtTime(840, t);
                osc.frequency.exponentialRampToValueAtTime(420, t + 0.035);
                gain.gain.setValueAtTime(0.08, t);
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
            user-select: none;
            -webkit-user-select: none;
        `;

        // 1. 外部黑曜石胶囊容器 (带两端羽化渐变遮罩)
        this.capsuleContainer = document.createElement('div');
        this.capsuleContainer.className = 'mp-switcher-capsule';
        this.capsuleContainer.style.cssText = `
            position: relative;
            width: ${this.config.width}px;
            height: ${this.config.height}px;
            background: rgba(18, 18, 20, 0.88);
            border-radius: 9999px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.08);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
            cursor: grab;
            touch-action: none;
            box-sizing: border-box;
            transition: border-color 0.25s ease, box-shadow 0.25s ease;
        `;

        // 2. 居中固定 Apple 风格毛玻璃指示器 (Pill Indicator)
        this.indicator = document.createElement('div');
        this.indicator.className = 'mp-switcher-indicator';
        this.indicator.style.cssText = `
            position: absolute;
            top: 2.5px;
            left: 50%;
            transform: translate(-50%, 0) scale(1);
            width: ${this.indicatorWidth}px;
            height: calc(100% - 5px);
            border-radius: 9999px;
            pointer-events: none;
            z-index: 10;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.12) 100%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: inset 0 1px 0.5px rgba(255, 255, 255, 0.45), 0 2px 10px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
            box-sizing: border-box;
        `;

        // 3. 内部滑动履带 (Sliding Track)
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

        // 渲染 3 档状态 Item
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

            // 文本标题层
            const labelEl = document.createElement('span');
            labelEl.className = 'mp-switcher-label';
            labelEl.textContent = mode.title;
            labelEl.style.cssText = `
                font-size: 13px;
                white-space: nowrap;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
                color: rgba(255, 255, 255, 0.4);
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
     * 刷新并呈现当前模式下的变体操作内容
     */
    updateVariantUI() {
        this.itemElements.forEach((item, idx) => {
            const isActive = idx === this.currentIndex;
            const showVariant = isActive && this.isMorphed && !this.isDragging;

            item.labelEl.style.opacity = showVariant ? '0' : '1';
            item.labelEl.style.color = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
            item.labelEl.style.fontWeight = isActive ? '600' : '400';

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
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    outline: none;
                    gap: 5px;
                    padding: 0 8px;
                    transition: transform 0.12s ease;
                `;

                const curMode = this.modes[idx].id;

                // 场景 1: 正常模式 ── 纯粹播放/暂停
                if (curMode === 'normal') {
                    btn.title = this.runtimeState.isPlaying ? '暂停' : '播放';
                    btn.innerHTML = this.runtimeState.isPlaying ? PAUSE : PLAY;
                    const svg = btn.querySelector('svg');
                    if (svg) {
                        svg.style.width = '18px';
                        svg.style.height = '18px';
                        svg.style.fill = '#007aff';
                    }
                }
                // 场景 2: 快速预览 / 精彩重温
                else {
                    // 特殊情况 A: 用户锁定了某个单胶囊循环
                    if (this.runtimeState.isCapsuleLocked) {
                        btn.title = '点击取消单片段循环';
                        btn.innerHTML = `<span style="font-size:12px; font-weight:600; color:#ff3b30; white-space:nowrap; letter-spacing:-0.2px;">点击取消循环</span>`;
                    }
                    // 特殊情况 B: 所有胶囊全部播放完毕
                    else if (this.runtimeState.isTourEnded) {
                        btn.title = '从第一个胶囊重新播放';
                        btn.innerHTML = `
                            <span style="font-size:12px; font-weight:600; color:#007aff; display:flex; align-items:center; gap:3px; white-space:nowrap;">
                                ${REPLAY || ''} 重新播放
                            </span>
                        `;
                        const svg = btn.querySelector('svg');
                        if (svg) {
                            svg.style.width = '14px';
                            svg.style.height = '14px';
                            svg.style.stroke = '#007aff';
                        }
                    }
                    // 特殊情况 C: 巡检运行中播放/暂停
                    else {
                        btn.title = this.runtimeState.isPlaying ? '暂停' : '播放';
                        btn.innerHTML = this.runtimeState.isPlaying ? PAUSE : PLAY;
                        const svg = btn.querySelector('svg');
                        if (svg) {
                            svg.style.width = '18px';
                            svg.style.height = '18px';
                            svg.style.fill = '#007aff';
                        }
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
        const defaultDuration = Math.round((0.32 / Math.sqrt(stiffnessRatio)) * 100) / 100;
        const defaultEasing = safeStiffness > 380
            ? 'cubic-bezier(0.14, 1.05, 0.24, 1)'
            : 'cubic-bezier(0.2, 0.98, 0.25, 1)';

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

        // 停留时延：平滑 Morph 为变体操作按钮
        this.morphTimer = setTimeout(() => {
            this.isMorphed = true;
            this.updateVariantUI();
        }, this.config.morphDelay);
    }

    /**
     * 绑定原生拖拽、惯性与防粘滞边界事件 (完全对齐 Demo 原生手势安全协议)
     */
    bindEvents() {
        const picker = this.capsuleContainer;
        const track = this.track;
        const DRAG_THRESHOLD = 6;

        picker.addEventListener('mouseenter', () => {
            this.indicator.style.transform = 'translate(-50%, 0) scale(1.04)';
            this.indicator.style.borderColor = 'rgba(0, 122, 255, 0.5)';
            this.capsuleContainer.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        });
        picker.addEventListener('mouseleave', () => {
            this.indicator.style.transform = 'translate(-50%, 0) scale(1)';
            this.indicator.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            this.capsuleContainer.style.borderColor = 'rgba(255, 255, 255, 0.16)';
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

                // 统计 100ms 内释放瞬时速度
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

                // 惯性投影距离计算 (基于摩擦衰减)
                const safeFriction = Math.max(0.15, Math.min(0.95, this.config.friction));
                const momentumFactor = Math.round(160 * (0.55 / safeFriction));
                const projectedDeltaX = deltaX + velocity * momentumFactor;

                // 磁吸阈值判定
                const safeStiffness = Math.max(100, Math.min(600, this.config.springStiffness));
                const stiffnessRatio = safeStiffness / 300;
                const threshold = Math.round(this.slotWidth * Math.max(0.15, 0.28 - (stiffnessRatio - 1) * 0.08));

                let step = 0;
                if (projectedDeltaX < -threshold) {
                    step = Math.min(2, Math.max(1, Math.round(-projectedDeltaX / this.slotWidth)));
                } else if (projectedDeltaX > threshold) {
                    step = -Math.min(2, Math.max(1, Math.round(projectedDeltaX / this.slotWidth)));
                }

                const newIndex = Math.max(0, Math.min(this.modes.length - 1, this.currentIndex + step));
                const speed = Math.abs(velocity);
                const baseDuration = 0.32 / Math.sqrt(stiffnessRatio);
                const animDuration = Math.min(0.55, Math.max(0.18, baseDuration + speed * (0.08 / safeFriction)));

                this.snapToIndex(newIndex, true, true, { duration: animDuration });
            } else {
                track.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.35, 1)';
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
            const minTranslate = this.getTranslateForIndex(this.modes.length - 1) - 24;
            const maxTranslate = this.getTranslateForIndex(0) + 24;
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

        // 点击未激活项直接平滑吸附
        this.itemElements.forEach((item, idx) => {
            item.itemEl.addEventListener('click', (e) => {
                if (this.isDragging || this.hasDragged) return;
                if (idx !== this.currentIndex) {
                    this.snapToIndex(idx, true, true);
                }
            });
        });
    }

    /**
     * 外部播放器状态发生变更时，同步更新组件运行时展示
     */
    setPlaybackRuntime(runtimeUpdate = {}) {
        Object.assign(this.runtimeState, runtimeUpdate);
        this.updateVariantUI();
    }

    /**
     * 外部变更主模式
     */
    setMode(modeId) {
        const idx = this.modes.findIndex(m => m.id === modeId);
        if (idx !== -1 && idx !== this.currentIndex) {
            this.snapToIndex(idx, true, true);
        }
    }

    /**
     * 设置指示器上的倒计时平滑进度 (0 ~ 100)
     */
    setProgressFill(pct) {
        if (!this.indicator) return;
        const curMode = this.modes[this.currentIndex]?.id;
        if (curMode === 'normal' || pct <= 0) {
            this.indicator.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.12) 100%)';
            return;
        }
        this.indicator.style.background = `linear-gradient(to right, rgba(255, 120, 130, 0.5) ${pct}%, rgba(255, 255, 255, 0.15) ${pct}%)`;
    }
}
