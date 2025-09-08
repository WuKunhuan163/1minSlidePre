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
            <div class="setting-card clickable-card" id="microphoneCard">
                <div class="new-badge badge-base" id="microphoneNewBadge">NEW</div>
                <div class="reconfig-badge badge-base" id="microphoneReconfigBadge" style="display: none;">点击重新配置</div>
                <div class="setting-card-header">
                    <i class='bx bx-microphone-alt'></i>
                    <h3>录音设备</h3>
                    <div class="setting-toggle">
                        <input type="checkbox" id="microphoneToggle" class="toggle-input" disabled>
                        <label for="microphoneToggle" class="toggle-label"></label>
                    </div>
                </div>
                <div class="setting-card-content" id="microphoneSettings">
                    <!-- 内容将由overlay处理 -->
                </div>
            </div>

            <div class="setting-card clickable-card" id="recordingCard" style="display: none;">
                <div class="new-badge badge-base" id="recordingNewBadge" style="display: none;">NEW</div>
                <div class="reconfig-badge badge-base" id="recordingReconfigBadge" style="display: none;">点击重新配置</div>
                <div class="setting-card-header">
                    <i class='bx bx-microphone'></i>
                    <h3>录音文字识别</h3>
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
                <div class="new-badge badge-base" id="aiNewBadge" style="display: none;">NEW</div>
                <div class="reconfig-badge badge-base" id="aiReconfigBadge" style="display: none;">点击重新配置</div>
                <div class="setting-card-header">
                    <i class='bx bx-brain'></i>
                    <h3>智谱AI评分</h3>
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
    margin: 0 60px;
    overflow-y: scroll; 
    padding: 10px;
}

/* 设置页面滚动条样式 */
.settings-container::-webkit-scrollbar {
    width: 6px;
}

.settings-container::-webkit-scrollbar-track {
    background: #2a2a2a;
}

.settings-container::-webkit-scrollbar-thumb {
    background: #666AF6;
    border-radius: 3px;
}

.settings-container::-webkit-scrollbar-thumb:hover {
    background: #5a5ee6;
}

@media (max-width: 500px) {
    .settings-container {
        margin: 0 auto;
    }
}

.setting-card {
    width: 100%;
    min-width: 300px;
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
    margin-left: 20px;
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
    padding: 0 0 0 20px;
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

/* 录音设备设置样式 */
.device-select {
    width: 100%;
    padding: 12px;
    background: #333;
    border: 1px solid #555;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    transition: border-color 0.3s ease;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 12px;
    padding-right: 40px;
}

.device-select:focus {
    outline: none;
    border-color: #666AF6;
}

.device-select option {
    background: #333;
    color: white;
}

.audio-test-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.volume-meter {
    display: flex;
    align-items: center;
    gap: 10px;
}

.volume-bar {
    flex: 1;
    height: 8px;
    background: #333;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.volume-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
    width: 0%;
    transition: width 0.1s ease;
    border-radius: 4px;
}

.volume-text {
    color: #ccc;
    font-size: 12px;
    min-width: 60px;
}

.audio-test-section.testing .test-button {
    background: #dc3545;
    color: white;
}

.audio-test-section.testing .test-button:hover {
    background: #c82333;
}

/* 通用badge基础样式 */
.badge-base {
    position: absolute;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 10;
    text-align: center;
    white-space: nowrap;
    transition: all 0.3s ease;
}

/* NEW badge样式 */
.new-badge {
    top: -5px;
    left: -5px;
    background: #ff4444;
    animation: newBadgePulse 2s infinite;
    box-shadow: 0 2px 8px rgba(255, 68, 68, 0.4);
}

/* 重新配置badge样式 */
.reconfig-badge {
    top: -5px;
    left: -5px;
    background: #666AF6;
    animation: reconfigBadgePulse 2s infinite;
    box-shadow: 0 2px 8px rgba(102, 106, 246, 0.4);
}

/* NEW badge动画 */
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

/* 重新配置badge动画 */
@keyframes reconfigBadgePulse {
    0%, 100% { 
        transform: scale(1); 
        box-shadow: 0 2px 8px rgba(102, 106, 246, 0.4);
    }
    50% { 
        transform: scale(1.1); 
        box-shadow: 0 4px 16px rgba(102, 106, 246, 0.8);
    }
}

/* 主菜单NEW badge样式 */
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
            
            // 使用统一的事件设置函数
            setupSettingsOverlayEvents(overlay);
        });
    } else {
        console.warn('设置按钮未找到');
    }
    } catch (error) {
        console.error('❌ 设置页面初始化失败:', error);
    }
};

console.log('📱 设置页面模板已加载');

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
    
    // 获取所有必要的元素
            const microphoneToggle = overlay.querySelector('#microphoneToggle');
            const recordingToggle = overlay.querySelector('#recordingToggle');
            const aiToggle = overlay.querySelector('#aiToggle');
            const microphoneSettings = overlay.querySelector('#microphoneSettings');
            const recordingSettings = overlay.querySelector('#recordingSettings');
            const aiSettings = overlay.querySelector('#aiSettings');
            const audioInputSelect = overlay.querySelector('#audioInputSelect');
            
    // 录音文字识别设置卡片点击事件（只为装饰，实际通过header进入设置）
            const recordingCard = overlay.querySelector('#recordingCard');
            if (recordingCard) {
        
        // 禁用toggle功能，只作装饰
        if (recordingToggle) {
            recordingToggle.disabled = true;
            recordingToggle.style.pointerEvents = 'none';
            recordingToggle.style.opacity = '0.7';
        }
        
        // 只为header区域添加点击事件
        const recordingHeader = recordingCard.querySelector('.setting-card-header');
        if (recordingHeader) {
            recordingHeader.addEventListener('click', (e) => {
                console.log('🖱️ 录音设置header被点击');
                
                // 直接进入录音设置，不管当前状态
                console.log('🔄 进入录音设置页面');
                overlay.remove();
                const audioSetupOverlay = createAudioSetupOverlay();
                
                // 添加返回按钮事件
                audioSetupOverlay.querySelector('.back-button').addEventListener('click', () => {
                    console.log('🔙 从录音设置返回');
                    const newSettingsOverlay = createSettingsOverlay();
                    setupSettingsOverlayEvents(newSettingsOverlay);
                    overlayManager.switchToOverlay(newSettingsOverlay);
                });
            });
        }
    }
    
    // 录音设备卡片点击事件
    const microphoneCard = overlay.querySelector('#microphoneCard');
    if (microphoneCard) {
        const microphoneHeader = microphoneCard.querySelector('.setting-card-header');
        if (microphoneHeader) {
            microphoneHeader.addEventListener('click', (e) => {
                console.log('🖱️ 录音设备header被点击');
                
                // 进入录音设备设置页面
                console.log('🔄 进入录音设备设置页面');
                overlay.remove();
                const microphoneSetupOverlay = createMicrophoneSetupOverlay();
                
                // 不需要返回事件，因为已在createMicrophoneSetupOverlay中处理
            });
        }
    }
    
    // AI设置卡片点击事件（只为装饰，实际通过header进入设置）
    const aiCard = overlay.querySelector('#aiCard');
    if (aiCard) {
        
        // 禁用toggle功能，只作装饰
        if (aiToggle) {
            aiToggle.disabled = true;
            aiToggle.style.pointerEvents = 'none';
            aiToggle.style.opacity = '0.7';
        }
        
        // 只为header区域添加点击事件
        const aiHeader = aiCard.querySelector('.setting-card-header');
        if (aiHeader) {
            aiHeader.addEventListener('click', (e) => {
                console.log('🖱️ AI设置header被点击');
                
                // 直接进入AI设置，不管当前状态
                console.log('🔄 进入AI设置页面');
                overlay.remove();
                const aiSetupOverlay = createAISetupOverlay();
                
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
    } else {
        // iOS系统隐藏音量设置卡片
        if (effectsVolumeCard) effectsVolumeCard.style.display = 'none';
        if (backgroundMusicCard) backgroundMusicCard.style.display = 'none';
    }
    
        // 更新其他UI状态
        updateNewBadges(overlay);
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
        if (microphoneConfig) {
            const config = JSON.parse(microphoneConfig);
            const microphoneToggle = document.getElementById('microphoneToggle');
            const audioInputSelect = document.getElementById('audioInputSelect');
            
            if (microphoneToggle) {
                microphoneToggle.checked = config.enabled || false;
            }
            
            if (audioInputSelect && config.selectedDeviceId) {
                audioInputSelect.value = config.selectedDeviceId;
            }
            
            // 如果已配置，显示录音文字识别卡片
            if (config.enabled) {
                showRecordingCard();
            }
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

// 导出主要函数供外部使用
window.createSettingsOverlay = createSettingsOverlay;
window.setupSettingsOverlayEvents = setupSettingsOverlayEvents;
window.initSettingsPage = initSettingsPage;
window.overlayManager = overlayManager;
window.testMicrophone = testMicrophone;
window.initMicrophoneSettings = initMicrophoneSettings;
window.saveMicrophoneConfig = saveMicrophoneConfig;
