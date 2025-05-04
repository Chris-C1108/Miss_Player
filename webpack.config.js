const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackUserscript = require('webpack-userscript').default;
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const package = require('./package.json');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'miss_player.user.js',
    // 不设置chunkFilename，确保不会生成额外的chunk文件
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['transform-remove-console', 'transform-remove-debugger']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              importLoaders: 2,
              import: {
                filter: (url, media, resourcePath) => {
                  // 如果URL包含注释符号，不导入
                  if (url.includes('/*') || url.includes('*/')) {
                    return false;
                  }
                  return true;
                },
              },
              modules: false,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  [
                    'postcss-discard-comments',
                    {
                      removeAll: true,
                    },
                  ],
                ],
              },
            },
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new WebpackUserscript({
      headers: {
        name: 'Miss Player | 影院模式 (单手播放器)',
        namespace: 'loadingi.local',
        version: '5.1.6',
        description: "MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器|多语言支持 支持 jable po*nhub 等通用",
        author: 'Chris_C',
        match: [
          '*://*.missav.ws/*',
          '*://*.missav.ai/*',
          '*://*.jable.tv/*',
          '*://*/*',
        ],
        icon: 'https://missav.ws/img/favicon.ico',
        grant: [
          'none'
        ],
        'run-at': 'document-start',
        noframes: true,
        license: package.license
      },
      proxyScript: {
        filename: '[basename].proxy.user.js',
        enable: false
      },
      i18n: {
        en: {
          name: 'Miss Player | Theater Mode (One-handed Player)',
          description: "MissAV ad-free|one-handed mode|MissAV auto-expand details|MissAV auto high quality|MissAV redirect support|MissAV auto login|custom player|multilingual support for jable po*nhub etc."
        },
        'zh-CN': {
          name: 'Miss Player | 影院模式 (单手播放器)',
          description: "MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器|多语言支持 支持 jable po*nhub 等通用"
        },
        'zh-TW': {
          name: 'Miss Player | 影院模式 (單手播放器)',
          description: "MissAV去廣告|單手模式|MissAV自動展開詳情|MissAV自動高畫質|MissAV重定向支持|MissAV自動登錄|定制播放器|多語言支持 支持 jable po*nhub 等通用"
        },
        ja: {
          name: 'Miss Player | シアターモード (片手プレーヤー)',
          description: "MissAV広告ブロック|片手モード|MissAV自動詳細表示|MissAV自動高画質|MissAVリダイレクト対応|MissAV自動ログイン|カスタムプレーヤー|jable po*nhubなどに対応した多言語サポート"
        },
        vi: {
          name: 'Miss Player | Chế Độ Rạp Hát (Trình Phát Một Tay)',
          description: "MissAV không quảng cáo|chế độ một tay|MissAV tự động mở rộng chi tiết|MissAV tự động chất lượng cao|Hỗ trợ chuyển hướng MissAV|MissAV tự động đăng nhập|trình phát tùy chỉnh|hỗ trợ đa ngôn ngữ cho jable po*nhub v.v."
        }
      }
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        terserOptions: {
          ecma: 5,
          parse: {},
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            // 以下选项设置为 false 可以减少代码压缩，保留更多原始结构
            sequences: false,
            conditionals: false,
            comparisons: false,
            evaluate: false,
            booleans: false,
            loops: false,
            unused: false,
            toplevel: false,
            if_return: false,
            inline: false,
            join_vars: false
          },
          mangle: {
            keep_classnames: true,
            keep_fnames: true,
            properties: false
          },
          format: {
            beautify: true,
            indent_level: 2,
            indent_start: 0,
            quote_keys: true,
            keep_quoted_props: true,
            ascii_only: false,
            braces: true,
            // 只移除注释
            comments: false
          }
        }
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              // 禁用CSS压缩相关选项，保留格式
              normalizeWhitespace: false,
              mergeRules: false,
              mergeLonghand: false,
              minifyFontValues: false,
              minifyParams: false,
              minifySelectors: false,
              minifyGradients: false,
              cssDeclarationSorter: false,
              reduceInitial: false,
              reduceIdents: false,
              zindex: false,
              calc: false
            },
          ],
        },
        test: /\.css$/,
      }),
    ],
    // 禁用代码分割，确保不会产生额外的chunks
    splitChunks: false,
    runtimeChunk: false
  },
}; 