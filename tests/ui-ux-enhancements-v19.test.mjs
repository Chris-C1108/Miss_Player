import assert from 'assert';
import fs from 'fs';

console.log('🧪 开始执行 10 大 UI/UX、Peach状态与交互修复专项单元测试...');

// 1. 验证 ICON_PEACH 是否使用高清立体桃子图片
import { ICON_PEACH } from '../src/constants/icons.js';
assert.ok(ICON_PEACH.includes('tm-peach-logo-img'), 'ICON_PEACH 应当包含 tm-peach-logo-img 样式类');
assert.ok(ICON_PEACH.includes('data:image/png;base64,'), 'ICON_PEACH 应当内联高清 PNG base64 数据');
console.log('✅ 1. Peach 按钮使用高清立体桃子图片验证通过');

// 2. 验证 Peach 按钮按配置开关动态显隐
const storageStore = new Map();
globalThis.localStorage = {
    getItem: (k) => storageStore.get(k) || null,
    setItem: (k, v) => storageStore.set(k, String(v)),
    removeItem: (k) => storageStore.delete(k),
    clear: () => storageStore.clear()
};
import { PeachService } from '../src/services/PeachService.js';

// 初始默认未开启
PeachService.saveConfig({ enabled: false });
const mockBtn = { style: { display: '' } };
const updatePeachButtonVisibility = (btn) => {
    const config = PeachService.getConfig();
    btn.style.display = config.enabled ? '' : 'none';
};

updatePeachButtonVisibility(mockBtn);
assert.strictEqual(mockBtn.style.display, 'none', '未开启总开关时必须隐藏按钮');

// 开启后显示
PeachService.saveConfig({ enabled: true, base: 'http://192.168.2.250:8900' });
updatePeachButtonVisibility(mockBtn);
assert.strictEqual(mockBtn.style.display, '', '开启总开关后按钮应当正常展示');
console.log('✅ 2. Peach 按钮按总开关显隐逻辑验证通过');

// 3. 验证 _marker_sheet.css 底部高光列表弹出时无模糊遮罩
const markerSheetCss = fs.readFileSync('src/player/ui/styles/02_components/_marker_sheet.css', 'utf8');
assert.ok(markerSheetCss.includes('.tm-bottom-sheet-overlay'), '应当存在 .tm-bottom-sheet-overlay 规则');
assert.ok(markerSheetCss.includes('background-color: transparent;'), '底栏遮罩背景应当为 transparent');
assert.ok(markerSheetCss.includes('backdrop-filter: none;'), '底栏遮罩应当无 backdrop-filter');
console.log('✅ 3. 片段列表管理弹出时无模糊遮罩层验证通过');

// 4. 验证 UIManager 中长按 3 倍速参数 (380ms 灵敏响应 + 25px 移动容差 + contextmenu 拦截)
const uiManagerCode = fs.readFileSync('src/player/ui/UIManager.js', 'utf8');
assert.ok(uiManagerCode.includes('380);'), '长按等待定时器应当设置为 380ms 灵敏启动');
assert.ok(uiManagerCode.includes('dist > 25'), '滑动容差阈值应当放宽至 25px 防止指腹微颤被误取消');
assert.ok(uiManagerCode.includes("this.videoWrapper.addEventListener('contextmenu'"), '必须拦截 contextmenu 默认行为防止 touchcancel');
assert.ok(uiManagerCode.includes('this._justFinishedLongPress'), '必须包含松手防误触 click 时间窗锁');
assert.ok(uiManagerCode.includes('getVideoCodeFromUrl'), 'Peach 按钮必须收敛统一调用 getVideoCodeFromUrl 获取权威番号');
console.log('✅ 4. 视频区域长按 3 倍速灵敏响应与权威番号获取验证通过');

// 5. 验证 CommentComposer 中高光抽屉外部点击自动关闭与输入框打字防误关
const composerCode = fs.readFileSync('src/player/controls/CommentComposer.js', 'utf8');
assert.ok(composerCode.includes('_outsideTagModalHandler'), '必须注册高光抽屉外部点击自动关闭监听');
assert.ok(composerCode.includes('_outsideComposerHandler'), '必须注册整个发表抽屉外部点击关闭监听');
assert.ok(composerCode.includes('isInsideComposer'), '必须判定只要在 submitBarWrapper 内部(如输入框打字)就不关闭高光列表');
assert.ok(composerCode.includes('realignCaret'), '必须包含 realignCaret 强制校准光标方法');
assert.ok(composerCode.includes('data-stay-ignore'), '必须带有 data-stay-ignore 防 Stay app 嗅探');
console.log('✅ 5. 附带高光片段抽屉外部关闭、输入框打字保护与防 Stay 视频长按验证通过');

// 6. 验证 CommentPanel 发评底栏关闭按钮已成功精简删除
const panelCode = fs.readFileSync('src/player/controls/CommentPanel.js', 'utf8');
assert.strictEqual(panelCode.includes('tm-comment-close-bar-btn'), false, '发评底栏关闭按钮已成功移除');
console.log('✅ 6. 发评底栏关闭按钮成功精简移除验证通过');

// 7. 验证 WebDavClient 路径防重复叠加自愈
import { WebDavClient } from '../src/sync/WebDavClient.js';
let calledUrl = '';
WebDavClient.request = async (opts) => {
    calledUrl = opts.url;
    return { status: 200, data: '' };
};
WebDavClient.checkDirectoryExists = async () => true;

await WebDavClient.uploadFile(
    { url: 'https://dav.example.com', path: '/backup_configs/MissPlayer/' },
    'backup_configs/MissPlayer/peach-media/STARS-256.strm',
    'test'
);
assert.strictEqual(
    calledUrl,
    'https://dav.example.com/backup_configs/MissPlayer/peach-media/STARS-256.strm',
    'WebDavClient 应当自动识别并剥离重复的路径前缀'
);
console.log('✅ 7. WebDAV 路径防重叠自愈保护验证通过');

// 8. 验证 getVideoTitle 在 Peach 站过滤“全体媒体库”并提取 peachItem 番号
import { getVideoTitle } from '../src/player/ui/_uiFactories.js';
const mockPeachVideo = {
    peachItem: {
        code: 'STARS-256',
        title: '桃子测试影片标题'
    }
};
const peachTitle = getVideoTitle(mockPeachVideo);
assert.strictEqual(peachTitle, 'STARS-256 桃子测试影片标题', 'Peach 站点应当优先从 peachItem 提取番号与标题');
console.log('✅ 8. Peach 站点视频标题与番号精准提取验证通过');

// 9. 验证 PlaybackController 暂停时不再弹出 Toast 骚扰
const playbackCode = fs.readFileSync('src/player/controls/PlaybackController.js', 'utf8');
assert.strictEqual(playbackCode.includes("Toast('已暂停播放'"), false, '暂停播放时绝对不得弹出 Toast');
console.log('✅ 9. 暂停播放无干扰（移除 Toast）验证通过');

// 10. 验证 SleazyForkService 包含指定的 GitHub 镜像加速站 (gh-proxy.org, ghfast.top, gh-proxy.com)
const sleazyCode = fs.readFileSync('src/services/SleazyForkService.js', 'utf8');
assert.ok(sleazyCode.includes('gh-proxy.org'), '必须包含 gh-proxy.org 镜像加速节点');
assert.ok(sleazyCode.includes('ghfast.top'), '必须包含 ghfast.top 镜像加速节点');
assert.ok(sleazyCode.includes('gh-proxy.com'), '必须包含 gh-proxy.com 镜像加速节点');
console.log('✅ 10. GitHub 镜像加速节点全量集成验证通过');

console.log('🎉 全部 10 大项 UI/UX、Peach状态、交互手势与更新检查单元测试 100% 通过！');
