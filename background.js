// 已删除本地图片，改为仅依赖远程随机服务
const RANDOM_API_BASE = "https://random.ysy.146019.xyz/"; // 后端会根据目录返回一张随机图

// 根据布局与主题映射远程目录名称
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

// 预取缓存
let nextPrefetched = { layout: null, theme: null, url: null, loaded: false };
let lastSuccessfulBackground = null; // 记录最后一次成功背景，用于必要时回退

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
    // 仅使用随机接口，不再回退本地文件
    try {
        return buildRandomDirUrl(mapDir(layout, theme));
    } catch (e) {
        console.warn("[Background] 随机接口构建失败", e);
        return null;
    }
}

function setBackgroundImage(imageUrl) {
    if (imageUrl) {
        // 添加淡入过渡：先设置透明度，再异步强制回流后恢复
        const body = document.body;
        body.style.transition =
            body.style.transition ||
            "background-image 0s linear, opacity 0.6s ease";
        // 若之前没有透明度则设定
        if (!body.classList.contains("bg-fade-applied")) {
            body.classList.add("bg-fade-applied");
        }
        body.style.opacity = "0";
        requestAnimationFrame(() => {
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            // 使用微延迟确保背景已切换再开始淡入
            setTimeout(() => {
                body.style.opacity = "1";
            }, 40);
        });
        console.log("背景图已设置(淡入):", imageUrl);
        lastSuccessfulBackground = imageUrl;
    }
}

// 基础：按 URL 试图加载一张图片，失败后重试（选取新随机 URL）
function tryLoadBackground(url, layout, theme, attempt = 0, maxRetries = 3) {
    if (!url) return;
    const img = new Image();
    img.decoding = "async";
    const tag = `[Background][Load attempt ${attempt + 1}/${maxRetries}]`;
    let timeoutId = null;
    const TIMEOUT_MS = 5000; // 单次加载超时
    img.onload = () => {
        if (timeoutId) clearTimeout(timeoutId);
        console.log(
            tag,
            "成功",
            url,
            img.naturalWidth + "x" + img.naturalHeight
        );
        setBackgroundImage(url);
        // 成功后预取下一张
        prefetchNextBackground();
    };
    img.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn(tag, "失败", url);
        if (attempt + 1 < maxRetries) {
            const nextUrl = getRandomBackground(layout, theme);
            // 避免重复同一 URL（若随机返回相同则仍接受，防止死循环）
            const delay = 200 * (attempt + 1); // 简单线性退避
            setTimeout(
                () =>
                    tryLoadBackground(
                        nextUrl,
                        layout,
                        theme,
                        attempt + 1,
                        maxRetries
                    ),
                delay
            );
        } else {
            console.error("[Background] 达到最大重试次数，放弃本次设置");
            if (lastSuccessfulBackground) {
                console.log("[Background] 维持上一次成功背景");
            }
        }
    };
    img.src = url;
    timeoutId = setTimeout(() => {
        console.warn(tag, "加载超时，主动触发 onerror");
        img.onerror && img.onerror();
    }, TIMEOUT_MS);
}

function prefetchNextBackground() {
    try {
        const layout = detectLayout();
        const theme = detectTheme();
        const candidate = buildRandomDirUrl(mapDir(layout, theme));
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        nextPrefetched = { layout, theme, url: candidate, loaded: false };
        img.onload = () => {
            nextPrefetched.loaded = true;
            console.log("[Background] 预取完成", candidate);
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
            console.log("尝试加载随机背景(未匹配预取):", randomBackground);
            tryLoadBackground(randomBackground, layout, theme);
        }
    }
    if (used) prefetchNextBackground(); // 成功使用预取再预取下一张；非预取路径在 tryLoadBackground 成功回调里预取
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
    const theme = detectTheme();
    document.body.classList.remove(
        "mobile-layout",
        "tablet-layout",
        "desktop-layout"
    );
    document.body.classList.add(layoutClass);
    if (forceNewBackground || layoutChanged || forceLayoutCheck) {
        const randomBackground = getRandomBackground(layoutType, theme);
        if (randomBackground) {
            console.log(
                "布局检测: 触发新背景加载",
                layoutType,
                theme,
                "[API]",
                randomBackground
            );
            tryLoadBackground(randomBackground, layoutType, theme);
        } else {
            console.warn("布局检测: 未获取到随机背景 URL");
        }
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
window._getLastSuccessfulBackground = () => lastSuccessfulBackground;
