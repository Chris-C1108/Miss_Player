import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
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
        header.textContent = '实验室与高级排错';
        this.element.appendChild(header);

        const card = new AppleCard();

        const betaSubWrap = document.createElement('div');
        betaSubWrap.className = 'tm-settings-subpanel-wrap';
        betaSubWrap.style.display = Boolean(this.settings.betaMode) ? 'block' : 'none';

        const betaMainToggle = new ToggleRow({
            title: 'Beta 实验室',
            subtext: '抢先体验前沿实验特性，由用户主动选择受控启用',
            checked: Boolean(this.settings.betaMode),
            onChange: (checked) => {
                this.sm.updateSetting('betaMode', checked);
                betaSubWrap.style.display = checked ? 'block' : 'none';
                Toast(checked ? '已开启 Beta 实验室' : '已关闭 Beta 实验室', 1200, 'info');
            }
        });
        card.appendChild(betaMainToggle.getElement());

        const firstCapToggle = new ToggleRow({
            title: '智能跳过片头',
            subtext: '载入视频时优先从第 1 个精彩时间胶囊开播，无胶囊恢复进度',
            checked: Boolean(this.settings.betaFirstCapsulePlay),
            onChange: (checked) => {
                this.sm.updateSetting('betaFirstCapsulePlay', checked);
            }
        });
        betaSubWrap.appendChild(firstCapToggle.getElement());

        const safariMuteToggle = new ToggleRow({
            title: '高对比度静音标志',
            subtext: '音量归零或静音时，以 Safari 标志性红底白图标直观呈现',
            checked: this.settings.betaSafariMuteStyle !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaSafariMuteStyle', checked);
            }
        });
        betaSubWrap.appendChild(safariMuteToggle.getElement());

        const undoToggle = new ToggleRow({
            title: '胶囊误删安全保护',
            subtext: '删除关键时间胶囊后 60 秒内在面板提供一键撤销恢复按钮',
            checked: this.settings.betaCapsuleUndo !== false,
            onChange: (checked) => {
                this.sm.updateSetting('betaCapsuleUndo', checked);
            }
        });
        betaSubWrap.appendChild(undoToggle.getElement());

        const deepLinkToggle = new ToggleRow({
            title: '深链时间胶囊识别',
            subtext: '自动提取并挂载分享 URL 中的时间轴与倍速播放参数',
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
            <div class="tm-apple-row-title">自建评论远端数据库 (REST API)</div>
            <div class="tm-apple-row-subtext">配置个人数据库端点，优先于公共源查询聚合评论</div>
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
            title: '开发者排错日志',
            subtext: '开启底层运行状态追踪、单条抓取审查与网络诊断',
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
            title: '关联影片评论自动预热',
            subtext: '扫描宿主页面所有可见番号，低速防爬排队预取评论语料',
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
                <div class="tm-apple-row-title" style="color: #ff453a;">清空本地评论离线库</div>
                <div class="tm-apple-row-subtext">重置本地 IndexedDB 已收录缓存与去重记录</div>
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
