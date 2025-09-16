// 页面初始化与事件绑定（轻量引导）
function addEventListeners() {
    if (window.eventListenersAdded) return;
    window.eventListenersAdded = true;
    (window.logger || console).debug("[UI] 添加事件监听器");

    // 为滚动指示器添加点击滚动到下一个屏幕的功能
    const scrollIndicator = document.getElementById("scroll-indicator");
    if (scrollIndicator) {
        // 简化的点击事件处理函数，使用更直接和可靠的方法
        scrollIndicator.addEventListener("click", function () {
            // 直接使用原生JavaScript滚动到特定位置
            try {
                // 获取下一个屏幕元素
                const nextSection =
                    document.getElementById("blank-section") ||
                    document.getElementById("hero-section")?.nextElementSibling;

                if (nextSection) {
                    // 计算目标位置
                    const targetPosition = nextSection.offsetTop;

                    // 使用最简单的平滑滚动方法
                    window.scrollTo({
                        top: targetPosition,
                        behavior: "smooth",
                    });
                } else {
                    (window.logger || console).warn(
                        "[UI] 未找到下一个屏幕元素"
                    );
                }
            } catch (error) {
                (window.logger || console).error("滚动指示器点击错误:", error);
            }
        });
    }
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
    (window.logger || console).info("[UI] 页面初始化开始");
    window.initializeLanguage && window.initializeLanguage();

    // 现在由 loader.js 统一管理加载时序，这里只做基础初始化
    window.optimizeArticleLayout && window.optimizeArticleLayout();
    window.createReadmeSkeleton && window.createReadmeSkeleton();

    try {
        // 直接调用addEventListeners函数，不依赖window对象引用
        addEventListeners();
        (window.logger || console).debug("[UI] 事件监听器添加成功");
        // 初始化页面指示器
        initPageIndicator();
    } catch (e) {
        (window.logger || console).error("[UI] addEventListeners 失败", e);
    }

    // 安全兜底：10秒后强制隐藏 loader（如果还在显示）
    setTimeout(() => {
        const loader = document.querySelector(".loader");
        if (loader && loader.style.display !== "none" && !window.loaderHidden) {
            (window.logger || console).warn("[UI] 安全兜底：强制隐藏 loader");
            if (window.setLoadingState) {
                window.setLoadingState("firstBackgroundLoaded", true);
                window.setLoadingState("readmeLoaded", true);
            }
        }
    }, 10000);
}

// 初始化页面指示器
function initPageIndicator() {
    try {
        const indicator = document.getElementById("page-indicator");
        const indicatorItems = document.querySelectorAll(".indicator-item");
        const sections = document.querySelectorAll(".screen-section");

        if (
            !indicator ||
            indicatorItems.length === 0 ||
            sections.length === 0
        ) {
            return;
        }

        // 滚动事件处理
        let scrollTimeout;
        let isVisible = false;

        function handleScroll() {
            // 清除之前的定时器
            clearTimeout(scrollTimeout);

            // 获取当前滚动位置
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;

            // 始终显示指示器（解除仅前两页显示的限制）
            if (!isVisible) {
                indicator.classList.add("visible");
                isVisible = true;
            }

            // 检测当前可见的页面并高亮对应的指示器
            sections.forEach((section, index) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (
                    scrollPosition >= sectionTop - windowHeight / 3 &&
                    scrollPosition <
                        sectionTop + sectionHeight - windowHeight / 3
                ) {
                    indicatorItems.forEach((item, i) => {
                        if (i === index) {
                            item.classList.add("active");
                        } else {
                            item.classList.remove("active");
                        }
                    });
                }
            });

            // 静止状态下自动隐藏（如果显示超过2秒没有滚动）
            scrollTimeout = setTimeout(() => {
                if (isVisible) {
                    indicator.classList.add("idle");
                }
            }, 2000);
        }

        // 鼠标移动事件 - 检测屏幕右侧四分之一区域显示/隐藏指示器
        function handleMouseMove(e) {
            // 计算屏幕右侧四分之一区域的起始位置
            const rightQuarterStart = (window.innerWidth * 3) / 4;
            // 检查鼠标是否在右侧四分之一区域
            const isAtRightEdge = e.clientX >= rightQuarterStart;

            if (isAtRightEdge) {
                // 鼠标在右侧边缘，立即显示指示器
                if (indicator.classList.contains("idle")) {
                    indicator.classList.remove("idle");
                }

                // 确保指示器是可见状态
                if (!isVisible) {
                    indicator.classList.add("visible");
                    isVisible = true;
                }

                // 延长自动隐藏时间到3秒，给予用户更多操作时间
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (isVisible) {
                        indicator.classList.add("idle");
                    }
                }, 3000);
            } else if (
                !indicator.classList.contains("idle") &&
                !indicator.matches(":hover")
            ) {
                // 鼠标离开触发区域且未悬停在指示器上，立即隐藏
                clearTimeout(hideTimeout);
                indicator.classList.add("idle");
            }
        }

        // 添加额外的隐藏计时器
        let hideTimeout;

        // 点击指示器滚动到对应页面
        indicatorItems.forEach((item) => {
            item.addEventListener("click", (e) => {
                const sectionId = item.getAttribute("data-section");
                const targetSection = document.getElementById(sectionId);

                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop,
                        behavior: "smooth",
                    });
                }
            });
        });

        // 语言切换支持
        function updateIndicatorLabels() {
            const currentLang = document
                .getElementById("lang-text")
                .textContent.toLowerCase();
            indicatorItems.forEach((item) => {
                const zhText = item.getAttribute("data-zh");
                const enText = item.getAttribute("data-en");
                item.setAttribute(
                    "data-tooltip",
                    currentLang === "cn" ? zhText : enText
                );
            });
        }

        // 添加事件监听器
        window.addEventListener("scroll", handleScroll);
        document.addEventListener("mousemove", handleMouseMove);

        // 监听语言切换事件
        const langToggle = document.getElementById("lang-toggle");
        if (langToggle) {
            langToggle.addEventListener("click", () => {
                // 延迟更新，确保语言已经切换
                setTimeout(updateIndicatorLabels, 100);
            });
        }

        // 初始调用
        handleScroll();
        updateIndicatorLabels();
    } catch (error) {
        (window.logger || console).error("初始化页面指示器时出错:", error);
    }
}

window.addEventListeners = addEventListeners;
window.initializePageComplete = initializePageComplete;

window.addEventListener("load", initializePageComplete);
