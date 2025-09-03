// Loader management (loading image + CSS animation hide)
(function initLoadingImage() {
    const RANDOM_ENDPOINT = "https://random.ysy.146019.xyz/res/loading"; // 服务器返回随机 loading 图片
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

    let retryCount = 0;
    const MAX_RETRIES = 3;

    function loadRandom() {
        imgEl.src = `${RANDOM_ENDPOINT}?t=${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;
    }

    imgEl.onload = () => {
        console.log(
            "[Loader] image loaded:",
            imgEl.src,
            imgEl.naturalWidth + "x" + imgEl.naturalHeight
        );
    };
    imgEl.onerror = () => {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
            console.error("[Loader] 随机接口连续失败，放弃重试");
            imgEl.onerror = null;
            imgEl.alt = "(loading)";
            return;
        }
        const delay = 200 * retryCount; // 简单线性退避
        console.warn(
            `[Loader] 加载失败，重试 ${retryCount}/${MAX_RETRIES}，${delay}ms 后`
        );
        setTimeout(loadRandom, delay);
    };

    applyCommonStyle();
    loadRandom();
})();

function estimateAnimationDuration(src) {
    // 由于改为纯随机接口，无法再依据文件编号估算，统一返回基准值
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
