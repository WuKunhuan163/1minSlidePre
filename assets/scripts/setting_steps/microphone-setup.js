/**
 * 使用新的SettingsStepManager重构的录音设备设置
 * 演示如何使用统一的步骤管理器创建录音设备设置流程
 */

// 录音设备设置管理器
class MicrophoneSetupManager {
    constructor() {
        this.settingId = 'microphone';
        this.stepManager = null;
        this.config = {
            showImportExport: true
        };
        
        // 录音测试相关变量
        this.recordingTestCompleted = false;
        this.availableDevices = [];
        this.selectedDeviceId = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        // 音量检测相关变量
        this.totalAmplitude = 0;
        this.sampleCount = 0;
        
        // 录音监控相关变量
        this.recordingCheckInterval = null;
        
        // 背景音乐音量控制相关变量
        this.originalBackgroundVolume = undefined;
        
        // 初始化步骤配置
        this.initializeSteps();
    }

    // 初始化步骤配置
    initializeSteps() {
        this.steps = [
            {
                id: 'step1',
                title: '请求麦克风权限',
                content: {
                    description: `
                        为了使用录音功能，需要获取浏览器的麦克风访问权限。
                        <br><br>
                        系统正在自动请求麦克风权限，请在浏览器弹出的权限对话框中点击"允许"。
                        <br><br>
                        权限获取成功后，将自动检测可用的音频输入设备并进入下一步。
                    `,
                    custom: () => this.generatePermissionInterface()
                },
                buttons: [
                    {
                        id: 'requestBtn',
                        text: '重新请求权限',
                        type: 'secondary',
                        onClick: () => this.requestMicrophonePermission(),
                        show: false  // 默认隐藏，只在权限失败时显示
                    }
                ],
                autoJumpCondition: () => this.validatePermissionGranted(),
                onEnter: () => this.initializePermissionStep(),
                validation: () => this.validatePermissionGranted()
            },
            {
                id: 'step2',
                title: '录音功能测试',
                content: {
                    description: `
                        测试录音功能，确保麦克风正常工作并能够录制音频。
                        <br><br>
                        <strong>测试说明：</strong><br>
                        1. 从下方选择要使用的麦克风设备<br>
                        2. 点击"开始录音"按钮开始测试<br>
                        3. 对着麦克风清晰地说话10秒钟<br>
                        4. 系统将分析录音质量并显示结果<br>
                        5. 录音测试通过后即可完成设置
                    `,
                    custom: () => this.generateRecordingTestInterface()
                },
                buttons: [
                    {
                        id: 'backBtn',
                        text: '上一步',
                        type: 'back',
                        onClick: () => this.goToPreviousStep(),
                        show: true
                    },
                    {
                        id: 'recordBtn',
                        text: '开始录音',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.toggleRecording(),
                        show: true
                    },
                    {
                        id: 'completeBtn',
                        text: '完成设置',
                        type: 'success',
                        onClick: () => this.completeSetup(),
                        show: false
                    }
                ],
                autoJumpCondition: () => this.validateRecordingTest(),
                onEnter: () => this.initializeRecordingTest(),
                validation: () => this.validateRecordingTest()
            }
        ];
    }

    // 创建设置界面
    createSetup() {
        // 创建步骤管理器实例
        this.stepManager = new SettingsStepManager({
            settingId: this.settingId,
            title: '录音设备设置',
            steps: this.steps,
            config: this.config,
            onComplete: () => this.handleSetupComplete(),
            onBack: () => this.handleBackToSettings()
        });

        // 创建overlay
        const overlay = this.stepManager.createOverlay();
        
        // 全局引用，供onclick事件使用
        window.microphoneManager = this;
        
        return overlay;
    }

    // 生成权限请求界面
    generatePermissionInterface() {
        return `
            <div class="permission-status" id="permissionStatus">
                <div class="status-item">
                    <i class='bx bx-microphone' id="micIcon"></i>
                    <span id="micStatus">等待权限请求</span>
                </div>
            </div>
            
            <div class="device-section" id="deviceSection" style="display: none;">
                <h4>检测到的音频输入设备：</h4>
                <div class="device-list" id="deviceList">
                    <!-- 设备列表将动态生成 -->
                </div>
            </div>
        `;
    }

    // 生成录音测试界面
    generateRecordingTestInterface() {
        return `
            <div class="form-group" id="deviceSelectionGroup">
                <label for="deviceSelect">选择麦克风设备：</label>
                <select id="deviceSelect" class="device-select">
                    <option value="">选择设备...</option>
                </select>
            </div>
            
            <div class="audio-test-section" id="audioTestSection">
                <!-- 使用以前的录音接口容器 -->
                <div class="transcription-container">
                    <div class="progress-container-thin">
                        <div class="progress-bar-thin" id="progressBarThin">
                            <div class="progress-fill-thin" id="progressFillThin"></div>
                        </div>
                    </div>
                    
                    <div class="waveform-container" id="waveformContainer">
                        <svg class="waveform-svg" id="waveformSvg" width="100%" height="30" viewBox="0 0 1000 30" preserveAspectRatio="none">
                            <rect class="waveform-background" x="0" y="0" width="1000" height="30" />
                            <g id="waveformBars"></g>
                            <rect class="waveform-progress-mask" id="waveformProgressMask" x="0" y="0" width="0" height="30" />
                        </svg>
                    </div>
                    
                    <div id="transcriptionResult" class="transcription-result">
                        <div class="recording-text">
                            录音测试结果将显示在此处...
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 初始化权限步骤 - 重置状态，等待用户交互
    initializePermissionStep() {
        console.log('🔄 初始化权限步骤，重置权限状态等待用户交互...');
        
        // 重置权限状态（无论之前是否有权限）
        this.permissionGranted = false;
        this.devicesDetected = false;
        
        // 更新UI显示等待状态
        const micStatus = document.getElementById('micStatus');
        const micIcon = document.getElementById('micIcon');
        const deviceSection = document.getElementById('deviceSection');
        
        if (micStatus) micStatus.textContent = '等待权限请求';
        if (micIcon) {
            micIcon.className = 'bx bx-microphone';
            micIcon.style.color = '';
        }
        if (deviceSection) deviceSection.style.display = 'none';
        
        // 显示请求权限按钮，等待用户手动点击
        this.stepManager.showButton('step1', 'requestBtn');
        
        // 更新按钮文本和状态提示
        setTimeout(() => {
            const statusElement = document.getElementById('micStatus');
            if (statusElement) {
                statusElement.textContent = '请点击下方按钮申请麦克风权限';
            }
        }, 100);
        
        console.log('✅ 权限步骤已初始化，等待用户手动申请权限');
    }

    // 请求麦克风权限
    async requestMicrophonePermission() {
        const micStatus = document.getElementById('micStatus');
        const micIcon = document.getElementById('micIcon');
        const requestBtn = document.getElementById(`${this.settingId}-step1-requestBtn`);
        const nextBtn = document.getElementById(`${this.settingId}-step1-nextBtn`);
        
        try {
            console.log('🎤 开始请求麦克风权限...');
            console.log('🌐 用户代理:', navigator.userAgent);
            console.log('🔒 协议:', window.location.protocol);
            console.log('🏠 主机:', window.location.host);
            
            // 检查浏览器支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持 getUserMedia API');
            }
            
            // 检查权限状态（如果支持）
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
                    console.log('🔍 当前麦克风权限状态:', permissionStatus.state);
                } catch (permErr) {
                    console.log('⚠️ 无法查询权限状态:', permErr.message);
                }
            }
            
            this.stepManager.showStepStatus('step1', '正在请求麦克风权限...', 'info');
            
            if (micStatus) micStatus.textContent = '正在请求权限...';
            if (requestBtn) requestBtn.disabled = true;
            
            console.log('🎤 调用 getUserMedia...');
            
            // 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('✅ 麦克风权限获取成功');
            
            // 权限获取成功
            this.permissionGranted = true;
            
            if (micStatus) micStatus.textContent = '权限已获取';
            if (micIcon) {
                micIcon.className = 'bx bx-microphone';
                micIcon.style.color = '#28a745';
            }
            
            // 停止临时流
            stream.getTracks().forEach(track => track.stop());
            
            // 检测设备
            await this.detectAudioDevices();
            
            this.stepManager.showStepStatus('step1', '麦克风权限获取成功！', 'success');
            
            // 隐藏请求按钮
            this.stepManager.hideButton('step1', 'requestBtn');
            
            // 直接调用函数A（切换函数）跳转到下一步
            setTimeout(() => {
                this.stepManager.goToNextStep();
            }, 1500); // 1.5秒后自动跳转，让用户看到成功消息
            
        } catch (error) {
            console.error('❌ 麦克风权限请求失败:', error);
            console.error('错误类型:', error.name);
            console.error('错误消息:', error.message);
            console.error('错误堆栈:', error.stack);
            
            // 使用权限助手获取详细的解决建议
            let errorMessage = '麦克风权限请求失败';
            let helpText = '';
            
            if (window.microphonePermissionHelper) {
                const advice = window.microphonePermissionHelper.getMicrophonePermissionAdvice(error);
                errorMessage = advice.title;
                helpText = '<br><br>' + window.microphonePermissionHelper.formatAdviceAsHtml(advice);
            } else {
                // 降级处理
                if (error.name === 'NotAllowedError') {
                    errorMessage = '麦克风权限被拒绝';
                    helpText = '<br><br>请在浏览器设置中允许麦克风访问，然后刷新页面重试。';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = '未检测到麦克风设备';
                    helpText = '<br><br>请确保麦克风设备已正确连接并被系统识别。';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = '浏览器不支持麦克风访问';
                    helpText = '<br><br>请使用现代浏览器并确保通过HTTPS访问。';
                }
            }
            
            // 更新UI显示更详细的错误信息
            if (micStatus) micStatus.textContent = errorMessage;
            if (micIcon) {
                micIcon.className = 'bx bx-microphone-off';
                micIcon.style.color = '#ff4444';
            }
            
            // 在权限状态区域显示详细建议
            this.showDetailedPermissionAdvice(error);
            
            this.stepManager.showStepStatus('step1', errorMessage + helpText, 'error');
            
            // 显示重新请求按钮
            this.stepManager.showButton('step1', 'requestBtn');
        }
    }

    // 检测音频输入设备
    async detectAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.filter(device => device.kind === 'audioinput');
            
            // 为显示过滤掉"Default"设备，但保留在availableDevices中供选择使用
            const displayDevices = this.availableDevices.filter(device => {
                const deviceName = device.label || '';
                return !deviceName.toLowerCase().includes('default') && deviceName.trim() !== '';
            });
            
            const deviceSection = document.getElementById('deviceSection');
            const deviceList = document.getElementById('deviceList');
            
            if (deviceSection && deviceList) {
                if (displayDevices.length > 0) {
                    deviceSection.style.display = 'block';
                    
                    let deviceHtml = '';
                    displayDevices.forEach((device, index) => {
                        const deviceName = device.label || `麦克风 ${index + 1}`;
                        deviceHtml += `
                            <div class="device-item">
                                <i class='bx bx-microphone'></i>
                                <span>${deviceName}</span>
                            </div>
                        `;
                    });
                    
                    deviceList.innerHTML = deviceHtml;
                    this.devicesDetected = true;
                } else if (this.availableDevices.length > 0) {
                    // 如果只有Default设备，显示一个通用提示
                    deviceSection.style.display = 'block';
                    deviceList.innerHTML = `
                        <div class="device-item">
                            <i class='bx bx-microphone'></i>
                            <span>系统默认麦克风设备</span>
                        </div>
                    `;
                    this.devicesDetected = true;
                } else {
                    deviceList.innerHTML = '<div class="device-item">未检测到音频输入设备</div>';
                }
            }
            
            console.log(`✅ 检测到 ${this.availableDevices.length} 个音频输入设备，显示 ${displayDevices.length} 个`);
            
        } catch (error) {
            console.error('设备检测失败:', error);
            throw error;
        }
    }

    // 验证权限已获取
    validatePermissionGranted() {
        return this.permissionGranted && this.devicesDetected;
    }

    // 跳转到下一步
    goToNextStep() {
        this.stepManager.goToStep(1);
    }

    // 初始化录音测试
    initializeRecordingTest() {
        this.recordingTestCompleted = false;
        this.isRecording = false;
        this.audioChunks = [];
        
        // 填充设备选择下拉框
        this.populateDeviceSelect();
    }

    // 填充设备选择下拉框
    populateDeviceSelect() {
        const deviceSelect = document.getElementById('deviceSelect');
        if (!deviceSelect) return;
        
        // 清空现有选项
        deviceSelect.innerHTML = '<option value="">选择设备...</option>';
        
        // 添加检测到的设备
        this.availableDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `麦克风 ${index + 1}`;
            deviceSelect.appendChild(option);
        });
        
        // 优先选择Default设备，如果没有则选择第一个设备
        if (this.availableDevices.length > 0) {
            // 查找Default设备
            const defaultDevice = this.availableDevices.find(device => {
                const deviceName = device.label || '';
                return deviceName.toLowerCase().includes('default');
            });
            
            if (defaultDevice) {
                deviceSelect.value = defaultDevice.deviceId;
                this.selectedDeviceId = defaultDevice.deviceId;
                console.log('✅ 默认选择Default设备:', defaultDevice.label);
            } else {
                deviceSelect.value = this.availableDevices[0].deviceId;
                this.selectedDeviceId = this.availableDevices[0].deviceId;
                console.log('✅ 默认选择第一个设备:', this.availableDevices[0].label);
            }
        }
        
        // 监听设备选择变化
        deviceSelect.addEventListener('change', (e) => {
            this.selectedDeviceId = e.target.value;
            console.log('🔄 设备选择已改变:', this.selectedDeviceId);
            
            // 清空录音结果和隐藏完成按钮
            this.clearRecordingResults();
        });
    }
    
    // 清空录音结果
    clearRecordingResults() {
        console.log('🧹 清空录音结果...');
        
        // 清空录音结果区域
        const transcriptionResult = document.getElementById('transcriptionResult');
        if (transcriptionResult) {
            transcriptionResult.innerHTML = `
                <div class="recording-text">
                    录音测试结果将显示在此处...
                </div>
            `;
            transcriptionResult.classList.remove('success');
        }
        
        // 移除音频播放器
        const audioTestSection = document.getElementById('audioTestSection');
        if (audioTestSection) {
            const existingAudio = audioTestSection.querySelector('.recording-audio-player');
            if (existingAudio) {
                existingAudio.remove();
                console.log('🧹 音频播放器已移除');
            }
        }
        
        // 移除下载按钮
        this.stepManager.hideButton('step2', 'downloadBtn');
        console.log('🧹 下载按钮已移除');
        
        // 清空波峰图
        const waveformBars = document.getElementById('waveformBars');
        const progressFill = document.getElementById('progressFillThin');
        const progressMask = document.getElementById('waveformProgressMask');
        
        if (waveformBars) waveformBars.innerHTML = '';
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        if (progressMask) {
            progressMask.setAttribute('width', '0');
        }
        
        // 隐藏完成按钮，显示录音按钮
        this.stepManager.hideButton('step2', 'completeBtn');
        this.stepManager.showButton('step2', 'recordBtn');
        
        // 重置录音状态和音量检测变量
        this.recordingTestCompleted = false;
        this.totalAmplitude = 0;
        this.sampleCount = 0;
        
        // 清空step-status
        this.stepManager.showStepStatus('step2', '', 'info');
        
        console.log('✅ 录音结果已清空');
    }

    // 切换录音状态
    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    // 开始录音
    async startRecording() {
        if (!this.selectedDeviceId) {
            this.stepManager.showStepStatus('step2', '请先选择麦克风设备', 'warning');
            return;
        }
        
        // 如果是重新录音，先清空之前的状态
        if (this.recordingTestCompleted) {
            console.log('🔄 重新录音，清空之前的状态...');
            this.clearRecordingResults();
        }
        
        try {
            console.log('🎤 开始录音前验证麦克风权限...');
            
            const constraints = {
                audio: {
                    deviceId: { exact: this.selectedDeviceId }
                }
            };
            
            // 再次请求麦克风权限，验证是否仍然可用
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ 麦克风权限验证成功，开始录音流程');
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;
            
            // 重置音量检测变量
            this.totalAmplitude = 0;
            this.sampleCount = 0;
            
            // 更新UI
            const recordBtn = document.getElementById(`${this.settingId}-step2-recordBtn`);
            const volumeMeter = document.getElementById('volumeMeter');
            const audioTestSection = document.getElementById('audioTestSection');
            const deviceSelect = document.getElementById('deviceSelect');
            
            if (recordBtn) recordBtn.textContent = '停止录音';
            if (volumeMeter) volumeMeter.style.display = 'flex';
            if (audioTestSection) audioTestSection.classList.add('testing');
            
            // 禁止设备选择下拉列表交互
            if (deviceSelect) {
                deviceSelect.disabled = true;
                deviceSelect.classList.add('force-no-interact');
            }
            
            this.stepManager.showStepStatus('step2', '正在录音，请清晰地说话...', 'info');
            
            // 设置录音事件
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                console.log('📹 MediaRecorder已停止');
                this.processRecording();
            };
            
            // 添加错误处理
            this.mediaRecorder.onerror = (event) => {
                console.error('❌ MediaRecorder错误:', event.error);
                this.stepManager.showStepStatus('step2', '录音过程中发生错误：' + event.error.message, 'error');
                this.isRecording = false;
            };
            
            // 监听状态变化
            this.mediaRecorder.onstart = () => {
                console.log('📹 MediaRecorder已开始录音');
            };
            
            this.mediaRecorder.onpause = () => {
                console.log('⏸️ MediaRecorder已暂停');
            };
            
            this.mediaRecorder.onresume = () => {
                console.log('▶️ MediaRecorder已恢复');
            };
            
            // 监听音频轨道状态
            stream.getAudioTracks().forEach(track => {
                track.onended = () => {
                    console.warn('⚠️ 音频轨道意外结束');
                    if (this.isRecording) {
                        this.stepManager.showStepStatus('step2', '音频轨道意外断开，录音已停止', 'warning');
                        this.stopRecording();
                    }
                };
                
                track.onmute = () => {
                    console.warn('🔇 音频轨道被静音');
                };
                
                track.onunmute = () => {
                    console.log('🔊 音频轨道取消静音');
                };
            });
            
            // 开始录音
            this.mediaRecorder.start();
            console.log('🎤 开始录音，MediaRecorder状态:', this.mediaRecorder.state);
            
            // 设置波峰图和进度条
            this.setupWaveform(stream);
            
            // 启动录音状态监控
            this.startRecordingMonitor();
            
            // 10秒后自动停止
            setTimeout(() => {
                if (this.isRecording) {
                    console.log('⏰ 录音时间到，自动停止录音');
                    this.stopRecording();
                }
            }, 10000);
            
        } catch (error) {
            console.error('❌ 录音启动失败:', error);
            
            // 检查是否是权限相关错误
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                console.log('🔄 检测到权限被撤销，回退到第一步');
                
                // 重置权限状态
                this.permissionGranted = false;
                this.devicesDetected = false;
                
                // 回退到第一步
                this.stepManager.goToStep(0);
                
                // 显示权限错误信息（复用第一步的逻辑）
                this.showPermissionError(error);
                
            } else {
                // 其他错误，显示在当前步骤
                this.stepManager.showStepStatus('step2', '录音启动失败：' + error.message, 'error');
            }
        }
    }

    // 显示权限错误信息（复用第一步的逻辑）
    showPermissionError(error) {
        const micStatus = document.getElementById('micStatus');
        const micIcon = document.getElementById('micIcon');
        
        // 使用权限助手获取详细的解决建议
        let errorMessage = '麦克风权限请求失败';
        let helpText = '';
        
        if (window.microphonePermissionHelper) {
            const advice = window.microphonePermissionHelper.getMicrophonePermissionAdvice(error);
            errorMessage = advice.title;
            helpText = '<br><br>' + window.microphonePermissionHelper.formatAdviceAsHtml(advice);
        } else {
            // 降级处理
            if (error.name === 'NotAllowedError') {
                errorMessage = '麦克风权限被拒绝';
                helpText = '<br><br>请在浏览器设置中允许麦克风访问，然后刷新页面重试。';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '未检测到麦克风设备';
                helpText = '<br><br>请确保麦克风设备已正确连接并被系统识别。';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = '浏览器不支持麦克风访问';
                helpText = '<br><br>请使用现代浏览器并确保通过HTTPS访问。';
            }
        }
        
        // 更新UI显示更详细的错误信息
        if (micStatus) micStatus.textContent = errorMessage;
        if (micIcon) {
            micIcon.className = 'bx bx-microphone-off';
            micIcon.style.color = '#ff4444';
        }
        
        // 在权限状态区域显示详细建议
        this.showDetailedPermissionAdvice(error);
        
        this.stepManager.showStepStatus('step1', errorMessage + helpText, 'error');
        
        // 显示重新请求按钮
        this.stepManager.showButton('step1', 'requestBtn');
    }

    // 在权限状态区域显示详细的权限建议
    showDetailedPermissionAdvice(error) {
        const permissionStatus = document.getElementById('permissionStatus');
        if (!permissionStatus) return;

        // 获取权限建议
        let adviceHtml = '';
        if (window.microphonePermissionHelper) {
            const advice = window.microphonePermissionHelper.getMicrophonePermissionAdvice(error);
            
            if (advice && advice.solutions && advice.solutions.length > 0) {
                // 获取第一个解决方案（最相关的）
                const primarySolution = advice.solutions[0];
                
                adviceHtml = `
                    <div class="permission-advice" style="margin-top: 15px; padding: 15px; background: #2a2a2a; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                        <div style="color: #ff6b6b; font-weight: bold; margin-bottom: 10px;">
                            <i class='bx bx-info-circle'></i> ${primarySolution.title}
                        </div>
                        <div style="color: #ccc; font-size: 13px; line-height: 1.5;">
                            ${primarySolution.steps.map((step, index) => 
                                `<div style="margin-bottom: 5px;">${index + 1}. ${step}</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
        } else {
            // 降级处理，显示基本建议
            if (error.name === 'NotAllowedError') {
                adviceHtml = `
                    <div class="permission-advice" style="margin-top: 15px; padding: 15px; background: #2a2a2a; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                        <div style="color: #ff6b6b; font-weight: bold; margin-bottom: 10px;">
                            <i class='bx bx-info-circle'></i> 解决方法
                        </div>
                        <div style="color: #ccc; font-size: 13px; line-height: 1.5;">
                            <div style="margin-bottom: 5px;">1. 点击地址栏左侧的锁形图标</div>
                            <div style="margin-bottom: 5px;">2. 找到"麦克风"选项，选择"允许"</div>
                            <div style="margin-bottom: 5px;">3. 刷新页面后重试</div>
                        </div>
                    </div>
                `;
            }
        }

        // 移除之前的建议（如果存在）
        const existingAdvice = permissionStatus.querySelector('.permission-advice');
        if (existingAdvice) {
            existingAdvice.remove();
        }

        // 添加新的建议
        if (adviceHtml) {
            permissionStatus.insertAdjacentHTML('beforeend', adviceHtml);
        }
    }

    // 停止录音
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // 停止录音监控
            this.stopRecordingMonitor();
            
            // 停止所有音频轨道
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            // 更新UI
            const recordBtn = document.getElementById(`${this.settingId}-step2-recordBtn`);
            const volumeMeter = document.getElementById('volumeMeter');
            const audioTestSection = document.getElementById('audioTestSection');
            const deviceSelect = document.getElementById('deviceSelect');
            
            if (recordBtn) recordBtn.textContent = '开始录音';
            if (volumeMeter) volumeMeter.style.display = 'none';
            if (audioTestSection) audioTestSection.classList.remove('testing');
            
            // 重新启用设备选择下拉列表交互
            if (deviceSelect) {
                deviceSelect.disabled = false;
                deviceSelect.classList.remove('force-no-interact');
            }
            
            this.stepManager.showStepStatus('step2', '正在处理录音...', 'info');
        }
    }

    // 开始音量监测
    startVolumeMonitoring(stream) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            
            analyser.fftSize = 256;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const updateVolume = () => {
                if (!this.isRecording) return;
                
                analyser.getByteFrequencyData(dataArray);
                
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                const volume = Math.round((average / 255) * 100);
                
                const volumeFill = document.getElementById('volumeFill');
                const volumeText = document.getElementById('volumeText');
                
                if (volumeFill) volumeFill.style.width = volume + '%';
                if (volumeText) volumeText.textContent = `音量: ${volume}%`;
                
                requestAnimationFrame(updateVolume);
            };
            
            updateVolume();
            
        } catch (error) {
            console.error('音量监测启动失败:', error);
        }
    }
    
    // 设置波峰图和进度条
    setupWaveform(stream) {
        try {
            const waveformSvg = document.getElementById('waveformSvg');
            const waveformBars = document.getElementById('waveformBars');
            const progressFill = document.getElementById('progressFillThin');
            const progressMask = document.getElementById('waveformProgressMask');
            
            if (!waveformSvg || !waveformBars) {
                console.error('❌ 找不到SVG音峰图元素');
                return;
            }
            
            // 创建音频上下文和ScriptProcessor
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioSource = this.audioContext.createMediaStreamSource(stream);
            
            // 使用ScriptProcessor来实时计算振幅
            const bufferSize = 4096;
            this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
            
            // 初始化变量
            const barCount = 100; // 10秒录音，每0.1秒一个峰值条
            const barWidth = 1000 / barCount;
            let waveformData = [];
            let recordingStartTime = Date.now();
            let currentAmplitude = 0; // 当前时间间隔内的峰值振幅
            
            // 清空现有的峰值条
            waveformBars.innerHTML = '';
            
            // 重置进度条和波形图到初始状态
            if (progressFill) {
                progressFill.style.transition = '';
                progressFill.style.width = '0%';
            }
            if (progressMask) {
                progressMask.style.transition = '';
                progressMask.setAttribute('width', '0');
            }
            
            // 设置音频处理回调
            this.scriptProcessor.onaudioprocess = (event) => {
                if (this.isRecording) {
                    const inputBuffer = event.inputBuffer.getChannelData(0);
                    
                    // 计算RMS振幅
                    let sum = 0;
                    for (let i = 0; i < inputBuffer.length; i++) {
                        sum += inputBuffer[i] * inputBuffer[i];
                    }
                    const rmsLevel = Math.sqrt(sum / inputBuffer.length);
                    
                    // 累计音量数据用于检测是否有声音（使用类属性）
                    this.totalAmplitude += rmsLevel;
                    this.sampleCount++;
                    
                    // 获取时间间隔内的峰值振幅
                    currentAmplitude = Math.max(currentAmplitude, rmsLevel);
                }
            };
            
            // 连接音频处理链
            audioSource.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);
            
            // 定时更新音峰图数据（每100ms采样一次）
            const waveformTimer = setInterval(() => {
                if (!this.isRecording) {
                    clearInterval(waveformTimer);
                    return;
                }
                
                // 将当前振幅转换为峰图高度 (0-25px，留5px边距)
                const height = Math.min(25, Math.max(1, currentAmplitude * 150));
                
                // 添加到峰图数据
                waveformData.push(height);
                
                // 重置当前振幅，准备下一次采样
                currentAmplitude = 0;
                
                // 渲染音峰图
                this.renderWaveform(waveformBars, waveformData, barWidth, recordingStartTime, progressFill, progressMask);
                
            }, 100); // 每100ms更新一次
            
        } catch (error) {
            console.error('波峰图设置失败:', error);
        }
    }
    
    // 渲染音峰图
    renderWaveform(waveformBars, waveformData, barWidth, recordingStartTime, progressFill, progressMask) {
        // 清空现有的峰值条
        waveformBars.innerHTML = '';
        
        // 计算当前录音进度
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        const totalBarsToShow = Math.min(100, Math.ceil(elapsed * 10)); // 每秒10个峰值条
        
        // 绘制峰值条
        for (let i = 0; i < totalBarsToShow && i < waveformData.length; i++) {
            const height = waveformData[i];
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', 'waveform-bar');
            rect.setAttribute('x', i * barWidth);
            rect.setAttribute('y', 30 - height); // 从底部开始
            rect.setAttribute('width', barWidth * 0.8); // 留一点间隙
            rect.setAttribute('height', height);
            waveformBars.appendChild(rect);
        }
        
        // 更新进度遮罩和进度条
        const progress = Math.min(100, (elapsed / 10) * 100); // 10秒
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (progressMask) {
            progressMask.setAttribute('width', (progress / 100) * 1000);
        }
    }

    // 启动录音状态监控
    startRecordingMonitor() {
        // 清除之前的监控
        this.stopRecordingMonitor();
        
        // 每500ms检查一次录音状态
        this.recordingCheckInterval = setInterval(() => {
            if (this.isRecording && this.mediaRecorder) {
                // 检查MediaRecorder状态
                if (this.mediaRecorder.state === 'inactive') {
                    console.warn('⚠️ MediaRecorder意外变为inactive状态');
                    this.isRecording = false;
                    this.stopRecordingMonitor();
                    this.stepManager.showStepStatus('step2', '录音意外停止，请重试', 'warning');
                } else if (this.mediaRecorder.state === 'paused') {
                    console.warn('⚠️ MediaRecorder被暂停');
                    // 可以选择自动恢复
                    // this.mediaRecorder.resume();
                }
                
                // 检查音频轨道状态
                const audioTracks = this.mediaRecorder.stream.getAudioTracks();
                const activeTrack = audioTracks.find(track => track.readyState === 'live');
                if (!activeTrack) {
                    console.warn('⚠️ 没有活跃的音频轨道');
                    if (this.isRecording) {
                        this.stepManager.showStepStatus('step2', '音频设备连接丢失，录音已停止', 'warning');
                        this.stopRecording();
                    }
                }
            }
        }, 500);
        
        console.log('🔍 录音状态监控已启动');
    }

    // 停止录音状态监控
    stopRecordingMonitor() {
        if (this.recordingCheckInterval) {
            clearInterval(this.recordingCheckInterval);
            this.recordingCheckInterval = null;
            console.log('🔍 录音状态监控已停止');
        }
    }

    // 处理录音
    async processRecording() {
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            
            // 检查录音音量，判断是否录音成功
            const averageAmplitude = this.sampleCount > 0 ? this.totalAmplitude / this.sampleCount : 0;
            const volumeThreshold = 0.001; // 音量阈值，低于此值认为录音失败
            
            console.log('📊 录音音量检测:', {
                总振幅: this.totalAmplitude.toFixed(6),
                采样次数: this.sampleCount,
                平均振幅: averageAmplitude.toFixed(6),
                阈值: volumeThreshold,
                录音成功: averageAmplitude >= volumeThreshold
            });
            
            if (averageAmplitude < volumeThreshold) {
                // 音量太低，录音失败
                const transcriptionResult = document.getElementById('transcriptionResult');
                if (transcriptionResult) {
                    transcriptionResult.innerHTML = `
                        <div class="recording-text" style="color: #ff6b6b;">
                            <i class='bx bx-error-circle'></i> 录音失败：未检测到有效音频信号<br>
                            <span style="color: white;">可能原因：麦克风音量过低或已静音、麦克风设备故障、录音期间未说话。请检查麦克风设置后重试。</span>
                        </div>
                    `;
                }
                
                this.stepManager.showStepStatus('step2', '录音失败：请检查麦克风设备和音量设置，确保在录音期间正常说话', 'error');
                
                // 恢复录音按钮
                const recordBtn = document.getElementById(`${this.settingId}-step2-recordBtn`);
                if (recordBtn) {
                    recordBtn.textContent = '开始录音';
                    recordBtn.disabled = false;
                    recordBtn.classList.remove('force-no-interact');
                    recordBtn.classList.add('force-interact');
                }
                return;
            }
            
            // 音量正常，继续处理录音
            console.log('✅ 录音音量检测通过，开始处理录音文件...');
            
            // 更新录音按钮状态为转换中
            const recordBtn = document.getElementById(`${this.settingId}-step2-recordBtn`);
            if (recordBtn) {
                recordBtn.textContent = '转成mp3…';
                recordBtn.disabled = true;
                recordBtn.classList.add('force-no-interact');
                recordBtn.classList.remove('force-interact');
            }
            
            // 显示录音结果（简化版，无质量评分）
            await this.showSimpleRecordingResult(audioBlob);
            
            // 录音测试完成
            this.recordingTestCompleted = true;
            this.stepManager.showStepStatus('step2', '录音测试完成！', 'success');
            
            // 显示完成按钮
            console.log('🔘 准备显示完成按钮...');
            console.log('步骤管理器存在:', !!this.stepManager);
            console.log('showButton方法存在:', typeof this.stepManager.showButton);
            
            this.stepManager.showButton('step2', 'completeBtn');
            
            // 恢复录音按钮为可重新录音状态
            if (recordBtn) {
                recordBtn.textContent = '开始录音';
                recordBtn.disabled = false;
                recordBtn.classList.remove('force-no-interact');
                recordBtn.classList.add('force-interact');
                recordBtn.style.display = 'inline-block'; // 保持显示，允许重新录音
            }
            
            console.log('✅ 完成按钮显示命令已执行');
            
            // 保存设备配置
            this.saveMicrophoneConfig();
            
        } catch (error) {
            this.stepManager.showStepStatus('step2', '录音处理失败：' + error.message, 'error');
            
            // 恢复录音按钮
            const recordBtn = document.getElementById(`${this.settingId}-step2-recordBtn`);
            if (recordBtn) {
                recordBtn.textContent = '开始录音';
                recordBtn.disabled = false;
                recordBtn.classList.remove('force-no-interact');
                recordBtn.classList.add('force-interact');
            }
        }
    }

    // 显示简化的录音结果
    async showSimpleRecordingResult(audioBlob) {
        const transcriptionResult = document.getElementById('transcriptionResult');
        const audioTestSection = document.getElementById('audioTestSection');
        
        if (transcriptionResult) {
            // 显示录音信息（简化版）
            const duration = 10; // 固定10秒录音时长
            const size = (audioBlob.size / 1024).toFixed(1); // KB
            
            // 先只显示转换状态
            transcriptionResult.innerHTML = `
                <div class="recording-text" style="margin-bottom: 10px;">
                    正在转换为MP3格式...
                </div>
            `;
            
            try {
                // 转换为MP3
                let mp3Blob;
                if (window.convertToMp3) {
                    mp3Blob = await window.convertToMp3(audioBlob);
                } else {
                    console.warn('MP3转换函数不可用，使用原始WAV文件');
                    mp3Blob = audioBlob;
                }
                
                // 创建音频URL
                const audioUrl = URL.createObjectURL(mp3Blob);
                const fileFormat = mp3Blob === audioBlob ? 'WAV' : 'MP3';
                
                // 更新显示内容
                transcriptionResult.innerHTML = `
                    <div class="recording-text" style="margin-bottom: 15px;">
                        录音时长：${duration}秒，文件大小：${size}KB
                    </div>
                `;
                
                // 在transcription-container下方添加audio元素
                this.addAudioPlayerToSection(audioTestSection, audioUrl, fileFormat.toLowerCase());
                
            } catch (error) {
                console.error('MP3转换失败:', error);
                // 转换失败，使用原始WAV文件
                const audioUrl = URL.createObjectURL(audioBlob);
                transcriptionResult.innerHTML = `
                    <div class="recording-text" style="margin-bottom: 15px;">
                        录音时长：${duration}秒，文件大小：${size}KB
                    </div>
                `;
                
                // 在transcription-container下方添加audio元素
                this.addAudioPlayerToSection(audioTestSection, audioUrl, 'wav');
            }
            
            transcriptionResult.classList.add('success');
        }
    }

    // 在audioTestSection中添加音频播放器
    addAudioPlayerToSection(audioTestSection, audioUrl, audioType) {
        if (!audioTestSection) return;
        
        // 移除之前的音频播放器（如果存在）
        const existingAudio = audioTestSection.querySelector('.recording-audio-player');
        if (existingAudio) {
            existingAudio.remove();
        }
        
        // 创建audio元素，直接放在transcription-container下方
        const audioElement = document.createElement('audio');
        audioElement.className = 'recording-audio-player';
        audioElement.controls = true;
        audioElement.preload = 'metadata';
        audioElement.style.width = '100%';
        audioElement.style.display = 'block';
        audioElement.style.marginBottom = '20px';
        audioElement.style.marginTop = '15px';
        
        const sourceElement = document.createElement('source');
        sourceElement.src = audioUrl;
        sourceElement.type = `audio/${audioType}`;
        
        audioElement.appendChild(sourceElement);
        audioElement.appendChild(document.createTextNode('您的浏览器不支持音频播放。'));
        
        // 添加播放/暂停事件监听，用于控制背景音乐
        audioElement.addEventListener('play', () => {
            this.pauseBackgroundMusic();
        });
        
        audioElement.addEventListener('pause', () => {
            this.resumeBackgroundMusic();
        });
        
        audioElement.addEventListener('ended', () => {
            this.resumeBackgroundMusic();
        });
        
        // 生成文件名
        const fileName = this.generateRecordingFileName(audioType);
        
        // 添加下载按钮到步骤管理器
        this.addDownloadButton(audioUrl, fileName);
        
        // 添加到audioTestSection的末尾
        audioTestSection.appendChild(audioElement);
        
        console.log('✅ 音频播放器和下载按钮已添加到transcription-container下方');
    }

    // 添加下载按钮到步骤管理器
    addDownloadButton(audioUrl, fileName) {
        // 移除之前的下载按钮（如果存在）
        this.stepManager.hideButton('step2', 'downloadBtn');
        
        // 添加下载按钮
        this.stepManager.addButton('step2', {
            id: 'downloadBtn',
            text: '下载录音',
            type: 'secondary',
            onClick: () => this.downloadRecording(audioUrl, fileName),
            show: true
        });
        
        console.log('✅ 下载按钮已添加到步骤按钮容器');
    }

    // 生成录音文件名
    generateRecordingFileName(audioType) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // 生成4位随机hash
        const hash = Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const dateTime = `${year}${month}${day}_${hours}${minutes}${seconds}`;
        const extension = audioType.toLowerCase();
        
        return `录音设备设置_${dateTime}_${hash}.${extension}`;
    }

    // 下载录音文件
    downloadRecording(audioUrl, fileName) {
        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log('📥 录音文件已开始下载:', fileName);
    }

    // 降低背景音乐音量
    pauseBackgroundMusic() {
        console.log('🎵 开始降低背景音乐音量...');
        
        // 查找页面中的背景音乐元素
        const backgroundAudio = document.querySelector('audio[id*="background"], audio[src*="background"], audio.background-music');
        if (backgroundAudio) {
            // 保存原始音量
            if (this.originalBackgroundVolume === undefined) {
                this.originalBackgroundVolume = backgroundAudio.volume;
                console.log('🎵 保存原始背景音乐音量:', this.originalBackgroundVolume);
            }
            
            // 将音量设置为0
            backgroundAudio.volume = 0;
            console.log('🎵 背景音乐音量已设置为0');
            
            // 更新音量进度条（如果存在）
            this.updateVolumeSlider(0);
        } else {
            console.log('🎵 未找到背景音乐元素');
            
            // 尝试通过全局变量或其他方式控制背景音乐
            if (window.setBackgroundMusicVolume && typeof window.setBackgroundMusicVolume === 'function') {
                // 保存当前音量
                if (this.originalBackgroundVolume === undefined && window.getBackgroundMusicVolume) {
                    this.originalBackgroundVolume = window.getBackgroundMusicVolume();
                    console.log('🎵 通过全局函数保存原始音量:', this.originalBackgroundVolume);
                }
                
                window.setBackgroundMusicVolume(0);
                console.log('🎵 通过全局函数设置背景音乐音量为0');
            }
        }
    }

    // 恢复背景音乐音量
    resumeBackgroundMusic() {
        console.log('🎵 开始恢复背景音乐音量...');
        
        if (this.originalBackgroundVolume === undefined) {
            console.log('🎵 没有保存的原始音量，跳过恢复');
            return;
        }
        
        // 查找页面中的背景音乐元素
        const backgroundAudio = document.querySelector('audio[id*="background"], audio[src*="background"], audio.background-music');
        if (backgroundAudio) {
            // 恢复原始音量
            backgroundAudio.volume = this.originalBackgroundVolume;
            console.log('🎵 背景音乐音量已恢复为:', this.originalBackgroundVolume);
            
            // 更新音量进度条
            this.updateVolumeSlider(this.originalBackgroundVolume);
        } else {
            console.log('🎵 未找到背景音乐元素');
            
            // 尝试通过全局变量恢复
            if (window.setBackgroundMusicVolume && typeof window.setBackgroundMusicVolume === 'function') {
                window.setBackgroundMusicVolume(this.originalBackgroundVolume);
                console.log('🎵 通过全局函数恢复背景音乐音量为:', this.originalBackgroundVolume);
            }
        }
        
        // 清除保存的音量
        this.originalBackgroundVolume = undefined;
    }

    // 更新音量进度条
    updateVolumeSlider(volume) {
        console.log('🎵 尝试更新音量进度条为:', volume);
        
        // 查找音量滑块
        const volumeSliders = document.querySelectorAll('input[type="range"].inline-volume-slider, input[type="range"].volume-slider');
        volumeSliders.forEach(slider => {
            if (slider) {
                slider.value = volume;
                // 触发change事件以更新UI
                slider.dispatchEvent(new Event('input'));
                console.log('🎵 音量滑块已更新为:', volume);
            }
        });
        
        // 也尝试通过全局函数更新
        if (window.updateVolumeSlider && typeof window.updateVolumeSlider === 'function') {
            window.updateVolumeSlider(volume);
            console.log('🎵 通过全局函数更新音量滑块');
        }
    }

    // 分析录音质量
    async analyzeRecordingQuality(audioBlob) {
        // 模拟音质分析
        return new Promise((resolve) => {
            setTimeout(() => {
                const duration = audioBlob.size / (16000 * 2); // 估算时长
                const score = duration > 3 ? Math.min(90, 60 + Math.random() * 30) : 50;
                
                resolve({
                    score: Math.round(score),
                    duration: Math.round(duration * 10) / 10,
                    size: audioBlob.size,
                    quality: score >= 80 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '一般' : '较差'
                });
            }, 1500);
        });
    }

    // 显示录音结果
    showRecordingResult(audioBlob, quality) {
        const recordingResult = document.getElementById('recordingResult');
        const resultInfo = document.getElementById('resultInfo');
        const recordingPlayback = document.getElementById('recordingPlayback');
        
        if (recordingResult) recordingResult.style.display = 'block';
        
        if (resultInfo) {
            resultInfo.innerHTML = `
                <div class="quality-score ${quality.score >= 70 ? 'good' : 'poor'}">
                    <strong>质量评分：${quality.score}/100 (${quality.quality})</strong>
                </div>
                <div class="recording-stats">
                    <div>录音时长：${quality.duration}秒</div>
                    <div>文件大小：${(quality.size / 1024).toFixed(1)}KB</div>
                </div>
            `;
        }
        
        if (recordingPlayback) {
            const audioUrl = URL.createObjectURL(audioBlob);
            recordingPlayback.src = audioUrl;
        }
    }

    // 保存麦克风配置
    saveMicrophoneConfig() {
        const selectedDevice = this.availableDevices.find(d => d.deviceId === this.selectedDeviceId);
        
        const config = {
            enabled: true,
            selectedDeviceId: this.selectedDeviceId,
            selectedDeviceName: selectedDevice?.label || 'Unknown Device',
            timestamp: Date.now()
        };
        
        localStorage.setItem('microphoneConfig', JSON.stringify(config));
        console.log('✅ 麦克风配置已保存', config);
        
        // 注册配置显示字段
        this.registerConfigFields(config);
    }
    
    // 注册配置显示字段
    registerConfigFields(config) {
        const fields = [
            {
                name: '已选择设备',
                value: config.selectedDeviceName,
                type: 'text', // 'text' | 'password'
                copyable: false
            },
            {
                name: '设备状态',
                value: config.enabled ? '已启用' : '已禁用',
                type: 'text',
                copyable: false
            },
            {
                name: '配置时间',
                value: new Date(config.timestamp).toLocaleString(),
                type: 'text',
                copyable: false
            }
        ];
        
        // 通知设置管理器更新显示字段
        if (window.updateSettingFields) {
            window.updateSettingFields('microphone', fields);
        }
    }

    // 验证录音测试
    validateRecordingTest() {
        return this.recordingTestCompleted;
    }

    // 完成设置
    completeSetup() {
        // 标记设置为已测试
        if (typeof simpleConfig !== 'undefined' && simpleConfig.markSettingTested) {
            simpleConfig.markSettingTested('microphone');
        }
        
        console.log('✅ 录音设备设置完成');
        
        // 刷新主设置页面显示
        if (window.refreshSettingsDisplay) {
            window.refreshSettingsDisplay();
        }
        
        this.stepManager.completeSetup();
    }

    // 返回上一步
    goToPreviousStep() {
        const currentIndex = this.stepManager.currentStepIndex;
        if (currentIndex > 0) {
            this.stepManager.goToStep(currentIndex - 1);
        }
    }

    // 处理设置完成
    handleSetupComplete() {
        console.log('✅ 录音设备设置完成');
        
        // 刷新主设置页面显示
        if (window.refreshSettingsDisplay) {
            window.refreshSettingsDisplay();
        }
    }

    // 处理返回设置菜单
    handleBackToSettings() {
        // 创建新的设置overlay
        const newSettingsOverlay = createSettingsOverlay();
        setupSettingsOverlayEvents(newSettingsOverlay);
        
        // 使用overlay管理器切换
        if (window.overlayManager) {
            window.overlayManager.switchToOverlay(newSettingsOverlay);
        }
    }

    // 导入配置
    importConfig() {
        console.log('导入麦克风配置');
    }

    // 导出配置
    exportConfig() {
        console.log('导出麦克风配置');
    }
}

// 创建全局实例
window.MicrophoneSetupManager = MicrophoneSetupManager;

// 创建重构后的录音设备设置界面函数
window.createMicrophoneSetupOverlayRefactored = () => {
    const manager = new MicrophoneSetupManager();
    return manager.createSetup();
};

console.log('🎤 重构后的录音设备设置管理器已加载');
