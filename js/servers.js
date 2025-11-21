const DEFAULT_ICON_PATHS = [
    "/favicon.ico",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/android-chrome-192x192.png",
    "/logo.png",
];
const DEGRADED_HTTP_CODES = new Set([401, 403, 404, 405, 406, 429, 451]);

// 服务器检测
async function checkServerStatus(target, timeout = 8000) {
    const config = typeof target === "string" ? { url: target } : target || {};
    const { url, fetchProbePath = "/", assetPaths = DEFAULT_ICON_PATHS } = config;
    const fetchProbeTargets = Array.isArray(fetchProbePath) && fetchProbePath.length
        ? fetchProbePath
        : [fetchProbePath];
    const logger = window.logger || console;
    if (!url) {
        logger.warn("[Server Check] 未提供服务器地址，检测被跳过");
        return {
            online: false,
            status: "error",
            reliable: false,
            method: "validation",
            error: "missing_url",
        };
    }
    logger.debug(`[Server Check] 开始检测服务器: ${url}`);
    const normalizedUrl = normalizeServerUrl(url);
    if (!normalizedUrl) {
        const invalidResult = {
            online: false,
            status: "error",
            reliable: false,
            error: "invalid_url",
            method: "validation",
        };
        logger.info(
            `[Server Check] ${url}: ${invalidResult.online ? "在线" : "离线"} (${invalidResult.status})`
        );
        return invalidResult;
    }
    if (!window.fetch || typeof window.fetch !== "function") {
        logger.warn(`[Server Check] 环境缺少 fetch，退回图像探测: ${normalizedUrl}`);
        const legacyResult = await checkServerViaImage(normalizedUrl, timeout, assetPaths);
        logger.info(
            `[Server Check] ${url}: ${legacyResult.online ? "在线" : "离线"} (${legacyResult.status
            })${legacyResult.loadTime ? `, ${legacyResult.loadTime}ms` : ""}`
        );
        return legacyResult;
    }
    if (typeof AbortController === "undefined") {
        logger.warn(`[Server Check] 环境缺少 AbortController，退回图像探测: ${normalizedUrl}`);
        const legacyResult = await checkServerViaImage(normalizedUrl, timeout, assetPaths);
        logServerResult(logger, url, legacyResult);
        return legacyResult;
    }
    const headTimeout = Math.max(1500, Math.min(Math.floor(timeout / 2), 6000));
    try {
        const headResponse = await timedRequest(normalizedUrl, {
            method: "HEAD",
            cache: "no-store",
            redirect: "follow",
            timeout: headTimeout,
        });
        const headStatus = mapHttpStatus(headResponse.response.status, headResponse.loadTime, "head");
        logServerResult(logger, url, headStatus);
        return headStatus;
    } catch (error) {
        handleProbeError(logger, "HEAD", normalizedUrl, error);
    }
    try {
        const opaqueHead = await timedRequest(normalizedUrl, {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-store",
            redirect: "follow",
            timeout: Math.max(1500, Math.floor(timeout / 2)),
        });
        const opaqueStatus = mapOpaqueResult(opaqueHead.loadTime, "head:no-cors", normalizedUrl);
        logServerResult(logger, url, opaqueStatus);
        return opaqueStatus;
    } catch (error) {
        handleProbeError(logger, "no-cors HEAD", normalizedUrl, error);
    }
    const fetchProbeTimeout = Math.max(2500, Math.min(timeout, 12000));
    let fetchProbe = {
        success: false,
        reason: "skipped",
        method: "fetch:no-cors",
    };
    for (const targetPath of fetchProbeTargets) {
        fetchProbe = await probeViaNoCorsFetch(normalizedUrl, targetPath, fetchProbeTimeout);
        if (fetchProbe.success) {
            logServerResult(logger, url, fetchProbe.status);
            return fetchProbe.status;
        }
        if (fetchProbe.reason !== "error") {
            break;
        }
    }
    const staticProbe = await probeStaticAssets(normalizedUrl, timeout, assetPaths);
    if (staticProbe.success) {
        logServerResult(logger, url, staticProbe.status);
        return staticProbe.status;
    }
    const imageProbe = await checkServerViaImage(normalizedUrl, Math.max(1500, Math.floor(timeout / 2)), assetPaths);
    if (imageProbe.online) {
        logServerResult(logger, url, imageProbe);
        return imageProbe;
    }
    const finalReliability = typeof imageProbe.reliable === "boolean"
        ? imageProbe.reliable
        : typeof staticProbe.reliable === "boolean"
            ? staticProbe.reliable
            : typeof fetchProbe.reliable === "boolean"
                ? fetchProbe.reliable
                : false;
    const finalStatus = {
        online: false,
        status: fetchProbe.reason === "timeout" || staticProbe.reason === "timeout" || imageProbe.status === "timeout"
            ? "timeout"
            : imageProbe.status || staticProbe.reason || fetchProbe.reason || "network_error",
        reliable: finalReliability,
        httpStatus: null,
        method: imageProbe.method || staticProbe.method || fetchProbe.method || "composite",
        loadTime: imageProbe.loadTime || staticProbe.loadTime || fetchProbe.loadTime,
        error: imageProbe.error || staticProbe.error || fetchProbe.error,
        checkedUrl: imageProbe.checkedUrl || staticProbe.checkedUrl || fetchProbe.checkedUrl,
        clientOffline: typeof navigator !== "undefined" && navigator.onLine === false,
    };
    logServerResult(logger, url, finalStatus);
    return finalStatus;
}

function normalizeServerUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        parsed.pathname = "/";
        parsed.search = "";
        parsed.hash = "";
        return parsed.toString();
    } catch (error) {
        (window.logger || console).warn(`[Server Check] 无法解析服务器地址: ${rawUrl}`, error);
        return null;
    }
}

function timedRequest(resource, options = {}) {
    const { timeout = 8000, ...fetchOptions } = options;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => controller && controller.abort(), timeout);
    const startAt = Date.now();
    const fetchPromise = fetch(resource, {
        ...fetchOptions,
        signal: controller ? controller.signal : undefined,
    });
    return fetchPromise
        .then((response) => {
            clearTimeout(timer);
            return { response, loadTime: Date.now() - startAt };
        })
        .catch((error) => {
            clearTimeout(timer);
            error.elapsedTime = Date.now() - startAt;
            throw error;
        });
}

function mapHttpStatus(statusCode, loadTime, method) {
    if (statusCode >= 200 && statusCode < 400) {
        return {
            online: true,
            status: "online",
            httpStatus: statusCode,
            loadTime,
            reliable: true,
            method,
        };
    }
    if (statusCode >= 500) {
        return {
            online: false,
            status: "server_error",
            httpStatus: statusCode,
            loadTime,
            reliable: true,
            method,
        };
    }
    if (DEGRADED_HTTP_CODES.has(statusCode)) {
        return {
            online: true,
            status: "degraded",
            httpStatus: statusCode,
            loadTime,
            reliable: true,
            method,
        };
    }
    return {
        online: false,
        status: "server_error",
        httpStatus: statusCode,
        loadTime,
        reliable: true,
        method,
    };
}

function mapOpaqueResult(loadTime, method, checkedUrl) {
    return {
        online: true,
        status: "online",
        httpStatus: null,
        loadTime,
        reliable: false,
        method,
        checkedUrl,
    };
}

function handleProbeError(logger, label, url, error) {
    const baseMessage = `[Server Check] ${label} 请求失败: ${url}`;
    if (error && error.name === "AbortError") {
        logger.warn(`${baseMessage} (timeout)`);
    } else {
        logger.debug(`${baseMessage}`, error);
    }
}

function logServerResult(logger, url, result) {
    const httpPart = result.httpStatus ? `, HTTP ${result.httpStatus}` : "";
    const loadPart = result.loadTime ? `, ${result.loadTime}ms` : "";
    logger.info(
        `[Server Check] ${url}: ${result.online ? "在线" : "离线"} (${result.status}${httpPart})${loadPart}`
    );
}

async function probeViaNoCorsFetch(baseUrl, path = "/", timeout = 4000) {
    const method = "fetch:no-cors";
    let resourceUrl = baseUrl;
    try {
        const targetPath = typeof path === "string" && path.length ? path : "/";
        resourceUrl = new URL(targetPath, baseUrl).toString();
    } catch (error) {
        return {
            success: false,
            reason: "error",
            method,
            error: error.message,
            checkedUrl: resourceUrl,
        };
    }
    try {
        const timing = await timedRequest(resourceUrl, {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
            redirect: "follow",
            credentials: "omit",
            timeout,
        });
        return {
            success: true,
            status: mapOpaqueResult(timing.loadTime, method, resourceUrl),
        };
    } catch (error) {
        const reason = error && error.name === "AbortError" ? "timeout" : "network_error";
        return {
            success: false,
            reason,
            method,
            error: error ? error.message : undefined,
            loadTime: error && typeof error.elapsedTime === "number" ? error.elapsedTime : undefined,
            checkedUrl: resourceUrl,
            reliable: false,
        };
    }
}

async function probeStaticAssets(baseUrl, timeout, paths = DEFAULT_ICON_PATHS) {
    const iconPaths = Array.isArray(paths) && paths.length ? paths : DEFAULT_ICON_PATHS;
    const perRequestTimeout = Math.max(1200, Math.floor(timeout / Math.max(iconPaths.length, 1)));
    let failureReason = "network_error";
    let lastUrl = null;
    let lastError = null;
    let lastElapsed = null;
    for (const path of iconPaths) {
        const assetUrl = new URL(`${path}?t=${Date.now()}`, baseUrl).toString();
        lastUrl = assetUrl;
        try {
            const timing = await timedRequest(assetUrl, {
                method: "GET",
                mode: "no-cors",
                cache: "no-store",
                credentials: "omit",
                timeout: perRequestTimeout,
            });
            return {
                success: true,
                status: mapOpaqueResult(timing.loadTime, "asset", assetUrl),
            };
        } catch (error) {
            if (error && error.name === "AbortError") {
                failureReason = "timeout";
            }
            lastError = error ? error.message : null;
            lastElapsed = error && typeof error.elapsedTime === "number" ? error.elapsedTime : null;
        }
    }
    return {
        success: false,
        reason: failureReason,
        method: "asset",
        checkedUrl: lastUrl,
        error: lastError,
        loadTime: lastElapsed,
        reliable: false,
    };
}

function checkServerViaImage(url, timeout, paths = DEFAULT_ICON_PATHS) {
    return new Promise((resolve) => {
        const img = new Image();
        const startTime = Date.now();
        let resolved = false;
        let lastAttemptedUrl = null;
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve({
                    online: false,
                    status: "timeout",
                    reliable: true,
                    method: "image",
                    checkedUrl: lastAttemptedUrl,
                });
            }
        }, timeout);
        const cleanup = () => {
            clearTimeout(timeoutId);
            img.onload = null;
            img.onerror = null;
        };
        img.onload = () => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve({
                    online: true,
                    status: "online",
                    reliable: false,
                    loadTime: Date.now() - startTime,
                    method: "image",
                    checkedUrl: lastAttemptedUrl,
                });
            }
        };
        img.onerror = () => {
            if (!resolved) {
                resolved = true;
                const loadTime = Date.now() - startTime;
                cleanup();
                resolve({
                    online: false,
                    status: loadTime < 100 ? "network_error" : "server_error",
                    reliable: loadTime >= 100,
                    loadTime,
                    method: "image",
                    checkedUrl: lastAttemptedUrl,
                });
            }
        };
        try {
            const baseUrl = normalizeServerUrl(url);
            if (!baseUrl) {
                cleanup();
                resolve({
                    online: false,
                    status: "error",
                    reliable: false,
                    method: "image",
                    error: "invalid_url",
                });
                return;
            }
            const iconPaths = Array.isArray(paths) && paths.length ? paths : DEFAULT_ICON_PATHS;
            let currentIndex = 0;
            const tryNext = () => {
                if (resolved || currentIndex >= iconPaths.length) return;
                const targetUrl = new URL(`${iconPaths[currentIndex]}?t=${Date.now()}`, baseUrl).toString();
                currentIndex += 1;
                lastAttemptedUrl = targetUrl;
                img.src = targetUrl;
            };
            const originalError = img.onerror;
            img.onerror = () => {
                if (!resolved && currentIndex < iconPaths.length) {
                    setTimeout(tryNext, 120);
                } else {
                    originalError();
                }
            };
            tryNext();
        } catch (error) {
            cleanup();
            resolve({
                online: false,
                status: "error",
                reliable: false,
                method: "image",
                error: error.message,
            });
        }
    });
}

function updateServerStatusDisplay(serviceId, status) {
    (window.logger || console).debug(
        `[Server UI] ${serviceId}: ${status.online ? "在线" : "离线"} (${status.status})`
    );
    const statusElement = document.getElementById(`${serviceId}-status`);
    if (!statusElement) return;
    const isZh = window.currentLanguage === "zh";
    const recheckPrompt = isZh ? "点击重新检测" : "Click to recheck";
    let statusIcon = "🔴";
    let statusText = isZh ? "离线" : "Offline";
    let statusColor = "#F44336";
    let tooltipBase = isZh ? "服务器不可达" : "Server unreachable";
    switch (status.status) {
        case "online":
            statusIcon = "🟢";
            statusText = isZh ? "在线" : "Online";
            statusColor = "#4CAF50";
            tooltipBase = isZh ? "服务器正常运行" : "Server running normally";
            break;
        case "degraded":
            statusIcon = "⚠️";
            statusText = isZh ? "受限" : "Limited";
            statusColor = "#FFC107";
            tooltipBase = isZh ? "服务器可访问但存在限制" : "Reachable with limitations";
            break;
        case "server_error":
            statusIcon = "🔴";
            statusText = isZh ? "服务器错误" : "Server Error";
            statusColor = "#F44336";
            tooltipBase = isZh ? "服务器返回错误" : "Server returned an error";
            break;
        case "timeout":
            statusIcon = "🟡";
            statusText = isZh ? "超时" : "Timeout";
            statusColor = "#FF9800";
            tooltipBase = isZh ? "连接超时，服务器可能过载" : "Connection timed out, server may be overloaded";
            break;
        case "network_error":
            statusIcon = "🟠";
            statusText = isZh ? "网络错误" : "Network Error";
            statusColor = "#FF5722";
            tooltipBase = isZh ? "网络连接问题" : "Network connectivity issue";
            break;
        case "error":
            statusIcon = "🔴";
            statusText = isZh ? "检测失败" : "Check Failed";
            statusColor = "#F44336";
            tooltipBase = isZh ? "检测过程中出现错误" : "Error during server check";
            break;
        default:
            break;
    }
    const tooltipInfo = [];
    if (typeof status.loadTime === "number") {
        tooltipInfo.push(`${isZh ? "响应时间" : "Response time"} ${status.loadTime}ms`);
    }
    if (status.httpStatus) {
        tooltipInfo.push(`${isZh ? "HTTP状态" : "HTTP"} ${status.httpStatus}`);
    }
    if (status.reliable === false) {
        tooltipInfo.push(isZh ? "结果根据跨域限制推断" : "Estimated due to CORS limits");
    }
    if (status.method) {
        tooltipInfo.push(getProbeMethodLabel(status.method, isZh));
    }
    if (status.checkedUrl) {
        try {
            const parsed = new URL(status.checkedUrl);
            const resource = parsed.pathname;
            tooltipInfo.push(`${isZh ? "探测资源" : "Probe resource"} ${resource}`);
        } catch (error) {
            tooltipInfo.push(`${isZh ? "探测资源" : "Probe resource"} ${status.checkedUrl}`);
        }
    }
    if (status.clientOffline) {
        tooltipInfo.push(isZh ? "本地网络不可用" : "Client offline");
    }
    if (status.error && typeof status.error === "string") {
        tooltipInfo.push(status.error);
    }
    const tooltipText = `${tooltipBase}${tooltipInfo.length ? ` - ${tooltipInfo.join(" · ")}` : ""} - ${recheckPrompt}`;
    statusElement.innerHTML = `<span style="color: ${statusColor}; cursor: pointer;" onclick="recheckServerStatus()" title="${tooltipText}">${statusIcon} ${statusText}</span>`;
}

function getProbeMethodLabel(method, isZh) {
    switch (method) {
        case "head":
            return isZh ? "HEAD探测" : "HEAD probe";
        case "head:no-cors":
            return isZh ? "HEAD探测(跨域)" : "HEAD probe (no-cors)";
        case "fetch:no-cors":
            return isZh ? "GET探测(跨域)" : "GET probe (no-cors)";
        case "asset":
            return isZh ? "图标探测" : "Icon probe";
        case "image":
            return isZh ? "图像探测" : "Image probe";
        case "validation":
            return isZh ? "地址校验" : "URL validation";
        case "composite":
            return isZh ? "综合判定" : "Composite evaluation";
        default:
            return method;
    }
}

async function checkAllServerStatus() {
    if (window.isCheckingServers) return;
    (window.logger || console).info(
        `[Server Check] 开始批量检测所有服务器状态`
    );
    window.isCheckingServers = true;
    const servers = [
        {
            id: "Blog",
            url: "https://blog.spacjoy.top",
            name: "Blog",
        },
        { id: "fnos", url: "https://ys.146019.xyz:1125", name: "飞牛服务" },
        { id: "moontv", url: "https://moon-nf.netlify.app", name: "MoonTV" },
        {
            id: "moon-primary",
            url: "https://tv.146019.xyz:1125",
            name: "MoonTV主站",
        },
    ];
    const promises = servers.map(async (server) => {
        try {
            const status = await checkServerStatus(server);
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
