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
    
    // 获取资源基础URL
    function getResourceBaseUrl() {
        if (isLocalDevelopment()) {
            return window.location.origin;
        } else {
            return 'https://bysunling.com';
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
    
    // 主加载函数
    function loadSharedResources() {
        const baseUrl = getResourceBaseUrl();
        const isLocal = isLocalDevelopment();
        
        // 加载共享CSS
        const cssPath = isLocal ? '/styles/shared.css' : `${baseUrl}/styles/shared.css`;
        loadCSS(cssPath);
        
        // 加载共享JavaScript
        const jsPath = isLocal ? '/scripts/shared.js' : `${baseUrl}/scripts/shared.js`;
        loadJS(jsPath, function() {
            console.log('Shared resources loaded successfully');
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
    
})();