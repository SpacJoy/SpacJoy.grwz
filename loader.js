// Loader management (loading image + CSS animation hide)
(function initLoadingImage() {
	const RANDOM_ENDPOINT = "https://random.ysy.146019.xyz/res/loading"; // 后端随机返回 loading 目录下任意一张图
	const RES_BASE = (window.RES_BASE_OVERRIDE || "https://ysy.146019.xyz/res/")
		.replace(/\/+/g, "/")
		.replace(/([^:])\/\/+/, "$1/");
	const buildRes = (p) =>
		RES_BASE.replace(/\/$/, "/") + p.replace(/^res\//, "");
	const fallbackSources = Array.from({ length: 24 }, (_, i) =>
        buildRes(`loading/loading_${String(i + 1).padStart(3, "0")}.webp`)
    );
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

	function pickFallback() {
		const alt =
			fallbackSources[Math.floor(Math.random() * fallbackSources.length)];
		console.warn("[Loader] 随机接口失败，使用本地枚举 fallback:", alt);
		imgEl.onerror = null; // 避免循环
		imgEl.src = alt + "?t=" + Date.now();
	}

	imgEl.onload = () => {
		console.log(
			"Loading image loaded:",
			imgEl.src,
			imgEl.naturalWidth + "x" + imgEl.naturalHeight
		);
	};
	imgEl.onerror = () => pickFallback();
	applyCommonStyle();
	// 加随机查询参数防缓存（某些 CDN 可能仍合并，可根据需要改成 cache-control 配置）
	imgEl.src = RANDOM_ENDPOINT + "?t=" + Date.now();
})();

function estimateAnimationDuration(src) {
	const base = src.match(/loading(\d{3})/);
	if (base) {
		const id = parseInt(base[1], 10);
		return 2200 + (id / 30) * 1200;
	}
	return 2500;
}

function setupCssAnimationHide(durationMs) {
	const loaderEl = document.querySelector(".loader");
	const blurEl = document.querySelector(".blur-effect");
	if (!loaderEl) return;
	const MIN_SHOW = 1200,
		MAX_SHOW = 4500;
	const finalDuration = Math.min(
		MAX_SHOW,
		Math.max(MIN_SHOW, durationMs || 2500)
	);
	loaderEl.style.setProperty("--loader-duration", finalDuration + "ms");
	loaderEl.classList.add("loader-animating");
	console.log("[Loader] start hold animation", finalDuration + "ms");
	let ended = false;

	function doFadeOut() {
		if (ended) return; // prevent double
		ended = true;
		loaderEl.classList.remove("loader-animating");
		loaderEl.classList.add("loader-fade-out");
		loaderEl.addEventListener(
			"animationend",
			() => {
				if (loaderEl) loaderEl.style.display = "none";
				if (blurEl) blurEl.style.display = "none";
				setTimeout(window.showScrollNotification, 100);
				setTimeout(window.loadReadmeContent, 200);
				setTimeout(window.checkAllServerStatus, 500);
				console.log("Loader hidden (fade phase complete)");
			},
			{ once: true }
		);
	}

	const onEnd = (e) => {
		if (e.target !== loaderEl) return;
		loaderEl.removeEventListener("animationend", onEnd);
		doFadeOut();
	};
	loaderEl.addEventListener("animationend", onEnd);

	// Fallback: some browsers might skip animationend if keyframes noop or tab hidden
	setTimeout(() => {
		if (!ended) {
			console.warn("[Loader] animationend not fired, fallback fade");
			doFadeOut();
		}
	}, finalDuration + 500); // buffer

	// Reduced motion：更快结束
	try {
		if (
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			console.log(
				"[Loader] prefers-reduced-motion detected, shorten display"
			);
			setTimeout(() => {
				if (!ended) doFadeOut();
			}, Math.min(finalDuration, 1500));
		}
	} catch (_) {}

	// Hard stop：绝对上限 8s 强制隐藏（包括 fade 时间）
	setTimeout(() => {
		if (!ended) {
			console.warn("[Loader] hard timeout reached, force hide");
			ended = true;
			loaderEl.classList.remove("loader-animating");
			loaderEl.classList.add("loader-fade-out");
			setTimeout(() => {
				if (loaderEl) loaderEl.style.display = "none";
				if (blurEl) blurEl.style.display = "none";
			}, 500);
			setTimeout(window.showScrollNotification, 100);
			setTimeout(window.loadReadmeContent, 200);
			setTimeout(window.checkAllServerStatus, 400);
		}
	}, 8000);
}

window.estimateAnimationDuration = estimateAnimationDuration;
window.setupCssAnimationHide = setupCssAnimationHide;
