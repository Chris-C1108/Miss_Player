/**
 * GM API Polyfill — 在 Playwright 浏览器上下文中模拟油猴环境
 * 用于在无脚本管理器的纯净浏览器中加载 Miss Player 构建产物
 *
 * 使用方式：在 page.addInitScript() 中注入，必须先于油猴脚本执行
 */

// ── 内存存储 ──
const _gmStore = {};

// ── GM_getValue / GM_setValue ──
window.GM_getValue = function (key, defaultValue) {
  if (key in _gmStore) return _gmStore[key];
  try {
    const raw = localStorage.getItem('mp_' + key);
    if (raw !== null) return JSON.parse(raw);
  } catch (_) {}
  return defaultValue;
};

window.GM_setValue = function (key, value) {
  _gmStore[key] = value;
  try {
    localStorage.setItem('mp_' + key, JSON.stringify(value));
  } catch (_) {}
};

window.GM_deleteValue = function (key) {
  delete _gmStore[key];
  try {
    localStorage.removeItem('mp_' + key);
  } catch (_) {}
};

window.GM_listValues = function () {
  return Object.keys(_gmStore);
};

// ── GM_addStyle ──
window.GM_addStyle = function (css) {
  const style = document.createElement('style');
  style.textContent = css;
  const attach = () => {
    const target = document.head || document.documentElement || document.body;
    if (target) {
      target.appendChild(style);
      return true;
    }
    return false;
  };
  if (!attach()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach, { once: true });
    } else {
      setTimeout(attach, 10);
    }
  }
  return style;
};

// ── GM_xmlhttpRequest (降级为 fetch) ──
window.GM_xmlhttpRequest = function (details) {
  const ctrl = new AbortController();
  const fetchOpts = {
    method: details.method || 'GET',
    headers: details.headers || {},
    signal: ctrl.signal,
  };
  if (details.data) fetchOpts.body = details.data;

  fetch(details.url, fetchOpts)
    .then(async (resp) => {
      const text = await resp.text();
      const response = {
        status: resp.status,
        statusText: resp.statusText,
        responseHeaders: [...resp.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\r\n'),
        responseText: text,
        response: details.responseType === 'json' ? JSON.parse(text) : text,
        finalUrl: resp.url,
      };
      if (resp.ok) {
        details.onload && details.onload(response);
      } else {
        details.onerror && details.onerror(response);
      }
    })
    .catch((err) => {
      details.onerror && details.onerror({ error: err.message });
    });

  return { abort: () => ctrl.abort() };
};

// ── GM.xmlHttpRequest (Promise 风格) ──
window.GM = window.GM || {};
window.GM.xmlHttpRequest = window.GM_xmlhttpRequest;
window.GM.openInTab = function (url, options) {
  window.open(url, '_blank');
};

// ── GM_openInTab ──
window.GM_openInTab = function (url, options) {
  window.open(url, '_blank');
};

// ── GM_info (模拟脚本元信息) ──
window.GM_info = {
  script: {
    name: 'Miss Player | 影院模式 (单手播放器)',
    namespace: 'loadingi.local',
    version: '__VERSION__',
    description: 'Playwright UI Screenshot Test',
    author: 'Chris_C',
  },
  scriptHandler: 'Playwright-Polyfill',
  version: '1.0.0',
};

// ── GM_setClipboard ──
window.GM_setClipboard = function (text, type) {
  try {
    navigator.clipboard.writeText(text).catch(() => {});
  } catch (_) {}
};

// ── GM_notification (静默) ──
window.GM_notification = function (details) {
  console.log('[GM_notification]', typeof details === 'string' ? details : details.text || details.title);
};

// ── GM_addValueChangeListener / GM_removeValueChangeListener ──
const _valueListeners = {};
let _listenerId = 0;
window.GM_addValueChangeListener = function (key, callback) {
  const id = ++_listenerId;
  if (!_valueListeners[key]) _valueListeners[key] = {};
  _valueListeners[key][id] = callback;
  return id;
};
window.GM_removeValueChangeListener = function (id) {
  for (const key of Object.keys(_valueListeners)) {
    delete _valueListeners[key][id];
  }
};

// ── unsafeWindow ──
window.unsafeWindow = window;

// ── 预注入 WebDAV 配置（如果提供了环境变量） ──
if (window.__MP_WEBDAV_CONFIG__) {
  const cfg = window.__MP_WEBDAV_CONFIG__;
  const webdavObj = {
    url: cfg.url,
    user: cfg.username,
    pass: cfg.password,
    path: cfg.path,
    autoSync: true,
  };
  // SyncManager 核心使用的聚合存储键
  window.GM_setValue('mp_webdav_config', webdavObj);

  // 兼容性平铺键
  window.GM_setValue('webdav_url', cfg.url);
  window.GM_setValue('webdav_username', cfg.username);
  window.GM_setValue('webdav_password', cfg.password);
  window.GM_setValue('webdav_path', cfg.path);
  window.GM_setValue('webdav_enabled', true);
}

console.log('[GM-Polyfill] 油猴 API 模拟层已就绪');
