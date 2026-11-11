/**
 * Cloudflare Worker: 社区高能热度图边缘 24 小时缓存只读网关 (Heatmap Edge CDN)
 * 
 * 职责：
 * 1. 挡在 Supabase 前面作为全球 Anycast 边缘只读缓存层，吸收 99% 的读流量；
 * 2. 避免客户端直接频繁读取 Supabase 消耗每月 2GB 的 Egress 免费额度；
 * 3. 利用 Cloudflare Cache API (caches.default)，单番号缓存 24 小时；
 * 4. 纯读代理，不执行写入操作（客户端写入直接直连 Supabase RPC 无限次调用）。
 * 
 * 环境变量 (由 wrangler.toml 或 Cloudflare Dashboard 注入):
 * - SUPABASE_URL: 例如 https://xyzcompany.supabase.co
 * - SUPABASE_ANON_KEY: 匿名公钥
 */

export default {
    async fetch(request, env, ctx) {
        // 1. CORS 跨域预检与通用头
        const origin = request.headers.get('Origin') || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Access-Control-Max-Age': '86400'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'GET') {
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const url = new URL(request.url);
        // 路由格式: /v1/heatmap/:avcode
        const match = url.pathname.match(/^\/v1\/heatmap\/([a-zA-Z0-9_\-]+)/i);
        if (!match) {
            return new Response(JSON.stringify({ error: 'Not Found', usage: 'GET /v1/heatmap/:avcode' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const avcode = match[1].toUpperCase();

        // 2. 检查 Cloudflare 边缘缓存 (Cache API)
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        let cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
            const newHeaders = new Headers(cachedResponse.headers);
            newHeaders.set('CF-Edge-Cache', 'HIT');
            for (const [k, v] of Object.entries(corsHeaders)) {
                newHeaders.set(k, v);
            }
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                headers: newHeaders
            });
        }

        // 3. Cache Miss: 回源 Supabase 查询 120 字节定长热度图
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: 'Supabase credentials not configured on worker' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const targetUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/video_crowd_heatmap?avcode=eq.${encodeURIComponent(avcode)}&select=avcode,heatmap,total_samples,duration_seconds`;

        try {
            const supaRes = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Accept': 'application/json'
                }
            });

            if (!supaRes.ok) {
                return new Response(JSON.stringify({ error: 'Supabase upstream error', status: supaRes.status }), {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const rows = await supaRes.json();
            if (!Array.isArray(rows) || rows.length === 0) {
                // 未收录番号：设置较短的 10 分钟缓存，避免反复打穿
                const notFoundRes = new Response(JSON.stringify({ found: false, avcode }), {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=600',
                        'CF-Edge-Cache': 'MISS'
                    }
                });
                ctx.waitUntil(cache.put(cacheKey, notFoundRes.clone()));
                return notFoundRes;
            }

            const row = rows[0];
            // Supabase bytea 在 JSON 中返回格式通常为 \x[hex]
            let hexStr = (row.heatmap || '').replace(/^\\x/, '');
            let base64Data = '';
            if (hexStr) {
                const bytes = new Uint8Array(hexStr.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                let binary = '';
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                base64Data = btoa(binary);
            }

            const payload = {
                found: true,
                avcode: row.avcode,
                heatmap: base64Data, // 160 字符 Base64
                totalSamples: row.total_samples || 1,
                durationSeconds: row.duration_seconds || 0
            };

            const successRes = new Response(JSON.stringify(payload), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    // 边缘与客户端强缓存 24 小时 (86400 秒)
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                    'CF-Edge-Cache': 'MISS'
                }
            });

            // 异步存入边缘缓存，不阻塞客户端返回
            ctx.waitUntil(cache.put(cacheKey, successRes.clone()));
            return successRes;
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message || 'Upstream network error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
