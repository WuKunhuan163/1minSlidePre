/**
 * 设置页面模板 - 使用与PPT上传页面相同的风格
 */

// 创建设置页面覆盖层
const createSettingsOverlay = () => {
    console.log('🔧 创建设置overlay - 完全使用设置管理器动态生成');
    
    // 检查设置管理器是否可用
    if (!window.settingsManager || !window.settingsManager.createSettingsOverlay) {
        console.error('❌ 设置管理器不可用！无法创建设置界面');
        
        // 创建错误提示overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'slides-overlay';
        errorOverlay.innerHTML = `
            <div class="slides-header">
                <button class="back-button">
                    <i class='bx bx-arrow-back'></i>
                </button>
                <h2>系统设置</h2>
            </div>
            <div class="settings-container">
                <div class="error-message">
                    <h3>⚠️ 设置管理器加载失败</h3>
                    <p>请刷新页面重试，或联系技术支持。</p>
                </div>
            </div>
        `;
        document.body.appendChild(errorOverlay);
        return errorOverlay;
    }
    
    // 使用设置管理器完全动态生成界面
    return window.settingsManager.createSettingsOverlay();
};


// 计时音效音量控制初始化函数
const initEffectsVolumeControl = (overlay) => {
    const inlineVolumeControl = overlay.querySelector('#effects-volume-control');
    
    // 获取全局音量变量（如果存在），否则从配置加载，默认50%
    let effectsVolume = window.effectsVolume || simpleConfig.get('effectsVolume') || 0.5;
    let effectsMuted = window.effectsMuted || false;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'inline-volume-slider';
    slider.min = 0;
    slider.max = 100;
    slider.value = effectsVolume * 100;
    
    inlineVolumeControl.appendChild(slider);
    
    // 创建测试音效
    const testSound = new Audio('assets/effects/end.mp3');
    testSound.volume = effectsVolume;
    
    const playTestSound = () => {
        if (!effectsMuted) {
            testSound.currentTime = 0;
            testSound.volume = effectsVolume;
            testSound.play().catch(e => console.log('音效播放失败:', e));
        }
    };
    
    let isEditing = false;
    
    // 更新滑动条样式
    const updateSliderStyle = () => {
        const percentage = effectsVolume * 100;
        slider.style.setProperty('--volume-percentage', `${percentage}%`);
    };
    
    // 初始化样式
    updateSliderStyle();
    
    // 移除自动播放音效 - 只在用户主动调节时播放
    
    // 鼠标按下时开始编辑状态
    slider.addEventListener('mousedown', () => {
        isEditing = true;
        slider.classList.add('editing');
    });
    
    // 鼠标松开时结束编辑状态并播放音效
    slider.addEventListener('mouseup', () => {
        if (isEditing) {
            isEditing = false;
            slider.classList.remove('editing');
            playTestSound(); // 只在鼠标松开时播放音效
        }
    });
    
    // 滑动过程中只更新音量，不播放音效
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        effectsVolume = value / 100;
        
        // 更新滑动条样式
        updateSliderStyle();
        
        // 更新全局变量
        if (window.effectsVolume !== undefined) {
            window.effectsVolume = effectsVolume;
        }
        
        // 计时音效音量不再控制背景音乐音量
        // 背景音乐音量由独立的滑动条控制
        
        // 保存到配置
        simpleConfig.set('effectsVolume', effectsVolume);
    });
};

// 背景音乐音量控制初始化函数
const initBackgroundMusicVolumeControl = (overlay) => {
    const inlineVolumeControl = overlay.querySelector('#background-music-control');
    
    // 获取背景音乐音量，否则从配置加载，默认50%
    let backgroundMusicVolume = simpleConfig.get('backgroundMusicVolume') || 0.5;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'inline-volume-slider';
    slider.min = 0;
    slider.max = 100;
    slider.value = backgroundMusicVolume * 100;
    
    inlineVolumeControl.appendChild(slider);
    
    // 创建测试音效（使用背景音乐片段）
    const testMusic = new Audio('assets/effects/background.mp3');
    testMusic.volume = Math.min(backgroundMusicVolume * 4.0, 1.0); // 使用相同的倍数
    testMusic.loop = false;
    
    const playTestMusic = () => {
        testMusic.currentTime = 0;
        testMusic.volume = Math.min(backgroundMusicVolume * 4.0, 1.0);
        testMusic.play().then(() => {
            // 播放3秒后停止
            setTimeout(() => {
                testMusic.pause();
                testMusic.currentTime = 0;
            }, 3000);
        }).catch(e => console.log('背景音乐测试播放失败:', e));
    };
    
    let isEditing = false;
    
    // 更新滑动条样式
    const updateSliderStyle = () => {
        const percentage = backgroundMusicVolume * 100;
        slider.style.setProperty('--volume-percentage', `${percentage}%`);
    };
    
    // 初始化样式
    updateSliderStyle();
    
    // 鼠标按下时开始编辑状态
    slider.addEventListener('mousedown', () => {
        isEditing = true;
        slider.classList.add('editing');
    });
    
    // 鼠标松开时结束编辑状态并播放音效
    slider.addEventListener('mouseup', () => {
        if (isEditing) {
            isEditing = false;
            slider.classList.remove('editing');
            playTestMusic(); // 播放背景音乐测试
        }
    });
    
    // 滑动过程中只更新音量，不播放音效
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        backgroundMusicVolume = value / 100;
        
        // 更新滑动条样式
        updateSliderStyle();
        
        // 更新全局背景音乐音量
        if (window.backgroundMusic) {
            window.backgroundMusic.volume = Math.min(backgroundMusicVolume * 4.0, 1.0);
        }
        
        // 保存到配置
        simpleConfig.set('backgroundMusicVolume', backgroundMusicVolume);
    });
};

// 更新NEW标识显示
const updateNewBadges = (overlay) => {
    const recordingNewBadge = overlay.querySelector('#recordingNewBadge');
    const aiNewBadge = overlay.querySelector('#aiNewBadge');
    const recordingReconfigBadge = overlay.querySelector('#recordingReconfigBadge');
    const aiReconfigBadge = overlay.querySelector('#aiReconfigBadge');
    const currentConfig = simpleConfig.getAll();
    
    // 录音功能badge逻辑：如果是新功能显示NEW，如果已配置显示重新配置
    if (simpleConfig.isSettingNew('recording')) {
        recordingNewBadge.style.display = 'block';
        recordingReconfigBadge.style.display = 'none';
    } else if (currentConfig.recordingEnabled) {
        recordingNewBadge.style.display = 'none';
        recordingReconfigBadge.style.display = 'block';
    } else {
        recordingNewBadge.style.display = 'none';
        recordingReconfigBadge.style.display = 'none';
    }
    
    // 智谱AI功能badge逻辑：如果是新功能显示NEW，如果已配置显示重新配置
    if (simpleConfig.isSettingNew('ai')) {
        aiNewBadge.style.display = 'block';
        aiReconfigBadge.style.display = 'none';
    } else if (currentConfig.aiEnabled) {
        aiNewBadge.style.display = 'none';
        aiReconfigBadge.style.display = 'block';
    } else {
        aiNewBadge.style.display = 'none';
        aiReconfigBadge.style.display = 'none';
    }
};

// 更新主菜单设置按钮的NEW标识
const updateMainSettingsButton = () => {
    const settingsButton = document.querySelector('.settings-button');
    if (!settingsButton) return;
    
    // 确保simpleConfig已加载
    if (typeof simpleConfig === 'undefined' || !simpleConfig.hasNewSettings) {
        console.warn('⚠️ simpleConfig未加载，延迟更新设置按钮');
        setTimeout(updateMainSettingsButton, 100);
        return;
    }
    
    let mainBadge = settingsButton.querySelector('.main-new-badge');
    
    if (simpleConfig.hasNewSettings()) {
        if (!mainBadge) {
            mainBadge = document.createElement('div');
            mainBadge.className = 'main-new-badge';
            mainBadge.textContent = 'NEW';
            settingsButton.style.position = 'relative';
            settingsButton.appendChild(mainBadge);
        }
        mainBadge.style.display = 'block';
    } else {
        if (mainBadge) {
            mainBadge.style.display = 'none';
        }
    }
};


// 初始化设置页面功能
const initSettingsPage = () => {
    try {
        // 主菜单badge现在由设置管理器统一处理
        // updateMainSettingsButton(); // 已移除，由settingsManager处理
    
    // 为设置按钮添加事件监听器
    const settingsButton = document.querySelector('.settings-button');
    console.log('🔍 查找设置按钮:', settingsButton);
    console.log('🔍 当前录音状态:', simpleConfig.get('recordingEnabled'));
    console.log('🔍 页面加载时间:', new Date().toLocaleTimeString());
    
    if (settingsButton) {
        console.log('✅ 设置按钮找到，添加点击事件监听器');
        settingsButton.addEventListener('click', () => {
            console.log('🖱️ 设置按钮被点击，创建设置覆盖层');
            const overlay = createSettingsOverlay();
            console.log('✅ 设置覆盖层已创建:', overlay);
            
    // 使用统一的事件设置函数
    setupSettingsOverlayEvents(overlay);
    
    // 初始化新的设置管理器
    if (window.settingsManager) {
        window.settingsManager.initializeSettingsOverlay(overlay);
    }
        });
    } else {
        console.warn('设置按钮未找到');
    }
    } catch (error) {
        console.error('❌ 设置页面初始化失败:', error);
    }
};

console.log('📱 设置页面模板已加载');

// 全局背景音乐音量控制接口
window.BackgroundMusicVolumeController = {
    // 当前音量值 (0-1)
    currentVolume: 0.5,
    
    // 原始音量值（用于恢复）
    originalVolume: null,
    
    // 背景音乐元素引用（私有，不应直接访问）
    _backgroundMusicElement: null,
    
    // 设置滑动条引用（私有，不应直接访问）
    _sliderElement: null,
    
    // 保护属性：检测直接访问
    get backgroundMusicElement() {
        console.warn('⚠️ 直接访问backgroundMusicElement已废弃，请使用BackgroundMusicVolumeController的API方法');
        return this._backgroundMusicElement;
    },
    
    set backgroundMusicElement(value) {
        console.warn('⚠️ 直接设置backgroundMusicElement已废弃，请使用setBackgroundMusicElement()方法');
        this._backgroundMusicElement = value;
    },
    
    get sliderElement() {
        console.warn('⚠️ 直接访问sliderElement已废弃，请使用BackgroundMusicVolumeController的API方法');
        return this._sliderElement;
    },
    
    set sliderElement(value) {
        console.warn('⚠️ 直接设置sliderElement已废弃，请使用setSliderReference()方法');
        this._sliderElement = value;
    },
    
    // 初始化控制器
    init() {
        console.log('🎵 初始化背景音乐音量控制器...');
        
        // 查找背景音乐元素
        this._backgroundMusicElement = document.querySelector('#background-music') || 
                                      document.querySelector('audio[src*="background"]') ||
                                      window.backgroundMusic;
        
        // 从配置加载当前音量
        if (simpleConfig) {
            const savedVolume = simpleConfig.get('backgroundMusicVolume');
            if (savedVolume !== null) {
                this.currentVolume = savedVolume;
            }
        }
        
        console.log('🎵 背景音乐控制器初始化完成, 当前音量:', this.currentVolume);
        console.log('🎵 背景音乐元素:', this._backgroundMusicElement);
    },
    
    // 设置音量 (0-1)
    setVolume(volume, saveAsOriginal = false) {
        // 确保音量在有效范围内
        volume = Math.max(0, Math.min(1, volume));
        
        console.log(`🎵 设置背景音乐音量: ${volume} (保存为原始: ${saveAsOriginal})`);
        
        // 如果需要保存为原始音量
        if (saveAsOriginal && this.originalVolume === null) {
            this.originalVolume = this.currentVolume;
            console.log(`🎵 保存原始音量: ${this.originalVolume}`);
        }
        
        // 更新当前音量
        this.currentVolume = volume;
        
        // 更新实际的背景音乐音量
        this.updateBackgroundMusicVolume();
        
        // 更新滑动条显示
        this.updateSliderDisplay();
        
        // 保存到配置
        this.saveToConfig();
        
        // 更新设置管理器状态
        this.updateSettingsManagerState();
        
        return this.currentVolume;
    },
    
    // 获取当前音量
    getVolume() {
        return this.currentVolume;
    },
    
    // 暂停背景音乐（设置音量为0）
    pause(saveOriginal = true) {
        console.log('🎵 暂停背景音乐...');
        return this.setVolume(0, saveOriginal);
    },
    
    // 恢复背景音乐音量
    resume() {
        console.log('🎵 恢复背景音乐音量...');
        if (this.originalVolume !== null) {
            const volumeToRestore = this.originalVolume;
            this.originalVolume = null; // 清除原始音量
            return this.setVolume(volumeToRestore);
        } else {
            console.log('🎵 没有保存的原始音量，保持当前音量');
            return this.currentVolume;
        }
    },
    
    // 更新实际的背景音乐音量
    updateBackgroundMusicVolume() {
        if (this._backgroundMusicElement) {
            // 背景音乐使用4倍放大，最大为1.0
            const actualVolume = Math.min(this.currentVolume * 4.0, 1.0);
            this._backgroundMusicElement.volume = actualVolume;
            console.log(`🎵 更新背景音乐实际音量: ${actualVolume} (原始: ${this.currentVolume})`);
        } else {
            console.log('🎵 背景音乐元素未找到，无法更新音量');
        }
        
        // 同时更新全局变量
        if (window.backgroundMusic && window.backgroundMusic !== this._backgroundMusicElement) {
            const actualVolume = Math.min(this.currentVolume * 4.0, 1.0);
            window.backgroundMusic.volume = actualVolume;
            console.log(`🎵 更新全局背景音乐音量: ${actualVolume}`);
        }
    },
    
    // 更新滑动条显示
    updateSliderDisplay() {
        // 查找当前的滑动条元素
        if (!this._sliderElement) {
            this._sliderElement = document.querySelector('#background-music-control input[type="range"]');
        }
        
        if (this._sliderElement) {
            this._sliderElement.value = this.currentVolume;
            
            // 更新滑动条样式
            const percentage = this.currentVolume * 100;
            this._sliderElement.style.setProperty('--volume-percentage', `${percentage}%`);
            
            console.log(`🎚️ 更新滑动条显示: ${this.currentVolume}`);
        }
    },
    
    // 保存到配置
    saveToConfig() {
        if (simpleConfig) {
            simpleConfig.set('backgroundMusicVolume', this.currentVolume);
            console.log(`💾 保存背景音乐音量到配置: ${this.currentVolume}`);
        }
    },
    
    // 更新设置管理器状态
    updateSettingsManagerState() {
        if (window.settingsManager && window.settingsManager.settingsState.backgroundMusic) {
            window.settingsManager.settingsState.backgroundMusic.config = { volume: this.currentVolume };
            window.settingsManager.settingsState.backgroundMusic.lastUpdate = Date.now();
            console.log(`⚙️ 更新设置管理器状态: ${this.currentVolume}`);
        }
    },
    
    // 设置滑动条引用（由设置管理器调用）
    setSliderReference(sliderElement) {
        this._sliderElement = sliderElement;
        console.log('🎚️ 设置滑动条引用:', sliderElement);
    },
    
    // 设置背景音乐元素引用
    setBackgroundMusicElement(element) {
        this._backgroundMusicElement = element;
        console.log('🎵 设置背景音乐元素引用:', element);
        
        // 立即更新音量
        this.updateBackgroundMusicVolume();
    },
    
    // 添加保护全局backgroundMusic的访问
    _protectGlobalBackgroundMusic() {
        if (window.backgroundMusic && !window.backgroundMusic._protected) {
            const originalBackgroundMusic = window.backgroundMusic;
            
            // 创建保护的代理对象
            window.backgroundMusic = new Proxy(originalBackgroundMusic, {
                set(target, property, value) {
                    if (property === 'volume') {
                        console.warn('⚠️ 直接设置window.backgroundMusic.volume已废弃，请使用BackgroundMusicVolumeController.setVolume()');
                        console.warn('   建议使用: window.BackgroundMusicVolumeController.setVolume(' + (value / 4.0) + ')');
                    } else if (property === 'pause' || property === 'play') {
                        console.warn('⚠️ 直接调用window.backgroundMusic.' + property + '()已废弃，请使用BackgroundMusicVolumeController.pause()/resume()');
                    }
                    return Reflect.set(target, property, value);
                },
                get(target, property) {
                    if (property === 'pause') {
                        console.warn('⚠️ 直接调用window.backgroundMusic.pause()已废弃，请使用BackgroundMusicVolumeController.pause()');
                    } else if (property === 'play') {
                        console.warn('⚠️ 直接调用window.backgroundMusic.play()已废弃，请使用BackgroundMusicVolumeController.resume()');
                    }
                    return Reflect.get(target, property);
                }
            });
            
            window.backgroundMusic._protected = true;
        }
    }
};

// 页面加载时初始化控制器
document.addEventListener('DOMContentLoaded', () => {
    window.BackgroundMusicVolumeController.init();
    // 启用全局backgroundMusic保护
    window.BackgroundMusicVolumeController._protectGlobalBackgroundMusic();
});

// 如果页面已经加载完成，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BackgroundMusicVolumeController.init();
    });
} else {
    window.BackgroundMusicVolumeController.init();
}

// 统一的overlay管理系统
const overlayManager = {
    // 清除所有现有的overlay
    clearAllOverlays() {
        console.log('🧹 清理所有现有的overlay');
        const existingOverlays = document.querySelectorAll('.slides-overlay, .overlay');
        existingOverlays.forEach((overlay, index) => {
            console.log(`🗑️ 移除overlay ${index + 1}:`, overlay.className);
            overlay.remove();
        });
    },
    
    // 安全地切换到新的overlay
    switchToOverlay(newOverlay) {
        console.log('🔄 安全切换到新overlay');
        this.clearAllOverlays();
        if (newOverlay && !document.body.contains(newOverlay)) {
            document.body.appendChild(newOverlay);
        }
    }
};

// 设置overlay事件监听器的统一函数
const setupSettingsOverlayEvents = (overlay) => {
    
            // 返回按钮事件
    const backButton = overlay.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
                console.log('🔙 点击设置页面的返回按钮，回到主菜单');
                console.log('🔙 当前录音状态:', simpleConfig.get('recordingEnabled'));
            overlayManager.clearAllOverlays(); // 使用统一的清理方法
        });
    }
    
    // 重新设置完整的overlay功能
    setupFullSettingsOverlayFunctionality(overlay);
};

// 完整的设置overlay功能初始化
const setupFullSettingsOverlayFunctionality = (overlay) => {
    
    // 使用统一的设置管理器初始化
    if (window.settingsManager) {
        window.settingsManager.initializeSettingsOverlay(overlay);
        return;
    }
    
    // 降级处理：使用旧的初始化逻辑
    console.warn('⚠️ 统一设置管理器未加载，使用降级处理');
    
    // 获取所有必要的元素
    const microphoneSettings = overlay.querySelector('#microphoneSettings');
    const recordingSettings = overlay.querySelector('#recordingSettings');
    const aiSettings = overlay.querySelector('#aiSettings');
    const audioInputSelect = overlay.querySelector('#audioInputSelect');
    
    // 注意：不再处理toggle，因为这些应该由设置管理器处理
            
    // 录音文字识别设置卡片（toggle由设置管理器处理）
    const recordingCard = overlay.querySelector('#recordingCard');
    if (recordingCard) {
        // toggle交互由设置管理器统一处理，这里不再干预
        
        // 只为header区域添加点击事件
        const recordingHeader = recordingCard.querySelector('.setting-card-header');
        if (recordingHeader) {
            recordingHeader.addEventListener('click', (e) => {
                console.log('🖱️ 录音设置header被点击');
                
                // 直接进入录音设置，不管当前状态
                console.log('🔄 进入录音设置页面');
                overlay.remove();
                
                // 使用新的管理器（如果可用），否则使用旧版本
                let audioSetupOverlay;
                if (typeof AudioSetupManager !== 'undefined') {
                    const audioManager = new AudioSetupManager();
                    audioSetupOverlay = audioManager.createSetup();
                } else if (typeof createAudioSetupOverlay !== 'undefined') {
                    audioSetupOverlay = createAudioSetupOverlay();
                } else {
                    console.error('录音设置管理器不可用');
                    return;
                }
                
                // 添加返回按钮事件（如果需要）
                if (audioSetupOverlay && audioSetupOverlay.querySelector('.back-button')) {
                    audioSetupOverlay.querySelector('.back-button').addEventListener('click', () => {
                        console.log('🔙 从录音设置返回');
                        const newSettingsOverlay = createSettingsOverlay();
                        setupSettingsOverlayEvents(newSettingsOverlay);
                        overlayManager.switchToOverlay(newSettingsOverlay);
                    });
                }
            });
        }
    }
    
    // 录音设备卡片点击事件
    const microphoneCard = overlay.querySelector('#microphoneCard');
    const microphoneToggle = overlay.querySelector('#microphoneToggle');
    
    if (microphoneCard) {
        const microphoneHeader = microphoneCard.querySelector('.setting-card-header');
        if (microphoneHeader) {
            microphoneHeader.addEventListener('click', (e) => {
                // 如果点击的是toggle区域，不处理header点击
                if (e.target.closest('.setting-toggle')) {
                    return;
                }
                
                console.log('🖱️ 录音设备header被点击');
                
                // 进入录音设备设置页面
                console.log('🔄 进入录音设备设置页面');
                overlay.remove();
                
                // 使用新的管理器（如果可用），否则使用旧版本
                if (typeof MicrophoneSetupManager !== 'undefined') {
                    const microphoneManager = new MicrophoneSetupManager();
                    const microphoneSetupOverlay = microphoneManager.createSetup();
                } else if (typeof createMicrophoneSetupOverlay !== 'undefined') {
                    const microphoneSetupOverlay = createMicrophoneSetupOverlay();
                } else {
                    console.error('录音设备设置管理器不可用');
                    return;
                }
            });
        }
    }
    
    // 录音设备toggle事件处理
    if (microphoneToggle) {
        // 添加hover事件用于调试
        microphoneToggle.addEventListener('mouseenter', () => {
            console.log('🖱️ 录音设备toggle鼠标悬停 - disabled:', microphoneToggle.disabled, 'checked:', microphoneToggle.checked);
        });
        
        microphoneToggle.addEventListener('click', (e) => {
            console.log('🖱️ 录音设备toggle点击事件 - disabled:', e.target.disabled, 'checked:', e.target.checked);
        });
        
        microphoneToggle.addEventListener('change', (e) => {
            console.log('========== 录音设备Toggle点击事件 ==========');
            
            const microphoneConfig = localStorage.getItem('microphoneConfig');
            const currentConfig = microphoneConfig ? JSON.parse(microphoneConfig) : null;
            
            // 输出调试信息
            console.log('（1）当前设置是否开启:', currentConfig ? currentConfig.enabled : '无配置');
            console.log('（2）当前的toggle状态:', e.target.checked);
            
            if (currentConfig) {
                if (e.target.checked) {
                    console.log('（3）准备进行的操作: 启用录音设备设置');
                } else {
                    console.log('（3）准备进行的操作: 关闭录音设备设置');
                }
                
                // 更新配置
                currentConfig.enabled = e.target.checked;
                currentConfig.timestamp = Date.now();
                
                localStorage.setItem('microphoneConfig', JSON.stringify(currentConfig));
                console.log('✅ 录音设备配置已更新:', currentConfig);
                
                // 刷新设置界面显示
                if (window.refreshSettingsDisplay) {
                    window.refreshSettingsDisplay();
                }
                
                // 更新设备信息显示
                const fields = [
                    {
                        name: '已选择设备',
                        value: currentConfig.selectedDeviceName || 'Unknown Device',
                        type: 'text',
                        copyable: false
                    },
                    {
                        name: '设备状态',
                        value: currentConfig.enabled ? '已启用' : '已禁用',
                        type: 'text',
                        copyable: false
                    },
                    {
                        name: '配置时间',
                        value: new Date(currentConfig.timestamp).toLocaleString(),
                        type: 'text',
                        copyable: false
                    }
                ];
                
                if (window.updateSettingFields) {
                    window.updateSettingFields('microphone', fields);
                }
                
                // 根据toggle状态显示或隐藏录音文字识别卡片
                if (e.target.checked) {
                    console.log('🔄 显示录音文字识别卡片');
                    showRecordingCard();
                } else {
                    console.log('🔄 隐藏录音文字识别卡片');
                    hideRecordingCard();
                }
            } else {
                console.log('（3）准备进行的操作: 无配置信息，进入录音设备设置页面');
                // 如果没有配置，应该进入设置页面
                e.target.checked = false; // 重置toggle状态
                
                // 触发header点击事件进入设置
                const microphoneHeader = document.querySelector('#microphoneCard .setting-card-header');
                if (microphoneHeader) {
                    microphoneHeader.click();
                }
            }
            
            console.log('========== Toggle事件处理完成 ==========');
        });
    }
    
    // AI设置卡片（toggle由设置管理器处理）
    const aiCard = overlay.querySelector('#aiCard');
    if (aiCard) {
        // toggle交互由设置管理器统一处理，这里不再干预
        
        // 只为header区域添加点击事件
        const aiHeader = aiCard.querySelector('.setting-card-header');
        if (aiHeader) {
            aiHeader.addEventListener('click', (e) => {
                console.log('🖱️ AI设置header被点击');
                
                // 直接进入AI设置，不管当前状态
                console.log('🔄 进入AI设置页面');
                overlay.remove();
                
                // 使用新的管理器（如果可用），否则使用旧版本
                let aiSetupOverlay;
                if (typeof AISetupManager !== 'undefined') {
                    const aiManager = new AISetupManager();
                    aiSetupOverlay = aiManager.createSetup();
                } else if (typeof createAISetupOverlay !== 'undefined') {
                    aiSetupOverlay = createAISetupOverlay();
                } else {
                    console.error('AI设置管理器不可用');
                    return;
                }
                
                // 添加返回按钮事件
                if (aiSetupOverlay && aiSetupOverlay.querySelector('.back-button')) {
                    aiSetupOverlay.querySelector('.back-button').addEventListener('click', () => {
                        console.log('🔙 从AI设置返回');
                        const newSettingsOverlay = createSettingsOverlay();
                        setupSettingsOverlayEvents(newSettingsOverlay);
                        overlayManager.switchToOverlay(newSettingsOverlay);
                    });
                }
            });
        }
    }
    
    // 更新overlay显示状态（基于共享本地状态）
    updateOverlayFromSharedState(overlay);
};

// 基于共享本地状态更新overlay显示
const updateOverlayFromSharedState = (overlay) => {
    
    const currentConfig = simpleConfig.getAll();
    const microphoneToggle = overlay.querySelector('#microphoneToggle');
    const recordingToggle = overlay.querySelector('#recordingToggle');
                        const aiToggle = overlay.querySelector('#aiToggle');
    const microphoneSettings = overlay.querySelector('#microphoneSettings');
    const recordingSettings = overlay.querySelector('#recordingSettings');
                            const aiSettings = overlay.querySelector('#aiSettings');
    const recordingCard = overlay.querySelector('#recordingCard');
    const aiCard = overlay.querySelector('#aiCard');
    
    // 使用新的设置管理器刷新显示
    if (window.refreshSettingsDisplay) {
        window.refreshSettingsDisplay();
    }
    
    // 更新配置字段值
    if (overlay.querySelector('#appKey')) {
        overlay.querySelector('#appKey').value = currentConfig.appKey || '';
    }
    if (overlay.querySelector('#accessKeyId')) {
        overlay.querySelector('#accessKeyId').value = currentConfig.accessKeyId || '';
    }
    if (overlay.querySelector('#accessKeySecret')) {
        overlay.querySelector('#accessKeySecret').value = currentConfig.accessKeySecret || '';
    }
    if (overlay.querySelector('#zhipuApiKey')) {
        overlay.querySelector('#zhipuApiKey').value = currentConfig.zhipuApiKey || '';
    }
    
    // 如果录音功能已启用，设置录音字段复制功能
    if (currentConfig.recordingEnabled) {
        setupMainSettingsFieldCopy(overlay);
    }
    
    // 如果AI功能已启用，设置AI字段复制功能
    if (currentConfig.aiEnabled) {
        setupAISettingsFieldCopy(overlay);
    }
            
            // 音量设置卡片的显示/隐藏现在由设置管理器统一处理
            // 这里保留兼容性代码，以防设置管理器不可用
            if (!window.settingsManager) {
                console.log('⚠️ 设置管理器不可用，使用兼容性代码初始化滑动条');
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                const effectsVolumeCard = overlay.querySelector('#effectsVolumeCard');
                const backgroundMusicCard = overlay.querySelector('#backgroundMusicCard');
                
                if (!isIOS) {
                    // 非iOS系统显示音量设置卡片
                    if (effectsVolumeCard) effectsVolumeCard.style.display = 'block';
                    if (backgroundMusicCard) backgroundMusicCard.style.display = 'block';
                    // 使用旧的初始化函数
                    initEffectsVolumeControl(overlay);
                    initBackgroundMusicVolumeControl(overlay);
                } else {
                    // iOS系统隐藏音量设置卡片
                    if (effectsVolumeCard) effectsVolumeCard.style.display = 'none';
                    if (backgroundMusicCard) backgroundMusicCard.style.display = 'none';
                }
            }
    
        // badge状态现在由设置管理器统一处理
        // updateNewBadges(overlay); // 已移除，由settingsManager处理
};

// 为主设置界面的字段添加复制功能并禁用输入
const setupMainSettingsFieldCopy = (overlay) => {
    console.log('🔒 设置主设置界面字段：禁用输入，添加复制功能');
    
    const recordingInputs = [
        { id: 'appKey', label: 'App Key' },
        { id: 'accessKeyId', label: 'AccessKey ID' },
        { id: 'accessKeySecret', label: 'AccessKey Secret' }
    ];
    
    recordingInputs.forEach(({ id, label }) => {
        const input = overlay.querySelector(`#${id}`);
        if (input) {
            // 禁用输入框
            input.disabled = true;
            input.style.backgroundColor = '#2a2a2a';
            input.style.color = '#888';
            input.style.cursor = 'not-allowed';
            
            // 创建wrapper div并添加复制按钮
            const settingField = input.parentElement;
            if (settingField && !settingField.querySelector('.copy-btn')) {
                // 创建wrapper div
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    position: relative;
                    display: flex;
                    align-items: center;
                `;
                
                // 将input包装在wrapper中
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                
                // 创建复制按钮
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="bx bx-copy"></i>';
                copyBtn.title = `复制 ${label}`;
                copyBtn.style.cssText = `
                    position: absolute;
                    right: 10px;
                    background: #666AF6;
                    border: none;
                    color: white;
                    padding: 5px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                
                // 添加复制功能
                copyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // 防止触发其他点击事件
                    try {
                        await navigator.clipboard.writeText(input.value);
                        copyBtn.innerHTML = '<i class="bx bx-check"></i>';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="bx bx-copy"></i>';
                        }, 1000);
                    } catch (error) {
                        console.error('复制失败:', error);
                        alert('复制失败，请手动选择文本');
                    }
                });
                
                wrapper.appendChild(copyBtn);
            }
        }
    });
    
    console.log('✅ 主设置界面字段复制功能已设置');
};

// 为主设置界面的AI字段添加复制功能并禁用输入
const setupAISettingsFieldCopy = (overlay) => {
    console.log('🔒 设置AI字段：禁用输入，添加复制功能');
    
    const aiInputs = [
        { id: 'zhipuApiKey', label: '智谱AI API Key' }
    ];
    
    aiInputs.forEach(({ id, label }) => {
        const input = overlay.querySelector(`#${id}`);
        if (input) {
            // 禁用输入框
            input.disabled = true;
            input.style.backgroundColor = '#2a2a2a';
            input.style.color = '#888';
            input.style.cursor = 'not-allowed';
            
            // 创建wrapper div并添加复制按钮
            const settingField = input.parentElement;
            if (settingField && !settingField.querySelector('.copy-btn')) {
                // 创建wrapper div
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    position: relative;
                    display: flex;
                    align-items: center;
                `;
                
                // 将input包装在wrapper中
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                
                // 创建复制按钮
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="bx bx-copy"></i>';
                copyBtn.title = `复制 ${label}`;
                copyBtn.style.cssText = `
                    position: absolute;
                    right: 10px;
                    background: #666AF6;
                    border: none;
                    color: white;
                    padding: 5px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                
                // 添加复制功能
                copyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // 防止触发其他点击事件
                    try {
                        await navigator.clipboard.writeText(input.value);
                        copyBtn.innerHTML = '<i class="bx bx-check"></i>';
                        copyBtn.style.background = '#28a745';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="bx bx-copy"></i>';
                            copyBtn.style.background = '#666AF6';
                        }, 1000);
                    } catch (error) {
                        console.error('复制失败:', error);
                        alert('复制失败，请手动选择文本');
                    }
                });
                
                wrapper.appendChild(copyBtn);
            }
        }
    });
    
    console.log('✅ AI设置界面字段复制功能已设置');
};

// 录音设备设置相关变量
let currentAudioStream = null;
let micTestAudioContext = null;
let micTestAnalyser = null;
let volumeAnimationId = null;

// 初始化录音设备设置
const initMicrophoneSettings = async () => {
    console.log('🎤 初始化录音设备设置...');
    
    try {
        // 检测音频设备
        await detectAudioDevices();
        
        // 检查录音设备设置状态
        const microphoneConfig = localStorage.getItem('microphoneConfig');
        const microphoneToggle = document.getElementById('microphoneToggle');
        const audioInputSelect = document.getElementById('audioInputSelect');
        
        if (microphoneConfig) {
            const config = JSON.parse(microphoneConfig);
            
            if (microphoneToggle) {
                microphoneToggle.checked = config.enabled || false;
                // 如果已配置过，启用toggle
                microphoneToggle.disabled = false;
            }
            
            if (audioInputSelect && config.selectedDeviceId) {
                audioInputSelect.value = config.selectedDeviceId;
            }
            
            // 使用新的字段管理系统显示设备信息
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
            
            if (window.updateSettingFields) {
                window.updateSettingFields('microphone', fields);
            }
            
            // 如果已配置，显示录音文字识别卡片
            if (config.enabled) {
                showRecordingCard();
            } else {
                hideRecordingCard();
            }
        } else {
            // 如果没有配置过，禁用toggle
            if (microphoneToggle) {
                microphoneToggle.disabled = true;
                microphoneToggle.checked = false;
            }
            hideRecordingCard();
        }
        
    } catch (error) {
        console.error('❌ 初始化录音设备设置失败:', error);
    }
};

// 检测音频输入设备
const detectAudioDevices = async () => {
    console.log('🔍 检测音频输入设备...');
    
    try {
        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        // 枚举设备
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        const select = document.getElementById('audioInputSelect');
        if (select) {
            select.innerHTML = '';
            
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
            }
        }
        
        console.log(`✅ 检测到 ${audioInputs.length} 个音频输入设备`);
        
    } catch (error) {
        console.error('❌ 检测音频设备失败:', error);
        const select = document.getElementById('audioInputSelect');
        if (select) {
            select.innerHTML = '<option value="">检测失败，请检查麦克风权限</option>';
        }
        throw error;
    }
};

// 测试麦克风
const testMicrophone = async () => {
    const testButton = document.getElementById('micTestButton');
    const volumeMeter = document.getElementById('volumeMeter');
    const audioTestSection = document.getElementById('audioTestSection');
    const audioInputSelect = document.getElementById('audioInputSelect');
    
    if (!testButton || !volumeMeter || !audioTestSection) return;
    
    if (audioTestSection.classList.contains('testing')) {
        // 停止测试
        stopMicrophoneTest();
        return;
    }
    
    try {
        // 开始测试
        audioTestSection.classList.add('testing');
        testButton.textContent = '停止测试';
        volumeMeter.style.display = 'flex';
        
        // 获取选中的设备
        const selectedDeviceId = audioInputSelect ? audioInputSelect.value : '';
        
        const constraints = {
            audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
        };
        
        currentAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 创建音频分析器
        micTestAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        micTestAnalyser = micTestAudioContext.createAnalyser();
        const source = micTestAudioContext.createMediaStreamSource(currentAudioStream);
        
        micTestAnalyser.fftSize = 256;
        source.connect(micTestAnalyser);
        
        // 开始音量监测
        startVolumeMonitoring();
        
        console.log('✅ 麦克风测试开始');
        
    } catch (error) {
        console.error('❌ 麦克风测试失败:', error);
        stopMicrophoneTest();
        alert('麦克风测试失败: ' + error.message);
    }
};

// 开始音量监测
const startVolumeMonitoring = () => {
    const volumeFill = document.getElementById('volumeFill');
    const volumeText = document.getElementById('volumeText');
    
    if (!micTestAnalyser || !volumeFill || !volumeText) return;
    
    const bufferLength = micTestAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVolume = () => {
        if (!micTestAnalyser) return;
        
        micTestAnalyser.getByteFrequencyData(dataArray);
        
        // 计算平均音量
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const volume = Math.round((average / 255) * 100);
        
        // 更新显示
        volumeFill.style.width = volume + '%';
        volumeText.textContent = `音量: ${volume}%`;
        
        volumeAnimationId = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
};

// 停止麦克风测试
const stopMicrophoneTest = () => {
    const testButton = document.getElementById('micTestButton');
    const volumeMeter = document.getElementById('volumeMeter');
    const audioTestSection = document.getElementById('audioTestSection');
    
    // 停止音频流
    if (currentAudioStream) {
        currentAudioStream.getTracks().forEach(track => track.stop());
        currentAudioStream = null;
    }
    
    // 关闭音频上下文
    if (micTestAudioContext) {
        micTestAudioContext.close();
        micTestAudioContext = null;
        micTestAnalyser = null;
    }
    
    // 停止动画
    if (volumeAnimationId) {
        cancelAnimationFrame(volumeAnimationId);
        volumeAnimationId = null;
    }
    
    // 更新UI
    if (audioTestSection) audioTestSection.classList.remove('testing');
    if (testButton) testButton.textContent = '测试麦克风';
    if (volumeMeter) volumeMeter.style.display = 'none';
    
    console.log('✅ 麦克风测试已停止');
};

// 保存录音设备配置
const saveMicrophoneConfig = () => {
    const microphoneToggle = document.getElementById('microphoneToggle');
    const audioInputSelect = document.getElementById('audioInputSelect');
    
    if (!microphoneToggle || !audioInputSelect) return;
    
    const config = {
        enabled: microphoneToggle.checked,
        selectedDeviceId: audioInputSelect.value,
        selectedDeviceName: audioInputSelect.options[audioInputSelect.selectedIndex]?.text || '',
        timestamp: Date.now()
    };
    
    localStorage.setItem('microphoneConfig', JSON.stringify(config));
    
    // 设置完成后，启用toggle
    if (microphoneToggle) {
        microphoneToggle.disabled = false;
    }
    
    // 更新设备信息显示
    updateMicrophoneDeviceInfo(config);
    
    // 如果启用，显示录音文字识别卡片
    if (config.enabled) {
        showRecordingCard();
    } else {
        hideRecordingCard();
    }
    
    console.log('✅ 录音设备配置已保存', config);
};

// 显示录音文字识别卡片
const showRecordingCard = () => {
    const recordingCard = document.getElementById('recordingCard');
    if (recordingCard) {
        recordingCard.style.display = 'block';
        // 添加一个小动画效果
        setTimeout(() => {
            recordingCard.style.opacity = '1';
            recordingCard.style.transform = 'translateY(0)';
        }, 100);
    }
};

// 隐藏录音文字识别卡片
const hideRecordingCard = () => {
    const recordingCard = document.getElementById('recordingCard');
    if (recordingCard) {
        recordingCard.style.display = 'none';
    }
};


// 通用的设置字段管理系统
const settingFields = {}; // 存储各个设置的字段配置

// 更新设置字段
window.updateSettingFields = (settingId, fields) => {
    settingFields[settingId] = fields;
    console.log(`✅ 已更新 ${settingId} 设置字段:`, fields);
    
    // 立即更新UI显示
    updateSettingFieldsUI(settingId, fields);
};

// 更新设置字段UI显示
const updateSettingFieldsUI = (settingId, fields) => {
    const contentContainer = document.getElementById(`${settingId}Settings`);
    if (!contentContainer) {
        console.warn(`未找到设置容器: ${settingId}Settings`);
        return;
    }
    
    // 清空现有内容
    contentContainer.innerHTML = '';
    
    // 生成字段HTML
    fields.forEach(field => {
        const fieldHtml = generateFieldHtml(field);
        contentContainer.insertAdjacentHTML('beforeend', fieldHtml);
    });
    
    // console.log(`✅ 已更新 ${settingId} 设置UI显示`);
};

// 生成单个字段的HTML
const generateFieldHtml = (field) => {
    const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
    let valueHtml = '';
    
    if (field.type === 'password') {
        // 密文显示
        const maskedValue = '*'.repeat(Math.min(field.value.length, 12));
        valueHtml = `
            <div class="field-value password-field" id="${fieldId}">
                <span class="masked-value">${maskedValue}</span>
                <span class="real-value" style="display: none;">${field.value}</span>
                <button class="toggle-visibility-btn" onclick="toggleFieldVisibility('${fieldId}')">
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
            <button class="copy-field-btn" onclick="copyFieldValue('${fieldId}', '${field.type}')">
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
};

// 切换字段可见性
window.toggleFieldVisibility = (fieldId) => {
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
};

// 复制字段值
window.copyFieldValue = (fieldId, fieldType) => {
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
};

// 导出主要函数供外部使用
window.createSettingsOverlay = createSettingsOverlay;
window.setupSettingsOverlayEvents = setupSettingsOverlayEvents;
window.initSettingsPage = initSettingsPage;
window.overlayManager = overlayManager;
window.testMicrophone = testMicrophone;
window.initMicrophoneSettings = initMicrophoneSettings;
window.saveMicrophoneConfig = saveMicrophoneConfig;
