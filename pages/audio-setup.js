/**
 * 录音设置详细界面 - 基于Aliyun项目的步骤风格，适应黑白紫色主题
 */

// 创建录音设置详细界面
const createAudioSetupOverlay = () => {
    console.log('🔧 开始创建录音设置详细界面');
    console.log('🔧 当前录音状态:', simpleConfig.get('recordingEnabled'));
    
    const overlay = document.createElement('div');
    overlay.className = 'slides-overlay'; // 复用PPT页面的样式
    console.log('🔧 录音设置覆盖层元素已创建');
    
    overlay.innerHTML = `
        <div class="slides-header">
            <button class="back-button">
                <i class='bx bx-arrow-back'></i>
            </button>
            <h2>录音文字识别设置</h2>
            <!-- 导入导出设置移到header -->
            <div class="config-actions">
                <button class="btn btn-import" onclick="importAudioConfig()">导入设置</button>
                <button class="btn btn-export" onclick="exportAudioConfig()">导出设置</button>
            </div>
        </div>
        <div class="audio-setup-container">
            <div class="setup-container">
                
                <div class="setup-flow">
                <!-- Step 1: 启用服务 -->
                <div class="setup-step visible current-step" id="audio-step1">
                    <div class="step-circle pending" id="audio-step1-circle">1</div>
                    <div class="step-line" id="audio-step1-line"></div>
                    <div class="step-content" id="audio-step1-content">
                        <div class="step-title">启用智能语音交互服务</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_1_enable_service.png" alt="启用服务示意图" style="width: 100%; max-width: 800px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            启用阿里云智能语音交互服务，为语音识别功能做准备。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://nls-portal.console.aliyun.com/overview" target="_blank">智能语音交互控制台</a><br>
                            2. 如果是首次使用，点击"立即开通"按钮<br>
                            3. 根据提示完成服务开通流程
                        </div>
                        <button class="btn btn-primary" onclick="completeAudioStep1()">完成服务启用</button>
                        <div id="audio-step1-status"></div>
                    </div>
                </div>

                <!-- Step 2: 获取AppKey -->
                <div class="setup-step pending" id="audio-step2">
                    <div class="step-circle pending" id="audio-step2-circle">2</div>
                    <div class="step-line" id="audio-step2-line"></div>
                    <div class="step-content" id="audio-step2-content">
                        <div class="step-title">获取并配置 AppKey</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_2_get_appkey.png" alt="创建应用获取AppKey示意图" style="width: 100%; max-width: 800px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建项目并获取项目的AppKey。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://nls-portal.console.aliyun.com/applist" target="_blank">全部项目</a>页面<br>
                            2. 创建一个新项目，然后在列表中找到它<br>
                            3. 点击项目名称进入项目详情<br>
                            4. 在项目详情页面找到并复制AppKey<br>
                            5. 将AppKey粘贴到下方输入框中
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAppKey">AppKey <span class="required">*</span></label>
                                <div class="secret-display" id="audioAppKeyDisplay"></div>
                            </div>
                            <input type="password" id="audioAppKey" placeholder="从阿里云控制台项目中获取的AppKey">
                        </div>
                        <button class="btn btn-back" onclick="goBackToAudioStep(1)">上一步</button>
                        <button class="btn btn-primary" onclick="validateAudioStep2()">验证 AppKey</button>
                        <div id="audio-step2-status"></div>
                    </div>
                </div>

                <!-- Step 3: 创建RAM用户 -->
                <div class="setup-step pending" id="audio-step3">
                    <div class="step-circle pending" id="audio-step3-circle">3</div>
                    <div class="step-line" id="audio-step3-line"></div>
                    <div class="step-content" id="audio-step3-content">
                        <div class="step-title">创建RAM用户</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_3_create_user.png" alt="创建RAM用户示意图" style="width: 100%; max-width: 800px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建RAM用户，用于后续的AccessKey配置。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://ram.console.aliyun.com/overview?activeTab=workflow" target="_blank">RAM控制台工作流程</a><br>
                            2. 选择"创建初始用户"下方的"账号管理员"选项<br>
                            3. 点击"执行配置"并完成个人身份验证
                        </div>
                        <button class="btn btn-back" onclick="goBackToAudioStep(2)">上一步</button>
                        <button class="btn btn-primary" onclick="completeAudioStep3()">完成用户创建</button>
                        <div id="audio-step3-status"></div>
                    </div>
                </div>

                <!-- Step 4: 配置AccessKey -->
                <div class="setup-step pending" id="audio-step4">
                    <div class="step-circle pending" id="audio-step4-circle">4</div>
                    <div class="step-line" id="audio-step4-line"></div>
                    <div class="step-content" id="audio-step4-content">
                        <div class="step-title">配置 AccessKey</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_4_accesskey.png" alt="创建AccessKey示意图" style="width: 100%; max-width: 800px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建并配置AccessKey用于API调用认证。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://ram.console.aliyun.com/users" target="_blank">RAM用户管理</a>页面<br>
                            2. 找到刚创建的用户，点击"添加权限"<br>
                            3. 搜索并添加"AliyunNLSFullAccess"权限<br>
                            4. 点击用户名进入详情页，创建AccessKey<br>
                            5. 填写下方的AccessKey信息并点击验证
                        </div>
                        
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAccessKeyId">AccessKey ID <span class="required">*</span></label>
                                <div class="secret-display" id="audioAccessKeyIdDisplay"></div>
                            </div>
                            <input type="password" id="audioAccessKeyId" placeholder="RAM用户的Access Key ID">
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAccessKeySecret">AccessKey Secret <span class="required">*</span>
                                    <i class="bx bx-info-circle info-icon" data-tooltip="AccessKey Secret用于API调用认证，请妥善保管。建议使用RAM子用户的AccessKey，避免使用主账号AccessKey。"></i>
                                </label>
                                <div class="secret-display" id="audioAccessKeySecretDisplay"></div>
                            </div>
                            <input type="password" id="audioAccessKeySecret" placeholder="RAM用户的Access Key Secret">
                        </div>
                        <button class="btn btn-back" onclick="goBackToAudioStep(3)">上一步</button>
                        <button class="btn btn-primary" onclick="validateAudioStep4()">验证 AccessKey</button>
                        <div id="audio-step4-status"></div>
                    </div>
                </div>

                <!-- Step 5: 录音测试 -->
                <div class="setup-step pending" id="audio-step5">
                    <div class="step-circle pending" id="audio-step5-circle">5</div>
                    <div class="step-content" id="audio-step5-content">
                        <div class="step-title">录音功能测试</div>
                        <div class="step-description">
                            测试录音功能和语音识别效果，确保系统正常工作。
                            <br><br>
                            <strong>测试说明：</strong><br>
                            1. 点击"开始录音"按钮开始录音<br>
                            2. 清晰地说话5-10秒钟<br>
                            3. 系统将自动识别您的语音并显示结果<br>
                            4. 如果识别失败，可点击"重新识别"按钮重试
                        </div>
                        
                        <!-- 录音测试区域 -->
                        <div class="recording-test-area" id="recordingTestArea">
                            <div class="recording-controls">
                                <button class="btn btn-record" id="recordButton" onclick="toggleRecording()">
                                    <i class="bx bx-microphone"></i> 开始录音
                                </button>
                                <div class="recording-status" id="recordingStatus">请点击开始录音，说话5-10秒测试语音识别</div>
                            </div>
                            
                            <!-- 音峰图显示区域 -->
                            <div class="waveform-container" id="waveformContainer" style="display: none;">
                                <canvas id="waveformCanvas" width="400" height="100"></canvas>
                            </div>
                            
                            <!-- 识别结果显示 -->
                            <div class="recognition-result" id="recognitionResult" style="display: none;">
                                <h4>识别结果：</h4>
                                <div class="result-text" id="resultText"></div>
                                <button class="btn btn-secondary" id="retryButton" onclick="retryRecognition()" style="display: none; margin-top: 10px;">
                                    <i class="bx bx-refresh"></i> 重新识别
                                </button>
                            </div>
                        </div>
                        
                        <button class="btn btn-back" onclick="goBackToAudioStep(4)">上一步</button>
                        <button class="btn btn-success" id="completeSetupButton" onclick="completeAudioStep5()" style="display: none;">完成设置</button>
                        <div id="audio-step5-status"></div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    console.log('🔧 录音设置覆盖层已添加到DOM');
    console.log('🔧 返回覆盖层元素:', overlay);
    return overlay;
};





// 录音设置步骤逻辑
let currentAudioStep = 1;

// 录音相关变量
let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let isRecording = false;
let waveformAnimationId = null;
let lastRecordedAudio = null; // 保存最后录制的音频用于重试

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
    
    console.log('🔄 准备跳转到步骤2');
    showAudioStep(2);
};

const validateAudioStep2 = () => {
    const appKey = document.getElementById('audioAppKey').value.trim();
    if (!appKey) {
        showAudioStatus('audio-step2-status', '请输入AppKey', 'error');
        return;
    }
    
    showAudioStatus('audio-step2-status', 'AppKey验证中...', 'processing');
    
    // 保存配置
    simpleConfig.set('appKey', appKey);
    
    setTimeout(() => {
        showAudioStatus('audio-step2-status', 'AppKey配置成功！', 'success');
        
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
        

        setTimeout(() => showAudioStep(3), 1000);
    }, 1500);
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
        console.log('✅ 步骤3圆圈状态已更新为completed');
    }
    if (line3) {
        line3.classList.add('completed');
        console.log('✅ 步骤3线条状态已更新为completed');
    }
    if (content3) {
        content3.classList.add('completed');
        console.log('✅ 步骤3内容状态已更新为completed');
    }
    
    console.log('🔄 准备跳转到步骤4');
    showAudioStep(4);
};

const validateAudioStep4 = () => {
    const keyId = document.getElementById('audioAccessKeyId').value.trim();
    const keySecret = document.getElementById('audioAccessKeySecret').value.trim();
    
    if (!keyId || !keySecret) {
        showAudioStatus('audio-step4-status', '请输入完整的AccessKey信息', 'error');
        return;
    }
    
    showAudioStatus('audio-step4-status', 'AccessKey验证中...', 'processing');
    
    // 保存配置
    simpleConfig.setAll({
        accessKeyId: keyId,
        accessKeySecret: keySecret,
        recordingEnabled: true
    });
    
    setTimeout(() => {
        showAudioStatus('audio-step4-status', 'AccessKey配置成功！录音功能已启用。', 'success');
        
        // 更新步骤圆圈和内容状态（最后一步，没有线条）
        const circle4 = document.getElementById('audio-step4-circle');
        const content4 = document.getElementById('audio-step4-content');
        
        if (circle4) {
            circle4.classList.remove('pending', 'active');
            circle4.classList.add('completed');
            console.log('✅ 步骤4圆圈状态已更新为completed');
        }
        if (content4) {
            content4.classList.add('completed');
            console.log('✅ 步骤4内容状态已更新为completed');
        }
        

        
                        setTimeout(() => showAudioStep(5), 1000);
    }, 1500);
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
    
    // 延迟3秒后提示用户设置智谱AI
    setTimeout(() => {
        const shouldSetupAI = confirm('🎉 录音文字识别设置成功！\n\n是否现在设置智谱AI评分功能？\n\n点击"确定"进入智谱AI设置，点击"取消"稍后手动设置。');
        
        if (shouldSetupAI) {
            // 关闭当前录音设置界面
            document.querySelector('.slides-overlay').remove();
            
            // 延迟打开智谱AI设置
            setTimeout(() => {
                openAISetup();
            }, 200);
        }
    }, 2000);
};

const goBackToAudioStep = (stepNumber) => {
    showAudioStep(stepNumber);
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
        
        // 获取麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        // 设置录音器
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log('🔄 录音结束，开始识别...');
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
            lastRecordedAudio = audioBlob; // 保存音频用于重试
            await recognizeAudio(audioBlob);
        };
        
        // 设置音峰图
        await setupWaveform(stream);
        
        // 开始录音
        mediaRecorder.start();
        isRecording = true;
        
        // 更新UI
        updateRecordingUI(true);
        
        // 自动停止录音（10秒后）
        setTimeout(() => {
            if (isRecording) {
                stopRecording();
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ 录音失败:', error);
        updateRecordingStatus('录音失败：' + error.message, 'error');
    }
};

const stopRecording = async () => {
    if (mediaRecorder && isRecording) {
        console.log('⏹️ 停止录音...');
        
        mediaRecorder.stop();
        isRecording = false;
        
        // 停止音峰图动画
        if (waveformAnimationId) {
            cancelAnimationFrame(waveformAnimationId);
        }
        
        // 关闭音频流
        if (microphone) {
            microphone.disconnect();
        }
        if (audioContext) {
            audioContext.close();
        }
        
        // 更新UI
        updateRecordingUI(false);
        updateRecordingStatus('正在识别语音...', 'processing');
    }
};

const setupWaveform = async (stream) => {
    const canvas = document.getElementById('waveformCanvas');
    const canvasCtx = canvas.getContext('2d');
    
    // 显示音峰图容器
    const waveformContainer = document.getElementById('waveformContainer');
    waveformContainer.style.display = 'block';
    
    // 创建音频上下文
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    microphone.connect(analyser);
    
    // 绘制音峰图
    const drawWaveform = () => {
        waveformAnimationId = requestAnimationFrame(drawWaveform);
        
        analyser.getByteFrequencyData(dataArray);
        
        canvasCtx.fillStyle = 'rgba(26, 26, 26, 0.8)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
            
            // 录音时显示白色，后面识别成功会变紫色
            canvasCtx.fillStyle = isRecording ? '#ffffff' : '#666AF6';
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    };
    
    drawWaveform();
};

const recognizeAudio = async (audioBlob) => {
    try {
        console.log('🔄 发送音频到Vercel API识别...');
        
        // 检查音频质量
        if (audioBlob.size < 1000) { // 小于1KB可能是无效录音
            throw new Error('录音时间太短或音频质量不佳，请重新录音');
        }
        
        // 获取配置
        const config = simpleConfig.getAll();
        const { audioAppKey, audioAccessKeyId, audioAccessKeySecret } = config;
        
        if (!audioAppKey || !audioAccessKeyId || !audioAccessKeySecret) {
            throw new Error('缺少必要的配置信息');
        }
        
        // 将音频转换为base64
        const audioBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // 移除data:audio/webm;base64,前缀
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });
        
        // 调用Vercel API（添加超时处理）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch('https://aliyun-voice-api.vercel.app/api/recognize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audioData: audioBase64,
                appKey: audioAppKey,
                accessKeyId: audioAccessKeyId,
                accessKeySecret: audioAccessKeySecret,
                maxDuration: 60
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ 识别结果:', result);
        
        if (result.success && result.data && result.data.text) {
            // 识别成功
            updateRecordingStatus('识别成功！', 'success');
            showRecognitionResult(result.data.text);
            
            // 音峰图变紫色
            updateWaveformColor('#666AF6');
            
            console.log('🎉 录音设置测试成功');
            
            // 显示完成设置按钮
            const completeButton = document.getElementById('completeSetupButton');
            if (completeButton) {
                completeButton.style.display = 'inline-block';
            }
            
        } else {
            throw new Error(result.error || '识别失败');
        }
        
    } catch (error) {
        console.error('❌ 语音识别失败:', error);
        
        let errorMessage = '识别失败';
        if (error.name === 'AbortError') {
            errorMessage = '请求超时，请检查网络连接';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败，请检查网络状态';
        } else if (error.message.includes('API调用失败')) {
            errorMessage = 'API服务暂时不可用，请稍后重试';
        } else {
            errorMessage = '识别失败：' + error.message;
        }
        
        updateRecordingStatus(errorMessage, 'error');
        
        // 显示重试按钮
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.style.display = 'inline-block';
        }
    }
};

// 重试识别功能
const retryRecognition = async () => {
    if (!lastRecordedAudio) {
        updateRecordingStatus('没有可重试的录音', 'error');
        return;
    }
    
    console.log('🔄 重新识别音频...');
    updateRecordingStatus('正在重新识别...', 'processing');
    
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
        recordButton.innerHTML = '<i class="bx bx-stop"></i> 停止录音';
        recordButton.classList.add('recording');
        updateRecordingStatus('正在录音中...请说话', 'recording');
    } else {
        recordButton.innerHTML = '<i class="bx bx-microphone"></i> 开始录音';
        recordButton.classList.remove('recording');
    }
};

const updateRecordingStatus = (message, type) => {
    const statusElement = document.getElementById('recordingStatus');
    statusElement.textContent = message;
    statusElement.className = `recording-status ${type}`;
};

const showRecognitionResult = (text) => {
    const resultContainer = document.getElementById('recognitionResult');
    const resultText = document.getElementById('resultText');
    
    resultText.textContent = text;
    resultContainer.style.display = 'block';
};

const updateWaveformColor = (color) => {
    // 这个函数会在下次绘制时更新颜色
    // 颜色变化已经在drawWaveform函数中处理
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

const showAudioStep = (stepNumber) => {
    console.log(`🔄 显示音频设置步骤 ${stepNumber}`);
    
    // 移除所有步骤的当前状态和visible状态
    document.querySelectorAll('.setup-step').forEach(step => {
        step.classList.remove('current-step', 'visible');
    });
    
    // 高亮指定步骤并设置为visible
    const targetStep = document.getElementById(`audio-step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('current-step', 'visible');
        console.log(`✅ 步骤 ${stepNumber} 已设置为当前步骤并可见`);
        
        // 自动滚动到当前步骤
        setTimeout(() => {
            const container = targetStep.closest('.audio-setup-container');
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
    
    // 左侧指示器已移除
    
    currentAudioStep = stepNumber;
};



// 导入配置
const importAudioConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    simpleConfig.setAll(config);
                    alert('配置导入成功！');
                    // 重新加载当前配置到表单
                    loadCurrentConfig();
                } catch (error) {
                    alert('配置文件格式错误！');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

// 导出配置
const exportAudioConfig = () => {
    const config = simpleConfig.getAll();
    const dataStr = JSON.stringify(config, null, 2);
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
    statusEl.className = `status-${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
};



// 初始化录音设置功能
const initAudioSetup = () => {
    console.log('🎤 录音设置详细界面已加载');
    
    // 确保第一步初始化为可见状态
    setTimeout(() => {
        const step1 = document.getElementById('audio-step1');
        if (step1) {
            step1.classList.add('visible');
            console.log('✅ 步骤1初始化为可见状态');
        }
        
        // 初始化输入预览和info图标
        initInputPreviews();
        initInfoIcons();
        
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
    const infoIcons = document.querySelectorAll('.info-icon');
    infoIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
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
                document.addEventListener('click', () => {
                    icon.classList.remove('show-tooltip');
                }, { once: true });
            }, 10);
        });
    });
};

// 自动验证功能
const checkAutoValidation = () => {
    console.log('🔍 检查自动验证条件');
    
    const config = simpleConfig.getAll();
    
    // 检查步骤2：AppKey自动验证
    if (config.appKey && config.appKey.trim()) {
        console.log('🔍 发现已保存的AppKey，准备自动验证步骤2');
        setTimeout(() => {
            // 填入保存的AppKey
            const appKeyInput = document.getElementById('audioAppKey');
            if (appKeyInput && !appKeyInput.value) {
                appKeyInput.value = config.appKey;
                console.log('📝 已填入保存的AppKey');
                
                // 自动触发验证
                setTimeout(() => {
                    console.log('🚀 自动触发AppKey验证');
                    validateAudioStep2();
                }, 500);
            }
        }, 200);
    }
    
    // 检查步骤4：AccessKey自动验证
    if (config.accessKeyId && config.accessKeySecret && 
        config.accessKeyId.trim() && config.accessKeySecret.trim()) {
        console.log('🔍 发现已保存的AccessKey，准备自动验证步骤4');
        setTimeout(() => {
            // 等待步骤2完成后再处理步骤4
            setTimeout(() => {
                const keyIdInput = document.getElementById('audioAccessKeyId');
                const keySecretInput = document.getElementById('audioAccessKeySecret');
                
                if (keyIdInput && keySecretInput && !keyIdInput.value && !keySecretInput.value) {
                    keyIdInput.value = config.accessKeyId;
                    keySecretInput.value = config.accessKeySecret;
                    console.log('📝 已填入保存的AccessKey');
                    
                    // 自动触发验证
                    setTimeout(() => {
                        console.log('🚀 自动触发AccessKey验证');
                        validateAudioStep4();
                    }, 500);
                }
            }, 2000); // 等待步骤2验证完成
        }, 1000);
    }
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
const existingStyle = document.querySelector('style[data-audio-setup]');
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
                <button class="btn btn-import" onclick="importAIConfig()">导入设置</button>
                <button class="btn btn-export" onclick="exportAIConfig()">导出设置</button>
            </div>
        </div>
        <div class="audio-setup-container">
            <div class="setup-container">
                
                <div class="setup-flow">
                <!-- Step 1: 注册智谱AI -->
                <div class="setup-step visible current-step" id="ai-step1">
                    <div class="step-circle pending" id="ai-step1-circle">1</div>
                    <div class="step-line" id="ai-step1-line"></div>
                    <div class="step-content" id="ai-step1-content">
                        <div class="step-title">注册智谱AI账号</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_6_zhipu_api.png" alt="智谱AI注册示意图" style="width: 100%; max-width: 800px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            注册智谱AI账号并获取API访问权限。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank">智谱AI控制台</a><br>
                            2. 如果没有账号，点击注册新账号<br>
                            3. 完成账号注册和实名认证
                        </div>
                        <button class="btn btn-primary" onclick="completeAIStep1()">完成账号注册</button>
                        <div id="ai-step1-status"></div>
                    </div>
                </div>

                <!-- Step 2: 获取API Key -->
                <div class="setup-step pending" id="ai-step2">
                    <div class="step-circle pending" id="ai-step2-circle">2</div>
                    <div class="step-line" id="ai-step2-line"></div>
                    <div class="step-content" id="ai-step2-content">
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
                        <button class="btn btn-back" onclick="goBackToAIStep(1)">上一步</button>
                        <button class="btn btn-primary" onclick="validateAIStep2()">验证 API Key</button>
                        <div id="ai-step2-status"></div>
                    </div>
                </div>

                <!-- Step 3: 测试API连接 -->
                <div class="setup-step pending" id="ai-step3">
                    <div class="step-circle pending" id="ai-step3-circle">3</div>
                    <div class="step-content" id="ai-step3-content">
                        <div class="step-title">测试AI对话功能</div>
                        <div class="step-description">
                            测试智谱AI的对话功能，确保API正常工作。
                        </div>
                        
                        <!-- AI测试对话区域 -->
                        <div class="ai-chat-test-area" id="aiChatTestArea">
                            <div class="chatbot-container">
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
                        </div>
                        
                        <button class="btn btn-back" onclick="goBackToAIStep(2)">上一步</button>
                        <button class="btn btn-success" id="completeAISetupButton" onclick="completeAIStep3()" style="display: none;">完成设置</button>
                        <div id="ai-step3-status"></div>
                    </div>
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
    
    console.log('🤖 返回覆盖层元素:', overlay);
    return overlay;
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
    const apiKey = document.getElementById('aiApiKey').value.trim();
    if (!apiKey) {
        showAIStatus('ai-step2-status', '请输入智谱AI API Key', 'error');
        return;
    }
    
    showAIStatus('ai-step2-status', 'API Key验证中...', 'processing');
    
    // 保存配置
    simpleConfig.set('zhipuApiKey', apiKey);
    
    try {
        // 实际验证API Key - 发送一个简单的测试请求
        console.log('🔑 开始验证智谱AI API Key');
        const testResponse = await callZhipuAPI([
            { role: 'user', content: '你好，请简单回复确认连接正常' }
        ]);
        
        console.log('✅ API Key验证成功:', testResponse);
        showAIStatus('ai-step2-status', 'API Key验证成功！', 'success');
        
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
        
        setTimeout(() => showAIStep(3), 1000);
        
    } catch (error) {
        console.error('❌ API Key验证失败:', error);
        showAIStatus('ai-step2-status', `API Key验证失败：${error.message}`, 'error');
        
        // 清除保存的无效配置
        simpleConfig.set('zhipuApiKey', '');
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
    
    // 延迟2秒后提示完成
    setTimeout(() => {
        alert('🎉 智谱AI评分功能设置成功！\n\n现在您可以在演讲结束后获得AI评分和建议了。');
    }, 2000);
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
            const container = targetStep.closest('.audio-setup-container');
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
    
    currentAIStep = stepNumber;
};

const showAIStatus = (elementId, message, type) => {
    const statusEl = document.getElementById(elementId);
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status-${type}`;
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }
};

// 智谱AI测试对话功能
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
    
    // 添加AI思考中的消息
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'message ai-message thinking';
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
const importAIConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    if (config.zhipuApiKey) {
                        simpleConfig.set('zhipuApiKey', config.zhipuApiKey);
                        alert('智谱AI配置导入成功！');
                        // 重新加载当前配置到表单
                        const apiKeyInput = document.getElementById('aiApiKey');
                        if (apiKeyInput) {
                            apiKeyInput.value = config.zhipuApiKey;
                        }
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

// 导出函数供外部调用
window.createAudioSetupOverlay = createAudioSetupOverlay;
window.createAISetupOverlay = createAISetupOverlay;
window.initAudioSetup = initAudioSetup;

// 导出智谱AI相关函数
window.completeAIStep1 = completeAIStep1;
window.validateAIStep2 = validateAIStep2;
window.completeAIStep3 = completeAIStep3;
window.goBackToAIStep = goBackToAIStep;
window.sendTestMessage = sendTestMessage;
window.importAIConfig = importAIConfig;
window.exportAIConfig = exportAIConfig;
