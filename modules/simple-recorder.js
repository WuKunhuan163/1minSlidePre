/**
 * 简单录音器 - 保持原有风格的轻量级录音功能
 */
class SimpleRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('🎤 录音已开始');
        } catch (error) {
            console.error('❌ 录音启动失败:', error);
            throw error;
        }
    }

    async stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || !this.isRecording) {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.cleanup();
                console.log('🎤 录音已停止');
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
            this.isRecording = false;
        });
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
    }
}

// 全局实例
const simpleRecorder = new SimpleRecorder();
console.log('📱 简单录音器已加载');

