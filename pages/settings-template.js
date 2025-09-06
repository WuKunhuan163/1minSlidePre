/**
 * 设置页面模板 - 使用与PPT上传页面相同的风格
 */

// 创建设置页面覆盖层
const createSettingsOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'slides-overlay'; // 复用PPT页面的样式
    
    overlay.innerHTML = `
        <div class="slides-header">
            <button class="back-button">
                <i class='bx bx-arrow-back'></i>
            </button>
            <h2>系统设置</h2>
        </div>
        <div class="settings-container">
            <div class="setting-card clickable-card" id="recordingCard">
                <div class="new-badge" id="recordingNewBadge" style="display: none;">NEW</div>
                <div class="setting-card-header">
                    <i class='bx bx-microphone'></i>
                    <h3>录音文字识别</h3>
                    <div class="config-hint" id="recordingConfigHint" style="display: none;">
                        <span>点击重新配置</span>
                    </div>
                    <div class="setting-toggle">
                        <input type="checkbox" id="recordingToggle" class="toggle-input">
                        <label for="recordingToggle" class="toggle-label"></label>
                    </div>
                </div>
                <div class="setting-card-content" id="recordingSettings">
                    <div class="setting-field">
                        <label>App Key</label>
                        <input type="text" id="appKey" placeholder="请输入阿里云App Key">
                    </div>
                    <div class="setting-field">
                        <label>AccessKey ID</label>
                        <input type="text" id="accessKeyId" placeholder="请输入Access Key ID">
                    </div>
                    <div class="setting-field">
                        <label>AccessKey Secret</label>
                        <input type="password" id="accessKeySecret" placeholder="请输入Access Key Secret">
                    </div>
                </div>
            </div>

            <div class="setting-card clickable-card" id="aiCard">
                <div class="new-badge" id="aiNewBadge" style="display: none;">NEW</div>
                <div class="setting-card-header">
                    <i class='bx bx-brain'></i>
                    <h3>智谱AI评分</h3>
                    <div class="config-hint" id="aiConfigHint" style="display: none;">
                        <span>点击重新配置</span>
                    </div>
                    <div class="setting-toggle">
                        <input type="checkbox" id="aiToggle" class="toggle-input">
                        <label for="aiToggle" class="toggle-label"></label>
                    </div>
                </div>
                <div class="setting-card-content" id="aiSettings">
                    <div class="setting-field">
                        <label>智谱AI API Key</label>
                        <input type="password" id="zhipuApiKey" placeholder="请输入智谱AI API Key">
                    </div>
                </div>
            </div>

            <div class="setting-card volume-card" id="effectsVolumeCard">
                <div class="setting-card-header volume-header">
                    <i class='bx bx-volume-full'></i>
                    <h3>计时音效音量</h3>
                    <div class="inline-volume-control" id="effects-volume-control">
                        <!-- 计时音效滑动条将通过JavaScript动态生成 -->
                    </div>
                </div>
            </div>
            
            <div class="setting-card volume-card" id="backgroundMusicCard">
                <div class="setting-card-header volume-header">
                    <i class='bx bx-music'></i>
                    <h3>背景音乐音量</h3>
                    <div class="inline-volume-control" id="background-music-control">
                        <!-- 背景音乐滑动条将通过JavaScript动态生成 -->
                    </div>
                </div>
            </div>

            <div class="settings-footer">
                <p>音效素材下载自<a href="https://www.aigei.com/" target="_blank">爱给</a></p>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
};

// 设置页面的样式（添加到现有CSS中）
const settingsStyles = `
.settings-container {
    max-width: 600px;
    margin: 0 auto;
}

.setting-card {
    background: #1a1a1a;
    margin-bottom: 20px;
    overflow: visible;
    transition: all 0.3s ease;
    position: relative;
    border: 1px solid #333;
    border-radius: 12px;
}

.setting-card:hover {
    border-color: #555;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.setting-card-header {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #222;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
    border: 1px solid #333;
    border-radius: 12px;
}

.setting-card:hover .setting-card-header {
    background: #666AF666;
}

.setting-card.clickable-card {
    cursor: pointer;
}

.config-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: white;
    opacity: 0.8;
    transition: all 0.3s ease;
    margin-right: 10px;
    font-weight: 500;
}

.setting-card.clickable-card:hover .config-hint {
    opacity: 1;
    transform: translateX(-2px);
}

.volume-card:hover .setting-card-header {
    background: #222 !important;
}

.setting-card-header i {
    font-size: 24px;
    color: #666AF6;
    margin-right: 15px;
}

.setting-card-header h3 {
    color: white;
    font-size: 16px;
    font-weight: normal;
    flex: 1;
    margin: 0;
}

.setting-toggle {
    position: relative;
}

.toggle-input {
    display: none;
}

.toggle-label {
    display: block;
    width: 50px;
    height: 24px;
    background: #333;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s ease;
}

.toggle-label::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-label {
    background: #666AF6;
}

.toggle-input:checked + .toggle-label::after {
    transform: translateX(26px);
}

.setting-card-content {
    padding: 0 20px;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
}

.setting-card-content.expanded {
    padding: 20px;
    max-height: 300px;
}

.setting-field {
    margin-bottom: 15px;
}

.setting-field:last-child {
    margin-bottom: 0;
}

.setting-field label {
    display: block;
    color: #ccc;
    font-size: 14px;
    margin-bottom: 8px;
}

.setting-field input {
    width: 100%;
    padding: 12px;
    background: #333;
    border: 1px solid #555;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    transition: border-color 0.3s ease;
}

.setting-field input:focus {
    outline: none;
    border-color: #666AF6;
}

.settings-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
}

.save-button, .test-button {
    padding: 12px 30px;
    border: none;
    border-radius: 25px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.save-button {
    background: #333;
    color: white;
    border: none;
}

.save-button:hover {
    background: #666AF6;
    color: white;
    transform: translateY(-2px);
}

.test-button {
    background: #333;
    color: white;
    border: none;
}

.test-button:hover {
    background: #666AF6;
    color: white;
    transform: translateY(-2px);
}

.settings-footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #333;
}

.settings-footer p {
    color: #666;
    font-size: 12px;
    margin: 0;
}

.settings-footer a {
    color: #666AF6;
    text-decoration: none;
}

.settings-footer a:hover {
    text-decoration: underline;
}

.volume-control-content {
    padding: 15px 0;
}

.volume-header {
    justify-content: flex-start !important;
    align-items: center !important;
    gap: 15px !important;
}

.volume-header i {
    margin-right: 0 !important;
}

.volume-header h3 {
    flex: none;
    margin: 0;
}

.inline-volume-control {
    flex: 1;
    padding: 0 20px;
}

.inline-volume-slider {
    width: 100%;
    height: 6px;
    appearance: none;
    -webkit-appearance: none;
    background: #333;
    border-radius: 3px;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer;
}

.inline-volume-slider.editing {
    background: linear-gradient(to right, #666AF6 var(--volume-percentage, 50%), #333 var(--volume-percentage, 50%));
    box-shadow: 0 0 8px rgba(102, 106, 246, 0.4);
}

.inline-volume-slider:not(.editing) {
    background: linear-gradient(to right, #ccc var(--volume-percentage, 50%), #333 var(--volume-percentage, 50%));
}

.inline-volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.inline-volume-slider.editing::-webkit-slider-thumb {
    background: white;
    box-shadow: 0 0 12px rgba(102, 106, 246, 0.8), 0 2px 4px rgba(0,0,0,0.2);
    transform: scale(1.1);
}

.inline-volume-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.inline-volume-slider.editing::-moz-range-thumb {
    background: white;
    box-shadow: 0 0 12px rgba(102, 106, 246, 0.8), 0 2px 4px rgba(0,0,0,0.2);
    transform: scale(1.1);
}

.new-badge {
    position: absolute;
    top: -5px;
    left: -5px;
    background: #ff4444;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 10;
    animation: newBadgePulse 2s infinite;
    box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
}

@keyframes newBadgePulse {
    0%, 100% { 
        transform: scale(1); 
        box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
    }
    50% { 
        transform: scale(1.1); 
        box-shadow: 0 4px 16px rgba(255, 68, 68, 0.8);
    }
}

.main-new-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff4444;
    color: white;
    font-size: 9px;
    font-weight: bold;
    padding: 3px 6px;
    border-radius: 10px;
    z-index: 10;
    animation: newBadgePulse 2s infinite;
    box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
}
`;

// 将样式添加到页面
const addSettingsStyles = () => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = settingsStyles;
    document.head.appendChild(styleSheet);
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
    const recordingBadge = overlay.querySelector('#recordingNewBadge');
    const aiBadge = overlay.querySelector('#aiNewBadge');
    
    if (simpleConfig.isSettingNew('recording')) {
        recordingBadge.style.display = 'block';
    } else {
        recordingBadge.style.display = 'none';
    }
    
    if (simpleConfig.isSettingNew('ai')) {
        aiBadge.style.display = 'block';
    } else {
        aiBadge.style.display = 'none';
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

// 更新配置提示
const updateConfigHints = (overlay) => {
    const recordingConfigHint = overlay.querySelector('#recordingConfigHint');
    const aiConfigHint = overlay.querySelector('#aiConfigHint');
    const currentConfig = simpleConfig.getAll();
    
    console.log('🔍 更新配置提示');
    console.log('录音功能状态:', currentConfig.recordingEnabled);
    console.log('智谱AI功能状态:', currentConfig.aiEnabled);
    console.log('录音配置提示元素:', recordingConfigHint);
    console.log('智谱AI配置提示元素:', aiConfigHint);
    
    // 如果录音功能已启用，显示重新配置提示
    if (currentConfig.recordingEnabled) {
        if (recordingConfigHint) {
            recordingConfigHint.style.display = 'flex';
            console.log('✅ 显示录音配置提示');
        } else {
            console.log('❌ 录音配置提示元素未找到');
        }
    } else {
        if (recordingConfigHint) {
            recordingConfigHint.style.display = 'none';
            console.log('❌ 隐藏录音配置提示（录音功能未启用）');
        }
    }
    
    // 如果智谱AI功能已启用，显示重新配置提示
    if (currentConfig.aiEnabled) {
        if (aiConfigHint) {
            aiConfigHint.style.display = 'flex';
            console.log('✅ 显示智谱AI配置提示');
        } else {
            console.log('❌ 智谱AI配置提示元素未找到');
        }
    } else {
        if (aiConfigHint) {
            aiConfigHint.style.display = 'none';
            console.log('❌ 隐藏智谱AI配置提示（智谱AI功能未启用）');
        }
    }
};

// 初始化设置页面功能
const initSettingsPage = () => {
    try {
        addSettingsStyles();
        
        // 更新主菜单设置按钮的NEW标识
        updateMainSettingsButton();
    
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
            
            // 返回按钮事件
            overlay.querySelector('.back-button').addEventListener('click', () => {
                console.log('🔙 点击设置页面的返回按钮，回到主菜单');
                console.log('🔙 当前录音状态:', simpleConfig.get('recordingEnabled'));
                overlay.remove();
            });
            
            // 切换开关事件
            const recordingToggle = overlay.querySelector('#recordingToggle');
            const aiToggle = overlay.querySelector('#aiToggle');
            const recordingSettings = overlay.querySelector('#recordingSettings');
            const aiSettings = overlay.querySelector('#aiSettings');
            
            // 录音设置卡片整体点击事件
            const recordingCard = overlay.querySelector('.setting-card:first-child');
            console.log('🔍 查找录音设置卡片:', recordingCard);
            console.log('📋 所有设置卡片:', overlay.querySelectorAll('.setting-card'));
            
            if (recordingCard) {
                console.log('✅ 录音设置卡片找到，添加点击事件');
                
                // 手动添加clickable-card类（以防万一）
                recordingCard.classList.add('clickable-card');
                
                // 添加hover调试事件
                recordingCard.addEventListener('mouseenter', () => {
                    console.log('🖱️ 鼠标悬停在录音设置卡片上');
                    console.log('录音卡片元素:', recordingCard);
                    console.log('录音功能状态:', simpleConfig.get('recordingEnabled'));
                });
                
                recordingCard.addEventListener('mouseleave', () => {
                    console.log('🖱️ 鼠标离开录音设置卡片');
                });
                
                recordingCard.addEventListener('click', (e) => {
                console.log('🖱️ 录音设置卡片被点击');
                console.log('点击目标:', e.target);
                console.log('是否点击toggle:', e.target.closest('.setting-toggle'));
                
                // 如果点击的不是toggle开关本身，则进入详细设置
                if (!e.target.closest('.setting-toggle')) {
                    console.log('✅ 不是点击toggle，准备进入详细设置');
                    console.log('📊 当前录音状态:', simpleConfig.get('recordingEnabled'));
                    console.log('📊 完整配置:', simpleConfig.getAll());
                    console.log('📊 是否有recordingEnabled:', simpleConfig.get('recordingEnabled') !== undefined);
                    console.log('📊 recordingEnabled类型:', typeof simpleConfig.get('recordingEnabled'));
                    
                    // 检查是否有任何阻止进入的条件
                    const recordingEnabled = simpleConfig.get('recordingEnabled');
                    if (recordingEnabled === true) {
                        console.log('🔍 录音功能已启用，应该允许重新配置');
                    } else if (recordingEnabled === false) {
                        console.log('🔍 录音功能未启用，应该允许首次配置');
                    } else {
                        console.log('🔍 录音功能状态未定义，应该允许配置');
                    }
                    
                    // 无论录音功能是否已启用，都可以进入详细设置页面重新配置
                    console.log('🔄 关闭当前设置页，打开详细设置');
                    overlay.remove(); // 关闭当前设置页
                    console.log('✅ 当前设置页已关闭');
                    
                    const audioSetupOverlay = createAudioSetupOverlay(); // 打开详细设置
                    console.log('✅ 详细设置页面已创建:', audioSetupOverlay);
                    
                    // 添加返回按钮事件 - 返回设置页面
                    audioSetupOverlay.querySelector('.back-button').addEventListener('click', () => {
                        console.log('🔙 点击返回按钮，关闭详细设置页');
                        audioSetupOverlay.remove(); // 关闭录音设置页
                        // 重新打开设置页面
                        setTimeout(() => {
                            console.log('🔄 重新打开设置页面');
                            const settingsButton = document.querySelector('.settings-button');
                            if (settingsButton) {
                                settingsButton.click(); // 重新触发设置页面打开
                            }
                        }, 100);
                    });
                } else {
                    console.log('❌ 点击了toggle开关，不进入详细设置');
                }
                });
            } else {
                console.log('❌ 录音设置卡片未找到');
            }
            
            recordingToggle.addEventListener('change', () => {
                if (recordingToggle.checked) {
                    // 如果是从关闭切换到开启，进入详细设置界面
                    if (!simpleConfig.get('recordingEnabled')) {
                        recordingToggle.checked = false; // 先取消选中
                        overlay.remove(); // 关闭当前设置页
                        const audioSetupOverlay = createAudioSetupOverlay(); // 打开详细设置
                        
                        // 添加返回按钮事件 - 返回设置页面
                        audioSetupOverlay.querySelector('.back-button').addEventListener('click', () => {
                            audioSetupOverlay.remove(); // 关闭录音设置页
                            // 重新打开设置页面
                            setTimeout(() => {
                                const settingsButton = document.querySelector('.settings-button');
                                if (settingsButton) {
                                    settingsButton.click(); // 重新触发设置页面打开
                                }
                            }, 100);
                        });
                        return;
                    }
                    recordingSettings.classList.add('expanded');
                } else {
                    // 关闭录音功能时需要确认
                    const shouldDisable = confirm('⚠️ 确定要关闭录音文字识别功能吗？\n\n关闭后将同时导致智谱AI评分功能失效，因为AI评分需要基于语音识别的文字内容。\n\n点击"确定"关闭，点击"取消"保持开启。');
                    
                    if (shouldDisable) {
                        recordingSettings.classList.remove('expanded');
                        // 禁用录音功能
                        simpleConfig.set('recordingEnabled', false);
                        
                        // 同时禁用智谱AI功能
                        const aiToggle = overlay.querySelector('#aiToggle');
                        if (aiToggle && aiToggle.checked) {
                            aiToggle.checked = false;
                            simpleConfig.set('aiEnabled', false);
                            const aiSettings = overlay.querySelector('#aiSettings');
                            if (aiSettings) {
                                aiSettings.classList.remove('expanded');
                            }
                            console.log('📢 录音功能关闭，同时关闭智谱AI功能');
                        }
                    } else {
                        // 用户取消，恢复toggle状态
                        recordingToggle.checked = true;
                    }
                }
            });
            
            // 智谱AI设置卡片整体点击事件
            const aiCard = overlay.querySelector('#aiCard');
            if (aiCard) {
                console.log('✅ 智谱AI设置卡片找到，添加点击事件');
                
                // 手动添加clickable-card类
                aiCard.classList.add('clickable-card');
                
                aiCard.addEventListener('click', (e) => {
                    console.log('🖱️ 智谱AI设置卡片被点击');
                    console.log('点击目标:', e.target);
                    console.log('是否点击toggle:', e.target.closest('.setting-toggle'));
                    
                    // 如果点击的不是toggle开关本身，则进入详细设置
                    if (!e.target.closest('.setting-toggle')) {
                        console.log('✅ 不是点击toggle，准备进入智谱AI详细设置');
                        console.log('📊 当前智谱AI状态:', simpleConfig.get('aiEnabled'));
                        
                        // 测试createAISetupOverlay函数是否存在
                        console.log('🔍 检查createAISetupOverlay函数:', typeof createAISetupOverlay);
                        console.log('🔍 检查window.createAISetupOverlay函数:', typeof window.createAISetupOverlay);
                        
                        // 无论智谱AI功能是否已启用，都可以进入详细设置页面重新配置
                        console.log('🔄 关闭当前设置页，打开智谱AI详细设置');
                        overlay.remove(); // 关闭当前设置页
                        console.log('✅ 当前设置页已关闭');
                        
                        let aiSetupOverlay;
                        try {
                            aiSetupOverlay = createAISetupOverlay(); // 打开智谱AI详细设置
                            console.log('✅ 智谱AI详细设置页面已创建:', aiSetupOverlay);
                        } catch (error) {
                            console.error('❌ 创建智谱AI设置页面失败:', error);
                            console.error('错误堆栈:', error.stack);
                            alert('创建智谱AI设置页面失败: ' + error.message);
                            return;
                        }
                        
                        // 添加返回按钮事件 - 返回设置页面
                        if (aiSetupOverlay && aiSetupOverlay.querySelector('.back-button')) {
                            aiSetupOverlay.querySelector('.back-button').addEventListener('click', () => {
                            console.log('🔙 点击返回按钮，关闭智谱AI详细设置页');
                            aiSetupOverlay.remove(); // 关闭智谱AI设置页
                            // 重新打开设置页面
                            setTimeout(() => {
                                console.log('🔄 重新打开设置页面');
                                const settingsButton = document.querySelector('.settings-button');
                                if (settingsButton) {
                                    settingsButton.click(); // 重新触发设置页面打开
                                }
                            }, 100);
                            });
                        }
                    } else {
                        console.log('❌ 点击了toggle开关，不进入详细设置');
                    }
                });
            } else {
                console.log('❌ 智谱AI设置卡片未找到');
            }
            
            aiToggle.addEventListener('change', () => {
                if (aiToggle.checked) {
                    aiSettings.classList.add('expanded');
                } else {
                    // 关闭智谱AI功能时需要确认
                    const shouldDisable = confirm('⚠️ 确定要关闭智谱AI评分功能吗？\n\n点击"确定"关闭，点击"取消"保持开启。');
                    
                    if (shouldDisable) {
                        aiSettings.classList.remove('expanded');
                        // 禁用智谱AI功能
                        simpleConfig.set('aiEnabled', false);
                    } else {
                        // 用户取消，恢复toggle状态
                        aiToggle.checked = true;
                    }
                }
            });
            
            // 检测系统并显示音量设置卡片
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const effectsVolumeCard = overlay.querySelector('#effectsVolumeCard');
            const backgroundMusicCard = overlay.querySelector('#backgroundMusicCard');
            
            if (!isIOS) {
                // 非iOS系统显示音量设置卡片
                if (effectsVolumeCard) effectsVolumeCard.style.display = 'block';
                if (backgroundMusicCard) backgroundMusicCard.style.display = 'block';
                initEffectsVolumeControl(overlay);
                initBackgroundMusicVolumeControl(overlay);
            }
            
            // 加载现有配置
            const currentConfig = simpleConfig.getAll();
            recordingToggle.checked = currentConfig.recordingEnabled || false;
            aiToggle.checked = currentConfig.aiEnabled || false;
            
            // 更新NEW标识显示
            updateNewBadges(overlay);
            
            // 更新配置提示
            updateConfigHints(overlay);
            
            // 手动显示配置提示（如果录音功能已启用）
            if (currentConfig.recordingEnabled) {
                const recordingConfigHint = overlay.querySelector('#recordingConfigHint');
                console.log('🔍 手动查找配置提示元素:', recordingConfigHint);
                if (recordingConfigHint) {
                    recordingConfigHint.style.display = 'flex';
                    console.log('✅ 手动显示配置提示');
                } else {
                    console.log('❌ 配置提示元素未找到，手动创建');
                    // 手动创建配置提示元素
                    const recordingHeader = overlay.querySelector('#recordingCard .setting-card-header h3');
                    if (recordingHeader) {
                        const configHint = document.createElement('div');
                        configHint.className = 'config-hint';
                        configHint.id = 'recordingConfigHint';
                        configHint.style.display = 'flex';
                        configHint.innerHTML = '<span>点击重新配置</span>';
                        recordingHeader.parentNode.insertBefore(configHint, recordingHeader.nextSibling);
                        console.log('✅ 配置提示元素已手动创建');
                    }
                }
            }
            
            if (recordingToggle.checked) recordingSettings.classList.add('expanded');
            if (aiToggle.checked) aiSettings.classList.add('expanded');
            
            overlay.querySelector('#appKey').value = currentConfig.appKey || '';
            overlay.querySelector('#accessKeyId').value = currentConfig.accessKeyId || '';
            overlay.querySelector('#accessKeySecret').value = currentConfig.accessKeySecret || '';
            overlay.querySelector('#zhipuApiKey').value = currentConfig.zhipuApiKey || '';
        });
    } else {
        console.warn('设置按钮未找到');
    }
    } catch (error) {
        console.error('❌ 设置页面初始化失败:', error);
    }
};

console.log('📱 设置页面模板已加载');
