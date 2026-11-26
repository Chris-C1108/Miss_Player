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
    querySelectorAll(selector = '') {
        const out = [];
        const walk = (node) => {
            for (const child of node.children || []) {
                if (selector === '[data-lang]' && child.dataset?.lang !== undefined) out.push(child);
                else if (selector === '[data-size]' && child.dataset?.size !== undefined) out.push(child);
                walk(child);
            }
        };
        walk(this);
        return out;
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

    globalThis.document = {
        createElement: (tag) => new FakeElement(tag),
        body: new FakeElement('body'),
        head: new FakeElement('head'),
        querySelector: () => null
    };
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
    const {
        SubtitleManager,
        normalizeSubtitleLang,
        resolvePreferredSubtitleLang,
        rankPreferredCandidates,
        collectAmbiguousFallbackCandidates,
        selectBestBundleItem
    } = await import('../src/player/subtitles/SubtitleManager.js');
    const {
        guessOriginLang,
        resolveStaticSubtitleAnchorLang,
        resolveSubtitleCatDetailHtml
    } = await import('../src/player/subtitles/providers/SubtitleCatProvider.js');
    const { langLabelOf } = await import('../src/player/subtitles/providers/XunleiSubtitleProvider.js');
    const { SubtitleEngine, inferCandidateTargetLang } = await import('../src/player/subtitles/SubtitleEngine.js');
    const { SubtitleRepository } = await import('../src/player/subtitles/SubtitleRepository.js');

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

    await t.test('9. 偏好语言归一化、解析与最优筛选排序', () => {
        assert.equal(normalizeSubtitleLang('zh-CN'), 'zh');
        assert.equal(normalizeSubtitleLang('zh_Hans'), 'zh');
        assert.equal(normalizeSubtitleLang('zh-Hant'), 'zh-TW');
        assert.equal(normalizeSubtitleLang('ja-JP'), 'ja');
        assert.equal(normalizeSubtitleLang('ko_KR'), 'ko');

        assert.equal(resolvePreferredSubtitleLang('auto', 'zh-CN'), 'zh');
        assert.equal(resolvePreferredSubtitleLang('auto', 'zh-TW'), 'zh-TW');
        assert.equal(resolvePreferredSubtitleLang('ja', 'zh-CN'), 'ja');

        const ranked = rankPreferredCandidates(
            [
                { id: '1', lang: 'en', rating: 99 },
                { id: '2', lang: 'ja', rating: 70 },
                { id: '3', lang: 'ja-JP', rating: 92 },
                { id: '4', lang: 'zh', rating: 88 }
            ],
            'ja'
        );
        assert.deepEqual(
            ranked.map((c) => c.id),
            ['3', '2']
        );
    });

    await t.test('10. 字幕抽屉调节面板设置与自动优选加载收藏', async () => {
        const savedPayloads = [];
        env.settings.betaMode = true;
        env.settings.subtitleEnabled = true;
        env.settings.subtitleAutoBest = false;
        env.settings.subtitlePreferredLang = 'auto';

        const manager = new SubtitleManager(env.playerCore, env.uiManager, null);
        manager.avcode = 'IPX-343';
        manager._persist = async (opts) => {
            savedPayloads.push({
                favoriteId: manager.bundle.favoriteId,
                items: manager.bundle.items.slice(),
                opts
            });
        };
        manager._ensurePanel();

        // 验证调节面板包含自动选优开关与偏好语言按钮组
        assert.ok(manager.autoBestSwitchEl, '应渲染自动选优开关');
        assert.ok(manager.langGroupEl, '应渲染偏好语言选择器');
        const langBtns = manager.langGroupEl.querySelectorAll('[data-lang]');
        assert.equal(langBtns.length, 6);
        assert.equal(langBtns[0].classList.contains('is-active'), true, '默认选中 auto');

        // 切换到日语偏好并模拟在线检索（最高分英文、最高分日文损坏、次高分日文有效）
        manager._applyPreferredLang('ja');
        assert.equal(env.settings.subtitlePreferredLang, 'ja');
        assert.equal(langBtns.find((b) => b.dataset.lang === 'ja').classList.contains('is-active'), true);

        const downloaded = [];
        manager.engine = {
            async search(code) {
                assert.equal(code, 'IPX-343');
                return {
                    candidates: [
                        { id: 'en-top', provider: 'xunlei', title: 'IPX-343 EN', lang: 'en', rating: 98, format: 'srt' },
                        { id: 'ja-bad', provider: 'xunlei', title: 'IPX-343 JA BAD', lang: 'ja', rating: 95, format: 'srt' },
                        { id: 'ja-good', provider: 'subtitlecat', title: 'IPX-343 JA GOOD', lang: 'ja', rating: 80, format: 'srt' }
                    ],
                    errors: []
                };
            },
            async download(candidate) {
                downloaded.push(candidate.id);
                if (candidate.id === 'ja-bad') throw new Error('network error');
                return {
                    content: SRT,
                    format: 'srt'
                };
            }
        };

        manager._toggleAutoBest();
        assert.equal(env.settings.subtitleAutoBest, true);
        assert.equal(manager.autoBestSwitchEl.classList.contains('is-checked'), true);
        await manager._autoPickPromise;

        assert.deepEqual(downloaded, ['ja-bad', 'ja-good'], '只应下载匹配日语的候选并在失败时回落次优');
        assert.equal(manager.bundle.favoriteId, 'ja-good', '应自动收藏首个可用的最优匹配字幕');
        assert.equal(manager.bundle.items[0].favorite, true);
        assert.equal(manager.activeItem?.id, 'ja-good', '开启显示字幕时应同步加载渲染');
        assert.equal(savedPayloads.length, 1, '应持久化并触发增量同步');

        // 已有收藏字幕时不再重复抓取覆盖
        let secondSearchCalled = false;
        manager.engine.search = async () => {
            secondSearchCalled = true;
            return { candidates: [], errors: [] };
        };
        const skipped = await manager._maybeAutoPickPreferred();
        assert.equal(skipped, false);
        assert.equal(secondSearchCalled, false);
    });

    await t.test('11. 手动收藏优先级严格高于自动收藏（本地选中、列表排序与跨端合并）', async () => {
        const autoItem = {
            id: 'auto-1',
            provider: 'xunlei',
            title: 'IPX-343 Auto',
            lang: 'zh',
            rating: 99,
            format: 'srt',
            content: SRT,
            favorite: true,
            autoSaved: true,
            favoriteSource: 'auto',
            addedAt: 100
        };
        const manualItem = {
            id: 'manual-1',
            provider: 'subtitlecat',
            title: 'IPX-343 Manual',
            lang: 'zh',
            rating: 65,
            format: 'srt',
            content: SRT,
            favorite: true,
            autoSaved: false,
            favoriteSource: 'manual',
            addedAt: 200
        };

        // 即便 bundle.favoriteId 仍指向 autoItem 且 autoItem 评分更高，selectBestBundleItem 也必须优先 manualItem
        const chosen = selectBestBundleItem({
            favoriteId: 'auto-1',
            items: [autoItem, manualItem]
        });
        assert.equal(chosen?.id, 'manual-1', '手动收藏应严格优先于自动收藏');

        // 列表渲染排序：手动收藏排在自动收藏之前
        const manager = new SubtitleManager(env.playerCore, env.uiManager, null);
        manager.avcode = 'IPX-343';
        manager._persist = async () => {};
        manager.bundle = {
            code: 'IPX-343',
            favoriteId: 'auto-1',
            activeId: 'auto-1',
            items: [{ ...autoItem }]
        };
        await manager._applyItem(manager.bundle.items[0], { silent: true });
        assert.equal(manager.activeItem?.id, 'auto-1');

        // 用户手动收藏另一个候选，应标记 manual 并立即接管当前展示且排在首位
        const manualCandidate = {
            id: 'manual-2',
            provider: 'subtitlecat',
            title: 'IPX-343 Manual Pick',
            lang: 'zh',
            rating: 60,
            format: 'srt'
        };
        manager.onlineResults = [manualCandidate];
        manager.engine = {
            async download() {
                return { content: SRT, format: 'srt' };
            }
        };
        await manager._toggleFavorite(manualCandidate);
        assert.equal(manager.bundle.favoriteId, 'manual-2');
        assert.equal(manager.bundle.items[0].autoSaved, false);
        assert.equal(manager.bundle.items[0].favoriteSource, 'manual');
        assert.equal(manager.activeItem?.id, 'manual-2', '手动收藏应接管原本由自动收藏激活的字幕');
        assert.deepEqual(
            manager._visibleRows().map((r) => r.id),
            ['manual-2', 'auto-1'],
            '手动收藏在列表中应始终置顶高于自动收藏'
        );

        // 跨端合并：远端手动收藏必须胜过本地自动收藏（包括 favoriteId）
        const merged = SubtitleRepository._merge(
            {
                code: 'IPX-343',
                favoriteId: 'auto-1',
                items: [{ ...autoItem, addedAt: 500 }]
            },
            {
                code: 'IPX-343',
                favoriteId: 'manual-1',
                items: [{ ...manualItem, addedAt: 200 }]
            }
        );
        assert.equal(merged.bundle.favoriteId, 'manual-1', 'WebDAV 合并时远端手动收藏应覆盖本地自动收藏');

        // 同条 ID 在一端为手动、另一端为自动时，合并后保持手动属性
        const mergedSameId = SubtitleRepository._merge(
            {
                code: 'IPX-343',
                favoriteId: 'item-1',
                items: [{ ...manualItem, id: 'item-1', addedAt: 100 }]
            },
            {
                code: 'IPX-343',
                favoriteId: 'item-1',
                items: [{ ...autoItem, id: 'item-1', addedAt: 999 }]
            }
        );
        assert.equal(mergedSameId.bundle.items[0].autoSaved, false);
        assert.equal(mergedSameId.bundle.items[0].favoriteSource, 'manual');
    });

    await t.test('12. 简繁中文互为备选与格式保真繁简转换（设置简中命中繁中->转简，反之亦然）', async () => {
        const {
            convertChineseText,
            convertSubtitleContent,
            detectChineseScript
        } = await import('../src/player/subtitles/SubtitleChineseConverter.js');

        // 12a. 词组消歧与双向转换准确性
        assert.equal(
            convertChineseText('为什么头发和眼睛里面都有发现，以后还要去台湾', 'zh-TW'),
            '為什麼頭髮和眼睛裡面都有發現，以後還要去台灣'
        );
        assert.equal(
            convertChineseText('為什麼頭髮和眼睛裡面都有發現，以後還要去台灣，他非常著名並看著我們', 'zh'),
            '为什么头发和眼睛里面都有发现，以后还要去台湾，他非常著名并看着我们'
        );
        assert.equal(detectChineseScript('這是一段繁體中文字幕，請開始播放影片'), 'zh-TW');
        assert.equal(detectChineseScript('这是一段简体中文字幕，请开始播放视频'), 'zh');

        // 12b. ASS / SRT 保真转换：不改写时间戳、样式区与 {\pos(...)} 标签
        const assRaw = [
            '[Script Info]',
            'Title: 影片字幕',
            '',
            '[Events]',
            'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
            'Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,{\\pos(320,240)}請開始檢查這段話，別發呆\\N第二行裡面也有發現',
            ''
        ].join('\n');
        const convAss = convertSubtitleContent(assRaw, 'ass', 'zh');
        assert.equal(convAss.converted, true);
        assert.ok(convAss.content.includes('Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,{\\pos(320,240)}请开始检查这段话，别发呆\\N第二行里面也有发现'));

        // 12c. 候选排序：严格优先当前设置变体，缺失时以简/繁互为备选
        const rankedForZh = rankPreferredCandidates(
            [
                { id: 'en-1', lang: 'en', rating: 99 },
                { id: 'tw-high', lang: 'zh-TW', rating: 95 },
                { id: 'zh-low', lang: 'zh', rating: 70 },
                { id: 'tw-low', lang: 'zh-TW', rating: 60 }
            ],
            'zh'
        );
        assert.deepEqual(
            rankedForZh.map((c) => c.id),
            ['zh-low', 'tw-high', 'tw-low'],
            '设简中时，简中应排在最前，繁中紧随其后作为备选'
        );

        const rankedForTwFallbackOnly = rankPreferredCandidates(
            [
                { id: 'ja-1', lang: 'ja', rating: 99 },
                { id: 'zh-1', lang: 'zh', rating: 82 },
                { id: 'zh-2', lang: 'zh', rating: 90 }
            ],
            'zh-TW'
        );
        assert.deepEqual(
            rankedForTwFallbackOnly.map((c) => c.id),
            ['zh-2', 'zh-1'],
            '设繁中且仅有简中时，按评分降序备选简中'
        );

        // 12d. 端到端自动选优：设简体但仅搜到繁体 -> 选繁体并繁转简；设繁体但仅搜到简体 -> 选简体并简转繁
        const tradSrt = [
            '1',
            '00:00:01,000 --> 00:00:04,000',
            '請開始檢查這段話，頭髮裡面有發現',
            ''
        ].join('\n');
        const simpSrt = [
            '1',
            '00:00:01,000 --> 00:00:04,000',
            '请开始检查这段话，头发里面有发现',
            ''
        ].join('\n');

        // 场景 A：用户设简中，影片仅有繁中
        env.settings.betaMode = true;
        env.settings.subtitleEnabled = true;
        env.settings.subtitleAutoBest = true;
        env.settings.subtitlePreferredLang = 'zh';
        const managerA = new SubtitleManager(env.playerCore, env.uiManager, null);
        managerA.avcode = 'IPX-555';
        managerA._persist = async () => {};
        managerA.engine = {
            async search() {
                return {
                    candidates: [
                        { id: 'en-only', provider: 'xunlei', title: 'IPX-555 EN', lang: 'en', rating: 98, format: 'srt' },
                        { id: 'tw-only', provider: 'xunlei', title: 'IPX-555 繁體', lang: 'zh-TW', rating: 88, format: 'srt' }
                    ],
                    errors: []
                };
            },
            async download() {
                return { content: tradSrt, format: 'srt' };
            }
        };
        const okA = await managerA._maybeAutoPickPreferred({ userAction: true });
        assert.equal(okA, true);
        assert.equal(managerA.bundle.favoriteId, 'tw-only');
        assert.equal(managerA.activeItem?.lang, 'zh');
        assert.equal(managerA.activeItem?.convertedFrom, 'zh-TW');
        assert.equal(managerA.cues[0].text, '请开始检查这段话，头发里面有发现');

        // 场景 B：用户设繁中，影片仅有简中
        env.settings.subtitlePreferredLang = 'zh-TW';
        const managerB = new SubtitleManager(env.playerCore, env.uiManager, null);
        managerB.avcode = 'IPX-556';
        managerB._persist = async () => {};
        managerB.engine = {
            async search() {
                return {
                    candidates: [
                        { id: 'ja-only', provider: 'xunlei', title: 'IPX-556 JA', lang: 'ja', rating: 96, format: 'srt' },
                        { id: 'zh-only', provider: 'xunlei', title: 'IPX-556 简体', lang: 'zh', rating: 86, format: 'srt' }
                    ],
                    errors: []
                };
            },
            async download() {
                return { content: simpSrt, format: 'srt' };
            }
        };
        const okB = await managerB._maybeAutoPickPreferred({ userAction: true });
        assert.equal(okB, true);
        assert.equal(managerB.bundle.favoriteId, 'zh-only');
        assert.equal(managerB.activeItem?.lang, 'zh-TW');
        assert.equal(managerB.activeItem?.convertedFrom, 'zh');
        assert.equal(managerB.cues[0].text, '請開始檢查這段話，頭髮裡面有發現');
    });

    await t.test('13. FOCS-264 等 SubtitleCat/迅雷语种误标修复、二跳机翻降权与模糊探测救援', async () => {
        // 13a. originLang 与静态下载目标语言解耦
        assert.equal(guessOriginLang('FOCS-264.ja.whisperjav (translated from Japanese)').code, 'ja');
        assert.equal(guessOriginLang('FOCS-264-RM.en (translated from English)').code, 'en');
        assert.equal(resolveStaticSubtitleAnchorLang('download_zh-CN', '/subs/1372/FOCS-264.ja.whisperjav-zh-CN.srt').code, 'zh');
        assert.equal(resolveStaticSubtitleAnchorLang('download_zh-TW', '/subs/1522/FOCS-264.ja.whisperjav-zh-TW.srt').code, 'zh-TW');

        // 13b. Mock DOMParser 验证 FOCS-264 SubtitleCat 详情页拆出 zh-CN 与 zh-TW 且保留 originLang
        const prevDomParser = globalThis.DOMParser;
        globalThis.DOMParser = class {
            parseFromString(html) {
                const links = [];
                for (const m of String(html).matchAll(/<a[^>]*id="(download_zh[^"]*)"[^>]*href="([^"]+)"[^>]*>/gi)) {
                    links.push({
                        getAttribute: (k) => (k === 'id' ? m[1] : k === 'href' ? m[2] : '')
                    });
                }
                return {
                    querySelectorAll(sel) {
                        if (sel.includes('download_zh-CN')) return links;
                        return [];
                    }
                };
            }
        };
        try {
            const jaOriginDetail = resolveSubtitleCatDetailHtml(
                {
                    detailUrl: 'https://www.subtitlecat.com/subs/1305/FOCS-264.ja.whisperjav.html',
                    title: 'FOCS-264.ja.whisperjav',
                    rowText: 'FOCS-264.ja.whisperjav (translated from Japanese) 10 downloads',
                    downloads: 10
                },
                `<a id="download_zh-CN" href="/subs/1372/FOCS-264.ja.whisperjav-zh-CN.srt"></a>
                 <a id="download_zh-TW" href="/subs/1522/FOCS-264.ja.whisperjav-zh-TW.srt"></a>`
            );
            assert.equal(jaOriginDetail.length, 2);
            assert.equal(jaOriginDetail[0].lang, 'zh');
            assert.equal(jaOriginDetail[0].originLang, 'ja');
            assert.equal(jaOriginDetail[0].machineTranslated, true);
            assert.equal(jaOriginDetail[1].lang, 'zh-TW');

            const enOriginDetail = resolveSubtitleCatDetailHtml(
                {
                    detailUrl: 'https://www.subtitlecat.com/subs/1161/FOCS-264-RM.en.html',
                    title: 'FOCS-264-RM.en',
                    rowText: 'FOCS-264-RM.en (translated from English) 13 downloads',
                    downloads: 13
                },
                `<a id="download_zh-CN" href="/subs/1171/FOCS-264-RM.en-zh-CN.srt"></a>`
            );
            assert.equal(enOriginDetail.length, 1);
            assert.equal(enOriginDetail[0].lang, 'zh');
            assert.equal(enOriginDetail[0].originLang, 'en');

            // 13c. SubtitleEngine._rank 对二跳英转中显著降权，日转中直译胜出，并纠正误标链接
            const engine = new SubtitleEngine();
            const rankedFocs = engine._rank([
                ...enOriginDetail,
                ...jaOriginDetail,
                {
                    id: 'sc:mislabeled',
                    provider: 'subtitlecat',
                    providerLabel: 'SubtitleCat',
                    title: 'FOCS-264 (translated from Japanese)',
                    lang: 'ja',
                    langLabel: '日语',
                    format: 'srt',
                    downloadUrl: 'https://www.subtitlecat.com/subs/1158/FOCS-264-zh-CN.srt',
                    originLang: 'ja',
                    machineTranslated: true,
                    baseScore: 78
                }
            ], 'FOCS-264');
            assert.equal(inferCandidateTargetLang({ downloadUrl: 'https://www.subtitlecat.com/subs/1158/FOCS-264-zh-CN.srt', lang: 'ja' }), 'zh');
            assert.equal(rankedFocs[0].originLang, 'ja');
            assert.equal(rankedFocs[0].lang, 'zh');
            assert.ok(rankedFocs[0].rating > rankedFocs.find((c) => c.originLang === 'en').rating);
        } finally {
            globalThis.DOMParser = prevDomParser;
        }

        // 13d. 迅雷适配器上传者昵称含 "en"/"jp" 子串时不污染中文语种判定
        assert.equal(langLabelOf({ simple_name: 'FOCS-264.srt', extra_name: 'Stephen_JpFansub' }).code, 'zh');
        assert.equal(langLabelOf({ simple_name: 'FOCS-264.en.srt', languages: ['English'] }).code, 'en');

        // 13e. 当上游候选误标为 ja 但直链/标题含线索时，自动选优兜底探测实际正文后成功救援
        const rescueCandidates = collectAmbiguousFallbackCandidates(
            [
                { id: 'c1', provider: 'subtitlecat', title: 'FOCS-264 whisper', lang: 'ja', rating: 82, downloadUrl: 'https://www.subtitlecat.com/subs/1158/FOCS-264-zh-CN.srt' }
            ],
            'zh'
        );
        assert.equal(rescueCandidates.length, 1);

        env.settings.subtitlePreferredLang = 'zh';
        env.settings.subtitleAutoBest = true;
        env.settings.betaMode = true;
        const managerRescue = new SubtitleManager(env.playerCore, env.uiManager, null);
        managerRescue.avcode = 'FOCS-264';
        managerRescue._persist = async () => {};
        const sampleZhSrt = [
            '1',
            '00:00:01,000 --> 00:00:04,000',
            '与奶奶共度时光，妈妈正在午睡。',
            ''
        ].join('\n');
        managerRescue.engine = {
            async search() {
                return {
                    candidates: [
                        { id: 'mis-ja', provider: 'subtitlecat', title: 'FOCS-264 (translated from Japanese)', lang: 'ja', rating: 80, format: 'srt', downloadUrl: 'https://www.subtitlecat.com/subs/1158/FOCS-264-zh-CN.srt' }
                    ],
                    errors: []
                };
            },
            async download() {
                return { content: sampleZhSrt, format: 'srt' };
            }
        };
        const rescued = await managerRescue._maybeAutoPickPreferred({ userAction: true });
        assert.equal(rescued, true);
        assert.equal(managerRescue.bundle.favoriteId, 'mis-ja');
        assert.equal(managerRescue.activeItem?.lang, 'zh');
    });
});
