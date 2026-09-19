import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export default defineConfig({
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
          '*://*.missav.ai/*',
          '*://*.jable.tv/*',
          '*://*/*',
        ],
        icon: 'https://missav.ws/img/favicon.ico',
        grant: [
          'GM_xmlhttpRequest',
          'GM_setClipboard',
          'GM_notification',
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_listValues',
          'GM_addValueChangeListener',
          'GM_removeValueChangeListener',
          'GM_openInTab'
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
          'www.c97k.com'
        ],
        'run-at': 'document-start',
        license: pkg.license
      },
      build: {
        fileName: 'miss_player.user.js',
        metaFileName: 'miss_player.meta.js'
      }
    }),
    {
      name: 'post-build-fixes',
      closeBundle() {
        try {
          if (fs.existsSync('dist/miss_player.meta.js')) {
            const meta = fs.readFileSync('dist/miss_player.meta.js', 'utf8');
            const proxyContent = meta.replace(
              '// ==/UserScript==',
              '// @require              http://localhost:5173/miss_player.user.js\n// ==/UserScript=='
            );
            fs.writeFileSync('dist/miss_player.proxy.user.js', proxyContent, 'utf8');
          }

          if (fs.existsSync('dist/miss_player.user.js')) {
            let code = fs.readFileSync('dist/miss_player.user.js', 'utf8');
            if (code.includes('"use strict"(function')) {
              code = code.replace('"use strict"(function', '"use strict";\n(function');
              fs.writeFileSync('dist/miss_player.user.js', code, 'utf8');
            }
          }
        } catch (_) {}
      }
    }
  ],
  build: {
    outDir: 'dist',
    minify: false,
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
