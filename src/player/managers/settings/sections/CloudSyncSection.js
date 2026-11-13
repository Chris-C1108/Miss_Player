import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import {
    createGroupHeader,
    createNavRow,
    createActionRow,
    createFieldRow,
    createStatusBanner
} from '../components/SettingsPrimitives.js';
import { PeachSection } from './PeachSection.js';
import { SyncManager, WebDavClient, getOrCreateClientId, getDeviceName } from '../../../../sync/index.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';
import {
    ICON_CLOUD_SYNC,
    ICON_CLOUD_UPLOAD,
    ICON_CLOUD_DOWNLOAD,
    ICON_SERVER
} from '../../../../constants/icons.js';

export class CloudSyncSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group';
        this.peachSection = new PeachSection(settingsManager);
        this._webdavNavRow = null;
        this._render();
    }

    _getWebDavSummary() {
        const config = SyncManager.getWebDavConfig();
        const isConfigured = WebDavClient.hasValidEndpoint(config);
        const autoSync = config.autoSync !== false;
        const lastSync = SyncManager.getLastSyncTime();

        if (!isConfigured) {
            return {
                badgeText: __('webdavNotConfigured') || '未配置',
                tone: 'neutral',
                subtext: '备份设置、高光胶囊与观影足迹'
            };
        }

        const hostLabel = (config.url || config.lanUrl || '').replace(/^https?:\/\//i, '').split('/')[0] || 'WebDAV';
        const timeStr = lastSync
            ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '尚未同步';
        return {
            badgeText: autoSync ? '已启用' : '手动',
            tone: 'success',
            subtext: `${hostLabel} · 上次同步 ${timeStr}`
        };
    }

    _openWebDavSubpage() {
        const title = __('webdavNavTitle') || 'WebDAV 云同步';
        this.sm.pushSubpage('webdav', title, () => this._buildWebDavSubpage());
    }

    _buildWebDavSubpage() {
        const stack = document.createElement('div');
        stack.className = 'tm-settings-subpage-stack';

        const config = SyncManager.getWebDavConfig();
        const clientId = getOrCreateClientId();
        const deviceName = getDeviceName();

        const formatLastSync = () => {
            const lastSync = SyncManager.getLastSyncTime();
            return lastSync
                ? `上次同步 ${new Date(lastSync).toLocaleTimeString()}`
                : '尚未完成过云端同步';
        };

        const banner = createStatusBanner({
            iconHtml: ICON_CLOUD_SYNC,
            title: WebDavClient.hasValidEndpoint(config) ? 'WebDAV 已配置' : '等待配置 WebDAV',
            detail: `${deviceName} (${clientId.slice(0, 6)}) · ${formatLastSync()}`,
            badgeText: WebDavClient.hasValidEndpoint(config) ? (config.autoSync !== false ? '自动同步' : '手动同步') : '未连接',
            tone: WebDavClient.hasValidEndpoint(config) ? 'success' : 'neutral'
        });
        stack.appendChild(banner);

        // Card 1: 端点与凭据
        const credCard = new AppleCard();

        const urlField = createFieldRow({
            label: __('webdavUrl') || '服务器地址',
            hint: '主地址（兼容坚果云、Alist、Nextcloud 及各类私有云/NAS）',
            type: 'url',
            value: config.url || '',
            placeholder: 'https://dav.example.com/dav/',
            onChange: (val) => {
                config.url = val.trim();
                SyncManager.saveWebDavConfig(config);
                this._refreshNavRow();
            }
        });

        const lanField = createFieldRow({
            label: __('webdavLanUrl') || '局域网备用地址',
            hint: '可选 · 归家时自动毫秒切换内网直连',
            type: 'url',
            value: config.lanUrl || '',
            placeholder: 'http://192.168.1.x:8080/dav/',
            onChange: (val) => {
                config.lanUrl = val.trim();
                SyncManager.saveWebDavConfig(config);
                this._refreshNavRow();
            }
        });

        const userField = createFieldRow({
            label: __('webdavUsername') || '用户名',
            type: 'text',
            value: config.username || '',
            placeholder: 'example@domain.com',
            onChange: (val) => {
                config.username = val.trim();
                SyncManager.saveWebDavConfig(config);
            }
        });

        const passField = createFieldRow({
            label: __('webdavPassword') || '应用密码',
            type: 'password',
            value: config.password || '',
            placeholder: '应用专用密码或授权令牌',
            withEyeToggle: true,
            onChange: (val) => {
                config.password = val;
                SyncManager.saveWebDavConfig(config);
            }
        });

        const pathField = createFieldRow({
            label: __('webdavPath') || '存储目录',
            type: 'text',
            value: config.path || '/MissPlayer/',
            placeholder: '/MissPlayer/',
            onChange: (val) => {
                config.path = val.trim() || '/MissPlayer/';
                SyncManager.saveWebDavConfig(config);
            }
        });

        const autoSyncRow = new ToggleRow({
            title: __('webdavAutoSync') || '自动同步',
            subtext: __('webdavAutoSyncDesc') || '改动设置或高光后静默合并至云端',
            checked: config.autoSync !== false,
            onChange: (checked) => {
                config.autoSync = checked;
                SyncManager.saveWebDavConfig(config);
                this._refreshNavRow();
                banner._update({
                    badgeText: WebDavClient.hasValidEndpoint(config) ? (checked ? '自动同步' : '手动同步') : '未连接'
                });
            }
        }).getElement();

        credCard.appendChild(urlField);
        credCard.appendChild(lanField);
        credCard.appendChild(userField);
        credCard.appendChild(passField);
        credCard.appendChild(pathField);
        credCard.appendChild(autoSyncRow);
        stack.appendChild(credCard.getElement());

        // Card 2: 连通与备份操作（覆盖类高危操作采用内联二次确认，杜绝原生阻塞弹窗）
        const opsCard = new AppleCard();

        const persistInputs = () => {
            config.url = urlField._input.value.trim();
            config.lanUrl = lanField._input.value.trim();
            config.username = userField._input.value.trim();
            config.password = passField._input.value;
            config.path = pathField._input.value.trim() || '/MissPlayer/';
            SyncManager.saveWebDavConfig(config);
            return config;
        };

        opsCard.appendChild(createActionRow({
            iconHtml: ICON_SERVER,
            title: __('webdavTestConn') || '测试连接',
            subtext: '校验主地址与局域网备用地址读写权限',
            actionLabel: '测试',
            tone: 'neutral',
            onAction: async (btn, helpers) => {
                const cfg = persistInputs();
                if (!WebDavClient.hasValidEndpoint(cfg)) {
                    Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                    return;
                }
                btn.disabled = true;
                helpers.setLabel('测试中…');
                banner._update({ badgeText: '测试中…', tone: 'accent' });
                const res = await WebDavClient.testConnection(cfg);
                btn.disabled = false;
                helpers.setLabel('测试');
                if (res && res.ok) {
                    const msg = res.usedUrl ? `连通成功 (${res.usedUrl})` : 'WebDAV 服务器连通正常';
                    Toast(msg, 2200, 'success');
                    banner._update({ title: 'WebDAV 连通正常', detail: `${deviceName} · ${formatLastSync()}`, badgeText: '正常', tone: 'success' });
                } else {
                    const errText = res?.error || '连接失败';
                    Toast(errText, 3000, 'error');
                    banner._update({ title: 'WebDAV 连接异常', detail: errText, badgeText: '异常', tone: 'error' });
                }
            }
        }));

        opsCard.appendChild(createActionRow({
            iconHtml: ICON_CLOUD_SYNC,
            title: __('webdavSyncNow') || '双向智能同步',
            subtext: '合并本机与云端最新改动并保留冲突保护',
            actionLabel: '立即同步',
            tone: 'accent',
            onAction: async (btn, helpers) => {
                const cfg = persistInputs();
                if (!WebDavClient.hasValidEndpoint(cfg)) {
                    Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                    return;
                }
                btn.disabled = true;
                helpers.setLabel('同步中…');
                try {
                    const res = await SyncManager.executeSync({
                        mode: 'smart',
                        config: cfg,
                        playerState: this.sm.playerCore?.options?.playerState
                    });
                    Toast(res.message || '同步完成', 2400, 'success');
                    banner._update({ title: '双向同步完成', detail: `${deviceName} · ${formatLastSync()}`, badgeText: '已同步', tone: 'success' });
                    this._refreshNavRow();
                    if (res.hasChanges) {
                        this.sm.syncState();
                    }
                } catch (err) {
                    Toast((__('webdavSyncFailed') || '同步失败: ') + err.message, 3200, 'error');
                    banner._update({ title: '同步失败', detail: err.message, badgeText: '失败', tone: 'error' });
                } finally {
                    btn.disabled = false;
                    helpers.setLabel('立即同步');
                }
            }
        }));

        opsCard.appendChild(createActionRow({
            iconHtml: ICON_CLOUD_UPLOAD,
            title: __('webdavUploadOverwrite') || '上传覆盖云端',
            subtext: '用本机数据直接覆盖云端备份（不可撤回）',
            actionLabel: '上传覆盖',
            tone: 'danger',
            confirmTwice: true,
            confirmText: '确认覆盖云端',
            onAction: async (btn, helpers) => {
                const cfg = persistInputs();
                if (!WebDavClient.hasValidEndpoint(cfg)) {
                    Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                    return;
                }
                btn.disabled = true;
                helpers.setLabel('上传中…');
                try {
                    const res = await SyncManager.executeSync({
                        mode: 'upload',
                        config: cfg,
                        playerState: this.sm.playerCore?.options?.playerState
                    });
                    Toast(res.message || '已成功覆盖云端备份', 2400, 'success');
                    banner._update({ title: '已覆盖云端备份', detail: `${deviceName} · ${formatLastSync()}`, badgeText: '已上传', tone: 'success' });
                    this._refreshNavRow();
                } catch (err) {
                    Toast((__('webdavSyncFailed') || '上传失败: ') + err.message, 3200, 'error');
                    banner._update({ title: '上传失败', detail: err.message, badgeText: '失败', tone: 'error' });
                } finally {
                    btn.disabled = false;
                    helpers.setLabel('上传覆盖');
                }
            }
        }));

        opsCard.appendChild(createActionRow({
            iconHtml: ICON_CLOUD_DOWNLOAD,
            title: __('webdavDownloadOverwrite') || '下载恢复本机',
            subtext: '从云端拉取配置并覆盖本机数据（不可撤回）',
            actionLabel: '恢复本机',
            tone: 'danger',
            confirmTwice: true,
            confirmText: '确认覆盖本机',
            onAction: async (btn, helpers) => {
                const cfg = persistInputs();
                if (!WebDavClient.hasValidEndpoint(cfg)) {
                    Toast(__('webdavTestFailed') || '请输入 WebDAV 服务器地址', 2500);
                    return;
                }
                btn.disabled = true;
                helpers.setLabel('下载中…');
                try {
                    const res = await SyncManager.executeSync({
                        mode: 'download',
                        config: cfg,
                        playerState: this.sm.playerCore?.options?.playerState
                    });
                    Toast(res.message || '已成功从云端恢复本机配置', 2400, 'success');
                    this.sm.syncState();
                    this.sm.createSettingsPanel({ reopenSubpage: 'webdav' });
                } catch (err) {
                    Toast((__('webdavSyncFailed') || '下载失败: ') + err.message, 3200, 'error');
                    banner._update({ title: '恢复失败', detail: err.message, badgeText: '失败', tone: 'error' });
                    btn.disabled = false;
                    helpers.setLabel('恢复本机');
                }
            }
        }));

        stack.appendChild(opsCard.getElement());
        return stack;
    }

    _refreshNavRow() {
        const summary = this._getWebDavSummary();
        if (this._webdavNavRow && typeof this._webdavNavRow._updateSummary === 'function') {
            this._webdavNavRow._updateSummary({
                text: summary.badgeText,
                tone: summary.tone,
                subtext: summary.subtext
            });
        }
    }

    _render() {
        this.element.innerHTML = '';
        this.element.appendChild(createGroupHeader(__('connectionsGroupTitle') || '同步与连接'));

        const card = new AppleCard();
        const summary = this._getWebDavSummary();

        this._webdavNavRow = createNavRow({
            iconHtml: ICON_CLOUD_SYNC,
            title: __('webdavNavTitle') || 'WebDAV 云同步',
            subtext: summary.subtext,
            badgeText: summary.badgeText,
            badgeTone: summary.tone,
            onClick: () => this._openWebDavSubpage()
        });
        card.appendChild(this._webdavNavRow);

        const peachRow = this.peachSection.getNavRow();
        peachRow.classList.toggle('is-hidden', !this.settings.betaMode);
        card.appendChild(peachRow);

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
