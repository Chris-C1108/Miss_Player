// ==UserScript==
// @name Miss Player | 影院模式 (单手播放器)
// @name:en Miss Player | Theater Mode (One-handed Player)
// @name:ja Miss Player | シアターモード (片手プレーヤー)
// @name:vi Miss Player | Chế Độ Rạp Hát (Trình Phát Một Tay)
// @name:zh-CN Miss Player | 影院模式 (单手播放器)
// @name:zh-TW Miss Player | 影院模式 (單手播放器)
// @description MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器|多语言支持 支持 jable po*nhub 等通用
// @description:en MissAV ad-free|one-handed mode|MissAV auto-expand details|MissAV auto high quality|MissAV redirect support|MissAV auto login|custom player|multilingual support for jable po*nhub etc.
// @description:ja MissAV広告ブロック|片手モード|MissAV自動詳細表示|MissAV自動高画質|MissAVリダイレクト対応|MissAV自動ログイン|カスタムプレーヤー|jable po*nhubなどに対応した多言語サポート
// @description:vi MissAV không quảng cáo|chế độ một tay|MissAV tự động mở rộng chi tiết|MissAV tự động chất lượng cao|Hỗ trợ chuyển hướng MissAV|MissAV tự động đăng nhập|trình phát tùy chỉnh|hỗ trợ đa ngôn ngữ cho jable po*nhub v.v.
// @description:zh-CN MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器|多语言支持 支持 jable po*nhub 等通用
// @description:zh-TW MissAV去廣告|單手模式|MissAV自動展開詳情|MissAV自動高畫質|MissAV重定向支持|MissAV自動登錄|定制播放器|多語言支持 支持 jable po*nhub 等通用
// @version 5.6.19
// @author Chris_C
// @match *://*.missav.ws/*
// @match *://*.missav.ai/*
// @match *://*.jable.tv/*
// @match *://*/*
// @connect *
// @connect jable.tv
// @connect www.jable.tv
// @connect fs1.app
// @connect www.fs1.app
// @connect javdb.com
// @connect www.javdb.com
// @connect jdforrepam.com
// @connect www.javlibrary.com
// @connect javlib.com
// @connect www.javlib.com
// @connect c97k.com
// @connect www.c97k.com
// @grant GM_xmlhttpRequest
// @grant GM_setClipboard
// @grant GM_notification
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_listValues
// @grant GM_addValueChangeListener
// @grant GM_removeValueChangeListener
// @grant GM_openInTab
// @icon https://missav.ws/img/favicon.ico
// @license MIT
// @namespace loadingi.local
// @run-at document-start
// ==/UserScript==

(() => {
  "use strict";
  var __webpack_modules__ = {
    "12": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `.tm-comments-panel{\n    position:relative;\n    width:100%;\n    flex:1;\n    min-height:0;\n    background-color:transparent;\n    z-index:9990;\n    display:flex;\n    flex-direction:column;\n    box-sizing:border-box;\n    overflow:hidden;\n    pointer-events:none;\n    font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;\n}\n.tm-comments-panel::after{\n    content:'';\n    position:absolute;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    width:100%;\n    height:100%;\n    background-color:rgba(0, 0, 0, 0.45);\n    pointer-events:none;\n    opacity:0;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);\n    z-index:9993;\n}\n.tm-handle-container::after{\n    content:'';\n    position:absolute;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    width:100%;\n    height:100%;\n    background-color:rgba(0, 0, 0, 0.45);\n    pointer-events:none;\n    opacity:0;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);\n    z-index:9993;\n}\n\n.tm-handle-container.is-dimmed::after,\n.tm-player-container:has(.tm-comments-panel.is-dimmed) .tm-handle-container::after{\n    opacity:1;\n}\n\n.tm-comments-panel.is-dimmed::after{\n    opacity:1;\n    pointer-events:auto;\n}\n.tm-comments-panel-action-bar{\n    position:relative;\n    flex:0 0 auto;\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    width:100%;\n    height:calc(26px + env(safe-area-inset-bottom, 0px));\n    padding:0 16px calc(0px + env(safe-area-inset-bottom, 0px)) 16px;\n    box-sizing:border-box;\n    background-color:rgba(10, 10, 12, 0.98);\n    border-top:1px solid rgba(255, 255, 255, 0.05);\n    pointer-events:auto;\n    font-size:0.72rem;\n    line-height:1;\n    color:rgba(255, 255, 255, 0.45);\n    z-index:9995;\n    white-space:nowrap;\n}\n\n.tm-comments-panel-action-bar .tm-action-bar-left{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:100%;\n    flex:1;\n    min-width:0;\n    overflow:hidden;\n    white-space:nowrap;\n}\n\n.tm-comments-panel-action-bar .tm-action-bar-right{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:100%;\n    flex-shrink:0;\n    white-space:nowrap;\n}\n\n.tm-comments-panel-action-bar .tm-comment-count{\n    font-weight:400;\n    color:rgba(255, 255, 255, 0.45);\n    line-height:1;\n    white-space:nowrap;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    min-width:0;\n}\n\n.tm-comment-copy-all-btn{\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.1);\n    border-radius:10px;\n    color:rgba(255, 255, 255, 0.55);\n    font-size:0.7rem;\n    padding:2px 8px;\n    cursor:pointer;\n    transition:background-color 0.15s, color 0.15s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n    outline:none;\n    line-height:1;\n    display:inline-flex;\n    align-items:center;\n    flex-shrink:0;\n    white-space:nowrap;\n}\n.tm-comment-copy-all-btn:hover{\n    color:#ffffff;\n    background:rgba(255, 255, 255, 0.12);\n}\n.tm-comment-copy-all-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-comments-panel-action-bar .tm-comment-filter-label{\n    display:flex;\n    align-items:center;\n    gap:5px;\n    cursor:pointer;\n    user-select:none;\n    color:rgba(255, 255, 255, 0.55);\n    font-size:0.7rem;\n    line-height:1;\n    transition:color 0.15s;\n    flex-shrink:0;\n    white-space:nowrap;\n}\n.tm-comments-panel-action-bar .tm-comment-filter-label:hover{\n    color:#ffffff;\n}\n.tm-tag-checkbox,\n.tm-comment-filter-checkbox{\n    appearance:none;\n    -webkit-appearance:none;\n    width:18px;\n    height:18px;\n    border-radius:50%;\n    border:1.5px solid rgba(255, 255, 255, 0.3);\n    background:rgba(255, 255, 255, 0.06);\n    cursor:pointer;\n    flex-shrink:0;\n    position:relative;\n    outline:none;\n    transition:background 0.15s, border-color 0.15s, transform 0.12s;\n    margin:0;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n}\n\n.tm-tag-checkbox:hover,\n.tm-comment-filter-checkbox:hover{\n    border-color:rgba(255, 255, 255, 0.6);\n}\n\n.tm-tag-checkbox:checked,\n.tm-comment-filter-checkbox:checked{\n    background:hsl(var(--shadcn-blue));\n    border-color:hsl(var(--shadcn-blue));\n}\n\n.tm-tag-checkbox:checked::after,\n.tm-comment-filter-checkbox:checked::after{\n    content:'';\n    width:4px;\n    height:8px;\n    border:solid #ffffff;\n    border-width:0 2px 2px 0;\n    transform:rotate(45deg) translate(-0.5px, -1px);\n    display:block;\n}\n.tm-comments-panel-list.tm-comments-list{\n    flex:1;\n    min-height:0;\n    width:100%;\n    max-height:none;\n    overflow-y:auto;\n    box-sizing:border-box;\n    padding:8px 16px 0px 16px;\n    mask-image:linear-gradient(to bottom, transparent 0px, rgba(0, 0, 0, 0.05) 4px, black 16px);\n    -webkit-mask-image:linear-gradient(to bottom, transparent 0px, rgba(0, 0, 0, 0.05) 4px, black 16px);\n    display:flex;\n    flex-direction:column;\n    align-items:stretch;\n    gap:8px;\n    -webkit-overflow-scrolling:touch;\n    pointer-events:auto;\n    background-color:transparent;\n    overscroll-behavior-y:contain;\n}\n.tm-comments-panel-list.tm-comments-list::-webkit-scrollbar{\n    width:4px;\n}\n\n.tm-comments-panel-list.tm-comments-list::-webkit-scrollbar-thumb{\n    background:hsla(var(--shadcn-muted-foreground) / 0.25);\n    border-radius:2px;\n}\n.tm-comment-submit-bar-wrapper{\n    position:relative;\n    flex:0 0 auto;\n    width:100%;\n    padding:8px 16px 8px 16px;\n    box-sizing:border-box;\n    background:linear-gradient(to top, rgba(10, 10, 12, 0.98) 0%, rgba(10, 10, 12, 0.85) 60%, rgba(10, 10, 12, 0) 100%);\n    border-top:none;\n    z-index:9996;\n    pointer-events:auto !important;\n}\n\n.tm-floating-comment-panel{\n    z-index:9999;\n    pointer-events:auto !important;\n}\n.tm-custom-modal-cancel-btn{\n    background-color:hsla(var(--shadcn-muted)/0.2);\n    color:hsl(var(--shadcn-foreground));\n    border:none;\n    border-radius:18px;\n    padding:7px 20px;\n    font-size:12px;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background-color 0.2s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.tm-custom-modal-cancel-btn:hover{\n    background-color:hsla(var(--shadcn-muted)/0.3);\n}\n.tm-custom-modal-cancel-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-custom-modal-submit-btn,\n.tm-custom-modal-login-btn{\n    background-color:hsl(var(--shadcn-blue));\n    color:#ffffff;\n    border:none;\n    border-radius:18px;\n    padding:7px 20px;\n    font-size:12px;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    box-shadow:0 4px 10px hsla(var(--shadcn-blue) / 0.3);\n    transition:background-color 0.2s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.tm-custom-modal-submit-btn:hover,\n.tm-custom-modal-login-btn:hover{\n    background-color:hsl(var(--shadcn-blue)/0.9);\n}\n.tm-custom-modal-submit-btn:active,\n.tm-custom-modal-login-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-comment-input-textarea{\n    width:100%;\n    height:90px;\n    margin:12px 0;\n    padding:10px;\n    border-radius:8px;\n    border:1px solid hsla(var(--shadcn-border) / 0.3);\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    color:hsl(var(--shadcn-foreground));\n    font-size:16px;\n    resize:none;\n    box-sizing:border-box;\n    outline:none;\n    transition:border-color 0.2s;\n    pointer-events:auto;\n}\n\n.tm-comment-submit-bar{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    background:transparent;\n    border:none;\n    padding:0;\n    box-sizing:border-box;\n    width:100%;\n    max-width:650px;\n    margin:0 auto;\n}\n\n.tm-comment-add-tag-btn{\n    width:34px;\n    height:34px;\n    border-radius:50%;\n    border:1px solid rgba(255, 255, 255, 0.15);\n    background:rgba(255, 255, 255, 0.08);\n    color:rgba(255, 255, 255, 0.85);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    flex-shrink:0;\n    transition:background-color 0.2s, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s;\n    outline:none;\n    padding:0;\n    margin:0;\n    box-sizing:border-box;\n}\n.tm-comment-add-tag-btn:hover{\n    background:rgba(255, 255, 255, 0.18);\n    color:#ffffff;\n    transform:scale(1.05);\n}\n.tm-comment-add-tag-btn:active{\n    transform:scale(0.96);\n}\n.tm-comment-add-tag-btn svg{\n    width:14px;\n    height:14px;\n    display:block;\n}\n\n.tm-comment-text-input{\n    flex:1;\n    min-width:0;\n    height:34px;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.08);\n    border-radius:17px;\n    padding:0 14px;\n    color:#ffffff;\n    font-size:16px;\n    outline:none;\n    box-sizing:border-box;\n    transition:border-color 0.2s, background 0.2s;\n}\n.tm-comment-text-input:focus{\n    border-color:rgba(255, 255, 255, 0.25);\n    background:rgba(255, 255, 255, 0.1);\n}\n.tm-comment-text-input::placeholder{\n    color:rgba(255, 255, 255, 0.35);\n}\n\n.tm-comment-send-btn{\n    height:34px;\n    padding:0 18px;\n    border-radius:17px;\n    border:1px solid rgba(255, 255, 255, 0.2);\n    background:rgba(255, 255, 255, 0.12);\n    color:#ffffff;\n    font-size:0.85rem;\n    font-weight:600;\n    cursor:pointer;\n    flex-shrink:0;\n    transition:background-color 0.2s, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);\n    outline:none;\n}\n.tm-comment-send-btn:hover{\n    background:rgba(255, 255, 255, 0.22);\n    transform:scale(1.03);\n}\n.tm-comment-send-btn:active{\n    transform:scale(0.96);\n}\n.tm-comment-tag-select-modal{\n    position:absolute;\n    bottom:calc(100% + 4px);\n    left:16px;\n    right:16px;\n    width:calc(100% - 32px);\n    max-width:650px;\n    margin:0 auto;\n    max-height:280px;\n    background:rgba(18, 18, 20, 0.96);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    border-radius:16px;\n    border:1px solid rgba(255, 255, 255, 0.12);\n    box-shadow:0 -8px 32px rgba(0, 0, 0, 0.6);\n    padding:10px 14px;\n    box-sizing:border-box;\n    display:flex;\n    flex-direction:column;\n    z-index:9998 !important;\n    opacity:0;\n    pointer-events:none;\n    transform:translateY(16px);\n    transition:opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.tm-comment-tag-select-modal.visible{\n    opacity:1;\n    pointer-events:auto;\n    transform:translateY(0);\n}\n\n.tm-tag-select-header{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    padding-bottom:8px;\n    margin-bottom:6px;\n    border-bottom:1px solid rgba(255, 255, 255, 0.08);\n    flex-shrink:0;\n}\n\n.tm-tag-select-btn-group{\n    display:flex;\n    align-items:center;\n    gap:8px;\n}\n\n.tm-tag-select-all-btn{\n    padding:3px 12px;\n    border-radius:12px;\n    background:rgba(255, 80, 80, 0.18);\n    border:1px solid rgba(255, 80, 80, 0.45);\n    color:#ff6b6b;\n    font-size:0.78rem;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background-color 0.15s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.tm-tag-select-all-btn:hover{\n    background:rgba(255, 80, 80, 0.3);\n}\n.tm-tag-select-all-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-tag-deselect-all-btn{\n    padding:3px 12px;\n    border-radius:12px;\n    background:rgba(255, 255, 255, 0.08);\n    border:1px solid rgba(255, 255, 255, 0.18);\n    color:rgba(255, 255, 255, 0.8);\n    font-size:0.78rem;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background-color 0.15s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.tm-tag-deselect-all-btn:hover{\n    background:rgba(255, 255, 255, 0.15);\n}\n.tm-tag-deselect-all-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-tag-select-close-btn{\n    background:transparent;\n    border:none;\n    color:rgba(255, 255, 255, 0.5);\n    font-size:0.95rem;\n    cursor:pointer;\n    padding:0 4px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    transition:color 0.15s;\n}\n.tm-tag-select-close-btn:hover{\n    color:#ffffff;\n}\n\n.tm-tag-select-list{\n    flex:1;\n    overflow-y:auto;\n    display:flex;\n    flex-direction:column;\n    gap:6px;\n    padding-right:2px;\n}\n.tm-tag-select-list::-webkit-scrollbar{\n    width:4px;\n}\n.tm-tag-select-list::-webkit-scrollbar-thumb{\n    background:rgba(255, 255, 255, 0.2);\n    border-radius:2px;\n}\n\n.tm-tag-select-item{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:32px;\n    box-sizing:border-box;\n}\n\n.tm-tag-checkbox{\n    width:18px;\n    height:18px;\n    accent-color:#ff5252;\n    cursor:pointer;\n    flex-shrink:0;\n}\n\n.tm-tag-remark-input{\n    flex:1;\n    min-width:0;\n    height:32px;\n    box-sizing:border-box;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.1);\n    border-radius:8px;\n    padding:0 10px;\n    color:#ffffff;\n    font-size:16px;\n    outline:none;\n    display:inline-flex;\n    align-items:center;\n    transition:border-color 0.2s, background 0.2s;\n}\n.tm-tag-remark-input:focus{\n    border-color:rgba(255, 255, 255, 0.3);\n    background:rgba(255, 255, 255, 0.1);\n}\n.tm-tag-remark-input::placeholder{\n    color:rgba(255, 255, 255, 0.3);\n}\n\n.tm-tag-select-empty{\n    padding:16px;\n    text-align:center;\n    font-size:0.82rem;\n    color:rgba(255, 255, 255, 0.35);\n}\n.tm-custom-modal-overlay{\n    position:fixed;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:rgba(0, 0, 0, 0.4);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    z-index:2000000020 !important;\n    opacity:0;\n    transition:opacity 0.25s ease;\n    pointer-events:auto;\n}\n\n.tm-custom-modal-overlay.active{\n    opacity:1;\n}\n\n.tm-custom-modal-content{\n    background-color:hsl(var(--shadcn-card));\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    border-radius:16px;\n    padding:24px;\n    width:85%;\n    max-width:280px;\n    text-align:center;\n    box-shadow:0 10px 30px rgba(0, 0, 0, 0.3);\n    transform:scale(0.9);\n    transition:transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-custom-modal-overlay.active .tm-custom-modal-content{\n    transform:scale(1);\n}\n\n.tm-custom-modal-title{\n    font-size:15px;\n    font-weight:700;\n    margin-bottom:6px;\n}\n\n.tm-custom-modal-message{\n    font-size:13px;\n    color:hsl(var(--shadcn-muted-foreground));\n    margin-bottom:18px;\n    line-height:1.4;\n}\n\n.tm-custom-modal-close-btn{\n    background-color:hsl(var(--shadcn-blue));\n    color:#ffffff;\n    border:none;\n    border-radius:18px;\n    padding:7px 28px;\n    font-size:12px;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    box-shadow:0 4px 10px hsla(var(--shadcn-blue) / 0.3);\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, box-shadow 0.15s;\n}\n\n.tm-custom-modal-close-btn:hover{\n    background-color:hsl(var(--shadcn-blue) / 0.9);\n    transform:translateY(-1px);\n}\n\n.tm-custom-modal-close-btn:active{\n    transform:scale(0.96);\n}\n.jc-hdr{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    width:100%;\n    margin-bottom:3px;\n    box-sizing:border-box;\n}\n\n.jc-hdr-left{\n    display:flex;\n    align-items:center;\n    gap:6px;\n    flex-shrink:0;\n}\n\n.jc-hdr-right{\n    display:flex;\n    align-items:center;\n    gap:6px;\n    min-width:0;\n}\n.jc-site{\n    font-size:8px;\n    padding:1px 4px;\n    border-radius:4px;\n    background-color:hsla(var(--shadcn-blue) / 0.1);\n    color:hsl(var(--shadcn-blue));\n    font-weight:700;\n    border:1px solid hsla(var(--shadcn-blue) / 0.25);\n    text-transform:uppercase;\n    line-height:1;\n}\n\n.jc-site-jable{\n    background-color:hsla(340, 82%, 52%, 0.1);\n    color:hsl(340, 82%, 52%);\n    border:1px solid hsla(340, 82%, 52%, 0.25);\n}\n\n.jc-site-javlib{\n    background-color:hsla(210, 100%, 50%, 0.1);\n    color:hsl(210, 100%, 50%);\n    border:1px solid hsla(210, 100%, 50%, 0.25);\n}\n.jc-skeleton{\n    pointer-events:none;\n}\n\n.jc-skeleton .skeleton-block{\n    background:hsla(var(--shadcn-muted-foreground) / 0.15);\n    border-radius:4px;\n    animation:skeleton-loading 1.5s infinite ease-in-out;\n}\n\n@keyframes skeleton-loading{\n    0%{\n        opacity:0.55;\n    }\n    50%{\n        opacity:1;\n    }\n    100%{\n        opacity:0.55;\n    }\n}\n.jc-card{\n    display:flex;\n    flex-direction:column;\n    padding:5px 0;\n    background-color:transparent;\n    border:none;\n    border-bottom:1px solid rgba(255, 255, 255, 0.04);\n    transition:opacity 0.2s;\n    margin-bottom:6px;\n    text-align:left;\n    width:100%;\n    box-sizing:border-box;\n}\n\n.jc-card .jc-bd{\n    width:100%;\n}\n\n.jc-card .jc-u{\n    font-weight:500;\n    color:rgba(255, 255, 255, 0.65);\n    text-decoration:none;\n    max-width:140px;\n    white-space:nowrap;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    font-size:12.5px;\n    display:inline-block;\n    vertical-align:middle;\n    transition:color var(--anim-quick);\n}\n\n.jc-card a.jc-u:hover{\n    text-decoration:underline;\n    color:hsl(var(--shadcn-blue));\n}\n\n.jc-card .jc-t{\n    color:rgba(255, 255, 255, 0.4);\n    font-size:11px;\n    display:inline-block;\n    vertical-align:middle;\n}\n\n.jc-card .jc-body-text{\n    font-size:14.5px;\n    line-height:1.55;\n    letter-spacing:0.01em;\n    color:rgba(255, 255, 255, 0.88);\n    overflow-wrap:anywhere;\n    word-break:break-word;\n    margin-top:4px;\n}\n.jc-c-sep{\n    color:rgba(255, 255, 255, 0.25);\n    margin:0 4px;\n    font-weight:normal;\n    display:inline-block;\n    vertical-align:middle;\n}\n.jc-card.jc-spam{\n    opacity:0.35;\n    background-color:transparent;\n}\n\n.jc-card.jc-spam:hover{\n    opacity:0.75;\n}\n\n.jc-spam-badge{\n    background-color:hsla(var(--shadcn-destructive) / 0.8);\n    color:hsl(var(--shadcn-destructive-foreground));\n    font-size:8px;\n    padding:1px 4px;\n    border-radius:3px;\n    font-weight:600;\n    margin-left:4px;\n    display:inline-block;\n    vertical-align:middle;\n}\n.jc-time-link{\n    color:hsl(142.1 70.6% 45.3%);\n    font-weight:700;\n    cursor:pointer;\n    text-decoration:none;\n    transition:transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, color 0.15s, box-shadow 0.15s;\n    padding:2px 6px;\n    background-color:hsla(142.1 70.6% 45.3% / 0.16);\n    border:1px solid hsla(142.1 70.6% 45.3% / 0.25);\n    border-radius:4px;\n    display:inline-block;\n    margin:0 2px;\n    font-family:monospace;\n    font-size:12.5px;\n}\n\n.jc-time-link:hover{\n    background-color:hsla(142.1 70.6% 45.3% / 0.25);\n    color:hsl(142.1 76.2% 36.3%);\n    box-shadow:0 1px 4px hsla(142.1 70.6% 45.3% / 0.15);\n}\n\n.jc-time-link:active{\n    transform:scale(0.96);\n}\n\n.jc-code-link{\n    display:inline-block;\n    padding:2px 6px;\n    margin:0 2px;\n    background-color:hsla(var(--shadcn-blue) / 0.16);\n    border:1px solid hsla(var(--shadcn-blue) / 0.35);\n    color:hsl(var(--shadcn-blue));\n    border-radius:4px;\n    font-weight:700;\n    cursor:pointer;\n    font-size:12px;\n    font-family:monospace;\n    transition:transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, color 0.15s, box-shadow 0.15s;\n}\n\n.jc-code-link:hover{\n    background-color:hsl(var(--shadcn-blue));\n    color:hsl(var(--shadcn-blue-foreground));\n    box-shadow:0 2px 6px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.jc-code-link:active{\n    transform:scale(0.96);\n}\n\n.jc-emoji{\n    height:16px;\n    width:16px;\n    vertical-align:middle;\n    display:inline-block;\n    margin:0 1px;\n}\n.tm-comment-loading,\n.tm-comment-error{\n    width:100%;\n    padding:24px;\n    text-align:center;\n    font-size:12px;\n    color:hsl(var(--shadcn-muted-foreground));\n    box-sizing:border-box;\n    pointer-events:auto;\n    background-color:transparent;\n    flex:1;\n}\n\n.tm-comment-error{\n    color:hsl(var(--shadcn-destructive));\n}\n\n.tm-comment-loader-graphic{\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    gap:5px;\n    padding:16px;\n    width:100%;\n}\n\n.tm-comment-loader-graphic .dot{\n    width:6px;\n    height:6px;\n    border-radius:50%;\n    background-color:hsl(var(--shadcn-blue));\n    animation:tmDotPulse 1.4s infinite ease-in-out both;\n}\n\n.tm-comment-loader-graphic .dot:nth-child(1){\n    animation-delay:-0.32s;\n}\n\n.tm-comment-loader-graphic .dot:nth-child(2){\n    animation-delay:-0.16s;\n}\n\n@keyframes tmDotPulse{\n    0%, 80%, 100%{\n        transform:scale(0);\n        opacity:0.3;\n    }\n    40%{\n        transform:scale(1);\n        opacity:1;\n    }\n}\n\n@keyframes tmShake{\n    0%, 100%{ transform:translateX(0); }\n    20%, 60%{ transform:translateX(-4px); }\n    40%, 80%{ transform:translateX(4px); }\n}\n.tm-comments-tabs{\n    display:flex;\n    align-items:center;\n    justify-content:flex-start;\n    gap:8px;\n    padding:8px 16px;\n    background-color:hsla(var(--shadcn-card) / 0.65);\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    pointer-events:auto;\n    z-index:9994;\n    overflow-x:auto;\n    scrollbar-width:none;\n    overscroll-behavior:contain;\n    touch-action:pan-x;\n}\n.tm-comments-tabs::-webkit-scrollbar{\n    display:none;\n}\n\n.tm-comments-tab-btn{\n    padding:6px 14px;\n    font-size:12px;\n    font-weight:500;\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:transparent;\n    border:1px solid transparent;\n    border-radius:16px;\n    cursor:pointer;\n    white-space:nowrap;\n    outline:none;\n    transition:background-color 0.15s, color 0.15s, border-color 0.15s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.tm-comments-tab-btn:hover{\n    color:hsl(var(--shadcn-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n}\n\n.tm-comments-tab-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-comments-tab-btn.active{\n    color:#ffffff;\n    background-color:hsl(var(--shadcn-blue));\n    border-color:hsl(var(--shadcn-blue));\n    box-shadow:0 2px 8px hsla(var(--shadcn-blue) / 0.3);\n    font-weight:600;\n}\n.jc-score-badge{\n    display:inline-block;\n    font-size:10px;\n    color:hsl(var(--shadcn-blue));\n    background-color:hsla(var(--shadcn-blue) / 0.1);\n    border:1px solid hsla(var(--shadcn-blue) / 0.3);\n    border-radius:4px;\n    padding:0 4px;\n    margin-left:6px;\n    font-weight:600;\n    vertical-align:middle;\n}\n@media (orientation: landscape){\n    .tm-comments-panel{\n        position:absolute !important;\n        width:0 !important;\n        height:0 !important;\n        overflow:hidden !important;\n        visibility:hidden !important;\n        pointer-events:none !important;\n        opacity:0 !important;\n        border:none !important;\n        margin:0 !important;\n        padding:0 !important;\n    }\n}\n.jc-body-text--collapsible{\n    position:relative;\n    display:flex;\n    flex-direction:column;\n}\n.jc-body-text--collapsible[data-collapsed="true"]{\n    cursor:pointer;\n}\n\n.jc-body-text--collapsible[data-collapsed="true"] .jc-body-text-content{\n    max-height:80px;\n    overflow:hidden;\n    mask-image:linear-gradient(to bottom, black 50%, transparent 100%);\n    -webkit-mask-image:linear-gradient(to bottom, black 50%, transparent 100%);\n}\n\n.jc-toggle-expand-btn{\n    align-self:flex-start;\n    background:transparent;\n    border:none;\n    color:hsl(var(--shadcn-blue));\n    font-size:11px;\n    font-weight:600;\n    padding:4px 0;\n    cursor:pointer;\n    outline:none;\n    transition:opacity 0.2s;\n    pointer-events:auto;\n}\n\n.jc-toggle-expand-btn:hover{\n    opacity:0.8;\n    text-decoration:underline;\n}\n\n.jc-site-javlib-review{\n    background-color:hsla(270, 100%, 60%, 0.1);\n    color:hsl(270, 100%, 60%);\n    border:1px solid hsla(270, 100%, 60%, 0.25);\n}\n.tm-comment-section{\n    display:flex;\n    flex-direction:column;\n    width:100%;\n    margin-bottom:6px;\n    box-sizing:border-box;\n    min-height:0;\n    flex:0 0 auto;\n    transition:flex 0.25s cubic-bezier(0.25, 1, 0.5, 1);\n}\n\n.tm-comment-section:not(.is-collapsed){\n    flex:1;\n}\n\n.tm-comment-section-body{\n    flex:1;\n    min-height:0;\n    overflow-y:auto;\n    -webkit-overflow-scrolling:touch;\n    overscroll-behavior-y:contain;\n    padding-right:4px;\n    padding-bottom:56px;\n}\n.tm-comment-section-body::-webkit-scrollbar{\n    width:4px;\n}\n\n.tm-comment-section-body::-webkit-scrollbar-thumb{\n    background:hsla(var(--shadcn-muted-foreground) / 0.25);\n    border-radius:2px;\n}\n\n#tm-comment-section-jable{\n    border-left:3px solid hsl(var(--shadcn-red));\n    background:linear-gradient(to right, hsla(var(--shadcn-red) / 0.05), transparent);\n    padding-left:6px;\n    padding-right:4px;\n    padding-top:2px;\n    padding-bottom:2px;\n    border-radius:var(--shadcn-radius-sm);\n}\n#tm-comment-section-jable .tm-comment-section-title{\n    color:hsl(var(--shadcn-red)) !important;\n}\n\n#tm-comment-section-javlib{\n    border-left:3px solid hsl(var(--shadcn-purple));\n    background:linear-gradient(to right, hsla(var(--shadcn-purple) / 0.05), transparent);\n    padding-left:6px;\n    padding-right:4px;\n    padding-top:2px;\n    padding-bottom:2px;\n    border-radius:var(--shadcn-radius-sm);\n}\n#tm-comment-section-javlib .tm-comment-section-title{\n    color:hsl(var(--shadcn-purple)) !important;\n}\n\n#tm-comment-section-javdb{\n    border-left:3px solid hsl(var(--shadcn-blue));\n    background:linear-gradient(to right, hsla(var(--shadcn-blue) / 0.05), transparent);\n    padding-left:6px;\n    padding-right:4px;\n    padding-top:2px;\n    padding-bottom:2px;\n    border-radius:var(--shadcn-radius-sm);\n}\n#tm-comment-section-javdb .tm-comment-section-title{\n    color:hsl(var(--shadcn-blue)) !important;\n}\n\n.tm-comment-section-hdr{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    width:100%;\n    padding:1px 0;\n    margin-bottom:4px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    box-sizing:border-box;\n    cursor:pointer;\n    user-select:none;\n}\n\n.tm-comment-section-title{\n    font-size:13px;\n    font-weight:600;\n    color:hsl(var(--shadcn-foreground));\n    display:flex;\n    align-items:center;\n    gap:6px;\n}\n\n.tm-comment-login-badge{\n    display:inline-flex;\n    align-items:center;\n    gap:4px;\n    padding:2px 8px;\n    border-radius:12px;\n    font-size:10px;\n    font-weight:600;\n    line-height:1;\n    transition:background-color 0.2s, color 0.2s, border-color 0.2s;\n}\n\n.tm-comment-login-badge.is-logged-in{\n    color:hsl(142.1 70.6% 45.3%);\n    background-color:hsla(142.1 70.6% 45.3% / 0.1);\n    border:1px solid hsla(142.1 70.6% 45.3% / 0.2);\n    cursor:default;\n}\n\n.tm-comment-login-badge.is-not-logged-in{\n    color:hsl(30 100% 50%);\n    background-color:hsla(30 100% 50% / 0.1);\n    border:1px solid hsla(30 100% 50% / 0.25);\n    cursor:pointer;\n}\n\n.tm-comment-login-badge.is-not-logged-in:hover{\n    background-color:hsla(30 100% 50% / 0.2);\n    transform:translateY(-0.5px);\n    box-shadow:0 2px 6px hsla(30 100% 50% / 0.15);\n}\n\n.tm-comment-login-badge.is-not-logged-in:active{\n    transform:scale(0.96);\n}\n\n.tm-comment-login-badge.is-checking{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    cursor:default;\n}\n\n.tm-comment-status-badge{\n    display:inline-flex;\n    align-items:center;\n    gap:4px;\n    padding:2px 8px;\n    border-radius:12px;\n    font-size:10px;\n    font-weight:600;\n    line-height:1;\n}\n.tm-status-badge-loading{\n    color:hsl(var(--shadcn-blue));\n    background-color:hsla(var(--shadcn-blue) / 0.1);\n    border:1px solid hsla(var(--shadcn-blue) / 0.2);\n    animation:tmPulse 2s infinite ease-in-out;\n}\n\n.tm-status-badge-unreachable{\n    color:hsl(var(--shadcn-destructive));\n    background-color:hsla(var(--shadcn-destructive) / 0.1);\n    border:1px solid hsla(var(--shadcn-destructive) / 0.2);\n}\n\n.tm-status-badge-not_found{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n}\n\n.tm-status-badge-mobile_unsupported{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n}\n\n.tm-status-badge-empty{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n}\n\n.tm-status-badge-cf_shield{\n    color:hsl(30 100% 50%);\n    background-color:hsla(30 100% 50% / 0.1);\n    border:1px solid hsla(30 100% 50% / 0.2);\n}\n\n.tm-status-badge-loaded{\n    color:hsl(142.1 70.6% 45.3%);\n    background-color:hsla(142.1 70.6% 45.3% / 0.1);\n    border:1px solid hsla(142.1 70.6% 45.3% / 0.2);\n}\n\n@keyframes tmPulse{\n    0%{\n        opacity:0.7;\n    }\n    50%{\n        opacity:1;\n    }\n    100%{\n        opacity:0.7;\n    }\n}\n\n.jc-comment-link{\n    color:hsl(var(--shadcn-blue));\n    text-decoration:underline;\n}\n.jc-comment-link:hover{\n    color:hsl(var(--shadcn-blue) / 0.8);\n}\n\n.tm-comment-copy-all-btn{\n    margin-left:10px;\n    cursor:pointer;\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    border-radius:4px;\n    padding:2px 8px;\n    font-size:10px;\n    font-weight:600;\n    color:hsl(var(--shadcn-muted-foreground));\n    outline:none;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s;\n}\n.tm-comment-copy-all-btn:hover{\n    color:hsl(var(--shadcn-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.3);\n    border-color:hsla(var(--shadcn-border) / 0.4);\n}\n.tm-comment-copy-all-btn:active{\n    transform:scale(0.96);\n}\n@keyframes jcCardHighlightFlash{\n    0%{\n        background-color:hsla(var(--shadcn-blue) / 0.22);\n    }\n    100%{\n        background-color:transparent;\n    }\n}\n.jc-card-highlight-flash{\n    animation:jcCardHighlightFlash 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;\n}\n@media screen and (orientation: landscape){\n    .tm-comments-panel:hover::after{\n        opacity:0 !important;\n        pointer-events:none !important;\n    }\n}\n.tm-show-controls-float-btn{\n    position:absolute;\n    bottom:calc(96px + env(safe-area-inset-bottom, 0px));\n    right:16px;\n    width:36px;\n    height:36px;\n    border-radius:50%;\n    background:rgba(18, 18, 20, 0.85);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    color:rgba(255, 255, 255, 0.85);\n    display:none;\n    align-items:center;\n    justify-content:center;\n    box-shadow:0 4px 12px rgba(0, 0, 0, 0.4);\n    z-index:9997;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s;\n    padding:0;\n    outline:none;\n    box-sizing:border-box;\n    pointer-events:auto;\n}\n.tm-show-controls-float-btn::after{\n    content:'';\n    position:absolute;\n    inset:-4px;\n    border-radius:50%;\n    pointer-events:auto;\n}\n.tm-show-controls-float-btn:hover{\n    color:#ffffff;\n    background:rgba(255, 255, 255, 0.2);\n    transform:scale(1.06);\n}\n.tm-show-controls-float-btn:active{\n    transform:scale(0.96);\n}\n.tm-show-controls-float-btn svg{\n    height:18px;\n    width:auto;\n    display:block;\n    fill:none !important;\n}\n.tm-show-controls-float-btn svg path{\n    fill:currentColor !important;\n    stroke:none !important;\n}\nbody.controls-hidden:not(.tm-mode-pc):not(.tm-mode-ipad-portrait) .tm-show-controls-float-btn{\n    display:flex;\n}\n.tm-custom-modal-cancel-btn{\n    background-color:hsla(var(--shadcn-muted)/0.2);\n    color:hsl(var(--shadcn-foreground));\n    border:none;\n    border-radius:18px;\n    padding:7px 20px;\n    font-size:12px;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background-color 0.2s;\n}\n.tm-custom-modal-cancel-btn:hover{\n    background-color:hsla(var(--shadcn-muted)/0.3);\n}\n\n.tm-custom-modal-submit-btn,\n.tm-custom-modal-login-btn{\n    background-color:hsl(var(--shadcn-blue));\n    color:#ffffff;\n    border:none;\n    border-radius:18px;\n    padding:7px 20px;\n    font-size:12px;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    box-shadow:0 4px 10px hsla(var(--shadcn-blue) / 0.3);\n    transition:background-color 0.2s;\n}\n.tm-custom-modal-submit-btn:hover,\n.tm-custom-modal-login-btn:hover{\n    background-color:hsl(var(--shadcn-blue)/0.9);\n}\n\n.tm-comment-input-textarea{\n    width:100%;\n    height:90px;\n    margin:12px 0;\n    padding:10px;\n    border-radius:8px;\n    border:1px solid hsla(var(--shadcn-border) / 0.3);\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    color:hsl(var(--shadcn-foreground));\n    font-size:13px;\n    resize:none;\n    box-sizing:border-box;\n    outline:none;\n    transition:border-color 0.2s;\n}\n\n\n\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "56": (module, __unused_webpack_exports, __webpack_require__) => {
      function setAttributesWithoutAttributes(styleElement) {
        var nonce = true ? __webpack_require__.nc : 0;
        if (nonce) {
          styleElement.setAttribute("nonce", nonce);
        }
      }
      module.exports = setAttributesWithoutAttributes;
    },
    "72": module => {
      var stylesInDOM = [];
      function getIndexByIdentifier(identifier) {
        var result = -1;
        for (var i = 0; i < stylesInDOM.length; i++) {
          if (stylesInDOM[i].identifier === identifier) {
            result = i;
            break;
          }
        }
        return result;
      }
      function modulesToDom(list, options) {
        var idCountMap = {};
        var identifiers = [];
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          var id = options.base ? item[0] + options.base : item[0];
          var count = idCountMap[id] || 0;
          var identifier = "".concat(id, " ").concat(count);
          idCountMap[id] = count + 1;
          var indexByIdentifier = getIndexByIdentifier(identifier);
          var obj = {
            "css": item[1],
            "media": item[2],
            "sourceMap": item[3],
            "supports": item[4],
            "layer": item[5]
          };
          if (indexByIdentifier !== -1) {
            stylesInDOM[indexByIdentifier].references++;
            stylesInDOM[indexByIdentifier].updater(obj);
          } else {
            var updater = addElementStyle(obj, options);
            options.byIndex = i;
            stylesInDOM.splice(i, 0, {
              "identifier": identifier,
              "updater": updater,
              "references": 1
            });
          }
          identifiers.push(identifier);
        }
        return identifiers;
      }
      function addElementStyle(obj, options) {
        var api = options.domAPI(options);
        api.update(obj);
        var updater = function updater(newObj) {
          if (newObj) {
            if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
              return;
            }
            api.update(obj = newObj);
          } else {
            api.remove();
          }
        };
        return updater;
      }
      module.exports = function(list, options) {
        options = options || {};
        list = list || [];
        var lastIdentifiers = modulesToDom(list, options);
        return function update(newList) {
          newList = newList || [];
          for (var i = 0; i < lastIdentifiers.length; i++) {
            var identifier = lastIdentifiers[i];
            var index = getIndexByIdentifier(identifier);
            stylesInDOM[index].references--;
          }
          var newLastIdentifiers = modulesToDom(newList, options);
          for (var _i = 0; _i < lastIdentifiers.length; _i++) {
            var _identifier = lastIdentifiers[_i];
            var _index = getIndexByIdentifier(_identifier);
            if (stylesInDOM[_index].references === 0) {
              stylesInDOM[_index].updater();
              stylesInDOM.splice(_index, 1);
            }
          }
          lastIdentifiers = newLastIdentifiers;
        };
      };
    },
    "113": module => {
      function styleTagTransform(css, styleElement) {
        if (styleElement.styleSheet) {
          styleElement.styleSheet.cssText = css;
        } else {
          while (styleElement.firstChild) {
            styleElement.removeChild(styleElement.firstChild);
          }
          styleElement.appendChild(document.createTextNode(css));
        }
      }
      module.exports = styleTagTransform;
    },
    "140": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `.tm-time-indicator{\n    position:absolute;\n    background-color:hsla(var(--shadcn-card) / 0.8);\n    color:hsl(var(--shadcn-card-foreground));\n    padding:4px 8px;\n    border-radius:4px;\n    font-size:12px;\n    font-weight:500;\n    font-variant-numeric:tabular-nums;\n    pointer-events:none;\n    z-index:9995;\n    opacity:0;\n    transform:translateY(-8px);\n    transition:opacity 0.2s, transform 0.2s;\n    box-shadow:0 2px 8px rgba(0, 0, 0, 0.2);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n}\n.tm-volume-control{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:40px;\n    padding:0 8px;\n    background-color:transparent;\n    transition:opacity 0.3s ease;\n}\n.tm-volume-control-no-slider{\n    width:auto;\n    padding:0;\n}\n\n.tm-volume-control-no-slider .tm-volume-button{\n    margin:0 8px;\n}\n.tm-volume-button{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    width:32px;\n    height:32px;\n    padding:4px;\n    border:none;\n    border-radius:50%;\n    background:transparent;\n    color:#fff;\n    cursor:pointer;\n    transition:background-color 0.2s ease;\n}\n\n.tm-volume-button:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n}\n\n.tm-volume-button svg{\n    width:20px;\n    height:20px;\n}\n.tm-volume-slider-container{\n    position:relative;\n    width:0;\n    height:40px;\n    display:flex;\n    align-items:center;\n    overflow:hidden;\n    transition:width 0.3s ease;\n    opacity:0;\n}\n@media (hover: hover){\n    .tm-volume-control:hover .tm-volume-slider-container{\n        width:80px;\n        opacity:1;\n    }\n}\n.tm-volume-control.dragging .tm-volume-slider-container{\n    width:80px;\n    opacity:1;\n}\n.tm-volume-slider-track{\n    position:relative;\n    width:100%;\n    height:4px;\n    background-color:hsla(var(--shadcn-secondary) / 0.3);\n    border-radius:2px;\n    cursor:pointer;\n}\n.tm-volume-slider-level{\n    position:absolute;\n    left:0;\n    top:0;\n    height:100%;\n    background-color:#fff;\n    border-radius:2px;\n    pointer-events:none;\n    transition:width 0.1s ease;\n}\n.tm-volume-value{\n    position:absolute;\n    top:-24px;\n    left:50%;\n    transform:translateX(-50%);\n    background-color:hsla(var(--shadcn-secondary) / 0.8);\n    color:#fff;\n    padding:2px 6px;\n    border-radius:4px;\n    font-size:12px;\n    font-variant-numeric:tabular-nums;\n    opacity:0;\n    transition:opacity 0.2s ease;\n    pointer-events:none;\n    backdrop-filter:blur(4px);\n}\n.tm-volume-control.dragging .tm-volume-value{\n    opacity:1;\n}\n@media (hover: none){\n    .tm-volume-control{\n        touch-action:none;\n    }\n    \n    .tm-volume-slider-track{\n        height:6px;\n    }\n    \n    .tm-volume-button{\n        width:40px;\n        height:40px;\n    }\n}\n@media (prefers-color-scheme: dark){\n    .tm-volume-slider-level{\n        background-color:hsl(var(--shadcn-primary));\n    }\n    \n    .tm-volume-button svg{\n        stroke:hsl(var(--shadcn-primary));\n    }\n}\n.tm-toggle-switch{\n    position:relative;\n    display:inline-block;\n    width:40px;\n    height:24px;\n}\n\n.tm-toggle-switch input{\n    opacity:0;\n    width:0;\n    height:0;\n}\n\n.tm-toggle-slider{\n    position:absolute;\n    cursor:pointer;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:hsla(var(--shadcn-muted) / 0.7);\n    border-radius:12px;\n    transition:var(--anim-quick);\n}\n\n.tm-toggle-slider:before{\n    position:absolute;\n    content:"";\n    height:20px;\n    width:20px;\n    left:2px;\n    bottom:2px;\n    background-color:hsl(var(--shadcn-foreground));\n    border-radius:50%;\n    transition:var(--anim-quick);\n    box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);\n}\n\n.tm-toggle-slider.checked{\n    background-color:hsl(var(--shadcn-blue));\n}\n\n.tm-toggle-slider.checked:before{\n    transform:translateX(16px);\n}\n.tm-playback-rate-button{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    margin-left:0;\n    height:32px;\n    width:80px;\n    background:hsla(var(--shadcn-secondary) / 0.5);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    color:hsl(var(--shadcn-foreground));\n    font-size:15px;\n    font-weight:600;\n    font-variant-numeric:tabular-nums;\n    letter-spacing:-0.1px;\n    border-radius:9999px;\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    box-shadow:0 1px 3px rgba(0, 0, 0, 0.08);\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, box-shadow 0.15s, color 0.15s;\n    cursor:pointer;\n    text-align:center;\n    box-sizing:border-box;\n    padding:0;\n}\n\n.tm-playback-rate-button:hover{\n    background:hsla(var(--shadcn-secondary) / 0.8);\n    border-color:hsla(var(--shadcn-border) / 0.3);\n    transform:translateY(-1px);\n    box-shadow:var(--shadow-md);\n}\n\n.tm-playback-rate-button:active{\n    transform:scale(0.96);\n    background:hsla(var(--shadcn-secondary) / 0.9);\n}\n.tm-playback-rate-button.fast{\n    color:hsl(var(--shadcn-orange));\n    border-color:hsla(var(--shadcn-orange) / 0.3);\n    background:hsla(var(--shadcn-orange) / 0.1);\n}\n\n.tm-playback-rate-button.medium{\n    color:hsl(var(--shadcn-blue));\n    border-color:hsla(var(--shadcn-blue) / 0.3);\n    background:hsla(var(--shadcn-blue) / 0.1);\n}\n\n.tm-playback-rate-button.normal{\n    color:hsl(var(--shadcn-foreground));\n}\n.tm-progress-controls{\n    position:relative;\n    width:100%;\n    bottom:0;\n    left:0;\n    right:0;\n    display:flex;\n    flex-direction:column;\n    z-index:9991;\n    border-radius:0 0 var(--shadcn-radius-lg) var(--shadcn-radius-lg);\n    font-family:var(--font-sans);\n    transition:opacity var(--anim-smooth);\n}\n.tm-progress-bar-container{\n    position:relative;\n    height:12px;\n    display:flex;\n    align-items:center;\n    cursor:pointer;\n    user-select:none;\n    -webkit-user-select:none;\n    -moz-user-select:none;\n    -ms-user-select:none;\n    touch-action:none;\n}\n.tm-progress-bar{\n    width:100%;\n    height:8px;\n    background-color:hsla(var(--shadcn-muted) / 0.5);\n    border-radius:8px;\n    overflow:hidden;\n    position:relative;\n    transition:height 0.15s;\n}\n\n.tm-progress-bar:hover{\n    height:6px;\n}\n.tm-progress-bar-expanded{\n    height:16px !important;\n}\n\n.tm-progress-bar-normal{\n    height:8px !important;\n}\n.tm-progress-bar.tm-dragging{\n    height:16px !important;\n    background-color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    cursor:grabbing;\n}\n.tm-progress-bar-container:has(.tm-dragging){\n    cursor:grabbing;\n}\n.tm-progress-indicator{\n    height:100%;\n    width:0%;\n    background-color:hsla(var(--shadcn-muted) / 0.8);\n    border-radius:0;\n    position:absolute;\n    left:0;\n    top:0;\n    transition:width 0.1s linear;\n    overflow:hidden;\n}\n.tm-dragging .tm-progress-indicator{\n    background-color:hsl(var(--shadcn-card-foreground));\n    box-shadow:none;\n    transition:none;\n}\n.tm-progress-handle{\n    width:12px;\n    height:12px;\n    background-color:hsl(var(--shadcn-blue));\n    border:2px solid hsl(var(--shadcn-card));\n    border-radius:50%;\n    position:absolute;\n    top:50%;\n    left:0%;\n    transform:translate(0, -50%);\n    z-index:2;\n    opacity:1;\n    transition:opacity 0.15s, width 0.15s, height 0.15s, box-shadow 0.15s;\n    box-shadow:0 0 0 4px hsl(var(--shadcn-blue) / 0.2);\n    cursor:grab;\n}\n\n.tm-progress-handle:hover,\n.tm-progress-handle.dragging{\n    transform:translate(0, -50%) scale(1.1);\n    box-shadow:0 0 0 6px hsl(var(--shadcn-blue) / 0.3);\n}\n.tm-settings-label{\n    cursor:pointer;\n    flex:1;\n    font-family:var(--font-sans);\n    font-size:14px;\n    color:hsl(var(--shadcn-foreground));\n}\n.tm-playback-control-row .tm-control-button,\n.tm-playback-control-row .tm-volume-button{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    padding:0px;\n    border:none;\n    border-radius:50%;\n    background-color:transparent;\n    color:#fff;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;\n    -webkit-tap-highlight-color:transparent;\n}\n\n.tm-playback-control-row .tm-control-button{\n    width:42px;\n    height:42px;\n}\n\n.tm-playback-control-row .tm-volume-button{\n    width:36px;\n    height:36px;\n}\n\n.tm-playback-control-row .tm-control-button:hover,\n.tm-playback-control-row .tm-volume-button:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    transform:scale(1.05);\n}\n\n.tm-playback-control-row .tm-control-button:active,\n.tm-playback-control-row .tm-volume-button:active{\n    transform:scale(0.96);\n}\n\n.tm-playback-control-row .tm-control-button svg{\n    width:24px;\n    height:24px;\n    stroke:currentColor;\n    stroke-width:2;\n    fill:none;\n}\n.tm-playback-control-row .tm-control-button svg.tm-play-icon{\n    margin-left:2px;\n}\n\n.tm-playback-control-row .tm-volume-button svg{\n    width:20px;\n    height:20px;\n    stroke:currentColor;\n    stroke-width:2;\n    fill:none;\n}\n@media (hover: none){\n    .tm-playback-control-row .tm-control-button{\n        width:44px;\n        height:44px;\n    }\n    .tm-playback-control-row .tm-volume-button{\n        width:40px;\n        height:40px;\n    }\n}\n@media (prefers-color-scheme: dark){\n    .tm-playback-control-row .tm-control-button svg,\n    .tm-playback-control-row .tm-volume-button svg{\n        stroke:hsl(var(--shadcn-secondary-foreground));\n    }\n}\n.tm-time-control-button-hover{\n    background-color:hsl(var(--shadcn-accent) / 0.6);\n    transform:none;\n    box-shadow:0 2px 4px rgba(0,0,0,0.1);\n}\n\n.tm-time-control-button-active{\n    transform:scale(0.95);\n    box-shadow:none;\n}\n\n.tm-time-control-button-default{\n    transform:translateY(0);\n    box-shadow:0 1px 2px rgba(0,0,0,0.05);\n}\n\n.tm-time-control-button-after-active{\n    transform:none;\n    box-shadow:0 2px 5px rgba(0, 0, 0, 0.15);\n}\n.tm-modal-overlay{\n    position:fixed;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:hsla(var(--shadcn-background) / 0.7);\n    backdrop-filter:blur(6px);\n    -webkit-backdrop-filter:blur(6px);\n    z-index:2000000010 !important;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    opacity:0;\n    transition:opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    padding:20px;\n    box-sizing:border-box;\n}\n\n.tm-modal-overlay.visible{\n    opacity:1;\n}\n\n.tm-comment-modal{\n    width:100%;\n    max-width:420px;\n    background-color:hsla(var(--shadcn-card) / 0.95);\n    border-radius:12px;\n    box-shadow:0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.12);\n    overflow:hidden;\n    transform:scale(0.95) translateY(10px);\n    opacity:0;\n    transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),  opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    flex-direction:column;\n}\n\n.tm-comment-modal.visible{\n    transform:scale(1) translateY(0);\n    opacity:1;\n}\n\n.tm-modal-header{\n    padding:16px 20px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n}\n\n.tm-modal-title{\n    font-size:16px;\n    font-weight:600;\n    margin:0;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-modal-close{\n    position:relative;\n    background:transparent;\n    border:none;\n    cursor:pointer;\n    width:28px;\n    height:28px;\n    border-radius:50%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    color:hsl(var(--shadcn-muted-foreground));\n    transition:background-color 0.2s, color 0.2s, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.tm-modal-close::after,\n.tm-floating-panel-close::after{\n    content:'';\n    position:absolute;\n    inset:-6px;\n    border-radius:50%;\n    pointer-events:auto;\n}\n\n.tm-modal-close:hover{\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-modal-close:active{\n    transform:scale(0.96);\n}\n\n.tm-modal-content{\n    padding:16px 20px;\n    flex:1;\n}\n\n.tm-comment-textarea{\n    width:100%;\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    border-radius:8px;\n    padding:12px;\n    font-family:var(--font-sans);\n    font-size:14px;\n    line-height:1.5;\n    resize:none;\n    height:120px;\n    box-sizing:border-box;\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    color:hsl(var(--shadcn-foreground));\n    transition:border-color 0.2s, box-shadow 0.2s;\n}\n\n.tm-comment-textarea:focus{\n    outline:none;\n    border-color:hsl(var(--shadcn-blue));\n    box-shadow:0 0 0 2px hsla(var(--shadcn-blue) / 0.2);\n}\n\n.tm-comment-textarea::placeholder{\n    color:hsl(var(--shadcn-muted-foreground));\n}\n\n.tm-comment-textarea.error{\n    border-color:hsl(var(--shadcn-destructive));\n    animation:shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\n}\n\n.tm-modal-footer{\n    padding:16px 20px;\n    border-top:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    justify-content:flex-end;\n    gap:12px;\n}\n\n.tm-modal-button{\n    padding:8px 16px;\n    border-radius:8px;\n    font-size:14px;\n    font-weight:500;\n    border:none;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, box-shadow 0.15s;\n}\n\n.tm-modal-cancel{\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    color:hsl(var(--shadcn-secondary-foreground));\n}\n\n.tm-modal-cancel:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    transform:translateY(-1px);\n}\n\n.tm-modal-submit{\n    background-color:hsl(var(--shadcn-blue));\n    color:hsl(var(--shadcn-blue-foreground));\n}\n\n.tm-modal-submit:hover{\n    background-color:hsl(var(--shadcn-blue) / 0.9);\n    transform:translateY(-1px);\n    box-shadow:0 2px 5px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.tm-modal-button:active{\n    transform:scale(0.96);\n}\n\n@media (max-width: 480px){\n    .tm-comment-modal{\n        max-width:100%;\n    }\n    \n    .tm-modal-header,\n    .tm-modal-content,\n    .tm-modal-footer{\n        padding:12px 16px;\n    }\n}\n@media screen and (orientation: landscape){\n    .tm-comment-modal{\n        max-width:500px;\n        max-height:90vh;\n    }\n    \n    .tm-comment-textarea{\n        height:100px;\n    }\n}\n.tm-video-minimap{\n    position:absolute !important;\n    bottom:20px !important;\n    left:20px !important;\n    top:auto !important;\n    right:auto !important;\n    margin:0 !important;\n    transform:none !important;\n    width:80px;\n    height:45px;\n    background-color:rgba(0, 0, 0, 0.65) !important;\n    border:1px solid rgba(255, 255, 255, 0.3) !important;\n    border-radius:4px !important;\n    overflow:hidden !important;\n    z-index:9998 !important;\n    pointer-events:none !important;\n    opacity:0 !important;\n    visibility:hidden !important;\n    transition:opacity 0.3s ease, visibility 0.3s ease !important;\n    backdrop-filter:blur(6px) !important;\n    -webkit-backdrop-filter:blur(6px) !important;\n    box-shadow:0 4px 12px rgba(0, 0, 0, 0.4) !important;\n}\n\n.tm-video-minimap-viewport{\n    position:absolute !important;\n    top:0 !important;\n    bottom:0 !important;\n    left:0 !important;\n    width:100%;\n    height:100% !important;\n    box-sizing:border-box !important;\n    border:1.5px solid hsl(var(--shadcn-blue)) !important;\n    background-color:hsla(var(--shadcn-blue) / 0.15) !important;\n    border-radius:2px !important;\n    will-change:transform;\n    transition:none !important;\n}\n.tm-video-wrapper.is-swiping .tm-video-minimap{\n    opacity:1 !important;\n    visibility:visible !important;\n    border-color:rgba(255, 255, 255, 0.45) !important;\n}\n.tm-floating-comment-panel{\n    position:fixed;\n    left:50%;\n    bottom:10px;\n    transform:translateX(-50%) translateY(100%);\n    width:90%;\n    max-width:700px;\n    background-color:hsla(var(--shadcn-card) / 0.95);\n    border-radius:12px 12px 0 0;\n    box-shadow:0 -5px 25px rgba(0, 0, 0, 0.2);\n    z-index:9996;\n    opacity:0;\n    transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),  opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n    display:flex;\n    flex-direction:column;\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    overflow:hidden;\n}\n\n.tm-floating-comment-panel.visible{\n    transform:translateX(-50%) translateY(0);\n    opacity:1;\n}\n\n.tm-floating-panel-header{\n    padding:16px 20px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    background-color:hsla(var(--shadcn-card) / 0.98);\n}\n\n.tm-floating-panel-title{\n    font-size:16px;\n    font-weight:600;\n    margin:0;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-floating-panel-close{\n    background:transparent;\n    border:none;\n    cursor:pointer;\n    width:28px;\n    height:28px;\n    border-radius:50%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    color:hsl(var(--shadcn-muted-foreground));\n    transition:background-color 0.2s, color 0.2s;\n}\n\n.tm-floating-panel-close:hover{\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-floating-panel-content{\n    padding:16px 20px;\n    flex:1;\n    overflow-y:auto;\n    -webkit-overflow-scrolling:touch;\n}\n\n.tm-floating-panel-content .tm-comment-placeholder{\n    min-height:200px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    font-size:14px;\n}\n@media screen and (orientation: landscape){\n    .tm-floating-comment-panel{\n        max-width:500px;\n        max-height:80vh;\n        border-radius:12px;\n        bottom:20px;\n    }\n}\n.tm-floating-panel-input-area{\n    padding:12px 16px;\n    border-top:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    gap:8px;\n    background-color:hsla(var(--shadcn-card) / 0.98);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n}\n\n.tm-floating-panel-input{\n    flex:1;\n    height:40px;\n    border-radius:20px;\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    padding:0 16px;\n    font-size:16px;\n    color:hsl(var(--shadcn-foreground));\n    transition:border-color 0.2s, box-shadow 0.2s;\n}\n\n.tm-floating-panel-input:focus{\n    outline:none;\n    border-color:hsl(var(--shadcn-blue));\n    box-shadow:0 0 0 2px hsla(var(--shadcn-blue) / 0.2);\n}\n\n.tm-floating-panel-input::placeholder{\n    color:hsl(var(--shadcn-muted-foreground));\n}\n\n.tm-floating-panel-input.error{\n    border-color:hsl(var(--shadcn-destructive));\n    animation:shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\n}\n\n.tm-floating-panel-submit{\n    width:40px;\n    height:40px;\n    border-radius:50%;\n    border:none;\n    background-color:hsl(var(--shadcn-blue));\n    color:hsl(var(--shadcn-blue-foreground));\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, box-shadow 0.15s;\n    flex-shrink:0;\n}\n\n.tm-floating-panel-submit:hover{\n    background-color:hsl(var(--shadcn-blue) / 0.9);\n    transform:translateY(-2px);\n    box-shadow:0 2px 5px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.tm-floating-panel-submit:active{\n    transform:scale(0.96);\n}\n\n.tm-floating-panel-submit svg{\n    width:18px;\n    height:18px;\n    stroke:currentColor;\n    stroke-width:2;\n}\n@media screen and (orientation: landscape){\n    .tm-floating-panel-input-area{\n        padding:10px 16px;\n    }\n}\n.tm-speed-indicator{\n    position:absolute;\n    top:50%;\n    left:50%;\n    transform:translate(-50%, -50%);\n    background-color:rgba(0, 0, 0, 0.7);\n    color:white;\n    padding:8px 16px;\n    border-radius:4px;\n    font-size:24px;\n    font-weight:bold;\n    z-index:9999;\n}\n.ripple-btn,\n.tm-control-buttons button:not(.tm-show-controls-float-btn),\n.tm-control-buttons .tm-tab-list-btn,\n.tm-control-buttons .tm-tab-pill,\n.tm-bottom-sheet-panel button,\n.tm-bottom-sheet-panel .tm-sheet-tab-pill{\n    position:relative !important;\n    overflow:hidden !important;\n    isolation:isolate;\n}\n\n.tm-control-buttons .tm-show-controls-float-btn{\n    overflow:hidden !important;\n    isolation:isolate;\n}\n\n.ripple,\n.tm-ripple{\n    position:absolute;\n    border-radius:50%;\n    background:rgba(var(--brand-pink-rgb, 254, 98, 142), 0.4);\n    transform:scale(0);\n    animation:tm-ripple-out 0.6s ease-out;\n    pointer-events:none;\n    will-change:transform, opacity;\n    z-index:1;\n}\n\n@keyframes tm-ripple-out{\n    from{\n        transform:scale(0);\n        opacity:1;\n    }\n    to{\n        transform:scale(2.6);\n        opacity:0;\n    }\n}\n\n@keyframes ripple-out{\n    from{\n        transform:scale(0);\n        opacity:1;\n    }\n    to{\n        transform:scale(2.6);\n        opacity:0;\n    }\n}\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "314": module => {
      module.exports = function(cssWithMappingToString) {
        var list = [];
        list.toString = function toString() {
          return this.map((function(item) {
            var content = "";
            var needLayer = typeof item[5] !== "undefined";
            if (item[4]) {
              content += "@supports (".concat(item[4], ") {");
            }
            if (item[2]) {
              content += "@media ".concat(item[2], " {");
            }
            if (needLayer) {
              content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
            }
            content += cssWithMappingToString(item);
            if (needLayer) {
              content += "}";
            }
            if (item[2]) {
              content += "}";
            }
            if (item[4]) {
              content += "}";
            }
            return content;
          })).join("");
        };
        list.i = function i(modules, media, dedupe, supports, layer) {
          if (typeof modules === "string") {
            modules = [ [ null, modules, void 0 ] ];
          }
          var alreadyImportedModules = {};
          if (dedupe) {
            for (var k = 0; k < this.length; k++) {
              var id = this[k][0];
              if (id != null) {
                alreadyImportedModules[id] = true;
              }
            }
          }
          for (var _k = 0; _k < modules.length; _k++) {
            var item = [].concat(modules[_k]);
            if (dedupe && alreadyImportedModules[item[0]]) {
              continue;
            }
            if (typeof layer !== "undefined") {
              if (typeof item[5] === "undefined") {
                item[5] = layer;
              } else {
                item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
                item[5] = layer;
              }
            }
            if (media) {
              if (!item[2]) {
                item[2] = media;
              } else {
                item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
                item[2] = media;
              }
            }
            if (supports) {
              if (!item[4]) {
                item[4] = "".concat(supports);
              } else {
                item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
                item[4] = supports;
              }
            }
            list.push(item);
          }
        };
        return list;
      };
    },
    "401": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `.tm-floating-button{\n    position:fixed;\n    bottom:30px;\n    left:50%;\n    transform:translateX(-50%);\n    padding:0;\n    width:56px;\n    height:56px;\n    border-radius:50%;\n    background-color:transparent;\n    color:var(--brand-pink);\n    border:none;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    z-index:9980;\n    cursor:pointer;\n    transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    overflow:visible;\n}\n\n.tm-floating-button svg{\n    width:48px;\n    height:48px;\n    filter:drop-shadow(0 0 10px rgba(var(--brand-pink-rgb), 0.9));\n    transition:filter 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    animation:breathing-glow 3s infinite ease-in-out;\n}\n\n.tm-floating-button:hover{\n    transform:translateX(-50%) scale(1.08);\n}\n\n.tm-floating-button:hover svg{\n    filter:drop-shadow(0 0 20px rgba(var(--brand-pink-rgb), 1.0));\n}\n\n.tm-floating-button:active{\n    transform:translateX(-50%) scale(0.96);\n}\n@keyframes breathing-glow{\n    0%{\n        filter:drop-shadow(0 0 8px rgba(var(--brand-pink-rgb), 0.7));\n    }\n    50%{\n        filter:drop-shadow(0 0 22px rgba(var(--brand-pink-rgb), 1.0));\n    }\n    100%{\n        filter:drop-shadow(0 0 8px rgba(var(--brand-pink-rgb), 0.7));\n    }\n}\n@media screen and (orientation: landscape){\n    .tm-floating-button{\n        left:auto;\n        right:20px;\n        transform:none;\n    }\n    \n    .tm-floating-button:hover{\n        transform:scale(1.08);\n    }\n    \n    .tm-floating-button:active{\n        transform:scale(0.96);\n    }\n}\n.tm-toast{\n    position:fixed;\n    z-index:100000;\n    left:50%;\n    padding:10px 20px;\n    border-radius:var(--shadcn-radius);\n    color:hsl(var(--shadcn-foreground));\n    background:hsla(var(--shadcn-card) / 0.85);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    font-size:14px;\n    font-weight:500;\n    max-width:80%;\n    text-align:center;\n    word-break:break-all;\n    box-shadow:var(--shadow-lg);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    opacity:0;\n    transition:opacity var(--anim-smooth), transform var(--anim-smooth);\n    font-family:var(--font-sans);\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    gap:8px;\n}\n\n.tm-toast.visible{\n    opacity:1;\n}\n\n.tm-toast-icon{\n    flex-shrink:0;\n    width:15px;\n    height:15px;\n    opacity:0.95;\n}\n\n.tm-toast-content{\n    display:inline-block;\n}\n\n.tm-toast--top{\n    top:10%;\n    transform:translateX(-50%) translateY(-10px);\n}\n.tm-toast--top.visible{\n    transform:translateX(-50%) translateY(0);\n}\n\n.tm-toast--bottom{\n    bottom:10%;\n    transform:translateX(-50%) translateY(10px);\n}\n.tm-toast--bottom.visible{\n    transform:translateX(-50%) translateY(0);\n}\n\n.tm-toast--center{\n    top:50%;\n    transform:translate(-50%, -40%);\n}\n.tm-toast--center.visible{\n    transform:translate(-50%, -50%);\n}\n\n.tm-toast--error{\n    background:hsla(var(--shadcn-destructive) / 0.85);\n    border-color:hsla(var(--shadcn-destructive) / 0.3);\n    color:#fff;\n}\n\n.tm-toast--success{\n    background:hsla(var(--shadcn-green) / 0.85);\n    border-color:hsla(var(--shadcn-green) / 0.3);\n    color:#fff;\n}\n\n.tm-toast--info{\n    background:hsla(var(--shadcn-blue) / 0.85);\n    border-color:hsla(var(--shadcn-blue) / 0.3);\n    color:#fff;\n}\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "465": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `.tm-video-overlay{\n    position:fixed;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    width:100vw;\n    height:100vh;\n    height:100dvh;\n    background-color:#0b0b0e;\n    z-index:2000000000 !important;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:flex-start;\n    backdrop-filter:blur(30px);\n    -webkit-backdrop-filter:blur(30px);\n    padding:0;\n    touch-action:none;\n    -webkit-user-select:none;\n    user-select:none;\n    -webkit-touch-callout:none;\n    overscroll-behavior:none;\n}\n.tm-player-container{\n    position:fixed;\n    top:0;\n    bottom:var(--keyboard-height, 0px);\n    left:0;\n    right:0;\n    width:100%;\n    height:calc(100% - var(--keyboard-height, 0px));\n    height:calc(100dvh - var(--keyboard-height, 0px));\n    background-color:#0b0b0e;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:flex-start;\n    z-index:2000000001 !important;\n    overflow:hidden;\n    pointer-events:auto;\n    transition:bottom 0.15s ease-out, height 0.15s ease-out;\n    touch-action:pan-y;\n    -webkit-user-select:none;\n    user-select:none;\n    -webkit-touch-callout:none;\n    overscroll-behavior:none;\n}\n.tm-button-container{\n    width:100%;\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    gap:10px;\n    padding:6px 10px;\n    box-sizing:border-box;\n    z-index:99999;\n    position:absolute;\n    top:0;\n    left:0;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n    touch-action:none;\n}\n\n.tm-video-container{\n    position:relative;\n    overflow:hidden;\n    width:100%;\n    height:auto;\n    max-height:calc(100% - 130px);\n    margin-top:44px;\n    display:flex;\n    align-items:flex-start;\n    justify-content:center;\n    background-color:hsl(var(--shadcn-card));\n    border-radius:var(--shadcn-radius-lg);\n    box-shadow:var(--shadow-lg);\n    z-index:9985;\n    touch-action:pan-y;\n    flex-shrink:1;\n    transition:max-height 0.15s ease-out;\n}\n\n@media screen and (orientation: portrait){\n    .tm-video-container{\n        max-height:calc(100dvh - var(--keyboard-height, 0px) - 130px) !important;\n        min-height:0 !important;\n    }\n}\n\n.tm-video-wrapper{\n    position:relative;\n    overflow:hidden;\n    width:100%;\n    height:100%;\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    will-change:transform;\n    border-radius:var(--shadcn-radius) var(--shadcn-radius) 0 0;\n    touch-action:pan-y;\n}\n.tm-video-wrapper > *:not(video):not(.tm-speed-indicator):not(.tm-video-minimap):not(.tm-inline-remark-popover){\n    display:none !important;\n    opacity:0 !important;\n    visibility:hidden !important;\n    pointer-events:none !important;\n}\n.tm-video-wrapper video > *:not(track):not(source){\n    display:none !important;\n    opacity:0 !important;\n    visibility:hidden !important;\n    pointer-events:none !important;\n}\n.tm-video-wrapper video{\n    width:auto !important; \n    height:100% !important; \n    max-height:100% !important; \n    max-width:none !important; \n    object-fit:contain !important; \n    transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n    touch-action:pan-y;\n    cursor:grab; \n}\n.tm-handle-container{\n    position:relative;\n    height:30px;\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    z-index:9986;\n    width:100%;\n    flex-shrink:0;\n    touch-action:none;\n}\n\n.tm-resize-handle{\n    position:absolute;\n    height:5px;\n    width:134px;\n    max-width:134px;\n    background-color:hsla(var(--shadcn-foreground) / 0.6);\n    border-radius:2.5px;\n    cursor:grab;\n    touch-action:none;\n    opacity:0.5;\n    will-change:transform;\n    transition:opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s;\n    box-shadow:none;\n}\n\n.tm-resize-handle::after{\n    content:'';\n    position:absolute;\n    left:-10px;\n    right:-10px;\n    top:-15px;\n    bottom:-15px;\n    background:transparent;\n}\n\n.tm-resize-handle:hover,\n.tm-resize-handle.dragging{\n    opacity:1;\n    background-color:hsla(var(--shadcn-foreground) / 0.8);\n}\n\n.tm-resize-handle.dragging{\n    cursor:grabbing;\n}\n.tm-control-button-base{\n    color:hsl(var(--shadcn-secondary-foreground));\n    border-radius:50%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s, box-shadow 0.2s;\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    box-shadow:var(--shadow-sm);\n}\n.tm-close-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;\n    z-index:9994;\n}\n.tm-close-button::after,\n.tm-settings-button::after,\n.tm-sidebar-pos-button::after,\n.tm-sidebar-toggle-button::after{\n    content:'';\n    position:absolute;\n    inset:-6px;\n    border-radius:50%;\n    pointer-events:auto;\n}\n\n.tm-close-button:hover{\n    background-color:hsl(var(--shadcn-destructive));\n    transform:scale(1.08);\n    box-shadow:var(--shadow-md);\n}\n\n.tm-close-button:active{\n    transform:scale(0.96);\n}\n.tm-settings-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    z-index:9993;\n    cursor:pointer;\n    transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    box-shadow:var(--shadow-sm);\n}\n\n.tm-settings-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.9);\n    transform:scale(1.08) rotate(30deg);\n    box-shadow:var(--shadow-md);\n}\n\n.tm-settings-button:active{\n    transform:scale(0.96);\n}\n.tm-settings-panel{\n    position:absolute;\n    top:calc(env(safe-area-inset-top, 8px) + 60px);\n    right:16px;\n    background-color:hsla(var(--shadcn-card) / 0.92);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    border-radius:14px;\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    box-shadow:0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px hsla(0, 0%, 100%, 0.05);\n    padding:14px 16px;\n    z-index:100000 !important;\n    min-width:275px;\n    max-width:325px;\n    max-height:calc(100dvh - env(safe-area-inset-top, 8px) - env(safe-area-inset-bottom, 8px) - 80px);\n    overflow-y:auto;\n    overflow-x:hidden;\n    -webkit-overflow-scrolling:touch;\n    overscroll-behavior:contain;\n    touch-action:pan-y;\n    scrollbar-width:thin;\n    scrollbar-color:hsla(var(--shadcn-muted-foreground) / 0.3) transparent;\n    transform:translateY(-10px);\n    opacity:0;\n    pointer-events:none;\n    transition:transform var(--anim-smooth), opacity var(--anim-smooth);\n    box-sizing:border-box;\n}\n\n.tm-settings-panel::-webkit-scrollbar{\n    width:4px;\n}\n\n.tm-settings-panel::-webkit-scrollbar-thumb{\n    background:hsla(var(--shadcn-muted-foreground) / 0.3);\n    border-radius:4px;\n}\n\n.tm-settings-panel.active{\n    transform:translateY(0);\n    opacity:1;\n    pointer-events:auto;\n}\n.tm-player-container.tm-settings-active .tm-comments-list,\n.tm-settings-panel.active ~ .tm-comments-panel .tm-comments-list,\nbody.tm-settings-active .tm-comments-panel .tm-comments-list{\n    opacity:0.15 !important;\n    filter:blur(3px) !important;\n    pointer-events:none !important;\n    transition:opacity var(--anim-smooth), filter var(--anim-smooth) !important;\n}\n@media screen and (max-width: 929px), screen and (orientation: portrait){\n    .tm-settings-panel{\n        right:12px !important;\n        left:12px !important;\n        width:calc(100% - 24px) !important;\n        max-width:calc(100% - 24px) !important;\n    }\n}\n.tm-settings-menu-container{\n    display:flex;\n    flex-direction:column;\n    gap:12px;\n    color:hsl(var(--shadcn-foreground));\n    user-select:none;\n    font-size:13.5px;\n}\n.tm-settings-section{\n    display:flex;\n    flex-direction:column;\n    gap:3px;\n}\n.tm-settings-section-header{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    font-size:11px;\n    font-weight:700;\n    color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    letter-spacing:0.8px;\n    text-transform:uppercase;\n    padding-left:2px;\n    user-select:none;\n}\n\n.tm-settings-section-header.collapsible{\n    cursor:pointer;\n    padding:2px 4px;\n    border-radius:4px;\n    transition:background 0.15s ease;\n}\n\n.tm-settings-section-header.collapsible:hover{\n    background:hsla(var(--shadcn-muted) / 0.2);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-settings-header-arrow{\n    font-size:10px;\n    transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.tm-settings-header-arrow.expanded{\n    transform:rotate(180deg);\n}\n.tm-settings-section-divider{\n    height:1px;\n    background:linear-gradient(90deg, hsla(var(--shadcn-border) / 0.3) 0%, hsla(var(--shadcn-border) / 0.05) 100%);\n    margin:3px 0 6px 0;\n    border-radius:1px;\n}\n.tm-settings-option-row{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    padding:6px 4px;\n    border-radius:8px;\n    cursor:pointer;\n    transition:background 0.15s ease;\n}\n\n.tm-settings-option-row:hover{\n    background-color:hsla(var(--shadcn-muted) / 0.3);\n}\n\n.tm-settings-label-wrapper{\n    display:flex;\n    align-items:center;\n    gap:8px;\n}\n\n.tm-settings-text-wrapper{\n    display:flex;\n    flex-direction:column;\n    gap:2px;\n}\n\n.tm-settings-label{\n    font-size:13.5px;\n    font-weight:500;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-settings-subtext{\n    font-size:11px;\n    font-weight:400;\n    color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    line-height:1.25;\n}\n.tm-settings-seek-steps-subpanel{\n    display:flex;\n    flex-wrap:nowrap;\n    gap:6px;\n    align-items:center;\n    overflow-x:auto;\n    overflow-y:hidden;\n    white-space:nowrap;\n    padding:6px 2px 4px 2px;\n    margin-top:2px;\n    scroll-behavior:smooth;\n    -webkit-overflow-scrolling:touch;\n    scrollbar-width:none;\n    -ms-overflow-style:none;\n}\n\n.tm-settings-seek-steps-subpanel::-webkit-scrollbar{\n    display:none;\n}\n.tm-settings-sources-subpanel{\n    display:flex;\n    flex-wrap:wrap;\n    gap:8px;\n    align-items:center;\n    justify-content:flex-start;\n    padding:6px 2px 2px 2px;\n    margin-top:2px;\n}\n.tm-seek-step-badge,\n.tm-source-badge{\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    font-size:11.5px;\n    font-weight:500;\n    padding:0 12px;\n    height:28px;\n    line-height:1;\n    border-radius:6px;\n    box-sizing:border-box;\n    border:1px solid transparent;\n    cursor:pointer;\n    user-select:none;\n    flex-shrink:0;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, box-shadow 0.15s;\n    -webkit-tap-highlight-color:transparent;\n}\n.tm-seek-step-badge.enabled,\n.tm-source-badge.enabled{\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    border-color:hsla(var(--shadcn-border) / 0.35);\n    color:#ffffff;\n    font-weight:600;\n    box-shadow:0 2px 5px rgba(0, 0, 0, 0.2);\n}\n.tm-seek-step-badge.disabled,\n.tm-source-badge.disabled{\n    background-color:hsla(var(--shadcn-secondary) / 0.15);\n    border-color:hsla(var(--shadcn-border) / 0.08);\n    color:hsla(var(--shadcn-muted-foreground) / 0.4);\n    font-weight:400;\n}\n.tm-seek-step-badge:hover,\n.tm-source-badge:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.7);\n    border-color:hsla(var(--shadcn-accent) / 0.9);\n    color:#ffffff;\n    transform:translateY(-1px);\n    box-shadow:0 4px 8px rgba(0, 0, 0, 0.25);\n}\n.tm-seek-step-badge:active,\n.tm-source-badge:active{\n    transform:scale(0.96);\n    box-shadow:none;\n}\n.tm-seek-step-add-btn{\n    font-size:14px;\n    font-weight:600;\n    width:32px;\n    height:28px;\n    border-radius:6px;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    border:1px dashed hsla(var(--shadcn-border) / 0.35);\n    color:hsla(var(--shadcn-foreground) / 0.75);\n    cursor:pointer;\n    flex-shrink:0;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, box-shadow 0.15s;\n}\n\n.tm-seek-step-add-btn:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.5);\n    border-style:solid;\n    border-color:hsla(var(--shadcn-accent) / 0.9);\n    color:#ffffff;\n    transform:translateY(-1px);\n    box-shadow:0 4px 8px rgba(0, 0, 0, 0.25);\n}\n\n.tm-seek-step-add-btn:active{\n    transform:scale(0.96);\n}\n.tm-seek-step-input{\n    width:60px;\n    height:28px;\n    font-size:16px;\n    font-weight:500;\n    text-align:center;\n    border-radius:6px;\n    border:1px solid hsla(var(--shadcn-accent) / 0.8);\n    background-color:hsla(var(--shadcn-background) / 0.85);\n    color:#ffffff;\n    outline:none;\n    box-sizing:border-box;\n    flex-shrink:0;\n    box-shadow:0 0 8px hsla(var(--shadcn-accent) / 0.4);\n}\n.tm-settings-sources-subpanel{\n    display:flex;\n    gap:8px;\n    padding:6px 2px 2px 2px;\n}\n\n.tm-source-badge{\n    font-size:11px;\n    padding:4px 10px;\n    border-radius:12px;\n    border:1px solid transparent;\n    cursor:pointer;\n    font-weight:500;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, color 0.15s;\n}\n\n.tm-source-badge.enabled{\n    background:rgba(239, 68, 68, 0.2);\n    border-color:rgba(239, 68, 68, 0.6);\n    color:#fca5a5;\n}\n\n.tm-source-badge.disabled{\n    background:rgba(255, 255, 255, 0.06);\n    border-color:rgba(255, 255, 255, 0.1);\n    color:rgba(255, 255, 255, 0.4);\n}\n.tm-settings-webdav-card{\n    display:flex;\n    flex-direction:column;\n    gap:10px;\n    background:hsla(var(--shadcn-card) / 0.45);\n    backdrop-filter:blur(16px);\n    -webkit-backdrop-filter:blur(16px);\n    border:1px solid hsla(var(--shadcn-border) / 0.25);\n    border-radius:10px;\n    padding:12px;\n    margin-top:4px;\n}\n\n.tm-webdav-form-row{\n    display:flex;\n    flex-direction:column;\n    gap:4px;\n}\n\n.tm-webdav-label{\n    font-size:11.5px;\n    font-weight:500;\n    color:hsla(var(--shadcn-muted-foreground) / 0.85);\n}\n\n.tm-webdav-input-group{\n    position:relative;\n    display:flex;\n    align-items:center;\n    width:100%;\n}\n\n.tm-webdav-input{\n    width:100%;\n    height:32px;\n    background:hsla(var(--shadcn-background) / 0.6);\n    border:1px solid hsla(var(--shadcn-border) / 0.3);\n    border-radius:6px;\n    padding:0 10px;\n    font-size:12.5px;\n    color:hsl(var(--shadcn-foreground));\n    box-sizing:border-box;\n    outline:none;\n    transition:border-color 0.2s, box-shadow 0.2s, background-color 0.2s;\n    font-family:inherit;\n}\n\n.tm-webdav-input-group .tm-webdav-input.has-eye{\n    padding-right:34px;\n}\n\n.tm-webdav-input:focus{\n    border-color:hsla(var(--shadcn-accent) / 0.8);\n    box-shadow:0 0 0 2px hsla(var(--shadcn-accent) / 0.2);\n    background:hsla(var(--shadcn-background) / 0.85);\n}\n\n.tm-webdav-input::placeholder{\n    color:hsla(var(--shadcn-muted-foreground) / 0.4);\n    font-size:11.5px;\n}\n\n.tm-webdav-eye-btn{\n    position:absolute;\n    right:4px;\n    top:50%;\n    transform:translateY(-50%);\n    width:26px;\n    height:26px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    background:transparent;\n    border:none;\n    border-radius:4px;\n    color:hsla(var(--shadcn-muted-foreground) / 0.6);\n    cursor:pointer;\n    padding:0;\n    transition:background-color 0.15s, color 0.15s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.tm-webdav-eye-btn::after{\n    content:'';\n    position:absolute;\n    inset:-6px;\n    border-radius:4px;\n    pointer-events:auto;\n}\n\n.tm-webdav-eye-btn:hover{\n    color:hsl(var(--shadcn-foreground));\n    background:hsla(var(--shadcn-muted) / 0.3);\n}\n\n.tm-webdav-eye-btn:active{\n    transform:translateY(-50%) scale(0.96);\n}\n\n.tm-webdav-switch-row{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    padding:8px 10px;\n    background:hsla(var(--shadcn-muted) / 0.18);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    border-radius:8px;\n    margin-top:2px;\n}\n\n.tm-webdav-switch-info{\n    display:flex;\n    flex-direction:column;\n    gap:2px;\n}\n\n.tm-webdav-switch-title{\n    font-size:12px;\n    font-weight:600;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-webdav-switch-desc{\n    font-size:10px;\n    color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    line-height:1.3;\n}\n\n.tm-webdav-device-badge{\n    display:inline-flex;\n    align-items:center;\n    gap:6px;\n    font-size:11px;\n    color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    padding:4px 8px;\n    background:hsla(var(--shadcn-muted) / 0.2);\n    border-radius:6px;\n    margin-top:2px;\n    word-break:break-all;\n}\n\n.tm-webdav-actions-container{\n    display:flex;\n    flex-direction:column;\n    gap:7px;\n    margin-top:6px;\n}\n\n.tm-webdav-sub-actions{\n    display:grid;\n    grid-template-columns:repeat(3, 1fr);\n    gap:6px;\n}\n\n.tm-webdav-btn{\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    gap:5px;\n    height:32px;\n    padding:0 8px 0 6px;\n    border-radius:6px;\n    font-size:11.5px;\n    font-weight:500;\n    cursor:pointer;\n    user-select:none;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, box-shadow 0.15s, filter 0.15s;\n    box-sizing:border-box;\n    border:1px solid transparent;\n    white-space:nowrap;\n    -webkit-tap-highlight-color:transparent;\n}\n\n.tm-webdav-btn svg{\n    width:13px;\n    height:13px;\n    flex-shrink:0;\n}\n\n.tm-webdav-btn-primary{\n    background:linear-gradient(135deg, hsl(var(--shadcn-primary)) 0%, hsl(var(--shadcn-accent)) 100%);\n    color:#fff;\n    border:none;\n    box-shadow:0 2px 8px hsla(var(--shadcn-primary) / 0.3);\n    width:100%;\n    height:36px;\n    font-size:13px;\n    font-weight:600;\n}\n\n.tm-webdav-btn-primary:hover{\n    filter:brightness(1.08);\n    box-shadow:0 4px 12px hsla(var(--shadcn-primary) / 0.4);\n}\n\n.tm-webdav-btn-secondary{\n    background:hsla(var(--shadcn-muted) / 0.35);\n    color:hsl(var(--shadcn-foreground));\n    border-color:hsla(var(--shadcn-border) / 0.25);\n}\n\n.tm-webdav-btn-secondary:hover{\n    background:hsla(var(--shadcn-muted) / 0.65);\n    border-color:hsla(var(--shadcn-border) / 0.45);\n}\n\n.tm-webdav-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-webdav-btn:disabled{\n    opacity:0.5;\n    cursor:not-allowed;\n    transform:none;\n}\n\n.tm-webdav-status-bar{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    font-size:10.5px;\n    color:hsla(var(--shadcn-muted-foreground) / 0.65);\n    padding:4px 2px 0 2px;\n    border-top:1px dashed hsla(var(--shadcn-border) / 0.2);\n    margin-top:4px;\n}\n\n.tm-webdav-status-badge{\n    display:inline-flex;\n    align-items:center;\n    gap:4px;\n    padding:2px 6px;\n    border-radius:4px;\n    font-size:10.5px;\n    font-weight:500;\n}\n\n.tm-webdav-status-badge.success{\n    background:rgba(34, 197, 94, 0.15);\n    color:#4ade80;\n}\n\n.tm-webdav-status-badge.error{\n    background:rgba(239, 68, 68, 0.15);\n    color:#f87171;\n}\n\n.tm-webdav-status-badge.running{\n    background:rgba(59, 130, 246, 0.15);\n    color:#60a5fa;\n}\n\n.tm-spinner-sm{\n    display:inline-block;\n    width:9px;\n    height:9px;\n    border:1.5px solid currentColor;\n    border-right-color:transparent;\n    border-radius:50%;\n    animation:tm-spin 0.75s linear infinite;\n}\n\n@keyframes tm-spin{\n    to{ transform:rotate(360deg); }\n}\n.tm-toggle-input{\n    position:absolute;\n    left:-9999px;\n}\n.tm-start-time-container.active{\n    background-color:hsl(var(--shadcn-green) / 0.15);\n    border-color:hsl(var(--shadcn-green) / 0.4);\n}\n\n.tm-start-time-container:not(.active){\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n.tm-end-time-container.active{\n    background-color:hsl(var(--shadcn-orange) / 0.15);\n    border-color:hsl(var(--shadcn-orange) / 0.4);\n}\n\n.tm-end-time-container:not(.active){\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n.tm-set-loop-start-label.active{\n    color:hsl(var(--shadcn-green));\n    opacity:1;\n}\n\n.tm-set-loop-start-label:not(.active){\n    opacity:0.9;\n}\n.tm-set-loop-end-label.active{\n    color:hsl(var(--shadcn-orange));\n    opacity:1;\n}\n\n.tm-set-loop-end-label:not(.active){\n    opacity:0.9;\n}\n.tm-loop-start-position.active, .tm-loop-end-position.active{\n    color:hsl(var(--shadcn-foreground));\n    opacity:1;\n}\n\n.tm-loop-start-position:not(.active), .tm-loop-end-position:not(.active){\n    color:hsl(var(--shadcn-muted-foreground));\n    opacity:0.9;\n}\n.tm-loop-toggle-button.active{\n    background-color:hsl(var(--shadcn-red) / 0.1);\n    border-color:hsl(var(--shadcn-red) / 0.3);\n}\n\n.tm-loop-toggle-button:active{\n    transform:scale(0.96);\n}\n.tm-loop-range{\n    position:absolute;\n    height:4px;\n    background:linear-gradient(90deg, \n        hsla(var(--shadcn-green) / 0.3) 0%, \n        hsla(var(--shadcn-orange) / 0.3) 100%);\n    top:50%;\n    transform:translateY(-50%);\n    border-radius:2px;\n    opacity:0;\n    transition:opacity 0.3s ease;\n    z-index:1;\n    pointer-events:none;\n}\n\n.tm-loop-range.active{\n    opacity:0.7;\n    box-shadow:0 0 8px rgba(0, 0, 0, 0.1);\n}\n.tm-progress-bar-container:hover .tm-loop-range.active{\n    opacity:0.9;\n    height:6px;\n}\n.tm-loop-marker{\n    position:absolute;\n    width:4px;\n    height:100%;\n    top:0;\n    transform:translateX(-50%);\n    z-index:3;\n    transition:opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),  transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);\n    backdrop-filter:blur(4px);\n    -webkit-backdrop-filter:blur(4px);\n}\n.tm-loop-start-marker{\n    background-color:hsla(var(--shadcn-green) / 0.5);\n    border-radius:2px;\n    box-shadow:0 0 6px hsla(var(--shadcn-green) / 0.3);\n}\n.tm-loop-end-marker{\n    background-color:hsla(var(--shadcn-orange) / 0.5);\n    border-radius:2px;\n    box-shadow:0 0 6px hsla(var(--shadcn-orange) / 0.3);\n}\n.tm-loop-marker:hover{\n    cursor:pointer;\n    z-index:4;\n}\n\n.tm-loop-start-marker:hover{\n    background-color:hsla(var(--shadcn-green) / 0.7);\n    box-shadow:0 0 10px hsla(var(--shadcn-green) / 0.5);\n}\n\n.tm-loop-end-marker:hover{\n    background-color:hsla(var(--shadcn-orange) / 0.7);\n    box-shadow:0 0 10px hsla(var(--shadcn-orange) / 0.5);\n}\n.tm-loop-marker.active{\n    opacity:1;\n}\n\n.tm-loop-marker:not(.active){\n    opacity:0.7;\n}\n.tm-loop-marker::before{\n    content:attr(data-label);\n    position:absolute;\n    top:-24px;\n    left:50%;\n    transform:translateX(-50%);\n    background-color:hsla(var(--shadcn-card) / 0.7);\n    color:hsl(var(--shadcn-card-foreground));\n    font-size:10px;\n    font-weight:600;\n    padding:2px 8px;\n    border-radius:10px;\n    opacity:0;\n    transition:opacity 0.2s ease, transform 0.2s ease;\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    white-space:nowrap;\n    z-index:5;\n}\n\n.tm-loop-marker:hover::before{\n    opacity:1;\n    transform:translateX(-50%) translateY(-4px);\n}\n.tm-start-time-container-hover{\n    background-color:hsl(var(--shadcn-green) / 0.1);\n    border-color:hsl(var(--shadcn-green) / 0.3);\n}\n\n.tm-start-time-container-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n\n.tm-end-time-container-hover{\n    background-color:hsl(var(--shadcn-orange) / 0.1);\n    border-color:hsl(var(--shadcn-orange) / 0.3);\n}\n\n.tm-end-time-container-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n.tm-loop-button-hover{\n    background-color:hsl(var(--shadcn-accent) / 0.3);\n    transform:translateY(-1px);\n}\n\n.tm-loop-button-active{\n    background-color:hsl(var(--shadcn-muted) / 0.7);\n}\n\n.tm-loop-button-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    transform:translateY(0);\n}\n.tm-indicator-base{\n    position:absolute;\n    padding:8px 16px;\n    background-color:hsla(var(--shadcn-card) / 0.6);\n    color:hsl(var(--shadcn-card-foreground));\n    border-radius:var(--shadcn-radius);\n    opacity:0;\n    backdrop-filter:blur(15px);\n    -webkit-backdrop-filter:blur(15px);\n    box-shadow:var(--shadow-md);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    transform:translateY(20px);\n    transition:opacity var(--anim-smooth), transform var(--anim-smooth);\n    pointer-events:none;\n    z-index:9994;\n    font-size:15px;\n    font-weight:500;\n}\n\n.tm-indicator-base.visible{\n    opacity:1;\n    transform:translateY(0);\n    pointer-events:auto;\n}\n.tm-pause-indicator{\n    width:80px;\n    height:80px;\n}\n.tm-progress-row{\n    display:flex;\n    flex-direction:column;\n    width:100%;\n    box-sizing:border-box;\n}\n\n.tm-seek-control-row{\n    display:flex;\n    flex-direction:row;\n    justify-content:space-between;\n    width:100%;\n    box-sizing:border-box;\n}\n\n.tm-loop-control-row{\n    display:flex;\n    align-items:center;\n    width:100%;\n    box-sizing:border-box;\n    position:relative;\n    gap:8px;\n}\n.tm-inline-remark-popover{\n    position:absolute;\n    bottom:calc(45px + 42px + 10px);\n    left:12px;\n    right:12px;\n    width:calc(100% - 24px);\n    margin:0 auto;\n    background:rgba(18, 18, 20, 0.96);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    border-radius:20px;\n    padding:12px;\n    box-shadow:0 10px 30px rgba(0, 0, 0, 0.7);\n    z-index:9998;\n    pointer-events:auto;\n    opacity:0;\n    transform:translateY(8px) scale(0.98);\n    transition:opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n    box-sizing:border-box;\n}\n\n.tm-inline-remark-popover.visible{\n    opacity:1;\n    transform:translateY(0) scale(1);\n}\n\n.tm-inline-remark-body{\n    display:flex;\n    flex-direction:column;\n    gap:10px;\n    width:100%;\n}\n\n.tm-inline-remark-input{\n    width:100%;\n    height:38px;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    border-radius:8px;\n    padding:0 14px;\n    color:#ffffff;\n    font-size:16px;\n    outline:none;\n    box-sizing:border-box;\n    transition:border-color 0.2s, background 0.2s;\n}\n\n.tm-inline-remark-input:focus{\n    border-color:rgba(255, 255, 255, 0.35);\n    background:rgba(255, 255, 255, 0.1);\n}\n\n.tm-inline-remark-input::placeholder{\n    color:rgba(255, 255, 255, 0.35);\n}\n\n.tm-inline-remark-footer{\n    display:flex;\n    justify-content:flex-end;\n    gap:10px;\n}\n\n.tm-inline-remark-btn{\n    height:32px;\n    padding:0 20px;\n    border-radius:12px;\n    font-size:0.82rem;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background-color 0.18s, transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n    box-sizing:border-box;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n}\n\n.tm-inline-remark-btn:active{\n    transform:scale(0.96);\n}\n\n.tm-inline-remark-btn.cancel{\n    background:rgba(255, 255, 255, 0.08);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    color:rgba(255, 255, 255, 0.8);\n}\n\n.tm-inline-remark-btn.cancel:hover{\n    background:rgba(255, 255, 255, 0.16);\n    color:#ffffff;\n}\n\n.tm-inline-remark-btn.submit{\n    background:hsl(var(--shadcn-blue));\n    border:none;\n    color:#ffffff;\n    box-shadow:0 4px 12px hsla(var(--shadcn-blue) / 0.4);\n}\n\n.tm-inline-remark-btn.submit:hover{\n    background:hsl(var(--shadcn-blue) / 0.9);\n    transform:scale(1.03);\n}\n\n.tm-inline-remark-btn.submit:active{\n    transform:scale(0.96);\n}\n\n.tm-playback-control-row{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    position:relative;\n    width:100%;\n    max-height:45px;\n    height:45px;\n    border-radius:8px;\n    box-sizing:border-box;\n}\n.tm-left-controls, .tm-center-controls, .tm-right-controls{\n    flex:1;\n    display:flex;\n    height:100%;\n    align-items:center;\n}\n\n.tm-left-controls{\n    justify-content:flex-start;\n}\n\n.tm-center-controls{\n    justify-content:center;\n}\n\n.tm-right-controls{\n    justify-content:flex-end;\n}\n.tm-time-display{\n    display:flex;\n    justify-content:space-between;\n    color:hsl(var(--shadcn-foreground) / 0.9);\n    font-size:12px;\n    margin-top:-2px;\n    font-variant-numeric:tabular-nums;\n    gap:8px;\n}\n\n.tm-time-display-container{\n    display:flex;\n    justify-content:space-between;\n    width:100%;\n    padding:0px 1px;\n    margin-bottom:6px;\n}\n\n.tm-current-time, .tm-total-duration{\n    color:hsla(var(--shadcn-foreground) / 0.55);\n    font-size:12px;\n    min-width:60px;\n    font-variant-numeric:tabular-nums;\n    font-weight:500;\n    line-height:1;\n}\n\n.tm-current-time{\n    text-align:left;\n}\n\n.tm-total-duration{\n    text-align:right;\n}\n.tm-tab-scroll-container{\n    display:flex;\n    flex:1;\n    gap:8px;\n    overflow-x:auto;\n    overflow-y:hidden;\n    overscroll-behavior:contain;\n    scroll-behavior:smooth;\n    -webkit-overflow-scrolling:touch;\n    scrollbar-width:none;\n    height:38px;\n    padding:0 44px 0 0;\n    margin:0;\n    box-sizing:border-box;\n    align-items:center;\n    mask-image:linear-gradient(to right, black calc(100% - 36px), transparent);\n    -webkit-mask-image:linear-gradient(to right, black calc(100% - 36px), transparent);\n    touch-action:pan-x;\n}\n.tm-tab-scroll-container::-webkit-scrollbar{ display:none; }\n.tm-tab-pill{\n    position:relative;\n    overflow:hidden;\n    display:flex;\n    align-items:center;\n    gap:4px;\n    height:38px;\n    padding:0 12px;\n    box-sizing:border-box;\n    border-radius:9999px;\n    background-color:hsla(0, 0%, 15%, 0.12);\n    border:1px solid hsla(0, 0%, 20%, 0.35);\n    color:hsl(var(--shadcn-foreground));\n    font-size:0.8rem;\n    font-variant-numeric:tabular-nums;\n    white-space:nowrap;\n    cursor:pointer;\n    flex-shrink:0;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, color 0.15s;\n    user-select:none;\n    -webkit-user-select:none;\n    -webkit-tap-highlight-color:transparent;\n    pointer-events:auto;\n}\n.tm-tab-pill{\n    background-color:hsla(var(--tab-color), 0.12);\n    border-color:hsla(var(--tab-color), 0.35);\n    color:hsl(var(--tab-color));\n}\n.tm-tab-pill:active{ transform:scale(0.96); }\n.tm-tab-pill.active{\n    background-color:hsla(var(--tab-color), 0.25);\n    border-color:hsla(var(--tab-color), 0.6);\n    color:hsl(var(--tab-color));\n}\n\n.tm-tab-time-text{\n    position:relative;\n    z-index:1;\n    display:inline-flex;\n    align-items:center;\n    white-space:nowrap;\n}\n\n.tm-tab-loop-overlay{\n    position:absolute;\n    left:50%;\n    top:50%;\n    transform:translate(-50%, -50%);\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    height:60%;\n    z-index:2;\n    pointer-events:none;\n    border:none;\n    background:none;\n    box-shadow:none;\n    padding:0;\n}\n\n.tm-tab-loop-overlay svg{\n    display:block;\n    height:100%;\n    width:auto;\n    color:#ffffff;\n    fill:#ffffff;\n    stroke:#ffffff;\n    stroke-width:0.8px;\n    stroke-linejoin:round;\n    filter:drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));\n}\n.tm-tab-pill.draft{\n    background-color:hsla(var(--tab-color), 0.08);\n    border-color:hsla(var(--tab-color), 0.45);\n    border-style:dashed;\n    gap:5px;\n    padding:0 8px;\n}\n.tm-tab-pill.draft.editing,\n.tm-tab-pill.draft:not(.placeholder){\n    background-color:hsla(var(--tab-color), 0.22);\n    border-color:hsla(var(--tab-color), 0.75);\n}\n.tm-tab-pill.draft .tm-draft-label{\n    font-weight:600;\n    font-size:11px;\n}\n.tm-tab-pill.draft .tm-draft-label.a{ color:#fff; }\n.tm-tab-pill.draft .tm-draft-label.b{ color:#fff; }\n.tm-tab-pill.draft .tm-draft-time{\n    color:#fff;\n    font-variant-numeric:tabular-nums;\n    font-size:11px;\n}\n.tm-tab-pill.draft .tm-draft-time.placeholder{\n    color:rgba(255, 255, 255, 0.3);\n}\n.tm-draft-action{\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    height:24px;\n    width:32px;\n    border-radius:6px;\n    border:none;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, color 0.15s;\n    -webkit-tap-highlight-color:transparent;\n    box-sizing:border-box;\n}\n.tm-draft-action:active{\n    transform:scale(0.96);\n}\n.tm-draft-action.save{\n    background-color:hsla(var(--tab-color), 0.18);\n    color:hsl(var(--tab-color));\n}\n.tm-draft-action.save:hover{\n    background-color:hsla(var(--tab-color), 0.28);\n}\n.tm-draft-action.cancel{\n    background-color:rgba(239, 68, 68, 0.15);\n    color:#ef4444;\n}\n.tm-draft-action.cancel:hover{\n    background-color:rgba(239, 68, 68, 0.25);\n}\n.tm-draft-action.edit-comment{\n    background-color:rgba(245, 158, 11, 0.15);\n    color:#f59e0b;\n}\n.tm-draft-action.edit-comment:hover{\n    background-color:rgba(245, 158, 11, 0.25);\n}\n.tm-tab-list-btn{\n    flex-shrink:0;\n    width:38px;\n    height:38px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    border-radius:50%;\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    color:hsl(var(--shadcn-foreground));\n    font-size:1.1rem;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s;\n    -webkit-tap-highlight-color:transparent;\n}\n.tm-tab-list-btn:active{ transform:scale(0.96); }\n.tm-tab-list-btn:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.8);\n    border-color:hsla(var(--shadcn-border) / 0.3);\n}\n.tm-bottom-sheet-overlay{\n    position:fixed;\n    inset:0;\n    background-color:transparent;\n    z-index:9990 !important;\n    opacity:0;\n    pointer-events:none;\n    transition:opacity var(--anim-smooth);\n\n    touch-action:none;\n    user-select:none;\n    -webkit-user-select:none;\n    overscroll-behavior:none;\n}\n.tm-bottom-sheet-overlay.visible{\n    opacity:1;\n    pointer-events:auto;\n}\n\n.tm-bottom-sheet-panel{\n    position:absolute;\n    bottom:0;\n    left:0;\n    right:0;\n    width:100%;\n    max-height:calc(100vh - 120px);\n    background-color:rgba(18, 18, 20, 0.94);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 32px rgba(0, 0, 0, 0.6);\n    border-radius:16px;\n    border:1px solid rgba(255, 255, 255, 0.1);\n    z-index:9995 !important;\n    opacity:0;\n    pointer-events:none;\n    transform:translateY(8px) scale(0.98);\n    transition:opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    display:flex;\n    flex-direction:column;\n    overflow:hidden;\n    box-sizing:border-box;\n    padding:10px 14px 12px;\n}\n.tm-bottom-sheet-panel.visible{\n    opacity:1;\n    pointer-events:auto;\n    transform:translateY(0) scale(1);\n}\n.tm-sheet-header{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    padding:2px 2px 6px 2px;\n    margin-bottom:6px;\n    border-bottom:1px solid rgba(255, 255, 255, 0.06);\n    flex-shrink:0;\n}\n\n.tm-bottom-sheet-title{\n    font-size:0.82rem;\n    font-weight:600;\n    color:rgba(255, 255, 255, 0.88);\n    letter-spacing:0.2px;\n}\n\n.tm-sheet-count-badge{\n    font-size:0.7rem;\n    color:rgba(255, 255, 255, 0.45);\n    background:rgba(255, 255, 255, 0.08);\n    padding:1px 6px;\n    border-radius:8px;\n}\n\n.tm-sheet-close-btn{\n    background:transparent;\n    border:none;\n    color:rgba(255, 255, 255, 0.45);\n    font-size:0.95rem;\n    cursor:pointer;\n    padding:0 4px;\n    border-radius:4px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    transition:color 0.2s;\n}\n.tm-sheet-close-btn:hover{\n    color:#ffffff;\n}\n.tm-bottom-sheet-list{\n    flex:1;\n    overflow-y:auto;\n    -webkit-overflow-scrolling:touch;\n    display:flex;\n    flex-direction:column;\n    gap:6px;\n    padding-right:2px;\n}\n.tm-bottom-sheet-list::-webkit-scrollbar{\n    width:4px;\n}\n.tm-bottom-sheet-list::-webkit-scrollbar-thumb{\n    background:rgba(255, 255, 255, 0.2);\n    border-radius:2px;\n}\n.tm-sheet-item{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    padding:2px 0;\n    background:transparent;\n    border:none;\n    height:32px;\n    box-sizing:border-box;\n}\n\n.tm-sheet-item-time-container{\n    display:flex;\n    align-items:center;\n    flex-shrink:0;\n    height:32px;\n}\n.tm-sheet-time-pill{\n    height:32px;\n    box-sizing:border-box;\n    padding:0 12px;\n    border-radius:16px;\n    background:hsla(var(--tab-color, 200 100% 55%), 0.15);\n    border:1px solid hsla(var(--tab-color, 200 100% 55%), 0.4);\n    color:#ffffff;\n    font-size:0.8rem;\n    font-family:inherit;\n    font-weight:500;\n    cursor:pointer;\n    white-space:nowrap;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    transition:transform 0.15s ease, background-color 0.2s;\n}\n.tm-sheet-time-pill:hover{\n    transform:scale(1.02);\n    background:hsla(var(--tab-color, 200 100% 55%), 0.28);\n}\n.tm-sheet-time-pill.interval{\n    position:relative;\n    overflow:hidden;\n    padding:0 10px;\n    gap:4px;\n}\n.tm-sheet-time-pill.interval .tm-time-part{\n    cursor:pointer;\n    padding:2px 4px;\n    border-radius:4px;\n    transition:background-color 0.15s, color 0.15s;\n}\n.tm-sheet-time-pill.interval .tm-time-part:hover{\n    background-color:rgba(255, 255, 255, 0.25);\n    color:#ffffff;\n}\n.tm-sheet-time-pill.interval .tm-time-sep{\n    opacity:0.6;\n    font-weight:400;\n    user-select:none;\n    padding:0 1px;\n}\n.tm-sheet-item-comment-input{\n    flex:1;\n    min-width:0;\n    height:32px;\n    box-sizing:border-box;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.1);\n    border-radius:8px;\n    padding:0 10px;\n    color:#ffffff;\n    font-size:16px;\n    outline:none;\n    display:inline-flex;\n    align-items:center;\n    transition:border-color 0.2s, background 0.2s;\n}\n.tm-sheet-item-comment-input:focus{\n    border-color:rgba(255, 255, 255, 0.3);\n    background:rgba(255, 255, 255, 0.1);\n}\n.tm-sheet-item-comment-input::placeholder{\n    color:rgba(255, 255, 255, 0.3);\n}\n.tm-sheet-delete-btn{\n    width:32px;\n    height:32px;\n    box-sizing:border-box;\n    border-radius:8px;\n    border:1px solid rgba(255, 60, 60, 0.25);\n    background:rgba(255, 60, 60, 0.12);\n    color:#ff5252;\n    font-size:0.85rem;\n    font-weight:bold;\n    cursor:pointer;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    flex-shrink:0;\n    transition:background 0.2s, transform 0.15s;\n}\n.tm-sheet-delete-btn:hover{\n    background:rgba(255, 60, 60, 0.28);\n    transform:scale(1.05);\n}\n\n.tm-bottom-sheet-empty{\n    padding:16px;\n    text-align:center;\n    font-size:0.82rem;\n    color:rgba(255, 255, 255, 0.35);\n}\n.tm-rewind-group, .tm-forward-group{\n    display:flex;\n    flex-direction:column;\n    width:50%;\n    gap:8px;\n    align-items:center;\n}\n\n.tm-rewind-buttons-container{\n    display:flex;\n    flex-direction:row-reverse;\n    flex-wrap:wrap;\n    width:100%;\n    justify-content:flex-end;\n    align-content:flex-start;\n    gap:6px;\n}\n\n.tm-forward-buttons-container{\n    display:flex;\n    flex-direction:row;\n    flex-wrap:wrap;\n    width:100%;\n    justify-content:flex-end;\n    align-content:flex-start;\n    gap:6px;\n}\n.tm-time-control-button{\n    background-color:hsla(var(--shadcn-secondary) / var(--btn-opacity, 0.5));\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsl(var(--shadcn-border) / 0.1);\n    border-radius:8px;\n    padding:0;\n    font-size:0.75rem;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, border-color 0.15s, box-shadow 0.15s;\n    white-space:nowrap;\n    font-weight:500;\n    box-shadow:0 1px 2px rgba(0,0,0,0.05);\n    width:var(--button-xl);\n    height:var(--button-lg);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    flex:0 0 auto;\n}\n\n.tm-time-control-button:hover{\n    background-color:hsla(var(--shadcn-secondary) / calc(var(--btn-opacity, 0.5) + 0.15));\n    border-color:hsla(var(--shadcn-border) / 0.3);\n    transform:translateY(-1.5px);\n    box-shadow:0 4px 8px rgba(0,0,0,0.2);\n}\n\n.tm-time-control-button:active{\n    transform:scale(0.96);\n    background-color:hsla(var(--shadcn-secondary) / calc(var(--btn-opacity, 0.5) + 0.25));\n    box-shadow:none;\n}\n\n.tm-time-control-button-active{\n    transform:scale(0.96);\n    box-shadow:none;\n}\n\n.tm-time-control-button-after-active{\n    transform:none;\n    box-shadow:0 2px 5px rgba(0, 0, 0, 0.15);\n}\n\n.tm-time-control-button-inner{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n}\n\n.tm-rewind-icon{\n    margin-right:-2px;\n}\n\n.tm-forward-icon{\n    margin-left:-2px;\n}\n\n.tm-time-text-margin-left{\n    margin-left:2px;\n}\n\n.tm-time-text-margin-right{\n    margin-right:2px;\n}\n.tm-control-button-hover{\n    background-color:hsl(var(--shadcn-accent) / 0.3);\n    transform:none;\n}\n\n.tm-control-button-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    transform:none;\n}\n.tm-control-buttons{\n    position:absolute;\n    bottom:calc(10px + env(safe-area-inset-bottom, 0px));\n    left:50%;\n    transform:translateX(-50%);\n    width:95%;\n    max-width:700px;\n    min-width:350px;\n    z-index:9997 !important;\n    padding:16px 16px 14px;\n    border-radius:16px;\n    background-color:rgba(10, 10, 10, 0.52);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.45);\n    border:none;\n    transition: opacity 0.3s ease,  transform 0.3s ease,  width 0.35s cubic-bezier(0.25, 1, 0.5, 1),  left 0.35s cubic-bezier(0.25, 1, 0.5, 1),  bottom 0.35s cubic-bezier(0.25, 1, 0.5, 1),  right 0.35s cubic-bezier(0.25, 1, 0.5, 1),  border-radius 0.3s ease;\n    gap:10px;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:center;\n    overflow:visible !important;\n    touch-action:none;\n}\n\n.tm-control-buttons.dragging{\n    transition:none !important;\n}\nbody.controls-hidden .tm-player-container .tm-control-buttons{\n    opacity:0;\n    transform:translateX(-50%) translateY(calc(100% + 30px));\n    pointer-events:none;\n}\nbody:not(.controls-hidden) .tm-player-container .tm-control-buttons{\n    opacity:1;\n    transform:translateX(-50%) translateY(0);\n    pointer-events:auto;\n}\nbody.controls-hidden .tm-player-container .tm-button-container{\n    opacity:0;\n    transform:translateY(-60px);\n    pointer-events:none;\n}\nbody:not(.controls-hidden) .tm-player-container .tm-button-container{\n    opacity:1;\n    transform:translateY(0);\n    pointer-events:auto;\n}\n.tm-control-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.6);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, box-shadow 0.15s;\n}\n\n.tm-control-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.7);\n    transform:translateY(-2px);\n    box-shadow:var(--shadow-sm);\n}\n\n.tm-control-button:active{\n    transform:scale(0.96);\n    box-shadow:none;\n}\n\n.tm-control-button.active{\n    background-color:hsla(var(--shadcn-blue) / 0.7);\n    color:hsl(var(--shadcn-blue-foreground));\n    box-shadow:0 0 0 2px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.tm-control-button svg,\n.tm-control-button img{\n    width:16px;\n    height:16px;\n}\n.tm-control-row{\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    gap:8px;\n    margin-top:4px;\n    opacity:1;\n    transition:opacity var(--anim-quick), height var(--anim-quick);\n    height:auto;\n    overflow:hidden;\n}\n\n.tm-control-row.hidden{\n    opacity:0;\n    height:0;\n    margin:0;\n}\n.tm-comment-row{\n    width:100%;\n    display:flex;\n    flex-direction:column;\n    margin-bottom:10px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.2);\n    padding-bottom:10px;\n}\n\n.tm-comment-container{\n    width:100%;\n    min-height:60px;\n    display:flex;\n    flex-direction:column;\n    gap:8px;\n}\n\n.tm-comment-header{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    font-size:14px;\n    font-weight:500;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-comment-left{\n    display:flex;\n    align-items:center;\n}\n\n.tm-comment-title{\n    margin-right:5px;\n}\n\n.tm-comment-count{\n    color:hsl(var(--shadcn-muted-foreground));\n    font-size:12px;\n}\n\n.tm-comment-actions{\n    display:flex;\n    gap:8px;\n}\n\n.tm-comment-button{\n    border:none;\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border-radius:4px;\n    padding:4px 8px;\n    font-size:12px;\n    cursor:pointer;\n    transition:transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s;\n}\n\n.tm-comment-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.6);\n    transform:translateY(-1px);\n}\n\n.tm-comment-button:active{\n    transform:scale(0.96);\n}\n\n.tm-comment-write{\n    background-color:hsla(var(--shadcn-blue) / 0.7);\n    color:hsl(var(--shadcn-blue-foreground));\n}\n\n.tm-comment-write:hover{\n    background-color:hsla(var(--shadcn-blue) / 0.8);\n}\n\n.tm-comment-placeholder{\n    width:100%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    padding:10px;\n    color:hsl(var(--shadcn-muted-foreground));\n    font-size:13px;\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    border-radius:6px;\n}\n@media screen and (orientation: landscape){\n    .tm-comment-container{\n        min-height:50px;\n    }\n    \n    .tm-comment-placeholder{\n        padding:8px;\n    }\n}\n\n.tm-player-title{\n    position:absolute !important;\n    top:calc(env(safe-area-inset-top, 0px) + 12px) !important;\n    left:50% !important;\n    transform:translateX(-50%) !important;\n    max-width:calc(100% - 110px) !important;\n    text-align:center;\n    font-size:14px;\n    font-weight:600;\n    color:#ffffff;\n    white-space:nowrap;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    user-select:none;\n    z-index:9998 !important;\n    text-shadow:0 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5) !important;\n    pointer-events:none !important;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important;\n}\n\nbody.controls-hidden .tm-player-title{\n    opacity:0 !important;\n    transform:translate(-50%, -20px) !important;\n    pointer-events:none !important;\n}\nbody.tm-swiping-down .tm-button-container,\nbody.tm-swiping-down .tm-handle-container,\nbody.tm-swiping-down .tm-comments-panel,\nbody.tm-swiping-down .tm-control-buttons,\nbody.tm-swiping-down .tm-settings-panel{\n    opacity:0 !important;\n    pointer-events:none !important;\n    transition:opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;\n}\n.tm-jump-active{\n    position:absolute;\n    width:4px;\n    height:100%;\n    top:0;\n    transform:translateX(-50%);\n    z-index:5;\n    background-color:hsla(var(--shadcn-green) / 0.8);\n    border-radius:2px;\n    box-shadow:0 0 8px hsla(var(--shadcn-green) / 0.5);\n    pointer-events:none;\n    animation:tm-jump-flash-fade 3.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;\n}\n\n@keyframes tm-jump-flash-fade{\n    0%, 20%, 40%, 60%, 80%{\n        opacity:1;\n        background-color:hsl(var(--shadcn-green));\n        box-shadow:0 0 16px 4px hsl(var(--shadcn-green));\n        transform:translateX(-50%) scaleX(1.6);\n    }\n    10%, 30%, 50%, 70%{\n        opacity:0.3;\n        background-color:hsla(var(--shadcn-green) / 0.4);\n        box-shadow:0 0 4px hsla(var(--shadcn-green) / 0.2);\n        transform:translateX(-50%) scaleX(1.0);\n    }\n    90%{\n        opacity:0.5;\n        background-color:hsla(var(--shadcn-green) / 0.5);\n        box-shadow:0 0 6px hsla(var(--shadcn-green) / 0.3);\n        transform:translateX(-50%) scaleX(0.8);\n    }\n    100%{\n        opacity:0;\n        background-color:transparent;\n        box-shadow:none;\n        transform:translateX(-50%) scaleX(0);\n    }\n}\n.tm-sidebar-pos-button,\n.tm-sidebar-toggle-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    display:none !important;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s;\n}\n\n.tm-sidebar-pos-button:hover,\n.tm-sidebar-toggle-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.9);\n    transform:scale(1.08);\n}\n\n.tm-sidebar-pos-button:active,\n.tm-sidebar-toggle-button:active{\n    transform:scale(0.96);\n}\n.tm-sidebar-hidden .tm-sidebar-pos-button{\n    display:none !important;\n}\n@media screen and (min-width: 480px) and (orientation: portrait){\n    .tm-control-buttons{\n        max-width:520px;\n    }\n}\n\n@media screen and (min-width: 768px) and (orientation: portrait){\n    .tm-control-buttons{\n        max-width:640px;\n    }\n    .tm-comments-panel{\n        max-width:720px;\n        margin:0 auto;\n        border-left:1px solid hsla(var(--shadcn-border) / 0.1);\n        border-right:1px solid hsla(var(--shadcn-border) / 0.1);\n        box-shadow:0 4px 20px rgba(0, 0, 0, 0.08);\n        background-color:hsla(var(--shadcn-card) / 0.02);\n    }\n}\nhtml.tm-player-active,\nbody.tm-player-active{\n    overscroll-behavior:none !important;\n}\n\nbody.tm-player-active header,\nbody.tm-player-active .header,\nbody.tm-player-active navbar,\nbody.tm-player-active .navbar,\nbody.tm-player-active #header-top,\nbody.tm-player-active .top-nav,\nbody.tm-player-active [class*="header--sticky"],\nbody.tm-player-active [class*="navbar-fixed"]{\n    display:none !important;\n}\n\n.tm-progress-markers-container{\n    position:absolute;\n    top:0;\n    left:0;\n    width:100%;\n    height:100%;\n    pointer-events:none;\n    z-index:5;\n}\n.tm-progress-marker-tick{\n    position:absolute;\n    width:6px;\n    height:3px;\n    bottom:-4px;\n    transform:translateX(-50%);\n    background-color:hsla(var(--tab-color), 0.25);\n    border-radius:1.5px;\n    cursor:pointer;\n    z-index:10;\n    pointer-events:auto;\n    transition:transform 0.15s, background-color 0.15s, height 0.15s, bottom 0.15s;\n}\n.tm-progress-marker-tick:hover{\n    height:4px;\n    bottom:-5px;\n    background-color:hsla(var(--tab-color), 0.45);\n    transform:translateX(-50%) scale(1.1);\n}\n.tm-progress-marker-range{\n    position:absolute;\n    height:3px;\n    bottom:-4px;\n    background-color:hsla(var(--tab-color), 0.25);\n    border-radius:1.5px;\n    cursor:pointer;\n    z-index:9;\n    pointer-events:auto;\n    transition:background-color 0.15s, height 0.15s, bottom 0.15s;\n}\n.tm-progress-marker-range:hover{\n    height:4px;\n    bottom:-5px;\n    background-color:hsla(var(--tab-color), 0.45);\n}\n\n.tm-active-loop-played{\n    position:absolute;\n    height:100%;\n    top:0;\n    background-color:hsla(var(--tab-color), 0.45);\n    z-index:8;\n    pointer-events:none;\n    box-shadow:0 0 4px hsla(var(--tab-color), 0.15);\n}\n\n.tm-active-loop-unplayed{\n    position:absolute;\n    height:100%;\n    top:0;\n    background-color:hsla(var(--tab-color), 0.15);\n    z-index:7;\n    pointer-events:none;\n}\n\n.tm-active-loop-boundary{\n    position:absolute;\n    width:4px;\n    height:100%;\n    top:0;\n    transform:translateX(-50%);\n    background-color:hsla(var(--tab-color), 0.75);\n    z-index:9;\n    pointer-events:none;\n    box-shadow:0 0 3px rgba(0, 0, 0, 0.3);\n}\n.tm-active-loop-boundary.start{\n    border-radius:2px 0 0 2px;\n}\n.tm-active-loop-boundary.end{\n    border-radius:0 2px 2px 0;\n}\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "479": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `:root{\n    --brand-pink:rgb(254, 98, 142);\n    --brand-pink-rgb:254, 98, 142;\n    --shadcn-background:0 0% 0%;\n    --shadcn-foreground:0 0% 100%;\n    --shadcn-card:0 0% 5%;\n    --shadcn-card-foreground:0 0% 95%;\n    --shadcn-popover:0 0% 10%;\n    --shadcn-popover-foreground:0 0% 95%;\n    --shadcn-primary:210 10% 90%;\n    --shadcn-primary-foreground:210 20% 10%;\n    --shadcn-secondary:0 0% 15%;\n    --shadcn-secondary-foreground:0 0% 95%;\n    --shadcn-muted:0 0% 30%;\n    --shadcn-muted-foreground:0 0% 70%;\n    --shadcn-accent:212 40% 30%;\n    --shadcn-accent-foreground:0 0% 95%;\n    --shadcn-destructive:0 50% 40%;\n    --shadcn-destructive-foreground:0 0% 95%;\n    --shadcn-border:0 0% 30%;\n    --shadcn-input:0 0% 15%;\n    --shadcn-ring:212 70% 45%;\n    --shadcn-green:142 50% 45%;\n    --shadcn-green-foreground:0 0% 95%;\n    --shadcn-blue:211 70% 55%;\n    --shadcn-blue-foreground:0 0% 95%;\n    --shadcn-red:0 60% 50%;\n    --shadcn-red-foreground:0 0% 95%;\n    --shadcn-orange:25 80% 50%;\n    --shadcn-orange-foreground:0 0% 95%;\n    --shadcn-purple:262 60% 60%;\n    --shadcn-purple-foreground:0 0% 95%;\n    --shadcn-radius:0.5rem;\n    --shadcn-radius-sm:0.3rem;\n    --shadcn-radius-lg:0.8rem;\n    --button-sm:20px;\n    --button-md:32px;\n    --button-lg:40px;\n    --button-xl:48px;\n    --anim-quick:0.2s cubic-bezier(0.4, 0, 0.2, 1);\n    --anim-smooth:0.3s cubic-bezier(0.16, 1, 0.3, 1);\n    --anim-bounce:0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n    --shadow-sm:0 2px 5px rgba(0, 0, 0, 0.2);\n    --shadow-md:0 4px 10px rgba(0, 0, 0, 0.25);\n    --shadow-lg:0 8px 20px rgba(0, 0, 0, 0.3);\n    --font-sans:"SF Pro Display", "SF Pro", "Segoe UI", "Microsoft YaHei", "微软雅黑", "PingFang SC", "苹方", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n}\nhtml, body, button, input, select, textarea{\n    font-family:var(--font-sans);\n    -webkit-font-smoothing:antialiased;\n    -moz-osx-font-smoothing:grayscale;\n}\n*, *::before, *::after{\n    font-family:inherit;\n    -webkit-font-smoothing:antialiased;\n    -moz-osx-font-smoothing:grayscale;\n}\n\n.tm-video-overlay *{\n    font-family:var(--font-sans);\n}\n@media screen and (max-width: 1024px), (pointer: coarse){\n    input[type="text"],\n    input[type="number"],\n    input[type="search"],\n    input[type="password"],\n    input[type="email"],\n    textarea,\n    select,\n    .tm-comment-text-input,\n    .tm-comment-input-textarea,\n    .tm-tag-remark-input,\n    .tm-sheet-item-comment-input,\n    .tm-inline-remark-input,\n    .tm-seek-step-input,\n    .tm-floating-panel-input{\n        font-size:16px !important;\n    }\n}\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "540": module => {
      function insertStyleElement(options) {
        var element = document.createElement("style");
        options.setAttributes(element, options.attributes);
        options.insert(element, options.options);
        return element;
      }
      module.exports = insertStyleElement;
    },
    "601": module => {
      module.exports = function(i) {
        return i[1];
      };
    },
    "645": (__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.r(__webpack_exports__);
      __webpack_require__.d(__webpack_exports__, {
        "SITE_DOMAINS": () => SITE_DOMAINS,
        "checkSiteReachability": () => checkSiteReachability,
        "getAllSiteDomains": () => getAllSiteDomains,
        "getSiteDomains": () => getSiteDomains,
        "getSiteUrls": () => getSiteUrls,
        "isSiteDomain": () => isSiteDomain
      });
      const SITE_DOMAINS = {
        "MISSAV": {
          "primary": "missav.ai",
          "backups": [ "missav.ws" ]
        },
        "JABLE": {
          "primary": "jable.tv",
          "backups": [ "fs1.app" ]
        },
        "JAVLIBRARY": {
          "primary": "c97k.com",
          "backups": [ "javlib.com" ],
          "aliases": [ "javlibrary.com", "www.javlibrary.com", "www.javlib.com", "www.c97k.com" ]
        },
        "JAVDB": {
          "primary": "javdb.com",
          "backups": [ "javdb36.com" ],
          "aliases": [ "javdb.com", "www.javdb.com", "javdb.net" ]
        }
      };
      function getSiteDomains(siteKey) {
        const config = SITE_DOMAINS[siteKey];
        if (!config) {
          return [];
        }
        return [ config.primary, ...config.backups || [] ];
      }
      function getAllSiteDomains(siteKey) {
        const config = SITE_DOMAINS[siteKey];
        if (!config) {
          return [];
        }
        return [ config.primary, ...config.backups || [], ...config.aliases || [] ];
      }
      function getSiteUrls(siteKey) {
        return getSiteDomains(siteKey).map((d => `https://${d}`));
      }
      function isSiteDomain(siteKey) {
        let hostname = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : window.location.hostname;
        const domains = getAllSiteDomains(siteKey);
        return domains.some((domain => hostname.includes(domain)));
      }
      const reachabilityCache = new Map;
      async function checkSiteReachability(siteKey) {
        let forceRecalc = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        if (!forceRecalc && reachabilityCache.has(siteKey)) {
          return reachabilityCache.get(siteKey);
        }
        const domains = getSiteDomains(siteKey);
        if (domains.length === 0) {
          return false;
        }
        const primaryDomain = domains[0];
        const isReachable = await new Promise((resolve => {
          if (typeof GM_xmlhttpRequest !== "function") {
            fetch(`https://${primaryDomain}/favicon.ico`, {
              "method": "HEAD",
              "mode": "no-cors"
            }).then((() => resolve(true))).catch((() => resolve(false)));
            return;
          }
          let completed = false;
          const safeResolve = val => {
            if (!completed) {
              completed = true;
              clearTimeout(timer);
              resolve(val);
            }
          };
          const timer = setTimeout((() => {
            if (!completed) {
              completed = true;
              if (req && typeof req.abort === "function") {
                try {
                  req.abort();
                } catch (e) {}
              }
              resolve(false);
            }
          }), 4e3);
          const req = GM_xmlhttpRequest({
            "method": "HEAD",
            "url": `https://${primaryDomain}/favicon.ico`,
            "timeout": 4e3,
            "onload"(res) {
              safeResolve(res.status > 0);
            },
            "onerror"() {
              safeResolve(false);
            },
            "ontimeout"() {
              safeResolve(false);
            }
          });
        }));
        reachabilityCache.set(siteKey, isReachable);
        return isReachable;
      }
    },
    "659": module => {
      var memo = {};
      function getTarget(target) {
        if (typeof memo[target] === "undefined") {
          var styleTarget = document.querySelector(target);
          if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
            try {
              styleTarget = styleTarget.contentDocument.head;
            } catch (e) {
              styleTarget = null;
            }
          }
          memo[target] = styleTarget;
        }
        return memo[target];
      }
      function insertBySelector(insert, style) {
        var target = getTarget(insert);
        if (!target) {
          throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
        }
        target.appendChild(style);
      }
      module.exports = insertBySelector;
    },
    "703": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_variables_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(479);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_common_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(401);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_player_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(465);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_controls_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(140);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_comments_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(12);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_landscape_legacy_css__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(725);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_landscape_pc_css__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(919);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_variables_css__WEBPACK_IMPORTED_MODULE_2__.A);
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_common_css__WEBPACK_IMPORTED_MODULE_3__.A);
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_player_css__WEBPACK_IMPORTED_MODULE_4__.A);
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_controls_css__WEBPACK_IMPORTED_MODULE_5__.A);
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_comments_css__WEBPACK_IMPORTED_MODULE_6__.A);
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_landscape_legacy_css__WEBPACK_IMPORTED_MODULE_7__.A);
      ___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_styles_landscape_pc_css__WEBPACK_IMPORTED_MODULE_8__.A);
      ___CSS_LOADER_EXPORT___.push([ module.id, `\n\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "725": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `@media screen and (max-width: 929px) and (orientation: landscape){\n    .tm-video-container{\n        width:100% !important;\n        height:100vh !important;\n        max-height:100vh !important;\n        min-height:auto !important;\n        margin:0 !important;\n        padding:0 !important;\n        border-radius:0 !important;\n        box-shadow:none !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        background-color:black !important;\n    }\n    .tm-video-wrapper{\n        position:relative !important;\n        width:100% !important;\n        height:100% !important;\n        border-radius:0 !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        overflow:hidden !important;\n    }\n    .tm-video-wrapper video{\n        width:100% !important;\n        height:auto !important;\n        max-height:100vh !important;\n        object-fit:contain !important;\n    }\n    .tm-video-wrapper.video-portrait video{\n        width:auto !important;\n        height:100% !important;\n        max-width:100% !important;\n    }\n    .tm-button-container{\n        position:absolute;\n        top:0;\n        left:0;\n        right:0;\n        z-index:9995;\n        background-color:transparent;\n        padding:16px;\n        padding-top:calc(env(safe-area-inset-top, 8px) + 8px);\n        padding-left:calc(env(safe-area-inset-left, 16px) + 16px);\n        padding-right:calc(env(safe-area-inset-right, 16px) + 16px);\n        display:flex;\n        justify-content:space-between;\n        transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n    }\n    .tm-video-overlay.controls-hidden .tm-button-container{\n        opacity:0;\n        transform:translateY(-60px);\n        pointer-events:none;\n    }\n    .tm-video-overlay .tm-button-container{\n        opacity:1;\n        transform:translateY(0);\n        pointer-events:auto;\n    }\n    .tm-settings-button{\n        display:flex;\n        background-color:hsla(var(--shadcn-secondary) / 0.3);\n        backdrop-filter:blur(4px);\n        -webkit-backdrop-filter:blur(4px);\n    }\n    .tm-close-button{\n        background-color:hsla(var(--shadcn-secondary) / 0.3);\n        backdrop-filter:blur(4px);\n        -webkit-backdrop-filter:blur(4px);\n    }\n    .tm-control-buttons{\n        position:absolute;\n        bottom:calc(10px + env(safe-area-inset-bottom, 0px));\n        left:50%;\n        transform:translateX(-50%);\n        width:90%;\n        max-width:700px;\n        min-width:350px;\n        background-color:transparent;\n        backdrop-filter:none;\n        -webkit-backdrop-filter:none;\n        z-index:9994;\n        padding:16px 16px 14px;\n        border-radius:16px;\n        border:none;\n        box-shadow:none;\n        transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n    }\n    .tm-video-overlay.controls-hidden .tm-control-buttons{\n        opacity:0;\n        transform:translateX(-50%) translateY(calc(100% + 30px));\n        pointer-events:none;\n    }\n    .tm-video-overlay .tm-control-buttons{\n        opacity:1;\n        transform:translateX(-50%) translateY(0);\n        pointer-events:auto;\n    }\n    .tm-video-overlay{\n        background-color:black;\n        backdrop-filter:none;\n        -webkit-backdrop-filter:none;\n    }\n    .tm-floating-button{\n        bottom:30px;\n        left:50%;\n        transform:translateX(-50%);\n        padding:0;\n        width:calc(var(--button-xl));\n        height:calc(var(--button-xl));\n    }\n    .tm-handle-container{\n        display:none !important;\n    }\n}\n@media screen and (orientation: landscape) and (max-height: 480px){\n    .tm-control-buttons{\n        padding:6px 12px !important;\n        gap:6px !important;\n    }\n    .tm-control-buttons .tm-seek-control-row,\n    .tm-control-buttons .tm-loop-control-row,\n    .tm-control-buttons .tm-playback-control-row{\n        gap:6px !important;\n    }\n    .tm-control-buttons .tm-tab-pill{\n        padding:3px 8px !important;\n        font-size:0.75rem !important;\n    }\n}\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "825": module => {
      function apply(styleElement, options, obj) {
        var css = "";
        if (obj.supports) {
          css += "@supports (".concat(obj.supports, ") {");
        }
        if (obj.media) {
          css += "@media ".concat(obj.media, " {");
        }
        var needLayer = typeof obj.layer !== "undefined";
        if (needLayer) {
          css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
        }
        css += obj.css;
        if (needLayer) {
          css += "}";
        }
        if (obj.media) {
          css += "}";
        }
        if (obj.supports) {
          css += "}";
        }
        var sourceMap = obj.sourceMap;
        if (sourceMap && typeof btoa !== "undefined") {
          css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
        }
        options.styleTagTransform(css, styleElement, options.options);
      }
      function removeStyleElement(styleElement) {
        if (styleElement.parentNode === null) {
          return false;
        }
        styleElement.parentNode.removeChild(styleElement);
      }
      function domAPI(options) {
        if (typeof document === "undefined") {
          return {
            "update": function update() {},
            "remove": function remove() {}
          };
        }
        var styleElement = options.insertStyleElement(options);
        return {
          "update": function update(obj) {
            apply(styleElement, options, obj);
          },
          "remove": function remove() {
            removeStyleElement(styleElement);
          }
        };
      }
      module.exports = domAPI;
    },
    "919": (module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.d(__webpack_exports__, {
        "A": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
      var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
      var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
      var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
      ___CSS_LOADER_EXPORT___.push([ module.id, `.tm-control-drag-handle{\n    display:none;\n    width:100%;\n    height:14px;\n    justify-content:center;\n    align-items:center;\n    cursor:grab;\n    user-select:none;\n    margin-bottom:2px;\n    position:relative;\n}\n\n.tm-control-drag-handle:active{\n    cursor:grabbing;\n}\n\n.tm-control-drag-handle::before{\n    content:"";\n    width:36px;\n    height:4px;\n    background-color:hsla(var(--shadcn-foreground) / 0.3);\n    border-radius:2px;\n    transition:background-color 0.2s ease;\n}\n\n.tm-control-drag-handle:hover::before{\n    background-color:hsla(var(--shadcn-foreground) / 0.6);\n}\n:root{\n    --sidebar-width:clamp(350px, 28vw, 420px);\n}\n@media screen and (orientation: landscape){\n    :root{\n        --sidebar-width:clamp(350px, 28vw, 420px);\n    }\n}\n@media screen and (min-width: 1440px) and (orientation: landscape){\n    :root{\n        --sidebar-width:clamp(380px, 22vw, 560px);\n    }\n}\n@media screen and (orientation: landscape){\n    .tm-player-container{\n        display:grid !important;\n        grid-template-columns:1fr var(--sidebar-width) !important;\n        grid-template-rows:minmax(0, 1fr) !important;\n        grid-template-areas:"video sidebar" !important;\n        height:100% !important;\n        height:100dvh !important;\n        max-height:100dvh !important;\n        width:100vw !important;\n        overflow:hidden !important;\n        background-color:#000 !important;\n        position:fixed !important;\n        top:0 !important;\n        bottom:0 !important;\n        left:0 !important;\n        right:0 !important;\n        z-index:2000000001 !important;\n    }\n    .tm-comments-panel .tm-button-container{\n        grid-area:auto !important;\n        position:relative !important;\n        width:100% !important;\n        height:44px !important;\n        padding:0 16px !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:space-between !important;\n        background-color:transparent !important;\n        border-bottom:1px solid hsla(var(--shadcn-border) / 0.1) !important;\n        backdrop-filter:none !important;\n        -webkit-backdrop-filter:none !important;\n        box-shadow:none !important;\n        z-index:10000 !important;\n        transform:none !important;\n        opacity:1 !important;\n        pointer-events:auto !important;\n        box-sizing:border-box !important;\n    }\n    .tm-player-container.tm-sidebar-hidden .tm-button-container{\n        position:fixed !important;\n        top:16px !important;\n        left:16px !important;\n        right:16px !important;\n        width:calc(100% - 32px) !important;\n        height:44px !important;\n        padding:0 !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:flex-start !important;\n        gap:8px !important;\n        background:transparent !important;\n        border:none !important;\n        box-shadow:none !important;\n        backdrop-filter:none !important;\n        -webkit-backdrop-filter:none !important;\n        z-index:10000 !important;\n        transform:none !important;\n        opacity:1 !important;\n        pointer-events:none !important;\n    }\n\n    .tm-player-container.tm-sidebar-hidden .tm-button-container > *{\n        pointer-events:auto !important;\n        background-color:hsla(var(--shadcn-card) / 0.8) !important;\n        border:1px solid hsla(var(--shadcn-border) / 0.2) !important;\n        box-shadow:0 2px 8px rgba(0, 0, 0, 0.3) !important;\n        border-radius:50% !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:center !important;\n        width:var(--button-md) !important;\n        height:var(--button-md) !important;\n    }\n    .tm-player-container.tm-sidebar-hidden:not(.tm-sidebar-left) .tm-sidebar-toggle-button{\n        margin-left:auto !important;\n    }\n    .tm-player-container.tm-sidebar-hidden.tm-sidebar-left .tm-close-button{\n        margin-left:auto !important;\n    }\n    .tm-video-container{\n        grid-area:video;\n        width:100% !important;\n        height:100% !important;\n        max-height:none !important;\n        margin-top:0 !important;\n        border-radius:0 !important;\n        box-shadow:none !important;\n        background-color:#000 !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        padding:0 !important;\n        overflow:hidden !important;\n    }\n    .tm-video-wrapper{\n        position:relative !important;\n        width:100% !important;\n        height:100% !important;\n        border-radius:0 !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        overflow:hidden !important;\n    }\n    .tm-video-minimap{\n        bottom:calc(36px + env(safe-area-inset-bottom, 0px)) !important;\n        left:calc(24px + env(safe-area-inset-left, 0px)) !important;\n    }\n    .tm-video-wrapper video{\n        width:auto !important;\n        height:100% !important;\n        max-height:100% !important;\n        max-width:none !important;\n        min-width:0 !important;\n        flex-shrink:0 !important;\n        object-fit:contain !important;\n    }\n    .tm-video-wrapper.video-portrait video{\n        width:auto !important;\n        height:100% !important;\n        max-width:100% !important;\n    }\n    .tm-comments-panel{\n        display:flex !important;\n        grid-area:sidebar;\n        position:relative !important;\n        width:100% !important;\n        min-width:var(--sidebar-width) !important;\n        max-width:var(--sidebar-width) !important;\n        height:100% !important;\n        max-height:100% !important;\n        min-height:0 !important;\n        background-color:hsla(var(--shadcn-card) / 0.95) !important;\n        border-left:1px solid hsla(var(--shadcn-border) / 0.15) !important;\n        backdrop-filter:blur(20px) !important;\n        -webkit-backdrop-filter:blur(20px) !important;\n        box-sizing:border-box !important;\n        z-index:9990 !important;\n        pointer-events:auto !important;\n        flex-direction:column !important;\n        overflow:hidden !important;\n        visibility:visible !important;\n        opacity:1 !important;\n    }\n    .tm-comments-panel::after{\n        display:none !important;\n    }\n    .tm-comments-panel-list.tm-comments-list{\n        flex:1 1 0% !important;\n        height:0 !important;\n        min-height:0 !important;\n        max-height:100% !important;\n        width:100% !important;\n        display:flex !important;\n        flex-direction:column !important;\n        overflow-y:auto !important;\n        box-sizing:border-box !important;\n        padding:8px 16px 0px 16px !important;\n        pointer-events:auto !important;\n    }\n\n    .tm-comment-section{\n        min-height:0 !important;\n        flex-shrink:1 !important;\n        display:flex !important;\n        flex-direction:column !important;\n        overflow:hidden !important;\n    }\n\n    .tm-comment-section:not(.is-collapsed){\n        flex:1 1 0% !important;\n        height:0 !important;\n        min-height:0 !important;\n        overflow:hidden !important;\n    }\n    .tm-comment-section-body{\n        flex:1 1 0% !important;\n        height:0 !important;\n        min-height:0 !important;\n        overflow-y:auto !important;\n        padding-bottom:4px !important;\n    }\n    .tm-comments-panel-action-bar{\n        position:relative !important;\n        bottom:auto !important;\n        left:auto !important;\n        right:auto !important;\n        flex:0 0 auto !important;\n        flex-shrink:0 !important;\n        z-index:9995 !important;\n    }\n\n    .tm-comment-submit-bar-wrapper{\n        position:relative !important;\n        bottom:auto !important;\n        left:auto !important;\n        right:auto !important;\n        flex:0 0 auto !important;\n        flex-shrink:0 !important;\n        z-index:9996 !important;\n    }\n    .tm-comments-panel-publish-btn{\n        bottom:56px !important;\n        left:50% !important;\n        transform:translateX(-50%) !important;\n        z-index:9995 !important;\n    }\n    .tm-handle-container{\n        display:none !important;\n    }\n    .tm-control-buttons{\n        position:fixed !important;\n        bottom:16px;\n        right:16px;\n        left:auto;\n        transform:none;\n        width:calc(var(--sidebar-width) - 32px) !important;\n        max-width:calc(var(--sidebar-width) - 32px) !important;\n        min-width:348px !important;\n        background-color:rgba(10, 10, 10, 0.52) !important;\n        border:none !important;\n        border-radius:16px !important;\n        backdrop-filter:blur(24px) !important;\n        -webkit-backdrop-filter:blur(24px) !important;\n        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.45) !important;\n        z-index:10001 !important;\n        padding:8px 12px 12px 12px !important;\n        transition:opacity 0.3s ease, transform 0.3s ease !important;\n        display:flex !important;\n        flex-direction:column !important;\n        gap:8px !important;\n    }\n    .tm-control-drag-handle{\n        display:flex !important;\n    }\n    .tm-control-buttons.dragging{\n        transition:none !important;\n        cursor:grabbing;\n        box-shadow:0 15px 40px rgba(0, 0, 0, 0.6) !important;\n        border:none !important;\n    }\n    body.controls-hidden .tm-control-buttons{\n        opacity:0 !important;\n        transform:translateY(20px) !important;\n        pointer-events:none !important;\n    }\n\n    body:not(.controls-hidden) .tm-control-buttons{\n        opacity:1 !important;\n        transform:none !important;\n        pointer-events:auto !important;\n    }\n    .tm-video-overlay{\n        background-color:rgba(0, 0, 0, 0.75) !important;\n        backdrop-filter:blur(10px) !important;\n        -webkit-backdrop-filter:blur(10px) !important;\n    }\n    .tm-player-container .tm-settings-panel{\n        z-index:10002 !important;\n        width:calc(var(--sidebar-width) - 24px) !important;\n        max-width:calc(var(--sidebar-width) - 24px) !important;\n        right:12px !important;\n    }\n\n    .tm-player-container.tm-sidebar-left .tm-settings-panel{\n        left:12px !important;\n        right:auto !important;\n    }\n    .tm-comments-panel{\n        transition:margin-top 0.25s cubic-bezier(0.25, 1, 0.5, 1), margin-bottom 0.25s cubic-bezier(0.25, 1, 0.5, 1), height 0.25s cubic-bezier(0.25, 1, 0.5, 1) !important;\n    }\n    .tm-player-container.tm-controls-docked-br .tm-comments-panel,\n    .tm-player-container.tm-controls-docked-bl .tm-comments-panel{\n        margin-bottom:var(--docked-controls-height) !important;\n        height:calc(100% - var(--docked-controls-height)) !important;\n    }\n    .tm-player-container.tm-controls-docked-tr .tm-comments-panel,\n    .tm-player-container.tm-controls-docked-tl .tm-comments-panel{\n        margin-top:var(--docked-controls-height) !important;\n        height:calc(100% - var(--docked-controls-height)) !important;\n    }\n    .tm-player-container.tm-controls-docked-br .tm-comments-panel-list.tm-comments-list,\n    .tm-player-container.tm-controls-docked-bl .tm-comments-panel-list.tm-comments-list,\n    .tm-player-container.tm-controls-docked-tr .tm-comments-panel-list.tm-comments-list,\n    .tm-player-container.tm-controls-docked-tl .tm-comments-panel-list.tm-comments-list{\n        padding-bottom:8px !important;\n    }\n    .tm-player-container[class*="tm-controls-docked-"] .tm-control-buttons,\n    body.controls-hidden .tm-player-container[class*="tm-controls-docked-"] .tm-control-buttons{\n        position:fixed !important;\n        width:var(--sidebar-width) !important;\n        min-width:350px !important;\n        max-width:var(--sidebar-width) !important;\n        border-radius:0 !important;\n        border:none !important;\n        box-shadow:none !important;\n        padding:12px 16px 12px 16px !important;\n        background-color:hsla(var(--shadcn-card) / 0.65) !important;\n        backdrop-filter:blur(24px) !important;\n        -webkit-backdrop-filter:blur(24px) !important;\n        opacity:1 !important;\n        transform:none !important;\n        pointer-events:auto !important;\n    }\n    \n    .tm-player-container.tm-controls-docked-br .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-bl .tm-control-buttons{\n        bottom:0 !important;\n        top:auto !important;\n    }\n    .tm-player-container.tm-controls-docked-tr .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-tl .tm-control-buttons{\n        top:0 !important;\n        bottom:auto !important;\n    }\n    \n    .tm-player-container.tm-controls-docked-br .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-tr .tm-control-buttons{\n        right:0 !important;\n        left:auto !important;\n    }\n    .tm-player-container.tm-controls-docked-bl .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-tl .tm-control-buttons{\n        left:0 !important;\n        right:auto !important;\n    }\n    .tm-player-container.tm-sidebar-left{\n        grid-template-columns:var(--sidebar-width) 1fr !important;\n        grid-template-areas:"sidebar video" !important;\n    }\n    .tm-player-container.tm-sidebar-left .tm-comments-panel{\n        border-left:none !important;\n        border-right:1px solid hsla(var(--shadcn-border) / 0.15) !important;\n    }\n    .tm-player-container.tm-sidebar-left .tm-settings-panel{\n        right:auto !important;\n        left:16px !important;\n    }\n    .tm-player-container.tm-sidebar-hidden{\n        grid-template-columns:1fr !important;\n        grid-template-areas:"video" !important;\n    }\n    .tm-player-container.tm-sidebar-hidden .tm-comments-panel{\n        position:absolute !important;\n        width:0 !important;\n        height:0 !important;\n        border:none !important;\n        overflow:visible !important;\n        background:transparent !important;\n        backdrop-filter:none !important;\n        -webkit-backdrop-filter:none !important;\n        pointer-events:none !important;\n        visibility:hidden !important;\n        opacity:0 !important;\n    }\n    .tm-sidebar-pos-button,\n    .tm-sidebar-toggle-button{\n        display:flex !important;\n    }\n    .tm-player-container[class*="tm-controls-docked-"] .tm-settings-panel{\n        padding:0px !important;\n    }\n    .tm-player-container[class*="tm-controls-docked-"] .tm-settings-panel .tm-settings-options{\n        padding:12px !important;\n    }\n    .tm-player-title{\n        top:16px !important;\n        left:calc((100% - var(--sidebar-width)) / 2) !important;\n        transform:translateX(-50%) !important;\n        max-width:calc(100% - var(--sidebar-width) - 40px) !important;\n    }\n    \n    .tm-player-container.tm-sidebar-left .tm-player-title{\n        left:calc((100% + var(--sidebar-width)) / 2) !important;\n    }\n\n    .tm-player-container.tm-sidebar-hidden .tm-player-title{\n        left:50% !important;\n        max-width:calc(100% - 200px) !important;\n    }\n}\n@media screen and (min-width: 930px) and (max-width: 1023px) and (orientation: landscape){\n    .tm-control-buttons{\n        padding:6px 8px 10px 8px !important;\n        gap:6px !important;\n        border-radius:12px !important;\n    }\n    .tm-control-drag-handle{\n        height:10px !important;\n    }\n    .tm-time-display{\n        font-size:11px !important;\n    }\n    .tm-tab-pill{\n        padding:3px 8px !important;\n        font-size:0.7rem !important;\n    }\n}\n@media screen and (min-width: 480px) and (orientation: portrait),\n       screen and (min-width: 480px) and (max-width: 929px) and (orientation: landscape){\n    .tm-control-buttons{\n        position:fixed !important;\n        bottom:16px;\n        right:16px;\n        left:auto;\n        transform:none;\n        width:350px !important;\n        max-width:350px !important;\n        min-width:350px !important;\n        background-color:hsla(var(--shadcn-card) / 0.85) !important;\n        border:1px solid hsla(var(--shadcn-border) / 0.2) !important;\n        border-radius:16px !important;\n        backdrop-filter:blur(16px) !important;\n        -webkit-backdrop-filter:blur(16px) !important;\n        box-shadow:0 10px 30px rgba(0, 0, 0, 0.5) !important;\n        z-index:10001 !important;\n        padding:8px 12px 12px 12px !important;\n        transition:opacity 0.3s ease, transform 0.3s ease !important;\n        display:flex !important;\n        flex-direction:column !important;\n        gap:8px !important;\n    }\n    .tm-control-drag-handle{\n        display:flex !important;\n    }\n    body.controls-hidden .tm-control-buttons{\n        opacity:0 !important;\n        transform:translateY(20px) !important;\n        pointer-events:none !important;\n    }\n\n    body:not(.controls-hidden) .tm-control-buttons{\n        opacity:1 !important;\n        transform:none !important;\n        pointer-events:auto !important;\n    }\n\n\n}\n`, "" ]);
      const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
    },
    "964": (__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
      __webpack_require__.r(__webpack_exports__);
      __webpack_require__.d(__webpack_exports__, {
        "default": () => __WEBPACK_DEFAULT_EXPORT__
      });
      var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72);
      var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
      var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(825);
      var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
      var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(659);
      var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = __webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
      var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(56);
      var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = __webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
      var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(540);
      var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = __webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
      var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(113);
      var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = __webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
      var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_style_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(703);
      var options = {};
      options.styleTagTransform = _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default();
      options.setAttributes = _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default();
      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
      options.domAPI = _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default();
      options.insertStyleElement = _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default();
      var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_style_css__WEBPACK_IMPORTED_MODULE_6__.A, options);
      const __WEBPACK_DEFAULT_EXPORT__ = _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_style_css__WEBPACK_IMPORTED_MODULE_6__.A && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_style_css__WEBPACK_IMPORTED_MODULE_6__.A.locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_node_modules_postcss_loader_dist_cjs_js_ruleSet_1_rules_1_use_2_style_css__WEBPACK_IMPORTED_MODULE_6__.A.locals : void 0;
    }
  };
  var __webpack_module_cache__ = {};
  function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== void 0) {
      return cachedModule.exports;
    }
    var module = __webpack_module_cache__[moduleId] = {
      "id": moduleId,
      "exports": {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
  }
  (() => {
    __webpack_require__.n = module => {
      var getter = module && module.__esModule ? () => module["default"] : () => module;
      __webpack_require__.d(getter, {
        "a": getter
      });
      return getter;
    };
  })();
  (() => {
    __webpack_require__.d = (exports, definition) => {
      for (var key in definition) {
        if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
          Object.defineProperty(exports, key, {
            "enumerable": true,
            "get": definition[key]
          });
        }
      }
    };
  })();
  (() => {
    __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  })();
  (() => {
    __webpack_require__.r = exports => {
      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, {
          "value": "Module"
        });
      }
      Object.defineProperty(exports, "__esModule", {
        "value": true
      });
    };
  })();
  (() => {
    __webpack_require__.nc = void 0;
  })();
  var __webpack_exports__ = {};
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }
  function formatTimeWithHours(timeInSeconds) {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) {
      return "00:00:00";
    }
    const totalSeconds = Math.floor(timeInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  const _cache = {
    "isIOS": null,
    "isMobile": null
  };
  function isIOS() {
    if (_cache.isIOS === null) {
      _cache.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    return _cache.isIOS;
  }
  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }
  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }
  let _cachedSafeAreaInsets = {
    "top": 44,
    "right": 16,
    "bottom": 34,
    "left": 16
  };
  function getSafeAreaInsets() {
    return _cachedSafeAreaInsets;
  }
  const _theme = {
    "original": {
      "dark": null
    }
  };
  function updateSafariThemeColor() {
    let color = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "#000000";
    let saveOriginal = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    if (!isSafari() && !isIOS()) {
      return;
    }
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (saveOriginal && metaThemeColor && !_theme.original.dark) {
      _theme.original.dark = metaThemeColor.content;
    }
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
  }
  function restoreSafariThemeColor() {
    if (_theme.original.dark) {
      updateSafariThemeColor(_theme.original.dark);
    } else {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor && metaThemeColor.parentNode) {
        metaThemeColor.parentNode.removeChild(metaThemeColor);
      }
    }
  }
  function isMobile() {
    if (_cache.isMobile === null) {
      _cache.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return _cache.isMobile;
  }
  function createElementWithStyle(tag, className, styleCSS) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (styleCSS) {
      element.style.cssText = styleCSS;
    }
    return element;
  }
  function delegateEvent(element, eventType, selector, handler, options) {
    element.addEventListener(eventType, (event => {
      const target = event.target.closest(selector);
      if (target && element.contains(target)) {
        handler.call(target, event);
      }
    }), options);
  }
  function waitForElement(selector) {
    let timeout = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e4;
    let interval = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 100;
    return new Promise(((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }
      const start = Date.now();
      const intervalId = setInterval((() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(intervalId);
          return resolve(element);
        }
        if (Date.now() - start > timeout) {
          clearInterval(intervalId);
          reject(new Error(`等待元素 ${selector} 超时`));
        }
      }), interval);
    }));
  }
  function findVideoElement() {
    let potentialVideo = null;
    const specificSelectors = [ "#player video", "#video video", "div.plyr__video-wrapper video", ".video-js video", "#player > video", "#video-player > video", "video[preload]:not([muted])" ];
    for (const selector of specificSelectors) {
      potentialVideo = document.querySelector(selector);
      if (potentialVideo) {
        return potentialVideo;
      }
    }
    const allVideos = Array.from(document.querySelectorAll("video"));
    if (allVideos.length === 0) {
      return null;
    }
    if (allVideos.length === 1) {
      return allVideos[0];
    }
    const visibleVideos = allVideos.map((video => ({
      "element": video,
      "rect": video.getBoundingClientRect()
    }))).filter((item => item.rect.width > 50 && item.rect.height > 50)).map((item => ({
      ...item,
      "area": item.rect.width * item.rect.height
    }))).sort(((a, b) => b.area - a.area));
    if (visibleVideos.length > 0) {
      return visibleVideos[0].element;
    }
    return allVideos[0];
  }
  function createRipple(event, button, color) {
    if (!button || typeof button.getBoundingClientRect !== "function") {
      return null;
    }
    const r = button.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    let clientX = r.left + r.width / 2;
    let clientY = r.top + r.height / 2;
    if (event) {
      if (typeof event.clientX === "number" && (event.clientX !== 0 || event.clientY !== 0)) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event.touches && event.touches[0]) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches[0]) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      }
    }
    const x = clientX - r.left - size / 2;
    const y = clientY - r.top - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple tm-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    if (color) {
      ripple.style.background = color;
    }
    button.appendChild(ripple);
    const removeRipple = () => {
      ripple.removeEventListener("animationend", removeRipple);
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    };
    ripple.addEventListener("animationend", removeRipple, {
      "once": true
    });
    setTimeout(removeRipple, 650);
    return ripple;
  }
  const LOCAL_STORAGE_PREFIX = "mp_";
  const LEGACY_STORAGE_PREFIX = "missNoAD_";
  function hasGMApi() {
    return typeof GM_getValue === "function" && typeof GM_setValue === "function";
  }
  function getValue(key) {
    let defaultValue = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    let useGM = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    try {
      if (useGM && hasGMApi()) {
        const val = GM_getValue(key, defaultValue);
        return val !== void 0 ? val : defaultValue;
      }
      let item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      if (item === null) {
        item = localStorage.getItem(LEGACY_STORAGE_PREFIX + key);
      }
      if (item !== null) {
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      }
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  function setValue(key, value) {
    let useGM = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    try {
      if (useGM && hasGMApi()) {
        GM_setValue(key, value);
        return;
      }
      const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;
      localStorage.setItem(LOCAL_STORAGE_PREFIX + key, serializedValue);
    } catch (e) {}
  }
  function deleteValue(key) {
    let useGM = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    try {
      if (useGM && typeof GM_deleteValue === "function") {
        GM_deleteValue(key);
        return;
      }
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + key);
      localStorage.removeItem(LEGACY_STORAGE_PREFIX + key);
    } catch (e) {}
  }
  function obfuscate(str) {
    if (!str) {
      return "";
    }
    try {
      const b64 = btoa(unescape(encodeURIComponent(str)));
      return b64.split("").reverse().join("");
    } catch (e) {
      return str;
    }
  }
  function deobfuscate(str) {
    if (!str) {
      return "";
    }
    try {
      const reversed = str.split("").reverse().join("");
      return decodeURIComponent(escape(atob(reversed)));
    } catch (e) {
      return str;
    }
  }
  function setLocalStorage(key, value) {
    try {
      let valToStore = value;
      if (key === "autologin_userPassword" && value) {
        valToStore = obfuscate(value);
      }
      localStorage.setItem(key, typeof valToStore === "object" ? JSON.stringify(valToStore) : valToStore);
    } catch (e) {}
  }
  function getLocalStorage(key) {
    let defaultValue = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        if (key === "autologin_userPassword" && typeof item === "string") {
          return deobfuscate(item);
        }
        try {
          return JSON.parse(item);
        } catch (e) {
          return item;
        }
      }
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  function deleteLocalStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
  function Toast(msg) {
    let duration = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3e3;
    let bgColor = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "";
    let textColor = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "";
    let position = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "top";
    const toast = document.createElement("div");
    toast.className = `tm-toast tm-toast--${position}`;
    let type = "normal";
    let customBg = "";
    let customText = "";
    if (bgColor) {
      const lowerColor = bgColor.toLowerCase().trim();
      if (lowerColor === "success" || lowerColor === "rgb(18, 187, 2)" || lowerColor.includes("green") || lowerColor.includes("50% 45%")) {
        type = "success";
      } else if (lowerColor === "error" || lowerColor === "red" || lowerColor === "#ff0000" || lowerColor.includes("destructive") || lowerColor.includes("50% 40%")) {
        type = "error";
      } else if (lowerColor === "info" || lowerColor.includes("blue") || lowerColor.includes("anim-quick")) {
        type = "info";
      } else {
        type = "custom";
        customBg = bgColor;
        customText = textColor;
      }
    }
    let iconSvg = "";
    if (type === "success") {
      toast.classList.add("tm-toast--success");
      iconSvg = `\n            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n                <polyline points="20 6 9 17 4 12"></polyline>\n            </svg>\n        `;
    } else if (type === "error") {
      toast.classList.add("tm-toast--error");
      iconSvg = `\n            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n                <circle cx="12" cy="12" r="10"></circle>\n                <line x1="15" y1="9" x2="9" y2="15"></line>\n                <line x1="9" y1="9" x2="15" y2="15"></line>\n            </svg>\n        `;
    } else if (type === "info") {
      toast.classList.add("tm-toast--info");
      iconSvg = `\n            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n                <circle cx="12" cy="12" r="10"></circle>\n                <line x1="12" y1="16" x2="12" y2="12"></line>\n                <line x1="12" y1="8" x2="12.01" y2="8"></line>\n            </svg>\n        `;
    } else if (type === "custom") {
      toast.style.background = customBg;
      if (customText) {
        toast.style.color = customText;
      }
    }
    toast.innerHTML = `${iconSvg}<span class="tm-toast-content">${msg}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame((() => {
      toast.classList.add("visible");
    }));
    setTimeout((() => {
      toast.classList.remove("visible");
      setTimeout((() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }), 300);
    }), duration);
  }
  var domains = __webpack_require__(645);
  const NON_AV_SLUGS = new Set([ "search", "s", "zh-cn", "cn", "en", "tw", "ja", "vi", "ko", "th", "ru", "forum", "forum.php", "index.html", "index.php", "warmup.html", "watch", "login", "register", "signin", "signup", "home", "tags", "genres", "actors", "actresses", "makers", "directors", "series", "categories", "channels", "playlists", "dmca", "terms", "privacy", "about", "help", "contact", "v1_star.php", "preview", "member", "vip", "download", "upload", "news", "rank", "ranking", "popular", "latest", "release", "recent", "favorite", "history", "videos", "video", "movie", "movies", "new", "top", "trending" ]);
  function isValidAvCode(code) {
    if (!code || typeof code !== "string") {
      return false;
    }
    const s = code.trim().toLowerCase();
    if (s.length < 2 || s.length > 50) {
      return false;
    }
    if (NON_AV_SLUGS.has(s)) {
      return false;
    }
    if (s.endsWith(".html") || s.endsWith(".php") || s.endsWith(".htm") || s.endsWith(".js") || s.endsWith(".css")) {
      return false;
    }
    if (/^[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/i.test(s) && /\d/.test(s)) {
      return true;
    }
    if (/^(dm|[a-z]{2,8})\d{2,8}$/i.test(s)) {
      return true;
    }
    if (/^uncensored-leak-[a-z0-9-]+$/i.test(s) && /\d/.test(s)) {
      return true;
    }
    return false;
  }
  function cleanAvCode(code) {
    if (!code) {
      return "";
    }
    let result = code.trim();
    const suffixes = [ "-uncensored-leak", "-uncensored", "-english-subtitle", "-chinese-subtitle", "-subtitle", "-leak", "-c", "-uc" ];
    let changed = true;
    while (changed) {
      changed = false;
      for (const suffix of suffixes) {
        if (result.toLowerCase().endsWith(suffix)) {
          result = result.slice(0, -suffix.length);
          changed = true;
          break;
        }
      }
    }
    const stdMatch = result.match(/^([a-zA-Z]+)-?(\d+)$/);
    if (stdMatch) {
      return `${stdMatch[1].toUpperCase()}-${stdMatch[2]}`;
    }
    const dmMatch = result.match(/^dm-?(\d+)$/i);
    if (dmMatch) {
      return `DM-${dmMatch[1]}`;
    }
    return result.toUpperCase();
  }
  function getVideoCodeFromUrl() {
    let url = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : typeof window !== "undefined" ? window.location.href : "";
    if (!url) {
      return "";
    }
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const search = urlObj.search;
      let rawCandidate = "";
      if ((0, domains.isSiteDomain)("JABLE", urlObj.hostname)) {
        const match = path.match(/\/videos\/([^/?#]+)/i);
        if (match) {
          rawCandidate = match[1];
        }
      }
      if (!rawCandidate && (0, domains.isSiteDomain)("JAVDB", urlObj.hostname)) {
        const match = path.match(/\/(?:v|videos)\/([^/?#]+)/i);
        if (match) {
          rawCandidate = match[1];
        }
      }
      if (!rawCandidate && (0, domains.isSiteDomain)("JAVLIBRARY", urlObj.hostname)) {
        const vParam = urlObj.searchParams.get("v");
        if (vParam) {
          rawCandidate = vParam;
        }
      }
      if (!rawCandidate && (0, domains.isSiteDomain)("MISSAV", urlObj.hostname)) {
        const segments = path.split("/").filter(Boolean);
        if (segments.length > 0) {
          const last = segments[segments.length - 1];
          if (!NON_AV_SLUGS.has(last.toLowerCase())) {
            rawCandidate = last;
          }
        }
      }
      if (!rawCandidate) {
        const genericMatch = path.match(/\/([a-zA-Z0-9]+-\d+[a-zA-Z0-9-]*)/i);
        if (genericMatch) {
          rawCandidate = genericMatch[1];
        }
      }
      if (!rawCandidate) {
        const segments = path.split("/").filter(Boolean);
        if (segments.length > 0) {
          const last = segments[segments.length - 1];
          if (isValidAvCode(last)) {
            rawCandidate = last;
          }
        }
      }
      if (rawCandidate && isValidAvCode(rawCandidate)) {
        return cleanAvCode(rawCandidate);
      }
    } catch (e) {}
    return "";
  }
  function fetchWithTransport(url) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const {"method": method = "GET", "headers": headers = {}, "timeout": timeout = 8e3, "body": body = null} = options;
    const isSameOrigin = function() {
      try {
        const targetHost = new URL(url).hostname;
        return window.location.hostname === targetHost;
      } catch {
        return false;
      }
    }();
    if (isSameOrigin && typeof fetch === "function") {
      const fetchFn = typeof unsafeWindow !== "undefined" && unsafeWindow.fetch ? unsafeWindow.fetch : fetch;
      return fetchFn(url, {
        "method": method,
        "headers": headers,
        "body": body
      }).then((async res => {
        const text = await res.text();
        return {
          "status": res.status,
          "html": text,
          "finalUrl": res.url
        };
      }));
    }
    return new Promise(((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== "function") {
        return reject(new Error("GM_xmlhttpRequest unavailable"));
      }
      let completed = false;
      const timer = setTimeout((() => {
        if (!completed) {
          completed = true;
          if (req && req.abort) {
            req.abort();
          }
          reject(new Error("NETWORK_TIMEOUT"));
        }
      }), timeout);
      const req = GM_xmlhttpRequest({
        "method": method,
        "url": url,
        "headers": headers,
        "data": body,
        "timeout": timeout,
        "onload": res => {
          if (completed) {
            return;
          }
          completed = true;
          clearTimeout(timer);
          resolve({
            "status": res.status,
            "html": res.responseText || "",
            "finalUrl": res.finalUrl || url
          });
        },
        "onerror": err => {
          if (completed) {
            return;
          }
          completed = true;
          clearTimeout(timer);
          reject(new Error(err.statusText || "NETWORK_ERROR"));
        },
        "ontimeout": () => {
          if (completed) {
            return;
          }
          completed = true;
          clearTimeout(timer);
          reject(new Error("NETWORK_TIMEOUT"));
        }
      });
    }));
  }
  function detectCloudflare(status) {
    let html = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    if (status === 403 || status === 503) {
      return true;
    }
    if (!html) {
      return false;
    }
    const lower = html.toLowerCase();
    return lower.includes("cf-challenge") || lower.includes("turnstile") || lower.includes("checking your browser") || lower.includes("cloudflare");
  }
  async function fetchWithDomainRotation(domainList, pathBuilder) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    let lastError = null;
    for (const domain of domainList) {
      try {
        const url = pathBuilder(domain);
        const res = await fetchWithTransport(url, options);
        if (detectCloudflare(res.status, res.html)) {
          throw new Error(`CF_SHIELD_ON_${domain}`);
        }
        if (res.status >= 200 && res.status < 400) {
          return {
            ...res,
            "domain": domain
          };
        }
        throw new Error(`HTTP_${res.status}`);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("ALL_DOMAINS_FAILED");
  }
  function createModal(contentHTML) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const {"onClose": onClose, "extraClass": extraClass = ""} = options;
    const modal = document.createElement("div");
    modal.className = `tm-custom-modal-overlay ${extraClass}`.trim();
    modal.innerHTML = contentHTML;
    const close = () => {
      modal.classList.remove("active");
      const removeModal = () => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        modal.removeEventListener("transitionend", removeModal);
        if (typeof onClose === "function") {
          onClose();
        }
      };
      modal.addEventListener("transitionend", removeModal, {
        "once": true
      });
      setTimeout(removeModal, 350);
    };
    modal.addEventListener("click", (e => {
      if (e.target === modal) {
        close();
      }
    }));
    document.body.appendChild(modal);
    requestAnimationFrame((() => {
      modal.classList.add("active");
    }));
    return {
      "modal": modal,
      "close": close
    };
  }
  function getScriptVersion() {
    try {
      var _GM_info;
      if (typeof GM_info !== "undefined" && (_GM_info = GM_info) !== null && _GM_info !== void 0 && (_GM_info = _GM_info.script) !== null && _GM_info !== void 0 && _GM_info.version) {
        return GM_info.script.version;
      }
    } catch (_) {}
    return "5.6.19";
  }
  class EventCollector {
    "constructor"() {
      try {
        if (typeof GM_deleteValue === "function") {
          GM_deleteValue("mp_telemetry_client_id_v2");
          GM_deleteValue("mp_telemetry_cache_v3");
        }
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("mp_telemetry_client_id_v2");
          localStorage.removeItem("mp_telemetry_cache_v3");
        }
      } catch (_) {}
    }
    "isEnabled"() {
      return false;
    }
    "getScriptVersion"() {
      return getScriptVersion();
    }
    "track"() {}
    "recordFeatureAction"() {}
    "recordVideoPlay"() {}
    "trackPluginTrigger"() {}
    "trackTimestampCollect"() {}
    "trackTimestampClick"() {}
    "checkPeriodicFlush"() {}
    "flush"() {}
    "clearCache"() {}
    "saveCache"() {}
    "loadCache"() {}
  }
  const telemetry = new EventCollector;
  async function copyToClipboard(text) {
    telemetry.track("share_copy", {
      "text_len": text ? text.length : 0,
      "is_url": text ? text.includes("http") || text.includes("#") : false,
      "has_timestamp": text ? text.includes("t=") || text.includes("tab=") : false
    });
    if (typeof GM_setClipboard === "function") {
      try {
        GM_setClipboard(text);
        return true;
      } catch {}
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      return false;
    }
  }
  let audioCtx = null;
  let lastPlayTime = 0;
  function getAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass;
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch((() => {}));
    }
    return audioCtx;
  }
  function playTapSound() {
    let force = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
    try {
      const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      if (now - lastPlayTime < 25) {
        return;
      }
      lastPlayTime = now;
      if (!force) {
        const isEnabled = getValue("buttonSoundEnabled", true);
        if (!isEnabled) {
          return;
        }
      }
      const ctx = getAudioContext();
      if (!ctx) {
        return;
      }
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, t0);
      gain.gain.setValueAtTime(.08, t0);
      gain.gain.exponentialRampToValueAtTime(1e-4, t0 + .016);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + .02);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
    } catch (_) {}
  }
  const playButtonClickSound = null && playTapSound;
  class PlayerCore {
    "constructor"() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.defaultPlaybackRate = 1;
      this.targetVideo = null;
      this.videoState = {
        "currentTime": 0,
        "isPlaying": false,
        "volume": 1,
        "playbackRate": 1
      };
      this.options = Object.assign({
        "containerId": "tm-video-container",
        "startMuted": false
      }, options);
      this.callingButton = this.options.callingButton || null;
      this.initialized = false;
    }
    "init"() {
      if (this.initialized) {
        return;
      }
      this.cleanupExistingOverlays();
      this.targetVideo = this.findTargetVideo();
      if (!this.targetVideo) {
        if (this.callingButton) {
          this.callingButton.style.display = "flex";
        }
        return;
      }
      this.saveVideoState();
      this.initialized = true;
      return this.targetVideo;
    }
    "cleanupExistingOverlays"() {
      const existingOverlays = document.querySelectorAll(".tm-video-overlay");
      if (existingOverlays.length > 0) {
        existingOverlays.forEach((overlay => {
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }));
      }
    }
    "findTargetVideo"() {
      return findVideoElement();
    }
    "saveVideoState"() {
      if (!this.targetVideo) {
        return;
      }
      this.originalParent = this.targetVideo.parentNode;
      this.originalIndex = Array.from(this.originalParent.children).indexOf(this.targetVideo);
      try {
        if (this.originalParent && !this.videoPlaceholder) {
          this.videoPlaceholder = document.createElement("div");
          this.videoPlaceholder.className = "tm-video-placeholder";
          this.videoPlaceholder.style.cssText = "width: 100%; height: 100%; min-height: 200px; aspect-ratio: 16/9; visibility: hidden; pointer-events: none;";
          this.originalParent.insertBefore(this.videoPlaceholder, this.targetVideo);
        }
      } catch (_) {}
      this.videoState = {
        "currentTime": this.targetVideo.currentTime,
        "isPaused": this.targetVideo.paused,
        "videoSrc": this.targetVideo.src,
        "posterSrc": this.targetVideo.poster,
        "wasMuted": this.targetVideo.muted,
        "controls": this.targetVideo.controls,
        "playsinline": this.targetVideo.getAttribute("playsinline"),
        "webkitPlaysinline": this.targetVideo.getAttribute("webkit-playsinline"),
        "x5Playsinline": this.targetVideo.getAttribute("x5-playsinline")
      };
    }
    "restoreVideoState"() {
      try {
        const savedSpeed = parseFloat(getValue("preferredPlaybackRate", 1));
        const validSpeed = !isNaN(savedSpeed) && savedSpeed >= .5 && savedSpeed <= 4 ? savedSpeed : this.defaultPlaybackRate;
        this.targetVideo.playbackRate = validSpeed;
        if (this.videoState && this.videoState.currentTime > 0) {
          if (this.targetVideo.readyState >= 1) {
            try {
              this.targetVideo.currentTime = this.videoState.currentTime;
            } catch (_) {}
          } else {
            const restoreTimeOnReady = () => {
              if (this.targetVideo && this.videoState && this.videoState.currentTime > 0) {
                try {
                  this.targetVideo.currentTime = this.videoState.currentTime;
                } catch (_) {}
              }
            };
            this.targetVideo.addEventListener("loadedmetadata", restoreTimeOnReady, {
              "once": true
            });
          }
        }
        const attemptPlay = () => {
          if (!this.targetVideo) {
            return;
          }
          this.targetVideo.setAttribute("playsinline", "true");
          this.targetVideo.setAttribute("webkit-playsinline", "true");
          this.targetVideo.setAttribute("x5-playsinline", "true");
          this.targetVideo.playsInline = true;
          this.targetVideo.webkitPlaysInline = true;
          const playPromise = this.targetVideo.play();
          if (playPromise !== void 0) {
            playPromise.catch((error => {
              if (error.name === "NotAllowedError" || !this.targetVideo.muted) {
                this.targetVideo.muted = true;
                const mutedPromise = this.targetVideo.play();
                if (mutedPromise !== void 0) {
                  mutedPromise.then((() => {
                    const unmuteOnInteract = () => {
                      if (this.targetVideo) {
                        this.targetVideo.muted = false;
                      }
                      document.removeEventListener("click", unmuteOnInteract, true);
                      document.removeEventListener("touchstart", unmuteOnInteract, true);
                    };
                    document.addEventListener("click", unmuteOnInteract, {
                      "once": true,
                      "capture": true
                    });
                    document.addEventListener("touchstart", unmuteOnInteract, {
                      "once": true,
                      "capture": true
                    });
                  })).catch((err => {}));
                }
              }
            }));
          }
        };
        attemptPlay();
        if (this.targetVideo.readyState < 2) {
          const onReadyToPlay = () => {
            attemptPlay();
            this.targetVideo.removeEventListener("canplay", onReadyToPlay);
            this.targetVideo.removeEventListener("loadeddata", onReadyToPlay);
          };
          this.targetVideo.addEventListener("canplay", onReadyToPlay, {
            "once": true
          });
          this.targetVideo.addEventListener("loadeddata", onReadyToPlay, {
            "once": true
          });
        }
      } catch (e) {}
    }
    "close"(overlay, container, playerContainer) {
      if (!overlay) {
        return;
      }
      this.videoState.currentTime = this.targetVideo.currentTime;
      this.videoState.isPlaying = !this.targetVideo.paused;
      this.videoState.volume = this.targetVideo.volume;
      this.videoState.playbackRate = this.targetVideo.playbackRate;
      if (!this.targetVideo.paused) {
        this.targetVideo.pause();
      }
      if (this.originalParent && this.targetVideo) {
        if (this.targetVideo.parentNode !== this.originalParent) {
          if (this.videoPlaceholder && this.videoPlaceholder.parentNode) {
            this.videoPlaceholder.parentNode.replaceChild(this.targetVideo, this.videoPlaceholder);
            this.videoPlaceholder = null;
          } else if (this.originalIndex !== -1 && this.originalParent.childNodes.length > this.originalIndex) {
            this.originalParent.insertBefore(this.targetVideo, this.originalParent.childNodes[this.originalIndex]);
          } else {
            this.originalParent.appendChild(this.targetVideo);
          }
          this.targetVideo.style.width = "";
          this.targetVideo.style.height = "";
          this.targetVideo.style.maxHeight = "";
          this.targetVideo.style.margin = "";
          this.targetVideo.style.position = "";
          this.targetVideo.setAttribute("playsinline", "true");
          this.targetVideo.setAttribute("webkit-playsinline", "true");
          this.targetVideo.setAttribute("x5-playsinline", "true");
          this.targetVideo.playsInline = true;
          this.targetVideo.webkitPlaysInline = true;
          if (this.targetVideo.webkitDisplayingFullscreen && typeof this.targetVideo.webkitExitFullscreen === "function") {
            try {
              this.targetVideo.webkitExitFullscreen();
            } catch (_) {}
          }
        }
      }
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (playerContainer && playerContainer.parentNode) {
        playerContainer.parentNode.removeChild(playerContainer);
      }
      document.body.classList.remove("tm-player-active", "controls-hidden");
      document.documentElement.classList.remove("tm-player-active", "controls-hidden");
      const scrollbarStyle = document.getElementById("tm-hide-scrollbar-style");
      if (scrollbarStyle && scrollbarStyle.parentNode) {
        scrollbarStyle.parentNode.removeChild(scrollbarStyle);
      }
      const fullscreenStyle = document.getElementById("tm-fullscreen-style");
      if (fullscreenStyle && fullscreenStyle.parentNode) {
        fullscreenStyle.parentNode.removeChild(fullscreenStyle);
      }
      try {
        const hostHeaders = document.querySelectorAll('header, .site-header, .header, #site-header, navbar, .navbar, .top-nav, [class*="site-header"]');
        hostHeaders.forEach((h => {
          if (h) {
            h.style.display = "";
            h.style.transform = "";
            h.style.visibility = "";
            h.style.top = "";
            h.style.opacity = "";
            h.classList.remove("hidden", "is-hidden", "header-hidden", "hide");
          }
        }));
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("resize"));
      } catch (e) {}
      this.initialized = false;
      restoreSafariThemeColor();
      if (this.callingButton) {
        this.callingButton.style.display = "flex";
      }
    }
  }
  const FLOATING_PLAY = `\n    <svg width="48" height="48" viewBox="0 0 68 48" fill="none">\n        <path class="tm-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="rgb(254, 98, 142)"></path>\n        <path d="M 45,24 27,14 27,34" fill="#fff"></path>\n    </svg>\n`;
  const PLAY = `\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="tm-play-icon" xmlns="http://www.w3.org/2000/svg">\n        <path d="M18 12L7 5V19L18 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const PAUSE = `\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M10 4H6V20H10V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M18 4H14V20H18V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const PLAY_CENTER = `\n    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M14,6v20c0,1.1-0.9,2-2,2H8c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h4C13.1,4,14,4.9,14,6z M24,4h-4\n        c-1.1,0-2,0.9-2,2v20c0,1.1,0.9,2,2,2h4c1.1,0,2-0.9,2-2V6C26,4.9,25.1,4,24,4z" fill="white"/>\n    </svg>\n`;
  const MUTE = `\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M23 9L17 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M17 9L23 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const VOLUME_LOW = `\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const VOLUME_HIGH = `\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M18.54 5.46C20.4246 7.34535 21.4681 9.90302 21.4681 12.575C21.4681 15.247 20.4246 17.8047 18.54 19.69" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const REWIND = `\n    <svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-rewind-icon">\n        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.70711 4.29289C3.31658 3.90237 2.68342 3.90237 2.29289 4.29289L-4.70711 11.2929C-5.09763 11.6834 -5.09763 12.3166 -4.70711 12.7071L2.29289 19.7071C2.68342 20.0976 3.31658 20.0976 3.70711 19.7071C4.09763 19.3166 4.09763 18.6834 3.70711 18.2929L-2.58579 12L3.70711 5.70711C4.09763 5.31658 4.09763 4.68342 3.70711 4.29289Z" fill="currentColor"/>\n    </svg>\n`;
  const FORWARD = `\n    <svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-forward-icon">\n        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="currentColor"/>\n    </svg>\n`;
  const CLOSE = null && `\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const CLOSE_LINE = null && `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <line x1="18" y1="6" x2="6" y2="18"></line>\n        <line x1="6" y1="6" x2="18" y2="18"></line>\n    </svg>\n`;
  const SEND = null && `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <line x1="22" y1="2" x2="11" y2="13"></line>\n        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>\n    </svg>\n`;
  const SETTINGS = null && `\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.83628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n`;
  const LOOP_INDICATOR = null && `\n    <svg width="12" height="12" style="vertical-align: middle;">\n        <circle class="tm-loop-indicator-circle" cx="6" cy="6" r="5" fill="hsl(var(--shadcn-muted-foreground) / 0.5)"></circle>\n    </svg>\n`;
  const KEYBOARD = `\n    <svg viewBox="2 5 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 5H16C18.8284 5 20.2426 5 21.1213 5.87868C22 6.75736 22 8.17157 22 11V13C22 15.8284 22 17.2426 21.1213 18.1213C20.2426 19 18.8284 19 16 19H8C5.17157 19 3.75736 19 2.87868 18.1213C2 17.2426 2 15.8284 2 13V11C2 8.17157 2 6.75736 2.87868 5.87868C3.75736 5 5.17157 5 8 5ZM6 10C6.55228 10 7 9.55228 7 9C7 8.44772 6.55228 8 6 8C5.44772 8 5 8.44772 5 9C5 9.55228 5.44772 10 6 10ZM6 13C6.55228 13 7 12.5523 7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13ZM9 13C9.55228 13 10 12.5523 10 12C10 11.4477 9.55228 11 9 11C8.44772 11 8 11.4477 8 12C8 12.5523 8.44772 13 9 13ZM9 10C9.55228 10 10 9.55228 10 9C10 8.44772 9.55228 8 9 8C8.44772 8 8 8.44772 8 9C8 9.55228 8.44772 10 9 10ZM12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10ZM12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13ZM15 10C15.5523 10 16 9.55228 16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9C14 9.55228 14.4477 10 15 10ZM15 13C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11C14.4477 11 14 11.4477 14 12C14 12.5523 14.4477 13 15 13ZM18 10C18.5523 10 19 9.55228 19 9C19 8.44772 18.5523 8 18 8C17.4477 8 17 8.44772 17 9C17 9.55228 17.4477 10 18 10ZM18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12C17 12.5523 17.4477 13 18 13ZM17.75 16C17.75 16.4142 17.4142 16.75 17 16.75H7C6.58579 16.75 6.25 16.4142 6.25 16C6.25 15.5858 6.58579 15.25 7 15.25H17C17.4142 15.25 17.75 15.5858 17.75 16Z" fill="currentColor"/>\n    </svg>\n`;
  const LAYOUT_LEFT = `\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <rect x="3" y="3" width="18" height="18" rx="5"/>\n        <line x1="7.5" y1="3" x2="7.5" y2="21"/>\n        <path d="M15.5 9l-3 3 3 3"/>\n    </svg>\n`;
  const LAYOUT_RIGHT = `\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <rect x="3" y="3" width="18" height="18" rx="5"/>\n        <line x1="16.5" y1="3" x2="16.5" y2="21"/>\n        <path d="M8.5 9l3 3-3 3"/>\n    </svg>\n`;
  const COMMENTS_SHOW = `\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>\n    </svg>\n`;
  const COMMENTS_HIDE = `\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity="0.4"/>\n        <line x1="3" y1="3" x2="21" y2="21"/>\n    </svg>\n`;
  const ICON_CLOUD_SYNC = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21.5 15a4.5 4.5 0 0 0-4-6.5h-1a7 7 0 0 0-13 3.5 4.5 4.5 0 0 0 4.5 4.5"/>\n        <polyline points="17 19 21 19 21 15"/>\n        <path d="M21 19l-4-4"/>\n    </svg>\n`;
  const ICON_CLOUD_UPLOAD = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>\n        <polyline points="17 8 12 3 7 8"/>\n        <line x1="12" y1="3" x2="12" y2="15"/>\n    </svg>\n`;
  const ICON_CLOUD_DOWNLOAD = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>\n        <polyline points="7 10 12 15 17 10"/>\n        <line x1="12" y1="15" x2="12" y2="3"/>\n    </svg>\n`;
  const ICON_EYE = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>\n        <circle cx="12" cy="12" r="3"/>\n    </svg>\n`;
  const ICON_EYE_OFF = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>\n        <line x1="1" y1="1" x2="23" y2="23"/>\n    </svg>\n`;
  const ICON_CHECK = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n        <polyline points="20 6 9 17 4 12"/>\n    </svg>\n`;
  const ICON_SERVER = `\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>\n        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>\n        <line x1="6" y1="6" x2="6.01" y2="6"/>\n        <line x1="6" y1="18" x2="6.01" y2="18"/>\n    </svg>\n`;
  const LOOP_INTERVAL = `\n    <svg viewBox="0 7 32 18" fill="currentColor" class="tm-loop-icon-svg" xmlns="http://www.w3.org/2000/svg">\n        <path d="M20.462 10.824l-9.265 9.196 0.753 0.756 9.265-9.196z"/>\n        <path d="M6.937 21.864c-3.234 0-5.864-2.631-5.864-5.864s2.631-5.864 5.864-5.864c1.566 0 2.987 0.621 4.040 1.624l0.001-0.006 0.054 0.047 2.076 2.066h-1.905v1.066h3.732v-3.732h-1.066v1.918l-2.084-2.074-0.005 0.005c-1.251-1.224-2.959-1.982-4.842-1.982-3.821 0-6.931 3.109-6.931 6.931s3.109 6.931 6.931 6.931c1.971 0 3.747-0.831 5.011-2.156l-0.753-0.754c-1.070 1.132-2.581 1.844-4.258 1.844z"/>\n        <path d="M25.063 9.069c-1.765 0-3.373 0.668-4.597 1.759l0.753 0.753c1.030-0.898 2.373-1.446 3.844-1.446 3.234 0 5.864 2.631 5.864 5.864s-2.631 5.864-5.864 5.864c-1.56 0-2.976-0.616-4.028-1.613l-0.002 0.010-3.531-3.518-0.757 0.751 3.535 3.522 0.006-0.006c1.245 1.187 2.925 1.921 4.776 1.921 3.821 0 6.931-3.109 6.931-6.931s-3.109-6.931-6.931-6.931z"/>\n    </svg>\n`;
  function createOverlayElement() {
    const overlay = document.createElement("div");
    overlay.className = "tm-video-overlay";
    overlay.style.zIndex = "2000000000";
    return overlay;
  }
  function createContainerElement(defaultHeight, defaultMinHeight) {
    const container = document.createElement("div");
    container.className = "tm-video-container";
    container.style.height = `${defaultHeight}px`;
    container.style.minHeight = `${defaultMinHeight}px`;
    return container;
  }
  function createPlayerContainerElement(isSidebarHidden, sidebarPosition) {
    const playerContainer = document.createElement("div");
    playerContainer.className = "tm-player-container";
    playerContainer.style.zIndex = "2000000001";
    if (isSidebarHidden) {
      playerContainer.classList.add("tm-sidebar-hidden");
    }
    if (sidebarPosition === "left") {
      playerContainer.classList.add("tm-sidebar-left");
    }
    return playerContainer;
  }
  function createResizeHandleElement() {
    const handleContainer = document.createElement("div");
    handleContainer.className = "tm-handle-container";
    const handle = document.createElement("div");
    handle.className = "tm-resize-handle";
    handle.insertAdjacentHTML("beforeend", `\n        <div style="\n            position: absolute;\n            left: -10px;\n            right: -10px;\n            top: -15px;\n            bottom: -15px;\n            background: transparent;\n        "></div>\n    `);
    handleContainer.appendChild(handle);
    return {
      "handleContainer": handleContainer,
      "handle": handle
    };
  }
  function createCloseButtonElement() {
    const closeBtn = document.createElement("button");
    closeBtn.className = "tm-close-button tm-control-button-base";
    const closeIcon = `\n        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>\n    `;
    closeBtn.innerHTML = closeIcon;
    return closeBtn;
  }
  function createSettingsButtonElement() {
    const settingsBtn = document.createElement("button");
    settingsBtn.className = "tm-settings-button tm-control-button-base";
    const settingsIcon = `\n        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n            <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.78628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>\n    `;
    settingsBtn.innerHTML = settingsIcon;
    return settingsBtn;
  }
  function createSidebarControlButtons(sidebarPosition, isSidebarHidden) {
    const sidebarPosBtn = document.createElement("button");
    sidebarPosBtn.className = "tm-sidebar-pos-button tm-control-button-base";
    sidebarPosBtn.style.display = "flex";
    sidebarPosBtn.innerHTML = sidebarPosition === "right" ? LAYOUT_LEFT : LAYOUT_RIGHT;
    sidebarPosBtn.title = sidebarPosition === "right" ? "切换侧边栏到左侧" : "切换侧边栏到右侧";
    const sidebarToggleBtn = document.createElement("button");
    sidebarToggleBtn.className = "tm-sidebar-toggle-button tm-control-button-base";
    sidebarToggleBtn.style.display = "flex";
    sidebarToggleBtn.innerHTML = isSidebarHidden ? COMMENTS_SHOW : COMMENTS_HIDE;
    sidebarToggleBtn.title = isSidebarHidden ? "显示评论区" : "隐藏评论区";
    return {
      "sidebarPosBtn": sidebarPosBtn,
      "sidebarToggleBtn": sidebarToggleBtn
    };
  }
  function createButtonContainerElement() {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "tm-button-container";
    buttonContainer.style.display = "flex";
    buttonContainer.style.alignItems = "center";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.zIndex = "99999";
    return buttonContainer;
  }
  function createSettingsPanelElement() {
    const settingsPanel = document.createElement("div");
    settingsPanel.className = "tm-settings-panel";
    return settingsPanel;
  }
  function createSpeedIndicatorElement() {
    let text = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "3x";
    const speedIndicator = document.createElement("div");
    speedIndicator.className = "tm-speed-indicator";
    speedIndicator.textContent = text;
    speedIndicator.style.position = "absolute";
    speedIndicator.style.top = "50%";
    speedIndicator.style.left = "50%";
    speedIndicator.style.transform = "translate(-50%, -50%)";
    speedIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    speedIndicator.style.color = "white";
    speedIndicator.style.padding = "8px 16px";
    speedIndicator.style.borderRadius = "4px";
    speedIndicator.style.fontSize = "24px";
    speedIndicator.style.fontWeight = "bold";
    speedIndicator.style.zIndex = "9999";
    return speedIndicator;
  }
  function getVideoTitle() {
    const h4 = document.querySelector("h4");
    if (h4 && h4.textContent) {
      return h4.textContent.trim();
    }
    const h1 = document.querySelector("h1");
    if (h1 && h1.textContent) {
      return h1.textContent.trim();
    }
    let title = document.title || "";
    title = title.replace(/\s*-\s*Jable\.tv.*$/i, "");
    title = title.replace(/\s*-\s*JAVLibrary.*$/i, "");
    return title.trim();
  }
  class UIManager {
    "constructor"(playerCore) {
      this.playerCore = playerCore;
      this.targetVideo = playerCore.targetVideo;
      this.overlay = null;
      this.container = null;
      this.playerContainer = null;
      this.videoWrapper = null;
      this.handleContainer = null;
      this.handle = null;
      this.closeBtn = null;
      this.settingsBtn = null;
      this.settingsPanel = null;
      this.buttonContainer = null;
      this.titleEl = null;
      this.sidebarPosBtn = null;
      this.sidebarToggleBtn = null;
      const state = this.playerCore.options.playerState;
      this.isSidebarHidden = state ? state.settings.sidebarHidden : false;
      this.sidebarPosition = state ? state.settings.sidebarPosition : "right";
      this.safeArea = {
        "top": 44,
        "bottom": 34
      };
      this.isLandscape = false;
      this.controlsVisible = true;
      this.controlsHideTimerId = null;
      this.isMouseOverControls = false;
      this.isCustomResizedPortrait = false;
      this.isCustomResizedLandscape = false;
      this.customHeightPortrait = null;
      this.customHeightLandscape = null;
      this.managers = {};
      this.loadStyles();
    }
    "setManagers"(managers) {
      this.managers = Object.assign({}, this.managers, managers);
    }
    get "controlManager"() {
      var _this$managers, _this$playerCore;
      return ((_this$managers = this.managers) === null || _this$managers === void 0 ? void 0 : _this$managers.controlManager) || ((_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.controlManager);
    }
    get "progressManager"() {
      var _this$managers2, _this$playerCore2;
      return ((_this$managers2 = this.managers) === null || _this$managers2 === void 0 ? void 0 : _this$managers2.progressManager) || ((_this$playerCore2 = this.playerCore) === null || _this$playerCore2 === void 0 ? void 0 : _this$playerCore2.progressManager);
    }
    get "dragManager"() {
      var _this$managers3, _this$playerCore3;
      return ((_this$managers3 = this.managers) === null || _this$managers3 === void 0 ? void 0 : _this$managers3.dragManager) || ((_this$playerCore3 = this.playerCore) === null || _this$playerCore3 === void 0 ? void 0 : _this$playerCore3.dragManager);
    }
    get "swipeManager"() {
      var _this$managers4, _this$playerCore4;
      return ((_this$managers4 = this.managers) === null || _this$managers4 === void 0 ? void 0 : _this$managers4.swipeManager) || ((_this$playerCore4 = this.playerCore) === null || _this$playerCore4 === void 0 ? void 0 : _this$playerCore4.swipeManager);
    }
    get "isCustomResized"() {
      return this.isLandscape ? this.isCustomResizedLandscape : this.isCustomResizedPortrait;
    }
    set "isCustomResized"(val) {
      if (this.isLandscape) {
        this.isCustomResizedLandscape = val;
      } else {
        this.isCustomResizedPortrait = val;
      }
    }
    get "isFloatingControlPanel"() {
      return window.innerWidth >= 480;
    }
    "loadStyles"() {}
    "createUI"() {
      this.createOverlayAndContainer();
      this.createPlayerContainer();
      this.createVideoWrapper();
      this.createResizeHandle();
      this.createCloseButton();
      this.createTitle();
      this.createSettingsButton();
      this.createSidebarControls();
      this.createButtonContainer();
      this.createSettingsPanel();
      this.setupOrientationListener();
      return {
        "overlay": this.overlay,
        "container": this.container,
        "playerContainer": this.playerContainer,
        "videoWrapper": this.videoWrapper,
        "handleContainer": this.handleContainer,
        "handle": this.handle,
        "closeBtn": this.closeBtn,
        "titleEl": this.titleEl,
        "sidebarPosBtn": this.sidebarPosBtn,
        "sidebarToggleBtn": this.sidebarToggleBtn,
        "settingsBtn": this.settingsBtn,
        "settingsPanel": this.settingsPanel,
        "buttonContainer": this.buttonContainer
      };
    }
    "createOverlayAndContainer"() {
      const maxAllowedHeight = window.innerHeight * .8;
      const defaultHeight = Math.min(window.innerWidth * (4 / 5), maxAllowedHeight);
      const defaultMinHeight = Math.min(window.innerWidth * (9 / 16), maxAllowedHeight);
      this.overlay = createOverlayElement();
      this.container = createContainerElement(defaultHeight, defaultMinHeight);
    }
    "createPlayerContainer"() {
      this.playerContainer = createPlayerContainerElement(this.isSidebarHidden, this.sidebarPosition);
    }
    "createVideoWrapper"() {
      this.videoWrapper = document.createElement("div");
      this.videoWrapper.className = "tm-video-wrapper";
      if (this.targetVideo && this.targetVideo.parentNode) {
        this.targetVideo.parentNode.removeChild(this.targetVideo);
      }
      if (this.targetVideo) {
        this.targetVideo.controls = false;
        this.targetVideo.removeAttribute("controls");
        Array.from(this.targetVideo.children).forEach((child => {
          const tag = child.tagName ? child.tagName.toLowerCase() : "";
          if (tag !== "track" && tag !== "source") {
            try {
              child.remove();
            } catch (e) {}
          }
        }));
      }
      this.targetVideo.setAttribute("playsinline", "true");
      this.targetVideo.setAttribute("webkit-playsinline", "true");
      this.targetVideo.setAttribute("x5-playsinline", "true");
      this.targetVideo.playsInline = true;
      this.targetVideo.webkitPlaysInline = true;
      if (this.targetVideo.webkitDisplayingFullscreen && typeof this.targetVideo.webkitExitFullscreen === "function") {
        try {
          this.targetVideo.webkitExitFullscreen();
        } catch (_) {}
      }
      this.videoWrapper.appendChild(this.targetVideo);
      this.targetVideo.addEventListener("loadedmetadata", (() => {
        this.updateVideoAspectRatio();
      }));
      let longPressTimer = null;
      let isLongPress = false;
      let originalPlaybackRate = 1;
      this.isLongPress = false;
      this.longPressStartX = 0;
      this.longPressStartY = 0;
      const handlePointerDown = e => {
        if (e.target.closest(".tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button")) {
          return;
        }
        if (longPressTimer) {
          clearTimeout(longPressTimer);
        }
        originalPlaybackRate = this.playerCore.targetVideo.playbackRate;
        isLongPress = false;
        this.isLongPress = false;
        const touch = e.type.includes("touch");
        const touchObj = touch && e.touches ? e.touches[0] : null;
        this.longPressStartX = touchObj ? touchObj.clientX : e.clientX;
        this.longPressStartY = touchObj ? touchObj.clientY : e.clientY;
        longPressTimer = setTimeout((() => {
          isLongPress = true;
          this.isLongPress = true;
          originalPlaybackRate = this.playerCore.targetVideo.playbackRate;
          this.playerCore.targetVideo.playbackRate = 3;
          const speedIndicator = createSpeedIndicatorElement("3x");
          this.videoWrapper.appendChild(speedIndicator);
          if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
          }
          if (this.playerCore.targetVideo.paused) {
            this.playerCore.targetVideo.play();
          }
        }), 800);
      };
      const handlePointerMove = e => {
        if (longPressTimer && !isLongPress) {
          const touch = e.type.includes("touch");
          const touchObj = touch && e.touches ? e.touches[0] : null;
          if (touch && !touchObj) {
            return;
          }
          const currentX = touchObj ? touchObj.clientX : e.clientX;
          const currentY = touchObj ? touchObj.clientY : e.clientY;
          const deltaX = currentX - this.longPressStartX;
          const deltaY = currentY - this.longPressStartY;
          const dist = Math.hypot(deltaX, deltaY);
          if (dist > 10) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        }
      };
      const handlePointerUp = e => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (isLongPress) {
          this.playerCore.targetVideo.playbackRate = originalPlaybackRate;
          const speedIndicator = this.videoWrapper.querySelector(".tm-speed-indicator");
          if (speedIndicator) {
            speedIndicator.remove();
          }
          e.preventDefault();
          e.stopPropagation();
          isLongPress = false;
          this.isLongPress = false;
          return;
        }
      };
      const handlePointerLeave = e => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (isLongPress) {
          this.playerCore.targetVideo.playbackRate = originalPlaybackRate;
          const speedIndicator = this.videoWrapper.querySelector(".tm-speed-indicator");
          if (speedIndicator) {
            speedIndicator.remove();
          }
          isLongPress = false;
          this.isLongPress = false;
        }
      };
      this.videoWrapper.addEventListener("mousedown", handlePointerDown);
      this.videoWrapper.addEventListener("mouseup", handlePointerUp);
      this.videoWrapper.addEventListener("mousemove", handlePointerMove);
      this.videoWrapper.addEventListener("mouseleave", handlePointerLeave);
      this.videoWrapper.addEventListener("touchstart", handlePointerDown, {
        "passive": true
      });
      this.videoWrapper.addEventListener("touchend", handlePointerUp);
      this.videoWrapper.addEventListener("touchmove", handlePointerMove, {
        "passive": true
      });
      this.videoWrapper.addEventListener("touchcancel", handlePointerLeave);
      this.videoWrapper.addEventListener("click", (e => {
        e.stopPropagation();
        if (isLongPress) {
          return;
        }
        if (this.swipeManager && typeof this.swipeManager.wasRecentlyDragging === "function" && this.swipeManager.wasRecentlyDragging()) {
          return;
        }
        if (e.target.closest(".tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button, .tm-settings-panel")) {
          return;
        }
        const togglePlayPause = () => {
          if (!this.playerCore.targetVideo) {
            return;
          }
          if (this.playerCore.targetVideo.paused) {
            this.playerCore.targetVideo.play();
          } else {
            this.playerCore.targetVideo.pause();
            if (this.controlManager) {
              this.controlManager.showPauseIndicator();
            }
          }
          if (this.controlManager) {
            this.controlManager.updatePlayPauseButton();
          }
        };
        const isTouchPointer = e.pointerType === "touch" || window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
        if (!this.controlsVisible && isTouchPointer) {
          this.showControls();
          this.autoHideControls();
          return;
        }
        togglePlayPause();
        if (!this.controlsVisible) {
          this.showControls();
        }
        this.autoHideControls();
      }));
    }
    "createResizeHandle"() {
      const {"handleContainer": handleContainer, "handle": handle} = createResizeHandleElement();
      this.handleContainer = handleContainer;
      this.handle = handle;
      this.handle.addEventListener("mouseenter", (() => {
        this.handle.style.opacity = "1";
        this.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.8)";
      }));
      this.handle.addEventListener("mouseleave", (() => {
        if (!this.isDraggingHandle) {
          this.handle.style.opacity = "0.5";
          this.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.6)";
        }
      }));
      this.handle.addEventListener("mousedown", (() => {
        this.handle.style.cursor = "grabbing";
        if (window.navigator.vibrate) {
          window.navigator.vibrate(5);
        }
      }));
      document.addEventListener("mouseup", (() => {
        if (!this.isDraggingHandle) {
          this.handle.style.cursor = "grab";
        }
      }));
      this.handle.addEventListener("touchstart", (() => {
        this.handle.style.opacity = "1";
        this.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.8)";
        if (window.navigator.vibrate) {
          window.navigator.vibrate(5);
        }
      }), {
        "passive": true
      });
      this.handle.addEventListener("touchend", (() => {
        if (!this.isDraggingHandle) {
          this.handle.style.opacity = "0.5";
          this.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.6)";
        }
      }));
    }
    "createCloseButton"() {
      this.closeBtn = createCloseButtonElement();
    }
    "createSettingsButton"() {
      this.settingsBtn = createSettingsButtonElement();
    }
    "getVideoTitle"() {
      return getVideoTitle();
    }
    "createTitle"() {
      this.titleEl = document.createElement("span");
      this.titleEl.className = "tm-player-title";
      this.titleEl.textContent = this.getVideoTitle();
    }
    "createSidebarControls"() {
      const {"sidebarPosBtn": sidebarPosBtn, "sidebarToggleBtn": sidebarToggleBtn} = createSidebarControlButtons(this.sidebarPosition, this.isSidebarHidden);
      this.sidebarPosBtn = sidebarPosBtn;
      this.sidebarToggleBtn = sidebarToggleBtn;
      this.sidebarPosBtn.addEventListener("click", (e => {
        e.stopPropagation();
        this.toggleSidebarPosition();
      }));
      this.sidebarToggleBtn.addEventListener("click", (e => {
        e.stopPropagation();
        this.toggleSidebarVisibility();
      }));
      this.updateSidebarButtonsVisibility();
    }
    "updateSidebarButtonsVisibility"() {
      var _this$playerCore5, _state$settings;
      const state = (_this$playerCore5 = this.playerCore) === null || _this$playerCore5 === void 0 || (_this$playerCore5 = _this$playerCore5.options) === null || _this$playerCore5 === void 0 ? void 0 : _this$playerCore5.playerState;
      const showCommentsSection = (state === null || state === void 0 || (_state$settings = state.settings) === null || _state$settings === void 0 ? void 0 : _state$settings.showCommentsSection) ?? true;
      const displayVal = showCommentsSection ? "flex" : "none";
      if (this.sidebarPosBtn) {
        this.sidebarPosBtn.style.display = displayVal;
      }
      if (this.sidebarToggleBtn) {
        this.sidebarToggleBtn.style.display = displayVal;
      }
    }
    "updateSidebarPosButtonIcon"() {
      if (!this.sidebarPosBtn) {
        return;
      }
      this.sidebarPosBtn.innerHTML = this.sidebarPosition === "right" ? LAYOUT_LEFT : LAYOUT_RIGHT;
    }
    "updateSidebarToggleButtonIcon"() {
      if (!this.sidebarToggleBtn) {
        return;
      }
      this.sidebarToggleBtn.innerHTML = this.isSidebarHidden ? COMMENTS_SHOW : COMMENTS_HIDE;
    }
    "toggleSidebarPosition"() {
      this.sidebarPosition = this.sidebarPosition === "right" ? "left" : "right";
      if (this.sidebarPosition === "left") {
        this.playerContainer.classList.add("tm-sidebar-left");
      } else {
        this.playerContainer.classList.remove("tm-sidebar-left");
      }
      this.updateSidebarPosButtonIcon();
      this.sidebarPosBtn.title = this.sidebarPosition === "right" ? "切换侧边栏到左侧" : "切换侧边栏到右侧";
      const state = this.playerCore.options.playerState;
      if (state) {
        state.updateSetting("sidebarPosition", this.sidebarPosition);
      }
      const dragManager = this.dragManager;
      if (dragManager) {
        const saved = localStorage.getItem("tm-control-panel-pos");
        if (saved) {
          try {
            const savedData = JSON.parse(saved);
            if (savedData.didSnap && savedData.anchorName) {
              let newAnchor = savedData.anchorName;
              if (this.sidebarPosition === "left") {
                if (newAnchor === "TR") {
                  newAnchor = "TL";
                }
                if (newAnchor === "BR") {
                  newAnchor = "BL";
                }
              } else {
                if (newAnchor === "TL") {
                  newAnchor = "TR";
                }
                if (newAnchor === "BL") {
                  newAnchor = "BR";
                }
              }
              if (newAnchor !== savedData.anchorName) {
                savedData.anchorName = newAnchor;
                localStorage.setItem("tm-control-panel-pos", JSON.stringify(savedData));
                dragManager.restoreControlPanelPosition();
              }
            }
          } catch (e) {}
        }
      }
    }
    "toggleSidebarVisibility"() {
      this.isSidebarHidden = !this.isSidebarHidden;
      if (this.isSidebarHidden) {
        this.playerContainer.classList.add("tm-sidebar-hidden");
        this.playerContainer.classList.remove("tm-controls-docked-tr", "tm-controls-docked-br");
        this.playerContainer.style.removeProperty("--docked-controls-height");
        this.updateSidebarToggleButtonIcon();
        this.sidebarToggleBtn.title = "显示评论区";
        this.autoHideControls();
      } else {
        this.playerContainer.classList.remove("tm-sidebar-hidden");
        this.updateSidebarToggleButtonIcon();
        this.sidebarToggleBtn.title = "隐藏评论区";
        this.showControls();
        if (this.isLandscape) {
          this.autoHideControls();
        }
        if (this.dragManager) {
          this.dragManager.reapplyDockedState();
        }
      }
      this.updateButtonContainerParent();
      const state = this.playerCore.options.playerState;
      if (state) {
        state.updateSetting("sidebarHidden", this.isSidebarHidden);
      }
    }
    "updateButtonContainerParent"() {
      if (!this.buttonContainer) {
        return;
      }
      const commentPanel = this.controlManager && this.controlManager.commentPanel;
      const commentsPanelEl = commentPanel && commentPanel.commentsPanel;
      const isPcLandscape = this.isLandscape && window.innerWidth >= 930;
      const targetParent = commentsPanelEl && isPcLandscape && !this.isSidebarHidden ? commentsPanelEl : this.playerContainer;
      if (this.buttonContainer.parentNode === targetParent) {
        return;
      }
      this.buttonContainer.style.opacity = "0";
      this.buttonContainer.style.transition = "opacity 0.15s ease";
      requestAnimationFrame((() => {
        if (!this.buttonContainer) {
          return;
        }
        if (targetParent === commentsPanelEl) {
          commentsPanelEl.insertBefore(this.buttonContainer, commentsPanelEl.firstChild);
        } else if (commentsPanelEl && commentsPanelEl.parentNode === this.playerContainer) {
          this.playerContainer.insertBefore(this.buttonContainer, commentsPanelEl);
        } else {
          this.playerContainer.appendChild(this.buttonContainer);
        }
        requestAnimationFrame((() => {
          if (!this.buttonContainer) {
            return;
          }
          this.buttonContainer.style.opacity = "1";
          setTimeout((() => {
            if (this.buttonContainer) {
              this.buttonContainer.style.transition = "";
            }
          }), 200);
        }));
      }));
    }
    "createSettingsPanel"() {
      this.settingsPanel = createSettingsPanelElement();
    }
    "createButtonContainer"() {
      this.buttonContainer = createButtonContainerElement();
    }
    "setupOrientationListener"() {
      this.checkOrientation();
      const triggerLayoutUpdate = () => {
        this.checkOrientation();
        this.updateContainerMinHeight();
        this.updateVideoAspectRatio();
        if (this.progressManager) {
          this.progressManager.updateProgressBar();
          this.progressManager.updateCurrentTimeDisplay();
        }
        this.updateButtonContainerParent();
      };
      let pendingUpdate = false;
      let rafId = null;
      let resizeTimer = null;
      const scheduleLayoutUpdate = function() {
        let delay = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
        if (delay > 0) {
          setTimeout((() => scheduleLayoutUpdate(0)), delay);
          return;
        }
        if (pendingUpdate) {
          return;
        }
        pendingUpdate = true;
        rafId = requestAnimationFrame((() => {
          pendingUpdate = false;
          triggerLayoutUpdate();
        }));
      };
      if (screen && screen.orientation) {
        this.screenOrientationListener = () => {
          scheduleLayoutUpdate(0);
        };
        screen.orientation.addEventListener("change", this.screenOrientationListener);
      }
      this.orientationListener = () => {
        scheduleLayoutUpdate(200);
      };
      window.addEventListener("orientationchange", this.orientationListener);
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver((() => {
          scheduleLayoutUpdate(0);
        }));
        this.resizeObserver.observe(document.documentElement);
      }
      this.resizeListener = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout((() => {
          scheduleLayoutUpdate(0);
        }), 100);
      };
      window.addEventListener("resize", this.resizeListener);
      this._cleanupLayoutSchedulers = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        if (resizeTimer) {
          clearTimeout(resizeTimer);
        }
      };
    }
    "cleanup"() {
      if (this._cleanupLayoutSchedulers) {
        this._cleanupLayoutSchedulers();
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.orientationListener) {
        window.removeEventListener("orientationchange", this.orientationListener);
        this.orientationListener = null;
      }
      if (this.resizeListener) {
        window.removeEventListener("resize", this.resizeListener);
        this.resizeListener = null;
      }
      if (this.screenOrientationListener && screen && screen.orientation) {
        screen.orientation.removeEventListener("change", this.screenOrientationListener);
        this.screenOrientationListener = null;
      }
      if (this.controlsHideTimerId) {
        clearTimeout(this.controlsHideTimerId);
        this.controlsHideTimerId = null;
      }
    }
    "setupInteractionListeners"() {
      if (!this.overlay) {
        return;
      }
      this.playerContainer.addEventListener("mousemove", (e => {
        if (e && e.target && e.target.closest && e.target.closest(".tm-comments-panel")) {
          return;
        }
        this.showControls();
        if (this.isLandscape) {
          this.autoHideControls();
        }
      }));
      this.playerContainer.addEventListener("touchmove", (e => {
        if (e && e.target && e.target.closest && e.target.closest(".tm-comments-panel")) {
          return;
        }
        this.showControls();
        if (this.isLandscape) {
          this.autoHideControls();
        }
      }), {
        "passive": true
      });
      this.playerContainer.addEventListener("touchstart", (e => {
        if (e.target.closest(".tm-control-button, .tm-time-control-button, .tm-close-button, .tm-settings-button, .tm-sidebar-toggle-button")) {
          this.showControls();
          if (this.isLandscape) {
            this.autoHideControls();
          }
          e.stopPropagation();
        }
      }), {
        "passive": false
      });
      delegateEvent(this.playerContainer, "mouseenter", ".tm-control-buttons, .tm-settings-button, .tm-button-container, .tm-settings-panel", (() => {
        this.isMouseOverControls = true;
        if (this.controlsHideTimerId) {
          clearTimeout(this.controlsHideTimerId);
          this.controlsHideTimerId = null;
        }
      }));
      delegateEvent(this.playerContainer, "mouseleave", ".tm-control-buttons, .tm-settings-button, .tm-button-container, .tm-settings-panel", (() => {
        this.isMouseOverControls = false;
        if (this.isLandscape) {
          this.autoHideControls();
        }
      }));
    }
    "checkOrientation"() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isKeyboardActive = () => {
        const el = document.activeElement;
        if (!el) {
          return false;
        }
        const tagName = el.tagName.toLowerCase();
        return tagName === "textarea" || tagName === "input" && [ "text", "search", "url", "email", "number" ].includes(el.type);
      };
      if (isKeyboardActive()) {
        return;
      }
      const ratio = w / h;
      const PORTRAIT_THRESHOLD = .85;
      const LANDSCAPE_THRESHOLD = 1.18;
      let isLandscapeNow = this.isLandscape;
      if (ratio < PORTRAIT_THRESHOLD) {
        isLandscapeNow = false;
      } else if (ratio > LANDSCAPE_THRESHOLD) {
        isLandscapeNow = true;
      }
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (hasTouch && screen && screen.orientation && screen.orientation.type) {
        const screenType = screen.orientation.type;
        const screenIsLandscape = screenType.includes("landscape");
        if (ratio < PORTRAIT_THRESHOLD && screenIsLandscape) {
          isLandscapeNow = false;
        } else if (ratio > LANDSCAPE_THRESHOLD && !screenIsLandscape) {
          isLandscapeNow = true;
        }
      }
      if (this.isLandscape !== isLandscapeNow) {
        this.isLandscape = isLandscapeNow;
        this.handleOrientationChange();
      }
    }
    "handleOrientationChange"() {
      if (!this.isLandscape) {
        if (this.isCustomResizedPortrait && this.customHeightPortrait) {
          this.container.style.height = this.customHeightPortrait;
        }
      } else {
        this.container.style.height = "";
      }
      this.updateContainerMinHeight();
      this.updateVideoAspectRatio();
      if (this.progressManager) {
        this.progressManager.updateProgressBar();
        this.progressManager.updateCurrentTimeDisplay();
      }
      if (this.controlManager) {
        this.updateControlPanelVisibility();
      }
      if (this.dragManager) {
        this.dragManager.restoreControlPanelPosition();
      }
      if (this.isLandscape) {
        if (window.innerWidth < 930) {
          this.hideControls(true);
        } else {
          this.showControls();
          this.autoHideControls();
        }
      } else {
        this.showControls();
        if (this.controlsHideTimerId) {
          clearTimeout(this.controlsHideTimerId);
          this.controlsHideTimerId = null;
        }
      }
      this.updateButtonContainerParent();
    }
    "updateControlPanelVisibility"() {
      if (!this.controlManager) {
        return;
      }
      const controlButtons = this.controlManager.controlButtonsContainer;
      if (!controlButtons) {
        return;
      }
      const progressRow = controlButtons.querySelector(".tm-progress-row");
      const seekControlRow = controlButtons.querySelector(".tm-seek-control-row");
      const loopControlRow = controlButtons.querySelector(".tm-loop-control-row");
      const playbackControlRow = controlButtons.querySelector(".tm-playback-control-row");
      if (this.isLandscape) {
        if (progressRow) {
          progressRow.style.display = "flex";
          progressRow.style.backgroundColor = "transparent";
        }
        if (seekControlRow) {
          seekControlRow.style.display = "flex";
          seekControlRow.style.backgroundColor = "transparent";
        }
        if (loopControlRow) {
          loopControlRow.style.display = "flex";
          loopControlRow.style.backgroundColor = "transparent";
        }
        if (playbackControlRow) {
          playbackControlRow.style.display = "flex";
          playbackControlRow.style.backgroundColor = "transparent";
        }
        if (this.settingsBtn) {
          this.settingsBtn.style.display = "flex";
          this.settingsBtn.style.backgroundColor = "hsla(var(--shadcn-secondary) / 0.3)";
          this.settingsBtn.style.backdropFilter = "blur(4px)";
        }
      } else {
        if (progressRow) {
          progressRow.style.display = "";
        }
        if (seekControlRow) {
          seekControlRow.style.display = "";
        }
        if (loopControlRow) {
          loopControlRow.style.display = "";
        }
        if (playbackControlRow) {
          playbackControlRow.style.display = "";
        }
        if (this.settingsBtn) {
          this.settingsBtn.style.display = "";
          this.settingsBtn.style.backgroundColor = "";
          this.settingsBtn.style.backdropFilter = "";
        }
      }
    }
    "updateVideoAspectRatio"() {
      if (!this.videoWrapper || !this.targetVideo) {
        return;
      }
      const videoWidth = this.targetVideo.videoWidth;
      const videoHeight = this.targetVideo.videoHeight;
      if (videoWidth && videoHeight) {
        const videoRatio = videoWidth / videoHeight;
        const isVideoPortrait = videoRatio < 1;
        if (isVideoPortrait) {
          this.videoWrapper.classList.add("video-portrait");
        } else {
          this.videoWrapper.classList.remove("video-portrait");
        }
      }
    }
    "showControls"() {
      if (!this.overlay) {
        return;
      }
      this.overlay.classList.remove("controls-hidden");
      document.body.classList.remove("controls-hidden");
      this.controlsVisible = true;
      if (this.controlsHideTimerId) {
        clearTimeout(this.controlsHideTimerId);
        this.controlsHideTimerId = null;
      }
      if (!this.isLandscape) {
        const commentPanel = this.controlManager && this.controlManager.commentPanel;
        if (commentPanel && commentPanel.commentsPanel) {
          commentPanel.commentsPanel.classList.add("is-dimmed");
        }
        if (this.handleContainer) {
          this.handleContainer.classList.add("is-dimmed");
        }
      }
    }
    "hideControls"() {
      let force = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
      if (!this.overlay) {
        return;
      }
      if (!this.isLandscape && !force) {
        return;
      }
      this.overlay.classList.add("controls-hidden");
      document.body.classList.add("controls-hidden");
      this.controlsVisible = false;
      if (!this.isLandscape) {
        const commentPanel = this.controlManager && this.controlManager.commentPanel;
        if (commentPanel && commentPanel.commentsPanel) {
          commentPanel.commentsPanel.classList.remove("is-dimmed");
        }
        if (this.handleContainer) {
          this.handleContainer.classList.remove("is-dimmed");
        }
      }
    }
    "toggleControlsVisibility"() {
      if (this.controlsVisible) {
        this.hideControls();
      } else {
        this.showControls();
        this.autoHideControls();
      }
    }
    "autoHideControls"() {
      if (!this.isLandscape) {
        return;
      }
      if (this.isMouseOverControls) {
        return;
      }
      if (this.controlsHideTimerId) {
        clearTimeout(this.controlsHideTimerId);
      }
      this.controlsHideTimerId = setTimeout((() => {
        this.hideControls();
      }), 3e3);
    }
    "updateContainerMinHeight"() {
      if (!this.container || !this.targetVideo) {
        return;
      }
      if (this.isLandscape) {
        return;
      }
      const maxAllowedHeight = window.innerHeight * .8;
      let minHeight = window.innerWidth * (9 / 16);
      if (videoWidth && videoHeight) {
        minHeight = window.innerWidth * (videoHeight / videoWidth);
      }
      minHeight = Math.min(minHeight, maxAllowedHeight);
      this.container.style.minHeight = `${minHeight}px`;
      if (!this.isCustomResized) {
        const defaultHeight = Math.min(window.innerWidth * (4 / 5), maxAllowedHeight);
        this.container.style.height = `${defaultHeight}px`;
      } else if (this.customHeightPortrait) {
        const currentHeight = parseFloat(this.customHeightPortrait);
        if (currentHeight < minHeight) {
          this.container.style.height = `${minHeight}px`;
          this.customHeightPortrait = `${minHeight}px`;
        } else {
          const clampedHeight = Math.min(currentHeight, maxAllowedHeight);
          this.container.style.height = `${clampedHeight}px`;
        }
      }
    }
    "assembleDOM"() {
      this.container.appendChild(this.videoWrapper);
      if (this.titleEl) {
        this.playerContainer.appendChild(this.titleEl);
      }
      this.buttonContainer.appendChild(this.closeBtn);
      if (this.sidebarPosBtn) {
        this.buttonContainer.appendChild(this.sidebarPosBtn);
      }
      if (this.sidebarToggleBtn) {
        this.buttonContainer.appendChild(this.sidebarToggleBtn);
      }
      this.buttonContainer.appendChild(this.settingsBtn);
      this.playerContainer.appendChild(this.container);
      this.playerContainer.appendChild(this.handleContainer);
      const commentPanel = this.controlManager && this.controlManager.commentPanel;
      if (commentPanel && commentPanel.commentsPanel) {
        this.playerContainer.appendChild(commentPanel.commentsPanel);
        if (!this.isLandscape && this.controlsVisible) {
          commentPanel.commentsPanel.classList.add("is-dimmed");
        }
      }
      this.updateButtonContainerParent();
      this.playerContainer.appendChild(this.settingsPanel);
      if (this.controlManager && this.controlManager.controlButtonsContainer) {
        this.playerContainer.appendChild(this.controlManager.controlButtonsContainer);
      }
      document.body.appendChild(this.overlay);
      document.body.appendChild(this.playerContainer);
      this.updateContainerMinHeight();
      this.setupInteractionListeners();
    }
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      "value": t,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : e[r] = t, e;
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) {
      return t;
    }
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) {
        return i;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  class I18n {
    static get "userLang"() {
      return navigator.languages && navigator.languages[0] || navigator.language || "en";
    }
    static "translate"(id) {
      let lang = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
      const selectedLang = lang || this.userLang;
      const langObj = this.strings[selectedLang] || this.strings[selectedLang.split("-")[0]] || this.strings.en;
      return langObj[id] || this.strings.en[id];
    }
  }
  _defineProperty(I18n, "strings", {
    "en": {
      "scriptName": "Miss Player | Cinema Mode (One-handed Player)",
      "scriptDescription": "MissAV ad-free|One-handed mode|MissAV auto-expand details|MissAV auto high quality|MissAV redirect support|MissAV auto login|Custom player supporting jable po*nhub etc",
      "viewportConfigured": "Viewport configured to support safe area",
      "stylesInjected": "Styles injected",
      "enhancerInitialized": "User experience enhancer module initialized",
      "loginModuleInitialized": "Auto login module initialized",
      "initializationComplete": "Initialization complete",
      "initializationFailed": "Initialization failed",
      "play": "Play",
      "pause": "Pause",
      "mute": "Mute",
      "unmute": "Unmute",
      "fullscreen": "Fullscreen",
      "exitFullscreen": "Exit Fullscreen",
      "settings": "Settings",
      "quality": "Quality",
      "speed": "Speed",
      "autoplay": "Auto Play",
      "loop": "Loop",
      "loopStart": "Loop Start",
      "loopEnd": "Loop End",
      "send": "Send",
      "commentsTitle": "Comments",
      "commentsCount": "{n} Comments",
      "commentsLeave": "Leave Comment",
      "commentsExpand": "Expand",
      "commentsCollapse": "Collapse",
      "commentsPlaceholder": "Write a comment...",
      "commentsFilterSpam": "Filter Spam",
      "commentsCopyAll": "Copy All",
      "commentsLoadMore": "Load More",
      "commentsLoading": "Loading comments...",
      "commentsNoComments": "No comments yet",
      "commentsError": "Failed to load comments",
      "tabJable": "Jable.tv Comments",
      "tabJavlibComment": "JAVLib Comments",
      "tabJavlibReview": "JAVLib Reviews",
      "tabComments": "Comments",
      "autoQuality": "Auto Quality",
      "helpImprove": "Help improve",
      "helpImproveDesc": "Collect necessary data to improve features",
      "pauseOnBlur": "Stop playback on blur",
      "pauseOnBlurDesc": "Automatically pause video when switching tabs or losing focus",
      "buttonSound": "Button Sound",
      "buttonSoundDesc": "Play tactile audio feedback when clicking control panel buttons",
      "webdavTitle": "Cloud Sync (WebDAV)",
      "webdavServerUrl": "Server URL",
      "webdavUsername": "Username",
      "webdavPassword": "Password / App Token",
      "webdavBackupPath": "Backup Directory Path",
      "webdavCurrentDevice": "Current Device",
      "webdavTestConnection": "Test Connect",
      "webdavSyncMerge": "Smart Merge Sync",
      "webdavUploadOverwrite": "Upload Overwrite",
      "webdavDownloadOverwrite": "Download Overwrite",
      "webdavTesting": "Testing connection...",
      "webdavTestSuccess": "WebDAV connection & directory verified!",
      "webdavTestFailed": "Connection failed, check URL or credentials",
      "webdavSyncing": "Syncing data...",
      "webdavSyncSuccess": "Cloud sync completed successfully!",
      "webdavSyncFailed": "Sync failed: ",
      "webdavLastSync": "Last Sync",
      "webdavNeverSynced": "Never synced",
      "webdavAutoSync": "Auto Sync",
      "webdavAutoSyncDesc": "Auto background sync on launch & marker changes",
      "webdavConfirmUpload": "Are you sure you want to force upload local config to cloud? This will overwrite the backup on WebDAV.",
      "webdavConfirmDownload": "Are you sure you want to download and overwrite local config? This will replace settings and markers on this device.",
      "loadingError": "Failed to load video",
      "networkError": "Network error",
      "loginSuccess": "Login successful",
      "loginFailed": "Login failed",
      "login_accountNull": "Error: Email or password is empty.",
      "login_success": "Login successful, refreshing the page.",
      "login_networkFailed": "Status code error.",
      "login_failed": "Login failed, incorrect email or password. Check console for error details.",
      "login_autoLogin": "Auto Login"
    },
    "zh-CN": {
      "scriptName": "Miss Player | 影院模式 (单手播放器)",
      "scriptDescription": "MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器 支持 jable po*nhub 等通用",
      "viewportConfigured": "已配置viewport以支持安全区域",
      "stylesInjected": "样式注入完成",
      "enhancerInitialized": "用户体验增强模块已初始化",
      "loginModuleInitialized": "自动登录模块已初始化",
      "initializationComplete": "初始化完成",
      "initializationFailed": "初始化失败",
      "play": "播放",
      "pause": "暂停",
      "mute": "静音",
      "unmute": "取消静音",
      "fullscreen": "全屏",
      "exitFullscreen": "退出全屏",
      "settings": "设置",
      "quality": "画质",
      "speed": "速度",
      "autoplay": "自动播放",
      "loop": "循环播放",
      "loopStart": "循环起点",
      "loopEnd": "循环终点",
      "send": "发送",
      "commentsTitle": "评论区",
      "commentsCount": "共 {n} 条评论",
      "commentsLeave": "留言",
      "commentsExpand": "展开",
      "commentsCollapse": "收起",
      "commentsPlaceholder": "说点什么吧...",
      "commentsFilterSpam": "过滤灌水",
      "commentsCopyAll": "复制全部",
      "commentsLoadMore": "加载更多",
      "commentsLoading": "正在采集评论...",
      "commentsNoComments": "暂无评论",
      "commentsError": "评论采集失败",
      "tabJable": "Jable.tv 评论",
      "tabJavlibComment": "JAVLib 评论",
      "tabJavlibReview": "JAVLib 文章",
      "tabComments": "评论",
      "autoQuality": "自动画质",
      "helpImprove": "帮助改进",
      "helpImproveDesc": "收集必要数据用于改进功能",
      "pauseOnBlur": "失焦后停止播放",
      "pauseOnBlurDesc": "页面离开或失去焦点时自动暂停播放",
      "buttonSound": "按键点击音效",
      "buttonSoundDesc": "点击控制面板按钮时播放清脆触控反馈音效",
      "webdavTitle": "云端同步 (WebDAV)",
      "webdavServerUrl": "服务器地址",
      "webdavUsername": "用户名",
      "webdavPassword": "密码 / 应用授权码",
      "webdavBackupPath": "备份目录路径",
      "webdavCurrentDevice": "当前设备",
      "webdavTestConnection": "测试连接",
      "webdavSyncMerge": "智能合并同步",
      "webdavUploadOverwrite": "上传覆盖",
      "webdavDownloadOverwrite": "下载覆盖",
      "webdavTesting": "正在测试连接...",
      "webdavTestSuccess": "WebDAV 连接与目录创建成功！",
      "webdavTestFailed": "连接失败，请检查地址或账号密码",
      "webdavSyncing": "正在同步数据...",
      "webdavSyncSuccess": "云端同步成功完成！",
      "webdavSyncFailed": "同步失败: ",
      "webdavLastSync": "上次同步",
      "webdavNeverSynced": "尚未同步",
      "webdavAutoSync": "自动同步",
      "webdavAutoSyncDesc": "启动及打点修改时自动在后台静默合并",
      "webdavConfirmUpload": "确定要将当前本地配置强制覆盖到云端吗？这将替换 WebDAV 上的所有备份数据。",
      "webdavConfirmDownload": "确定要从云端拉取配置并覆盖本地吗？这将替换此设备上的当前设置与打点数据。",
      "loadingError": "视频加载失败",
      "networkError": "网络错误",
      "loginSuccess": "登录成功",
      "loginFailed": "登录失败",
      "login_accountNull": "邮箱或密码为空",
      "login_success": "登录成功，即将刷新页面。",
      "login_networkFailed": "状态码错误",
      "login_failed": "登录失败，邮箱或密码错误，可以在控制台查看错误信息。",
      "login_autoLogin": "自动登录"
    },
    "zh-TW": {
      "scriptName": "Miss Player | 影院模式 (單手播放器)",
      "scriptDescription": "MissAV去廣告|單手模式|MissAV自動展開詳情|MissAV自動高畫質|MissAV重定向支持|MissAV自動登錄|定制播放器 支持 jable po*nhub 等通用",
      "viewportConfigured": "已配置viewport以支持安全區域",
      "stylesInjected": "樣式注入完成",
      "enhancerInitialized": "用戶體驗增強模塊已初始化",
      "loginModuleInitialized": "自動登錄模塊已初始化",
      "initializationComplete": "初始化完成",
      "initializationFailed": "初始化失敗",
      "play": "播放",
      "pause": "暫停",
      "mute": "靜音",
      "unmute": "取消靜音",
      "fullscreen": "全屏",
      "exitFullscreen": "退出全屏",
      "settings": "設置",
      "quality": "畫質",
      "speed": "速度",
      "autoplay": "自動播放",
      "loop": "循環播放",
      "loopStart": "循環起點",
      "loopEnd": "循環終點",
      "send": "發送",
      "commentsTitle": "評論區",
      "commentsCount": "共 {n} 條評論",
      "commentsLeave": "留言",
      "commentsExpand": "展開",
      "commentsCollapse": "收起",
      "commentsPlaceholder": "說點什麼吧...",
      "commentsFilterSpam": "過濾灌水",
      "commentsCopyAll": "複製全部",
      "commentsLoadMore": "載入更多",
      "commentsLoading": "正在採集評論...",
      "commentsNoComments": "暫無評論",
      "commentsError": "評論採集失敗",
      "tabJable": "Jable.tv 評論",
      "tabJavlibComment": "JAVLib 評論",
      "tabJavlibReview": "JAVLib 文章",
      "tabComments": "評論",
      "autoQuality": "自動畫質",
      "helpImprove": "幫助改進",
      "helpImproveDesc": "收集必要數據用於改進功能",
      "pauseOnBlur": "失焦後停止播放",
      "pauseOnBlurDesc": "頁面離開或失去焦點時自動暫停播放",
      "buttonSound": "按鍵點擊音效",
      "buttonSoundDesc": "點擊控制面板按鈕時播放清脆觸控反饋音效",
      "webdavTitle": "雲端同步 (WebDAV)",
      "webdavServerUrl": "伺服器位址",
      "webdavUsername": "用戶名",
      "webdavPassword": "密碼 / 應用授權碼",
      "webdavBackupPath": "備份目錄路徑",
      "webdavCurrentDevice": "當前設備",
      "webdavTestConnection": "測試連線",
      "webdavSyncMerge": "智慧合併同步",
      "webdavUploadOverwrite": "上傳覆蓋",
      "webdavDownloadOverwrite": "下載覆蓋",
      "webdavTesting": "正在測試連線...",
      "webdavTestSuccess": "WebDAV 連線與目錄建立成功！",
      "webdavTestFailed": "連線失敗，請檢查位址或帳號密碼",
      "webdavSyncing": "正在同步資料...",
      "webdavSyncSuccess": "雲端同步成功完成！",
      "webdavSyncFailed": "同步失敗: ",
      "webdavLastSync": "上次同步",
      "webdavNeverSynced": "尚未同步",
      "webdavAutoSync": "自動同步",
      "webdavAutoSyncDesc": "啟動及打點修改時自動在後台靜默合併",
      "webdavConfirmUpload": "確定要將當前本地配置強制覆蓋到雲端嗎？這將替換 WebDAV 上的所有備份資料。",
      "webdavConfirmDownload": "確定要從雲端拉取配置並覆蓋本地嗎？這將替換此設備上的當前設置與打點資料。",
      "loadingError": "視頻加載失敗",
      "networkError": "網絡錯誤",
      "loginSuccess": "登錄成功",
      "loginFailed": "登錄失敗",
      "login_accountNull": "郵箱或密碼為空",
      "login_success": "登錄成功，即將刷新頁面。",
      "login_networkFailed": "狀態碼錯誤",
      "login_failed": "登錄失敗，郵箱或密碼錯誤，可以在控制台查看錯誤信息。",
      "login_autoLogin": "自動登錄"
    },
    "ja": {
      "scriptName": "Miss Player | シネマモード (片手プレーヤー)",
      "scriptDescription": "MissAV広告なし|片手モード|MissAV自動詳細展開|MissAV自動高画質|MissAVリダイレクトサポート|MissAV自動ログイン|jable po*nhub などをサポートするカスタムプレーヤー",
      "viewportConfigured": "セーフエリアをサポートするためにビューポートを設定しました",
      "stylesInjected": "スタイルが注入されました",
      "enhancerInitialized": "ユーザー体験向上モジュールが初期化されました",
      "loginModuleInitialized": "自動ログインモジュールが初期化されました",
      "initializationComplete": "初期化が完了しました",
      "initializationFailed": "初期化に失敗しました",
      "play": "再生",
      "pause": "一時停止",
      "mute": "ミュート",
      "unmute": "ミュート解除",
      "fullscreen": "全画面",
      "exitFullscreen": "全画面解除",
      "settings": "設定",
      "quality": "画質",
      "speed": "速度",
      "autoplay": "自動再生",
      "loop": "ループ再生",
      "loopStart": "ループ開始点",
      "loopEnd": "ループ終了点",
      "commentsTitle": "コメント欄",
      "commentsCount": "{n} 件のコメント",
      "commentsLeave": "コメント",
      "commentsExpand": "展開",
      "commentsCollapse": "折りたたむ",
      "commentsPlaceholder": "コメントを書く...",
      "commentsFilterSpam": "スパムを除外",
      "commentsCopyAll": "すべてコピー",
      "commentsLoadMore": "もっと読み込む",
      "commentsLoading": "コメントを読み込み中...",
      "commentsNoComments": "コメントはまだありません",
      "commentsError": "コメントの読み込みに失敗しました",
      "tabJable": "Jable.tv コメント",
      "tabJavlibComment": "JAVLib コメント",
      "tabJavlibReview": "JAVLib レビュー",
      "tabComments": "コメント",
      "autoQuality": "自動画质",
      "helpImprove": "改善に協力",
      "helpImproveDesc": "機能改善のために必要なデータを収集します",
      "pauseOnBlur": "フォーカス外で再生停止",
      "pauseOnBlurDesc": "タブ切替やフォーカス喪失時に再生を一時停止",
      "buttonSound": "ボタン効果音",
      "buttonSoundDesc": "コントロールパネルのボタンクリック時に触覚フィードバック音を再生",
      "webdavTitle": "クラウド同期 (WebDAV)",
      "webdavServerUrl": "サーバーアドレス",
      "webdavUsername": "ユーザー名",
      "webdavPassword": "パスワード / アプリトークン",
      "webdavBackupPath": "バックアップディレクトリパス",
      "webdavCurrentDevice": "現在のデバイス",
      "webdavTestConnection": "接続テスト",
      "webdavSyncMerge": "スマートマージ同期",
      "webdavUploadOverwrite": "アップロード上書き",
      "webdavDownloadOverwrite": "ダウンロード上書き",
      "webdavTesting": "接続をテスト中...",
      "webdavTestSuccess": "WebDAVの接続とディレクトリ作成に成功しました！",
      "webdavTestFailed": "接続に失敗しました。URLまたは認証情報を確認してください",
      "webdavSyncing": "データを同期中...",
      "webdavSyncSuccess": "クラウド同期が正常に完了しました！",
      "webdavSyncFailed": "同期に失敗しました: ",
      "webdavLastSync": "前回の同期",
      "webdavNeverSynced": "未同期",
      "webdavAutoSync": "自動同期",
      "webdavAutoSyncDesc": "起動時やマーカー変更時にバックグラウンドで自動同期",
      "webdavConfirmUpload": "現在のローカル設定をクラウドに強制上書きしますか？WebDAV上のバックアップが置き換えられます。",
      "webdavConfirmDownload": "クラウドから設定をダウンロードしてローカルを上書きしますか？このデバイスの設定とマーカーが置き換えられます。",
      "loadingError": "動画の読み込みに失敗しました",
      "networkError": "ネットワークエラー",
      "loginSuccess": "ログイン成功",
      "loginFailed": "ログイン失敗",
      "login_accountNull": "エラー：メールアドレスまたはパスワードが空です。",
      "login_success": "ログイン成功、ページを更新します。",
      "login_networkFailed": "ステータスコードエラー",
      "login_failed": "ログインに失敗しました。メールアドレスまたはパスワードが間違っています。エラーの詳細はコンソールで確認できます。",
      "login_autoLogin": "自動ログイン"
    },
    "vi": {
      "scriptName": "Miss Player | Chế độ Rạp chiếu phim (Trình phát một tay)",
      "scriptDescription": "MissAV không quảng cáo|Chế độ một tay|MissAV tự động mở rộng chi tiết|MissAV tự động chất lượng cao|Hỗ trợ chuyển hướng MissAV|Đăng nhập tự động MissAV|Trình phát tùy chỉnh hỗ trợ jable po*nhub v.v.",
      "viewportConfigured": "Đã cấu hình viewport để hỗ trợ vùng an toàn",
      "stylesInjected": "Đã tiêm CSS",
      "enhancerInitialized": "Đã khởi tạo mô-đun nâng cao trải nghiệm người dùng",
      "loginModuleInitialized": "Đã khởi tạo mô-đun đăng nhập tự động",
      "initializationComplete": "Khởi tạo hoàn tất",
      "initializationFailed": "Khởi tạo thất bại",
      "play": "Phát",
      "pause": "Tạm dừng",
      "mute": "Tắt tiếng",
      "unmute": "Bật tiếng",
      "fullscreen": "Toàn màn hình",
      "exitFullscreen": "Thoát toàn màn hình",
      "settings": "Cài đặt",
      "quality": "Chất lượng",
      "speed": "Tốc độ",
      "autoplay": "Tự động phát",
      "loop": "Lặp lại",
      "loopStart": "Điểm bắt đầu lặp",
      "loopEnd": "Điểm kết thúc lặp",
      "commentsTitle": "Bình luận",
      "commentsCount": "{n} bình luận",
      "commentsLeave": "Bình luận",
      "commentsExpand": "Mở rộng",
      "commentsCollapse": "Thu gọn",
      "commentsPlaceholder": "Viết bình luận...",
      "commentsFilterSpam": "Lọc rác",
      "commentsCopyAll": "Sao chép tất cả",
      "commentsLoadMore": "Tải thêm",
      "commentsLoading": "Đang tải bình luận...",
      "commentsNoComments": "Chưa có bình luận nào",
      "commentsError": "Không thể tải bình luận",
      "tabJable": "Bình luận Jable.tv",
      "tabJavlibComment": "Bình luận JAVLib",
      "tabJavlibReview": "Bài viết JAVLib",
      "tabComments": "Bình luận",
      "autoQuality": "Chất lượng tự động",
      "helpImprove": "Giúp cải thiện",
      "helpImproveDesc": "Thu thập dữ liệu cần thiết để cải thiện tính năng",
      "pauseOnBlur": "Dừng phát khi mất tiêu điểm",
      "pauseOnBlurDesc": "Tự động tạm dừng khi chuyển tab hoặc mất tiêu điểm",
      "buttonSound": "Âm thanh nút bấm",
      "buttonSoundDesc": "Phát âm thanh phản hồi khi nhấp vào nút điều khiển",
      "webdavTitle": "Đồng bộ đám mây (WebDAV)",
      "webdavServerUrl": "Địa chỉ máy chủ",
      "webdavUsername": "Tên người dùng",
      "webdavPassword": "Mật khẩu / Token ứng dụng",
      "webdavBackupPath": "Đường dẫn thư mục sao lưu",
      "webdavCurrentDevice": "Thiết bị hiện tại",
      "webdavTestConnection": "Kiểm tra kết nối",
      "webdavSyncMerge": "Đồng bộ hợp nhất",
      "webdavUploadOverwrite": "Ghi đè tải lên",
      "webdavDownloadOverwrite": "Ghi đè tải xuống",
      "webdavTesting": "Đang kiểm tra kết nối...",
      "webdavTestSuccess": "Đã xác minh kết nối WebDAV và thư mục!",
      "webdavTestFailed": "Kết nối thất bại, kiểm tra URL hoặc thông tin xác thực",
      "webdavSyncing": "Đang đồng bộ dữ liệu...",
      "webdavSyncSuccess": "Đồng bộ đám mây đã hoàn tất thành công!",
      "webdavSyncFailed": "Đồng bộ thất bại: ",
      "webdavLastSync": "Lần đồng bộ trước",
      "webdavNeverSynced": "Chưa đồng bộ",
      "webdavAutoSync": "Tự động đồng bộ",
      "webdavAutoSyncDesc": "Tự động đồng bộ dưới nền khi khởi chạy và đổi điểm đánh dấu",
      "webdavConfirmUpload": "Bạn có chắc muốn ghi đè cấu hình cục bộ lên đám mây? Việc này sẽ thay thế bản sao lưu trên WebDAV.",
      "webdavConfirmDownload": "Bạn có chắc muốn tải xuống và ghi đè cấu hình cục bộ? Việc này sẽ thay thế cài đặt và điểm đánh dấu trên thiết bị này.",
      "loadingError": "Không thể tải video",
      "networkError": "Lỗi mạng",
      "loginSuccess": "Đăng nhập thành công",
      "loginFailed": "Đăng nhập thất bại",
      "login_accountNull": "Lỗi: Email hoặc mật khẩu trống.",
      "login_success": "Đăng nhập thành công, đang làm mới trang.",
      "login_networkFailed": "Lỗi mã trạng thái.",
      "login_failed": "Đăng nhập không thành công, email hoặc mật khẩu không chính xác. Xem chi tiết lỗi trên bảng điều khiển.",
      "login_autoLogin": "Đăng nhập tự động"
    }
  });
  function __(id) {
    let lang = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    return I18n.translate(id, lang);
  }
  const globalConsole = typeof console !== "undefined" ? console : null;
  class Logger {
    "constructor"() {
      let prefix = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "[Miss Player]";
      this.prefix = prefix;
      if (typeof window !== "undefined") {
        if (!window.missPlayerLogs) {
          window.missPlayerLogs = [];
        }
      }
    }
    "_addLog"(level) {
      if (typeof window === "undefined") {
        return;
      }
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      const msg = args.map((arg => {
        if (arg instanceof Error) {
          return `${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })).join(" ");
      const logEntry = {
        "time": (new Date).toISOString(),
        "level": level,
        "msg": `${this.prefix} ${msg}`
      };
      window.missPlayerLogs.push(logEntry);
      if (window.missPlayerLogs.length > 500) {
        window.missPlayerLogs.shift();
      }
      if (globalConsole) {
        const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log";
        if (globalConsole[consoleMethod]) {
          globalConsole[consoleMethod](`${this.prefix}`, ...args);
        }
      }
    }
    "log"() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      this._addLog("info", ...args);
    }
    "info"() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      this._addLog("info", ...args);
    }
    "warn"() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      this._addLog("warn", ...args);
    }
    "error"() {
      for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }
      this._addLog("error", ...args);
    }
    "getLogsText"(filter) {
      if (typeof window === "undefined" || !window.missPlayerLogs || window.missPlayerLogs.length === 0) {
        return "No logs collected.";
      }
      let logs = window.missPlayerLogs;
      if (filter) {
        if (typeof filter === "function") {
          logs = logs.filter((l => filter(l.msg)));
        } else if (typeof filter === "string") {
          const keyword = filter.toLowerCase();
          logs = logs.filter((l => l.msg.toLowerCase().includes(keyword)));
        } else if (Array.isArray(filter)) {
          logs = logs.filter((l => {
            const msgLower = l.msg.toLowerCase();
            return filter.some((keyword => msgLower.includes(keyword.toLowerCase())));
          }));
        }
      }
      return logs.map((l => `[${l.time}] [${l.level.toUpperCase()}] ${l.msg}`)).join("\n");
    }
    "copyLogs"(filter) {
      const text = this.getLogsText(filter);
      if (typeof GM_setClipboard === "function") {
        GM_setClipboard(text);
        return true;
      }
      return false;
    }
  }
  const logger = new Logger("[Miss Player]");
  const utils_logger = null && logger;
  class CrossDomainBridge {
    static async "checkShadowActive"(siteKey) {
      try {
        if (typeof GM_getValue === "function") {
          const heartbeat = await GM_getValue(`${siteKey}_SHADOW_HEARTBEAT`, 0);
          return Date.now() - heartbeat < 5e3;
        }
      } catch (e) {}
      return false;
    }
    static "startBroker"(siteKey) {
      let handlerMap = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      const hostname = window.location.hostname;
      const sendHeartbeat = () => {
        try {
          if (typeof GM_setValue === "function") {
            GM_setValue(`${siteKey}_SHADOW_HEARTBEAT`, Date.now());
          }
        } catch (e) {}
      };
      sendHeartbeat();
      setInterval(sendHeartbeat, 2e3);
      const handleCommand = async cmd => {
        const {"txId": txId, "action": action, "payload": payload} = cmd;
        const handler = handlerMap[action];
        if (handler) {
          try {
            const result = await handler(payload);
            if (typeof GM_setValue === "function") {
              GM_setValue(`${siteKey}_RES_BRIDGE`, {
                "txId": txId,
                "status": "SUCCESS",
                "result": result,
                "timestamp": Date.now()
              });
            }
          } catch (err) {
            if (typeof GM_setValue === "function") {
              GM_setValue(`${siteKey}_RES_BRIDGE`, {
                "txId": txId,
                "status": "ERROR",
                "error": err.message || "执行异常",
                "timestamp": Date.now()
              });
            }
          }
        }
      };
      try {
        if (typeof GM_addValueChangeListener === "function") {
          GM_addValueChangeListener(`${siteKey}_CMD_BRIDGE`, (async (key, oldValue, newValue) => {
            if (!newValue) {
              return;
            }
            if (Date.now() - newValue.timestamp > 1e4) {
              return;
            }
            await handleCommand(newValue);
          }));
        } else {
          let lastTxId = "";
          setInterval((async () => {
            try {
              if (typeof GM_getValue !== "function") {
                return;
              }
              const cmd = await GM_getValue(`${siteKey}_CMD_BRIDGE`);
              if (cmd && cmd.txId !== lastTxId) {
                lastTxId = cmd.txId;
                if (Date.now() - cmd.timestamp > 1e4) {
                  return;
                }
                await handleCommand(cmd);
              }
            } catch (e) {}
          }), 1e3);
        }
      } catch (e) {}
    }
    static async "sendCommand"(siteKey, action, payload) {
      let timeout = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 15e3;
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      return new Promise((resolve => {
        let listenerId = null;
        let pollInterval = null;
        const cleanUp = () => {
          clearTimeout(timeoutId);
          if (listenerId && typeof GM_removeValueChangeListener === "function") {
            GM_removeValueChangeListener(listenerId);
          }
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        };
        const timeoutId = setTimeout((() => {
          cleanUp();
          Toast(`影子通道 [${siteKey}] 操作超时，请检查该站点的标签页是否开启`, 3e3, "error");
          resolve(false);
        }), timeout);
        const handleResponse = res => {
          cleanUp();
          if (res.status === "SUCCESS") {
            resolve(res.result !== void 0 ? res.result : true);
          } else {
            const errMsg = res.error || "执行失败";
            Toast(`通过影子页提交失败: ${errMsg}`, 3e3, "error");
            resolve(false);
          }
        };
        if (typeof GM_addValueChangeListener === "function") {
          listenerId = GM_addValueChangeListener(`${siteKey}_RES_BRIDGE`, ((key, oldValue, newValue) => {
            if (newValue && newValue.txId === txId) {
              handleResponse(newValue);
            }
          }));
        } else {
          pollInterval = setInterval((async () => {
            try {
              if (typeof GM_getValue !== "function") {
                return;
              }
              const res = await GM_getValue(`${siteKey}_RES_BRIDGE`);
              if (res && res.txId === txId) {
                handleResponse(res);
              }
            } catch (e) {}
          }), 500);
        }
        try {
          if (typeof GM_setValue === "function") {
            GM_setValue(`${siteKey}_CMD_BRIDGE`, {
              "txId": txId,
              "action": action,
              "payload": payload,
              "timestamp": Date.now()
            });
          } else {
            throw new Error("GM_setValue is not available");
          }
        } catch (e) {
          cleanUp();
          resolve(false);
        }
      }));
    }
  }
  const OBFUSCATION_SALT = "MissPlayerSalt_2026";
  const OBFUSCATION_PREFIX = "_mp_obf_:";
  function xorObfuscate(text) {
    if (!text) {
      return "";
    }
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ OBFUSCATION_SALT.charCodeAt(i % OBFUSCATION_SALT.length));
    }
    try {
      return OBFUSCATION_PREFIX + btoa(encodeURIComponent(result));
    } catch (e) {
      return OBFUSCATION_PREFIX + result;
    }
  }
  function xorDeobfuscate(text) {
    if (!text) {
      return "";
    }
    if (!text.startsWith(OBFUSCATION_PREFIX)) {
      return text;
    }
    const rawObfuscated = text.substring(OBFUSCATION_PREFIX.length);
    let decoded = rawObfuscated;
    try {
      decoded = decodeURIComponent(atob(rawObfuscated));
    } catch (e) {}
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ OBFUSCATION_SALT.charCodeAt(i % OBFUSCATION_SALT.length));
    }
    return result;
  }
  class CredentialManager {
    static "get"(siteKey) {
      const prefix = siteKey || "";
      const emailKey = `${prefix}_autologin_userEmail`;
      const passwordKey = `${prefix}_autologin_userPassword`;
      const autoLoginKey = `${prefix}_autologin_autoLogin`;
      let email = "";
      let passwordObfuscated = "";
      let autoLogin = true;
      if (typeof GM_getValue === "function") {
        try {
          email = GM_getValue(emailKey, "");
          passwordObfuscated = GM_getValue(passwordKey, "");
          autoLogin = GM_getValue(autoLoginKey, true);
        } catch (e) {}
      }
      if (!email) {
        email = getLocalStorage(emailKey, "");
        passwordObfuscated = getLocalStorage(passwordKey, "");
        autoLogin = getLocalStorage(autoLoginKey, true);
        if (!email) {
          const legacyEmailKey = `${prefix}_autologin_username`;
          const legacyEmail = getLocalStorage("autologin_userEmail", "") || getLocalStorage(legacyEmailKey, "");
          if (legacyEmail) {
            email = legacyEmail;
            passwordObfuscated = getLocalStorage("autologin_userPassword", "");
            autoLogin = getLocalStorage("autologin_autoLogin", true);
            this.save(siteKey, email, xorDeobfuscate(passwordObfuscated), autoLogin);
          }
        }
      }
      let password = "";
      if (passwordObfuscated) {
        password = xorDeobfuscate(passwordObfuscated);
        if (!passwordObfuscated.startsWith(OBFUSCATION_PREFIX) && email) {
          this.save(siteKey, email, password, autoLogin);
        }
      }
      return {
        "email": email,
        "password": password,
        "autoLogin": !!autoLogin
      };
    }
    static "save"(siteKey, email, password, autoLogin) {
      if (!siteKey) {
        return;
      }
      const prefix = siteKey;
      const emailKey = `${prefix}_autologin_userEmail`;
      const passwordKey = `${prefix}_autologin_userPassword`;
      const autoLoginKey = `${prefix}_autologin_autoLogin`;
      const passwordObfuscated = password ? xorObfuscate(password) : "";
      if (typeof GM_setValue === "function") {
        try {
          GM_setValue(emailKey, email);
          GM_setValue(passwordKey, passwordObfuscated);
          GM_setValue(autoLoginKey, autoLogin);
        } catch (e) {}
      }
      setLocalStorage(emailKey, email);
      setLocalStorage(passwordKey, passwordObfuscated);
      setLocalStorage(autoLoginKey, autoLogin);
    }
    static "clear"(siteKey) {
      if (!siteKey) {
        return;
      }
      const prefix = siteKey;
      const emailKey = `${prefix}_autologin_userEmail`;
      const passwordKey = `${prefix}_autologin_userPassword`;
      const autoLoginKey = `${prefix}_autologin_autoLogin`;
      if (typeof GM_deleteValue === "function") {
        try {
          GM_deleteValue(emailKey);
          GM_deleteValue(passwordKey);
          GM_deleteValue(autoLoginKey);
        } catch (e) {}
      }
      try {
        localStorage.removeItem(emailKey);
        localStorage.removeItem(passwordKey);
        localStorage.removeItem(autoLoginKey);
      } catch (e) {}
    }
  }
  class BaseLoginProvider {
    "constructor"() {
      let config = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.config = config;
      this.siteKey = config.siteKey || "";
      this.domains = config.domains || (0, domains.getSiteDomains)(this.siteKey) || [];
    }
    "isSupportedSite"() {
      const currentDomain = window.location.hostname;
      return this.domains.some((domain => currentDomain.includes(domain)));
    }
    "getActiveDomain"(domain) {
      if (domain) {
        return domain;
      }
      const currentDomain = window.location.hostname;
      const isMatched = this.domains.some((d => currentDomain.includes(d)));
      return isMatched ? window.location.origin : `https://${this.domains[0]}`;
    }
    async "_request"(url) {
      let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      const {"method": method = "GET", "headers": headers = {}, "body": body = null, "responseType": responseType = "json"} = options;
      const isSameOrigin = url.startsWith(window.location.origin);
      if (isSameOrigin) {
        const realFetch = typeof unsafeWindow !== "undefined" && unsafeWindow.fetch ? unsafeWindow.fetch.bind(unsafeWindow) : typeof window.fetch === "function" ? window.fetch.bind(window) : null;
        if (realFetch) {
          try {
            const fetchOptions = {
              "method": method,
              "headers": headers,
              "credentials": "same-origin"
            };
            if (body) {
              fetchOptions.body = body;
            }
            const res = await realFetch(url, fetchOptions);
            return {
              "ok": res.ok,
              "status": res.status,
              "statusText": res.statusText,
              "headers": res.headers,
              "json": () => res.json(),
              "text": () => res.text()
            };
          } catch (fetchError) {}
        }
      }
      return new Promise(((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== "function") {
          reject(new Error("GM_xmlhttpRequest is not available"));
          return;
        }
        GM_xmlhttpRequest({
          "method": method,
          "url": url,
          "headers": headers,
          "data": body,
          "withCredentials": true,
          "onload": res => {
            resolve({
              "ok": res.status >= 200 && res.status < 300,
              "status": res.status,
              "statusText": res.statusText,
              "headers": {
                "get": name => {
                  const headersText = res.responseHeaders || "";
                  const match = headersText.match(new RegExp(`^${name}:\\s*(.*)$`, "im"));
                  return match ? match[1].trim() : null;
                }
              },
              "json": async () => JSON.parse(res.responseText),
              "text": async () => res.responseText
            });
          },
          "onerror": reject
        });
      }));
    }
    "cacheLoginStatus"(isLogged) {
      if (!this.siteKey) {
        return;
      }
      const key = `mp_login_status_${this.siteKey}`;
      const timeKey = `mp_login_status_time_${this.siteKey}`;
      if (typeof GM_setValue === "function") {
        try {
          GM_setValue(key, isLogged);
          GM_setValue(timeKey, Date.now());
        } catch (e) {}
      }
      setLocalStorage(key, isLogged);
      setLocalStorage(timeKey, Date.now());
    }
    "getCachedLoginStatus"() {
      if (!this.siteKey) {
        return null;
      }
      const key = `mp_login_status_${this.siteKey}`;
      let val = null;
      if (typeof GM_getValue === "function") {
        try {
          val = GM_getValue(key, null);
        } catch (e) {}
      }
      if (val === null) {
        val = getLocalStorage(key, null);
      }
      if (typeof val === "boolean") {
        return val;
      }
      try {
        const creds = CredentialManager.get(this.siteKey);
        if (creds && creds.email && creds.password && creds.autoLogin) {
          return true;
        }
      } catch (e) {}
      return null;
    }
    async "checkLoginStatus"(domain) {
      try {
        const isLoggedIn = await this.checkLoginByAPI(domain);
        if (isLoggedIn !== null) {
          this.cacheLoginStatus(isLoggedIn);
          return isLoggedIn;
        }
        const domLogged = this.checkLoginByDOM();
        this.cacheLoginStatus(domLogged);
        return domLogged;
      } catch (error) {
        return false;
      }
    }
    async "checkLoginByAPI"(domain) {
      const apis = this.config.apis;
      if (!apis || !apis.checkStatus) {
        return null;
      }
      try {
        const activeOrigin = this.getActiveDomain(domain);
        const url = `${activeOrigin}${apis.checkStatus}`;
        const response = await this._request(url);
        if (!response.ok) {
          return null;
        }
        if (typeof this.isLoggedInByAPIResponse === "function") {
          return this.isLoggedInByAPIResponse(response);
        }
        const json = await response.json();
        const data = json.data || json;
        return data && data.user !== null && data.user !== void 0;
      } catch (error) {
        return null;
      }
    }
    "checkLoginByDOM"() {
      if (!this.isSupportedSite()) {
        return false;
      }
      const selectors = this.config.selectors;
      if (!selectors) {
        return false;
      }
      try {
        const avatar = selectors.avatar ? document.querySelector(selectors.avatar) : null;
        const userMenu = selectors.userMenu ? document.querySelector(selectors.userMenu) : null;
        const loginBtn = selectors.loginBtn ? document.querySelector(selectors.loginBtn) : null;
        if (avatar || userMenu) {
          return true;
        }
        if (loginBtn) {
          return false;
        }
        return false;
      } catch (error) {
        return false;
      }
    }
    async "addAutoLoginOption"(onLoginInfoChange) {
      const selectors = this.config.selectors;
      if (!selectors || !selectors.loginForm) {
        return;
      }
      try {
        const form = await waitForElement(selectors.loginForm);
        if (!form) {
          return;
        }
        if (form.querySelector(".mp-autologin-container")) {
          return;
        }
        const autoLoginContainer = document.createElement("div");
        autoLoginContainer.className = "mp-autologin-container";
        autoLoginContainer.style.margin = "10px 0";
        autoLoginContainer.style.display = "flex";
        autoLoginContainer.style.alignItems = "center";
        autoLoginContainer.style.gap = "8px";
        autoLoginContainer.innerHTML = `\n                <input id="mp_auto_login" type="checkbox" style="cursor: pointer; width: 16px; height: 16px;">\n                <label for="mp_auto_login" style="cursor: pointer; font-size: 13px; color: #ccc;">${__("login_autoLogin") || "自动登录 (Miss Player)"}</label>\n            `;
        const submitBtn = selectors.submitBtn ? form.querySelector(selectors.submitBtn) : form.querySelector('button[type="submit"]') || form.querySelector('input[type="submit"]');
        if (submitBtn && submitBtn.parentNode) {
          submitBtn.parentNode.insertBefore(autoLoginContainer, submitBtn);
        } else {
          form.appendChild(autoLoginContainer);
        }
        const creds = CredentialManager.get(this.siteKey);
        const autoLoginCheckbox = document.getElementById("mp_auto_login");
        if (autoLoginCheckbox) {
          autoLoginCheckbox.checked = creds.autoLogin;
          autoLoginCheckbox.addEventListener("change", (() => {
            const isChecked = autoLoginCheckbox.checked;
            CredentialManager.save(this.siteKey, creds.email, creds.password, isChecked);
            if (onLoginInfoChange) {
              onLoginInfoChange({
                "autoLogin": isChecked
              });
            }
          }));
        }
        const captureCredentials = () => {
          setTimeout((() => {
            const usernameInput = form.querySelector(selectors.usernameInput);
            const passwordInput = form.querySelector(selectors.passwordInput);
            const isAutoChecked = autoLoginCheckbox ? autoLoginCheckbox.checked : false;
            if (usernameInput && passwordInput && isAutoChecked) {
              const email = usernameInput.value;
              const password = passwordInput.value;
              if (email && password) {
                CredentialManager.save(this.siteKey, email, password, true);
                if (onLoginInfoChange) {
                  onLoginInfoChange({
                    "email": email,
                    "password": password,
                    "autoLogin": true
                  });
                }
              }
            }
          }), 100);
        };
        form.addEventListener("submit", captureCredentials);
        if (submitBtn) {
          submitBtn.addEventListener("click", captureCredentials);
        }
      } catch (error) {}
    }
    async "keepAlive"() {
      const creds = CredentialManager.get(this.siteKey);
      if (!creds.email || !creds.password || !creds.autoLogin) {
        return;
      }
      const activeDomain = this.getActiveDomain();
      try {
        const isLoggedIn = await this.checkLoginStatus(activeDomain);
        if (!isLoggedIn) {
          await this.login(creds.email, creds.password, {
            "reload": false,
            "silent": true
          });
        }
      } catch (error) {}
    }
    async "login"(username, password) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      throw new Error("login method must be implemented by subclasses");
    }
    "redirectLogin"(domain) {
      throw new Error("redirectLogin method must be implemented by subclasses");
    }
  }
  function formatErrorMessage(errors) {
    let defaultMsg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "操作失败";
    if (!errors) {
      return defaultMsg;
    }
    if (typeof errors === "string") {
      return errors;
    }
    if (Array.isArray(errors)) {
      if (errors.length === 0) {
        return defaultMsg;
      }
      return formatErrorMessage(errors[0], defaultMsg);
    }
    if (typeof errors === "object") {
      if (errors instanceof Error) {
        return errors.message;
      }
      if (errors.message && typeof errors.message === "string") {
        return errors.message;
      }
      if (errors.msg && typeof errors.msg === "string") {
        return errors.msg;
      }
      if (errors.error && typeof errors.error === "string") {
        return errors.error;
      }
      const keys = Object.keys(errors);
      if (keys.length === 0) {
        return defaultMsg;
      }
      return formatErrorMessage(errors[keys[0]], defaultMsg);
    }
    return String(errors);
  }
  class JableLoginProvider extends BaseLoginProvider {
    "constructor"() {
      super({
        "siteKey": "JABLE",
        "domains": (0, domains.getSiteDomains)("JABLE"),
        "selectors": {
          "loginForm": 'form[action*="/login/"]',
          "usernameInput": 'input[name="username"]',
          "passwordInput": 'input[name="pass"]',
          "submitBtn": 'button[type="submit"], input[type="submit"]',
          "avatar": ".user-avatar",
          "loginBtn": 'a[href*="login"]'
        }
      });
      this.checkAndStartShadowBroker();
    }
    "checkAndStartShadowBroker"() {
      if (!this.isSupportedSite()) {
        return;
      }
      CrossDomainBridge.startBroker(this.siteKey, {
        "PUBLISH_COMMENT": async payload => {
          const {"commentText": commentText, "videoCode": videoCode, "videoId": videoId, "commentFormHtml": commentFormHtml, "targetUrl": targetUrl} = payload;
          let commentForm = null;
          if (commentFormHtml) {
            const doc = (new DOMParser).parseFromString(commentFormHtml, "text/html");
            commentForm = doc.querySelector("form");
          }
          return await this.publishComment(commentText, {
            "videoCode": videoCode,
            "videoId": videoId,
            "commentForm": commentForm,
            "targetUrl": targetUrl,
            "domain": `https://${window.location.hostname}`
          });
        }
      });
    }
    async "checkLoginStatus"(domain) {
      const activeDomain = this.getActiveDomain(domain);
      if (this.isSupportedSite()) {
        const isLogged = this.checkLoginByDOM();
        this.cacheLoginStatus(isLogged);
        return isLogged;
      }
      try {
        const response = await this._request(`${activeDomain}/`);
        if (!response.ok) {
          return this.getCachedLoginStatus() ?? false;
        }
        const html = await response.text();
        if (html.includes("cf-challenge") || html.includes("Cloudflare") || html.includes("Just a moment") || html.includes("Checking your browser")) {
          return this.getCachedLoginStatus() ?? false;
        }
        const isLogged = html.includes("/logout/") || html.includes("user-avatar") || !html.includes("/login/") && html.includes("member");
        this.cacheLoginStatus(isLogged);
        return isLogged;
      } catch (e) {
        return this.getCachedLoginStatus() ?? false;
      }
    }
    "checkLoginByDOM"() {
      if (!this.isSupportedSite()) {
        return false;
      }
      try {
        const logoutBtn = document.querySelector('a[href*="logout"]') || document.querySelector(".user-avatar");
        const loginBtn = document.querySelector('a[href*="login"]');
        return !!logoutBtn || !loginBtn;
      } catch (e) {
        return false;
      }
    }
    async "login"(username, password) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      let domain = "";
      let silent = false;
      if (typeof options === "string") {
        domain = options;
      } else if (options && typeof options === "object") {
        domain = options.domain || "";
        silent = !!options.silent;
      }
      const activeDomain = this.getActiveDomain(domain);
      if (!username || !password) {
        if (!silent) {
          Toast("用户名和密码不能为空", 2e3, "error");
        }
        return false;
      }
      try {
        const body = new URLSearchParams;
        body.append("username", username);
        body.append("pass", password);
        body.append("remember_me", "1");
        body.append("action", "login");
        body.append("email_link", `${activeDomain}/email/`);
        body.append("format", "json");
        body.append("mode", "async");
        const response = await this._request(`${activeDomain}/login/`, {
          "method": "POST",
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "referer": `${activeDomain}/`,
            "origin": activeDomain
          },
          "body": body.toString()
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        if (result.status === "success" || result.html && !result.html.includes("error-field")) {
          this.cacheLoginStatus(true);
          if (!silent) {
            Toast("Jable.tv 登录成功", 2e3, "success");
          }
          return true;
        } else if (result.errors) {
          const errMsg = formatErrorMessage(result.errors, "登录失败");
          if (!silent) {
            Toast(`登录失败: ${errMsg}`, 3e3, "error");
          }
          return false;
        } else {
          if (!silent) {
            Toast("登录失败，请检查账号和密码", 3e3, "error");
          }
          return false;
        }
      } catch (error) {
        if (!silent) {
          Toast(`登录出错: ${error.message}`, 2e3, "error");
        }
        return false;
      }
    }
    "redirectLogin"(domain) {
      const activeDomain = this.getActiveDomain(domain);
      if (typeof GM_openInTab === "function") {
        GM_openInTab(`${activeDomain}/login/`, {
          "active": true,
          "insert": true,
          "setParent": true
        });
      } else {
        window.open(`${activeDomain}/login/`, "_blank");
      }
    }
    async "publishCommentViaShadow"(commentText, _ref) {
      let {"videoCode": videoCode, "videoId": videoId, "commentForm": commentForm, "targetUrl": targetUrl, "domain": domain} = _ref;
      let commentFormHtml = "";
      if (commentForm) {
        const container = document.createElement("div");
        container.appendChild(commentForm.cloneNode(true));
        commentFormHtml = container.innerHTML;
      }
      return await CrossDomainBridge.sendCommand(this.siteKey, "PUBLISH_COMMENT", {
        "commentText": commentText,
        "videoCode": videoCode,
        "videoId": videoId,
        "commentFormHtml": commentFormHtml,
        "targetUrl": targetUrl
      });
    }
    async "publishComment"(commentText, _ref2) {
      let {"videoCode": videoCode, "videoId": videoId, "commentForm": commentForm, "targetUrl": targetUrl, "domain": domain} = _ref2;
      if (!commentText) {
        Toast("评论内容不能为空", 2e3, "warning");
        return false;
      }
      if (commentText.length < 3) {
        Toast("评论内容太少，至少输入3个字", 2e3, "warning");
        return false;
      }
      const isJableLocal = this.isSupportedSite();
      if (!isJableLocal) {
        const isShadowActive = await CrossDomainBridge.checkShadowActive(this.siteKey);
        if (isShadowActive) {
          const success = await this.publishCommentViaShadow(commentText, {
            "videoCode": videoCode,
            "videoId": videoId,
            "commentForm": commentForm,
            "targetUrl": targetUrl,
            "domain": domain
          });
          if (success) {
            return true;
          }
        }
      }
      const activeDomain = this.getActiveDomain(domain);
      const activeUrl = targetUrl || `${activeDomain}/videos/${videoCode.toLowerCase()}/`;
      const bodyParams = new URLSearchParams;
      if (commentForm) {
        commentForm.querySelectorAll("input").forEach((input => {
          if (input.name && input.type !== "submit") {
            if (input.name !== "format" && input.name !== "mode") {
              bodyParams.append(input.name, input.value);
            }
          }
        }));
        const formTextarea = commentForm.querySelector("textarea");
        const textareaName = formTextarea ? formTextarea.name : "comment";
        bodyParams.append(textareaName, commentText);
      } else {
        bodyParams.append("action", "add_comment");
        if (videoId) {
          bodyParams.append("video_id", videoId);
        }
        bodyParams.append("comment", commentText);
      }
      if (!bodyParams.has("format")) {
        bodyParams.append("format", "json");
      }
      if (!bodyParams.has("mode")) {
        bodyParams.append("mode", "async");
      }
      let actionUrl = commentForm ? commentForm.getAttribute("action") || "" : "";
      if (actionUrl.startsWith("/")) {
        actionUrl = `${activeDomain}${actionUrl}`;
      } else if (!actionUrl.startsWith("http")) {
        actionUrl = activeUrl;
      }
      try {
        const response = await this._request(actionUrl, {
          "method": "POST",
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-requested-with": "XMLHttpRequest",
            "referer": activeUrl,
            "origin": activeDomain
          },
          "body": bodyParams.toString()
        });
        if (response.status === 200 || response.status === 302) {
          const resHtml = await response.text();
          try {
            const json = JSON.parse(resHtml);
            if (json.status === "success") {
              Toast("评论发表成功！", 2e3, "success");
              return true;
            } else if (json.errors) {
              const errMsg = formatErrorMessage(json.errors, "评论发表失败");
              Toast(`提交失败: ${errMsg}`, 3e3, "error");
              return false;
            }
          } catch (e) {}
          if (resHtml.includes("error-field") || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
            const docErr = (new DOMParser).parseFromString(resHtml, "text/html");
            const errEl = docErr.querySelector(".error") || docErr.querySelector(".err") || docErr.querySelector(".message-error");
            const errMsg = errEl ? errEl.textContent.trim() : "评论提交失败，可能包含敏感词或触发了频率限制。";
            Toast(errMsg, 3e3, "error");
            return false;
          } else {
            Toast("评论发表成功！", 2e3, "success");
            return true;
          }
        } else {
          Toast(`提交失败: HTTP ${response.status}`, 2e3, "error");
          return false;
        }
      } catch (err) {
        Toast("网络请求出错，请重试", 2e3, "error");
        return false;
      }
    }
  }
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(";").shift());
    }
    return null;
  }
  class MissavLoginProvider extends BaseLoginProvider {
    "constructor"() {
      super({
        "siteKey": "MISSAV",
        "domains": (0, domains.getSiteDomains)("MISSAV"),
        "selectors": {
          "loginForm": "form[x-show=\"currentPage === 'login'\"]",
          "usernameInput": 'input[id="login_email"]',
          "passwordInput": 'input[id="login_password"]',
          "submitBtn": 'button[type="submit"]',
          "avatar": ".relative.ml-3 img.h-8.w-8.rounded-full",
          "userMenu": '[x-data="{userDropdownOpen: false}"]',
          "loginBtn": "button[x-on\\:click=\"currentPage = 'login'\"]"
        },
        "apis": {
          "checkStatus": "/api/actresses/1016525/view",
          "login": "/api/login"
        }
      });
    }
    async "login"(email, password) {
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      const {"reload": reload = true, "silent": silent = false} = options;
      if (!email || !password) {
        if (!silent) {
          Toast(__("login_accountNull") || "账号和密码不能为空", 2e3, "error");
        }
        return false;
      }
      try {
        const xsrfCookie = getCookie("XSRF-TOKEN");
        const activeOrigin = this.getMissavOrigin();
        const apiUrl = `${activeOrigin}/api/login`;
        const headers = {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*"
        };
        if (xsrfCookie) {
          headers["x-xsrf-token"] = xsrfCookie;
        }
        const response = await this._request(apiUrl, {
          "method": "POST",
          "headers": headers,
          "body": JSON.stringify({
            "email": email,
            "password": password,
            "remember": true
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (!silent) {
            Toast(`登录失败: ${errorText}`, 2e3, "error");
          }
          throw new Error(__("login_networkFailed") || "网络请求失败");
        }
        const data = await response.json();
        if (!silent) {
          Toast(__("login_success") || "登录成功", 2e3, "success");
        }
        if (reload) {
          setTimeout((() => {
            location.reload();
          }), 1e3);
        }
        return true;
      } catch (error) {
        if (!silent) {
          Toast(`错误发生: ${error.message}`, 2e3, "error");
        }
        return false;
      }
    }
    "getMissavOrigin"() {
      return this.getActiveDomain();
    }
    "redirectLogin"(domain) {
      const activeDomain = this.getActiveDomain(domain);
      const loginButton = document.querySelector("button[x-on\\:click=\"currentPage = 'login'\"]") || document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
      if (loginButton) {
        loginButton.click();
        Toast("请在页面登录窗口中完成登录", 3e3, "info");
      } else {
        const redirectUrl = `${activeDomain}/cn/login`;
        if (typeof GM_openInTab === "function") {
          GM_openInTab(redirectUrl, {
            "active": true,
            "insert": true,
            "setParent": true
          });
        } else {
          window.open(redirectUrl, "_blank");
        }
      }
    }
  }
  class BaseCommentProvider {
    "constructor"(siteKey) {
      this.siteKey = siteKey;
    }
    async "fetchComments"(avCode) {
      let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      throw new Error(`[BaseCommentProvider] fetchComments not implemented for site: ${this.siteKey}`);
    }
  }
  const JABLE_DOMAINS = (0, domains.getSiteUrls)("JABLE");
  function parseCommentsHtml(html) {
    let domain = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : JABLE_DOMAINS[0];
    if (html.includes("cf-challenge") || html.includes("Turnstile") || html.includes("Checking your browser") || html.includes("cloudflare")) {
      const cfError = new Error("触发人机验证");
      cfError.status = 403;
      cfError.domain = domain;
      throw cfError;
    }
    const doc = (new DOMParser).parseFromString(html, "text/html");
    const comments = [];
    let totalCount = 0;
    const commentsContainer = doc.querySelector(".comments") || doc.querySelector(".comment-list") || doc.querySelector("#video_comments_video_comments");
    if (!commentsContainer) {
      throw new Error(`未能获取有效的评论数据 (可能因 Safari 跨域权限拦截，请在浏览器中直接打开并验证 ${new URL(domain).hostname})`);
    }
    const sub = doc.querySelector("h6.sub-title");
    if (sub) {
      const m = sub.textContent.match(/\((\d+)\)/);
      if (m) {
        totalCount = parseInt(m[1], 10);
      }
    }
    let hasMore = html.includes("載入更多") || html.includes("载入更多");
    doc.querySelectorAll("div.item[data-comment-id]").forEach((item => {
      const id = item.getAttribute("data-comment-id") || "";
      const userEl = item.querySelector(".title .pr-2 a");
      const user = userEl ? userEl.textContent.trim() : item.querySelector(".title .pr-2") ? item.querySelector(".title .pr-2").textContent.trim() : "Anonymous";
      let userUrl = userEl ? userEl.getAttribute("href") : "";
      if (userUrl && userUrl.startsWith("/")) {
        userUrl = `${domain}${userUrl}`;
      }
      const timeEl = item.querySelector(".title .inactive-color");
      const time = timeEl ? timeEl.textContent.trim() : "";
      const textEl = item.querySelector(".comment-text .original-text");
      let text = "", isPending = false;
      if (textEl) {
        const clone = textEl.cloneNode(true);
        clone.querySelectorAll("img").forEach((img => img.replaceWith(img.getAttribute("alt") || "")));
        text = clone.textContent.trim();
      } else {
        const pendEl = item.querySelector(".comment-text .inactive-color");
        if (pendEl && pendEl.textContent.includes("審核")) {
          isPending = true;
          text = pendEl.textContent.trim();
        }
      }
      if (text || user !== "Anonymous") {
        comments.push({
          "id": id,
          "user": user,
          "userUrl": userUrl,
          "time": time,
          "text": text,
          "isPending": isPending,
          "site": "jable"
        });
      }
    }));
    if (comments.length >= 10) {
      hasMore = true;
    }
    return {
      "comments": comments,
      "totalCount": totalCount,
      "hasMore": hasMore
    };
  }
  async function fetchJableComments(code) {
    let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    const slug = code.toLowerCase().trim();
    const startTime = Date.now();
    logger.log(`[CommentScraper] 开始采集 Jable 评论，番号: ${slug}, 页码: ${page}`);
    try {
      const res = await fetchWithDomainRotation(JABLE_DOMAINS, (domain => `${domain}/videos/${slug}/?mode=async&function=get_block&block_id=video_comments_video_comments&sort_by=&from=${page}&ipp=10&_=${Date.now()}`), {
        "headers": {
          "accept": "*/*",
          "x-requested-with": "XMLHttpRequest"
        },
        "timeout": 6e3
      });
      const parsed = parseCommentsHtml(res.html, res.domain);
      logger.log(`[CommentScraper] 成功采集到 Jable 评论，共 ${parsed.comments.length} 条 (总数: ${parsed.totalCount})`);
      telemetry.recordFeatureAction("comment_scrape");
      telemetry.track("comment_scrape_result", {
        "site": "jable",
        "success": true,
        "count": parsed.comments.length,
        "duration_ms": Date.now() - startTime
      });
      return {
        ...parsed,
        "domain": res.domain
      };
    } catch (err) {
      telemetry.track("comment_scrape_result", {
        "site": "jable",
        "success": false,
        "duration_ms": Date.now() - startTime
      });
      if (err.message && err.message.includes("CF_SHIELD")) {
        const cfErr = new Error("触发人机验证");
        cfErr.status = 403;
        throw cfErr;
      }
      throw err;
    }
  }
  class JableCommentProvider extends BaseCommentProvider {
    "constructor"() {
      super("jable");
      this.domains = JABLE_DOMAINS;
    }
    async "fetchComments"(avCode) {
      let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
      return fetchJableComments(avCode, page);
    }
  }
  const JAVLIB_DOMAINS = (0, domains.getSiteUrls)("JAVLIBRARY");
  function matchAvCode(a, b) {
    const clean = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return clean(a) === clean(b);
  }
  function getJavLibCookie(targetDomain) {
    if (typeof GM_getValue !== "function") {
      return "";
    }
    const cookiesMap = GM_getValue("javlib_cookies") || {};
    const getHost = urlStr => {
      try {
        return new URL(urlStr).hostname.replace(/^www\./, "");
      } catch (e) {
        return (urlStr || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      }
    };
    const targetHost = getHost(targetDomain);
    for (const key of Object.keys(cookiesMap)) {
      if (getHost(key) === targetHost) {
        return cookiesMap[key] || "";
      }
    }
    return "";
  }
  function extractVideoIdFromUrl(url) {
    if (!url) {
      return "";
    }
    const matchQuery = url.match(/[\?&]v=([^&]+)/);
    const matchHtml = url.match(/\/cn\/(jav[a-z0-9]+)\.html/i);
    return matchQuery ? matchQuery[1] : matchHtml ? matchHtml[1] : "";
  }
  function parseJavLibraryVideoIdHtml(text, cleanCode, domain) {
    if (!text || text.trim() === "") {
      throw new Error("Empty response");
    }
    if (text.includes("cf-challenge") || text.includes("Turnstile") || text.includes("Checking your browser")) {
      throw new Error("CLOUDFLARE_SHIELD");
    }
    const doc = (new DOMParser).parseFromString(text, "text/html");
    const videos = doc.querySelectorAll(".videos .video a");
    let foundId = "";
    for (const a of videos) {
      const idEl = a.querySelector(".id");
      if (idEl) {
        const codeText = idEl.textContent.trim();
        if (matchAvCode(codeText, cleanCode)) {
          const href = a.getAttribute("href") || "";
          const m = href.match(/v=([^&]+)/);
          if (m) {
            foundId = m[1];
            break;
          }
        }
      }
    }
    if (!foundId && videos.length > 0) {
      const href = videos[0].getAttribute("href") || "";
      const m = href.match(/v=([^&]+)/);
      if (m) {
        foundId = m[1];
      }
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
    throw new Error("Movie not found on JAVLibrary");
  }
  async function fetchJavLibraryVideoId(avcode) {
    if (!avcode) {
      throw new Error("Invalid AVCode");
    }
    const cleanCode = avcode.toLowerCase().trim();
    try {
      const res = await fetchWithDomainRotation(JAVLIB_DOMAINS, (domain => `${domain}/cn/vl_searchbyid.php?keyword=${encodeURIComponent(cleanCode)}`), {
        "headers": {
          "accept": "text/html,application/xhtml+xml,*/*"
        },
        "timeout": 8e3
      });
      let workingDomain = res.domain;
      if (res.finalUrl && res.finalUrl.startsWith("http")) {
        try {
          workingDomain = new URL(res.finalUrl).origin;
        } catch (e) {}
      }
      const videoId = extractVideoIdFromUrl(res.finalUrl) || parseJavLibraryVideoIdHtml(res.html, cleanCode, workingDomain);
      return {
        "videoId": videoId,
        "domain": workingDomain
      };
    } catch (err) {
      if (err.message && err.message.includes("CF_SHIELD")) {
        throw new Error(err.message);
      }
      throw err;
    }
  }
  function parseJavLibraryDataHtml(text, type, page, activeDomain) {
    if (!text || text.trim() === "") {
      throw new Error("Empty response");
    }
    if (text.includes("cf-challenge") || text.includes("Turnstile") || text.includes("Checking your browser")) {
      throw new Error(`CF_SHIELD_ON_${activeDomain}`);
    }
    const isReviews = type === "reviews";
    const doc = (new DOMParser).parseFromString(text, "text/html");
    const selector = isReviews ? "table.review" : "table.comment";
    const tables = doc.querySelectorAll(selector);
    const comments = [];
    tables.forEach(((table, index) => {
      const userEl = table.querySelector(".userid a");
      const user = userEl ? userEl.textContent.trim() : "Anonymous";
      let userUrl = userEl ? userEl.getAttribute("href") : "";
      if (userUrl) {
        if (userUrl.startsWith(".")) {
          userUrl = `${activeDomain}/cn${userUrl.substring(1)}`;
        } else if (userUrl.startsWith("/")) {
          userUrl = `${activeDomain}/cn${userUrl}`;
        } else if (!userUrl.startsWith("http")) {
          userUrl = `${activeDomain}/cn/${userUrl}`;
        }
      }
      const dateEl = table.querySelector(".date");
      const time = dateEl ? dateEl.textContent.trim() : "";
      const textarea = table.querySelector("textarea.hidden");
      const contentText = textarea ? (textarea.value || textarea.textContent || "").trim() : "";
      const ratingEl = table.querySelector('[class^="rating"]');
      const score = ratingEl ? ratingEl.getAttribute("title") : null;
      if (contentText || user !== "Anonymous") {
        comments.push({
          "id": `javlib-${type}-${page}-${index}`,
          "user": user,
          "userUrl": userUrl,
          "time": time,
          "text": contentText,
          "score": score,
          "isPending": false,
          "site": "javlib"
        });
      }
    }));
    const pageSelector = doc.querySelector(".page_selector");
    let hasMore = false;
    let totalCount = comments.length;
    if (pageSelector) {
      const nextPattern = new RegExp(`[\\?&]page=${page + 1}(?:&|$)`);
      const pageLinks = pageSelector.querySelectorAll("a");
      for (const a of pageLinks) {
        if (nextPattern.test(a.getAttribute("href") || "")) {
          hasMore = true;
          break;
        }
      }
    }
    return {
      "comments": comments,
      "totalCount": totalCount,
      "hasMore": hasMore
    };
  }
  async function fetchJavLibraryData(videoId) {
    let type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "comments";
    let page = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
    let domain = arguments.length > 3 ? arguments[3] : void 0;
    if (!videoId) {
      throw new Error("Invalid VideoId");
    }
    const isReviews = type === "reviews";
    const endpoint = isReviews ? "videoreviews.php" : "videocomments.php";
    const activeDomain = domain || JAVLIB_DOMAINS[0];
    const url = `${activeDomain}/cn/${endpoint}?v=${videoId}&page=${page}`;
    logger.log(`[CommentScraper] 采集 JAVLibrary ${type} (Page ${page}): ${url}`);
    const res = await fetchWithTransport(url, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,*/*",
        "referer": `${activeDomain}/cn/?v=${videoId}`
      },
      "timeout": 1e4
    });
    if (detectCloudflare(res.status, res.html)) {
      throw new Error(`CF_SHIELD_ON_${activeDomain}`);
    }
    return parseJavLibraryDataHtml(res.html, type, page, activeDomain);
  }
  class JavLibCommentProvider extends BaseCommentProvider {
    "constructor"() {
      super("javlib");
      this.domains = JAVLIB_DOMAINS;
    }
    async "fetchComments"(avCode) {
      let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      let videoId = options.videoId;
      let domain = options.domain;
      if (!videoId) {
        const idRes = await fetchJavLibraryVideoId(avCode);
        videoId = idRes.videoId;
        domain = idRes.domain;
      }
      const data = await fetchJavLibraryData(videoId, options.type || "comments", page, domain);
      return {
        ...data,
        "videoId": videoId,
        "domain": domain
      };
    }
  }
  function md5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32(a << s | a >>> 32 - s, b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn(b & c | ~b & d, a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn(b & d | c & ~d, a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md5blk(s) {
    var md5blks = [], i;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  function md5str(s) {
    var n = s.length, state = [ 1732584193, -271733879, -1732584194, 271733878 ], i;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    }
    tail[i >> 2] |= 128 << (i % 4 << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) {
        tail[i] = 0;
      }
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  var hex_chr = "0123456789abcdef".split("");
  function rhex(n) {
    var s = "", j = 0;
    for (;j < 4; j++) {
      s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
    }
    return s;
  }
  function add32(a, b) {
    return a + b & 4294967295;
  }
  function md5(s) {
    if (typeof s !== "string") {
      return "";
    }
    s = unescape(encodeURIComponent(s));
    var state = md5str(s);
    return rhex(state[0]) + rhex(state[1]) + rhex(state[2]) + rhex(state[3]);
  }
  const JAVDB_DOMAINS = (0, domains.getSiteUrls)("JAVDB");
  const JB_API_BASE = "https://jdforrepam.com/api";
  function jbBuildSignature() {
    const curr = Math.floor(Date.now() / 1e3);
    try {
      const stored = localStorage.getItem("jb_jdsignature");
      if (stored) {
        const parts = stored.split(".");
        if (parts.length === 3 && curr - parseInt(parts[0], 10) <= 300) {
          return stored;
        }
      }
    } catch (e) {}
    const sign = `${curr}.lpw6vgqzsp.${md5(`${curr}71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa`)}`;
    try {
      localStorage.setItem("jb_jdsignature", sign);
    } catch (e) {}
    return sign;
  }
  function jbApiGetOnce(url, params, headers) {
    return new Promise(((resolve, reject) => {
      let fullUrl = url;
      if (params && Object.keys(params).length) {
        const qs = new URLSearchParams(params).toString();
        fullUrl += (url.includes("?") ? "&" : "?") + qs;
      }
      if (typeof GM_xmlhttpRequest === "undefined") {
        reject(new Error("GM_xmlhttpRequest unavailable"));
        return;
      }
      GM_xmlhttpRequest({
        "method": "GET",
        "url": fullUrl,
        "headers": headers || {},
        "timeout": 8e3,
        "onload": resp => {
          try {
            if (resp.status >= 200 && resp.status < 300) {
              if (resp.responseText) {
                try {
                  resolve(JSON.parse(resp.responseText));
                } catch (e) {
                  resolve(resp.responseText);
                }
              } else {
                resolve(resp.responseText || resp);
              }
            } else {
              try {
                const errorData = JSON.parse(resp.responseText);
                reject(errorData);
              } catch (e) {
                reject(new Error(resp.responseText || `HTTP ${resp.status}`));
              }
            }
          } catch (e) {
            reject(e);
          }
        },
        "onerror": () => reject(new Error("API 请求失败")),
        "ontimeout": () => reject(new Error("API 请求超时"))
      });
    }));
  }
  function fetchJavdbMovieId(avcode) {
    let domainIndex = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    if (!avcode) {
      return Promise.reject(new Error("Invalid AVCode"));
    }
    const cleanCode = avcode.trim();
    const activeDomain = JAVDB_DOMAINS[domainIndex] || JAVDB_DOMAINS[0] || "https://javdb.com";
    const url = `${activeDomain}/search?q=${encodeURIComponent(cleanCode)}&f=all`;
    logger.log(`[CommentScraper] 开始获取 JavDB 影片 ID，番号: ${cleanCode}, 域名: ${activeDomain}`);
    return new Promise(((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === "undefined") {
        reject(new Error("GM_xmlhttpRequest unavailable"));
        return;
      }
      GM_xmlhttpRequest({
        "method": "GET",
        "url": url,
        "timeout": 8e3,
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        "onload"(r) {
          if (r.status === 403 || r.status === 503 || r.responseText && (r.responseText.includes("cf-challenge") || r.responseText.includes("Turnstile"))) {
            reject(new Error(`CF_SHIELD_ON_${activeDomain}`));
            return;
          }
          if (r.status >= 200 && r.status < 300) {
            if (r.finalUrl && r.finalUrl.includes("/v/")) {
              const m = r.finalUrl.match(/\/v\/([a-zA-Z0-9]+)/);
              if (m) {
                resolve({
                  "movieId": m[1],
                  "domain": activeDomain,
                  "source": "html"
                });
                return;
              }
            }
            try {
              const doc = (new DOMParser).parseFromString(r.responseText, "text/html");
              const items = doc.querySelectorAll('.movie-list .item a[href^="/v/"], .grid-item a[href^="/v/"], a[href^="/v/"]');
              let foundId = "";
              for (const a of items) {
                const href = a.getAttribute("href") || "";
                const m = href.match(/\/v\/([a-zA-Z0-9]+)/);
                if (m) {
                  const titleText = a.getAttribute("title") || a.textContent || "";
                  if (!cleanCode || matchAvCode(titleText, cleanCode)) {
                    foundId = m[1];
                    break;
                  }
                  if (!foundId) {
                    foundId = m[1];
                  }
                }
              }
              if (foundId) {
                resolve({
                  "movieId": foundId,
                  "domain": activeDomain,
                  "source": "html"
                });
                return;
              }
            } catch (e) {}
          }
          reject(new Error(`HTML search failed HTTP ${r.status}`));
        },
        "onerror"() {
          reject(new Error("Network error"));
        },
        "ontimeout"() {
          reject(new Error("Timeout"));
        }
      });
    })).catch((async htmlErr => {
      logger.warn(`[CommentScraper] JavDB 主线搜索失败 (${htmlErr.message})，正在尝试第三方 API 备用线路...`);
      try {
        var _apiRes$data;
        const sign = jbBuildSignature();
        const apiUrl = `${JB_API_BASE}/v2/search`;
        const apiRes = await jbApiGetOnce(apiUrl, {
          "q": cleanCode,
          "page": 1,
          "type": "movie",
          "limit": 1,
          "movie_type": "all",
          "from_recent": "false",
          "movie_filter_by": "all",
          "movie_sort_by": "relevance"
        }, {
          "user-agent": "Dart/3.5 (dart:io)",
          "accept-language": "zh-TW",
          "host": "jdforrepam.com",
          "jdsignature": sign
        });
        const movies = (apiRes === null || apiRes === void 0 || (_apiRes$data = apiRes.data) === null || _apiRes$data === void 0 ? void 0 : _apiRes$data.movies) || [];
        if (movies.length > 0 && movies[0].id) {
          logger.log(`[CommentScraper] 备用线路获取 JavDB movieId 成功: ${movies[0].id}`);
          return {
            "movieId": movies[0].id,
            "domain": activeDomain,
            "source": "api"
          };
        }
      } catch (apiErr) {
        logger.error(`[CommentScraper] JavDB 备用线路搜索亦失败:`, apiErr);
      }
      throw htmlErr;
    }));
  }
  function fetchJavdbData(movieId) {
    let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    let domain = arguments.length > 2 ? arguments[2] : void 0;
    if (!movieId) {
      return Promise.reject(new Error("Invalid MovieId"));
    }
    const activeDomain = domain || JAVDB_DOMAINS[0] || "https://javdb.com";
    const reviewUrl = `${activeDomain}/v/${movieId}/reviews?page=${page}`;
    logger.log(`[CommentScraper] 尝试 JavDB 主线获取短评 (Page ${page}): ${reviewUrl}`);
    const fetchMainLine = () => new Promise(((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === "undefined") {
        reject(new Error("GM_xmlhttpRequest unavailable"));
        return;
      }
      GM_xmlhttpRequest({
        "method": "GET",
        "url": reviewUrl,
        "timeout": 1e4,
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        "onload"(r) {
          if (r.status === 403 || r.status === 503 || r.responseText && (r.responseText.includes("cf-challenge") || r.responseText.includes("Turnstile"))) {
            reject(new Error(`CF_SHIELD_ON_${activeDomain}`));
            return;
          }
          if (r.status === 404) {
            reject(new Error("HTTP 404"));
            return;
          }
          if (r.status >= 200 && r.status < 300) {
            const doc = (new DOMParser).parseFromString(r.responseText, "text/html");
            const items = doc.querySelectorAll("dt.review-item");
            const comments = [];
            items.forEach(((item, index) => {
              if (item.classList.contains("more")) {
                return;
              }
              const titleEl = item.querySelector(".review-title");
              if (!titleEl) {
                return;
              }
              let userName = "匿名用户";
              for (let child of titleEl.childNodes) {
                if (child.nodeType === 3) {
                  const t = child.textContent.trim();
                  if (t.length > 0 && t.length < 30) {
                    userName = t;
                    break;
                  }
                }
              }
              const timeEl = titleEl.querySelector(".time");
              const date = timeEl ? timeEl.textContent.trim() : "";
              const starsEl = titleEl.querySelector(".score-stars");
              let goldCount = 0;
              if (starsEl) {
                goldCount = starsEl.querySelectorAll("i.icon-star:not(.gray)").length;
              }
              const contentEl = item.querySelector(".content p, .content");
              const text = contentEl ? contentEl.textContent.trim() : "";
              if (text) {
                comments.push({
                  "id": `javdb-html-${page}-${index}`,
                  "user": userName,
                  "time": date,
                  "text": text,
                  "score": goldCount,
                  "isPending": false,
                  "site": "javdb"
                });
              }
            }));
            let hasMore = false;
            const pagination = doc.querySelector(".pagination");
            if (pagination) {
              const nextBtn = pagination.querySelector('a.pagination-next, a[rel="next"], a.pagination-link[href*="page="]');
              if (nextBtn) {
                hasMore = true;
              }
            } else if (comments.length >= 20) {
              hasMore = true;
            }
            resolve({
              "comments": comments,
              "totalCount": comments.length,
              "hasMore": hasMore,
              "source": "html"
            });
            return;
          }
          reject(new Error(`HTTP ${r.status}`));
        },
        "onerror"() {
          reject(new Error("Network error"));
        },
        "ontimeout"() {
          reject(new Error("Timeout"));
        }
      });
    }));
    const fetchFallbackLine = async () => {
      var _res$data;
      logger.log(`[CommentScraper] 自动无缝切换至 JavDB 备用 API (jdforrepam.com) 抓取短评...`);
      const sign = jbBuildSignature();
      const apiUrl = `${JB_API_BASE}/v1/movies/${movieId}/reviews`;
      const res = await jbApiGetOnce(apiUrl, {
        "page": page,
        "sort_by": "hotly",
        "limit": 20
      }, {
        "jdSignature": sign
      });
      const reviews = (res === null || res === void 0 || (_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.reviews) || [];
      const comments = reviews.map(((item, index) => {
        let dateStr = "";
        if (item.created_at) {
          let d = null;
          if (typeof item.created_at === "number") {
            d = new Date(item.created_at < 1e11 ? item.created_at * 1e3 : item.created_at);
          } else if (typeof item.created_at === "string") {
            const trimmed = item.created_at.trim();
            if (/^\d+$/.test(trimmed)) {
              const num = Number(trimmed);
              d = new Date(num < 1e11 ? num * 1e3 : num);
            } else {
              d = new Date(trimmed.replace(/-/g, "/"));
              if (isNaN(d.getTime())) {
                d = new Date(trimmed);
              }
            }
          }
          if (d && !isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString("zh-CN");
          } else if (typeof item.created_at === "string" && !item.created_at.includes("Invalid")) {
            dateStr = item.created_at;
          }
        }
        return {
          "id": `javdb-api-${page}-${item.id || index}`,
          "user": item.username || "匿名用户",
          "time": dateStr,
          "text": item.content || "",
          "score": item.score || 0,
          "likes": item.likes_count || 0,
          "isPending": false,
          "site": "javdb"
        };
      }));
      const hasMore = reviews.length >= 20;
      return {
        "comments": comments,
        "totalCount": comments.length,
        "hasMore": hasMore,
        "source": "api"
      };
    };
    return fetchMainLine().catch((err => {
      if (err.message && err.message.startsWith("CF_SHIELD_ON_")) {
        return fetchFallbackLine().catch((() => Promise.reject(err)));
      }
      return fetchFallbackLine();
    }));
  }
  class JavDbCommentProvider extends BaseCommentProvider {
    "constructor"() {
      super("javdb");
      this.domains = JAVDB_DOMAINS;
    }
    async "fetchComments"(avCode) {
      let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
      let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      let movieId = options.movieId;
      let domain = options.domain;
      if (!movieId) {
        const idRes = await fetchJavdbMovieId(avCode);
        movieId = idRes.movieId;
        domain = idRes.domain;
      }
      const data = await fetchJavdbData(movieId, page, domain);
      return {
        ...data,
        "movieId": movieId,
        "domain": domain
      };
    }
  }
  const CFG = {
    "FILTER": {
      "NAME_INITIAL_EXCLUSIONS": new Set([ "ok", "good", "nice", "love", "best", "cool", "hot", "av", "vip", "lol", "wow", "omg", "no", "yes", "hi", "like", "sexy", "god", "star", "new", "old", "top", "pro", "fun", "bad", "hub", "tv" ]),
      "JABLE_EMOJI_REGEX": /:[a-zA-Z]{2,15}:/,
      "UNICODE_EMOJI_REGEX": /\p{Emoji_Presentation}/u,
      "SINGLE_DIGIT_REGEX": /^\d$/,
      "REPEATING_DIGIT_REGEX": /^(\d)\1+$/
    },
    "TIMESTAMPS": {
      "HOUR_LIMIT": 3,
      "DURATION_KEYWORDS": [ "前戏", "前戲", "办事", "辦事", "坚持", "堅持", "持续", "持續", "长达", "長達", "耐力", "抽插", "插了", "干了", "幹了", "操了", "艹了", "日了", "射了", "做了", "将近", "將近", "不到", "超过", "超過" ],
      "MINUTE_KEYWORDS": [ "分", "分钟", "m", "开始", "插入", "看点", "高潮", "必看", "必尻", "秒硬", "时间", "位置", "那段", "部分", "地方", "到", "至", "跳转", "开头", "结束", "剩", "剩余", "从", "后面", "前面" ],
      "SECOND_KEYWORDS": [ "秒", "秒钟", "s" ]
    }
  };
  const esc = s => {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  };
  function normalizeText(text) {
    if (!text) {
      return "";
    }
    let str = text;
    str = str.replace(/[\uFF01-\uFF5E]/g, (char => String.fromCharCode(char.charCodeAt(0) - 65248)));
    str = str.replace(/\u3000/g, " ").replace(/：/g, ":").replace(/。/g, ".").replace(/，/g, ",").replace(/～/g, "~").replace(/ー/g, "-").replace(/－/g, "-").replace(/(\d|分钟|分鐘|小时|小時|秒钟|秒鐘|[分秒时時hmsmHMS])\s*(?:到|至)\s*(\d)/gi, "$1~$2");
    str = str.replace(/:[a-zA-Z]{2,15}:/g, "");
    str = str.replace(/(\d+)\s*分\s*([-~～到])\s*(\d+)/g, "$1$2$3");
    str = str.replace(/(\d+)\s*秒\s*([-~～到])\s*(\d+)/g, "$1$2$3");
    str = str.replace(/(\d+)\s*:\s*(?=\d)/g, "$1:");
    str = str.replace(/(\d+)\s*\.\s*(?=\d)/g, "$1.");
    return str;
  }
  function stripEmojis(text) {
    return text.replace(/:[a-zA-Z]{2,15}:/g, "");
  }
  const surnameRegexStr = "[張张趙赵陳陈廖郭邱翁蕭萧馮冯鄧邓呂吕吳吴宋罗羅彭劉刘蔣蒋柯隋詹潘賴赖卓崔薛]";
  const schoolRegex = /(?:高中|中學|中学|大學(?!習|习)|大学(?!习|擺)|一中|國中|国中|高工|高商|商工|二信|清大|台大|世新|附中|大足一中|大足第一中学|神岡高工|大明高中|吉安國中|靜宜大學|珊瑚高中|南港高中|建國中學|文華高中|明道高中|二信中學|慧燈中學|道明中學|新竹高商|成功高中)/i;
  const masturbationWarningRegex = /(?:不要?(?:再|在)?\s*(?:自己)?\s*尻|不要?(?:再|在)?\s*(?:自己)?\s*打(?:手槍|手枪|飛機|飞机)|別(?:再|在)?\s*(?:自己)?\s*(?:尻|打|撸|擼)|别(?:再|在)?\s*(?:自己)?\s*(?:尻|打|撸|擼)|唔好(?:再|在)?\s*(?:自己)?\s*(?:打飛機|J|尻|擼|撸)|咪撚\s*(?:自己)?\s*(?:打飛機|J|尻|擼|撸)|不要一直\s*(?:自己)?\s*尻|不要一直\s*(?:自己)?\s*打(?:手槍|手枪|飛機|飞机)|别一直\s*(?:自己)?\s*尻|别在尻|别在打|别在尻|别再打了|別再打了|别打了|別打了|別擼了|别撸了|別J了|别J了|别打飞机|別打飛機|別打手槍|别打手枪|玩手槍|玩手枪|實名(?:開導|觀看|推薦|观看|开导|推荐)|实名(?:开导|观看|推荐)|又射了|縱慾過度|纵欲过度|著返條褲|別在射精|别在射精|别射精|別射精|別打手槍|别打手枪|會破皮|会破皮|别冲了|別衝了|别冲|別衝)/i;
  const plotContextRegex = /^(?:的(?:女神|女友|女朋友|男友|男朋友|时候|時候|回忆|回憶|时代|時代|样子|樣子|日子|故事|剧情|劇情|感觉|感覺|妹子|女孩|女生|男生|学妹|學妹|学姐|學姐|美女|老师|老師|同学|同學)|生|JK|jk|制服|校校服|学生|學生|女优|女優|演员|演員|少女|美少女|辣妹|熟女|人妻)/i;
  const studentActionRegex = new RegExp(`(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})(?:[我你他她]|同學|同学|同事|老師|老师|醫生|医生|老闆|老板|只有|说明|是|有|沒|没|在|別|别|不|好|快|整天|到此|生日|畢業|毕业|求求|這|气|那|大|小|長|长|屁股|逆天|牛逼|牛b|神人|實名|实名|太神|太牛|就|被|也|跟|說|说|講|讲|超|愛|爱|想|本|人|雞|鸡|的|都|要|去|戴|拿|看|打|尻|撸|擼|射|叫|做|操|肏|草|干|幹|一定|真的|早就|一直|天天|已|给|給|和|与|與|同|学|學|唱|跳|写|寫|读|讀|听|聽|走|跑|吃|喝|玩|笑|哭|买|買|卖|賣|住|用|到|来|來)`, "i");
  const comparisonNameRegex = new RegExp(`(?:不如|比|像|叫|是)\\s*(?:[\\u4e00-\\u9fa5]{1,4}\\s*)?(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})`, "i");
  const copypastaRules = [ {
    "regex": /(?:火影策划|削弱(?:黑土|通灵兽|青年|大野木|忍战|秽土)|加强(?:秽土|白面具|秽土二代|青年|水门))/i,
    "reason": "火影平衡小作文"
  }, {
    "regex": /(?:停止继续观看吧|莫因几分钟 of 几分钟的快感|一辈子的健康 and 幸福|一辈子的健康和幸福|退出这个网页|戒色|手冲再刺激|击穿你的意志|擊穿你的意志|被爱比手冲难|被愛比手沖難|我不想手冲了|我不想手沖了)/i,
    "reason": "戒色宣传/鸡汤复读"
  }, {
    "regex": /(?:求(?:一部|一个|这|那|片|视频)|谁知道(?:她|这部|这片|视频|名字|名号|是)|有谁知道|咨询(?:一个|一部|一下)(?:电影|视频|片)|封面是女佣|只记得素人|好人一生平安)/i,
    "reason": "求片/求番号模板"
  }, {
    "regex": /(?:SSNI-647：禁欲与背叛|阿丽娜|出差一个月|阿丽娜的吻)/i,
    "reason": "小作文/小说复读"
  } ];
  const friendTagRules = [ {
    "regex": /你在看(?:吗|嗎)/i,
    "reason": '圈人喊话 ("你在看吗")'
  }, {
    "regex": /有(?:來過|来过)/i,
    "reason": '圈人喊话 ("有来过吗")'
  }, {
    "regex": /(?:快去(?:尻槍|尻枪|打飛機|打手槍|打枪|打炮|洗洗睡|打手枪|打飞机))/i,
    "reason": "催促去开导/洗洗睡"
  }, {
    "regex": /(?:我知道你躲在(?:這裡|这里)|期末報告|期末报告)/i,
    "reason": "期末报告/躲在这里梗"
  }, {
    "regex": /(?:是時候|是时候)讀書了|是時候讀書|是时候读书/i,
    "reason": "催促去读书"
  }, {
    "regex": /(?:鍾意|喜欢|喜歡|爱|愛)打(?:飛機|飞机|手槍|手枪|枪|炮)/i,
    "reason": "调侃打飞机"
  }, {
    "regex": /(?:早洩|早泄|三秒|快槍手|快枪手)/i,
    "reason": "调侃早泄"
  }, {
    "regex": /(?:直接(?:開衝|开冲|開擼|开撸|開打|开打))/i,
    "reason": "直接开撸梗"
  }, {
    "regex": /(?:陳澤|陈泽)(?:是?在(?:这里|這里|環境)直播|直播)/i,
    "reason": "主播陈泽复读"
  }, {
    "regex": /(?:原神\s*[,，]?\s*启动|原神启动|加强(?:刻晴|马超|超哥|大桥|宫本|韩信|曹操)|加強(?:超哥|馬超|刻晴))/i,
    "reason": "游戏梗复读/原神启动"
  }, {
    "regex": /(?:幫看|帮看|幫忙看|帮忙看)/i,
    "reason": "圈人帮看"
  }, {
    "regex": /(?:看三小|看三小|看殺小)/i,
    "reason": '挑衅梗 ("看三小")'
  }, {
    "regex": /(?:別(?:再?|在)不上(?:課|课)在?家)/i,
    "reason": "劝诫去上课"
  }, {
    "regex": /(?:don't|dont|dont't)\s+(?:hit|play)\s+(?:airplane|handgun|gun|dick|cock|penis|off)/i,
    "reason": "英文别打飞机"
  }, {
    "regex": /(?:stop|stop\s+playing)\s+(?:hit|play|with)\s+(?:airplane|handgun|gun|dick|cock|penis|off)/i,
    "reason": "英文别打飞机"
  }, {
    "regex": /(?:\b\d{5}\b)/,
    "reason": "包含台湾高中学号 (5位)"
  }, {
    "regex": /(?:\d+班)/,
    "reason": "包含班级标识"
  }, {
    "regex": /(?:别看了|別看了|別看|别看|別J了|别J了|快去读书|快去讀書|去讀書|去读书|期末报告|期末報告)/,
    "reason": "催促去读书/别看了"
  }, {
    "regex": /(?:[\u4e00-\u9fa5]{2,4})(?:環境|直播|这可以吗|你看(?:過|过)嗎|你看(?:過|过)吗|這部可以嗎|这部可以吗|環境|直播)/,
    "reason": "圈人询问好不好看"
  }, {
    "regex": /(?:尻|打|撸|擼|射|J)爽(?:沒|了(?:沒|吗|嗎)|没)/i,
    "reason": "圈人询问开导进度"
  }, {
    "regex": /(?:請停下來|请停下来|快停手|快停下|別尻了|别尻了)/,
    "reason": "劝阻开导"
  }, {
    "regex": new RegExp("我(?:是|叫)\\s*(?:" + surnameRegexStr + "[\\u4e00-\\u9fa5]{1,2})", "i"),
    "reason": "自报家门灌水"
  }, {
    "regex": /(?:上(?:資訊|资讯|電腦|电脑|體育|体育|英文|數學|数学)課|上課|上课)/,
    "reason": "提及课上观看梗"
  }, {
    "regex": /(?:林北|老子|本帥|本帅|拎北)/,
    "reason": "粗俗自称"
  }, {
    "regex": /for a visit|visit/i,
    "reason": "英文观光团梗"
  }, {
    "regex": /(?:注意一[點点]|半斤八[觀观]|不要以[爲为]你[沒没]事|不要以[爲为]你[沒没]事)/i,
    "reason": "同学警告警告梗"
  }, {
    "regex": /(?:去找(?:新有菜|三上|波多野|女優|女优|有菜|櫻空桃|三上|橋本))/i,
    "reason": "催促同学找女优"
  }, {
    "regex": /(?:我是?你(?:好)?朋友|我是?你同學|我是?你同学)/i,
    "reason": "提及朋友/同学关系"
  }, {
    "regex": /(?:[\u4e00-\u9fa5]{2,4})(?:在吗|在嗎)/i,
    "reason": "在线圈人呼唤"
  }, {
    "regex": /(?:看你|看(?:著|着)你|一起|幫你|幫我|對著|对着|用這部|用这部|用这|用這)(?:尻|打手槍|打手枪|打飛機|打飞机|擼|撸)/,
    "reason": "提及与同学互看开导"
  }, {
    "regex": new RegExp(`(?:和|跟|長得像|长得像|長得好像|长得好像|好像|很像)(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})(?:好像|很像|$|\\s)`, "i"),
    "reason": "调侃长得像同学"
  }, {
    "regex": /(?:橫|横|豎|竖)衝|學生會|学生会|開會|开会/,
    "reason": "学生会/开会梗"
  }, {
    "regex": /不要再促搞了/,
    "reason": "南一中促搞谐音梗"
  }, {
    "regex": /(?:不要?[在再]挂睡|不要?[在再]掛睡|掛睡了|挂睡了)/i,
    "reason": "挂睡复读"
  }, {
    "regex": /(?:Kingmore|K麼|Kmo)/i,
    "reason": "Kingmore梗"
  } ];
  const adContactRules = [ {
    "regex": /(?:联系我|微信号|联系方式|p友|找长期p友|找p友|同城约|约吗|約嗎|约啊|约呗|找个(?:哥哥|妹妹|姐姐|弟弟|爸爸|主)|找m|找s|有s女|想被玩弄|同城|滴滴我|滴滴滴|私我|name传来|求主|求m|鬼女|约嘛|約嘛|找女|找男|约ㄇ|約ㄇ)/i,
    "reason": "交友/约炮关键词"
  }, {
    "regex": /(?:收费|微信|加我|微信号|微信號|加v|加V|扣扣|QQ|qq|联系我|主页有|主頁有|看主页|看主頁|主页微|主頁微|主页加|主頁加|主页扣|主頁扣|主页联系|主頁联系|主页v|主頁v|微信群|微信群)/i,
    "reason": "广告推销"
  }, {
    "regex": /(?:厦门|武汉|广州|深圳|重庆|上海|北京|四川|贵州|晋江|南京|郑州|常州|澎湖|台南|台北|台中|高雄|新竹)(?:来个|找|约|有|滴|找个|的骚妹|的妹子|男大|女大|男找女|女找男|来相会|相会|约会|见面|开房|约炮|互|约)/i,
    "reason": "同城招嫖广告"
  }, {
    "regex": /@\w+\s*,?\s*(?:怎么联系|怎麼聯繫|微信|加我)/i,
    "reason": "向他人索要联系方式"
  }, {
    "regex": /(?:\+\s*(?:Q|q|v|V|微信|LINE|Line|line))/i,
    "reason": "索要/提供加号"
  }, {
    "regex": /(?:找(?:奴|狗))/i,
    "reason": "低俗特殊癖好加友"
  }, {
    "regex": /(?:认识一下|認識一下|認識|认识)\s*[a-zA-Z0-9_]{4,}/i,
    "reason": "求加好友社交"
  }, {
    "regex": /(?:物理|有无|有無)(?:哥哥|妹妹|姐姐|弟弟|mm|MM|男生|女生|女的|男的|骚货|帅哥|美女|同城)\s*(?:喜欢|要|约|約|加|带我|c我)/i,
    "reason": "寻找约炮对象"
  }, {
    "regex": /找(?:哥哥|妹妹|姐姐|弟弟|mm|MM|男生|女生|女的|男的|帅哥|美女|同城|人陪|陪)/i,
    "reason": "寻找陪伴/约炮"
  }, {
    "regex": /(?:关注|關注|訂阅|订阅)\s*(?:我|下|頻道|频道)/i,
    "reason": "求互关广告"
  }, {
    "regex": /想被(?:c|操|幹|干|日)的(?:\+|＋|加)/i,
    "reason": "招嫖暗号引流"
  }, {
    "regex": /(?:点击|點擊|click)\s*(?:此处|此處|進入|进入)?\s*(?:下载|下載|download|观看|觀看)/i,
    "reason": "下载引流推广"
  }, {
    "regex": /(?:下载|下載|download)\s*(?:网址|網址|链接|鏈接|地址|更多|资源|資源|torrent)/i,
    "reason": "下载引流推广"
  }, {
    "regex": /(?:\.torrent|AI破解版|超清AI|破解版资源|破解版資源)/i,
    "reason": "资源推广广告"
  }, {
    "regex": /(?:116pan|windfiles|seekplayer|116pan\.xyz|windfiles\.com)/i,
    "reason": "网盘推广链接"
  }, {
    "regex": /(?:magnet:\?|ed2k:\/\/|thunder:\/\/|flashget:\/\/|qqdl:\/\/)/i,
    "reason": "磁力/电驴/迅雷等资源链接"
  }, {
    "regex": /(?:xt=urn:btih:|urn:btih:|file\|[\s\S]+\|\d+\|[a-f0-9]{32})/i,
    "reason": "BT/ED2K哈希与特征码"
  } ];
  const harassmentRules = [ {
    "regex": /(?:把她?當成|把她?当成)\s*([\\u4e00-\\u9fa5]{2,4})\s*(?:肏|操|日|做)/i,
    "reason": "意淫/带入同学代称"
  }, {
    "regex": /(?:text|只有|仅有)\d+(?:mm|cm)/i,
    "reason": "恶劣身材/尺寸贬低"
  }, {
    "regex": /(?:後悔跟你|后悔跟你)(?:分手|在一起)/,
    "reason": "同学恋爱纠纷调侃"
  }, {
    "regex": /跟(?:[\\u4e00-\\u9fa5]{2,3})的(?:小穴|逼|屁股|屁眼|大屁股|雞雞|鸡鸡)/,
    "reason": "对比同学隐私部位 the details"
  }, {
    "regex": /(?:我朋友|他朋友|同學|同学)\s*([\\u4e00-\\u9fa5]{2,4})\s*(?:處男|处男|破處|破处)/,
    "reason": "暴露同学性隐私"
  }, {
    "regex": new RegExp(`(?:骚货|骚屄|骚逼|婊子|賤人|贱人|臭甲|垃圾)(?:${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})`, "i"),
    "reason": "辱骂词后跟人名"
  } ];
  const verbMatchRegex = /想(?:这样|這麼|这么|那樣|那样)?(?:干|肏|操|日|弄|草|幹)\s*([a-zA-Z\\u4e00-\\u9fa5]{2,4})/i;
  const surname骚MatchRegex = new RegExp(`(${surnameRegexStr}[\\u4e00-\\u9fa5]{1,2})好[骚騷]啊`, "i");
  const techRules = [ {
    "regex": /(?:卡(?:的要死|死了|极了|爆了|的不行|得一比|的一比|了|得)|点解咁卡|怎么(?:那么|這麼|这么|這么)?卡)/i,
    "reason": "网站卡顿疑问"
  } ];
  const trollFightRules = [ {
    "regex": /(?:^|[^a-zA-Z0-9])(?:xo|xoxo)\s*(?:你(?:妈|媽|马)死了|是不是|老母|全家|你老味)/i,
    "reason": "评论区XO骂战"
  }, {
    "regex": /(?:禁言|臭嘴|家[裡里]失火)\s*(?:xo|xoxo)/i,
    "reason": "评论区XO撕逼"
  }, {
    "regex": /(?:割了鸡吧|怨天尤人|抢奸|xo(?:母亲|老母|媽|妈))/i,
    "reason": "评论区XO低质骂街"
  } ];
  function classifyComment(rawComment) {
    if (!rawComment || rawComment.trim() === "") {
      return {
        "label": "SPAM",
        "category": "LOW_QUALITY",
        "reason": "空评论"
      };
    }
    const normalized = normalizeText(rawComment);
    const stripped = stripEmojis(normalized);
    const cleanedForLength = stripped.replace(/\s+/g, "");
    const cleanedNoPunct = cleanedForLength.replace(/[\s\p{P}\p{S}]+/gu, "");
    const hasChinese = /[\u4e00-\u9fa5]/.test(cleanedForLength);
    for (const rule of copypastaRules) {
      if (rule.regex.test(normalized)) {
        return {
          "label": "SPAM",
          "category": "COPYPASTA",
          "reason": rule.reason
        };
      }
    }
    const schoolMatch = schoolRegex.exec(normalized);
    if (schoolMatch) {
      const afterSchool = normalized.slice(schoolMatch.index + schoolMatch[0].length, schoolMatch.index + schoolMatch[0].length + 6);
      if (!plotContextRegex.test(afterSchool)) {
        return {
          "label": "SPAM",
          "category": "FRIEND_TAG_MEME",
          "reason": `提及学校/班级背景`
        };
      }
    }
    if (masturbationWarningRegex.test(normalized)) {
      return {
        "label": "SPAM",
        "category": "FRIEND_TAG_MEME",
        "reason": `劝人别开导/打手枪梗`
      };
    }
    if (/[\u3105-\u312F\u02CA\u02CB\u02C7\u02C9]/.test(normalized)) {
      return {
        "label": "SPAM",
        "category": "FRIEND_TAG_MEME",
        "reason": `包含台湾注音（拼音圈人）`
      };
    }
    const studentActionMatch = studentActionRegex.exec(cleanedNoPunct);
    if (studentActionMatch) {
      const matchedName = studentActionMatch[0];
      if (/^(?:马上|馬上|林北|陈述|陳述|余下|于是|方便|方面|方向|方法|古代|古老|高潮|高中|高兴|高興|周围|周圍|周末|施工|施展|程度|程序|胡说|胡說|胡闹|胡鬧|朱红|朱紅|何必|何况|何況|洪水|曹操|温柔|溫柔|唐突|许多|許多|沈默|江湖|王八|李子|杨柳|楊柳|徐徐|魏然|龚自|顏色|颜色|严格|嚴格|康复|康復|阮囊|褚色|简单|簡單|游泳|学妹|学姐|学弟|学长|學妹|學姐|學弟|學長|女生|女人|旅馆|旅館|失禁|馆开)/i.test(matchedName)) {} else {
        return {
          "label": "SPAM",
          "category": "FRIEND_TAG_MEME",
          "reason": `针对同学的动作喊话`
        };
      }
    }
    if (comparisonNameRegex.test(normalized)) {
      return {
        "label": "SPAM",
        "category": "FRIEND_TAG_MEME",
        "reason": `与同学名字进行对比`
      };
    }
    for (const rule of friendTagRules) {
      if (rule.regex.test(normalized)) {
        return {
          "label": "SPAM",
          "category": "FRIEND_TAG_MEME",
          "reason": rule.reason
        };
      }
    }
    for (const rule of adContactRules) {
      if (rule.regex.test(normalized)) {
        return {
          "label": "SPAM",
          "category": "AD_CONTACT",
          "reason": rule.reason
        };
      }
    }
    for (const rule of harassmentRules) {
      if (rule.regex.test(normalized)) {
        return {
          "label": "SPAM",
          "category": "HARASSMENT_DOXXING",
          "reason": rule.reason
        };
      }
    }
    const genericExclusions = [ "女优", "女優", "女主", "他", "她", "它", "老婆", "闺蜜", "閨蜜", "妹妹", "女人", "人", "别人", "別人", "角色", "演员", "演員", "身材", "皮肤", "皮膚", "美腿", "丝袜", "絲襪", "衣服", "屁股", "大屁股", "逼", "穴", "闺密", "閨密", "妹妹", "姐姐", "前女友", "前妻" ];
    const verbMatch = verbMatchRegex.exec(normalized);
    if (verbMatch) {
      const target = verbMatch[1].trim();
      if (!genericExclusions.includes(target.toLowerCase())) {
        return {
          "label": "SPAM",
          "category": "HARASSMENT_DOXXING",
          "reason": `针对特定个人的侵害性想法: ${target}`
        };
      }
    }
    const surname骚Match = surname骚MatchRegex.exec(normalized);
    if (surname骚Match) {
      return {
        "label": "SPAM",
        "category": "HARASSMENT_DOXXING",
        "reason": `针对同学人身的性调侃: "${surname骚Match[1]}好骚啊"`
      };
    }
    for (const rule of techRules) {
      if (rule.regex.test(normalized)) {
        return {
          "label": "SPAM",
          "category": "TECHNICAL_NOISE",
          "reason": rule.reason
        };
      }
    }
    const hasJableEmoji = CFG.FILTER.JABLE_EMOJI_REGEX.test(rawComment);
    const hasUnicodeEmoji = CFG.FILTER.UNICODE_EMOJI_REGEX.test(rawComment);
    const hasEmoji = hasJableEmoji || hasUnicodeEmoji;
    const hasValidTimestamp = /(?:\d{1,3}):(?:\d{2})/.test(normalized);
    if (!hasValidTimestamp && !hasEmoji) {
      if (cleanedForLength.length === 0) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "纯空格/表情符号"
        };
      }
      if (/^[\s\p{P}\p{S}]+$/u.test(cleanedForLength)) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "仅包含标点/特殊符号"
        };
      }
      if (/^\d+$/.test(cleanedForLength)) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "纯数字无内容"
        };
      }
      if (cleanedForLength.length <= 4 && !hasChinese) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "过短的非中文无意义字符"
        };
      }
      if (/^(.)\1+$/.test(cleanedForLength) && !hasChinese) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "单一字符复读/刷屏"
        };
      }
    }
    for (const rule of trollFightRules) {
      if (rule.regex.test(normalized)) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": rule.reason
        };
      }
    }
    return {
      "label": "HAM",
      "category": null,
      "reason": null
    };
  }
  function maskBlacklist(normalizedText) {
    let text = normalizedText;
    const blacklistRules = [ {
      "regex": /\b(\d+)\s*[pP]\b/g,
      "placeholder": "_PEOPLE_"
    }, {
      "regex": /([a-zA-Z]{2,5}-\d{3,4})/gi,
      "placeholder": "_AVCODE_"
    }, {
      "regex": /(\d+)\s*[班级級度次]/g,
      "placeholder": "_CLASS_"
    }, {
      "regex": /(\d+)\s*年/g,
      "placeholder": "_YEAR_"
    }, {
      "regex": /(\d+)\s*[号號]/g,
      "placeholder": "_NUMBER_"
    }, {
      "regex": /(\d+)\s*[万萬]播放/g,
      "placeholder": "_VIEWS_"
    }, {
      "regex": /(\d+)\s*[万萬]/g,
      "placeholder": "_LARGE_NUM_"
    }, {
      "regex": /(\d+)\s*梯/g,
      "placeholder": "_MILITARY_"
    }, {
      "regex": /(\d+)\s*mm/gi,
      "placeholder": "_MEASURE_"
    }, {
      "regex": /q\s*加\s*\w+/gi,
      "placeholder": "_SPAM_"
    }, {
      "regex": /(?<![-:.])\b\d{4,}\b(?![-:.])/g,
      "placeholder": "_LONG_NUM_"
    } ];
    for (const rule of blacklistRules) {
      text = text.replace(rule.regex, rule.placeholder);
    }
    return text;
  }
  function parseTwoPartTime(a, bStr) {
    let isDot = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    let hourLimit = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 3;
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
  function extractCandidates(normalizedText) {
    let hourLimit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3;
    const candidates = [];
    const l1Regex = /(?<!\d)(-?\d{1,3}):(\d{2})(?::(\d{2}))?(?!\d)/g;
    let match;
    while ((match = l1Regex.exec(normalizedText)) !== null) {
      const raw = match[0];
      const isNegative = raw.startsWith("-");
      const parts = [ parseInt(match[1], 10), parseInt(match[2], 10), match[3] ? parseInt(match[3], 10) : null ];
      if (parts[1] >= 60 || parts[2] !== null && parts[2] >= 60) {
        continue;
      }
      let seconds = 0;
      const absParts = parts.map((p => p !== null ? Math.abs(p) : null));
      if (absParts[2] !== null) {
        seconds = absParts[0] * 3600 + absParts[1] * 60 + absParts[2];
      } else if (isNegative) {
        seconds = absParts[0] * 60 + absParts[1];
      } else {
        seconds = parseTwoPartTime(absParts[0], match[2], false, hourLimit);
      }
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L1",
        "seconds": isNegative ? -seconds : seconds,
        "isNegative": isNegative
      });
    }
    const l2Regex = /(?<!\d)(-?\d{1,3})\.(\d{1,2})(?:\.(\d{1,2}))?(?!\d)/g;
    while ((match = l2Regex.exec(normalizedText)) !== null) {
      const raw = match[0];
      const isNegative = raw.startsWith("-");
      const parts = [ parseInt(match[1], 10), match[2], match[3] ? parseInt(match[3], 10) : null ];
      const part1Val = parseInt(parts[1], 10);
      if (part1Val >= 60 || parts[2] !== null && parts[2] >= 60) {
        continue;
      }
      let seconds = 0;
      const absPart0 = Math.abs(parts[0]);
      if (parts[2] !== null) {
        seconds = absPart0 * 3600 + parseInt(parts[1], 10) * 60 + parts[2];
      } else if (isNegative) {
        let bVal = parseInt(parts[1], 10);
        if (parts[1].length === 1) {
          bVal *= 10;
        }
        seconds = absPart0 * 60 + bVal;
      } else {
        seconds = parseTwoPartTime(absPart0, parts[1], true, hourLimit);
      }
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L2",
        "seconds": isNegative ? -seconds : seconds,
        "isNegative": isNegative
      });
    }
    const l3hmsRegex = /(?<!\d)(\d{1,2})\s*(?:小时|h|H)\s*(\d{1,2})\s*(?:分钟|分鐘|分|m|M)\s*(\d{1,2})\s*(?:秒钟|秒鐘|秒|s|S)(?!\d)/g;
    while ((match = l3hmsRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L3",
        "seconds": parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10),
        "isNegative": false
      });
    }
    const l3hmRegex = /(?<!\d)(\d{1,2})\s*(?:小时|h|H)\s*(\d{1,2})\s*(?:分钟|分鐘|分|m|M)(?!\d)/g;
    while ((match = l3hmRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L3",
        "seconds": parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60,
        "isNegative": false
      });
    }
    const l3msRegex = /(?<!\d)(\d{1,3})\s*(?:分钟|分鐘|分)\s*(\d{1,2})\s*(?:秒钟|秒鐘|秒)(?!\d)/g;
    while ((match = l3msRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L3",
        "seconds": parseInt(match[1], 10) * 60 + parseInt(match[2], 10),
        "isNegative": false
      });
    }
    const l3mRegex = /(?<!\d)(\d{1,3})\s*(?:分钟|分鐘|分)(?!\d)/g;
    while ((match = l3mRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L3",
        "seconds": parseInt(match[1], 10) * 60,
        "isNegative": false
      });
    }
    const l3sRegex = /(?<!\d)(\d{1,2})\s*(?:秒钟|秒鐘|秒)(?!\d)/g;
    while ((match = l3sRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L3",
        "seconds": parseInt(match[1], 10),
        "isNegative": false
      });
    }
    const l5SlashRegex = /(?<!\d)(\d{1,3})(?:\s*\/\s*(\d{1,3}))+(?!\d)/g;
    while ((match = l5SlashRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      const numbers = raw.split("/").map((n => parseInt(n.trim(), 10)));
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L5",
        "seconds": numbers.map((n => n * 60)),
        "isSlashList": true
      });
    }
    const l5IsolatedRegex = /(?<!\d)\b(\d{1,3})\b(?!\d)/g;
    while ((match = l5IsolatedRegex.exec(normalizedText)) !== null) {
      const raw = match[0];
      candidates.push({
        "raw": raw,
        "index": match.index,
        "end": match.index + raw.length,
        "level": "L5",
        "seconds": parseInt(raw, 10),
        "isIsolated": true
      });
    }
    return candidates;
  }
  function resolveOverlaps(candidates) {
    const priorityMap = {
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L5": 2
    };
    candidates.sort(((a, b) => {
      const prioA = a.isIsolated ? 3 : priorityMap[a.level];
      const prioB = b.isIsolated ? 3 : priorityMap[b.level];
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      if (a.raw.length !== b.raw.length) {
        return b.raw.length - a.raw.length;
      }
      return a.index - b.index;
    }));
    const accepted = [];
    for (const cand of candidates) {
      const hasOverlap = accepted.some((acc => Math.max(cand.index, acc.index) < Math.min(cand.end, acc.end)));
      if (!hasOverlap) {
        accepted.push(cand);
      }
    }
    accepted.sort(((a, b) => a.index - b.index));
    return accepted;
  }
  function mergeRanges(matches, normalizedText) {
    const merged = [];
    const rangeSeps = [ "~", "-", "～", "到" ];
    let i = 0;
    while (i < matches.length) {
      const current = matches[i];
      const next = matches[i + 1];
      if (next) {
        const between = normalizedText.slice(current.end, next.index).trim();
        if (rangeSeps.includes(between)) {
          merged.push({
            "raw": normalizedText.slice(current.index, next.end),
            "index": current.index,
            "end": next.end,
            "level": "L4",
            "subLevels": [ current.level, next.level ],
            "start": current,
            "endMatch": next,
            "isRange": true
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
  function validateMatch(match, allResolvedMatches, normalizedText, videoDuration) {
    let inRange = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : false;
    if (match.index !== void 0) {
      const preText = normalizedText.slice(Math.max(0, match.index - 10), match.index);
      const durationRegex = new RegExp(`(?:${CFG.TIMESTAMPS.DURATION_KEYWORDS.join("|")})[\\s:：,，、]*$`, "i");
      if (durationRegex.test(preText)) {
        return {
          "isValid": false,
          "reason": "检测到持续时长语义"
        };
      }
      if (!/[分秒时時hmsmHMS]/i.test(match.raw)) {
        const postText = normalizedText.slice(match.end, Math.min(normalizedText.length, match.end + 5)).trim();
        if (/^[xX倍]/i.test(postText)) {
          return {
            "isValid": false,
            "reason": "检测到播放速度/倍率语义"
          };
        }
      }
    }
    if (match.isRange) {
      const startVal = validateMatch(match.start, allResolvedMatches, normalizedText, videoDuration, true);
      const endVal = validateMatch(match.endMatch, allResolvedMatches, normalizedText, videoDuration, true);
      if (!startVal.isValid || !endVal.isValid) {
        return {
          "isValid": false,
          "reason": "范围边界无效"
        };
      }
      let startSecs = startVal.seconds;
      let endSecs = endVal.seconds;
      let isCountdown = false;
      if (startSecs > endSecs) {
        isCountdown = true;
        const startOffset = startSecs;
        const endOffset = endSecs;
        startSecs = videoDuration - startOffset;
        endSecs = videoDuration - endOffset;
        if (startSecs < 0 || endSecs < 0) {
          return {
            "isValid": false,
            "reason": "倒计时超出总时长"
          };
        }
      }
      return {
        "isValid": true,
        "seconds": [ startSecs, endSecs ],
        "level": "L4",
        "confidence": "High",
        "isCountdown": isCountdown,
        "countdownOffsets": isCountdown ? [ startVal.seconds, endVal.seconds ] : null
      };
    }
    const validationDuration = Math.max(videoDuration, 28800);
    if (match.isSlashList) {
      const validSeconds = [];
      for (const sec of match.seconds) {
        if (sec <= validationDuration) {
          validSeconds.push(sec);
        }
      }
      if (validSeconds.length === 0) {
        return {
          "isValid": false,
          "reason": "斜杠列表全部超出时长"
        };
      }
      return {
        "isValid": true,
        "seconds": validSeconds.length === 1 ? validSeconds[0] : validSeconds,
        "level": "L5",
        "confidence": "Medium"
      };
    }
    if (match.isIsolated) {
      const val = match.seconds;
      let isAdjacentToValid = false;
      for (const other of allResolvedMatches) {
        if (other === match || other.isIsolated) {
          continue;
        }
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
      const context = normalizedText.slice(startWin, match.index) + " | " + normalizedText.slice(match.end, endWin);
      const minuteKeywords = CFG.TIMESTAMPS.MINUTE_KEYWORDS;
      const secondKeywords = CFG.TIMESTAMPS.SECOND_KEYWORDS;
      const cleanText = normalizedText.replace(/[\s\p{P}\p{S}]+/gu, "");
      let isStandaloneNumber = cleanText === match.raw;
      if (isStandaloneNumber) {
        if (CFG.FILTER.SINGLE_DIGIT_REGEX.test(match.raw) || CFG.FILTER.REPEATING_DIGIT_REGEX.test(match.raw)) {
          isStandaloneNumber = false;
        }
      }
      const hasContext = secondKeywords.some((kw => context.includes(kw))) || minuteKeywords.some((kw => context.includes(kw))) || isAdjacentToValid || isStandaloneNumber || inRange;
      if (!hasContext) {
        return {
          "isValid": false,
          "reason": "孤立数字缺少时间上下文"
        };
      }
      const isSecond = secondKeywords.some((kw => context.includes(kw)));
      const seconds = isSecond ? val : val * 60;
      if (seconds > validationDuration) {
        return {
          "isValid": false,
          "reason": `数值超出限制 (${seconds}秒 > ${validationDuration}秒)`
        };
      }
      return {
        "isValid": true,
        "seconds": seconds,
        "level": "L5",
        "confidence": "Medium"
      };
    }
    let secs = match.seconds;
    let isCountdown = false;
    let countdownOffsets = null;
    if (match.isNegative) {
      isCountdown = true;
      const offset = Math.abs(secs);
      if (offset > validationDuration) {
        return {
          "isValid": false,
          "reason": "倒计时超出总时长"
        };
      }
      secs = videoDuration - offset;
      countdownOffsets = offset;
    }
    if (secs > validationDuration) {
      return {
        "isValid": false,
        "reason": "时间点超出视频时长"
      };
    }
    return {
      "isValid": true,
      "seconds": secs,
      "level": match.level,
      "confidence": "High",
      "isCountdown": isCountdown,
      "countdownOffsets": countdownOffsets
    };
  }
  function parseTimestamps(rawComment) {
    let videoDuration = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 10800;
    const normalized = normalizeText(rawComment);
    const masked = maskBlacklist(normalized);
    let hourLimit = CFG.TIMESTAMPS.HOUR_LIMIT;
    if (videoDuration && videoDuration > 0) {
      hourLimit = Math.floor(videoDuration / 3600);
      if (hourLimit < 1) {
        hourLimit = 1;
      }
      if (hourLimit > 8) {
        hourLimit = 8;
      }
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
          "raw": match.raw,
          "seconds": valResult.seconds,
          "level": match.level,
          "confidence": valResult.confidence,
          "isCountdown": valResult.isCountdown,
          "countdownOffsets": valResult.countdownOffsets
        });
      } else {
        invalid.push({
          "raw": match.raw,
          "reason": valResult.reason
        });
      }
    }
    let confidence = "None";
    if (valid.length > 0) {
      const priorities = {
        "High": 3,
        "Medium": 2,
        "Low": 1
      };
      let maxPrio = 0;
      for (const v of valid) {
        const p = priorities[v.confidence] || 0;
        if (p > maxPrio) {
          maxPrio = p;
          confidence = v.confidence;
        }
      }
    }
    return {
      "isValid": valid.length > 0,
      "validTimestamps": valid,
      "invalidTimestamps": invalid,
      "confidence": confidence
    };
  }
  const oRegExp = /(?<!\w|\/|www\.|=|col-|\d-|>|Jukujo-)(?!heyzo|SHINKI|JPNXXX|carib|vps)[a-zA-Z]{2,6}-\d{2,5}(?:-c|_c|-4k)?(?!\d|[A-Za-z]{2,}|-\d|\.com|\.\d)|(?<!\w|\/|\\|\.|【|-|#|@|=|www\.)(?!heyzo|SHINKI|JPNXXX|carib|and|vps|dvd)[a-zA-Z]{2,6}\s{0,2}\d{3,4}(?:-c|_c)?(?!\w|-|\.|\/|×|％|%|@|\s?天| 于| 发表| 發表|歳| 歲|小时|分|系列| Min| day|ml| time|cm| ppi|\.com)|(?<!\w)(?:PARATHD|3DSVR|STARSBD)[-\s]?\d{3,4}(?!\w)|(?<!\w)(?:HIMEMIX|CASMANI|MGSSLND)[-\s]?\d{3}(?!\w)|(?<!\w)(?:k|n)[01]\d{3}(?!\w|-)|(?<!\w|\d-|\/)[01]\d{5}[-_](?:1)?\d{2,3}(?!\w|-\d)|(?<!\w)(?:carib|1pondo)[-_]\d{6}[-_]\d{2,3}(?!\w)|(?<!\w|\d-)\d{6}[-_]\d{2,3}(?:-1pon|-carib|-paco)(?!\w)|(?<!\w|\d-)\d{6}_(1)?\d{3}_0[12](?!\w|-\d)|HEYZO[_-\s]?(?:hd_)?\d{4}/gi;
  const oRegExp_wuma = /(?<!\w|-|\/)\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}(?!\w|-|.torrent|年)|(?<!\w|\/)FC2[^\d]{0,5}\d{6,7}|HEYDOUGA[_-\s]?\d{4}-\d{3,5}|(?<!\w)T28-\d{3}|(?<!\w)T-2\d{4,5}(?!\w|-)|(?<!\w|-|\/)[01]\d{5}-[a-zA-Z]{2,7}(?!\w|-)|(?<!\w)MK(?:B)?D-S\d{2,3}(?!\w|-)|(?:SHINKI|KITAIKE)[-\s]?\d{3}(?!\w|-)|JPNXXX[-\s]?\d{5}(?!\w|-)|xxx-av[-\s]\d{4,5}(?!\w|-)|(?<!\w)crazyasia\d{5}(?!\w|-)|(?<!\w)PEWORLD\d{5}(?!\w|-)|(?<!\w)[01]\d{5}[-_]?_01(?=-10mu)?|Jukujo-Club-\d{3}/gi;
  const oRegExp2 = /(?<=(?<!\w|\d-)([a-zA-Z]{2,6})(?:[\s,，、-]?(?!2022|2021|2020|2019)\d{3,4})+(?!\d)[\s,、，和跟]{0,2})\d{3,4}(?!\w|％|%|人|年|歳|万|の|发)/gim;
  const oRegExp_wuma2 = /(?<=(FC2[^\d]{0,5})(?:[\s,、-]?\d{6,7})+[\s,、]?)\d{6,7}/gim;
  const oRegExp_Exclude_ID = /^(?:fx-?([^0]\d{2}|\d{4})|[a-zA-Z]+-?0{2,6}$|pg-13|crc-32|ea211|fs[\s-]?140|trc-20|erc-20|rs[\s-]?(232|422|485)|(sg|ae|kr|tw|ph|vn|kh|ru|uk|ua|tr|th|fr|in|de|sr)[\s-]\d{2}|(gm|ga)-\d{4}|cd[\s-]?\d{2,4}|seed[\s-]?\d{3}$|pc005|moc-\d{5}|wd-40|rtd[\s-]?\d{4}|cm\d{4}|rk\d{4})|ns[\s-]?\d{3,4}/i;
  const oRegExp_Exclude_en = /^(?:about|ac|actg|adreno|aes|aff|again|agm|all|ak|akko|apex|aptx|arm|au|ax|avhd|avx|bej|bgm|bd|bm|build|(?:fc|p)?[blp]ga|by|bzk|cc|ccie|cctv|cea|chrome|ckg|class|cny|code|core|covid|cpu|dc|debian|df|ds|dw|dx|ea|edit|er|ecma|eia|emui|eof|ep|error|exp|ez|fc|file|flash|flyme|fps|for|fork|from|fuck|fx|gbx|get|github|glm|gnz|gp|groupr|gt|gts|gtx|guest|hao|hd|her|hdr|hk|https?|hp|IEEE|il|ilc|ilce|imx|index|intel|inteli|ip|ipad|is|ISBN|iso|issue|issues|it|jav|javdb|joy|jp|jr|jsr|jt|jukujo|just|kc|keccak|kv[bd]|Kirin|kryo|lancet|libx|line|linux|lk|lolrng|lpl|lt|lumia|lg|macos|math|md|mh|miui|mipc|mnvr|mm|model|mv|mvp|ms|nas|nature|nc|next|ngff|note|number|ok|only|os|oss|osx|opga|pa|page|pch|phl|pmw|png|ppv|qbz|qsz|raid|rfc|ripemd|rmb|rng|rog|row|rtx|rush|rx|sale|scp|scte|sdm|sdr|server|sha|shp|sonnet|spent|sql|sn|snh|Socket|ssd|status|steam|su|swipe|tcp|the|top|than|thread|tr|ts|type|uh|uhd|under|us|usa|usc|utf|utc|via|video|vkffsc|vol|vr|vs|vv|web|win|with|width|wikis|wta|xdr|xfx|xiaomi|yah)$/i;
  const oRegExp_Special_en = /^(?:ace|akb|api|am|anime|at|be|best|bt|bl|cp|crc|exynos|dl|dp|dq|gb|girl|jd|ha|has|hc|hours|iq|in|mk|mini|mhz|mx|no|open|of|over|part|pd|pdd|porn|pt|sb|sex|tv|tb|ty|ver|vip|zd|zip)$/i;
  const oRegExp_Special_num = /^(?:007|101|110|115|123|128|256|360|365|370|404|512|520|911|996|\d{1,2}00|19[789]\d|20[012]\d|720|1080|1024|2048|[056789]\d{3}|(\d)\1{2,3})$/;
  const oRegExp_Exclude_wuma = /^(?:512gb)/i;
  function IDcheck(otext) {
    const oOnlyText = otext.replace(/[^a-zA-Z]/gi, "");
    const oOnlyNum = otext.replace(/[^0-9]/gi, "");
    if (otext.match(oRegExp_Exclude_ID)) {
      return true;
    }
    if (oOnlyText.match(oRegExp_Exclude_en)) {
      return true;
    }
    if (otext.match(/^[a-z|A-Z]{2,8}\s?\d{2,5}$/i)) {
      if (oOnlyNum.match(oRegExp_Special_num)) {
        return true;
      }
      if (oOnlyText.match(oRegExp_Special_en)) {
        return true;
      }
    }
    return false;
  }
  function IDcheckWuma(otext) {
    if (otext.match(/\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}/i)) {
      if (otext.replace(/[^a-zA-Z]/gi, "").match(/^cm$/i)) {
        return true;
      }
    }
    if (otext.match(oRegExp_Exclude_wuma)) {
      return true;
    }
    return false;
  }
  function formatAVID(otext) {
    let formatted = otext.replace(/\s+|-c|_c|-4k|carib[-_]|1pondo[-_]|-1pon|-paco|-carib|hd_/gi, "");
    if (formatted.match(/(?:k|n)\d{4}/i)) {
      return formatted.toLowerCase();
    }
    if (formatted.match(/^[a-zA-Z]{2,8}\d{2,5}$/i)) {
      const oindex = formatted.search(/\d/);
      if (oindex > 0) {
        formatted = formatted.slice(0, oindex) + "-" + formatted.slice(oindex);
      }
    }
    return formatted.toUpperCase();
  }
  function formatWuma(otext) {
    let formatted = otext.replace(/\s+|carib[-_]|1pondo[-_]|-1pon|-paco|-carib|hd_/gi, "");
    if (formatted.match(/fc2/i)) {
      const oindex = formatted.search(/(?<!fc)\d/i);
      return ("FC2-" + formatted.slice(oindex)).toUpperCase();
    }
    if (formatted.match(/heyzo/i)) {
      const oindex = formatted.search(/\d/i);
      return "HEYZO-" + formatted.slice(oindex);
    }
    if (formatted.match(/(?:k|n)\d{4}/i)) {
      return formatted.toLowerCase();
    }
    if (formatted.match(/t28|t-|MKD-S|SHINKI|KITAIKE|JPNXXX|xxx-av|crazyasia|PEWORLD|MKBD-S/i)) {
      return formatted.toUpperCase();
    }
    if (formatted.match(/HEYDOUGA/i)) {
      return "heydouga-" + formatted.slice(formatted.search(/\d/i));
    }
    return formatted;
  }
  function extractAVCodes(comment, contextPrefix) {
    const codes = new Set;
    const normalized = normalizeText(comment);
    let match;
    oRegExp.lastIndex = 0;
    while ((match = oRegExp.exec(normalized)) !== null) {
      const matchedStr = match[0].trim();
      if (!IDcheck(matchedStr)) {
        codes.add(formatAVID(matchedStr));
      }
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
        if (!IDcheck(avID)) {
          codes.add(formatAVID(avID));
        }
      }
    }
    oRegExp_wuma2.lastIndex = 0;
    while ((match = oRegExp_wuma2.exec(normalized)) !== null) {
      if (match[1]) {
        const avID = match[1] + match[0];
        if (!IDcheckWuma(avID)) {
          codes.add(formatWuma(avID));
        }
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
          if (!IDcheck(fullCode)) {
            codes.add(fullCode.toUpperCase());
          }
        }
      }
    }
    return Array.from(codes);
  }
  function makeHighlightRegex(raw) {
    let pattern = "";
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      if (/\d/.test(char)) {
        const fw = String.fromCharCode(char.charCodeAt(0) + 65248);
        pattern += `[${char}${fw}]`;
      } else if (char === ":") {
        pattern += "\\s*[:：]\\s*";
      } else if (char === ".") {
        pattern += "\\s*[\\.。．]\\s*";
      } else if (char === "-") {
        pattern += "\\s*[-－—]\\s*";
      } else if (char === "~" || char === "～") {
        pattern += "\\s*[-~～ー－—到至]\\s*";
      } else if (/\s/.test(char)) {
        pattern += "\\s*";
      } else {
        const escaped = char.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        pattern += `\\s*${escaped}\\s*`;
      }
    }
    return new RegExp(pattern, "g");
  }
  function buildAvcodeRegex(code) {
    let pattern = "(?<![a-zA-Z\\d\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A])";
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (/[a-zA-Z]/.test(char)) {
        const upper = char.toUpperCase();
        const lower = char.toLowerCase();
        const fwUpper = String.fromCharCode(upper.charCodeAt(0) + 65248);
        const fwLower = String.fromCharCode(lower.charCodeAt(0) + 65248);
        pattern += `[${upper}${lower}${fwUpper}${fwLower}]`;
      } else if (/\d/.test(char)) {
        const fw = String.fromCharCode(char.charCodeAt(0) + 65248);
        pattern += `[${char}${fw}]`;
      } else if (char === "-" || char === "_") {
        pattern += "[-_－—\\s]?";
      } else {
        const escaped = char.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        pattern += escaped;
      }
    }
    pattern += "(?![a-zA-Z\\d\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A])";
    return new RegExp(pattern, "gi");
  }
  function formatSeconds(sec) {
    if (Array.isArray(sec)) {
      return sec.map(formatSeconds).join(" ~ ");
    }
    const rounded = Math.round(sec);
    if (rounded < 0) {
      return rounded.toString();
    }
    const hrs = Math.floor(rounded / 3600);
    const mins = Math.floor(rounded % 3600 / 60);
    const secs = rounded % 60;
    const pad = num => String(num).padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  }
  function parseBBCode(text) {
    if (!text) {
      return "";
    }
    let html = text;
    html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<b>$1</b>");
    html = html.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1">$2</span>');
    html = html.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, ((match, url, linkText) => {
      let targetUrl = url;
      if (url.startsWith("/")) {
        targetUrl = `https://c97k.com${url}`;
      }
      return `<a href="${targetUrl}" target="_blank" class="jc-comment-link">${linkText}</a>`;
    }));
    html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, ((match, url) => {
      let targetUrl = url;
      if (url.startsWith("/")) {
        targetUrl = `https://c97k.com${url}`;
      }
      return `<a href="${targetUrl}" target="_blank" class="jc-comment-link">${url}</a>`;
    }));
    html = html.replace(/\[\/?[a-zA-Z]+[^\]]*\]/g, "");
    return html;
  }
  function highlightCommentText(text, timestamps, avcodes) {
    let html = esc(text);
    html = parseBBCode(html);
    const replacements = {};
    let idCounter = 0;
    const sortedTimestamps = [ ...timestamps ].sort(((a, b) => b.raw.length - a.raw.length));
    sortedTimestamps.forEach((ts => {
      const regex = makeHighlightRegex(ts.raw);
      html = html.replace(regex, (match => {
        const tokenId = `___TS_${idCounter++}___`;
        const roundedSecs = Array.isArray(ts.seconds) ? ts.seconds.map(Math.round) : Math.round(ts.seconds);
        const secsAttr = Array.isArray(roundedSecs) ? JSON.stringify(roundedSecs) : roundedSecs;
        let tooltip = "跳转至此时间";
        let displayText = match;
        if (ts.isCountdown) {
          displayText = formatSeconds(ts.seconds);
          if (Array.isArray(ts.countdownOffsets)) {
            tooltip = `原倒计时: -${formatSeconds(ts.countdownOffsets[0])} ~ -${formatSeconds(ts.countdownOffsets[1])} (已转换为绝对时间)`;
          } else {
            tooltip = `原倒计时: -${formatSeconds(ts.countdownOffsets)} (已转换为绝对时间)`;
          }
        } else if (Array.isArray(ts.seconds)) {
          tooltip = `跳转至区间 ${formatSeconds(ts.seconds)}`;
        } else {
          tooltip = `跳转至 ${formatSeconds(ts.seconds)}`;
        }
        replacements[tokenId] = `<span class="jc-time-link" data-secs='${secsAttr}' title="${esc(tooltip)}">${displayText}</span>`;
        return tokenId;
      }));
    }));
    avcodes.forEach((code => {
      const regex = buildAvcodeRegex(code);
      html = html.replace(regex, (match => {
        const tokenId = `___AV_${idCounter++}___`;
        replacements[tokenId] = `<span class="jc-code-link" data-code="${esc(code)}" title="复制并搜索番号">${match}</span>`;
        return tokenId;
      }));
    }));
    const jableEmojis = {
      "love": "😍",
      "hungry": "😋",
      "tongue": "😛",
      "skr": "🤙",
      "cool": "😎",
      "funny": "😂",
      "sad": "😥",
      "devil": "😈",
      "angry": "😡"
    };
    html = html.replace(/:([a-zA-Z]{2,15}):/g, ((match, name) => {
      const lowerName = name.toLowerCase();
      if (jableEmojis[lowerName]) {
        return jableEmojis[lowerName];
      }
      return match;
    }));
    for (const [token, rep] of Object.entries(replacements)) {
      html = html.replace(token, rep);
    }
    return html;
  }
  function processComment(commentText, contextPrefix) {
    let videoDuration = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 10800;
    let cleanedText = commentText;
    if (commentText.includes("[quote") || commentText.includes("[/quote]")) {
      cleanedText = commentText.replace(/\[quote[^\]]*\][\s\S]*?\[\/quote\]/gi, "").trim();
    }
    const spam = classifyComment(cleanedText);
    let timestamps = [];
    let avcodes = [];
    if (spam.label !== "SPAM") {
      const tsResult = parseTimestamps(cleanedText, videoDuration);
      if (tsResult.isValid) {
        timestamps = tsResult.validTimestamps;
      }
      avcodes = extractAVCodes(cleanedText, contextPrefix);
    }
    const textHtml = highlightCommentText(cleanedText, timestamps, avcodes);
    return {
      "spam": spam,
      "timestamps": timestamps,
      "avcodes": avcodes,
      "textHtml": textHtml
    };
  }
  const CommentComposer_JABLE_DOMAINS = (0, domains.getSiteUrls)("JABLE");
  class CommentComposer {
    "constructor"(panel) {
      this.panel = panel;
      this.selectedTagIds = new Set;
      this.commentInput = null;
      this.tagSelectModal = null;
      this.tagSelectList = null;
      this._lastStatusCheckTime = 0;
    }
    get "playerCore"() {
      return this.panel.playerCore;
    }
    get "videoCode"() {
      return this.panel.videoCode;
    }
    get "jableWorkingDomain"() {
      return this.panel.jableWorkingDomain;
    }
    get "commentsPanel"() {
      return this.panel.commentsPanel;
    }
    get "siteLoginStates"() {
      return this.panel.siteLoginStates;
    }
    "getTabs"() {
      return this.panel.getTabs();
    }
    "getLoopManager"() {
      return this.panel.getLoopManager();
    }
    async "checkCanComment"() {
      if (!this.videoCode) {
        Toast("无法获取影片番号，无法发表评论", 2e3, "error");
        return null;
      }
      const domain = this.jableWorkingDomain || CommentComposer_JABLE_DOMAINS[0];
      const targetUrl = `${domain}/videos/${this.videoCode.toLowerCase().trim()}/`;
      return new Promise((resolve => {
        let completed = false;
        let req = null;
        const timer = setTimeout((() => {
          if (!completed) {
            completed = true;
            if (req && typeof req.abort === "function") {
              try {
                req.abort();
              } catch (e) {}
            }
            Toast("检测评论环境超时，请稍后重试", 2e3, "error");
            resolve(null);
          }
        }), 6e3);
        req = GM_xmlhttpRequest({
          "method": "GET",
          "url": targetUrl,
          "timeout": 6e3,
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "referer": domain,
            "User-Agent": navigator.userAgent
          },
          "onload": response => {
            if (completed) {
              return;
            }
            completed = true;
            clearTimeout(timer);
            if (response.status === 404) {
              this.panel.jableVideoExists = false;
              this.showTipModal("提示", "该影片在 Jable.tv 上未发布，无法发表评论。");
              resolve(null);
              return;
            }
            if (response.status >= 200 && response.status < 300) {
              this.panel.jableVideoExists = true;
              const html = response.responseText;
              const doc = (new DOMParser).parseFromString(html, "text/html");
              const commentForm = Array.from(doc.querySelectorAll("form")).find((form => form.querySelector('input[name="action"][value="add_comment"]') || form.querySelector('input[name="action"][value="add_comment_video"]'))) || doc.querySelector('form[id*="comment"]') || doc.querySelector('form[action*="comment"]');
              if (!commentForm) {
                this.showLoginPromptModal(domain);
                resolve(null);
              } else {
                resolve({
                  "commentForm": commentForm,
                  "targetUrl": targetUrl,
                  "domain": domain
                });
              }
            } else {
              Toast(`检测失败: HTTP ${response.status}`, 2e3, "error");
              resolve(null);
            }
          },
          "onerror": err => {
            if (completed) {
              return;
            }
            completed = true;
            clearTimeout(timer);
            logger.error("[CommentComposer] 检测 Jable 失败:", err);
            Toast("网络请求失败，请稍后重试", 2e3, "error");
            resolve(null);
          },
          "ontimeout": () => {
            if (completed) {
              return;
            }
            completed = true;
            clearTimeout(timer);
            Toast("网络请求超时，请稍后重试", 2e3, "error");
            resolve(null);
          }
        });
      }));
    }
    "initCommentSubmitBar"(panelEl) {
      const container = panelEl || this.commentsPanel;
      if (!container) {
        return;
      }
      this.selectedTagIds = new Set;
      const addTagBtn = container.querySelector(".tm-comment-add-tag-btn");
      const commentInput = container.querySelector(".tm-comment-text-input");
      const sendBtn = container.querySelector(".tm-comment-send-btn");
      const tagSelectModal = container.querySelector(".tm-comment-tag-select-modal");
      const selectAllBtn = container.querySelector(".tm-tag-select-all-btn");
      const deselectAllBtn = container.querySelector(".tm-tag-deselect-all-btn");
      const closeBtn = container.querySelector(".tm-tag-select-close-btn");
      const tagSelectList = container.querySelector(".tm-tag-select-list");
      this.commentInput = commentInput;
      this.tagSelectModal = tagSelectModal;
      this.tagSelectList = tagSelectList;
      if (commentInput) {
        const stopProp = e => e.stopPropagation();
        commentInput.addEventListener("keydown", stopProp);
        commentInput.addEventListener("keyup", stopProp);
        commentInput.addEventListener("keypress", stopProp);
        commentInput.addEventListener("mousedown", stopProp);
        commentInput.addEventListener("touchstart", stopProp);
        commentInput.addEventListener("focus", (() => {
          this.checkCanComment();
        }));
        commentInput.addEventListener("keydown", (e => {
          if (e.key === "Enter") {
            e.preventDefault();
            sendBtn === null || sendBtn === void 0 || sendBtn.click();
          }
        }));
      }
      if (addTagBtn) {
        addTagBtn.addEventListener("click", (e => {
          e.stopPropagation();
          this.toggleTagSelectModal();
        }));
      }
      if (sendBtn) {
        sendBtn.addEventListener("click", (async e => {
          e.stopPropagation();
          sendBtn.disabled = true;
          const canComment = await this.checkCanComment();
          sendBtn.disabled = false;
          if (!canComment) {
            return;
          }
          this.handleSendComment();
        }));
      }
      if (selectAllBtn) {
        selectAllBtn.addEventListener("click", (e => {
          e.stopPropagation();
          const tabs = this.getTabs();
          this.selectedTagIds = new Set(tabs.map((t => t.id)));
          this.renderTagSelectList();
        }));
      }
      if (deselectAllBtn) {
        deselectAllBtn.addEventListener("click", (e => {
          e.stopPropagation();
          this.selectedTagIds.clear();
          this.renderTagSelectList();
        }));
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", (e => {
          e.stopPropagation();
          this.closeTagSelectModal();
        }));
      }
    }
    "toggleTagSelectModal"() {
      if (!this.tagSelectModal) {
        return;
      }
      if (this.tagSelectModal.classList.contains("visible")) {
        this.closeTagSelectModal();
      } else {
        this.openTagSelectModal();
      }
    }
    "openTagSelectModal"() {
      if (!this.tagSelectModal) {
        return;
      }
      const tabs = this.getTabs();
      if (this.selectedTagIds.size === 0 && tabs.length > 0) {
        this.selectedTagIds = new Set(tabs.map((t => t.id)));
      }
      this.renderTagSelectList();
      this.tagSelectModal.classList.add("visible");
    }
    "closeTagSelectModal"() {
      if (!this.tagSelectModal) {
        return;
      }
      this.tagSelectModal.classList.remove("visible");
    }
    "renderTagSelectList"() {
      if (!this.tagSelectList) {
        return;
      }
      this.tagSelectList.innerHTML = "";
      const tabs = this.getTabs();
      const lm = this.getLoopManager();
      if (tabs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "tm-tag-select-empty";
        empty.textContent = "暂无时间戳标签，可在播放控制器添加";
        this.tagSelectList.appendChild(empty);
        return;
      }
      tabs.forEach(((tab, index) => {
        const color = lm ? lm.tabColors[index % lm.tabColors.length] : "200, 100%, 55%";
        const row = document.createElement("div");
        row.className = "tm-tag-select-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "tm-tag-checkbox";
        checkbox.checked = this.selectedTagIds.has(tab.id);
        checkbox.addEventListener("change", (e => {
          e.stopPropagation();
          if (checkbox.checked) {
            this.selectedTagIds.add(tab.id);
          } else {
            this.selectedTagIds.delete(tab.id);
          }
        }));
        const timeContainer = document.createElement("div");
        timeContainer.className = "tm-sheet-item-time-container";
        if (tab.type === "highlight") {
          const pill = document.createElement("button");
          pill.type = "button";
          pill.className = "tm-sheet-time-pill";
          pill.style.setProperty("--tab-color", color);
          pill.textContent = formatSeconds(tab.startTime);
          timeContainer.appendChild(pill);
        } else {
          const pill = document.createElement("div");
          pill.className = "tm-sheet-time-pill interval";
          pill.style.setProperty("--tab-color", color);
          const startSpan = document.createElement("span");
          startSpan.className = "tm-time-part start";
          startSpan.textContent = formatSeconds(tab.startTime);
          const sepSpan = document.createElement("span");
          sepSpan.className = "tm-time-sep";
          sepSpan.textContent = "~";
          const endSpan = document.createElement("span");
          endSpan.className = "tm-time-part end";
          endSpan.textContent = formatSeconds(tab.endTime);
          pill.appendChild(startSpan);
          pill.appendChild(sepSpan);
          pill.appendChild(endSpan);
          timeContainer.appendChild(pill);
        }
        const input = document.createElement("input");
        input.type = "text";
        input.className = "tm-tag-remark-input";
        input.placeholder = "添加备注...";
        input.value = tab.comment || "";
        const stopProp = e => e.stopPropagation();
        input.addEventListener("keydown", stopProp);
        input.addEventListener("keyup", stopProp);
        input.addEventListener("keypress", stopProp);
        input.addEventListener("mousedown", stopProp);
        input.addEventListener("touchstart", stopProp);
        input.addEventListener("input", (e => {
          tab.comment = e.target.value;
          if (lm) {
            lm._saveTabs();
            lm.renderTabs();
          }
        }));
        input.addEventListener("change", (() => {
          if (lm) {
            lm._saveTabs();
            lm.renderTabs();
          }
        }));
        row.appendChild(checkbox);
        row.appendChild(timeContainer);
        row.appendChild(input);
        this.tagSelectList.appendChild(row);
      }));
    }
    async "handleSendComment"() {
      const tabs = this.getTabs();
      const selectedTabs = tabs.filter((t => this.selectedTagIds.has(t.id)));
      const commentText = (this.commentInput ? this.commentInput.value : "").trim();
      if (selectedTabs.length === 0 && !commentText) {
        Toast("请勾选时间戳标签或输入评论内容", 2e3, "warning");
        return;
      }
      const lines = [];
      selectedTabs.forEach((tab => {
        const remark = (tab.comment || "").trim();
        const remarkStr = remark ? ` ${remark} ；` : " ；";
        if (tab.type === "highlight") {
          const timeStr = formatSeconds(tab.startTime);
          lines.push(`[${timeStr}]${remarkStr}`);
        } else {
          const startStr = formatSeconds(tab.startTime);
          const endStr = formatSeconds(tab.endTime);
          lines.push(`[${startStr} ~ ${endStr}]${remarkStr}`);
        }
      }));
      if (commentText) {
        lines.push(commentText);
      }
      const finalContent = lines.join("\n");
      await this.submitComment(finalContent);
    }
    async "submitComment"(commentText) {
      const checkRes = await this.checkCanComment();
      if (!checkRes) {
        return;
      }
      const {"commentForm": commentForm, "targetUrl": targetUrl, "domain": domain} = checkRes;
      const sendBtn = this.commentsPanel.querySelector(".tm-comment-send-btn");
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Sending...";
      }
      const resetBtn = () => {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = __("send");
        }
      };
      const provider = window.loginManager && window.loginManager.providers.find((p => p.domains.some((d => domain.includes(d)))));
      try {
        let success = false;
        if (provider && typeof provider.publishComment === "function") {
          success = await provider.publishComment(commentText, {
            "videoCode": this.videoCode,
            "commentForm": commentForm,
            "targetUrl": targetUrl,
            "domain": domain
          });
        } else {
          success = await new Promise((resolve => {
            const bodyParams = new URLSearchParams;
            commentForm.querySelectorAll("input").forEach((input => {
              if (input.name && input.type !== "submit") {
                bodyParams.append(input.name, input.value);
              }
            }));
            const formTextarea = commentForm.querySelector("textarea");
            const textareaName = formTextarea ? formTextarea.name : "comment";
            bodyParams.append(textareaName, commentText);
            let actionUrl = commentForm.getAttribute("action") || "";
            if (actionUrl.startsWith("/")) {
              actionUrl = `${domain}${actionUrl}`;
            } else if (!actionUrl.startsWith("http")) {
              actionUrl = targetUrl;
            }
            logger.log(`[CommentComposer] 正在提交评论: ${actionUrl}`);
            GM_xmlhttpRequest({
              "method": "POST",
              "url": actionUrl,
              "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "referer": targetUrl,
                "origin": domain,
                "User-Agent": navigator.userAgent
              },
              "data": bodyParams.toString(),
              "withCredentials": true,
              "onload": res => {
                if (res.status === 200 || res.status === 302) {
                  const resHtml = res.responseText || "";
                  if (resHtml.includes("error-field") || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
                    const docErr = (new DOMParser).parseFromString(resHtml, "text/html");
                    const errEl = docErr.querySelector(".error") || docErr.querySelector(".err") || docErr.querySelector(".message-error");
                    const errMsg = errEl ? errEl.textContent.trim() : "评论提交失败，可能包含敏感词或触发了频率限制。";
                    Toast(errMsg, 3e3, "error");
                    resolve(false);
                  } else {
                    Toast("评论发表成功！", 2e3, "success");
                    resolve(true);
                  }
                } else {
                  Toast(`提交失败: HTTP ${res.status}`, 2e3, "error");
                  resolve(false);
                }
              },
              "onerror": err => {
                logger.error("[CommentComposer] 提交评论失败:", err);
                Toast("网络请求出错，请重试", 2e3, "error");
                resolve(false);
              }
            });
          }));
        }
        resetBtn();
        if (success) {
          if (this.commentInput) {
            this.commentInput.value = "";
          }
          this.selectedTagIds.clear();
          this.closeTagSelectModal();
          setTimeout((() => this.panel.handleRetry()), 500);
        }
      } catch (err) {
        resetBtn();
        logger.error("[CommentComposer] 发表评论过程出现异常:", err);
        Toast("发表评论失败", 2e3, "error");
      }
    }
    async "handlePublishComment"() {
      if (!this.videoCode) {
        Toast("无法获取影片番号，无法发表评论", 2e3, "error");
        return;
      }
      const domain = this.jableWorkingDomain || CommentComposer_JABLE_DOMAINS[0];
      const targetUrl = `${domain}/videos/${this.videoCode.toLowerCase().trim()}/`;
      const publishBtn = this.commentsPanel.querySelector(".tm-comments-panel-publish-btn");
      const originalText = publishBtn ? publishBtn.textContent : "发表";
      if (publishBtn) {
        publishBtn.disabled = true;
        publishBtn.textContent = "检测中...";
        publishBtn.style.opacity = "0.7";
      }
      const resetBtn = () => {
        if (publishBtn) {
          publishBtn.disabled = false;
          publishBtn.textContent = originalText;
          publishBtn.style.opacity = "1";
        }
      };
      logger.log(`[CommentComposer] 正在检测 Jable 页面与登录态: ${targetUrl}`);
      let completed = false;
      let req = null;
      const timer = setTimeout((() => {
        if (!completed) {
          completed = true;
          resetBtn();
          if (req && typeof req.abort === "function") {
            try {
              req.abort();
            } catch (e) {}
          }
          logger.error("[CommentComposer] 检测 Jable 页面超时");
          Toast("网络请求超时，请稍后重试", 2e3, "error");
        }
      }), 6e3);
      req = GM_xmlhttpRequest({
        "method": "GET",
        "url": targetUrl,
        "timeout": 6e3,
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "referer": domain,
          "User-Agent": navigator.userAgent
        },
        "onload": response => {
          if (completed) {
            return;
          }
          completed = true;
          clearTimeout(timer);
          resetBtn();
          if (response.status === 404) {
            this.panel.jableVideoExists = false;
            this.showTipModal("提示", "该影片在 Jable.tv 上未发布，无法发表评论。");
            return;
          }
          if (response.status >= 200 && response.status < 300) {
            this.panel.jableVideoExists = true;
            const html = response.responseText;
            const doc = (new DOMParser).parseFromString(html, "text/html");
            const commentForm = Array.from(doc.querySelectorAll("form")).find((form => form.querySelector('input[name="action"][value="add_comment"]') || form.querySelector('input[name="action"][value="add_comment_video"]'))) || doc.querySelector('form[id*="comment"]') || doc.querySelector('form[action*="comment"]');
            if (!commentForm) {
              this.showLoginPromptModal(domain);
            } else {
              this.showCommentInputModal(commentForm, targetUrl, domain);
            }
          } else {
            Toast(`检测失败: HTTP ${response.status}`, 2e3, "error");
          }
        },
        "onerror": err => {
          if (completed) {
            return;
          }
          completed = true;
          clearTimeout(timer);
          resetBtn();
          logger.error("[CommentComposer] 检测 Jable 失败:", err);
          Toast("网络请求失败，请稍后重试", 2e3, "error");
        },
        "ontimeout": () => {
          if (completed) {
            return;
          }
          completed = true;
          clearTimeout(timer);
          resetBtn();
          logger.error("[CommentComposer] 检测 Jable 超时");
          Toast("网络请求超时，请稍后重试", 2e3, "error");
        }
      });
    }
    "showTipModal"(title, message) {
      const {"modal": modal, "close": close} = createModal(`\n            <div class="tm-custom-modal-title">${title}</div>\n            <div class="tm-custom-modal-message">${message}</div>\n            <button class="tm-custom-modal-close-btn">确定</button>\n        `);
      modal.querySelector(".tm-custom-modal-close-btn").addEventListener("click", close);
    }
    "showLoginPromptModal"(domain) {
      const {"modal": modal, "close": close} = createModal(`\n            <div class="tm-custom-modal-title">发表评论</div>\n            <div class="tm-custom-modal-message">需要有 Jable 登录态才能发表评论，请先登录。</div>\n            <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">\n                <button class="tm-custom-modal-cancel-btn">取消</button>\n                <button class="tm-custom-modal-login-btn">去登录</button>\n            </div>\n        `);
      modal.querySelector(".tm-custom-modal-cancel-btn").addEventListener("click", close);
      modal.querySelector(".tm-custom-modal-login-btn").addEventListener("click", (() => {
        close();
        this.showLoginModal(domain);
      }));
    }
    "showLoginModal"(domain, onSuccess) {
      let provider = null;
      if (window.loginManager && domain) {
        provider = window.loginManager.providers.find((p => p.domains.some((d => domain.includes(d)))));
      }
      if (!provider && window.loginManager) {
        provider = window.loginManager.getMatchingProvider();
      }
      const siteTitle = provider ? provider.siteKey === "JABLE" ? "Jable.tv" : provider.siteKey === "MISSAV" ? "MissAV" : provider.siteKey : "Jable.tv";
      const {"modal": modal, "close": close} = createModal(`\n            <div class="tm-custom-modal-title" style="margin-bottom: 15px;">登录 ${siteTitle}</div>\n            <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; text-align: left; box-sizing: border-box;">\n                <div style="display: flex; flex-direction: column; gap: 4px;">\n                    <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">用户名 / 邮箱</label>\n                    <input type="text" class="tm-login-username" placeholder="请输入用户名或邮箱" />\n                </div>\n                <div style="display: flex; flex-direction: column; gap: 4px;">\n                    <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">密码</label>\n                    <input type="password" class="tm-login-password" placeholder="请输入密码" />\n                </div>\n                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">\n                    <input type="checkbox" id="tm-login-remember" checked style="cursor: pointer;" />\n                    <label for="tm-login-remember" style="font-size: 12px; color: hsl(var(--shadcn-muted-foreground)); cursor: pointer; user-select: none;">记住密码并开启自动登录</label>\n                </div>\n            </div>\n            <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%; margin-top: 20px;">\n                <button class="tm-custom-modal-cancel-btn">取消</button>\n                <button class="tm-custom-modal-submit-btn">登录</button>\n            </div>\n        `);
      const cancelBtn = modal.querySelector(".tm-custom-modal-cancel-btn");
      cancelBtn.addEventListener("click", close);
      const submitBtn = modal.querySelector(".tm-custom-modal-submit-btn");
      const usernameInput = modal.querySelector(".tm-login-username");
      const passwordInput = modal.querySelector(".tm-login-password");
      if (window.loginManager) {
        usernameInput.value = window.loginManager.userEmail || "";
        passwordInput.value = window.loginManager.userPassword || "";
      }
      submitBtn.addEventListener("click", (async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = modal.querySelector("#tm-login-remember").checked;
        if (!username || !password) {
          Toast("用户名和密码不能为空", 2e3, "warning");
          return;
        }
        usernameInput.disabled = true;
        passwordInput.disabled = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "登录中...";
        cancelBtn.disabled = true;
        try {
          if (!provider && window.loginManager && domain) {
            provider = window.loginManager.providers.find((p => p.domains.some((d => domain.includes(d)))));
          }
          const loginSuccess = provider ? await provider.login(username, password, domain) : false;
          if (loginSuccess) {
            if (window.loginManager) {
              window.loginManager.handleLoginInfoChange({
                "email": username,
                "password": password,
                "autoLogin": remember
              });
            }
            this.updateAllSiteLoginStatuses(true);
            close();
            if (typeof onSuccess === "function") {
              onSuccess();
            } else {
              setTimeout((() => this.handlePublishComment()), 500);
            }
          } else {
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "登录";
            cancelBtn.disabled = false;
          }
        } catch (err) {
          Toast("登录失败，请重试", 2e3, "error");
          usernameInput.disabled = false;
          passwordInput.disabled = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "登录";
          cancelBtn.disabled = false;
        }
      }));
      passwordInput.addEventListener("keydown", (e => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitBtn.click();
        }
      }));
    }
    "showCommentInputModal"(commentForm, targetUrl, domain) {
      const {"modal": modal, "close": close} = createModal(`\n            <div class="tm-custom-modal-title">发表评论</div>\n            <textarea class="tm-comment-input-textarea" placeholder="写下你的精彩评论..." maxlength="1000"></textarea>\n            <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">\n                <button class="tm-custom-modal-cancel-btn">取消</button>\n                <button class="tm-custom-modal-submit-btn">提交</button>\n            </div>\n        `);
      const textarea = modal.querySelector(".tm-comment-input-textarea");
      try {
        textarea.focus({
          "preventScroll": true
        });
      } catch (_) {
        textarea.focus();
      }
      const cancelBtn = modal.querySelector(".tm-custom-modal-cancel-btn");
      cancelBtn.addEventListener("click", close);
      const submitBtn = modal.querySelector(".tm-custom-modal-submit-btn");
      submitBtn.addEventListener("click", (() => {
        const commentText = textarea.value.trim();
        if (!commentText) {
          Toast("评论内容不能为空", 2e3, "warning");
          return;
        }
        if (commentText.length < 3) {
          Toast("评论内容太少，至少输入3个字", 2e3, "warning");
          return;
        }
        textarea.disabled = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "提交中...";
        cancelBtn.disabled = true;
        const provider = window.loginManager && window.loginManager.providers.find((p => p.domains.some((d => domain.includes(d)))));
        (async () => {
          try {
            let success = false;
            if (provider && typeof provider.publishComment === "function") {
              success = await provider.publishComment(commentText, {
                "videoCode": this.videoCode,
                "commentForm": commentForm,
                "targetUrl": targetUrl,
                "domain": domain
              });
            } else {
              success = await new Promise((resolve => {
                const bodyParams = new URLSearchParams;
                commentForm.querySelectorAll("input").forEach((input => {
                  if (input.name && input.type !== "submit") {
                    bodyParams.append(input.name, input.value);
                  }
                }));
                const formTextarea = commentForm.querySelector("textarea");
                const textareaName = formTextarea ? formTextarea.name : "comment";
                bodyParams.append(textareaName, commentText);
                let actionUrl = commentForm.getAttribute("action") || "";
                if (actionUrl.startsWith("/")) {
                  actionUrl = `${domain}${actionUrl}`;
                } else if (!actionUrl.startsWith("http")) {
                  actionUrl = targetUrl;
                }
                logger.log(`[CommentComposer] 正在向 Jable 提交评论: ${actionUrl}`);
                GM_xmlhttpRequest({
                  "method": "POST",
                  "url": actionUrl,
                  "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "referer": targetUrl,
                    "origin": domain,
                    "User-Agent": navigator.userAgent
                  },
                  "data": bodyParams.toString(),
                  "withCredentials": true,
                  "onload": res => {
                    if (res.status === 200 || res.status === 302) {
                      const resHtml = res.responseText || "";
                      if (resHtml.includes("error-field") || resHtml.includes('class="error"') || resHtml.includes('class="err"')) {
                        const docErr = (new DOMParser).parseFromString(resHtml, "text/html");
                        const errEl = docErr.querySelector(".error") || docErr.querySelector(".err") || docErr.querySelector(".message-error");
                        const errMsg = errEl ? errEl.textContent.trim() : "评论提交失败，可能包含敏感词或触发了频率限制。";
                        Toast(errMsg, 3e3, "error");
                        resolve(false);
                      } else {
                        Toast("评论发表成功！", 2e3, "success");
                        resolve(true);
                      }
                    } else {
                      Toast(`提交失败: HTTP ${res.status}`, 2e3, "error");
                      resolve(false);
                    }
                  },
                  "onerror": err => {
                    logger.error("[CommentComposer] 提交评论失败:", err);
                    Toast("网络请求出错，请重试", 2e3, "error");
                    resolve(false);
                  }
                });
              }));
            }
            if (success) {
              close();
              setTimeout((() => this.panel.handleRetry()), 500);
            } else {
              textarea.disabled = false;
              submitBtn.disabled = false;
              submitBtn.textContent = "提交";
              cancelBtn.disabled = false;
            }
          } catch (err) {
            logger.error("[CommentComposer] 发表评论失败:", err);
            textarea.disabled = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "提交";
            cancelBtn.disabled = false;
          }
        })();
      }));
      textarea.addEventListener("keydown", (e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitBtn.click();
        }
      }));
    }
    async "updateSiteLoginStatus"(siteKey) {
      const provider = this.panel.getLoginProviderForSite(siteKey);
      if (!provider) {
        return;
      }
      try {
        const isLoggedIn = await provider.checkLoginStatus();
        if (this.siteLoginStates[siteKey] !== isLoggedIn) {
          this.siteLoginStates[siteKey] = isLoggedIn;
          this.panel.updateLoginBadgeDOM(siteKey);
        }
      } catch (e) {}
    }
    "updateAllSiteLoginStatuses"() {
      let force = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
      const now = Date.now();
      if (!force && this._lastStatusCheckTime && now - this._lastStatusCheckTime < 6e4) {
        return;
      }
      this._lastStatusCheckTime = now;
      const siteKeys = Object.keys(this.siteLoginStates);
      for (const siteKey of siteKeys) {
        this.updateSiteLoginStatus(siteKey);
      }
    }
    async "checkLoginStatus"() {
      try {
        if (window.loginManager) {
          const provider = window.loginManager.getMatchingProvider();
          if (provider && typeof provider.checkLoginStatus === "function") {
            return await provider.checkLoginStatus();
          }
        }
        if ((0, domains.isSiteDomain)("MISSAV")) {
          const loginButton = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
          const userAvatar = document.querySelector(".avatar") || document.querySelector(".user-menu");
          return !loginButton || !!userAvatar;
        } else if ((0, domains.isSiteDomain)("JABLE")) {
          const logoutBtn = document.querySelector('a[href*="logout"]') || document.querySelector(".user-avatar");
          const loginBtn = document.querySelector('a[href*="login"]');
          return !!logoutBtn || !loginBtn;
        }
      } catch (e) {}
      return true;
    }
  }
  function CommentPanel_defineProperty(e, r, t) {
    return (r = CommentPanel_toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      "value": t,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : e[r] = t, e;
  }
  function CommentPanel_toPropertyKey(t) {
    var i = CommentPanel_toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function CommentPanel_toPrimitive(t, r) {
    if ("object" != typeof t || !t) {
      return t;
    }
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) {
        return i;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function parseCommentDate(dateStr) {
    if (!dateStr) {
      return 0;
    }
    const s = dateStr.trim();
    if (/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}/.test(s)) {
      const d = new Date(s.replace(/-/g, "/"));
      if (!isNaN(d.getTime())) {
        return d.getTime();
      }
    }
    const now = Date.now();
    const numMatch = s.match(/(\d+)/);
    if (!numMatch) {
      if (s.includes("昨天") || s.includes("yesterday")) {
        return now - 24 * 60 * 60 * 1e3;
      }
      if (s.includes("前天")) {
        return now - 2 * 24 * 60 * 60 * 1e3;
      }
      return 0;
    }
    const val = parseInt(numMatch[1], 10);
    if (s.includes("秒") || s.includes("second") || s.includes("sec")) {
      return now - val * 1e3;
    }
    if (s.includes("分") || s.includes("minute") || s.includes("min")) {
      return now - val * 60 * 1e3;
    }
    if (s.includes("小时") || s.includes("小時") || s.includes("hour") || s.includes("hr")) {
      return now - val * 60 * 60 * 1e3;
    }
    if (s.includes("天") || s.includes("day") || s.includes("d")) {
      return now - val * 24 * 60 * 60 * 1e3;
    }
    if (s.includes("周") || s.includes("週") || s.includes("week") || s.includes("w")) {
      return now - val * 7 * 24 * 60 * 60 * 1e3;
    }
    if (s.includes("月") || s.includes("month") || s.includes("mo")) {
      return now - val * 30 * 24 * 60 * 60 * 1e3;
    }
    if (s.includes("年") || s.includes("year") || s.includes("yr") || s.includes("y")) {
      return now - val * 365 * 24 * 60 * 60 * 1e3;
    }
    const fallbackDate = new Date(s);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.getTime();
    }
    return 0;
  }
  class CommentPanel {
    static "preload"(videoCode) {
      if (!videoCode) {
        return;
      }
      const showCommentsSection = getValue("showCommentsSection", true);
      const enabledSources = getValue("enabledCommentSources", {
        "jable": true,
        "javdb": true,
        "javlibrary": false
      });
      if (!showCommentsSection) {
        logger.log(`[CommentPanel] 设置中未开启评论区 (showCommentsSection: false)，跳过后台预加载`);
        return;
      }
      CommentPanel.preloadCache.videoCode = videoCode;
      logger.log(`[CommentPanel] 启动后台预加载，番号: ${videoCode}`);
      if (enabledSources.jable !== false) {
        let storedWorkingDomain = "";
        if (typeof GM_getValue === "function") {
          try {
            storedWorkingDomain = GM_getValue("mp_jable_working_domain", "");
          } catch (e) {}
        }
        let domainIndex = 0;
        if (storedWorkingDomain) {
          const idx = JABLE_DOMAINS.indexOf(storedWorkingDomain);
          if (idx !== -1) {
            domainIndex = idx;
          }
        }
        CommentPanel.preloadCache.jableCommentsPromise = fetchJableComments(videoCode, 1, domainIndex).then((res => {
          logger.log(`[CommentPanel] 预加载 Jable 评论成功，共 ${res.comments.length} 条 (域名: ${res.domain || "default"})`);
          return res;
        })).catch((err => {
          logger.warn(`[CommentPanel] 预加载 Jable 评论失败:`, err);
          if (CommentPanel.preloadCache.videoCode === videoCode) {
            CommentPanel.preloadCache.jableCommentsPromise = null;
          }
          throw err;
        }));
      }
      if (!isMobile() && enabledSources.javlib !== false && enabledSources.javlibrary !== false) {
        CommentPanel.preloadCache.javlibVideoIdPromise = fetchJavLibraryVideoId(videoCode).then((result => {
          const {"videoId": videoId, "domain": domain} = result;
          logger.log(`[CommentPanel] 预加载 JAVLibrary ID 成功: ${videoId} (域名: ${domain})`);
          CommentPanel.preloadCache.javlibCommentsPromise = fetchJavLibraryData(videoId, "comments", 1, domain).catch((err => {
            logger.warn("[CommentPanel] 预加载 JAVLib 评论失败:", err);
            if (CommentPanel.preloadCache.videoCode === videoCode) {
              CommentPanel.preloadCache.javlibCommentsPromise = null;
            }
            throw err;
          }));
          CommentPanel.preloadCache.javlibReviewsPromise = fetchJavLibraryData(videoId, "reviews", 1, domain).catch((err => {
            logger.warn("[CommentPanel] 预加载 JAVLib 文章失败:", err);
            if (CommentPanel.preloadCache.videoCode === videoCode) {
              CommentPanel.preloadCache.javlibReviewsPromise = null;
            }
            throw err;
          }));
          return result;
        })).catch((err => {
          logger.warn(`[CommentPanel] 预加载 JAVLibrary ID 失败:`, err);
          if (CommentPanel.preloadCache.videoCode === videoCode) {
            CommentPanel.preloadCache.javlibVideoIdPromise = null;
          }
          throw err;
        }));
      }
      if (enabledSources.javdb !== false) {
        CommentPanel.preloadCache.javdbMovieIdPromise = fetchJavdbMovieId(videoCode).then((result => {
          const {"movieId": movieId, "domain": domain} = result;
          logger.log(`[CommentPanel] 预加载 JavDB MovieId 成功: ${movieId} (域名: ${domain})`);
          CommentPanel.preloadCache.javdbCommentsPromise = fetchJavdbData(movieId, 1, domain).catch((err => {
            logger.warn("[CommentPanel] 预加载 JavDB 短评失败:", err);
            if (CommentPanel.preloadCache.videoCode === videoCode) {
              CommentPanel.preloadCache.javdbCommentsPromise = null;
            }
            throw err;
          }));
          return result;
        })).catch((err => {
          logger.warn(`[CommentPanel] 预加载 JavDB MovieId 失败:`, err);
          if (CommentPanel.preloadCache.videoCode === videoCode) {
            CommentPanel.preloadCache.javdbMovieIdPromise = null;
          }
          throw err;
        }));
      }
    }
    "constructor"(playerCore, controlManager) {
      let uiManager = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      this.playerCore = playerCore;
      this.controlManager = controlManager;
      this.uiManager = uiManager || (playerCore ? playerCore.uiManager : null);
      this.uiElements = (playerCore === null || playerCore === void 0 ? void 0 : playerCore.uiElements) || (controlManager === null || controlManager === void 0 ? void 0 : controlManager.uiElements);
      this.targetVideo = playerCore === null || playerCore === void 0 ? void 0 : playerCore.targetVideo;
      this.loopManager = null;
      this.videoCode = "";
      this.comments = [];
      this.filteredComments = [];
      this.renderedCommentIds = new Set;
      this.totalCount = 0;
      this.currentPage = 1;
      this.hasMore = false;
      this.filterSpam = true;
      this.isLoading = false;
      this.siteLoginStates = {
        "JABLE": null
      };
      this.sites = {
        "jable": {
          "key": "jable",
          "name": "Jable.tv",
          "status": "loading",
          "comments": [],
          "filteredComments": [],
          "totalCount": 0,
          "hasMore": false,
          "currentPage": 1,
          "collapsed": localStorage.getItem("tm-comment-jable-collapsed") === "true",
          "loading": false,
          "unreachable": false,
          "workingDomain": ""
        },
        "javlib": {
          "key": "javlib",
          "name": "JAVLibrary",
          "status": "loading",
          "comments": [],
          "filteredComments": [],
          "totalCount": 0,
          "hasMore": false,
          "currentPage": 1,
          "collapsed": localStorage.getItem("tm-comment-javlib-collapsed") === "true",
          "loading": false,
          "unreachable": false,
          "workingDomain": "",
          "videoId": ""
        },
        "javdb": {
          "key": "javdb",
          "name": "JavDB",
          "status": "loading",
          "comments": [],
          "filteredComments": [],
          "totalCount": 0,
          "hasMore": false,
          "currentPage": 1,
          "collapsed": localStorage.getItem("tm-comment-javdb-collapsed") === "true",
          "loading": false,
          "unreachable": false,
          "movieId": "",
          "workingDomain": ""
        }
      };
      const bindSiteProp = (legacyProp, siteKey, propKey) => {
        Object.defineProperty(this, legacyProp, {
          "get": () => this.sites[siteKey][propKey],
          "set": v => {
            this.sites[siteKey][propKey] = v;
          },
          "configurable": true,
          "enumerable": true
        });
      };
      [ "jable", "javlib", "javdb" ].forEach((key => {
        bindSiteProp(`${key}Status`, key, "status");
        bindSiteProp(`${key}Comments`, key, "comments");
        bindSiteProp(`filtered${key.charAt(0).toUpperCase() + key.slice(1)}Comments`, key, "filteredComments");
        bindSiteProp(`${key}TotalCount`, key, "totalCount");
        bindSiteProp(`${key}HasMore`, key, "hasMore");
        bindSiteProp(`${key}CurrentPage`, key, "currentPage");
        bindSiteProp(`${key}Collapsed`, key, "collapsed");
        bindSiteProp(`${key}Loading`, key, "loading");
        bindSiteProp(`${key}Unreachable`, key, "unreachable");
        bindSiteProp(`${key}WorkingDomain`, key, "workingDomain");
      }));
      bindSiteProp("javlibVideoId", "javlib", "videoId");
      bindSiteProp("javdbMovieId", "javdb", "movieId");
      this.jableVideoExists = null;
      this.jableFailedDomain = "";
      this.javlibVideoExists = null;
      this.javlibCfShield = false;
      this.javlibFailedDomain = "";
      this.javlibVerificationTab = null;
      this.javlibVerifiedListenerId = null;
      this.javlibVerificationTimeout = null;
      this.javlibAutoVerifyAttempted = false;
      this.javlibVerifyingStatus = "";
      this.commentsPanel = null;
      this.commentsList = null;
      this.loadingElement = null;
      this.errorElement = null;
      this.countSpan = null;
      this.filterCheckbox = null;
      this.composer = new CommentComposer(this);
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback((() => this.detectReachability()), {
          "timeout": 4e3
        });
      } else {
        setTimeout((() => this.detectReachability()), 600);
      }
      this.initDelegatedEvents();
      if (this.targetVideo) {
        this.handleMetadataLoadedBound = () => this.reprocessComments();
        this.targetVideo.addEventListener("loadedmetadata", this.handleMetadataLoadedBound);
      }
    }
    get "selectedTagIds"() {
      return this.composer.selectedTagIds;
    }
    set "selectedTagIds"(v) {
      this.composer.selectedTagIds = v;
    }
    get "commentInput"() {
      return this.composer.commentInput;
    }
    set "commentInput"(v) {
      this.composer.commentInput = v;
    }
    get "tagSelectModal"() {
      return this.composer.tagSelectModal;
    }
    set "tagSelectModal"(v) {
      this.composer.tagSelectModal = v;
    }
    get "tagSelectList"() {
      return this.composer.tagSelectList;
    }
    set "tagSelectList"(v) {
      this.composer.tagSelectList = v;
    }
    "setUiManager"(uiManager) {
      this.uiManager = uiManager;
    }
    async "detectReachability"() {
      try {
        const [jableOk, javlibOk, javdbOk] = await Promise.all([ (0, domains.checkSiteReachability)("JABLE"), (0, 
        domains.checkSiteReachability)("JAVLIBRARY"), (0, domains.checkSiteReachability)("JAVDB") ]);
        this.jableUnreachable = !jableOk;
        this.javlibUnreachable = !javlibOk;
        this.javdbUnreachable = !javdbOk;
      } catch (e) {}
    }
    "setDimmed"(dimmed) {
      var _this$uiElements;
      if (!this.commentsPanel) {
        return;
      }
      const handleContainer = ((_this$uiElements = this.uiElements) === null || _this$uiElements === void 0 ? void 0 : _this$uiElements.handleContainer) || document.querySelector(".tm-handle-container");
      if (dimmed) {
        this.commentsPanel.classList.add("is-dimmed");
        if (handleContainer) {
          handleContainer.classList.add("is-dimmed");
        }
      } else {
        this.commentsPanel.classList.remove("is-dimmed");
        if (handleContainer) {
          handleContainer.classList.remove("is-dimmed");
        }
      }
    }
    "applySettingsState"() {
      var _this$playerCore;
      const state = (_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 || (_this$playerCore = _this$playerCore.options) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.playerState;
      if (!state) {
        return;
      }
      this.updateDebugMode(state.settings.debugMode ?? false);
      this.updateCommentsVisibility(state.settings.showCommentsSection ?? true);
    }
    "updateDebugMode"(debugMode) {
      if (!this.commentsPanel) {
        return;
      }
      const actionBar = this.commentsPanel.querySelector(".tm-comments-panel-action-bar");
      if (actionBar) {
        actionBar.style.display = debugMode ? "flex" : "none";
      }
    }
    "updateCommentsVisibility"(showCommentsSection) {
      var _this$playerCore2, _this$playerCore3, _this$playerCore4;
      if (!this.commentsPanel) {
        return;
      }
      const state = (_this$playerCore2 = this.playerCore) === null || _this$playerCore2 === void 0 || (_this$playerCore2 = _this$playerCore2.options) === null || _this$playerCore2 === void 0 ? void 0 : _this$playerCore2.playerState;
      const playerContainer = this.commentsPanel.closest(".tm-player-container") || ((_this$playerCore3 = this.playerCore) === null || _this$playerCore3 === void 0 || (_this$playerCore3 = _this$playerCore3.uiElements) === null || _this$playerCore3 === void 0 ? void 0 : _this$playerCore3.playerContainer);
      const uiManager = (_this$playerCore4 = this.playerCore) === null || _this$playerCore4 === void 0 ? void 0 : _this$playerCore4.uiManager;
      if (playerContainer) {
        if (!showCommentsSection) {
          playerContainer.classList.add("tm-sidebar-hidden");
          this.commentsPanel.style.display = "none";
        } else {
          var _state$settings;
          this.commentsPanel.style.display = "flex";
          if (!(state !== null && state !== void 0 && (_state$settings = state.settings) !== null && _state$settings !== void 0 && _state$settings.sidebarHidden)) {
            playerContainer.classList.remove("tm-sidebar-hidden");
          }
        }
      }
      if (uiManager && typeof uiManager.updateSidebarButtonsVisibility === "function") {
        uiManager.updateSidebarButtonsVisibility();
      }
      this.updateCommentSources();
    }
    "updateCommentSources"() {
      var _this$playerCore5, _state$settings2;
      const state = (_this$playerCore5 = this.playerCore) === null || _this$playerCore5 === void 0 || (_this$playerCore5 = _this$playerCore5.options) === null || _this$playerCore5 === void 0 ? void 0 : _this$playerCore5.playerState;
      const enabledSources = (state === null || state === void 0 || (_state$settings2 = state.settings) === null || _state$settings2 === void 0 ? void 0 : _state$settings2.enabledCommentSources) || {
        "jable": true,
        "javdb": true,
        "javlibrary": false
      };
      [ "jable", "javlib", "javdb" ].forEach((siteKey => {
        var _this$commentsList, _this$sites$siteKey, _this$sites$siteKey2, _this$sites$siteKey3;
        const isEnabled = siteKey === "javlib" ? enabledSources.javlib !== false && enabledSources.javlibrary !== false : enabledSources[siteKey] !== false;
        const sectionEl = (_this$commentsList = this.commentsList) === null || _this$commentsList === void 0 ? void 0 : _this$commentsList.querySelector(`#tm-comment-section-${siteKey}`);
        if (sectionEl) {
          sectionEl.style.display = isEnabled ? "block" : "none";
        }
        if (isEnabled && ((_this$sites$siteKey = this.sites[siteKey]) === null || _this$sites$siteKey === void 0 || (_this$sites$siteKey = _this$sites$siteKey.comments) === null || _this$sites$siteKey === void 0 ? void 0 : _this$sites$siteKey.length) === 0 && ((_this$sites$siteKey2 = this.sites[siteKey]) === null || _this$sites$siteKey2 === void 0 ? void 0 : _this$sites$siteKey2.status) !== "loading" && ((_this$sites$siteKey3 = this.sites[siteKey]) === null || _this$sites$siteKey3 === void 0 ? void 0 : _this$sites$siteKey3.status) !== "loaded") {
          this.loadSiteComments(siteKey, 1);
        }
      }));
      this.updateCommentsCount();
    }
    "initDelegatedEvents"() {
      if (!this.uiElements || !this.uiElements.playerContainer) {
        return;
      }
      this.uiElements.playerContainer.addEventListener("click", (e => {
        const timeLink = e.target.closest(".jc-time-link");
        const codeLink = e.target.closest(".jc-code-link");
        const retryBtn = e.target.closest(".tm-comment-retry-btn");
        const toggleExpandBtn = e.target.closest(".jc-toggle-expand-btn");
        if (timeLink) {
          e.stopPropagation();
          const secsAttr = timeLink.getAttribute("data-secs");
          if (secsAttr) {
            try {
              const secs = JSON.parse(secsAttr);
              this.handleTimeClick(secs);
            } catch (err) {
              const secs = parseFloat(secsAttr);
              this.handleTimeClick(secs);
            }
          }
        } else if (codeLink) {
          e.stopPropagation();
          const code = codeLink.getAttribute("data-code");
          if (code) {
            this.handleCodeClick(code);
          }
        } else if (retryBtn) {
          e.stopPropagation();
          this.handleRetry();
        }
      }));
    }
    "handleTimeClick"(secs) {
      let targetSecs = secs;
      let isRange = false;
      if (Array.isArray(secs)) {
        targetSecs = secs[0];
        isRange = true;
      }
      try {
        telemetry.trackTimestampClick({
          "secs": secs,
          "avcode": this.videoCode || "",
          "source": "comment"
        });
      } catch (_) {}
      if (this.targetVideo) {
        this.targetVideo.currentTime = targetSecs;
        this.targetVideo.play().catch((() => {}));
        const toastMsg = isRange && secs.length >= 2 ? `已跳转至区间 ${formatSeconds(secs[0])} ~ ${formatSeconds(secs[1])}` : `已跳转至 ${formatSeconds(targetSecs)}`;
        Toast(toastMsg, 2e3, "info");
        const lm = this.getLoopManager();
        if (isRange && secs.length >= 2 && lm && typeof lm.setLoopRange === "function") {
          lm.setLoopRange(secs[0], secs[1]);
        }
        if (this.uiManager) {
          this.uiManager.showControls();
        }
        if (this.controlManager && typeof this.controlManager.showJumpHint === "function") {
          this.controlManager.showJumpHint(targetSecs);
        }
      }
    }
    async "loadComments"() {
      let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
      if (!this.videoCode) {
        return;
      }
      this.isLoading = true;
      if (page === 1) {
        var _this$playerCore6, _state$settings3;
        this.currentPage = 1;
        this.renderedCommentIds.clear();
        if (!this.jableCollapsed && !this.javlibCollapsed && !this.javdbCollapsed) {
          this.javlibCollapsed = true;
          this.javdbCollapsed = true;
        }
        const state = (_this$playerCore6 = this.playerCore) === null || _this$playerCore6 === void 0 || (_this$playerCore6 = _this$playerCore6.options) === null || _this$playerCore6 === void 0 ? void 0 : _this$playerCore6.playerState;
        const enabledSources = (state === null || state === void 0 || (_state$settings3 = state.settings) === null || _state$settings3 === void 0 ? void 0 : _state$settings3.enabledCommentSources) || {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        };
        const promises = [];
        if (enabledSources.jable !== false) {
          promises.push(this.loadJableComments(1));
        }
        if (enabledSources.javlib !== false && enabledSources.javlibrary !== false) {
          promises.push(this.loadJavlibComments(1));
        }
        if (enabledSources.javdb !== false) {
          promises.push(this.loadJavdbComments(1));
        }
        this.renderCommentsList();
        setTimeout((() => this.updateAllSiteLoginStatuses()), 1500);
        await Promise.allSettled(promises);
        if (this.filteredJableComments.length === 0) {
          if (this.filteredJavdbComments.length > 0) {
            this.jableCollapsed = true;
            this.javdbCollapsed = false;
            this.javlibCollapsed = true;
          } else if (this.filteredJavlibComments.length > 0) {
            this.jableCollapsed = true;
            this.javdbCollapsed = true;
            this.javlibCollapsed = false;
          }
        }
        this.renderCommentsList();
      } else {
        const promises = [];
        if (this.jableHasMore && !this.jableCollapsed) {
          promises.push(this.loadJableComments(this.jableCurrentPage + 1));
        }
        if (this.javlibHasMore && !this.javlibCollapsed) {
          promises.push(this.loadJavlibComments(this.javlibCurrentPage + 1));
        }
        if (this.javdbHasMore && !this.javdbCollapsed) {
          promises.push(this.loadJavdbComments(this.javdbCurrentPage + 1));
        }
        if (promises.length > 0) {
          await Promise.allSettled(promises);
          this.currentPage = Math.max(this.jableCurrentPage, this.javlibCurrentPage, this.javdbCurrentPage);
        }
      }
      this.isLoading = false;
    }
    async "loadSiteComments"(siteKey) {
      var _this$playerCore7, _state$settings4;
      let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
      if (!this.videoCode) {
        return;
      }
      const site = this.sites[siteKey];
      if (!site) {
        return;
      }
      const state = (_this$playerCore7 = this.playerCore) === null || _this$playerCore7 === void 0 || (_this$playerCore7 = _this$playerCore7.options) === null || _this$playerCore7 === void 0 ? void 0 : _this$playerCore7.playerState;
      const enabledSources = (state === null || state === void 0 || (_state$settings4 = state.settings) === null || _state$settings4 === void 0 ? void 0 : _state$settings4.enabledCommentSources) || {
        "jable": true,
        "javdb": true,
        "javlibrary": false
      };
      const isSiteEnabled = siteKey === "javlib" ? enabledSources.javlib !== false && enabledSources.javlibrary !== false : enabledSources[siteKey] !== false;
      if (!isSiteEnabled) {
        logger.log(`[CommentPanel] 站点 ${siteKey} 在设置中已禁用，取消评论抓取。`);
        site.loading = false;
        return;
      }
      if (siteKey === "javlib" && isMobile()) {
        site.loading = false;
        site.status = "mobile_unsupported";
        site.comments = [];
        site.filteredComments = [];
        this.applyFilter();
        this.renderCommentsList();
        this.updateCommentsCount();
        return;
      }
      site.loading = true;
      if (page === 1) {
        site.status = "loading";
        site.comments = [];
        site.filteredComments = [];
        site.totalCount = 0;
        site.hasMore = false;
        if (siteKey === "javlib") {
          this.javlibCfShield = false;
          this.javlibFailedDomain = "";
        }
      } else {
        this.showBottomLoader(siteKey);
      }
      try {
        let res;
        if (siteKey === "jable") {
          let jableResPromise;
          if (page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.jableCommentsPromise) {
            logger.log("[CommentPanel] 使用预加载的 Jable.tv 评论...");
            jableResPromise = CommentPanel.preloadCache.jableCommentsPromise;
          } else {
            let domainIndex = 0;
            let storedWorkingDomain = "";
            if (typeof GM_getValue === "function") {
              try {
                storedWorkingDomain = GM_getValue("mp_jable_working_domain", "");
              } catch (e) {}
            }
            const defaultDomain = site.workingDomain || storedWorkingDomain;
            if (defaultDomain) {
              const idx = JABLE_DOMAINS.indexOf(defaultDomain);
              if (idx !== -1) {
                domainIndex = idx;
              }
            }
            jableResPromise = fetchJableComments(this.videoCode, page, domainIndex);
          }
          res = await jableResPromise;
          this.jableVideoExists = true;
          if (res.domain) {
            site.workingDomain = res.domain;
            if (typeof GM_setValue === "function") {
              try {
                GM_setValue("mp_jable_working_domain", res.domain);
              } catch (e) {}
            }
          }
        } else if (siteKey === "javlib") {
          let isShadowActive = await CrossDomainBridge.checkShadowActive("JAVLIBRARY");
          if (isShadowActive) {
            logger.log("[CommentPanel] 检测到 JAVLibrary 影子通道在线，优先通过影子协同获取数据...");
            const shadowRes = await CrossDomainBridge.sendCommand("JAVLIBRARY", "FETCH_JAVLIB_DATA", {
              "avcode": this.videoCode,
              "page": page
            });
            if (shadowRes) {
              const {"idResult": idResult, "cRes": cRes, "rRes": rRes} = shadowRes;
              site.videoId = idResult.videoId;
              site.workingDomain = idResult.domain;
              this.javlibVideoExists = true;
              rRes.comments.forEach((c => {
                c.site = "javlib-review";
              }));
              res = {
                "comments": [ ...cRes.comments, ...rRes.comments ],
                "totalCount": cRes.totalCount + rRes.totalCount,
                "hasMore": cRes.hasMore || rRes.hasMore
              };
            } else {
              logger.log("[CommentPanel] JAVLibrary 影子通道同源抓取失败，降级为跨域直连抓取...");
            }
          }
          if (!res) {
            let videoId = site.videoId;
            let workingDomain = site.workingDomain;
            if (!videoId) {
              let idPromise;
              if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibVideoIdPromise) {
                logger.log("[CommentPanel] 使用预加载的 JAVLibrary ID...");
                idPromise = CommentPanel.preloadCache.javlibVideoIdPromise;
              } else {
                idPromise = fetchJavLibraryVideoId(this.videoCode);
              }
              const result = await idPromise;
              videoId = result.videoId;
              workingDomain = result.domain;
              site.videoId = videoId;
              site.workingDomain = workingDomain;
            }
            const domain = workingDomain || JAVLIB_DOMAINS[0];
            const cPromise = page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibCommentsPromise ? CommentPanel.preloadCache.javlibCommentsPromise : fetchJavLibraryData(videoId, "comments", page, domain);
            const rPromise = page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibReviewsPromise ? CommentPanel.preloadCache.javlibReviewsPromise : fetchJavLibraryData(videoId, "reviews", page, domain);
            const [cRes, rRes] = await Promise.all([ cPromise.catch((err => {
              logger.warn("[CommentPanel] 获取 JAVLibrary 评论失败:", err);
              throw err;
            })), rPromise.catch((err => {
              logger.warn("[CommentPanel] 获取 JAVLibrary 文章失败:", err);
              throw err;
            })) ]);
            rRes.comments.forEach((c => {
              c.site = "javlib-review";
            }));
            res = {
              "comments": [ ...cRes.comments, ...rRes.comments ],
              "totalCount": cRes.totalCount + rRes.totalCount,
              "hasMore": cRes.hasMore || rRes.hasMore
            };
          }
        } else if (siteKey === "javdb") {
          let movieId = site.movieId;
          let workingDomain = site.workingDomain;
          if (!movieId) {
            let idPromise;
            if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javdbMovieIdPromise) {
              logger.log("[CommentPanel] 使用预加载的 JavDB ID...");
              idPromise = CommentPanel.preloadCache.javdbMovieIdPromise;
            } else {
              idPromise = fetchJavdbMovieId(this.videoCode);
            }
            const result = await idPromise;
            movieId = result.movieId;
            workingDomain = result.domain;
            site.movieId = movieId;
            site.workingDomain = workingDomain;
          }
          const domain = workingDomain || JAVDB_DOMAINS[0];
          const resPromise = page === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javdbCommentsPromise ? CommentPanel.preloadCache.javdbCommentsPromise : fetchJavdbData(movieId, page, domain);
          res = await resPromise;
        }
        const duration = this.targetVideo ? this.targetVideo.duration : 10800;
        const processed = (res.comments || []).map(((c, idx) => {
          const proc = processComment(c.text, this.videoCode, duration);
          return {
            ...c,
            ...proc,
            "_timestamp": parseCommentDate(c.time),
            "_originalIndex": (page - 1) * 50 + idx
          };
        }));
        if (page === 1) {
          site.comments = processed;
        } else {
          const existingIds = new Set(site.comments.map((c => c.id)));
          const uniqueNew = processed.filter((c => !existingIds.has(c.id)));
          site.comments = [ ...site.comments, ...uniqueNew ];
        }
        if (siteKey === "jable") {
          site.comments.sort(((a, b) => (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0)));
        }
        site.totalCount = res.totalCount || site.comments.length;
        site.hasMore = res.hasMore;
        site.status = site.comments.length === 0 ? "empty" : "loaded";
        site.currentPage = page;
      } catch (err) {
        logger.warn(`[CommentPanel] 获取 ${site.name} 评论失败:`, err);
        if (siteKey === "javlib") {
          this.handleJavlibError(err);
        } else {
          const msg = err.message || "";
          if (msg.includes("404") || msg.includes("not found")) {
            if (siteKey === "jable") {
              this.jableVideoExists = false;
            }
            site.status = "not_found";
          } else if (msg.includes("人机验证") || msg.startsWith("CF_SHIELD_ON_") || msg.includes("cf-challenge") || msg.includes("Cloudflare") || msg.includes("cloudflare")) {
            site.status = "cf_shield";
            if (siteKey === "jable") {
              this.jableFailedDomain = err.domain || site.workingDomain || JABLE_DOMAINS[0];
            }
          } else {
            site.status = "unreachable";
          }
        }
        if (page === 1) {
          site.comments = [];
          site.filteredComments = [];
        }
      } finally {
        site.loading = false;
        this.applyFilter();
        this.renderCommentsList();
        this.updateCommentsCount();
        this.hideBottomLoader(siteKey);
      }
    }
    "loadJableComments"() {
      let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
      return this.loadSiteComments("jable", page);
    }
    "loadJavlibComments"() {
      let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
      return this.loadSiteComments("javlib", page);
    }
    "loadJavdbComments"() {
      let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
      return this.loadSiteComments("javdb", page);
    }
    "handleJavlibError"(err) {
      const msg = err.message || "";
      if (msg.startsWith("CF_SHIELD_ON_")) {
        this.javlibStatus = "cf_shield";
        this.javlibCfShield = true;
        this.javlibFailedDomain = msg.replace("CF_SHIELD_ON_", "");
      } else if (msg === "CLOUDFLARE_SHIELD") {
        this.javlibStatus = "cf_shield";
        this.javlibCfShield = true;
      } else if (msg.includes("Movie not found") || msg.includes("404")) {
        this.javlibStatus = "not_found";
      } else {
        this.javlibStatus = "unreachable";
      }
    }
    "handleCodeClick"(code) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then((() => {
          Toast(`番号已复制: ${code}`, 2e3, "success");
        })).catch((err => {
          this.fallbackCopyText(code);
        }));
      } else {
        this.fallbackCopyText(code);
      }
    }
    "fallbackCopyText"(text) {
      copyToClipboard(text).then((success => {
        if (success) {
          Toast(`番号已复制: ${text}`, 2e3, "success");
        } else {
          Toast(`复制失败，请手动复制: ${text}`, 3e3, "warning");
        }
      }));
    }
    "handleCopyAllComments"() {
      const totalJable = this.jableComments ? this.jableComments.length : 0;
      const totalJavlib = this.javlibComments ? this.javlibComments.length : 0;
      if (totalJable === 0 && totalJavlib === 0) {
        Toast("暂无已加载的评论可复制", 2e3, "warning");
        return;
      }
      let lines = [];
      lines.push(`=== Miss Player Comments Copy (AVCode: ${this.videoCode || "unknown"}) ===`);
      lines.push(`Exported At: ${(new Date).toISOString()}`);
      lines.push(`Total Jable Comments: ${totalJable}`);
      lines.push(`Total JAVLibrary Comments: ${totalJavlib}`);
      lines.push("");
      lines.push("--- JABLE.TV COMMENTS ---");
      if (totalJable === 0) {
        lines.push("(No Jable comments loaded)");
      } else {
        this.jableComments.forEach(((c, index) => {
          lines.push(`[Comment #${index + 1}]`);
          lines.push(`User: ${c.user}`);
          lines.push(`Time: ${c.time}`);
          lines.push(`Spam: ${c.spam.label}${c.spam.reason ? ` (Reason: ${c.spam.reason})` : ""}`);
          lines.push(`Content:`);
          lines.push(c.text);
          lines.push("--------------------");
        }));
      }
      lines.push("");
      lines.push("--- JAVLIBRARY COMMENTS ---");
      if (totalJavlib === 0) {
        lines.push("(No JAVLibrary comments loaded)");
      } else {
        this.javlibComments.forEach(((c, index) => {
          lines.push(`[Comment #${index + 1}]`);
          lines.push(`User: ${c.user}`);
          lines.push(`Time: ${c.time}`);
          lines.push(`Spam: ${c.spam.label}${c.spam.reason ? ` (Reason: ${c.spam.reason})` : ""}`);
          if (c.score) {
            lines.push(`Score: ${c.score}`);
          }
          lines.push(`Content:`);
          lines.push(c.text);
          lines.push("--------------------");
        }));
      }
      const fullText = lines.join("\n");
      const doCopy = text => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        } else {
          return new Promise(((resolve, reject) => {
            try {
              const textarea = document.createElement("textarea");
              textarea.value = text;
              textarea.style.position = "fixed";
              textarea.style.opacity = "0";
              document.body.appendChild(textarea);
              textarea.select();
              const success = document.execCommand("copy");
              document.body.removeChild(textarea);
              if (success) {
                resolve();
              } else {
                reject(new Error("execCommand failed"));
              }
            } catch (e) {
              reject(e);
            }
          }));
        }
      };
      doCopy(fullText).then((() => {
        Toast("所有已加载的原始评论已复制到剪贴板！", 2e3, "success");
      })).catch((err => {
        Toast("复制失败，请尝试在浏览器控制台手动复制", 3e3, "error");
      }));
    }
    "showCloudflarePrompt"(failedDomain) {
      const targetDomain = failedDomain || `https://${domains.SITE_DOMAINS.JAVLIBRARY.primary}`;
      if (this.loadingElement) {
        this.loadingElement.style.display = "none";
      }
      if (this.commentsList) {
        this.commentsList.style.display = "none";
      }
      if (this.errorElement) {
        this.errorElement.style.display = "flex";
        this.errorElement.style.flexDirection = "column";
        this.errorElement.style.alignItems = "center";
        this.errorElement.style.justifyContent = "center";
        this.errorElement.style.gap = "8px";
        this.errorElement.innerHTML = `\n                <div style="text-align: center; padding: 12px; font-size: 13px; color: hsl(var(--shadcn-destructive));">\n                    <p style="margin: 0 0 6px 0; font-weight: 600;">触发 JAVLibrary 防火墙验证</p>\n                    <p style="margin: 0 0 12px 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">需要您先去 JAVLibrary 完成人机验证以获得授权Cookie。</p>\n                    <a href="${targetDomain}/cn/" target="_blank" class="tm-comments-verify-link" style="display: inline-block; padding: 6px 16px; font-size: 11px; background-color: hsl(var(--shadcn-blue)); color: white; border-radius: 14px; text-decoration: none; font-weight: 600; box-shadow: 0 2px 6px hsla(var(--shadcn-blue)/0.3); transition: all 0.2s;">去验证 (验证后返回重试)</a>\n                    <button class="tm-comment-retry-btn" style="display: block; margin: 10px auto 0 auto; padding: 4px 12px; font-size: 10px; background-color: hsla(var(--shadcn-muted) / 0.1); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 4px; cursor: pointer; transition: all 0.2s;">我已验证，点击重试</button>\n                </div>\n            `;
      }
    }
    "startJavlibBackgroundVerification"(failedDomain) {
      if (this.javlibAutoVerifyAttempted) {
        return;
      }
      this.javlibAutoVerifyAttempted = true;
      const targetDomain = failedDomain || `https://${domains.SITE_DOMAINS.JAVLIBRARY.primary}`;
      logger.log(`尝试启动 JAVLibrary 后台验证，目标域名: ${targetDomain}`);
      this.javlibVerifyingStatus = "verifying";
      this.renderCommentsList();
      this.startSignalListener();
      const verifyUrl = `${targetDomain}/cn/?cf_verify=1`;
      const now = Date.now();
      const lastVerifyStart = (typeof GM_getValue === "function" ? GM_getValue("javlib_verifying_start_time") : 0) || 0;
      const isAlreadyVerifying = typeof GM_getValue === "function" && GM_getValue("javlib_verifying") === true && now - lastVerifyStart < 15e3;
      if (isAlreadyVerifying) {
        logger.log("监测到其他标签页已经在进行 JAVLibrary 验证，本标签页仅挂载监听器。");
      } else {
        logger.log("无其他活跃验证标签页，尝试启动后台验证标签页。");
        if (typeof GM_setValue === "function") {
          GM_setValue("javlib_verifying", true);
          GM_setValue("javlib_verifying_start_time", now);
        }
        try {
          if (typeof GM_openInTab === "function") {
            this.javlibVerificationTab = GM_openInTab(verifyUrl, {
              "active": false,
              "insert": true,
              "pinned": true
            });
            logger.log("已通过 GM_openInTab 打开后台静默验证标签页。");
          } else if (typeof GM !== "undefined" && typeof GM.openInTab === "function") {
            const tabRes = GM.openInTab(verifyUrl, {
              "active": false,
              "insert": true,
              "pinned": true
            });
            if (tabRes && typeof tabRes.then === "function") {
              tabRes.then((tab => {
                this.javlibVerificationTab = tab;
              })).catch((e => {
                logger.error("GM.openInTab 异步启动失败:", e);
              }));
            } else {
              this.javlibVerificationTab = tabRes;
            }
            logger.log("已通过 GM.openInTab 打开后台静默验证标签页。");
          } else {
            logger.warn("GM_openInTab 和 GM.openInTab 均未定义，降级为手动验证。");
            this.handleJavlibVerificationTimeout(failedDomain);
            return;
          }
        } catch (e) {
          logger.error("启动后台验证标签页失败:", e);
          this.handleJavlibVerificationTimeout(failedDomain);
          return;
        }
      }
      this.javlibVerificationTimeout = setTimeout((() => {
        logger.warn("JAVLibrary 后台验证超时，切换至手动验证提示。");
        this.handleJavlibVerificationTimeout(failedDomain);
      }), 15e3);
    }
    "handleJavlibVerificationSuccess"() {
      this.cleanupJavlibVerification();
      this.javlibCfShield = false;
      this.javlibVerifyingStatus = "";
      this.handleRetry("javlib");
    }
    "handleJavlibVerificationTimeout"(failedDomain) {
      this.cleanupJavlibVerification(true);
      this.javlibVerifyingStatus = "manual";
      this.renderCommentsList();
    }
    "cleanupJavlibVerification"() {
      let keepListener = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
      if (this.javlibVerificationTimeout) {
        clearTimeout(this.javlibVerificationTimeout);
        this.javlibVerificationTimeout = null;
      }
      if (!keepListener) {
        if (this.javlibVerifiedListenerId && typeof GM_removeValueChangeListener === "function") {
          GM_removeValueChangeListener(this.javlibVerifiedListenerId);
          this.javlibVerifiedListenerId = null;
        }
        if (this.javlibVerifiedPollInterval) {
          clearInterval(this.javlibVerifiedPollInterval);
          this.javlibVerifiedPollInterval = null;
        }
      }
      if (this.javlibVerificationTab) {
        logger.log("保持后台验证标签页存活，充当影子 Broker。");
        this.javlibVerificationTab = null;
      }
      if (typeof GM_setValue === "function") {
        GM_setValue("javlib_verifying", false);
      }
    }
    "startSignalListener"() {
      if (this.javlibVerifiedListenerId || this.javlibVerifiedPollInterval) {
        return;
      }
      if (typeof GM_addValueChangeListener === "function") {
        this.javlibVerifiedListenerId = GM_addValueChangeListener("javlib_verified_time", ((key, oldValue, newValue, remote) => {
          logger.log("监听到 JAVLibrary 验证成功信号 (监听器)！");
          this.handleJavlibVerificationSuccess();
        }));
      } else {
        logger.log("GM_addValueChangeListener 未定义，使用轮询方式监听验证信号。");
        const initialTime = (typeof GM_getValue === "function" ? GM_getValue("javlib_verified_time") : 0) || 0;
        this.javlibVerifiedPollInterval = setInterval((() => {
          const latestTime = (typeof GM_getValue === "function" ? GM_getValue("javlib_verified_time") : 0) || 0;
          if (latestTime > initialTime) {
            logger.log("通过轮询监听到 JAVLibrary 验证成功信号！");
            this.handleJavlibVerificationSuccess();
          }
        }), 1e3);
      }
    }
    "applyFilter"() {
      if (this.filterSpam) {
        this.filteredJableComments = this.jableComments.filter((c => c.spam.label !== "SPAM"));
        this.filteredJavlibComments = this.javlibComments.filter((c => c.spam.label !== "SPAM"));
        this.filteredJavdbComments = this.javdbComments.filter((c => c.spam.label !== "SPAM"));
      } else {
        this.filteredJableComments = this.jableComments;
        this.filteredJavlibComments = this.javlibComments;
        this.filteredJavdbComments = this.javdbComments;
      }
      this.filteredComments = [ ...this.filteredJableComments, ...this.filteredJavlibComments, ...this.filteredJavdbComments ];
      this.comments = [ ...this.jableComments, ...this.javlibComments, ...this.javdbComments ];
    }
    "createCommentRow"() {
      this.commentsPanel = document.createElement("div");
      this.commentsPanel.className = "tm-comments-panel";
      this.commentsPanel.innerHTML = `\n            <div class="tm-comments-list tm-comments-panel-list"></div>\n            <div class="tm-comment-loading tm-comments-panel-loading" style="display: none;"></div>\n            <div class="tm-comment-error tm-comments-panel-error" style="display: none;"></div>\n            <div class="tm-comment-submit-bar-wrapper">\n                <div class="tm-comment-tag-select-modal">\n                    <div class="tm-tag-select-header">\n                        <div class="tm-tag-select-btn-group">\n                            <button type="button" class="tm-tag-select-all-btn">全选</button>\n                            <button type="button" class="tm-tag-deselect-all-btn">取消全选</button>\n                        </div>\n                        <button type="button" class="tm-tag-select-close-btn" title="关闭">✕</button>\n                    </div>\n                    <div class="tm-tag-select-list"></div>\n                </div>\n                <div class="tm-comment-submit-bar">\n                    <button type="button" class="tm-comment-add-tag-btn" title="插入/勾选高光标签">\n                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg>\n                    </button>\n                    <input type="text" class="tm-comment-text-input" placeholder="Comment" />\n                    <button type="button" class="tm-comment-send-btn">${__("send")}</button>\n                </div>\n            </div>\n            <div class="tm-comments-panel-action-bar" style="display: none;">\n                <div class="tm-action-bar-left">\n                    <span class="tm-comment-count">共 0 条评论</span>\n                    <button class="tm-comment-copy-all-btn" title="一键复制所有加载的原始评论">${__("commentsCopyAll")}</button>\n                </div>\n                <div class="tm-action-bar-right">\n                    <label class="tm-comment-filter-label">\n                        <input type="checkbox" class="tm-comment-filter-checkbox" ${this.filterSpam ? "checked" : ""} />\n                        <span>${__("commentsFilterSpam")}</span>\n                    </label>\n                </div>\n            </div>\n            <button class="tm-show-controls-float-btn" title="显示控制面板">${KEYBOARD}</button>\n        `;
      this.commentsList = this.commentsPanel.querySelector(".tm-comments-list");
      this.loadingElement = this.commentsPanel.querySelector(".tm-comment-loading");
      this.errorElement = this.commentsPanel.querySelector(".tm-comment-error");
      this.countSpan = this.commentsPanel.querySelector(".tm-comment-count");
      this.filterCheckbox = this.commentsPanel.querySelector(".tm-comment-filter-checkbox");
      this.initCommentSubmitBar();
      if (this.filterCheckbox) {
        this.filterCheckbox.addEventListener("change", (e => {
          this.filterSpam = e.target.checked;
          this.applyFilter();
          this.renderCommentsList();
        }));
      }
      const showControlsBtn = this.commentsPanel.querySelector(".tm-show-controls-float-btn");
      if (showControlsBtn) {
        showControlsBtn.addEventListener("click", (e => {
          e.stopPropagation();
          if (this.uiManager) {
            this.uiManager.showControls();
            this.uiManager.autoHideControls();
          }
        }));
      }
      const copyBtn = this.commentsPanel.querySelector(".tm-comment-copy-all-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", (e => {
          e.stopPropagation();
          this.handleCopyAllComments();
        }));
      }
      this.applySettingsState();
      const hideControlsOnScroll = () => {
        if (this.uiManager && this.uiManager.controlsVisible) {
          if (this.uiManager.isFloatingControlPanel) {
            return;
          }
          this.uiManager.hideControls(true);
        }
      };
      this.commentsList.addEventListener("touchmove", hideControlsOnScroll, {
        "passive": true
      });
      this.commentsList.addEventListener("wheel", (e => {
        hideControlsOnScroll();
        const scrollTarget = e.target.closest(".tm-comment-section-body");
        const isAtTop = !scrollTarget || scrollTarget.scrollTop <= 5;
        if (e.deltaY < 0 && isAtTop) {
          this.updatePosition();
        }
      }), {
        "passive": true
      });
      let isCheckingScroll = false;
      this.commentsList.addEventListener("scroll", (e => {
        const scrollTarget = e.target;
        if (!scrollTarget || !scrollTarget.classList.contains("tm-comment-section-body")) {
          return;
        }
        if (isCheckingScroll) {
          return;
        }
        isCheckingScroll = true;
        requestAnimationFrame((() => {
          isCheckingScroll = false;
          const section = scrollTarget.closest(".tm-comment-section");
          if (section) {
            if (scrollTarget.scrollHeight - scrollTarget.scrollTop - scrollTarget.clientHeight < 500) {
              if (section.id === "tm-comment-section-jable") {
                this.triggerLoadMoreJable();
              } else if (section.id === "tm-comment-section-javlib") {
                this.triggerLoadMoreJavlib();
              } else if (section.id === "tm-comment-section-javdb") {
                this.triggerLoadMoreJavdb();
              }
            }
          }
        }));
      }), {
        "capture": true,
        "passive": true
      });
      let startY = 0;
      this.commentsList.addEventListener("touchstart", (e => {
        startY = e.touches[0].clientY;
      }), {
        "passive": true
      });
      this.commentsList.addEventListener("touchmove", (e => {
        const endY = e.touches[0].clientY;
        const diffY = startY - endY;
        const scrollTarget = e.target.closest(".tm-comment-section-body");
        const isAtBottom = scrollTarget ? scrollTarget.scrollHeight - scrollTarget.scrollTop - scrollTarget.clientHeight < 500 : false;
        const isAtTop = scrollTarget ? scrollTarget.scrollTop <= 5 : true;
        if (diffY > 15 && isAtBottom && scrollTarget) {
          const section = scrollTarget.closest(".tm-comment-section");
          if (section) {
            if (section.id === "tm-comment-section-jable") {
              this.triggerLoadMoreJable();
            } else if (section.id === "tm-comment-section-javlib") {
              this.triggerLoadMoreJavlib();
            } else if (section.id === "tm-comment-section-javdb") {
              this.triggerLoadMoreJavdb();
            }
          }
        }
        if (diffY < -15 && isAtTop) {
          this.updatePosition();
        }
      }), {
        "passive": true
      });
      if (this.uiElements && this.uiElements.playerContainer) {
        const handleContainer = this.uiElements.handleContainer;
        if (handleContainer && handleContainer.parentNode === this.uiElements.playerContainer) {
          this.uiElements.playerContainer.insertBefore(this.commentsPanel, handleContainer.nextSibling);
        } else {
          this.uiElements.playerContainer.appendChild(this.commentsPanel);
        }
      }
      this.commentsPanel.addEventListener("click", (e => {
        const interactive = e.target.closest("a, button, input, label, .jc-time-link, .jc-code-link, .jc-toggle-expand-btn, .tm-comment-retry-btn");
        const toggleExpandBtn = e.target.closest(".jc-toggle-expand-btn");
        const collapsible = e.target.closest(".jc-body-text--collapsible");
        if (toggleExpandBtn && collapsible) {
          e.stopPropagation();
          const isCollapsed = collapsible.getAttribute("data-collapsed") === "true";
          collapsible.setAttribute("data-collapsed", isCollapsed ? "false" : "true");
          toggleExpandBtn.textContent = isCollapsed ? __("commentsCollapse") || "收起" : __("commentsExpand") || "展开";
          return;
        }
        if (collapsible && !interactive) {
          const isCollapsed = collapsible.getAttribute("data-collapsed") === "true";
          if (isCollapsed) {
            e.stopPropagation();
            collapsible.setAttribute("data-collapsed", "false");
            const btn = collapsible.querySelector(".jc-toggle-expand-btn");
            if (btn) {
              btn.textContent = __("commentsCollapse") || "收起";
            }
            return;
          }
        }
        if (interactive) {
          return;
        }
        e.stopPropagation();
        if (this.uiManager) {
          if (this.uiManager.isFloatingControlPanel) {
            this.commentsPanel.classList.remove("is-dimmed");
            return;
          }
          if (this.uiManager.controlsVisible) {
            this.uiManager.hideControls(true);
          }
        }
      }));
      const handleCommentTouchStart = e => {
        if (!this.uiManager) {
          return;
        }
        let isShowControlsBtn = e.target.closest(".tm-show-controls-float-btn");
        if (!isShowControlsBtn) {
          const floatBtn = this.commentsPanel.querySelector(".tm-show-controls-float-btn");
          if (floatBtn && window.getComputedStyle(floatBtn).display !== "none") {
            const rect = floatBtn.getBoundingClientRect();
            const touch = e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0];
            const clientX = touch ? touch.clientX : e.clientX;
            const clientY = touch ? touch.clientY : e.clientY;
            if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
              isShowControlsBtn = floatBtn;
            }
          }
        }
        if (isShowControlsBtn) {
          this.commentsPanel.classList.remove("is-dimmed");
          this.uiManager.showControls();
          this.uiManager.autoHideControls();
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();
          return;
        }
        const isSubmitBar = !!e.target.closest(".tm-comment-submit-bar-wrapper, .tm-comment-tag-select-modal, .tm-floating-comment-panel, .tm-comment-text-input, .tm-comment-add-tag-btn, .tm-comment-send-btn");
        if (this.commentsPanel.classList.contains("is-dimmed")) {
          this.setDimmed(false);
          if (!this.uiManager.isLandscape) {
            this.uiManager.hideControls(true);
          }
          if (!isSubmitBar) {
            if (e.cancelable) {
              e.preventDefault();
            }
            e.stopPropagation();
            return;
          }
        }
        const isFloating = this.uiManager.isFloatingControlPanel;
        const controlsVisible = this.uiManager.controlsVisible;
        if (isFloating) {
          this.setDimmed(false);
        } else if (controlsVisible) {
          if (!e.target.closest(".jc-time-link, .tm-comment-submit-bar-wrapper, .tm-comment-tag-select-modal, .tm-floating-comment-panel")) {
            this.uiManager.hideControls(true);
          }
        }
      };
      this.commentsPanel.addEventListener("touchstart", handleCommentTouchStart, {
        "passive": false
      });
      this.commentsPanel.addEventListener("mousedown", handleCommentTouchStart, {
        "passive": false
      });
      this.commentsPanel.addEventListener("mouseenter", (() => {
        if (this.uiManager && this.uiManager.isFloatingControlPanel) {
          this.setDimmed(false);
        }
      }));
      this.commentsPanel.addEventListener("mouseleave", (() => {
        if (this.uiManager && this.uiManager.isFloatingControlPanel && this.uiManager.controlsVisible) {
          this.setDimmed(true);
        }
      }));
      [ "touchstart", "touchend" ].forEach((evt => {
        this.commentsPanel.addEventListener(evt, (e => {
          e.stopPropagation();
        }), {
          "passive": true
        });
      }));
      this.updatePosition();
      setTimeout((() => this.updatePosition()), 300);
      this.videoCode = getVideoCodeFromUrl();
      if (this.videoCode) {
        logger.log(`[CommentPanel] 提取到当前视频番号: ${this.videoCode}，开始采集...`);
        this.loadComments(1);
      } else {
        logger.warn("[CommentPanel] 无法从当前URL解析到视频番号。");
        if (this.commentsList) {
          this.commentsList.innerHTML = `<div class="tm-comment-error">无法解析视频番号，暂不支持展示评论。</div>`;
        }
      }
      if (typeof ResizeObserver !== "undefined" && this.commentsPanel) {
        const resizeObserver = new ResizeObserver((entries => {
          for (const entry of entries) {
            if (entry.contentRect.height > 0) {
              this.checkViewportFill();
            }
          }
        }));
        resizeObserver.observe(this.commentsPanel);
        this.commentsPanelResizeObserver = resizeObserver;
      }
      const dummyRow = document.createElement("div");
      dummyRow.className = "tm-comment-row-placeholder";
      dummyRow.style.display = "none";
      return dummyRow;
    }
    "showDevelopmentModal"() {
      this.showTipModal("提示", "评论功能开发中");
    }
    "setLoopManager"(loopManager) {
      this.loopManager = loopManager;
    }
    "getLoopManager"() {
      var _this$controlManager, _this$playerCore8, _this$playerCore9, _this$playerCore0;
      return this.loopManager || ((_this$controlManager = this.controlManager) === null || _this$controlManager === void 0 ? void 0 : _this$controlManager.loopManager) || ((_this$playerCore8 = this.playerCore) === null || _this$playerCore8 === void 0 || (_this$playerCore8 = _this$playerCore8.controlManager) === null || _this$playerCore8 === void 0 ? void 0 : _this$playerCore8.loopManager) || ((_this$playerCore9 = this.playerCore) === null || _this$playerCore9 === void 0 ? void 0 : _this$playerCore9.loopManager) || ((_this$playerCore0 = this.playerCore) === null || _this$playerCore0 === void 0 || (_this$playerCore0 = _this$playerCore0.customVideoPlayer) === null || _this$playerCore0 === void 0 || (_this$playerCore0 = _this$playerCore0.managers) === null || _this$playerCore0 === void 0 ? void 0 : _this$playerCore0.loopManager) || null;
    }
    "getTabs"() {
      const lm = this.getLoopManager();
      if (lm && Array.isArray(lm.tabs) && lm.tabs.length > 0) {
        return lm.tabs;
      }
      if (this.videoCode) {
        const saved = getValue(`tabs_${this.videoCode}`, []);
        if (Array.isArray(saved) && saved.length > 0) {
          return saved.filter((t => t && typeof t === "object" && t.id));
        }
      }
      return lm && Array.isArray(lm.tabs) ? lm.tabs : [];
    }
    async "checkCanComment"() {
      return this.composer.checkCanComment();
    }
    "initCommentSubmitBar"(panelEl) {
      return this.composer.initCommentSubmitBar(panelEl || this.commentsPanel);
    }
    "toggleTagSelectModal"() {
      return this.composer.toggleTagSelectModal();
    }
    "openTagSelectModal"() {
      return this.composer.openTagSelectModal();
    }
    "closeTagSelectModal"() {
      return this.composer.closeTagSelectModal();
    }
    "renderTagSelectList"() {
      return this.composer.renderTagSelectList();
    }
    async "handleSendComment"() {
      return this.composer.handleSendComment();
    }
    async "submitComment"(commentText) {
      return this.composer.submitComment(commentText);
    }
    async "handlePublishComment"() {
      return this.composer.handlePublishComment();
    }
    "showTipModal"(title, message) {
      return this.composer.showTipModal(title, message);
    }
    "showLoginPromptModal"(domain) {
      return this.composer.showLoginPromptModal(domain);
    }
    "showLoginModal"(domain, onSuccess) {
      return this.composer.showLoginModal(domain, onSuccess);
    }
    "showCommentInputModal"(commentForm, targetUrl, domain) {
      return this.composer.showCommentInputModal(commentForm, targetUrl, domain);
    }
    "updatePosition"() {
      if (!this.commentsPanel) {
        return;
      }
      this.commentsPanel.style.display = "flex";
    }
    "showLoading"() {
      if (this.loadingElement) {
        this.loadingElement.style.display = "flex";
        this.loadingElement.style.flexDirection = "column";
        this.loadingElement.style.gap = "12px";
        this.loadingElement.style.padding = "16px";
        this.loadingElement.innerHTML = `\n                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">\n                    <div class="jc-bd">\n                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">\n                            <div class="skeleton-block" style="width: 80px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                            <div class="skeleton-block" style="width: 60px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                        <div class="jc-body-text">\n                            <div class="skeleton-block" style="width: 90%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>\n                            <div class="skeleton-block" style="width: 50%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                    </div>\n                </div>\n                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">\n                    <div class="jc-bd">\n                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">\n                            <div class="skeleton-block" style="width: 100px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                            <div class="skeleton-block" style="width: 45px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                        <div class="jc-body-text">\n                            <div class="skeleton-block" style="width: 80%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>\n                            <div class="skeleton-block" style="width: 40%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                    </div>\n                </div>\n                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">\n                    <div class="jc-bd">\n                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">\n                            <div class="skeleton-block" style="width: 70px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                            <div class="skeleton-block" style="width: 55px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                        <div class="jc-body-text">\n                            <div class="skeleton-block" style="width: 95%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>\n                            <div class="skeleton-block" style="width: 70%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                    </div>\n                </div>\n            `;
      }
      if (this.errorElement) {
        this.errorElement.style.display = "none";
      }
      if (this.commentsList) {
        this.commentsList.style.display = "none";
      }
    }
    "showError"(msg) {
      if (this.loadingElement) {
        this.loadingElement.style.display = "none";
      }
      if (this.commentsList) {
        this.commentsList.style.display = "none";
      }
      if (this.errorElement) {
        this.errorElement.style.display = "flex";
        this.errorElement.style.flexDirection = "column";
        this.errorElement.style.alignItems = "center";
        this.errorElement.style.justifyContent = "center";
        this.errorElement.style.gap = "10px";
        this.errorElement.style.padding = "20px";
        this.errorElement.style.boxSizing = "border-box";
        this.errorElement.innerHTML = `\n                <div style="text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; max-width: 280px; line-height: 1.5;">\n                    <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 13px;">${msg}</p>\n                    <div style="text-align: left; background: hsla(var(--shadcn-destructive)/0.05); border: 1px solid hsla(var(--shadcn-destructive)/0.15); border-radius: 8px; padding: 10px; font-size: 11px; color: hsl(var(--shadcn-muted-foreground)); margin-bottom: 12px; box-sizing: border-box; line-height: 1.6;">\n                        <span style="font-weight: 600; color: hsl(var(--shadcn-destructive)); display: block; margin-bottom: 4px;">可能的原因：</span>\n                        1. 目标网站（Jable/JAVLibrary）当前不可达或网络受限。<br>\n                        2. 跨域网络请求未获得脚本管理器授权（请在 Tampermonkey 弹窗中选择“总是允许”）。<br>\n                        3. 被 Cloudflare 防火墙人机挑战拦截。\n                    </div>\n                    <button class="tm-comment-retry-btn" style="padding: 6px 16px; font-size: 11px; background-color: hsla(var(--shadcn-destructive) / 0.1); border: 1px solid hsla(var(--shadcn-destructive) / 0.3); color: hsl(var(--shadcn-destructive)); border-radius: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600; outline: none;">重新采集</button>\n                </div>\n            `;
      }
    }
    "handleRetry"(site) {
      const reloadJable = !site || site === "jable";
      const reloadJavlib = !site || site === "javlib";
      if (reloadJable) {
        CommentPanel.preloadCache.jableCommentsPromise = null;
        this.jableComments = [];
        this.filteredJableComments = [];
        this.jableCurrentPage = 1;
        this.jableHasMore = false;
        this.jableStatus = "loading";
        this.loadJableComments(1);
      }
      if (reloadJavlib) {
        CommentPanel.preloadCache.javlibVideoIdPromise = null;
        CommentPanel.preloadCache.javlibCommentsPromise = null;
        CommentPanel.preloadCache.javlibReviewsPromise = null;
        this.javlibComments = [];
        this.filteredJavlibComments = [];
        this.javlibCurrentPage = 1;
        this.javlibHasMore = false;
        this.javlibVideoId = "";
        this.javlibWorkingDomain = "";
        this.javlibVideoExists = false;
        this.javlibStatus = "loading";
        this.loadJavlibComments(1);
      }
    }
    "triggerLoadMore"(siteKey) {
      const site = this.sites[siteKey];
      if (!site || site.loading || !site.hasMore || site.collapsed) {
        return;
      }
      logger.log(`[CommentPanel] 触发加载更多 ${site.name} 评论...`);
      this.loadSiteComments(siteKey, site.currentPage + 1);
    }
    "triggerLoadMoreJable"() {
      return this.triggerLoadMore("jable");
    }
    "triggerLoadMoreJavlib"() {
      return this.triggerLoadMore("javlib");
    }
    "triggerLoadMoreJavdb"() {
      return this.triggerLoadMore("javdb");
    }
    "renderSectionHtml"(siteKey) {
      var _this$playerCore1, _state$settings5;
      const site = this.sites[siteKey];
      if (!site) {
        return "";
      }
      const state = (_this$playerCore1 = this.playerCore) === null || _this$playerCore1 === void 0 || (_this$playerCore1 = _this$playerCore1.options) === null || _this$playerCore1 === void 0 ? void 0 : _this$playerCore1.playerState;
      const enabledSources = (state === null || state === void 0 || (_state$settings5 = state.settings) === null || _state$settings5 === void 0 ? void 0 : _state$settings5.enabledCommentSources) || {
        "jable": true,
        "javdb": true,
        "javlibrary": false
      };
      const isSiteEnabled = siteKey === "javlib" ? enabledSources.javlib !== false && enabledSources.javlibrary !== false : enabledSources[siteKey] !== false;
      if (!isSiteEnabled) {
        return "";
      }
      let contentHtml = "";
      if (site.status === "loading") {
        contentHtml = `\n                <div class="tm-comment-loader-graphic" style="display: flex; gap: 5px; padding: 16px; justify-content: center;">\n                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>\n                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>\n                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>\n                </div>\n            `;
      } else if (site.status === "unreachable") {
        contentHtml = `\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; pointer-events: auto;">\n                    <p style="margin: 0; font-weight: 500;">⚠️ 无法连接到 ${site.name}</p>\n                    <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">请检查网络代理，或该站点在当前环境不可达。</p>\n                </div>\n            `;
      } else if (site.status === "mobile_unsupported") {
        contentHtml = `\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px; pointer-events: auto;">\n                    <p style="margin: 0; font-weight: 500;">📱 该站点评论采集在移动端不可用</p>\n                    <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.8; line-height: 1.5;">JAVLibrary 采集需使用后台独立标签页（影子通道），移动端浏览器不支持后台静默多标签页协同。请在 PC 端浏览器查看该站点评论。</p>\n                </div>\n            `;
      } else if (site.status === "not_found") {
        contentHtml = `\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">\n                    <p style="margin: 0;">此影片在 ${site.name} 上未找到评论。</p>\n                </div>\n            `;
      } else if (site.status === "empty") {
        contentHtml = `\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">\n                    <p style="margin: 0;">暂无评论</p>\n                </div>\n            `;
      } else if (site.status === "cf_shield") {
        if (siteKey === "javlib" && this.javlibVerifyingStatus === "verifying") {
          contentHtml = `\n                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-blue)/0.08); border: 1px solid hsla(var(--shadcn-blue)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-blue)); box-sizing: border-box; width: 100%; pointer-events: auto;">\n                        <div style="display: flex; align-items: center; gap: 8px;">\n                            <div class="tm-comment-loader-graphic" style="display: flex; gap: 3px; padding: 0; width: auto; min-height: 0;">\n                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>\n                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>\n                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>\n                            </div>\n                            <span style="font-weight: 500;">正在后台尝试自动通过 JAVLibrary 验证，请稍候...</span>\n                        </div>\n                    </div>\n                `;
        } else {
          const targetDomain = siteKey === "jable" ? this.jableFailedDomain || `https://${domains.SITE_DOMAINS.JABLE.primary}` : siteKey === "javlib" ? this.javlibFailedDomain || `https://${domains.SITE_DOMAINS.JAVLIBRARY.primary}` : `https://${domains.SITE_DOMAINS.JAVDB.primary}`;
          const retryBtnClass = siteKey === "jable" ? "tm-jable-verify-retry-btn" : siteKey === "javlib" ? "tm-comments-verify-retry-btn" : "tm-javdb-verify-retry-btn";
          contentHtml = `\n                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-destructive)/0.08); border: 1px solid hsla(var(--shadcn-destructive)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-destructive)); box-sizing: border-box; width: 100%; pointer-events: auto;">\n                        <span>${site.name} 评论抓取受阻 (Cloudflare 拦截)</span>\n                        <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">\n                            <a href="${targetDomain}/" target="_blank" class="tm-comments-verify-link" style="padding: 4px 10px; background-color: hsl(var(--shadcn-destructive)); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 10px; white-space: nowrap;">去验证</a>\n                            <button class="${retryBtnClass}" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">重新加载</button>\n                            ${siteKey === "javlib" ? '<button class="tm-comments-verify-copy-logs-btn" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">复制日志</button>' : ""}\n                        </div>\n                    </div>\n                `;
        }
      } else if (site.status === "loaded") {
        contentHtml = site.filteredComments.map((c => {
          const isNew = this.renderedCommentIds.size > 0 && !this.renderedCommentIds.has(c.id);
          return this.renderCommentCard(c, isNew);
        })).join("");
        if (site.loading) {
          contentHtml += `\n                    <div class="tm-comment-bottom-loader tm-comment-loader-graphic">\n                        <div class="dot"></div>\n                        <div class="dot"></div>\n                        <div class="dot"></div>\n                    </div>\n                `;
        } else if (!site.hasMore) {
          contentHtml += `\n                    <div class="tm-comment-end-marker" style="text-align: center; padding: 4px; font-size: 10px; color: hsl(var(--shadcn-muted-foreground)); opacity: 0.6;">-end-</div>\n                `;
        }
      }
      const badgeTextMap = {
        "loading": "采集中...",
        "unreachable": "不可达",
        "not_found": "未收录",
        "empty": "暂无评论",
        "cf_shield": "需验证",
        "mobile_unsupported": "移动端浏览器不支持",
        "loaded": `共 ${site.filteredComments.length}${site.hasMore ? "+" : ""} 条`
      };
      const badgeText = badgeTextMap[site.status] || "";
      const isCollapsed = site.status === "unreachable" || site.status === "not_found" || site.status === "mobile_unsupported" || site.collapsed;
      const bodyDisplay = isCollapsed ? "none" : "block";
      const loginSiteKey = siteKey === "jable" ? "JABLE" : siteKey === "javlib" ? "JAVLIBRARY" : "";
      const loginBadgeHtml = loginSiteKey ? this.renderLoginBadgeHtml(loginSiteKey) : "";
      const titleMap = {
        "jable": "■ Jable.tv",
        "javlib": "■ JAVLibrary",
        "javdb": "■ JavDB"
      };
      return `\n            <div class="tm-comment-section${isCollapsed ? " is-collapsed" : ""}" id="tm-comment-section-${siteKey}">\n                <div class="tm-comment-section-hdr" title="点击展开/折叠">\n                    <span class="tm-comment-section-title">${titleMap[siteKey]}</span>\n                    <div class="tm-comment-hdr-right" style="display: inline-flex; align-items: center; gap: 6px;">\n                        ${loginBadgeHtml}\n                        <span class="tm-comment-status-badge tm-status-badge-${site.status}">${badgeText}</span>\n                    </div>\n                </div>\n                <div class="tm-comment-section-body" style="display: ${bodyDisplay}; pointer-events: auto;">\n                    ${contentHtml}\n                </div>\n            </div>\n        `;
    }
    "showBottomLoader"(site) {
      if (!this.commentsList) {
        return;
      }
      const body = this.commentsList.querySelector(`#tm-comment-section-${site} .tm-comment-section-body`);
      if (!body) {
        return;
      }
      if (body.querySelector(".tm-comment-bottom-loader")) {
        return;
      }
      const loader = document.createElement("div");
      loader.className = "tm-comment-bottom-loader tm-comment-loader-graphic";
      loader.innerHTML = `\n            <div class="dot"></div>\n            <div class="dot"></div>\n            <div class="dot"></div>\n        `;
      body.appendChild(loader);
      setTimeout((() => {
        if (body.scrollTop + body.clientHeight >= body.scrollHeight - 50) {
          body.scrollTop = body.scrollHeight - body.clientHeight;
        }
      }), 30);
    }
    "hideBottomLoader"(site) {
      if (!this.commentsList) {
        return;
      }
      const body = this.commentsList.querySelector(`#tm-comment-section-${site} .tm-comment-section-body`);
      const loader = body === null || body === void 0 ? void 0 : body.querySelector(".tm-comment-bottom-loader");
      if (loader) {
        loader.remove();
      }
    }
    "updateCommentsCount"() {
      this.totalCount = (this.jableTotalCount || 0) + (this.javlibTotalCount || 0) + (this.javdbTotalCount || 0);
      this.hasMore = this.jableHasMore || false || this.javlibHasMore || false || this.javdbHasMore || false;
      if (this.countSpan) {
        let text = (__("commentsCount") || "共 {n} 条评论").replace("{n}", this.totalCount);
        const loadings = [];
        if (this.jableLoading) {
          loadings.push("Jable");
        }
        if (this.javlibLoading) {
          loadings.push("JAVLibrary");
        }
        if (this.javdbLoading) {
          loadings.push("JavDB");
        }
        if (loadings.length > 0) {
          text += ` (正在采集 ${loadings.join("/")}...)`;
        }
        this.countSpan.textContent = text;
      }
    }
    "renderCommentCard"(c) {
      let isNew = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      const textClass = c.text && c.text.length > 200 ? "jc-body-text jc-body-text--collapsible" : "jc-body-text";
      const expandBtn = c.text && c.text.length > 200 ? `<div class="jc-body-text-content">${c.textHtml}</div><button class="jc-toggle-expand-btn">${__("commentsExpand") || "展开"}</button>` : c.textHtml;
      const userHtml = c.userUrl ? `<a href="${c.userUrl}" target="_blank" class="jc-u">${c.user}</a>` : `<span class="jc-u">${c.user}</span>`;
      const scoreHtml = c.score ? `<span class="jc-score-badge" title="评分">${c.score}</span>` : "";
      const spamHtml = c.spam && c.spam.label === "SPAM" ? `<span class="jc-spam-badge" title="${c.spam.reason}">灌水: ${c.spam.category}</span>` : "";
      return `\n            <div class="jc-card ${isNew ? "jc-card--new" : ""}" data-id="${c.id}">\n                <div class="jc-bd">\n                    <div class="jc-hdr">\n                        <div class="jc-hdr-left">\n                            <span class="jc-t">${c.time && !c.time.includes("Invalid") ? c.time : ""}</span>\n                        </div>\n                        <div class="jc-hdr-right">\n                            ${userHtml}\n                            ${scoreHtml}\n                            ${spamHtml}\n                        </div>\n                    </div>\n                    <div class="${textClass}" ${c.text && c.text.length > 200 ? 'data-collapsed="true"' : ""}>\n                        ${expandBtn}\n                    </div>\n                </div>\n            </div>\n        `;
    }
    "renderCommentsList"() {
      if (this.loadingElement) {
        this.loadingElement.style.display = "none";
      }
      if (this.errorElement) {
        this.errorElement.style.display = "none";
      }
      if (this.commentsList) {
        this.commentsList.style.display = "flex";
      }
      if (this.javlibStatus === "cf_shield" && !this.javlibAutoVerifyAttempted) {
        setTimeout((() => this.startJavlibBackgroundVerification(this.javlibFailedDomain)), 50);
      }
      const sectionHtmlMap = {
        "jable": this.renderSectionHtml("jable"),
        "javdb": this.renderSectionHtml("javdb"),
        "javlib": this.renderSectionHtml("javlib")
      };
      if (this.commentsList) {
        const scrollPositions = {};
        const sectionBodies = this.commentsList.querySelectorAll(".tm-comment-section-body");
        sectionBodies.forEach((body => {
          const section = body.closest(".tm-comment-section");
          if (section && section.id) {
            scrollPositions[section.id] = body.scrollTop;
          }
        }));
        const sections = [ {
          "key": "jable",
          "html": sectionHtmlMap.jable,
          "hasContent": this.filteredJableComments && this.filteredJableComments.length > 0 || this.jableStatus === "loading"
        }, {
          "key": "javdb",
          "html": sectionHtmlMap.javdb,
          "hasContent": this.filteredJavdbComments && this.filteredJavdbComments.length > 0 || this.javdbStatus === "loading"
        }, {
          "key": "javlib",
          "html": sectionHtmlMap.javlib,
          "hasContent": this.filteredJavlibComments && this.filteredJavlibComments.length > 0 || this.javlibStatus === "loading"
        } ];
        sections.sort(((a, b) => {
          if (a.hasContent && !b.hasContent) {
            return -1;
          }
          if (!a.hasContent && b.hasContent) {
            return 1;
          }
          return 0;
        }));
        this.commentsList.innerHTML = sections.map((s => s.html)).join("");
        this.bindAllLoginBadgeEvents();
        const newSectionBodies = this.commentsList.querySelectorAll(".tm-comment-section-body");
        newSectionBodies.forEach((body => {
          const section = body.closest(".tm-comment-section");
          if (section && section.id && scrollPositions[section.id] !== void 0) {
            body.scrollTop = scrollPositions[section.id];
          }
        }));
        const verifyLinks = this.commentsList.querySelectorAll(".tm-comments-verify-link");
        verifyLinks.forEach((link => {
          link.addEventListener("click", (() => {
            if (typeof GM_setValue === "function") {
              GM_setValue("javlib_verifying", true);
              GM_setValue("javlib_verifying_start_time", Date.now());
            }
            this.startSignalListener();
          }));
        }));
        const verifyRetryBtn = this.commentsList.querySelector(".tm-comments-verify-retry-btn, .tm-comment-retry-btn");
        if (verifyRetryBtn) {
          verifyRetryBtn.addEventListener("click", (e => {
            e.stopPropagation();
            logger.log("用户手动点击 JAVLibrary 重试，清除历史验证状态并重载...");
            this.javlibAutoVerifyAttempted = false;
            this.javlibCfShield = false;
            this.javlibVerifyingStatus = "";
            this.handleRetry("javlib");
          }));
        }
        const jableVerifyRetryBtn = this.commentsList.querySelector(".tm-jable-verify-retry-btn");
        if (jableVerifyRetryBtn) {
          jableVerifyRetryBtn.addEventListener("click", (e => {
            e.stopPropagation();
            logger.log("用户手动点击 Jable.tv 重试，清除历史验证状态并重载...");
            this.jableStatus = "loading";
            this.handleRetry("jable");
          }));
        }
        const javdbVerifyRetryBtn = this.commentsList.querySelector(".tm-javdb-verify-retry-btn");
        if (javdbVerifyRetryBtn) {
          javdbVerifyRetryBtn.addEventListener("click", (e => {
            e.stopPropagation();
            logger.log("用户手动点击 JavDB 重试...");
            this.javdbStatus = "loading";
            this.loadJavdbComments(1);
          }));
        }
        const copyLogsBtns = this.commentsList.querySelectorAll(".tm-comments-verify-copy-logs-btn");
        copyLogsBtns.forEach((btn => {
          btn.addEventListener("click", (e => {
            e.stopPropagation();
            const isJavlibSection = btn.closest("#tm-comment-section-javlib") !== null;
            const filterKeywords = isJavlibSection ? [ "javlib", "c97k.com", "CrossDomainBridge", "iframe", "shadow" ] : [ "jable", "fs1.app" ];
            const siteName = isJavlibSection ? "JAVLibrary" : "Jable.tv";
            if (logger.copyLogs(filterKeywords)) {
              Toast(`${siteName} 调试日志已复制到剪贴板，请发送给开发者分析！`, 3e3, "success");
            } else {
              Toast("复制日志失败，请手动打开控制台查看。", 3e3, "error");
            }
          }));
        }));
        const jableHdr = this.commentsList.querySelector("#tm-comment-section-jable .tm-comment-section-hdr");
        if (jableHdr) {
          jableHdr.addEventListener("click", (() => {
            const body = this.commentsList.querySelector("#tm-comment-section-jable .tm-comment-section-body");
            const section = this.commentsList.querySelector("#tm-comment-section-jable");
            if (body && section) {
              this.jableCollapsed = !this.jableCollapsed;
              body.style.display = this.jableCollapsed ? "none" : "block";
              section.classList.toggle("is-collapsed", this.jableCollapsed);
              localStorage.setItem("tm-comment-jable-collapsed", this.jableCollapsed);
              if (!this.jableCollapsed) {
                this.javlibCollapsed = true;
                this.javdbCollapsed = true;
                localStorage.setItem("tm-comment-javlib-collapsed", "true");
                localStorage.setItem("tm-comment-javdb-collapsed", "true");
                this.renderCommentsList();
                if (this.jableComments.length === 0 && this.jableStatus === "loading" && !this.jableLoading) {
                  this.loadJableComments(1);
                } else {
                  this.triggerLoadMoreJable();
                }
              }
            }
          }));
        }
        const javlibHdr = this.commentsList.querySelector("#tm-comment-section-javlib .tm-comment-section-hdr");
        if (javlibHdr) {
          javlibHdr.addEventListener("click", (() => {
            const body = this.commentsList.querySelector("#tm-comment-section-javlib .tm-comment-section-body");
            const section = this.commentsList.querySelector("#tm-comment-section-javlib");
            if (body && section) {
              this.javlibCollapsed = !this.javlibCollapsed;
              body.style.display = this.javlibCollapsed ? "none" : "block";
              section.classList.toggle("is-collapsed", this.javlibCollapsed);
              localStorage.setItem("tm-comment-javlib-collapsed", this.javlibCollapsed);
              if (!this.javlibCollapsed) {
                this.jableCollapsed = true;
                this.javdbCollapsed = true;
                localStorage.setItem("tm-comment-jable-collapsed", "true");
                localStorage.setItem("tm-comment-javdb-collapsed", "true");
                this.renderCommentsList();
                if (this.javlibComments.length === 0 && this.javlibStatus === "loading" && !this.javlibLoading) {
                  this.loadJavlibComments(1);
                } else {
                  this.triggerLoadMoreJavlib();
                }
              }
            }
          }));
        }
        const javdbHdr = this.commentsList.querySelector("#tm-comment-section-javdb .tm-comment-section-hdr");
        if (javdbHdr) {
          javdbHdr.addEventListener("click", (() => {
            const body = this.commentsList.querySelector("#tm-comment-section-javdb .tm-comment-section-body");
            const section = this.commentsList.querySelector("#tm-comment-section-javdb");
            if (body && section) {
              this.javdbCollapsed = !this.javdbCollapsed;
              body.style.display = this.javdbCollapsed ? "none" : "block";
              section.classList.toggle("is-collapsed", this.javdbCollapsed);
              localStorage.setItem("tm-comment-javdb-collapsed", this.javdbCollapsed);
              if (!this.javdbCollapsed) {
                this.jableCollapsed = true;
                this.javlibCollapsed = true;
                localStorage.setItem("tm-comment-jable-collapsed", "true");
                localStorage.setItem("tm-comment-javlib-collapsed", "true");
                this.renderCommentsList();
                if (this.javdbComments.length === 0 && this.javdbStatus === "loading" && !this.javdbLoading) {
                  this.loadJavdbComments(1);
                } else {
                  this.triggerLoadMoreJavdb();
                }
              }
            }
          }));
        }
        (this.filteredJableComments || []).forEach((c => this.renderedCommentIds.add(c.id)));
        (this.filteredJavlibComments || []).forEach((c => this.renderedCommentIds.add(c.id)));
        (this.filteredJavdbComments || []).forEach((c => this.renderedCommentIds.add(c.id)));
        setTimeout((() => this.checkViewportFill()), 150);
      }
    }
    "checkViewportFill"() {
      if (!this.commentsList) {
        return;
      }
      requestAnimationFrame((() => {
        if (!this.commentsList) {
          return;
        }
        const activeBodies = Array.from(this.commentsList.querySelectorAll(".tm-comment-section:not(.is-collapsed) .tm-comment-section-body"));
        for (const body of activeBodies) {
          if (body.clientHeight > 0 && body.scrollHeight > 0 && body.scrollHeight <= body.clientHeight + 10) {
            const section = body.closest(".tm-comment-section");
            const sectionId = section ? section.id : "";
            if (sectionId === "tm-comment-section-jable" && this.jableHasMore && !this.jableLoading) {
              logger.log("[CommentPanel] Jable section viewport not filled. Auto-loading next page...");
              this.triggerLoadMoreJable();
            } else if (sectionId === "tm-comment-section-javlib" && this.javlibHasMore && !this.javlibLoading) {
              logger.log("[CommentPanel] JAVLibrary section viewport not filled. Auto-loading next page...");
              this.triggerLoadMoreJavlib();
            } else if (sectionId === "tm-comment-section-javdb" && this.javdbHasMore && !this.javdbLoading) {
              logger.log("[CommentPanel] JavDB section viewport not filled. Auto-loading next page...");
              this.triggerLoadMoreJavdb();
            }
          }
        }
      }));
    }
    "getLoginProviderForSite"(siteKey) {
      const keyUpper = String(siteKey || "").toUpperCase();
      if (window.loginManager && window.loginManager.providers) {
        const p = window.loginManager.providers.find((p => p.siteKey && p.siteKey.toUpperCase() === keyUpper));
        if (p) {
          return p;
        }
      }
      if (!this._staticProviders) {
        this._staticProviders = {
          "JABLE": new JableLoginProvider,
          "MISSAV": new MissavLoginProvider
        };
      }
      return this._staticProviders[keyUpper] || null;
    }
    "renderLoginBadgeHtml"(siteKey) {
      const provider = this.getLoginProviderForSite(siteKey);
      if (!provider) {
        return "";
      }
      if (this.siteLoginStates[siteKey] === void 0 || this.siteLoginStates[siteKey] === null) {
        if (typeof provider.getCachedLoginStatus === "function") {
          this.siteLoginStates[siteKey] = provider.getCachedLoginStatus();
        }
      }
      const isLoggedIn = this.siteLoginStates[siteKey];
      if (isLoggedIn === true) {
        return `<span class="tm-comment-login-badge is-logged-in">已登录</span>`;
      } else if (isLoggedIn === false) {
        return `<span class="tm-comment-login-badge is-not-logged-in" title="点击登录" data-site="${siteKey}">未登录</span>`;
      } else {
        return `<span class="tm-comment-login-badge is-checking" style="opacity: 0.6; cursor: default;">检测中...</span>`;
      }
    }
    async "updateSiteLoginStatus"(siteKey) {
      return this.composer.updateSiteLoginStatus(siteKey);
    }
    "updateAllSiteLoginStatuses"() {
      let force = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
      return this.composer.updateAllSiteLoginStatuses(force);
    }
    "updateLoginBadgeDOM"(siteKey) {
      if (!this.commentsList) {
        return;
      }
      const section = this.commentsList.querySelector(`#tm-comment-section-${siteKey.toLowerCase()}`);
      if (!section) {
        return;
      }
      const badgeContainer = section.querySelector(".tm-comment-hdr-right");
      if (!badgeContainer) {
        return;
      }
      const loginBadge = badgeContainer.querySelector(".tm-comment-login-badge");
      const newBadgeHtml = this.renderLoginBadgeHtml(siteKey);
      if (!newBadgeHtml) {
        return;
      }
      if (loginBadge) {
        const temp = document.createElement("div");
        temp.innerHTML = newBadgeHtml;
        const newBadgeEl = temp.firstElementChild;
        loginBadge.replaceWith(newBadgeEl);
        this.bindLoginBadgeEvents(newBadgeEl);
      } else {
        const temp = document.createElement("div");
        temp.innerHTML = newBadgeHtml;
        const newBadgeEl = temp.firstElementChild;
        badgeContainer.insertBefore(newBadgeEl, badgeContainer.firstChild);
        this.bindLoginBadgeEvents(newBadgeEl);
      }
    }
    "bindLoginBadgeEvents"(badgeEl) {
      if (!badgeEl || !badgeEl.classList.contains("is-not-logged-in")) {
        return;
      }
      badgeEl.addEventListener("click", (e => {
        e.stopPropagation();
        const siteKey = badgeEl.getAttribute("data-site") || "JABLE";
        const provider = this.getLoginProviderForSite(siteKey);
        const domain = provider ? provider.domains && provider.domains[0] ? `https://${provider.domains[0]}` : "" : "";
        this.showLoginModal(domain, (() => {
          this.updateSiteLoginStatus(siteKey);
        }));
      }));
    }
    "bindAllLoginBadgeEvents"() {
      if (!this.commentsList) {
        return;
      }
      const loginBadges = this.commentsList.querySelectorAll(".tm-comment-login-badge.is-not-logged-in");
      loginBadges.forEach((badgeEl => {
        this.bindLoginBadgeEvents(badgeEl);
      }));
    }
    async "checkLoginStatus"() {
      return this.composer.checkLoginStatus();
    }
    "handleLoginRedirect"() {
      try {
        if (window.loginManager) {
          const provider = window.loginManager.getMatchingProvider();
          if (provider && typeof provider.redirectLogin === "function") {
            provider.redirectLogin();
            return;
          }
        }
        if ((0, domains.isSiteDomain)("MISSAV")) {
          const loginButton = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
          if (loginButton) {
            loginButton.click();
            Toast("请在页面登录窗口中完成登录", 3e3, "info");
          } else if (typeof GM_openInTab === "function") {
            GM_openInTab(`https://${domains.SITE_DOMAINS.MISSAV.primary}/cn/login`, {
              "active": true,
              "insert": true,
              "setParent": true
            });
          } else {
            window.open(`https://${domains.SITE_DOMAINS.MISSAV.primary}/cn/login`, "_blank");
          }
        } else if ((0, domains.isSiteDomain)("JABLE")) {
          window.location.href = "/login/";
        } else {
          Toast("未检测到当前站点的登录入口", 2e3, "error");
        }
      } catch (e) {}
    }
    "reprocessComments"() {
      if (!this.targetVideo) {
        return;
      }
      const duration = this.targetVideo.duration;
      if (!duration || isNaN(duration)) {
        return;
      }
      logger.log(`[CommentPanel] 视频元数据已加载，时长: ${duration}s。重新解析所有评论...`);
      const reprocess = comments => comments.map((c => {
        const proc = processComment(c.text, this.videoCode, duration);
        return {
          ...c,
          ...proc
        };
      }));
      if (this.jableComments && this.jableComments.length > 0) {
        this.jableComments = reprocess(this.jableComments);
      }
      if (this.javlibComments && this.javlibComments.length > 0) {
        this.javlibComments = reprocess(this.javlibComments);
      }
      if (this.javdbComments && this.javdbComments.length > 0) {
        this.javdbComments = reprocess(this.javdbComments);
      }
      this.applyFilter();
      this.renderCommentsList();
    }
    "cleanup"() {
      if (this.commentsPanelResizeObserver && this.commentsPanel) {
        this.commentsPanelResizeObserver.unobserve(this.commentsPanel);
        this.commentsPanelResizeObserver = null;
      }
      if (this.targetVideo && this.handleMetadataLoadedBound) {
        this.targetVideo.removeEventListener("loadedmetadata", this.handleMetadataLoadedBound);
      }
      this.cleanupJavlibVerification();
    }
  }
  CommentPanel_defineProperty(CommentPanel, "preloadCache", {
    "videoCode": "",
    "jableCommentsPromise": null,
    "javlibVideoIdPromise": null,
    "javlibCommentsPromise": null,
    "javlibReviewsPromise": null,
    "javdbMovieIdPromise": null,
    "javdbCommentsPromise": null
  });
  class VolumeController {
    "constructor"(playerCore, controlManager) {
      this.playerCore = playerCore;
      this.controlManager = controlManager;
      this.targetVideo = playerCore.targetVideo;
      this.uiElements = playerCore.uiElements || controlManager.uiElements;
      this.volumeSlider = null;
      this.volumeLevel = null;
      this.volumeValue = null;
      this.lastVolume = 1;
      this.supportsVolumeControl = this.checkVolumeControlSupport();
      this.dragHandler = null;
      this.upHandler = null;
    }
    "checkVolumeControlSupport"() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      return !isIOS;
    }
    "createVolumeSlider"(container) {
      const volumeControl = document.createElement("div");
      volumeControl.className = "tm-volume-control";
      const volumeButton = document.createElement("button");
      volumeButton.className = "tm-volume-button";
      volumeButton.innerHTML = this.getVolumeIcon(this.targetVideo.volume);
      const sliderContainer = document.createElement("div");
      sliderContainer.className = "tm-volume-slider-container";
      const sliderTrack = document.createElement("div");
      sliderTrack.className = "tm-volume-slider-track";
      this.volumeLevel = document.createElement("div");
      this.volumeLevel.className = "tm-volume-slider-level";
      this.volumeLevel.style.width = `${this.targetVideo.volume * 100}%`;
      this.volumeValue = document.createElement("div");
      this.volumeValue.className = "tm-volume-value";
      this.volumeValue.textContent = `${Math.round(this.targetVideo.volume * 100)}%`;
      sliderTrack.appendChild(this.volumeLevel);
      sliderContainer.appendChild(sliderTrack);
      sliderContainer.appendChild(this.volumeValue);
      volumeControl.appendChild(volumeButton);
      if (this.supportsVolumeControl) {
        volumeControl.appendChild(sliderContainer);
      } else {
        volumeControl.classList.add("tm-volume-control-no-slider");
      }
      this.volumeSlider = volumeControl;
      let isDragging = false;
      let isExpanded = false;
      let expandTimeout = null;
      const updateVolume = clientX => {
        if (!this.supportsVolumeControl) {
          return;
        }
        const rect = sliderTrack.getBoundingClientRect();
        const width = rect.width;
        let percentage = (clientX - rect.left) / width * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        this.targetVideo.volume = percentage / 100;
        this.targetVideo.muted = false;
        this.updateVolumeUI();
      };
      const expandSlider = () => {
        if (!this.supportsVolumeControl) {
          return;
        }
        if (expandTimeout) {
          clearTimeout(expandTimeout);
        }
        volumeControl.classList.add("expanded");
        isExpanded = true;
      };
      const collapseSlider = () => {
        if (!this.supportsVolumeControl) {
          return;
        }
        if (!isDragging) {
          volumeControl.classList.remove("expanded");
          isExpanded = false;
        }
      };
      volumeButton.addEventListener("click", (e => {
        e.stopPropagation();
        if (this.supportsVolumeControl && !isExpanded) {
          expandSlider();
          expandTimeout = setTimeout(collapseSlider, 3e3);
        } else {
          if (this.targetVideo.volume === 0 || this.targetVideo.muted) {
            this.targetVideo.muted = false;
            if (this.supportsVolumeControl) {
              this.targetVideo.volume = this.lastVolume;
            }
          } else if (this.supportsVolumeControl) {
            this.lastVolume = this.targetVideo.volume;
            this.targetVideo.volume = 0;
          } else {
            this.targetVideo.muted = true;
          }
          this.updateVolumeUI();
        }
      }));
      if (this.supportsVolumeControl) {
        sliderTrack.addEventListener("click", (e => {
          e.stopPropagation();
          updateVolume(e.clientX);
        }));
        this.dragHandler = e => {
          if (!isDragging) {
            return;
          }
          e.preventDefault();
          const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
          updateVolume(clientX);
        };
        this.upHandler = () => {
          if (isDragging) {
            isDragging = false;
            volumeControl.classList.remove("dragging");
            setTimeout(collapseSlider, 1500);
            document.removeEventListener("mousemove", this.dragHandler);
            document.removeEventListener("mouseup", this.upHandler);
            document.removeEventListener("touchmove", this.dragHandler);
            document.removeEventListener("touchend", this.upHandler);
            document.removeEventListener("touchcancel", this.upHandler);
          }
        };
        sliderTrack.addEventListener("mousedown", (e => {
          e.stopPropagation();
          isDragging = true;
          volumeControl.classList.add("dragging");
          expandSlider();
          updateVolume(e.clientX);
          document.addEventListener("mousemove", this.dragHandler);
          document.addEventListener("mouseup", this.upHandler);
        }));
        sliderTrack.addEventListener("touchstart", (e => {
          e.stopPropagation();
          isDragging = true;
          volumeControl.classList.add("dragging");
          expandSlider();
          updateVolume(e.touches[0].clientX);
          document.addEventListener("touchmove", this.dragHandler, {
            "passive": false
          });
          document.addEventListener("touchend", this.upHandler);
          document.addEventListener("touchcancel", this.upHandler);
        }), {
          "passive": false
        });
      }
      container.appendChild(volumeControl);
    }
    "getVolumeIcon"(volume) {
      if (this.targetVideo.muted || volume === 0) {
        return MUTE;
      } else if (this.supportsVolumeControl && volume < .5) {
        return VOLUME_LOW;
      } else {
        return VOLUME_HIGH;
      }
    }
    "updateVolumeUI"() {
      if (!this.volumeSlider) {
        return;
      }
      let volume;
      if (this.supportsVolumeControl) {
        volume = this.targetVideo.muted ? 0 : this.targetVideo.volume;
      } else {
        volume = this.targetVideo.muted ? 0 : 1;
      }
      const volumeButton = this.volumeSlider.querySelector(".tm-volume-button");
      if (volumeButton) {
        const newIconHtml = this.getVolumeIcon(volume);
        const currentSvg = volumeButton.querySelector("svg");
        if (currentSvg) {
          const temp = document.createElement("div");
          temp.innerHTML = newIconHtml.trim();
          const newSvg = temp.firstElementChild;
          if (newSvg) {
            volumeButton.replaceChild(newSvg, currentSvg);
          } else {
            const ripples = Array.from(volumeButton.querySelectorAll(".tm-ripple, .ripple"));
            volumeButton.innerHTML = newIconHtml;
            ripples.forEach((r => volumeButton.appendChild(r)));
          }
        } else {
          const ripples = Array.from(volumeButton.querySelectorAll(".tm-ripple, .ripple"));
          volumeButton.innerHTML = newIconHtml;
          ripples.forEach((r => volumeButton.appendChild(r)));
        }
      }
      if (!this.supportsVolumeControl) {
        return;
      }
      if (this.volumeLevel) {
        const levelWidth = Math.max(0, Math.min(100, volume * 100));
        this.volumeLevel.style.width = `calc(${levelWidth}% - 2px)`;
      }
      if (this.volumeValue) {
        const volumePercent = Math.round(volume * 100);
        this.volumeValue.textContent = `${volumePercent}%`;
        this.volumeValue.classList.remove("volume-high", "volume-medium", "volume-low", "volume-muted");
        if (volume === 0 || this.targetVideo.muted) {
          this.volumeValue.classList.add("volume-muted");
        } else if (volume < .3) {
          this.volumeValue.classList.add("volume-low");
        } else if (volume < .7) {
          this.volumeValue.classList.add("volume-medium");
        } else {
          this.volumeValue.classList.add("volume-high");
        }
      }
      telemetry.track("volume_change", {
        "volume": Math.round(volume * 100) / 100,
        "is_muted": !!this.targetVideo.muted
      });
    }
    "cleanup"() {
      if (this.dragHandler) {
        document.removeEventListener("mousemove", this.dragHandler);
        this.dragHandler = null;
      }
      if (this.upHandler) {
        document.removeEventListener("mouseup", this.upHandler);
        this.upHandler = null;
      }
    }
  }
  class SeekController {
    "constructor"(playerCore, controlManager) {
      this.playerCore = playerCore;
      this.controlManager = controlManager;
      this.targetVideo = playerCore.targetVideo;
      this.uiElements = playerCore.uiElements || controlManager.uiElements;
    }
    "seekRelative"(seconds) {
      var _this$controlManager, _this$playerCore;
      if (!this.targetVideo) {
        return;
      }
      const newTime = Math.max(0, Math.min(this.targetVideo.duration, this.targetVideo.currentTime + seconds));
      const loopManager = ((_this$controlManager = this.controlManager) === null || _this$controlManager === void 0 ? void 0 : _this$controlManager.loopManager) || ((_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.loopManager);
      if (loopManager && typeof loopManager.checkAndExitLoopIfOutside === "function") {
        loopManager.checkAndExitLoopIfOutside(newTime);
      }
      this.targetVideo.currentTime = newTime;
      telemetry.track("seek_click", {
        "seconds": seconds,
        "step": seconds > 0 ? `+${seconds}s` : `${seconds}s`
      });
    }
    "createSeekControlRow"() {
      const seekControlRow = document.createElement("div");
      seekControlRow.className = "tm-seek-control-row";
      const rewindGroup = document.createElement("div");
      rewindGroup.className = "tm-rewind-group";
      const forwardGroup = document.createElement("div");
      forwardGroup.className = "tm-forward-group";
      const rewindButtonsContainer = document.createElement("div");
      rewindButtonsContainer.className = "tm-rewind-buttons-container";
      const forwardButtonsContainer = document.createElement("div");
      forwardButtonsContainer.className = "tm-forward-buttons-container";
      rewindGroup.appendChild(rewindButtonsContainer);
      forwardGroup.appendChild(forwardButtonsContainer);
      seekControlRow.appendChild(rewindGroup);
      seekControlRow.appendChild(forwardGroup);
      const state = this.playerCore.options ? this.playerCore.options.playerState : null;
      const enabledSteps = state && state.settings && Array.isArray(state.settings.enabledSeekSteps) ? state.settings.enabledSeekSteps : [ "5s", "10s", "30s", "1m", "5m", "10m" ];
      const parseStepToSeconds = stepKey => {
        const num = parseInt(stepKey, 10) || 0;
        if (stepKey.toLowerCase().endsWith("m")) {
          return num * 60;
        }
        return num;
      };
      const sortedEnabledSteps = [ ...enabledSteps ].sort(((a, b) => parseStepToSeconds(a) - parseStepToSeconds(b)));
      sortedEnabledSteps.forEach((stepKey => {
        const sec = parseStepToSeconds(stepKey);
        if (sec > 0) {
          this.addTimeControlButton(rewindButtonsContainer, `-${stepKey}`, (() => this.seekRelative(-sec)));
        }
      }));
      sortedEnabledSteps.forEach((stepKey => {
        const sec = parseStepToSeconds(stepKey);
        if (sec > 0) {
          this.addTimeControlButton(forwardButtonsContainer, `+${stepKey}`, (() => this.seekRelative(sec)));
        }
      }));
      return seekControlRow;
    }
    "addTimeControlButton"(container, text, callback) {
      const calculateOpacity = text => {
        const value = parseInt(text.replace(/[+-]/g, ""));
        const unit = text.includes("m") ? "m" : "s";
        let opacity = .5;
        if (unit === "s") {
          if (value <= 5) {
            opacity = .5;
          } else if (value <= 10) {
            opacity = .6;
          } else {
            opacity = .7;
          }
        } else if (unit === "m") {
          if (value === 1) {
            opacity = .8;
          } else if (value === 5) {
            opacity = .9;
          } else {
            opacity = 1;
          }
        }
        return opacity;
      };
      const opacity = calculateOpacity(text);
      const button = document.createElement("button");
      button.className = "tm-time-control-button";
      button.style.setProperty("--btn-opacity", opacity);
      const isRewind = text.includes("-");
      const isForward = text.includes("+");
      const pureText = text.replace(/[+-]/g, "");
      if (isRewind) {
        button.innerHTML = `<div class="tm-time-control-button-inner">${REWIND}<span class="tm-time-text-margin-left">${pureText}</span></div>`;
      } else if (isForward) {
        button.innerHTML = `<div class="tm-time-control-button-inner"><span class="tm-time-text-margin-right">${pureText}</span>${FORWARD}</div>`;
      } else {
        button.textContent = text;
      }
      button.addEventListener("click", callback);
      button.addEventListener("mouseover", (() => {
        button.classList.add("tm-time-control-button-hover");
        button.classList.remove("tm-time-control-button-default");
      }));
      button.addEventListener("mouseout", (() => {
        button.classList.add("tm-time-control-button-default");
        button.classList.remove("tm-time-control-button-hover", "tm-time-control-button-active", "tm-time-control-button-after-active");
      }));
      button.addEventListener("mousedown", (() => {
        button.classList.add("tm-time-control-button-active");
        button.classList.remove("tm-time-control-button-hover", "tm-time-control-button-default", "tm-time-control-button-after-active");
      }));
      button.addEventListener("mouseup", (() => {
        button.classList.add("tm-time-control-button-after-active");
        button.classList.remove("tm-time-control-button-active", "tm-time-control-button-hover", "tm-time-control-button-default");
      }));
      container.appendChild(button);
      return button;
    }
  }
  class PlaybackController {
    "constructor"(playerCore, controlManager) {
      this.playerCore = playerCore;
      this.controlManager = controlManager;
      this.targetVideo = playerCore.targetVideo;
      this.uiElements = playerCore.uiElements || controlManager.uiElements;
      this.playPauseButton = null;
      this.playbackRateSlider = null;
      this.updatePlaybackRateSliderFn = null;
      this.pauseIndicator = null;
      this.dragHandler = null;
      this.upHandler = null;
    }
    "createPlayPauseButton"(container) {
      this.playPauseButton = document.createElement("button");
      this.playPauseButton.className = "tm-control-button";
      this.playPauseButton.addEventListener("click", (() => {
        const isPlaying = !this.targetVideo.paused;
        if (this.targetVideo.paused) {
          this.targetVideo.play();
        } else {
          this.targetVideo.pause();
        }
        this.updatePlayPauseButton();
        telemetry.track("play_toggle", {
          "is_playing": !isPlaying
        });
      }));
      this.playPauseButton.addEventListener("mouseover", (() => {
        this.playPauseButton.classList.add("tm-control-button-hover");
        this.playPauseButton.classList.remove("tm-control-button-default");
      }));
      this.playPauseButton.addEventListener("mouseout", (() => {
        this.playPauseButton.classList.add("tm-control-button-default");
        this.playPauseButton.classList.remove("tm-control-button-hover");
      }));
      container.appendChild(this.playPauseButton);
      this.updatePlayPauseButton();
      return this.playPauseButton;
    }
    "updatePlayPauseButton"() {
      if (!this.playPauseButton) {
        return;
      }
      const isPaused = this.targetVideo.paused;
      const newSvgHtml = isPaused ? PLAY : PAUSE;
      const currentSvg = this.playPauseButton.querySelector("svg");
      if (currentSvg) {
        const temp = document.createElement("div");
        temp.innerHTML = newSvgHtml.trim();
        const newSvg = temp.firstElementChild;
        if (newSvg) {
          this.playPauseButton.replaceChild(newSvg, currentSvg);
          return;
        }
      }
      const ripples = Array.from(this.playPauseButton.querySelectorAll(".tm-ripple, .ripple"));
      this.playPauseButton.innerHTML = newSvgHtml;
      ripples.forEach((r => this.playPauseButton.appendChild(r)));
    }
    "createPlaybackRateSlider"(container) {
      const playbackRateButton = document.createElement("button");
      playbackRateButton.className = "tm-playback-rate-button";
      const savedSpeed = parseFloat(getValue("preferredPlaybackRate", 1));
      const initialSpeed = !isNaN(savedSpeed) && savedSpeed >= .5 && savedSpeed <= 4 ? savedSpeed : 1;
      this.targetVideo.playbackRate = initialSpeed;
      playbackRateButton.addEventListener("dblclick", (e => {
        e.stopPropagation();
        if (this.targetVideo.playbackRate !== 1) {
          this.targetVideo.playbackRate = 1;
          setValue("preferredPlaybackRate", 1);
          this.syncPlaybackRateSlider(1);
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(5);
          }
        }
      }));
      playbackRateButton.addEventListener("click", (e => {
        e.stopPropagation();
        const currentSpeed = this.targetVideo.playbackRate;
        let nextSpeed = 1;
        if (currentSpeed === 1) {
          nextSpeed = 1.2;
        } else if (currentSpeed === 1.2) {
          nextSpeed = 1.5;
        } else if (currentSpeed === 1.5) {
          nextSpeed = 2;
        } else {
          nextSpeed = 1;
        }
        this.targetVideo.playbackRate = nextSpeed;
        setValue("preferredPlaybackRate", nextSpeed);
        this.syncPlaybackRateSlider(nextSpeed);
        telemetry.recordFeatureAction("speed_change");
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(5);
        }
      }));
      container.appendChild(playbackRateButton);
      this.playbackRateSlider = playbackRateButton;
      this.syncPlaybackRateSlider(this.targetVideo.playbackRate);
    }
    "syncPlaybackRateSlider"(speed) {
      if (this.playbackRateSlider) {
        const speedText = `${speed.toFixed(1)}x`;
        let textNode = null;
        for (const child of this.playbackRateSlider.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            textNode = child;
            break;
          }
        }
        if (textNode) {
          textNode.textContent = speedText;
        } else {
          const ripples = Array.from(this.playbackRateSlider.querySelectorAll(".tm-ripple, .ripple"));
          this.playbackRateSlider.textContent = speedText;
          ripples.forEach((r => this.playbackRateSlider.appendChild(r)));
        }
        this.playbackRateSlider.className = "tm-playback-rate-button";
        if (speed > 1.5) {
          this.playbackRateSlider.classList.add("fast");
        } else if (speed > 1) {
          this.playbackRateSlider.classList.add("medium");
        } else {
          this.playbackRateSlider.classList.add("normal");
        }
        telemetry.track("rate_change", {
          "rate": speed
        });
      }
    }
    "showPauseIndicator"() {
      if (this.pauseIndicator) {
        if (this.pauseIndicator.parentNode) {
          this.pauseIndicator.parentNode.removeChild(this.pauseIndicator);
        }
        this.pauseIndicator = null;
      }
      this.pauseIndicator = document.createElement("div");
      this.pauseIndicator.className = "tm-indicator-base tm-pause-indicator";
      this.pauseIndicator.style.position = "absolute";
      this.pauseIndicator.style.top = "50%";
      this.pauseIndicator.style.left = "50%";
      this.pauseIndicator.style.transform = "translate(-50%, -50%)";
      this.pauseIndicator.style.display = "flex";
      this.pauseIndicator.style.justifyContent = "center";
      this.pauseIndicator.style.alignItems = "center";
      this.pauseIndicator.innerHTML = PLAY_CENTER;
      this.uiElements.videoWrapper.appendChild(this.pauseIndicator);
      requestAnimationFrame((() => {
        this.pauseIndicator.classList.add("visible");
      }));
      setTimeout((() => {
        if (this.pauseIndicator) {
          this.pauseIndicator.classList.remove("visible");
          setTimeout((() => {
            if (this.pauseIndicator && this.pauseIndicator.parentNode) {
              this.pauseIndicator.parentNode.removeChild(this.pauseIndicator);
              this.pauseIndicator = null;
            }
          }), 300);
        }
      }), 1e3);
    }
    "cleanup"() {
      this.playbackRateSlider = null;
      this.dragHandler = null;
      this.upHandler = null;
    }
  }
  class ControlManager {
    "constructor"(playerCore, uiElements) {
      let uiManager = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      this.playerCore = playerCore;
      this.targetVideo = playerCore.targetVideo;
      this.uiManager = uiManager;
      this._rippleHandler = null;
      this.uiElements = uiElements;
      this.commentPanel = new CommentPanel(playerCore, this, uiManager);
      this.volumeController = new VolumeController(playerCore, this);
      this.seekController = new SeekController(playerCore, this);
      this.playbackController = new PlaybackController(playerCore, this);
      this.controlButtonsContainer = null;
      this.progressControlsContainer = null;
      this.progressBarElement = null;
      this.progressIndicator = null;
      this.currentTimeDisplay = null;
      this.totalDurationDisplay = null;
      this.timeIndicator = null;
      this.loopStartMarker = null;
      this.loopEndMarker = null;
      this.loopRangeElement = null;
      this.tabScrollContainer = null;
      this.tabAddBtn = null;
      this.progressMarkersContainer = null;
      this.loopManager = null;
      this.supportsVolumeControl = this.volumeController.supportsVolumeControl;
      this._volumeChangeHandler = null;
      this._rateChangeHandler = null;
    }
    "setUiManager"(uiManager) {
      this.uiManager = uiManager;
      if (this.commentPanel && typeof this.commentPanel.setUiManager === "function") {
        this.commentPanel.setUiManager(uiManager);
      }
    }
    get "volumeSlider"() {
      return this.volumeController ? this.volumeController.volumeSlider : null;
    }
    get "volumeLevel"() {
      return this.volumeController ? this.volumeController.volumeLevel : null;
    }
    get "volumeValue"() {
      return this.volumeController ? this.volumeController.volumeValue : null;
    }
    get "playbackRateSlider"() {
      return this.playbackController ? this.playbackController.playbackRateSlider : null;
    }
    get "playPauseButton"() {
      return this.playbackController ? this.playbackController.playPauseButton : null;
    }
    get "pauseIndicator"() {
      return this.playbackController ? this.playbackController.pauseIndicator : null;
    }
    get "playbackRateIndicator"() {
      return this.playbackController ? this.playbackController.playbackRateIndicator : null;
    }
    "updatePlayPauseButton"() {
      if (this.playbackController) {
        this.playbackController.updatePlayPauseButton();
      }
    }
    "showPauseIndicator"() {
      if (this.playbackController) {
        this.playbackController.showPauseIndicator();
      }
    }
    "setLoopManager"(loopManager) {
      this.loopManager = loopManager;
      if (this.commentPanel && typeof this.commentPanel.setLoopManager === "function") {
        this.commentPanel.setLoopManager(loopManager);
      }
    }
    "init"() {
      this.progressControlsContainer = this.createProgressControls();
      this.controlButtonsContainer = this.createControlButtonsContainer();
      this.initRippleEffect();
      this.initEventListeners();
      return {
        "progressControlsContainer": this.progressControlsContainer,
        "controlButtonsContainer": this.controlButtonsContainer
      };
    }
    "createProgressControls"() {
      this.progressControlsContainer = document.createElement("div");
      this.progressControlsContainer.className = "tm-progress-controls";
      const timeDisplayContainer = document.createElement("div");
      timeDisplayContainer.className = "tm-time-display-container";
      this.currentTimeDisplay = document.createElement("span");
      this.currentTimeDisplay.className = "tm-current-time";
      this.currentTimeDisplay.textContent = "00:00:00";
      this.totalDurationDisplay = document.createElement("span");
      this.totalDurationDisplay.className = "tm-total-duration";
      this.totalDurationDisplay.textContent = "-00:00:00";
      const progressBarContainer = document.createElement("div");
      progressBarContainer.className = "tm-progress-bar-container";
      this.progressBarContainer = progressBarContainer;
      this.progressBarElement = document.createElement("div");
      this.progressBarElement.className = "tm-progress-bar";
      this.progressIndicator = document.createElement("div");
      this.progressIndicator.className = "tm-progress-indicator";
      progressBarContainer.addEventListener("mouseenter", (() => {
        this.progressBarElement.classList.add("tm-progress-bar-expanded");
      }));
      progressBarContainer.addEventListener("mouseleave", (() => {
        if (!this.isDraggingProgress) {
          this.progressBarElement.classList.add("tm-progress-bar-normal");
          this.progressBarElement.classList.remove("tm-progress-bar-expanded");
        }
      }));
      progressBarContainer.addEventListener("touchstart", (() => {
        this.progressBarElement.classList.add("tm-progress-bar-expanded");
        this.progressBarElement.classList.remove("tm-progress-bar-normal");
      }), {
        "passive": true
      });
      progressBarContainer.addEventListener("touchend", (() => {
        if (!this.isDraggingProgress) {
          this.progressBarElement.classList.add("tm-progress-bar-normal");
          this.progressBarElement.classList.remove("tm-progress-bar-expanded");
        }
      }));
      this.loopStartMarker = document.createElement("div");
      this.loopStartMarker.className = "tm-loop-marker tm-loop-start-marker";
      this.loopStartMarker.style.display = "none";
      this.loopEndMarker = document.createElement("div");
      this.loopEndMarker.className = "tm-loop-marker tm-loop-end-marker";
      this.loopEndMarker.style.display = "none";
      this.loopRangeElement = document.createElement("div");
      this.loopRangeElement.className = "tm-loop-range";
      this.loopRangeElement.style.display = "none";
      timeDisplayContainer.appendChild(this.currentTimeDisplay);
      timeDisplayContainer.appendChild(this.totalDurationDisplay);
      this.progressBarElement.appendChild(this.progressIndicator);
      progressBarContainer.appendChild(this.progressBarElement);
      this.progressMarkersContainer = document.createElement("div");
      this.progressMarkersContainer.className = "tm-progress-markers-container";
      progressBarContainer.appendChild(this.progressMarkersContainer);
      progressBarContainer.appendChild(this.loopStartMarker);
      progressBarContainer.appendChild(this.loopEndMarker);
      progressBarContainer.appendChild(this.loopRangeElement);
      this.progressControlsContainer.appendChild(timeDisplayContainer);
      this.progressControlsContainer.appendChild(progressBarContainer);
      return this.progressControlsContainer;
    }
    "createControlButtonsContainer"() {
      this.controlButtonsContainer = document.createElement("div");
      this.controlButtonsContainer.className = "tm-control-buttons";
      this.dragHandle = document.createElement("div");
      this.dragHandle.className = "tm-control-drag-handle";
      this.dragHandle.title = "拖动移动控制面板 (双击重置位置)";
      this.controlButtonsContainer.appendChild(this.dragHandle);
      const commentRow = this.commentPanel.createCommentRow();
      this.controlButtonsContainer.appendChild(commentRow);
      const progressRow = document.createElement("div");
      progressRow.className = "tm-progress-row";
      this.progressRow = progressRow;
      progressRow.appendChild(this.progressControlsContainer);
      this.controlButtonsContainer.appendChild(progressRow);
      const seekControlRow = this.seekController.createSeekControlRow();
      this.controlButtonsContainer.appendChild(seekControlRow);
      const loopControlRow = document.createElement("div");
      loopControlRow.className = "tm-loop-control-row";
      this.tabScrollContainer = document.createElement("div");
      this.tabScrollContainer.className = "tm-tab-scroll-container";
      this.tabAddBtn = document.createElement("div");
      this.tabAddBtn.className = "tm-tab-list-btn";
      this.tabAddBtn.textContent = "☰";
      loopControlRow.appendChild(this.tabScrollContainer);
      loopControlRow.appendChild(this.tabAddBtn);
      this.controlButtonsContainer.appendChild(loopControlRow);
      const playbackControlRow = document.createElement("div");
      playbackControlRow.className = "tm-playback-control-row";
      const leftControlsArea = document.createElement("div");
      leftControlsArea.className = "tm-left-controls";
      leftControlsArea.style.display = "flex";
      leftControlsArea.style.alignItems = "center";
      leftControlsArea.style.gap = "6px";
      leftControlsArea.style.flex = "1";
      this.volumeController.createVolumeSlider(leftControlsArea);
      const centerControlsArea = document.createElement("div");
      centerControlsArea.className = "tm-center-controls";
      centerControlsArea.style.display = "flex";
      centerControlsArea.style.alignItems = "center";
      centerControlsArea.style.justifyContent = "center";
      centerControlsArea.style.flex = "1";
      this.playbackController.createPlayPauseButton(centerControlsArea);
      const rightControlsArea = document.createElement("div");
      rightControlsArea.className = "tm-right-controls";
      rightControlsArea.style.display = "flex";
      rightControlsArea.style.alignItems = "center";
      rightControlsArea.style.justifyContent = "flex-end";
      rightControlsArea.style.flex = "1";
      rightControlsArea.style.gap = "6px";
      this.playbackController.createPlaybackRateSlider(rightControlsArea);
      playbackControlRow.appendChild(leftControlsArea);
      playbackControlRow.appendChild(centerControlsArea);
      playbackControlRow.appendChild(rightControlsArea);
      this.controlButtonsContainer.appendChild(playbackControlRow);
      const dimCommentsOnControlInteract = () => {
        if (this.commentPanel && this.commentPanel.commentsPanel) {
          this.commentPanel.commentsPanel.classList.add("is-dimmed");
        }
      };
      this.controlButtonsContainer.addEventListener("mousedown", dimCommentsOnControlInteract, {
        "passive": true
      });
      this.controlButtonsContainer.addEventListener("touchstart", dimCommentsOnControlInteract, {
        "passive": true
      });
      return this.controlButtonsContainer;
    }
    "initEventListeners"() {
      this._volumeChangeHandler = () => {
        if (this.volumeController) {
          this.volumeController.updateVolumeUI();
        }
      };
      this.targetVideo.addEventListener("volumechange", this._volumeChangeHandler);
      this._rateChangeHandler = () => {
        if (this.playbackController) {
          const currentRate = this.targetVideo.playbackRate;
          this.playbackController.syncPlaybackRateSlider(currentRate);
        }
      };
      this.targetVideo.addEventListener("ratechange", this._rateChangeHandler);
    }
    "showJumpHint"(targetSecs) {
      if (!this.progressBarContainer || !this.targetVideo) {
        return;
      }
      const duration = this.targetVideo.duration || 1;
      const percentage = Math.max(0, Math.min(100, targetSecs / duration * 100));
      const jumpMarker = document.createElement("div");
      jumpMarker.className = "tm-jump-active";
      jumpMarker.style.left = `${percentage}%`;
      this.progressBarContainer.appendChild(jumpMarker);
      jumpMarker.addEventListener("animationend", (() => {
        jumpMarker.remove();
      }));
    }
    "initRippleEffect"() {
      if (!this.controlButtonsContainer) {
        return;
      }
      this._rippleHandler = e => {
        const btn = e.target.closest("button, .tm-tab-list-btn, .tm-tab-pill");
        if (!btn || !this.controlButtonsContainer.contains(btn)) {
          return;
        }
        if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
          return;
        }
        createRipple(e, btn);
        playTapSound();
      };
      this.controlButtonsContainer.addEventListener("click", this._rippleHandler, true);
    }
    "cleanup"() {
      if (this._rippleHandler && this.controlButtonsContainer) {
        this.controlButtonsContainer.removeEventListener("click", this._rippleHandler, true);
        this._rippleHandler = null;
      }
      if (this._volumeChangeHandler) {
        this.targetVideo.removeEventListener("volumechange", this._volumeChangeHandler);
        this._volumeChangeHandler = null;
      }
      if (this._rateChangeHandler) {
        this.targetVideo.removeEventListener("ratechange", this._rateChangeHandler);
        this._rateChangeHandler = null;
      }
      if (this.volumeController) {
        this.volumeController.cleanup();
      }
      if (this.playbackController) {
        this.playbackController.cleanup();
      }
    }
  }
  class DragManager {
    "constructor"(playerCore, uiElements) {
      let uiManager = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      let controlManager = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      this.playerCore = playerCore;
      this.uiManager = uiManager || (playerCore ? playerCore.uiManager : null);
      this.controlManager = controlManager || (playerCore ? playerCore.controlManager : null);
      this.targetVideo = playerCore === null || playerCore === void 0 ? void 0 : playerCore.targetVideo;
      this.uiElements = uiElements;
      this.container = uiElements.container;
      this.handle = uiElements.handle;
      this.isDraggingHandle = false;
      this.startX = 0;
      this.startY = 0;
      this.startWidth = 0;
      this.startHeight = 0;
      this.handleMoveHandler = null;
      this.handleEndHandler = null;
      this.controlButtonsContainer = null;
      this.dragHandle = null;
      this.isDraggingControlPanel = false;
      this.ctrlStartX = 0;
      this.ctrlStartY = 0;
      this.ctrlStartLeft = 0;
      this.ctrlStartTop = 0;
      this.ctrlMoveHandler = null;
      this.ctrlEndHandler = null;
    }
    "setManagers"() {
      let managers = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (managers.uiManager) {
        this.uiManager = managers.uiManager;
      }
      if (managers.controlManager) {
        this.controlManager = managers.controlManager;
      }
    }
    "init"() {
      this.handle.addEventListener("mousedown", this.startHandleDrag.bind(this));
      this.handle.addEventListener("touchstart", this.startHandleDrag.bind(this), {
        "passive": false
      });
      this.initControlPanelDrag();
      return this;
    }
    "updateHandlePosition"() {}
    "startHandleDrag"(e) {
      this.isDraggingHandle = true;
      this.handle.classList.add("dragging");
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(5);
      }
      const touch = e.type.includes("touch");
      this.startY = touch ? e.touches[0].clientY : e.clientY;
      this.startHeight = this.container.offsetHeight;
      const moveHandler = this._handleDragMove.bind(this);
      const endHandler = this._handleDragEnd.bind(this);
      if (touch) {
        document.addEventListener("touchmove", moveHandler, {
          "passive": false
        });
        document.addEventListener("touchend", endHandler);
        document.addEventListener("touchcancel", endHandler);
      } else {
        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", endHandler);
      }
      this.handleMoveHandler = moveHandler;
      this.handleEndHandler = endHandler;
      e.preventDefault();
    }
    "_handleDragMove"(e) {
      if (!this.isDraggingHandle) {
        return;
      }
      e.preventDefault();
      const touch = e.type.includes("touch");
      const currentY = touch ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - this.startY;
      const maxAllowedHeight = window.innerHeight * .8;
      const minHeight = Math.min(parseFloat(this.container.style.minHeight) || window.innerWidth * (9 / 16), maxAllowedHeight);
      const newHeight = Math.min(Math.max(minHeight, this.startHeight + deltaY), maxAllowedHeight);
      this.container.style.height = newHeight + "px";
      if (this.uiManager) {
        this.uiManager.isCustomResized = true;
        if (!this.uiManager.isLandscape) {
          this.uiManager.customHeightPortrait = newHeight + "px";
        } else {
          this.uiManager.customHeightLandscape = newHeight + "px";
        }
      }
    }
    "_handleDragEnd"(e) {
      if (!this.isDraggingHandle) {
        return;
      }
      this.isDraggingHandle = false;
      this.handle.classList.remove("dragging");
      document.removeEventListener("touchmove", this.handleMoveHandler);
      document.removeEventListener("touchend", this.handleEndHandler);
      document.removeEventListener("touchcancel", this.handleEndHandler);
      document.removeEventListener("mousemove", this.handleMoveHandler);
      document.removeEventListener("mouseup", this.handleEndHandler);
      this.handleMoveHandler = null;
      this.handleEndHandler = null;
      if (e.type.startsWith("touch")) {
        e.preventDefault();
      }
    }
    "initControlPanelDrag"() {
      setTimeout((() => {
        if (!this.controlManager) {
          return;
        }
        this.controlButtonsContainer = this.controlManager.controlButtonsContainer;
        this.dragHandle = this.controlManager.dragHandle;
        if (!this.controlButtonsContainer || !this.dragHandle) {
          return;
        }
        this.dragHandle.addEventListener("mousedown", this.startControlPanelDrag.bind(this));
        this.dragHandle.addEventListener("touchstart", this.startControlPanelDrag.bind(this), {
          "passive": false
        });
        this.dragHandle.addEventListener("dblclick", this.resetControlPanelPosition.bind(this));
        if (this.uiManager && this.uiManager.isFloatingControlPanel) {
          this.restoreControlPanelPosition();
        }
      }), 100);
    }
    "startControlPanelDrag"(e) {
      if (!this.uiManager || !this.uiManager.isFloatingControlPanel) {
        return;
      }
      if (e.type === "mousedown" && e.button !== 0) {
        return;
      }
      this.isDraggingControlPanel = true;
      this.controlButtonsContainer.classList.add("dragging");
      this.updateDockedState(null, false);
      const touch = e.type.includes("touch");
      this.ctrlStartX = touch ? e.touches[0].clientX : e.clientX;
      this.ctrlStartY = touch ? e.touches[0].clientY : e.clientY;
      const rect = this.controlButtonsContainer.getBoundingClientRect();
      this.ctrlStartLeft = rect.left;
      this.ctrlStartTop = rect.top;
      const moveHandler = this._handleControlPanelMove.bind(this);
      const endHandler = this._handleControlPanelEnd.bind(this);
      if (touch) {
        document.addEventListener("touchmove", moveHandler, {
          "passive": false
        });
        document.addEventListener("touchend", endHandler);
        document.addEventListener("touchcancel", endHandler);
      } else {
        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", endHandler);
      }
      this.ctrlMoveHandler = moveHandler;
      this.ctrlEndHandler = endHandler;
      e.preventDefault();
      e.stopPropagation();
    }
    "_handleControlPanelMove"(e) {
      if (!this.isDraggingControlPanel) {
        return;
      }
      e.preventDefault();
      const touch = e.type.includes("touch");
      const currentX = touch ? e.touches[0].clientX : e.clientX;
      const currentY = touch ? e.touches[0].clientY : e.clientY;
      const deltaX = currentX - this.ctrlStartX;
      const deltaY = currentY - this.ctrlStartY;
      let newLeft = this.ctrlStartLeft + deltaX;
      let newTop = this.ctrlStartTop + deltaY;
      const rect = this.controlButtonsContainer.getBoundingClientRect();
      const margin = 16;
      const headerHeight = 44;
      const minLeft = margin;
      const maxLeft = window.innerWidth - rect.width - margin;
      const minTop = headerHeight + margin;
      const maxTop = window.innerHeight - rect.height - margin;
      newLeft = Math.max(minLeft - 10, Math.min(newLeft, maxLeft + 10));
      newTop = Math.max(minTop - 10, Math.min(newTop, maxTop + 10));
      this.controlButtonsContainer.style.left = newLeft + "px";
      this.controlButtonsContainer.style.top = newTop + "px";
      this.controlButtonsContainer.style.bottom = "auto";
      this.controlButtonsContainer.style.right = "auto";
      this.controlButtonsContainer.style.transform = "none";
    }
    "_handleControlPanelEnd"(e) {
      if (!this.isDraggingControlPanel) {
        return;
      }
      this.isDraggingControlPanel = false;
      this.controlButtonsContainer.classList.remove("dragging");
      const touch = e.type.startsWith("touch");
      if (touch) {
        document.removeEventListener("touchmove", this.ctrlMoveHandler);
        document.removeEventListener("touchend", this.ctrlEndHandler);
        document.removeEventListener("touchcancel", this.ctrlEndHandler);
      } else {
        document.removeEventListener("mousemove", this.ctrlMoveHandler);
        document.removeEventListener("mouseup", this.ctrlEndHandler);
      }
      this.ctrlMoveHandler = null;
      this.ctrlEndHandler = null;
      const rect = this.controlButtonsContainer.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const margin = 16;
      const headerHeight = 44;
      let targetX = rect.left;
      let targetY = rect.top;
      const anchors = [ {
        "name": "TL",
        "x": margin,
        "y": headerHeight + margin
      }, {
        "name": "TC",
        "x": (W - w) / 2,
        "y": headerHeight + margin
      }, {
        "name": "TR",
        "x": W - w - margin,
        "y": headerHeight + margin
      }, {
        "name": "LC",
        "x": margin,
        "y": (H - h) / 2
      }, {
        "name": "RC",
        "x": W - w - margin,
        "y": (H - h) / 2
      }, {
        "name": "BL",
        "x": margin,
        "y": H - h - margin
      }, {
        "name": "BC",
        "x": (W - w) / 2,
        "y": H - h - margin
      }, {
        "name": "BR",
        "x": W - w - margin,
        "y": H - h - margin
      } ];
      let closestAnchor = anchors[0];
      let minDist = Math.hypot(targetX - closestAnchor.x, targetY - closestAnchor.y);
      for (let i = 1; i < anchors.length; i++) {
        const dist = Math.hypot(targetX - anchors[i].x, targetY - anchors[i].y);
        if (dist < minDist) {
          minDist = dist;
          closestAnchor = anchors[i];
        }
      }
      const snapRadius = 90;
      let didSnap = false;
      if (minDist < snapRadius) {
        targetX = closestAnchor.x;
        targetY = closestAnchor.y;
        didSnap = true;
      } else {
        const minLeft = margin;
        const maxLeft = W - w - margin;
        const minTop = headerHeight + margin;
        const maxTop = H - h - margin;
        targetX = Math.max(minLeft, Math.min(targetX, maxLeft));
        targetY = Math.max(minTop, Math.min(targetY, maxTop));
      }
      if (didSnap) {
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
        this.controlButtonsContainer.style.transition = "left 0.25s cubic-bezier(0.25, 1, 0.5, 1), top 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, transform 0.3s ease";
        this.controlButtonsContainer.style.left = targetX + "px";
        this.controlButtonsContainer.style.top = targetY + "px";
        setTimeout((() => {
          if (this.controlButtonsContainer) {
            this.controlButtonsContainer.style.transition = "";
          }
        }), 260);
      } else {
        this.controlButtonsContainer.style.left = targetX + "px";
        this.controlButtonsContainer.style.top = targetY + "px";
      }
      const position = {
        "left": targetX,
        "top": targetY,
        "anchorName": didSnap ? closestAnchor.name : null,
        "didSnap": didSnap
      };
      const key = this.getControlPanelStorageKey();
      localStorage.setItem(key, JSON.stringify(position));
      localStorage.setItem("tm-control-panel-pos", JSON.stringify(position));
      this.updateDockedState(didSnap ? closestAnchor.name : null, didSnap);
      if (touch) {
        e.preventDefault();
      }
      e.stopPropagation();
    }
    "getControlPanelStorageKey"() {
      const isLandscape = this.uiManager ? this.uiManager.isLandscape : window.innerWidth > window.innerHeight;
      return isLandscape ? "tm-control-panel-pos-landscape" : "tm-control-panel-pos-portrait";
    }
    "restoreControlPanelPosition"() {
      if (!this.controlButtonsContainer) {
        return;
      }
      if (this.uiManager && !this.uiManager.isFloatingControlPanel) {
        this.clearControlPanelInlineStyles();
        return;
      }
      const key = this.getControlPanelStorageKey();
      let saved = localStorage.getItem(key);
      if (!saved) {
        saved = localStorage.getItem("tm-control-panel-pos");
      }
      if (saved) {
        try {
          const savedData = JSON.parse(saved);
          let left = savedData.left;
          let top = savedData.top;
          const anchorName = savedData.anchorName;
          const didSnap = savedData.didSnap;
          const rect = this.controlButtonsContainer.getBoundingClientRect();
          const w = rect.width || 348;
          const h = rect.height || 180;
          const W = window.innerWidth;
          const H = window.innerHeight;
          const margin = 16;
          const headerHeight = 44;
          if (didSnap && anchorName) {
            const anchors = {
              "TL": {
                "x": margin,
                "y": headerHeight + margin
              },
              "TC": {
                "x": (W - w) / 2,
                "y": headerHeight + margin
              },
              "TR": {
                "x": W - w - margin,
                "y": headerHeight + margin
              },
              "LC": {
                "x": margin,
                "y": (H - h) / 2
              },
              "RC": {
                "x": W - w - margin,
                "y": (H - h) / 2
              },
              "BL": {
                "x": margin,
                "y": H - h - margin
              },
              "BC": {
                "x": (W - w) / 2,
                "y": H - h - margin
              },
              "BR": {
                "x": W - w - margin,
                "y": H - h - margin
              }
            };
            if (anchors[anchorName]) {
              left = anchors[anchorName].x;
              top = anchors[anchorName].y;
            }
          }
          const minLeft = margin;
          const maxLeft = W - w - margin;
          const minTop = headerHeight + margin;
          const maxTop = H - h - margin;
          const finalLeft = Math.max(minLeft, Math.min(left, maxLeft));
          const finalTop = Math.max(minTop, Math.min(top, maxTop));
          this.controlButtonsContainer.style.left = finalLeft + "px";
          this.controlButtonsContainer.style.top = finalTop + "px";
          this.controlButtonsContainer.style.bottom = "auto";
          this.controlButtonsContainer.style.right = "auto";
          this.controlButtonsContainer.style.transform = "none";
          this.updateDockedState(anchorName, didSnap);
        } catch (err) {}
      }
    }
    "updateDockedState"(anchorName, didSnap) {
      if (!this.controlButtonsContainer) {
        return;
      }
      const isPC = window.innerWidth >= 930 && window.matchMedia("(orientation: landscape)").matches;
      const playerContainer = this.controlButtonsContainer.closest(".tm-player-container");
      if (!playerContainer) {
        return;
      }
      playerContainer.classList.remove("tm-controls-docked-tr", "tm-controls-docked-br", "tm-controls-docked-tl", "tm-controls-docked-bl");
      const isSidebarHidden = playerContainer.classList.contains("tm-sidebar-hidden");
      const sidebarPosition = this.playerCore.options.playerState ? this.playerCore.options.playerState.settings.sidebarPosition : "right";
      const isRightDock = sidebarPosition === "right" && (anchorName === "TR" || anchorName === "BR");
      const isLeftDock = sidebarPosition === "left" && (anchorName === "TL" || anchorName === "BL");
      const isDocked = isPC && didSnap && (isRightDock || isLeftDock) && !isSidebarHidden;
      if (isDocked) {
        const rect = this.controlButtonsContainer.getBoundingClientRect();
        const h = rect.height || 180;
        playerContainer.style.setProperty("--docked-controls-height", h + "px");
        playerContainer.classList.add(`tm-controls-docked-${anchorName.toLowerCase()}`);
      } else {
        playerContainer.style.removeProperty("--docked-controls-height");
      }
    }
    "reapplyDockedState"() {
      const key = this.getControlPanelStorageKey();
      let saved = localStorage.getItem(key);
      if (!saved) {
        saved = localStorage.getItem("tm-control-panel-pos");
      }
      if (saved) {
        try {
          const savedData = JSON.parse(saved);
          if (savedData.didSnap && savedData.anchorName) {
            this.updateDockedState(savedData.anchorName, savedData.didSnap);
            return;
          }
        } catch (e) {}
      }
      this.updateDockedState(null, false);
    }
    "clearControlPanelInlineStyles"() {
      if (!this.controlButtonsContainer) {
        return;
      }
      this.controlButtonsContainer.style.left = "";
      this.controlButtonsContainer.style.top = "";
      this.controlButtonsContainer.style.bottom = "";
      this.controlButtonsContainer.style.right = "";
      this.controlButtonsContainer.style.transform = "";
      this.updateDockedState(null, false);
    }
    "resetControlPanelPosition"() {
      localStorage.removeItem("tm-control-panel-pos");
      localStorage.removeItem("tm-control-panel-pos-portrait");
      localStorage.removeItem("tm-control-panel-pos-landscape");
      this.clearControlPanelInlineStyles();
    }
  }
  class WebDavClient {
    static "getAuthHeaders"(user, pass) {
      if (!user && !pass) {
        return {};
      }
      try {
        const token = btoa(unescape(encodeURIComponent(`${user || ""}:${pass || ""}`)));
        return {
          "Authorization": `Basic ${token}`
        };
      } catch (_) {
        return {};
      }
    }
    static "normalizeUrl"(baseUrl) {
      let path = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
      if (!baseUrl) {
        return "";
      }
      let url = baseUrl.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
      url = url.replace(/\/+$/, "");
      let cleanPath = (path || "").trim();
      if (cleanPath && !cleanPath.startsWith("/")) {
        cleanPath = "/" + cleanPath;
      }
      return url + cleanPath;
    }
    static "request"(options) {
      const {"method": method = "GET", "url": url, "user": user = "", "pass": pass = "", "headers": headers = {}, "data": data = null, "timeout": timeout = 12e3} = options;
      const authHeaders = this.getAuthHeaders(user, pass);
      const mergedHeaders = Object.assign({}, authHeaders, headers);
      return new Promise(((resolve, reject) => {
        let settled = false;
        const safeResolve = res => {
          if (settled) {
            return;
          }
          settled = true;
          resolve(res);
        };
        const safeReject = err => {
          if (settled) {
            return;
          }
          settled = true;
          reject(err instanceof Error ? err : new Error(String(err)));
        };
        if (typeof GM_xmlhttpRequest === "function") {
          try {
            GM_xmlhttpRequest({
              "method": method,
              "url": url,
              "headers": mergedHeaders,
              "data": data,
              "timeout": timeout,
              "onload": res => {
                safeResolve({
                  "status": res.status,
                  "statusText": res.statusText,
                  "data": res.responseText || "",
                  "response": res.response
                });
              },
              "ontimeout": () => {
                safeReject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
              },
              "onerror": err => {
                const msg = (err === null || err === void 0 ? void 0 : err.error) || (err === null || err === void 0 ? void 0 : err.statusText) || (err !== null && err !== void 0 && err.status ? `HTTP [${err.status}]` : "网络连接失败，请检查服务器地址或跨域权限");
                safeReject(new Error(msg));
              },
              "onabort": () => {
                safeReject(new Error("请求被中止"));
              }
            });
          } catch (e) {
            safeReject(e);
          }
          return;
        }
        try {
          const fetchOpts = {
            "method": method,
            "headers": mergedHeaders,
            "body": method !== "GET" && method !== "HEAD" && method !== "PROPFIND" ? data : void 0
          };
          const controller = new AbortController;
          const timer = setTimeout((() => {
            controller.abort();
            safeReject(new Error(`WebDAV 请求超时 (${timeout}ms)`));
          }), timeout);
          fetchOpts.signal = controller.signal;
          fetch(url, fetchOpts).then((async res => {
            clearTimeout(timer);
            const text = await res.text();
            safeResolve({
              "status": res.status,
              "statusText": res.statusText,
              "data": text
            });
          })).catch((err => {
            clearTimeout(timer);
            safeReject(err);
          }));
        } catch (e) {
          safeReject(e);
        }
      }));
    }
    static async "testConnection"(config) {
      const {"url": url, "user": user, "pass": pass, "path": path = "/MissPlayer/"} = config;
      if (!url) {
        throw new Error("WebDAV 服务器地址不能为空");
      }
      let cleanPath = (path || "/MissPlayer/").trim();
      if (!cleanPath.startsWith("/")) {
        cleanPath = "/" + cleanPath;
      }
      if (!cleanPath.endsWith("/")) {
        cleanPath += "/";
      }
      const fileUrl = this.normalizeUrl(url, cleanPath + "miss_player_sync.json");
      try {
        const res = await this.request({
          "method": "GET",
          "url": fileUrl,
          "user": user,
          "pass": pass,
          "headers": {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        if (res.status === 401 || res.status === 403) {
          throw new Error(`认证失败 (${res.status}): 请检查用户名与密码/Token`);
        }
        if (res.status >= 500) {
          throw new Error(`服务器错误 (${res.status})`);
        }
        if (res.status === 200 || res.status === 404 || res.status === 204 || res.status === 207) {
          return {
            "success": true,
            "message": "WebDAV 连接成功！"
          };
        }
        return {
          "success": true,
          "message": `WebDAV 响应状态: ${res.status}`
        };
      } catch (error) {
        throw error;
      }
    }
    static async "ensureDirectory"(config) {
      const {"url": url, "user": user, "pass": pass, "path": path = "/MissPlayer/"} = config;
      let cleanPath = (path || "/MissPlayer/").trim();
      if (!cleanPath.startsWith("/")) {
        cleanPath = "/" + cleanPath;
      }
      if (!cleanPath.endsWith("/")) {
        cleanPath += "/";
      }
      const segments = cleanPath.split("/").filter(Boolean);
      let currentPath = "";
      for (const seg of segments) {
        currentPath += "/" + seg;
        const dirUrlWithSlash = this.normalizeUrl(url, currentPath + "/");
        try {
          const res = await this.request({
            "method": "MKCOL",
            "url": dirUrlWithSlash,
            "user": user,
            "pass": pass
          });
          if (res.status === 201 || res.status === 405 || res.status === 200 || res.status === 204) {
            continue;
          }
        } catch (err) {}
      }
    }
    static async "downloadBackup"(config) {
      let filename = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "miss_player_sync.json";
      const {"url": url, "user": user, "pass": pass, "path": path = "/MissPlayer/"} = config;
      let dirPath = (path || "/MissPlayer/").trim();
      if (!dirPath.startsWith("/")) {
        dirPath = "/" + dirPath;
      }
      if (!dirPath.endsWith("/")) {
        dirPath += "/";
      }
      const fileUrl = this.normalizeUrl(url, dirPath + filename);
      try {
        const res = await this.request({
          "method": "GET",
          "url": fileUrl,
          "user": user,
          "pass": pass,
          "headers": {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        if (res.status === 404) {
          return null;
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error(`认证失败 (${res.status}): 请检查用户名与密码/Token`);
        }
        if (res.status >= 200 && res.status < 300) {
          if (!res.data || !res.data.trim()) {
            return null;
          }
          return JSON.parse(res.data);
        }
        throw new Error(`下载失败，服务器返回状态码: ${res.status}`);
      } catch (error) {
        throw error;
      }
    }
    static async "uploadBackup"(config, data) {
      let filename = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "miss_player_sync.json";
      const {"url": url, "user": user, "pass": pass, "path": path = "/MissPlayer/"} = config;
      let dirPath = (path || "/MissPlayer/").trim();
      if (!dirPath.startsWith("/")) {
        dirPath = "/" + dirPath;
      }
      if (!dirPath.endsWith("/")) {
        dirPath += "/";
      }
      const fileUrl = this.normalizeUrl(url, dirPath + filename);
      const jsonString = JSON.stringify(data, null, 2);
      try {
        let res = await this.request({
          "method": "PUT",
          "url": fileUrl,
          "user": user,
          "pass": pass,
          "headers": {
            "Content-Type": "application/json; charset=utf-8"
          },
          "data": jsonString
        });
        if (res.status === 404 || res.status === 409) {
          await this.ensureDirectory(config);
          res = await this.request({
            "method": "PUT",
            "url": fileUrl,
            "user": user,
            "pass": pass,
            "headers": {
              "Content-Type": "application/json; charset=utf-8"
            },
            "data": jsonString
          });
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error(`认证失败 (${res.status}): 权限不足或密码错误`);
        }
        if (res.status === 200 || res.status === 201 || res.status === 204) {
          return {
            "success": true,
            "status": res.status
          };
        }
        throw new Error(`上传失败，服务器返回状态码: ${res.status}`);
      } catch (error) {
        throw error;
      }
    }
  }
  var _GM_info;
  const CLIENT_ID_KEY = "mp_client_id";
  const WEBDAV_CONFIG_KEY = "mp_webdav_config";
  const LAST_SYNC_TIME_KEY = "mp_webdav_last_sync_time";
  const TOMBSTONES_KEY = "mp_sync_tombstones";
  const SETTING_TIMESTAMPS_KEY = "mp_setting_timestamps";
  const CURRENT_SCHEMA_VERSION = 2;
  const MAX_TOMBSTONE_AGE = 30 * 24 * 60 * 60 * 1e3;
  const SCRIPT_VERSION = typeof GM_info !== "undefined" && (_GM_info = GM_info) !== null && _GM_info !== void 0 && (_GM_info = _GM_info.script) !== null && _GM_info !== void 0 && _GM_info.version ? GM_info.script.version : "5.6.19";
  function getOrCreateClientId() {
    let storedId = getValue(CLIENT_ID_KEY, "");
    if (storedId) {
      return storedId;
    }
    const randPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36).substring(4);
    const newId = `mp_${randPart}${timePart}`;
    setValue(CLIENT_ID_KEY, newId);
    return newId;
  }
  function getDeviceName() {
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    if (/iPad|iPhone|iPod/.test(ua)) {
      os = /iPad/.test(ua) ? "iPad" : "iPhone";
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
    } else if (/Windows NT/.test(ua)) {
      os = "Windows";
    } else if (/Android/.test(ua)) {
      os = "Android";
    } else if (/Linux/.test(ua)) {
      os = "Linux";
    }
    let browser = "Browser";
    if (/ScriptCat/i.test(ua)) {
      browser = "ScriptCat";
    } else if (/Edg/i.test(ua)) {
      browser = "Edge";
    } else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
      browser = "Chrome";
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      browser = "Safari";
    } else if (/Firefox/i.test(ua)) {
      browser = "Firefox";
    }
    return `${os} (${browser})`;
  }
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua) || navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) {
      return "tablet";
    }
    if (/Mobile|iPhone|Android/i.test(ua)) {
      return "mobile";
    }
    return "desktop";
  }
  class SyncManager {
    static "getWebDavConfig"() {
      const defaultCfg = {
        "url": "",
        "user": "",
        "pass": "",
        "path": "/MissPlayer/",
        "autoSync": true
      };
      const saved = getValue(WEBDAV_CONFIG_KEY, null);
      return Object.assign({}, defaultCfg, saved && typeof saved === "object" ? saved : {});
    }
    static "saveWebDavConfig"(config) {
      setValue(WEBDAV_CONFIG_KEY, config);
    }
    static "getLastSyncTime"() {
      return getValue(LAST_SYNC_TIME_KEY, 0);
    }
    static "setLastSyncTime"() {
      let timestamp = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Date.now();
      setValue(LAST_SYNC_TIME_KEY, timestamp);
    }
    static "getLocalTombstones"() {
      const defaultTombstones = {
        "markers": {},
        "customSeekSteps": {},
        "videos": {}
      };
      const stored = getValue(TOMBSTONES_KEY, null);
      if (!stored || typeof stored !== "object") {
        return defaultTombstones;
      }
      return {
        "markers": stored.markers && typeof stored.markers === "object" ? stored.markers : {},
        "customSeekSteps": stored.customSeekSteps && typeof stored.customSeekSteps === "object" ? stored.customSeekSteps : {},
        "videos": stored.videos && typeof stored.videos === "object" ? stored.videos : {}
      };
    }
    static "saveLocalTombstones"(tombstones) {
      const cleaned = this.purgeExpiredTombstones(tombstones);
      setValue(TOMBSTONES_KEY, cleaned);
    }
    static "recordTombstone"(type, id) {
      let extraInfo = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!id) {
        return;
      }
      const tombstones = this.getLocalTombstones();
      const now = Date.now();
      if (type === "markers") {
        tombstones.markers[id] = {
          "deletedAt": now,
          "videoKey": extraInfo || ""
        };
      } else if (type === "customSeekSteps") {
        tombstones.customSeekSteps[id] = now;
      } else if (type === "videos") {
        tombstones.videos[id] = now;
      }
      this.saveLocalTombstones(tombstones);
    }
    static "clearTombstone"(type, id) {
      if (!id) {
        return;
      }
      const tombstones = this.getLocalTombstones();
      let changed = false;
      if (type === "markers" && tombstones.markers[id]) {
        delete tombstones.markers[id];
        changed = true;
      } else if (type === "customSeekSteps" && tombstones.customSeekSteps[id]) {
        delete tombstones.customSeekSteps[id];
        changed = true;
      } else if (type === "videos" && tombstones.videos[id]) {
        delete tombstones.videos[id];
        changed = true;
      }
      if (changed) {
        this.saveLocalTombstones(tombstones);
      }
    }
    static "purgeExpiredTombstones"(tombstones) {
      if (!tombstones || typeof tombstones !== "object") {
        return {
          "markers": {},
          "customSeekSteps": {},
          "videos": {}
        };
      }
      const now = Date.now();
      const cutoff = now - MAX_TOMBSTONE_AGE;
      const cleanedMarkers = {};
      if (tombstones.markers) {
        for (const [id, meta] of Object.entries(tombstones.markers)) {
          const time = typeof meta === "object" ? meta.deletedAt : meta;
          if (time && time >= cutoff) {
            cleanedMarkers[id] = typeof meta === "object" ? meta : {
              "deletedAt": time
            };
          }
        }
      }
      const cleanedSteps = {};
      if (tombstones.customSeekSteps) {
        for (const [step, time] of Object.entries(tombstones.customSeekSteps)) {
          if (time >= cutoff) {
            cleanedSteps[step] = time;
          }
        }
      }
      const cleanedVideos = {};
      if (tombstones.videos) {
        for (const [k, time] of Object.entries(tombstones.videos)) {
          if (time >= cutoff) {
            cleanedVideos[k] = time;
          }
        }
      }
      return {
        "markers": cleanedMarkers,
        "customSeekSteps": cleanedSteps,
        "videos": cleanedVideos
      };
    }
    static "getLocalSettingTimestamps"() {
      const stored = getValue(SETTING_TIMESTAMPS_KEY, null);
      return stored && typeof stored === "object" ? stored : {};
    }
    static "recordSettingUpdate"(key) {
      if (!key) {
        return;
      }
      const timestamps = this.getLocalSettingTimestamps();
      timestamps[key] = Date.now();
      setValue(SETTING_TIMESTAMPS_KEY, timestamps);
    }
    static "gatherLocalData"() {
      let playerState = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
      const clientId = getOrCreateClientId();
      const now = Date.now();
      const tombstones = this.getLocalTombstones();
      const settingTimestamps = this.getLocalSettingTimestamps();
      const settings = (playerState === null || playerState === void 0 ? void 0 : playerState.settings) || {
        "showProgressBar": getValue("showProgressBar", true),
        "showSeekControlRow": getValue("showSeekControlRow", true),
        "showLoopControlRow": getValue("showLoopControlRow", true),
        "showPlaybackControlRow": getValue("showPlaybackControlRow", true),
        "enabledSeekSteps": getValue("enabledSeekSteps", [ "5s", "10s", "30s", "1m", "5m", "10m" ]),
        "customUserSeekSteps": getValue("customUserSeekSteps", []),
        "showCommentsSection": getValue("showCommentsSection", true),
        "enabledCommentSources": getValue("enabledCommentSources", {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        }),
        "sidebarPosition": getValue("sidebarPosition", "right"),
        "sidebarHidden": getValue("sidebarHidden", false),
        "preferredPlaybackRate": parseFloat(getValue("preferredPlaybackRate", 1)) || 1,
        "pauseOnBlur": getValue("pauseOnBlur", true),
        "buttonSoundEnabled": getValue("buttonSoundEnabled", true),
        "telemetryEnabled": false,
        "debugMode": getValue("debugMode", false)
      };
      const markers = {};
      try {
        const processList = (cleanKey, val) => {
          if (Array.isArray(val) && val.length > 0) {
            markers[cleanKey] = val.map((item => {
              const m = {
                ...item
              };
              if (!m.id) {
                const start = Math.round((m.startTime || m.tabTime || 0) * 10);
                const end = Math.round((m.endTime || m.tabEnd || 0) * 10);
                m.id = `tab_${start}_${end}_${Math.random().toString(36).slice(2, 6)}`;
              }
              if (!m.createdAt) {
                m.createdAt = now;
              }
              if (!m.updatedAt) {
                m.updatedAt = m.createdAt;
              }
              return m;
            }));
          }
        };
        if (typeof GM_listValues === "function") {
          const keys = GM_listValues();
          for (const k of keys) {
            if (k && k.startsWith("tabs_")) {
              processList(k, getValue(k, []));
            }
          }
        } else {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k) {
              let cleanKey = k;
              if (k.startsWith("mp_")) {
                cleanKey = k.replace(/^mp_/, "");
              }
              if (cleanKey.startsWith("tabs_")) {
                processList(cleanKey, getValue(cleanKey, []));
              }
            }
          }
        }
      } catch (e) {}
      const deviceType = getDeviceType();
      const deviceLayouts = {
        [deviceType]: {
          "sidebarPosition": getValue("sidebarPosition", "right"),
          "sidebarHidden": getValue("sidebarHidden", false),
          "updatedAt": settingTimestamps.sidebarPosition || settingTimestamps.sidebarHidden || now
        }
      };
      return {
        "schemaVersion": CURRENT_SCHEMA_VERSION,
        "scriptVersion": SCRIPT_VERSION,
        "lastModified": now,
        "lastModifiedBy": clientId,
        "devices": {
          [clientId]: {
            "deviceName": getDeviceName(),
            "deviceType": deviceType,
            "lastSyncTime": now,
            "scriptVersion": SCRIPT_VERSION
          }
        },
        "deviceLayouts": deviceLayouts,
        "settings": settings,
        "settingTimestamps": settingTimestamps,
        "markers": markers,
        "tombstones": tombstones
      };
    }
    static "migrateBackupSchema"(data) {
      if (!data || typeof data !== "object") {
        return null;
      }
      const migrated = Object.assign({}, data);
      if (!migrated.schemaVersion || migrated.schemaVersion < CURRENT_SCHEMA_VERSION) {
        migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
        if (!migrated.devices) {
          migrated.devices = {};
        }
        if (!migrated.settings) {
          migrated.settings = {};
        }
        if (!migrated.settingTimestamps) {
          migrated.settingTimestamps = {};
        }
        if (!migrated.markers) {
          migrated.markers = {};
        }
        if (!migrated.deviceLayouts) {
          migrated.deviceLayouts = {};
        }
        if (!migrated.tombstones) {
          migrated.tombstones = {
            "markers": {},
            "customSeekSteps": {},
            "videos": {}
          };
        }
        if (!migrated.lastModified) {
          migrated.lastModified = Date.now();
        }
        for (const [k, list] of Object.entries(migrated.markers)) {
          if (Array.isArray(list)) {
            migrated.markers[k] = list.map((item => {
              const m = {
                ...item
              };
              if (!m.id) {
                const start = Math.round((m.startTime || m.tabTime || 0) * 10);
                const end = Math.round((m.endTime || m.tabEnd || 0) * 10);
                m.id = `legacy_${start}_${end}`;
              }
              if (!m.updatedAt) {
                m.updatedAt = migrated.lastModified || 0;
              }
              if (!m.createdAt) {
                m.createdAt = m.updatedAt;
              }
              return m;
            }));
          }
        }
      }
      return migrated;
    }
    static "mergeData"(localData, remoteData, clientId) {
      if (!remoteData) {
        return localData;
      }
      if (!localData) {
        return remoteData;
      }
      const remoteMigrated = this.migrateBackupSchema(remoteData);
      const now = Date.now();
      const localTombstones = localData.tombstones || {
        "markers": {},
        "customSeekSteps": {},
        "videos": {}
      };
      const remoteTombstones = remoteMigrated.tombstones || {
        "markers": {},
        "customSeekSteps": {},
        "videos": {}
      };
      const mergedMarkerTombstones = {};
      for (const [id, meta] of Object.entries(remoteTombstones.markers || {})) {
        mergedMarkerTombstones[id] = typeof meta === "object" ? meta : {
          "deletedAt": meta
        };
      }
      for (const [id, meta] of Object.entries(localTombstones.markers || {})) {
        const lMeta = typeof meta === "object" ? meta : {
          "deletedAt": meta
        };
        const existing = mergedMarkerTombstones[id];
        if (!existing || lMeta.deletedAt > existing.deletedAt) {
          mergedMarkerTombstones[id] = lMeta;
        }
      }
      const mergedStepTombstones = Object.assign({}, remoteTombstones.customSeekSteps || {}, localTombstones.customSeekSteps || {});
      const mergedVideoTombstones = Object.assign({}, remoteTombstones.videos || {}, localTombstones.videos || {});
      const mergedTombstones = {
        "markers": mergedMarkerTombstones,
        "customSeekSteps": mergedStepTombstones,
        "videos": mergedVideoTombstones
      };
      const mergedDevices = Object.assign({}, remoteMigrated.devices || {}, localData.devices || {});
      mergedDevices[clientId] = {
        "deviceName": getDeviceName(),
        "deviceType": getDeviceType(),
        "lastSyncTime": now,
        "scriptVersion": SCRIPT_VERSION
      };
      const localSettings = localData.settings || {};
      const remoteSettings = remoteMigrated.settings || {};
      const localTimestamps = localData.settingTimestamps || {};
      const remoteTimestamps = remoteMigrated.settingTimestamps || {};
      const mergedSettingTimestamps = {};
      const mergedSettings = {};
      const allSettingKeys = Array.from(new Set([ ...Object.keys(localSettings), ...Object.keys(remoteSettings) ]));
      for (const key of allSettingKeys) {
        if (key === "customUserSeekSteps" || key === "enabledSeekSteps" || key === "enabledCommentSources") {
          continue;
        }
        const lTime = localTimestamps[key] || localData.lastModified || 0;
        const rTime = remoteTimestamps[key] || remoteMigrated.lastModified || 0;
        if (lTime >= rTime) {
          mergedSettings[key] = localSettings[key] !== void 0 ? localSettings[key] : remoteSettings[key];
          mergedSettingTimestamps[key] = lTime;
        } else {
          mergedSettings[key] = remoteSettings[key] !== void 0 ? remoteSettings[key] : localSettings[key];
          mergedSettingTimestamps[key] = rTime;
        }
      }
      const rawSteps = Array.from(new Set([ ...Array.isArray(localSettings.customUserSeekSteps) ? localSettings.customUserSeekSteps : [], ...Array.isArray(remoteSettings.customUserSeekSteps) ? remoteSettings.customUserSeekSteps : [] ]));
      const mergedCustomSteps = rawSteps.filter((step => {
        const deletedAt = mergedStepTombstones[step];
        return !deletedAt;
      }));
      mergedSettings.customUserSeekSteps = mergedCustomSteps;
      mergedSettings.enabledSeekSteps = Array.from(new Set([ ...Array.isArray(localSettings.enabledSeekSteps) ? localSettings.enabledSeekSteps : [], ...Array.isArray(remoteSettings.enabledSeekSteps) ? remoteSettings.enabledSeekSteps : [] ]));
      if (mergedSettings.enabledSeekSteps.length === 0) {
        mergedSettings.enabledSeekSteps = [ "5s", "10s", "30s", "1m", "5m", "10m" ];
      }
      mergedSettings.enabledCommentSources = Object.assign({
        "jable": true,
        "javdb": true,
        "javlibrary": false
      }, remoteSettings.enabledCommentSources || {}, localSettings.enabledCommentSources || {});
      const localMarkers = localData.markers || {};
      const remoteMarkers = remoteMigrated.markers || {};
      const allVideoKeys = Array.from(new Set([ ...Object.keys(localMarkers), ...Object.keys(remoteMarkers) ]));
      const mergedMarkers = {};
      for (const vKey of allVideoKeys) {
        const lList = Array.isArray(localMarkers[vKey]) ? localMarkers[vKey] : [];
        const rList = Array.isArray(remoteMarkers[vKey]) ? remoteMarkers[vKey] : [];
        const markerMap = new Map;
        const processCandidate = m => {
          if (!m) {
            return;
          }
          const mId = m.id || `tab_${Math.round((m.startTime || m.tabTime || 0) * 10)}_${Math.round((m.endTime || m.tabEnd || 0) * 10)}`;
          const mUpdated = m.updatedAt || m.createdAt || 0;
          const tomb = mergedMarkerTombstones[mId];
          if (tomb && tomb.deletedAt >= mUpdated) {
            return;
          }
          if (!markerMap.has(mId)) {
            markerMap.set(mId, {
              ...m,
              "id": mId,
              "updatedAt": mUpdated
            });
          } else {
            const existing = markerMap.get(mId);
            const eUpdated = existing.updatedAt || existing.createdAt || 0;
            if (mUpdated > eUpdated) {
              markerMap.set(mId, {
                ...existing,
                ...m,
                "id": mId,
                "updatedAt": mUpdated
              });
            } else if (mUpdated === eUpdated && !existing.comment && m.comment) {
              markerMap.set(mId, {
                ...existing,
                "comment": m.comment
              });
            }
          }
        };
        for (const m of rList) {
          processCandidate(m);
        }
        for (const m of lList) {
          processCandidate(m);
        }
        const mergedList = Array.from(markerMap.values()).sort(((a, b) => (a.startTime || 0) - (b.startTime || 0)));
        if (mergedList.length > 0) {
          mergedMarkers[vKey] = mergedList;
        } else {
          mergedMarkers[vKey] = [];
        }
      }
      const mergedDeviceLayouts = Object.assign({}, remoteMigrated.deviceLayouts || {}, localData.deviceLayouts || {});
      return {
        "schemaVersion": CURRENT_SCHEMA_VERSION,
        "scriptVersion": SCRIPT_VERSION,
        "lastModified": now,
        "lastModifiedBy": clientId,
        "devices": mergedDevices,
        "deviceLayouts": mergedDeviceLayouts,
        "settings": mergedSettings,
        "settingTimestamps": mergedSettingTimestamps,
        "markers": mergedMarkers,
        "tombstones": mergedTombstones
      };
    }
    static "applyDataToLocal"(data) {
      let playerState = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
      if (!data) {
        return;
      }
      const {"settings": settings, "settingTimestamps": settingTimestamps, "markers": markers, "deviceLayouts": deviceLayouts, "tombstones": tombstones} = data;
      if (settings && typeof settings === "object") {
        for (const [k, v] of Object.entries(settings)) {
          setValue(k, v);
        }
      }
      if (settingTimestamps && typeof settingTimestamps === "object") {
        setValue(SETTING_TIMESTAMPS_KEY, settingTimestamps);
      }
      if (tombstones && typeof tombstones === "object") {
        this.saveLocalTombstones(tombstones);
      }
      const currentDeviceType = getDeviceType();
      if (deviceLayouts && deviceLayouts[currentDeviceType]) {
        const layout = deviceLayouts[currentDeviceType];
        if (layout.sidebarPosition !== void 0) {
          setValue("sidebarPosition", layout.sidebarPosition);
        }
        if (layout.sidebarHidden !== void 0) {
          setValue("sidebarHidden", layout.sidebarHidden);
        }
      }
      if (markers && typeof markers === "object") {
        for (const [k, v] of Object.entries(markers)) {
          if (k.startsWith("tabs_")) {
            if (Array.isArray(v) && v.length > 0) {
              setValue(k, v);
            } else {
              deleteValue(k);
            }
          }
        }
      }
      if (playerState) {
        playerState.loadSettings();
      }
      try {
        window.dispatchEvent(new CustomEvent("mp_sync_applied", {
          "detail": {
            "data": data
          }
        }));
      } catch (_) {}
    }
    static async "executeSync"(options) {
      const {"mode": mode = "merge", "config": config = this.getWebDavConfig(), "playerState": playerState = null} = options;
      if (!config.url) {
        throw new Error("未配置 WebDAV 服务器地址");
      }
      const clientId = getOrCreateClientId();
      const localData = this.gatherLocalData(playerState);
      if (mode === "upload") {
        await WebDavClient.uploadBackup(config, localData);
        this.setLastSyncTime(localData.lastModified);
        return {
          "success": true,
          "message": "本地配置已成功向上覆盖至云端！",
          "data": localData
        };
      }
      if (mode === "download") {
        const remoteData = await WebDavClient.downloadBackup(config);
        if (!remoteData) {
          throw new Error("云端备份文件不存在，无法向下覆盖");
        }
        const migratedRemote = this.migrateBackupSchema(remoteData);
        this.applyDataToLocal(migratedRemote, playerState);
        this.setLastSyncTime(Date.now());
        return {
          "success": true,
          "message": "已成功从云端拉取配置并覆盖本地！",
          "data": migratedRemote
        };
      }
      const remoteData = await WebDavClient.downloadBackup(config);
      const mergedData = this.mergeData(localData, remoteData, clientId);
      await WebDavClient.uploadBackup(config, mergedData);
      this.applyDataToLocal(mergedData, playerState);
      this.setLastSyncTime(mergedData.lastModified);
      return {
        "success": true,
        "message": "云端多端配置智能合并同步完成！",
        "data": mergedData
      };
    }
    static "triggerAutoSync"() {
      let playerState = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
      let reason = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "startup";
      const config = this.getWebDavConfig();
      if (!config.url || config.autoSync === false) {
        return;
      }
      this.startPeriodicSync(playerState);
      if (this._isAutoSyncing) {
        return;
      }
      const now = Date.now();
      const lastSync = this.getLastSyncTime();
      if (reason === "resume") {
        if (lastSync > 0 && now - lastSync < 15 * 1e3) {
          return;
        }
        setTimeout((async () => {
          try {
            this._isAutoSyncing = true;
            await this.executeSync({
              "mode": "merge",
              "config": config,
              "playerState": playerState
            });
          } catch (err) {} finally {
            this._isAutoSyncing = false;
          }
        }), 1e3);
        return;
      }
      if (reason === "startup") {
        setTimeout((async () => {
          try {
            this._isAutoSyncing = true;
            await this.executeSync({
              "mode": "merge",
              "config": config,
              "playerState": playerState
            });
          } catch (err) {} finally {
            this._isAutoSyncing = false;
          }
        }), 1500);
        return;
      }
      if (reason === "change") {
        if (this._autoSyncDebounceTimer) {
          clearTimeout(this._autoSyncDebounceTimer);
        }
        this._autoSyncDebounceTimer = setTimeout((async () => {
          try {
            this._isAutoSyncing = true;
            await this.executeSync({
              "mode": "merge",
              "config": config,
              "playerState": playerState
            });
          } catch (err) {} finally {
            this._isAutoSyncing = false;
          }
        }), 3e3);
      }
    }
    static "startPeriodicSync"() {
      let playerState = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
      if (this._periodicTimer) {
        return;
      }
      this._periodicTimer = setInterval((async () => {
        const config = this.getWebDavConfig();
        if (!config.url || config.autoSync === false || this._isAutoSyncing) {
          return;
        }
        try {
          this._isAutoSyncing = true;
          const remoteData = await WebDavClient.downloadBackup(config);
          if (!remoteData) {
            return;
          }
          const lastSync = this.getLastSyncTime();
          if ((remoteData.lastModified || 0) > lastSync) {
            const clientId = getOrCreateClientId();
            const localData = this.gatherLocalData(playerState);
            const mergedData = this.mergeData(localData, remoteData, clientId);
            this.applyDataToLocal(mergedData, playerState);
            this.setLastSyncTime(mergedData.lastModified);
          }
        } catch (_) {} finally {
          this._isAutoSyncing = false;
        }
      }), 25e3);
    }
  }
  class MarkerBottomSheet {
    "constructor"(loopManager) {
      this.loopManager = loopManager;
      this._sheetOverlay = null;
      this._sheetPanel = null;
      this._sheetList = null;
      this._sheetCountBadge = null;
    }
    get "tabs"() {
      return this.loopManager.tabs;
    }
    get "activeTabId"() {
      return this.loopManager.activeTabId;
    }
    get "tabColors"() {
      return this.loopManager.tabColors;
    }
    get "tabAddBtn"() {
      return this.loopManager.tabAddBtn;
    }
    get "tabScrollContainer"() {
      return this.loopManager.tabScrollContainer;
    }
    get "targetVideo"() {
      return this.loopManager.targetVideo;
    }
    get "uiElements"() {
      return this.loopManager.uiElements;
    }
    "bindSwipeUpGesture"() {
      var _this$tabScrollContai;
      const el = (_this$tabScrollContai = this.tabScrollContainer) === null || _this$tabScrollContai === void 0 ? void 0 : _this$tabScrollContai.parentElement;
      if (!el) {
        return;
      }
      let startY = 0;
      let startX = 0;
      let tracking = false;
      el.addEventListener("touchstart", (e => {
        const touch = e.touches[0];
        startY = touch.clientY;
        startX = touch.clientX;
        tracking = true;
      }), {
        "passive": true
      });
      el.addEventListener("touchend", (e => {
        if (!tracking) {
          return;
        }
        tracking = false;
        const touch = e.changedTouches[0];
        const dy = touch.clientY - startY;
        const dx = Math.abs(touch.clientX - startX);
        if (dy < -40 && Math.abs(dy) > dx) {
          e.stopPropagation();
          this.open();
        }
      }));
    }
    "toggle"() {
      if (this._sheetPanel && this._sheetPanel.classList.contains("visible")) {
        this.close();
      } else {
        this.open();
      }
    }
    "updatePanelPosition"() {
      var _this$tabAddBtn, _this$uiElements, _this$tabAddBtn2, _this$tabAddBtn3, _this$uiElements2;
      if (!this._sheetPanel) {
        return;
      }
      const parentContainer = ((_this$tabAddBtn = this.tabAddBtn) === null || _this$tabAddBtn === void 0 ? void 0 : _this$tabAddBtn.closest(".tm-control-buttons")) || ((_this$uiElements = this.uiElements) === null || _this$uiElements === void 0 ? void 0 : _this$uiElements.controlButtons) || document.querySelector(".tm-control-buttons");
      const loopRow = ((_this$tabAddBtn2 = this.tabAddBtn) === null || _this$tabAddBtn2 === void 0 ? void 0 : _this$tabAddBtn2.closest(".tm-loop-control-row")) || ((_this$tabAddBtn3 = this.tabAddBtn) === null || _this$tabAddBtn3 === void 0 ? void 0 : _this$tabAddBtn3.parentElement);
      const handleContainer = ((_this$uiElements2 = this.uiElements) === null || _this$uiElements2 === void 0 ? void 0 : _this$uiElements2.handleContainer) || document.querySelector(".tm-handle-container");
      if (parentContainer && loopRow) {
        const parentRect = parentContainer.getBoundingClientRect();
        const loopRect = loopRow.getBoundingClientRect();
        const bottomOffset = Math.max(0, parentRect.bottom - loopRect.bottom);
        this._sheetPanel.style.bottom = `${bottomOffset}px`;
        if (handleContainer) {
          const handleRect = handleContainer.getBoundingClientRect();
          const availableHeight = loopRect.bottom - handleRect.bottom - 10;
          if (availableHeight > 80) {
            this._sheetPanel.style.maxHeight = `${availableHeight}px`;
            return;
          }
        }
      }
      this._sheetPanel.style.maxHeight = "calc(100vh - 120px)";
    }
    "open"() {
      if (!this._sheetOverlay || !this._sheetPanel) {
        this.createBottomSheet();
      }
      this.updateBottomSheet();
      this.updatePanelPosition();
      if (this._sheetOverlay) {
        this._sheetOverlay.classList.add("visible");
      }
      if (this._sheetPanel) {
        this._sheetPanel.classList.add("visible");
      }
    }
    "close"() {
      if (this._sheetOverlay) {
        this._sheetOverlay.classList.remove("visible");
      }
      if (this._sheetPanel) {
        this._sheetPanel.classList.remove("visible");
      }
    }
    "createBottomSheet"() {
      var _this$tabAddBtn4, _this$uiElements3, _this$uiElements4;
      const parentContainer = ((_this$tabAddBtn4 = this.tabAddBtn) === null || _this$tabAddBtn4 === void 0 ? void 0 : _this$tabAddBtn4.closest(".tm-control-buttons")) || ((_this$uiElements3 = this.uiElements) === null || _this$uiElements3 === void 0 ? void 0 : _this$uiElements3.controlButtons) || document.querySelector(".tm-control-buttons");
      if (!parentContainer) {
        return;
      }
      if (this._sheetOverlay) {
        this._sheetOverlay.remove();
      }
      if (this._sheetPanel) {
        this._sheetPanel.remove();
      }
      this._sheetOverlay = document.createElement("div");
      this._sheetOverlay.className = "tm-bottom-sheet-overlay";
      this._sheetOverlay.addEventListener("click", (() => this.close()));
      this._sheetOverlay.addEventListener("touchmove", (e => {
        if (e.cancelable) {
          e.preventDefault();
        }
      }), {
        "passive": false
      });
      this._sheetPanel = document.createElement("div");
      this._sheetPanel.className = "tm-bottom-sheet-panel";
      this._sheetPanel.addEventListener("click", (e => e.stopPropagation()));
      const header = document.createElement("div");
      header.className = "tm-sheet-header";
      const titleWrapper = document.createElement("div");
      titleWrapper.style.display = "flex";
      titleWrapper.style.alignItems = "center";
      titleWrapper.style.gap = "8px";
      const title = document.createElement("div");
      title.className = "tm-bottom-sheet-title";
      title.textContent = "标签管理";
      const countBadge = document.createElement("span");
      countBadge.className = "tm-sheet-count-badge";
      this._sheetCountBadge = countBadge;
      titleWrapper.appendChild(title);
      titleWrapper.appendChild(countBadge);
      const closeBtn = document.createElement("button");
      closeBtn.className = "tm-sheet-close-btn";
      closeBtn.innerHTML = "✕";
      closeBtn.title = "关闭";
      closeBtn.addEventListener("click", (() => this.close()));
      header.appendChild(titleWrapper);
      header.appendChild(closeBtn);
      this._sheetList = document.createElement("div");
      this._sheetList.className = "tm-bottom-sheet-list";
      this._sheetPanel.appendChild(header);
      this._sheetPanel.appendChild(this._sheetList);
      const playerContainer = ((_this$uiElements4 = this.uiElements) === null || _this$uiElements4 === void 0 ? void 0 : _this$uiElements4.playerContainer) || document.querySelector(".tm-player-container") || document.body;
      playerContainer.appendChild(this._sheetOverlay);
      parentContainer.appendChild(this._sheetPanel);
    }
    "updateBottomSheet"() {
      if (!this._sheetList) {
        return;
      }
      this._sheetList.innerHTML = "";
      if (this._sheetCountBadge) {
        this._sheetCountBadge.textContent = `共 ${this.tabs.length} 条`;
      }
      if (this.tabs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "tm-bottom-sheet-empty";
        empty.textContent = "暂无标签";
        this._sheetList.appendChild(empty);
        return;
      }
      this.tabs.forEach(((tab, index) => {
        const color = this.tabColors[index % this.tabColors.length];
        const row = document.createElement("div");
        row.className = "tm-sheet-item";
        if (this.activeTabId === tab.id) {
          row.classList.add("active");
        }
        const timeContainer = document.createElement("div");
        timeContainer.className = "tm-sheet-item-time-container";
        if (tab.type === "highlight") {
          const pill = document.createElement("button");
          pill.className = "tm-sheet-time-pill";
          pill.style.setProperty("--tab-color", color);
          pill.textContent = formatTimeWithHours(tab.startTime);
          pill.title = "跳转到此时间";
          pill.addEventListener("click", (() => {
            this.loopManager._handleTabClick(tab);
          }));
          timeContainer.appendChild(pill);
        } else {
          const pill = document.createElement("div");
          pill.className = "tm-sheet-time-pill interval";
          pill.style.setProperty("--tab-color", color);
          const startSpan = document.createElement("span");
          startSpan.className = "tm-time-part start";
          startSpan.textContent = formatTimeWithHours(tab.startTime);
          startSpan.title = "跳转到起点并开始循环";
          startSpan.addEventListener("click", (e => {
            e.stopPropagation();
            this.loopManager._handleTabClick(tab);
          }));
          const sepSpan = document.createElement("span");
          sepSpan.className = "tm-time-sep";
          sepSpan.textContent = "~";
          const endSpan = document.createElement("span");
          endSpan.className = "tm-time-part end";
          endSpan.textContent = formatTimeWithHours(tab.endTime);
          endSpan.title = "跳转到终点";
          endSpan.addEventListener("click", (e => {
            e.stopPropagation();
            if (this.targetVideo) {
              this.targetVideo.currentTime = tab.endTime;
            }
          }));
          pill.appendChild(startSpan);
          pill.appendChild(sepSpan);
          pill.appendChild(endSpan);
          if (this.loopManager.activeTabId === tab.id && this.loopManager.loopActive) {
            pill.classList.add("looping");
            const overlay = document.createElement("div");
            overlay.className = "tm-tab-loop-overlay";
            overlay.innerHTML = LOOP_INTERVAL;
            pill.appendChild(overlay);
          }
          pill.addEventListener("click", (() => {
            this.loopManager._handleTabClick(tab);
          }));
          timeContainer.appendChild(pill);
        }
        const input = document.createElement("input");
        input.type = "text";
        input.className = "tm-sheet-item-comment-input";
        input.placeholder = "添加备注...";
        input.value = tab.comment || "";
        const stopProp = e => e.stopPropagation();
        input.addEventListener("keydown", stopProp);
        input.addEventListener("keyup", stopProp);
        input.addEventListener("keypress", stopProp);
        input.addEventListener("mousedown", stopProp);
        input.addEventListener("touchstart", stopProp);
        input.addEventListener("input", (e => {
          tab.comment = e.target.value;
          this.loopManager._saveTabs();
          this.loopManager.renderTabs();
        }));
        input.addEventListener("change", (() => {
          this.loopManager._saveTabs();
          this.loopManager.renderTabs();
        }));
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "tm-sheet-delete-btn";
        deleteBtn.innerHTML = "❌";
        deleteBtn.title = "删除标签";
        deleteBtn.addEventListener("click", (e => {
          e.stopPropagation();
          if (tab && tab.id) {
            SyncManager.recordTombstone("markers", tab.id, this.loopManager.storageKey);
          }
          this.loopManager.tabs = this.loopManager.tabs.filter((t => t.id !== tab.id));
          if (this.loopManager.activeTabId === tab.id) {
            this.loopManager.disableLoop();
            this.loopManager.activeTabId = null;
          }
          this.loopManager._saveTabs();
          this.loopManager.renderTabs();
          this.updateBottomSheet();
        }));
        row.appendChild(timeContainer);
        row.appendChild(input);
        row.appendChild(deleteBtn);
        this._sheetList.appendChild(row);
      }));
    }
    "cleanup"() {
      if (this._sheetOverlay) {
        this._sheetOverlay.remove();
        this._sheetOverlay = null;
      }
      if (this._sheetPanel) {
        this._sheetPanel.remove();
        this._sheetPanel = null;
        this._sheetList = null;
        this._sheetCountBadge = null;
      }
    }
  }
  class LoopManager {
    "constructor"(playerCore, uiElements) {
      let controlManager = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      this.playerCore = playerCore;
      this.controlManager = controlManager || (playerCore ? playerCore.controlManager : null);
      this.targetVideo = playerCore === null || playerCore === void 0 ? void 0 : playerCore.targetVideo;
      this.uiElements = uiElements;
      this.loopStartMarker = null;
      this.loopEndMarker = null;
      this.loopRangeElement = null;
      this.tabScrollContainer = null;
      this.tabAddBtn = null;
      this.progressMarkersContainer = null;
      this.tabs = [];
      this.activeTabId = null;
      this.draftTab = null;
      this.loopActive = false;
      this.loopStartTime = null;
      this.loopEndTime = null;
      this._longPressTimer = null;
      this._longPressTriggered = false;
      this.storageKey = null;
      this.bottomSheet = new MarkerBottomSheet(this);
      this.editingTabId = null;
      this.editingTabCopy = null;
      this._durationFallbackBound = null;
      this.tabColors = [ "200, 100%, 55%", "145, 80%, 48%", "260, 85%, 62%", "15, 95%, 58%", "330, 90%, 60%", "170, 85%, 42%" ];
      this._handleLoopTimeUpdate = this._handleLoopTimeUpdate.bind(this);
      this._handleOutsideClickForEdit = this._handleOutsideClickForEdit.bind(this);
    }
    get "_sheetOverlay"() {
      return this.bottomSheet._sheetOverlay;
    }
    set "_sheetOverlay"(v) {
      this.bottomSheet._sheetOverlay = v;
    }
    get "_sheetPanel"() {
      return this.bottomSheet._sheetPanel;
    }
    set "_sheetPanel"(v) {
      this.bottomSheet._sheetPanel = v;
    }
    get "_sheetList"() {
      return this.bottomSheet._sheetList;
    }
    set "_sheetList"(v) {
      this.bottomSheet._sheetList = v;
    }
    get "_sheetCountBadge"() {
      return this.bottomSheet._sheetCountBadge;
    }
    set "_sheetCountBadge"(v) {
      this.bottomSheet._sheetCountBadge = v;
    }
    "setControlManager"(controlManager) {
      this.controlManager = controlManager;
    }
    "init"(elements) {
      this.loopStartMarker = elements.loopStartMarker;
      this.loopEndMarker = elements.loopEndMarker;
      this.loopRangeElement = elements.loopRangeElement;
      this.progressMarkersContainer = elements.progressMarkersContainer;
      this.tabScrollContainer = elements.tabScrollContainer;
      this.tabAddBtn = elements.tabAddBtn;
      const videoCode = getVideoCodeFromUrl();
      this.storageKey = videoCode ? `tabs_${videoCode}` : null;
      this._loadTabs();
      this._resetDraftTab();
      this.renderTabs();
      if (this.tabAddBtn) {
        this.tabAddBtn.addEventListener("click", (e => {
          e.stopPropagation();
          this._toggleBottomSheet();
        }));
      }
      if (this.tabScrollContainer) {
        this.tabScrollContainer.addEventListener("wheel", (e => {
          if (e.deltaY !== 0) {
            e.preventDefault();
            this.tabScrollContainer.scrollLeft += e.deltaY;
          }
        }), {
          "passive": false
        });
      }
      this._bindSwipeUpGesture();
      if (this.targetVideo) {
        this.targetVideo.addEventListener("durationchange", (() => this.renderProgressMarkers()));
        this.targetVideo.addEventListener("loadedmetadata", (() => this.renderProgressMarkers()));
      }
      this._onSyncAppliedBound = () => {
        this._loadTabs();
        this.renderTabs();
        if (this.markerBottomSheet) {
          this.markerBottomSheet.updateBottomSheet();
        }
      };
      window.addEventListener("mp_sync_applied", this._onSyncAppliedBound);
      this._parseUrlHashParams();
      return this;
    }
    "renderTabs"() {
      if (!this.tabScrollContainer) {
        return;
      }
      this.tabScrollContainer.innerHTML = "";
      this.renderProgressMarkers();
      this.tabs.forEach((tab => {
        const pill = this.editingTabId === tab.id ? this._createEditPill(tab) : this._createTabPill(tab);
        this.tabScrollContainer.appendChild(pill);
      }));
      if (!this.draftTab) {
        this._resetDraftTab();
      }
      const draftPill = this._createDraftPill();
      this.tabScrollContainer.appendChild(draftPill);
      this._updateActiveTabProgress();
    }
    "_createTabPill"(tab) {
      if (!tab) {
        return document.createElement("div");
      }
      const index = this.tabs.findIndex((t => t && t.id === tab.id));
      const color = index !== -1 ? this.tabColors[index % this.tabColors.length] : this.tabColors[0];
      const pill = document.createElement("div");
      pill.className = "tm-tab-pill";
      pill.dataset.tabId = tab.id || "";
      pill.style.setProperty("--tab-color", color);
      if (tab.type === "highlight") {
        const timeSpan = document.createElement("span");
        timeSpan.className = "tm-tab-time-text";
        timeSpan.textContent = formatTimeWithHours(tab.startTime);
        pill.appendChild(timeSpan);
      } else {
        const timeSpan = document.createElement("span");
        timeSpan.className = "tm-tab-time-text";
        timeSpan.textContent = `${formatTimeWithHours(tab.startTime)} ~ ${formatTimeWithHours(tab.endTime)}`;
        pill.appendChild(timeSpan);
        if (this.activeTabId === tab.id && this.loopActive) {
          pill.classList.add("looping");
          const overlay = document.createElement("div");
          overlay.className = "tm-tab-loop-overlay";
          overlay.innerHTML = LOOP_INTERVAL;
          pill.appendChild(overlay);
        }
      }
      if (this.activeTabId === tab.id) {
        pill.classList.add("active");
      }
      pill.addEventListener("click", (e => {
        if (this._longPressTriggered) {
          this._longPressTriggered = false;
          return;
        }
        this._handleTabClick(tab);
      }));
      let startX = 0;
      let startY = 0;
      const startLongPress = e => {
        this._longPressTriggered = false;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        this._longPressTimer = setTimeout((() => {
          this._longPressTriggered = true;
          this._handleTabLongPress(tab);
          if (window.navigator.vibrate) {
            window.navigator.vibrate(15);
          }
        }), 500);
      };
      const cancelLongPress = () => {
        if (this._longPressTimer) {
          clearTimeout(this._longPressTimer);
          this._longPressTimer = null;
        }
      };
      const moveLongPress = e => {
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.hypot(dx, dy) > 8) {
          cancelLongPress();
        }
      };
      pill.addEventListener("mousedown", startLongPress);
      pill.addEventListener("touchstart", startLongPress, {
        "passive": true
      });
      pill.addEventListener("mousemove", moveLongPress);
      pill.addEventListener("touchmove", moveLongPress, {
        "passive": true
      });
      pill.addEventListener("mouseup", cancelLongPress);
      pill.addEventListener("mouseleave", cancelLongPress);
      pill.addEventListener("touchend", cancelLongPress);
      pill.addEventListener("touchcancel", cancelLongPress);
      return pill;
    }
    "_createABTimeContainer"(labelChar, timeVal, isDisabled, onClick) {
      const container = document.createElement("span");
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.gap = "3px";
      container.style.padding = "2px 5px";
      container.style.borderRadius = "4px";
      container.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
      container.style.fontSize = "11px";
      if (isDisabled) {
        container.style.opacity = "0.4";
        container.style.cursor = "not-allowed";
        container.style.pointerEvents = "none";
      } else {
        container.style.opacity = "1";
        container.style.cursor = "pointer";
        container.style.pointerEvents = "auto";
      }
      const label = document.createElement("span");
      label.className = `tm-draft-label ${labelChar.toLowerCase()}`;
      label.style.color = "white";
      label.style.fontWeight = "600";
      label.textContent = labelChar;
      const time = document.createElement("span");
      time.className = `tm-draft-time${timeVal === null ? " placeholder" : ""}`;
      time.style.color = timeVal !== null ? "#fff" : "rgba(255,255,255,0.3)";
      time.textContent = timeVal !== null ? formatTimeWithHours(timeVal) : "--:--:--";
      container.appendChild(label);
      container.appendChild(time);
      container.addEventListener("click", (e => {
        e.stopPropagation();
        if (onClick) {
          onClick();
        }
      }));
      return container;
    }
    "_createDraftPill"() {
      const isPlaceholder = this.draftTab.startTime === null && this.draftTab.endTime === null;
      const color = isPlaceholder ? "0, 0%, 55%" : this.tabColors[this.tabs.length % this.tabColors.length];
      const pill = document.createElement("div");
      pill.className = "tm-tab-pill draft";
      if (isPlaceholder) {
        pill.classList.add("placeholder");
      }
      pill.style.setProperty("--tab-color", color);
      pill.style.gap = "5px";
      if (isPlaceholder) {
        pill.style.cursor = "pointer";
        pill.addEventListener("click", (() => {
          if (this.targetVideo) {
            this.disableLoop();
            this.activeTabId = null;
            this.draftTab.startTime = this.targetVideo.currentTime;
            this.renderTabs();
            if (window.navigator.vibrate) {
              window.navigator.vibrate(10);
            }
          }
        }));
      }
      const aContainer = this._createABTimeContainer("A", this.draftTab.startTime, false, (() => {
        if (!this.targetVideo) {
          return;
        }
        this.draftTab.startTime = this.targetVideo.currentTime;
        this.renderTabs();
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }));
      const bContainer = this._createABTimeContainer("B", this.draftTab.endTime, this.draftTab.startTime === null, (() => {
        if (!this.targetVideo) {
          return;
        }
        this.draftTab.endTime = this.targetVideo.currentTime;
        this.renderTabs();
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }));
      pill.appendChild(aContainer);
      pill.appendChild(bContainer);
      const SVG_CHECK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      const SVG_CROSS = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      const saveBtn = document.createElement("button");
      saveBtn.className = "tm-draft-action save";
      saveBtn.innerHTML = SVG_CHECK;
      saveBtn.title = "保存标签";
      saveBtn.addEventListener("click", (e => {
        e.stopPropagation();
        if (this.draftTab.startTime === null && this.draftTab.endTime === null) {
          Toast("请至少设置一个时间点", 2e3, "error");
          return;
        }
        if (this.draftTab.startTime !== null && this.draftTab.endTime !== null) {
          if (this.draftTab.endTime <= this.draftTab.startTime) {
            Toast("结束点 (B) 必须大于开始点 (A)", 2e3, "error");
            return;
          }
          this.draftTab.type = "interval";
        } else {
          this.draftTab.type = "highlight";
          if (this.draftTab.startTime === null) {
            this.draftTab.startTime = this.draftTab.endTime;
            this.draftTab.endTime = null;
          }
        }
        this._showCommentDialog();
      }));
      pill.appendChild(saveBtn);
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "tm-draft-action cancel";
      cancelBtn.innerHTML = SVG_CROSS;
      cancelBtn.title = "取消草稿";
      cancelBtn.addEventListener("click", (e => {
        e.stopPropagation();
        this._resetDraftTab();
        this.renderTabs();
      }));
      pill.appendChild(cancelBtn);
      return pill;
    }
    "_createEditPill"(tab) {
      const index = this.tabs.findIndex((t => t.id === tab.id));
      const color = index !== -1 ? this.tabColors[index % this.tabColors.length] : this.tabColors[0];
      const pill = document.createElement("div");
      pill.className = "tm-tab-pill draft editing";
      pill.dataset.tabId = tab.id;
      pill.style.setProperty("--tab-color", color);
      pill.style.gap = "5px";
      const copy = this.editingTabCopy;
      const aContainer = this._createABTimeContainer("A", copy.startTime, false, (() => {
        if (!this.targetVideo) {
          return;
        }
        copy.startTime = this.targetVideo.currentTime;
        this.renderTabs();
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }));
      const bContainer = this._createABTimeContainer("B", copy.endTime, copy.startTime === null, (() => {
        if (!this.targetVideo || copy.startTime === null) {
          return;
        }
        copy.endTime = this.targetVideo.currentTime;
        this.renderTabs();
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }));
      pill.appendChild(aContainer);
      pill.appendChild(bContainer);
      const SVG_EDIT = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      const SVG_CHECK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      const SVG_CROSS = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      const editCommentBtn = document.createElement("button");
      editCommentBtn.className = "tm-draft-action edit-comment";
      editCommentBtn.innerHTML = SVG_EDIT;
      editCommentBtn.title = "编辑备注";
      editCommentBtn.addEventListener("click", (e => {
        e.stopPropagation();
        this._showCommentDialog(copy);
      }));
      pill.appendChild(editCommentBtn);
      const saveBtn = document.createElement("button");
      saveBtn.className = "tm-draft-action save";
      saveBtn.innerHTML = SVG_CHECK;
      saveBtn.title = "保存修改";
      saveBtn.addEventListener("click", (e => {
        e.stopPropagation();
        if (copy.startTime === null && copy.endTime === null) {
          Toast("请至少设置一个时间点", 2e3, "error");
          return;
        }
        if (copy.startTime !== null && copy.endTime !== null) {
          if (copy.endTime <= copy.startTime) {
            Toast("结束点 (B) 必须大于开始点 (A)", 2e3, "error");
            return;
          }
          copy.type = "interval";
        } else {
          copy.type = "highlight";
          if (copy.startTime === null) {
            copy.startTime = copy.endTime;
            copy.endTime = null;
          }
        }
        const idx = this.tabs.findIndex((t => t.id === tab.id));
        if (idx !== -1) {
          this.tabs[idx] = {
            ...copy,
            "updatedAt": Date.now()
          };
          SyncManager.clearTombstone("markers", tab.id);
          this._saveTabs();
        }
        this._exitEditMode();
      }));
      pill.appendChild(saveBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "tm-draft-action cancel";
      deleteBtn.innerHTML = SVG_CROSS;
      deleteBtn.title = "删除标签";
      deleteBtn.addEventListener("click", (e => {
        e.stopPropagation();
        if (tab && tab.id) {
          SyncManager.recordTombstone("markers", tab.id, this.storageKey);
        }
        this.tabs = this.tabs.filter((t => t.id !== tab.id));
        if (this.activeTabId === tab.id) {
          this.disableLoop();
          this.activeTabId = null;
        }
        this._saveTabs();
        this._exitEditMode();
      }));
      pill.appendChild(deleteBtn);
      return pill;
    }
    "_enterEditMode"(tab) {
      this.editingTabId = tab.id;
      this.editingTabCopy = {
        ...tab
      };
      this._resetDraftTab();
      this.disableLoop();
      this.activeTabId = null;
      this.renderTabs();
      setTimeout((() => {
        document.addEventListener("click", this._handleOutsideClickForEdit);
      }), 0);
    }
    "_exitEditMode"() {
      this.editingTabId = null;
      this.editingTabCopy = null;
      document.removeEventListener("click", this._handleOutsideClickForEdit);
      this.renderTabs();
    }
    "_handleOutsideClickForEdit"(e) {
      var _this$tabScrollContai;
      const editingPill = (_this$tabScrollContai = this.tabScrollContainer) === null || _this$tabScrollContai === void 0 ? void 0 : _this$tabScrollContai.querySelector(".tm-tab-pill.draft.editing");
      if (editingPill && !editingPill.contains(e.target)) {
        if (e.target.closest(".tm-player-container, .tm-modal-overlay, .tm-comment-modal, .tm-bottom-sheet-panel, .tm-bottom-sheet-overlay")) {
          return;
        }
        this._exitEditMode();
      }
    }
    "_handleTabClick"(tab) {
      playTapSound();
      telemetry.track("tag_jump", {
        "type": tab.type,
        "has_comment": !!tab.comment
      });
      telemetry.trackTimestampClick({
        "secs": tab.type === "interval" ? [ tab.startTime, tab.endTime ] : tab.startTime,
        "comment": tab.comment || "",
        "source": "tab_marker"
      });
      if (tab.type === "highlight") {
        if (this.controlManager && typeof this.controlManager.showJumpHint === "function") {
          this.controlManager.showJumpHint(tab.startTime);
        }
        this.targetVideo.currentTime = tab.startTime;
        if (this.targetVideo.paused) {
          this.targetVideo.play().catch((() => {}));
        }
        this.disableLoop();
        this.activeTabId = tab.id;
        this.renderTabs();
      } else if (this.activeTabId === tab.id && this.loopActive) {
        this.disableLoop();
        this.activeTabId = null;
        this.renderTabs();
      } else {
        this.disableLoop();
        this.activeTabId = tab.id;
        this.loopStartTime = tab.startTime;
        this.loopEndTime = tab.endTime;
        const ct = this.targetVideo ? this.targetVideo.currentTime : 0;
        const isInRange = ct >= tab.startTime && ct < tab.endTime;
        if (!isInRange) {
          if (this.controlManager && typeof this.controlManager.showJumpHint === "function") {
            this.controlManager.showJumpHint(tab.startTime);
          }
          if (this.targetVideo) {
            this.targetVideo.currentTime = tab.startTime;
          }
        }
        this.enableLoop();
        if (this.targetVideo && this.targetVideo.paused) {
          this.targetVideo.play().catch((() => {}));
        }
        this.renderTabs();
      }
    }
    "_handleTabLongPress"(tab) {
      this._enterEditMode(tab);
    }
    "_resetDraftTab"() {
      this.draftTab = {
        "id": this._generateId(),
        "type": "interval",
        "startTime": null,
        "endTime": null,
        "comment": ""
      };
    }
    "_showCommentDialog"() {
      var _this$uiElements, _this$uiElements2;
      let existingTab = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
      const isEdit = existingTab !== null;
      const tab = isEdit ? existingTab : this.draftTab;
      if (!tab) {
        return;
      }
      const parentContainer = ((_this$uiElements = this.uiElements) === null || _this$uiElements === void 0 ? void 0 : _this$uiElements.controlButtonsContainer) || ((_this$uiElements2 = this.uiElements) === null || _this$uiElements2 === void 0 ? void 0 : _this$uiElements2.controlPanel) || document.querySelector(".tm-control-buttons");
      if (!parentContainer) {
        return;
      }
      const existingPopover = parentContainer.querySelector(".tm-inline-remark-popover");
      if (existingPopover) {
        existingPopover.remove();
      }
      const popover = document.createElement("div");
      popover.className = "tm-inline-remark-popover";
      popover.innerHTML = `\n            <div class="tm-inline-remark-body">\n                <input type="text" class="tm-inline-remark-input" placeholder="输入高光或区间备注..." value="${tab.comment || ""}" />\n                <div class="tm-inline-remark-footer">\n                    <button type="button" class="tm-inline-remark-btn cancel">SKIP</button>\n                    <button type="button" class="tm-inline-remark-btn submit">SAVE</button>\n                </div>\n            </div>\n        `;
      const input = popover.querySelector(".tm-inline-remark-input");
      const skipBtn = popover.querySelector(".tm-inline-remark-btn.cancel");
      const saveBtn = popover.querySelector(".tm-inline-remark-btn.submit");
      const stopProp = e => e.stopPropagation();
      input.addEventListener("keydown", stopProp);
      input.addEventListener("keyup", stopProp);
      input.addEventListener("keypress", stopProp);
      input.addEventListener("mousedown", stopProp);
      input.addEventListener("touchstart", stopProp);
      popover.addEventListener("click", (e => e.stopPropagation()));
      parentContainer.appendChild(popover);
      requestAnimationFrame((() => {
        popover.classList.add("visible");
        try {
          input.focus({
            "preventScroll": true
          });
        } catch (_) {
          input.focus();
        }
        input.select();
      }));
      const close = () => {
        popover.classList.remove("visible");
        popover.addEventListener("transitionend", (() => popover.remove()), {
          "once": true
        });
      };
      const save = comment => {
        tab.comment = comment;
        tab.updatedAt = Date.now();
        if (isEdit) {
          if (tab.id) {
            SyncManager.clearTombstone("markers", tab.id);
          }
          if (existingTab === this.editingTabCopy) {
            this.renderTabs();
          } else {
            this._saveTabs();
            this.renderTabs();
            this._updateBottomSheet();
          }
        } else {
          telemetry.track("tag_create", {
            "type": this.draftTab.type || (this.draftTab.endTime !== null ? "interval" : "highlight"),
            "has_comment": !!comment,
            "duration_sec": this.draftTab.endTime && this.draftTab.startTime ? Math.round(this.draftTab.endTime - this.draftTab.startTime) : 0
          });
          const now = Date.now();
          const newTab = {
            ...this.draftTab,
            "comment": comment,
            "createdAt": now,
            "updatedAt": now
          };
          this.tabs.push(newTab);
          if (newTab.id) {
            SyncManager.clearTombstone("markers", newTab.id);
          }
          this._resetDraftTab();
          this._saveTabs();
          this._sortTabs();
          this.renderTabs();
        }
        close();
      };
      saveBtn.addEventListener("click", (e => {
        e.stopPropagation();
        save(input.value.trim());
      }));
      skipBtn.addEventListener("click", (e => {
        e.stopPropagation();
        if (!isEdit) {
          save("");
        } else {
          close();
        }
      }));
      input.addEventListener("keydown", (e => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          save(input.value.trim());
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          if (!isEdit) {
            this._resetDraftTab();
            this.renderTabs();
          }
          close();
        }
      }));
    }
    "enableLoop"() {
      if (!this.targetVideo || this.loopStartTime === null || this.loopEndTime === null) {
        return;
      }
      this.loopActive = true;
      telemetry.recordFeatureAction("ab_loop_set");
      telemetry.track("loop_toggle", {
        "enabled": true,
        "interval_sec": Math.round((this.loopEndTime - this.loopStartTime) * 10) / 10
      });
      this.targetVideo.removeEventListener("timeupdate", this._handleLoopTimeUpdate);
      this.targetVideo.addEventListener("timeupdate", this._handleLoopTimeUpdate);
      if (this.targetVideo.currentTime < this.loopStartTime || this.targetVideo.currentTime > this.loopEndTime) {
        this.targetVideo.currentTime = this.loopStartTime;
      }
      this.updateLoopMarkers();
      this.renderProgressMarkers();
      if (window.navigator.vibrate) {
        window.navigator.vibrate([ 10, 30, 10 ]);
      }
    }
    "disableLoop"() {
      if (!this.loopActive) {
        return;
      }
      this.targetVideo.removeEventListener("timeupdate", this._handleLoopTimeUpdate);
      this.loopActive = false;
      this.loopStartTime = null;
      this.loopEndTime = null;
      this._clearAllTabProgress();
      this.updateLoopMarkers();
      this.renderProgressMarkers();
    }
    "checkAndExitLoopIfOutside"(targetTime) {
      if (!this.loopActive || this.loopStartTime === null || this.loopEndTime === null) {
        return false;
      }
      const isOutside = targetTime < this.loopStartTime - .05 || targetTime > this.loopEndTime + .05;
      if (isOutside) {
        this.disableLoop();
        this.activeTabId = null;
        this.renderTabs();
        if (this.bottomSheet && typeof this.bottomSheet.updateBottomSheet === "function") {
          this.bottomSheet.updateBottomSheet();
        }
        return true;
      }
      return false;
    }
    "_handleLoopTimeUpdate"() {
      if (!this.loopActive || this.loopStartTime === null || this.loopEndTime === null) {
        return;
      }
      const ct = this.targetVideo.currentTime;
      if (ct >= this.loopEndTime || ct < this.loopStartTime) {
        this.totalLoopDurationSec = (this.totalLoopDurationSec || 0) + Math.max(0, this.loopEndTime - this.loopStartTime);
        this.targetVideo.currentTime = this.loopStartTime;
      }
      this.renderProgressMarkers();
      this._updateActiveTabProgress();
    }
    "_clearAllTabProgress"() {
      if (!this.tabScrollContainer) {
        return;
      }
      const pills = this.tabScrollContainer.querySelectorAll(".tm-tab-pill");
      pills.forEach((p => p.style.background = ""));
    }
    "_updateActiveTabProgress"() {
      if (!this.targetVideo || !this.tabScrollContainer) {
        return;
      }
      if (!this.loopActive || !this.activeTabId) {
        this._clearAllTabProgress();
        return;
      }
      const activeTab = this.tabs.find((t => t.id === this.activeTabId));
      if (!activeTab || activeTab.type !== "interval") {
        this._clearAllTabProgress();
        return;
      }
      const pill = this.tabScrollContainer.querySelector(`.tm-tab-pill[data-tab-id="${this.activeTabId}"]`);
      if (!pill) {
        return;
      }
      const duration = activeTab.endTime - activeTab.startTime;
      if (duration <= 0) {
        return;
      }
      const ct = this.targetVideo.currentTime;
      const pct = Math.max(0, Math.min(100, (ct - activeTab.startTime) / duration * 100));
      pill.style.background = `linear-gradient(to right, hsla(var(--tab-color), 0.38) ${pct}%, hsla(var(--tab-color), 0.15) ${pct}%)`;
    }
    "updateLoopMarkers"() {
      var _this$uiElements3;
      if (!this.targetVideo || !this.loopStartMarker || !this.loopEndMarker) {
        return;
      }
      const progressBarElement = ((_this$uiElements3 = this.uiElements) === null || _this$uiElements3 === void 0 ? void 0 : _this$uiElements3.progressBar) || document.querySelector(".tm-progress-bar");
      if (!progressBarElement) {
        return;
      }
      const duration = this.targetVideo.duration;
      if (duration <= 0) {
        return;
      }
      const updateMarker = (time, marker, isActive) => {
        if (time !== null && !isNaN(time) && time >= 0 && time <= duration) {
          marker.style.left = `${time / duration * 100}%`;
          marker.style.display = "block";
          if (isActive) {
            marker.classList.add("active");
          } else {
            marker.classList.remove("active");
          }
        } else {
          marker.style.display = "none";
          marker.classList.remove("active");
        }
      };
      updateMarker(this.loopStartTime, this.loopStartMarker, this.loopActive);
      updateMarker(this.loopEndTime, this.loopEndMarker, this.loopActive);
      if (this.loopRangeElement) {
        if (this.loopActive && this.loopStartTime !== null && this.loopEndTime !== null) {
          const startPos = this.loopStartTime / duration * 100;
          const endPos = this.loopEndTime / duration * 100;
          const width = endPos - startPos;
          if (width > 0) {
            this.loopRangeElement.style.left = `${startPos}%`;
            this.loopRangeElement.style.width = `${width}%`;
            this.loopRangeElement.style.display = "block";
            this.loopRangeElement.classList.add("active");
          } else {
            this.loopRangeElement.style.display = "none";
          }
        } else {
          this.loopRangeElement.classList.remove("active");
          this.loopRangeElement.style.display = "none";
        }
      }
    }
    "updateLoopTimeDisplay"() {}
    "_updateUI"() {
      this.renderTabs();
      this.updateLoopMarkers();
    }
    "_parseUrlHashParams"() {
      let paramsToParse = [];
      if (window.location.hash) {
        let hash = window.location.hash.substring(1);
        if (hash.startsWith("t=")) {
          hash = hash.substring(2);
        }
        const segments = hash.split(",").map((s => {
          let clean = s.trim();
          if (clean.startsWith("t=")) {
            clean = clean.substring(2);
          }
          return clean;
        })).filter(Boolean);
        paramsToParse.push(...segments);
      }
      if (window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const tParam = urlParams.get("t");
        if (tParam) {
          const segments = tParam.split(",").map((s => {
            let clean = s.trim();
            if (clean.startsWith("t=")) {
              clean = clean.substring(2);
            }
            return clean;
          })).filter(Boolean);
          paramsToParse.push(...segments);
        }
        const startParam = urlParams.get("start");
        const endParam = urlParams.get("end");
        if (startParam) {
          if (endParam) {
            paramsToParse.push(`${startParam}-${endParam}`);
          } else {
            paramsToParse.push(startParam);
          }
        }
      }
      if (paramsToParse.length === 0) {
        return;
      }
      try {
        const url = new URL(window.location.href);
        let urlChanged = false;
        if (url.hash) {
          url.hash = "";
          urlChanged = true;
        }
        if (url.searchParams.has("t")) {
          url.searchParams.delete("t");
          urlChanged = true;
        }
        if (url.searchParams.has("start")) {
          url.searchParams.delete("start");
          urlChanged = true;
        }
        if (url.searchParams.has("end")) {
          url.searchParams.delete("end");
          urlChanged = true;
        }
        if (urlChanged) {
          window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        }
      } catch (e) {}
      const handleMeta = () => {
        if (!this.targetVideo) {
          return;
        }
        let firstTabToActivate = null;
        paramsToParse.forEach((segment => {
          if (segment.includes("-")) {
            const [startStr, endStr] = segment.split("-");
            const startSec = this._parseTimeString(startStr);
            const endSec = this._parseTimeString(endStr);
            if (startSec !== null && endSec !== null) {
              let existingTab = this.tabs.find((t => t.type === "interval" && Math.abs(t.startTime - startSec) < 1 && Math.abs(t.endTime - endSec) < 1));
              if (!existingTab) {
                existingTab = {
                  "id": this._generateId(),
                  "type": "interval",
                  "startTime": startSec,
                  "endTime": endSec,
                  "comment": "From URL"
                };
                this.tabs.push(existingTab);
              }
              if (!firstTabToActivate) {
                firstTabToActivate = existingTab;
              }
            }
          } else {
            const sec = this._parseTimeString(segment);
            if (sec !== null) {
              let existingTab = this.tabs.find((t => t.type === "highlight" && Math.abs(t.startTime - sec) < 1));
              if (!existingTab) {
                existingTab = {
                  "id": this._generateId(),
                  "type": "highlight",
                  "startTime": sec,
                  "comment": "From URL"
                };
                this.tabs.push(existingTab);
              }
              if (!firstTabToActivate) {
                firstTabToActivate = existingTab;
              }
            }
          }
        }));
        this._saveTabs();
        this._sortTabs();
        this.renderTabs();
        if (firstTabToActivate) {
          if (firstTabToActivate.type === "highlight") {
            this.targetVideo.currentTime = firstTabToActivate.startTime;
            if (this.targetVideo.paused) {
              this.targetVideo.play().catch((() => {}));
            }
            this.disableLoop();
            this.activeTabId = firstTabToActivate.id;
          } else {
            this.disableLoop();
            this.activeTabId = firstTabToActivate.id;
            this.loopStartTime = firstTabToActivate.startTime;
            this.loopEndTime = firstTabToActivate.endTime;
            this.enableLoop();
          }
          this.renderTabs();
        }
        if (this.targetVideo) {
          this.targetVideo.removeEventListener("loadedmetadata", handleMeta);
        }
      };
      if (this.targetVideo.readyState >= 1) {
        handleMeta();
      } else {
        this.targetVideo.addEventListener("loadedmetadata", handleMeta);
      }
    }
    "_parseTimeString"(timeString) {
      if (!timeString) {
        return null;
      }
      const clean = timeString.trim();
      const matchHms = clean.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      if (matchHms) {
        return parseInt(matchHms[1], 10) * 3600 + parseInt(matchHms[2], 10) * 60 + parseInt(matchHms[3], 10);
      }
      const matchMs = clean.match(/^(\d{1,2}):(\d{2})$/);
      if (matchMs) {
        return parseInt(matchMs[1], 10) * 60 + parseInt(matchMs[2], 10);
      }
      if (clean.match(/^\d+(\.\d+)?$/)) {
        return parseFloat(clean);
      }
      return null;
    }
    "_bindSwipeUpGesture"() {
      return this.bottomSheet.bindSwipeUpGesture();
    }
    "_toggleBottomSheet"() {
      return this.bottomSheet.toggle();
    }
    "_updatePanelPosition"() {
      return this.bottomSheet.updatePanelPosition();
    }
    "_openBottomSheet"() {
      return this.bottomSheet.open();
    }
    "_closeBottomSheet"() {
      return this.bottomSheet.close();
    }
    "_createBottomSheet"() {
      return this.bottomSheet.createBottomSheet();
    }
    "_updateBottomSheet"() {
      return this.bottomSheet.updateBottomSheet();
    }
    "renderProgressMarkers"() {
      if (!this.progressMarkersContainer || !this.targetVideo) {
        return;
      }
      this.progressMarkersContainer.innerHTML = "";
      if (this.loopStartMarker) {
        this.loopStartMarker.style.display = "none";
      }
      if (this.loopEndMarker) {
        this.loopEndMarker.style.display = "none";
      }
      if (this.loopRangeElement) {
        this.loopRangeElement.style.display = "none";
      }
      const duration = this.targetVideo.duration;
      if (duration <= 0 || isNaN(duration)) {
        if (!this._durationFallbackBound) {
          this._durationFallbackBound = () => {
            if (!this.targetVideo) {
              return;
            }
            const dur = this.targetVideo.duration;
            if (dur > 0 && !isNaN(dur)) {
              this.renderProgressMarkers();
              if (this.targetVideo) {
                this.targetVideo.removeEventListener("timeupdate", this._durationFallbackBound);
              }
              this._durationFallbackBound = null;
            }
          };
          this.targetVideo.addEventListener("timeupdate", this._durationFallbackBound);
        }
        return;
      }
      this.tabs.forEach(((tab, index) => {
        const color = this.tabColors[index % this.tabColors.length];
        const startPct = tab.startTime / duration * 100;
        if (tab.type === "highlight") {
          const tick = document.createElement("div");
          tick.className = "tm-progress-marker-tick";
          tick.style.left = `${startPct}%`;
          tick.style.setProperty("--tab-color", color);
          tick.addEventListener("click", (e => {
            e.stopPropagation();
            this._handleTabClick(tab);
          }));
          this.progressMarkersContainer.appendChild(tick);
        } else if (tab.type === "interval") {
          const endPct = tab.endTime / duration * 100;
          const widthPct = endPct - startPct;
          if (widthPct <= 0) {
            return;
          }
          if (this.loopActive && this.activeTabId === tab.id) {
            const baseRange = document.createElement("div");
            baseRange.className = "tm-active-loop-unplayed";
            baseRange.style.left = `${startPct}%`;
            baseRange.style.width = `${widthPct}%`;
            baseRange.style.setProperty("--tab-color", color);
            this.progressMarkersContainer.appendChild(baseRange);
            const clampedCurrent = Math.max(tab.startTime, Math.min(tab.endTime, this.targetVideo.currentTime));
            const playedPct = (clampedCurrent - tab.startTime) / duration * 100;
            if (playedPct > 0) {
              const played = document.createElement("div");
              played.className = "tm-active-loop-played";
              played.style.left = `${startPct}%`;
              played.style.width = `${playedPct}%`;
              played.style.setProperty("--tab-color", color);
              this.progressMarkersContainer.appendChild(played);
            }
            const startTick = document.createElement("div");
            startTick.className = "tm-active-loop-boundary start";
            startTick.style.left = `${startPct}%`;
            startTick.style.setProperty("--tab-color", color);
            this.progressMarkersContainer.appendChild(startTick);
            const endTick = document.createElement("div");
            endTick.className = "tm-active-loop-boundary end";
            endTick.style.left = `${endPct}%`;
            endTick.style.setProperty("--tab-color", color);
            this.progressMarkersContainer.appendChild(endTick);
          } else {
            const range = document.createElement("div");
            range.className = "tm-progress-marker-range";
            range.style.left = `${startPct}%`;
            range.style.width = `${widthPct}%`;
            range.style.setProperty("--tab-color", color);
            range.addEventListener("click", (e => {
              e.stopPropagation();
              this._handleTabClick(tab);
            }));
            this.progressMarkersContainer.appendChild(range);
          }
        }
      }));
    }
    "_sortTabs"() {
      this.tabs.sort(((a, b) => a.startTime - b.startTime));
    }
    "_saveTabs"() {
      if (!this.storageKey) {
        return;
      }
      const now = Date.now();
      this.tabs = this.tabs.map((t => {
        const copy = {
          ...t
        };
        if (!copy.createdAt) {
          copy.createdAt = now;
        }
        if (!copy.updatedAt) {
          copy.updatedAt = now;
        }
        return copy;
      }));
      this._sortTabs();
      setValue(this.storageKey, this.tabs);
      try {
        var _this$playerCore;
        SyncManager.triggerAutoSync((_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 || (_this$playerCore = _this$playerCore.options) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.playerState, "change");
      } catch (_) {}
      try {
        if (Array.isArray(this.tabs) && this.tabs.length > 0) {
          const latest = this.tabs[this.tabs.length - 1];
          if (latest) {
            telemetry.trackTimestampCollect({
              "type": latest.type || "point",
              "startTime": latest.startTime,
              "endTime": latest.endTime,
              "comment": latest.comment || ""
            });
          }
        }
      } catch (_) {}
    }
    "_loadTabs"() {
      if (!this.storageKey) {
        this.tabs = [];
        return;
      }
      const saved = getValue(this.storageKey, []);
      const now = Date.now();
      this.tabs = (Array.isArray(saved) ? saved : []).filter((t => t && typeof t === "object")).map((t => {
        const item = {
          ...t
        };
        if (!item.id) {
          item.id = this._generateId();
        }
        if (!item.createdAt) {
          item.createdAt = now;
        }
        if (!item.updatedAt) {
          item.updatedAt = item.createdAt;
        }
        return item;
      }));
      this._sortTabs();
    }
    "_generateId"() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    "cleanup"() {
      this.disableLoop();
      document.removeEventListener("click", this._handleOutsideClickForEdit);
      if (this.targetVideo && this._durationFallbackBound) {
        this.targetVideo.removeEventListener("timeupdate", this._durationFallbackBound);
        this._durationFallbackBound = null;
      }
      if (this.bottomSheet) {
        this.bottomSheet.cleanup();
      }
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
    }
  }
  class ProgressManager {
    "constructor"(playerCore, uiElements) {
      this.playerCore = playerCore;
      this.targetVideo = playerCore.targetVideo;
      this.uiElements = uiElements;
      this.progressBarElement = null;
      this.progressIndicator = null;
      this.currentTimeDisplay = null;
      this.totalDurationDisplay = null;
      this.timeIndicator = null;
      this.isDraggingProgress = false;
      this.progressHandleMoveHandler = null;
      this.progressHandleUpHandler = null;
      this.lastDragX = 0;
      this.isTouchDevice = "ontouchstart" in window;
      this._loopManager = null;
    }
    "setLoopManager"(loopManager) {
      this._loopManager = loopManager;
    }
    get "loopManager"() {
      var _this$playerCore, _this$playerCore2;
      return this._loopManager || ((_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.loopManager) || ((_this$playerCore2 = this.playerCore) === null || _this$playerCore2 === void 0 || (_this$playerCore2 = _this$playerCore2.managers) === null || _this$playerCore2 === void 0 ? void 0 : _this$playerCore2.loopManager);
    }
    "init"(progressElements) {
      this.progressBarElement = progressElements.progressBarElement;
      this.progressIndicator = progressElements.progressIndicator;
      this.currentTimeDisplay = progressElements.currentTimeDisplay;
      this.totalDurationDisplay = progressElements.totalDurationDisplay;
      this.timeIndicator = progressElements.timeIndicator;
      this.progressBarContainer = this.progressBarElement.parentElement;
      this.progressBarElement.addEventListener("click", this.handleProgressClick.bind(this));
      this.progressBarContainer.addEventListener("mousedown", this.startProgressDrag.bind(this));
      this.progressBarContainer.addEventListener("touchstart", this.startProgressDrag.bind(this), {
        "passive": false
      });
      this.targetVideo.addEventListener("timeupdate", this.updateProgressBar.bind(this));
      return this;
    }
    "updateProgressBar"() {
      if (!this.targetVideo || !this.progressBarElement || !this.progressIndicator) {
        return;
      }
      const currentTime = this.targetVideo.currentTime;
      const duration = this.targetVideo.duration;
      if (isNaN(duration) || duration <= 0) {
        return;
      }
      const progressPercent = currentTime / duration * 100;
      this.progressIndicator.style.width = `${progressPercent}%`;
      this.updateCurrentTimeDisplay();
    }
    "updateCurrentTimeDisplay"() {
      if (!this.targetVideo || !this.currentTimeDisplay || !this.totalDurationDisplay) {
        return;
      }
      const currentTime = this.targetVideo.currentTime;
      const duration = this.targetVideo.duration;
      if (isNaN(duration)) {
        return;
      }
      this.currentTimeDisplay.textContent = formatTime(currentTime);
      const remainingTime = duration - currentTime;
      this.totalDurationDisplay.textContent = `-${formatTime(remainingTime)}`;
    }
    "handleProgressClick"(e) {
      if (this.isDraggingProgress) {
        return;
      }
      const rect = this.progressBarElement.getBoundingClientRect();
      const relativePos = (e.clientX - rect.left) / rect.width;
      const duration = this.targetVideo.duration;
      if (isNaN(duration)) {
        return;
      }
      const targetTime = duration * relativePos;
      if (this.loopManager && typeof this.loopManager.checkAndExitLoopIfOutside === "function") {
        this.loopManager.checkAndExitLoopIfOutside(targetTime);
      }
      this.targetVideo.currentTime = targetTime;
      this.updateProgressBar();
    }
    "seekRelative"(seconds) {
      if (!this.targetVideo) {
        return;
      }
      const newTime = Math.max(0, Math.min(this.targetVideo.duration, this.targetVideo.currentTime + seconds));
      if (this.loopManager && typeof this.loopManager.checkAndExitLoopIfOutside === "function") {
        this.loopManager.checkAndExitLoopIfOutside(newTime);
      }
      this.targetVideo.currentTime = newTime;
    }
    "startProgressDrag"(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDraggingProgress = true;
      this.lastDragX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      this.progressBarElement.classList.add("tm-progress-bar-expanded");
      this.progressBarElement.classList.remove("tm-progress-bar-normal");
      this.progressBarElement.classList.add("tm-dragging");
      if (this.timeIndicator) {
        this.timeIndicator.style.display = "block";
        this.timeIndicator.style.opacity = "1";
        this.updateTimeIndicator(e);
      }
      const moveHandler = this.handleProgressMove.bind(this);
      const upHandler = this.handleProgressUp.bind(this);
      this.removeProgressEventListeners();
      if (e.type.includes("touch")) {
        document.addEventListener("touchmove", moveHandler, {
          "passive": false
        });
        document.addEventListener("touchend", upHandler, {
          "passive": false
        });
        document.addEventListener("touchcancel", upHandler, {
          "passive": false
        });
      } else {
        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
        document.addEventListener("mouseleave", upHandler);
      }
      this.progressHandleMoveHandler = moveHandler;
      this.progressHandleUpHandler = upHandler;
      const rect = this.progressBarElement.getBoundingClientRect();
      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      let relativePos = (clientX - rect.left) / rect.width;
      relativePos = Math.max(0, Math.min(1, relativePos));
      const duration = this.targetVideo.duration;
      if (!isNaN(duration)) {
        const newTime = duration * relativePos;
        if (this.loopManager && typeof this.loopManager.checkAndExitLoopIfOutside === "function") {
          this.loopManager.checkAndExitLoopIfOutside(newTime);
        }
        this.targetVideo.currentTime = newTime;
        this.progressIndicator.style.width = `${relativePos * 100}%`;
        this.updateCurrentTimeDisplay();
      }
    }
    "handleProgressMove"(e) {
      if (!this.isDraggingProgress) {
        return;
      }
      e.preventDefault();
      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      this.updateTimeIndicator(e);
      const rect = this.progressBarElement.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      let relativePos = (clientX - rect.left) / rect.width;
      relativePos = Math.max(0, Math.min(1, relativePos));
      const duration = this.targetVideo.duration;
      if (isNaN(duration)) {
        return;
      }
      const newTime = duration * relativePos;
      if (this.loopManager && typeof this.loopManager.checkAndExitLoopIfOutside === "function") {
        this.loopManager.checkAndExitLoopIfOutside(newTime);
      }
      this.progressIndicator.style.width = `${relativePos * 100}%`;
      this.targetVideo.currentTime = newTime;
      this.currentTimeDisplay.textContent = formatTime(newTime);
      const remainingTime = duration - newTime;
      this.totalDurationDisplay.textContent = `-${formatTime(remainingTime)}`;
      this.lastDragX = clientX;
    }
    "handleProgressUp"(e) {
      if (!this.isDraggingProgress) {
        return;
      }
      const rect = this.progressBarElement.getBoundingClientRect();
      const clientX = e.type.includes("touch") ? e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : this.lastDragX : e.clientX || this.lastDragX;
      let relativePos = (clientX - rect.left) / rect.width;
      relativePos = Math.max(0, Math.min(1, relativePos));
      const duration = this.targetVideo.duration;
      if (!isNaN(duration)) {
        const targetTime = duration * relativePos;
        if (this.loopManager && typeof this.loopManager.checkAndExitLoopIfOutside === "function") {
          this.loopManager.checkAndExitLoopIfOutside(targetTime);
        }
        this.targetVideo.currentTime = targetTime;
      }
      if (this.timeIndicator) {
        this.timeIndicator.style.opacity = "0";
      }
      this.progressBarElement.classList.remove("tm-dragging");
      if (!this.progressBarElement.classList.contains("tm-progress-bar-hovered")) {
        this.progressBarElement.classList.add("tm-progress-bar-normal");
        this.progressBarElement.classList.remove("tm-progress-bar-expanded");
      }
      this.isDraggingProgress = false;
      this.lastDragX = 0;
      this.removeProgressEventListeners();
    }
    "removeProgressEventListeners"() {
      if (this.progressHandleMoveHandler) {
        document.removeEventListener("mousemove", this.progressHandleMoveHandler);
        document.removeEventListener("touchmove", this.progressHandleMoveHandler);
      }
      if (this.progressHandleUpHandler) {
        document.removeEventListener("mouseup", this.progressHandleUpHandler);
        document.removeEventListener("touchend", this.progressHandleUpHandler);
        document.removeEventListener("touchcancel", this.progressHandleUpHandler);
        document.removeEventListener("mouseleave", this.progressHandleUpHandler);
      }
      this.progressHandleMoveHandler = null;
      this.progressHandleUpHandler = null;
    }
    "updateTimeIndicator"(e) {
      if (!this.timeIndicator || !this.targetVideo) {
        return;
      }
      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
      const videoRect = this.uiElements.videoWrapper.getBoundingClientRect();
      const progressRect = this.progressBarElement.getBoundingClientRect();
      let leftPos = Math.max(videoRect.left + 10, Math.min(videoRect.right - 10, clientX));
      let topPos = progressRect.top - 20;
      this.timeIndicator.style.left = `${leftPos}px`;
      this.timeIndicator.style.top = `${topPos}px`;
      const relativePos = (clientX - progressRect.left) / progressRect.width;
      const boundedPos = Math.max(0, Math.min(1, relativePos));
      const duration = this.targetVideo.duration;
      if (isNaN(duration)) {
        return;
      }
      const time = duration * boundedPos;
      this.timeIndicator.textContent = `${formatTime(time)} / ${formatTime(duration)}`;
    }
  }
  function BlurPlaybackManager_defineProperty(e, r, t) {
    return (r = BlurPlaybackManager_toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      "value": t,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : e[r] = t, e;
  }
  function BlurPlaybackManager_toPropertyKey(t) {
    var i = BlurPlaybackManager_toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function BlurPlaybackManager_toPrimitive(t, r) {
    if ("object" != typeof t || !t) {
      return t;
    }
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) {
        return i;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  class BlurPlaybackManager {
    static "initGlobal"() {
      let playerState = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
      if (this.isInitialized) {
        return;
      }
      this.isInitialized = true;
      const isPauseOnBlurEnabled = () => {
        var _playerState$settings;
        if ((playerState === null || playerState === void 0 || (_playerState$settings = playerState.settings) === null || _playerState$settings === void 0 ? void 0 : _playerState$settings.pauseOnBlur) !== void 0) {
          return playerState.settings.pauseOnBlur;
        }
        const val = getValue("pauseOnBlur", true);
        return val === true || val === "true";
      };
      try {
        Object.defineProperty(document, "hidden", {
          "get": () => isPauseOnBlurEnabled() ? false : false,
          "configurable": true
        });
      } catch (_) {}
      try {
        Object.defineProperty(document, "visibilityState", {
          "get": () => isPauseOnBlurEnabled() ? "visible" : "visible",
          "configurable": true
        });
      } catch (_) {}
      try {
        Object.defineProperty(document, "hasFocus", {
          "value": () => true,
          "configurable": true
        });
      } catch (_) {}
      const blurEvents = [ "visibilitychange", "webkitvisibilitychange", "mozvisibilitychange", "blur", "focusout", "pagehide" ];
      blurEvents.forEach((eventType => {
        const handler = e => {
          if (!isPauseOnBlurEnabled()) {
            e.stopImmediatePropagation();
          }
        };
        window.addEventListener(eventType, handler, true);
        document.addEventListener(eventType, handler, true);
      }));
    }
    static "attachPlayer"(targetVideo, playerCore) {
      if (!targetVideo) {
        return;
      }
      let userInteracted = false;
      let wasPlaying = !targetVideo.paused;
      const isPauseOnBlurEnabled = () => {
        var _playerCore$options;
        if ((playerCore === null || playerCore === void 0 || (_playerCore$options = playerCore.options) === null || _playerCore$options === void 0 || (_playerCore$options = _playerCore$options.playerState) === null || _playerCore$options === void 0 || (_playerCore$options = _playerCore$options.settings) === null || _playerCore$options === void 0 ? void 0 : _playerCore$options.pauseOnBlur) !== void 0) {
          return playerCore.options.playerState.settings.pauseOnBlur;
        }
        const val = getValue("pauseOnBlur", true);
        return val === true || val === "true";
      };
      const markUserInteraction = () => {
        userInteracted = true;
        setTimeout((() => {
          userInteracted = false;
        }), 600);
      };
      [ "click", "touchstart", "keydown" ].forEach((evt => {
        document.addEventListener(evt, markUserInteraction, {
          "capture": true,
          "passive": true
        });
      }));
      targetVideo.addEventListener("play", (() => {
        wasPlaying = true;
      }));
      targetVideo.addEventListener("pause", (() => {
        if (isPauseOnBlurEnabled()) {
          wasPlaying = false;
          return;
        }
        if (!userInteracted && wasPlaying && !targetVideo.ended) {
          setTimeout((() => {
            if (targetVideo.paused && !targetVideo.ended && wasPlaying) {
              targetVideo.play().catch((() => {}));
            }
          }), 150);
        } else if (userInteracted) {
          wasPlaying = false;
        }
      }), true);
      const handleVisibilityChange = () => {
        if (isPauseOnBlurEnabled()) {
          if (document.hidden || document.visibilityState === "hidden") {
            if (targetVideo && !targetVideo.paused) {
              targetVideo.pause();
            }
          }
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleVisibilityChange);
    }
  }
  BlurPlaybackManager_defineProperty(BlurPlaybackManager, "isInitialized", false);
  class EventManager {
    "constructor"(playerCore, uiElements, managers) {
      this.playerCore = playerCore;
      this.targetVideo = playerCore.targetVideo;
      this.uiElements = uiElements;
      this.managers = managers;
      this.resizeObserver = null;
      this.clickLock = false;
      this.clickLockTimeout = null;
    }
    "init"() {
      this.handleWindowResizeBound = this.handleWindowResize.bind(this);
      this.handleContainerResizeBound = this.handleContainerResize.bind(this);
      this.handleWindowScrollDebugBound = null;
      this._touchStartX = 0;
      this._touchStartY = 0;
      this.handleTouchStartBound = e => {
        if (e.touches && e.touches.length > 0) {
          this._touchStartX = e.touches[0].clientX;
          this._touchStartY = e.touches[0].clientY;
          if (e.target.closest(".tm-video-container")) {
            if (window.tmDebugLogger) {
              window.tmDebugLogger.log(`touchStart video. Y: ${this._touchStartY}, scrollY: ${window.scrollY}`);
            }
          }
        }
      };
      this.handleContextMenuBound = e => {
        e.preventDefault();
      };
      this.handleScrollPreventionBound = e => {
        if (e.target.closest(".tm-video-container")) {
          if (e.type === "touchmove") {
            if (e.touches && e.touches.length > 0) {
              const currentY = e.touches[0].clientY;
              const diffY = currentY - this._touchStartY;
              this._lastTouchY = currentY;
              if (diffY < -5) {
                if (window.tmDebugLogger) {
                  window.tmDebugLogger.log(`touchmove video [SWIPE UP]. diffY: ${diffY}, scrollY: ${window.scrollY}. Allow!`);
                }
                return;
              } else if (window.tmDebugLogger) {
                window.tmDebugLogger.log(`touchmove video [SWIPE DOWN/OTHER]. diffY: ${diffY}, scrollY: ${window.scrollY}. Block!`);
              }
            }
          } else if (e.type === "wheel") {
            if (e.deltaY > 0) {
              if (window.tmDebugLogger) {
                window.tmDebugLogger.log(`wheel video [DOWN]. delta: ${e.deltaY}, scrollY: ${window.scrollY}. Allow!`);
              }
              return;
            } else if (window.tmDebugLogger) {
              window.tmDebugLogger.log(`wheel video [UP/OTHER]. delta: ${e.deltaY}, scrollY: ${window.scrollY}. Block!`);
            }
          }
          if (e.cancelable) {
            e.preventDefault();
          }
          return;
        }
        const horizontalScrollContainer = e.target.closest(".tm-tab-scroll-container, .tm-comments-tabs");
        if (horizontalScrollContainer) {
          if (e.type === "touchmove") {
            if (e.touches && e.touches.length > 0) {
              const currentX = e.touches[0].clientX;
              const currentY = e.touches[0].clientY;
              const diffX = Math.abs(currentX - this._touchStartX);
              const diffY = Math.abs(currentY - this._touchStartY);
              if (diffY > diffX) {
                if (e.cancelable) {
                  e.preventDefault();
                }
                if (window.tmDebugLogger) {
                  window.tmDebugLogger.log(`horizontal touchmove vertical block. diffY: ${currentY - this._touchStartY}`);
                }
              } else if (window.tmDebugLogger) {
                window.tmDebugLogger.log(`horizontal touchmove allow. diffX: ${currentX - this._touchStartX}`);
              }
            }
          }
          return;
        }
        if (e.target.closest(".tm-settings-panel, .tm-settings-menu-container, .tm-settings-seek-steps-subpanel, .tm-settings-webdav-card, .tm-comment-section-body, .tm-bottom-sheet-panel, .tm-bottom-sheet-list")) {
          return;
        }
        if (e.cancelable) {
          e.preventDefault();
        }
      };
      this.clickLock = false;
      this.clickLockTimeout = null;
      this.handleCloseButtonClickBound = this.handleCloseButtonClick.bind(this);
      if (this.uiElements.closeBtn) {
        this.uiElements.closeBtn.addEventListener("click", this.handleCloseButtonClickBound);
      }
      this.handleSettingsButtonClickBound = this.handleSettingsButtonClick.bind(this);
      if (this.uiElements.settingsBtn) {
        this.uiElements.settingsBtn.addEventListener("click", this.handleSettingsButtonClickBound);
      }
      window.addEventListener("resize", this.handleWindowResizeBound);
      if (this.uiElements.container && typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(this.handleContainerResizeBound);
        this.resizeObserver.observe(this.uiElements.container);
      }
      this._toggleScrollListeners(true);
      this.initVideoEventListeners();
    }
    "_toggleScrollListeners"() {
      let add = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
      const method = add ? "addEventListener" : "removeEventListener";
      [ this.uiElements.playerContainer, this.uiElements.overlay ].forEach((el => {
        if (!el) {
          return;
        }
        el[method]("touchstart", this.handleTouchStartBound, {
          "passive": true
        });
        el[method]("touchmove", this.handleScrollPreventionBound, {
          "passive": false
        });
        el[method]("wheel", this.handleScrollPreventionBound, {
          "passive": false
        });
        el[method]("contextmenu", this.handleContextMenuBound);
      }));
    }
    "initVideoEventListeners"() {
      this.handleMetadataLoadedBound = () => {
        if (this.managers.progressManager) {
          this.managers.progressManager.updateProgressBar();
        }
        if (this.managers.loopManager) {
          this.managers.loopManager.updateLoopTimeDisplay();
          this.managers.loopManager.updateLoopMarkers();
        }
        this._notifyLayoutChanged();
      };
      this.targetVideo.addEventListener("loadedmetadata", this.handleMetadataLoadedBound);
      this.handleCanPlayBound = () => {
        if (this.managers.uiManager) {
          this.managers.uiManager.updateContainerMinHeight();
        }
        if (this.managers.swipeManager) {
          this.managers.swipeManager.updateSize();
        }
        if (this.managers.controlManager && this.managers.controlManager.commentPanel) {
          this.managers.controlManager.commentPanel.updatePosition();
        }
      };
      this.targetVideo.addEventListener("canplay", this.handleCanPlayBound);
      this.handleVideoResizeBound = () => {
        if (this.managers.uiManager) {
          this.managers.uiManager.updateContainerMinHeight();
        }
        if (this.managers.swipeManager) {
          this.managers.swipeManager.updateSize();
        }
        if (this.managers.controlManager && this.managers.controlManager.commentPanel) {
          this.managers.controlManager.commentPanel.updatePosition();
        }
      };
      this.targetVideo.addEventListener("resize", this.handleVideoResizeBound);
      this.handlePlayBound = () => {
        if (this.targetVideo) {
          this.targetVideo.setAttribute("playsinline", "true");
          this.targetVideo.setAttribute("webkit-playsinline", "true");
          this.targetVideo.setAttribute("x5-playsinline", "true");
          this.targetVideo.playsInline = true;
          this.targetVideo.webkitPlaysInline = true;
        }
        if (this.managers.controlManager) {
          this.managers.controlManager.updatePlayPauseButton();
        }
        if (this.managers.uiManager && this.managers.uiManager.isLandscape) {
          this.managers.uiManager.autoHideControls();
        }
      };
      this.targetVideo.addEventListener("play", this.handlePlayBound);
      this.handlePauseBound = () => {
        if (this.managers.controlManager) {
          this.managers.controlManager.updatePlayPauseButton();
          this.managers.controlManager.showPauseIndicator();
        }
      };
      this.targetVideo.addEventListener("pause", this.handlePauseBound);
      BlurPlaybackManager.attachPlayer(this.targetVideo, this.playerCore);
    }
    "handleCloseButtonClick"() {
      this.cleanup();
      this.playerCore.close(this.uiElements.overlay, this.uiElements.container, this.uiElements.playerContainer);
    }
    "handleSettingsButtonClick"() {
      if (this.managers.settingsManager) {
        this.managers.settingsManager.toggleSettingsPanel();
      }
    }
    "handleWindowResize"() {
      if (this.managers.uiManager) {
        this.managers.uiManager.updateContainerMinHeight();
      }
      if (this.managers.dragManager) {
        this.managers.dragManager.updateHandlePosition();
        this.managers.dragManager.restoreControlPanelPosition();
      }
      if (this.managers.swipeManager) {
        this.managers.swipeManager.updateSize();
      }
      if (this.managers.controlManager && this.managers.controlManager.commentPanel) {
        this.managers.controlManager.commentPanel.updatePosition();
      }
    }
    "_notifyLayoutChanged"() {
      var _this$managers$contro;
      if (this.managers.dragManager) {
        this.managers.dragManager.updateHandlePosition();
      }
      if (this.managers.uiManager) {
        this.managers.uiManager.updateContainerMinHeight();
      }
      if (this.managers.swipeManager) {
        this.managers.swipeManager.updateSize();
      }
      if ((_this$managers$contro = this.managers.controlManager) !== null && _this$managers$contro !== void 0 && _this$managers$contro.commentPanel) {
        this.managers.controlManager.commentPanel.updatePosition();
      }
    }
    "handleContainerResize"() {
      this._notifyLayoutChanged();
    }
    "cleanup"() {
      window.removeEventListener("resize", this.handleWindowResizeBound);
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.clickLockTimeout) {
        clearTimeout(this.clickLockTimeout);
        this.clickLockTimeout = null;
      }
      if (this.uiElements.closeBtn) {
        this.uiElements.closeBtn.removeEventListener("click", this.handleCloseButtonClickBound);
      }
      if (this.uiElements.settingsBtn) {
        this.uiElements.settingsBtn.removeEventListener("click", this.handleSettingsButtonClickBound);
      }
      if (this.targetVideo) {
        this.targetVideo.removeEventListener("loadedmetadata", this.handleMetadataLoadedBound);
        this.targetVideo.removeEventListener("canplay", this.handleCanPlayBound);
        this.targetVideo.removeEventListener("resize", this.handleVideoResizeBound);
        this.targetVideo.removeEventListener("play", this.handlePlayBound);
        this.targetVideo.removeEventListener("pause", this.handlePauseBound);
      }
      this._toggleScrollListeners(false);
      if (this.handleWindowScrollDebugBound) {
        window.removeEventListener("scroll", this.handleWindowScrollDebugBound);
      }
      if (window.tmDebugLogger) {
        window.tmDebugLogger.destroy();
        window.tmDebugLogger = null;
      }
    }
  }
  class SettingsManager {
    "constructor"(playerCore, uiElements) {
      let uiManager = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      let controlManager = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      this.playerCore = playerCore;
      this.uiManager = uiManager || (playerCore ? playerCore.uiManager : null);
      this.controlManager = controlManager || (playerCore ? playerCore.controlManager : null);
      this.targetVideo = playerCore === null || playerCore === void 0 ? void 0 : playerCore.targetVideo;
      this.uiElements = uiElements;
      this.settingsPanel = uiElements.settingsPanel;
      this.overlayClickHandler = null;
      this.settings = {
        "showProgressBar": true,
        "showSeekControlRow": true,
        "showLoopControlRow": true,
        "showPlaybackControlRow": true,
        "enabledSeekSteps": [ "5s", "10s", "30s", "1m", "5m", "10m" ],
        "showCommentsSection": true,
        "enabledCommentSources": {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        },
        "telemetryEnabled": false,
        "debugMode": false,
        "pauseOnBlur": true,
        "buttonSoundEnabled": true
      };
      this.showCustomSeekStepsPanel = false;
    }
    "setManagers"() {
      let managers = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (managers.uiManager) {
        this.uiManager = managers.uiManager;
      }
      if (managers.controlManager) {
        this.controlManager = managers.controlManager;
      }
    }
    "init"() {
      this.loadSettings();
      this.updateControlRowsVisibility();
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback((() => {
          if (!this.settingsPanel || !this.settingsPanel.children.length) {
            this.createSettingsPanel();
          }
        }), {
          "timeout": 4e3
        });
      } else {
        setTimeout((() => {
          if (!this.settingsPanel || !this.settingsPanel.children.length) {
            this.createSettingsPanel();
          }
        }), 600);
      }
      return this;
    }
    "syncState"() {
      var _this$playerCore;
      const state = (_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 || (_this$playerCore = _this$playerCore.options) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.playerState;
      if (state && state.settings) {
        this.settings = state.settings;
      } else {
        this.loadSettings();
      }
    }
    "createSettingsPanel"() {
      if (!this.settingsPanel) {
        return;
      }
      this.syncState();
      this.settingsPanel.innerHTML = "";
      const container = document.createElement("div");
      container.className = "tm-settings-menu-container";
      const stopProp = e => e.stopPropagation();
      container.addEventListener("click", stopProp);
      container.addEventListener("mousedown", stopProp);
      container.addEventListener("touchstart", stopProp);
      const section1 = this._createSectionHeader("遥控器 :");
      const progressBarOption = this._createToggleOption("进度条栏", "showProgressBar", this.settings.showProgressBar, (checked => {
        this.updateSetting("showProgressBar", checked);
        this.updateControlRowsVisibility();
      }));
      const seekControlContainer = document.createElement("div");
      seekControlContainer.className = "tm-settings-seek-wrapper";
      const seekControlOption = this._createToggleOption("快进/快退栏", "showSeekControlRow", this.settings.showSeekControlRow, (checked => {
        this.updateSetting("showSeekControlRow", checked);
        this.updateControlRowsVisibility();
        this.createSettingsPanel();
      }));
      seekControlContainer.appendChild(seekControlOption);
      if (this.settings.showSeekControlRow) {
        const seekStepsSubPanel = this._createSeekStepsSubPanel();
        seekControlContainer.appendChild(seekStepsSubPanel);
      }
      const loopControlOption = this._createToggleOption("跳转/循环栏", "showLoopControlRow", this.settings.showLoopControlRow, (checked => {
        this.updateSetting("showLoopControlRow", checked);
        this.updateControlRowsVisibility();
      }));
      section1.appendChild(progressBarOption);
      section1.appendChild(seekControlContainer);
      section1.appendChild(loopControlOption);
      container.appendChild(section1);
      const section2 = this._createSectionHeader("评论区 :");
      const commentsOptionContainer = document.createElement("div");
      commentsOptionContainer.className = "tm-settings-comments-wrapper";
      const commentsToggleOption = this._createToggleOption("是否展示评论区", "showCommentsSection", this.settings.showCommentsSection, (checked => {
        var _this$controlManager;
        this.updateSetting("showCommentsSection", checked);
        if (checked) {
          this.updateSetting("sidebarHidden", false);
          if (this.uiManager) {
            this.uiManager.isSidebarHidden = false;
            this.uiManager.updateSidebarToggleButtonIcon();
          }
        }
        if ((_this$controlManager = this.controlManager) !== null && _this$controlManager !== void 0 && _this$controlManager.commentPanel) {
          this.controlManager.commentPanel.updateCommentsVisibility(checked);
        }
        this.createSettingsPanel();
      }));
      commentsOptionContainer.appendChild(commentsToggleOption);
      if (this.settings.showCommentsSection) {
        const sourcesSubPanel = this._createCommentSourcesSubPanel();
        commentsOptionContainer.appendChild(sourcesSubPanel);
      }
      section2.appendChild(commentsOptionContainer);
      container.appendChild(section2);
      const section3 = this._createSectionHeader("其他 :");
      const telemetryOption = this._createToggleOption(__("helpImprove") || "帮助改进", "telemetryEnabled", this.settings.telemetryEnabled !== false, (checked => {
        this.updateSetting("telemetryEnabled", checked);
        if (checked) {
          telemetry.flush(true, true);
        }
      }), null, __("helpImproveDesc") || "收集必要数据用于改进功能");
      const debugOption = this._createToggleOption("DEBUG", "debugMode", this.settings.debugMode, (checked => {
        var _this$controlManager2;
        this.updateSetting("debugMode", checked);
        if ((_this$controlManager2 = this.controlManager) !== null && _this$controlManager2 !== void 0 && _this$controlManager2.commentPanel) {
          this.controlManager.commentPanel.updateDebugMode(checked);
        }
      }));
      const pauseOnBlurOption = this._createToggleOption(__("pauseOnBlur") || "失焦后停止播放", "pauseOnBlur", this.settings.pauseOnBlur !== false, (checked => {
        this.updateSetting("pauseOnBlur", checked);
      }), null, __("pauseOnBlurDesc") || "页面离开或失去焦点时自动暂停播放");
      const buttonSoundOption = this._createToggleOption(__("buttonSound") || "按键点击音效", "buttonSoundEnabled", this.settings.buttonSoundEnabled !== false, (checked => {
        this.updateSetting("buttonSoundEnabled", checked);
        if (checked) {
          playTapSound(true);
        }
      }), null, __("buttonSoundDesc") || "点击控制面板按钮时播放清脆触控反馈音效");
      section3.appendChild(pauseOnBlurOption);
      section3.appendChild(buttonSoundOption);
      section3.appendChild(debugOption);
      container.appendChild(section3);
      const webdavConfig = SyncManager.getWebDavConfig();
      const hasWebdavConfig = Boolean(webdavConfig.url);
      const lastSync = SyncManager.getLastSyncTime();
      const statusSummary = hasWebdavConfig ? lastSync > 0 ? ` (已配置)` : ` (未同步)` : ` (点击展开)`;
      const section4 = document.createElement("div");
      section4.className = "tm-settings-section";
      const header4 = this._createSectionHeader((__("webdavTitle") || "云端同步 (WebDAV) :") + statusSummary, true, this.isWebDavExpanded || false, (expanded => {
        this.isWebDavExpanded = expanded;
        if (webdavCard) {
          webdavCard.style.display = expanded ? "flex" : "none";
        }
      }));
      const webdavCard = this._createWebDavSyncCard();
      webdavCard.style.display = this.isWebDavExpanded ? "flex" : "none";
      section4.appendChild(header4);
      section4.appendChild(webdavCard);
      container.appendChild(section4);
      this.settingsPanel.appendChild(container);
    }
    "_createSectionHeader"(titleText) {
      let collapsible = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      let isExpanded = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
      let onToggle = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      const sectionHeaderWrap = document.createElement("div");
      sectionHeaderWrap.className = "tm-settings-section-header-wrap";
      const header = document.createElement("div");
      header.className = `tm-settings-section-header ${collapsible ? "collapsible" : ""}`;
      const titleSpan = document.createElement("span");
      titleSpan.textContent = titleText;
      header.appendChild(titleSpan);
      if (collapsible) {
        const arrowSpan = document.createElement("span");
        arrowSpan.className = `tm-settings-header-arrow ${isExpanded ? "expanded" : ""}`;
        arrowSpan.textContent = "▼";
        header.appendChild(arrowSpan);
        header.addEventListener("click", (() => {
          const willExpand = !arrowSpan.classList.contains("expanded");
          if (willExpand) {
            arrowSpan.classList.add("expanded");
          } else {
            arrowSpan.classList.remove("expanded");
          }
          if (typeof onToggle === "function") {
            onToggle(willExpand);
          }
        }));
      }
      const divider = document.createElement("div");
      divider.className = "tm-settings-section-divider";
      sectionHeaderWrap.appendChild(header);
      sectionHeaderWrap.appendChild(divider);
      return sectionHeaderWrap;
    }
    "_createWebDavSyncCard"() {
      var _this = this;
      const card = document.createElement("div");
      card.className = "tm-settings-webdav-card";
      const config = SyncManager.getWebDavConfig();
      const clientId = getOrCreateClientId();
      const deviceName = getDeviceName();
      const urlRow = document.createElement("div");
      urlRow.className = "tm-webdav-form-row";
      const urlLabel = document.createElement("label");
      urlLabel.className = "tm-webdav-label";
      urlLabel.textContent = __("webdavServerUrl") || "服务器地址";
      const urlInput = document.createElement("input");
      urlInput.className = "tm-webdav-input";
      urlInput.type = "text";
      urlInput.placeholder = "https://dav.jianguoyun.com/dav/";
      urlInput.value = config.url || "";
      urlInput.addEventListener("change", (() => {
        config.url = urlInput.value.trim();
        SyncManager.saveWebDavConfig(config);
      }));
      urlRow.appendChild(urlLabel);
      urlRow.appendChild(urlInput);
      const userRow = document.createElement("div");
      userRow.className = "tm-webdav-form-row";
      const userLabel = document.createElement("label");
      userLabel.className = "tm-webdav-label";
      userLabel.textContent = __("webdavUsername") || "用户名";
      const userInput = document.createElement("input");
      userInput.className = "tm-webdav-input";
      userInput.type = "text";
      userInput.placeholder = "username@example.com";
      userInput.value = config.user || "";
      userInput.addEventListener("change", (() => {
        config.user = userInput.value.trim();
        SyncManager.saveWebDavConfig(config);
      }));
      userRow.appendChild(userLabel);
      userRow.appendChild(userInput);
      const passRow = document.createElement("div");
      passRow.className = "tm-webdav-form-row";
      const passLabel = document.createElement("label");
      passLabel.className = "tm-webdav-label";
      passLabel.textContent = __("webdavPassword") || "密码 / 应用授权码";
      const passInputGroup = document.createElement("div");
      passInputGroup.className = "tm-webdav-input-group";
      const passInput = document.createElement("input");
      passInput.className = "tm-webdav-input has-eye";
      passInput.type = "password";
      passInput.placeholder = "••••••••••••";
      passInput.value = config.pass || "";
      passInput.addEventListener("change", (() => {
        config.pass = passInput.value;
        SyncManager.saveWebDavConfig(config);
      }));
      const eyeBtn = document.createElement("button");
      eyeBtn.className = "tm-webdav-eye-btn";
      eyeBtn.type = "button";
      eyeBtn.innerHTML = ICON_EYE;
      eyeBtn.title = "切换密码可见性";
      eyeBtn.addEventListener("click", (() => {
        if (passInput.type === "password") {
          passInput.type = "text";
          eyeBtn.innerHTML = ICON_EYE_OFF;
        } else {
          passInput.type = "password";
          eyeBtn.innerHTML = ICON_EYE;
        }
      }));
      passInputGroup.appendChild(passInput);
      passInputGroup.appendChild(eyeBtn);
      passRow.appendChild(passLabel);
      passRow.appendChild(passInputGroup);
      const pathRow = document.createElement("div");
      pathRow.className = "tm-webdav-form-row";
      const pathLabel = document.createElement("label");
      pathLabel.className = "tm-webdav-label";
      pathLabel.textContent = __("webdavBackupPath") || "备份目录路径";
      const pathInput = document.createElement("input");
      pathInput.className = "tm-webdav-input";
      pathInput.type = "text";
      pathInput.placeholder = "/MissPlayer/";
      pathInput.value = config.path || "/MissPlayer/";
      pathInput.addEventListener("change", (() => {
        config.path = pathInput.value.trim() || "/MissPlayer/";
        SyncManager.saveWebDavConfig(config);
      }));
      pathRow.appendChild(pathLabel);
      pathRow.appendChild(pathInput);
      const autoSyncRow = document.createElement("div");
      autoSyncRow.className = "tm-webdav-switch-row";
      const autoSyncInfo = document.createElement("div");
      autoSyncInfo.className = "tm-webdav-switch-info";
      const autoSyncTitle = document.createElement("span");
      autoSyncTitle.className = "tm-webdav-switch-title";
      autoSyncTitle.textContent = __("webdavAutoSync") || "自动同步";
      const autoSyncDesc = document.createElement("span");
      autoSyncDesc.className = "tm-webdav-switch-desc";
      autoSyncDesc.textContent = __("webdavAutoSyncDesc") || "启动及打点修改时自动在后台静默合并";
      autoSyncInfo.appendChild(autoSyncTitle);
      autoSyncInfo.appendChild(autoSyncDesc);
      const autoSyncSwitch = document.createElement("label");
      autoSyncSwitch.className = "tm-switch";
      const autoSyncCheckbox = document.createElement("input");
      autoSyncCheckbox.type = "checkbox";
      autoSyncCheckbox.checked = config.autoSync !== false;
      autoSyncCheckbox.addEventListener("change", (() => {
        config.autoSync = autoSyncCheckbox.checked;
        SyncManager.saveWebDavConfig(config);
        if (config.autoSync && config.url) {
          var _this$playerCore2;
          SyncManager.triggerAutoSync((_this$playerCore2 = this.playerCore) === null || _this$playerCore2 === void 0 || (_this$playerCore2 = _this$playerCore2.options) === null || _this$playerCore2 === void 0 ? void 0 : _this$playerCore2.playerState, "startup");
        }
      }));
      const autoSyncSlider = document.createElement("span");
      autoSyncSlider.className = "tm-slider round";
      autoSyncSwitch.appendChild(autoSyncCheckbox);
      autoSyncSwitch.appendChild(autoSyncSlider);
      autoSyncRow.appendChild(autoSyncInfo);
      autoSyncRow.appendChild(autoSyncSwitch);
      const deviceBadge = document.createElement("div");
      deviceBadge.className = "tm-webdav-device-badge";
      deviceBadge.innerHTML = `${ICON_SERVER} <span>${__("webdavCurrentDevice") || "当前设备"}: ${deviceName} (${clientId.slice(-6)})</span>`;
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "tm-webdav-actions-container";
      const syncMergeBtn = document.createElement("button");
      syncMergeBtn.className = "tm-webdav-btn tm-webdav-btn-primary";
      syncMergeBtn.innerHTML = `${ICON_CLOUD_SYNC} <span>${__("webdavSyncMerge") || "智能合并同步"}</span>`;
      const subActions = document.createElement("div");
      subActions.className = "tm-webdav-sub-actions";
      const testBtn = document.createElement("button");
      testBtn.className = "tm-webdav-btn tm-webdav-btn-secondary";
      testBtn.title = "测试 WebDAV 服务器连通性并创建目录";
      testBtn.innerHTML = `${ICON_CHECK} <span>${__("webdavTestConnection") || "测试连接"}</span>`;
      const uploadBtn = document.createElement("button");
      uploadBtn.className = "tm-webdav-btn tm-webdav-btn-secondary";
      uploadBtn.title = "将当前本地配置与打点覆盖到云端";
      uploadBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>${__("webdavUploadOverwrite") || "上传覆盖"}</span>`;
      const downloadBtn = document.createElement("button");
      downloadBtn.className = "tm-webdav-btn tm-webdav-btn-secondary";
      downloadBtn.title = "从云端拉取配置覆盖当前设备";
      downloadBtn.innerHTML = `${ICON_CLOUD_DOWNLOAD} <span>${__("webdavDownloadOverwrite") || "下载覆盖"}</span>`;
      subActions.appendChild(testBtn);
      subActions.appendChild(uploadBtn);
      subActions.appendChild(downloadBtn);
      actionsContainer.appendChild(syncMergeBtn);
      actionsContainer.appendChild(subActions);
      const statusBar = document.createElement("div");
      statusBar.className = "tm-webdav-status-bar";
      const timeSpan = document.createElement("span");
      const renderTimeText = () => {
        const lastSyncTime = SyncManager.getLastSyncTime();
        const timeText = lastSyncTime > 0 ? new Date(lastSyncTime).toLocaleString() : __("webdavNeverSynced") || "尚未同步";
        timeSpan.textContent = `${__("webdavLastSync") || "上次同步"}: ${timeText}`;
      };
      renderTimeText();
      const statusBadge = document.createElement("span");
      statusBadge.className = "tm-webdav-status-badge";
      statusBadge.style.display = "none";
      statusBar.appendChild(timeSpan);
      statusBar.appendChild(statusBadge);
      const persistCurrentInputs = () => {
        config.url = urlInput.value.trim();
        config.user = userInput.value.trim();
        config.pass = passInput.value;
        config.path = pathInput.value.trim() || "/MissPlayer/";
        SyncManager.saveWebDavConfig(config);
        return config;
      };
      const updateStatus = function(text) {
        let type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "success";
        _this._lastWebDavStatus = {
          "text": text,
          "type": type,
          "time": Date.now()
        };
        statusBadge.style.display = "inline-flex";
        statusBadge.className = `tm-webdav-status-badge ${type}`;
        if (type === "running") {
          statusBadge.innerHTML = `<span class="tm-spinner-sm"></span> <span>${text}</span>`;
        } else if (type === "success") {
          statusBadge.innerHTML = `<span>✓</span> <span>${text}</span>`;
        } else if (type === "error") {
          statusBadge.innerHTML = `<span>✕</span> <span>${text}</span>`;
        } else {
          statusBadge.textContent = text;
        }
      };
      if (this._lastWebDavStatus && Date.now() - this._lastWebDavStatus.time < 5 * 60 * 1e3) {
        updateStatus(this._lastWebDavStatus.text, this._lastWebDavStatus.type);
      }
      const setButtonsDisabled = disabled => {
        [ syncMergeBtn, testBtn, uploadBtn, downloadBtn ].forEach((b => {
          b.disabled = disabled;
        }));
      };
      testBtn.addEventListener("click", (async () => {
        const currentCfg = persistCurrentInputs();
        if (!currentCfg.url) {
          Toast.show(__("webdavTestFailed") || "请输入 WebDAV 服务器地址", 2500);
          updateStatus("请输入服务器地址", "error");
          return;
        }
        setButtonsDisabled(true);
        testBtn.innerHTML = `<span>${__("webdavTesting") || "正在测试..."}</span>`;
        updateStatus("正在测试连接...", "running");
        try {
          const res = await WebDavClient.testConnection(currentCfg);
          Toast.show(res.message || "连接成功！", 3e3);
          updateStatus("连接正常", "success");
        } catch (err) {
          Toast.show((__("webdavTestFailed") || "连接失败: ") + err.message, 4e3);
          updateStatus(err.message ? `连接失败: ${err.message}` : "连接失败", "error");
        } finally {
          testBtn.innerHTML = `${ICON_CHECK} <span>${__("webdavTestConnection") || "测试连接"}</span>`;
          setButtonsDisabled(false);
        }
      }));
      syncMergeBtn.addEventListener("click", (async () => {
        const currentCfg = persistCurrentInputs();
        if (!currentCfg.url) {
          Toast.show(__("webdavTestFailed") || "请输入 WebDAV 服务器地址", 2500);
          updateStatus("请输入服务器地址", "error");
          return;
        }
        setButtonsDisabled(true);
        syncMergeBtn.innerHTML = `<span>${__("webdavSyncing") || "正在同步..."}</span>`;
        updateStatus("正在智能合并同步...", "running");
        try {
          var _this$playerCore3;
          const res = await SyncManager.executeSync({
            "mode": "merge",
            "config": currentCfg,
            "playerState": (_this$playerCore3 = this.playerCore) === null || _this$playerCore3 === void 0 || (_this$playerCore3 = _this$playerCore3.options) === null || _this$playerCore3 === void 0 ? void 0 : _this$playerCore3.playerState
          });
          Toast.show(res.message || "云端多端合并同步成功！", 3e3);
          this._lastWebDavStatus = {
            "text": "同步成功",
            "type": "success",
            "time": Date.now()
          };
          this.createSettingsPanel();
        } catch (err) {
          Toast.show((__("webdavSyncFailed") || "同步失败: ") + err.message, 4500);
          updateStatus(err.message ? `同步失败: ${err.message}` : "同步失败", "error");
          syncMergeBtn.innerHTML = `${ICON_CLOUD_SYNC} <span>${__("webdavSyncMerge") || "智能合并同步"}</span>`;
          setButtonsDisabled(false);
        }
      }));
      uploadBtn.addEventListener("click", (async () => {
        const currentCfg = persistCurrentInputs();
        if (!currentCfg.url) {
          Toast.show(__("webdavTestFailed") || "请输入 WebDAV 服务器地址", 2500);
          updateStatus("请输入服务器地址", "error");
          return;
        }
        if (!window.confirm(__("webdavConfirmUpload") || "确定要将当前本地配置强制覆盖到云端吗？")) {
          return;
        }
        setButtonsDisabled(true);
        uploadBtn.innerHTML = `<span>${__("webdavSyncing") || "正在上传..."}</span>`;
        updateStatus("正在上传覆盖云端...", "running");
        try {
          var _this$playerCore4;
          const res = await SyncManager.executeSync({
            "mode": "upload",
            "config": currentCfg,
            "playerState": (_this$playerCore4 = this.playerCore) === null || _this$playerCore4 === void 0 || (_this$playerCore4 = _this$playerCore4.options) === null || _this$playerCore4 === void 0 ? void 0 : _this$playerCore4.playerState
          });
          Toast.show(res.message || "已成功覆盖云端备份！", 3e3);
          updateStatus("已上传覆盖", "success");
          renderTimeText();
        } catch (err) {
          Toast.show((__("webdavSyncFailed") || "上传失败: ") + err.message, 4500);
          updateStatus(err.message ? `上传失败: ${err.message}` : "上传失败", "error");
        } finally {
          uploadBtn.innerHTML = `${ICON_CLOUD_UPLOAD} <span>${__("webdavUploadOverwrite") || "上传覆盖"}</span>`;
          setButtonsDisabled(false);
        }
      }));
      downloadBtn.addEventListener("click", (async () => {
        const currentCfg = persistCurrentInputs();
        if (!currentCfg.url) {
          Toast.show(__("webdavTestFailed") || "请输入 WebDAV 服务器地址", 2500);
          updateStatus("请输入服务器地址", "error");
          return;
        }
        if (!window.confirm(__("webdavConfirmDownload") || "确定要从云端拉取配置并覆盖本地吗？")) {
          return;
        }
        setButtonsDisabled(true);
        downloadBtn.innerHTML = `<span>${__("webdavSyncing") || "正在下载..."}</span>`;
        updateStatus("正在从云端拉取覆盖...", "running");
        try {
          var _this$playerCore5;
          const res = await SyncManager.executeSync({
            "mode": "download",
            "config": currentCfg,
            "playerState": (_this$playerCore5 = this.playerCore) === null || _this$playerCore5 === void 0 || (_this$playerCore5 = _this$playerCore5.options) === null || _this$playerCore5 === void 0 ? void 0 : _this$playerCore5.playerState
          });
          Toast.show(res.message || "已成功从云端覆盖本地！", 3e3);
          this._lastWebDavStatus = {
            "text": "已下载覆盖",
            "type": "success",
            "time": Date.now()
          };
          this.createSettingsPanel();
        } catch (err) {
          Toast.show((__("webdavSyncFailed") || "下载失败: ") + err.message, 4500);
          updateStatus(err.message ? `下载失败: ${err.message}` : "下载失败", "error");
          downloadBtn.innerHTML = `${ICON_CLOUD_DOWNLOAD} <span>${__("webdavDownloadOverwrite") || "下载覆盖"}</span>`;
          setButtonsDisabled(false);
        }
      }));
      card.appendChild(urlRow);
      card.appendChild(userRow);
      card.appendChild(passRow);
      card.appendChild(pathRow);
      card.appendChild(autoSyncRow);
      card.appendChild(deviceBadge);
      card.appendChild(actionsContainer);
      card.appendChild(statusBar);
      return card;
    }
    "_createToggleOption"(labelText, settingKey, initialValue, onChange) {
      let extraElement = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
      let subText = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : null;
      const row = document.createElement("div");
      row.className = "tm-settings-option-row";
      row.id = `tm-setting-${settingKey}`;
      const labelWrapper = document.createElement("div");
      labelWrapper.className = "tm-settings-label-wrapper";
      const textWrapper = document.createElement("div");
      textWrapper.className = "tm-settings-text-wrapper";
      const label = document.createElement("span");
      label.className = "tm-settings-label";
      label.textContent = labelText;
      textWrapper.appendChild(label);
      if (subText) {
        const sub = document.createElement("span");
        sub.className = "tm-settings-subtext";
        sub.textContent = subText;
        textWrapper.appendChild(sub);
      }
      labelWrapper.appendChild(textWrapper);
      if (extraElement) {
        labelWrapper.appendChild(extraElement);
      }
      const toggleContainer = document.createElement("div");
      toggleContainer.className = "tm-toggle-switch";
      toggleContainer.style.pointerEvents = "none";
      const isChecked = Boolean(initialValue);
      const toggleInput = document.createElement("input");
      toggleInput.type = "checkbox";
      toggleInput.checked = isChecked;
      toggleInput.className = "tm-toggle-input";
      const toggleSlider = document.createElement("span");
      toggleSlider.className = isChecked ? "tm-toggle-slider checked" : "tm-toggle-slider";
      toggleContainer.appendChild(toggleInput);
      toggleContainer.appendChild(toggleSlider);
      const toggleSwitch = e => {
        e.preventDefault();
        e.stopPropagation();
        const nextChecked = !toggleInput.checked;
        toggleInput.checked = nextChecked;
        toggleSlider.className = nextChecked ? "tm-toggle-slider checked" : "tm-toggle-slider";
        if (typeof onChange === "function") {
          onChange(nextChecked);
        }
      };
      row.addEventListener("click", toggleSwitch);
      row.appendChild(labelWrapper);
      row.appendChild(toggleContainer);
      return row;
    }
    "_createSeekStepsSubPanel"() {
      const subPanel = document.createElement("div");
      subPanel.className = "tm-settings-seek-steps-subpanel";
      subPanel.addEventListener("wheel", (e => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          subPanel.scrollLeft += e.deltaY;
        }
      }), {
        "passive": false
      });
      const defaultSteps = [ "5s", "10s", "30s", "1m", "5m", "10m" ];
      const customSteps = Array.isArray(this.settings.customUserSeekSteps) ? this.settings.customUserSeekSteps : [];
      const enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? this.settings.enabledSeekSteps : [ "5s", "10s", "30s", "1m", "5m", "10m" ];
      const allDisplaySteps = [ ...defaultSteps ];
      customSteps.forEach((step => {
        if (!allDisplaySteps.includes(step)) {
          allDisplaySteps.push(step);
        }
      }));
      allDisplaySteps.forEach((stepKey => {
        const isDefault = defaultSteps.includes(stepKey);
        const isEnabled = enabledSteps.includes(stepKey);
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = `tm-seek-step-badge${isEnabled ? " enabled" : " disabled"}`;
        badge.textContent = stepKey;
        let isLongPressTriggered = false;
        let longPressTimer = null;
        const startLongPress = e => {
          isLongPressTriggered = false;
          longPressTimer = setTimeout((() => {
            isLongPressTriggered = true;
            if (isDefault) {
              Toast("默认 6 个预设步进不支持删除", 2e3, "warning");
            } else {
              this._deleteCustomSeekStep(stepKey);
            }
          }), 600);
        };
        const cancelLongPress = () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        };
        badge.addEventListener("mousedown", startLongPress);
        badge.addEventListener("mouseup", cancelLongPress);
        badge.addEventListener("mouseleave", cancelLongPress);
        badge.addEventListener("touchstart", startLongPress, {
          "passive": true
        });
        badge.addEventListener("touchend", cancelLongPress);
        badge.addEventListener("touchcancel", cancelLongPress);
        badge.addEventListener("click", (e => {
          e.stopPropagation();
          if (isLongPressTriggered) {
            return;
          }
          let steps = [ ...enabledSteps ];
          if (isEnabled) {
            steps = steps.filter((s => s !== stepKey));
          } else {
            steps.push(stepKey);
          }
          this.updateSetting("enabledSeekSteps", steps);
          this.rebuildControlPanelSeekRow();
          this.createSettingsPanel();
        }));
        subPanel.appendChild(badge);
      }));
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "tm-seek-step-add-btn";
      addBtn.textContent = "+";
      addBtn.addEventListener("click", (e => {
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "text";
        input.className = "tm-seek-step-input";
        input.placeholder = "_s / _m";
        let isSubmitted = false;
        const submitValue = () => {
          if (isSubmitted) {
            return;
          }
          isSubmitted = true;
          const rawVal = input.value.trim().toLowerCase();
          if (!rawVal) {
            this.createSettingsPanel();
            return;
          }
          if (!/^\d+[sm]$/.test(rawVal)) {
            Toast("格式错误，请填写如 15s 或 2m", 2500, "warning");
            this.createSettingsPanel();
            return;
          }
          this._addCustomSeekStep(rawVal);
        };
        input.addEventListener("keydown", (evt => {
          if (evt.key === "Enter") {
            evt.preventDefault();
            submitValue();
          } else if (evt.key === "Escape") {
            isSubmitted = true;
            this.createSettingsPanel();
          }
        }));
        input.addEventListener("blur", (() => {
          submitValue();
        }));
        subPanel.replaceChild(input, addBtn);
        input.focus();
      }));
      subPanel.appendChild(addBtn);
      return subPanel;
    }
    "_addCustomSeekStep"(newStep) {
      let customSteps = Array.isArray(this.settings.customUserSeekSteps) ? [ ...this.settings.customUserSeekSteps ] : [];
      let enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? [ ...this.settings.enabledSeekSteps ] : [];
      if (!customSteps.includes(newStep)) {
        customSteps.push(newStep);
      }
      if (!enabledSteps.includes(newStep)) {
        enabledSteps.push(newStep);
      }
      SyncManager.clearTombstone("customSeekSteps", newStep);
      this.updateSetting("customUserSeekSteps", customSteps);
      this.updateSetting("enabledSeekSteps", enabledSteps);
      this.rebuildControlPanelSeekRow();
      this.createSettingsPanel();
      Toast(`已添加自定义步进 ${newStep}`, 2e3, "success");
    }
    "_deleteCustomSeekStep"(targetStep) {
      let customSteps = Array.isArray(this.settings.customUserSeekSteps) ? [ ...this.settings.customUserSeekSteps ] : [];
      let enabledSteps = Array.isArray(this.settings.enabledSeekSteps) ? [ ...this.settings.enabledSeekSteps ] : [];
      customSteps = customSteps.filter((s => s !== targetStep));
      enabledSteps = enabledSteps.filter((s => s !== targetStep));
      SyncManager.recordTombstone("customSeekSteps", targetStep);
      this.updateSetting("customUserSeekSteps", customSteps);
      this.updateSetting("enabledSeekSteps", enabledSteps);
      this.rebuildControlPanelSeekRow();
      this.createSettingsPanel();
      Toast(`已删除自定义步进 ${targetStep}`, 2e3, "info");
    }
    "rebuildControlPanelSeekRow"() {
      const controlManager = this.controlManager;
      if (!controlManager || !controlManager.controlButtonsContainer || !controlManager.seekController) {
        return;
      }
      const oldSeekRow = controlManager.controlButtonsContainer.querySelector(".tm-seek-control-row");
      const newSeekRow = controlManager.seekController.createSeekControlRow();
      if (oldSeekRow && oldSeekRow.parentNode) {
        oldSeekRow.parentNode.replaceChild(newSeekRow, oldSeekRow);
      }
      this.updateControlRowsVisibility();
    }
    "_createCommentSourcesSubPanel"() {
      const subPanel = document.createElement("div");
      subPanel.className = "tm-settings-sources-subpanel";
      const sources = [ {
        "key": "jable",
        "name": "Jable"
      }, {
        "key": "javdb",
        "name": "JavDB"
      }, {
        "key": "javlibrary",
        "name": "Javlibrary"
      } ];
      const enabledSources = this.settings.enabledCommentSources || {
        "jable": true,
        "javdb": true,
        "javlibrary": false
      };
      sources.forEach((source => {
        const isEnabled = !!enabledSources[source.key];
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = `tm-source-badge${isEnabled ? " enabled" : " disabled"}`;
        badge.textContent = source.name;
        badge.addEventListener("click", (e => {
          var _this$controlManager3;
          e.stopPropagation();
          const nextSources = {
            ...this.settings.enabledCommentSources
          };
          nextSources[source.key] = !isEnabled;
          this.updateSetting("enabledCommentSources", nextSources);
          if ((_this$controlManager3 = this.controlManager) !== null && _this$controlManager3 !== void 0 && _this$controlManager3.commentPanel) {
            this.controlManager.commentPanel.updateCommentSources();
          }
          this.createSettingsPanel();
        }));
        subPanel.appendChild(badge);
      }));
      return subPanel;
    }
    "toggleSettingsPanel"() {
      if (!this.settingsPanel) {
        return;
      }
      const isVisible = this.settingsPanel.classList.contains("active");
      if (isVisible) {
        this.closeSettingsPanel();
      } else {
        var _this$uiElements;
        this.syncState();
        this.createSettingsPanel();
        this.settingsPanel.classList.add("active");
        document.body.classList.add("tm-settings-active");
        (_this$uiElements = this.uiElements) === null || _this$uiElements === void 0 || (_this$uiElements = _this$uiElements.playerContainer) === null || _this$uiElements === void 0 || _this$uiElements.classList.add("tm-settings-active");
        this.overlayClickHandler = e => {
          var _this$uiElements2, _this$uiElements3;
          if (!this.settingsPanel.contains(e.target) && !((_this$uiElements2 = this.uiElements) !== null && _this$uiElements2 !== void 0 && (_this$uiElements2 = _this$uiElements2.settingsBtn) !== null && _this$uiElements2 !== void 0 && _this$uiElements2.contains(e.target)) && e.target !== ((_this$uiElements3 = this.uiElements) === null || _this$uiElements3 === void 0 ? void 0 : _this$uiElements3.settingsBtn)) {
            this.closeSettingsPanel();
          }
        };
        setTimeout((() => {
          document.addEventListener("click", this.overlayClickHandler);
          document.addEventListener("touchstart", this.overlayClickHandler, {
            "passive": true
          });
        }), 50);
      }
    }
    "closeSettingsPanel"() {
      var _this$uiElements4;
      if (!this.settingsPanel) {
        return;
      }
      this.settingsPanel.classList.remove("active");
      document.body.classList.remove("tm-settings-active");
      (_this$uiElements4 = this.uiElements) === null || _this$uiElements4 === void 0 || (_this$uiElements4 = _this$uiElements4.playerContainer) === null || _this$uiElements4 === void 0 || _this$uiElements4.classList.remove("tm-settings-active");
      if (this.overlayClickHandler) {
        document.removeEventListener("click", this.overlayClickHandler);
        document.removeEventListener("touchstart", this.overlayClickHandler);
        this.overlayClickHandler = null;
      }
    }
    "loadSettings"() {
      var _this$playerCore6;
      const state = (_this$playerCore6 = this.playerCore) === null || _this$playerCore6 === void 0 || (_this$playerCore6 = _this$playerCore6.options) === null || _this$playerCore6 === void 0 ? void 0 : _this$playerCore6.playerState;
      if (state) {
        state.loadSettings();
        this.settings = state.settings;
      } else {
        const getBool = (key, def) => {
          const v = getValue(key, def);
          return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : def;
        };
        this.settings.showProgressBar = getBool("showProgressBar", true);
        this.settings.showSeekControlRow = getBool("showSeekControlRow", true);
        this.settings.showLoopControlRow = getBool("showLoopControlRow", true);
        this.settings.showPlaybackControlRow = getBool("showPlaybackControlRow", true);
        const rawSeekSteps = getValue("enabledSeekSteps", null);
        this.settings.enabledSeekSteps = Array.isArray(rawSeekSteps) && rawSeekSteps.length > 0 ? rawSeekSteps : [ "5s", "10s", "30s", "1m", "5m", "10m" ];
        const rawCustomSteps = getValue("customUserSeekSteps", null);
        this.settings.customUserSeekSteps = Array.isArray(rawCustomSteps) ? rawCustomSteps : [];
        this.settings.showCommentsSection = getBool("showCommentsSection", true);
        const rawSources = getValue("enabledCommentSources", null);
        this.settings.enabledCommentSources = Object.assign({
          "jable": true,
          "javdb": true,
          "javlibrary": false
        }, rawSources && typeof rawSources === "object" ? rawSources : {});
        this.settings.telemetryEnabled = false;
        this.settings.debugMode = getBool("debugMode", false);
        this.settings.pauseOnBlur = getBool("pauseOnBlur", true);
        this.settings.buttonSoundEnabled = getBool("buttonSoundEnabled", true);
      }
    }
    "saveSettings"() {
      var _this$playerCore7;
      const state = (_this$playerCore7 = this.playerCore) === null || _this$playerCore7 === void 0 || (_this$playerCore7 = _this$playerCore7.options) === null || _this$playerCore7 === void 0 ? void 0 : _this$playerCore7.playerState;
      if (state) {
        state.saveSettings();
      } else {
        setValue("showProgressBar", this.settings.showProgressBar);
        setValue("showSeekControlRow", this.settings.showSeekControlRow);
        setValue("showLoopControlRow", this.settings.showLoopControlRow);
        setValue("showPlaybackControlRow", this.settings.showPlaybackControlRow);
        setValue("enabledSeekSteps", this.settings.enabledSeekSteps);
        setValue("showCommentsSection", this.settings.showCommentsSection);
        setValue("enabledCommentSources", this.settings.enabledCommentSources);
        setValue("telemetryEnabled", false);
        setValue("debugMode", this.settings.debugMode);
        setValue("pauseOnBlur", this.settings.pauseOnBlur);
        setValue("buttonSoundEnabled", this.settings.buttonSoundEnabled);
      }
    }
    "updateControlRowsVisibility"() {
      const controlButtonsContainer = document.querySelector(".tm-control-buttons");
      if (!controlButtonsContainer) {
        return;
      }
      const seekControlRow = controlButtonsContainer.querySelector(".tm-seek-control-row");
      const loopControlRow = controlButtonsContainer.querySelector(".tm-loop-control-row");
      const playbackControlRow = controlButtonsContainer.querySelector(".tm-playback-control-row");
      const progressRow = controlButtonsContainer.querySelector(".tm-progress-row");
      if (progressRow) {
        progressRow.style.display = this.settings.showProgressBar ? "flex" : "none";
      }
      if (seekControlRow) {
        seekControlRow.style.display = this.settings.showSeekControlRow ? "flex" : "none";
      }
      if (loopControlRow) {
        loopControlRow.style.display = this.settings.showLoopControlRow ? "flex" : "none";
      }
      if (playbackControlRow) {
        playbackControlRow.style.display = this.settings.showPlaybackControlRow ? "flex" : "none";
      }
    }
    "updateSetting"(key, value) {
      var _this$playerCore8;
      this.settings[key] = value;
      const state = (_this$playerCore8 = this.playerCore) === null || _this$playerCore8 === void 0 || (_this$playerCore8 = _this$playerCore8.options) === null || _this$playerCore8 === void 0 ? void 0 : _this$playerCore8.playerState;
      if (state) {
        state.updateSetting(key, value);
      } else {
        this.saveSettings();
      }
      telemetry.track("setting_toggle_ui", {
        "key": key,
        "value": value
      });
      if (key === "debugMode") {
        telemetry.track("setting_debug_mode", {
          "debug_mode": !!value
        });
      }
      if (key.startsWith("show") && key.endsWith("Row")) {
        this.updateControlRowsVisibility();
      }
    }
  }
  class VideoSwipeManager {
    "constructor"(videoElement, containerElement, handleElement) {
      let uiElements = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      let onClose = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
      let uiManager = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : null;
      this.video = videoElement;
      this.container = containerElement;
      this.handle = handleElement;
      this.uiElements = uiElements;
      this.onClose = onClose;
      this.uiManager = uiManager;
      this._touchPreventDefault = e => {
        if (this.isDragging && e.touches && e.touches.length > 0) {
          const currentY = e.touches[0].clientY;
          const currentDeltaY = currentY - this.startY;
          if (this.dragDirection === "vertical") {
            if (currentDeltaY < 0) {
              if (window.tmDebugLogger) {
                window.tmDebugLogger.log(`[_touchPreventDefault] Video swipe UP. deltaY: ${currentDeltaY}. Allowing penetration.`);
              }
              return;
            }
            if (window.tmDebugLogger) {
              window.tmDebugLogger.log(`[_touchPreventDefault] Video swipe DOWN. deltaY: ${currentDeltaY}. Preventing default!`);
            }
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        }
      };
      this.offset = 0;
      this.maxOffset = 0;
      this.isDragging = false;
      this.isHandleDragging = false;
      this.startX = 0;
      this.startY = 0;
      this.dragDirection = null;
      this.deltaY = 0;
      this.startOffset = 0;
      this.lastSnapPosition = null;
      this.wasDragging = false;
      this.dragEndTimestamp = 0;
      this.dragDistance = 0;
      this.minDragDistance = 10;
      this.videoWidth = 0;
      this.videoHeight = 0;
      this.containerWidth = 0;
      this.containerHeight = 0;
      this.videoScale = 1;
      this.velocityTracker = {
        "positions": [],
        "lastTimestamp": 0,
        "currentVelocity": 0
      };
      this.handleVelocityTracker = {
        "positions": [],
        "lastTimestamp": 0,
        "currentVelocity": 0
      };
      this.animation = {
        "active": false,
        "rafId": null,
        "targetOffset": 0,
        "startTime": 0,
        "duration": 0
      };
      this._pointerDownHandler = this._handlePointerDown.bind(this);
      this._pointerMoveHandler = this._handlePointerMove.bind(this);
      this._pointerUpHandler = this._handlePointerUp.bind(this);
      this._handlePointerDownHandler = this._handleHandlePointerDown.bind(this);
      this._handlePointerMoveHandler = this._handleHandlePointerMove.bind(this);
      this._handlePointerUpHandler = this._handleHandlePointerUp.bind(this);
      this._init();
    }
    "setUiManager"(uiManager) {
      this.uiManager = uiManager;
    }
    "_init"() {
      this.video.style.willChange = "transform";
      this.video.style.transition = "transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)";
      if (this.container) {
        this.minimap = document.createElement("div");
        this.minimap.className = "tm-video-minimap";
        this.minimap.innerHTML = '<div class="tm-video-minimap-viewport"></div>';
        this.container.appendChild(this.minimap);
        this.minimapViewport = this.minimap.querySelector(".tm-video-minimap-viewport");
      }
      const dragTarget = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
      dragTarget.addEventListener("pointerdown", this._pointerDownHandler);
      if (this.handle) {
        this.handle.style.willChange = "transform, left";
        this.handle.style.transition = "left 0.2s cubic-bezier(0.215, 0.61, 0.355, 1), width 0.2s ease";
        this.handle.addEventListener("pointerdown", this._handlePointerDownHandler);
      }
      requestAnimationFrame((() => {
        this._updateConstraints();
      }));
      this.video.addEventListener("loadedmetadata", (() => {
        this._updateConstraints();
      }));
      this.video.addEventListener("canplay", (() => {
        this._updateConstraints();
      }));
      this._windowResizeHandler = () => {
        this._updateConstraints();
      };
      window.addEventListener("resize", this._windowResizeHandler);
      window.addEventListener("orientationchange", this._windowResizeHandler);
    }
    "_updateVideoDimensions"() {
      this.videoWidth = this.video.videoWidth || this.video.naturalWidth || 0;
      this.videoHeight = this.video.videoHeight || this.video.naturalHeight || 0;
      this.containerWidth = this.container.offsetWidth;
      this.containerHeight = this.container.offsetHeight;
      if (this.videoWidth <= 0 || this.videoHeight <= 0 || this.containerWidth <= 0 || this.containerHeight <= 0) {
        this.videoScale = 1;
        this.maxOffset = 0;
        return false;
      }
      const videoAspect = this.videoWidth / this.videoHeight;
      const renderedVideoWidth = this.containerHeight * videoAspect;
      this.videoScale = this.containerHeight / this.videoHeight;
      if (renderedVideoWidth <= this.containerWidth) {
        this.maxOffset = 0;
        return true;
      }
      const overflow = renderedVideoWidth - this.containerWidth;
      this.maxOffset = overflow / 2;
      return true;
    }
    "_updateConstraints"() {
      if (this._constraintsRafPending) {
        return;
      }
      this._constraintsRafPending = true;
      requestAnimationFrame((() => {
        this._constraintsRafPending = false;
        this._doUpdateConstraints();
      }));
    }
    "_doUpdateConstraints"() {
      if (!this.container || !this.video) {
        return false;
      }
      const dimensionsUpdated = this._updateVideoDimensions();
      if (!dimensionsUpdated || this.maxOffset <= 0) {
        this._applyOffset(0, false);
        this._updateHandleState(false);
        if (this.minimap) {
          this.minimap.style.visibility = "";
        }
        return false;
      }
      this.offset = Math.max(-this.maxOffset, Math.min(this.offset, this.maxOffset));
      this._applyOffset(this.offset, false);
      this._updateHandleState(true);
      if (this.minimap) {
        this.minimap.style.visibility = "";
        const ratio = this.videoWidth / this.videoHeight;
        if (ratio > 0) {
          const maxW = 80;
          const maxH = 45;
          let miniW = maxW;
          let miniH = Math.round(maxW / ratio);
          if (miniH > maxH) {
            miniH = maxH;
            miniW = Math.round(maxH * ratio);
          }
          this.minimap.style.width = `${miniW}px`;
          this.minimap.style.height = `${miniH}px`;
          const videoRenderedWidth = this.videoWidth * this.videoScale || this.containerWidth;
          if (videoRenderedWidth > 0 && this.minimapViewport) {
            const viewportW = Math.min(miniW, this.containerWidth / videoRenderedWidth * miniW);
            this.minimapViewport.style.width = `${viewportW}px`;
            this.minimapMaxTravel = miniW - viewportW;
          }
        }
      }
      this._updateMinimapViewport();
      return true;
    }
    "_applyOffset"(offset) {
      let animate = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
      this.offset = Math.max(-this.maxOffset, Math.min(offset, this.maxOffset));
      if (animate) {
        this.video.style.transition = "transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)";
      } else {
        this.video.style.transition = "none";
      }
      this.video.style.transform = `translateX(${this.offset}px)`;
      this._updateHandlePosition();
      this._updateMinimapViewport();
      return this;
    }
    "_updateMinimapViewport"() {
      if (!this.minimapViewport || this.maxOffset <= 0) {
        return;
      }
      const miniX = (this.maxOffset - this.offset) / (2 * this.maxOffset) * (this.minimapMaxTravel || 0);
      this.minimapViewport.style.transform = `translateX(${miniX}px)`;
    }
    "_updateHandleState"(enabled) {
      if (!this.handle) {
        return;
      }
      this._updateHandleWidth();
      if (enabled) {
        this.handle.style.cursor = "grab";
        this.video.style.cursor = "grab";
        const handleContainer = this.handle.parentElement;
        if (handleContainer) {
          handleContainer.style.cursor = "grab";
        }
      } else {
        this.handle.style.cursor = "default";
        this.video.style.cursor = "default";
      }
      this._updateHandlePosition();
    }
    "_updateHandleWidth"() {
      if (!this.handle) {
        return;
      }
      const handleWidthPercent = 30;
      this.handle.style.width = `${handleWidthPercent}%`;
    }
    "_updateHandlePosition"() {
      if (!this.handle) {
        return;
      }
      const handleContainer = this.handle.parentElement;
      if (!handleContainer) {
        return;
      }
      if (this.maxOffset <= 0) {
        this.handle.style.left = "50%";
        this.handle.style.transform = "translateX(-50%)";
        return;
      }
      const containerWidth = handleContainer.offsetWidth;
      const handleWidth = this.handle.offsetWidth;
      const handleMovableRange = containerWidth - handleWidth;
      const offsetRatio = 1 - (this.offset + this.maxOffset) / (2 * this.maxOffset);
      const handleLeftPx = offsetRatio * handleMovableRange;
      const handleLeftPercent = handleLeftPx / containerWidth * 100;
      this.handle.style.left = `${handleLeftPercent}%`;
      this.handle.style.transform = "";
    }
    "_updateVelocityTracker"(tracker, val) {
      const now = Date.now();
      tracker.positions.push({
        "val": val,
        "time": now
      });
      while (tracker.positions.length > 1 && now - tracker.positions[0].time > 100) {
        tracker.positions.shift();
      }
      if (tracker.positions.length > 1) {
        const first = tracker.positions[0];
        const last = tracker.positions[tracker.positions.length - 1];
        const deltaTime = last.time - first.time;
        if (deltaTime > 0) {
          tracker.currentVelocity = (last.val - first.val) / deltaTime;
        }
      }
      tracker.lastTimestamp = now;
    }
    "_trackVelocity"(x) {
      this._updateVelocityTracker(this.velocityTracker, x);
    }
    "_applyInertia"() {
      if (Math.abs(this.velocityTracker.currentVelocity) < .1) {
        return;
      }
      const velocity = this.velocityTracker.currentVelocity;
      const deceleration = .002;
      const distance = velocity * velocity / (2 * deceleration) * Math.sign(velocity);
      let targetOffset = this.offset + distance;
      targetOffset = Math.max(-this.maxOffset, Math.min(targetOffset, this.maxOffset));
      const duration = Math.min(Math.abs(velocity / deceleration) * .8, 400);
      this._animateTo(targetOffset, duration);
    }
    "_animateTo"(targetOffset) {
      let duration = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 300;
      if (this.animation.rafId) {
        cancelAnimationFrame(this.animation.rafId);
        this.animation.rafId = null;
      }
      this._applyOffset(targetOffset, true);
    }
    "_handlePointerDown"(e) {
      if (!e.isPrimary) {
        return;
      }
      if (this.animation.active) {
        cancelAnimationFrame(this.animation.rafId);
        this.animation.active = false;
      }
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.dragDirection = null;
      this.deltaY = 0;
      this.startOffset = this.offset;
      this.dragDistance = 0;
      this.velocityTracker.positions = [];
      this.velocityTracker.lastTimestamp = Date.now();
      this.velocityTracker.currentVelocity = 0;
      this._trackVelocity(e.clientX);
      this.video.style.cursor = "grabbing";
      this.video.style.transition = "none";
      const dragTarget = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
      window.addEventListener("pointermove", this._pointerMoveHandler);
      window.addEventListener("pointerup", this._pointerUpHandler);
      window.addEventListener("pointercancel", this._pointerUpHandler);
      dragTarget.addEventListener("touchmove", this._touchPreventDefault, {
        "passive": false
      });
      if (window.navigator.vibrate) {
        window.navigator.vibrate(5);
      }
    }
    "_handlePointerMove"(e) {
      if (!this.isDragging || !e.isPrimary) {
        return;
      }
      const uiManager = this.uiManager || this.playerCore && this.playerCore.uiManager;
      if (uiManager && uiManager.isLongPress) {
        return;
      }
      if (uiManager && uiManager.isLandscape) {
        const isDocked = !!(uiManager.playerContainer && uiManager.playerContainer.className.match(/tm-controls-docked-/));
        const isFloating = uiManager.isSidebarHidden || !isDocked;
        if (isFloating && uiManager.controlsVisible) {
          uiManager.hideControls();
        }
      }
      const deltaX = e.clientX - this.startX;
      const deltaY = e.clientY - this.startY;
      if (this.dragDirection === null) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (absX > 5 || absY > 5) {
          if (absY > absX) {
            this.dragDirection = "vertical";
          } else {
            this.dragDirection = "horizontal";
          }
        }
      }
      if (this.dragDirection === "horizontal") {
        const dragTarget = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
        if (dragTarget && dragTarget.classList) {
          dragTarget.classList.add("is-swiping");
        }
        if (this.maxOffset > 0) {
          this.dragDistance = Math.max(this.dragDistance, Math.abs(deltaX));
          const newOffset = Math.max(-this.maxOffset, Math.min(this.startOffset + deltaX, this.maxOffset));
          this._applyOffset(newOffset, false);
          this._trackVelocity(e.clientX);
        }
      } else if (this.dragDirection === "vertical") {
        this.deltaY = deltaY;
        this.dragDistance = Math.max(this.dragDistance, Math.abs(deltaY));
        if (deltaY > 0) {
          document.body.classList.add("tm-swiping-down");
          if (this.uiElements && this.uiElements.playerContainer) {
            this.uiElements.playerContainer.style.transform = `translateY(${deltaY}px)`;
            this.uiElements.playerContainer.style.opacity = Math.max(0, 1 - deltaY / 350);
            this.uiElements.playerContainer.style.transition = "none";
          }
          if (this.uiElements && this.uiElements.overlay) {
            this.uiElements.overlay.style.opacity = Math.max(.08, 1 - deltaY / 320);
            this.uiElements.overlay.style.transition = "none";
          }
        } else {
          document.body.classList.remove("tm-swiping-down");
          if (this.uiElements && this.uiElements.playerContainer) {
            this.uiElements.playerContainer.style.transform = "translateY(0)";
            this.uiElements.playerContainer.style.opacity = "1";
            this.uiElements.playerContainer.style.transition = "none";
          }
          if (this.uiElements && this.uiElements.overlay) {
            this.uiElements.overlay.style.opacity = "1";
            this.uiElements.overlay.style.transition = "none";
          }
        }
      }
      const isUpwardSwipe = this.dragDirection === "vertical" && deltaY < 0;
      const isUndeterminedUpward = this.dragDirection === null && deltaY < -2;
      if (!isUpwardSwipe && !isUndeterminedUpward) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
    "_handlePointerUp"(e) {
      if (!this.isDragging || !e.isPrimary) {
        return;
      }
      this.isDragging = false;
      if (this.dragDistance > this.minDragDistance) {
        this.wasDragging = true;
        this.dragEndTimestamp = Date.now();
        if (this.dragDirection) {
          telemetry.track("gesture_swipe", {
            "direction": this.dragDirection,
            "distance": Math.round(this.dragDistance)
          });
        }
      } else {
        this.wasDragging = false;
      }
      const uiMgr = this.uiManager || this.playerCore && this.playerCore.uiManager;
      if (uiMgr && uiMgr.isLandscape) {
        uiMgr.autoHideControls();
      }
      const dragTarget = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
      if (dragTarget && dragTarget.classList) {
        setTimeout((() => {
          if (!this.isDragging && dragTarget && dragTarget.classList) {
            dragTarget.classList.remove("is-swiping");
          }
        }), 600);
      }
      window.removeEventListener("pointermove", this._pointerMoveHandler);
      window.removeEventListener("pointerup", this._pointerUpHandler);
      window.removeEventListener("pointercancel", this._pointerUpHandler);
      dragTarget.removeEventListener("touchmove", this._touchPreventDefault);
      this.video.style.cursor = "grab";
      if (this.dragDirection === "vertical") {
        if (this.deltaY > 120) {
          document.body.classList.remove("tm-swiping-down");
          if (this.uiElements && this.uiElements.playerContainer) {
            this.uiElements.playerContainer.style.transition = "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
            this.uiElements.playerContainer.style.transform = "translateY(100vh)";
            this.uiElements.playerContainer.style.opacity = "0";
          }
          if (this.uiElements && this.uiElements.overlay) {
            this.uiElements.overlay.style.transition = "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
            this.uiElements.overlay.style.opacity = "0";
          }
          setTimeout((() => {
            if (this.onClose) {
              this.onClose();
            }
          }), 350);
        } else {
          document.body.classList.remove("tm-swiping-down");
          if (this.uiElements && this.uiElements.playerContainer) {
            this.uiElements.playerContainer.style.transition = "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease";
            this.uiElements.playerContainer.style.transform = "translateY(0)";
            this.uiElements.playerContainer.style.opacity = "1";
          }
          if (this.uiElements && this.uiElements.overlay) {
            this.uiElements.overlay.style.transition = "opacity 0.3s ease";
            this.uiElements.overlay.style.opacity = "1";
          }
        }
      } else if (this.dragDirection === "horizontal") {
        if (this.maxOffset > 0) {
          this._applyInertia();
        }
      }
      this.dragDirection = null;
      e.preventDefault();
    }
    "_handleHandlePointerDown"(e) {
      if (this.maxOffset <= 0) {
        return;
      }
      if (!e.isPrimary) {
        return;
      }
      if (this.animation.active) {
        cancelAnimationFrame(this.animation.rafId);
        this.animation.active = false;
      }
      this.isHandleDragging = true;
      this.startX = e.clientX;
      this.dragDistance = 0;
      this.startOffset = this.offset;
      const handleContainer = this.handle.parentElement;
      const containerWidth = handleContainer ? handleContainer.offsetWidth : 0;
      if (containerWidth > 0) {
        const handleRect = this.handle.getBoundingClientRect();
        this.startHandleLeft = handleRect.left - handleContainer.getBoundingClientRect().left;
        this.startHandleLeftPercent = this.startHandleLeft / containerWidth * 100;
      } else {
        this.startHandleLeft = 0;
        this.startHandleLeftPercent = 0;
      }
      this.handle.style.cursor = "grabbing";
      this.handle.style.transition = "none";
      if (this.handle.setPointerCapture) {
        this.handle.setPointerCapture(e.pointerId);
      }
      this.handle.addEventListener("pointermove", this._handlePointerMoveHandler);
      this.handle.addEventListener("pointerup", this._handlePointerUpHandler);
      this.handle.addEventListener("pointercancel", this._handlePointerUpHandler);
      if (window.navigator.vibrate) {
        window.navigator.vibrate(5);
      }
      e.preventDefault();
    }
    "_handleHandlePointerMove"(e) {
      if (!this.isHandleDragging || !e.isPrimary) {
        return;
      }
      const handleContainer = this.handle.parentElement;
      if (!handleContainer) {
        return;
      }
      const containerWidth = handleContainer.offsetWidth;
      const handleWidth = this.handle.offsetWidth;
      if (containerWidth <= 0 || handleWidth <= 0) {
        return;
      }
      const deltaX = e.clientX - this.startX;
      this.dragDistance = Math.max(this.dragDistance, Math.abs(deltaX));
      let newHandleLeft = this.startHandleLeft + deltaX;
      const maxHandleLeft = containerWidth - handleWidth;
      newHandleLeft = Math.max(0, Math.min(newHandleLeft, maxHandleLeft));
      this._trackHandleVelocity(newHandleLeft);
      const snapPositions = [ 0, maxHandleLeft / 2, maxHandleLeft ];
      const snapThreshold = 15;
      let didSnap = false;
      for (const snapPos of snapPositions) {
        if (Math.abs(newHandleLeft - snapPos) < snapThreshold) {
          newHandleLeft = snapPos;
          didSnap = true;
          if (window.navigator.vibrate && (!this.lastSnapPosition || this.lastSnapPosition !== snapPos)) {
            window.navigator.vibrate(15);
            this.lastSnapPosition = snapPos;
          }
          break;
        }
      }
      if (!didSnap) {
        this.lastSnapPosition = null;
      }
      const newHandleLeftPercent = newHandleLeft / containerWidth * 100;
      this.handle.style.left = `${newHandleLeftPercent}%`;
      const handleRatio = maxHandleLeft > 0 ? newHandleLeft / maxHandleLeft : 0;
      const newOffset = (1 - handleRatio) * 2 * this.maxOffset - this.maxOffset;
      this.video.style.transform = `translateX(${newOffset}px)`;
      this.video.style.transition = "none";
      this.offset = newOffset;
      e.preventDefault();
    }
    "_handleHandlePointerUp"(e) {
      if (!this.isHandleDragging || !e.isPrimary) {
        return;
      }
      this.isHandleDragging = false;
      if (this.dragDistance > this.minDragDistance) {
        this.wasDragging = true;
        this.dragEndTimestamp = Date.now();
      } else {
        this.wasDragging = false;
      }
      this.lastSnapPosition = null;
      if (this.handle.releasePointerCapture) {
        this.handle.releasePointerCapture(e.pointerId);
      }
      this.handle.removeEventListener("pointermove", this._handlePointerMoveHandler);
      this.handle.removeEventListener("pointerup", this._handlePointerUpHandler);
      this.handle.removeEventListener("pointercancel", this._handlePointerUpHandler);
      this.handle.style.cursor = "grab";
      this._applyHandleInertia();
      e.preventDefault();
    }
    "_trackHandleVelocity"(position) {
      this._updateVelocityTracker(this.handleVelocityTracker, position);
    }
    "_applyHandleInertia"() {
      if (Math.abs(this.handleVelocityTracker.currentVelocity) < .1) {
        return;
      }
      const handleContainer = this.handle.parentElement;
      if (!handleContainer) {
        return;
      }
      const containerWidth = handleContainer.offsetWidth;
      const handleWidth = this.handle.offsetWidth;
      const maxHandleLeft = containerWidth - handleWidth;
      const handleRect = this.handle.getBoundingClientRect();
      const containerRect = handleContainer.getBoundingClientRect();
      const currentHandleLeft = handleRect.left - containerRect.left;
      const velocity = this.handleVelocityTracker.currentVelocity;
      const deceleration = .002;
      const distance = velocity * velocity / (2 * deceleration) * Math.sign(velocity);
      let targetHandleLeft = currentHandleLeft + distance;
      targetHandleLeft = Math.max(0, Math.min(targetHandleLeft, maxHandleLeft));
      const snapPositions = [ 0, maxHandleLeft / 2, maxHandleLeft ];
      const snapThreshold = 30;
      let closestSnapPos = targetHandleLeft;
      let minDistance = Number.MAX_VALUE;
      for (const snapPos of snapPositions) {
        const distance = Math.abs(targetHandleLeft - snapPos);
        if (distance < snapThreshold && distance < minDistance) {
          closestSnapPos = snapPos;
          minDistance = distance;
        }
      }
      if (minDistance < Number.MAX_VALUE) {
        targetHandleLeft = closestSnapPos;
      }
      const targetHandleLeftPercent = targetHandleLeft / containerWidth * 100;
      const handleRatio = maxHandleLeft > 0 ? targetHandleLeft / maxHandleLeft : 0;
      const targetOffset = (1 - handleRatio) * 2 * this.maxOffset - this.maxOffset;
      this.handle.style.transition = "left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      this.video.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      this.handle.style.left = `${targetHandleLeftPercent}%`;
      this.video.style.transform = `translateX(${targetOffset}px)`;
      this.offset = targetOffset;
      if (minDistance < Number.MAX_VALUE && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
      this.handleVelocityTracker.positions = [];
      this.handleVelocityTracker.currentVelocity = 0;
    }
    "setOffset"(offset) {
      let animate = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
      return this._applyOffset(offset, animate);
    }
    "reset"() {
      let animate = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
      this._applyOffset(0, animate);
      this.wasDragging = false;
      return this;
    }
    "updateSize"() {
      if (this.video && this.container) {
        const videoRect = this.video.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const result = this._updateConstraints();
      }
      return this;
    }
    "destroy"() {
      if (this._windowResizeHandler) {
        window.removeEventListener("resize", this._windowResizeHandler);
        window.removeEventListener("orientationchange", this._windowResizeHandler);
        this._windowResizeHandler = null;
      }
      const dragTarget = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
      if (dragTarget) {
        dragTarget.removeEventListener("pointerdown", this._pointerDownHandler);
      }
      if (this.video) {
        this.video.style.transform = "";
        this.video.style.willChange = "";
        this.video.style.transition = "";
        this.video.style.cursor = "";
      }
      if (this.handle) {
        this.handle.removeEventListener("pointerdown", this._handlePointerDownHandler);
        this.handle.style.willChange = "";
        this.handle.style.transition = "";
        this.handle.style.left = "";
        this.handle.style.width = "";
        this.handle.style.cursor = "";
      }
      if (this.animation.active) {
        cancelAnimationFrame(this.animation.rafId);
        this.animation.active = false;
      }
      if (this.minimap && this.minimap.parentNode) {
        this.minimap.parentNode.removeChild(this.minimap);
        this.minimap = null;
        this.minimapViewport = null;
      }
      this.wasDragging = false;
    }
    "wasRecentlyDragging"() {
      let threshold = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 150;
      if (!this.wasDragging) {
        return false;
      }
      const timeSinceDragEnd = Date.now() - this.dragEndTimestamp;
      if (timeSinceDragEnd > threshold) {
        this.wasDragging = false;
        return false;
      }
      return true;
    }
  }
  class CustomVideoPlayer {
    "constructor"() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.playerCore = new PlayerCore(options);
      this.callingButton = options.callingButton || null;
      this.managers = {};
      this.initialized = false;
      this._activePlayStartTime = null;
      this._activePlayDurationSec = 0;
      this._lastVideoCurrentTime = 0;
      this._replayCount = 0;
    }
    "init"() {
      if (this.initialized) {
        return;
      }
      document.body.classList.add("tm-player-active");
      document.documentElement.classList.add("tm-player-active");
      this._scrollbarStyle = document.createElement("style");
      this._scrollbarStyle.id = "tm-hide-scrollbar-style";
      this._scrollbarStyle.innerHTML = `\n            html::-webkit-scrollbar, body::-webkit-scrollbar {\n                display: none !important;\n            }\n            html, body {\n                scrollbar-width: none !important;\n                -ms-overflow-style: none !important;\n                overscroll-behavior: none !important;\n                overscroll-behavior-y: none !important;\n            }\n        `;
      document.head.appendChild(this._scrollbarStyle);
      if (!this.playerCore) {
        this.playerCore = new PlayerCore({
          "callingButton": this.callingButton
        });
      }
      this._sessionStartTime = Date.now();
      this.playerCore.init();
      if (!this.playerCore.targetVideo) {
        telemetry.track("player_open_fail");
        Toast(__("loadingError") || "Failed to load video", 3e3, "error");
        if (this.callingButton) {
          this.callingButton.style.display = "flex";
        }
        return;
      }
      const videoElem = this.playerCore.targetVideo;
      telemetry.track("player_open_success", {
        "video_duration": videoElem.duration || 0,
        "video_width": videoElem.videoWidth || 0,
        "video_height": videoElem.videoHeight || 0,
        "video_src_domain": function() {
          try {
            return new URL(videoElem.src).hostname;
          } catch (_) {
            return "";
          }
        }()
      });
      this._activePlayStartTime = !videoElem.paused ? Date.now() : null;
      this._activePlayDurationSec = 0;
      this._lastVideoCurrentTime = 0;
      this._replayCount = 0;
      this._onPlay = () => {
        this._activePlayStartTime = Date.now();
      };
      this._onPauseOrEnded = () => {
        if (this._activePlayStartTime) {
          this._activePlayDurationSec += (Date.now() - this._activePlayStartTime) / 1e3;
          this._activePlayStartTime = null;
        }
      };
      this._onTimeUpdate = () => {
        if (videoElem && !videoElem.paused) {
          if (!this._activePlayStartTime) {
            this._activePlayStartTime = Date.now();
          }
          const cur = videoElem.currentTime;
          if (this._lastVideoCurrentTime > 0 && this._lastVideoCurrentTime - cur > 2.5) {
            this._replayCount++;
          }
          this._lastVideoCurrentTime = cur;
        }
      };
      videoElem.addEventListener("play", this._onPlay);
      videoElem.addEventListener("pause", this._onPauseOrEnded);
      videoElem.addEventListener("ended", this._onPauseOrEnded);
      videoElem.addEventListener("timeupdate", this._onTimeUpdate);
      const uiManager = new UIManager(this.playerCore);
      const uiElements = uiManager.createUI();
      this.managers.uiManager = uiManager;
      const controlManager = new ControlManager(this.playerCore, uiElements, uiManager);
      controlManager.init();
      this.managers.controlManager = controlManager;
      const settingsManager = new SettingsManager(this.playerCore, uiElements, uiManager, controlManager);
      settingsManager.init();
      this.managers.settingsManager = settingsManager;
      const progressManager = new ProgressManager(this.playerCore, uiElements);
      progressManager.init({
        "progressBarElement": controlManager.progressBarElement,
        "progressIndicator": controlManager.progressIndicator,
        "currentTimeDisplay": controlManager.currentTimeDisplay,
        "totalDurationDisplay": controlManager.totalDurationDisplay,
        "timeIndicator": controlManager.timeIndicator
      });
      this.managers.progressManager = progressManager;
      const loopManager = new LoopManager(this.playerCore, uiElements, controlManager);
      loopManager.init({
        "loopStartMarker": controlManager.loopStartMarker,
        "loopEndMarker": controlManager.loopEndMarker,
        "loopRangeElement": controlManager.loopRangeElement,
        "progressMarkersContainer": controlManager.progressMarkersContainer,
        "tabScrollContainer": controlManager.tabScrollContainer,
        "tabAddBtn": controlManager.tabAddBtn
      });
      this.managers.loopManager = loopManager;
      controlManager.setLoopManager(loopManager);
      progressManager.setLoopManager(loopManager);
      this.playerCore.loopManager = loopManager;
      const dragManager = new DragManager(this.playerCore, uiElements, uiManager, controlManager);
      dragManager.init();
      this.managers.dragManager = dragManager;
      if (this.playerCore.targetVideo && uiElements.videoWrapper && uiElements.handle) {
        this.swipeManager = new VideoSwipeManager(this.playerCore.targetVideo, uiElements.videoWrapper, uiElements.handle, uiElements, (() => this.close()), uiManager);
        this.swipeManager.playerCore = this.playerCore;
        this.managers.swipeManager = this.swipeManager;
      }
      uiManager.setManagers({
        "controlManager": controlManager,
        "progressManager": progressManager,
        "dragManager": dragManager,
        "loopManager": loopManager,
        "swipeManager": this.swipeManager
      });
      const eventManager = new EventManager(this.playerCore, uiElements, this.managers);
      eventManager.init();
      this.managers.eventManager = eventManager;
      uiManager.assembleDOM();
      settingsManager.updateControlRowsVisibility();
      this.playerCore.restoreVideoState();
      progressManager.updateProgressBar();
      progressManager.updateCurrentTimeDisplay();
      updateSafariThemeColor("#000000", true);
      const runUIUpdates = () => {
        if (this.swipeManager) {
          this.swipeManager.updateSize();
        }
        dragManager.updateHandlePosition();
        if (loopManager) {
          loopManager._updateUI();
          loopManager.updateLoopTimeDisplay();
          loopManager.updateLoopMarkers();
        }
        if (progressManager) {
          progressManager.updateProgressBar();
          progressManager.updateCurrentTimeDisplay();
        }
      };
      if (this.playerCore.targetVideo.readyState >= 1) {
        requestAnimationFrame((() => {
          setTimeout(runUIUpdates, 50);
        }));
      } else {
        this.playerCore.targetVideo.addEventListener("loadedmetadata", runUIUpdates, {
          "once": true
        });
      }
      this.initialized = true;
    }
    "close"() {
      var _this$playerCore, _this$managers, _loopManager$tabs;
      if (this._activePlayStartTime) {
        this._activePlayDurationSec += (Date.now() - this._activePlayStartTime) / 1e3;
        this._activePlayStartTime = null;
      }
      const videoElem = (_this$playerCore = this.playerCore) === null || _this$playerCore === void 0 ? void 0 : _this$playerCore.targetVideo;
      if (videoElem) {
        if (this._onPlay) {
          videoElem.removeEventListener("play", this._onPlay);
        }
        if (this._onPauseOrEnded) {
          videoElem.removeEventListener("pause", this._onPauseOrEnded);
          videoElem.removeEventListener("ended", this._onPauseOrEnded);
        }
        if (this._onTimeUpdate) {
          videoElem.removeEventListener("timeupdate", this._onTimeUpdate);
        }
      }
      const avcode = getVideoCodeFromUrl() || "";
      const playSec = Math.round(this._activePlayDurationSec);
      const loopManager = (_this$managers = this.managers) === null || _this$managers === void 0 ? void 0 : _this$managers.loopManager;
      const loopSec = loopManager ? Math.round(loopManager.totalLoopDurationSec || 0) : 0;
      const abCount = loopManager ? ((_loopManager$tabs = loopManager.tabs) === null || _loopManager$tabs === void 0 ? void 0 : _loopManager$tabs.length) || 0 : 0;
      if (avcode && (playSec > 0 || loopSec > 0)) {
        telemetry.recordVideoPlay(avcode, playSec, loopSec, this._replayCount, abCount);
      }
      const sessionSec = this._sessionStartTime ? Math.round((Date.now() - this._sessionStartTime) / 1e3) : playSec;
      telemetry.track("player_close", {
        "duration_sec": playSec || sessionSec
      });
      if (this._scrollbarStyle) {
        this._scrollbarStyle.remove();
        this._scrollbarStyle = null;
      }
      document.body.classList.remove("tm-player-active");
      document.documentElement.classList.remove("tm-player-active");
      this.playerCore.close(this.managers.uiManager.overlay, this.managers.uiManager.container, this.managers.uiManager.playerContainer);
      if (this.managers.eventManager) {
        this.managers.eventManager.cleanup();
      }
      if (this.swipeManager) {
        this.swipeManager.destroy();
        this.swipeManager = null;
      }
      for (const key in this.managers) {
        if (this.managers[key] && typeof this.managers[key].cleanup === "function") {
          this.managers[key].cleanup();
        }
        this.managers[key] = null;
      }
      this.initialized = false;
      this.managers = {};
      this.playerCore = null;
    }
  }
  class FloatingButton {
    "constructor"() {
      let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.button = null;
      this.videoPlayer = null;
      this.resizeTimeout = null;
      this.playerState = options.playerState || null;
      this.videoCheckInterval = null;
      this.mutationObserver = null;
    }
    "init"() {
      this.cleanupExistingButtons();
      if (findVideoElement()) {
        this.createButton();
        window.addEventListener("resize", this.handleResize.bind(this));
        window.matchMedia("(orientation: portrait)").addEventListener("change", this.handleResize.bind(this));
        this.setupMutationObserver();
      } else {
        this.startVideoElementCheck();
        this.setupMutationObserver();
      }
    }
    "setupMutationObserver"() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
      this.mutationObserver = new MutationObserver(this.handleDomMutations.bind(this));
      this.mutationObserver.observe(document.body, {
        "childList": true,
        "subtree": true
      });
    }
    "handleDomMutations"() {
      if (this.mutationTimeout) {
        clearTimeout(this.mutationTimeout);
      }
      this.mutationTimeout = setTimeout((() => {
        const hasVideo = findVideoElement();
        if (hasVideo && !this.button) {
          this.createButton();
          window.addEventListener("resize", this.handleResize.bind(this));
          window.matchMedia("(orientation: portrait)").addEventListener("change", this.handleResize.bind(this));
        } else if (!hasVideo && this.button) {
          this.button.style.display = "none";
        } else if (hasVideo && this.button && this.button.style.display === "none") {
          this.button.style.display = "flex";
        }
      }), 300);
    }
    "startVideoElementCheck"() {
      if (this.videoCheckInterval) {
        clearInterval(this.videoCheckInterval);
      }
      this.videoCheckInterval = setInterval((() => {
        if (findVideoElement()) {
          if (!this.button) {
            this.createButton();
            window.addEventListener("resize", this.handleResize.bind(this));
            window.matchMedia("(orientation: portrait)").addEventListener("change", this.handleResize.bind(this));
          } else if (this.button.style.display === "none") {
            this.button.style.display = "flex";
          }
          clearInterval(this.videoCheckInterval);
          this.videoCheckInterval = null;
        }
      }), 2e3);
    }
    "cleanupExistingButtons"() {
      const existingButtons = document.querySelectorAll(".tm-floating-button");
      if (existingButtons.length > 0) {
        existingButtons.forEach((button => {
          if (button && button.parentNode) {
            button.parentNode.removeChild(button);
          }
        }));
      }
    }
    "handleResize"() {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout((() => {
        if (findVideoElement()) {
          this.button.style.display = "flex";
          this.updateButtonPosition();
        } else if (this.button) {
          this.button.style.display = "none";
        }
      }), 200);
    }
    "createButton"() {
      this.button = createElementWithStyle("button", "tm-floating-button");
      this.button.innerHTML = FLOATING_PLAY;
      this.button.addEventListener("click", (() => {
        this.handleButtonClick();
      }));
      this.button.style.display = "flex";
      document.body.appendChild(this.button);
      this.updateButtonPosition();
      return this.button;
    }
    "updateButtonPosition"() {
      if (!this.button) {
        return;
      }
      const isPortraitValue = isPortrait();
      if (isPortraitValue) {
        this.button.style.bottom = "max(20px, env(safe-area-inset-bottom, 20px))";
        this.button.style.right = "auto";
        this.button.style.left = "50%";
        this.button.style.transform = "translateX(-50%)";
      } else {
        this.button.style.bottom = "max(20px, calc(env(safe-area-inset-bottom, 20px) + 10px))";
        this.button.style.right = "max(20px, calc(env(safe-area-inset-right, 20px) + 10px))";
        this.button.style.left = "auto";
        this.button.style.transform = "translateX(0)";
      }
      this.button.style.zIndex = "9980";
    }
    "handleButtonClick"() {
      telemetry.trackPluginTrigger();
      const preTargetVideo = findVideoElement();
      if (preTargetVideo) {
        preTargetVideo.setAttribute("playsinline", "true");
        preTargetVideo.setAttribute("webkit-playsinline", "true");
        preTargetVideo.setAttribute("x5-playsinline", "true");
        preTargetVideo.playsInline = true;
        preTargetVideo.webkitPlaysInline = true;
        if (preTargetVideo.webkitDisplayingFullscreen && typeof preTargetVideo.webkitExitFullscreen === "function") {
          try {
            preTargetVideo.webkitExitFullscreen();
          } catch (_) {}
        }
        try {
          const p = preTargetVideo.play();
          if (p !== void 0) {
            p.catch((() => {}));
          }
        } catch (_) {}
      }
      this.button.style.display = "none";
      requestAnimationFrame((() => {
        this.videoPlayer = new CustomVideoPlayer({
          "playerState": this.playerState,
          "callingButton": this.button
        });
        this.videoPlayer.init();
      }));
    }
    "remove"() {
      if (this.button && this.button.parentNode) {
        this.button.parentNode.removeChild(this.button);
      }
      window.removeEventListener("resize", this.handleResize);
      if (this.videoCheckInterval) {
        clearInterval(this.videoCheckInterval);
        this.videoCheckInterval = null;
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      this.button = null;
    }
  }
  class PlayerState {
    "constructor"() {
      this.settings = {
        "showProgressBar": true,
        "showSeekControlRow": true,
        "showLoopControlRow": true,
        "showPlaybackControlRow": true,
        "enabledSeekSteps": [ "5s", "10s", "30s", "1m", "5m", "10m" ],
        "customUserSeekSteps": [],
        "showCommentsSection": true,
        "enabledCommentSources": {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        },
        "telemetryEnabled": false,
        "debugMode": false,
        "sidebarPosition": "right",
        "sidebarHidden": false,
        "preferredPlaybackRate": 1,
        "pauseOnBlur": true,
        "buttonSoundEnabled": true
      };
    }
    "loadSettings"() {
      try {
        const getBool = (key, def) => {
          const v = getValue(key, def);
          return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : def;
        };
        this.settings.showProgressBar = getBool("showProgressBar", true);
        this.settings.showSeekControlRow = getBool("showSeekControlRow", true);
        this.settings.showLoopControlRow = getBool("showLoopControlRow", true);
        this.settings.showPlaybackControlRow = getBool("showPlaybackControlRow", true);
        const rawSeekSteps = getValue("enabledSeekSteps", null);
        this.settings.enabledSeekSteps = Array.isArray(rawSeekSteps) && rawSeekSteps.length > 0 ? rawSeekSteps : [ "5s", "10s", "30s", "1m", "5m", "10m" ];
        const rawCustomSteps = getValue("customUserSeekSteps", null);
        this.settings.customUserSeekSteps = Array.isArray(rawCustomSteps) ? rawCustomSteps : [];
        this.settings.showCommentsSection = getBool("showCommentsSection", true);
        const rawSources = getValue("enabledCommentSources", null);
        this.settings.enabledCommentSources = Object.assign({
          "jable": true,
          "javdb": true,
          "javlibrary": false
        }, rawSources && typeof rawSources === "object" ? rawSources : {});
        this.settings.telemetryEnabled = false;
        this.settings.debugMode = getBool("debugMode", false);
        this.settings.sidebarPosition = getValue("sidebarPosition", "right") || "right";
        this.settings.sidebarHidden = getBool("sidebarHidden", false);
        const rawSpeed = parseFloat(getValue("preferredPlaybackRate", 1));
        this.settings.preferredPlaybackRate = !isNaN(rawSpeed) && rawSpeed >= .5 && rawSpeed <= 4 ? rawSpeed : 1;
        this.settings.pauseOnBlur = getBool("pauseOnBlur", true);
        this.settings.buttonSoundEnabled = getBool("buttonSoundEnabled", true);
      } catch (error) {}
    }
    "saveSettings"() {
      try {
        setValue("showProgressBar", this.settings.showProgressBar);
        setValue("showSeekControlRow", this.settings.showSeekControlRow);
        setValue("showLoopControlRow", this.settings.showLoopControlRow);
        setValue("showPlaybackControlRow", this.settings.showPlaybackControlRow);
        setValue("enabledSeekSteps", this.settings.enabledSeekSteps);
        setValue("customUserSeekSteps", this.settings.customUserSeekSteps);
        setValue("showCommentsSection", this.settings.showCommentsSection);
        setValue("enabledCommentSources", this.settings.enabledCommentSources);
        setValue("telemetryEnabled", false);
        setValue("debugMode", this.settings.debugMode);
        setValue("sidebarPosition", this.settings.sidebarPosition);
        setValue("sidebarHidden", this.settings.sidebarHidden);
        setValue("preferredPlaybackRate", this.settings.preferredPlaybackRate);
        setValue("pauseOnBlur", this.settings.pauseOnBlur);
        setValue("buttonSoundEnabled", this.settings.buttonSoundEnabled);
      } catch (error) {}
    }
    "updateSetting"(key, value) {
      if (key in this.settings) {
        this.settings[key] = value;
        this.saveSettings();
        try {
          SyncManager.recordSettingUpdate(key);
        } catch (_) {}
      }
    }
  }
  const COOLDOWN_DURATION = 30 * 60 * 1e3;
  const MAX_FAIL_COUNT = 3;
  class LoginManager {
    "constructor"() {
      this.userEmail = "";
      this.userPassword = "";
      this.autoLogin = true;
      this.providers = [ new MissavLoginProvider, new JableLoginProvider ];
      this.activeProvider = null;
    }
    async "init"() {
      this.activeProvider = this.getMatchingProvider();
      if (!this.activeProvider) {
        return;
      }
      this.loadLoginInfo();
      this.startKeepAliveLoop();
      const uiTask = this.activeProvider.addAutoLoginOption(this.handleLoginInfoChange.bind(this)).catch((err => {}));
      await this.checkLoginAndAutoLogin();
      await uiTask;
    }
    "handleLoginInfoChange"(info) {
      if (!this.activeProvider) {
        return;
      }
      const siteKey = this.activeProvider.siteKey;
      const currentCreds = CredentialManager.get(siteKey);
      const email = info.email !== void 0 ? info.email : currentCreds.email;
      const password = info.password !== void 0 ? info.password : currentCreds.password;
      const autoLogin = info.autoLogin !== void 0 ? info.autoLogin : currentCreds.autoLogin;
      this.userEmail = email;
      this.userPassword = password;
      this.autoLogin = autoLogin;
      CredentialManager.save(siteKey, email, password, autoLogin);
      this.resetCircuitBreaker(siteKey);
    }
    "loadLoginInfo"() {
      if (!this.activeProvider) {
        return;
      }
      const siteKey = this.activeProvider.siteKey;
      const creds = CredentialManager.get(siteKey);
      this.userEmail = creds.email;
      this.userPassword = creds.password;
      this.autoLogin = creds.autoLogin;
    }
    "getMatchingProvider"() {
      for (const provider of this.providers) {
        if (provider.isSupportedSite()) {
          return provider;
        }
      }
      return null;
    }
    async "checkLoginAndAutoLogin"() {
      if (!this.activeProvider) {
        return;
      }
      const siteKey = this.activeProvider.siteKey;
      const ATTEMPT_KEY = `mp_autologin_attempt_${siteKey}`;
      const MAX_ATTEMPTS = 1;
      try {
        const isLoggedIn = await this.activeProvider.checkLoginStatus();
        if (isLoggedIn) {
          this.resetCircuitBreaker(siteKey);
          try {
            sessionStorage.removeItem(ATTEMPT_KEY);
          } catch (e) {}
          return;
        }
        if (this.autoLogin && this.userEmail && this.userPassword) {
          if (this.isCircuitBroken(siteKey)) {
            return;
          }
          let attempts = 0;
          try {
            attempts = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || "0", 10);
          } catch (e) {}
          if (attempts >= MAX_ATTEMPTS) {
            return;
          }
          try {
            sessionStorage.setItem(ATTEMPT_KEY, String(attempts + 1));
          } catch (e) {}
          const success = await this.activeProvider.login(this.userEmail, this.userPassword, {
            "silent": true
          });
          telemetry.recordFeatureAction("autologin");
          telemetry.track("autologin_result", {
            "site": siteKey,
            "success": !!success
          });
          if (success) {
            this.resetCircuitBreaker(siteKey);
            try {
              sessionStorage.removeItem(ATTEMPT_KEY);
            } catch (e) {}
          } else {
            this.recordFailure(siteKey);
          }
        }
      } catch (error) {
        this.recordFailure(siteKey);
      }
    }
    "isCircuitBroken"(siteKey) {
      const failCount = getLocalStorage(`mp_circuit_fail_${siteKey}`, 0);
      const lastFailTime = getLocalStorage(`mp_circuit_last_fail_${siteKey}`, 0);
      if (failCount >= MAX_FAIL_COUNT) {
        const timePassed = Date.now() - lastFailTime;
        if (timePassed < COOLDOWN_DURATION) {
          return true;
        }
        setLocalStorage(`mp_circuit_fail_${siteKey}`, MAX_FAIL_COUNT - 1);
      }
      return false;
    }
    "recordFailure"(siteKey) {
      const failCount = getLocalStorage(`mp_circuit_fail_${siteKey}`, 0) + 1;
      setLocalStorage(`mp_circuit_fail_${siteKey}`, failCount);
      setLocalStorage(`mp_circuit_last_fail_${siteKey}`, Date.now());
      if (failCount >= MAX_FAIL_COUNT) {}
    }
    "resetCircuitBreaker"(siteKey) {
      try {
        localStorage.removeItem(`mp_circuit_fail_${siteKey}`);
        localStorage.removeItem(`mp_circuit_last_fail_${siteKey}`);
      } catch (e) {}
    }
    async "login"(email, password) {
      if (!this.activeProvider) {
        return false;
      }
      this.handleLoginInfoChange({
        "email": email,
        "password": password
      });
      return await this.activeProvider.login(email, password);
    }
    "startKeepAliveLoop"() {
      const interval = 10 * 60 * 1e3;
      setTimeout((() => {
        this.runKeepAlive();
      }), 3e4);
      setInterval((() => {
        this.runKeepAlive();
      }), interval);
    }
    async "runKeepAlive"() {
      for (const provider of this.providers) {
        const siteKey = provider.siteKey;
        if (this.isCircuitBroken(siteKey)) {
          continue;
        }
        try {
          if (typeof provider.keepAlive === "function") {
            await provider.keepAlive();
          }
        } catch (e) {
          this.recordFailure(siteKey);
        }
      }
    }
  }
  async function initAutoLogin() {
    try {
      const loginManager = new LoginManager;
      await loginManager.init();
      return loginManager;
    } catch (error) {
      return null;
    }
  }
  const adSelectors = [ 'div[class="space-y-6 mb-6"]', 'div[class*="root--"][class*="bottomRight--"]', 'div[class="grid md:grid-cols-2 gap-8"]', 'ul[class="mb-4 list-none text-nord14 grid grid-cols-2 gap-2"]', 'div[class="space-y-5 mb-5"]', 'iframe[src*="ads"]', 'iframe[src*="banner"]', 'iframe[src*="pop"]', "iframe[data-ad]", 'iframe[id*="ads"]', 'iframe[class*="ads"]', 'iframe:not([src*="plyr.io"])' ];
  const customStyles = [ {
    "selector": 'div[class="my-2 text-sm text-nord4 truncate"]',
    "styles": "white-space: normal !important;"
  }, {
    "selector": "body",
    "styles": "background-color: #000000 !important;"
  }, {
    "selector": 'div[class*="z-max"]',
    "styles": "z-index: 9000 !important;"
  } ];
  const blockedUrlPatterns = [ "exoclick.com", "juicyads.com", "popads.net", "adsterra.com", "trafficjunky.com", "adnium.com", "ad-maven.com", "browser-update.org", "mopvip.icu", "toppages.pw", "cpmstar.com", "propellerads.com", "tsyndicate.com", "syndication.exosrv.com", "ads.exosrv.com", "tsyndicate.com/sdk", "cdn.tsyndicate.com", "adsco.re", "adscpm.site", "a-ads.com", "ad-delivery.net", "outbrain.com", "taboola.com", "mgid.com", "revcontent.com", "adnxs.com", "pubmatic.com", "rubiconproject.com", "openx.net", "criteo.com", "doubleclick.net" ];
  const missav = {
    "adSelectors": adSelectors,
    "customStyles": customStyles,
    "blockedUrlPatterns": blockedUrlPatterns,
    "isVideoSite": true,
    "domains": (0, domains.getSiteDomains)("MISSAV")
  };
  class AdBlockConfig {
    "constructor"() {
      let siteConfig = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.adSelectors = siteConfig.adSelectors || [];
      this.customStyles = siteConfig.customStyles || [];
      this.blockedUrlPatternsSet = new Set(siteConfig.blockedUrlPatterns || []);
      this.adKeywordsRegex = /ads|analytics|tracker|affiliate|stat|pixel|banner|pop|click|outstream\.video|vast|vmap|preroll|midroll|postroll|adserve/i;
    }
    "isEmpty"() {
      return this.adSelectors.length === 0 && this.customStyles.length === 0 && this.blockedUrlPatternsSet.size === 0;
    }
    "shouldBlockUrl"(url) {
      if (!url || typeof url !== "string") {
        return false;
      }
      if (this.adKeywordsRegex.test(url)) {
        return true;
      }
      for (const pattern of this.blockedUrlPatternsSet) {
        if (url.includes(pattern)) {
          return true;
        }
      }
      return false;
    }
  }
  class StyleManager {
    "constructor"(config) {
      this.config = config;
    }
    "applyAdBlockStyles"() {
      if (this.config.adSelectors.length === 0 && this.config.customStyles.length === 0) {
        return;
      }
      const styleElement = document.createElement("style");
      styleElement.id = "adblock-styles";
      styleElement.type = "text/css";
      let css = "";
      if (this.config.adSelectors.length > 0) {
        css += this.config.adSelectors.join(", ") + " { display: none !important; visibility: hidden !important; height: 0 !important; min-height: 0 !important; }";
      }
      if (this.config.customStyles.length > 0) {
        css += "\n" + this.config.customStyles.map((item => `${item.selector} { ${item.styles} }`)).join("\n");
      }
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
    }
  }
  class DOMCleaner {
    "constructor"(config) {
      this.config = config;
      this.observer = null;
    }
    "cleanIframes"() {
      let iframeElements = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
      const iframes = iframeElements || document.getElementsByTagName("iframe");
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        if (iframe.src && !iframe.src.includes("plyr.io")) {
          iframe.remove();
        }
      }
    }
    "removeAdElements"() {
      if (!this.config.adSelectors || this.config.adSelectors.length === 0) {
        return;
      }
      try {
        const combinedSelector = this.config.adSelectors.join(", ");
        const elements = document.querySelectorAll(combinedSelector);
        for (let j = 0; j < elements.length; j++) {
          elements[j].remove();
        }
      } catch (_) {}
    }
    "observeDOMChanges"() {
      if (this.observer) {
        return;
      }
      let pendingChanges = false;
      let frameChanges = false;
      let processingTimeout = null;
      const processChanges = () => {
        if (pendingChanges) {
          this.removeAdElements();
          pendingChanges = false;
        }
        if (frameChanges) {
          this.cleanIframes();
          frameChanges = false;
        }
        processingTimeout = null;
      };
      this.observer = new MutationObserver((mutations => {
        let hasNewNodes = false;
        let hasNewIframes = false;
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (mutation.addedNodes.length) {
            hasNewNodes = true;
            for (let j = 0; j < mutation.addedNodes.length; j++) {
              if (mutation.addedNodes[j].nodeName === "IFRAME") {
                hasNewIframes = true;
                break;
              }
            }
          }
          if (hasNewNodes && hasNewIframes) {
            break;
          }
        }
        if (hasNewNodes) {
          pendingChanges = true;
        }
        if (hasNewIframes) {
          frameChanges = true;
        }
        if ((pendingChanges || frameChanges) && !processingTimeout) {
          processingTimeout = setTimeout(processChanges, 50);
        }
      }));
      this.observer.observe(document.documentElement, {
        "childList": true,
        "subtree": true
      });
    }
  }
  class RequestBlocker {
    "constructor"(config) {
      this.config = config;
    }
    "blockTrackingRequests"() {
      const originalXHR = XMLHttpRequest.prototype.open;
      const config = this.config;
      XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === "string" && config.shouldBlockUrl(url)) {
          this.send = function() {};
          this.onload = null;
          this.onerror = null;
          return;
        }
        return originalXHR.apply(this, arguments);
      };
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        let urlToCheck = url instanceof Request ? url.url : url;
        if (typeof urlToCheck === "string" && config.shouldBlockUrl(urlToCheck)) {
          return Promise.resolve(new Response("", {
            "status": 200,
            "headers": {
              "Content-Type": "text/plain"
            }
          }));
        }
        return originalFetch.apply(this, arguments);
      };
    }
    "blockIframeLoading"() {
      const createElementOriginal = document.createElement;
      const config = this.config;
      document.createElement = function(tag) {
        const element = createElementOriginal.call(document, tag);
        if (tag.toLowerCase() === "iframe") {
          let originalSrc = element.src;
          Object.defineProperty(element, "src", {
            "set": function(value) {
              if (typeof value === "string" && config.shouldBlockUrl(value)) {
                return;
              }
              originalSrc = value;
            },
            "get": function() {
              return originalSrc;
            }
          });
          const originalSetAttribute = element.setAttribute;
          element.setAttribute = function(name, value) {
            if (name === "src" && typeof value === "string" && config.shouldBlockUrl(value)) {
              return;
            }
            return originalSetAttribute.call(this, name, value);
          };
        }
        return element;
      };
    }
    "blockPopups"() {
      const noopOpen = function() {
        return null;
      };
      try {
        window.open = noopOpen;
      } catch (_) {}
      try {
        if (typeof unsafeWindow !== "undefined" && unsafeWindow) {
          unsafeWindow.open = noopOpen;
        }
      } catch (_) {}
      try {
        const origClick = HTMLAnchorElement.prototype.click;
        const config = this.config;
        HTMLAnchorElement.prototype.click = function() {
          if (this.href && config.shouldBlockUrl(this.href)) {
            return;
          }
          if (this.target === "_blank" && this.href && (this.href.includes("ads") || this.href.includes("pop") || config.shouldBlockUrl(this.href))) {
            return;
          }
          return origClick.apply(this, arguments);
        };
      } catch (_) {}
    }
    "init"() {
      this.blockIframeLoading();
      this.blockTrackingRequests();
      this.blockPopups();
    }
  }
  class AdBlocker {
    "constructor"() {
      let isMissav = false;
      try {
        const {"isSiteDomain": isSiteDomain} = __webpack_require__(645);
        isMissav = isSiteDomain("MISSAV");
      } catch (_) {
        isMissav = /^https?:\/\/(www\.)?(missav|thisav)\.(com|ws|ai|live|net|org)/i.test(window.location.href);
      }
      const siteConfig = isMissav ? missav : {};
      this.config = new AdBlockConfig(siteConfig);
      this.styleManager = new StyleManager(this.config);
      this.domCleaner = new DOMCleaner(this.config);
      this.requestBlocker = new RequestBlocker(this.config);
    }
    "preventDetection"() {
      window.AdBlock = false;
      window.adblock = false;
      window.adsbygoogle = {
        "loaded": true
      };
      if (typeof unsafeWindow !== "undefined") {
        unsafeWindow.AdBlock = false;
        unsafeWindow.adblock = false;
        unsafeWindow.adsbygoogle = {
          "loaded": true
        };
      }
    }
    "setupPeriodicCleaning"() {
      this.domCleaner.removeAdElements();
      this.domCleaner.observeDOMChanges();
      const idleCleanup = () => {
        this.domCleaner.removeAdElements();
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(idleCleanup, {
            "timeout": 12e3
          });
        } else {
          setTimeout(idleCleanup, 1e4);
        }
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(idleCleanup, {
          "timeout": 6e3
        });
      } else {
        setTimeout(idleCleanup, 6e3);
      }
    }
    "init"() {
      if (this.config.isEmpty()) {
        return;
      }
      this.preventDetection();
      this.styleManager.applyAdBlockStyles();
      this.requestBlocker.init();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", (() => this.setupPeriodicCleaning()));
      } else {
        this.setupPeriodicCleaning();
      }
    }
  }
  const adblock = AdBlocker;
  class DetailExpander {
    "constructor"() {
      this.maxAttempts = 3;
      this.attemptInterval = 1500;
    }
    get "SHOW_MORE_SELECTOR"() {
      return "a.text-nord13.font-medium.flex.items-center";
    }
    "autoExpandDetails"() {
      const executeExpand = () => {
        if (this.expandDetailsSingle()) {
          return;
        }
        let attempts = 0;
        const attemptInterval = setInterval((() => {
          if (this.expandDetailsSingle() || ++attempts >= this.maxAttempts) {
            clearInterval(attemptInterval);
          }
        }), this.attemptInterval);
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(executeExpand, {
          "timeout": 3500
        });
      } else {
        setTimeout(executeExpand, 1200);
      }
    }
    "expandDetailsSingle"() {
      try {
        const showMoreButton = document.querySelector(this.SHOW_MORE_SELECTOR);
        if (showMoreButton) {
          if (showMoreButton.offsetParent === null && showMoreButton.style.display === "none") {
            return true;
          }
          showMoreButton.click();
          return true;
        }
      } catch (error) {}
      return false;
    }
  }
  class QualityManager {
    "constructor"() {
      this.maxAttempts = 6;
      this.attemptInterval = 1e3;
    }
    "setupAutoHighestQuality"() {
      const executeQualitySetup = () => {
        if (this.setHighestQualitySingle()) {
          return;
        }
        let attempts = 0;
        const checkInterval = setInterval((() => {
          if (this.setHighestQualitySingle() || ++attempts >= this.maxAttempts) {
            clearInterval(checkInterval);
          }
        }), this.attemptInterval);
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(executeQualitySetup, {
          "timeout": 4e3
        });
      } else {
        setTimeout(executeQualitySetup, 1500);
      }
    }
    "setHighestQualitySingle"() {
      try {
        const player = window.player || (typeof unsafeWindow !== "undefined" ? unsafeWindow.player : null);
        if (!player || !player.config || !player.config.quality || !player.config.quality.options || !player.config.quality.options.length) {
          return false;
        }
        const maxQuality = Math.max(...player.config.quality.options);
        player.quality = maxQuality;
        player.config.quality.selected = maxQuality;
        if (typeof player.quality === "function") {
          player.quality(maxQuality);
        }
        return true;
      } catch (error) {
        return false;
      }
    }
  }
  class UrlRedirector {
    "constructor"() {
      const missavPrimary = domains.SITE_DOMAINS.MISSAV.primary;
      const missavBackups = domains.SITE_DOMAINS.MISSAV.backups;
      this.redirectRules = [];
      for (const backup of missavBackups) {
        const escaped = backup.replace(/\./g, "\\.");
        this.redirectRules.push({
          "pattern": new RegExp(`^https?:\\/\\/(www\\.)?${escaped}\\/?`, "i"),
          "targetDomain": missavPrimary,
          "backupDomain": backup
        });
      }
      this.immediateRedirect();
    }
    "immediateRedirect"() {
      this.checkAndRedirect();
    }
    "checkAndRedirect"() {
      const currentUrl = window.location.href;
      for (const rule of this.redirectRules) {
        if (rule.pattern.test(currentUrl)) {
          const newUrl = this.applyRedirect(currentUrl, rule);
          if (newUrl !== currentUrl) {
            window.location.replace(newUrl);
            return true;
          }
        }
      }
      return false;
    }
    "applyRedirect"(url, rule) {
      if (rule.targetDomain && rule.backupDomain) {
        const escaped = rule.backupDomain.replace(/\./g, "\\.");
        const regex = new RegExp(`^(https?:\\/\\/)(www\\.)?${escaped}\\/?`, "i");
        return url.replace(regex, `$1${rule.targetDomain}/`);
      }
      return url;
    }
  }
  const earlyUrlRedirector = new UrlRedirector;
  class UserExperienceEnhancer {
    "constructor"() {
      this.detailExpander = new DetailExpander;
      this.qualityManager = new QualityManager;
      this.urlRedirector = earlyUrlRedirector;
    }
    "init"() {
      let skipRedirectCheck = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
      if (!skipRedirectCheck) {
        if (this.urlRedirector.checkAndRedirect()) {
          return;
        }
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", (() => {
          this.initFeatures();
        }));
      } else {
        this.initFeatures();
      }
    }
    "initFeatures"() {
      try {
        this.detailExpander.autoExpandDetails();
        this.qualityManager.setupAutoHighestQuality();
      } catch (error) {}
    }
  }
  function initUserExperienceEnhancer() {
    let skipRedirectCheck = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
    const enhancer = new UserExperienceEnhancer;
    enhancer.init(skipRedirectCheck);
    return enhancer;
  }
  const earlyAdBlocker = new adblock;
  earlyAdBlocker.init();
  earlyUrlRedirector.checkAndRedirect();
  function setupViewport() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content";
    if (window.visualViewport) {
      const updateKeyboardHeight = () => {
        if (!document.body || !document.body.classList.contains("tm-player-active")) {
          return;
        }
        const keyboardHeight = Math.max(0, window.innerHeight - window.visualViewport.height);
        document.documentElement.style.setProperty("--keyboard-height", `${keyboardHeight}px`);
      };
      window.visualViewport.addEventListener("resize", updateKeyboardHeight);
      window.visualViewport.addEventListener("scroll", updateKeyboardHeight);
    }
    document.addEventListener("focusout", (e => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) {
        document.documentElement.style.setProperty("--keyboard-height", "0px");
      }
    }));
  }
  (function() {
    "use strict";
    const isInIframe = window.self !== window.top;
    if (isInIframe && !(0, domains.isSiteDomain)("JAVLIBRARY")) {
      return;
    }
    let playerState = null;
    let videoPlayerInstance = null;
    function injectStyles() {
      if (document.getElementById("tm-player-styles")) {
        return;
      }
      setupViewport();
      __webpack_require__(964);
    }
    async function startScript() {
      try {
        if ((0, domains.isSiteDomain)("JAVLIBRARY")) {
          handleJavLibraryVerification();
          return;
        }
        injectStyles();
        const userExperienceEnhancer = initUserExperienceEnhancer(true);
        playerState = new PlayerState;
        playerState.loadSettings();
        SyncManager.triggerAutoSync(playerState, "startup");
        document.addEventListener("visibilitychange", (() => {
          if (document.visibilityState === "visible") {
            SyncManager.triggerAutoSync(playerState, "resume");
          }
        }));
        window.addEventListener("focus", (() => {
          SyncManager.triggerAutoSync(playerState, "resume");
        }));
        BlurPlaybackManager.initGlobal(playerState);
        const floatingButton = new FloatingButton({
          "playerState": playerState
        });
        floatingButton.init();
        initAutoLogin().then((loginManager => {
          if (loginManager) {
            window.loginManager = loginManager;
          }
        })).catch((() => {}));
      } catch (error) {}
    }
    function handleJavLibraryVerification() {
      const isIframeBroker = isInIframe;
      const startTime = Date.now();
      let reported = false;
      logger.log(`检测到运行在 JAVLibrary 域名上，启动验证协同助手。${isIframeBroker ? " (iframe broker 模式)" : ""}`);
      CrossDomainBridge.startBroker("JAVLIBRARY", {
        "FETCH_JAVLIB_DATA": async payload => {
          const {"avcode": avcode, "page": page} = payload;
          logger.log(`[ShadowBroker] 收到 JAVLibrary 同源抓取请求: ${avcode}, Page: ${page}`);
          const idResult = await fetchJavLibraryVideoId(avcode);
          const {"videoId": videoId, "domain": domain} = idResult;
          const [cRes, rRes] = await Promise.all([ fetchJavLibraryData(videoId, "comments", page, domain), fetchJavLibraryData(videoId, "reviews", page, domain) ]);
          return {
            "idResult": idResult,
            "cRes": cRes,
            "rRes": rRes
          };
        }
      });
      function checkBypass() {
        const hasLogo = document.querySelector("#logo") || document.querySelector("#right") || document.querySelector("#top_bar") || document.title.includes("JAVLibrary");
        const isChallenged = document.querySelector("#cf-challenge") || document.querySelector("#turnstile-wrapper") || document.body.innerHTML.includes("Checking your browser") || document.body.innerHTML.includes("cf-challenge");
        logger.log(`检测验证状态中... hasLogo = ${!!hasLogo}, isChallenged = ${!!isChallenged}${isIframeBroker ? " (iframe)" : ""}`);
        if (hasLogo && !isChallenged) {
          if (!reported) {
            reported = true;
            telemetry.track("javlib_cf_bypass", {
              "success": true,
              "duration_ms": Date.now() - startTime,
              "is_iframe": isIframeBroker
            });
          }
          logger.log("JAVLibrary 页面加载成功（未被拦截/验证已通过）。");
          if (typeof GM_setValue === "function") {
            const domainKey = window.location.origin;
            let cookiesMap = {};
            if (typeof GM_getValue === "function") {
              cookiesMap = GM_getValue("javlib_cookies") || {};
            }
            cookiesMap[domainKey] = document.cookie;
            GM_setValue("javlib_cookies", cookiesMap);
            GM_setValue("javlib_user_agent", navigator.userAgent);
            GM_setValue("javlib_verified_time", Date.now());
            logger.log(`Cookie 已保存至跨域存储: ${domainKey}, UA: ${navigator.userAgent}`);
          }
          if (isIframeBroker) {
            logger.log("iframe broker 模式：页面验证通过，保持 iframe 存活以持续提供同源代理服务。");
          } else {
            const isVerificationTab = window.location.href.includes("cf_verify") || typeof GM_getValue === "function" && GM_getValue("javlib_verifying") === true;
            if (isVerificationTab) {
              logger.log("正在释放验证锁...");
              if (typeof GM_setValue === "function") {
                GM_setValue("javlib_verifying", false);
              }
              logger.log("保持协同验证标签页开启，以作为影子 Broker 持续在后台提供同源代理服务。");
            }
          }
          return true;
        }
        return false;
      }
      if (!checkBypass()) {
        const interval = setInterval((() => {
          if (checkBypass()) {
            clearInterval(interval);
          }
        }), 1e3);
        const maxWait = isIframeBroker ? 6e4 : 3e4;
        setTimeout((() => {
          clearInterval(interval);
          if (!reported) {
            reported = true;
            telemetry.track("javlib_cf_bypass", {
              "success": false,
              "duration_ms": Date.now() - startTime,
              "is_iframe": isIframeBroker
            });
          }
        }), maxWait);
      }
    }
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(startScript, 100);
    } else {
      document.addEventListener("DOMContentLoaded", (() => setTimeout(startScript, 100)));
    }
  })();
})();