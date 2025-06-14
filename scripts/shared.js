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
            // 生产环境使用主域名
            return 'https://bysunling.com';
        }
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
        this.token = localStorage.getItem('authToken');
        this.user = this.getUser();
    }

    // 获取用户信息
    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!(this.token && this.user);
    }

    // 登录
    async login(email, password) {
        try {
            const apiUrl = envConfig.getResourceUrl('/.netlify/functions/authHandler');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
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
            const apiUrl = envConfig.getResourceUrl('/.netlify/functions/authHandler');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'register',
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

    // 退出登录
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // 如果在主域名，跳转到首页，否则跳转到主域名
        if (window.location.hostname === 'bysunling.com' || envConfig.isLocalDev) {
            window.location.href = '/index.html';
        } else {
            window.location.href = envConfig.baseUrl;
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
    avatar.textContent = '🧑‍💻';
    
    const logo = document.createElement('a');
    logo.href = envConfig.isLocalDev ? '/' : envConfig.baseUrl;
    logo.className = 'logo';
    logo.innerHTML = '🌟 <span class="site-name">bysunling.com</span>';
    
    logoContainer.appendChild(avatar);
    logoContainer.appendChild(logo);
    
    // Slogan
    const slogan = document.createElement('div');
    slogan.className = 'slogan';
    slogan.innerHTML = '✨ 记录、分享、慢慢生长 🌱';
    
    leftSection.appendChild(logoContainer);
    leftSection.appendChild(slogan);
    
    // 中间区域：导航
    const navSection = document.createElement('nav');
    navSection.className = 'header-nav';
    
    const navItems = [
        { text: '📝 博客', url: 'https://blog.bysunling.com', emoji: '📚' },
        { text: '🎴 卡片', url: 'https://cards.bysunling.com', emoji: '💫' },
        { text: '🎉 活动', url: 'https://meetup.bysunling.com', emoji: '🎊' },
        { text: '🛠️ 工具', url: 'https://tools.bysunling.com', emoji: '⚡' }
    ];
    
    navItems.forEach(item => {
        const navLink = document.createElement('a');
        navLink.href = item.url;
        navLink.className = 'nav-link';
        navLink.innerHTML = `${item.emoji} ${item.text.split(' ')[1]}`;
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
    aboutLink.innerHTML = '🙋‍♂️ 关于我';
    
    // 认证区域
    const authSection = document.createElement('div');
    authSection.className = 'auth-section';
    
    if (authManager.isLoggedIn()) {
        // 已登录状态
        const userInfo = document.createElement('span');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `👋 ${authManager.user.name || authManager.user.username}`;
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '👋 退出';
        logoutBtn.onclick = () => authManager.logout();
        
        authSection.appendChild(userInfo);
        authSection.appendChild(logoutBtn);
    } else {
        // 未登录状态
        const loginLink = document.createElement('a');
        loginLink.href = envConfig.getResourceUrl('/auth.html');
        loginLink.innerHTML = '🔐 登录/注册';
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
    signature.innerHTML = '💫 做喜欢的事，认识有趣的人 ✨';
    
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

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authManager, createSharedHeader, createSharedFooter, initSharedComponents };
}