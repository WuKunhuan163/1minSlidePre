/**
 * 录音设备设置详细界面 - 基于audio-setup.js的步骤风格，适应黑白紫色主题
 */

// 创建录音设备设置详细界面
const createMicrophoneSetupOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'slides-overlay'; // 复用PPT页面的样式
    
    overlay.innerHTML = `
        <div class="slides-header">
            <button class="back-button">
                <i class='bx bx-arrow-back'></i>
            </button>
            <h2>录音设备设置</h2>
            <!-- 导入导出设置移到header -->
            <div class="config-actions">
                <button class="rect-button btn btn-import" onclick="importMicrophoneConfig()">导入设置</button>
                <button class="rect-button btn btn-export" onclick="exportMicrophoneConfig()">导出设置</button>
            </div>
        </div>
        
        <div class="setup-container">
            <div class="setup-flow">
                <!-- Step 1: 请求麦克风权限 -->
                <div class="setup-step visible current-step" id="mic-step1">
                    <div class="step-circle pending" id="mic-step1-circle">1</div>
                    <div class="step-line" id="mic-step1-line"></div>
                    <div class="step-content" id="mic-step1-content">
                        <div class="mobile-step-indicator">第1/2步</div>
                        <div class="step-title">请求麦克风权限</div>
                        <div class="step-description">
                            为了使用录音功能，需要获取浏览器的麦克风访问权限。
                            <br><br>
                            <strong>操作说明：</strong><br>
                            1. 点击下方的"请求麦克风权限"按钮<br>
                            2. 浏览器会弹出权限请求对话框<br>
                            3. 点击"允许"授予麦克风访问权限<br>
                            4. 系统将自动检测可用的音频输入设备
                        </div>
                        
                        <!-- 权限状态显示 -->
                        <div class="permission-status" id="permissionStatus">
                            <div class="status-item">
                                <i class='bx bx-microphone' id="micIcon"></i>
                                <span id="micStatus">等待权限请求</span>
                            </div>
                        </div>
                        
                        <!-- 设备列表（权限获取后显示） -->
                        <div class="device-section" id="deviceSection" style="display: none;">
                            <h4>检测到的音频输入设备：</h4>
                            <div class="device-list" id="deviceList">
                                <!-- 设备列表将动态生成 -->
                            </div>
                        </div>
                        
                        <button class="btn btn-primary normal-button" id="requestPermissionButton" onclick="requestMicrophonePermission()">
                            请求麦克风权限
                        </button>
                        <button class="btn btn-primary normal-button" id="nextToStep2Button" onclick="goToStep2()" style="display: none;">
                            下一步
                        </button>
                        
                        <!-- 状态显示 -->
                        <div id="mic-step1-status" class="step-status"></div>
                    </div>
                </div>

                <!-- Step 2: 录音测试 -->
                <div class="setup-step pending" id="mic-step2">
                    <div class="step-circle pending" id="mic-step2-circle">2</div>
                    <div class="step-content" id="mic-step2-content">
                        <div class="mobile-step-indicator">第2/2步</div>
                        <div class="step-title">录音功能测试</div>
                        <div class="step-description">
                            测试录音功能，确保麦克风正常工作并能够录制音频。
                            <br><br>
                            <strong>测试说明：</strong><br>
                            1. 点击"开始录音"按钮开始测试<br>
                            2. 对着麦克风清晰地说话10秒钟<br>
                            3. 系统将分析录音质量并显示结果<br>
                            4. 录音测试通过后即可完成设置
                        </div>
                        
                        <!-- 录音接口容器 -->
                        <div id="recordingTestContainer"></div>
                        
                        <button class="btn btn-back normal-button" onclick="goBackToStep1()">上一步</button>
                        <button class="btn btn-primary normal-button" id="startRecordingTestButton" onclick="startRecordingTest()">
                            开始录音
                        </button>
                        <button class="btn btn-success normal-button" id="completeMicSetupButton" onclick="completeMicrophoneSetup()" style="display: none;">
                            完成设置
                        </button>
                        
                        <!-- 状态显示 -->
                        <div id="mic-step2-status" class="step-status"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    
    // 设置返回按钮事件
    const backButton = overlay.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log('🔙 从录音设备设置返回');
            overlay.remove();
            // 返回到设置页面
            const settingsOverlay = createSettingsOverlay();
            setupSettingsOverlayEvents(settingsOverlay);
            // 刷新设置状态
            refreshSettingsDisplay();
        });
    }
    
    return overlay;
};

// 录音设备设置相关变量
let micSetupStream = null;
let detectedDevices = [];
let recordingInterface = null;

// 请求麦克风权限
const requestMicrophonePermission = async () => {
    console.log('🎤 请求麦克风权限...');
    
    const requestButton = document.getElementById('requestPermissionButton');
    const micIcon = document.getElementById('micIcon');
    const micStatus = document.getElementById('micStatus');
    const deviceSection = document.getElementById('deviceSection');
    const completeButton = document.getElementById('completeMicSetupButton');
    const statusEl = document.getElementById('mic-step1-status');
    
    if (!requestButton || !micIcon || !micStatus) return;
    
    try {
        // 更新UI状态
        requestButton.disabled = true;
        requestButton.textContent = '请求中...';
        micStatus.textContent = '正在请求麦克风权限...';
        micIcon.className = 'bx bx-loader-alt bx-spin';
        
        // 请求麦克风权限
        micSetupStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log('✅ 麦克风权限获取成功');
        
        // 更新状态
        micIcon.className = 'bx bx-check-circle';
        micIcon.style.color = '#28a745';
        micStatus.textContent = '麦克风权限已获取';
        micStatus.style.color = '#28a745';
        
        // 检测音频设备
        await detectAudioDevices();
        
        // 显示设备列表
        if (deviceSection) {
            deviceSection.style.display = 'block';
        }
        
        // 显示下一步按钮
        const nextButton = document.getElementById('nextToStep2Button');
        if (nextButton) {
            nextButton.style.display = 'inline-block';
        }
        
        // 隐藏请求按钮
        requestButton.style.display = 'none';
        
        // 更新步骤状态
        updateStepStatus('mic-step1', 'completed', '✅ 权限获取成功');
        
        // 停止音频流（我们只是为了获取权限）
        if (micSetupStream) {
            micSetupStream.getTracks().forEach(track => track.stop());
            micSetupStream = null;
        }
        
    } catch (error) {
        console.error('❌ 麦克风权限获取失败:', error);
        
        // 更新错误状态
        micIcon.className = 'bx bx-x-circle';
        micIcon.style.color = '#dc3545';
        micStatus.textContent = '麦克风权限被拒绝';
        micStatus.style.color = '#dc3545';
        
        requestButton.disabled = false;
        requestButton.textContent = '重新请求权限';
        
        // 显示错误信息
        let errorMessage = '权限获取失败';
        if (error.name === 'NotAllowedError') {
            errorMessage = '用户拒绝了麦克风权限，请在浏览器设置中允许麦克风访问';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '未检测到麦克风设备，请检查设备连接';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '浏览器不支持麦克风功能，请使用现代浏览器';
        }
        
        updateStepStatus('mic-step1', 'error', '❌ ' + errorMessage);
    }
};

// 检测音频输入设备
const detectAudioDevices = async () => {
    console.log('🔍 检测音频输入设备...');
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        detectedDevices = audioInputs;
        
        const deviceList = document.getElementById('deviceList');
        if (deviceList && audioInputs.length > 0) {
            deviceList.innerHTML = '';
            
            audioInputs.forEach((device, index) => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'device-item';
                deviceItem.innerHTML = `
                    <div class="device-info">
                        <i class='bx bx-microphone'></i>
                        <span class="device-name">${device.label || `麦克风 ${index + 1}`}</span>
                    </div>
                    <div class="device-status">
                        <i class='bx bx-check-circle' style="color: #28a745;"></i>
                        <span style="color: #28a745;">可用</span>
                    </div>
                `;
                deviceList.appendChild(deviceItem);
            });
        }
        
        console.log(`✅ 检测到 ${audioInputs.length} 个音频输入设备`);
        
    } catch (error) {
        console.error('❌ 检测音频设备失败:', error);
        
        const deviceList = document.getElementById('deviceList');
        if (deviceList) {
            deviceList.innerHTML = '<div class="error-message">设备检测失败</div>';
        }
    }
};

// 完成录音设备设置
const completeMicrophoneSetup = () => {
    console.log('🎉 完成录音设备设置');
    
    // 保存配置
    const config = {
        enabled: true,
        permissionGranted: true,
        devicesDetected: detectedDevices.length,
        devices: detectedDevices.map(device => ({
            deviceId: device.deviceId,
            label: device.label || '未知设备'
        })),
        timestamp: Date.now()
    };
    
    localStorage.setItem('microphoneConfig', JSON.stringify(config));
    
    // 标记设置为已完成
    markSettingCompleted('microphone');
    
    console.log('✅ 录音设备配置已保存', config);
    
    // 返回设置页面
    const overlay = document.querySelector('.slides-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // 重新打开设置页面并刷新显示
    const settingsOverlay = createSettingsOverlay();
    setupSettingsOverlayEvents(settingsOverlay);
    refreshSettingsDisplay();
};

// 更新步骤状态
const updateStepStatus = (stepId, type, message) => {
    const stepCircle = document.getElementById(`${stepId}-circle`);
    const statusEl = document.getElementById(`${stepId}-status`);
    
    if (stepCircle) {
        stepCircle.className = `step-circle ${type}`;
        if (type === 'completed') {
            stepCircle.innerHTML = '✓';
        } else if (type === 'error') {
            stepCircle.innerHTML = '✗';
        }
    }
    
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `step-status ${type}`;
    }
};

// 导入录音设备配置
const importMicrophoneConfig = () => {
    console.log('📥 导入录音设备配置');
    // TODO: 实现导入功能
    alert('导入功能开发中...');
};

// 导出录音设备配置
const exportMicrophoneConfig = () => {
    console.log('📤 导出录音设备配置');
    // TODO: 实现导出功能
    alert('导出功能开发中...');
};

// 进入第二步
const goToStep2 = () => {
    console.log('➡️ 进入第二步：录音测试');
    
    // 隐藏第一步，显示第二步
    const step1 = document.getElementById('mic-step1');
    const step2 = document.getElementById('mic-step2');
    
    if (step1) {
        step1.classList.remove('current-step');
        step1.classList.add('completed');
    }
    
    if (step2) {
        step2.classList.remove('pending');
        step2.classList.add('visible', 'current-step');
    }
    
    // 初始化录音接口
    initRecordingInterface();
};

// 返回第一步
const goBackToStep1 = () => {
    console.log('⬅️ 返回第一步：请求麦克风权限');
    
    const step1 = document.getElementById('mic-step1');
    const step2 = document.getElementById('mic-step2');
    
    if (step1) {
        step1.classList.remove('completed');
        step1.classList.add('current-step');
    }
    
    if (step2) {
        step2.classList.remove('visible', 'current-step');
        step2.classList.add('pending');
    }
    
    // 销毁录音接口
    if (recordingInterface) {
        recordingInterface.destroy();
        recordingInterface = null;
    }
};

// 初始化录音接口
const initRecordingInterface = () => {
    console.log('🎛️ 初始化录音接口...');
    
    try {
        recordingInterface = new RecordingInterface('recordingTestContainer', {
            recordingDuration: 10, // 10秒录音
            waveformBars: 100, // 100个波峰条
            colorStyle: 'purple', // 紫色风格
            textPlaceholder: '录音测试结果将显示在此处...'
        });
        
        console.log('✅ 录音接口初始化完成');
        
    } catch (error) {
        console.error('❌ 录音接口初始化失败:', error);
        updateStepStatus('mic-step2', 'error', '❌ 录音接口初始化失败');
    }
};

// 开始录音测试
const startRecordingTest = async () => {
    console.log('🎤 开始录音测试...');
    
    const startButton = document.getElementById('startRecordingTestButton');
    const completeButton = document.getElementById('completeMicSetupButton');
    
    if (!recordingInterface) {
        console.error('❌ 录音接口未初始化');
        return;
    }
    
    try {
        // 更新按钮状态
        if (startButton) {
            startButton.disabled = true;
            startButton.textContent = '录音中...';
        }
        
        // 获取音频流
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: { ideal: 44100 },
                channelCount: { ideal: 1 }
            }
        });
        
        // 开始录音
        await recordingInterface.startRecording(stream);
        
        // 录音完成后的处理
        setTimeout(() => {
            console.log('✅ 录音测试完成');
            
            // 更新按钮状态
            if (startButton) {
                startButton.disabled = false;
                startButton.textContent = '重新录音';
            }
            
            // 显示完成按钮
            if (completeButton) {
                completeButton.style.display = 'inline-block';
            }
            
            // 更新步骤状态
            updateStepStatus('mic-step2', 'completed', '✅ 录音测试成功');
            
        }, 11000); // 录音时长 + 1秒处理时间
        
    } catch (error) {
        console.error('❌ 录音测试失败:', error);
        
        // 恢复按钮状态
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = '重试录音';
        }
        
        updateStepStatus('mic-step2', 'error', '❌ 录音测试失败: ' + error.message);
    }
};

// 导出主要函数供外部使用
window.createMicrophoneSetupOverlay = createMicrophoneSetupOverlay;
window.requestMicrophonePermission = requestMicrophonePermission;
window.completeMicrophoneSetup = completeMicrophoneSetup;
window.importMicrophoneConfig = importMicrophoneConfig;
window.exportMicrophoneConfig = exportMicrophoneConfig;
window.goToStep2 = goToStep2;
window.goBackToStep1 = goBackToStep1;
window.startRecordingTest = startRecordingTest;
