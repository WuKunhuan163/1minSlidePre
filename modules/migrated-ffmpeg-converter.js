/**
 * 迁移的OptimizedFFmpegConverter - 从参考项目完整迁移
 * 支持WebM到MP4转换的核心功能
 */

// 导入FFmpeg相关模块
import { FFmpeg } from './ffmpeg-libs/ffmpeg/ffmpeg/dist/esm/index.js';

class MigratedOptimizedFFmpegConverter {
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
        if (this.onLog) this.onLog('🔧 初始化转换器...');
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
                                if (this.onLog) this.onLog('✅ FFmpeg Worker 初始化完成！');
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
            if (this.onLog) this.onLog('正在初始化 FFmpeg 直接模式...');
            
            this.ffmpeg = new FFmpeg();
            
            // 设置日志回调
            this.ffmpeg.on('log', ({ message }) => {
                if (this.onLog) this.onLog(`[FFmpeg] ${message}`);
            });
            
            // 设置进度回调
            this.ffmpeg.on('progress', ({ progress, time }) => {
                if (this.onProgress) {
                    this.onProgress(Math.round(progress * 100), time);
                }
            });
            
            // 加载FFmpeg
            await this.ffmpeg.load();
            
            this.isLoaded = true;
            if (this.onLog) this.onLog('✅ FFmpeg 直接模式初始化完成！');
            
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

export default MigratedOptimizedFFmpegConverter;