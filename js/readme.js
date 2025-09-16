// README 加载与骨架屏
function createReadmeSkeleton() {
    const container = document.getElementById("markdown-content");
    if (!container || container.dataset.filled === "1") return;
    const skeleton = document.createElement("div");
    skeleton.className = "readme-skeleton";
    const pattern = [
        "long",
        "long",
        "mid",
        "long",
        "long",
        "short",
        "long",
        "mid",
        "long",
    ];
    skeleton.innerHTML = pattern
        .map((cls) => `<div class="line ${cls}"></div>`)
        .join("");
    container.innerHTML = "";
    container.appendChild(skeleton);
    container.dataset.filled = "1";
}

let isLoadingReadme = false; // 内部加载中标记
window.isLoadingReadme = false; // 对外暴露以便其他模块判断
window.readmeLoaded = false; // 是否已成功渲染完成

function renderMarkdown(markdownText) {
    // 使用本地解析器 LocalMD
    if (!window.LocalMD || typeof window.LocalMD.parse !== "function") {
        console.error("[README] LocalMD 未就绪，1s后重试...");
        setTimeout(() => renderMarkdown(markdownText), 1000);
        return;
    }

    try {
        // 可根据需要设置选项（占位，保持 API 一致）
        window.LocalMD.setOptions && window.LocalMD.setOptions({});
        let htmlContent = window.LocalMD.parse(markdownText);
        const markdownContent = document.getElementById("markdown-content");
        if (markdownContent) {
            markdownContent.innerHTML = htmlContent;
            const links = markdownContent.querySelectorAll("a");
            links.forEach((link) => {
                if (!link.hasAttribute("target"))
                    link.setAttribute("target", "_blank");
            });
            const images = markdownContent.querySelectorAll("img");
            images.forEach((img) => {
                if (!img.style.maxWidth) {
                    img.style.maxWidth = "100%";
                    img.style.height = "auto";
                    img.style.borderRadius = "8px";
                    img.style.margin = "10px 5px";
                }
                try {
                    const u = new URL(img.src, location.href);
                    if (/github-readme-stats\.vercel\.app/.test(u.host)) {
                        // 创建“加载中”占位
                        const placeholder = document.createElement("div");
                        placeholder.className = "external-img-loading";
                        placeholder.innerHTML =
                            '📊 <span data-zh="统计卡片加载中..." data-en="Loading stats card...">统计卡片加载中...</span>';
                        // 在原图前插入占位（仅第一次）
                        if (!img.__statsPlaceholderInserted) {
                            img.parentNode.insertBefore(placeholder, img);
                            img.__statsPlaceholderInserted = true;
                        }
                        // 使用带超时的图片加载，如果不可用则回退到原生事件
                        if (
                            window.netUtils &&
                            window.netUtils.loadImageWithTimeout
                        ) {
                            window.netUtils
                                .loadImageWithTimeout(img, 5000)
                                .then(() => {
                                    placeholder.classList.add("fade-out");
                                    setTimeout(() => placeholder.remove(), 300);
                                })
                                .catch(() => {
                                    const fail = Object.assign(
                                        document.createElement("div"),
                                        {
                                            className: "external-img-fallback",
                                            innerHTML:
                                                '📊 <span data-zh="与Github失去链接，统计卡片加载失败" data-en="Stats card failed">与Github失去链接，统计卡片加载失败</span>',
                                        }
                                    );
                                    placeholder.replaceWith(fail);
                                    img.remove();
                                });
                        } else {
                            // 加载成功后移除占位
                            img.addEventListener("load", () => {
                                placeholder.classList.add("fade-out");
                                setTimeout(() => placeholder.remove(), 300);
                            });
                            img.addEventListener("error", () => {
                                const fail = Object.assign(
                                    document.createElement("div"),
                                    {
                                        className: "external-img-fallback",
                                        innerHTML:
                                            '📊 <span data-zh="与Github失去链接，统计卡片加载失败" data-en="Stats card failed">与Github失去链接，统计卡片加载失败</span>',
                                    }
                                );
                                placeholder.replaceWith(fail);
                                img.remove();
                            });
                        }
                    } else if (/raw\.githubusercontent\.com/.test(u.host)) {
                        // 处理 GitHub 原始文件（如 GIF）
                        if (
                            window.netUtils &&
                            window.netUtils.loadImageWithTimeout
                        ) {
                            window.netUtils
                                .loadImageWithTimeout(img, 5000)
                                .catch(() => {
                                    console.warn(
                                        "[README] GitHub 原始文件加载失败:",
                                        img.src
                                    );
                                    const fallback =
                                        document.createElement("span");
                                    fallback.className = "github-raw-fallback";
                                    fallback.style.cssText =
                                        "font-size:0.8em;color:#666;opacity:0.7;";
                                    fallback.innerHTML =
                                        '🌐 <span data-zh="网络图片加载失败" data-en="Network image failed">网络图片加载失败</span>';
                                    img.replaceWith(fallback);
                                });
                        } else {
                            img.addEventListener("error", () => {
                                console.warn(
                                    "[README] GitHub 原始文件加载失败:",
                                    img.src
                                );
                                const fallback = document.createElement("span");
                                fallback.className = "github-raw-fallback";
                                fallback.style.cssText =
                                    "font-size:0.8em;color:#666;opacity:0.7;";
                                fallback.innerHTML =
                                    '🌐 <span data-zh="网络图片加载失败" data-en="Network image failed">网络图片加载失败</span>';
                                img.replaceWith(fallback);
                            });
                        }
                    }

                    // 对其他外部图片提供通用超时保护（用于 badges、shields 等）
                    try {
                        const isOtherExternal =
                            isExternal &&
                            !/github-readme-stats\.vercel\.app/.test(u.host) &&
                            !/raw\.githubusercontent\.com/.test(u.host);
                        if (
                            isOtherExternal &&
                            window.netUtils &&
                            window.netUtils.loadImageWithTimeout
                        ) {
                            if (img.complete) {
                                if (
                                    !(img.naturalWidth && img.naturalWidth > 0)
                                ) {
                                    const fallback =
                                        document.createElement("span");
                                    fallback.className =
                                        "external-img-fallback";
                                    fallback.innerHTML =
                                        '🌐 <span data-zh="网络图片加载失败" data-en="Network image failed">网络图片加载失败</span>';
                                    img.replaceWith(fallback);
                                }
                            } else {
                                window.netUtils
                                    .loadImageWithTimeout(img, 5000)
                                    .catch(() => {
                                        const fallback =
                                            document.createElement("span");
                                        fallback.className =
                                            "external-img-fallback";
                                        fallback.innerHTML =
                                            '🌐 <span data-zh="网络图片加载失败" data-en="Network image failed">网络图片加载失败</span>';
                                        img.replaceWith(fallback);
                                    });
                            }
                        }
                    } catch (_) {}
                } catch (_) {}
            });
        }
    } catch (error) {
        console.error("[README] markdown渲染失败:", error);
        const markdownContent = document.getElementById("markdown-content");
        if (markdownContent) {
            const zh = {
                title: "📝 Markdown渲染失败",
                msg: "请检查本地解析器是否正确加载",
                retry: "🔄 重新加载页面",
            };
            const en = {
                title: "📝 Markdown render failed",
                msg: "Please check if the local parser is loaded",
                retry: "🔄 Reload page",
            };
            const t = window.currentLanguage === "en" ? en : zh;
            markdownContent.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <h3>${t.title}</h3>
                    <p>${t.msg}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px;">
                        ${t.retry}
                    </button>
                </div>
            `;
        }
        return;
    }

    // 成功渲染后标记
    window.readmeLoaded = true;

    // 通知加载状态管理器
    if (window.setLoadingState) {
        window.setLoadingState("readmeLoaded", true);
    }

    // 检查是否可以开始预取
    setTimeout(() => {
        if (window.checkCanStartPrefetch) {
            window.checkCanStartPrefetch();
        }
    }, 100);
}

// 将GitHub README中的本地图片路径替换为存储桶链接
function replaceLocalImagePaths(markdownText) {
    // 替换本地gif文件路径为存储桶链接
    // 匹配格式：src="bqb_xxx.gif" 或 src='bqb_xxx.gif'
    let processedText = markdownText.replace(
        /src=["']([^"']*bqb_\d+\.gif)["']/g,
        'src="https://ysy.146019.xyz/bqb/AM/hp/$1"'
    );

    // 也处理可能的webp格式
    processedText = processedText.replace(
        /src=["']([^"']*bqb_\d+\.webp)["']/g,
        'src="https://ysy.146019.xyz/bqb/AM/hp/$1"'
    );

    // 处理loading图片
    processedText = processedText.replace(
        /src=["']([^"']*loading_\d+\.(?:gif|webp))["']/g,
        'src="https://ysy.146019.xyz/bqb/AM/$1"'
    );

    console.log("[README] 图片路径替换完成");
    return processedText;
}

// 从GitHub加载备用README
function loadGithubReadme() {
    console.log("[README] 尝试从GitHub加载备用README...");
    const githubUrl =
        "https://raw.githubusercontent.com/chen6019/chen6019/main/README.md";

    return (
        window.netUtils && window.netUtils.fetchWithTimeout
            ? window.netUtils.fetchWithTimeout(githubUrl, {}, 8000)
            : fetch(githubUrl)
    )
        .then((r) => {
            if (!r.ok) throw new Error(`GitHub README HTTP ${r.status}`);
            return r.text();
        })
        .then((markdownText) => {
            // 替换本地图片路径为存储桶链接
            const processedText = replaceLocalImagePaths(markdownText);
            console.log("[README] GitHub备用README加载成功");
            return processedText;
        });
}

function loadReadmeContent() {
    if (window.readmeLoaded) return; // 已加载则直接返回
    if (isLoadingReadme || window.isLoadingReadme) return; // 正在加载中

    // 检查本地解析器
    if (!window.LocalMD || typeof window.LocalMD.parse !== "function") {
        console.warn("[README] LocalMD 未加载，延迟重试...");
        setTimeout(loadReadmeContent, 500);
        return;
    }

    isLoadingReadme = true;
    window.isLoadingReadme = true;

    // 加载本地README.md文件（与网站文件一起部署到服务器）
    (window.netUtils && window.netUtils.fetchWithTimeout
        ? window.netUtils.fetchWithTimeout("/README.md", {}, 4000)
        : fetch("/README.md")
    )
        .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then((markdownText) => {
            console.log("[README] 本地README加载成功");
            renderMarkdown(markdownText);
        })
        .catch((e) => {
            console.error("加载本地 README 失败", e);
            console.log("[README] 尝试从GitHub加载备用README...");

            // 本地加载失败，尝试从GitHub加载
            return loadGithubReadme()
                .then((processedText) => {
                    renderMarkdown(processedText);
                })
                .catch((githubError) => {
                    console.error("GitHub备用README也加载失败", githubError);
                    window.showReadmeError && window.showReadmeError();
                });
        })
        .finally(() => {
            isLoadingReadme = false;
            window.isLoadingReadme = false;
        });
}

function showReadmeError() {
    const markdownContent = document.getElementById("markdown-content");
    if (!markdownContent) return;
    const errorTitle =
        window.currentLanguage === "zh" ? "😿 加载失败" : "😿 Loading Failed";
    const errorMsg1 =
        window.currentLanguage === "zh"
            ? "无法加载本地 README.md 文件，GitHub备用README也加载失败。"
            : "Failed to load local README.md file, and GitHub backup README also failed to load.";
    const errorMsg2 =
        window.currentLanguage === "zh"
            ? "请检查网络连接或稍后重试。"
            : "Please check your network connection or try again later.";
    const retryText =
        window.currentLanguage === "zh" ? "🔄 重试加载" : "🔄 Retry Loading";
    markdownContent.innerHTML = `<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.7);"><h2 style="color: #ff6b6b;">${errorTitle}</h2><p>${errorMsg1}</p><p>${errorMsg2}</p><button id="retry-readme-btn" class="btn" style="margin-top: 20px; display: inline-block; width: auto;">${retryText}</button></div>`;
    setTimeout(() => {
        const retryBtn = document.getElementById("retry-readme-btn");
        if (retryBtn) {
            retryBtn.addEventListener("click", function (e) {
                e.preventDefault();
                const loadingText =
                    window.currentLanguage === "zh"
                        ? "🔄 正在重新加载个人简介..."
                        : "🔄 Reloading personal profile...";
                markdownContent.innerHTML = `<div class="loading-readme" style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.7);"><p>${loadingText}</p></div>`;
                setTimeout(() => {
                    loadReadmeContent();
                }, 500);
            });
        }
    }, 100);
}

window.createReadmeSkeleton = createReadmeSkeleton;