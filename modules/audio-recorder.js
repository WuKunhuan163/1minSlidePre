/**
 * 增强型录音器 - 基于vercel_server的高质量音频处理
 * 使用Web Audio API获得更好的录音质量和识别效果
 */
class EnhancedRecorder {
    constructor() {
        // 录音相关变量
        this.mediaStream = null;
        this.audioContext = null;
        this.audioWorkletNode = null;
        this.audioSource = null;
        this.audioBuffer = [];
        this.isRecording = false;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.lastRecordingBlob = null;
        this.rawAudioData = null; // 保存原始PCM数据
        
        // 音轨峰图相关
        this.waveformData = [];
        this.maxWaveformBars = 300; // 30秒录音，每0.1秒一个峰值条
        this.waveformUpdateInterval = 100; // 每100ms更新一次峰值图
        this.currentAmplitude = 0; // 当前振幅
        this.waveformTimer = null;
        
        // 常量配置
        this.BUFFER_SIZE = 4096;
        this.MAX_RECORDING_TIME = 30; // 30秒
        this.SAMPLE_RATE = 44100; // 使用标准采样率，更好的兼容性
        
        // 回调函数
        this.onRecordingComplete = null;
        this.onError = null;
    }

    /**
     * 开始录音
     * @returns {Promise<boolean>} 是否成功开始
     */
    async startRecording() {
        if (this.isRecording) {
            console.log('录音已在进行中');
            return false;
        }

        try {
            // 录音前暂停背景音乐（使用统一API）
            if (window.BackgroundMusicVolumeController) {
                try {
                    window.BackgroundMusicVolumeController.pause(true);
                    await new Promise(resolve => setTimeout(resolve, 200)); // 等待200ms确保生效
                    console.log('🎵 增强录音器：已通过统一API暂停背景音乐');
                } catch (error) {
                    console.warn('⚠️ 增强录音器：通过统一API暂停背景音乐时出错:', error);
                }
            } else {
                console.warn('⚠️ 增强录音器：BackgroundMusicVolumeController不可用');
            }
            
            // 获取录音设备配置
            const microphoneConfig = this.getMicrophoneConfig();
            let audioConstraints = {
                sampleRate: { ideal: this.SAMPLE_RATE },
                channelCount: { ideal: 1 },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            };
            
            // 如果有配置的设备ID，使用特定设备
            if (microphoneConfig && microphoneConfig.selectedDeviceId && microphoneConfig.enabled) {
                audioConstraints.deviceId = { exact: microphoneConfig.selectedDeviceId };
                console.log('🎤 使用配置的录音设备:', microphoneConfig.selectedDeviceName);
            } else {
                console.log('🎤 使用默认录音设备');
            }
            
            // 1. 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
            });
            
            // 保存流，以便后续关闭
            this.mediaStream = stream;

            // 2. 设置独立的 Web Audio API（避免与背景音乐冲突）
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ 
                sampleRate: this.SAMPLE_RATE,
                latencyHint: 'interactive' // 优化延迟
            });
            console.log('🎵 AudioContext创建完成，采样率:', this.audioContext.sampleRate);

            // 检测协议并选择合适的音频处理方式
            if (location.protocol === 'file:') {
                console.log('🔧 检测到file://协议，使用ScriptProcessor作为fallback');
                // 使用ScriptProcessor作为fallback（适用于file://协议）
                this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
                this.useScriptProcessor = true;
            } else {
                console.log('🔧 使用AudioWorklet处理器');
                // 创建内联AudioWorklet处理器
                const processorCode = `
                class EnhancedAudioProcessor extends AudioWorkletProcessor {
                    constructor() {
                        super();
                        this.bufferSize = 4096;
                        this.buffer = [];
                        this.bufferLength = 0;
                    }

                    process(inputs, outputs, parameters) {
                        const input = inputs[0];
                        
                        if (input.length > 0) {
                            const inputChannel = input[0]; // 获取第一个声道
                            
                            // 检查音频信号强度
                            let maxAmplitude = 0;
                            let rmsLevel = 0;
                            
                            for (let i = 0; i < inputChannel.length; i++) {
                                const sample = inputChannel[i];
                                const abs = Math.abs(sample);
                                if (abs > maxAmplitude) {
                                    maxAmplitude = abs;
                                }
                                rmsLevel += sample * sample;
                            }
                            rmsLevel = Math.sqrt(rmsLevel / inputChannel.length);

                            // 将数据复制并存入缓冲区
                            const audioData = new Float32Array(inputChannel.length);
                            audioData.set(inputChannel);
                            
                            // 发送音频数据到主线程
                            this.port.postMessage({
                                type: 'audioData',
                                data: audioData,
                                maxAmplitude: maxAmplitude,
                                rmsLevel: rmsLevel
                            });

                            // 显示音频信号监控（每50个块显示一次）
                            this.bufferLength++;
                            if (this.bufferLength % 50 === 0) {
                                const dbLevel = rmsLevel > 0 ? 20 * Math.log10(rmsLevel) : -Infinity;
                                this.port.postMessage({
                                    type: 'audioLevel',
                                    bufferCount: this.bufferLength,
                                    maxAmplitude: maxAmplitude,
                                    rmsLevel: rmsLevel,
                                    dbLevel: dbLevel,
                                    duration: (this.bufferLength * inputChannel.length / sampleRate).toFixed(1)
                                });
                            }
                        }

                        return true; // 保持处理器活跃
                    }
                }

                registerProcessor('audio-processor', EnhancedAudioProcessor);
                `;
                
                // 创建Blob URL并加载AudioWorklet
                const blob = new Blob([processorCode], { type: 'application/javascript' });
                const processorUrl = URL.createObjectURL(blob);
                
                try {
                    await this.audioContext.audioWorklet.addModule(processorUrl);
                    // 创建AudioWorkletNode
                    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
                    this.useScriptProcessor = false;
                    URL.revokeObjectURL(processorUrl); // 清理Blob URL
                } catch (error) {
                    console.warn('AudioWorklet加载失败，回退到ScriptProcessor:', error);
                    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
                    this.useScriptProcessor = true;
                    URL.revokeObjectURL(processorUrl);
                }
            }
            
            // 创建一个音频源
            this.audioSource = this.audioContext.createMediaStreamSource(stream);

            // 清空之前的录音数据
            this.audioBuffer = [];
            console.log('📝 音频缓冲区已清空');
            
            // 初始化音轨峰图
            this.initWaveform();
            
            // 启动峰值图定时更新
            this.startWaveformTimer();

            // 根据处理器类型设置音频处理
            if (this.useScriptProcessor) {
                // ScriptProcessor模式（file://协议fallback）
                this.scriptProcessor.onaudioprocess = (event) => {
                    const inputBuffer = event.inputBuffer.getChannelData(0);
                    const outputBuffer = event.outputBuffer.getChannelData(0);
                    
                    // 复制音频数据
                    this.audioBuffer.push(new Float32Array(inputBuffer));
                    
                    // 计算音量
                    let sum = 0;
                    for (let i = 0; i < inputBuffer.length; i++) {
                        sum += inputBuffer[i] * inputBuffer[i];
                        outputBuffer[i] = inputBuffer[i]; // 透传音频
                    }
                    const rmsLevel = Math.sqrt(sum / inputBuffer.length);
                    this.currentAmplitude = Math.max(this.currentAmplitude, rmsLevel);
                };
            } else {
                // AudioWorklet模式（正常HTTP协议）
                this.audioWorkletNode.port.onmessage = (event) => {
                    const { type, data, maxAmplitude, rmsLevel, bufferCount, dbLevel, duration } = event.data;
                    
                    if (type === 'audioData') {
                        this.audioBuffer.push(new Float32Array(data));
                    } else if (type === 'audioLevel') {
                        this.currentAmplitude = Math.max(this.currentAmplitude, maxAmplitude);
                    }
                };
            }

            // 根据处理器类型连接音频节点（使用静音GainNode避免回声）
            if (this.useScriptProcessor) {
                // ScriptProcessor需要连接到destination才能工作，但使用静音GainNode避免回声
                this.silentGain = this.audioContext.createGain();
                this.silentGain.gain.value = 0; // 设置音量为0，避免播放声音
                
                this.audioSource.connect(this.scriptProcessor);
                this.scriptProcessor.connect(this.silentGain);
                this.silentGain.connect(this.audioContext.destination);
            } else {
                // AudioWorklet模式不需要连接到destination
                this.audioSource.connect(this.audioWorkletNode);
                // AudioWorklet不需要连接destination就能工作
            }
            
            console.log('🔗 音频节点连接完成');
            
            // 确保AudioContext处于running状态
            if (this.audioContext.state === 'suspended') {
                console.log('🔄 AudioContext被暂停，尝试恢复...');
                await this.audioContext.resume();
                console.log('✅ AudioContext状态:', this.audioContext.state);
            }

            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // 设置自动停止
            this.recordingTimer = setTimeout(async () => {
                if (this.isRecording) {
                    const audioBlob = await this.stopRecording();
                    // 触发自动停止回调
                    if (this.onRecordingComplete) {
                        this.onRecordingComplete(audioBlob, this.rawAudioData);
                    }
                }
            }, this.MAX_RECORDING_TIME * 1000);
            
            console.log('🔴 增强型录音开始 (使用 Web Audio API)');
            return true;
            
        } catch (error) {
            console.error('❌ 录音启动失败:', error);
            
            // 清理资源
            this.cleanup();
            
            let errorMessage = '录音启动失败';
            if (error.name === 'NotAllowedError') {
                errorMessage = '麦克风权限被拒绝，请允许浏览器访问麦克风';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '未找到麦克风设备，请检查麦克风连接';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = '浏览器不支持录音功能，请使用现代浏览器';
            }
            
            if (this.onError) {
                this.onError(new Error(errorMessage));
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * 停止录音
     * @returns {Promise<Blob>} 录音的MP3 Blob
     */
    async stopRecording() {
        if (!this.isRecording) {
            return null;
        }
        
        try {
            this.isRecording = false;
            if (this.recordingTimer) {
                clearTimeout(this.recordingTimer);
                this.recordingTimer = null;
            }
            if (this.waveformTimer) {
                clearInterval(this.waveformTimer);
                this.waveformTimer = null;
            }

            // 关键：断开Web Audio API连接
            if (this.audioSource) {
                this.audioSource.disconnect();
                this.audioSource = null;
            }
            if (this.audioWorkletNode) {
                this.audioWorkletNode.disconnect();
                this.audioWorkletNode = null;
            }
            if (this.scriptProcessor) {
                this.scriptProcessor.disconnect();
                this.scriptProcessor = null;
            }
            if (this.silentGain) {
                this.silentGain.disconnect();
                this.silentGain = null;
            }
            
            // 关键：关闭麦克风轨道
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => {
                    track.stop();
                });
                this.mediaStream = null;
            }
            
            if (this.audioBuffer.length === 0) {
                throw new Error('没有收集到音频数据');
            }

            // 组合所有音频数据块
            const totalLength = this.audioBuffer.reduce((sum, buffer) => sum + buffer.length, 0);
            const mergedBuffer = this.mergeBuffers(this.audioBuffer, totalLength);
            
            // 保存原始PCM数据供语音识别使用
            this.rawAudioData = new Float32Array(mergedBuffer);
            
            // 分析整体音频质量
            const audioAnalysis = this.analyzeAudio(mergedBuffer);
            if (audioAnalysis.maxAmplitude < 0.001) {
                console.warn('⚠️ 警告：录音数据振幅极低，可能是静音或麦克风问题');
            }

            // 创建WAV格式的Blob（用于播放和下载）
            const wavBlob = this.createWavBlob(mergedBuffer);
            this.lastRecordingBlob = wavBlob;
            console.log('✅ WAV编码完成，文件大小:', (wavBlob.size / 1024).toFixed(2), 'KB');
            
            // 关闭AudioContext
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            return wavBlob;
            
        } catch (error) {
            console.error('❌ 停止录音失败:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * 合并音频缓冲区
     * @param {Float32Array[]} bufferArray - 音频缓冲区数组
     * @param {number} totalLength - 总长度
     * @returns {Float32Array} 合并后的音频数据
     */
    mergeBuffers(bufferArray, totalLength) {
        const result = new Float32Array(totalLength);
        let offset = 0;
        for (let i = 0; i < bufferArray.length; i++) {
            result.set(bufferArray[i], offset);
            offset += bufferArray[i].length;
        }
        return result;
    }

    /**
     * 分析音频数据质量
     * @param {Float32Array} audioData - 音频数据
     * @returns {Object} 分析结果
     */
    analyzeAudio(audioData) {
        let maxAmplitude = 0;
        let rmsLevel = 0;
        let nonZeroSamples = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            const abs = Math.abs(audioData[i]);
            if (abs > maxAmplitude) {
                maxAmplitude = abs;
            }
            if (abs > 0.0001) { // 忽略极小的噪声
                nonZeroSamples++;
            }
            rmsLevel += audioData[i] * audioData[i];
        }
        rmsLevel = Math.sqrt(rmsLevel / audioData.length);
        
        return {
            maxAmplitude: maxAmplitude,
            rmsLevel: rmsLevel,
            nonZeroSamples: nonZeroSamples,
            totalSamples: audioData.length,
            nonZeroPercentage: (nonZeroSamples / audioData.length * 100),
            dbLevel: rmsLevel > 0 ? (20 * Math.log10(rmsLevel)) : -Infinity,
            duration: audioData.length / (this.audioContext ? this.audioContext.sampleRate : this.SAMPLE_RATE)
        };
    }

    /**
     * 创建WAV格式的Blob
     * @param {Float32Array} pcmData - PCM数据
     * @returns {Blob} WAV Blob
     */
    createWavBlob(pcmData) {
        const sampleRate = this.audioContext ? this.audioContext.sampleRate : this.SAMPLE_RATE;
        const numChannels = 1;
        const bitsPerSample = 16;
        
        // 转换为16位PCM
        const int16Data = new Int16Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            const sample = Math.max(-1, Math.min(1, pcmData[i]));
            int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        
        // 创建WAV文件头
        const buffer = new ArrayBuffer(44 + int16Data.length * 2);
        const view = new DataView(buffer);
        
        // WAV文件头
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + int16Data.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
        view.setUint16(32, numChannels * bitsPerSample / 8, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, int16Data.length * 2, true);
        
        // 写入音频数据
        const int16Array = new Int16Array(buffer, 44);
        int16Array.set(int16Data);
        
        return new Blob([buffer], { type: 'audio/wav' });
    }

    /**
     * 获取最后一次录音的Blob
     * @returns {Blob|null} 录音Blob
     */
    getLastRecording() {
        return this.lastRecordingBlob;
    }

    /**
     * 获取原始PCM音频数据（用于语音识别）
     * @returns {Float32Array|null} 原始音频数据
     */
    getRawAudioData() {
        return this.rawAudioData;
    }

    /**
     * 获取麦克风配置
     */
    getMicrophoneConfig() {
        try {
            const config = localStorage.getItem('microphoneConfig');
            return config ? JSON.parse(config) : null;
        } catch (error) {
            console.warn('⚠️ 无法读取麦克风配置:', error);
            return null;
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }
        if (this.waveformTimer) {
            clearInterval(this.waveformTimer);
            this.waveformTimer = null;
        }
        this.audioSource = null;
        this.audioWorkletNode = null;
        this.audioBuffer = [];
        this.rawAudioData = null;
        this.isRecording = false;
        this.clearWaveform();
    }

    /**
     * 检查是否正在录音
     * @returns {boolean} 是否正在录音
     */
    getIsRecording() {
        return this.isRecording;
    }

    /**
     * 基于定时器更新音轨峰图
     */
    updateWaveformOnTimer() {
        if (!this.isRecording) return;
        
        // 将当前振幅转换为峰图高度 (0-25px，留5px边距)
        const height = Math.min(25, Math.max(1, this.currentAmplitude * 150));
        
        // 添加到峰图数据
        this.waveformData.push(height);
        
        // 重置当前振幅，准备下一次采样
        this.currentAmplitude = 0;
        
        // 更新SVG显示
        this.renderWaveform();
    }

    /**
     * 渲染音轨峰图SVG
     */
    renderWaveform() {
        const waveformBars = document.getElementById('waveformBars');
        if (!waveformBars) return;
        
        // 清空现有的峰值条
        waveformBars.innerHTML = '';
        
        // 计算当前录音进度
        const elapsed = this.isRecording ? (Date.now() - this.recordingStartTime) / 1000 : this.MAX_RECORDING_TIME;
        const totalBarsToShow = Math.min(this.maxWaveformBars, Math.ceil(elapsed * 10)); // 每秒10个峰值条
        
        // 计算每个峰值条的宽度
        const barWidth = 1000 / this.maxWaveformBars; // SVG viewBox宽度为1000
        
        // 绘制峰值条（从最新的数据开始，向前显示）
        const startIndex = Math.max(0, this.waveformData.length - totalBarsToShow);
        for (let i = 0; i < totalBarsToShow && i < this.waveformData.length; i++) {
            const dataIndex = startIndex + i;
            if (dataIndex < this.waveformData.length) {
                const height = this.waveformData[dataIndex];
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('class', 'waveform-bar');
                rect.setAttribute('x', i * barWidth);
                rect.setAttribute('y', 30 - height); // 从底部开始
                rect.setAttribute('width', barWidth * 0.8); // 留一点间隙
                rect.setAttribute('height', height);
                waveformBars.appendChild(rect);
            }
        }
        
        // 更新进度遮罩
        this.updateWaveformProgress();
    }

    /**
     * 更新音轨峰图的进度遮罩
     */
    updateWaveformProgress() {
        const progressMask = document.getElementById('waveformProgressMask');
        if (!progressMask || !this.isRecording) return;
        
        // 计算进度百分比
        const elapsed = Date.now() - this.recordingStartTime;
        const progress = Math.min(100, (elapsed / (this.MAX_RECORDING_TIME * 1000)) * 100);
        
        // 更新遮罩宽度
        progressMask.setAttribute('width', (progress / 100) * 1000);
    }

    /**
     * 初始化音轨峰图
     */
    initWaveform() {
        this.waveformData = [];
        const waveformBars = document.getElementById('waveformBars');
        if (waveformBars) {
            waveformBars.innerHTML = '';
        }
        const progressMask = document.getElementById('waveformProgressMask');
        if (progressMask) {
            progressMask.setAttribute('width', '0');
        }
    }

    /**
     * 启动音轨峰图定时器
     */
    startWaveformTimer() {
        this.waveformTimer = setInterval(() => {
            this.updateWaveformOnTimer();
        }, this.waveformUpdateInterval);
    }

    /**
     * 清理音轨峰图
     */
    clearWaveform() {
        this.waveformData = [];
        this.currentAmplitude = 0;
        const waveformBars = document.getElementById('waveformBars');
        if (waveformBars) {
            waveformBars.innerHTML = '';
        }
        const progressMask = document.getElementById('waveformProgressMask');
        if (progressMask) {
            progressMask.setAttribute('width', '0');
        }
    }
}

// 创建全局实例
window.enhancedRecorder = new EnhancedRecorder();
console.log('🎤 增强型录音器已加载');
