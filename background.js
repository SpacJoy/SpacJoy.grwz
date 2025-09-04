// 资源基路径（优先使用对象 RES_BASE_OVERRIDE，可根据环境动态覆盖）
const RES_BASE = (window.RES_BASE_OVERRIDE || "https://ysy.146019.xyz/res/")
	.replace(/\/+/g, "/")
	.replace(/([^:])\/\/+/, "$1/");
function buildRes(path) {
	// 允许传入已含 res/ 前缀或子目录
	return RES_BASE.replace(/\/$/, "/") + path.replace(/^res\//, "");
}

// 随机图片 API 配置
const RANDOM_API_BASE = "https://random.ysy.146019.xyz/"; // 直接访问返回整桶随机
const USE_RANDOM_BACKGROUND_API = true; // 开关：true 使用随机接口；false 使用本地枚举列表
// 为不同布局+主题映射目录（与之前枚举目录保持一致）
function mapDir(layout, theme) {
	if (layout === 'desktop') {
		return theme === 'dark' ? 'dark_back' : 'bright_back';
	}
	// tablet / mobile 共用移动端目录
	return theme === 'dark' ? 'mobile_dark_back' : 'mobile_bright_back';
}
function buildRandomDirUrl(dir) {
	// RANDOM_API_BASE + 'res/<dir>' 指定目录随机；追加时间戳避免缓存
	return `${RANDOM_API_BASE}res/${dir}?t=${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// 背景图管理
const backgroundImages = {
	desktop: {
		bright: [
			...Array.from({ length: 21 }, (_, i) =>
				buildRes(
					`bright_back/bright_back${String(i + 1).padStart(
						3,
						"0"
					)}.webp`
				)
			),
		],
		dark: [
			...Array.from({ length: 8 }, (_, i) =>
				buildRes(
					`dark_back/dark_back${String(i + 1).padStart(3, "0")}.webp`
				)
			),
		],
	},
	tablet: {
		bright: [
			...Array.from({ length: 21 }, (_, i) =>
				buildRes(
					`mobile_bright_back/mobile_bright_back${String(
						i + 1
					).padStart(3, "0")}.webp`
				)
			),
		],
		dark: [
			...Array.from({ length: 11 }, (_, i) =>
				buildRes(
					`mobile_dark_back/mobile_dark_back${String(i + 1).padStart(
						3,
						"0"
					)}.webp`
				)
			),
		],
	},
	mobile: {
		bright: [
			...Array.from({ length: 29 }, (_, i) =>
				buildRes(
					`mobile_bright_back/mobile_bright_back${String(
						i + 1
					).padStart(3, "0")}.webp`
				)
			),
		],
		dark: [
			...Array.from({ length: 11 }, (_, i) =>
				buildRes(
					`mobile_dark_back/mobile_dark_back${String(i + 1).padStart(
						3,
						"0"
					)}.webp`
				)
			),
		],
	},
};

// 预取缓存
let nextPrefetched = { layout: null, theme: null, url: null, loaded: false };

function detectLayout() {
	const w = window.innerWidth;
	if (w <= 700) return "mobile";
	if (w <= 1040) return "tablet";
	return "desktop";
}
function detectTheme() {
	if (window.currentTheme) {
		return window.currentTheme === "dark" ? "dark" : "bright";
	}
	return window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "bright";
}

function getRandomBackground(layout, theme) {
	if (USE_RANDOM_BACKGROUND_API) {
		try {
			const dir = mapDir(layout, theme);
			return buildRandomDirUrl(dir);
		} catch (e) {
			console.warn('[Background] 随机接口构建失败，回退本地枚举', e);
		}
	}
	const images = backgroundImages[layout] && backgroundImages[layout][theme];
	if (!images || images.length === 0) return null;
	return images[Math.floor(Math.random() * images.length)];
}

function setBackgroundImage(imageUrl) {
	if (imageUrl) {
		document.body.style.backgroundImage = `url('${imageUrl}')`;
		console.log("背景图已设置为:", imageUrl);
	}
}

function prefetchNextBackground() {
	try {
		const layout = detectLayout();
		const theme = detectTheme();
		let candidate;
		if (USE_RANDOM_BACKGROUND_API) {
			candidate = buildRandomDirUrl(mapDir(layout, theme));
		} else {
			const arr = backgroundImages[layout] && backgroundImages[layout][theme];
			if (!arr || !arr.length) return;
			candidate = arr[Math.floor(Math.random() * arr.length)];
		}
		if (!candidate) return;
		const img = new Image();
		img.decoding = 'async';
		img.loading = 'eager';
		nextPrefetched = { layout, theme, url: candidate, loaded: false };
		img.onload = () => { nextPrefetched.loaded = true; console.log('[Background] 预取完成', candidate); };
		img.onerror = () => { if (nextPrefetched.url === candidate) nextPrefetched.loaded = false; };
		img.src = candidate;
	} catch (e) {
		console.log('预取背景失败', e);
	}
}

function applyPrefetchedBackgroundOrRandom() {
	const layout = detectLayout();
	const theme = detectTheme();
	let used = false;
	if (
		nextPrefetched.url &&
		nextPrefetched.loaded &&
		nextPrefetched.layout === layout &&
		nextPrefetched.theme === theme
	) {
		setBackgroundImage(nextPrefetched.url);
		console.log("使用已预取背景:", nextPrefetched.url);
		used = true;
	} else {
		const randomBackground = getRandomBackground(layout, theme);
		if (randomBackground) {
			setBackgroundImage(randomBackground);
			console.log("使用随机背景(未匹配预取):", randomBackground);
		}
	}
	prefetchNextBackground();
	return used;
}

function checkLayoutAndSwitchBackground(
	forceNewBackground = false,
	forceLayoutCheck = false
) {
	if (window.isBackgroundSwitching && !forceLayoutCheck) return;
	if (forceNewBackground || forceLayoutCheck)
		window.isBackgroundSwitching = true;
	const screenWidth = window.innerWidth;
	let layoutType, layoutClass;
	if (screenWidth <= 700) {
		layoutType = "mobile";
		layoutClass = "mobile-layout";
	} else if (screenWidth <= 1040) {
		layoutType = "tablet";
		layoutClass = "tablet-layout";
	} else {
		layoutType = "desktop";
		layoutClass = "desktop-layout";
	}
	const currentLayoutClass = document.body.classList.contains("mobile-layout")
		? "mobile"
		: document.body.classList.contains("tablet-layout")
		? "tablet"
		: "desktop";
	const layoutChanged = currentLayoutClass !== layoutType;
	const prefersDarkScheme =
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches;
	const theme = prefersDarkScheme ? "dark" : "bright";
	document.body.classList.remove(
		"mobile-layout",
		"tablet-layout",
		"desktop-layout"
	);
	document.body.classList.add(layoutClass);
	if (forceNewBackground || layoutChanged || forceLayoutCheck) {
		const randomBackground = getRandomBackground(layoutType, theme);
		if (randomBackground) setBackgroundImage(randomBackground);
		console.log("布局检测: ", layoutType, theme, USE_RANDOM_BACKGROUND_API ? '[API]' : '[ENUM]', randomBackground);
	} else {
		console.log("布局调整: ", layoutType, "(背景未更换)");
	}
	window.isBackgroundSwitching = false;
}

window.getRandomBackground = getRandomBackground;
window.setBackgroundImage = setBackgroundImage;
window.prefetchNextBackground = prefetchNextBackground;
window.checkLayoutAndSwitchBackground = checkLayoutAndSwitchBackground;
window.applyPrefetchedBackgroundOrRandom = applyPrefetchedBackgroundOrRandom;
window._getNextPrefetchedBackground = () => nextPrefetched;
