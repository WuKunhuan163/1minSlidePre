/**
 * 简化录制器 - 基于工作版本optimized-webm-converter
 * 直接实现录制功能，不使用复杂的分层架构
 */

class SimpleRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.stream = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingTimer = null;
        this.recordingSeconds = 0;
        this.recordingStartTime = 0;
        this.actualRecordingDuration = 0;
        
        // 回调函数
        this.onLog = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    // 初始化摄像头
    async initCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true 
            });
            
            if (this.onLog) this.onLog('摄像头初始化成功');
            return this.stream;
            
        } catch (error) {
            if (this.onLog) this.onLog(`摄像头初始化失败: ${error.message}`);
            throw error;
        }
    }

    // 开始录制
    startRecording() {
        if (!this.stream) {
            throw new Error('请先初始化摄像头');
        }
        
        if (this.isRecording) {
            throw new Error('录制已在进行中');
        }

        this.recordedChunks = [];
        this.isRecording = true;
        this.recordingSeconds = 0;
        this.recordingStartTime = Date.now();
        this.actualRecordingDuration = 0;
        
        if (this.onLog) this.onLog('开始录制...');

        // 开始录制计时器
        this.recordingTimer = setInterval(() => {
            this.recordingSeconds++;
            if (this.onProgress) {
                this.onProgress({
                    type: 'recording',
                    seconds: this.recordingSeconds,
                    remaining: Math.max(0, 300 - this.recordingSeconds) // 5分钟最大时长
                });
            }
        }, 1000);

        // 选择MIME类型
        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            // 停止计时器
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }
            
            // 计算精确的录制时长
            this.actualRecordingDuration = (Date.now() - this.recordingStartTime) / 1000;
            if (this.onLog) this.onLog(`录制时长: ${this.actualRecordingDuration.toFixed(2)}秒`);

            const webmBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
            
            if (this.onLog) this.onLog(`录制完成，文件大小: ${(webmBlob.size / 1024 / 1024).toFixed(2)}MB`);
            
            if (this.onComplete) {
                this.onComplete({
                    blob: webmBlob,
                    duration: this.actualRecordingDuration,
                    size: webmBlob.size
                });
            }
        };

        this.mediaRecorder.onerror = (error) => {
            if (this.onError) {
                this.onError(error);
            }
        };

        this.mediaRecorder.start();
        
        // 5分钟后自动停止
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
                if (this.onLog) this.onLog('已达到最大录制时长(5分钟)，自动停止录制');
            }
        }, 300000);
    }

    // 停止录制
    stopRecording() {
        if (!this.isRecording) {
            return;
        }
        
        // 检查是否录制时间不足1秒
        if (this.recordingSeconds < 1) {
            if (this.onLog) this.onLog('⚠️ 录制时间不足1秒，请稍等...');
            return;
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        this.isRecording = false;
    }

    // 关闭摄像头
    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                if (this.onLog) this.onLog(`关闭 ${track.kind} 轨道`);
            });
            this.stream = null;
            if (this.onLog) this.onLog('摄像头已关闭');
        }
        
        // 重置录制状态
        this.isRecording = false;
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    // 获取状态
    getStatus() {
        return {
            isRecording: this.isRecording,
            hasCamera: !!this.stream,
            recordingSeconds: this.recordingSeconds,
            actualDuration: this.actualRecordingDuration
        };
    }

    // 销毁
    destroy() {
        this.stopRecording();
        this.closeCamera();
        this.onLog = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }
}

export default SimpleRecorder;

