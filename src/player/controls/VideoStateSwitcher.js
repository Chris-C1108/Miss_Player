import { PLAY, PAUSE, REPLAY } from '../../constants/icons.js';
import { __ } from '../../constants/i18n.js';

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
        this.onDragStateChange = options.onDragStateChange || (() => {});

        this.modes = [
            { id: 'preview', title: __('modePreview') || '快览片段', shortTitle: __('modePreviewShort') || '快览' },
            { id: 'normal',  title: __('modeNormal') || '正常播放', shortTitle: __('modeNormalShort') || '正常' },
            { id: 'climax',  title: __('modeReplay') || '连播高光', shortTitle: __('modeReplayShort') || '连播' }
        ];

        this.currentIndex = this.modes.findIndex(m => m.id === this.initialMode);
        if (this.currentIndex === -1) this.currentIndex = 1;

        // 统一高度 40px，宽度自适应 100%，滑块 94px × 36px，slot 78px
        this.config = Object.assign({
            width: 340,              // 基础参考宽度 (实际由 100% 容器自适应)
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
        this.currentTranslate = 0;
        this.startTranslate = 0;
        this.moveHistory = [];
        this.hasDragged = false;
        this.isPointerDown = false;

        this.audioCtx = null;
        this._ro = null;

        this.render();
        this.currentTranslate = this.getTranslateForIndex(this.currentIndex);
        this.startTranslate = this.currentTranslate;
        this.bindEvents();
        this.snapToIndex(this.currentIndex, false, false);
    }

    notifyDragState(isDragging) {
        if (typeof this.onDragStateChange === 'function') {
            this.onDragStateChange(isDragging);
        }
        const row = this.container?.closest?.('.tm-playback-control-row') || this.wrapper?.closest?.('.tm-playback-control-row');
        if (row) {
            row.classList.toggle('is-sliding', isDragging);
        }
    }

    getTranslateForIndex(index) {
        const containerWidth = this.capsuleContainer?.offsetWidth || this.container?.offsetWidth || this.config.width;
        return containerWidth / 2 - (index + 0.5) * this.slotWidth;
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

        // 1. 外层轨道：100% 全宽透明轨道，两端平滑渐隐遮罩
        this.capsuleContainer = document.createElement('div');
        this.capsuleContainer.className = 'mp-switcher-capsule';

        // 2. 居中滑块：透明背景，纯净透视底部文字，1px 微光边框与内阴影
        this.indicator = document.createElement('div');
        this.indicator.className = 'mp-switcher-indicator';

        // 3. 内部滑动履带
        this.track = document.createElement('div');
        this.track.className = 'mp-switcher-track';

        // 渲染各档位 Item
        this.itemElements = [];
        this.modes.forEach((mode, idx) => {
            const itemEl = document.createElement('div');
            itemEl.className = `mp-switcher-item mp-switcher-item-${mode.id}`;

            // 两侧文字
            const labelEl = document.createElement('span');
            labelEl.className = 'mp-switcher-label';
            labelEl.textContent = mode.title;

            // 变体操作层
            const variantContainer = document.createElement('div');
            variantContainer.className = 'mp-switcher-variant-slot';

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
     * 刷新居中变体 UI (纯 Class 控制，禁止内嵌样式)
     */
    updateVariantUI() {
        this.itemElements.forEach((item, idx) => {
            const isActive = idx === this.currentIndex;
            const showVariant = isActive && this.isMorphed && !this.isDragging;

            item.labelEl.classList.toggle('is-hidden', showVariant);
            item.labelEl.classList.toggle('is-active', isActive);

            item.variantContainer.classList.toggle('is-visible', showVariant);

            if (isActive) {
                item.variantContainer.innerHTML = '';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'mp-switcher-action-btn';

                const curMode = this.modes[idx].id;

                // 场景 1: 正常模式 (居中展现纯白 15px 播放/暂停图标)
                if (curMode === 'normal') {
                    btn.title = this.runtimeState.isPlaying ? '暂停' : '播放';
                    btn.innerHTML = `<span class="mp-switcher-play-icon${!this.runtimeState.isPlaying ? ' is-paused' : ''}">${this.runtimeState.isPlaying ? PAUSE : PLAY}</span>`;
                }
                // 场景 2: 快速预览 / 精彩重温
                else {
                    if (this.runtimeState.isCapsuleLocked) {
                        btn.title = '点击取消单片段循环';
                        btn.innerHTML = `<span class="mp-switcher-btn-cancel">取消循环</span>`;
                    } else if (this.runtimeState.isTourEnded) {
                        btn.title = '从第 1 个高光重新播放';
                        btn.innerHTML = `<span class="mp-switcher-btn-text"><span class="mp-switcher-replay-icon">${REPLAY || ''}</span> 重播</span>`;
                    } else {
                        const modeText = (curMode === 'preview') ? (__('modePreviewShort') || '快览') : (__('modeReplayShort') || '连播');
                        const statusDot = this.runtimeState.isPlaying 
                            ? '<span class="mp-switcher-status-dot"></span>'
                            : '<span class="mp-switcher-status-play">▶</span>';
                        btn.title = modeText + ' (点击' + (this.runtimeState.isPlaying ? '暂停' : '继续') + ')';
                        btn.innerHTML = `<span class="mp-switcher-btn-text">${modeText}${statusDot}</span>`;
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
                this.notifyDragState(false);
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
                    step = 1; // 每次滑动只允许切换到相邻下一个，不可跳格
                } else if (projectedDeltaX > threshold) {
                    step = -1; // 每次滑动只允许切换到相邻上一个，不可跳格
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
                    this.notifyDragState(true);
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
            // 每次拖动物理限制在相邻的下一个与上一个档位范围内，禁止跨档滑至最后一个
            const minIndex = Math.min(this.modes.length - 1, this.currentIndex + 1);
            const maxIndex = Math.max(0, this.currentIndex - 1);
            const minTranslate = this.getTranslateForIndex(minIndex) - 14;
            const maxTranslate = this.getTranslateForIndex(maxIndex) + 14;
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

        // 监听容器尺寸变化，自适应居中对齐
        if (typeof ResizeObserver !== 'undefined' && this.capsuleContainer) {
            this._ro = new ResizeObserver(() => {
                if (!this.isDragging) {
                    this.snapToIndex(this.currentIndex, false, false);
                }
            });
            this._ro.observe(this.capsuleContainer);
        }
    }

    destroy() {
        if (this._ro) {
            this._ro.disconnect();
            this._ro = null;
        }
        if (this.morphTimer) {
            clearTimeout(this.morphTimer);
            this.morphTimer = null;
        }
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
