/**
 * 统一网络传输与域名轮流工具函数
 */

/**
 * 统一 HTTP 请求（支持同源 fetch 与跨域 GM_xmlhttpRequest 自动切换）
 * @param {string} url - 请求 URL
 * @param {Object} options - 请求选项
 * @returns {Promise<{status: number, html: string, finalUrl: string}>}
 */
export function fetchWithTransport(url, options = {}) {
    const { method = 'GET', headers = {}, timeout = 8000, body = null } = options;
    const isSameOrigin = (function() {
        try {
            const targetHost = new URL(url).hostname;
            return window.location.hostname === targetHost;
        } catch {
            return false;
        }
    })();

    if (isSameOrigin && typeof fetch === 'function') {
        const fetchFn = (typeof unsafeWindow !== 'undefined' && unsafeWindow.fetch) ? unsafeWindow.fetch : fetch;
        return fetchFn(url, { method, headers, body })
            .then(async res => {
                const text = await res.text();
                return { status: res.status, html: text, finalUrl: res.url };
            });
    }

    // 跨域场景使用 GM_xmlhttpRequest
    return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'function') {
            return reject(new Error('GM_xmlhttpRequest unavailable'));
        }

        let completed = false;
        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                if (req && req.abort) req.abort();
                reject(new Error('NETWORK_TIMEOUT'));
            }
        }, timeout);

        const req = GM_xmlhttpRequest({
            method,
            url,
            headers,
            data: body,
            timeout,
            onload: (res) => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                resolve({ status: res.status, html: res.responseText || '', finalUrl: res.finalUrl || url });
            },
            onerror: (err) => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                reject(new Error(err.statusText || 'NETWORK_ERROR'));
            },
            ontimeout: () => {
                if (completed) return;
                completed = true;
                clearTimeout(timer);
                reject(new Error('NETWORK_TIMEOUT'));
            }
        });
    });
}

/**
 * 检查响应 HTML 或状态码是否触发了 Cloudflare / Turnstile 盾牌拦截
 * @param {number} status 
 * @param {string} html 
 * @returns {boolean}
 */
export function detectCloudflare(status, html = '') {
    if (status === 403 || status === 503) return true;
    if (!html) return false;
    const lower = html.toLowerCase();
    return lower.includes('cf-challenge') ||
           lower.includes('turnstile') ||
           lower.includes('checking your browser') ||
           lower.includes('cloudflare');
}

/**
 * 通用多域名轮换请求包装器
 * @param {Array<string>} domainList - 备用域名列表
 * @param {Function} pathBuilder - 根据域名生成完整 URL 的函数 (domain => url)
 * @param {Object} options - fetch 选项
 * @returns {Promise<{status: number, html: string, domain: string, finalUrl: string}>}
 */
export async function fetchWithDomainRotation(domainList, pathBuilder, options = {}) {
    let lastError = null;
    for (const domain of domainList) {
        try {
            const url = pathBuilder(domain);
            const res = await fetchWithTransport(url, options);
            if (detectCloudflare(res.status, res.html)) {
                throw new Error(`CF_SHIELD_ON_${domain}`);
            }
            if (res.status >= 200 && res.status < 400) {
                return { ...res, domain };
            }
            throw new Error(`HTTP_${res.status}`);
        } catch (err) {
            lastError = err;
            console.warn(`[http] 域名 ${domain} 请求失败, 尝试下一个:`, err.message);
        }
    }
    throw lastError || new Error('ALL_DOMAINS_FAILED');
}
