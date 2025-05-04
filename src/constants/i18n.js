/**
 * 多语言系统 - 管理全局语言设置和翻译
 */
export class I18n {
    /**
     * 获取用户浏览器当前语言
     * @returns {string} 用户当前语言代码
     */
    static get userLang() {
        // 首先尝试从设置中获取语言，如果没有则使用浏览器语言
        const savedLang = localStorage.getItem('missplayer_language');
        if (savedLang) {
            return savedLang;
        }
        return (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    }
    
    /**
     * 设置用户语言
     * @param {string} lang - 语言代码
     */
    static setUserLang(lang) {
        if (this.supportedLanguages.includes(lang)) {
            localStorage.setItem('missplayer_language', lang);
            // 触发语言变更事件
            window.dispatchEvent(new CustomEvent('missplayer_language_changed', { detail: { lang } }));
            return true;
        }
        return false;
    }

    /**
     * 支持的语言列表
     */
    static supportedLanguages = ['en', 'zh-CN', 'zh-TW', 'ja', 'vi'];

    /**
     * 语言名称映射
     */
    static languageNames = {
        'en': 'English',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        'ja': '日本語',
        'vi': 'Tiếng Việt'
    };
    
    /**
     * 语言字符串集合
     * @type {Object}
     */
    static strings = {
        'en': {
            // 播放器控制
            play: 'Play',
            pause: 'Pause',
            mute: 'Mute',
            unmute: 'Unmute',
            fullscreen: 'Fullscreen',
            exitFullscreen: 'Exit Fullscreen',
            settings: 'Settings',
            close: 'Close',
            
            // 循环控制
            loop: 'Loop',
            loopStart: 'Loop Start',
            loopEnd: 'Loop End',
            
            // 时间控制
            seconds: 's',
            minutes: 'm',
            
            // 设置面板
            language: 'Language',
            showSeekButtons: 'Show Seek Buttons',
            showLoopControls: 'Show Loop Controls',
            showPlaybackControls: 'Show Playback Controls',
            showProgressBar: 'Show Progress Bar',
            
            // 播放速度
            speed: 'Speed',
            normal: 'Normal',
            
            // 登录相关
            accountNull: 'Error: Email or password is empty.',
            loginSuccess: 'Login successful, refreshing the page.',
            networkFailed: 'Status code error.',
            loginFailed: 'Login failed, incorrect email or password. Check console for error details.',
            autoLogin: 'Auto Login'
        },
        'zh-CN': {
            // 播放器控制
            play: '播放',
            pause: '暂停',
            mute: '静音',
            unmute: '取消静音',
            fullscreen: '全屏',
            exitFullscreen: '退出全屏',
            settings: '设置',
            close: '关闭',
            
            // 循环控制
            loop: '循环',
            loopStart: '循环开始',
            loopEnd: '循环结束',
            
            // 时间控制
            seconds: '秒',
            minutes: '分',
            
            // 设置面板
            language: '语言',
            showSeekButtons: '显示快进快退按钮',
            showLoopControls: '显示循环控制',
            showPlaybackControls: '显示播放控制',
            showProgressBar: '显示进度条',
            
            // 播放速度
            speed: '速度',
            normal: '正常',
            
            // 登录相关
            accountNull: '邮箱或密码为空',
            loginSuccess: '登录成功，即将刷新页面。',
            networkFailed: '状态码错误',
            loginFailed: '登录失败，邮箱或密码错误，可以在控制台查看错误信息。',
            autoLogin: '自动登录'
        },
        'zh-TW': {
            // 播放器控制
            play: '播放',
            pause: '暫停',
            mute: '靜音',
            unmute: '取消靜音',
            fullscreen: '全屏',
            exitFullscreen: '退出全屏',
            settings: '設置',
            close: '關閉',
            
            // 循环控制
            loop: '循環',
            loopStart: '循環開始',
            loopEnd: '循環結束',
            
            // 时间控制
            seconds: '秒',
            minutes: '分',
            
            // 设置面板
            language: '語言',
            showSeekButtons: '顯示快進快退按鈕',
            showLoopControls: '顯示循環控制',
            showPlaybackControls: '顯示播放控制',
            showProgressBar: '顯示進度條',
            
            // 播放速度
            speed: '速度',
            normal: '正常',
            
            // 登录相关
            accountNull: '郵箱或密碼為空',
            loginSuccess: '登錄成功，即將刷新頁面。',
            networkFailed: '狀態碼錯誤',
            loginFailed: '登錄失敗，郵箱或密碼錯誤，可以在控制台查看錯誤信息。',
            autoLogin: '自動登錄'
        },
        'ja': {
            // 播放器控制
            play: '再生',
            pause: '一時停止',
            mute: 'ミュート',
            unmute: 'ミュート解除',
            fullscreen: '全画面',
            exitFullscreen: '全画面終了',
            settings: '設定',
            close: '閉じる',
            
            // 循环控制
            loop: 'ループ',
            loopStart: 'ループ開始',
            loopEnd: 'ループ終了',
            
            // 时间控制
            seconds: '秒',
            minutes: '分',
            
            // 设置面板
            language: '言語',
            showSeekButtons: '早送り・巻き戻しボタンを表示',
            showLoopControls: 'ループコントロールを表示',
            showPlaybackControls: '再生コントロールを表示',
            showProgressBar: 'プログレスバーを表示',
            
            // 播放速度
            speed: '速度',
            normal: '標準',
            
            // 登录相关
            accountNull: 'エラー：メールアドレスまたはパスワードが空です。',
            loginSuccess: 'ログイン成功、ページを更新します。',
            networkFailed: 'ステータスコードエラー',
            loginFailed: 'ログインに失敗しました。メールアドレスまたはパスワードが間違っています。エラーの詳細はコンソールで確認できます。',
            autoLogin: '自動ログイン'
        },
        'vi': {
            // 播放器控制
            play: 'Phát',
            pause: 'Tạm dừng',
            mute: 'Tắt tiếng',
            unmute: 'Bật tiếng',
            fullscreen: 'Toàn màn hình',
            exitFullscreen: 'Thoát toàn màn hình',
            settings: 'Cài đặt',
            close: 'Đóng',
            
            // 循环控制
            loop: 'Lặp lại',
            loopStart: 'Bắt đầu lặp lại',
            loopEnd: 'Kết thúc lặp lại',
            
            // 时间控制
            seconds: 'giây',
            minutes: 'phút',
            
            // 设置面板
            language: 'Ngôn ngữ',
            showSeekButtons: 'Hiển thị nút tua nhanh',
            showLoopControls: 'Hiển thị điều khiển lặp lại',
            showPlaybackControls: 'Hiển thị điều khiển phát',
            showProgressBar: 'Hiển thị thanh tiến trình',
            
            // 播放速度
            speed: 'Tốc độ',
            normal: 'Bình thường',
            
            // 登录相关
            accountNull: 'Lỗi: Email hoặc mật khẩu trống.',
            loginSuccess: 'Đăng nhập thành công, đang làm mới trang.',
            networkFailed: 'Lỗi mã trạng thái.',
            loginFailed: 'Đăng nhập không thành công, email hoặc mật khẩu không chính xác. Xem chi tiết lỗi trên bảng điều khiển.',
            autoLogin: 'Đăng nhập tự động'
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
        const langStrings = this.strings[selectedLang] || this.strings.en;
        return langStrings[id] || this.strings.en[id] || id;
    }
}

// 简便的翻译函数，可以全局使用
export function __(id, lang = '') {
    return I18n.translate(id, lang);
} 