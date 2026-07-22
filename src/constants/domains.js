export const SITE_DOMAINS = {
    MISSAV: {
        primary: 'missav.ai',
        backups: [
            'missav.ws'
        ]
    },
    JABLE: {
        primary: 'jable.tv',
        backups: [
            'fs1.app'
        ]
    },
    JAVLIBRARY: {
        primary: 'c97k.com',
        backups: [
            'javlib.com'
        ],
        // 已废弃/被墙的域名，仅用于 isSiteDomain 识别（不参与请求轮询）
        aliases: [
            'javlibrary.com',
            'www.javlibrary.com',
            'www.javlib.com',
            'www.c97k.com'
        ]
    },
    JAVDB: {
        primary: 'javdb.com',
        backups: [
            'javdb36.com'
        ],
        aliases: [
            'javdb.com',
            'www.javdb.com',
            'javdb.net'
        ]
    }
};

/**
 * 获取某个站点的活跃域名列表 (primary + backups)，用于网络请求轮询
 * @param {string} siteKey - 站点 Key (如 'MISSAV', 'JABLE')
 * @returns {string[]} 域名列表 (不包含协议)
 */
export function getSiteDomains(siteKey) {
    const config = SITE_DOMAINS[siteKey];
    if (!config) return [];
    return [config.primary, ...(config.backups || [])];
}

/**
 * 获取某个站点的所有可识别域名列表 (primary + backups + aliases)，用于域名归属判断
 * @param {string} siteKey - 站点 Key
 * @returns {string[]} 全部域名列表
 */
export function getAllSiteDomains(siteKey) {
    const config = SITE_DOMAINS[siteKey];
    if (!config) return [];
    return [config.primary, ...(config.backups || []), ...(config.aliases || [])];
}

/**
 * 获取某个站点的所有带协议域名列表 (e.g. ['https://c97k.com', 'https://javlib.com'])
 * 仅包含活跃域名，用于网络请求轮询
 * @param {string} siteKey - 站点 Key
 * @returns {string[]} 带协议域名列表
 */
export function getSiteUrls(siteKey) {
    return getSiteDomains(siteKey).map(d => `https://${d}`);
}

/**
 * 判断当前域名是否属于指定站点（包含已废弃的别名域名）
 * @param {string} siteKey - 站点 Key
 * @param {string} [hostname] - 要测试的域名，默认当前 window.location.hostname
 * @returns {boolean}
 */
export function isSiteDomain(siteKey, hostname = window.location.hostname) {
    const domains = getAllSiteDomains(siteKey);
    return domains.some(domain => hostname.includes(domain));
}


const reachabilityCache = new Map();

/**
 * 检测并缓存站点的网络可达性 (HEAD favicon.ico 轻量级检测)
 * @param {string} siteKey - 站点 Key
 * @param {boolean} [forceRecalc=false] - 是否强制重新检测
 * @returns {Promise<boolean>} 是否可达
 */
export async function checkSiteReachability(siteKey, forceRecalc = false) {
    if (!forceRecalc && reachabilityCache.has(siteKey)) {
        return reachabilityCache.get(siteKey);
    }

    const domains = getSiteDomains(siteKey);
    if (domains.length === 0) return false;

    const primaryDomain = domains[0];
    const isReachable = await new Promise((resolve) => {
        if (typeof GM_xmlhttpRequest !== 'function') {
            fetch(`https://${primaryDomain}/favicon.ico`, { method: 'HEAD', mode: 'no-cors' })
                .then(() => resolve(true))
                .catch(() => resolve(false));
            return;
        }

        let completed = false;
        const safeResolve = (val) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                resolve(val);
            }
        };

        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                if (req && typeof req.abort === 'function') {
                    try { req.abort(); } catch (e) {}
                }
                resolve(false);
            }
        }, 4000);

        const req = GM_xmlhttpRequest({
            method: 'HEAD',
            url: `https://${primaryDomain}/favicon.ico`,
            timeout: 4000,
            onload(res) {
                safeResolve(res.status > 0);
            },
            onerror() {
                safeResolve(false);
            },
            ontimeout() {
                safeResolve(false);
            }
        });
    });

    reachabilityCache.set(siteKey, isReachable);
    return isReachable;
}
