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
// 已移除本地枚举，始终使用随机接口
const USE_RANDOM_BACKGROUND_API = true;
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
// 本地背景枚举已删除

// 预取缓存
let nextPrefetched = { layout: null, theme: null, url: null, loaded: false };
let bgLayers = null; // {layers:[div,div], activeIndex:0|1}

function ensureBackgroundLayers() {
    if (bgLayers) return bgLayers;
    // 注入样式
    if (!document.getElementById("bg-layer-styles")) {
        const style = document.createElement("style");
        style.id = "bg-layer-styles";
        style.textContent = `
			.bg-layer-stack{position:fixed;inset:0;z-index:-10;pointer-events:none;}
			.bg-layer{position:absolute;inset:0;background-size:cover;background-position:center center;background-repeat:no-repeat;opacity:0;transition:opacity .8s ease;will-change:opacity;}
			.bg-layer.active{opacity:1;}
			.bg-layer.fading{opacity:0!important;}
		`;
        document.head.appendChild(style);
    }
    const stack = document.createElement("div");
    stack.className = "bg-layer-stack";
    const l1 = document.createElement("div");
    const l2 = document.createElement("div");
    l1.className = "bg-layer";
    l2.className = "bg-layer";
    stack.appendChild(l1);
    stack.appendChild(l2);
    document.body.prepend(stack); // 放在最前避免内容遮挡
    bgLayers = { layers: [l1, l2], activeIndex: null };
    return bgLayers;
}

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
    try {
        const dir = mapDir(layout, theme);
        return buildRandomDirUrl(dir);
    } catch (e) {
        console.warn("[Background] 随机接口构建失败，无本地枚举可回退", e);
        return null;
    }
}

function setBackgroundImage(imageUrl, { asPrefetched = false } = {}) {
    if (!imageUrl) return;
    ensureBackgroundLayers();
    const { layers } = bgLayers;
    // 初次：直接激活第一层
    if (bgLayers.activeIndex === null && !asPrefetched) {
        layers[0].style.backgroundImage = `url('${imageUrl}')`;
        layers[0].classList.add("active");
        bgLayers.activeIndex = 0;
        console.log("[Background] 初次设置背景:", imageUrl);
        window._backgroundLoadedOnce = true;
        return;
    }
    // 作为预取：把图像放入非激活层但不显示
    if (asPrefetched) {
        const inactiveIndex = bgLayers.activeIndex === 0 ? 1 : 0;
        layers[inactiveIndex].style.backgroundImage = `url('${imageUrl}')`;
        console.log("[Background] 预取图已放入下层:", imageUrl);
        return;
    }
    // 直接切换：将新图放入非激活层并执行淡入淡出
    const oldIndex = bgLayers.activeIndex;
    const newIndex = oldIndex === 0 ? 1 : 0;
    layers[newIndex].style.backgroundImage = `url('${imageUrl}')`;
    // 先显示新层
    layers[newIndex].classList.add("active");
    // 旧层淡出
    layers[oldIndex].classList.add("fading");
    layers[oldIndex].classList.remove("active");
    const oldLayer = layers[oldIndex];
    oldLayer.addEventListener(
        "transitionend",
        () => {
            oldLayer.classList.remove("fading");
        },
        { once: true }
    );
    bgLayers.activeIndex = newIndex;
    console.log("[Background] 切换背景 ->", imageUrl);
    window._backgroundLoadedOnce = true;
}

function prefetchNextBackground() {
    try {
        const layout = detectLayout();
        const theme = detectTheme();
        const candidate = buildRandomDirUrl(mapDir(layout, theme));
        if (!candidate) return;
        console.log("[Background] 开始预取背景:", candidate);
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        nextPrefetched = { layout, theme, url: candidate, loaded: false };
        img.onload = () => {
            nextPrefetched.loaded = true;
            console.log("[Background] 预取完成", candidate);
            // 将预取图放入非激活层
            if (bgLayers && bgLayers.activeIndex !== null) {
                setBackgroundImage(candidate, { asPrefetched: true });
            }
        };
        img.onerror = () => {
            if (nextPrefetched.url === candidate) nextPrefetched.loaded = false;
        };
        img.src = candidate;
    } catch (e) {
        console.log("预取背景失败", e);
    }
}

function applyPrefetchedBackgroundOrRandom() {
    // 用于初始化或立即切换（不使用底层淡出逻辑）
    const layout = detectLayout();
    const theme = detectTheme();
    let used = false;
    if (
        nextPrefetched.url &&
        nextPrefetched.loaded &&
        nextPrefetched.layout === layout &&
        nextPrefetched.theme === theme
    ) {
        if (bgLayers && bgLayers.activeIndex !== null) {
            // 有激活层 -> crossfade
            setBackgroundImage(nextPrefetched.url);
        } else {
            setBackgroundImage(nextPrefetched.url, { asPrefetched: false });
        }
        used = true;
        console.log("[Background] apply 使用预取");
    } else {
        const randomBackground = getRandomBackground(layout, theme);
        if (randomBackground) {
            setBackgroundImage(randomBackground, { asPrefetched: false });
            used = true;
            console.log("[Background] apply 使用随机");
        }
    }
    prefetchNextBackground();
    return used;
}

function crossfadeToPrefetched() {
    if (!bgLayers || bgLayers.activeIndex === null) {
        applyPrefetchedBackgroundOrRandom();
        return true;
    }
    const layout = detectLayout();
    const theme = detectTheme();
    if (
        nextPrefetched.url &&
        nextPrefetched.loaded &&
        nextPrefetched.layout === layout &&
        nextPrefetched.theme === theme
    ) {
        // 下层已填充（onload 已放入），现在执行淡出
        const targetUrl = nextPrefetched.url;
        // 如果下层还没填充（极端情况）再次设置
        setBackgroundImage(targetUrl); // crossfade
        prefetchNextBackground();
        return true;
    }
    // 没有预取好的，直接获取并 crossfade
    const randomBackground = getRandomBackground(layout, theme);
    if (randomBackground) {
        setBackgroundImage(randomBackground); // crossfade
        prefetchNextBackground();
        return true;
    }
    return false;
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
        console.log("布局检测: ", layoutType, theme, "[API]", randomBackground);
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
window.crossfadeToPrefetched = crossfadeToPrefetched;
