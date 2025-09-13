// lenis-init.js
// 用于初始化 Lenis 平滑滚动

// 等待 DOM 完全加载后初始化
document.addEventListener("DOMContentLoaded", function () {
    // 检查 Lenis 是否已加载
    if (typeof Lenis !== "undefined") {
        console.log("Lenis loaded, initializing smooth scroll...");

        const lenis = new Lenis({
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
