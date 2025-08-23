// 全局标志和共享状态（使用 window.x 以便跨文件访问）
window.isInitialized = false;
window.isLayoutOptimizing = false;
window.isBackgroundSwitching = false;
window.eventListenersAdded = false;
window.scrollNotificationShown = false;
window.isLoadingReadme = false;
window.isCheckingServers = false;
window.currentLanguage = "zh";
// 简易防抖函数（供 ui.js 等调用）
window.debounce = window.debounce || function(fn, wait){
	let timer; return function(...args){ const ctx=this; clearTimeout(timer); timer=setTimeout(()=>fn.apply(ctx,args), wait); };
};
