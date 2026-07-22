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
// @version 5.1.6
// @author Chris_C
// @match *://*.missav.ws/*
// @match *://*.missav.ai/*
// @match *://*.jable.tv/*
// @match *://*/*
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
  var r = {
    "12": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `.tm-comments-panel{\n    position:relative;\n    width:100%;\n    flex:1;\n    min-height:0;\n    background-color:transparent;\n    z-index:9990;\n    display:flex;\n    flex-direction:column;\n    box-sizing:border-box;\n    overflow:hidden;\n    pointer-events:none;\n    font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;\n}\n.tm-comments-panel::after{\n    content:'';\n    position:absolute;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:rgba(0, 0, 0, 0.45);\n    pointer-events:none;\n    opacity:0;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);\n    z-index:9993;\n}\n.tm-handle-container::after{\n    content:'';\n    position:absolute;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:rgba(0, 0, 0, 0.45);\n    pointer-events:none;\n    opacity:0;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);\n    z-index:9993;\n}\n\n.tm-handle-container.is-dimmed::after,\n.tm-player-container:has(.tm-comments-panel.is-dimmed) .tm-handle-container::after{\n    opacity:1;\n}\n\n.tm-comments-panel.is-dimmed::after{\n    opacity:1;\n    pointer-events:auto;\n}\n.tm-comments-panel-action-bar{\n    position:relative;\n    flex:0 0 auto;\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    width:100%;\n    height:calc(26px + env(safe-area-inset-bottom, 0px));\n    padding:0 16px calc(0px + env(safe-area-inset-bottom, 0px)) 16px;\n    box-sizing:border-box;\n    background-color:rgba(10, 10, 12, 0.98);\n    border-top:1px solid rgba(255, 255, 255, 0.05);\n    pointer-events:auto;\n    font-size:0.72rem;\n    line-height:1;\n    color:rgba(255, 255, 255, 0.45);\n    z-index:9995;\n    white-space:nowrap;\n}\n\n.tm-comments-panel-action-bar .tm-action-bar-left{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:100%;\n    flex:1;\n    min-width:0;\n    overflow:hidden;\n    white-space:nowrap;\n}\n\n.tm-comments-panel-action-bar .tm-action-bar-right{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:100%;\n    flex-shrink:0;\n    white-space:nowrap;\n}\n\n.tm-comments-panel-action-bar .tm-comment-count{\n    font-weight:400;\n    color:rgba(255, 255, 255, 0.45);\n    line-height:1;\n    white-space:nowrap;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    min-width:0;\n}\n\n.tm-comment-copy-all-btn{\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.1);\n    border-radius:10px;\n    color:rgba(255, 255, 255, 0.55);\n    font-size:0.7rem;\n    padding:2px 8px;\n    cursor:pointer;\n    transition:all 0.15s;\n    outline:none;\n    line-height:1;\n    display:inline-flex;\n    align-items:center;\n    flex-shrink:0;\n    white-space:nowrap;\n}\n.tm-comment-copy-all-btn:hover{\n    color:#ffffff;\n    background:rgba(255, 255, 255, 0.12);\n}\n\n.tm-comments-panel-action-bar .tm-comment-filter-label{\n    display:flex;\n    align-items:center;\n    gap:5px;\n    cursor:pointer;\n    user-select:none;\n    color:rgba(255, 255, 255, 0.55);\n    font-size:0.7rem;\n    line-height:1;\n    transition:color 0.15s;\n    flex-shrink:0;\n    white-space:nowrap;\n}\n.tm-comments-panel-action-bar .tm-comment-filter-label:hover{\n    color:#ffffff;\n}\n.tm-tag-checkbox,\n.tm-comment-filter-checkbox{\n    appearance:none;\n    -webkit-appearance:none;\n    width:18px;\n    height:18px;\n    border-radius:50%;\n    border:1.5px solid rgba(255, 255, 255, 0.3);\n    background:rgba(255, 255, 255, 0.06);\n    cursor:pointer;\n    flex-shrink:0;\n    position:relative;\n    outline:none;\n    transition:background 0.15s, border-color 0.15s, transform 0.12s;\n    margin:0;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n}\n\n.tm-tag-checkbox:hover,\n.tm-comment-filter-checkbox:hover{\n    border-color:rgba(255, 255, 255, 0.6);\n}\n\n.tm-tag-checkbox:checked,\n.tm-comment-filter-checkbox:checked{\n    background:hsl(var(--shadcn-blue));\n    border-color:hsl(var(--shadcn-blue));\n}\n\n.tm-tag-checkbox:checked::after,\n.tm-comment-filter-checkbox:checked::after{\n    content:'';\n    width:4px;\n    height:8px;\n    border:solid #ffffff;\n    border-width:0 2px 2px 0;\n    transform:rotate(45deg) translate(-0.5px, -1px);\n    display:block;\n}\n.tm-comments-panel-list.tm-comments-list{\n    flex:1;\n    min-height:0;\n    width:100%;\n    max-height:none;\n    overflow-y:auto;\n    box-sizing:border-box;\n    padding:8px 16px 0px 16px;\n    mask-image:linear-gradient(to bottom, transparent 0px, rgba(0, 0, 0, 0.05) 4px, black 16px);\n    -webkit-mask-image:linear-gradient(to bottom, transparent 0px, rgba(0, 0, 0, 0.05) 4px, black 16px);\n    display:flex;\n    flex-direction:column;\n    align-items:stretch;\n    gap:8px;\n    -webkit-overflow-scrolling:touch;\n    pointer-events:auto;\n    background-color:transparent;\n    overscroll-behavior-y:contain;\n}\n.tm-comments-panel-list.tm-comments-list::-webkit-scrollbar{\n    width:4px;\n}\n\n.tm-comments-panel-list.tm-comments-list::-webkit-scrollbar-thumb{\n    background:hsla(var(--shadcn-muted-foreground) / 0.25);\n    border-radius:2px;\n}\n.tm-comment-submit-bar-wrapper{\n    position:relative;\n    flex:0 0 auto;\n    width:100%;\n    padding:8px 16px 8px 16px;\n    box-sizing:border-box;\n    background:linear-gradient(to top, rgba(10, 10, 12, 0.98) 0%, rgba(10, 10, 12, 0.85) 60%, rgba(10, 10, 12, 0) 100%);\n    border-top:none;\n    z-index:9996;\n    pointer-events:auto;\n}\n\n.tm-comment-submit-bar{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    background:transparent;\n    border:none;\n    padding:0;\n    box-sizing:border-box;\n    width:100%;\n    max-width:650px;\n    margin:0 auto;\n}\n\n.tm-comment-add-tag-btn{\n    width:34px;\n    height:34px;\n    border-radius:50%;\n    border:1px solid rgba(255, 255, 255, 0.15);\n    background:rgba(255, 255, 255, 0.08);\n    color:rgba(255, 255, 255, 0.85);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    flex-shrink:0;\n    transition:background 0.2s, transform 0.15s, color 0.2s;\n    outline:none;\n    padding:0;\n    margin:0;\n    box-sizing:border-box;\n}\n.tm-comment-add-tag-btn:hover{\n    background:rgba(255, 255, 255, 0.18);\n    color:#ffffff;\n    transform:scale(1.05);\n}\n.tm-comment-add-tag-btn svg{\n    width:14px;\n    height:14px;\n    display:block;\n}\n\n.tm-comment-text-input{\n    flex:1;\n    min-width:0;\n    height:34px;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.08);\n    border-radius:17px;\n    padding:0 14px;\n    color:#ffffff;\n    font-size:0.85rem;\n    outline:none;\n    box-sizing:border-box;\n    transition:border-color 0.2s, background 0.2s;\n}\n.tm-comment-text-input:focus{\n    border-color:rgba(255, 255, 255, 0.25);\n    background:rgba(255, 255, 255, 0.1);\n}\n.tm-comment-text-input::placeholder{\n    color:rgba(255, 255, 255, 0.35);\n}\n\n.tm-comment-send-btn{\n    height:34px;\n    padding:0 18px;\n    border-radius:17px;\n    border:1px solid rgba(255, 255, 255, 0.2);\n    background:rgba(255, 255, 255, 0.12);\n    color:#ffffff;\n    font-size:0.85rem;\n    font-weight:600;\n    cursor:pointer;\n    flex-shrink:0;\n    transition:background 0.2s, transform 0.15s;\n    outline:none;\n}\n.tm-comment-send-btn:hover{\n    background:rgba(255, 255, 255, 0.22);\n    transform:scale(1.03);\n}\n.tm-comment-tag-select-modal{\n    position:absolute;\n    bottom:calc(100% + 4px);\n    left:16px;\n    right:16px;\n    width:calc(100% - 32px);\n    max-width:650px;\n    margin:0 auto;\n    max-height:280px;\n    background:rgba(18, 18, 20, 0.96);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    border-radius:16px;\n    border:1px solid rgba(255, 255, 255, 0.12);\n    box-shadow:0 -8px 32px rgba(0, 0, 0, 0.6);\n    padding:10px 14px;\n    box-sizing:border-box;\n    display:flex;\n    flex-direction:column;\n    z-index:9996;\n    opacity:0;\n    pointer-events:none;\n    transform:translateY(16px);\n    transition:opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.tm-comment-tag-select-modal.visible{\n    opacity:1;\n    pointer-events:auto;\n    transform:translateY(0);\n}\n\n.tm-tag-select-header{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    padding-bottom:8px;\n    margin-bottom:6px;\n    border-bottom:1px solid rgba(255, 255, 255, 0.08);\n    flex-shrink:0;\n}\n\n.tm-tag-select-btn-group{\n    display:flex;\n    align-items:center;\n    gap:8px;\n}\n\n.tm-tag-select-all-btn{\n    padding:3px 12px;\n    border-radius:12px;\n    background:rgba(255, 80, 80, 0.18);\n    border:1px solid rgba(255, 80, 80, 0.45);\n    color:#ff6b6b;\n    font-size:0.78rem;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background 0.15s;\n}\n.tm-tag-select-all-btn:hover{\n    background:rgba(255, 80, 80, 0.3);\n}\n\n.tm-tag-deselect-all-btn{\n    padding:3px 12px;\n    border-radius:12px;\n    background:rgba(255, 255, 255, 0.08);\n    border:1px solid rgba(255, 255, 255, 0.18);\n    color:rgba(255, 255, 255, 0.8);\n    font-size:0.78rem;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background 0.15s;\n}\n.tm-tag-deselect-all-btn:hover{\n    background:rgba(255, 255, 255, 0.15);\n}\n\n.tm-tag-select-close-btn{\n    background:transparent;\n    border:none;\n    color:rgba(255, 255, 255, 0.5);\n    font-size:0.95rem;\n    cursor:pointer;\n    padding:0 4px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    transition:color 0.15s;\n}\n.tm-tag-select-close-btn:hover{\n    color:#ffffff;\n}\n\n.tm-tag-select-list{\n    flex:1;\n    overflow-y:auto;\n    display:flex;\n    flex-direction:column;\n    gap:6px;\n    padding-right:2px;\n}\n.tm-tag-select-list::-webkit-scrollbar{\n    width:4px;\n}\n.tm-tag-select-list::-webkit-scrollbar-thumb{\n    background:rgba(255, 255, 255, 0.2);\n    border-radius:2px;\n}\n\n.tm-tag-select-item{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:32px;\n    box-sizing:border-box;\n}\n\n.tm-tag-checkbox{\n    width:18px;\n    height:18px;\n    accent-color:#ff5252;\n    cursor:pointer;\n    flex-shrink:0;\n}\n\n.tm-tag-remark-input{\n    flex:1;\n    min-width:0;\n    height:32px;\n    box-sizing:border-box;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.1);\n    border-radius:8px;\n    padding:0 10px;\n    color:#ffffff;\n    font-size:0.82rem;\n    outline:none;\n    display:inline-flex;\n    align-items:center;\n    transition:border-color 0.2s, background 0.2s;\n}\n.tm-tag-remark-input:focus{\n    border-color:rgba(255, 255, 255, 0.3);\n    background:rgba(255, 255, 255, 0.1);\n}\n.tm-tag-remark-input::placeholder{\n    color:rgba(255, 255, 255, 0.3);\n}\n\n.tm-tag-select-empty{\n    padding:16px;\n    text-align:center;\n    font-size:0.82rem;\n    color:rgba(255, 255, 255, 0.35);\n}\n.tm-custom-modal-overlay{\n    position:fixed;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:rgba(0, 0, 0, 0.4);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    z-index:2000000020 !important;\n    opacity:0;\n    transition:opacity 0.25s ease;\n    pointer-events:auto;\n}\n\n.tm-custom-modal-overlay.active{\n    opacity:1;\n}\n\n.tm-custom-modal-content{\n    background-color:hsl(var(--shadcn-card));\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    border-radius:16px;\n    padding:24px;\n    width:85%;\n    max-width:280px;\n    text-align:center;\n    box-shadow:0 10px 30px rgba(0, 0, 0, 0.3);\n    transform:scale(0.9);\n    transition:transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-custom-modal-overlay.active .tm-custom-modal-content{\n    transform:scale(1);\n}\n\n.tm-custom-modal-title{\n    font-size:15px;\n    font-weight:700;\n    margin-bottom:6px;\n}\n\n.tm-custom-modal-message{\n    font-size:13px;\n    color:hsl(var(--shadcn-muted-foreground));\n    margin-bottom:18px;\n    line-height:1.4;\n}\n\n.tm-custom-modal-close-btn{\n    background-color:hsl(var(--shadcn-blue));\n    color:#ffffff;\n    border:none;\n    border-radius:18px;\n    padding:7px 28px;\n    font-size:12px;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    box-shadow:0 4px 10px hsla(var(--shadcn-blue) / 0.3);\n    transition:all 0.2s;\n}\n\n.tm-custom-modal-close-btn:hover{\n    background-color:hsl(var(--shadcn-blue) / 0.9);\n    transform:translateY(-1px);\n}\n\n.tm-custom-modal-close-btn:active{\n    transform:scale(0.95);\n}\n.jc-hdr{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    width:100%;\n    margin-bottom:3px;\n    box-sizing:border-box;\n}\n\n.jc-hdr-left{\n    display:flex;\n    align-items:center;\n    gap:6px;\n    flex-shrink:0;\n}\n\n.jc-hdr-right{\n    display:flex;\n    align-items:center;\n    gap:6px;\n    min-width:0;\n}\n.jc-site{\n    font-size:8px;\n    padding:1px 4px;\n    border-radius:4px;\n    background-color:hsla(var(--shadcn-blue) / 0.1);\n    color:hsl(var(--shadcn-blue));\n    font-weight:700;\n    border:1px solid hsla(var(--shadcn-blue) / 0.25);\n    text-transform:uppercase;\n    line-height:1;\n}\n\n.jc-site-jable{\n    background-color:hsla(340, 82%, 52%, 0.1);\n    color:hsl(340, 82%, 52%);\n    border:1px solid hsla(340, 82%, 52%, 0.25);\n}\n\n.jc-site-javlib{\n    background-color:hsla(210, 100%, 50%, 0.1);\n    color:hsl(210, 100%, 50%);\n    border:1px solid hsla(210, 100%, 50%, 0.25);\n}\n.jc-skeleton{\n    pointer-events:none;\n}\n\n.jc-skeleton .skeleton-block{\n    background:hsla(var(--shadcn-muted-foreground) / 0.15);\n    border-radius:4px;\n    animation:skeleton-loading 1.5s infinite ease-in-out;\n}\n\n@keyframes skeleton-loading{\n    0%{\n        opacity:0.55;\n    }\n    50%{\n        opacity:1;\n    }\n    100%{\n        opacity:0.55;\n    }\n}\n.jc-card{\n    display:flex;\n    flex-direction:column;\n    padding:5px 0;\n    background-color:transparent;\n    border:none;\n    border-bottom:1px solid rgba(255, 255, 255, 0.04);\n    transition:opacity 0.2s;\n    margin-bottom:6px;\n    text-align:left;\n    width:100%;\n    box-sizing:border-box;\n}\n\n.jc-card .jc-bd{\n    width:100%;\n}\n\n.jc-card .jc-u{\n    font-weight:500;\n    color:rgba(255, 255, 255, 0.65);\n    text-decoration:none;\n    max-width:140px;\n    white-space:nowrap;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    font-size:12.5px;\n    display:inline-block;\n    vertical-align:middle;\n    transition:color var(--anim-quick);\n}\n\n.jc-card a.jc-u:hover{\n    text-decoration:underline;\n    color:hsl(var(--shadcn-blue));\n}\n\n.jc-card .jc-t{\n    color:rgba(255, 255, 255, 0.4);\n    font-size:11px;\n    display:inline-block;\n    vertical-align:middle;\n}\n\n.jc-card .jc-body-text{\n    font-size:14.5px;\n    line-height:1.55;\n    letter-spacing:0.01em;\n    color:rgba(255, 255, 255, 0.88);\n    overflow-wrap:anywhere;\n    word-break:break-word;\n    margin-top:4px;\n}\n.jc-c-sep{\n    color:rgba(255, 255, 255, 0.25);\n    margin:0 4px;\n    font-weight:normal;\n    display:inline-block;\n    vertical-align:middle;\n}\n.jc-card.jc-spam{\n    opacity:0.35;\n    background-color:transparent;\n}\n\n.jc-card.jc-spam:hover{\n    opacity:0.75;\n}\n\n.jc-spam-badge{\n    background-color:hsla(var(--shadcn-destructive) / 0.8);\n    color:hsl(var(--shadcn-destructive-foreground));\n    font-size:8px;\n    padding:1px 4px;\n    border-radius:3px;\n    font-weight:600;\n    margin-left:4px;\n    display:inline-block;\n    vertical-align:middle;\n}\n.jc-time-link{\n    color:hsl(142.1 70.6% 45.3%);\n    font-weight:700;\n    cursor:pointer;\n    text-decoration:none;\n    transition:all 0.2s ease;\n    padding:2px 6px;\n    background-color:hsla(142.1 70.6% 45.3% / 0.16);\n    border:1px solid hsla(142.1 70.6% 45.3% / 0.25);\n    border-radius:4px;\n    display:inline-block;\n    margin:0 2px;\n    font-family:monospace;\n    font-size:12.5px;\n}\n\n.jc-time-link:hover{\n    background-color:hsla(142.1 70.6% 45.3% / 0.25);\n    color:hsl(142.1 76.2% 36.3%);\n    box-shadow:0 1px 4px hsla(142.1 70.6% 45.3% / 0.15);\n}\n\n.jc-code-link{\n    display:inline-block;\n    padding:2px 6px;\n    margin:0 2px;\n    background-color:hsla(var(--shadcn-blue) / 0.16);\n    border:1px solid hsla(var(--shadcn-blue) / 0.35);\n    color:hsl(var(--shadcn-blue));\n    border-radius:4px;\n    font-weight:700;\n    cursor:pointer;\n    font-size:12px;\n    font-family:monospace;\n    transition:all 0.2s ease;\n}\n\n.jc-code-link:hover{\n    background-color:hsl(var(--shadcn-blue));\n    color:hsl(var(--shadcn-blue-foreground));\n    box-shadow:0 2px 6px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.jc-emoji{\n    height:16px;\n    width:16px;\n    vertical-align:middle;\n    display:inline-block;\n    margin:0 1px;\n}\n.tm-comment-loading,\n.tm-comment-error{\n    width:100%;\n    padding:24px;\n    text-align:center;\n    font-size:12px;\n    color:hsl(var(--shadcn-muted-foreground));\n    box-sizing:border-box;\n    pointer-events:auto;\n    background-color:transparent;\n    flex:1;\n}\n\n.tm-comment-error{\n    color:hsl(var(--shadcn-destructive));\n}\n\n.tm-comment-loader-graphic{\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    gap:5px;\n    padding:16px;\n    width:100%;\n}\n\n.tm-comment-loader-graphic .dot{\n    width:6px;\n    height:6px;\n    border-radius:50%;\n    background-color:hsl(var(--shadcn-blue));\n    animation:tmDotPulse 1.4s infinite ease-in-out both;\n}\n\n.tm-comment-loader-graphic .dot:nth-child(1){\n    animation-delay:-0.32s;\n}\n\n.tm-comment-loader-graphic .dot:nth-child(2){\n    animation-delay:-0.16s;\n}\n\n@keyframes tmDotPulse{\n    0%, 80%, 100%{\n        transform:scale(0);\n        opacity:0.3;\n    }\n    40%{\n        transform:scale(1);\n        opacity:1;\n    }\n}\n\n@keyframes tmShake{\n    0%, 100%{ transform:translateX(0); }\n    20%, 60%{ transform:translateX(-4px); }\n    40%, 80%{ transform:translateX(4px); }\n}\n.tm-comments-tabs{\n    display:flex;\n    align-items:center;\n    justify-content:flex-start;\n    gap:8px;\n    padding:8px 16px;\n    background-color:hsla(var(--shadcn-card) / 0.65);\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    pointer-events:auto;\n    z-index:9994;\n    overflow-x:auto;\n    scrollbar-width:none;\n    overscroll-behavior:contain;\n    touch-action:pan-x;\n}\n.tm-comments-tabs::-webkit-scrollbar{\n    display:none;\n}\n\n.tm-comments-tab-btn{\n    padding:6px 14px;\n    font-size:12px;\n    font-weight:500;\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:transparent;\n    border:1px solid transparent;\n    border-radius:16px;\n    cursor:pointer;\n    white-space:nowrap;\n    outline:none;\n    transition:all var(--anim-quick);\n}\n\n.tm-comments-tab-btn:hover{\n    color:hsl(var(--shadcn-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n}\n\n.tm-comments-tab-btn.active{\n    color:#ffffff;\n    background-color:hsl(var(--shadcn-blue));\n    border-color:hsl(var(--shadcn-blue));\n    box-shadow:0 2px 8px hsla(var(--shadcn-blue) / 0.3);\n    font-weight:600;\n}\n.jc-score-badge{\n    display:inline-block;\n    font-size:10px;\n    color:hsl(var(--shadcn-blue));\n    background-color:hsla(var(--shadcn-blue) / 0.1);\n    border:1px solid hsla(var(--shadcn-blue) / 0.3);\n    border-radius:4px;\n    padding:0 4px;\n    margin-left:6px;\n    font-weight:600;\n    vertical-align:middle;\n}\n@media (orientation: landscape){\n    .tm-comments-panel{\n        position:absolute !important;\n        width:0 !important;\n        height:0 !important;\n        overflow:hidden !important;\n        visibility:hidden !important;\n        pointer-events:none !important;\n        opacity:0 !important;\n        border:none !important;\n        margin:0 !important;\n        padding:0 !important;\n    }\n}\n.jc-body-text--collapsible{\n    position:relative;\n    display:flex;\n    flex-direction:column;\n}\n.jc-body-text--collapsible[data-collapsed="true"]{\n    cursor:pointer;\n}\n\n.jc-body-text--collapsible[data-collapsed="true"] .jc-body-text-content{\n    max-height:80px;\n    overflow:hidden;\n    mask-image:linear-gradient(to bottom, black 50%, transparent 100%);\n    -webkit-mask-image:linear-gradient(to bottom, black 50%, transparent 100%);\n}\n\n.jc-toggle-expand-btn{\n    align-self:flex-start;\n    background:transparent;\n    border:none;\n    color:hsl(var(--shadcn-blue));\n    font-size:11px;\n    font-weight:600;\n    padding:4px 0;\n    cursor:pointer;\n    outline:none;\n    transition:opacity 0.2s;\n    pointer-events:auto;\n}\n\n.jc-toggle-expand-btn:hover{\n    opacity:0.8;\n    text-decoration:underline;\n}\n\n.jc-site-javlib-review{\n    background-color:hsla(270, 100%, 60%, 0.1);\n    color:hsl(270, 100%, 60%);\n    border:1px solid hsla(270, 100%, 60%, 0.25);\n}\n.tm-comment-section{\n    display:flex;\n    flex-direction:column;\n    width:100%;\n    margin-bottom:6px;\n    box-sizing:border-box;\n    min-height:0;\n    flex:0 0 auto;\n    transition:flex 0.25s cubic-bezier(0.25, 1, 0.5, 1);\n}\n\n.tm-comment-section:not(.is-collapsed){\n    flex:1;\n}\n\n.tm-comment-section-body{\n    flex:1;\n    min-height:0;\n    overflow-y:auto;\n    -webkit-overflow-scrolling:touch;\n    overscroll-behavior-y:contain;\n    padding-right:4px;\n    padding-bottom:56px;\n}\n.tm-comment-section-body::-webkit-scrollbar{\n    width:4px;\n}\n\n.tm-comment-section-body::-webkit-scrollbar-thumb{\n    background:hsla(var(--shadcn-muted-foreground) / 0.25);\n    border-radius:2px;\n}\n\n#tm-comment-section-jable{\n    border-left:3px solid hsl(var(--shadcn-red));\n    background:linear-gradient(to right, hsla(var(--shadcn-red) / 0.05), transparent);\n    padding-left:6px;\n    padding-right:4px;\n    padding-top:2px;\n    padding-bottom:2px;\n    border-radius:var(--shadcn-radius-sm);\n}\n#tm-comment-section-jable .tm-comment-section-title{\n    color:hsl(var(--shadcn-red)) !important;\n}\n\n#tm-comment-section-javlib{\n    border-left:3px solid hsl(var(--shadcn-purple));\n    background:linear-gradient(to right, hsla(var(--shadcn-purple) / 0.05), transparent);\n    padding-left:6px;\n    padding-right:4px;\n    padding-top:2px;\n    padding-bottom:2px;\n    border-radius:var(--shadcn-radius-sm);\n}\n#tm-comment-section-javlib .tm-comment-section-title{\n    color:hsl(var(--shadcn-purple)) !important;\n}\n\n#tm-comment-section-javdb{\n    border-left:3px solid hsl(var(--shadcn-blue));\n    background:linear-gradient(to right, hsla(var(--shadcn-blue) / 0.05), transparent);\n    padding-left:6px;\n    padding-right:4px;\n    padding-top:2px;\n    padding-bottom:2px;\n    border-radius:var(--shadcn-radius-sm);\n}\n#tm-comment-section-javdb .tm-comment-section-title{\n    color:hsl(var(--shadcn-blue)) !important;\n}\n\n.tm-comment-section-hdr{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    width:100%;\n    padding:1px 0;\n    margin-bottom:4px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    box-sizing:border-box;\n    cursor:pointer;\n    user-select:none;\n}\n\n.tm-comment-section-title{\n    font-size:13px;\n    font-weight:600;\n    color:hsl(var(--shadcn-foreground));\n    display:flex;\n    align-items:center;\n    gap:6px;\n}\n\n.tm-comment-login-badge{\n    display:inline-flex;\n    align-items:center;\n    gap:4px;\n    padding:2px 8px;\n    border-radius:12px;\n    font-size:10px;\n    font-weight:600;\n    line-height:1;\n    transition:all 0.2s ease;\n}\n\n.tm-comment-login-badge.is-logged-in{\n    color:hsl(142.1 70.6% 45.3%);\n    background-color:hsla(142.1 70.6% 45.3% / 0.1);\n    border:1px solid hsla(142.1 70.6% 45.3% / 0.2);\n    cursor:default;\n}\n\n.tm-comment-login-badge.is-not-logged-in{\n    color:hsl(30 100% 50%);\n    background-color:hsla(30 100% 50% / 0.1);\n    border:1px solid hsla(30 100% 50% / 0.25);\n    cursor:pointer;\n}\n\n.tm-comment-login-badge.is-not-logged-in:hover{\n    background-color:hsla(30 100% 50% / 0.2);\n    transform:translateY(-0.5px);\n    box-shadow:0 2px 6px hsla(30 100% 50% / 0.15);\n}\n\n.tm-comment-login-badge.is-not-logged-in:active{\n    transform:scale(0.95);\n}\n\n.tm-comment-login-badge.is-checking{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    cursor:default;\n}\n\n.tm-comment-status-badge{\n    display:inline-flex;\n    align-items:center;\n    gap:4px;\n    padding:2px 8px;\n    border-radius:12px;\n    font-size:10px;\n    font-weight:600;\n    line-height:1;\n}\n.tm-status-badge-loading{\n    color:hsl(var(--shadcn-blue));\n    background-color:hsla(var(--shadcn-blue) / 0.1);\n    border:1px solid hsla(var(--shadcn-blue) / 0.2);\n    animation:tmPulse 2s infinite ease-in-out;\n}\n\n.tm-status-badge-unreachable{\n    color:hsl(var(--shadcn-destructive));\n    background-color:hsla(var(--shadcn-destructive) / 0.1);\n    border:1px solid hsla(var(--shadcn-destructive) / 0.2);\n}\n\n.tm-status-badge-not_found{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n}\n\n.tm-status-badge-mobile_unsupported{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n}\n\n.tm-status-badge-empty{\n    color:hsl(var(--shadcn-muted-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n}\n\n.tm-status-badge-cf_shield{\n    color:hsl(30 100% 50%);\n    background-color:hsla(30 100% 50% / 0.1);\n    border:1px solid hsla(30 100% 50% / 0.2);\n}\n\n.tm-status-badge-loaded{\n    color:hsl(142.1 70.6% 45.3%);\n    background-color:hsla(142.1 70.6% 45.3% / 0.1);\n    border:1px solid hsla(142.1 70.6% 45.3% / 0.2);\n}\n\n@keyframes tmPulse{\n    0%{\n        opacity:0.7;\n    }\n    50%{\n        opacity:1;\n    }\n    100%{\n        opacity:0.7;\n    }\n}\n\n.jc-comment-link{\n    color:hsl(var(--shadcn-blue));\n    text-decoration:underline;\n}\n.jc-comment-link:hover{\n    color:hsl(var(--shadcn-blue) / 0.8);\n}\n\n.tm-comment-copy-all-btn{\n    margin-left:10px;\n    cursor:pointer;\n    background-color:hsla(var(--shadcn-muted) / 0.15);\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    border-radius:4px;\n    padding:2px 8px;\n    font-size:10px;\n    font-weight:600;\n    color:hsl(var(--shadcn-muted-foreground));\n    outline:none;\n    transition:all var(--anim-quick);\n}\n.tm-comment-copy-all-btn:hover{\n    color:hsl(var(--shadcn-foreground));\n    background-color:hsla(var(--shadcn-muted) / 0.3);\n    border-color:hsla(var(--shadcn-border) / 0.4);\n}\n.tm-comment-copy-all-btn:active{\n    transform:scale(0.95);\n}\n@keyframes jcCardHighlightFlash{\n    0%{\n        background-color:hsla(var(--shadcn-blue) / 0.22);\n    }\n    100%{\n        background-color:transparent;\n    }\n}\n.jc-card-highlight-flash{\n    animation:jcCardHighlightFlash 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;\n}\n@media screen and (min-width: 930px) and (orientation: landscape){\n    .tm-comments-panel:hover::after{\n        opacity:0 !important;\n        pointer-events:none !important;\n    }\n}\n.tm-show-controls-float-btn{\n    position:absolute;\n    bottom:calc(96px + env(safe-area-inset-bottom, 0px));\n    right:16px;\n    width:36px;\n    height:36px;\n    border-radius:50%;\n    background:rgba(18, 18, 20, 0.85);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    color:rgba(255, 255, 255, 0.85);\n    display:none;\n    align-items:center;\n    justify-content:center;\n    box-shadow:0 4px 12px rgba(0, 0, 0, 0.4);\n    z-index:9997;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n    padding:0;\n    outline:none;\n    box-sizing:border-box;\n    pointer-events:auto;\n}\n.tm-show-controls-float-btn:hover{\n    color:#ffffff;\n    background:rgba(255, 255, 255, 0.2);\n    transform:scale(1.06);\n}\n.tm-show-controls-float-btn:active{\n    transform:scale(0.92);\n}\n.tm-show-controls-float-btn svg{\n    height:18px;\n    width:auto;\n    display:block;\n    fill:none !important;\n}\n.tm-show-controls-float-btn svg path{\n    fill:currentColor !important;\n    stroke:none !important;\n}\nbody.controls-hidden:not(.tm-mode-pc):not(.tm-mode-ipad-portrait) .tm-show-controls-float-btn{\n    display:flex;\n}\n\n\n\n`, "" ]);
      const y = b;
    },
    "56": (r, o, a) => {
      function setAttributesWithoutAttributes(r) {
        var o = true ? a.nc : 0;
        if (o) {
          r.setAttribute("nonce", o);
        }
      }
      r.exports = setAttributesWithoutAttributes;
    },
    "72": r => {
      var o = [];
      function getIndexByIdentifier(r) {
        var a = -1;
        for (var l = 0; l < o.length; l++) {
          if (o[l].identifier === r) {
            a = l;
            break;
          }
        }
        return a;
      }
      function modulesToDom(r, a) {
        var l = {};
        var u = [];
        for (var p = 0; p < r.length; p++) {
          var v = r[p];
          var b = a.base ? v[0] + a.base : v[0];
          var y = l[b] || 0;
          var C = "".concat(b, " ").concat(y);
          l[b] = y + 1;
          var k = getIndexByIdentifier(C);
          var _ = {
            "css": v[1],
            "media": v[2],
            "sourceMap": v[3],
            "supports": v[4],
            "layer": v[5]
          };
          if (k !== -1) {
            o[k].references++;
            o[k].updater(_);
          } else {
            var E = addElementStyle(_, a);
            a.byIndex = p;
            o.splice(p, 0, {
              "identifier": C,
              "updater": E,
              "references": 1
            });
          }
          u.push(C);
        }
        return u;
      }
      function addElementStyle(r, o) {
        var a = o.domAPI(o);
        a.update(r);
        var l = function updater(o) {
          if (o) {
            if (o.css === r.css && o.media === r.media && o.sourceMap === r.sourceMap && o.supports === r.supports && o.layer === r.layer) {
              return;
            }
            a.update(r = o);
          } else {
            a.remove();
          }
        };
        return l;
      }
      r.exports = function(r, a) {
        a = a || {};
        r = r || [];
        var l = modulesToDom(r, a);
        return function update(r) {
          r = r || [];
          for (var u = 0; u < l.length; u++) {
            var p = l[u];
            var v = getIndexByIdentifier(p);
            o[v].references--;
          }
          var b = modulesToDom(r, a);
          for (var y = 0; y < l.length; y++) {
            var C = l[y];
            var k = getIndexByIdentifier(C);
            if (o[k].references === 0) {
              o[k].updater();
              o.splice(k, 1);
            }
          }
          l = b;
        };
      };
    },
    "113": r => {
      function styleTagTransform(r, o) {
        if (o.styleSheet) {
          o.styleSheet.cssText = r;
        } else {
          while (o.firstChild) {
            o.removeChild(o.firstChild);
          }
          o.appendChild(document.createTextNode(r));
        }
      }
      r.exports = styleTagTransform;
    },
    "140": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `.tm-time-indicator{\n    position:absolute;\n    background-color:hsla(var(--shadcn-card) / 0.8);\n    color:hsl(var(--shadcn-card-foreground));\n    padding:4px 8px;\n    border-radius:4px;\n    font-size:12px;\n    font-weight:500;\n    pointer-events:none;\n    z-index:9995;\n    opacity:0;\n    transform:translateY(-8px);\n    transition:opacity 0.2s, transform 0.2s;\n    box-shadow:0 2px 8px rgba(0, 0, 0, 0.2);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n}\n.tm-volume-control{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    height:40px;\n    padding:0 8px;\n    background-color:transparent;\n    transition:opacity 0.3s ease;\n}\n.tm-volume-control-no-slider{\n    width:auto;\n    padding:0;\n}\n\n.tm-volume-control-no-slider .tm-volume-button{\n    margin:0 8px;\n}\n.tm-volume-button{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    width:32px;\n    height:32px;\n    padding:4px;\n    border:none;\n    border-radius:50%;\n    background:transparent;\n    color:#fff;\n    cursor:pointer;\n    transition:background-color 0.2s ease;\n}\n\n.tm-volume-button:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n}\n\n.tm-volume-button svg{\n    width:20px;\n    height:20px;\n}\n.tm-volume-slider-container{\n    position:relative;\n    width:0;\n    height:40px;\n    display:flex;\n    align-items:center;\n    overflow:hidden;\n    transition:width 0.3s ease;\n    opacity:0;\n}\n@media (hover: hover){\n    .tm-volume-control:hover .tm-volume-slider-container{\n        width:80px;\n        opacity:1;\n    }\n}\n.tm-volume-control.dragging .tm-volume-slider-container{\n    width:80px;\n    opacity:1;\n}\n.tm-volume-slider-track{\n    position:relative;\n    width:100%;\n    height:4px;\n    background-color:hsla(var(--shadcn-secondary) / 0.3);\n    border-radius:2px;\n    cursor:pointer;\n}\n.tm-volume-slider-level{\n    position:absolute;\n    left:0;\n    top:0;\n    height:100%;\n    background-color:#fff;\n    border-radius:2px;\n    pointer-events:none;\n    transition:width 0.1s ease;\n}\n.tm-volume-value{\n    position:absolute;\n    top:-24px;\n    left:50%;\n    transform:translateX(-50%);\n    background-color:hsla(var(--shadcn-secondary) / 0.8);\n    color:#fff;\n    padding:2px 6px;\n    border-radius:4px;\n    font-size:12px;\n    opacity:0;\n    transition:opacity 0.2s ease;\n    pointer-events:none;\n    backdrop-filter:blur(4px);\n}\n.tm-volume-control.dragging .tm-volume-value{\n    opacity:1;\n}\n@media (hover: none){\n    .tm-volume-control{\n        touch-action:none;\n    }\n    \n    .tm-volume-slider-track{\n        height:6px;\n    }\n    \n    .tm-volume-button{\n        width:40px;\n        height:40px;\n    }\n}\n@media (prefers-color-scheme: dark){\n    .tm-volume-slider-level{\n        background-color:hsl(var(--shadcn-primary));\n    }\n    \n    .tm-volume-button svg{\n        stroke:hsl(var(--shadcn-primary));\n    }\n}\n.tm-toggle-switch{\n    position:relative;\n    display:inline-block;\n    width:40px;\n    height:24px;\n}\n\n.tm-toggle-switch input{\n    opacity:0;\n    width:0;\n    height:0;\n}\n\n.tm-toggle-slider{\n    position:absolute;\n    cursor:pointer;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:hsla(var(--shadcn-muted) / 0.7);\n    border-radius:12px;\n    transition:var(--anim-quick);\n}\n\n.tm-toggle-slider:before{\n    position:absolute;\n    content:"";\n    height:20px;\n    width:20px;\n    left:2px;\n    bottom:2px;\n    background-color:hsl(var(--shadcn-foreground));\n    border-radius:50%;\n    transition:var(--anim-quick);\n    box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);\n}\n\n.tm-toggle-slider.checked{\n    background-color:hsl(var(--shadcn-blue));\n}\n\n.tm-toggle-slider.checked:before{\n    transform:translateX(16px);\n}\n.tm-playback-rate-button{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    margin-left:0;\n    height:32px;\n    width:80px;\n    background:hsla(var(--shadcn-secondary) / 0.5);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    color:hsl(var(--shadcn-foreground));\n    font-size:15px;\n    font-weight:600;\n    letter-spacing:-0.1px;\n    border-radius:9999px;\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    box-shadow:0 1px 3px rgba(0, 0, 0, 0.08);\n    transition:all var(--anim-quick);\n    cursor:pointer;\n    text-align:center;\n    box-sizing:border-box;\n    padding:0;\n}\n\n.tm-playback-rate-button:hover{\n    background:hsla(var(--shadcn-secondary) / 0.8);\n    border-color:hsla(var(--shadcn-border) / 0.3);\n    transform:translateY(-1px);\n    box-shadow:var(--shadow-md);\n}\n\n.tm-playback-rate-button:active{\n    transform:scale(0.95);\n    background:hsla(var(--shadcn-secondary) / 0.9);\n}\n.tm-playback-rate-button.fast{\n    color:hsl(var(--shadcn-orange));\n    border-color:hsla(var(--shadcn-orange) / 0.3);\n    background:hsla(var(--shadcn-orange) / 0.1);\n}\n\n.tm-playback-rate-button.medium{\n    color:hsl(var(--shadcn-blue));\n    border-color:hsla(var(--shadcn-blue) / 0.3);\n    background:hsla(var(--shadcn-blue) / 0.1);\n}\n\n.tm-playback-rate-button.normal{\n    color:hsl(var(--shadcn-foreground));\n}\n.tm-progress-controls{\n    position:relative;\n    width:100%;\n    bottom:0;\n    left:0;\n    right:0;\n    display:flex;\n    flex-direction:column;\n    z-index:9991;\n    border-radius:0 0 var(--shadcn-radius-lg) var(--shadcn-radius-lg);\n    font-family:var(--font-sans);\n    transition:opacity var(--anim-smooth);\n}\n.tm-progress-bar-container{\n    position:relative;\n    height:12px;\n    display:flex;\n    align-items:center;\n    cursor:pointer;\n    user-select:none;\n    -webkit-user-select:none;\n    -moz-user-select:none;\n    -ms-user-select:none;\n    touch-action:none;\n}\n.tm-progress-bar{\n    width:100%;\n    height:8px;\n    background-color:hsla(var(--shadcn-muted) / 0.5);\n    border-radius:8px;\n    overflow:hidden;\n    position:relative;\n    transition:height 0.15s;\n}\n\n.tm-progress-bar:hover{\n    height:6px;\n}\n.tm-progress-bar-expanded{\n    height:16px !important;\n}\n\n.tm-progress-bar-normal{\n    height:8px !important;\n}\n.tm-progress-bar.tm-dragging{\n    height:16px !important;\n    background-color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    cursor:grabbing;\n}\n.tm-progress-bar-container:has(.tm-dragging){\n    cursor:grabbing;\n}\n.tm-progress-indicator{\n    height:100%;\n    width:0%;\n    background-color:hsla(var(--shadcn-muted) / 0.8);\n    border-radius:0;\n    position:absolute;\n    left:0;\n    top:0;\n    transition:width 0.1s linear;\n    overflow:hidden;\n}\n.tm-dragging .tm-progress-indicator{\n    background-color:hsl(var(--shadcn-card-foreground));\n    box-shadow:none;\n    transition:none;\n}\n.tm-progress-handle{\n    width:12px;\n    height:12px;\n    background-color:hsl(var(--shadcn-blue));\n    border:2px solid hsl(var(--shadcn-card));\n    border-radius:50%;\n    position:absolute;\n    top:50%;\n    left:0%;\n    transform:translate(0, -50%);\n    z-index:2;\n    opacity:1;\n    transition:opacity 0.15s, width 0.15s, height 0.15s, box-shadow 0.15s;\n    box-shadow:0 0 0 4px hsl(var(--shadcn-blue) / 0.2);\n    cursor:grab;\n}\n\n.tm-progress-handle:hover,\n.tm-progress-handle.dragging{\n    transform:translate(0, -50%) scale(1.1);\n    box-shadow:0 0 0 6px hsl(var(--shadcn-blue) / 0.3);\n}\n.tm-settings-label{\n    cursor:pointer;\n    flex:1;\n    font-family:var(--font-sans);\n    font-size:14px;\n    color:hsl(var(--shadcn-foreground));\n}\n.tm-playback-control-row .tm-control-button,\n.tm-playback-control-row .tm-volume-button{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    padding:0px;\n    border:none;\n    border-radius:50%;\n    background-color:transparent;\n    color:#fff;\n    cursor:pointer;\n    transition:all 0.15s ease;\n    -webkit-tap-highlight-color:transparent;\n}\n\n.tm-playback-control-row .tm-control-button{\n    width:42px;\n    height:42px;\n}\n\n.tm-playback-control-row .tm-volume-button{\n    width:36px;\n    height:36px;\n}\n\n.tm-playback-control-row .tm-control-button:hover,\n.tm-playback-control-row .tm-volume-button:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    transform:scale(1.05);\n}\n\n.tm-playback-control-row .tm-control-button:active,\n.tm-playback-control-row .tm-volume-button:active{\n    transform:scale(0.95);\n}\n\n.tm-playback-control-row .tm-control-button svg{\n    width:24px;\n    height:24px;\n    stroke:currentColor;\n    stroke-width:2;\n    fill:none;\n}\n\n.tm-playback-control-row .tm-volume-button svg{\n    width:20px;\n    height:20px;\n    stroke:currentColor;\n    stroke-width:2;\n    fill:none;\n}\n@media (hover: none){\n    .tm-playback-control-row .tm-control-button{\n        width:44px;\n        height:44px;\n    }\n    .tm-playback-control-row .tm-volume-button{\n        width:40px;\n        height:40px;\n    }\n}\n@media (prefers-color-scheme: dark){\n    .tm-playback-control-row .tm-control-button svg,\n    .tm-playback-control-row .tm-volume-button svg{\n        stroke:hsl(var(--shadcn-secondary-foreground));\n    }\n}\n.tm-time-control-button-hover{\n    background-color:hsl(var(--shadcn-accent) / 0.6);\n    transform:none;\n    box-shadow:0 2px 4px rgba(0,0,0,0.1);\n}\n\n.tm-time-control-button-active{\n    transform:scale(0.95);\n    box-shadow:none;\n}\n\n.tm-time-control-button-default{\n    transform:translateY(0);\n    box-shadow:0 1px 2px rgba(0,0,0,0.05);\n}\n\n.tm-time-control-button-after-active{\n    transform:none;\n    box-shadow:0 2px 5px rgba(0, 0, 0, 0.15);\n}\n.tm-modal-overlay{\n    position:fixed;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n    background-color:hsla(var(--shadcn-background) / 0.7);\n    backdrop-filter:blur(6px);\n    -webkit-backdrop-filter:blur(6px);\n    z-index:2000000010 !important;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    opacity:0;\n    transition:opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    padding:20px;\n    box-sizing:border-box;\n}\n\n.tm-modal-overlay.visible{\n    opacity:1;\n}\n\n.tm-comment-modal{\n    width:100%;\n    max-width:420px;\n    background-color:hsla(var(--shadcn-card) / 0.95);\n    border-radius:12px;\n    box-shadow:0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.12);\n    overflow:hidden;\n    transform:scale(0.95) translateY(10px);\n    opacity:0;\n    transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    flex-direction:column;\n}\n\n.tm-comment-modal.visible{\n    transform:scale(1) translateY(0);\n    opacity:1;\n}\n\n.tm-modal-header{\n    padding:16px 20px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n}\n\n.tm-modal-title{\n    font-size:16px;\n    font-weight:600;\n    margin:0;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-modal-close{\n    background:transparent;\n    border:none;\n    cursor:pointer;\n    width:28px;\n    height:28px;\n    border-radius:50%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    color:hsl(var(--shadcn-muted-foreground));\n    transition:background-color 0.2s, color 0.2s;\n}\n\n.tm-modal-close:hover{\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-modal-content{\n    padding:16px 20px;\n    flex:1;\n}\n\n.tm-comment-textarea{\n    width:100%;\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    border-radius:8px;\n    padding:12px;\n    font-family:var(--font-sans);\n    font-size:14px;\n    line-height:1.5;\n    resize:none;\n    height:120px;\n    box-sizing:border-box;\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    color:hsl(var(--shadcn-foreground));\n    transition:border-color 0.2s, box-shadow 0.2s;\n}\n\n.tm-comment-textarea:focus{\n    outline:none;\n    border-color:hsl(var(--shadcn-blue));\n    box-shadow:0 0 0 2px hsla(var(--shadcn-blue) / 0.2);\n}\n\n.tm-comment-textarea::placeholder{\n    color:hsl(var(--shadcn-muted-foreground));\n}\n\n.tm-comment-textarea.error{\n    border-color:hsl(var(--shadcn-destructive));\n    animation:shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\n}\n\n.tm-modal-footer{\n    padding:12px 20px 16px;\n    border-top:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    justify-content:flex-end;\n    gap:12px;\n}\n\n.tm-modal-button{\n    padding:8px 16px;\n    border-radius:8px;\n    font-size:14px;\n    font-weight:500;\n    border:none;\n    cursor:pointer;\n    transition:all 0.2s;\n}\n\n.tm-modal-cancel{\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    color:hsl(var(--shadcn-secondary-foreground));\n}\n\n.tm-modal-cancel:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    transform:translateY(-1px);\n}\n\n.tm-modal-submit{\n    background-color:hsl(var(--shadcn-blue));\n    color:hsl(var(--shadcn-blue-foreground));\n}\n\n.tm-modal-submit:hover{\n    background-color:hsl(var(--shadcn-blue) / 0.9);\n    transform:translateY(-1px);\n    box-shadow:0 2px 5px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.tm-modal-button:active{\n    transform:scale(0.97);\n}\n\n@media (max-width: 480px){\n    .tm-comment-modal{\n        max-width:100%;\n    }\n    \n    .tm-modal-header,\n    .tm-modal-content,\n    .tm-modal-footer{\n        padding:12px 16px;\n    }\n}\n@media screen and (orientation: landscape){\n    .tm-comment-modal{\n        max-width:500px;\n        max-height:90vh;\n    }\n    \n    .tm-comment-textarea{\n        height:100px;\n    }\n}\n.tm-video-minimap{\n    position:absolute !important;\n    bottom:20px !important;\n    left:20px !important;\n    top:auto !important;\n    right:auto !important;\n    margin:0 !important;\n    transform:none !important;\n    width:80px;\n    height:45px;\n    background-color:rgba(0, 0, 0, 0.65) !important;\n    border:1px solid rgba(255, 255, 255, 0.3) !important;\n    border-radius:4px !important;\n    overflow:hidden !important;\n    z-index:9998 !important;\n    pointer-events:none !important;\n    opacity:0 !important;\n    visibility:hidden !important;\n    transition:opacity 0.3s ease, visibility 0.3s ease !important;\n    backdrop-filter:blur(6px) !important;\n    -webkit-backdrop-filter:blur(6px) !important;\n    box-shadow:0 4px 12px rgba(0, 0, 0, 0.4) !important;\n}\n\n.tm-video-minimap-viewport{\n    position:absolute !important;\n    top:0 !important;\n    bottom:0 !important;\n    left:0 !important;\n    width:100%;\n    height:100% !important;\n    box-sizing:border-box !important;\n    border:1.5px solid hsl(var(--shadcn-blue)) !important;\n    background-color:hsla(var(--shadcn-blue) / 0.15) !important;\n    border-radius:2px !important;\n    will-change:transform;\n    transition:none !important;\n}\n.tm-video-wrapper.is-swiping .tm-video-minimap{\n    opacity:1 !important;\n    visibility:visible !important;\n    border-color:rgba(255, 255, 255, 0.45) !important;\n}\n.tm-floating-comment-panel{\n    position:fixed;\n    left:50%;\n    bottom:10px;\n    transform:translateX(-50%) translateY(100%);\n    width:90%;\n    max-width:700px;\n    background-color:hsla(var(--shadcn-card) / 0.95);\n    border-radius:12px 12px 0 0;\n    box-shadow:0 -5px 25px rgba(0, 0, 0, 0.2);\n    z-index:9996;\n    opacity:0;\n    transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n    display:flex;\n    flex-direction:column;\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    overflow:hidden;\n}\n\n.tm-floating-comment-panel.visible{\n    transform:translateX(-50%) translateY(0);\n    opacity:1;\n}\n\n.tm-floating-panel-header{\n    padding:16px 20px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    background-color:hsla(var(--shadcn-card) / 0.98);\n}\n\n.tm-floating-panel-title{\n    font-size:16px;\n    font-weight:600;\n    margin:0;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-floating-panel-close{\n    background:transparent;\n    border:none;\n    cursor:pointer;\n    width:28px;\n    height:28px;\n    border-radius:50%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    color:hsl(var(--shadcn-muted-foreground));\n    transition:background-color 0.2s, color 0.2s;\n}\n\n.tm-floating-panel-close:hover{\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-floating-panel-content{\n    padding:16px 20px;\n    flex:1;\n    overflow-y:auto;\n    -webkit-overflow-scrolling:touch;\n}\n\n.tm-floating-panel-content .tm-comment-placeholder{\n    min-height:200px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    font-size:14px;\n}\n@media screen and (orientation: landscape){\n    .tm-floating-comment-panel{\n        max-width:500px;\n        max-height:80vh;\n        border-radius:12px;\n        bottom:20px;\n    }\n}\n.tm-floating-panel-input-area{\n    padding:12px 16px;\n    border-top:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    gap:8px;\n    background-color:hsla(var(--shadcn-card) / 0.98);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n}\n\n.tm-floating-panel-input{\n    flex:1;\n    height:40px;\n    border-radius:20px;\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    padding:0 16px;\n    font-size:14px;\n    color:hsl(var(--shadcn-foreground));\n    transition:border-color 0.2s, box-shadow 0.2s;\n}\n\n.tm-floating-panel-input:focus{\n    outline:none;\n    border-color:hsl(var(--shadcn-blue));\n    box-shadow:0 0 0 2px hsla(var(--shadcn-blue) / 0.2);\n}\n\n.tm-floating-panel-input::placeholder{\n    color:hsl(var(--shadcn-muted-foreground));\n}\n\n.tm-floating-panel-input.error{\n    border-color:hsl(var(--shadcn-destructive));\n    animation:shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\n}\n\n.tm-floating-panel-submit{\n    width:40px;\n    height:40px;\n    border-radius:50%;\n    border:none;\n    background-color:hsl(var(--shadcn-blue));\n    color:hsl(var(--shadcn-blue-foreground));\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:all 0.2s;\n    flex-shrink:0;\n}\n\n.tm-floating-panel-submit:hover{\n    background-color:hsl(var(--shadcn-blue) / 0.9);\n    transform:translateY(-2px);\n    box-shadow:0 2px 5px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.tm-floating-panel-submit:active{\n    transform:scale(0.95);\n}\n\n.tm-floating-panel-submit svg{\n    width:18px;\n    height:18px;\n    stroke:currentColor;\n    stroke-width:2;\n}\n@media screen and (orientation: landscape){\n    .tm-floating-panel-input-area{\n        padding:10px 16px;\n    }\n}\n.tm-speed-indicator{\n    position:absolute;\n    top:50%;\n    left:50%;\n    transform:translate(-50%, -50%);\n    background-color:rgba(0, 0, 0, 0.7);\n    color:white;\n    padding:8px 16px;\n    border-radius:4px;\n    font-size:24px;\n    font-weight:bold;\n    z-index:9999;\n}\n`, "" ]);
      const y = b;
    },
    "314": r => {
      r.exports = function(r) {
        var o = [];
        o.toString = function toString() {
          return this.map((function(o) {
            var a = "";
            var l = typeof o[5] !== "undefined";
            if (o[4]) {
              a += "@supports (".concat(o[4], ") {");
            }
            if (o[2]) {
              a += "@media ".concat(o[2], " {");
            }
            if (l) {
              a += "@layer".concat(o[5].length > 0 ? " ".concat(o[5]) : "", " {");
            }
            a += r(o);
            if (l) {
              a += "}";
            }
            if (o[2]) {
              a += "}";
            }
            if (o[4]) {
              a += "}";
            }
            return a;
          })).join("");
        };
        o.i = function i(r, a, l, u, p) {
          if (typeof r === "string") {
            r = [ [ null, r, void 0 ] ];
          }
          var v = {};
          if (l) {
            for (var b = 0; b < this.length; b++) {
              var y = this[b][0];
              if (y != null) {
                v[y] = true;
              }
            }
          }
          for (var C = 0; C < r.length; C++) {
            var k = [].concat(r[C]);
            if (l && v[k[0]]) {
              continue;
            }
            if (typeof p !== "undefined") {
              if (typeof k[5] === "undefined") {
                k[5] = p;
              } else {
                k[1] = "@layer".concat(k[5].length > 0 ? " ".concat(k[5]) : "", " {").concat(k[1], "}");
                k[5] = p;
              }
            }
            if (a) {
              if (!k[2]) {
                k[2] = a;
              } else {
                k[1] = "@media ".concat(k[2], " {").concat(k[1], "}");
                k[2] = a;
              }
            }
            if (u) {
              if (!k[4]) {
                k[4] = "".concat(u);
              } else {
                k[1] = "@supports (".concat(k[4], ") {").concat(k[1], "}");
                k[4] = u;
              }
            }
            o.push(k);
          }
        };
        return o;
      };
    },
    "401": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `.tm-floating-button{\n    position:fixed;\n    bottom:30px;\n    left:50%;\n    transform:translateX(-50%);\n    padding:0;\n    width:56px;\n    height:56px;\n    border-radius:50%;\n    background-color:transparent;\n    color:var(--brand-pink);\n    border:none;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    z-index:9980;\n    cursor:pointer;\n    transition:all var(--anim-smooth);\n    overflow:visible;\n}\n\n.tm-floating-button svg{\n    width:48px;\n    height:48px;\n    filter:drop-shadow(0 0 10px rgba(var(--brand-pink-rgb), 0.9));\n    transition:all var(--anim-smooth);\n    animation:breathing-glow 3s infinite ease-in-out;\n}\n\n.tm-floating-button:hover{\n    transform:translateX(-50%) scale(1.1);\n}\n\n.tm-floating-button:hover svg{\n    animation-play-state:paused;\n    filter:drop-shadow(0 0 20px rgba(var(--brand-pink-rgb), 1.0));\n}\n\n.tm-floating-button:active{\n    transform:translateX(-50%) scale(0.95);\n}\n@keyframes breathing-glow{\n    0%{\n        filter:drop-shadow(0 0 8px rgba(var(--brand-pink-rgb), 0.7));\n        transform:scale(0.97);\n    }\n    50%{\n        filter:drop-shadow(0 0 25px rgba(var(--brand-pink-rgb), 1.0));\n        transform:scale(1.03);\n    }\n    100%{\n        filter:drop-shadow(0 0 8px rgba(var(--brand-pink-rgb), 0.7));\n        transform:scale(0.97);\n    }\n}\n@media screen and (orientation: landscape){\n    .tm-floating-button{\n        left:auto;\n        right:20px;\n        transform:translateX(0);\n    }\n    \n    .tm-floating-button:hover{\n        transform:translateX(0) scale(1.1);\n    }\n    \n    .tm-floating-button:active{\n        transform:translateX(0) scale(0.95);\n    }\n}\n.tm-toast{\n    position:fixed;\n    z-index:100000;\n    left:50%;\n    padding:10px 20px;\n    border-radius:var(--shadcn-radius);\n    color:hsl(var(--shadcn-foreground));\n    background:hsla(var(--shadcn-card) / 0.85);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    font-size:14px;\n    font-weight:500;\n    max-width:80%;\n    text-align:center;\n    word-break:break-all;\n    box-shadow:var(--shadow-lg);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    opacity:0;\n    transition:opacity var(--anim-smooth), transform var(--anim-smooth);\n    font-family:var(--font-sans);\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    gap:8px;\n}\n\n.tm-toast.visible{\n    opacity:1;\n}\n\n.tm-toast-icon{\n    flex-shrink:0;\n    width:15px;\n    height:15px;\n    opacity:0.95;\n}\n\n.tm-toast-content{\n    display:inline-block;\n}\n\n.tm-toast--top{\n    top:10%;\n    transform:translateX(-50%) translateY(-10px);\n}\n.tm-toast--top.visible{\n    transform:translateX(-50%) translateY(0);\n}\n\n.tm-toast--bottom{\n    bottom:10%;\n    transform:translateX(-50%) translateY(10px);\n}\n.tm-toast--bottom.visible{\n    transform:translateX(-50%) translateY(0);\n}\n\n.tm-toast--center{\n    top:50%;\n    transform:translate(-50%, -40%);\n}\n.tm-toast--center.visible{\n    transform:translate(-50%, -50%);\n}\n\n.tm-toast--error{\n    background:hsla(var(--shadcn-destructive) / 0.85);\n    border-color:hsla(var(--shadcn-destructive) / 0.3);\n    color:#fff;\n}\n\n.tm-toast--success{\n    background:hsla(var(--shadcn-green) / 0.85);\n    border-color:hsla(var(--shadcn-green) / 0.3);\n    color:#fff;\n}\n\n.tm-toast--info{\n    background:hsla(var(--shadcn-blue) / 0.85);\n    border-color:hsla(var(--shadcn-blue) / 0.3);\n    color:#fff;\n}\n`, "" ]);
      const y = b;
    },
    "465": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `.tm-video-overlay{\n    position:fixed;\n    top:0;\n    left:0;\n    right:0;\n    height:100vh;\n    background-color:rgba(35, 17, 29, 0.8);\n    z-index:2000000000 !important;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:flex-start;\n    backdrop-filter:blur(30px);\n    -webkit-backdrop-filter:blur(30px);\n    padding:0;\n    touch-action:none;\n    -webkit-user-select:none;\n    user-select:none;\n    -webkit-touch-callout:none;\n    overscroll-behavior:none;\n}\n.tm-player-container{\n    position:fixed;\n    top:0;\n    bottom:0;\n    left:0;\n    right:0;\n    width:100%;\n    background-color:transparent;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:flex-start;\n    z-index:2000000001 !important;\n    height:100%;\n    overflow:visible;\n    pointer-events:auto;\n    touch-action:pan-y;\n    -webkit-user-select:none;\n    user-select:none;\n    -webkit-touch-callout:none;\n    overscroll-behavior:none;\n}\n.tm-button-container{\n    width:100%;\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    gap:10px;\n    padding:6px 10px;\n    box-sizing:border-box;\n    z-index:99999;\n    position:absolute;\n    top:0;\n    left:0;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n    touch-action:none;\n}\n\n.tm-video-container{\n    position:relative;\n    overflow:hidden;\n    width:100%;\n    height:auto;\n    max-height:80vh;\n    margin-top:44px;\n    display:flex;\n    align-items:flex-start;\n    justify-content:center;\n    background-color:hsl(var(--shadcn-card));\n    border-radius:var(--shadcn-radius-lg);\n    box-shadow:var(--shadow-lg);\n    z-index:9992;\n    touch-action:pan-y;\n}\n\n.tm-video-wrapper{\n    position:relative;\n    overflow:hidden;\n    width:100%;\n    height:100%;\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    will-change:transform;\n    border-radius:var(--shadcn-radius) var(--shadcn-radius) 0 0;\n    touch-action:pan-y;\n}\n.tm-video-wrapper > *:not(video):not(.tm-speed-indicator):not(.tm-video-minimap):not(.tm-inline-remark-popover){\n    display:none !important;\n    opacity:0 !important;\n    visibility:hidden !important;\n    pointer-events:none !important;\n}\n.tm-video-wrapper video > *:not(track):not(source){\n    display:none !important;\n    opacity:0 !important;\n    visibility:hidden !important;\n    pointer-events:none !important;\n}\n.tm-video-wrapper video{\n    width:auto !important; \n    height:100% !important; \n    max-height:100% !important; \n    max-width:none !important; \n    object-fit:contain !important; \n    transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n    touch-action:pan-y;\n    cursor:grab; \n}\n.tm-handle-container{\n    position:relative;\n    height:30px;\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    z-index:9992;\n    width:100%;\n    flex-shrink:0;\n    touch-action:none;\n}\n\n.tm-resize-handle{\n    position:absolute;\n    height:5px;\n    width:134px;\n    max-width:134px;\n    background-color:hsla(var(--shadcn-foreground) / 0.6);\n    border-radius:2.5px;\n    cursor:grab;\n    touch-action:none;\n    opacity:0.5;\n    will-change:transform;\n    transition:all var(--anim-quick);\n    box-shadow:none;\n}\n\n.tm-resize-handle::after{\n    content:'';\n    position:absolute;\n    left:-10px;\n    right:-10px;\n    top:-15px;\n    bottom:-15px;\n    background:transparent;\n}\n\n.tm-resize-handle:hover,\n.tm-resize-handle.dragging{\n    opacity:1;\n    background-color:hsla(var(--shadcn-foreground) / 0.8);\n}\n\n.tm-resize-handle.dragging{\n    cursor:grabbing;\n}\n.tm-control-button-base{\n    color:hsl(var(--shadcn-secondary-foreground));\n    border-radius:50%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n    backdrop-filter:blur(12px);\n    -webkit-backdrop-filter:blur(12px);\n    box-shadow:var(--shadow-sm);\n}\n.tm-close-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:all var(--anim-smooth);\n    z-index:9994;\n}\n\n.tm-close-button:hover{\n    background-color:hsl(var(--shadcn-destructive));\n    transform:scale(1.1);\n    box-shadow:var(--shadow-md);\n}\n\n.tm-close-button:active{\n    transform:scale(0.9);\n}\n.tm-settings-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    z-index:9993;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    box-shadow:var(--shadow-sm);\n}\n\n.tm-settings-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.9);\n    transform:scale(1.1) rotate(30deg);\n    box-shadow:var(--shadow-md);\n}\n\n.tm-settings-button:active{\n    transform:scale(0.9);\n}\n.tm-settings-panel{\n    position:absolute;\n    top:calc(env(safe-area-inset-top, 8px) + 60px);\n    right:16px;\n    background-color:hsla(var(--shadcn-card) / 0.9);\n    backdrop-filter:blur(20px);\n    -webkit-backdrop-filter:blur(20px);\n    border-radius:14px;\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    box-shadow:0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px hsla(0, 0%, 100%, 0.05);\n    padding:16px 18px;\n    z-index:9996;\n    min-width:270px;\n    max-width:320px;\n    transform:translateY(-10px);\n    opacity:0;\n    pointer-events:none;\n    transition:transform var(--anim-smooth), opacity var(--anim-smooth);\n    touch-action:none;\n}\n\n.tm-settings-panel.active{\n    transform:translateY(0);\n    opacity:1;\n    pointer-events:auto;\n}\n.tm-settings-menu-container{\n    display:flex;\n    flex-direction:column;\n    gap:16px;\n    color:hsl(var(--shadcn-foreground));\n    user-select:none;\n    font-size:13.5px;\n}\n.tm-settings-section{\n    display:flex;\n    flex-direction:column;\n    gap:4px;\n}\n.tm-settings-section-header{\n    font-size:11px;\n    font-weight:700;\n    color:hsla(var(--shadcn-muted-foreground) / 0.7);\n    letter-spacing:0.8px;\n    text-transform:uppercase;\n    padding-left:2px;\n}\n.tm-settings-section-divider{\n    height:1px;\n    background:linear-gradient(90deg, hsla(var(--shadcn-border) / 0.3) 0%, hsla(var(--shadcn-border) / 0.05) 100%);\n    margin:4px 0 8px 0;\n    border-radius:1px;\n}\n.tm-settings-option-row{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    padding:6px 4px;\n    border-radius:8px;\n    cursor:pointer;\n    transition:background 0.15s ease;\n}\n\n.tm-settings-option-row:hover{\n    background-color:hsla(var(--shadcn-muted) / 0.3);\n}\n\n.tm-settings-label-wrapper{\n    display:flex;\n    align-items:center;\n    gap:8px;\n}\n\n.tm-settings-label{\n    font-size:13.5px;\n    font-weight:500;\n    color:hsl(var(--shadcn-foreground));\n}\n.tm-settings-seek-steps-subpanel{\n    display:flex;\n    flex-wrap:nowrap;\n    gap:6px;\n    align-items:center;\n    overflow-x:auto;\n    overflow-y:hidden;\n    white-space:nowrap;\n    padding:6px 2px 4px 2px;\n    margin-top:2px;\n    scroll-behavior:smooth;\n    -webkit-overflow-scrolling:touch;\n    scrollbar-width:none;\n    -ms-overflow-style:none;\n}\n\n.tm-settings-seek-steps-subpanel::-webkit-scrollbar{\n    display:none;\n}\n.tm-settings-sources-subpanel{\n    display:flex;\n    flex-wrap:wrap;\n    gap:8px;\n    align-items:center;\n    justify-content:flex-start;\n    padding:6px 2px 2px 2px;\n    margin-top:2px;\n}\n.tm-seek-step-badge,\n.tm-source-badge{\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    font-size:11.5px;\n    font-weight:500;\n    padding:0 12px;\n    height:28px;\n    line-height:1;\n    border-radius:6px;\n    box-sizing:border-box;\n    border:1px solid transparent;\n    cursor:pointer;\n    user-select:none;\n    flex-shrink:0;\n    transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n    -webkit-tap-highlight-color:transparent;\n}\n.tm-seek-step-badge.enabled,\n.tm-source-badge.enabled{\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    border-color:hsla(var(--shadcn-border) / 0.35);\n    color:#ffffff;\n    font-weight:600;\n    box-shadow:0 2px 5px rgba(0, 0, 0, 0.2);\n}\n.tm-seek-step-badge.disabled,\n.tm-source-badge.disabled{\n    background-color:hsla(var(--shadcn-secondary) / 0.15);\n    border-color:hsla(var(--shadcn-border) / 0.08);\n    color:hsla(var(--shadcn-muted-foreground) / 0.4);\n    font-weight:400;\n}\n.tm-seek-step-badge:hover,\n.tm-source-badge:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.7);\n    border-color:hsla(var(--shadcn-accent) / 0.9);\n    color:#ffffff;\n    transform:translateY(-1px);\n    box-shadow:0 4px 8px rgba(0, 0, 0, 0.25);\n}\n.tm-seek-step-badge:active,\n.tm-source-badge:active{\n    transform:scale(0.94);\n    box-shadow:none;\n}\n.tm-seek-step-add-btn{\n    font-size:14px;\n    font-weight:600;\n    width:32px;\n    height:28px;\n    border-radius:6px;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    background-color:hsla(var(--shadcn-secondary) / 0.2);\n    border:1px dashed hsla(var(--shadcn-border) / 0.35);\n    color:hsla(var(--shadcn-foreground) / 0.75);\n    cursor:pointer;\n    flex-shrink:0;\n    transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.tm-seek-step-add-btn:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.5);\n    border-style:solid;\n    border-color:hsla(var(--shadcn-accent) / 0.9);\n    color:#ffffff;\n    transform:translateY(-1px);\n    box-shadow:0 4px 8px rgba(0, 0, 0, 0.25);\n}\n\n.tm-seek-step-add-btn:active{\n    transform:scale(0.94);\n}\n.tm-seek-step-input{\n    width:60px;\n    height:28px;\n    font-size:11.5px;\n    font-weight:500;\n    text-align:center;\n    border-radius:6px;\n    border:1px solid hsla(var(--shadcn-accent) / 0.8);\n    background-color:hsla(var(--shadcn-background) / 0.85);\n    color:#ffffff;\n    outline:none;\n    box-sizing:border-box;\n    flex-shrink:0;\n    box-shadow:0 0 8px hsla(var(--shadcn-accent) / 0.4);\n}\n.tm-settings-sources-subpanel{\n    display:flex;\n    gap:8px;\n    padding:6px 2px 2px 2px;\n}\n\n.tm-source-badge{\n    font-size:11px;\n    padding:4px 10px;\n    border-radius:12px;\n    border:1px solid transparent;\n    cursor:pointer;\n    font-weight:500;\n    transition:all 0.15s ease;\n}\n\n.tm-source-badge.enabled{\n    background:rgba(239, 68, 68, 0.2);\n    border-color:rgba(239, 68, 68, 0.6);\n    color:#fca5a5;\n}\n\n.tm-source-badge.disabled{\n    background:rgba(255, 255, 255, 0.06);\n    border-color:rgba(255, 255, 255, 0.1);\n    color:rgba(255, 255, 255, 0.4);\n}\n.tm-toggle-input{\n    position:absolute;\n    left:-9999px;\n}\n.tm-start-time-container.active{\n    background-color:hsl(var(--shadcn-green) / 0.15);\n    border-color:hsl(var(--shadcn-green) / 0.4);\n}\n\n.tm-start-time-container:not(.active){\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n.tm-end-time-container.active{\n    background-color:hsl(var(--shadcn-orange) / 0.15);\n    border-color:hsl(var(--shadcn-orange) / 0.4);\n}\n\n.tm-end-time-container:not(.active){\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n.tm-set-loop-start-label.active{\n    color:hsl(var(--shadcn-green));\n    opacity:1;\n}\n\n.tm-set-loop-start-label:not(.active){\n    opacity:0.9;\n}\n.tm-set-loop-end-label.active{\n    color:hsl(var(--shadcn-orange));\n    opacity:1;\n}\n\n.tm-set-loop-end-label:not(.active){\n    opacity:0.9;\n}\n.tm-loop-start-position.active, .tm-loop-end-position.active{\n    color:hsl(var(--shadcn-foreground));\n    opacity:1;\n}\n\n.tm-loop-start-position:not(.active), .tm-loop-end-position:not(.active){\n    color:hsl(var(--shadcn-muted-foreground));\n    opacity:0.9;\n}\n.tm-loop-toggle-button.active{\n    background-color:hsl(var(--shadcn-red) / 0.1);\n    border-color:hsl(var(--shadcn-red) / 0.3);\n}\n\n.tm-loop-toggle-button:active{\n    transform:scale(0.98);\n}\n.tm-loop-range{\n    position:absolute;\n    height:4px;\n    background:linear-gradient(90deg, \n        hsla(var(--shadcn-green) / 0.3) 0%, \n        hsla(var(--shadcn-orange) / 0.3) 100%);\n    top:50%;\n    transform:translateY(-50%);\n    border-radius:2px;\n    opacity:0;\n    transition:opacity 0.3s ease;\n    z-index:1;\n    pointer-events:none;\n}\n\n.tm-loop-range.active{\n    opacity:0.7;\n    box-shadow:0 0 8px rgba(0, 0, 0, 0.1);\n}\n.tm-progress-bar-container:hover .tm-loop-range.active{\n    opacity:0.9;\n    height:6px;\n}\n.tm-loop-marker{\n    position:absolute;\n    width:4px;\n    height:100%;\n    top:0;\n    transform:translateX(-50%);\n    z-index:3;\n    transition:opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),  transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);\n    backdrop-filter:blur(4px);\n    -webkit-backdrop-filter:blur(4px);\n}\n.tm-loop-start-marker{\n    background-color:hsla(var(--shadcn-green) / 0.5);\n    border-radius:2px;\n    box-shadow:0 0 6px hsla(var(--shadcn-green) / 0.3);\n}\n.tm-loop-end-marker{\n    background-color:hsla(var(--shadcn-orange) / 0.5);\n    border-radius:2px;\n    box-shadow:0 0 6px hsla(var(--shadcn-orange) / 0.3);\n}\n.tm-loop-marker:hover{\n    cursor:pointer;\n    z-index:4;\n}\n\n.tm-loop-start-marker:hover{\n    background-color:hsla(var(--shadcn-green) / 0.7);\n    box-shadow:0 0 10px hsla(var(--shadcn-green) / 0.5);\n}\n\n.tm-loop-end-marker:hover{\n    background-color:hsla(var(--shadcn-orange) / 0.7);\n    box-shadow:0 0 10px hsla(var(--shadcn-orange) / 0.5);\n}\n.tm-loop-marker.active{\n    opacity:1;\n}\n\n.tm-loop-marker:not(.active){\n    opacity:0.7;\n}\n.tm-loop-marker::before{\n    content:attr(data-label);\n    position:absolute;\n    top:-24px;\n    left:50%;\n    transform:translateX(-50%);\n    background-color:hsla(var(--shadcn-card) / 0.7);\n    color:hsl(var(--shadcn-card-foreground));\n    font-size:10px;\n    font-weight:600;\n    padding:2px 8px;\n    border-radius:10px;\n    opacity:0;\n    transition:opacity 0.2s ease, transform 0.2s ease;\n    backdrop-filter:blur(8px);\n    -webkit-backdrop-filter:blur(8px);\n    box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    white-space:nowrap;\n    z-index:5;\n}\n\n.tm-loop-marker:hover::before{\n    opacity:1;\n    transform:translateX(-50%) translateY(-4px);\n}\n.tm-start-time-container-hover{\n    background-color:hsl(var(--shadcn-green) / 0.1);\n    border-color:hsl(var(--shadcn-green) / 0.3);\n}\n\n.tm-start-time-container-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n\n.tm-end-time-container-hover{\n    background-color:hsl(var(--shadcn-orange) / 0.1);\n    border-color:hsl(var(--shadcn-orange) / 0.3);\n}\n\n.tm-end-time-container-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    border-color:hsl(var(--shadcn-border) / 0.1);\n}\n.tm-loop-button-hover{\n    background-color:hsl(var(--shadcn-accent) / 0.3);\n    transform:translateY(-1px);\n}\n\n.tm-loop-button-active{\n    background-color:hsl(var(--shadcn-muted) / 0.7);\n}\n\n.tm-loop-button-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    transform:translateY(0);\n}\n.tm-indicator-base{\n    position:absolute;\n    padding:8px 16px;\n    background-color:hsla(var(--shadcn-card) / 0.6);\n    color:hsl(var(--shadcn-card-foreground));\n    border-radius:var(--shadcn-radius);\n    opacity:0;\n    backdrop-filter:blur(15px);\n    -webkit-backdrop-filter:blur(15px);\n    box-shadow:var(--shadow-md);\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    transform:translateY(20px);\n    transition:opacity var(--anim-smooth), transform var(--anim-smooth);\n    pointer-events:none;\n    z-index:9994;\n    font-size:15px;\n    font-weight:500;\n}\n\n.tm-indicator-base.visible{\n    opacity:1;\n    transform:translateY(0);\n    pointer-events:auto;\n}\n.tm-pause-indicator{\n    width:80px;\n    height:80px;\n}\n.tm-progress-row{\n    display:flex;\n    flex-direction:column;\n    width:100%;\n    box-sizing:border-box;\n}\n\n.tm-seek-control-row{\n    display:flex;\n    flex-direction:row;\n    justify-content:space-between;\n    width:100%;\n    box-sizing:border-box;\n}\n\n.tm-loop-control-row{\n    display:flex;\n    align-items:center;\n    width:100%;\n    box-sizing:border-box;\n    position:relative;\n    gap:8px;\n}\n.tm-inline-remark-popover{\n    position:absolute;\n    bottom:calc(45px + 42px + 10px);\n    left:12px;\n    right:12px;\n    width:calc(100% - 24px);\n    margin:0 auto;\n    background:rgba(18, 18, 20, 0.96);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    border-radius:16px;\n    padding:12px;\n    box-shadow:0 10px 30px rgba(0, 0, 0, 0.7);\n    z-index:9998;\n    pointer-events:auto;\n    opacity:0;\n    transform:translateY(8px) scale(0.98);\n    transition:opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n    box-sizing:border-box;\n}\n\n.tm-inline-remark-popover.visible{\n    opacity:1;\n    transform:translateY(0) scale(1);\n}\n\n.tm-inline-remark-body{\n    display:flex;\n    flex-direction:column;\n    gap:10px;\n    width:100%;\n}\n\n.tm-inline-remark-input{\n    width:100%;\n    height:38px;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    border-radius:12px;\n    padding:0 14px;\n    color:#ffffff;\n    font-size:0.85rem;\n    outline:none;\n    box-sizing:border-box;\n    transition:border-color 0.2s, background 0.2s;\n}\n\n.tm-inline-remark-input:focus{\n    border-color:rgba(255, 255, 255, 0.35);\n    background:rgba(255, 255, 255, 0.1);\n}\n\n.tm-inline-remark-input::placeholder{\n    color:rgba(255, 255, 255, 0.35);\n}\n\n.tm-inline-remark-footer{\n    display:flex;\n    justify-content:flex-end;\n    gap:10px;\n}\n\n.tm-inline-remark-btn{\n    height:32px;\n    padding:0 20px;\n    border-radius:14px;\n    font-size:0.82rem;\n    font-weight:600;\n    cursor:pointer;\n    outline:none;\n    transition:background 0.18s, transform 0.12s;\n    box-sizing:border-box;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n}\n\n.tm-inline-remark-btn.cancel{\n    background:rgba(255, 255, 255, 0.08);\n    border:1px solid rgba(255, 255, 255, 0.15);\n    color:rgba(255, 255, 255, 0.8);\n}\n\n.tm-inline-remark-btn.cancel:hover{\n    background:rgba(255, 255, 255, 0.16);\n    color:#ffffff;\n}\n\n.tm-inline-remark-btn.submit{\n    background:hsl(var(--shadcn-blue));\n    border:none;\n    color:#ffffff;\n    box-shadow:0 4px 12px hsla(var(--shadcn-blue) / 0.4);\n}\n\n.tm-inline-remark-btn.submit:hover{\n    background:hsl(var(--shadcn-blue) / 0.9);\n    transform:scale(1.03);\n}\n\n.tm-playback-control-row{\n    display:flex;\n    justify-content:space-between;\n    align-items:center;\n    position:relative;\n    width:100%;\n    max-height:45px;\n    height:45px;\n    border-radius:8px;\n    box-sizing:border-box;\n}\n.tm-left-controls, .tm-center-controls, .tm-right-controls{\n    flex:1;\n    display:flex;\n    height:100%;\n    align-items:center;\n}\n\n.tm-left-controls{\n    justify-content:flex-start;\n}\n\n.tm-center-controls{\n    justify-content:center;\n}\n\n.tm-right-controls{\n    justify-content:flex-end;\n}\n.tm-time-display{\n    display:flex;\n    justify-content:space-between;\n    color:hsl(var(--shadcn-foreground) / 0.9);\n    font-size:12px;\n    margin-top:-2px;\n    font-variant-numeric:tabular-nums;\n    gap:8px;\n}\n\n.tm-time-display-container{\n    display:flex;\n    justify-content:space-between;\n    width:100%;\n    padding:0px 1px;\n    margin-bottom:6px;\n}\n\n.tm-current-time, .tm-total-duration{\n    color:hsla(var(--shadcn-foreground) / 0.55);\n    font-size:12px;\n    min-width:60px;\n    font-variant-numeric:tabular-nums;\n    font-weight:500;\n    line-height:1;\n}\n\n.tm-current-time{\n    text-align:left;\n}\n\n.tm-total-duration{\n    text-align:right;\n}\n.tm-tab-scroll-container{\n    display:flex;\n    flex:1;\n    gap:8px;\n    overflow-x:auto;\n    overflow-y:hidden;\n    overscroll-behavior:contain;\n    scroll-behavior:smooth;\n    -webkit-overflow-scrolling:touch;\n    scrollbar-width:none;\n    height:38px;\n    padding:0 44px 0 0;\n    margin:0;\n    box-sizing:border-box;\n    align-items:center;\n    mask-image:linear-gradient(to right, black calc(100% - 36px), transparent);\n    -webkit-mask-image:linear-gradient(to right, black calc(100% - 36px), transparent);\n    touch-action:pan-x;\n}\n.tm-tab-scroll-container::-webkit-scrollbar{ display:none; }\n.tm-tab-pill{\n    display:flex;\n    align-items:center;\n    gap:4px;\n    height:38px;\n    padding:0 12px;\n    box-sizing:border-box;\n    border-radius:9999px;\n    background-color:hsla(0, 0%, 15%, 0.12);\n    border:1px solid hsla(0, 0%, 20%, 0.35);\n    color:hsl(var(--shadcn-foreground));\n    font-size:0.8rem;\n    font-variant-numeric:tabular-nums;\n    white-space:nowrap;\n    cursor:pointer;\n    flex-shrink:0;\n    transition:all var(--anim-quick);\n    user-select:none;\n    -webkit-user-select:none;\n    -webkit-tap-highlight-color:transparent;\n    pointer-events:auto;\n}\n.tm-tab-pill{\n    background-color:hsla(var(--tab-color), 0.12);\n    border-color:hsla(var(--tab-color), 0.35);\n    color:hsl(var(--tab-color));\n}\n.tm-tab-pill:active{ transform:scale(0.95); }\n.tm-tab-pill.active{\n    background-color:hsla(var(--tab-color), 0.25);\n    border-color:hsla(var(--tab-color), 0.6);\n    color:hsl(var(--tab-color));\n}\n.tm-tab-pill.draft{\n    background-color:hsla(var(--tab-color), 0.08);\n    border-color:hsla(var(--tab-color), 0.45);\n    border-style:dashed;\n    gap:5px;\n    padding:0 8px;\n}\n.tm-tab-pill.draft.editing,\n.tm-tab-pill.draft:not(.placeholder){\n    background-color:hsla(var(--tab-color), 0.22);\n    border-color:hsla(var(--tab-color), 0.75);\n}\n.tm-tab-pill.draft .tm-draft-label{\n    font-weight:600;\n    font-size:11px;\n}\n.tm-tab-pill.draft .tm-draft-label.a{ color:#fff; }\n.tm-tab-pill.draft .tm-draft-label.b{ color:#fff; }\n.tm-tab-pill.draft .tm-draft-time{\n    color:#fff;\n    font-variant-numeric:tabular-nums;\n    font-size:11px;\n}\n.tm-tab-pill.draft .tm-draft-time.placeholder{\n    color:rgba(255, 255, 255, 0.3);\n}\n.tm-draft-action{\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    height:24px;\n    width:32px;\n    border-radius:6px;\n    border:none;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n    -webkit-tap-highlight-color:transparent;\n    box-sizing:border-box;\n}\n.tm-draft-action:active{\n    transform:scale(0.88);\n}\n.tm-draft-action.save{\n    background-color:hsla(var(--tab-color), 0.18);\n    color:hsl(var(--tab-color));\n}\n.tm-draft-action.save:hover{\n    background-color:hsla(var(--tab-color), 0.28);\n}\n.tm-draft-action.cancel{\n    background-color:rgba(239, 68, 68, 0.15);\n    color:#ef4444;\n}\n.tm-draft-action.cancel:hover{\n    background-color:rgba(239, 68, 68, 0.25);\n}\n.tm-draft-action.edit-comment{\n    background-color:rgba(245, 158, 11, 0.15);\n    color:#f59e0b;\n}\n.tm-draft-action.edit-comment:hover{\n    background-color:rgba(245, 158, 11, 0.25);\n}\n.tm-tab-list-btn{\n    flex-shrink:0;\n    width:38px;\n    height:38px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    border-radius:50%;\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    border:1px solid hsla(var(--shadcn-border) / 0.15);\n    color:hsl(var(--shadcn-foreground));\n    font-size:1.1rem;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n    -webkit-tap-highlight-color:transparent;\n}\n.tm-tab-list-btn:active{ transform:scale(0.88); }\n.tm-tab-list-btn:hover{\n    background-color:hsla(var(--shadcn-secondary) / 0.8);\n    border-color:hsla(var(--shadcn-border) / 0.3);\n}\n.tm-bottom-sheet-overlay{\n    position:fixed;\n    inset:0;\n    background-color:rgba(0, 0, 0, 0.35);\n    backdrop-filter:blur(4px);\n    -webkit-backdrop-filter:blur(4px);\n    z-index:9990 !important;\n    opacity:0;\n    pointer-events:none;\n    transition:opacity var(--anim-smooth);\n\n    touch-action:none;\n    user-select:none;\n    -webkit-user-select:none;\n    overscroll-behavior:none;\n}\n.tm-bottom-sheet-overlay.visible{\n    opacity:1;\n    pointer-events:auto;\n}\n\n.tm-bottom-sheet-panel{\n    position:absolute;\n    bottom:0;\n    left:0;\n    right:0;\n    width:100%;\n    max-height:calc(100vh - 120px);\n    background-color:rgba(18, 18, 20, 0.94);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 32px rgba(0, 0, 0, 0.6);\n    border-radius:16px;\n    border:1px solid rgba(255, 255, 255, 0.1);\n    z-index:9995 !important;\n    opacity:0;\n    pointer-events:none;\n    transform:translateY(8px) scale(0.98);\n    transition:opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n    display:flex;\n    flex-direction:column;\n    overflow:hidden;\n    box-sizing:border-box;\n    padding:10px 14px 12px;\n}\n.tm-bottom-sheet-panel.visible{\n    opacity:1;\n    pointer-events:auto;\n    transform:translateY(0) scale(1);\n}\n.tm-sheet-header{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    padding:2px 2px 6px 2px;\n    margin-bottom:6px;\n    border-bottom:1px solid rgba(255, 255, 255, 0.06);\n    flex-shrink:0;\n}\n\n.tm-bottom-sheet-title{\n    font-size:0.82rem;\n    font-weight:600;\n    color:rgba(255, 255, 255, 0.88);\n    letter-spacing:0.2px;\n}\n\n.tm-sheet-count-badge{\n    font-size:0.7rem;\n    color:rgba(255, 255, 255, 0.45);\n    background:rgba(255, 255, 255, 0.08);\n    padding:1px 6px;\n    border-radius:8px;\n}\n\n.tm-sheet-close-btn{\n    background:transparent;\n    border:none;\n    color:rgba(255, 255, 255, 0.45);\n    font-size:0.95rem;\n    cursor:pointer;\n    padding:0 4px;\n    border-radius:4px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    transition:color 0.2s;\n}\n.tm-sheet-close-btn:hover{\n    color:#ffffff;\n}\n.tm-bottom-sheet-list{\n    flex:1;\n    overflow-y:auto;\n    -webkit-overflow-scrolling:touch;\n    display:flex;\n    flex-direction:column;\n    gap:6px;\n    padding-right:2px;\n}\n.tm-bottom-sheet-list::-webkit-scrollbar{\n    width:4px;\n}\n.tm-bottom-sheet-list::-webkit-scrollbar-thumb{\n    background:rgba(255, 255, 255, 0.2);\n    border-radius:2px;\n}\n.tm-sheet-item{\n    display:flex;\n    align-items:center;\n    gap:8px;\n    padding:2px 0;\n    background:transparent;\n    border:none;\n    height:32px;\n    box-sizing:border-box;\n}\n\n.tm-sheet-item-time-container{\n    display:flex;\n    align-items:center;\n    flex-shrink:0;\n    height:32px;\n}\n.tm-sheet-time-pill{\n    height:32px;\n    box-sizing:border-box;\n    padding:0 12px;\n    border-radius:16px;\n    background:hsla(var(--tab-color, 200 100% 55%), 0.15);\n    border:1px solid hsla(var(--tab-color, 200 100% 55%), 0.4);\n    color:#ffffff;\n    font-size:0.8rem;\n    font-family:inherit;\n    font-weight:500;\n    cursor:pointer;\n    white-space:nowrap;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    transition:transform 0.15s ease, background-color 0.2s;\n}\n.tm-sheet-time-pill:hover{\n    transform:scale(1.02);\n    background:hsla(var(--tab-color, 200 100% 55%), 0.28);\n}\n.tm-sheet-time-pill.interval{\n    padding:0 10px;\n    gap:4px;\n}\n.tm-sheet-time-pill.interval .tm-time-part{\n    cursor:pointer;\n    padding:2px 4px;\n    border-radius:4px;\n    transition:background-color 0.15s, color 0.15s;\n}\n.tm-sheet-time-pill.interval .tm-time-part:hover{\n    background-color:rgba(255, 255, 255, 0.25);\n    color:#ffffff;\n}\n.tm-sheet-time-pill.interval .tm-time-sep{\n    opacity:0.6;\n    font-weight:400;\n    user-select:none;\n    padding:0 1px;\n}\n.tm-sheet-item-comment-input{\n    flex:1;\n    min-width:0;\n    height:32px;\n    box-sizing:border-box;\n    background:rgba(255, 255, 255, 0.06);\n    border:1px solid rgba(255, 255, 255, 0.1);\n    border-radius:8px;\n    padding:0 10px;\n    color:#ffffff;\n    font-size:0.82rem;\n    outline:none;\n    display:inline-flex;\n    align-items:center;\n    transition:border-color 0.2s, background 0.2s;\n}\n.tm-sheet-item-comment-input:focus{\n    border-color:rgba(255, 255, 255, 0.3);\n    background:rgba(255, 255, 255, 0.1);\n}\n.tm-sheet-item-comment-input::placeholder{\n    color:rgba(255, 255, 255, 0.3);\n}\n.tm-sheet-delete-btn{\n    width:32px;\n    height:32px;\n    box-sizing:border-box;\n    border-radius:8px;\n    border:1px solid rgba(255, 60, 60, 0.25);\n    background:rgba(255, 60, 60, 0.12);\n    color:#ff5252;\n    font-size:0.85rem;\n    font-weight:bold;\n    cursor:pointer;\n    display:inline-flex;\n    align-items:center;\n    justify-content:center;\n    flex-shrink:0;\n    transition:background 0.2s, transform 0.15s;\n}\n.tm-sheet-delete-btn:hover{\n    background:rgba(255, 60, 60, 0.28);\n    transform:scale(1.05);\n}\n\n.tm-bottom-sheet-empty{\n    padding:16px;\n    text-align:center;\n    font-size:0.82rem;\n    color:rgba(255, 255, 255, 0.35);\n}\n.tm-rewind-group, .tm-forward-group{\n    display:flex;\n    flex-direction:column;\n    width:50%;\n    gap:8px;\n    align-items:center;\n}\n\n.tm-rewind-buttons-container{\n    display:flex;\n    flex-direction:row-reverse;\n    flex-wrap:wrap;\n    width:100%;\n    justify-content:flex-end;\n    align-content:flex-start;\n    gap:6px;\n}\n\n.tm-forward-buttons-container{\n    display:flex;\n    flex-direction:row;\n    flex-wrap:wrap;\n    width:100%;\n    justify-content:flex-end;\n    align-content:flex-start;\n    gap:6px;\n}\n.tm-time-control-button{\n    background-color:hsla(var(--shadcn-secondary) / var(--btn-opacity, 0.5));\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsl(var(--shadcn-border) / 0.1);\n    border-radius:8px;\n    padding:0;\n    font-size:0.75rem;\n    cursor:pointer;\n    transition:all 0.2s cubic-bezier(.25,.8,.25,1);\n    white-space:nowrap;\n    font-weight:500;\n    box-shadow:0 1px 2px rgba(0,0,0,0.05);\n    width:var(--button-xl);\n    height:var(--button-lg);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    flex:0 0 auto;\n}\n\n.tm-time-control-button:hover{\n    background-color:hsla(var(--shadcn-secondary) / calc(var(--btn-opacity, 0.5) + 0.15));\n    border-color:hsla(var(--shadcn-border) / 0.3);\n    transform:translateY(-1.5px);\n    box-shadow:0 4px 8px rgba(0,0,0,0.2);\n}\n\n.tm-time-control-button:active{\n    transform:scale(0.96);\n    background-color:hsla(var(--shadcn-secondary) / calc(var(--btn-opacity, 0.5) + 0.25));\n    box-shadow:none;\n}\n\n.tm-time-control-button-active{\n    transform:scale(0.95);\n    box-shadow:none;\n}\n\n.tm-time-control-button-after-active{\n    transform:none;\n    box-shadow:0 2px 5px rgba(0, 0, 0, 0.15);\n}\n\n.tm-time-control-button-inner{\n    display:flex;\n    align-items:center;\n    justify-content:center;\n}\n\n.tm-rewind-icon{\n    margin-right:-2px;\n}\n\n.tm-forward-icon{\n    margin-left:-2px;\n}\n\n.tm-time-text-margin-left{\n    margin-left:2px;\n}\n\n.tm-time-text-margin-right{\n    margin-right:2px;\n}\n.tm-control-button-hover{\n    background-color:hsl(var(--shadcn-accent) / 0.3);\n    transform:none;\n}\n\n.tm-control-button-default{\n    background-color:hsl(var(--shadcn-secondary) / 0.5);\n    transform:none;\n}\n.tm-control-buttons{\n    position:absolute;\n    bottom:calc(10px + env(safe-area-inset-bottom, 0px));\n    left:50%;\n    transform:translateX(-50%);\n    width:95%;\n    max-width:700px;\n    min-width:350px;\n    z-index:9991;\n    padding:16px 16px 14px;\n    border-radius:16px;\n    background-color:rgba(10, 10, 10, 0.52);\n    backdrop-filter:blur(24px);\n    -webkit-backdrop-filter:blur(24px);\n    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.45);\n    border:none;\n    transition: opacity 0.3s ease,  transform 0.3s ease,  width 0.35s cubic-bezier(0.25, 1, 0.5, 1),  left 0.35s cubic-bezier(0.25, 1, 0.5, 1),  bottom 0.35s cubic-bezier(0.25, 1, 0.5, 1),  right 0.35s cubic-bezier(0.25, 1, 0.5, 1),  border-radius 0.3s ease;\n    gap:10px;\n    display:flex;\n    flex-direction:column;\n    align-items:center;\n    justify-content:center;\n    overflow:visible !important;\n    touch-action:none;\n}\n\n.tm-control-buttons.dragging{\n    transition:none !important;\n}\nbody.controls-hidden .tm-player-container .tm-control-buttons{\n    opacity:0;\n    transform:translateX(-50%) translateY(calc(100% + 30px));\n    pointer-events:none;\n}\nbody:not(.controls-hidden) .tm-player-container .tm-control-buttons{\n    opacity:1;\n    transform:translateX(-50%) translateY(0);\n    pointer-events:auto;\n}\nbody.controls-hidden .tm-player-container .tm-button-container{\n    opacity:0;\n    transform:translateY(-60px);\n    pointer-events:none;\n}\nbody:not(.controls-hidden) .tm-player-container .tm-button-container{\n    opacity:1;\n    transform:translateY(0);\n    pointer-events:auto;\n}\n.tm-control-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.6);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.1);\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n}\n\n.tm-control-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.7);\n    transform:translateY(-2px);\n    box-shadow:var(--shadow-sm);\n}\n\n.tm-control-button:active{\n    transform:scale(0.95);\n    box-shadow:none;\n}\n\n.tm-control-button.active{\n    background-color:hsla(var(--shadcn-blue) / 0.7);\n    color:hsl(var(--shadcn-blue-foreground));\n    box-shadow:0 0 0 2px hsla(var(--shadcn-blue) / 0.3);\n}\n\n.tm-control-button svg,\n.tm-control-button img{\n    width:16px;\n    height:16px;\n}\n.tm-control-row{\n    display:flex;\n    justify-content:center;\n    align-items:center;\n    gap:8px;\n    margin-top:4px;\n    opacity:1;\n    transition:opacity var(--anim-quick), height var(--anim-quick);\n    height:auto;\n    overflow:hidden;\n}\n\n.tm-control-row.hidden{\n    opacity:0;\n    height:0;\n    margin:0;\n}\n.tm-comment-row{\n    width:100%;\n    display:flex;\n    flex-direction:column;\n    margin-bottom:10px;\n    border-bottom:1px solid hsla(var(--shadcn-border) / 0.2);\n    padding-bottom:10px;\n}\n\n.tm-comment-container{\n    width:100%;\n    min-height:60px;\n    display:flex;\n    flex-direction:column;\n    gap:8px;\n}\n\n.tm-comment-header{\n    display:flex;\n    align-items:center;\n    justify-content:space-between;\n    font-size:14px;\n    font-weight:500;\n    color:hsl(var(--shadcn-foreground));\n}\n\n.tm-comment-left{\n    display:flex;\n    align-items:center;\n}\n\n.tm-comment-title{\n    margin-right:5px;\n}\n\n.tm-comment-count{\n    color:hsl(var(--shadcn-muted-foreground));\n    font-size:12px;\n}\n\n.tm-comment-actions{\n    display:flex;\n    gap:8px;\n}\n\n.tm-comment-button{\n    border:none;\n    background-color:hsla(var(--shadcn-secondary) / 0.5);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border-radius:4px;\n    padding:4px 8px;\n    font-size:12px;\n    cursor:pointer;\n    transition:all 0.2s ease;\n}\n\n.tm-comment-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.6);\n    transform:translateY(-1px);\n}\n\n.tm-comment-button:active{\n    transform:scale(0.95);\n}\n\n.tm-comment-write{\n    background-color:hsla(var(--shadcn-blue) / 0.7);\n    color:hsl(var(--shadcn-blue-foreground));\n}\n\n.tm-comment-write:hover{\n    background-color:hsla(var(--shadcn-blue) / 0.8);\n}\n\n.tm-comment-placeholder{\n    width:100%;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    padding:10px;\n    color:hsl(var(--shadcn-muted-foreground));\n    font-size:13px;\n    background-color:hsla(var(--shadcn-muted) / 0.1);\n    border-radius:6px;\n}\n@media screen and (orientation: landscape){\n    .tm-comment-container{\n        min-height:50px;\n    }\n    \n    .tm-comment-placeholder{\n        padding:8px;\n    }\n}\n\n.tm-player-title{\n    position:absolute !important;\n    top:calc(env(safe-area-inset-top, 0px) + 12px) !important;\n    left:50% !important;\n    transform:translateX(-50%) !important;\n    max-width:calc(100% - 110px) !important;\n    text-align:center;\n    font-size:14px;\n    font-weight:600;\n    color:#ffffff;\n    white-space:nowrap;\n    overflow:hidden;\n    text-overflow:ellipsis;\n    user-select:none;\n    z-index:9998 !important;\n    text-shadow:0 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5) !important;\n    pointer-events:none !important;\n    transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important;\n}\n\nbody.controls-hidden .tm-player-title{\n    opacity:0 !important;\n    transform:translate(-50%, -20px) !important;\n    pointer-events:none !important;\n}\nbody.tm-swiping-down .tm-button-container,\nbody.tm-swiping-down .tm-handle-container,\nbody.tm-swiping-down .tm-comments-panel,\nbody.tm-swiping-down .tm-control-buttons,\nbody.tm-swiping-down .tm-settings-panel{\n    opacity:0 !important;\n    pointer-events:none !important;\n    transition:opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;\n}\n.tm-jump-active{\n    position:absolute;\n    width:4px;\n    height:100%;\n    top:0;\n    transform:translateX(-50%);\n    z-index:5;\n    background-color:hsla(var(--shadcn-green) / 0.8);\n    border-radius:2px;\n    box-shadow:0 0 8px hsla(var(--shadcn-green) / 0.5);\n    pointer-events:none;\n    animation:tm-jump-flash-fade 3.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;\n}\n\n@keyframes tm-jump-flash-fade{\n    0%, 20%, 40%, 60%, 80%{\n        opacity:1;\n        background-color:hsl(var(--shadcn-green));\n        box-shadow:0 0 16px 4px hsl(var(--shadcn-green));\n        transform:translateX(-50%) scaleX(1.6);\n    }\n    10%, 30%, 50%, 70%{\n        opacity:0.3;\n        background-color:hsla(var(--shadcn-green) / 0.4);\n        box-shadow:0 0 4px hsla(var(--shadcn-green) / 0.2);\n        transform:translateX(-50%) scaleX(1.0);\n    }\n    90%{\n        opacity:0.5;\n        background-color:hsla(var(--shadcn-green) / 0.5);\n        box-shadow:0 0 6px hsla(var(--shadcn-green) / 0.3);\n        transform:translateX(-50%) scaleX(0.8);\n    }\n    100%{\n        opacity:0;\n        background-color:transparent;\n        box-shadow:none;\n        transform:translateX(-50%) scaleX(0);\n    }\n}\n.tm-sidebar-pos-button,\n.tm-sidebar-toggle-button{\n    position:relative;\n    width:var(--button-md);\n    height:var(--button-md);\n    border-radius:calc(var(--button-md) / 2);\n    background-color:hsla(var(--shadcn-secondary) / 0.7);\n    color:hsl(var(--shadcn-secondary-foreground));\n    border:1px solid hsla(var(--shadcn-border) / 0.2);\n    display:none !important;\n    align-items:center;\n    justify-content:center;\n    cursor:pointer;\n    transition:all var(--anim-quick);\n}\n\n.tm-sidebar-pos-button:hover,\n.tm-sidebar-toggle-button:hover{\n    background-color:hsla(var(--shadcn-accent) / 0.9);\n    transform:scale(1.1);\n}\n\n.tm-sidebar-pos-button:active,\n.tm-sidebar-toggle-button:active{\n    transform:scale(0.9);\n}\n.tm-sidebar-hidden .tm-sidebar-pos-button{\n    display:none !important;\n}\n@media screen and (min-width: 480px) and (orientation: portrait){\n    .tm-control-buttons{\n        max-width:520px;\n    }\n}\n\n@media screen and (min-width: 768px) and (orientation: portrait){\n    .tm-control-buttons{\n        max-width:640px;\n    }\n    .tm-comments-panel{\n        max-width:720px;\n        margin:0 auto;\n        border-left:1px solid hsla(var(--shadcn-border) / 0.1);\n        border-right:1px solid hsla(var(--shadcn-border) / 0.1);\n        box-shadow:0 4px 20px rgba(0, 0, 0, 0.08);\n        background-color:hsla(var(--shadcn-card) / 0.02);\n    }\n}\nbody.tm-player-active header,\nbody.tm-player-active .header,\nbody.tm-player-active navbar,\nbody.tm-player-active .navbar,\nbody.tm-player-active #header-top,\nbody.tm-player-active .top-nav,\nbody.tm-player-active [class*="header--sticky"],\nbody.tm-player-active [class*="navbar-fixed"]{\n    display:none !important;\n}\n\n.tm-progress-markers-container{\n    position:absolute;\n    top:0;\n    left:0;\n    width:100%;\n    height:100%;\n    pointer-events:none;\n    z-index:5;\n}\n.tm-progress-marker-tick{\n    position:absolute;\n    width:6px;\n    height:3px;\n    bottom:-4px;\n    transform:translateX(-50%);\n    background-color:hsla(var(--tab-color), 0.25);\n    border-radius:1.5px;\n    cursor:pointer;\n    z-index:10;\n    pointer-events:auto;\n    transition:all var(--anim-quick);\n}\n.tm-progress-marker-tick:hover{\n    height:4px;\n    bottom:-5px;\n    background-color:hsla(var(--tab-color), 0.45);\n    transform:translateX(-50%) scale(1.1);\n}\n.tm-progress-marker-range{\n    position:absolute;\n    height:3px;\n    bottom:-4px;\n    background-color:hsla(var(--tab-color), 0.25);\n    border-radius:1.5px;\n    cursor:pointer;\n    z-index:9;\n    pointer-events:auto;\n    transition:all var(--anim-quick);\n}\n.tm-progress-marker-range:hover{\n    height:4px;\n    bottom:-5px;\n    background-color:hsla(var(--tab-color), 0.45);\n}\n\n.tm-active-loop-played{\n    position:absolute;\n    height:100%;\n    top:0;\n    background-color:hsla(var(--tab-color), 0.45);\n    z-index:8;\n    pointer-events:none;\n    box-shadow:0 0 4px hsla(var(--tab-color), 0.15);\n}\n\n.tm-active-loop-unplayed{\n    position:absolute;\n    height:100%;\n    top:0;\n    background-color:hsla(var(--tab-color), 0.15);\n    z-index:7;\n    pointer-events:none;\n}\n\n.tm-active-loop-boundary{\n    position:absolute;\n    width:4px;\n    height:100%;\n    top:0;\n    transform:translateX(-50%);\n    background-color:hsla(var(--tab-color), 0.75);\n    z-index:9;\n    pointer-events:none;\n    box-shadow:0 0 3px rgba(0, 0, 0, 0.3);\n}\n.tm-active-loop-boundary.start{\n    border-radius:2px 0 0 2px;\n}\n.tm-active-loop-boundary.end{\n    border-radius:0 2px 2px 0;\n}\n`, "" ]);
      const y = b;
    },
    "479": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `:root{\n    --brand-pink:rgb(254, 98, 142);\n    --brand-pink-rgb:254, 98, 142;\n    --shadcn-background:0 0% 0%;\n    --shadcn-foreground:0 0% 100%;\n    --shadcn-card:0 0% 5%;\n    --shadcn-card-foreground:0 0% 95%;\n    --shadcn-popover:0 0% 10%;\n    --shadcn-popover-foreground:0 0% 95%;\n    --shadcn-primary:210 10% 90%;\n    --shadcn-primary-foreground:210 20% 10%;\n    --shadcn-secondary:0 0% 15%;\n    --shadcn-secondary-foreground:0 0% 95%;\n    --shadcn-muted:0 0% 30%;\n    --shadcn-muted-foreground:0 0% 70%;\n    --shadcn-accent:212 40% 30%;\n    --shadcn-accent-foreground:0 0% 95%;\n    --shadcn-destructive:0 50% 40%;\n    --shadcn-destructive-foreground:0 0% 95%;\n    --shadcn-border:0 0% 30%;\n    --shadcn-input:0 0% 15%;\n    --shadcn-ring:212 70% 45%;\n    --shadcn-green:142 50% 45%;\n    --shadcn-green-foreground:0 0% 95%;\n    --shadcn-blue:211 70% 55%;\n    --shadcn-blue-foreground:0 0% 95%;\n    --shadcn-red:0 60% 50%;\n    --shadcn-red-foreground:0 0% 95%;\n    --shadcn-orange:25 80% 50%;\n    --shadcn-orange-foreground:0 0% 95%;\n    --shadcn-purple:262 60% 60%;\n    --shadcn-purple-foreground:0 0% 95%;\n    --shadcn-radius:0.5rem;\n    --shadcn-radius-sm:0.3rem;\n    --shadcn-radius-lg:0.8rem;\n    --button-sm:20px;\n    --button-md:32px;\n    --button-lg:40px;\n    --button-xl:48px;\n    --anim-quick:0.2s cubic-bezier(0.4, 0, 0.2, 1);\n    --anim-smooth:0.3s cubic-bezier(0.16, 1, 0.3, 1);\n    --anim-bounce:0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n    --shadow-sm:0 2px 5px rgba(0, 0, 0, 0.2);\n    --shadow-md:0 4px 10px rgba(0, 0, 0, 0.25);\n    --shadow-lg:0 8px 20px rgba(0, 0, 0, 0.3);\n    --font-sans:"SF Pro Display", "SF Pro", "Segoe UI", "Microsoft YaHei", "微软雅黑", "PingFang SC", "苹方", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n}\nhtml, body, button, input, select, textarea{\n    font-family:var(--font-sans);\n}\n*, *::before, *::after{\n    font-family:inherit;\n}\n\n.tm-video-overlay *{\n    font-family:var(--font-sans);\n}\n`, "" ]);
      const y = b;
    },
    "540": r => {
      function insertStyleElement(r) {
        var o = document.createElement("style");
        r.setAttributes(o, r.attributes);
        r.insert(o, r.options);
        return o;
      }
      r.exports = insertStyleElement;
    },
    "601": r => {
      r.exports = function(r) {
        return r[1];
      };
    },
    "659": r => {
      var o = {};
      function getTarget(r) {
        if (typeof o[r] === "undefined") {
          var a = document.querySelector(r);
          if (window.HTMLIFrameElement && a instanceof window.HTMLIFrameElement) {
            try {
              a = a.contentDocument.head;
            } catch (r) {
              a = null;
            }
          }
          o[r] = a;
        }
        return o[r];
      }
      function insertBySelector(r, o) {
        var a = getTarget(r);
        if (!a) {
          throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
        }
        a.appendChild(o);
      }
      r.exports = insertBySelector;
    },
    "703": (r, o, a) => {
      a.d(o, {
        "A": () => D
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = a(479);
      var y = a(401);
      var C = a(465);
      var k = a(140);
      var _ = a(12);
      var E = a(725);
      var S = a(919);
      var P = v()(u());
      P.i(b.A);
      P.i(y.A);
      P.i(C.A);
      P.i(k.A);
      P.i(_.A);
      P.i(E.A);
      P.i(S.A);
      P.push([ r.id, `\n\n`, "" ]);
      const D = P;
    },
    "725": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `@media screen and (max-width: 929px) and (orientation: landscape){\n    .tm-video-container{\n        width:100% !important;\n        height:100vh !important;\n        max-height:100vh !important;\n        min-height:auto !important;\n        margin:0 !important;\n        padding:0 !important;\n        border-radius:0 !important;\n        box-shadow:none !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        background-color:black !important;\n    }\n    .tm-video-wrapper{\n        position:relative !important;\n        width:100% !important;\n        height:100% !important;\n        border-radius:0 !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        overflow:hidden !important;\n    }\n    .tm-video-wrapper video{\n        width:100% !important;\n        height:auto !important;\n        max-height:100vh !important;\n        object-fit:contain !important;\n    }\n    .tm-video-wrapper.video-portrait video{\n        width:auto !important;\n        height:100% !important;\n        max-width:100% !important;\n    }\n    .tm-button-container{\n        position:absolute;\n        top:0;\n        left:0;\n        right:0;\n        z-index:9995;\n        background-color:transparent;\n        padding:16px;\n        padding-top:calc(env(safe-area-inset-top, 8px) + 8px);\n        padding-left:calc(env(safe-area-inset-left, 16px) + 16px);\n        padding-right:calc(env(safe-area-inset-right, 16px) + 16px);\n        display:flex;\n        justify-content:space-between;\n        transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n    }\n    .tm-video-overlay.controls-hidden .tm-button-container{\n        opacity:0;\n        transform:translateY(-60px);\n        pointer-events:none;\n    }\n    .tm-video-overlay .tm-button-container{\n        opacity:1;\n        transform:translateY(0);\n        pointer-events:auto;\n    }\n    .tm-settings-button{\n        display:flex;\n        background-color:hsla(var(--shadcn-secondary) / 0.3);\n        backdrop-filter:blur(4px);\n        -webkit-backdrop-filter:blur(4px);\n    }\n    .tm-close-button{\n        background-color:hsla(var(--shadcn-secondary) / 0.3);\n        backdrop-filter:blur(4px);\n        -webkit-backdrop-filter:blur(4px);\n    }\n    .tm-control-buttons{\n        position:absolute;\n        bottom:calc(10px + env(safe-area-inset-bottom, 0px));\n        left:50%;\n        transform:translateX(-50%);\n        width:90%;\n        max-width:700px;\n        min-width:350px;\n        background-color:transparent;\n        backdrop-filter:none;\n        -webkit-backdrop-filter:none;\n        z-index:9994;\n        padding:16px 16px 14px;\n        border-radius:16px;\n        border:none;\n        box-shadow:none;\n        transition:opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);\n    }\n    .tm-video-overlay.controls-hidden .tm-control-buttons{\n        opacity:0;\n        transform:translateX(-50%) translateY(calc(100% + 30px));\n        pointer-events:none;\n    }\n    .tm-video-overlay .tm-control-buttons{\n        opacity:1;\n        transform:translateX(-50%) translateY(0);\n        pointer-events:auto;\n    }\n    .tm-video-overlay{\n        background-color:black;\n        backdrop-filter:none;\n        -webkit-backdrop-filter:none;\n    }\n    .tm-floating-button{\n        bottom:30px;\n        left:50%;\n        transform:translateX(-50%);\n        padding:0;\n        width:calc(var(--button-xl));\n        height:calc(var(--button-xl));\n    }\n    .tm-handle-container{\n        display:none !important;\n    }\n}\n@media screen and (orientation: landscape) and (max-height: 480px){\n    .tm-control-buttons{\n        padding:6px 12px !important;\n        gap:6px !important;\n    }\n    .tm-control-buttons .tm-seek-control-row,\n    .tm-control-buttons .tm-loop-control-row,\n    .tm-control-buttons .tm-playback-control-row{\n        gap:6px !important;\n    }\n    .tm-control-buttons .tm-tab-pill{\n        padding:3px 8px !important;\n        font-size:0.75rem !important;\n    }\n}\n`, "" ]);
      const y = b;
    },
    "825": r => {
      function apply(r, o, a) {
        var l = "";
        if (a.supports) {
          l += "@supports (".concat(a.supports, ") {");
        }
        if (a.media) {
          l += "@media ".concat(a.media, " {");
        }
        var u = typeof a.layer !== "undefined";
        if (u) {
          l += "@layer".concat(a.layer.length > 0 ? " ".concat(a.layer) : "", " {");
        }
        l += a.css;
        if (u) {
          l += "}";
        }
        if (a.media) {
          l += "}";
        }
        if (a.supports) {
          l += "}";
        }
        var p = a.sourceMap;
        if (p && typeof btoa !== "undefined") {
          l += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(p)))), " */");
        }
        o.styleTagTransform(l, r, o.options);
      }
      function removeStyleElement(r) {
        if (r.parentNode === null) {
          return false;
        }
        r.parentNode.removeChild(r);
      }
      function domAPI(r) {
        if (typeof document === "undefined") {
          return {
            "update": function update() {},
            "remove": function remove() {}
          };
        }
        var o = r.insertStyleElement(r);
        return {
          "update": function update(a) {
            apply(o, r, a);
          },
          "remove": function remove() {
            removeStyleElement(o);
          }
        };
      }
      r.exports = domAPI;
    },
    "919": (r, o, a) => {
      a.d(o, {
        "A": () => y
      });
      var l = a(601);
      var u = a.n(l);
      var p = a(314);
      var v = a.n(p);
      var b = v()(u());
      b.push([ r.id, `.tm-control-drag-handle{\n    display:none;\n    width:100%;\n    height:14px;\n    justify-content:center;\n    align-items:center;\n    cursor:grab;\n    user-select:none;\n    margin-bottom:2px;\n    position:relative;\n}\n\n.tm-control-drag-handle:active{\n    cursor:grabbing;\n}\n\n.tm-control-drag-handle::before{\n    content:"";\n    width:36px;\n    height:4px;\n    background-color:hsla(var(--shadcn-foreground) / 0.3);\n    border-radius:2px;\n    transition:background-color 0.2s ease;\n}\n\n.tm-control-drag-handle:hover::before{\n    background-color:hsla(var(--shadcn-foreground) / 0.6);\n}\n@media screen and (min-width: 930px) and (orientation: landscape){\n    :root{\n        --sidebar-width:clamp(350px, 25vw, 420px);\n    }\n}\n@media screen and (min-width: 1440px) and (orientation: landscape){\n    :root{\n        --sidebar-width:clamp(380px, 22vw, 560px);\n    }\n}\n@media screen and (min-width: 930px) and (orientation: landscape){\n    .tm-player-container{\n        display:grid !important;\n        grid-template-columns:1fr var(--sidebar-width) !important;\n        grid-template-rows:minmax(0, 1fr) !important;\n        grid-template-areas:"video sidebar" !important;\n        height:100% !important;\n        height:100dvh !important;\n        max-height:100dvh !important;\n        width:100vw !important;\n        overflow:hidden !important;\n        background-color:#000 !important;\n        position:fixed !important;\n        top:0 !important;\n        bottom:0 !important;\n        left:0 !important;\n        right:0 !important;\n        z-index:2000000001 !important;\n    }\n    .tm-comments-panel .tm-button-container{\n        grid-area:auto !important;\n        position:relative !important;\n        width:100% !important;\n        height:44px !important;\n        padding:0 16px !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:space-between !important;\n        background-color:transparent !important;\n        border-bottom:1px solid hsla(var(--shadcn-border) / 0.1) !important;\n        backdrop-filter:none !important;\n        -webkit-backdrop-filter:none !important;\n        box-shadow:none !important;\n        z-index:10000 !important;\n        transform:none !important;\n        opacity:1 !important;\n        pointer-events:auto !important;\n        box-sizing:border-box !important;\n    }\n    .tm-player-container.tm-sidebar-hidden .tm-button-container{\n        position:fixed !important;\n        top:16px !important;\n        left:16px !important;\n        right:16px !important;\n        width:calc(100% - 32px) !important;\n        height:44px !important;\n        padding:0 !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:flex-start !important;\n        gap:8px !important;\n        background:transparent !important;\n        border:none !important;\n        box-shadow:none !important;\n        backdrop-filter:none !important;\n        -webkit-backdrop-filter:none !important;\n        z-index:10000 !important;\n        transform:none !important;\n        opacity:1 !important;\n        pointer-events:none !important;\n    }\n\n    .tm-player-container.tm-sidebar-hidden .tm-button-container > *{\n        pointer-events:auto !important;\n        background-color:hsla(var(--shadcn-card) / 0.8) !important;\n        border:1px solid hsla(var(--shadcn-border) / 0.2) !important;\n        box-shadow:0 2px 8px rgba(0, 0, 0, 0.3) !important;\n        border-radius:50% !important;\n        display:flex !important;\n        align-items:center !important;\n        justify-content:center !important;\n        width:var(--button-md) !important;\n        height:var(--button-md) !important;\n    }\n    .tm-player-container.tm-sidebar-hidden:not(.tm-sidebar-left) .tm-sidebar-toggle-button{\n        margin-left:auto !important;\n    }\n    .tm-player-container.tm-sidebar-hidden.tm-sidebar-left .tm-close-button{\n        margin-left:auto !important;\n    }\n    .tm-video-container{\n        grid-area:video;\n        width:100% !important;\n        height:100% !important;\n        max-height:none !important;\n        margin-top:0 !important;\n        border-radius:0 !important;\n        box-shadow:none !important;\n        background-color:#000 !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        padding:0 !important;\n        overflow:hidden !important;\n    }\n    .tm-video-wrapper{\n        position:relative !important;\n        width:100% !important;\n        height:100% !important;\n        border-radius:0 !important;\n        display:flex !important;\n        justify-content:center !important;\n        align-items:center !important;\n        overflow:hidden !important;\n    }\n    .tm-video-minimap{\n        bottom:calc(36px + env(safe-area-inset-bottom, 0px)) !important;\n        left:calc(24px + env(safe-area-inset-left, 0px)) !important;\n    }\n    .tm-video-wrapper video{\n        width:auto !important;\n        height:100% !important;\n        max-height:100% !important;\n        max-width:none !important;\n        min-width:0 !important;\n        flex-shrink:0 !important;\n        object-fit:contain !important;\n    }\n    .tm-video-wrapper.video-portrait video{\n        width:auto !important;\n        height:100% !important;\n        max-width:100% !important;\n    }\n    .tm-comments-panel{\n        display:flex !important;\n        grid-area:sidebar;\n        position:relative !important;\n        width:100% !important;\n        height:100% !important;\n        max-height:100% !important;\n        min-height:0 !important;\n        background-color:hsla(var(--shadcn-card) / 0.95) !important;\n        border-left:1px solid hsla(var(--shadcn-border) / 0.15) !important;\n        backdrop-filter:blur(20px) !important;\n        -webkit-backdrop-filter:blur(20px) !important;\n        box-sizing:border-box !important;\n        z-index:9990 !important;\n        pointer-events:auto !important;\n        flex-direction:column !important;\n        overflow:hidden !important;\n        visibility:visible !important;\n        opacity:1 !important;\n    }\n    .tm-comments-panel::after{\n        display:none !important;\n    }\n    .tm-comments-panel-list.tm-comments-list{\n        flex:1 1 0% !important;\n        height:0 !important;\n        min-height:0 !important;\n        max-height:100% !important;\n        width:100% !important;\n        display:flex !important;\n        flex-direction:column !important;\n        overflow-y:auto !important;\n        box-sizing:border-box !important;\n        padding:8px 16px 0px 16px !important;\n        pointer-events:auto !important;\n    }\n\n    .tm-comment-section{\n        min-height:0 !important;\n        flex-shrink:1 !important;\n        display:flex !important;\n        flex-direction:column !important;\n        overflow:hidden !important;\n    }\n\n    .tm-comment-section:not(.is-collapsed){\n        flex:1 1 0% !important;\n        height:0 !important;\n        min-height:0 !important;\n        overflow:hidden !important;\n    }\n    .tm-comment-section-body{\n        flex:1 1 0% !important;\n        height:0 !important;\n        min-height:0 !important;\n        overflow-y:auto !important;\n        padding-bottom:4px !important;\n    }\n    .tm-comments-panel-action-bar{\n        position:relative !important;\n        bottom:auto !important;\n        left:auto !important;\n        right:auto !important;\n        flex:0 0 auto !important;\n        flex-shrink:0 !important;\n        z-index:9995 !important;\n    }\n\n    .tm-comment-submit-bar-wrapper{\n        position:relative !important;\n        bottom:auto !important;\n        left:auto !important;\n        right:auto !important;\n        flex:0 0 auto !important;\n        flex-shrink:0 !important;\n        z-index:9996 !important;\n    }\n    .tm-comments-panel-publish-btn{\n        bottom:56px !important;\n        left:50% !important;\n        transform:translateX(-50%) !important;\n        z-index:9995 !important;\n    }\n    .tm-handle-container{\n        display:none !important;\n    }\n    .tm-control-buttons{\n        position:fixed !important;\n        bottom:16px;\n        right:16px;\n        left:auto;\n        transform:none;\n        width:calc(var(--sidebar-width) - 32px) !important;\n        max-width:calc(var(--sidebar-width) - 32px) !important;\n        min-width:348px !important;\n        background-color:rgba(10, 10, 10, 0.52) !important;\n        border:none !important;\n        border-radius:16px !important;\n        backdrop-filter:blur(24px) !important;\n        -webkit-backdrop-filter:blur(24px) !important;\n        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 12px 32px rgba(0, 0, 0, 0.45) !important;\n        z-index:10001 !important;\n        padding:8px 12px 12px 12px !important;\n        transition:opacity 0.3s ease, transform 0.3s ease !important;\n        display:flex !important;\n        flex-direction:column !important;\n        gap:8px !important;\n    }\n    .tm-control-drag-handle{\n        display:flex !important;\n    }\n    .tm-control-buttons.dragging{\n        transition:none !important;\n        cursor:grabbing;\n        box-shadow:0 15px 40px rgba(0, 0, 0, 0.6) !important;\n        border:none !important;\n    }\n    body.controls-hidden .tm-control-buttons{\n        opacity:0 !important;\n        transform:translateY(20px) !important;\n        pointer-events:none !important;\n    }\n\n    body:not(.controls-hidden) .tm-control-buttons{\n        opacity:1 !important;\n        transform:none !important;\n        pointer-events:auto !important;\n    }\n    .tm-video-overlay{\n        background-color:rgba(0, 0, 0, 0.75) !important;\n        backdrop-filter:blur(10px) !important;\n        -webkit-backdrop-filter:blur(10px) !important;\n    }\n    .tm-settings-panel{\n        z-index:10002 !important;\n    }\n    .tm-comments-panel{\n        transition:margin-top 0.25s cubic-bezier(0.25, 1, 0.5, 1), margin-bottom 0.25s cubic-bezier(0.25, 1, 0.5, 1), height 0.25s cubic-bezier(0.25, 1, 0.5, 1) !important;\n    }\n    .tm-player-container.tm-controls-docked-br .tm-comments-panel,\n    .tm-player-container.tm-controls-docked-bl .tm-comments-panel{\n        margin-bottom:var(--docked-controls-height) !important;\n        height:calc(100% - var(--docked-controls-height)) !important;\n    }\n    .tm-player-container.tm-controls-docked-tr .tm-comments-panel,\n    .tm-player-container.tm-controls-docked-tl .tm-comments-panel{\n        margin-top:var(--docked-controls-height) !important;\n        height:calc(100% - var(--docked-controls-height)) !important;\n    }\n    .tm-player-container.tm-controls-docked-br .tm-comments-panel-list.tm-comments-list,\n    .tm-player-container.tm-controls-docked-bl .tm-comments-panel-list.tm-comments-list,\n    .tm-player-container.tm-controls-docked-tr .tm-comments-panel-list.tm-comments-list,\n    .tm-player-container.tm-controls-docked-tl .tm-comments-panel-list.tm-comments-list{\n        padding-bottom:8px !important;\n    }\n    .tm-player-container[class*="tm-controls-docked-"] .tm-control-buttons,\n    body.controls-hidden .tm-player-container[class*="tm-controls-docked-"] .tm-control-buttons{\n        position:fixed !important;\n        width:var(--sidebar-width) !important;\n        max-width:var(--sidebar-width) !important;\n        border-radius:0 !important;\n        border:none !important;\n        box-shadow:none !important;\n        padding:12px 16px 12px 16px !important;\n        background-color:hsla(var(--shadcn-card) / 0.65) !important;\n        backdrop-filter:blur(24px) !important;\n        -webkit-backdrop-filter:blur(24px) !important;\n        opacity:1 !important;\n        transform:none !important;\n        pointer-events:auto !important;\n    }\n    \n    .tm-player-container.tm-controls-docked-br .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-bl .tm-control-buttons{\n        bottom:0 !important;\n        top:auto !important;\n    }\n    .tm-player-container.tm-controls-docked-tr .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-tl .tm-control-buttons{\n        top:0 !important;\n        bottom:auto !important;\n    }\n    \n    .tm-player-container.tm-controls-docked-br .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-tr .tm-control-buttons{\n        right:0 !important;\n        left:auto !important;\n    }\n    .tm-player-container.tm-controls-docked-bl .tm-control-buttons,\n    .tm-player-container.tm-controls-docked-tl .tm-control-buttons{\n        left:0 !important;\n        right:auto !important;\n    }\n    .tm-player-container.tm-sidebar-left{\n        grid-template-columns:var(--sidebar-width) 1fr !important;\n        grid-template-areas:"sidebar video" !important;\n    }\n    .tm-player-container.tm-sidebar-left .tm-comments-panel{\n        border-left:none !important;\n        border-right:1px solid hsla(var(--shadcn-border) / 0.15) !important;\n    }\n    .tm-player-container.tm-sidebar-left .tm-settings-panel{\n        right:auto !important;\n        left:16px !important;\n    }\n    .tm-player-container.tm-sidebar-hidden{\n        grid-template-columns:1fr !important;\n        grid-template-areas:"video" !important;\n    }\n    .tm-player-container.tm-sidebar-hidden .tm-comments-panel{\n        position:absolute !important;\n        width:0 !important;\n        height:0 !important;\n        border:none !important;\n        overflow:visible !important;\n        background:transparent !important;\n        backdrop-filter:none !important;\n        -webkit-backdrop-filter:none !important;\n        pointer-events:none !important;\n        visibility:hidden !important;\n        opacity:0 !important;\n    }\n    .tm-sidebar-pos-button,\n    .tm-sidebar-toggle-button{\n        display:flex !important;\n    }\n    .tm-player-container[class*="tm-controls-docked-"] .tm-settings-panel{\n        padding:0px !important;\n    }\n    .tm-player-container[class*="tm-controls-docked-"] .tm-settings-panel .tm-settings-options{\n        padding:12px !important;\n    }\n    .tm-player-title{\n        top:16px !important;\n        left:calc((100% - var(--sidebar-width)) / 2) !important;\n        transform:translateX(-50%) !important;\n        max-width:calc(100% - var(--sidebar-width) - 40px) !important;\n    }\n    \n    .tm-player-container.tm-sidebar-left .tm-player-title{\n        left:calc((100% + var(--sidebar-width)) / 2) !important;\n    }\n\n    .tm-player-container.tm-sidebar-hidden .tm-player-title{\n        left:50% !important;\n        max-width:calc(100% - 200px) !important;\n    }\n}\n@media screen and (min-width: 930px) and (max-width: 1023px) and (orientation: landscape){\n    .tm-control-buttons{\n        padding:6px 8px 10px 8px !important;\n        gap:6px !important;\n        border-radius:12px !important;\n    }\n    .tm-control-drag-handle{\n        height:10px !important;\n    }\n    .tm-time-display{\n        font-size:11px !important;\n    }\n    .tm-tab-pill{\n        padding:3px 8px !important;\n        font-size:0.7rem !important;\n    }\n}\n@media screen and (min-width: 480px) and (orientation: portrait),\n       screen and (min-width: 480px) and (max-width: 929px) and (orientation: landscape){\n    .tm-control-buttons{\n        position:fixed !important;\n        bottom:16px;\n        right:16px;\n        left:auto;\n        transform:none;\n        width:348px !important;\n        max-width:348px !important;\n        min-width:320px !important;\n        background-color:hsla(var(--shadcn-card) / 0.85) !important;\n        border:1px solid hsla(var(--shadcn-border) / 0.2) !important;\n        border-radius:16px !important;\n        backdrop-filter:blur(16px) !important;\n        -webkit-backdrop-filter:blur(16px) !important;\n        box-shadow:0 10px 30px rgba(0, 0, 0, 0.5) !important;\n        z-index:10001 !important;\n        padding:8px 12px 12px 12px !important;\n        transition:opacity 0.3s ease, transform 0.3s ease !important;\n        display:flex !important;\n        flex-direction:column !important;\n        gap:8px !important;\n    }\n    .tm-control-drag-handle{\n        display:flex !important;\n    }\n    body.controls-hidden .tm-control-buttons{\n        opacity:0 !important;\n        transform:translateY(20px) !important;\n        pointer-events:none !important;\n    }\n\n    body:not(.controls-hidden) .tm-control-buttons{\n        opacity:1 !important;\n        transform:none !important;\n        pointer-events:auto !important;\n    }\n\n\n}\n`, "" ]);
      const y = b;
    },
    "964": (r, o, a) => {
      a.r(o);
      a.d(o, {
        "default": () => A
      });
      var l = a(72);
      var u = a.n(l);
      var p = a(825);
      var v = a.n(p);
      var b = a(659);
      var y = a.n(b);
      var C = a(56);
      var k = a.n(C);
      var _ = a(540);
      var E = a.n(_);
      var S = a(113);
      var P = a.n(S);
      var D = a(703);
      var L = {};
      L.styleTagTransform = P();
      L.setAttributes = k();
      L.insert = y().bind(null, "head");
      L.domAPI = v();
      L.insertStyleElement = E();
      var M = u()(D.A, L);
      const A = D.A && D.A.locals ? D.A.locals : void 0;
    }
  };
  var o = {};
  function __webpack_require__(a) {
    var l = o[a];
    if (l !== void 0) {
      return l.exports;
    }
    var u = o[a] = {
      "id": a,
      "exports": {}
    };
    r[a](u, u.exports, __webpack_require__);
    return u.exports;
  }
  (() => {
    __webpack_require__.n = r => {
      var o = r && r.__esModule ? () => r["default"] : () => r;
      __webpack_require__.d(o, {
        "a": o
      });
      return o;
    };
  })();
  (() => {
    __webpack_require__.d = (r, o) => {
      for (var a in o) {
        if (__webpack_require__.o(o, a) && !__webpack_require__.o(r, a)) {
          Object.defineProperty(r, a, {
            "enumerable": true,
            "get": o[a]
          });
        }
      }
    };
  })();
  (() => {
    __webpack_require__.o = (r, o) => Object.prototype.hasOwnProperty.call(r, o);
  })();
  (() => {
    __webpack_require__.r = r => {
      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        Object.defineProperty(r, Symbol.toStringTag, {
          "value": "Module"
        });
      }
      Object.defineProperty(r, "__esModule", {
        "value": true
      });
    };
  })();
  (() => {
    __webpack_require__.nc = void 0;
  })();
  var a = {};
  function formatTime(r) {
    if (isNaN(r) || r < 0) {
      return "0:00";
    }
    var o = Math.floor(r / 3600);
    var a = Math.floor(r % 3600 / 60);
    var l = Math.floor(r % 60);
    if (o > 0) {
      return "".concat(o, ":").concat(a < 10 ? "0" : "").concat(a, ":").concat(l < 10 ? "0" : "").concat(l);
    }
    return "".concat(a, ":").concat(l < 10 ? "0" : "").concat(l);
  }
  function formatTimeWithHours(r) {
    if (isNaN(r) || r < 0) {
      return "00:00:00";
    }
    var o = Math.floor(r);
    var a = Math.floor(o / 3600);
    var l = Math.floor(o % 3600 / 60);
    var u = o % 60;
    return "".concat(a.toString().padStart(2, "0"), ":").concat(l.toString().padStart(2, "0"), ":").concat(u.toString().padStart(2, "0"));
  }
  var l = {
    "isIOS": null,
    "isMobile": null
  };
  function isIOS() {
    if (l.isIOS === null) {
      l.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    return l.isIOS;
  }
  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }
  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }
  function getSafeAreaInsets() {
    var r = 44;
    var o = 34;
    var a = 16;
    var l = window.getComputedStyle(document.documentElement);
    return {
      "top": parseInt(l.getPropertyValue("--sat") || l.getPropertyValue("--safe-area-inset-top") || "0", 10) || r,
      "right": parseInt(l.getPropertyValue("--sar") || l.getPropertyValue("--safe-area-inset-right") || "0", 10) || a,
      "bottom": parseInt(l.getPropertyValue("--sab") || l.getPropertyValue("--safe-area-inset-bottom") || "0", 10) || o,
      "left": parseInt(l.getPropertyValue("--sal") || l.getPropertyValue("--safe-area-inset-left") || "0", 10) || a
    };
  }
  var u = {
    "original": {
      "dark": null
    }
  };
  function updateSafariThemeColor() {
    var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "#000000";
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    if (!isSafari() && !isIOS()) {
      return;
    }
    var a = document.querySelector('meta[name="theme-color"]');
    if (o && a && !u.original.dark) {
      u.original.dark = a.content;
    }
    if (!a) {
      a = document.createElement("meta");
      a.name = "theme-color";
      document.head.appendChild(a);
    }
    a.content = r;
  }
  function restoreSafariThemeColor() {
    if (u.original.dark) {
      updateSafariThemeColor(u.original.dark);
    } else {
      var r = document.querySelector('meta[name="theme-color"]');
      if (r && r.parentNode) {
        r.parentNode.removeChild(r);
      }
    }
  }
  function isMobile() {
    if (l.isMobile === null) {
      l.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return l.isMobile;
  }
  function _typeof(r) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, _typeof(r);
  }
  function ownKeys(r, o) {
    var a = Object.keys(r);
    if (Object.getOwnPropertySymbols) {
      var l = Object.getOwnPropertySymbols(r);
      o && (l = l.filter((function(o) {
        return Object.getOwnPropertyDescriptor(r, o).enumerable;
      }))), a.push.apply(a, l);
    }
    return a;
  }
  function _objectSpread(r) {
    for (var o = 1; o < arguments.length; o++) {
      var a = null != arguments[o] ? arguments[o] : {};
      o % 2 ? ownKeys(Object(a), !0).forEach((function(o) {
        _defineProperty(r, o, a[o]);
      })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(a)) : ownKeys(Object(a)).forEach((function(o) {
        Object.defineProperty(r, o, Object.getOwnPropertyDescriptor(a, o));
      }));
    }
    return r;
  }
  function _defineProperty(r, o, a) {
    return (o = _toPropertyKey(o)) in r ? Object.defineProperty(r, o, {
      "value": a,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : r[o] = a, r;
  }
  function _toPropertyKey(r) {
    var o = _toPrimitive(r, "string");
    return "symbol" == _typeof(o) ? o : o + "";
  }
  function _toPrimitive(r, o) {
    if ("object" != _typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != _typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  function createElementWithStyle(r, o, a) {
    var l = document.createElement(r);
    if (o) {
      l.className = o;
    }
    if (a) {
      l.style.cssText = a;
    }
    return l;
  }
  function delegateEvent(r, o, a, l, u) {
    r.addEventListener(o, (function(o) {
      var u = o.target.closest(a);
      if (u && r.contains(u)) {
        l.call(u, o);
      }
    }), u);
  }
  function waitForElement(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e4;
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 100;
    return new Promise((function(l, u) {
      var p = document.querySelector(r);
      if (p) {
        return l(p);
      }
      var v = Date.now();
      var b = setInterval((function() {
        var a = document.querySelector(r);
        if (a) {
          clearInterval(b);
          return l(a);
        }
        if (Date.now() - v > o) {
          clearInterval(b);
          u(new Error("等待元素 ".concat(r, " 超时")));
        }
      }), a);
    }));
  }
  function findVideoElement() {
    var r = null;
    var o = [ "#player video", "#video video", "div.plyr__video-wrapper video", ".video-js video", "#player > video", "#video-player > video", "video[preload]:not([muted])" ];
    for (var a = 0, l = o; a < l.length; a++) {
      var u = l[a];
      r = document.querySelector(u);
      if (r) {
        return r;
      }
    }
    var p = Array.from(document.querySelectorAll("video"));
    if (p.length === 0) {
      return null;
    }
    if (p.length === 1) {
      return p[0];
    }
    var v = p.map((function(r) {
      return {
        "element": r,
        "rect": r.getBoundingClientRect()
      };
    })).filter((function(r) {
      return r.rect.width > 50 && r.rect.height > 50;
    })).map((function(r) {
      return _objectSpread(_objectSpread({}, r), {}, {
        "area": r.rect.width * r.rect.height
      });
    })).sort((function(r, o) {
      return o.area - r.area;
    }));
    if (v.length > 0) {
      return v[0].element;
    }
    return p[0];
  }
  function storage_typeof(r) {
    "@babel/helpers - typeof";
    return storage_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, storage_typeof(r);
  }
  var p = "missNoAD_";
  function hasGMApi() {
    return typeof GM_getValue === "function" && typeof GM_setValue === "function";
  }
  function getValue(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    try {
      if (a && hasGMApi()) {
        return GM_getValue(r, o);
      }
      var l = localStorage.getItem(p + r);
      if (l !== null) {
        try {
          return JSON.parse(l);
        } catch (r) {
          return l;
        }
      }
      return o;
    } catch (r) {
      return o;
    }
  }
  function setValue(r, o) {
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    try {
      if (a && hasGMApi()) {
        GM_setValue(r, o);
        return;
      }
      var l = storage_typeof(o) === "object" ? JSON.stringify(o) : o;
      localStorage.setItem(p + r, l);
    } catch (r) {}
  }
  function deleteValue(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    try {
      if (o && typeof GM_deleteValue === "function") {
        GM_deleteValue(r);
        return;
      }
      localStorage.removeItem(p + r);
    } catch (r) {}
  }
  function obfuscate(r) {
    if (!r) {
      return "";
    }
    try {
      var o = btoa(unescape(encodeURIComponent(r)));
      return o.split("").reverse().join("");
    } catch (o) {
      return r;
    }
  }
  function deobfuscate(r) {
    if (!r) {
      return "";
    }
    try {
      var o = r.split("").reverse().join("");
      return decodeURIComponent(escape(atob(o)));
    } catch (o) {
      return r;
    }
  }
  function setLocalStorage(r, o) {
    try {
      var a = o;
      if (r === "autologin_userPassword" && o) {
        a = obfuscate(o);
      }
      localStorage.setItem(r, storage_typeof(a) === "object" ? JSON.stringify(a) : a);
    } catch (r) {}
  }
  function getLocalStorage(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    try {
      var a = localStorage.getItem(r);
      if (a !== null) {
        if (r === "autologin_userPassword" && typeof a === "string") {
          return deobfuscate(a);
        }
        try {
          return JSON.parse(a);
        } catch (r) {
          return a;
        }
      }
      return o;
    } catch (r) {
      return o;
    }
  }
  function deleteLocalStorage(r) {
    try {
      localStorage.removeItem(r);
    } catch (r) {}
  }
  function Toast(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3e3;
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "";
    var l = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "";
    var u = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "top";
    var p = document.createElement("div");
    p.className = "tm-toast tm-toast--".concat(u);
    var v = "normal";
    var b = "";
    var y = "";
    if (a) {
      var C = a.toLowerCase().trim();
      if (C === "success" || C === "rgb(18, 187, 2)" || C.includes("green") || C.includes("50% 45%")) {
        v = "success";
      } else if (C === "error" || C === "red" || C === "#ff0000" || C.includes("destructive") || C.includes("50% 40%")) {
        v = "error";
      } else if (C === "info" || C.includes("blue") || C.includes("anim-quick")) {
        v = "info";
      } else {
        v = "custom";
        b = a;
        y = l;
      }
    }
    var k = "";
    if (v === "success") {
      p.classList.add("tm-toast--success");
      k = '\n            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n                <polyline points="20 6 9 17 4 12"></polyline>\n            </svg>\n        ';
    } else if (v === "error") {
      p.classList.add("tm-toast--error");
      k = '\n            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n                <circle cx="12" cy="12" r="10"></circle>\n                <line x1="15" y1="9" x2="9" y2="15"></line>\n                <line x1="9" y1="9" x2="15" y2="15"></line>\n            </svg>\n        ';
    } else if (v === "info") {
      p.classList.add("tm-toast--info");
      k = '\n            <svg class="tm-toast-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n                <circle cx="12" cy="12" r="10"></circle>\n                <line x1="12" y1="16" x2="12" y2="12"></line>\n                <line x1="12" y1="8" x2="12.01" y2="8"></line>\n            </svg>\n        ';
    } else if (v === "custom") {
      p.style.background = b;
      if (y) {
        p.style.color = y;
      }
    }
    p.innerHTML = "".concat(k, '<span class="tm-toast-content">').concat(r, "</span>");
    document.body.appendChild(p);
    requestAnimationFrame((function() {
      p.classList.add("visible");
    }));
    setTimeout((function() {
      p.classList.remove("visible");
      setTimeout((function() {
        if (p.parentNode) {
          p.parentNode.removeChild(p);
        }
      }), 300);
    }), o);
  }
  function domains_typeof(r) {
    "@babel/helpers - typeof";
    return domains_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, domains_typeof(r);
  }
  function _regeneratorRuntime() {
    "use strict";
    _regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == domains_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(domains_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function _asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return _arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? _arrayLikeToArray(r, o) : void 0;
    }
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return _arrayLikeToArray(r);
    }
  }
  function _arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  var v = {
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
  function getSiteDomains(r) {
    var o = v[r];
    if (!o) {
      return [];
    }
    return [ o.primary ].concat(_toConsumableArray(o.backups || []));
  }
  function getAllSiteDomains(r) {
    var o = v[r];
    if (!o) {
      return [];
    }
    return [ o.primary ].concat(_toConsumableArray(o.backups || []), _toConsumableArray(o.aliases || []));
  }
  function getSiteUrls(r) {
    return getSiteDomains(r).map((function(r) {
      return "https://".concat(r);
    }));
  }
  function isSiteDomain(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : window.location.hostname;
    var a = getAllSiteDomains(r);
    return a.some((function(r) {
      return o.includes(r);
    }));
  }
  var b = new Map;
  function checkSiteReachability(r) {
    return _checkSiteReachability.apply(this, arguments);
  }
  function _checkSiteReachability() {
    _checkSiteReachability = _asyncToGenerator(_regeneratorRuntime().mark((function _callee(r) {
      var o, a, l, u, p = arguments;
      return _regeneratorRuntime().wrap((function _callee$(v) {
        while (1) {
          switch (v.prev = v.next) {
           case 0:
            o = p.length > 1 && p[1] !== void 0 ? p[1] : false;
            if (!(!o && b.has(r))) {
              v.next = 3;
              break;
            }
            return v.abrupt("return", b.get(r));

           case 3:
            a = getSiteDomains(r);
            if (!(a.length === 0)) {
              v.next = 6;
              break;
            }
            return v.abrupt("return", false);

           case 6:
            l = a[0];
            v.next = 9;
            return new Promise((function(r) {
              if (typeof GM_xmlhttpRequest !== "function") {
                fetch("https://".concat(l, "/favicon.ico"), {
                  "method": "HEAD",
                  "mode": "no-cors"
                }).then((function() {
                  return r(true);
                }))["catch"]((function() {
                  return r(false);
                }));
                return;
              }
              var o = false;
              var a = function safeResolve(a) {
                if (!o) {
                  o = true;
                  clearTimeout(u);
                  r(a);
                }
              };
              var u = setTimeout((function() {
                if (!o) {
                  o = true;
                  if (p && typeof p.abort === "function") {
                    try {
                      p.abort();
                    } catch (r) {}
                  }
                  r(false);
                }
              }), 4e3);
              var p = GM_xmlhttpRequest({
                "method": "HEAD",
                "url": "https://".concat(l, "/favicon.ico"),
                "timeout": 4e3,
                "onload": function onload(r) {
                  a(r.status > 0);
                },
                "onerror": function onerror() {
                  a(false);
                },
                "ontimeout": function ontimeout() {
                  a(false);
                }
              });
            }));

           case 9:
            u = v.sent;
            b.set(r, u);
            return v.abrupt("return", u);

           case 12:
           case "end":
            return v.stop();
          }
        }
      }), _callee);
    })));
    return _checkSiteReachability.apply(this, arguments);
  }
  function _createForOfIteratorHelper(r, o) {
    var a = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!a) {
      if (Array.isArray(r) || (a = videoCode_unsupportedIterableToArray(r)) || o && r && "number" == typeof r.length) {
        a && (r = a);
        var l = 0, u = function F() {};
        return {
          "s": u,
          "n": function n() {
            return l >= r.length ? {
              "done": !0
            } : {
              "done": !1,
              "value": r[l++]
            };
          },
          "e": function e(r) {
            throw r;
          },
          "f": u
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var p, v = !0, b = !1;
    return {
      "s": function s() {
        a = a.call(r);
      },
      "n": function n() {
        var r = a.next();
        return v = r.done, r;
      },
      "e": function e(r) {
        b = !0, p = r;
      },
      "f": function f() {
        try {
          v || null == a["return"] || a["return"]();
        } finally {
          if (b) {
            throw p;
          }
        }
      }
    };
  }
  function videoCode_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return videoCode_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? videoCode_arrayLikeToArray(r, o) : void 0;
    }
  }
  function videoCode_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function cleanAvCode(r) {
    if (!r) {
      return "";
    }
    var o = r.toLowerCase().trim();
    var a = [ "-uncensored-leak", "-uncensored", "-english-subtitle", "-chinese-subtitle", "-subtitle", "-leak", "-c" ];
    var l = true;
    while (l) {
      l = false;
      var u = _createForOfIteratorHelper(a), p;
      try {
        for (u.s(); !(p = u.n()).done; ) {
          var v = p.value;
          if (o.endsWith(v)) {
            o = o.slice(0, -v.length);
            l = true;
            break;
          }
        }
      } catch (r) {
        u.e(r);
      } finally {
        u.f();
      }
    }
    var b = o.match(/^([a-z]+)-?(\d+)$/i);
    if (b) {
      return "".concat(b[1], "-").concat(b[2]).toLowerCase();
    }
    return o;
  }
  function getVideoCodeFromUrl() {
    var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : window.location.href;
    try {
      var o = new URL(r);
      var a = o.pathname;
      var l = "";
      if (isSiteDomain("JABLE", o.hostname)) {
        var u = a.match(/\/videos\/([^/]+)/i);
        if (u) {
          l = u[1];
        }
      }
      if (!l && isSiteDomain("MISSAV", o.hostname)) {
        var p = a.split("/").filter(Boolean);
        if (p.length > 0) {
          l = p[p.length - 1];
        }
      }
      if (!l) {
        var v = a.match(/\/([a-z0-9]+-[a-z0-9]+)/i);
        if (v) {
          l = v[1];
        }
      }
      if (!l) {
        var b = a.split("/").filter(Boolean);
        if (b.length > 0) {
          l = b[b.length - 1];
        }
      }
      if (l) {
        return cleanAvCode(l);
      }
    } catch (r) {}
    return "";
  }
  function PlayerCore_typeof(r) {
    "@babel/helpers - typeof";
    return PlayerCore_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, PlayerCore_typeof(r);
  }
  function _classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, PlayerCore_toPropertyKey(l.key), l);
    }
  }
  function _createClass(r, o, a) {
    return o && _defineProperties(r.prototype, o), a && _defineProperties(r, a), Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function PlayerCore_toPropertyKey(r) {
    var o = PlayerCore_toPrimitive(r, "string");
    return "symbol" == PlayerCore_typeof(o) ? o : o + "";
  }
  function PlayerCore_toPrimitive(r, o) {
    if ("object" != PlayerCore_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != PlayerCore_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var y = function() {
    function PlayerCore() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      _classCallCheck(this, PlayerCore);
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
      }, r);
      this.callingButton = this.options.callingButton || null;
      this.initialized = false;
    }
    return _createClass(PlayerCore, [ {
      "key": "init",
      "value": function init() {
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
    }, {
      "key": "cleanupExistingOverlays",
      "value": function cleanupExistingOverlays() {
        var r = document.querySelectorAll(".tm-video-overlay");
        if (r.length > 0) {
          r.forEach((function(r) {
            if (r && r.parentNode) {
              r.parentNode.removeChild(r);
            }
          }));
        }
      }
    }, {
      "key": "findTargetVideo",
      "value": function findTargetVideo() {
        return findVideoElement();
      }
    }, {
      "key": "saveVideoState",
      "value": function saveVideoState() {
        if (!this.targetVideo) {
          return;
        }
        this.originalParent = this.targetVideo.parentNode;
        this.originalIndex = Array.from(this.originalParent.children).indexOf(this.targetVideo);
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
    }, {
      "key": "restoreVideoState",
      "value": function restoreVideoState() {
        try {
          this.targetVideo.playbackRate = this.defaultPlaybackRate;
          this.targetVideo.currentTime = this.videoState.currentTime;
          var r = this.targetVideo.play();
          if (r !== void 0) {
            r["catch"]((function(r) {}));
          }
        } catch (r) {}
      }
    }, {
      "key": "close",
      "value": function close(r, o, a) {
        var l = this;
        if (!r) {
          return;
        }
        this.videoState.currentTime = this.targetVideo.currentTime;
        this.videoState.isPlaying = !this.targetVideo.paused;
        this.videoState.volume = this.targetVideo.volume;
        this.videoState.playbackRate = this.targetVideo.playbackRate;
        if (!this.targetVideo.paused) {
          this.targetVideo.pause();
        }
        if (this.originalParent && this.targetVideo && this.targetVideo.parentNode) {
          if (this.targetVideo.parentNode !== this.originalParent) {
            if (this.originalIndex !== -1 && this.originalParent.childNodes.length > this.originalIndex) {
              this.originalParent.insertBefore(this.targetVideo, this.originalParent.childNodes[this.originalIndex]);
            } else {
              this.originalParent.appendChild(this.targetVideo);
            }
            this.targetVideo.style.width = "";
            this.targetVideo.style.height = "";
            this.targetVideo.style.maxHeight = "";
            this.targetVideo.style.margin = "";
            this.targetVideo.style.position = "";
            var u = function restoreAttr(r, o) {
              if (o === null || o === void 0) {
                l.targetVideo.removeAttribute(r);
              } else {
                l.targetVideo.setAttribute(r, o);
              }
            };
            u("playsinline", this.videoState.playsinline);
            u("webkit-playsinline", this.videoState.webkitPlaysinline);
            u("x5-playsinline", this.videoState.x5Playsinline);
            this.targetVideo.playsInline = this.videoState.playsinline === "true";
            this.targetVideo.webkitPlaysInline = this.videoState.webkitPlaysinline === "true";
          }
        }
        if (r.parentNode) {
          r.parentNode.removeChild(r);
        }
        if (a && a.parentNode) {
          a.parentNode.removeChild(a);
        }
        document.body.classList.remove("tm-player-active", "controls-hidden");
        document.documentElement.classList.remove("tm-player-active", "controls-hidden");
        var p = document.getElementById("tm-hide-scrollbar-style");
        if (p && p.parentNode) {
          p.parentNode.removeChild(p);
        }
        var v = document.getElementById("tm-fullscreen-style");
        if (v && v.parentNode) {
          v.parentNode.removeChild(v);
        }
        try {
          var b = document.querySelectorAll('header, .site-header, .header, #site-header, navbar, .navbar, .top-nav, [class*="site-header"]');
          b.forEach((function(r) {
            if (r) {
              r.style.display = "";
              r.style.transform = "";
              r.style.visibility = "";
              r.style.top = "";
              r.style.opacity = "";
              r.classList.remove("hidden", "is-hidden", "header-hidden", "hide");
            }
          }));
          window.dispatchEvent(new Event("scroll"));
          window.dispatchEvent(new Event("resize"));
        } catch (r) {}
        this.initialized = false;
        restoreSafariThemeColor();
        if (this.callingButton) {
          this.callingButton.style.display = "flex";
        }
      }
    } ]);
  }();
  var C = '\n    <svg width="48" height="48" viewBox="0 0 68 48" fill="none">\n        <path class="tm-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="rgb(254, 98, 142)"></path>\n        <path d="M 45,24 27,14 27,34" fill="#fff"></path>\n    </svg>\n';
  var k = '\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M18 12L7 5V19L18 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var _ = '\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M10 4H6V20H10V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M18 4H14V20H18V4Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var E = '\n    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M14,6v20c0,1.1-0.9,2-2,2H8c-1.1,0-2-0.9-2-2V6c0-1.1,0.9-2,2-2h4C13.1,4,14,4.9,14,6z M24,4h-4\n        c-1.1,0-2,0.9-2,2v20c0,1.1,0.9,2,2,2h4c1.1,0,2-0.9,2-2V6C26,4.9,25.1,4,24,4z" fill="white"/>\n    </svg>\n';
  var S = '\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M23 9L17 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M17 9L23 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var P = '\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var D = '\n    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M18.54 5.46C20.4246 7.34535 21.4681 9.90302 21.4681 12.575C21.4681 15.247 20.4246 17.8047 18.54 19.69" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var L = '\n    <svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-rewind-icon">\n        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.70711 4.29289C3.31658 3.90237 2.68342 3.90237 2.29289 4.29289L-4.70711 11.2929C-5.09763 11.6834 -5.09763 12.3166 -4.70711 12.7071L2.29289 19.7071C2.68342 20.0976 3.31658 20.0976 3.70711 19.7071C4.09763 19.3166 4.09763 18.6834 3.70711 18.2929L-2.58579 12L3.70711 5.70711C4.09763 5.31658 4.09763 4.68342 3.70711 4.29289Z" fill="currentColor"/>\n    </svg>\n';
  var M = '\n    <svg width="14" height="14" viewBox="0 0 12 24" fill="none" class="tm-forward-icon">\n        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="currentColor"/>\n    </svg>\n';
  var A = '\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var T = '\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <line x1="18" y1="6" x2="6" y2="18"></line>\n        <line x1="6" y1="6" x2="18" y2="18"></line>\n    </svg>\n';
  var j = '\n    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <line x1="22" y1="2" x2="11" y2="13"></line>\n        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>\n    </svg>\n';
  var B = '\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n        <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.83628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n    </svg>\n';
  var I = '\n    <svg width="12" height="12" style="vertical-align: middle;">\n        <circle class="tm-loop-indicator-circle" cx="6" cy="6" r="5" fill="hsl(var(--shadcn-muted-foreground) / 0.5)"></circle>\n    </svg>\n';
  var V = '\n    <svg viewBox="2 5 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">\n        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 5H16C18.8284 5 20.2426 5 21.1213 5.87868C22 6.75736 22 8.17157 22 11V13C22 15.8284 22 17.2426 21.1213 18.1213C20.2426 19 18.8284 19 16 19H8C5.17157 19 3.75736 19 2.87868 18.1213C2 17.2426 2 15.8284 2 13V11C2 8.17157 2 6.75736 2.87868 5.87868C3.75736 5 5.17157 5 8 5ZM6 10C6.55228 10 7 9.55228 7 9C7 8.44772 6.55228 8 6 8C5.44772 8 5 8.44772 5 9C5 9.55228 5.44772 10 6 10ZM6 13C6.55228 13 7 12.5523 7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13ZM9 13C9.55228 13 10 12.5523 10 12C10 11.4477 9.55228 11 9 11C8.44772 11 8 11.4477 8 12C8 12.5523 8.44772 13 9 13ZM9 10C9.55228 10 10 9.55228 10 9C10 8.44772 9.55228 8 9 8C8.44772 8 8 8.44772 8 9C8 9.55228 8.44772 10 9 10ZM12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10ZM12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13ZM15 10C15.5523 10 16 9.55228 16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9C14 9.55228 14.4477 10 15 10ZM15 13C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11C14.4477 11 14 11.4477 14 12C14 12.5523 14.4477 13 15 13ZM18 10C18.5523 10 19 9.55228 19 9C19 8.44772 18.5523 8 18 8C17.4477 8 17 8.44772 17 9C17 9.55228 17.4477 10 18 10ZM18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12C17 12.5523 17.4477 13 18 13ZM17.75 16C17.75 16.4142 17.4142 16.75 17 16.75H7C6.58579 16.75 6.25 16.4142 6.25 16C6.25 15.5858 6.58579 15.25 7 15.25H17C17.4142 15.25 17.75 15.5858 17.75 16Z" fill="currentColor"/>\n    </svg>\n';
  var O = '\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <rect x="3" y="3" width="18" height="18" rx="5"/>\n        <line x1="7.5" y1="3" x2="7.5" y2="21"/>\n        <path d="M15.5 9l-3 3 3 3"/>\n    </svg>\n';
  var R = '\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <rect x="3" y="3" width="18" height="18" rx="5"/>\n        <line x1="16.5" y1="3" x2="16.5" y2="21"/>\n        <path d="M8.5 9l3 3-3 3"/>\n    </svg>\n';
  var H = '\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>\n    </svg>\n';
  var G = '\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity="0.4"/>\n        <line x1="3" y1="3" x2="21" y2="21"/>\n    </svg>\n';
  function UIManager_typeof(r) {
    "@babel/helpers - typeof";
    return UIManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, UIManager_typeof(r);
  }
  function UIManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function UIManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, UIManager_toPropertyKey(l.key), l);
    }
  }
  function UIManager_createClass(r, o, a) {
    return o && UIManager_defineProperties(r.prototype, o), a && UIManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function UIManager_toPropertyKey(r) {
    var o = UIManager_toPrimitive(r, "string");
    return "symbol" == UIManager_typeof(o) ? o : o + "";
  }
  function UIManager_toPrimitive(r, o) {
    if ("object" != UIManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != UIManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var z = function() {
    function UIManager(r) {
      UIManager_classCallCheck(this, UIManager);
      this.playerCore = r;
      this.targetVideo = r.targetVideo;
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
      var o = this.playerCore.options.playerState;
      this.isSidebarHidden = o ? o.settings.sidebarHidden : false;
      this.sidebarPosition = o ? o.settings.sidebarPosition : "right";
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
      this.loadStyles();
    }
    return UIManager_createClass(UIManager, [ {
      "key": "isCustomResized",
      "get": function get() {
        return this.isLandscape ? this.isCustomResizedLandscape : this.isCustomResizedPortrait;
      },
      "set": function set(r) {
        if (this.isLandscape) {
          this.isCustomResizedLandscape = r;
        } else {
          this.isCustomResizedPortrait = r;
        }
      }
    }, {
      "key": "isFloatingControlPanel",
      "get": function get() {
        return window.innerWidth >= 480;
      }
    }, {
      "key": "loadStyles",
      "value": function loadStyles() {}
    }, {
      "key": "createUI",
      "value": function createUI() {
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
    }, {
      "key": "createOverlayAndContainer",
      "value": function createOverlayAndContainer() {
        this.overlay = document.createElement("div");
        this.overlay.className = "tm-video-overlay";
        this.overlay.style.zIndex = "2000000000";
        var r = window.innerWidth * (4 / 5);
        var o = window.innerWidth * (9 / 16);
        this.container = document.createElement("div");
        this.container.className = "tm-video-container";
        this.container.style.height = "".concat(r, "px");
        this.container.style.minHeight = "".concat(o, "px");
      }
    }, {
      "key": "createPlayerContainer",
      "value": function createPlayerContainer() {
        this.playerContainer = document.createElement("div");
        this.playerContainer.className = "tm-player-container";
        this.playerContainer.style.zIndex = "2000000001";
        if (this.isSidebarHidden) {
          this.playerContainer.classList.add("tm-sidebar-hidden");
        }
        if (this.sidebarPosition === "left") {
          this.playerContainer.classList.add("tm-sidebar-left");
        }
      }
    }, {
      "key": "createVideoWrapper",
      "value": function createVideoWrapper() {
        var r = this;
        this.videoWrapper = document.createElement("div");
        this.videoWrapper.className = "tm-video-wrapper";
        if (this.targetVideo && this.targetVideo.parentNode) {
          this.targetVideo.parentNode.removeChild(this.targetVideo);
        }
        if (this.targetVideo) {
          this.targetVideo.controls = false;
          this.targetVideo.removeAttribute("controls");
          Array.from(this.targetVideo.children).forEach((function(r) {
            var o = r.tagName ? r.tagName.toLowerCase() : "";
            if (o !== "track" && o !== "source") {
              try {
                r.remove();
              } catch (r) {}
            }
          }));
        }
        this.targetVideo.setAttribute("playsinline", "true");
        this.targetVideo.setAttribute("webkit-playsinline", "true");
        this.targetVideo.setAttribute("x5-playsinline", "true");
        this.targetVideo.playsInline = true;
        this.targetVideo.webkitPlaysInline = true;
        this.videoWrapper.appendChild(this.targetVideo);
        this.targetVideo.addEventListener("loadedmetadata", (function() {
          r.updateVideoAspectRatio();
        }));
        var o = null;
        var a = false;
        var l = 1;
        this.isLongPress = false;
        this.longPressStartX = 0;
        this.longPressStartY = 0;
        var u = function handlePointerDown(u) {
          if (u.target.closest(".tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button")) {
            return;
          }
          if (o) {
            clearTimeout(o);
          }
          l = r.playerCore.targetVideo.playbackRate;
          a = false;
          r.isLongPress = false;
          var p = u.type.includes("touch");
          var v = p && u.touches ? u.touches[0] : null;
          r.longPressStartX = v ? v.clientX : u.clientX;
          r.longPressStartY = v ? v.clientY : u.clientY;
          o = setTimeout((function() {
            a = true;
            r.isLongPress = true;
            l = r.playerCore.targetVideo.playbackRate;
            r.playerCore.targetVideo.playbackRate = 3;
            var o = document.createElement("div");
            o.className = "tm-speed-indicator";
            o.textContent = "3x";
            o.style.position = "absolute";
            o.style.top = "50%";
            o.style.left = "50%";
            o.style.transform = "translate(-50%, -50%)";
            o.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            o.style.color = "white";
            o.style.padding = "8px 16px";
            o.style.borderRadius = "4px";
            o.style.fontSize = "24px";
            o.style.fontWeight = "bold";
            o.style.zIndex = "9999";
            r.videoWrapper.appendChild(o);
            if (window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
            if (r.playerCore.targetVideo.paused) {
              r.playerCore.targetVideo.play();
            }
          }), 800);
        };
        var p = function handlePointerMove(l) {
          if (o && !a) {
            var u = l.type.includes("touch");
            var p = u && l.touches ? l.touches[0] : null;
            if (u && !p) {
              return;
            }
            var v = p ? p.clientX : l.clientX;
            var b = p ? p.clientY : l.clientY;
            var y = v - r.longPressStartX;
            var C = b - r.longPressStartY;
            var k = Math.hypot(y, C);
            if (k > 10) {
              clearTimeout(o);
              o = null;
            }
          }
        };
        var v = function handlePointerUp(u) {
          if (o) {
            clearTimeout(o);
            o = null;
          }
          if (a) {
            r.playerCore.targetVideo.playbackRate = l;
            var p = r.videoWrapper.querySelector(".tm-speed-indicator");
            if (p) {
              p.remove();
            }
            u.preventDefault();
            u.stopPropagation();
            a = false;
            r.isLongPress = false;
            return;
          }
        };
        var b = function handlePointerLeave(u) {
          if (o) {
            clearTimeout(o);
            o = null;
          }
          if (a) {
            r.playerCore.targetVideo.playbackRate = l;
            var p = r.videoWrapper.querySelector(".tm-speed-indicator");
            if (p) {
              p.remove();
            }
            a = false;
            r.isLongPress = false;
          }
        };
        this.videoWrapper.addEventListener("mousedown", u);
        this.videoWrapper.addEventListener("mouseup", v);
        this.videoWrapper.addEventListener("mousemove", p);
        this.videoWrapper.addEventListener("mouseleave", b);
        this.videoWrapper.addEventListener("touchstart", u, {
          "passive": true
        });
        this.videoWrapper.addEventListener("touchend", v);
        this.videoWrapper.addEventListener("touchmove", p, {
          "passive": true
        });
        this.videoWrapper.addEventListener("touchcancel", b);
        this.videoWrapper.addEventListener("click", (function(o) {
          if (a) {
            return;
          }
          if (r.playerCore.swipeManager && typeof r.playerCore.swipeManager.wasRecentlyDragging === "function" && r.playerCore.swipeManager.wasRecentlyDragging()) {
            return;
          }
          if (o.target.closest(".tm-control-buttons, .tm-button-container, .tm-control-button, .tm-close-button, .tm-settings-button")) {
            return;
          }
          if (r.isLandscape) {
            var l = !!(r.playerContainer && r.playerContainer.className.match(/tm-controls-docked-/));
            var u = r.isSidebarHidden || !l;
            if (u) {
              if (r.controlsVisible) {
                r.hideControls();
              } else {
                r.showControls();
                r.autoHideControls();
              }
              return;
            }
          }
          var p = function togglePlayPause() {
            if (!r.playerCore.targetVideo) {
              return;
            }
            if (r.playerCore.targetVideo.paused) {
              r.playerCore.targetVideo.play();
            } else {
              r.playerCore.targetVideo.pause();
              if (r.playerCore.controlManager) {
                r.playerCore.controlManager.showPauseIndicator();
              }
            }
            if (r.playerCore.controlManager) {
              r.playerCore.controlManager.updatePlayPauseButton();
            }
          };
          if (!r.controlsVisible) {
            r.showControls();
            return;
          }
          p();
        }));
      }
    }, {
      "key": "createResizeHandle",
      "value": function createResizeHandle() {
        var r = this;
        this.handleContainer = document.createElement("div");
        this.handleContainer.className = "tm-handle-container";
        this.handle = document.createElement("div");
        this.handle.className = "tm-resize-handle";
        this.handle.insertAdjacentHTML("beforeend", '\n            <div style="\n                position: absolute;\n                left: -10px;\n                right: -10px;\n                top: -15px;\n                bottom: -15px;\n                background: transparent;\n            "></div>\n        ');
        this.handle.addEventListener("mouseenter", (function() {
          r.handle.style.opacity = "1";
          r.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.8)";
        }));
        this.handle.addEventListener("mouseleave", (function() {
          if (!r.isDraggingHandle) {
            r.handle.style.opacity = "0.5";
            r.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.6)";
          }
        }));
        this.handle.addEventListener("mousedown", (function() {
          r.handle.style.cursor = "grabbing";
          if (window.navigator.vibrate) {
            window.navigator.vibrate(5);
          }
        }));
        document.addEventListener("mouseup", (function() {
          if (!r.isDraggingHandle) {
            r.handle.style.cursor = "grab";
          }
        }));
        this.handle.addEventListener("touchstart", (function() {
          r.handle.style.opacity = "1";
          r.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.8)";
          if (window.navigator.vibrate) {
            window.navigator.vibrate(5);
          }
        }), {
          "passive": true
        });
        this.handle.addEventListener("touchend", (function() {
          if (!r.isDraggingHandle) {
            r.handle.style.opacity = "0.5";
            r.handle.style.backgroundColor = "hsla(var(--shadcn-foreground) / 0.6)";
          }
        }));
        this.handleContainer.appendChild(this.handle);
      }
    }, {
      "key": "createCloseButton",
      "value": function createCloseButton() {
        var r = this;
        this.closeBtn = document.createElement("button");
        this.closeBtn.className = "tm-close-button tm-control-button-base";
        var o = '\n            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n            </svg>\n        ';
        this.closeBtn.innerHTML = o;
        this.closeBtn.addEventListener("mouseenter", (function() {
          r.closeBtn.style.backgroundColor = "hsla(var(--shadcn-destructive) / 0.9)";
          r.closeBtn.style.transform = "scale(1.1)";
        }));
        this.closeBtn.addEventListener("mouseleave", (function() {
          r.closeBtn.style.backgroundColor = "hsla(var(--shadcn-background) / 0.7)";
          r.closeBtn.style.transform = "scale(1)";
        }));
      }
    }, {
      "key": "createSettingsButton",
      "value": function createSettingsButton() {
        var r = this;
        this.settingsBtn = document.createElement("button");
        this.settingsBtn.className = "tm-settings-button tm-control-button-base";
        var o = '\n            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n                <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1837 17.2737 20.4009 17.7994 20.4009 18.345C20.4009 18.8906 20.1837 19.4163 19.79 19.81C19.4163 20.2037 18.8906 20.4209 18.345 20.4209C17.7994 20.4209 17.2737 20.2037 16.91 19.81L16.85 19.75C16.3678 19.2783 15.6471 19.1477 15.03 19.42C14.4301 19.6801 14.0386 20.2502 14.03 20.89V21C14.03 21.5304 13.8193 22.0391 13.4442 22.4142C13.0691 22.7893 12.5604 23 12.03 23C11.4996 23 10.9909 22.7893 10.6158 22.4142C10.2407 22.0391 10.03 21.5304 10.03 21V20.91C10.0112 20.2556 9.5979 19.6818 8.98 19.43C8.36289 19.1577 7.64221 19.2883 7.16 19.76L7.1 19.82C6.73629 20.2137 6.21056 20.4309 5.665 20.4309C5.11944 20.4309 4.59371 20.2137 4.23 19.82C3.83628 19.4463 3.61911 18.9206 3.61911 18.375C3.61911 17.8294 3.83628 17.3037 4.23 16.93L4.29 16.87C4.76167 16.3878 4.89231 15.6671 4.62 15.05C4.35995 14.4501 3.78985 14.0586 3.15 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.74435 10.0312 4.31814 9.61788 4.57 9C4.84231 8.38289 4.71167 7.66221 4.24 7.18L4.18 7.12C3.78628 6.75629 3.56911 6.23056 3.56911 5.685C3.56911 5.13944 3.78628 4.61371 4.18 4.25C4.55371 3.85628 5.07944 3.63911 5.625 3.63911C6.17056 3.63911 6.69629 3.85628 7.07 4.25L7.13 4.31C7.61221 4.78167 8.33289 4.91231 8.95 4.64H9C9.59994 4.37995 9.99144 3.80985 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0086 3.72985 14.4001 4.29995 15 4.56C15.6171 4.83231 16.3378 4.70167 16.82 4.23L16.88 4.17C17.2437 3.77628 17.7694 3.55911 18.325 3.55911C18.8806 3.55911 19.4063 3.77628 19.77 4.17C20.1637 4.54371 20.3809 5.06944 20.3809 5.615C20.3809 6.16056 20.1637 6.68629 19.77 7.06L19.71 7.12C19.2383 7.60221 19.1077 8.32289 19.38 8.94L19.4 9C19.66 9.59994 20.2301 9.99144 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2702 14.0086 19.7001 14.4001 19.44 15H19.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n            </svg>\n        ';
        this.settingsBtn.innerHTML = o;
        this.settingsBtn.addEventListener("mouseenter", (function() {
          r.settingsBtn.style.backgroundColor = "hsla(var(--shadcn-accent) / 0.9)";
          r.settingsBtn.style.transform = "rotate(45deg)";
        }));
        this.settingsBtn.addEventListener("mouseleave", (function() {
          r.settingsBtn.style.backgroundColor = "hsla(var(--shadcn-background) / 0.7)";
          r.settingsBtn.style.transform = "rotate(0deg)";
        }));
      }
    }, {
      "key": "getVideoTitle",
      "value": function getVideoTitle() {
        var r = document.querySelector("h4");
        if (r && r.textContent) {
          return r.textContent.trim();
        }
        var o = document.querySelector("h1");
        if (o && o.textContent) {
          return o.textContent.trim();
        }
        var a = document.title || "";
        a = a.replace(/\s*-\s*Jable\.tv.*$/i, "");
        a = a.replace(/\s*-\s*JAVLibrary.*$/i, "");
        return a.trim();
      }
    }, {
      "key": "createTitle",
      "value": function createTitle() {
        this.titleEl = document.createElement("span");
        this.titleEl.className = "tm-player-title";
        this.titleEl.textContent = this.getVideoTitle();
      }
    }, {
      "key": "createSidebarControls",
      "value": function createSidebarControls() {
        var r = this;
        this.sidebarPosBtn = document.createElement("button");
        this.sidebarPosBtn.className = "tm-sidebar-pos-button tm-control-button-base";
        this.sidebarPosBtn.style.display = "flex";
        this.updateSidebarPosButtonIcon();
        this.sidebarPosBtn.title = this.sidebarPosition === "right" ? "切换侧边栏到左侧" : "切换侧边栏到右侧";
        this.sidebarPosBtn.addEventListener("click", (function(o) {
          o.stopPropagation();
          r.toggleSidebarPosition();
        }));
        this.sidebarToggleBtn = document.createElement("button");
        this.sidebarToggleBtn.className = "tm-sidebar-toggle-button tm-control-button-base";
        this.sidebarToggleBtn.style.display = "flex";
        this.updateSidebarToggleButtonIcon();
        this.sidebarToggleBtn.title = this.isSidebarHidden ? "显示评论区" : "隐藏评论区";
        this.sidebarToggleBtn.addEventListener("click", (function(o) {
          o.stopPropagation();
          r.toggleSidebarVisibility();
        }));
        this.updateSidebarButtonsVisibility();
      }
    }, {
      "key": "updateSidebarButtonsVisibility",
      "value": function updateSidebarButtonsVisibility() {
        var r, o, a;
        var l = (r = this.playerCore) === null || r === void 0 || (r = r.options) === null || r === void 0 ? void 0 : r.playerState;
        var u = (o = l === null || l === void 0 || (a = l.settings) === null || a === void 0 ? void 0 : a.showCommentsSection) !== null && o !== void 0 ? o : true;
        var p = u ? "flex" : "none";
        if (this.sidebarPosBtn) {
          this.sidebarPosBtn.style.display = p;
        }
        if (this.sidebarToggleBtn) {
          this.sidebarToggleBtn.style.display = p;
        }
      }
    }, {
      "key": "updateSidebarPosButtonIcon",
      "value": function updateSidebarPosButtonIcon() {
        if (!this.sidebarPosBtn) {
          return;
        }
        this.sidebarPosBtn.innerHTML = this.sidebarPosition === "right" ? O : R;
      }
    }, {
      "key": "updateSidebarToggleButtonIcon",
      "value": function updateSidebarToggleButtonIcon() {
        if (!this.sidebarToggleBtn) {
          return;
        }
        this.sidebarToggleBtn.innerHTML = this.isSidebarHidden ? H : G;
      }
    }, {
      "key": "toggleSidebarPosition",
      "value": function toggleSidebarPosition() {
        this.sidebarPosition = this.sidebarPosition === "right" ? "left" : "right";
        if (this.sidebarPosition === "left") {
          this.playerContainer.classList.add("tm-sidebar-left");
        } else {
          this.playerContainer.classList.remove("tm-sidebar-left");
        }
        this.updateSidebarPosButtonIcon();
        this.sidebarPosBtn.title = this.sidebarPosition === "right" ? "切换侧边栏到左侧" : "切换侧边栏到右侧";
        var r = this.playerCore.options.playerState;
        if (r) {
          r.updateSetting("sidebarPosition", this.sidebarPosition);
        }
        var o = this.playerCore.dragManager;
        if (o) {
          var a = localStorage.getItem("tm-control-panel-pos");
          if (a) {
            try {
              var l = JSON.parse(a);
              if (l.didSnap && l.anchorName) {
                var u = l.anchorName;
                if (this.sidebarPosition === "left") {
                  if (u === "TR") {
                    u = "TL";
                  }
                  if (u === "BR") {
                    u = "BL";
                  }
                } else {
                  if (u === "TL") {
                    u = "TR";
                  }
                  if (u === "BL") {
                    u = "BR";
                  }
                }
                if (u !== l.anchorName) {
                  l.anchorName = u;
                  localStorage.setItem("tm-control-panel-pos", JSON.stringify(l));
                  o.restoreControlPanelPosition();
                }
              }
            } catch (r) {}
          }
        }
      }
    }, {
      "key": "toggleSidebarVisibility",
      "value": function toggleSidebarVisibility() {
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
          if (this.playerCore.dragManager) {
            this.playerCore.dragManager.reapplyDockedState();
          }
        }
        this.updateButtonContainerParent();
        var r = this.playerCore.options.playerState;
        if (r) {
          r.updateSetting("sidebarHidden", this.isSidebarHidden);
        }
      }
    }, {
      "key": "updateButtonContainerParent",
      "value": function updateButtonContainerParent() {
        var r = this;
        if (!this.buttonContainer) {
          return;
        }
        var o = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
        var a = o && o.commentsPanel;
        var l = this.isLandscape && window.innerWidth >= 930;
        var u = a && l && !this.isSidebarHidden ? a : this.playerContainer;
        if (this.buttonContainer.parentNode === u) {
          return;
        }
        this.buttonContainer.style.opacity = "0";
        this.buttonContainer.style.transition = "opacity 0.15s ease";
        requestAnimationFrame((function() {
          if (!r.buttonContainer) {
            return;
          }
          if (u === a) {
            a.insertBefore(r.buttonContainer, a.firstChild);
          } else if (a && a.parentNode === r.playerContainer) {
            r.playerContainer.insertBefore(r.buttonContainer, a);
          } else {
            r.playerContainer.appendChild(r.buttonContainer);
          }
          requestAnimationFrame((function() {
            if (!r.buttonContainer) {
              return;
            }
            r.buttonContainer.style.opacity = "1";
            setTimeout((function() {
              if (r.buttonContainer) {
                r.buttonContainer.style.transition = "";
              }
            }), 200);
          }));
        }));
      }
    }, {
      "key": "createSettingsPanel",
      "value": function createSettingsPanel() {
        this.settingsPanel = document.createElement("div");
        this.settingsPanel.className = "tm-settings-panel";
      }
    }, {
      "key": "createButtonContainer",
      "value": function createButtonContainer() {
        this.buttonContainer = document.createElement("div");
        this.buttonContainer.className = "tm-button-container";
        this.buttonContainer.style.display = "flex";
        this.buttonContainer.style.alignItems = "center";
        this.buttonContainer.style.gap = "10px";
        this.buttonContainer.style.zIndex = "99999";
      }
    }, {
      "key": "setupOrientationListener",
      "value": function setupOrientationListener() {
        var r = this;
        this.checkOrientation();
        var o = function triggerLayoutUpdate() {
          r.checkOrientation();
          r.updateContainerMinHeight();
          r.updateVideoAspectRatio();
          if (r.playerCore.progressManager) {
            r.playerCore.progressManager.updateProgressBar();
            r.playerCore.progressManager.updateCurrentTimeDisplay();
          }
          r.updateButtonContainerParent();
        };
        var a = false;
        var l = null;
        var u = null;
        var p = function scheduleLayoutUpdate() {
          var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
          if (r > 0) {
            setTimeout((function() {
              return p(0);
            }), r);
            return;
          }
          if (a) {
            return;
          }
          a = true;
          l = requestAnimationFrame((function() {
            a = false;
            o();
          }));
        };
        if (screen && screen.orientation) {
          this.screenOrientationListener = function() {
            p(0);
          };
          screen.orientation.addEventListener("change", this.screenOrientationListener);
        }
        this.orientationListener = function() {
          p(200);
        };
        window.addEventListener("orientationchange", this.orientationListener);
        if (typeof ResizeObserver !== "undefined") {
          this.resizeObserver = new ResizeObserver((function() {
            p(0);
          }));
          this.resizeObserver.observe(document.documentElement);
        }
        this.resizeListener = function() {
          clearTimeout(u);
          u = setTimeout((function() {
            p(0);
          }), 100);
        };
        window.addEventListener("resize", this.resizeListener);
        this._cleanupLayoutSchedulers = function() {
          if (l) {
            cancelAnimationFrame(l);
          }
          if (u) {
            clearTimeout(u);
          }
        };
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
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
    }, {
      "key": "setupInteractionListeners",
      "value": function setupInteractionListeners() {
        var r = this;
        if (!this.overlay) {
          return;
        }
        this.playerContainer.addEventListener("mousemove", (function(o) {
          if (o && o.target && o.target.closest && o.target.closest(".tm-comments-panel")) {
            return;
          }
          r.showControls();
          if (r.isLandscape) {
            r.autoHideControls();
          }
        }));
        this.playerContainer.addEventListener("touchmove", (function(o) {
          if (o && o.target && o.target.closest && o.target.closest(".tm-comments-panel")) {
            return;
          }
          r.showControls();
          if (r.isLandscape) {
            r.autoHideControls();
          }
        }), {
          "passive": true
        });
        this.playerContainer.addEventListener("touchstart", (function(o) {
          if (o.target.closest(".tm-control-button, .tm-time-control-button, .tm-close-button, .tm-settings-button, .tm-sidebar-toggle-button")) {
            r.showControls();
            if (r.isLandscape) {
              r.autoHideControls();
            }
            o.stopPropagation();
          }
        }), {
          "passive": false
        });
        delegateEvent(this.playerContainer, "mouseenter", ".tm-control-buttons, .tm-settings-button, .tm-button-container, .tm-settings-panel", (function() {
          r.isMouseOverControls = true;
          if (r.controlsHideTimerId) {
            clearTimeout(r.controlsHideTimerId);
            r.controlsHideTimerId = null;
          }
        }));
        delegateEvent(this.playerContainer, "mouseleave", ".tm-control-buttons, .tm-settings-button, .tm-button-container, .tm-settings-panel", (function() {
          r.isMouseOverControls = false;
          if (r.isLandscape) {
            r.autoHideControls();
          }
        }));
      }
    }, {
      "key": "checkOrientation",
      "value": function checkOrientation() {
        var r = window.innerWidth;
        var o = window.innerHeight;
        var a = function isKeyboardActive() {
          var r = document.activeElement;
          if (!r) {
            return false;
          }
          var o = r.tagName.toLowerCase();
          return o === "textarea" || o === "input" && [ "text", "search", "url", "email", "number" ].includes(r.type);
        };
        if (a()) {
          return;
        }
        var l = r / o;
        var u = .85;
        var p = 1.18;
        var v = this.isLandscape;
        if (l < u) {
          v = false;
        } else if (l > p) {
          v = true;
        }
        var b = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (b && screen && screen.orientation && screen.orientation.type) {
          var y = screen.orientation.type;
          var C = y.includes("landscape");
          if (l < u && C) {
            v = false;
          } else if (l > p && !C) {
            v = true;
          }
        }
        if (this.isLandscape !== v) {
          this.isLandscape = v;
          this.handleOrientationChange();
        }
      }
    }, {
      "key": "handleOrientationChange",
      "value": function handleOrientationChange() {
        if (!this.isLandscape) {
          if (this.isCustomResizedPortrait && this.customHeightPortrait) {
            this.container.style.height = this.customHeightPortrait;
          }
        } else {
          this.container.style.height = "";
        }
        this.updateContainerMinHeight();
        this.updateVideoAspectRatio();
        if (this.playerCore.progressManager) {
          this.playerCore.progressManager.updateProgressBar();
          this.playerCore.progressManager.updateCurrentTimeDisplay();
        }
        if (this.playerCore.controlManager) {
          this.updateControlPanelVisibility();
        }
        if (this.playerCore.dragManager) {
          this.playerCore.dragManager.restoreControlPanelPosition();
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
    }, {
      "key": "updateControlPanelVisibility",
      "value": function updateControlPanelVisibility() {
        if (!this.playerCore.controlManager) {
          return;
        }
        var r = this.playerCore.controlManager.controlButtonsContainer;
        if (!r) {
          return;
        }
        var o = r.querySelector(".tm-progress-row");
        var a = r.querySelector(".tm-seek-control-row");
        var l = r.querySelector(".tm-loop-control-row");
        var u = r.querySelector(".tm-playback-control-row");
        if (this.isLandscape) {
          if (o) {
            o.style.display = "flex";
            o.style.backgroundColor = "transparent";
          }
          if (a) {
            a.style.display = "flex";
            a.style.backgroundColor = "transparent";
          }
          if (l) {
            l.style.display = "flex";
            l.style.backgroundColor = "transparent";
          }
          if (u) {
            u.style.display = "flex";
            u.style.backgroundColor = "transparent";
          }
          if (this.settingsBtn) {
            this.settingsBtn.style.display = "flex";
            this.settingsBtn.style.backgroundColor = "hsla(var(--shadcn-secondary) / 0.3)";
            this.settingsBtn.style.backdropFilter = "blur(4px)";
          }
        } else {
          if (o) {
            o.style.display = "";
          }
          if (a) {
            a.style.display = "";
          }
          if (l) {
            l.style.display = "";
          }
          if (u) {
            u.style.display = "";
          }
          if (this.settingsBtn) {
            this.settingsBtn.style.display = "";
            this.settingsBtn.style.backgroundColor = "";
            this.settingsBtn.style.backdropFilter = "";
          }
        }
      }
    }, {
      "key": "updateVideoAspectRatio",
      "value": function updateVideoAspectRatio() {
        if (!this.videoWrapper || !this.targetVideo) {
          return;
        }
        var r = this.targetVideo.videoWidth;
        var o = this.targetVideo.videoHeight;
        if (r && o) {
          var a = r / o;
          var l = a < 1;
          if (l) {
            this.videoWrapper.classList.add("video-portrait");
          } else {
            this.videoWrapper.classList.remove("video-portrait");
          }
        }
      }
    }, {
      "key": "showControls",
      "value": function showControls() {
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
          var r = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
          if (r && r.commentsPanel) {
            r.commentsPanel.classList.add("is-dimmed");
          }
          if (this.handleContainer) {
            this.handleContainer.classList.add("is-dimmed");
          }
        }
      }
    }, {
      "key": "hideControls",
      "value": function hideControls() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (!this.overlay) {
          return;
        }
        if (!this.isLandscape && !r) {
          return;
        }
        this.overlay.classList.add("controls-hidden");
        document.body.classList.add("controls-hidden");
        this.controlsVisible = false;
        if (!this.isLandscape) {
          var o = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
          if (o && o.commentsPanel) {
            o.commentsPanel.classList.remove("is-dimmed");
          }
          if (this.handleContainer) {
            this.handleContainer.classList.remove("is-dimmed");
          }
        }
      }
    }, {
      "key": "toggleControlsVisibility",
      "value": function toggleControlsVisibility() {
        if (this.controlsVisible) {
          this.hideControls();
        } else {
          this.showControls();
          this.autoHideControls();
        }
      }
    }, {
      "key": "autoHideControls",
      "value": function autoHideControls() {
        var r = this;
        if (!this.isLandscape) {
          return;
        }
        if (this.isMouseOverControls) {
          return;
        }
        if (this.controlsHideTimerId) {
          clearTimeout(this.controlsHideTimerId);
        }
        this.controlsHideTimerId = setTimeout((function() {
          r.hideControls();
        }), 3e3);
      }
    }, {
      "key": "updateContainerMinHeight",
      "value": function updateContainerMinHeight() {
        if (!this.container || !this.targetVideo) {
          return;
        }
        if (this.isLandscape) {
          return;
        }
        var r = this.targetVideo.videoWidth || this.targetVideo.naturalWidth;
        var o = this.targetVideo.videoHeight || this.targetVideo.naturalHeight;
        var a = window.innerWidth * (9 / 16);
        if (r && o) {
          a = window.innerWidth * (o / r);
        }
        this.container.style.minHeight = "".concat(a, "px");
        if (!this.isCustomResized) {
          var l = window.innerWidth * (4 / 5);
          this.container.style.height = "".concat(l, "px");
        } else if (this.customHeightPortrait) {
          var u = parseFloat(this.customHeightPortrait);
          if (u < a) {
            this.container.style.height = "".concat(a, "px");
            this.customHeightPortrait = "".concat(a, "px");
          } else {
            this.container.style.height = this.customHeightPortrait;
          }
        }
      }
    }, {
      "key": "assembleDOM",
      "value": function assembleDOM() {
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
        var r = this.playerCore.controlManager && this.playerCore.controlManager.commentPanel;
        if (r && r.commentsPanel) {
          this.playerContainer.appendChild(r.commentsPanel);
          if (!this.isLandscape && this.controlsVisible) {
            r.commentsPanel.classList.add("is-dimmed");
          }
        }
        this.updateButtonContainerParent();
        this.playerContainer.appendChild(this.settingsPanel);
        if (this.playerCore.controlManager && this.playerCore.controlManager.controlButtonsContainer) {
          this.playerContainer.appendChild(this.playerCore.controlManager.controlButtonsContainer);
        }
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.playerContainer);
        this.updateContainerMinHeight();
        this.setupInteractionListeners();
      }
    } ]);
  }();
  function i18n_typeof(r) {
    "@babel/helpers - typeof";
    return i18n_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, i18n_typeof(r);
  }
  function i18n_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function i18n_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, i18n_toPropertyKey(l.key), l);
    }
  }
  function i18n_createClass(r, o, a) {
    return o && i18n_defineProperties(r.prototype, o), a && i18n_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function i18n_defineProperty(r, o, a) {
    return (o = i18n_toPropertyKey(o)) in r ? Object.defineProperty(r, o, {
      "value": a,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : r[o] = a, r;
  }
  function i18n_toPropertyKey(r) {
    var o = i18n_toPrimitive(r, "string");
    return "symbol" == i18n_typeof(o) ? o : o + "";
  }
  function i18n_toPrimitive(r, o) {
    if ("object" != i18n_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != i18n_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var N = function() {
    function I18n() {
      i18n_classCallCheck(this, I18n);
    }
    return i18n_createClass(I18n, null, [ {
      "key": "userLang",
      "get": function get() {
        return navigator.languages && navigator.languages[0] || navigator.language || "en";
      }
    }, {
      "key": "translate",
      "value": function translate(r) {
        var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
        var a = o || this.userLang;
        var l = this.strings[a] || this.strings[a.split("-")[0]] || this.strings.en;
        return l[r] || this.strings.en[r];
      }
    } ]);
  }();
  i18n_defineProperty(N, "strings", {
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
  function __(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    return N.translate(r, o);
  }
  function logger_typeof(r) {
    "@babel/helpers - typeof";
    return logger_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, logger_typeof(r);
  }
  function logger_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function logger_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, logger_toPropertyKey(l.key), l);
    }
  }
  function logger_createClass(r, o, a) {
    return o && logger_defineProperties(r.prototype, o), a && logger_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function logger_toPropertyKey(r) {
    var o = logger_toPrimitive(r, "string");
    return "symbol" == logger_typeof(o) ? o : o + "";
  }
  function logger_toPrimitive(r, o) {
    if ("object" != logger_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != logger_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var J = typeof console !== "undefined" ? console : null;
  var q = function() {
    function Logger() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "[Miss Player]";
      logger_classCallCheck(this, Logger);
      this.prefix = r;
      if (typeof window !== "undefined") {
        if (!window.missPlayerLogs) {
          window.missPlayerLogs = [];
        }
      }
    }
    return logger_createClass(Logger, [ {
      "key": "_addLog",
      "value": function _addLog(r) {
        if (typeof window === "undefined") {
          return;
        }
        for (var o = arguments.length, a = new Array(o > 1 ? o - 1 : 0), l = 1; l < o; l++) {
          a[l - 1] = arguments[l];
        }
        var u = a.map((function(r) {
          if (r instanceof Error) {
            return "".concat(r.message, "\n").concat(r.stack);
          }
          if (logger_typeof(r) === "object") {
            try {
              return JSON.stringify(r);
            } catch (o) {
              return String(r);
            }
          }
          return String(r);
        })).join(" ");
        var p = {
          "time": (new Date).toISOString(),
          "level": r,
          "msg": "".concat(this.prefix, " ").concat(u)
        };
        window.missPlayerLogs.push(p);
        if (window.missPlayerLogs.length > 500) {
          window.missPlayerLogs.shift();
        }
        if (J) {
          var v = r === "error" ? "error" : r === "warn" ? "warn" : "log";
          if (J[v]) {
            J[v].apply(J, [ "".concat(this.prefix) ].concat(a));
          }
        }
      }
    }, {
      "key": "log",
      "value": function log() {
        for (var r = arguments.length, o = new Array(r), a = 0; a < r; a++) {
          o[a] = arguments[a];
        }
        this._addLog.apply(this, [ "info" ].concat(o));
      }
    }, {
      "key": "info",
      "value": function info() {
        for (var r = arguments.length, o = new Array(r), a = 0; a < r; a++) {
          o[a] = arguments[a];
        }
        this._addLog.apply(this, [ "info" ].concat(o));
      }
    }, {
      "key": "warn",
      "value": function warn() {
        for (var r = arguments.length, o = new Array(r), a = 0; a < r; a++) {
          o[a] = arguments[a];
        }
        this._addLog.apply(this, [ "warn" ].concat(o));
      }
    }, {
      "key": "error",
      "value": function error() {
        for (var r = arguments.length, o = new Array(r), a = 0; a < r; a++) {
          o[a] = arguments[a];
        }
        this._addLog.apply(this, [ "error" ].concat(o));
      }
    }, {
      "key": "getLogsText",
      "value": function getLogsText(r) {
        if (typeof window === "undefined" || !window.missPlayerLogs || window.missPlayerLogs.length === 0) {
          return "No logs collected.";
        }
        var o = window.missPlayerLogs;
        if (r) {
          if (typeof r === "function") {
            o = o.filter((function(o) {
              return r(o.msg);
            }));
          } else if (typeof r === "string") {
            var a = r.toLowerCase();
            o = o.filter((function(r) {
              return r.msg.toLowerCase().includes(a);
            }));
          } else if (Array.isArray(r)) {
            o = o.filter((function(o) {
              var a = o.msg.toLowerCase();
              return r.some((function(r) {
                return a.includes(r.toLowerCase());
              }));
            }));
          }
        }
        return o.map((function(r) {
          return "[".concat(r.time, "] [").concat(r.level.toUpperCase(), "] ").concat(r.msg);
        })).join("\n");
      }
    }, {
      "key": "copyLogs",
      "value": function copyLogs(r) {
        var o = this.getLogsText(r);
        if (typeof GM_setClipboard === "function") {
          GM_setClipboard(o);
          return true;
        }
        return false;
      }
    } ]);
  }();
  var U = new q("[Miss Player]");
  const W = null && U;
  function CrossDomainBridge_typeof(r) {
    "@babel/helpers - typeof";
    return CrossDomainBridge_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, CrossDomainBridge_typeof(r);
  }
  function CrossDomainBridge_regeneratorRuntime() {
    "use strict";
    CrossDomainBridge_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == CrossDomainBridge_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(CrossDomainBridge_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function CrossDomainBridge_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function CrossDomainBridge_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          CrossDomainBridge_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          CrossDomainBridge_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function CrossDomainBridge_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function CrossDomainBridge_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, CrossDomainBridge_toPropertyKey(l.key), l);
    }
  }
  function CrossDomainBridge_createClass(r, o, a) {
    return o && CrossDomainBridge_defineProperties(r.prototype, o), a && CrossDomainBridge_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function CrossDomainBridge_toPropertyKey(r) {
    var o = CrossDomainBridge_toPrimitive(r, "string");
    return "symbol" == CrossDomainBridge_typeof(o) ? o : o + "";
  }
  function CrossDomainBridge_toPrimitive(r, o) {
    if ("object" != CrossDomainBridge_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != CrossDomainBridge_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Y = function() {
    function CrossDomainBridge() {
      CrossDomainBridge_classCallCheck(this, CrossDomainBridge);
    }
    return CrossDomainBridge_createClass(CrossDomainBridge, null, [ {
      "key": "checkShadowActive",
      "value": function() {
        var r = CrossDomainBridge_asyncToGenerator(CrossDomainBridge_regeneratorRuntime().mark((function _callee(r) {
          var o;
          return CrossDomainBridge_regeneratorRuntime().wrap((function _callee$(a) {
            while (1) {
              switch (a.prev = a.next) {
               case 0:
                a.prev = 0;
                if (!(typeof GM_getValue === "function")) {
                  a.next = 6;
                  break;
                }
                a.next = 4;
                return GM_getValue("".concat(r, "_SHADOW_HEARTBEAT"), 0);

               case 4:
                o = a.sent;
                return a.abrupt("return", Date.now() - o < 5e3);

               case 6:
                a.next = 10;
                break;

               case 8:
                a.prev = 8;
                a.t0 = a["catch"](0);

               case 10:
                return a.abrupt("return", false);

               case 11:
               case "end":
                return a.stop();
              }
            }
          }), _callee, null, [ [ 0, 8 ] ]);
        })));
        function checkShadowActive(o) {
          return r.apply(this, arguments);
        }
        return checkShadowActive;
      }()
    }, {
      "key": "startBroker",
      "value": function startBroker(r) {
        var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var a = window.location.hostname;
        var l = function sendHeartbeat() {
          try {
            if (typeof GM_setValue === "function") {
              GM_setValue("".concat(r, "_SHADOW_HEARTBEAT"), Date.now());
            }
          } catch (r) {}
        };
        l();
        setInterval(l, 2e3);
        var u = function() {
          var a = CrossDomainBridge_asyncToGenerator(CrossDomainBridge_regeneratorRuntime().mark((function _callee2(a) {
            var l, u, p, v, b;
            return CrossDomainBridge_regeneratorRuntime().wrap((function _callee2$(y) {
              while (1) {
                switch (y.prev = y.next) {
                 case 0:
                  l = a.txId, u = a.action, p = a.payload;
                  v = o[u];
                  if (!v) {
                    y.next = 15;
                    break;
                  }
                  y.prev = 3;
                  y.next = 6;
                  return v(p);

                 case 6:
                  b = y.sent;
                  if (typeof GM_setValue === "function") {
                    GM_setValue("".concat(r, "_RES_BRIDGE"), {
                      "txId": l,
                      "status": "SUCCESS",
                      "result": b,
                      "timestamp": Date.now()
                    });
                  }
                  y.next = 13;
                  break;

                 case 10:
                  y.prev = 10;
                  y.t0 = y["catch"](3);
                  if (typeof GM_setValue === "function") {
                    GM_setValue("".concat(r, "_RES_BRIDGE"), {
                      "txId": l,
                      "status": "ERROR",
                      "error": y.t0.message || "执行异常",
                      "timestamp": Date.now()
                    });
                  }

                 case 13:
                  y.next = 15;
                  break;

                 case 15:
                 case "end":
                  return y.stop();
                }
              }
            }), _callee2, null, [ [ 3, 10 ] ]);
          })));
          return function handleCommand(r) {
            return a.apply(this, arguments);
          };
        }();
        try {
          if (typeof GM_addValueChangeListener === "function") {
            GM_addValueChangeListener("".concat(r, "_CMD_BRIDGE"), function() {
              var r = CrossDomainBridge_asyncToGenerator(CrossDomainBridge_regeneratorRuntime().mark((function _callee3(r, o, a) {
                return CrossDomainBridge_regeneratorRuntime().wrap((function _callee3$(r) {
                  while (1) {
                    switch (r.prev = r.next) {
                     case 0:
                      if (a) {
                        r.next = 2;
                        break;
                      }
                      return r.abrupt("return");

                     case 2:
                      if (!(Date.now() - a.timestamp > 1e4)) {
                        r.next = 4;
                        break;
                      }
                      return r.abrupt("return");

                     case 4:
                      r.next = 6;
                      return u(a);

                     case 6:
                     case "end":
                      return r.stop();
                    }
                  }
                }), _callee3);
              })));
              return function(o, a, l) {
                return r.apply(this, arguments);
              };
            }());
          } else {
            var p = "";
            setInterval(CrossDomainBridge_asyncToGenerator(CrossDomainBridge_regeneratorRuntime().mark((function _callee4() {
              var o;
              return CrossDomainBridge_regeneratorRuntime().wrap((function _callee4$(a) {
                while (1) {
                  switch (a.prev = a.next) {
                   case 0:
                    a.prev = 0;
                    if (!(typeof GM_getValue !== "function")) {
                      a.next = 3;
                      break;
                    }
                    return a.abrupt("return");

                   case 3:
                    a.next = 5;
                    return GM_getValue("".concat(r, "_CMD_BRIDGE"));

                   case 5:
                    o = a.sent;
                    if (!(o && o.txId !== p)) {
                      a.next = 12;
                      break;
                    }
                    p = o.txId;
                    if (!(Date.now() - o.timestamp > 1e4)) {
                      a.next = 10;
                      break;
                    }
                    return a.abrupt("return");

                   case 10:
                    a.next = 12;
                    return u(o);

                   case 12:
                    a.next = 16;
                    break;

                   case 14:
                    a.prev = 14;
                    a.t0 = a["catch"](0);

                   case 16:
                   case "end":
                    return a.stop();
                  }
                }
              }), _callee4, null, [ [ 0, 14 ] ]);
            }))), 1e3);
          }
        } catch (r) {}
      }
    }, {
      "key": "sendCommand",
      "value": function() {
        var r = CrossDomainBridge_asyncToGenerator(CrossDomainBridge_regeneratorRuntime().mark((function _callee6(r, o, a) {
          var l, u, p = arguments;
          return CrossDomainBridge_regeneratorRuntime().wrap((function _callee6$(v) {
            while (1) {
              switch (v.prev = v.next) {
               case 0:
                l = p.length > 3 && p[3] !== void 0 ? p[3] : 15e3;
                u = "tx_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 11));
                return v.abrupt("return", new Promise((function(p) {
                  var v = null;
                  var b = null;
                  var y = function cleanUp() {
                    clearTimeout(C);
                    if (v && typeof GM_removeValueChangeListener === "function") {
                      GM_removeValueChangeListener(v);
                    }
                    if (b) {
                      clearInterval(b);
                    }
                  };
                  var C = setTimeout((function() {
                    y();
                    Toast("影子通道 [".concat(r, "] 操作超时，请检查该站点的标签页是否开启"), 3e3, "error");
                    p(false);
                  }), l);
                  var k = function handleResponse(r) {
                    y();
                    if (r.status === "SUCCESS") {
                      p(r.result !== void 0 ? r.result : true);
                    } else {
                      var o = r.error || "执行失败";
                      Toast("通过影子页提交失败: ".concat(o), 3e3, "error");
                      p(false);
                    }
                  };
                  if (typeof GM_addValueChangeListener === "function") {
                    v = GM_addValueChangeListener("".concat(r, "_RES_BRIDGE"), (function(r, o, a) {
                      if (a && a.txId === u) {
                        k(a);
                      }
                    }));
                  } else {
                    b = setInterval(CrossDomainBridge_asyncToGenerator(CrossDomainBridge_regeneratorRuntime().mark((function _callee5() {
                      var o;
                      return CrossDomainBridge_regeneratorRuntime().wrap((function _callee5$(a) {
                        while (1) {
                          switch (a.prev = a.next) {
                           case 0:
                            a.prev = 0;
                            if (!(typeof GM_getValue !== "function")) {
                              a.next = 3;
                              break;
                            }
                            return a.abrupt("return");

                           case 3:
                            a.next = 5;
                            return GM_getValue("".concat(r, "_RES_BRIDGE"));

                           case 5:
                            o = a.sent;
                            if (o && o.txId === u) {
                              k(o);
                            }
                            a.next = 11;
                            break;

                           case 9:
                            a.prev = 9;
                            a.t0 = a["catch"](0);

                           case 11:
                           case "end":
                            return a.stop();
                          }
                        }
                      }), _callee5, null, [ [ 0, 9 ] ]);
                    }))), 500);
                  }
                  try {
                    if (typeof GM_setValue === "function") {
                      GM_setValue("".concat(r, "_CMD_BRIDGE"), {
                        "txId": u,
                        "action": o,
                        "payload": a,
                        "timestamp": Date.now()
                      });
                    } else {
                      throw new Error("GM_setValue is not available");
                    }
                  } catch (r) {
                    y();
                    p(false);
                  }
                })));

               case 3:
               case "end":
                return v.stop();
              }
            }
          }), _callee6);
        })));
        function sendCommand(o, a, l) {
          return r.apply(this, arguments);
        }
        return sendCommand;
      }()
    } ]);
  }();
  function CredentialManager_typeof(r) {
    "@babel/helpers - typeof";
    return CredentialManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, CredentialManager_typeof(r);
  }
  function CredentialManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function CredentialManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, CredentialManager_toPropertyKey(l.key), l);
    }
  }
  function CredentialManager_createClass(r, o, a) {
    return o && CredentialManager_defineProperties(r.prototype, o), a && CredentialManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function CredentialManager_toPropertyKey(r) {
    var o = CredentialManager_toPrimitive(r, "string");
    return "symbol" == CredentialManager_typeof(o) ? o : o + "";
  }
  function CredentialManager_toPrimitive(r, o) {
    if ("object" != CredentialManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != CredentialManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var K = "MissPlayerSalt_2026";
  var X = "_mp_obf_:";
  function xorObfuscate(r) {
    if (!r) {
      return "";
    }
    var o = "";
    for (var a = 0; a < r.length; a++) {
      o += String.fromCharCode(r.charCodeAt(a) ^ K.charCodeAt(a % K.length));
    }
    try {
      return X + btoa(encodeURIComponent(o));
    } catch (r) {
      return X + o;
    }
  }
  function xorDeobfuscate(r) {
    if (!r) {
      return "";
    }
    if (!r.startsWith(X)) {
      return r;
    }
    var o = r.substring(X.length);
    var a = o;
    try {
      a = decodeURIComponent(atob(o));
    } catch (r) {}
    var l = "";
    for (var u = 0; u < a.length; u++) {
      l += String.fromCharCode(a.charCodeAt(u) ^ K.charCodeAt(u % K.length));
    }
    return l;
  }
  var $ = function() {
    function CredentialManager() {
      CredentialManager_classCallCheck(this, CredentialManager);
    }
    return CredentialManager_createClass(CredentialManager, null, [ {
      "key": "get",
      "value": function get(r) {
        var o = r || "";
        var a = "".concat(o, "_autologin_userEmail");
        var l = "".concat(o, "_autologin_userPassword");
        var u = "".concat(o, "_autologin_autoLogin");
        var p = "";
        var v = "";
        var b = true;
        if (typeof GM_getValue === "function") {
          try {
            p = GM_getValue(a, "");
            v = GM_getValue(l, "");
            b = GM_getValue(u, true);
          } catch (r) {}
        }
        if (!p) {
          p = getLocalStorage(a, "");
          v = getLocalStorage(l, "");
          b = getLocalStorage(u, true);
          if (!p) {
            var y = "".concat(o, "_autologin_username");
            var C = getLocalStorage("autologin_userEmail", "") || getLocalStorage(y, "");
            if (C) {
              p = C;
              v = getLocalStorage("autologin_userPassword", "");
              b = getLocalStorage("autologin_autoLogin", true);
              this.save(r, p, xorDeobfuscate(v), b);
            }
          }
        }
        var k = "";
        if (v) {
          k = xorDeobfuscate(v);
          if (!v.startsWith(X) && p) {
            this.save(r, p, k, b);
          }
        }
        return {
          "email": p,
          "password": k,
          "autoLogin": !!b
        };
      }
    }, {
      "key": "save",
      "value": function save(r, o, a, l) {
        if (!r) {
          return;
        }
        var u = r;
        var p = "".concat(u, "_autologin_userEmail");
        var v = "".concat(u, "_autologin_userPassword");
        var b = "".concat(u, "_autologin_autoLogin");
        var y = a ? xorObfuscate(a) : "";
        if (typeof GM_setValue === "function") {
          try {
            GM_setValue(p, o);
            GM_setValue(v, y);
            GM_setValue(b, l);
          } catch (r) {}
        }
        setLocalStorage(p, o);
        setLocalStorage(v, y);
        setLocalStorage(b, l);
      }
    }, {
      "key": "clear",
      "value": function clear(r) {
        if (!r) {
          return;
        }
        var o = r;
        var a = "".concat(o, "_autologin_userEmail");
        var l = "".concat(o, "_autologin_userPassword");
        var u = "".concat(o, "_autologin_autoLogin");
        if (typeof GM_deleteValue === "function") {
          try {
            GM_deleteValue(a);
            GM_deleteValue(l);
            GM_deleteValue(u);
          } catch (r) {}
        }
        try {
          localStorage.removeItem(a);
          localStorage.removeItem(l);
          localStorage.removeItem(u);
        } catch (r) {}
      }
    } ]);
  }();
  function BaseLoginProvider_typeof(r) {
    "@babel/helpers - typeof";
    return BaseLoginProvider_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, BaseLoginProvider_typeof(r);
  }
  function BaseLoginProvider_regeneratorRuntime() {
    "use strict";
    BaseLoginProvider_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == BaseLoginProvider_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(BaseLoginProvider_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function BaseLoginProvider_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function BaseLoginProvider_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          BaseLoginProvider_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          BaseLoginProvider_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function BaseLoginProvider_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function BaseLoginProvider_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, BaseLoginProvider_toPropertyKey(l.key), l);
    }
  }
  function BaseLoginProvider_createClass(r, o, a) {
    return o && BaseLoginProvider_defineProperties(r.prototype, o), a && BaseLoginProvider_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function BaseLoginProvider_toPropertyKey(r) {
    var o = BaseLoginProvider_toPrimitive(r, "string");
    return "symbol" == BaseLoginProvider_typeof(o) ? o : o + "";
  }
  function BaseLoginProvider_toPrimitive(r, o) {
    if ("object" != BaseLoginProvider_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != BaseLoginProvider_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Q = function() {
    function BaseLoginProvider() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      BaseLoginProvider_classCallCheck(this, BaseLoginProvider);
      this.config = r;
      this.siteKey = r.siteKey || "";
      this.domains = r.domains || getSiteDomains(this.siteKey) || [];
    }
    return BaseLoginProvider_createClass(BaseLoginProvider, [ {
      "key": "isSupportedSite",
      "value": function isSupportedSite() {
        var r = window.location.hostname;
        return this.domains.some((function(o) {
          return r.includes(o);
        }));
      }
    }, {
      "key": "getActiveDomain",
      "value": function getActiveDomain(r) {
        if (r) {
          return r;
        }
        var o = window.location.hostname;
        var a = this.domains.some((function(r) {
          return o.includes(r);
        }));
        return a ? window.location.origin : "https://".concat(this.domains[0]);
      }
    }, {
      "key": "_request",
      "value": function() {
        var r = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee3(r) {
          var o, a, l, u, p, v, b, y, C, k, _, E, S, P = arguments;
          return BaseLoginProvider_regeneratorRuntime().wrap((function _callee3$(D) {
            while (1) {
              switch (D.prev = D.next) {
               case 0:
                o = P.length > 1 && P[1] !== void 0 ? P[1] : {};
                a = o.method, l = a === void 0 ? "GET" : a, u = o.headers, p = u === void 0 ? {} : u, 
                v = o.body, b = v === void 0 ? null : v, y = o.responseType, C = y === void 0 ? "json" : y;
                k = r.startsWith(window.location.origin);
                if (!k) {
                  D.next = 17;
                  break;
                }
                _ = typeof unsafeWindow !== "undefined" && unsafeWindow.fetch ? unsafeWindow.fetch.bind(unsafeWindow) : typeof window.fetch === "function" ? window.fetch.bind(window) : null;
                if (!_) {
                  D.next = 17;
                  break;
                }
                D.prev = 6;
                E = {
                  "method": l,
                  "headers": p,
                  "credentials": "same-origin"
                };
                if (b) {
                  E.body = b;
                }
                D.next = 11;
                return _(r, E);

               case 11:
                S = D.sent;
                return D.abrupt("return", {
                  "ok": S.ok,
                  "status": S.status,
                  "statusText": S.statusText,
                  "headers": S.headers,
                  "json": function json() {
                    return S.json();
                  },
                  "text": function text() {
                    return S.text();
                  }
                });

               case 15:
                D.prev = 15;
                D.t0 = D["catch"](6);

               case 17:
                return D.abrupt("return", new Promise((function(o, a) {
                  if (typeof GM_xmlhttpRequest !== "function") {
                    a(new Error("GM_xmlhttpRequest is not available"));
                    return;
                  }
                  GM_xmlhttpRequest({
                    "method": l,
                    "url": r,
                    "headers": p,
                    "data": b,
                    "withCredentials": true,
                    "onload": function onload(r) {
                      o({
                        "ok": r.status >= 200 && r.status < 300,
                        "status": r.status,
                        "statusText": r.statusText,
                        "headers": {
                          "get": function get(o) {
                            var a = r.responseHeaders || "";
                            var l = a.match(new RegExp("^".concat(o, ":\\s*(.*)$"), "im"));
                            return l ? l[1].trim() : null;
                          }
                        },
                        "json": function() {
                          var o = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee() {
                            return BaseLoginProvider_regeneratorRuntime().wrap((function _callee$(o) {
                              while (1) {
                                switch (o.prev = o.next) {
                                 case 0:
                                  return o.abrupt("return", JSON.parse(r.responseText));

                                 case 1:
                                 case "end":
                                  return o.stop();
                                }
                              }
                            }), _callee);
                          })));
                          function json() {
                            return o.apply(this, arguments);
                          }
                          return json;
                        }(),
                        "text": function() {
                          var o = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee2() {
                            return BaseLoginProvider_regeneratorRuntime().wrap((function _callee2$(o) {
                              while (1) {
                                switch (o.prev = o.next) {
                                 case 0:
                                  return o.abrupt("return", r.responseText);

                                 case 1:
                                 case "end":
                                  return o.stop();
                                }
                              }
                            }), _callee2);
                          })));
                          function text() {
                            return o.apply(this, arguments);
                          }
                          return text;
                        }()
                      });
                    },
                    "onerror": a
                  });
                })));

               case 18:
               case "end":
                return D.stop();
              }
            }
          }), _callee3, null, [ [ 6, 15 ] ]);
        })));
        function _request(o) {
          return r.apply(this, arguments);
        }
        return _request;
      }()
    }, {
      "key": "cacheLoginStatus",
      "value": function cacheLoginStatus(r) {
        if (!this.siteKey) {
          return;
        }
        var o = "mp_login_status_".concat(this.siteKey);
        var a = "mp_login_status_time_".concat(this.siteKey);
        if (typeof GM_setValue === "function") {
          try {
            GM_setValue(o, r);
            GM_setValue(a, Date.now());
          } catch (r) {}
        }
        setLocalStorage(o, r);
        setLocalStorage(a, Date.now());
      }
    }, {
      "key": "getCachedLoginStatus",
      "value": function getCachedLoginStatus() {
        if (!this.siteKey) {
          return null;
        }
        var r = "mp_login_status_".concat(this.siteKey);
        var o = null;
        if (typeof GM_getValue === "function") {
          try {
            o = GM_getValue(r, null);
          } catch (r) {}
        }
        if (o === null) {
          o = getLocalStorage(r, null);
        }
        if (typeof o === "boolean") {
          return o;
        }
        try {
          var a = $.get(this.siteKey);
          if (a && a.email && a.password && a.autoLogin) {
            return true;
          }
        } catch (r) {}
        return null;
      }
    }, {
      "key": "checkLoginStatus",
      "value": function() {
        var r = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee4(r) {
          var o, a;
          return BaseLoginProvider_regeneratorRuntime().wrap((function _callee4$(l) {
            while (1) {
              switch (l.prev = l.next) {
               case 0:
                l.prev = 0;
                l.next = 3;
                return this.checkLoginByAPI(r);

               case 3:
                o = l.sent;
                if (!(o !== null)) {
                  l.next = 7;
                  break;
                }
                this.cacheLoginStatus(o);
                return l.abrupt("return", o);

               case 7:
                a = this.checkLoginByDOM();
                this.cacheLoginStatus(a);
                return l.abrupt("return", a);

               case 12:
                l.prev = 12;
                l.t0 = l["catch"](0);
                return l.abrupt("return", false);

               case 15:
               case "end":
                return l.stop();
              }
            }
          }), _callee4, this, [ [ 0, 12 ] ]);
        })));
        function checkLoginStatus(o) {
          return r.apply(this, arguments);
        }
        return checkLoginStatus;
      }()
    }, {
      "key": "checkLoginByAPI",
      "value": function() {
        var r = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee5(r) {
          var o, a, l, u, p, v;
          return BaseLoginProvider_regeneratorRuntime().wrap((function _callee5$(b) {
            while (1) {
              switch (b.prev = b.next) {
               case 0:
                o = this.config.apis;
                if (!(!o || !o.checkStatus)) {
                  b.next = 3;
                  break;
                }
                return b.abrupt("return", null);

               case 3:
                b.prev = 3;
                a = this.getActiveDomain(r);
                l = "".concat(a).concat(o.checkStatus);
                b.next = 8;
                return this._request(l);

               case 8:
                u = b.sent;
                if (u.ok) {
                  b.next = 11;
                  break;
                }
                return b.abrupt("return", null);

               case 11:
                if (!(typeof this.isLoggedInByAPIResponse === "function")) {
                  b.next = 13;
                  break;
                }
                return b.abrupt("return", this.isLoggedInByAPIResponse(u));

               case 13:
                b.next = 15;
                return u.json();

               case 15:
                p = b.sent;
                v = p.data || p;
                return b.abrupt("return", v && v.user !== null && v.user !== void 0);

               case 20:
                b.prev = 20;
                b.t0 = b["catch"](3);
                return b.abrupt("return", null);

               case 23:
               case "end":
                return b.stop();
              }
            }
          }), _callee5, this, [ [ 3, 20 ] ]);
        })));
        function checkLoginByAPI(o) {
          return r.apply(this, arguments);
        }
        return checkLoginByAPI;
      }()
    }, {
      "key": "checkLoginByDOM",
      "value": function checkLoginByDOM() {
        if (!this.isSupportedSite()) {
          return false;
        }
        var r = this.config.selectors;
        if (!r) {
          return false;
        }
        try {
          var o = r.avatar ? document.querySelector(r.avatar) : null;
          var a = r.userMenu ? document.querySelector(r.userMenu) : null;
          var l = r.loginBtn ? document.querySelector(r.loginBtn) : null;
          if (o || a) {
            return true;
          }
          if (l) {
            return false;
          }
          return false;
        } catch (r) {
          return false;
        }
      }
    }, {
      "key": "addAutoLoginOption",
      "value": function() {
        var r = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee6(r) {
          var o = this;
          var a, l, u, p, v, b, y;
          return BaseLoginProvider_regeneratorRuntime().wrap((function _callee6$(C) {
            while (1) {
              switch (C.prev = C.next) {
               case 0:
                a = this.config.selectors;
                if (!(!a || !a.loginForm)) {
                  C.next = 3;
                  break;
                }
                return C.abrupt("return");

               case 3:
                C.prev = 3;
                C.next = 6;
                return waitForElement(a.loginForm);

               case 6:
                l = C.sent;
                if (l) {
                  C.next = 9;
                  break;
                }
                return C.abrupt("return");

               case 9:
                if (!l.querySelector(".mp-autologin-container")) {
                  C.next = 11;
                  break;
                }
                return C.abrupt("return");

               case 11:
                u = document.createElement("div");
                u.className = "mp-autologin-container";
                u.style.margin = "10px 0";
                u.style.display = "flex";
                u.style.alignItems = "center";
                u.style.gap = "8px";
                u.innerHTML = '\n                <input id="mp_auto_login" type="checkbox" style="cursor: pointer; width: 16px; height: 16px;">\n                <label for="mp_auto_login" style="cursor: pointer; font-size: 13px; color: #ccc;">'.concat(__("login_autoLogin") || "自动登录 (Miss Player)", "</label>\n            ");
                p = a.submitBtn ? l.querySelector(a.submitBtn) : l.querySelector('button[type="submit"]') || l.querySelector('input[type="submit"]');
                if (p && p.parentNode) {
                  p.parentNode.insertBefore(u, p);
                } else {
                  l.appendChild(u);
                }
                v = $.get(this.siteKey);
                b = document.getElementById("mp_auto_login");
                if (b) {
                  b.checked = v.autoLogin;
                  b.addEventListener("change", (function() {
                    var a = b.checked;
                    $.save(o.siteKey, v.email, v.password, a);
                    if (r) {
                      r({
                        "autoLogin": a
                      });
                    }
                  }));
                }
                y = function captureCredentials() {
                  setTimeout((function() {
                    var u = l.querySelector(a.usernameInput);
                    var p = l.querySelector(a.passwordInput);
                    var v = b ? b.checked : false;
                    if (u && p && v) {
                      var y = u.value;
                      var C = p.value;
                      if (y && C) {
                        $.save(o.siteKey, y, C, true);
                        if (r) {
                          r({
                            "email": y,
                            "password": C,
                            "autoLogin": true
                          });
                        }
                      }
                    }
                  }), 100);
                };
                l.addEventListener("submit", y);
                if (p) {
                  p.addEventListener("click", y);
                }
                C.next = 30;
                break;

               case 28:
                C.prev = 28;
                C.t0 = C["catch"](3);

               case 30:
               case "end":
                return C.stop();
              }
            }
          }), _callee6, this, [ [ 3, 28 ] ]);
        })));
        function addAutoLoginOption(o) {
          return r.apply(this, arguments);
        }
        return addAutoLoginOption;
      }()
    }, {
      "key": "keepAlive",
      "value": function() {
        var r = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee7() {
          var r, o, a;
          return BaseLoginProvider_regeneratorRuntime().wrap((function _callee7$(l) {
            while (1) {
              switch (l.prev = l.next) {
               case 0:
                r = $.get(this.siteKey);
                if (!(!r.email || !r.password || !r.autoLogin)) {
                  l.next = 3;
                  break;
                }
                return l.abrupt("return");

               case 3:
                o = this.getActiveDomain();
                l.prev = 4;
                l.next = 7;
                return this.checkLoginStatus(o);

               case 7:
                a = l.sent;
                if (a) {
                  l.next = 13;
                  break;
                }
                l.next = 11;
                return this.login(r.email, r.password, {
                  "reload": false,
                  "silent": true
                });

               case 11:
                l.next = 13;
                break;

               case 13:
                l.next = 17;
                break;

               case 15:
                l.prev = 15;
                l.t0 = l["catch"](4);

               case 17:
               case "end":
                return l.stop();
              }
            }
          }), _callee7, this, [ [ 4, 15 ] ]);
        })));
        function keepAlive() {
          return r.apply(this, arguments);
        }
        return keepAlive;
      }()
    }, {
      "key": "login",
      "value": function() {
        var r = BaseLoginProvider_asyncToGenerator(BaseLoginProvider_regeneratorRuntime().mark((function _callee8(r, o) {
          var a, l = arguments;
          return BaseLoginProvider_regeneratorRuntime().wrap((function _callee8$(r) {
            while (1) {
              switch (r.prev = r.next) {
               case 0:
                a = l.length > 2 && l[2] !== void 0 ? l[2] : {};
                throw new Error("login method must be implemented by subclasses");

               case 2:
               case "end":
                return r.stop();
              }
            }
          }), _callee8);
        })));
        function login(o, a) {
          return r.apply(this, arguments);
        }
        return login;
      }()
    }, {
      "key": "redirectLogin",
      "value": function redirectLogin(r) {
        throw new Error("redirectLogin method must be implemented by subclasses");
      }
    } ]);
  }();
  function JableLoginProvider_regeneratorRuntime() {
    "use strict";
    JableLoginProvider_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == JableLoginProvider_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(JableLoginProvider_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function JableLoginProvider_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function JableLoginProvider_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          JableLoginProvider_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          JableLoginProvider_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function JableLoginProvider_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function JableLoginProvider_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, JableLoginProvider_toPropertyKey(l.key), l);
    }
  }
  function JableLoginProvider_createClass(r, o, a) {
    return o && JableLoginProvider_defineProperties(r.prototype, o), a && JableLoginProvider_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function JableLoginProvider_toPropertyKey(r) {
    var o = JableLoginProvider_toPrimitive(r, "string");
    return "symbol" == JableLoginProvider_typeof(o) ? o : o + "";
  }
  function JableLoginProvider_toPrimitive(r, o) {
    if ("object" != JableLoginProvider_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != JableLoginProvider_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  function _callSuper(r, o, a) {
    return o = _getPrototypeOf(o), _possibleConstructorReturn(r, _isNativeReflectConstruct() ? Reflect.construct(o, a || [], _getPrototypeOf(r).constructor) : o.apply(r, a));
  }
  function _possibleConstructorReturn(r, o) {
    if (o && ("object" == JableLoginProvider_typeof(o) || "function" == typeof o)) {
      return o;
    }
    if (void 0 !== o) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return _assertThisInitialized(r);
  }
  function _assertThisInitialized(r) {
    if (void 0 === r) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return r;
  }
  function _isNativeReflectConstruct() {
    try {
      var r = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {})));
    } catch (r) {}
    return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
      return !!r;
    })();
  }
  function _getPrototypeOf(r) {
    return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(r) {
      return r.__proto__ || Object.getPrototypeOf(r);
    }, _getPrototypeOf(r);
  }
  function _inherits(r, o) {
    if ("function" != typeof o && null !== o) {
      throw new TypeError("Super expression must either be null or a function");
    }
    r.prototype = Object.create(o && o.prototype, {
      "constructor": {
        "value": r,
        "writable": !0,
        "configurable": !0
      }
    }), Object.defineProperty(r, "prototype", {
      "writable": !1
    }), o && _setPrototypeOf(r, o);
  }
  function _setPrototypeOf(r, o) {
    return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(r, o) {
      return r.__proto__ = o, r;
    }, _setPrototypeOf(r, o);
  }
  function JableLoginProvider_typeof(r) {
    "@babel/helpers - typeof";
    return JableLoginProvider_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, JableLoginProvider_typeof(r);
  }
  function formatErrorMessage(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "操作失败";
    if (!r) {
      return o;
    }
    if (typeof r === "string") {
      return r;
    }
    if (Array.isArray(r)) {
      if (r.length === 0) {
        return o;
      }
      return formatErrorMessage(r[0], o);
    }
    if (JableLoginProvider_typeof(r) === "object") {
      if (r instanceof Error) {
        return r.message;
      }
      if (r.message && typeof r.message === "string") {
        return r.message;
      }
      if (r.msg && typeof r.msg === "string") {
        return r.msg;
      }
      if (r.error && typeof r.error === "string") {
        return r.error;
      }
      var a = Object.keys(r);
      if (a.length === 0) {
        return o;
      }
      return formatErrorMessage(r[a[0]], o);
    }
    return String(r);
  }
  var Z = function(r) {
    function JableLoginProvider() {
      var r;
      JableLoginProvider_classCallCheck(this, JableLoginProvider);
      r = _callSuper(this, JableLoginProvider, [ {
        "siteKey": "JABLE",
        "domains": getSiteDomains("JABLE"),
        "selectors": {
          "loginForm": 'form[action*="/login/"]',
          "usernameInput": 'input[name="username"]',
          "passwordInput": 'input[name="pass"]',
          "submitBtn": 'button[type="submit"], input[type="submit"]',
          "avatar": ".user-avatar",
          "loginBtn": 'a[href*="login"]'
        }
      } ]);
      r.checkAndStartShadowBroker();
      return r;
    }
    _inherits(JableLoginProvider, r);
    return JableLoginProvider_createClass(JableLoginProvider, [ {
      "key": "checkAndStartShadowBroker",
      "value": function checkAndStartShadowBroker() {
        var r = this;
        if (!this.isSupportedSite()) {
          return;
        }
        Y.startBroker(this.siteKey, {
          "PUBLISH_COMMENT": function() {
            var o = JableLoginProvider_asyncToGenerator(JableLoginProvider_regeneratorRuntime().mark((function _callee(o) {
              var a, l, u, p, v, b, y;
              return JableLoginProvider_regeneratorRuntime().wrap((function _callee$(C) {
                while (1) {
                  switch (C.prev = C.next) {
                   case 0:
                    a = o.commentText, l = o.videoCode, u = o.videoId, p = o.commentFormHtml, v = o.targetUrl;
                    b = null;
                    if (p) {
                      y = (new DOMParser).parseFromString(p, "text/html");
                      b = y.querySelector("form");
                    }
                    C.next = 5;
                    return r.publishComment(a, {
                      "videoCode": l,
                      "videoId": u,
                      "commentForm": b,
                      "targetUrl": v,
                      "domain": "https://".concat(window.location.hostname)
                    });

                   case 5:
                    return C.abrupt("return", C.sent);

                   case 6:
                   case "end":
                    return C.stop();
                  }
                }
              }), _callee);
            })));
            function PUBLISH_COMMENT(r) {
              return o.apply(this, arguments);
            }
            return PUBLISH_COMMENT;
          }()
        });
      }
    }, {
      "key": "checkLoginStatus",
      "value": function() {
        var r = JableLoginProvider_asyncToGenerator(JableLoginProvider_regeneratorRuntime().mark((function _callee2(r) {
          var o, a, l, u, p, v, b, y;
          return JableLoginProvider_regeneratorRuntime().wrap((function _callee2$(C) {
            while (1) {
              switch (C.prev = C.next) {
               case 0:
                o = this.getActiveDomain(r);
                if (!this.isSupportedSite()) {
                  C.next = 5;
                  break;
                }
                a = this.checkLoginByDOM();
                this.cacheLoginStatus(a);
                return C.abrupt("return", a);

               case 5:
                C.prev = 5;
                C.next = 8;
                return this._request("".concat(o, "/"));

               case 8:
                l = C.sent;
                if (l.ok) {
                  C.next = 11;
                  break;
                }
                return C.abrupt("return", (u = this.getCachedLoginStatus()) !== null && u !== void 0 ? u : false);

               case 11:
                C.next = 13;
                return l.text();

               case 13:
                p = C.sent;
                if (!(p.includes("cf-challenge") || p.includes("Cloudflare") || p.includes("Just a moment") || p.includes("Checking your browser"))) {
                  C.next = 16;
                  break;
                }
                return C.abrupt("return", (v = this.getCachedLoginStatus()) !== null && v !== void 0 ? v : false);

               case 16:
                b = p.includes("/logout/") || p.includes("user-avatar") || !p.includes("/login/") && p.includes("member");
                this.cacheLoginStatus(b);
                return C.abrupt("return", b);

               case 21:
                C.prev = 21;
                C.t0 = C["catch"](5);
                return C.abrupt("return", (y = this.getCachedLoginStatus()) !== null && y !== void 0 ? y : false);

               case 24:
               case "end":
                return C.stop();
              }
            }
          }), _callee2, this, [ [ 5, 21 ] ]);
        })));
        function checkLoginStatus(o) {
          return r.apply(this, arguments);
        }
        return checkLoginStatus;
      }()
    }, {
      "key": "checkLoginByDOM",
      "value": function checkLoginByDOM() {
        if (!this.isSupportedSite()) {
          return false;
        }
        try {
          var r = document.querySelector('a[href*="logout"]') || document.querySelector(".user-avatar");
          var o = document.querySelector('a[href*="login"]');
          return !!r || !o;
        } catch (r) {
          return false;
        }
      }
    }, {
      "key": "login",
      "value": function() {
        var r = JableLoginProvider_asyncToGenerator(JableLoginProvider_regeneratorRuntime().mark((function _callee3(r, o) {
          var a, l, u, p, v, b, y, C, k = arguments;
          return JableLoginProvider_regeneratorRuntime().wrap((function _callee3$(_) {
            while (1) {
              switch (_.prev = _.next) {
               case 0:
                a = k.length > 2 && k[2] !== void 0 ? k[2] : {};
                l = "";
                u = false;
                if (typeof a === "string") {
                  l = a;
                } else if (a && JableLoginProvider_typeof(a) === "object") {
                  l = a.domain || "";
                  u = !!a.silent;
                }
                p = this.getActiveDomain(l);
                if (!(!r || !o)) {
                  _.next = 8;
                  break;
                }
                if (!u) {
                  Toast("用户名和密码不能为空", 2e3, "error");
                }
                return _.abrupt("return", false);

               case 8:
                _.prev = 8;
                v = new URLSearchParams;
                v.append("username", r);
                v.append("pass", o);
                v.append("remember_me", "1");
                v.append("action", "login");
                v.append("email_link", "".concat(p, "/email/"));
                v.append("format", "json");
                v.append("mode", "async");
                _.next = 19;
                return this._request("".concat(p, "/login/"), {
                  "method": "POST",
                  "headers": {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "x-requested-with": "XMLHttpRequest",
                    "referer": "".concat(p, "/"),
                    "origin": p
                  },
                  "body": v.toString()
                });

               case 19:
                b = _.sent;
                if (b.ok) {
                  _.next = 22;
                  break;
                }
                throw new Error("HTTP ".concat(b.status));

               case 22:
                _.next = 24;
                return b.json();

               case 24:
                y = _.sent;
                if (!(y.status === "success" || y.html && !y.html.includes("error-field"))) {
                  _.next = 31;
                  break;
                }
                this.cacheLoginStatus(true);
                if (!u) {
                  Toast("Jable.tv 登录成功", 2e3, "success");
                }
                return _.abrupt("return", true);

               case 31:
                if (!y.errors) {
                  _.next = 37;
                  break;
                }
                C = formatErrorMessage(y.errors, "登录失败");
                if (!u) {
                  Toast("登录失败: ".concat(C), 3e3, "error");
                }
                return _.abrupt("return", false);

               case 37:
                if (!u) {
                  Toast("登录失败，请检查账号和密码", 3e3, "error");
                }
                return _.abrupt("return", false);

               case 39:
                _.next = 45;
                break;

               case 41:
                _.prev = 41;
                _.t0 = _["catch"](8);
                if (!u) {
                  Toast("登录出错: ".concat(_.t0.message), 2e3, "error");
                }
                return _.abrupt("return", false);

               case 45:
               case "end":
                return _.stop();
              }
            }
          }), _callee3, this, [ [ 8, 41 ] ]);
        })));
        function login(o, a) {
          return r.apply(this, arguments);
        }
        return login;
      }()
    }, {
      "key": "redirectLogin",
      "value": function redirectLogin(r) {
        var o = this.getActiveDomain(r);
        if (typeof GM_openInTab === "function") {
          GM_openInTab("".concat(o, "/login/"), {
            "active": true,
            "insert": true,
            "setParent": true
          });
        } else {
          window.open("".concat(o, "/login/"), "_blank");
        }
      }
    }, {
      "key": "publishCommentViaShadow",
      "value": function() {
        var r = JableLoginProvider_asyncToGenerator(JableLoginProvider_regeneratorRuntime().mark((function _callee4(r, o) {
          var a, l, u, p, v, b, y;
          return JableLoginProvider_regeneratorRuntime().wrap((function _callee4$(C) {
            while (1) {
              switch (C.prev = C.next) {
               case 0:
                a = o.videoCode, l = o.videoId, u = o.commentForm, p = o.targetUrl, v = o.domain;
                b = "";
                if (u) {
                  y = document.createElement("div");
                  y.appendChild(u.cloneNode(true));
                  b = y.innerHTML;
                }
                C.next = 5;
                return Y.sendCommand(this.siteKey, "PUBLISH_COMMENT", {
                  "commentText": r,
                  "videoCode": a,
                  "videoId": l,
                  "commentFormHtml": b,
                  "targetUrl": p
                });

               case 5:
                return C.abrupt("return", C.sent);

               case 6:
               case "end":
                return C.stop();
              }
            }
          }), _callee4, this);
        })));
        function publishCommentViaShadow(o, a) {
          return r.apply(this, arguments);
        }
        return publishCommentViaShadow;
      }()
    }, {
      "key": "publishComment",
      "value": function() {
        var r = JableLoginProvider_asyncToGenerator(JableLoginProvider_regeneratorRuntime().mark((function _callee5(r, o) {
          var a, l, u, p, v, b, y, C, k, _, E, S, P, D, L, M, A, T, j, B, I;
          return JableLoginProvider_regeneratorRuntime().wrap((function _callee5$(V) {
            while (1) {
              switch (V.prev = V.next) {
               case 0:
                a = o.videoCode, l = o.videoId, u = o.commentForm, p = o.targetUrl, v = o.domain;
                if (r) {
                  V.next = 4;
                  break;
                }
                Toast("评论内容不能为空", 2e3, "warning");
                return V.abrupt("return", false);

               case 4:
                if (!(r.length < 3)) {
                  V.next = 7;
                  break;
                }
                Toast("评论内容太少，至少输入3个字", 2e3, "warning");
                return V.abrupt("return", false);

               case 7:
                b = this.isSupportedSite();
                if (b) {
                  V.next = 20;
                  break;
                }
                V.next = 11;
                return Y.checkShadowActive(this.siteKey);

               case 11:
                y = V.sent;
                if (!y) {
                  V.next = 20;
                  break;
                }
                V.next = 15;
                return this.publishCommentViaShadow(r, {
                  "videoCode": a,
                  "videoId": l,
                  "commentForm": u,
                  "targetUrl": p,
                  "domain": v
                });

               case 15:
                C = V.sent;
                if (!C) {
                  V.next = 18;
                  break;
                }
                return V.abrupt("return", true);

               case 18:
                V.next = 20;
                break;

               case 20:
                k = this.getActiveDomain(v);
                _ = p || "".concat(k, "/videos/").concat(a.toLowerCase(), "/");
                E = new URLSearchParams;
                if (u) {
                  u.querySelectorAll("input").forEach((function(r) {
                    if (r.name && r.type !== "submit") {
                      if (r.name !== "format" && r.name !== "mode") {
                        E.append(r.name, r.value);
                      }
                    }
                  }));
                  S = u.querySelector("textarea");
                  P = S ? S.name : "comment";
                  E.append(P, r);
                } else {
                  E.append("action", "add_comment");
                  if (l) {
                    E.append("video_id", l);
                  }
                  E.append("comment", r);
                }
                if (!E.has("format")) {
                  E.append("format", "json");
                }
                if (!E.has("mode")) {
                  E.append("mode", "async");
                }
                D = u ? u.getAttribute("action") || "" : "";
                if (D.startsWith("/")) {
                  D = "".concat(k).concat(D);
                } else if (!D.startsWith("http")) {
                  D = _;
                }
                V.prev = 28;
                V.next = 31;
                return this._request(D, {
                  "method": "POST",
                  "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "x-requested-with": "XMLHttpRequest",
                    "referer": _,
                    "origin": k
                  },
                  "body": E.toString()
                });

               case 31:
                L = V.sent;
                if (!(L.status === 200 || L.status === 302)) {
                  V.next = 63;
                  break;
                }
                V.next = 35;
                return L.text();

               case 35:
                M = V.sent;
                V.prev = 36;
                A = JSON.parse(M);
                if (!(A.status === "success")) {
                  V.next = 43;
                  break;
                }
                Toast("评论发表成功！", 2e3, "success");
                return V.abrupt("return", true);

               case 43:
                if (!A.errors) {
                  V.next = 47;
                  break;
                }
                T = formatErrorMessage(A.errors, "评论发表失败");
                Toast("提交失败: ".concat(T), 3e3, "error");
                return V.abrupt("return", false);

               case 47:
                V.next = 51;
                break;

               case 49:
                V.prev = 49;
                V.t0 = V["catch"](36);

               case 51:
                if (!(M.includes("error-field") || M.includes('class="error"') || M.includes('class="err"'))) {
                  V.next = 59;
                  break;
                }
                j = (new DOMParser).parseFromString(M, "text/html");
                B = j.querySelector(".error") || j.querySelector(".err") || j.querySelector(".message-error");
                I = B ? B.textContent.trim() : "评论提交失败，可能包含敏感词或触发了频率限制。";
                Toast(I, 3e3, "error");
                return V.abrupt("return", false);

               case 59:
                Toast("评论发表成功！", 2e3, "success");
                return V.abrupt("return", true);

               case 61:
                V.next = 65;
                break;

               case 63:
                Toast("提交失败: HTTP ".concat(L.status), 2e3, "error");
                return V.abrupt("return", false);

               case 65:
                V.next = 71;
                break;

               case 67:
                V.prev = 67;
                V.t1 = V["catch"](28);
                Toast("网络请求出错，请重试", 2e3, "error");
                return V.abrupt("return", false);

               case 71:
               case "end":
                return V.stop();
              }
            }
          }), _callee5, this, [ [ 28, 67 ], [ 36, 49 ] ]);
        })));
        function publishComment(o, a) {
          return r.apply(this, arguments);
        }
        return publishComment;
      }()
    } ]);
  }(Q);
  function MissavLoginProvider_typeof(r) {
    "@babel/helpers - typeof";
    return MissavLoginProvider_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, MissavLoginProvider_typeof(r);
  }
  function MissavLoginProvider_regeneratorRuntime() {
    "use strict";
    MissavLoginProvider_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == MissavLoginProvider_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(MissavLoginProvider_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function MissavLoginProvider_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function MissavLoginProvider_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          MissavLoginProvider_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          MissavLoginProvider_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function MissavLoginProvider_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function MissavLoginProvider_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, MissavLoginProvider_toPropertyKey(l.key), l);
    }
  }
  function MissavLoginProvider_createClass(r, o, a) {
    return o && MissavLoginProvider_defineProperties(r.prototype, o), a && MissavLoginProvider_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function MissavLoginProvider_toPropertyKey(r) {
    var o = MissavLoginProvider_toPrimitive(r, "string");
    return "symbol" == MissavLoginProvider_typeof(o) ? o : o + "";
  }
  function MissavLoginProvider_toPrimitive(r, o) {
    if ("object" != MissavLoginProvider_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != MissavLoginProvider_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  function MissavLoginProvider_callSuper(r, o, a) {
    return o = MissavLoginProvider_getPrototypeOf(o), MissavLoginProvider_possibleConstructorReturn(r, MissavLoginProvider_isNativeReflectConstruct() ? Reflect.construct(o, a || [], MissavLoginProvider_getPrototypeOf(r).constructor) : o.apply(r, a));
  }
  function MissavLoginProvider_possibleConstructorReturn(r, o) {
    if (o && ("object" == MissavLoginProvider_typeof(o) || "function" == typeof o)) {
      return o;
    }
    if (void 0 !== o) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return MissavLoginProvider_assertThisInitialized(r);
  }
  function MissavLoginProvider_assertThisInitialized(r) {
    if (void 0 === r) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return r;
  }
  function MissavLoginProvider_isNativeReflectConstruct() {
    try {
      var r = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {})));
    } catch (r) {}
    return (MissavLoginProvider_isNativeReflectConstruct = function _isNativeReflectConstruct() {
      return !!r;
    })();
  }
  function MissavLoginProvider_getPrototypeOf(r) {
    return MissavLoginProvider_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(r) {
      return r.__proto__ || Object.getPrototypeOf(r);
    }, MissavLoginProvider_getPrototypeOf(r);
  }
  function MissavLoginProvider_inherits(r, o) {
    if ("function" != typeof o && null !== o) {
      throw new TypeError("Super expression must either be null or a function");
    }
    r.prototype = Object.create(o && o.prototype, {
      "constructor": {
        "value": r,
        "writable": !0,
        "configurable": !0
      }
    }), Object.defineProperty(r, "prototype", {
      "writable": !1
    }), o && MissavLoginProvider_setPrototypeOf(r, o);
  }
  function MissavLoginProvider_setPrototypeOf(r, o) {
    return MissavLoginProvider_setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(r, o) {
      return r.__proto__ = o, r;
    }, MissavLoginProvider_setPrototypeOf(r, o);
  }
  function getCookie(r) {
    var o = "; ".concat(document.cookie);
    var a = o.split("; ".concat(r, "="));
    if (a.length === 2) {
      return decodeURIComponent(a.pop().split(";").shift());
    }
    return null;
  }
  var ee = function(r) {
    function MissavLoginProvider() {
      MissavLoginProvider_classCallCheck(this, MissavLoginProvider);
      return MissavLoginProvider_callSuper(this, MissavLoginProvider, [ {
        "siteKey": "MISSAV",
        "domains": getSiteDomains("MISSAV"),
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
      } ]);
    }
    MissavLoginProvider_inherits(MissavLoginProvider, r);
    return MissavLoginProvider_createClass(MissavLoginProvider, [ {
      "key": "login",
      "value": function() {
        var r = MissavLoginProvider_asyncToGenerator(MissavLoginProvider_regeneratorRuntime().mark((function _callee(r, o) {
          var a, l, u, p, v, b, y, C, k, _, E, S, P = arguments;
          return MissavLoginProvider_regeneratorRuntime().wrap((function _callee$(D) {
            while (1) {
              switch (D.prev = D.next) {
               case 0:
                a = P.length > 2 && P[2] !== void 0 ? P[2] : {};
                l = a.reload, u = l === void 0 ? true : l, p = a.silent, v = p === void 0 ? false : p;
                if (!(!r || !o)) {
                  D.next = 5;
                  break;
                }
                if (!v) {
                  Toast(__("login_accountNull") || "账号和密码不能为空", 2e3, "error");
                }
                return D.abrupt("return", false);

               case 5:
                D.prev = 5;
                b = getCookie("XSRF-TOKEN");
                y = this.getMissavOrigin();
                C = "".concat(y, "/api/login");
                k = {
                  "Content-Type": "application/json",
                  "Accept": "application/json, text/plain, */*"
                };
                if (b) {
                  k["x-xsrf-token"] = b;
                }
                D.next = 13;
                return this._request(C, {
                  "method": "POST",
                  "headers": k,
                  "body": JSON.stringify({
                    "email": r,
                    "password": o,
                    "remember": true
                  })
                });

               case 13:
                _ = D.sent;
                if (_.ok) {
                  D.next = 20;
                  break;
                }
                D.next = 17;
                return _.text();

               case 17:
                E = D.sent;
                if (!v) {
                  Toast("登录失败: ".concat(E), 2e3, "error");
                }
                throw new Error(__("login_networkFailed") || "网络请求失败");

               case 20:
                D.next = 22;
                return _.json();

               case 22:
                S = D.sent;
                if (!v) {
                  Toast(__("login_success") || "登录成功", 2e3, "success");
                }
                if (u) {
                  setTimeout((function() {
                    location.reload();
                  }), 1e3);
                }
                return D.abrupt("return", true);

               case 28:
                D.prev = 28;
                D.t0 = D["catch"](5);
                if (!v) {
                  Toast("错误发生: ".concat(D.t0.message), 2e3, "error");
                }
                return D.abrupt("return", false);

               case 32:
               case "end":
                return D.stop();
              }
            }
          }), _callee, this, [ [ 5, 28 ] ]);
        })));
        function login(o, a) {
          return r.apply(this, arguments);
        }
        return login;
      }()
    }, {
      "key": "getMissavOrigin",
      "value": function getMissavOrigin() {
        return this.getActiveDomain();
      }
    }, {
      "key": "redirectLogin",
      "value": function redirectLogin(r) {
        var o = this.getActiveDomain(r);
        var a = document.querySelector("button[x-on\\:click=\"currentPage = 'login'\"]") || document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
        if (a) {
          a.click();
          Toast("请在页面登录窗口中完成登录", 3e3, "info");
        } else {
          var l = "".concat(o, "/cn/login");
          if (typeof GM_openInTab === "function") {
            GM_openInTab(l, {
              "active": true,
              "insert": true,
              "setParent": true
            });
          } else {
            window.open(l, "_blank");
          }
        }
      }
    } ]);
  }(Q);
  function md5cycle(r, o) {
    var a = r[0], l = r[1], u = r[2], p = r[3];
    a = ff(a, l, u, p, o[0], 7, -680876936);
    p = ff(p, a, l, u, o[1], 12, -389564586);
    u = ff(u, p, a, l, o[2], 17, 606105819);
    l = ff(l, u, p, a, o[3], 22, -1044525330);
    a = ff(a, l, u, p, o[4], 7, -176418897);
    p = ff(p, a, l, u, o[5], 12, 1200080426);
    u = ff(u, p, a, l, o[6], 17, -1473231341);
    l = ff(l, u, p, a, o[7], 22, -45705983);
    a = ff(a, l, u, p, o[8], 7, 1770035416);
    p = ff(p, a, l, u, o[9], 12, -1958414417);
    u = ff(u, p, a, l, o[10], 17, -42063);
    l = ff(l, u, p, a, o[11], 22, -1990404162);
    a = ff(a, l, u, p, o[12], 7, 1804603682);
    p = ff(p, a, l, u, o[13], 12, -40341101);
    u = ff(u, p, a, l, o[14], 17, -1502002290);
    l = ff(l, u, p, a, o[15], 22, 1236535329);
    a = gg(a, l, u, p, o[1], 5, -165796510);
    p = gg(p, a, l, u, o[6], 9, -1069501632);
    u = gg(u, p, a, l, o[11], 14, 643717713);
    l = gg(l, u, p, a, o[0], 20, -373897302);
    a = gg(a, l, u, p, o[5], 5, -701558691);
    p = gg(p, a, l, u, o[10], 9, 38016083);
    u = gg(u, p, a, l, o[15], 14, -660478335);
    l = gg(l, u, p, a, o[4], 20, -405537848);
    a = gg(a, l, u, p, o[9], 5, 568446438);
    p = gg(p, a, l, u, o[14], 9, -1019803690);
    u = gg(u, p, a, l, o[3], 14, -187363961);
    l = gg(l, u, p, a, o[8], 20, 1163531501);
    a = gg(a, l, u, p, o[13], 5, -1444681467);
    p = gg(p, a, l, u, o[2], 9, -51403784);
    u = gg(u, p, a, l, o[7], 14, 1735328473);
    l = gg(l, u, p, a, o[12], 20, -1926607734);
    a = hh(a, l, u, p, o[5], 4, -378558);
    p = hh(p, a, l, u, o[8], 11, -2022574463);
    u = hh(u, p, a, l, o[11], 16, 1839030562);
    l = hh(l, u, p, a, o[14], 23, -35309556);
    a = hh(a, l, u, p, o[1], 4, -1530992060);
    p = hh(p, a, l, u, o[4], 11, 1272893353);
    u = hh(u, p, a, l, o[7], 16, -155497632);
    l = hh(l, u, p, a, o[10], 23, -1094730640);
    a = hh(a, l, u, p, o[13], 4, 681279174);
    p = hh(p, a, l, u, o[0], 11, -358537222);
    u = hh(u, p, a, l, o[3], 16, -722521979);
    l = hh(l, u, p, a, o[6], 23, 76029189);
    a = hh(a, l, u, p, o[9], 4, -640364487);
    p = hh(p, a, l, u, o[12], 11, -421815835);
    u = hh(u, p, a, l, o[15], 16, 530742520);
    l = hh(l, u, p, a, o[2], 23, -995338651);
    a = ii(a, l, u, p, o[0], 6, -198630844);
    p = ii(p, a, l, u, o[7], 10, 1126891415);
    u = ii(u, p, a, l, o[14], 15, -1416354905);
    l = ii(l, u, p, a, o[5], 21, -57434055);
    a = ii(a, l, u, p, o[12], 6, 1700485571);
    p = ii(p, a, l, u, o[3], 10, -1894986606);
    u = ii(u, p, a, l, o[10], 15, -1051523);
    l = ii(l, u, p, a, o[1], 21, -2054922799);
    a = ii(a, l, u, p, o[8], 6, 1873313359);
    p = ii(p, a, l, u, o[15], 10, -30611744);
    u = ii(u, p, a, l, o[6], 15, -1560198380);
    l = ii(l, u, p, a, o[13], 21, 1309151649);
    a = ii(a, l, u, p, o[4], 6, -145523070);
    p = ii(p, a, l, u, o[11], 10, -1120210379);
    u = ii(u, p, a, l, o[2], 15, 718787259);
    l = ii(l, u, p, a, o[9], 21, -343485551);
    r[0] = add32(a, r[0]);
    r[1] = add32(l, r[1]);
    r[2] = add32(u, r[2]);
    r[3] = add32(p, r[3]);
  }
  function cmn(r, o, a, l, u, p) {
    o = add32(add32(o, r), add32(l, p));
    return add32(o << u | o >>> 32 - u, a);
  }
  function ff(r, o, a, l, u, p, v) {
    return cmn(o & a | ~o & l, r, o, u, p, v);
  }
  function gg(r, o, a, l, u, p, v) {
    return cmn(o & l | a & ~l, r, o, u, p, v);
  }
  function hh(r, o, a, l, u, p, v) {
    return cmn(o ^ a ^ l, r, o, u, p, v);
  }
  function ii(r, o, a, l, u, p, v) {
    return cmn(a ^ (o | ~l), r, o, u, p, v);
  }
  function md5blk(r) {
    var o = [], a;
    for (a = 0; a < 64; a += 4) {
      o[a >> 2] = r.charCodeAt(a) + (r.charCodeAt(a + 1) << 8) + (r.charCodeAt(a + 2) << 16) + (r.charCodeAt(a + 3) << 24);
    }
    return o;
  }
  function md5str(r) {
    var o = r.length, a = [ 1732584193, -271733879, -1732584194, 271733878 ], l;
    for (l = 64; l <= o; l += 64) {
      md5cycle(a, md5blk(r.substring(l - 64, l)));
    }
    r = r.substring(l - 64);
    var u = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    for (l = 0; l < r.length; l++) {
      u[l >> 2] |= r.charCodeAt(l) << (l % 4 << 3);
    }
    u[l >> 2] |= 128 << (l % 4 << 3);
    if (l > 55) {
      md5cycle(a, u);
      for (l = 0; l < 16; l++) {
        u[l] = 0;
      }
    }
    u[14] = o * 8;
    md5cycle(a, u);
    return a;
  }
  var te = "0123456789abcdef".split("");
  function rhex(r) {
    var o = "", a = 0;
    for (;a < 4; a++) {
      o += te[r >> a * 8 + 4 & 15] + te[r >> a * 8 & 15];
    }
    return o;
  }
  function add32(r, o) {
    return r + o & 4294967295;
  }
  function md5(r) {
    if (typeof r !== "string") {
      return "";
    }
    r = unescape(encodeURIComponent(r));
    var o = md5str(r);
    return rhex(o[0]) + rhex(o[1]) + rhex(o[2]) + rhex(o[3]);
  }
  function CommentScraper_typeof(r) {
    "@babel/helpers - typeof";
    return CommentScraper_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, CommentScraper_typeof(r);
  }
  function CommentScraper_regeneratorRuntime() {
    "use strict";
    CommentScraper_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == CommentScraper_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(CommentScraper_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function CommentScraper_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function CommentScraper_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          CommentScraper_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          CommentScraper_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function _slicedToArray(r, o) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, o) || CommentScraper_unsupportedIterableToArray(r, o) || _nonIterableRest();
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _iterableToArrayLimit(r, o) {
    var a = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != a) {
      var l, u, p, v, b = [], y = !0, C = !1;
      try {
        if (p = (a = a.call(r)).next, 0 === o) {
          if (Object(a) !== a) {
            return;
          }
          y = !1;
        } else {
          for (;!(y = (l = p.call(a)).done) && (b.push(l.value), b.length !== o); y = !0) {}
        }
      } catch (r) {
        C = !0, u = r;
      } finally {
        try {
          if (!y && null != a["return"] && (v = a["return"](), Object(v) !== v)) {
            return;
          }
        } finally {
          if (C) {
            throw u;
          }
        }
      }
      return b;
    }
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) {
      return r;
    }
  }
  function CommentScraper_toConsumableArray(r) {
    return CommentScraper_arrayWithoutHoles(r) || CommentScraper_iterableToArray(r) || CommentScraper_unsupportedIterableToArray(r) || CommentScraper_nonIterableSpread();
  }
  function CommentScraper_nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function CommentScraper_iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function CommentScraper_arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return CommentScraper_arrayLikeToArray(r);
    }
  }
  function CommentScraper_createForOfIteratorHelper(r, o) {
    var a = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!a) {
      if (Array.isArray(r) || (a = CommentScraper_unsupportedIterableToArray(r)) || o && r && "number" == typeof r.length) {
        a && (r = a);
        var l = 0, u = function F() {};
        return {
          "s": u,
          "n": function n() {
            return l >= r.length ? {
              "done": !0
            } : {
              "done": !1,
              "value": r[l++]
            };
          },
          "e": function e(r) {
            throw r;
          },
          "f": u
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var p, v = !0, b = !1;
    return {
      "s": function s() {
        a = a.call(r);
      },
      "n": function n() {
        var r = a.next();
        return v = r.done, r;
      },
      "e": function e(r) {
        b = !0, p = r;
      },
      "f": function f() {
        try {
          v || null == a["return"] || a["return"]();
        } finally {
          if (b) {
            throw p;
          }
        }
      }
    };
  }
  function CommentScraper_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return CommentScraper_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? CommentScraper_arrayLikeToArray(r, o) : void 0;
    }
  }
  function CommentScraper_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function CommentScraper_ownKeys(r, o) {
    var a = Object.keys(r);
    if (Object.getOwnPropertySymbols) {
      var l = Object.getOwnPropertySymbols(r);
      o && (l = l.filter((function(o) {
        return Object.getOwnPropertyDescriptor(r, o).enumerable;
      }))), a.push.apply(a, l);
    }
    return a;
  }
  function CommentScraper_objectSpread(r) {
    for (var o = 1; o < arguments.length; o++) {
      var a = null != arguments[o] ? arguments[o] : {};
      o % 2 ? CommentScraper_ownKeys(Object(a), !0).forEach((function(o) {
        CommentScraper_defineProperty(r, o, a[o]);
      })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(a)) : CommentScraper_ownKeys(Object(a)).forEach((function(o) {
        Object.defineProperty(r, o, Object.getOwnPropertyDescriptor(a, o));
      }));
    }
    return r;
  }
  function CommentScraper_defineProperty(r, o, a) {
    return (o = CommentScraper_toPropertyKey(o)) in r ? Object.defineProperty(r, o, {
      "value": a,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : r[o] = a, r;
  }
  function CommentScraper_toPropertyKey(r) {
    var o = CommentScraper_toPrimitive(r, "string");
    return "symbol" == CommentScraper_typeof(o) ? o : o + "";
  }
  function CommentScraper_toPrimitive(r, o) {
    if ("object" != CommentScraper_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != CommentScraper_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var ne = getSiteUrls("JABLE");
  var re = getSiteUrls("JAVLIBRARY");
  var oe = getSiteUrls("JAVDB");
  var ae = {
    "FILTER": {
      "NAME_INITIAL_EXCLUSIONS": new Set([ "ok", "good", "nice", "love", "best", "cool", "hot", "av", "vip", "lol", "wow", "omg", "no", "yes", "hi", "like", "sexy", "god", "star", "new", "old", "top", "pro", "fun", "bad", "hub", "tv" ]),
      "JABLE_EMOJI_REGEX": /:[a-zA-Z]{2,15}:/,
      "UNICODE_EMOJI_REGEX": /(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9\uDEF0-\uDEF8])/,
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
  var ie = function esc(r) {
    var o = document.createElement("div");
    o.textContent = r;
    return o.innerHTML;
  };
  function fetchJableComments(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    if (a >= ne.length) {
      return Promise.reject(new Error("All Jable domains failed"));
    }
    var l = ne[a];
    var u = r.toLowerCase().trim();
    var p = "".concat(l, "/videos/").concat(u, "/?mode=async&function=get_block&block_id=video_comments_video_comments&sort_by=&from=").concat(o, "&ipp=10&_=").concat(Date.now());
    U.log("[CommentScraper] 开始采集 Jable 评论，番号: ".concat(u, ", 页码: ").concat(o, ", 域名: ").concat(l));
    var v = function tryNext(u) {
      if (a < ne.length - 1) {
        U.log("[CommentScraper] Jable 域名 ".concat(l, " 获取评论失败: ").concat(u ? u.message : "空响应", "，正在尝试备用域名..."));
        return fetchJableComments(r, o, a + 1);
      } else {
        return Promise.reject(u || new Error("All Jable domains failed"));
      }
    };
    var b = new URL(p);
    var y = window.location.hostname.includes(b.hostname);
    if (y || typeof GM_xmlhttpRequest === "undefined") {
      var C = p.replace(b.origin, window.location.origin);
      var k = typeof unsafeWindow !== "undefined" && unsafeWindow.fetch ? unsafeWindow.fetch.bind(unsafeWindow) : fetch;
      return k(C, {
        "headers": {
          "accept": "*/*",
          "x-requested-with": "XMLHttpRequest"
        }
      }).then((function(r) {
        if (r.status === 404) {
          var o = new Error("HTTP 404");
          o.status = 404;
          throw o;
        }
        if (!r.ok) {
          throw new Error("HTTP ".concat(r.status));
        }
        return r.text();
      })).then((function(r) {
        if (!r || r.trim() === "") {
          throw new Error("响应数据为空 (可能遭受到跨域阻止或隐私插件拦截)");
        }
        var o = parseCommentsHtml(r, l);
        U.log("[CommentScraper] 成功采集到 Jable 评论，共 ".concat(o.comments.length, " 条 (总数: ").concat(o.totalCount, ")"));
        return CommentScraper_objectSpread(CommentScraper_objectSpread({}, o), {}, {
          "domain": l
        });
      }))["catch"]((function(r) {
        if (r.status === 404 || r.message && r.message.includes("404")) {
          return Promise.reject(r);
        }
        if (r.message === "触发人机验证") {
          return Promise.reject(r);
        }
        return v(r);
      }));
    }
    return new Promise((function(r, o) {
      U.log("[CommentScraper] 开始通过 GM_xmlhttpRequest 发起跨域请求: ".concat(p));
      var a = false;
      var u = function safeResolve(o) {
        if (!a) {
          a = true;
          clearTimeout(y);
          r(o);
        }
      };
      var b = function safeReject(r) {
        if (!a) {
          a = true;
          clearTimeout(y);
          o(r);
        }
      };
      var y = setTimeout((function() {
        if (!a) {
          U.warn("[CommentScraper] Jable 采集超时 (已达到 6000ms 限制，手动中止): ".concat(p));
          if (C && typeof C.abort === "function") {
            try {
              C.abort();
            } catch (r) {}
          }
          v(new Error("请求超时")).then(u)["catch"](b);
        }
      }), 6e3);
      var C = GM_xmlhttpRequest({
        "method": "GET",
        "url": p,
        "timeout": 6e3,
        "headers": {
          "accept": "*/*",
          "x-requested-with": "XMLHttpRequest",
          "referer": "".concat(l, "/"),
          "origin": l
        },
        "withCredentials": true,
        "onload": function onload(r) {
          if (a) {
            return;
          }
          U.log("[CommentScraper] GM_xmlhttpRequest 响应状态码: ".concat(r.status));
          if (r.status === 403 || r.status === 503) {
            var o = new Error("触发人机验证");
            o.status = 403;
            o.domain = l;
            b(o);
            return;
          }
          if (r.status === 404) {
            var p = new Error("HTTP 404");
            p.status = 404;
            b(p);
            return;
          }
          if (r.status >= 200 && r.status < 300) {
            var y = r.responseText;
            if (!y || y.trim() === "") {
              U.error("[CommentScraper] 收到空响应数据，可能被脚本管理器或 Safari 权限拦截。");
              v(new Error("响应为空")).then(u)["catch"](b);
              return;
            }
            try {
              var C = parseCommentsHtml(y, l);
              U.log("[CommentScraper] 成功采集到 Jable 评论，共 ".concat(C.comments.length, " 条 (总数: ").concat(C.totalCount, ")"));
              u(CommentScraper_objectSpread(CommentScraper_objectSpread({}, C), {}, {
                "domain": l
              }));
            } catch (r) {
              if (r.message === "触发人机验证") {
                b(r);
              } else {
                U.error("[CommentScraper] 解析 HTML 时出错:", r);
                v(r).then(u)["catch"](b);
              }
            }
          } else {
            U.error("[CommentScraper] 请求失败，HTTP 状态码: ".concat(r.status), r);
            v(new Error("HTTP ".concat(r.status))).then(u)["catch"](b);
          }
        },
        "onerror": function onerror(r) {
          if (a) {
            return;
          }
          U.error("[CommentScraper] GM_xmlhttpRequest onerror 触发:", r);
          v(new Error("跨域请求网络出错")).then(u)["catch"](b);
        },
        "ontimeout": function ontimeout() {
          if (a) {
            return;
          }
          U.warn("[CommentScraper] GM_xmlhttpRequest 请求超时");
          v(new Error("请求超时")).then(u)["catch"](b);
        }
      });
    }));
  }
  function parseCommentsHtml(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : ne[0];
    if (r.includes("cf-challenge") || r.includes("Turnstile") || r.includes("Checking your browser") || r.includes("cloudflare")) {
      var a = new Error("触发人机验证");
      a.status = 403;
      a.domain = o;
      throw a;
    }
    var l = (new DOMParser).parseFromString(r, "text/html");
    var u = [];
    var p = 0;
    var v = l.querySelector(".comments") || l.querySelector(".comment-list") || l.querySelector("#video_comments_video_comments");
    if (!v) {
      throw new Error("未能获取有效的评论数据 (可能因 Safari 跨域权限拦截，请在浏览器中直接打开并验证 ".concat(new URL(o).hostname, ")"));
    }
    var b = l.querySelector("h6.sub-title");
    if (b) {
      var y = b.textContent.match(/\((\d+)\)/);
      if (y) {
        p = parseInt(y[1], 10);
      }
    }
    var C = r.includes("載入更多") || r.includes("载入更多");
    l.querySelectorAll("div.item[data-comment-id]").forEach((function(r) {
      var a = r.getAttribute("data-comment-id") || "";
      var l = r.querySelector(".title .pr-2 a");
      var p = l ? l.textContent.trim() : r.querySelector(".title .pr-2") ? r.querySelector(".title .pr-2").textContent.trim() : "Anonymous";
      var v = l ? l.getAttribute("href") : "";
      if (v && v.startsWith("/")) {
        v = "".concat(o).concat(v);
      }
      var b = r.querySelector(".title .inactive-color");
      var y = b ? b.textContent.trim() : "";
      var C = r.querySelector(".comment-text .original-text");
      var k = "", _ = false;
      if (C) {
        var E = C.cloneNode(true);
        E.querySelectorAll("img").forEach((function(r) {
          return r.replaceWith(r.getAttribute("alt") || "");
        }));
        k = E.textContent.trim();
      } else {
        var S = r.querySelector(".comment-text .inactive-color");
        if (S && S.textContent.includes("審核")) {
          _ = true;
          k = S.textContent.trim();
        }
      }
      if (k || p !== "Anonymous") {
        u.push({
          "id": a,
          "user": p,
          "userUrl": v,
          "time": y,
          "text": k,
          "isPending": _,
          "site": "jable"
        });
      }
    }));
    if (u.length >= 10) {
      C = true;
    }
    return {
      "comments": u,
      "totalCount": p,
      "hasMore": C
    };
  }
  function normalizeText(r) {
    if (!r) {
      return "";
    }
    var o = r;
    o = o.replace(/[\uFF01-\uFF5E]/g, (function(r) {
      return String.fromCharCode(r.charCodeAt(0) - 65248);
    }));
    o = o.replace(/\u3000/g, " ").replace(/：/g, ":").replace(/。/g, ".").replace(/，/g, ",").replace(/～/g, "~").replace(/ー/g, "-").replace(/－/g, "-").replace(/(\d|分钟|分鐘|小时|小時|秒钟|秒鐘|[分秒时時hmsmHMS])\s*(?:到|至)\s*(\d)/gi, "$1~$2");
    o = o.replace(/:[a-zA-Z]{2,15}:/g, "");
    o = o.replace(/(\d+)\s*分\s*([-~～到])\s*(\d+)/g, "$1$2$3");
    o = o.replace(/(\d+)\s*秒\s*([-~～到])\s*(\d+)/g, "$1$2$3");
    o = o.replace(/(\d+)\s*:\s*(?=\d)/g, "$1:");
    o = o.replace(/(\d+)\s*\.\s*(?=\d)/g, "$1.");
    return o;
  }
  function stripEmojis(r) {
    return r.replace(/:[a-zA-Z]{2,15}:/g, "");
  }
  var se = "[張张趙赵陳陈廖郭邱翁蕭萧馮冯鄧邓呂吕吳吴宋罗羅彭劉刘蔣蒋柯隋詹潘賴赖卓崔薛]";
  var le = /(?:高中|中學|中学|大學(?!習|习)|大学(?!习|擺)|一中|國中|国中|高工|高商|商工|二信|清大|台大|世新|附中|大足一中|大足第一中学|神岡高工|大明高中|吉安國中|靜宜大學|珊瑚高中|南港高中|建國中學|文華高中|明道高中|二信中學|慧燈中學|道明中學|新竹高商|成功高中)/i;
  var ce = /(?:不要?(?:再|在)?\s*(?:自己)?\s*尻|不要?(?:再|在)?\s*(?:自己)?\s*打(?:手槍|手枪|飛機|飞机)|別(?:再|在)?\s*(?:自己)?\s*(?:尻|打|撸|擼)|别(?:再|在)?\s*(?:自己)?\s*(?:尻|打|撸|擼)|唔好(?:再|在)?\s*(?:自己)?\s*(?:打飛機|J|尻|擼|撸)|咪撚\s*(?:自己)?\s*(?:打飛機|J|尻|擼|撸)|不要一直\s*(?:自己)?\s*尻|不要一直\s*(?:自己)?\s*打(?:手槍|手枪|飛機|飞机)|别一直\s*(?:自己)?\s*尻|别在尻|别在打|别在尻|别再打了|別再打了|别打了|別打了|別擼了|别撸了|別J了|别J了|别打飞机|別打飛機|別打手槍|别打手枪|玩手槍|玩手枪|實名(?:開導|觀看|推薦|观看|开导|推荐)|实名(?:开导|观看|推荐)|又射了|縱慾過度|纵欲过度|著返條褲|別在射精|别在射精|别射精|別射精|別打手槍|别打手枪|會破皮|会破皮|别冲了|別衝了|别冲|別衝)/i;
  var ue = /^(?:的(?:女神|女友|女朋友|男友|男朋友|时候|時候|回忆|回憶|时代|時代|样子|樣子|日子|故事|剧情|劇情|感觉|感覺|妹子|女孩|女生|男生|学妹|學妹|学姐|學姐|美女|老师|老師|同学|同學)|生|JK|jk|制服|校校服|学生|學生|女优|女優|演员|演員|少女|美少女|辣妹|熟女|人妻)/i;
  var de = new RegExp("(?:".concat(se, "[\\u4e00-\\u9fa5]{1,2})(?:[我你他她]|同學|同学|同事|老師|老师|醫生|医生|老闆|老板|只有|说明|是|有|沒|没|在|別|别|不|好|快|整天|到此|生日|畢業|毕业|求求|這|气|那|大|小|長|长|屁股|逆天|牛逼|牛b|神人|實名|实名|太神|太牛|就|被|也|跟|說|说|講|讲|超|愛|爱|想|本|人|雞|鸡|的|都|要|去|戴|拿|看|打|尻|撸|擼|射|叫|做|操|肏|草|干|幹|一定|真的|早就|一直|天天|已|给|給|和|与|與|同|学|學|唱|跳|写|寫|读|讀|听|聽|走|跑|吃|喝|玩|笑|哭|买|買|卖|賣|住|用|到|来|來)"), "i");
  var me = new RegExp("(?:不如|比|像|叫|是)\\s*(?:[\\u4e00-\\u9fa5]{1,4}\\s*)?(?:".concat(se, "[\\u4e00-\\u9fa5]{1,2})"), "i");
  var pe = [ {
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
  var he = [ {
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
    "regex": new RegExp("我(?:是|叫)\\s*(?:" + se + "[\\u4e00-\\u9fa5]{1,2})", "i"),
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
    "regex": new RegExp("(?:和|跟|長得像|长得像|長得好像|长得好像|好像|很像)(?:".concat(se, "[\\u4e00-\\u9fa5]{1,2})(?:好像|很像|$|\\s)"), "i"),
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
  var fe = [ {
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
  var ve = [ {
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
    "regex": new RegExp("(?:骚货|骚屄|骚逼|婊子|賤人|贱人|臭甲|垃圾)(?:".concat(se, "[\\u4e00-\\u9fa5]{1,2})"), "i"),
    "reason": "辱骂词后跟人名"
  } ];
  var ge = /想(?:这样|這麼|这么|那樣|那样)?(?:干|肏|操|日|弄|草|幹)\s*([a-zA-Z\\u4e00-\\u9fa5]{2,4})/i;
  var be = new RegExp("(".concat(se, "[\\u4e00-\\u9fa5]{1,2})好[骚騷]啊"), "i");
  var ye = [ {
    "regex": /(?:卡(?:的要死|死了|极了|爆了|的不行|得一比|的一比|了|得)|点解咁卡|怎么(?:那么|這麼|这么|這么)?卡)/i,
    "reason": "网站卡顿疑问"
  } ];
  var Ce = [ {
    "regex": /(?:^|[^a-zA-Z0-9])(?:xo|xoxo)\s*(?:你(?:妈|媽|马)死了|是不是|老母|全家|你老味)/i,
    "reason": "评论区XO骂战"
  }, {
    "regex": /(?:禁言|臭嘴|家[裡里]失火)\s*(?:xo|xoxo)/i,
    "reason": "评论区XO撕逼"
  }, {
    "regex": /(?:割了鸡吧|怨天尤人|抢奸|xo(?:母亲|老母|媽|妈))/i,
    "reason": "评论区XO低质骂街"
  } ];
  function classifyComment(r) {
    if (!r || r.trim() === "") {
      return {
        "label": "SPAM",
        "category": "LOW_QUALITY",
        "reason": "空评论"
      };
    }
    var o = normalizeText(r);
    var a = stripEmojis(o);
    var l = a.replace(/\s+/g, "");
    var u = l.replace(/(?:[\t-\r -\/:-@\[-`\{-~\xA0-\xA9\xAB\xAC\xAE-\xB1\xB4\xB6-\xB8\xBB\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u037E\u0384\u0385\u0387\u03F6\u0482\u055A-\u055F\u0589\u058A\u058D-\u058F\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0606-\u060F\u061B\u061D-\u061F\u066A-\u066D\u06D4\u06DE\u06E9\u06FD\u06FE\u0700-\u070D\u07F6-\u07F9\u07FE\u07FF\u0830-\u083E\u085E\u0888\u0964\u0965\u0970\u09F2\u09F3\u09FA\u09FB\u09FD\u0A76\u0AF0\u0AF1\u0B70\u0BF3-\u0BFA\u0C77\u0C7F\u0C84\u0D4F\u0D79\u0DF4\u0E3F\u0E4F\u0E5A\u0E5B\u0F01-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F85\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE-\u0FDA\u104A-\u104F\u109E\u109F\u10FB\u1360-\u1368\u1390-\u1399\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DB\u1800-\u180A\u1940\u1944\u1945\u19DE-\u19FF\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2000-\u200A\u2010-\u2029\u202F-\u205F\u207A-\u207E\u208A-\u208E\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2775\u2794-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E5D\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u303F\u309B\u309C\u30A0\u30FB\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAA77-\uAA79\uAADE\uAADF\uAAF0\uAAF1\uAB5B\uAB6A\uAB6B\uABEB\uFB29\uFBB2-\uFBC2\uFD3E-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD00-\uDD02\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDC77\uDC78\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEC8\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDD8E\uDD8F\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3F]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFD5-\uDFF1\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3F\uDF44\uDF45]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F[\uDC9C\uDC9F]|\uD833[\uDC00-\uDCEF\uDD00-\uDEB3\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE8B]|\uD838[\uDD4F\uDEFF]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF])+/g, "");
    var p = /[\u4e00-\u9fa5]/.test(l);
    var v = CommentScraper_createForOfIteratorHelper(pe), b;
    try {
      for (v.s(); !(b = v.n()).done; ) {
        var y = b.value;
        if (y.regex.test(o)) {
          return {
            "label": "SPAM",
            "category": "COPYPASTA",
            "reason": y.reason
          };
        }
      }
    } catch (r) {
      v.e(r);
    } finally {
      v.f();
    }
    var C = le.exec(o);
    if (C) {
      var k = o.slice(C.index + C[0].length, C.index + C[0].length + 6);
      if (!ue.test(k)) {
        return {
          "label": "SPAM",
          "category": "FRIEND_TAG_MEME",
          "reason": "提及学校/班级背景"
        };
      }
    }
    if (ce.test(o)) {
      return {
        "label": "SPAM",
        "category": "FRIEND_TAG_MEME",
        "reason": "劝人别开导/打手枪梗"
      };
    }
    if (/[\u3105-\u312F\u02CA\u02CB\u02C7\u02C9]/.test(o)) {
      return {
        "label": "SPAM",
        "category": "FRIEND_TAG_MEME",
        "reason": "包含台湾注音（拼音圈人）"
      };
    }
    var _ = de.exec(u);
    if (_) {
      var E = _[0];
      if (/^(?:马上|馬上|林北|陈述|陳述|余下|于是|方便|方面|方向|方法|古代|古老|高潮|高中|高兴|高興|周围|周圍|周末|施工|施展|程度|程序|胡说|胡說|胡闹|胡鬧|朱红|朱紅|何必|何况|何況|洪水|曹操|温柔|溫柔|唐突|许多|許多|沈默|江湖|王八|李子|杨柳|楊柳|徐徐|魏然|龚自|顏色|颜色|严格|嚴格|康复|康復|阮囊|褚色|简单|簡單|游泳|学妹|学姐|学弟|学长|學妹|學姐|學弟|學長|女生|女人|旅馆|旅館|失禁|馆开)/i.test(E)) {} else {
        return {
          "label": "SPAM",
          "category": "FRIEND_TAG_MEME",
          "reason": "针对同学的动作喊话"
        };
      }
    }
    if (me.test(o)) {
      return {
        "label": "SPAM",
        "category": "FRIEND_TAG_MEME",
        "reason": "与同学名字进行对比"
      };
    }
    var S = CommentScraper_createForOfIteratorHelper(he), P;
    try {
      for (S.s(); !(P = S.n()).done; ) {
        var D = P.value;
        if (D.regex.test(o)) {
          return {
            "label": "SPAM",
            "category": "FRIEND_TAG_MEME",
            "reason": D.reason
          };
        }
      }
    } catch (r) {
      S.e(r);
    } finally {
      S.f();
    }
    var L = CommentScraper_createForOfIteratorHelper(fe), M;
    try {
      for (L.s(); !(M = L.n()).done; ) {
        var A = M.value;
        if (A.regex.test(o)) {
          return {
            "label": "SPAM",
            "category": "AD_CONTACT",
            "reason": A.reason
          };
        }
      }
    } catch (r) {
      L.e(r);
    } finally {
      L.f();
    }
    var T = CommentScraper_createForOfIteratorHelper(ve), j;
    try {
      for (T.s(); !(j = T.n()).done; ) {
        var B = j.value;
        if (B.regex.test(o)) {
          return {
            "label": "SPAM",
            "category": "HARASSMENT_DOXXING",
            "reason": B.reason
          };
        }
      }
    } catch (r) {
      T.e(r);
    } finally {
      T.f();
    }
    var I = [ "女优", "女優", "女主", "他", "她", "它", "老婆", "闺蜜", "閨蜜", "妹妹", "女人", "人", "别人", "別人", "角色", "演员", "演員", "身材", "皮肤", "皮膚", "美腿", "丝袜", "絲襪", "衣服", "屁股", "大屁股", "逼", "穴", "闺密", "閨密", "妹妹", "姐姐", "前女友", "前妻" ];
    var V = ge.exec(o);
    if (V) {
      var O = V[1].trim();
      if (!I.includes(O.toLowerCase())) {
        return {
          "label": "SPAM",
          "category": "HARASSMENT_DOXXING",
          "reason": "针对特定个人的侵害性想法: ".concat(O)
        };
      }
    }
    var R = be.exec(o);
    if (R) {
      return {
        "label": "SPAM",
        "category": "HARASSMENT_DOXXING",
        "reason": '针对同学人身的性调侃: "'.concat(R[1], '好骚啊"')
      };
    }
    var H = CommentScraper_createForOfIteratorHelper(ye), G;
    try {
      for (H.s(); !(G = H.n()).done; ) {
        var z = G.value;
        if (z.regex.test(o)) {
          return {
            "label": "SPAM",
            "category": "TECHNICAL_NOISE",
            "reason": z.reason
          };
        }
      }
    } catch (r) {
      H.e(r);
    } finally {
      H.f();
    }
    var N = ae.FILTER.JABLE_EMOJI_REGEX.test(r);
    var J = ae.FILTER.UNICODE_EMOJI_REGEX.test(r);
    var q = N || J;
    var U = /(?:\d{1,3}):(?:\d{2})/.test(o);
    if (!U && !q) {
      if (l.length === 0) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "纯空格/表情符号"
        };
      }
      if (/^(?:[\t-\r -\/:-@\[-`\{-~\xA0-\xA9\xAB\xAC\xAE-\xB1\xB4\xB6-\xB8\xBB\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u037E\u0384\u0385\u0387\u03F6\u0482\u055A-\u055F\u0589\u058A\u058D-\u058F\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0606-\u060F\u061B\u061D-\u061F\u066A-\u066D\u06D4\u06DE\u06E9\u06FD\u06FE\u0700-\u070D\u07F6-\u07F9\u07FE\u07FF\u0830-\u083E\u085E\u0888\u0964\u0965\u0970\u09F2\u09F3\u09FA\u09FB\u09FD\u0A76\u0AF0\u0AF1\u0B70\u0BF3-\u0BFA\u0C77\u0C7F\u0C84\u0D4F\u0D79\u0DF4\u0E3F\u0E4F\u0E5A\u0E5B\u0F01-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F85\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE-\u0FDA\u104A-\u104F\u109E\u109F\u10FB\u1360-\u1368\u1390-\u1399\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DB\u1800-\u180A\u1940\u1944\u1945\u19DE-\u19FF\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2000-\u200A\u2010-\u2029\u202F-\u205F\u207A-\u207E\u208A-\u208E\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2775\u2794-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E5D\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u303F\u309B\u309C\u30A0\u30FB\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAA77-\uAA79\uAADE\uAADF\uAAF0\uAAF1\uAB5B\uAB6A\uAB6B\uABEB\uFB29\uFBB2-\uFBC2\uFD3E-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD00-\uDD02\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDC77\uDC78\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEC8\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDD8E\uDD8F\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3F]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFD5-\uDFF1\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3F\uDF44\uDF45]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F[\uDC9C\uDC9F]|\uD833[\uDC00-\uDCEF\uDD00-\uDEB3\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE8B]|\uD838[\uDD4F\uDEFF]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF])+$/.test(l)) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "仅包含标点/特殊符号"
        };
      }
      if (/^\d+$/.test(l)) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "纯数字无内容"
        };
      }
      if (l.length <= 4 && !p) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "过短的非中文无意义字符"
        };
      }
      if (/^(.)\1+$/.test(l) && !p) {
        return {
          "label": "SPAM",
          "category": "LOW_QUALITY",
          "reason": "单一字符复读/刷屏"
        };
      }
    }
    var W = CommentScraper_createForOfIteratorHelper(Ce), Y;
    try {
      for (W.s(); !(Y = W.n()).done; ) {
        var K = Y.value;
        if (K.regex.test(o)) {
          return {
            "label": "SPAM",
            "category": "LOW_QUALITY",
            "reason": K.reason
          };
        }
      }
    } catch (r) {
      W.e(r);
    } finally {
      W.f();
    }
    return {
      "label": "HAM",
      "category": null,
      "reason": null
    };
  }
  function maskBlacklist(r) {
    var o = r;
    var a = [ {
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
    for (var l = 0, u = a; l < u.length; l++) {
      var p = u[l];
      o = o.replace(p.regex, p.placeholder);
    }
    return o;
  }
  function parseTwoPartTime(r, o) {
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    var l = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 3;
    var u = parseInt(o, 10);
    if (a && o.length === 1) {
      u *= 10;
    }
    var p = Math.abs(r);
    if (p > l) {
      return p * 60 + u;
    } else {
      return p * 3600 + u * 60;
    }
  }
  function extractCandidates(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3;
    var a = [];
    var l = /(?<!\d)(-?\d{1,3}):(\d{2})(?::(\d{2}))?(?!\d)/g;
    var u;
    while ((u = l.exec(r)) !== null) {
      var p = u[0];
      var v = p.startsWith("-");
      var b = [ parseInt(u[1], 10), parseInt(u[2], 10), u[3] ? parseInt(u[3], 10) : null ];
      if (b[1] >= 60 || b[2] !== null && b[2] >= 60) {
        continue;
      }
      var y = 0;
      var C = b.map((function(r) {
        return r !== null ? Math.abs(r) : null;
      }));
      if (C[2] !== null) {
        y = C[0] * 3600 + C[1] * 60 + C[2];
      } else if (v) {
        y = C[0] * 60 + C[1];
      } else {
        y = parseTwoPartTime(C[0], u[2], false, o);
      }
      a.push({
        "raw": p,
        "index": u.index,
        "end": u.index + p.length,
        "level": "L1",
        "seconds": v ? -y : y,
        "isNegative": v
      });
    }
    var k = /(?<!\d)(-?\d{1,3})\.(\d{1,2})(?:\.(\d{1,2}))?(?!\d)/g;
    while ((u = k.exec(r)) !== null) {
      var _ = u[0];
      var E = _.startsWith("-");
      var S = [ parseInt(u[1], 10), u[2], u[3] ? parseInt(u[3], 10) : null ];
      var P = parseInt(S[1], 10);
      if (P >= 60 || S[2] !== null && S[2] >= 60) {
        continue;
      }
      var D = 0;
      var L = Math.abs(S[0]);
      if (S[2] !== null) {
        D = L * 3600 + parseInt(S[1], 10) * 60 + S[2];
      } else if (E) {
        var M = parseInt(S[1], 10);
        if (S[1].length === 1) {
          M *= 10;
        }
        D = L * 60 + M;
      } else {
        D = parseTwoPartTime(L, S[1], true, o);
      }
      a.push({
        "raw": _,
        "index": u.index,
        "end": u.index + _.length,
        "level": "L2",
        "seconds": E ? -D : D,
        "isNegative": E
      });
    }
    var A = /(?<!\d)(\d{1,2})\s*(?:小时|h|H)\s*(\d{1,2})\s*(?:分钟|分鐘|分|m|M)\s*(\d{1,2})\s*(?:秒钟|秒鐘|秒|s|S)(?!\d)/g;
    while ((u = A.exec(r)) !== null) {
      var T = u[0];
      a.push({
        "raw": T,
        "index": u.index,
        "end": u.index + T.length,
        "level": "L3",
        "seconds": parseInt(u[1], 10) * 3600 + parseInt(u[2], 10) * 60 + parseInt(u[3], 10),
        "isNegative": false
      });
    }
    var j = /(?<!\d)(\d{1,2})\s*(?:小时|h|H)\s*(\d{1,2})\s*(?:分钟|分鐘|分|m|M)(?!\d)/g;
    while ((u = j.exec(r)) !== null) {
      var B = u[0];
      a.push({
        "raw": B,
        "index": u.index,
        "end": u.index + B.length,
        "level": "L3",
        "seconds": parseInt(u[1], 10) * 3600 + parseInt(u[2], 10) * 60,
        "isNegative": false
      });
    }
    var I = /(?<!\d)(\d{1,3})\s*(?:分钟|分鐘|分)\s*(\d{1,2})\s*(?:秒钟|秒鐘|秒)(?!\d)/g;
    while ((u = I.exec(r)) !== null) {
      var V = u[0];
      a.push({
        "raw": V,
        "index": u.index,
        "end": u.index + V.length,
        "level": "L3",
        "seconds": parseInt(u[1], 10) * 60 + parseInt(u[2], 10),
        "isNegative": false
      });
    }
    var O = /(?<!\d)(\d{1,3})\s*(?:分钟|分鐘|分)(?!\d)/g;
    while ((u = O.exec(r)) !== null) {
      var R = u[0];
      a.push({
        "raw": R,
        "index": u.index,
        "end": u.index + R.length,
        "level": "L3",
        "seconds": parseInt(u[1], 10) * 60,
        "isNegative": false
      });
    }
    var H = /(?<!\d)(\d{1,2})\s*(?:秒钟|秒鐘|秒)(?!\d)/g;
    while ((u = H.exec(r)) !== null) {
      var G = u[0];
      a.push({
        "raw": G,
        "index": u.index,
        "end": u.index + G.length,
        "level": "L3",
        "seconds": parseInt(u[1], 10),
        "isNegative": false
      });
    }
    var z = /(?<!\d)(\d{1,3})(?:\s*\/\s*(\d{1,3}))+(?!\d)/g;
    while ((u = z.exec(r)) !== null) {
      var N = u[0];
      var J = N.split("/").map((function(r) {
        return parseInt(r.trim(), 10);
      }));
      a.push({
        "raw": N,
        "index": u.index,
        "end": u.index + N.length,
        "level": "L5",
        "seconds": J.map((function(r) {
          return r * 60;
        })),
        "isSlashList": true
      });
    }
    var q = /(?<!\d)\b(\d{1,3})\b(?!\d)/g;
    while ((u = q.exec(r)) !== null) {
      var U = u[0];
      a.push({
        "raw": U,
        "index": u.index,
        "end": u.index + U.length,
        "level": "L5",
        "seconds": parseInt(U, 10),
        "isIsolated": true
      });
    }
    return a;
  }
  function resolveOverlaps(r) {
    var o = {
      "L1": 1,
      "L2": 1,
      "L3": 1,
      "L5": 2
    };
    r.sort((function(r, a) {
      var l = r.isIsolated ? 3 : o[r.level];
      var u = a.isIsolated ? 3 : o[a.level];
      if (l !== u) {
        return l - u;
      }
      if (r.raw.length !== a.raw.length) {
        return a.raw.length - r.raw.length;
      }
      return r.index - a.index;
    }));
    var a = [];
    var l = CommentScraper_createForOfIteratorHelper(r), u;
    try {
      var p = function _loop() {
        var r = u.value;
        var o = a.some((function(o) {
          return Math.max(r.index, o.index) < Math.min(r.end, o.end);
        }));
        if (!o) {
          a.push(r);
        }
      };
      for (l.s(); !(u = l.n()).done; ) {
        p();
      }
    } catch (r) {
      l.e(r);
    } finally {
      l.f();
    }
    a.sort((function(r, o) {
      return r.index - o.index;
    }));
    return a;
  }
  function mergeRanges(r, o) {
    var a = [];
    var l = [ "~", "-", "～", "到" ];
    var u = 0;
    while (u < r.length) {
      var p = r[u];
      var v = r[u + 1];
      if (v) {
        var b = o.slice(p.end, v.index).trim();
        if (l.includes(b)) {
          a.push({
            "raw": o.slice(p.index, v.end),
            "index": p.index,
            "end": v.end,
            "level": "L4",
            "subLevels": [ p.level, v.level ],
            "start": p,
            "endMatch": v,
            "isRange": true
          });
          u += 2;
          continue;
        }
      }
      a.push(p);
      u++;
    }
    return a;
  }
  function validateMatch(r, o, a, l) {
    var u = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : false;
    if (r.index !== void 0) {
      var p = a.slice(Math.max(0, r.index - 10), r.index);
      var v = new RegExp("(?:".concat(ae.TIMESTAMPS.DURATION_KEYWORDS.join("|"), ")[\\s:：,，、]*$"), "i");
      if (v.test(p)) {
        return {
          "isValid": false,
          "reason": "检测到持续时长语义"
        };
      }
      if (!/[分秒时時hmsmHMS]/i.test(r.raw)) {
        var b = a.slice(r.end, Math.min(a.length, r.end + 5)).trim();
        if (/^[xX倍]/i.test(b)) {
          return {
            "isValid": false,
            "reason": "检测到播放速度/倍率语义"
          };
        }
      }
    }
    if (r.isRange) {
      var y = validateMatch(r.start, o, a, l, true);
      var C = validateMatch(r.endMatch, o, a, l, true);
      if (!y.isValid || !C.isValid) {
        return {
          "isValid": false,
          "reason": "范围边界无效"
        };
      }
      var k = y.seconds;
      var _ = C.seconds;
      var E = false;
      if (k > _) {
        E = true;
        var S = k;
        var P = _;
        k = l - S;
        _ = l - P;
        if (k < 0 || _ < 0) {
          return {
            "isValid": false,
            "reason": "倒计时超出总时长"
          };
        }
      }
      return {
        "isValid": true,
        "seconds": [ k, _ ],
        "level": "L4",
        "confidence": "High",
        "isCountdown": E,
        "countdownOffsets": E ? [ y.seconds, C.seconds ] : null
      };
    }
    var D = Math.max(l, 28800);
    if (r.isSlashList) {
      var L = [];
      var M = CommentScraper_createForOfIteratorHelper(r.seconds), A;
      try {
        for (M.s(); !(A = M.n()).done; ) {
          var T = A.value;
          if (T <= D) {
            L.push(T);
          }
        }
      } catch (r) {
        M.e(r);
      } finally {
        M.f();
      }
      if (L.length === 0) {
        return {
          "isValid": false,
          "reason": "斜杠列表全部超出时长"
        };
      }
      return {
        "isValid": true,
        "seconds": L.length === 1 ? L[0] : L,
        "level": "L5",
        "confidence": "Medium"
      };
    }
    if (r.isIsolated) {
      var j = r.seconds;
      var B = false;
      var I = CommentScraper_createForOfIteratorHelper(o), V;
      try {
        for (I.s(); !(V = I.n()).done; ) {
          var O = V.value;
          if (O === r || O.isIsolated) {
            continue;
          }
          var R = r.index < O.index ? r : O;
          var H = r.index < O.index ? O : r;
          var G = a.slice(R.end, H.index);
          if (/^[\s,，、/\\"\d]*$/.test(G) && G.length < 10) {
            B = true;
            break;
          }
        }
      } catch (r) {
        I.e(r);
      } finally {
        I.f();
      }
      var z = Math.max(0, r.index - 5);
      var N = Math.min(a.length, r.end + 5);
      var J = a.slice(z, r.index) + " | " + a.slice(r.end, N);
      var q = ae.TIMESTAMPS.MINUTE_KEYWORDS;
      var U = ae.TIMESTAMPS.SECOND_KEYWORDS;
      var W = a.replace(/(?:[\t-\r -\/:-@\[-`\{-~\xA0-\xA9\xAB\xAC\xAE-\xB1\xB4\xB6-\xB8\xBB\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u037E\u0384\u0385\u0387\u03F6\u0482\u055A-\u055F\u0589\u058A\u058D-\u058F\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0606-\u060F\u061B\u061D-\u061F\u066A-\u066D\u06D4\u06DE\u06E9\u06FD\u06FE\u0700-\u070D\u07F6-\u07F9\u07FE\u07FF\u0830-\u083E\u085E\u0888\u0964\u0965\u0970\u09F2\u09F3\u09FA\u09FB\u09FD\u0A76\u0AF0\u0AF1\u0B70\u0BF3-\u0BFA\u0C77\u0C7F\u0C84\u0D4F\u0D79\u0DF4\u0E3F\u0E4F\u0E5A\u0E5B\u0F01-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F85\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE-\u0FDA\u104A-\u104F\u109E\u109F\u10FB\u1360-\u1368\u1390-\u1399\u1400\u166D\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DB\u1800-\u180A\u1940\u1944\u1945\u19DE-\u19FF\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2000-\u200A\u2010-\u2029\u202F-\u205F\u207A-\u207E\u208A-\u208E\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2775\u2794-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E5D\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u303F\u309B\u309C\u30A0\u30FB\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAA77-\uAA79\uAADE\uAADF\uAAF0\uAAF1\uAB5B\uAB6A\uAB6B\uABEB\uFB29\uFBB2-\uFBC2\uFD3E-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD00-\uDD02\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDC77\uDC78\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEC8\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDD8E\uDD8F\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3F]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFD5-\uDFF1\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3F\uDF44\uDF45]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F[\uDC9C\uDC9F]|\uD833[\uDC00-\uDCEF\uDD00-\uDEB3\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE8B]|\uD838[\uDD4F\uDEFF]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF])+/g, "");
      var Y = W === r.raw;
      if (Y) {
        if (ae.FILTER.SINGLE_DIGIT_REGEX.test(r.raw) || ae.FILTER.REPEATING_DIGIT_REGEX.test(r.raw)) {
          Y = false;
        }
      }
      var K = U.some((function(r) {
        return J.includes(r);
      })) || q.some((function(r) {
        return J.includes(r);
      })) || B || Y || u;
      if (!K) {
        return {
          "isValid": false,
          "reason": "孤立数字缺少时间上下文"
        };
      }
      var X = U.some((function(r) {
        return J.includes(r);
      }));
      var $ = X ? j : j * 60;
      if ($ > D) {
        return {
          "isValid": false,
          "reason": "数值超出限制 (".concat($, "秒 > ").concat(D, "秒)")
        };
      }
      return {
        "isValid": true,
        "seconds": $,
        "level": "L5",
        "confidence": "Medium"
      };
    }
    var Q = r.seconds;
    var Z = false;
    var ee = null;
    if (r.isNegative) {
      Z = true;
      var te = Math.abs(Q);
      if (te > D) {
        return {
          "isValid": false,
          "reason": "倒计时超出总时长"
        };
      }
      Q = l - te;
      ee = te;
    }
    if (Q > D) {
      return {
        "isValid": false,
        "reason": "时间点超出视频时长"
      };
    }
    return {
      "isValid": true,
      "seconds": Q,
      "level": r.level,
      "confidence": "High",
      "isCountdown": Z,
      "countdownOffsets": ee
    };
  }
  function parseTimestamps(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 10800;
    var a = normalizeText(r);
    var l = maskBlacklist(a);
    var u = ae.TIMESTAMPS.HOUR_LIMIT;
    if (o && o > 0) {
      u = Math.floor(o / 3600);
      if (u < 1) {
        u = 1;
      }
      if (u > 8) {
        u = 8;
      }
    }
    var p = extractCandidates(l, u);
    var v = resolveOverlaps(p);
    var b = mergeRanges(v, l);
    var y = [];
    var C = [];
    var k = CommentScraper_createForOfIteratorHelper(b), _;
    try {
      for (k.s(); !(_ = k.n()).done; ) {
        var E = _.value;
        var S = validateMatch(E, v, l, o);
        if (S.isValid) {
          y.push({
            "raw": E.raw,
            "seconds": S.seconds,
            "level": E.level,
            "confidence": S.confidence,
            "isCountdown": S.isCountdown,
            "countdownOffsets": S.countdownOffsets
          });
        } else {
          C.push({
            "raw": E.raw,
            "reason": S.reason
          });
        }
      }
    } catch (r) {
      k.e(r);
    } finally {
      k.f();
    }
    var P = "None";
    if (y.length > 0) {
      var D = {
        "High": 3,
        "Medium": 2,
        "Low": 1
      };
      var L = 0;
      var M = CommentScraper_createForOfIteratorHelper(y), A;
      try {
        for (M.s(); !(A = M.n()).done; ) {
          var T = A.value;
          var j = D[T.confidence] || 0;
          if (j > L) {
            L = j;
            P = T.confidence;
          }
        }
      } catch (r) {
        M.e(r);
      } finally {
        M.f();
      }
    }
    return {
      "isValid": y.length > 0,
      "validTimestamps": y,
      "invalidTimestamps": C,
      "confidence": P
    };
  }
  var xe = /(?<!\w|\/|www\.|=|col-|\d-|>|Jukujo-)(?!heyzo|SHINKI|JPNXXX|carib|vps)[a-zA-Z]{2,6}-\d{2,5}(?:-c|_c|-4k)?(?!\d|[A-Za-z]{2,}|-\d|\.com|\.\d)|(?<!\w|\/|\\|\.|【|-|#|@|=|www\.)(?!heyzo|SHINKI|JPNXXX|carib|and|vps|dvd)[a-zA-Z]{2,6}\s{0,2}\d{3,4}(?:-c|_c)?(?!\w|-|\.|\/|×|％|%|@|\s?天| 于| 发表| 發表|歳| 歲|小时|分|系列| Min| day|ml| time|cm| ppi|\.com)|(?<!\w)(?:PARATHD|3DSVR|STARSBD)[-\s]?\d{3,4}(?!\w)|(?<!\w)(?:HIMEMIX|CASMANI|MGSSLND)[-\s]?\d{3}(?!\w)|(?<!\w)(?:k|n)[01]\d{3}(?!\w|-)|(?<!\w|\d-|\/)[01]\d{5}[-_](?:1)?\d{2,3}(?!\w|-\d)|(?<!\w)(?:carib|1pondo)[-_]\d{6}[-_]\d{2,3}(?!\w)|(?<!\w|\d-)\d{6}[-_]\d{2,3}(?:-1pon|-carib|-paco)(?!\w)|(?<!\w|\d-)\d{6}_(1)?\d{3}_0[12](?!\w|-\d)|HEYZO[_-\s]?(?:hd_)?\d{4}/gi;
  var we = /(?<!\w|-|\/)\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}(?!\w|-|.torrent|年)|(?<!\w|\/)FC2[^\d]{0,5}\d{6,7}|HEYDOUGA[_-\s]?\d{4}-\d{3,5}|(?<!\w)T28-\d{3}|(?<!\w)T-2\d{4,5}(?!\w|-)|(?<!\w|-|\/)[01]\d{5}-[a-zA-Z]{2,7}(?!\w|-)|(?<!\w)MK(?:B)?D-S\d{2,3}(?!\w|-)|(?:SHINKI|KITAIKE)[-\s]?\d{3}(?!\w|-)|JPNXXX[-\s]?\d{5}(?!\w|-)|xxx-av[-\s]\d{4,5}(?!\w|-)|(?<!\w)crazyasia\d{5}(?!\w|-)|(?<!\w)PEWORLD\d{5}(?!\w|-)|(?<!\w)[01]\d{5}[-_]?_01(?=-10mu)?|Jukujo-Club-\d{3}/gi;
  var ke = /(?<=(?<!\w|\d-)([a-zA-Z]{2,6})(?:[\s,，、-]?(?!2022|2021|2020|2019)\d{3,4})+(?!\d)[\s,、，和跟]{0,2})\d{3,4}(?!\w|％|%|人|年|歳|万|の|发)/gim;
  var _e = /(?<=(FC2[^\d]{0,5})(?:[\s,、-]?\d{6,7})+[\s,、]?)\d{6,7}/gim;
  var Ee = /^(?:fx-?([^0]\d{2}|\d{4})|[a-zA-Z]+-?0{2,6}$|pg-13|crc-32|ea211|fs[\s-]?140|trc-20|erc-20|rs[\s-]?(232|422|485)|(sg|ae|kr|tw|ph|vn|kh|ru|uk|ua|tr|th|fr|in|de|sr)[\s-]\d{2}|(gm|ga)-\d{4}|cd[\s-]?\d{2,4}|seed[\s-]?\d{3}$|pc005|moc-\d{5}|wd-40|rtd[\s-]?\d{4}|cm\d{4}|rk\d{4})|ns[\s-]?\d{3,4}/i;
  var Se = /^(?:about|ac|actg|adreno|aes|aff|again|agm|all|ak|akko|apex|aptx|arm|au|ax|avhd|avx|bej|bgm|bd|bm|build|(?:fc|p)?[blp]ga|by|bzk|cc|ccie|cctv|cea|chrome|ckg|class|cny|code|core|covid|cpu|dc|debian|df|ds|dw|dx|ea|edit|er|ecma|eia|emui|eof|ep|error|exp|ez|fc|file|flash|flyme|fps|for|fork|from|fuck|fx|gbx|get|github|glm|gnz|gp|groupr|gt|gts|gtx|guest|hao|hd|her|hdr|hk|https?|hp|IEEE|il|ilc|ilce|imx|index|intel|inteli|ip|ipad|is|ISBN|iso|issue|issues|it|jav|javdb|joy|jp|jr|jsr|jt|jukujo|just|kc|keccak|kv[bd]|Kirin|kryo|lancet|libx|line|linux|lk|lolrng|lpl|lt|lumia|lg|macos|math|md|mh|miui|mipc|mnvr|mm|model|mv|mvp|ms|nas|nature|nc|next|ngff|note|number|ok|only|os|oss|osx|opga|pa|page|pch|phl|pmw|png|ppv|qbz|qsz|raid|rfc|ripemd|rmb|rng|rog|row|rtx|rush|rx|sale|scp|scte|sdm|sdr|server|sha|shp|sonnet|spent|sql|sn|snh|Socket|ssd|status|steam|su|swipe|tcp|the|top|than|thread|tr|ts|type|uh|uhd|under|us|usa|usc|utf|utc|via|video|vkffsc|vol|vr|vs|vv|web|win|with|width|wikis|wta|xdr|xfx|xiaomi|yah)$/i;
  var Pe = /^(?:ace|akb|api|am|anime|at|be|best|bt|bl|cp|crc|exynos|dl|dp|dq|gb|girl|jd|ha|has|hc|hours|iq|in|mk|mini|mhz|mx|no|open|of|over|part|pd|pdd|porn|pt|sb|sex|tv|tb|ty|ver|vip|zd|zip)$/i;
  var De = /^(?:007|101|110|115|123|128|256|360|365|370|404|512|520|911|996|\d{1,2}00|19[789]\d|20[012]\d|720|1080|1024|2048|[056789]\d{3}|(\d)\1{2,3})$/;
  var Le = /^(?:512gb)/i;
  function IDcheck(r) {
    var o = r.replace(/[^a-zA-Z]/gi, "");
    var a = r.replace(/[^0-9]/gi, "");
    if (r.match(Ee)) {
      return true;
    }
    if (o.match(Se)) {
      return true;
    }
    if (r.match(/^[a-z|A-Z]{2,8}\s?\d{2,5}$/i)) {
      if (a.match(De)) {
        return true;
      }
      if (o.match(Pe)) {
        return true;
      }
    }
    return false;
  }
  function IDcheckWuma(r) {
    if (r.match(/\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}/i)) {
      if (r.replace(/[^a-zA-Z]/gi, "").match(/^cm$/i)) {
        return true;
      }
    }
    if (r.match(Le)) {
      return true;
    }
    return false;
  }
  function formatAVID(r) {
    var o = r.replace(/\s+|-c|_c|-4k|carib[-_]|1pondo[-_]|-1pon|-paco|-carib|hd_/gi, "");
    if (o.match(/(?:k|n)\d{4}/i)) {
      return o.toLowerCase();
    }
    if (o.match(/^[a-zA-Z]{2,8}\d{2,5}$/i)) {
      var a = o.search(/\d/);
      if (a > 0) {
        o = o.slice(0, a) + "-" + o.slice(a);
      }
    }
    return o.toUpperCase();
  }
  function formatWuma(r) {
    var o = r.replace(/\s+|carib[-_]|1pondo[-_]|-1pon|-paco|-carib|hd_/gi, "");
    if (o.match(/fc2/i)) {
      var a = o.search(/(?<!fc)\d/i);
      return ("FC2-" + o.slice(a)).toUpperCase();
    }
    if (o.match(/heyzo/i)) {
      var l = o.search(/\d/i);
      return "HEYZO-" + o.slice(l);
    }
    if (o.match(/(?:k|n)\d{4}/i)) {
      return o.toLowerCase();
    }
    if (o.match(/t28|t-|MKD-S|SHINKI|KITAIKE|JPNXXX|xxx-av|crazyasia|PEWORLD|MKBD-S/i)) {
      return o.toUpperCase();
    }
    if (o.match(/HEYDOUGA/i)) {
      return "heydouga-" + o.slice(o.search(/\d/i));
    }
    return o;
  }
  function extractAVCodes(r, o) {
    var a = new Set;
    var l = normalizeText(r);
    var u;
    xe.lastIndex = 0;
    while ((u = xe.exec(l)) !== null) {
      var p = u[0].trim();
      if (!IDcheck(p)) {
        a.add(formatAVID(p));
      }
    }
    we.lastIndex = 0;
    while ((u = we.exec(l)) !== null) {
      var v = u[0].trim();
      if (!IDcheckWuma(v)) {
        var b = formatWuma(v);
        if (b.match(/^\d{3}[a-zA-Z]{2,5}[-\s]?\d{3,4}$/)) {
          b = formatAVID(b.slice(3));
        }
        a.add(b);
      }
    }
    ke.lastIndex = 0;
    while ((u = ke.exec(l)) !== null) {
      if (u[1]) {
        var y = u[1] + " " + u[0];
        if (!IDcheck(y)) {
          a.add(formatAVID(y));
        }
      }
    }
    _e.lastIndex = 0;
    while ((u = _e.exec(l)) !== null) {
      if (u[1]) {
        var C = u[1] + u[0];
        if (!IDcheckWuma(C)) {
          a.add(formatWuma(C));
        }
      }
    }
    if (o) {
      var k = /(?<!\w|\d\s*|-|:|：|\.|。|\/|\\)\b\d{3,4}\b(?!\s*\d|\w|-\d|:|：|\.|。|\/|\\|分|秒|岁|歲|年|万|萬|播放|次|倍|位|个|個|人|元|包|px|p|P|gb|GB|mb|MB|kb|KB)/g;
      var _;
      k.lastIndex = 0;
      while ((_ = k.exec(l)) !== null) {
        var E = _[0];
        if (!E.match(De)) {
          var S = "".concat(o, "-").concat(E);
          if (!IDcheck(S)) {
            a.add(S.toUpperCase());
          }
        }
      }
    }
    return Array.from(a);
  }
  function makeHighlightRegex(r) {
    var o = "";
    for (var a = 0; a < r.length; a++) {
      var l = r[a];
      if (/\d/.test(l)) {
        var u = String.fromCharCode(l.charCodeAt(0) + 65248);
        o += "[".concat(l).concat(u, "]");
      } else if (l === ":") {
        o += "\\s*[:：]\\s*";
      } else if (l === ".") {
        o += "\\s*[\\.。．]\\s*";
      } else if (l === "-") {
        o += "\\s*[-－—]\\s*";
      } else if (l === "~" || l === "～") {
        o += "\\s*[-~～ー－—到至]\\s*";
      } else if (/\s/.test(l)) {
        o += "\\s*";
      } else {
        var p = l.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        o += "\\s*".concat(p, "\\s*");
      }
    }
    return new RegExp(o, "g");
  }
  function buildAvcodeRegex(r) {
    var o = "(?<![a-zA-Z\\d\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A])";
    for (var a = 0; a < r.length; a++) {
      var l = r[a];
      if (/[a-zA-Z]/.test(l)) {
        var u = l.toUpperCase();
        var p = l.toLowerCase();
        var v = String.fromCharCode(u.charCodeAt(0) + 65248);
        var b = String.fromCharCode(p.charCodeAt(0) + 65248);
        o += "[".concat(u).concat(p).concat(v).concat(b, "]");
      } else if (/\d/.test(l)) {
        var y = String.fromCharCode(l.charCodeAt(0) + 65248);
        o += "[".concat(l).concat(y, "]");
      } else if (l === "-" || l === "_") {
        o += "[-_－—\\s]?";
      } else {
        var C = l.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        o += C;
      }
    }
    o += "(?![a-zA-Z\\d\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A])";
    return new RegExp(o, "gi");
  }
  function formatSeconds(r) {
    if (Array.isArray(r)) {
      return r.map(formatSeconds).join(" ~ ");
    }
    var o = Math.round(r);
    if (o < 0) {
      return o.toString();
    }
    var a = Math.floor(o / 3600);
    var l = Math.floor(o % 3600 / 60);
    var u = o % 60;
    var p = function pad(r) {
      return String(r).padStart(2, "0");
    };
    return a > 0 ? "".concat(p(a), ":").concat(p(l), ":").concat(p(u)) : "".concat(p(l), ":").concat(p(u));
  }
  function parseBBCode(r) {
    if (!r) {
      return "";
    }
    var o = r;
    o = o.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<b>$1</b>");
    o = o.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1">$2</span>');
    o = o.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (function(r, o, a) {
      var l = o;
      if (o.startsWith("/")) {
        l = "https://c97k.com".concat(o);
      }
      return '<a href="'.concat(l, '" target="_blank" class="jc-comment-link">').concat(a, "</a>");
    }));
    o = o.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (function(r, o) {
      var a = o;
      if (o.startsWith("/")) {
        a = "https://c97k.com".concat(o);
      }
      return '<a href="'.concat(a, '" target="_blank" class="jc-comment-link">').concat(o, "</a>");
    }));
    o = o.replace(/\[\/?[a-zA-Z]+[^\]]*\]/g, "");
    return o;
  }
  function highlightCommentText(r, o, a) {
    var l = ie(r);
    l = parseBBCode(l);
    var u = {};
    var p = 0;
    var v = CommentScraper_toConsumableArray(o).sort((function(r, o) {
      return o.raw.length - r.raw.length;
    }));
    v.forEach((function(r) {
      var o = makeHighlightRegex(r.raw);
      l = l.replace(o, (function(o) {
        var a = "___TS_".concat(p++, "___");
        var l = Array.isArray(r.seconds) ? r.seconds.map(Math.round) : Math.round(r.seconds);
        var v = Array.isArray(l) ? JSON.stringify(l) : l;
        var b = "跳转至此时间";
        var y = o;
        if (r.isCountdown) {
          y = formatSeconds(r.seconds);
          if (Array.isArray(r.countdownOffsets)) {
            b = "原倒计时: -".concat(formatSeconds(r.countdownOffsets[0]), " ~ -").concat(formatSeconds(r.countdownOffsets[1]), " (已转换为绝对时间)");
          } else {
            b = "原倒计时: -".concat(formatSeconds(r.countdownOffsets), " (已转换为绝对时间)");
          }
        } else if (Array.isArray(r.seconds)) {
          b = "跳转至区间 ".concat(formatSeconds(r.seconds));
        } else {
          b = "跳转至 ".concat(formatSeconds(r.seconds));
        }
        u[a] = '<span class="jc-time-link" data-secs=\''.concat(v, "' title=\"").concat(ie(b), '">').concat(y, "</span>");
        return a;
      }));
    }));
    a.forEach((function(r) {
      var o = buildAvcodeRegex(r);
      l = l.replace(o, (function(o) {
        var a = "___AV_".concat(p++, "___");
        u[a] = '<span class="jc-code-link" data-code="'.concat(ie(r), '" title="复制并搜索番号">').concat(o, "</span>");
        return a;
      }));
    }));
    var b = {
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
    l = l.replace(/:([a-zA-Z]{2,15}):/g, (function(r, o) {
      var a = o.toLowerCase();
      if (b[a]) {
        return b[a];
      }
      return r;
    }));
    for (var y = 0, C = Object.entries(u); y < C.length; y++) {
      var k = _slicedToArray(C[y], 2), _ = k[0], E = k[1];
      l = l.replace(_, E);
    }
    return l;
  }
  function processComment(r, o) {
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 10800;
    var l = r;
    if (r.includes("[quote") || r.includes("[/quote]")) {
      l = r.replace(/\[quote[^\]]*\][\s\S]*?\[\/quote\]/gi, "").trim();
    }
    var u = classifyComment(l);
    var p = [];
    var v = [];
    if (u.label !== "SPAM") {
      var b = parseTimestamps(l, a);
      if (b.isValid) {
        p = b.validTimestamps;
      }
      v = extractAVCodes(l, o);
    }
    var y = highlightCommentText(l, p, v);
    return {
      "spam": u,
      "timestamps": p,
      "avcodes": v,
      "textHtml": y
    };
  }
  function matchAvCode(r, o) {
    var a = function clean(r) {
      return r.toLowerCase().replace(/[^a-z0-9]/g, "");
    };
    return a(r) === a(o);
  }
  function getJavLibCookie(r) {
    if (typeof GM_getValue !== "function") {
      return "";
    }
    var o = GM_getValue("javlib_cookies") || {};
    var a = function getHost(r) {
      try {
        return new URL(r).hostname.replace(/^www\./, "");
      } catch (o) {
        return r.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      }
    };
    var l = a(r);
    for (var u = 0, p = Object.keys(o); u < p.length; u++) {
      var v = p[u];
      if (a(v) === l) {
        return o[v] || "";
      }
    }
    return "";
  }
  function fetchJavLibraryVideoId(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
    if (!r) {
      return Promise.reject(new Error("Invalid AVCode"));
    }
    if (o >= re.length) {
      return Promise.reject(a || new Error("All JAVLibrary domains failed"));
    }
    var l = re[o];
    var u = r.toLowerCase().trim();
    var p = "".concat(l, "/cn/vl_searchbyid.php?keyword=").concat(encodeURIComponent(u));
    var v = function tryNext(u) {
      var p = u && (u.message === "CLOUDFLARE_SHIELD" || u.message.includes("CF_SHIELD"));
      var v = a && (a.message === "CLOUDFLARE_SHIELD" || a.message.includes("CF_SHIELD"));
      var b = u;
      if (v && !p) {
        b = a;
      } else if (p && !u.message.includes("CF_SHIELD_ON_")) {
        b = new Error("CF_SHIELD_ON_".concat(l));
      }
      if (o < re.length - 1) {
        U.log("JAVLibrary 域名 ".concat(l, " 搜索失败，尝试下一个备用域名..."));
        return fetchJavLibraryVideoId(r, o + 1, b);
      } else {
        var y = b && (b.message === "CLOUDFLARE_SHIELD" || b.message.includes("CF_SHIELD")) ? b : u || new Error("All JAVLibrary domains failed");
        return Promise.reject(y);
      }
    };
    var b = function() {
      try {
        if (typeof window === "undefined" || !window.location || !window.location.hostname) {
          return false;
        }
        var r = new URL(l).hostname.replace(/^www\./, "");
        var o = window.location.hostname.replace(/^www\./, "");
        return r === o;
      } catch (r) {
        return false;
      }
    }();
    if (b) {
      var y = p.replace(l, window.location.origin);
      U.log("[CommentScraper] 搜索 JAVLibrary 番号 (同源 fetch): ".concat(u, " (URL: ").concat(y, ")"));
      var C = typeof unsafeWindow !== "undefined" && unsafeWindow.fetch ? unsafeWindow.fetch.bind(unsafeWindow) : fetch;
      return C(y, {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "referer": "".concat(window.location.origin, "/cn/")
        },
        "credentials": "same-origin"
      }).then((function(r) {
        if (r.status === 403 || r.status === 503) {
          throw new Error("CLOUDFLARE_SHIELD");
        }
        if (!r.ok) {
          throw new Error("HTTP ".concat(r.status));
        }
        return Promise.all([ r.text(), r.url ]);
      })).then((function(r) {
        var o = _slicedToArray(r, 2), a = o[0], p = o[1];
        var v = l;
        if (p && p.startsWith("http")) {
          try {
            v = new URL(p).origin;
          } catch (r) {}
        }
        var b = extractVideoIdFromUrl(p);
        if (b) {
          U.log("找到 JAVLibrary ID (重定向): ".concat(b, " (工作域名: ").concat(v, ")"));
          return {
            "videoId": b,
            "domain": v
          };
        }
        var y = parseJavLibraryVideoIdHtml(a, u, v);
        return {
          "videoId": y,
          "domain": v
        };
      }))["catch"]((function(r) {
        return v(r);
      }));
    }
    var k = {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "referer": "".concat(l, "/cn/")
    };
    return new Promise((function(r, o) {
      U.log("搜索 JAVLibrary 番号: ".concat(u, " (域名: ").concat(l, ")"));
      var a = false;
      var b = function safeResolve(o) {
        if (!a) {
          a = true;
          clearTimeout(_);
          r(o);
        }
      };
      var y = function safeReject(r) {
        if (!a) {
          a = true;
          clearTimeout(_);
          o(r);
        }
      };
      var C = function handleTryNext(l) {
        if (!a) {
          a = true;
          clearTimeout(_);
        }
        v(l).then(r)["catch"](o);
      };
      var _ = setTimeout((function() {
        if (!a) {
          U.warn("JAVLibrary 搜索超时 (已达到 10000ms 限制，手动中止): ".concat(p));
          if (E && typeof E.abort === "function") {
            try {
              E.abort();
            } catch (r) {}
          }
          C(new Error("Timeout"));
        }
      }), 1e4);
      var E = GM_xmlhttpRequest({
        "method": "GET",
        "url": p,
        "anonymous": false,
        "timeout": 1e4,
        "headers": k,
        "withCredentials": true,
        "onload": function onload(r) {
          if (a) {
            return;
          }
          U.log("JAVLibrary 搜索响应状态码: ".concat(r.status));
          if (r.status === 403 || r.status === 503) {
            C(new Error("CLOUDFLARE_SHIELD"));
            return;
          }
          var o = l;
          var p = r.finalUrl || "";
          if (p.startsWith("http")) {
            try {
              o = new URL(p).origin;
            } catch (r) {}
          }
          var v = extractVideoIdFromUrl(p);
          if (v) {
            U.log("找到 JAVLibrary ID (重定向): ".concat(v, " (工作域名: ").concat(o, ")"));
            b({
              "videoId": v,
              "domain": o
            });
            return;
          }
          try {
            var y = r.responseText;
            var k = parseJavLibraryVideoIdHtml(y, u, o);
            b({
              "videoId": k,
              "domain": o
            });
          } catch (r) {
            C(r);
          }
        },
        "onerror": function onerror(r) {
          if (a) {
            return;
          }
          U.error("JAVLibrary 搜索失败:", r);
          C(new Error("Network error or blocked"));
        },
        "ontimeout": function ontimeout() {
          if (a) {
            return;
          }
          C(new Error("Timeout"));
        }
      });
    }));
  }
  function extractVideoIdFromUrl(r) {
    if (!r) {
      return "";
    }
    var o = r.match(/[\?&]v=([^&]+)/);
    var a = r.match(/\/cn\/(jav[a-z0-9]+)\.html/i);
    return o ? o[1] : a ? a[1] : "";
  }
  function parseJavLibraryVideoIdHtml(r, o, a) {
    if (!r || r.trim() === "") {
      throw new Error("Empty response");
    }
    if (r.includes("cf-challenge") || r.includes("Turnstile") || r.includes("Checking your browser")) {
      throw new Error("CLOUDFLARE_SHIELD");
    }
    var l = (new DOMParser).parseFromString(r, "text/html");
    var u = l.querySelectorAll(".videos .video a");
    var p = "";
    var v = CommentScraper_createForOfIteratorHelper(u), b;
    try {
      for (v.s(); !(b = v.n()).done; ) {
        var y = b.value;
        var C = y.querySelector(".id");
        if (C) {
          var k = C.textContent.trim();
          if (matchAvCode(k, o)) {
            var _ = y.getAttribute("href") || "";
            var E = _.match(/v=([^&]+)/);
            if (E) {
              p = E[1];
              break;
            }
          }
        }
      }
    } catch (r) {
      v.e(r);
    } finally {
      v.f();
    }
    if (!p && u.length > 0) {
      var S = u[0].getAttribute("href") || "";
      var P = S.match(/v=([^&]+)/);
      if (P) {
        p = P[1];
      }
    }
    if (p) {
      U.log("找到 JAVLibrary ID (搜索列表): ".concat(p, " (工作域名: ").concat(a, ")"));
      return p;
    }
    var D = r.match(/videocomments\.php\?v=([^"]+)/);
    if (D) {
      U.log("从页面文本中解析到 JAVLibrary ID: ".concat(D[1], " (工作域名: ").concat(a, ")"));
      return D[1];
    }
    throw new Error("Movie not found on JAVLibrary");
  }
  function parseJavLibraryDataHtml(r, o, a, l) {
    if (!r || r.trim() === "") {
      throw new Error("Empty response");
    }
    if (r.includes("cf-challenge") || r.includes("Turnstile") || r.includes("Checking your browser")) {
      throw new Error("CF_SHIELD_ON_".concat(l));
    }
    var u = o === "reviews";
    var p = (new DOMParser).parseFromString(r, "text/html");
    var v = u ? "table.review" : "table.comment";
    var b = p.querySelectorAll(v);
    var y = [];
    b.forEach((function(r, u) {
      var p = r.querySelector(".userid a");
      var v = p ? p.textContent.trim() : "Anonymous";
      var b = p ? p.getAttribute("href") : "";
      if (b) {
        if (b.startsWith(".")) {
          b = "".concat(l, "/cn").concat(b.substring(1));
        } else if (b.startsWith("/")) {
          b = "".concat(l, "/cn").concat(b);
        } else if (!b.startsWith("http")) {
          b = "".concat(l, "/cn/").concat(b);
        }
      }
      var C = r.querySelector(".date");
      var k = C ? C.textContent.trim() : "";
      var _ = r.querySelector("textarea.hidden");
      var E = _ ? (_.value || _.textContent || "").trim() : "";
      var S = r.querySelector('[class^="rating"]');
      var P = S ? S.getAttribute("title") : null;
      if (E || v !== "Anonymous") {
        y.push({
          "id": "javlib-".concat(o, "-").concat(a, "-").concat(u),
          "user": v,
          "userUrl": b,
          "time": k,
          "text": E,
          "score": P,
          "isPending": false,
          "site": "javlib"
        });
      }
    }));
    var C = p.querySelector(".page_selector");
    var k = false;
    var _ = y.length;
    if (C) {
      var E = new RegExp("[\\?&]page=".concat(a + 1, "(?:&|$)"));
      var S = C.querySelectorAll("a");
      var P = CommentScraper_createForOfIteratorHelper(S), D;
      try {
        for (P.s(); !(D = P.n()).done; ) {
          var L = D.value;
          if (E.test(L.getAttribute("href") || "")) {
            k = true;
            break;
          }
        }
      } catch (r) {
        P.e(r);
      } finally {
        P.f();
      }
    }
    return {
      "comments": y,
      "totalCount": _,
      "hasMore": k
    };
  }
  function fetchJavLibraryData(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "comments";
    var a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
    var l = arguments.length > 3 ? arguments[3] : void 0;
    if (!r) {
      return Promise.reject(new Error("Invalid VideoId"));
    }
    var u = o === "reviews";
    var p = u ? "videoreviews.php" : "videocomments.php";
    var v = l || re[0];
    var b = "".concat(v, "/cn/").concat(p, "?v=").concat(r, "&page=").concat(a);
    var y = function() {
      try {
        if (typeof window === "undefined" || !window.location || !window.location.hostname) {
          return false;
        }
        var r = new URL(v).hostname.replace(/^www\./, "");
        var o = window.location.hostname.replace(/^www\./, "");
        return r === o;
      } catch (r) {
        return false;
      }
    }();
    if (y) {
      var C = b.replace(v, window.location.origin);
      U.log("[CommentScraper] 采集 JAVLibrary ".concat(o, " (同源 fetch, Page ").concat(a, "): ").concat(C));
      var k = typeof unsafeWindow !== "undefined" && unsafeWindow.fetch ? unsafeWindow.fetch.bind(unsafeWindow) : fetch;
      return k(C, {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "referer": "".concat(window.location.origin, "/cn/?v=").concat(r)
        },
        "credentials": "same-origin"
      }).then((function(r) {
        if (r.status === 403 || r.status === 503) {
          throw new Error("CF_SHIELD_ON_".concat(v));
        }
        if (!r.ok) {
          throw new Error("HTTP ".concat(r.status));
        }
        return r.text();
      })).then((function(r) {
        return parseJavLibraryDataHtml(r, o, a, v);
      }));
    }
    var _ = {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "referer": "".concat(v, "/cn/?v=").concat(r)
    };
    return new Promise((function(r, l) {
      U.log("采集 JAVLibrary ".concat(o, " (Page ").concat(a, "): ").concat(b));
      var u = false;
      var p = function safeResolve(o) {
        if (!u) {
          u = true;
          clearTimeout(C);
          r(o);
        }
      };
      var y = function safeReject(r) {
        if (!u) {
          u = true;
          clearTimeout(C);
          l(r);
        }
      };
      var C = setTimeout((function() {
        if (!u) {
          U.warn("JAVLibrary 采集超时 (已达到 10000ms 限制，手动中止): ".concat(b));
          if (k && typeof k.abort === "function") {
            try {
              k.abort();
            } catch (r) {}
          }
          y(new Error("Timeout"));
        }
      }), 1e4);
      var k = GM_xmlhttpRequest({
        "method": "GET",
        "url": b,
        "anonymous": false,
        "timeout": 1e4,
        "headers": _,
        "withCredentials": true,
        "onload": function onload(r) {
          if (u) {
            return;
          }
          if (r.status === 403 || r.status === 503) {
            y(new Error("CF_SHIELD_ON_".concat(v)));
            return;
          }
          try {
            var l = r.responseText;
            var b = parseJavLibraryDataHtml(l, o, a, v);
            p(b);
          } catch (r) {
            y(r);
          }
        },
        "onerror": function onerror(r) {
          if (u) {
            return;
          }
          U.error("JAVLibrary ".concat(o, " 采集失败:"), r);
          y(new Error("Network error or blocked"));
        },
        "ontimeout": function ontimeout() {
          if (u) {
            return;
          }
          U.error("JAVLibrary ".concat(o, " 采集超时"));
          y(new Error("Timeout"));
        }
      });
    }));
  }
  var Me = "https://jdforrepam.com/api";
  function jbBuildSignature() {
    var r = Math.floor(Date.now() / 1e3);
    try {
      var o = localStorage.getItem("jb_jdsignature");
      if (o) {
        var a = o.split(".");
        if (a.length === 3 && r - parseInt(a[0], 10) <= 300) {
          return o;
        }
      }
    } catch (r) {}
    var l = "".concat(r, ".lpw6vgqzsp.").concat(md5("".concat(r, "71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa")));
    try {
      localStorage.setItem("jb_jdsignature", l);
    } catch (r) {}
    return l;
  }
  function jbApiGetOnce(r, o, a) {
    return new Promise((function(l, u) {
      var p = r;
      if (o && Object.keys(o).length) {
        var v = new URLSearchParams(o).toString();
        p += (r.includes("?") ? "&" : "?") + v;
      }
      if (typeof GM_xmlhttpRequest === "undefined") {
        u(new Error("GM_xmlhttpRequest unavailable"));
        return;
      }
      GM_xmlhttpRequest({
        "method": "GET",
        "url": p,
        "headers": a || {},
        "timeout": 8e3,
        "onload": function onload(r) {
          try {
            if (r.status >= 200 && r.status < 300) {
              if (r.responseText) {
                try {
                  l(JSON.parse(r.responseText));
                } catch (o) {
                  l(r.responseText);
                }
              } else {
                l(r.responseText || r);
              }
            } else {
              try {
                var o = JSON.parse(r.responseText);
                u(o);
              } catch (o) {
                u(new Error(r.responseText || "HTTP ".concat(r.status)));
              }
            }
          } catch (r) {
            u(r);
          }
        },
        "onerror": function onerror() {
          return u(new Error("API 请求失败"));
        },
        "ontimeout": function ontimeout() {
          return u(new Error("API 请求超时"));
        }
      });
    }));
  }
  function fetchJavdbMovieId(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    if (!r) {
      return Promise.reject(new Error("Invalid AVCode"));
    }
    var a = r.trim();
    var l = oe[o] || oe[0] || "https://javdb.com";
    var u = "".concat(l, "/search?q=").concat(encodeURIComponent(a), "&f=all");
    U.log("[CommentScraper] 开始获取 JavDB 影片 ID，番号: ".concat(a, ", 域名: ").concat(l));
    return new Promise((function(r, o) {
      if (typeof GM_xmlhttpRequest === "undefined") {
        o(new Error("GM_xmlhttpRequest unavailable"));
        return;
      }
      GM_xmlhttpRequest({
        "method": "GET",
        "url": u,
        "timeout": 8e3,
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        "onload": function onload(u) {
          if (u.status === 403 || u.status === 503 || u.responseText && (u.responseText.includes("cf-challenge") || u.responseText.includes("Turnstile"))) {
            o(new Error("CF_SHIELD_ON_".concat(l)));
            return;
          }
          if (u.status >= 200 && u.status < 300) {
            if (u.finalUrl && u.finalUrl.includes("/v/")) {
              var p = u.finalUrl.match(/\/v\/([a-zA-Z0-9]+)/);
              if (p) {
                r({
                  "movieId": p[1],
                  "domain": l,
                  "source": "html"
                });
                return;
              }
            }
            try {
              var v = (new DOMParser).parseFromString(u.responseText, "text/html");
              var b = v.querySelectorAll('.movie-list .item a[href^="/v/"], .grid-item a[href^="/v/"], a[href^="/v/"]');
              var y = "";
              var C = CommentScraper_createForOfIteratorHelper(b), k;
              try {
                for (C.s(); !(k = C.n()).done; ) {
                  var _ = k.value;
                  var E = _.getAttribute("href") || "";
                  var S = E.match(/\/v\/([a-zA-Z0-9]+)/);
                  if (S) {
                    var P = _.getAttribute("title") || _.textContent || "";
                    if (!a || matchAvCode(P, a)) {
                      y = S[1];
                      break;
                    }
                    if (!y) {
                      y = S[1];
                    }
                  }
                }
              } catch (r) {
                C.e(r);
              } finally {
                C.f();
              }
              if (y) {
                r({
                  "movieId": y,
                  "domain": l,
                  "source": "html"
                });
                return;
              }
            } catch (r) {}
          }
          o(new Error("HTML search failed HTTP ".concat(u.status)));
        },
        "onerror": function onerror() {
          o(new Error("Network error"));
        },
        "ontimeout": function ontimeout() {
          o(new Error("Timeout"));
        }
      });
    }))["catch"](function() {
      var r = CommentScraper_asyncToGenerator(CommentScraper_regeneratorRuntime().mark((function _callee(r) {
        var o, u, p, v, b;
        return CommentScraper_regeneratorRuntime().wrap((function _callee$(y) {
          while (1) {
            switch (y.prev = y.next) {
             case 0:
              U.warn("[CommentScraper] JavDB 主线搜索失败 (".concat(r.message, ")，正在尝试第三方 API 备用线路..."));
              y.prev = 1;
              u = jbBuildSignature();
              p = "".concat(Me, "/v2/search");
              y.next = 6;
              return jbApiGetOnce(p, {
                "q": a,
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
                "jdsignature": u
              });

             case 6:
              v = y.sent;
              b = (v === null || v === void 0 || (o = v.data) === null || o === void 0 ? void 0 : o.movies) || [];
              if (!(b.length > 0 && b[0].id)) {
                y.next = 11;
                break;
              }
              U.log("[CommentScraper] 备用线路获取 JavDB movieId 成功: ".concat(b[0].id));
              return y.abrupt("return", {
                "movieId": b[0].id,
                "domain": l,
                "source": "api"
              });

             case 11:
              y.next = 16;
              break;

             case 13:
              y.prev = 13;
              y.t0 = y["catch"](1);
              U.error("[CommentScraper] JavDB 备用线路搜索亦失败:", y.t0);

             case 16:
              throw r;

             case 17:
             case "end":
              return y.stop();
            }
          }
        }), _callee, null, [ [ 1, 13 ] ]);
      })));
      return function(o) {
        return r.apply(this, arguments);
      };
    }());
  }
  function fetchJavdbData(r) {
    var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
    var a = arguments.length > 2 ? arguments[2] : void 0;
    if (!r) {
      return Promise.reject(new Error("Invalid MovieId"));
    }
    var l = a || oe[0] || "https://javdb.com";
    var u = "".concat(l, "/v/").concat(r, "/reviews?page=").concat(o);
    U.log("[CommentScraper] 尝试 JavDB 主线获取短评 (Page ".concat(o, "): ").concat(u));
    var p = function fetchMainLine() {
      return new Promise((function(r, a) {
        if (typeof GM_xmlhttpRequest === "undefined") {
          a(new Error("GM_xmlhttpRequest unavailable"));
          return;
        }
        GM_xmlhttpRequest({
          "method": "GET",
          "url": u,
          "timeout": 1e4,
          "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          "onload": function onload(u) {
            if (u.status === 403 || u.status === 503 || u.responseText && (u.responseText.includes("cf-challenge") || u.responseText.includes("Turnstile"))) {
              a(new Error("CF_SHIELD_ON_".concat(l)));
              return;
            }
            if (u.status === 404) {
              a(new Error("HTTP 404"));
              return;
            }
            if (u.status >= 200 && u.status < 300) {
              var p = (new DOMParser).parseFromString(u.responseText, "text/html");
              var v = p.querySelectorAll("dt.review-item");
              var b = [];
              v.forEach((function(r, a) {
                if (r.classList.contains("more")) {
                  return;
                }
                var l = r.querySelector(".review-title");
                if (!l) {
                  return;
                }
                var u = "匿名用户";
                var p = CommentScraper_createForOfIteratorHelper(l.childNodes), v;
                try {
                  for (p.s(); !(v = p.n()).done; ) {
                    var y = v.value;
                    if (y.nodeType === 3) {
                      var C = y.textContent.trim();
                      if (C.length > 0 && C.length < 30) {
                        u = C;
                        break;
                      }
                    }
                  }
                } catch (r) {
                  p.e(r);
                } finally {
                  p.f();
                }
                var k = l.querySelector(".time");
                var _ = k ? k.textContent.trim() : "";
                var E = l.querySelector(".score-stars");
                var S = 0;
                if (E) {
                  S = E.querySelectorAll("i.icon-star:not(.gray)").length;
                }
                var P = r.querySelector(".content p, .content");
                var D = P ? P.textContent.trim() : "";
                if (D) {
                  b.push({
                    "id": "javdb-html-".concat(o, "-").concat(a),
                    "user": u,
                    "time": _,
                    "text": D,
                    "score": S,
                    "isPending": false,
                    "site": "javdb"
                  });
                }
              }));
              var y = false;
              var C = p.querySelector(".pagination");
              if (C) {
                var k = C.querySelector('a.pagination-next, a[rel="next"], a.pagination-link[href*="page="]');
                if (k) {
                  y = true;
                }
              } else if (b.length >= 20) {
                y = true;
              }
              r({
                "comments": b,
                "totalCount": b.length,
                "hasMore": y,
                "source": "html"
              });
              return;
            }
            a(new Error("HTTP ".concat(u.status)));
          },
          "onerror": function onerror() {
            a(new Error("Network error"));
          },
          "ontimeout": function ontimeout() {
            a(new Error("Timeout"));
          }
        });
      }));
    };
    var v = function() {
      var a = CommentScraper_asyncToGenerator(CommentScraper_regeneratorRuntime().mark((function _callee2() {
        var a;
        var l, u, p, v, b, y;
        return CommentScraper_regeneratorRuntime().wrap((function _callee2$(C) {
          while (1) {
            switch (C.prev = C.next) {
             case 0:
              U.log("[CommentScraper] 自动无缝切换至 JavDB 备用 API (jdforrepam.com) 抓取短评...");
              l = jbBuildSignature();
              u = "".concat(Me, "/v1/movies/").concat(r, "/reviews");
              C.next = 5;
              return jbApiGetOnce(u, {
                "page": o,
                "sort_by": "hotly",
                "limit": 20
              }, {
                "jdSignature": l
              });

             case 5:
              p = C.sent;
              v = (p === null || p === void 0 || (a = p.data) === null || a === void 0 ? void 0 : a.reviews) || [];
              b = v.map((function(r, a) {
                var l = r.created_at ? new Date(r.created_at * 1e3).toLocaleDateString("zh-CN") : "";
                return {
                  "id": "javdb-api-".concat(o, "-").concat(r.id || a),
                  "user": r.username || "匿名用户",
                  "time": l,
                  "text": r.content || "",
                  "score": r.score || 0,
                  "likes": r.likes_count || 0,
                  "isPending": false,
                  "site": "javdb"
                };
              }));
              y = v.length >= 20;
              return C.abrupt("return", {
                "comments": b,
                "totalCount": b.length,
                "hasMore": y,
                "source": "api"
              });

             case 10:
             case "end":
              return C.stop();
            }
          }
        }), _callee2);
      })));
      return function fetchFallbackLine() {
        return a.apply(this, arguments);
      };
    }();
    return p()["catch"]((function(r) {
      if (r.message && r.message.startsWith("CF_SHIELD_ON_")) {
        return v()["catch"]((function() {
          return Promise.reject(r);
        }));
      }
      return v();
    }));
  }
  function CommentPanel_typeof(r) {
    "@babel/helpers - typeof";
    return CommentPanel_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, CommentPanel_typeof(r);
  }
  function CommentPanel_createForOfIteratorHelper(r, o) {
    var a = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!a) {
      if (Array.isArray(r) || (a = CommentPanel_unsupportedIterableToArray(r)) || o && r && "number" == typeof r.length) {
        a && (r = a);
        var l = 0, u = function F() {};
        return {
          "s": u,
          "n": function n() {
            return l >= r.length ? {
              "done": !0
            } : {
              "done": !1,
              "value": r[l++]
            };
          },
          "e": function e(r) {
            throw r;
          },
          "f": u
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var p, v = !0, b = !1;
    return {
      "s": function s() {
        a = a.call(r);
      },
      "n": function n() {
        var r = a.next();
        return v = r.done, r;
      },
      "e": function e(r) {
        b = !0, p = r;
      },
      "f": function f() {
        try {
          v || null == a["return"] || a["return"]();
        } finally {
          if (b) {
            throw p;
          }
        }
      }
    };
  }
  function CommentPanel_ownKeys(r, o) {
    var a = Object.keys(r);
    if (Object.getOwnPropertySymbols) {
      var l = Object.getOwnPropertySymbols(r);
      o && (l = l.filter((function(o) {
        return Object.getOwnPropertyDescriptor(r, o).enumerable;
      }))), a.push.apply(a, l);
    }
    return a;
  }
  function CommentPanel_objectSpread(r) {
    for (var o = 1; o < arguments.length; o++) {
      var a = null != arguments[o] ? arguments[o] : {};
      o % 2 ? CommentPanel_ownKeys(Object(a), !0).forEach((function(o) {
        CommentPanel_defineProperty(r, o, a[o]);
      })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(a)) : CommentPanel_ownKeys(Object(a)).forEach((function(o) {
        Object.defineProperty(r, o, Object.getOwnPropertyDescriptor(a, o));
      }));
    }
    return r;
  }
  function CommentPanel_toConsumableArray(r) {
    return CommentPanel_arrayWithoutHoles(r) || CommentPanel_iterableToArray(r) || CommentPanel_unsupportedIterableToArray(r) || CommentPanel_nonIterableSpread();
  }
  function CommentPanel_nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function CommentPanel_iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function CommentPanel_arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return CommentPanel_arrayLikeToArray(r);
    }
  }
  function CommentPanel_regeneratorRuntime() {
    "use strict";
    CommentPanel_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == CommentPanel_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(CommentPanel_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function CommentPanel_slicedToArray(r, o) {
    return CommentPanel_arrayWithHoles(r) || CommentPanel_iterableToArrayLimit(r, o) || CommentPanel_unsupportedIterableToArray(r, o) || CommentPanel_nonIterableRest();
  }
  function CommentPanel_nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function CommentPanel_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return CommentPanel_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? CommentPanel_arrayLikeToArray(r, o) : void 0;
    }
  }
  function CommentPanel_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function CommentPanel_iterableToArrayLimit(r, o) {
    var a = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != a) {
      var l, u, p, v, b = [], y = !0, C = !1;
      try {
        if (p = (a = a.call(r)).next, 0 === o) {
          if (Object(a) !== a) {
            return;
          }
          y = !1;
        } else {
          for (;!(y = (l = p.call(a)).done) && (b.push(l.value), b.length !== o); y = !0) {}
        }
      } catch (r) {
        C = !0, u = r;
      } finally {
        try {
          if (!y && null != a["return"] && (v = a["return"](), Object(v) !== v)) {
            return;
          }
        } finally {
          if (C) {
            throw u;
          }
        }
      }
      return b;
    }
  }
  function CommentPanel_arrayWithHoles(r) {
    if (Array.isArray(r)) {
      return r;
    }
  }
  function CommentPanel_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function CommentPanel_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          CommentPanel_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          CommentPanel_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function CommentPanel_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function CommentPanel_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, CommentPanel_toPropertyKey(l.key), l);
    }
  }
  function CommentPanel_createClass(r, o, a) {
    return o && CommentPanel_defineProperties(r.prototype, o), a && CommentPanel_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function CommentPanel_defineProperty(r, o, a) {
    return (o = CommentPanel_toPropertyKey(o)) in r ? Object.defineProperty(r, o, {
      "value": a,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : r[o] = a, r;
  }
  function CommentPanel_toPropertyKey(r) {
    var o = CommentPanel_toPrimitive(r, "string");
    return "symbol" == CommentPanel_typeof(o) ? o : o + "";
  }
  function CommentPanel_toPrimitive(r, o) {
    if ("object" != CommentPanel_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != CommentPanel_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  function parseCommentDate(r) {
    if (!r) {
      return 0;
    }
    var o = r.trim();
    if (/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}/.test(o)) {
      var a = new Date(o.replace(/-/g, "/"));
      if (!isNaN(a.getTime())) {
        return a.getTime();
      }
    }
    var l = Date.now();
    var u = o.match(/(\d+)/);
    if (!u) {
      if (o.includes("昨天") || o.includes("yesterday")) {
        return l - 24 * 60 * 60 * 1e3;
      }
      if (o.includes("前天")) {
        return l - 2 * 24 * 60 * 60 * 1e3;
      }
      return 0;
    }
    var p = parseInt(u[1], 10);
    if (o.includes("秒") || o.includes("second") || o.includes("sec")) {
      return l - p * 1e3;
    }
    if (o.includes("分") || o.includes("minute") || o.includes("min")) {
      return l - p * 60 * 1e3;
    }
    if (o.includes("小时") || o.includes("小時") || o.includes("hour") || o.includes("hr")) {
      return l - p * 60 * 60 * 1e3;
    }
    if (o.includes("天") || o.includes("day") || o.includes("d")) {
      return l - p * 24 * 60 * 60 * 1e3;
    }
    if (o.includes("周") || o.includes("週") || o.includes("week") || o.includes("w")) {
      return l - p * 7 * 24 * 60 * 60 * 1e3;
    }
    if (o.includes("月") || o.includes("month") || o.includes("mo")) {
      return l - p * 30 * 24 * 60 * 60 * 1e3;
    }
    if (o.includes("年") || o.includes("year") || o.includes("yr") || o.includes("y")) {
      return l - p * 365 * 24 * 60 * 60 * 1e3;
    }
    var v = new Date(o);
    if (!isNaN(v.getTime())) {
      return v.getTime();
    }
    return 0;
  }
  var Ae = function() {
    function CommentPanel(r, o) {
      var a = this;
      CommentPanel_classCallCheck(this, CommentPanel);
      this.playerCore = r;
      this.controlManager = o;
      this.uiElements = r.uiElements || o.uiElements;
      this.targetVideo = r.targetVideo;
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
      var l = function bindSiteProp(r, o, l) {
        Object.defineProperty(a, r, {
          "get": function get() {
            return a.sites[o][l];
          },
          "set": function set(r) {
            a.sites[o][l] = r;
          },
          "configurable": true,
          "enumerable": true
        });
      };
      [ "jable", "javlib", "javdb" ].forEach((function(r) {
        l("".concat(r, "Status"), r, "status");
        l("".concat(r, "Comments"), r, "comments");
        l("filtered".concat(r.charAt(0).toUpperCase() + r.slice(1), "Comments"), r, "filteredComments");
        l("".concat(r, "TotalCount"), r, "totalCount");
        l("".concat(r, "HasMore"), r, "hasMore");
        l("".concat(r, "CurrentPage"), r, "currentPage");
        l("".concat(r, "Collapsed"), r, "collapsed");
        l("".concat(r, "Loading"), r, "loading");
        l("".concat(r, "Unreachable"), r, "unreachable");
        l("".concat(r, "WorkingDomain"), r, "workingDomain");
      }));
      l("javlibVideoId", "javlib", "videoId");
      l("javdbMovieId", "javdb", "movieId");
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
      this.detectReachability();
      this.initDelegatedEvents();
      if (this.targetVideo) {
        this.handleMetadataLoadedBound = function() {
          return a.reprocessComments();
        };
        this.targetVideo.addEventListener("loadedmetadata", this.handleMetadataLoadedBound);
      }
    }
    return CommentPanel_createClass(CommentPanel, [ {
      "key": "detectReachability",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee() {
          var r, o, a, l, u;
          return CommentPanel_regeneratorRuntime().wrap((function _callee$(p) {
            while (1) {
              switch (p.prev = p.next) {
               case 0:
                p.prev = 0;
                p.next = 3;
                return Promise.all([ checkSiteReachability("JABLE"), checkSiteReachability("JAVLIBRARY"), checkSiteReachability("JAVDB") ]);

               case 3:
                r = p.sent;
                o = CommentPanel_slicedToArray(r, 3);
                a = o[0];
                l = o[1];
                u = o[2];
                this.jableUnreachable = !a;
                this.javlibUnreachable = !l;
                this.javdbUnreachable = !u;
                p.next = 15;
                break;

               case 13:
                p.prev = 13;
                p.t0 = p["catch"](0);

               case 15:
               case "end":
                return p.stop();
              }
            }
          }), _callee, this, [ [ 0, 13 ] ]);
        })));
        function detectReachability() {
          return r.apply(this, arguments);
        }
        return detectReachability;
      }()
    }, {
      "key": "setDimmed",
      "value": function setDimmed(r) {
        var o;
        if (!this.commentsPanel) {
          return;
        }
        var a = ((o = this.uiElements) === null || o === void 0 ? void 0 : o.handleContainer) || document.querySelector(".tm-handle-container");
        if (r) {
          this.commentsPanel.classList.add("is-dimmed");
          if (a) {
            a.classList.add("is-dimmed");
          }
        } else {
          this.commentsPanel.classList.remove("is-dimmed");
          if (a) {
            a.classList.remove("is-dimmed");
          }
        }
      }
    }, {
      "key": "applySettingsState",
      "value": function applySettingsState() {
        var r, o, a;
        var l = (r = this.playerCore) === null || r === void 0 || (r = r.options) === null || r === void 0 ? void 0 : r.playerState;
        if (!l) {
          return;
        }
        this.updateDebugMode((o = l.settings.debugMode) !== null && o !== void 0 ? o : false);
        this.updateCommentsVisibility((a = l.settings.showCommentsSection) !== null && a !== void 0 ? a : true);
      }
    }, {
      "key": "updateDebugMode",
      "value": function updateDebugMode(r) {
        if (!this.commentsPanel) {
          return;
        }
        var o = this.commentsPanel.querySelector(".tm-comments-panel-action-bar");
        if (o) {
          o.style.display = r ? "flex" : "none";
        }
      }
    }, {
      "key": "updateCommentsVisibility",
      "value": function updateCommentsVisibility(r) {
        var o, a, l;
        if (!this.commentsPanel) {
          return;
        }
        var u = (o = this.playerCore) === null || o === void 0 || (o = o.options) === null || o === void 0 ? void 0 : o.playerState;
        var p = this.commentsPanel.closest(".tm-player-container") || ((a = this.playerCore) === null || a === void 0 || (a = a.uiElements) === null || a === void 0 ? void 0 : a.playerContainer);
        var v = (l = this.playerCore) === null || l === void 0 ? void 0 : l.uiManager;
        if (p) {
          if (!r) {
            p.classList.add("tm-sidebar-hidden");
            this.commentsPanel.style.display = "none";
          } else {
            var b;
            this.commentsPanel.style.display = "flex";
            if (!(u !== null && u !== void 0 && (b = u.settings) !== null && b !== void 0 && b.sidebarHidden)) {
              p.classList.remove("tm-sidebar-hidden");
            }
          }
        }
        if (v && typeof v.updateSidebarButtonsVisibility === "function") {
          v.updateSidebarButtonsVisibility();
        }
        this.updateCommentSources();
      }
    }, {
      "key": "updateCommentSources",
      "value": function updateCommentSources() {
        var r, o, a = this;
        var l = (r = this.playerCore) === null || r === void 0 || (r = r.options) === null || r === void 0 ? void 0 : r.playerState;
        var u = (l === null || l === void 0 || (o = l.settings) === null || o === void 0 ? void 0 : o.enabledCommentSources) || {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        };
        [ "jable", "javlib", "javdb" ].forEach((function(r) {
          var o, l, p, v;
          var b = r === "javlib" ? u.javlib !== false && u.javlibrary !== false : u[r] !== false;
          var y = (o = a.commentsList) === null || o === void 0 ? void 0 : o.querySelector("#tm-comment-section-".concat(r));
          if (y) {
            y.style.display = b ? "block" : "none";
          }
          if (b && ((l = a.sites[r]) === null || l === void 0 || (l = l.comments) === null || l === void 0 ? void 0 : l.length) === 0 && ((p = a.sites[r]) === null || p === void 0 ? void 0 : p.status) !== "loading" && ((v = a.sites[r]) === null || v === void 0 ? void 0 : v.status) !== "loaded") {
            a.loadSiteComments(r, 1);
          }
        }));
        this.updateCommentsCount();
      }
    }, {
      "key": "initDelegatedEvents",
      "value": function initDelegatedEvents() {
        var r = this;
        if (!this.uiElements || !this.uiElements.playerContainer) {
          return;
        }
        this.uiElements.playerContainer.addEventListener("click", (function(o) {
          var a = o.target.closest(".jc-time-link");
          var l = o.target.closest(".jc-code-link");
          var u = o.target.closest(".tm-comment-retry-btn");
          var p = o.target.closest(".jc-toggle-expand-btn");
          if (a) {
            o.stopPropagation();
            var v = a.getAttribute("data-secs");
            if (v) {
              try {
                var b = JSON.parse(v);
                r.handleTimeClick(b);
              } catch (o) {
                var y = parseFloat(v);
                r.handleTimeClick(y);
              }
            }
          } else if (l) {
            o.stopPropagation();
            var C = l.getAttribute("data-code");
            if (C) {
              r.handleCodeClick(C);
            }
          } else if (u) {
            o.stopPropagation();
            r.handleRetry();
          }
        }));
      }
    }, {
      "key": "handleTimeClick",
      "value": function handleTimeClick(r) {
        var o = r;
        var a = false;
        if (Array.isArray(r)) {
          o = r[0];
          a = true;
        }
        if (this.targetVideo) {
          this.targetVideo.currentTime = o;
          this.targetVideo.play()["catch"]((function() {}));
          var l = a && r.length >= 2 ? "已跳转至区间 ".concat(formatSeconds(r[0]), " ~ ").concat(formatSeconds(r[1])) : "已跳转至 ".concat(formatSeconds(o));
          Toast(l, 2e3, "info");
          var u = this.getLoopManager();
          if (a && r.length >= 2 && u && typeof u.setLoopRange === "function") {
            u.setLoopRange(r[0], r[1]);
          }
          if (this.playerCore.uiManager) {
            this.playerCore.uiManager.showControls();
          }
          if (this.controlManager && typeof this.controlManager.showJumpHint === "function") {
            this.controlManager.showJumpHint(o);
          }
        }
      }
    }, {
      "key": "loadComments",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee2() {
          var r = this;
          var o, a, l, u, p, v, b, y = arguments;
          return CommentPanel_regeneratorRuntime().wrap((function _callee2$(C) {
            while (1) {
              switch (C.prev = C.next) {
               case 0:
                o = y.length > 0 && y[0] !== void 0 ? y[0] : 1;
                if (this.videoCode) {
                  C.next = 3;
                  break;
                }
                return C.abrupt("return");

               case 3:
                this.isLoading = true;
                if (!(o === 1)) {
                  C.next = 22;
                  break;
                }
                this.currentPage = 1;
                this.renderedCommentIds.clear();
                if (!this.jableCollapsed && !this.javlibCollapsed && !this.javdbCollapsed) {
                  this.javlibCollapsed = true;
                  this.javdbCollapsed = true;
                }
                u = (a = this.playerCore) === null || a === void 0 || (a = a.options) === null || a === void 0 ? void 0 : a.playerState;
                p = (u === null || u === void 0 || (l = u.settings) === null || l === void 0 ? void 0 : l.enabledCommentSources) || {
                  "jable": true,
                  "javdb": true,
                  "javlibrary": false
                };
                v = [];
                if (p.jable !== false) {
                  v.push(this.loadJableComments(1));
                }
                if (p.javlib !== false && p.javlibrary !== false) {
                  v.push(this.loadJavlibComments(1));
                }
                if (p.javdb !== false) {
                  v.push(this.loadJavdbComments(1));
                }
                this.renderCommentsList();
                setTimeout((function() {
                  return r.updateAllSiteLoginStatuses();
                }), 1500);
                C.next = 18;
                return Promise.allSettled(v);

               case 18:
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
                C.next = 30;
                break;

               case 22:
                b = [];
                if (this.jableHasMore && !this.jableCollapsed) {
                  b.push(this.loadJableComments(this.jableCurrentPage + 1));
                }
                if (this.javlibHasMore && !this.javlibCollapsed) {
                  b.push(this.loadJavlibComments(this.javlibCurrentPage + 1));
                }
                if (this.javdbHasMore && !this.javdbCollapsed) {
                  b.push(this.loadJavdbComments(this.javdbCurrentPage + 1));
                }
                if (!(b.length > 0)) {
                  C.next = 30;
                  break;
                }
                C.next = 29;
                return Promise.allSettled(b);

               case 29:
                this.currentPage = Math.max(this.jableCurrentPage, this.javlibCurrentPage, this.javdbCurrentPage);

               case 30:
                this.isLoading = false;

               case 31:
               case "end":
                return C.stop();
              }
            }
          }), _callee2, this);
        })));
        function loadComments() {
          return r.apply(this, arguments);
        }
        return loadComments;
      }()
    }, {
      "key": "loadSiteComments",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee3(r) {
          var o, a, l = this;
          var u, p, v, b, y, C, k, _, E, S, P, D, L, M, A, T, j, B, I, V, O, R, H, G, z, N, J, q, W, K, X, $, Q, Z, ee, te, ae, ie, se = arguments;
          return CommentPanel_regeneratorRuntime().wrap((function _callee3$(le) {
            while (1) {
              switch (le.prev = le.next) {
               case 0:
                u = se.length > 1 && se[1] !== void 0 ? se[1] : 1;
                if (this.videoCode) {
                  le.next = 3;
                  break;
                }
                return le.abrupt("return");

               case 3:
                p = this.sites[r];
                if (p) {
                  le.next = 6;
                  break;
                }
                return le.abrupt("return");

               case 6:
                v = (o = this.playerCore) === null || o === void 0 || (o = o.options) === null || o === void 0 ? void 0 : o.playerState;
                b = (v === null || v === void 0 || (a = v.settings) === null || a === void 0 ? void 0 : a.enabledCommentSources) || {
                  "jable": true,
                  "javdb": true,
                  "javlibrary": false
                };
                y = r === "javlib" ? b.javlib !== false && b.javlibrary !== false : b[r] !== false;
                if (y) {
                  le.next = 13;
                  break;
                }
                U.log("[CommentPanel] 站点 ".concat(r, " 在设置中已禁用，取消评论抓取。"));
                p.loading = false;
                return le.abrupt("return");

               case 13:
                if (!(r === "javlib" && isMobile())) {
                  le.next = 22;
                  break;
                }
                p.loading = false;
                p.status = "mobile_unsupported";
                p.comments = [];
                p.filteredComments = [];
                this.applyFilter();
                this.renderCommentsList();
                this.updateCommentsCount();
                return le.abrupt("return");

               case 22:
                p.loading = true;
                if (u === 1) {
                  p.status = "loading";
                  p.comments = [];
                  p.filteredComments = [];
                  p.totalCount = 0;
                  p.hasMore = false;
                  if (r === "javlib") {
                    this.javlibCfShield = false;
                    this.javlibFailedDomain = "";
                  }
                } else {
                  this.showBottomLoader(r);
                }
                le.prev = 24;
                if (!(r === "jable")) {
                  le.next = 34;
                  break;
                }
                if (u === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.jableCommentsPromise) {
                  U.log("[CommentPanel] 使用预加载的 Jable.tv 评论...");
                  k = CommentPanel.preloadCache.jableCommentsPromise;
                } else {
                  _ = 0;
                  E = "";
                  if (typeof GM_getValue === "function") {
                    try {
                      E = GM_getValue("mp_jable_working_domain", "");
                    } catch (r) {}
                  }
                  S = p.workingDomain || E;
                  if (S) {
                    P = ne.indexOf(S);
                    if (P !== -1) {
                      _ = P;
                    }
                  }
                  k = fetchJableComments(this.videoCode, u, _);
                }
                le.next = 29;
                return k;

               case 29:
                C = le.sent;
                this.jableVideoExists = true;
                if (C.domain) {
                  p.workingDomain = C.domain;
                  if (typeof GM_setValue === "function") {
                    try {
                      GM_setValue("mp_jable_working_domain", C.domain);
                    } catch (r) {}
                  }
                }
                le.next = 86;
                break;

               case 34:
                if (!(r === "javlib")) {
                  le.next = 69;
                  break;
                }
                le.next = 37;
                return Y.checkShadowActive("JAVLIBRARY");

               case 37:
                D = le.sent;
                if (!D) {
                  le.next = 44;
                  break;
                }
                U.log("[CommentPanel] 检测到 JAVLibrary 影子通道在线，优先通过影子协同获取数据...");
                le.next = 42;
                return Y.sendCommand("JAVLIBRARY", "FETCH_JAVLIB_DATA", {
                  "avcode": this.videoCode,
                  "page": u
                });

               case 42:
                L = le.sent;
                if (L) {
                  M = L.idResult, A = L.cRes, T = L.rRes;
                  p.videoId = M.videoId;
                  p.workingDomain = M.domain;
                  this.javlibVideoExists = true;
                  T.comments.forEach((function(r) {
                    r.site = "javlib-review";
                  }));
                  C = {
                    "comments": [].concat(CommentPanel_toConsumableArray(A.comments), CommentPanel_toConsumableArray(T.comments)),
                    "totalCount": A.totalCount + T.totalCount,
                    "hasMore": A.hasMore || T.hasMore
                  };
                } else {
                  U.log("[CommentPanel] JAVLibrary 影子通道同源抓取失败，降级为跨域直连抓取...");
                }

               case 44:
                if (C) {
                  le.next = 67;
                  break;
                }
                j = p.videoId;
                B = p.workingDomain;
                if (j) {
                  le.next = 56;
                  break;
                }
                if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibVideoIdPromise) {
                  U.log("[CommentPanel] 使用预加载的 JAVLibrary ID...");
                  I = CommentPanel.preloadCache.javlibVideoIdPromise;
                } else {
                  I = fetchJavLibraryVideoId(this.videoCode);
                }
                le.next = 51;
                return I;

               case 51:
                V = le.sent;
                j = V.videoId;
                B = V.domain;
                p.videoId = j;
                p.workingDomain = B;

               case 56:
                O = B || re[0];
                R = u === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibCommentsPromise ? CommentPanel.preloadCache.javlibCommentsPromise : fetchJavLibraryData(j, "comments", u, O);
                H = u === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javlibReviewsPromise ? CommentPanel.preloadCache.javlibReviewsPromise : fetchJavLibraryData(j, "reviews", u, O);
                le.next = 61;
                return Promise.all([ R["catch"]((function(r) {
                  U.warn("[CommentPanel] 获取 JAVLibrary 评论失败:", r);
                  throw r;
                })), H["catch"]((function(r) {
                  U.warn("[CommentPanel] 获取 JAVLibrary 文章失败:", r);
                  throw r;
                })) ]);

               case 61:
                G = le.sent;
                z = CommentPanel_slicedToArray(G, 2);
                N = z[0];
                J = z[1];
                J.comments.forEach((function(r) {
                  r.site = "javlib-review";
                }));
                C = {
                  "comments": [].concat(CommentPanel_toConsumableArray(N.comments), CommentPanel_toConsumableArray(J.comments)),
                  "totalCount": N.totalCount + J.totalCount,
                  "hasMore": N.hasMore || J.hasMore
                };

               case 67:
                le.next = 86;
                break;

               case 69:
                if (!(r === "javdb")) {
                  le.next = 86;
                  break;
                }
                q = p.movieId;
                W = p.workingDomain;
                if (q) {
                  le.next = 81;
                  break;
                }
                if (CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javdbMovieIdPromise) {
                  U.log("[CommentPanel] 使用预加载的 JavDB ID...");
                  K = CommentPanel.preloadCache.javdbMovieIdPromise;
                } else {
                  K = fetchJavdbMovieId(this.videoCode);
                }
                le.next = 76;
                return K;

               case 76:
                X = le.sent;
                q = X.movieId;
                W = X.domain;
                p.movieId = q;
                p.workingDomain = W;

               case 81:
                $ = W || oe[0];
                Q = u === 1 && CommentPanel.preloadCache.videoCode === this.videoCode && CommentPanel.preloadCache.javdbCommentsPromise ? CommentPanel.preloadCache.javdbCommentsPromise : fetchJavdbData(q, u, $);
                le.next = 85;
                return Q;

               case 85:
                C = le.sent;

               case 86:
                Z = this.targetVideo ? this.targetVideo.duration : 10800;
                ee = (C.comments || []).map((function(r, o) {
                  var a = processComment(r.text, l.videoCode, Z);
                  return CommentPanel_objectSpread(CommentPanel_objectSpread(CommentPanel_objectSpread({}, r), a), {}, {
                    "_timestamp": parseCommentDate(r.time),
                    "_originalIndex": (u - 1) * 50 + o
                  });
                }));
                if (u === 1) {
                  p.comments = ee;
                } else {
                  te = new Set(p.comments.map((function(r) {
                    return r.id;
                  })));
                  ae = ee.filter((function(r) {
                    return !te.has(r.id);
                  }));
                  p.comments = [].concat(CommentPanel_toConsumableArray(p.comments), CommentPanel_toConsumableArray(ae));
                }
                if (r === "jable") {
                  p.comments.sort((function(r, o) {
                    return (parseInt(o.id, 10) || 0) - (parseInt(r.id, 10) || 0);
                  }));
                }
                p.totalCount = C.totalCount || p.comments.length;
                p.hasMore = C.hasMore;
                p.status = p.comments.length === 0 ? "empty" : "loaded";
                p.currentPage = u;
                le.next = 101;
                break;

               case 96:
                le.prev = 96;
                le.t0 = le["catch"](24);
                U.warn("[CommentPanel] 获取 ".concat(p.name, " 评论失败:"), le.t0);
                if (r === "javlib") {
                  this.handleJavlibError(le.t0);
                } else {
                  ie = le.t0.message || "";
                  if (ie.includes("404") || ie.includes("not found")) {
                    if (r === "jable") {
                      this.jableVideoExists = false;
                    }
                    p.status = "not_found";
                  } else if (ie.includes("人机验证") || ie.startsWith("CF_SHIELD_ON_") || ie.includes("cf-challenge") || ie.includes("Cloudflare") || ie.includes("cloudflare")) {
                    p.status = "cf_shield";
                    if (r === "jable") {
                      this.jableFailedDomain = le.t0.domain || p.workingDomain || ne[0];
                    }
                  } else {
                    p.status = "unreachable";
                  }
                }
                if (u === 1) {
                  p.comments = [];
                  p.filteredComments = [];
                }

               case 101:
                le.prev = 101;
                p.loading = false;
                this.applyFilter();
                this.renderCommentsList();
                this.updateCommentsCount();
                this.hideBottomLoader(r);
                return le.finish(101);

               case 108:
               case "end":
                return le.stop();
              }
            }
          }), _callee3, this, [ [ 24, 96, 101, 108 ] ]);
        })));
        function loadSiteComments(o) {
          return r.apply(this, arguments);
        }
        return loadSiteComments;
      }()
    }, {
      "key": "loadJableComments",
      "value": function loadJableComments() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return this.loadSiteComments("jable", r);
      }
    }, {
      "key": "loadJavlibComments",
      "value": function loadJavlibComments() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return this.loadSiteComments("javlib", r);
      }
    }, {
      "key": "loadJavdbComments",
      "value": function loadJavdbComments() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        return this.loadSiteComments("javdb", r);
      }
    }, {
      "key": "handleJavlibError",
      "value": function handleJavlibError(r) {
        var o = r.message || "";
        if (o.startsWith("CF_SHIELD_ON_")) {
          this.javlibStatus = "cf_shield";
          this.javlibCfShield = true;
          this.javlibFailedDomain = o.replace("CF_SHIELD_ON_", "");
        } else if (o === "CLOUDFLARE_SHIELD") {
          this.javlibStatus = "cf_shield";
          this.javlibCfShield = true;
        } else if (o.includes("Movie not found") || o.includes("404")) {
          this.javlibStatus = "not_found";
        } else {
          this.javlibStatus = "unreachable";
        }
      }
    }, {
      "key": "handleCodeClick",
      "value": function handleCodeClick(r) {
        var o = this;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(r).then((function() {
            Toast("番号已复制: ".concat(r), 2e3, "success");
          }))["catch"]((function(a) {
            o.fallbackCopyText(r);
          }));
        } else {
          this.fallbackCopyText(r);
        }
      }
    }, {
      "key": "fallbackCopyText",
      "value": function fallbackCopyText(r) {
        try {
          var o = document.createElement("textarea");
          o.value = r;
          o.style.position = "fixed";
          o.style.opacity = "0";
          document.body.appendChild(o);
          o.select();
          document.execCommand("copy");
          document.body.removeChild(o);
          Toast("番号已复制: ".concat(r), 2e3, "success");
        } catch (o) {
          Toast("复制失败，请手动复制: ".concat(r), 3e3, "warning");
        }
      }
    }, {
      "key": "handleCopyAllComments",
      "value": function handleCopyAllComments() {
        var r = this.jableComments ? this.jableComments.length : 0;
        var o = this.javlibComments ? this.javlibComments.length : 0;
        if (r === 0 && o === 0) {
          Toast("暂无已加载的评论可复制", 2e3, "warning");
          return;
        }
        var a = [];
        a.push("=== Miss Player Comments Copy (AVCode: ".concat(this.videoCode || "unknown", ") ==="));
        a.push("Exported At: ".concat((new Date).toISOString()));
        a.push("Total Jable Comments: ".concat(r));
        a.push("Total JAVLibrary Comments: ".concat(o));
        a.push("");
        a.push("--- JABLE.TV COMMENTS ---");
        if (r === 0) {
          a.push("(No Jable comments loaded)");
        } else {
          this.jableComments.forEach((function(r, o) {
            a.push("[Comment #".concat(o + 1, "]"));
            a.push("User: ".concat(r.user));
            a.push("Time: ".concat(r.time));
            a.push("Spam: ".concat(r.spam.label).concat(r.spam.reason ? " (Reason: ".concat(r.spam.reason, ")") : ""));
            a.push("Content:");
            a.push(r.text);
            a.push("--------------------");
          }));
        }
        a.push("");
        a.push("--- JAVLIBRARY COMMENTS ---");
        if (o === 0) {
          a.push("(No JAVLibrary comments loaded)");
        } else {
          this.javlibComments.forEach((function(r, o) {
            a.push("[Comment #".concat(o + 1, "]"));
            a.push("User: ".concat(r.user));
            a.push("Time: ".concat(r.time));
            a.push("Spam: ".concat(r.spam.label).concat(r.spam.reason ? " (Reason: ".concat(r.spam.reason, ")") : ""));
            if (r.score) {
              a.push("Score: ".concat(r.score));
            }
            a.push("Content:");
            a.push(r.text);
            a.push("--------------------");
          }));
        }
        var l = a.join("\n");
        var u = function doCopy(r) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(r);
          } else {
            return new Promise((function(o, a) {
              try {
                var l = document.createElement("textarea");
                l.value = r;
                l.style.position = "fixed";
                l.style.opacity = "0";
                document.body.appendChild(l);
                l.select();
                var u = document.execCommand("copy");
                document.body.removeChild(l);
                if (u) {
                  o();
                } else {
                  a(new Error("execCommand failed"));
                }
              } catch (r) {
                a(r);
              }
            }));
          }
        };
        u(l).then((function() {
          Toast("所有已加载的原始评论已复制到剪贴板！", 2e3, "success");
        }))["catch"]((function(r) {
          Toast("复制失败，请尝试在浏览器控制台手动复制", 3e3, "error");
        }));
      }
    }, {
      "key": "showCloudflarePrompt",
      "value": function showCloudflarePrompt(r) {
        var o = r || "https://".concat(v.JAVLIBRARY.primary);
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
          this.errorElement.innerHTML = '\n                <div style="text-align: center; padding: 12px; font-size: 13px; color: hsl(var(--shadcn-destructive));">\n                    <p style="margin: 0 0 6px 0; font-weight: 600;">触发 JAVLibrary 防火墙验证</p>\n                    <p style="margin: 0 0 12px 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">需要您先去 JAVLibrary 完成人机验证以获得授权Cookie。</p>\n                    <a href="'.concat(o, '/cn/" target="_blank" class="tm-comments-verify-link" style="display: inline-block; padding: 6px 16px; font-size: 11px; background-color: hsl(var(--shadcn-blue)); color: white; border-radius: 14px; text-decoration: none; font-weight: 600; box-shadow: 0 2px 6px hsla(var(--shadcn-blue)/0.3); transition: all 0.2s;">去验证 (验证后返回重试)</a>\n                    <button class="tm-comment-retry-btn" style="display: block; margin: 10px auto 0 auto; padding: 4px 12px; font-size: 10px; background-color: hsla(var(--shadcn-muted) / 0.1); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 4px; cursor: pointer; transition: all 0.2s;">我已验证，点击重试</button>\n                </div>\n            ');
        }
      }
    }, {
      "key": "startJavlibBackgroundVerification",
      "value": function startJavlibBackgroundVerification(r) {
        var o = this;
        if (this.javlibAutoVerifyAttempted) {
          return;
        }
        this.javlibAutoVerifyAttempted = true;
        var a = r || "https://".concat(v.JAVLIBRARY.primary);
        U.log("尝试启动 JAVLibrary 后台验证，目标域名: ".concat(a));
        this.javlibVerifyingStatus = "verifying";
        this.renderCommentsList();
        this.startSignalListener();
        var l = "".concat(a, "/cn/?cf_verify=1");
        var u = Date.now();
        var p = (typeof GM_getValue === "function" ? GM_getValue("javlib_verifying_start_time") : 0) || 0;
        var b = typeof GM_getValue === "function" && GM_getValue("javlib_verifying") === true && u - p < 15e3;
        if (b) {
          U.log("监测到其他标签页已经在进行 JAVLibrary 验证，本标签页仅挂载监听器。");
        } else {
          U.log("无其他活跃验证标签页，尝试启动后台验证标签页。");
          if (typeof GM_setValue === "function") {
            GM_setValue("javlib_verifying", true);
            GM_setValue("javlib_verifying_start_time", u);
          }
          try {
            if (typeof GM_openInTab === "function") {
              this.javlibVerificationTab = GM_openInTab(l, {
                "active": false,
                "insert": true,
                "pinned": true
              });
              U.log("已通过 GM_openInTab 打开后台静默验证标签页。");
            } else if (typeof GM !== "undefined" && typeof GM.openInTab === "function") {
              var y = GM.openInTab(l, {
                "active": false,
                "insert": true,
                "pinned": true
              });
              if (y && typeof y.then === "function") {
                y.then((function(r) {
                  o.javlibVerificationTab = r;
                }))["catch"]((function(r) {
                  U.error("GM.openInTab 异步启动失败:", r);
                }));
              } else {
                this.javlibVerificationTab = y;
              }
              U.log("已通过 GM.openInTab 打开后台静默验证标签页。");
            } else {
              U.warn("GM_openInTab 和 GM.openInTab 均未定义，降级为手动验证。");
              this.handleJavlibVerificationTimeout(r);
              return;
            }
          } catch (o) {
            U.error("启动后台验证标签页失败:", o);
            this.handleJavlibVerificationTimeout(r);
            return;
          }
        }
        this.javlibVerificationTimeout = setTimeout((function() {
          U.warn("JAVLibrary 后台验证超时，切换至手动验证提示。");
          o.handleJavlibVerificationTimeout(r);
        }), 15e3);
      }
    }, {
      "key": "handleJavlibVerificationSuccess",
      "value": function handleJavlibVerificationSuccess() {
        this.cleanupJavlibVerification();
        this.javlibCfShield = false;
        this.javlibVerifyingStatus = "";
        this.handleRetry("javlib");
      }
    }, {
      "key": "handleJavlibVerificationTimeout",
      "value": function handleJavlibVerificationTimeout(r) {
        this.cleanupJavlibVerification(true);
        this.javlibVerifyingStatus = "manual";
        this.renderCommentsList();
      }
    }, {
      "key": "cleanupJavlibVerification",
      "value": function cleanupJavlibVerification() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (this.javlibVerificationTimeout) {
          clearTimeout(this.javlibVerificationTimeout);
          this.javlibVerificationTimeout = null;
        }
        if (!r) {
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
          U.log("保持后台验证标签页存活，充当影子 Broker。");
          this.javlibVerificationTab = null;
        }
        if (typeof GM_setValue === "function") {
          GM_setValue("javlib_verifying", false);
        }
      }
    }, {
      "key": "startSignalListener",
      "value": function startSignalListener() {
        var r = this;
        if (this.javlibVerifiedListenerId || this.javlibVerifiedPollInterval) {
          return;
        }
        if (typeof GM_addValueChangeListener === "function") {
          this.javlibVerifiedListenerId = GM_addValueChangeListener("javlib_verified_time", (function(o, a, l, u) {
            U.log("监听到 JAVLibrary 验证成功信号 (监听器)！");
            r.handleJavlibVerificationSuccess();
          }));
        } else {
          U.log("GM_addValueChangeListener 未定义，使用轮询方式监听验证信号。");
          var o = (typeof GM_getValue === "function" ? GM_getValue("javlib_verified_time") : 0) || 0;
          this.javlibVerifiedPollInterval = setInterval((function() {
            var a = (typeof GM_getValue === "function" ? GM_getValue("javlib_verified_time") : 0) || 0;
            if (a > o) {
              U.log("通过轮询监听到 JAVLibrary 验证成功信号！");
              r.handleJavlibVerificationSuccess();
            }
          }), 1e3);
        }
      }
    }, {
      "key": "applyFilter",
      "value": function applyFilter() {
        if (this.filterSpam) {
          this.filteredJableComments = this.jableComments.filter((function(r) {
            return r.spam.label !== "SPAM";
          }));
          this.filteredJavlibComments = this.javlibComments.filter((function(r) {
            return r.spam.label !== "SPAM";
          }));
          this.filteredJavdbComments = this.javdbComments.filter((function(r) {
            return r.spam.label !== "SPAM";
          }));
        } else {
          this.filteredJableComments = this.jableComments;
          this.filteredJavlibComments = this.javlibComments;
          this.filteredJavdbComments = this.javdbComments;
        }
        this.filteredComments = [].concat(CommentPanel_toConsumableArray(this.filteredJableComments), CommentPanel_toConsumableArray(this.filteredJavlibComments), CommentPanel_toConsumableArray(this.filteredJavdbComments));
        this.comments = [].concat(CommentPanel_toConsumableArray(this.jableComments), CommentPanel_toConsumableArray(this.javlibComments), CommentPanel_toConsumableArray(this.javdbComments));
      }
    }, {
      "key": "createCommentRow",
      "value": function createCommentRow() {
        var r = this;
        this.commentsPanel = document.createElement("div");
        this.commentsPanel.className = "tm-comments-panel";
        this.commentsPanel.innerHTML = '\n            <div class="tm-comments-list tm-comments-panel-list"></div>\n            <div class="tm-comment-loading tm-comments-panel-loading" style="display: none;"></div>\n            <div class="tm-comment-error tm-comments-panel-error" style="display: none;"></div>\n            <div class="tm-comment-submit-bar-wrapper">\n                <div class="tm-comment-tag-select-modal">\n                    <div class="tm-tag-select-header">\n                        <div class="tm-tag-select-btn-group">\n                            <button type="button" class="tm-tag-select-all-btn">全选</button>\n                            <button type="button" class="tm-tag-deselect-all-btn">取消全选</button>\n                        </div>\n                        <button type="button" class="tm-tag-select-close-btn" title="关闭">✕</button>\n                    </div>\n                    <div class="tm-tag-select-list"></div>\n                </div>\n                <div class="tm-comment-submit-bar">\n                    <button type="button" class="tm-comment-add-tag-btn" title="插入/勾选高光标签">\n                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg>\n                    </button>\n                    <input type="text" class="tm-comment-text-input" placeholder="Comment" />\n                    <button type="button" class="tm-comment-send-btn">'.concat(__("send"), '</button>\n                </div>\n            </div>\n            <div class="tm-comments-panel-action-bar" style="display: none;">\n                <div class="tm-action-bar-left">\n                    <span class="tm-comment-count">共 0 条评论</span>\n                    <button class="tm-comment-copy-all-btn" title="一键复制所有加载的原始评论">').concat(__("commentsCopyAll"), '</button>\n                </div>\n                <div class="tm-action-bar-right">\n                    <label class="tm-comment-filter-label">\n                        <input type="checkbox" class="tm-comment-filter-checkbox" ').concat(this.filterSpam ? "checked" : "", " />\n                        <span>").concat(__("commentsFilterSpam"), '</span>\n                    </label>\n                </div>\n            </div>\n            <button class="tm-show-controls-float-btn" title="显示控制面板">').concat(V, "</button>\n        ");
        this.commentsList = this.commentsPanel.querySelector(".tm-comments-list");
        this.loadingElement = this.commentsPanel.querySelector(".tm-comment-loading");
        this.errorElement = this.commentsPanel.querySelector(".tm-comment-error");
        this.countSpan = this.commentsPanel.querySelector(".tm-comment-count");
        this.filterCheckbox = this.commentsPanel.querySelector(".tm-comment-filter-checkbox");
        this.initCommentSubmitBar();
        if (this.filterCheckbox) {
          this.filterCheckbox.addEventListener("change", (function(o) {
            r.filterSpam = o.target.checked;
            r.applyFilter();
            r.renderCommentsList();
          }));
        }
        var o = this.commentsPanel.querySelector(".tm-show-controls-float-btn");
        if (o) {
          o.addEventListener("click", (function(o) {
            o.stopPropagation();
            if (r.playerCore.uiManager) {
              r.playerCore.uiManager.showControls();
              r.playerCore.uiManager.autoHideControls();
            }
          }));
        }
        var a = this.commentsPanel.querySelector(".tm-comment-copy-all-btn");
        if (a) {
          a.addEventListener("click", (function(o) {
            o.stopPropagation();
            r.handleCopyAllComments();
          }));
        }
        this.applySettingsState();
        var l = function hideControlsOnScroll() {
          if (r.playerCore.uiManager && r.playerCore.uiManager.controlsVisible) {
            if (r.playerCore.uiManager.isFloatingControlPanel) {
              return;
            }
            r.playerCore.uiManager.hideControls(true);
          }
        };
        this.commentsList.addEventListener("touchmove", l, {
          "passive": true
        });
        this.commentsList.addEventListener("wheel", (function(o) {
          l();
          var a = o.target.closest(".tm-comment-section-body");
          var u = !a || a.scrollTop <= 5;
          if (o.deltaY < 0 && u) {
            r.updatePosition();
          }
        }), {
          "passive": true
        });
        var u = false;
        this.commentsList.addEventListener("scroll", (function(o) {
          var a = o.target;
          if (!a || !a.classList.contains("tm-comment-section-body")) {
            return;
          }
          if (u) {
            return;
          }
          u = true;
          requestAnimationFrame((function() {
            u = false;
            var o = a.closest(".tm-comment-section");
            if (o) {
              if (a.scrollHeight - a.scrollTop - a.clientHeight < 500) {
                if (o.id === "tm-comment-section-jable") {
                  r.triggerLoadMoreJable();
                } else if (o.id === "tm-comment-section-javlib") {
                  r.triggerLoadMoreJavlib();
                } else if (o.id === "tm-comment-section-javdb") {
                  r.triggerLoadMoreJavdb();
                }
              }
            }
          }));
        }), {
          "capture": true,
          "passive": true
        });
        var p = 0;
        this.commentsList.addEventListener("touchstart", (function(r) {
          p = r.touches[0].clientY;
        }), {
          "passive": true
        });
        this.commentsList.addEventListener("touchmove", (function(o) {
          var a = o.touches[0].clientY;
          var l = p - a;
          var u = o.target.closest(".tm-comment-section-body");
          var v = u ? u.scrollHeight - u.scrollTop - u.clientHeight < 500 : false;
          var b = u ? u.scrollTop <= 5 : true;
          if (l > 15 && v && u) {
            var y = u.closest(".tm-comment-section");
            if (y) {
              if (y.id === "tm-comment-section-jable") {
                r.triggerLoadMoreJable();
              } else if (y.id === "tm-comment-section-javlib") {
                r.triggerLoadMoreJavlib();
              } else if (y.id === "tm-comment-section-javdb") {
                r.triggerLoadMoreJavdb();
              }
            }
          }
          if (l < -15 && b) {
            r.updatePosition();
          }
        }), {
          "passive": true
        });
        if (this.uiElements && this.uiElements.playerContainer) {
          var v = this.uiElements.handleContainer;
          if (v && v.parentNode === this.uiElements.playerContainer) {
            this.uiElements.playerContainer.insertBefore(this.commentsPanel, v.nextSibling);
          } else {
            this.uiElements.playerContainer.appendChild(this.commentsPanel);
          }
        }
        this.commentsPanel.addEventListener("click", (function(o) {
          var a = o.target.closest("a, button, input, label, .jc-time-link, .jc-code-link, .jc-toggle-expand-btn, .tm-comment-retry-btn");
          var l = o.target.closest(".jc-toggle-expand-btn");
          var u = o.target.closest(".jc-body-text--collapsible");
          if (l && u) {
            o.stopPropagation();
            var p = u.getAttribute("data-collapsed") === "true";
            u.setAttribute("data-collapsed", p ? "false" : "true");
            l.textContent = p ? __("commentsCollapse") || "收起" : __("commentsExpand") || "展开";
            return;
          }
          if (u && !a) {
            var v = u.getAttribute("data-collapsed") === "true";
            if (v) {
              o.stopPropagation();
              u.setAttribute("data-collapsed", "false");
              var b = u.querySelector(".jc-toggle-expand-btn");
              if (b) {
                b.textContent = __("commentsCollapse") || "收起";
              }
              return;
            }
          }
          if (a) {
            return;
          }
          o.stopPropagation();
          if (r.playerCore.uiManager) {
            if (r.playerCore.uiManager.isFloatingControlPanel) {
              r.commentsPanel.classList.remove("is-dimmed");
              return;
            }
            if (r.playerCore.uiManager.controlsVisible) {
              r.playerCore.uiManager.hideControls(true);
            }
          }
        }));
        var b = function handleCommentTouchStart(o) {
          if (!r.playerCore.uiManager) {
            return;
          }
          var a = o.target.closest(".tm-show-controls-float-btn");
          if (!a) {
            var l = r.commentsPanel.querySelector(".tm-show-controls-float-btn");
            if (l && window.getComputedStyle(l).display !== "none") {
              var u = l.getBoundingClientRect();
              var p = o.touches && o.touches[0] || o.changedTouches && o.changedTouches[0];
              var v = p ? p.clientX : o.clientX;
              var b = p ? p.clientY : o.clientY;
              if (v >= u.left && v <= u.right && b >= u.top && b <= u.bottom) {
                a = l;
              }
            }
          }
          if (a) {
            r.commentsPanel.classList.remove("is-dimmed");
            r.playerCore.uiManager.showControls();
            r.playerCore.uiManager.autoHideControls();
            if (o.cancelable) {
              o.preventDefault();
            }
            o.stopPropagation();
            return;
          }
          if (r.commentsPanel.classList.contains("is-dimmed")) {
            r.setDimmed(false);
            if (!r.playerCore.uiManager.isLandscape) {
              r.playerCore.uiManager.hideControls(true);
            }
            if (o.cancelable) {
              o.preventDefault();
            }
            o.stopPropagation();
            return;
          }
          var y = r.playerCore.uiManager.isFloatingControlPanel;
          var C = r.playerCore.uiManager.controlsVisible;
          if (y) {
            r.setDimmed(false);
          } else if (C) {
            if (!o.target.closest(".jc-time-link")) {
              r.playerCore.uiManager.hideControls(true);
            }
          }
        };
        this.commentsPanel.addEventListener("touchstart", b, {
          "passive": false
        });
        this.commentsPanel.addEventListener("mousedown", b, {
          "passive": false
        });
        this.commentsPanel.addEventListener("mouseenter", (function() {
          if (r.playerCore.uiManager && r.playerCore.uiManager.isFloatingControlPanel) {
            r.setDimmed(false);
          }
        }));
        this.commentsPanel.addEventListener("mouseleave", (function() {
          if (r.playerCore.uiManager && r.playerCore.uiManager.isFloatingControlPanel && r.playerCore.uiManager.controlsVisible) {
            r.setDimmed(true);
          }
        }));
        [ "touchstart", "touchend" ].forEach((function(o) {
          r.commentsPanel.addEventListener(o, (function(r) {
            r.stopPropagation();
          }), {
            "passive": true
          });
        }));
        this.updatePosition();
        setTimeout((function() {
          return r.updatePosition();
        }), 300);
        this.videoCode = getVideoCodeFromUrl();
        if (this.videoCode) {
          U.log("[CommentPanel] 提取到当前视频番号: ".concat(this.videoCode, "，开始采集..."));
          this.loadComments(1);
        } else {
          U.warn("[CommentPanel] 无法从当前URL解析到视频番号。");
          if (this.commentsList) {
            this.commentsList.innerHTML = '<div class="tm-comment-error">无法解析视频番号，暂不支持展示评论。</div>';
          }
        }
        if (typeof ResizeObserver !== "undefined" && this.commentsPanel) {
          var y = new ResizeObserver((function(o) {
            var a = CommentPanel_createForOfIteratorHelper(o), l;
            try {
              for (a.s(); !(l = a.n()).done; ) {
                var u = l.value;
                if (u.contentRect.height > 0) {
                  r.checkViewportFill();
                }
              }
            } catch (r) {
              a.e(r);
            } finally {
              a.f();
            }
          }));
          y.observe(this.commentsPanel);
          this.commentsPanelResizeObserver = y;
        }
        var C = document.createElement("div");
        C.className = "tm-comment-row-placeholder";
        C.style.display = "none";
        return C;
      }
    }, {
      "key": "showDevelopmentModal",
      "value": function showDevelopmentModal() {
        var r = document.createElement("div");
        r.className = "tm-custom-modal-overlay";
        r.innerHTML = '\n            <div class="tm-custom-modal-content">\n                <div class="tm-custom-modal-title">提示</div>\n                <div class="tm-custom-modal-message">评论功能开发中</div>\n                <button class="tm-custom-modal-close-btn">确定</button>\n            </div>\n        ';
        document.body.appendChild(r);
        requestAnimationFrame((function() {
          r.classList.add("active");
        }));
        var o = r.querySelector(".tm-custom-modal-close-btn");
        var a = function closeModal() {
          r.classList.remove("active");
          r.addEventListener("transitionend", (function() {
            r.remove();
          }), {
            "once": true
          });
        };
        o.addEventListener("click", a);
        r.addEventListener("click", (function(o) {
          if (o.target === r) {
            a();
          }
        }));
      }
    }, {
      "key": "getLoopManager",
      "value": function getLoopManager() {
        var r, o, a;
        return ((r = this.playerCore) === null || r === void 0 || (r = r.controlManager) === null || r === void 0 ? void 0 : r.loopManager) || ((o = this.playerCore) === null || o === void 0 ? void 0 : o.loopManager) || ((a = this.playerCore) === null || a === void 0 || (a = a.customVideoPlayer) === null || a === void 0 || (a = a.managers) === null || a === void 0 ? void 0 : a.loopManager) || null;
      }
    }, {
      "key": "getTabs",
      "value": function getTabs() {
        var r = this.getLoopManager();
        return r && Array.isArray(r.tabs) ? r.tabs : [];
      }
    }, {
      "key": "checkCanComment",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee4() {
          var r = this;
          var o, a;
          return CommentPanel_regeneratorRuntime().wrap((function _callee4$(l) {
            while (1) {
              switch (l.prev = l.next) {
               case 0:
                if (this.videoCode) {
                  l.next = 3;
                  break;
                }
                Toast("无法获取影片番号，无法发表评论", 2e3, "error");
                return l.abrupt("return", null);

               case 3:
                o = this.jableWorkingDomain || ne[0];
                a = "".concat(o, "/videos/").concat(this.videoCode.toLowerCase().trim(), "/");
                return l.abrupt("return", new Promise((function(l) {
                  var u = false;
                  var p = setTimeout((function() {
                    if (!u) {
                      u = true;
                      if (v && typeof v.abort === "function") {
                        try {
                          v.abort();
                        } catch (r) {}
                      }
                      Toast("检测评论环境超时，请稍后重试", 2e3, "error");
                      l(null);
                    }
                  }), 6e3);
                  var v = GM_xmlhttpRequest({
                    "method": "GET",
                    "url": a,
                    "timeout": 6e3,
                    "headers": {
                      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                      "referer": o,
                      "User-Agent": navigator.userAgent
                    },
                    "onload": function onload(v) {
                      if (u) {
                        return;
                      }
                      u = true;
                      clearTimeout(p);
                      if (v.status === 404) {
                        r.jableVideoExists = false;
                        r.showTipModal("提示", "该影片在 Jable.tv 上未发布，无法发表评论。");
                        l(null);
                        return;
                      }
                      if (v.status >= 200 && v.status < 300) {
                        r.jableVideoExists = true;
                        var b = v.responseText;
                        var y = (new DOMParser).parseFromString(b, "text/html");
                        var C = Array.from(y.querySelectorAll("form")).find((function(r) {
                          return r.querySelector('input[name="action"][value="add_comment"]') || r.querySelector('input[name="action"][value="add_comment_video"]');
                        })) || y.querySelector('form[id*="comment"]') || y.querySelector('form[action*="comment"]');
                        if (!C) {
                          r.showLoginPromptModal(o);
                          l(null);
                        } else {
                          l({
                            "commentForm": C,
                            "targetUrl": a,
                            "domain": o
                          });
                        }
                      } else {
                        Toast("检测失败: HTTP ".concat(v.status), 2e3, "error");
                        l(null);
                      }
                    },
                    "onerror": function onerror(r) {
                      if (u) {
                        return;
                      }
                      u = true;
                      clearTimeout(p);
                      U.error("[CommentPanel] 检测 Jable 失败:", r);
                      Toast("网络请求失败，请稍后重试", 2e3, "error");
                      l(null);
                    },
                    "ontimeout": function ontimeout() {
                      if (u) {
                        return;
                      }
                      u = true;
                      clearTimeout(p);
                      Toast("网络请求超时，请稍后重试", 2e3, "error");
                      l(null);
                    }
                  });
                })));

               case 6:
               case "end":
                return l.stop();
              }
            }
          }), _callee4, this);
        })));
        function checkCanComment() {
          return r.apply(this, arguments);
        }
        return checkCanComment;
      }()
    }, {
      "key": "initCommentSubmitBar",
      "value": function initCommentSubmitBar() {
        var r = this;
        if (!this.commentsPanel) {
          return;
        }
        this.selectedTagIds = new Set;
        var o = this.commentsPanel.querySelector(".tm-comment-add-tag-btn");
        var a = this.commentsPanel.querySelector(".tm-comment-text-input");
        var l = this.commentsPanel.querySelector(".tm-comment-send-btn");
        var u = this.commentsPanel.querySelector(".tm-comment-tag-select-modal");
        var p = this.commentsPanel.querySelector(".tm-tag-select-all-btn");
        var v = this.commentsPanel.querySelector(".tm-tag-deselect-all-btn");
        var b = this.commentsPanel.querySelector(".tm-tag-select-close-btn");
        var y = this.commentsPanel.querySelector(".tm-tag-select-list");
        this.commentInput = a;
        this.tagSelectModal = u;
        this.tagSelectList = y;
        if (a) {
          var C = function stopProp(r) {
            return r.stopPropagation();
          };
          a.addEventListener("keydown", C);
          a.addEventListener("keyup", C);
          a.addEventListener("keypress", C);
          a.addEventListener("mousedown", C);
          a.addEventListener("touchstart", C);
          a.addEventListener("focus", (function() {
            r.checkCanComment();
          }));
          a.addEventListener("keydown", (function(r) {
            if (r.key === "Enter") {
              r.preventDefault();
              l === null || l === void 0 || l.click();
            }
          }));
        }
        if (o) {
          o.addEventListener("click", (function(o) {
            o.stopPropagation();
            r.toggleTagSelectModal();
          }));
        }
        if (l) {
          l.addEventListener("click", function() {
            var o = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee5(o) {
              var a;
              return CommentPanel_regeneratorRuntime().wrap((function _callee5$(u) {
                while (1) {
                  switch (u.prev = u.next) {
                   case 0:
                    o.stopPropagation();
                    l.disabled = true;
                    u.next = 4;
                    return r.checkCanComment();

                   case 4:
                    a = u.sent;
                    l.disabled = false;
                    if (a) {
                      u.next = 8;
                      break;
                    }
                    return u.abrupt("return");

                   case 8:
                    r.handleSendComment();

                   case 9:
                   case "end":
                    return u.stop();
                  }
                }
              }), _callee5);
            })));
            return function(r) {
              return o.apply(this, arguments);
            };
          }());
        }
        if (p) {
          p.addEventListener("click", (function(o) {
            o.stopPropagation();
            var a = r.getTabs();
            r.selectedTagIds = new Set(a.map((function(r) {
              return r.id;
            })));
            r.renderTagSelectList();
          }));
        }
        if (v) {
          v.addEventListener("click", (function(o) {
            o.stopPropagation();
            r.selectedTagIds.clear();
            r.renderTagSelectList();
          }));
        }
        if (b) {
          b.addEventListener("click", (function(o) {
            o.stopPropagation();
            r.closeTagSelectModal();
          }));
        }
      }
    }, {
      "key": "toggleTagSelectModal",
      "value": function toggleTagSelectModal() {
        if (!this.tagSelectModal) {
          return;
        }
        if (this.tagSelectModal.classList.contains("visible")) {
          this.closeTagSelectModal();
        } else {
          this.openTagSelectModal();
        }
      }
    }, {
      "key": "openTagSelectModal",
      "value": function openTagSelectModal() {
        if (!this.tagSelectModal) {
          return;
        }
        var r = this.getTabs();
        if (this.selectedTagIds.size === 0 && r.length > 0) {
          this.selectedTagIds = new Set(r.map((function(r) {
            return r.id;
          })));
        }
        this.renderTagSelectList();
        this.tagSelectModal.classList.add("visible");
      }
    }, {
      "key": "closeTagSelectModal",
      "value": function closeTagSelectModal() {
        if (!this.tagSelectModal) {
          return;
        }
        this.tagSelectModal.classList.remove("visible");
      }
    }, {
      "key": "renderTagSelectList",
      "value": function renderTagSelectList() {
        var r = this;
        if (!this.tagSelectList) {
          return;
        }
        this.tagSelectList.innerHTML = "";
        var o = this.getTabs();
        var a = this.getLoopManager();
        if (o.length === 0) {
          var l = document.createElement("div");
          l.className = "tm-tag-select-empty";
          l.textContent = "暂无时间戳标签，可在播放控制器添加";
          this.tagSelectList.appendChild(l);
          return;
        }
        o.forEach((function(o, l) {
          var u = a ? a.tabColors[l % a.tabColors.length] : "200, 100%, 55%";
          var p = document.createElement("div");
          p.className = "tm-tag-select-item";
          var v = document.createElement("input");
          v.type = "checkbox";
          v.className = "tm-tag-checkbox";
          v.checked = r.selectedTagIds.has(o.id);
          v.addEventListener("change", (function(a) {
            a.stopPropagation();
            if (v.checked) {
              r.selectedTagIds.add(o.id);
            } else {
              r.selectedTagIds["delete"](o.id);
            }
          }));
          var b = document.createElement("div");
          b.className = "tm-sheet-item-time-container";
          if (o.type === "highlight") {
            var y = document.createElement("button");
            y.type = "button";
            y.className = "tm-sheet-time-pill";
            y.style.setProperty("--tab-color", u);
            y.textContent = formatSeconds(o.startTime);
            b.appendChild(y);
          } else {
            var C = document.createElement("div");
            C.className = "tm-sheet-time-pill interval";
            C.style.setProperty("--tab-color", u);
            var k = document.createElement("span");
            k.className = "tm-time-part start";
            k.textContent = formatSeconds(o.startTime);
            var _ = document.createElement("span");
            _.className = "tm-time-sep";
            _.textContent = "~";
            var E = document.createElement("span");
            E.className = "tm-time-part end";
            E.textContent = formatSeconds(o.endTime);
            C.appendChild(k);
            C.appendChild(_);
            C.appendChild(E);
            b.appendChild(C);
          }
          var S = document.createElement("input");
          S.type = "text";
          S.className = "tm-tag-remark-input";
          S.placeholder = "添加备注...";
          S.value = o.comment || "";
          var P = function stopProp(r) {
            return r.stopPropagation();
          };
          S.addEventListener("keydown", P);
          S.addEventListener("keyup", P);
          S.addEventListener("keypress", P);
          S.addEventListener("mousedown", P);
          S.addEventListener("touchstart", P);
          S.addEventListener("input", (function(r) {
            o.comment = r.target.value;
            if (a) {
              a._saveTabs();
              a.renderTabs();
            }
          }));
          S.addEventListener("change", (function() {
            if (a) {
              a._saveTabs();
              a.renderTabs();
            }
          }));
          p.appendChild(v);
          p.appendChild(b);
          p.appendChild(S);
          r.tagSelectList.appendChild(p);
        }));
      }
    }, {
      "key": "handleSendComment",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee6() {
          var r = this;
          var o, a, l, u, p;
          return CommentPanel_regeneratorRuntime().wrap((function _callee6$(v) {
            while (1) {
              switch (v.prev = v.next) {
               case 0:
                o = this.getTabs();
                a = o.filter((function(o) {
                  return r.selectedTagIds.has(o.id);
                }));
                l = (this.commentInput ? this.commentInput.value : "").trim();
                if (!(a.length === 0 && !l)) {
                  v.next = 6;
                  break;
                }
                Toast("请勾选时间戳标签或输入评论内容", 2e3, "warning");
                return v.abrupt("return");

               case 6:
                u = [];
                a.forEach((function(r) {
                  var o = (r.comment || "").trim();
                  var a = o ? " ".concat(o, " ；") : " ；";
                  if (r.type === "highlight") {
                    var l = formatSeconds(r.startTime);
                    u.push("[".concat(l, "]").concat(a));
                  } else {
                    var p = formatSeconds(r.startTime);
                    var v = formatSeconds(r.endTime);
                    u.push("[".concat(p, " ~ ").concat(v, "]").concat(a));
                  }
                }));
                if (l) {
                  u.push(l);
                }
                p = u.join("\n");
                v.next = 12;
                return this.submitComment(p);

               case 12:
               case "end":
                return v.stop();
              }
            }
          }), _callee6, this);
        })));
        function handleSendComment() {
          return r.apply(this, arguments);
        }
        return handleSendComment;
      }()
    }, {
      "key": "submitComment",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee7(r) {
          var o = this;
          var a, l, u, p, v, b, y, C;
          return CommentPanel_regeneratorRuntime().wrap((function _callee7$(k) {
            while (1) {
              switch (k.prev = k.next) {
               case 0:
                k.next = 2;
                return this.checkCanComment();

               case 2:
                a = k.sent;
                if (a) {
                  k.next = 5;
                  break;
                }
                return k.abrupt("return");

               case 5:
                l = a.commentForm, u = a.targetUrl, p = a.domain;
                v = this.commentsPanel.querySelector(".tm-comment-send-btn");
                if (v) {
                  v.disabled = true;
                  v.textContent = "Sending...";
                }
                b = function resetBtn() {
                  if (v) {
                    v.disabled = false;
                    v.textContent = __("send");
                  }
                };
                y = window.loginManager && window.loginManager.providers.find((function(r) {
                  return r.domains.some((function(r) {
                    return p.includes(r);
                  }));
                }));
                k.prev = 10;
                C = false;
                if (!(y && typeof y.publishComment === "function")) {
                  k.next = 18;
                  break;
                }
                k.next = 15;
                return y.publishComment(r, {
                  "videoCode": this.videoCode,
                  "commentForm": l,
                  "targetUrl": u,
                  "domain": p
                });

               case 15:
                C = k.sent;
                k.next = 21;
                break;

               case 18:
                k.next = 20;
                return new Promise((function(o) {
                  var a = new URLSearchParams;
                  l.querySelectorAll("input").forEach((function(r) {
                    if (r.name && r.type !== "submit") {
                      a.append(r.name, r.value);
                    }
                  }));
                  var v = l.querySelector("textarea");
                  var b = v ? v.name : "comment";
                  a.append(b, r);
                  var y = l.getAttribute("action") || "";
                  if (y.startsWith("/")) {
                    y = "".concat(p).concat(y);
                  } else if (!y.startsWith("http")) {
                    y = u;
                  }
                  U.log("[CommentPanel] 正在提交评论: ".concat(y));
                  GM_xmlhttpRequest({
                    "method": "POST",
                    "url": y,
                    "headers": {
                      "Content-Type": "application/x-www-form-urlencoded",
                      "referer": u,
                      "origin": p,
                      "User-Agent": navigator.userAgent
                    },
                    "data": a.toString(),
                    "withCredentials": true,
                    "onload": function onload(r) {
                      if (r.status === 200 || r.status === 302) {
                        var a = r.responseText || "";
                        if (a.includes("error-field") || a.includes('class="error"') || a.includes('class="err"')) {
                          var l = (new DOMParser).parseFromString(a, "text/html");
                          var u = l.querySelector(".error") || l.querySelector(".err") || l.querySelector(".message-error");
                          var p = u ? u.textContent.trim() : "评论提交失败，可能包含敏感词或触发了频率限制。";
                          Toast(p, 3e3, "error");
                          o(false);
                        } else {
                          Toast("评论发表成功！", 2e3, "success");
                          o(true);
                        }
                      } else {
                        Toast("提交失败: HTTP ".concat(r.status), 2e3, "error");
                        o(false);
                      }
                    },
                    "onerror": function onerror(r) {
                      U.error("[CommentPanel] 提交评论失败:", r);
                      Toast("网络请求出错，请重试", 2e3, "error");
                      o(false);
                    }
                  });
                }));

               case 20:
                C = k.sent;

               case 21:
                b();
                if (C) {
                  if (this.commentInput) {
                    this.commentInput.value = "";
                  }
                  this.selectedTagIds.clear();
                  this.closeTagSelectModal();
                  setTimeout((function() {
                    return o.handleRetry();
                  }), 500);
                }
                k.next = 30;
                break;

               case 25:
                k.prev = 25;
                k.t0 = k["catch"](10);
                b();
                U.error("[CommentPanel] 发表评论过程出现异常:", k.t0);
                Toast("发表评论失败", 2e3, "error");

               case 30:
               case "end":
                return k.stop();
              }
            }
          }), _callee7, this, [ [ 10, 25 ] ]);
        })));
        function submitComment(o) {
          return r.apply(this, arguments);
        }
        return submitComment;
      }()
    }, {
      "key": "handlePublishComment",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee8() {
          var r = this;
          var o, a, l, u, p, v, b, y;
          return CommentPanel_regeneratorRuntime().wrap((function _callee8$(C) {
            while (1) {
              switch (C.prev = C.next) {
               case 0:
                if (this.videoCode) {
                  C.next = 3;
                  break;
                }
                Toast("无法获取影片番号，无法发表评论", 2e3, "error");
                return C.abrupt("return");

               case 3:
                o = this.jableWorkingDomain || ne[0];
                a = "".concat(o, "/videos/").concat(this.videoCode.toLowerCase().trim(), "/");
                l = this.commentsPanel.querySelector(".tm-comments-panel-publish-btn");
                u = l ? l.textContent : "发表";
                if (l) {
                  l.disabled = true;
                  l.textContent = "检测中...";
                  l.style.opacity = "0.7";
                }
                p = function resetBtn() {
                  if (l) {
                    l.disabled = false;
                    l.textContent = u;
                    l.style.opacity = "1";
                  }
                };
                U.log("[CommentPanel] 正在检测 Jable 页面与登录态: ".concat(a));
                v = false;
                b = setTimeout((function() {
                  if (!v) {
                    v = true;
                    p();
                    if (y && typeof y.abort === "function") {
                      try {
                        y.abort();
                      } catch (r) {}
                    }
                    U.error("[CommentPanel] 检测 Jable 页面超时");
                    Toast("网络请求超时，请稍后重试", 2e3, "error");
                  }
                }), 6e3);
                y = GM_xmlhttpRequest({
                  "method": "GET",
                  "url": a,
                  "timeout": 6e3,
                  "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "referer": o,
                    "User-Agent": navigator.userAgent
                  },
                  "onload": function onload(l) {
                    if (v) {
                      return;
                    }
                    v = true;
                    clearTimeout(b);
                    p();
                    if (l.status === 404) {
                      r.jableVideoExists = false;
                      r.showTipModal("提示", "该影片在 Jable.tv 上未发布，无法发表评论。");
                      return;
                    }
                    if (l.status >= 200 && l.status < 300) {
                      r.jableVideoExists = true;
                      var u = l.responseText;
                      var y = (new DOMParser).parseFromString(u, "text/html");
                      var C = Array.from(y.querySelectorAll("form")).find((function(r) {
                        return r.querySelector('input[name="action"][value="add_comment"]') || r.querySelector('input[name="action"][value="add_comment_video"]');
                      })) || y.querySelector('form[id*="comment"]') || y.querySelector('form[action*="comment"]');
                      if (!C) {
                        r.showLoginPromptModal(o);
                      } else {
                        r.showCommentInputModal(C, a, o);
                      }
                    } else {
                      Toast("检测失败: HTTP ".concat(l.status), 2e3, "error");
                    }
                  },
                  "onerror": function onerror(r) {
                    if (v) {
                      return;
                    }
                    v = true;
                    clearTimeout(b);
                    p();
                    U.error("[CommentPanel] 检测 Jable 失败:", r);
                    Toast("网络请求失败，请稍后重试", 2e3, "error");
                  },
                  "ontimeout": function ontimeout() {
                    if (v) {
                      return;
                    }
                    v = true;
                    clearTimeout(b);
                    p();
                    U.error("[CommentPanel] 检测 Jable 超时");
                    Toast("网络请求超时，请稍后重试", 2e3, "error");
                  }
                });

               case 13:
               case "end":
                return C.stop();
              }
            }
          }), _callee8, this);
        })));
        function handlePublishComment() {
          return r.apply(this, arguments);
        }
        return handlePublishComment;
      }()
    }, {
      "key": "showTipModal",
      "value": function showTipModal(r, o) {
        var a = document.createElement("div");
        a.className = "tm-custom-modal-overlay";
        a.innerHTML = '\n            <div class="tm-custom-modal-content">\n                <div class="tm-custom-modal-title">'.concat(r, '</div>\n                <div class="tm-custom-modal-message">').concat(o, '</div>\n                <button class="tm-custom-modal-close-btn">确定</button>\n            </div>\n        ');
        document.body.appendChild(a);
        requestAnimationFrame((function() {
          return a.classList.add("active");
        }));
        var l = function close() {
          a.classList.remove("active");
          a.addEventListener("transitionend", (function() {
            return a.remove();
          }), {
            "once": true
          });
        };
        a.querySelector(".tm-custom-modal-close-btn").addEventListener("click", l);
        a.addEventListener("click", (function(r) {
          if (r.target === a) {
            l();
          }
        }));
      }
    }, {
      "key": "showLoginPromptModal",
      "value": function showLoginPromptModal(r) {
        var o = this;
        var a = document.createElement("div");
        a.className = "tm-custom-modal-overlay";
        a.innerHTML = '\n            <div class="tm-custom-modal-content" style="max-width: 280px; width: 85%;">\n                <div class="tm-custom-modal-title">发表评论</div>\n                <div class="tm-custom-modal-message">需要有 Jable 登录态才能发表评论，请先登录。</div>\n                <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">\n                    <button class="tm-custom-modal-cancel-btn" style="background-color: hsla(var(--shadcn-muted)/0.2); color: hsl(var(--shadcn-foreground)); border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: background-color 0.2s;">取消</button>\n                    <button class="tm-custom-modal-login-btn" style="background-color: hsl(var(--shadcn-blue)); color: #ffffff; border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; box-shadow: 0 4px 10px hsla(var(--shadcn-blue) / 0.3); transition: background-color 0.2s;">去登录</button>\n                </div>\n            </div>\n        ';
        document.body.appendChild(a);
        requestAnimationFrame((function() {
          return a.classList.add("active");
        }));
        var l = function close() {
          a.classList.remove("active");
          a.addEventListener("transitionend", (function() {
            return a.remove();
          }), {
            "once": true
          });
        };
        a.querySelector(".tm-custom-modal-cancel-btn").addEventListener("click", l);
        var u = a.querySelector(".tm-custom-modal-login-btn");
        u.addEventListener("click", (function() {
          l();
          o.showLoginModal(r);
        }));
        var p = a.querySelector(".tm-custom-modal-cancel-btn");
        p.addEventListener("mouseenter", (function() {
          return p.style.backgroundColor = "hsla(var(--shadcn-muted)/0.3)";
        }));
        p.addEventListener("mouseleave", (function() {
          return p.style.backgroundColor = "hsla(var(--shadcn-muted)/0.2)";
        }));
        u.addEventListener("mouseenter", (function() {
          return u.style.backgroundColor = "hsl(var(--shadcn-blue)/0.9)";
        }));
        u.addEventListener("mouseleave", (function() {
          return u.style.backgroundColor = "hsl(var(--shadcn-blue))";
        }));
        a.addEventListener("click", (function(r) {
          if (r.target === a) {
            l();
          }
        }));
      }
    }, {
      "key": "showLoginModal",
      "value": function showLoginModal(r, o) {
        var a = this;
        var l = null;
        if (window.loginManager && r) {
          l = window.loginManager.providers.find((function(o) {
            return o.domains.some((function(o) {
              return r.includes(o);
            }));
          }));
        }
        if (!l && window.loginManager) {
          l = window.loginManager.getMatchingProvider();
        }
        var u = l ? l.siteKey === "JABLE" ? "Jable.tv" : l.siteKey === "MISSAV" ? "MissAV" : l.siteKey : "Jable.tv";
        var p = document.createElement("div");
        p.className = "tm-custom-modal-overlay";
        p.innerHTML = '\n            <div class="tm-custom-modal-content" style="max-width: 300px; width: 85%; box-sizing: border-box; padding: 20px;">\n                <div class="tm-custom-modal-title" style="margin-bottom: 15px;">登录 '.concat(u, '</div>\n                <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; text-align: left; box-sizing: border-box;">\n                    <div style="display: flex; flex-direction: column; gap: 4px;">\n                        <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">用户名 / 邮箱</label>\n                        <input type="text" class="tm-login-username" placeholder="请输入用户名或邮箱" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid hsla(var(--shadcn-border) / 0.3); background-color: hsla(var(--shadcn-muted) / 0.1); color: hsl(var(--shadcn-foreground)); font-size: 13px; outline: none; box-sizing: border-box;" />\n                    </div>\n                    <div style="display: flex; flex-direction: column; gap: 4px;">\n                        <label style="font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">密码</label>\n                        <input type="password" class="tm-login-password" placeholder="请输入密码" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid hsla(var(--shadcn-border) / 0.3); background-color: hsla(var(--shadcn-muted) / 0.1); color: hsl(var(--shadcn-foreground)); font-size: 13px; outline: none; box-sizing: border-box;" />\n                    </div>\n                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">\n                        <input type="checkbox" id="tm-login-remember" checked style="cursor: pointer;" />\n                        <label for="tm-login-remember" style="font-size: 12px; color: hsl(var(--shadcn-muted-foreground)); cursor: pointer; user-select: none;">记住密码并开启自动登录</label>\n                    </div>\n                </div>\n                <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%; margin-top: 20px;">\n                    <button class="tm-custom-modal-cancel-btn" style="background-color: hsla(var(--shadcn-muted)/0.2); color: hsl(var(--shadcn-foreground)); border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: background-color 0.2s;">取消</button>\n                    <button class="tm-custom-modal-submit-btn" style="background-color: hsl(var(--shadcn-blue)); color: #ffffff; border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; box-shadow: 0 4px 10px hsla(var(--shadcn-blue) / 0.3); transition: background-color 0.2s;">登录</button>\n                </div>\n            </div>\n        ');
        document.body.appendChild(p);
        requestAnimationFrame((function() {
          return p.classList.add("active");
        }));
        var v = function close() {
          p.classList.remove("active");
          p.addEventListener("transitionend", (function() {
            return p.remove();
          }), {
            "once": true
          });
        };
        var b = p.querySelector(".tm-custom-modal-cancel-btn");
        b.addEventListener("click", v);
        b.addEventListener("mouseenter", (function() {
          return b.style.backgroundColor = "hsla(var(--shadcn-muted)/0.3)";
        }));
        b.addEventListener("mouseleave", (function() {
          return b.style.backgroundColor = "hsla(var(--shadcn-muted)/0.2)";
        }));
        var y = p.querySelector(".tm-custom-modal-submit-btn");
        y.addEventListener("mouseenter", (function() {
          return y.style.backgroundColor = "hsl(var(--shadcn-blue)/0.9)";
        }));
        y.addEventListener("mouseleave", (function() {
          return y.style.backgroundColor = "hsl(var(--shadcn-blue))";
        }));
        var C = p.querySelector(".tm-login-username");
        var k = p.querySelector(".tm-login-password");
        if (window.loginManager) {
          C.value = window.loginManager.userEmail || "";
          k.value = window.loginManager.userPassword || "";
        }
        y.addEventListener("click", CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee9() {
          var u, _, E, S;
          return CommentPanel_regeneratorRuntime().wrap((function _callee9$(P) {
            while (1) {
              switch (P.prev = P.next) {
               case 0:
                u = C.value.trim();
                _ = k.value.trim();
                E = p.querySelector("#tm-login-remember").checked;
                if (!(!u || !_)) {
                  P.next = 6;
                  break;
                }
                Toast("用户名和密码不能为空", 2e3, "warning");
                return P.abrupt("return");

               case 6:
                C.disabled = true;
                k.disabled = true;
                y.disabled = true;
                y.textContent = "登录中...";
                b.disabled = true;
                P.prev = 11;
                if (!l && window.loginManager && r) {
                  l = window.loginManager.providers.find((function(o) {
                    return o.domains.some((function(o) {
                      return r.includes(o);
                    }));
                  }));
                }
                if (!l) {
                  P.next = 19;
                  break;
                }
                P.next = 16;
                return l.login(u, _, r);

               case 16:
                P.t0 = P.sent;
                P.next = 20;
                break;

               case 19:
                P.t0 = false;

               case 20:
                S = P.t0;
                if (S) {
                  if (window.loginManager) {
                    window.loginManager.handleLoginInfoChange({
                      "email": u,
                      "password": _,
                      "autoLogin": E
                    });
                  }
                  a.updateAllSiteLoginStatuses(true);
                  v();
                  if (typeof o === "function") {
                    o();
                  } else {
                    setTimeout((function() {
                      a.handlePublishComment();
                    }), 500);
                  }
                } else {
                  C.disabled = false;
                  k.disabled = false;
                  y.disabled = false;
                  y.textContent = "登录";
                  b.disabled = false;
                }
                P.next = 32;
                break;

               case 24:
                P.prev = 24;
                P.t1 = P["catch"](11);
                Toast("登录失败，请重试", 2e3, "error");
                C.disabled = false;
                k.disabled = false;
                y.disabled = false;
                y.textContent = "登录";
                b.disabled = false;

               case 32:
               case "end":
                return P.stop();
              }
            }
          }), _callee9, null, [ [ 11, 24 ] ]);
        }))));
        k.addEventListener("keydown", (function(r) {
          if (r.key === "Enter") {
            r.preventDefault();
            y.click();
          }
        }));
        p.addEventListener("click", (function(r) {
          if (r.target === p) {
            v();
          }
        }));
      }
    }, {
      "key": "showCommentInputModal",
      "value": function showCommentInputModal(r, o, a) {
        var l = this;
        var u = document.createElement("div");
        u.className = "tm-custom-modal-overlay";
        u.innerHTML = '\n            <div class="tm-custom-modal-content" style="max-width: 320px; width: 90%;">\n                <div class="tm-custom-modal-title">发表评论</div>\n                <textarea class="tm-comment-input-textarea" placeholder="写下你的精彩评论..." style="width: 100%; height: 90px; margin: 12px 0; padding: 10px; border-radius: 8px; border: 1px solid hsla(var(--shadcn-border) / 0.3); background-color: hsla(var(--shadcn-muted) / 0.1); color: hsl(var(--shadcn-foreground)); font-size: 13px; resize: none; box-sizing: border-box; outline: none; transition: border-color 0.2s;" maxlength="1000"></textarea>\n                <div class="tm-modal-buttons" style="display: flex; gap: 10px; justify-content: center; width: 100%;">\n                    <button class="tm-custom-modal-cancel-btn" style="background-color: hsla(var(--shadcn-muted)/0.2); color: hsl(var(--shadcn-foreground)); border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; transition: background-color 0.2s;">取消</button>\n                    <button class="tm-custom-modal-submit-btn" style="background-color: hsl(var(--shadcn-blue)); color: #ffffff; border: none; border-radius: 18px; padding: 7px 20px; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; box-shadow: 0 4px 10px hsla(var(--shadcn-blue) / 0.3); transition: background-color 0.2s;">提交</button>\n                </div>\n            </div>\n        ';
        document.body.appendChild(u);
        requestAnimationFrame((function() {
          return u.classList.add("active");
        }));
        var p = u.querySelector(".tm-comment-input-textarea");
        p.focus();
        var v = function close() {
          u.classList.remove("active");
          u.addEventListener("transitionend", (function() {
            return u.remove();
          }), {
            "once": true
          });
        };
        var b = u.querySelector(".tm-custom-modal-cancel-btn");
        b.addEventListener("click", v);
        b.addEventListener("mouseenter", (function() {
          return b.style.backgroundColor = "hsla(var(--shadcn-muted)/0.3)";
        }));
        b.addEventListener("mouseleave", (function() {
          return b.style.backgroundColor = "hsla(var(--shadcn-muted)/0.2)";
        }));
        var y = u.querySelector(".tm-custom-modal-submit-btn");
        y.addEventListener("mouseenter", (function() {
          return y.style.backgroundColor = "hsl(var(--shadcn-blue)/0.9)";
        }));
        y.addEventListener("mouseleave", (function() {
          return y.style.backgroundColor = "hsl(var(--shadcn-blue))";
        }));
        y.addEventListener("click", (function() {
          var u = p.value.trim();
          if (!u) {
            Toast("评论内容不能为空", 2e3, "warning");
            return;
          }
          if (u.length < 3) {
            Toast("评论内容太少，至少输入3个字", 2e3, "warning");
            return;
          }
          p.disabled = true;
          y.disabled = true;
          y.textContent = "提交中...";
          b.disabled = true;
          var C = window.loginManager && window.loginManager.providers.find((function(r) {
            return r.domains.some((function(r) {
              return a.includes(r);
            }));
          }));
          CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee0() {
            var k;
            return CommentPanel_regeneratorRuntime().wrap((function _callee0$(_) {
              while (1) {
                switch (_.prev = _.next) {
                 case 0:
                  _.prev = 0;
                  k = false;
                  if (!(C && typeof C.publishComment === "function")) {
                    _.next = 8;
                    break;
                  }
                  _.next = 5;
                  return C.publishComment(u, {
                    "videoCode": l.videoCode,
                    "commentForm": r,
                    "targetUrl": o,
                    "domain": a
                  });

                 case 5:
                  k = _.sent;
                  _.next = 11;
                  break;

                 case 8:
                  _.next = 10;
                  return new Promise((function(l) {
                    var p = new URLSearchParams;
                    r.querySelectorAll("input").forEach((function(r) {
                      if (r.name && r.type !== "submit") {
                        p.append(r.name, r.value);
                      }
                    }));
                    var v = r.querySelector("textarea");
                    var b = v ? v.name : "comment";
                    p.append(b, u);
                    var y = r.getAttribute("action") || "";
                    if (y.startsWith("/")) {
                      y = "".concat(a).concat(y);
                    } else if (!y.startsWith("http")) {
                      y = o;
                    }
                    U.log("[CommentPanel] 正在向 Jable 提交评论: ".concat(y));
                    GM_xmlhttpRequest({
                      "method": "POST",
                      "url": y,
                      "headers": {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "referer": o,
                        "origin": a,
                        "User-Agent": navigator.userAgent
                      },
                      "data": p.toString(),
                      "withCredentials": true,
                      "onload": function onload(r) {
                        if (r.status === 200 || r.status === 302) {
                          var o = r.responseText || "";
                          if (o.includes("error-field") || o.includes('class="error"') || o.includes('class="err"')) {
                            var a = (new DOMParser).parseFromString(o, "text/html");
                            var u = a.querySelector(".error") || a.querySelector(".err") || a.querySelector(".message-error");
                            var p = u ? u.textContent.trim() : "评论提交失败，可能包含敏感词或触发了频率限制。";
                            Toast(p, 3e3, "error");
                            l(false);
                          } else {
                            Toast("评论发表成功！", 2e3, "success");
                            l(true);
                          }
                        } else {
                          Toast("提交失败: HTTP ".concat(r.status), 2e3, "error");
                          l(false);
                        }
                      },
                      "onerror": function onerror(r) {
                        U.error("[CommentPanel] 提交评论失败:", r);
                        Toast("网络请求出错，请重试", 2e3, "error");
                        l(false);
                      }
                    });
                  }));

                 case 10:
                  k = _.sent;

                 case 11:
                  if (k) {
                    v();
                    setTimeout((function() {
                      return l.handleRetry();
                    }), 500);
                  } else {
                    p.disabled = false;
                    y.disabled = false;
                    y.textContent = "提交";
                    b.disabled = false;
                  }
                  _.next = 21;
                  break;

                 case 14:
                  _.prev = 14;
                  _.t0 = _["catch"](0);
                  U.error("[CommentPanel] 发表评论失败:", _.t0);
                  p.disabled = false;
                  y.disabled = false;
                  y.textContent = "提交";
                  b.disabled = false;

                 case 21:
                 case "end":
                  return _.stop();
                }
              }
            }), _callee0, null, [ [ 0, 14 ] ]);
          })))();
        }));
        p.addEventListener("keydown", (function(r) {
          if (r.key === "Enter" && !r.shiftKey) {
            r.preventDefault();
            y.click();
          }
        }));
        u.addEventListener("click", (function(r) {
          if (r.target === u) {
            v();
          }
        }));
      }
    }, {
      "key": "updatePosition",
      "value": function updatePosition() {
        if (!this.commentsPanel) {
          return;
        }
        var r = window.innerWidth > window.innerHeight;
        var o = r && window.innerWidth >= 930;
        if (r && !o) {
          this.commentsPanel.style.display = "none";
          return;
        }
        this.commentsPanel.style.display = "flex";
      }
    }, {
      "key": "showLoading",
      "value": function showLoading() {
        if (this.loadingElement) {
          this.loadingElement.style.display = "flex";
          this.loadingElement.style.flexDirection = "column";
          this.loadingElement.style.gap = "12px";
          this.loadingElement.style.padding = "16px";
          this.loadingElement.innerHTML = '\n                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">\n                    <div class="jc-bd">\n                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">\n                            <div class="skeleton-block" style="width: 80px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                            <div class="skeleton-block" style="width: 60px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                        <div class="jc-body-text">\n                            <div class="skeleton-block" style="width: 90%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>\n                            <div class="skeleton-block" style="width: 50%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                    </div>\n                </div>\n                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">\n                    <div class="jc-bd">\n                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">\n                            <div class="skeleton-block" style="width: 100px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                            <div class="skeleton-block" style="width: 45px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                        <div class="jc-body-text">\n                            <div class="skeleton-block" style="width: 80%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>\n                            <div class="skeleton-block" style="width: 40%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                    </div>\n                </div>\n                <div class="jc-card jc-skeleton" style="margin-bottom: 8px; width: 100%;">\n                    <div class="jc-bd">\n                        <div class="jc-hdr" style="display: flex; justify-content: space-between; margin-bottom: 6px; width: 100%;">\n                            <div class="skeleton-block" style="width: 70px; height: 12px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                            <div class="skeleton-block" style="width: 55px; height: 10px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                        <div class="jc-body-text">\n                            <div class="skeleton-block" style="width: 95%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out; margin-bottom: 6px;"></div>\n                            <div class="skeleton-block" style="width: 70%; height: 14px; background: var(--skeleton-bg); border-radius: 4px; animation: skeleton-loading 1.5s infinite ease-in-out;"></div>\n                        </div>\n                    </div>\n                </div>\n            ';
        }
        if (this.errorElement) {
          this.errorElement.style.display = "none";
        }
        if (this.commentsList) {
          this.commentsList.style.display = "none";
        }
      }
    }, {
      "key": "showError",
      "value": function showError(r) {
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
          this.errorElement.innerHTML = '\n                <div style="text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; max-width: 280px; line-height: 1.5;">\n                    <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 13px;">'.concat(r, '</p>\n                    <div style="text-align: left; background: hsla(var(--shadcn-destructive)/0.05); border: 1px solid hsla(var(--shadcn-destructive)/0.15); border-radius: 8px; padding: 10px; font-size: 11px; color: hsl(var(--shadcn-muted-foreground)); margin-bottom: 12px; box-sizing: border-box; line-height: 1.6;">\n                        <span style="font-weight: 600; color: hsl(var(--shadcn-destructive)); display: block; margin-bottom: 4px;">可能的原因：</span>\n                        1. 目标网站（Jable/JAVLibrary）当前不可达或网络受限。<br>\n                        2. 跨域网络请求未获得脚本管理器授权（请在 Tampermonkey 弹窗中选择“总是允许”）。<br>\n                        3. 被 Cloudflare 防火墙人机挑战拦截。\n                    </div>\n                    <button class="tm-comment-retry-btn" style="padding: 6px 16px; font-size: 11px; background-color: hsla(var(--shadcn-destructive) / 0.1); border: 1px solid hsla(var(--shadcn-destructive) / 0.3); color: hsl(var(--shadcn-destructive)); border-radius: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600; outline: none;">重新采集</button>\n                </div>\n            ');
        }
      }
    }, {
      "key": "handleRetry",
      "value": function handleRetry(r) {
        var o = !r || r === "jable";
        var a = !r || r === "javlib";
        if (o) {
          CommentPanel.preloadCache.jableCommentsPromise = null;
          this.jableComments = [];
          this.filteredJableComments = [];
          this.jableCurrentPage = 1;
          this.jableHasMore = false;
          this.jableStatus = "loading";
          this.loadJableComments(1);
        }
        if (a) {
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
    }, {
      "key": "triggerLoadMore",
      "value": function triggerLoadMore(r) {
        var o = this.sites[r];
        if (!o || o.loading || !o.hasMore || o.collapsed) {
          return;
        }
        U.log("[CommentPanel] 触发加载更多 ".concat(o.name, " 评论..."));
        this.loadSiteComments(r, o.currentPage + 1);
      }
    }, {
      "key": "triggerLoadMoreJable",
      "value": function triggerLoadMoreJable() {
        return this.triggerLoadMore("jable");
      }
    }, {
      "key": "triggerLoadMoreJavlib",
      "value": function triggerLoadMoreJavlib() {
        return this.triggerLoadMore("javlib");
      }
    }, {
      "key": "triggerLoadMoreJavdb",
      "value": function triggerLoadMoreJavdb() {
        return this.triggerLoadMore("javdb");
      }
    }, {
      "key": "renderSectionHtml",
      "value": function renderSectionHtml(r) {
        var o, a, l = this;
        var u = this.sites[r];
        if (!u) {
          return "";
        }
        var p = (o = this.playerCore) === null || o === void 0 || (o = o.options) === null || o === void 0 ? void 0 : o.playerState;
        var b = (p === null || p === void 0 || (a = p.settings) === null || a === void 0 ? void 0 : a.enabledCommentSources) || {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        };
        var y = r === "javlib" ? b.javlib !== false && b.javlibrary !== false : b[r] !== false;
        if (!y) {
          return "";
        }
        var C = "";
        if (u.status === "loading") {
          C = '\n                <div class="tm-comment-loader-graphic" style="display: flex; gap: 5px; padding: 16px; justify-content: center;">\n                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>\n                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>\n                    <div class="dot" style="width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>\n                </div>\n            ';
        } else if (u.status === "unreachable") {
          C = '\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-destructive)); font-size: 12px; pointer-events: auto;">\n                    <p style="margin: 0; font-weight: 500;">⚠️ 无法连接到 '.concat(u.name, '</p>\n                    <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(var(--shadcn-muted-foreground));">请检查网络代理，或该站点在当前环境不可达。</p>\n                </div>\n            ');
        } else if (u.status === "mobile_unsupported") {
          C = '\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px; pointer-events: auto;">\n                    <p style="margin: 0; font-weight: 500;">📱 该站点评论采集在移动端不可用</p>\n                    <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.8; line-height: 1.5;">JAVLibrary 采集需使用后台独立标签页（影子通道），移动端浏览器不支持后台静默多标签页协同。请在 PC 端浏览器查看该站点评论。</p>\n                </div>\n            ';
        } else if (u.status === "not_found") {
          C = '\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">\n                    <p style="margin: 0;">此影片在 '.concat(u.name, " 上未找到评论。</p>\n                </div>\n            ");
        } else if (u.status === "empty") {
          C = '\n                <div style="padding: 16px; text-align: center; color: hsl(var(--shadcn-muted-foreground)); font-size: 12px;">\n                    <p style="margin: 0;">暂无评论</p>\n                </div>\n            ';
        } else if (u.status === "cf_shield") {
          if (r === "javlib" && this.javlibVerifyingStatus === "verifying") {
            C = '\n                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-blue)/0.08); border: 1px solid hsla(var(--shadcn-blue)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-blue)); box-sizing: border-box; width: 100%; pointer-events: auto;">\n                        <div style="display: flex; align-items: center; gap: 8px;">\n                            <div class="tm-comment-loader-graphic" style="display: flex; gap: 3px; padding: 0; width: auto; min-height: 0;">\n                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both;"></div>\n                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>\n                                <div class="dot" style="width: 4px; height: 4px; border-radius: 50%; background-color: hsl(var(--shadcn-blue)); animation: tmDotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>\n                            </div>\n                            <span style="font-weight: 500;">正在后台尝试自动通过 JAVLibrary 验证，请稍候...</span>\n                        </div>\n                    </div>\n                ';
          } else {
            var k = r === "jable" ? this.jableFailedDomain || "https://".concat(v.JABLE.primary) : r === "javlib" ? this.javlibFailedDomain || "https://".concat(v.JAVLIBRARY.primary) : "https://".concat(v.JAVDB.primary);
            var _ = r === "jable" ? "tm-jable-verify-retry-btn" : r === "javlib" ? "tm-comments-verify-retry-btn" : "tm-javdb-verify-retry-btn";
            C = '\n                    <div class="tm-comments-cf-warning" style="border-radius: 6px; padding: 10px 14px; background-color: hsla(var(--shadcn-destructive)/0.08); border: 1px solid hsla(var(--shadcn-destructive)/0.15); font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: hsl(var(--shadcn-destructive)); box-sizing: border-box; width: 100%; pointer-events: auto;">\n                        <span>'.concat(u.name, ' 评论抓取受阻 (Cloudflare 拦截)</span>\n                        <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">\n                            <a href="').concat(k, '/" target="_blank" class="tm-comments-verify-link" style="padding: 4px 10px; background-color: hsl(var(--shadcn-destructive)); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 10px; white-space: nowrap;">去验证</a>\n                            <button class="').concat(_, '" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">重新加载</button>\n                            ').concat(r === "javlib" ? '<button class="tm-comments-verify-copy-logs-btn" style="padding: 4px 10px; background-color: hsla(var(--shadcn-muted) / 0.15); border: 1px solid hsla(var(--shadcn-border) / 0.3); color: hsl(var(--shadcn-foreground)); border-radius: 12px; font-weight: 600; font-size: 10px; cursor: pointer; white-space: nowrap; outline: none; transition: all 0.2s;">复制日志</button>' : "", "\n                        </div>\n                    </div>\n                ");
          }
        } else if (u.status === "loaded") {
          C = u.filteredComments.map((function(r) {
            var o = l.renderedCommentIds.size > 0 && !l.renderedCommentIds.has(r.id);
            return l.renderCommentCard(r, o);
          })).join("");
          if (u.loading) {
            C += '\n                    <div class="tm-comment-bottom-loader tm-comment-loader-graphic">\n                        <div class="dot"></div>\n                        <div class="dot"></div>\n                        <div class="dot"></div>\n                    </div>\n                ';
          } else if (!u.hasMore) {
            C += '\n                    <div class="tm-comment-end-marker" style="text-align: center; padding: 4px; font-size: 10px; color: hsl(var(--shadcn-muted-foreground)); opacity: 0.6;">-end-</div>\n                ';
          }
        }
        var E = {
          "loading": "采集中...",
          "unreachable": "不可达",
          "not_found": "未收录",
          "empty": "暂无评论",
          "cf_shield": "需验证",
          "mobile_unsupported": "移动端浏览器不支持",
          "loaded": "共 ".concat(u.filteredComments.length).concat(u.hasMore ? "+" : "", " 条")
        };
        var S = E[u.status] || "";
        var P = u.status === "unreachable" || u.status === "not_found" || u.status === "mobile_unsupported" || u.collapsed;
        var D = P ? "none" : "block";
        var L = r === "jable" ? "JABLE" : r === "javlib" ? "JAVLIBRARY" : "";
        var M = L ? this.renderLoginBadgeHtml(L) : "";
        var A = {
          "jable": "■ Jable.tv",
          "javlib": "■ JAVLibrary",
          "javdb": "■ JavDB"
        };
        return '\n            <div class="tm-comment-section'.concat(P ? " is-collapsed" : "", '" id="tm-comment-section-').concat(r, '">\n                <div class="tm-comment-section-hdr" title="点击展开/折叠">\n                    <span class="tm-comment-section-title">').concat(A[r], '</span>\n                    <div class="tm-comment-hdr-right" style="display: inline-flex; align-items: center; gap: 6px;">\n                        ').concat(M, '\n                        <span class="tm-comment-status-badge tm-status-badge-').concat(u.status, '">').concat(S, '</span>\n                    </div>\n                </div>\n                <div class="tm-comment-section-body" style="display: ').concat(D, '; pointer-events: auto;">\n                    ').concat(C, "\n                </div>\n            </div>\n        ");
      }
    }, {
      "key": "showBottomLoader",
      "value": function showBottomLoader(r) {
        if (!this.commentsList) {
          return;
        }
        var o = this.commentsList.querySelector("#tm-comment-section-".concat(r, " .tm-comment-section-body"));
        if (!o) {
          return;
        }
        if (o.querySelector(".tm-comment-bottom-loader")) {
          return;
        }
        var a = document.createElement("div");
        a.className = "tm-comment-bottom-loader tm-comment-loader-graphic";
        a.innerHTML = '\n            <div class="dot"></div>\n            <div class="dot"></div>\n            <div class="dot"></div>\n        ';
        o.appendChild(a);
        setTimeout((function() {
          if (o.scrollTop + o.clientHeight >= o.scrollHeight - 50) {
            o.scrollTop = o.scrollHeight - o.clientHeight;
          }
        }), 30);
      }
    }, {
      "key": "hideBottomLoader",
      "value": function hideBottomLoader(r) {
        if (!this.commentsList) {
          return;
        }
        var o = this.commentsList.querySelector("#tm-comment-section-".concat(r, " .tm-comment-section-body"));
        var a = o === null || o === void 0 ? void 0 : o.querySelector(".tm-comment-bottom-loader");
        if (a) {
          a.remove();
        }
      }
    }, {
      "key": "updateCommentsCount",
      "value": function updateCommentsCount() {
        this.totalCount = (this.jableTotalCount || 0) + (this.javlibTotalCount || 0) + (this.javdbTotalCount || 0);
        this.hasMore = this.jableHasMore || false || this.javlibHasMore || false || this.javdbHasMore || false;
        if (this.countSpan) {
          var r = (__("commentsCount") || "共 {n} 条评论").replace("{n}", this.totalCount);
          var o = [];
          if (this.jableLoading) {
            o.push("Jable");
          }
          if (this.javlibLoading) {
            o.push("JAVLibrary");
          }
          if (this.javdbLoading) {
            o.push("JavDB");
          }
          if (o.length > 0) {
            r += " (正在采集 ".concat(o.join("/"), "...)");
          }
          this.countSpan.textContent = r;
        }
      }
    }, {
      "key": "renderCommentCard",
      "value": function renderCommentCard(r) {
        var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        var a = r.text && r.text.length > 200 ? "jc-body-text jc-body-text--collapsible" : "jc-body-text";
        var l = r.text && r.text.length > 200 ? '<div class="jc-body-text-content">'.concat(r.textHtml, '</div><button class="jc-toggle-expand-btn">').concat(__("commentsExpand") || "展开", "</button>") : r.textHtml;
        var u = r.userUrl ? '<a href="'.concat(r.userUrl, '" target="_blank" class="jc-u">').concat(r.user, "</a>") : '<span class="jc-u">'.concat(r.user, "</span>");
        var p = r.score ? '<span class="jc-score-badge" title="评分">'.concat(r.score, "</span>") : "";
        var v = r.spam && r.spam.label === "SPAM" ? '<span class="jc-spam-badge" title="'.concat(r.spam.reason, '">灌水: ').concat(r.spam.category, "</span>") : "";
        return '\n            <div class="jc-card '.concat(o ? "jc-card--new" : "", '" data-id="').concat(r.id, '">\n                <div class="jc-bd">\n                    <div class="jc-hdr">\n                        <div class="jc-hdr-left">\n                            <span class="jc-t">').concat(r.time, '</span>\n                        </div>\n                        <div class="jc-hdr-right">\n                            ').concat(u, "\n                            ").concat(p, "\n                            ").concat(v, '\n                        </div>\n                    </div>\n                    <div class="').concat(a, '" ').concat(r.text && r.text.length > 200 ? 'data-collapsed="true"' : "", ">\n                        ").concat(l, "\n                    </div>\n                </div>\n            </div>\n        ");
      }
    }, {
      "key": "renderCommentsList",
      "value": function renderCommentsList() {
        var r = this;
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
          setTimeout((function() {
            return r.startJavlibBackgroundVerification(r.javlibFailedDomain);
          }), 50);
        }
        var o = {
          "jable": this.renderSectionHtml("jable"),
          "javdb": this.renderSectionHtml("javdb"),
          "javlib": this.renderSectionHtml("javlib")
        };
        if (this.commentsList) {
          var a = {};
          var l = this.commentsList.querySelectorAll(".tm-comment-section-body");
          l.forEach((function(r) {
            var o = r.closest(".tm-comment-section");
            if (o && o.id) {
              a[o.id] = r.scrollTop;
            }
          }));
          var u = [ {
            "key": "jable",
            "html": o.jable,
            "hasContent": this.filteredJableComments && this.filteredJableComments.length > 0 || this.jableStatus === "loading"
          }, {
            "key": "javdb",
            "html": o.javdb,
            "hasContent": this.filteredJavdbComments && this.filteredJavdbComments.length > 0 || this.javdbStatus === "loading"
          }, {
            "key": "javlib",
            "html": o.javlib,
            "hasContent": this.filteredJavlibComments && this.filteredJavlibComments.length > 0 || this.javlibStatus === "loading"
          } ];
          u.sort((function(r, o) {
            if (r.hasContent && !o.hasContent) {
              return -1;
            }
            if (!r.hasContent && o.hasContent) {
              return 1;
            }
            return 0;
          }));
          this.commentsList.innerHTML = u.map((function(r) {
            return r.html;
          })).join("");
          this.bindAllLoginBadgeEvents();
          var p = this.commentsList.querySelectorAll(".tm-comment-section-body");
          p.forEach((function(r) {
            var o = r.closest(".tm-comment-section");
            if (o && o.id && a[o.id] !== void 0) {
              r.scrollTop = a[o.id];
            }
          }));
          var v = this.commentsList.querySelectorAll(".tm-comments-verify-link");
          v.forEach((function(o) {
            o.addEventListener("click", (function() {
              if (typeof GM_setValue === "function") {
                GM_setValue("javlib_verifying", true);
                GM_setValue("javlib_verifying_start_time", Date.now());
              }
              r.startSignalListener();
            }));
          }));
          var b = this.commentsList.querySelector(".tm-comments-verify-retry-btn, .tm-comment-retry-btn");
          if (b) {
            b.addEventListener("click", (function(o) {
              o.stopPropagation();
              U.log("用户手动点击 JAVLibrary 重试，清除历史验证状态并重载...");
              r.javlibAutoVerifyAttempted = false;
              r.javlibCfShield = false;
              r.javlibVerifyingStatus = "";
              r.handleRetry("javlib");
            }));
          }
          var y = this.commentsList.querySelector(".tm-jable-verify-retry-btn");
          if (y) {
            y.addEventListener("click", (function(o) {
              o.stopPropagation();
              U.log("用户手动点击 Jable.tv 重试，清除历史验证状态并重载...");
              r.jableStatus = "loading";
              r.handleRetry("jable");
            }));
          }
          var C = this.commentsList.querySelector(".tm-javdb-verify-retry-btn");
          if (C) {
            C.addEventListener("click", (function(o) {
              o.stopPropagation();
              U.log("用户手动点击 JavDB 重试...");
              r.javdbStatus = "loading";
              r.loadJavdbComments(1);
            }));
          }
          var k = this.commentsList.querySelectorAll(".tm-comments-verify-copy-logs-btn");
          k.forEach((function(r) {
            r.addEventListener("click", (function(o) {
              o.stopPropagation();
              var a = r.closest("#tm-comment-section-javlib") !== null;
              var l = a ? [ "javlib", "c97k.com", "CrossDomainBridge", "iframe", "shadow" ] : [ "jable", "fs1.app" ];
              var u = a ? "JAVLibrary" : "Jable.tv";
              if (U.copyLogs(l)) {
                Toast("".concat(u, " 调试日志已复制到剪贴板，请发送给开发者分析！"), 3e3, "success");
              } else {
                Toast("复制日志失败，请手动打开控制台查看。", 3e3, "error");
              }
            }));
          }));
          var _ = this.commentsList.querySelector("#tm-comment-section-jable .tm-comment-section-hdr");
          if (_) {
            _.addEventListener("click", (function() {
              var o = r.commentsList.querySelector("#tm-comment-section-jable .tm-comment-section-body");
              var a = r.commentsList.querySelector("#tm-comment-section-jable");
              if (o && a) {
                r.jableCollapsed = !r.jableCollapsed;
                o.style.display = r.jableCollapsed ? "none" : "block";
                a.classList.toggle("is-collapsed", r.jableCollapsed);
                localStorage.setItem("tm-comment-jable-collapsed", r.jableCollapsed);
                if (!r.jableCollapsed) {
                  r.javlibCollapsed = true;
                  r.javdbCollapsed = true;
                  localStorage.setItem("tm-comment-javlib-collapsed", "true");
                  localStorage.setItem("tm-comment-javdb-collapsed", "true");
                  r.renderCommentsList();
                  if (r.jableComments.length === 0 && r.jableStatus === "loading" && !r.jableLoading) {
                    r.loadJableComments(1);
                  } else {
                    r.triggerLoadMoreJable();
                  }
                }
              }
            }));
          }
          var E = this.commentsList.querySelector("#tm-comment-section-javlib .tm-comment-section-hdr");
          if (E) {
            E.addEventListener("click", (function() {
              var o = r.commentsList.querySelector("#tm-comment-section-javlib .tm-comment-section-body");
              var a = r.commentsList.querySelector("#tm-comment-section-javlib");
              if (o && a) {
                r.javlibCollapsed = !r.javlibCollapsed;
                o.style.display = r.javlibCollapsed ? "none" : "block";
                a.classList.toggle("is-collapsed", r.javlibCollapsed);
                localStorage.setItem("tm-comment-javlib-collapsed", r.javlibCollapsed);
                if (!r.javlibCollapsed) {
                  r.jableCollapsed = true;
                  r.javdbCollapsed = true;
                  localStorage.setItem("tm-comment-jable-collapsed", "true");
                  localStorage.setItem("tm-comment-javdb-collapsed", "true");
                  r.renderCommentsList();
                  if (r.javlibComments.length === 0 && r.javlibStatus === "loading" && !r.javlibLoading) {
                    r.loadJavlibComments(1);
                  } else {
                    r.triggerLoadMoreJavlib();
                  }
                }
              }
            }));
          }
          var S = this.commentsList.querySelector("#tm-comment-section-javdb .tm-comment-section-hdr");
          if (S) {
            S.addEventListener("click", (function() {
              var o = r.commentsList.querySelector("#tm-comment-section-javdb .tm-comment-section-body");
              var a = r.commentsList.querySelector("#tm-comment-section-javdb");
              if (o && a) {
                r.javdbCollapsed = !r.javdbCollapsed;
                o.style.display = r.javdbCollapsed ? "none" : "block";
                a.classList.toggle("is-collapsed", r.javdbCollapsed);
                localStorage.setItem("tm-comment-javdb-collapsed", r.javdbCollapsed);
                if (!r.javdbCollapsed) {
                  r.jableCollapsed = true;
                  r.javlibCollapsed = true;
                  localStorage.setItem("tm-comment-jable-collapsed", "true");
                  localStorage.setItem("tm-comment-javlib-collapsed", "true");
                  r.renderCommentsList();
                  if (r.javdbComments.length === 0 && r.javdbStatus === "loading" && !r.javdbLoading) {
                    r.loadJavdbComments(1);
                  } else {
                    r.triggerLoadMoreJavdb();
                  }
                }
              }
            }));
          }
          (this.filteredJableComments || []).forEach((function(o) {
            return r.renderedCommentIds.add(o.id);
          }));
          (this.filteredJavlibComments || []).forEach((function(o) {
            return r.renderedCommentIds.add(o.id);
          }));
          (this.filteredJavdbComments || []).forEach((function(o) {
            return r.renderedCommentIds.add(o.id);
          }));
          setTimeout((function() {
            return r.checkViewportFill();
          }), 150);
        }
      }
    }, {
      "key": "checkViewportFill",
      "value": function checkViewportFill() {
        if (!this.commentsList) {
          return;
        }
        var r = Array.from(this.commentsList.querySelectorAll(".tm-comment-section:not(.is-collapsed) .tm-comment-section-body"));
        for (var o = 0, a = r; o < a.length; o++) {
          var l = a[o];
          if (l.clientHeight > 0 && l.scrollHeight > 0 && l.scrollHeight <= l.clientHeight + 10) {
            var u = l.closest(".tm-comment-section");
            var p = u ? u.id : "";
            if (p === "tm-comment-section-jable" && this.jableHasMore && !this.jableLoading) {
              U.log("[CommentPanel] Jable section viewport not filled. Auto-loading next page...");
              this.triggerLoadMoreJable();
            } else if (p === "tm-comment-section-javlib" && this.javlibHasMore && !this.javlibLoading) {
              U.log("[CommentPanel] JAVLibrary section viewport not filled. Auto-loading next page...");
              this.triggerLoadMoreJavlib();
            } else if (p === "tm-comment-section-javdb" && this.javdbHasMore && !this.javdbLoading) {
              U.log("[CommentPanel] JavDB section viewport not filled. Auto-loading next page...");
              this.triggerLoadMoreJavdb();
            }
          }
        }
      }
    }, {
      "key": "getLoginProviderForSite",
      "value": function getLoginProviderForSite(r) {
        var o = String(r || "").toUpperCase();
        if (window.loginManager && window.loginManager.providers) {
          var a = window.loginManager.providers.find((function(r) {
            return r.siteKey && r.siteKey.toUpperCase() === o;
          }));
          if (a) {
            return a;
          }
        }
        if (!this._staticProviders) {
          this._staticProviders = {
            "JABLE": new Z,
            "MISSAV": new ee
          };
        }
        return this._staticProviders[o] || null;
      }
    }, {
      "key": "renderLoginBadgeHtml",
      "value": function renderLoginBadgeHtml(r) {
        var o = this.getLoginProviderForSite(r);
        if (!o) {
          return "";
        }
        if (this.siteLoginStates[r] === void 0 || this.siteLoginStates[r] === null) {
          if (typeof o.getCachedLoginStatus === "function") {
            this.siteLoginStates[r] = o.getCachedLoginStatus();
          }
        }
        var a = this.siteLoginStates[r];
        if (a === true) {
          return '<span class="tm-comment-login-badge is-logged-in">已登录</span>';
        } else if (a === false) {
          return '<span class="tm-comment-login-badge is-not-logged-in" title="点击登录" data-site="'.concat(r, '">未登录</span>');
        } else {
          return '<span class="tm-comment-login-badge is-checking" style="opacity: 0.6; cursor: default;">检测中...</span>';
        }
      }
    }, {
      "key": "updateSiteLoginStatus",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee1(r) {
          var o, a;
          return CommentPanel_regeneratorRuntime().wrap((function _callee1$(l) {
            while (1) {
              switch (l.prev = l.next) {
               case 0:
                o = this.getLoginProviderForSite(r);
                if (o) {
                  l.next = 3;
                  break;
                }
                return l.abrupt("return");

               case 3:
                l.prev = 3;
                l.next = 6;
                return o.checkLoginStatus();

               case 6:
                a = l.sent;
                if (this.siteLoginStates[r] !== a) {
                  this.siteLoginStates[r] = a;
                  this.updateLoginBadgeDOM(r);
                }
                l.next = 12;
                break;

               case 10:
                l.prev = 10;
                l.t0 = l["catch"](3);

               case 12:
               case "end":
                return l.stop();
              }
            }
          }), _callee1, this, [ [ 3, 10 ] ]);
        })));
        function updateSiteLoginStatus(o) {
          return r.apply(this, arguments);
        }
        return updateSiteLoginStatus;
      }()
    }, {
      "key": "updateAllSiteLoginStatuses",
      "value": function updateAllSiteLoginStatuses() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        var o = Date.now();
        if (!r && this._lastStatusCheckTime && o - this._lastStatusCheckTime < 6e4) {
          return;
        }
        this._lastStatusCheckTime = o;
        var a = Object.keys(this.siteLoginStates);
        for (var l = 0, u = a; l < u.length; l++) {
          var p = u[l];
          this.updateSiteLoginStatus(p);
        }
      }
    }, {
      "key": "updateLoginBadgeDOM",
      "value": function updateLoginBadgeDOM(r) {
        if (!this.commentsList) {
          return;
        }
        var o = this.commentsList.querySelector("#tm-comment-section-".concat(r.toLowerCase()));
        if (!o) {
          return;
        }
        var a = o.querySelector(".tm-comment-hdr-right");
        if (!a) {
          return;
        }
        var l = a.querySelector(".tm-comment-login-badge");
        var u = this.renderLoginBadgeHtml(r);
        if (!u) {
          return;
        }
        if (l) {
          var p = document.createElement("div");
          p.innerHTML = u;
          var v = p.firstElementChild;
          l.replaceWith(v);
          this.bindLoginBadgeEvents(v);
        } else {
          var b = document.createElement("div");
          b.innerHTML = u;
          var y = b.firstElementChild;
          a.insertBefore(y, a.firstChild);
          this.bindLoginBadgeEvents(y);
        }
      }
    }, {
      "key": "bindLoginBadgeEvents",
      "value": function bindLoginBadgeEvents(r) {
        var o = this;
        if (!r || !r.classList.contains("is-not-logged-in")) {
          return;
        }
        r.addEventListener("click", (function(a) {
          a.stopPropagation();
          var l = r.getAttribute("data-site") || "JABLE";
          var u = o.getLoginProviderForSite(l);
          var p = u ? u.domains && u.domains[0] ? "https://".concat(u.domains[0]) : "" : "";
          o.showLoginModal(p, (function() {
            o.updateSiteLoginStatus(l);
          }));
        }));
      }
    }, {
      "key": "bindAllLoginBadgeEvents",
      "value": function bindAllLoginBadgeEvents() {
        var r = this;
        if (!this.commentsList) {
          return;
        }
        var o = this.commentsList.querySelectorAll(".tm-comment-login-badge.is-not-logged-in");
        o.forEach((function(o) {
          r.bindLoginBadgeEvents(o);
        }));
      }
    }, {
      "key": "checkLoginStatus",
      "value": function() {
        var r = CommentPanel_asyncToGenerator(CommentPanel_regeneratorRuntime().mark((function _callee10() {
          var r, o, a, l, u;
          return CommentPanel_regeneratorRuntime().wrap((function _callee10$(p) {
            while (1) {
              switch (p.prev = p.next) {
               case 0:
                p.prev = 0;
                if (!window.loginManager) {
                  p.next = 7;
                  break;
                }
                r = window.loginManager.getMatchingProvider();
                if (!(r && typeof r.checkLoginStatus === "function")) {
                  p.next = 7;
                  break;
                }
                p.next = 6;
                return r.checkLoginStatus();

               case 6:
                return p.abrupt("return", p.sent);

               case 7:
                if (!isSiteDomain("MISSAV")) {
                  p.next = 13;
                  break;
                }
                o = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
                a = document.querySelector(".avatar") || document.querySelector(".user-menu");
                return p.abrupt("return", !o || !!a);

               case 13:
                if (!isSiteDomain("JABLE")) {
                  p.next = 17;
                  break;
                }
                l = document.querySelector('a[href*="logout"]') || document.querySelector(".user-avatar");
                u = document.querySelector('a[href*="login"]');
                return p.abrupt("return", !!l || !u);

               case 17:
                p.next = 21;
                break;

               case 19:
                p.prev = 19;
                p.t0 = p["catch"](0);

               case 21:
                return p.abrupt("return", true);

               case 22:
               case "end":
                return p.stop();
              }
            }
          }), _callee10, null, [ [ 0, 19 ] ]);
        })));
        function checkLoginStatus() {
          return r.apply(this, arguments);
        }
        return checkLoginStatus;
      }()
    }, {
      "key": "handleLoginRedirect",
      "value": function handleLoginRedirect() {
        try {
          if (window.loginManager) {
            var r = window.loginManager.getMatchingProvider();
            if (r && typeof r.redirectLogin === "function") {
              r.redirectLogin();
              return;
            }
          }
          if (isSiteDomain("MISSAV")) {
            var o = document.querySelector('button[x-on\\:click*="login"]') || document.querySelector('a[href*="login"]');
            if (o) {
              o.click();
              Toast("请在页面登录窗口中完成登录", 3e3, "info");
            } else if (typeof GM_openInTab === "function") {
              GM_openInTab("https://".concat(v.MISSAV.primary, "/cn/login"), {
                "active": true,
                "insert": true,
                "setParent": true
              });
            } else {
              window.open("https://".concat(v.MISSAV.primary, "/cn/login"), "_blank");
            }
          } else if (isSiteDomain("JABLE")) {
            window.location.href = "/login/";
          } else {
            Toast("未检测到当前站点的登录入口", 2e3, "error");
          }
        } catch (r) {}
      }
    }, {
      "key": "reprocessComments",
      "value": function reprocessComments() {
        var r = this;
        if (!this.targetVideo) {
          return;
        }
        var o = this.targetVideo.duration;
        if (!o || isNaN(o)) {
          return;
        }
        U.log("[CommentPanel] 视频元数据已加载，时长: ".concat(o, "s。重新解析所有评论..."));
        var a = function reprocess(a) {
          return a.map((function(a) {
            var l = processComment(a.text, r.videoCode, o);
            return CommentPanel_objectSpread(CommentPanel_objectSpread({}, a), l);
          }));
        };
        if (this.jableComments && this.jableComments.length > 0) {
          this.jableComments = a(this.jableComments);
        }
        if (this.javlibComments && this.javlibComments.length > 0) {
          this.javlibComments = a(this.javlibComments);
        }
        if (this.javdbComments && this.javdbComments.length > 0) {
          this.javdbComments = a(this.javdbComments);
        }
        this.applyFilter();
        this.renderCommentsList();
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
        if (this.commentsPanelResizeObserver && this.commentsPanel) {
          this.commentsPanelResizeObserver.unobserve(this.commentsPanel);
          this.commentsPanelResizeObserver = null;
        }
        if (this.targetVideo && this.handleMetadataLoadedBound) {
          this.targetVideo.removeEventListener("loadedmetadata", this.handleMetadataLoadedBound);
        }
        this.cleanupJavlibVerification();
      }
    } ], [ {
      "key": "preload",
      "value": function preload(r) {
        if (!r) {
          return;
        }
        var o = true;
        var a = {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        };
        try {
          if (typeof GM_getValue === "function") {
            o = GM_getValue("showCommentsSection", true);
            a = GM_getValue("enabledCommentSources", a);
          } else {
            var l = "missNoAD_";
            var u = localStorage.getItem(l + "showCommentsSection");
            if (u !== null) {
              try {
                o = JSON.parse(u);
              } catch (r) {}
            }
            var p = localStorage.getItem(l + "enabledCommentSources");
            if (p !== null) {
              try {
                a = JSON.parse(p);
              } catch (r) {}
            }
          }
        } catch (r) {}
        if (!o) {
          U.log("[CommentPanel] 设置中未开启评论区 (showCommentsSection: false)，跳过后台预加载");
          return;
        }
        CommentPanel.preloadCache.videoCode = r;
        U.log("[CommentPanel] 启动后台预加载，番号: ".concat(r));
        if (a.jable !== false) {
          var v = "";
          if (typeof GM_getValue === "function") {
            try {
              v = GM_getValue("mp_jable_working_domain", "");
            } catch (r) {}
          }
          var b = 0;
          if (v) {
            var y = ne.indexOf(v);
            if (y !== -1) {
              b = y;
            }
          }
          CommentPanel.preloadCache.jableCommentsPromise = fetchJableComments(r, 1, b).then((function(r) {
            U.log("[CommentPanel] 预加载 Jable 评论成功，共 ".concat(r.comments.length, " 条 (域名: ").concat(r.domain || "default", ")"));
            return r;
          }))["catch"]((function(o) {
            U.warn("[CommentPanel] 预加载 Jable 评论失败:", o);
            if (CommentPanel.preloadCache.videoCode === r) {
              CommentPanel.preloadCache.jableCommentsPromise = null;
            }
            throw o;
          }));
        }
        if (!isMobile() && a.javlib !== false && a.javlibrary !== false) {
          CommentPanel.preloadCache.javlibVideoIdPromise = fetchJavLibraryVideoId(r).then((function(o) {
            var a = o.videoId, l = o.domain;
            U.log("[CommentPanel] 预加载 JAVLibrary ID 成功: ".concat(a, " (域名: ").concat(l, ")"));
            CommentPanel.preloadCache.javlibCommentsPromise = fetchJavLibraryData(a, "comments", 1, l)["catch"]((function(o) {
              U.warn("[CommentPanel] 预加载 JAVLib 评论失败:", o);
              if (CommentPanel.preloadCache.videoCode === r) {
                CommentPanel.preloadCache.javlibCommentsPromise = null;
              }
              throw o;
            }));
            CommentPanel.preloadCache.javlibReviewsPromise = fetchJavLibraryData(a, "reviews", 1, l)["catch"]((function(o) {
              U.warn("[CommentPanel] 预加载 JAVLib 文章失败:", o);
              if (CommentPanel.preloadCache.videoCode === r) {
                CommentPanel.preloadCache.javlibReviewsPromise = null;
              }
              throw o;
            }));
            return o;
          }))["catch"]((function(o) {
            U.warn("[CommentPanel] 预加载 JAVLibrary ID 失败:", o);
            if (CommentPanel.preloadCache.videoCode === r) {
              CommentPanel.preloadCache.javlibVideoIdPromise = null;
            }
            throw o;
          }));
        }
        if (a.javdb !== false) {
          CommentPanel.preloadCache.javdbMovieIdPromise = fetchJavdbMovieId(r).then((function(o) {
            var a = o.movieId, l = o.domain;
            U.log("[CommentPanel] 预加载 JavDB MovieId 成功: ".concat(a, " (域名: ").concat(l, ")"));
            CommentPanel.preloadCache.javdbCommentsPromise = fetchJavdbData(a, 1, l)["catch"]((function(o) {
              U.warn("[CommentPanel] 预加载 JavDB 短评失败:", o);
              if (CommentPanel.preloadCache.videoCode === r) {
                CommentPanel.preloadCache.javdbCommentsPromise = null;
              }
              throw o;
            }));
            return o;
          }))["catch"]((function(o) {
            U.warn("[CommentPanel] 预加载 JavDB MovieId 失败:", o);
            if (CommentPanel.preloadCache.videoCode === r) {
              CommentPanel.preloadCache.javdbMovieIdPromise = null;
            }
            throw o;
          }));
        }
      }
    } ]);
  }();
  CommentPanel_defineProperty(Ae, "preloadCache", {
    "videoCode": "",
    "jableCommentsPromise": null,
    "javlibVideoIdPromise": null,
    "javlibCommentsPromise": null,
    "javlibReviewsPromise": null,
    "javdbMovieIdPromise": null,
    "javdbCommentsPromise": null
  });
  function VolumeController_typeof(r) {
    "@babel/helpers - typeof";
    return VolumeController_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, VolumeController_typeof(r);
  }
  function VolumeController_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function VolumeController_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, VolumeController_toPropertyKey(l.key), l);
    }
  }
  function VolumeController_createClass(r, o, a) {
    return o && VolumeController_defineProperties(r.prototype, o), a && VolumeController_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function VolumeController_toPropertyKey(r) {
    var o = VolumeController_toPrimitive(r, "string");
    return "symbol" == VolumeController_typeof(o) ? o : o + "";
  }
  function VolumeController_toPrimitive(r, o) {
    if ("object" != VolumeController_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != VolumeController_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Fe = function() {
    function VolumeController(r, o) {
      VolumeController_classCallCheck(this, VolumeController);
      this.playerCore = r;
      this.controlManager = o;
      this.targetVideo = r.targetVideo;
      this.uiElements = r.uiElements || o.uiElements;
      this.volumeSlider = null;
      this.volumeLevel = null;
      this.volumeValue = null;
      this.lastVolume = 1;
      this.supportsVolumeControl = this.checkVolumeControlSupport();
      this.dragHandler = null;
      this.upHandler = null;
    }
    return VolumeController_createClass(VolumeController, [ {
      "key": "checkVolumeControlSupport",
      "value": function checkVolumeControlSupport() {
        var r = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        return !r;
      }
    }, {
      "key": "createVolumeSlider",
      "value": function createVolumeSlider(r) {
        var o = this;
        var a = document.createElement("div");
        a.className = "tm-volume-control";
        var l = document.createElement("button");
        l.className = "tm-volume-button";
        l.innerHTML = this.getVolumeIcon(this.targetVideo.volume);
        var u = document.createElement("div");
        u.className = "tm-volume-slider-container";
        var p = document.createElement("div");
        p.className = "tm-volume-slider-track";
        this.volumeLevel = document.createElement("div");
        this.volumeLevel.className = "tm-volume-slider-level";
        this.volumeLevel.style.width = "".concat(this.targetVideo.volume * 100, "%");
        this.volumeValue = document.createElement("div");
        this.volumeValue.className = "tm-volume-value";
        this.volumeValue.textContent = "".concat(Math.round(this.targetVideo.volume * 100), "%");
        p.appendChild(this.volumeLevel);
        u.appendChild(p);
        u.appendChild(this.volumeValue);
        a.appendChild(l);
        if (this.supportsVolumeControl) {
          a.appendChild(u);
        } else {
          a.classList.add("tm-volume-control-no-slider");
        }
        this.volumeSlider = a;
        var v = false;
        var b = false;
        var y = null;
        var C = function updateVolume(r) {
          if (!o.supportsVolumeControl) {
            return;
          }
          var a = p.getBoundingClientRect();
          var l = a.width;
          var u = (r - a.left) / l * 100;
          u = Math.max(0, Math.min(100, u));
          o.targetVideo.volume = u / 100;
          o.targetVideo.muted = false;
          o.updateVolumeUI();
        };
        var k = function expandSlider() {
          if (!o.supportsVolumeControl) {
            return;
          }
          if (y) {
            clearTimeout(y);
          }
          a.classList.add("expanded");
          b = true;
        };
        var _ = function collapseSlider() {
          if (!o.supportsVolumeControl) {
            return;
          }
          if (!v) {
            a.classList.remove("expanded");
            b = false;
          }
        };
        l.addEventListener("click", (function(r) {
          r.stopPropagation();
          if (o.supportsVolumeControl && !b) {
            k();
            y = setTimeout(_, 3e3);
          } else {
            if (o.targetVideo.volume === 0 || o.targetVideo.muted) {
              o.targetVideo.muted = false;
              if (o.supportsVolumeControl) {
                o.targetVideo.volume = o.lastVolume;
              }
            } else if (o.supportsVolumeControl) {
              o.lastVolume = o.targetVideo.volume;
              o.targetVideo.volume = 0;
            } else {
              o.targetVideo.muted = true;
            }
            o.updateVolumeUI();
          }
        }));
        if (this.supportsVolumeControl) {
          p.addEventListener("click", (function(r) {
            r.stopPropagation();
            C(r.clientX);
          }));
          this.dragHandler = function(r) {
            if (!v) {
              return;
            }
            r.preventDefault();
            var o = r.type.includes("touch") ? r.touches[0].clientX : r.clientX;
            C(o);
          };
          this.upHandler = function() {
            if (v) {
              v = false;
              a.classList.remove("dragging");
              setTimeout(_, 1500);
              document.removeEventListener("mousemove", o.dragHandler);
              document.removeEventListener("mouseup", o.upHandler);
              document.removeEventListener("touchmove", o.dragHandler);
              document.removeEventListener("touchend", o.upHandler);
              document.removeEventListener("touchcancel", o.upHandler);
            }
          };
          p.addEventListener("mousedown", (function(r) {
            r.stopPropagation();
            v = true;
            a.classList.add("dragging");
            k();
            C(r.clientX);
            document.addEventListener("mousemove", o.dragHandler);
            document.addEventListener("mouseup", o.upHandler);
          }));
          p.addEventListener("touchstart", (function(r) {
            r.stopPropagation();
            v = true;
            a.classList.add("dragging");
            k();
            C(r.touches[0].clientX);
            document.addEventListener("touchmove", o.dragHandler, {
              "passive": false
            });
            document.addEventListener("touchend", o.upHandler);
            document.addEventListener("touchcancel", o.upHandler);
          }), {
            "passive": false
          });
        }
        r.appendChild(a);
      }
    }, {
      "key": "getVolumeIcon",
      "value": function getVolumeIcon(r) {
        if (this.targetVideo.muted || r === 0) {
          return S;
        } else if (this.supportsVolumeControl && r < .5) {
          return P;
        } else {
          return D;
        }
      }
    }, {
      "key": "updateVolumeUI",
      "value": function updateVolumeUI() {
        if (!this.volumeSlider) {
          return;
        }
        var r;
        if (this.supportsVolumeControl) {
          r = this.targetVideo.muted ? 0 : this.targetVideo.volume;
        } else {
          r = this.targetVideo.muted ? 0 : 1;
        }
        var o = this.volumeSlider.querySelector(".tm-volume-button");
        if (o) {
          o.innerHTML = this.getVolumeIcon(r);
        }
        if (!this.supportsVolumeControl) {
          return;
        }
        if (this.volumeLevel) {
          var a = Math.max(0, Math.min(100, r * 100));
          this.volumeLevel.style.width = "calc(".concat(a, "% - 2px)");
        }
        if (this.volumeValue) {
          var l = Math.round(r * 100);
          this.volumeValue.textContent = "".concat(l, "%");
          this.volumeValue.classList.remove("volume-high", "volume-medium", "volume-low", "volume-muted");
          if (r === 0 || this.targetVideo.muted) {
            this.volumeValue.classList.add("volume-muted");
          } else if (r < .3) {
            this.volumeValue.classList.add("volume-low");
          } else if (r < .7) {
            this.volumeValue.classList.add("volume-medium");
          } else {
            this.volumeValue.classList.add("volume-high");
          }
        }
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
        if (this.dragHandler) {
          document.removeEventListener("mousemove", this.dragHandler);
          this.dragHandler = null;
        }
        if (this.upHandler) {
          document.removeEventListener("mouseup", this.upHandler);
          this.upHandler = null;
        }
      }
    } ]);
  }();
  function SeekController_typeof(r) {
    "@babel/helpers - typeof";
    return SeekController_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, SeekController_typeof(r);
  }
  function SeekController_toConsumableArray(r) {
    return SeekController_arrayWithoutHoles(r) || SeekController_iterableToArray(r) || SeekController_unsupportedIterableToArray(r) || SeekController_nonIterableSpread();
  }
  function SeekController_nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function SeekController_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return SeekController_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? SeekController_arrayLikeToArray(r, o) : void 0;
    }
  }
  function SeekController_iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function SeekController_arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return SeekController_arrayLikeToArray(r);
    }
  }
  function SeekController_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function SeekController_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function SeekController_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, SeekController_toPropertyKey(l.key), l);
    }
  }
  function SeekController_createClass(r, o, a) {
    return o && SeekController_defineProperties(r.prototype, o), a && SeekController_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function SeekController_toPropertyKey(r) {
    var o = SeekController_toPrimitive(r, "string");
    return "symbol" == SeekController_typeof(o) ? o : o + "";
  }
  function SeekController_toPrimitive(r, o) {
    if ("object" != SeekController_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != SeekController_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Te = function() {
    function SeekController(r, o) {
      SeekController_classCallCheck(this, SeekController);
      this.playerCore = r;
      this.controlManager = o;
      this.targetVideo = r.targetVideo;
      this.uiElements = r.uiElements || o.uiElements;
    }
    return SeekController_createClass(SeekController, [ {
      "key": "seekRelative",
      "value": function seekRelative(r) {
        if (!this.targetVideo) {
          return;
        }
        var o = Math.max(0, Math.min(this.targetVideo.duration, this.targetVideo.currentTime + r));
        this.targetVideo.currentTime = o;
      }
    }, {
      "key": "createSeekControlRow",
      "value": function createSeekControlRow() {
        var r = this;
        var o = document.createElement("div");
        o.className = "tm-seek-control-row";
        var a = document.createElement("div");
        a.className = "tm-rewind-group";
        var l = document.createElement("div");
        l.className = "tm-forward-group";
        var u = document.createElement("div");
        u.className = "tm-rewind-buttons-container";
        var p = document.createElement("div");
        p.className = "tm-forward-buttons-container";
        a.appendChild(u);
        l.appendChild(p);
        o.appendChild(a);
        o.appendChild(l);
        var v = this.playerCore.options ? this.playerCore.options.playerState : null;
        var b = v && v.settings && Array.isArray(v.settings.enabledSeekSteps) ? v.settings.enabledSeekSteps : [ "5s", "10s", "30s", "1m", "5m", "10m" ];
        var y = function parseStepToSeconds(r) {
          var o = parseInt(r, 10) || 0;
          if (r.toLowerCase().endsWith("m")) {
            return o * 60;
          }
          return o;
        };
        var C = SeekController_toConsumableArray(b).sort((function(r, o) {
          return y(r) - y(o);
        }));
        C.forEach((function(o) {
          var a = y(o);
          if (a > 0) {
            r.addTimeControlButton(u, "-".concat(o), (function() {
              return r.seekRelative(-a);
            }));
          }
        }));
        C.forEach((function(o) {
          var a = y(o);
          if (a > 0) {
            r.addTimeControlButton(p, "+".concat(o), (function() {
              return r.seekRelative(a);
            }));
          }
        }));
        return o;
      }
    }, {
      "key": "addTimeControlButton",
      "value": function addTimeControlButton(r, o, a) {
        var l = function calculateOpacity(r) {
          var o = parseInt(r.replace(/[+-]/g, ""));
          var a = r.includes("m") ? "m" : "s";
          var l = .5;
          if (a === "s") {
            if (o <= 5) {
              l = .5;
            } else if (o <= 10) {
              l = .6;
            } else {
              l = .7;
            }
          } else if (a === "m") {
            if (o === 1) {
              l = .8;
            } else if (o === 5) {
              l = .9;
            } else {
              l = 1;
            }
          }
          return l;
        };
        var u = l(o);
        var p = document.createElement("button");
        p.className = "tm-time-control-button";
        p.style.setProperty("--btn-opacity", u);
        var v = o.includes("-");
        var b = o.includes("+");
        var y = o.replace(/[+-]/g, "");
        if (v) {
          p.innerHTML = '<div class="tm-time-control-button-inner">'.concat(L, '<span class="tm-time-text-margin-left">').concat(y, "</span></div>");
        } else if (b) {
          p.innerHTML = '<div class="tm-time-control-button-inner"><span class="tm-time-text-margin-right">'.concat(y, "</span>").concat(M, "</div>");
        } else {
          p.textContent = o;
        }
        p.addEventListener("click", a);
        p.addEventListener("mouseover", (function() {
          p.classList.add("tm-time-control-button-hover");
          p.classList.remove("tm-time-control-button-default");
        }));
        p.addEventListener("mouseout", (function() {
          p.classList.add("tm-time-control-button-default");
          p.classList.remove("tm-time-control-button-hover", "tm-time-control-button-active", "tm-time-control-button-after-active");
        }));
        p.addEventListener("mousedown", (function() {
          p.classList.add("tm-time-control-button-active");
          p.classList.remove("tm-time-control-button-hover", "tm-time-control-button-default", "tm-time-control-button-after-active");
        }));
        p.addEventListener("mouseup", (function() {
          p.classList.add("tm-time-control-button-after-active");
          p.classList.remove("tm-time-control-button-active", "tm-time-control-button-hover", "tm-time-control-button-default");
        }));
        r.appendChild(p);
        return p;
      }
    } ]);
  }();
  function PlaybackController_typeof(r) {
    "@babel/helpers - typeof";
    return PlaybackController_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, PlaybackController_typeof(r);
  }
  function PlaybackController_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function PlaybackController_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, PlaybackController_toPropertyKey(l.key), l);
    }
  }
  function PlaybackController_createClass(r, o, a) {
    return o && PlaybackController_defineProperties(r.prototype, o), a && PlaybackController_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function PlaybackController_toPropertyKey(r) {
    var o = PlaybackController_toPrimitive(r, "string");
    return "symbol" == PlaybackController_typeof(o) ? o : o + "";
  }
  function PlaybackController_toPrimitive(r, o) {
    if ("object" != PlaybackController_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != PlaybackController_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var je = function() {
    function PlaybackController(r, o) {
      PlaybackController_classCallCheck(this, PlaybackController);
      this.playerCore = r;
      this.controlManager = o;
      this.targetVideo = r.targetVideo;
      this.uiElements = r.uiElements || o.uiElements;
      this.playPauseButton = null;
      this.playbackRateSlider = null;
      this.updatePlaybackRateSliderFn = null;
      this.pauseIndicator = null;
      this.dragHandler = null;
      this.upHandler = null;
    }
    return PlaybackController_createClass(PlaybackController, [ {
      "key": "createPlayPauseButton",
      "value": function createPlayPauseButton(r) {
        var o = this;
        this.playPauseButton = document.createElement("button");
        this.playPauseButton.className = "tm-control-button";
        this.playPauseButton.addEventListener("click", (function() {
          if (o.targetVideo.paused) {
            o.targetVideo.play();
          } else {
            o.targetVideo.pause();
          }
          o.updatePlayPauseButton();
        }));
        this.playPauseButton.addEventListener("mouseover", (function() {
          o.playPauseButton.classList.add("tm-control-button-hover");
          o.playPauseButton.classList.remove("tm-control-button-default");
        }));
        this.playPauseButton.addEventListener("mouseout", (function() {
          o.playPauseButton.classList.add("tm-control-button-default");
          o.playPauseButton.classList.remove("tm-control-button-hover");
        }));
        r.appendChild(this.playPauseButton);
        this.updatePlayPauseButton();
        return this.playPauseButton;
      }
    }, {
      "key": "updatePlayPauseButton",
      "value": function updatePlayPauseButton() {
        if (!this.playPauseButton) {
          return;
        }
        if (this.targetVideo.paused) {
          this.playPauseButton.innerHTML = k;
        } else {
          this.playPauseButton.innerHTML = _;
        }
      }
    }, {
      "key": "createPlaybackRateSlider",
      "value": function createPlaybackRateSlider(r) {
        var o = this;
        var a = document.createElement("button");
        a.className = "tm-playback-rate-button";
        a.addEventListener("dblclick", (function(r) {
          r.stopPropagation();
          if (o.targetVideo.playbackRate !== 1) {
            o.targetVideo.playbackRate = 1;
            o.syncPlaybackRateSlider(1);
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(5);
            }
          }
        }));
        a.addEventListener("click", (function(r) {
          r.stopPropagation();
          var a = o.targetVideo.playbackRate;
          var l = 1;
          if (a === 1) {
            l = 1.2;
          } else if (a === 1.2) {
            l = 1.5;
          } else if (a === 1.5) {
            l = 2;
          } else {
            l = 1;
          }
          o.targetVideo.playbackRate = l;
          o.syncPlaybackRateSlider(l);
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(5);
          }
        }));
        r.appendChild(a);
        this.playbackRateSlider = a;
        this.syncPlaybackRateSlider(this.targetVideo.playbackRate);
      }
    }, {
      "key": "syncPlaybackRateSlider",
      "value": function syncPlaybackRateSlider(r) {
        if (this.playbackRateSlider) {
          var o = "".concat(r.toFixed(1), "x");
          this.playbackRateSlider.textContent = o;
          this.playbackRateSlider.className = "tm-playback-rate-button";
          if (r > 1.5) {
            this.playbackRateSlider.classList.add("fast");
          } else if (r > 1) {
            this.playbackRateSlider.classList.add("medium");
          } else {
            this.playbackRateSlider.classList.add("normal");
          }
        }
      }
    }, {
      "key": "showPauseIndicator",
      "value": function showPauseIndicator() {
        var r = this;
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
        this.pauseIndicator.innerHTML = E;
        this.uiElements.videoWrapper.appendChild(this.pauseIndicator);
        requestAnimationFrame((function() {
          r.pauseIndicator.classList.add("visible");
        }));
        setTimeout((function() {
          if (r.pauseIndicator) {
            r.pauseIndicator.classList.remove("visible");
            setTimeout((function() {
              if (r.pauseIndicator && r.pauseIndicator.parentNode) {
                r.pauseIndicator.parentNode.removeChild(r.pauseIndicator);
                r.pauseIndicator = null;
              }
            }), 300);
          }
        }), 1e3);
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
        this.playbackRateSlider = null;
        this.dragHandler = null;
        this.upHandler = null;
      }
    } ]);
  }();
  function ControlManager_typeof(r) {
    "@babel/helpers - typeof";
    return ControlManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, ControlManager_typeof(r);
  }
  function ControlManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function ControlManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, ControlManager_toPropertyKey(l.key), l);
    }
  }
  function ControlManager_createClass(r, o, a) {
    return o && ControlManager_defineProperties(r.prototype, o), a && ControlManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function ControlManager_toPropertyKey(r) {
    var o = ControlManager_toPrimitive(r, "string");
    return "symbol" == ControlManager_typeof(o) ? o : o + "";
  }
  function ControlManager_toPrimitive(r, o) {
    if ("object" != ControlManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != ControlManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Be = function() {
    function ControlManager(r, o) {
      ControlManager_classCallCheck(this, ControlManager);
      this.playerCore = r;
      this.targetVideo = r.targetVideo;
      this.uiElements = o;
      this.commentPanel = new Ae(r, this);
      this.volumeController = new Fe(r, this);
      this.seekController = new Te(r, this);
      this.playbackController = new je(r, this);
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
    return ControlManager_createClass(ControlManager, [ {
      "key": "volumeSlider",
      "get": function get() {
        return this.volumeController ? this.volumeController.volumeSlider : null;
      }
    }, {
      "key": "volumeLevel",
      "get": function get() {
        return this.volumeController ? this.volumeController.volumeLevel : null;
      }
    }, {
      "key": "volumeValue",
      "get": function get() {
        return this.volumeController ? this.volumeController.volumeValue : null;
      }
    }, {
      "key": "playbackRateSlider",
      "get": function get() {
        return this.playbackController ? this.playbackController.playbackRateSlider : null;
      }
    }, {
      "key": "playPauseButton",
      "get": function get() {
        return this.playbackController ? this.playbackController.playPauseButton : null;
      }
    }, {
      "key": "pauseIndicator",
      "get": function get() {
        return this.playbackController ? this.playbackController.pauseIndicator : null;
      }
    }, {
      "key": "playbackRateIndicator",
      "get": function get() {
        return this.playbackController ? this.playbackController.playbackRateIndicator : null;
      }
    }, {
      "key": "updatePlayPauseButton",
      "value": function updatePlayPauseButton() {
        if (this.playbackController) {
          this.playbackController.updatePlayPauseButton();
        }
      }
    }, {
      "key": "showPauseIndicator",
      "value": function showPauseIndicator() {
        if (this.playbackController) {
          this.playbackController.showPauseIndicator();
        }
      }
    }, {
      "key": "setLoopManager",
      "value": function setLoopManager(r) {
        this.loopManager = r;
      }
    }, {
      "key": "init",
      "value": function init() {
        this.progressControlsContainer = this.createProgressControls();
        this.controlButtonsContainer = this.createControlButtonsContainer();
        this.initEventListeners();
        return {
          "progressControlsContainer": this.progressControlsContainer,
          "controlButtonsContainer": this.controlButtonsContainer
        };
      }
    }, {
      "key": "createProgressControls",
      "value": function createProgressControls() {
        var r = this;
        this.progressControlsContainer = document.createElement("div");
        this.progressControlsContainer.className = "tm-progress-controls";
        var o = document.createElement("div");
        o.className = "tm-time-display-container";
        this.currentTimeDisplay = document.createElement("span");
        this.currentTimeDisplay.className = "tm-current-time";
        this.currentTimeDisplay.textContent = "00:00:00";
        this.totalDurationDisplay = document.createElement("span");
        this.totalDurationDisplay.className = "tm-total-duration";
        this.totalDurationDisplay.textContent = "-00:00:00";
        var a = document.createElement("div");
        a.className = "tm-progress-bar-container";
        this.progressBarContainer = a;
        this.progressBarElement = document.createElement("div");
        this.progressBarElement.className = "tm-progress-bar";
        this.progressIndicator = document.createElement("div");
        this.progressIndicator.className = "tm-progress-indicator";
        a.addEventListener("mouseenter", (function() {
          r.progressBarElement.classList.add("tm-progress-bar-expanded");
        }));
        a.addEventListener("mouseleave", (function() {
          if (!r.isDraggingProgress) {
            r.progressBarElement.classList.add("tm-progress-bar-normal");
            r.progressBarElement.classList.remove("tm-progress-bar-expanded");
          }
        }));
        a.addEventListener("touchstart", (function() {
          r.progressBarElement.classList.add("tm-progress-bar-expanded");
          r.progressBarElement.classList.remove("tm-progress-bar-normal");
        }), {
          "passive": true
        });
        a.addEventListener("touchend", (function() {
          if (!r.isDraggingProgress) {
            r.progressBarElement.classList.add("tm-progress-bar-normal");
            r.progressBarElement.classList.remove("tm-progress-bar-expanded");
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
        o.appendChild(this.currentTimeDisplay);
        o.appendChild(this.totalDurationDisplay);
        this.progressBarElement.appendChild(this.progressIndicator);
        a.appendChild(this.progressBarElement);
        this.progressMarkersContainer = document.createElement("div");
        this.progressMarkersContainer.className = "tm-progress-markers-container";
        a.appendChild(this.progressMarkersContainer);
        a.appendChild(this.loopStartMarker);
        a.appendChild(this.loopEndMarker);
        a.appendChild(this.loopRangeElement);
        this.progressControlsContainer.appendChild(o);
        this.progressControlsContainer.appendChild(a);
        return this.progressControlsContainer;
      }
    }, {
      "key": "createControlButtonsContainer",
      "value": function createControlButtonsContainer() {
        var r = this;
        this.controlButtonsContainer = document.createElement("div");
        this.controlButtonsContainer.className = "tm-control-buttons";
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "tm-control-drag-handle";
        this.dragHandle.title = "拖动移动控制面板 (双击重置位置)";
        this.controlButtonsContainer.appendChild(this.dragHandle);
        var o = this.commentPanel.createCommentRow();
        this.controlButtonsContainer.appendChild(o);
        var a = document.createElement("div");
        a.className = "tm-progress-row";
        this.progressRow = a;
        a.appendChild(this.progressControlsContainer);
        this.controlButtonsContainer.appendChild(a);
        var l = this.seekController.createSeekControlRow();
        this.controlButtonsContainer.appendChild(l);
        var u = document.createElement("div");
        u.className = "tm-loop-control-row";
        this.tabScrollContainer = document.createElement("div");
        this.tabScrollContainer.className = "tm-tab-scroll-container";
        this.tabAddBtn = document.createElement("div");
        this.tabAddBtn.className = "tm-tab-list-btn";
        this.tabAddBtn.textContent = "☰";
        u.appendChild(this.tabScrollContainer);
        u.appendChild(this.tabAddBtn);
        this.controlButtonsContainer.appendChild(u);
        var p = document.createElement("div");
        p.className = "tm-playback-control-row";
        var v = document.createElement("div");
        v.className = "tm-left-controls";
        v.style.display = "flex";
        v.style.alignItems = "center";
        v.style.gap = "6px";
        v.style.flex = "1";
        this.volumeController.createVolumeSlider(v);
        var b = document.createElement("div");
        b.className = "tm-center-controls";
        b.style.display = "flex";
        b.style.alignItems = "center";
        b.style.justifyContent = "center";
        b.style.flex = "1";
        this.playbackController.createPlayPauseButton(b);
        var y = document.createElement("div");
        y.className = "tm-right-controls";
        y.style.display = "flex";
        y.style.alignItems = "center";
        y.style.justifyContent = "flex-end";
        y.style.flex = "1";
        y.style.gap = "6px";
        this.playbackController.createPlaybackRateSlider(y);
        p.appendChild(v);
        p.appendChild(b);
        p.appendChild(y);
        this.controlButtonsContainer.appendChild(p);
        var C = function dimCommentsOnControlInteract() {
          if (r.commentPanel && r.commentPanel.commentsPanel) {
            r.commentPanel.commentsPanel.classList.add("is-dimmed");
          }
        };
        this.controlButtonsContainer.addEventListener("mousedown", C, {
          "passive": true
        });
        this.controlButtonsContainer.addEventListener("touchstart", C, {
          "passive": true
        });
        return this.controlButtonsContainer;
      }
    }, {
      "key": "initEventListeners",
      "value": function initEventListeners() {
        var r = this;
        this._volumeChangeHandler = function() {
          if (r.volumeController) {
            r.volumeController.updateVolumeUI();
          }
        };
        this.targetVideo.addEventListener("volumechange", this._volumeChangeHandler);
        this._rateChangeHandler = function() {
          if (r.playbackController) {
            var o = r.targetVideo.playbackRate;
            r.playbackController.syncPlaybackRateSlider(o);
          }
        };
        this.targetVideo.addEventListener("ratechange", this._rateChangeHandler);
      }
    }, {
      "key": "showJumpHint",
      "value": function showJumpHint(r) {
        if (!this.progressBarContainer || !this.targetVideo) {
          return;
        }
        var o = this.targetVideo.duration || 1;
        var a = Math.max(0, Math.min(100, r / o * 100));
        var l = document.createElement("div");
        l.className = "tm-jump-active";
        l.style.left = "".concat(a, "%");
        this.progressBarContainer.appendChild(l);
        l.addEventListener("animationend", (function() {
          l.remove();
        }));
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
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
    } ]);
  }();
  function DragManager_typeof(r) {
    "@babel/helpers - typeof";
    return DragManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, DragManager_typeof(r);
  }
  function DragManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function DragManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, DragManager_toPropertyKey(l.key), l);
    }
  }
  function DragManager_createClass(r, o, a) {
    return o && DragManager_defineProperties(r.prototype, o), a && DragManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function DragManager_toPropertyKey(r) {
    var o = DragManager_toPrimitive(r, "string");
    return "symbol" == DragManager_typeof(o) ? o : o + "";
  }
  function DragManager_toPrimitive(r, o) {
    if ("object" != DragManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != DragManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Ie = function() {
    function DragManager(r, o) {
      DragManager_classCallCheck(this, DragManager);
      this.playerCore = r;
      this.playerCore.dragManager = this;
      this.targetVideo = r.targetVideo;
      this.uiElements = o;
      this.container = o.container;
      this.handle = o.handle;
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
    return DragManager_createClass(DragManager, [ {
      "key": "init",
      "value": function init() {
        this.handle.addEventListener("mousedown", this.startHandleDrag.bind(this));
        this.handle.addEventListener("touchstart", this.startHandleDrag.bind(this), {
          "passive": false
        });
        this.initControlPanelDrag();
        return this;
      }
    }, {
      "key": "updateHandlePosition",
      "value": function updateHandlePosition() {}
    }, {
      "key": "startHandleDrag",
      "value": function startHandleDrag(r) {
        this.isDraggingHandle = true;
        this.handle.classList.add("dragging");
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(5);
        }
        var o = r.type.includes("touch");
        this.startY = o ? r.touches[0].clientY : r.clientY;
        this.startHeight = this.container.offsetHeight;
        var a = this._handleDragMove.bind(this);
        var l = this._handleDragEnd.bind(this);
        if (o) {
          document.addEventListener("touchmove", a, {
            "passive": false
          });
          document.addEventListener("touchend", l);
          document.addEventListener("touchcancel", l);
        } else {
          document.addEventListener("mousemove", a);
          document.addEventListener("mouseup", l);
        }
        this.handleMoveHandler = a;
        this.handleEndHandler = l;
        r.preventDefault();
      }
    }, {
      "key": "_handleDragMove",
      "value": function _handleDragMove(r) {
        if (!this.isDraggingHandle) {
          return;
        }
        r.preventDefault();
        var o = r.type.includes("touch");
        var a = o ? r.touches[0].clientY : r.clientY;
        var l = a - this.startY;
        var u = parseFloat(this.container.style.minHeight) || window.innerWidth * (9 / 16);
        var p = Math.max(u, this.startHeight + l);
        this.container.style.height = p + "px";
        if (this.playerCore.uiManager) {
          this.playerCore.uiManager.isCustomResized = true;
          if (!this.playerCore.uiManager.isLandscape) {
            this.playerCore.uiManager.customHeightPortrait = p + "px";
          } else {
            this.playerCore.uiManager.customHeightLandscape = p + "px";
          }
        }
      }
    }, {
      "key": "_handleDragEnd",
      "value": function _handleDragEnd(r) {
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
        if (r.type.startsWith("touch")) {
          r.preventDefault();
        }
      }
    }, {
      "key": "initControlPanelDrag",
      "value": function initControlPanelDrag() {
        var r = this;
        setTimeout((function() {
          if (!r.playerCore.controlManager) {
            return;
          }
          r.controlButtonsContainer = r.playerCore.controlManager.controlButtonsContainer;
          r.dragHandle = r.playerCore.controlManager.dragHandle;
          if (!r.controlButtonsContainer || !r.dragHandle) {
            return;
          }
          r.dragHandle.addEventListener("mousedown", r.startControlPanelDrag.bind(r));
          r.dragHandle.addEventListener("touchstart", r.startControlPanelDrag.bind(r), {
            "passive": false
          });
          r.dragHandle.addEventListener("dblclick", r.resetControlPanelPosition.bind(r));
          if (r.playerCore.uiManager && r.playerCore.uiManager.isFloatingControlPanel) {
            r.restoreControlPanelPosition();
          }
        }), 100);
      }
    }, {
      "key": "startControlPanelDrag",
      "value": function startControlPanelDrag(r) {
        if (!this.playerCore.uiManager || !this.playerCore.uiManager.isFloatingControlPanel) {
          return;
        }
        if (r.type === "mousedown" && r.button !== 0) {
          return;
        }
        this.isDraggingControlPanel = true;
        this.controlButtonsContainer.classList.add("dragging");
        this.updateDockedState(null, false);
        var o = r.type.includes("touch");
        this.ctrlStartX = o ? r.touches[0].clientX : r.clientX;
        this.ctrlStartY = o ? r.touches[0].clientY : r.clientY;
        var a = this.controlButtonsContainer.getBoundingClientRect();
        this.ctrlStartLeft = a.left;
        this.ctrlStartTop = a.top;
        var l = this._handleControlPanelMove.bind(this);
        var u = this._handleControlPanelEnd.bind(this);
        if (o) {
          document.addEventListener("touchmove", l, {
            "passive": false
          });
          document.addEventListener("touchend", u);
          document.addEventListener("touchcancel", u);
        } else {
          document.addEventListener("mousemove", l);
          document.addEventListener("mouseup", u);
        }
        this.ctrlMoveHandler = l;
        this.ctrlEndHandler = u;
        r.preventDefault();
        r.stopPropagation();
      }
    }, {
      "key": "_handleControlPanelMove",
      "value": function _handleControlPanelMove(r) {
        if (!this.isDraggingControlPanel) {
          return;
        }
        r.preventDefault();
        var o = r.type.includes("touch");
        var a = o ? r.touches[0].clientX : r.clientX;
        var l = o ? r.touches[0].clientY : r.clientY;
        var u = a - this.ctrlStartX;
        var p = l - this.ctrlStartY;
        var v = this.ctrlStartLeft + u;
        var b = this.ctrlStartTop + p;
        var y = this.controlButtonsContainer.getBoundingClientRect();
        var C = 16;
        var k = 44;
        var _ = C;
        var E = window.innerWidth - y.width - C;
        var S = k + C;
        var P = window.innerHeight - y.height - C;
        v = Math.max(_ - 10, Math.min(v, E + 10));
        b = Math.max(S - 10, Math.min(b, P + 10));
        this.controlButtonsContainer.style.left = v + "px";
        this.controlButtonsContainer.style.top = b + "px";
        this.controlButtonsContainer.style.bottom = "auto";
        this.controlButtonsContainer.style.right = "auto";
        this.controlButtonsContainer.style.transform = "none";
      }
    }, {
      "key": "_handleControlPanelEnd",
      "value": function _handleControlPanelEnd(r) {
        var o = this;
        if (!this.isDraggingControlPanel) {
          return;
        }
        this.isDraggingControlPanel = false;
        this.controlButtonsContainer.classList.remove("dragging");
        var a = r.type.startsWith("touch");
        if (a) {
          document.removeEventListener("touchmove", this.ctrlMoveHandler);
          document.removeEventListener("touchend", this.ctrlEndHandler);
          document.removeEventListener("touchcancel", this.ctrlEndHandler);
        } else {
          document.removeEventListener("mousemove", this.ctrlMoveHandler);
          document.removeEventListener("mouseup", this.ctrlEndHandler);
        }
        this.ctrlMoveHandler = null;
        this.ctrlEndHandler = null;
        var l = this.controlButtonsContainer.getBoundingClientRect();
        var u = l.width;
        var p = l.height;
        var v = window.innerWidth;
        var b = window.innerHeight;
        var y = 16;
        var C = 44;
        var k = l.left;
        var _ = l.top;
        var E = [ {
          "name": "TL",
          "x": y,
          "y": C + y
        }, {
          "name": "TC",
          "x": (v - u) / 2,
          "y": C + y
        }, {
          "name": "TR",
          "x": v - u - y,
          "y": C + y
        }, {
          "name": "LC",
          "x": y,
          "y": (b - p) / 2
        }, {
          "name": "RC",
          "x": v - u - y,
          "y": (b - p) / 2
        }, {
          "name": "BL",
          "x": y,
          "y": b - p - y
        }, {
          "name": "BC",
          "x": (v - u) / 2,
          "y": b - p - y
        }, {
          "name": "BR",
          "x": v - u - y,
          "y": b - p - y
        } ];
        var S = E[0];
        var P = Math.hypot(k - S.x, _ - S.y);
        for (var D = 1; D < E.length; D++) {
          var L = Math.hypot(k - E[D].x, _ - E[D].y);
          if (L < P) {
            P = L;
            S = E[D];
          }
        }
        var M = 90;
        var A = false;
        if (P < M) {
          k = S.x;
          _ = S.y;
          A = true;
        } else {
          var T = y;
          var j = v - u - y;
          var B = C + y;
          var I = b - p - y;
          k = Math.max(T, Math.min(k, j));
          _ = Math.max(B, Math.min(_, I));
        }
        if (A) {
          if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
          this.controlButtonsContainer.style.transition = "left 0.25s cubic-bezier(0.25, 1, 0.5, 1), top 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, transform 0.3s ease";
          this.controlButtonsContainer.style.left = k + "px";
          this.controlButtonsContainer.style.top = _ + "px";
          setTimeout((function() {
            if (o.controlButtonsContainer) {
              o.controlButtonsContainer.style.transition = "";
            }
          }), 260);
        } else {
          this.controlButtonsContainer.style.left = k + "px";
          this.controlButtonsContainer.style.top = _ + "px";
        }
        var V = {
          "left": k,
          "top": _,
          "anchorName": A ? S.name : null,
          "didSnap": A
        };
        var O = this.getControlPanelStorageKey();
        localStorage.setItem(O, JSON.stringify(V));
        localStorage.setItem("tm-control-panel-pos", JSON.stringify(V));
        this.updateDockedState(A ? S.name : null, A);
        if (a) {
          r.preventDefault();
        }
        r.stopPropagation();
      }
    }, {
      "key": "getControlPanelStorageKey",
      "value": function getControlPanelStorageKey() {
        var r = this.playerCore.uiManager ? this.playerCore.uiManager.isLandscape : window.innerWidth > window.innerHeight;
        return r ? "tm-control-panel-pos-landscape" : "tm-control-panel-pos-portrait";
      }
    }, {
      "key": "restoreControlPanelPosition",
      "value": function restoreControlPanelPosition() {
        if (!this.controlButtonsContainer) {
          return;
        }
        if (this.playerCore.uiManager && !this.playerCore.uiManager.isFloatingControlPanel) {
          this.clearControlPanelInlineStyles();
          return;
        }
        var r = this.getControlPanelStorageKey();
        var o = localStorage.getItem(r);
        if (!o) {
          o = localStorage.getItem("tm-control-panel-pos");
        }
        if (o) {
          try {
            var a = JSON.parse(o);
            var l = a.left;
            var u = a.top;
            var p = a.anchorName;
            var v = a.didSnap;
            var b = this.controlButtonsContainer.getBoundingClientRect();
            var y = b.width || 348;
            var C = b.height || 180;
            var k = window.innerWidth;
            var _ = window.innerHeight;
            var E = 16;
            var S = 44;
            if (v && p) {
              var P = {
                "TL": {
                  "x": E,
                  "y": S + E
                },
                "TC": {
                  "x": (k - y) / 2,
                  "y": S + E
                },
                "TR": {
                  "x": k - y - E,
                  "y": S + E
                },
                "LC": {
                  "x": E,
                  "y": (_ - C) / 2
                },
                "RC": {
                  "x": k - y - E,
                  "y": (_ - C) / 2
                },
                "BL": {
                  "x": E,
                  "y": _ - C - E
                },
                "BC": {
                  "x": (k - y) / 2,
                  "y": _ - C - E
                },
                "BR": {
                  "x": k - y - E,
                  "y": _ - C - E
                }
              };
              if (P[p]) {
                l = P[p].x;
                u = P[p].y;
              }
            }
            var D = E;
            var L = k - y - E;
            var M = S + E;
            var A = _ - C - E;
            var T = Math.max(D, Math.min(l, L));
            var j = Math.max(M, Math.min(u, A));
            this.controlButtonsContainer.style.left = T + "px";
            this.controlButtonsContainer.style.top = j + "px";
            this.controlButtonsContainer.style.bottom = "auto";
            this.controlButtonsContainer.style.right = "auto";
            this.controlButtonsContainer.style.transform = "none";
            this.updateDockedState(p, v);
          } catch (r) {}
        }
      }
    }, {
      "key": "updateDockedState",
      "value": function updateDockedState(r, o) {
        if (!this.controlButtonsContainer) {
          return;
        }
        var a = window.innerWidth >= 930 && window.matchMedia("(orientation: landscape)").matches;
        var l = this.controlButtonsContainer.closest(".tm-player-container");
        if (!l) {
          return;
        }
        l.classList.remove("tm-controls-docked-tr", "tm-controls-docked-br", "tm-controls-docked-tl", "tm-controls-docked-bl");
        var u = l.classList.contains("tm-sidebar-hidden");
        var p = this.playerCore.options.playerState ? this.playerCore.options.playerState.settings.sidebarPosition : "right";
        var v = p === "right" && (r === "TR" || r === "BR");
        var b = p === "left" && (r === "TL" || r === "BL");
        var y = a && o && (v || b) && !u;
        if (y) {
          var C = this.controlButtonsContainer.getBoundingClientRect();
          var k = C.height || 180;
          l.style.setProperty("--docked-controls-height", k + "px");
          l.classList.add("tm-controls-docked-".concat(r.toLowerCase()));
        } else {
          l.style.removeProperty("--docked-controls-height");
        }
      }
    }, {
      "key": "reapplyDockedState",
      "value": function reapplyDockedState() {
        var r = this.getControlPanelStorageKey();
        var o = localStorage.getItem(r);
        if (!o) {
          o = localStorage.getItem("tm-control-panel-pos");
        }
        if (o) {
          try {
            var a = JSON.parse(o);
            if (a.didSnap && a.anchorName) {
              this.updateDockedState(a.anchorName, a.didSnap);
              return;
            }
          } catch (r) {}
        }
        this.updateDockedState(null, false);
      }
    }, {
      "key": "clearControlPanelInlineStyles",
      "value": function clearControlPanelInlineStyles() {
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
    }, {
      "key": "resetControlPanelPosition",
      "value": function resetControlPanelPosition() {
        localStorage.removeItem("tm-control-panel-pos");
        localStorage.removeItem("tm-control-panel-pos-portrait");
        localStorage.removeItem("tm-control-panel-pos-landscape");
        this.clearControlPanelInlineStyles();
      }
    } ]);
  }();
  function LoopManager_typeof(r) {
    "@babel/helpers - typeof";
    return LoopManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, LoopManager_typeof(r);
  }
  function LoopManager_slicedToArray(r, o) {
    return LoopManager_arrayWithHoles(r) || LoopManager_iterableToArrayLimit(r, o) || LoopManager_unsupportedIterableToArray(r, o) || LoopManager_nonIterableRest();
  }
  function LoopManager_nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function LoopManager_iterableToArrayLimit(r, o) {
    var a = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != a) {
      var l, u, p, v, b = [], y = !0, C = !1;
      try {
        if (p = (a = a.call(r)).next, 0 === o) {
          if (Object(a) !== a) {
            return;
          }
          y = !1;
        } else {
          for (;!(y = (l = p.call(a)).done) && (b.push(l.value), b.length !== o); y = !0) {}
        }
      } catch (r) {
        C = !0, u = r;
      } finally {
        try {
          if (!y && null != a["return"] && (v = a["return"](), Object(v) !== v)) {
            return;
          }
        } finally {
          if (C) {
            throw u;
          }
        }
      }
      return b;
    }
  }
  function LoopManager_arrayWithHoles(r) {
    if (Array.isArray(r)) {
      return r;
    }
  }
  function LoopManager_toConsumableArray(r) {
    return LoopManager_arrayWithoutHoles(r) || LoopManager_iterableToArray(r) || LoopManager_unsupportedIterableToArray(r) || LoopManager_nonIterableSpread();
  }
  function LoopManager_nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function LoopManager_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return LoopManager_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? LoopManager_arrayLikeToArray(r, o) : void 0;
    }
  }
  function LoopManager_iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function LoopManager_arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return LoopManager_arrayLikeToArray(r);
    }
  }
  function LoopManager_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function LoopManager_ownKeys(r, o) {
    var a = Object.keys(r);
    if (Object.getOwnPropertySymbols) {
      var l = Object.getOwnPropertySymbols(r);
      o && (l = l.filter((function(o) {
        return Object.getOwnPropertyDescriptor(r, o).enumerable;
      }))), a.push.apply(a, l);
    }
    return a;
  }
  function LoopManager_objectSpread(r) {
    for (var o = 1; o < arguments.length; o++) {
      var a = null != arguments[o] ? arguments[o] : {};
      o % 2 ? LoopManager_ownKeys(Object(a), !0).forEach((function(o) {
        LoopManager_defineProperty(r, o, a[o]);
      })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(a)) : LoopManager_ownKeys(Object(a)).forEach((function(o) {
        Object.defineProperty(r, o, Object.getOwnPropertyDescriptor(a, o));
      }));
    }
    return r;
  }
  function LoopManager_defineProperty(r, o, a) {
    return (o = LoopManager_toPropertyKey(o)) in r ? Object.defineProperty(r, o, {
      "value": a,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : r[o] = a, r;
  }
  function LoopManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function LoopManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, LoopManager_toPropertyKey(l.key), l);
    }
  }
  function LoopManager_createClass(r, o, a) {
    return o && LoopManager_defineProperties(r.prototype, o), a && LoopManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function LoopManager_toPropertyKey(r) {
    var o = LoopManager_toPrimitive(r, "string");
    return "symbol" == LoopManager_typeof(o) ? o : o + "";
  }
  function LoopManager_toPrimitive(r, o) {
    if ("object" != LoopManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != LoopManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Ve = function() {
    function LoopManager(r, o) {
      LoopManager_classCallCheck(this, LoopManager);
      this.playerCore = r;
      this.targetVideo = r.targetVideo;
      this.uiElements = o;
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
      this._sheetOverlay = null;
      this._sheetPanel = null;
      this._sheetList = null;
      this.editingTabId = null;
      this.editingTabCopy = null;
      this._durationFallbackBound = null;
      this.tabColors = [ "200, 100%, 55%", "145, 80%, 48%", "260, 85%, 62%", "15, 95%, 58%", "330, 90%, 60%", "170, 85%, 42%" ];
      this._handleLoopTimeUpdate = this._handleLoopTimeUpdate.bind(this);
      this._handleOutsideClickForEdit = this._handleOutsideClickForEdit.bind(this);
    }
    return LoopManager_createClass(LoopManager, [ {
      "key": "init",
      "value": function init(r) {
        var o = this;
        this.loopStartMarker = r.loopStartMarker;
        this.loopEndMarker = r.loopEndMarker;
        this.loopRangeElement = r.loopRangeElement;
        this.progressMarkersContainer = r.progressMarkersContainer;
        this.tabScrollContainer = r.tabScrollContainer;
        this.tabAddBtn = r.tabAddBtn;
        var a = getVideoCodeFromUrl();
        this.storageKey = a ? "tabs_".concat(a) : null;
        this._loadTabs();
        this._resetDraftTab();
        this.renderTabs();
        if (this.tabAddBtn) {
          this.tabAddBtn.addEventListener("click", (function(r) {
            r.stopPropagation();
            o._toggleBottomSheet();
          }));
        }
        if (this.tabScrollContainer) {
          this.tabScrollContainer.addEventListener("wheel", (function(r) {
            if (r.deltaY !== 0) {
              r.preventDefault();
              o.tabScrollContainer.scrollLeft += r.deltaY;
            }
          }), {
            "passive": false
          });
        }
        this._bindSwipeUpGesture();
        if (this.targetVideo) {
          this.targetVideo.addEventListener("durationchange", (function() {
            return o.renderProgressMarkers();
          }));
          this.targetVideo.addEventListener("loadedmetadata", (function() {
            return o.renderProgressMarkers();
          }));
        }
        this._parseUrlHashParams();
        return this;
      }
    }, {
      "key": "renderTabs",
      "value": function renderTabs() {
        var r = this;
        if (!this.tabScrollContainer) {
          return;
        }
        this.tabScrollContainer.innerHTML = "";
        this.renderProgressMarkers();
        this.tabs.forEach((function(o) {
          var a = r.editingTabId === o.id ? r._createEditPill(o) : r._createTabPill(o);
          r.tabScrollContainer.appendChild(a);
        }));
        if (!this.draftTab) {
          this._resetDraftTab();
        }
        var o = this._createDraftPill();
        this.tabScrollContainer.appendChild(o);
        this._updateActiveTabProgress();
      }
    }, {
      "key": "_createTabPill",
      "value": function _createTabPill(r) {
        var o = this;
        var a = this.tabs.findIndex((function(o) {
          return o.id === r.id;
        }));
        var l = a !== -1 ? this.tabColors[a % this.tabColors.length] : this.tabColors[0];
        var u = document.createElement("div");
        u.className = "tm-tab-pill";
        u.dataset.tabId = r.id;
        u.style.setProperty("--tab-color", l);
        if (r.type === "highlight") {
          u.textContent = formatTimeWithHours(r.startTime);
        } else {
          u.textContent = "".concat(formatTimeWithHours(r.startTime), " ~ ").concat(formatTimeWithHours(r.endTime));
        }
        if (this.activeTabId === r.id) {
          u.classList.add("active");
        }
        u.addEventListener("click", (function(a) {
          if (o._longPressTriggered) {
            o._longPressTriggered = false;
            return;
          }
          o._handleTabClick(r);
        }));
        var p = 0;
        var v = 0;
        var b = function startLongPress(a) {
          o._longPressTriggered = false;
          var l = a.touches ? a.touches[0] : a;
          p = l.clientX;
          v = l.clientY;
          o._longPressTimer = setTimeout((function() {
            o._longPressTriggered = true;
            o._handleTabLongPress(r);
            if (window.navigator.vibrate) {
              window.navigator.vibrate(15);
            }
          }), 500);
        };
        var y = function cancelLongPress() {
          if (o._longPressTimer) {
            clearTimeout(o._longPressTimer);
            o._longPressTimer = null;
          }
        };
        var C = function moveLongPress(r) {
          var o = r.touches ? r.touches[0] : r;
          var a = o.clientX - p;
          var l = o.clientY - v;
          if (Math.hypot(a, l) > 8) {
            y();
          }
        };
        u.addEventListener("mousedown", b);
        u.addEventListener("touchstart", b, {
          "passive": true
        });
        u.addEventListener("mousemove", C);
        u.addEventListener("touchmove", C, {
          "passive": true
        });
        u.addEventListener("mouseup", y);
        u.addEventListener("mouseleave", y);
        u.addEventListener("touchend", y);
        u.addEventListener("touchcancel", y);
        return u;
      }
    }, {
      "key": "_createDraftPill",
      "value": function _createDraftPill() {
        var r = this;
        var o = this.draftTab.startTime === null && this.draftTab.endTime === null;
        var a = o ? "0, 0%, 55%" : this.tabColors[this.tabs.length % this.tabColors.length];
        var l = document.createElement("div");
        l.className = "tm-tab-pill draft";
        if (o) {
          l.classList.add("placeholder");
        }
        l.style.setProperty("--tab-color", a);
        l.style.gap = "5px";
        if (o) {
          l.style.cursor = "pointer";
          l.addEventListener("click", (function() {
            if (r.targetVideo) {
              r.disableLoop();
              r.activeTabId = null;
              r.draftTab.startTime = r.targetVideo.currentTime;
              r.renderTabs();
              if (window.navigator.vibrate) {
                window.navigator.vibrate(10);
              }
            }
          }));
        }
        var u = document.createElement("span");
        u.style.cursor = "pointer";
        u.style.display = "flex";
        u.style.alignItems = "center";
        u.style.gap = "3px";
        u.style.padding = "2px 5px";
        u.style.borderRadius = "4px";
        u.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
        u.style.fontSize = "11px";
        var p = document.createElement("span");
        p.className = "tm-draft-label a";
        p.style.color = "white";
        p.style.fontWeight = "600";
        p.textContent = "A";
        var v = document.createElement("span");
        v.className = "tm-draft-time".concat(this.draftTab.startTime === null ? " placeholder" : "");
        v.style.color = this.draftTab.startTime !== null ? "#fff" : "rgba(255,255,255,0.3)";
        v.textContent = this.draftTab.startTime !== null ? formatTimeWithHours(this.draftTab.startTime) : "--:--:--";
        u.appendChild(p);
        u.appendChild(v);
        u.addEventListener("click", (function(o) {
          o.stopPropagation();
          if (!r.targetVideo) {
            return;
          }
          r.draftTab.startTime = r.targetVideo.currentTime;
          r.renderTabs();
          if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }));
        l.appendChild(u);
        var b = document.createElement("span");
        b.style.display = "flex";
        b.style.alignItems = "center";
        b.style.gap = "3px";
        b.style.padding = "2px 5px";
        b.style.borderRadius = "4px";
        b.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
        b.style.fontSize = "11px";
        if (this.draftTab.startTime === null) {
          b.style.opacity = "0.4";
          b.style.cursor = "not-allowed";
          b.style.pointerEvents = "none";
        } else {
          b.style.opacity = "1";
          b.style.cursor = "pointer";
          b.style.pointerEvents = "auto";
        }
        var y = document.createElement("span");
        y.className = "tm-draft-label b";
        y.style.color = "white";
        y.style.fontWeight = "600";
        y.textContent = "B";
        var C = document.createElement("span");
        C.className = "tm-draft-time".concat(this.draftTab.endTime === null ? " placeholder" : "");
        C.style.color = this.draftTab.endTime !== null ? "#fff" : "rgba(255,255,255,0.3)";
        C.textContent = this.draftTab.endTime !== null ? formatTimeWithHours(this.draftTab.endTime) : "--:--:--";
        b.appendChild(y);
        b.appendChild(C);
        b.addEventListener("click", (function(o) {
          o.stopPropagation();
          if (r.draftTab.startTime === null) {
            return;
          }
          if (!r.targetVideo) {
            return;
          }
          r.draftTab.endTime = r.targetVideo.currentTime;
          r.renderTabs();
          if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }));
        l.appendChild(b);
        var k = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        var _ = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        var E = document.createElement("button");
        E.className = "tm-draft-action save";
        E.innerHTML = k;
        E.title = "保存标签";
        E.addEventListener("click", (function(o) {
          o.stopPropagation();
          if (r.draftTab.startTime === null && r.draftTab.endTime === null) {
            Toast("请至少设置一个时间点", 2e3, "error");
            return;
          }
          if (r.draftTab.startTime !== null && r.draftTab.endTime !== null) {
            if (r.draftTab.endTime <= r.draftTab.startTime) {
              Toast("结束点 (B) 必须大于开始点 (A)", 2e3, "error");
              return;
            }
            r.draftTab.type = "interval";
          } else {
            r.draftTab.type = "highlight";
            if (r.draftTab.startTime === null) {
              r.draftTab.startTime = r.draftTab.endTime;
              r.draftTab.endTime = null;
            }
          }
          r._showCommentDialog();
        }));
        l.appendChild(E);
        var S = document.createElement("button");
        S.className = "tm-draft-action cancel";
        S.innerHTML = _;
        S.title = "取消草稿";
        S.addEventListener("click", (function(o) {
          o.stopPropagation();
          r._resetDraftTab();
          r.renderTabs();
        }));
        l.appendChild(S);
        return l;
      }
    }, {
      "key": "_createEditPill",
      "value": function _createEditPill(r) {
        var o = this;
        var a = this.tabs.findIndex((function(o) {
          return o.id === r.id;
        }));
        var l = a !== -1 ? this.tabColors[a % this.tabColors.length] : this.tabColors[0];
        var u = document.createElement("div");
        u.className = "tm-tab-pill draft editing";
        u.dataset.tabId = r.id;
        u.style.setProperty("--tab-color", l);
        u.style.gap = "5px";
        var p = this.editingTabCopy;
        var v = document.createElement("span");
        v.style.cursor = "pointer";
        v.style.display = "flex";
        v.style.alignItems = "center";
        v.style.gap = "3px";
        v.style.padding = "2px 5px";
        v.style.borderRadius = "4px";
        v.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
        v.style.fontSize = "11px";
        var b = document.createElement("span");
        b.className = "tm-draft-label a";
        b.style.color = "white";
        b.style.fontWeight = "600";
        b.textContent = "A";
        var y = document.createElement("span");
        y.className = "tm-draft-time".concat(p.startTime === null ? " placeholder" : "");
        y.style.color = p.startTime !== null ? "#fff" : "rgba(255,255,255,0.3)";
        y.textContent = p.startTime !== null ? formatTimeWithHours(p.startTime) : "--:--:--";
        v.appendChild(b);
        v.appendChild(y);
        v.addEventListener("click", (function(r) {
          r.stopPropagation();
          if (!o.targetVideo) {
            return;
          }
          p.startTime = o.targetVideo.currentTime;
          o.renderTabs();
          if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }));
        u.appendChild(v);
        var C = document.createElement("span");
        C.style.display = "flex";
        C.style.alignItems = "center";
        C.style.gap = "3px";
        C.style.padding = "2px 5px";
        C.style.borderRadius = "4px";
        C.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
        C.style.fontSize = "11px";
        if (p.startTime === null) {
          C.style.opacity = "0.4";
          C.style.cursor = "not-allowed";
          C.style.pointerEvents = "none";
        } else {
          C.style.opacity = "1";
          C.style.cursor = "pointer";
          C.style.pointerEvents = "auto";
        }
        var k = document.createElement("span");
        k.className = "tm-draft-label b";
        k.style.color = "white";
        k.style.fontWeight = "600";
        k.textContent = "B";
        var _ = document.createElement("span");
        _.className = "tm-draft-time".concat(p.endTime === null ? " placeholder" : "");
        _.style.color = p.endTime !== null ? "#fff" : "rgba(255,255,255,0.3)";
        _.textContent = p.endTime !== null ? formatTimeWithHours(p.endTime) : "--:--:--";
        C.appendChild(k);
        C.appendChild(_);
        C.addEventListener("click", (function(r) {
          r.stopPropagation();
          if (p.startTime === null) {
            return;
          }
          if (!o.targetVideo) {
            return;
          }
          p.endTime = o.targetVideo.currentTime;
          o.renderTabs();
          if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }));
        u.appendChild(C);
        var E = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        var S = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        var P = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        var D = document.createElement("button");
        D.className = "tm-draft-action edit-comment";
        D.innerHTML = E;
        D.title = "编辑备注";
        D.addEventListener("click", (function(r) {
          r.stopPropagation();
          o._showCommentDialog(p);
        }));
        u.appendChild(D);
        var L = document.createElement("button");
        L.className = "tm-draft-action save";
        L.innerHTML = S;
        L.title = "保存修改";
        L.addEventListener("click", (function(a) {
          a.stopPropagation();
          if (p.startTime === null && p.endTime === null) {
            Toast("请至少设置一个时间点", 2e3, "error");
            return;
          }
          if (p.startTime !== null && p.endTime !== null) {
            if (p.endTime <= p.startTime) {
              Toast("结束点 (B) 必须大于开始点 (A)", 2e3, "error");
              return;
            }
            p.type = "interval";
          } else {
            p.type = "highlight";
            if (p.startTime === null) {
              p.startTime = p.endTime;
              p.endTime = null;
            }
          }
          var l = o.tabs.findIndex((function(o) {
            return o.id === r.id;
          }));
          if (l !== -1) {
            o.tabs[l] = LoopManager_objectSpread({}, p);
            o._saveTabs();
          }
          o._exitEditMode();
        }));
        u.appendChild(L);
        var M = document.createElement("button");
        M.className = "tm-draft-action cancel";
        M.innerHTML = P;
        M.title = "删除标签";
        M.addEventListener("click", (function(a) {
          a.stopPropagation();
          o.tabs = o.tabs.filter((function(o) {
            return o.id !== r.id;
          }));
          if (o.activeTabId === r.id) {
            o.disableLoop();
            o.activeTabId = null;
          }
          o._saveTabs();
          o._exitEditMode();
        }));
        u.appendChild(M);
        return u;
      }
    }, {
      "key": "_enterEditMode",
      "value": function _enterEditMode(r) {
        var o = this;
        this.editingTabId = r.id;
        this.editingTabCopy = LoopManager_objectSpread({}, r);
        this._resetDraftTab();
        this.disableLoop();
        this.activeTabId = null;
        this.renderTabs();
        setTimeout((function() {
          document.addEventListener("click", o._handleOutsideClickForEdit);
        }), 0);
      }
    }, {
      "key": "_exitEditMode",
      "value": function _exitEditMode() {
        this.editingTabId = null;
        this.editingTabCopy = null;
        document.removeEventListener("click", this._handleOutsideClickForEdit);
        this.renderTabs();
      }
    }, {
      "key": "_handleOutsideClickForEdit",
      "value": function _handleOutsideClickForEdit(r) {
        var o;
        var a = (o = this.tabScrollContainer) === null || o === void 0 ? void 0 : o.querySelector(".tm-tab-pill.draft.editing");
        if (a && !a.contains(r.target)) {
          if (r.target.closest(".tm-player-container, .tm-modal-overlay, .tm-comment-modal, .tm-bottom-sheet-panel, .tm-bottom-sheet-overlay")) {
            return;
          }
          this._exitEditMode();
        }
      }
    }, {
      "key": "_handleTabClick",
      "value": function _handleTabClick(r) {
        if (r.type === "highlight") {
          if (this.playerCore.controlManager && typeof this.playerCore.controlManager.showJumpHint === "function") {
            this.playerCore.controlManager.showJumpHint(r.startTime);
          }
          this.targetVideo.currentTime = r.startTime;
          if (this.targetVideo.paused) {
            this.targetVideo.play()["catch"]((function() {}));
          }
          this.disableLoop();
          this.activeTabId = r.id;
          this.renderTabs();
        } else if (this.activeTabId === r.id && this.loopActive) {
          this.disableLoop();
          this.activeTabId = null;
          this.renderTabs();
        } else {
          this.disableLoop();
          this.activeTabId = r.id;
          this.loopStartTime = r.startTime;
          this.loopEndTime = r.endTime;
          var o = this.targetVideo ? this.targetVideo.currentTime : 0;
          var a = o >= r.startTime && o < r.endTime;
          if (!a) {
            if (this.playerCore.controlManager && typeof this.playerCore.controlManager.showJumpHint === "function") {
              this.playerCore.controlManager.showJumpHint(r.startTime);
            }
            if (this.targetVideo) {
              this.targetVideo.currentTime = r.startTime;
            }
          }
          this.enableLoop();
          if (this.targetVideo && this.targetVideo.paused) {
            this.targetVideo.play()["catch"]((function() {}));
          }
          this.renderTabs();
        }
      }
    }, {
      "key": "_handleTabLongPress",
      "value": function _handleTabLongPress(r) {
        this._enterEditMode(r);
      }
    }, {
      "key": "_resetDraftTab",
      "value": function _resetDraftTab() {
        this.draftTab = {
          "id": this._generateId(),
          "type": "interval",
          "startTime": null,
          "endTime": null,
          "comment": ""
        };
      }
    }, {
      "key": "_showCommentDialog",
      "value": function _showCommentDialog() {
        var r, o, a = this;
        var l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var u = l !== null;
        var p = u ? l : this.draftTab;
        if (!p) {
          return;
        }
        var v = ((r = this.uiElements) === null || r === void 0 ? void 0 : r.controlButtonsContainer) || ((o = this.uiElements) === null || o === void 0 ? void 0 : o.controlPanel) || document.querySelector(".tm-control-buttons");
        if (!v) {
          return;
        }
        var b = v.querySelector(".tm-inline-remark-popover");
        if (b) {
          b.remove();
        }
        var y = document.createElement("div");
        y.className = "tm-inline-remark-popover";
        y.innerHTML = '\n            <div class="tm-inline-remark-body">\n                <input type="text" class="tm-inline-remark-input" placeholder="输入高光或区间备注..." value="'.concat(p.comment || "", '" />\n                <div class="tm-inline-remark-footer">\n                    <button type="button" class="tm-inline-remark-btn cancel">SKIP</button>\n                    <button type="button" class="tm-inline-remark-btn submit">SAVE</button>\n                </div>\n            </div>\n        ');
        var C = y.querySelector(".tm-inline-remark-input");
        var k = y.querySelector(".tm-inline-remark-btn.cancel");
        var _ = y.querySelector(".tm-inline-remark-btn.submit");
        var E = function stopProp(r) {
          return r.stopPropagation();
        };
        C.addEventListener("keydown", E);
        C.addEventListener("keyup", E);
        C.addEventListener("keypress", E);
        C.addEventListener("mousedown", E);
        C.addEventListener("touchstart", E);
        y.addEventListener("click", (function(r) {
          return r.stopPropagation();
        }));
        v.appendChild(y);
        requestAnimationFrame((function() {
          y.classList.add("visible");
          C.focus();
          C.select();
        }));
        var S = function close() {
          y.classList.remove("visible");
          y.addEventListener("transitionend", (function() {
            return y.remove();
          }), {
            "once": true
          });
        };
        var P = function save(r) {
          p.comment = r;
          if (u) {
            if (l === a.editingTabCopy) {
              a.renderTabs();
            } else {
              a._saveTabs();
              a.renderTabs();
              a._updateBottomSheet();
            }
          } else {
            a.tabs.push(LoopManager_objectSpread(LoopManager_objectSpread({}, a.draftTab), {}, {
              "comment": r
            }));
            a._resetDraftTab();
            a._saveTabs();
            a._sortTabs();
            a.renderTabs();
          }
          S();
        };
        _.addEventListener("click", (function(r) {
          r.stopPropagation();
          P(C.value.trim());
        }));
        k.addEventListener("click", (function(r) {
          r.stopPropagation();
          if (!u) {
            P("");
          } else {
            S();
          }
        }));
        C.addEventListener("keydown", (function(r) {
          if (r.key === "Enter") {
            r.preventDefault();
            r.stopPropagation();
            P(C.value.trim());
          } else if (r.key === "Escape") {
            r.preventDefault();
            r.stopPropagation();
            if (!u) {
              a._resetDraftTab();
              a.renderTabs();
            }
            S();
          }
        }));
      }
    }, {
      "key": "enableLoop",
      "value": function enableLoop() {
        if (!this.targetVideo || this.loopStartTime === null || this.loopEndTime === null) {
          return;
        }
        this.loopActive = true;
        this.targetVideo.removeEventListener("timeupdate", this._handleLoopTimeUpdate);
        this.targetVideo.addEventListener("timeupdate", this._handleLoopTimeUpdate);
        if (this.targetVideo.currentTime < this.loopStartTime || this.targetVideo.currentTime > this.loopEndTime) {
          this.targetVideo.currentTime = this.loopStartTime;
        }
        if (this.targetVideo.paused) {
          this.targetVideo.play()["catch"]((function() {}));
        }
        this.updateLoopMarkers();
        this.renderProgressMarkers();
        if (window.navigator.vibrate) {
          window.navigator.vibrate([ 10, 30, 10 ]);
        }
      }
    }, {
      "key": "disableLoop",
      "value": function disableLoop() {
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
    }, {
      "key": "_handleLoopTimeUpdate",
      "value": function _handleLoopTimeUpdate() {
        if (!this.loopActive || this.loopStartTime === null || this.loopEndTime === null) {
          return;
        }
        var r = this.targetVideo.currentTime;
        if (r >= this.loopEndTime || r < this.loopStartTime) {
          this.targetVideo.currentTime = this.loopStartTime;
        }
        this.renderProgressMarkers();
        this._updateActiveTabProgress();
      }
    }, {
      "key": "_clearAllTabProgress",
      "value": function _clearAllTabProgress() {
        if (!this.tabScrollContainer) {
          return;
        }
        var r = this.tabScrollContainer.querySelectorAll(".tm-tab-pill");
        r.forEach((function(r) {
          return r.style.background = "";
        }));
      }
    }, {
      "key": "_updateActiveTabProgress",
      "value": function _updateActiveTabProgress() {
        var r = this;
        if (!this.targetVideo || !this.tabScrollContainer) {
          return;
        }
        if (!this.loopActive || !this.activeTabId) {
          this._clearAllTabProgress();
          return;
        }
        var o = this.tabs.find((function(o) {
          return o.id === r.activeTabId;
        }));
        if (!o || o.type !== "interval") {
          this._clearAllTabProgress();
          return;
        }
        var a = this.tabScrollContainer.querySelector('.tm-tab-pill[data-tab-id="'.concat(this.activeTabId, '"]'));
        if (!a) {
          return;
        }
        var l = o.endTime - o.startTime;
        if (l <= 0) {
          return;
        }
        var u = this.targetVideo.currentTime;
        var p = Math.max(0, Math.min(100, (u - o.startTime) / l * 100));
        a.style.background = "linear-gradient(to right, hsla(var(--tab-color), 0.38) ".concat(p, "%, hsla(var(--tab-color), 0.15) ").concat(p, "%)");
      }
    }, {
      "key": "updateLoopMarkers",
      "value": function updateLoopMarkers() {
        if (!this.targetVideo || !this.loopStartMarker || !this.loopEndMarker) {
          return;
        }
        var r = document.querySelector(".tm-progress-bar");
        if (!r) {
          return;
        }
        var o = this.targetVideo.duration;
        if (o <= 0) {
          return;
        }
        var a = function updateMarker(r, a, l) {
          if (r !== null && !isNaN(r) && r >= 0 && r <= o) {
            a.style.left = "".concat(r / o * 100, "%");
            a.style.display = "block";
            if (l) {
              a.classList.add("active");
            } else {
              a.classList.remove("active");
            }
          } else {
            a.style.display = "none";
            a.classList.remove("active");
          }
        };
        a(this.loopStartTime, this.loopStartMarker, this.loopActive);
        a(this.loopEndTime, this.loopEndMarker, this.loopActive);
        if (this.loopRangeElement) {
          if (this.loopActive && this.loopStartTime !== null && this.loopEndTime !== null) {
            var l = this.loopStartTime / o * 100;
            var u = this.loopEndTime / o * 100;
            var p = u - l;
            if (p > 0) {
              this.loopRangeElement.style.left = "".concat(l, "%");
              this.loopRangeElement.style.width = "".concat(p, "%");
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
    }, {
      "key": "updateLoopTimeDisplay",
      "value": function updateLoopTimeDisplay() {}
    }, {
      "key": "_updateUI",
      "value": function _updateUI() {
        this.renderTabs();
        this.updateLoopMarkers();
      }
    }, {
      "key": "_parseUrlHashParams",
      "value": function _parseUrlHashParams() {
        var r = this;
        var o = [];
        if (window.location.hash) {
          var a = window.location.hash.substring(1);
          if (a.startsWith("t=")) {
            a = a.substring(2);
          }
          var l = a.split(",").map((function(r) {
            var o = r.trim();
            if (o.startsWith("t=")) {
              o = o.substring(2);
            }
            return o;
          })).filter(Boolean);
          o.push.apply(o, LoopManager_toConsumableArray(l));
        }
        if (window.location.search) {
          var u = new URLSearchParams(window.location.search);
          var p = u.get("t");
          if (p) {
            var v = p.split(",").map((function(r) {
              var o = r.trim();
              if (o.startsWith("t=")) {
                o = o.substring(2);
              }
              return o;
            })).filter(Boolean);
            o.push.apply(o, LoopManager_toConsumableArray(v));
          }
          var b = u.get("start");
          var y = u.get("end");
          if (b) {
            if (y) {
              o.push("".concat(b, "-").concat(y));
            } else {
              o.push(b);
            }
          }
        }
        if (o.length === 0) {
          return;
        }
        try {
          var C = new URL(window.location.href);
          var k = false;
          if (C.hash) {
            C.hash = "";
            k = true;
          }
          if (C.searchParams.has("t")) {
            C.searchParams["delete"]("t");
            k = true;
          }
          if (C.searchParams.has("start")) {
            C.searchParams["delete"]("start");
            k = true;
          }
          if (C.searchParams.has("end")) {
            C.searchParams["delete"]("end");
            k = true;
          }
          if (k) {
            window.history.replaceState(null, "", C.pathname + C.search + C.hash);
          }
        } catch (r) {}
        var _ = function handleMeta() {
          if (!r.targetVideo) {
            return;
          }
          var a = null;
          o.forEach((function(o) {
            if (o.includes("-")) {
              var l = o.split("-"), u = LoopManager_slicedToArray(l, 2), p = u[0], v = u[1];
              var b = r._parseTimeString(p);
              var y = r._parseTimeString(v);
              if (b !== null && y !== null) {
                var C = r.tabs.find((function(r) {
                  return r.type === "interval" && Math.abs(r.startTime - b) < 1 && Math.abs(r.endTime - y) < 1;
                }));
                if (!C) {
                  C = {
                    "id": r._generateId(),
                    "type": "interval",
                    "startTime": b,
                    "endTime": y,
                    "comment": "From URL"
                  };
                  r.tabs.push(C);
                }
                if (!a) {
                  a = C;
                }
              }
            } else {
              var k = r._parseTimeString(o);
              if (k !== null) {
                var _ = r.tabs.find((function(r) {
                  return r.type === "highlight" && Math.abs(r.startTime - k) < 1;
                }));
                if (!_) {
                  _ = {
                    "id": r._generateId(),
                    "type": "highlight",
                    "startTime": k,
                    "comment": "From URL"
                  };
                  r.tabs.push(_);
                }
                if (!a) {
                  a = _;
                }
              }
            }
          }));
          r._saveTabs();
          r._sortTabs();
          r.renderTabs();
          if (a) {
            if (a.type === "highlight") {
              r.targetVideo.currentTime = a.startTime;
              if (r.targetVideo.paused) {
                r.targetVideo.play()["catch"]((function() {}));
              }
              r.disableLoop();
              r.activeTabId = a.id;
            } else {
              r.disableLoop();
              r.activeTabId = a.id;
              r.loopStartTime = a.startTime;
              r.loopEndTime = a.endTime;
              r.enableLoop();
            }
            r.renderTabs();
          }
          if (r.targetVideo) {
            r.targetVideo.removeEventListener("loadedmetadata", _);
          }
        };
        if (this.targetVideo.readyState >= 1) {
          _();
        } else {
          this.targetVideo.addEventListener("loadedmetadata", _);
        }
      }
    }, {
      "key": "_parseTimeString",
      "value": function _parseTimeString(r) {
        if (!r) {
          return null;
        }
        var o = r.trim();
        var a = o.match(/^(\d{2}):(\d{2}):(\d{2})$/);
        if (a) {
          return parseInt(a[1], 10) * 3600 + parseInt(a[2], 10) * 60 + parseInt(a[3], 10);
        }
        var l = o.match(/^(\d{1,2}):(\d{2})$/);
        if (l) {
          return parseInt(l[1], 10) * 60 + parseInt(l[2], 10);
        }
        if (o.match(/^\d+(\.\d+)?$/)) {
          return parseFloat(o);
        }
        return null;
      }
    }, {
      "key": "_bindSwipeUpGesture",
      "value": function _bindSwipeUpGesture() {
        var r, o = this;
        var a = (r = this.tabScrollContainer) === null || r === void 0 ? void 0 : r.parentElement;
        if (!a) {
          return;
        }
        var l = 0;
        var u = 0;
        var p = false;
        a.addEventListener("touchstart", (function(r) {
          var o = r.touches[0];
          l = o.clientY;
          u = o.clientX;
          p = true;
        }), {
          "passive": true
        });
        a.addEventListener("touchend", (function(r) {
          if (!p) {
            return;
          }
          p = false;
          var a = r.changedTouches[0];
          var v = a.clientY - l;
          var b = Math.abs(a.clientX - u);
          if (v < -40 && Math.abs(v) > b) {
            r.stopPropagation();
            o._openBottomSheet();
          }
        }));
      }
    }, {
      "key": "_toggleBottomSheet",
      "value": function _toggleBottomSheet() {
        if (this._sheetPanel && this._sheetPanel.classList.contains("visible")) {
          this._closeBottomSheet();
        } else {
          this._openBottomSheet();
        }
      }
    }, {
      "key": "_updatePanelPosition",
      "value": function _updatePanelPosition() {
        var r, o, a;
        if (!this._sheetPanel) {
          return;
        }
        var l = ((r = this.tabAddBtn) === null || r === void 0 ? void 0 : r.closest(".tm-control-buttons")) || document.querySelector(".tm-control-buttons");
        var u = ((o = this.tabAddBtn) === null || o === void 0 ? void 0 : o.closest(".tm-loop-control-row")) || ((a = this.tabAddBtn) === null || a === void 0 ? void 0 : a.parentElement);
        var p = document.querySelector(".tm-handle-container");
        if (l && u) {
          var v = l.getBoundingClientRect();
          var b = u.getBoundingClientRect();
          var y = Math.max(0, v.bottom - b.bottom);
          this._sheetPanel.style.bottom = "".concat(y, "px");
          if (p) {
            var C = p.getBoundingClientRect();
            var k = b.bottom - C.bottom - 10;
            if (k > 80) {
              this._sheetPanel.style.maxHeight = "".concat(k, "px");
              return;
            }
          }
        }
        this._sheetPanel.style.maxHeight = "calc(100vh - 120px)";
      }
    }, {
      "key": "_openBottomSheet",
      "value": function _openBottomSheet() {
        if (!this._sheetOverlay || !this._sheetPanel) {
          this._createBottomSheet();
        }
        this._updateBottomSheet();
        this._updatePanelPosition();
        if (this._sheetOverlay) {
          this._sheetOverlay.classList.add("visible");
        }
        if (this._sheetPanel) {
          this._sheetPanel.classList.add("visible");
        }
      }
    }, {
      "key": "_closeBottomSheet",
      "value": function _closeBottomSheet() {
        if (this._sheetOverlay) {
          this._sheetOverlay.classList.remove("visible");
        }
        if (this._sheetPanel) {
          this._sheetPanel.classList.remove("visible");
        }
      }
    }, {
      "key": "_createBottomSheet",
      "value": function _createBottomSheet() {
        var r, o = this;
        var a = ((r = this.tabAddBtn) === null || r === void 0 ? void 0 : r.closest(".tm-control-buttons")) || document.querySelector(".tm-control-buttons");
        if (!a) {
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
        this._sheetOverlay.addEventListener("click", (function() {
          return o._closeBottomSheet();
        }));
        this._sheetOverlay.addEventListener("touchmove", (function(r) {
          if (r.cancelable) {
            r.preventDefault();
          }
        }), {
          "passive": false
        });
        this._sheetPanel = document.createElement("div");
        this._sheetPanel.className = "tm-bottom-sheet-panel";
        this._sheetPanel.addEventListener("click", (function(r) {
          return r.stopPropagation();
        }));
        var l = document.createElement("div");
        l.className = "tm-sheet-header";
        var u = document.createElement("div");
        u.style.display = "flex";
        u.style.alignItems = "center";
        u.style.gap = "8px";
        var p = document.createElement("div");
        p.className = "tm-bottom-sheet-title";
        p.textContent = "标签管理";
        var v = document.createElement("span");
        v.className = "tm-sheet-count-badge";
        this._sheetCountBadge = v;
        u.appendChild(p);
        u.appendChild(v);
        var b = document.createElement("button");
        b.className = "tm-sheet-close-btn";
        b.innerHTML = "✕";
        b.title = "关闭";
        b.addEventListener("click", (function() {
          return o._closeBottomSheet();
        }));
        l.appendChild(u);
        l.appendChild(b);
        this._sheetList = document.createElement("div");
        this._sheetList.className = "tm-bottom-sheet-list";
        this._sheetPanel.appendChild(l);
        this._sheetPanel.appendChild(this._sheetList);
        var y = document.querySelector(".tm-player-container") || document.body;
        y.appendChild(this._sheetOverlay);
        a.appendChild(this._sheetPanel);
      }
    }, {
      "key": "_updateBottomSheet",
      "value": function _updateBottomSheet() {
        var r = this;
        if (!this._sheetList) {
          return;
        }
        this._sheetList.innerHTML = "";
        if (this._sheetCountBadge) {
          this._sheetCountBadge.textContent = "共 ".concat(this.tabs.length, " 条");
        }
        if (this.tabs.length === 0) {
          var o = document.createElement("div");
          o.className = "tm-bottom-sheet-empty";
          o.textContent = "暂无标签";
          this._sheetList.appendChild(o);
          return;
        }
        this.tabs.forEach((function(o, a) {
          var l = r.tabColors[a % r.tabColors.length];
          var u = document.createElement("div");
          u.className = "tm-sheet-item";
          if (r.activeTabId === o.id) {
            u.classList.add("active");
          }
          var p = document.createElement("div");
          p.className = "tm-sheet-item-time-container";
          if (o.type === "highlight") {
            var v = document.createElement("button");
            v.className = "tm-sheet-time-pill";
            v.style.setProperty("--tab-color", l);
            v.textContent = formatTimeWithHours(o.startTime);
            v.title = "跳转到此时间";
            v.addEventListener("click", (function() {
              r._handleTabClick(o);
            }));
            p.appendChild(v);
          } else {
            var b = document.createElement("div");
            b.className = "tm-sheet-time-pill interval";
            b.style.setProperty("--tab-color", l);
            var y = document.createElement("span");
            y.className = "tm-time-part start";
            y.textContent = formatTimeWithHours(o.startTime);
            y.title = "跳转到起点并开始循环";
            y.addEventListener("click", (function(a) {
              a.stopPropagation();
              r._handleTabClick(o);
            }));
            var C = document.createElement("span");
            C.className = "tm-time-sep";
            C.textContent = "~";
            var k = document.createElement("span");
            k.className = "tm-time-part end";
            k.textContent = formatTimeWithHours(o.endTime);
            k.title = "跳转到终点";
            k.addEventListener("click", (function(a) {
              a.stopPropagation();
              if (r.targetVideo) {
                r.targetVideo.currentTime = o.endTime;
              }
            }));
            b.appendChild(y);
            b.appendChild(C);
            b.appendChild(k);
            b.addEventListener("click", (function() {
              r._handleTabClick(o);
            }));
            p.appendChild(b);
          }
          var _ = document.createElement("input");
          _.type = "text";
          _.className = "tm-sheet-item-comment-input";
          _.placeholder = "添加备注...";
          _.value = o.comment || "";
          var E = function stopProp(r) {
            return r.stopPropagation();
          };
          _.addEventListener("keydown", E);
          _.addEventListener("keyup", E);
          _.addEventListener("keypress", E);
          _.addEventListener("mousedown", E);
          _.addEventListener("touchstart", E);
          _.addEventListener("input", (function(a) {
            o.comment = a.target.value;
            r._saveTabs();
            r.renderTabs();
          }));
          _.addEventListener("change", (function() {
            r._saveTabs();
            r.renderTabs();
          }));
          var S = document.createElement("button");
          S.className = "tm-sheet-delete-btn";
          S.innerHTML = "❌";
          S.title = "删除标签";
          S.addEventListener("click", (function(a) {
            a.stopPropagation();
            r.tabs = r.tabs.filter((function(r) {
              return r.id !== o.id;
            }));
            if (r.activeTabId === o.id) {
              r.disableLoop();
              r.activeTabId = null;
            }
            r._saveTabs();
            r.renderTabs();
            r._updateBottomSheet();
          }));
          u.appendChild(p);
          u.appendChild(_);
          u.appendChild(S);
          r._sheetList.appendChild(u);
        }));
      }
    }, {
      "key": "renderProgressMarkers",
      "value": function renderProgressMarkers() {
        var r = this;
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
        var o = this.targetVideo.duration;
        if (o <= 0 || isNaN(o)) {
          if (!this._durationFallbackBound) {
            this._durationFallbackBound = function() {
              if (!r.targetVideo) {
                return;
              }
              var o = r.targetVideo.duration;
              if (o > 0 && !isNaN(o)) {
                r.renderProgressMarkers();
                if (r.targetVideo) {
                  r.targetVideo.removeEventListener("timeupdate", r._durationFallbackBound);
                }
                r._durationFallbackBound = null;
              }
            };
            this.targetVideo.addEventListener("timeupdate", this._durationFallbackBound);
          }
          return;
        }
        this.tabs.forEach((function(a, l) {
          var u = r.tabColors[l % r.tabColors.length];
          var p = a.startTime / o * 100;
          if (a.type === "highlight") {
            var v = document.createElement("div");
            v.className = "tm-progress-marker-tick";
            v.style.left = "".concat(p, "%");
            v.style.setProperty("--tab-color", u);
            v.addEventListener("click", (function(o) {
              o.stopPropagation();
              r._handleTabClick(a);
            }));
            r.progressMarkersContainer.appendChild(v);
          } else if (a.type === "interval") {
            var b = a.endTime / o * 100;
            var y = b - p;
            if (y <= 0) {
              return;
            }
            if (r.loopActive && r.activeTabId === a.id) {
              var C = document.createElement("div");
              C.className = "tm-active-loop-unplayed";
              C.style.left = "".concat(p, "%");
              C.style.width = "".concat(y, "%");
              C.style.setProperty("--tab-color", u);
              r.progressMarkersContainer.appendChild(C);
              var k = Math.max(a.startTime, Math.min(a.endTime, r.targetVideo.currentTime));
              var _ = (k - a.startTime) / o * 100;
              if (_ > 0) {
                var E = document.createElement("div");
                E.className = "tm-active-loop-played";
                E.style.left = "".concat(p, "%");
                E.style.width = "".concat(_, "%");
                E.style.setProperty("--tab-color", u);
                r.progressMarkersContainer.appendChild(E);
              }
              var S = document.createElement("div");
              S.className = "tm-active-loop-boundary start";
              S.style.left = "".concat(p, "%");
              S.style.setProperty("--tab-color", u);
              r.progressMarkersContainer.appendChild(S);
              var P = document.createElement("div");
              P.className = "tm-active-loop-boundary end";
              P.style.left = "".concat(b, "%");
              P.style.setProperty("--tab-color", u);
              r.progressMarkersContainer.appendChild(P);
            } else {
              var D = document.createElement("div");
              D.className = "tm-progress-marker-range";
              D.style.left = "".concat(p, "%");
              D.style.width = "".concat(y, "%");
              D.style.setProperty("--tab-color", u);
              D.addEventListener("click", (function(o) {
                o.stopPropagation();
                r._handleTabClick(a);
              }));
              r.progressMarkersContainer.appendChild(D);
            }
          }
        }));
      }
    }, {
      "key": "_sortTabs",
      "value": function _sortTabs() {
        this.tabs.sort((function(r, o) {
          return r.startTime - o.startTime;
        }));
      }
    }, {
      "key": "_saveTabs",
      "value": function _saveTabs() {
        if (!this.storageKey) {
          return;
        }
        this._sortTabs();
        setValue(this.storageKey, this.tabs);
      }
    }, {
      "key": "_loadTabs",
      "value": function _loadTabs() {
        if (!this.storageKey) {
          this.tabs = [];
          return;
        }
        var r = getValue(this.storageKey, []);
        this.tabs = Array.isArray(r) ? r : [];
        this._sortTabs();
      }
    }, {
      "key": "_generateId",
      "value": function _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
        this.disableLoop();
        document.removeEventListener("click", this._handleOutsideClickForEdit);
        if (this.targetVideo && this._durationFallbackBound) {
          this.targetVideo.removeEventListener("timeupdate", this._durationFallbackBound);
          this._durationFallbackBound = null;
        }
        if (this._sheetOverlay) {
          this._sheetOverlay.remove();
          this._sheetOverlay = null;
          this._sheetPanel = null;
          this._sheetList = null;
        }
        if (this._longPressTimer) {
          clearTimeout(this._longPressTimer);
          this._longPressTimer = null;
        }
      }
    } ]);
  }();
  function ProgressManager_typeof(r) {
    "@babel/helpers - typeof";
    return ProgressManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, ProgressManager_typeof(r);
  }
  function ProgressManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function ProgressManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, ProgressManager_toPropertyKey(l.key), l);
    }
  }
  function ProgressManager_createClass(r, o, a) {
    return o && ProgressManager_defineProperties(r.prototype, o), a && ProgressManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function ProgressManager_toPropertyKey(r) {
    var o = ProgressManager_toPrimitive(r, "string");
    return "symbol" == ProgressManager_typeof(o) ? o : o + "";
  }
  function ProgressManager_toPrimitive(r, o) {
    if ("object" != ProgressManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != ProgressManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Oe = function() {
    function ProgressManager(r, o) {
      ProgressManager_classCallCheck(this, ProgressManager);
      this.playerCore = r;
      this.targetVideo = r.targetVideo;
      this.uiElements = o;
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
    }
    return ProgressManager_createClass(ProgressManager, [ {
      "key": "init",
      "value": function init(r) {
        this.progressBarElement = r.progressBarElement;
        this.progressIndicator = r.progressIndicator;
        this.currentTimeDisplay = r.currentTimeDisplay;
        this.totalDurationDisplay = r.totalDurationDisplay;
        this.timeIndicator = r.timeIndicator;
        this.progressBarContainer = this.progressBarElement.parentElement;
        this.progressBarElement.addEventListener("click", this.handleProgressClick.bind(this));
        this.progressBarContainer.addEventListener("mousedown", this.startProgressDrag.bind(this));
        this.progressBarContainer.addEventListener("touchstart", this.startProgressDrag.bind(this), {
          "passive": false
        });
        this.targetVideo.addEventListener("timeupdate", this.updateProgressBar.bind(this));
        return this;
      }
    }, {
      "key": "updateProgressBar",
      "value": function updateProgressBar() {
        if (!this.targetVideo || !this.progressBarElement || !this.progressIndicator) {
          return;
        }
        var r = this.targetVideo.currentTime;
        var o = this.targetVideo.duration;
        if (isNaN(o) || o <= 0) {
          return;
        }
        var a = r / o * 100;
        this.progressIndicator.style.width = "".concat(a, "%");
        this.updateCurrentTimeDisplay();
      }
    }, {
      "key": "updateCurrentTimeDisplay",
      "value": function updateCurrentTimeDisplay() {
        if (!this.targetVideo || !this.currentTimeDisplay || !this.totalDurationDisplay) {
          return;
        }
        var r = this.targetVideo.currentTime;
        var o = this.targetVideo.duration;
        if (isNaN(o)) {
          return;
        }
        this.currentTimeDisplay.textContent = formatTime(r);
        var a = o - r;
        this.totalDurationDisplay.textContent = "-".concat(formatTime(a));
      }
    }, {
      "key": "handleProgressClick",
      "value": function handleProgressClick(r) {
        if (this.isDraggingProgress) {
          return;
        }
        var o = this.progressBarElement.getBoundingClientRect();
        var a = (r.clientX - o.left) / o.width;
        var l = this.targetVideo.duration;
        if (isNaN(l)) {
          return;
        }
        var u = l * a;
        this.targetVideo.currentTime = u;
        this.updateProgressBar();
      }
    }, {
      "key": "seekRelative",
      "value": function seekRelative(r) {
        if (!this.targetVideo) {
          return;
        }
        var o = Math.max(0, Math.min(this.targetVideo.duration, this.targetVideo.currentTime + r));
        this.targetVideo.currentTime = o;
      }
    }, {
      "key": "startProgressDrag",
      "value": function startProgressDrag(r) {
        r.preventDefault();
        r.stopPropagation();
        this.isDraggingProgress = true;
        this.lastDragX = r.type.includes("touch") ? r.touches[0].clientX : r.clientX;
        this.progressBarElement.classList.add("tm-progress-bar-expanded");
        this.progressBarElement.classList.remove("tm-progress-bar-normal");
        this.progressBarElement.classList.add("tm-dragging");
        if (this.timeIndicator) {
          this.timeIndicator.style.display = "block";
          this.timeIndicator.style.opacity = "1";
          this.updateTimeIndicator(r);
        }
        var o = this.handleProgressMove.bind(this);
        var a = this.handleProgressUp.bind(this);
        this.removeProgressEventListeners();
        if (r.type.includes("touch")) {
          document.addEventListener("touchmove", o, {
            "passive": false
          });
          document.addEventListener("touchend", a, {
            "passive": false
          });
          document.addEventListener("touchcancel", a, {
            "passive": false
          });
        } else {
          document.addEventListener("mousemove", o);
          document.addEventListener("mouseup", a);
          document.addEventListener("mouseleave", a);
        }
        this.progressHandleMoveHandler = o;
        this.progressHandleUpHandler = a;
        var l = this.progressBarElement.getBoundingClientRect();
        var u = r.type.includes("touch") ? r.touches[0].clientX : r.clientX;
        var p = (u - l.left) / l.width;
        p = Math.max(0, Math.min(1, p));
        var v = this.targetVideo.duration;
        if (!isNaN(v)) {
          var b = v * p;
          this.targetVideo.currentTime = b;
          this.progressIndicator.style.width = "".concat(p * 100, "%");
          this.updateCurrentTimeDisplay();
        }
      }
    }, {
      "key": "handleProgressMove",
      "value": function handleProgressMove(r) {
        if (!this.isDraggingProgress) {
          return;
        }
        r.preventDefault();
        var o = r.type.includes("touch") ? r.touches[0].clientX : r.clientX;
        this.updateTimeIndicator(r);
        var a = this.progressBarElement.getBoundingClientRect();
        if (a.width <= 0) {
          return;
        }
        var l = (o - a.left) / a.width;
        l = Math.max(0, Math.min(1, l));
        var u = this.targetVideo.duration;
        if (isNaN(u)) {
          return;
        }
        var p = u * l;
        this.progressIndicator.style.width = "".concat(l * 100, "%");
        this.targetVideo.currentTime = p;
        this.currentTimeDisplay.textContent = formatTime(p);
        var v = u - p;
        this.totalDurationDisplay.textContent = "-".concat(formatTime(v));
        this.lastDragX = o;
      }
    }, {
      "key": "handleProgressUp",
      "value": function handleProgressUp(r) {
        if (!this.isDraggingProgress) {
          return;
        }
        var o = this.progressBarElement.getBoundingClientRect();
        var a = r.type.includes("touch") ? r.changedTouches && r.changedTouches[0] ? r.changedTouches[0].clientX : this.lastDragX : r.clientX || this.lastDragX;
        var l = (a - o.left) / o.width;
        l = Math.max(0, Math.min(1, l));
        var u = this.targetVideo.duration;
        if (!isNaN(u)) {
          this.targetVideo.currentTime = u * l;
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
    }, {
      "key": "removeProgressEventListeners",
      "value": function removeProgressEventListeners() {
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
    }, {
      "key": "updateTimeIndicator",
      "value": function updateTimeIndicator(r) {
        if (!this.timeIndicator || !this.targetVideo) {
          return;
        }
        var o = r.type.includes("touch") ? r.touches[0].clientX : r.clientX;
        var a = r.type.includes("touch") ? r.touches[0].clientY : r.clientY;
        var l = this.uiElements.videoWrapper.getBoundingClientRect();
        var u = this.progressBarElement.getBoundingClientRect();
        var p = Math.max(l.left + 10, Math.min(l.right - 10, o));
        var v = u.top - 20;
        this.timeIndicator.style.left = "".concat(p, "px");
        this.timeIndicator.style.top = "".concat(v, "px");
        var b = (o - u.left) / u.width;
        var y = Math.max(0, Math.min(1, b));
        var C = this.targetVideo.duration;
        if (isNaN(C)) {
          return;
        }
        var k = C * y;
        this.timeIndicator.textContent = "".concat(formatTime(k), " / ").concat(formatTime(C));
      }
    } ]);
  }();
  function EventManager_typeof(r) {
    "@babel/helpers - typeof";
    return EventManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, EventManager_typeof(r);
  }
  function EventManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function EventManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, EventManager_toPropertyKey(l.key), l);
    }
  }
  function EventManager_createClass(r, o, a) {
    return o && EventManager_defineProperties(r.prototype, o), a && EventManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function EventManager_toPropertyKey(r) {
    var o = EventManager_toPrimitive(r, "string");
    return "symbol" == EventManager_typeof(o) ? o : o + "";
  }
  function EventManager_toPrimitive(r, o) {
    if ("object" != EventManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != EventManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Re = function() {
    function EventManager(r, o, a) {
      EventManager_classCallCheck(this, EventManager);
      this.playerCore = r;
      this.targetVideo = r.targetVideo;
      this.uiElements = o;
      this.managers = a;
      this.resizeObserver = null;
      this.clickLock = false;
      this.clickLockTimeout = null;
    }
    return EventManager_createClass(EventManager, [ {
      "key": "init",
      "value": function init() {
        var r = this;
        this.handleWindowResizeBound = this.handleWindowResize.bind(this);
        this.handleContainerResizeBound = this.handleContainerResize.bind(this);
        this.handleWindowScrollDebugBound = null;
        this._touchStartX = 0;
        this._touchStartY = 0;
        this.handleTouchStartBound = function(o) {
          if (o.touches && o.touches.length > 0) {
            r._touchStartX = o.touches[0].clientX;
            r._touchStartY = o.touches[0].clientY;
            if (o.target.closest(".tm-video-container")) {
              if (window.tmDebugLogger) {
                window.tmDebugLogger.log("touchStart video. Y: ".concat(r._touchStartY, ", scrollY: ").concat(window.scrollY));
              }
            }
          }
        };
        this.handleContextMenuBound = function(r) {
          r.preventDefault();
        };
        this.handleScrollPreventionBound = function(o) {
          if (o.target.closest(".tm-video-container")) {
            if (o.type === "touchmove") {
              if (o.touches && o.touches.length > 0) {
                var a = o.touches[0].clientY;
                var l = a - r._touchStartY;
                r._lastTouchY = a;
                if (l < -5) {
                  if (window.tmDebugLogger) {
                    window.tmDebugLogger.log("touchmove video [SWIPE UP]. diffY: ".concat(l, ", scrollY: ").concat(window.scrollY, ". Allow!"));
                  }
                  return;
                } else if (window.tmDebugLogger) {
                  window.tmDebugLogger.log("touchmove video [SWIPE DOWN/OTHER]. diffY: ".concat(l, ", scrollY: ").concat(window.scrollY, ". Block!"));
                }
              }
            } else if (o.type === "wheel") {
              if (o.deltaY > 0) {
                if (window.tmDebugLogger) {
                  window.tmDebugLogger.log("wheel video [DOWN]. delta: ".concat(o.deltaY, ", scrollY: ").concat(window.scrollY, ". Allow!"));
                }
                return;
              } else if (window.tmDebugLogger) {
                window.tmDebugLogger.log("wheel video [UP/OTHER]. delta: ".concat(o.deltaY, ", scrollY: ").concat(window.scrollY, ". Block!"));
              }
            }
            if (o.cancelable) {
              o.preventDefault();
            }
            return;
          }
          var u = o.target.closest(".tm-tab-scroll-container, .tm-comments-tabs");
          if (u) {
            if (o.type === "touchmove") {
              if (o.touches && o.touches.length > 0) {
                var p = o.touches[0].clientX;
                var v = o.touches[0].clientY;
                var b = Math.abs(p - r._touchStartX);
                var y = Math.abs(v - r._touchStartY);
                if (y > b) {
                  if (o.cancelable) {
                    o.preventDefault();
                  }
                  if (window.tmDebugLogger) {
                    window.tmDebugLogger.log("horizontal touchmove vertical block. diffY: ".concat(v - r._touchStartY));
                  }
                } else if (window.tmDebugLogger) {
                  window.tmDebugLogger.log("horizontal touchmove allow. diffX: ".concat(p - r._touchStartX));
                }
              }
            }
            return;
          }
          if (o.target.closest(".tm-comment-section-body, .tm-bottom-sheet-panel, .tm-bottom-sheet-list")) {
            return;
          }
          if (o.cancelable) {
            o.preventDefault();
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
    }, {
      "key": "_toggleScrollListeners",
      "value": function _toggleScrollListeners() {
        var r = this;
        var o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
        var a = o ? "addEventListener" : "removeEventListener";
        [ this.uiElements.playerContainer, this.uiElements.overlay ].forEach((function(o) {
          if (!o) {
            return;
          }
          o[a]("touchstart", r.handleTouchStartBound, {
            "passive": true
          });
          o[a]("touchmove", r.handleScrollPreventionBound, {
            "passive": false
          });
          o[a]("wheel", r.handleScrollPreventionBound, {
            "passive": false
          });
          o[a]("contextmenu", r.handleContextMenuBound);
        }));
      }
    }, {
      "key": "initVideoEventListeners",
      "value": function initVideoEventListeners() {
        var r = this;
        this.handleMetadataLoadedBound = function() {
          if (r.managers.progressManager) {
            r.managers.progressManager.updateProgressBar();
          }
          if (r.managers.loopManager) {
            r.managers.loopManager.updateLoopTimeDisplay();
            r.managers.loopManager.updateLoopMarkers();
          }
          r._notifyLayoutChanged();
        };
        this.targetVideo.addEventListener("loadedmetadata", this.handleMetadataLoadedBound);
        this.handleCanPlayBound = function() {
          if (r.managers.uiManager) {
            r.managers.uiManager.updateContainerMinHeight();
          }
          if (r.managers.swipeManager) {
            r.managers.swipeManager.updateSize();
          }
          if (r.managers.controlManager && r.managers.controlManager.commentPanel) {
            r.managers.controlManager.commentPanel.updatePosition();
          }
        };
        this.targetVideo.addEventListener("canplay", this.handleCanPlayBound);
        this.handleVideoResizeBound = function() {
          if (r.managers.uiManager) {
            r.managers.uiManager.updateContainerMinHeight();
          }
          if (r.managers.swipeManager) {
            r.managers.swipeManager.updateSize();
          }
          if (r.managers.controlManager && r.managers.controlManager.commentPanel) {
            r.managers.controlManager.commentPanel.updatePosition();
          }
        };
        this.targetVideo.addEventListener("resize", this.handleVideoResizeBound);
        this.handlePlayBound = function() {
          if (r.targetVideo) {
            r.targetVideo.setAttribute("playsinline", "true");
            r.targetVideo.setAttribute("webkit-playsinline", "true");
            r.targetVideo.setAttribute("x5-playsinline", "true");
            r.targetVideo.playsInline = true;
            r.targetVideo.webkitPlaysInline = true;
          }
          if (r.managers.controlManager) {
            r.managers.controlManager.updatePlayPauseButton();
          }
          if (r.playerCore.uiManager && r.playerCore.uiManager.isLandscape) {
            r.playerCore.uiManager.autoHideControls();
          }
        };
        this.targetVideo.addEventListener("play", this.handlePlayBound);
        this.handlePauseBound = function() {
          if (r.managers.controlManager) {
            r.managers.controlManager.updatePlayPauseButton();
            r.managers.controlManager.showPauseIndicator();
          }
        };
        this.targetVideo.addEventListener("pause", this.handlePauseBound);
      }
    }, {
      "key": "handleCloseButtonClick",
      "value": function handleCloseButtonClick() {
        this.cleanup();
        this.playerCore.close(this.uiElements.overlay, this.uiElements.container, this.uiElements.playerContainer);
      }
    }, {
      "key": "handleSettingsButtonClick",
      "value": function handleSettingsButtonClick() {
        if (this.managers.settingsManager) {
          this.managers.settingsManager.toggleSettingsPanel();
        }
      }
    }, {
      "key": "handleWindowResize",
      "value": function handleWindowResize() {
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
    }, {
      "key": "_notifyLayoutChanged",
      "value": function _notifyLayoutChanged() {
        var r;
        if (this.managers.dragManager) {
          this.managers.dragManager.updateHandlePosition();
        }
        if (this.managers.uiManager) {
          this.managers.uiManager.updateContainerMinHeight();
        }
        if (this.managers.swipeManager) {
          this.managers.swipeManager.updateSize();
        }
        if ((r = this.managers.controlManager) !== null && r !== void 0 && r.commentPanel) {
          this.managers.controlManager.commentPanel.updatePosition();
        }
      }
    }, {
      "key": "handleContainerResize",
      "value": function handleContainerResize() {
        this._notifyLayoutChanged();
      }
    }, {
      "key": "cleanup",
      "value": function cleanup() {
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
    } ]);
  }();
  function SettingsManager_typeof(r) {
    "@babel/helpers - typeof";
    return SettingsManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, SettingsManager_typeof(r);
  }
  function SettingsManager_ownKeys(r, o) {
    var a = Object.keys(r);
    if (Object.getOwnPropertySymbols) {
      var l = Object.getOwnPropertySymbols(r);
      o && (l = l.filter((function(o) {
        return Object.getOwnPropertyDescriptor(r, o).enumerable;
      }))), a.push.apply(a, l);
    }
    return a;
  }
  function SettingsManager_objectSpread(r) {
    for (var o = 1; o < arguments.length; o++) {
      var a = null != arguments[o] ? arguments[o] : {};
      o % 2 ? SettingsManager_ownKeys(Object(a), !0).forEach((function(o) {
        SettingsManager_defineProperty(r, o, a[o]);
      })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(a)) : SettingsManager_ownKeys(Object(a)).forEach((function(o) {
        Object.defineProperty(r, o, Object.getOwnPropertyDescriptor(a, o));
      }));
    }
    return r;
  }
  function SettingsManager_defineProperty(r, o, a) {
    return (o = SettingsManager_toPropertyKey(o)) in r ? Object.defineProperty(r, o, {
      "value": a,
      "enumerable": !0,
      "configurable": !0,
      "writable": !0
    }) : r[o] = a, r;
  }
  function SettingsManager_toConsumableArray(r) {
    return SettingsManager_arrayWithoutHoles(r) || SettingsManager_iterableToArray(r) || SettingsManager_unsupportedIterableToArray(r) || SettingsManager_nonIterableSpread();
  }
  function SettingsManager_nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function SettingsManager_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return SettingsManager_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? SettingsManager_arrayLikeToArray(r, o) : void 0;
    }
  }
  function SettingsManager_iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function SettingsManager_arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return SettingsManager_arrayLikeToArray(r);
    }
  }
  function SettingsManager_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function SettingsManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function SettingsManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, SettingsManager_toPropertyKey(l.key), l);
    }
  }
  function SettingsManager_createClass(r, o, a) {
    return o && SettingsManager_defineProperties(r.prototype, o), a && SettingsManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function SettingsManager_toPropertyKey(r) {
    var o = SettingsManager_toPrimitive(r, "string");
    return "symbol" == SettingsManager_typeof(o) ? o : o + "";
  }
  function SettingsManager_toPrimitive(r, o) {
    if ("object" != SettingsManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != SettingsManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var He = function() {
    function SettingsManager(r, o) {
      SettingsManager_classCallCheck(this, SettingsManager);
      this.playerCore = r;
      this.targetVideo = r.targetVideo;
      this.uiElements = o;
      this.settingsPanel = o.settingsPanel;
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
        "debugMode": false
      };
      this.showCustomSeekStepsPanel = false;
    }
    return SettingsManager_createClass(SettingsManager, [ {
      "key": "init",
      "value": function init() {
        this.loadSettings();
        this.createSettingsPanel();
        this.updateControlRowsVisibility();
        return this;
      }
    }, {
      "key": "syncState",
      "value": function syncState() {
        var r;
        var o = (r = this.playerCore) === null || r === void 0 || (r = r.options) === null || r === void 0 ? void 0 : r.playerState;
        if (o && o.settings) {
          this.settings = o.settings;
        } else {
          this.loadSettings();
        }
      }
    }, {
      "key": "createSettingsPanel",
      "value": function createSettingsPanel() {
        var r = this;
        if (!this.settingsPanel) {
          return;
        }
        this.syncState();
        this.settingsPanel.innerHTML = "";
        var o = document.createElement("div");
        o.className = "tm-settings-menu-container";
        var a = function stopProp(r) {
          return r.stopPropagation();
        };
        o.addEventListener("click", a);
        o.addEventListener("mousedown", a);
        o.addEventListener("touchstart", a);
        var l = this._createSectionHeader("遥控器 :");
        var u = this._createToggleOption("进度条栏", "showProgressBar", this.settings.showProgressBar, (function(o) {
          r.updateSetting("showProgressBar", o);
          r.updateControlRowsVisibility();
        }));
        var p = document.createElement("div");
        p.className = "tm-settings-seek-wrapper";
        var v = this._createToggleOption("快进/快退栏", "showSeekControlRow", this.settings.showSeekControlRow, (function(o) {
          r.updateSetting("showSeekControlRow", o);
          r.updateControlRowsVisibility();
          r.createSettingsPanel();
        }));
        p.appendChild(v);
        if (this.settings.showSeekControlRow) {
          var b = this._createSeekStepsSubPanel();
          p.appendChild(b);
        }
        var y = this._createToggleOption("跳转/循环栏", "showLoopControlRow", this.settings.showLoopControlRow, (function(o) {
          r.updateSetting("showLoopControlRow", o);
          r.updateControlRowsVisibility();
        }));
        l.appendChild(u);
        l.appendChild(p);
        l.appendChild(y);
        o.appendChild(l);
        var C = this._createSectionHeader("评论区 :");
        var k = document.createElement("div");
        k.className = "tm-settings-comments-wrapper";
        var _ = this._createToggleOption("是否展示评论区", "showCommentsSection", this.settings.showCommentsSection, (function(o) {
          var a;
          r.updateSetting("showCommentsSection", o);
          if (o) {
            r.updateSetting("sidebarHidden", false);
            if (r.playerCore.uiManager) {
              r.playerCore.uiManager.isSidebarHidden = false;
              r.playerCore.uiManager.updateSidebarToggleButtonIcon();
            }
          }
          if ((a = r.playerCore.controlManager) !== null && a !== void 0 && a.commentPanel) {
            r.playerCore.controlManager.commentPanel.updateCommentsVisibility(o);
          }
          r.createSettingsPanel();
        }));
        k.appendChild(_);
        if (this.settings.showCommentsSection) {
          var E = this._createCommentSourcesSubPanel();
          k.appendChild(E);
        }
        C.appendChild(k);
        o.appendChild(C);
        var S = this._createSectionHeader("其他 :");
        var P = this._createToggleOption("DEBUG", "debugMode", this.settings.debugMode, (function(o) {
          var a;
          r.updateSetting("debugMode", o);
          if ((a = r.playerCore.controlManager) !== null && a !== void 0 && a.commentPanel) {
            r.playerCore.controlManager.commentPanel.updateDebugMode(o);
          }
        }));
        S.appendChild(P);
        o.appendChild(S);
        this.settingsPanel.appendChild(o);
      }
    }, {
      "key": "_createSectionHeader",
      "value": function _createSectionHeader(r) {
        var o = document.createElement("div");
        o.className = "tm-settings-section";
        var a = document.createElement("div");
        a.className = "tm-settings-section-header";
        a.textContent = r;
        var l = document.createElement("div");
        l.className = "tm-settings-section-divider";
        o.appendChild(a);
        o.appendChild(l);
        return o;
      }
    }, {
      "key": "_createToggleOption",
      "value": function _createToggleOption(r, o, a, l) {
        var u = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
        var p = document.createElement("div");
        p.className = "tm-settings-option-row";
        p.id = "tm-setting-".concat(o);
        var v = document.createElement("div");
        v.className = "tm-settings-label-wrapper";
        var b = document.createElement("span");
        b.className = "tm-settings-label";
        b.textContent = r;
        v.appendChild(b);
        if (u) {
          v.appendChild(u);
        }
        var y = document.createElement("div");
        y.className = "tm-toggle-switch";
        var C = document.createElement("input");
        C.type = "checkbox";
        C.checked = a;
        C.className = "tm-toggle-input";
        var k = document.createElement("span");
        k.className = a ? "tm-toggle-slider checked" : "tm-toggle-slider";
        y.appendChild(C);
        y.appendChild(k);
        var _ = function toggleSwitch(r) {
          r.preventDefault();
          r.stopPropagation();
          var o = !C.checked;
          C.checked = o;
          k.className = o ? "tm-toggle-slider checked" : "tm-toggle-slider";
          if (typeof l === "function") {
            l(o);
          }
        };
        p.addEventListener("click", _);
        p.appendChild(v);
        p.appendChild(y);
        return p;
      }
    }, {
      "key": "_createSeekStepsSubPanel",
      "value": function _createSeekStepsSubPanel() {
        var r = this;
        var o = document.createElement("div");
        o.className = "tm-settings-seek-steps-subpanel";
        o.addEventListener("wheel", (function(r) {
          if (r.deltaY !== 0) {
            r.preventDefault();
            o.scrollLeft += r.deltaY;
          }
        }), {
          "passive": false
        });
        var a = [ "5s", "10s", "30s", "1m", "5m", "10m" ];
        var l = Array.isArray(this.settings.customUserSeekSteps) ? this.settings.customUserSeekSteps : [];
        var u = Array.isArray(this.settings.enabledSeekSteps) ? this.settings.enabledSeekSteps : [ "5s", "10s", "30s", "1m", "5m", "10m" ];
        var p = [].concat(a);
        l.forEach((function(r) {
          if (!p.includes(r)) {
            p.push(r);
          }
        }));
        p.forEach((function(l) {
          var p = a.includes(l);
          var v = u.includes(l);
          var b = document.createElement("button");
          b.type = "button";
          b.className = "tm-seek-step-badge".concat(v ? " enabled" : " disabled");
          b.textContent = l;
          var y = false;
          var C = null;
          var k = function startLongPress(o) {
            y = false;
            C = setTimeout((function() {
              y = true;
              if (p) {
                Toast("默认 6 个预设步进不支持删除", 2e3, "warning");
              } else {
                r._deleteCustomSeekStep(l);
              }
            }), 600);
          };
          var _ = function cancelLongPress() {
            if (C) {
              clearTimeout(C);
              C = null;
            }
          };
          b.addEventListener("mousedown", k);
          b.addEventListener("mouseup", _);
          b.addEventListener("mouseleave", _);
          b.addEventListener("touchstart", k, {
            "passive": true
          });
          b.addEventListener("touchend", _);
          b.addEventListener("touchcancel", _);
          b.addEventListener("click", (function(o) {
            o.stopPropagation();
            if (y) {
              return;
            }
            var a = SettingsManager_toConsumableArray(u);
            if (v) {
              a = a.filter((function(r) {
                return r !== l;
              }));
            } else {
              a.push(l);
            }
            r.updateSetting("enabledSeekSteps", a);
            r.rebuildControlPanelSeekRow();
            r.createSettingsPanel();
          }));
          o.appendChild(b);
        }));
        var v = document.createElement("button");
        v.type = "button";
        v.className = "tm-seek-step-add-btn";
        v.textContent = "+";
        v.addEventListener("click", (function(a) {
          a.stopPropagation();
          var l = document.createElement("input");
          l.type = "text";
          l.className = "tm-seek-step-input";
          l.placeholder = "_s / _m";
          var u = false;
          var p = function submitValue() {
            if (u) {
              return;
            }
            u = true;
            var o = l.value.trim().toLowerCase();
            if (!o) {
              r.createSettingsPanel();
              return;
            }
            if (!/^\d+[sm]$/.test(o)) {
              Toast("格式错误，请填写如 15s 或 2m", 2500, "warning");
              r.createSettingsPanel();
              return;
            }
            r._addCustomSeekStep(o);
          };
          l.addEventListener("keydown", (function(o) {
            if (o.key === "Enter") {
              o.preventDefault();
              p();
            } else if (o.key === "Escape") {
              u = true;
              r.createSettingsPanel();
            }
          }));
          l.addEventListener("blur", (function() {
            p();
          }));
          o.replaceChild(l, v);
          l.focus();
        }));
        o.appendChild(v);
        return o;
      }
    }, {
      "key": "_addCustomSeekStep",
      "value": function _addCustomSeekStep(r) {
        var o = Array.isArray(this.settings.customUserSeekSteps) ? SettingsManager_toConsumableArray(this.settings.customUserSeekSteps) : [];
        var a = Array.isArray(this.settings.enabledSeekSteps) ? SettingsManager_toConsumableArray(this.settings.enabledSeekSteps) : [];
        if (!o.includes(r)) {
          o.push(r);
        }
        if (!a.includes(r)) {
          a.push(r);
        }
        this.updateSetting("customUserSeekSteps", o);
        this.updateSetting("enabledSeekSteps", a);
        this.rebuildControlPanelSeekRow();
        this.createSettingsPanel();
        Toast("已添加自定义步进 ".concat(r), 2e3, "success");
      }
    }, {
      "key": "_deleteCustomSeekStep",
      "value": function _deleteCustomSeekStep(r) {
        var o = Array.isArray(this.settings.customUserSeekSteps) ? SettingsManager_toConsumableArray(this.settings.customUserSeekSteps) : [];
        var a = Array.isArray(this.settings.enabledSeekSteps) ? SettingsManager_toConsumableArray(this.settings.enabledSeekSteps) : [];
        o = o.filter((function(o) {
          return o !== r;
        }));
        a = a.filter((function(o) {
          return o !== r;
        }));
        this.updateSetting("customUserSeekSteps", o);
        this.updateSetting("enabledSeekSteps", a);
        this.rebuildControlPanelSeekRow();
        this.createSettingsPanel();
        Toast("已删除自定义步进 ".concat(r), 2e3, "info");
      }
    }, {
      "key": "rebuildControlPanelSeekRow",
      "value": function rebuildControlPanelSeekRow() {
        var r = this.playerCore.controlManager;
        if (!r || !r.controlButtonsContainer || !r.seekController) {
          return;
        }
        var o = r.controlButtonsContainer.querySelector(".tm-seek-control-row");
        var a = r.seekController.createSeekControlRow();
        if (o && o.parentNode) {
          o.parentNode.replaceChild(a, o);
        }
        this.updateControlRowsVisibility();
      }
    }, {
      "key": "_createCommentSourcesSubPanel",
      "value": function _createCommentSourcesSubPanel() {
        var r = this;
        var o = document.createElement("div");
        o.className = "tm-settings-sources-subpanel";
        var a = [ {
          "key": "jable",
          "name": "Jable"
        }, {
          "key": "javdb",
          "name": "JavDB"
        }, {
          "key": "javlibrary",
          "name": "Javlibrary"
        } ];
        var l = this.settings.enabledCommentSources || {
          "jable": true,
          "javdb": true,
          "javlibrary": false
        };
        a.forEach((function(a) {
          var u = !!l[a.key];
          var p = document.createElement("button");
          p.type = "button";
          p.className = "tm-source-badge".concat(u ? " enabled" : " disabled");
          p.textContent = a.name;
          p.addEventListener("click", (function(o) {
            var l;
            o.stopPropagation();
            var p = SettingsManager_objectSpread({}, r.settings.enabledCommentSources);
            p[a.key] = !u;
            r.updateSetting("enabledCommentSources", p);
            if ((l = r.playerCore.controlManager) !== null && l !== void 0 && l.commentPanel) {
              r.playerCore.controlManager.commentPanel.updateCommentSources();
            }
            r.createSettingsPanel();
          }));
          o.appendChild(p);
        }));
        return o;
      }
    }, {
      "key": "toggleSettingsPanel",
      "value": function toggleSettingsPanel() {
        var r = this;
        if (!this.settingsPanel) {
          return;
        }
        var o = this.settingsPanel.classList.contains("active");
        if (o) {
          this.closeSettingsPanel();
        } else {
          this.syncState();
          this.createSettingsPanel();
          this.settingsPanel.classList.add("active");
          this.overlayClickHandler = function(o) {
            if (!r.settingsPanel.contains(o.target) && o.target !== r.uiElements.settingsBtn) {
              r.closeSettingsPanel();
            }
          };
          setTimeout((function() {
            var o = r.uiElements.overlay || document.body;
            o.addEventListener("click", r.overlayClickHandler);
          }), 50);
        }
      }
    }, {
      "key": "closeSettingsPanel",
      "value": function closeSettingsPanel() {
        if (!this.settingsPanel) {
          return;
        }
        this.settingsPanel.classList.remove("active");
        if (this.overlayClickHandler) {
          var r = this.uiElements.overlay || document.body;
          r.removeEventListener("click", this.overlayClickHandler);
          this.overlayClickHandler = null;
        }
      }
    }, {
      "key": "loadSettings",
      "value": function loadSettings() {
        var r;
        var o = (r = this.playerCore) === null || r === void 0 || (r = r.options) === null || r === void 0 ? void 0 : r.playerState;
        if (o) {
          o.loadSettings();
          this.settings = o.settings;
        } else {
          this.settings.showProgressBar = getValue("showProgressBar", true);
          this.settings.showSeekControlRow = getValue("showSeekControlRow", true);
          this.settings.showLoopControlRow = getValue("showLoopControlRow", true);
          this.settings.showPlaybackControlRow = getValue("showPlaybackControlRow", true);
          this.settings.enabledSeekSteps = getValue("enabledSeekSteps", [ "5s", "10s", "30s", "1m", "5m", "10m" ]);
          this.settings.showCommentsSection = getValue("showCommentsSection", true);
          this.settings.enabledCommentSources = getValue("enabledCommentSources", {
            "jable": true,
            "javdb": true,
            "javlibrary": false
          });
          this.settings.debugMode = getValue("debugMode", false);
        }
      }
    }, {
      "key": "saveSettings",
      "value": function saveSettings() {
        var r;
        var o = (r = this.playerCore) === null || r === void 0 || (r = r.options) === null || r === void 0 ? void 0 : r.playerState;
        if (o) {
          o.saveSettings();
        } else {
          setValue("showProgressBar", this.settings.showProgressBar);
          setValue("showSeekControlRow", this.settings.showSeekControlRow);
          setValue("showLoopControlRow", this.settings.showLoopControlRow);
          setValue("showPlaybackControlRow", this.settings.showPlaybackControlRow);
          setValue("enabledSeekSteps", this.settings.enabledSeekSteps);
          setValue("showCommentsSection", this.settings.showCommentsSection);
          setValue("enabledCommentSources", this.settings.enabledCommentSources);
          setValue("debugMode", this.settings.debugMode);
        }
      }
    }, {
      "key": "updateControlRowsVisibility",
      "value": function updateControlRowsVisibility() {
        var r = document.querySelector(".tm-control-buttons");
        if (!r) {
          return;
        }
        var o = r.querySelector(".tm-seek-control-row");
        var a = r.querySelector(".tm-loop-control-row");
        var l = r.querySelector(".tm-playback-control-row");
        var u = r.querySelector(".tm-progress-row");
        if (u) {
          u.style.display = this.settings.showProgressBar ? "flex" : "none";
        }
        if (o) {
          o.style.display = this.settings.showSeekControlRow ? "flex" : "none";
        }
        if (a) {
          a.style.display = this.settings.showLoopControlRow ? "flex" : "none";
        }
        if (l) {
          l.style.display = this.settings.showPlaybackControlRow ? "flex" : "none";
        }
      }
    }, {
      "key": "updateSetting",
      "value": function updateSetting(r, o) {
        var a;
        this.settings[r] = o;
        var l = (a = this.playerCore) === null || a === void 0 || (a = a.options) === null || a === void 0 ? void 0 : a.playerState;
        if (l) {
          l.updateSetting(r, o);
        } else {
          this.saveSettings();
        }
        if (r.startsWith("show") && r.endsWith("Row")) {
          this.updateControlRowsVisibility();
        }
      }
    } ]);
  }();
  function videoSwipeManager_typeof(r) {
    "@babel/helpers - typeof";
    return videoSwipeManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, videoSwipeManager_typeof(r);
  }
  function videoSwipeManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function videoSwipeManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, videoSwipeManager_toPropertyKey(l.key), l);
    }
  }
  function videoSwipeManager_createClass(r, o, a) {
    return o && videoSwipeManager_defineProperties(r.prototype, o), a && videoSwipeManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function videoSwipeManager_toPropertyKey(r) {
    var o = videoSwipeManager_toPrimitive(r, "string");
    return "symbol" == videoSwipeManager_typeof(o) ? o : o + "";
  }
  function videoSwipeManager_toPrimitive(r, o) {
    if ("object" != videoSwipeManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != videoSwipeManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Ge = function() {
    function VideoSwipeManager(r, o, a) {
      var l = this;
      var u = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      var p = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
      videoSwipeManager_classCallCheck(this, VideoSwipeManager);
      this.video = r;
      this.container = o;
      this.handle = a;
      this.uiElements = u;
      this.onClose = p;
      this._touchPreventDefault = function(r) {
        if (l.isDragging && r.touches && r.touches.length > 0) {
          var o = r.touches[0].clientY;
          var a = o - l.startY;
          if (l.dragDirection === "vertical") {
            if (a < 0) {
              if (window.tmDebugLogger) {
                window.tmDebugLogger.log("[_touchPreventDefault] Video swipe UP. deltaY: ".concat(a, ". Allowing penetration."));
              }
              return;
            }
            if (window.tmDebugLogger) {
              window.tmDebugLogger.log("[_touchPreventDefault] Video swipe DOWN. deltaY: ".concat(a, ". Preventing default!"));
            }
            if (r.cancelable) {
              r.preventDefault();
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
    return videoSwipeManager_createClass(VideoSwipeManager, [ {
      "key": "_init",
      "value": function _init() {
        var r = this;
        this.video.style.willChange = "transform";
        this.video.style.transition = "transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)";
        if (this.container) {
          this.minimap = document.createElement("div");
          this.minimap.className = "tm-video-minimap";
          this.minimap.innerHTML = '<div class="tm-video-minimap-viewport"></div>';
          this.container.appendChild(this.minimap);
          this.minimapViewport = this.minimap.querySelector(".tm-video-minimap-viewport");
        }
        var o = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
        o.addEventListener("pointerdown", this._pointerDownHandler);
        if (this.handle) {
          this.handle.style.willChange = "transform, left";
          this.handle.style.transition = "left 0.2s cubic-bezier(0.215, 0.61, 0.355, 1), width 0.2s ease";
          this.handle.addEventListener("pointerdown", this._handlePointerDownHandler);
        }
        this._updateConstraints();
        this.video.addEventListener("loadedmetadata", (function() {
          r._updateConstraints();
        }));
        this.video.addEventListener("canplay", (function() {
          r._updateConstraints();
        }));
        this._windowResizeHandler = function() {
          r._updateConstraints();
        };
        window.addEventListener("resize", this._windowResizeHandler);
        window.addEventListener("orientationchange", this._windowResizeHandler);
      }
    }, {
      "key": "_updateVideoDimensions",
      "value": function _updateVideoDimensions() {
        this.videoWidth = this.video.videoWidth || this.video.naturalWidth || 0;
        this.videoHeight = this.video.videoHeight || this.video.naturalHeight || 0;
        this.containerWidth = this.container.offsetWidth;
        this.containerHeight = this.container.offsetHeight;
        if (this.videoWidth <= 0 || this.videoHeight <= 0 || this.containerWidth <= 0 || this.containerHeight <= 0) {
          this.videoScale = 1;
          this.maxOffset = 0;
          return false;
        }
        var r = this.video.getBoundingClientRect();
        var o = r.width;
        var a = r.height;
        this.videoScale = a / this.videoHeight;
        var l = Math.max(0, o - this.containerWidth);
        this.maxOffset = l / 2;
        return true;
      }
    }, {
      "key": "_updateConstraints",
      "value": function _updateConstraints() {
        var r = this._updateVideoDimensions();
        if (!r || this.maxOffset <= 0) {
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
          var o = this.videoWidth / this.videoHeight;
          if (o > 0) {
            var a = 80;
            var l = 45;
            var u = a;
            var p = Math.round(a / o);
            if (p > l) {
              p = l;
              u = Math.round(l * o);
            }
            this.minimap.style.width = "".concat(u, "px");
            this.minimap.style.height = "".concat(p, "px");
            var v = this.videoWidth * this.videoScale || this.containerWidth;
            if (v > 0 && this.minimapViewport) {
              var b = Math.min(u, this.containerWidth / v * u);
              this.minimapViewport.style.width = "".concat(b, "px");
              this.minimapMaxTravel = u - b;
            }
          }
        }
        this._updateMinimapViewport();
        return true;
      }
    }, {
      "key": "_applyOffset",
      "value": function _applyOffset(r) {
        var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        this.offset = Math.max(-this.maxOffset, Math.min(r, this.maxOffset));
        if (o) {
          this.video.style.transition = "transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)";
        } else {
          this.video.style.transition = "none";
        }
        this.video.style.transform = "translateX(".concat(this.offset, "px)");
        this._updateHandlePosition();
        this._updateMinimapViewport();
        return this;
      }
    }, {
      "key": "_updateMinimapViewport",
      "value": function _updateMinimapViewport() {
        if (!this.minimapViewport || this.maxOffset <= 0) {
          return;
        }
        var r = (this.maxOffset - this.offset) / (2 * this.maxOffset) * (this.minimapMaxTravel || 0);
        this.minimapViewport.style.transform = "translateX(".concat(r, "px)");
      }
    }, {
      "key": "_updateHandleState",
      "value": function _updateHandleState(r) {
        if (!this.handle) {
          return;
        }
        this._updateHandleWidth();
        if (r) {
          this.handle.style.cursor = "grab";
          this.video.style.cursor = "grab";
          var o = this.handle.parentElement;
          if (o) {
            o.style.cursor = "grab";
          }
        } else {
          this.handle.style.cursor = "default";
          this.video.style.cursor = "default";
        }
        this._updateHandlePosition();
      }
    }, {
      "key": "_updateHandleWidth",
      "value": function _updateHandleWidth() {
        if (!this.handle) {
          return;
        }
        var r = 30;
        this.handle.style.width = "".concat(r, "%");
      }
    }, {
      "key": "_updateHandlePosition",
      "value": function _updateHandlePosition() {
        if (!this.handle) {
          return;
        }
        var r = this.handle.parentElement;
        if (!r) {
          return;
        }
        if (this.maxOffset <= 0) {
          this.handle.style.left = "50%";
          this.handle.style.transform = "translateX(-50%)";
          return;
        }
        var o = r.offsetWidth;
        var a = this.handle.offsetWidth;
        var l = o - a;
        var u = 1 - (this.offset + this.maxOffset) / (2 * this.maxOffset);
        var p = u * l;
        var v = p / o * 100;
        this.handle.style.left = "".concat(v, "%");
        this.handle.style.transform = "";
      }
    }, {
      "key": "_updateVelocityTracker",
      "value": function _updateVelocityTracker(r, o) {
        var a = Date.now();
        r.positions.push({
          "val": o,
          "time": a
        });
        while (r.positions.length > 1 && a - r.positions[0].time > 100) {
          r.positions.shift();
        }
        if (r.positions.length > 1) {
          var l = r.positions[0];
          var u = r.positions[r.positions.length - 1];
          var p = u.time - l.time;
          if (p > 0) {
            r.currentVelocity = (u.val - l.val) / p;
          }
        }
        r.lastTimestamp = a;
      }
    }, {
      "key": "_trackVelocity",
      "value": function _trackVelocity(r) {
        this._updateVelocityTracker(this.velocityTracker, r);
      }
    }, {
      "key": "_applyInertia",
      "value": function _applyInertia() {
        if (Math.abs(this.velocityTracker.currentVelocity) < .1) {
          return;
        }
        var r = this.velocityTracker.currentVelocity;
        var o = .002;
        var a = r * r / (2 * o) * Math.sign(r);
        var l = this.offset + a;
        l = Math.max(-this.maxOffset, Math.min(l, this.maxOffset));
        var u = Math.min(Math.abs(r / o) * .8, 400);
        this._animateTo(l, u);
      }
    }, {
      "key": "_animateTo",
      "value": function _animateTo(r) {
        var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 300;
        if (this.animation.rafId) {
          cancelAnimationFrame(this.animation.rafId);
          this.animation.rafId = null;
        }
        this._applyOffset(r, true);
      }
    }, {
      "key": "_handlePointerDown",
      "value": function _handlePointerDown(r) {
        if (!r.isPrimary) {
          return;
        }
        if (this.animation.active) {
          cancelAnimationFrame(this.animation.rafId);
          this.animation.active = false;
        }
        this.isDragging = true;
        this.startX = r.clientX;
        this.startY = r.clientY;
        this.dragDirection = null;
        this.deltaY = 0;
        this.startOffset = this.offset;
        this.dragDistance = 0;
        this.velocityTracker.positions = [];
        this.velocityTracker.lastTimestamp = Date.now();
        this.velocityTracker.currentVelocity = 0;
        this._trackVelocity(r.clientX);
        this.video.style.cursor = "grabbing";
        this.video.style.transition = "none";
        var o = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
        window.addEventListener("pointermove", this._pointerMoveHandler);
        window.addEventListener("pointerup", this._pointerUpHandler);
        window.addEventListener("pointercancel", this._pointerUpHandler);
        o.addEventListener("touchmove", this._touchPreventDefault, {
          "passive": false
        });
        if (window.navigator.vibrate) {
          window.navigator.vibrate(5);
        }
      }
    }, {
      "key": "_handlePointerMove",
      "value": function _handlePointerMove(r) {
        if (!this.isDragging || !r.isPrimary) {
          return;
        }
        if (this.playerCore && this.playerCore.uiManager && this.playerCore.uiManager.isLongPress) {
          return;
        }
        if (this.playerCore && this.playerCore.uiManager && this.playerCore.uiManager.isLandscape) {
          var o = this.playerCore.uiManager;
          var a = !!(o.playerContainer && o.playerContainer.className.match(/tm-controls-docked-/));
          var l = o.isSidebarHidden || !a;
          if (l && o.controlsVisible) {
            o.hideControls();
          }
        }
        var u = r.clientX - this.startX;
        var p = r.clientY - this.startY;
        if (this.dragDirection === null) {
          var v = Math.abs(u);
          var b = Math.abs(p);
          if (v > 5 || b > 5) {
            if (b > v) {
              this.dragDirection = "vertical";
            } else {
              this.dragDirection = "horizontal";
            }
          }
        }
        if (this.dragDirection === "horizontal") {
          var y = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
          if (y && y.classList) {
            y.classList.add("is-swiping");
          }
          if (this.maxOffset > 0) {
            this.dragDistance = Math.max(this.dragDistance, Math.abs(u));
            var C = Math.max(-this.maxOffset, Math.min(this.startOffset + u, this.maxOffset));
            this._applyOffset(C, false);
            this._trackVelocity(r.clientX);
          }
        } else if (this.dragDirection === "vertical") {
          this.deltaY = p;
          this.dragDistance = Math.max(this.dragDistance, Math.abs(p));
          if (p > 0) {
            document.body.classList.add("tm-swiping-down");
            if (this.uiElements && this.uiElements.playerContainer) {
              this.uiElements.playerContainer.style.transform = "translateY(".concat(p, "px)");
              this.uiElements.playerContainer.style.opacity = Math.max(0, 1 - p / 350);
              this.uiElements.playerContainer.style.transition = "none";
            }
            if (this.uiElements && this.uiElements.overlay) {
              this.uiElements.overlay.style.opacity = Math.max(.08, 1 - p / 320);
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
        var k = this.dragDirection === "vertical" && p < 0;
        var _ = this.dragDirection === null && p < -2;
        if (!k && !_) {
          if (r.cancelable) {
            r.preventDefault();
          }
        }
      }
    }, {
      "key": "_handlePointerUp",
      "value": function _handlePointerUp(r) {
        var o = this;
        if (!this.isDragging || !r.isPrimary) {
          return;
        }
        this.isDragging = false;
        if (this.dragDistance > this.minDragDistance) {
          this.wasDragging = true;
          this.dragEndTimestamp = Date.now();
        } else {
          this.wasDragging = false;
        }
        if (this.playerCore && this.playerCore.uiManager && this.playerCore.uiManager.isLandscape) {
          this.playerCore.uiManager.autoHideControls();
        }
        var a = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
        if (a && a.classList) {
          setTimeout((function() {
            if (!o.isDragging && a && a.classList) {
              a.classList.remove("is-swiping");
            }
          }), 600);
        }
        window.removeEventListener("pointermove", this._pointerMoveHandler);
        window.removeEventListener("pointerup", this._pointerUpHandler);
        window.removeEventListener("pointercancel", this._pointerUpHandler);
        a.removeEventListener("touchmove", this._touchPreventDefault);
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
            setTimeout((function() {
              if (o.onClose) {
                o.onClose();
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
        r.preventDefault();
      }
    }, {
      "key": "_handleHandlePointerDown",
      "value": function _handleHandlePointerDown(r) {
        if (this.maxOffset <= 0) {
          return;
        }
        if (!r.isPrimary) {
          return;
        }
        if (this.animation.active) {
          cancelAnimationFrame(this.animation.rafId);
          this.animation.active = false;
        }
        this.isHandleDragging = true;
        this.startX = r.clientX;
        this.dragDistance = 0;
        this.startOffset = this.offset;
        var o = this.handle.parentElement;
        var a = o ? o.offsetWidth : 0;
        if (a > 0) {
          var l = this.handle.getBoundingClientRect();
          this.startHandleLeft = l.left - o.getBoundingClientRect().left;
          this.startHandleLeftPercent = this.startHandleLeft / a * 100;
        } else {
          this.startHandleLeft = 0;
          this.startHandleLeftPercent = 0;
        }
        this.handle.style.cursor = "grabbing";
        this.handle.style.transition = "none";
        if (this.handle.setPointerCapture) {
          this.handle.setPointerCapture(r.pointerId);
        }
        this.handle.addEventListener("pointermove", this._handlePointerMoveHandler);
        this.handle.addEventListener("pointerup", this._handlePointerUpHandler);
        this.handle.addEventListener("pointercancel", this._handlePointerUpHandler);
        if (window.navigator.vibrate) {
          window.navigator.vibrate(5);
        }
        r.preventDefault();
      }
    }, {
      "key": "_handleHandlePointerMove",
      "value": function _handleHandlePointerMove(r) {
        if (!this.isHandleDragging || !r.isPrimary) {
          return;
        }
        var o = this.handle.parentElement;
        if (!o) {
          return;
        }
        var a = o.offsetWidth;
        var l = this.handle.offsetWidth;
        if (a <= 0 || l <= 0) {
          return;
        }
        var u = r.clientX - this.startX;
        this.dragDistance = Math.max(this.dragDistance, Math.abs(u));
        var p = this.startHandleLeft + u;
        var v = a - l;
        p = Math.max(0, Math.min(p, v));
        this._trackHandleVelocity(p);
        var b = [ 0, v / 2, v ];
        var y = 15;
        var C = false;
        for (var k = 0, _ = b; k < _.length; k++) {
          var E = _[k];
          if (Math.abs(p - E) < y) {
            p = E;
            C = true;
            if (window.navigator.vibrate && (!this.lastSnapPosition || this.lastSnapPosition !== E)) {
              window.navigator.vibrate(15);
              this.lastSnapPosition = E;
            }
            break;
          }
        }
        if (!C) {
          this.lastSnapPosition = null;
        }
        var S = p / a * 100;
        this.handle.style.left = "".concat(S, "%");
        var P = v > 0 ? p / v : 0;
        var D = (1 - P) * 2 * this.maxOffset - this.maxOffset;
        this.video.style.transform = "translateX(".concat(D, "px)");
        this.video.style.transition = "none";
        this.offset = D;
        r.preventDefault();
      }
    }, {
      "key": "_handleHandlePointerUp",
      "value": function _handleHandlePointerUp(r) {
        if (!this.isHandleDragging || !r.isPrimary) {
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
          this.handle.releasePointerCapture(r.pointerId);
        }
        this.handle.removeEventListener("pointermove", this._handlePointerMoveHandler);
        this.handle.removeEventListener("pointerup", this._handlePointerUpHandler);
        this.handle.removeEventListener("pointercancel", this._handlePointerUpHandler);
        this.handle.style.cursor = "grab";
        this._applyHandleInertia();
        r.preventDefault();
      }
    }, {
      "key": "_trackHandleVelocity",
      "value": function _trackHandleVelocity(r) {
        this._updateVelocityTracker(this.handleVelocityTracker, r);
      }
    }, {
      "key": "_applyHandleInertia",
      "value": function _applyHandleInertia() {
        if (Math.abs(this.handleVelocityTracker.currentVelocity) < .1) {
          return;
        }
        var r = this.handle.parentElement;
        if (!r) {
          return;
        }
        var o = r.offsetWidth;
        var a = this.handle.offsetWidth;
        var l = o - a;
        var u = this.handle.getBoundingClientRect();
        var p = r.getBoundingClientRect();
        var v = u.left - p.left;
        var b = this.handleVelocityTracker.currentVelocity;
        var y = .002;
        var C = b * b / (2 * y) * Math.sign(b);
        var k = v + C;
        k = Math.max(0, Math.min(k, l));
        var _ = [ 0, l / 2, l ];
        var E = 30;
        var S = k;
        var P = Number.MAX_VALUE;
        for (var D = 0, L = _; D < L.length; D++) {
          var M = L[D];
          var A = Math.abs(k - M);
          if (A < E && A < P) {
            S = M;
            P = A;
          }
        }
        if (P < Number.MAX_VALUE) {
          k = S;
        }
        var T = k / o * 100;
        var j = l > 0 ? k / l : 0;
        var B = (1 - j) * 2 * this.maxOffset - this.maxOffset;
        this.handle.style.transition = "left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        this.video.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        this.handle.style.left = "".concat(T, "%");
        this.video.style.transform = "translateX(".concat(B, "px)");
        this.offset = B;
        if (P < Number.MAX_VALUE && window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
        this.handleVelocityTracker.positions = [];
        this.handleVelocityTracker.currentVelocity = 0;
      }
    }, {
      "key": "setOffset",
      "value": function setOffset(r) {
        var o = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        return this._applyOffset(r, o);
      }
    }, {
      "key": "reset",
      "value": function reset() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
        this._applyOffset(0, r);
        this.wasDragging = false;
        return this;
      }
    }, {
      "key": "updateSize",
      "value": function updateSize() {
        if (this.video && this.container) {
          var r = this.video.getBoundingClientRect();
          var o = this.container.getBoundingClientRect();
          var a = this._updateConstraints();
        }
        return this;
      }
    }, {
      "key": "destroy",
      "value": function destroy() {
        if (this._windowResizeHandler) {
          window.removeEventListener("resize", this._windowResizeHandler);
          window.removeEventListener("orientationchange", this._windowResizeHandler);
          this._windowResizeHandler = null;
        }
        var r = this.uiElements && this.uiElements.videoWrapper ? this.uiElements.videoWrapper : this.video;
        if (r) {
          r.removeEventListener("pointerdown", this._pointerDownHandler);
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
    }, {
      "key": "wasRecentlyDragging",
      "value": function wasRecentlyDragging() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 150;
        if (!this.wasDragging) {
          return false;
        }
        var o = Date.now() - this.dragEndTimestamp;
        if (o > r) {
          this.wasDragging = false;
          return false;
        }
        return true;
      }
    } ]);
  }();
  function CustomVideoPlayer_typeof(r) {
    "@babel/helpers - typeof";
    return CustomVideoPlayer_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, CustomVideoPlayer_typeof(r);
  }
  function CustomVideoPlayer_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function CustomVideoPlayer_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, CustomVideoPlayer_toPropertyKey(l.key), l);
    }
  }
  function CustomVideoPlayer_createClass(r, o, a) {
    return o && CustomVideoPlayer_defineProperties(r.prototype, o), a && CustomVideoPlayer_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function CustomVideoPlayer_toPropertyKey(r) {
    var o = CustomVideoPlayer_toPrimitive(r, "string");
    return "symbol" == CustomVideoPlayer_typeof(o) ? o : o + "";
  }
  function CustomVideoPlayer_toPrimitive(r, o) {
    if ("object" != CustomVideoPlayer_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != CustomVideoPlayer_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var ze = function() {
    function CustomVideoPlayer() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      CustomVideoPlayer_classCallCheck(this, CustomVideoPlayer);
      this.playerCore = new y(r);
      this.callingButton = r.callingButton || null;
      this.managers = {};
      this.initialized = false;
    }
    return CustomVideoPlayer_createClass(CustomVideoPlayer, [ {
      "key": "init",
      "value": function init() {
        var r = this;
        if (this.initialized) {
          return;
        }
        document.body.classList.add("tm-player-active");
        document.documentElement.classList.add("tm-player-active");
        this._scrollbarStyle = document.createElement("style");
        this._scrollbarStyle.id = "tm-hide-scrollbar-style";
        this._scrollbarStyle.innerHTML = "\n            html::-webkit-scrollbar, body::-webkit-scrollbar {\n                display: none !important;\n            }\n            html, body {\n                scrollbar-width: none !important;\n                -ms-overflow-style: none !important;\n                overscroll-behavior: none !important;\n                overscroll-behavior-y: none !important;\n            }\n        ";
        document.head.appendChild(this._scrollbarStyle);
        if (!this.playerCore) {
          this.playerCore = new y({
            "callingButton": this.callingButton
          });
        }
        this.playerCore.init();
        if (!this.playerCore.targetVideo) {
          Toast(__("loadingError") || "Failed to load video", 3e3, "error");
          if (this.callingButton) {
            this.callingButton.style.display = "flex";
          }
          return;
        }
        var o = new z(this.playerCore);
        var a = o.createUI();
        this.managers.uiManager = o;
        this.playerCore.uiManager = o;
        var l = new He(this.playerCore, a);
        l.init();
        this.managers.settingsManager = l;
        var u = new Be(this.playerCore, a);
        u.init();
        this.managers.controlManager = u;
        this.playerCore.controlManager = u;
        var p = new Oe(this.playerCore, a);
        this.playerCore.progressManager = p;
        p.init({
          "progressBarElement": u.progressBarElement,
          "progressIndicator": u.progressIndicator,
          "currentTimeDisplay": u.currentTimeDisplay,
          "totalDurationDisplay": u.totalDurationDisplay,
          "timeIndicator": u.timeIndicator
        });
        this.managers.progressManager = p;
        var v = new Ve(this.playerCore, a);
        v.init({
          "loopStartMarker": u.loopStartMarker,
          "loopEndMarker": u.loopEndMarker,
          "loopRangeElement": u.loopRangeElement,
          "progressMarkersContainer": u.progressMarkersContainer,
          "tabScrollContainer": u.tabScrollContainer,
          "tabAddBtn": u.tabAddBtn
        });
        this.managers.loopManager = v;
        u.setLoopManager(v);
        var b = new Ie(this.playerCore, a);
        b.init();
        this.managers.dragManager = b;
        this.playerCore.dragManager = b;
        if (this.playerCore.targetVideo && a.videoWrapper && a.handle) {
          this.swipeManager = new Ge(this.playerCore.targetVideo, a.videoWrapper, a.handle, a, (function() {
            return r.close();
          }));
          this.swipeManager.playerCore = this.playerCore;
          this.playerCore.swipeManager = this.swipeManager;
          this.managers.swipeManager = this.swipeManager;
        }
        var C = new Re(this.playerCore, a, this.managers);
        C.init();
        this.managers.eventManager = C;
        o.assembleDOM();
        l.updateControlRowsVisibility();
        this.playerCore.restoreVideoState();
        p.updateProgressBar();
        p.updateCurrentTimeDisplay();
        updateSafariThemeColor("#000000", true);
        var k = function runUIUpdates() {
          if (r.swipeManager) {
            r.swipeManager.updateSize();
          }
          b.updateHandlePosition();
          if (v) {
            v._updateUI();
            v.updateLoopTimeDisplay();
            v.updateLoopMarkers();
          }
          if (p) {
            p.updateProgressBar();
            p.updateCurrentTimeDisplay();
          }
        };
        if (this.playerCore.targetVideo.readyState >= 1) {
          requestAnimationFrame((function() {
            setTimeout(k, 50);
          }));
        } else {
          this.playerCore.targetVideo.addEventListener("loadedmetadata", k, {
            "once": true
          });
        }
        this.initialized = true;
      }
    }, {
      "key": "close",
      "value": function close() {
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
        for (var r in this.managers) {
          if (this.managers[r] && typeof this.managers[r].cleanup === "function") {
            this.managers[r].cleanup();
          }
          this.managers[r] = null;
        }
        this.initialized = false;
        this.managers = {};
        this.playerCore = null;
      }
    } ]);
  }();
  function FloatingButton_typeof(r) {
    "@babel/helpers - typeof";
    return FloatingButton_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, FloatingButton_typeof(r);
  }
  function FloatingButton_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function FloatingButton_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, FloatingButton_toPropertyKey(l.key), l);
    }
  }
  function FloatingButton_createClass(r, o, a) {
    return o && FloatingButton_defineProperties(r.prototype, o), a && FloatingButton_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function FloatingButton_toPropertyKey(r) {
    var o = FloatingButton_toPrimitive(r, "string");
    return "symbol" == FloatingButton_typeof(o) ? o : o + "";
  }
  function FloatingButton_toPrimitive(r, o) {
    if ("object" != FloatingButton_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != FloatingButton_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Ne = function() {
    function FloatingButton() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      FloatingButton_classCallCheck(this, FloatingButton);
      this.button = null;
      this.videoPlayer = null;
      this.resizeTimeout = null;
      this.playerState = r.playerState || null;
      this.videoCheckInterval = null;
      this.mutationObserver = null;
    }
    return FloatingButton_createClass(FloatingButton, [ {
      "key": "init",
      "value": function init() {
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
    }, {
      "key": "setupMutationObserver",
      "value": function setupMutationObserver() {
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
        }
        this.mutationObserver = new MutationObserver(this.handleDomMutations.bind(this));
        this.mutationObserver.observe(document.body, {
          "childList": true,
          "subtree": true
        });
      }
    }, {
      "key": "handleDomMutations",
      "value": function handleDomMutations() {
        var r = this;
        if (this.mutationTimeout) {
          clearTimeout(this.mutationTimeout);
        }
        this.mutationTimeout = setTimeout((function() {
          var o = findVideoElement();
          if (o && !r.button) {
            r.createButton();
            window.addEventListener("resize", r.handleResize.bind(r));
            window.matchMedia("(orientation: portrait)").addEventListener("change", r.handleResize.bind(r));
          } else if (!o && r.button) {
            r.button.style.display = "none";
          } else if (o && r.button && r.button.style.display === "none") {
            r.button.style.display = "flex";
          }
        }), 300);
      }
    }, {
      "key": "startVideoElementCheck",
      "value": function startVideoElementCheck() {
        var r = this;
        if (this.videoCheckInterval) {
          clearInterval(this.videoCheckInterval);
        }
        this.videoCheckInterval = setInterval((function() {
          if (findVideoElement()) {
            if (!r.button) {
              r.createButton();
              window.addEventListener("resize", r.handleResize.bind(r));
              window.matchMedia("(orientation: portrait)").addEventListener("change", r.handleResize.bind(r));
            } else if (r.button.style.display === "none") {
              r.button.style.display = "flex";
            }
            clearInterval(r.videoCheckInterval);
            r.videoCheckInterval = null;
          }
        }), 2e3);
      }
    }, {
      "key": "cleanupExistingButtons",
      "value": function cleanupExistingButtons() {
        var r = document.querySelectorAll(".tm-floating-button");
        if (r.length > 0) {
          r.forEach((function(r) {
            if (r && r.parentNode) {
              r.parentNode.removeChild(r);
            }
          }));
        }
      }
    }, {
      "key": "handleResize",
      "value": function handleResize() {
        var r = this;
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((function() {
          if (findVideoElement()) {
            r.button.style.display = "flex";
            r.updateButtonPosition();
          } else if (r.button) {
            r.button.style.display = "none";
          }
        }), 200);
      }
    }, {
      "key": "createButton",
      "value": function createButton() {
        var r = this;
        this.button = createElementWithStyle("button", "tm-floating-button");
        this.button.innerHTML = C;
        this.button.addEventListener("click", (function() {
          r.handleButtonClick();
        }));
        this.button.style.display = "flex";
        document.body.appendChild(this.button);
        this.updateButtonPosition();
        return this.button;
      }
    }, {
      "key": "updateButtonPosition",
      "value": function updateButtonPosition() {
        if (!this.button) {
          return;
        }
        var r = getSafeAreaInsets();
        var o = isPortrait();
        if (o) {
          this.button.style.bottom = "".concat(Math.max(20, r.bottom), "px");
          this.button.style.right = "auto";
          this.button.style.left = "50%";
          this.button.style.transform = "translateX(-50%)";
        } else {
          this.button.style.bottom = "".concat(Math.max(20, r.bottom + 10), "px");
          this.button.style.right = "".concat(Math.max(20, r.right + 10), "px");
          this.button.style.left = "auto";
          this.button.style.transform = "translateX(0)";
        }
        this.button.style.zIndex = "9980";
      }
    }, {
      "key": "handleButtonClick",
      "value": function handleButtonClick() {
        this.button.style.display = "none";
        this.videoPlayer = new ze({
          "playerState": this.playerState,
          "callingButton": this.button
        });
        this.videoPlayer.init();
      }
    }, {
      "key": "remove",
      "value": function remove() {
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
    } ]);
  }();
  function PlayerState_typeof(r) {
    "@babel/helpers - typeof";
    return PlayerState_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, PlayerState_typeof(r);
  }
  function PlayerState_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function PlayerState_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, PlayerState_toPropertyKey(l.key), l);
    }
  }
  function PlayerState_createClass(r, o, a) {
    return o && PlayerState_defineProperties(r.prototype, o), a && PlayerState_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function PlayerState_toPropertyKey(r) {
    var o = PlayerState_toPrimitive(r, "string");
    return "symbol" == PlayerState_typeof(o) ? o : o + "";
  }
  function PlayerState_toPrimitive(r, o) {
    if ("object" != PlayerState_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != PlayerState_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Je = function() {
    function PlayerState() {
      PlayerState_classCallCheck(this, PlayerState);
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
        "debugMode": false,
        "sidebarPosition": "right",
        "sidebarHidden": false
      };
    }
    return PlayerState_createClass(PlayerState, [ {
      "key": "loadSettings",
      "value": function loadSettings() {
        try {
          this.settings.showProgressBar = getValue("showProgressBar", true);
          this.settings.showSeekControlRow = getValue("showSeekControlRow", true);
          this.settings.showLoopControlRow = getValue("showLoopControlRow", true);
          this.settings.showPlaybackControlRow = getValue("showPlaybackControlRow", true);
          this.settings.enabledSeekSteps = getValue("enabledSeekSteps", [ "5s", "10s", "30s", "1m", "5m", "10m" ]);
          this.settings.customUserSeekSteps = getValue("customUserSeekSteps", []);
          this.settings.showCommentsSection = getValue("showCommentsSection", true);
          this.settings.enabledCommentSources = getValue("enabledCommentSources", {
            "jable": true,
            "javdb": true,
            "javlibrary": false
          });
          this.settings.debugMode = getValue("debugMode", false);
          this.settings.sidebarPosition = getValue("sidebarPosition", "right");
          this.settings.sidebarHidden = getValue("sidebarHidden", false);
        } catch (r) {}
      }
    }, {
      "key": "saveSettings",
      "value": function saveSettings() {
        try {
          setValue("showProgressBar", this.settings.showProgressBar);
          setValue("showSeekControlRow", this.settings.showSeekControlRow);
          setValue("showLoopControlRow", this.settings.showLoopControlRow);
          setValue("showPlaybackControlRow", this.settings.showPlaybackControlRow);
          setValue("enabledSeekSteps", this.settings.enabledSeekSteps);
          setValue("customUserSeekSteps", this.settings.customUserSeekSteps);
          setValue("showCommentsSection", this.settings.showCommentsSection);
          setValue("enabledCommentSources", this.settings.enabledCommentSources);
          setValue("debugMode", this.settings.debugMode);
          setValue("sidebarPosition", this.settings.sidebarPosition);
          setValue("sidebarHidden", this.settings.sidebarHidden);
        } catch (r) {}
      }
    }, {
      "key": "updateSetting",
      "value": function updateSetting(r, o) {
        if (r in this.settings) {
          this.settings[r] = o;
          this.saveSettings();
        }
      }
    } ]);
  }();
  function LoginManager_typeof(r) {
    "@babel/helpers - typeof";
    return LoginManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, LoginManager_typeof(r);
  }
  function LoginManager_createForOfIteratorHelper(r, o) {
    var a = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!a) {
      if (Array.isArray(r) || (a = LoginManager_unsupportedIterableToArray(r)) || o && r && "number" == typeof r.length) {
        a && (r = a);
        var l = 0, u = function F() {};
        return {
          "s": u,
          "n": function n() {
            return l >= r.length ? {
              "done": !0
            } : {
              "done": !1,
              "value": r[l++]
            };
          },
          "e": function e(r) {
            throw r;
          },
          "f": u
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var p, v = !0, b = !1;
    return {
      "s": function s() {
        a = a.call(r);
      },
      "n": function n() {
        var r = a.next();
        return v = r.done, r;
      },
      "e": function e(r) {
        b = !0, p = r;
      },
      "f": function f() {
        try {
          v || null == a["return"] || a["return"]();
        } finally {
          if (b) {
            throw p;
          }
        }
      }
    };
  }
  function LoginManager_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return LoginManager_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? LoginManager_arrayLikeToArray(r, o) : void 0;
    }
  }
  function LoginManager_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function LoginManager_regeneratorRuntime() {
    "use strict";
    LoginManager_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == LoginManager_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(LoginManager_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function LoginManager_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function LoginManager_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          LoginManager_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          LoginManager_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function LoginManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function LoginManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, LoginManager_toPropertyKey(l.key), l);
    }
  }
  function LoginManager_createClass(r, o, a) {
    return o && LoginManager_defineProperties(r.prototype, o), a && LoginManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function LoginManager_toPropertyKey(r) {
    var o = LoginManager_toPrimitive(r, "string");
    return "symbol" == LoginManager_typeof(o) ? o : o + "";
  }
  function LoginManager_toPrimitive(r, o) {
    if ("object" != LoginManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != LoginManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var qe = 30 * 60 * 1e3;
  var Ue = 3;
  var We = function() {
    function LoginManager() {
      LoginManager_classCallCheck(this, LoginManager);
      this.userEmail = "";
      this.userPassword = "";
      this.autoLogin = true;
      this.providers = [ new ee, new Z ];
      this.activeProvider = null;
    }
    return LoginManager_createClass(LoginManager, [ {
      "key": "init",
      "value": function() {
        var r = LoginManager_asyncToGenerator(LoginManager_regeneratorRuntime().mark((function _callee() {
          var r;
          return LoginManager_regeneratorRuntime().wrap((function _callee$(o) {
            while (1) {
              switch (o.prev = o.next) {
               case 0:
                this.activeProvider = this.getMatchingProvider();
                if (this.activeProvider) {
                  o.next = 3;
                  break;
                }
                return o.abrupt("return");

               case 3:
                this.loadLoginInfo();
                this.startKeepAliveLoop();
                r = this.activeProvider.addAutoLoginOption(this.handleLoginInfoChange.bind(this))["catch"]((function(r) {
                  return;
                }));
                o.next = 8;
                return this.checkLoginAndAutoLogin();

               case 8:
                o.next = 10;
                return r;

               case 10:
               case "end":
                return o.stop();
              }
            }
          }), _callee, this);
        })));
        function init() {
          return r.apply(this, arguments);
        }
        return init;
      }()
    }, {
      "key": "handleLoginInfoChange",
      "value": function handleLoginInfoChange(r) {
        if (!this.activeProvider) {
          return;
        }
        var o = this.activeProvider.siteKey;
        var a = $.get(o);
        var l = r.email !== void 0 ? r.email : a.email;
        var u = r.password !== void 0 ? r.password : a.password;
        var p = r.autoLogin !== void 0 ? r.autoLogin : a.autoLogin;
        this.userEmail = l;
        this.userPassword = u;
        this.autoLogin = p;
        $.save(o, l, u, p);
        this.resetCircuitBreaker(o);
      }
    }, {
      "key": "loadLoginInfo",
      "value": function loadLoginInfo() {
        if (!this.activeProvider) {
          return;
        }
        var r = this.activeProvider.siteKey;
        var o = $.get(r);
        this.userEmail = o.email;
        this.userPassword = o.password;
        this.autoLogin = o.autoLogin;
      }
    }, {
      "key": "getMatchingProvider",
      "value": function getMatchingProvider() {
        var r = LoginManager_createForOfIteratorHelper(this.providers), o;
        try {
          for (r.s(); !(o = r.n()).done; ) {
            var a = o.value;
            if (a.isSupportedSite()) {
              return a;
            }
          }
        } catch (o) {
          r.e(o);
        } finally {
          r.f();
        }
        return null;
      }
    }, {
      "key": "checkLoginAndAutoLogin",
      "value": function() {
        var r = LoginManager_asyncToGenerator(LoginManager_regeneratorRuntime().mark((function _callee2() {
          var r, o, a, l, u, p;
          return LoginManager_regeneratorRuntime().wrap((function _callee2$(v) {
            while (1) {
              switch (v.prev = v.next) {
               case 0:
                if (this.activeProvider) {
                  v.next = 2;
                  break;
                }
                return v.abrupt("return");

               case 2:
                r = this.activeProvider.siteKey;
                o = "mp_autologin_attempt_".concat(r);
                a = 1;
                v.prev = 5;
                v.next = 8;
                return this.activeProvider.checkLoginStatus();

               case 8:
                l = v.sent;
                if (!l) {
                  v.next = 13;
                  break;
                }
                this.resetCircuitBreaker(r);
                try {
                  sessionStorage.removeItem(o);
                } catch (r) {}
                return v.abrupt("return");

               case 13:
                if (!(this.autoLogin && this.userEmail && this.userPassword)) {
                  v.next = 27;
                  break;
                }
                if (!this.isCircuitBroken(r)) {
                  v.next = 16;
                  break;
                }
                return v.abrupt("return");

               case 16:
                u = 0;
                try {
                  u = parseInt(sessionStorage.getItem(o) || "0", 10);
                } catch (r) {}
                if (!(u >= a)) {
                  v.next = 20;
                  break;
                }
                return v.abrupt("return");

               case 20:
                try {
                  sessionStorage.setItem(o, String(u + 1));
                } catch (r) {}
                v.next = 23;
                return this.activeProvider.login(this.userEmail, this.userPassword, {
                  "silent": true
                });

               case 23:
                p = v.sent;
                if (p) {
                  this.resetCircuitBreaker(r);
                  try {
                    sessionStorage.removeItem(o);
                  } catch (r) {}
                } else {
                  this.recordFailure(r);
                }
                v.next = 27;
                break;

               case 27:
                v.next = 32;
                break;

               case 29:
                v.prev = 29;
                v.t0 = v["catch"](5);
                this.recordFailure(r);

               case 32:
               case "end":
                return v.stop();
              }
            }
          }), _callee2, this, [ [ 5, 29 ] ]);
        })));
        function checkLoginAndAutoLogin() {
          return r.apply(this, arguments);
        }
        return checkLoginAndAutoLogin;
      }()
    }, {
      "key": "isCircuitBroken",
      "value": function isCircuitBroken(r) {
        var o = getLocalStorage("mp_circuit_fail_".concat(r), 0);
        var a = getLocalStorage("mp_circuit_last_fail_".concat(r), 0);
        if (o >= Ue) {
          var l = Date.now() - a;
          if (l < qe) {
            return true;
          }
          setLocalStorage("mp_circuit_fail_".concat(r), Ue - 1);
        }
        return false;
      }
    }, {
      "key": "recordFailure",
      "value": function recordFailure(r) {
        var o = getLocalStorage("mp_circuit_fail_".concat(r), 0) + 1;
        setLocalStorage("mp_circuit_fail_".concat(r), o);
        setLocalStorage("mp_circuit_last_fail_".concat(r), Date.now());
        if (o >= Ue) {}
      }
    }, {
      "key": "resetCircuitBreaker",
      "value": function resetCircuitBreaker(r) {
        try {
          localStorage.removeItem("mp_circuit_fail_".concat(r));
          localStorage.removeItem("mp_circuit_last_fail_".concat(r));
        } catch (r) {}
      }
    }, {
      "key": "login",
      "value": function() {
        var r = LoginManager_asyncToGenerator(LoginManager_regeneratorRuntime().mark((function _callee3(r, o) {
          return LoginManager_regeneratorRuntime().wrap((function _callee3$(a) {
            while (1) {
              switch (a.prev = a.next) {
               case 0:
                if (this.activeProvider) {
                  a.next = 2;
                  break;
                }
                return a.abrupt("return", false);

               case 2:
                this.handleLoginInfoChange({
                  "email": r,
                  "password": o
                });
                a.next = 5;
                return this.activeProvider.login(r, o);

               case 5:
                return a.abrupt("return", a.sent);

               case 6:
               case "end":
                return a.stop();
              }
            }
          }), _callee3, this);
        })));
        function login(o, a) {
          return r.apply(this, arguments);
        }
        return login;
      }()
    }, {
      "key": "startKeepAliveLoop",
      "value": function startKeepAliveLoop() {
        var r = this;
        var o = 10 * 60 * 1e3;
        setTimeout((function() {
          r.runKeepAlive();
        }), 3e4);
        setInterval((function() {
          r.runKeepAlive();
        }), o);
      }
    }, {
      "key": "runKeepAlive",
      "value": function() {
        var r = LoginManager_asyncToGenerator(LoginManager_regeneratorRuntime().mark((function _callee4() {
          var r, o, a, l;
          return LoginManager_regeneratorRuntime().wrap((function _callee4$(u) {
            while (1) {
              switch (u.prev = u.next) {
               case 0:
                r = LoginManager_createForOfIteratorHelper(this.providers);
                u.prev = 1;
                r.s();

               case 3:
                if ((o = r.n()).done) {
                  u.next = 19;
                  break;
                }
                a = o.value;
                l = a.siteKey;
                if (!this.isCircuitBroken(l)) {
                  u.next = 8;
                  break;
                }
                return u.abrupt("continue", 17);

               case 8:
                u.prev = 8;
                if (!(typeof a.keepAlive === "function")) {
                  u.next = 12;
                  break;
                }
                u.next = 12;
                return a.keepAlive();

               case 12:
                u.next = 17;
                break;

               case 14:
                u.prev = 14;
                u.t0 = u["catch"](8);
                this.recordFailure(l);

               case 17:
                u.next = 3;
                break;

               case 19:
                u.next = 24;
                break;

               case 21:
                u.prev = 21;
                u.t1 = u["catch"](1);
                r.e(u.t1);

               case 24:
                u.prev = 24;
                r.f();
                return u.finish(24);

               case 27:
               case "end":
                return u.stop();
              }
            }
          }), _callee4, this, [ [ 1, 21, 24, 27 ], [ 8, 14 ] ]);
        })));
        function runKeepAlive() {
          return r.apply(this, arguments);
        }
        return runKeepAlive;
      }()
    } ]);
  }();
  function autologin_typeof(r) {
    "@babel/helpers - typeof";
    return autologin_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, autologin_typeof(r);
  }
  function autologin_regeneratorRuntime() {
    "use strict";
    autologin_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == autologin_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(autologin_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function autologin_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function autologin_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          autologin_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          autologin_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  function initAutoLogin() {
    return _initAutoLogin.apply(this, arguments);
  }
  function _initAutoLogin() {
    _initAutoLogin = autologin_asyncToGenerator(autologin_regeneratorRuntime().mark((function _callee() {
      var r;
      return autologin_regeneratorRuntime().wrap((function _callee$(o) {
        while (1) {
          switch (o.prev = o.next) {
           case 0:
            o.prev = 0;
            r = new We;
            o.next = 4;
            return r.init();

           case 4:
            return o.abrupt("return", r);

           case 7:
            o.prev = 7;
            o.t0 = o["catch"](0);
            return o.abrupt("return", null);

           case 10:
           case "end":
            return o.stop();
          }
        }
      }), _callee, null, [ [ 0, 7 ] ]);
    })));
    return _initAutoLogin.apply(this, arguments);
  }
  function AdBlockConfig_typeof(r) {
    "@babel/helpers - typeof";
    return AdBlockConfig_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, AdBlockConfig_typeof(r);
  }
  function AdBlockConfig_createForOfIteratorHelper(r, o) {
    var a = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!a) {
      if (Array.isArray(r) || (a = AdBlockConfig_unsupportedIterableToArray(r)) || o && r && "number" == typeof r.length) {
        a && (r = a);
        var l = 0, u = function F() {};
        return {
          "s": u,
          "n": function n() {
            return l >= r.length ? {
              "done": !0
            } : {
              "done": !1,
              "value": r[l++]
            };
          },
          "e": function e(r) {
            throw r;
          },
          "f": u
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var p, v = !0, b = !1;
    return {
      "s": function s() {
        a = a.call(r);
      },
      "n": function n() {
        var r = a.next();
        return v = r.done, r;
      },
      "e": function e(r) {
        b = !0, p = r;
      },
      "f": function f() {
        try {
          v || null == a["return"] || a["return"]();
        } finally {
          if (b) {
            throw p;
          }
        }
      }
    };
  }
  function AdBlockConfig_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return AdBlockConfig_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? AdBlockConfig_arrayLikeToArray(r, o) : void 0;
    }
  }
  function AdBlockConfig_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function AdBlockConfig_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function AdBlockConfig_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, AdBlockConfig_toPropertyKey(l.key), l);
    }
  }
  function AdBlockConfig_createClass(r, o, a) {
    return o && AdBlockConfig_defineProperties(r.prototype, o), a && AdBlockConfig_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function AdBlockConfig_toPropertyKey(r) {
    var o = AdBlockConfig_toPrimitive(r, "string");
    return "symbol" == AdBlockConfig_typeof(o) ? o : o + "";
  }
  function AdBlockConfig_toPrimitive(r, o) {
    if ("object" != AdBlockConfig_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != AdBlockConfig_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Ye = function() {
    function AdBlockConfig() {
      var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      AdBlockConfig_classCallCheck(this, AdBlockConfig);
      this.adSelectors = r.adSelectors || [];
      this.customStyles = r.customStyles || [];
      this.blockedUrlPatternsSet = new Set(r.blockedUrlPatterns || []);
      this.adKeywordsRegex = /ads|analytics|tracker|affiliate|stat|pixel|banner|pop|click|outstream\.video|vast|vmap|preroll|midroll|postroll|adserve/i;
    }
    return AdBlockConfig_createClass(AdBlockConfig, [ {
      "key": "isEmpty",
      "value": function isEmpty() {
        return this.adSelectors.length === 0 && this.customStyles.length === 0 && this.blockedUrlPatternsSet.size === 0;
      }
    }, {
      "key": "shouldBlockUrl",
      "value": function shouldBlockUrl(r) {
        if (!r || typeof r !== "string") {
          return false;
        }
        if (this.adKeywordsRegex.test(r)) {
          return true;
        }
        var o = AdBlockConfig_createForOfIteratorHelper(this.blockedUrlPatternsSet), a;
        try {
          for (o.s(); !(a = o.n()).done; ) {
            var l = a.value;
            if (r.includes(l)) {
              return true;
            }
          }
        } catch (r) {
          o.e(r);
        } finally {
          o.f();
        }
        return false;
      }
    } ]);
  }();
  const Ke = Ye;
  function StyleManager_typeof(r) {
    "@babel/helpers - typeof";
    return StyleManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, StyleManager_typeof(r);
  }
  function StyleManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function StyleManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, StyleManager_toPropertyKey(l.key), l);
    }
  }
  function StyleManager_createClass(r, o, a) {
    return o && StyleManager_defineProperties(r.prototype, o), a && StyleManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function StyleManager_toPropertyKey(r) {
    var o = StyleManager_toPrimitive(r, "string");
    return "symbol" == StyleManager_typeof(o) ? o : o + "";
  }
  function StyleManager_toPrimitive(r, o) {
    if ("object" != StyleManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != StyleManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Xe = function() {
    function StyleManager(r) {
      StyleManager_classCallCheck(this, StyleManager);
      this.config = r;
    }
    return StyleManager_createClass(StyleManager, [ {
      "key": "applyAdBlockStyles",
      "value": function applyAdBlockStyles() {
        if (this.config.adSelectors.length === 0 && this.config.customStyles.length === 0) {
          return;
        }
        var r = document.createElement("style");
        r.id = "adblock-styles";
        r.type = "text/css";
        var o = "";
        if (this.config.adSelectors.length > 0) {
          o += this.config.adSelectors.join(", ") + " { display: none !important; visibility: hidden !important; height: 0 !important; min-height: 0 !important; }";
        }
        if (this.config.customStyles.length > 0) {
          o += "\n" + this.config.customStyles.map((function(r) {
            return "".concat(r.selector, " { ").concat(r.styles, " }");
          })).join("\n");
        }
        r.textContent = o;
        document.head.appendChild(r);
      }
    } ]);
  }();
  const $e = Xe;
  function DOMCleaner_typeof(r) {
    "@babel/helpers - typeof";
    return DOMCleaner_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, DOMCleaner_typeof(r);
  }
  function DOMCleaner_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function DOMCleaner_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, DOMCleaner_toPropertyKey(l.key), l);
    }
  }
  function DOMCleaner_createClass(r, o, a) {
    return o && DOMCleaner_defineProperties(r.prototype, o), a && DOMCleaner_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function DOMCleaner_toPropertyKey(r) {
    var o = DOMCleaner_toPrimitive(r, "string");
    return "symbol" == DOMCleaner_typeof(o) ? o : o + "";
  }
  function DOMCleaner_toPrimitive(r, o) {
    if ("object" != DOMCleaner_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != DOMCleaner_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var Qe = function() {
    function DOMCleaner(r) {
      DOMCleaner_classCallCheck(this, DOMCleaner);
      this.config = r;
      this.observer = null;
    }
    return DOMCleaner_createClass(DOMCleaner, [ {
      "key": "cleanIframes",
      "value": function cleanIframes() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        var o = r || document.getElementsByTagName("iframe");
        for (var a = 0; a < o.length; a++) {
          var l = o[a];
          if (l.src && !l.src.includes("plyr.io")) {
            l.remove();
          }
        }
      }
    }, {
      "key": "removeAdElements",
      "value": function removeAdElements() {
        var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (this.config.adSelectors.length === 0) {
          return;
        }
        for (var o = 0; o < this.config.adSelectors.length; o++) {
          try {
            var a = document.querySelectorAll(this.config.adSelectors[o]);
            for (var l = 0; l < a.length; l++) {
              a[l].remove();
            }
          } catch (r) {}
        }
      }
    }, {
      "key": "observeDOMChanges",
      "value": function observeDOMChanges() {
        var r = this;
        if (this.observer) {
          return;
        }
        var o = false;
        var a = false;
        var l = null;
        var u = function processChanges() {
          if (o) {
            r.removeAdElements();
            o = false;
          }
          if (a) {
            r.cleanIframes();
            a = false;
          }
          l = null;
        };
        this.observer = new MutationObserver((function(r) {
          var p = false;
          var v = false;
          for (var b = 0; b < r.length; b++) {
            var y = r[b];
            if (y.addedNodes.length) {
              p = true;
              for (var C = 0; C < y.addedNodes.length; C++) {
                var k = y.addedNodes[C];
                if (k.nodeName === "IFRAME") {
                  v = true;
                  break;
                }
              }
            }
            if (p && v) {
              break;
            }
          }
          if (p) {
            o = true;
          }
          if (v) {
            a = true;
          }
          if ((o || a) && !l) {
            l = setTimeout(u, 50);
          }
        }));
        this.observer.observe(document.documentElement, {
          "childList": true,
          "subtree": true
        });
      }
    }, {
      "key": "disconnect",
      "value": function disconnect() {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
      }
    } ]);
  }();
  const Ze = Qe;
  function RequestBlocker_typeof(r) {
    "@babel/helpers - typeof";
    return RequestBlocker_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, RequestBlocker_typeof(r);
  }
  function RequestBlocker_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function RequestBlocker_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, RequestBlocker_toPropertyKey(l.key), l);
    }
  }
  function RequestBlocker_createClass(r, o, a) {
    return o && RequestBlocker_defineProperties(r.prototype, o), a && RequestBlocker_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function RequestBlocker_toPropertyKey(r) {
    var o = RequestBlocker_toPrimitive(r, "string");
    return "symbol" == RequestBlocker_typeof(o) ? o : o + "";
  }
  function RequestBlocker_toPrimitive(r, o) {
    if ("object" != RequestBlocker_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != RequestBlocker_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var et = function() {
    function RequestBlocker(r) {
      RequestBlocker_classCallCheck(this, RequestBlocker);
      this.config = r;
    }
    return RequestBlocker_createClass(RequestBlocker, [ {
      "key": "blockTrackingRequests",
      "value": function blockTrackingRequests() {
        var r = XMLHttpRequest.prototype.open;
        var o = this.config;
        XMLHttpRequest.prototype.open = function(a, l) {
          if (typeof l === "string" && o.shouldBlockUrl(l)) {
            this.send = function() {};
            this.onload = null;
            this.onerror = null;
            return;
          }
          return r.apply(this, arguments);
        };
        var a = window.fetch;
        window.fetch = function(r, l) {
          var u = r;
          if (r instanceof Request) {
            u = r.url;
          }
          if (typeof u === "string" && o.shouldBlockUrl(u)) {
            return Promise.resolve(new Response("", {
              "status": 200,
              "headers": {
                "Content-Type": "text/plain"
              }
            }));
          }
          return a.apply(this, arguments);
        };
      }
    }, {
      "key": "blockIframeLoading",
      "value": function blockIframeLoading() {
        var r = document.createElement;
        var o = this.config;
        document.createElement = function(a) {
          var l = r.call(document, a);
          if (a.toLowerCase() === "iframe") {
            var u = l.src;
            Object.defineProperty(l, "src", {
              "set": function set(r) {
                if (typeof r === "string" && o.shouldBlockUrl(r)) {
                  return;
                }
                u = r;
              },
              "get": function get() {
                return u;
              }
            });
            var p = l.setAttribute;
            l.setAttribute = function(r, a) {
              if (r === "src" && typeof a === "string" && o.shouldBlockUrl(a)) {
                return;
              }
              return p.call(this, r, a);
            };
          }
          return l;
        };
      }
    }, {
      "key": "blockPopups",
      "value": function blockPopups() {
        window.open = function() {
          return null;
        };
        if (typeof unsafeWindow !== "undefined") {
          unsafeWindow.open = function() {
            return null;
          };
        }
      }
    }, {
      "key": "init",
      "value": function init() {
        this.blockIframeLoading();
        this.blockTrackingRequests();
        this.blockPopups();
      }
    } ]);
  }();
  const tt = et;
  var nt = [ 'div[class="space-y-6 mb-6"]', 'div[class*="root--"][class*="bottomRight--"]', 'div[class="grid md:grid-cols-2 gap-8"]', 'ul[class="mb-4 list-none text-nord14 grid grid-cols-2 gap-2"]', 'div[class="space-y-5 mb-5"]', 'iframe[src*="ads"]', 'iframe[src*="banner"]', 'iframe[src*="pop"]', "iframe[data-ad]", 'iframe[id*="ads"]', 'iframe[class*="ads"]', 'iframe:not([src*="plyr.io"])' ];
  var rt = [ {
    "selector": 'div[class="my-2 text-sm text-nord4 truncate"]',
    "styles": "white-space: normal !important;"
  }, {
    "selector": "body",
    "styles": "background-color: #000000 !important;"
  }, {
    "selector": 'div[class*="z-max"]',
    "styles": "z-index: 9000 !important;"
  } ];
  var ot = [ "exoclick.com", "juicyads.com", "popads.net", "adsterra.com", "trafficjunky.com", "adnium.com", "ad-maven.com", "browser-update.org", "mopvip.icu", "toppages.pw", "cpmstar.com", "propellerads.com", "tsyndicate.com", "syndication.exosrv.com", "ads.exosrv.com", "tsyndicate.com/sdk", "cdn.tsyndicate.com", "adsco.re", "adscpm.site", "a-ads.com", "ad-delivery.net", "outbrain.com", "taboola.com", "mgid.com", "revcontent.com", "adnxs.com", "pubmatic.com", "rubiconproject.com", "openx.net", "criteo.com", "doubleclick.net" ];
  const at = {
    "adSelectors": nt,
    "customStyles": rt,
    "blockedUrlPatterns": ot,
    "isVideoSite": true,
    "domains": getSiteDomains("MISSAV")
  };
  function adblock_typeof(r) {
    "@babel/helpers - typeof";
    return adblock_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, adblock_typeof(r);
  }
  function adblock_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function adblock_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, adblock_toPropertyKey(l.key), l);
    }
  }
  function adblock_createClass(r, o, a) {
    return o && adblock_defineProperties(r.prototype, o), a && adblock_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function adblock_toPropertyKey(r) {
    var o = adblock_toPrimitive(r, "string");
    return "symbol" == adblock_typeof(o) ? o : o + "";
  }
  function adblock_toPrimitive(r, o) {
    if ("object" != adblock_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != adblock_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var it = function() {
    function AdBlocker() {
      adblock_classCallCheck(this, AdBlocker);
      var r = /^https?:\/\/(www\.)?(missav|thisav)\.(com|ws|ai)/.test(window.location.href);
      var o = r ? at : {};
      this.config = new Ke(o);
      this.styleManager = new $e(this.config);
      this.domCleaner = new Ze(this.config);
      this.requestBlocker = new tt(this.config);
    }
    return adblock_createClass(AdBlocker, [ {
      "key": "preventDetection",
      "value": function preventDetection() {
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
    }, {
      "key": "setupPeriodicCleaning",
      "value": function setupPeriodicCleaning() {
        var r = this;
        this.domCleaner.removeAdElements(true);
        this.domCleaner.observeDOMChanges();
        setInterval((function() {
          return r.domCleaner.removeAdElements();
        }), 2e3);
      }
    }, {
      "key": "init",
      "value": function init() {
        var r = this;
        if (this.config.isEmpty()) {
          return;
        }
        this.preventDetection();
        this.styleManager.applyAdBlockStyles();
        this.requestBlocker.init();
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", (function() {
            return r.setupPeriodicCleaning();
          }));
        } else {
          this.setupPeriodicCleaning();
        }
      }
    } ]);
  }();
  const st = it;
  function DetailExpander_typeof(r) {
    "@babel/helpers - typeof";
    return DetailExpander_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, DetailExpander_typeof(r);
  }
  function DetailExpander_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function DetailExpander_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, DetailExpander_toPropertyKey(l.key), l);
    }
  }
  function DetailExpander_createClass(r, o, a) {
    return o && DetailExpander_defineProperties(r.prototype, o), a && DetailExpander_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function DetailExpander_toPropertyKey(r) {
    var o = DetailExpander_toPrimitive(r, "string");
    return "symbol" == DetailExpander_typeof(o) ? o : o + "";
  }
  function DetailExpander_toPrimitive(r, o) {
    if ("object" != DetailExpander_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != DetailExpander_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var lt = function() {
    function DetailExpander() {
      DetailExpander_classCallCheck(this, DetailExpander);
      this.maxAttempts = 3;
      this.attemptInterval = 1e3;
    }
    return DetailExpander_createClass(DetailExpander, [ {
      "key": "SHOW_MORE_SELECTOR",
      "get": function get() {
        return "a.text-nord13.font-medium.flex.items-center";
      }
    }, {
      "key": "autoExpandDetails",
      "value": function autoExpandDetails() {
        var r = this;
        this.expandDetailsSingle();
        var o = 0;
        var a = setInterval((function() {
          if (r.expandDetailsSingle() || ++o >= r.maxAttempts) {
            clearInterval(a);
          }
        }), this.attemptInterval);
      }
    }, {
      "key": "expandDetailsSingle",
      "value": function expandDetailsSingle() {
        try {
          var r = document.querySelector(this.SHOW_MORE_SELECTOR);
          if (r) {
            r.click();
            return true;
          }
        } catch (r) {}
        return false;
      }
    } ]);
  }();
  function QualityManager_typeof(r) {
    "@babel/helpers - typeof";
    return QualityManager_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, QualityManager_typeof(r);
  }
  function QualityManager_toConsumableArray(r) {
    return QualityManager_arrayWithoutHoles(r) || QualityManager_iterableToArray(r) || QualityManager_unsupportedIterableToArray(r) || QualityManager_nonIterableSpread();
  }
  function QualityManager_nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function QualityManager_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return QualityManager_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? QualityManager_arrayLikeToArray(r, o) : void 0;
    }
  }
  function QualityManager_iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) {
      return Array.from(r);
    }
  }
  function QualityManager_arrayWithoutHoles(r) {
    if (Array.isArray(r)) {
      return QualityManager_arrayLikeToArray(r);
    }
  }
  function QualityManager_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function QualityManager_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function QualityManager_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, QualityManager_toPropertyKey(l.key), l);
    }
  }
  function QualityManager_createClass(r, o, a) {
    return o && QualityManager_defineProperties(r.prototype, o), a && QualityManager_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function QualityManager_toPropertyKey(r) {
    var o = QualityManager_toPrimitive(r, "string");
    return "symbol" == QualityManager_typeof(o) ? o : o + "";
  }
  function QualityManager_toPrimitive(r, o) {
    if ("object" != QualityManager_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != QualityManager_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var ct = function() {
    function QualityManager() {
      QualityManager_classCallCheck(this, QualityManager);
      this.maxAttempts = 20;
      this.attemptInterval = 500;
    }
    return QualityManager_createClass(QualityManager, [ {
      "key": "setupAutoHighestQuality",
      "value": function setupAutoHighestQuality() {
        var r = this;
        if (this.setHighestQualitySingle()) {
          return;
        }
        var o = 0;
        var a = setInterval((function() {
          if (r.setHighestQualitySingle() || ++o >= r.maxAttempts) {
            clearInterval(a);
          }
        }), this.attemptInterval);
        window.addEventListener("load", (function() {
          return r.setHighestQualitySingle();
        }));
      }
    }, {
      "key": "setHighestQualitySingle",
      "value": function setHighestQualitySingle() {
        try {
          var r = window.player || (typeof unsafeWindow !== "undefined" ? unsafeWindow.player : null);
          if (!r || !r.config || !r.config.quality || !r.config.quality.options || !r.config.quality.options.length) {
            return false;
          }
          var o = Math.max.apply(Math, QualityManager_toConsumableArray(r.config.quality.options));
          r.quality = o;
          r.config.quality.selected = o;
          if (typeof r.quality === "function") {
            r.quality(o);
          }
          return true;
        } catch (r) {
          return false;
        }
      }
    } ]);
  }();
  function UrlRedirector_typeof(r) {
    "@babel/helpers - typeof";
    return UrlRedirector_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, UrlRedirector_typeof(r);
  }
  function UrlRedirector_createForOfIteratorHelper(r, o) {
    var a = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!a) {
      if (Array.isArray(r) || (a = UrlRedirector_unsupportedIterableToArray(r)) || o && r && "number" == typeof r.length) {
        a && (r = a);
        var l = 0, u = function F() {};
        return {
          "s": u,
          "n": function n() {
            return l >= r.length ? {
              "done": !0
            } : {
              "done": !1,
              "value": r[l++]
            };
          },
          "e": function e(r) {
            throw r;
          },
          "f": u
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var p, v = !0, b = !1;
    return {
      "s": function s() {
        a = a.call(r);
      },
      "n": function n() {
        var r = a.next();
        return v = r.done, r;
      },
      "e": function e(r) {
        b = !0, p = r;
      },
      "f": function f() {
        try {
          v || null == a["return"] || a["return"]();
        } finally {
          if (b) {
            throw p;
          }
        }
      }
    };
  }
  function UrlRedirector_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return UrlRedirector_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? UrlRedirector_arrayLikeToArray(r, o) : void 0;
    }
  }
  function UrlRedirector_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function UrlRedirector_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function UrlRedirector_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, UrlRedirector_toPropertyKey(l.key), l);
    }
  }
  function UrlRedirector_createClass(r, o, a) {
    return o && UrlRedirector_defineProperties(r.prototype, o), a && UrlRedirector_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function UrlRedirector_toPropertyKey(r) {
    var o = UrlRedirector_toPrimitive(r, "string");
    return "symbol" == UrlRedirector_typeof(o) ? o : o + "";
  }
  function UrlRedirector_toPrimitive(r, o) {
    if ("object" != UrlRedirector_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != UrlRedirector_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var ut = function() {
    function UrlRedirector() {
      UrlRedirector_classCallCheck(this, UrlRedirector);
      var r = v.MISSAV.primary;
      var o = v.MISSAV.backups;
      this.redirectRules = [];
      var a = UrlRedirector_createForOfIteratorHelper(o), l;
      try {
        for (a.s(); !(l = a.n()).done; ) {
          var u = l.value;
          var p = u.replace(/\./g, "\\.");
          this.redirectRules.push({
            "pattern": new RegExp("^https?:\\/\\/(www\\.)?".concat(p, "\\/?"), "i"),
            "targetDomain": r,
            "backupDomain": u
          });
        }
      } catch (r) {
        a.e(r);
      } finally {
        a.f();
      }
      this.immediateRedirect();
    }
    return UrlRedirector_createClass(UrlRedirector, [ {
      "key": "immediateRedirect",
      "value": function immediateRedirect() {
        this.checkAndRedirect();
      }
    }, {
      "key": "checkAndRedirect",
      "value": function checkAndRedirect() {
        var r = window.location.href;
        var o = UrlRedirector_createForOfIteratorHelper(this.redirectRules), a;
        try {
          for (o.s(); !(a = o.n()).done; ) {
            var l = a.value;
            if (l.pattern.test(r)) {
              var u = this.applyRedirect(r, l);
              if (u !== r) {
                window.location.replace(u);
                return true;
              }
            }
          }
        } catch (r) {
          o.e(r);
        } finally {
          o.f();
        }
        return false;
      }
    }, {
      "key": "applyRedirect",
      "value": function applyRedirect(r, o) {
        if (o.targetDomain && o.backupDomain) {
          var a = o.backupDomain.replace(/\./g, "\\.");
          var l = new RegExp("^(https?:\\/\\/)(www\\.)?".concat(a, "\\/?"), "i");
          return r.replace(l, "$1".concat(o.targetDomain, "/"));
        }
        return r;
      }
    } ]);
  }();
  function userExperienceEnhancer_typeof(r) {
    "@babel/helpers - typeof";
    return userExperienceEnhancer_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, userExperienceEnhancer_typeof(r);
  }
  function userExperienceEnhancer_classCallCheck(r, o) {
    if (!(r instanceof o)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function userExperienceEnhancer_defineProperties(r, o) {
    for (var a = 0; a < o.length; a++) {
      var l = o[a];
      l.enumerable = l.enumerable || !1, l.configurable = !0, "value" in l && (l.writable = !0), 
      Object.defineProperty(r, userExperienceEnhancer_toPropertyKey(l.key), l);
    }
  }
  function userExperienceEnhancer_createClass(r, o, a) {
    return o && userExperienceEnhancer_defineProperties(r.prototype, o), a && userExperienceEnhancer_defineProperties(r, a), 
    Object.defineProperty(r, "prototype", {
      "writable": !1
    }), r;
  }
  function userExperienceEnhancer_toPropertyKey(r) {
    var o = userExperienceEnhancer_toPrimitive(r, "string");
    return "symbol" == userExperienceEnhancer_typeof(o) ? o : o + "";
  }
  function userExperienceEnhancer_toPrimitive(r, o) {
    if ("object" != userExperienceEnhancer_typeof(r) || !r) {
      return r;
    }
    var a = r[Symbol.toPrimitive];
    if (void 0 !== a) {
      var l = a.call(r, o || "default");
      if ("object" != userExperienceEnhancer_typeof(l)) {
        return l;
      }
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === o ? String : Number)(r);
  }
  var dt = new ut;
  var mt = function() {
    function UserExperienceEnhancer() {
      userExperienceEnhancer_classCallCheck(this, UserExperienceEnhancer);
      this.detailExpander = new lt;
      this.qualityManager = new ct;
      this.urlRedirector = dt;
    }
    return userExperienceEnhancer_createClass(UserExperienceEnhancer, [ {
      "key": "init",
      "value": function init() {
        var r = this;
        var o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        if (!o) {
          if (this.urlRedirector.checkAndRedirect()) {
            return;
          }
        }
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", (function() {
            r.initFeatures();
          }));
        } else {
          this.initFeatures();
        }
      }
    }, {
      "key": "initFeatures",
      "value": function initFeatures() {
        try {
          this.detailExpander.autoExpandDetails();
          this.qualityManager.setupAutoHighestQuality();
        } catch (r) {}
      }
    } ]);
  }();
  function initUserExperienceEnhancer() {
    var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
    var o = new mt;
    o.init(r);
    return o;
  }
  function src_typeof(r) {
    "@babel/helpers - typeof";
    return src_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(r) {
      return typeof r;
    } : function(r) {
      return r && "function" == typeof Symbol && r.constructor === Symbol && r !== Symbol.prototype ? "symbol" : typeof r;
    }, src_typeof(r);
  }
  function src_regeneratorRuntime() {
    "use strict";
    src_regeneratorRuntime = function _regeneratorRuntime() {
      return o;
    };
    var r, o = {}, a = Object.prototype, l = a.hasOwnProperty, u = "function" == typeof Symbol ? Symbol : {}, p = u.iterator || "@@iterator", v = u.asyncIterator || "@@asyncIterator", b = u.toStringTag || "@@toStringTag";
    function c(r, o, a, l) {
      return Object.defineProperty(r, o, {
        "value": a,
        "enumerable": !l,
        "configurable": !l,
        "writable": !l
      });
    }
    try {
      c({}, "");
    } catch (r) {
      c = function c(r, o, a) {
        return r[o] = a;
      };
    }
    function h(o, a, l, u) {
      var p = a && a.prototype instanceof Generator ? a : Generator, v = Object.create(p.prototype);
      return c(v, "_invoke", function(o, a, l) {
        var u = 1;
        return function(p, v) {
          if (3 === u) {
            throw Error("Generator is already running");
          }
          if (4 === u) {
            if ("throw" === p) {
              throw v;
            }
            return {
              "value": r,
              "done": !0
            };
          }
          for (l.method = p, l.arg = v; ;) {
            var b = l.delegate;
            if (b) {
              var C = d(b, l);
              if (C) {
                if (C === y) {
                  continue;
                }
                return C;
              }
            }
            if ("next" === l.method) {
              l.sent = l._sent = l.arg;
            } else if ("throw" === l.method) {
              if (1 === u) {
                throw u = 4, l.arg;
              }
              l.dispatchException(l.arg);
            } else {
              "return" === l.method && l.abrupt("return", l.arg);
            }
            u = 3;
            var k = s(o, a, l);
            if ("normal" === k.type) {
              if (u = l.done ? 4 : 2, k.arg === y) {
                continue;
              }
              return {
                "value": k.arg,
                "done": l.done
              };
            }
            "throw" === k.type && (u = 4, l.method = "throw", l.arg = k.arg);
          }
        };
      }(o, l, new Context(u || [])), !0), v;
    }
    function s(r, o, a) {
      try {
        return {
          "type": "normal",
          "arg": r.call(o, a)
        };
      } catch (r) {
        return {
          "type": "throw",
          "arg": r
        };
      }
    }
    o.wrap = h;
    var y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var C = {};
    c(C, p, (function() {
      return this;
    }));
    var k = Object.getPrototypeOf, _ = k && k(k(x([])));
    _ && _ !== a && l.call(_, p) && (C = _);
    var E = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(C);
    function g(r) {
      [ "next", "throw", "return" ].forEach((function(o) {
        c(r, o, (function(r) {
          return this._invoke(o, r);
        }));
      }));
    }
    function AsyncIterator(r, o) {
      function e(a, u, p, v) {
        var b = s(r[a], r, u);
        if ("throw" !== b.type) {
          var y = b.arg, C = y.value;
          return C && "object" == src_typeof(C) && l.call(C, "__await") ? o.resolve(C.__await).then((function(r) {
            e("next", r, p, v);
          }), (function(r) {
            e("throw", r, p, v);
          })) : o.resolve(C).then((function(r) {
            y.value = r, p(y);
          }), (function(r) {
            return e("throw", r, p, v);
          }));
        }
        v(b.arg);
      }
      var a;
      c(this, "_invoke", (function(r, l) {
        function i() {
          return new o((function(o, a) {
            e(r, l, o, a);
          }));
        }
        return a = a ? a.then(i, i) : i();
      }), !0);
    }
    function d(o, a) {
      var l = a.method, u = o.i[l];
      if (u === r) {
        return a.delegate = null, "throw" === l && o.i["return"] && (a.method = "return", 
        a.arg = r, d(o, a), "throw" === a.method) || "return" !== l && (a.method = "throw", 
        a.arg = new TypeError("The iterator does not provide a '" + l + "' method")), y;
      }
      var p = s(u, o.i, a.arg);
      if ("throw" === p.type) {
        return a.method = "throw", a.arg = p.arg, a.delegate = null, y;
      }
      var v = p.arg;
      return v ? v.done ? (a[o.r] = v.value, a.next = o.n, "return" !== a.method && (a.method = "next", 
      a.arg = r), a.delegate = null, y) : v : (a.method = "throw", a.arg = new TypeError("iterator result is not an object"), 
      a.delegate = null, y);
    }
    function w(r) {
      this.tryEntries.push(r);
    }
    function m(o) {
      var a = o[4] || {};
      a.type = "normal", a.arg = r, o[4] = a;
    }
    function Context(r) {
      this.tryEntries = [ [ -1 ] ], r.forEach(w, this), this.reset(!0);
    }
    function x(o) {
      if (null != o) {
        var a = o[p];
        if (a) {
          return a.call(o);
        }
        if ("function" == typeof o.next) {
          return o;
        }
        if (!isNaN(o.length)) {
          var u = -1, v = function e() {
            for (;++u < o.length; ) {
              if (l.call(o, u)) {
                return e.value = o[u], e.done = !1, e;
              }
            }
            return e.value = r, e.done = !0, e;
          };
          return v.next = v;
        }
      }
      throw new TypeError(src_typeof(o) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(E, "constructor", GeneratorFunctionPrototype), 
    c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, b, "GeneratorFunction"), 
    o.isGeneratorFunction = function(r) {
      var o = "function" == typeof r && r.constructor;
      return !!o && (o === GeneratorFunction || "GeneratorFunction" === (o.displayName || o.name));
    }, o.mark = function(r) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, 
      c(r, b, "GeneratorFunction")), r.prototype = Object.create(E), r;
    }, o.awrap = function(r) {
      return {
        "__await": r
      };
    }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, v, (function() {
      return this;
    })), o.AsyncIterator = AsyncIterator, o.async = function(r, a, l, u, p) {
      void 0 === p && (p = Promise);
      var v = new AsyncIterator(h(r, a, l, u), p);
      return o.isGeneratorFunction(a) ? v : v.next().then((function(r) {
        return r.done ? r.value : v.next();
      }));
    }, g(E), c(E, b, "Generator"), c(E, p, (function() {
      return this;
    })), c(E, "toString", (function() {
      return "[object Generator]";
    })), o.keys = function(r) {
      var o = Object(r), a = [];
      for (var l in o) {
        a.unshift(l);
      }
      return function t() {
        for (;a.length; ) {
          if ((l = a.pop()) in o) {
            return t.value = l, t.done = !1, t;
          }
        }
        return t.done = !0, t;
      };
    }, o.values = x, Context.prototype = {
      "constructor": Context,
      "reset": function reset(o) {
        if (this.prev = this.next = 0, this.sent = this._sent = r, this.done = !1, this.delegate = null, 
        this.method = "next", this.arg = r, this.tryEntries.forEach(m), !o) {
          for (var a in this) {
            "t" === a.charAt(0) && l.call(this, a) && !isNaN(+a.slice(1)) && (this[a] = r);
          }
        }
      },
      "stop": function stop() {
        this.done = !0;
        var r = this.tryEntries[0][4];
        if ("throw" === r.type) {
          throw r.arg;
        }
        return this.rval;
      },
      "dispatchException": function dispatchException(o) {
        if (this.done) {
          throw o;
        }
        var a = this;
        function n(r) {
          p.type = "throw", p.arg = o, a.next = r;
        }
        for (var l = a.tryEntries.length - 1; l >= 0; --l) {
          var u = this.tryEntries[l], p = u[4], v = this.prev, b = u[1], y = u[2];
          if (-1 === u[0]) {
            return n("end"), !1;
          }
          if (!b && !y) {
            throw Error("try statement without catch or finally");
          }
          if (null != u[0] && u[0] <= v) {
            if (v < b) {
              return this.method = "next", this.arg = r, n(b), !0;
            }
            if (v < y) {
              return n(y), !1;
            }
          }
        }
      },
      "abrupt": function abrupt(r, o) {
        for (var a = this.tryEntries.length - 1; a >= 0; --a) {
          var l = this.tryEntries[a];
          if (l[0] > -1 && l[0] <= this.prev && this.prev < l[2]) {
            var u = l;
            break;
          }
        }
        u && ("break" === r || "continue" === r) && u[0] <= o && o <= u[2] && (u = null);
        var p = u ? u[4] : {};
        return p.type = r, p.arg = o, u ? (this.method = "next", this.next = u[2], y) : this.complete(p);
      },
      "complete": function complete(r, o) {
        if ("throw" === r.type) {
          throw r.arg;
        }
        return "break" === r.type || "continue" === r.type ? this.next = r.arg : "return" === r.type ? (this.rval = this.arg = r.arg, 
        this.method = "return", this.next = "end") : "normal" === r.type && o && (this.next = o), 
        y;
      },
      "finish": function finish(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[2] === r) {
            return this.complete(a[4], a[3]), m(a), y;
          }
        }
      },
      "catch": function _catch(r) {
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var a = this.tryEntries[o];
          if (a[0] === r) {
            var l = a[4];
            if ("throw" === l.type) {
              var u = l.arg;
              m(a);
            }
            return u;
          }
        }
        throw Error("illegal catch attempt");
      },
      "delegateYield": function delegateYield(o, a, l) {
        return this.delegate = {
          "i": x(o),
          "r": a,
          "n": l
        }, "next" === this.method && (this.arg = r), y;
      }
    }, o;
  }
  function src_slicedToArray(r, o) {
    return src_arrayWithHoles(r) || src_iterableToArrayLimit(r, o) || src_unsupportedIterableToArray(r, o) || src_nonIterableRest();
  }
  function src_nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function src_unsupportedIterableToArray(r, o) {
    if (r) {
      if ("string" == typeof r) {
        return src_arrayLikeToArray(r, o);
      }
      var a = {}.toString.call(r).slice(8, -1);
      return "Object" === a && r.constructor && (a = r.constructor.name), "Map" === a || "Set" === a ? Array.from(r) : "Arguments" === a || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(a) ? src_arrayLikeToArray(r, o) : void 0;
    }
  }
  function src_arrayLikeToArray(r, o) {
    (null == o || o > r.length) && (o = r.length);
    for (var a = 0, l = Array(o); a < o; a++) {
      l[a] = r[a];
    }
    return l;
  }
  function src_iterableToArrayLimit(r, o) {
    var a = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != a) {
      var l, u, p, v, b = [], y = !0, C = !1;
      try {
        if (p = (a = a.call(r)).next, 0 === o) {
          if (Object(a) !== a) {
            return;
          }
          y = !1;
        } else {
          for (;!(y = (l = p.call(a)).done) && (b.push(l.value), b.length !== o); y = !0) {}
        }
      } catch (r) {
        C = !0, u = r;
      } finally {
        try {
          if (!y && null != a["return"] && (v = a["return"](), Object(v) !== v)) {
            return;
          }
        } finally {
          if (C) {
            throw u;
          }
        }
      }
      return b;
    }
  }
  function src_arrayWithHoles(r) {
    if (Array.isArray(r)) {
      return r;
    }
  }
  function src_asyncGeneratorStep(r, o, a, l, u, p, v) {
    try {
      var b = r[p](v), y = b.value;
    } catch (r) {
      return void a(r);
    }
    b.done ? o(y) : Promise.resolve(y).then(l, u);
  }
  function src_asyncToGenerator(r) {
    return function() {
      var o = this, a = arguments;
      return new Promise((function(l, u) {
        var p = r.apply(o, a);
        function _next(r) {
          src_asyncGeneratorStep(p, l, u, _next, _throw, "next", r);
        }
        function _throw(r) {
          src_asyncGeneratorStep(p, l, u, _next, _throw, "throw", r);
        }
        _next(void 0);
      }));
    };
  }
  dt.checkAndRedirect();
  function setupViewport() {
    var r = document.querySelector('meta[name="viewport"]');
    if (!r) {
      r = document.createElement("meta");
      r.name = "viewport";
      document.head.appendChild(r);
    }
    r.content = "width=device-width, initial-scale=1.0, viewport-fit=cover";
  }
  (function() {
    "use strict";
    var r = window.self !== window.top;
    if (r && !isSiteDomain("JAVLIBRARY")) {
      return;
    }
    var o = null;
    var a = null;
    function injectStyles() {
      if (document.getElementById("tm-player-styles")) {
        return;
      }
      setupViewport();
      __webpack_require__(964);
    }
    function startScript() {
      return _startScript.apply(this, arguments);
    }
    function _startScript() {
      _startScript = src_asyncToGenerator(src_regeneratorRuntime().mark((function _callee2() {
        var r, a, l, u, p;
        return src_regeneratorRuntime().wrap((function _callee2$(v) {
          while (1) {
            switch (v.prev = v.next) {
             case 0:
              v.prev = 0;
              if (!isSiteDomain("JAVLIBRARY")) {
                v.next = 4;
                break;
              }
              handleJavLibraryVerification();
              return v.abrupt("return");

             case 4:
              r = getVideoCodeFromUrl();
              if (r) {
                Ae.preload(r);
              }
              injectStyles();
              a = initUserExperienceEnhancer(true);
              o = new Je;
              o.loadSettings();
              l = new Ne({
                "playerState": o
              });
              l.init();
              v.next = 14;
              return initAutoLogin();

             case 14:
              u = v.sent;
              if (u) {
                window.loginManager = u;
              }
              p = new st;
              p.init();
              v.next = 22;
              break;

             case 20:
              v.prev = 20;
              v.t0 = v["catch"](0);

             case 22:
             case "end":
              return v.stop();
            }
          }
        }), _callee2, null, [ [ 0, 20 ] ]);
      })));
      return _startScript.apply(this, arguments);
    }
    function handleJavLibraryVerification() {
      var o = r;
      U.log("检测到运行在 JAVLibrary 域名上，启动验证协同助手。".concat(o ? " (iframe broker 模式)" : ""));
      Y.startBroker("JAVLIBRARY", {
        "FETCH_JAVLIB_DATA": function() {
          var r = src_asyncToGenerator(src_regeneratorRuntime().mark((function _callee(r) {
            var o, a, l, u, p, v, b, y, C;
            return src_regeneratorRuntime().wrap((function _callee$(k) {
              while (1) {
                switch (k.prev = k.next) {
                 case 0:
                  o = r.avcode, a = r.page;
                  U.log("[ShadowBroker] 收到 JAVLibrary 同源抓取请求: ".concat(o, ", Page: ").concat(a));
                  k.next = 4;
                  return fetchJavLibraryVideoId(o);

                 case 4:
                  l = k.sent;
                  u = l.videoId, p = l.domain;
                  k.next = 8;
                  return Promise.all([ fetchJavLibraryData(u, "comments", a, p), fetchJavLibraryData(u, "reviews", a, p) ]);

                 case 8:
                  v = k.sent;
                  b = src_slicedToArray(v, 2);
                  y = b[0];
                  C = b[1];
                  return k.abrupt("return", {
                    "idResult": l,
                    "cRes": y,
                    "rRes": C
                  });

                 case 13:
                 case "end":
                  return k.stop();
                }
              }
            }), _callee);
          })));
          function FETCH_JAVLIB_DATA(o) {
            return r.apply(this, arguments);
          }
          return FETCH_JAVLIB_DATA;
        }()
      });
      function checkBypass() {
        var r = document.querySelector("#logo") || document.querySelector("#right") || document.querySelector("#top_bar") || document.title.includes("JAVLibrary");
        var a = document.querySelector("#cf-challenge") || document.querySelector("#turnstile-wrapper") || document.body.innerHTML.includes("Checking your browser") || document.body.innerHTML.includes("cf-challenge");
        U.log("检测验证状态中... hasLogo = ".concat(!!r, ", isChallenged = ").concat(!!a).concat(o ? " (iframe)" : ""));
        if (r && !a) {
          U.log("JAVLibrary 页面加载成功（未被拦截/验证已通过）。");
          if (typeof GM_setValue === "function") {
            var l = window.location.origin;
            var u = {};
            if (typeof GM_getValue === "function") {
              u = GM_getValue("javlib_cookies") || {};
            }
            u[l] = document.cookie;
            GM_setValue("javlib_cookies", u);
            GM_setValue("javlib_user_agent", navigator.userAgent);
            GM_setValue("javlib_verified_time", Date.now());
            U.log("Cookie 已保存至跨域存储: ".concat(l, ", UA: ").concat(navigator.userAgent));
          }
          if (o) {
            U.log("iframe broker 模式：页面验证通过，保持 iframe 存活以持续提供同源代理服务。");
          } else {
            var p = window.location.href.includes("cf_verify") || typeof GM_getValue === "function" && GM_getValue("javlib_verifying") === true;
            if (p) {
              U.log("正在释放验证锁...");
              if (typeof GM_setValue === "function") {
                GM_setValue("javlib_verifying", false);
              }
              U.log("保持协同验证标签页开启，以作为影子 Broker 持续在后台提供同源代理服务。");
            }
          }
          return true;
        }
        return false;
      }
      if (!checkBypass()) {
        var a = setInterval((function() {
          if (checkBypass()) {
            clearInterval(a);
          }
        }), 1e3);
        var l = o ? 6e4 : 3e4;
        setTimeout((function() {
          return clearInterval(a);
        }), l);
      }
    }
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(startScript, 100);
    } else {
      document.addEventListener("DOMContentLoaded", (function() {
        return setTimeout(startScript, 100);
      }));
    }
  })();
})();