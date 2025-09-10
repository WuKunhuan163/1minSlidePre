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
        this.isInitializing = false; // 防止重复初始化的标志
        this.previewRefreshInterval = null; // 预览刷新定时器
        
        // 演讲者模式设置
        this.speakerPosition = 'bottom-right';
        this.speakerSize = 0.20;
        this.speakerMargin = 0.02;
        
        // console.log('📹 摄像头设置管理器已创建');
        
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
                        onClick: () => this.stepManager.goToStep(0),
                        show: true
                    },
                    {
                        id: 'nextBtn',
                        text: '验证',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.validateVideoStreamAndProceed(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.checkDeviceConfigured() || this.checkCurrentDeviceSelected(),
                onEnter: () => this.initializeDeviceSelection(),
                validation: () => this.validateVideoStreamSignal()
            },
            {
                id: 'step3',
                title: '演讲者模式设置',
                content: {
                    description: `
                        设置演讲者的位置和大小。
                        <br>
                        演讲者背后是模拟的PPT背景。
                        <br>
                        <div class="setting-group">
                            <label for="speakerPosition">演讲者位置：</label>
                            <select id="speakerPosition" class="form-control">
                                <option value="speaker-only">只有演讲者</option>
                                <option value="top-left">左上角</option>
                                <option value="bottom-left">左下角</option>
                                <option value="top-right">右上角</option>
                                <option value="bottom-right" selected>右下角</option>
                                <option value="left">左侧中央</option>
                                <option value="right">右侧中央</option>
                                <option value="top">上方中央</option>
                                <option value="bottom">下方中央</option>
                            </select>
                        </div>
                        <br id="speakerSizeBr">
                        <div id="speakerSizeGroup" class="setting-group">
                            <div class="setting-label-with-value">
                                <label for="speakerSize"><strong>演讲者大小：</strong></label>
                                <span id="speakerSizeValue" class="setting-value">20%</span>
                            </div>
                            <input type="range" id="speakerSize" class="setting-slider" 
                                   min="0.12" max="0.50" step="0.01" value="0.20">
                        </div>
                        <br id="speakerMarginBr">
                        <div id="speakerMarginGroup" class="setting-group">
                            <div class="setting-label-with-value">
                                <label for="speakerMargin"><strong>边界缝隙：</strong></label>
                                <span id="speakerMarginValue" class="setting-value">2%</span>
                            </div>
                            <input type="range" id="speakerMargin" class="setting-slider" 
                                   min="0" max="0.10" step="0.01" value="0.02">
                        </div>
                        <br id="previewBr">
                        <div class="preview-section">
                            <div id="speakerPreviewContainer" style="
                                position: relative;
                                width: 100%;
                                max-width: 400px;
                                aspect-ratio: 16/9;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                background-image: url('assets/images/cover.jpg');
                                background-size: cover;
                                background-position: center;
                                background-color: #f0f0f0;
                                overflow: hidden;
                            ">
                                <video id="speakerPreviewVideo" style="
                                    position: absolute;
                                    border-radius: 4px;
                                    object-fit: cover;
                                    display: none;
                                " autoplay muted></video>
                            </div>
                        </div>
                    `
                },
                buttons: [
                    {
                        id: 'prevBtn',
                        text: '上一步',
                        type: 'back',
                        onClick: () => this.stepManager.goToStep(1),
                        show: true
                    },
                    {
                        id: 'nextBtn',
                        text: '下一步',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.stepManager.goToStep(3),
                        show: true
                    }
                ],
                autoJumpCondition: () => false, // 不允许自动跳过，需要用户手动确认设置
                onEnter: () => this.initializeSpeakerSettings(),
                validation: () => true
            },
            {
                id: 'step4',
                title: '录制测试',
                content: {
                    description: `
                        进行实际的录制测试，确保摄像头和演讲者模式设置正常工作。
                        <br><br>
                        <div id="recordingTestContainer" style="text-align: center; min-height: 400px;">
                            
                            <div id="settingsDisplay" style="
                                background: rgba(0, 0, 0, 0.05);
                                border-radius: 8px;
                                padding: 0px;
                                margin-bottom: 20px;
                                text-align: left;
                                font-size: 14px;
                                line-height: 1.6;
                            ">
                                <div style="margin-bottom: 8px;">
                                    <strong>演讲者位置:</strong> <span id="displaySpeakerPosition" style="font-weight: normal;">右下角</span>
                                </div>
                                <div style="margin-bottom: 8px;">
                                    <strong>演讲者大小:</strong> <span id="displaySpeakerSize" style="font-weight: normal;">20%</span>
                                </div>
                                <div>
                                    <strong>边界缝隙:</strong> <span id="displaySpeakerMargin" style="font-weight: normal;">2%</span>
                                </div>
                            </div>
                            
                            <div id="recordingControls" style="margin-bottom: 20px;">
                                <button id="downloadVideoBtn" class="btn btn-success" style="
                                    padding: 12px 24px;
                                    font-size: 16px;
                                    border-radius: 8px;
                                    margin: 0 8px;
                                    display: none;
                                ">
                                    <i class='bx bx-download'></i> 下载视频
                                </button>
                            </div>
                            
                            <div id="progressContainer" style="
                                display: none;
                                margin: 15px -15px;
                                width: calc(100% + 35px);
                            "></div>
                            
                            <div id="resultContainer" style="
                                display: none;
                                margin-top: 20px;
                            ">
                                <h5>转换结果</h5>
                                <div id="videoPreviewContainer"></div>
                            </div>
                        </div>
                    `
                },
                buttons: [
                    {
                        id: 'prevBtn',
                        text: '上一步',
                        type: 'back',
                        onClick: () => this.stepManager.goToStep(2),
                        show: true
                    },
                    {
                        id: 'downloadBtn',
                        text: '下载视频',
                        type: 'secondary',
                        onClick: () => this.downloadRecordedVideo(),
                        show: false  // 默认隐藏，录制完成后显示
                    },
                    {
                        id: 'completeBtn',
                        text: '完成设置',
                        type: 'success',
                        isPrimary: true,
                        onClick: () => this.completeSetup(),
                        show: false  // 默认隐藏，只在录制转换成功后显示
                    }
                ],
                autoJumpCondition: () => false, // 不自动跳转
                onEnter: () => this.initializeRecordingTest(),
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
        `;
    }

    // 生成设备选择界面
    generateDeviceSelectionInterface() {
        return `
            <div class="form-group" id="deviceSelectionGroup">
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
        // console.log('📹 步骤管理器已设置');
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
        // console.log('✅ 摄像头设置完成');
        this.saveConfiguration();
        if (window.settingsManager) {
            window.settingsManager.refreshSetting(this.settingId);
        }
        this.cleanup();
    }

    // 处理返回设置列表
    handleBackToSettings() {
        // console.log('🔙 返回设置列表');
        
        // 创建新的设置overlay
        const newSettingsOverlay = createSettingsOverlay();
        setupSettingsOverlayEvents(newSettingsOverlay);
        
        // 使用overlay管理器切换
        if (window.overlayManager) {
            window.overlayManager.switchToOverlay(newSettingsOverlay);
        }
        
        // 清理资源
        this.cleanup();
    }

    // 创建步骤管理器实例（保留原方法用于内部使用）
    createStepManager() {
        const stepManagerOptions = {
            settingId: this.settingId,
            steps: this.steps,
            onComplete: () => {
                // console.log('✅ 摄像头设置完成');
                this.saveConfiguration();
                if (window.settingsManager) {
                    window.settingsManager.refreshSetting(this.settingId);
                }
            },
            onBack: () => {
                // console.log('🔙 返回设置列表');
            }
        };
        
        return new SettingsStepManager(stepManagerOptions);
    }

    // 验证权限是否已获取
    async validatePermissionGranted() {
        // console.log('🔍 验证摄像头权限...');
        
        try {
            // 尝试获取权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            // 权限获取成功
            this.permissionGranted = true;
            stream.getTracks().forEach(track => track.stop());
            
            // 检测设备
            await this.detectCameraDevices();
            
            // console.log('✅ 摄像头权限验证成功');
            return true;
        } catch (error) {
            // console.log('❌ 摄像头权限验证失败:', error.message);
            this.permissionGranted = false;
            this.devicesDetected = false;
            return false;
        }
    }

    // 初始化设置
    async initialize() {
        // console.log('📹 开始初始化摄像头设置...');
        
        try {
            // 创建并设置步骤管理器
            this.stepManager = this.createStepManager();
            
            // 显示设置界面
            this.stepManager.show();
            
            // console.log('✅ 摄像头设置初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 摄像头设置初始化失败:', error);
            return false;
        }
    }

    // 初始化权限步骤 - 检查是否需要自动请求权限
    initializePermissionStep() {
        // console.log('🔄 初始化权限步骤...');
        
        // 重置权限状态
        this.permissionGranted = false;
        this.devicesDetected = false;
        
        // 重置UI状态
        const cameraStatus = document.getElementById('cameraStatus');
        const cameraIcon = document.getElementById('cameraIcon');
        
        if (cameraStatus) cameraStatus.textContent = '等待权限请求';
        if (cameraIcon) {
            cameraIcon.className = 'bx bx-camera';
            cameraIcon.style.color = '#666';
        }
        
        // 显示请求按钮
        this.stepManager.showButton('step1', 'requestBtn');
        
        // 检查是否已有完成标记，如果没有则说明是回退操作或首次进入
        const isStep1Completed = this.stepManager.isStepCompleted('step1');
        // console.log('🔍 检查第一步完成状态:', isStep1Completed);
        
        if (isStep1Completed) {
            // 如果第一步已完成，自动请求权限（这是正常的自动推进流程）
            // console.log('🔄 第一步已完成，自动请求权限');
            setTimeout(() => {
                this.requestCameraPermission();
            }, 500);
        } else {
            // 如果第一步未完成，说明是首次进入或回退操作，让用户手动点击
            // console.log('🔄 第一步未完成，等待用户手动操作');
            if (cameraStatus) cameraStatus.textContent = '请点击"请求权限"按钮获取摄像头权限';
        }
        
        // console.log('✅ 权限步骤已初始化');
    }

    // 初始化设备选择步骤
    initializeDeviceSelection() {
        // console.log('📹 初始化设备选择步骤...');
        
        // 防止重复初始化
        if (this.isInitializing) {
            console.log('⚠️ 正在初始化中，跳过重复初始化');
            return;
        }
        
        this.isInitializing = true;
        
        // 清除可能存在的旧状态提示
        this.clearDeviceSelectionNotices();
        
        // 只有在没有活跃预览时才停止预览
        if (!this.isPreviewActive) {
            // console.log('📹 没有活跃预览，可以安全停止');
            this.stopPreview();
        } else {
            // console.log('📹 有活跃预览，跳过停止预览以避免中断验证');
        }
        
        // 重置当前会话的设备选择状态（但不清除保存的配置）
        // 这样用户可以重新选择，但仍然保留之前的默认选择
        // this.selectedDeviceId = null;
        // this.selectedDeviceName = null;
        
        // 填充设备下拉框
        this.populateDeviceSelectDropdown();
        
        // 绑定设备选择事件
        const deviceSelect = document.getElementById('cameraDeviceSelect');
        if (deviceSelect) {
            deviceSelect.addEventListener('change', (e) => this.handleDeviceSelection(e.target.value));
        }
        
        // 自动加载之前保存的设备配置（但不自动触发验证）
        this.loadSavedDeviceConfig();
        
        // 确保下一步按钮可用
        setTimeout(() => {
            this.stepManager.enableButton('step2', 'nextBtn');
            // console.log('📹 第二步初始化完成，下一步按钮已启用');
            
            // 重置初始化标志
            this.isInitializing = false;
        }, 100);
        
        // console.log('✅ 设备选择步骤已初始化');
    }

    // 清除设备选择相关的提示信息
    clearDeviceSelectionNotices() {
        const deviceGroup = document.getElementById('deviceSelectionGroup');
        if (deviceGroup) {
            // 移除所有提示信息
            const notices = deviceGroup.querySelectorAll('.device-default-notice, .device-locked-notice');
            notices.forEach(notice => notice.remove());
        }
    }

    // 请求摄像头权限
    async requestCameraPermission() {
        // console.log('========== 请求摄像头权限方法被调用 ==========');
        // console.log('当前settingId:', this.settingId);
        
        const cameraStatus = document.getElementById('cameraStatus');
        const cameraIcon = document.getElementById('cameraIcon');
        const requestBtn = document.getElementById(`${this.settingId}-step1-requestBtn`);
        const nextBtn = document.getElementById(`${this.settingId}-step1-nextBtn`);
        
        // console.log('DOM元素查找结果:');
        // console.log('- cameraStatus:', !!cameraStatus);
        // console.log('- cameraIcon:', !!cameraIcon);
        // console.log('- requestBtn:', !!requestBtn);
        // console.log('- nextBtn:', !!nextBtn);
        
        try {
            // console.log('📹 开始请求摄像头权限...');
            // console.log('🌐 用户代理:', navigator.userAgent);
            // console.log('🔒 协议:', window.location.protocol);
            // console.log('🏠 主机:', window.location.host);
            
            // 检查浏览器支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持 getUserMedia API');
            }
            
            // 检查权限状态（如果支持）
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                    // console.log('🔍 当前摄像头权限状态:', permissionStatus.state);
                } catch (permErr) {
                    // console.log('⚠️ 无法查询权限状态:', permErr.message);
                }
            }
            
            this.stepManager.showStepStatus('step1', '正在请求摄像头权限...', 'processing');
            
            if (cameraStatus) cameraStatus.textContent = '正在请求权限...';
            
            // 禁用请求按钮，防止重复点击
            if (requestBtn) {
                requestBtn.disabled = true;
                requestBtn.textContent = '请求中...';
            }
            
            // 禁用所有步骤按钮，防止用户在权限请求过程中切换步骤
            this.stepManager.disableButton('step1', 'requestBtn');
            
            // console.log('📹 调用 getUserMedia...');
            
            // 请求摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            // console.log('✅ 摄像头权限获取成功');
            
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
            
            // 标记第一步为完成
            this.stepManager.markStepCompleted('step1', true);
            // console.log('💾 摄像头第一步已标记为完成');
            
            // 恢复请求按钮状态（虽然会被隐藏）
            if (requestBtn) {
                requestBtn.disabled = false;
                requestBtn.textContent = '请求权限';
            }
            
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
            
            // console.log('✅ 摄像头权限请求完成');
            
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
            if (requestBtn) {
                requestBtn.disabled = false;
                requestBtn.textContent = '请求权限';
            }
            
            // 重新启用按钮交互
            this.stepManager.enableButton('step1', 'requestBtn');
        }
    }

    // 检测摄像头设备
    async detectCameraDevices() {
        // console.log('📹 开始检测摄像头设备...');
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.filter(device => device.kind === 'videoinput');
            
            // console.log('📹 检测到摄像头设备:', this.availableDevices.length, '个');
            this.availableDevices.forEach((device, index) => {
                // console.log(`  ${index + 1}. ${device.label || `摄像头 ${index + 1}`} (${device.deviceId})`);
            });
            
            if (this.availableDevices.length > 0) {
                this.devicesDetected = true;
                // 不再显示设备列表，设备选择在第二步进行
            } else {
                console.warn('⚠️ 未检测到摄像头设备');
                this.stepManager.showStepStatus('step1', '未检测到摄像头设备', 'warning');
            }
            
        } catch (error) {
            console.error('❌ 检测摄像头设备失败:', error);
            this.stepManager.showStepStatus('step1', '检测摄像头设备失败', 'error');
        }
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
        
        // console.log('📹 设备选择下拉框已更新');
    }


    // 处理设备选择变化
    async handleDeviceSelection(deviceId) {
        // console.log('========== 摄像头设备选择调试 ==========');
        // console.log('（1）用户选择了设备ID:', deviceId);
        
        if (!deviceId) {
            // console.log('（2）设备ID为空，清空选择状态');
            this.selectedDeviceId = null;
            this.selectedDeviceName = null;
            this.stopPreview();
            return;
        }
        
        const selectedDevice = this.availableDevices.find(device => device.deviceId === deviceId);
        if (selectedDevice) {
            this.selectedDeviceId = deviceId;
            this.selectedDeviceName = selectedDevice.label || '未知设备';
            
            // console.log('（3）设备选择进入session变量:');
            // console.log('  - selectedDeviceId:', this.selectedDeviceId);
            // console.log('  - selectedDeviceName:', this.selectedDeviceName);
            // console.log('  - 实例状态:', {
            //     permissionGranted: this.permissionGranted,
            //     devicesDetected: this.devicesDetected,
            //     availableDevicesCount: this.availableDevices.length
            // });
            
            // 开始预览
            // console.log('（4）开始摄像头预览...');
            await this.startPreview();
            
            // 摄像头预览成功，立即保存基本配置
            console.log('💾 摄像头预览成功，保存基本设备配置...');
            this.saveBasicConfiguration();
            
            // 主动触发自动跳转检查（基于验证函数）
            console.log('🔄 摄像头预览成功，触发自动跳转检查...');
            setTimeout(() => {
                if (this.stepManager.triggerAutoJumpCheck) {
                    this.stepManager.triggerAutoJumpCheck();
                }
            }, 2000); // 延迟2秒让用户看到预览
            
            // console.log('========== 设备选择流程完成 ==========');
        } else {
            console.warn('⚠️ 在可用设备列表中找不到选中的设备:', deviceId);
        }
    }

    // 开始预览
    async startPreview() {
        // console.log('📹 开始摄像头预览...');
        
        if (!this.selectedDeviceId) {
            console.error('❌ 未选择设备');
            return;
        }
        
        // 如果已经有相同设备的活跃预览，就不要重复创建
        if (this.isPreviewActive && this.currentStream) {
            const previewVideo = document.getElementById('cameraPreview');
            if (previewVideo && previewVideo.srcObject && 
                previewVideo.videoWidth > 0 && !previewVideo.paused) {
                // console.log('📹 已有活跃预览，跳过重复创建');
                return;
            }
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
                // console.log('✅ 摄像头预览已开始');
            }
            
        } catch (error) {
            console.error('❌ 开始摄像头预览失败:', error);
            this.stepManager.showStepStatus('step2', '摄像头预览失败', 'error');
        }
    }

    // 停止预览
    stopPreview() {
        // console.log('📹 停止摄像头预览...');
        
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
        // console.log('✅ 摄像头预览已停止');
    }

    // 创建隐藏的预览视频元素（用于第三步预览）
    createHiddenPreviewVideo() {
        // 检查是否已经存在隐藏的预览元素
        let hiddenVideo = document.getElementById('hiddenCameraPreview');
        if (hiddenVideo) {
            return hiddenVideo;
        }
        
        // 创建隐藏的video元素
        hiddenVideo = document.createElement('video');
        hiddenVideo.id = 'hiddenCameraPreview';
        hiddenVideo.style.position = 'absolute';
        hiddenVideo.style.left = '-9999px';
        hiddenVideo.style.top = '-9999px';
        hiddenVideo.style.width = '1px';
        hiddenVideo.style.height = '1px';
        hiddenVideo.autoplay = true;
        hiddenVideo.muted = true;
        
        // 添加到DOM中
        document.body.appendChild(hiddenVideo);
        
        // 如果有当前流，设置到隐藏视频元素
        if (this.currentStream) {
            hiddenVideo.srcObject = this.currentStream;
        }
        
        return hiddenVideo;
    }

    // 初始化演讲者设置
    initializeSpeakerSettings() {
        // console.log('📹 初始化演讲者设置...');
        
        // 确保摄像头预览保持活跃状态，以便在预览中显示真实画面
        if (!this.isPreviewActive && this.selectedDeviceId) {
            // console.log('📹 重新启动摄像头预览以便在演讲者模式预览中显示');
            this.startPreview();
        }
        
        // 先加载保存的配置
        this.loadSavedSpeakerSettings();
        
        // 设置默认值
        const positionSelect = document.getElementById('speakerPosition');
        const sizeSlider = document.getElementById('speakerSize');
        const marginSlider = document.getElementById('speakerMargin');
        const sizeValueSpan = document.getElementById('speakerSizeValue');
        const marginValueSpan = document.getElementById('speakerMarginValue');
        
        if (positionSelect) {
            positionSelect.value = this.speakerPosition;
            positionSelect.addEventListener('change', (e) => {
                this.speakerPosition = e.target.value;
                // console.log('📹 演讲者位置更新:', this.speakerPosition);
                
                // 处理"只有演讲者"选项
                this.handleSpeakerOnlyOption();
                
                // 实时更新预览
                setTimeout(() => this.previewSpeakerMode(), 100);
            });
        }
        
        if (sizeSlider && sizeValueSpan) {
            sizeSlider.value = this.speakerSize;
            sizeValueSpan.textContent = Math.round(this.speakerSize * 100) + '%';
            
            sizeSlider.addEventListener('input', (e) => {
                this.speakerSize = parseFloat(e.target.value);
                sizeValueSpan.textContent = Math.round(this.speakerSize * 100) + '%';
                // console.log('📹 演讲者大小更新:', this.speakerSize);
                // 实时更新预览
                setTimeout(() => this.previewSpeakerMode(), 100);
            });
        }
        
        if (marginSlider && marginValueSpan) {
            marginSlider.value = this.speakerMargin;
            marginValueSpan.textContent = Math.round(this.speakerMargin * 100) + '%';
            
            marginSlider.addEventListener('input', (e) => {
                this.speakerMargin = parseFloat(e.target.value);
                marginValueSpan.textContent = Math.round(this.speakerMargin * 100) + '%';
                // console.log('📹 演讲者边距更新:', this.speakerMargin);
                // 实时更新预览
                setTimeout(() => this.previewSpeakerMode(), 100);
            });
        }
        
        
        // 初始化时也检查"只有演讲者"选项
        this.handleSpeakerOnlyOption();
        
        // 自动预览
        setTimeout(() => this.previewSpeakerMode(), 500);
        
        // 为"只有演讲者"模式启动定期刷新
        this.startPreviewRefresh();
    }
    
    // 启动预览刷新
    startPreviewRefresh() {
        // 清除之前的刷新定时器
        if (this.previewRefreshInterval) {
            clearInterval(this.previewRefreshInterval);
        }
        
        // 启动新的刷新定时器（用于检查视频源状态）
        this.previewRefreshInterval = setInterval(() => {
            // 只检查视频源是否需要更新，不重复设置
            const previewVideo = document.getElementById('speakerPreviewVideo');
            if (previewVideo && !previewVideo.srcObject && this.isPreviewActive) {
                this.previewSpeakerMode();
            }
        }, 2000); // 每2秒检查一次即可
    }
    
    // 停止预览刷新
    stopPreviewRefresh() {
        if (this.previewRefreshInterval) {
            clearInterval(this.previewRefreshInterval);
            this.previewRefreshInterval = null;
        }
    }

    // 处理"只有演讲者"选项
    handleSpeakerOnlyOption() {
        const speakerSizeGroup = document.getElementById('speakerSizeGroup');
        const speakerMarginGroup = document.getElementById('speakerMarginGroup');
        const speakerSizeBr = document.getElementById('speakerSizeBr');
        const speakerMarginBr = document.getElementById('speakerMarginBr');
        
        if (this.speakerPosition === 'speaker-only') {
            // 隐藏大小和边距滑动条及其空隙
            if (speakerSizeGroup) speakerSizeGroup.style.display = 'none';
            if (speakerMarginGroup) speakerMarginGroup.style.display = 'none';
            if (speakerSizeBr) speakerSizeBr.style.display = 'none';
            if (speakerMarginBr) speakerMarginBr.style.display = 'none';
        } else {
            // 显示大小和边距滑动条及其空隙
            if (speakerSizeGroup) speakerSizeGroup.style.display = 'block';
            if (speakerMarginGroup) speakerMarginGroup.style.display = 'block';
            if (speakerSizeBr) speakerSizeBr.style.display = 'block';
            if (speakerMarginBr) speakerMarginBr.style.display = 'block';
        }
    }

    // 初始化录制测试步骤
    async initializeRecordingTest() {
        console.log('📹 初始化录制测试步骤...');
        
        try {
            // 导入简化的视频控制器（替换复杂的VideoConverter）
            if (!window.SimpleVideoController) {
                const SimpleVideoControllerModule = await import('../../../modules/simple-controller.js');
                window.SimpleVideoController = SimpleVideoControllerModule.default;
                console.log('✅ 简化视频控制器已加载');
            }
            
            // 设置预览视频
            await this.setupRecordingPreview();
            
            // 显示当前设定
            this.displayCurrentSettings();
            
            // 设置事件监听器
            this.setupRecordingEventListeners();
            
            // 立即显示进度UI
            this.showProgressUI();
            
            console.log('✅ 录制测试步骤已初始化');
            
        } catch (error) {
            console.error('❌ 录制测试初始化失败:', error);
        }
    }

    // 预览演讲者模式
    async previewSpeakerMode() {
        // console.log('📹 预览演讲者模式...');
        
        const container = document.getElementById('speakerPreviewContainer');
        const previewVideo = document.getElementById('speakerPreviewVideo');
        
        if (!container || !previewVideo) {
            console.error('❌ 找不到预览容器或视频元素');
            return;
        }
        
        // 获取容器实际尺寸
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // 获取摄像头视频源
        let sourceVideo = document.getElementById('cameraPreview');
        if (!sourceVideo || !sourceVideo.srcObject) {
            sourceVideo = document.getElementById('hiddenCameraPreview');
        }
        
        if (!sourceVideo && this.selectedDeviceId && this.isPreviewActive) {
            sourceVideo = this.createHiddenPreviewVideo();
        }
        
        // 设置预览视频的源（只设置一次，避免闪烁）
        if (this.isPreviewActive && sourceVideo && sourceVideo.srcObject) {
            // 只有在还没有设置源时才设置，避免重复设置导致闪烁
            if (!previewVideo.srcObject) {
                previewVideo.srcObject = sourceVideo.srcObject;
            }
            previewVideo.style.display = 'block';
            
            // 计算视频位置和大小
            this.updateVideoPosition(previewVideo, containerWidth, containerHeight);
        } else {
            previewVideo.style.display = 'none';
        }
    }

    // 更新视频位置和大小
    updateVideoPosition(videoElement, containerWidth, containerHeight) {
        if (this.speakerPosition === 'speaker-only') {
            // "只有演讲者"模式：全屏显示
            videoElement.style.left = '0px';
            videoElement.style.top = '0px';
            videoElement.style.width = containerWidth + 'px';
            videoElement.style.height = containerHeight + 'px';
            return;
        }
        
        // 计算演讲者视频位置和大小
        const videoAspectRatio = 4 / 3; // 假设摄像头是4:3比例
        
        let videoWidth, videoHeight;
        const scale = this.speakerSize;
        
        // 根据容器比例计算视频大小
        if (containerWidth / containerHeight > videoAspectRatio) {
            videoHeight = containerHeight * scale;
            videoWidth = videoHeight * videoAspectRatio;
        } else {
            videoWidth = containerWidth * scale;
            videoHeight = videoWidth / videoAspectRatio;
        }
        
        const marginX = containerWidth * this.speakerMargin;
        const marginY = containerHeight * this.speakerMargin;
        
        let x, y;
        
        // 根据位置计算坐标
        switch (this.speakerPosition) {
            case 'top-left':
                x = marginX;
                y = marginY;
                break;
            case 'top':
                x = (containerWidth - videoWidth) / 2;
                y = marginY;
                break;
            case 'top-right':
                x = containerWidth - videoWidth - marginX;
                y = marginY;
                break;
            case 'left':
                x = marginX;
                y = (containerHeight - videoHeight) / 2;
                break;
            case 'right':
                x = containerWidth - videoWidth - marginX;
                y = (containerHeight - videoHeight) / 2;
                break;
            case 'bottom-left':
                x = marginX;
                y = containerHeight - videoHeight - marginY;
                break;
            case 'bottom':
                x = (containerWidth - videoWidth) / 2;
                y = containerHeight - videoHeight - marginY;
                break;
            case 'bottom-right':
            default:
                x = containerWidth - videoWidth - marginX;
                y = containerHeight - videoHeight - marginY;
                break;
        }
        
        // 设置视频元素的位置和大小
        videoElement.style.left = x + 'px';
        videoElement.style.top = y + 'px';
        videoElement.style.width = videoWidth + 'px';
        videoElement.style.height = videoHeight + 'px';
    }

    // 绘制"只有演讲者"模式
    drawSpeakerOnlyMode(ctx, canvasWidth, canvasHeight) {
        // 获取视频元素
        let previewVideo = document.getElementById('cameraPreview');
        if (!previewVideo) {
            previewVideo = document.getElementById('hiddenCameraPreview');
        }
        
        if (!previewVideo && this.selectedDeviceId && this.isPreviewActive) {
            previewVideo = this.createHiddenPreviewVideo();
        }
        
        if (this.isPreviewActive && previewVideo && previewVideo.videoWidth > 0) {
            // 绘制全屏摄像头画面
            ctx.drawImage(previewVideo, 0, 0, canvasWidth, canvasHeight);
        } else {
            // 显示占位符
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.min(canvasWidth, canvasHeight) * 0.1}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('📹', canvasWidth / 2, canvasHeight / 2 - 20);
            
            ctx.font = '16px Arial';
            ctx.fillText('只有演讲者模式', canvasWidth / 2, canvasHeight / 2 + 20);
            ctx.font = '12px Arial';
            ctx.fillText('仅录制摄像头画面', canvasWidth / 2, canvasHeight / 2 + 40);
        }
    }

    // 绘制演讲者视频
    drawSpeakerVideo(ctx, canvasWidth, canvasHeight) {
        
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
        
        // 检查是否有活跃的摄像头流
        let previewVideo = document.getElementById('cameraPreview');
        
        // 如果找不到cameraPreview元素，尝试使用隐藏的视频元素
        if (!previewVideo) {
            previewVideo = document.getElementById('hiddenCameraPreview');
        }
        
        // 如果还是找不到且有选定的设备，创建隐藏的视频元素
        if (!previewVideo && this.selectedDeviceId && this.isPreviewActive) {
            previewVideo = this.createHiddenPreviewVideo();
        }
        
        if (this.isPreviewActive && previewVideo && previewVideo.videoWidth > 0) {
            // 绘制真实的摄像头画面
            ctx.drawImage(previewVideo, x, y, videoWidth, videoHeight);
            
            // 绘制边框
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, videoWidth, videoHeight);
            
            // console.log('✅ 演讲者模式预览完成（使用真实摄像头画面）');
        } else {
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
            
            // console.log('✅ 演讲者模式预览完成（使用模拟画面）');
        }
    }

    // 完成设置
    completeSetup() {
        // console.log('📹 完成摄像头设置...');
        
        if (this.saveConfiguration()) {
            // 标记设置为已测试完成
            if (typeof simpleConfig !== 'undefined' && simpleConfig.markSettingTested) {
                simpleConfig.markSettingTested('camera');
            }
            
            console.log('✅ 摄像头设置完成');
            this.stepManager.complete();
            this.cleanup();
        } else {
            this.stepManager.showStepStatus('step2', '保存配置失败', 'error');
        }
    }

    // 保存基本配置（第二步完成时调用）
    saveBasicConfiguration() {
        if (!this.selectedDeviceId || !this.selectedDeviceName) {
            console.error('❌ 未选择摄像头设备，无法保存基本配置');
            return false;
        }
        
        // 先加载现有配置（如果有的话）
        const existingConfig = this.loadConfiguration();
        
        const config = {
            enabled: true,
            selectedDeviceId: this.selectedDeviceId,
            selectedDeviceName: this.selectedDeviceName,
            // 保留现有的演讲者设置，或使用默认值
            speakerSettings: existingConfig?.speakerSettings || {
                position: this.speakerPosition,
                size: this.speakerSize,
                margin: this.speakerMargin
            },
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('cameraConfig', JSON.stringify(config));
            console.log('✅ 摄像头基本配置已保存:', config);
            return true;
        } catch (error) {
            console.error('❌ 保存摄像头基本配置失败:', error);
            return false;
        }
    }

    // 保存完整配置（最后一步完成时调用）
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
            console.log('✅ 摄像头完整配置已保存:', config);
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
                // console.log('📹 加载摄像头配置:', config);
                return config;
            }
        } catch (error) {
            console.error('❌ 加载摄像头配置失败:', error);
        }
        return null;
    }

    // 绑定事件监听器
    bindEventListeners() {
        // console.log('📹 绑定事件监听器...');
        
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
        
        // console.log('✅ 事件监听器绑定完成');
    }

    // 检查设备是否已配置（用于自动跳过步骤）
    checkDeviceConfigured() {
        // console.log('========== 检查第二步是否已完成调试 ==========');
        
        const config = this.loadConfiguration();
        // console.log('（1）加载的配置:', config);
        
        if (config && config.selectedDeviceId && config.enabled) {
            // 恢复设备选择状态
            this.selectedDeviceId = config.selectedDeviceId;
            this.selectedDeviceName = config.selectedDeviceName;
            // console.log('（2）第二步被标记为已完成:');
            // console.log('  - selectedDeviceId:', config.selectedDeviceId);
            // console.log('  - selectedDeviceName:', config.selectedDeviceName);
            // console.log('  - enabled:', config.enabled);
            // console.log('  - 恢复到session变量:', {
            //     selectedDeviceId: this.selectedDeviceId,
            //     selectedDeviceName: this.selectedDeviceName
            // });
            // console.log('========== 第二步检查结果: 已完成，将自动跳过 ==========');
            return true;
        }
        
        // console.log('（2）第二步未完成，需要用户操作');
        // console.log('========== 第二步检查结果: 未完成 ==========');
        return false;
    }

    // 检查当前会话中是否已选择设备并开始预览
    checkCurrentDeviceSelected() {
        // console.log('========== 检查当前设备选择状态 ==========');
        // console.log('当前状态:', {
        //     selectedDeviceId: this.selectedDeviceId,
        //     selectedDeviceName: this.selectedDeviceName,
        //     isPreviewActive: this.isPreviewActive
        // });
        
        const isSelected = this.selectedDeviceId && this.selectedDeviceName && this.isPreviewActive;
        // console.log('当前设备选择结果:', isSelected);
        return isSelected;
    }

    // 验证视频流并继续到下一步
    async validateVideoStreamAndProceed() {
        // console.log('========== 验证视频流并继续 ==========');
        
        // 检查是否已选择设备
        if (!this.selectedDeviceId || !this.selectedDeviceName) {
            this.stepManager.showStepStatus('step2', '请先选择摄像头设备', 'warning');
            return;
        }
        
        // 检查预览是否活跃
        if (!this.isPreviewActive) {
            this.stepManager.showStepStatus('step2', '摄像头未启动，请重新选择设备', 'warning');
            return;
        }
        
        // 禁用下一步按钮，防止重复点击
        this.stepManager.disableButton('step2', 'nextBtn');
        
        // 显示验证状态
        this.stepManager.showStepStatus('step2', '正在验证视频流...', 'processing');
        
        // 验证视频流至少1秒钟有信号，并显示进度
        const hasValidStream = await this.validateVideoStreamSignal();
        
        if (hasValidStream) {
            // 保存基本配置
            console.log('💾 视频流验证通过，保存基本设备配置...');
            this.saveBasicConfiguration();
            
            // 显示成功状态并跳转
            this.stepManager.showStepStatus('step2', '视频流验证成功！', 'success');
            
            setTimeout(() => {
                this.stepManager.goToStep(2, {
                    previousStepStatus: '摄像头设备配置完成',
                    previousStepType: 'success'
                });
            }, 1000);
        } else {
            this.stepManager.showStepStatus('step2', '视频流验证失败，请检查摄像头是否正常工作', 'error');
            
            // 重新启用下一步按钮
            this.stepManager.enableButton('step2', 'nextBtn');
        }
    }


    // 通用的视频信号检测函数
    checkVideoSignal(videoElement, showProgress = false, stepId = null) {
        // console.log('🔧 checkVideoSignal 开始，参数:', {
        //     showProgress,
        //     stepId,
        //     videoWidth: videoElement.videoWidth,
        //     videoHeight: videoElement.videoHeight,
        //     paused: videoElement.paused,
        //     ended: videoElement.ended
        // });
        
        return new Promise((resolve) => {
            let consecutiveSignalCount = 0;
            let checkCount = 0;
            const maxChecks = 10; // 检查1秒钟（100ms * 10）
            const requiredConsecutiveSignals = 8; // 需要连续8次检测到信号（至少800ms的稳定信号）
            
            const checkSignal = () => {
                checkCount++;
                
                // 检查视频元素是否有画面
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0 && 
                    !videoElement.paused && !videoElement.ended) {
                    consecutiveSignalCount++;
                    
                    if (showProgress && stepId && this.stepManager) {
                        // 显示进度
                        const progress = Math.round((consecutiveSignalCount / requiredConsecutiveSignals) * 100);
                        const clampedProgress = Math.min(progress, 100);
                        this.stepManager.showStepStatus(stepId, `检测视频信号中... ${clampedProgress}%`, 'info');
                    }
                    
                    // console.log(`📹 检测到视频信号: ${videoElement.videoWidth}x${videoElement.videoHeight} (连续${consecutiveSignalCount}次)`);
                } else {
                    // 如果检测不到信号，重置计数器
                    consecutiveSignalCount = 0;
                    
                    if (showProgress && stepId && this.stepManager) {
                        this.stepManager.showStepStatus(stepId, '未检测到视频信号，请手动验证', 'warning');
                    }
                    
                    // console.log('📹 未检测到视频信号，重置计数器。当前状态:', {
                    //     videoWidth: videoElement.videoWidth,
                    //     videoHeight: videoElement.videoHeight,
                    //     paused: videoElement.paused,
                    //     ended: videoElement.ended
                    // });
                }
                
                if (checkCount >= maxChecks) {
                    const hasValidStream = consecutiveSignalCount >= requiredConsecutiveSignals;
                    // console.log(`📹 视频流验证完成，连续信号次数: ${consecutiveSignalCount}/${requiredConsecutiveSignals}, 结果: ${hasValidStream}`);
                    resolve(hasValidStream);
                } else {
                    setTimeout(checkSignal, 100);
                }
            };
            
            checkSignal();
        });
    }

    // 验证视频流（用于Manager的自动验证）
    async validateVideoStream() {
        // console.log('🔍 验证摄像头视频流...');
        
        // 检查是否已选择设备
        if (!this.selectedDeviceId) {
            // 尝试加载保存的配置
            const config = this.loadConfiguration();
            if (config && config.selectedDeviceId) {
                this.selectedDeviceId = config.selectedDeviceId;
                this.selectedDeviceName = config.selectedDeviceName;
            } else {
                // console.log('❌ 未选择摄像头设备');
                return false;
            }
        }
        
        try {
            // 尝试获取视频流
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: this.selectedDeviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            // 创建临时视频元素来测试流
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = stream;
            tempVideo.autoplay = true;
            tempVideo.muted = true;
            
            // 等待视频元数据加载
            await new Promise((resolve, reject) => {
                tempVideo.addEventListener('loadedmetadata', resolve);
                tempVideo.addEventListener('error', reject);
                setTimeout(() => reject(new Error('视频加载超时')), 5000);
            });
            
            // 使用通用的信号检测函数
            const hasValidStream = await this.checkVideoSignal(tempVideo, false);
            
            // 清理资源
            stream.getTracks().forEach(track => track.stop());
            tempVideo.srcObject = null;
            
            if (hasValidStream) {
                // console.log('✅ 摄像头视频流验证成功');
                // 更新内部状态
                this.permissionGranted = true;
                this.devicesDetected = true;
                return true;
            } else {
                // console.log('❌ 摄像头视频流无效');
                return false;
            }
        } catch (error) {
            // console.log('❌ 摄像头视频流验证失败:', error.message);
            return false;
        }
    }
    
    // 验证视频流信号并显示进度
    async validateVideoStreamSignal() {
        // console.log('🔧 validateVideoStreamSignal 被调用');
        
        // 首先尝试使用预览元素
        const videoElement = document.getElementById('cameraPreview');
        // console.log('📹 预览元素状态:', {
        //     exists: !!videoElement,
        //     hasStream: videoElement ? !!videoElement.srcObject : false,
        //     videoWidth: videoElement ? videoElement.videoWidth : 'N/A',
        //     videoHeight: videoElement ? videoElement.videoHeight : 'N/A',
        //     paused: videoElement ? videoElement.paused : 'N/A',
        //     ended: videoElement ? videoElement.ended : 'N/A'
        // });
        
        if (videoElement && videoElement.srcObject) {
            // console.log('✅ 使用预览元素进行验证');
            // 如果有预览元素且有视频流，使用带进度的验证
            const result = await this.checkVideoSignal(videoElement, true, 'step2');
            // console.log('📹 预览元素验证结果:', result);
            return result;
        }
        
        console.log('🔄 使用临时视频元素进行验证（自动跳转检查）');
        
        // 如果没有预览元素，创建临时的视频元素进行验证（用于自动跳转检查）
        if (!this.selectedDeviceId) {
            console.log('❌ 没有选择的设备ID，尝试加载配置');
            // 尝试加载保存的配置
            const config = this.loadConfiguration();
            if (config && config.selectedDeviceId) {
                this.selectedDeviceId = config.selectedDeviceId;
                this.selectedDeviceName = config.selectedDeviceName;
                console.log('✅ 从配置加载设备:', this.selectedDeviceId);
            } else {
                console.log('❌ 没有保存的设备配置');
                return false;
            }
        }
        
        try {
            console.log('🔧 开始创建临时视频流');
            
            // 显示开始验证的状态
            if (this.stepManager) {
                this.stepManager.showStepStatus('step2', '正在验证摄像头设备...', 'info');
            }
            
            // 创建临时视频流进行验证
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: this.selectedDeviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            console.log('✅ 临时视频流创建成功');
            
            // 创建临时视频元素
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = stream;
            tempVideo.autoplay = true;
            tempVideo.muted = true;
            
            // 等待视频元数据加载
            await new Promise((resolve, reject) => {
                tempVideo.addEventListener('loadedmetadata', resolve);
                tempVideo.addEventListener('error', reject);
                setTimeout(() => reject(new Error('视频加载超时')), 5000);
            });
            
            // console.log('📹 临时视频元素状态:', {
            //     videoWidth: tempVideo.videoWidth,
            //     videoHeight: tempVideo.videoHeight,
            //     paused: tempVideo.paused,
            //     ended: tempVideo.ended
            // });
            
            // 使用带进度显示的信号检测
            const hasValidStream = await this.checkVideoSignal(tempVideo, true, 'step2');
            // console.log('📹 临时视频验证结果:', hasValidStream);
            
            // 清理资源
            stream.getTracks().forEach(track => track.stop());
            tempVideo.srcObject = null;
            
            return hasValidStream;
            
        } catch (error) {
            console.error('❌ 临时视频验证失败:', error);
            if (this.stepManager) {
                this.stepManager.showStepStatus('step2', '摄像头验证失败', 'error');
            }
            return false;
        }
    }

    // 加载保存的设备配置
    loadSavedDeviceConfig() {
        // console.log('========== 自动加载保存的设备配置调试 ==========');
        
        try {
            const config = this.loadConfiguration();
            // console.log('（1）从localStorage加载的配置:', config);
            
            if (config && config.selectedDeviceId && config.enabled) {
                // console.log('（2）检测到有效的保存配置:');
                // console.log('  - selectedDeviceId:', config.selectedDeviceId);
                // console.log('  - selectedDeviceName:', config.selectedDeviceName);
                // console.log('  - enabled:', config.enabled);
                
                const deviceSelect = document.getElementById('cameraDeviceSelect');
                // console.log('（3）设备选择下拉框元素:', !!deviceSelect);
                
                if (deviceSelect) {
                    // 尝试选择配置的设备
                    const option = deviceSelect.querySelector(`option[value="${config.selectedDeviceId}"]`);
                    // console.log('（4）在下拉框中查找保存的设备选项:', !!option);
                    
                    if (option) {
                        deviceSelect.value = config.selectedDeviceId;
                        this.selectedDeviceId = config.selectedDeviceId;
                        this.selectedDeviceName = config.selectedDeviceName;
                        // console.log('（5）已自动设置设备选择:');
                        // console.log('  - 下拉框值:', deviceSelect.value);
                        // console.log('  - session变量 selectedDeviceId:', this.selectedDeviceId);
                        // console.log('  - session变量 selectedDeviceName:', this.selectedDeviceName);
                        
                        // 不锁定设备选择，保持可编辑状态
                        // 用户可以重新选择设备，这样更灵活
                        
                        // 在设备选择后添加说明文字，提示这是之前配置的设备
                        const deviceGroup = document.getElementById('deviceSelectionGroup');
                        if (deviceGroup && !deviceGroup.querySelector('.device-default-notice')) {
                            const notice = document.createElement('div');
                            notice.className = 'device-default-notice';
                            notice.style.cssText = `
                                margin-top: 8px;
                                padding: 8px 12px;
                                background: rgba(102, 106, 246, 0.1);
                                border: 1px solid rgba(102, 106, 246, 0.3);
                                border-radius: 4px;
                                color: #666AF6;
                                font-size: 12px;
                            `;
                            notice.innerHTML = `<i class="bx bx-info-circle"></i> 已预填之前配置的摄像头设备`;
                            deviceGroup.appendChild(notice);
                        }
                        
                        // console.log('（6）开始自动预览...');
                        // 开始预览
                        this.startPreview();
                        
                        console.log('检测到已配置的摄像头，开始预览但不自动跳转');
                        // 不自动保存基本配置，让用户确认后再保存
                        // 不自动触发跳转检查，让用户有机会修改设备选择
                        
                        // console.log('========== 自动配置加载完成 ==========');
                    } else {
                        console.warn('⚠️ 保存的摄像头设备不在可用设备列表中，可用选项:');
                        const allOptions = Array.from(deviceSelect.options).map(opt => ({
                            value: opt.value,
                            text: opt.text
                        }));
                        console.warn('  可用设备选项:', allOptions);
                    }
                } else {
                    console.warn('⚠️ 找不到摄像头设备选择下拉框');
                }
            } else {
                // console.log('（2）没有找到有效的保存配置，跳过自动加载');
            }
        } catch (error) {
            console.warn('⚠️ 加载保存的摄像头设备配置失败:', error);
        }
    }

    // 检查演讲者模式是否已配置（用于自动跳过步骤）
    checkSpeakerConfigured() {
        const config = this.loadConfiguration();
        if (config && config.speakerSettings && config.enabled) {
            // 恢复演讲者设置状态
            this.speakerPosition = config.speakerSettings.position || 'bottom-right';
            this.speakerSize = config.speakerSettings.size || 0.20;
            this.speakerMargin = config.speakerSettings.margin || 0.02;
            // console.log('📹 检测到已配置的演讲者模式设置');
            return true;
        }
        return false;
    }

    // 加载保存的演讲者设置
    loadSavedSpeakerSettings() {
        try {
            const config = this.loadConfiguration();
            if (config && config.speakerSettings && config.enabled) {
                // 恢复演讲者设置
                this.speakerPosition = config.speakerSettings.position || 'bottom-right';
                this.speakerSize = config.speakerSettings.size || 0.20;
                this.speakerMargin = config.speakerSettings.margin || 0.02;
                
                // console.log('✅ 已加载保存的演讲者设置:', {
                //     position: this.speakerPosition,
                //     size: this.speakerSize,
                //     margin: this.speakerMargin
                // });
            }
        } catch (error) {
            console.warn('⚠️ 加载保存的演讲者设置失败:', error);
        }
    }

    // 验证演讲者设置
    validateSpeakerSettings() {
        // 检查是否已经完成过演讲者设置
        const config = this.loadConfiguration();
        if (config && config.speakerSettings && config.enabled) {
            // console.log('✅ 演讲者设置已完成');
            return true;
        }
        
        // 如果没有保存的配置，说明用户还没有完成设置
        // console.log('❌ 演讲者设置尚未完成');
        return false;
    }

    // 设置录制预览
    async setupRecordingPreview() {
        // 确保摄像头流可用
        if (!this.currentStream && this.selectedDeviceId) {
            // 重新获取摄像头流
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: this.selectedDeviceId } },
                    audio: true
                });
                this.currentStream = stream;
                this.isPreviewActive = true;
            } catch (error) {
                console.error('❌ 获取摄像头流失败:', error);
                throw error;
            }
        }
        
        if (!this.currentStream) {
            throw new Error('摄像头流不可用，请返回上一步检查摄像头设置');
        }
    }


    // 显示当前设定
    displayCurrentSettings() {
        const displayPosition = document.getElementById('displaySpeakerPosition');
        const displaySize = document.getElementById('displaySpeakerSize');
        const displayMargin = document.getElementById('displaySpeakerMargin');
        
        if (!displayPosition || !displaySize || !displayMargin) return;
        
        // 获取演讲者位置的中文描述
        const positionMap = {
            'speaker-only': '只有演讲者',
            'top-left': '左上角',
            'bottom-left': '左下角',
            'top-right': '右上角',
            'bottom-right': '右下角',
            'left': '左侧中央',
            'right': '右侧中央',
            'top': '上方中央',
            'bottom': '下方中央'
        };
        
        // 更新显示内容
        displayPosition.textContent = positionMap[this.speakerPosition] || '右下角';
        displaySize.textContent = Math.round(this.speakerSize * 100) + '%';
        displayMargin.textContent = Math.round(this.speakerMargin * 100) + '%';
    }

    // 设置录制事件监听器
    setupRecordingEventListeners() {
        const downloadVideoBtn = document.getElementById('downloadVideoBtn');
        
        if (downloadVideoBtn) {
            downloadVideoBtn.addEventListener('click', () => this.downloadRecordedVideo());
        }
    }

    // 显示进度UI
    showProgressUI() {
        const progressContainer = document.getElementById('progressContainer');
        if (!progressContainer) return;
        
        // 创建临时的VideoConverter来显示进度UI
        if (!this.progressUI) {
            // 导入ProgressUI类
            import('../../../modules/progress-ui.js').then(module => {
                const ProgressUI = module.default;
                this.progressUI = new ProgressUI({
                    title: '视频录制与转换',
                    showLogs: true
                });
                
                // 创建并显示UI
                this.progressUI.create(progressContainer);
                
                // 设置中心按钮点击事件 - 在创建后设置
                this.progressUI.setCenterButtonClick(() => {
                    console.log('录制按钮被点击');
                    this.startRecordingTest();
                });
                
                this.progressUI.show();
                progressContainer.style.display = 'block';
            });
        }
    }

    // 开始录制测试
    async startRecordingTest() {
        console.log('开始录制测试...');
        
        // 立即显示进度，禁用录制按钮
        this.progressUI.updateProgress(1, '准备录制...');
        
        const progressContainer = document.getElementById('progressContainer');
        const resultContainer = document.getElementById('resultContainer');
        
        if (!this.currentStream) {
            alert('请先确保摄像头预览正常工作');
            this.progressUI.updateProgress(0, '点击开始录制');
            return;
        }
        
        try {
            // 隐藏结果容器
            if (resultContainer) {
                resultContainer.style.display = 'none';
            }
            
            // 获取转换选项
            const conversionOptions = this.getConversionOptions();
            
            // 创建简化的视频控制器（替换复杂的VideoConverter）
            if (this.videoController) {
                this.videoController.destroy();
            }
            
            const videoElement = document.getElementById('testVideoPreview');
            this.videoController = new window.SimpleVideoController();
            
            // 设置回调函数
            this.videoController.setCallbacks({
                onComplete: (result) => this.handleRecordingComplete(result),
                onError: (error) => this.handleRecordingError(error),
                onLog: (message) => {
                    // 检查FFmpeg转换进度
                    if (message.includes('time=') && message.includes('fps=')) {
                        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
                        if (timeMatch) {
                            const hours = parseInt(timeMatch[1]);
                            const minutes = parseInt(timeMatch[2]);
                            const seconds = parseInt(timeMatch[3]);
                            const centiseconds = parseInt(timeMatch[4]);
                            const currentTime = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
                            
                            // 获取实际录制时长
                            const totalDuration = this.videoController.getRecordingDuration();
                            const conversionProgress = Math.min(currentTime / totalDuration, 1); // 限制在0-1之间
                            const totalProgress = 25 + 75 * conversionProgress; // 25% + 75% * x
                            
                            this.progressUI.updateProgress(Math.round(totalProgress * 10) / 10, `转换中... ${Math.round(conversionProgress * 100)}%`);
                        }
                    }
                    
                    // 将日志添加到现有的进度UI
                    if (this.progressUI) {
                        this.progressUI.addLog(message);
                    }
                },
                onProgress: (data) => {
                    // 更新现有进度UI（适配SimpleVideoController格式）
                    if (this.progressUI) {
                        let percent = 0;
                        let status = '';
                        
                        switch (data.type) {
                            case 'recording':
                                // 录制占100%（简化版本）
                                percent = (data.seconds / 5) * 100; // 5秒录制
                                status = `录制中: ${data.seconds}秒`;
                                break;
                            case 'conversion':
                                // 转换
                                percent = data.percent || 0;
                                status = `转换中: ${percent}%`;
                                break;
                        }
                        
                        this.progressUI.updateProgress(percent, status);
                    }
                }
            });
            
            // 3秒倒计时开始录制（进度保持0）
            console.log('⏰ 开始3秒倒计时...');
            
            // 倒计时开始时关闭摄像头
            console.log('📹 倒计时开始，关闭摄像头预览...');
            this.stopPreview();
            
            for (let i = 3; i >= 1; i--) {
                this.progressUI.updateProgress(0, `${i}秒后开始录制，请看向摄像头...`);
                console.log(`倒计时: ${i}秒`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 倒计时结束时重新开启摄像头
            console.log('📹 倒计时结束，重新开启摄像头...');
            await this.startPreview();
            
            // 初始化简化控制器（使用重新开启的摄像头流）
            console.log('🔧 开始初始化视频控制器...');
            await this.videoController.init(this.currentStream);
            console.log('✅ 视频控制器初始化完成');
            
            console.log('🎬 倒计时结束，开始录制...');
            
            // 开始录制（5秒自动停止并转换）
            console.log('📹 调用 startRecording(5)...');
            this.videoController.startRecording(5);
            console.log('📹 startRecording(5) 调用完成');
            
            // 录制期间进度推进（5秒内从0%推进到25%）
            let recordingProgress = 0;
            const recordingInterval = setInterval(() => {
                recordingProgress += 0.5; // 每0.1秒推进0.5%，5秒推进25%
                if (recordingProgress <= 25) {
                    const currentSeconds = Math.floor(recordingProgress / 5); // 当前录制秒数
                    const remainingSeconds = 5 - currentSeconds; // 剩余秒数
                    const displayProgress = Math.round(recordingProgress * 10) / 10; // 保留1位小数
                    this.progressUI.updateProgress(displayProgress, `正在录制... 剩余${remainingSeconds}秒`);
                } else {
                    clearInterval(recordingInterval);
                }
            }, 100); // 每0.1秒更新一次
            
            // 6秒后开始转换（给录制完成留1秒缓冲）
            setTimeout(async () => {
                try {
                    console.log('⏰ 6秒等待结束，录制已完成');
                    
                    // 录制完成后立即关闭摄像头
                    console.log('📹 录制完成，关闭摄像头预览...');
                    this.stopPreview();
                    
                    console.log('📊 当前演讲者位置:', this.speakerPosition);
                    console.log('📊 转换选项:', conversionOptions);
                    // 不在这里更新进度，让FFmpeg日志处理来动态更新
                    
                    if (conversionOptions.composite) {
                        console.log('🎭 开始演讲者模式合成...');
                        await this.videoController.compositeVideoWithBackground(conversionOptions.composite);
                    } else {
                        console.log('🔄 开始标准转换...');
                        await this.videoController.startConversion();
                    }
                    console.log('✅ 转换完成！');
                    
                    // 调用录制完成处理
                    this.handleRecordingComplete({
                        success: true,
                        blob: this.videoController.lastConvertedBlob,
                        message: '录制和转换完成'
                    });
                    
                } catch (error) {
                    console.log('❌ 转换过程中出错:', error);
                    this.handleRecordingError(error);
                }
            }, 6000);
            
        } catch (error) {
            this.handleRecordingError(error);
            // 重置按钮状态（错误已在handleRecordingError中处理）
        }
    }

    // 获取转换选项
    getConversionOptions() {
        // 根据演讲者位置判断是否需要背景合成
        if (this.speakerPosition === 'speaker-only') {
            // 仅演讲者模式
            return {
                conversion: {
                    preset: 'fast',
                    crf: 23,
                    audioBitrate: '128k'
                }
            };
        } else {
            // 需要背景合成
            // 使用PathResolver来正确解析路径为绝对URL
            const backgroundImage = new URL('./assets/images/cover.jpg', window.location.href).href;
            
            // 计算合成参数
            const videoScale = this.calculateVideoScale();
            const overlayPosition = this.calculateOverlayPosition();
            const outputSize = '1920:1080'; // 标准1080p输出
            
            return {
                composite: {
                    pptBackground: backgroundImage,
                    videoScale: videoScale,
                    overlayPosition: overlayPosition,
                    outputSize: outputSize,
                    autoTrimStart: true
                }
            };
        }
    }

    // 计算视频缩放参数
    calculateVideoScale() {
        const baseWidth = 1920;
        const baseHeight = 1080;
        
        if (this.speakerPosition === 'speaker-only') {
            return `${baseWidth}:${baseHeight}`;
        }
        
        const speakerWidth = Math.round(baseWidth * this.speakerSize);
        const speakerHeight = Math.round(speakerWidth * (9/16)); // 保持16:9比例
        
        return `${speakerWidth}:${speakerHeight}`;
    }

    // 计算叠加位置参数
    calculateOverlayPosition() {
        const baseWidth = 1920;
        const baseHeight = 1080;
        
        if (this.speakerPosition === 'speaker-only') {
            return '0:0';
        }
        
        const speakerWidth = Math.round(baseWidth * this.speakerSize);
        const speakerHeight = Math.round(speakerWidth * (9/16));
        const margin = Math.round(baseWidth * this.speakerMargin);
        
        let x, y;
        
        switch (this.speakerPosition) {
            case 'top-left':
                x = margin;
                y = margin;
                break;
                
            case 'top-right':
                x = baseWidth - speakerWidth - margin;
                y = margin;
                break;
                
            case 'bottom-left':
                x = margin;
                y = baseHeight - speakerHeight - margin;
                break;
                
            case 'bottom-right':
            default:
                x = baseWidth - speakerWidth - margin;
                y = baseHeight - speakerHeight - margin;
                break;
                
            case 'left':
                x = margin;
                y = (baseHeight - speakerHeight) / 2;
                break;
                
            case 'right':
                x = baseWidth - speakerWidth - margin;
                y = (baseHeight - speakerHeight) / 2;
                break;
                
            case 'top':
                x = (baseWidth - speakerWidth) / 2;
                y = margin;
                break;
                
            case 'bottom':
                x = (baseWidth - speakerWidth) / 2;
                y = baseHeight - speakerHeight - margin;
                break;
        }
        
        return `${Math.round(x)}:${Math.round(y)}`;
    }

    // 处理录制完成
    handleRecordingComplete(result) {
        console.log('✅ 录制和转换完成:', result);
        
        const resultContainer = document.getElementById('resultContainer');
        const videoPreviewContainer = document.getElementById('videoPreviewContainer');
        
        // 显示结果
        resultContainer.style.display = 'block';
        
        // 创建转换后的视频预览
        if (this.videoController && this.videoController.lastConvertedBlob) {
            // 创建新的video元素显示转换后的MP4
            const convertedVideoElement = document.createElement('video');
            convertedVideoElement.controls = true;
            convertedVideoElement.style.maxWidth = '100%';
            convertedVideoElement.style.marginTop = '10px';
            
            // 设置转换后的视频源
            const videoUrl = URL.createObjectURL(this.videoController.lastConvertedBlob);
            convertedVideoElement.src = videoUrl;
            
            videoPreviewContainer.innerHTML = '';
            videoPreviewContainer.appendChild(convertedVideoElement);
            
            // 保存URL用于清理
            this.lastVideoUrl = videoUrl;
            
            // 保存转换结果
            this.recordingResult = result;
        }
        
        // 显示步骤管理器中的按钮
        if (this.stepManager && this.stepManager.currentStepIndex === 3) { // 第四步的索引是3
            // 显示下载按钮
            this.stepManager.showButton('step4', 'downloadBtn');
            // 显示完成设置按钮
            this.stepManager.showButton('step4', 'completeBtn');
        }
    }

    // 处理录制错误
    handleRecordingError(error) {
        console.error('❌ 录制失败:', error);
        
        // 添加错误日志到UI
        if (this.progressUI) {
            this.progressUI.addLog(`❌ 录制失败: ${error.message}`);
            this.progressUI.updateProgress(0, '录制失败');
        }
        
        // 显示错误详情
        alert(`录制失败: ${error.message}`);
    }

    // 下载录制的视频
    downloadRecordedVideo() {
        if (this.videoController && this.recordingResult) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `camera_test_${timestamp}.mp4`;
            this.videoController.downloadVideo(filename);
        }
    }

    // 清理资源
    cleanup() {
        console.log('📹 清理摄像头设置资源...');
        
        // 停止预览
        this.stopPreview();
        this.stopPreviewRefresh(); // 停止预览刷新
        
        // 清理录制测试相关的视频转换器
        if (this.videoController) {
            console.log('🔧 清理视频控制器...');
            this.videoController.destroy();
            this.videoController = null;
        }
        
        // 清理隐藏的预览视频元素
        const hiddenVideo = document.getElementById('hiddenCameraPreview');
        if (hiddenVideo) {
            hiddenVideo.srcObject = null;
            hiddenVideo.remove();
        }
        
        // 清理演讲者预览视频元素
        const speakerPreviewVideo = document.getElementById('speakerPreviewVideo');
        if (speakerPreviewVideo) {
            if (speakerPreviewVideo.srcObject) {
                const tracks = speakerPreviewVideo.srcObject.getTracks();
                tracks.forEach(track => {
                    console.log(`🔇 停止演讲者预览轨道: ${track.kind} (${track.label})`);
                    track.stop();
                });
                speakerPreviewVideo.srcObject = null;
            }
        }
        
        // 清理静态图像元素
        const cameraStaticFrame = document.getElementById('cameraStaticFrame');
        const speakerStaticFrame = document.getElementById('speakerStaticFrame');
        if (cameraStaticFrame) {
            cameraStaticFrame.remove();
            console.log('🗑️ 已清理摄像头静态图像');
        }
        if (speakerStaticFrame) {
            speakerStaticFrame.remove();
            console.log('🗑️ 已清理演讲者静态图像');
        }
        
        // 重置状态变量
        this.permissionGranted = false;
        this.devicesDetected = false;
        this.availableDevices = [];
        this.selectedDeviceId = null;
        this.selectedDeviceName = null;
        this.isPreviewActive = false;
        
        console.log('✅ 摄像头设置资源清理完成');
    }
}

// 全局实例
let cameraSetupManager = null;

// 初始化摄像头设置
const initializeCameraSetup = async () => {
    // console.log('📹 开始初始化摄像头设置...');
    
    try {
        cameraSetupManager = new CameraSetupManager();
        
        // 初始化设置
        const success = await cameraSetupManager.initialize();
        if (success) {
            // console.log('✅ 摄像头设置初始化完成');
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

// console.log('📹 摄像头设置管理器已加载');
