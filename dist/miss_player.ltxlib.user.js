// ==UserScript==
// @name               Miss Player | LTXLib 跨站伴侣 (iOS Stay / CSP 兼容)
// @namespace          loadingi.local
// @version            5.7.121-beta.002
// @author             Chris_C
// @description        为 ltxlib.dpdns.org 卡片注入跨站播放入口，兼容 iOS Safari Stay 隔离沙箱与严格 CSP
// @license            MIT
// @icon               https://missav.ws/img/favicon.ico
// @downloadURL        https://raw.githubusercontent.com/Chris-C1108/Miss_Player/dev/dist/miss_player.ltxlib.user.js
// @updateURL          https://raw.githubusercontent.com/Chris-C1108/Miss_Player/dev/dist/miss_player.ltxlib.meta.js
// @match              *://ltxlib.dpdns.org/*
// @match              *://*.ltxlib.dpdns.org/*
// @connect            *
// @connect            123av.com
// @connect            www.123av.com
// @connect            javverse.com
// @connect            www.javverse.com
// @connect            missav.ai
// @connect            www.missav.ai
// @connect            missav.ws
// @connect            www.missav.ws
// @connect            jable.tv
// @connect            www.jable.tv
// @grant              GM_xmlhttpRequest
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_openInTab
// @grant              GM_addStyle
// @inject-into        content
// @run-at             document-end
// @noframes
// ==/UserScript==

(function() {
	//#region src/constants/domains.js
	var SITE_DOMAINS = {
		MISSAV: {
			primary: "missav.ai",
			backups: ["missav.ws"]
		},
		JABLE: {
			primary: "jable.tv",
			backups: ["fs1.app"]
		},
		JAVLIBRARY: {
			primary: "c97k.com",
			backups: ["javlib.com"],
			aliases: [
				"javlibrary.com",
				"www.javlibrary.com",
				"www.javlib.com",
				"www.c97k.com"
			]
		},
		JAVDB: {
			primary: "javdb.com",
			backups: ["javdb36.com"],
			aliases: [
				"javdb.com",
				"www.javdb.com",
				"javdb.net"
			]
		}
	};
	/**
	* 获取某个站点的活跃域名列表 (primary + backups)，用于网络请求轮询
	* @param {string} siteKey - 站点 Key (如 'MISSAV', 'JABLE')
	* @returns {string[]} 域名列表 (不包含协议)
	*/
	function getSiteDomains(siteKey) {
		const config = SITE_DOMAINS[siteKey];
		if (!config) return [];
		return [config.primary, ...config.backups || []];
	}
	//#endregion
	//#region src/utils/storage.js
	/**
	* 存储管理工具函数 (支持 GM_getValue/GM_setValue 和 localStorage 降级)
	*/
	var LOCAL_STORAGE_PREFIX = "mp_";
	var LEGACY_STORAGE_PREFIX = "missNoAD_";
	/**
	* 检查是否支持 GM_getValue / GM_setValue 接口
	* @returns {boolean} 是否支持 GM 存储接口
	*/
	function hasGMApi() {
		return typeof GM_getValue === "function" && typeof GM_setValue === "function";
	}
	/**
	* 获取存储值 (支持 GM API 与 localStorage 穿透互愈双读)
	* @param {string} key - 存储键名
	* @param {any} defaultValue - 默认值
	* @param {boolean} [useGM=true] - 是否优先使用 GM API
	* @returns {any} 存储的数据值
	*/
	function getValue(key, defaultValue = null, useGM = true) {
		try {
			let gmVal = void 0;
			const gmAvailable = useGM && hasGMApi();
			if (gmAvailable) {
				try {
					gmVal = GM_getValue(key, void 0);
				} catch (_) {}
				if (gmVal !== void 0 && gmVal !== null) return gmVal;
			}
			let localVal = defaultValue;
			let item = null;
			try {
				if (typeof localStorage !== "undefined") {
					item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
					if (item === null) item = localStorage.getItem(LEGACY_STORAGE_PREFIX + key);
				}
			} catch (_) {}
			if (item !== null) {
				try {
					localVal = JSON.parse(item);
				} catch (e) {
					localVal = item;
				}
				if (gmAvailable && localVal !== void 0 && localVal !== null) try {
					GM_setValue(key, localVal);
				} catch (_) {}
				return localVal;
			}
			return gmVal !== void 0 ? gmVal : defaultValue;
		} catch (e) {
			console.error(`[Storage] 获取存储键 ${key} 失败:`, e);
			return defaultValue;
		}
	}
	/**
	* 设置存储值 (支持 GM API 与 localStorage 镜像双写持久化，彻底杜绝换域名/沙箱抖动配置丢失)
	* @param {string} key - 存储键名
	* @param {any} value - 要存储的数据值
	* @param {boolean} [useGM=true] - 是否优先使用 GM API
	*/
	function setValue(key, value, useGM = true) {
		try {
			if (useGM && hasGMApi()) try {
				GM_setValue(key, value);
			} catch (gmErr) {
				console.warn(`[Storage] GM_setValue 写入异常:`, gmErr);
			}
			if (typeof localStorage !== "undefined") try {
				const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;
				localStorage.setItem(LOCAL_STORAGE_PREFIX + key, serializedValue);
			} catch (_) {}
		} catch (e) {
			console.error(`[Storage] 设置存储键 ${key} 失败:`, e);
		}
	}
	//#endregion
	//#region src/utils/videoCode.js
	var TECHNICAL_BLACKLIST = /* @__PURE__ */ new Set([
		"1080P",
		"720P",
		"480P",
		"2160P",
		"4K",
		"8K",
		"UHD",
		"FHD",
		"HD",
		"SD",
		"H264",
		"H265",
		"X264",
		"X265",
		"HEVC",
		"AVC",
		"AAC",
		"MP4",
		"MKV",
		"AVI",
		"WMV",
		"TS",
		"M2TS",
		"SUB",
		"CH",
		"ZH",
		"CN",
		"UNCENSORED",
		"LEAK",
		"WIN7",
		"WIN10",
		"WIN11",
		"WIN",
		"ISO",
		"SHA",
		"MD5",
		"SAMPLE",
		"TRAILER",
		"JAN",
		"FEB",
		"MAR",
		"APR",
		"MAY",
		"JUN",
		"JUL",
		"AUG",
		"SEP",
		"OCT",
		"NOV",
		"DEC",
		"FPS",
		"KB",
		"MB",
		"GB",
		"TB",
		"PAGE",
		"EPISODE",
		"PART",
		"VOL",
		"DISC",
		"DVD",
		"VOD",
		"NAUGHTY",
		"BRAZZERS",
		"BLACKED",
		"REALITY",
		"TUSHY",
		"TUSHYS",
		"BANG",
		"MOFOS",
		"BABES",
		"VIXEN",
		"DEVIL",
		"TWISTYS",
		"SWEET",
		"SEXY",
		"MODEL",
		"ADULT",
		"PORN",
		"EROTIC",
		"FAKINGS",
		"FAKE",
		"AMATEUR",
		"CREAMPIE",
		"BLONDE",
		"MILF",
		"TEEN",
		"TEENS",
		"BIGTITS",
		"STEP",
		"UPDATE",
		"POST",
		"ITEM",
		"USER",
		"ORDER",
		"CODE",
		"TEST",
		"VIDEO",
		"VIDEOS",
		"MOVIE",
		"MOVIES",
		"IMAGE",
		"IMAGES",
		"PHOTO",
		"PHOTOS",
		"STUDENT",
		"SCHOOL",
		"PARTY",
		"BEACH",
		"SUMMER",
		"WINTER",
		"SPRING",
		"AUTUMN",
		"ONLINE",
		"MOBILE",
		"SERVER",
		"CLIENT",
		"PLAYER",
		"STATUS",
		"SYSTEM",
		"CONFIG",
		"FILTER",
		"BUTTON",
		"LAYOUT",
		"REPORT",
		"DOMAIN",
		"COOKIE",
		"RECORD",
		"UPLOAD",
		"STREAM",
		"SOURCE",
		"PUBLIC",
		"GLOBAL",
		"COMMON",
		"SHARED",
		"SECRET",
		"NOTICE",
		"DETAIL",
		"HEADER",
		"FOOTER",
		"BANNER",
		"SELECT",
		"SUBMIT",
		"CANCEL",
		"DELETE",
		"REMOVE",
		"INSERT",
		"SEARCH",
		"RESULT",
		"FOLLOW",
		"MEMBER",
		"CREDIT",
		"SCREEN",
		"WINDOW",
		"SCROLL",
		"BOTTOM",
		"NORMAL",
		"DIALOG",
		"DRAWER",
		"HOT",
		"TOP",
		"BEST",
		"NEW",
		"ASIAN"
	]);
	var LANGUAGE_SLUGS = /* @__PURE__ */ new Set([
		"zh-cn",
		"zh-tw",
		"cn",
		"en",
		"tw",
		"ja",
		"jp",
		"vi",
		"ko",
		"th",
		"ru"
	]);
	var NON_AV_LEAF_SLUGS = /* @__PURE__ */ new Set([
		.../* @__PURE__ */ new Set([
			"search",
			"s",
			"forum",
			"forum.php",
			"index.html",
			"index.php",
			"warmup.html",
			"login",
			"register",
			"signin",
			"signup",
			"home",
			"tags",
			"genres",
			"actors",
			"actresses",
			"makers",
			"directors",
			"series",
			"categories",
			"channels",
			"playlists",
			"dmca",
			"terms",
			"privacy",
			"about",
			"help",
			"contact",
			"v1_star.php",
			"preview",
			"member",
			"vip",
			"download",
			"upload",
			"news",
			"rank",
			"ranking",
			"popular",
			"latest",
			"release",
			"recent",
			"favorite",
			"history",
			"new",
			"top",
			"trending"
		]),
		...LANGUAGE_SLUGS,
		"watch",
		"videos",
		"video",
		"movie",
		"movies"
	]);
	var NON_AV_SLUGS = /* @__PURE__ */ new Set([...NON_AV_LEAF_SLUGS]);
	var PARSER_RULES = [
		{
			type: "FC2",
			regex: /(?:FC2(?:[_s-]?PPV)?|PPV)[_s-]?(\d{5,7})\b/i,
			format: (m) => `FC2-PPV-${m[1]}`
		},
		{
			type: "MGS",
			regex: /\b(\d{3}[A-Z]{2,6})[_s-]?(\d{2,5})\b/i,
			format: (m) => `${m[1].toUpperCase()}-${m[2]}`
		},
		{
			type: "UNCENSORED_DATE",
			regex: /\b(\d{6})[_s-](\d{3})\b/,
			format: (m) => `${m[1]}-${m[2]}`
		},
		{
			type: "TOKYO_HOT",
			regex: /\b(CZ|[NK])(\d{4})\b/i,
			format: (m) => `${m[1].toUpperCase()}${m[2]}`
		},
		{
			type: "HEYZO",
			regex: /\bHEYZO[_s-]?(\d{4})\b/i,
			format: (m) => `HEYZO-${m[1]}`
		},
		{
			type: "STANDARD_HYPHEN",
			regex: /\b([A-Z]{2,6})[\s_\-](\d{2,5})\b/i,
			format: (m) => `${m[1].toUpperCase()}-${m[2]}`
		},
		{
			type: "DMM_CID",
			regex: /\b([A-Z]{2,6})(?:00|0)(\d{2,5})\b/i,
			format: (m) => {
				const prefix = m[1].toUpperCase();
				let num = m[2].replace(/^0+/, "");
				if (num.length === 1) num = "0" + num;
				return `${prefix}-${num}`;
			}
		},
		{
			type: "DM",
			regex: /\bDM[_s-]?([1-9]\d{1,4})\b/i,
			format: (m) => `DM-${m[1]}`
		},
		{
			type: "COMPACT",
			regex: /\b([A-Z]{2,6})(\d{2,5})\b/i,
			format: (m) => {
				const prefix = m[1].toUpperCase();
				let num = m[2].replace(/^0+/, "");
				if (num.length === 1) num = "0" + num;
				return `${prefix}-${num}`;
			}
		}
	];
	/**
	* 字符串预降噪清洗管道 (Sanitizer Pipeline)
	* 全角转半角、剔除中英括注内容、剥离 MissAV 路由分片 (/dm84/...) 及常见画质/字幕后缀
	* @param {string} str
	* @returns {string}
	*/
	function sanitizeInput(str) {
		if (!str || typeof str !== "string") return "";
		return str.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 65248)).replace(/\u3000/g, " ").replace(/\[[^\]]*\]|【[^】]*】|\([^\)]*\)/g, " ").replace(/\/dm\d+(?=\/[^/?#]+)/gi, "").replace(/[-_ ](?:c|ch|uc|hd|fhd|4k|leaked|leak|uncensored|chinese|wuma|youma|subtitle|sub|reduced[-_]mosaic)\b/gi, " ").trim();
	}
	/**
	* 判断是否为合法的番号格式
	* @param {string} code - 待检测字符串
	* @returns {boolean}
	*/
	function isValidAvCode(code) {
		if (!code || typeof code !== "string") return false;
		const s = code.trim();
		if (s.length < 2 || s.length > 50) return false;
		if (NON_AV_SLUGS.has(s.toLowerCase())) return false;
		if (/\.(html|php|htm|js|css|mp4|mkv|avi|wmv)$/i.test(s)) return false;
		for (const rule of PARSER_RULES) {
			const m = s.match(rule.regex);
			if (m) {
				const prefix = (m[1] || "").toUpperCase();
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
	function matchAvCodeFromText(rawStr) {
		if (!rawStr) return "";
		const text = sanitizeInput(rawStr);
		for (const rule of PARSER_RULES) {
			const match = text.match(rule.regex);
			if (match) {
				const prefix = (match[1] || "").toUpperCase();
				if (TECHNICAL_BLACKLIST.has(prefix)) continue;
				const formatted = rule.format(match);
				if (isValidAvCode(formatted)) {
					if (rule.type === "DM") try {
						console.log("[VideoCode Diagnostic] 命中 DM 匹配:", {
							rawStr: String(rawStr).slice(0, 100),
							matched: match[0],
							formatted
						});
					} catch (_) {}
					return formatted;
				}
			}
		}
		return "";
	}
	/**
	* 保持向后兼容的番号清洗函数
	* @param {string} code - 原始番号
	* @returns {string} 规范化大写番号
	*/
	function cleanAvCode(code) {
		if (!code) return "";
		return matchAvCodeFromText(code) || code.trim().toUpperCase();
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.150.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region src/services/CrossSitePlayRouter.js
	/**
	* 跨站播放双轨路由器 (CrossSitePlayRouter)
	*
	* 为纯索引站（如 ltxlib.dpdns.org，强 CSP 禁止同页加载外部媒体/Blob/Worker/Iframe）
	* 提供双轨自适应跨站播放能力：
	*   - 轨道 A（网关主轨）：若用户配置了 miss-gateway 且 /health 可达，直接打开同源影院页
	*     {GATEWAY}/v1/{TOKEN}/watch/{CODE}#title=...&poster=...
	*     网关负责 123AV/JAVVerse/MissAV/Jable 寻源、Referer 注入与 HLS 代理，零广告零 CSP 冲突。
	*   - 轨道 B（纯脚本备轨）：无网关或网关不可达时，客户端通过 GM_xmlhttpRequest 对
	*     123AV / JAVVerse / MissAV / Jable 进行轻量页面探活（含 IsEquivalentCode 防假阳性），
	*     写入 60s 一次性跨站租约后新标签打开目标站，并由 Miss Player 自动拉起影院模式。
	*/
	var CROSS_SITE_HANDOFF_KEY = "mp_cross_site_handoff";
	var RESOLVE_CACHE_TTL_MS = 18e5;
	var CF_COOLDOWN_MS = 9e5;
	var GATEWAY_HEALTH_TTL_MS = 15e3;
	var THEATER_HASH_PARAM = "mp_theater";
	var PEACH_KEY_GATEWAY_BASE = "mp_peach_gateway_base";
	var PEACH_KEY_REMOTE_SCRAPER = "mp_peach_remote_scraper";
	var PEACH_KEY_GATEWAY_TOKEN = "mp_peach_gateway_token";
	var KNOWN_SUFFIX_RE = /(?:[-_](?:uncensored(?:[-_]leaked|[-_]leak)?|leaked|leak|chinese|sub|ch|c|4k|hd|fhd|reduced[-_]mosaic))+$/i;
	var STANDARD_CODE_RE = /^([a-z]{2,8}|\d{3}[a-z]{2,6})[-_ ]*0*(\d+)$/i;
	var FC2_CODE_RE = /^(?:fc2[-_ ]*)?(?:ppv[-_ ]*)?(\d{5,8})$/i;
	var DATE_CODE_RE = /^(\d{6})[-_ ](\d{3})$/;
	var TOKYO_HOT_RE = /^(cz|n|k)(\d{4})$/i;
	var CROSS_SITE_SOURCES = [
		{
			id: "123av",
			label: "123AV",
			weight: 100,
			delayMs: 0
		},
		{
			id: "javverse",
			label: "JAVVerse",
			weight: 90,
			delayMs: 0
		},
		{
			id: "missav",
			label: "MissAV",
			weight: 80,
			delayMs: 250
		},
		{
			id: "jable",
			label: "Jable",
			weight: 50,
			delayMs: 350
		}
	];
	function extractSlug(raw) {
		let s = String(raw || "").trim();
		if (s.includes("/")) {
			try {
				if (/^https?:\/\//i.test(s)) s = new URL(s).pathname || s;
			} catch (_) {}
			s = s.replace(/\/+$/, "");
			const parts = s.split("/");
			if (parts.length > 0) s = parts[parts.length - 1];
		}
		const dotIdx = s.lastIndexOf(".");
		if (dotIdx !== -1 && dotIdx > s.length - 6) s = s.slice(0, dotIdx);
		return s.trim();
	}
	/**
	* 提取结构化番号核心（对齐 miss-gateway/internal/source/matcher.go）
	*/
	function extractCodeCore(raw) {
		let clean = extractSlug(raw).replace(KNOWN_SUFFIX_RE, "").trim();
		if (!clean) return null;
		let m = clean.match(FC2_CODE_RE);
		if (m) return {
			prefix: "FC2",
			number: m[1],
			type: "FC2"
		};
		m = clean.match(DATE_CODE_RE);
		if (m) return {
			prefix: m[1],
			number: m[2],
			type: "DATE"
		};
		m = clean.match(TOKYO_HOT_RE);
		if (m) return {
			prefix: m[1].toUpperCase(),
			number: m[2],
			type: "TOKYO_HOT"
		};
		m = clean.match(STANDARD_CODE_RE);
		if (m) return {
			prefix: m[1].toUpperCase(),
			number: m[2] || "0",
			type: "STANDARD"
		};
		return null;
	}
	/**
	* 严格番号等价核验，防止搜索页 WSP-1010 等子串假阳性冒充 WSP-101
	*/
	function isEquivalentAvCode(targetCode, candidate) {
		const coreT = extractCodeCore(targetCode);
		const coreC = extractCodeCore(candidate);
		if (coreT && coreC) return coreT.prefix === coreC.prefix && coreT.number === coreC.number && coreT.type === coreC.type;
		const norm = (v) => extractSlug(v).replace(KNOWN_SUFFIX_RE, "").replace(/[-_\s]/g, "").toUpperCase();
		const nt = norm(targetCode);
		const nc = norm(candidate);
		return Boolean(nt && nt === nc);
	}
	function normalizeCode(rawCode) {
		const upper = String(rawCode || "").trim().toUpperCase();
		return cleanAvCode(upper) || upper;
	}
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function isCloudflareBlocked(status, html = "") {
		if (status === 403 || status === 503) return true;
		if (!html) return false;
		const lower = String(html).toLowerCase();
		return lower.includes("cf-challenge") || lower.includes("turnstile") || lower.includes("checking your browser") || lower.includes("cloudflare");
	}
	function defaultTransport(url, options = {}) {
		const { method = "GET", headers = {}, timeout = 8e3, body = null, preferGM = false } = options;
		const isSameOrigin = (() => {
			try {
				const targetHost = new URL(url).hostname;
				return typeof location !== "undefined" && location.hostname === targetHost;
			} catch {
				return false;
			}
		})();
		const doGMRequest = () => {
			if (typeof GM_xmlhttpRequest === "function") return new Promise((resolve, reject) => {
				let completed = false;
				let req = null;
				const timer = setTimeout(() => {
					if (!completed) {
						completed = true;
						if (req && req.abort) req.abort();
						reject(/* @__PURE__ */ new Error("NETWORK_TIMEOUT"));
					}
				}, timeout);
				req = GM_xmlhttpRequest({
					method,
					url,
					headers,
					data: body,
					timeout,
					onload: (res) => {
						if (completed) return;
						completed = true;
						clearTimeout(timer);
						resolve({
							status: res.status,
							html: res.responseText || "",
							finalUrl: res.finalUrl || url
						});
					},
					onerror: (err) => {
						if (completed) return;
						completed = true;
						clearTimeout(timer);
						reject(new Error(err && err.statusText || "NETWORK_ERROR"));
					},
					ontimeout: () => {
						if (completed) return;
						completed = true;
						clearTimeout(timer);
						reject(/* @__PURE__ */ new Error("NETWORK_TIMEOUT"));
					}
				});
			});
			return Promise.reject(/* @__PURE__ */ new Error("NO_TRANSPORT_AVAILABLE"));
		};
		if (!preferGM && isSameOrigin && typeof fetch === "function") return fetch(url, {
			method,
			headers,
			body
		}).then(async (res) => ({
			status: res.status,
			html: await res.text(),
			finalUrl: res.url
		})).catch(() => doGMRequest());
		return doGMRequest();
	}
	function extractHost(url) {
		try {
			return new URL(url).hostname.replace(/^www\./i, "");
		} catch {
			return "";
		}
	}
	function isKnownPlayDomain(hostname) {
		const host = String(hostname || "").toLowerCase();
		if (!host) return false;
		return [
			"123av.com",
			"javverse.com",
			...getSiteDomains("MISSAV"),
			...getSiteDomains("JABLE")
		].some((d) => host === d || host.endsWith("." + d));
	}
	function getGatewayEndpoint() {
		let base = String(getValue(PEACH_KEY_GATEWAY_BASE, "") || getValue(PEACH_KEY_REMOTE_SCRAPER, "") || "").trim();
		if (!base) return null;
		base = base.replace(/\/api\/resolve\/?.*$/, "").replace(/\/+$/, "");
		if (!/^https?:\/\//i.test(base)) return null;
		const token = String(getValue(PEACH_KEY_GATEWAY_TOKEN, "dev") || "dev").trim() || "dev";
		return {
			base,
			token
		};
	}
	var CrossSitePlayRouter = class {
		static setNotifier(fn) {
			this._notifier = typeof fn === "function" ? fn : null;
		}
		static notify(msg, duration = 2400, type = "info") {
			if (this._notifier) this._notifier(msg, duration, type);
		}
		static setGatewayConfig({ base = "", token = "dev" } = {}) {
			const cleanBase = String(base || "").trim().replace(/\/+$/, "");
			const cleanToken = String(token || "dev").trim() || "dev";
			setValue(PEACH_KEY_GATEWAY_BASE, cleanBase);
			setValue(PEACH_KEY_GATEWAY_TOKEN, cleanToken);
			this._gatewayProbeCache = {
				base: "",
				ok: false,
				checkedAt: 0
			};
		}
		/**
		* 轻量探活 miss-gateway /health（15s 内复用结果）
		*/
		static async probeGatewayHealth(force = false, transport = defaultTransport) {
			const gw = getGatewayEndpoint();
			if (!gw) return {
				reachable: false,
				gateway: null
			};
			const now = Date.now();
			if (!force && this._gatewayProbeCache.base === gw.base && now - this._gatewayProbeCache.checkedAt < GATEWAY_HEALTH_TTL_MS) return {
				reachable: this._gatewayProbeCache.ok,
				gateway: gw
			};
			let ok = false;
			try {
				const res = await transport(`${gw.base}/health`, {
					preferGM: true,
					timeout: 900
				});
				ok = res && res.status >= 200 && res.status < 400;
			} catch (_) {
				ok = false;
			}
			this._gatewayProbeCache = {
				base: gw.base,
				ok,
				checkedAt: now
			};
			return {
				reachable: ok,
				gateway: gw
			};
		}
		static isGatewayConfigured() {
			return Boolean(getGatewayEndpoint());
		}
		/**
		* 构造轨道 A 网关同源影院页 URL（title/poster 置于 #hash，不进服务端日志）
		*/
		static buildGatewayWatchUrl(gateway, code, { sourceId = "", title = "", poster = "" } = {}) {
			const cleanCode = normalizeCode(code);
			const query = sourceId ? `?src=${encodeURIComponent(sourceId)}` : "";
			const hashParams = new URLSearchParams();
			if (title) hashParams.set("title", String(title).slice(0, 120));
			if (poster && /^https?:\/\//i.test(poster)) hashParams.set("poster", poster);
			const hash = hashParams.toString();
			return `${gateway.base}/v1/${encodeURIComponent(gateway.token)}/watch/${encodeURIComponent(cleanCode)}${query}${hash ? "#" + hash : ""}`;
		}
		/**
		* 写入跨站影院接力租约（60 秒有效，消费即销毁）
		*/
		static writeHandoffLease({ code, source, targetUrl, title = "", poster = "" }) {
			setValue(CROSS_SITE_HANDOFF_KEY, {
				code: normalizeCode(code),
				source: source || "",
				targetUrl: targetUrl || "",
				title: String(title || "").slice(0, 120),
				poster: poster || "",
				createdAt: Date.now()
			});
		}
		/**
		* 为跨站直达链接附加 #mp_theater=1 接力标记，支持不同脚本沙箱间无共享存储自动拉起影院模式
		*/
		static appendTheaterHash(url) {
			const raw = String(url || "").trim();
			if (!raw) return raw;
			const hashIdx = raw.indexOf("#");
			if (hashIdx === -1) return `${raw}#${THEATER_HASH_PARAM}=1`;
			const existingHash = raw.slice(hashIdx + 1);
			if (existingHash.includes(`${THEATER_HASH_PARAM}=`)) return raw;
			return existingHash ? `${raw}&${THEATER_HASH_PARAM}=1` : `${raw}${THEATER_HASH_PARAM}=1`;
		}
		/**
		* 在目标播放站消费 URL hash 中的 #mp_theater=1 接力标记并清理地址栏
		*/
		static consumeTheaterHash(loc = typeof location !== "undefined" ? location : null) {
			try {
				if (!loc || !isKnownPlayDomain(loc.hostname)) return false;
				const hash = String(loc.hash || "");
				if (!hash || !hash.includes(`${THEATER_HASH_PARAM}=1`)) return false;
				const kept = hash.replace(/^#/, "").split("&").filter((part) => part && part !== `${THEATER_HASH_PARAM}=1`);
				const nextHash = kept.length > 0 ? `#${kept.join("&")}` : "";
				if (typeof history !== "undefined" && typeof history.replaceState === "function") history.replaceState(null, "", `${loc.pathname || "/"}${loc.search || ""}${nextHash}`);
				return true;
			} catch (_) {
				return false;
			}
		}
		/**
		* 在目标站点消费跨站接力租约，决定是否自动拉起 Miss Player 影院模式
		*/
		static consumeHandoffLease(hostname = typeof location !== "undefined" ? location.hostname : "") {
			try {
				const raw = getValue(CROSS_SITE_HANDOFF_KEY, null);
				if (!raw || typeof raw !== "object") return null;
				const age = Date.now() - Number(raw.createdAt || 0);
				if (age < 0 || age > 6e4) {
					setValue(CROSS_SITE_HANDOFF_KEY, null);
					return null;
				}
				const host = String(hostname || "").toLowerCase();
				if (!host) return null;
				let matchesTarget = false;
				try {
					if (raw.targetUrl) {
						const targetHost = new URL(raw.targetUrl).hostname.toLowerCase();
						if (host === targetHost || host.endsWith("." + targetHost) || targetHost.endsWith("." + host)) matchesTarget = true;
					}
				} catch (_) {}
				if (!matchesTarget) matchesTarget = isKnownPlayDomain(host);
				if (!matchesTarget) return null;
				setValue(CROSS_SITE_HANDOFF_KEY, null);
				return raw;
			} catch (_) {
				return null;
			}
		}
		/**
		* 123AV 轻量探活（优先无码流出）
		*/
		static async probe123Av(code, transport = defaultTransport) {
			const lower = normalizeCode(code).toLowerCase();
			const candidates = [{
				url: `https://123av.com/cn/v/${lower}-uncensored-leaked`,
				variant: "无码流出"
			}, {
				url: `https://123av.com/cn/v/${lower}`,
				variant: "普通版"
			}];
			const hasEmbed = (html) => /https?:\/\/[a-zA-Z0-9_.\-:]+\/e\/[a-zA-Z0-9_\-]+/.test(String(html || "").replace(/\\/g, ""));
			for (const item of candidates) try {
				const res = await transport(item.url, {
					preferGM: true,
					timeout: 4500,
					headers: { Referer: "https://123av.com/" }
				});
				if (res && res.status === 200 && hasEmbed(res.html)) return {
					sourceId: "123av",
					sourceName: `123AV (${item.variant})`,
					url: res.finalUrl || item.url,
					weight: 100
				};
			} catch (_) {}
			try {
				const searchUrl = `https://123av.com/cn/search?keyword=${encodeURIComponent(lower)}`;
				const sRes = await transport(searchUrl, {
					preferGM: true,
					timeout: 4500,
					headers: { Referer: "https://123av.com/" }
				});
				if (sRes && sRes.status === 200 && sRes.html) {
					const slugs = [...sRes.html.matchAll(/\/cn\/v\/([a-zA-Z0-9_\-]+)/g)].map((m) => m[1]);
					const unique = [...new Set(slugs)].filter((slug) => isEquivalentAvCode(code, slug));
					unique.sort((a, b) => Number(b.includes("uncensored")) - Number(a.includes("uncensored")));
					for (const slug of unique.slice(0, 3)) {
						const detailUrl = `https://123av.com/cn/v/${slug}`;
						const dRes = await transport(detailUrl, {
							preferGM: true,
							timeout: 4500,
							headers: { Referer: searchUrl }
						});
						if (dRes && dRes.status === 200 && hasEmbed(dRes.html)) return {
							sourceId: "123av",
							sourceName: `123AV (${slug.includes("uncensored") ? "无码流出" : "普通版"})`,
							url: dRes.finalUrl || detailUrl,
							weight: 100
						};
					}
				}
			} catch (_) {}
			return null;
		}
		/**
		* JAVVerse 轻量探活（解析搜索页 workId，严格防跨卡片串号）
		*/
		static async probeJavVerse(code, transport = defaultTransport) {
			const upper = normalizeCode(code);
			const core = extractCodeCore(upper);
			const searchUrl = `https://javverse.com/en/search?q=${encodeURIComponent(upper)}`;
			const matchesCode = (snippet) => {
				const txt = String(snippet || "").toUpperCase();
				if (txt.includes(upper)) return true;
				if (core) return txt.includes(`${core.prefix}-${core.number}`) || txt.includes(`${core.prefix}${core.number}`);
				return false;
			};
			try {
				const res = await transport(searchUrl, {
					preferGM: true,
					timeout: 4500,
					headers: { Referer: "https://javverse.com/" }
				});
				if (!res || res.status >= 400 || !res.html) return null;
				for (const m of res.html.matchAll(/<a[^>]+href="[^"]*\/(?:[a-z]{2}\/)?work\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)) if (matchesCode(m[2])) return {
					sourceId: "javverse",
					sourceName: "JAVVerse",
					url: `https://javverse.com/work/${m[1]}`,
					weight: 90
				};
				for (const m of res.html.matchAll(/<(?:div|article|li)[^>]*>[\s\S]*?<\/(?:div|article|li)>/gi)) if (matchesCode(m[0])) {
					const wm = m[0].match(/\/(?:[a-z]{2}\/)?work\/(\d+)/i);
					if (wm) return {
						sourceId: "javverse",
						sourceName: "JAVVerse",
						url: `https://javverse.com/work/${wm[1]}`,
						weight: 90
					};
				}
			} catch (_) {}
			return null;
		}
		/**
		* MissAV 轻量探活（带 15min Cloudflare 熔断保护）
		*/
		static async probeMissAv(code, transport = defaultTransport, { allowDirectFallback = false } = {}) {
			const lower = normalizeCode(code).toLowerCase();
			const domains = getSiteDomains("MISSAV");
			const primaryUrl = `https://${domains[0] || "missav.ai"}/cn/${lower}`;
			const blockedUntil = this._cfBlockedUntil.get("missav") || 0;
			if (Date.now() < blockedUntil) return allowDirectFallback ? {
				sourceId: "missav",
				sourceName: "MissAV (需过盾)",
				url: primaryUrl,
				weight: 10,
				challenged: true
			} : null;
			for (const domain of domains) {
				const url = `https://${domain}/cn/${lower}`;
				try {
					const res = await transport(url, {
						preferGM: true,
						timeout: 4500,
						headers: { Referer: `https://${domain}/` }
					});
					if (isCloudflareBlocked(res.status, res.html)) {
						this._cfBlockedUntil.set("missav", Date.now() + CF_COOLDOWN_MS);
						break;
					}
					if (res.status >= 200 && res.status < 400 && /playlist\.m3u8|m3u8|surrit\.com/i.test(res.html || "")) return {
						sourceId: "missav",
						sourceName: "MissAV",
						url: res.finalUrl || url,
						weight: 80
					};
				} catch (_) {}
			}
			return allowDirectFallback ? {
				sourceId: "missav",
				sourceName: "MissAV (直达)",
				url: primaryUrl,
				weight: 10,
				challenged: true
			} : null;
		}
		/**
		* Jable 轻量探活
		*/
		static async probeJable(code, transport = defaultTransport) {
			const lower = normalizeCode(code).toLowerCase();
			const core = extractCodeCore(code);
			const slugs = [lower];
			if (core) {
				const normSlug = `${core.prefix.toLowerCase()}-${core.number}`;
				if (normSlug !== lower) slugs.push(normSlug);
			}
			const domains = getSiteDomains("JABLE");
			for (const domain of domains) for (const slug of slugs) {
				const url = `https://${domain}/videos/${slug}/`;
				try {
					const res = await transport(url, {
						preferGM: true,
						timeout: 4500,
						headers: { Referer: `https://${domain}/` }
					});
					if (res && res.status >= 200 && res.status < 400 && /hlsUrl\s*=/.test(res.html || "")) return {
						sourceId: "jable",
						sourceName: "Jable",
						url: res.finalUrl || url,
						weight: 50
					};
				} catch (_) {}
			}
			return null;
		}
		/**
		* 轨道 B 并发错峰探活（命中 123AV 高权源即提前返回，30min 缓存）
		*/
		static async resolveClientSource(code, { sourceId = "", transport = defaultTransport } = {}) {
			const cleanCode = normalizeCode(code);
			const cacheKey = `${cleanCode}::${sourceId || "auto"}`;
			const cached = this._resolveCache.get(cacheKey);
			if (cached && Date.now() < cached.expiresAt) return cached.result;
			const runSingle = (id) => {
				switch (id) {
					case "123av": return this.probe123Av(cleanCode, transport);
					case "javverse": return this.probeJavVerse(cleanCode, transport);
					case "missav": return this.probeMissAv(cleanCode, transport, { allowDirectFallback: true });
					case "jable": return this.probeJable(cleanCode, transport);
					default: return Promise.resolve(null);
				}
			};
			let picked = null;
			if (sourceId) picked = await runSingle(sourceId);
			else {
				const tasks = [
					this.probe123Av(cleanCode, transport),
					this.probeJavVerse(cleanCode, transport),
					sleep(250).then(() => this.probeMissAv(cleanCode, transport, { allowDirectFallback: false })),
					sleep(350).then(() => this.probeJable(cleanCode, transport))
				];
				picked = await new Promise((resolve) => {
					let pending = tasks.length;
					let best = null;
					let settled = false;
					tasks.forEach((p) => {
						Promise.resolve(p).then((res) => {
							if (settled) return;
							if (res && res.url) {
								if (!best || res.weight > best.weight) best = res;
								if (res.weight >= 90) {
									settled = true;
									resolve(best);
									return;
								}
							}
						}).finally(() => {
							pending -= 1;
							if (!settled && pending <= 0) {
								settled = true;
								resolve(best);
							}
						});
					});
				});
				if (!picked) picked = {
					sourceId: "missav",
					sourceName: "MissAV (兜底直达)",
					url: `https://${getSiteDomains("MISSAV")[0] || "missav.ai"}/cn/${cleanCode.toLowerCase()}`,
					weight: 10,
					challenged: true
				};
			}
			if (picked && !picked.challenged) this._resolveCache.set(cacheKey, {
				result: picked,
				expiresAt: Date.now() + RESOLVE_CACHE_TTL_MS
			});
			return picked;
		}
		static openTab(url) {
			if (typeof GM_openInTab === "function") {
				GM_openInTab(url, {
					active: true,
					insert: true,
					setParent: true
				});
				return;
			}
			if (typeof open === "function") open(url, "_blank", "noopener");
		}
		/**
		* 同步读取已缓存的跳转站点信息（用于 PC 端悬浮 0ms 即时提示）
		*/
		static getCachedDestination(code) {
			const cleanCode = normalizeCode(code);
			if (!cleanCode) return {
				ready: false,
				track: "none",
				sourceName: "",
				host: ""
			};
			const gw = getGatewayEndpoint();
			const now = Date.now();
			if (gw && this._gatewayProbeCache.base === gw.base && this._gatewayProbeCache.ok && now - this._gatewayProbeCache.checkedAt < GATEWAY_HEALTH_TTL_MS) return {
				ready: true,
				track: "gateway",
				sourceId: "gateway",
				sourceName: "网关影院",
				host: extractHost(gw.base),
				url: this.buildGatewayWatchUrl(gw, cleanCode)
			};
			const cached = this._resolveCache.get(`${cleanCode}::auto`);
			if (cached && now < cached.expiresAt && cached.result?.url) return {
				ready: true,
				track: "client",
				sourceId: cached.result.sourceId || "",
				sourceName: cached.result.sourceName || "外部片源",
				host: extractHost(cached.result.url),
				url: cached.result.url,
				challenged: Boolean(cached.result.challenged)
			};
			return {
				ready: false,
				track: gw ? "gateway" : "client",
				sourceName: "",
				host: gw ? extractHost(gw.base) : ""
			};
		}
		/**
		* PC 端鼠标悬浮轻量预探测最终跳转站点（并发去重 + 自动写入 30min 缓存供点击 0ms 复用）
		*/
		static async previewDestination(code, { transport = defaultTransport } = {}) {
			const cleanCode = normalizeCode(code);
			if (!cleanCode) return {
				ready: false,
				track: "none",
				sourceName: "",
				host: ""
			};
			const cached = this.getCachedDestination(cleanCode);
			if (cached.ready) return cached;
			if (this._inflightPreviews.has(cleanCode)) return this._inflightPreviews.get(cleanCode);
			const task = (async () => {
				try {
					const { reachable, gateway } = await this.probeGatewayHealth(false, transport);
					if (reachable && gateway) return {
						ready: true,
						track: "gateway",
						sourceId: "gateway",
						sourceName: "网关影院",
						host: extractHost(gateway.base),
						url: this.buildGatewayWatchUrl(gateway, cleanCode)
					};
					const resolved = await this.resolveClientSource(cleanCode, { transport });
					if (!resolved || !resolved.url) return {
						ready: false,
						track: "client",
						sourceName: "",
						host: ""
					};
					return {
						ready: true,
						track: "client",
						sourceId: resolved.sourceId || "",
						sourceName: resolved.sourceName || "外部片源",
						host: extractHost(resolved.url),
						url: resolved.url,
						challenged: Boolean(resolved.challenged)
					};
				} finally {
					this._inflightPreviews.delete(cleanCode);
				}
			})();
			this._inflightPreviews.set(cleanCode, task);
			return task;
		}
		/**
		* 统一跨站播放调度入口
		*/
		static async play({ code, sourceId = "", title = "", poster = "", forceClient = false } = {}) {
			const cleanCode = normalizeCode(code);
			if (!cleanCode) {
				this.notify("未识别到有效影片番号", 2500, "warning");
				return {
					track: "none",
					ok: false
				};
			}
			if (!forceClient) {
				const { reachable, gateway } = await this.probeGatewayHealth();
				if (reachable && gateway) {
					const watchUrl = this.buildGatewayWatchUrl(gateway, cleanCode, {
						sourceId,
						title,
						poster
					});
					this.openTab(watchUrl);
					return {
						track: "gateway",
						ok: true,
						url: watchUrl,
						code: cleanCode
					};
				}
			}
			this.notify(`正在跨站搜寻 ${cleanCode} 片源…`, 2e3, "info");
			const resolved = await this.resolveClientSource(cleanCode, { sourceId });
			if (!resolved || !resolved.url) {
				this.notify(`未在外部片源找到 ${cleanCode}`, 2800, "warning");
				return {
					track: "client",
					ok: false,
					code: cleanCode
				};
			}
			this.writeHandoffLease({
				code: cleanCode,
				source: resolved.sourceName,
				targetUrl: resolved.url,
				title,
				poster
			});
			this.openTab(this.appendTheaterHash(resolved.url));
			return {
				track: "client",
				ok: true,
				...resolved,
				code: cleanCode
			};
		}
	};
	_defineProperty(CrossSitePlayRouter, "_resolveCache", /* @__PURE__ */ new Map());
	_defineProperty(CrossSitePlayRouter, "_inflightPreviews", /* @__PURE__ */ new Map());
	_defineProperty(CrossSitePlayRouter, "_cfBlockedUntil", /* @__PURE__ */ new Map());
	_defineProperty(CrossSitePlayRouter, "_gatewayProbeCache", {
		base: "",
		ok: false,
		checkedAt: 0
	});
	_defineProperty(CrossSitePlayRouter, "_notifier", null);
	//#endregion
	//#region src/constants/icons.js
	var PLAY = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="tm-play-icon" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 12L7 5V19L18 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;
	var ICON_PEACH = `<img class="tm-peach-logo-img" src="data:image/webp;base64,UklGRgYGAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSBwCAAARkEPbtqk9+/6Kbdu27aSybdu2nfyqYtu2bds2P57iPp4zRuqImAD892ZPICti0qcD6USVJqLWbFTcjGUbdhs6ZnT/lqVTmhT30eGUPFTmjsuufwySceD55g5ptGxfA1VhqpRyIW/ke7L9fHI6IPmLrxm0BEXbT1m+YePKeYMbFUjgQMjkL+Tok+YIu/YmBVBs9i0Pmf+5E1VF2VE7yGH/WKz+mix1zG+yG9hd1gaq/nOIqGcHb4dr5OTPvsoauv116vcOf5AcnhFiDTUvO+TqSGUNCZtf4va3vA1Uv8+NIm10+U3sNypLnf3E/VL1TLBa/Q+x9zSB1ZR3SeCLTFbmkMhYC7m/yfhVyGwmCV1skvSRlNdpjOoGpVBro9kkdo2BOibncWIt5Ss5nuJakT9yqKXWiASP1QZIitQmS1qhzZK0RpspaYU2TlKk1kXSaK2KT1BTLfNnOX8KamGX5NyKpyFSzhIYNhATqGaU+L6Ui3GNMF5KV5hmfCvjViIzDJXRGhYTnpewJ8wKSn/n9yk/rHcLcgt0hN2Z3BbCdvhSXtvj2UO81ZxOpYCTcZfyuZAJzobP4XImIxwf7GGxLw1cbPKewYpEcLXYZbc8Y0PhcqoV7rxqBPdVny8uHMgDliWOOvV9VFwwjTv8kyOHS4Fx/rV+W097RoB3rb1+S2+npgN7VW35R6PAjZGZITNr9/Unj64aWjE+BCsFtwFWUDggxAMAAHAUAJ0BKkAAQAA+SR6NRCKhoZn7NVQoBIS2AFnZo53n2/zRa8/bNwnOdYG9ZO338zHm0ekPeUt5N8sCLKpC8aTygM1/rM+hB+pIcs8BzEVqF8U8H2Z8jDfv+/6+iaXxaaVTL7DTW6RNsGM6q+ZSoTML2poCK45PkbuJfm8fRzOYBK36wYCqS3ZjMws18YuPyNVY6YZ6Tcp5c13rpmFhbrrFmxZmqdmAEmy7oAAA/u6HsozipAof+2FMmSpEpsGfCvd73iZsHipNPZ3cSnPP366XfQdSJJlMiXhe/hjDql5/UtuPp9wbUxI+Z3LPVNLs2jap2Wf7XlmjfkFqhfP2kStYIF1D13K876n5Dl/Vhs3Z6IEMVQiC3/DJE3tD95UD9EQ9z4ufVju3bu0v744/zVY7OfkKHckNlUze/vsv168/uV2kbHf1XVqwDgLEwn21N/lM/azpH4fe9l0s6Z7L3pNLXwEWRUe7pt3TdzMnv0mnpTaD/ZGl3+7nxrAVO8PbChAvoWTZW9t/+Bo+7pA4I6oollH3mt7sf7woQhvY3LtmwScUOrZD+T3jQ3/l5Nc8hTU3Z3kjACjxnHTuYS5aYiHmiwW0NBY2HyfH8gFlHxoL8YRMUz0radLnPS66Q7HdJoaoyD51aeyv9Qzv1Wa0LVvf+tOf/oM3YvTsxK6Gd4ibLlw4dbsoGRmJZDSfw1y+e9E0x/9iqnCOupFCryy+j+sX8Zf3WoS8B/tlx4Fxj8ItsZcNVbVBHa6VrMoPoy8ROcUzAxAzdcZXBR6z5boDbB8m1JlDEIx7JeHj1uePUvmsu6bP+jOpSKbFFLNo3zPTMhf+tcU5rWpe8BAyr45RuhjtDzXTCfKdJbrOnSCzTj7ZfRBRUDrxjKiecehWzWERxc6CeAFexaMl0HCFpH3owj345m5PNwuPxqnOL5Ux4oW83Qyg7//s32vYEpOi0SrWunBG5QmkUh6pS9qG47yP/t+cZtyp2jXaj6tNJjJq9e71djz9qzPYkotcfVTLBfuelBXyrWyw9OkXpbLo4VVxPihZHWNAssv5kQpf/0Wn+QyomYH0uOPOoz8lGeFhSpZnygy1Sn1Klwf3J9Ij/UmGHPZJe50wrKyYD5l6qygOxX+lKvhUdBOxNDEoli3H95SV4eTPxPaudg/E4YPEcbyUFfOOvO+DiXM9KhdsQ5q5Lsg3C/R3CmApmU+8W/UAz/AA00RawSCaXO4sPN7TjPxUf94dPIj0lhckD5n/W84yB6lEYZPHCDTvmqVJqyZxSXC1muaAAAA=" alt="Peach" />`;
	var ICON_X_CLOSE = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
`;
	//#endregion
	//#region src/adapters/LtxLibAdapter.js
	/**
	* Jasna-LTX Library (https://ltxlib.dpdns.org/) 卡片跨站播放适配器
	*
	* 设计约束（基于对 ltxlib 实机 DOM/CSS/CSP 与 iOS Safari Stay 源码实测）：
	* 1. 页面 CSP 锁死 default-src 'none' / script-src 'sha256-...' / media-src / worker-src / frame-ancestors，
	*    绝对禁止向宿主页面注入 <video>、hls.js 或 <iframe>，所有播放均经 CrossSitePlayRouter 跨 Origin 承接。
	* 2. 严禁在本模块及跨站伴侣构建链中引用页级沙箱句柄或非白名单全局属性，确保 Stay App 归类为 content 沙箱执行。
	* 3. Vue 3 列表筛选/排序/翻页会原地复用 article.card 节点并仅变更 data-code 属性，
	*    因此点击与悬浮预探测严禁闭包固化初始 code，必须实时从 btn.closest('article.card') 读取。
	* 4. PC 端鼠标悬浮提示最终跳转站点，并提前预热 30min 缓存实现点击 0ms 跳转；触控端长按弹出选源/入库菜单。
	*/
	var LONG_PRESS_MS = 450;
	var HOVER_INTENT_MS = 120;
	var LTX_FALLBACK_CSS = `
.mp-ltx-play-btn{position:absolute;left:8px;bottom:8px;z-index:3;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(15,16,19,.76);backdrop-filter:blur(12px) saturate(180%);-webkit-backdrop-filter:blur(12px) saturate(180%);color:#fe628e;display:grid;place-items:center;padding:0;cursor:pointer;transition:transform .15s ease,background-color .15s ease,border-color .15s ease}
.mp-ltx-play-btn::after{content:"";position:absolute;inset:-6px}
.mp-ltx-play-btn:hover{transform:scale(1.08);background:rgba(254,98,142,.22);border-color:rgba(254,98,142,.72);color:#fff}
.mp-ltx-play-btn:active{transform:scale(.94)}
.mp-ltx-play-btn.is-loading{cursor:progress;pointer-events:none;border-color:#fe628e;animation:mp-ltx-pulse .9s ease-in-out infinite}
.mp-ltx-play-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;transform:translateX(1px)}
.mp-ltx-play-icon svg{width:14px;height:14px}
.card.selectable .mp-ltx-play-btn{opacity:.2;pointer-events:none}
@media (max-width:760px){.mp-ltx-play-btn{width:34px;height:34px}}
@keyframes mp-ltx-pulse{0%,100%{box-shadow:0 0 0 0 rgba(254,98,142,.5)}50%{box-shadow:0 0 0 6px rgba(254,98,142,0)}}
.mp-ltx-modal-play-btn{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(254,98,142,.45);background:rgba(254,98,142,.16);color:#fff;font-size:12px;font-weight:600;cursor:pointer;margin-left:auto}
.mp-ltx-popover{position:fixed;z-index:2147483647;width:224px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(23,24,29,.92);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);box-shadow:0 14px 36px rgba(0,0,0,.55);color:#e8e8ec;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;display:flex;flex-direction:column;gap:8px}
.mp-ltx-popover-head{display:flex;align-items:center;gap:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.08)}
.mp-ltx-popover-code{font-size:12px;font-weight:700;color:#fe628e;letter-spacing:.03em}
.mp-ltx-popover-mode{font-size:11px;color:#8c8f9a;margin-left:auto}
.mp-ltx-popover-close{border:0;background:transparent;color:#8c8f9a;cursor:pointer;padding:2px;display:grid;place-items:center}
.mp-ltx-popover-item{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#e8e8ec;font-size:12px;font-weight:600;cursor:pointer;text-align:left}
.mp-ltx-popover-item.is-primary{background:rgba(254,98,142,.18);border-color:rgba(254,98,142,.45);color:#fff}
.mp-ltx-popover-ico{width:15px;height:15px;display:inline-flex;align-items:center;justify-content:center}
.mp-ltx-popover-sources{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.mp-ltx-popover-chip{padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#cfd2dc;font-size:11px;font-weight:600;cursor:pointer}
.mp-ltx-popover-chip:hover{background:rgba(122,167,255,.2);border-color:rgba(122,167,255,.5);color:#fff}
.mp-ltx-hover-tip{position:fixed;z-index:2147483646;pointer-events:none;max-width:240px;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(18,19,24,.94);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);box-shadow:0 10px 28px rgba(0,0,0,.5);color:#e8e8ec;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;display:flex;flex-direction:column;gap:2px}
.mp-ltx-hover-title{font-size:12px;font-weight:600;line-height:1.35;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mp-ltx-hover-site{color:#fe628e;font-weight:700}
.mp-ltx-hover-sub{font-size:11px;line-height:1.3;color:#9a9da8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mp-ltx-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(20,21,26,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#f3f4f8;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.45);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}
`;
	var LtxLibAdapter = class {
		static isLtxLibSite() {
			if (typeof document === "undefined" || typeof location === "undefined") return false;
			if (document.querySelector("meta[name=\"ltx-app\"]")) return true;
			const host = String(location.hostname || "").toLowerCase();
			return host === "ltxlib.dpdns.org" || host.endsWith(".ltxlib.dpdns.org");
		}
		static configure(options = {}) {
			if (typeof options.canIngest === "function") this._canIngest = options.canIngest;
			if (typeof options.onIngest === "function") this._onIngest = options.onIngest;
			if (typeof options.onNotify === "function") this._onNotify = options.onNotify;
		}
		static detectAndStart(options = {}) {
			this.configure(options);
			if (this.initialized) return true;
			if (!this.isLtxLibSite()) return false;
			if (typeof document !== "undefined" && document.documentElement?.dataset?.mpLtxActive === "1") return true;
			if (typeof document !== "undefined" && document.documentElement?.dataset) document.documentElement.dataset.mpLtxActive = "1";
			this.init(options);
			return true;
		}
		static _notify(msg, duration = 2400, type = "info") {
			if (this._onNotify) {
				this._onNotify(msg, duration, type);
				return;
			}
			if (typeof document === "undefined" || !document.body) return;
			this.ensureStyles();
			if (this._toastTimer) {
				clearTimeout(this._toastTimer);
				this._toastTimer = null;
			}
			if (!this._toastEl) {
				const el = document.createElement("div");
				el.className = "mp-ltx-toast";
				el.setAttribute("role", "status");
				this._toastEl = el;
			}
			this._toastEl.textContent = String(msg || "");
			if (!this._toastEl.parentNode) document.body.appendChild(this._toastEl);
			this._toastTimer = setTimeout(() => {
				if (this._toastEl && this._toastEl.parentNode) this._toastEl.parentNode.removeChild(this._toastEl);
			}, Math.max(1200, Number(duration) || 2400));
		}
		/**
		* 兜底确认完整按钮/悬浮提示/弹窗样式已注入（兼容 Stay content 模式及 document-start 丢失场景）
		*/
		static ensureStyles() {
			if (typeof document === "undefined") return;
			const probeId = "mp-ltx-fallback-style";
			if (document.getElementById(probeId)) return;
			let alreadyStyled = false;
			try {
				const testBtn = document.querySelector(".mp-ltx-play-btn");
				if (testBtn && typeof getComputedStyle === "function") {
					const cs = getComputedStyle(testBtn);
					const radius = parseFloat(cs.borderTopLeftRadius || "0");
					alreadyStyled = cs.position === "absolute" && radius >= 12;
				}
			} catch (_) {}
			if (alreadyStyled) return;
			try {
				const styleEl = document.createElement("style");
				styleEl.id = probeId;
				styleEl.textContent = LTX_FALLBACK_CSS;
				(document.head || document.documentElement)?.appendChild(styleEl);
			} catch (_) {
				if (typeof GM_addStyle === "function") try {
					GM_addStyle(LTX_FALLBACK_CSS);
				} catch (_) {}
			}
		}
		static init(options = {}) {
			this.configure(options);
			if (this.initialized) return;
			this.initialized = true;
			this.ensureStyles();
			this.scanAndInject(document);
			const scheduleScan = () => {
				if (this._rafScheduled) return;
				this._rafScheduled = true;
				(typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => setTimeout(fn, 16))(() => {
					this._rafScheduled = false;
					this.ensureStyles();
					this.scanAndInject(document);
				});
			};
			const root = document.documentElement || document.body;
			if (root && typeof MutationObserver === "function") {
				this._observer = new MutationObserver(scheduleScan);
				this._observer.observe(root, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["data-code", "open"]
				});
			}
			if (!this._scanTimer && typeof setInterval === "function") this._scanTimer = setInterval(() => {
				const cards = document.querySelectorAll("article.card[data-code]");
				if (cards.length > 0 && document.querySelectorAll("[data-mp-ltx-btn]").length < cards.length) {
					this.ensureStyles();
					this.scanAndInject(document);
				}
			}, 1200);
			if (typeof addEventListener === "function") {
				addEventListener("load", scheduleScan, { once: true });
				addEventListener("popstate", scheduleScan);
				addEventListener("hashchange", scheduleScan);
				addEventListener("scroll", () => this.hideHoverTip(), {
					capture: true,
					passive: true
				});
			}
		}
		/**
		* 扫描并注入所有未挂载按钮的卡片与详情弹窗
		*/
		static scanAndInject(root = document) {
			if (!root || typeof root.querySelectorAll !== "function") return;
			const cards = root.querySelectorAll("article.card[data-code]");
			for (let i = 0; i < cards.length; i++) this.injectCardButton(cards[i]);
			const dialogs = root.querySelectorAll("dialog.dialog[open]");
			for (let i = 0; i < dialogs.length; i++) this.injectModalButton(dialogs[i]);
		}
		/**
		* 实时提取卡片最新元数据（防范 Vue DOM 复用导致串号）
		*/
		static extractCardMeta(card) {
			if (!card) return {
				code: "",
				title: "",
				poster: ""
			};
			const code = String(card.getAttribute("data-code") || card.dataset?.code || "").trim().toUpperCase();
			const titleEl = card.querySelector(".title-btn, h3.title");
			const imgEl = card.querySelector(".cover-btn img, .cover img");
			return {
				code,
				title: titleEl ? String(titleEl.textContent || "").trim() : "",
				poster: imgEl ? String(imgEl.getAttribute("src") || imgEl.src || "").trim() : ""
			};
		}
		static injectCardButton(card) {
			if (!card) return;
			const cover = card.querySelector(".cover");
			if (!cover || cover.querySelector("[data-mp-ltx-btn]")) return;
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "mp-ltx-play-btn";
			btn.setAttribute("data-mp-ltx-btn", "1");
			btn.setAttribute("aria-label", "Miss Player 跨站播放（右键 / 长按选源或入库）");
			btn.innerHTML = `<span class="mp-ltx-play-icon">${PLAY}</span>`;
			this._bindPlayButtonEvents(btn, () => {
				const ownerCard = btn.closest("article.card");
				return this.extractCardMeta(ownerCard);
			});
			cover.appendChild(btn);
		}
		static injectModalButton(dialog) {
			if (!dialog || dialog.querySelector("[data-mp-ltx-modal-btn]")) return;
			const header = dialog.querySelector("header, .head, .dialog-head, .dlg-head");
			if (!header) return;
			const code = matchAvCodeFromText(dialog.textContent || "");
			if (!code) return;
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "mp-ltx-modal-play-btn";
			btn.setAttribute("data-mp-ltx-modal-btn", "1");
			btn.setAttribute("aria-label", `${code} Miss Player 跨站播放`);
			btn.innerHTML = `<span class="mp-ltx-play-icon">${PLAY}</span><span>跨站播放</span>`;
			this._bindPlayButtonEvents(btn, () => ({
				code: matchAvCodeFromText(dialog.textContent || "") || code,
				title: String(header.textContent || "").trim().slice(0, 100),
				poster: ""
			}));
			header.appendChild(btn);
		}
		static _isDesktopHoverCapable(e) {
			if (e && e.pointerType) return e.pointerType === "mouse";
			if (typeof matchMedia === "function") return matchMedia("(hover: hover) and (pointer: fine)").matches;
			return false;
		}
		static formatHoverSummary(code, dest) {
			if (!dest) return {
				siteLabel: "正在探测跳转站点…",
				subText: `${code} · 123AV / JAVVerse / MissAV / Jable`
			};
			if (dest.ready && dest.sourceName) {
				const hostPart = dest.host ? `${dest.host} · ` : "";
				return {
					siteLabel: dest.sourceName,
					subText: `${hostPart}右键选源`,
					prefix: "跳转站点："
				};
			}
			return {
				siteLabel: "暂未匹配外部片源",
				subText: `${code} · 右键可手动选源`
			};
		}
		static _positionHoverTip(anchorEl, tipEl) {
			if (!anchorEl || !tipEl || typeof anchorEl.getBoundingClientRect !== "function") return;
			const rect = anchorEl.getBoundingClientRect();
			const tipRect = tipEl.getBoundingClientRect();
			const vw = typeof innerWidth === "number" ? innerWidth : 1280;
			const left = Math.max(8, Math.min(rect.left, vw - tipRect.width - 8));
			const top = rect.top - tipRect.height - 8 >= 8 ? rect.top - tipRect.height - 8 : rect.bottom + 8;
			tipEl.style.left = `${Math.round(left)}px`;
			tipEl.style.top = `${Math.round(top)}px`;
		}
		static showHoverTip(anchorEl, code, dest = null) {
			if (typeof document === "undefined" || !document.body || !code) return;
			this.ensureStyles();
			let tip = this._hoverTipEl;
			if (!tip) {
				tip = document.createElement("div");
				tip.className = "mp-ltx-hover-tip";
				tip.setAttribute("role", "tooltip");
				const titleLine = document.createElement("div");
				titleLine.className = "mp-ltx-hover-title";
				const prefixSpan = document.createElement("span");
				prefixSpan.className = "mp-ltx-hover-prefix";
				const siteSpan = document.createElement("span");
				siteSpan.className = "mp-ltx-hover-site";
				titleLine.append(prefixSpan, siteSpan);
				const subLine = document.createElement("div");
				subLine.className = "mp-ltx-hover-sub";
				tip.append(titleLine, subLine);
				this._hoverTipEl = tip;
			}
			const { prefix = "", siteLabel, subText } = this.formatHoverSummary(code, dest);
			tip.querySelector(".mp-ltx-hover-prefix").textContent = prefix;
			tip.querySelector(".mp-ltx-hover-site").textContent = siteLabel;
			tip.querySelector(".mp-ltx-hover-sub").textContent = subText;
			if (!tip.parentNode) document.body.appendChild(tip);
			this._positionHoverTip(anchorEl, tip);
			anchorEl.setAttribute("aria-label", `${code} ${prefix}${siteLabel}`.trim());
		}
		static hideHoverTip() {
			if (this._hoverTimer) {
				clearTimeout(this._hoverTimer);
				this._hoverTimer = null;
			}
			this._hoveredBtn = null;
			if (this._hoverTipEl && this._hoverTipEl.parentNode) this._hoverTipEl.parentNode.removeChild(this._hoverTipEl);
		}
		static _bindPlayButtonEvents(btn, getMeta) {
			let pressTimer = null;
			let longPressed = false;
			let startX = 0;
			let startY = 0;
			const clearPress = () => {
				if (pressTimer) {
					clearTimeout(pressTimer);
					pressTimer = null;
				}
			};
			const stopOnly = (e) => {
				e.stopPropagation();
			};
			btn.addEventListener("pointerenter", (e) => {
				if (!this._isDesktopHoverCapable(e)) return;
				const meta = getMeta();
				if (!meta.code) return;
				this.hideHoverTip();
				this._hoveredBtn = btn;
				const cached = CrossSitePlayRouter.getCachedDestination(meta.code);
				if (cached.ready) {
					this.showHoverTip(btn, meta.code, cached);
					return;
				}
				this.showHoverTip(btn, meta.code, null);
				this._hoverTimer = setTimeout(() => {
					this._hoverTimer = null;
					if (this._hoveredBtn !== btn) return;
					CrossSitePlayRouter.previewDestination(meta.code).then((dest) => {
						if (this._hoveredBtn !== btn) return;
						const latestMeta = getMeta();
						if (!latestMeta || latestMeta.code !== meta.code) return;
						this.showHoverTip(btn, meta.code, dest);
					}).catch(() => {});
				}, HOVER_INTENT_MS);
			});
			btn.addEventListener("pointerleave", () => {
				if (this._hoveredBtn === btn) this.hideHoverTip();
			});
			btn.addEventListener("pointerdown", (e) => {
				e.stopPropagation();
				if (this._hoveredBtn === btn) this.hideHoverTip();
				if (e.button === 2) return;
				longPressed = false;
				startX = e.clientX || 0;
				startY = e.clientY || 0;
				clearPress();
				pressTimer = setTimeout(() => {
					longPressed = true;
					this.openActionPopover(btn, getMeta());
				}, LONG_PRESS_MS);
			});
			btn.addEventListener("pointermove", (e) => {
				if (!pressTimer) return;
				const dx = Math.abs((e.clientX || 0) - startX);
				const dy = Math.abs((e.clientY || 0) - startY);
				if (dx > 8 || dy > 8) clearPress();
			});
			btn.addEventListener("pointerup", clearPress);
			btn.addEventListener("pointercancel", clearPress);
			btn.addEventListener("touchstart", stopOnly, { passive: true });
			btn.addEventListener("contextmenu", (e) => {
				e.preventDefault();
				e.stopPropagation();
				clearPress();
				this.hideHoverTip();
				this.openActionPopover(btn, getMeta());
			});
			btn.addEventListener("click", async (e) => {
				e.preventDefault();
				e.stopPropagation();
				clearPress();
				this.hideHoverTip();
				if (longPressed) {
					longPressed = false;
					return;
				}
				if (btn.classList.contains("is-loading")) return;
				const meta = getMeta();
				if (!meta.code) return;
				btn.classList.add("is-loading");
				try {
					await CrossSitePlayRouter.play(meta);
				} finally {
					btn.classList.remove("is-loading");
				}
			});
		}
		static closePopover() {
			if (this._popoverEl && this._popoverEl.parentNode) this._popoverEl.parentNode.removeChild(this._popoverEl);
			this._popoverEl = null;
			if (this._outsideHandler) {
				document.removeEventListener("click", this._outsideHandler, true);
				this._outsideHandler = null;
			}
			if (this._escHandler) {
				document.removeEventListener("keydown", this._escHandler, true);
				this._escHandler = null;
			}
		}
		/**
		* 打开卡片长按 / 右键操作菜单（指定片源 + Peach 一键入库 / 网关配置）
		*/
		static async openActionPopover(anchorEl, meta) {
			this.closePopover();
			this.hideHoverTip();
			if (!meta || !meta.code) return;
			this.ensureStyles();
			const pop = document.createElement("div");
			pop.className = "mp-ltx-popover";
			pop.setAttribute("role", "dialog");
			pop.setAttribute("aria-label", `${meta.code} 播放选项`);
			const gwHint = CrossSitePlayRouter.isGatewayConfigured() ? "优先网关影院" : "纯脚本跨站直达";
			const head = document.createElement("div");
			head.className = "mp-ltx-popover-head";
			const titleSpan = document.createElement("span");
			titleSpan.className = "mp-ltx-popover-code";
			titleSpan.textContent = meta.code;
			const subSpan = document.createElement("span");
			subSpan.className = "mp-ltx-popover-mode";
			subSpan.textContent = gwHint;
			const closeBtn = document.createElement("button");
			closeBtn.type = "button";
			closeBtn.className = "mp-ltx-popover-close";
			closeBtn.innerHTML = ICON_X_CLOSE;
			closeBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.closePopover();
			});
			head.append(titleSpan, subSpan, closeBtn);
			pop.appendChild(head);
			const autoBtn = document.createElement("button");
			autoBtn.type = "button";
			autoBtn.className = "mp-ltx-popover-item is-primary";
			autoBtn.innerHTML = `<span class="mp-ltx-popover-ico">${PLAY}</span><span>自动最优源播放</span>`;
			autoBtn.addEventListener("click", async (e) => {
				e.stopPropagation();
				this.closePopover();
				await CrossSitePlayRouter.play(meta);
			});
			pop.appendChild(autoBtn);
			const srcGrid = document.createElement("div");
			srcGrid.className = "mp-ltx-popover-sources";
			CROSS_SITE_SOURCES.forEach((src) => {
				const chip = document.createElement("button");
				chip.type = "button";
				chip.className = "mp-ltx-popover-chip";
				chip.textContent = src.label;
				chip.addEventListener("click", async (e) => {
					e.stopPropagation();
					this.closePopover();
					await CrossSitePlayRouter.play({
						...meta,
						sourceId: src.id
					});
				});
				srcGrid.appendChild(chip);
			});
			pop.appendChild(srcGrid);
			if (this._onIngest) {
				const peachBtn = document.createElement("button");
				peachBtn.type = "button";
				peachBtn.className = "mp-ltx-popover-item";
				peachBtn.innerHTML = `<span class="mp-ltx-popover-ico">${ICON_PEACH}</span><span>一键入库 Peach (.strm)</span>`;
				peachBtn.addEventListener("click", async (e) => {
					e.stopPropagation();
					this.closePopover();
					if (this._canIngest && !this._canIngest()) {
						this._notify("请先在 Miss Player 设置中配置流网关地址后再入库", 3e3, "warning");
						return;
					}
					try {
						const res = await this._onIngest(meta.code);
						this._notify(res?.message || `${meta.code} 已入库 Peach`, 2500, "success");
					} catch (err) {
						this._notify(`入库失败: ${err.message || err}`, 3e3, "error");
					}
				});
				pop.appendChild(peachBtn);
			} else {
				const gwBtn = document.createElement("button");
				gwBtn.type = "button";
				gwBtn.className = "mp-ltx-popover-item";
				gwBtn.innerHTML = `<span class="mp-ltx-popover-ico">${ICON_PEACH}</span><span>配置流网关地址</span>`;
				gwBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					this.closePopover();
					if (typeof prompt !== "function") return;
					const nextBase = prompt("请输入 miss-gateway 地址（留空清除，例如 http://192.168.2.250:8765）：", "");
					if (nextBase === null) return;
					const nextToken = nextBase.trim() ? prompt("请输入网关 Token（默认 dev）：", "dev") ?? "dev" : "";
					CrossSitePlayRouter.setGatewayConfig({
						base: nextBase,
						token: nextToken
					});
					this._notify(nextBase.trim() ? "流网关配置已保存" : "已切换为纯脚本跨站直达", 2400, "success");
				});
				pop.appendChild(gwBtn);
			}
			document.body.appendChild(pop);
			this._popoverEl = pop;
			const rect = anchorEl.getBoundingClientRect();
			const popRect = pop.getBoundingClientRect();
			const vw = typeof innerWidth === "number" ? innerWidth : 1280;
			const vh = typeof innerHeight === "number" ? innerHeight : 800;
			const left = Math.max(12, Math.min(rect.left, vw - popRect.width - 12));
			const top = rect.bottom + 8 + popRect.height <= vh - 12 ? rect.bottom + 8 : Math.max(12, rect.top - popRect.height - 8);
			pop.style.left = `${Math.round(left)}px`;
			pop.style.top = `${Math.round(top)}px`;
			setTimeout(() => {
				if (this._popoverEl !== pop) return;
				this._outsideHandler = (ev) => {
					if (this._popoverEl && !this._popoverEl.contains(ev.target) && !anchorEl.contains(ev.target)) this.closePopover();
				};
				this._escHandler = (ev) => {
					if (ev.key === "Escape") this.closePopover();
				};
				document.addEventListener("click", this._outsideHandler, true);
				document.addEventListener("keydown", this._escHandler, true);
			}, 0);
			CrossSitePlayRouter.probeGatewayHealth().then(({ reachable }) => {
				if (this._popoverEl === pop) subSpan.textContent = reachable ? "网关已就绪" : "纯脚本直连";
			}).catch(() => {});
		}
	};
	_defineProperty(LtxLibAdapter, "initialized", false);
	_defineProperty(LtxLibAdapter, "_observer", null);
	_defineProperty(LtxLibAdapter, "_rafScheduled", false);
	_defineProperty(LtxLibAdapter, "_scanTimer", null);
	_defineProperty(LtxLibAdapter, "_popoverEl", null);
	_defineProperty(LtxLibAdapter, "_outsideHandler", null);
	_defineProperty(LtxLibAdapter, "_escHandler", null);
	_defineProperty(LtxLibAdapter, "_hoverTipEl", null);
	_defineProperty(LtxLibAdapter, "_hoveredBtn", null);
	_defineProperty(LtxLibAdapter, "_hoverTimer", null);
	_defineProperty(LtxLibAdapter, "_toastEl", null);
	_defineProperty(LtxLibAdapter, "_toastTimer", null);
	_defineProperty(LtxLibAdapter, "_canIngest", null);
	_defineProperty(LtxLibAdapter, "_onIngest", null);
	_defineProperty(LtxLibAdapter, "_onNotify", null);
	//#endregion
	//#region src/entries/ltxlibCompanion.js
	(function() {
		"use strict";
		if (!LtxLibAdapter.isLtxLibSite()) return;
		const notify = (msg, duration, type) => LtxLibAdapter._notify(msg, duration, type);
		CrossSitePlayRouter.setNotifier(notify);
		LtxLibAdapter.detectAndStart({ onNotify: notify });
	})();
	//#endregion
})();
