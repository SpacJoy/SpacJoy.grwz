# 音乐播放器使用说明

## 如何添加音乐文件

1. 将您的音乐文件复制到 `res/music/` 文件夹中
2. 支持的音频格式：MP3, WAV, OGG, M4A, AAC, FLAC

## 自动加载音乐文件

音乐播放器会尝试自动检测 `res/music/` 文件夹中的音乐文件。如果自动检测不工作，您可以：

### 方法 1：手动配置播放列表

编辑 `music-player.js` 文件，找到 `manualPlaylist` 数组，添加您的音乐文件名：

```javascript
const manualPlaylist = [
	"your-song-1.mp3",
	"your-song-2.wav",
	"background-music.ogg",
];
```

### 方法 2：常见音乐文件名

播放器会自动检测以下常见文件名的音乐：

-   background.mp3
-   music1.mp3
-   music2.wav
-   song.ogg
-   audio.m4a

## 播放器功能

-   ▶ / ⏸ : 播放/暂停
-   ⏮ / ⏭ : 上一首/下一首
-   🔀 : 随机播放
-   🔊 : 音量控制
-   进度条：点击跳转到指定位置
-   − / + : 最小化/展开播放器

## 设置保存

播放器会自动保存以下设置：

-   音量大小
-   随机播放状态
-   最小化状态

## 使用 JavaScript 控制

在浏览器控制台中，您可以使用以下命令：

```javascript
// 重新加载播放列表
window.musicPlayer.reloadPlaylist();

// 添加单个音乐文件
window.musicPlayer.addToPlaylist("new-song.mp3");
```

## 故障排除

如果音乐无法播放：

1. 检查文件格式是否受支持
2. 检查文件路径是否正确
3. 检查浏览器控制台是否有错误信息
4. 确保音乐文件没有损坏
