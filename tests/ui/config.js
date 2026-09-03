const path = require('path');
const fs = require('fs');

/**
 * 自动发现本地 Chrome DevTools ActivePort
 */
function discoverCdpEndpoint() {
    const defaultUserData = path.join(
        process.env.LOCALAPPDATA || 'C:\\Users\\chenahao\\AppData\\Local',
        'Google\\Chrome\\User Data'
    );
    const activePortFile = path.join(defaultUserData, 'DevToolsActivePort');

    if (fs.existsSync(activePortFile)) {
        try {
            const lines = fs.readFileSync(activePortFile, 'utf8').trim().split(/\r?\n/);
            if (lines.length >= 2) {
                const port = lines[0].trim();
                const browserPath = lines[1].trim();
                return {
                    port: parseInt(port, 10),
                    browserWsUrl: `ws://127.0.0.1:${port}${browserPath.startsWith('/') ? '' : '/'}${browserPath}`
                };
            }
        } catch (e) {
            console.warn('[Config] 读取 DevToolsActivePort 失败:', e.message);
        }
    }

    // 回退到已知调试端口
    return {
        port: 52701,
        browserWsUrl: 'ws://127.0.0.1:52701'
    };
}

module.exports = {
    cdp: discoverCdpEndpoint(),
    
    // 全比例视口测试矩阵 (覆盖不同设备及宽高比)
    viewports: {
        desktop_16_9: {
            name: '桌面标准 (16:9 1080p)',
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            category: 'desktop'
        },
        desktop_ultrawide_21_9: {
            name: '桌面带鱼屏 (21:9 超宽)',
            width: 2560,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            category: 'desktop'
        },
        laptop_16_10: {
            name: '笔记本 (16:10 窄高比)',
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            category: 'laptop'
        },
        tablet_landscape_4_3: {
            name: '平板横屏 (4:3 iPad Landscape)',
            width: 1024,
            height: 768,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            category: 'tablet'
        },
        tablet_portrait_3_4: {
            name: '平板竖屏 (3:4 iPad Portrait)',
            width: 768,
            height: 1024,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            category: 'tablet'
        },
        mobile_portrait_9_19_5: {
            name: '手机竖屏 (9:19.5 iPhone 单手模式)',
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            category: 'mobile',
            safeArea: { top: 47, bottom: 34, left: 0, right: 0 }
        },
        mobile_landscape_19_5_9: {
            name: '手机横屏 (19.5:9 全屏横握)',
            width: 844,
            height: 390,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            category: 'mobile',
            safeArea: { top: 0, bottom: 21, left: 47, right: 47 }
        }
    },

    // 默认测试目标匹配规则
    targetFilter: (url) => url.includes('fdxqupvz') || url.includes('missav') || url.includes('jable'),

    paths: {
        root: path.resolve(__dirname),
        reportsDir: path.resolve(__dirname, 'reports'),
        artifactsDir: path.resolve(__dirname, 'reports', 'artifacts'),
        registryFile: path.resolve(__dirname, 'reports', 'selector-registry.json')
    }
};
