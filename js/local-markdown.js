// 本地 Markdown 解析器（轻量实现）
// 提供 window.LocalMD.parse(text) 与 setOptions(options) 兼容接口
// 支持：标题、段落、换行、粗体/斜体/删除线、行内代码、代码块、链接、图片、引用、列表、水平线
// 注意：为保证安全，会对用户内容进行 HTML 转义，然后再做行内替换
(function () {
    "use strict";

    const PLACE_CODE_BLOCK = "\u00A7\u00A7CODEBLOCK_";
    const PLACE_CODE_SPAN = "\u00A7\u00A7CODESPAN_";

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function sanitizeURL(url) {
        try {
            const trimmed = String(url).trim();
            // 允许 http(s)、mailto、tel、相对链接(#, /, ./, ../)
            if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(trimmed)) {
                return trimmed;
            }
            return "#";
        } catch (_) {
            return "#";
        }
    }

    function inlineFormat(text) {
        if (!text) return "";

        // 1) 先从原始文本中抽取行内代码，避免其内部被进一步格式化
        const codeSpans = [];
        let s = String(text).replace(/`([^`]+)`/g, (m, code) => {
            const idx = codeSpans.length;
            codeSpans.push(code);
            return PLACE_CODE_SPAN + idx + "§§";
        });

        // 1.1) 移除 HTML 注释，避免显示到页面
        s = s.replace(/<!--[\s\S]*?-->/g, "");

        // 2) 抽取允许直通的 HTML 标签（保留原样），防止被转义
        const allowedHtml = [];
        s = s.replace(/<\s*\/?(div|span|br|img|a)\b[^>]*?>/gi, (m) => {
            const idx = allowedHtml.length;
            allowedHtml.push(m);
            return `§§HTML${idx}§§`;
        });

        // 3) 转义剩余文本，避免任意 HTML 注入
        s = escapeHTML(s);

        // 4) Markdown 行内规则处理
        // 图片 ![alt](src "title") 可选 title，允许 URL 内部带括号
        s = s.replace(
            /!\[([^\]]*)\]\(((?:[^()]|\([^)]*\))*)\s*(?:"([^"]*)")?\)/g,
            (m, alt, src, title) => {
                const url = sanitizeURL(src);
                const ttl = title ? ` title="${escapeHTML(title)}"` : "";
                return `<img src="${url}" alt="${escapeHTML(alt)}"${ttl}>`;
            }
        );

        // 链接 [text](url "title") 可选 title，允许 URL 内部带括号
        s = s.replace(
            /\[([^\]]+)\]\(((?:[^()]|\([^)]*\))*)\s*(?:"([^"]*)")?\)/g,
            (m, text, href, title) => {
                const url = sanitizeURL(href);
                const ttl = title ? ` title="${escapeHTML(title)}"` : "";
                return `<a href="${url}" target="_blank" rel="noopener noreferrer"${ttl}>${text}</a>`;
            }
        );

        // 加粗：**text** 或 __text__
        s = s.replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>");

        // 删除线：~~text~~
        s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");

        // 斜体：*text* 或 _text_（避免和粗体冲突，粗体已先处理）
        s = s.replace(/(^|[^*])\*(?!\*)([^*]+)\*(?=[^*]|$)/g, "$1<em>$2</em>");
        // 下划线斜体：仅当左右为边界/空白/标点时才匹配，避免误伤标识符中的下划线
        s = s.replace(
            /(^|[\s([{\-\u3000-\u303F\u2000-\u206F])_(?!_)([^_]+)_(?=$|[\s)\]}.,!?:;\-\u3000-\u303F\u2000-\u206F])/g,
            "$1<em>$2</em>"
        );

        // 自动链接裸 URL（简单实现）
        s = s.replace(/(^|\s)(https?:\/\/[^\s<]+)(?=$|\s)/g, (m, pre, url) => {
            const safe = sanitizeURL(url);
            return `${pre}<a href="${safe}" target="_blank" rel="noopener noreferrer">${escapeHTML(
                url
            )}</a>`;
        });

        // 5) 还原直通 HTML 标签
        s = s.replace(/§§HTML_?(\d+)§§/g, (m, i) => {
            const raw = allowedHtml[Number(i)] || "";
            return raw;
        });

        // 6) 还原行内代码，确保其内容被正确转义一次
        s = s.replace(new RegExp(PLACE_CODE_SPAN + "(\\d+)§§", "g"), (m, i) => {
            const raw = codeSpans[Number(i)] || "";
            return `<code>${escapeHTML(raw)}</code>`;
        });

        return s;
    }

    function parseBlocks(text) {
        const blocks = [];
        const lines = text.split("\n");
        let i = 0;

        // 匹配单行 HTML 包裹：<tag attrs?>inner</tag>
        function matchSingleHtmlWrap(source, tags) {
            const tagGroup = tags.join("|");
            const re = new RegExp(
                "^\\s*<(" + tagGroup + ")(\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>\\s*$",
                "i"
            );
            const m = source.match(re);
            if (!m) return null;
            return {
                tag: m[1].toLowerCase(),
                attrs: m[2] || "",
                inner: m[3] || "",
            };
        }

        function isUl(line) {
            return /^\s*([*+-])\s+/.test(line);
        }
        function isOl(line) {
            return /^\s*\d+\.\s+/.test(line);
        }
        function isHr(line) {
            return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
        }
        function isHeading(line) {
            return /^\s*#{1,6}\s+/.test(line);
        }
        function codePlaceholderIndex(line) {
            const m = line
                .trim()
                .match(
                    new RegExp(
                        "^" +
                            PLACE_CODE_BLOCK.replace(/\u00A7/g, "\\u00A7") +
                            "(\\d+)§§$"
                    )
                );
            return m ? Number(m[1]) : -1;
        }
        function isQuote(line) {
            return /^\s*>\s?/.test(line);
        }

        while (i < lines.length) {
            let line = lines[i];

            // 跳过空行
            if (!line || /^\s*$/.test(line)) {
                i++;
                continue;
            }

            // 代码块占位
            const cidx = codePlaceholderIndex(line);
            if (cidx >= 0) {
                blocks.push({ type: "codeblock", idx: cidx });
                i++;
                continue;
            }

            // 水平线
            if (isHr(line)) {
                blocks.push({ type: "hr" });
                i++;
                continue;
            }

            // 标题
            if (isHeading(line)) {
                const m = line.match(/^(\s*)(#{1,6})\s+(.*)$/);
                const level = m[2].length;
                const content = m[3].trim();
                const wrap = matchSingleHtmlWrap(content, ["div", "span"]);
                if (wrap) {
                    blocks.push({
                        type: "headingWrapped",
                        level,
                        tag: wrap.tag,
                        attrs: wrap.attrs,
                        inner: wrap.inner,
                    });
                } else {
                    blocks.push({ type: "heading", level, content });
                }
                i++;
                continue;
            }

            // 引用块
            if (isQuote(line)) {
                const quoteLines = [];
                while (i < lines.length && isQuote(lines[i])) {
                    quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
                    i++;
                }
                blocks.push({
                    type: "blockquote",
                    content: quoteLines.join("\n"),
                });
                continue;
            }

            // 列表
            if (isUl(line) || isOl(line)) {
                const ordered = isOl(line);
                const items = [];
                while (i < lines.length && (isUl(lines[i]) || isOl(lines[i]))) {
                    const li = lines[i]
                        .replace(/^\s*([*+-])\s+/, "")
                        .replace(/^\s*\d+\.\s+/, "")
                        .trim();
                    items.push(li);
                    i++;
                }
                blocks.push({ type: ordered ? "ol" : "ul", items });
                continue;
            }

            // 段落或单行 HTML 包裹
            let emittedStandalone = false;
            const para = [];
            while (i < lines.length) {
                const l = lines[i];
                if (!l || /^\s*$/.test(l)) break;
                if (
                    isHeading(l) ||
                    isHr(l) ||
                    isUl(l) ||
                    isOl(l) ||
                    isQuote(l) ||
                    codePlaceholderIndex(l) >= 0
                )
                    break;
                const w = matchSingleHtmlWrap(l.trim(), [
                    "div",
                    "span",
                    "p",
                    "center",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                ]);
                if (w && para.length === 0) {
                    blocks.push({
                        type: "htmlwrap",
                        tag: w.tag,
                        attrs: w.attrs,
                        inner: w.inner,
                    });
                    i++;
                    emittedStandalone = true;
                    break;
                } else {
                    para.push(l);
                    i++;
                }
            }
            if (!emittedStandalone) {
                if (para.length) {
                    blocks.push({
                        type: "paragraph",
                        content: para.join("<br>"),
                    });
                } else {
                    // 兜底，防死循环
                    i++;
                }
            }
        }

        return blocks;
    }

    function parse(text) {
        if (!text) return "";
        let input = String(text).replace(/\r\n?/g, "\n");

        // 提取围栏代码块 ```lang\n...```
        const codeBlocks = [];
        input = input.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
            const idx = codeBlocks.length;
            codeBlocks.push({
                lang: (lang || "").trim(),
                code: code.replace(/\n$/, ""),
            });
            return PLACE_CODE_BLOCK + idx + "§§";
        });

        // 生成块结构
        const blocks = parseBlocks(input);

        // 渲染 HTML
        const out = [];
        for (const b of blocks) {
            switch (b.type) {
                case "heading": {
                    out.push(
                        `<h${b.level}>${inlineFormat(b.content)}</h${b.level}>`
                    );
                    break;
                }
                case "headingWrapped": {
                    const attrs = b.attrs || "";
                    out.push(
                        `<${b.tag}${attrs}><h${b.level}>${inlineFormat(
                            b.inner
                        )}</h${b.level}></${b.tag}>`
                    );
                    break;
                }
                case "hr":
                    out.push("<hr>");
                    break;
                case "blockquote":
                    out.push(
                        `<blockquote><p>${inlineFormat(
                            b.content
                        )}</p></blockquote>`
                    );
                    break;
                case "htmlwrap": {
                    const attrs = b.attrs || "";
                    out.push(
                        `<${b.tag}${attrs}>${inlineFormat(b.inner)}</${b.tag}>`
                    );
                    break;
                }
                case "ul": {
                    const items = b.items
                        .map((it) => `<li>${inlineFormat(it)}</li>`)
                        .join("");
                    out.push(`<ul>${items}</ul>`);
                    break;
                }
                case "ol": {
                    const items = b.items
                        .map((it) => `<li>${inlineFormat(it)}</li>`)
                        .join("");
                    out.push(`<ol>${items}</ol>`);
                    break;
                }
                case "paragraph":
                    out.push(`<p>${inlineFormat(b.content)}</p>`);
                    break;
                case "codeblock": {
                    const cb = codeBlocks[b.idx] || { lang: "", code: "" };
                    const langCls = cb.lang
                        ? ` class="language-${escapeHTML(cb.lang)}"`
                        : "";
                    out.push(
                        `<pre><code${langCls}>${escapeHTML(
                            cb.code
                        )}</code></pre>`
                    );
                    break;
                }
                default:
                    break;
            }
        }

        return out.join("\n");
    }

    const LocalMD = {
        parse,
        setOptions: function () {
            return this;
        },
    };

    window.LocalMD = LocalMD;
})();
