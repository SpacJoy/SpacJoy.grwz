// lenis-init.js
// 用于初始化 Lenis 平滑滚动

// 测试函数，用于验证滚动功能
window.testScrollFunction = function() {
    console.log('测试滚动功能');
    const heroSection = document.getElementById('hero-section');
    if (heroSection && heroSection.nextElementSibling) {
        const nextSection = heroSection.nextElementSibling;
        console.log('找到下一个section:', nextSection);
        
        if (window.lenis) {
            console.log('使用Lenis进行测试滚动');
            window.lenis.scrollTo(nextSection, {
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        } else {
            console.log('使用原生滚动进行测试');
            nextSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
};

// 等待 DOM 完全加载后初始化
document.addEventListener("DOMContentLoaded", function () {
    // 检查 Lenis 是否已加载
    if (typeof Lenis !== "undefined") {
        console.log("Lenis loaded, initializing smooth scroll...");

        // 将lenis实例暴露到window对象上，以便在其他脚本中使用
        window.lenis = new Lenis({
            smooth: true,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: "vertical",
            gestureDirection: "vertical",
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        console.log("Lenis smooth scroll initialized successfully");
    } else {
        console.error("Lenis 未加载，无法启用平滑滚动");
    }
});
