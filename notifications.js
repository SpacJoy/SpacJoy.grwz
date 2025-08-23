// 通知与复制相关
function showCopySuccessNotification() {
	const notification = document.createElement("div");
	notification.className = "copy-notification success";
	notification.innerHTML =
		window.currentLanguage === "zh"
			? "✅ 服务器地址已复制到剪贴板"
			: "✅ Server address copied to clipboard";
	document.body.appendChild(notification);
	setTimeout(() => notification.classList.add("show"), 100);
	setTimeout(() => hideCopyNotification(notification), 3000);
}

function showCopyErrorNotification() {
	const notification = document.createElement("div");
	notification.className = "copy-notification error";
	notification.innerHTML =
		window.currentLanguage === "zh"
			? "❌ 复制失败，请手动复制地址"
			: "❌ Copy failed, please copy manually";
	document.body.appendChild(notification);
	setTimeout(() => notification.classList.add("show"), 100);
	setTimeout(() => hideCopyNotification(notification), 5000);
}

function hideCopyNotification(notification) {
	if (
		!notification ||
		!notification.parentNode ||
		notification.classList.contains("hide")
	)
		return;
	notification.classList.remove("show");
	notification.classList.add("hide");
	setTimeout(() => {
		try {
			if (notification && notification.parentNode)
				notification.parentNode.removeChild(notification);
		} catch (e) {}
	}, 500);
}

function showServerCheckNotification() {
	const notification = document.createElement("div");
	notification.className = "copy-notification success";
	notification.innerHTML =
		window.currentLanguage === "zh"
			? "🔍 正在重新检测服务器状态..."
			: "🔍 Rechecking server status...";
	notification.style.background = "rgba(76, 175, 80, 0.9)";
	document.body.appendChild(notification);
	setTimeout(() => notification.classList.add("show"), 100);
	setTimeout(() => hideCopyNotification(notification), 3000);
}

function showBackgroundChangeNotification() {
	const notification = document.createElement("div");
	notification.className = "copy-notification success";
	notification.innerHTML =
		window.currentLanguage === "zh"
			? "🎨 背景图已更换！"
			: "🎨 Background changed!";
	notification.style.background = "rgba(76, 175, 80, 0.9)";
	document.body.appendChild(notification);
	setTimeout(() => notification.classList.add("show"), 100);
	setTimeout(() => hideCopyNotification(notification), 2000);
}

function showLanguageChangeNotification() {
	const notification = document.createElement("div");
	notification.className = "copy-notification success";
	notification.innerHTML =
		window.currentLanguage === "zh"
			? "🌍 已切换到中文"
			: "🌍 Switched to English";
	notification.style.background = "rgba(33, 150, 243, 0.9)";
	document.body.appendChild(notification);
	setTimeout(() => notification.classList.add("show"), 100);
	setTimeout(() => hideCopyNotification(notification), 2000);
}

window.showCopySuccessNotification = showCopySuccessNotification;
window.showCopyErrorNotification = showCopyErrorNotification;
window.hideCopyNotification = hideCopyNotification;
window.showServerCheckNotification = showServerCheckNotification;
window.showBackgroundChangeNotification = showBackgroundChangeNotification;
window.showLanguageChangeNotification = showLanguageChangeNotification;

// 复制到剪贴板的回退实现（供 HTML onclick 使用）
function fallbackCopyTextToClipboard(text) {
	try {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.left = "0";
		textArea.style.top = "0";
		textArea.style.opacity = "0";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const successful = document.execCommand("copy");
		document.body.removeChild(textArea);
		return successful;
	} catch (e) {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text);
				return true;
			}
		} catch (e2) {}
		return false;
	}
}

function copyServerAddress(address) {
	if (!address) return;
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard
			.writeText(address)
			.then(() => showCopySuccessNotification())
			.catch(() => {
				const ok = fallbackCopyTextToClipboard(address);
				ok
					? showCopySuccessNotification()
					: showCopyErrorNotification();
			});
	} else {
		const ok = fallbackCopyTextToClipboard(address);
		ok ? showCopySuccessNotification() : showCopyErrorNotification();
	}
}

function changeRandomBackground() {
	if (window.checkLayoutAndSwitchBackground)
		window.checkLayoutAndSwitchBackground(true);
	if (window.showBackgroundChangeNotification)
		window.showBackgroundChangeNotification();
}

function showScrollNotification() {
	if (window.scrollNotificationShown) return;
	window.scrollNotificationShown = true;
	const n = document.createElement("div");
	n.className = "copy-notification success";
	n.style.bottom = "20px";
	n.style.left = "50%";
	n.style.transform = "translateX(-50%)";
	n.innerHTML =
		window.currentLanguage === "zh"
			? "⬇️ 向下滚动，查看更多内容"
			: "⬇️ Scroll down to see more";
	document.body.appendChild(n);
	setTimeout(() => n.classList.add("show"), 100);
	setTimeout(() => hideCopyNotification(n), 4000);
}

window.copyServerAddress = copyServerAddress;
window.fallbackCopyTextToClipboard = fallbackCopyTextToClipboard;
window.changeRandomBackground = changeRandomBackground;
window.showScrollNotification = showScrollNotification;
