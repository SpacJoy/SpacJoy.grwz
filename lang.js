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
}

function applyLanguage(lang) {
	const elements = document.querySelectorAll("[data-zh][data-en]");
	elements.forEach((element) => {
		const zhText = element.getAttribute("data-zh");
		const enText = element.getAttribute("data-en");
		if (zhText && enText)
			element.textContent = lang === "zh" ? zhText : enText;
	});
	// 按钮 title 多语言
	const bgBtn = document.getElementById("bg-toggle");
	if (bgBtn) {
		const zhT = bgBtn.getAttribute("data-zh-title");
		const enT = bgBtn.getAttribute("data-en-title");
		if (zhT && enT) bgBtn.title = lang === "zh" ? zhT : enT;
	}
	const titleTag = document.querySelector("title");
	if (titleTag) {
		const zhTitle = titleTag.getAttribute("data-zh");
		const enTitle = titleTag.getAttribute("data-en");
		if (lang === "zh" && zhTitle) document.title = zhTitle;
		else if (lang === "en" && enTitle) document.title = enTitle;
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
	const savedLanguage = localStorage.getItem("preferred-language");
	if (savedLanguage && (savedLanguage === "zh" || savedLanguage === "en"))
		window.currentLanguage = savedLanguage;
	else {
		const browserLang =
			navigator.language ||
			(navigator.languages && navigator.languages[0]) ||
			"en";
		window.currentLanguage = browserLang.startsWith("zh") ? "zh" : "en";
	}
	applyLanguage(window.currentLanguage);
	const langText = document.getElementById("lang-text");
	if (langText)
		langText.textContent = window.currentLanguage === "zh" ? "EN" : "中文";
	console.log("语言初始化完成", window.currentLanguage);
}

window.toggleLanguage = toggleLanguage;
window.applyLanguage = applyLanguage;
window.initializeLanguage = initializeLanguage;
