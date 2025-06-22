// 共享JavaScript文件 - 适用于所有子域名

// 环境检测和URL配置
class EnvironmentConfig {
    constructor() {
        this.isLocalDev = this.detectLocalDevelopment();
        this.baseUrl = this.getBaseUrl();
    }

    // 检测是否为本地开发环境
    detectLocalDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.startsWith('192.168.') || 
               hostname.startsWith('10.') || 
               hostname.endsWith('.local');
    }

    // 获取基础URL
    getBaseUrl() {
        if (this.isLocalDev) {
            // 本地开发环境使用相对路径
            return window.location.origin;
        } else {
            // 生产环境使用主域名 - 静态header模式
            return 'https://bysunling.com';
        }
    }
    
    // 获取当前域名信息
    getCurrentDomain() {
        return window.location.hostname;
    }
    
    // 检查是否为子域名
    isSubdomain() {
        const hostname = this.getCurrentDomain();
        return !this.isLocalDev && hostname !== 'bysunling.com' && hostname.endsWith('.bysunling.com');
    }

    // 获取资源URL
    getResourceUrl(path) {
        if (this.isLocalDev) {
            return path; // 本地使用相对路径
        } else {
            return `${this.baseUrl}${path}`; // 生产环境使用完整URL
        }
    }
}

// 创建全局环境配置实例
const envConfig = new EnvironmentConfig();

// 认证相关函数
class AuthManager {
    constructor() {
        // 优先从Cookie获取认证信息
        this.token = this.getCookie('authToken') || localStorage.getItem('authToken');
        this.user = this.getUser();
        
        // 同步数据到Cookie和localStorage
        this.syncAuthData();
    }

    // Cookie 操作函数
    setCookie(name, value, days = 7) {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        const isLocalDev = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.startsWith('192.168.') ||
                          window.location.hostname.startsWith('10.') ||
                          window.location.hostname.endsWith('.local');
        
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
        const isLocalDev = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.startsWith('192.168.') ||
                          window.location.hostname.startsWith('10.') ||
                          window.location.hostname.endsWith('.local');
        
        if (isLocalDev) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        } else {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.bysunling.com; path=/;`;
        }
    }

    // 同步认证数据到Cookie和localStorage
    syncAuthData() {
        if (this.token) {
            this.setCookie('authToken', this.token);
            localStorage.setItem('authToken', this.token);
        }
        if (this.user) {
            this.setCookie('user', JSON.stringify(this.user));
            localStorage.setItem('user', JSON.stringify(this.user));
        }
    }

    // 获取用户信息
    getUser() {
        // 优先从Cookie获取
        let userStr = this.getCookie('user');
        if (!userStr) {
            userStr = localStorage.getItem('user');
        }
        return userStr ? JSON.parse(userStr) : null;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!(this.token && this.user);
    }

    // 登录 - 支持跨子域名
    async login(email, password) {
        try {
            // 始终使用主域名的API
            const apiUrl = `${envConfig.baseUrl}/.netlify/functions/login`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                // 保存到Cookie（支持跨子域名）和localStorage
                this.setCookie('authToken', data.token);
                this.setCookie('user', JSON.stringify(data.user));
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // 触发认证状态更新
                this.broadcastAuthChange();
                
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error || '登录失败' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }

    // 注册
    async register(name, username, email, password) {
        try {
            const apiUrl = envConfig.getResourceUrl('/.netlify/functions/register');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: '注册成功！请登录您的账户。' };
            } else {
                return { success: false, error: data.error || '注册失败' };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: '网络错误，请稍后重试' };
        }
    }

    // 退出登录 - 支持跨子域名
    logout() {
        this.token = null;
        this.user = null;
        
        // 清除Cookie
        this.deleteCookie('authToken');
        this.deleteCookie('user');
        
        // 清除localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // 触发认证状态更新
        this.broadcastAuthChange();
        
        // 更新当前页面的UI
        this.updateAuthUI();
        
        // 如果在主域名，跳转到首页，否则跳转到主域名
        if (window.location.hostname === 'bysunling.com' || envConfig.isLocalDev) {
            window.location.href = '/index.html';
        } else {
            window.location.href = envConfig.baseUrl;
        }
    }
    
    // 广播认证状态变化（用于跨标签页同步）
    broadcastAuthChange() {
        // 触发storage事件，通知其他标签页
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'authToken',
            newValue: this.token,
            url: window.location.href
        }));
    }
    
    // 更新认证UI
    updateAuthUI() {
        const authSection = document.querySelector('.auth-section');
        if (authSection) {
            // 清空现有内容
            authSection.innerHTML = '';
            
            if (this.isLoggedIn()) {
                // 已登录状态
                const userInfo = document.createElement('span');
                userInfo.className = 'user-info';
                userInfo.innerHTML = `${this.user.name || this.user.username}`;
                
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'logout-btn';
                logoutBtn.innerHTML = '退出';
                logoutBtn.onclick = () => this.logout();
                
                authSection.appendChild(userInfo);
                authSection.appendChild(logoutBtn);
            } else {
                // 未登录状态
                const loginLink = document.createElement('a');
                loginLink.href = envConfig.getResourceUrl('/auth');
                loginLink.innerHTML = '登录';
                loginLink.className = 'login-link';
                
                authSection.appendChild(loginLink);
            }
        }
    }
}

// 创建全局认证管理器实例
const authManager = new AuthManager();

// Header组件
function createSharedHeader() {
    const header = document.createElement('div');
    header.className = 'shared-header';
    
    // 主要内容容器
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';
    
    // 左侧区域：Logo + 头像 + Slogan
    const leftSection = document.createElement('div');
    leftSection.className = 'header-left';
    
    // Logo和头像容器
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'LS';
    
    const logo = document.createElement('a');
    logo.href = envConfig.isLocalDev ? '/' : envConfig.baseUrl;
    logo.className = 'logo';
    logo.innerHTML = '<span class="site-name">bysunling.com</span>';
    
    logoContainer.appendChild(avatar);
    logoContainer.appendChild(logo);
    
    // Slogan
    const slogan = document.createElement('div');
    slogan.className = 'slogan';
    slogan.innerHTML = '记录、分享、慢慢生长';
    
    leftSection.appendChild(logoContainer);
    leftSection.appendChild(slogan);
    
    // 中间区域：导航
    const navSection = document.createElement('nav');
    navSection.className = 'header-nav';
    
    const navItems = [
        { text: '博客', url: 'https://blog.bysunling.com' },
        { text: '卡片', url: 'https://cards.bysunling.com' },
        { text: '活动', url: 'https://meetup.bysunling.com' },
        { text: '工具', url: 'https://tools.bysunling.com' }
    ];
    
    navItems.forEach(item => {
        const navLink = document.createElement('a');
        navLink.href = item.url;
        navLink.className = 'nav-link';
        navLink.innerHTML = item.text;
        navLink.title = item.text;
        navSection.appendChild(navLink);
    });
    
    // 右侧区域：关于我 + 认证
    const rightSection = document.createElement('div');
    rightSection.className = 'header-right';
    
    // 关于我链接
    const aboutLink = document.createElement('a');
    aboutLink.href = envConfig.getResourceUrl('/about.html');
    aboutLink.className = 'about-link';
    aboutLink.innerHTML = '关于我';
    
    // 认证区域
    const authSection = document.createElement('div');
    authSection.className = 'auth-section';
    
    if (authManager.isLoggedIn()) {
        // 已登录状态
        const userInfo = document.createElement('span');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `${authManager.user.name || authManager.user.username}`;
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '退出';
        logoutBtn.onclick = () => authManager.logout();
        
        authSection.appendChild(userInfo);
        authSection.appendChild(logoutBtn);
    } else {
        // 未登录状态
        const loginLink = document.createElement('a');
        loginLink.href = envConfig.getResourceUrl('/auth');
        loginLink.innerHTML = '登录';
        loginLink.className = 'login-link';
        
        authSection.appendChild(loginLink);
    }
    
    rightSection.appendChild(aboutLink);
    rightSection.appendChild(authSection);
    
    // 组装header
    headerContent.appendChild(leftSection);
    headerContent.appendChild(navSection);
    headerContent.appendChild(rightSection);
    header.appendChild(headerContent);
    
    return header;
}

// Footer组件
function createSharedFooter() {
    const footer = document.createElement('div');
    footer.className = 'shared-footer';
    
    // Footer内容容器 - 横向布局
    const footerContent = document.createElement('div');
    footerContent.className = 'footer-content';
    
    // 左侧：个性签名
    const leftSection = document.createElement('div');
    leftSection.className = 'footer-left';
    
    const signature = document.createElement('div');
    signature.className = 'signature';
    signature.innerHTML = '做喜欢的事，认识有趣的人';
    
    leftSection.appendChild(signature);
    
    // 中间：友情链接
    const centerSection = document.createElement('div');
    centerSection.className = 'footer-center';
    
    const friendsContainer = document.createElement('div');
    friendsContainer.className = 'friends-container';
    
    const friendsTitle = document.createElement('span');
    friendsTitle.className = 'friends-title';
    // friendsTitle.innerHTML = '🤝 友情链接:';
    
    const friendsLinks = document.createElement('div');
    friendsLinks.className = 'friends-links';
    
    // 示例友情链接，可以根据需要修改
    const friends = [
        // { name: '🌸 小伙伴A', url: '#' },
        // { name: '🎨 设计师B', url: '#' },
        // { name: '💻 开发者C', url: '#' }
    ];
    
    friends.forEach(friend => {
        const friendLink = document.createElement('a');
        friendLink.href = friend.url;
        friendLink.textContent = friend.name;
        friendLink.className = 'friend-link';
        friendsLinks.appendChild(friendLink);
    });
    
    friendsContainer.appendChild(friendsTitle);
    friendsContainer.appendChild(friendsLinks);
    centerSection.appendChild(friendsContainer);
    
    // 右侧：版权和联系信息
    const rightSection = document.createElement('div');
    rightSection.className = 'footer-right';
    
    // 版权信息
    const copyright = document.createElement('div');
    copyright.className = 'copyright';
    copyright.innerHTML = '© 2025 bysunling.com';
    
    // 联系信息
    const contact = document.createElement('div');
    contact.className = 'contact';
    // contact.innerHTML = '📧 <a href="mailto:hello@bysunling.com">hello@bysunling.com</a>';
    
    rightSection.appendChild(copyright);
    rightSection.appendChild(contact);
    
    // 组装footer - 横向布局
    footerContent.appendChild(leftSection);
    footerContent.appendChild(centerSection);
    footerContent.appendChild(rightSection);
    footer.appendChild(footerContent);
    
    return footer;
}

// 初始化共享组件
function initSharedComponents() {
    // 检查是否需要添加共享header
    if (!document.querySelector('.shared-header') && !document.querySelector('.custom-header')) {
        const body = document.body;
        const header = createSharedHeader();
        body.insertBefore(header, body.firstChild);
    }
    
    // 检查是否需要添加共享footer
    if (!document.querySelector('.shared-footer') && !document.querySelector('.custom-footer')) {
        const footer = createSharedFooter();
        document.body.appendChild(footer);
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedComponents);
} else {
    initSharedComponents();
}

// 全局函数：更新认证状态（供dynamic-loader.js调用）
window.updateAuthStatus = function() {
    if (window.authManager) {
        // 重新读取localStorage中的认证信息
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            window.authManager.token = token;
            window.authManager.user = JSON.parse(userStr);
        } else {
            window.authManager.token = null;
            window.authManager.user = null;
        }
        
        // 更新UI
        window.authManager.updateAuthUI();
    }
};

// 全局函数：更新认证UI（供dynamic-loader.js调用）
window.updateAuthUI = function() {
    if (window.authManager) {
        window.authManager.updateAuthUI();
    }
};

// 监听localStorage变化，实现跨标签页认证状态同步
window.addEventListener('storage', function(e) {
    if (e.key === 'authToken' || e.key === 'user') {
        window.updateAuthStatus();
    }
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authManager, createSharedHeader, createSharedFooter, initSharedComponents };
}