import {
    createGroup,
    createToggleRow,
    createSegmentedControl,
    createAccordionCard,
    createField,
    createPill,
    updatePill,
    bindTwoStepConfirm
} from '../components/S2Primitives.js';
import { SyncManager, WebDavClient, getOrCreateClientId, getDeviceName } from '../../../../sync/index.js';
import {
    PeachService,
    PEACH_WEBDAV_MODE_SYNC_DEFAULT,
    PEACH_WEBDAV_MODE_SYNC_CUSTOM,
    PEACH_WEBDAV_MODE_STANDALONE
} from '../../../../services/PeachService.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';
import {
    ICON_CLOUD_SYNC,
    ICON_CLOUD_UPLOAD,
    ICON_CLOUD_DOWNLOAD,
    ICON_EYE,
    ICON_EYE_OFF,
    ICON_CHECK,
    ICON_SERVER,
    ICON_REFRESH,
    ICON_PEACH
} from '../../../../constants/icons.js';

export class S2ConnectionsSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = createGroup(__('s2ConnectionsGroup') || '连接与同步');
        this.peachAccordion = null;
        this.cloudAccordion = null;
        this._peachCheckTimer = null;
        this._render();
    }

    getElement() {
        return this.element;
    }

    refresh() {
        this._render();
    }

    _formatSyncTime(ts) {
        if (!ts) return '尚未同步';
        const diffSec = Math.floor((Date.now() - ts) / 1000);
        if (diffSec < 60) return '刚刚';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
        const d = new Date(ts);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    _buildCloudSyncAccordion() {
        const config = SyncManager.getWebDavConfig();
        const hasConfig = WebDavClient.hasValidEndpoint(config);
        const isExpanded = this.sm ? this.sm.isSectionExpanded('s2_cloudSync', false) : false;

        const initialText = hasConfig ? (config.autoSync ? (__('webdavAutoSync') || '自动同步') : (__('s2Configured') || '已配置')) : (__('s2Unconfigured') || '未配置');
        const initialTone = hasConfig ? 'ok' : 'muted';

        this.cloudAccordion = createAccordionCard({
            iconSvg: ICON_CLOUD_SYNC,
            title: __('webdavTitle') || '云端同步 (WebDAV)',
            statusText: initialText,
            statusTone: initialTone,
            expanded: isExpanded,
            onToggle: (open) => {
                if (this.sm) this.sm.setSectionExpanded('s2_cloudSync', open);
            },
            buildBody: (body, { setStatus }) => {
                // 1. 自动同步开关
                const autoSyncRow = createToggleRow({
                    title: __('webdavAutoSync') || '自动同步',
                    checked: Boolean(config.autoSync),
                    onChange: (checked) => {
                        config.autoSync = checked;
                        SyncManager.saveWebDavConfig(config);
                        setStatus(
                            WebDavClient.hasValidEndpoint(config) ? (checked ? (__('webdavAutoSync') || '自动同步') : (__('s2Configured') || '已配置')) : (__('s2Unconfigured') || '未配置'),
                            WebDavClient.hasValidEndpoint(config) ? 'ok' : 'muted'
                        );
                    }
                });
                body.appendChild(autoSyncRow.element);

                // 2. 表单字段
                const form = document.createElement('div');
                form.className = 'mp-s2-form';

                const urlField = createField({
                    label: __('webdavServerUrl') || '服务器地址',
                    value: config.url || '',
                    placeholder: 'https://dav.example.com/dav/',
                    onChange: (val) => {
                        config.url = val.trim();
                        SyncManager.saveWebDavConfig(config);
                    }
                });

                const lanField = createField({
                    label: __('webdavLanUrl') || '备用 / 局域网地址 (选填)',
                    value: config.lanUrl || '',
                    placeholder: __('webdavLanUrlPlaceholder') || 'http://192.168.1.x:8080',
                    onChange: (val) => {
                        config.lanUrl = val.trim();
                        SyncManager.saveWebDavConfig(config);
                    }
                });

                const userField = createField({
                    label: __('webdavUsername') || '用户名',
                    value: config.username || '',
                    placeholder: 'account@example.com',
                    onChange: (val) => {
                        config.username = val.trim();
                        SyncManager.saveWebDavConfig(config);
                    }
                });

                let passVisible = false;
                const eyeBtn = document.createElement('button');
                eyeBtn.type = 'button';
                eyeBtn.className = 'mp-s2-icon-btn';
                eyeBtn.innerHTML = ICON_EYE;
                eyeBtn.title = '显示或隐藏密码';

                const passField = createField({
                    label: __('webdavPassword') || '密码 / 应用专用密码',
                    type: 'password',
                    value: config.password || '',
                    placeholder: '••••••••',
                    trailingEl: eyeBtn,
                    onChange: (val) => {
                        config.password = val;
                        SyncManager.saveWebDavConfig(config);
                    }
                });

                eyeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    passVisible = !passVisible;
                    passField.input.type = passVisible ? 'text' : 'password';
                    eyeBtn.innerHTML = passVisible ? ICON_EYE_OFF : ICON_EYE;
                });

                const pathField = createField({
                    label: __('webdavRemotePath') || '远端存储目录',
                    value: config.path || '/MissPlayer/',
                    placeholder: '/MissPlayer/',
                    onChange: (val) => {
                        config.path = val.trim() || '/MissPlayer/';
                        SyncManager.saveWebDavConfig(config);
                    }
                });

                const persistInputs = () => {
                    config.url = urlField.input.value.trim();
                    config.lanUrl = lanField.input.value.trim();
                    config.username = userField.input.value.trim();
                    config.password = passField.input.value;
                    config.path = pathField.input.value.trim() || '/MissPlayer/';
                    SyncManager.saveWebDavConfig(config);
                    const valid = WebDavClient.hasValidEndpoint(config);
                    setStatus(valid ? (config.autoSync ? '自动同步' : '已配置') : '未配置', valid ? 'ok' : 'muted');
                    return config;
                };

                // 3. 元信息行 (本机标识 + 上次同步时间)
                const metaLine = document.createElement('div');
                metaLine.className = 'mp-s2-meta-line';

                const deviceSpan = document.createElement('span');
                deviceSpan.textContent = `设备: ${getDeviceName()} (${getOrCreateClientId().slice(-6)})`;

                const timeSpan = document.createElement('span');
                const refreshTime = () => {
                    timeSpan.textContent = `上次: ${this._formatSyncTime(SyncManager.getLastSyncTime())}`;
                };
                refreshTime();

                metaLine.appendChild(deviceSpan);
                metaLine.appendChild(timeSpan);

                // 4. 状态提示框
                const statusBox = document.createElement('div');
                statusBox.className = 'mp-s2-status-box is-hidden';

                const showStatusBox = (msg, kind = 'ok') => {
                    statusBox.className = `mp-s2-status-box is-${kind}`;
                    statusBox.textContent = msg;
                };

                // 5. 四合一动作网格
                const actionsGrid = document.createElement('div');
                actionsGrid.className = 'mp-s2-actions';

                const testBtn = document.createElement('button');
                testBtn.type = 'button';
                testBtn.className = 'mp-s2-btn';
                testBtn.innerHTML = `${ICON_CHECK} <span>${__('webdavTestConn') || '测试连接'}</span>`;

                const mergeBtn = document.createElement('button');
                mergeBtn.type = 'button';
                mergeBtn.className = 'mp-s2-btn mp-s2-btn--primary';
                mergeBtn.innerHTML = `${ICON_REFRESH} <span>${__('webdavSyncMerge') || '合并同步'}</span>`;

                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'mp-s2-btn';
                const uploadNormalHtml = `${ICON_CLOUD_UPLOAD} <span>${__('webdavUploadOverwrite') || '上传覆盖'}</span>`;
                uploadBtn.innerHTML = uploadNormalHtml;

                const downloadBtn = document.createElement('button');
                downloadBtn.type = 'button';
                downloadBtn.className = 'mp-s2-btn';
                const downloadNormalHtml = `${ICON_CLOUD_DOWNLOAD} <span>${__('webdavDownloadOverwrite') || '恢复备份'}</span>`;
                downloadBtn.innerHTML = downloadNormalHtml;

                const setBusy = (busy) => {
                    [testBtn, mergeBtn, uploadBtn, downloadBtn].forEach(b => { b.disabled = busy; });
                };

                testBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const cfg = persistInputs();
                    if (!WebDavClient.hasValidEndpoint(cfg)) {
                        showStatusBox('请输入 WebDAV 服务器地址', 'err');
                        return;
                    }
                    setBusy(true);
                    showStatusBox('正在检测 WebDAV 连通性…', 'running');
                    try {
                        const res = await SyncManager.testConnection(cfg);
                        if (res && res.success) {
                            showStatusBox(res.message || '连接成功', 'ok');
                            setStatus('连接正常', 'ok');
                        } else {
                            showStatusBox(res?.message || '连接失败', 'err');
                            setStatus('连接异常', 'err');
                        }
                    } catch (err) {
                        showStatusBox(err.message || '连接失败', 'err');
                        setStatus('连接异常', 'err');
                    } finally {
                        setBusy(false);
                    }
                });

                mergeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const cfg = persistInputs();
                    if (!WebDavClient.hasValidEndpoint(cfg)) {
                        showStatusBox('请输入 WebDAV 服务器地址', 'err');
                        return;
                    }
                    setBusy(true);
                    showStatusBox('正在执行双端增量合并…', 'running');
                    try {
                        const res = await SyncManager.executeSync({
                            mode: 'merge',
                            config: cfg,
                            playerState: this.sm.playerCore?.options?.playerState
                        });
                        showStatusBox(res.message || '合并同步成功', 'ok');
                        refreshTime();
                        this.sm.syncState();
                        Toast(res.message || '合并同步成功', 2200, 'success');
                    } catch (err) {
                        showStatusBox(err.message || '同步失败', 'err');
                    } finally {
                        setBusy(false);
                    }
                });

                bindTwoStepConfirm(uploadBtn, {
                    normalHtml: uploadNormalHtml,
                    confirmText: '确认上传覆盖?',
                    onConfirm: async () => {
                        const cfg = persistInputs();
                        if (!WebDavClient.hasValidEndpoint(cfg)) {
                            showStatusBox('请输入 WebDAV 服务器地址', 'err');
                            return;
                        }
                        setBusy(true);
                        showStatusBox('正在上传本地配置覆盖云端…', 'running');
                        try {
                            const res = await SyncManager.executeSync({
                                mode: 'upload',
                                config: cfg,
                                playerState: this.sm.playerCore?.options?.playerState
                            });
                            showStatusBox(res.message || '已成功覆盖云端备份', 'ok');
                            refreshTime();
                        } catch (err) {
                            showStatusBox(err.message || '上传失败', 'err');
                        } finally {
                            setBusy(false);
                        }
                    }
                });

                bindTwoStepConfirm(downloadBtn, {
                    normalHtml: downloadNormalHtml,
                    confirmText: '确认拉取覆盖?',
                    onConfirm: async () => {
                        const cfg = persistInputs();
                        if (!WebDavClient.hasValidEndpoint(cfg)) {
                            showStatusBox('请输入 WebDAV 服务器地址', 'err');
                            return;
                        }
                        setBusy(true);
                        showStatusBox('正在从云端恢复并覆盖本地…', 'running');
                        try {
                            const res = await SyncManager.executeSync({
                                mode: 'download',
                                config: cfg,
                                playerState: this.sm.playerCore?.options?.playerState
                            });
                            showStatusBox(res.message || '已恢复云端备份', 'ok');
                            refreshTime();
                            this.sm.syncState();
                        } catch (err) {
                            showStatusBox(err.message || '拉取失败', 'err');
                        } finally {
                            setBusy(false);
                        }
                    }
                });

                actionsGrid.appendChild(testBtn);
                actionsGrid.appendChild(mergeBtn);
                actionsGrid.appendChild(uploadBtn);
                actionsGrid.appendChild(downloadBtn);

                form.appendChild(urlField.element);
                form.appendChild(lanField.element);
                form.appendChild(userField.element);
                form.appendChild(passField.element);
                form.appendChild(pathField.element);
                form.appendChild(metaLine);
                form.appendChild(actionsGrid);
                form.appendChild(statusBox);
                body.appendChild(form);
            }
        });

        return this.cloudAccordion.element;
    }

    _openPeachWeb(targetUrl) {
        const clean = PeachService.sanitizeBaseUrl(targetUrl);
        if (!clean) {
            Toast('请先填写或选择有效的 Peach 服务地址', 2000, 'warning');
            return;
        }
        Toast('正在前往 Peach Web，进入后将自动签发并配对', 2000, 'info');
        if (typeof GM_openInTab === 'function') {
            GM_openInTab(clean, { active: true, insert: true });
        } else if (typeof GM !== 'undefined' && GM && typeof GM.openInTab === 'function') {
            GM.openInTab(clean, { active: true, insert: true });
        } else {
            window.open(clean, '_blank');
        }
    }

    _buildPeachAccordion() {
        const config = PeachService.getConfig();
        const isExpanded = this.sm ? this.sm.isSectionExpanded('s2_peach', false) : false;

        const initialText = config.enabled ? (PeachService.hasDedicatedToken() ? '已配置' : '待配对') : '未启用';
        const initialTone = config.enabled ? (PeachService.hasDedicatedToken() ? 'ok' : 'warn') : 'muted';

        const scheduleStatusCheck = (setPillStatus) => {
            if (this._peachCheckTimer) clearTimeout(this._peachCheckTimer);
            setPillStatus('测试中…', 'info');
            this._peachCheckTimer = setTimeout(async () => {
                const res = await PeachService.testConnection();
                if (res && res.ok) {
                    setPillStatus(res.status === 'full' ? '全功能已连' : '仅入库', 'ok');
                } else {
                    const latest = PeachService.getConfig();
                    setPillStatus(latest.enabled ? '未连通' : '未启用', latest.enabled ? 'err' : 'muted');
                }
            }, 350);
        };

        this.peachAccordion = createAccordionCard({
            iconSvg: ICON_PEACH,
            title: 'Peach 入库',
            statusText: initialText,
            statusTone: initialTone,
            expanded: isExpanded,
            onToggle: (open) => {
                if (this.sm) this.sm.setSectionExpanded('s2_peach', open);
                if (open && this.peachAccordion) {
                    scheduleStatusCheck((t, tone) => this.peachAccordion.setStatus(t, tone));
                }
            },
            buildBody: (body, { setStatus }) => {
                const refreshPeachButtons = () => {
                    const uiManager = this.sm?.uiManager || this.sm?.playerCore?.uiManager;
                    if (uiManager && typeof uiManager.updatePeachButtonVisibility === 'function') {
                        uiManager.updatePeachButtonVisibility();
                    }
                };

                // 1. 主启用开关（不再依赖 betaMode）
                const enableRow = createToggleRow({
                    title: '启用 Peach 入库',
                    subtext: '顶栏显示一键入库胶囊，通过 WebDAV 写入 .strm',
                    checked: Boolean(config.enabled),
                    onChange: (checked) => {
                        PeachService.saveConfig({ enabled: checked });
                        refreshPeachButtons();
                        if (checked) {
                            scheduleStatusCheck(setStatus);
                        } else {
                            setStatus('未启用', 'muted');
                        }
                    }
                });
                body.appendChild(enableRow.element);

                // 2. 表单区
                const form = document.createElement('div');
                form.className = 'mp-s2-form';

                const clearBaseBtn = document.createElement('button');
                clearBaseBtn.type = 'button';
                clearBaseBtn.className = `mp-s2-btn mp-s2-btn--danger mp-s2-btn--sm ${config.base ? '' : 'is-hidden'}`.trim();
                clearBaseBtn.textContent = '删除';

                const tokenStatusRow = document.createElement('div');
                tokenStatusRow.className = 'mp-s2-meta-line';

                const originsWrap = document.createElement('div');
                originsWrap.className = 'mp-s2-chips';

                const baseField = createField({
                    label: 'Peach 服务地址 (支持直接粘贴配对 JSON)',
                    value: config.base || '',
                    placeholder: 'http://192.168.1.x:8000',
                    trailingEl: clearBaseBtn,
                    onInput: (val) => {
                        clearBaseBtn.classList.toggle('is-hidden', !val.trim());
                    }
                });

                const renderTokenRow = () => {
                    tokenStatusRow.innerHTML = '';
                    const latest = PeachService.getConfig();
                    const curBase = baseField.input.value.trim() || latest.base;
                    if (!curBase) return;

                    const hasToken = PeachService.hasDedicatedToken();
                    const pill = createPill(hasToken ? '专用令牌已绑定' : '未获取专用令牌', hasToken ? 'ok' : 'warn');
                    const actionBtn = document.createElement('button');
                    actionBtn.type = 'button';
                    actionBtn.className = 'mp-s2-btn';
                    actionBtn.textContent = hasToken ? '重新获取' : '打开 Peach 配对';

                    actionBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const target = baseField.input.value.trim() || PeachService.getConfig().base;
                        if (hasToken && typeof window !== 'undefined' && window.location?.origin === target) {
                            actionBtn.disabled = true;
                            const res = await PeachService.acquireDedicatedToken(target);
                            actionBtn.disabled = false;
                            Toast(res?.ok ? '令牌已刷新' : (res?.message || '获取失败'), 1800, res?.ok ? 'success' : 'warning');
                            renderTokenRow();
                            scheduleStatusCheck(setStatus);
                        } else {
                            this._openPeachWeb(target);
                        }
                    });

                    tokenStatusRow.appendChild(pill);
                    tokenStatusRow.appendChild(actionBtn);
                };

                const renderOriginChips = () => {
                    originsWrap.innerHTML = '';
                    const origins = PeachService.getOrigins();
                    const active = PeachService.getConfig().base;
                    if (!origins || origins.length === 0) return;

                    origins.forEach(origin => {
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = `mp-s2-chip ${origin === active ? 'is-active' : ''}`.trim();

                        const lbl = document.createElement('span');
                        lbl.textContent = origin.replace(/^https?:\/\//, '');
                        chip.appendChild(lbl);

                        const rm = document.createElement('span');
                        rm.className = 'mp-s2-chip-remove';
                        rm.textContent = '×';
                        rm.addEventListener('click', (e) => {
                            e.stopPropagation();
                            PeachService.removeOrigin(origin);
                            const nextCfg = PeachService.getConfig();
                            baseField.input.value = nextCfg.base || '';
                            clearBaseBtn.classList.toggle('is-hidden', !baseField.input.value.trim());
                            renderOriginChips();
                            renderTokenRow();
                            scheduleStatusCheck(setStatus);
                        });
                        chip.appendChild(rm);

                        chip.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (origin !== active) {
                                PeachService.setActiveBase(origin);
                                baseField.input.value = origin;
                                clearBaseBtn.classList.remove('is-hidden');
                                renderOriginChips();
                                renderTokenRow();
                                scheduleStatusCheck(setStatus);
                            }
                        });

                        originsWrap.appendChild(chip);
                    });
                };

                const handleBaseCommit = () => {
                    const raw = baseField.input.value.trim();
                    if (raw.startsWith('{') && raw.endsWith('}')) {
                        try {
                            const parsed = JSON.parse(raw);
                            if (parsed.base || parsed.url) {
                                const newBase = PeachService.sanitizeBaseUrl(parsed.base || parsed.url);
                                PeachService.saveConfig({
                                    base: newBase,
                                    token: parsed.token || PeachService.getConfig().token,
                                    enabled: true
                                });
                                baseField.input.value = newBase;
                                enableRow.setChecked(true, false);
                                Toast('已导入 Peach 配对信息', 1800, 'success');
                            }
                        } catch (_) {}
                    } else {
                        const clean = PeachService.sanitizeBaseUrl(raw);
                        PeachService.saveConfig({ base: clean });
                        baseField.input.value = clean;
                    }
                    clearBaseBtn.classList.toggle('is-hidden', !baseField.input.value.trim());
                    refreshPeachButtons();
                    renderOriginChips();
                    renderTokenRow();
                    scheduleStatusCheck(setStatus);
                };

                baseField.input.addEventListener('change', handleBaseCommit);
                baseField.input.addEventListener('paste', () => setTimeout(handleBaseCommit, 50));

                clearBaseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    PeachService.clearBase();
                    baseField.input.value = '';
                    clearBaseBtn.classList.add('is-hidden');
                    refreshPeachButtons();
                    renderOriginChips();
                    renderTokenRow();
                    setStatus('未启用', 'muted');
                });

                // 3. 流网关配置
                const gwBaseField = createField({
                    label: '流网关地址',
                    value: config.gatewayBase || '',
                    placeholder: 'http://host.docker.internal:8765',
                    onChange: (val) => {
                        PeachService.saveConfig({ gatewayBase: val.trim() });
                        scheduleStatusCheck(setStatus);
                    }
                });

                const gwTokenField = createField({
                    label: '网关播放 Token',
                    value: config.gatewayToken || 'dev',
                    placeholder: 'dev',
                    onChange: (val) => {
                        PeachService.saveConfig({ gatewayToken: val.trim() || 'dev' });
                        scheduleStatusCheck(setStatus);
                    }
                });

                // 4. WebDAV 写入模式
                const syncWebDav = SyncManager.getWebDavConfig();
                const hasSync = WebDavClient.hasValidEndpoint(syncWebDav);
                let activeMode = config.webdavMode || PEACH_WEBDAV_MODE_SYNC_DEFAULT;
                if (!hasSync) activeMode = PEACH_WEBDAV_MODE_STANDALONE;

                const subpanelHost = document.createElement('div');
                subpanelHost.className = 'mp-s2-conditional';

                const renderStorageModeSub = (mode) => {
                    subpanelHost.innerHTML = '';
                    if (mode === PEACH_WEBDAV_MODE_SYNC_DEFAULT && hasSync) {
                        const base = syncWebDav.path || '/MissPlayer/';
                        const norm = base.endsWith('/') ? base : `${base}/`;
                        const note = document.createElement('div');
                        note.className = 'mp-s2-status-box';
                        note.textContent = `模式 A：复用主同步网盘，写入 ${norm}peach-media/`;
                        subpanelHost.appendChild(note);
                    } else if (mode === PEACH_WEBDAV_MODE_SYNC_CUSTOM && hasSync) {
                        const dirField = createField({
                            label: '自定义存放子目录 (模式 B)',
                            value: config.webdavCustomDir || config.strmDir || '/Media/STRM/',
                            placeholder: '/Media/STRM/',
                            onChange: (val) => PeachService.saveConfig({ webdavCustomDir: val.trim() })
                        });
                        subpanelHost.appendChild(dirField.element);
                    } else {
                        const sUrl = createField({
                            label: '独立 WebDAV 主地址 (模式 C)',
                            value: config.webdavStandaloneUrl || '',
                            placeholder: 'https://dav.example.com/dav/'
                        });
                        const sLan = createField({
                            label: '独立备用 / 局域网地址 (选填)',
                            value: config.webdavStandaloneLanUrl || '',
                            placeholder: 'http://192.168.1.x:8080'
                        });
                        const sUser = createField({
                            label: '用户名',
                            value: config.webdavStandaloneUser || '',
                            placeholder: '用户名'
                        });
                        const sPass = createField({
                            label: '密码',
                            type: 'password',
                            value: config.webdavStandalonePass || '',
                            placeholder: '••••••••'
                        });
                        const sDir = createField({
                            label: '存放子目录',
                            value: config.webdavStandaloneDir || '/Media/STRM/',
                            placeholder: '/Media/STRM/'
                        });
                        const saveStandalone = () => {
                            PeachService.saveConfig({
                                webdavStandaloneUrl: sUrl.input.value.trim(),
                                webdavStandaloneLanUrl: sLan.input.value.trim(),
                                webdavStandaloneUser: sUser.input.value.trim(),
                                webdavStandalonePass: sPass.input.value,
                                webdavStandaloneDir: sDir.input.value.trim()
                            });
                        };
                        [sUrl, sLan, sUser, sPass, sDir].forEach(f => {
                            f.input.addEventListener('change', saveStandalone);
                            subpanelHost.appendChild(f.element);
                        });
                    }
                };

                const modeWrap = document.createElement('div');
                modeWrap.className = 'mp-s2-field';
                const modeLbl = document.createElement('label');
                modeLbl.className = 'mp-s2-field-label';
                modeLbl.textContent = 'STRM 写入方式';
                modeWrap.appendChild(modeLbl);

                if (hasSync) {
                    const seg = createSegmentedControl({
                        fullWidth: true,
                        options: [
                            { label: '复用默认', value: PEACH_WEBDAV_MODE_SYNC_DEFAULT },
                            { label: '自定义目录', value: PEACH_WEBDAV_MODE_SYNC_CUSTOM },
                            { label: '独立网盘', value: PEACH_WEBDAV_MODE_STANDALONE }
                        ],
                        value: activeMode,
                        onChange: (val) => {
                            PeachService.saveConfig({ webdavMode: val });
                            renderStorageModeSub(val);
                        }
                    });
                    modeWrap.appendChild(seg.element);
                }

                renderTokenRow();
                renderOriginChips();
                renderStorageModeSub(activeMode);

                // 5. 测试连接按钮
                const actionRow = document.createElement('div');
                actionRow.className = 'mp-s2-actions mp-s2-actions--single';

                const testPeachBtn = document.createElement('button');
                testPeachBtn.type = 'button';
                testPeachBtn.className = 'mp-s2-btn mp-s2-btn--primary';
                testPeachBtn.innerHTML = `${ICON_SERVER} <span>测试 Peach 与网关连通性</span>`;
                testPeachBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    testPeachBtn.disabled = true;
                    setStatus('测试中…', 'info');
                    const res = await PeachService.testConnection();
                    testPeachBtn.disabled = false;
                    if (res && res.ok) {
                        setStatus(res.status === 'full' ? '全功能已连' : '仅入库', 'ok');
                        Toast(res.message || 'Peach 连通正常', 2000, 'success');
                    } else {
                        setStatus('未连通', 'err');
                        Toast(res?.message || '连接失败', 2500, 'warning');
                    }
                });
                actionRow.appendChild(testPeachBtn);

                form.appendChild(baseField.element);
                form.appendChild(tokenStatusRow);
                form.appendChild(originsWrap);
                form.appendChild(gwBaseField.element);
                form.appendChild(gwTokenField.element);
                form.appendChild(modeWrap);
                form.appendChild(subpanelHost);
                form.appendChild(actionRow);
                body.appendChild(form);
            }
        });

        return this.peachAccordion.element;
    }

    _render() {
        const oldLabel = this.element.querySelector('.mp-s2-group-label');
        this.element.innerHTML = '';
        if (oldLabel) this.element.appendChild(oldLabel);

        this.element.appendChild(this._buildCloudSyncAccordion());
        this.element.appendChild(this._buildPeachAccordion());
    }
}
