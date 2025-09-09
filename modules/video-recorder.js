/**
 * 视频录制管理器
 * 支持WebM格式录制，包含倒计时、进度显示等功能
 */

class VideoRecorder {
    constructor(options = {}) {
        this.stream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDuration = options.duration || 5000; // 默认5秒
        this.onProgress = options.onProgress || null;
        this.onComplete = options.onComplete || null;
        this.onError = options.onError || null;
        this.onLog = options.onLog || null;
        
        // 录制参数
        this.recordingOptions = {
            mimeType: 'video/webm;codecs=vp8,opus',
            videoBitsPerSecond: 2000000, // 2Mbps
            audioBitsPerSecond: 128000   // 128kbps
        };
        
        // 倒计时相关
        this.countdownTimer = null;
        this.progressTimer = null;
        this.startTime = null;
    }

    /**
     * 初始化录制器
     * @param {MediaStream} stream - 媒体流
     */
    async init(stream) {
        if (!stream) {
            throw new Error('需要提供媒体流');
        }
        
        this.stream = stream;
        
        // 检查浏览器支持
        if (!MediaRecorder.isTypeSupported(this.recordingOptions.mimeType)) {
            // 尝试备用格式
            const fallbackTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm',
                'video/mp4'
            ];
            
            let supportedType = null;
            for (const type of fallbackTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    supportedType = type;
                    break;
                }
            }
            
            if (supportedType) {
                this.recordingOptions.mimeType = supportedType;
                if (this.onLog) this.onLog(`使用备用录制格式: ${supportedType}`);
            } else {
                throw new Error('浏览器不支持视频录制');
            }
        }
        
        if (this.onLog) this.onLog(`录制器初始化完成，格式: ${this.recordingOptions.mimeType}`);
    }

    /**
     * 开始录制（带倒计时）
     * @param {number} countdown - 倒计时秒数，默认3秒
     */
    async startRecordingWithCountdown(countdown = 3) {
        if (this.isRecording) {
            throw new Error('正在录制中');
        }
        
        if (!this.stream) {
            throw new Error('录制器未初始化');
        }
        
        if (this.onLog) this.onLog(`开始${countdown}秒倒计时...`);
        
        // 倒计时
        await this.runCountdown(countdown);
        
        // 开始实际录制
        return this.startRecording();
    }

    /**
     * 运行倒计时
     * @param {number} seconds - 倒计时秒数
     */
    runCountdown(seconds) {
        return new Promise((resolve) => {
            let remaining = seconds;
            
            const updateCountdown = () => {
                if (this.onProgress) {
                    this.onProgress({
                        type: 'countdown',
                        remaining: remaining,
                        total: seconds
                    });
                }
                
                if (this.onLog) this.onLog(`倒计时: ${remaining}秒`);
                
                remaining--;
                
                if (remaining >= 0) {
                    this.countdownTimer = setTimeout(updateCountdown, 1000);
                } else {
                    if (this.onLog) this.onLog('倒计时结束，开始录制！');
                    resolve();
                }
            };
            
            updateCountdown();
        });
    }

    /**
     * 开始录制
     */
    async startRecording() {
        if (this.isRecording) {
            throw new Error('正在录制中');
        }
        
        try {
            this.recordedChunks = [];
            this.isRecording = true;
            this.startTime = Date.now();
            
            // 创建MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream, this.recordingOptions);
            
            // 设置事件监听
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };
            
            this.mediaRecorder.onerror = (event) => {
                if (this.onError) {
                    this.onError(new Error(`录制错误: ${event.error}`));
                }
            };
            
            // 开始录制
            this.mediaRecorder.start(100); // 每100ms收集一次数据
            
            if (this.onLog) this.onLog(`开始录制，时长: ${this.recordingDuration}ms`);
            
            // 开始进度更新
            this.startProgressUpdates();
            
            // 设置自动停止
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, this.recordingDuration);
            
        } catch (error) {
            this.isRecording = false;
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    /**
     * 开始进度更新
     */
    startProgressUpdates() {
        const updateInterval = 100; // 100ms更新一次
        
        const updateProgress = () => {
            if (!this.isRecording) return;
            
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min((elapsed / this.recordingDuration) * 100, 100);
            const remaining = Math.max(this.recordingDuration - elapsed, 0);
            
            if (this.onProgress) {
                this.onProgress({
                    type: 'recording',
                    progress: progress,
                    elapsed: elapsed,
                    remaining: remaining,
                    duration: this.recordingDuration
                });
            }
            
            if (this.isRecording && elapsed < this.recordingDuration) {
                this.progressTimer = setTimeout(updateProgress, updateInterval);
            }
        };
        
        updateProgress();
    }

    /**
     * 停止录制
     */
    stopRecording() {
        if (!this.isRecording) {
            return;
        }
        
        this.isRecording = false;
        
        // 清理定时器
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        if (this.progressTimer) {
            clearTimeout(this.progressTimer);
            this.progressTimer = null;
        }
        
        // 停止录制
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.onLog) this.onLog('录制已停止');
    }

    /**
     * 处理录制完成
     */
    handleRecordingComplete() {
        if (this.recordedChunks.length === 0) {
            if (this.onError) {
                this.onError(new Error('录制失败：没有数据'));
            }
            return;
        }
        
        try {
            // 创建WebM blob
            const webmBlob = new Blob(this.recordedChunks, { 
                type: this.recordingOptions.mimeType 
            });
            
            const actualDuration = Date.now() - this.startTime;
            
            if (this.onLog) {
                this.onLog(`录制完成！文件大小: ${(webmBlob.size / 1024 / 1024).toFixed(2)}MB，实际时长: ${actualDuration}ms`);
            }
            
            // 最后一次进度更新
            if (this.onProgress) {
                this.onProgress({
                    type: 'completed',
                    progress: 100,
                    elapsed: actualDuration,
                    remaining: 0,
                    duration: this.recordingDuration,
                    blob: webmBlob
                });
            }
            
            // 调用完成回调
            if (this.onComplete) {
                this.onComplete({
                    blob: webmBlob,
                    duration: actualDuration,
                    size: webmBlob.size,
                    mimeType: this.recordingOptions.mimeType
                });
            }
            
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
        }
    }

    /**
     * 取消录制
     */
    cancelRecording() {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        this.recordedChunks = [];
        
        if (this.onLog) this.onLog('录制已取消');
    }

    /**
     * 设置录制时长
     * @param {number} duration - 时长（毫秒）
     */
    setDuration(duration) {
        if (this.isRecording) {
            throw new Error('录制进行中时无法修改时长');
        }
        
        this.recordingDuration = duration;
        if (this.onLog) this.onLog(`录制时长设置为: ${duration}ms`);
    }

    /**
     * 获取录制状态
     */
    getStatus() {
        return {
            isRecording: this.isRecording,
            duration: this.recordingDuration,
            hasStream: !!this.stream,
            mimeType: this.recordingOptions.mimeType,
            chunksCount: this.recordedChunks.length
        };
    }

    /**
     * 清理资源
     */
    destroy() {
        this.cancelRecording();
        
        if (this.mediaRecorder) {
            this.mediaRecorder = null;
        }
        
        this.stream = null;
        this.recordedChunks = [];
        
        if (this.onLog) this.onLog('录制器已销毁');
    }
}

export default VideoRecorder;

