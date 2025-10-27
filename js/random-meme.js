(function () {
    const STICKER_ENDPOINT = "https://eo-rad.ysy.146019.xyz/bqb/";
    const PREFETCH_TARGET = 5;
    const MAX_INFLIGHT = 2;

    let stickerQueue = [];
    let inflight = 0;
    let initialized = false;
    let prefetchedNotified = false;
    let lastPrefetchingNotice = 0;
    let imageEl = null;
    let pendingStickerLoadHandler = null;
    let pendingStickerErrorHandler = null;
    let directLoadPending = false;

    function buildStickerUrl() {
        return `${STICKER_ENDPOINT}${STICKER_ENDPOINT.includes('?') ? '&' : '?'}t=${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;
    }

    function ensureImageElement() {
        if (!imageEl) {
            imageEl = document.getElementById("photo-random-image");
        }
        return imageEl;
    }

    function notifyPrefetchReadyIfNeeded() {
        if (stickerQueue.length >= PREFETCH_TARGET && !prefetchedNotified) {
            prefetchedNotified = true;
            if (window.showStickerPrefetchNotification) {
                setTimeout(() => window.showStickerPrefetchNotification(), 200);
            }
        }
    }

    function ensurePrefetchQueue() {
        const desired = PREFETCH_TARGET;
        while (stickerQueue.length + inflight < desired) {
            if (inflight >= MAX_INFLIGHT) {
                break;
            }
            prefetchSticker();
        }
    }

    function prefetchSticker() {
        if (inflight >= MAX_INFLIGHT) {
            return;
        }
        inflight++;
        const url = buildStickerUrl();
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.onload = () => {
            stickerQueue.push(url);
            inflight--;
            notifyPrefetchReadyIfNeeded();
            ensurePrefetchQueue();
        };
        img.onerror = () => {
            inflight--;
            ensurePrefetchQueue();
        };
        img.src = url;
    }

    function showPrefetchingNotice() {
        const now = Date.now();
        if (now - lastPrefetchingNotice < 1500) return;
        lastPrefetchingNotice = now;
        if (window.showStickerPrefetchingNotification) {
            window.showStickerPrefetchingNotification();
        }
    }

    function setImageSourceWithCallback(img, url, onComplete) {
        if (!img) return;

        if (pendingStickerLoadHandler) {
            img.removeEventListener("load", pendingStickerLoadHandler);
            pendingStickerLoadHandler = null;
        }
        if (pendingStickerErrorHandler) {
            img.removeEventListener("error", pendingStickerErrorHandler);
            pendingStickerErrorHandler = null;
        }

        const cleanup = () => {
            if (pendingStickerLoadHandler) {
                img.removeEventListener("load", pendingStickerLoadHandler);
                pendingStickerLoadHandler = null;
            }
            if (pendingStickerErrorHandler) {
                img.removeEventListener("error", pendingStickerErrorHandler);
                pendingStickerErrorHandler = null;
            }
        };

        const handler = () => {
            cleanup();
            if (typeof onComplete === "function") {
                onComplete(true);
            }
        };

        const errorHandler = () => {
            cleanup();
            if (typeof onComplete === "function") {
                onComplete(false);
            }
        };

        if (img.complete && img.naturalWidth > 0 && img.src === url) {
            handler();
            return;
        }

        pendingStickerLoadHandler = handler;
        pendingStickerErrorHandler = errorHandler;
        img.addEventListener("load", handler, { once: true });
        img.addEventListener("error", errorHandler, { once: true });
        img.src = url;
    }

    function applyPrefetchedSticker() {
        const img = ensureImageElement();
        if (!img) return;

        if (stickerQueue.length === 0) {
            prefetchedNotified = false;
            ensurePrefetchQueue();
            showPrefetchingNotice();

            if (directLoadPending) {
                return;
            }

            directLoadPending = true;
            setImageSourceWithCallback(img, buildStickerUrl(), (success) => {
                directLoadPending = false;
                if (success) {
                    if (window.showStickerChangeNotification) {
                        window.showStickerChangeNotification();
                    }
                } else if (window.showStickerPrefetchingNotification) {
                    window.showStickerPrefetchingNotification();
                }
            });
            return;
        }

        const url = stickerQueue.shift();
        prefetchedNotified = false;
        setImageSourceWithCallback(img, url, (success) => {
            if (success && window.showStickerChangeNotification) {
                window.showStickerChangeNotification();
            } else if (!success && window.showStickerPrefetchingNotification) {
                window.showStickerPrefetchingNotification();
            }
        });
        ensurePrefetchQueue();
    }

    function initRandomSticker() {
        if (initialized) return;
        initialized = true;
        const img = ensureImageElement();
        if (!img) return;

        const startPrefetch = () => {
            img.removeEventListener("load", startPrefetch);
            ensurePrefetchQueue();
        };

        if (img.complete && img.naturalWidth > 0) {
            ensurePrefetchQueue();
        } else {
            img.addEventListener("load", startPrefetch);
        }
    }

    window.refreshRandomPhoto = function refreshRandomPhoto() {
        applyPrefetchedSticker();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initRandomSticker);
    } else {
        initRandomSticker();
    }
})();
