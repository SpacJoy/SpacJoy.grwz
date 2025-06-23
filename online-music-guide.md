# 网络音乐播放器配置指南

## 功能概述

音乐播放器支持三种音乐来源：

1. **本地音乐文件** - 从 `res/music/` 文件夹自动加载
2. **网络音乐链接** - 直接播放指定的音乐 URL
3. **网络文件夹** - 自动扫描并批量加载网络服务器上的音乐文件

## 如何添加网络音乐链接

编辑 `music-player.js` 文件，在 `getMusicFiles()` 方法中的 `manualPlaylist` 数组里添加网络音乐：

```javascript
const manualPlaylist = [
	// 本地音乐文件
	"Call Me Now-Michael Calfan.mp3",
	"【Hi-Res无损】张妙格《我期待的不是雪》歌词纯享版「我期待的不是雪 而是有你的冬天 我期待的不是月 而是和你的遇见」-一只爱听歌的梨.mp3",

	// 网络音乐链接
	{
		url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
		title: "铃声示例",
		artist: "SoundJay",
	},
	{
		url: "https://example.com/your-music.mp3",
		title: "您的音乐标题",
		artist: "艺术家名称",
	},
];
```

## 如何配置网络文件夹

### 基本配置

在 `getMusicFiles()` 方法中的 `onlineFolders` 数组里添加网络文件夹：

```javascript
const onlineFolders = [
	{
		url: "https://openlist.146019.xyz/%E5%BD%B1%E9%9F%B3%E5%A8%B1%E4%B9%90/%E9%9F%B3%E4%B9%90/%E6%9A%82%E6%97%B6%E5%BE%AA%E7%8E%AF",
		type: "openlist", // 服务器类型
		title: "网络音乐库", // 显示名称
	},
	{
		url: "https://your-server.com/music/",
		type: "apache",
		title: "我的音乐服务器",
	},
];
```

### 支持的服务器类型

1. **openlist** - Openlist 类型的文件服务器
2. **apache** - Apache 服务器的目录索引
3. **nginx** - Nginx 服务器的 autoindex
4. **generic** - 通用目录格式（自动检测）

### 工作原理

播放器会：

1. 访问指定的网络文件夹 URL
2. 解析 HTML 页面，提取文件链接
3. 筛选出音频文件（.mp3, .wav, .ogg, .m4a, .aac, .flac）
4. 自动提取歌曲标题和艺术家信息
5. 将文件添加到播放列表

### 示例配置

```javascript
const onlineFolders = [
	// Openlist 文件服务器
	{
		url: "https://openlist.example.com/music/",
		type: "openlist",
		title: "Openlist 音乐库",
	},

	// Apache 服务器
	{
		url: "https://files.example.com/music/",
		type: "apache",
		title: "Apache 音乐服务器",
	},

	// Nginx 服务器
	{
		url: "https://media.example.com/audio/",
		type: "nginx",
		title: "Nginx 媒体服务器",
	},

	// 自动检测类型
	{
		url: "https://storage.example.com/songs/",
		type: "generic",
		title: "通用文件服务器",
	},
];
```

## 支持的网络音乐源

### 1. 直接 MP3 链接

-   需要是直接指向音频文件的 URL
-   例如：`https://example.com/music.mp3`

### 2. 免费音乐资源

-   Freesound.org (需要 API)
-   Archive.org 的音频集合
-   SoundJay.com 的免费音效

### 3. 自建音乐服务器

-   将音乐文件放在自己的服务器上
-   确保服务器支持 CORS 跨域访问

## CORS（跨域）问题解决

网络音乐可能遇到跨域访问限制，解决方法：

1. **使用支持 CORS 的音乐服务**
2. **自建服务器并配置 CORS 头**
3. **使用代理服务器**

### 服务器端 CORS 配置示例

**Apache (.htaccess):**

```apache
Header add Access-Control-Allow-Origin "*"
Header add Access-Control-Allow-Headers "range"
```

**Nginx:**

```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Headers Range;
```

**Node.js Express:**

```javascript
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Range");
	next();
});
```

## 动态添加网络音乐

在浏览器控制台中使用以下命令动态添加音乐：

```javascript
// 添加单首网络音乐
window.musicPlayer.addToPlaylist({
	url: "https://example.com/music.mp3",
	title: "歌曲名称",
	artist: "艺术家",
});

// 重新加载播放列表
window.musicPlayer.reloadPlaylist();
```

## 调试和故障排除

### 查看加载日志

打开浏览器开发者工具（F12），在控制台中可以看到详细的加载信息：

-   `🎵 手动配置的播放列表:` - 显示手动配置的音乐
-   `🎵 尝试从网络文件夹加载音乐...` - 开始扫描网络文件夹
-   `🎵 正在扫描网络文件夹:` - 显示正在处理的文件夹
-   `🎵 找到 X 个音频文件` - 显示找到的音频文件数量
-   `🎵 从 XXX 找到 X 首歌曲` - 显示每个文件夹的结果

### 测试网络文件夹

您可以通过控制台手动测试文件夹访问：

```javascript
// 测试文件夹是否可访问
fetch("https://your-server.com/music/")
	.then((response) => response.text())
	.then((html) => console.log(html.length + " 字符"))
	.catch((error) => console.error("访问失败:", error));
```

## 常见问题

### Q: 网络音乐无法播放？

A: 检查：

1. 音乐链接是否有效
2. 服务器是否支持 CORS
3. 网络连接是否正常
4. 音频格式是否受支持

### Q: 网络文件夹无法加载？

A: 可能的原因：

1. **CORS 问题** - 服务器不允许跨域访问
2. **URL 格式错误** - 确保 URL 指向目录页面
3. **服务器类型不匹配** - 尝试使用 "generic" 类型
4. **网络连接问题** - 检查网络状态

### Q: 如何找到可用的音乐链接？

A: 可以使用：

1. 自己托管的音乐文件
2. 免费音乐库（如 Archive.org）
3. 支持外链的音乐服务

### Q: 播放器显示"网络音乐加载失败"？

A: 通常是 CORS 问题，需要：

1. 确认音乐服务器支持跨域访问
2. 尝试使用代理服务器
3. 使用浏览器的--disable-web-security 参数（仅限开发测试）

### Q: 网络文件夹扫描到很多文件但没有音乐？

A: 检查：

1. 文件夹中是否包含支持的音频格式
2. 文件扩展名是否正确
3. 服务器是否正确显示文件列表

## 示例音乐链接

以下是一些可以测试的免费音乐链接：

```javascript
{
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    title: "铃声",
    artist: "SoundJay"
},
{
    url: "https://archive.org/download/testmp3testfile/mpthreetest.mp3",
    title: "测试音频",
    artist: "Archive.org"
}
```

注意：这些链接仅用于测试，实际使用时请确保遵守版权法律。
