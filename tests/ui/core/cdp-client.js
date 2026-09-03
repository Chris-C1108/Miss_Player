const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class CdpClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.msgId = 1;
        this.sessions = new Map();
        this.eventListeners = [];
    }

    async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.on('open', () => resolve());
            this.ws.on('error', (err) => reject(err));
            this.ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                this.eventListeners.forEach(fn => fn(msg));
            });
        });
    }

    send(method, params = {}, sessionId = null) {
        return new Promise((resolve, reject) => {
            const id = this.msgId++;
            const payload = { id, method, params };
            if (sessionId) payload.sessionId = sessionId;

            const handler = (msg) => {
                if (msg.id === id) {
                    const idx = this.eventListeners.indexOf(handler);
                    if (idx !== -1) this.eventListeners.splice(idx, 1);
                    if (msg.error) reject(new Error(`[CDP Error ${msg.error.code}] ${msg.error.message}`));
                    else resolve(msg.result);
                }
            };

            this.eventListeners.push(handler);
            this.ws.send(JSON.stringify(payload));
        });
    }

    async getTargets() {
        const res = await this.send('Target.getTargets');
        return res.targetInfos || [];
    }

    async findTarget(filterFn) {
        const targets = await this.getTargets();
        return targets.find(t => t.type === 'page' && (!filterFn || filterFn(t.url, t)));
    }

    async attach(targetId) {
        const res = await this.send('Target.attachToTarget', { targetId, flatten: true });
        const sessionId = res.sessionId;
        await this.send('Runtime.enable', {}, sessionId);
        await this.send('Page.enable', {}, sessionId);
        await this.send('DOM.enable', {}, sessionId);
        return sessionId;
    }

    async evaluate(expression, sessionId) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        }, sessionId);
        if (res.exceptionDetails) {
            throw new Error(`[Eval Error] ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
        }
        return res.result?.value;
    }

    /**
     * 模拟特定视口规格（宽高、DPR、触控与安全区）
     */
    async emulateViewport(vp, sessionId) {
        await this.send('Emulation.setDeviceMetricsOverride', {
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: vp.deviceScaleFactor || 1,
            mobile: !!vp.isMobile,
            screenOrientation: vp.width > vp.height ? { angle: 90, type: 'landscapePrimary' } : { angle: 0, type: 'portraitPrimary' }
        }, sessionId);

        if (vp.hasTouch) {
            await this.send('Emulation.setTouchEmulationEnabled', {
                enabled: true,
                maxTouchPoints: 5
            }, sessionId);
        } else {
            await this.send('Emulation.setTouchEmulationEnabled', {
                enabled: false
            }, sessionId);
        }

        // 模拟 safe-area 环境变量 (如果配置)
        if (vp.safeArea) {
            await this.evaluate(`
                (function() {
                    const styleId = 'tm-mock-safe-area';
                    let s = document.getElementById(styleId);
                    if (!s) {
                        s = document.createElement('style');
                        s.id = styleId;
                        document.head.appendChild(s);
                    }
                    s.textContent = \`
                        :root {
                            --safe-area-top: ${vp.safeArea.top}px;
                            --safe-area-bottom: ${vp.safeArea.bottom}px;
                            --safe-area-left: ${vp.safeArea.left}px;
                            --safe-area-right: ${vp.safeArea.right}px;
                        }
                    \`;
                })()
            `, sessionId);
        }

        // 触发 resize 事件通知播放器自适应
        await this.evaluate(`window.dispatchEvent(new Event('resize'));`, sessionId);
        // 等待 300ms 保证 CSS transform 与 resize 渲染完成
        await new Promise(r => setTimeout(r, 300));
    }

    async captureScreenshot(filePath, sessionId) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' }, sessionId);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
        return filePath;
    }

    async click(selector, sessionId) {
        return this.evaluate(`
            (function() {
                const el = document.querySelector('${selector}');
                if (!el) return { success: false, error: 'Element not found: ' + '${selector}' };
                el.scrollIntoView({ block: 'nearest' });
                el.click();
                return { success: true };
            })()
        `, sessionId);
    }

    async close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = CdpClient;
