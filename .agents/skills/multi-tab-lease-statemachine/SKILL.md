---
name: multi-tab-lease-statemachine
description: 现代 Web 与油猴脚本多标签页并发环境下的跨标签租约状态机、活跃播放自治豁免、零轮询有声租约与离散重入网关设计最佳实践。
triggers:
  - multi-tab-lease
  - 跨标签静音
  - 跨标签状态同步
  - 多标签播放器状态机
  - 默认静音租约
  - 重入网关
---

# 多标签并发跨标签租约状态机规范 (Multi-Tab Lease State Machine & Re-entry Gate)

在多标签页（Multi-tab）并发的真实浏览器环境下，跨标签状态同步（如静音、自动播放、敏感信息遮罩、防打扰租约）与单标签独立操作之间存在天然的人机工程张力（Ergonomic Tension）。本规范提供工业级、零损耗的系统架构解决方案。

---

## 1. 核心人本张力与传统反模式

* **传统反模式 1：侵入式实时广播（Eager Broadcast Clash）**
  - 使用 `BroadcastChannel` 或 `window.onstorage` 监听实时推送；
  - ❌ **致命体验断裂**：用户在 Tab B 嫌吵随手点了个静音或暂停，Tab A 正在全神贯注沉浸播放的长片音频/画面被瞬间强行掐断。
* **传统反模式 2：高频轮询定时器（Heartbeat Timer Anti-Pattern）**
  - 使用 30 秒或更高频的 `setInterval` 定时器不断写入 storage 刷新活跃心跳；
  - ❌ **移动端灾难**：阻止移动端（iOS WebKit / Android）CPU 进入深度睡眠，频繁触发垃圾回收（GC），引发发热与电量雪崩。
* **传统反模式 3：状态孤岛（State Silo）**
  - 各标签页各自为政，状态完全不互通；
  - ❌ **防打扰失效**：用户在某标签明确表达了“当前需要安静”的意图，新开标签页或切回其他标签页时依然公放爆音。

---

## 2. 四大核心设计哲学 (Core Architecture)

### 2.1 活跃播放自治与豁免权 (Active Playback Exemption)
> **物理红线**：任何正在当前可见视窗（Visible Tab）中正常播放的媒体，拥有绝对自治权，**严禁被任何来自外部标签页的异步事件即时切断**。

### 2.2 零轮询有声租约模型 (Audible Lease Pattern with TTL)
彻底弃用后台定时器，将数据维护收敛为**纯事件驱动（Event-Driven）**：
* 仅在**离散生命周期关键断点**落盘时间戳：
  - 开始播放 / 暂停；
  - 标签页切后台（`document.visibilityState === 'hidden'`）；
  - 播放器视窗收起 / 关闭；
  - 页面卸载（`pagehide` / `beforeunload`）。
* **离开状态结算**：
  - 若离开时为有声播放：写入 `lastUnmutedTime = Date.now()`，开启租约倒计时；
  - 若离开时本身即为静音：写入 `lastUnmutedTime = 0`，立即销毁租约，确保下次进入必定静音。

### 2.3 三道离散重入网关 (Discrete Re-entry Gates)
跨标签状态与意图的同步，被严格收敛至以下 3 个**离散重入时刻**惰性触发（Lazy Settlement）：
1. **Gate 1: 标签切回前台（Tab Focus / Visibility Resume）**
   - 触发时刻：`document.visibilityState === 'visible'`；
2. **Gate 2: 播放器视窗从收起态重新呼出（Container Uncollapse / Re-open）**
   - 触发时刻：用户重新唤醒播放器浮层或界面；
3. **Gate 3: 新开标签页冷启动（Cold Launch）**
   - 触发时刻：新标签页加载完毕首次挂载播放器。

### 2.4 双时间戳因果时序与后发意图覆盖 (Later Explicit Intent Supersedes)
在全局共享存储（`GM_setValue` / `localStorage`）中维护标量时钟：
* `lastUnmutedTime`：全网最近一次取消静音/有声播放的时间戳；
* `lastExplicitMuteTime`：全网最近一次被用户**主动点击静音**的时间戳；
* `localAudibleTime`：当前标签页内存中上一次处于有声状态的时间戳。

---

## 3. 确定性决策状态机流程 (Decision Engine)

```
                            ┌────────────────────────────────────────┐
                            │    触发重入网关 (Re-entry Gate)         │
                            │ (切回前台 / 唤醒播放器 / 冷启动初始化)     │
                            └───────────────────┬────────────────────┘
                                                │
                                       是否开启了默认静音策略?
                                                ├─── 否 ───> 保持当前状态 (放行)
                                                │
                                                ▼ 是
                                      全局是否存在 lastUnmutedTime?
                                                ├─── 否 ───> 恢复为静音 (首进安全)
                                                │
                                                ▼ 是
                                全局主动静音是否晚于取消静音?
                           (lastExplicitMuteTime > lastUnmutedTime)
                                                ├─── 是 ───> 恢复为静音 (全局已被覆盖)
                                                │
                                                ▼ 否
                                     全局租约是否已超时?
                                  (now - lastUnmutedTime >= leaseMs)
                                                ├─── 是 ───> 恢复为静音 (超时重置)
                                                │
                                                ▼ 否
                             外部主动静音是否晚于本标签上次有声时刻?
                     (lastExplicitMuteTime > localAudibleTime && localAudibleTime > 0)
                                                ├─── 是 ───> 恢复为静音 (后发意图继承)
                                                │
                                                ▼ 否
                                     保持有声播放 (租约平滑连贯)
```

---

## 4. 工业级通用代码模板 (Production Template)

### 4.1 核心纯函数决策引擎
```javascript
/**
 * 判定重入时是否应该恢复为静音 (纯函数，易于做 100% 覆盖率单元测试)
 * @param {object} settings 用户偏好配置
 * @param {number} localAudibleTime 本标签上一次有声播放的物理时间戳 (毫秒)
 * @param {Function} storageGet 读取持久化存储的函数
 * @returns {boolean} true: 应当恢复静音; false: 应当保持有声
 */
export function checkShouldDefaultMute(settings, localAudibleTime = 0, storageGet = localStorage.getItem.bind(localStorage)) {
    const defaultMuted = settings?.defaultMuted !== undefined ? Boolean(settings.defaultMuted) : true;
    if (!defaultMuted) {
        return false;
    }

    const leaseMinutes = Math.max(1, parseInt(settings?.muteResetMinutes, 10) || 5);
    const lastUnmutedTime = Number(storageGet('lastUnmutedTime')) || 0;
    if (!lastUnmutedTime) {
        return true; // 从未有声播放过或已被主动清空
    }

    const lastExplicitMuteTime = Number(storageGet('lastExplicitMuteTime')) || 0;
    // 规则 1：全局最新动作是主动静音，覆盖先前的取消静音
    if (lastExplicitMuteTime > lastUnmutedTime) {
        return true;
    }

    const now = Date.now();
    // 规则 2：全局租约超时 (TTL Expiry)
    if (now - lastUnmutedTime >= leaseMinutes * 60 * 1000) {
        return true;
    }

    // 规则 3：外部后发主动静音意图继承 (离开期间外部要求安静)
    if (lastExplicitMuteTime > 0 && localAudibleTime > 0 && lastExplicitMuteTime > localAudibleTime) {
        return true;
    }

    // 规则 4：有效租约内连贯有声
    return false;
}
```

### 4.2 控制器生命周期挂载
```javascript
export class MultiTabVolumeController {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.options = options;
        this._localLastAudibleTime = (!this.video.muted && this.video.volume > 0) ? Date.now() : 0;
        this._bindLifecycle();
    }

    recordUnmutedTime() {
        this.options.storageSet('lastUnmutedTime', Date.now());
    }

    /**
     * 退出或切后台时的原子状态结算
     */
    recordExitState() {
        if (!this.options.isFeatureEnabled()) return;

        if (this.video && !this.video.muted && this.video.volume > 0) {
            const now = Date.now();
            this.recordUnmutedTime();
            this._localLastAudibleTime = now;
        } else {
            this.options.storageSet('lastUnmutedTime', 0);
            this._localLastAudibleTime = 0;
        }
    }

    /**
     * 重入网关处理：切回前台或播放器唤醒时触发
     */
    onReentry() {
        if (!this.video || !this.options.isFeatureEnabled()) return;

        const shouldMute = checkShouldDefaultMute(
            this.options.getSettings(),
            this._localLastAudibleTime,
            this.options.storageGet
        );

        if (shouldMute) {
            if (!this.video.muted) {
                this.video.muted = true;
                this.onMuteStateChanged?.(true);
            }
        } else {
            if (!this.video.muted && this.video.volume > 0) {
                this.recordUnmutedTime();
                this._localLastAudibleTime = Date.now();
            }
        }
    }

    /**
     * 用户主动切换静音/取消静音
     */
    toggleMute() {
        if (this.video.muted || this.video.volume === 0) {
            // 手动取消静音
            this.video.muted = false;
            const now = Date.now();
            this.recordUnmutedTime();
            this._localLastAudibleTime = now;
        } else {
            // 手动静音：记录主动意图并销毁租约
            this.video.muted = true;
            const now = Date.now();
            this.options.storageSet('lastExplicitMuteTime', now);
            this.options.storageSet('lastUnmutedTime', 0);
            this._localLastAudibleTime = 0;
        }
    }

    _bindLifecycle() {
        this.video.addEventListener('play', () => {
            if (!this.video.muted && this.video.volume > 0) {
                this.recordUnmutedTime();
                this._localLastAudibleTime = Date.now();
            }
        });

        this.video.addEventListener('pause', () => {
            if (!this.video.muted && this.video.volume > 0) {
                const now = Date.now();
                this.recordUnmutedTime();
                this._localLastAudibleTime = now;
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.recordExitState();
            } else if (document.visibilityState === 'visible') {
                this.onReentry();
            }
        });

        window.addEventListener('pagehide', () => this.recordExitState());
        window.addEventListener('beforeunload', () => this.recordExitState());
    }
}
```

---

## 5. 成对避坑禁令清单 (Strict Anti-Patterns)

* `FORBIDDEN: 使用 setInterval/setTimeout 轮询心跳刷新持久化存储 -> USE: 纯事件驱动有声租约模型 (Audible Lease Pattern)，仅在播放、暂停、切后台与退出断点落盘`。
* `FORBIDDEN: 使用 BroadcastChannel 或 storage 事件向其他正在播放的标签页强行广播静音 -> USE: 确立活跃播放自治豁免权 (Active Playback Exemption)，意图同步且只能在重入网关 (Re-entry Gates) 惰性结算`。
* `FORBIDDEN: 用单一布尔值或单一时间戳表征多标签音频状态 -> USE: 双时间戳账本 (lastUnmutedTime + lastExplicitMuteTime) 进行后发意图因果判定`。
* `FORBIDDEN: 在用户交互解冻 (unmuteOnInteract) 时粗暴无条件取消静音 -> USE: 统一接入 checkShouldDefaultMute(settings, localTime) 综合决策`。
