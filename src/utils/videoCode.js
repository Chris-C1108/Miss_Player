/**
 * Video code extraction & detection engine (高精度通用番号解析引擎)
 * 采用“多源提取 -> 脏字符降噪 -> 优先级分层断言 (Priority Ladder) -> DMM CID 逆向对齐 -> 假阳性熔断”体系
 */
import { isSiteDomain } from '../constants/domains.js';

// 1. 技术参数与常见假阳性黑名单 (严防 H264-1080P, WIN10, AAC 等误判)
export const TECHNICAL_BLACKLIST = new Set([
    '1080P', '720P', '480P', '2160P', '4K', '8K', 'UHD', 'FHD', 'HD', 'SD',
    'H264', 'H265', 'X264', 'X265', 'HEVC', 'AVC', 'AAC', 'MP4', 'MKV', 'AVI',
    'WMV', 'TS', 'M2TS', 'SUB', 'CH', 'ZH', 'CN', 'UNCENSORED', 'LEAK',
    'WIN7', 'WIN10', 'WIN11', 'WIN', 'ISO', 'SHA', 'MD5', 'SAMPLE', 'TRAILER',
    // 英文月份 (严防 SEP-2026, OCT-2024 等误判)
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    // 常用单位与技术词
    'FPS', 'KB', 'MB', 'GB', 'TB', 'PAGE', 'EPISODE', 'PART', 'VOL', 'DISC', 'DVD', 'VOD'
]);

// 2. 非番号的通用路由与功能页面路径黑名单
export const NON_AV_SLUGS = new Set([
    'search', 's', 'zh-cn', 'cn', 'en', 'tw', 'ja', 'vi', 'ko', 'th', 'ru',
    'forum', 'forum.php', 'index.html', 'index.php', 'warmup.html', 'watch',
    'login', 'register', 'signin', 'signup', 'home', 'tags', 'genres', 'actors',
    'actresses', 'makers', 'directors', 'series', 'categories', 'channels',
    'playlists', 'dmca', 'terms', 'privacy', 'about', 'help', 'contact',
    'v1_star.php', 'preview', 'member', 'vip', 'download', 'upload', 'news',
    'rank', 'ranking', 'popular', 'latest', 'release', 'recent', 'favorite',
    'history', 'videos', 'video', 'movie', 'movies', 'new', 'top', 'trending'
]);

// 3. 优先级分层识别规则集 (越严苛、越具唯一特征的规则置于越前)
export const PARSER_RULES = [
    // 梯队 1: FC2 素人系列 (如 FC2-PPV-2849102, FC2_2849102, PPV-1234567)
    {
        type: 'FC2',
        regex: /(?:FC2(?:[_s-]?PPV)?|PPV)[_s-]?(\d{5,7})\b/i,
        format: (m) => `FC2-PPV-${m[1]}`
    },
    // 梯队 2: MGS 商业/素人体系 (3位数字+2~6位字母，如 300MAAN-123, 259LUXU-456, 118AB-123)
    {
        type: 'MGS',
        regex: /\b(\d{3}[A-Z]{2,6})[_s-]?(\d{2,5})\b/i,
        format: (m) => `${m[1].toUpperCase()}-${m[2]}`
    },
    // 梯队 3: 日期型无码厂牌 (加勒比 Caribbean, 一本道 1pondo, 10musume: 6位日期-3位数字，如 010123-123)
    {
        type: 'UNCENSORED_DATE',
        regex: /\b(\d{6})[_s-](\d{3})\b/,
        format: (m) => `${m[1]}-${m[2]}`
    },
    // 梯队 4: 特殊字母厂牌 (Tokyo-Hot: cz0012, n1234, k0123)
    {
        type: 'TOKYO_HOT',
        regex: /\b(CZ|[NK])(\d{4})\b/i,
        format: (m) => `${m[1].toUpperCase()}${m[2]}`
    },
    // 梯队 5: HEYZO 系列
    {
        type: 'HEYZO',
        regex: /\bHEYZO[_s-]?(\d{4})\b/i,
        format: (m) => `HEYZO-${m[1]}`
    },
    // 梯队 6: DM 体系 (如 DM-339, dm339)
    {
        type: 'DM',
        regex: /\bDM[_s-]?([1-9]\d{1,4})\b/i,
        format: (m) => `DM-${m[1]}`
    },
    // 梯队 7: 标准日系有码 (带横杠/下划线/空格分隔，如 SSIS-888, MIAA-598, ABP-123, SIVR-012)
    {
        type: 'STANDARD_HYPHEN',
        regex: /\b([A-Z]{2,8})[\s_\-](\d{2,5})\b/i,
        format: (m) => `${m[1].toUpperCase()}-${m[2]}`
    },
    // 梯队 8: DMM CID 逆向对齐 (如 ssis00123 -> SSIS-123, miaa00598 -> MIAA-598)
    {
        type: 'DMM_CID',
        regex: /\b([A-Z]{2,8})(?:00|0)(\d{2,5})\b/i,
        format: (m) => {
            const prefix = m[1].toUpperCase();
            let num = m[2].replace(/^0+/, '');
            if (num.length === 1) num = '0' + num;
            return `${prefix}-${num}`;
        }
    },
    // 梯队 9: 紧凑无分隔符格式 (如 IPX123 -> IPX-123, SSIS888 -> SSIS-888)
    {
        type: 'COMPACT',
        regex: /\b([A-Z]{2,8})(\d{2,5})\b/i,
        format: (m) => {
            const prefix = m[1].toUpperCase();
            let num = m[2].replace(/^0+/, '');
            if (num.length === 1) num = '0' + num;
            return `${prefix}-${num}`;
        }
    }
];

/**
 * 字符串预降噪清洗管道 (Sanitizer Pipeline)
 * 全角转半角、剔除中英括注内容、剥离常见画质/字幕后缀
 * @param {string} str
 * @returns {string}
 */
export function sanitizeInput(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        // 1. 全角转半角
        .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
        .replace(/\u3000/g, ' ')
        // 2. 剥离中英文括注内容 (如 [中文字幕], 【4K无码】, (1080p), [x264 AAC])
        .replace(/\[[^\]]*\]|【[^】]*】|\([^\)]*\)/g, ' ')
        // 3. 剥离常见的干扰后缀词与版本标识
        .replace(/[-_ ](?:c|ch|uc|hd|fhd|4k|leak|uncensored|wuma|youma|subtitle)\b/gi, ' ')
        .trim();
}

/**
 * 判断是否为合法的番号格式
 * @param {string} code - 待检测字符串
 * @returns {boolean}
 */
export function isValidAvCode(code) {
    if (!code || typeof code !== 'string') return false;
    const s = code.trim();
    if (s.length < 2 || s.length > 50) return false;
    if (NON_AV_SLUGS.has(s.toLowerCase())) return false;
    if (/\.(html|php|htm|js|css|mp4|mkv|avi|wmv)$/i.test(s)) return false;

    // 检查是否命中规则集且前缀不属于技术黑名单
    for (const rule of PARSER_RULES) {
        const m = s.match(rule.regex);
        if (m) {
            const prefix = (m[1] || '').toUpperCase();
            if (TECHNICAL_BLACKLIST.has(prefix)) return false;
            return true;
        }
    }
    return false;
}

/**
 * 对输入的字符串执行分层精准番号解析与归一化
 * @param {string} rawStr - 待解析的原始字符串 (可能是标题、文件名或 URL 片段)
 * @returns {string} 归一化后的标准大写番号，若未命中则返回空字符串 ''
 */
export function matchAvCodeFromText(rawStr) {
    if (!rawStr) return '';
    const text = sanitizeInput(rawStr);

    for (const rule of PARSER_RULES) {
        const match = text.match(rule.regex);
        if (match) {
            const prefix = (match[1] || '').toUpperCase();
            // 假阳性熔断：若匹配到的前缀属于技术黑名单，跳过
            if (TECHNICAL_BLACKLIST.has(prefix)) continue;
            const formatted = rule.format(match);
            if (isValidAvCode(formatted)) {
                if (rule.type === 'DM') {
                    try {
                        console.log('[VideoCode Diagnostic] 命中 DM 匹配:', { rawStr: String(rawStr).slice(0, 100), matched: match[0], formatted });
                    } catch (_) {}
                }
                return formatted;
            }
        }
    }
    return '';
}

/**
 * 保持向后兼容的番号清洗函数
 * @param {string} code - 原始番号
 * @returns {string} 规范化大写番号
 */
export function cleanAvCode(code) {
    if (!code) return '';
    const matched = matchAvCodeFromText(code);
    return matched || code.trim().toUpperCase();
}

/**
 * 从 URL、页面 DOM 及标题中提取视频番号 (四层漏斗流水线)
 * 优先级 1: URL 路由与关键参数 (最纯净，无 SEO 污染)
 * 优先级 2: OpenGraph 与 Canonical 元数据
 * 优先级 3: 页面 H1 / 主标题
 * 优先级 4: document.title 智能回退
 * @param {string} [url] - 待解析的页面 URL
 * @returns {string} 提取到的标准番号
 */
/**
 * 从当前播放视频元素、URL、页面 DOM 及标题中精准提取视频番号
 * @param {string|HTMLVideoElement} [urlOrElement] - 目标 URL 或当前激活播放的视频元素 <video>
 * @returns {string} 提取到的标准番号
 */
export function getVideoCodeFromUrl(urlOrElement = (typeof window !== 'undefined' ? window.location.href : '')) {
    let url = typeof urlOrElement === 'string' ? urlOrElement : '';
    let targetVideo = (urlOrElement && typeof urlOrElement === 'object' && urlOrElement.tagName === 'VIDEO') ? urlOrElement : null;

    // 若未显式传入视频元素，自动在 DOM 中寻找当前正在播放或已初始化的目标视频
    if (!targetVideo && typeof document !== 'undefined') {
        targetVideo = document.querySelector('.tm-video-wrapper video') || document.querySelector('video[preload]:not([muted])') || document.querySelector('video');
    }

    // =========================================================================
    //  阶段 0: 优先从当前播放的 <video> 元素自身及直属容器特征提取 (最精准，直指当前播放目标)
    // =========================================================================
    if (targetVideo) {
        const videoCandidates = [
            targetVideo.getAttribute('data-code'),
            targetVideo.getAttribute('data-avcode'),
            targetVideo.getAttribute('data-id'),
            targetVideo.getAttribute('data-video-id'),
            targetVideo.title,
            targetVideo.currentSrc,
            targetVideo.src
        ];
        // 检查子 <source> 标签
        const childSources = targetVideo.querySelectorAll('source');
        for (const s of childSources) {
            if (s.src) videoCandidates.push(s.src);
        }
        // 检查邻近父容器
        let parent = targetVideo.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
            const pCode = parent.getAttribute('data-code') || parent.getAttribute('data-avcode') || parent.getAttribute('data-id');
            if (pCode) videoCandidates.push(pCode);
            depth++;
            parent = parent.parentElement;
        }
        for (const candidate of videoCandidates) {
            if (candidate) {
                const code = matchAvCodeFromText(candidate);
                if (code) return code;
            }
        }
    }

    if (!url && typeof window !== 'undefined') {
        url = window.location.href;
    }
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        const path = decodeURIComponent(urlObj.pathname || '');
        const search = decodeURIComponent(urlObj.search || '');

        // =========================================================================
        //  阶段 1: 专用站点特征提取 (Jable / JavDB / JavLibrary / MissAV)
        // =========================================================================

        // 1. Jable.tv: /videos/miaa-598/
        if (isSiteDomain('JABLE', urlObj.hostname)) {
            const match = path.match(/\/videos\/([^/?#]+)/i);
            if (match) {
                const code = matchAvCodeFromText(match[1]);
                if (code) return code;
            }
        }

        // 2. JavDB: /v/xxx or /videos/xxx
        if (isSiteDomain('JAVDB', urlObj.hostname)) {
            const match = path.match(/\/(?:v|videos)\/([^/?#]+)/i);
            if (match) {
                const code = matchAvCodeFromText(match[1]);
                if (code) return code;
            }
        }

        // 3. JavLibrary: ?v=javli... or ?v=...
        if (isSiteDomain('JAVLIBRARY', urlObj.hostname)) {
            const vParam = urlObj.searchParams.get('v');
            if (vParam) {
                const code = matchAvCodeFromText(vParam);
                if (code) return code;
            }
        }

        // 4. MissAV: /cn/miaa-598 or /miaa-598 or /dm-339
        if (isSiteDomain('MISSAV', urlObj.hostname)) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                const last = segments[segments.length - 1];
                if (!NON_AV_SLUGS.has(last.toLowerCase())) {
                    const code = matchAvCodeFromText(last);
                    if (code) return code;
                }
            }
        }

        // =========================================================================
        //  阶段 2: 通用 URL 路径与查询参数解析
        // =========================================================================

        // 5. 检查常见查询参数 (例如 ?code=MIAB-592, ?v=..., ?av=..., ?id=...)
        if (urlObj.searchParams) {
            for (const param of ['code', 'v', 'id', 'av', 'vid', 'movie']) {
                const val = urlObj.searchParams.get(param);
                if (val) {
                    const code = matchAvCodeFromText(val);
                    if (code) return code;
                }
            }
        }

        // 6. 从通用 URL 路径的末尾分段提取
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0) {
            const last = segments[segments.length - 1];
            if (!NON_AV_SLUGS.has(last.toLowerCase())) {
                const code = matchAvCodeFromText(last);
                if (code) return code;
            }
        }

        // 7. 对整个 URL Path 进行分层扫描
        const pathCode = matchAvCodeFromText(path);
        if (pathCode) return pathCode;

        // =========================================================================
        //  阶段 3: DOM 元数据与页面标题兜底解析
        // =========================================================================
        if (typeof document !== 'undefined') {
            // A. OpenGraph 标题与 Canonical
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                            document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '';
            if (ogTitle) {
                const code = matchAvCodeFromText(ogTitle);
                if (code) return code;
            }

            // B. 页面主标题 (H1)
            const h1Text = document.querySelector('h1')?.innerText || document.querySelector('h1')?.textContent || '';
            if (h1Text) {
                const code = matchAvCodeFromText(h1Text);
                if (code) return code;
            }

            // C. JavDB 特有元数据节点识别 (.movie-panel-info / strong)
            const javDbCodeNode = document.querySelector('.current-title, .video-meta-panel .first-block span.value');
            if (javDbCodeNode && javDbCodeNode.textContent) {
                const code = matchAvCodeFromText(javDbCodeNode.textContent);
                if (code) return code;
            }

            // D. document.title 智能清洗回退
            if (document.title) {
                const code = matchAvCodeFromText(document.title);
                if (code) return code;
            }
        }
    } catch (e) {
        console.error('[VideoCode] 番号解析管道发生异常:', e);
    }
    return '';
}
