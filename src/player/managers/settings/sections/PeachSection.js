import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { PeachService, PEACH_WEBDAV_MODE_SYNC_DEFAULT, PEACH_WEBDAV_MODE_SYNC_CUSTOM, PEACH_WEBDAV_MODE_STANDALONE } from '../../../../services/PeachService.js';
import { SyncManager } from '../../../../sync/SyncManager.js';
import { Toast } from '../../../../utils/index.js';
import { PeachStreamHUD } from '../../../ui/PeachStreamHUD.js';

export class PeachSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group tm-peach-section';
        this.isExpanded = this.sm ? this.sm.isSectionExpanded('peachSync', false) : false;
        this.isConnected = false;
        this._render();
        this._checkInitialStatus();
    }

    getElement() {
        return this.element;
    }

    async _checkInitialStatus() {
        const config = PeachService.getConfig();
        if (config.base || config.origins.length > 0) {
            const res = await PeachService.testConnection();
            this.isConnected = Boolean(res && res.ok);
            this._updateStatusBadge();
        }
    }

    _updateStatusBadge() {
        const badge = this.element.querySelector('.tm-peach-status-badge');
        if (badge) {
            badge.classList.toggle('is-connected', this.isConnected);
            badge.textContent = this.isConnected ? '● 已连接' : '○ 未连接';
        }
    }

    _render() {
        this.element.innerHTML = '';
        const config = PeachService.getConfig();
        const syncWebDav = SyncManager.getWebDavConfig();
        const hasSync = Boolean(syncWebDav && syncWebDav.url && syncWebDav.user);

        const card = new AppleCard();

        // 1. 折叠 Header 行
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-apple-accordion-header';
        headerRow.innerHTML = `
            <div class="tm-apple-accordion-title">
                <span>🍑 Peach 联动与虚拟入库</span>
            </div>
            <div class="tm-apple-accordion-meta">
                <span class="tm-peach-status-badge ${this.isConnected ? 'is-connected' : ''}">
                    ${this.isConnected ? '● 已连接' : '○ 未连接'}
                </span>
                <span class="tm-apple-accordion-arrow ${this.isExpanded ? 'expanded' : ''}">▼</span>
            </div>
        `;
        card.appendChild(headerRow);

        // 2. 表单主体容器
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'tm-settings-subpanel-wrap tm-peach-body-wrap';
        bodyWrap.style.display = this.isExpanded ? 'block' : 'none';

        // 2.1 主开关
        const mainToggle = new ToggleRow({
            title: '启用 Peach 联动',
            subtext: '支持一键生成 .strm 虚拟文件落盘并通知 Peach 刮削',
            checked: Boolean(config.enabled),
            onChange: (checked) => {
                PeachService.saveConfig({ enabled: checked });
                Toast(checked ? '已开启 Peach 联动' : '已关闭 Peach 联动', 1200, 'info');
            }
        });
        bodyWrap.appendChild(mainToggle.getElement());

        // 2.2 一键配对快速粘贴区
        const pasteRow = document.createElement('div');
        pasteRow.className = 'tm-apple-row tm-peach-field-row';
        pasteRow.innerHTML = `
            <div class="tm-apple-row-title">一键配对信息</div>
            <div class="tm-apple-row-subtext">在 Peach 下载设置中复制专用配对信息，在此粘贴自动填充</div>
            <input type="text" class="tm-settings-input tm-peach-paste-input" placeholder='粘贴形如 {"peach_pairing":1, ...} 的配对内容' />
        `;
        const pasteInput = pasteRow.querySelector('.tm-peach-paste-input');
        bodyWrap.appendChild(pasteRow);

        // 2.3 服务器地址 (Base URL)
        const baseRow = document.createElement('div');
        baseRow.className = 'tm-apple-row tm-peach-field-row';
        const knownOriginsText = (config.origins && config.origins.length > 1)
            ? `<div class="tm-apple-row-subtext tm-peach-origins-text">已自动纳管候选入口: ${config.origins.join(' · ')}</div>`
            : '';
        baseRow.innerHTML = `
            <div class="tm-apple-row-title">Peach 服务端地址</div>
            <div class="tm-apple-row-subtext">自托管实例的 Web 访问地址（支持自动感知：访问过的公网映射、局域网IP均会自动池化并自愈切换）</div>
            <input type="text" class="tm-settings-input tm-peach-base-input" placeholder="https://peach.example.com 或 http://192.168.1.x:8000" value="${config.base || ''}" />
            ${knownOriginsText}
        `;
        const baseInput = baseRow.querySelector('.tm-peach-base-input');
        bodyWrap.appendChild(baseRow);

        // 2.4 专用令牌 (Token) + 显隐切换
        const tokenRow = document.createElement('div');
        tokenRow.className = 'tm-apple-row tm-peach-field-row';
        tokenRow.innerHTML = `
            <div class="tm-apple-row-title">专用令牌 (Token - 可选)</div>
            <div class="tm-apple-row-subtext">用于查询番号是否已在馆藏；若未在 Peach 绑定网盘云下载可留空，不影响 STRM 虚拟入库</div>
            <div class="tm-peach-token-wrap">
                <input type="password" class="tm-settings-input tm-peach-token-input" placeholder="留空或粘贴专用令牌" value="${config.token || ''}" />
                <button type="button" class="tm-settings-btn tm-peach-token-toggle">显示</button>
            </div>
        `;
        const tokenInput = tokenRow.querySelector('.tm-peach-token-input');
        const tokenToggleBtn = tokenRow.querySelector('.tm-peach-token-toggle');
        tokenToggleBtn.addEventListener('click', () => {
            const isPwd = tokenInput.type === 'password';
            tokenInput.type = isPwd ? 'text' : 'password';
            tokenToggleBtn.textContent = isPwd ? '隐藏' : '显示';
        });
        bodyWrap.appendChild(tokenRow);

        // 2.5 流网关配置 (Phase 19 升级)
        const gatewayRow = document.createElement('div');
        gatewayRow.className = 'tm-apple-row tm-peach-field-row';
        gatewayRow.innerHTML = `
            <div class="tm-apple-row-title">流网关基准地址 (Stream Gateway)</div>
            <div class="tm-apple-row-subtext">负责多源并发寻源、Referer 防盗链与 m3u8 切片代理 (同机推荐 http://host.docker.internal:8765)</div>
            <div class="tm-peach-gateway-wrap">
                <input type="text" class="tm-settings-input tm-peach-gateway-base-input" placeholder="http://host.docker.internal:8765" value="${config.gatewayBase || ''}" />
                <input type="text" class="tm-settings-input tm-peach-gateway-token-input" placeholder="播放 Token (默认 dev)" value="${config.gatewayToken || 'dev'}" />
                <button type="button" class="tm-settings-btn tm-peach-test-scraper-btn tm-peach-test-gateway-btn">测试流网关</button>
            </div>
        `;
        const gatewayBaseInput = gatewayRow.querySelector('.tm-peach-gateway-base-input');
        const gatewayTokenInput = gatewayRow.querySelector('.tm-peach-gateway-token-input');
        const testGatewayBtn = gatewayRow.querySelector('.tm-peach-test-gateway-btn');

        testGatewayBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const baseVal = gatewayBaseInput.value.trim();
            const tokenVal = gatewayTokenInput.value.trim() || 'dev';
            if (!baseVal) {
                Toast('请先输入流网关基准地址', 2000, 'warning');
                return;
            }

            testGatewayBtn.disabled = true;
            testGatewayBtn.textContent = '测试中…';

            try {
                const res = await PeachService.testGatewayConnection(baseVal, tokenVal);
                if (res.ok) {
                    Toast(`🎉 ${res.message} (注：此测试仅代表本机连通)`, 3500, 'success');
                    PeachService.saveConfig({ gatewayBase: baseVal, gatewayToken: tokenVal });
                } else {
                    Toast(`连接失败: ${res.error}`, 3500, 'error');
                }
            } catch (err) {
                Toast(`测试失败: ${err.message}`, 3500, 'error');
            } finally {
                testGatewayBtn.disabled = false;
                testGatewayBtn.textContent = '测试流网关';
            }
        });
        bodyWrap.appendChild(gatewayRow);

        // 2.6 STRM 入库存储模式 (WebDAV · Phase 19.8 三种模式)
        const storageRow = document.createElement('div');
        storageRow.className = 'tm-apple-row tm-peach-field-row';
        storageRow.innerHTML = `
            <div class="tm-apple-row-title">STRM 入库存储方式 (WebDAV)</div>
            <div class="tm-apple-row-subtext">生成 .strm 虚拟视频文件写入的 WebDAV 目录</div>
            <div class="tm-peach-webdav-segmented-container"></div>
            <div class="tm-peach-webdav-subpanels"></div>
        `;

        const segmentedContainer = storageRow.querySelector('.tm-peach-webdav-segmented-container');
        const subpanelsContainer = storageRow.querySelector('.tm-peach-webdav-subpanels');

        let currentMode = config.webdavMode || PEACH_WEBDAV_MODE_SYNC_DEFAULT;
        if (!hasSync) {
            currentMode = PEACH_WEBDAV_MODE_STANDALONE;
        }

        const renderSubpanels = (mode) => {
            subpanelsContainer.innerHTML = '';
            if (mode === PEACH_WEBDAV_MODE_SYNC_DEFAULT && hasSync) {
                const syncBase = syncWebDav.path || '/MissPlayer/';
                const normSync = syncBase.endsWith('/') ? syncBase : syncBase + '/';
                const p = document.createElement('div');
                p.className = 'tm-peach-mode-notice';
                p.innerHTML = `📂 <strong>模式 A（零配置默认）</strong>：复用当前同步配置，文件将直接写入：<br><code>${normSync}peach-media/</code><br><span style="color:rgba(255,255,255,0.5);font-size:11px;">请在 Peach 媒体库将该目录登记为来源</span>`;
                subpanelsContainer.appendChild(p);
            } else if (mode === PEACH_WEBDAV_MODE_SYNC_CUSTOM && hasSync) {
                const p = document.createElement('div');
                p.className = 'tm-peach-subpanel';
                p.innerHTML = `
                    <div class="tm-apple-row-subtext">模式 B：复用同步 WebDAV 账号，指定存储子目录</div>
                    <input type="text" class="tm-settings-input tm-peach-custom-dir-input" placeholder="/Media/STRM/" value="${config.webdavCustomDir || config.strmDir || '/Media/STRM/'}" />
                `;
                const customInput = p.querySelector('.tm-peach-custom-dir-input');
                customInput.addEventListener('change', () => {
                    PeachService.saveConfig({ webdavCustomDir: customInput.value.trim() });
                });
                subpanelsContainer.appendChild(p);
            } else {
                const p = document.createElement('div');
                p.className = 'tm-peach-subpanel';
                p.innerHTML = `
                    <div class="tm-apple-row-subtext">模式 C：独立 WebDAV 存储端点 (如 NAS 独立 WebDAV 或 CloudDrive2/Alist)</div>
                    <input type="text" class="tm-settings-input tm-peach-standalone-url" placeholder="WebDAV 服务地址 (如 http://192.168.2.250:5005)" value="${config.webdavStandaloneUrl || ''}" />
                    <div class="tm-peach-grid-2">
                        <input type="text" class="tm-settings-input tm-peach-standalone-user" placeholder="用户名" value="${config.webdavStandaloneUser || ''}" />
                        <input type="password" class="tm-settings-input tm-peach-standalone-pass" placeholder="密码" value="${config.webdavStandalonePass || ''}" />
                    </div>
                    <input type="text" class="tm-settings-input tm-peach-standalone-dir" placeholder="存放子目录 (如 /Media/STRM/)" value="${config.webdavStandaloneDir || '/Media/STRM/'}" />
                `;
                const urlIn = p.querySelector('.tm-peach-standalone-url');
                const userIn = p.querySelector('.tm-peach-standalone-user');
                const passIn = p.querySelector('.tm-peach-standalone-pass');
                const dirIn = p.querySelector('.tm-peach-standalone-dir');

                const saveStandalone = () => {
                    PeachService.saveConfig({
                        webdavStandaloneUrl: urlIn.value.trim(),
                        webdavStandaloneUser: userIn.value.trim(),
                        webdavStandalonePass: passIn.value,
                        webdavStandaloneDir: dirIn.value.trim()
                    });
                };
                urlIn.addEventListener('change', saveStandalone);
                userIn.addEventListener('change', saveStandalone);
                passIn.addEventListener('change', saveStandalone);
                dirIn.addEventListener('change', saveStandalone);
                subpanelsContainer.appendChild(p);
            }
        };

        if (hasSync) {
            const seg = new SegmentedControl({
                options: [
                    { label: '模式 A: 默认目录', value: PEACH_WEBDAV_MODE_SYNC_DEFAULT },
                    { label: '模式 B: 自定义目录', value: PEACH_WEBDAV_MODE_SYNC_CUSTOM },
                    { label: '模式 C: 独立 WebDAV', value: PEACH_WEBDAV_MODE_STANDALONE }
                ],
                value: currentMode,
                onChange: (modeVal) => {
                    PeachService.saveConfig({ webdavMode: modeVal });
                    renderSubpanels(modeVal);
                }
            });
            segmentedContainer.appendChild(seg.element);
        } else {
            const tip = document.createElement('div');
            tip.className = 'tm-apple-row-subtext';
            tip.textContent = '检测到尚未配置主同步 WebDAV，已自动采用独立配置模式：';
            segmentedContainer.appendChild(tip);
        }

        renderSubpanels(currentMode);
        bodyWrap.appendChild(storageRow);

        // 2.7 外部片源与授权 (JAVVerse)
        const jvRow = document.createElement('div');
        jvRow.className = 'tm-apple-row tm-peach-field-row';
        jvRow.innerHTML = `
            <div class="tm-apple-row-title">外部片源：JAVVerse (无码流出 / 高清)</div>
            <div class="tm-apple-row-subtext">优先寻获独家无码流出。若遇访客频控，点击前往登录以同步免登凭据</div>
            <div class="tm-peach-source-action-wrap">
                <button type="button" class="tm-settings-btn tm-peach-jv-login-btn">
                    前往 JAVVerse 登录 / 授权
                </button>
            </div>
        `;
        const jvLoginBtn = jvRow.querySelector('.tm-peach-jv-login-btn');
        jvLoginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const openUrl = 'https://javverse.com/en/auth/login';
            try {
                if (typeof GM_openInTab === 'function') {
                    GM_openInTab(openUrl, { active: true });
                } else {
                    window.open(openUrl, '_blank');
                }
            } catch (_) {
                window.open(openUrl, '_blank');
            }
            Toast('已打开 JAVVerse 登录页，登录完成后即可畅享无码流出版', 3500, 'info');
        });
        bodyWrap.appendChild(jvRow);

        // 2.8 操作按键区
        const actionRow = document.createElement('div');
        actionRow.className = 'tm-peach-action-row';
        actionRow.innerHTML = `
            <button type="button" class="tm-settings-btn tm-peach-action-btn tm-peach-test-btn">测试 Peach 连接</button>
            <button type="button" class="tm-settings-btn tm-peach-action-btn tm-peach-scan-btn">通知 Peach 扫描</button>
            <button type="button" class="tm-settings-btn tm-peach-action-btn tm-peach-hud-btn" title="查看寻源耗时、代理状态与播放事件">流诊断探针</button>
        `;
        const testBtn = actionRow.querySelector('.tm-peach-test-btn');
        const scanBtn = actionRow.querySelector('.tm-peach-scan-btn');
        const hudBtn = actionRow.querySelector('.tm-peach-hud-btn');
        bodyWrap.appendChild(actionRow);

        // 事件处理
        const handleSave = () => {
            PeachService.saveConfig({
                base: baseInput.value.trim(),
                token: tokenInput.value.trim(),
                gatewayBase: gatewayBaseInput.value.trim(),
                gatewayToken: gatewayTokenInput.value.trim()
            });
        };
        baseInput.addEventListener('change', handleSave);
        tokenInput.addEventListener('change', handleSave);
        gatewayBaseInput.addEventListener('change', handleSave);
        gatewayTokenInput.addEventListener('change', handleSave);

        // 配对信息自动识别
        pasteInput.addEventListener('paste', () => {
            setTimeout(() => {
                const parsed = PeachService.parsePairingText(pasteInput.value);
                if (parsed && parsed.base && parsed.token) {
                    baseInput.value = parsed.base;
                    tokenInput.value = parsed.token;
                    PeachService.saveConfig({
                        base: parsed.base,
                        token: parsed.token
                    });
                    pasteInput.value = '';
                    Toast('已成功解析并保存 Peach 配对信息', 1800, 'info');
                    testBtn.click();
                } else if (parsed && parsed.base) {
                    baseInput.value = parsed.base;
                    PeachService.saveConfig({ base: parsed.base });
                    Toast('已填入服务器地址，请继续填入专用令牌', 1800, 'info');
                }
            }, 50);
        });

        testBtn.addEventListener('click', async () => {
            handleSave();
            testBtn.disabled = true;
            testBtn.textContent = '测试中…';
            try {
                const res = await PeachService.testConnection();
                this.isConnected = Boolean(res && res.ok);
                this._updateStatusBadge();
                Toast(res.message, 2500, res.ok ? 'info' : 'error');
            } finally {
                testBtn.disabled = false;
                testBtn.textContent = '测试 Peach 连接';
            }
        });

        scanBtn.addEventListener('click', async () => {
            scanBtn.disabled = true;
            scanBtn.textContent = '通知中…';
            try {
                const res = await PeachService.triggerScan();
                if (res.ok) {
                    Toast('已向 Peach 发送媒体扫描请求', 2000, 'info');
                } else {
                    Toast(`通知失败: ${res.error}`, 2500, 'error');
                }
            } finally {
                scanBtn.disabled = false;
                scanBtn.textContent = '通知 Peach 扫描';
            }
        });

        hudBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const uiManager = this.sm?.uiManager || this.sm?.playerCore?.uiManager;
            const container = uiManager?.playerContainer;
            const shadow = uiManager?.shadowRoot;
            PeachStreamHUD.init(container, shadow);
            Toast('已打开视频流采集与播放诊断探针', 1800, 'info');
        });

        // 3. Header 点击手风琴展开/折叠
        headerRow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isExpanded = !this.isExpanded;
            if (this.sm) {
                this.sm.setSectionExpanded('peachSync', this.isExpanded);
            }
            bodyWrap.style.display = this.isExpanded ? 'block' : 'none';
            const arrow = headerRow.querySelector('.tm-apple-accordion-arrow');
            if (arrow) {
                arrow.classList.toggle('expanded', this.isExpanded);
            }
        });

        card.appendChild(bodyWrap);
        this.element.appendChild(card.getElement());
    }
}
