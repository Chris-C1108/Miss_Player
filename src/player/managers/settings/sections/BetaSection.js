import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { __ } from '../../../../constants/i18n.js';
import { Toast } from '../../../../utils/index.js';
import { CrazyScraper } from '../../../comments/CrazyScraper.js';
import { CommentCacheManager } from "../../../comments/CommentCacheManager.js";
import { DebugLogPanel } from '../../../ui/DebugLogPanel.js';
import { ViewportDebugHUD } from '../../../ui/ViewportDebugHUD.js';
import { PeachSection } from './PeachSection.js';

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
                betaSubWrap.style.display = checked ? 'block' : 'none';
                Toast(checked ? `已开启 ${__('betaLabTitle') || '实验功能'}` : `已关闭 ${__('betaLabTitle') || '实验功能'}`, 1200, 'info');
            }
        });
        card.appendChild(betaMainToggle.getElement());

        const firstCapToggle = new ToggleRow({
            title: __('betaSkipIntro') || '跳过片头',
            subtext: __('betaSkipIntroDesc') || '开播直达首个高光',
            checked: Boolean(this.settings.betaFirstCapsulePlay),
            onChange: (checked) => {
                this.sm.updateSetting('betaFirstCapsulePlay', checked);
            }
        });
        betaSubWrap.appendChild(firstCapToggle.getElement());

        const heatmapToggle = new ToggleRow({
            title: __('betaHeatmap') || '播放热度',
            subtext: __('betaHeatmapDesc') || '进度条显示观看波形',
            checked: Boolean(this.settings.betaHeatmap),
            onChange: (checked) => {
                this.sm.updateSetting('betaHeatmap', checked);
                const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                if (hm) {
                    hm.setEnabled(checked);
                }
            }
        });
        betaSubWrap.appendChild(heatmapToggle.getElement());

        const crowdHeatmapToggle = new ToggleRow({
            title: __('betaCrowdHeatmap') || '全网高能进度条',
            subtext: __('betaCrowdHeatmapDesc') || '分享并获取精彩片段热度',
            checked: Boolean(this.settings.betaCrowdHeatmap),
            onChange: (checked) => {
                this.sm.updateSetting('betaCrowdHeatmap', checked);
                const hm = this.sm.playerCore?.heatmapManager || this.sm.controlManager?.heatmapManager;
                if (hm) {
                    hm.setCrowdEnabled(checked);
                }
            }
        });
        betaSubWrap.appendChild(crowdHeatmapToggle.getElement());

        const undoToggle = new ToggleRow({
            title: __('betaCapsuleUndo') || '防误删除',
            subtext: __('betaCapsuleUndoDesc') || '删除保留 60 秒撤销',
            checked: this.settings.betaCapsuleUndo !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaCapsuleUndo', checked);
            }
        });
        betaSubWrap.appendChild(undoToggle.getElement());

        const deepLinkToggle = new ToggleRow({
            title: __('betaDeepLinking') || '链接还原',
            subtext: __('betaDeepLinkingDesc') || '打开分享链接载入高光',
            checked: this.settings.betaDeepLinking !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaDeepLinking', checked);
            }
        });
        betaSubWrap.appendChild(deepLinkToggle.getElement());

        const dbRow = document.createElement('div');
        dbRow.className = 'tm-apple-row tm-apple-row--column';
        dbRow.innerHTML = `
            <div class="tm-apple-row-title">${__('betaCustomApi') || '自建评论接口'}</div>
            <div class="tm-apple-row-subtext">${__('betaCustomApiDesc') || '连接私人评论服务器 (可选)'}</div>
            <input type="text" class="tm-settings-input tm-beta-db-url" placeholder="https://your-api.domain.com/comments" value="${this.settings.betaDbEndpoint || ''}" />
            <input type="password" class="tm-settings-input tm-beta-db-key" placeholder="API Key / Token (可选)" value="${this.settings.betaDbApiKey || ''}" />
        `;
        const dbUrlInput = dbRow.querySelector('.tm-beta-db-url');
        const dbKeyInput = dbRow.querySelector('.tm-beta-db-key');

        const bindFocus = (el) => {
            if (!el) return;
            const h = () => {
                const panel = el.closest('.tm-settings-panel');
                if (panel) {
                    setTimeout(() => {
                        const elRect = el.getBoundingClientRect();
                        const panelRect = panel.getBoundingClientRect();
                        const targetScrollTop = panel.scrollTop + (elRect.top - panelRect.top) - 70;
                        panel.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
                    }, 120);
                }
            };
            el.addEventListener('focus', h);
        };
        bindFocus(dbUrlInput);
        bindFocus(dbKeyInput);

        const saveDb = () => {
            this.sm.updateSetting('betaDbEndpoint', dbUrlInput.value.trim());
            this.sm.updateSetting('betaDbApiKey', dbKeyInput.value.trim());
            Toast('已保存自建数据库端点配置', 1500, 'info');
        };
        dbUrlInput.addEventListener('change', saveDb);
        dbKeyInput.addEventListener('change', saveDb);
        betaSubWrap.appendChild(dbRow);

        const peachSection = new PeachSection(this.sm);
        betaSubWrap.appendChild(peachSection.getElement());

        card.appendChild(betaSubWrap);

        const debugSubWrap = document.createElement('div');
        debugSubWrap.className = 'tm-settings-subpanel-wrap';
        debugSubWrap.style.display = Boolean(this.settings.debugMode) ? 'block' : 'none';

        const debugToggle = new ToggleRow({
            title: __('betaDebugLog') || '调试日志',
            subtext: __('betaDebugLogDesc') || '排错与网络抓取诊断',
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
            subtext: __('betaPreloadCommentsDesc') || '提前抓取关联影片评论',
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

        const viewportHudToggle = new ToggleRow({
            title: '视口探针',
            subtext: '屏幕与触摸实时调试 HUD',
            checked: Boolean(this.settings.viewportDebugEnabled),
            onChange: (checked) => {
                this.sm.updateSetting('viewportDebugEnabled', checked);
                if (checked) {
                    const uiManager = this.sm.uiManager || this.sm.playerCore?.uiManager;
                    if (uiManager && uiManager.playerContainer && uiManager.shadowRoot) {
                        ViewportDebugHUD.init(uiManager.playerContainer, uiManager.shadowRoot);
                    }
                } else {
                    ViewportDebugHUD.destroy();
                }
            }
        });
        debugSubWrap.appendChild(viewportHudToggle.getElement());

        const clearRow = document.createElement('div');
        clearRow.className = 'tm-apple-row';
        clearRow.innerHTML = `
            <div class="tm-apple-row-left">
                <div class="tm-apple-row-title tm-text-danger">${__('betaClearCache') || '清除缓存'}</div>
                <div class="tm-apple-row-subtext">${__('betaClearCacheDesc') || '清空离线评论与本地缓存'}</div>
            </div>
            <button type="button" class="tm-clear-cache-btn tm-btn-danger">清空</button>
        `;
        const clearBtn = clearRow.querySelector('.tm-clear-cache-btn');
        clearBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('确认彻底删除所有本地离线评论缓存？')) return;
            clearBtn.textContent = '清理中...';
            await CommentCacheManager.clearAll();
            CrazyScraper._completedCodes.clear();
            CrazyScraper._scannedCodes.clear();
            CrazyScraper._avcodeDurations.clear();
            clearBtn.textContent = '已清空';
            Toast('已彻底清空本地评论缓存', 2000, 'success');
        });
        debugSubWrap.appendChild(clearRow);

        card.appendChild(debugSubWrap);
        this.element.appendChild(card.getElement());
    }

    getElement() {
        return this.element;
    }
}
