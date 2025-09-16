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
            let finished = false;
            const onLoad = () => {
                if (finished) return;
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
                reject(new Error("timeout"));
            };

            const cleanup = () => {
                imgEl.removeEventListener("load", onLoad);
                imgEl.removeEventListener("error", onErr);
                clearTimeout(timer);
            };

            imgEl.addEventListener("load", onLoad);
            imgEl.addEventListener("error", onErr);

            const timer = setTimeout(onTimeout, timeout);
        });
    }

    window.netUtils = {
        fetchWithTimeout,
        loadImageWithTimeout,
    };
})();
