import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * 字幕渲染路径集成测试（零依赖 DOM 探针）
 * 目的：锁定「字幕层是否正确挂载到播放器顶层容器 + 是否按时间轴输出文本」这条链路，
 * 防止出现「面板可用但画面无字幕」的静默失效。
 */

class FakeClassList {
    constructor() {
        this.set = new Set();
    }
    add(...names) {
        names.forEach((n) => this.set.add(n));
    }
    remove(...names) {
        names.forEach((n) => this.set.delete(n));
    }
    toggle(name, force) {
        const next = force === undefined ? !this.set.has(name) : Boolean(force);
        if (next) this.set.add(name);
        else this.set.delete(name);
        return next;
    }
    contains(name) {
        return this.set.has(name);
    }
}

class FakeElement {
    constructor(tag = 'div') {
        this.tagName = String(tag).toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.classList = new FakeClassList();
        this.style = {};
        this.dataset = {};
        this.attributes = {};
        this.textContent = '';
        this.innerHTML = '';
        this.isConnected = true;
        this._listeners = {};
    }
    set className(value) {
        this._className = value;
        this.classList = new FakeClassList();
        String(value || '').split(/\s+/).filter(Boolean).forEach((n) => this.classList.add(n));
    }
    get className() {
        return this._className || '';
    }
    appendChild(el) {
        el.parentNode = this;
        this.children.push(el);
        return el;
    }
    append(...els) {
        els.forEach((el) => this.appendChild(el));
    }
    insertBefore(el, ref) {
        el.parentNode = this;
        const idx = ref ? this.children.indexOf(ref) : -1;
        if (idx >= 0) this.children.splice(idx, 0, el);
        else this.children.push(el);
        return el;
    }
    replaceChildren(...els) {
        this.children = [];
        els.forEach((el) => this.appendChild(el));
    }
    removeChild(el) {
        this.children = this.children.filter((c) => c !== el);
        el.parentNode = null;
    }
    remove() {
        if (this.parentNode) this.parentNode.removeChild(this);
        this.isConnected = false;
    }
    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }
    getAttribute(name) {
        return this.attributes[name];
    }
    addEventListener(type, fn) {
        (this._listeners[type] = this._listeners[type] || []).push(fn);
    }
    removeEventListener(type, fn) {
        this._listeners[type] = (this._listeners[type] || []).filter((f) => f !== fn);
    }
    querySelectorAll() {
        return [];
    }
    querySelector() {
        return null;
    }
    getBoundingClientRect() {
        return { left: 0, top: 0, width: 720, height: 405, right: 720, bottom: 405 };
    }
}

const SRT = ['1', '00:00:01,000 --> 00:00:04,000', '第一句字幕', '', '2', '00:00:06,000 --> 00:00:09,000', '第二句字幕', ''].join('\n');

function setupGlobals() {
    const video = new FakeElement('video');
    video.currentTime = 2;
    video.paused = true;
    video.videoWidth = 1920;
    video.videoHeight = 1080;
    video.getBoundingClientRect = () => ({ left: 0, top: 0, width: 720, height: 405, right: 720, bottom: 405 });

    globalThis.document = { createElement: (tag) => new FakeElement(tag) };
    globalThis.window = {
        addEventListener() {},
        removeEventListener() {},
        location: { hostname: 'missav.ws', href: 'https://missav.ws/en/test-001' }
    };
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
    globalThis.ResizeObserver = undefined;

    const playerContainer = new FakeElement('div');
    const videoWrapper = new FakeElement('div');
    videoWrapper.appendChild(video);
    playerContainer.appendChild(videoWrapper);

    const settings = { subtitleEnabled: true, subtitleFontSize: 'medium', betaMode: false };
    const playerState = {
        settings,
        updateSetting(key, value) {
            settings[key] = value;
        }
    };

    const playerCore = {
        targetVideo: video,
        options: { videoCode: 'TEST-001', playerState }
    };

    const uiManager = {
        playerContainer,
        videoWrapper,
        topActionsContainer: new FakeElement('div'),
        settingsBtn: new FakeElement('button'),
        surfaceMachine: { activate() {}, deactivate() {} }
    };

    return { video, playerContainer, uiManager, playerCore, settings };
}

test('SubtitleRender 字幕挂载与时间轴渲染', async (t) => {
    const env = setupGlobals();
    const { SubtitleManager } = await import('../src/player/subtitles/SubtitleManager.js');

    await t.test('1. 字幕层挂载在播放器顶层容器而非视频内部', async () => {
        const manager = new SubtitleManager(env.playerCore, env.uiManager, null);
        manager.avcode = 'TEST-001';
        manager._ensureOverlay();

        const layer = manager.overlayLayer;
        assert.ok(layer, '字幕层应被创建');
        assert.equal(layer.parentNode, env.playerContainer, '字幕层应挂载到 playerContainer 顶层');
        assert.ok(layer.classList.contains('is-empty'), '初始应为空态');

        const applyItem = async (item) => {
            manager.bundle.items = [item];
            await manager._applyItem(item, { silent: true });
        };

        const item = {
            id: 'test:1',
            provider: 'local',
            providerLabel: '本地',
            title: 'TEST-001 中文字幕',
            lang: 'zh',
            langLabel: '中文',
            format: 'srt',
            content: SRT,
            addedAt: Date.now(),
            rating: 95
        };
        await applyItem(item);

        assert.equal(manager.cues.length, 2, '应解析出 2 条 cue');
        assert.equal(manager.bundle.activeId, item.id, '应记录活动字幕轨');
        assert.equal(env.settings.subtitleEnabled, true, '应用字幕应自动开启显示开关');

        t.test('2. 按时间轴输出正确文本', () => {
            manager.renderAt(2);
            assert.equal(manager.overlayText.textContent, '第一句字幕');
            assert.equal(manager.overlayLayer.classList.contains('is-empty'), false, '有文本时应移除空态');

            manager.renderAt(7);
            assert.equal(manager.overlayText.textContent, '第二句字幕');

            manager.renderAt(20);
            assert.equal(manager.overlayText.textContent, '', '空白区间应清空');
            assert.equal(manager.overlayLayer.classList.contains('is-empty'), true);
        });

        t.test('3. 关闭总开关后不再渲染文本', () => {
            manager.renderAt(2);
            assert.equal(manager.overlayText.textContent, '第一句字幕');
            manager._setEnabled(false);
            manager.renderAt(2);
            assert.equal(manager.overlayText.textContent, '', '关闭开关后不应有字幕');
        });

        t.test('4. 时间轴偏移仅作用于当前字幕', () => {
            manager._setEnabled(true);
            manager.renderAt(2);
            assert.equal(manager.overlayText.textContent, '第一句字幕');

            manager._applyTimelineOffset(1.0);   // 字幕整体延后 1 秒
            manager.renderAt(1);
            assert.equal(manager.overlayText.textContent, '', '延后 1 秒后 1s 处应无字幕');
            manager.renderAt(2);
            assert.equal(manager.overlayText.textContent, '第一句字幕', '2s 处应显示原 1s 的 cue');
            assert.equal(manager.activeItem.timeOffsetMs, 1000);

            manager._applyTimelineOffset(0);
            manager.renderAt(1.2);
            assert.equal(manager.overlayText.textContent, '第一句字幕', '复位后恢复原有时间轴');
        });

        t.test('5. 上下偏移按画面高度百分比上移', () => {
            env.settings.subtitleVerticalOffset = 10;
            manager._syncOverlayGeometry();
            assert.equal(manager.overlayText.style.transform, 'translateY(-41px)');

            env.settings.subtitleVerticalOffset = 0;
            manager._applyVerticalOffset();
            assert.equal(manager.overlayText.style.transform, '');
        });

        t.test('6. 歌词时间轴：渲染全量行并支持点击跳转', () => {
            manager._ensurePanel();
            manager._setEnabled(true);
            manager._renderLyrics();
            manager.lyricsView.classList.remove('is-hidden');
            assert.equal(manager.lyricsRows.length, 2, '应按 cue 数量渲染歌词行');

            manager._seekToCue(1);
            assert.equal(env.video.currentTime, 6.02, '点击第 2 行应跳到 6.0s（含 20ms 缓冲）');

            manager._syncLyricHighlight({ force: true });
            assert.equal(manager.lyricsRows[1].classList.contains('is-current'), true, '当前行应高亮');
            assert.equal(
                manager.lyricsRows[1].children[2].classList.contains('is-visible'),
                true,
                '跳转过的行应出现「已跳转」标记'
            );
            assert.equal(
                manager.lyricsRows[0].children[2].classList.contains('is-visible'),
                false,
                '未跳转的行不应出现标记'
            );

            // 静音区间必须清掉活动行底色，避免「跳过的行长期留色」
            env.video.currentTime = 20;
            manager.renderAt(20);
            assert.equal(manager.lyricsRows[1].classList.contains('is-current'), false, '无字幕区间应清除高亮');
        });

        t.test('7. 静音间隙锚点：始终能定位到最近的字幕行', () => {
            manager._setEnabled(true);
            manager._lyricsFollow = true;

            env.video.currentTime = 20; // 最后一条 cue 之后
            manager._syncLyricHighlight({ force: true });
            assert.equal(manager._anchorIndex, 1, '间隙内应锚定最近的上一行');
            assert.equal(manager.lyricsRows[1].classList.contains('is-current'), false, '间隙内不应点亮活动态');

            env.video.currentTime = 4.6; // 两句之间，更靠近第 1 行
            manager._syncLyricHighlight({ force: true });
            assert.equal(manager._anchorIndex, 0, '应选择距离更近的前一行');

            env.video.currentTime = 5.6; // 更靠近第 2 行
            manager._syncLyricHighlight({ force: true });
            assert.equal(manager._anchorIndex, 1, '应选择距离更近的后一行');
        });

        t.test('8. 几何对齐：按 object-fit contain 求画面矩形', () => {
            manager._setEnabled(true);
            manager._syncOverlayGeometry();
            // 720x405 容器 + 16:9 视频 → 无黑边，尺寸应等于容器
            assert.equal(manager.overlayLayer.style.width, '720px');
            assert.equal(manager.overlayLayer.style.height, '405px');
            assert.equal(manager.overlayLayer.style.left, '0px');
            assert.equal(manager.overlayLayer.style.top, '0px');
        });
    });
});
