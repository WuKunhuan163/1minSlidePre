/**
 * 录音设置详细界面 - 基于Aliyun项目的步骤风格，适应黑白紫色主题
 */

// 创建录音设置详细界面
const createAudioSetupOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'slides-overlay'; // 复用PPT页面的样式
    
    overlay.innerHTML = `
        <div class="slides-header">
            <button class="back-button">
                <i class='bx bx-arrow-back'></i>
            </button>
            <h2>录音文字识别设置</h2>
            <!-- 导入导出设置移到header -->
            <div class="config-actions">
                <button class="rect-button btn btn-import" onclick="importAudioConfig()">导入设置</button>
                <button class="rect-button btn btn-export" onclick="exportAudioConfig()">导出设置</button>
            </div>
        </div>
        
        
        <div class="setup-container">
            <div class="setup-flow">
                <!-- Step 1: 启用服务 -->
                <div class="setup-step visible current-step" id="audio-step1">
                    <div class="step-circle pending" id="audio-step1-circle">1</div>
                    <div class="step-line" id="audio-step1-line"></div>
                    <div class="step-content" id="audio-step1-content">
                        <div class="mobile-step-indicator">第1/5步</div>
                        <div class="step-title">启用智能语音交互服务</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_1_enable_service.png" alt="启用服务示意图" style="width: 100%; max-width: 600px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            启用阿里云智能语音交互服务，为语音识别功能做准备。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://nls-portal.console.aliyun.com/overview" target="_blank">智能语音交互控制台</a><br>
                            2. 如果是首次使用，点击"立即开通"按钮<br>
                            3. 根据提示完成服务开通流程
                        </div>
                        <button class="btn btn-primary normal-button" onclick="completeAudioStep1()">完成服务启用</button>
                        <div id="audio-step1-status" class="step-status"></div>
                    </div>
                </div>

                <!-- Step 2: 获取AppKey -->
                <div class="setup-step pending" id="audio-step2">
                    <div class="step-circle pending" id="audio-step2-circle">2</div>
                    <div class="step-line" id="audio-step2-line"></div>
                    <div class="step-content" id="audio-step2-content">
                        <div class="mobile-step-indicator">第2/5步</div>
                        <div class="step-title">获取并配置 AppKey</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_2_get_appkey.png" alt="创建应用获取AppKey示意图" style="width: 100%; max-width: 600px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建项目并获取项目的AppKey。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://nls-portal.console.aliyun.com/applist" target="_blank">全部项目</a>页面<br>
                            2. 创建新项目，在列表中找到它<br>
                            3. 点击项目名称进入项目详情<br>
                            4. 在项目详情页面找到并复制AppKey<br>
                            5. 将AppKey粘贴到下方输入框中
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAppKey">AppKey <span class="required">*</span></label>
                                <div class="secret-display" id="audioAppKeyDisplay"></div>
                            </div>
                            <input type="text" id="audioAppKey" name="appkey" autocomplete="username" placeholder="从阿里云控制台项目中获取的AppKey">
                        </div>
                        <button class="btn btn-back normal-button" onclick="goBackToAudioStep(1)">上一步</button>
                        <button class="btn btn-primary normal-button" onclick="validateAudioStep2()">验证 AppKey</button>
                        <div id="audio-step2-status" class="step-status"></div>
                    </div>
                </div>

                <!-- Step 3: 创建RAM用户 -->
                <div class="setup-step pending" id="audio-step3">
                    <div class="step-circle pending" id="audio-step3-circle">3</div>
                    <div class="step-line" id="audio-step3-line"></div>
                    <div class="step-content" id="audio-step3-content">
                        <div class="mobile-step-indicator">第3/5步</div>
                        <div class="step-title">创建RAM用户</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_3_create_user.png" alt="创建RAM用户示意图" style="width: 100%; max-width: 600px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建RAM用户，用于后续的AccessKey配置。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://ram.console.aliyun.com/overview?activeTab=workflow" target="_blank">RAM控制台工作流程</a><br>
                            2. 选择"创建初始用户"下方的"账号管理员"选项<br>
                            3. 点击"执行配置"完成验证
                        </div>
                        <button class="btn btn-back normal-button" onclick="goBackToAudioStep(2)">上一步</button>
                        <button class="btn btn-primary normal-button" onclick="completeAudioStep3()">完成用户创建</button>
                        <div id="audio-step3-status" class="step-status"></div>
                    </div>
                </div>

                <!-- Step 4: 配置AccessKey -->
                <div class="setup-step pending" id="audio-step4">
                    <div class="step-circle pending" id="audio-step4-circle">4</div>
                    <div class="step-line" id="audio-step4-line"></div>
                    <div class="step-content" id="audio-step4-content">
                        <div class="mobile-step-indicator">第4/5步</div>
                        <div class="step-title">配置 AccessKey</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_4_accesskey.png" alt="创建AccessKey示意图" style="width: 100%; max-width: 600px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建并配置AccessKey用于服务认证。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://ram.console.aliyun.com/users" target="_blank">RAM用户管理</a>页面<br>
                            2. 找到刚创建的用户，点击添加权限<br>
                            3. 搜索并添加 "AliyunNLSFullAccess" 权限<br>
                            4. 点击用户名进入详情页，创建AccessKey<br>
                            5. 填写下方的AccessKey信息
                        </div>
                        
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAccessKeyId">AccessKey ID <span class="required">*</span></label>
                                <div class="secret-display" id="audioAccessKeyIdDisplay"></div>
                            </div>
                            <input type="text" id="audioAccessKeyId" name="accesskeyid" autocomplete="email" placeholder="RAM用户的Access Key ID">
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAccessKeySecret">AccessKey Secret <span class="required">*</span>
                                    <i class="bx bx-info-circle info-icon" data-tooltip="用于认证，请妥善保管不要外泄"></i>
                                </label>
                                <div class="secret-display" id="audioAccessKeySecretDisplay"></div>
                            </div>
                            <input type="password" id="audioAccessKeySecret" name="accesskeysecret" autocomplete="current-password" placeholder="RAM用户的Access Key Secret">
                        </div>
                        <button class="btn btn-back normal-button" onclick="goBackToAudioStep(3)">上一步</button>
                        <button class="btn btn-primary normal-button" onclick="validateAudioStep4()">验证 AccessKey</button>
                        <div id="audio-step4-status" class="step-status"></div>
                    </div>
                </div>

                <!-- Step 5: 录音测试 -->
                <div class="setup-step pending" id="audio-step5">
                    <div class="step-circle pending" id="audio-step5-circle">5</div>
                    <div class="step-content" id="audio-step5-content">
                        <div class="mobile-step-indicator">第5/5步</div>
                        <div class="step-title">录音功能测试</div>
                        <div class="step-description">
                            测试录音功能和语音识别效果，确保系统正常工作。
                            <br><br>
                            <strong>测试说明：</strong><br>
                            1. 点击"开始"按钮开始录音<br>
                            2. 清晰地说话5-10秒钟<br>
                            3. 系统将识别您的语音并显示结果<br>
                            4. 如果识别失败，重试
                        </div>
                        
                        <!-- 转录容器 -->
                        <div class="transcription-container">
                            <!-- 细细的进度条在转录框内部顶端 -->
                            <div class="progress-container-thin">
                                <div class="progress-bar-thin" id="progressBarThin">
                                    <div class="progress-fill-thin" id="progressFillThin"></div>
                                </div>
                            </div>
                            
                            <!-- 音轨峰图 -->
                            <div class="waveform-container" id="waveformContainer">
                                <svg class="waveform-svg" id="waveformSvg" width="100%" height="30" viewBox="0 0 1000 30" preserveAspectRatio="none">
                                    <!-- 背景 -->
                                    <rect class="waveform-background" x="0" y="0" width="1000" height="30" />
                                    <!-- 峰值区域将动态生成 -->
                                    <g id="waveformBars"></g>
                                    <!-- 进度遮罩 -->
                                    <rect class="waveform-progress-mask" id="waveformProgressMask" x="0" y="0" width="0" height="30" />
                                </svg>
                            </div>
                            
                            <!-- 转录结果显示区域 -->
                            <div id="transcriptionResult" class="transcription-result">
                            </div>
                        </div>
                        
                        <button class="btn btn-back normal-button" onclick="goBackToAudioStep(4)">上一步</button>
                        <button class="btn btn-primary normal-button" id="recordButton" onclick="toggleRecording()">
                            开始
                        </button>
                        <button class="btn btn-primary normal-button" id="downloadRecordingButton" onclick="downloadRecording()" style="display: none;">
                            下载
                        </button>
                        <button class="btn btn-success normal-button" id="completeSetupButton" onclick="completeAudioStep5()" style="display: none;">完成设置</button>
                        
                        <!-- 录音结果状态显示 -->
                        <div id="audio-step5-status" class="step-status"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    
    // 在DOM添加后立即初始化音频设置
    setTimeout(() => {
        
        // 先填充保存的配置
        fillSavedConfig();
        
        // 然后初始化设置
        initAudioSetup();
    }, 100);
    
    return overlay;
};





// 填充保存的配置
const fillSavedConfig = () => {
    const config = simpleConfig.getAll();
    
    // 填充AppKey
    if (config.appKey) {
        const appKeyInput = document.getElementById('audioAppKey');
        if (appKeyInput) {
            appKeyInput.value = config.appKey;
        }
    }
    
    // 填充AccessKey ID
    if (config.accessKeyId) {
        const keyIdInput = document.getElementById('audioAccessKeyId');
        if (keyIdInput) {
            keyIdInput.value = config.accessKeyId;
        }
    }
    
    // 填充AccessKey Secret
    if (config.accessKeySecret) {
        const keySecretInput = document.getElementById('audioAccessKeySecret');
        if (keySecretInput) {
            keySecretInput.value = config.accessKeySecret;
        }
    }
    
};

// 录音设置步骤逻辑
let currentAudioStep = 1;

// 录音相关变量 (audio-setup专用)
let audioSetupMediaRecorder = null;
let audioSetupAudioChunks = [];
let audioSetupAudioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let isRecording = false;
let waveformAnimationId = null;
let lastRecordedAudio = null; // 保存最后录制的音频用于重试
let audioSource = null;
let scriptProcessor = null;
let audioBuffer = [];
let rawAudioData = null;
let originalBackgroundMusicVolume = null; // 保存原始背景音乐音量
let currentAmplitude = 0; // 用于波形显示的当前振幅

const completeAudioStep1 = () => {
    console.log('🎯 开始完成步骤1');
    
    // 更新步骤圆圈和线条状态
    const circle1 = document.getElementById('audio-step1-circle');
    const line1 = document.getElementById('audio-step1-line');
    const content1 = document.getElementById('audio-step1-content');
    
    if (circle1) {
        circle1.classList.remove('pending');
        circle1.classList.add('completed');
        console.log('✅ 步骤1圆圈状态已更新为completed');
    }
    if (line1) {
        line1.classList.add('completed');
        console.log('✅ 步骤1线条状态已更新为completed');
    }
    if (content1) {
        content1.classList.add('completed');
        console.log('✅ 步骤1内容状态已更新为completed');
    }
    
    // 标记步骤1为已测试
    simpleConfig.markSettingTested('recording_step1');
    
    console.log('🔄 准备跳转到步骤2');
    showAudioStep(2, false); // 手动跳转，禁用自动跳转
    return true;
};

const validateAudioStep2 = () => {
    const appKeyInput = document.getElementById('audioAppKey');
    if (!appKeyInput) {
        console.error('❌ 找不到AppKey输入框，可能DOM还未加载完成');
        return false;
    }
    
    const appKey = appKeyInput.value.trim();
    if (!appKey) {
        showAudioStatus('audio-step2-status', '请输入AppKey', 'error');
        return false;
    }
    showAudioStatus('audio-step2-status', 'AppKey配置成功！', 'success');
    simpleConfig.set('appKey', appKey);
        
        // 更新步骤圆圈、线条和内容状态
        const circle2 = document.getElementById('audio-step2-circle');
        const line2 = document.getElementById('audio-step2-line');
        const content2 = document.getElementById('audio-step2-content');
        
        if (circle2) {
            circle2.classList.remove('pending', 'active');
            circle2.classList.add('completed');
            console.log('✅ 步骤2圆圈状态已更新为completed');
        }
        if (line2) {
            line2.classList.add('completed');
            console.log('✅ 步骤2线条状态已更新为completed');
        }
        if (content2) {
            content2.classList.add('completed');
            console.log('✅ 步骤2内容状态已更新为completed');
        }
        
    // 立即跳转到下一步，无需等待
    showAudioStep(3, false); // 手动跳转，禁用自动跳转
    return true;
};

const completeAudioStep3 = () => {
    console.log('🎯 开始完成步骤3');
    
    // 更新步骤圆圈和线条状态
    const circle3 = document.getElementById('audio-step3-circle');
    const line3 = document.getElementById('audio-step3-line');
    const content3 = document.getElementById('audio-step3-content');
    
    if (circle3) {
        circle3.classList.remove('pending');
        circle3.classList.add('completed');
    }
    if (line3) {
        line3.classList.add('completed');
    }
    if (content3) {
        content3.classList.add('completed');
    }
    
    // 标记步骤3为已测试
    simpleConfig.markSettingTested('recording_step3');
    
    console.log('🔄 准备跳转到步骤4');
    showAudioStep(4, false); // 手动跳转，禁用自动跳转
    return true;
};

const validateAudioStep4 = async () => {
    const keyIdInput = document.getElementById('audioAccessKeyId');
    const keySecretInput = document.getElementById('audioAccessKeySecret');
    
    if (!keyIdInput || !keySecretInput) {
        console.error('❌ 找不到AccessKey输入框，可能DOM还未加载完成');
        return false;
    }
    
    const keyId = keyIdInput.value.trim();
    const keySecret = keySecretInput.value.trim();
    
    if (!keyId || !keySecret) {
        showAudioStatus('audio-step4-status', '请输入完整的AccessKey信息', 'error');
        return false;
    }
    
    showAudioStatus('audio-step4-status', 'AccessKey验证中...', 'processing');
    
    // 保存配置，但不启用录音功能（需要在第五步完成后才启用）
    simpleConfig.setAll({
        accessKeyId: keyId,
        accessKeySecret: keySecret
    });
    
    // 模拟验证过程（实际上可以调用token验证API）
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showAudioStatus('audio-step4-status', 'AccessKey配置成功！', 'success');
    
    // 更新步骤圆圈、线条和内容状态
    const circle4 = document.getElementById('audio-step4-circle');
    const line4 = document.getElementById('audio-step4-line');
    const content4 = document.getElementById('audio-step4-content');
    
    if (circle4) {
        circle4.classList.remove('pending', 'active');
        circle4.classList.add('completed');
        console.log('✅ 步骤4圆圈状态已更新为completed');
    }
    if (line4) {
        line4.classList.add('completed');
        console.log('✅ 步骤4线条状态已更新为completed');
    }
    if (content4) {
        content4.classList.add('completed');
        console.log('✅ 步骤4内容状态已更新为completed');
    }
    
    showAudioStep(5, false); // 手动跳转，禁用自动跳转
    return true;
};

const completeAudioStep5 = () => {
    console.log('🎯 完成第五步录音测试');
    
    // 更新步骤圆圈状态
    const circle5 = document.getElementById('audio-step5-circle');
    const content5 = document.getElementById('audio-step5-content');
    
    if (circle5) {
        circle5.classList.remove('pending', 'active');
        circle5.classList.add('completed');
        console.log('✅ 步骤5圆圈状态已更新为completed');
    }
    if (content5) {
        content5.classList.add('completed');
        console.log('✅ 步骤5内容状态已更新为completed');
    }
    
    // 标记为已测试并启用功能
    simpleConfig.markSettingTested('recording');
    simpleConfig.set('recordingEnabled', true);
    
    // 刷新主设置页的toggle状态
    const recordingToggle = document.querySelector('#recordingToggle');
    if (recordingToggle) {
        recordingToggle.checked = true;
        recordingToggle.dispatchEvent(new Event('change'));
    }
    
    // 更新主菜单按钮NEW状态
    if (typeof updateMainSettingsButton === 'function') {
        updateMainSettingsButton();
    }
    
    console.log('✅ 录音功能设置完成');
    
    // 直接返回设置主菜单，不自动进入AI设置
    // 延迟1秒后自动返回主菜单
    setTimeout(() => {
        // 创建设置菜单overlay并安全切换
        const settingsOverlay = createSettingsOverlay();
        if (typeof setupSettingsOverlayEvents === 'function') {
            setupSettingsOverlayEvents(settingsOverlay);
        }
        
        // 使用overlay管理器安全切换
        if (typeof overlayManager !== 'undefined') {
            overlayManager.switchToOverlay(settingsOverlay);
        } else {
            // 备用方案：直接清理和添加
            const existingOverlays = document.querySelectorAll('.slides-overlay, .overlay');
            existingOverlays.forEach(overlay => overlay.remove());
            document.body.appendChild(settingsOverlay);
        }
    }, 1000);
};

const goBackToAudioStep = (stepNumber) => {
    showAudioStep(stepNumber, false); // 手动返回，禁用自动跳转
};

// 录音功能实现
const toggleRecording = async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        await stopRecording();
    }
};

const startRecording = async () => {
    try {
        console.log('🎤 开始录音...');
        
        // 清空录音文本框内容和状态显示（重新开始录音时）
        const transcriptionResult = document.getElementById('transcriptionResult');
        if (transcriptionResult) {
            transcriptionResult.textContent = '';
            transcriptionResult.className = 'transcription-result'; // 移除状态类
        }
        
        // 清空状态显示
        const statusElement = document.getElementById('audio-step5-status');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.style.display = 'none';
        }
        
        // 检查浏览器支持 - 参考vercel_server的实现
        if (!navigator.mediaDevices) {
            // 尝试旧的API作为fallback
            if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
                const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                const stream = await new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, { audio: true }, resolve, reject);
                });
                await setupRecordingWithStream(stream);
                return;
            } else {
                throw new Error('您的浏览器不支持录音功能，请使用Chrome、Firefox或Safari等现代浏览器');
            }
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
            throw new Error('您的浏览器不支持录音功能，请使用Chrome、Firefox或Safari等现代浏览器');
        }
        
        // 获取麦克风权限 - 使用与vercel_server相同的配置
        console.log('🎤 请求麦克风权限...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: { ideal: 44100 }, // 使用标准采样率，更好的兼容性
                channelCount: { ideal: 1 },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        console.log('✅ 麦克风权限获取成功');
        await setupRecordingWithStream(stream);
        
    } catch (error) {
        console.error('❌ 录音失败:', error);
        console.error('❌ 错误详情:', error.name, error.message);
        
        // 恢复背景音乐音量
        if (originalBackgroundMusicVolume !== null && window.backgroundMusic) {
            window.backgroundMusic.volume = originalBackgroundMusicVolume;
            originalBackgroundMusicVolume = null;
        }
        
        let errorMessage = '录音失败';
        if (error.name === 'NotAllowedError') {
            errorMessage = '请允许浏览器访问您的麦克风，并刷新页面重试';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '未找到可用的麦克风设备，请检查设备连接';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '您的浏览器不支持录音功能，请尝试使用Chrome或Firefox';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '麦克风被其他应用占用，请关闭其他录音应用后重试';
        } else {
            errorMessage = '录音失败：' + error.message;
        }
        
        // 显示录音失败的错误状态 - 只在status区域显示简要信息
        const transcriptionResult = document.getElementById('transcriptionResult');
        const statusElement = document.getElementById('audio-step5-status');
        
        // 录音结果框保持空白或显示提示
        if (transcriptionResult) {
            transcriptionResult.textContent = '录音失败，请检查设备和权限';
            transcriptionResult.className = 'transcription-result error';
        }
        
        // status区域显示详细错误信息
        if (statusElement) {
            statusElement.textContent = `❌ ${errorMessage}`;
            statusElement.className = 'step-status error';
            statusElement.style.display = 'block';
        }
        
        // 设置错误状态颜色
        updateWaveformColor('error');
    }
};

// 设置录音流的通用函数
const setupRecordingWithStream = async (stream) => {
    try {
        console.log('🔧 设置录音流...');
        
        // 创建AudioContext
        audioSetupAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioSetupAudioContext.createMediaStreamSource(stream);
        
        // 重置音频缓冲区
        audioBuffer = [];
        
        // 设置音频处理
        const bufferSize = 4096;
        scriptProcessor = audioSetupAudioContext.createScriptProcessor(bufferSize, 1, 1);
        
        scriptProcessor.onaudioprocess = (event) => {
            if (isRecording) {
                const inputBuffer = event.inputBuffer.getChannelData(0);
                // 复制数据到我们的缓冲区
                const buffer = new Float32Array(inputBuffer.length);
                buffer.set(inputBuffer);
                audioBuffer.push(buffer);
                
                // 计算RMS振幅用于波形显示 - 模仿vercel_server
                let sum = 0;
                for (let i = 0; i < inputBuffer.length; i++) {
                    sum += inputBuffer[i] * inputBuffer[i];
                }
                const rmsLevel = Math.sqrt(sum / inputBuffer.length);
                currentAmplitude = Math.max(currentAmplitude, rmsLevel);
            }
        };
        
        // 连接音频处理链
        audioSource.connect(scriptProcessor);
        scriptProcessor.connect(audioSetupAudioContext.destination);
        
        // 设置音峰图（使用原有的实现）
        await setupWaveform(stream);
        
        // 开始录音
        isRecording = true;
        
        // 临时将背景音乐音量设为0
        if (window.backgroundMusic) {
            originalBackgroundMusicVolume = window.backgroundMusic.volume; // 保存原始音量
            window.backgroundMusic.volume = 0;
            console.log('🔇 录音开始，背景音乐音量已设为0 (原音量:', originalBackgroundMusicVolume, ')');
        }
        
        // 更新UI
        updateRecordingUI(true);
        
        // 设置录音状态颜色 - 红色
        updateWaveformColor('recording');
        
        console.log('✅ 录音流设置完成，开始录音...');
        
        // 自动停止录音（30秒后）
        setTimeout(() => {
            if (isRecording) {
                stopRecording();
            }
        }, 30000);
        
    } catch (error) {
        console.error('❌ 设置录音流失败:', error);
        
        // 恢复背景音乐音量
        if (originalBackgroundMusicVolume !== null && window.backgroundMusic) {
            window.backgroundMusic.volume = originalBackgroundMusicVolume;
            originalBackgroundMusicVolume = null;
        }
        
    }
};

const stopRecording = async () => {
    if (isRecording) {
        console.log('⏹️ 停止录音...');
        
        isRecording = false;
        
        
        // 停止音峰图动画
        if (waveformAnimationId) {
            cancelAnimationFrame(waveformAnimationId);
        }
        
        // 处理录音数据
        if (audioBuffer.length === 0) {
            console.warn('⚠️ 没有收集到音频数据');
            return;
        }
        
        // 合并所有音频数据块
        const totalLength = audioBuffer.reduce((sum, buffer) => sum + buffer.length, 0);
        const mergedBuffer = mergeBuffers(audioBuffer, totalLength);
        
        // 保存原始PCM数据
        rawAudioData = new Float32Array(mergedBuffer);
        
        console.log('✅ 音频数据收集完成，长度:', totalLength);
        
        // 编码为MP3（用于下载）
        const mp3Blob = encodeToMp3(mergedBuffer);
        lastRecordedAudio = mp3Blob; // 保存音频用于重试
        
        console.log('✅ MP3编码完成，文件大小:', (mp3Blob.size / 1024).toFixed(2), 'KB');
        
        // 显示下载按钮 - 在识别之前就可以下载
        const downloadButton = document.getElementById('downloadRecordingButton');
        if (downloadButton) {
            downloadButton.style.display = 'inline-block';
        }
        
        // 断开音频连接
        if (audioSource) {
            audioSource.disconnect();
            audioSource = null;
        }
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor = null;
        }
        if (microphone) {
            microphone.disconnect();
        }
        if (audioSetupAudioContext) {
            audioSetupAudioContext.close();
            audioSetupAudioContext = null;
        }
        
        // 更新UI
        updateRecordingUI(false);
        
        // 在按钮下方显示"识别中"状态
        const statusElement = document.getElementById('audio-step5-status');
        if (statusElement) {
            statusElement.textContent = '🔄 识别中...';
            statusElement.className = 'step-status processing';
            statusElement.style.display = 'block';
        }
        
        // 恢复背景音乐音量
        if (window.backgroundMusic && originalBackgroundMusicVolume !== null) {
            window.backgroundMusic.volume = originalBackgroundMusicVolume;
            originalBackgroundMusicVolume = null; // 清空保存的音量
        }
        
        // 设置处理中状态颜色 - 橙色
        updateWaveformColor('processing');
        
        // 开始识别
        await recognizeAudio(rawAudioData);
        
        // 识别完成后不修改进度条和峰图背景，保持当前状态
    }
};

const setupWaveform = async (stream) => {
    const waveformSvg = document.getElementById('waveformSvg');
    const waveformBars = document.getElementById('waveformBars');
    
    if (!waveformSvg || !waveformBars) {
        console.error('❌ 找不到SVG音峰图元素');
        return;
    }
    
    // 重置峰图颜色状态（新录音开始时）
    updateWaveformColor(null);
    
    // 创建音频上下文
    audioSetupAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioSetupAudioContext.createAnalyser();
    microphone = audioSetupAudioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    microphone.connect(analyser);
    
    // 创建SVG峰值条 - 模仿vercel_server
    const barCount = 300; // 30秒录音，每0.1秒一个峰值条
    const barWidth = 1000 / barCount;
    
    // 清空现有的峰值条
    waveformBars.innerHTML = '';
    
    // 初始化音峰图数据数组 - 模仿vercel_server
    let waveformData = [];
    // currentAmplitude 现在是全局变量
    
    // 初始化进度条 - 重新录音时重置进度
    const progressFill = document.getElementById('progressFillThin');
    const progressMask = document.getElementById('waveformProgressMask');
    let recordingStartTime = Date.now();
    
    // 重置进度条和波形图到初始状态
    if (progressFill) {
        progressFill.style.transition = '';
        progressFill.style.width = '0%';
    }
    if (progressMask) {
        progressMask.style.transition = '';
        progressMask.setAttribute('width', '0');
    }
    
    // 定时更新音峰图数据 - 模仿vercel_server，每100ms更新一次
    // 延迟100ms开始，让音峰图稍微晚于进度条
    setTimeout(() => {
        const waveformTimer = setInterval(() => {
            if (!isRecording) {
                clearInterval(waveformTimer);
                return;
            }
            
            // 使用从ScriptProcessor计算的RMS振幅 - 模仿vercel_server
            // 将当前振幅转换为峰图高度 (0-25px，留5px边距)
            const height = Math.min(25, Math.max(1, currentAmplitude * 150));
            
            // 添加到峰图数据
            waveformData.push(height);
            
            // 重置当前振幅，准备下一次采样
            currentAmplitude = 0;
            
            // 渲染音峰图
            renderWaveform();
            
        }, 100); // 每100ms更新一次
    }, 100); // 延迟100ms开始
    
    // 渲染音峰图SVG - 模仿vercel_server
    const renderWaveform = () => {
        // 清空现有的峰值条
        waveformBars.innerHTML = '';
        
        // 计算当前录音进度
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        const totalBarsToShow = Math.min(barCount, Math.ceil(elapsed * 10)); // 每秒10个峰值条
        
        // 绘制峰值条（从最新的数据开始，向前显示）
        const startIndex = Math.max(0, waveformData.length - totalBarsToShow);
        for (let i = 0; i < totalBarsToShow && i < waveformData.length; i++) {
            const dataIndex = startIndex + i;
            if (dataIndex < waveformData.length) {
                const height = waveformData[dataIndex];
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('class', 'waveform-bar');
                rect.setAttribute('x', i * barWidth);
                rect.setAttribute('y', 30 - height); // 从底部开始
                rect.setAttribute('width', barWidth * 0.8); // 留一点间隙
                rect.setAttribute('height', height);
                waveformBars.appendChild(rect);
            }
        }
        
        // 更新进度遮罩和进度条
        const progress = Math.min(100, (elapsed / 30) * 100); // 30秒
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (progressMask) {
            progressMask.setAttribute('width', (progress / 100) * 1000);
        }
    };
};

// MP3编码功能
const encodeToMp3 = (pcmData) => {
    const sampleRate = audioSetupAudioContext ? audioSetupAudioContext.sampleRate : 44100;
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // 1个声道, 采样率, 128kbps
    const pcmInt16 = convertFloat32ToInt16(pcmData);
    const mp3Data = [];
    const blockSize = 1152; // MP3编码块大小
    
    for (let i = 0; i < pcmInt16.length; i += blockSize) {
        const chunk = pcmInt16.subarray(i, i + blockSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    
    // 完成编码
    const finalBuffer = mp3encoder.flush();
    if (finalBuffer.length > 0) {
        mp3Data.push(finalBuffer);
    }
    
    const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
    return mp3Blob;
};

// 将Float32Array转换为Int16Array
const convertFloat32ToInt16 = (buffer) => {
    const int16Buffer = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, buffer[i])); // 限制在-1到1之间
        int16Buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return int16Buffer;
};

// 音频重采样函数 - 从vercel_server复制
const resampleAudio = (audioData, originalSampleRate, targetSampleRate) => {
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
    
    return result;
};

// 合并音频缓冲区
const mergeBuffers = (bufferArray, totalLength) => {
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < bufferArray.length; i++) {
        result.set(bufferArray[i], offset);
        offset += bufferArray[i].length;
    }
    return result;
};

// 下载录音功能
const downloadRecording = () => {
    if (!lastRecordedAudio) {
        console.warn('⚠️ 没有可下载的录音');
        return;
    }

    // 禁用下载按钮
    const downloadBtn = document.getElementById('downloadRecordingButton');
    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '下载中...';
    }
    
    const url = URL.createObjectURL(lastRecordedAudio);
    const a = document.createElement('a');
    a.href = url;
    a.download = `录音_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 录音下载完成');
    setTimeout(() => {
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '下载';
        }
    }, 1000);
};

const recognizeAudio = async (pcmData) => {
    try {
        console.log('🔄 发送音频到Vercel API识别...');
        
        // 检查PCM数据
        if (!pcmData || pcmData.length === 0) {
            throw new Error('录音时间太短或音频质量不佳，请重新录音');
        }
        
        
        // 获取配置
        const config = simpleConfig.getAll();
        const { appKey, accessKeyId, accessKeySecret } = config;
        
        if (!appKey || !accessKeyId || !accessKeySecret) {
            throw new Error('缺少必要的配置信息');
        }
        
        // 第一步：获取token
        console.log('🔄 正在获取阿里云Token...');
        const tokenResponse = await fetch(`https://aliyun-voice-to-text-api.vercel.app/api/get-token?t=${Date.now()}&v=7.1&cb=${Math.random()}`, {
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
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Token获取失败:', tokenResponse.status, errorText);
            throw new Error(`Token获取失败: ${tokenResponse.status}`);
        }
        
        const tokenResult = await tokenResponse.json();
        console.log('✅ Token获取成功:', tokenResult);
        
        if (!tokenResult.success) {
            throw new Error(tokenResult.error || 'Token获取失败');
        }
        
        // 第二步：使用token进行语音识别
        console.log('🔄 使用Token进行语音识别...');
        
        // 重采样到16kHz（阿里云API要求）- 模仿vercel_server实现
        const originalSampleRate = audioSetupAudioContext ? audioSetupAudioContext.sampleRate : 44100; // 获取实际采样率
        const targetSampleRate = 16000;   // 阿里云API要求16kHz
        const resampledData = resampleAudio(pcmData, originalSampleRate, targetSampleRate);
        
        
        // 将Float32Array转换为16位PCM格式（阿里云API期望的格式）
        // Float32范围是-1到1，需要转换为16位整数范围-32768到32767
        const pcm16Buffer = new Int16Array(resampledData.length);
        for (let i = 0; i < resampledData.length; i++) {
            const sample = Math.max(-1, Math.min(1, resampledData[i])); // 限制在-1到1之间
            pcm16Buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        
        // 转换为字节数组发送给API
        const audioData = Array.from(new Uint8Array(pcm16Buffer.buffer));
        
        
        // 调用Vercel API（移除超时限制，让用户自己决定等待时间）
        
        const apiUrl = `https://aliyun-voice-to-text-api.vercel.app/api/recognize?t=${Date.now()}&v=7.1&cb=${Math.random()}`;
        const requestData = {
            token: tokenResult.token,
            audioData: audioData,
            format: 'pcm',
            sampleRate: 16000,
            enablePunctuationPrediction: true,
            enableInverseTextNormalization: true,
            appKey: appKey,
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret
        };
        
        console.log('🔗 API调用:', apiUrl);
        console.log('   数据长度:', requestData.audioData.length, '格式:', requestData.format, '采样率:', requestData.sampleRate);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 API响应:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ 响应错误内容:', errorText);
            throw new Error(`API调用失败: ${response.status}, text: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ 识别结果:', result.result || '空结果');
        
        if (result.success && result.result) {
            // 识别成功 - 只在按钮下方显示状态，不更新识别框
            showRecognitionResult(result.result);
            
            // 设置成功状态颜色 - 绿色
            updateWaveformColor('completed');
            
            console.log('🎉 录音设置测试成功');
            
            // 显示完成设置按钮 (下载按钮已在录音结束时显示)
            const completeButton = document.getElementById('completeSetupButton');
            if (completeButton) {
                completeButton.style.display = 'inline-block';
            }
            
        } else {
            throw new Error(result.error || '识别失败');
        }
        
    } catch (error) {
        console.error('❌ 语音识别失败:', error);
        
        // 设置错误状态颜色 - 红色
        updateWaveformColor('error');
        
        let errorMessage = '识别失败，请重试';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败，请检查网络状态';
        } else if (error.message.includes('API调用失败')) {
            // 解析具体的阿里云API错误
            if (error.message.includes('APPKEY_NOT_EXIST')) {
                errorMessage = 'App Key不存在，请检查录音设置中的App Key是否正确';
            } else if (error.message.includes('ACCESS_DENIED')) {
                errorMessage = 'AccessKey权限不足，请检查AccessKey ID和Secret是否正确';
            } else if (error.message.includes('INVALID_TOKEN')) {
                errorMessage = 'Token无效，请检查录音设置中的AccessKey配置';
            } else if (error.message.includes('QUOTA_EXCEED')) {
                errorMessage = '阿里云API调用次数已超限，请稍后重试或升级套餐';
            } else if (error.message.includes('INVALID_PARAMETER')) {
                errorMessage = '请求参数错误，请检查录音设置配置';
            } else {
                errorMessage = 'API调用失败，请检查录音设置中的配置信息';
            }
        } else if (error.message && error.message !== '识别失败') {
            errorMessage = '识别失败：' + error.message;
        }
        
        
        // 在按钮下方显示错误状态
        const statusElement = document.getElementById('audio-step5-status');
        if (statusElement) {
            statusElement.textContent = `❌ ${errorMessage}`;
            statusElement.className = 'step-status error';
            statusElement.style.display = 'block';
        }
    }
};

// 重试识别功能 (audio-setup专用)
const audioSetupRetryRecognition = async () => {
    if (!lastRecordedAudio) {
        return;
    }
    
    console.log('🔄 重新识别音频...');
    
    // 隐藏重试按钮
    const retryButton = document.getElementById('retryButton');
    if (retryButton) {
        retryButton.style.display = 'none';
    }
    
    await recognizeAudio(lastRecordedAudio);
};

const updateRecordingUI = (recording) => {
    const recordButton = document.getElementById('recordButton');
    if (recording) {
        recordButton.innerHTML = '停止';
        recordButton.classList.remove('btn-primary');
        recordButton.classList.add('btn-record', 'recording', 'normal-button');
    } else {
        // 检查是否已经有录音结果，如果有则显示"重新录音"
        const completeButton = document.getElementById('completeSetupButton');
        if (completeButton && completeButton.style.display !== 'none') {
            recordButton.innerHTML = '重新录音';
    } else {
        recordButton.innerHTML = '开始';
        }
        recordButton.classList.remove('btn-record', 'recording');
        recordButton.classList.add('btn-primary', 'normal-button');
    }
};


const showRecognitionResult = (text) => {
    const transcriptionResult = document.getElementById('transcriptionResult');
    const statusElement = document.getElementById('audio-step5-status');
    
    if (transcriptionResult) {
        // 在录音文本框中显示识别结果
        if (text && text.trim()) {
            transcriptionResult.textContent = text;
            transcriptionResult.className = 'transcription-result success';
            console.log('✅ 识别结果已显示在录音文本框');
            
            // 在状态区域显示简单的成功提示
            if (statusElement) {
                statusElement.textContent = '✅ 识别成功';
                statusElement.className = 'step-status success';
                statusElement.style.display = 'block';
            }
        } else {
            transcriptionResult.textContent = '识别失败，请重试';
            transcriptionResult.className = 'transcription-result error';
            
            // 在状态区域显示错误提示
            if (statusElement) {
                statusElement.textContent = '❌ 识别失败';
                statusElement.className = 'step-status error';
                statusElement.style.display = 'block';
            }
        }
    } else {
        console.error('❌ 找不到录音文本框元素');
    }
};

const updateWaveformColor = (state) => {
    const transcriptionContainer = document.querySelector('.transcription-container');
    if (!transcriptionContainer) return;
    
    // 移除所有状态类
    transcriptionContainer.classList.remove('recording', 'processing', 'completed', 'error');
    
    // 添加对应的状态类
    if (state) {
        transcriptionContainer.classList.add(state);
    }
    
    console.log('🎨 峰图颜色状态更新为:', state);
};

// 打开智谱AI设置界面
const openAISetup = () => {
    console.log('🤖 打开智谱AI设置界面');
    
    // 重新打开设置页面
    const settingsButton = document.querySelector('.settings-button');
    if (settingsButton) {
        settingsButton.click();
        
        // 等待设置页面加载后，自动展开智谱AI设置
        setTimeout(() => {
            const aiToggle = document.querySelector('#aiToggle');
            const aiCard = document.querySelector('#aiCard');
            
            if (aiCard && !simpleConfig.get('aiEnabled')) {
                // 如果智谱AI还未启用，点击卡片进入设置
                aiCard.click();
            } else if (aiToggle) {
                // 如果已启用，直接切换toggle
                aiToggle.checked = true;
                aiToggle.dispatchEvent(new Event('change'));
            }
        }, 300);
    }
};

// 本地日志记录函数
const logToFile = (message) => {
    // 防止在下载过程中记录日志导致无限循环
    if (window.isDownloadingLogs) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // 添加到全局日志数组
    if (!window.debugLogs) window.debugLogs = [];
    window.debugLogs.push(logMessage);
    
    // 同时输出到控制台
    console.log(logMessage);
    
    // 如果日志太多，保存到文件并清空
    if (window.debugLogs.length > 100) { // 增加阈值到100
        downloadDebugLogs();
    }
};

// 下载调试日志
const downloadDebugLogs = () => {
    // 设置下载标志，防止无限循环
    window.isDownloadingLogs = true;
    
    try {
        if (!window.debugLogs || window.debugLogs.length === 0) {
            console.log('没有调试日志可下载');
            return;
        }
        
        const logCount = window.debugLogs.length;
        const logContent = window.debugLogs.join('\n');
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `setting-steps-index-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`已下载调试日志，包含${logCount}条记录`);
        
        // 清空日志数组
        window.debugLogs = [];
    } finally {
        // 重置下载标志
        window.isDownloadingLogs = false;
    }
};

// 手动触发日志下载的全局函数
window.downloadDebugLogs = downloadDebugLogs;

// 重置所有步骤为待验证状态
const resetAllStepsToRevalidation = () => {
    console.log('🔄 重置所有步骤为待验证状态');
    
    // 重置所有步骤圆圈为pending状态
    document.querySelectorAll('.step-circle').forEach((circle, index) => {
        circle.classList.remove('active', 'completed');
        circle.classList.add('pending');
    });
    
    // 清除所有步骤的状态信息
    for (let i = 1; i <= 5; i++) {
        const statusElement = document.getElementById(`audio-step${i}-status`);
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = '';
            statusElement.style.display = 'none';
        }
    }
    
    // 特殊处理第五步的录音结果和按钮
    const transcriptionResult = document.getElementById('transcriptionResult');
    if (transcriptionResult) {
        transcriptionResult.textContent = '';
        transcriptionResult.className = 'transcription-result';
    }
    
    const completeButton = document.getElementById('completeSetupButton');
    const downloadButton = document.getElementById('downloadRecordingButton');
    if (completeButton) completeButton.style.display = 'none';
    if (downloadButton) downloadButton.style.display = 'none';
    
    // 重置录音按钮状态
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        recordButton.innerHTML = '开始';
        recordButton.classList.remove('recording');
        recordButton.classList.add('btn-record', 'normal-button');
    }
    
    // 重置波形颜色
    updateWaveformColor(null);
};

const showAudioStep = (stepNumber, allowAutoJump = true) => {
    logToFile(`🔄 显示音频设置步骤 ${stepNumber}, 允许自动跳转: ${allowAutoJump}`);
    
    // 获取调用栈信息
    const stack = new Error().stack;
    logToFile(`📍 showAudioStep调用栈: ${stack}`);
    
    // 移除所有步骤的当前状态和visible状态
    document.querySelectorAll('.setup-step').forEach(step => {
        step.classList.remove('current-step', 'visible');
    });
    
    // 清除后续步骤的状态信息
    for (let i = stepNumber + 1; i <= 5; i++) {
        const statusElement = document.getElementById(`audio-step${i}-status`);
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = '';
            statusElement.style.display = 'none';
            console.log(`🧹 清除步骤${i}的状态信息`);
        }
        
        // 清除特定步骤的特殊状态
        if (i === 5) {
            // 清除第五步的录音结果
            const transcriptionResult = document.getElementById('transcriptionResult');
            if (transcriptionResult) {
                transcriptionResult.textContent = '';
                transcriptionResult.className = 'transcription-result';
            }
            
            // 隐藏完成设置和下载按钮
            const completeButton = document.getElementById('completeSetupButton');
            const downloadButton = document.getElementById('downloadRecordingButton');
            if (completeButton) completeButton.style.display = 'none';
            if (downloadButton) downloadButton.style.display = 'none';
            
            // 重置录音按钮状态
            const recordButton = document.getElementById('recordButton');
            if (recordButton) {
                recordButton.innerHTML = '开始';
                recordButton.classList.remove('recording');
                recordButton.classList.add('btn-record', 'normal-button');
            }
            
            // 重置波形颜色
            updateWaveformColor(null);
        }
    }
    
    // 高亮指定步骤并设置为visible
    const targetStep = document.getElementById(`audio-step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('current-step', 'visible');
        console.log(`✅ 步骤 ${stepNumber} 已设置为当前步骤并可见`);
        
        // 自动滚动到当前步骤
        setTimeout(() => {
            const container = targetStep.closest('.setup-container');
            const stepCircle = targetStep.querySelector('.step-circle');
            
            if (container && stepCircle) {
                // 计算滚动位置 - 让数字圆刚好到标题下沿（减少padding到5px）
                const setupContainer = targetStep.closest('.setup-container');
                const circleOffsetTop = stepCircle.offsetTop + targetStep.offsetTop;
                const scrollTop = circleOffsetTop - 5; // 减少到5px，让数字圆更接近顶部
                
                container.scrollTo({
                    top: Math.max(0, scrollTop),
                    behavior: 'smooth'
                });
                
                console.log(`📜 自动滚动到步骤 ${stepNumber}，数字圆位置: ${circleOffsetTop}，滚动位置: ${scrollTop}`);
            } else {
                console.error(`❌ 滚动失败: container=${!!container}, stepCircle=${!!stepCircle}`);
            }
        }, 100);
    } else {
        console.error(`❌ 找不到步骤 ${stepNumber} 的元素`);
    }
    
    // 更新步骤圆圈状态 - 设置当前步骤为active
    document.querySelectorAll('.step-circle').forEach((circle, index) => {
        const stepNum = index + 1;
        if (stepNum === stepNumber) {
            if (!circle.classList.contains('completed')) {
                circle.classList.remove('pending');
                circle.classList.add('active');
            }
        } else if (stepNum < stepNumber) {
            // 之前的步骤应该是completed状态
            circle.classList.remove('pending', 'active');
            circle.classList.add('completed');
        } else {
            // 之后的步骤应该是pending状态
            circle.classList.remove('active', 'completed');
            circle.classList.add('pending');
        }
    });
    
    // 禁用非当前步骤的交互
    disableNonCurrentStepInteractions(stepNumber);
    
    currentAudioStep = stepNumber;
    
    // 更新移动端进度条
    updateMobileProgress(stepNumber, 5, 'audio');
    
    // 检查是否需要触发自动验证（延迟执行以确保DOM更新完成）
    if (allowAutoJump) {
        setTimeout(() => {
            if (stepAutoJumpManager && stepAutoJumpManager.canStepAutoJump(stepNumber)) {
                console.log(`🚀 步骤${stepNumber}可以自动验证，开始执行`);
                autoJumpFromStep(stepNumber);
            } else {
                console.log(`⏸️ 步骤${stepNumber}不满足自动跳转条件或自动跳转已禁用`);
            }
        }, 500);
    } else {
        console.log(`🚫 步骤${stepNumber}禁用自动跳转`);
    }
};

// 控制步骤交互性 - 使用CSS状态类而不是禁用元素
const disableNonCurrentStepInteractions = (currentStep) => {
    // 获取所有步骤
    for (let stepNum = 1; stepNum <= 5; stepNum++) {
        const stepElement = document.getElementById(`audio-step${stepNum}`);
        if (!stepElement) continue;
        
        const stepContent = stepElement.querySelector('.step-content');
        if (!stepContent) continue;
        
        const isCurrentStep = stepNum === currentStep;
        
        // 移除所有状态类
        stepContent.classList.remove('pending', 'active', 'completed');
        
        // 设置正确的状态类
        if (isCurrentStep) {
            stepContent.classList.add('active');
            // 步骤状态已更新为active
            
            // 检查按钮状态
            const buttons = stepContent.querySelectorAll('button');
            // 按钮状态已更新
        } else if (stepNum < currentStep) {
            stepContent.classList.add('completed');
        } else {
            stepContent.classList.add('pending');
        }
    }
};



// 导入配置 - 支持文件和剪切板
const importAudioConfig = async () => {
    logToFile(`📥📥📥 importAudioConfig被调用`);
    
    // 获取调用栈信息
    const stack = new Error().stack;
    logToFile(`📍 importAudioConfig调用栈: ${stack}`);
    
    const choice = confirm('选择导入方式：\n确定 = 从剪切板导入\n取消 = 从JSON导入');
    logToFile(`🤔 用户选择: ${choice ? '剪切板导入' : 'JSON文件导入'}`);
    
    if (choice) {
        // 从剪切板导入
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                alert('剪切板为空，请先复制配置JSON');
                return;
            }
            
            const config = JSON.parse(text);
            
            // 暂时禁用自动跳转
            const originalAutoJumpManager = stepAutoJumpManager;
            stepAutoJumpManager = null;
            
            simpleConfig.setAll(config);
            alert('配置从剪切板导入成功！');
            // 重新加载当前配置到表单
            loadCurrentConfig();
            
            // 恢复自动跳转管理器，并回到第1步重新开始自动跳转
            stepAutoJumpManager = originalAutoJumpManager;
            
            // 回到第1步并重新开始自动跳转流程
            resetAllStepsToRevalidation(); // 重置所有步骤为待验证状态
            showAudioStep(1, false); // 先显示第1步，不触发自动跳转
            setTimeout(() => {
                console.log('📥 导入配置完成，从第1步重新开始自动跳转');
                autoJumpFromStep(1);
            }, 500);
            
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                alert('无法访问剪切板，请使用文件导入方式');
                importAudioConfigFromFile();
            } else {
                alert('剪切板中的配置格式错误！');
            }
        }
    } else {
        // 从JSON导入
        logToFile(`📁 调用importAudioConfigFromFile`);
        importAudioConfigFromFile();
    }
};

// 从JSON导入配置
const importAudioConfigFromFile = () => {
    logToFile(`📁📁📁 importAudioConfigFromFile被调用`);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        logToFile(`📄 文件选择器onChange事件触发`);
        const file = e.target.files[0];
        if (file) {
            logToFile(`✅ 用户选择了文件: ${file.name}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    // 暂时禁用自动跳转
                    const originalAutoJumpManager = stepAutoJumpManager;
                    stepAutoJumpManager = null;
                    
                    simpleConfig.setAll(config);
                    alert('配置从JSON导入成功！');
                    // 重新加载当前配置到表单
                    loadCurrentConfig();
                    
                    // 恢复自动跳转管理器，并回到第1步重新开始自动跳转
                    stepAutoJumpManager = originalAutoJumpManager;
                    
                    // 回到第1步并重新开始自动跳转流程
                    resetAllStepsToRevalidation(); // 重置所有步骤为待验证状态
                    showAudioStep(1, false); // 先显示第1步，不触发自动跳转
                    setTimeout(() => {
                        console.log('📥 导入配置完成，从第1步重新开始自动跳转');
                        autoJumpFromStep(1);
                    }, 500);
                    
                } catch (error) {
                    alert('配置文件格式错误！');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

// 导出配置 - 支持下载和剪切板
const exportAudioConfig = async () => {
    const config = simpleConfig.getAll();
    const dataStr = JSON.stringify(config, null, 2);
    
    const choice = confirm('选择导出方式：\n确定 = 复制到剪切板\n取消 = 下载JSON文件');
    
    if (choice) {
        // 复制到剪切板
        try {
            await navigator.clipboard.writeText(dataStr);
            alert('配置已复制到剪切板！');
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                alert('无法访问剪切板，将下载文件');
                downloadAudioConfigFile(dataStr);
            } else {
                alert('复制失败，将下载文件');
                downloadAudioConfigFile(dataStr);
            }
        }
    } else {
        // 下载文件
        downloadAudioConfigFile(dataStr);
    }
};

// 下载配置文件
const downloadAudioConfigFile = (dataStr) => {
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = '录音识别设置.json';
    link.click();
    URL.revokeObjectURL(link.href);
};

// 加载当前配置到表单
const loadCurrentConfig = () => {
    const config = simpleConfig.getAll();
    const appKeyInput = document.getElementById('audioAppKey');
    const keyIdInput = document.getElementById('audioAccessKeyId');
    const keySecretInput = document.getElementById('audioAccessKeySecret');
    
    if (appKeyInput) appKeyInput.value = config.appKey || '';
    if (keyIdInput) keyIdInput.value = config.accessKeyId || '';
    if (keySecretInput) keySecretInput.value = config.accessKeySecret || '';
};

const showAudioStatus = (elementId, message, type) => {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `step-status ${type}`; // 应用状态类到外层容器
    statusEl.style.display = 'block';
};



// 初始化录音设置功能
const initAudioSetup = () => {
    logToFile('🎤🎤🎤 initAudioSetup被调用 - 录音设置详细界面已加载');
    
    // 获取调用栈信息
    const stack = new Error().stack;
    logToFile(`📍 initAudioSetup调用栈: ${stack}`);
    
    // 确保第一步初始化为可见状态和active状态
    setTimeout(() => {
        const step1 = document.getElementById('audio-step1');
        if (step1) {
            step1.classList.add('visible');
            console.log('✅ 步骤1初始化为可见状态');
            
            // 设置第一步为当前步骤
            console.log('🎯 初始化时设置第一步为当前步骤');
            showAudioStep(1, false); // 初始化时不触发自动跳转
            
            // 额外确保第一步的step-content有active类
            setTimeout(() => {
                const step1Content = document.getElementById('audio-step1-content');
                if (step1Content && !step1Content.classList.contains('active')) {
                    console.log('⚠️ 第一步step-content缺少active类，手动添加');
                    step1Content.classList.add('active');
                    console.log('✅ 手动为第一步添加active类');
                }
            }, 100);
        }
        
        // 初始化输入预览和info图标 - 延迟更长时间确保DOM完全加载
        setTimeout(() => {
        initInputPreviews();
        initInfoIcons();
        }, 200);
        
        // 检查是否可以自动验证步骤
        checkAutoValidation();
    }, 100);
};

// 初始化输入预览功能
const initInputPreviews = () => {
    const inputs = [
        { input: 'audioAppKey', display: 'audioAppKeyDisplay' },
        { input: 'audioAccessKeyId', display: 'audioAccessKeyIdDisplay' },
        { input: 'audioAccessKeySecret', display: 'audioAccessKeySecretDisplay' }
    ];
    
    inputs.forEach(({ input, display }) => {
        const inputElement = document.getElementById(input);
        const displayElement = document.getElementById(display);
        
        if (inputElement && displayElement) {
            // 监听输入变化
            inputElement.addEventListener('input', () => {
                updateSecretDisplay(inputElement, displayElement);
            });
            
            // 初始化时也检查一次
            updateSecretDisplay(inputElement, displayElement);
        }
    });
};

// 更新密钥预览显示
const updateSecretDisplay = (inputElement, displayElement) => {
    const value = inputElement.value.trim();
    if (value && value.length > 6) {
        const preview = value.substring(0, 3) + '...' + value.substring(value.length - 3);
        displayElement.textContent = preview;
        displayElement.classList.add('show');
    } else {
        displayElement.classList.remove('show');
    }
};

// 初始化info图标功能
const initInfoIcons = () => {
    // 等待DOM完全加载
    setTimeout(() => {
    const infoIcons = document.querySelectorAll('.info-icon');
        
        if (infoIcons.length === 0) {
            // 再次尝试
            setTimeout(() => {
                initInfoIcons();
            }, 500);
            return;
        }
        
        infoIcons.forEach((icon, index) => {
            // 确保图标可点击
            icon.style.pointerEvents = 'auto';
            icon.style.zIndex = '1000';
            
            // 添加hover事件处理
            icon.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                
                // 移除其他图标的tooltip
                infoIcons.forEach(otherIcon => {
                    if (otherIcon !== icon) {
                        otherIcon.classList.remove('show-tooltip');
                    }
                });
                
                // 显示当前图标的tooltip
                icon.classList.add('show-tooltip');
            });
            
            icon.addEventListener('mouseleave', (e) => {
                // 延迟隐藏tooltip，给用户时间阅读
                setTimeout(() => {
                    icon.classList.remove('show-tooltip');
                }, 100);
            });
            
        icon.addEventListener('click', (e) => {
                e.preventDefault();
            e.stopPropagation();
            
            // 移除其他图标的tooltip
            infoIcons.forEach(otherIcon => {
                if (otherIcon !== icon) {
                    otherIcon.classList.remove('show-tooltip');
                }
            });
            
            // 切换当前图标的tooltip
            icon.classList.toggle('show-tooltip');
            
            // 点击其他地方时隐藏tooltip
            setTimeout(() => {
                    const clickHandler = (event) => {
                        if (!icon.contains(event.target)) {
                    icon.classList.remove('show-tooltip');
                        }
                    };
                    document.addEventListener('click', clickHandler, { once: true });
            }, 10);
        });
    });
    }, 100);
};

// 自动验证和跳转功能
const checkAutoValidation = () => {
    console.log('🔍 开始检查自动验证和跳转条件');
    
    // 检查是否在音频设置页面
    const audioStep1 = document.getElementById('audio-step1');
    if (!audioStep1) {
        console.log('🔍 未在音频设置页面，跳过自动验证');
        return;
    }
    
    // 延迟执行以确保DOM完全加载
        setTimeout(() => {
        autoJumpFromStep(1);
                }, 500);
};

// 步骤自动跳转管理器
const createStepAutoJumpManager = () => {
    return {
        // 步骤配置
        stepConfigs: {
            1: {
                name: '启用服务',
                canAutoJump: () => {
                    // 检查是否之前完成过
                    return simpleConfig.isSettingTested('recording_step1');
                },
                jumpFunction: () => completeAudioStep1()
            },
            2: {
                name: 'AppKey配置',
                canAutoJump: () => {
                    const config = simpleConfig.getAll();
                    return config.appKey && config.appKey.trim();
                },
                jumpFunction: () => validateAudioStep2()
            },
            3: {
                name: '创建RAM用户',
                canAutoJump: () => {
                    // 检查是否之前完成过
                    return simpleConfig.isSettingTested('recording_step3');
                },
                jumpFunction: () => completeAudioStep3()
            },
            4: {
                name: 'AccessKey配置',
                canAutoJump: () => {
                    const config = simpleConfig.getAll();
                    const hasAccessKey = config.accessKeyId && config.accessKeySecret && 
                                        config.accessKeyId.trim() && config.accessKeySecret.trim();
                    
                    // 检查步骤是否已经完成（避免无限循环）
                    const step4Circle = document.getElementById('audio-step4-circle');
                    const isCompleted = step4Circle && step4Circle.classList.contains('completed');
                    
                    console.log(`🔍 步骤4检查: hasAccessKey=${hasAccessKey}, isCompleted=${isCompleted}`);
                    
                    return hasAccessKey && !isCompleted;
                },
                jumpFunction: () => validateAudioStep4()
            },
            5: {
                name: '录音测试',
                canAutoJump: () => {
                    // 第五步需要手动完成，不自动跳转
                    return false;
                }
            }
        },

        // 检查步骤是否可以自动跳转
        canStepAutoJump(stepNumber) {
            const stepConfig = this.stepConfigs[stepNumber];
            if (!stepConfig) return false;
            
            const canJump = stepConfig.canAutoJump();
            console.log(`🔍 步骤${stepNumber}(${stepConfig.name})是否可以自动跳转: ${canJump}`);
            return canJump;
        },

        // 执行步骤跳转
        async executeStepJump(stepNumber) {
            const stepConfig = this.stepConfigs[stepNumber];
            if (!stepConfig) {
                console.log(`❌ 步骤${stepNumber}配置不存在`);
                return false;
            }

            try {
                console.log(`⏭️ 执行步骤${stepNumber}(${stepConfig.name})自动跳转`);
                
                // 确保当前步骤可见
                showAudioStep(stepNumber, false); // 自动跳转过程中禁用递归自动跳转
                
                // 等待DOM更新
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // 执行跳转函数并等待完成
                const result = await stepConfig.jumpFunction();
                
                // 检查验证是否成功
                if (result === false) {
                    console.log(`❌ 步骤${stepNumber}验证失败，停止自动跳转`);
                    return false;
                }
                
                console.log(`✅ 步骤${stepNumber}自动跳转完成`);
                return true;
            } catch (error) {
                console.error(`❌ 步骤${stepNumber}自动跳转失败:`, error);
                return false;
            }
        },

        // 从指定步骤开始自动跳转
        async autoJumpFromStep(startStep) {
            console.log(`🎯 开始从步骤${startStep}自动跳转`);
            
            for (let step = startStep; step <= 5; step++) {
                if (!this.canStepAutoJump(step)) {
                    console.log(`⏹️ 步骤${step}不能自动跳转，停止连跳`);
                    // 显示当前应该停留的步骤
                    showAudioStep(step, false); // 停止自动跳转时禁用递归自动跳转
                    break;
                }
                
                const success = await this.executeStepJump(step);
                if (!success) {
                    console.log(`❌ 步骤${step}跳转失败，停止连跳`);
                    break;
                }
                
                // UI更新延迟已移除，立即继续
            }
        }
    };
};

// 全局步骤跳转管理器
let stepAutoJumpManager = null;

// 从指定步骤开始自动跳转的全局函数
const autoJumpFromStep = async (startStep) => {
    logToFile(`🚀🚀🚀 autoJumpFromStep被调用，startStep=${startStep}`);
    
    // 获取调用栈信息
    const stack = new Error().stack;
    logToFile(`📍 autoJumpFromStep调用栈: ${stack}`);
    
    if (!stepAutoJumpManager) {
        stepAutoJumpManager = createStepAutoJumpManager();
    }
    await stepAutoJumpManager.autoJumpFromStep(startStep);
};

// 添加脉动动画CSS
const pulseAnimationCSS = `
/* 脉动动画 */
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(102, 106, 246, 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(102, 106, 246, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(102, 106, 246, 0);
    }
}
`;

// 将动画CSS添加到现有样式中
const existingStyle = document.querySelector('style[data-setting-steps-index]');
if (existingStyle) {
    existingStyle.textContent += pulseAnimationCSS;
}

// 创建智谱AI设置详细界面
const createAISetupOverlay = () => {
    console.log('🤖 开始创建智谱AI设置详细界面');
    console.log('🤖 当前智谱AI状态:', simpleConfig.get('aiEnabled'));
    
    const overlay = document.createElement('div');
    overlay.className = 'slides-overlay'; // 复用PPT页面的样式
    console.log('🤖 智谱AI设置覆盖层元素已创建');
    
    overlay.innerHTML = `
        <div class="slides-header">
            <button class="back-button">
                <i class='bx bx-arrow-back'></i>
            </button>
            <h2>智谱AI评分设置</h2>
            <!-- 导入导出设置移到header -->
            <div class="config-actions">
                <button class="rect-button btn btn-import" onclick="importAIConfig()">导入设置</button>
                <button class="rect-button btn btn-export" onclick="exportAIConfig()">导出设置</button>
            </div>
        </div>
        
        
        <div class="setup-container">
            <div class="setup-flow">
                <!-- Step 1: 注册智谱AI -->
                <div class="setup-step visible current-step" id="ai-step1">
                    <div class="step-circle pending" id="ai-step1-circle">1</div>
                    <div class="step-line" id="ai-step1-line"></div>
                    <div class="step-content" id="ai-step1-content">
                        <div class="mobile-step-indicator">第1/3步</div>
                        <div class="step-title">注册智谱AI账号</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_6_zhipu_api.png" alt="智谱AI注册示意图" style="width: 100%; max-width: 600px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            注册智谱AI账号并获取API访问权限。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank">智谱AI控制台</a><br>
                            2. 如果没有账号，点击注册新账号<br>
                            3. 完成账号注册和实名认证
                        </div>
                        <button class="btn btn-primary normal-button" onclick="completeAIStep1()">完成账号注册</button>
                        <div id="ai-step1-status"></div>
                    </div>
                </div>

                <!-- Step 2: 获取API Key -->
                <div class="setup-step pending" id="ai-step2">
                    <div class="step-circle pending" id="ai-step2-circle">2</div>
                    <div class="step-line" id="ai-step2-line"></div>
                    <div class="step-content" id="ai-step2-content">
                        <div class="mobile-step-indicator">第2/3步</div>
                        <div class="step-title">获取API Key</div>
                        <div class="step-description">
                            创建并获取智谱AI的API Key。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 登录<a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank">智谱AI控制台</a><br>
                            2. 点击"添加新的API Key"按钮<br>
                            3. 选择一个名称（如"语音识别评分"）<br>
                            4. 在下方列表中复制生成的API Key<br>
                            5. 将API Key粘贴到下方输入框中
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="aiApiKey">智谱AI API Key <span class="required">*</span></label>
                                <div class="secret-display" id="aiApiKeyDisplay"></div>
                            </div>
                            <input type="password" id="aiApiKey" placeholder="从智谱AI控制台获取的API Key">
                        </div>
                        <button class="btn btn-back normal-button" onclick="goBackToAIStep(1)">上一步</button>
                        <button class="btn btn-primary normal-button" onclick="validateAIStep2()">验证 API Key</button>
                        <div id="ai-step2-status"></div>
                    </div>
                </div>

                <!-- Step 3: 测试API连接 -->
                <div class="setup-step pending" id="ai-step3">
                    <div class="step-circle pending" id="ai-step3-circle">3</div>
                    <div class="step-content" id="ai-step3-content">
                        <div class="mobile-step-indicator">第3/3步</div>
                        <div class="step-title">测试AI对话功能</div>
                        <div class="step-description">
                            测试智谱AI的对话功能，确保API正常工作。
                        </div>
                        
                        <!-- AI测试对话区域 -->
                        <div class="chatbot-container" id="aiChatTestArea">
                            <div class="chatbot-header">
                                <h4>🤖 智谱GLM-4</h4>
                            </div>
                            <div class="chatbot-messages" id="chatbotMessages">
                                <div class="message ai-message">
                                    <div class="message-content">您好！我是智谱AI助手，可以为您的演讲进行评分和建议。请输入任何问题来测试我的功能。</div>
                                </div>
                            </div>
                            <div class="chatbot-input">
                                <input type="text" id="chatInput" placeholder="输入你的问题测试AI功能..." maxlength="200" onkeypress="if(event.key==='Enter') sendTestMessage()">
                                <button id="sendChatBtn" onclick="sendTestMessage()">发送</button>
                            </div>
                        </div>
                        
                        <button class="btn btn-back normal-button" onclick="goBackToAIStep(2)">上一步</button>
                        <button class="btn btn-success normal-button" id="completeAISetupButton" onclick="completeAIStep3()" style="display: none;">完成设置</button>
                        <div id="ai-step3-status"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    console.log('🤖 智谱AI设置覆盖层已添加到DOM');
    
    // 检查是否有现有配置，如果有则自动填充和验证
    const existingApiKey = simpleConfig.get('zhipuApiKey');
    if (existingApiKey) {
        console.log('🔍 发现现有智谱AI配置，开始自动验证');
        // 延迟执行以确保DOM完全加载
        setTimeout(() => {
            const apiKeyInput = document.getElementById('aiApiKey');
            if (apiKeyInput) {
                apiKeyInput.value = existingApiKey;
                console.log('✅ 智谱AI API Key已自动填充');
                
                // 如果已启用，自动跳转到对应步骤
                if (simpleConfig.get('aiEnabled')) {
                    console.log('🚀 智谱AI已启用，跳转到第3步测试');
                    showAIStep(3);
                } else {
                    console.log('🚀 有配置但未启用，跳转到第2步验证');
                    showAIStep(2);
                }
            }
        }, 100);
    }
    
    // 初始化AI设置 - 模仿录音设置的成功经验
    setTimeout(() => {
        initAISetup();
    }, 50);
    
    console.log('🤖 返回覆盖层元素:', overlay);
    return overlay;
};

// 初始化AI设置功能 - 模仿录音设置的成功经验
const initAISetup = () => {
    console.log('🤖 智谱AI设置详细界面已加载');
    
    // 确保第一步初始化为可见状态和active状态
    setTimeout(() => {
        const step1 = document.getElementById('ai-step1');
        if (step1) {
            step1.classList.add('visible');
            console.log('✅ AI步骤1初始化为可见状态');
            
            // 设置第一步为当前步骤
            console.log('🎯 初始化时设置AI第一步为当前步骤');
            showAIStep(1);
            
            // 额外确保第一步的step-content有active类
            setTimeout(() => {
                const step1Content = document.getElementById('ai-step1-content');
                if (step1Content && !step1Content.classList.contains('active')) {
                    console.log('⚠️ AI第一步step-content缺少active类，手动添加');
                    step1Content.classList.add('active');
                }
            }, 100);
        }
    }, 100);
};

// 智谱AI设置步骤逻辑
let currentAIStep = 1;

const completeAIStep1 = () => {
    console.log('🤖 开始完成智谱AI步骤1');
    
    // 更新步骤圆圈和线条状态
    const circle1 = document.getElementById('ai-step1-circle');
    const line1 = document.getElementById('ai-step1-line');
    const content1 = document.getElementById('ai-step1-content');
    
    if (circle1) {
        circle1.classList.remove('pending');
        circle1.classList.add('completed');
        console.log('✅ 智谱AI步骤1圆圈状态已更新为completed');
    }
    if (line1) {
        line1.classList.add('completed');
        console.log('✅ 智谱AI步骤1线条状态已更新为completed');
    }
    if (content1) {
        content1.classList.add('completed');
        console.log('✅ 智谱AI步骤1内容状态已更新为completed');
    }
    
    console.log('🔄 准备跳转到智谱AI步骤2');
    showAIStep(2);
};

const validateAIStep2 = async () => {
    const apiKeyInput = document.getElementById('aiApiKey');
    if (!apiKeyInput) {
        console.error('❌ 找不到AI API Key输入框，可能DOM还未加载完成');
        return false;
    }
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showAIStatus('ai-step2-status', '请输入智谱AI API Key', 'error');
        return false;
    }
    
    showAIStatus('ai-step2-status', '进入API Key验证部分...', 'processing');
    
    // 保存配置
    simpleConfig.set('zhipuApiKey', apiKey);
    
    try {
        // 进入第三步进行实际的AI交互验证
        console.log('🔑 API Key格式验证通过，进入交互测试阶段');
        
        showAIStatus('ai-step2-status', 'API Key格式验证通过，进入交互测试', 'success');
        
        // 更新步骤圆圈、线条和内容状态
        const circle2 = document.getElementById('ai-step2-circle');
        const line2 = document.getElementById('ai-step2-line');
        const content2 = document.getElementById('ai-step2-content');
        
        if (circle2) {
            circle2.classList.remove('pending', 'active');
            circle2.classList.add('completed');
            console.log('✅ 智谱AI步骤2圆圈状态已更新为completed');
        }
        if (line2) {
            line2.classList.add('completed');
            console.log('✅ 智谱AI步骤2线条状态已更新为completed');
        }
        if (content2) {
            content2.classList.add('completed');
            console.log('✅ 智谱AI步骤2内容状态已更新为completed');
        }
        
        showAIStep(3);
        return true;
        
    } catch (error) {
        console.error('❌ API Key验证失败:', error);
        showAIStatus('ai-step2-status', `API Key验证失败：${error.message}`, 'error');
        
        // 清除保存的无效配置
        simpleConfig.set('zhipuApiKey', '');
        return false;
    }
};

const completeAIStep3 = () => {
    console.log('🤖 完成第三步智谱AI测试');
    
    // 更新步骤圆圈状态
    const circle3 = document.getElementById('ai-step3-circle');
    const content3 = document.getElementById('ai-step3-content');
    
    if (circle3) {
        circle3.classList.remove('pending', 'active');
        circle3.classList.add('completed');
        console.log('✅ 智谱AI步骤3圆圈状态已更新为completed');
    }
    if (content3) {
        content3.classList.add('completed');
        console.log('✅ 智谱AI步骤3内容状态已更新为completed');
    }
    
    // 标记为已测试并启用功能
    simpleConfig.markSettingTested('ai');
    simpleConfig.set('aiEnabled', true);
    
    // 刷新主设置页的toggle状态
    const aiToggle = document.querySelector('#aiToggle');
    if (aiToggle) {
        aiToggle.checked = true;
        aiToggle.dispatchEvent(new Event('change'));
    }
    
    // 更新主菜单按钮NEW状态
    if (typeof updateMainSettingsButton === 'function') {
        updateMainSettingsButton();
    }
    
    console.log('✅ 智谱AI功能设置完成');
    
    // 显示完成设置按钮
    const completeButton = document.getElementById('completeAISetupButton');
    if (completeButton) {
        completeButton.style.display = 'inline-block';
        
        // 添加点击事件，标记设置完成并返回设置菜单
        completeButton.onclick = () => {
            console.log('🔙 点击完成设置，标记AI设置完成并返回设置菜单');
            
            // 调用原来的完成逻辑来标记设置为完成
            // 标记为已测试并启用功能
            simpleConfig.markSettingTested('ai');
            simpleConfig.set('aiEnabled', true);
            
            // 更新步骤状态
            const circle3 = document.getElementById('ai-step3-circle');
            const content3 = document.getElementById('ai-step3-content');
            
            if (circle3) {
                circle3.classList.remove('pending', 'active');
                circle3.classList.add('completed');
            }
            if (content3) {
                content3.classList.add('completed');
            }
            
            // 创建设置菜单overlay并安全切换
            const settingsOverlay = createSettingsOverlay();
            if (typeof setupSettingsOverlayEvents === 'function') {
                setupSettingsOverlayEvents(settingsOverlay);
            }
            
            // 使用overlay管理器安全切换
            if (typeof overlayManager !== 'undefined') {
                overlayManager.switchToOverlay(settingsOverlay);
            } else {
                // 备用方案：直接清理和添加
                const existingOverlays = document.querySelectorAll('.slides-overlay, .overlay');
                existingOverlays.forEach(overlay => overlay.remove());
                document.body.appendChild(settingsOverlay);
            }
        };
    }
};

const goBackToAIStep = (stepNumber) => {
    showAIStep(stepNumber);
};

const showAIStep = (stepNumber) => {
    console.log(`🔄 显示智谱AI设置步骤 ${stepNumber}`);
    
    // 移除所有步骤的当前状态和visible状态
    document.querySelectorAll('.setup-step').forEach(step => {
        step.classList.remove('current-step', 'visible');
    });
    
    // 高亮指定步骤并设置为visible
    const targetStep = document.getElementById(`ai-step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('current-step', 'visible');
        console.log(`✅ 智谱AI步骤 ${stepNumber} 已设置为当前步骤并可见`);
        
        // 自动滚动到当前步骤
        setTimeout(() => {
            const container = targetStep.closest('.setup-container');
            const stepCircle = targetStep.querySelector('.step-circle');
            
            if (container && stepCircle) {
                // 计算滚动位置 - 让数字圆刚好到标题下沿
                const setupContainer = targetStep.closest('.setup-container');
                const circleOffsetTop = stepCircle.offsetTop + targetStep.offsetTop;
                const scrollTop = circleOffsetTop - 5;
                
                container.scrollTo({
                    top: Math.max(0, scrollTop),
                    behavior: 'smooth'
                });
                
                console.log(`📜 自动滚动到智谱AI步骤 ${stepNumber}，数字圆位置: ${circleOffsetTop}，滚动位置: ${scrollTop}`);
            }
        }, 100);
    } else {
        console.error(`❌ 找不到智谱AI步骤 ${stepNumber} 的元素`);
    }
    
    // 更新步骤圆圈状态 - 设置当前步骤为active
    document.querySelectorAll('.step-circle').forEach((circle, index) => {
        const stepNum = index + 1;
        if (stepNum === stepNumber) {
            if (!circle.classList.contains('completed')) {
                circle.classList.remove('pending');
                circle.classList.add('active');
            }
        } else if (stepNum < stepNumber) {
            // 之前的步骤应该是completed状态
            circle.classList.remove('pending', 'active');
            circle.classList.add('completed');
        } else {
            // 之后的步骤应该是pending状态
            circle.classList.remove('active', 'completed');
            circle.classList.add('pending');
        }
    });
    
    // 禁用非当前步骤的交互 - 模仿录音设置的成功经验
    disableNonCurrentAIStepInteractions(stepNumber);
    
    // 如果进入第三步，自动发送测试消息
    if (stepNumber === 3) {
        setTimeout(() => {
            autoSendTestMessage();
        }, 1000);
    }
    
    currentAIStep = stepNumber;
    
    // 更新移动端进度条
    updateMobileProgress(stepNumber, 3, 'ai');
};

// 控制AI步骤交互性 - 模仿录音设置的成功经验
const disableNonCurrentAIStepInteractions = (currentStep) => {
    // 获取所有AI步骤
    for (let stepNum = 1; stepNum <= 3; stepNum++) {
        const stepElement = document.getElementById(`ai-step${stepNum}`);
        if (!stepElement) continue;
        
        const stepContent = stepElement.querySelector('.step-content');
        if (!stepContent) continue;
        
        const isCurrentStep = stepNum === currentStep;
        
        // 移除所有状态类
        stepContent.classList.remove('pending', 'active', 'completed');
        
        // 设置正确的状态类
        if (isCurrentStep) {
            stepContent.classList.add('active');
            console.log(`✅ AI步骤${stepNum}设置为active状态`);
        } else if (stepNum < currentStep) {
            stepContent.classList.add('completed');
        } else {
            stepContent.classList.add('pending');
        }
    }
};

const showAIStatus = (elementId, message, type) => {
    const statusEl = document.getElementById(elementId);
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `step-status ${type}`; // 和录音设置保持一致的样式
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }
};

// 自动发送测试消息进行API验证
const autoSendTestMessage = async () => {
    console.log('🤖 自动发送测试消息进行API验证');
    
    const chatMessages = document.getElementById('chatbotMessages');
    if (!chatMessages) {
        console.error('❌ 找不到聊天消息容器');
        return;
    }
    
    // 添加用户消息
    const testMessage = '请总结讲师训考评的技巧：「当主持人喊了你的名字，就立马开麦演讲。请不要说我的声音清晰吗。一共是两次提示音，分别是30秒和1分钟。听到30秒倒计时的时候，我们就赶紧结束分享。一定用金句结尾哦！」的主要内容，20字以内。';
    
    // 显示用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<div class="message-content">${testMessage}</div>`;
    chatMessages.appendChild(userMessage);
    
    // 显示AI思考中（普通白色字体）
    const aiMessage = document.createElement('div');
    aiMessage.className = 'message ai-message';
    aiMessage.innerHTML = `<div class="message-content">正在思考中...</div>`;
    chatMessages.appendChild(aiMessage);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // 调用API
        const response = await callZhipuAPI([
            { role: 'user', content: testMessage }
        ]);
        
        // 显示AI回复
        aiMessage.innerHTML = `<div class="message-content">${response}</div>`;
        
        console.log('✅ AI验证成功，自动完成第三步');
        
        // 验证成功，自动完成第三步
        setTimeout(() => {
            completeAIStep3();
        }, 2000);
        
    } catch (error) {
        console.error('❌ AI验证失败:', error);
        aiMessage.innerHTML = `<div class="message-content">验证失败：${error.message}</div>`;
    }
};

// 智谱AI测试对话功能（用户手动交互）
const sendTestMessage = async () => {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatbotMessages');
    const sendBtn = document.getElementById('sendChatBtn');
    
    if (!chatInput || !chatMessages || !sendBtn) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // 获取API Key
    const apiKey = simpleConfig.get('zhipuApiKey');
    if (!apiKey) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message ai-message error';
        errorMessage.innerHTML = `<div class="message-content">请先配置智谱AI API Key</div>`;
        chatMessages.appendChild(errorMessage);
        return;
    }
    
    // 禁用输入和按钮
    chatInput.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中...';
    
    // 添加用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(userMessage);
    
    // 清空输入框
    chatInput.value = '';
    
    // 添加AI思考中的消息（普通白色字体，不使用紫色斜体）
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'message ai-message';
    thinkingMessage.innerHTML = `<div class="message-content">AI正在思考中...</div>`;
    chatMessages.appendChild(thinkingMessage);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // 调用实际的智谱AI API
        console.log('📤 开始调用智谱AI API');
        const aiResponse = await callZhipuAPI([
            { role: 'user', content: message }
        ]);
        
        // 移除思考中的消息
        thinkingMessage.remove();
        
        // 添加AI回复
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        aiMessage.innerHTML = `<div class="message-content">${aiResponse}</div>`;
        chatMessages.appendChild(aiMessage);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 显示完成按钮
        const completeButton = document.getElementById('completeAISetupButton');
        if (completeButton) {
            completeButton.style.display = 'inline-block';
        }
        
        console.log('✅ 智谱AI测试成功');
        
    } catch (error) {
        console.error('❌ 智谱AI测试失败:', error);
        
        // 移除思考中的消息
        thinkingMessage.remove();
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message ai-message error';
        errorMessage.innerHTML = `<div class="message-content">抱歉，AI服务暂时不可用：${error.message}</div>`;
        chatMessages.appendChild(errorMessage);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } finally {
        // 重新启用输入
        chatInput.disabled = false;
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';
        chatInput.focus();
    }
};

// 调用智谱AI API - 通过zhipu_llm_api Vercel服务
const callZhipuAPI = async (messages, modelId = 'glm-4-flash') => {
    const apiKey = simpleConfig.get('zhipuApiKey');
    if (!apiKey) {
        throw new Error('未配置智谱AI API Key');
    }
    
    const requestBody = {
        apiKey: apiKey,
        model: modelId,
        messages: messages
    };
    
    console.log('📤 智谱AI API请求（通过zhipu_llm_api服务）:', {
        url: 'https://zhipu-llm-api.vercel.app/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            ...requestBody,
            apiKey: apiKey.substring(0, 8) + '...' // 隐藏完整API Key
        }
    });
    
    const response = await fetch('https://zhipu-llm-api.vercel.app/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    console.log('📥 智谱AI服务响应状态:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📥 智谱AI服务完整响应:', result);
    
    if (!result.success) {
        console.error('❌ 智谱AI服务错误:', result.error);
        
        if (response.status === 401 || result.error?.includes('API key')) {
            throw new Error('API Key无效，请检查是否正确');
        } else if (result.error?.includes('频率')) {
            throw new Error('API调用频率过高，请稍后重试');
        } else {
            throw new Error(`API调用失败: ${result.error}`);
        }
    }
    
    // 从zhipu_llm_api服务响应中提取内容
    const message = result.data?.choices?.[0]?.message || {};
    const content = message.content || '';
    console.log('📝 提取的内容:', content);
    
    if (!content) {
        console.warn('⚠️ 智谱AI服务响应中未找到内容:', result);
        throw new Error('智谱AI响应格式异常');
    }
    
    return content;
};

// 导入导出智谱AI配置
const importAIConfig = async () => {
    console.log('📥📥📥 importAIConfig被调用');
    
    const choice = confirm('选择导入方式：\n确定 = 从剪切板导入\n取消 = 从JSON文件导入');
    console.log(`🤔 用户选择: ${choice ? '剪切板导入' : 'JSON文件导入'}`);
    
    if (choice) {
        // 从剪切板导入
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                alert('剪切板为空，请先复制配置JSON');
                return;
            }
            
            const config = JSON.parse(text);
            
            if (config.zhipuApiKey) {
                simpleConfig.set('zhipuApiKey', config.zhipuApiKey);
                showMessage('智谱AI配置从剪切板导入成功！', 'success');
                
                // 重新加载当前配置到表单
                const apiKeyInput = document.getElementById('aiApiKey');
                if (apiKeyInput) {
                    apiKeyInput.value = config.zhipuApiKey;
                }
                
                // 重置所有步骤为待验证状态并回到第1步重新开始自动跳转
                resetAllAIStepsToRevalidation();
                showAIStep(1);
                setTimeout(() => {
                    console.log('📥 智谱AI配置导入完成，从第1步重新开始自动跳转');
                    autoJumpFromAIStep(1);
                }, 500);
                
            } else {
                alert('配置文件中没有找到智谱AI配置！');
            }
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                alert('无法访问剪切板，请允许剪切板权限或选择文件导入');
                importAIConfigFromFile();
            } else {
                alert('配置格式错误！');
            }
        }
    } else {
        // 从JSON文件导入
        importAIConfigFromFile();
    }
};

// 从JSON文件导入智谱AI配置
const importAIConfigFromFile = () => {
    console.log('📁📁📁 importAIConfigFromFile被调用');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        console.log('📄 文件选择器onChange事件触发');
        const file = e.target.files[0];
        if (file) {
            console.log(`✅ 用户选择了文件: ${file.name}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    if (config.zhipuApiKey) {
                        simpleConfig.set('zhipuApiKey', config.zhipuApiKey);
                        showMessage('智谱AI配置从JSON导入成功！', 'success');
                        
                        // 重新加载当前配置到表单
                        const apiKeyInput = document.getElementById('aiApiKey');
                        if (apiKeyInput) {
                            apiKeyInput.value = config.zhipuApiKey;
                        }
                        
                        // 重置所有步骤为待验证状态并回到第1步重新开始自动跳转
                        resetAllAIStepsToRevalidation();
                        showAIStep(1);
                        setTimeout(() => {
                            console.log('📥 智谱AI配置导入完成，从第1步重新开始自动跳转');
                            autoJumpFromAIStep(1);
                        }, 500);
                        
                    } else {
                        alert('配置文件中没有找到智谱AI配置！');
                    }
                } catch (error) {
                    alert('配置文件格式错误！');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

const exportAIConfig = () => {
    const config = {
        zhipuApiKey: simpleConfig.get('zhipuApiKey') || ''
    };
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = '智谱AI设置.json';
    link.click();
    
    URL.revokeObjectURL(link.href);
};

// 移动端进度条更新函数
const updateMobileProgress = (stepNumber, totalSteps, progressType = 'audio') => {
    const progressFillId = progressType === 'audio' ? 'audioProgressFill' : 'aiProgressFill';
    const progressFill = document.getElementById(progressFillId);
    
    if (progressFill) {
        const progressPercentage = (stepNumber / totalSteps) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        console.log(`📱 更新${progressType}进度条: ${stepNumber}/${totalSteps} (${progressPercentage}%)`);
    }
};

// 导出函数供外部调用
window.createAudioSetupOverlay = createAudioSetupOverlay;
window.createAISetupOverlay = createAISetupOverlay;
window.updateMobileProgress = updateMobileProgress;
window.initAudioSetup = initAudioSetup;

// 重置所有智谱AI步骤为待验证状态
const resetAllAIStepsToRevalidation = () => {
    console.log('🔄 重置所有智谱AI步骤为待验证状态');
    
    // 重置所有步骤圆圈为pending状态
    for (let i = 1; i <= 3; i++) {
        const circle = document.getElementById(`ai-step${i}-circle`);
        const line = document.getElementById(`ai-step${i}-line`);
        const content = document.getElementById(`ai-step${i}-content`);
        
        if (circle) {
            circle.classList.remove('active', 'completed');
            circle.classList.add('pending');
        }
        if (line) {
            line.classList.remove('completed');
        }
        if (content) {
            content.classList.remove('completed', 'active');
        }
        
        // 清除步骤状态信息
        const statusElement = document.getElementById(`ai-step${i}-status`);
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = '';
            statusElement.style.display = 'none';
        }
    }
    
    console.log('✅ 所有智谱AI步骤状态已重置');
};

// 智谱AI步骤自动跳转管理器
const createAIStepAutoJumpManager = () => {
    return {
        // 步骤配置
        stepConfigs: {
            1: {
                name: '注册智谱AI',
                canAutoJump: () => {
                    // 检查是否之前完成过
                    return simpleConfig.isSettingTested('ai_step1');
                },
                jumpFunction: () => completeAIStep1()
            },
            2: {
                name: '配置API Key',
                canAutoJump: () => {
                    // 检查是否有保存的API Key
                    const apiKey = simpleConfig.get('zhipuApiKey');
                    return apiKey && apiKey.trim() !== '';
                },
                jumpFunction: () => validateAIStep2()
            },
            3: {
                name: 'API测试',
                canAutoJump: () => {
                    // 检查是否已启用AI功能
                    return simpleConfig.get('aiEnabled') === true;
                },
                jumpFunction: () => {
                    // 第3步是测试步骤，不自动跳转，只显示
                    console.log('🎯 智谱AI第3步是测试步骤，显示测试界面');
                    return true;
                }
            }
        },

        // 检查步骤是否可以自动跳转
        canStepAutoJump(stepNumber) {
            const config = this.stepConfigs[stepNumber];
            if (!config) {
                console.log(`❌ 找不到智谱AI步骤${stepNumber}的配置`);
                return false;
            }

            const canJump = config.canAutoJump();
            console.log(`🔍 智谱AI步骤${stepNumber}(${config.name})自动跳转检查: ${canJump ? '✅可以' : '❌不可以'}`);
            return canJump;
        },

        // 执行步骤跳转
        async executeStepJump(stepNumber) {
            const config = this.stepConfigs[stepNumber];
            if (!config) {
                console.log(`❌ 找不到智谱AI步骤${stepNumber}的配置`);
                return false;
            }

            try {
                console.log(`🚀 执行智谱AI步骤${stepNumber}(${config.name})的跳转函数`);
                const result = await config.jumpFunction();
                console.log(`✅ 智谱AI步骤${stepNumber}跳转函数执行完成，结果: ${result}`);
                return result !== false; // 只有明确返回false才算失败
            } catch (error) {
                console.error(`❌ 智谱AI步骤${stepNumber}跳转函数执行失败:`, error);
                return false;
            }
        },

        // 从指定步骤开始自动跳转
        async autoJumpFromStep(startStep) {
            console.log(`🎯 开始从智谱AI步骤${startStep}自动跳转`);
            
            for (let step = startStep; step <= 3; step++) {
                if (!this.canStepAutoJump(step)) {
                    console.log(`⏹️ 智谱AI步骤${step}不能自动跳转，停止连跳`);
                    // 显示当前应该停留的步骤
                    showAIStep(step);
                    break;
                }
                
                const success = await this.executeStepJump(step);
                if (!success) {
                    console.log(`❌ 智谱AI步骤${step}跳转失败，停止连跳`);
                    break;
                }
                
                console.log(`✅ 智谱AI步骤${step}跳转成功，继续下一步`);
            }
        }
    };
};

// 全局智谱AI步骤跳转管理器
let aiStepAutoJumpManager = null;

// 从指定步骤开始智谱AI自动跳转的全局函数
const autoJumpFromAIStep = async (startStep) => {
    console.log(`🚀🚀🚀 autoJumpFromAIStep被调用，startStep=${startStep}`);
    
    if (!aiStepAutoJumpManager) {
        aiStepAutoJumpManager = createAIStepAutoJumpManager();
    }
    await aiStepAutoJumpManager.autoJumpFromStep(startStep);
};

// 导出智谱AI相关函数
window.completeAIStep1 = completeAIStep1;
window.validateAIStep2 = validateAIStep2;
window.completeAIStep3 = completeAIStep3;
window.goBackToAIStep = goBackToAIStep;
window.sendTestMessage = sendTestMessage;
window.importAIConfig = importAIConfig;
window.importAIConfigFromFile = importAIConfigFromFile;
window.exportAIConfig = exportAIConfig;
window.resetAllAIStepsToRevalidation = resetAllAIStepsToRevalidation;
window.autoJumpFromAIStep = autoJumpFromAIStep;
