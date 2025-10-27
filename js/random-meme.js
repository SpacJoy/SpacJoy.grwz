(function () {
    const STICKER_ENDPOINT = "https://eo-rad.ysy.146019.xyz/bqb/";
    const PREFETCH_TARGET = 5;
    const MAX_INFLIGHT = 3;

    let stickerQueue = [];
    let inflight = 0;
    let prefetchedNotified = false;
    let container = null;
    let activeLayer = null;

    function buildStickerUrl() {
        return `${STICKER_ENDPOINT}${STICKER_ENDPOINT.includes("?") ? "&" : "?"}t=${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;
    }

    function ensureContainer() {
        if (container) return container;
        container = document.getElementById("photo-random-container");
        if (!container) {
            container = document.querySelector(".project-image-wrapper");
            if (container) {
                container.id = "photo-random-container";
            }
        }
        if (container && !container.classList.contains("sticker-layer-container")) {
            container.classList.add("sticker-layer-container");
        }
        return container;
    }

    function createLayerElement() {
        const img = document.createElement("img");
        img.className = "sticker-layer project-image";
        img.decoding = "async";
        img.loading = "eager";
        img.alt = "Random sticker";
        return img;
    }

    function notifyPrefetchReadyIfNeeded() {
        if (!prefetchedNotified && stickerQueue.length >= PREFETCH_TARGET) {
            prefetchedNotified = true;
            if (window.showStickerPrefetchNotification) {
                setTimeout(() => window.showStickerPrefetchNotification(), 100);
            }
        }
    }

    function ensurePrefetchQueue() {
        while (stickerQueue.length + inflight < PREFETCH_TARGET) {
            if (inflight >= MAX_INFLIGHT) return;
            prefetchSticker();
        }
    }

    function prefetchSticker() {
        inflight++;
        const url = buildStickerUrl();
        const layer = createLayerElement();

        const cleanup = () => {
            layer.onload = null;
            layer.onerror = null;
        };

        layer.onload = () => {
            cleanup();
            inflight--;
            stickerQueue.push({ url, layer });
            notifyPrefetchReadyIfNeeded();
            ensurePrefetchQueue();
        };

        layer.onerror = () => {
            cleanup();
            inflight--;
            ensurePrefetchQueue();
        };

        layer.src = url;
    }

    function activateLayer(layer) {
        const host = ensureContainer();
        if (!host || !layer) return false;

        const previous = activeLayer;
        if (!previous) {
            layer.classList.add("active");
            layer.style.position = "relative";
            host.innerHTML = "";
            host.appendChild(layer);
            activeLayer = layer;
            return true;
        }

        layer.style.position = "absolute";
        layer.style.inset = "0";
        layer.style.opacity = "0";
        host.appendChild(layer);

        requestAnimationFrame(() => {
            layer.classList.add("active");
            layer.style.opacity = "1";
            previous.classList.remove("active");
            previous.classList.add("fading");
            previous.style.opacity = "0";
        });

        const teardown = () => {
            previous.removeEventListener("transitionend", teardown);
            if (previous.parentNode) previous.parentNode.removeChild(previous);
            layer.style.position = "relative";
            layer.style.inset = "";
        };

        previous.addEventListener("transitionend", teardown, { once: true });

        activeLayer = layer;
        return true;
    }

    function crossfadeToPrefetchedSticker() {
        if (stickerQueue.length === 0) {
            ensurePrefetchQueue();
            if (window.showStickerPrefetchingNotification) {
                window.showStickerPrefetchingNotification();
            }
            return false;
        }

        const entry = stickerQueue.shift();
        prefetchedNotified = false;
        activateLayer(entry.layer);
        ensurePrefetchQueue();
        return true;
    }

    function initializeStickerLayers() {
        const host = ensureContainer();
        if (!host) return;

        const existingActive = host.querySelector(".sticker-layer.active");
        if (existingActive) {
            activeLayer = existingActive;
        } else {
            const existing = host.querySelector(".sticker-layer");
            if (existing) {
                existing.classList.add("active");
                activeLayer = existing;
            }
        }

        if (!activeLayer) {
            const initialLayer = createLayerElement();
            initialLayer.classList.add("active");
            host.appendChild(initialLayer);
            activeLayer = initialLayer;
            initialLayer.onload = () => {
                initialLayer.onload = null;
                ensurePrefetchQueue();
            };
            initialLayer.onerror = () => {
                initialLayer.onerror = null;
                ensurePrefetchQueue();
            };
            initialLayer.src = buildStickerUrl();
        } else if (activeLayer.complete && activeLayer.naturalWidth > 0) {
            ensurePrefetchQueue();
        } else {
            activeLayer.addEventListener(
                "load",
                () => {
                    ensurePrefetchQueue();
                },
                { once: true }
            );
            activeLayer.addEventListener(
                "error",
                () => {
                    ensurePrefetchQueue();
                },
                { once: true }
            );
        }
    }

    window.refreshRandomPhoto = function refreshRandomPhoto() {
        if (window.showStickerRefreshingNotification) {
            window.showStickerRefreshingNotification();
        }
        const switched = crossfadeToPrefetchedSticker();
        if (switched && window.showStickerChangeNotification) {
            setTimeout(() => window.showStickerChangeNotification(), 180);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeStickerLayers);
    } else {
        initializeStickerLayers();
    }
})();
