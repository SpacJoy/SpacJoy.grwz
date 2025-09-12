// 全局标志和共享状态（使用 window.x 以便跨文件访问）
window.isInitialized = false;
window.isLayoutOptimizing = false;
window.isBackgroundSwitching = false;
window.eventListenersAdded = false;
window.scrollNotificationShown = false;
window.isLoadingReadme = false;
window.isCheckingServers = false;
window.currentLanguage = "zh";
// 主题：light/dark，初始读取 localStorage 或跟随系统
(function initTheme(){
	const saved = localStorage.getItem('site-theme');
	let theme = saved;
	if(!theme){
		theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	document.documentElement.dataset.theme = theme; // data-theme 属性
	window.currentTheme = theme;
})();

// 简易防抖函数（供 ui.js 等调用）
window.debounce = window.debounce || function(fn, wait){
	let timer; return function(...args){ const ctx=this; clearTimeout(timer); timer=setTimeout(()=>fn.apply(ctx,args), wait); };
};
