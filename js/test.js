// ===== 功能测试脚本 =====

// 检查页面元素是否正确加载
function checkPageElements() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[页面测试] ${timestamp} ===== 页面元素检查开始 =====`);
    
    // 检查核心结构元素
    console.log(`[页面测试] 开始检查核心HTML结构元素`);
    const body = document.body;
    const head = document.head;
    const metaViewport = document.querySelector('meta[name="viewport"]');
    
    console.log(`[页面测试] 文档结构 - Body存在: ${!!body}, Head存在: ${!!head}, Viewport元标签存在: ${!!metaViewport}`);
    
    // 检查导航栏元素
    console.log(`[页面测试] 开始检查导航栏元素`);
    const topNav = document.querySelector('.top-nav');
    const navLogo = document.querySelector('.nav-logo img');
    const langBtn = document.getElementById('lang-toggle');
    const bgBtn = document.getElementById('bg-toggle');
    
    console.log(`[页面测试] 导航栏存在: ${!!topNav}`);
    console.log(`[页面测试] Logo存在: ${!!navLogo}${navLogo ? `, 图片地址: ${navLogo.src}` : ''}`);
    console.log(`[页面测试] 语言切换按钮存在: ${!!langBtn}`);
    console.log(`[页面测试] 背景切换按钮存在: ${!!bgBtn}`);
    
    // 检查英雄区域和打字效果元素
    console.log(`[页面测试] 开始检查内容区域元素`);
    const heroSection = document.querySelector('.hero-section');
    const typingText = document.querySelector('.typing-text');
    const contentSections = document.querySelectorAll('.screen-section');
    
    console.log(`[页面测试] 英雄区域存在: ${!!heroSection}`);
    console.log(`[页面测试] 打字效果元素存在: ${!!typingText}`);
    console.log(`[页面测试] 屏幕区域数量: ${contentSections.length}`);
    
    // 检查服务器状态显示元素
    console.log(`[页面测试] 开始检查服务器状态显示元素`);
    const serverStatusElements = [
        'openlist-status', 
        'photo-status', 
        'fnos-status', 
        'libretv-status', 
        'moontv-status',
        'moon-primary-status'
    ];
    
    serverStatusElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`[页面测试] 服务器状态元素 ${id} 存在: ${!!element}`);
    });
    
    // 检查主题和语言设置
    console.log(`[页面测试] 开始检查主题和语言设置`);
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const currentLanguage = window.currentLanguage || 'unknown';
    
    console.log(`[页面测试] 当前主题: ${currentTheme || '未设置'}`);
    console.log(`[页面测试] 当前语言: ${currentLanguage}`);
    
    // 检查加载状态
    console.log(`[页面测试] 开始检查加载状态`);
    const isLoadingComplete = typeof window.loadingStates === 'object' && 
                             window.loadingStates.loadingImageReady && 
                             window.loadingStates.firstBackgroundLoaded && 
                             window.loadingStates.readmeLoaded;
    
    console.log(`[页面测试] 页面加载完成状态: ${isLoadingComplete}`);
    
    console.log(`[页面测试] ${timestamp} ===== 页面元素检查完成 =====`);
}

// 测试语言切换功能
// function testLanguageToggle() {
//     console.log('\n===== 语言切换测试 =====');
//     const originalLang = window.currentLanguage;

//     console.log('切换前语言:', originalLang);
//     if (window.toggleLanguage) {
//         window.toggleLanguage();
//         console.log('切换后语言:', window.currentLanguage);

//         // 切换回原语言
//         setTimeout(() => {
//             window.toggleLanguage();
//             console.log('切换回原语言:', window.currentLanguage);
//         }, 2000);
//     }
// }

// 检查是否已经执行过测试，防止重复执行
if (!window._pageTestExecuted) {
    window._pageTestExecuted = true;
    
    // 页面加载完成后执行测试
document.addEventListener('DOMContentLoaded', function() {
    // 等待页面完全初始化
    setTimeout(() => {
        console.log('[页面测试] 开始执行页面元素检查...');
        checkPageElements();
        // testLanguageToggle();  // 已注释掉的函数，暂不调用

        const timestamp = new Date().toLocaleTimeString();
        console.log(`\n[页面测试] ${timestamp} ===== 所有测试完成 =====`);
        console.log('[页面测试] 请检查页面效果是否符合预期。');
    }, 1500);
});
} else {
    console.log('[页面测试] 测试已执行，跳过重复调用');
}
