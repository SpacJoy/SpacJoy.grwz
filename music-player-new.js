class MusicPlayer {
	constructor() {
		this.audio = document.getElementById("audioPlayer");
		this.playlist = [];
		this.currentIndex = 0;
		this.isPlaying = false;
		this.isShuffled = false;
		this.isMinimized = false;

		this.initializeElements();
		this.initializeEventListeners();
		this.loadPlaylist();
		this.loadSavedSettings();
	}

	initializeElements() {
		this.playerContainer = document.getElementById("musicPlayer");
		this.toggleBtn = document.getElementById("togglePlayer");
		this.helpBtn = document.getElementById("helpBtn");
		this.playBtn = document.getElementById("playBtn");
		this.prevBtn = document.getElementById("prevBtn");
		this.nextBtn = document.getElementById("nextBtn");
		this.shuffleBtn = document.getElementById("shuffleBtn");
		this.volumeBtn = document.getElementById("volumeBtn");
		this.volumeSlider = document.getElementById("volumeSlider");
		this.progressBar = document.getElementById("progressBar");
		this.progressFill = document.getElementById("progressFill");
		this.songTitle = document.getElementById("songTitle");
		this.songArtist = document.getElementById("songArtist");
		this.currentTime = document.getElementById("currentTime");
		this.totalTime = document.getElementById("totalTime");
		this.currentIndexSpan = document.getElementById("currentIndex");
		this.totalSongsSpan = document.getElementById("totalSongs");
	}

	initializeEventListeners() {
		// 播放器控制
		this.playBtn.addEventListener("click", () => this.togglePlay());
		this.prevBtn.addEventListener("click", () => this.previousSong());
		this.nextBtn.addEventListener("click", () => this.nextSong());
		this.shuffleBtn.addEventListener("click", () => this.toggleShuffle());
		this.toggleBtn.addEventListener("click", () => this.toggleMinimize());
		this.helpBtn.addEventListener("click", () => this.showHelp());

		// 音量控制
		this.volumeBtn.addEventListener("click", () => this.toggleMute());
		this.volumeSlider.addEventListener("input", (e) =>
			this.setVolume(e.target.value)
		);

		// 进度条控制
		this.progressBar.addEventListener("click", (e) => this.seekTo(e));

		// 音频事件
		this.audio.addEventListener("loadedmetadata", () =>
			this.updateDuration()
		);
		this.audio.addEventListener("timeupdate", () => this.updateProgress());
		this.audio.addEventListener("ended", () => this.nextSong());
		this.audio.addEventListener("error", (e) => this.handleAudioError(e));

		// 键盘快捷键支持
		document.addEventListener("keydown", (e) => this.handleKeyboard(e));
	}

	async loadPlaylist() {
		try {
			console.log("🎵 开始加载播放列表...");

			// 支持的音频格式
			const supportedFormats = [
				".mp3",
				".wav",
				".ogg",
				".m4a",
				".aac",
				".flac",
			];

			// 获取音乐文件列表
			const musicFiles = await this.getMusicFiles();
			console.log("🎵 检测到的音乐文件:", musicFiles);

			this.playlist = musicFiles.map((file, index) => {
				// 检查是否是网络链接对象
				if (typeof file === "object" && file.url) {
					return {
						id: index,
						src: file.url,
						title: file.title || this.extractTitle(file.url),
						artist: file.artist || "Unknown Artist",
						isOnline: true,
					};
				} else {
					// 本地文件
					return {
						id: index,
						src: `res/music/${file}`,
						title: this.extractTitle(file),
						artist: this.extractArtist(file),
						isOnline: false,
					};
				}
			});

			console.log("🎵 生成的播放列表:", this.playlist);

			this.updatePlaylistInfo();

			if (this.playlist.length > 0) {
				console.log("🎵 加载第一首歌曲:", this.playlist[0]);
				this.loadSong(0);
			} else {
				console.log("🎵 没有找到音乐文件");
				this.showNoMusicMessage();
			}
		} catch (error) {
			console.error("加载播放列表失败:", error);
			this.showNoMusicMessage();
		}
	}

	// 获取音乐文件列表（支持本地文件和网络链接）
	async getMusicFiles() {
		// 方案1: 手动配置音乐列表（支持本地文件和网络链接）
		const manualPlaylist = [
			// 本地音乐文件
			"Call Me Now-Michael Calfan.mp3",
			"【Hi-Res无损】张妙格《我期待的不是雪》歌词纯享版「我期待的不是雪 而是有你的冬天 我期待的不是月 而是和你的遇见」-一只爱听歌的梨.mp3",

			// 网络音乐链接示例（请替换为实际可用的链接）
			{
				url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
				title: "铃声示例",
				artist: "SoundJay",
			},
			// 更多网络链接示例：
			// {
			//     url: "https://example.com/your-music.mp3",
			//     title: "您的音乐标题",
			//     artist: "艺术家名称"
			// }
		];

		console.log("🎵 手动配置的播放列表:", manualPlaylist);

		if (manualPlaylist.length > 0) {
			console.log("🎵 使用手动配置的播放列表");
			return manualPlaylist;
		}

		// 方案2: 尝试从预定义列表中检查文件是否存在
		const possibleFiles = [
			"background.mp3",
			"background.wav",
			"background.ogg",
			"music.mp3",
			"music.wav",
			"music.ogg",
			"music1.mp3",
			"music2.mp3",
			"music3.mp3",
			"song.mp3",
			"song.wav",
			"song.ogg",
			"audio.mp3",
			"audio.wav",
			"audio.m4a",
			"bgm.mp3",
			"bgm.wav",
			"theme.mp3",
			"theme.wav",
			"ambient.mp3",
			"ambient.wav",
			"relaxing.mp3",
			"relaxing.wav",
			"chill.mp3",
			"chill.wav",
		];

		const existingFiles = [];
		for (const file of possibleFiles) {
			try {
				const response = await fetch(`res/music/${file}`, {
					method: "HEAD",
				});
				if (response.ok) {
					existingFiles.push(file);
				}
			} catch (error) {
				// 文件不存在，继续检查下一个
			}
		}

		return existingFiles;
	}

	extractTitle(filename) {
		// 从文件名或URL提取标题
		let title = filename;

		// 如果是URL，提取文件名部分
		if (filename.includes("/")) {
			title = filename.split("/").pop();
		}

		// 去除扩展名
		title = title.replace(/\.[^/.]+$/, "");

		// 特殊处理：如果包含艺术家信息，尝试提取歌曲名
		if (title.includes("-")) {
			// 对于 "Call Me Now-Michael Calfan" 格式
			const parts = title.split("-");
			if (parts.length >= 2) {
				return parts[0].trim();
			}
		}

		// 特殊处理：如果包含《》，提取歌曲名
		const songMatch = title.match(/《([^》]+)》/);
		if (songMatch) {
			return songMatch[1];
		}

		// 移除一些常见的标记
		title = title
			.replace(/【[^】]*】/g, "") // 移除【】标记
			.replace(/「[^」]*」/g, "") // 移除「」标记
			.replace(/[-_]/g, " ") // 替换连字符和下划线
			.trim();

		// 如果标题太长，截取前30个字符
		if (title.length > 30) {
			title = title.substring(0, 30) + "...";
		}

		return title || filename; // 如果处理后为空，返回原文件名
	}

	extractArtist(filename) {
		let title = filename;

		// 如果是URL，提取文件名部分
		if (filename.includes("/")) {
			title = filename.split("/").pop();
		}

		// 去除扩展名
		title = title.replace(/\.[^/.]+$/, "");

		// 对于 "Call Me Now-Michael Calfan" 格式
		if (title.includes("-")) {
			const parts = title.split("-");
			if (parts.length >= 2) {
				return parts[1].trim();
			}
		}

		// 对于包含艺术家标记的中文歌曲
		const artistMatch = title.match(/-([^-]+)$/);
		if (artistMatch) {
			return artistMatch[1].trim();
		}

		return "Unknown Artist";
	}

	loadSong(index) {
		if (index >= 0 && index < this.playlist.length) {
			this.currentIndex = index;
			const song = this.playlist[index];

			// 设置音频源
			this.audio.src = song.src;

			// 为网络音乐设置跨域属性
			if (song.isOnline) {
				this.audio.crossOrigin = "anonymous";
				console.log("🎵 加载在线音乐:", song.src);
			} else {
				this.audio.removeAttribute("crossOrigin");
				console.log("🎵 加载本地音乐:", song.src);
			}

			this.songTitle.textContent = song.title;
			this.songArtist.textContent = song.artist;
			this.currentIndexSpan.textContent = index + 1;

			this.updatePlaylistInfo();
		}
	}

	togglePlay() {
		if (this.playlist.length === 0) return;

		if (this.isPlaying) {
			this.audio.pause();
			this.playBtn.textContent = "▶";
			this.isPlaying = false;
		} else {
			this.audio
				.play()
				.then(() => {
					this.playBtn.textContent = "⏸";
					this.isPlaying = true;
				})
				.catch((error) => {
					console.error("播放失败:", error);
					this.handleAudioError(error);
				});
		}
	}

	previousSong() {
		if (this.playlist.length === 0) return;

		let newIndex;
		if (this.isShuffled) {
			newIndex = Math.floor(Math.random() * this.playlist.length);
		} else {
			newIndex =
				this.currentIndex > 0
					? this.currentIndex - 1
					: this.playlist.length - 1;
		}

		this.loadSong(newIndex);
		if (this.isPlaying) {
			this.audio.play();
		}
	}

	nextSong() {
		if (this.playlist.length === 0) return;

		let newIndex;
		if (this.isShuffled) {
			newIndex = Math.floor(Math.random() * this.playlist.length);
		} else {
			newIndex =
				this.currentIndex < this.playlist.length - 1
					? this.currentIndex + 1
					: 0;
		}

		this.loadSong(newIndex);
		if (this.isPlaying) {
			this.audio.play();
		}
	}

	toggleShuffle() {
		this.isShuffled = !this.isShuffled;
		this.shuffleBtn.style.opacity = this.isShuffled ? "1" : "0.6";
		this.shuffleBtn.style.background = this.isShuffled
			? "rgba(255, 255, 255, 0.2)"
			: "none";

		// 保存设置
		localStorage.setItem("musicPlayerShuffle", this.isShuffled);
	}

	toggleMute() {
		if (this.audio.muted) {
			this.audio.muted = false;
			this.volumeBtn.textContent = this.audio.volume > 0.5 ? "🔊" : "🔉";
		} else {
			this.audio.muted = true;
			this.volumeBtn.textContent = "🔇";
		}
	}

	setVolume(value) {
		this.audio.volume = value / 100;
		this.audio.muted = false;

		if (value == 0) {
			this.volumeBtn.textContent = "🔇";
		} else if (value < 50) {
			this.volumeBtn.textContent = "🔉";
		} else {
			this.volumeBtn.textContent = "🔊";
		}

		// 保存音量设置
		localStorage.setItem("musicPlayerVolume", value);
	}

	seekTo(event) {
		const rect = this.progressBar.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		this.audio.currentTime = percent * this.audio.duration;
	}

	updateProgress() {
		if (this.audio.duration) {
			const percent =
				(this.audio.currentTime / this.audio.duration) * 100;
			this.progressFill.style.width = percent + "%";

			this.currentTime.textContent = this.formatTime(
				this.audio.currentTime
			);
		}
	}

	updateDuration() {
		this.totalTime.textContent = this.formatTime(this.audio.duration);
	}

	formatTime(seconds) {
		if (isNaN(seconds)) return "0:00";

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	}

	toggleMinimize() {
		this.isMinimized = !this.isMinimized;

		if (this.isMinimized) {
			this.playerContainer.classList.add("minimized");
			this.toggleBtn.textContent = "+";
		} else {
			this.playerContainer.classList.remove("minimized");
			this.toggleBtn.textContent = "−";
		}

		// 保存最小化状态
		localStorage.setItem("musicPlayerMinimized", this.isMinimized);
	}

	updatePlaylistInfo() {
		this.totalSongsSpan.textContent = this.playlist.length;
		this.currentIndexSpan.textContent =
			this.playlist.length > 0 ? this.currentIndex + 1 : 0;
	}

	showNoMusicMessage() {
		this.songTitle.textContent = "暂无音乐";
		this.songArtist.textContent =
			"请添加音乐文件到 res/music 文件夹或配置网络链接";
		this.totalSongsSpan.textContent = "0";
		this.currentIndexSpan.textContent = "0";
	}

	handleAudioError(error) {
		console.error("音频错误:", error);
		const currentSong = this.playlist[this.currentIndex];

		if (currentSong && currentSong.isOnline) {
			this.songTitle.textContent = "网络音乐加载失败";
			this.songArtist.textContent = "请检查网络连接或音乐链接";
		} else {
			this.songTitle.textContent = "播放出错";
			this.songArtist.textContent = "无法加载音频文件";
		}

		this.isPlaying = false;
		this.playBtn.textContent = "▶";
	}

	loadSavedSettings() {
		// 恢复音量设置
		const savedVolume = localStorage.getItem("musicPlayerVolume");
		if (savedVolume !== null) {
			this.volumeSlider.value = savedVolume;
			this.setVolume(savedVolume);
		}

		// 恢复随机播放设置
		const savedShuffle = localStorage.getItem("musicPlayerShuffle");
		if (savedShuffle === "true") {
			this.toggleShuffle();
		}

		// 恢复最小化状态
		const savedMinimized = localStorage.getItem("musicPlayerMinimized");
		if (savedMinimized === "true") {
			this.toggleMinimize();
		}
	}

	// 公共方法：添加音乐到播放列表
	addToPlaylist(musicFile) {
		let newSong;

		if (typeof musicFile === "object" && musicFile.url) {
			// 网络音乐
			newSong = {
				id: this.playlist.length,
				src: musicFile.url,
				title: musicFile.title || this.extractTitle(musicFile.url),
				artist: musicFile.artist || "Unknown Artist",
				isOnline: true,
			};
		} else {
			// 本地文件
			newSong = {
				id: this.playlist.length,
				src: `res/music/${musicFile}`,
				title: this.extractTitle(musicFile),
				artist: this.extractArtist(musicFile),
				isOnline: false,
			};
		}

		this.playlist.push(newSong);
		this.updatePlaylistInfo();

		// 如果这是第一首歌，自动加载
		if (this.playlist.length === 1) {
			this.loadSong(0);
		}

		console.log("🎵 添加音乐到播放列表:", newSong);
	}

	// 公共方法：重新加载播放列表
	reloadPlaylist() {
		console.log("🎵 重新加载播放列表");
		this.loadPlaylist();
	}

	handleKeyboard(event) {
		// 只在没有焦点在输入框时响应快捷键
		if (
			event.target.tagName === "INPUT" ||
			event.target.tagName === "TEXTAREA"
		) {
			return;
		}

		switch (event.code) {
			case "Space":
				event.preventDefault();
				this.togglePlay();
				break;
			case "ArrowLeft":
				if (event.ctrlKey) {
					event.preventDefault();
					this.previousSong();
				}
				break;
			case "ArrowRight":
				if (event.ctrlKey) {
					event.preventDefault();
					this.nextSong();
				}
				break;
			case "ArrowUp":
				if (event.ctrlKey) {
					event.preventDefault();
					const currentVolume = parseInt(this.volumeSlider.value);
					const newVolume = Math.min(100, currentVolume + 10);
					this.volumeSlider.value = newVolume;
					this.setVolume(newVolume);
				}
				break;
			case "ArrowDown":
				if (event.ctrlKey) {
					event.preventDefault();
					const currentVolume = parseInt(this.volumeSlider.value);
					const newVolume = Math.max(0, currentVolume - 10);
					this.volumeSlider.value = newVolume;
					this.setVolume(newVolume);
				}
				break;
			case "KeyM":
				if (event.ctrlKey) {
					event.preventDefault();
					this.toggleMute();
				}
				break;
			case "KeyS":
				if (event.ctrlKey && event.shiftKey) {
					event.preventDefault();
					this.toggleShuffle();
				}
				break;
		}
	}

	showHelp() {
		const helpText = `🎵 音乐播放器快捷键：
        
• 空格键 - 播放/暂停
• Ctrl + ← - 上一首
• Ctrl + → - 下一首  
• Ctrl + ↑ - 音量+10
• Ctrl + ↓ - 音量-10
• Ctrl + M - 静音/取消静音
• Ctrl + Shift + S - 切换随机播放

📁 添加音乐文件：
1. 本地文件：将音乐文件放入 res/music/ 文件夹
2. 网络链接：编辑 music-player.js 中的 manualPlaylist 数组

💡 网络音乐格式示例：
{
    url: "https://example.com/music.mp3",
    title: "歌曲标题",
    artist: "艺术家"
}

⚠️ 注意：网络音乐需要支持跨域访问(CORS)。`;

		alert(helpText);
	}
}

// 页面加载完成后初始化音乐播放器
document.addEventListener("DOMContentLoaded", function () {
	// 等待一段时间确保所有元素都已加载
	setTimeout(() => {
		window.musicPlayer = new MusicPlayer();
		console.log("音乐播放器已初始化");

		// 显示使用提示
		console.log("🎵 音乐播放器使用说明:");
		console.log("1. 本地文件：将音乐文件放入 res/music 文件夹");
		console.log(
			"2. 网络音乐：编辑 music-player.js 中的 manualPlaylist 数组"
		);
		console.log("3. 支持格式: MP3, WAV, OGG, M4A, AAC, FLAC");
		console.log(
			"4. 使用 window.musicPlayer.reloadPlaylist() 重新加载播放列表"
		);
		console.log(
			"5. 使用 window.musicPlayer.addToPlaylist({url:'链接', title:'标题', artist:'艺术家'}) 添加网络音乐"
		);
	}, 1000);
});
