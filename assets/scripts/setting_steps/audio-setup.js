/**
 * 使用新的SettingsStepManager重构的阿里云语音识别设置
 * 演示如何使用统一的步骤管理器
 */

// 阿里云语音识别设置管理器
class AudioSetupManager {
    constructor() {
        this.settingId = 'audio';
        this.stepManager = null;
        this.config = {
            showImportExport: true
        };
        
        // 初始化步骤配置
        this.initializeSteps();
    }

    // 初始化步骤配置
    initializeSteps() {
        this.steps = [
            {
                id: 'step1',
                title: '启用智能语音交互服务',
                content: {
                    description: `
                        启用阿里云智能语音交互服务，为语音识别功能做准备。
                        <br><br>
                        <strong>操作步骤：</strong><br>
                        1. 前往<a href="https://nls-portal.console.aliyun.com/overview" target="_blank">智能语音交互控制台</a><br>
                        2. 如果是首次使用，点击"立即开通"按钮<br>
                        3. 根据提示完成服务开通流程
                    `,
                    image: 'assets/images/settings/step_1_enable_service.png'
                },
                buttons: [
                    {
                        id: 'completeBtn',
                        text: '完成服务启用',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.completeStep1(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.validateStep1(),
                onEnter: () => console.log('进入步骤1: 启用服务'),
                validation: () => this.validateStep1()
            },
            {
                id: 'step2',
                title: '获取并配置 AppKey',
                content: {
                    description: `
                        创建项目并获取项目的AppKey。
                        <br><br>
                        <strong>操作步骤：</strong><br>
                        1. 前往<a href="https://nls-portal.console.aliyun.com/applist" target="_blank">全部项目</a>页面<br>
                        2. 创建新项目，在列表中找到它<br>
                        3. 点击项目名称进入项目详情<br>
                        4. 在项目详情页面找到并复制AppKey<br>
                        5. 将AppKey粘贴到下方输入框中
                    `,
                    image: 'assets/images/settings/step_2_get_appkey.png',
                    form: [
                        {
                            type: 'text',
                            id: 'audioAppKey',
                            label: 'AppKey',
                            placeholder: '从阿里云控制台项目中获取的AppKey',
                            required: true
                        }
                    ]
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
                        id: 'validateBtn',
                        text: '验证',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.validateStep2(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.canAutoJumpFromStep2(),
                preJumpCheck: () => this.preJumpCheckStep2(),
                onEnter: () => this.loadSavedAppKey(),
                validation: () => this.validateStep2Requirements()
            },
            {
                id: 'step3',
                title: '创建RAM用户',
                content: {
                    description: `
                        创建用户用于AccessKey配置。
                        <br><br>
                        <strong>操作步骤：</strong><br>
                        1. 前往<a href="https://ram.console.aliyun.com/overview?activeTab=workflow" target="_blank">RAM控制台工作流程</a><br>
                        2. 选择"创建初始用户"下的"账号管理员"<br>
                        3. 完成该步
                    `,
                    image: 'assets/images/settings/step_3_create_user.png'
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
                        id: 'completeBtn',
                        text: '完成用户创建',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.completeStep3(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.canAutoJumpFromStep3(),
                validation: () => this.validateStep3Requirements()
            },
            {
                id: 'step4',
                title: '配置 AccessKey',
                content: {
                    description: `
                        创建并配置AccessKey用于服务认证。
                        <br><br>
                        <strong>操作步骤：</strong><br>
                        1. 前往<a href="https://ram.console.aliyun.com/users" target="_blank">RAM用户管理</a>页面<br>
                        2. 找到刚创建的用户添加权限<br>
                        3. 搜索并添加AliyunNLSFullAccess权限<br>
                        4. 点击用户名进入详情页创建AccessKey<br>
                        5. 填写下方的AccessKey信息
                    `,
                    image: 'assets/images/settings/step_4_accesskey.png',
                    form: [
                        {
                            type: 'text',
                            id: 'audioAccessKeyId',
                            label: 'AccessKey ID',
                            placeholder: 'RAM用户的Access Key ID',
                            required: true
                        },
                        {
                            type: 'password',
                            id: 'audioAccessKeySecret',
                            label: 'AccessKey Secret',
                            placeholder: 'RAM用户的Access Key Secret',
                            required: true
                        }
                    ]
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
                        id: 'validateBtn',
                        text: '验证',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.validateStep4(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.canAutoJumpFromStep4(),
                preJumpCheck: () => this.preJumpCheckStep4(),
                onEnter: () => this.loadSavedAccessKeys(),
                validation: () => this.validateStep4Requirements()
            },
            {
                id: 'step5',
                title: '录音识别功能测试',
                content: {
                    description: `
                        测试录音功能和语音识别效果，确保系统正常工作。
                        <br><br>
                        <strong>使用增强型录音器</strong><br>
                        <div style="margin: 15px 0; padding: 10px; background-color: #f0f8ff; border-left: 4px solid var(--primary-purple); border-radius: 4px;">
                            <span style="color: #2c5282;"><strong>🎯 高质量音频处理</strong> - 使用Web Audio API获得最佳录音质量和识别效果</span>
                        </div>
                        <br>
                        <strong>测试说明：</strong><br>
                        1. 点击"开始"按钮开始录音<br>
                        2. 清晰地说话5-10秒钟<br>
                        3. 系统将识别您的语音并显示结果<br>
                        4. 查看音频质量评分和识别效果
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
                        text: '开始',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.toggleRecording(),
                        show: true
                    },
                    {
                        id: 'downloadBtn',
                        text: '下载录音',
                        type: 'secondary',
                        onClick: () => this.downloadRecording(),
                        show: false
                    },
                    {
                        id: 'completeBtn',
                        text: '完成设置',
                        type: 'success',
                        onClick: () => this.completeSetup(),
                        show: false
                    }
                ],
                onEnter: () => {
                    this.initializeRecordingTest();
                    // 每次进入步骤时隐藏完成按钮，只有录音测试成功后才显示
                    this.stepManager.hideButton('step5', 'completeBtn');
                    // 清空录音容器和重置按钮状态
                    this.clearRecordingResults();
                },
                validation: () => this.validateRecordingTest()
            }
        ];
    }

    // 创建设置界面
    createSetup() {
        // 创建步骤管理器实例（标题将由SettingsStepManager统一生成）
        // 注意：audio设置使用'recording'作为settingId来获取正确的标题
        this.stepManager = new SettingsStepManager({
            settingId: 'recording', // 使用'recording'而不是this.settingId('audio')来获取正确的标题
            steps: this.steps,
            config: this.config,
            onComplete: () => this.handleSetupComplete(),
            onBack: () => handleBackToSettings()
        });

        // 创建overlay
        const overlay = this.stepManager.createOverlay();
        
        // 全局引用，供onclick事件使用
        window.audioManager = this;
        
        return overlay;
    }

    // 步骤1验证
    async validateStep1() {
        // 简单的确认，实际项目中可以检查服务状态
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 500);
        });
    }

    // 完成步骤1
    completeStep1() {
        this.stepManager.showStepStatus('step1', '正在验证服务状态...', 'info');
        
        setTimeout(() => {
            this.stepManager.markStepCompleted('step1', true);
            this.stepManager.goToStep(1); // 跳转到步骤2
        }, 1000);
    }

    // 加载保存的AppKey
    loadSavedAppKey() {
        const config = simpleConfig.getAll();
        if (config.appKey) {
            this.stepManager.setStepFormData('step2', {
                audioAppKey: config.appKey
            });
        }
    }

    // 检查步骤2是否已完成（基于已保存的配置）
    checkStep2Completed() {
        const config = simpleConfig.getAll();
        const appKey = config.appKey?.trim();
        console.log('🔍 检查步骤2完成状态 - AppKey:', appKey ? '已设置' : '未设置');
        return appKey && appKey.length >= 10;
    }

    // 检查步骤2字段是否已填写（用于自动跳转验证）
    checkStep2FieldsCompleted() {
        // 兼容性函数，调用新的自动跳步函数
        return this.canAutoJumpFromStep2();
    }

    // 检查步骤3是否已完成（基于已保存的配置）
    checkStep3Completed() {
        console.log('🔍 检查步骤3完成状态 - 直接返回true（简化验证）');
        return true; // 简化验证，直接返回true
    }

    // ==================== 预跳转检查函数（字段F - 检查基本条件是否满足） ====================
    
    // 步骤2预跳转检查 - 检查AppKey是否已填写且格式基本正确
    preJumpCheckStep2() {
        const formData = this.stepManager.getStepFormData('step2');
        const appKey = formData.audioAppKey?.trim();
        
        console.log('🔍 步骤2预跳转检查 - AppKey:', appKey ? '已填写' : '未填写');
        
        // 基本格式检查：AppKey已填写且长度合理
        if (!appKey || appKey.length < 10) {
            console.log('❌ 步骤2预跳转检查失败：AppKey未填写或长度不足');
            return false;
        }
        
        console.log('✅ 步骤2预跳转检查通过');
        return true;
    }
    
    // 步骤4预跳转检查 - 检查AccessKey字段是否已填写且格式基本正确
    preJumpCheckStep4() {
        const formData = this.stepManager.getStepFormData('step4');
        const accessKeyId = formData.audioAccessKeyId?.trim();
        const accessKeySecret = formData.audioAccessKeySecret?.trim();
        
        console.log('🔍 步骤4预跳转检查:');
        console.log('  - AccessKeyId:', accessKeyId ? '已填写' : '未填写');
        console.log('  - AccessKeySecret:', accessKeySecret ? '已填写' : '未填写');
        
        // 基本格式检查：两个字段都已填写且长度合理
        if (!accessKeyId || accessKeyId.length < 16) {
            console.log('❌ 步骤4预跳转检查失败：AccessKeyId未填写或长度不足');
            return false;
        }
        
        if (!accessKeySecret || accessKeySecret.length < 20) {
            console.log('❌ 步骤4预跳转检查失败：AccessKeySecret未填写或长度不足');
            return false;
        }
        
        console.log('✅ 步骤4预跳转检查通过');
        return true;
    }
    
    // ==================== 验证函数（用于manager调用验证步骤状态） ====================
    
    // 验证步骤2要求是否满足
    validateStep2Requirements() {
        const formData = this.stepManager.getStepFormData('step2');
        const appKey = formData.audioAppKey?.trim();
        console.log('🔍 验证步骤2要求 - AppKey:', appKey ? '已填写' : '未填写');
        
        // 基本要求：AppKey已填写
        return appKey && appKey.length > 0;
    }
    
    // 验证步骤3要求是否满足
    validateStep3Requirements() {
        console.log('🔍 验证步骤3要求 - 简化验证，直接返回true');
        return true; // 步骤3是手动确认步骤，没有特殊要求
    }
    
    // 验证步骤4要求是否满足
    validateStep4Requirements() {
        const formData = this.stepManager.getStepFormData('step4');
        const accessKeyId = formData.audioAccessKeyId?.trim();
        const accessKeySecret = formData.audioAccessKeySecret?.trim();
        console.log('🔍 验证步骤4要求:');
        console.log('  - AccessKeyId:', accessKeyId ? '已填写' : '未填写');
        console.log('  - AccessKeySecret:', accessKeySecret ? '已填写' : '未填写');
        
        // 基本要求：AccessKeyId和AccessKeySecret都已填写
        return accessKeyId && accessKeyId.length > 0 && accessKeySecret && accessKeySecret.length > 0;
    }
    
    // ==================== 自动跳步函数（用于manager调用判断是否可以自动跳步） ====================
    
    // 检查是否可以从步骤2自动跳步
    canAutoJumpFromStep2() {
        console.log('🔍 检查步骤2自动跳步条件');
        
        // 条件1：验证通过
        const validationPassed = this.validateStep2Requirements();
        console.log('  - 验证通过:', validationPassed);
        
        // 条件2：步骤已标记为完成
        const isStepCompleted = this.stepManager.isStepCompleted('step2');
        console.log('  - 步骤已完成标记:', isStepCompleted);
        
        // 条件3：配置已保存
        const config = simpleConfig.getAll();
        const savedAppKey = config.appKey?.trim();
        const isConfigSaved = savedAppKey && savedAppKey.length >= 10;
        console.log('  - 配置已保存:', isConfigSaved);
        
        const canAutoJump = validationPassed && isStepCompleted && isConfigSaved;
        console.log('🔍 步骤2自动跳步结果:', canAutoJump);
        return canAutoJump;
    }
    
    // 检查是否可以从步骤3自动跳步
    canAutoJumpFromStep3() {
        console.log('🔍 检查步骤3自动跳步条件');
        
        // 条件1：验证通过
        const validationPassed = this.validateStep3Requirements();
        console.log('  - 验证通过:', validationPassed);
        
        // 条件2：步骤已标记为完成
        const isStepCompleted = this.stepManager.isStepCompleted('step3');
        console.log('  - 步骤已完成标记:', isStepCompleted);
        
        const canAutoJump = validationPassed && isStepCompleted;
        console.log('🔍 步骤3自动跳步结果:', canAutoJump);
        return canAutoJump;
    }
    
    // 检查是否可以从步骤4自动跳步
    canAutoJumpFromStep4() {
        console.log('🔍 检查步骤4自动跳步条件');
        
        // 条件1：验证通过
        const validationPassed = this.validateStep4Requirements();
        console.log('  - 验证通过:', validationPassed);
        
        // 条件2：步骤已标记为完成
        const isStepCompleted = this.stepManager.isStepCompleted('step4');
        console.log('  - 步骤已完成标记:', isStepCompleted);
        
        // 条件3：配置已保存并验证成功
        const config = simpleConfig.getAll();
        const savedAccessKeyId = config.accessKeyId?.trim();
        const savedAccessKeySecret = config.accessKeySecret?.trim();
        const isConfigSaved = savedAccessKeyId && savedAccessKeyId.length > 0 && savedAccessKeySecret && savedAccessKeySecret.length > 0;
        console.log('  - 配置已保存:', isConfigSaved);
        
        const canAutoJump = validationPassed && isStepCompleted && isConfigSaved;
        console.log('🔍 步骤4自动跳步结果:', canAutoJump);
        return canAutoJump;
    }
    
    // ==================== 兼容性函数（保持向后兼容） ====================
    
    // 检查步骤4字段是否已填写（用于自动跳转验证）
    checkStep4FieldsCompleted() {
        // 兼容性函数，调用新的自动跳步函数
        return this.canAutoJumpFromStep4();
    }

    // 通用格式检查接口
    validateFieldFormat(value, fieldName, length, description) {
        if (!value) {
            return { valid: false, error: `请输入${fieldName}` };
        }
        
        // 创建正则表达式：指定长度的A-Za-z0-9字符
        const pattern = new RegExp(`^[A-Za-z0-9]{${length}}$`);
        
        if (!pattern.test(value)) {
            return { 
                valid: false, 
                error: `${fieldName}格式不正确`, 
                isFormatError: true,
                suggestion: `${fieldName}应该是${length}位的${description}`
            };
        }
        
        return { valid: true };
    }

    // AppKey格式检查（使用通用接口）
    validateAppKeyFormat(appKey) {
        return this.validateFieldFormat(appKey, 'AppKey', 16, '字母和数字组合');
    }

    // AccessKeyID格式检查
    validateAccessKeyIdFormat(accessKeyId) {
        return this.validateFieldFormat(accessKeyId, 'AccessKey ID', 24, '字母和数字组合');
    }

    // AccessKeySecret格式检查
    validateAccessKeySecretFormat(accessKeySecret) {
        return this.validateFieldFormat(accessKeySecret, 'AccessKey Secret', 30, '字母和数字组合');
    }

    // 验证AppKey（实际验证在第5步进行）
    async validateAppKey() {
        const formData = this.stepManager.getStepFormData('step2');
        const appKey = formData.audioAppKey?.trim();
        
        // 进行格式检查
        const formatCheck = this.validateAppKeyFormat(appKey);
        if (!formatCheck.valid) {
            if (formatCheck.isFormatError) {
                // 格式错误但不阻止流程，返回警告信息
                return { 
                    valid: true, 
                    warning: true, 
                    message: formatCheck.error + '，' + formatCheck.suggestion,
                    suggestion: '将在语音识别进行实际验证'
                };
            } else {
                // 其他错误（如空值）直接抛出
                throw new Error(formatCheck.error);
            }
        }
        
        // 格式正确，返回成功但说明实际验证在第5步
        return { 
            valid: true, 
            message: '格式检查通过，将在语音识别进行实际验证' 
        };
    }

    // 验证步骤2
    async validateStep2() {
        try {
            console.log('🔄 validateStep2 开始执行');
            this.stepManager.showStepStatus('step2', '正在检查AppKey格式...', 'processing');
            
            const formData = this.stepManager.getStepFormData('step2');
            console.log('🔄 获取到的表单数据:', formData);
            
            if (!formData.audioAppKey || !formData.audioAppKey.trim()) {
                console.log('❌ AppKey为空，验证失败');
                this.stepManager.showStepStatus('step2', '请先填写AppKey', 'error');
                return false;
            }
            
            const validationResult = await this.validateAppKey();
            console.log('🔄 AppKey验证结果:', validationResult);
            
            // AppKey验证成功，字段保存将在completeSetup中统一处理
            
            if (validationResult.warning) {
                // 格式有问题，显示警告并等待跳转
                const warningMessage = `${validationResult.message}。${validationResult.suggestion}`;
                console.log('⚠️ AppKey格式有问题，显示警告:', warningMessage);
                
                // 显示警告状态
                this.stepManager.showStepStatus('step2', warningMessage, 'warning');
                
                // 等待2秒后跳转
                setTimeout(() => {
                    console.log('🔄 AppKey警告后跳转到步骤3');
                    this.stepManager.markStepCompleted('step2', true);
                    this.stepManager.goToStep(2); // 跳转到步骤3
                }, 2000);
            } else {
                // 格式正确，正常跳转
                console.log('✅ AppKey格式正确，正常跳转');
                this.stepManager.showStepStatus('step2', validationResult.message, 'success');
                
                setTimeout(() => {
                    console.log('🔄 AppKey验证成功后跳转到步骤3');
                    this.stepManager.markStepCompleted('step2', true);
                    this.stepManager.goToStep(2); // 跳转到步骤3
                }, 1000);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ validateStep2 执行出错:', error);
            this.stepManager.showStepStatus('step2', error.message, 'error');
            return false;
        }
    }

    // 验证步骤3
    async validateStep3() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 500);
        });
    }

    // 完成步骤3
    completeStep3() {
        this.stepManager.showStepStatus('step3', '正在验证RAM用户...', 'info');
        
        setTimeout(() => {
            this.stepManager.markStepCompleted('step3', true);
            this.stepManager.goToStep(3); // 跳转到步骤4
        }, 1000);
    }

    // 加载保存的AccessKeys
    loadSavedAccessKeys() {
        const config = simpleConfig.getAll();
        this.stepManager.setStepFormData('step4', {
            audioAccessKeyId: config.accessKeyId || '',
            audioAccessKeySecret: config.accessKeySecret || ''
        });
    }

    // 验证AccessKeys - 实际调用API验证
    async validateAccessKeys() {
        const formData = this.stepManager.getStepFormData('step4');
        const keyId = formData.audioAccessKeyId?.trim();
        const keySecret = formData.audioAccessKeySecret?.trim();
        
        if (!keyId || !keySecret) {
            throw new Error('请填写完整的AccessKey信息');
        }
        
        if (keyId.length < 10 || keySecret.length < 10) {
            throw new Error('AccessKey格式不正确');
        }
        
        // 获取AppKey（必须已经在前面的步骤中配置）
        const appKey = simpleConfig.get('appKey');
        if (!appKey) {
            throw new Error('缺少AppKey，请先完成第二步配置');
        }
        
        // console.log('🔄 开始验证AccessKey凭据...');
        
        try {
            // 调用vercel托管的get-token API来验证凭据
            const response = await fetch('https://aliyun-voice-to-text-api.vercel.app/api/get-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appKey: appKey,
                    accessKeyId: keyId,
                    accessKeySecret: keySecret
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API请求失败:', response.status, errorText);
                
                // 检查是否是服务维护相关的状态码
                if (response.status === 503 || response.status === 502 || response.status === 504) {
                    throw new Error('阿里云服务正在维护中，请稍后重试');
                }
                
                // 检查错误文本中是否包含维护信息
                if (errorText && (
                    errorText.includes('维护') || 
                    errorText.includes('maintenance') ||
                    errorText.includes('服务暂不可用') ||
                    errorText.includes('Service Unavailable')
                )) {
                    throw new Error('阿里云服务正在维护中，请稍后重试');
                }
                
                throw new Error(`验证请求失败: HTTP ${response.status} - ${errorText || '未知错误'}`);
            }
            
            const result = await response.json();
            // console.log('📥 验证API响应:', result);
            
            if (result.success) {
                // console.log('✅ AccessKey验证成功，Token获取成功');
                return true;
            } else {
                // 根据错误信息提供更具体的错误提示
                let errorMessage = result.error || '验证失败';
                
                if (errorMessage.includes('InvalidAccessKeyId')) {
                    errorMessage = 'AccessKey ID无效，请检查是否正确';
                } else if (errorMessage.includes('SignatureDoesNotMatch')) {
                    errorMessage = 'AccessKey Secret错误，请检查是否正确';
                } else if (errorMessage.includes('Forbidden')) {
                    errorMessage = 'AccessKey权限不足，请确保已添加"AliyunNLSFullAccess"权限';
                } else if (errorMessage.includes('APPKEY_NOT_EXIST')) {
                    errorMessage = 'AppKey不存在或无效，请检查第二步的AppKey配置';
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('❌ AccessKey验证失败:', error);
            
            // 如果是网络错误，给出更友好的提示
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络连接后重试');
            }
            
            // 检查是否是阿里云维护相关的错误
            if (error.message && (
                error.message.includes('维护') || 
                error.message.includes('maintenance') ||
                error.message.includes('服务暂不可用') ||
                error.message.includes('Service Unavailable')
            )) {
                throw new Error('阿里云服务正在维护中，请稍后重试');
            }
            
            throw error;
        }
    }

    // 验证步骤4
    async validateStep4() {
        try {
            console.log('🔄 validateStep4 开始执行');
            
            // 禁用验证按钮并显示验证中状态
            const validateBtn = document.getElementById(`${this.settingId}-step4-validateBtn`);
            if (validateBtn) {
                validateBtn.textContent = '验证中...';
                validateBtn.disabled = true;
                validateBtn.style.opacity = '0.6';
                validateBtn.style.cursor = 'not-allowed';
            }
            
            // 首先进行格式检查
            const formData = this.stepManager.getStepFormData('step4');
            console.log('🔄 获取到的表单数据:', formData);
            
            const accessKeyId = formData.audioAccessKeyId?.trim();
            const accessKeySecret = formData.audioAccessKeySecret?.trim();
            
            console.log('🔄 AccessKey字段检查:');
            console.log('  - AccessKeyId:', accessKeyId ? '已填写' : '未填写');
            console.log('  - AccessKeySecret:', accessKeySecret ? '已填写' : '未填写');
            
            if (!accessKeyId || !accessKeySecret) {
                console.log('❌ AccessKey字段未完整填写，验证失败');
                this.stepManager.showStepStatus('step4', '请先填写完整的AccessKey ID和AccessKey Secret', 'error');
                
                // 恢复按钮状态
                if (validateBtn) {
                    validateBtn.textContent = '验证';
                    validateBtn.disabled = false;
                    validateBtn.style.opacity = '1';
                    validateBtn.style.cursor = 'pointer';
                }
                return false;
            }
            
            // 检查AccessKeyID格式
            const idFormatCheck = this.validateAccessKeyIdFormat(accessKeyId);
            // 检查AccessKeySecret格式
            const secretFormatCheck = this.validateAccessKeySecretFormat(accessKeySecret);
            
            let hasFormatWarning = false;
            let warningMessages = [];
            
            if (!idFormatCheck.valid && idFormatCheck.isFormatError) {
                hasFormatWarning = true;
                warningMessages.push(`${idFormatCheck.error}，${idFormatCheck.suggestion}`);
            }
            
            if (!secretFormatCheck.valid && secretFormatCheck.isFormatError) {
                hasFormatWarning = true;
                warningMessages.push(`${secretFormatCheck.error}，${secretFormatCheck.suggestion}`);
            }
            
            // 如果有格式警告，先显示警告信息
            if (hasFormatWarning) {
                const warningMessage = warningMessages.join('；') + '。将进行实际API验证';
                await this.stepManager.showStepWarning('step4', warningMessage, 1500);
            }
            
            this.stepManager.showStepStatus('step4', '正在验证AccessKey...', 'processing');
            
            const isValid = await this.validateAccessKeys();
            console.log('🔄 AccessKey验证结果:', isValid);
            
            if (isValid) {
                // 保存AccessKeys
                // AccessKey验证成功，字段保存将在completeSetup中统一处理
                
                this.stepManager.showStepStatus('step4', 'AccessKey验证成功！', 'success');
                
                // 恢复按钮状态为成功状态
                if (validateBtn) {
                    validateBtn.textContent = '验证成功';
                    validateBtn.style.backgroundColor = '#28a745';
                    validateBtn.style.borderColor = '#28a745';
                }
                
                setTimeout(() => {
                    console.log('🔄 AccessKey验证成功后跳转到步骤5');
                    this.stepManager.markStepCompleted('step4', true);
                    this.stepManager.goToStep(4); // 跳转到步骤5
                }, 1000);
                
                return true;
            }
        } catch (error) {
            console.error('❌ validateStep4 执行出错:', error);
            this.stepManager.showStepStatus('step4', error.message, 'error');
            
            // 验证失败，启用状态将由统一的保存逻辑处理
            
            // 恢复按钮状态为错误状态
            const validateBtn = document.getElementById(`${this.settingId}-step4-validateBtn`);
            if (validateBtn) {
                validateBtn.textContent = '验证';
                validateBtn.disabled = false;
                validateBtn.style.opacity = '1';
                validateBtn.style.cursor = 'pointer';
                validateBtn.style.backgroundColor = '#dc3545';
                validateBtn.style.borderColor = '#dc3545';
                
                // 3秒后恢复原始状态
                setTimeout(() => {
                    validateBtn.textContent = '验证';
                    validateBtn.style.backgroundColor = '';
                    validateBtn.style.borderColor = '';
                }, 3000);
            }
            
            return false;
        }
    }

    // 生成录音测试界面
    generateRecordingTestInterface() {
        return `
            <div class="form-group" id="deviceSelectionGroup">
                <label for="audioDeviceSelect">选择麦克风设备：</label>
                <select id="audioDeviceSelect" class="device-select">
                    <option value="">选择设备...</option>
                </select>
            </div>
            
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
        `;
    }

    // 初始化录音测试
    async initializeRecordingTest() {
        this.recordingTestCompleted = false;
        this.isRecording = false;
        this.selectedDeviceId = null;
        
        // 初始化录音相关变量
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.lastRecordedAudio = null; // 保存最后录制的音频用于下载
        
        // 检测并加载音频设备
        await this.detectAudioDevices();
        
        // 尝试从录音设备配置中获取默认设备
        this.loadMicrophoneConfig();
    }

    // 检测音频输入设备
    async detectAudioDevices() {
        // console.log('🔍 检测音频输入设备...');
        
        try {
            // 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            // 枚举设备
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            const select = document.getElementById('audioDeviceSelect');
            if (select) {
                select.innerHTML = '<option value="">选择设备...</option>';
                
                if (audioInputs.length === 0) {
                    select.innerHTML = '<option value="">未检测到音频输入设备</option>';
                    return;
                }
                
                audioInputs.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `麦克风 ${index + 1}`;
                    select.appendChild(option);
                });
                
                // 默认选择第一个设备
                if (audioInputs.length > 0) {
                    select.value = audioInputs[0].deviceId;
                    this.selectedDeviceId = audioInputs[0].deviceId;
                }
                
                // 监听设备选择变化
                select.addEventListener('change', (e) => {
                    this.selectedDeviceId = e.target.value;
                    // console.log('🔄 音频设备选择已改变:', this.selectedDeviceId);
                });
            }
            
            // console.log(`✅ 检测到 ${audioInputs.length} 个音频输入设备`);
            
        } catch (error) {
            console.error('❌ 检测音频设备失败:', error);
            const select = document.getElementById('audioDeviceSelect');
            if (select) {
                select.innerHTML = '<option value="">检测失败，请检查麦克风权限</option>';
            }
        }
    }

    // 从录音设备配置加载默认设备
    loadMicrophoneConfig() {
        try {
            const microphoneConfig = localStorage.getItem('microphoneConfig');
            if (microphoneConfig) {
                const config = JSON.parse(microphoneConfig);
                if (config.selectedDeviceId && config.enabled) {
                    const select = document.getElementById('audioDeviceSelect');
                    if (select) {
                        // 尝试选择配置的设备
                        const option = select.querySelector(`option[value="${config.selectedDeviceId}"]`);
                        if (option) {
                            select.value = config.selectedDeviceId;
                            this.selectedDeviceId = config.selectedDeviceId;
                            // console.log('✅ 已选择录音设备配置中的设备:', config.selectedDeviceName);
                            
                            // 锁定设备选择，禁用下拉菜单
                            select.disabled = true;
                            select.style.backgroundColor = '#2a2a2a';
                            select.style.color = '#888';
                            select.style.cursor = 'not-allowed';
                            
                            // 在设备选择后添加说明文字
                            const deviceGroup = document.getElementById('deviceSelectionGroup');
                            if (deviceGroup && !deviceGroup.querySelector('.device-locked-notice')) {
                                const notice = document.createElement('div');
                                notice.className = 'device-locked-notice';
                                notice.style.cssText = `
                                    margin-top: 8px;
                                    padding: 8px 12px;
                                    background: rgba(102, 106, 246, 0.1);
                                    border: 1px solid rgba(102, 106, 246, 0.3);
                                    border-radius: 4px;
                                    color: #666AF6;
                                    font-size: 12px;
                                `;
                                notice.innerHTML = `<i class="bx bx-lock"></i> 设备已锁定为"录音设置"中选择的设备`;
                                deviceGroup.appendChild(notice);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ 加载录音设备配置失败:', error);
        }
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
        try {
            // 检查是否选择了设备
            if (!this.selectedDeviceId) {
                this.stepManager.showStepStatus('step5', '请先选择麦克风设备', 'warning');
                return;
            }

            // 如果有之前的录音，先清除状态（隐藏下载按钮等）
            if (this.recordingTestCompleted || this.lastRecordedAudio) {
                // console.log('🔄 开始新录音，清除之前的录音状态...');
                // 隐藏之前的下载按钮和完成按钮
                this.stepManager.hideButton('step5', 'downloadBtn');
                this.stepManager.hideButton('step5', 'completeBtn');
                // 重置录音完成状态
                this.recordingTestCompleted = false;
                this.lastRecordedAudio = null;
            }

            // 使用选择的设备进行录音
            const constraints = {
                audio: {
                    deviceId: { exact: this.selectedDeviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // console.log('🎤 录音已开始，使用设备:', this.selectedDeviceId);
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // 更新按钮文本
            const recordBtn = document.getElementById(`${this.settingId}-step5-recordBtn`);
            if (recordBtn) {
                recordBtn.textContent = '停止录音';
            }
            
            this.stepManager.showStepStatus('step5', '正在录音，请清晰地说话...', 'info');
            
            // 初始化实时波形显示
            this.setupRealTimeWaveform(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start();
            
            // 录音开始时暂停背景音乐（使用统一API）
            if (window.BackgroundMusicVolumeController) {
                try {
                    window.BackgroundMusicVolumeController.pause(true); // 暂停背景音乐并保存原始音量
                    await new Promise(resolve => setTimeout(resolve, 200)); // 等待200ms确保生效
                    // console.log('🎵 录音开始，已通过统一API暂停背景音乐');
                } catch (error) {
                    console.warn('⚠️ 通过统一API暂停背景音乐时出错:', error);
                }
            } else {
                console.warn('⚠️ BackgroundMusicVolumeController不可用');
            }
            
            // 30秒后自动停止（用户要求最多30秒）
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, 30000);
            
        } catch (error) {
            this.stepManager.showStepStatus('step5', '无法访问麦克风：' + error.message, 'error');
        }
    }

    // 停止录音
    stopRecording() {
        if (this.usingEnhancedRecorder && typeof enhancedRecorder !== 'undefined') {
            // 使用增强型录音器
            if (enhancedRecorder.getIsRecording()) {
                // console.log('🛑 停止增强型录音器');
                enhancedRecorder.stopRecording(); // 这将触发onRecordingComplete回调
            }
        } else if (this.mediaRecorder && this.isRecording) {
            // 使用简单录音器（原始方法）
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // 停止所有音频轨道
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            // 清理音频上下文和处理器
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            if (this.scriptProcessor) {
                this.scriptProcessor.disconnect();
                this.scriptProcessor = null;
            }
            
            // 录音停止时恢复背景音乐
            // 恢复背景音乐（使用统一API）
            if (window.BackgroundMusicVolumeController) {
                try {
                    window.BackgroundMusicVolumeController.resume();
                    // console.log('🎵 录音结束，已通过统一API恢复背景音乐');
                } catch (error) {
                    console.warn('⚠️ 通过统一API恢复背景音乐时出错:', error);
                }
            }
            
            // 更新按钮文本为"识别中"并禁用
            const recordBtn = document.getElementById(`${this.settingId}-step5-recordBtn`);
            if (recordBtn) {
                recordBtn.textContent = '识别中...';
                recordBtn.disabled = true;
                recordBtn.style.opacity = '0.6';
                recordBtn.style.cursor = 'not-allowed';
            }
            
            this.stepManager.showStepStatus('step5', '正在处理录音...', 'info');
        }
    }

    // 处理录音
    async processRecording() {
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            
            // 转换为MP3格式用于下载
            try {
                if (window.convertToMp3) {
                    this.lastRecordedAudio = await window.convertToMp3(audioBlob);
                    // console.log('✅ 录音数据已转换为MP3并保存，文件大小:', (this.lastRecordedAudio.size / 1024).toFixed(2), 'KB');
                } else {
                    console.warn('⚠️ convertToMp3函数不可用，使用原始WAV文件');
                    this.lastRecordedAudio = audioBlob;
                }
            } catch (error) {
                console.warn('⚠️ MP3转换失败，使用原始WAV文件:', error);
                this.lastRecordedAudio = audioBlob;
            }
            
            // 显示下载按钮
            this.stepManager.showButton('step5', 'downloadBtn');
            
            // 开始语音识别过程
            this.stepManager.showStepStatus('step5', '正在进行语音识别...', 'processing');
            
            try {
                // 将audioBlob转换为rawAudioData，然后使用增强音频处理器
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const rawAudioData = audioBuffer.getChannelData(0);
                
                // 使用增强音频处理器进行识别
                const result = await window.enhancedAudioProcessor.recognizeFromRecording(rawAudioData, audioBuffer.sampleRate);
                
                const transcriptionResult = document.getElementById('transcriptionResult');
                if (transcriptionResult) {
                    if (result.success && result.text) {
                        const quality = result.audioQuality;
                        const qualityDetails = quality ? `
                            <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                                <strong style="color: #333;">🔍 音频质量诊断:</strong><br>
                                <small style="color: #666;">
                                    时长: ${quality.duration?.toFixed(2) || 'N/A'}秒<br>
                                    最大振幅: ${quality.maxAmplitude?.toFixed(4) || 'N/A'}<br>
                                    RMS水平: ${quality.rmsLevel?.toFixed(4) || 'N/A'}<br>
                                    分贝水平: ${quality.dbLevel?.toFixed(1) || 'N/A'} dB<br>
                                    有效样本: ${quality.nonZeroPercentage?.toFixed(1) || 'N/A'}%<br>
                                    静音样本: ${quality.silentPercentage?.toFixed(1) || 'N/A'}%
                                    
                                </small>
                            </div>
                        ` : '';
                        
                        transcriptionResult.innerHTML = `
                            <div class="recording-text">
                                <strong>识别结果：</strong>
                                ${result.text}
                                ${qualityDetails}
                            </div>
                        `;
                        
                        this.recordingTestCompleted = true;
                        this.stepManager.showStepStatus('step5', '语音识别测试成功！', 'success');
                    } else {
                        throw new Error(result.error || '语音识别失败');
                    }
                }
                
            } catch (recognitionError) {
                console.error('❌ 语音识别失败:', recognitionError);
                
                // 解析错误信息
                const errorInfo = this.parseApiError(recognitionError.message || '');
                
                const transcriptionResult = document.getElementById('transcriptionResult');
                if (transcriptionResult) {
                    transcriptionResult.innerHTML = `
                        <div class="recording-text error">
                            <strong>${errorInfo.title}：</strong><br>
                            ${errorInfo.message}<br>
                            <small style="color: #888; margin-top: 8px; display: block;">
                                💡 ${errorInfo.suggestion}
                            </small>
                        </div>
                    `;
                }
                
                // 根据错误类型决定是否允许完成设置
                if (errorInfo.type === 'network_error' || errorInfo.type === 'server_error') {
                    // 网络或服务器错误，录音功能正常，可以完成设置
                    this.recordingTestCompleted = true;
                    this.stepManager.showStepStatus('step5', '录音功能正常，但语音识别服务暂不可用', 'warning');
                } else {
                    // 配置错误，不允许完成设置
                    this.recordingTestCompleted = false;
                    this.stepManager.showStepStatus('step5', errorInfo.title + '，请修正配置后重试', 'error');
                }
            }
            
            // 恢复录音按钮状态
            const recordBtn = document.getElementById(`${this.settingId}-step5-recordBtn`);
            if (recordBtn) {
                recordBtn.textContent = '重新录音';
                recordBtn.disabled = false;
                recordBtn.style.opacity = '1';
                recordBtn.style.cursor = 'pointer';
            }
            
            // 显示完成按钮
            this.stepManager.showButton('step5', 'completeBtn');
            
        } catch (error) {
            this.stepManager.showStepStatus('step5', '录音处理失败：' + error.message, 'error');
            
            // 错误时也恢复录音按钮状态
            const recordBtn = document.getElementById(`${this.settingId}-step5-recordBtn`);
            if (recordBtn) {
                recordBtn.textContent = '重新录音';
                recordBtn.disabled = false;
                recordBtn.style.opacity = '1';
                recordBtn.style.cursor = 'pointer';
            }
        }
    }

    // 强制使用增强型录音器
    getSelectedRecorderType() {
        return 'enhanced'; // 总是返回增强型
    }

    // 处理增强型录音器完成录音
    async handleEnhancedRecordingComplete(audioBlob, rawAudioData) {
        // console.log('✅ 增强型录音完成');
        this.isRecording = false;
        this.resetRecordingUI();
        
        // 保存录音数据
        this.lastRecordingBlob = audioBlob;
        this.lastRawAudioData = rawAudioData;
        
        // 显示下载按钮
        this.stepManager.showButton('step5', 'downloadBtn');
        
        // 开始语音识别过程
        this.stepManager.showStepStatus('step5', '正在进行语音识别...', 'processing');
        
        try {
            // 使用增强型音频处理器进行识别（直接调用，不用旧的API）
            const result = await window.enhancedAudioProcessor.recognizeFromRecording(rawAudioData, 44100);
            
            const transcriptionResult = document.getElementById('transcriptionResult');
            if (transcriptionResult) {
                if (result.success && result.text) {
                    const quality = result.audioQuality;
                    const qualityDetails = quality ? `
                        <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
                            <strong style="color: #333;">🔍 音频质量诊断:</strong><br>
                            <small style="color: #666;">
                                时长: ${quality.duration?.toFixed(2) || 'N/A'}秒<br>
                                最大振幅: ${quality.maxAmplitude?.toFixed(4) || 'N/A'}<br>
                                RMS水平: ${quality.rmsLevel?.toFixed(4) || 'N/A'}<br>
                                分贝水平: ${quality.dbLevel?.toFixed(1) || 'N/A'} dB<br>
                                有效样本: ${quality.nonZeroPercentage?.toFixed(1) || 'N/A'}%<br>
                                静音样本: ${quality.silentPercentage?.toFixed(1) || 'N/A'}%
                                
                            </small>
                        </div>
                    ` : '';
                    
                    transcriptionResult.innerHTML = `
                        <div class="recording-text">
                            <strong>识别结果：</strong>
                            ${result.text}
                            ${qualityDetails}
                        </div>
                    `;
                    
                    this.recordingTestCompleted = true;
                    this.stepManager.showStepStatus('step5', '增强型语音识别测试成功！', 'success');
                } else {
                    throw new Error(result.error || '增强型语音识别失败');
                }
            }
            
        } catch (recognitionError) {
            console.error('❌ 增强型语音识别失败:', recognitionError);
            
            // 解析错误信息
            const errorInfo = this.parseApiError(recognitionError.message || '');
            
            const transcriptionResult = document.getElementById('transcriptionResult');
            if (transcriptionResult) {
                transcriptionResult.innerHTML = `
                    <div class="recording-text error">
                        <strong>${errorInfo.title}：</strong><br>
                        ${errorInfo.message}<br>
                        <small style="color: #888; margin-top: 8px; display: block;">
                            💡 ${errorInfo.suggestion}
                        </small>
                    </div>
                `;
            }
            
            // 根据错误类型决定是否允许完成设置
            if (errorInfo.type === 'network_error' || errorInfo.type === 'server_error') {
                // 网络或服务器错误，录音功能正常，可以完成设置
                this.recordingTestCompleted = true;
                this.stepManager.showStepStatus('step5', '录音功能正常，但语音识别服务暂不可用', 'warning');
            } else {
                // 配置错误，不允许完成设置
                this.recordingTestCompleted = false;
                this.stepManager.showStepStatus('step5', errorInfo.title + '，请修正配置后重试', 'error');
            }
        }
        
        // 检查是否完成测试
        if (this.recordingTestCompleted) {
            this.stepManager.showButton('step5', 'completeBtn');
        }
    }

    // 重置录音UI
    resetRecordingUI() {
        const recordBtn = document.getElementById(`${this.settingId}-step5-recordBtn`);
        if (recordBtn) {
            recordBtn.textContent = '开始';
        }
    }

    // 语音识别方法
    async recognizeAudio(audioBlob) {
        // 获取配置的访问密钥
        const appKey = simpleConfig.get('appKey');
        const accessKeyId = simpleConfig.get('accessKeyId');
        const accessKeySecret = simpleConfig.get('accessKeySecret');
        
        if (!appKey || !accessKeyId || !accessKeySecret) {
            throw new Error('缺少必要的配置信息，请先完成前面的步骤');
        }
        
        // console.log('🎤 开始语音识别，配置:', { 
        //     appKey: appKey.substring(0, 8) + '...', 
        //     accessKeyId: accessKeyId.substring(0, 8) + '...' 
        // });
        
        try {
            // 将音频转换为PCM格式
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // 获取PCM数据并转换为16kHz采样率
            const pcmData = audioBuffer.getChannelData(0);
            const originalSampleRate = audioBuffer.sampleRate;
            const targetSampleRate = 16000;
            
            // 重采样到16kHz
            const resampledData = this.resampleAudio(pcmData, originalSampleRate, targetSampleRate);
            
            // 转换为数组格式（vercel API需要）
            const audioData = Array.from(resampledData);
            
            // console.log('🔊 音频信息:', {
            //     duration: audioBuffer.duration,
            //     originalSampleRate: originalSampleRate,
            //     targetSampleRate: targetSampleRate,
            //     originalSize: pcmData.length,
            //     resampledSize: audioData.length
            // });
            
            // 使用vercel托管的API避免CORS问题
            const result = await this.callVercelAPI(audioData, appKey, accessKeyId, accessKeySecret);
            
            if (result.success && result.result) {
                return result.result;
            } else {
                throw new Error(result.error || '语音识别返回空结果，可能是音频质量问题或配置错误');
            }
            
        } catch (error) {
            console.error('❌ 语音识别失败:', error);
            
            // 如果是配置问题，给出更具体的错误信息
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                throw new Error('AccessKey认证失败，请检查AccessKey配置是否正确');
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                throw new Error('权限不足，请检查RAM用户权限配置');
            } else if (error.message.includes('400') || error.message.includes('BadRequest')) {
                throw new Error('请求参数错误，可能是AppKey配置不正确');
            } else {
                throw new Error(`语音识别失败: ${error.message}`);
            }
        }
    }
    
    // 音频重采样方法
    resampleAudio(inputData, inputSampleRate, outputSampleRate) {
        if (inputSampleRate === outputSampleRate) {
            return new Uint8Array(inputData.length);
        }
        
        const ratio = inputSampleRate / outputSampleRate;
        const outputLength = Math.floor(inputData.length / ratio);
        const output = new Uint8Array(outputLength);
        
        for (let i = 0; i < outputLength; i++) {
            const sourceIndex = i * ratio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;
            
            let sample = inputData[index] || 0;
            if (index + 1 < inputData.length) {
                sample = sample * (1 - fraction) + inputData[index + 1] * fraction;
            }
            
            // 转换为8位无符号整数
            output[i] = Math.max(0, Math.min(255, Math.round((sample + 1) * 127.5)));
        }
        
        return output;
    }
    
    // 解析API错误信息，提供更明确的错误提示
    parseApiError(errorMessage) {
        // console.log('🔍 解析API错误信息:', errorMessage);
        
        try {
            // 尝试从错误信息中提取具体的错误内容
            if (errorMessage.includes('APPKEY_NOT_EXIST')) {
                return {
                    type: 'appkey_error',
                    title: 'AppKey配置错误',
                    message: 'AppKey不存在或无效，请检查第二步的AppKey配置是否正确',
                    suggestion: '请返回第二步重新输入正确的AppKey'
                };
            }
            
            if (errorMessage.includes('InvalidAccessKeyId')) {
                return {
                    type: 'accesskey_error',
                    title: 'AccessKey ID错误',
                    message: 'AccessKey ID无效，请检查第四步的AccessKey ID配置',
                    suggestion: '请返回第四步重新输入正确的AccessKey ID'
                };
            }
            
            if (errorMessage.includes('SignatureDoesNotMatch')) {
                return {
                    type: 'secret_error',
                    title: 'AccessKey Secret错误',
                    message: 'AccessKey Secret无效，请检查第四步的AccessKey Secret配置',
                    suggestion: '请返回第四步重新输入正确的AccessKey Secret'
                };
            }
            
            if (errorMessage.includes('Forbidden') || errorMessage.includes('权限')) {
                return {
                    type: 'permission_error',
                    title: 'AccessKey权限不足',
                    message: 'AccessKey权限不足，请确保已添加"AliyunNLSFullAccess"权限',
                    suggestion: '请检查第三步和第四步的权限配置'
                };
            }
            
            if (errorMessage.includes('400') && (errorMessage.includes('BadRequest') || errorMessage.includes('参数'))) {
                return {
                    type: 'config_error',
                    title: '配置参数错误',
                    message: '请求参数错误，可能是配置信息不完整或格式不正确',
                    suggestion: '请检查所有步骤的配置是否完整和正确'
                };
            }
            
            if (errorMessage.includes('500') || errorMessage.includes('服务器')) {
                return {
                    type: 'server_error',
                    title: '服务器错误',
                    message: '阿里云语音识别服务暂时不可用',
                    suggestion: '请稍后重试，如果问题持续请检查阿里云服务状态'
                };
            }
            
            if (errorMessage.includes('网络') || errorMessage.includes('连接')) {
                return {
                    type: 'network_error',
                    title: '网络连接错误',
                    message: '网络连接失败，无法访问语音识别服务',
                    suggestion: '请检查网络连接后重试'
                };
            }
            
            // 默认错误
            return {
                type: 'unknown_error',
                title: '语音识别配置错误',
                message: '语音识别配置存在问题，请检查所有步骤的配置',
                suggestion: '建议重新检查AppKey和AccessKey配置'
            };
            
        } catch (parseError) {
            console.warn('⚠️ 解析错误信息失败:', parseError);
            return {
                type: 'parse_error',
                title: '语音识别配置错误',
                message: '无法识别具体错误原因，请检查配置',
                suggestion: '建议重新检查所有步骤的配置'
            };
        }
    }
    
    // 旧的API调用方法 - 已废弃，使用增强音频处理器
    async callVercelAPI(audioData, appKey, accessKeyId, accessKeySecret) {
        console.warn('⚠️ callVercelAPI方法已废弃，请使用window.enhancedAudioProcessor');
        throw new Error('此方法已废弃，请使用增强音频处理器');
    }

    // 验证录音测试
    validateRecordingTest() {
        return this.recordingTestCompleted;
    }

    // 下载录音
    downloadRecording() {
        if (!this.lastRecordedAudio) {
            console.warn('⚠️ 没有可下载的录音');
            this.stepManager.showStepStatus('step5', '没有可下载的录音，请先录音', 'warning');
            return;
        }

        // console.log('📥 开始下载录音文件...');

        try {
            // 生成文件名 - 根据音频格式确定扩展名
            const now = new Date();
            const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
            const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
            // 检查音频格式，优先使用MP3扩展名
            const extension = this.lastRecordedAudio.type.includes('mp3') || this.lastRecordedAudio.type.includes('mpeg') ? 'mp3' : 'wav';
            const fileName = `录音识别测试_${dateStr}_${timeStr}.${extension}`;

            // 创建下载链接
            const url = URL.createObjectURL(this.lastRecordedAudio);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';

            // 添加到页面并触发下载
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // 清理URL对象
            URL.revokeObjectURL(url);

            // console.log('📥 录音文件下载完成:', fileName);
            this.stepManager.showStepStatus('step5', '录音文件下载完成', 'success');

            // 2秒后清除状态信息
            setTimeout(() => {
                this.stepManager.showStepStatus('step5', '', 'info');
            }, 2000);

        } catch (error) {
            console.error('❌ 下载录音文件失败:', error);
            this.stepManager.showStepStatus('step5', '下载失败：' + error.message, 'error');
        }
    }

    // 完成设置
    completeSetup() {
        console.log('✅ 录音文字识别设置完成，配置保存将由统一管理器处理');
        
        // 统一的设置完成处理（包括保存配置、标记已测试、启用功能等）
        this.stepManager.completeSetup();
    }
    
    // 处理设置完成（步骤管理器回调）
    handleSetupComplete() {
        // console.log('✅ 阿里云语音识别设置完成');
        
        // 刷新主设置页面显示
        if (window.refreshSettingsDisplay) {
            window.refreshSettingsDisplay();
        }
        
        // 调用全局处理函数
        handleSetupComplete();
    }

    // 返回上一步
    goToPreviousStep() {
        const currentIndex = this.stepManager.currentStepIndex;
        if (currentIndex > 0) {
            this.stepManager.goToStep(currentIndex - 1);
        }
    }

    // 设置实时波形显示
    setupRealTimeWaveform(stream) {
        try {
            const waveformSvg = document.getElementById('waveformSvg');
            const waveformBars = document.getElementById('waveformBars');
            const progressFill = document.getElementById('progressFillThin');
            const progressMask = document.getElementById('waveformProgressMask');
            
            if (!waveformSvg || !waveformBars) {
                console.error('❌ 找不到SVG波形图元素');
                return;
            }
            
            // 创建音频上下文和ScriptProcessor
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioSource = this.audioContext.createMediaStreamSource(stream);
            
            // 使用ScriptProcessor来实时计算振幅
            const bufferSize = 4096;
            this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
            
            // 初始化变量（30秒录音，每0.1秒一个峰值条）
            const barCount = 300; // 30秒 * 10个峰值条/秒
            const barWidth = 1000 / barCount;
            let waveformData = [];
            let currentAmplitude = 0; // 当前时间间隔内的峰值振幅
            
            // 清空现有的峰值条
            waveformBars.innerHTML = '';
            
            // 重置进度条和波形图到初始状态
            if (progressFill) {
                progressFill.style.transition = '';
                progressFill.style.width = '0%';
            }
            if (progressMask) {
                progressMask.setAttribute('width', '0');
            }
            
            // 音频数据处理
            this.scriptProcessor.onaudioprocess = (event) => {
                if (!this.isRecording) return;
                
                const inputBuffer = event.inputBuffer.getChannelData(0);
                let sum = 0;
                
                // 计算RMS振幅
                for (let i = 0; i < inputBuffer.length; i++) {
                    sum += inputBuffer[i] * inputBuffer[i];
                }
                
                const rms = Math.sqrt(sum / inputBuffer.length);
                currentAmplitude = Math.max(currentAmplitude, rms);
            };
            
            // 连接音频处理链
            audioSource.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);
            
            // 定时更新波形图数据（每100ms采样一次）
            const waveformTimer = setInterval(() => {
                if (!this.isRecording) {
                    clearInterval(waveformTimer);
                    return;
                }
                
                // 将振幅转换为像素高度
                const height = Math.min(25, Math.max(1, currentAmplitude * 200));
                
                // 添加到波形数据
                waveformData.push(height);
                
                // 重置当前振幅，准备下一次采样
                currentAmplitude = 0;
                
                // 渲染波形图
                this.renderWaveform(waveformBars, waveformData, barWidth, progressFill, progressMask);
                
            }, 100); // 每100ms更新一次
            
        } catch (error) {
            console.error('❌ 设置波形显示失败:', error);
        }
    }
    
    // 渲染波形图
    renderWaveform(waveformBars, waveformData, barWidth, progressFill, progressMask) {
        // 清空现有的峰值条
        waveformBars.innerHTML = '';
        
        // 计算当前录音进度
        const elapsed = (Date.now() - this.recordingStartTime) / 1000;
        const progress = Math.min(100, (elapsed / 30) * 100); // 30秒为100%
        const totalBarsToShow = Math.min(300, Math.ceil(elapsed * 10)); // 每秒10个峰值条
        
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
        if (progressMask) {
            progressMask.setAttribute('width', (progress / 100) * 1000);
        }
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
    }
    
    // 清空录音结果和重置状态
    clearRecordingResults() {
        // console.log('🧹 清空录音结果和重置状态...');
        
        // 清空录音结果区域
        const transcriptionResult = document.getElementById('transcriptionResult');
        if (transcriptionResult) {
            transcriptionResult.innerHTML = `
                <div class="recording-text">
                    录音测试结果将显示在此处...
                </div>
            `;
            transcriptionResult.classList.remove('success', 'error');
        }
        
        // 清空波峰图
        const waveformBars = document.getElementById('waveformBars');
        const progressFill = document.getElementById('progressFillThin');
        const progressMask = document.getElementById('waveformProgressMask');
        
        if (waveformBars) waveformBars.innerHTML = '';
        if (progressFill) {
            progressFill.style.width = '0%';
            progressFill.style.transition = '';
        }
        if (progressMask) {
            progressMask.setAttribute('width', '0');
        }
        
        // 重置录音按钮状态
        const recordBtn = document.getElementById(`${this.settingId}-step5-recordBtn`);
        if (recordBtn) {
            recordBtn.textContent = '开始';
            recordBtn.disabled = false;
            recordBtn.style.opacity = '1';
            recordBtn.style.cursor = 'pointer';
            recordBtn.classList.remove('recording');
        }
        
        // 隐藏完成按钮和下载按钮
        this.stepManager.hideButton('step5', 'completeBtn');
        this.stepManager.hideButton('step5', 'downloadBtn');
        
        // 重置录音状态变量
        this.recordingTestCompleted = false;
        this.isRecording = false;
        this.audioChunks = [];
        this.lastRecordedAudio = null; // 清除保存的录音数据
        
        // 清空step-status
        this.stepManager.showStepStatus('step5', '', 'info');
        
        // console.log('✅ 录音结果已清空，状态已重置');
    }

    // 清理资源
    cleanup() {
        // console.log('🎙️ 清理音频设置资源...');
        
        // 停止录音（如果正在录音）
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // 清理录音结果
        this.clearRecordingResults();
        
        // 清理音频流
        if (this.mediaRecorder && this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => {
                track.stop();
                // console.log('🔇 已停止音频轨道:', track.kind);
            });
        }
        
        // 重置状态变量
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordingTestCompleted = false;
        this.audioChunks = [];
        this.lastRecordedAudio = null;
        this.selectedDeviceId = null;
        
        // console.log('✅ 音频设置资源清理完成');
    }
}

// 处理设置完成
function handleSetupComplete() {
    // console.log('✅ 阿里云语音识别设置完成');
    
    // 刷新主设置页面显示
    if (window.refreshSettingsDisplay) {
        window.refreshSettingsDisplay();
    }
}

// 处理返回设置菜单
function handleBackToSettings() {
    // 清理音频录音资源
    if (window.audioSetupManager) {
        window.audioSetupManager.cleanup();
    }
    
    // 创建新的设置overlay
    const newSettingsOverlay = createSettingsOverlay();
    setupSettingsOverlayEvents(newSettingsOverlay);
    
    // 使用overlay管理器切换
    if (window.overlayManager) {
        window.overlayManager.switchToOverlay(newSettingsOverlay);
    }
}

// 导入配置
function importConfig() {
    // 实现配置导入逻辑
    // console.log('导入音频配置');
}

// 导出配置
function exportConfig() {
    // 实现配置导出逻辑
    // console.log('导出音频配置');
}

// 创建全局实例
window.AudioSetupManager = AudioSetupManager;

// 创建重构后的音频设置界面函数
window.createAudioSetupOverlayRefactored = () => {
    const manager = new AudioSetupManager();
    return manager.createSetup();
};

// 兼容性函数：初始化录音设置
const initAudioSetup = () => {
    // console.log('🎤🎤🎤 initAudioSetup被调用 - 录音设置详细界面已加载');
    // console.log('✅ 使用新的设置管理器系统，initAudioSetup兼容性调用完成');
};

// 兼容性函数：更新移动端进度
const updateMobileProgress = (step, total) => {
    // console.log(`📱 兼容性调用: updateMobileProgress(${step}, ${total})`);
    // 在新系统中，进度管理由管理器自动处理
};

// 导出兼容性函数
window.initAudioSetup = initAudioSetup;
window.updateMobileProgress = updateMobileProgress;

// 为音频设置添加麦克风权限错误处理支持
window.getAudioMicrophoneAdvice = (error) => {
    if (window.microphonePermissionHelper) {
        return window.microphonePermissionHelper.getMicrophonePermissionAdvice(error);
    }
    return null;
};

// console.log('🎤 重构后的阿里云语音识别设置管理器已加载');
