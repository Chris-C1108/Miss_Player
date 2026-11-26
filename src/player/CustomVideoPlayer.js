import { PlayerCore, getTheaterSessionKey, shouldTriggerInitialHighlight } from './core/PlayerCore.js';
import { UIManager } from './ui/UIManager.js';
import { ControlManager } from './managers/ControlManager.js';
import { DragManager } from './managers/DragManager.js';
import { LoopManager } from './managers/LoopManager.js';
import { ProgressManager } from './managers/ProgressManager.js';
import { EventManager } from './managers/EventManager.js';
import { SettingsManager } from './managers/SettingsManager.js';
import { SettingsV2Manager } from './managers/settings_v2/SettingsV2Manager.js';
import { HeatmapManager } from './managers/HeatmapManager.js';
import { VideoSwipeManager } from './managers/videoSwipeManager.js';
import { SubtitleManager } from './subtitles/SubtitleManager.js';
import { SeekFeedbackManager } from './managers/SeekFeedbackManager.js';
import { updateSafariThemeColor, Toast } from '../utils/index.js';
import { __ } from '../constants/i18n.js';
import { telemetry } from '../telemetry/index.js';
import { getVideoCodeFromUrl, extractMissavShardCode } from '../utils/videoCode.js';
import { AvCodeMigrationService } from '../services/AvCodeMigrationService.js';

/**
 * 自定义视频播放器控制器 - 模块化重构版本
 */
export class CustomVideoPlayer {
    constructor(options = {}) {
        console.log('[CustomVideoPlayer] 初始化...');
        
        // 创建核心播放器
        this.playerCore = new PlayerCore(options);
        
        // 保存调用按钮引用
        this.callingButton = options.callingButton || null;
        
        // 初始化管理器
        this.managers = {};
        
        // 初始状态
        this.initialized = false;
        this._activePlayStartTime = null;
        this._activePlayDurationSec = 0;
        this._lastVideoCurrentTime = 0;
        this._replayCount = 0;
    }

    /**
     * 初始化播放器
     */
    init() {
        if (this.initialized) return;
        try {
            performance.mark('mp:theater-init-start');
        
        // 标记播放器激活状态，以便 CSS 隐藏宿主干扰元素
        this._originScrollX = window.scrollX;
        this._originScrollY = window.scrollY;
        window.scrollTo(0, 0);

        document.body.classList.add('tm-player-active');
        document.documentElement.classList.add('tm-player-active');

        // 仅在 iOS 虚拟键盘弹起或输入法聚焦时锁定宿主滚动至 (0, 0)，
        // 正常观影期间放行原生 window 滚动，确保移动端视频区上滑可穿透触发 Safari 自动全屏
        const shouldLockHostScrollForKeyboard = () => {
            if (!document.body || !document.body.classList.contains('tm-player-active')) return false;
            const shadow = this.uiManager?.shadowRoot || document.querySelector('miss-player-root')?.shadowRoot;
            const container = shadow?.querySelector('.tm-player-container');
            if (container?.classList.contains('tm-ios-keyboard-open')) return true;
            const active = shadow?.activeElement || document.activeElement;
            const tag = active?.tagName?.toLowerCase();
            return tag === 'input' || tag === 'textarea' || Boolean(active?.isContentEditable);
        };

        if (!this._originalScrollTo) {
            this._originalScrollTo = window.scrollTo;
            const self = this;
            window.scrollTo = function(x, y) {
                if (shouldLockHostScrollForKeyboard()) {
                    return self._originalScrollTo.call(window, 0, 0);
                }
                return self._originalScrollTo.apply(window, arguments);
            };
        }

        // 宿主与播放器容器锁定守卫：键盘弹起时归零 window，始终保持固定播放器容器自身不发生内滚动
        this._windowScrollLock = () => {
            if (document.body && document.body.classList.contains('tm-player-active')) {
                if (shouldLockHostScrollForKeyboard() && (window.scrollY > 0 || window.scrollX > 0)) {
                    requestAnimationFrame(() => {
                        if (shouldLockHostScrollForKeyboard()) {
                            window.scrollTo(0, 0);
                        }
                    });
                }
                const shadow = this.uiManager?.shadowRoot || document.querySelector('miss-player-root')?.shadowRoot;
                const container = shadow?.querySelector('.tm-player-container');
                if (container && (container.scrollTop !== 0 || container.scrollLeft !== 0)) {
                    container.scrollTop = 0;
                    container.scrollLeft = 0;
                }
            }
        };
        window.addEventListener('scroll', this._windowScrollLock, { passive: true });

        // 隐藏网页浏览器滚动条（宿主滚动布局由 01_core/_host.css 统一分端控制，此处严禁覆盖 position/overflow）
        this._scrollbarStyle = document.createElement('style');
        this._scrollbarStyle.id = 'tm-hide-scrollbar-style';
        this._scrollbarStyle.innerHTML = `
            html::-webkit-scrollbar, body::-webkit-scrollbar {
                display: none !important;
            }
            html.tm-player-active, body.tm-player-active {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                overscroll-behavior: none !important;
            }
        `;
        document.head.appendChild(this._scrollbarStyle);
        
        // 如果PlayerCore不存在，重新创建
        if (!this.playerCore) {
            this.playerCore = new PlayerCore({
                callingButton: this.callingButton
            });
        }
        
        // 记录播放会话开始时间
        this._sessionStartTime = Date.now();

        // 初始化核心播放器
        this.playerCore.init();
        performance.mark('mp:video-hijacked');

        // 激活多标签页响应式状态热同步
        if (this.playerCore && this.playerCore.options && this.playerCore.options.playerState) {
            this.playerCore.options.playerState.initReactiveSync((key, newVal) => {
                if (this.managers.settingsManager) {
                    this.managers.settingsManager.updateControlRowsVisibility();
                }
                if (key === 'buttonSoundEnabled' && this.managers.settingsManager) {
                    this.managers.settingsManager.settings.buttonSoundEnabled = newVal;
                }
            });
        }

        
        if (!this.playerCore.targetVideo) {
            console.error('[CustomVideoPlayer] 核心初始化失败: 未找到视频元素');
            telemetry.track('player_open_fail');
            Toast(__('loadingError') || 'Failed to load video', 3000, 'error');
            // 如果是从浮动按钮调用的，则重新显示按钮
            if (this.callingButton) {
                this.callingButton.style.display = 'flex';
            }
            return;
        }

        const videoElem = this.playerCore.targetVideo;
        telemetry.track('player_open_success', {
            video_duration: videoElem.duration || 0,
            video_width: videoElem.videoWidth || 0,
            video_height: videoElem.videoHeight || 0,
            video_src_domain: (function() {
                try { return new URL(videoElem.src).hostname; } catch(_) { return ''; }
            })()
        });

        // 挂载真实有效播放时长与重播追踪器
        this._activePlayStartTime = !videoElem.paused ? Date.now() : null;
        this._activePlayDurationSec = 0;
        this._lastVideoCurrentTime = 0;
        this._replayCount = 0;

        this._onPlay = () => {
            this._activePlayStartTime = Date.now();
        };
        this._onPauseOrEnded = () => {
            if (this._activePlayStartTime) {
                this._activePlayDurationSec += (Date.now() - this._activePlayStartTime) / 1000;
                this._activePlayStartTime = null;
            }
        };
        this._onTimeUpdate = () => {
            if (videoElem && !videoElem.paused) {
                if (!this._activePlayStartTime) {
                    this._activePlayStartTime = Date.now();
                }
                const cur = videoElem.currentTime;
                if (this._lastVideoCurrentTime > 0 && (this._lastVideoCurrentTime - cur) > 2.5) {
                    this._replayCount++;
                }
                this._lastVideoCurrentTime = cur;
            }
        };

        videoElem.addEventListener('play', this._onPlay);
        videoElem.addEventListener('pause', this._onPauseOrEnded);
        videoElem.addEventListener('ended', this._onPauseOrEnded);
        videoElem.addEventListener('timeupdate', this._onTimeUpdate);
        
        // 在构建任何依赖番号的管理器之前，先同步迁移当前页错位分片/变体键的本地时间胶囊与草稿
        const authoritativeCode = this.playerCore.getVideoCode();
        const currentUrl = typeof window !== 'undefined' ? (window.location?.href || '') : '';
        const shardWrong = extractMissavShardCode(currentUrl);
        if (authoritativeCode) {
            AvCodeMigrationService.migrateLocalTabsAndDraftSync(shardWrong || authoritativeCode, authoritativeCode);
        }

        // 创建UI管理器
        const uiManager = new UIManager(this.playerCore);
        const uiElements = uiManager.createUI();
        this.managers.uiManager = uiManager;
        
        // 创建控制管理器 (注入 uiManager)
        const controlManager = new ControlManager(this.playerCore, uiElements, uiManager);
        controlManager.init();
        this.managers.controlManager = controlManager;
        
        // 创建设置管理器 (注入 uiManager, controlManager)
        const settingsManager = new SettingsManager(this.playerCore, uiElements, uiManager, controlManager);
        settingsManager.init();
        this.managers.settingsManager = settingsManager;

        // 创建统一设置面板管理器
        const settingsV2Manager = new SettingsV2Manager(this.playerCore, settingsManager);
        settingsV2Manager.setPanel(uiElements.settingsPanel);
        settingsManager.settingsV2Manager = settingsV2Manager;
        this.managers.settingsV2Manager = settingsV2Manager;
        
        // 创建进度管理器
        const progressManager = new ProgressManager(this.playerCore, uiElements);
        progressManager.init({
            progressBarElement: controlManager.progressBarElement,
            progressIndicator: controlManager.progressIndicator,
            currentTimeDisplay: controlManager.currentTimeDisplay,
            totalDurationDisplay: controlManager.totalDurationDisplay,
            timeIndicator: controlManager.timeIndicator
        });
        this.managers.progressManager = progressManager;

        // 创建播放热度与探索足迹管理器
        const heatmapManager = new HeatmapManager(this.playerCore, controlManager);
        heatmapManager.init();
        this.managers.heatmapManager = heatmapManager;
        controlManager.heatmapManager = heatmapManager;
        this.playerCore.heatmapManager = heatmapManager;
        
        // 创建循环管理器 (注入 controlManager)
        const loopManager = new LoopManager(this.playerCore, uiElements, controlManager);
        loopManager.init({
            loopStartMarker: controlManager.loopStartMarker,
            loopEndMarker: controlManager.loopEndMarker,
            loopRangeElement: controlManager.loopRangeElement,
            progressMarkersContainer: controlManager.progressMarkersContainer,
            tabScrollContainer: controlManager.tabScrollContainer,
            tabAddBtn: controlManager.tabAddBtn,
        });
        this.managers.loopManager = loopManager;
        
        // 设置循环管理器引用到控制管理器与进度管理器
        controlManager.setLoopManager(loopManager);
        progressManager.setLoopManager(loopManager);
        this.playerCore.loopManager = loopManager;
        
        // 创建拖动管理器 (注入 uiManager, controlManager)
        const dragManager = new DragManager(this.playerCore, uiElements, uiManager, controlManager);
        dragManager.init();
        this.managers.dragManager = dragManager;
        
        // 初始化VideoSwipeManager (注入 uiManager)
        if (this.playerCore.targetVideo && uiElements.videoWrapper && uiElements.handle) {
            console.log('[CustomVideoPlayer] 初始化SwipeManager...');
            this.swipeManager = new VideoSwipeManager(
                this.playerCore.targetVideo,
                uiElements.videoWrapper,
                uiElements.handle,
                uiElements,
                () => this.close(),
                uiManager
            );
            this.swipeManager.playerCore = this.playerCore; // 关联 playerCore 到 swipeManager
            this.managers.swipeManager = this.swipeManager;
        }
        
        // 集中向 UIManager 注入其它管理器依赖
        uiManager.setManagers({
            controlManager,
            progressManager,
            dragManager,
            loopManager,
            swipeManager: this.swipeManager
        });
        
        // 创建事件管理器 - 必须在所有其他管理器之后创建
        const eventManager = new EventManager(
            this.playerCore, 
            uiElements, 
            this.managers, 
            () => this.close()
        );
        eventManager.init();
        this.managers.eventManager = eventManager;
        
        // 组装DOM - 移到所有管理器初始化之后
        uiManager.assembleDOM();

        // 全局跳转反馈统一出口（监听 seeked，覆盖所有跳转来源）
        const seekFeedbackManager = new SeekFeedbackManager(this.playerCore, controlManager, progressManager);
        seekFeedbackManager.init();
        this.managers.seekFeedbackManager = seekFeedbackManager;

        // 字幕管理器 (视频内嵌渲染 + 采集/存储)，依赖组装完成的顶栏与视频容器
        const subtitleManager = new SubtitleManager(this.playerCore, uiManager, controlManager);
        subtitleManager.init();
        this.managers.subtitleManager = subtitleManager;
        if (controlManager) controlManager.subtitleManager = subtitleManager;

        // 异步迁移 IndexedDB / WebDAV / STRM 历史错位数据，完成后无感刷新字幕/热度/胶囊
        if (authoritativeCode) {
            AvCodeMigrationService.migrateCurrentPageIfNeeded(currentUrl, authoritativeCode, {
                duration: videoElem.duration || 0,
                playerState: this.playerCore?.options?.playerState
            }).then((migrated) => {
                if (!migrated) return;
                subtitleManager._loadBundle().then(() => {
                    subtitleManager._renderList();
                    subtitleManager._syncSwitchState();
                    if (subtitleManager.isEnabled && !subtitleManager.activeItem) {
                        subtitleManager._autoApplyBest({ silent: true });
                    }
                }).catch(() => {});
                if (heatmapManager && videoElem.duration > 0) {
                    heatmapManager.onLoadedMetadata().catch(() => {});
                }
            }).catch(() => {});
        }

        // 应用设置
        settingsManager.updateControlRowsVisibility();

        // Phase 7.4: 首个高光开播与断点续播仲裁 (须在 DOM 挂载后、restoreVideoState 之前执行，防止被 videoState.currentTime 覆盖或在 readyState < 2 / 起播时被 HLS/Safari 重置回 0)
        // 若用户在本页已进入过播放器并中途退出，再次点击浮动按钮重入时不再跳回首个高光，而是继续当前视频播放进度
        const playerSettings = this.playerCore.options?.playerState?.settings;
        const hasUrlDeepLink = Boolean(loopManager._hasUrlDeepLink);
        const sessionVideoKey = getTheaterSessionKey(this.playerCore.targetVideo, authoritativeCode);
        this._sessionVideoKey = sessionVideoKey;
        const hasEnteredBefore = this.playerCore.hasEnteredTheaterBefore(sessionVideoKey, this.callingButton);
        this.playerCore.markTheaterEntered(sessionVideoKey, this.callingButton);

        const shouldFirstCapsulePlay = shouldTriggerInitialHighlight({
            playerSettings,
            hasTabs: loopManager.tabs.length > 0,
            hasUrlDeepLink,
            hasEnteredBefore
        });

        if (shouldFirstCapsulePlay && this.playerCore.targetVideo) {
            const firstTab = loopManager.tabs[0];
            const targetTime = (firstTab.startTime !== undefined && firstTab.startTime !== null) ? firstTab.startTime : (firstTab.time || 0);
            const prevTime = this.playerCore.videoState?.currentTime || 0;
            this.playerCore.armInitialHighlightSeek(targetTime, {
                progressManager,
                loopManager
            });
            if (prevTime > 0 && Math.abs(prevTime - targetTime) > 3) {
                Toast('已从第 1 个高光开播，点击恢复上次断点', 5000, 'info', () => {
                    this.playerCore?.cancelInitialSeekGuard?.();
                    if (this.playerCore?.targetVideo) {
                        this.playerCore.targetVideo.currentTime = prevTime;
                        progressManager.updateProgressBar();
                        loopManager.syncProximityState({ targetTime: prevTime, forceCenter: true });
                    }
                });
            }
        }
        
        // 恢复视频状态并执行自动起播（若首个高光或 URL 深链已接管起始进度，禁止旧断点覆写 currentTime）
        this.playerCore.restoreVideoState({
            skipTimeRestore: shouldFirstCapsulePlay || hasUrlDeepLink
        });

        // 退出重入且当前视频已有播放进度时，防护移动 Shadow DOM / Safari 起播瞬间把进度洗回 0
        const resumeProgressTime = this.playerCore.videoState?.currentTime || 0;
        if (hasEnteredBefore && !hasUrlDeepLink && resumeProgressTime > 1 && this.playerCore.targetVideo) {
            this.playerCore.armInitialHighlightSeek(resumeProgressTime, {
                progressManager,
                loopManager
            });
        }
        
        // 更新进度条
        progressManager.updateProgressBar();
        
        // 更新当前时间显示
        progressManager.updateCurrentTimeDisplay();
        
        // 为iOS设备的Safari浏览器设置统一 of safe area背景色
        updateSafariThemeColor('#000000', true);
        
        // 视频元数据就绪后统一更新 UI 和位置
        const runUIUpdates = () => {
            if (this.swipeManager) {
                this.swipeManager.updateSize();
            }
            dragManager.updateHandlePosition();
            if (loopManager) {
                loopManager._updateUI();
                loopManager.updateLoopTimeDisplay();
                loopManager.updateLoopMarkers();
            }
            if (progressManager) {
                progressManager.updateProgressBar();
                progressManager.updateCurrentTimeDisplay();
            }
        };

        if (this.playerCore.targetVideo.readyState >= 1) { // HAVE_METADATA
            requestAnimationFrame(() => {
                setTimeout(runUIUpdates, 50); // 极小延迟确保 DOM 尺寸布局渲染完毕
            });
        } else {
            this.playerCore.targetVideo.addEventListener('loadedmetadata', runUIUpdates, { once: true });
        }
        
        this.initialized = true;
        performance.mark('mp:theater-ready');
        performance.measure('mp:theater-init', 'mp:theater-init-start', 'mp:theater-ready');
        console.log('[CustomVideoPlayer] 初始化完成');
        } catch (err) {
            console.error('[CustomVideoPlayer] 初始化发生异常:', err);
            telemetry.track('player_open_error', { error: String(err) });
            Toast('播放器载入失败: ' + (err.message || err), 4000, 'error');
            if (this.callingButton) {
                this.callingButton.style.display = 'flex';
            }
        }
    }

    /**
     * 关闭播放器
     */
    close() {
        // 记录退出时音频租约状态 (有声则延展记忆时间戳，静音则立即销毁)
        if (this.managers?.controlManager?.volumeController) {
            this.managers.controlManager.volumeController.recordExitState();
        }

        if (this._activePlayStartTime) {
            this._activePlayDurationSec += (Date.now() - this._activePlayStartTime) / 1000;
            this._activePlayStartTime = null;
        }

        const videoElem = this.playerCore?.targetVideo;
        if (videoElem) {
            if (this._onPlay) videoElem.removeEventListener('play', this._onPlay);
            if (this._onPauseOrEnded) {
                videoElem.removeEventListener('pause', this._onPauseOrEnded);
                videoElem.removeEventListener('ended', this._onPauseOrEnded);
            }
            if (this._onTimeUpdate) videoElem.removeEventListener('timeupdate', this._onTimeUpdate);
        }

        const avcode = this.playerCore?.getVideoCode?.() || getVideoCodeFromUrl(this.playerCore?.targetVideo) || '';
        const playSec = Math.round(this._activePlayDurationSec);
        const loopManager = this.managers?.loopManager;
        const loopSec = loopManager ? Math.round(loopManager.totalLoopDurationSec || 0) : 0;
        const abCount = loopManager ? (loopManager.tabs?.length || 0) : 0;

        if (avcode && (playSec > 0 || loopSec > 0)) {
            telemetry.recordVideoPlay(avcode, playSec, loopSec, this._replayCount, abCount);
        }

        const sessionSec = this._sessionStartTime ? Math.round((Date.now() - this._sessionStartTime) / 1000) : playSec;
        telemetry.track('player_close', { duration_sec: playSec || sessionSec });

        // 恢复网页浏览器滚动条与滚动监听
        if (this._windowScrollLock) {
            window.removeEventListener('scroll', this._windowScrollLock);
            this._windowScrollLock = null;
        }
        if (this._scrollbarStyle) {
            this._scrollbarStyle.remove();
            this._scrollbarStyle = null;
        }
        
        // 移除播放器激活状态标记
        document.body.classList.remove('tm-player-active');
        document.documentElement.classList.remove('tm-player-active');

        // 恢复原生 window.scrollTo 并复原宿主原有浏览位置
        if (this._originalScrollTo) {
            window.scrollTo = this._originalScrollTo;
            if (typeof this._originScrollY === 'number') {
                this._originalScrollTo.call(window, this._originScrollX || 0, this._originScrollY);
            }
            this._originalScrollTo = null;
        }

        // 调用PlayerCore的close方法
        if (this._sessionVideoKey) {
            this.playerCore?.markTheaterEntered?.(this._sessionVideoKey, this.callingButton);
        }
        this.playerCore?.cancelInitialSeekGuard?.();
        this.playerCore.close(
            this.managers.uiManager.overlay, 
            this.managers.uiManager.container,
            this.managers.uiManager.playerContainer,
            this.managers.uiManager.rootHost
        );
        
        // 清理事件监听器
        if (this.managers.eventManager) {
            this.managers.eventManager.cleanup();
        }
        
        // 清理SwipeManager
        if (this.swipeManager) {
            this.swipeManager.destroy();
            this.swipeManager = null;
        }
        
        // 清理所有管理器
        for (const key in this.managers) {
            if (this.managers[key] && typeof this.managers[key].cleanup === 'function') {
                this.managers[key].cleanup();
            }
            this.managers[key] = null;
        }

        // 重新恢复浮动唤醒按钮显示并更新位置与模态层挂载
        if (this.callingButton) {
            this.callingButton.classList.remove('is-hidden');
            this.callingButton.style.display = 'flex';
            if (this.callingButton._floatingButtonInstance) {
                this.callingButton._floatingButtonInstance.ensureTopLayerMount();
                this.callingButton._floatingButtonInstance.updateButtonPosition();
            }
        }
        
        // 重置状态
        this.initialized = false;
        this.managers = {};
        this.playerCore = null;
    }
}
