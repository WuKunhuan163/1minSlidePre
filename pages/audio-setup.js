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
                    <div class="step-content" id="audio-step4-content">
                        <div class="step-title">配置 AccessKey</div>
                        <div class="step-image">
                            <img src="assets/images/settings/step_4_accesskey.png" alt="创建AccessKey示意图" style="width: 100%; max-width: 800px; height: auto; margin: 15px 0; border-radius: 8px;">
                        </div>
                        <div class="step-description">
                            创建并配置AccessKey用于API调用认证，然后进行录音测试验证。
                            <br><br>
                            <strong>操作步骤：</strong><br>
                            1. 前往<a href="https://ram.console.aliyun.com/users" target="_blank">RAM用户管理</a>页面<br>
                            2. 找到刚创建的用户，点击"添加权限"<br>
                            3. 搜索并添加"AliyunNLSFullAccess"权限<br>
                            4. 点击用户名进入详情页，创建AccessKey<br>
                            5. 配置完成后，点击下方按钮进行录音测试
                        </div>
                        
                        <!-- 录音测试区域 -->
                        <div class="recording-test-area" id="recordingTestArea" style="display: none;">
                            <div class="recording-controls">
                                <button class="btn btn-record" id="recordButton" onclick="toggleRecording()">
                                    <i class="bx bx-microphone"></i> 开始录音测试
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
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAccessKeyId">Access Key ID <span class="required">*</span></label>
                                <div class="secret-display" id="audioAccessKeyIdDisplay"></div>
                            </div>
                            <input type="password" id="audioAccessKeyId" placeholder="RAM用户的Access Key ID">
                        </div>
                        <div class="form-group">
                            <div class="label-row">
                                <label for="audioAccessKeySecret">Access Key Secret <span class="required">*</span>
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
            </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
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
        

        
        setTimeout(() => {
            // 显示录音测试区域
            const recordingTestArea = document.getElementById('recordingTestArea');
            if (recordingTestArea) {
                recordingTestArea.style.display = 'block';
                console.log('🎤 显示录音测试区域');
            }
            
            // 暂时不标记为已测试，需要录音测试成功后才标记
            console.log('✅ AccessKey配置完成，请进行录音测试验证');
        }, 2000);
    }, 1500);
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
        
        // 调用Vercel API
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
            })
        });
        
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
            
            // 标记录音设置为已测试
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
            
            console.log('🎉 录音设置测试成功，可以进行下一步');
            
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
            }, 3000);
            
        } else {
            throw new Error(result.error || '识别失败');
        }
        
    } catch (error) {
        console.error('❌ 语音识别失败:', error);
        updateRecordingStatus('识别失败：' + error.message, 'error');
    }
};

const updateRecordingUI = (recording) => {
    const recordButton = document.getElementById('recordButton');
    if (recording) {
        recordButton.innerHTML = '<i class="bx bx-stop"></i> 停止录音';
        recordButton.classList.add('recording');
        updateRecordingStatus('正在录音中...请说话', 'recording');
    } else {
        recordButton.innerHTML = '<i class="bx bx-microphone"></i> 开始录音测试';
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

// 导出函数供外部调用
window.createAudioSetupOverlay = createAudioSetupOverlay;
window.initAudioSetup = initAudioSetup;
