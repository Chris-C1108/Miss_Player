import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { SegmentedControl } from '../components/SegmentedControl.js';
import { PeachService, PEACH_WEBDAV_MODE_SYNC_DEFAULT, PEACH_WEBDAV_MODE_SYNC_CUSTOM, PEACH_WEBDAV_MODE_STANDALONE } from '../../../../services/PeachService.js';
import { SyncManager, WebDavClient } from '../../../../sync/index.js';
import { Toast } from '../../../../utils/index.js';

export class PeachSection {
    constructor(settingsManager) {
        this.sm = settingsManager;
        this.settings = settingsManager.settings;
        this.element = document.createElement('div');
        this.element.className = 'tm-settings-group tm-peach-section';
        this.isExpanded = this.sm ? this.sm.isSectionExpanded('peachSync', false) : false;
        this.isConnected = false;
        this.connectionStatus = 'none'; // 'none' | 'strm_only' | 'full'
        this._checkDebounce = null;
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
            this.connectionStatus = res && res.ok ? (res.status === 'full' ? 'full' : 'strm_only') : 'none';
            this._updateStatusBadge();
        }
    }

    _autoCheckStatus() {
        if (this._checkDebounce) clearTimeout(this._checkDebounce);
        this._checkDebounce = setTimeout(async () => {
            const badge = this.element.querySelector('.tm-peach-status-badge');
            if (badge) {
                badge.textContent = '测试中…';
                badge.className = 'tm-peach-status-badge is-testing';
            }
            const res = await PeachService.testConnection();
            this.isConnected = Boolean(res && res.ok);
            this.connectionStatus = res && res.ok ? (res.status === 'full' ? 'full' : 'strm_only') : 'none';
            this._updateStatusBadge();
            this._refreshActiveTokenWrap();
        }, 600);
    }

    _updateStatusBadge() {
        const badge = this.element.querySelector('.tm-peach-status-badge');
        if (badge) {
            badge.classList.remove('is-testing', 'is-connected', 'is-strm-only');
            if (this.connectionStatus === 'full') {
                badge.classList.add('is-connected');
                badge.textContent = '● 全功能就绪';
            } else if (this.connectionStatus === 'strm_only') {
                badge.classList.add('is-strm-only');
                badge.textContent = '◐ 仅 STRM 模式';
            } else {
                badge.textContent = '○ 未连接';
            }
        }
    }

    _refreshActiveTokenWrap() {
        const wrap = this.element.querySelector('.tm-peach-token-status-wrap');
        const baseInput = this.element.querySelector('.tm-peach-base-input');
        if (wrap) {
            this._renderTokenStatusWrap(wrap, baseInput);
        }
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

    _renderTokenStatusWrap(container, baseInput = null) {
        container.innerHTML = '';
        const config = PeachService.getConfig();
        const currentBase = (baseInput ? baseInput.value.trim() : '') || config.base;
        if (!currentBase) return;

        const hasToken = PeachService.hasDedicatedToken();

        if (hasToken) {
            const badgeRow = document.createElement('div');
            badgeRow.className = 'tm-peach-token-badge-row';
            badgeRow.innerHTML = `
                <span class="tm-peach-token-tag">● 专用令牌已安全绑定 (全功能就绪)</span>
                <button type="button" class="tm-peach-reissue-btn">重新获取</button>
            `;
            const reissueBtn = badgeRow.querySelector('.tm-peach-reissue-btn');
            reissueBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                reissueBtn.disabled = true;
                reissueBtn.textContent = '获取中…';
                
                const isSameOrigin = typeof window !== 'undefined' && window.location && window.location.origin === currentBase;
                if (isSameOrigin) {
                    const res = await PeachService.acquireDedicatedToken(currentBase);
                    if (res && res.ok) {
                        Toast('专用令牌已更新并持久化', 1500, 'success');
                    } else {
                        Toast(res?.message || '获取失败', 2000, 'warning');
                    }
                    this._autoCheckStatus();
                } else {
                    this._openPeachWeb(currentBase);
                    reissueBtn.disabled = false;
                    reissueBtn.textContent = '重新获取';
                }
            });
            container.appendChild(badgeRow);
        } else {
            const tipWrap = document.createElement('div');
            tipWrap.className = 'tm-peach-auto-token-tip';
            tipWrap.innerHTML = `
                <div class="tm-peach-auto-token-text">
                    💡 <strong>免输入专用令牌</strong>：进入 Peach Web 即可通过同源会话无感自动获取并保存 Dedicated Token，享受在库状态秒级感知。
                </div>
                <button type="button" class="tm-peach-open-web-btn">🍑 打开 Peach 自动配对</button>
            `;
            const openBtn = tipWrap.querySelector('.tm-peach-open-web-btn');
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const latestBase = (baseInput ? baseInput.value.trim() : '') || config.base;
                this._openPeachWeb(latestBase);
            });
            container.appendChild(tipWrap);
        }
    }

    _renderOriginsList(container, baseInput) {
        container.innerHTML = '';
        const origins = PeachService.getOrigins();
        const activeBase = PeachService.getConfig().base;
        if (!origins || origins.length === 0) return;

        const listWrap = document.createElement('div');
        listWrap.className = 'tm-peach-origins-wrap';

        const title = document.createElement('div');
        title.className = 'tm-peach-origins-title';
        title.innerHTML = `<span>历史服务地址 (${origins.length})</span>`;
        listWrap.appendChild(title);

        const listEl = document.createElement('div');
        listEl.className = 'tm-peach-origins-list';

        origins.forEach(origin => {
            const item = document.createElement('div');
            item.className = 'tm-peach-origin-item' + (origin === activeBase ? ' is-active' : '');

            if (origin === activeBase) {
                const activeTag = document.createElement('span');
                activeTag.className = 'tm-peach-origin-active-tag';
                activeTag.textContent = '当前';
                item.appendChild(activeTag);
            }

            const label = document.createElement('span');
            label.className = 'tm-peach-origin-url';
            label.textContent = origin;
            label.title = origin === activeBase ? '当前活跃地址' : '点击切换为此地址';
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                if (origin !== activeBase) {
                    PeachService.setActiveBase(origin);
                    if (baseInput) baseInput.value = origin;
                    this._autoCheckStatus();
                    this._renderOriginsList(container, baseInput);
                    this._refreshActiveTokenWrap();
                    Toast(`已切换首选地址: ${origin}`, 1500, 'info');
                }
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'tm-peach-origin-del-btn';
            delBtn.title = '删除此记录';
            delBtn.innerHTML = '×';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                PeachService.removeOrigin(origin);
                const newConfig = PeachService.getConfig();
                if (baseInput) baseInput.value = newConfig.base || '';
                this._autoCheckStatus();
                this._renderOriginsList(container, baseInput);
                this._refreshActiveTokenWrap();
                Toast('已删除历史记录', 1200, 'info');
            });

            item.appendChild(label);
            item.appendChild(delBtn);
            listEl.appendChild(item);
        });

        listWrap.appendChild(listEl);
        container.appendChild(listWrap);
    }

    _render() {
        this.element.innerHTML = '';
        const config = PeachService.getConfig();
        const syncWebDav = SyncManager.getWebDavConfig();
        const hasSync = Boolean(WebDavClient.hasValidEndpoint(syncWebDav) && syncWebDav.user);

        const card = new AppleCard();

        // 1. 折叠 Header 行 (状态指示灯展示自动测试结果)
        const headerRow = document.createElement('div');
        headerRow.className = 'tm-apple-accordion-header';
        headerRow.innerHTML = `
            <div class="tm-apple-accordion-title">
                <span>🍑 Peach 虚拟入库</span>
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
            subtext: '生成 .strm 文件写入媒体库',
            checked: Boolean(config.enabled),
            onChange: (checked) => {
                PeachService.saveConfig({ enabled: checked });
                const uiManager = this.sm?.uiManager || this.sm?.playerCore?.uiManager;
                if (uiManager && typeof uiManager.updatePeachButtonVisibility === 'function') {
                    uiManager.updatePeachButtonVisibility();
                }
                Toast(checked ? '已开启 Peach 联动' : '已关闭 Peach 联动', 1200, 'info');
            }
        });
        bodyWrap.appendChild(mainToggle.getElement());

        // 2.2 Peach 服务地址 (带记录删除按钮与直接粘贴配对 JSON 识别)
        const baseRow = document.createElement('div');
        baseRow.className = 'tm-apple-row tm-peach-field-row';
        baseRow.innerHTML = `
            <div class="tm-apple-row-title">Peach 服务地址</div>
            <div class="tm-apple-row-subtext">自托管实例 Web 地址 (进入站点自动免输签发令牌)</div>
            <div class="tm-peach-input-with-action">
                <input type="text" class="tm-settings-input tm-peach-base-input" placeholder="http://192.168.1.x:8000" value="${config.base || ''}" />
                <button type="button" class="tm-peach-delete-btn" style="display: ${config.base ? 'block' : 'none'};">删除</button>
            </div>
            <div class="tm-peach-token-status-wrap"></div>
            <div class="tm-peach-origins-container"></div>
        `;
        const baseInput = baseRow.querySelector('.tm-peach-base-input');
        const deleteBtn = baseRow.querySelector('.tm-peach-delete-btn');
        const tokenStatusWrap = baseRow.querySelector('.tm-peach-token-status-wrap');
        const originsContainer = baseRow.querySelector('.tm-peach-origins-container');
        this._renderTokenStatusWrap(tokenStatusWrap, baseInput);
        this._renderOriginsList(originsContainer, baseInput);

        // 删除按钮：清除已记录域名与 Token，重置连通状态
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            PeachService.clearBase();
            baseInput.value = '';
            deleteBtn.style.display = 'none';
            this.isConnected = false;
            this.connectionStatus = 'none';
            this._updateStatusBadge();
            this._renderTokenStatusWrap(tokenStatusWrap, baseInput);
            this._renderOriginsList(originsContainer, baseInput);
            const uiManager = this.sm?.uiManager || this.sm?.playerCore?.uiManager;
            if (uiManager && typeof uiManager.updatePeachButtonVisibility === 'function') {
                uiManager.updatePeachButtonVisibility();
            }
            Toast('已清除 Peach 服务地址', 1500, 'info');
        });

        // 地址输入变化与粘贴处理（支持 JSON 自动拆解与免密自动感知）
        const handleBaseChange = () => {
            const rawVal = baseInput.value.trim();
            deleteBtn.style.display = rawVal ? 'block' : 'none';

            const parsed = PeachService.parsePairingText(rawVal);
            if (parsed && parsed.base) {
                baseInput.value = parsed.base;
                PeachService.saveConfig({
                    base: parsed.base,
                    token: parsed.token || ''
                });
                Toast('已自动识别配对信息', 1800, 'success');
            } else {
                PeachService.saveConfig({ base: rawVal });
            }
            this._renderTokenStatusWrap(tokenStatusWrap, baseInput);
            this._renderOriginsList(originsContainer, baseInput);
            this._autoCheckStatus();
        };

        baseInput.addEventListener('change', handleBaseChange);
        baseInput.addEventListener('input', () => {
            deleteBtn.style.display = baseInput.value.trim() ? 'block' : 'none';
        });
        baseInput.addEventListener('paste', () => {
            setTimeout(handleBaseChange, 50);
        });

        bodyWrap.appendChild(baseRow);

        // 2.3 流网关配置 (Phase 19 核心：局域网/host.docker.internal，Token 环境变量配置默认 dev)
        const gatewayRow = document.createElement('div');
        gatewayRow.className = 'tm-apple-row tm-peach-field-row';
        gatewayRow.innerHTML = `
            <div class="tm-apple-row-title">流网关地址</div>
            <div class="tm-apple-row-subtext">Peach 服务端可访问的网关地址（支持局域网 IP / host.docker.internal）。播放 Token 需在部署网关时环境变量配置（默认 dev）</div>
            <div class="tm-peach-gateway-wrap">
                <input type="text" class="tm-settings-input tm-peach-gateway-base-input" placeholder="http://host.docker.internal:8765" value="${config.gatewayBase || ''}" />
                <input type="text" class="tm-settings-input tm-peach-gateway-token-input" placeholder="播放 Token (默认 dev)" value="${config.gatewayToken || 'dev'}" />
            </div>
        `;
        const gatewayBaseInput = gatewayRow.querySelector('.tm-peach-gateway-base-input');
        const gatewayTokenInput = gatewayRow.querySelector('.tm-peach-gateway-token-input');

        const handleGatewayChange = () => {
            PeachService.saveConfig({
                gatewayBase: gatewayBaseInput.value.trim(),
                gatewayToken: gatewayTokenInput.value.trim()
            });
            this._autoCheckStatus();
        };
        gatewayBaseInput.addEventListener('change', handleGatewayChange);
        gatewayTokenInput.addEventListener('change', handleGatewayChange);

        bodyWrap.appendChild(gatewayRow);

        // 2.4 STRM 入库存储模式 (WebDAV · Phase 19.8 三种模式)
        const storageRow = document.createElement('div');
        storageRow.className = 'tm-apple-row tm-peach-field-row';
        storageRow.innerHTML = `
            <div class="tm-apple-row-title">STRM 存储目录</div>
            <div class="tm-apple-row-subtext">写入 .strm 虚拟文件的 WebDAV 路径</div>
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
                p.innerHTML = `📂 <strong>模式 A</strong>：直接写入 <code>${normSync}peach-media/</code>`;
                subpanelsContainer.appendChild(p);
            } else if (mode === PEACH_WEBDAV_MODE_SYNC_CUSTOM && hasSync) {
                const p = document.createElement('div');
                p.className = 'tm-peach-subpanel';
                p.innerHTML = `
                    <div class="tm-apple-row-subtext">模式 B：指定存储子目录</div>
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
                    <div class="tm-apple-row-subtext">模式 C：独立 WebDAV 存储端点</div>
                    <input type="text" class="tm-settings-input tm-peach-standalone-url" placeholder="主地址 (如 https://dav.example.com:443)" />
                    <input type="text" class="tm-settings-input tm-peach-standalone-lan-url" placeholder="局域网备用 (选填，如 http://192.168.2.250:5005)" />
                    <div class="tm-peach-grid-2">
                        <input type="text" class="tm-settings-input tm-peach-standalone-user" placeholder="用户名" />
                        <input type="password" class="tm-settings-input tm-peach-standalone-pass" placeholder="密码" />
                    </div>
                    <input type="text" class="tm-settings-input tm-peach-standalone-dir" placeholder="存放子目录 (如 /Media/STRM/)" />
                `;
                const urlIn = p.querySelector('.tm-peach-standalone-url');
                const lanUrlIn = p.querySelector('.tm-peach-standalone-lan-url');
                const userIn = p.querySelector('.tm-peach-standalone-user');
                const passIn = p.querySelector('.tm-peach-standalone-pass');
                const dirIn = p.querySelector('.tm-peach-standalone-dir');

                urlIn.value = config.webdavStandaloneUrl || '';
                lanUrlIn.value = config.webdavStandaloneLanUrl || '';
                userIn.value = config.webdavStandaloneUser || '';
                passIn.value = config.webdavStandalonePass || '';
                dirIn.value = config.webdavStandaloneDir || '/Media/STRM/';

                const saveStandalone = () => {
                    PeachService.saveConfig({
                        webdavStandaloneUrl: urlIn.value.trim(),
                        webdavStandaloneLanUrl: lanUrlIn.value.trim(),
                        webdavStandaloneUser: userIn.value.trim(),
                        webdavStandalonePass: passIn.value,
                        webdavStandaloneDir: dirIn.value.trim()
                    });
                };
                urlIn.addEventListener('change', saveStandalone);
                lanUrlIn.addEventListener('change', saveStandalone);
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
            tip.textContent = '检测到尚未配置主同步 WebDAV，已采用独立配置模式：';
            segmentedContainer.appendChild(tip);
        }

        renderSubpanels(currentMode);
        bodyWrap.appendChild(storageRow);

        // 3. Header 点击手风琴展开/折叠 (展开时触发自动检查)
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
            if (this.isExpanded) {
                this._autoCheckStatus();
            }
        });

        card.appendChild(bodyWrap);
        this.element.appendChild(card.getElement());
    }
}
