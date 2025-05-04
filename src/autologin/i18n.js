/**
 * 多语言系统 - 用于自动登录功能的国际化支持
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
     * 语言字符串集合
     * @type {Object}
     */
    static strings = {
        'en': {
            accountNull: 'Error: Email or password is empty.',
            loginSuccess: 'Login successful, refreshing the page.',
            networkFailed: 'Status code error.',
            loginFailed: 'Login failed, incorrect email or password. Check console for error details.',
            autoLogin: 'Auto Login'
        },
        'zh-CN': {
            accountNull: '邮箱或密码为空',
            loginSuccess: '登录成功，即将刷新页面。',
            networkFailed: '状态码错误',
            loginFailed: '登录失败，邮箱或密码错误，可以在控制台查看错误信息。',
            autoLogin: '自动登录'
        },
        'zh-TW': {
            accountNull: '郵箱或密碼為空',
            loginSuccess: '登錄成功，即將刷新頁面。',
            networkFailed: '狀態碼錯誤',
            loginFailed: '登錄失敗，郵箱或密碼錯誤，可以在控制台查看錯誤信息。',
            autoLogin: '自動登錄'
        },
        'ja': {
            accountNull: 'エラー：メールアドレスまたはパスワードが空です。',
            loginSuccess: 'ログイン成功、ページを更新します。',
            networkFailed: 'ステータスコードエラー',
            loginFailed: 'ログインに失敗しました。メールアドレスまたはパスワードが間違っています。エラーの詳細はコンソールで確認できます。',
            autoLogin: '自動ログイン'
        },
        'vi': {
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
        return (this.strings[selectedLang] || this.strings.en)[id] || this.strings.en[id];
    }
} 