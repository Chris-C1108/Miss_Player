/**
 * 循环管理器类 - 负责循环播放功能
 */
import { I18n } from '../../constants/i18n.js';

export class LoopManager {
	constructor(playerCore, uiElements) {
		// 核心引用
		this.playerCore = playerCore;
		this.targetVideo = playerCore.targetVideo;

		// UI元素引用
		this.uiElements = uiElements;

		// 循环控制相关
		this.loopStartTime = null;
		this.loopEndTime = null;
		this.loopActive = false;
		this.loopStartMarker = null;
		this.loopEndMarker = null;
		this.loopRangeElement = null;
		this.currentPositionDisplay = null;
		this.durationDisplay = null;
		this.loopToggleButton = null;

		// 时间更新处理器
		this._handleLoopTimeUpdate = this._handleLoopTimeUpdate.bind(this);

		// 循环保护（防止短间隔连续触发多次）
		this.enableLoopProtection = true;
		this.lastLoopCheckTime = 0;
		this.loopProtectionGapTime = 300; // 毫秒

		// 错误处理状态
		this.errorOccurred = false;
		this.retryAttempts = 0;
		this.maxRetryAttempts = 3;
	}

	/**
	 * 初始化循环管理器
	 */
	init(loopElements) {
		this.loopStartMarker = loopElements.loopStartMarker;
		this.loopEndMarker = loopElements.loopEndMarker;
		this.loopRangeElement = loopElements.loopRangeElement;
		this.currentPositionDisplay = loopElements.currentPositionDisplay;
		this.durationDisplay = loopElements.durationDisplay;
		this.loopToggleButton = loopElements.loopToggleButton;

		// 解析URL参数设置循环点
		this._parseUrlHashParams();

		return this;
	}

	/**
	 * 状态管理方法 - 统一更新状态并触发UI更新
	 * @param {Object} newState - 要更新的状态对象
	 */
	setState(newState) {
		// 记录状态变化的日志（便于调试）
		console.log('[LoopManager] 状态更新:', 
			Object.keys(newState).map(key => `${key}: ${newState[key]}`).join(', '));
		
		// 更新状态
		Object.assign(this, newState);
		
		// 触发UI更新
		this._updateUI();
		
		// 返回this以支持链式调用
		return this;
	}

	/**
	 * 解析URL hash参数并设置循环点
	 */
	_parseUrlHashParams() {
		if (!window.location.hash) return;

		const hash = window.location.hash.substring(1); // 去掉#

		// 检查是否有时间区间 (格式: 00:00:09-00:00:13)
		if (hash.includes('-')) {
			const [startTime, endTime] = hash.split('-');
			const startSeconds = this._parseTimeString(startTime);
			const endSeconds = this._parseTimeString(endTime);

			if (startSeconds !== null && endSeconds !== null) {
				console.log(`[LoopManager] 从URL解析循环区间: ${startTime}-${endTime}`);

				// 设置循环点（不使用setState避免提前更新UI）
				const newState = {
					loopStartTime: startSeconds,
					loopEndTime: endSeconds
				};

				// 等视频元数据加载完成后再跳转和启用循环
				const handleMetadata = () => {
					// 直接更新时间显示，避免时序问题
					if (this.currentPositionDisplay) {
						this.currentPositionDisplay.textContent = this.formatTimeWithHours(startSeconds);
						this.currentPositionDisplay.classList.add('active');
						const startContainer = document.querySelector('.tm-start-time-container');
						if (startContainer) startContainer.classList.add('active');
					}
					
					if (this.durationDisplay) {
						this.durationDisplay.textContent = this.formatTimeWithHours(endSeconds);
						this.durationDisplay.classList.add('active');
						const endContainer = document.querySelector('.tm-end-time-container');
						if (endContainer) endContainer.classList.add('active');
					}
					
					// 跳转到开始点
					this.targetVideo.currentTime = startSeconds;

					// 保留对missav网站的特殊检查
					if (window.location.hostname.includes('missav')) {
						// 在missav网站上，循环播放是默认启用的
						newState.loopActive = true;
						console.log('[LoopManager] 在missav网站上设置循环状态');
					} else {
						// 在其他网站上，也需要启用循环
						newState.loopActive = true;
						console.log('[LoopManager] 在其他网站上设置循环状态');
					}
					
					// 统一更新状态和UI（将触发_updateUI，更新所有按钮状态）
					this.setState(newState);
					
					// 强制更新标记点和进度条
					this.updateLoopMarkers();
					
					// 添加事件监听器
					this.targetVideo.removeEventListener('timeupdate', this._handleLoopTimeUpdate);
					this.targetVideo.addEventListener('timeupdate', this._handleLoopTimeUpdate);
					
					// 自动播放视频
					if (this.targetVideo.paused) {
						this.targetVideo.play().catch(error => {
							console.log('视频自动播放被阻止: ', error);
							// 不再尝试静音播放，保持暂停状态
						});
					}

					// 移除监听器
					this.targetVideo.removeEventListener('loadedmetadata', handleMetadata);
				};

				if (this.targetVideo.readyState >= 1) {
					handleMetadata();
				} else {
					this.targetVideo.addEventListener('loadedmetadata', handleMetadata);
				}
			}
		}
		// 检查是否只有单个时间点 (格式: 00:00:09)
		else if (hash.match(/^\d{2}:\d{2}:\d{2}$/)) {
			const startSeconds = this._parseTimeString(hash);

			if (startSeconds !== null) {
				console.log(`[LoopManager] 从URL解析时间点: ${hash}`);

				// 等视频元数据加载完成后再跳转
				const handleMetadata = () => {
					// 直接更新时间显示，避免时序问题
					if (this.currentPositionDisplay) {
						this.currentPositionDisplay.textContent = this.formatTimeWithHours(startSeconds);
						this.currentPositionDisplay.classList.add('active');
						const startContainer = document.querySelector('.tm-start-time-container');
						if (startContainer) startContainer.classList.add('active');
					}
					
					// 跳转到指定时间点并更新状态
					this.targetVideo.currentTime = startSeconds;
					
					// 更新状态（将触发_updateUI，更新A按钮样式）
					this.setState({ loopStartTime: startSeconds });
					
					// 强制更新标记点
					this.updateLoopMarkers();
					
					// 移除监听器
					this.targetVideo.removeEventListener('loadedmetadata', handleMetadata);
				};

				if (this.targetVideo.readyState >= 1) {
					handleMetadata();
				} else {
					this.targetVideo.addEventListener('loadedmetadata', handleMetadata);
				}
			}
		}
	}

	/**
	 * 将时间字符串解析为秒数
	 * @param {string} timeString - 格式为 "HH:MM:SS" 的时间字符串
	 * @returns {number|null} - 解析出的秒数，或null（如果解析失败）
	 */
	_parseTimeString(timeString) {
		if (!timeString) return null;

		const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2})$/);
		if (!match) return null;

		const hours = parseInt(match[1], 10);
		const minutes = parseInt(match[2], 10);
		const seconds = parseInt(match[3], 10);

		return hours * 3600 + minutes * 60 + seconds;
	}

	/**
	 * 更新URL，添加循环点信息
	 */
	_updateUrlHash() {
		let hash = '';

		if (this.loopStartTime !== null) {
			hash = this.formatTimeWithHours(this.loopStartTime);

			if (this.loopEndTime !== null) {
				hash += `-${this.formatTimeWithHours(this.loopEndTime)}`;
			}
		}

		// 使用history.replaceState更新URL而不添加历史记录
		if (hash) {
			const newUrl = window.location.pathname + window.location.search + '#' + hash;
			window.history.replaceState(null, '', newUrl);
			console.log(`[LoopManager] 更新URL: ${newUrl}`);
		}
	}

	// 模拟点击-复制开始时间
	_clickCopyStartTime() {
		const startTimeButton = document.querySelector('input#clip-start-time + a');
		startTimeButton.click();
	}

	// 模拟点击-复制结束时间
	_clickCopyEndTime() {
		const endTimeButton = document.querySelector('input#clip-end-time + a');
		endTimeButton.click();
	}

	// 模拟点击-切换循环播放
	_toggleLooping() {
		const loopButton = document.querySelector('.sm\\:ml-6 button');
		loopButton.click();
	}

	/**
	 * 设置循环结束点 - 复制当前播放时间
	 */
	setLoopEnd() {
		if (!this.targetVideo) return;

        const currentTime = this.targetVideo.currentTime;

		if (window.location.hostname.includes('missav')) {
			this._clickCopyEndTime();
            // 使用setState更新状态
            this.setState({ loopEndTime: currentTime });
		} else {
			
			// 如果开始点已设置，确保结束点在开始点之后
			if (this.loopStartTime !== null && currentTime <= this.loopStartTime) {
				console.log('[LoopManager] 循环结束点必须在开始点之后');
				return;
			}

			// 使用setState更新状态
			this.setState({ loopEndTime: currentTime });
			console.log(`[LoopManager] 设置循环结束点: ${this.formatTimeWithHours(currentTime)}`);

			// 更新URL
			this._updateUrlHash();
		}

		// 触觉反馈
		if (window.navigator.vibrate) {
			window.navigator.vibrate(10);
		}
	}

	/**
	 * 设置循环开始点 - 复制当前播放时间
	 */
	setLoopStart() {
		if (!this.targetVideo) return;

        const currentTime = this.targetVideo.currentTime;
        
		if (window.location.hostname.includes('missav')) {
			this._clickCopyStartTime();
            // 使用setState更新状态
            this.setState({ loopStartTime: currentTime });
		} else {

			// 如果结束点已设置，确保开始点在结束点之前
			if (this.loopEndTime !== null && currentTime >= this.loopEndTime) {
				console.log('[LoopManager] 循环开始点必须在结束点之前');
				return;
			}

			// 使用setState更新状态
			this.setState({ loopStartTime: currentTime });
			console.log(`[LoopManager] 设置循环开始点: ${this.formatTimeWithHours(currentTime)}`);

			// 更新URL
			this._updateUrlHash();
		}

		// 触觉反馈
		if (window.navigator.vibrate) {
			window.navigator.vibrate(10);
		}
	}

	/**
	 * 启用/禁用循环播放 - 切换循环状态
	 */
	toggleLoop() {
		if (window.location.hostname.includes('missav')) {
			this._toggleLooping();
		} else {
			// 检查是否已设置开始和结束时间
			if (this.loopStartTime === null || this.loopEndTime === null) {
				console.log("请先使用 A 和 B 按钮记录循环的开始和结束时间。");
				return;
			}

			// 切换循环状态
			const newLoopActive = !this.loopActive;
			
			// 根据新状态执行相应操作
			if (newLoopActive) {
				this.enableLoop();
			} else {
				this.disableLoop();
			}
		}
	}

	/**
	 * 启用循环播放
	 */
	enableLoop() {
		if (!this.targetVideo || this.loopStartTime === null || this.loopEndTime === null) {
			console.log('[LoopManager] 无法启用循环: 循环点未设置');
			return;
		}

		console.log(`[LoopManager] 启用循环播放: ${this.formatTimeWithHours(this.loopStartTime)} - ${this.formatTimeWithHours(this.loopEndTime)}`);

		// 更新状态
		this.setState({ loopActive: true });

		// 移除原有监听器，确保不重复添加
		this.targetVideo.removeEventListener('timeupdate', this._handleLoopTimeUpdate);

		// 添加时间更新监听器
		this.targetVideo.addEventListener('timeupdate', this._handleLoopTimeUpdate);

		// 如果当前时间不在循环范围内，跳转到循环起始点
		if (this.targetVideo.currentTime < this.loopStartTime || this.targetVideo.currentTime > this.loopEndTime) {
			this.targetVideo.currentTime = this.loopStartTime;
		}

		// 无论视频是否暂停，都开始播放
		if (this.targetVideo.paused) {
			this.targetVideo.play().catch(error => {
				console.log('视频自动播放被阻止: ', error);
				// 不再尝试静音播放，保持暂停状态
			});
		}

		// 触觉反馈
		if (window.navigator.vibrate) {
			window.navigator.vibrate([10, 30, 10]);
		}
	}

	/**
	 * 禁用循环播放
	 */
	disableLoop() {
		if (!this.loopActive) return;

		console.log('[LoopManager] 禁用循环播放');

		// 移除事件监听器
		this.targetVideo.removeEventListener('timeupdate', this._handleLoopTimeUpdate);

		// 更新状态
		this.setState({ loopActive: false });
	}

	/**
	 * 循环播放时间更新处理器
	 * 在播放到结束点时自动跳回开始点
	 */
	_handleLoopTimeUpdate() {
		if (!this.loopActive || this.loopStartTime === null || this.loopEndTime === null) return;

		const currentTime = this.targetVideo.currentTime;

		// 如果当前时间超过了循环结束点或小于开始点，跳回循环开始点
		if (currentTime >= this.loopEndTime || currentTime < this.loopStartTime) {
			this.targetVideo.currentTime = this.loopStartTime;
		}
	}

	/**
	 * 更新所有UI元素
	 */
	_updateUI() {
		console.log('[LoopManager] 更新UI元素 - 循环状态:', 
			this.loopActive ? '激活' : '未激活', 
			'开始点:', this.loopStartTime !== null ? this.formatTimeWithHours(this.loopStartTime) : '未设置', 
			'结束点:', this.loopEndTime !== null ? this.formatTimeWithHours(this.loopEndTime) : '未设置');
			
		// 更新循环时间显示（A和B按钮）
		this.updateLoopTimeDisplay();
		
		// 更新循环标记点
		this.updateLoopMarkers();
		
		// 更新循环按钮样式
		this._updateLoopButtonStyle();
	}

	/**
	 * 更新循环开关按钮状态
	 */
	_updateLoopButtonStyle() {
		if (!this.loopToggleButton) return;

		if (this.loopActive) {
			// 激活状态 - 使用CSS类控制样式
			this.loopToggleButton.classList.add('active');
			
			// 更新指示器圆圈颜色 - 通过CSS类控制
			const indicator = this.loopToggleButton.querySelector('.tm-loop-indicator-circle');
			if (indicator) {
				indicator.setAttribute('fill', 'hsl(var(--shadcn-red))');
			}
			
			// 更新标签样式 - 通过CSS类控制
			const label = this.loopToggleButton.querySelector('.tm-loop-toggle-label');
			if (label) {
				label.classList.add('active'); // 添加.active类
			}
		} else {
			// 非激活状态 - 移除CSS类
			this.loopToggleButton.classList.remove('active');
			
			// 更新指示器圆圈颜色
			const indicator = this.loopToggleButton.querySelector('.tm-loop-indicator-circle');
			if (indicator) {
				indicator.setAttribute('fill', 'hsl(var(--shadcn-muted-foreground) / 0.5)');
			}
			
			// 更新标签样式
			const label = this.loopToggleButton.querySelector('.tm-loop-toggle-label');
			if (label) {
				label.classList.remove('active'); // 移除.active类
			}
		}
	}

	/**
	 * 更新开始时间容器样式
	 */
	_updateStartTimeContainerStyle() {
		const startContainer = document.querySelector('.tm-start-time-container');
		if (!startContainer) return;

		if (this.loopStartTime !== null) {
			// 更新时间文本
			this.currentPositionDisplay.textContent = this.formatTimeWithHours(this.loopStartTime);
			
			// 添加激活样式
			this.currentPositionDisplay.classList.add('active');
			startContainer.classList.add('active');
			
			// 确保A按钮的样式已应用
			const aButton = startContainer.querySelector('.tm-loop-start-button');
			if (aButton) {
				aButton.classList.add('active');
			}
		} else {
			// 未设置开始时间的默认样式
			this.currentPositionDisplay.textContent = '00:00:00';
			
			// 移除激活样式
			this.currentPositionDisplay.classList.remove('active');
			startContainer.classList.remove('active');
			
			// 重置A按钮样式
			const aButton = startContainer.querySelector('.tm-loop-start-button');
			if (aButton) {
				aButton.classList.remove('active');
			}
		}
	}

	/**
	 * 更新结束时间容器样式
	 */
	_updateEndTimeContainerStyle() {
		const endContainer = document.querySelector('.tm-end-time-container');
		if (!endContainer) return;

		if (this.loopEndTime !== null) {
			// 更新时间文本
			this.durationDisplay.textContent = this.formatTimeWithHours(this.loopEndTime);
			
			// 添加激活样式
			this.durationDisplay.classList.add('active');
			endContainer.classList.add('active');
			
			// 确保B按钮的样式已应用
			const bButton = endContainer.querySelector('.tm-loop-end-button');
			if (bButton) {
				bButton.classList.add('active');
			}
		} else {
			// 未设置结束时间的默认样式
			this.durationDisplay.textContent = '00:00:00';
			
			// 移除激活样式
			this.durationDisplay.classList.remove('active');
			endContainer.classList.remove('active');
			
			// 重置B按钮样式
			const bButton = endContainer.querySelector('.tm-loop-end-button');
			if (bButton) {
				bButton.classList.remove('active');
			}
		}
	}

	/**
	 * 更新循环时间显示
	 */
	updateLoopTimeDisplay() {
		// 更新开始时间显示
		this._updateStartTimeContainerStyle();

		// 更新结束时间显示
		this._updateEndTimeContainerStyle();
	}

	/**
	 * 创建和更新循环标记点
	 */
	updateLoopMarkers() {
		if (!this.targetVideo || !this.loopStartMarker || !this.loopEndMarker) return;

		const progressBarElement = document.querySelector('.tm-progress-bar');
		if (!progressBarElement) return;

		const progressWidth = progressBarElement.offsetWidth;
		const duration = this.targetVideo.duration;

		if (duration <= 0 || !progressWidth) return;

		// 创建标记点辅助函数
		const createMarker = (time, isStart) => {
			const marker = isStart ? this.loopStartMarker : this.loopEndMarker;

			if (time !== null && !isNaN(time) && time >= 0 && time <= duration) {
				const position = (time / duration) * 100;
				marker.style.left = `${position}%`;
				marker.style.display = 'block';

				// 更新标记状态 - 循环激活时应用active类
				if (this.loopActive) {
					marker.classList.add('active');
				} else {
					marker.classList.remove('active');
				}

				// 添加悬停提示
				marker.setAttribute('title', isStart ?
					`循环起点: ${this.formatTimeWithHours(time)}` :
					`循环终点: ${this.formatTimeWithHours(time)}`);
				
				// 设置额外的数据属性用于显示标签
				marker.setAttribute('data-time', this.formatTimeWithHours(time));
			} else {
				marker.style.display = 'none';
			}
		};

		// 更新 A 和 B 点位置
		createMarker(this.loopStartTime, true);
		createMarker(this.loopEndTime, false);

		// 如果循环已激活且两个标记点都存在，创建视觉连接效果
		if (this.loopActive && this.loopStartTime !== null && this.loopEndTime !== null) {
			// 使用CSS类管理状态
			this.loopStartMarker.classList.add('active');
			this.loopEndMarker.classList.add('active');
			
			// 更新循环区间连接元素
			if (this.loopRangeElement) {
				const startPosition = (this.loopStartTime / duration) * 100;
				const endPosition = (this.loopEndTime / duration) * 100;
				
				// 计算宽度和位置
				const width = endPosition - startPosition;
				if (width > 0) {
					this.loopRangeElement.style.left = `${startPosition}%`;
					this.loopRangeElement.style.width = `${width}%`;
					this.loopRangeElement.style.display = 'block';
					this.loopRangeElement.classList.add('active');
				} else {
					this.loopRangeElement.style.display = 'none';
				}
			}
		} else {
			this.loopStartMarker.classList.remove('active');
			this.loopEndMarker.classList.remove('active');
			
			// 隐藏循环区间连接元素
			if (this.loopRangeElement) {
				this.loopRangeElement.classList.remove('active');
				this.loopRangeElement.style.display = 'none';
			}
		}
	}

	/**
	 * 格式化时间（含小时）
	 */
	formatTimeWithHours(timeInSeconds) {
		if (isNaN(timeInSeconds) || timeInSeconds < 0) {
			return '00:00:00';
		}
		const totalSeconds = Math.floor(timeInSeconds);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	/**
	 * 更新UI文本翻译
	 */
	updateUITranslations() {
		// 更新循环按钮文本
		if (this.loopToggleButton) {
			const loopLabel = this.loopToggleButton.querySelector('.tm-loop-toggle-label');
			if (loopLabel) {
				loopLabel.textContent = I18n.translate('loop');
			}
		}
		
		// 更新A/B点文本
		if (this.currentPositionDisplay) {
			const loopStartLabel = this.currentPositionDisplay.querySelector('.tm-set-loop-start-label');
			if (loopStartLabel) {
				loopStartLabel.setAttribute('title', I18n.translate('loopStart'));
			}
		}
		
		if (this.durationDisplay) {
			const loopEndLabel = this.durationDisplay.querySelector('.tm-set-loop-end-label');
			if (loopEndLabel) {
				loopEndLabel.setAttribute('title', I18n.translate('loopEnd'));
			}
		}
	}
}