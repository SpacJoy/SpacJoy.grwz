// 服务器检测
async function checkServerStatus(url, timeout = 8000) {
    (window.logger || console).debug(`[Server Check] 开始检测服务器: ${url}`);
    const result = await checkServerWithImage(url, timeout);
    (window.logger || console).info(
        `[Server Check] ${url}: ${result.online ? "在线" : "离线"} (${
            result.status
        })${result.loadTime ? `, ${result.loadTime}ms` : ""}`
    );
    return result;
}

function checkServerWithImage(url, timeout) {
    return new Promise((resolve) => {
        const img = new Image();
        const startTime = Date.now();
        let resolved = false;
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                img.onload = null;
                img.onerror = null;
                resolve({ online: false, status: "timeout", reliable: true });
            }
        }, timeout);
        img.onload = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                const loadTime = Date.now() - startTime;
                resolve({
                    online: true,
                    status: "online",
                    reliable: true,
                    loadTime,
                });
            }
        };
        img.onerror = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                const loadTime = Date.now() - startTime;
                if (loadTime < 100)
                    resolve({
                        online: false,
                        status: "network_error",
                        reliable: false,
                    });
                else
                    resolve({
                        online: false,
                        status: "server_error",
                        reliable: true,
                    });
            }
        };
        try {
            const urlObj = new URL(url);
            const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${
                urlObj.port ? ":" + urlObj.port : ""
            }`;
            const iconPaths = [
                "/favicon.ico",
                "/favicon.png",
                "/apple-touch-icon.png",
                "/android-chrome-192x192.png",
                "/logo.png",
            ];
            let currentPathIndex = 0;
            function tryNextIcon() {
                if (currentPathIndex < iconPaths.length && !resolved) {
                    const iconUrl = `${baseUrl}${
                        iconPaths[currentPathIndex]
                    }?t=${Date.now()}`;
                    img.src = iconUrl;
                    currentPathIndex++;
                }
            }
            const originalOnError = img.onerror;
            img.onerror = () => {
                if (!resolved && currentPathIndex < iconPaths.length) {
                    setTimeout(tryNextIcon, 100);
                } else {
                    originalOnError();
                }
            };
            tryNextIcon();
        } catch (e) {
            clearTimeout(timeoutId);
            if (!resolved)
                resolve({
                    online: false,
                    status: "error",
                    reliable: false,
                    error: e.message,
                });
        }
    });
}

function updateServerStatusDisplay(serviceId, status) {
    (window.logger || console).debug(
        `[Server UI] ${serviceId}: ${status.online ? "在线" : "离线"} (${
            status.status
        })`
    );
    const statusElement = document.getElementById(`${serviceId}-status`);
    if (!statusElement) return;
    let statusIcon, statusText, statusColor, tooltipText;
    switch (status.status) {
        case "online":
            statusIcon = "🟢";
            statusText = window.currentLanguage === "zh" ? "在线" : "Online";
            statusColor = "#4CAF50";
            const responseTime = status.loadTime
                ? ` (${
                      window.currentLanguage === "zh"
                          ? "响应时间"
                          : "Response time"
                  }: ${status.loadTime}ms)`
                : "";
            const clickToRecheck =
                window.currentLanguage === "zh"
                    ? "点击重新检测"
                    : "Click to recheck";
            tooltipText = `${
                window.currentLanguage === "zh"
                    ? "服务器正常运行"
                    : "Server running normally"
            }${responseTime} - ${clickToRecheck}`;
            break;
        case "server_error":
            statusIcon = "🔴";
            statusText =
                window.currentLanguage === "zh" ? "服务器错误" : "Server Error";
            statusColor = "#F44336";
            tooltipText = `${
                window.currentLanguage === "zh" ? "服务器错误" : "Server error"
            } - ${
                window.currentLanguage === "zh"
                    ? "点击重新检测"
                    : "Click to recheck"
            }`;
            break;
        case "timeout":
            statusIcon = "🟡";
            statusText = window.currentLanguage === "zh" ? "超时" : "Timeout";
            statusColor = "#FF9800";
            tooltipText = `${
                window.currentLanguage === "zh"
                    ? "连接超时，服务器可能过载"
                    : "Connection timeout, server may be overloaded"
            } - ${
                window.currentLanguage === "zh"
                    ? "点击重新检测"
                    : "Click to recheck"
            }`;
            break;
        case "network_error":
            statusIcon = "🟠";
            statusText =
                window.currentLanguage === "zh" ? "网络错误" : "Network Error";
            statusColor = "#FF5722";
            tooltipText = `${
                window.currentLanguage === "zh"
                    ? "网络连接问题"
                    : "Network connection issue"
            } - ${
                window.currentLanguage === "zh"
                    ? "点击重新检测"
                    : "Click to recheck"
            }`;
            break;
        default:
            statusIcon = "🔴";
            statusText = window.currentLanguage === "zh" ? "离线" : "Offline";
            statusColor = "#F44336";
            tooltipText = `${
                window.currentLanguage === "zh"
                    ? "服务器不可达"
                    : "Server unreachable"
            } - ${
                window.currentLanguage === "zh"
                    ? "点击重新检测"
                    : "Click to recheck"
            }`;
    }
    statusElement.innerHTML = `<span style="color: ${statusColor}; cursor: pointer;" onclick="recheckServerStatus()" title="${tooltipText}">${statusIcon} ${statusText}</span>`;
}

async function checkAllServerStatus() {
    if (window.isCheckingServers) return;
    (window.logger || console).info(
        `[Server Check] 开始批量检测所有服务器状态`
    );
    window.isCheckingServers = true;
    const servers = [
        {
            id: "openlist",
            url: "https://openlist.146019.xyz",
            name: "Openlist",
        },
        { id: "photo", url: "https://photo.146019.xyz", name: "相册服务" },
        { id: "fnos", url: "https://fn.146019.xyz/v", name: "飞牛服务" },
        { id: "moontv", url: "https://moontv.146019.xyz", name: "MoonTV" },
        {
            id: "moon-primary",
            url: "https://moon.146019.xyz",
            name: "MoonTV主站",
        },
    ];
    const promises = servers.map(async (server) => {
        try {
            const status = await checkServerStatus(server.url);
            updateServerStatusDisplay(server.id, status);
            return { id: server.id, name: server.name, ...status };
        } catch (error) {
            updateServerStatusDisplay(server.id, {
                online: false,
                status: "error",
                error: error.message,
            });
            return {
                id: server.id,
                name: server.name,
                online: false,
                status: "error",
                error: error.message,
            };
        }
    });
    try {
        const results = await Promise.all(promises);
        (window.logger || console).info(
            `[Server Check] 所有服务器检测完成，共检测 ${results.length} 个服务器`
        );
        // 汇总在线和离线数量
        const onlineCount = results.filter((r) => r.online).length;
        const offlineCount = results.length - onlineCount;
        (window.logger || console).info(
            `[Server Check] 检测结果汇总: 在线 ${onlineCount} 个, 离线 ${offlineCount} 个`
        );
        window.isCheckingServers = false;
        // 标记服务器检查已完成
        if (window.loadingStates) {
            window.loadingStates.serversChecked = true;
            (window.logger || console).debug(
                `[Server Check] 服务器状态已标记为检查完成`
            );
            // 检查是否可以开始预加载背景图
            if (window.checkCanStartPrefetch) {
                window.checkCanStartPrefetch();
            }
        }
    } catch (e) {
        (window.logger || console).error(
            `[Server Check] 批量检测服务器过程中发生错误:`,
            e
        );
        window.isCheckingServers = false;
        // 即使发生错误也标记检查完成
        if (window.loadingStates) {
            window.loadingStates.serversChecked = true;
        }
    }
}

function recheckServerStatus() {
    (window.logger || console).info(
        `[Server Check] 用户触发重新检测服务器状态`
    );
    const openlistStatus = document.getElementById("openlist-status");
    const photoStatus = document.getElementById("photo-status");
    const fnosStatus = document.getElementById("fnos-status");

    const moontvStatus = document.getElementById("moontv-status");
    const moonPrimaryStatus = document.getElementById("moon-primary-status");
    const checkingText =
        window.currentLanguage === "zh" ? "🔄 检测中..." : "🔄 Checking...";
    if (openlistStatus) openlistStatus.innerHTML = checkingText;
    if (photoStatus) photoStatus.innerHTML = checkingText;
    if (fnosStatus) fnosStatus.innerHTML = checkingText;

    if (moontvStatus) moontvStatus.innerHTML = checkingText;
    if (moonPrimaryStatus) moonPrimaryStatus.innerHTML = checkingText;
    showServerCheckNotification();
    setTimeout(checkAllServerStatus, 200);
}

function showServerCheckNotification() {
    (window.logger || console).debug(
        `[Server Check Notification] 显示服务器检测通知`
    );
    const notification = document.createElement("div");
    notification.className = "copy-notification success";
    notification.innerHTML =
        window.currentLanguage === "zh"
            ? "🔍 正在重新检测服务器状态..."
            : "🔍 Rechecking server status...";
    notification.style.background = "rgba(76, 175, 80, 0.9)";
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(
        () =>
            window.hideCopyNotification &&
            window.hideCopyNotification(notification),
        3000
    );
}

window.checkServerStatus = checkServerStatus;
window.checkAllServerStatus = checkAllServerStatus;
window.updateServerStatusDisplay = updateServerStatusDisplay;
window.recheckServerStatus = recheckServerStatus;
