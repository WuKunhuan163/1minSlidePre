/**
 * 设置步骤管理器 - 统一管理所有设置用例的步骤流程
 * 基于阿里云语音识别设置的步骤风格，提供通用的步骤管理功能
 */

class SettingsStepManager {
    constructor(options) {
        this.settingId = options.settingId; // 设置用例的唯一标识
        this.title = options.title; // 设置用例的标题
        this.steps = options.steps || []; // 步骤配置数组
        this.currentStepIndex = 0; // 当前步骤索引
        this.overlay = null; // overlay元素引用
        this.onComplete = options.onComplete || (() => {}); // 完成回调
        this.onBack = options.onBack || (() => {}); // 返回回调
        this.config = options.config || {}; // 额外配置
        
        // 步骤完成状态存储
        this.completionKey = `${this.settingId}_completion_status`;
        this.loadCompletionStatus();
    }

    /**
     * 步骤配置结构说明:
     * {
     *   id: 'step1',                    // 步骤唯一标识
     *   title: '步骤标题',               // 步骤标题
     *   content: {                      // 内嵌内容部分
     *     description: '步骤说明',       // 描述文本
     *     image: 'path/to/image.png',   // 可选：示意图
     *     form: [                       // 可选：表单字段
     *       {
     *         type: 'text|password|select',
     *         id: 'fieldId',
     *         label: '字段标签',
     *         placeholder: '占位符',
     *         required: true,
     *         options: [] // select类型时的选项
     *       }
     *     ],
     *     custom: () => {}              // 可选：自定义内容生成函数
     *   },
     *   buttons: [                      // 交互按钮配置
     *     {
     *       id: 'prevBtn',
     *       text: '上一步',
     *       type: 'back',              // back|primary|success|custom
     *       onClick: () => {},
     *       show: true
     *     },
     *     {
     *       id: 'nextBtn', 
     *       text: '下一步',
     *       type: 'primary',
     *       isPrimary: true,           // 标记为核心按钮
     *       onClick: () => {},
     *       show: true
     *     }
     *   ],
     *   autoJumpCondition: () => {},    // 自动跳转条件函数
     *   onEnter: () => {},              // 进入步骤时的回调
     *   onExit: () => {},               // 离开步骤时的回调
     *   validation: () => {}            // 步骤验证函数
     * }
     */

    // 加载步骤完成状态
    loadCompletionStatus() {
        const saved = localStorage.getItem(this.completionKey);
        this.completionStatus = saved ? JSON.parse(saved) : {};
    }

    // 保存步骤完成状态
    saveCompletionStatus() {
        localStorage.setItem(this.completionKey, JSON.stringify(this.completionStatus));
    }

    // 标记步骤为已完成
    markStepCompleted(stepId, success = true) {
        this.completionStatus[stepId] = {
            completed: true,
            success: success,
            timestamp: Date.now()
        };
        this.saveCompletionStatus();
        this.updateStepVisuals();
    }

    // 检查步骤是否已完成
    isStepCompleted(stepId) {
        return this.completionStatus[stepId]?.completed || false;
    }

    // 检查步骤是否成功
    isStepSuccessful(stepId) {
        return this.completionStatus[stepId]?.success || false;
    }

    // 清除步骤完成状态
    clearStepCompletion(stepId) {
        if (this.completionStatus[stepId]) {
            delete this.completionStatus[stepId];
            this.saveCompletionStatus();
            this.updateStepVisuals();
            console.log(`✅ 已清除步骤 ${stepId} 的完成状态`);
        }
    }

    // 创建设置overlay
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'slides-overlay';
        
        // 生成步骤HTML
        const stepsHtml = this.steps.map((step, index) => this.generateStepHtml(step, index)).join('');
        
        overlay.innerHTML = `
            <div class="slides-header">
                <button class="back-button">
                    <i class='bx bx-arrow-back'></i>
                </button>
                <h2>${this.title}</h2>
                ${this.config.showImportExport ? `
                <div class="config-actions">
                    <button class="rect-button btn btn-import" onclick="${this.settingId}Manager.importConfig()">导入设置</button>
                    <button class="rect-button btn btn-export" onclick="${this.settingId}Manager.exportConfig()">导出设置</button>
                </div>
                ` : ''}
            </div>
            
            <div class="setup-container">
                <div class="setup-flow">
                    ${stepsHtml}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化步骤状态
        this.initializeSteps();
        
        return overlay;
    }

    // 生成单个步骤的HTML
    generateStepHtml(step, index) {
        const stepNumber = index + 1;
        const totalSteps = this.steps.length;
        const isCurrentStep = index === this.currentStepIndex;
        const isCompleted = this.isStepCompleted(step.id);
        const isLastStep = index === this.steps.length - 1;
        
        // 步骤状态类
        const stepClasses = [
            'setup-step',
            isCurrentStep ? 'visible current-step' : 'pending',
            isCompleted ? 'completed' : ''
        ].filter(Boolean).join(' ');

        // 圆圈状态
        const circleClass = isCompleted ? 'completed' : (isCurrentStep ? 'current' : 'pending');
        
        // 生成内容HTML
        const contentHtml = this.generateStepContentHtml(step);
        
        // 生成按钮HTML
        const buttonsHtml = this.generateStepButtonsHtml(step, index);

        return `
            <div class="${stepClasses}" id="${this.settingId}-${step.id}">
                <div class="step-circle ${circleClass}" id="${this.settingId}-${step.id}-circle">
                    ${isCompleted ? '<i class="bx bx-check"></i>' : stepNumber}
                </div>
                ${!isLastStep ? `<div class="step-line" id="${this.settingId}-${step.id}-line"></div>` : ''}
                <div class="step-content" id="${this.settingId}-${step.id}-content">
                    <div class="mobile-step-indicator">第${stepNumber}/${totalSteps}步</div>
                    <div class="step-title">${step.title}</div>
                    ${contentHtml}
                    ${buttonsHtml}
                    <div id="${this.settingId}-${step.id}-status" class="step-status"></div>
                </div>
            </div>
        `;
    }

    // 生成步骤内容HTML
    generateStepContentHtml(step) {
        let html = '';
        
        // 描述文本
        if (step.content.description) {
            html += `<div class="step-description">${step.content.description}</div>`;
        }
        
        // 示意图
        if (step.content.image) {
            html += `
                <div class="step-image">
                    <img src="${step.content.image}" alt="${step.title}示意图" 
                         style="width: 100%; max-width: 600px; height: auto; margin: 15px 0; border-radius: 8px;">
                </div>
            `;
        }
        
        // 表单字段
        if (step.content.form && step.content.form.length > 0) {
            step.content.form.forEach(field => {
                html += this.generateFormFieldHtml(field);
            });
        }
        
        // 自定义内容
        if (step.content.custom && typeof step.content.custom === 'function') {
            html += step.content.custom();
        }
        
        return html;
    }

    // 生成表单字段HTML
    generateFormFieldHtml(field) {
        const requiredMark = field.required ? '<span class="required">*</span>' : '';
        let inputHtml = '';
        
        switch (field.type) {
            case 'text':
            case 'password':
                inputHtml = `
                    <input type="${field.type}" 
                           id="${field.id}" 
                           placeholder="${field.placeholder || ''}"
                           ${field.required ? 'required' : ''}>
                `;
                break;
            case 'select':
                const options = field.options.map(opt => 
                    `<option value="${opt.value}">${opt.text}</option>`
                ).join('');
                inputHtml = `
                    <select id="${field.id}" ${field.required ? 'required' : ''}>
                        ${options}
                    </select>
                `;
                break;
        }
        
        return `
            <div class="form-group">
                <div class="label-row">
                    <label for="${field.id}">${field.label} ${requiredMark}</label>
                    <div class="secret-display" id="${field.id}Display"></div>
                </div>
                ${inputHtml}
            </div>
        `;
    }

    // 生成步骤按钮HTML
    generateStepButtonsHtml(step, stepIndex) {
        if (!step.buttons || step.buttons.length === 0) {
            return '';
        }
        
        // 分离完成设置按钮和其他按钮
        const regularButtons = [];
        const completeButtons = [];
        
        step.buttons.forEach(button => {
            if (!button.show) return;
            
            const buttonClass = this.getButtonClass(button.type);
            const buttonId = `${this.settingId}-${step.id}-${button.id}`;
            
            const buttonHtml = `
                <button class="btn ${buttonClass} normal-button" 
                        id="${buttonId}"
                        data-step-id="${step.id}" 
                        data-button-id="${button.id}">
                    ${button.text}
                </button>
            `;
            
            // 判断是否为完成设置按钮
            if (button.type === 'success' || button.id === 'completeBtn') {
                completeButtons.push(buttonHtml);
            } else {
                regularButtons.push(buttonHtml);
            }
        });

        // 生成HTML结构
        let html = '';
        
        // 常规按钮容器
        if (regularButtons.length > 0) {
            html += `
            <div class="step-buttons-container" id="${this.settingId}-${step.id}-buttons">
                ${regularButtons.join('\n                ')}
            </div>
            `;
        }
        
        // 完成设置按钮容器（独立）
        if (completeButtons.length > 0) {
            html += `
            <div class="step-complete-container" id="${this.settingId}-${step.id}-complete">
                ${completeButtons.join('\n                ')}
            </div>
            `;
        }

        return html;
    }

    // 获取按钮样式类
    getButtonClass(type) {
        switch (type) {
            case 'back': return 'btn-back';
            case 'primary': return 'btn-primary';
            case 'success': return 'btn-success';
            default: return 'btn-primary';
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 返回按钮
        const backButton = this.overlay.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => this.handleBackToSettings());
        }
        
        // 为所有步骤按钮添加事件监听器
        const buttons = this.overlay.querySelectorAll('button[data-step-id][data-button-id]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const stepId = e.target.getAttribute('data-step-id');
                const buttonId = e.target.getAttribute('data-button-id');
                this.handleButtonClick(stepId, buttonId);
            });
        });
    }

    // 初始化步骤状态
    initializeSteps() {
        // 找到应该显示的步骤（第一个未完成的步骤或第一个步骤）
        let targetStepIndex = 0;
        for (let i = 0; i < this.steps.length; i++) {
            if (!this.isStepCompleted(this.steps[i].id)) {
                targetStepIndex = i;
                break;
            }
            if (i === this.steps.length - 1) {
                // 所有步骤都完成了，显示最后一步
                targetStepIndex = i;
            }
        }
        
        this.goToStep(targetStepIndex);
        this.updateStepVisuals();
    }

    // 跳转到下一步 - 函数A（切换函数）
    goToNextStep() {
        const nextIndex = this.currentStepIndex + 1;
        if (nextIndex < this.steps.length) {
            this.goToStep(nextIndex);
        } else {
            // 最后一步完成
            this.handleSetupComplete();
        }
    }
    
    // 跳转到上一步
    goToPreviousStep() {
        const prevIndex = this.currentStepIndex - 1;
        if (prevIndex >= 0) {
            this.goToStep(prevIndex);
        }
    }

    // 跳转到指定步骤
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return;
        }
        
        const previousStepIndex = this.currentStepIndex;
        
        // 如果是回到之前的步骤，清除目标步骤的完成状态
        if (stepIndex < previousStepIndex) {
            const targetStepId = this.steps[stepIndex].id;
            console.log(`🔄 回到上一步 (${targetStepId})，清除完成状态`);
            this.clearStepCompletion(targetStepId);
        }
        
        // 隐藏当前步骤
        const currentStep = this.overlay.querySelector(`#${this.settingId}-${this.steps[this.currentStepIndex].id}`);
        if (currentStep) {
            currentStep.classList.remove('visible', 'current-step');
            currentStep.classList.add('pending');
        }
        
        // 显示目标步骤
        this.currentStepIndex = stepIndex;
        const targetStep = this.overlay.querySelector(`#${this.settingId}-${this.steps[stepIndex].id}`);
        if (targetStep) {
            targetStep.classList.remove('pending');
            targetStep.classList.add('visible', 'current-step');
            
            // 自动滚动到当前步骤
            this.scrollToStep(targetStep);
        }
        
        // 调用步骤进入回调
        const step = this.steps[stepIndex];
        if (step.onEnter && typeof step.onEnter === 'function') {
            step.onEnter();
        }
        
        this.updateStepVisuals();
    }
    
    // 滚动到指定步骤
    scrollToStep(targetStep) {
        setTimeout(() => {
            const container = targetStep.closest('.setup-container');
            const stepCircle = targetStep.querySelector('.step-circle');
            
            if (container && stepCircle) {
                // 计算滚动位置 - 让数字圆刚好到标题下沿（减少padding到5px）
                const circleOffsetTop = stepCircle.offsetTop + targetStep.offsetTop;
                const scrollTop = circleOffsetTop - 5; // 减少到5px，让数字圆更接近顶部
                
                container.scrollTo({
                    top: Math.max(0, scrollTop),
                    behavior: 'smooth'
                });
                
                console.log(`📜 自动滚动到步骤，数字圆位置: ${circleOffsetTop}，滚动位置: ${scrollTop}`);
            } else {
                console.error(`❌ 滚动失败: container=${!!container}, stepCircle=${!!stepCircle}`);
            }
        }, 100);
    }

    // 更新步骤视觉状态
    updateStepVisuals() {
        this.steps.forEach((step, index) => {
            const stepElement = this.overlay.querySelector(`#${this.settingId}-${step.id}`);
            const circleElement = this.overlay.querySelector(`#${this.settingId}-${step.id}-circle`);
            const contentElement = this.overlay.querySelector(`#${this.settingId}-${step.id}-content`);
            
            if (!stepElement || !circleElement) return;
            
            const isCompleted = this.isStepCompleted(step.id);
            const isCurrent = index === this.currentStepIndex;
            
            // 更新步骤状态类
            stepElement.classList.toggle('completed', isCompleted);
            stepElement.classList.toggle('current-step', isCurrent);
            stepElement.classList.toggle('visible', isCurrent);
            stepElement.classList.toggle('pending', !isCurrent);
            
            // 为了兼容旧的CSS，也添加active类到content
            if (contentElement) {
                contentElement.classList.toggle('active', isCurrent);
            }
            
            // 更新圆圈状态
            circleElement.className = `step-circle ${isCompleted ? 'completed' : (isCurrent ? 'current' : 'pending')}`;
            circleElement.innerHTML = isCompleted ? '<i class="bx bx-check"></i>' : (index + 1);
        });
    }

    // 处理按钮点击
    handleButtonClick(stepId, buttonId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const button = step.buttons.find(b => b.id === buttonId);
        if (!button) return;
        
        // 执行按钮的点击处理函数
        if (button.onClick && typeof button.onClick === 'function') {
            button.onClick();
        }
        
        // 如果是核心按钮，检查自动跳转条件
        if (button.isPrimary && step.autoJumpCondition) {
            this.checkAutoJump(stepId);
        }
    }

    // 检查自动跳转条件 - 函数B（验证函数）
    async checkAutoJump(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.autoJumpCondition) return;
        
        try {
            const canJump = await step.autoJumpCondition();
            if (canJump) {
                // 标记当前步骤为完成
                this.markStepCompleted(stepId, true);
                
                // 调用函数A（切换函数）实现跳转
                this.goToNextStep();
            }
        } catch (error) {
            console.error('自动跳转检查失败:', error);
            this.showStepStatus(stepId, error.message, 'error');
        }
    }

    // 显示步骤状态信息
    showStepStatus(stepId, message, type = 'info') {
        const statusElement = this.overlay.querySelector(`#${this.settingId}-${stepId}-status`);
        if (!statusElement) return;
        
        statusElement.className = `step-status ${type}`;
        statusElement.textContent = message;
        
        // 3秒后自动清除状态
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'step-status';
        }, 3000);
    }

    // 处理设置完成
    handleSetupComplete() {
        // 显示完成按钮
        const lastStep = this.steps[this.steps.length - 1];
        this.showButton(lastStep.id, 'completeBtn');
        
        // 隐藏核心按钮
        const primaryButton = lastStep.buttons.find(b => b.isPrimary);
        if (primaryButton) {
            this.hideButton(lastStep.id, primaryButton.id);
        }
        
        this.showStepStatus(lastStep.id, '设置完成！', 'success');
    }
    
    // 显示按钮并确保可交互
    showButton(stepId, buttonId) {
        const buttonSelector = `#${this.settingId}-${stepId}-${buttonId}`;
        console.log('🔍 查找按钮元素:', buttonSelector);
        
        let buttonElement = this.overlay.querySelector(buttonSelector);
        console.log('🔘 找到按钮元素:', !!buttonElement);
        
        if (buttonElement) {
            console.log('📝 设置按钮显示和交互状态');
            buttonElement.style.display = 'inline-block';
            buttonElement.classList.add('force-interact');
            console.log('✅ 按钮已显示:', buttonElement.style.display);
        } else {
            // 按钮不存在，尝试动态创建
            console.log('🔨 按钮不存在，尝试动态创建...');
            
            const step = this.steps.find(s => s.id === stepId);
            if (!step) {
                console.error('❌ 未找到步骤:', stepId);
                return;
            }
            
            const button = step.buttons.find(b => b.id === buttonId);
            if (!button) {
                console.error('❌ 未找到按钮配置:', buttonId);
                return;
            }
            
            // 找到按钮容器（根据按钮类型选择容器）
            let buttonsContainer;
            if (button.type === 'success' || button.id === 'completeBtn') {
                buttonsContainer = this.overlay.querySelector(`#${this.settingId}-${stepId}-complete`);
                if (!buttonsContainer) {
                    // 如果完成设置容器不存在，创建一个
                    const stepContent = this.overlay.querySelector(`#${this.settingId}-${stepId}-content`);
                    if (stepContent) {
                        const completeContainer = document.createElement('div');
                        completeContainer.className = 'step-complete-container';
                        completeContainer.id = `${this.settingId}-${stepId}-complete`;
                        stepContent.appendChild(completeContainer);
                        buttonsContainer = completeContainer;
                        console.log('✅ 动态创建完成设置按钮容器');
                    }
                }
            } else {
                buttonsContainer = this.overlay.querySelector(`#${this.settingId}-${stepId}-buttons`);
                if (!buttonsContainer) {
                    // 如果常规按钮容器不存在，创建一个
                    const stepContent = this.overlay.querySelector(`#${this.settingId}-${stepId}-content`);
                    if (stepContent) {
                        const regularContainer = document.createElement('div');
                        regularContainer.className = 'step-buttons-container';
                        regularContainer.id = `${this.settingId}-${stepId}-buttons`;
                        stepContent.appendChild(regularContainer);
                        buttonsContainer = regularContainer;
                        console.log('✅ 动态创建常规按钮容器');
                    }
                }
            }
            
            if (!buttonsContainer) {
                console.error('❌ 未找到按钮容器');
                return;
            }
            
            // 创建按钮元素
            const buttonClass = this.getButtonClass(button.type);
            const buttonId_full = `${this.settingId}-${stepId}-${buttonId}`;
            
            const newButtonHtml = `
                <button class="btn ${buttonClass} normal-button" 
                        id="${buttonId_full}"
                        data-step-id="${stepId}" 
                        data-button-id="${buttonId}">
                    ${button.text}
                </button>
            `;
            
            buttonsContainer.insertAdjacentHTML('beforeend', newButtonHtml);
            console.log('✅ 动态创建按钮成功');
            
            // 重新获取按钮元素并设置事件监听器
            buttonElement = this.overlay.querySelector(buttonSelector);
            if (buttonElement) {
                buttonElement.addEventListener('click', (e) => {
                    const stepId = e.target.getAttribute('data-step-id');
                    const buttonId = e.target.getAttribute('data-button-id');
                    this.handleButtonClick(stepId, buttonId);
                });
                
                buttonElement.classList.add('force-interact');
                console.log('✅ 按钮事件监听器已添加');
            }
        }
    }
    
    // 隐藏按钮
    hideButton(stepId, buttonId) {
        const buttonElement = this.overlay.querySelector(`#${this.settingId}-${stepId}-${buttonId}`);
        if (buttonElement) {
            buttonElement.style.display = 'none';
            buttonElement.classList.remove('force-interact');
        }
    }
    
    // 禁用按钮但保持可见
    disableButton(stepId, buttonId) {
        const buttonElement = this.overlay.querySelector(`#${this.settingId}-${stepId}-${buttonId}`);
        if (buttonElement) {
            buttonElement.classList.add('force-no-interact');
        }
    }
    
    // 启用按钮
    enableButton(stepId, buttonId) {
        const buttonElement = this.overlay.querySelector(`#${this.settingId}-${stepId}-${buttonId}`);
        if (buttonElement) {
            buttonElement.classList.remove('force-no-interact');
            buttonElement.classList.add('force-interact');
        }
    }

    // 返回设置菜单
    handleBackToSettings() {
        if (this.overlay) {
            this.overlay.remove();
        }
        
        if (this.onBack && typeof this.onBack === 'function') {
            this.onBack();
        }
    }

    // 完成整个设置流程
    completeSetup() {
        // 标记最后一步为完成
        const lastStep = this.steps[this.steps.length - 1];
        this.markStepCompleted(lastStep.id, true);
        
        // 调用完成回调
        if (this.onComplete && typeof this.onComplete === 'function') {
            this.onComplete();
        }
        
        // 返回设置菜单
        this.handleBackToSettings();
    }

    // 验证步骤
    async validateStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.validation) return true;
        
        try {
            return await step.validation();
        } catch (error) {
            this.showStepStatus(stepId, error.message, 'error');
            return false;
        }
    }

    // 获取步骤表单数据
    getStepFormData(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.content.form) return {};
        
        const formData = {};
        step.content.form.forEach(field => {
            const element = this.overlay.querySelector(`#${field.id}`);
            if (element) {
                formData[field.id] = element.value;
            }
        });
        
        return formData;
    }

    // 设置步骤表单数据
    setStepFormData(stepId, data) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.content.form) return;
        
        step.content.form.forEach(field => {
            const element = this.overlay.querySelector(`#${field.id}`);
            if (element && data[field.id] !== undefined) {
                element.value = data[field.id];
            }
        });
    }

    // 销毁管理器
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// 导出给全局使用
window.SettingsStepManager = SettingsStepManager;

console.log('📋 设置步骤管理器已加载');
