// 摄像头设置管理器
class CameraSetupManager {
    constructor() {
        this.settingId = 'camera';
        this.stepManager = null;
        this.permissionGranted = false;
        this.devicesDetected = false;
        this.availableDevices = [];
        this.selectedDeviceId = null;
        this.selectedDeviceName = null;
        this.currentStream = null;
        this.isPreviewActive = false;
        
        // 演讲者模式设置
        this.speakerPosition = 'bottom-right';
        this.speakerSize = 0.20;
        this.speakerMargin = 0.02;
        
        console.log('📹 摄像头设置管理器已创建');
        
        // 初始化步骤配置
        this.initializeSteps();
    }

    // 初始化步骤配置
    initializeSteps() {
        this.steps = [
            {
                id: 'step1',
                title: '请求摄像头权限',
                content: {
                    description: `
                        需要摄像头权限录制演讲视频。
                    `,
                    custom: () => this.generatePermissionInterface()
                },
                buttons: [
                    {
                        id: 'requestBtn',
                        text: '请求权限',
                        type: 'secondary',
                        onClick: () => this.requestCameraPermission(),
                        show: false  // 默认隐藏，只在权限失败时显示
                    }
                ],
                autoJumpCondition: () => this.validatePermissionGranted(),
                onEnter: () => this.initializePermissionStep(),
                validation: () => this.validatePermissionGranted()
            },
            {
                id: 'step2',
                title: '摄像头设备选择',
                content: {
                    description: `
                        选择摄像头设备并确认预览正常。
                    `,
                    custom: () => this.generateDeviceSelectionInterface()
                },
                buttons: [
                    {
                        id: 'backBtn',
                        text: '上一步',
                        type: 'back',
                        onClick: () => this.stepManager.prevStep(),
                        show: true
                    },
                    {
                        id: 'nextBtn',
                        text: '下一步',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.stepManager.nextStep(),
                        show: false
                    }
                ],
                onEnter: () => this.initializeDeviceSelection(),
                validation: () => this.selectedDeviceId !== null
            },
            {
                id: 'step3',
                title: '演讲者模式设置',
                content: {
                    description: `
                        配置演讲者在录屏中的位置和大小。
                        <br><br>
                        <div class="speaker-settings">
                            <div class="setting-group">
                                <label for="speakerPosition">演讲者位置：</label>
                                <select id="speakerPosition" class="form-control">
                                    <option value="top-left">左上角</option>
                                    <option value="top">上方中央</option>
                                    <option value="top-right">右上角</option>
                                    <option value="left">左侧中央</option>
                                    <option value="right">右侧中央</option>
                                    <option value="bottom-left">左下角</option>
                                    <option value="bottom">下方中央</option>
                                    <option value="bottom-right" selected>右下角</option>
                                </select>
                            </div>
                            <br>
                            <div class="setting-group">
                                <label for="speakerSize">演讲者大小：</label>
                                <select id="speakerSize" class="form-control">
                                    <option value="0.12">12%</option>
                                    <option value="0.15">15%</option>
                                    <option value="0.20" selected>20%</option>
                                    <option value="0.25">25%</option>
                                    <option value="0.33">33%</option>
                                    <option value="0.40">40%</option>
                                    <option value="0.50">50%</option>
                                </select>
                            </div>
                            <br>
                            <div class="setting-group">
                                <label for="speakerMargin">边界缝隙：</label>
                                <select id="speakerMargin" class="form-control">
                                    <option value="0">0% (紧贴边缘)</option>
                                    <option value="0.02" selected>2%</option>
                                    <option value="0.05">5%</option>
                                    <option value="0.10">10%</option>
                                </select>
                            </div>
                            <br>
                            <div class="preview-section">
                                <canvas id="speakerPreviewCanvas" style="max-width: 100%; border: 1px solid #ddd; border-radius: 8px;"></canvas>
                                <br><br>
                                <button id="previewBtn" class="btn btn-secondary">预览效果</button>
                            </div>
                        </div>
                    `
                },
                buttons: [
                    {
                        id: 'prevBtn',
                        text: '上一步',
                        type: 'back',
                        onClick: () => this.stepManager.prevStep(),
                        show: true
                    },
                    {
                        id: 'completeBtn',
                        text: '完成设置',
                        type: 'success',
                        isPrimary: true,
                        onClick: () => this.completeSetup(),
                        show: true
                    }
                ],
                onEnter: () => this.initializeSpeakerSettings(),
                validation: () => true
            }
        ];
    }

    // 生成权限请求界面
    generatePermissionInterface() {
        return `
            <div class="permission-status" id="permissionStatus">
                <div class="status-item">
                    <i class='bx bx-camera' id="cameraIcon"></i>
                    <span id="cameraStatus">等待权限请求</span>
                </div>
            </div>
            
            <div class="device-section" id="deviceSection" style="display: none;">
                <h4>检测到的摄像头设备：</h4>
                <div class="device-list" id="deviceList">
                    <!-- 设备列表将动态生成 -->
                </div>
            </div>
        `;
    }

    // 生成设备选择界面
    generateDeviceSelectionInterface() {
        return `
            <div class="form-group" id="deviceSelectionGroup">
                <label for="cameraDeviceSelect">选择摄像头设备：</label>
                <select id="cameraDeviceSelect" class="form-control">
                    <option value="">选择设备...</option>
                </select>
            </div>
            
            <div class="camera-preview" id="cameraPreviewSection" style="display: none;">
                <video id="cameraPreview" width="400" height="300" autoplay muted></video>
            </div>
        `;
    }

    // 初始化步骤管理器
    initStepManager(stepManager) {
        this.stepManager = stepManager;
        console.log('📹 步骤管理器已设置');
    }

    // 创建设置界面
    createSetup() {
        // 创建步骤管理器实例（标题将由SettingsStepManager统一生成）
        this.stepManager = new SettingsStepManager({
            settingId: this.settingId,
            steps: this.steps,
            config: this.config || {},
            onComplete: () => this.handleSetupComplete(),
            onBack: () => this.handleBackToSettings()
        });

        // 创建overlay
        const overlay = this.stepManager.createOverlay();
        
        // 全局引用，供onclick事件使用
        window.cameraManager = this;
        
        return overlay;
    }

    // 处理设置完成
    handleSetupComplete() {
        console.log('✅ 摄像头设置完成');
        this.saveConfiguration();
        if (window.settingsManager) {
            window.settingsManager.refreshSetting(this.settingId);
        }
        this.cleanup();
    }

    // 处理返回设置列表
    handleBackToSettings() {
        console.log('🔙 返回设置列表');
        this.cleanup();
    }

    // 创建步骤管理器实例（保留原方法用于内部使用）
    createStepManager() {
        const stepManagerOptions = {
            settingId: this.settingId,
            steps: this.steps,
            onComplete: () => {
                console.log('✅ 摄像头设置完成');
                this.saveConfiguration();
                if (window.settingsManager) {
                    window.settingsManager.refreshSetting(this.settingId);
                }
            },
            onBack: () => {
                console.log('🔙 返回设置列表');
            }
        };
        
        return new SettingsStepManager(stepManagerOptions);
    }

    // 验证权限是否已获取
    validatePermissionGranted() {
        return this.permissionGranted && this.devicesDetected;
    }

    // 初始化设置
    async initialize() {
        console.log('📹 开始初始化摄像头设置...');
        
        try {
            // 创建并设置步骤管理器
            this.stepManager = this.createStepManager();
            
            // 显示设置界面
            this.stepManager.show();
            
            console.log('✅ 摄像头设置初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 摄像头设置初始化失败:', error);
            return false;
        }
    }

    // 初始化权限步骤 - 自动请求权限
    initializePermissionStep() {
        console.log('🔄 初始化权限步骤，自动请求摄像头权限...');
        
        // 重置权限状态
        this.permissionGranted = false;
        this.devicesDetected = false;
        
        // 自动开始权限请求
        setTimeout(() => {
            this.requestCameraPermission();
        }, 500);
        
        console.log('✅ 权限步骤已初始化，自动请求权限中...');
    }

    // 初始化设备选择步骤
    initializeDeviceSelection() {
        console.log('📹 初始化设备选择步骤...');
        
        // 填充设备下拉框
        this.populateDeviceSelectDropdown();
        
        // 绑定设备选择事件
        const deviceSelect = document.getElementById('cameraDeviceSelect');
        if (deviceSelect) {
            deviceSelect.addEventListener('change', (e) => this.handleDeviceSelection(e.target.value));
        }
        
        console.log('✅ 设备选择步骤已初始化');
    }

    // 请求摄像头权限
    async requestCameraPermission() {
        console.log('========== 请求摄像头权限方法被调用 ==========');
        console.log('当前settingId:', this.settingId);
        
        const cameraStatus = document.getElementById('cameraStatus');
        const cameraIcon = document.getElementById('cameraIcon');
        const requestBtn = document.getElementById(`${this.settingId}-step1-requestBtn`);
        const nextBtn = document.getElementById(`${this.settingId}-step1-nextBtn`);
        
        console.log('DOM元素查找结果:');
        console.log('- cameraStatus:', !!cameraStatus);
        console.log('- cameraIcon:', !!cameraIcon);
        console.log('- requestBtn:', !!requestBtn);
        console.log('- nextBtn:', !!nextBtn);
        
        try {
            console.log('📹 开始请求摄像头权限...');
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
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                    console.log('🔍 当前摄像头权限状态:', permissionStatus.state);
                } catch (permErr) {
                    console.log('⚠️ 无法查询权限状态:', permErr.message);
                }
            }
            
            this.stepManager.showStepStatus('step1', '正在请求摄像头权限...', 'info');
            
            if (cameraStatus) cameraStatus.textContent = '正在请求权限...';
            if (requestBtn) requestBtn.disabled = true;
            
            console.log('📹 调用 getUserMedia...');
            
            // 请求摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            console.log('✅ 摄像头权限获取成功');
            
            // 权限获取成功
            this.permissionGranted = true;
            
            if (cameraStatus) cameraStatus.textContent = '权限已获取';
            if (cameraIcon) {
                cameraIcon.className = 'bx bx-camera';
                cameraIcon.style.color = '#28a745';
            }
            
            // 立即关闭流（我们只是为了获取权限）
            stream.getTracks().forEach(track => track.stop());
            
            this.stepManager.showStepStatus('step1', '摄像头权限获取成功！', 'success');
            
            // 隐藏请求按钮
            this.stepManager.hideButton('step1', 'requestBtn');
            
            // 直接跳转到下一步
            setTimeout(() => {
                this.stepManager.goToStep(1, {
                    previousStepStatus: '已完成当前步骤',
                    previousStepType: 'success'
                });
            }, 1500); // 1.5秒后自动跳转，让用户看到成功消息
            
            // 检测设备
            await this.detectCameraDevices();
            
            console.log('✅ 摄像头权限请求完成');
            
        } catch (error) {
            console.error('❌ 摄像头权限请求失败:', error);
            
            let errorMessage = '摄像头权限请求失败';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = '用户拒绝了摄像头权限';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '未找到摄像头设备';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '摄像头设备被占用';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = '摄像头设备不支持请求的约束';
            } else if (error.name === 'SecurityError') {
                errorMessage = '安全错误，请使用HTTPS访问';
            }
            
            if (cameraStatus) cameraStatus.textContent = errorMessage;
            if (cameraIcon) {
                cameraIcon.className = 'bx bx-camera-off';
                cameraIcon.style.color = '#dc3545';
            }
            
            this.stepManager.showStepStatus('step1', errorMessage, 'error');
            
            // 重新启用请求按钮
            if (requestBtn) requestBtn.disabled = false;
        }
    }

    // 检测摄像头设备
    async detectCameraDevices() {
        console.log('📹 开始检测摄像头设备...');
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📹 检测到摄像头设备:', this.availableDevices.length, '个');
            this.availableDevices.forEach((device, index) => {
                console.log(`  ${index + 1}. ${device.label || `摄像头 ${index + 1}`} (${device.deviceId})`);
            });
            
            if (this.availableDevices.length > 0) {
                this.devicesDetected = true;
                this.displayDeviceList();
            } else {
                console.warn('⚠️ 未检测到摄像头设备');
                this.stepManager.showStepStatus('step1', '未检测到摄像头设备', 'warning');
            }
            
        } catch (error) {
            console.error('❌ 检测摄像头设备失败:', error);
            this.stepManager.showStepStatus('step1', '检测摄像头设备失败', 'error');
        }
    }

    // 显示设备列表（第一步使用）
    displayDeviceList() {
        console.log('📹 显示摄像头设备列表...');
        
        const deviceSection = document.getElementById('deviceSection');
        const deviceList = document.getElementById('deviceList');
        
        if (deviceSection && deviceList) {
            if (this.availableDevices.length > 0) {
                deviceSection.style.display = 'block';
                
                let deviceHtml = '';
                this.availableDevices.forEach((device, index) => {
                    const deviceName = device.label || `摄像头 ${index + 1}`;
                    deviceHtml += `
                        <div class="device-item" data-device-id="${device.deviceId}">
                            <div class="device-info">
                                <i class='bx bx-camera'></i>
                                <span class="device-name">${deviceName}</span>
                            </div>
                            <div class="device-status">
                                <span>可用</span>
                            </div>
                        </div>
                    `;
                });
                
                deviceList.innerHTML = deviceHtml;
            } else {
                deviceList.innerHTML = '<div class="device-item">未检测到摄像头设备</div>';
            }
        }
        
        console.log(`✅ 显示了 ${this.availableDevices.length} 个摄像头设备`);
    }

    // 填充设备下拉框（第二步使用）
    populateDeviceSelectDropdown() {
        const deviceSelect = document.getElementById('cameraDeviceSelect');
        if (!deviceSelect) {
            console.error('❌ 找不到摄像头设备选择元素');
            return;
        }
        
        // 清空现有选项
        deviceSelect.innerHTML = '<option value="">选择设备...</option>';
        
        // 添加设备选项
        this.availableDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `摄像头 ${index + 1}`;
            deviceSelect.appendChild(option);
        });
        
        console.log('📹 设备选择下拉框已更新');
    }


    // 处理设备选择变化
    async handleDeviceSelection(deviceId) {
        console.log('📹 用户选择了设备:', deviceId);
        
        if (!deviceId) {
            this.selectedDeviceId = null;
            this.selectedDeviceName = null;
            this.stopPreview();
            this.stepManager.hideButton('step2', 'nextBtn');
            return;
        }
        
        const selectedDevice = this.availableDevices.find(device => device.deviceId === deviceId);
        if (selectedDevice) {
            this.selectedDeviceId = deviceId;
            this.selectedDeviceName = selectedDevice.label || '未知设备';
            
            console.log('📹 已选择设备:', this.selectedDeviceName);
            
            // 开始预览
            await this.startPreview();
            
            // 显示下一步按钮
            this.stepManager.showButton('step2', 'nextBtn');
        }
    }

    // 开始预览
    async startPreview() {
        console.log('📹 开始摄像头预览...');
        
        if (!this.selectedDeviceId) {
            console.error('❌ 未选择设备');
            return;
        }
        
        try {
            // 停止之前的预览
            this.stopPreview();
            
            // 获取视频流
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: this.selectedDeviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            // 设置预览视频元素
            const previewVideo = document.getElementById('cameraPreview');
            const previewSection = document.getElementById('cameraPreviewSection');
            if (previewVideo) {
                previewVideo.srcObject = this.currentStream;
                if (previewSection) previewSection.style.display = 'block';
                this.isPreviewActive = true;
                console.log('✅ 摄像头预览已开始');
            }
            
        } catch (error) {
            console.error('❌ 开始摄像头预览失败:', error);
            this.stepManager.showStepStatus('step2', '摄像头预览失败', 'error');
        }
    }

    // 停止预览
    stopPreview() {
        console.log('📹 停止摄像头预览...');
        
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        const previewVideo = document.getElementById('cameraPreview');
        const previewSection = document.getElementById('cameraPreviewSection');
        if (previewVideo) {
            previewVideo.srcObject = null;
        }
        if (previewSection) {
            previewSection.style.display = 'none';
        }
        
        this.isPreviewActive = false;
        console.log('✅ 摄像头预览已停止');
    }

    // 初始化演讲者设置
    initializeSpeakerSettings() {
        console.log('📹 初始化演讲者设置...');
        
        // 设置默认值
        const positionSelect = document.getElementById('speakerPosition');
        const sizeSelect = document.getElementById('speakerSize');
        const marginSelect = document.getElementById('speakerMargin');
        const previewBtn = document.getElementById('previewBtn');
        
        if (positionSelect) {
            positionSelect.value = this.speakerPosition;
            positionSelect.addEventListener('change', (e) => {
                this.speakerPosition = e.target.value;
                console.log('📹 演讲者位置更新:', this.speakerPosition);
            });
        }
        
        if (sizeSelect) {
            sizeSelect.value = this.speakerSize;
            sizeSelect.addEventListener('change', (e) => {
                this.speakerSize = parseFloat(e.target.value);
                console.log('📹 演讲者大小更新:', this.speakerSize);
            });
        }
        
        if (marginSelect) {
            marginSelect.value = this.speakerMargin;
            marginSelect.addEventListener('change', (e) => {
                this.speakerMargin = parseFloat(e.target.value);
                console.log('📹 演讲者边距更新:', this.speakerMargin);
            });
        }
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewSpeakerMode());
        }
        
        // 自动预览
        setTimeout(() => this.previewSpeakerMode(), 500);
    }

    // 预览演讲者模式
    async previewSpeakerMode() {
        console.log('📹 预览演讲者模式...');
        
        const canvas = document.getElementById('speakerPreviewCanvas');
        if (!canvas) {
            console.error('❌ 找不到预览画布');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸 (16:9比例)
        const canvasWidth = 400;
        const canvasHeight = 225;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // 绘制背景（模拟屏幕内容）
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 绘制网格线（模拟PPT内容）
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvasWidth; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvasHeight);
            ctx.stroke();
        }
        for (let i = 0; i < canvasHeight; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvasWidth, i);
            ctx.stroke();
        }
        
        // 添加文字说明
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('屏幕录制内容', canvasWidth / 2, canvasHeight / 2);
        
        // 计算演讲者视频位置和大小
        const videoAspectRatio = 4 / 3; // 假设摄像头是4:3比例
        
        let videoWidth, videoHeight;
        const scale = this.speakerSize;
        
        // 根据画布比例计算视频大小
        if (canvasWidth / canvasHeight > videoAspectRatio) {
            videoHeight = canvasHeight * scale;
            videoWidth = videoHeight * videoAspectRatio;
        } else {
            videoWidth = canvasWidth * scale;
            videoHeight = videoWidth / videoAspectRatio;
        }
        
        const marginX = canvasWidth * this.speakerMargin;
        const marginY = canvasHeight * this.speakerMargin;
        
        let x, y;
        
        // 根据位置计算坐标
        switch (this.speakerPosition) {
            case 'top-left':
                x = marginX;
                y = marginY;
                break;
            case 'top':
                x = (canvasWidth - videoWidth) / 2;
                y = marginY;
                break;
            case 'top-right':
                x = canvasWidth - videoWidth - marginX;
                y = marginY;
                break;
            case 'left':
                x = marginX;
                y = (canvasHeight - videoHeight) / 2;
                break;
            case 'right':
                x = canvasWidth - videoWidth - marginX;
                y = (canvasHeight - videoHeight) / 2;
                break;
            case 'bottom-left':
                x = marginX;
                y = canvasHeight - videoHeight - marginY;
                break;
            case 'bottom':
                x = (canvasWidth - videoWidth) / 2;
                y = canvasHeight - videoHeight - marginY;
                break;
            case 'bottom-right':
            default:
                x = canvasWidth - videoWidth - marginX;
                y = canvasHeight - videoHeight - marginY;
                break;
        }
        
        // 绘制演讲者视频框（模拟）
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, videoWidth, videoHeight);
        
        // 绘制摄像头图标
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.min(videoWidth, videoHeight) * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('📹', x + videoWidth / 2, y + videoHeight / 2 + 10);
        
        // 绘制边框
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, videoWidth, videoHeight);
        
        console.log('✅ 演讲者模式预览完成');
    }

    // 完成设置
    completeSetup() {
        console.log('📹 完成摄像头设置...');
        
        if (this.saveConfiguration()) {
            this.stepManager.complete();
            this.cleanup();
        } else {
            this.stepManager.showStepStatus('step2', '保存配置失败', 'error');
        }
    }

    // 保存配置
    saveConfiguration() {
        if (!this.selectedDeviceId || !this.selectedDeviceName) {
            console.error('❌ 未选择摄像头设备');
            return false;
        }
        
        const config = {
            enabled: true,
            selectedDeviceId: this.selectedDeviceId,
            selectedDeviceName: this.selectedDeviceName,
            speakerSettings: {
                position: this.speakerPosition,
                size: this.speakerSize,
                margin: this.speakerMargin
            },
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('cameraConfig', JSON.stringify(config));
            console.log('✅ 摄像头配置已保存:', config);
            return true;
        } catch (error) {
            console.error('❌ 保存摄像头配置失败:', error);
            return false;
        }
    }

    // 加载配置
    loadConfiguration() {
        try {
            const configStr = localStorage.getItem('cameraConfig');
            if (configStr) {
                const config = JSON.parse(configStr);
                console.log('📹 加载摄像头配置:', config);
                return config;
            }
        } catch (error) {
            console.error('❌ 加载摄像头配置失败:', error);
        }
        return null;
    }

    // 绑定事件监听器
    bindEventListeners() {
        console.log('📹 绑定事件监听器...');
        
        // 权限请求按钮
        const requestBtn = document.getElementById(`${this.settingId}-step1-requestBtn`);
        if (requestBtn) {
            requestBtn.addEventListener('click', () => this.requestCameraPermission());
        }
        
        // 设备选择下拉框
        const deviceSelect = document.getElementById('cameraDeviceSelect');
        if (deviceSelect) {
            deviceSelect.addEventListener('change', (e) => this.handleDeviceSelection(e.target.value));
        }
        
        console.log('✅ 事件监听器绑定完成');
    }

    // 清理资源
    cleanup() {
        console.log('📹 清理摄像头设置资源...');
        this.stopPreview();
        this.permissionGranted = false;
        this.devicesDetected = false;
        this.availableDevices = [];
        this.selectedDeviceId = null;
        this.selectedDeviceName = null;
    }
}

// 全局实例
let cameraSetupManager = null;

// 初始化摄像头设置
const initializeCameraSetup = async () => {
    console.log('📹 开始初始化摄像头设置...');
    
    try {
        cameraSetupManager = new CameraSetupManager();
        
        // 初始化设置
        const success = await cameraSetupManager.initialize();
        if (success) {
            console.log('✅ 摄像头设置初始化完成');
        } else {
            console.error('❌ 摄像头设置初始化失败');
        }
        
    } catch (error) {
        console.error('❌ 摄像头设置初始化异常:', error);
    }
};

// 导出给全局使用
if (typeof window !== 'undefined') {
    window.CameraSetupManager = CameraSetupManager;
    window.cameraSetupManager = cameraSetupManager;
    window.initializeCameraSetup = initializeCameraSetup;
}

// 全局导出
window.CameraSetupManager = CameraSetupManager;

// 创建摄像头设置界面函数
window.createCameraSetupOverlay = () => {
    const manager = new CameraSetupManager();
    return manager.createSetup();
};

console.log('📹 摄像头设置管理器已加载');
