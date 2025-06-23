// 音乐播放器 - 临时禁用
/*
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

			// 网络音乐链接示例
			{
				url: "https://openlist.146019.xyz/d/%E6%B8%B8%E5%AE%A2%E7%9B%AE%E5%BD%95/%E5%BD%B1%E9%9F%B3%E5%A8%B1%E4%B9%90/%E9%9F%B3%E4%B9%90/%E6%9A%82%E6%97%B6%E5%BE%AA%E7%8E%AF/%E6%97%B6%E9%97%B4%E6%9B%B4%E6%94%B9-%E5%BA%84%E4%B8%9C%E8%8C%B9%EF%BC%88%E8%B1%86%E8%8A%BD%E9%B1%BC%EF%BC%89.mp3",
				title: "时间更改",
				artist: "庄东茹 (豆芽鱼)",
			},
			// 更多网络链接示例：
			// {
			//     url: "https://example.com/your-music.mp3",
			//     title: "您的音乐标题",
			//     artist: "艺术家名称"
			// }
		];
		console.log("🎵 手动配置的播放列表:", manualPlaylist);

		// 方案2: 从网络文件夹加载音乐
		const onlineFolders = [
			// 配置网络文件夹URL（支持不同类型的文件服务器）
			{
				url: "https://openlist.146019.xyz/%E5%BD%B1%E9%9F%B3%E5%A8%B1%E4%B9%90/%E9%9F%B3%E4%B9%90/%E6%9A%82%E6%97%B6%E5%BE%AA%E7%8E%AF",
				type: "openlist", // 支持的类型: openlist, apache, nginx, generic
				title: "网络音乐库",
			},
			// 可以添加更多网络文件夹：
			// {
			//     url: "https://your-server.com/music/",
			//     type: "apache",
			//     title: "我的音乐服务器"
			// }
		];

		// 尝试从网络文件夹获取音乐
		console.log("🎵 尝试从网络文件夹加载音乐...");
		const onlineMusic = await this.loadFromOnlineFolders(onlineFolders);

		// 合并手动配置和网络文件夹的音乐
		const allMusic = [...manualPlaylist, ...onlineMusic];

		if (allMusic.length > 0) {
			console.log(
				"🎵 使用配置的播放列表和网络文件夹，总共",
				allMusic.length,
				"首歌曲"
			);
			return allMusic;
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

	// 从网络文件夹加载音乐列表
	async loadFromOnlineFolders(folders) {
		const allOnlineMusic = [];

		for (const folder of folders) {
			try {
				console.log(
					`🎵 正在扫描网络文件夹: ${folder.title || folder.url}`
				);
				const musicList = await this.scanOnlineFolder(folder);
				allOnlineMusic.push(...musicList);
				console.log(
					`🎵 从 ${folder.title || folder.url} 找到 ${
						musicList.length
					} 首歌曲`
				);
			} catch (error) {
				console.warn(
					`🎵 无法访问网络文件夹 ${folder.url}:`,
					error.message
				);
			}
		}

		return allOnlineMusic;
	}

	// 扫描单个网络文件夹
	async scanOnlineFolder(folder) {
		const musicFiles = [];
		const supportedExtensions = [
			".mp3",
			".wav",
			".ogg",
			".m4a",
			".aac",
			".flac",
		];

		try {
			const response = await fetch(folder.url, {
				method: "GET",
				headers: {
					Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
			});

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`
				);
			}

			const html = await response.text();
			console.log(`🎵 获取到网页内容，长度: ${html.length} 字符`);

			// 根据不同的服务器类型解析文件列表
			let files = [];
			switch (folder.type) {
				case "openlist":
					files = this.parseOpenlistDirectory(html, folder.url);
					break;
				case "apache":
					files = this.parseApacheDirectory(html, folder.url);
					break;
				case "nginx":
					files = this.parseNginxDirectory(html, folder.url);
					break;
				default:
					files = this.parseGenericDirectory(html, folder.url);
					break;
			}

			// 过滤出音频文件
			const audioFiles = files.filter((file) => {
				const ext = file.name
					.toLowerCase()
					.substring(file.name.lastIndexOf("."));
				return supportedExtensions.includes(ext);
			});

			console.log(`🎵 找到 ${audioFiles.length} 个音频文件`);

			// 转换为播放器格式
			for (const file of audioFiles) {
				musicFiles.push({
					url: file.url,
					title: this.extractTitle(file.name),
					artist:
						this.extractArtist(file.name) ||
						`来自 ${folder.title || "网络文件夹"}`,
				});
			}
		} catch (error) {
			console.error(`🎵 扫描文件夹失败 ${folder.url}:`, error);
		}

		return musicFiles;
	}

	// 解析 Openlist 类型的目录页面
	parseOpenlistDirectory(html, baseUrl) {
		const files = [];

		try {
			// Openlist 通常在页面中包含文件链接
			// 查找所有的文件链接
			const linkPattern =
				/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
			let match;

			while ((match = linkPattern.exec(html)) !== null) {
				const href = match[1];
				const name = match[2].trim();

				// 跳过目录和非文件链接
				if (name === ".." || name === "." || href.endsWith("/")) {
					continue;
				}

				// 构建完整URL
				let fullUrl = href;
				if (!href.startsWith("http")) {
					if (href.startsWith("/")) {
						const urlObj = new URL(baseUrl);
						fullUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
					} else {
						fullUrl =
							baseUrl + (baseUrl.endsWith("/") ? "" : "/") + href;
					}
				}

				files.push({
					name: decodeURIComponent(name),
					url: fullUrl,
				});
			}

			console.log(`🎵 Openlist 解析找到 ${files.length} 个文件`);
		} catch (error) {
			console.error("🎵 解析 Openlist 目录失败:", error);
		}

		return files;
	}

	// 解析 Apache 类型的目录页面
	parseApacheDirectory(html, baseUrl) {
		const files = [];

		try {
			// Apache 目录列表的典型格式
			const linkPattern = /<a href="([^"]+)">([^<]+)<\/a>/gi;
			let match;

			while ((match = linkPattern.exec(html)) !== null) {
				const href = match[1];
				const name = match[2].trim();

				// 跳过父目录和目录
				if (name === "Parent Directory" || href.endsWith("/")) {
					continue;
				}

				const fullUrl =
					baseUrl + (baseUrl.endsWith("/") ? "" : "/") + href;
				files.push({
					name: decodeURIComponent(name),
					url: fullUrl,
				});
			}

			console.log(`🎵 Apache 解析找到 ${files.length} 个文件`);
		} catch (error) {
			console.error("🎵 解析 Apache 目录失败:", error);
		}

		return files;
	}

	// 解析 Nginx 类型的目录页面
	parseNginxDirectory(html, baseUrl) {
		const files = [];

		try {
			// Nginx autoindex 的典型格式
			const linkPattern = /<a href="([^"]+)">([^<]+)<\/a>/gi;
			let match;

			while ((match = linkPattern.exec(html)) !== null) {
				const href = match[1];
				const name = match[2].trim();

				// 跳过父目录和目录
				if (href === "../" || href.endsWith("/")) {
					continue;
				}

				const fullUrl =
					baseUrl + (baseUrl.endsWith("/") ? "" : "/") + href;
				files.push({
					name: decodeURIComponent(name),
					url: fullUrl,
				});
			}

			console.log(`🎵 Nginx 解析找到 ${files.length} 个文件`);
		} catch (error) {
			console.error("🎵 解析 Nginx 目录失败:", error);
		}

		return files;
	}

	// 通用目录解析（尝试多种格式）
	parseGenericDirectory(html, baseUrl) {
		const files = [];

		try {
			// 尝试多种常见的链接格式
			const patterns = [
				/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi,
				/<a href="([^"]+)">([^<]+)<\/a>/gi,
				/<a href='([^']+)'>([^<]+)<\/a>/gi,
			];

			for (const pattern of patterns) {
				let match;
				while ((match = pattern.exec(html)) !== null) {
					const href = match[1];
					const name = match[2].trim();

					// 跳过目录和特殊链接
					if (
						href.endsWith("/") ||
						href === "../" ||
						name === "Parent Directory"
					) {
						continue;
					}

					// 检查是否已经添加
					if (files.some((f) => f.name === name)) {
						continue;
					}

					let fullUrl = href;
					if (!href.startsWith("http")) {
						if (href.startsWith("/")) {
							const urlObj = new URL(baseUrl);
							fullUrl = `${urlObj.protocol}//${urlObj.host}${href}`;
						} else {
							fullUrl =
								baseUrl +
								(baseUrl.endsWith("/") ? "" : "/") +
								href;
						}
					}

					files.push({
						name: decodeURIComponent(name),
						url: fullUrl,
					});
				}
			}

			console.log(`🎵 通用解析找到 ${files.length} 个文件`);
		} catch (error) {
			console.error("🎵 通用目录解析失败:", error);
		}

		return files;
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
		);		console.log(
			"5. 使用 window.musicPlayer.addToPlaylist({url:'链接', title:'标题', artist:'艺术家'}) 添加网络音乐"
		);
	}, 1000);
});
*/
