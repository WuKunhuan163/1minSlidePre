/**
 * 设置步骤管理器 - 统一管理所有设置用例的步骤流程
 * 基于阿里云语音识别设置的步骤风格，提供通用的步骤管理功能
 * 
 * ## 架构设计原则
 * 
 * ### 1. 职责分离
 * - **SettingsStepManager**: 负责步骤流程管理、自动化逻辑、UI状态管理
 * - **具体设置类**: 负责业务逻辑、权限验证、配置保存
 * - **验证函数**: 仅负责验证当前状态是否满足条件，不包含UI逻辑
 * 
 * ### 2. 自动化流程
 * Manager会在初始化时自动执行以下逻辑：
 * 1. 检查每个步骤的完成状态 (`isStepCompleted`)
 * 2. 对于有验证函数的步骤，调用验证函数进行实际验证
 * 3. 验证通过则自动跳转到下一步，失败则停留等待用户操作
 * 4. 对于无验证函数的步骤，仅基于完成状态决定是否跳过
 * 
 * ### 3. 步骤完成标记
 * - 使用 `markStepCompleted(stepId, success)` 标记步骤完成
 * - 完成标记会持久化到localStorage
 * - 回退到上一步时会自动清除该步骤及后续步骤的完成标记
 * 
 * ### 4. 验证函数设计指南
 * 验证函数应该：
 * - 尝试获取/验证所需权限或状态
 * - 返回 `true`（验证成功）或 `false`（验证失败）
 * - 不包含UI逻辑（状态显示由Manager处理）
 * - 可以是异步函数
 * 
 * 示例：
 * ```javascript
 * async validatePermissionGranted() {
 *     try {
 *         const stream = await navigator.mediaDevices.getUserMedia({video: true});
 *         stream.getTracks().forEach(track => track.stop());
 *         return true;
 *     } catch (error) {
 *         return false;
 *     }
 * }
 * ```
 * 
 * ### 5. 开发新设置的步骤
 * 1. 创建设置类，继承或参考现有设置的结构
 * 2. 定义steps数组，包含所有步骤配置
 * 3. 对于需要验证的步骤，添加validation函数
 * 4. 在关键操作完成后调用 `markStepCompleted(stepId, true)`
 * 5. 验证函数只负责验证，不处理UI状态
 * 6. Manager会自动处理步骤跳转和状态管理
 */

class SettingsStepManager {
    constructor(options) {
        this.settingId = options.settingId; // 设置用例的唯一标识
        
        // 统一生成标题：如果没有提供标题，则自动从settingsManager获取
        this.title = options.title || this.generateTitle(options.settingId);
        
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

    // 统一的标题生成方法
    generateTitle(settingId) {
        // 首先尝试从全局设置管理器获取标题
        if (window.settingsManager?.generateSettingTitle) {
            try {
                const generatedTitle = window.settingsManager.generateSettingTitle(settingId);
                if (generatedTitle && generatedTitle !== '设置') {
                    // console.log(`✅ 从settingsManager生成标题: ${generatedTitle} (settingId: ${settingId})`);
                    return generatedTitle;
                }
            } catch (error) {
                console.warn(`⚠️ 从settingsManager生成标题失败: ${error.message}`);
            }
        }
        return "设置";
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
            // console.log(`✅ 已清除步骤 ${stepId} 的完成状态`);
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
            isCurrentStep ? 'visible current-step' : '',
            isCompleted ? 'completed' : ''
        ].filter(Boolean).join(' ');

        // 圆圈状态 - 统一使用步骤状态
        const circleClass = isCompleted ? 'completed' : (isCurrentStep ? 'current' : '');
        
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
                    <div id="${this.settingId}-${step.id}-status" class="step-status" style="display: none;"></div>
                    ${buttonsHtml}
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
        // 总是从第一步开始
        this.goToStep(0);
        this.updateStepVisuals();
        
        // 从第一步开始逐步验证，自动跳转到第一个需要用户操作的步骤
        this.autoAdvanceToFirstIncompleteStep();
    }
    
    // 自动推进到第一个未完成的步骤
    async autoAdvanceToFirstIncompleteStep() {
        console.log('🔄 开始自动验证步骤并推进到第一个需要操作的步骤...');
        
        // 先输出所有步骤的完成标记状态
        console.log('📊 所有步骤的完成标记状态:');
        for (let j = 0; j < this.steps.length; j++) {
            const stepStatus = this.isStepCompleted(this.steps[j].id);
            console.log(`  步骤 ${j + 1} (${this.steps[j].id}): ${stepStatus ? '✅ 已完成' : '❌ 未完成'}`);
        }
        
        for (let i = 0; i < this.steps.length; i++) {
            console.log(`🔍 检查步骤 ${i + 1} 的完成状态...`);
            
            const step = this.steps[i];
            const hasCompletedMark = this.isStepCompleted(step.id);
            
            // 首先检查步骤是否已经有完成标记
            if (hasCompletedMark) {
                console.log(`✅ 步骤 ${i + 1} 已有完成标记，需要验证是否仍然有效`);
                
                // 如果有完成标记，还需要验证是否仍然有效
                if (step.validation && typeof step.validation === 'function') {
                    try {
                        this.goToStep(i, { clearTargetStatus: true });
                        await new Promise(resolve => setTimeout(resolve, 600));
                        
                        const isValid = await step.validation();
                        if (isValid) {
                            console.log(`✅ 步骤 ${i + 1} 完成标记有效，继续下一步`);
                            continue;
                        } else {
                            console.log(`❌ 步骤 ${i + 1} 完成标记已失效，停在此步骤`);
                            return;
                        }
                    } catch (error) {
                        console.log(`❌ 步骤 ${i + 1} 验证失败:`, error.message);
                        this.goToStep(i, { clearTargetStatus: true });
                        this.showStepStatus(step.id, `步骤 ${i + 1} 验证失败: ${error.message}`, 'error');
                        return;
                    }
                } else {
                    // 没有验证函数但有完成标记，直接继续
                    console.log(`✅ 步骤 ${i + 1} 有完成标记且无验证函数，继续下一步`);
                    this.goToStep(i, { clearTargetStatus: true });
                    await new Promise(resolve => setTimeout(resolve, 600));
                    continue;
                }
            } else {
                // 没有完成标记，停在此步骤等待用户操作
                console.log(`⏸️ 步骤 ${i + 1} 没有完成标记，停在此步骤等待用户操作`);
                this.goToStep(i, { clearTargetStatus: true });
                await new Promise(resolve => setTimeout(resolve, 600));
                return;
            }
        }
        
        // 如果到达这里，说明所有步骤都验证通过
        // 需要找到第一个未完成的步骤，或者跳转到最后一步
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            if (!this.isStepCompleted(step.id) || (step.validation && !(await step.validation()))) {
                // console.log(`📍 跳转到第一个需要用户操作的步骤: ${i + 1}`);
                this.goToStep(i, { clearTargetStatus: true });
                return;
            }
        }
        
        // 如果所有步骤都完成，跳转到最后一步
        // console.log('✅ 所有步骤都已完成，跳转到最后一步');
        this.goToStep(this.steps.length - 1, { clearTargetStatus: true });
    }

    /**
     * 统一的步骤切换接口
     * @param {number} stepIndex - 目标步骤索引
     * @param {Object} options - 切换选项
     * @param {string} options.successMessage - 成功信息（可选）
     * @param {string} options.errorMessage - 错误信息（可选）
     * @param {string} options.statusType - 状态类型：'success', 'error', 'info', 'warning', 'processing'
     * @param {number} options.delay - 延迟时间（毫秒）
     * @param {boolean} options.autoAdvance - 是否自动推进到下一步
     */
    async switchToStep(stepIndex, options = {}) {
        const {
            successMessage,
            errorMessage,
            statusType = 'info',
            delay = 300,
            autoAdvance = false
        } = options;
        
        // 确保步骤索引有效
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            console.warn(`无效的步骤索引: ${stepIndex}`);
            return;
        }
        
        const step = this.steps[stepIndex];
        
        // 跳转到目标步骤
        this.goToStep(stepIndex);
        
        // 显示状态信息（如果提供）
        if (successMessage || errorMessage) {
            const message = successMessage || errorMessage;
            const type = errorMessage ? 'error' : statusType;
            this.showStepStatus(step.id, message, type);
        }
        
        // 延迟处理
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // 如果需要自动推进且不是最后一步，跳转到下一步
        if (autoAdvance && stepIndex < this.steps.length - 1) {
            // 跳转到下一步，但不显示额外的状态信息
            this.goToStep(stepIndex + 1);
            return;
        }
        
        // console.log(`📍 已切换到步骤 ${stepIndex + 1} (${step.id})`);
    }

    // 已删除goToNextStep函数，使用goToStep替代
    
    /**
     * 统一的步骤验证接口
     * @param {number} stepIndex - 要验证的步骤索引
     * @param {Object} options - 验证选项
     * @param {boolean} options.markCompleted - 验证成功时是否标记为完成
     * @param {boolean} options.autoAdvance - 验证成功时是否自动推进到下一步
     * @param {string} options.processingMessage - 验证中显示的信息
     * @param {string} options.successMessage - 验证成功的信息
     * @param {string} options.errorPrefix - 错误信息前缀
     * @returns {boolean} 验证结果
     */
    async validateStep(stepIndex, options = {}) {
        const {
            markCompleted = true,
            autoAdvance = false,
            processingMessage = `正在验证步骤 ${stepIndex + 1}...`,
            successMessage = `已完成当前步骤`,
            errorPrefix = `步骤 ${stepIndex + 1} 验证失败`
        } = options;
        
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            console.warn(`无效的步骤索引: ${stepIndex}`);
            return false;
        }
        
        const step = this.steps[stepIndex];
        
        // 如果没有验证函数，检查是否已完成
        if (!step.validation || typeof step.validation !== 'function') {
            const isCompleted = this.isStepCompleted(step.id);
            const message = isCompleted ? `已完成当前步骤` : `步骤 ${stepIndex + 1} 等待用户操作`;
            const statusType = isCompleted ? 'success' : 'info';
            
            await this.switchToStep(stepIndex, { 
                successMessage: message, 
                statusType,
                delay: isCompleted ? 200 : 0,
                autoAdvance: isCompleted && autoAdvance
            });
            
            return isCompleted;
        }
        
        try {
            // 显示验证中状态
            await this.switchToStep(stepIndex, { 
                successMessage: processingMessage, 
                statusType: 'processing',
                delay: 100
            });
            
            // 执行验证
            const isValid = await step.validation();
            
            if (isValid) {
                // 验证成功
                if (markCompleted && !this.isStepCompleted(step.id)) {
                    this.markStepCompleted(step.id, true);
                }
                
                await this.switchToStep(stepIndex, { 
                    successMessage, 
                    statusType: 'success',
                    delay: autoAdvance ? 300 : 500,
                    autoAdvance
                });
                
                return true;
            } else {
                // 验证失败
                await this.switchToStep(stepIndex, { 
                    errorMessage: `${errorPrefix}: 验证未通过`,
                    delay: 0
                });
                
                return false;
            }
        } catch (error) {
            // 验证异常
            await this.switchToStep(stepIndex, { 
                errorMessage: `${errorPrefix}: ${error.message}`,
                delay: 0
            });
            
            return false;
        }
    }

    // 跳转到上一步
    goToPreviousStep() {
        const prevIndex = this.currentStepIndex - 1;
        if (prevIndex >= 0) {
            this.switchToStep(prevIndex);
        }
    }

    // 跳转到指定步骤
    /**
     * 跳转到指定步骤
     * @param {number} stepIndex - 目标步骤索引
     * @param {Object} options - 跳转选项
     * @param {string} options.previousStepStatus - 前一步骤的状态信息
     * @param {string} options.previousStepType - 前一步骤的状态类型
     * @param {boolean} options.clearTargetStatus - 是否清除目标步骤的状态
     */
    goToStep(stepIndex, options = {}) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return;
        }
        
        const {
            previousStepStatus,
            previousStepType = 'success',
            clearTargetStatus = true
        } = options;
        
        const previousStepIndex = this.currentStepIndex;
        
        // 如果提供了前一步骤的状态信息，设置前一步骤的状态
        if (previousStepStatus && previousStepIndex >= 0 && previousStepIndex < this.steps.length) {
            const previousStep = this.steps[previousStepIndex];
            this.showStepStatus(previousStep.id, previousStepStatus, previousStepType);
        }
        
        // 如果是回到之前的步骤，清除目标步骤及其之后所有步骤的完成状态
        if (stepIndex < previousStepIndex) {
            // console.log(`🔄 回到上一步 (步骤 ${stepIndex + 1})，清除从该步骤到步骤 ${previousStepIndex + 1} 的所有完成状态`);
            
            // 清除从目标步骤到当前步骤（包括当前步骤）的所有完成状态
            for (let i = stepIndex; i <= previousStepIndex; i++) {
                const stepId = this.steps[i].id;
                this.clearStepCompletion(stepId);
                // console.log(`🔄 已清除步骤 ${i + 1} (${stepId}) 的完成状态`);
            }
        }
        
        // 隐藏当前步骤
        if (previousStepIndex >= 0 && previousStepIndex < this.steps.length) {
            const currentStep = this.overlay.querySelector(`#${this.settingId}-${this.steps[previousStepIndex].id}`);
            if (currentStep) {
                currentStep.classList.remove('visible', 'current-step');
            }
        }
        
        // 显示目标步骤
        this.currentStepIndex = stepIndex;
        const targetStep = this.overlay.querySelector(`#${this.settingId}-${this.steps[stepIndex].id}`);
        if (targetStep) {
            targetStep.classList.add('visible', 'current-step');
            
            // 自动滚动到当前步骤
            this.scrollToStep(targetStep);
        }
        
        // 更新所有步骤的交互状态
        this.updateAllStepsInteractionState();
        
        // 清除目标步骤的状态（如果需要）
        if (clearTargetStatus) {
            const targetStepObj = this.steps[stepIndex];
            const statusElement = this.overlay.querySelector(`#${this.settingId}-${targetStepObj.id}-status`);
            if (statusElement) {
                statusElement.textContent = '';
                statusElement.className = 'step-status';
                statusElement.style.display = 'none';
            }
        }
        
        // 调用步骤进入回调
        const step = this.steps[stepIndex];
        if (step.onEnter && typeof step.onEnter === 'function') {
            step.onEnter();
        }
        
        this.updateStepVisuals();
        
        // console.log(`📍 已跳转到步骤 ${stepIndex + 1} (${step.id})`);
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
                
                // console.log(`📜 自动滚动到步骤，数字圆位置: ${circleOffsetTop}，滚动位置: ${scrollTop}`);
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
            
            // 更新圆圈状态
            circleElement.className = `step-circle ${isCompleted ? 'completed' : (isCurrent ? 'current' : '')}`;
            circleElement.innerHTML = isCompleted ? '<i class="bx bx-check"></i>' : (index + 1);
        });
    }

    // 更新所有步骤的交互状态
    updateAllStepsInteractionState() {
        this.steps.forEach((step, index) => {
            const stepElement = this.overlay.querySelector(`#${this.settingId}-${step.id}`);
            if (!stepElement) return;
            
            const isCurrent = index === this.currentStepIndex;
            
            if (isCurrent) {
                // 当前步骤：启用所有交互元素
                this.enableStepInteraction(stepElement);
            } else {
                // 非当前步骤：禁用所有交互元素
                this.disableStepInteraction(stepElement);
            }
        });
    }

    // 启用步骤内的所有交互元素
    enableStepInteraction(stepElement) {
        // 启用所有交互元素（除了已经被明确禁用的）
        const interactiveElements = stepElement.querySelectorAll('.btn, input, select, textarea, [data-interactive="true"], .dropdown, .dropdown-container, [class*="dropdown"]');
        
        interactiveElements.forEach((element) => {
            const isForceNoInteract = element.classList.contains('force-no-interact');
            
            if (!isForceNoInteract) {
                // 对于步骤管理的元素，直接恢复状态，不使用enableElement（避免设置data-explicitly-enabled）
                const tagName = element.tagName.toLowerCase();
                const isFormElement = ['button', 'input', 'select', 'textarea'].includes(tagName);
                
                if (isFormElement) {
                    element.disabled = false;
                }
                
                // 恢复CSS类和样式
                element.classList.add('force-interact');
                element.style.pointerEvents = '';
                element.style.opacity = '';
                element.style.cursor = '';
                
                // 移除明确启用标记，让元素遵循步骤规则
                element.removeAttribute('data-explicitly-enabled');
            }
        });
    }

    // 禁用步骤内的所有交互元素（除了被明确启用的元素）
    disableStepInteraction(stepElement) {
        // 禁用所有交互元素（包括回退按钮）
        const interactiveElements = stepElement.querySelectorAll('.btn, input, select, textarea, [data-interactive="true"], .dropdown, .dropdown-container, [class*="dropdown"]');
        interactiveElements.forEach((element) => {
            const isExplicitlyEnabled = element.getAttribute('data-explicitly-enabled') === 'true';
            const isForceNoInteract = element.classList.contains('force-no-interact');
            
            // 如果元素被明确启用或强制不可交互，则跳过
            if (isExplicitlyEnabled || isForceNoInteract) {
                return;
            }
            
            // 对于步骤管理的元素，不使用disableElement（避免添加force-no-interact类）
            // 直接设置disabled属性和基本样式，不添加force-no-interact类
            const tagName = element.tagName.toLowerCase();
            const isFormElement = ['button', 'input', 'select', 'textarea'].includes(tagName);
            
            if (isFormElement) {
                element.disabled = true;
            }
            
            // 移除force-interact类，但不添加force-no-interact类
            element.classList.remove('force-interact');
            
            // 为非表单元素设置样式
            if (!isFormElement) {
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.6';
                element.style.cursor = 'not-allowed';
            }
        });
        
        // 注意：不再保持非当前步骤的回退按钮可用
        // 只有当前步骤的回退按钮才应该可用
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
                
                // 显示成功状态
                this.showStepStatus(stepId, '步骤验证通过，即将跳转...', 'success');
                
                // 延迟跳转，让用户看到成功消息
                setTimeout(() => {
                    // 调用函数A（切换函数）实现跳转
                    const nextIndex = this.currentStepIndex + 1;
                    if (nextIndex < this.steps.length) {
                        this.goToStep(nextIndex);
                    } else {
                        // 最后一步完成
                        this.handleSetupComplete();
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('自动跳转检查失败:', error);
            this.showStepStatus(stepId, error.message, 'error');
        }
    }

    // 主动触发当前步骤的自动跳转检查
    triggerAutoJumpCheck() {
        if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
            const currentStep = this.steps[this.currentStepIndex];
            this.checkAutoJump(currentStep.id);
        }
    }

    /**
     * 显示步骤状态并在指定时间后自动跳转到下一步（warning模式）
     * @param {string} stepId - 步骤ID
     * @param {string} message - 警告消息
     * @param {number} waitTime - 等待时间（毫秒），默认2000ms
     * @param {boolean} autoAdvance - 是否自动跳转，默认true
     */
    async showStepWarning(stepId, message, waitTime = 2000) {
        // console.log(`⚠️ 显示步骤警告: ${stepId}, 消息: ${message}, 等待: ${waitTime}ms, 自动跳转: ${autoAdvance}`);
        
        // 显示警告状态
        this.showStepStatus(stepId, message, 'warning');
        
        // 等待指定时间
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // 显示步骤状态信息
    showStepStatus(stepId, message, type = 'info') {
        const selector = `#${this.settingId}-${stepId}-status`;
        const statusElement = this.overlay.querySelector(selector);
        
        if (!statusElement) {
            console.warn(`状态元素未找到: ${selector}`);
            // 尝试查找所有可能的状态元素
            const allStatusElements = this.overlay.querySelectorAll('[id*="status"]');
            console.warn('所有状态元素:', Array.from(allStatusElements).map(el => el.id));
            
            // 尝试创建状态元素（如果不存在）
            const stepContent = this.overlay.querySelector(`#${this.settingId}-${stepId}-content`);
            if (stepContent) {
                const statusDiv = document.createElement('div');
                statusDiv.id = `${this.settingId}-${stepId}-status`;
                statusDiv.className = 'step-status';
                statusDiv.style.display = 'none'; // 默认隐藏
                stepContent.appendChild(statusDiv); // 添加到step-content的末尾，在按钮容器之后
                // console.log(`✅ 已创建缺失的状态元素: ${selector}`);
                
                // 重新获取元素
                const newStatusElement = this.overlay.querySelector(selector);
                if (newStatusElement) {
                    this.setStatusContent(newStatusElement, message, type, stepId);
                }
            }
            return;
        }
        
        this.setStatusContent(statusElement, message, type, stepId);
    }
    
    // 设置状态内容的辅助函数
    setStatusContent(statusElement, message, type, stepId = 'unknown') {
        
        // 清除之前的定时器（如果存在）
        if (statusElement.clearTimer) {
            clearTimeout(statusElement.clearTimer);
            delete statusElement.clearTimer;
        }
        
        // 检查消息是否为空或只包含空白字符
        const hasContent = message && message.trim().length > 0;
        
        if (hasContent) {
            // 设置状态样式和内容
            statusElement.className = `step-status ${type}`;
            statusElement.textContent = message;
            statusElement.style.display = 'block'; // 显示状态
            // console.log(`📊 状态更新 [${stepId}]: ${message} (${type})`);
        } else {
            // 如果没有内容，隐藏状态元素
            statusElement.style.display = 'none';
            statusElement.textContent = '';
            // console.log(`📊 状态隐藏 [${stepId}]: 无内容显示`);
        }
    }

    /**
     * 公开的状态显示接口 - 供外部组件调用
     * @param {string|number} stepIdentifier - 步骤ID或索引
     * @param {string} message - 状态信息
     * @param {string} type - 状态类型：'success', 'error', 'info', 'warning', 'processing'
     */
    updateStatus(stepIdentifier, message, type = 'info') {
        let stepId;
        
        // 如果是数字，转换为步骤ID
        if (typeof stepIdentifier === 'number') {
            const step = this.steps[stepIdentifier];
            if (!step) {
                console.warn(`无效的步骤索引: ${stepIdentifier}`);
                return;
            }
            stepId = step.id;
        } else {
            stepId = stepIdentifier;
        }
        
        this.showStepStatus(stepId, message, type);
    }

    /**
     * 清除状态信息 - 隐藏状态元素
     * @param {string|number} stepIdentifier - 步骤ID或索引
     */
    clearStatus(stepIdentifier) {
        let stepId;
        
        // 如果是数字，转换为步骤ID
        if (typeof stepIdentifier === 'number') {
            const step = this.steps[stepIdentifier];
            if (!step) {
                console.warn(`无效的步骤索引: ${stepIdentifier}`);
                return;
            }
            stepId = step.id;
        } else {
            stepId = stepIdentifier;
        }
        
        // 使用空消息来隐藏状态
        this.showStepStatus(stepId, '', 'info');
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
        // console.log('========== SettingsStepManager.showButton 被调用 ==========');
        // console.log('settingId:', this.settingId);
        // console.log('stepId:', stepId);
        // console.log('buttonId:', buttonId);
        // console.log('buttonSelector:', buttonSelector);
        // console.log('overlay存在:', !!this.overlay);
        
        let buttonElement = this.overlay.querySelector(buttonSelector);
        // console.log('🔘 找到按钮元素:', !!buttonElement);
        
        if (buttonElement) {
            // console.log('按钮当前状态:');
            // console.log('- display:', buttonElement.style.display);
            // console.log('- disabled:', buttonElement.disabled);
            // console.log('- classList:', Array.from(buttonElement.classList));
        }
        
        if (buttonElement) {
            // console.log('📝 设置按钮显示状态');
            buttonElement.style.display = 'inline-block';
            // 不再强制设置disabled=false和force-interact类
            // 让CSS基于current-step类自动控制交互状态
            buttonElement.classList.remove('force-no-interact'); // 移除明确的禁用类
            
            // console.log('设置后的按钮状态:');
            // console.log('- display:', buttonElement.style.display);
            // console.log('- disabled:', buttonElement.disabled);
            // console.log('- classList:', Array.from(buttonElement.classList));
            // console.log('✅ 按钮已显示并启用');
        } else {
            // 按钮不存在，尝试动态创建
            // console.log('🔨 按钮不存在，尝试动态创建...');
            
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
                        // console.log('✅ 动态创建完成设置按钮容器');
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
                        // console.log('✅ 动态创建常规按钮容器');
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
            // console.log('✅ 动态创建按钮成功');
            
            // 重新获取按钮元素并设置事件监听器
            buttonElement = this.overlay.querySelector(buttonSelector);
            if (buttonElement) {
                buttonElement.addEventListener('click', (e) => {
                    const stepId = e.target.getAttribute('data-step-id');
                    const buttonId = e.target.getAttribute('data-button-id');
                    this.handleButtonClick(stepId, buttonId);
                });
                
                buttonElement.classList.add('force-interact');
                // console.log('✅ 按钮事件监听器已添加');
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
    
    // 禁用元素（通用方法）
    disable(stepId, elementId) {
        const element = this.overlay.querySelector(`#${this.settingId}-${stepId}-${elementId}`);
        if (element) {
            this.disableElement(element);
        }
    }
    
    // 启用元素（通用方法）
    enable(stepId, elementId) {
        const element = this.overlay.querySelector(`#${this.settingId}-${stepId}-${elementId}`);
        if (element) {
            this.enableElement(element);
        }
    }

    // 禁用单个DOM元素
    disableElement(element) {
        if (!element) return;
        
        const tagName = element.tagName.toLowerCase();
        const isFormElement = ['button', 'input', 'select', 'textarea'].includes(tagName);
        const isDropdown = element.classList.contains('dropdown') || 
                          element.classList.contains('dropdown-container') ||
                          element.querySelector('.dropdown, .import-dropdown, [class*="dropdown"]');
        
        // 根据元素类型设置disabled属性
        if (isFormElement) {
            element.disabled = true;
        }
        
        // 设置CSS类和样式
        element.classList.remove('force-interact');
        element.classList.add('force-no-interact');
        
        // 清除明确启用标记
        element.removeAttribute('data-explicitly-enabled');
        
        // 为非表单元素或dropdown设置pointer-events
        if (!isFormElement || isDropdown) {
            element.style.pointerEvents = 'none';
            element.style.opacity = '0.6';
            element.style.cursor = 'not-allowed';
        }
        
        // 特殊处理dropdown元素
        if (isDropdown) {
            // 禁用dropdown内的所有交互元素
            const dropdownElements = element.querySelectorAll('button, input, select, textarea, [role="button"], [onclick], [data-toggle]');
            dropdownElements.forEach(el => {
                if (el.tagName.toLowerCase() === 'button' || el.tagName.toLowerCase() === 'input' || 
                    el.tagName.toLowerCase() === 'select' || el.tagName.toLowerCase() === 'textarea') {
                    el.disabled = true;
                }
                el.style.pointerEvents = 'none';
                el.classList.add('force-no-interact');
            });
        }
    }

    // 启用单个DOM元素
    enableElement(element) {
        if (!element) return;
        
        const tagName = element.tagName.toLowerCase();
        const isFormElement = ['button', 'input', 'select', 'textarea'].includes(tagName);
        const isDropdown = element.classList.contains('dropdown') || 
                          element.classList.contains('dropdown-container') ||
                          element.querySelector('.dropdown, .import-dropdown, [class*="dropdown"]');
        
        // 根据元素类型设置disabled属性
        if (isFormElement) {
            element.disabled = false;
        }
        
        // 设置CSS类和样式
        element.classList.remove('force-no-interact');
        element.classList.add('force-interact');
        
        // 记录这个元素被明确启用
        element.setAttribute('data-explicitly-enabled', 'true');
        
        // 为非表单元素恢复pointer-events
        if (!isFormElement || isDropdown) {
            element.style.pointerEvents = '';
            element.style.opacity = '';
            element.style.cursor = '';
        }
        
        // 特殊处理dropdown元素
        if (isDropdown) {
            // 启用dropdown内的所有交互元素
            const dropdownElements = element.querySelectorAll('button, input, select, textarea, [role="button"], [onclick], [data-toggle]');
            dropdownElements.forEach(el => {
                if (el.tagName.toLowerCase() === 'button' || el.tagName.toLowerCase() === 'input' || 
                    el.tagName.toLowerCase() === 'select' || el.tagName.toLowerCase() === 'textarea') {
                    el.disabled = false;
                }
                el.style.pointerEvents = '';
                el.classList.remove('force-no-interact');
                el.classList.add('force-interact');
            });
        }
    }

    // 兼容性方法：禁用按钮
    disableButton(stepId, buttonId) {
        this.disable(stepId, buttonId);
    }
    
    // 兼容性方法：启用按钮
    enableButton(stepId, buttonId) {
        this.enable(stepId, buttonId);
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

// console.log('📋 设置步骤管理器已加载');
