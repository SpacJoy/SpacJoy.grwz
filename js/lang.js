// 语言切换
function toggleLanguage() {
	window.currentLanguage = window.currentLanguage === "zh" ? "en" : "zh";
	applyLanguage(window.currentLanguage);
	localStorage.setItem("preferred-language", window.currentLanguage);
	const langText = document.getElementById("lang-text");
	if (langText)
		langText.textContent = window.currentLanguage === "zh" ? "EN" : "中文";
	window.showLanguageChangeNotification &&
		window.showLanguageChangeNotification();
	window.checkAllServerStatus && window.checkAllServerStatus();
	// 语言切换时重新启动打字效果
	window.handleLanguageChange && window.handleLanguageChange();
}

function applyLanguage(lang) {
	// 处理所有多语言元素
	const elements = document.querySelectorAll("[data-zh][data-en]");
	elements.forEach((element) => {
		const zhText = element.getAttribute("data-zh");
		let enText = element.getAttribute("data-en");
		if (zhText && enText) {
			// 确保英文文本中单词间有正确的空格
			if (lang === "en" && enText) {
				enText = enText.replace(/\s+/g, ' ').trim();
			}
			element.textContent = lang === "zh" ? zhText : enText;
		}
	});
	// 按钮 title 多语言
	const bgBtn = document.getElementById("bg-toggle");
	if (bgBtn) {
		const zhT = bgBtn.getAttribute("data-zh-title");
		const enT = bgBtn.getAttribute("data-en-title");
		if (zhT && enT) bgBtn.title = lang === "zh" ? zhT : enT;
	}
	// 页面标题多语言
	const titleTag = document.querySelector("title");
	if (titleTag) {
		const zhTitle = titleTag.getAttribute("data-zh");
		const enTitle = titleTag.getAttribute("data-en");
		if (lang === "zh" && zhTitle) {
			document.title = zhTitle;
		} else if (lang === "en" && enTitle) {
			document.title = enTitle;
		}
	}
	updateStatusLanguage(lang);
	updateNotificationTexts(lang);
}

function updateStatusLanguage(lang) {
	const statusElements = ["openlist-status", "photo-status", "fnos-status"];
	statusElements.forEach((id) => {
		const element = document.getElementById(id);
		if (element) {
			const checkingText = element.querySelector("[data-zh][data-en]");
			if (checkingText) {
				const zhText = checkingText.getAttribute("data-zh");
				const enText = checkingText.getAttribute("data-en");
				if (zhText && enText)
					checkingText.textContent = lang === "zh" ? zhText : enText;
			}
		}
	});
}

function updateNotificationTexts(lang) {
	/* placeholder for localized dynamic text updates */
}

function initializeLanguage() {
	// 如果已经初始化过，不再重复初始化
	if (window.languageInitialized) {
		console.log("语言已经初始化过，跳过重复初始化");
		return;
	}
	
	// 强制默认使用中文，不自动检测语言
	window.currentLanguage = "zh";
	applyLanguage(window.currentLanguage);
	const langText = document.getElementById("lang-text");
	if (langText)
		langText.textContent = "EN";
	console.log("语言初始化完成，默认使用中文");
	// 标记为已初始化
	window.languageInitialized = true;
}

window.toggleLanguage = toggleLanguage;
window.applyLanguage = applyLanguage;
window.initializeLanguage = initializeLanguage;
