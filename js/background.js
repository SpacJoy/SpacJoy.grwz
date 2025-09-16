// 三张预取 + 多层淡入淡出实现
const RANDOM_API_BASE = "https://rad.ysy.146019.xyz/";
function mapDir(layout) {
    // 新的目录结构：bz下按设备类型分类，不再区分深色模式
    if (layout === "desktop") return "bz/hp"; // 横屏
    if (layout === "tablet") return "bz/zfx"; // 正方形
    return "bz/sp"; // 竖屏
}
function buildRandomDirUrl(dir) {
    return `${RANDOM_API_BASE}${dir}?t=${Date.now()}_${Math.random()
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
        .bg-layer.fading{opacity:0!important}
        [data-theme="dark"] .bg-layer{background-color:#000000}
        [data-theme="light"] .bg-layer{background-color:transparent}`;
        document.head.appendChild(style);
    }
    container = document.createElement("div");
    container.className = "bg-layer-stack";
    document.body.prepend(container);
    return container;
}

function getRandomBackground() {
    try {
        return buildRandomDirUrl(mapDir(detectLayout()));
    } catch (e) {
        (window.logger || console).warn("[Background] 构建随机URL失败", e);
        return null;
    }
}

// 专门加载首张背景图的函数
function loadFirstBackground() {
    if (firstBackgroundLoaded) return;

    ensureContainer();
    const url = getRandomBackground();
    if (!url) return;

    (window.logger || console).info("[Background] 开始加载首张背景:", url);
    const layer = createLayer(url);
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    const finalizeSuccess = () => {
        activateLayer(layer, url);
        (window.logger || console).info("[Background] 首张背景加载完成");
        // 初始状态：背景模糊
        layer.style.filter = "blur(20px)";
        layer.style.transition = "filter 2s ease-in-out";
        // 等待加载动画完成后再清晰背景
        const loader = document.querySelector(".loader");
        if (loader) {
            const checkLoaderHidden = () => {
                if (window.loaderHidden) {
                    // 加载器已隐藏，开始清晰背景
                    layer.style.filter = "blur(0px)";
                } else {
                    // 继续检查
                    setTimeout(checkLoaderHidden, 100);
                }
            };
            checkLoaderHidden();
        }
    };
    const finalizeFail = () => {
        (window.logger || console).warn("[Background] 首张背景加载失败");
        if (layer.parentNode) layer.parentNode.removeChild(layer);
    };
    if (window.netUtils && window.netUtils.loadImageWithTimeout) {
        window.netUtils
            .loadImageWithTimeout(img, 8000)
            .then(finalizeSuccess)
            .catch(() => {
                finalizeFail();
            });
        img.src = url;
    } else {
        img.onload = finalizeSuccess;
        img.onerror = finalizeFail;
        img.src = url;
    }
}

// 检查是否可以开始预取（需要README和首张背景都完成）
function checkCanStartPrefetch() {
    // 检查是否为内网地址，如果是则禁用预加载
    const hostname = window.location.hostname;
    const isPrivateNetwork =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname);

    if (isPrivateNetwork) {
        (window.logger || console).info(
            "[Background] 内网环境，禁用背景图预加载"
        );
        return;
    }

    // 确保在背景图、README和服务器检测都完成后才开始预取
    if (
        firstBackgroundLoaded &&
        window.loadingStates &&
        window.loadingStates.readmeLoaded &&
        window.loadingStates &&
        window.loadingStates.serversChecked
    ) {
        (window.logger || console).info(
            "[Background] README、首张背景和服务器检测都已完成，开始预取"
        );
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
        old.style.opacity = "0";
        old.style.filter = "blur(10px) brightness(0.8)";
        old.addEventListener(
            "transitionend",
            () => {
                if (old.parentNode) old.parentNode.removeChild(old);
            },
            { once: true }
        );
    }
    // 新层先模糊，然后在过渡到清晰
    layer.style.opacity = "0";
    layer.style.filter = "blur(10px)";
    layer.classList.add("active");

    // 使用requestAnimationFrame确保样式应用
    requestAnimationFrame(() => {
        layer.style.transition = "opacity 1.2s ease, filter 1.5s ease";
        layer.style.opacity = "1";
        layer.style.filter = "blur(0px)";
    });

    activeLayer = layer;
    window._backgroundLoadedOnce = true;
    (window.logger || console).debug("[Background] 激活背景:", url);

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
    const url = buildRandomDirUrl(mapDir(layout));
    if (!url) {
        prefetchingNow = false;
        return;
    }
    (window.logger || console).debug("[Background] 开始预取背景:", url);
    const entry = { url, layout, layer: null, loaded: false };
    queue.push(entry);
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    const onSuccess = () => {
        entry.loaded = true;
        if (!entry.layer) {
            entry.layer = createLayer(entry.url);
            (window.logger || console).debug(
                "[Background] 预取完成并入栈:",
                entry.url
            );
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
    const onFail = () => {
        (window.logger || console).warn("[Background] 预取失败移除:", url);
        const i = queue.indexOf(entry);
        if (i >= 0) queue.splice(i, 1);
        prefetchingNow = false;
        // 失败后也要继续尝试下一张
        setTimeout(() => prefetchNextBackground(), 100);
    };

    if (window.netUtils && window.netUtils.loadImageWithTimeout) {
        window.netUtils
            .loadImageWithTimeout(img, 8000)
            .then(onSuccess)
            .catch(onFail);
        img.src = url;
    } else {
        img.onload = onSuccess;
        img.onerror = onFail;
        img.src = url;
    }
}

function prefetchNextBackground() {
    try {
        // 只有首张背景和README都加载完成后才开始预取
        if (
            !firstBackgroundLoaded ||
            !window.loadingStates ||
            !window.loadingStates.readmeLoaded
        ) {
            (window.logger || console).debug(
                "[Background] 等待首张背景和README都完成再预取"
            );
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
            (window.logger || console).debug(
                "[Background] 紧急补充预取，当前可用:",
                loadedCount
            );
            setTimeout(() => _prefetchOne(), 50); // 快速补充
        }
    } catch (e) {
        (window.logger || console).warn("[Background] 预取出错", e);
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
        (window.logger || console).debug(
            "[Background] 预取队列不足，剩余可用:",
            loadedCount
        );
        prefetchNextBackground(); // 尝试补充
        return false; // 返回 false 触发 "预取中" 提示
    }

    // 找一个已加载的（优先匹配当前布局）
    const layout = detectLayout();
    let idx = queue.findIndex((e) => e.loaded && e.layout === layout);
    if (idx === -1) idx = queue.findIndex((e) => e.loaded);

    if (idx === -1) {
        (window.logger || console).debug(
            "[Background] 没有可切换的预取，补充中"
        );
        prefetchNextBackground();
        return false;
    }

    const entry = queue[idx];
    activateLayer(entry.layer, entry.url);

    // 添加背景切换时的额外动画效果
    if (window.showNotification) {
        window.showNotification("背景已更换", "成功切换到新的背景图片");
    }

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
