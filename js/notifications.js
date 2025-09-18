// 通知与复制相关
let currentNotification = null; // 跟踪当前显示的通知

// 显示背景预加载完成通知
function showBackgroundPrefetchNotification() {
    hideCurrentNotification(); // 覆盖前一条通知
    const notification = document.createElement("div");
    notification.className = "copy-notification success";
    notification.innerHTML = 
        window.currentLanguage === "zh" 
            ? "✨ 背景图预加载完成" 
            : "✨ Background image preloaded";
    document.body.appendChild(notification);
    currentNotification = notification;
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
        hideCopyNotification(notification);
        if (currentNotification === notification) currentNotification = null;
    }, 2000);
}

// 导出通知函数到window对象
window.showBackgroundPrefetchNotification = showBackgroundPrefetchNotification;

function hideCurrentNotification() {
    if (currentNotification) {
        hideCopyNotification(currentNotification);
        currentNotification = null;
    }
}

function showCopySuccessNotification() {
    hideCurrentNotification(); // 覆盖前一条通知
    const notification = document.createElement("div");
    notification.className = "copy-notification success";
    notification.innerHTML =
        window.currentLanguage === "zh"
            ? "✅ 已复制到剪贴板"
            : "✅ copied to clipboard";
    document.body.appendChild(notification);
    currentNotification = notification;
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
        hideCopyNotification(notification);
        if (currentNotification === notification) currentNotification = null;
    }, 3000);
}

function showCopyErrorNotification() {
    hideCurrentNotification(); // 覆盖前一条通知
    const notification = document.createElement("div");
    notification.className = "copy-notification error";
    notification.innerHTML =
        window.currentLanguage === "zh" ? "❌ 复制失败" : "❌ Copy failed";
    document.body.appendChild(notification);
    currentNotification = notification;
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
        hideCopyNotification(notification);
        if (currentNotification === notification) currentNotification = null;
    }, 5000);
}

function hideCopyNotification(notification) {
    if (
        !notification ||
        !notification.parentNode ||
        notification.classList.contains("hide")
    )
        return;
    notification.classList.remove("show");
    notification.classList.add("hide");
    setTimeout(() => {
        try {
            if (notification && notification.parentNode)
                notification.parentNode.removeChild(notification);
        } catch (e) {}
    }, 500);
}

function showServerCheckNotification() {
    hideCurrentNotification(); // 覆盖前一条通知
    const notification = document.createElement("div");
    notification.className = "copy-notification success";
    notification.innerHTML =
        window.currentLanguage === "zh"
            ? "🔍 正在重新检测服务器状态..."
            : "🔍 Rechecking server status...";
    notification.style.background = "rgba(76, 175, 80, 0.9)";
    document.body.appendChild(notification);
    currentNotification = notification;
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
        hideCopyNotification(notification);
        if (currentNotification === notification) currentNotification = null;
    }, 3000);
}

function ensureStackContainer() {
    let stack = document.querySelector(".notification-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "notification-stack";
        document.body.appendChild(stack);
    }
    return stack;
}

function mountNotification(node, useStack = true) {
    // 如果是主要通知（非堆叠），覆盖当前通知
    if (!useStack) {
        hideCurrentNotification();
        currentNotification = node;
    }

    if (useStack) {
        const stack = ensureStackContainer();
        stack.appendChild(node);
    } else {
        document.body.appendChild(node);
    }
    requestAnimationFrame(() => node.classList.add("show"));
}

function showBackgroundChangeNotification() {
    const n = document.createElement("div");
    n.className = "copy-notification success";
    n.innerHTML =
        window.currentLanguage === "zh"
            ? "🎨 背景图已随机更换！"
            : "🎨 Background changed randomly!";
    mountNotification(n, false); // 使用主要通知，会覆盖当前通知
    setTimeout(() => {
        hideCopyNotification(n);
        if (currentNotification === n) currentNotification = null;
    }, 2200);
}

function showLanguageChangeNotification() {
    const n = document.createElement("div");
    n.className = "copy-notification success";
    n.innerHTML =
        window.currentLanguage === "zh"
            ? "🌍 已切换到中文"
            : "🌍 Switched to English";
    mountNotification(n, false); // 使用主要通知，会覆盖当前通知
    setTimeout(() => {
        hideCopyNotification(n);
        if (currentNotification === n) currentNotification = null;
    }, 2000);
}

window.showCopySuccessNotification = showCopySuccessNotification;
window.showCopyErrorNotification = showCopyErrorNotification;
window.hideCopyNotification = hideCopyNotification;
window.hideCurrentNotification = hideCurrentNotification;
window.showServerCheckNotification = showServerCheckNotification;
window.showBackgroundChangeNotification = showBackgroundChangeNotification;
window.showLanguageChangeNotification = showLanguageChangeNotification;

// 复制到剪贴板的回退实现（供 HTML onclick 使用）
function fallbackCopyTextToClipboard(text) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
    } catch (e) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
                return true;
            }
        } catch (e2) {}
        return false;
    }
}

function copyServerAddress(address) {
    if (!address) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(address)
            .then(() => showCopySuccessNotification())
            .catch(() => {
                const ok = fallbackCopyTextToClipboard(address);
                ok
                    ? showCopySuccessNotification()
                    : showCopyErrorNotification();
            });
    } else {
        const ok = fallbackCopyTextToClipboard(address);
        ok ? showCopySuccessNotification() : showCopyErrorNotification();
    }
}

function changeRandomBackground() {
    let ok = false;
    if (window.crossfadeToPrefetched) {
        ok = window.crossfadeToPrefetched();
    } else if (window.applyPrefetchedBackgroundOrRandom) {
        ok = window.applyPrefetchedBackgroundOrRandom();
    } else if (window.checkLayoutAndSwitchBackground) {
        window.checkLayoutAndSwitchBackground(true);
        ok = true;
    }

    if (ok && window.showBackgroundChangeNotification) {
        window.showBackgroundChangeNotification();
    } else if (!ok) {
        // 没有可切换的预取背景时显示提示
        showNoPrefetchNotification();
    }
}

function showNoPrefetchNotification() {
    const n = document.createElement("div");
    n.className = "copy-notification no-prefetch-tip";
    n.style.background = "rgba(255, 193, 7, 0.9)"; // 黄色警告色

    // 简化提示文本，不显示进度
    const statusText = window.currentLanguage === "zh"
        ? "⏳ 背景图加载中，请稍候再试"
        : "⏳ Background loading, please wait";

    n.innerHTML = statusText;
    mountNotification(n, false); // 会覆盖当前通知
    setTimeout(() => {
        hideCopyNotification(n);
        if (currentNotification === n) currentNotification = null;
    }, 2500);
}

function showScrollNotification() {
    if (window.scrollNotificationShown) return;
    window.scrollNotificationShown = true;
    const n = document.createElement("div");
    n.className = "copy-notification scroll-tip";
    n.innerHTML =
        window.currentLanguage === "zh"
            ? "⬇️ 向下滚动，查看更多内容"
            : "⬇️ Scroll down to see more";
    mountNotification(n, false); // 会覆盖当前通知
    setTimeout(() => {
        hideCopyNotification(n);
        if (currentNotification === n) currentNotification = null;
    }, 3000);
}

window.copyServerAddress = copyServerAddress;
window.fallbackCopyTextToClipboard = fallbackCopyTextToClipboard;
window.changeRandomBackground = changeRandomBackground;
window.showScrollNotification = showScrollNotification;
window.showNoPrefetchNotification = showNoPrefetchNotification;
