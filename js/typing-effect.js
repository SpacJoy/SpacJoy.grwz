// ===== 逐字闪烁效果和系统颜色响应 =====

// 初始化系统颜色主题
function initializeTheme() {
    // 检测系统颜色主题偏好
    const prefersDark = window.matchMedia && 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 设置页面主题属性
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    window.currentTheme = prefersDark ? 'dark' : 'light';
    
    // 监听系统颜色主题变化
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)')
              .addEventListener('change', function(e) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            window.currentTheme = newTheme;
        });
    }
}

// 实现逐字闪烁效果
function startTypingEffect() {
    // 获取标语元素
    const typingText = document.querySelector(".typing-text");
    if (!typingText) return;

    // 清除之前的计时器（防止多语言切换时混乱）
    if (window.typingTimer) {
        clearTimeout(window.typingTimer);
    }

    // 获取当前语言的文本
    const currentLang = window.currentLanguage || "zh";
    let text = typingText.getAttribute(
        currentLang === "zh" ? "data-zh" : "data-en"
    );

    if (!text) return;

    // 英文文本的空格已在lang.js中处理，这里不再重复处理

    // 清空原内容
    typingText.innerHTML = "";

    // 添加光标效果
    let cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    cursor.textContent = "|";
    typingText.appendChild(cursor);

    // 逐字添加并应用闪烁动画
    let index = 0;

    // 打字音效已彻底移除（相关音频函数已删除）

    function addNextChar() {
        if (index < text.length) {
            // 若容器在过程中被替换/清空，安全退出
            const container = document.querySelector(".typing-text");
            if (!container) {
                return; // 容器不存在，停止动画
            }

            // 创建字符span元素
            const charSpan = document.createElement("span");
            charSpan.className = "char-blink";
            charSpan.textContent = text[index];

            // 打字音效已移除：此处保留空白/注释以便仅保留视觉效果

            // 在光标前插入字符
            // 确保光标仍在容器中，若不在则重建或退化为 append
            if (!(cursor && cursor.parentNode === container)) {
                if (cursor) cursor.remove();
                const newCursor = document.createElement("span");
                newCursor.className = "typing-cursor";
                newCursor.textContent = "|";
                container.appendChild(newCursor);
                // 更新闭包中的 cursor 引用
                cursor = newCursor;
            }
            if (cursor && cursor.parentNode === container) {
                container.insertBefore(charSpan, cursor);
            } else {
                container.appendChild(charSpan);
            }

            // 移动到下一个字符
            index++;

            // 设置下一个字符的延迟时间（随机延迟增加自然感）
            const delay = Math.random() * 150 + 80; // 80-230ms随机延迟
            window.typingTimer = setTimeout(addNextChar, delay);
        } else {
            // 打字完成后隐藏光标
            setTimeout(() => {
                cursor.style.opacity = "0";
                cursor.style.transition = "opacity 0.3s ease";
            }, 1000);
        }
    }

    // 开始逐字动画
    addNextChar();
}

// 语言切换时重新启动打字效果
function handleLanguageChange() {
    // 清除之前的计时器
    if (window.typingTimer) {
        clearTimeout(window.typingTimer);
    }

    // 清除现有内容
    const typingText = document.querySelector(".typing-text");
    if (typingText) {
        typingText.innerHTML = "";

        // 重新启动打字效果
        setTimeout(startTypingEffect, 300);
    }
}

// 动态调整字体大小函数
function adjustFontSize() {
    const typingText = document.querySelector(".typing-text");
    if (!typingText) return;

    // 获取窗口宽度
    const windowWidth = window.innerWidth;

    // 根据窗口宽度动态调整字体大小
    // 这里使用更灵活的计算方式，确保文本不会出现标点符号单独成行的情况
    // 基础字体大小计算公式：窗口宽度的6%，但有上下限
    let fontSize = Math.min(Math.max(windowWidth * 0.06, 24), 80); // 24px-80px

    // 对于特别小的屏幕，再额外调整字体大小
    if (windowWidth < 480) {
        fontSize = Math.min(fontSize, windowWidth * 0.08);
    }

    // 应用计算出的字体大小
    typingText.style.fontSize = fontSize + "px";
}

// 初始化函数
function initPageEffects() {
    // 初始化系统颜色主题
    initializeTheme();
    // Typing audio unlock disabled (audio removed). No-op kept intentionally to avoid
    // installing any audio-related event listeners or creating AudioContext.

    // 添加窗口大小变化事件监听器
    window.addEventListener("resize", adjustFontSize);

    // 等待加载图隐藏后才开始打字效果
    const startWaitAt = Date.now();
    function checkLoaderHidden() {
        const loader = document.querySelector(".loader");
        const timeoutReached = Date.now() - startWaitAt > 10000; // 10s 兜底
        if (window.loaderHidden || timeoutReached || !loader) {
            // 加载图已隐藏，启动打字效果
            if (window.typingCheckTimer) {
                clearTimeout(window.typingCheckTimer);
                window.typingCheckTimer = null;
            }
            startTypingEffect();
            // 初始调整一次字体大小
            adjustFontSize();
        } else {
            // 加载图未隐藏，继续检查
            if (window.typingCheckTimer) clearTimeout(window.typingCheckTimer);
            window.typingCheckTimer = setTimeout(checkLoaderHidden, 120);
        }
    }

    // 开始检查加载状态
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", checkLoaderHidden, {
            once: true,
        });
    } else {
        // 页面已加载，直接检查
        checkLoaderHidden();
    }
}

// 导出到全局窗口对象
window.initPageEffects = initPageEffects;
window.handleLanguageChange = handleLanguageChange;

// 背景图加载完成后逐渐清晰效果
function setupBackgroundClarityEffect() {
    const backgroundLayers = document.querySelectorAll('.bg-layer');
    const loader = document.querySelector('.loader');
    
    if (loader && backgroundLayers.length > 0) {
        // 监听加载完成事件
        loader.addEventListener('animationend', function() {
            // 开始背景模糊渐变效果
            backgroundLayers.forEach(layer => {
                layer.style.transition = 'filter 2s ease-in-out';
                layer.style.filter = 'blur(0px)';
            });
        });
        
        // 初始状态：背景模糊
        backgroundLayers.forEach(layer => {
            layer.style.filter = 'blur(20px)';
        });
    }
}

// 将背景清晰效果导出到全局
window.setupBackgroundClarityEffect = setupBackgroundClarityEffect;