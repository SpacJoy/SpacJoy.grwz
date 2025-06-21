// 导入electron模块中的app和BrowserWindow
const { app, BrowserWindow } = require('electron/main')
// 导入node中的path模块
const path = require('node:path')
// 创建窗口函数
const createWindow = () => {
    // 创建一个新的浏览器窗口
    const win = new BrowserWindow({
        width: 1980,
        height: 1080,
        webPreferences: {
            // 在渲染器进程中预加载指定的脚本
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
        }
    })

    // 加载index.html文件到窗口中
    win.loadFile('index.html')
}

// 当应用准备就绪时执行回调函数
app.whenReady().then(() => {
    // 创建窗口
    createWindow()

    // 当应用被激活时执行回调函数
    app.on('activate', () => {
        // 如果没有窗口，则创建一个新窗口
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// 当所有窗口都被关闭时执行回调函数
app.on('window-all-closed', () => {
    // 如果不是在Darwin系统上，则退出应用
    if (process.platform !== 'darwin') {
        app.quit()
    }
})