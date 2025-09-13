// ===== 功能测试脚本 =====

// 检查页面元素是否正确加载
function checkPageElements() {
    console.log('===== 页面元素检查 =====');
    
    // 检查导航栏元素
    const topNav = document.querySelector('.top-nav');
    const navLogo = document.querySelector('.nav-logo img');
    const langBtn = document.getElementById('lang-toggle');
    const bgBtn = document.getElementById('bg-toggle');
    
    console.log('导航栏存在:', !!topNav);
    console.log('Logo存在:', !!navLogo);
    console.log('语言切换按钮存在:', !!langBtn);
    console.log('背景切换按钮存在:', !!bgBtn);
    
    // 检查英雄区域和打字效果元素
    const heroSection = document.querySelector('.hero-section');
    const typingText = document.querySelector('.typing-text');
    
    console.log('英雄区域存在:', !!heroSection);
    console.log('打字效果元素存在:', !!typingText);
    
    // 检查主题设置
    const currentTheme = document.documentElement.getAttribute('data-theme');
    console.log('当前主题:', currentTheme);
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

// 页面加载完成后执行测试
document.addEventListener('DOMContentLoaded', function() {
    // 等待页面完全初始化
    setTimeout(() => {
        checkPageElements();
        // testLanguageToggle();  // 已注释掉的函数，暂不调用
        
        console.log('\n===== 测试完成 =====');
        console.log('请检查页面效果是否符合预期。');
    }, 1500);
});
