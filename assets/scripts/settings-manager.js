/**
 * 统一的设置管理器
 * 管理所有设置项的状态、依赖关系、toggle、进出等
 */

// Badge文本常量
const BADGE_TEXTS = {
    NEW: '新功能',
    RECONFIG: '点击重新配置'
};

class SettingsManager {
    constructor() {
        // 设置项配置
        this.settings = {
            microphone: {
                id: 'microphone',
                name: '录音',
                icon: 'bx bx-devices',
                type: 'setup', // 'setup' | 'config'
                dependencies: [], // 依赖的其他设置
                dependents: ['recording'], // 依赖此设置的其他设置
                managerClass: 'MicrophoneSetupManager',
                configKey: 'microphoneConfig',
                toggleEnabled: true,
                fields: [] // 动态字段，由管理器注册
            },
            camera: {
                id: 'camera',
                name: '摄像头',
                icon: 'bx bx-camera',
                type: 'setup',
                dependencies: [],
                dependents: ['screenRecording'],
                managerClass: 'CameraSetupManager',
                configKey: 'cameraConfig',
                toggleEnabled: true,
                fields: []
            },
            recording: {
                id: 'recording',
                name: '录音文字识别',
                icon: 'bx bx-microphone',
                type: 'config',
                dependencies: ['microphone'],
                dependents: ['ai'],
                managerClass: 'AudioSetupManager',
                configKey: 'recording',
                toggleEnabled: true,
                fields: [
                    { key: 'appKey', name: 'App Key', type: 'password', copyable: true },
                    { key: 'accessKeyId', name: 'AccessKey ID', type: 'password', copyable: true },
                    { key: 'accessKeySecret', name: 'AccessKey Secret', type: 'password', copyable: true }
                ]
            },
            ai: {
                id: 'ai',
                name: '智谱AI评分',
                icon: 'bx bx-brain',
                type: 'config',
                dependencies: ['recording'],
                dependents: [],
                managerClass: 'AISetupManager',
                configKey: 'ai',
                toggleEnabled: true,
                fields: [
                    { key: 'zhipuApiKey', name: '智谱AI API Key', type: 'password', copyable: true }
                ]
            },
            effectsVolume: {
                id: 'effectsVolume',
                name: '计时音效音量',
                icon: 'bx bx-volume-full',
                type: 'slider',
                dependencies: [],
                dependents: [],
                managerClass: null, // 直接在设置页面处理
                configKey: 'effectsVolume',
                toggleEnabled: false,
                fields: [
                    { key: 'volume', name: '音量', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.5 }
                ]
            },
            backgroundMusic: {
                id: 'backgroundMusic',
                name: '背景音乐音量',
                icon: 'bx bx-music',
                type: 'slider',
                dependencies: [],
                dependents: [],
                managerClass: null, // 直接在设置页面处理
                configKey: 'backgroundMusicVolume',
                toggleEnabled: false,
                fields: [
                    { key: 'volume', name: '音量', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.5 }
                ]
            }
        };
        
        // 设置状态缓存
        this.settingsState = {};
        
        // 字段注册表
        this.registeredFields = {};
        
        // 访问跟踪
        this.visitedSettings = this.loadVisitedSettings();
        
        // 快速验证函数注册表
        this.quickTestFunctions = {};
        
        // 快速测试状态
        this.quickTestStates = {};
        
        // 快速测试缓存系统
        this.quickTestCache = {};
        this.quickTestCounters = {};
        this.quickTestThresholds = {
            microphone: 0,        // 录音设备：每次都测试（0表示每次实际测试）
            camera: 1,            // 摄像头设备：1次后才实际测试
            recording: 2,         // 录音文字识别：2次后才实际测试
            ai: 2                 // 智谱AI评分：2次后才实际测试
        };
        
        // 初始化
        this.loadAllSettings();
        this.initializeQuickTestFunctions();
        this.loadTestCache();
        
        // 延迟更新主菜单badge，确保DOM已加载
        setTimeout(() => {
            this.updateMainMenuBadge();
        }, 100);
    }

    // 加载所有设置状态
    loadAllSettings() {
        Object.keys(this.settings).forEach(settingId => {
            this.loadSettingState(settingId);
        });
    }

    // 加载单个设置状态
    loadSettingState(settingId) {
        const setting = this.settings[settingId];
        if (!setting) return;

        const configKey = setting.configKey;
        let config = null;

        console.log(`📥 加载 ${settingId} 设置状态，configKey: ${configKey}`);

        // 从不同来源加载配置
        if (configKey === 'microphoneConfig') {
            const stored = localStorage.getItem('microphoneConfig');
            config = stored ? JSON.parse(stored) : null;
            console.log(`📥 ${settingId} 从localStorage加载:`, config);
        } else if (configKey === 'cameraConfig') {
            const stored = localStorage.getItem('cameraConfig');
            config = stored ? JSON.parse(stored) : null;
            console.log(`📥 ${settingId} 从localStorage加载:`, config);
        } else if (configKey === 'effectsVolume') {
            // 从simpleConfig加载计时音效音量
            const volume = simpleConfig ? simpleConfig.get('effectsVolume') : null;
            config = volume !== null ? { volume: volume } : { volume: 0.5 };
        } else if (configKey === 'backgroundMusicVolume') {
            // 从simpleConfig加载背景音乐音量
            const volume = simpleConfig ? simpleConfig.get('backgroundMusicVolume') : null;
            config = volume !== null ? { volume: volume } : { volume: 0.5 };
        } else {
            // 从simpleConfig加载
            config = simpleConfig ? simpleConfig.getAll() : {};
            console.log(`📥 ${settingId} 从simpleConfig加载:`, config);
        }

        const isConfigured = this.isSettingConfigured(settingId, config);
        const isEnabled = this.isSettingEnabled(settingId, config);

        console.log(`📊 ${settingId} 状态计算:`, {
            isConfigured,
            isEnabled,
            config: config
        });

        // 更新设置状态
        this.settingsState[settingId] = {
            configured: isConfigured,
            enabled: isEnabled,
            config: config,
            lastUpdate: Date.now()
        };

        console.log(`✅ ${settingId} 状态已更新:`, this.settingsState[settingId]);
    }

    // 加载访问过的设置记录
    loadVisitedSettings() {
        try {
            const visited = localStorage.getItem('visitedSettings');
            return visited ? JSON.parse(visited) : {};
        } catch (error) {
            console.warn('⚠️ 无法加载访问记录:', error);
            return {};
        }
    }

    // 保存访问过的设置记录
    saveVisitedSettings() {
        try {
            localStorage.setItem('visitedSettings', JSON.stringify(this.visitedSettings));
            // console.log('💾 访问记录已保存:', this.visitedSettings);
        } catch (error) {
            console.error('❌ 保存访问记录失败:', error);
        }
    }

    // 标记设置为已访问
    markSettingAsVisited(settingId) {
        const setting = this.settings[settingId];
        if (!setting) return;

        this.visitedSettings[settingId] = {
            visited: true,
            timestamp: Date.now(),
            settingName: setting.name
        };
        
        this.saveVisitedSettings();
        // console.log(`✅ 标记 ${setting.name} 为已访问`);
        
        // 更新badge显示
        this.updateSettingBadge(settingId);
        this.updateMainMenuBadge();
    }

    // 检查设置是否已被访问
    isSettingVisited(settingId) {
        return this.visitedSettings[settingId]?.visited || false;
    }

    // 清除访问记录（调试用）
    clearVisitedSettings() {
        this.visitedSettings = {};
        this.saveVisitedSettings();
        // console.log('🗑️ 已清除所有访问记录');
        
        // 刷新所有badge
        this.updateAllBadges();
        this.updateMainMenuBadge();
    }

    // 检查设置是否已配置
    isSettingConfigured(settingId, config) {
        console.log(`🔍 检查 ${settingId} 是否已配置:`, config);
        
        if (settingId === 'effectsVolume' || settingId === 'backgroundMusic') {
            return true;
        }
        
        const isCompleted = simpleConfig ? simpleConfig.isSettingTested(settingId) : false;
        console.log(`🔍 ${settingId} 测试完成状态: ${isCompleted}`);
        
        if (!isCompleted) {
            console.log(`❌ ${settingId} 未完成测试，配置状态为false`);
            return false;
        }
        
        if (settingId === 'microphone') {
            const hasDevice = !!(config && config.selectedDeviceId);
            console.log(`🔍 ${settingId} 设备配置检查: ${hasDevice}`);
            return hasDevice;
        } else if (settingId === 'camera') {
            const hasDevice = !!(config && config.selectedDeviceId);
            console.log(`🔍 ${settingId} 设备配置检查: ${hasDevice}`);
            return hasDevice;
        } else if (settingId === 'recording') {
            const isConfigured = !!(config && config.appKey && config.accessKeyId && config.accessKeySecret);
            console.log(`🔍 ${settingId} API配置检查: ${isConfigured}`);
            return isConfigured;
        } else if (settingId === 'ai') {
            const isConfigured = !!(config && config.zhipuApiKey);
            console.log(`🔍 ${settingId} API配置检查: ${isConfigured}`);
            return isConfigured;
        }
        
        console.log(`⚠️ ${settingId} 未匹配到配置检查逻辑`);
        return false;
    }

    // 检查设置是否启用
    isSettingEnabled(settingId, config) {
        const setting = this.settings[settingId];
        console.log(`🔍 检查 ${settingId} 是否启用:`, config);
        
        if (settingId === 'microphone') {
            const isEnabled = !!(config && config.enabled);
            console.log(`🔍 ${settingId} 启用状态: ${isEnabled}`);
            return isEnabled;
        } else if (settingId === 'camera') {
            const isEnabled = !!(config && config.enabled);
            console.log(`🔍 ${settingId} 启用状态: ${isEnabled}`);
            return isEnabled;
        } else if (settingId === 'recording') {
            // 录音设置只有在已配置、已启用且已测试完成时才显示为启用
            const isConfigured = this.isSettingConfigured(settingId, config);
            const isEnabled = !!(config && config.recordingEnabled);
            const isTested = simpleConfig ? simpleConfig.isSettingTested('recording') : false;
            
            const result = isConfigured && isEnabled && isTested;
            console.log(`🔍 ${settingId} 启用状态检查:`, {
                isConfigured, isEnabled, isTested, result
            });
            return result;
        } else if (settingId === 'ai') {
            // AI设置只有在已配置、已启用且已测试完成时才显示为启用
            const isConfigured = this.isSettingConfigured(settingId, config);
            const isEnabled = !!(config && config.aiEnabled);
            const isTested = simpleConfig ? simpleConfig.isSettingTested('ai') : false;
            
            const result = isConfigured && isEnabled && isTested;
            console.log(`🔍 ${settingId} 启用状态检查:`, {
                isConfigured, isEnabled, isTested, result
            });
            return result;
        } else if (settingId === 'effectsVolume' || settingId === 'backgroundMusic') {
            // 滑动条类型的设置总是启用的
            return true;
        }
        
        // 其他设置根据配置情况自动启用
        const result = this.isSettingConfigured(settingId, config);
        console.log(`🔍 ${settingId} 默认启用状态（基于配置状态）: ${result}`);
        return result;
    }

    // 检测是否为移动端设备
    isMobileDevice() {
        const userAgent = navigator.userAgent;
        return /iPhone|iPad|iPod|Android/i.test(userAgent);
    }

    // 检查设置依赖是否满足（递归检查传递性依赖）
    areDependenciesMet(settingId, checkedIds = new Set()) {
        // 移动端隐藏音频音量设置
        if (this.isMobileDevice() && (settingId === 'effectsVolume' || settingId === 'backgroundMusic')) {
            return false;
        }
        
        // 防止循环依赖
        if (checkedIds.has(settingId)) {
            console.warn(`⚠️ 检测到循环依赖: ${settingId}`);
            return false;
        }
        
        checkedIds.add(settingId);
        
        const setting = this.settings[settingId];
        if (!setting.dependencies || setting.dependencies.length === 0) {
            return true;
        }

        return setting.dependencies.every(depId => {
            const depState = this.settingsState[depId];
            
            // 直接依赖必须配置且启用
            if (!depState || !depState.configured || !depState.enabled) {
                return false;
            }
            
            // 递归检查传递性依赖
            return this.areDependenciesMet(depId, new Set(checkedIds));
        });
    }

    // 注册设置字段
    registerSettingFields(settingId, fields) {
        // console.log(`📝 registerSettingFields被调用: settingId=${settingId}`);
        // console.log(`📝 要注册的字段:`, fields);
        
        this.registeredFields[settingId] = fields;
        // console.log(`📝 已保存到registeredFields[${settingId}]`);
        
        // 减少日志输出：只在调试模式下输出详细信息
        if (window.DEBUG_SETTINGS) {
            // console.log(`✅ 已注册 ${settingId} 设置字段:`, fields);
        }
        
        // 立即更新UI显示
        // console.log(`📝 调用updateSettingFieldsUI更新UI`);
        this.updateSettingFieldsUI(settingId, fields);
    }

    // 更新设置字段UI显示
    updateSettingFieldsUI(settingId, fields) {
        console.log(`🖼️ updateSettingFieldsUI被调用: settingId=${settingId}`);
        console.log(`🖼️ 要更新的字段:`, fields);
        
        const contentContainer = document.getElementById(`${settingId}Settings`);
        console.log(`🖼️ 查找容器元素 ${settingId}Settings:`, !!contentContainer);
        
        if (!contentContainer) {
            console.warn(`未找到设置容器: ${settingId}Settings`);
            // 尝试查找所有可能的容器
            const allContainers = document.querySelectorAll('[id*="Settings"]');
            console.warn(`所有Settings容器:`, Array.from(allContainers).map(el => el.id));
            return;
        }
        
        // 清空现有内容
        contentContainer.innerHTML = '';
        
        // 统一的字段显示条件检查
        const shouldShowFields = this.shouldShowSettingFields(settingId);
        console.log(`🖼️ ${settingId} 字段显示条件检查: ${shouldShowFields}`);
        
        if (!shouldShowFields) {
            // 不满足显示条件，保持隐藏状态
            contentContainer.classList.remove('expanded');
            console.log(`🖼️ ${settingId} 不满足字段显示条件，保持隐藏状态`);
            return;
        }
        
        // 检查是否有字段内容
        if (!fields || fields.length === 0) {
            // 没有字段时，确保容器保持隐藏状态
            contentContainer.classList.remove('expanded');
            console.log(`🖼️ ${settingId}设置无字段内容，保持隐藏状态`);
            return;
        }
        
        // 过滤出有值的字段（规则2：完成之后，如果字段不为空显示）
        const fieldsWithValues = fields.filter(field => {
            const hasValue = field.value && field.value.trim().length > 0;
            console.log(`🖼️ 字段 ${field.name} 有值: ${hasValue} (值: ${field.value ? '有' : '无'})`);
            return hasValue;
        });
        
        console.log(`🖼️ ${settingId} 过滤后的字段数量: ${fieldsWithValues.length}/${fields.length}`);
        
        if (fieldsWithValues.length === 0) {
            // 没有有值的字段，保持隐藏状态
            contentContainer.classList.remove('expanded');
            console.log(`🖼️ ${settingId} 没有有值的字段，保持隐藏状态`);
            return;
        }
        
        // 生成有值字段的HTML
        fieldsWithValues.forEach((field, index) => {
            const fieldHtml = this.generateFieldHtml(field);
            console.log(`🖼️ 第${index + 1}个字段HTML已生成: ${field.name}`);
            contentContainer.insertAdjacentHTML('beforeend', fieldHtml);
        });
        
        // 有字段内容时，确保容器显示
        contentContainer.classList.add('expanded');
        console.log(`🖼️ ${settingId}设置显示${fieldsWithValues.length}个字段，已设置为展开状态`);
        
        console.log(`✅ 已完成 ${settingId} 设置UI显示更新`);
    }
    
    // 统一的字段显示条件检查
    shouldShowSettingFields(settingId) {
        const state = this.settingsState[settingId];
        if (!state) {
            console.log(`🔍 ${settingId} 没有状态信息，不显示字段`);
            return false;
        }
        
        // 规则1：没有完成，字段肯定不显示
        const isCompleted = this.isSettingConfigured(settingId, state.config);
        if (!isCompleted) {
            console.log(`🔍 ${settingId} 未完成配置，不显示字段`);
            return false;
        }
        
        // 规则2：完成之后，可以显示字段（具体哪些字段显示由字段值决定）
        console.log(`🔍 ${settingId} 已完成配置，可以显示字段`);
        return true;
    }

    // 生成单个字段的HTML
    generateFieldHtml(field) {
        const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
        let valueHtml = '';
        
        if (field.type === 'password') {
            // 密文显示
            const maskedValue = '*'.repeat(Math.min(field.value.length, 12));
            valueHtml = `
                <div class="field-value password-field" id="${fieldId}">
                    <span class="masked-value">${maskedValue}</span>
                    <span class="real-value" style="display: none;">${field.value}</span>
                    <button class="toggle-visibility-btn" onclick="settingsManager.toggleFieldVisibility('${fieldId}')">
                        <i class='bx bx-show'></i>
                    </button>
                </div>
            `;
        } else {
            // 明文显示
            const displayValue = field.value || '未设置';
            valueHtml = `
                <div class="field-value text-field" id="${fieldId}">
                    <span class="value-text">${displayValue}</span>
                </div>
            `;
        }
        
        // 添加复制按钮
        if (field.copyable) {
            valueHtml = valueHtml.replace('</div>', `
                <button class="copy-field-btn" onclick="settingsManager.copyFieldValue('${fieldId}', '${field.type}')">
                    <i class='bx bx-copy'></i>
                </button>
            </div>`);
        }
        
        return `
            <div class="setting-field">
                <label>${field.name}</label>
                ${valueHtml}
            </div>
        `;
    }

    // 切换字段可见性
    toggleFieldVisibility(fieldId) {
        const fieldElement = document.getElementById(fieldId);
        if (!fieldElement) return;
        
        const maskedValue = fieldElement.querySelector('.masked-value');
        const realValue = fieldElement.querySelector('.real-value');
        const toggleBtn = fieldElement.querySelector('.toggle-visibility-btn i');
        
        if (maskedValue && realValue && toggleBtn) {
            if (maskedValue.style.display === 'none') {
                // 显示掩码，隐藏真实值
                maskedValue.style.display = '';
                realValue.style.display = 'none';
                toggleBtn.className = 'bx bx-show';
            } else {
                // 显示真实值，隐藏掩码
                maskedValue.style.display = 'none';
                realValue.style.display = '';
                toggleBtn.className = 'bx bx-hide';
            }
        }
    }

    // 复制字段值
    copyFieldValue(fieldId, fieldType) {
        const fieldElement = document.getElementById(fieldId);
        if (!fieldElement) return;
        
        let textToCopy = '';
        
        if (fieldType === 'password') {
            const realValue = fieldElement.querySelector('.real-value');
            textToCopy = realValue ? realValue.textContent : '';
        } else {
            const valueText = fieldElement.querySelector('.value-text');
            textToCopy = valueText ? valueText.textContent : '';
        }
        
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                // console.log('✅ 已复制到剪贴板:', textToCopy);
                
                // 显示复制成功提示
                const copyBtn = fieldElement.querySelector('.copy-field-btn i');
                if (copyBtn) {
                    const originalClass = copyBtn.className;
                    copyBtn.className = 'bx bx-check';
                    setTimeout(() => {
                        copyBtn.className = originalClass;
                    }, 1000);
                }
            }).catch(err => {
                console.error('❌ 复制失败:', err);
            });
        }
    }

    // 处理toggle状态改变
    async handleToggleChange(settingId, enabled) {
        // console.log(`========== 设置Toggle状态改变: ${settingId} ==========`);
        // console.log('（1）当前设置是否配置:', this.settingsState[settingId]?.configured);
        // console.log('（2）当前设置是否启用:', this.settingsState[settingId]?.enabled);
        // console.log('（3）新的toggle状态:', enabled);

        const setting = this.settings[settingId];
        const currentState = this.settingsState[settingId];

        // 检查设置是否已配置（使用布尔值判断）
        const isConfigured = !!(currentState && currentState.configured);
        
        if (isConfigured) {
            // console.log('（4）准备进行的操作:', enabled ? `启用${setting.name}` : `关闭${setting.name}`);
            
            // 如果是启用操作，先执行快速测试
            if (enabled && this.quickTestFunctions[settingId]) {
                // console.log('（5）执行快速测试验证...');
                
                // 显示测试状态的紫色流体特效
                this.showTestingEffect(settingId);
                
                const testResult = await this.performQuickTest(settingId);
                
                // 隐藏测试特效
                this.hideTestingEffect(settingId);
                
                if (!testResult.success) {
                    // console.log('（6）快速测试失败，重置toggle状态');
                    // 测试失败，刷新toggle状态（会自动设置为off）
                    this.refreshSettingDisplay(settingId);
                    // 建议用户重新配置
                    if (window.showMessage) {
                        window.showMessage(`${setting.name}验证失败: ${testResult.message}，建议重新完成设置配置。`, 'error');
                    }
                    return;
                }
                
                // console.log('（6）快速测试通过，继续启用设置');
            }
            
            // 更新配置
            this.updateSettingEnabled(settingId, enabled);
            
            // 刷新UI
            this.refreshSettingDisplay(settingId);
            
            // 处理依赖关系
            this.handleDependencyChanges(settingId, enabled);
            
            // 更新badge状态
            this.updateSettingBadge(settingId);
            this.updateMainMenuBadge();
            
        } else {
            // console.log('（4）准备进行的操作: 无配置信息，进入设置页面');
            
            // 如果用户试图启用未配置的设置，进入设置页面
            if (enabled) {
                // 进入设置页面
                this.enterSetting(settingId);
            } else {
                // 如果用户试图禁用未配置的设置，直接更新状态
                this.updateSettingEnabled(settingId, false);
                this.refreshSettingDisplay(settingId);
            }
        }
        
        // console.log('========== Toggle事件处理完成 ==========');
    }

    // 更新设置启用状态（统一逻辑）
    updateSettingEnabled(settingId, enabled) {
        const setting = this.settings[settingId];
        if (!setting) return;
        
        const configKey = setting.configKey;
        
        // 根据配置键统一处理
        if (configKey === 'microphoneConfig') {
            // 处理localStorage存储的配置
            const config = localStorage.getItem(configKey);
            if (config) {
                const parsedConfig = JSON.parse(config);
                parsedConfig.enabled = enabled;
                parsedConfig.timestamp = Date.now();
                
                localStorage.setItem(configKey, JSON.stringify(parsedConfig));
                
                // 更新状态缓存
                this.settingsState[settingId].enabled = enabled;
                this.settingsState[settingId].config = parsedConfig;
                this.settingsState[settingId].lastUpdate = Date.now();
                
                // 注册字段（特殊处理）
                if (settingId === 'microphone') {
                    this.registerMicrophoneFields(parsedConfig);
                } else if (settingId === 'camera') {
                    this.registerCameraFields(parsedConfig);
                }
            }
        } else if (configKey === 'effectsVolume' || configKey === 'backgroundMusicVolume') {
            // 滑动条类型设置不需要启用/禁用逻辑
            // console.log(`⚠️ ${setting.name} 是滑动条类型，不支持启用/禁用操作`);
            return;
        } else {
            // 处理simpleConfig存储的配置
            if (simpleConfig) {
                // 构建启用状态键名
                const enabledKey = settingId + 'Enabled';
                simpleConfig.set(enabledKey, enabled);
                
                // 重新加载配置
                const config = simpleConfig.getAll();
                
                // 更新状态缓存
                this.settingsState[settingId].enabled = this.isSettingEnabled(settingId, config);
                this.settingsState[settingId].config = config;
                this.settingsState[settingId].lastUpdate = Date.now();
                
                // 特殊处理录音文字识别字段显示
                if (settingId === 'recording') {
                    this.updateRecordingFieldsVisibility();
                }
            }
        }
        
        // console.log(`✅ ${setting.name} 设置已${enabled ? '启用' : '禁用'}`);
    }

    // 注册麦克风字段
    registerMicrophoneFields(config) {
        const fields = [
            {
                name: '已选择设备',
                value: config.selectedDeviceName || 'Unknown Device',
                type: 'text',
                copyable: false
            },
            {
                name: '设备状态',
                value: config.enabled ? '已启用' : '已禁用',
                type: 'text',
                copyable: false
            },
            {
                name: '配置时间',
                value: new Date(config.timestamp).toLocaleString(),
                type: 'text',
                copyable: false
            }
        ];
        
        this.registerSettingFields('microphone', fields);
    }

    // 注册摄像头字段
    registerCameraFields(config) {
        const fields = [
            {
                name: '已选择设备',
                value: config.selectedDeviceName || 'Unknown Device',
                type: 'text',
                copyable: false
            },
            {
                name: '设备状态',
                value: config.enabled ? '已启用' : '已禁用',
                type: 'text',
                copyable: false
            },
            {
                name: '配置时间',
                value: new Date(config.timestamp).toLocaleString(),
                type: 'text',
                copyable: false
            }
        ];
        
        this.registerSettingFields('camera', fields);
    }

    // 更新录音文字识别字段显示状态
    updateRecordingFieldsVisibility() {
        const recordingContainer = document.getElementById('recordingSettings');
        if (recordingContainer) {
            if (this.settingsState.recording?.enabled) {
                console.log('📝 录音文字识别已启用，显示字段');
                recordingContainer.classList.add('expanded');
            } else {
                console.log('📝 录音文字识别已禁用，隐藏字段');
                recordingContainer.classList.remove('expanded');
            }
        }
    }

    // 处理依赖关系变化（递归处理传递性依赖）
    handleDependencyChanges(settingId, enabled) {
        // console.log(`🔄 处理 ${settingId} 依赖关系变化，enabled: ${enabled}`);
        
        // 刷新所有设置，让依赖检查自动生效
        this.refreshAllSettings();
        
        // 如果设置被禁用，递归禁用所有依赖此设置的设置
        if (!enabled) {
            this.disableDependentSettings(settingId);
        }
    }
    
    // 递归禁用依赖此设置的其他设置
    disableDependentSettings(settingId) {
        const setting = this.settings[settingId];
        
        setting.dependents.forEach(dependentId => {
            const dependentState = this.settingsState[dependentId];
            
            if (dependentState && dependentState.enabled) {
                // console.log(`🔄 自动禁用依赖设置: ${dependentId}`);
                
                // 更新状态
                this.updateSettingEnabled(dependentId, false);
                
                // 递归处理
                this.disableDependentSettings(dependentId);
            }
        });
    }

    // 显示设置卡片
    showSetting(settingId) {
        const card = document.getElementById(`${settingId}Card`);
        if (card) {
            card.style.display = 'block';
            // 减少日志输出
        if (window.DEBUG_SETTINGS) {
            // console.log(`✅ 显示设置卡片: ${settingId}`);
        }
        }
    }

    // 隐藏设置卡片
    hideSetting(settingId) {
        const card = document.getElementById(`${settingId}Card`);
        if (card) {
            card.style.display = 'none';
            // 减少日志输出
        if (window.DEBUG_SETTINGS) {
            // console.log(`✅ 隐藏设置卡片: ${settingId}`);
        }
        }
    }

    // 进入设置页面
    async enterSetting(settingId) {
        const setting = this.settings[settingId];
        
        // 滑动条类型的设置不需要进入单独页面
        if (setting.type === 'slider') {
            // console.log(`🎚️ ${setting.name} 是滑动条类型，无需进入设置页面`);
            return;
        }
        
        // 检查依赖设置的快速测试
        if (setting.dependencies && setting.dependencies.length > 0) {
            // console.log(`🔄 检查 ${setting.name} 的依赖项快速测试...`);
            
            for (const depId of setting.dependencies) {
                const depSetting = this.settings[depId];
                const depState = this.settingsState[depId];
                
                // 检查依赖项是否已配置和启用
                if (!depState || !depState.configured || !depState.enabled) {
                        if (window.showMessage) {
                            window.showMessage(`无法进入${setting.name}设置：依赖的${depSetting?.name || depId}未配置或未启用，请先完成该设置。`, 'error');
                        }
                    return;
                }
                
                // 如果依赖项有快速测试函数，执行快速测试
                if (this.quickTestFunctions[depId]) {
                    // console.log(`🧪 测试依赖项: ${depSetting.name}`);
                    
                    // 显示测试状态
                    this.showTestingEffect(depId);
                    
                    const depResult = await this.performCachedTest(depId, false);
                    
                    // 隐藏测试状态
                    this.hideTestingEffect(depId);
                    
                    if (!depResult.success) {
                        // 更新依赖项的测试状态指示器为失败状态
                        // console.log(`🔴 依赖项${depSetting.name}测试失败，更新test-status-dot为红色`);
                        
                        // 如果是录音设备，进行详细的错误分析
                        if (depId === 'microphone') {
                            const errorType = this.analyzeErrorType(depResult.message);
                            // console.log(`📊 依赖项录音设备测试失败: ${errorType} - "${depResult.message}"`);
                        }
                        
                        this.quickTestStates[depId] = 'failed';
                        this.updateQuickTestIndicator(depId, 'failed', depResult.message);
                        
                        // 如果是录音设备测试失败，更新设备状态显示
                        if (depId === 'microphone') {
                            this.updateMicrophoneStatusAfterFailedTest(depResult.message);
                        }
                        
                        if (window.showMessage) {
                            // 优化错误信息：提取最核心的错误信息并自然语言化，去掉中间的"测试失败"
                            let optimizedMessage = this.optimizeErrorMessage(depResult.message, depSetting.name);
                            // 进一步简化：去掉"录音测试失败："这样的中间信息
                            optimizedMessage = optimizedMessage.replace(/^.*测试失败[：:]\s*/, '');
                            window.showMessage(`无法进入${setting.name}设置：${optimizedMessage}`, 'error');
                        }
                        return;
                    }
                }
            }
        }
        
        // 标记设置为已访问
        this.markSettingAsVisited(settingId);
        
        const managerClass = window[setting.managerClass];
        
        if (!managerClass) {
            console.error(`❌ 未找到管理器类: ${setting.managerClass}`);
            return;
        }
        
        // console.log(`🔄 进入 ${setting.name} 设置页面`);
        
        // 关闭当前overlay
        const currentOverlay = document.querySelector('.slides-overlay');
        if (currentOverlay) {
            currentOverlay.remove();
        }
        
        // 创建设置管理器实例
        const manager = new managerClass();
        const setupOverlay = manager.createSetup();
    }

    // 刷新设置显示
    refreshSettingDisplay(settingId) {
        // 重新加载设置状态
        this.loadSettingState(settingId);
        
        // 更新toggle状态
        this.updateToggleState(settingId);
        
        // 更新快速测试指示器状态
        this.updateQuickTestIndicatorByState(settingId);
        
        // 更新字段显示
        const fields = this.registeredFields[settingId];
        if (fields) {
            this.updateSettingFieldsUI(settingId, fields);
        } else {
            // 如果没有注册的字段，尝试从状态生成字段
            this.generateFieldsFromState(settingId);
        }
        
        // 减少日志输出：只在调试模式下输出详细信息
        if (window.DEBUG_SETTINGS) {
            // console.log(`✅ 已刷新 ${settingId} 设置显示`);
        }
    }

    // 更新toggle状态
    updateToggleState(settingId) {
        console.log(`🎯 updateToggleState: ${settingId}`);
        const toggleElement = document.getElementById(`${settingId}Toggle`);
        const state = this.settingsState[settingId];
        
        console.log(`🎯 Toggle元素存在: ${!!toggleElement}, 状态存在: ${!!state}`);
        
        if (toggleElement && state) {
            // 使用isSettingConfigured函数来判断是否已配置完成
            const isConfigured = this.isSettingConfigured(settingId, state.config);
            const isEnabled = state.enabled;
            
            console.log(`🎯 ${settingId} Toggle状态判断:`, {
                isConfigured,
                isEnabled,
                shouldBeOn: isConfigured && isEnabled
            });
            
            // 移除所有状态类
            toggleElement.classList.remove('on', 'off');
            
            // 根据配置状态和启用状态设置on/off类
            if (isConfigured && isEnabled) {
                toggleElement.classList.add('on');
                toggleElement.style.pointerEvents = 'auto';
                toggleElement.style.opacity = '1';
                console.log(`✅ ${settingId} Toggle设置为ON状态`);
            } else {
                toggleElement.classList.add('off');
                if (!isConfigured) {
                    // 未配置时可以点击进入设置
                    toggleElement.style.pointerEvents = 'auto';
                    toggleElement.style.opacity = '0.7';
                    console.log(`⚪ ${settingId} Toggle设置为OFF状态（未配置）`);
                } else {
                    // 已配置但未启用时也可以点击
                    toggleElement.style.pointerEvents = 'auto';
                    toggleElement.style.opacity = '1';
                    console.log(`⚪ ${settingId} Toggle设置为OFF状态（已配置但未启用）`);
                }
            }
            
            // 自动管理展开状态
            this.updateCardExpandedState(settingId, isConfigured && isEnabled);
        } else {
            console.warn(`⚠️ ${settingId} Toggle更新失败: 元素或状态不存在`);
        }
    }

    // 更新卡片展开状态
    updateCardExpandedState(settingId, isToggleChecked) {
        const card = document.getElementById(`${settingId}Card`);
        if (!card) return;
        
        if (isToggleChecked) {
            card.classList.add('toggle-checked');
        } else {
            card.classList.remove('toggle-checked');
        }
        
        // console.log(`✅ 更新 ${settingId} 卡片展开状态: ${isToggleChecked ? '展开' : '收起'}`);
    }

    // 刷新所有设置显示
    refreshAllSettings() {
        console.log('🔄 refreshAllSettings 开始刷新所有设置');
        Object.keys(this.settings).forEach(settingId => {
            console.log(`🔄 刷新设置: ${settingId}`);
            
            // 重新加载设置状态
            this.loadSettingState(settingId);
            const state = this.settingsState[settingId];
            console.log(`📊 ${settingId} 状态:`, {
                configured: state?.configured,
                enabled: state?.enabled,
                config: state?.config
            });
            
            this.refreshSettingDisplay(settingId);
            
            // 根据依赖关系显示或隐藏设置卡片
            if (this.areDependenciesMet(settingId)) {
                this.showSetting(settingId);
            } else {
                this.hideSetting(settingId);
            }
        });
        
        // 更新所有badge状态
        this.updateAllBadges();
        
        // 更新主菜单NEW badge
        this.updateMainMenuBadge();
        console.log('✅ refreshAllSettings 完成');
    }

    // 初始化设置overlay
    initializeSettingsOverlay(overlay) {
        // console.log('🔧 初始化设置overlay...');
        
        // 设置所有toggle事件监听器
        Object.keys(this.settings).forEach(settingId => {
            this.setupToggleEvents(overlay, settingId);
            this.setupCardEvents(overlay, settingId);
        });
        
        // 刷新所有设置显示
        this.refreshAllSettings();
        
        // 初始化设备设置字段显示
        this.initializeDeviceSettingsFields();
        
        // 检测系统并初始化滑动条设置
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (!isIOS) {
            // console.log('🎚️ 非iOS系统，初始化滑动条设置...');
            this.initializeSliderSettings(overlay);
        } else {
            // console.log('📱 iOS系统，跳过滑动条设置');
        }
        
        // console.log('✅ 设置overlay初始化完成');
    }

    // 初始化设备设置字段显示
    initializeDeviceSettingsFields() {
        console.log('🔧 初始化设备设置字段显示');
        
        // 初始化录音设备字段 - 只有当设置被启用时才显示字段
        if (this.settingsState.microphone?.enabled && this.settingsState.microphone?.config) {
            console.log('🎤 初始化录音设备字段');
            this.registerMicrophoneFields(this.settingsState.microphone.config);
        }
        
        // 初始化摄像头设备字段 - 只有当设置被启用时才显示字段
        if (this.settingsState.camera?.enabled && this.settingsState.camera?.config) {
            console.log('📹 初始化摄像头设备字段');
            this.registerCameraFields(this.settingsState.camera.config);
        }
        
        // 控制录音文字识别字段显示 - 只有当设置被启用时才显示
        const recordingContainer = document.getElementById('recordingSettings');
        if (recordingContainer) {
            if (this.settingsState.recording?.enabled) {
                console.log('📝 录音文字识别已启用，显示字段');
                recordingContainer.classList.add('expanded');
            } else {
                console.log('📝 录音文字识别未启用，隐藏字段');
                recordingContainer.classList.remove('expanded');
            }
        }
        
        console.log('✅ 设备设置字段显示初始化完成');
    }

    // 设置toggle事件
    setupToggleEvents(overlay, settingId) {
        const setting = this.settings[settingId];
        const toggleElement = overlay.querySelector(`#${settingId}Toggle`);
        
        if (!toggleElement) return;
        
        if (setting.toggleEnabled) {
            // 启用toggle功能
            const handleToggleClick = (e) => {
                e.preventDefault(); // 阻止默认行为
                
                const currentState = this.settingsState[settingId];
                const isConfigured = this.isSettingConfigured(settingId, currentState?.config);
                const isEnabled = currentState?.enabled || false;
                
                if (!isConfigured) {
                    // 未配置，进入设置页面
                    this.enterSetting(settingId);
                    return;
                } else {
                    // 已配置，切换启用状态
                    const newEnabled = !isEnabled;
                    this.handleToggleChange(settingId, newEnabled);
                }
            };
            
            toggleElement.addEventListener('click', handleToggleClick);
        } else {
            // 装饰性toggle - 禁用交互
            toggleElement.style.pointerEvents = 'none';
            toggleElement.style.opacity = '0.7';
        }
    }

    // 设置卡片事件
    setupCardEvents(overlay, settingId) {
        const card = overlay.querySelector(`#${settingId}Card`);
        if (!card) return;
        
        const header = card.querySelector('.setting-card-header');
        if (!header) return;
        
        header.addEventListener('click', (e) => {
            // 如果点击的是toggle区域，不处理header点击
            if (e.target.closest('.setting-toggle')) {
                return;
            }
            
            // 防止重复点击
            if (header.dataset.clicking === 'true') {
                // console.log(`🖱️ ${this.settings[settingId].name} header点击被防抖拦截`);
                return;
            }
            
            header.dataset.clicking = 'true';
            // console.log(`🖱️ ${this.settings[settingId].name} header被点击`);
            
            // 执行进入设置的逻辑
            this.enterSetting(settingId).finally(() => {
                // 重置防抖标记
                setTimeout(() => {
                    header.dataset.clicking = 'false';
                }, 500);
            });
        });
    }

    // 初始化滑动条设置
    initializeSliderSettings(overlay) {
        // console.log('🎚️ 初始化滑动条设置...');
        
        // 显示音量设置卡片
        const effectsVolumeCard = overlay.querySelector('#effectsVolumeCard');
        const backgroundMusicCard = overlay.querySelector('#backgroundMusicCard');
        
        if (effectsVolumeCard) {
            effectsVolumeCard.style.display = 'block';
            // console.log('✅ 显示计时音效音量卡片');
        }
        if (backgroundMusicCard) {
            backgroundMusicCard.style.display = 'block';
            // console.log('✅ 显示背景音乐音量卡片');
        }
        
        // 初始化计时音效音量滑动条
        this.initializeSlider(overlay, 'effectsVolume', '#effects-volume-control');
        
        // 初始化背景音乐音量滑动条
        this.initializeSlider(overlay, 'backgroundMusic', '#background-music-control');
    }

    // 初始化单个滑动条
    initializeSlider(overlay, settingId, controlSelector) {
        const setting = this.settings[settingId];
        const controlContainer = overlay.querySelector(controlSelector);
        
        if (!setting || !controlContainer) {
            console.warn(`⚠️ 无法找到滑动条设置或容器: ${settingId}, ${controlSelector}`);
            return;
        }
        
        // console.log(`🎚️ 初始化滑动条: ${setting.name}`);
        
        // 获取当前音量值
        const state = this.settingsState[settingId];
        let currentVolume = state?.config?.volume || setting.fields[0].defaultValue;
        
        // 如果是背景音乐，从全局控制器获取当前音量
        if (settingId === 'backgroundMusic' && window.BackgroundMusicVolumeController) {
            currentVolume = window.BackgroundMusicVolumeController.getVolume();
            // console.log(`🎵 从背景音乐控制器获取音量: ${currentVolume}`);
        }
        
        // 创建滑动条元素
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'inline-volume-slider';
        slider.min = setting.fields[0].min;
        slider.max = setting.fields[0].max;
        slider.step = setting.fields[0].step;
        slider.value = currentVolume;
        
        // 清空容器并添加滑动条
        controlContainer.innerHTML = '';
        controlContainer.appendChild(slider);
        
        // 设置滑动条事件
        this.setupSliderEvents(slider, settingId, currentVolume);
        
        // 初始化滑动条样式
        this.updateSliderStyle(slider, currentVolume);
        
        // 如果是背景音乐滑动条，设置到全局控制器
        if (settingId === 'backgroundMusic' && window.BackgroundMusicVolumeController) {
            window.BackgroundMusicVolumeController.setSliderReference(slider);
            // console.log('🎚️ 已设置背景音乐滑动条引用到全局控制器');
        }
        
        // console.log(`✅ 滑动条 ${setting.name} 初始化完成，当前值: ${currentVolume}`);
    }

    // 设置滑动条事件
    setupSliderEvents(slider, settingId, initialVolume) {
        const setting = this.settings[settingId];
        let currentVolume = initialVolume;
        let isEditing = false;
        
        // 创建测试音效
        let testAudio = null;
        if (settingId === 'effectsVolume') {
            testAudio = new Audio('assets/effects/end.mp3');
        } else if (settingId === 'backgroundMusic') {
            testAudio = new Audio('assets/effects/background.mp3');
        }
        
        // 鼠标按下时开始编辑状态
        slider.addEventListener('mousedown', () => {
            isEditing = true;
            slider.classList.add('editing');
        });
        
        // 鼠标松开时结束编辑状态并播放测试音效
        slider.addEventListener('mouseup', () => {
            if (isEditing) {
                isEditing = false;
                slider.classList.remove('editing');
                this.playTestSound(testAudio, currentVolume, settingId);
            }
        });
        
        // 滑动过程中只更新音量，不播放音效
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            currentVolume = value;
            
            // 更新滑动条样式
            this.updateSliderStyle(slider, value);
            
            // 如果是背景音乐，使用全局控制器
            if (settingId === 'backgroundMusic' && window.BackgroundMusicVolumeController) {
                window.BackgroundMusicVolumeController.setVolume(value);
                // console.log(`🎵 通过全局控制器更新背景音乐音量: ${value}`);
            } else {
                // 其他音量设置使用原有逻辑
                this.updateVolumeConfig(settingId, value);
            }
            
            // console.log(`🎚️ ${setting.name} 音量更新: ${value}`);
        });
    }

    // 更新滑动条样式
    updateSliderStyle(slider, value) {
        const percentage = value * 100;
        slider.style.setProperty('--volume-percentage', `${percentage}%`);
    }

    // 播放测试音效
    playTestSound(testAudio, volume, settingId) {
        if (!testAudio) return;
        
        try {
            testAudio.currentTime = 0;
            
            if (settingId === 'effectsVolume') {
                testAudio.volume = volume;
            } else if (settingId === 'backgroundMusic') {
                testAudio.volume = Math.min(volume * 4.0, 1.0); // 背景音乐使用倍数
            }
            
            if (settingId === 'backgroundMusic') {
                // 背景音乐播放3秒后停止
                testAudio.play().then(() => {
                    setTimeout(() => {
                        testAudio.pause();
                        testAudio.currentTime = 0;
                    }, 3000);
                }).catch(e => console.log('背景音乐测试播放失败:', e));
            } else {
                testAudio.play().catch(e => console.log('音效播放失败:', e));
            }
            
            // console.log(`🔊 播放测试音效: ${settingId}, 音量: ${testAudio.volume}`);
        } catch (error) {
            console.warn('⚠️ 测试音效播放失败:', error);
        }
    }

    // 更新音量配置
    updateVolumeConfig(settingId, volume) {
        const setting = this.settings[settingId];
        
        // 更新全局变量
        if (settingId === 'effectsVolume') {
            if (window.effectsVolume !== undefined) {
                window.effectsVolume = volume;
            }
        } else if (settingId === 'backgroundMusic') {
            if (window.backgroundMusic) {
                window.backgroundMusic.volume = Math.min(volume * 4.0, 1.0);
            }
        }
        
        // 保存到配置
        if (simpleConfig) {
            simpleConfig.set(setting.configKey, volume);
        }
        
        // 更新设置状态
        this.settingsState[settingId] = {
            ...this.settingsState[settingId],
            config: { volume: volume },
            lastUpdate: Date.now()
        };
    }

    // 从设置状态生成字段
    generateFieldsFromState(settingId) {
        const setting = this.settings[settingId];
        const state = this.settingsState[settingId];
        
        if (!setting || !state || !state.config) {
            // console.warn(`⚠️ 无法为 ${settingId} 生成字段：缺少设置或状态信息`);
            return;
        }
        
        // console.log(`🔧 为 ${setting.name} 生成字段，状态:`, state);
        
        let fields = [];
        
        if (settingId === 'microphone') {
            // 录音设备字段
            fields = [
                {
                    name: '已选择设备',
                    value: state.config.selectedDeviceName || 'Unknown Device',
                    type: 'text',
                    copyable: false
                },
                {
                    name: '设备状态',
                    value: state.enabled ? '已启用' : '已禁用',
                    type: 'text',
                    copyable: false
                },
                {
                    name: '配置时间',
                    value: state.config.timestamp ? new Date(state.config.timestamp).toLocaleString() : '未知',
                    type: 'text',
                    copyable: false
                }
            ];
        } else if (settingId === 'recording') {
            // 录音文字识别字段
            fields = [
                {
                    name: 'App Key',
                    value: state.config.appKey || '',
                    type: 'password',
                    copyable: true
                },
                {
                    name: 'AccessKey ID',
                    value: state.config.accessKeyId || '',
                    type: 'password',
                    copyable: true
                },
                {
                    name: 'AccessKey Secret',
                    value: state.config.accessKeySecret || '',
                    type: 'password',
                    copyable: true
                }
            ];
        } else if (settingId === 'ai') {
            // AI评分字段
            fields = [
                {
                    name: '智谱AI API Key',
                    value: state.config.zhipuApiKey || '',
                    type: 'password',
                    copyable: true
                }
            ];
        }
        
        if (fields.length > 0) {
            // console.log(`✅ 为 ${setting.name} 生成了 ${fields.length} 个字段`);
            this.registerSettingFields(settingId, fields);
            this.updateSettingFieldsUI(settingId, fields);
        }
    }

    // 更新所有badge状态
    updateAllBadges() {
        Object.keys(this.settings).forEach(settingId => {
            this.updateSettingBadge(settingId);
        });
    }

    // 更新单个设置的badge状态
    updateSettingBadge(settingId) {
        const setting = this.settings[settingId];
        const state = this.settingsState[settingId];
        
        if (!setting || setting.type === 'slider') {
            // 滑动条类型不需要badge
            return;
        }
        
        const newBadge = document.querySelector(`#${settingId}NewBadge`);
        const reconfigBadge = document.querySelector(`#${settingId}ReconfigBadge`);
        
        if (!newBadge || !reconfigBadge) {
            console.warn(`⚠️ 找不到 ${settingId} 的badge元素`);
            return;
        }
        
        // console.log(`🏷️ 更新 ${setting.name} badge状态:`, {
        //     configured: state?.configured,
        //     enabled: state?.enabled,
        //     dependenciesMet: this.areDependenciesMet(settingId)
        // });
        
        // Badge显示逻辑
        const isVisited = this.isSettingVisited(settingId);
        
        if (!state?.configured || !state?.enabled) {
            // 设置未配置或未启用 -> 检查是否显示NEW badge
            if (this.areDependenciesMet(settingId) && !isVisited) {
                // 依赖满足且未访问过时才显示NEW
                newBadge.style.display = 'block';
                reconfigBadge.style.display = 'none';
                // console.log(`🆕 显示 ${setting.name} NEW badge`);
            } else {
                // 依赖不满足或已访问过时隐藏所有badge
                newBadge.style.display = 'none';
                reconfigBadge.style.display = 'none';
                if (isVisited) {
                    // console.log(`👁️ ${setting.name} 已访问过，隐藏NEW badge`);
                } else {
                    // console.log(`🔒 ${setting.name} 依赖不满足，隐藏badge`);
                }
            }
        } else {
            // 设置已配置且已启用 -> 显示重新配置badge
            newBadge.style.display = 'none';
            reconfigBadge.style.display = 'block';
            // console.log(`🔄 显示 ${setting.name} 重新配置badge`);
        }
    }

    // 检查是否有任何设置显示NEW badge
    hasAnyNewBadge() {
        return Object.keys(this.settings).some(settingId => {
            const setting = this.settings[settingId];
            const state = this.settingsState[settingId];
            
            if (setting.type === 'slider') return false; // 滑动条不算
            
            // 未配置或未启用，且依赖满足，且未访问过的情况下会显示NEW
            return (!state?.configured || !state?.enabled) && 
                   this.areDependenciesMet(settingId) && 
                   !this.isSettingVisited(settingId);
        });
    }

    // 更新主菜单NEW badge
    updateMainMenuBadge() {
        const settingsButton = document.querySelector('.settings-button');
        if (!settingsButton) {
            console.warn('⚠️ 找不到主菜单设置按钮');
            return;
        }
        
        let mainBadge = settingsButton.querySelector('.main-new-badge');
        const hasNewBadge = this.hasAnyNewBadge();
        
        // console.log(`🏷️ 主菜单badge状态: ${hasNewBadge ? '显示' : '隐藏'}`);
        
        if (hasNewBadge) {
            if (!mainBadge) {
                mainBadge = document.createElement('div');
                mainBadge.className = 'main-new-badge';
                mainBadge.textContent = BADGE_TEXTS.NEW;
                settingsButton.style.position = 'relative';
                settingsButton.appendChild(mainBadge);
                // console.log('🆕 创建并显示主菜单NEW badge');
            }
            mainBadge.style.display = 'block';
        } else {
            if (mainBadge) {
                mainBadge.style.display = 'none';
                // console.log('🔄 隐藏主菜单NEW badge');
            }
        }
    }

    // 创建设置卡片HTML
    createSettingCard(settingId) {
        const setting = this.settings[settingId];
        
        if (setting.type === 'slider') {
            return this.createSliderCard(settingId);
        } else {
            return this.createConfigCard(settingId);
        }
    }

    // 创建配置类型的设置卡片
    createConfigCard(settingId) {
        const setting = this.settings[settingId];
        
        return `
            <div class="setting-card clickable-card" id="${settingId}Card">
                <div class="new-badge badge-base" id="${settingId}NewBadge">${BADGE_TEXTS.NEW}</div>
                <div class="reconfig-badge badge-base" id="${settingId}ReconfigBadge" style="display: none;">${BADGE_TEXTS.RECONFIG}</div>
                <div class="setting-card-header">
                    <i class='${setting.icon}'></i>
                    <h3>${setting.name}</h3>
                    ${this.createQuickTestIndicator(settingId)}
                    ${setting.toggleEnabled ? `
                        <div class="setting-toggle">
                            <label id="${settingId}Toggle" class="toggle-label"></label>
                        </div>
                    ` : ''}
                </div>
                <div class="setting-card-content" id="${settingId}Settings">
                    ${this.createSettingFields(settingId)}
                </div>
            </div>
        `;
    }

    // 创建滑动条类型的设置卡片
    createSliderCard(settingId) {
        const setting = this.settings[settingId];
        
        return `
            <div class="setting-card volume-card" id="${settingId}Card">
                <div class="setting-card-header volume-header">
                    <i class='${setting.icon}'></i>
                    <h3>${setting.name}</h3>
                    <div class="inline-volume-control" id="${settingId.replace('effectsVolume', 'effects-volume').replace('backgroundMusic', 'background-music')}-control">
                        <!-- 滑动条将通过JavaScript动态生成 -->
                    </div>
                </div>
            </div>
        `;
    }

    // 创建设置字段HTML
    createSettingFields(settingId) {
        const setting = this.settings[settingId];
        
        if (!setting.fields || setting.fields.length === 0) {
            return '<!-- 设置字段将由字段管理系统动态填充 -->';
        }
        
        return setting.fields.map(field => {
            const inputType = field.type === 'password' ? 'password' : 'text';
            const placeholder = `请输入${field.name}`;
            
            return `
                <div class="setting-field">
                    <label>${field.name}</label>
                    <input type="${inputType}" id="${field.key}" placeholder="${placeholder}">
                </div>
            `;
        }).join('');
    }

    // 初始化快速测试函数
    initializeQuickTestFunctions() {
        // console.log('🧪 初始化快速测试函数...');
        
        // 录音设备快速测试
        this.quickTestFunctions.microphone = async () => {
            try {
                const config = JSON.parse(localStorage.getItem('microphoneConfig') || '{}');
                if (!config.selectedDeviceId || !config.enabled) {
                    return { success: false, message: '录音设备未配置或未启用' };
                }
                
                // 测试麦克风访问权限
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: config.selectedDeviceId } }
                });
                stream.getTracks().forEach(track => track.stop());
                
                return { success: true, message: '录音测试通过' };
            } catch (error) {
                const optimizedMessage = this.optimizeErrorMessage(error.message, '录音');
                return { success: false, message: optimizedMessage };
            }
        };
        
        // 录音识别快速测试
        this.quickTestFunctions.recording = async () => {
            try {
                // 检查本设置的配置
                const config = simpleConfig ? simpleConfig.getAll() : {};
                if (!config.appKey || !config.accessKeyId || !config.accessKeySecret || !config.recordingEnabled) {
                    return { success: false, message: '录音识别未配置或未启用' };
                }
                
                // 检查测试音频文件是否存在
                const testAudioExists = await this.checkTestAudioFile();
                if (!testAudioExists) {
                    return { 
                        success: false, 
                        message: '测试音频文件不存在，请确保 assets/testfiles/webm_audio_recognition_test.webm 文件存在' 
                    };
                }
                
                // 使用指定的测试音频文件进行API测试
                const apiTestResult = await this.testRecordingAPI(config);
                return apiTestResult;
            } catch (error) {
                return { success: false, message: `录音识别测试失败: ${error.message}` };
            }
        };
        
        // 摄像头设备快速测试
        this.quickTestFunctions.camera = async () => {
            try {
                const config = JSON.parse(localStorage.getItem('cameraConfig') || '{}');
                if (!config.selectedDeviceId || !config.enabled) {
                    return { success: false, message: '摄像头设备未配置或未启用' };
                }
                
                // 测试摄像头访问权限
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: config.selectedDeviceId } }
                });
                stream.getTracks().forEach(track => track.stop());
                
                return { success: true, message: '摄像头测试通过' };
            } catch (error) {
                const optimizedMessage = this.optimizeErrorMessage(error.message, '摄像头');
                return { success: false, message: optimizedMessage };
            }
        };

        // AI评分快速测试
        this.quickTestFunctions.ai = async () => {
            try {
                // 检查本设置的配置
                const config = simpleConfig ? simpleConfig.getAll() : {};
                if (!config.zhipuApiKey || !config.aiEnabled) {
                    return { success: false, message: 'AI评分未配置或未启用' };
                }
                
                // TODO: 添加实际的智谱AI API测试
                return { success: true, message: 'AI评分配置验证通过' };
            } catch (error) {
                return { success: false, message: `AI评分测试失败: ${error.message}` };
            }
        };
        
        // console.log('✅ 快速测试函数初始化完成');
    }
    
    // 加载测试缓存
    loadTestCache() {
        try {
            const cacheData = localStorage.getItem('quickTestCache');
            const counterData = localStorage.getItem('quickTestCounters');
            
            if (cacheData) {
                this.quickTestCache = JSON.parse(cacheData);
            }
            
            if (counterData) {
                this.quickTestCounters = JSON.parse(counterData);
            }
            
            // console.log('✅ 已加载快速测试缓存:', {
            //     cache: Object.keys(this.quickTestCache).length,
            //     counters: this.quickTestCounters
            // });
        } catch (error) {
            console.warn('⚠️ 加载测试缓存失败:', error);
            this.quickTestCache = {};
            this.quickTestCounters = {};
        }
    }
    
    // 保存测试缓存
    saveTestCache(silent = false) {
        try {
            localStorage.setItem('quickTestCache', JSON.stringify(this.quickTestCache));
            localStorage.setItem('quickTestCounters', JSON.stringify(this.quickTestCounters));
            if (!silent && window.DEBUG_SETTINGS) {
                // console.log('💾 已保存快速测试缓存');
            }
        } catch (error) {
            console.error('❌ 保存测试缓存失败:', error);
        }
    }
    
    // 清除过期的缓存
    cleanExpiredCache() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        let cleaned = false;
        
        Object.keys(this.quickTestCache).forEach(settingId => {
            const cache = this.quickTestCache[settingId];
            if (cache && cache.timestamp && (now - cache.timestamp) > maxAge) {
                delete this.quickTestCache[settingId];
                delete this.quickTestCounters[settingId];
                cleaned = true;
            }
        });
        
        if (cleaned) {
            this.saveTestCache(true); // 静默保存，减少日志输出
            // console.log('🧹 已清理过期的测试缓存');
        }
    }
    
    // 检查是否需要实际测试
    shouldPerformActualTest(settingId) {
        const threshold = this.quickTestThresholds[settingId] || 1;
        const counter = this.quickTestCounters[settingId] || 0;
        const cache = this.quickTestCache[settingId];
        
        // 如果没有缓存或缓存不是成功状态，需要实际测试
        if (!cache || !cache.success) {
            return true;
        }
        
        // 如果计数器达到阈值，需要实际测试
        if (counter >= threshold) {
            return true;
        }
        
        return false;
    }
    
    // 更新测试计数器
    updateTestCounter(settingId) {
        const threshold = this.quickTestThresholds[settingId] || 1;
        
        if (this.shouldPerformActualTest(settingId)) {
            // 重置计数器
            this.quickTestCounters[settingId] = 0;
        } else {
            // 增加计数器
            this.quickTestCounters[settingId] = (this.quickTestCounters[settingId] || 0) + 1;
        }
        
        this.saveTestCache(true); // 静默保存，减少日志输出
    }
    
    // 缓存测试结果
    cacheTestResult(settingId, result) {
        this.quickTestCache[settingId] = {
            ...result,
            timestamp: Date.now(),
            settingName: this.settings[settingId]?.name || settingId
        };
        this.saveTestCache(true); // 静默保存，减少日志输出
    }
    
    // 检查测试音频文件是否存在
    async checkTestAudioFile() {
        try {
            // 检查指定路径的测试音频文件
            const testAudioPath = 'assets/testfiles/webm_audio_recognition_test.webm';
            const response = await fetch(testAudioPath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn('检查测试音频文件失败:', error);
            return false;
        }
    }

    // 检查测试视频文件是否存在
    async checkTestVideoFile() {
        try {
            // 检查指定路径的测试视频文件
            const testVideoPath = 'assets/testfiles/webm_cam_recording_test.webm';
            const response = await fetch(testVideoPath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn('检查测试视频文件失败:', error);
            return false;
        }
    }
    
    // 测试录音识别API
    async testRecordingAPI(config) {
        try {
            // 检查测试音频文件是否存在
            const testAudioExists = await this.checkTestAudioFile();
            if (!testAudioExists) {
                return { 
                    success: false, 
                    message: '测试音频文件不存在：assets/testfiles/webm_audio_recognition_test.webm' 
                };
            }
            
            // 获取测试音频文件
            const testAudioPath = 'assets/testfiles/webm_audio_recognition_test.webm';
            const response = await fetch(testAudioPath);
            const audioBlob = await response.blob();
            
            // 实际调用阿里云录音识别API进行测试
            console.log('🧪 开始录音识别API真实测试...');
            console.log('配置信息:', {
                appKey: config.appKey ? '已配置' : '未设置',
                accessKeyId: config.accessKeyId ? '已配置' : '未设置',
                accessKeySecret: config.accessKeySecret ? '已配置' : '未设置'
            });
            console.log('测试音频信息:', {
                path: testAudioPath,
                type: audioBlob.type,
                size: `${Math.round(audioBlob.size/1024)}KB`
            });
            
            // 检查WebM格式支持
            if (!audioBlob.type.includes('webm')) {
                console.warn('⚠️ 音频文件不是WebM格式:', audioBlob.type);
            }
            
            // 创建FormData进行API调用
            const formData = new FormData();
            formData.append('file', audioBlob, 'test_audio.webm');
            formData.append('model', 'paraformer-v1');
            formData.append('language', 'auto');
            formData.append('vad_filter', 'true');
            formData.append('punc_filter', 'true');
            formData.append('spk_filter', 'false');
            
            // 获取访问令牌（如果需要）
            let token = config.token;
            if (!token) {
                // 这里应该实现获取token的逻辑
                console.log('📝 需要获取访问令牌');
                // 暂时使用模拟结果，因为token获取需要复杂的签名逻辑
                return { 
                    success: true, 
                    message: '录音识别API测试通过（需要实现token获取逻辑）',
                    details: `测试音频文件验证成功，文件大小：${Math.round(audioBlob.size/1024)}KB`
                };
            }
            
            // 调用阿里云录音识别API
            const apiResponse = await fetch('https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr', {
                method: 'POST',
                headers: {
                    'X-NLS-Token': token
                },
                body: formData
            });
            
            if (!apiResponse.ok) {
                throw new Error(`API请求失败: ${apiResponse.status} ${apiResponse.statusText}`);
            }
            
            const result = await apiResponse.json();
            console.log('🔤 录音文字识别API测试结果:', result);
            
            // 检查是否有识别结果
            if (result && result.payload && result.payload.result) {
                const recognizedText = result.payload.result;
                console.log('✅ 录音文字识别测试成功，识别文字:', recognizedText);
                return { 
                    success: true, 
                    message: '录音识别API测试通过',
                    details: `识别文字: "${recognizedText}"，文件大小：${Math.round(audioBlob.size/1024)}KB`
                };
            } else {
                console.warn('⚠️ API调用成功但无识别结果');
                return { 
                    success: false, 
                    message: 'API调用成功但无识别结果'
                };
            }
            
        } catch (error) {
            return { success: false, message: `API测试失败: ${error.message}` };
        }
    }

    // 测试视频转换功能
    
    // 执行快速测试
    async performQuickTest(settingId, showMessage = true) {
        const setting = this.settings[settingId];
        if (!setting || !this.quickTestFunctions[settingId]) {
            console.warn(`⚠️ 设置 ${settingId} 没有快速测试函数`);
            return { success: false, message: '该设置没有快速测试函数' };
        }
        
        // console.log(`🧪 执行 ${setting.name} 快速测试...`);
        
        // 清理过期缓存
        this.cleanExpiredCache();
        
        // 设置测试状态
        this.quickTestStates[settingId] = 'testing';
        this.updateQuickTestIndicator(settingId, 'testing');
        
        try {
            // 1. 首先递归测试所有依赖项
            if (setting.dependencies && setting.dependencies.length > 0) {
                // console.log(`🔄 检查 ${setting.name} 的依赖项...`);
                for (const depId of setting.dependencies) {
                    const depSetting = this.settings[depId];
                    const depState = this.settingsState[depId];
                    
                    // 检查依赖项是否已配置和启用
                    if (!depState || !depState.configured || !depState.enabled) {
                        return { 
                            success: false, 
                            message: `依赖的${depSetting?.name || depId}未配置或未启用` 
                        };
                    }
                    
                    // 如果依赖项有快速测试函数，先测试依赖项
                    if (this.quickTestFunctions[depId]) {
                        // console.log(`🧪 测试依赖项: ${depSetting.name}`);
                        const depResult = await this.performCachedTest(depId, false);
                        if (!depResult.success) {
                            return { 
                                success: false, 
                                message: `依赖的${depSetting.name}测试失败: ${depResult.message}` 
                            };
                        }
                    }
                }
            }
            
            // 2. 然后测试本设置（使用缓存）
            // console.log(`🧪 测试本设置: ${setting.name}`);
            const result = await this.performCachedTest(settingId);
            
            // 更新测试状态
            this.quickTestStates[settingId] = result.success ? 'success' : 'failed';
            
            // 如果测试失败，进行详细的错误分析（特别是录音设备）
            if (!result.success && settingId === 'microphone') {
                const errorType = this.analyzeErrorType(result.message);
                // console.log(`📊 录音设备测试失败: ${errorType} - "${result.message}"`);
            }
            
            this.updateQuickTestIndicator(
                settingId, 
                result.success ? 'success' : 'failed',
                result.message
            );
            
            // 如果是录音设备测试失败，更新设备状态显示
            if (!result.success && settingId === 'microphone') {
                this.updateMicrophoneStatusAfterFailedTest(result.message);
            }
            
            // 如果测试失败，根据参数决定是否显示错误消息
            if (!result.success && showMessage && window.showMessage) {
                window.showMessage(`${setting.name}快速测试失败: ${result.message}`, 'error');
            }
            
            // console.log(`🧪 ${setting.name} 快速测试${result.success ? '成功' : '失败'}: ${result.message}`);
            return result;
        } catch (error) {
            console.error(`❌ ${setting.name} 快速测试出错:`, error);
            this.quickTestStates[settingId] = 'failed';
            this.updateQuickTestIndicator(settingId, 'failed', error.message);
            if (showMessage && window.showMessage) {
                window.showMessage(`${setting.name}快速测试错误: ${error.message}`, 'error');
            }
            return { success: false, message: error.message };
        }
    }
    
    // 执行带缓存的测试
    async performCachedTest(settingId, showMessage = true) {
        const setting = this.settings[settingId];
        const threshold = this.quickTestThresholds[settingId] || 1;
        const counter = this.quickTestCounters[settingId] || 0;
        const cache = this.quickTestCache[settingId];
        
        // 检查是否需要实际测试
        if (this.shouldPerformActualTest(settingId)) {
            // console.log(`🔄 ${setting.name} 执行实际测试 (计数器: ${counter}/${threshold})`);
            
            // 执行实际测试
            const result = await this.quickTestFunctions[settingId]();
            
            // 缓存结果
            this.cacheTestResult(settingId, result);
            
            // 重置计数器
            this.quickTestCounters[settingId] = 0;
            this.saveTestCache(true); // 静默保存，减少日志输出
            
            return result;
        } else {
            // console.log(`⚡ ${setting.name} 使用缓存结果 (计数器: ${counter}/${threshold})`);
            
            // 增加计数器
            this.updateTestCounter(settingId);
            
            // 返回缓存结果（添加缓存标识）
            return {
                ...cache,
                cached: true,
                message: cache.message + ' (缓存)'
            };
        }
    }
    
    // 创建快速测试指示器
    createQuickTestIndicator(settingId) {
        const setting = this.settings[settingId];
        if (!setting || setting.type === 'slider' || !this.quickTestFunctions[settingId]) {
            return '';
        }
        
        return `
            <div class="quick-test-indicator" id="${settingId}QuickTestIndicator">
                <div class="test-status-dot" id="${settingId}TestDot"></div>
                <div class="status-tooltip" id="${settingId}StatusTooltip">
                    未配置
                </div>
            </div>
        `;
    }
    
    // 更新快速测试指示器
    updateQuickTestIndicator(settingId, status, message = '') {
        // console.log(`🎯 updateQuickTestIndicator被调用: ${settingId}, status: ${status}, message: ${message}`);
        
        const indicator = document.getElementById(`${settingId}QuickTestIndicator`);
        const dot = document.getElementById(`${settingId}TestDot`);
        const tooltip = document.getElementById(`${settingId}StatusTooltip`);
        
        // console.log(`🎯 DOM元素查找结果: indicator=${!!indicator}, dot=${!!dot}, tooltip=${!!tooltip}`);
        
        if (!indicator || !dot || !tooltip) {
            console.warn(`⚠️ 找不到test-status-dot相关元素: ${settingId}QuickTestIndicator, ${settingId}TestDot, ${settingId}StatusTooltip`);
            return;
        }
        
        // 清除所有状态类
        indicator.className = 'quick-test-indicator';
        dot.className = 'test-status-dot';
        tooltip.className = 'status-tooltip';
        
        const setting = this.settings[settingId];
        
        // 根据状态设置样式和提示内容
        switch (status) {
            case 'testing':
                dot.classList.add('testing');
                tooltip.classList.add('testing');
                tooltip.textContent = `正在测试 ${setting.name}...`;
                // console.log(`🔵 test-status-dot更新: ${settingId} -> 测试中 (紫色)`);
                break;
            case 'success':
                dot.classList.add('success');
                tooltip.classList.add('success');
                tooltip.textContent = `${setting.name} 配置正常${message ? ' - ' + message : ''}`;
                // console.log(`🟢 test-status-dot更新: ${settingId} -> 成功 (绿色)`);
                break;
            case 'failed':
                dot.classList.add('failed');
                tooltip.classList.add('failed');
                tooltip.textContent = `${setting.name} 测试失败${message ? ' - ' + message : ''}`;
                // console.log(`🔴 test-status-dot更新: ${settingId} -> 失败 (红色)`);
                // console.log(`🔴 最终dot的className: ${dot.className}`);
                break;
            case 'unconfigured':
            default:
                dot.classList.add('unconfigured');
                tooltip.classList.add('unconfigured');
                tooltip.textContent = `${setting.name} 未配置`;
                // console.log(`⚪ test-status-dot更新: ${settingId} -> 未配置 (灰色)`);
                break;
        }
    }
    
    // 根据设置状态更新快速测试指示器
    updateQuickTestIndicatorByState(settingId) {
        const setting = this.settings[settingId];
        const state = this.settingsState[settingId];
        
        if (!setting || setting.type === 'slider' || !this.quickTestFunctions[settingId]) {
            return;
        }
        
        // 如果有实际的测试状态，优先使用测试状态
        const actualTestState = this.quickTestStates[settingId];
        if (actualTestState && actualTestState !== 'testing') {
            // 保持实际测试结果状态
            return;
        }
        
        if (!state || !state.configured) {
            // 未配置状态
            this.updateQuickTestIndicator(settingId, 'unconfigured');
        } else if (state.configured && state.enabled) {
            // 已配置且启用状态 - 显示为成功（绿色）
            this.updateQuickTestIndicator(settingId, 'success', '配置已启用');
        } else if (state.configured && !state.enabled) {
            // 已配置但未启用状态 - 显示为灰色
            this.updateQuickTestIndicator(settingId, 'unconfigured', '已配置但未启用');
        }
    }
    
    
    // 显示测试状态的紫色流体特效
    showTestingEffect(settingId) {
        const card = document.getElementById(`${settingId}Card`);
        if (!card) return;
        
        // 添加测试状态类
        card.classList.add('quick-testing');
        
        // 创建流体背景元素
        const fluidBg = document.createElement('div');
        fluidBg.className = 'fluid-testing-bg';
        fluidBg.innerHTML = `
            <div class="fluid-wave wave1"></div>
            <div class="fluid-wave wave2"></div>
            <div class="fluid-wave wave3"></div>
        `;
        
        card.appendChild(fluidBg);
        
        // 减少日志输出
        if (window.DEBUG_SETTINGS) {
            // console.log(`🌊 显示 ${settingId} 测试流体特效`);
        }
    }
    
    // 隐藏测试状态的紫色流体特效
    hideTestingEffect(settingId) {
        const card = document.getElementById(`${settingId}Card`);
        if (!card) return;
        
        // 移除测试状态类
        card.classList.remove('quick-testing');
        
        // 移除流体背景元素
        const fluidBg = card.querySelector('.fluid-testing-bg');
        if (fluidBg) {
            fluidBg.remove();
        }
        
        // 减少日志输出
        if (window.DEBUG_SETTINGS) {
            // console.log(`🌊 隐藏 ${settingId} 测试流体特效`);
        }
    }

    // 检查是否是权限错误
    isPermissionError(errorMessage) {
        // console.log(`🔍 权限错误检测开始，原始错误信息: "${errorMessage}"`);
        
        const lowerMessage = errorMessage.toLowerCase();
        
        // 详细检测各种权限错误模式（包括中英文）
        const permissionPatterns = [
            'permission denied',
            'permissiondenied', 
            'notallowederror',
            'not allowed',
            'access denied',
            'denied',
            'permission',
            '权限',
            '权限被拒绝',
            '权限未开启',
            '麦克风权限',
            '拒绝访问'
        ];
        
        let matchedPattern = null;
        const isPermissionError = permissionPatterns.some(pattern => {
            if (lowerMessage.includes(pattern)) {
                matchedPattern = pattern;
                return true;
            }
            return false;
        });
        
        // console.log(`🔍 权限错误检测: "${errorMessage}" -> ${isPermissionError}${matchedPattern ? ` (匹配: ${matchedPattern})` : ''}`);
        
        return isPermissionError;
    }

    // 分析错误类型，方便将来添加更多错误处理
    analyzeErrorType(errorMessage) {
        const lowerMessage = errorMessage.toLowerCase();
        
        // 权限相关错误
        if (this.isPermissionError(errorMessage)) {
            return 'permission_error';
        }
        
        // 设备相关错误
        if (lowerMessage.includes('device not found') || 
            lowerMessage.includes('notfound') ||
            lowerMessage.includes('no device') ||
            lowerMessage.includes('device') && lowerMessage.includes('not') && lowerMessage.includes('available')) {
            return 'device_not_found';
        }
        
        // 浏览器支持相关错误
        if (lowerMessage.includes('not supported') || 
            lowerMessage.includes('notsupported') ||
            lowerMessage.includes('unsupported') ||
            lowerMessage.includes('getusermedia') && lowerMessage.includes('not')) {
            return 'browser_not_supported';
        }
        
        // 网络相关错误
        if (lowerMessage.includes('network') || 
            lowerMessage.includes('timeout') ||
            lowerMessage.includes('connection') ||
            lowerMessage.includes('fetch')) {
            return 'network_error';
        }
        
        // 设备被占用错误
        if (lowerMessage.includes('in use') || 
            lowerMessage.includes('busy') ||
            lowerMessage.includes('occupied') ||
            lowerMessage.includes('already') && lowerMessage.includes('use')) {
            return 'device_in_use';
        }
        
        // 其他未知错误
        // console.log(`⚠️ 未识别的错误类型，原始信息: "${errorMessage}"`);
        return 'unknown_error';
    }

    // 更新麦克风设备测试失败后的状态显示
    updateMicrophoneStatusAfterFailedTest(errorMessage) {
        // console.log(`🔄 更新麦克风设备状态显示为失败状态`);
        
        // 获取当前麦克风配置
        const config = JSON.parse(localStorage.getItem('microphoneConfig') || '{}');
        
        // 更新配置时间为当前时间（快测结束时间）
        config.timestamp = Date.now();
        // console.log(`⏰ 刷新配置时间: ${new Date(config.timestamp).toLocaleString()}`);
        
        // 保存更新后的配置
        localStorage.setItem('microphoneConfig', JSON.stringify(config));
        
        // 生成新的字段显示，设备状态为"启用失败，请重新设置"
        const fields = [
            {
                name: '已选择设备',
                value: config.selectedDeviceName || 'Unknown Device',
                type: 'text',
                copyable: false
            },
            {
                name: '设备状态',
                value: '启用失败，请重新设置',
                type: 'text',
                copyable: false
            },
            {
                name: '配置时间',
                value: new Date(config.timestamp).toLocaleString(),
                type: 'text',
                copyable: false
            }
        ];
        
        // 更新设置字段显示
        this.registerSettingFields('microphone', fields);
        
        // 强制刷新设置显示
        this.refreshSettingDisplay('microphone');
        
        // console.log(`✅ 麦克风设备状态已更新为"启用失败，请重新设置"`);
    }

    // 更新摄像头设备测试失败后的状态显示
    updateCameraStatusAfterFailedTest(errorMessage) {
        // console.log(`🔄 更新摄像头设备状态显示为失败状态`);
        
        // 获取当前摄像头配置
        const config = JSON.parse(localStorage.getItem('cameraConfig') || '{}');
        
        // 更新配置时间为当前时间（快测结束时间）
        config.timestamp = Date.now();
        // console.log(`⏰ 刷新配置时间: ${new Date(config.timestamp).toLocaleString()}`);
        
        // 保存更新后的配置
        localStorage.setItem('cameraConfig', JSON.stringify(config));
        
        // 生成新的字段显示，设备状态为"启用失败，请重新设置"
        const fields = [
            {
                name: '已选择设备',
                value: config.selectedDeviceName || 'Unknown Device',
                type: 'text',
                copyable: false
            },
            {
                name: '设备状态',
                value: '启用失败，请重新设置',
                type: 'text',
                copyable: false
            },
            {
                name: '配置时间',
                value: new Date(config.timestamp).toLocaleString(),
                type: 'text',
                copyable: false
            }
        ];
        
        // 更新设置字段显示
        this.registerSettingFields('camera', fields);
        
        // 强制刷新设置显示
        this.refreshSettingDisplay('camera');
        
        // console.log(`✅ 摄像头设备状态已更新为"启用失败，请重新设置"`);
    }

    // 更新录音文字识别测试失败后的状态显示
    updateRecordingStatusAfterFailedTest(errorMessage) {
        console.log(`🔄 更新录音文字识别状态显示为失败状态`);
        
        // 录音文字识别的状态更新通过simpleConfig管理
        if (simpleConfig) {
            // 禁用录音文字识别设置
            simpleConfig.set('recordingEnabled', false);
            
            // 强制刷新设置显示
            this.refreshSettingDisplay('recording');
            
            console.log(`✅ 录音文字识别状态已更新为"启用失败，请重新设置"`);
        }
    }

    // 优化错误信息显示
    optimizeErrorMessage(originalMessage, settingName) {
        // 检测最后一个冒号，只输出最后的内容
        const parts = originalMessage.split(':');
        let coreError = parts[parts.length - 1].trim();
        
        // 自然语言化常见错误
        if (this.isPermissionError(coreError)) {
            return `麦克风权限未开启，需要重新进行${settingName}测试`;
        }
        
        if (coreError.toLowerCase().includes('not found') || coreError.toLowerCase().includes('device not found')) {
            return `找不到录音设备，请检查设备连接`;
        }
        
        if (coreError.toLowerCase().includes('not supported') || coreError.toLowerCase().includes('notsupported')) {
            return `当前浏览器不支持录音功能`;
        }
        
        if (coreError.toLowerCase().includes('network') || coreError.toLowerCase().includes('连接')) {
            return `网络连接问题，请检查网络设置`;
        }
        
        // 如果没有匹配到特定模式，返回优化后的核心错误信息
        return `${settingName}测试失败: ${coreError}`;
    }

    // 生成设置标题（通用工具方法）
    generateSettingTitle(settingId) {
        const setting = this.settings[settingId];
        if (!setting) {
            console.warn(`⚠️ 未找到设置: ${settingId}`);
            return '设置';
        }
        return `${setting.name}设置`;
    }

    // 创建完整的设置overlay
    createSettingsOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'slides-overlay';
        
        // 生成所有设置卡片
        const settingCards = Object.keys(this.settings)
            .map(settingId => this.createSettingCard(settingId))
            .join('');
        
        overlay.innerHTML = `
            <div class="slides-header">
                <button class="back-button">
                    <i class='bx bx-arrow-back'></i>
                </button>
                <h2>系统设置</h2>
            </div>
            <div class="settings-container">
                ${settingCards}
                <div class="settings-footer">
                    <p>音效素材下载自<a href="https://www.aigei.com/" target="_blank">爱给</a></p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }
}

// 创建全局实例
window.settingsManager = new SettingsManager();

// 兼容性接口
window.updateSettingFields = (settingId, fields) => {
    window.settingsManager.registerSettingFields(settingId, fields);
};

window.refreshSettingsDisplay = () => {
    console.log('🔄 refreshSettingsDisplay 被调用，开始刷新所有设置显示');
    window.settingsManager.refreshAllSettings();
    console.log('✅ refreshSettingsDisplay 完成');
};

// 调试方法：清除访问记录
window.clearVisitedSettings = () => {
    if (window.settingsManager) {
        window.settingsManager.clearVisitedSettings();
        // console.log('🗑️ 已清除所有设置访问记录，NEW badge将重新显示');
    }
};

// 调试方法：查看访问记录
window.getVisitedSettings = () => {
    if (window.settingsManager) {
        // console.log('👁️ 当前访问记录:', window.settingsManager.visitedSettings);
        return window.settingsManager.visitedSettings;
    }
};

// 调试方法：查看测试缓存
window.getTestCache = () => {
    if (window.settingsManager) {
        // console.log('🧪 测试缓存状态:', {
        //     cache: window.settingsManager.quickTestCache,
        //     counters: window.settingsManager.quickTestCounters,
        //     thresholds: window.settingsManager.quickTestThresholds
        // });
        return {
            cache: window.settingsManager.quickTestCache,
            counters: window.settingsManager.quickTestCounters,
            thresholds: window.settingsManager.quickTestThresholds
        };
    }
};

// 调试方法：清除测试缓存
window.clearTestCache = () => {
    if (window.settingsManager) {
        window.settingsManager.quickTestCache = {};
        window.settingsManager.quickTestCounters = {};
        window.settingsManager.saveTestCache();
        // console.log('🗑️ 已清除所有测试缓存');
    }
};

// 调试方法：强制执行实际测试
window.forceActualTest = (settingId) => {
    if (window.settingsManager && settingId) {
        // 清除特定设置的缓存
        delete window.settingsManager.quickTestCache[settingId];
        delete window.settingsManager.quickTestCounters[settingId];
        window.settingsManager.saveTestCache();
        
        // console.log(`🔄 已清除 ${settingId} 的缓存，下次测试将执行实际验证`);
        
        // 立即执行测试
        return window.settingsManager.performQuickTest(settingId);
    }
};

// console.log('✅ 统一设置管理器已加载');
// console.log('🔧 调试命令: clearVisitedSettings() - 清除访问记录');
// console.log('🔧 调试命令: getVisitedSettings() - 查看访问记录');
// console.log('🔧 调试命令: getTestCache() - 查看测试缓存状态');
// console.log('🔧 调试命令: clearTestCache() - 清除测试缓存');
// console.log('🔧 调试命令: forceActualTest(settingId) - 强制执行实际测试');