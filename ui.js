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
	window.checkLayoutAndSwitchBackground &&
		window.checkLayoutAndSwitchBackground(true);
	window.optimizeArticleLayout && window.optimizeArticleLayout();
	window.createReadmeSkeleton && window.createReadmeSkeleton();
	setTimeout(() => {
		if (!window.isLoadingReadme)
			window.loadReadmeContent && window.loadReadmeContent();
	}, 50);
	window.prefetchNextBackground && window.prefetchNextBackground();
	// 先启动 loader 隐藏逻辑，避免后续事件绑定出错阻塞
	const loadingEl = document.getElementById("loading-gif");
	let est = 2500;
	if (loadingEl && loadingEl.src && window.estimateAnimationDuration) {
		est = window.estimateAnimationDuration(loadingEl.src) || 2500;
	}
	if (window.setupCssAnimationHide) window.setupCssAnimationHide(est);
	setTimeout(() => {
		window.checkAllServerStatus && window.checkAllServerStatus();
	}, 150);
	try {
		window.addEventListeners && window.addEventListeners();
	} catch (e) {
		console.error("addEventListeners 失败，不影响 loader 隐藏", e);
	}
	// 安全兜底：6 秒仍未隐藏则强制淡出
	setTimeout(() => {
		const loader = document.querySelector(".loader");
		if (loader && loader.style.display !== "none") {
			console.warn("安全兜底：强制隐藏 loader");
			loader.classList.remove("loader-animating");
			loader.classList.add("loader-fade-out");
			setTimeout(() => {
				if (loader) loader.style.display = "none";
				const blur = document.querySelector(".blur-effect");
				if (blur) blur.style.display = "none";
			}, 500);
			if (window.showScrollNotification)
				setTimeout(window.showScrollNotification, 100);
			if (window.loadReadmeContent)
				setTimeout(window.loadReadmeContent, 200);
			if (window.checkAllServerStatus)
				setTimeout(window.checkAllServerStatus, 400);
		}
	}, 6000);
}

window.addEventListeners = addEventListeners;
window.initializePageComplete = initializePageComplete;

window.addEventListener("load", initializePageComplete);
