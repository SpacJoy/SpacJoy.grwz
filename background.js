// 三张预取 + 多层淡入淡出实现
const RANDOM_API_BASE = "https://random.ysy.146019.xyz/";
function mapDir(layout, theme) {
    if (layout === "desktop")
        return theme === "dark" ? "dark_back" : "bright_back";
    return theme === "dark" ? "mobile_dark_back" : "mobile_bright_back";
}
function buildRandomDirUrl(dir) {
    return `${RANDOM_API_BASE}res/${dir}?t=${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
}
function detectLayout() {
    const w = window.innerWidth;
    if (w <= 700) return "mobile";
    if (w <= 1040) return "tablet";
    return "desktop";
}
function detectTheme() {
    if (window.currentTheme)
        return window.currentTheme === "dark" ? "dark" : "bright";
    return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "bright";
}

// 状态
const PREFETCH_TARGET = 6;
let queue = []; // {url,layout,theme,layer,loaded}
let container = null;
let activeLayer = null;
let prefetchingNow = false; // 当前是否正在预取一张
let firstBackgroundLoaded = false; // 首张背景是否已加载完成

function ensureContainer() {
    if (container) return container;
    if (!document.getElementById("bg-layer-styles")) {
        const style = document.createElement("style");
        style.id = "bg-layer-styles";
        style.textContent = `.bg-layer-stack{position:fixed;inset:0;z-index:-10;pointer-events:none;overflow:hidden}
        .bg-layer{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .85s ease;will-change:opacity}
        .bg-layer.active{opacity:1}
        .bg-layer.fading{opacity:0!important}`;
        document.head.appendChild(style);
    }
    container = document.createElement("div");
    container.className = "bg-layer-stack";
    document.body.prepend(container);
    return container;
}

function getRandomBackground() {
    try {
        return buildRandomDirUrl(mapDir(detectLayout(), detectTheme()));
    } catch (e) {
        console.warn("[Background] 构建随机URL失败", e);
        return null;
    }
}

// 专门加载首张背景图的函数
function loadFirstBackground() {
    if (firstBackgroundLoaded) return;

    ensureContainer();
    const url = getRandomBackground();
    if (!url) return;

    console.log("[Background] 开始加载首张背景:", url);
    const layer = createLayer(url);
    const img = new Image();
    img.onload = () => {
        activateLayer(layer, url);
        console.log("[Background] 首张背景加载完成");
    };
    img.onerror = () => {
        console.warn("[Background] 首张背景加载失败");
        if (layer.parentNode) layer.parentNode.removeChild(layer);
    };
    img.src = url;
}

// 检查是否可以开始预取（需要README和首张背景都完成）
function checkCanStartPrefetch() {
    if (
        firstBackgroundLoaded &&
        window.loadingStates &&
        window.loadingStates.readmeLoaded
    ) {
        console.log("[Background] README和首张背景都已完成，开始预取");
        prefetchNextBackground();
    }
}

function createLayer(url) {
    ensureContainer();
    const layer = document.createElement("div");
    layer.className = "bg-layer";
    layer.style.backgroundImage = `url('${url}')`;
    container.appendChild(layer);
    return layer;
}

function activateLayer(layer, url) {
    if (!layer) return;
    const old = activeLayer;
    if (old && old !== layer) {
        old.classList.remove("active");
        old.classList.add("fading");
        old.addEventListener(
            "transitionend",
            () => {
                if (old.parentNode) old.parentNode.removeChild(old);
            },
            { once: true }
        );
    }
    layer.classList.add("active");
    activeLayer = layer;
    window._backgroundLoadedOnce = true;
    console.log("[Background] 激活背景:", url);

    // 如果这是首张背景图，更新状态
    if (!firstBackgroundLoaded) {
        firstBackgroundLoaded = true;
        if (window.setLoadingState) {
            window.setLoadingState("firstBackgroundLoaded", true);
        }
        // 检查是否可以开始预取
        checkCanStartPrefetch();
    }
}

function _prefetchOne() {
    if (prefetchingNow) return; // 避免并发预取
    prefetchingNow = true;

    const layout = detectLayout();
    const theme = detectTheme();
    const url = buildRandomDirUrl(mapDir(layout, theme));
    if (!url) {
        prefetchingNow = false;
        return;
    }
    console.log("[Background] 开始预取背景:", url);
    const entry = { url, layout, theme, layer: null, loaded: false };
    queue.push(entry);
    const img = new Image();
    img.onload = () => {
        entry.loaded = true;
        if (!entry.layer) {
            entry.layer = createLayer(entry.url);
            console.log("[Background] 预取完成并入栈:", entry.url);
            // 若尚无激活层，立即使用这一张作为首张背景
            if (!activeLayer) {
                activateLayer(entry.layer, entry.url);
                // 从队列移除已使用的首张
                const idx = queue.indexOf(entry);
                if (idx >= 0) queue.splice(idx, 1);
            }
        }
        prefetchingNow = false;
        // 完成一张后尝试预取下一张
        setTimeout(() => prefetchNextBackground(), 100);
    };
    img.onerror = () => {
        console.warn("[Background] 预取失败移除:", url);
        const i = queue.indexOf(entry);
        if (i >= 0) queue.splice(i, 1);
        prefetchingNow = false;
        // 失败后也要继续尝试下一张
        setTimeout(() => prefetchNextBackground(), 100);
    };
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
}

function prefetchNextBackground() {
    try {
        // 只有首张背景和README都加载完成后才开始预取
        if (
            !firstBackgroundLoaded ||
            !window.loadingStates ||
            !window.loadingStates.readmeLoaded
        ) {
            console.log("[Background] 等待首张背景和README都完成再预取");
            return;
        }

        // 逐张预取，避免并发
        if (queue.length < PREFETCH_TARGET && !prefetchingNow) {
            _prefetchOne();
        }

        // 如果可用预取数量不足，加速补充
        const loadedCount = queue.filter((e) => e.loaded).length;
        if (
            loadedCount < 2 &&
            !prefetchingNow &&
            queue.length < PREFETCH_TARGET
        ) {
            console.log("[Background] 紧急补充预取，当前可用:", loadedCount);
            setTimeout(() => _prefetchOne(), 50); // 快速补充
        }
    } catch (e) {
        console.warn("预取出错", e);
    }
}
function applyPrefetchedBackgroundOrRandom() {
    ensureContainer();
    prefetchNextBackground();
    if (!activeLayer) {
        // 取第一个 loaded 的
        let idx = queue.findIndex((e) => e.loaded);
        if (idx === -1) return false; // 等待
        const entry = queue[idx];
        activateLayer(entry.layer, entry.url);
        queue.splice(idx, 1);
        prefetchNextBackground();
        return true;
    }
    return true;
}

function crossfadeToPrefetched() {
    ensureContainer();

    // 检查可用的预取图片数量
    const loadedCount = queue.filter((e) => e.loaded).length;

    // 如果可用预取少于3张，提示预取中（避免用完最后一张时白屏）
    if (loadedCount < 3) {
        console.log("[Background] 预取队列不足，剩余可用:", loadedCount);
        prefetchNextBackground(); // 尝试补充
        return false; // 返回 false 触发 "预取中" 提示
    }

    // 找一个已加载的（优先匹配当前布局+主题）
    const layout = detectLayout();
    const theme = detectTheme();
    let idx = queue.findIndex(
        (e) => e.loaded && e.layout === layout && e.theme === theme
    );
    if (idx === -1) idx = queue.findIndex((e) => e.loaded);

    if (idx === -1) {
        console.log("[Background] 没有可切换的预取，补充中");
        prefetchNextBackground();
        return false;
    }

    const entry = queue[idx];
    activateLayer(entry.layer, entry.url);
    queue.splice(idx, 1);
    prefetchNextBackground(); // 补一张
    return true;
}

function checkLayoutAndSwitchBackground(
    forceNewBackground = false,
    forceLayoutCheck = false
) {
    if (forceNewBackground) {
        crossfadeToPrefetched();
        return;
    }
}

window.prefetchNextBackground = prefetchNextBackground;
window.applyPrefetchedBackgroundOrRandom = applyPrefetchedBackgroundOrRandom;
window.crossfadeToPrefetched = crossfadeToPrefetched;
window._getNextPrefetchedBackground = () => queue.slice();
window.loadFirstBackground = loadFirstBackground;
window.checkCanStartPrefetch = checkCanStartPrefetch;
window.getPrefetchStatus = () => ({
    total: queue.length,
    loaded: queue.filter((e) => e.loaded).length,
    prefetching: prefetchingNow,
});
