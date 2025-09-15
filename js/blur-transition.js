/**
 * 实现加载图隐藏时的模糊转清晰动画
 *
 * @format
 */

// 当DOM加载完成后执行
document.addEventListener("DOMContentLoaded", function () {
    // 获取模糊效果的元素
    const blurEffect = document.querySelector(".blur-effect");

    // 如果元素不存在，尝试创建一个
    if (!blurEffect) {
        createBlurElement();
    }

    // 初始调用一次以设置初始状态 - 保持初始模糊效果用于加载过程
    if (blurEffect) {
        blurEffect.style.backdropFilter = "blur(10px)";
        blurEffect.style.webkitBackdropFilter = "blur(10px)";
        blurEffect.style.transition =
            "backdrop-filter 0.8s ease, -webkit-backdrop-filter 0.8s ease";
    }
});

/**
 * 创建模糊效果元素
 */
function createBlurElement() {
    const blurEffect = document.createElement("div");
    blurEffect.classList.add("blur-effect");
    blurEffect.style.backdropFilter = "blur(10px)";
    blurEffect.style.webkitBackdropFilter = "blur(10px)";
    blurEffect.style.transition =
        "backdrop-filter 0.8s ease, -webkit-backdrop-filter 0.8s ease";
    document.body.insertBefore(blurEffect, document.body.firstChild);
}

/**
 * 加载完成时执行的模糊转清晰动画
 */
function animateBlurToClear() {
    const blurEffect = document.querySelector(".blur-effect");
    if (!blurEffect) return;

    // 设置模糊度从10px逐渐减少到0px
    blurEffect.style.backdropFilter = "blur(0px)";
    blurEffect.style.webkitBackdropFilter = "blur(0px)";

    // 动画结束后隐藏模糊层
    setTimeout(() => {
        blurEffect.style.display = "none";
    }, 800);
}

// 导出动画函数，供loader.js调用
window.animateBlurToClear = animateBlurToClear;
