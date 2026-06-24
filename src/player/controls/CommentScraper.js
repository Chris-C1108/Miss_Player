/**
 * 评论区采集与数据处理管道模块 (CommentScraper)
 */


import { getSiteUrls, isSiteDomain } from '../../constants/domains.js';
import { logger } from '../../utils/logger.js';

export const JABLE_DOMAINS = getSiteUrls('JABLE');
export const JAVLIB_DOMAINS = getSiteUrls('JAVLIBRARY');

// =====================================================================
//  0. CONFIG & CONSTANTS
// =====================================================================
const CFG = {
    FILTER: {
        NAME_INITIAL_EXCLUSIONS: new Set([
            'ok', 'good', 'nice', 'love', 'best', 'cool', 'hot', 'av', 'vip',
            'lol', 'wow', 'omg', 'no', 'yes', 'hi', 'like', 'sexy', 'god',
            'star', 'new', 'old', 'top', 'pro', 'fun', 'bad', 'hub', 'tv'
        ]),
        JABLE_EMOJI_REGEX: /:[a-zA-Z]{2,15}:/,
        UNICODE_EMOJI_REGEX: /\p{Emoji_Presentation}/u,
        SINGLE_DIGIT_REGEX: /^\d$/,
        REPEATING_DIGIT_REGEX: /^(\d)\1+$/
    },
    TIMESTAMPS: {
        HOUR_LIMIT: 3,
        DURATION_KEYWORDS: [
            '前戏', '前戲', '办事', '辦事', '坚持', '堅持', '持续', '持續',
            '长达', '長達', '耐力', '抽插', '插了', '干了', '幹了', '操了',
            '艹了', '日了', '射了', '做了', '将近', '將近', '不到', '超过', '超過'
        ],
        MINUTE_KEYWORDS: [
            '分', '分钟', 'm', '开始', '插入', '看点', '高潮', '必看', '必尻',
            '秒硬', '时间', '位置', '那段', '部分', '地方', '到', '至', '跳转',
            '开头', '结束', '剩', '剩余', '从', '后面', '前面'
        ],
        SECOND_KEYWORDS: ['秒', '秒钟', 's']
    }
};

// Escape HTML utility
const esc = s => {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
};

// =====================================================================
//  1. URL DETECTION
// =====================================================================
export function cleanAvCode(code) {
    if (!code) return '';
    let result = code.toLowerCase().trim();

    // 1. 剥离已知的 MissAV 等站点的后缀
    const suffixes = [
        '-uncensored-leak',
        '-uncensored',
        '-english-subtitle',
        '-chinese-subtitle',
        '-subtitle',
        '-leak',
        '-c'
    ];

    let changed = true;
    while (changed) {
        changed = false;
        for (const suffix of suffixes) {
            if (result.endsWith(suffix)) {
                result = result.slice(0, -suffix.length);
                changed = true;
                break;
            }
        }
    }

    // 2. 如果符合标准字母-数字格式，进行规范化 (例如将没有连字符的 "mimk138" 规范化为 "mimk-138")
    const stdMatch = result.match(/^([a-z]+)-?(\d+)$/i);
    if (stdMatch) {
        return `${stdMatch[1]}-${stdMatch[2]}`.toLowerCase();
    }

    return result;
}

export function getVideoCodeFromUrl(url = window.location.href) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        let code = '';

        // Jable.tv: /videos/miaa-598/
        if (isSiteDomain('JABLE', urlObj.hostname)) {
            const match = path.match(/\/videos\/([^/]+)/i);
            if (match) code = match[1];
        }

        // MissAV: /cn/miaa-598 or /miaa-598
        if (!code && isSiteDomain('MISSAV', urlObj.hostname)) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                code = segments[segments.length - 1];
            }
        }

        // Generic fallback: match alphanumeric hyphen alphanumeric
        if (!code) {
            const genericMatch = path.match(/\/([a-z0-9]+-[a-z0-9]+)/i);
            if (genericMatch) {
                code = genericMatch[1];
            }
        }

        // Last fallback: last segment of path
        if (!code) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) {
                code = segments[segments.length - 1];
            }
        }

        if (code) {
            return cleanAvCode(code);
        }
    } catch (e) {
        console.error('[CommentScraper] Failed to parse video code from URL:', e);
    }
    return '';
}

// =====================================================================
//  2. NETWORK FETCH & HTML PARSING
// =====================================================================
export function fetchJableComments(code, page = 1, domainIndex = 0) {
    if (domainIndex >= JABLE_DOMAINS.length) {
        return Promise.reject(new Error('All Jable domains failed'));
    }
    const domain = JABLE_DOMAINS[domainIndex];
    const slug = code.toLowerCase().trim();
    const url = `${domain}/videos/${slug}/?mode=async&function=get_block&block_id=video_comments_video_comments&sort_by=&from=${page}&ipp=5&_=${Date.now()}`;

    logger.log(`[CommentScraper] 开始采集 Jable 评论，番号: ${slug}, 页码: ${page}, 域名: ${domain}`);

    const tryNext = (err) => {
        if (domainIndex < JABLE_DOMAINS.length - 1) {
            logger.log(`[CommentScraper] Jable 域名 ${domain} 获取评论失败: ${err ? err.message : '空响应'}，正在尝试备用域名...`);
            return fetchJableComments(code, page, domainIndex + 1);
        } else {
            return Promise.reject(err || new Error('All Jable domains failed'));
        }
    };

    const urlObj = new URL(url);
    const isSameOrigin = window.location.hostname.includes(urlObj.hostname);
    if (isSameOrigin || typeof GM_xmlhttpRequest === 'undefined') {
        const sameOriginUrl = url.replace(urlObj.origin, window.location.origin);
        const fetchFn = (typeof unsafeWindow !== 'undefined' && unsafeWindow.fetch) ? unsafeWindow.fetch.bind(unsafeWindow) : fetch;
        return fetchFn(sameOriginUrl, {
            headers: {
                'accept': '*/*',
                'x-requested-with': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (response.status === 404) {
                const err = new Error('HTTP 404');
                err.status = 404;
                throw err;
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            if (!text || text.trim() === '') {
                throw new Error('响应数据为空 (可能遭受到跨域阻止或隐私插件拦截)');
            }
            const parsed = parseCommentsHtml(text, domain);
            logger.log(`[CommentScraper] 成功采集到 Jable 评论，共 ${parsed.comments.length} 条 (总数: ${parsed.totalCount})`);
            return { ...parsed, domain };
        })
        .catch(err => {
            if (err.status === 404 || (err.message && err.message.includes('404'))) {
                return Promise.reject(err);
            }
            if (err.message === '触发人机验证') {
                return Promise.reject(err);
            }
            return tryNext(err);
        });
    }

    // 非同源环境且支持 GM_xmlhttpRequest，则通过扩展特权发送跨域请求
    return new Promise((resolve, reject) => {
        logger.log(`[CommentScraper] 开始通过 GM_xmlhttpRequest 发起跨域请求: ${url}`);
        let completed = false;
        
        const safeResolve = (val) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                resolve(val);
            }
        };

        const safeReject = (err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                reject(err);
            }
        };

        const timer = setTimeout(() => {
            if (!completed) {
                logger.warn(`[CommentScraper] Jable 采集超时 (已达到 6000ms 限制，手动中止): ${url}`);
                if (req && typeof req.abort === 'function') {
                    try { req.abort(); } catch (e) {}
                }
                tryNext(new Error('请求超时')).then(safeResolve).catch(safeReject);
            }
        }, 6000);

        const req = GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 6000,
            headers: {
                'accept': '*/*',
                'x-requested-with': 'XMLHttpRequest',
                'referer': `${domain}/`,
                'origin': domain
            },
            withCredentials: true,
            onload(r) {
                if (completed) return;
                logger.log(`[CommentScraper] GM_xmlhttpRequest 响应状态码: ${r.status}`);
                if (r.status === 403 || r.status === 503) {
                    const cfError = new Error('触发人机验证');
                    cfError.status = 403;
                    cfError.domain = domain;
                    safeReject(cfError);
                    return;
                }
                if (r.status === 404) {
                    const notFoundErr = new Error('HTTP 404');
                    notFoundErr.status = 404;
                    safeReject(notFoundErr);
                    return;
                }
                if (r.status >= 200 && r.status < 300) {
                    const text = r.responseText;
                    // iOS Safari 或部分插件在未被授权访问目标域名时，会返回空数据或被静默拦截，此处显式检查并报错以引导用户授权
                    if (!text || text.trim() === '') {
                        logger.error('[CommentScraper] 收到空响应数据，可能被脚本管理器或 Safari 权限拦截。');
                        tryNext(new Error('响应为空')).then(safeResolve).catch(safeReject);
                        return;
                    }
                    try {
                        const parsed = parseCommentsHtml(text, domain);
                        logger.log(`[CommentScraper] 成功采集到 Jable 评论，共 ${parsed.comments.length} 条 (总数: ${parsed.totalCount})`);
                        safeResolve({ ...parsed, domain });
                    } catch (err) {
                        if (err.message === '触发人机验证') {
                            safeReject(err);
                        } else {
                            logger.error('[CommentScraper] 解析 HTML 时出错:', err);
                            tryNext(err).then(safeResolve).catch(safeReject);
                        }
                    }
                } else {
                    logger.error(`[CommentScraper] 请求失败，HTTP 状态码: ${r.status}`, r);
                    tryNext(new Error(`HTTP ${r.status}`)).then(safeResolve).catch(safeReject);
                }
            },
            onerror(e) {
                if (completed) return;
                logger.error('[CommentScraper] GM_xmlhttpRequest onerror 触发:', e);
                tryNext(new Error('跨域请求网络出错')).then(safeResolve).catch(safeReject);
            },
            ontimeout() {
                if (completed) return;
                logger.warn('[CommentScraper] GM_xmlhttpRequest 请求超时');
                tryNext(new Error('请求超时')).then(safeResolve).catch(safeReject);
            }
        });
    });
}

export function parseCommentsHtml(html, domain = JABLE_DOMAINS[0]) {
    if (html.includes('cf-challenge') || html.includes('Turnstile') || html.includes('Checking your browser') || html.includes('cloudflare')) {
        const cfError = new Error('触发人机验证');
        cfError.status = 403;
        cfError.domain = domain;
        throw cfError;
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const comments = [];
    let totalCount = 0;
    
    // 检查是否包含评论区块或评论列表容器，若包含则说明跨域网络请求已成功
    const commentsContainer = doc.querySelector('.comments') || doc.querySelector('.comment-list') || doc.querySelector('#video_comments_video_comments');
    if (!commentsContainer) {
        throw new Error(`未能获取有效的评论数据 (可能因 Safari 跨域权限拦截，请在浏览器中直接打开并验证 ${new URL(domain).hostname})`);
    }
    
    const sub = doc.querySelector('h6.sub-title');
    if (sub) {
        const m = sub.textContent.match(/\((\d+)\)/);
        if (m) totalCount = parseInt(m[1], 10);
    }
    
    const hasMore = html.includes('載入更多') || html.includes('载入更多');

    doc.querySelectorAll('div.item[data-comment-id]').forEach(item => {
        const id = item.getAttribute('data-comment-id') || '';
        const userEl = item.querySelector('.title .pr-2 a');
        const user = userEl ? userEl.textContent.trim() : (item.querySelector('.title .pr-2') ? item.querySelector('.title .pr-2').textContent.trim() : 'Anonymous');
        let userUrl = userEl ? userEl.getAttribute('href') : '';
        
        if (userUrl && userUrl.startsWith('/')) {
            userUrl = `${domain}${userUrl}`;
        }
        
        const timeEl = item.querySelector('.title .inactive-color');
        const time = timeEl ? timeEl.textContent.trim() : '';

        const textEl = item.querySelector('.comment-text .original-text');
        let text = '', isPending = false;
        if (textEl) {
            const clone = textEl.cloneNode(true);
            clone.querySelectorAll('img').forEach(img => img.replaceWith(img.getAttribute('alt') || ''));
            text = clone.textContent.trim();
        } else {
            const pendEl = item.querySelector('.comment-text .inactive-color');
            if (pendEl && pendEl.textContent.includes('審核')) {
                isPending = true;
                text = pendEl.textContent.trim();
            }
        }
        
        if (text || user !== 'Anonymous') {
            comments.push({
                id,
                user,
                userUrl,
                time,
                text,
                isPending,
                site: 'jable'
            });
        }
    });

    return { comments, totalCount, hasMore };
}

// =====================================================================
//  3. TEXT NORMALIZATION & PIPELINE
// =====================================================================
function normalizeText(text) {
    if (!text) return '';
    let str = text;

    // Convert fullwidth to halfwidth
    str = str.replace(/[\uFF01-\uFF5E]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    });

    // Specific replacements
    str = str.replace(/\u3000/g, ' ')
        .replace(/：/g, ':')
        .replace(/。/g, '.')
        .replace(/，/g, ',')
        .replace(/～/g, '~')
        .replace(/ー/g, '-')
        .replace(/－/g, '-')
        .replace(/(\d|分钟|分鐘|小时|小時|秒钟|秒鐘|[分秒时時hmsmHMS])\s*(?:到|至)\s*(\d)/gi, '$1~$2');

    str = str.replace(/:[a-zA-Z]{2,15}:/g, '');
    str = str.replace(/(\d+)\s*分\s*([-~～到])\s*(\d+)/g, '$1$2$3');
    str = str.replace(/(\d+)\s*秒\s*([-~～到])\s*(\d+)/g, '$1$2$3');
    str = str.replace(/(\d+)\s*:\s*(\d+)/g, '$1:$2');
    str = str.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');

    return str;
}

function stripEmojis(text) {
    return text.replace(/:[a-zA-Z]{2,15}:/g, '');
}

// =====================================================================
//  4. SPAM CLASSIFIER
// =====================================================================

const surnameRegexStr = '[張张趙赵陳陈廖郭邱翁蕭萧馮冯鄧邓呂吕吳吴宋罗羅彭劉刘蔣蒋柯隋詹潘賴赖卓崔薛]';

const schoolRegex = /(?:高中|中學|中学|大學(?!習|习)|大学(?!习|擺)|一中|國中|国中|高工|高商|商工|二信|清大|台大|世新|附中|大足一中|大足第一中学|神岡高工|大明高中|吉安國中|靜宜大學|珊瑚高中|南港高中|建國中學|文華高中|明道高中|二信中學|慧燈中學|道明中學|新竹高商|成功高中)/i;

const masturbationWarningRegex = /(?:不要?(?:再|在)?\s*(?:自己)?\s*尻|不要?(?:再|在)?\s*(?:自己)?\s*打(?:手槍|手枪|飛機|飞机)|別(?:再|在)?\s*(?:自己)?\s*(?:尻|打|撸|擼)|别(?:再|在)?\s*(?:自己)?\s*(?:尻|打|撸|擼)|唔好(?:再|在)?\s*(?:自己)?\s*(?:打飛機|J|尻|擼|撸)|咪撚\s*(?:自己)?\s*(?:打飛機|J|尻|擼|撸)|不要一直\s*(?:自己)?\s*尻|不要一直\s*(?:自己)?\s*打(?:手槍|手枪|飛機|飞机)|别一直\s*(?:自己)?\s*尻|别在尻|别在打|别在尻|别再打了|別再打了|别打了|別打了|別擼了|别撸了|別J了|别J了|别打飞机|別打飛機|別打手槍|别打手枪|玩手槍|玩手枪|實名(?:開導|觀看|推薦|观看|开导|推荐)|实名(?:开导|观看|推荐)|又射了|縱慾過度|纵欲过度|著返條褲|別在射精|别在射精|别射精|別射精|別打手槍|别打手枪|會破皮|会破皮|别冲了|別衝了|别冲|別衝)/i;

const plotContextRegex = /^(?:的(?:女神|女友|女朋友|男友|男朋友|时候|時候|回忆|回憶|时代|時代|样子|樣子|日子|故事|剧情|劇情|感觉|感覺|妹子|女孩|女生|男生|学妹|學妹|学姐|學姐|美女|老师|老師|同学|同學)|生|JK|jk|制服|校校服|学生|學生|女优|女優|演员|演員|少女|美少女|辣妹|熟女|人妻)/i;

const studentActionRegex = new RegExp(`(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})(?:[我你他她]|同學|同学|同事|老師|老师|醫生|医生|老闆|老板|只有|说明|是|有|沒|没|在|別|别|不|好|快|整天|到此|生日|畢業|毕业|求求|這|气|那|大|小|長|长|屁股|逆天|牛逼|牛b|神人|實名|实名|太神|太牛|就|被|也|跟|說|说|講|讲|超|愛|爱|想|本|人|雞|鸡|的|都|要|去|戴|拿|看|打|尻|撸|擼|射|叫|做|操|肏|草|干|幹|一定|真的|早就|一直|天天|已|给|給|和|与|與|同|学|學|唱|跳|写|寫|读|讀|听|聽|走|跑|吃|喝|玩|笑|哭|买|買|卖|賣|住|用|到|来|來)`, 'i');

const comparisonNameRegex = new RegExp(`(?:不如|比|像|叫|是)\\s*(?:[\\u4e00-\\u9fa5]{1,4}\\s*)?(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})`, 'i');

const copypastaRules = [
    {
        regex: /(?:火影策划|削弱(?:黑土|通灵兽|青年|大野木|忍战|秽土)|加强(?:秽土|白面具|秽土二代|青年|水门))/i,
        reason: '火影平衡小作文'
    },
    {
        regex: /(?:停止继续观看吧|莫因几分钟 of 几分钟的快感|一辈子的健康 and 幸福|一辈子的健康和幸福|退出这个网页|戒色|手冲再刺激|击穿你的意志|擊穿你的意志|被爱比手冲难|被愛比手沖難|我不想手冲了|我不想手沖了)/i,
        reason: '戒色宣传/鸡汤复读'
    },
    {
        regex: /(?:求(?:一部|一个|这|那|片|视频)|谁知道(?:她|这部|这片|视频|名字|名号|是)|有谁知道|咨询(?:一个|一部|一下)(?:电影|视频|片)|封面是女佣|只记得素人|好人一生平安)/i,
        reason: '求片/求番号模板'
    },
    {
        regex: /(?:SSNI-647：禁欲与背叛|阿丽娜|出差一个月|阿丽娜的吻)/i,
        reason: '小作文/小说复读'
    }
];

const friendTagRules = [
    { regex: /你在看(?:吗|嗎)/i, reason: '圈人喊话 ("你在看吗")' },
    { regex: /有(?:來過|来过)/i, reason: '圈人喊话 ("有来过吗")' },
    { regex: /(?:快去(?:尻槍|尻枪|打飛機|打手槍|打枪|打炮|洗洗睡|打手枪|打飞机))/i, reason: '催促去开导/洗洗睡' },
    { regex: /(?:我知道你躲在(?:這裡|这里)|期末報告|期末报告)/i, reason: '期末报告/躲在这里梗' },
    { regex: /(?:是時候|是时候)讀書了|是時候讀書|是时候读书/i, reason: '催促去读书' },
    { regex: /(?:鍾意|喜欢|喜歡|爱|愛)打(?:飛機|飞机|手槍|手枪|枪|炮)/i, reason: '调侃打飞机' },
    { regex: /(?:早洩|早泄|三秒|快槍手|快枪手)/i, reason: '调侃早泄' },
    { regex: /(?:直接(?:開衝|开冲|開擼|开撸|開打|开打))/i, reason: '直接开撸梗' },
    { regex: /(?:陳澤|陈泽)(?:是?在(?:这里|這里|環境)直播|直播)/i, reason: '主播陈泽复读' },
    { regex: /(?:原神\s*[,，]?\s*启动|原神启动|加强(?:刻晴|马超|超哥|大桥|宫本|韩信|曹操)|加強(?:超哥|馬超|刻晴))/i, reason: '游戏梗复读/原神启动' },
    { regex: /(?:幫看|帮看|幫忙看|帮忙看)/i, reason: '圈人帮看' },
    { regex: /(?:看三小|看三小|看殺小)/i, reason: '挑衅梗 ("看三小")' },
    { regex: /(?:別(?:再?|在)不上(?:課|课)在?家)/i, reason: '劝诫去上课' },
    { regex: /(?:don't|dont|dont't)\s+(?:hit|play)\s+(?:airplane|handgun|gun|dick|cock|penis|off)/i, reason: '英文别打飞机' },
    { regex: /(?:stop|stop\s+playing)\s+(?:hit|play|with)\s+(?:airplane|handgun|gun|dick|cock|penis|off)/i, reason: '英文别打飞机' },
    { regex: /(?:\b\d{5}\b)/, reason: '包含台湾高中学号 (5位)' },
    { regex: /(?:\d+班)/, reason: '包含班级标识' },
    { regex: /(?:别看了|別看了|別看|别看|別J了|别J了|快去读书|快去讀書|去讀書|去读书|期末报告|期末報告)/, reason: '催促去读书/别看了' },
    { regex: /(?:[\u4e00-\u9fa5]{2,4})(?:環境|直播|这可以吗|你看(?:過|过)嗎|你看(?:過|过)吗|這部可以嗎|这部可以吗|環境|直播)/, reason: '圈人询问好不好看' }, // Wait, let's keep original rule expressions exactly!
    { regex: /(?:尻|打|撸|擼|射|J)爽(?:沒|了(?:沒|吗|嗎)|没)/i, reason: '圈人询问开导进度' },
    { regex: /(?:請停下來|请停下来|快停手|快停下|別尻了|别尻了)/, reason: '劝阻开导' },
    { regex: new RegExp('我(?:是|叫)\\s*(?:' + surnameRegexStr + '[\\u4e00-\\u9fa5]{1,2})', 'i'), reason: '自报家门灌水' },
    { regex: /(?:上(?:資訊|资讯|電腦|电脑|體育|体育|英文|數學|数学)課|上課|上课)/, reason: '提及课上观看梗' },
    { regex: /(?:林北|老子|本帥|本帅|拎北)/, reason: '粗俗自称' },
    { regex: /for a visit|visit/i, reason: '英文观光团梗' },
    { regex: /(?:注意一[點点]|半斤八[觀观]|不要以[爲为]你[沒没]事|不要以[爲为]你[沒没]事)/i, reason: '同学警告警告梗' },
    { regex: /(?:去找(?:新有菜|三上|波多野|女優|女优|有菜|櫻空桃|三上|橋本))/i, reason: '催促同学找女优' },
    { regex: /(?:我是?你(?:好)?朋友|我是?你同學|我是?你同学)/i, reason: '提及朋友/同学关系' },
    { regex: /(?:[\u4e00-\u9fa5]{2,4})(?:在吗|在嗎)/i, reason: '在线圈人呼唤' },
    { regex: /(?:看你|看(?:著|着)你|一起|幫你|幫我|對著|对着|用這部|用这部|用这|用這)(?:尻|打手槍|打手枪|打飛機|打飞机|擼|撸)/, reason: '提及与同学互看开导' },
    { regex: new RegExp(`(?:和|跟|長得像|长得像|長得好像|长得好像|好像|很像)(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})(?:好像|很像|$|\\s)`, 'i'), reason: '调侃长得像同学' },
    { regex: /(?:橫|横|豎|竖)衝|學生會|学生会|開會|开会/, reason: '学生会/开会梗' },
    { regex: /不要再促搞了/, reason: '南一中促搞谐音梗' },
    { regex: /(?:不要?[在再]挂睡|不要?[在再]掛睡|掛睡了|挂睡了)/i, reason: '挂睡复读' },
    { regex: /(?:Kingmore|K麼|Kmo)/i, reason: 'Kingmore梗' }
];

const adContactRules = [
    { regex: /(?:联系我|微信号|联系方式|p友|找长期p友|找p友|同城约|约吗|約嗎|约啊|约呗|找个(?:哥哥|妹妹|姐姐|弟弟|爸爸|主)|找m|找s|有s女|想被玩弄|同城|滴滴我|滴滴滴|私我|name传来|求主|求m|鬼女|约嘛|約嘛|找女|找男|约ㄇ|約ㄇ)/i, reason: '交友/约炮关键词' },
    { regex: /(?:收费|微信|加我|微信号|微信號|加v|加V|扣扣|QQ|qq|联系我|主页有|主頁有|看主页|看主頁|主页微|主頁微|主页加|主頁加|主页扣|主頁扣|主页联系|主頁联系|主页v|主頁v|微信群|微信群)/i, reason: '广告推销' },
    { regex: /(?:厦门|武汉|广州|深圳|重庆|上海|北京|四川|贵州|晋江|南京|郑州|常州|澎湖|台南|台北|台中|高雄|新竹)(?:来个|找|约|有|滴|找个|的骚妹|的妹子|男大|女大|男找女|女找男|来相会|相会|约会|见面|开房|约炮|互|约)/i, reason: '同城招嫖广告' },
    { regex: /@\w+\s*,?\s*(?:怎么联系|怎麼聯繫|微信|加我)/i, reason: '向他人索要联系方式' },
    { regex: /(?:\+\s*(?:Q|q|v|V|微信|LINE|Line|line))/i, reason: '索要/提供加号' },
    { regex: /(?:找(?:奴|狗))/i, reason: '低俗特殊癖好加友' },
    { regex: /(?:认识一下|認識一下|認識|认识)\s*[a-zA-Z0-9_]{4,}/i, reason: '求加好友社交' },
    { regex: /(?:物理|有无|有無)(?:哥哥|妹妹|姐姐|弟弟|mm|MM|男生|女生|女的|男的|骚货|帅哥|美女|同城)\s*(?:喜欢|要|约|約|加|带我|c我)/i, reason: '寻找约炮对象' },
    { regex: /找(?:哥哥|妹妹|姐姐|弟弟|mm|MM|男生|女生|女的|男的|帅哥|美女|同城|人陪|陪)/i, reason: '寻找陪伴/约炮' },
    { regex: /(?:关注|關注|訂阅|订阅)\s*(?:我|下|頻道|频道)/i, reason: '求互关广告' },
    { regex: /想被(?:c|操|幹|干|日)的(?:\+|＋|加)/i, reason: '招嫖暗号引流' },
    // JAVLibrary download promotions
    { regex: /(?:点击|點擊|click)\s*(?:此处|此處|進入|进入)?\s*(?:下载|下載|download|观看|觀看)/i, reason: '下载引流推广' },
    { regex: /(?:下载|下載|download)\s*(?:网址|網址|链接|鏈接|地址|更多|资源|資源|torrent)/i, reason: '下载引流推广' },
    { regex: /(?:\.torrent|AI破解版|超清AI|破解版资源|破解版資源)/i, reason: '资源推广广告' },
    { regex: /(?:116pan|windfiles|seekplayer|116pan\.xyz|windfiles\.com)/i, reason: '网盘推广链接' }
];

const harassmentRules = [
    { regex: /(?:把她?當成|把她?当成)\s*([\\u4e00-\\u9fa5]{2,4})\s*(?:肏|操|日|做)/i, reason: '意淫/带入同学代称' },
    { regex: /(?:text|只有|仅有)\d+(?:mm|cm)/i, reason: '恶劣身材/尺寸贬低' },
    { regex: /(?:後悔跟你|后悔跟你)(?:分手|在一起)/, reason: '同学恋爱纠纷调侃' },
    { regex: /跟(?:[\\u4e00-\\u9fa5]{2,3})的(?:小穴|逼|屁股|屁眼|大屁股|雞雞|鸡鸡)/, reason: '对比同学隐私部位 the details' },
    { regex: /(?:我朋友|他朋友|同學|同学)\s*([\\u4e00-\\u9fa5]{2,4})\s*(?:處男|处男|破處|破处)/, reason: '暴露同学性隐私' },
    { regex: new RegExp(`(?:骚货|骚屄|骚逼|婊子|賤人|贱人|臭甲|垃圾)(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})`, 'i'), reason: '辱骂词后跟人名' }
];

const verbMatchRegex = /想(?:这样|這麼|这么|那樣|那样)?(?:干|肏|操|日|弄|草|幹)\s*([a-zA-Z\\u4e00-\\u9fa5]{2,4})/i;

const surname骚MatchRegex = new RegExp(`(${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})好[骚騷]啊`, 'i');

const techRules = [
    { regex: /(?:卡(?:的要死|死了|极了|爆了|的不行|得一比|的一比|了|得)|点解咁卡|怎么(?:那么|這麼|这么|這么)?卡)/i, reason: '网站卡顿疑问' }
];

const trollFightRules = [
    { regex: /(?:^|[^a-zA-Z0-9])(?:xo|xoxo)\s*(?:你(?:妈|媽|马)死了|是不是|老母|全家|你老味)/i, reason: '评论区XO骂战' },
    { regex: /(?:禁言|臭嘴|家[裡里]失火)\s*(?:xo|xoxo)/i, reason: '评论区XO撕逼' },
    { regex: /(?:割了鸡吧|怨天尤人|抢奸|xo(?:母亲|老母|媽|妈))/i, reason: '评论区XO低质骂街' }
];

export function classifyComment(rawComment) {
    if (!rawComment || rawComment.trim() === '') {
        return { label: 'SPAM', category: 'LOW_QUALITY', reason: '空评论' };
    }

    const normalized = normalizeText(rawComment);
    const stripped = stripEmojis(normalized);
    const cleanedForLength = stripped.replace(/\s+/g, '');
    const cleanedNoPunct = cleanedForLength.replace(/[\s\p{P}\p{S}]+/gu, '');
    const hasChinese = /[\u4e00-\u9fa5]/.test(cleanedForLength);

    for (const rule of copypastaRules) {
        if (rule.regex.test(normalized)) {
            return { label: 'SPAM', category: 'COPYPASTA', reason: rule.reason };
        }
    }

    const schoolMatch = schoolRegex.exec(normalized);
    if (schoolMatch) {
        const afterSchool = normalized.slice(schoolMatch.index + schoolMatch[0].length, schoolMatch.index + schoolMatch[0].length + 6);
        if (!plotContextRegex.test(afterSchool)) {
            return { label: 'SPAM', category: 'FRIEND_TAG_MEME', reason: `提及学校/班级背景` };
        }
    }

    if (masturbationWarningRegex.test(normalized)) {
        return { label: 'SPAM', category: 'FRIEND_TAG_MEME', reason: `劝人别开导/打手枪梗` };
    }

    if (/[\u3105-\u312F\u02CA\u02CB\u02C7\u02C9]/.test(normalized)) {
        return { label: 'SPAM', category: 'FRIEND_TAG_MEME', reason: `包含台湾注音（拼音圈人）` };
    }

    const studentActionMatch = studentActionRegex.exec(cleanedNoPunct);
    if (studentActionMatch) {
        const matchedName = studentActionMatch[0];
        if (/^(?:马上|馬上|林北|陈述|陳述|余下|于是|方便|方面|方向|方法|古代|古老|高潮|高中|高兴|高興|周围|周圍|周末|施工|施展|程度|程序|胡说|胡說|胡闹|胡鬧|朱红|朱紅|何必|何况|何況|洪水|曹操|温柔|溫柔|唐突|许多|許多|沈默|江湖|王八|李子|杨柳|楊柳|徐徐|魏然|龚自|顏色|颜色|严格|嚴格|康复|康復|阮囊|褚色|简单|簡單|游泳|学妹|学姐|学弟|学长|學妹|學姐|學弟|學長|女生|女人|旅馆|旅館|失禁|馆开)/i.test(matchedName)) {
            // Keep original logic
        } else {
            return { label: 'SPAM', category: 'FRIEND_TAG_MEME', reason: `针对同学的动作喊话` };
        }
    }

    if (comparisonNameRegex.test(normalized)) {
        return { label: 'SPAM', category: 'FRIEND_TAG_MEME', reason: `与同学名字进行对比` };
    }

    for (const rule of friendTagRules) {
        if (rule.regex.test(normalized)) {
            return { label: 'SPAM', category: 'FRIEND_TAG_MEME', reason: rule.reason };
        }
    }

    for (const rule of adContactRules) {
        if (rule.regex.test(normalized)) {
            return { label: 'SPAM', category: 'AD_CONTACT', reason: rule.reason };
        }
    }

    for (const rule of harassmentRules) {
        if (rule.regex.test(normalized)) {
            return { label: 'SPAM', category: 'HARASSMENT_DOXXING', reason: rule.reason };
        }
    }

    const genericExclusions = [
        '女优', '女優', '女主', '他', '她', '它', '老婆', '闺蜜', '閨蜜', '妹妹',
        '女人', '人', '别人', '別人', '角色', '演员', '演員', '身材', '皮肤', '皮膚',
        '美腿', '丝袜', '絲襪', '衣服', '屁股', '大屁股', '逼', '穴', '闺密', '閨密',
        '妹妹', '姐姐', '前女友', '前妻'
    ];
    const verbMatch = verbMatchRegex.exec(normalized);
    if (verbMatch) {
        const target = verbMatch[1].trim();
        if (!genericExclusions.includes(target.toLowerCase())) {
            return { label: 'SPAM', category: 'HARASSMENT_DOXXING', reason: `针对特定个人的侵害性想法: ${target}` };
        }
    }

    const surname骚Match = surname骚MatchRegex.exec(normalized);
    if (surname骚Match) {
        return { label: 'SPAM', category: 'HARASSMENT_DOXXING', reason: `针对同学人身的性调侃: "${surname骚Match[1]}好骚啊"` };
    }

    for (const rule of techRules) {
        if (rule.regex.test(normalized)) {
            return { label: 'SPAM', category: 'TECHNICAL_NOISE', reason: rule.reason };
        }
    }

    const hasJableEmoji = CFG.FILTER.JABLE_EMOJI_REGEX.test(rawComment);
    const hasUnicodeEmoji = CFG.FILTER.UNICODE_EMOJI_REGEX.test(rawComment);
    const hasEmoji = hasJableEmoji || hasUnicodeEmoji;

    const hasValidTimestamp = /(?:\d{1,3}):(?:\d{2})/.test(normalized);

    if (!hasValidTimestamp && !hasEmoji) {
        if (cleanedForLength.length === 0) {
            return { label: 'SPAM', category: 'LOW_QUALITY', reason: '纯空格/表情符号' };
        }

        if (/^[\s\p{P}\p{S}]+$/u.test(cleanedForLength)) {
            return { label: 'SPAM', category: 'LOW_QUALITY', reason: '仅包含标点/特殊符号' };
        }

        if (/^\d+$/.test(cleanedForLength)) {
            return { label: 'SPAM', category: 'LOW_QUALITY', reason: '纯数字无内容' };
        }

        if (cleanedForLength.length <= 4 && !hasChinese) {
            return { label: 'SPAM', category: 'LOW_QUALITY', reason: '过短的非中文无意义字符' };
        }

        if (/^(.)\1+$/.test(cleanedForLength) && !hasChinese) {
            return { label: 'SPAM', category: 'LOW_QUALITY', reason: '单一字符复读/刷屏' };
        }
    }

    for (const rule of trollFightRules) {
        if (rule.regex.test(normalized)) {
            return { label: 'SPAM', category: 'LOW_QUALITY', reason: rule.reason };
        }
    }

    return { label: 'HAM', category: null, reason: null };
}

// =====================================================================
//  5. TIMESTAMPS PARSING
// =====================================================================
function maskBlacklist(normalizedText) {
    let text = normalizedText;
    const blacklistRules = [
        { regex: /\b(\d+)\s*[pP]\b/g, placeholder: '_PEOPLE_' },
        { regex: /([a-zA-Z]{2,5}-\d{3,4})/gi, placeholder: '_AVCODE_' },
        { regex: /(\d+)\s*[班级級度次]/g, placeholder: '_CLASS_' },
        { regex: /(\d+)\s*年/g, placeholder: '_YEAR_' },
        { regex: /(\d+)\s*[号號]/g, placeholder: '_NUMBER_' },
        { regex: /(\d+)\s*[万萬]播放/g, placeholder: '_VIEWS_' },
        { regex: /(\d+)\s*[万萬]/g, placeholder: '_LARGE_NUM_' },
        { regex: /(\d+)\s*梯/g, placeholder: '_MILITARY_' },
        { regex: /(\d+)\s*mm/gi, placeholder: '_MEASURE_' },
        { regex: /q\s*加\s*\w+/gi, placeholder: '_SPAM_' },
        { regex: /(?<![-:.])\b\d{4,}\b(?![-:.])/g, placeholder: '_LONG_NUM_' }
    ];

    for (const rule of blacklistRules) {
        text = text.replace(rule.regex, rule.placeholder);
    }
    return text;
}

function parseTwoPartTime(a, bStr, isDot = false, hourLimit = 3) {
    let bVal = parseInt(bStr, 10);
    if (isDot && bStr.length === 1) {
        bVal *= 10;
    }
    const aVal = Math.abs(a);
    if (aVal > hourLimit) {
        return aVal * 60 + bVal;
    } else {
        return aVal * 3600 + bVal * 60;
    }
}

function extractCandidates(normalizedText, hourLimit = 3) {
    const candidates = [];

    // L1: Colon H:M:S or M:S
    const l1Regex = /(?<!\d)(-?\d{1,3}):(\d{2})(?::(\d{2}))?(?!\d)/g;
    let match;
    while ((match = l1Regex.exec(normalizedText)) !== null) {
        const raw = match[0];
        const isNegative = raw.startsWith('-');
        const parts = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            match[3] ? parseInt(match[3], 10) : null
        ];
        if (parts[1] >= 60 || (parts[2] !== null && parts[2] >= 60)) {
            continue;
        }
        let seconds = 0;
        const absParts = parts.map(p => p !== null ? Math.abs(p) : null);
        if (absParts[2] !== null) {
            if (absParts[0] > hourLimit) {
                seconds = absParts[0] * 60 + absParts[1];
            } else {
                seconds = absParts[0] * 3600 + absParts[1] * 60 + absParts[2];
            }
        } else {
            if (isNegative) {
                seconds = absParts[0] * 60 + absParts[1];
            } else {
                seconds = parseTwoPartTime(absParts[0], match[2], false, hourLimit);
            }
        }
        candidates.push({
            raw,
            index: match.index,
            end: match.index + raw.length,
            level: 'L1',
            seconds: isNegative ? -seconds : seconds,
            isNegative
        });
    }

    // L2: Dot separator
    const l2Regex = /(?<!\d)(-?\d{1,3})\.(\d{1,2})(?:\.(\d{1,2}))?(?!\d)/g;
    while ((match = l2Regex.exec(normalizedText)) !== null) {
        const raw = match[0];
        const isNegative = raw.startsWith('-');
        const parts = [
            parseInt(match[1], 10),
            match[2],
            match[3] ? parseInt(match[3], 10) : null
        ];
        const part1Val = parseInt(parts[1], 10);
        if (part1Val >= 60 || (parts[2] !== null && parts[2] >= 60)) {
            continue;
        }
        let seconds = 0;
        const absPart0 = Math.abs(parts[0]);
        if (parts[2] !== null) {
            if (absPart0 > hourLimit) {
                seconds = absPart0 * 60 + parseInt(parts[1], 10);
            } else {
                seconds = absPart0 * 3600 + parseInt(parts[1], 10) * 60 + parts[2];
            }
        } else {
            if (isNegative) {
                let bVal = parseInt(parts[1], 10);
                if (parts[1].length === 1) bVal *= 10;
                seconds = absPart0 * 60 + bVal;
            } else {
                seconds = parseTwoPartTime(absPart0, parts[1], true, hourLimit);
            }
        }
        candidates.push({
            raw,
            index: match.index,
            end: match.index + raw.length,
            level: 'L2',
            seconds: isNegative ? -seconds : seconds,
            isNegative
        });
    }

    // L3: Chinese semantics
    const l3hmsRegex = /(?<!\d)(\d{1,2})\s*(?:小时|h|H)\s*(\d{1,2})\s*(?:分钟|分鐘|分|m|M)\s*(\d{1,2})\s*(?:秒钟|秒鐘|秒|s|S)(?!\d)/g;
    while ((match = l3hmsRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L3',
            seconds: parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10),
            isNegative: false
        });
    }

    const l3hmRegex = /(?<!\d)(\d{1,2})\s*(?:小时|h|H)\s*(\d{1,2})\s*(?:分钟|分鐘|分|m|M)(?!\d)/g;
    while ((match = l3hmRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L3',
            seconds: parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60,
            isNegative: false
        });
    }

    const l3msRegex = /(?<!\d)(\d{1,3})\s*(?:分钟|分鐘|分)\s*(\d{1,2})\s*(?:秒钟|秒鐘|秒)(?!\d)/g;
    while ((match = l3msRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L3',
            seconds: parseInt(match[1], 10) * 60 + parseInt(match[2], 10),
            isNegative: false
        });
    }

    const l3mRegex = /(?<!\d)(\d{1,3})\s*(?:分钟|分鐘|分)(?!\d)/g;
    while ((match = l3mRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L3',
            seconds: parseInt(match[1], 10) * 60,
            isNegative: false
        });
    }

    const l3sRegex = /(?<!\d)(\d{1,2})\s*(?:秒钟|秒鐘|秒)(?!\d)/g;
    while ((match = l3sRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L3',
            seconds: parseInt(match[1], 10),
            isNegative: false
        });
    }

    // L5: Slash lists
    const l5SlashRegex = /(?<!\d)(\d{1,3})(?:\s*\/\s*(\d{1,3}))+(?!\d)/g;
    while ((match = l5SlashRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        const numbers = raw.split('/').map(n => parseInt(n.trim(), 10));
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L5',
            seconds: numbers.map(n => n * 60),
            isSlashList: true
        });
    }

    // L5: Isolated single numbers (1 to 3 digits)
    const l5IsolatedRegex = /(?<!\d)\b(\d{1,3})\b(?!\d)/g;
    while ((match = l5IsolatedRegex.exec(normalizedText)) !== null) {
        const raw = match[0];
        candidates.push({
            raw, index: match.index, end: match.index + raw.length, level: 'L5',
            seconds: parseInt(raw, 10),
            isIsolated: true
        });
    }

    return candidates;
}

function resolveOverlaps(candidates) {
    const priorityMap = { 'L1': 1, 'L2': 1, 'L3': 1, 'L5': 2 };
    candidates.sort((a, b) => {
        const prioA = a.isIsolated ? 3 : priorityMap[a.level];
        const prioB = b.isIsolated ? 3 : priorityMap[b.level];
        if (prioA !== prioB) return prioA - prioB;
        if (a.raw.length !== b.raw.length) return b.raw.length - a.raw.length;
        return a.index - b.index;
    });
    const accepted = [];
    for (const cand of candidates) {
        const hasOverlap = accepted.some(acc => Math.max(cand.index, acc.index) < Math.min(cand.end, acc.end));
        if (!hasOverlap) accepted.push(cand);
    }
    accepted.sort((a, b) => a.index - b.index);
    return accepted;
}

function mergeRanges(matches, normalizedText) {
    const merged = [];
    const rangeSeps = ['~', '-', '～', '到'];
    let i = 0;
    while (i < matches.length) {
        const current = matches[i];
        const next = matches[i + 1];
        if (next) {
            const between = normalizedText.slice(current.end, next.index).trim();
            if (rangeSeps.includes(between)) {
                merged.push({
                    raw: normalizedText.slice(current.index, next.end),
                    index: current.index,
                    end: next.end,
                    level: 'L4',
                    subLevels: [current.level, next.level],
                    start: current,
                    endMatch: next,
                    isRange: true
                });
                i += 2;
                continue;
            }
        }
        merged.push(current);
        i++;
    }
    return merged;
}

function validateMatch(match, allResolvedMatches, normalizedText, videoDuration, inRange = false) {
    if (match.index !== undefined) {
        const preText = normalizedText.slice(Math.max(0, match.index - 10), match.index);
        const durationRegex = new RegExp(`(?:${CFG.TIMESTAMPS.DURATION_KEYWORDS.join('|')})[\\s:：,，、]*$`, 'i');
        if (durationRegex.test(preText)) {
            return { isValid: false, reason: '检测到持续时长语义' };
        }

        if (!/[分秒时時hmsmHMS]/i.test(match.raw)) {
            const postText = normalizedText.slice(match.end, Math.min(normalizedText.length, match.end + 5)).trim();
            if (/^[xX倍]/i.test(postText)) {
                return { isValid: false, reason: '检测到播放速度/倍率语义' };
            }
        }
    }

    if (match.isRange) {
        const startVal = validateMatch(match.start, allResolvedMatches, normalizedText, videoDuration, true);
        const endVal = validateMatch(match.endMatch, allResolvedMatches, normalizedText, videoDuration, true);
        if (!startVal.isValid || !endVal.isValid) {
            return { isValid: false, reason: '范围边界无效' };
        }
        return { isValid: true, seconds: [startVal.seconds, endVal.seconds], level: 'L4', confidence: 'High' };
    }

    const validationDuration = Math.max(videoDuration, 28800);

    if (match.isSlashList) {
        const validSeconds = [];
        for (const sec of match.seconds) {
            if (sec <= validationDuration) validSeconds.push(sec);
        }
        if (validSeconds.length === 0) return { isValid: false, reason: '斜杠列表全部超出时长' };
        return { isValid: true, seconds: validSeconds.length === 1 ? validSeconds[0] : validSeconds, level: 'L5', confidence: 'Medium' };
    }

    if (match.isIsolated) {
        const val = match.seconds;
        let isAdjacentToValid = false;
        for (const other of allResolvedMatches) {
            if (other === match || other.isIsolated) continue;
            const earlier = match.index < other.index ? match : other;
            const later = match.index < other.index ? other : match;
            const between = normalizedText.slice(earlier.end, later.index);
            if (/^[\s,，、/\\"\d]*$/.test(between) && between.length < 10) {
                isAdjacentToValid = true;
                break;
            }
        }
        const startWin = Math.max(0, match.index - 5);
        const endWin = Math.min(normalizedText.length, match.end + 5);
        const context = normalizedText.slice(startWin, match.index) + ' | ' + normalizedText.slice(match.end, endWin);

        const minuteKeywords = CFG.TIMESTAMPS.MINUTE_KEYWORDS;
        const secondKeywords = CFG.TIMESTAMPS.SECOND_KEYWORDS;

        const cleanText = normalizedText.replace(/[\s\p{P}\p{S}]+/gu, '');
        let isStandaloneNumber = cleanText === match.raw;
        if (isStandaloneNumber) {
            if (CFG.FILTER.SINGLE_DIGIT_REGEX.test(match.raw) || CFG.FILTER.REPEATING_DIGIT_REGEX.test(match.raw)) {
                isStandaloneNumber = false;
            }
        }

        const hasContext = secondKeywords.some(kw => context.includes(kw)) ||
            minuteKeywords.some(kw => context.includes(kw)) ||
            isAdjacentToValid ||
            isStandaloneNumber ||
            inRange;
        if (!hasContext) return { isValid: false, reason: '孤立数字缺少时间上下文' };

        const isSecond = secondKeywords.some(kw => context.includes(kw));
        const seconds = isSecond ? val : val * 60;
        if (seconds > validationDuration) return { isValid: false, reason: `数值超出限制 (${seconds}秒 > ${validationDuration}秒)` };

        return { isValid: true, seconds, level: 'L5', confidence: 'Medium' };
    }

    let secs = match.seconds;
    if (match.isNegative) {
        const offset = Math.abs(secs);
        if (offset > validationDuration) return { isValid: false, reason: '倒计时超出总时长' };
        secs = videoDuration - offset;
    }
    if (secs > validationDuration) return { isValid: false, reason: '时间点超出视频时长' };
    return { isValid: true, seconds: secs, level: match.level, confidence: 'High' };
}

export function parseTimestamps(rawComment, videoDuration = 10800) {
    const normalized = normalizeText(rawComment);
    const masked = maskBlacklist(normalized);

    let hourLimit = CFG.TIMESTAMPS.HOUR_LIMIT;
    if (videoDuration && videoDuration > 0) {
        hourLimit = Math.floor(videoDuration / 3600);
        if (hourLimit < 1) hourLimit = 1;
        if (hourLimit > 8) hourLimit = 8;
    }

    const rawCandidates = extractCandidates(masked, hourLimit);
    const resolved = resolveOverlaps(rawCandidates);
    const finalMatches = mergeRanges(resolved, masked);

    const valid = [];
    const invalid = [];
    for (const match of finalMatches) {
        const valResult = validateMatch(match, resolved, masked, videoDuration);
        if (valResult.isValid) {
            valid.push({
                raw: match.raw,
                seconds: valResult.seconds,
                level: match.level,
                confidence: valResult.confidence
            });
        } else {
            invalid.push({ raw: match.raw, reason: valResult.reason });
        }
    }
    let confidence = 'None';
    if (valid.length > 0) {
        const priorities = { 'High': 3, 'Medium': 2, 'Low': 1 };
        let maxPrio = 0;
        for (const v of valid) {
            const p = priorities[v.confidence] || 0;
            if (p > maxPrio) { maxPrio = p; confidence = v.confidence; }
        }
    }
    return { isValid: valid.length > 0, validTimestamps: valid, invalidTimestamps: invalid, confidence };
}

// =====================================================================
//  6. AVCODE EXTRACTOR
// =====================================================================
const oRegExp = /(?<!\w|\/|www\.|=|col-|\d-|>|Jukujo-)(?!heyzo|SHINKI|JPNXXX|carib|vps)[a-zA-Z]{2,6}-\d{2,5}(?:-c|_c|-4k)?(?!\d|[A-Za-z]{2,}|-\d|\.com|\.\d)|(?<!\w|\/|\\|\.|【|-|#|@|=|www\.)(?!heyzo|SHINKI|JPNXXX|carib|and|vps|dvd)[a-zA-Z]{2,6}\s{0,2}\d{3,4}(?:-c|_c)?(?!\w|-|\.|\/|×|％|%|@|\s?天| 于| 发表| 發表|歳| 歲|小时|分|系列| Min| day|ml| time|cm| ppi|\.com)|(?<!\w)(?:PARATHD|3DSVR|STARSBD)[-\s]?\d{3,4}(?!\w)|(?<!\w)(?:HIMEMIX|CASMANI|MGSSLND)[-\s]?\d{3}(?!\w)|(?<!\w)(?:k|n)[01]\d{3}(?!\w|-)|(?<!\w|\d-|\/)[01]\d{5}[-_](?:1)?\d{2,3}(?!\w|-\d)|(?<!\w)(?:carib|1pondo)[-_]\d{6}[-_]\d{2,3}(?!\w)|(?<!\w|\d-)\d{6}[-_]\d{2,3}(?:-1pon|-carib|-paco)(?!\w)|(?<!\w|\d-)\d{6}_(1)?\d{3}_0[12](?!\w|-\d)|HEYZO[_-\s]?(?:hd_)?\d{4}/gi;
const oRegExp_wuma = /(?<!\w|-|\/)\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}(?!\w|-|.torrent|年)|(?<!\w|\/)FC2[^\d]{0,5}\d{6,7}|HEYDOUGA[_-\s]?\d{4}-\d{3,5}|(?<!\w)T28-\d{3}|(?<!\w)T-2\d{4,5}(?!\w|-)|(?<!\w|-|\/)[01]\d{5}-[a-zA-Z]{2,7}(?!\w|-)|(?<!\w)MK(?:B)?D-S\d{2,3}(?!\w|-)|(?:SHINKI|KITAIKE)[-\s]?\d{3}(?!\w|-)|JPNXXX[-\s]?\d{5}(?!\w|-)|xxx-av[-\s]\d{4,5}(?!\w|-)|(?<!\w)crazyasia\d{5}(?!\w|-)|(?<!\w)PEWORLD\d{5}(?!\w|-)|(?<!\w)[01]\d{5}[-_]?_01(?=-10mu)?|Jukujo-Club-\d{3}/gi;
const oRegExp2 = /(?<=(?<!\w|\d-)([a-zA-Z]{2,6})(?:[\s,，、-]?(?!2022|2021|2020|2019)\d{3,4})+(?!\d)[\s,、，和跟]{0,2})\d{3,4}(?!\w|％|%|人|年|歳|万|の|发)/gmi;
const oRegExp_wuma2 = /(?<=(FC2[^\d]{0,5})(?:[\s,、-]?\d{6,7})+[\s,、]?)\d{6,7}/gmi;
const oRegExp_Exclude_ID = /^(?:fx-?([^0]\d{2}|\d{4})|[a-zA-Z]+-?0{2,6}$|pg-13|crc-32|ea211|fs[\s-]?140|trc-20|erc-20|rs[\s-]?(232|422|485)|(sg|ae|kr|tw|ph|vn|kh|ru|uk|ua|tr|th|fr|in|de|sr)[\s-]\d{2}|(gm|ga)-\d{4}|cd[\s-]?\d{2,4}|seed[\s-]?\d{3}$|pc005|moc-\d{5}|wd-40|rtd[\s-]?\d{4}|cm\d{4}|rk\d{4})|ns[\s-]?\d{3,4}/i;
const oRegExp_Exclude_en = /^(?:about|ac|actg|adreno|aes|aff|again|agm|all|ak|akko|apex|aptx|arm|au|ax|avhd|avx|bej|bgm|bd|bm|build|(?:fc|p)?[blp]ga|by|bzk|cc|ccie|cctv|cea|chrome|ckg|class|cny|code|core|covid|cpu|dc|debian|df|ds|dw|dx|ea|edit|er|ecma|eia|emui|eof|ep|error|exp|ez|fc|file|flash|flyme|fps|for|fork|from|fuck|fx|gbx|get|github|glm|gnz|gp|groupr|gt|gts|gtx|guest|hao|hd|her|hdr|hk|https?|hp|IEEE|il|ilc|ilce|imx|index|intel|inteli|ip|ipad|is|ISBN|iso|issue|issues|it|jav|javdb|joy|jp|jr|jsr|jt|jukujo|just|kc|keccak|kv[bd]|Kirin|kryo|lancet|libx|line|linux|lk|lolrng|lpl|lt|lumia|lg|macos|math|md|mh|miui|mipc|mnvr|mm|model|mv|mvp|ms|nas|nature|nc|next|ngff|note|number|ok|only|os|oss|osx|opga|pa|page|pch|phl|pmw|png|ppv|qbz|qsz|raid|rfc|ripemd|rmb|rng|rog|row|rtx|rush|rx|sale|scp|scte|sdm|sdr|server|sha|shp|sonnet|spent|sql|sn|snh|Socket|ssd|status|steam|su|swipe|tcp|the|top|than|thread|tr|ts|type|uh|uhd|under|us|usa|usc|utf|utc|via|video|vkffsc|vol|vr|vs|vv|web|win|with|width|wikis|wta|xdr|xfx|xiaomi|yah)$/i;
const oRegExp_Special_en = /^(?:ace|akb|api|am|anime|at|be|best|bt|bl|cp|crc|exynos|dl|dp|dq|gb|girl|jd|ha|has|hc|hours|iq|in|mk|mini|mhz|mx|no|open|of|over|part|pd|pdd|porn|pt|sb|sex|tv|tb|ty|ver|vip|zd|zip)$/i;
const oRegExp_Special_num = /^(?:007|101|110|115|123|128|256|360|365|370|404|512|520|911|996|\d{1,2}00|19[789]\d|20[012]\d|720|1080|1024|2048|[056789]\d{3}|(\d)\1{2,3})$/;
const oRegExp_Exclude_wuma = /^(?:512gb)/i;

function IDcheck(otext) {
    const oOnlyText = otext.replace(/[^a-zA-Z]/gi, '');
    const oOnlyNum = otext.replace(/[^0-9]/ig, '');
    if (otext.match(oRegExp_Exclude_ID)) return true;
    if (oOnlyText.match(oRegExp_Exclude_en)) return true;
    if (otext.match(/^[a-z|A-Z]{2,8}\s?\d{2,5}$/i)) {
        if (oOnlyNum.match(oRegExp_Special_num)) return true;
        if (oOnlyText.match(oRegExp_Special_en)) return true;
    }
    return false;
}

function IDcheckWuma(otext) {
    if (otext.match(/\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}/i)) {
        if (otext.replace(/[^a-zA-Z]/gi, "").match(/^cm$/i)) return true;
    }
    if (otext.match(oRegExp_Exclude_wuma)) return true;
    return false;
}

function formatAVID(otext) {
    let formatted = otext.replace(/\s+|-c|_c|-4k|carib[-_]|1pondo[-_]|-1pon|-paco|-carib|hd_/ig, '');
    if (formatted.match(/(?:k|n)\d{4}/i)) return formatted.toLowerCase();
    if (formatted.match(/^[a-zA-Z]{2,8}\d{2,5}$/i)) {
        const oindex = formatted.search(/\d/);
        if (oindex > 0) formatted = formatted.slice(0, oindex) + '-' + formatted.slice(oindex);
    }
    return formatted.toUpperCase();
}

function formatWuma(otext) {
    let formatted = otext.replace(/\s+|carib[-_]|1pondo[-_]|-1pon|-paco|-carib|hd_/ig, '');
    if (formatted.match(/fc2/i)) {
        const oindex = formatted.search(/(?<!fc)\d/i);
        return ('FC2-' + formatted.slice(oindex)).toUpperCase();
    }
    if (formatted.match(/heyzo/i)) {
        const oindex = formatted.search(/\d/i);
        return 'HEYZO-' + formatted.slice(oindex);
    }
    if (formatted.match(/(?:k|n)\d{4}/i)) return formatted.toLowerCase();
    if (formatted.match(/t28|t-|MKD-S|SHINKI|KITAIKE|JPNXXX|xxx-av|crazyasia|PEWORLD|MKBD-S/i)) {
        return formatted.toUpperCase();
    }
    if (formatted.match(/HEYDOUGA/i)) {
        return 'heydouga-' + formatted.slice(formatted.search(/\d/i));
    }
    return formatted;
}

export function extractAVCodes(comment, contextPrefix) {
    const codes = new Set();
    const normalized = normalizeText(comment);

    let match;
    oRegExp.lastIndex = 0;
    while ((match = oRegExp.exec(normalized)) !== null) {
        const matchedStr = match[0].trim();
        if (!IDcheck(matchedStr)) codes.add(formatAVID(matchedStr));
    }

    oRegExp_wuma.lastIndex = 0;
    while ((match = oRegExp_wuma.exec(normalized)) !== null) {
        const matchedStr = match[0].trim();
        if (!IDcheckWuma(matchedStr)) {
            let avID = formatWuma(matchedStr);
            if (avID.match(/^\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}$/)) {
                avID = formatAVID(avID.slice(3));
            }
            codes.add(avID);
        }
    }

    oRegExp2.lastIndex = 0;
    while ((match = oRegExp2.exec(normalized)) !== null) {
        if (match[1]) {
            const avID = match[1] + " " + match[0];
            if (!IDcheck(avID)) codes.add(formatAVID(avID));
        }
    }

    oRegExp_wuma2.lastIndex = 0;
    while ((match = oRegExp_wuma2.exec(normalized)) !== null) {
        if (match[1]) {
            const avID = match[1] + match[0];
            if (!IDcheckWuma(avID)) codes.add(formatWuma(avID));
        }
    }

    if (contextPrefix) {
        const standaloneNumRegex = /(?<!\w|\d\s*|-|:|：|\.|。|\/|\\)\b\d{3,4}\b(?!\s*\d|\w|-\d|:|：|\.|。|\/|\\|分|秒|岁|歲|年|万|萬|播放|次|倍|位|个|個|人|元|包|px|p|P|gb|GB|mb|MB|kb|KB)/g;
        let numMatch;
        standaloneNumRegex.lastIndex = 0;
        while ((numMatch = standaloneNumRegex.exec(normalized)) !== null) {
            const numStr = numMatch[0];
            if (!numStr.match(oRegExp_Special_num)) {
                const fullCode = `${contextPrefix}-${numStr}`;
                if (!IDcheck(fullCode)) codes.add(fullCode.toUpperCase());
            }
        }
    }
    return Array.from(codes);
}

// =====================================================================
//  7. HIGHLIGHT TEXT
// =====================================================================
function makeHighlightRegex(raw) {
    let pattern = '';
    for (let i = 0; i < raw.length; i++) {
        const char = raw[i];
        if (/\d/.test(char)) {
            const fw = String.fromCharCode(char.charCodeAt(0) + 0xfee0);
            pattern += `[${char}${fw}]`;
        } else if (char === ':') {
            pattern += '\\s*[:：]\\s*';
        } else if (char === '.') {
            pattern += '\\s*[\\.。．]\\s*';
        } else if (char === '-') {
            pattern += '\\s*[-－—]\\s*';
        } else if (char === '~' || char === '～') {
            pattern += '\\s*[-~～ー－—到至]\\s*';
        } else if (/\s/.test(char)) {
            pattern += '\\s*';
        } else {
            const escaped = char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            pattern += `\\s*${escaped}\\s*`;
        }
    }
    return new RegExp(pattern, 'g');
}

function buildAvcodeRegex(code) {
    let pattern = '(?<![a-zA-Z\\d\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A])';
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if (/[a-zA-Z]/.test(char)) {
            const upper = char.toUpperCase();
            const lower = char.toLowerCase();
            const fwUpper = String.fromCharCode(upper.charCodeAt(0) + 0xfee0);
            const fwLower = String.fromCharCode(lower.charCodeAt(0) + 0xfee0);
            pattern += `[${upper}${lower}${fwUpper}${fwLower}]`;
        } else if (/\d/.test(char)) {
            const fw = String.fromCharCode(char.charCodeAt(0) + 0xfee0);
            pattern += `[${char}${fw}]`;
        } else if (char === '-' || char === '_') {
            pattern += '[-_－—\\s]?';
        } else {
            const escaped = char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            pattern += escaped;
        }
    }
    pattern += '(?![a-zA-Z\\d\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A])';
    return new RegExp(pattern, 'gi');
}

export function formatSeconds(sec) {
    if (Array.isArray(sec)) return sec.map(formatSeconds).join(' ~ ');
    if (sec < 0) return sec.toString();
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

function parseBBCode(text) {
    if (!text) return '';
    let html = text;
    
    // 1. Convert [b]...[/b] to <b>...</b>
    html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
    
    // 2. Convert [color=...]...[/color] to <span style="color: ...">...</span>
    html = html.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1">$2</span>');
    
    // 3. Convert [url=...]...[/url] to <a href="..." target="_blank">...</a>
    html = html.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (match, url, linkText) => {
        let targetUrl = url;
        if (url.startsWith('/')) {
            targetUrl = `https://c97k.com${url}`;
        }
        return `<a href="${targetUrl}" target="_blank" class="jc-comment-link">${linkText}</a>`;
    });
    html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (match, url) => {
        let targetUrl = url;
        if (url.startsWith('/')) {
            targetUrl = `https://c97k.com${url}`;
        }
        return `<a href="${targetUrl}" target="_blank" class="jc-comment-link">${url}</a>`;
    });
    
    // 4. Strip any other unparsed tags to be safe (like [i], [u], etc.)
    html = html.replace(/\[\/?[a-zA-Z]+[^\]]*\]/g, '');
    
    return html;
}

export function highlightCommentText(text, timestamps, avcodes) {
    let html = esc(text);
    
    // Parse BBCode safely after escaping
    html = parseBBCode(html);
    
    const replacements = {};
    let idCounter = 0;

    const sortedTimestamps = [...timestamps].sort((a, b) => b.raw.length - a.raw.length);
    sortedTimestamps.forEach(ts => {
        const regex = makeHighlightRegex(ts.raw);
        html = html.replace(regex, (match) => {
            const tokenId = `___TS_${idCounter++}___`;
            const secsAttr = Array.isArray(ts.seconds) ? JSON.stringify(ts.seconds) : ts.seconds;
            replacements[tokenId] = `<span class="jc-time-link" data-secs='${secsAttr}' title="跳转至此时间">${match}</span>`;
            return tokenId;
        });
    });

    avcodes.forEach(code => {
        const regex = buildAvcodeRegex(code);
        html = html.replace(regex, (match) => {
            const tokenId = `___AV_${idCounter++}___`;
            replacements[tokenId] = `<span class="jc-code-link" data-code="${esc(code)}" title="复制并搜索番号">${match}</span>`;
            return tokenId;
        });
    });

    const jableEmojis = {
        love: 1, hungry: 2, tongue: 3, skr: 4, cool: 5,
        funny: 6, sad: 7, devil: 8, angry: 9
    };
    html = html.replace(/:([a-zA-Z]{2,15}):/g, (match, name) => {
        const lowerName = name.toLowerCase();
        if (jableEmojis[lowerName]) {
            return `<img class="jc-emoji" src="https://assets-cdn.jable.tv/assets/images/emoji/${jableEmojis[lowerName]}.svg" alt=":${name}:" title=":${name}:" />`;
        }
        return match;
    });

    for (const [token, rep] of Object.entries(replacements)) {
        html = html.replace(token, rep);
    }
    return html;
}

export function processComment(commentText, contextPrefix, videoDuration = 10800) {
    // 1. 净化引用回复类：移除 BBCode 的 [quote] 引用块
    let cleanedText = commentText;
    if (commentText.includes('[quote') || commentText.includes('[/quote]')) {
        cleanedText = commentText.replace(/\[quote[^\]]*\][\s\S]*?\[\/quote\]/gi, '').trim();
    }

    const spam = classifyComment(cleanedText);
    let timestamps = [];
    let avcodes = [];
    
    if (spam.label !== 'SPAM') {
        const tsResult = parseTimestamps(cleanedText, videoDuration);
        if (tsResult.isValid) {
            timestamps = tsResult.validTimestamps;
        }
        avcodes = extractAVCodes(cleanedText, contextPrefix);
    }

    const textHtml = highlightCommentText(cleanedText, timestamps, avcodes);

    return {
        spam,
        timestamps,
        avcodes,
        textHtml
    };
}

// =====================================================================
//  7. JAVLIBRARY CRAWLER & PARSER
// =====================================================================

/**
 * Clean avcode specifically for JAVLibrary search matching.
 */
function matchAvCode(a, b) {
    const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean(a) === clean(b);
}

/**
 * Searches JAVLibrary by avcode and resolves to a JAVLibrary video ID (e.g. javliXXXXX)
 * @param {string} avcode - The movie番号 (e.g. IPX-123)
 * @returns {Promise<string>} The video ID
 */
/**
 * Searches JAVLibrary by avcode and resolves to a JAVLibrary video ID (e.g. javliXXXXX)
 * @param {string} avcode - The movie番号 (e.g. IPX-123)
 * @param {number} domainIndex - The active domain index in JAVLIB_DOMAINS
 * @returns {Promise<Object>} Object containing videoId and working domain
 */
/**
 * Helper to retrieve JAVLibrary cookie from cross-domain cookiesMap, matching by hostname (ignoring www. prefix)
 * @param {string} targetDomain - The target origin/domain URL (e.g. "https://c97k.com")
 * @returns {string} The cookie value
 */
function getJavLibCookie(targetDomain) {
    if (typeof GM_getValue !== 'function') return '';
    const cookiesMap = GM_getValue('javlib_cookies') || {};
    
    const getHost = (urlStr) => {
        try {
            return new URL(urlStr).hostname.replace(/^www\./, '');
        } catch (e) {
            return urlStr.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        }
    };
    
    const targetHost = getHost(targetDomain);
    for (const key of Object.keys(cookiesMap)) {
        if (getHost(key) === targetHost) {
            return cookiesMap[key] || '';
        }
    }
    return '';
}

export function fetchJavLibraryVideoId(avcode, domainIndex = 0, lastError = null) {
    if (!avcode) return Promise.reject(new Error('Invalid AVCode'));
    if (domainIndex >= JAVLIB_DOMAINS.length) {
        return Promise.reject(lastError || new Error('All JAVLibrary domains failed'));
    }
    const domain = JAVLIB_DOMAINS[domainIndex];
    const cleanCode = avcode.toLowerCase().trim();
    const url = `${domain}/cn/vl_searchbyid.php?keyword=${encodeURIComponent(cleanCode)}`;

    const tryNext = (err) => {
        // 判断当前错误和前一个错误是否属于 Cloudflare 人机验证拦截
        const isCurrentCf = err && (err.message === 'CLOUDFLARE_SHIELD' || err.message.includes('CF_SHIELD'));
        const isPrevCf = lastError && (lastError.message === 'CLOUDFLARE_SHIELD' || lastError.message.includes('CF_SHIELD'));
        
        let nextErr = err;
        if (isPrevCf && !isCurrentCf) {
            nextErr = lastError;
        } else if (isCurrentCf && !err.message.includes('CF_SHIELD_ON_')) {
            nextErr = new Error(`CF_SHIELD_ON_${domain}`);
        }

        if (domainIndex < JAVLIB_DOMAINS.length - 1) {
            logger.log(`JAVLibrary 域名 ${domain} 搜索失败，尝试下一个备用域名...`);
            return fetchJavLibraryVideoId(avcode, domainIndex + 1, nextErr);
        } else {
            const finalErr = (nextErr && (nextErr.message === 'CLOUDFLARE_SHIELD' || nextErr.message.includes('CF_SHIELD')))
                ? nextErr
                : (err || new Error('All JAVLibrary domains failed'));
            return Promise.reject(finalErr);
        }
    };

    const isSameOrigin = (() => {
        try {
            if (typeof window === 'undefined' || !window.location || !window.location.hostname) return false;
            const targetHost = new URL(domain).hostname.replace(/^www\./, '');
            const currentHost = window.location.hostname.replace(/^www\./, '');
            return targetHost === currentHost;
        } catch (e) {
            return false;
        }
    })();

    if (isSameOrigin) {
        const sameOriginUrl = url.replace(domain, window.location.origin);
        logger.log(`[CommentScraper] 搜索 JAVLibrary 番号 (同源 fetch): ${cleanCode} (URL: ${sameOriginUrl})`);
        const fetchFn = (typeof unsafeWindow !== 'undefined' && unsafeWindow.fetch) ? unsafeWindow.fetch.bind(unsafeWindow) : fetch;
        return fetchFn(sameOriginUrl, {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'referer': `${window.location.origin}/cn/`
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (response.status === 403 || response.status === 503) {
                throw new Error('CLOUDFLARE_SHIELD');
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return Promise.all([response.text(), response.url]);
        })
        .then(([text, finalUrl]) => {
            let workingDomain = domain;
            if (finalUrl && finalUrl.startsWith('http')) {
                try {
                    workingDomain = new URL(finalUrl).origin;
                } catch (e) {}
            }

            const videoId = extractVideoIdFromUrl(finalUrl);
            if (videoId) {
                logger.log(`找到 JAVLibrary ID (重定向): ${videoId} (工作域名: ${workingDomain})`);
                return { videoId, domain: workingDomain };
            }

            const foundId = parseJavLibraryVideoIdHtml(text, cleanCode, workingDomain);
            return { videoId: foundId, domain: workingDomain };
        })
        .catch(err => {
            return tryNext(err);
        });
    }

    // 非同源跨域，使用 GM_xmlhttpRequest 并可能加上缓存 Cookie/UA
    const cookie = getJavLibCookie(domain);
    const ua = typeof GM_getValue === 'function' ? GM_getValue('javlib_user_agent') : '';

    const headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'referer': `${domain}/cn/`
    };

    if (cookie) {
        headers['Cookie'] = cookie;
    }
    if (ua) {
        headers['User-Agent'] = ua;
    }

    return new Promise((resolve, reject) => {
        logger.log(`搜索 JAVLibrary 番号: ${cleanCode} (域名: ${domain})`);
        
        let completed = false;
        const safeResolve = (val) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                resolve(val);
            }
        };
        const safeReject = (err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                reject(err);
            }
        };

        const handleTryNext = (err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
            }
            tryNext(err).then(resolve).catch(reject);
        };

        const timer = setTimeout(() => {
            if (!completed) {
                logger.warn(`JAVLibrary 搜索超时 (已达到 10000ms 限制，手动中止): ${url}`);
                if (req && typeof req.abort === 'function') {
                    try { req.abort(); } catch (e) {}
                }
                handleTryNext(new Error('Timeout'));
            }
        }, 10000);

        const req = GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            anonymous: false,
            timeout: 10000,
            headers: headers,
            withCredentials: true,
            onload(r) {
                if (completed) return;
                logger.log(`JAVLibrary 搜索响应状态码: ${r.status}`);
                if (r.status === 403 || r.status === 503) {
                    handleTryNext(new Error('CLOUDFLARE_SHIELD'));
                    return;
                }
                
                let workingDomain = domain;
                const finalUrl = r.finalUrl || '';
                if (finalUrl.startsWith('http')) {
                    try {
                        workingDomain = new URL(finalUrl).origin;
                    } catch (e) {}
                }

                // 1. 检查是否发生重定向到详情页 (e.g. https://www.javlibrary.com/cn/?v=javliXXXXX)
                const videoId = extractVideoIdFromUrl(finalUrl);
                if (videoId) {
                    logger.log(`找到 JAVLibrary ID (重定向): ${videoId} (工作域名: ${workingDomain})`);
                    safeResolve({ videoId, domain: workingDomain });
                    return;
                }

                // 2. 如果没有重定向，解析搜索结果 HTML 匹配番号
                try {
                    const text = r.responseText;
                    const foundId = parseJavLibraryVideoIdHtml(text, cleanCode, workingDomain);
                    safeResolve({ videoId: foundId, domain: workingDomain });
                } catch (err) {
                    handleTryNext(err);
                }
            },
            onerror(e) {
                if (completed) return;
                logger.error('JAVLibrary 搜索失败:', e);
                handleTryNext(new Error('Network error or blocked'));
            },
            ontimeout() {
                if (completed) return;
                handleTryNext(new Error('Timeout'));
            }
        });
    });
}

/**
 * Helper to extract video ID from redirected JAVLibrary URL
 */
function extractVideoIdFromUrl(url) {
    if (!url) return '';
    const matchQuery = url.match(/[\?&]v=([^&]+)/);
    const matchHtml = url.match(/\/cn\/(jav[a-z0-9]+)\.html/i);
    return matchQuery ? matchQuery[1] : (matchHtml ? matchHtml[1] : '');
}

/**
 * Helper to parse JAVLibrary search HTML
 */
function parseJavLibraryVideoIdHtml(text, cleanCode, domain) {
    if (!text || text.trim() === '') {
        throw new Error('Empty response');
    }

    if (text.includes('cf-challenge') || text.includes('Turnstile') || text.includes('Checking your browser')) {
        throw new Error('CLOUDFLARE_SHIELD');
    }

    const doc = new DOMParser().parseFromString(text, 'text/html');
    const videos = doc.querySelectorAll('.videos .video a');
    
    let foundId = '';
    for (const a of videos) {
        const idEl = a.querySelector('.id');
        if (idEl) {
            const codeText = idEl.textContent.trim();
            if (matchAvCode(codeText, cleanCode)) {
                const href = a.getAttribute('href') || '';
                const m = href.match(/v=([^&]+)/);
                if (m) {
                    foundId = m[1];
                    break;
                }
            }
        }
    }

    if (!foundId && videos.length > 0) {
        const href = videos[0].getAttribute('href') || '';
        const m = href.match(/v=([^&]+)/);
        if (m) foundId = m[1];
    }

    if (foundId) {
        logger.log(`找到 JAVLibrary ID (搜索列表): ${foundId} (工作域名: ${domain})`);
        return foundId;
    }

    const urlMatch = text.match(/videocomments\.php\?v=([^"]+)/);
    if (urlMatch) {
        logger.log(`从页面文本中解析到 JAVLibrary ID: ${urlMatch[1]} (工作域名: ${domain})`);
        return urlMatch[1];
    }

    throw new Error('Movie not found on JAVLibrary');
}

/**
 * Helper to parse comments or reviews
 */
function parseJavLibraryDataHtml(text, type, page, activeDomain) {
    if (!text || text.trim() === '') {
        throw new Error('Empty response');
    }

    if (text.includes('cf-challenge') || text.includes('Turnstile') || text.includes('Checking your browser')) {
        throw new Error(`CF_SHIELD_ON_${activeDomain}`);
    }

    const isReviews = type === 'reviews';
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const selector = isReviews ? 'table.review' : 'table.comment';
    const tables = doc.querySelectorAll(selector);
    const comments = [];

    tables.forEach((table, index) => {
        const userEl = table.querySelector('.userid a');
        const user = userEl ? userEl.textContent.trim() : 'Anonymous';
        let userUrl = userEl ? userEl.getAttribute('href') : '';
        if (userUrl) {
            if (userUrl.startsWith('.')) {
                userUrl = `${activeDomain}/cn${userUrl.substring(1)}`;
            } else if (userUrl.startsWith('/')) {
                userUrl = `${activeDomain}/cn${userUrl}`;
            } else if (!userUrl.startsWith('http')) {
                userUrl = `${activeDomain}/cn/${userUrl}`;
            }
        }

        const dateEl = table.querySelector('.date');
        const time = dateEl ? dateEl.textContent.trim() : '';

        const textarea = table.querySelector('textarea.hidden');
        const contentText = textarea ? (textarea.value || textarea.textContent || '').trim() : '';

        const ratingEl = table.querySelector('[class^="rating"]');
        const score = ratingEl ? ratingEl.getAttribute('title') : null;

        if (contentText || user !== 'Anonymous') {
            comments.push({
                id: `javlib-${type}-${page}-${index}`,
                user,
                userUrl,
                time,
                text: contentText,
                score,
                isPending: false,
                site: 'javlib'
            });
        }
    });

    const pageSelector = doc.querySelector('.page_selector');
    let hasMore = false;
    let totalCount = comments.length;
    
    if (pageSelector) {
        const nextPattern = new RegExp(`[\\?&]page=${page + 1}(?:&|$)`);
        const pageLinks = pageSelector.querySelectorAll('a');
        for (const a of pageLinks) {
            if (nextPattern.test(a.getAttribute('href') || '')) {
                hasMore = true;
                break;
            }
        }
    }

    return { comments, totalCount, hasMore };
}

/**
 * Fetch and parse comments or reviews from JAVLibrary
 * @param {string} videoId - The JAVLibrary video ID (e.g. javliXXXXX)
 * @param {string} type - 'comments' or 'reviews'
 * @param {number} page - Page number
 * @param {string} domain - The working domain resolved from ID fetching
 * @returns {Promise<Object>}
 */
export function fetchJavLibraryData(videoId, type = 'comments', page = 1, domain) {
    if (!videoId) return Promise.reject(new Error('Invalid VideoId'));
    const isReviews = type === 'reviews';
    const endpoint = isReviews ? 'videoreviews.php' : 'videocomments.php';
    const activeDomain = domain || JAVLIB_DOMAINS[0];
    const url = `${activeDomain}/cn/${endpoint}?v=${videoId}&page=${page}`;

    const isSameOrigin = (() => {
        try {
            if (typeof window === 'undefined' || !window.location || !window.location.hostname) return false;
            const targetHost = new URL(activeDomain).hostname.replace(/^www\./, '');
            const currentHost = window.location.hostname.replace(/^www\./, '');
            return targetHost === currentHost;
        } catch (e) {
            return false;
        }
    })();

    if (isSameOrigin) {
        const sameOriginUrl = url.replace(activeDomain, window.location.origin);
        logger.log(`[CommentScraper] 采集 JAVLibrary ${type} (同源 fetch, Page ${page}): ${sameOriginUrl}`);
        const fetchFn = (typeof unsafeWindow !== 'undefined' && unsafeWindow.fetch) ? unsafeWindow.fetch.bind(unsafeWindow) : fetch;
        return fetchFn(sameOriginUrl, {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'referer': `${window.location.origin}/cn/?v=${videoId}`
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (response.status === 403 || response.status === 503) {
                throw new Error(`CF_SHIELD_ON_${activeDomain}`);
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            return parseJavLibraryDataHtml(text, type, page, activeDomain);
        });
    }

    const cookie = getJavLibCookie(activeDomain);
    const ua = typeof GM_getValue === 'function' ? GM_getValue('javlib_user_agent') : '';

    const headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'referer': `${activeDomain}/cn/?v=${videoId}`
    };

    if (cookie) {
        headers['Cookie'] = cookie;
    }
    if (ua) {
        headers['User-Agent'] = ua;
    }

    return new Promise((resolve, reject) => {
        logger.log(`采集 JAVLibrary ${type} (Page ${page}): ${url}`);
        
        let completed = false;
        const safeResolve = (val) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                resolve(val);
            }
        };
        const safeReject = (err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                reject(err);
            }
        };

        const timer = setTimeout(() => {
            if (!completed) {
                logger.warn(`JAVLibrary 采集超时 (已达到 10000ms 限制，手动中止): ${url}`);
                if (req && typeof req.abort === 'function') {
                    try { req.abort(); } catch (e) {}
                }
                safeReject(new Error('Timeout'));
            }
        }, 10000);

        const req = GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            anonymous: false,
            timeout: 10000,
            headers: headers,
            withCredentials: true,
            onload(r) {
                if (completed) return;
                if (r.status === 403 || r.status === 503) {
                    safeReject(new Error(`CF_SHIELD_ON_${activeDomain}`));
                    return;
                }

                try {
                    const text = r.responseText;
                    const res = parseJavLibraryDataHtml(text, type, page, activeDomain);
                    safeResolve(res);
                } catch (err) {
                    safeReject(err);
                }
            },
            onerror(e) {
                if (completed) return;
                logger.error(`JAVLibrary ${type} 采集失败:`, e);
                safeReject(new Error('Network error or blocked'));
            },
            ontimeout() {
                if (completed) return;
                logger.error(`JAVLibrary ${type} 采集超时`);
                safeReject(new Error('Timeout'));
            }
        });
    });
}

