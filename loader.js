// Loader management (loading image + CSS animation hide)
// 全局加载状态
window.loadingStates = {
    loadingImageReady: false,
    firstBackgroundLoaded: false,
    readmeLoaded: false
};

// 检查是否可以隐藏 Loading
function checkCanHideLoader() {
    const states = window.loadingStates;
    // README 或首张背景图任一加载完成即可隐藏
    if (states.loadingImageReady && (states.firstBackgroundLoaded || states.readmeLoaded)) {
        console.log("[Loader] 条件满足，开始隐藏 Loading");
        hideLoader();
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
    loaderEl.addEventListener("animationend", () => {
        if (loaderEl) loaderEl.style.display = "none";
        if (blurEl) blurEl.style.display = "none";
        setTimeout(() => {
            if (window.showScrollNotification) window.showScrollNotification();
            if (window.checkAllServerStatus) window.checkAllServerStatus();
        }, 100);
        console.log("Loader hidden");
    }, { once: true });
}

// 设置状态并检查隐藏条件
function setLoadingState(key, value) {
    window.loadingStates[key] = value;
    console.log(`[Loader] ${key} = ${value}`, window.loadingStates);
    checkCanHideLoader();
}

window.setLoadingState = setLoadingState;
window.checkCanHideLoader = checkCanHideLoader;
(function initLoadingImage() {
    // 仅使用随机接口；不再进行本地（枚举）回退
    const RANDOM_ENDPOINT = "https://random.ysy.146019.xyz/res/loading";
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
        console.log(
            "Loading image loaded:",
            imgEl.src,
            imgEl.naturalWidth + "x" + imgEl.naturalHeight
        );
        
        setLoadingState('loadingImageReady', true);
        
        // Loading图加载完后，开始加载首张背景图和README
        setTimeout(() => {
            console.log("[Loader] Loading图加载完成，开始加载首张背景图和README");
            
            // 同时启动背景图和README加载
            if (window.loadFirstBackground) {
                window.loadFirstBackground();
            }
            if (window.loadReadmeContent) {
                window.loadReadmeContent();
            }
        }, 50);
    };
    imgEl.onerror = () => {
        console.warn(
            "[Loader] 随机接口加载失败，不再使用本地图片回退，将隐藏加载图。"
        );
        // 简单隐藏图片区域，保持 loader 其余逻辑继续
        imgEl.style.display = "none";
    };
    applyCommonStyle();
    const loadUrl = RANDOM_ENDPOINT + "?t=" + Date.now();
    console.log("[Loader] 开始加载 loading 图:", loadUrl);
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
	console.log("[Loader] setupCssAnimationHide 已弃用，现在使用状态管理逻辑");
	// 不再使用基于时间的自动隐藏，改为基于加载状态
}

window.estimateAnimationDuration = estimateAnimationDuration;
window.setupCssAnimationHide = setupCssAnimationHide;
