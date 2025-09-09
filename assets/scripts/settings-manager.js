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
                name: '录音设备',
                icon: 'bx-devices',
                type: 'setup', // 'setup' | 'config'
                dependencies: [], // 依赖的其他设置
                dependents: ['recording'], // 依赖此设置的其他设置
                managerClass: 'MicrophoneSetupManager',
                configKey: 'microphoneConfig',
                toggleEnabled: true,
                fields: [] // 动态字段，由管理器注册
            },
            recording: {
                id: 'recording',
                name: '录音文字识别',
                icon: 'bx-microphone',
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
                icon: 'bx-brain',
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
                icon: 'bx-volume-full',
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
                icon: 'bx-music',
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
        
        // 初始化
        this.loadAllSettings();
        
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

        // 从不同来源加载配置
        if (configKey === 'microphoneConfig') {
            const stored = localStorage.getItem('microphoneConfig');
            config = stored ? JSON.parse(stored) : null;
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
        }

        // 更新设置状态
        this.settingsState[settingId] = {
            configured: this.isSettingConfigured(settingId, config),
            enabled: this.isSettingEnabled(settingId, config),
            config: config,
            lastUpdate: Date.now()
        };

        console.log(`✅ 已加载设置状态 ${settingId}:`, this.settingsState[settingId]);
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
            console.log('💾 访问记录已保存:', this.visitedSettings);
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
        console.log(`✅ 标记 ${setting.name} 为已访问`);
        
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
        console.log('🗑️ 已清除所有访问记录');
        
        // 刷新所有badge
        this.updateAllBadges();
        this.updateMainMenuBadge();
    }

    // 检查设置是否已配置
    isSettingConfigured(settingId, config) {
        const setting = this.settings[settingId];
        
        if (settingId === 'microphone') {
            return !!(config && config.selectedDeviceId);
        } else if (settingId === 'recording') {
            return !!(config && config.appKey && config.accessKeyId && config.accessKeySecret);
        } else if (settingId === 'ai') {
            return !!(config && config.zhipuApiKey);
        } else if (settingId === 'effectsVolume' || settingId === 'backgroundMusic') {
            // 滑动条类型的设置总是已配置的（有默认值）
            return true;
        }
        
        return false;
    }

    // 检查设置是否启用
    isSettingEnabled(settingId, config) {
        const setting = this.settings[settingId];
        
        if (settingId === 'microphone') {
            return !!(config && config.enabled);
        } else if (settingId === 'recording') {
            // 录音设置只有在已配置、已启用且已测试完成时才显示为启用
            const isConfigured = this.isSettingConfigured(settingId, config);
            const isEnabled = !!(config && config.recordingEnabled);
            const isTested = simpleConfig ? simpleConfig.isSettingTested('recording') : false;
            
            return isConfigured && isEnabled && isTested;
        } else if (settingId === 'ai') {
            // AI设置只有在已配置、已启用且已测试完成时才显示为启用
            const isConfigured = this.isSettingConfigured(settingId, config);
            const isEnabled = !!(config && config.aiEnabled);
            const isTested = simpleConfig ? simpleConfig.isSettingTested('ai') : false;
            
            return isConfigured && isEnabled && isTested;
        } else if (settingId === 'effectsVolume' || settingId === 'backgroundMusic') {
            // 滑动条类型的设置总是启用的
            return true;
        }
        
        // 其他设置根据配置情况自动启用
        return this.isSettingConfigured(settingId, config);
    }

    // 检查设置依赖是否满足（递归检查传递性依赖）
    areDependenciesMet(settingId, checkedIds = new Set()) {
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
        this.registeredFields[settingId] = fields;
        console.log(`✅ 已注册 ${settingId} 设置字段:`, fields);
        
        // 立即更新UI显示
        this.updateSettingFieldsUI(settingId, fields);
    }

    // 更新设置字段UI显示
    updateSettingFieldsUI(settingId, fields) {
        const contentContainer = document.getElementById(`${settingId}Settings`);
        if (!contentContainer) {
            console.warn(`未找到设置容器: ${settingId}Settings`);
            return;
        }
        
        // 清空现有内容
        contentContainer.innerHTML = '';
        
        // 生成字段HTML
        fields.forEach(field => {
            const fieldHtml = this.generateFieldHtml(field);
            contentContainer.insertAdjacentHTML('beforeend', fieldHtml);
        });
        
        // console.log(`✅ 已更新 ${settingId} 设置UI显示`);
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
            valueHtml = `
                <div class="field-value text-field" id="${fieldId}">
                    <span class="value-text">${field.value}</span>
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
                console.log('✅ 已复制到剪贴板:', textToCopy);
                
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
    handleToggleChange(settingId, enabled) {
        console.log(`========== 设置Toggle状态改变: ${settingId} ==========`);
        console.log('（1）当前设置是否配置:', this.settingsState[settingId]?.configured);
        console.log('（2）当前设置是否启用:', this.settingsState[settingId]?.enabled);
        console.log('（3）新的toggle状态:', enabled);

        const setting = this.settings[settingId];
        const currentState = this.settingsState[settingId];

        // 检查设置是否已配置（使用布尔值判断）
        const isConfigured = !!(currentState && currentState.configured);
        
        if (isConfigured) {
            console.log('（4）准备进行的操作:', enabled ? `启用${setting.name}` : `关闭${setting.name}`);
            
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
            console.log('（4）准备进行的操作: 无配置信息，进入设置页面');
            
            // 如果用户试图启用未配置的设置，进入设置页面
            if (enabled) {
                // 重置toggle状态
                const toggleElement = document.getElementById(`${settingId}Toggle`);
                if (toggleElement) {
                    toggleElement.checked = false;
                }
                
                // 进入设置页面
                this.enterSetting(settingId);
            } else {
                // 如果用户试图禁用未配置的设置，直接更新状态
                this.updateSettingEnabled(settingId, false);
                this.refreshSettingDisplay(settingId);
            }
        }
        
        console.log('========== Toggle事件处理完成 ==========');
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
                }
            }
        } else if (configKey === 'effectsVolume' || configKey === 'backgroundMusicVolume') {
            // 滑动条类型设置不需要启用/禁用逻辑
            console.log(`⚠️ ${setting.name} 是滑动条类型，不支持启用/禁用操作`);
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
            }
        }
        
        console.log(`✅ ${setting.name} 设置已${enabled ? '启用' : '禁用'}`);
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

    // 处理依赖关系变化（递归处理传递性依赖）
    handleDependencyChanges(settingId, enabled) {
        console.log(`🔄 处理 ${settingId} 依赖关系变化，enabled: ${enabled}`);
        
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
                console.log(`🔄 自动禁用依赖设置: ${dependentId}`);
                
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
            console.log(`✅ 显示设置卡片: ${settingId}`);
        }
    }

    // 隐藏设置卡片
    hideSetting(settingId) {
        const card = document.getElementById(`${settingId}Card`);
        if (card) {
            card.style.display = 'none';
            console.log(`✅ 隐藏设置卡片: ${settingId}`);
        }
    }

    // 进入设置页面
    enterSetting(settingId) {
        const setting = this.settings[settingId];
        
        // 滑动条类型的设置不需要进入单独页面
        if (setting.type === 'slider') {
            console.log(`🎚️ ${setting.name} 是滑动条类型，无需进入设置页面`);
            return;
        }
        
        // 标记设置为已访问
        this.markSettingAsVisited(settingId);
        
        const managerClass = window[setting.managerClass];
        
        if (!managerClass) {
            console.error(`❌ 未找到管理器类: ${setting.managerClass}`);
            return;
        }
        
        console.log(`🔄 进入 ${setting.name} 设置页面`);
        
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
        
        // 更新字段显示
        const fields = this.registeredFields[settingId];
        if (fields) {
            this.updateSettingFieldsUI(settingId, fields);
        } else {
            // 如果没有注册的字段，尝试从状态生成字段
            this.generateFieldsFromState(settingId);
        }
        
        console.log(`✅ 已刷新 ${settingId} 设置显示`);
    }

    // 更新toggle状态
    updateToggleState(settingId) {
        const toggleElement = document.getElementById(`${settingId}Toggle`);
        const state = this.settingsState[settingId];
        
        if (toggleElement && state) {
            toggleElement.checked = state.enabled;
            
            if (state.configured) {
                toggleElement.disabled = false;
            } else {
                toggleElement.disabled = true;
            }
        }
    }

    // 刷新所有设置显示
    refreshAllSettings() {
        Object.keys(this.settings).forEach(settingId => {
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
    }

    // 初始化设置overlay
    initializeSettingsOverlay(overlay) {
        console.log('🔧 初始化设置overlay...');
        
        // 设置所有toggle事件监听器
        Object.keys(this.settings).forEach(settingId => {
            this.setupToggleEvents(overlay, settingId);
            this.setupCardEvents(overlay, settingId);
        });
        
        // 刷新所有设置显示
        this.refreshAllSettings();
        
        // 检测系统并初始化滑动条设置
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (!isIOS) {
            console.log('🎚️ 非iOS系统，初始化滑动条设置...');
            this.initializeSliderSettings(overlay);
        } else {
            console.log('📱 iOS系统，跳过滑动条设置');
        }
        
        console.log('✅ 设置overlay初始化完成');
    }

    // 设置toggle事件
    setupToggleEvents(overlay, settingId) {
        const setting = this.settings[settingId];
        const toggleElement = overlay.querySelector(`#${settingId}Toggle`);
        const labelElement = overlay.querySelector(`label[for="${settingId}Toggle"]`);
        
        if (!toggleElement) return;
        
        // 添加hover事件用于调试
        toggleElement.addEventListener('mouseenter', () => {
            console.log(`🖱️ ${setting.name} toggle鼠标悬停 - disabled:`, toggleElement.disabled, 'checked:', toggleElement.checked);
        });
        
        if (setting.toggleEnabled) {
            // 启用toggle功能
            const handleToggleClick = (e) => {
                console.log(`🖱️ ${setting.name} toggle点击事件 - disabled:`, toggleElement.disabled, 'checked:', toggleElement.checked);
                
                const currentState = this.settingsState[settingId];
                
                // 如果设置未配置或已关闭，点击toggle应该进入设置页面
                if (!currentState || !currentState.configured || !currentState.enabled) {
                    console.log(`🔄 ${setting.name} 未配置或已关闭，进入设置页面`);
                    
                    // 阻止toggle状态改变
                    e.preventDefault();
                    if (e.target === toggleElement) {
                        e.target.checked = false;
                    }
                    
                    // 进入设置页面
                    this.enterSetting(settingId);
                    return;
                }
            };
            
            toggleElement.addEventListener('click', handleToggleClick);
            
            // 为label也添加点击事件处理，特别是当input被disabled时
            if (labelElement) {
                labelElement.addEventListener('click', (e) => {
                    const currentState = this.settingsState[settingId];
                    
                    // 如果toggle被disabled且未配置，点击label也应该进入设置页面
                    if (toggleElement.disabled && (!currentState || !currentState.configured)) {
                        console.log(`🖱️ ${setting.name} label点击事件 - toggle disabled, 进入设置页面`);
                        e.preventDefault();
                        this.enterSetting(settingId);
                        return;
                    }
                });
            }
            
            toggleElement.addEventListener('change', (e) => {
                this.handleToggleChange(settingId, e.target.checked);
            });
        } else {
            // 装饰性toggle
            toggleElement.addEventListener('click', (e) => {
                console.log(`🖱️ ${setting.name} 装饰性toggle点击事件 - disabled:`, e.target.disabled, 'checked:', e.target.checked);
            });
            
            toggleElement.disabled = true;
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
            
            console.log(`🖱️ ${this.settings[settingId].name} header被点击`);
            this.enterSetting(settingId);
        });
    }

    // 初始化滑动条设置
    initializeSliderSettings(overlay) {
        console.log('🎚️ 初始化滑动条设置...');
        
        // 显示音量设置卡片
        const effectsVolumeCard = overlay.querySelector('#effectsVolumeCard');
        const backgroundMusicCard = overlay.querySelector('#backgroundMusicCard');
        
        if (effectsVolumeCard) {
            effectsVolumeCard.style.display = 'block';
            console.log('✅ 显示计时音效音量卡片');
        }
        if (backgroundMusicCard) {
            backgroundMusicCard.style.display = 'block';
            console.log('✅ 显示背景音乐音量卡片');
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
        
        console.log(`🎚️ 初始化滑动条: ${setting.name}`);
        
        // 获取当前音量值
        const state = this.settingsState[settingId];
        let currentVolume = state?.config?.volume || setting.fields[0].defaultValue;
        
        // 如果是背景音乐，从全局控制器获取当前音量
        if (settingId === 'backgroundMusic' && window.BackgroundMusicVolumeController) {
            currentVolume = window.BackgroundMusicVolumeController.getVolume();
            console.log(`🎵 从背景音乐控制器获取音量: ${currentVolume}`);
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
            console.log('🎚️ 已设置背景音乐滑动条引用到全局控制器');
        }
        
        console.log(`✅ 滑动条 ${setting.name} 初始化完成，当前值: ${currentVolume}`);
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
                console.log(`🎵 通过全局控制器更新背景音乐音量: ${value}`);
            } else {
                // 其他音量设置使用原有逻辑
                this.updateVolumeConfig(settingId, value);
            }
            
            console.log(`🎚️ ${setting.name} 音量更新: ${value}`);
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
            
            console.log(`🔊 播放测试音效: ${settingId}, 音量: ${testAudio.volume}`);
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
            console.warn(`⚠️ 无法为 ${settingId} 生成字段：缺少设置或状态信息`);
            return;
        }
        
        console.log(`🔧 为 ${setting.name} 生成字段，状态:`, state);
        
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
            console.log(`✅ 为 ${setting.name} 生成了 ${fields.length} 个字段`);
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
        
        console.log(`🏷️ 更新 ${setting.name} badge状态:`, {
            configured: state?.configured,
            enabled: state?.enabled,
            dependenciesMet: this.areDependenciesMet(settingId)
        });
        
        // Badge显示逻辑
        const isVisited = this.isSettingVisited(settingId);
        
        if (!state?.configured || !state?.enabled) {
            // 设置未配置或未启用 -> 检查是否显示NEW badge
            if (this.areDependenciesMet(settingId) && !isVisited) {
                // 依赖满足且未访问过时才显示NEW
                newBadge.style.display = 'block';
                reconfigBadge.style.display = 'none';
                console.log(`🆕 显示 ${setting.name} NEW badge`);
            } else {
                // 依赖不满足或已访问过时隐藏所有badge
                newBadge.style.display = 'none';
                reconfigBadge.style.display = 'none';
                if (isVisited) {
                    console.log(`👁️ ${setting.name} 已访问过，隐藏NEW badge`);
                } else {
                    console.log(`🔒 ${setting.name} 依赖不满足，隐藏badge`);
                }
            }
        } else {
            // 设置已配置且已启用 -> 显示重新配置badge
            newBadge.style.display = 'none';
            reconfigBadge.style.display = 'block';
            console.log(`🔄 显示 ${setting.name} 重新配置badge`);
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
        
        console.log(`🏷️ 主菜单badge状态: ${hasNewBadge ? '显示' : '隐藏'}`);
        
        if (hasNewBadge) {
            if (!mainBadge) {
                mainBadge = document.createElement('div');
                mainBadge.className = 'main-new-badge';
                mainBadge.textContent = BADGE_TEXTS.NEW;
                settingsButton.style.position = 'relative';
                settingsButton.appendChild(mainBadge);
                console.log('🆕 创建并显示主菜单NEW badge');
            }
            mainBadge.style.display = 'block';
        } else {
            if (mainBadge) {
                mainBadge.style.display = 'none';
                console.log('🔄 隐藏主菜单NEW badge');
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
                    ${setting.toggleEnabled ? `
                        <div class="setting-toggle">
                            <input type="checkbox" id="${settingId}Toggle" class="toggle-input">
                            <label for="${settingId}Toggle" class="toggle-label"></label>
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
    window.settingsManager.refreshAllSettings();
};

// 调试方法：清除访问记录
window.clearVisitedSettings = () => {
    if (window.settingsManager) {
        window.settingsManager.clearVisitedSettings();
        console.log('🗑️ 已清除所有设置访问记录，NEW badge将重新显示');
    }
};

// 调试方法：查看访问记录
window.getVisitedSettings = () => {
    if (window.settingsManager) {
        console.log('👁️ 当前访问记录:', window.settingsManager.visitedSettings);
        return window.settingsManager.visitedSettings;
    }
};

console.log('✅ 统一设置管理器已加载');
console.log('🔧 调试命令: clearVisitedSettings() - 清除访问记录');
console.log('🔧 调试命令: getVisitedSettings() - 查看访问记录');