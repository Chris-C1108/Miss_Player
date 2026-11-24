import { defineConfig, build as viteBuild } from 'vite';
import monkey from 'vite-plugin-monkey';
import fs from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const gitBranch = (() => {
  if (process.env.BUILD_TARGET_BRANCH) return process.env.BUILD_TARGET_BRANCH;
  const isPrerelease = String(pkg.version).includes('-');
  return isPrerelease ? 'dev' : 'main';
})();

export default defineConfig({
  server: {
    cors: true,
    port: 5173
  },
  plugins: [
    monkey({
      entry: 'src/index.js',
      userscript: {
        name: {
          '': 'Miss Player | 影院模式 (单手播放器)',
          en: 'Miss Player | Theater Mode (One-handed Player)',
          'zh-CN': 'Miss Player | 影院模式 (单手播放器)',
          'zh-TW': 'Miss Player | 影院模式 (單手播放器)',
          ja: 'Miss Player | シアターモード (片手プレーヤー)',
          vi: 'Miss Player | Chế Độ Rạp Hát (Trình Phát Một Tay)'
        },
        namespace: 'loadingi.local',
        version: pkg.version,
        description: {
          '': 'MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器|多语言支持 支持 jable po*nhub 等通用',
          en: 'MissAV ad-free|one-handed mode|MissAV auto-expand details|MissAV auto high quality|MissAV redirect support|MissAV auto login|custom player|multilingual support for jable po*nhub etc.',
          'zh-CN': 'MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器|多语言支持 支持 jable po*nhub 等通用',
          'zh-TW': 'MissAV去廣告|單手模式|MissAV自動展開詳情|MissAV自動高畫質|MissAV重定向支持|MissAV自動登錄|定制播放器|多語言支持 支持 jable po*nhub 等通用',
          ja: 'MissAV広告ブロック|片手モード|MissAV自動詳細表示|MissAV自動高画質|MissAVリダイレクト対応|MissAV自動ログイン|カスタムプレーヤー|jable po*nhubなどに対応した多语言サポート',
          vi: 'MissAV không quảng cáo|chế độ một tay|MissAV tự động mở rộng chi tiết|MissAV tự động chất lượng cao|Hỗ trợ chuyển hướng MissAV|MissAV tự động đăng nhập|trình phát tùy chỉnh|hỗ trợ đa ngôn ngữ cho jable po*nhub v.v.'
        },
        author: 'Chris_C',
        match: [
          '*://*.missav.ws/*',
          '*://missav.ws/*',
          '*://*.missav.ai/*',
          '*://missav.ai/*',
          '*://*.jable.tv/*',
          '*://jable.tv/*',
          '*://*/*',
        ],
        include: [
          '*',
          'http://*/*',
          'https://*/*',
          'http://*:*/*',
          'https://*:*/*'
        ],
        icon: 'https://missav.ws/img/favicon.ico',
        grant: [
          'GM_xmlhttpRequest',
          'GM.xmlHttpRequest',
          'GM_setClipboard',
          'GM_notification',
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_listValues',
          'GM_addValueChangeListener',
          'GM_removeValueChangeListener',
          'GM_openInTab',
          'GM_addStyle'
        ],
        connect: [
          '*',
          'jable.tv',
          'www.jable.tv',
          'fs1.app',
          'www.fs1.app',
          'javdb.com',
          'www.javdb.com',
          'jdforrepam.com',
          'www.javlibrary.com',
          'javlib.com',
          'www.javlib.com',
          'c97k.com',
          'www.c97k.com',
          'fourhoi.com',
          '123av.com',
          'www.123av.com',
          'javverse.com',
          'www.javverse.com',
          'api-shoulei-ssl.xunlei.com',
          'subtitle.v.geilijiasu.com',
          'subtitlecat.com',
          'www.subtitlecat.com',
          'sleazyfork.org',
          'greasyfork.org',
          'update.sleazyfork.org',
          'raw.githubusercontent.com',
          'github.com',
          'api.github.com',
          'cdn.jsdelivr.net',
          'fastly.jsdelivr.net'
        ],
        'run-at': 'document-start',
        'inject-into': 'auto',
        license: pkg.license,
        downloadURL: `https://raw.githubusercontent.com/Chris-C1108/Miss_Player/${gitBranch}/dist/miss_player.user.js`,
        updateURL: `https://raw.githubusercontent.com/Chris-C1108/Miss_Player/${gitBranch}/dist/miss_player.meta.js`
      },
      build: {
        fileName: 'miss_player.user.js',
        metaFileName: 'miss_player.meta.js'
      }
    }),
    {
      name: 'post-build-fixes',
      async closeBundle() {
        try {
          if (fs.existsSync('dist/miss_player.meta.js')) {
            const meta = fs.readFileSync('dist/miss_player.meta.js', 'utf8');
            const proxyContent = meta.replace(
              '// ==/UserScript==',
              '// @require              http://localhost:5173/miss_player.user.js\n// ==/UserScript=='
            );
            const proxyBridgeCode = `
// 桥接 Tampermonkey 沙箱特权 API 给本地动态加载的开发脚本
(function() {
  const gmApis = {
    GM_xmlhttpRequest: typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : undefined,
    GM: typeof GM !== 'undefined' ? GM : undefined,
    GM_getValue: typeof GM_getValue !== 'undefined' ? GM_getValue : undefined,
    GM_setValue: typeof GM_setValue !== 'undefined' ? GM_setValue : undefined,
    GM_deleteValue: typeof GM_deleteValue !== 'undefined' ? GM_deleteValue : undefined,
    GM_listValues: typeof GM_listValues !== 'undefined' ? GM_listValues : undefined,
    GM_addValueChangeListener: typeof GM_addValueChangeListener !== 'undefined' ? GM_addValueChangeListener : undefined,
    GM_removeValueChangeListener: typeof GM_removeValueChangeListener !== 'undefined' ? GM_removeValueChangeListener : undefined,
    GM_setClipboard: typeof GM_setClipboard !== 'undefined' ? GM_setClipboard : undefined,
    GM_notification: typeof GM_notification !== 'undefined' ? GM_notification : undefined,
    GM_openInTab: typeof GM_openInTab !== 'undefined' ? GM_openInTab : undefined,
    GM_addStyle: typeof GM_addStyle !== 'undefined' ? GM_addStyle : undefined
  };
  for (const [k, v] of Object.entries(gmApis)) {
    if (v !== undefined) {
      try { window[k] = v; } catch (_) {}
      try { globalThis[k] = v; } catch (_) {}
    }
  }
})();
`;
            fs.writeFileSync('dist/miss_player.proxy.user.js', proxyContent + '\n' + proxyBridgeCode, 'utf8');
          }

          if (fs.existsSync('dist/miss_player.user.js')) {
            let code = fs.readFileSync('dist/miss_player.user.js', 'utf8');
            if (code.includes('"use strict"(function')) {
              code = code.replace('"use strict"(function', '"use strict";\n(function');
            }
            code = code.replace(/-webkit-backdrop-filter:([^;}]+)/g, 'backdrop-filter:$1;-webkit-backdrop-filter:$1');
            fs.writeFileSync('dist/miss_player.user.js', code, 'utf8');
          }

          // 构建 iOS Safari Stay / 严格 CSP 专用伴侣脚本（零 unsafeWindow、零非白名单 window.*，强制 Stay content 沙箱执行）
          if (fs.existsSync('src/entries/ltxlibCompanion.js')) {
            const companionMeta = [
              '// ==UserScript==',
              '// @name               Miss Player | LTXLib 跨站伴侣 (iOS Stay / CSP 兼容)',
              '// @namespace          loadingi.local',
              `// @version            ${pkg.version}`,
              '// @author             Chris_C',
              '// @description        为 ltxlib.dpdns.org 卡片注入跨站播放入口，兼容 iOS Safari Stay 隔离沙箱与严格 CSP',
              '// @license            MIT',
              '// @icon               https://missav.ws/img/favicon.ico',
              `// @downloadURL        https://raw.githubusercontent.com/Chris-C1108/Miss_Player/${gitBranch}/dist/miss_player.ltxlib.user.js`,
              `// @updateURL          https://raw.githubusercontent.com/Chris-C1108/Miss_Player/${gitBranch}/dist/miss_player.ltxlib.meta.js`,
              '// @match              *://ltxlib.dpdns.org/*',
              '// @match              *://*.ltxlib.dpdns.org/*',
              '// @connect            *',
              '// @connect            123av.com',
              '// @connect            www.123av.com',
              '// @connect            javverse.com',
              '// @connect            www.javverse.com',
              '// @connect            missav.ai',
              '// @connect            www.missav.ai',
              '// @connect            missav.ws',
              '// @connect            www.missav.ws',
              '// @connect            jable.tv',
              '// @connect            www.jable.tv',
              '// @grant              GM_xmlhttpRequest',
              '// @grant              GM_getValue',
              '// @grant              GM_setValue',
              '// @grant              GM_openInTab',
              '// @grant              GM_addStyle',
              '// @inject-into        content',
              '// @run-at             document-end',
              '// @noframes',
              '// ==/UserScript==',
              ''
            ].join('\n');

            await viteBuild({
              configFile: false,
              logLevel: 'silent',
              build: {
                outDir: 'dist',
                emptyOutDir: false,
                minify: false,
                target: 'es2020',
                lib: {
                  entry: 'src/entries/ltxlibCompanion.js',
                  name: 'MissPlayerLtxLibCompanion',
                  formats: ['iife'],
                  fileName: () => 'miss_player.ltxlib.user.js'
                }
              }
            });

            const companionPath = 'dist/miss_player.ltxlib.user.js';
            if (fs.existsSync(companionPath)) {
              const body = fs.readFileSync(companionPath, 'utf8');
              fs.writeFileSync(companionPath, companionMeta + '\n' + body, 'utf8');
              fs.writeFileSync('dist/miss_player.ltxlib.meta.js', companionMeta, 'utf8');
            }
          }
        } catch (err) {
          console.error('[post-build-fixes] error:', err);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    minify: false,
    cssMinify: true,
    target: 'es2020',
    rolldownOptions: {
      output: {
        intro: "'use strict';"
      }
    },
    rollupOptions: {
      output: {
        intro: "'use strict';"
      }
    }
  }
});
