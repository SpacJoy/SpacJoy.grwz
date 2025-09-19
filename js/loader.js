// Loader management (loading image + CSS animation hide)
// 全局加载状态
window.loadingStates = {
    loadingImageReady: false,
    firstBackgroundLoaded: false,
    readmeLoaded: false,
    serversChecked: false, // 服务器检查状态，默认false
};

// 防止重复调用隐藏逻辑的标志
let hideLoaderScheduled = false;

// 检查是否可以隐藏 Loading
function checkCanHideLoader() {
    const states = window.loadingStates;
    // 需要首张背景图和README都加载完成
    if (
        states.loadingImageReady &&
        states.firstBackgroundLoaded &&
        states.readmeLoaded &&
        !hideLoaderScheduled
    ) {
        (window.logger || console).info(
            "[Loader] 首张背景图和README都已加载完成，0.8秒后隐藏 Loading"
        );
        hideLoaderScheduled = true; // 设置标志防止重复调用
        // 等待0.8秒后隐藏
        setTimeout(() => {
            hideLoader();
        }, 800);
        return true;
    }
    return false;
}

// 隐藏 Loading 的函数
function hideLoader() {
    if (window.loaderHidden) return;
    window.loaderHidden = true;

    const loaderEl = document.querySelector(".loader");
    const blurEl = document.querySelector(".blur-effect");
    if (!loaderEl) return;

    loaderEl.classList.add("loader-fade-out");
    loaderEl.addEventListener(
        "animationend",
        () => {
            if (loaderEl) loaderEl.style.display = "none";
            // 调用模糊转清晰动画，而不是直接隐藏模糊层
            if (window.animateBlurToClear) window.animateBlurToClear();
            setTimeout(() => {
                if (window.showScrollNotification)
                    window.showScrollNotification();
                // 移除重复的服务器检查调用
            }, 100);
            (window.logger || console).info("[Loader] Loader hidden");
        },
        { once: true }
    );
}

// 设置状态并检查隐藏条件
function setLoadingState(key, value) {
    window.loadingStates[key] = value;
    // 仅输出变更摘要，避免打印整个对象
    (window.logger || console).debug(`[Loader] ${key} = ${value}`);
    checkCanHideLoader();
}

window.setLoadingState = setLoadingState;
window.checkCanHideLoader = checkCanHideLoader;
(function initLoadingImage() {
    // 使用新的目录结构：bqb/AM（替换原：/res/loading）
    const RANDOM_ENDPOINT = "https://rad.ysy.146019.xyz/bqb/AM";
    const imgEl = document.getElementById("loading-gif");
    if (!imgEl) return;

    function applyCommonStyle() {
        imgEl.removeAttribute("width");
        imgEl.removeAttribute("height");
        imgEl.style.width = "";
        imgEl.style.height = "";
        imgEl.style.maxWidth = "60vmin";
        imgEl.style.maxHeight = "60vmin";
        imgEl.style.objectFit = "contain";
        imgEl.style.aspectRatio = "auto";
    }

    imgEl.onload = () => {
        (window.logger || console).debug("[Loader] Loading image loaded", {
            src: imgEl.src,
            size: imgEl.naturalWidth + "x" + imgEl.naturalHeight,
        });

        setLoadingState("loadingImageReady", true);

        // Loading图加载完后，同时开始加载首张背景图、README和服务器检查
        setTimeout(() => {
            (window.logger || console).info(
                "[Loader] Loading图加载完成，开始加载首张背景图和README"
            );
            if (window.loadFirstBackground) window.loadFirstBackground();
            if (window.loadReadmeContent) window.loadReadmeContent();
            if (window.checkAllServerStatus) window.checkAllServerStatus();
        }, 50);
    };
    imgEl.onerror = () => {
        (window.logger || console).warn(
            "[Loader] 随机接口加载失败，不再使用本地图片回退，将隐藏加载图。"
        );
        // 简单隐藏图片区域，保持 loader 其余逻辑继续
        imgEl.style.display = "none";
    };
    applyCommonStyle();
    const loadUrl = RANDOM_ENDPOINT + "?t=" + Date.now();
    (window.logger || console).info("[Loader] 开始加载 loading 图:", loadUrl);
    imgEl.src = loadUrl;
})();

function estimateAnimationDuration(src) {
    const base = src.match(/loading(\d{3})/);
    if (base) {
        const id = parseInt(base[1], 10);
        return 2200 + (id / 30) * 1200;
    }
    return 2500;
}

// 保留这个函数供兼容，但现在使用新的状态管理逻辑
function setupCssAnimationHide(durationMs) {
    (window.logger || console).debug(
        "[Loader] setupCssAnimationHide 已弃用，现在使用状态管理逻辑"
    );
    // 不再使用基于时间的自动隐藏，改为基于加载状态
}

window.estimateAnimationDuration = estimateAnimationDuration;
window.setupCssAnimationHide = setupCssAnimationHide;
