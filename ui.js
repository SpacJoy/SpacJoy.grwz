// 页面初始化与事件绑定（轻量引导）
function addEventListeners() {
	if (window.eventListenersAdded) return;
	window.eventListenersAdded = true;
	console.log("添加事件监听器");
	const debouncedLayoutAdjust = debounce(() => {
		window.checkLayoutAndSwitchBackground &&
			window.checkLayoutAndSwitchBackground(false);
		window.optimizeArticleLayout && window.optimizeArticleLayout();
	}, 100);
	const debouncedOrientationChange = debounce(() => {
		window.checkLayoutAndSwitchBackground &&
			window.checkLayoutAndSwitchBackground(true);
		window.optimizeArticleLayout && window.optimizeArticleLayout();
	}, 200);
	const debouncedMediaQueryChange = debounce((e) => {
		window.checkLayoutAndSwitchBackground &&
			window.checkLayoutAndSwitchBackground(true);
		window.optimizeArticleLayout && window.optimizeArticleLayout();
	}, 150);
	window.addEventListener("resize", debouncedLayoutAdjust);
	window.addEventListener("orientationchange", debouncedOrientationChange);
	const mobileMediaQuery = window.matchMedia("(max-width: 700px)");
	const tabletMediaQuery = window.matchMedia("(max-width: 1040px)");
	mobileMediaQuery.addListener(debouncedMediaQueryChange);
	tabletMediaQuery.addListener(debouncedMediaQueryChange);
	window.addEventListener("keydown", function (e) {
		if ((e.ctrlKey || e.metaKey) && e.key === "b") {
			e.preventDefault();
			window.changeRandomBackground && window.changeRandomBackground();
		}
	});
}

function initializePageComplete() {
    if (window.isInitialized) return;
    window.isInitialized = true;
    console.log("页面初始化开始");
    window.initializeLanguage && window.initializeLanguage();

    // 现在由 loader.js 统一管理加载时序，这里只做基础初始化
    window.optimizeArticleLayout && window.optimizeArticleLayout();
    window.createReadmeSkeleton && window.createReadmeSkeleton();

    try {
        window.addEventListeners && window.addEventListeners();
    } catch (e) {
        console.error("addEventListeners 失败", e);
    }

    // 安全兜底：10秒后强制隐藏 loader（如果还在显示）
    setTimeout(() => {
        const loader = document.querySelector(".loader");
        if (loader && loader.style.display !== "none" && !window.loaderHidden) {
            console.warn("安全兜底：强制隐藏 loader");
            if (window.setLoadingState) {
                window.setLoadingState("firstBackgroundLoaded", true);
                window.setLoadingState("readmeLoaded", true);
            }
        }
    }, 10000);
}

window.addEventListeners = addEventListeners;
window.initializePageComplete = initializePageComplete;

window.addEventListener("load", initializePageComplete);
