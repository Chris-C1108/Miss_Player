import { AppleCard } from '../components/AppleCard.js';
import { ToggleRow } from '../components/ToggleRow.js';
import { PeachService } from '../../../../services/PeachService.js';
import { Toast } from '../../../../utils/index.js';
import { __ } from '../../../../constants/i18n.js';

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

        // 2.5 STRM WebDAV 存放目录
        const dirRow = document.createElement('div');
        dirRow.className = 'tm-apple-row tm-peach-field-row';
        dirRow.innerHTML = `
            <div class="tm-apple-row-title">STRM 存放目录 (WebDAV)</div>
            <div class="tm-apple-row-subtext">虚拟文件写入的相对路径，确保在 Peach 监控的媒体根目录下</div>
            <input type="text" class="tm-settings-input tm-peach-dir-input" placeholder="/Media/STRM/" value="${config.strmDir || '/Media/STRM/'}" />
        `;
        const dirInput = dirRow.querySelector('.tm-peach-dir-input');
        bodyWrap.appendChild(dirRow);

        // 2.6 操作按键区
        const actionRow = document.createElement('div');
        actionRow.className = 'tm-peach-action-row';
        actionRow.innerHTML = `
            <button type="button" class="tm-settings-btn tm-peach-action-btn tm-peach-test-btn">测试连接</button>
            <button type="button" class="tm-settings-btn tm-peach-action-btn tm-peach-scan-btn">通知 Peach 扫描</button>
        `;
        const testBtn = actionRow.querySelector('.tm-peach-test-btn');
        const scanBtn = actionRow.querySelector('.tm-peach-scan-btn');
        bodyWrap.appendChild(actionRow);

        // 事件处理
        const handleSave = () => {
            PeachService.saveConfig({
                base: baseInput.value.trim(),
                token: tokenInput.value.trim(),
                strmDir: dirInput.value.trim()
            });
        };
        baseInput.addEventListener('change', handleSave);
        tokenInput.addEventListener('change', handleSave);
        dirInput.addEventListener('change', handleSave);

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
                testBtn.textContent = '测试连接';
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
