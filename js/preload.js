console.log('开始加载');

const { ipcRenderer } = require('electron');
const axios = require('axios');

window.electron = {
	login: function(account, password) {
		ipcRenderer.send('login', { account, password });
	},
	on: function(channel, func) {
		ipcRenderer.on(channel, (event, ...args) => func(...args));
	},
	send: function (channel, data) {
		ipcRenderer.send(channel, data);
	},
	axios: axios,
};

console.log('加载完成');