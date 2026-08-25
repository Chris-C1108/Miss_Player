/**
 * 多语言系统 - 用于整个脚本的国际化支持
 */
export class I18n {
    /**
     * 获取用户浏览器当前语言
     * @returns {string} 用户当前语言代码
     */
    static get userLang() {
        return (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    }
    
    /**
     * 语言字符串集合 - 包含所有脚本使用的文本
     * @type {Object}
     */
    static strings = {
        'en': {
            // 元数据
            scriptName: 'Miss Player | Cinema Mode (One-handed Player)',
            scriptDescription: 'MissAV ad-free|One-handed mode|MissAV auto-expand details|MissAV auto high quality|MissAV redirect support|MissAV auto login|Custom player supporting jable po*nhub etc',
            
            // 控制台日志信息
            viewportConfigured: 'Viewport configured to support safe area',
            stylesInjected: 'Styles injected',
            enhancerInitialized: 'User experience enhancer module initialized',
            loginModuleInitialized: 'Auto login module initialized',
            initializationComplete: 'Initialization complete',
            initializationFailed: 'Initialization failed',
            
            // 界面文本
            play: 'Play',
            pause: 'Pause',
            mute: 'Mute',
            unmute: 'Unmute',
            fullscreen: 'Fullscreen',
            exitFullscreen: 'Exit Fullscreen',
            settings: 'Settings',
            quality: 'Quality',
            speed: 'Speed',
            
            // 设置选项
            autoplay: 'Auto Play',
            loop: 'Loop',
            loopStart: 'Loop Start',
            loopEnd: 'Loop End',
            send: 'Send',
            commentsTitle: 'Comments',
            commentsCount: '{n} Comments',
            commentsLeave: 'Leave Comment',
            commentsExpand: 'Expand',
            commentsCollapse: 'Collapse',
            commentsPlaceholder: 'Write a comment...',
            commentsFilterSpam: 'Filter Spam',
            commentsCopyAll: 'Copy All',
            commentsLoadMore: 'Load More',
            commentsLoading: 'Loading comments...',
            commentsNoComments: 'No comments yet',
            commentsError: 'Failed to load comments',
            tabJable: 'Jable.tv Comments',
            tabJavlibComment: 'JAVLib Comments',
            tabJavlibReview: 'JAVLib Reviews',
            tabComments: 'Comments',
            autoQuality: 'Auto Quality',
            helpImprove: 'Help improve',
            helpImproveDesc: 'Collect necessary data to improve features',
            pauseOnBlur: 'Stop playback on blur',
            pauseOnBlurDesc: 'Automatically pause video when switching tabs or losing focus',
            webdavTitle: 'Cloud Sync (WebDAV)',
            webdavServerUrl: 'Server URL',
            webdavUsername: 'Username',
            webdavPassword: 'Password / App Token',
            webdavBackupPath: 'Backup Directory Path',
            webdavCurrentDevice: 'Current Device',
            webdavTestConnection: 'Test Connection',
            webdavSyncMerge: 'Smart Merge Sync',
            webdavUploadOverwrite: 'Upload Overwrite (Local -> Cloud)',
            webdavDownloadOverwrite: 'Download Overwrite (Cloud -> Local)',
            webdavTesting: 'Testing connection...',
            webdavTestSuccess: 'WebDAV connection & directory verified!',
            webdavTestFailed: 'Connection failed, check URL or credentials',
            webdavSyncing: 'Syncing data...',
            webdavSyncSuccess: 'Cloud sync completed successfully!',
            webdavSyncFailed: 'Sync failed: ',
            webdavLastSync: 'Last Sync',
            webdavNeverSynced: 'Never synced',
            webdavAutoSync: 'Auto Smart Merge Sync',
            webdavAutoSyncDesc: 'Automatically sync in background on player launch and marker changes',
            webdavConfirmUpload: 'Are you sure you want to force upload local config to cloud? This will overwrite the backup on WebDAV.',
            webdavConfirmDownload: 'Are you sure you want to download and overwrite local config? This will replace settings and markers on this device.',
            
            // 消息提示
            loadingError: 'Failed to load video',
            networkError: 'Network error',
            loginSuccess: 'Login successful',
            loginFailed: 'Login failed',
            
            // 登录模块
            login_accountNull: 'Error: Email or password is empty.',
            login_success: 'Login successful, refreshing the page.',
            login_networkFailed: 'Status code error.',
            login_failed: 'Login failed, incorrect email or password. Check console for error details.',
            login_autoLogin: 'Auto Login'
        },
        'zh-CN': {
            // 元数据
            scriptName: 'Miss Player | 影院模式 (单手播放器)',
            scriptDescription: 'MissAV去广告|单手模式|MissAV自动展开详情|MissAV自动高画质|MissAV重定向支持|MissAV自动登录|定制播放器 支持 jable po*nhub 等通用',
            
            // 控制台日志信息
            viewportConfigured: '已配置viewport以支持安全区域',
            stylesInjected: '样式注入完成',
            enhancerInitialized: '用户体验增强模块已初始化',
            loginModuleInitialized: '自动登录模块已初始化',
            initializationComplete: '初始化完成',
            initializationFailed: '初始化失败',
            
            // 界面文本
            play: '播放',
            pause: '暂停',
            mute: '静音',
            unmute: '取消静音',
            fullscreen: '全屏',
            exitFullscreen: '退出全屏',
            settings: '设置',
            quality: '画质',
            speed: '速度',
            
            // 设置选项
            autoplay: '自动播放',
            loop: '循环播放',
            loopStart: '循环起点',
            loopEnd: '循环终点',
            send: '发送',
            commentsTitle: '评论区',
            commentsCount: '共 {n} 条评论',
            commentsLeave: '留言',
            commentsExpand: '展开',
            commentsCollapse: '收起',
            commentsPlaceholder: '说点什么吧...',
            commentsFilterSpam: '过滤灌水',
            commentsCopyAll: '复制全部',
            commentsLoadMore: '加载更多',
            commentsLoading: '正在采集评论...',
            commentsNoComments: '暂无评论',
            commentsError: '评论采集失败',
            tabJable: 'Jable.tv 评论',
            tabJavlibComment: 'JAVLib 评论',
            tabJavlibReview: 'JAVLib 文章',
            tabComments: '评论',
            autoQuality: '自动画质',
            helpImprove: '帮助改进',
            helpImproveDesc: '收集必要数据用于改进功能',
            pauseOnBlur: '失焦后停止播放',
            pauseOnBlurDesc: '页面离开或失去焦点时自动暂停播放',
            webdavTitle: '云端同步 (WebDAV)',
            webdavServerUrl: '服务器地址',
            webdavUsername: '用户名',
            webdavPassword: '密码 / 应用授权码',
            webdavBackupPath: '备份目录路径',
            webdavCurrentDevice: '当前设备',
            webdavTestConnection: '测试连接',
            webdavSyncMerge: '智能合并同步',
            webdavUploadOverwrite: '向上覆盖 (本地 -> 远端)',
            webdavDownloadOverwrite: '向下覆盖 (远端 -> 本地)',
            webdavTesting: '正在测试连接...',
            webdavTestSuccess: 'WebDAV 连接与目录创建成功！',
            webdavTestFailed: '连接失败，请检查地址或账号密码',
            webdavSyncing: '正在同步数据...',
            webdavSyncSuccess: '云端同步成功完成！',
            webdavSyncFailed: '同步失败: ',
            webdavLastSync: '上次同步',
            webdavNeverSynced: '尚未同步',
            webdavAutoSync: '自动智能合并同步',
            webdavAutoSyncDesc: '播放器启动及打点变更时自动在后台静默合并同步',
            webdavConfirmUpload: '确定要将当前本地配置强制覆盖到云端吗？这将替换 WebDAV 上的所有备份数据。',
            webdavConfirmDownload: '确定要从云端拉取配置并覆盖本地吗？这将替换此设备上的当前设置与打点数据。',
            
            // 消息提示
            loadingError: '视频加载失败',
            networkError: '网络错误',
            loginSuccess: '登录成功',
            loginFailed: '登录失败',
            
            // 登录模块
            login_accountNull: '邮箱或密码为空',
            login_success: '登录成功，即将刷新页面。',
            login_networkFailed: '状态码错误',
            login_failed: '登录失败，邮箱或密码错误，可以在控制台查看错误信息。',
            login_autoLogin: '自动登录'
        },
        'zh-TW': {
            // 元数据
            scriptName: 'Miss Player | 影院模式 (單手播放器)',
            scriptDescription: 'MissAV去廣告|單手模式|MissAV自動展開詳情|MissAV自動高畫質|MissAV重定向支持|MissAV自動登錄|定制播放器 支持 jable po*nhub 等通用',
            
            // 控制台日志信息
            viewportConfigured: '已配置viewport以支持安全區域',
            stylesInjected: '樣式注入完成',
            enhancerInitialized: '用戶體驗增強模塊已初始化',
            loginModuleInitialized: '自動登錄模塊已初始化',
            initializationComplete: '初始化完成',
            initializationFailed: '初始化失敗',
            
            // 界面文本
            play: '播放',
            pause: '暫停',
            mute: '靜音',
            unmute: '取消靜音',
            fullscreen: '全屏',
            exitFullscreen: '退出全屏',
            settings: '設置',
            quality: '畫質',
            speed: '速度',
            
            // 设置选项
            autoplay: '自動播放',
            loop: '循環播放',
            loopStart: '循環起點',
            loopEnd: '循環終點',
            send: '發送',
            commentsTitle: '評論區',
            commentsCount: '共 {n} 條評論',
            commentsLeave: '留言',
            commentsExpand: '展開',
            commentsCollapse: '收起',
            commentsPlaceholder: '說點什麼吧...',
            commentsFilterSpam: '過濾灌水',
            commentsCopyAll: '複製全部',
            commentsLoadMore: '載入更多',
            commentsLoading: '正在採集評論...',
            commentsNoComments: '暫無評論',
            commentsError: '評論採集失敗',
            tabJable: 'Jable.tv 評論',
            tabJavlibComment: 'JAVLib 評論',
            tabJavlibReview: 'JAVLib 文章',
            tabComments: '評論',
            autoQuality: '自動畫質',
            helpImprove: '幫助改進',
            helpImproveDesc: '收集必要數據用於改進功能',
            pauseOnBlur: '失焦後停止播放',
            pauseOnBlurDesc: '頁面離開或失去焦點時自動暫停播放',
            webdavTitle: '雲端同步 (WebDAV)',
            webdavServerUrl: '伺服器位址',
            webdavUsername: '用戶名',
            webdavPassword: '密碼 / 應用授權碼',
            webdavBackupPath: '備份目錄路徑',
            webdavCurrentDevice: '當前設備',
            webdavTestConnection: '測試連線',
            webdavSyncMerge: '智慧合併同步',
            webdavUploadOverwrite: '向上覆蓋 (本地 -> 遠端)',
            webdavDownloadOverwrite: '向下覆蓋 (遠端 -> 本地)',
            webdavTesting: '正在測試連線...',
            webdavTestSuccess: 'WebDAV 連線與目錄建立成功！',
            webdavTestFailed: '連線失敗，請檢查位址或帳號密碼',
            webdavSyncing: '正在同步資料...',
            webdavSyncSuccess: '雲端同步成功完成！',
            webdavSyncFailed: '同步失敗: ',
            webdavLastSync: '上次同步',
            webdavNeverSynced: '尚未同步',
            webdavAutoSync: '自動智慧合併同步',
            webdavAutoSyncDesc: '播放器啟動及打點變更時自動在後台靜默合併同步',
            webdavConfirmUpload: '確定要將當前本地配置強制覆蓋到雲端嗎？這將替換 WebDAV 上的所有備份資料。',
            webdavConfirmDownload: '確定要從雲端拉取配置並覆蓋本地嗎？這將替換此設備上的當前設置與打點資料。',
            
            // 消息提示
            loadingError: '視頻加載失敗',
            networkError: '網絡錯誤',
            loginSuccess: '登錄成功',
            loginFailed: '登錄失敗',
            
            // 登录模块
            login_accountNull: '郵箱或密碼為空',
            login_success: '登錄成功，即將刷新頁面。',
            login_networkFailed: '狀態碼錯誤',
            login_failed: '登錄失敗，郵箱或密碼錯誤，可以在控制台查看錯誤信息。',
            login_autoLogin: '自動登錄'
        },
        'ja': {
            // 元数据
            scriptName: 'Miss Player | シネマモード (片手プレーヤー)',
            scriptDescription: 'MissAV広告なし|片手モード|MissAV自動詳細展開|MissAV自動高画質|MissAVリダイレクトサポート|MissAV自動ログイン|jable po*nhub などをサポートするカスタムプレーヤー',
            
            // 控制台日志信息
            viewportConfigured: 'セーフエリアをサポートするためにビューポートを設定しました',
            stylesInjected: 'スタイルが注入されました',
            enhancerInitialized: 'ユーザー体験向上モジュールが初期化されました',
            loginModuleInitialized: '自動ログインモジュールが初期化されました',
            initializationComplete: '初期化が完了しました',
            initializationFailed: '初期化に失敗しました',
            
            // 界面文本
            play: '再生',
            pause: '一時停止',
            mute: 'ミュート',
            unmute: 'ミュート解除',
            fullscreen: '全画面',
            exitFullscreen: '全画面解除',
            settings: '設定',
            quality: '画質',
            speed: '速度',
            
            // 设置选项
            autoplay: '自動再生',
            loop: 'ループ再生',
            loopStart: 'ループ開始点',
            loopEnd: 'ループ終了点',
            commentsTitle: 'コメント欄',
            commentsCount: '{n} 件のコメント',
            commentsLeave: 'コメント',
            commentsExpand: '展開',
            commentsCollapse: '折りたたむ',
            commentsPlaceholder: 'コメントを書く...',
            commentsFilterSpam: 'スパムを除外',
            commentsCopyAll: 'すべてコピー',
            commentsLoadMore: 'もっと読み込む',
            commentsLoading: 'コメントを読み込み中...',
            commentsNoComments: 'コメントはまだありません',
            commentsError: 'コメントの読み込みに失敗しました',
            tabJable: 'Jable.tv コメント',
            tabJavlibComment: 'JAVLib コメント',
            tabJavlibReview: 'JAVLib レビュー',
            tabComments: 'コメント',
            autoQuality: '自動画质',
            helpImprove: '改善に協力',
            helpImproveDesc: '機能改善のために必要なデータを収集します',
            pauseOnBlur: 'フォーカス外で再生停止',
            pauseOnBlurDesc: 'タブ切替やフォーカス喪失時に再生を一時停止',
            webdavTitle: 'クラウド同期 (WebDAV)',
            webdavServerUrl: 'サーバーアドレス',
            webdavUsername: 'ユーザー名',
            webdavPassword: 'パスワード / アプリトークン',
            webdavBackupPath: 'バックアップディレクトリパス',
            webdavCurrentDevice: '現在のデバイス',
            webdavTestConnection: '接続テスト',
            webdavSyncMerge: 'スマートマージ同期',
            webdavUploadOverwrite: 'アップロード上書き (ローカル -> クラウド)',
            webdavDownloadOverwrite: 'ダウンロード上書き (クラウド -> ローカル)',
            webdavTesting: '接続をテスト中...',
            webdavTestSuccess: 'WebDAVの接続とディレクトリ作成に成功しました！',
            webdavTestFailed: '接続に失敗しました。URLまたは認証情報を確認してください',
            webdavSyncing: 'データを同期中...',
            webdavSyncSuccess: 'クラウド同期が正常に完了しました！',
            webdavSyncFailed: '同期に失敗しました: ',
            webdavLastSync: '前回の同期',
            webdavNeverSynced: '未同期',
            webdavAutoSync: '自動スマートマージ同期',
            webdavAutoSyncDesc: 'プレーヤー起動時やマーカー変更時にバックグラウンドで自動同期',
            webdavConfirmUpload: '現在のローカル設定をクラウドに強制上書きしますか？WebDAV上のバックアップが置き換えられます。',
            webdavConfirmDownload: 'クラウドから設定をダウンロードしてローカルを上書きしますか？このデバイスの設定とマーカーが置き換えられます。',
            
            // 消息提示
            loadingError: '動画の読み込みに失敗しました',
            networkError: 'ネットワークエラー',
            loginSuccess: 'ログイン成功',
            loginFailed: 'ログイン失敗',
            
            // 登录模块
            login_accountNull: 'エラー：メールアドレスまたはパスワードが空です。',
            login_success: 'ログイン成功、ページを更新します。',
            login_networkFailed: 'ステータスコードエラー',
            login_failed: 'ログインに失敗しました。メールアドレスまたはパスワードが間違っています。エラーの詳細はコンソールで確認できます。',
            login_autoLogin: '自動ログイン'
        },
        'vi': {
            // 元数据
            scriptName: 'Miss Player | Chế độ Rạp chiếu phim (Trình phát một tay)',
            scriptDescription: 'MissAV không quảng cáo|Chế độ một tay|MissAV tự động mở rộng chi tiết|MissAV tự động chất lượng cao|Hỗ trợ chuyển hướng MissAV|Đăng nhập tự động MissAV|Trình phát tùy chỉnh hỗ trợ jable po*nhub v.v.',
            
            // 控制台日志信息
            viewportConfigured: 'Đã cấu hình viewport để hỗ trợ vùng an toàn',
            stylesInjected: 'Đã tiêm CSS',
            enhancerInitialized: 'Đã khởi tạo mô-đun nâng cao trải nghiệm người dùng',
            loginModuleInitialized: 'Đã khởi tạo mô-đun đăng nhập tự động',
            initializationComplete: 'Khởi tạo hoàn tất',
            initializationFailed: 'Khởi tạo thất bại',
            
            // 界面文本
            play: 'Phát',
            pause: 'Tạm dừng',
            mute: 'Tắt tiếng',
            unmute: 'Bật tiếng',
            fullscreen: 'Toàn màn hình',
            exitFullscreen: 'Thoát toàn màn hình',
            settings: 'Cài đặt',
            quality: 'Chất lượng',
            speed: 'Tốc độ',
            
            // 设置选项
            autoplay: 'Tự động phát',
            loop: 'Lặp lại',
            loopStart: 'Điểm bắt đầu lặp',
            loopEnd: 'Điểm kết thúc lặp',
            commentsTitle: 'Bình luận',
            commentsCount: '{n} bình luận',
            commentsLeave: 'Bình luận',
            commentsExpand: 'Mở rộng',
            commentsCollapse: 'Thu gọn',
            commentsPlaceholder: 'Viết bình luận...',
            commentsFilterSpam: 'Lọc rác',
            commentsCopyAll: 'Sao chép tất cả',
            commentsLoadMore: 'Tải thêm',
            commentsLoading: 'Đang tải bình luận...',
            commentsNoComments: 'Chưa có bình luận nào',
            commentsError: 'Không thể tải bình luận',
            tabJable: 'Bình luận Jable.tv',
            tabJavlibComment: 'Bình luận JAVLib',
            tabJavlibReview: 'Bài viết JAVLib',
            tabComments: 'Bình luận',
            autoQuality: 'Chất lượng tự động',
            helpImprove: 'Giúp cải thiện',
            helpImproveDesc: 'Thu thập dữ liệu cần thiết để cải thiện tính năng',
            pauseOnBlur: 'Dừng phát khi mất tiêu điểm',
            pauseOnBlurDesc: 'Tự động tạm dừng khi chuyển tab hoặc mất tiêu điểm',
            webdavTitle: 'Đồng bộ đám mây (WebDAV)',
            webdavServerUrl: 'Địa chỉ máy chủ',
            webdavUsername: 'Tên người dùng',
            webdavPassword: 'Mật khẩu / Token ứng dụng',
            webdavBackupPath: 'Đường dẫn thư mục sao lưu',
            webdavCurrentDevice: 'Thiết bị hiện tại',
            webdavTestConnection: 'Kiểm tra kết nối',
            webdavSyncMerge: 'Đồng bộ hợp nhất thông minh',
            webdavUploadOverwrite: 'Ghi đè tải lên (Cục bộ -> Đám mây)',
            webdavDownloadOverwrite: 'Ghi đè tải xuống (Đám mây -> Cục bộ)',
            webdavTesting: 'Đang kiểm tra kết nối...',
            webdavTestSuccess: 'Đã xác minh kết nối WebDAV và thư mục!',
            webdavTestFailed: 'Kết nối thất bại, kiểm tra URL hoặc thông tin xác thực',
            webdavSyncing: 'Đang đồng bộ dữ liệu...',
            webdavSyncSuccess: 'Đồng bộ đám mây đã hoàn tất thành công!',
            webdavSyncFailed: 'Đồng bộ thất bại: ',
            webdavLastSync: 'Lần đồng bộ trước',
            webdavNeverSynced: 'Chưa đồng bộ',
            webdavAutoSync: 'Tự động đồng bộ hợp nhất',
            webdavAutoSyncDesc: 'Tự động đồng bộ dưới nền khi khởi chạy trình phát và thay đổi điểm đánh dấu',
            webdavConfirmUpload: 'Bạn có chắc muốn ghi đè cấu hình cục bộ lên đám mây? Việc này sẽ thay thế bản sao lưu trên WebDAV.',
            webdavConfirmDownload: 'Bạn có chắc muốn tải xuống và ghi đè cấu hình cục bộ? Việc này sẽ thay thế cài đặt và điểm đánh dấu trên thiết bị này.',
            
            // 消息提示
            loadingError: 'Không thể tải video',
            networkError: 'Lỗi mạng',
            loginSuccess: 'Đăng nhập thành công',
            loginFailed: 'Đăng nhập thất bại',
            
            // 登录模块
            login_accountNull: 'Lỗi: Email hoặc mật khẩu trống.',
            login_success: 'Đăng nhập thành công, đang làm mới trang.',
            login_networkFailed: 'Lỗi mã trạng thái.',
            login_failed: 'Đăng nhập không thành công, email hoặc mật khẩu không chính xác. Xem chi tiết lỗi trên bảng điều khiển.',
            login_autoLogin: 'Đăng nhập tự động'
        }
    };
    
    /**
     * 翻译函数 - 将ID转换为当前语言的字符串
     * @param {string} id - 要翻译的字符串ID
     * @param {string} [lang=''] - 可选的指定语言，默认使用用户语言
     * @returns {string} 翻译后的字符串
     */
    static translate(id, lang = '') {
        const selectedLang = lang || this.userLang;
        // 首先尝试精确匹配语言代码，然后尝试匹配语言前缀，最后使用英语作为后备
        const langObj = 
            this.strings[selectedLang] || 
            this.strings[selectedLang.split('-')[0]] || 
            this.strings.en;
            
        return langObj[id] || this.strings.en[id];
    }
}

/**
 * 简便的翻译函数，可直接在代码中使用
 * @param {string} id - 要翻译的字符串ID
 * @param {string} [lang=''] - 可选的指定语言，默认使用用户语言
 * @returns {string} 翻译后的字符串
 */
export function __(id, lang = '') {
    return I18n.translate(id, lang);
} 