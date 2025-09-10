/**
 * 简化视频控制器 - 整合录制和转换功能
 * 基于工作版本，避免复杂的中间层架构
 */

import SimpleRecorder from './simple-recorder.js';
import SimpleConverter from './simple-converter.js';

class SimpleVideoController {
    constructor() {
        this.recorder = new SimpleRecorder();
        this.converter = new SimpleConverter();
        this.isInitialized = false;
        
        // 创建视频元素
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        
        // 存储录制结果
        this.lastRecordedBlob = null;
        this.lastConvertedBlob = null;
        
        // 回调函数
        this.onLog = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
        
        // 设置子组件的回调
        this.setupCallbacks();
    }

    // 设置回调函数
    setupCallbacks() {
        // 录制器回调
        this.recorder.onLog = (message) => {
            if (this.onLog) this.onLog(`[录制] ${message}`);
        };
        
        this.recorder.onProgress = (progress) => {
            if (this.onProgress) this.onProgress(progress * 0.3, '录制中...');
        };
        
        this.recorder.onError = (error) => {
            if (this.onError) this.onError(error);
        };
        
        // 转换器回调
        this.converter.onLog = (message) => {
            if (this.onLog) this.onLog(`[转换] ${message}`);
        };
        
        this.converter.onProgress = (percent, time) => {
            if (this.onProgress) this.onProgress(30 + percent * 0.7, `转换中... ${time || ''}`);
        };
        
        this.converter.onError = (error) => {
            if (this.onError) this.onError(error);
        };
    }

    // 初始化
    async init(existingStream = null) {
        if (this.isInitialized) return;
        
        try {
            if (this.onLog) this.onLog('正在初始化视频控制器...');
            
            // 如果提供了已有的流，使用它；否则初始化新的摄像头
            if (existingStream) {
                this.recorder.stream = existingStream;
                if (this.onLog) this.onLog('使用已有的摄像头流');
            } else {
                await this.recorder.initCamera();
            }
            
            // 将摄像头流连接到视频元素
            if (this.recorder.stream) {
                this.videoElement.srcObject = this.recorder.stream;
            }
            
            // 转换器延迟初始化（在需要时再初始化）
            if (this.onLog) this.onLog('⏭️ 转换器将在需要时初始化');
            
            this.isInitialized = true;
            if (this.onLog) this.onLog('✅ 视频控制器初始化完成！');
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 视频控制器初始化失败: ${error.message}`);
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    // 单独初始化摄像头（用于测试）
    async initCamera() {
        try {
            if (this.onLog) this.onLog('正在初始化摄像头...');
            await this.recorder.initCamera();
            
            // 将摄像头流连接到视频元素
            if (this.recorder.stream) {
                this.videoElement.srcObject = this.recorder.stream;
            }
            
            if (this.onLog) this.onLog('✅ 摄像头初始化完成！');
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 摄像头初始化失败: ${error.message}`);
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    // 获取摄像头流
    getStream() {
        return this.recorder.stream;
    }

    // 获取实际录制时长
    getRecordingDuration() {
        return this.recorder.actualRecordingDuration || 5; // 默认5秒
    }

    // 开始录制
    startRecording(durationSeconds = null) {
        try {
            if (!this.isInitialized) {
                throw new Error('控制器未初始化，请先调用 init()');
            }
            
            if (this.onLog) {
                if (durationSeconds) {
                    this.onLog(`开始录制 ${durationSeconds} 秒...`);
                } else {
                    this.onLog('开始录制（手动停止）...');
                }
            }
            
            // 设置录制完成回调
            this.recorder.onComplete = (result) => {
                this.lastRecordedBlob = result.blob; // 保存录制结果
                if (this.onLog) this.onLog('✅ 录制完成！');
                if (this.onLog) this.onLog(`文件大小: ${(result.size / 1024 / 1024).toFixed(2)}MB, 时长: ${result.duration.toFixed(2)}秒`);
            };
            
            // 开始录制
            if (this.onLog) this.onLog('调用 recorder.startRecording()...');
            this.recorder.startRecording();
            if (this.onLog) this.onLog('recorder.startRecording() 调用完成');
            
            // 如果指定了持续时间，设置自动停止
            if (durationSeconds) {
                setTimeout(() => {
                    this.stopRecording();
                }, durationSeconds * 1000);
            }
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 录制失败: ${error.message}`);
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    // 停止录制
    stopRecording() {
        try {
            this.recorder.stopRecording();
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 停止录制失败: ${error.message}`);
            throw error;
        }
    }


    // 录制并转换（一键操作）
    async recordAndConvert(durationSeconds = 5) {
        try {
            if (this.onLog) this.onLog('开始录制并转换流程...');
            
            if (!this.isInitialized) {
                await this.init();
            }
            
            // 开始录制
            this.startRecording();
            
            // 等待指定时间后停止录制
            await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
            this.stopRecording();
            
            // 等待录制完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 转换
            const mp4Blob = await this.converter.convertWebMToMP4(this.lastRecordedBlob);
            
            if (this.onLog) this.onLog('✅ 录制并转换完成！');
            return mp4Blob;
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 录制并转换失败: ${error.message}`);
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    // 清理资源
    cleanup() {
        try {
            // 停止摄像头流
            if (this.recorder.stream) {
                this.recorder.stream.getTracks().forEach(track => track.stop());
            }
            
            // 清理视频元素
            if (this.videoElement && this.videoElement.srcObject) {
                this.videoElement.srcObject = null;
            }
            
            // 清理转换器（如果有cleanup方法）
            if (this.converter && this.converter.converter && typeof this.converter.converter.cleanup === 'function') {
                this.converter.converter.cleanup();
            }
            
            // 重置状态
            this.isInitialized = false;
            this.lastRecordedBlob = null;
            this.lastConvertedBlob = null;
            
        } catch (error) {
            if (this.onLog) this.onLog(`⚠️ 清理资源时出现警告: ${error.message}`);
        }
    }

    // 开始转换（用于兼容camera-setup.js）
    async startConversion() {
        if (!this.lastRecordedBlob) {
            throw new Error('没有录制的视频可以转换');
        }
        
        try {
            // 如果转换器未初始化，先初始化
            if (!this.converter.isInitialized) {
                if (this.onLog) this.onLog('正在初始化转换器...');
                await this.converter.init();
            }
            
            // 直接使用converter的convertWebMToMP4方法
            if (this.onLog) this.onLog('开始转换为MP4格式...');
            const mp4Blob = await this.converter.convertWebMToMP4(this.lastRecordedBlob);
            this.lastConvertedBlob = mp4Blob;
            if (this.onLog) this.onLog('✅ 转换完成！');
            return mp4Blob;
        } catch (error) {
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    // 合成视频与背景
    async compositeVideoWithBackground(options) {
        if (!this.lastRecordedBlob) {
            throw new Error('没有录制的视频可以合成');
        }
        
        try {
            // 如果转换器未初始化，先初始化
            if (!this.converter.isInitialized) {
                if (this.onLog) this.onLog('正在初始化转换器...');
                await this.converter.init();
            }
            
            // 调用合成功能
            if (this.onLog) this.onLog('开始演讲者模式合成...');
            const compositeBlob = await this.converter.compositeVideoWithBackground(this.lastRecordedBlob, options);
            this.lastConvertedBlob = compositeBlob;
            if (this.onLog) this.onLog('✅ 演讲者模式合成完成！');
            return compositeBlob;
        } catch (error) {
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    // 下载视频
    downloadVideo(filename = 'video.mp4') {
        if (!this.lastConvertedBlob) {
            if (this.onLog) this.onLog('❌ 没有可下载的视频');
            return;
        }

        try {
            const url = URL.createObjectURL(this.lastConvertedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (this.onLog) this.onLog(`✅ 视频下载开始: ${filename}`);
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 视频下载失败: ${error.message}`);
            if (this.onError) this.onError(error);
        }
    }

    // 销毁控制器
    destroy() {
        this.cleanup();
    }

    // 设置回调函数的便捷方法
    setCallbacks(callbacks) {
        if (callbacks.onLog) this.onLog = callbacks.onLog;
        if (callbacks.onProgress) this.onProgress = callbacks.onProgress;
        if (callbacks.onComplete) this.onComplete = callbacks.onComplete;
        if (callbacks.onError) this.onError = callbacks.onError;
        if (callbacks.progressUI) {
            this.progressUI = callbacks.progressUI;
            // 将progressUI传递给转换器
            this.converter.setProgressUI(callbacks.progressUI);
        }
    }
}

export default SimpleVideoController;
