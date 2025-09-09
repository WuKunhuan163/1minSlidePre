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
            let isFirstRun = true;
            
            const updateCountdown = () => {
                // 在倒计时开始时，捕获最后一帧并隐藏视频
                if (isFirstRun) {
                    this.captureLastFrameAndHideVideo();
                    isFirstRun = false;
                }
                
                if (this.onProgress) {
                    this.onProgress({
                        type: 'countdown',
                        remaining: remaining,
                        total: seconds
                    });
                }
                
                // 修改倒计时文字，提醒用户看摄像头
                const message = remaining > 0 ? `请看摄像头，${remaining}秒后开始录制` : '开始录制！';
                if (this.onLog) this.onLog(message);
                
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
     * 捕获最后一帧图像并隐藏视频流
     */
    captureLastFrameAndHideVideo() {
        try {
            if (this.onLog) this.onLog('📸 开始捕获最后一帧并隐藏摄像头...');
            
            // 查找摄像头预览视频元素
            const cameraPreview = document.getElementById('cameraPreview');
            const cameraPreviewSection = document.getElementById('cameraPreviewSection');
            const speakerPreviewVideo = document.getElementById('speakerPreviewVideo');
            
            console.log('🔍 查找视频元素:', {
                cameraPreview: !!cameraPreview,
                cameraPreviewSection: !!cameraPreviewSection,
                speakerPreviewVideo: !!speakerPreviewVideo,
                cameraVideoWidth: cameraPreview?.videoWidth,
                cameraVideoHeight: cameraPreview?.videoHeight
            });
            
            if (cameraPreview && cameraPreview.videoWidth > 0 && cameraPreview.videoHeight > 0) {
                // 创建canvas捕获最后一帧
                const canvas = document.createElement('canvas');
                canvas.width = cameraPreview.videoWidth;
                canvas.height = cameraPreview.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(cameraPreview, 0, 0);
                
                // 创建静态图像元素
                const staticImage = document.createElement('img');
                staticImage.src = canvas.toDataURL('image/png');
                
                // 设置静态图像样式，确保与原视频元素一致且不溢出
                staticImage.style.width = cameraPreview.style.width || '400px';
                staticImage.style.height = cameraPreview.style.height || '300px';
                staticImage.style.maxWidth = '100%';
                staticImage.style.maxHeight = '100%';
                staticImage.style.objectFit = 'cover';
                staticImage.style.borderRadius = '8px';
                staticImage.style.border = '2px solid #333';
                staticImage.style.background = '#000';
                staticImage.style.display = 'block';
                staticImage.style.margin = '0 auto';
                staticImage.id = 'cameraStaticFrame';
                
                // 隐藏视频元素，显示静态图像
                cameraPreview.style.display = 'none';
                if (cameraPreviewSection) {
                    cameraPreviewSection.appendChild(staticImage);
                }
                
                if (this.onLog) this.onLog('✅ 已捕获摄像头最后一帧并隐藏视频');
            } else {
                if (this.onLog) this.onLog('⚠️ 摄像头预览不可用或尺寸为0');
                // 如果无法捕获帧，至少暂停视频
                if (cameraPreview) {
                    cameraPreview.pause();
                    if (this.onLog) this.onLog('⏸️ 已暂停摄像头预览');
                }
            }
            
            // 同样处理演讲者预览视频
            if (speakerPreviewVideo && speakerPreviewVideo.videoWidth > 0 && speakerPreviewVideo.videoHeight > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = speakerPreviewVideo.videoWidth;
                canvas.height = speakerPreviewVideo.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(speakerPreviewVideo, 0, 0);
                
                const staticImage = document.createElement('img');
                staticImage.src = canvas.toDataURL('image/png');
                
                // 设置演讲者静态图像样式，确保不溢出
                staticImage.style.position = speakerPreviewVideo.style.position || 'absolute';
                staticImage.style.width = speakerPreviewVideo.style.width || '100%';
                staticImage.style.height = speakerPreviewVideo.style.height || '100%';
                staticImage.style.left = speakerPreviewVideo.style.left || '0px';
                staticImage.style.top = speakerPreviewVideo.style.top || '0px';
                staticImage.style.objectFit = 'cover';
                staticImage.style.borderRadius = '4px';
                staticImage.style.maxWidth = '100%';
                staticImage.style.maxHeight = '100%';
                staticImage.id = 'speakerStaticFrame';
                
                speakerPreviewVideo.style.display = 'none';
                if (speakerPreviewVideo.parentNode) {
                    speakerPreviewVideo.parentNode.appendChild(staticImage);
                }
                
                if (this.onLog) this.onLog('✅ 已捕获演讲者预览最后一帧');
            }
            
        } catch (error) {
            console.error('❌ 捕获最后一帧失败:', error);
            if (this.onLog) this.onLog(`❌ 捕获最后一帧失败: ${error.message}`);
        }
    }

    /**
     * 恢复视频显示（清理静态图像）
     */
    restoreVideoDisplay() {
        try {
            if (this.onLog) this.onLog('🔄 开始恢复视频显示...');
            
            // 恢复摄像头预览
            const cameraPreview = document.getElementById('cameraPreview');
            const cameraStaticFrame = document.getElementById('cameraStaticFrame');
            
            if (cameraPreview) {
                cameraPreview.style.display = '';
                if (this.onLog) this.onLog('✅ 已恢复摄像头预览显示');
            }
            
            if (cameraStaticFrame) {
                cameraStaticFrame.remove();
                if (this.onLog) this.onLog('🗑️ 已移除摄像头静态图像');
            }
            
            // 恢复演讲者预览
            const speakerPreviewVideo = document.getElementById('speakerPreviewVideo');
            const speakerStaticFrame = document.getElementById('speakerStaticFrame');
            
            if (speakerPreviewVideo) {
                speakerPreviewVideo.style.display = '';
                if (this.onLog) this.onLog('✅ 已恢复演讲者预览显示');
            }
            
            if (speakerStaticFrame) {
                speakerStaticFrame.remove();
                if (this.onLog) this.onLog('🗑️ 已移除演讲者静态图像');
            }
            
        } catch (error) {
            console.error('❌ 恢复视频显示失败:', error);
            if (this.onLog) this.onLog(`❌ 恢复视频显示失败: ${error.message}`);
        }
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
            
            // 恢复视频显示
            this.restoreVideoDisplay();
            
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

