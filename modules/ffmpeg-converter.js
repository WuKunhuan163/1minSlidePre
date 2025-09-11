/**
 * 迁移的OptimizedFFmpegConverter - 从参考项目完整迁移
 * 支持WebM到MP4转换的核心功能
 */

// 导入FFmpeg相关模块和路径解析器
import { FFmpeg } from './ffmpeg-libs/ffmpeg/ffmpeg/dist/esm/index.js';
import { PathResolver } from './path-resolver.js';

class FFmpegConverter {
    constructor(useWorker = true) {
        this.useWorker = useWorker;
        this.worker = null;
        this.ffmpeg = null;
        this.isLoaded = false;
        this.onProgress = null;
        this.onLog = null;
        this.isCancelled = false;
        this.currentReject = null;
        this.conversionPromise = null;
        
        // 从参考项目迁移的默认配置
        this.defaultOptions = {
            preset: 'ultrafast',
            crf: 28,
            audioBitrate: '96k',
            fastMode: true
        };
    }
    
    // 核心接口方法（从参考项目迁移）
    async init() {
        if (this.onLog) this.onLog('FFmpegConverter 初始化中...');
        if (this.isLoaded) return;
        
        if (this.useWorker && typeof Worker !== 'undefined') {
            return this.initWorker();
        } else {
            return this.initDirect();
        }
    }
    
    // 初始化Worker模式
    async initWorker() {
        try {
            if (this.onLog) this.onLog('正在初始化 FFmpeg Worker...');
            
            this.worker = new Worker('./modules/ffmpeg-worker.js', { type: 'module' });
            
            return new Promise((resolve, reject) => {
                this.worker.onmessage = (e) => {
                    const { type, message, success } = e.data;
                    
                    switch (type) {
                        case 'initialized':
                            if (success) {
                                this.isLoaded = true;
                                if (this.onLog) this.onLog('FFmpeg Worker 初始化完成！');
                                resolve();
                            } else {
                                reject(new Error(message));
                            }
                            break;
                            
                        case 'error':
                            reject(new Error(message));
                            break;
                    }
                };
                
                // 发送初始化命令
                this.worker.postMessage({ type: 'init' });
            });
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ Worker 初始化失败: ${error.message}`);
            throw error;
        }
    }
    
    // 初始化直接模式
    async initDirect() {
        try {
            if (this.onLog) this.onLog('正在初始化 FFmpeg (直接模式)...');
            
            // GitHub Pages兼容版本 - 动态构建模块路径
            const logCallback = this.onLog ? this.onLog.bind(this) : null;
            
            const module = await PathResolver.loadFFmpegWithRetry('window', logCallback);
            const { FFmpeg } = module;
            this.ffmpeg = new FFmpeg();

            // 设置事件监听
            this.ffmpeg.on('log', ({ message }) => {
                if (this.onLog) this.onLog(`[FFmpeg] ${message}`);
            });

            this.ffmpeg.on('progress', ({ progress, time }) => {
                const percent = Math.round(progress * 100);
                if (this.onProgress) {
                    const timeInSeconds = time > 1000000 ? (time / 1000000).toFixed(2) : time.toFixed(2);
                    this.onProgress(percent, timeInSeconds);
                }
            });

            // 加载FFmpeg核心 - 使用最简化路径
            const { config: loadConfig, valid } = await PathResolver.validateLoadConfig('window', logCallback);
            
            if (!valid) {
                throw new Error('FFmpeg 路径配置无效');
            }
            
            if (this.onLog) this.onLog('🔧 开始加载 FFmpeg 核心文件...');
            await this.ffmpeg.load(loadConfig);
            
            this.isLoaded = true;
            if (this.onLog) this.onLog('FFmpeg 直接模式初始化完成！');
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ FFmpeg 初始化失败: ${error.message}`);
            throw error;
        }
    }
    
    // 获取最优设置（从参考项目迁移）
    getOptimalSettings(fileSize, duration = 5) {
        const fileSizeMB = fileSize / (1024 * 1024);
        
        if (fileSizeMB < 2) {
            // 小文件：追求速度
            return {
                preset: 'ultrafast',
                crf: 35,
                audioBitrate: '32k',
                priority: 'speed'
            };
        } else if (fileSizeMB < 10) {
            // 中等文件：平衡
            return {
                preset: 'fast',
                crf: 30,
                audioBitrate: '64k',
                priority: 'balanced'
            };
        } else {
            // 大文件：追求压缩率
            return {
                preset: 'medium',
                crf: 28,
                audioBitrate: '96k',
                priority: 'quality'
            };
        }
    }
    
    // 主要转换接口（从参考项目迁移）
    async convertWebMToMP4(webmBlob, options = {}) {
        if (this.onLog) this.onLog('🎯⚡ 调用迁移接口：FFmpegConverter.convertWebMToMP4()');
        if (!this.isLoaded) {
            throw new Error('转换器未初始化，请先调用 init()');
        }
        
        // 重置取消标志
        this.isCancelled = false;
        this.currentReject = null;
        
        // 防止并发转换
        if (this.conversionPromise) {
            if (this.onLog) this.onLog('等待上一个转换任务完成...');
            await this.conversionPromise;
        }
        
        // 智能参数选择
        if (!options.preset && !options.crf) {
            const optimalSettings = this.getOptimalSettings(webmBlob.size);
            options = { ...optimalSettings, ...options, fastMode: false };
            if (this.onLog) {
                this.onLog(`智能选择参数: ${optimalSettings.priority}模式 (preset=${optimalSettings.preset}, crf=${optimalSettings.crf})`);
            }
        }
        
        if (this.useWorker && this.worker) {
            this.conversionPromise = this.convertWithWorker(webmBlob, options);
        } else {
            this.conversionPromise = this.convertDirect(webmBlob, options);
        }
        
        const result = await this.conversionPromise;
        this.conversionPromise = null;
        return result;
    }
    
    // 使用Worker转换
    async convertWithWorker(webmBlob, options) {
        return new Promise(async (resolve, reject) => {
            const startTime = Date.now();
            
            // 保存reject函数以便取消时使用
            this.currentReject = reject;
            this.isCancelled = false;
            
            this.worker.onmessage = (e) => {
                if (this.isCancelled) return;
                
                const { type, buffer, percent, time, message } = e.data;
                
                switch (type) {
                    case 'progress':
                        if (this.onProgress) this.onProgress(percent, time);
                        break;
                        
                    case 'log':
                        if (this.onLog) this.onLog(message);
                        break;
                        
                    case 'completed':
                        this.currentReject = null;
                        const convertTime = ((Date.now() - startTime) / 1000).toFixed(2);
                        const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
                        if (this.onLog) this.onLog(`✅ Worker转换完成！耗时 ${convertTime} 秒`);
                        if (this.onLog) this.onLog('🎊⚡ 迁移接口转换完成！使用了新的FFmpegConverter！');
                        resolve(mp4Blob);
                        break;
                        
                    case 'error':
                        this.currentReject = null;
                        reject(new Error(message));
                        break;
                }
            };
            
            try {
                // 发送转换命令
                const webmBuffer = await webmBlob.arrayBuffer();
                
                if (this.isCancelled) {
                    reject(new Error('转换已被取消'));
                    return;
                }
                
                this.worker.postMessage({
                    type: 'convert',
                    data: { webmBuffer, options }
                });
                
            } catch (error) {
                this.currentReject = null;
                reject(error);
            }
        });
    }
    
    // 直接转换（从参考项目迁移）
    async convertDirect(webmBlob, options) {
        const {
            preset = 'ultrafast',
            crf = 28,
            audioBitrate = '96k',
            fastMode = true
        } = options;
        
        try {
            if (this.onLog) this.onLog('开始转换 WebM 到 MP4...');
            
            // 写入输入文件
            const inputData = new Uint8Array(await webmBlob.arrayBuffer());
            await this.ffmpeg.writeFile('input.webm', inputData);
            
            // 始终使用重编码模式以确保兼容性
            if (this.onLog) this.onLog('使用重编码模式确保MP4兼容性...');
            let command = ['-i', 'input.webm'].concat([
                '-c:v', 'libx264',           // 强制使用H.264编码
                '-preset', preset,
                '-tune', 'zerolatency',
                '-crf', crf.toString(),
                '-pix_fmt', 'yuv420p',       // 确保像素格式兼容
                '-profile:v', 'baseline',    // 使用baseline profile确保最大兼容性
                '-level:v', '3.0',           // 设置H.264 level
                '-c:a', 'aac',               // 强制使用AAC音频编码
                '-b:a', audioBitrate,
                '-ac', '2',                  // 双声道
                '-ar', '44100',              // 标准采样率
                '-movflags', '+faststart',   // 优化流媒体播放
                '-threads', '0',             // 使用所有可用线程
                '-f', 'mp4',                 // 确保MP4格式
                'output.mp4'
            ]);
            
            await this.ffmpeg.exec(command);
            if (this.onLog) this.onLog('H.264/AAC重编码完成');
            
            const data = await this.ffmpeg.readFile('output.mp4');
            const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
            
            // 清理临时文件
            await this.ffmpeg.deleteFile('input.webm');
            await this.ffmpeg.deleteFile('output.mp4');
            
            if (this.onLog) this.onLog('✅ 直接模式转换完成！');
            return mp4Blob;
            
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 转换失败: ${error.message}`);
            
            if (options.fastMode !== false) {
                if (this.onLog) this.onLog('快速模式失败，尝试标准重编码...');
                return this.convertDirect(webmBlob, { ...options, fastMode: false });
            }
            
            throw error;
        }
    }
    
    // 回调设置方法（从参考项目迁移）
    setLogCallback(callback) {
        this.onLog = callback;
    }
    
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
    
    // 检查是否已加载
    isReady() {
        return this.isLoaded;
    }
    
    // 获取转换器信息
    getInfo() {
        return {
            isLoaded: this.isLoaded,
            useWorker: this.useWorker,
            hasWorker: !!this.worker,
            hasFFmpeg: !!this.ffmpeg
        };
    }
    
    // 合成视频与背景图片
    async compositeVideoWithBackground(videoBlob, options) {
        if (this.onLog) this.onLog('🎯🎬 调用迁移接口：FFmpegConverter.compositeVideoWithBackground()');
        if (!this.isLoaded) {
            throw new Error('转换器未初始化，请先调用 init()');
        }

        // 重置取消标志
        this.isCancelled = false;
        this.currentReject = null;

        const { pptBackground, videoScale, overlayPosition, outputSize } = options;

        try {
            if (this.onLog) this.onLog('🎬 开始视频背景合成...');

            if (this.useWorker && this.worker) {
                return await this.compositeWithWorker(videoBlob, options);
            } else {
                return await this.compositeDirect(videoBlob, options);
            }
        } catch (error) {
            if (this.onLog) this.onLog(`❌ 背景合成失败: ${error.message}`);
            throw error;
        }
    }

    // Worker模式合成
    async compositeWithWorker(videoBlob, options) {
        return new Promise(async (resolve, reject) => {
            const startTime = Date.now();
            
            this.worker.onmessage = (e) => {
                const { type, message, buffer } = e.data;
                
                switch (type) {
                    case 'log':
                        if (this.onLog) this.onLog(`[FFmpeg Worker] ${message}`);
                        break;
                        
                    case 'progress':
                        if (this.onProgress) {
                            this.onProgress(e.data.percent, e.data.time);
                        }
                        break;
                        
                    case 'composite_complete':
                        const convertTime = ((Date.now() - startTime) / 1000).toFixed(2);
                        const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
                        if (this.onLog) this.onLog(`Worker合成完成！耗时 ${convertTime} 秒`);
                        resolve(mp4Blob);
                        break;
                        
                    case 'error':
                        reject(new Error(message));
                        break;
                }
            };
            
            // 发送合成命令
            const videoBuffer = await videoBlob.arrayBuffer();
            this.worker.postMessage({
                type: 'composite',
                data: { videoBuffer, options }
            });
        });
    }

    // 直接模式合成
    async compositeDirect(videoBlob, options) {
        const { pptBackground, videoScale, overlayPosition, outputSize, autoTrimStart = true } = options;

        try {
            if (this.onLog) this.onLog('📹 直接模式背景合成...');

            // 写入视频文件
            const videoData = new Uint8Array(await videoBlob.arrayBuffer());
            await this.ffmpeg.writeFile('input_video.webm', videoData);
            if (this.onLog) this.onLog(`📹 输入视频大小: ${videoData.length} bytes`);

            // 检测视频开始时间（简化版本，跳过复杂检测）
            let startTime = 0;
            if (autoTrimStart) {
                if (this.onLog) this.onLog('📹 [视频检测] 自动裁剪功能已禁用');
            }

            // 读取PPT背景图片
            const response = await fetch(pptBackground);
            const pptData = new Uint8Array(await response.arrayBuffer());
            await this.ffmpeg.writeFile('background.jpg', pptData);
            if (this.onLog) this.onLog(`📋 PPT背景图片大小: ${pptData.length} bytes`);

            if (this.onLog) this.onLog(`🎯 合成参数: 视频缩放=${videoScale}, 叠加位置=${overlayPosition}, 输出尺寸=${outputSize}`);

            // 确保输出尺寸是偶数（H.264要求）
            const [outputWidth, outputHeight] = outputSize.split(':').map(Number);
            const evenWidth = outputWidth % 2 === 0 ? outputWidth : outputWidth + 1;
            const evenHeight = outputHeight % 2 === 0 ? outputHeight : outputHeight + 1;
            const evenOutputSize = `${evenWidth}:${evenHeight}`;
            
            if (this.onLog) this.onLog(`📐 调整输出尺寸: ${outputSize} -> ${evenOutputSize} (确保偶数)`);

            // 构建FFmpeg命令
            const command = [
                '-loop', '1',                     // 循环背景图片
                '-i', 'background.jpg',           // 背景图片
            ];
            
            // 如果需要裁剪开头，添加 -ss 参数
            if (startTime > 0) {
                command.push('-ss', startTime.toString());
            }
            
            command.push(
                '-i', 'input_video.webm',         // 输入视频
                '-filter_complex', 
                `[0:v]scale=${evenOutputSize}[bg];[1:v]scale=${videoScale}[small];[bg][small]overlay=${overlayPosition}:shortest=1[v]`,
                '-map', '[v]',                    // 映射合成的视频流
                '-map', '1:a?',                   // 映射原视频的音频流（可选）
                '-c:v', 'libx264',                // H.264编码
                '-preset', 'fast',                // 快速预设
                '-crf', '23',                     // 质量设置
                '-c:a', 'aac',                    // AAC音频编码
                '-b:a', '128k',                   // 音频比特率
                '-pix_fmt', 'yuv420p',           // 像素格式
                '-avoid_negative_ts', 'make_zero', // 避免时间戳问题
                '-t', '30',                       // 限制最长30秒
                'output_composite.mp4'
            );

            if (this.onLog) this.onLog(`🔧 FFmpeg合成命令: ${command.join(' ')}`);

            await this.ffmpeg.exec(command);
            if (this.onLog) this.onLog('✅ 背景合成命令执行完成');

            const data = await this.ffmpeg.readFile('output_composite.mp4');
            const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });

            // 清理临时文件
            await this.ffmpeg.deleteFile('input_video.webm');
            await this.ffmpeg.deleteFile('background.jpg');
            await this.ffmpeg.deleteFile('output_composite.mp4');

            if (this.onLog) this.onLog('✅ 直接模式背景合成完成！');
            return mp4Blob;

        } catch (error) {
            if (this.onLog) this.onLog(`❌ 合成失败: ${error.message}`);
            throw error;
        }
    }

    // 取消转换
    cancelConversion() {
        this.isCancelled = true;
        if (this.currentReject) {
            this.currentReject(new Error('转换已被用户取消'));
            this.currentReject = null;
        }
        if (this.onLog) {
            this.onLog('❌ 转换已取消');
        }
    }
    
    // 销毁资源
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        if (this.ffmpeg) {
            // FFmpeg实例没有明确的销毁方法，只需要清空引用
            this.ffmpeg = null;
        }
        this.isLoaded = false;
        if (this.onLog) {
            this.onLog('🧹 转换器资源已清理');
        }
    }
}

export default FFmpegConverter;