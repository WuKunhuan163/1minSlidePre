/**
 * 视频转换管理器
 * 整合录制和转换功能，支持背景合成
 */

import OptimizedFFmpegConverter from './ffmpeg-converter-optimized.js';
import VideoRecorder from './video-recorder.js';
import ProgressUI from './progress-ui.js';

class VideoConverter {
    constructor(options = {}) {
        this.ffmpegConverter = null;
        this.videoRecorder = null;
        this.progressUI = null;
        this.isInitialized = false;
        
        // 配置选项
        this.options = {
            recordingDuration: options.recordingDuration || 5000, // 5秒
            useWorker: options.useWorker !== false, // 默认使用Worker
            showProgress: options.showProgress !== false, // 默认显示进度
            progressContainer: options.progressContainer || null,
            ...options
        };
        
        // 回调函数
        this.onProgress = options.onProgress || null;
        this.onLog = options.onLog || null;
        this.onComplete = options.onComplete || null;
        this.onError = options.onError || null;
        
        // 状态
        this.currentStep = 'idle'; // idle, recording, converting, complete, error
        this.recordedBlob = null;
        this.convertedBlob = null;
    }

    /**
     * 初始化转换器
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.log('正在初始化视频转换器...');
            
            // 初始化FFmpeg转换器
            this.ffmpegConverter = new OptimizedFFmpegConverter(this.options.useWorker);
            
            // 设置回调
            this.ffmpegConverter.setProgressCallback((percent, time) => {
                this.handleConversionProgress(percent, time);
            });
            
            this.ffmpegConverter.setLogCallback((message) => {
                this.log(`[FFmpeg] ${message}`);
            });
            
            // 初始化FFmpeg
            await this.ffmpegConverter.init();
            
            // 初始化录制器
            this.videoRecorder = new VideoRecorder({
                duration: this.options.recordingDuration,
                onProgress: (data) => this.handleRecordingProgress(data),
                onComplete: (data) => this.handleRecordingComplete(data),
                onError: (error) => this.handleError(error),
                onLog: (message) => this.log(`[录制] ${message}`)
            });
            
            // 初始化进度UI
            if (this.options.showProgress) {
                this.progressUI = new ProgressUI({
                    title: '视频录制与转换',
                    showLogs: true
                });
                
                // 设置中心按钮点击事件
                this.progressUI.setCenterButtonClick(() => {
                    if (this.options.onCenterButtonClick) {
                        this.options.onCenterButtonClick();
                    }
                });
            }
            
            this.isInitialized = true;
            this.log('✅ 视频转换器初始化完成');
            
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * 开始录制和转换流程
     * @param {MediaStream} stream - 媒体流
     * @param {Object} conversionOptions - 转换选项
     */
    async startRecordingAndConversion(stream, conversionOptions = {}) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            this.currentStep = 'recording';
            this.log('开始录制和转换流程...');
            
            // 显示进度UI
            if (this.progressUI && this.options.progressContainer) {
                this.progressUI.create(this.options.progressContainer);
                this.progressUI.show();
                this.progressUI.reset();
            }
            
            // 初始化录制器
            await this.videoRecorder.init(stream);
            
            // 开始录制（带倒计时）
            await this.videoRecorder.startRecordingWithCountdown(3);
            
            // 录制完成后会自动触发转换
            
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 处理录制进度
     */
    handleRecordingProgress(data) {
        switch (data.type) {
            case 'countdown':
                const countdownPercent = ((data.total - data.remaining) / data.total) * 20; // 倒计时占20%
                this.updateProgress(countdownPercent, `倒计时: ${data.remaining}秒`);
                break;
                
            case 'recording':
                const recordingPercent = 20 + (data.progress * 0.3); // 录制占30%，从20%开始
                this.updateProgress(recordingPercent, `录制中: ${(data.remaining / 1000).toFixed(1)}秒剩余`);
                break;
                
            case 'completed':
                this.updateProgress(50, '录制完成，准备转换...');
                break;
        }
        
        if (this.onProgress) {
            this.onProgress(data);
        }
    }

    /**
     * 处理录制完成
     */
    async handleRecordingComplete(data) {
        try {
            this.recordedBlob = data.blob;
            this.log(`录制完成！文件大小: ${(data.size / 1024 / 1024).toFixed(2)}MB`);
            
            this.currentStep = 'converting';
            this.updateProgress(50, '开始视频转换...');
            
            // 开始转换
            await this.startConversion();
            
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 开始转换
     */
    async startConversion() {
        if (!this.recordedBlob) {
            throw new Error('没有录制的视频数据');
        }
        
        try {
            this.log('开始转换WebM到MP4...');
            
            // 检查是否需要背景合成
            if (this.options.compositeOptions) {
                this.convertedBlob = await this.ffmpegConverter.compositeVideoWithBackground(
                    this.recordedBlob,
                    this.options.compositeOptions
                );
            } else {
                // 直接转换
                this.convertedBlob = await this.ffmpegConverter.convertWebMToMP4(
                    this.recordedBlob,
                    this.options.conversionOptions || {}
                );
            }
            
            this.handleConversionComplete();
            
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 处理转换进度
     */
    handleConversionProgress(percent, time) {
        // 转换占50%，从50%开始
        const totalPercent = 50 + (percent * 0.5);
        this.updateProgress(totalPercent, `转换中: ${percent}%`);
        
        if (this.onProgress) {
            this.onProgress({
                type: 'conversion',
                progress: percent,
                time: time,
                totalProgress: totalPercent
            });
        }
    }

    /**
     * 处理转换完成
     */
    handleConversionComplete() {
        this.currentStep = 'complete';
        this.updateProgress(100, '转换完成！');
        
        if (this.progressUI) {
            this.progressUI.setComplete();
        }
        
        this.log(`✅ 转换完成！最终文件大小: ${(this.convertedBlob.size / 1024 / 1024).toFixed(2)}MB`);
        
        if (this.onComplete) {
            this.onComplete({
                recordedBlob: this.recordedBlob,
                convertedBlob: this.convertedBlob,
                recordedSize: this.recordedBlob.size,
                convertedSize: this.convertedBlob.size
            });
        }
        
        // 3秒后自动隐藏进度UI
        setTimeout(() => {
            if (this.progressUI) {
                this.progressUI.hide();
            }
        }, 3000);
    }

    /**
     * 处理错误
     */
    handleError(error) {
        this.currentStep = 'error';
        const errorMessage = error.message || '未知错误';
        
        this.log(`❌ 错误: ${errorMessage}`);
        
        if (this.progressUI) {
            this.progressUI.setError(errorMessage);
        }
        
        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * 更新进度
     */
    updateProgress(percent, status) {
        if (this.progressUI) {
            this.progressUI.updateProgress(percent, status);
        }
    }

    /**
     * 记录日志
     */
    log(message) {
        // 只在开发模式下输出到控制台，或者是重要错误
        if (message.includes('❌') || message.includes('✅') || message.includes('开始') || message.includes('完成')) {
            console.log(`[VideoConverter] ${message}`);
        }
        
        // 始终添加到UI日志中
        if (this.progressUI) {
            this.progressUI.addLog(message);
        }
        
        if (this.onLog) {
            this.onLog(message);
        }
    }

    /**
     * 取消当前操作
     */
    cancel() {
        this.log('用户取消操作...');
        
        if (this.videoRecorder) {
            this.videoRecorder.cancelRecording();
        }
        
        if (this.ffmpegConverter) {
            this.ffmpegConverter.cancelConversion();
        }
        
        if (this.progressUI) {
            this.progressUI.hide();
        }
        
        this.currentStep = 'idle';
    }

    /**
     * 设置转换选项
     */
    setConversionOptions(options) {
        this.options.conversionOptions = options;
    }

    /**
     * 设置合成选项（背景合成）
     */
    setCompositeOptions(options) {
        this.options.compositeOptions = options;
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            currentStep: this.currentStep,
            isInitialized: this.isInitialized,
            hasRecordedBlob: !!this.recordedBlob,
            hasConvertedBlob: !!this.convertedBlob,
            ffmpegInfo: this.ffmpegConverter ? this.ffmpegConverter.getInfo() : null,
            recordingInfo: this.videoRecorder ? this.videoRecorder.getStatus() : null
        };
    }

    /**
     * 下载转换后的视频
     * @param {string} filename - 文件名
     */
    downloadVideo(filename = 'converted_video.mp4') {
        if (!this.convertedBlob) {
            throw new Error('没有转换后的视频数据');
        }
        
        const url = URL.createObjectURL(this.convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log(`下载视频: ${filename}`);
    }

    /**
     * 清理资源
     */
    destroy() {
        if (this.videoRecorder) {
            this.videoRecorder.destroy();
            this.videoRecorder = null;
        }
        
        if (this.ffmpegConverter) {
            this.ffmpegConverter.destroy();
            this.ffmpegConverter = null;
        }
        
        if (this.progressUI) {
            this.progressUI.destroy();
            this.progressUI = null;
        }
        
        this.recordedBlob = null;
        this.convertedBlob = null;
        this.isInitialized = false;
        this.currentStep = 'idle';
        
        this.log('视频转换器已销毁');
    }

    /**
     * 创建用于预览的视频元素
     * @param {Blob} blob - 视频blob
     * @returns {HTMLVideoElement} 视频元素
     */
    createVideoPreview(blob) {
        const video = document.createElement('video');
        const blobUrl = URL.createObjectURL(blob);
        video.src = blobUrl;
        video.controls = true;
        video.style.cssText = `
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        // 存储blob URL以便后续清理
        video.dataset.blobUrl = blobUrl;
        
        // 只在视频真正结束播放或元素被移除时清理URL
        const cleanupUrl = () => {
            if (video.dataset.blobUrl) {
                URL.revokeObjectURL(video.dataset.blobUrl);
                delete video.dataset.blobUrl;
            }
        };
        
        // 当视频元素被移除时清理
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node === video) {
                            cleanupUrl();
                            observer.disconnect();
                        }
                    });
                }
            });
        });
        
        // 观察父节点的变化
        if (video.parentNode) {
            observer.observe(video.parentNode, { childList: true });
        }
        
        // 也可以手动调用清理方法
        video.cleanup = cleanupUrl;
        
        return video;
    }

    /**
     * 下载转换后的视频
     * @param {string} filename - 文件名
     */
    downloadVideo(filename = 'converted_video.mp4') {
        if (!this.convertedBlob) {
            console.error('❌ 没有可下载的视频');
            return;
        }
        
        const url = URL.createObjectURL(this.convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 清理URL
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        this.log(`📥 开始下载视频: ${filename}`);
    }
}

export default VideoConverter;
