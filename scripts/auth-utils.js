/**
 * 跨子域名认证工具库
 * 支持Cookie和localStorage双重存储，确保跨子域名访问
 */

class CrossDomainAuth {
    constructor() {
        this.init();
    }

    init() {
        // 初始化时同步认证数据
        this.syncAuthData();
    }

    // Cookie 操作函数
    setCookie(name, value, days = 7) {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        const isLocalDev = this.isLocalDevelopment();
        
        if (isLocalDev) {
            // 本地开发环境不设置domain
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;
        } else {
            // 生产环境设置跨子域名的Cookie
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; domain=.bysunling.com; path=/; secure; samesite=lax`;
        }
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    deleteCookie(name) {
        const isLocalDev = this.isLocalDevelopment();
        
        if (isLocalDev) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        } else {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.bysunling.com; path=/;`;
        }
    }

    // 检查是否为本地开发环境
    isLocalDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' ||
               hostname.startsWith('192.168.') ||
               hostname.startsWith('10.') ||
               hostname.endsWith('.local');
    }

    // 保存认证信息
    saveAuth(token, user) {
        // 保存到Cookie（支持跨子域名）
        this.setCookie('authToken', token);
        this.setCookie('user', JSON.stringify(user));
        
        // 同时保存到localStorage（当前域名快速访问）
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    // 获取认证Token
    getToken() {
        // 优先从Cookie获取（支持跨子域名）
        let token = this.getCookie('authToken');
        
        // 如果Cookie中没有，尝试从localStorage获取
        if (!token) {
            token = localStorage.getItem('authToken');
            
            // 如果localStorage中有数据，同步到Cookie
            if (token) {
                this.setCookie('authToken', token);
            }
        } else {
            // 如果Cookie中有数据，同步到localStorage
            localStorage.setItem('authToken', token);
        }
        
        return token;
    }

    // 获取用户信息
    getUser() {
        // 优先从Cookie获取
        let userStr = this.getCookie('user');
        
        // 如果Cookie中没有，尝试从localStorage获取
        if (!userStr) {
            userStr = localStorage.getItem('user');
            
            // 如果localStorage中有数据，同步到Cookie
            if (userStr) {
                this.setCookie('user', userStr);
            }
        } else {
            // 如果Cookie中有数据，同步到localStorage
            localStorage.setItem('user', userStr);
        }
        
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Failed to parse user data:', e);
                return null;
            }
        }
        
        return null;
    }

    // 检查是否已登录
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    // 同步认证数据
    syncAuthData() {
        const token = this.getToken();
        const user = this.getUser();
        
        if (token && user) {
            // 确保Cookie和localStorage都有数据
            this.saveAuth(token, user);
        }
    }

    // 清除认证信息
    clearAuth() {
        // 清除Cookie
        this.deleteCookie('authToken');
        this.deleteCookie('user');
        
        // 清除localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // 智能跳转到登录页面
    redirectToLogin(currentUrl = null) {
        const hostname = window.location.hostname;
        const isLocalDev = this.isLocalDevelopment();
        const redirectParam = currentUrl ? `?redirect=${encodeURIComponent(currentUrl)}` : '';
        
        if (isLocalDev || hostname === 'bysunling.com') {
            // 在主域名或本地开发环境，跳转到当前域名的登录页
            window.location.href = `auth.html${redirectParam}`;
        } else if (hostname.endsWith('.bysunling.com')) {
            // 在子域名，跳转到主域名的登录页
            window.location.href = `https://bysunling.com/auth.html${redirectParam}`;
        } else {
            // 其他情况，跳转到主域名的登录页
            window.location.href = `https://bysunling.com/auth.html${redirectParam}`;
        }
    }

    // 智能跳转到首页
    redirectToHome() {
        const hostname = window.location.hostname;
        const isLocalDev = this.isLocalDevelopment();
        
        if (isLocalDev || hostname === 'bysunling.com') {
            // 在主域名或本地开发环境，跳转到当前域名的首页
            window.location.href = 'index.html?login=success';
        } else if (hostname.endsWith('.bysunling.com')) {
            // 在子域名，跳转回子域名的首页
            window.location.href = '/index.html?login=success';
        } else {
            // 其他情况，跳转到主域名
            window.location.href = 'https://bysunling.com/index.html?login=success';
        }
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.crossDomainAuth = new CrossDomainAuth();
}

// 导出类（支持模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossDomainAuth;
}