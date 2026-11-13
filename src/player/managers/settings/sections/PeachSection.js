import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import {
    createNavRow,
    createActionRow,
    createFieldRow,
    createStatusBanner,
    createPillSelector
} from '../components/SettingsPrimitives.js';
import {
    PeachService,
    PEACH_WEBDAV_MODE_SYNC_DEFAULT,
    PEACH_WEBDAV_MODE_SYNC_CUSTOM,
    PEACH_WEBDAV_MODE_STANDALONE
} from '../../../../services/PeachService.js';
import { SyncManager, WebDavClient } from '../../../../sync/index.js';
import { Toast } from '../../../../utils/index.js';
import { ICON_PEACH_MEDIA, ICON_REFRESH } from '../../../../constants/icons.js';
import { __ } from '../../../../constants/i18n.js';

export class PeachSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.isConnected = false;
        this.connectionStatus = 'none'; // 'none' | 'strm_only' | 'full'
        this._checkDebounce = null;
        this._navRow = null;
        this._subpageBanner = null;
        this._subpageContainer = null;

        this._navRow = createNavRow({
            iconHtml: ICON_PEACH_MEDIA,
            title: __('peachMediaNavTitle') || 'Peach 媒体库',
            subtext: '一键生成 .strm 入库并与自托管实例联动',
            badgeText: '未配置',
            badgeTone: 'neutral',
            onClick: () => this.openSubpage()
        });

        this._syncNavSummary();
        this._checkInitialStatus();
    }

    getElement() {
        return this._navRow;
    }

    getNavRow() {
        return this._navRow;
    }

    _getSummaryState() {
        const config = PeachService.getConfig();
        if (!config.base && config.origins.length === 0) {
            return { text: '未配置', tone: 'neutral', detail: '填入自托管 Peach 服务地址后即可入库' };
        }
        if (this.connectionStatus === 'full') {
            return { text: '全功能', tone: 'success', detail: '已建立免密授权，支持入库与实时巡检' };
        }
        if (this.connectionStatus === 'strm_only') {
            return { text: '仅入库', tone: 'accent', detail: '服务可达，打开 Peach 站点可自动获取令牌' };
        }
        return { text: '待验证', tone: 'warn', detail: '实例地址已保存，点击测试确认连通性' };
    }

    _syncNavSummary() {
        const summary = this._getSummaryState();
        if (this._navRow && typeof this._navRow._updateSummary === 'function') {
            this._navRow._updateSummary({ text: summary.text, tone: summary.tone });
        }
        if (this._subpageBanner && typeof this._subpageBanner._update === 'function') {
            this._subpageBanner._update({
                title: 'Peach 实例连接',
                detail: summary.detail,
                badgeText: summary.text,
                tone: summary.tone
            });
        }
    }

    async _checkInitialStatus() {
        const config = PeachService.getConfig();
        if (config.base || config.origins.length > 0) {
            const res = await PeachService.testConnection();
            this.isConnected = Boolean(res && res.ok);
            this.connectionStatus = res && res.ok ? (res.status === 'full' ? 'full' : 'strm_only') : 'none';
            this._syncNavSummary();
        }
    }

    _autoCheckStatus() {
        if (this._checkDebounce) clearTimeout(this._checkDebounce);
        this._checkDebounce = setTimeout(async () => {
            if (this._subpageBanner) {
                this._subpageBanner._update({ badgeText: '测试中…', tone: 'accent' });
            }
            const res = await PeachService.testConnection();
            this.isConnected = Boolean(res && res.ok);
            this.connectionStatus = res && res.ok ? (res.status === 'full' ? 'full' : 'strm_only') : 'none';
            this._syncNavSummary();
        }, 650);
    }

    openSubpage() {
        const title = __('peachMediaNavTitle') || 'Peach 媒体库';
        this.sm.pushSubpage('peach', title, () => this._buildSubpageContent());
    }

    _notifyPeachButtonUpdate() {
        const uiManager = this.sm?.uiManager || this.sm?.playerCore?.uiManager;
        if (uiManager && typeof uiManager.updatePeachButtonVisibility === 'function') {
            uiManager.updatePeachButtonVisibility();
        }
    }

    _buildSubpageContent() {
        const stack = document.createElement('div');
        stack.className = 'tm-settings-subpage-stack';
        this._subpageContainer = stack;

        const config = PeachService.getConfig();
        const summary = this._getSummaryState();

        this._subpageBanner = createStatusBanner({
            iconHtml: ICON_PEACH_MEDIA,
            title: 'Peach 实例连接',
            detail: summary.detail,
            badgeText: summary.text,
            tone: summary.tone
        });
        stack.appendChild(this._subpageBanner);

        // Card 1: 开关与服务地址
        const instanceCard = new AppleCard();

        instanceCard.appendChild(new ToggleRow({
            title: '启用 Peach 入库按钮',
            subtext: '在播放器顶栏显示入库入口，写入 .strm 到挂载目录',
            checked: Boolean(this.settings.peachIngestEnabled),
            onChange: (checked) => {
                this.sm.updateSetting('peachIngestEnabled', checked);
                this._notifyPeachButtonUpdate();
            }
        }).getElement());

        const originsRow = document.createElement('div');
        originsRow.className = 'tm-apple-row tm-apple-row--column';

        const originsTitle = document.createElement('div');
        originsTitle.className = 'tm-apple-row-title';
        originsTitle.textContent = '已发现的服务地址';

        const originsPills = createPillSelector({ items: [] });

        const renderOrigins = (baseField) => {
            const latest = PeachService.getConfig();
            const hasOrigins = Array.isArray(latest.origins) && latest.origins.length > 0;
            originsRow.classList.toggle('is-hidden', !hasOrigins);
            if (!hasOrigins) return;

            originsPills._update(latest.origins.map((origin) => ({
                id: origin,
                label: origin === latest.base ? `✓ ${origin}` : origin,
                active: origin === latest.base,
                removable: true,
                title: `切换到 ${origin}`
            })));
        };

        originsPills.addEventListener('click', () => {});

        const baseField = createFieldRow({
            label: 'Peach 服务地址',
            hint: '输入实例 Web 地址，或粘贴完整配对 JSON 自动识别',
            type: 'text',
            value: config.base || '',
            placeholder: 'http://192.168.1.x:8000',
            withClearBtn: true,
            onClear: () => {
                PeachService.clearBase();
                this.isConnected = false;
                this.connectionStatus = 'none';
                this._syncNavSummary();
                renderOrigins(baseField);
                this._notifyPeachButtonUpdate();
                Toast('已清除当前 Peach 地址记录', 1800, 'info');
            },
            onInput: (val, input) => {
                const trimmed = val.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (parsed.base && parsed.token) {
                            PeachService.savePairingFromPayload(parsed);
                            input.value = parsed.base;
                            Toast('已自动识别并保存 Peach 配对信息！', 2200, 'success');
                            this._autoCheckStatus();
                            renderOrigins(baseField);
                            this._notifyPeachButtonUpdate();
                            return;
                        }
                    } catch (_) {}
                }
                if (trimmed.length >= 10) {
                    PeachService.setBase(trimmed);
                    this._autoCheckStatus();
                    renderOrigins(baseField);
                }
            },
            onChange: (val, input) => {
                const trimmed = val.trim();
                if (!trimmed) return;
                PeachService.setBase(trimmed);
                input.value = PeachService.getConfig().base || trimmed;
                this._autoCheckStatus();
                renderOrigins(baseField);
                this._notifyPeachButtonUpdate();
            }
        });

        if (baseField._clearBtn) {
            baseField._clearBtn.classList.add('tm-peach-delete-btn');
        }

        // 重新绑定 origins 切换与删除逻辑，复用 baseField 引用
        const syncOriginsCallbacks = createPillSelector({
            items: [],
            onToggle: (origin) => {
                PeachService.setBase(origin);
                baseField._input.value = origin;
                if (baseField._clearBtn) baseField._clearBtn.classList.remove('is-hidden');
                this._autoCheckStatus();
                refreshOriginsUI();
                this._notifyPeachButtonUpdate();
                Toast(`已切换至: ${origin}`, 1600, 'info');
            },
            onDelete: (origin) => {
                PeachService.removeOrigin(origin);
                baseField._input.value = PeachService.getConfig().base || '';
                if (baseField._clearBtn) baseField._clearBtn.classList.toggle('is-hidden', !baseField._input.value);
                this._autoCheckStatus();
                refreshOriginsUI();
                this._notifyPeachButtonUpdate();
            }
        });

        const refreshOriginsUI = () => {
            const latest = PeachService.getConfig();
            const hasOrigins = Array.isArray(latest.origins) && latest.origins.length > 0;
            originsRow.classList.toggle('is-hidden', !hasOrigins);
            if (!hasOrigins) return;
            syncOriginsCallbacks._update(latest.origins.map((origin) => ({
                id: origin,
                label: origin === latest.base ? `✓ ${origin}` : origin,
                active: origin === latest.base,
                removable: true,
                title: `切换到 ${origin}`
            })));
        };

        originsRow.appendChild(originsTitle);
        originsRow.appendChild(syncOriginsCallbacks);
        refreshOriginsUI();

        instanceCard.appendChild(baseField);
        instanceCard.appendChild(originsRow);

        instanceCard.appendChild(createFieldRow({
            label: '流网关地址',
            hint: 'Peach 服务端可访问的网关地址（支持局域网 IP / host.docker.internal）。播放 Token 需在部署网关时环境变量配置（默认 dev）',
            type: 'text',
            value: config.gatewayBase || '',
            placeholder: 'http://host.docker.internal:8765',
            onChange: (val) => {
                PeachService.setGatewayConfig({ gatewayBase: val.trim() });
                this._autoCheckStatus();
            }
        }));

        instanceCard.appendChild(createFieldRow({
            label: '网关鉴权 Token',
            hint: '可选 · 对应网关环境变量配置的播放 Token（默认 dev）',
            type: 'password',
            value: config.gatewayToken || '',
            placeholder: '留空或填写网关令牌',
            withEyeToggle: true,
            onChange: (val) => {
                PeachService.setGatewayConfig({ gatewayToken: val.trim() });
                this._autoCheckStatus();
            }
        }));

        stack.appendChild(instanceCard.getElement());

        // Card 2: STRM 存储路径模式
        const webdavCard = new AppleCard();

        const modeRow = document.createElement('div');
        modeRow.className = 'tm-apple-row tm-apple-row--column';

        const modeHead = document.createElement('div');
        modeHead.className = 'tm-apple-row-split';

        const modeTitle = document.createElement('span');
        modeTitle.className = 'tm-apple-row-title';
        modeTitle.textContent = '.strm 存储方式';

        const currentMode = config.webdavMode || PEACH_WEBDAV_MODE_SYNC_DEFAULT;
        const modeHint = document.createElement('div');
        modeHint.className = 'tm-apple-row-subtext';

        const syncWdConfig = SyncManager.getWebDavConfig();
        const customDirRow = createFieldRow({
            label: '自定义挂载子目录',
            type: 'text',
            value: config.customDir || '/MissPlayer/peach-media/',
            placeholder: '/MissPlayer/peach-media/',
            onChange: (val) => {
                PeachService.setWebdavConfig({ customDir: val.trim() || '/MissPlayer/peach-media/' });
            }
        });

        const saUrlRow = createFieldRow({
            label: '独立 WebDAV 地址',
            type: 'text',
            value: config.standaloneWebdav?.url || '',
            placeholder: 'https://dav.example.com/dav/',
            onChange: (val) => {
                const latest = PeachService.getConfig().standaloneWebdav || {};
                PeachService.setWebdavConfig({ standaloneWebdav: { ...latest, url: val.trim() } });
            }
        });

        const saLanRow = createFieldRow({
            label: '局域网备用地址',
            hint: '可选 · 同内网自动切换直连',
            type: 'text',
            value: config.standaloneWebdav?.lanUrl || '',
            placeholder: 'http://192.168.1.x:8080/dav/',
            onChange: (val) => {
                const latest = PeachService.getConfig().standaloneWebdav || {};
                PeachService.setWebdavConfig({ standaloneWebdav: { ...latest, lanUrl: val.trim() } });
            }
        });

        const saUserRow = createFieldRow({
            label: '用户名',
            type: 'text',
            value: config.standaloneWebdav?.username || '',
            placeholder: 'WebDAV 账号',
            onChange: (val) => {
                const latest = PeachService.getConfig().standaloneWebdav || {};
                PeachService.setWebdavConfig({ standaloneWebdav: { ...latest, username: val.trim() } });
            }
        });

        const saPassRow = createFieldRow({
            label: '密码',
            type: 'password',
            value: config.standaloneWebdav?.password || '',
            placeholder: 'WebDAV 密码或应用专用密码',
            withEyeToggle: true,
            onChange: (val) => {
                const latest = PeachService.getConfig().standaloneWebdav || {};
                PeachService.setWebdavConfig({ standaloneWebdav: { ...latest, password: val } });
            }
        });

        const saPathRow = createFieldRow({
            label: '存储路径',
            type: 'text',
            value: config.standaloneWebdav?.path || '/peach-media/',
            placeholder: '/peach-media/',
            onChange: (val) => {
                const latest = PeachService.getConfig().standaloneWebdav || {};
                PeachService.setWebdavConfig({ standaloneWebdav: { ...latest, path: val.trim() || '/peach-media/' } });
            }
        });

        const saTestRow = createActionRow({
            title: '测试独立 WebDAV',
            subtext: '校验独立存储读写权限',
            actionLabel: '测试连接',
            tone: 'neutral',
            onAction: async (btn, helpers) => {
                const latestWd = PeachService.getConfig().standaloneWebdav || {};
                if (!WebDavClient.hasValidEndpoint(latestWd)) {
                    Toast('请先填写有效的 WebDAV 地址', 2000, 'warning');
                    return;
                }
                btn.disabled = true;
                helpers.setLabel('测试中…');
                const res = await WebDavClient.testConnection(latestWd);
                btn.disabled = false;
                helpers.setLabel('测试连接');
                if (res && res.ok) {
                    Toast('独立 WebDAV 连接正常', 2200, 'success');
                } else {
                    Toast(res?.error || '连接失败', 2600, 'error');
                }
            }
        });

        const applyModeVisibility = (mode) => {
            if (mode === PEACH_WEBDAV_MODE_SYNC_DEFAULT) {
                const basePath = (syncWdConfig.path || '/MissPlayer/').replace(/\/+$/, '');
                modeHint.textContent = WebDavClient.hasValidEndpoint(syncWdConfig)
                    ? `复用云同步网盘，自动写入 ${basePath}/peach-media/`
                    : '尚未配置云同步 WebDAV，请先在「同步与连接」中完成配置';
            } else if (mode === PEACH_WEBDAV_MODE_SYNC_CUSTOM) {
                modeHint.textContent = '复用云同步 WebDAV 账号，写入下方指定的自定义目录';
            } else {
                modeHint.textContent = '使用独立 WebDAV 存储 .strm 文件，不与脚本备份混用';
            }
            customDirRow.classList.toggle('is-hidden', mode !== PEACH_WEBDAV_MODE_SYNC_CUSTOM);
            const showStandalone = mode === PEACH_WEBDAV_MODE_STANDALONE;
            saUrlRow.classList.toggle('is-hidden', !showStandalone);
            saLanRow.classList.toggle('is-hidden', !showStandalone);
            saUserRow.classList.toggle('is-hidden', !showStandalone);
            saPassRow.classList.toggle('is-hidden', !showStandalone);
            saPathRow.classList.toggle('is-hidden', !showStandalone);
            saTestRow.classList.toggle('is-hidden', !showStandalone);
        };

        const modeSeg = new SegmentedControl({
            options: [
                { label: '复用默认', value: PEACH_WEBDAV_MODE_SYNC_DEFAULT },
                { label: '自定义目录', value: PEACH_WEBDAV_MODE_SYNC_CUSTOM },
                { label: '独立网盘', value: PEACH_WEBDAV_MODE_STANDALONE }
            ],
            value: currentMode,
            onChange: (val) => {
                PeachService.setWebdavConfig({ webdavMode: val });
                applyModeVisibility(val);
            }
        });

        modeHead.appendChild(modeTitle);
        modeHead.appendChild(modeSeg.getElement());
        modeRow.appendChild(modeHead);
        modeRow.appendChild(modeHint);

        applyModeVisibility(currentMode);

        webdavCard.appendChild(modeRow);
        webdavCard.appendChild(customDirRow);
        webdavCard.appendChild(saUrlRow);
        webdavCard.appendChild(saLanRow);
        webdavCard.appendChild(saUserRow);
        webdavCard.appendChild(saPassRow);
        webdavCard.appendChild(saPathRow);
        webdavCard.appendChild(saTestRow);

        stack.appendChild(webdavCard.getElement());
        return stack;
    }
}
