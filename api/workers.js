// ===========================================================
//  Cloudflare Worker: Random image gateway with chunked KV index
//  Updates:
//    1) 构建全路径索引，支持所有层级目录随机取图
//    2) KV 保存分片索引，避免超过 1 MB 限制
//    3) 手动刷新触发整库重建
//    4) 内存级缓存索引与分片，加速随机取图
//    5) 禁用浏览器缓存，保持随机器一致性
// ===========================================================

const IMAGE_KEY_PATTERN = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;
const CHUNK_SIZE = 400;
const COOLDOWN_SECONDS = 60;
const REFRESH_KEY_SUFFIX = "__last_refresh";
const MAX_RANDOM_ATTEMPTS = 5;
const META_CACHE_TTL = 30_000;
const CHUNK_CACHE_TTL = 60_000;

const metaCache = new Map();
const chunkCache = new Map();

const DOMAIN_RULES = [
    {
        hosts: [
            "rad.ysy.146019.xyz",
            "rad.ysy.spacjoy.top",
            "rad.ysy.spacejoy.top",
        ],
        bucketName: "YSY_BUCKET",
        kvPrefix: "idx:ysy:",
        allowPathAccess: true,
        allowManualRefresh: true,
    },
];

const MULTI_BUCKET_CHOICES = [
    { bucketName: "YSY_BUCKET", kvPrefix: "idx:ysy:" },
];

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const host = url.hostname.toLowerCase();
            const config = resolveDomain(host);

            if (!config) {
                return new Response("Invalid domain", { status: 403 });
            }

            const { bucketName, kvPrefix, allowPathAccess, allowManualRefresh } = config;
            const bucket = env[bucketName];

            if (!bucket) {
                console.error(`Bucket ${bucketName} is not bound`);
                return new Response("Bucket not configured", { status: 500 });
            }

            if (url.searchParams.has("sx")) {
                if (!allowManualRefresh) {
                    return new Response("Manual refresh disabled for this domain", { status: 403 });
                }

                const cooldownKey = `${kvPrefix}${REFRESH_KEY_SUFFIX}`;
                const now = Date.now();
                const lastStr = await env.IMG_INDEX.get(cooldownKey);

                if (lastStr) {
                    const last = Number.parseInt(lastStr, 10);
                    const diff = now - (Number.isNaN(last) ? 0 : last);
                    if (diff < COOLDOWN_SECONDS * 1000) {
                        const waitSeconds = Math.ceil((COOLDOWN_SECONDS * 1000 - diff) / 1000);
                        return new Response(`Cooldown: retry in ${waitSeconds}s`, { status: 429 });
                    }
                }

                ctx.waitUntil(buildIndex(env, bucketName, kvPrefix));

                await env.IMG_INDEX.put(cooldownKey, String(now));
                return new Response(`Index rebuild started for ${bucketName}`);
            }

            const prefix = normalizePath(url.pathname);

            if (!allowPathAccess && prefix) {
                return new Response("Path lookup disabled on this domain", { status: 403 });
            }

            const cacheKey = `${kvPrefix}${prefix}`;
            const selection = await pickRandomKeyFromIndex(env, cacheKey);

            if (!selection.key) {
                const status = selection.reason === "missing" ? 404 : 503;
                const message = selection.reason === "missing"
                    ? "Index missing, append ?sx to rebuild"
                    : "Index inconsistent, rebuild required";
                return new Response(message, { status });
            }

            const object = await bucket.get(selection.key);

            if (!object) {
                console.warn(`Key ${selection.key} not found in ${bucketName}`);
                return new Response("Image not found, rebuild index", { status: 404 });
            }

            const headers = new Headers({
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
                ETag: buildRandomEtag(),
            });

            object.writeHttpMetadata(headers);
            if (!headers.has("Content-Type")) {
                headers.set("Content-Type", inferContentType(selection.key));
            }

            return new Response(object.body, { headers });
        } catch (error) {
            console.error("Worker error", error);
            return new Response("Internal server error", { status: 500 });
        }
    },
};

async function buildIndex(env, bucketName, kvPrefix) {
    try {
        invalidateCacheForPrefix(kvPrefix);
        const bucket = env[bucketName];
        if (!bucket) {
            console.error(`Bucket ${bucketName} not found during rebuild`);
            return;
        }

        const directoryMap = new Map();
        directoryMap.set("", []);

        let cursor;
        let objectCounter = 0;

        do {
            const { objects, truncated, cursor: nextCursor } = await bucket.list({ cursor, limit: 1000 });
            for (const entry of objects) {
                const key = entry.key;
                if (!key || entry.size === 0 || key.endsWith("/")) {
                    continue;
                }
                if (!IMAGE_KEY_PATTERN.test(key)) {
                    continue;
                }
                objectCounter += 1;
                addKeyToDirectoryMap(directoryMap, key);
            }
            cursor = truncated ? nextCursor : undefined;
        } while (cursor);

        const expectedKeys = new Set([`${kvPrefix}${REFRESH_KEY_SUFFIX}`]);
        let directoriesWritten = 0;
        const writeTasks = [];

        for (const [dir, keys] of directoryMap.entries()) {
            if (keys.length === 0) {
                continue;
            }
            directoriesWritten += 1;
            const dirKey = `${kvPrefix}${dir}`;
            writeTasks.push(
                writeDirectoryIndex(env.IMG_INDEX, dirKey, keys).then((written) => {
                    for (const name of written) {
                        expectedKeys.add(name);
                    }
                })
            );
        }

        await Promise.all(writeTasks);
        await cleanupIndexKeys(env.IMG_INDEX, kvPrefix, expectedKeys);

        console.log(
            `Index rebuilt → bucket=${bucketName} files=${objectCounter} directories=${directoriesWritten}`
        );
    } catch (error) {
        console.error(`Failed to rebuild index for ${bucketName}`, error);
    }
}

function resolveDomain(host) {
    for (const rule of DOMAIN_RULES) {
        if (!rule.hosts.includes(host)) {
            continue;
        }
        if (rule.multiBucket) {
            const choice = MULTI_BUCKET_CHOICES[secureRandomInt(MULTI_BUCKET_CHOICES.length)];
            return {
                bucketName: choice.bucketName,
                kvPrefix: choice.kvPrefix,
                allowPathAccess: rule.allowPathAccess,
                allowManualRefresh: false,
            };
        }
        return {
            bucketName: rule.bucketName,
            kvPrefix: rule.kvPrefix,
            allowPathAccess: rule.allowPathAccess,
            allowManualRefresh: rule.allowManualRefresh !== false,
        };
    }
    return null;
}

async function pickRandomKeyFromIndex(env, cacheKey) {
    const meta = await getMeta(env, cacheKey);

    if (!meta) {
        return { key: null, reason: "missing" };
    }

    if (Array.isArray(meta)) {
        return meta.length ? { key: meta[secureRandomInt(meta.length)] } : { key: null, reason: "missing" };
    }

    const total = Number(meta.total) || 0;
    const chunkCount = Number(meta.chunkCount) || 0;
    const chunkSize = Number(meta.chunkSize) || CHUNK_SIZE;

    if (total <= 0 || chunkCount <= 0) {
        return { key: null, reason: "missing" };
    }

    const attempts = Math.min(chunkCount, MAX_RANDOM_ATTEMPTS);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const randomIndex = secureRandomInt(total);
        const chunkIndex = Math.floor(randomIndex / chunkSize);
        const offset = randomIndex % chunkSize;
        const chunkKey = `${cacheKey}__chunk__${chunkIndex}`;
        const chunk = await getChunk(env, chunkKey);

        if (!Array.isArray(chunk) || chunk.length === 0) {
            continue;
        }

        const key = chunk[offset] || chunk[secureRandomInt(chunk.length)];
        if (key) {
            return { key };
        }
    }

    console.warn(`Unable to locate valid chunk for ${cacheKey}`);
    return { key: null, reason: "stale" };
}

async function getMeta(env, cacheKey) {
    const cached = readCache(metaCache, cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    try {
        const value = await env.IMG_INDEX.get(cacheKey, { type: "json" });
        writeCache(metaCache, cacheKey, value, META_CACHE_TTL);
        return value;
    } catch (error) {
        console.error(`Failed to read index meta ${cacheKey}`, error);
        writeCache(metaCache, cacheKey, null, META_CACHE_TTL);
        return null;
    }
}

async function getChunk(env, chunkKey) {
    const cached = readCache(chunkCache, chunkKey);
    if (cached !== undefined) {
        return cached;
    }
    try {
        const chunk = await env.IMG_INDEX.get(chunkKey, { type: "json" });
        writeCache(chunkCache, chunkKey, chunk, CHUNK_CACHE_TTL);
        return chunk;
    } catch (error) {
        console.error(`Failed to read chunk ${chunkKey}`, error);
        writeCache(chunkCache, chunkKey, null, CHUNK_CACHE_TTL);
        return null;
    }
}

function readCache(store, key) {
    const entry = store.get(key);
    if (!entry) {
        return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
    }
    return entry.value;
}

function writeCache(store, key, value, ttl) {
    store.set(key, {
        value,
        expiresAt: Date.now() + ttl,
    });
}

function invalidateCacheForPrefix(prefix) {
    for (const key of metaCache.keys()) {
        if (key.startsWith(prefix)) {
            metaCache.delete(key);
        }
    }
    for (const key of chunkCache.keys()) {
        if (key.startsWith(prefix)) {
            chunkCache.delete(key);
        }
    }
}

async function writeDirectoryIndex(kv, dirKey, keys) {
    const chunked = chunkArray(keys, CHUNK_SIZE);
    const tasks = [];
    const expected = [dirKey];

    const meta = {
        version: 1,
        total: keys.length,
        chunkSize: CHUNK_SIZE,
        chunkCount: chunked.length,
        updatedAt: new Date().toISOString(),
    };

    tasks.push(kv.put(dirKey, JSON.stringify(meta)));

    chunked.forEach((chunk, index) => {
        const chunkKey = `${dirKey}__chunk__${index}`;
        expected.push(chunkKey);
        tasks.push(kv.put(chunkKey, JSON.stringify(chunk)));
    });

    await Promise.all(tasks);
    return expected;
}

async function cleanupIndexKeys(kv, kvPrefix, expectedKeys) {
    const toDelete = [];
    let cursor;

    do {
        const { keys, list_complete: complete, cursor: nextCursor } = await kv.list({ prefix: kvPrefix, cursor, limit: 1000 });

        for (const entry of keys) {
            const name = entry.name;
            if (name === `${kvPrefix}${REFRESH_KEY_SUFFIX}`) {
                continue;
            }
            if (!expectedKeys.has(name)) {
                toDelete.push(name);
                if (toDelete.length >= 50) {
                    await deleteKeys(kv, toDelete.splice(0));
                }
            }
        }

        cursor = complete ? undefined : nextCursor;
    } while (cursor);

    if (toDelete.length) {
        await deleteKeys(kv, toDelete);
    }
}

async function deleteKeys(kv, keys) {
    await Promise.all(keys.map((name) => kv.delete(name)));
}

function addKeyToDirectoryMap(map, key) {
    map.get("").push(key);

    const segments = key.split("/");
    if (segments.length <= 1) {
        return;
    }

    let current = "";
    for (let i = 0; i < segments.length - 1; i += 1) {
        current += segments[i] + "/";
        if (!map.has(current)) {
            map.set(current, []);
        }
        map.get(current).push(key);
    }
}

function chunkArray(items, size) {
    const result = [];
    for (let i = 0; i < items.length; i += size) {
        result.push(items.slice(i, i + size));
    }
    return result;
}

function normalizePath(pathname) {
    const segments = pathname
        .split("/")
        .filter((segment) => segment && segment !== "." && segment !== "..");
    if (segments.length === 0) {
        return "";
    }
    const decoded = segments.map((segment) => {
        try {
            return decodeURIComponent(segment);
        } catch (error) {
            return segment;
        }
    });
    return `${decoded.join("/")}/`;
}

function secureRandomInt(max) {
    if (max <= 0) {
        return 0;
    }
    const array = new Uint32Array(1);
    const upperLimit = Math.floor(0x100000000 / max) * max;
    do {
        crypto.getRandomValues(array);
    } while (array[0] >= upperLimit);
    return array[0] % max;
}

function buildRandomEtag() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes)
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
    return `"${Date.now().toString(16)}-${randomPart}"`;
}

function inferContentType(key) {
    const lower = key.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".bmp")) return "image/bmp";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    return "application/octet-stream";
}
