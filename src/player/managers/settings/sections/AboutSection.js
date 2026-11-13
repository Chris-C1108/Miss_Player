import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import {
    createGroupHeader,
    createActionRow,
    createStatusBanner
} from '../components/SettingsPrimitives.js';
import { __ } from '../../../../constants/i18n.js';
import {
    ICON_ABOUT_INFO,
    ICON_REFRESH,
    ICON_DOWNLOAD,
    ICON_EXTERNAL_LINK
} from '../../../../constants/icons.js';
import {
    OFFICIAL_SCRIPT_ID,
    getCurrentVersion,
    detectScriptHandler,
    getCleanScriptUrl,
    dispatchScriptInstall
} from '../../../../services/SleazyForkService.js';
import { Toast } from '../../../../utils/index.js';

export class AboutSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this._render();
    }

    _getHandlerMeta(isBeta, hasUpdate) {
        const handler = detectScriptHandler();
        const verb = hasUpdate ? '更新' : '安装';
        const channelText = isBeta ? '测试版' : '正式版';
        if (handler === 'stay') return { key: 'stay', label: `Stay 一键${verb}`, sub: `${channelText}直连安装` };
        if (handler === 'tampermonkey') return { key: 'tampermonkey', label: `油猴一键${verb}`, sub: `Tampermonkey ${channelText}` };
        if (handler === 'scriptcat') return { key: 'scriptcat', label: `脚本猫一键${verb}`, sub: `ScriptCat ${channelText}` };
        return { key: 'tampermonkey', label: `管理器一键${verb}`, sub: `${channelText}直连源` };
    }

    _render() {
        this.element.innerHTML = '';
        this.element.appendChild(createGroupHeader(__('aboutGroupTitle') || '版本信息'));

        if (!this.sm._aboutAutoChecked && !this.sm._isCheckingUpdate && typeof this.sm.checkUpdate === 'function') {
            this.sm._aboutAutoChecked = true;
            setTimeout(() => this.sm.checkUpdate(false, true), 0);
        }

        const currentVersion = getCurrentVersion();
        const currentChannel = this.settings.updateChannel || 'stable';
        const isBeta = currentChannel === 'beta';
        const updateInfo = this.sm._latestUpdateInfo;
        const meta = updateInfo?.meta;
        const hasUpdate = Boolean(updateInfo?.hasUpdate);
        const latestVer = updateInfo?.latestVersion || currentVersion;
        const isChecking = Boolean(this.sm._isCheckingUpdate);

        let badgeText = isBeta ? '测试版' : '正式版';
        let tone = isBeta ? 'accent' : 'neutral';
        let detail = `当前通道: ${isBeta ? 'GitHub 测试版' : 'SleazyFork 正式版'}`;

        if (isChecking) {
            badgeText = '检查中…';
            tone = 'accent';
        } else if (hasUpdate) {
            badgeText = `新版 v${latestVer}`;
            tone = 'success';
            detail = `发现可更新版本 v${latestVer}，点击下方一键更新`;
        } else if (updateInfo) {
            badgeText = '最新';
            tone = 'success';
            detail = __('alreadyLatest') || '当前已是最新版本';
        }

        const card = new AppleCard();

        // 1. 顶部统一状态横幅（无 Emoji，无多余统计格子）
        const bannerRow = document.createElement('div');
        bannerRow.className = 'tm-apple-row';
        const banner = createStatusBanner({
            iconHtml: ICON_ABOUT_INFO,
            title: `Miss Player v${currentVersion}`,
            detail,
            badgeText,
            tone
        });
        banner.classList.add('is-inline-card-banner');
        bannerRow.appendChild(banner);
        card.appendChild(bannerRow);

        // 2. 更新通道选择
        const channelRow = document.createElement('div');
        channelRow.className = 'tm-apple-row tm-apple-row--split';

        const channelLabel = document.createElement('span');
        channelLabel.className = 'tm-apple-row-title';
        channelLabel.textContent = __('updateChannel') || '更新通道';

        const segControl = new SegmentedControl({
            options: [
                { label: __('channelStable') || '正式版', value: 'stable' },
                { label: __('channelBeta') || '测试版', value: 'beta' }
            ],
            value: currentChannel,
            onChange: async (nextVal) => {
                if (nextVal === this.settings.updateChannel) return;
                this.sm.updateSetting('updateChannel', nextVal);
                await this.sm.checkUpdate(true, true);
            }
        });

        channelRow.appendChild(channelLabel);
        channelRow.appendChild(segControl.getElement());
        card.appendChild(channelRow);

        // 3. 自动检查更新开关
        card.appendChild(new ToggleRow({
            title: __('autoCheckUpdate') || '自动检查更新',
            subtext: __('autoCheckUpdateDesc') || '启动时静默检查并在设置按钮提示新版本',
            checked: this.settings.autoCheckUpdate !== false,
            onChange: (checked) => {
                this.sm.updateSetting('autoCheckUpdate', checked);
            }
        }).getElement());

        // 4. 手动检查更新
        card.appendChild(createActionRow({
            iconHtml: ICON_REFRESH,
            title: __('checkUpdate') || '检查更新',
            subtext: hasUpdate ? `远端最新版本: v${latestVer}` : '立即向更新通道核对最新版本',
            actionLabel: isChecking ? (__('checkingUpdate') || '检查中…') : '立即检查',
            tone: 'neutral',
            onAction: async () => {
                await this.sm.checkUpdate(true, true);
            }
        }));

        // 5. 一键安装 / 更新入口（仅单行呈现对应脚本管理器）
        const cleanInstallUrl = getCleanScriptUrl(currentChannel, this.sm._latestUpdateInfo?.meta || meta);
        const handlerMeta = this._getHandlerMeta(isBeta, hasUpdate);
        card.appendChild(createActionRow({
            iconHtml: ICON_DOWNLOAD,
            title: handlerMeta.label,
            subtext: handlerMeta.sub,
            actionLabel: hasUpdate ? '立即更新' : '重装脚本',
            tone: hasUpdate ? 'accent' : 'neutral',
            onAction: () => {
                dispatchScriptInstall(handlerMeta.key, cleanInstallUrl, {
                    isUpdate: hasUpdate,
                    onToast: (msg, t) => Toast.show(msg, 2500, t)
                });
            }
        }));

        // 6. 双轨项目主页外链（测试版指向 GitHub 项目页，正式版指向 SleazyFork 脚本页）
        card.appendChild(createActionRow({
            iconHtml: ICON_EXTERNAL_LINK,
            title: isBeta ? '前往 GitHub 项目页' : '前往 SleazyFork 脚本页',
            subtext: isBeta ? '查看测试版近期提交与修复详情' : '查看正式版发行说明与评价',
            actionLabel: '前往查看',
            tone: 'neutral',
            onAction: () => {
                const targetUrl = isBeta
                    ? 'https://github.com/Chris-C1108/Miss_Player'
                    : `https://sleazyfork.org/scripts/${OFFICIAL_SCRIPT_ID}`;
                if (typeof GM_openInTab === 'function') {
                    GM_openInTab(targetUrl, { active: true });
                } else {
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }
            }
        }));

        this.element.appendChild(card.getElement());
    }

    refresh() {
        this.settings = this.sm.settings;
        this._render();
    }

    getElement() {
        return this.element;
    }
}
