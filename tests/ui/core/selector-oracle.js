const fs = require('fs');
const path = require('path');
const config = require('../config');

class SelectorOracle {
    constructor() {
        this.registryPath = config.paths.registryFile;
        this.registry = this.loadRegistry();
    }

    loadRegistry() {
        if (fs.existsSync(this.registryPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
            } catch (e) {
                console.warn('[SelectorOracle] 加载选择器注册表异常，使用内置默认项');
            }
        }

        // 内置初始进化种子
        return {
            floatingButton: {
                current: '.tm-floating-button',
                candidates: [
                    '.tm-floating-button',
                    '.tm-floating-btn',
                    '#tm-floating-btn',
                    'button[class*="floating"]',
                    'svg.tm-play-button-bg'
                ],
                updatedAt: Date.now()
            },
            theaterModal: {
                current: '.tm-player-container',
                candidates: [
                    '.tm-player-container',
                    '#tm-theater-modal',
                    '.tm-theater-modal',
                    '.custom-video-player'
                ],
                updatedAt: Date.now()
            },
            settingsButton: {
                current: '.tm-settings-button',
                candidates: [
                    '.tm-settings-button',
                    '.tm-settings-btn',
                    'button[title*="设置"]',
                    'button[title*="Setting"]',
                    '.tm-button-container button:last-child'
                ],
                updatedAt: Date.now()
            },
            settingsPanel: {
                current: '.tm-settings-panel',
                candidates: [
                    '.tm-settings-panel',
                    '#tm-settings-modal',
                    '.tm-settings-modal'
                ],
                updatedAt: Date.now()
            },
            commentsPanel: {
                current: '.tm-comments-panel',
                candidates: [
                    '.tm-comments-panel',
                    '#tm-comment-panel',
                    '.tm-comment-panel'
                ],
                updatedAt: Date.now()
            },
            commentCards: {
                current: '.jc-card',
                candidates: [
                    '.jc-card',
                    '.tm-comment-item',
                    '[class*="comment-card"]'
                ],
                updatedAt: Date.now()
            },
            seekRow: {
                current: '.tm-seek-control-row',
                candidates: [
                    '.tm-seek-control-row',
                    '.tm-seek-row',
                    '[class*="seek-control"]'
                ],
                updatedAt: Date.now()
            },
            loopRow: {
                current: '.tm-loop-control-row',
                candidates: [
                    '.tm-loop-control-row',
                    '.tm-loop-row',
                    '[class*="loop-control"]'
                ],
                updatedAt: Date.now()
            }
        };
    }

    saveRegistry() {
        try {
            const dir = path.dirname(this.registryPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2), 'utf8');
        } catch (e) {
            console.warn('[SelectorOracle] 保存注册表失败:', e.message);
        }
    }

    /**
     * 自适应解析选择器：优先测试 current，失效时在浏览器内遍历 candidates 嗅探，自进化更新 current
     */
    async resolve(key, cdp, sessionId) {
        let entry = this.registry[key];
        if (!entry) {
            entry = { current: '', candidates: [], updatedAt: Date.now() };
            this.registry[key] = entry;
        }

        const candidates = [entry.current, ...entry.candidates].filter(Boolean);
        const uniqueCandidates = [...new Set(candidates)];

        const result = await cdp.evaluate(`
            (function() {
                const list = ${JSON.stringify(uniqueCandidates)};
                for (let i = 0; i < list.length; i++) {
                    const sel = list[i];
                    try {
                        const el = document.querySelector(sel);
                        if (el) {
                            return {
                                matched: sel,
                                index: i,
                                tag: el.tagName,
                                className: el.className,
                                isVisible: window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden'
                            };
                        }
                    } catch (e) {}
                }
                return { matched: null };
            })()
        `, sessionId);

        if (result && result.matched) {
            if (result.matched !== entry.current) {
                console.log(`[SelectorOracle] 💡 检测到选择器进化: ${key} -> 从 "${entry.current}" 自适应迁移至 "${result.matched}"`);
                entry.current = result.matched;
                entry.updatedAt = Date.now();
                this.saveRegistry();
            }
            return result.matched;
        }

        // 若无匹配，返回当前配置
        return entry.current;
    }

    /**
     * 注册新的候选选择器
     */
    addCandidate(key, selector) {
        if (!this.registry[key]) {
            this.registry[key] = { current: selector, candidates: [selector], updatedAt: Date.now() };
        } else if (!this.registry[key].candidates.includes(selector)) {
            this.registry[key].candidates.push(selector);
        }
        this.saveRegistry();
    }
}

module.exports = new SelectorOracle();
