// Loader management (loading image + CSS animation hide)
(function initLoadingImage() {
	const sources = Array.from(
		{ length: 22 },
		(_, i) => `res/loading/loading${String(i + 1).padStart(3, "0")}.webp`
	);
	const pick = sources[Math.floor(Math.random() * sources.length)];
	const imgEl = document.getElementById("loading-gif");
	if (!imgEl) return;
	imgEl.src = pick;
	imgEl.removeAttribute("width");
	imgEl.removeAttribute("height");
	imgEl.style.width = "";
	imgEl.style.height = "";
	imgEl.style.maxWidth = "60vmin";
	imgEl.style.maxHeight = "60vmin";
	imgEl.style.objectFit = "contain";
	imgEl.style.aspectRatio = "auto";
	imgEl.onload = () => {
		console.log(
			"Loading image loaded:",
			pick,
			imgEl.naturalWidth + "x" + imgEl.naturalHeight
		);
	};
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
			console.warn(
				"Loader animationend not fired in time, using fallback hide"
			);
			doFadeOut();
		}
	}, finalDuration + 500); // small buffer
}

window.estimateAnimationDuration = estimateAnimationDuration;
window.setupCssAnimationHide = setupCssAnimationHide;
