// 动态加载共享资源的辅助脚本
// 这个脚本可以被其他页面引用，自动加载正确的共享CSS和JS

(function() {
    'use strict';
    
    // 环境检测
    function isLocalDevelopment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.startsWith('192.168.') || 
               hostname.startsWith('10.') || 
               hostname.endsWith('.local');
    }
    
    // 获取资源基础URL - 静态header模式，始终从主域名加载
    function getResourceBaseUrl() {
        if (isLocalDevelopment()) {
            return window.location.origin;
        } else {
            // 生产环境始终从主域名加载，确保header的一致性
            return 'https://bysunling.com';
        }
    }
    
    // 设置跨子域名的cookie和localStorage
    function setupCrossDomainAuth() {
        // 如果不是本地开发环境，设置cookie的domain为主域名
        if (!isLocalDevelopment()) {
            // 监听localStorage变化，同步认证状态到所有子域名
            window.addEventListener('storage', function(e) {
                if (e.key === 'authToken' || e.key === 'user') {
                    // 认证状态发生变化时，可以触发页面更新
                    if (window.updateAuthStatus) {
                        window.updateAuthStatus();
                    }
                }
            });
        }
    }
    
    // 动态加载CSS
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
        return link;
    }
    
    // 动态加载JavaScript
    function loadJS(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = function() {
            console.error('Failed to load script:', src);
        };
        document.head.appendChild(script);
        return script;
    }
    
    // 主加载函数 - 静态header模式
    function loadSharedResources() {
        const baseUrl = getResourceBaseUrl();
        const isLocal = isLocalDevelopment();
        
        // 设置跨域认证支持
        setupCrossDomainAuth();
        
        // 加载共享CSS - 始终从主域名加载确保样式一致性
        const cssPath = isLocal ? '/styles/shared.css' : `${baseUrl}/styles/shared.css`;
        loadCSS(cssPath);
        
        // 加载共享JavaScript - 始终从主域名加载确保功能一致性
        const jsPath = isLocal ? '/scripts/shared.js' : `${baseUrl}/scripts/shared.js`;
        loadJS(jsPath, function() {
            console.log('Shared resources loaded successfully');
            // 加载完成后，确保认证状态同步
            if (window.syncAuthStatus) {
                window.syncAuthStatus();
            }
        });
    }
    
    // 页面加载完成后自动加载资源
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSharedResources);
    } else {
        loadSharedResources();
    }
    
    // 导出函数供手动调用
    window.loadSharedResources = loadSharedResources;
    window.getResourceBaseUrl = getResourceBaseUrl;
    window.isLocalDevelopment = isLocalDevelopment;
    window.setupCrossDomainAuth = setupCrossDomainAuth;
    
    // 跨域认证状态同步函数
    window.syncAuthStatus = function() {
        // 检查认证状态并更新UI
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (token && user && window.authManager) {
            window.authManager.token = token;
            window.authManager.user = JSON.parse(user);
            // 如果有更新认证UI的函数，调用它
            if (window.updateAuthUI) {
                window.updateAuthUI();
            }
        }
    };
    
})();