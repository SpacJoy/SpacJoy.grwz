// Simple logger with levels and concise formatting
// Usage: window.logger.info('message', optionalData)
// Levels: 'off' < 'error' < 'warn' < 'info' < 'debug'
(function () {
    const LEVELS = { off: 0, error: 1, warn: 2, info: 3, debug: 4 };

    function parseLevel(raw) {
        if (!raw) return null;
        const v = String(raw).toLowerCase();
        return LEVELS[v] != null ? v : null;
    }

    function getInitialLevel() {
        // 检查是否为内网地址
        const hostname = window.location.hostname;
        const isPrivateNetwork = 
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname);

        // priority: URL ?log= > localStorage.logLevel > 内网检测 > default
        try {
            const params = new URLSearchParams(location.search);
            const fromUrl = parseLevel(params.get("log"));
            if (fromUrl) {
                localStorage.setItem("logLevel", fromUrl);
                return fromUrl;
            }
        } catch (_) {}
        try {
            const fromStorage = parseLevel(localStorage.getItem("logLevel"));
            if (fromStorage) return fromStorage;
        } catch (_) {}
        
        // 内网环境默认显示所有日志
        if (isPrivateNetwork) {
            return "debug";
        }
        
        // 非内网环境默认显示警告及以上级别的日志
        return "warn";
    }

    let currentLevel = getInitialLevel();

    function shouldLog(levelName) {
        return LEVELS[levelName] <= LEVELS[currentLevel];
    }

    function fmtArgs(args) {
        // Avoid dumping huge objects; stringify small plain objects briefly
        return Array.from(args).map((a) => {
            if (a == null) return a;
            // Avoid large DOM nodes / windows / documents
            if (typeof a === "object") {
                const isPlain =
                    Object.prototype.toString.call(a) === "[object Object]";
                if (isPlain) {
                    const keys = Object.keys(a);
                    if (keys.length <= 6) {
                        try {
                            return JSON.stringify(a);
                        } catch (_) {
                            return a;
                        }
                    } else {
                        return `{… ${keys.length} keys}`;
                    }
                }
            }
            return a;
        });
    }

    const api = {
        setLevel(next) {
            const lv = parseLevel(next);
            if (!lv) return;
            currentLevel = lv;
            try {
                localStorage.setItem("logLevel", lv);
            } catch (_) {}
        },
        getLevel() {
            return currentLevel;
        },
        debug: function () {
            if (!shouldLog("debug")) return;
            // eslint-disable-next-line no-console
            console.debug.apply(console, fmtArgs(arguments));
        },
        info: function () {
            if (!shouldLog("info")) return;
            // eslint-disable-next-line no-console
            console.info.apply(console, fmtArgs(arguments));
        },
        warn: function () {
            if (!shouldLog("warn")) return;
            // eslint-disable-next-line no-console
            console.warn.apply(console, fmtArgs(arguments));
        },
        error: function () {
            if (!shouldLog("error")) return;
            // eslint-disable-next-line no-console
            console.error.apply(console, arguments);
        },
    };

    // tag helper: logger.tag('Loader').info('message')
    api.tag = function (name) {
        const prefix = `[${name}]`;
        return {
            debug: function () {
                api.debug.apply(null, [prefix].concat(Array.from(arguments)));
            },
            info: function () {
                api.info.apply(null, [prefix].concat(Array.from(arguments)));
            },
            warn: function () {
                api.warn.apply(null, [prefix].concat(Array.from(arguments)));
            },
            error: function () {
                api.error.apply(null, [prefix].concat(Array.from(arguments)));
            },
        };
    };

    window.logger = api;
})();
