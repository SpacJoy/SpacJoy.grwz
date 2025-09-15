// scroll-animation.js - 处理页面滚动动画效果

// 检查元素是否在视口中
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
        rect.left >= 0 &&
        rect.bottom >= 0 &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// 检查并激活元素动画
function checkAndAnimateElements() {
    const articles = document.querySelectorAll('article:not(.animate-in)');
    
    articles.forEach((article, index) => {
        if (isElementInViewport(article)) {
            // 为不同卡片添加延迟，创建级联效果
            setTimeout(() => {
                article.classList.add('animate-in');
            }, index * 100);
        }
    });
}

// 初始化滚动动画
function initScrollAnimation() {
    // 初始检查
    checkAndAnimateElements();
    
    // 滚动时检查
    window.addEventListener('scroll', checkAndAnimateElements);
    
    // 窗口大小改变时检查
    window.addEventListener('resize', checkAndAnimateElements);
    
    console.log('滚动动画初始化完成');
}

// 导出函数供外部调用
window.initScrollAnimation = initScrollAnimation;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (window.initScrollAnimation) {
        // 稍微延迟初始化，确保其他内容加载完成
        setTimeout(() => {
            initScrollAnimation();
        }, 300);
    }
});