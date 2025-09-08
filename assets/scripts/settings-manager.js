/**
 * 设置管理器 - 控制各个设置卡片的显示和状态
 */

// 设置状态管理
const settingsManager = {
    // 获取所有设置状态
    getAllStates: () => {
        const microphoneConfig = localStorage.getItem('microphoneConfig');
        const recordingConfig = localStorage.getItem('recordingConfig');
        const aiConfig = localStorage.getItem('aiConfig');
        
        return {
            microphone: {
                completed: microphoneConfig ? JSON.parse(microphoneConfig).enabled : false,
                config: microphoneConfig ? JSON.parse(microphoneConfig) : null
            },
            recording: {
                completed: recordingConfig ? JSON.parse(recordingConfig).enabled : false,
                config: recordingConfig ? JSON.parse(recordingConfig) : null
            },
            ai: {
                completed: aiConfig ? JSON.parse(aiConfig).enabled : false,
                config: aiConfig ? JSON.parse(aiConfig) : null
            }
        };
    },
    
    // 检查设置是否为新功能
    isSettingNew: (settingName) => {
        const states = settingsManager.getAllStates();
        return !states[settingName].completed && !states[settingName].config;
    },
    
    // 检查设置是否需要重新配置
    needsReconfiguration: (settingName) => {
        const states = settingsManager.getAllStates();
        return states[settingName].config && !states[settingName].completed;
    },
    
    // 标记设置为已完成
    markCompleted: (settingName, config = {}) => {
        const newConfig = {
            ...config,
            enabled: true,
            timestamp: Date.now()
        };
        localStorage.setItem(`${settingName}Config`, JSON.stringify(newConfig));
        console.log(`✅ ${settingName} 设置已标记为完成`);
    },
    
    // 刷新所有设置卡片的显示状态
    refreshAllCards: () => {
        const states = settingsManager.getAllStates();
        
        // 录音设备卡片
        settingsManager.updateMicrophoneCard(states.microphone);
        
        // 录音文字识别卡片（依赖录音设备）
        settingsManager.updateRecordingCard(states.recording, states.microphone.completed);
        
        // AI评分卡片（依赖录音文字识别）
        settingsManager.updateAICard(states.ai, states.recording.completed);
        
        console.log('🔄 所有设置卡片状态已刷新');
    },
    
    // 更新录音设备卡片
    updateMicrophoneCard: (micState) => {
        const card = document.getElementById('microphoneCard');
        const newBadge = document.getElementById('microphoneNewBadge');
        const reconfigBadge = document.getElementById('microphoneReconfigBadge');
        const toggle = document.getElementById('microphoneToggle');
        
        if (!card) return;
        
        // 显示卡片
        card.style.display = 'block';
        
        // 更新badge
        if (settingsManager.isSettingNew('microphone')) {
            if (newBadge) newBadge.style.display = 'block';
            if (reconfigBadge) reconfigBadge.style.display = 'none';
        } else if (settingsManager.needsReconfiguration('microphone')) {
            if (newBadge) newBadge.style.display = 'none';
            if (reconfigBadge) reconfigBadge.style.display = 'block';
        } else {
            if (newBadge) newBadge.style.display = 'none';
            if (reconfigBadge) reconfigBadge.style.display = 'none';
        }
        
        // 更新toggle状态
        if (toggle) {
            toggle.checked = micState.completed;
            toggle.disabled = true; // 保持装饰性
        }
    },
    
    // 更新录音文字识别卡片
    updateRecordingCard: (recordingState, microphoneCompleted) => {
        const card = document.getElementById('recordingCard');
        const newBadge = document.getElementById('recordingNewBadge');
        const reconfigBadge = document.getElementById('recordingReconfigBadge');
        const toggle = document.getElementById('recordingToggle');
        
        if (!card) return;
        
        // 条件显示：只有在录音设备完成后才显示
        if (microphoneCompleted) {
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        } else {
            card.style.display = 'none';
        }
        
        // 更新badge
        if (settingsManager.isSettingNew('recording')) {
            if (newBadge) newBadge.style.display = 'block';
            if (reconfigBadge) reconfigBadge.style.display = 'none';
        } else if (settingsManager.needsReconfiguration('recording')) {
            if (newBadge) newBadge.style.display = 'none';
            if (reconfigBadge) reconfigBadge.style.display = 'block';
        } else {
            if (newBadge) newBadge.style.display = 'none';
            if (reconfigBadge) reconfigBadge.style.display = 'none';
        }
        
        // 更新toggle状态
        if (toggle) {
            toggle.checked = recordingState.completed;
            toggle.disabled = true; // 保持装饰性
        }
    },
    
    // 更新AI评分卡片
    updateAICard: (aiState, recordingCompleted) => {
        const card = document.getElementById('aiCard');
        const newBadge = document.getElementById('aiNewBadge');
        const reconfigBadge = document.getElementById('aiReconfigBadge');
        const toggle = document.getElementById('aiToggle');
        
        if (!card) return;
        
        // 条件显示：只有在录音文字识别完成后才显示
        if (recordingCompleted) {
            card.style.display = 'block';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        } else {
            card.style.display = 'none';
        }
        
        // 更新badge
        if (settingsManager.isSettingNew('ai')) {
            if (newBadge) newBadge.style.display = 'block';
            if (reconfigBadge) reconfigBadge.style.display = 'none';
        } else if (settingsManager.needsReconfiguration('ai')) {
            if (newBadge) newBadge.style.display = 'none';
            if (reconfigBadge) reconfigBadge.style.display = 'block';
        } else {
            if (newBadge) newBadge.style.display = 'none';
            if (reconfigBadge) reconfigBadge.style.display = 'none';
        }
        
        // 更新toggle状态
        if (toggle) {
            toggle.checked = aiState.completed;
            toggle.disabled = true; // 保持装饰性
        }
    }
};

// 全局函数，供其他模块调用
const refreshSettingsDisplay = () => {
    settingsManager.refreshAllCards();
};

const markSettingCompleted = (settingName, config = {}) => {
    settingsManager.markCompleted(settingName, config);
    settingsManager.refreshAllCards();
};

// 导出供外部使用
window.settingsManager = settingsManager;
window.refreshSettingsDisplay = refreshSettingsDisplay;
window.markSettingCompleted = markSettingCompleted;
