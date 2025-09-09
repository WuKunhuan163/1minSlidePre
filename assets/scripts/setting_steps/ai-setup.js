/**
 * 使用新的SettingsStepManager重构的智谱AI设置
 * 演示如何使用统一的步骤管理器创建AI设置流程
 */

// 智谱AI设置管理器
class AISetupManager {
    constructor() {
        this.settingId = 'ai';
        this.stepManager = null;
        this.config = {
            showImportExport: true
        };
        
        // AI测试相关变量
        this.apiTestCompleted = false;
        this.chatHistory = [];
        
        // 初始化步骤配置
        this.initializeSteps();
    }

    // 初始化步骤配置
    initializeSteps() {
        this.steps = [
            {
                id: 'step1',
                title: '注册智谱AI账号',
                content: {
                    description: `
                        注册智谱AI账号并获取API访问权限。
                        <br><br>
                        <strong>操作步骤：</strong><br>
                        1. 前往<a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank">智谱AI控制台</a><br>
                        2. 如果没有账号，点击注册新账号<br>
                        3. 完成账号注册和实名认证
                    `,
                    image: 'assets/images/settings/step_6_zhipu_api.png'
                },
                buttons: [
                    {
                        id: 'completeBtn',
                        text: '完成账号注册',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.completeStep1(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.validateStep1(),
                onEnter: () => console.log('进入步骤1: 注册账号'),
                validation: () => this.validateStep1()
            },
            {
                id: 'step2',
                title: '获取API Key',
                content: {
                    description: `
                        创建并获取智谱AI的API Key。
                        <br><br>
                        <strong>操作步骤：</strong><br>
                        1. 登录<a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank">智谱AI控制台</a><br>
                        2. 点击"添加新的API Key"按钮<br>
                        3. 选择一个名称（如"语音识别评分"）<br>
                        4. 在下方列表中复制生成的API Key<br>
                        5. 将API Key粘贴到下方输入框中
                    `,
                    form: [
                        {
                            type: 'password',
                            id: 'aiApiKey',
                            label: '智谱AI API Key',
                            placeholder: '从智谱AI控制台获取的API Key',
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
                        text: '验证 API Key',
                        type: 'primary',
                        isPrimary: true,
                        onClick: () => this.validateStep2(),
                        show: true
                    }
                ],
                autoJumpCondition: () => this.validateStep2(),
                onEnter: () => this.loadSavedApiKey(),
                validation: () => this.validateApiKey()
            },
            {
                id: 'step3',
                title: '测试AI对话功能',
                content: {
                    description: `
                        测试智谱AI的对话功能，确保API正常工作。
                    `,
                    custom: () => this.generateChatTestInterface()
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
                        text: '完成设置',
                        type: 'success',
                        onClick: () => this.completeSetup(),
                        show: false
                    }
                ],
                autoJumpCondition: () => this.validateApiTest(),
                onEnter: () => this.initializeChatTest(),
                validation: () => this.validateApiTest()
            }
        ];
    }

    // 创建设置界面
    createSetup() {
        // 创建步骤管理器实例
        this.stepManager = new SettingsStepManager({
            settingId: this.settingId,
            title: '智谱AI评分设置',
            steps: this.steps,
            config: this.config,
            onComplete: () => this.handleSetupComplete(),
            onBack: () => this.handleBackToSettings()
        });

        // 创建overlay
        const overlay = this.stepManager.createOverlay();
        
        // 全局引用，供onclick事件使用
        window.aiManager = this;
        
        return overlay;
    }

    // 步骤1验证
    async validateStep1() {
        // 简单的确认，实际项目中可以检查账号状态
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 500);
        });
    }

    // 完成步骤1
    completeStep1() {
        this.stepManager.showStepStatus('step1', '正在验证账号状态...', 'info');
        
        setTimeout(() => {
            this.stepManager.markStepCompleted('step1', true);
            this.stepManager.goToStep(1); // 跳转到步骤2
        }, 1000);
    }

    // 加载保存的API Key
    loadSavedApiKey() {
        const config = simpleConfig.getAll();
        if (config.zhipuApiKey) {
            this.stepManager.setStepFormData('step2', {
                aiApiKey: config.zhipuApiKey
            });
        }
    }

    // 验证API Key格式
    async validateApiKey() {
        const formData = this.stepManager.getStepFormData('step2');
        const apiKey = formData.aiApiKey?.trim();
        
        if (!apiKey) {
            throw new Error('请输入API Key');
        }
        
        if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
            throw new Error('API Key格式不正确');
        }
        
        return true;
    }

    // 验证步骤2
    async validateStep2() {
        try {
            this.stepManager.showStepStatus('step2', '正在验证API Key...', 'info');
            
            const isValid = await this.validateApiKey();
            if (isValid) {
                // 测试API连接
                const formData = this.stepManager.getStepFormData('step2');
                const apiKey = formData.aiApiKey.trim();
                
                const testResult = await this.testApiConnection(apiKey);
                if (testResult.success) {
                    // 保存API Key
                    simpleConfig.set('zhipuApiKey', apiKey);
                    
                    this.stepManager.showStepStatus('step2', 'API Key验证成功！', 'success');
                    
                    setTimeout(() => {
                        this.stepManager.markStepCompleted('step2', true);
                        this.stepManager.goToStep(2); // 跳转到步骤3
                    }, 1000);
                    
                    return true;
                } else {
                    throw new Error(testResult.error || 'API连接测试失败');
                }
            }
        } catch (error) {
            this.stepManager.showStepStatus('step2', error.message, 'error');
            return false;
        }
    }

    // 测试API连接
    async testApiConnection(apiKey) {
        try {
            // 这里应该调用实际的智谱AI API进行测试
            // 现在用模拟的方式
            return new Promise((resolve) => {
                setTimeout(() => {
                    // 模拟API测试结果
                    if (apiKey.length > 30) {
                        resolve({ success: true });
                    } else {
                        resolve({ success: false, error: 'API Key无效' });
                    }
                }, 2000);
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 生成聊天测试界面
    generateChatTestInterface() {
        return `
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
                    <input type="text" id="chatInput" placeholder="输入你的问题测试AI功能..." maxlength="200" onkeypress="if(event.key==='Enter') aiManager.sendTestMessage()">
                    <button id="sendChatBtn" onclick="aiManager.sendTestMessage()">发送</button>
                </div>
            </div>
        `;
    }

    // 初始化聊天测试
    initializeChatTest() {
        this.apiTestCompleted = false;
        this.chatHistory = [
            {
                role: 'assistant',
                content: '您好！我是智谱AI助手，可以为您的演讲进行评分和建议。请输入任何问题来测试我的功能。'
            }
        ];
    }

    // 发送测试消息
    async sendTestMessage() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        const messagesContainer = document.getElementById('chatbotMessages');
        
        if (!chatInput || !messagesContainer) return;
        
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        
        // 禁用输入
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatInput.value = '';
        
        // 添加用户消息
        this.addMessageToChat(userMessage, 'user');
        
        try {
            // 显示正在思考状态
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'message ai-message';
            thinkingDiv.innerHTML = '<div class="message-content">正在思考...</div>';
            thinkingDiv.id = 'thinking-message';
            messagesContainer.appendChild(thinkingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // 调用AI API
            const aiResponse = await this.callAIAPI(userMessage);
            
            // 移除思考状态
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }
            
            // 添加AI回复
            this.addMessageToChat(aiResponse, 'ai');
            
            // 标记测试完成
            if (!this.apiTestCompleted) {
                this.apiTestCompleted = true;
                this.stepManager.showStepStatus('step3', 'AI对话测试成功！', 'success');
                
                // 显示完成按钮
                this.stepManager.showButton('step3', 'completeBtn');
            }
            
        } catch (error) {
            // 移除思考状态
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }
            
            this.addMessageToChat('抱歉，我遇到了一些问题：' + error.message, 'ai');
            this.stepManager.showStepStatus('step3', 'AI测试失败：' + error.message, 'error');
        }
        
        // 重新启用输入
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }

    // 添加消息到聊天界面
    addMessageToChat(content, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 保存到历史记录
        this.chatHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: content
        });
    }

    // 调用AI API
    async callAIAPI(message) {
        try {
            // 这里应该调用实际的智谱AI API
            // 现在用模拟的方式
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const responses = [
                        '我理解您的问题。作为AI助手，我可以帮助您分析演讲内容，提供改进建议，并给出客观的评分。',
                        '很好的问题！我可以从语言表达、逻辑结构、内容深度等多个维度来评估您的演讲。',
                        '感谢您的测试。我已经准备好为您的演讲提供专业的分析和建议了。',
                        '测试成功！我可以识别演讲中的亮点和需要改进的地方，帮助您提升演讲效果。'
                    ];
                    
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    resolve(randomResponse);
                }, 1500);
            });
        } catch (error) {
            throw new Error('API调用失败：' + error.message);
        }
    }

    // 验证API测试
    validateApiTest() {
        return this.apiTestCompleted;
    }

    // 完成设置
    completeSetup() {
        // 启用AI功能
        simpleConfig.set('aiEnabled', true);
        
        // 标记设置为已配置
        simpleConfig.markSettingConfigured('ai');
        
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
        console.log('✅ 智谱AI设置完成');
        
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
        // 实现配置导入逻辑
        console.log('导入AI配置');
    }

    // 导出配置
    exportConfig() {
        // 实现配置导出逻辑
        console.log('导出AI配置');
    }
}

// 创建全局实例
window.AISetupManager = AISetupManager;

// 创建重构后的AI设置界面函数
window.createAISetupOverlayRefactored = () => {
    const manager = new AISetupManager();
    return manager.createSetup();
};

// AI相关的兼容性函数
const completeAIStep1 = () => {
    console.log('🤖 兼容性调用: completeAIStep1');
    if (window.aiManager) {
        window.aiManager.completeStep1();
    }
};

const validateAIStep2 = () => {
    console.log('🤖 兼容性调用: validateAIStep2');
    if (window.aiManager) {
        return window.aiManager.validateStep2();
    }
};

const completeAIStep3 = () => {
    console.log('🤖 兼容性调用: completeAIStep3');
    if (window.aiManager) {
        window.aiManager.completeSetup();
    }
};

const goBackToAIStep = (step) => {
    console.log(`🤖 兼容性调用: goBackToAIStep(${step})`);
    if (window.aiManager) {
        window.aiManager.stepManager.goToStep(step - 1);
    }
};

const sendTestMessage = () => {
    console.log('🤖 兼容性调用: sendTestMessage');
    if (window.aiManager) {
        window.aiManager.sendTestMessage();
    }
};

// 导出AI兼容性函数
window.completeAIStep1 = completeAIStep1;
window.validateAIStep2 = validateAIStep2;
window.completeAIStep3 = completeAIStep3;
window.goBackToAIStep = goBackToAIStep;
window.sendTestMessage = sendTestMessage;

console.log('🤖 重构后的智谱AI设置管理器已加载');
