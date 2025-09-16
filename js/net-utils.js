// 网络工具：提供带超时的 fetch 与图片加载包装
(function () {
    "use strict";

    function fetchWithTimeout(url, options = {}, timeout = 8000) {
        // 返回一个 Promise，超时则 reject
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error("timeout"));
            }, timeout);

            fetch(url, options)
                .then((res) => {
                    clearTimeout(timer);
                    resolve(res);
                })
                .catch((err) => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    function loadImageWithTimeout(imgEl, timeout = 8000) {
        return new Promise((resolve, reject) => {
            if (!imgEl) return reject(new Error("no-image"));

            const isString = typeof imgEl === "string";
            let img = null;
            let created = false;
            try {
                if (isString) {
                    img = new Image();
                    created = true;
                } else {
                    img = imgEl;
                }
            } catch (e) {
                return reject(new Error("invalid-image"));
            }

            let finished = false;
            const cleanup = () => {
                try {
                    img.removeEventListener("load", onLoad);
                    img.removeEventListener("error", onErr);
                } catch (_) {}
                clearTimeout(timer);
            };

            const onLoad = () => {
                if (finished) return;
                // Some browsers report load even when naturalWidth is 0 for broken images
                if (img && img.naturalWidth === 0) {
                    onErr();
                    return;
                }
                finished = true;
                cleanup();
                resolve();
            };

            const onErr = () => {
                if (finished) return;
                finished = true;
                cleanup();
                reject(new Error("error"));
            };

            const onTimeout = () => {
                if (finished) return;
                finished = true;
                cleanup();
                // try to cancel if we created the Image
                try {
                    if (created) img.src = "";
                } catch (_) {}
                reject(new Error("timeout"));
            };

            // If the element is already complete, resolve/reject immediately
            try {
                if (!isString && img.complete) {
                    if (img.naturalWidth && img.naturalWidth > 0) {
                        return resolve();
                    } else {
                        return reject(new Error("error"));
                    }
                }
            } catch (_) {}

            img.addEventListener("load", onLoad);
            img.addEventListener("error", onErr);

            const timer = setTimeout(onTimeout, timeout);

            // If a URL string was provided, start loading it
            if (isString) {
                try {
                    img.src = imgEl;
                } catch (e) {
                    // assign error
                    onErr();
                }
            }
        });
    }

    window.netUtils = {
        fetchWithTimeout,
        loadImageWithTimeout,
    };
})();
