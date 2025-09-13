// Minimal app.js bootstrap to avoid breaking legacy inline handlers.
"use strict";
console.log("app.js bootstrap loaded (legacy)");

// Provide safe no-op fallbacks so existing HTML onclick handlers don't throw
window.recheckServerStatus = window.recheckServerStatus || function () {};
window.resetScrollNotification =
	window.resetScrollNotification || function () {};
window.toggleLanguage =
	window.toggleLanguage ||
	function () {
		if (window.lang && typeof window.lang.toggleLanguage === "function") {
			window.lang.toggleLanguage();
		}
	};
window.initializePageComplete = window.initializePageComplete || function () {};
