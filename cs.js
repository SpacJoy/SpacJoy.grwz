// cs.js
console.log('开始加载cs.js');

window.electron.on('login', (event, { account, password }) => {
	var mac = '000000000000';
	var timestamp = Date.now();
	var url = "http://172.17.100.200:801/eportal/?c=GetMsg&a=loadToken&callback=jQuery_" + timestamp + "&account=" + account + "&password=" + password + "&mac=" + mac + "&_=" + (timestamp + 1);
	console.log('访问url:' + url);

// 使用axios的get方法向指定的url发起GET请求
axios.get(url)
	.then(function (response) { // 请求成功时的回调函数
		// 向electron发送名为'请求成功'的消息，并携带请求返回的数据
		window.electron.send('请求成功', response.data);
		console.log('请求成功'); // 输出日志到控制台
	})
	.catch(function (error) { // 请求失败时的回调函数
		console.error('Error:', error); // 输出错误信息到控制台
		window.electron.send('请求失败', error); // 向electron发送名为'请求失败'的消息，并携带错误信息
	});
});

// 定义一个名为 success 的方法，接收一个名为 response 的参数
success: (response) => { 
	// 通过 electron 发送请求成功的消息和响应数据
	// window.electron.send('请求成功', response);
	// 在控制台打印请求成功的消息
	// console.log('请求成功'); 

	// 如果响应的状态为 'ok'
	if (response.status === 'ok') {
		// 在控制台打印登录成功的消息
		console.log('登录成功，正在更新 UI...');
		// 向id为display的元素发送登录成功的消息
		$('#display').text('登录成功');
	} 
	// 如果响应的状态为 'error'
	else if (response.status === 'error') {
		// 在控制台打印登录失败的消息
		console.log('登录失败，正在更新 UI...');
		// 向id为display的元素发送登录失败的消息
		$('#display').text('登录失败');
	} 
	// 如果响应的状态值未知
	else {
		// 在控制台打印未知状态值的错误信息
		console.log('未知的状态值，正在记录错误信息...');
		// 向id为display的元素发送未知状态值的错误信息
		$('#display').text('未知的状态值');
	}
};

console.log('cs.js加载完成');