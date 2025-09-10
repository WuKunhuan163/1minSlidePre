/**
 * 简化转换器 - 基于工作版本optimized-webm-converter
 * 直接使用工作版本的转换器，不使用复杂的分层架构
 */

import OptimizedFFmpegConverter from './ffmpeg-converter-optimized.js';

class SimpleConverter {
    constructor() {
        this.converter = null;
        this.isInitialized = false;
        
        // 回调函数
        this.onLog = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    // 初始化
    async init() {
        if (this.isInitialized) return;
        
        try {
            if (this.onLog) this.onLog('正在初始化转换器...');
            
            // 使用工作版本的转换器
            this.converter = new OptimizedFFmpegConverter(true); // 启用Worker模式
            
            // 设置回调
            this.converter.setLogCallback((message) => {
                if (this.onLog) this.onLog(`[FFmpeg] ${message}`);
            });
            
            this.converter.setProgressCallback((percent, time) => {
                if (this.onProgress) {
                    this.onProgress(percent, time);
                }
            });
            
            // 初始化转换器
            await this.converter.init();
            
            this.isInitialized = true;
            if (this.onLog) this.onLog('✅ 转换器初始化完成！');
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 转换器初始化失败: ${error.message}`);
            throw error;
        }
    }

    // 转换WebM到MP4
    async convertWebMToMP4(webmBlob) {
        if (!this.isInitialized) {
            throw new Error('转换器未初始化，请先调用 init()');
        }

        try {
            if (this.onLog) this.onLog('开始转换 WebM 到 MP4...');
            
            const startTime = Date.now();
            
            // 使用工作版本的转换器进行转换
            const mp4Blob = await this.converter.convertWebMToMP4(webmBlob, {
                // 让转换器智能选择最优参数
                fastMode: true
            });
            
            const convertTime = ((Date.now() - startTime) / 1000).toFixed(2);
            
            if (this.onLog) this.onLog(`✅ 转换完成！耗时 ${convertTime} 秒`);
            
            if (this.onComplete) {
                this.onComplete({
                    mp4Blob: mp4Blob,
                    webmSize: webmBlob.size,
                    mp4Size: mp4Blob.size,
                    convertTime: convertTime
                });
            }
            
            return mp4Blob;
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 转换失败: ${error.message}`);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    // 合成视频与背景
    async compositeVideoWithBackground(webmBlob, options) {
        if (!this.isInitialized) {
            throw new Error('转换器未初始化，请先调用 init()');
        }

        try {
            if (this.onLog) this.onLog('🎬 开始视频背景合成...');
            
            const startTime = Date.now();
            
            // 使用工作版本的转换器进行合成
            const compositeBlob = await this.converter.compositeVideoWithBackground(webmBlob, options);
            
            const convertTime = ((Date.now() - startTime) / 1000).toFixed(2);
            
            if (this.onLog) this.onLog(`✅ 合成完成！耗时 ${convertTime} 秒`);
            
            if (this.onComplete) {
                this.onComplete({
                    compositeBlob: compositeBlob,
                    originalSize: webmBlob.size,
                    compositeSize: compositeBlob.size,
                    convertTime: convertTime
                });
            }
            
            return compositeBlob;
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 合成失败: ${error.message}`);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    // 取消转换
    cancelConversion() {
        if (this.converter && this.converter.cancelConversion) {
            this.converter.cancelConversion();
            if (this.onLog) this.onLog('🛑 转换已取消');
        }
    }

    // 获取信息
    getInfo() {
        if (this.converter) {
            return this.converter.getInfo();
        }
        return {
            isLoaded: this.isInitialized,
            useWorker: true,
            hasWorker: false,
            hasFFmpeg: false
        };
    }

    // 销毁
    destroy() {
        if (this.converter) {
            this.converter.destroy();
            this.converter = null;
        }
        this.isInitialized = false;
        this.onLog = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }
}

export default SimpleConverter;

