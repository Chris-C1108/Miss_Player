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
            autoQuality: 'Auto Quality',
            
            // 消息提示
            loadingError: 'Failed to load video',
            networkError: 'Network error',
            loginSuccess: 'Login successful',
            loginFailed: 'Login failed'
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
            autoQuality: '自动画质',
            
            // 消息提示
            loadingError: '视频加载失败',
            networkError: '网络错误',
            loginSuccess: '登录成功',
            loginFailed: '登录失败'
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
            autoQuality: '自動畫質',
            
            // 消息提示
            loadingError: '視頻加載失敗',
            networkError: '網絡錯誤',
            loginSuccess: '登錄成功',
            loginFailed: '登錄失敗'
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
            autoQuality: '自動画質',
            
            // 消息提示
            loadingError: '動画の読み込みに失敗しました',
            networkError: 'ネットワークエラー',
            loginSuccess: 'ログイン成功',
            loginFailed: 'ログイン失敗'
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
            autoQuality: 'Chất lượng tự động',
            
            // 消息提示
            loadingError: 'Không thể tải video',
            networkError: 'Lỗi mạng',
            loginSuccess: 'Đăng nhập thành công',
            loginFailed: 'Đăng nhập thất bại'
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