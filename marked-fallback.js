// 极简的markdown解析器作为marked.js的最后备用方案
// 只在marked.js完全无法加载时使用
window.fallbackMarkdown = {
    parse: function (text) {
        if (!text) return "";

        // 基础的markdown转换
        let html = text
            // 标题
            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
            // 粗体
            .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
            // 斜体
            .replace(/\*(.*)\*/gim, "<em>$1</em>")
            // 链接
            .replace(
                /\[([^\]]+)\]\(([^)]+)\)/gim,
                '<a href="$2" target="_blank">$1</a>'
            )
            // 图片
            .replace(
                /!\[([^\]]*)\]\(([^)]+)\)/gim,
                '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:8px;margin:10px 5px;">'
            )
            // 换行
            .replace(/\n/gim, "<br>");

        return html;
    },

    setOptions: function () {
        // 兼容marked.js API
        return this;
    },
};

// 如果30秒后marked仍未加载，使用备用解析器
setTimeout(function () {
    if (typeof marked === "undefined") {
        console.warn("[Fallback] marked.js未加载，使用备用markdown解析器");
        window.marked = window.fallbackMarkdown;

        // 如果README正在等待加载，现在可以尝试了
        if (window.loadReadmeContent && !window.readmeLoaded) {
            window.loadReadmeContent();
        }
    }
}, 30000);
