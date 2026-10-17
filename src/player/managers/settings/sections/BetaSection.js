import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { __ } from '../../../../constants/i18n.js';
import { Toast } from '../../../../utils/index.js';
import { CrazyScraper } from '../../../comments/CrazyScraper.js';
import { CommentCacheManager } from "../../../comments/CommentCacheManager.js";
import { DebugLogPanel } from '../../../ui/DebugLogPanel.js';

export class BetaSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _render() {
        this.element.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'tm-settings-group-header';
        header.textContent = __('betaGroupTitle') || '实验特性';
        this.element.appendChild(header);

        const card = new AppleCard();

        const betaSubWrap = document.createElement('div');
        betaSubWrap.className = 'tm-settings-subpanel-wrap';
        betaSubWrap.style.display = Boolean(this.settings.betaMode) ? 'block' : 'none';

        const betaMainToggle = new ToggleRow({
            title: __('betaLabTitle') || '实验功能',
            subtext: __('betaLabDesc') || '探索开发中的新玩法与高级工具',
            checked: Boolean(this.settings.betaMode),
            onChange: (checked) => {
                this.sm.updateSetting('betaMode', checked);
                if (this.sm.controlManager?.singleHandManager) {
                    this.sm.controlManager.singleHandManager.updateState();
                }
                betaSubWrap.style.display = checked ? 'block' : 'none';
                Toast(checked ? `已开启 ${__('betaLabTitle') || '实验功能'}` : `已关闭 ${__('betaLabTitle') || '实验功能'}`, 1200, 'info');
            }
        });
        card.appendChild(betaMainToggle.getElement());

        const singleHandToggle = new ToggleRow({
            title: __('singleHandMode') || '单手模式',
            subtext: __('singleHandModeDesc') || '控件收拢至下半屏，大拇指轻松触达',
            checked: Boolean(this.settings.betaSingleHandMode),
            onChange: (checked) => {
                this.sm.updateSetting('betaSingleHandMode', checked);
                if (this.sm.controlManager?.singleHandManager) {
                    this.sm.controlManager.singleHandManager.updateState();
                }
                singleHandPrefWrap.style.display = checked ? 'block' : 'none';
            }
        });
        betaSubWrap.appendChild(singleHandToggle.getElement());

        const singleHandPrefWrap = document.createElement('div');
        singleHandPrefWrap.className = 'tm-settings-subpanel-wrap';
        singleHandPrefWrap.style.display = Boolean(this.settings.betaSingleHandMode) ? 'block' : 'none';

        const handPrefRow = document.createElement('div');
        handPrefRow.className = 'tm-apple-row';
        handPrefRow.style.justifyContent = 'space-between';
        handPrefRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title">${__('singleHandPref') || '惯用手'}</div>
                <div class="tm-apple-row-subtext">选择单手控制面板贴靠方向</div>
            </div>
        `;
        const segmentedControl = new SegmentedControl({
            options: [
                { value: 'right', label: __('singleHandRight') || '右手' },
                { value: 'left', label: __('singleHandLeft') || '左手' }
            ],
            value: this.settings.singleHandPosition || 'right',
            onChange: (val) => {
                this.sm.updateSetting('singleHandPosition', val);
                if (this.sm.controlManager?.singleHandManager) {
                    this.sm.controlManager.singleHandManager.updateState();
                }
            }
        });
        handPrefRow.appendChild(segmentedControl.getElement());
        singleHandPrefWrap.appendChild(handPrefRow);
        betaSubWrap.appendChild(singleHandPrefWrap);

        const firstCapToggle = new ToggleRow({
            title: __('betaSkipIntro') || '跳过片头',
            subtext: __('betaSkipIntroDesc') || '开播直接跳转至第 1 个精彩高光',
            checked: Boolean(this.settings.betaFirstCapsulePlay),
            onChange: (checked) => {
                this.sm.updateSetting('betaFirstCapsulePlay', checked);
            }
        });
        betaSubWrap.appendChild(firstCapToggle.getElement());

        const undoToggle = new ToggleRow({
            title: __('betaCapsuleUndo') || '防误删除',
            subtext: __('betaCapsuleUndoDesc') || '误删高光后提供 60 秒撤销时间',
            checked: this.settings.betaCapsuleUndo !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaCapsuleUndo', checked);
            }
        });
        betaSubWrap.appendChild(undoToggle.getElement());

        const deepLinkToggle = new ToggleRow({
            title: __('betaDeepLinking') || '链接还原',
            subtext: __('betaDeepLinkingDesc') || '打开分享链接时自动加载对应高光',
            checked: this.settings.betaDeepLinking !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaDeepLinking', checked);
            }
        });
        betaSubWrap.appendChild(deepLinkToggle.getElement());

        const dbRow = document.createElement('div');
        dbRow.className = 'tm-apple-row';
        dbRow.style.flexDirection = 'column';
        dbRow.style.alignItems = 'stretch';
        dbRow.style.gap = '6px';
        dbRow.innerHTML = `
            <div class="tm-apple-row-title">${__('betaCustomApi') || '自建接口'}</div>
            <div class="tm-apple-row-subtext">${__('betaCustomApiDesc') || '连接个人私人评论库服务器'}</div>
            <input type="text" class="tm-settings-input tm-beta-db-url" placeholder="https://your-api.domain.com/comments" value="${this.settings.betaDbEndpoint || ''}" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 11.5px; outline: none;" />
            <input type="password" class="tm-settings-input tm-beta-db-key" placeholder="API Key / Token (可选)" value="${this.settings.betaDbApiKey || ''}" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 11.5px; outline: none;" />
        `;
        const dbUrlInput = dbRow.querySelector('.tm-beta-db-url');
        const dbKeyInput = dbRow.querySelector('.tm-beta-db-key');
        const saveDb = () => {
            this.sm.updateSetting('betaDbEndpoint', dbUrlInput.value.trim());
            this.sm.updateSetting('betaDbApiKey', dbKeyInput.value.trim());
            Toast('已保存自建数据库端点配置', 1500, 'info');
        };
        dbUrlInput.addEventListener('change', saveDb);
        dbKeyInput.addEventListener('change', saveDb);
        betaSubWrap.appendChild(dbRow);

        card.appendChild(betaSubWrap);

        const debugSubWrap = document.createElement('div');
        debugSubWrap.className = 'tm-settings-subpanel-wrap';
        debugSubWrap.style.display = Boolean(this.settings.debugMode) ? 'block' : 'none';

        const debugToggle = new ToggleRow({
            title: __('betaDebugLog') || '运行日志',
            subtext: __('betaDebugLogDesc') || '查看底层抓取排错与网络诊断信息',
            checked: Boolean(this.settings.debugMode),
            onChange: (checked) => {
                this.sm.updateSetting('debugMode', checked);
                DebugLogPanel.updateDebugState(checked);
                if (this.sm.controlManager?.commentPanel) {
                    this.sm.controlManager.commentPanel.updateDebugMode(checked);
                }
                debugSubWrap.style.display = checked ? 'block' : 'none';
                if (!checked) {
                    CrazyScraper.stop();
                } else if (this.settings.crazyScrapeMode) {
                    CrazyScraper.start(this.sm.controlManager?.commentPanel?.videoCode || '');
                }
            }
        });
        card.appendChild(debugToggle.getElement());

        const crazyToggle = new ToggleRow({
            title: __('betaPreloadComments') || '预载评论',
            subtext: __('betaPreloadCommentsDesc') || '后台静默抓取页面其他影片的热评',
            checked: Boolean(this.settings.crazyScrapeMode),
            onChange: (checked) => {
                this.sm.updateSetting('crazyScrapeMode', checked);
                if (checked) {
                    CrazyScraper.start(this.sm.controlManager?.commentPanel?.videoCode || '');
                } else {
                    CrazyScraper.stop();
                }
            }
        });
        debugSubWrap.appendChild(crazyToggle.getElement());

        const clearRow = document.createElement('div');
        clearRow.className = 'tm-apple-row';
        clearRow.style.justifyContent = 'space-between';
        clearRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title" style="color: #ff453a;">${__('betaClearCache') || '清除缓存'}</div>
                <div class="tm-apple-row-subtext">${__('betaClearCacheDesc') || '释放本地存储并清空离线评论'}</div>
            </div>
            <button type="button" class="tm-clear-cache-btn" style="background: rgba(255, 69, 58, 0.15); border: 1px solid rgba(255, 69, 58, 0.35); color: #ff453a; font-size: 11px; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">清空</button>
        `;
        const clearBtn = clearRow.querySelector('.tm-clear-cache-btn');
        clearBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('确认彻底删除所有本地 IndexedDB 离线评论缓存？')) return;
            clearBtn.textContent = '清理中...';
            await CommentCacheManager.clearAll();
            CrazyScraper._completedCodes.clear();
            CrazyScraper._scannedCodes.clear();
            CrazyScraper._avcodeDurations.clear();
            clearBtn.textContent = '已清空';
            Toast('已彻底清空本地 IndexedDB 评论缓存', 2000, 'success');
        });
        debugSubWrap.appendChild(clearRow);

        card.appendChild(debugSubWrap);
        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
