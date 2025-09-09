/**
 * 增强型音频处理器 - 基于vercel_server的高质量音频处理和识别
 * 提供更好的音频质量和识别效果
 */
class EnhancedAudioProcessor {
    constructor() {
        this.apiBaseUrl = 'https://aliyun-voice-to-text-api.vercel.app/api';
    }

    /**
     * 重采样音频到指定采样率
     * @param {Float32Array} audioData - 原始音频数据
     * @param {number} originalSampleRate - 原始采样率
     * @param {number} targetSampleRate - 目标采样率
     * @returns {Float32Array} 重采样后的音频数据
     */
    resampleAudio(audioData, originalSampleRate, targetSampleRate) {
        if (originalSampleRate === targetSampleRate) {
            return audioData;
        }
        
        const ratio = originalSampleRate / targetSampleRate;
        const newLength = Math.floor(audioData.length / ratio);
        const result = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
            const sourceIndex = Math.floor(i * ratio);
            result[i] = audioData[sourceIndex];
        }
        
        console.log(`🔄 音频重采样: ${originalSampleRate}Hz → ${targetSampleRate}Hz (${audioData.length} → ${result.length} samples)`);
        return result;
    }

    /**
     * 将Float32Array转换为16位PCM格式
     * @param {Float32Array} float32Data - Float32音频数据
     * @returns {Int16Array} 16位PCM数据
     */
    convertFloat32ToInt16(float32Data) {
        const int16Data = new Int16Array(float32Data.length);
        for (let i = 0; i < float32Data.length; i++) {
            const sample = Math.max(-1, Math.min(1, float32Data[i])); // 限制在-1到1之间
            int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        return int16Data;
    }

    /**
     * 分析音频质量
     * @param {Float32Array} audioData - 音频数据
     * @returns {Object} 音频质量分析结果
     */
    analyzeAudioQuality(audioData) {
        let maxAmplitude = 0;
        let rmsLevel = 0;
        let nonZeroSamples = 0;
        let totalEnergy = 0;
        let silentSamples = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            const abs = Math.abs(audioData[i]);
            if (abs > maxAmplitude) {
                maxAmplitude = abs;
            }
            if (abs > 0.0001) { // 忽略极小的噪声
                nonZeroSamples++;
            } else {
                silentSamples++;
            }
            const square = audioData[i] * audioData[i];
            rmsLevel += square;
            totalEnergy += square;
        }
        
        rmsLevel = Math.sqrt(rmsLevel / audioData.length);
        const dbLevel = rmsLevel > 0 ? (20 * Math.log10(rmsLevel)) : -Infinity;
        
        // 质量评估
        let qualityScore = 0;
        let qualityIssues = [];
        
        if (maxAmplitude > 0.01) {
            qualityScore += 25;
        } else {
            qualityIssues.push('信号强度过低');
        }
        
        if (rmsLevel > 0.001) {
            qualityScore += 25;
        } else {
            qualityIssues.push('RMS水平过低');
        }
        
        if (nonZeroSamples / audioData.length > 0.1) {
            qualityScore += 25;
        } else {
            qualityIssues.push('有效音频样本过少');
        }
        
        if (dbLevel > -60) {
            qualityScore += 25;
        } else {
            qualityIssues.push('音频分贝水平过低');
        }
        
        // 检测背景音乐干扰
        if (maxAmplitude < 0.001 && window.backgroundMusic) {
            console.warn('⚠️ 检测到背景音乐可能影响录音质量');
            qualityIssues.push('背景音乐干扰');
        }
        
        // 检测音频上下文冲突
        if (typeof window.backgroundMusic !== 'undefined' && qualityScore < 50) {
            qualityIssues.push('音频环境冲突');
        }
        
        // 详细分析结果
        const analysis = {
            maxAmplitude: maxAmplitude,
            rmsLevel: rmsLevel,
            nonZeroSamples: nonZeroSamples,
            silentSamples: silentSamples,
            totalSamples: audioData.length,
            nonZeroPercentage: (nonZeroSamples / audioData.length * 100),
            silentPercentage: (silentSamples / audioData.length * 100),
            dbLevel: dbLevel,
            qualityScore: qualityScore,
            qualityIssues: qualityIssues,
            isGoodQuality: qualityScore >= 75,
            // 添加更多诊断信息
            duration: audioData.length / 44100, // 假设44100Hz采样率
            averageAmplitude: totalEnergy / audioData.length,
            dynamicRange: maxAmplitude > 0 ? (maxAmplitude / (rmsLevel || 0.0001)) : 0
        };
        
        console.log('🔍 详细音频质量分析:', analysis);
        
        return analysis;
    }

    /**
     * 获取阿里云Token
     * @param {string} appKey - 应用密钥
     * @param {string} accessKeyId - 访问密钥ID
     * @param {string} accessKeySecret - 访问密钥Secret
     * @returns {Promise<Object>} Token结果
     */
    async getAliyunToken(appKey, accessKeyId, accessKeySecret) {
        console.log('🔄 正在获取阿里云Token...');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/get-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appKey: appKey,
                    accessKeyId: accessKeyId,
                    accessKeySecret: accessKeySecret
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Token获取成功');
                return {
                    success: true,
                    token: result.token,
                    expireTime: result.expireTime
                };
            } else {
                console.error('❌ Token获取失败:', result.error);
                return {
                    success: false,
                    error: result.error
                };
            }
            
        } catch (error) {
            console.error('❌ Token请求失败:', error);
            return {
                success: false,
                error: '网络错误：' + error.message
            };
        }
    }

    /**
     * 调用语音识别API（使用vercel_server的方式）
     * @param {Float32Array} rawAudioData - 原始音频数据
     * @param {number} originalSampleRate - 原始采样率
     * @param {string} appKey - 应用密钥
     * @param {string} accessKeyId - 访问密钥ID
     * @param {string} accessKeySecret - 访问密钥Secret
     * @returns {Promise<Object>} 识别结果
     */
    async recognizeAudio(rawAudioData, originalSampleRate, appKey, accessKeyId, accessKeySecret) {
        try {
            console.log('🔄 开始语音识别处理...');
            
            // 1. 音频质量分析
            const qualityAnalysis = this.analyzeAudioQuality(rawAudioData);
            console.log('📊 音频质量分析:', qualityAnalysis);
            
            if (!qualityAnalysis.isGoodQuality) {
                console.warn('⚠️ 音频质量较低，可能影响识别效果');
                if (qualityAnalysis.maxAmplitude < 0.001) {
                    throw new Error('音频信号过弱，请检查麦克风或重新录音');
                }
            }
            
            // 2. 获取Token
            const tokenResult = await this.getAliyunToken(appKey, accessKeyId, accessKeySecret);
            if (!tokenResult.success) {
                throw new Error('Token获取失败: ' + tokenResult.error);
            }
            
            // 3. 音频预处理 - 重采样到16kHz（阿里云API要求）
            const targetSampleRate = 16000;
            const resampledData = this.resampleAudio(rawAudioData, originalSampleRate, targetSampleRate);
            
            // 4. 转换为16位PCM格式
            const pcm16Data = this.convertFloat32ToInt16(resampledData);
            
            // 5. 转换为Uint8Array格式（API需要）
            const audioData = Array.from(new Uint8Array(pcm16Data.buffer));
            
            console.log('🎵 音频处理完成:');
            console.log('   原始采样率:', originalSampleRate);
            console.log('   目标采样率:', targetSampleRate);
            console.log('   原始样本数:', rawAudioData.length);
            console.log('   重采样后:', resampledData.length);
            console.log('   最终数据长度:', audioData.length, 'bytes');
            console.log('   音频时长:', (resampledData.length / targetSampleRate).toFixed(2), '秒');
            
            // 6. 调用识别API
            const apiUrl = `${this.apiBaseUrl}/recognize?t=${Date.now()}&v=enhanced&cb=${Math.random()}`;
            const requestData = {
                token: tokenResult.token,
                audioData: audioData,
                format: 'pcm',
                sampleRate: targetSampleRate,
                enablePunctuationPrediction: true,
                enableInverseTextNormalization: true,
                appKey: appKey,
                accessKeyId: accessKeyId,
                accessKeySecret: accessKeySecret
            };
            
            console.log('🔗 调用识别API:');
            console.log('   URL:', apiUrl);
            console.log('   数据长度:', requestData.audioData.length);
            console.log('   格式:', requestData.format);
            console.log('   采样率:', requestData.sampleRate);
            console.log('   Token:', tokenResult.token.substring(0, 8) + '...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            console.log('📥 API响应状态:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API响应错误:', errorText);
                throw new Error(`API调用失败: ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ 识别API响应:', result);
            
            if (result.success && result.result) {
                return {
                    success: true,
                    text: result.result,
                    confidence: result.confidence || 0.9,
                    audioQuality: qualityAnalysis
                };
            } else {
                throw new Error(result.error || '语音识别失败，返回空结果');
            }
            
        } catch (error) {
            console.error('❌ 语音识别处理失败:', error);
            
            // 解析具体的错误类型
            let errorMessage = error.message;
            if (error.message.includes('Token')) {
                errorMessage = '认证失败，请检查阿里云配置';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else if (error.message.includes('40020503')) {
                errorMessage = 'AppKey权限不足，请在阿里云控制台开通相应服务';
            } else if (error.message.includes('超限')) {
                errorMessage = 'API调用次数已超限，请稍后重试或升级套餐';
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error.message
            };
        }
    }

    /**
     * 从配置中获取阿里云凭据
     * @returns {Object|null} 阿里云凭据
     */
    getAliyunCredentials() {
        try {
            // 优先从简单配置获取
            if (typeof simpleConfig !== 'undefined') {
                const appKey = simpleConfig.get('appKey');
                const accessKeyId = simpleConfig.get('accessKeyId');
                const accessKeySecret = simpleConfig.get('accessKeySecret');
                
                if (appKey && accessKeyId && accessKeySecret) {
                    return { appKey, accessKeyId, accessKeySecret };
                }
            }
            
            // 从localStorage获取音频配置
            const audioConfig = localStorage.getItem('audioConfig');
            if (audioConfig) {
                const config = JSON.parse(audioConfig);
                if (config.appKey && config.accessKeyId && config.accessKeySecret) {
                    return {
                        appKey: config.appKey,
                        accessKeyId: config.accessKeyId,
                        accessKeySecret: config.accessKeySecret
                    };
                }
            }
            
            console.warn('⚠️ 未找到完整的阿里云配置');
            return null;
            
        } catch (error) {
            console.error('❌ 读取阿里云配置失败:', error);
            return null;
        }
    }

    /**
     * 便捷的录音识别方法
     * @param {Float32Array} rawAudioData - 原始音频数据
     * @param {number} originalSampleRate - 原始采样率
     * @returns {Promise<Object>} 识别结果
     */
    async recognizeFromRecording(rawAudioData, originalSampleRate) {
        const credentials = this.getAliyunCredentials();
        
        if (!credentials) {
            return {
                success: false,
                error: '未找到阿里云配置，请先完成音频识别设置'
            };
        }
        
        return await this.recognizeAudio(
            rawAudioData,
            originalSampleRate,
            credentials.appKey,
            credentials.accessKeyId,
            credentials.accessKeySecret
        );
    }
}

// 创建全局实例
window.enhancedAudioProcessor = new EnhancedAudioProcessor();
console.log('🎯 增强型音频处理器已加载');
