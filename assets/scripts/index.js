// 全局变量定义
let effectsVolume = simpleConfig.get('effectsVolume') || 0.5; // 从配置加载音量，默认50%
let effectsMuted = false;
let maxEffectsVolume = 1.0;

// PPT管理全局变量
let slides = [];
let selectedSlideIndex = -1; // 当前选中的PPT索引
let slideRequirements = {}; // 存储每张PPT的演讲要求
let slideNames = {}; // 存储每张PPT的名称

// Session存储管理器
class PPTSessionManager {
    constructor() {
        this.storageKey = 'slidePresentation_session';
    }
    
    // 保存所有PPT数据到sessionStorage
    saveToSession() {
        try {
            const sessionData = {
                slides: slides,
                slideRequirements: slideRequirements,
                slideNames: slideNames,
                selectedSlideIndex: selectedSlideIndex,
                timestamp: Date.now()
            };
            sessionStorage.setItem(this.storageKey, JSON.stringify(sessionData));
            // console.log('✅ PPT数据已保存到session');
        } catch (error) {
            console.error('❌ Session保存失败:', error);
        }
    }
    
    // 从sessionStorage恢复PPT数据
    loadFromSession() {
        try {
            const saved = sessionStorage.getItem(this.storageKey);
            if (saved) {
                const sessionData = JSON.parse(saved);
                
                // 恢复数据
                slides = sessionData.slides || [];
                slideRequirements = sessionData.slideRequirements || {};
                slideNames = sessionData.slideNames || {};
                selectedSlideIndex = sessionData.selectedSlideIndex || -1;
                
                // console.log(`✅ 已从session恢复 ${slides.length} 张PPT数据`);
                return true;
            }
        } catch (error) {
            console.error('❌ Session加载失败:', error);
        }
        return false;
    }
    
    // 清除session数据
    clearSession() {
        try {
            sessionStorage.removeItem(this.storageKey);
            // console.log('🗑️ Session数据已清除');
        } catch (error) {
            console.error('❌ Session清除失败:', error);
        }
    }
    
    // 检查是否有session数据
    hasSessionData() {
        return sessionStorage.getItem(this.storageKey) !== null;
    }
}

// 创建全局session管理器实例
const pptSession = new PPTSessionManager();

// 录音录像相关变量
let mediaRecorder = null;
let videoRecorder = null;
let audioChunks = [];
let videoChunks = [];
let audioBlob = null;
let videoBlob = null;

// 语音识别相关变量
let transcriptText = '';
let transcriptStatus = 'none'; // none, processing, success, failed, retry_failed

// 演讲状态管理器
class PresentationStatusManager {
    constructor() {
        this.microphoneStatus = 'unconfigured';
        this.cameraStatus = 'unconfigured';
        this.microphoneElement = null;
        this.cameraElement = null;
        this.microphoneDot = null;
        this.cameraDot = null;
    }

    // 初始化状态指示器元素
    initializeElements() {
        this.microphoneElement = document.getElementById('microphoneStatusText');
        this.cameraElement = document.getElementById('cameraStatusText');
        this.microphoneDot = document.getElementById('microphoneStatusDot');
        this.cameraDot = document.getElementById('cameraStatusDot');
        
        console.log('🎯 状态指示器元素初始化:', {
            microphone: !!this.microphoneElement,
            camera: !!this.cameraElement,
            micDot: !!this.microphoneDot,
            camDot: !!this.cameraDot
        });
    }

    // 更新麦克风状态
    updateMicrophoneStatus(status, text) {
        console.log(`🎤 更新麦克风状态: ${status} - ${text}`);
        this.microphoneStatus = status;
        
        if (this.microphoneElement && this.microphoneDot) {
            this.microphoneElement.textContent = text;
            this.microphoneDot.className = `status-dot ${status}`;
        }
    }

    // 更新摄像头状态
    updateCameraStatus(status, text) {
        console.log(`📹 更新摄像头状态: ${status} - ${text}`);
        this.cameraStatus = status;
        
        if (this.cameraElement && this.cameraDot) {
            this.cameraElement.textContent = text;
            this.cameraDot.className = `status-dot ${status}`;
        }
    }

    // 检查设置状态
    async checkDeviceSettings() {
        console.log('🔍 开始检查设备设置状态...');
        
        // 检查麦克风设置
        const micConfig = localStorage.getItem('microphoneConfig');
        const micConfigParsed = micConfig ? JSON.parse(micConfig) : null;
        const isMicTested = simpleConfig ? simpleConfig.isSettingTested('microphone') : false;
        
        console.log('🎤 麦克风配置检查:', {
            hasConfig: !!micConfigParsed,
            enabled: micConfigParsed?.enabled,
            tested: isMicTested
        });

        if (!micConfigParsed || !micConfigParsed.enabled || !isMicTested) {
            this.updateMicrophoneStatus('unconfigured', '未录音');
        } else {
            // 有配置，进行快速测试
            this.updateMicrophoneStatus('testing', '测试中');
            const micResult = await this.testMicrophone(micConfigParsed);
            if (micResult.success) {
                this.updateMicrophoneStatus('success', '录音');
            } else {
                this.updateMicrophoneStatus('failed', '未录音');
            }
        }

        // 检查摄像头设置
        const camConfig = localStorage.getItem('cameraConfig');
        const camConfigParsed = camConfig ? JSON.parse(camConfig) : null;
        const isCamTested = simpleConfig ? simpleConfig.isSettingTested('camera') : false;
        
        console.log('📹 摄像头配置检查:', {
            hasConfig: !!camConfigParsed,
            enabled: camConfigParsed?.enabled,
            tested: isCamTested
        });

        if (!camConfigParsed || !camConfigParsed.enabled || !isCamTested) {
            this.updateCameraStatus('unconfigured', '未录像');
        } else {
            // 有配置，进行快速测试
            this.updateCameraStatus('testing', '测试中')
            const camResult = await this.testCamera(camConfigParsed);
            if (camResult.success) {
                this.updateCameraStatus('success', '录像');
            } else {
                this.updateCameraStatus('failed', '未录像');
            }
        }
    }

    // 测试麦克风
    async testMicrophone(config) {
        try {
            console.log('🧪 开始测试麦克风...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: config.selectedDeviceId } }
            });
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ 麦克风测试成功');
            return { success: true, message: '麦克风测试通过' };
        } catch (error) {
            console.error('❌ 麦克风测试失败:', error);
            return { success: false, message: error.message };
        }
    }

    // 测试摄像头
    async testCamera(config) {
        try {
            console.log('🧪 开始测试摄像头...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: config.selectedDeviceId } }
            });
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ 摄像头测试成功');
            return { success: true, message: '摄像头测试通过' };
        } catch (error) {
            console.error('❌ 摄像头测试失败:', error);
            return { success: false, message: error.message };
        }
    }
}

// 创建全局状态管理器实例
const presentationStatusManager = new PresentationStatusManager();

// 初始化默认PPT的演讲要求（如果没有对应txt文件，则暂时没有要求）
const initializeDefaultSlideRequirements = () => {
    slides.forEach((slide, index) => {
        if (!slideRequirements.hasOwnProperty(index)) {
            // 默认PPT没有演讲要求，保持undefined
            // slideRequirements[index] 不设置，表示暂时没有要求
        }
    });
};

// 从assets/slides目录加载预设PPT文件
const loadPresetSlides = async () => {
    // console.log('📁 开始加载预设PPT文件...');
    
    try {
        // 预设文件列表（基于assets/slides目录中的实际文件）
        const presetFiles = [
            {
                name: 'Day2-1',
                image: 'assets/slides/Day2-1.jpg',
                requirement: 'assets/slides/Day2-1.requirement.txt',
                nameFile: 'assets/slides/Day2-1.name.txt'
            }
            // 可以在这里添加更多预设文件
        ];
        
        for (let i = 0; i < presetFiles.length; i++) {
            const preset = presetFiles[i];
            
            try {
                // 加载图片
                const imageResponse = await fetch(preset.image);
                if (imageResponse.ok) {
                    const imageBlob = await imageResponse.blob();
                    // 使用Data URL而不是Blob URL，确保页面刷新后仍然有效
                    const imageUrl = await blobToDataURL(imageBlob);
                    slides.push(imageUrl);
                    
                    // console.log(`✅ 已加载图片: ${preset.name} (使用Data URL)`);
                } else {
                    console.warn(`⚠️ 无法加载图片: ${preset.image}`);
                    continue;
                }
                
                // 加载演讲要求文件
                try {
                    const reqResponse = await fetch(preset.requirement);
                    if (reqResponse.ok) {
                        const requirements = await reqResponse.text();
                        const trimmedRequirements = requirements.trim();
                        slideRequirements[i] = truncateText(trimmedRequirements, 4096);
                        // console.log(`✅ 已加载要求文件: ${preset.name}.requirement.txt`);
                    }
                } catch (reqError) {
                    console.warn(`⚠️ 无法加载要求文件: ${preset.requirement}`, reqError);
                }
                
                // 加载名称文件
                try {
                    const nameResponse = await fetch(preset.nameFile);
                    if (nameResponse.ok) {
                        const nameContent = await nameResponse.text();
                        const firstName = nameContent.split('\n')[0].trim();
                        slideNames[i] = firstName || preset.name;
                        // console.log(`✅ 已加载名称文件: ${preset.name}.name.txt`);
                    }
                } catch (nameError) {
                    console.warn(`⚠️ 无法加载名称文件: ${preset.nameFile}`, nameError);
                    slideNames[i] = preset.name; // 使用默认名称
                }
                
            } catch (error) {
                console.error(`❌ 加载预设PPT失败: ${preset.name}`, error);
            }
        }
        
        // console.log(`✅ 预设PPT加载完成，共加载 ${slides.length} 张PPT`);
        
        // 保存到session
        pptSession.saveToSession();
        
        return slides.length > 0;
        
    } catch (error) {
        console.error('❌ 加载预设PPT时发生错误:', error);
        return false;
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    // 尝试从session恢复数据
    const hasSessionData = pptSession.loadFromSession();
    
    if (!hasSessionData) {
        // 如果没有session数据，尝试加载预设PPT文件
        // console.log('📁 没有session数据，尝试加载预设PPT...');
        const presetLoaded = await loadPresetSlides();
        
        if (!presetLoaded) {
            // 如果预设PPT加载失败，初始化默认PPT的演讲要求
            // console.log('📁 预设PPT加载失败，使用默认初始化');
            initializeDefaultSlideRequirements();
        }
    } else {
        // 如果恢复了session数据，在页面加载完成后重新渲染缩略图
        setTimeout(() => {
            const overlay = document.querySelector('.slides-overlay');
            if (overlay && slides.length > 0) {
                window.renderThumbnails(overlay);
                // console.log(`🔄 已重新渲染 ${slides.length} 张PPT缩略图`);
            }
        }, 500);
    }
    
    const customSelect = document.querySelector('.custom-select');
    const selectHeader = customSelect.querySelector('.select-header');
    const selectedValue = customSelect.querySelector('.selected-value');
    const modeOptions = customSelect.querySelectorAll('.mode-option');
    let presentationTime = 10; // 演讲时间（秒数）
    
    // 时间转换函数：将秒数X转换为文字描述Y
    const formatTimeToText = (seconds) => {
        if (seconds < 60) {
            return `${seconds}秒`;
        } else if (seconds === 60) {
            return '1分钟';
        } else if (seconds % 60 === 0) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}分钟`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}分${remainingSeconds}秒`;
        }
    };
    
    // 更新演讲标题的函数
    const updatePresentationTitle = () => {
        const titleElement = document.getElementById('presentationTitle');
        if (titleElement) {
            titleElement.textContent = `${formatTimeToText(presentationTime)}即兴演讲`;
        }
    };
    
    // 更新按钮可见性的函数
    const updateButtonVisibility = (selectedMode) => {
        console.log('🎛️ 更新按钮可见性，选择的模式:', selectedMode);
        
        if (selectedMode === 'trainer' || selectedMode === '讲师训') {
            // 讲师训模式：显示所有按钮
            uploadButton.style.display = 'block';
            startButton.style.display = 'block';
            settingsButton.style.display = 'block';
            console.log('✅ 讲师训模式：显示所有按钮');
        } else {
            // 其他模式：只显示设置按钮
            uploadButton.style.display = 'none';
            startButton.style.display = 'none';
            settingsButton.style.display = 'block';
            console.log('✅ 其他模式：只显示设置按钮');
        }
    };
    
    // 初始化按钮可见性（默认不显示上传PPT和开始演讲按钮）
    updateButtonVisibility('other');

    let isIOSFunction = () => {
        const userAgent = window.navigator.userAgent;
        let result = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        // console.log(result ? "The device is iOS" : "The device is not iOS");
        return result;
    };
    let isIOS = isIOSFunction();

    // Select functionality
    selectHeader.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    modeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const modeValue = option.getAttribute('data-value');
            const modeText = option.textContent;
            
            console.log('🎛️ 模式选择:', { value: modeValue, text: modeText });
            
            // 根据选择的模式设置录音时长（秒数）
            if (modeText.includes('1分钟')) {
                presentationTime = 60;
            } else if (modeText.includes('30秒')) {
                presentationTime = 30;
            } else if (modeText.includes('2分钟')) {
                presentationTime = 120;
            } else {
                presentationTime = 60; // 默认1分钟（60秒）
            }
            
            // 更新选中的模式文本
            selectedValue.textContent = modeText;
            customSelect.classList.remove('open');
            
            // 更新按钮可见性
            updateButtonVisibility(modeValue);
            
            // 更新演讲标题
            updatePresentationTitle();
        });
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // 获取按钮元素
    const uploadButton = document.getElementById('uploadButton');
    const startButton = document.getElementById('startButton');
    const settingsButton = document.getElementById('settingsButton');
    
    // Render thumbnails - 全局函数
    window.renderThumbnails = (container) => {
        const thumbnailsContainer = container.querySelector('.thumbnails-container-scroll');
        if (!thumbnailsContainer) {
            console.warn('⚠️ thumbnailsContainer not found in renderThumbnails');
            return;
        }
        
        const addButton = thumbnailsContainer.querySelector('.add-slide');
        
        // Clear existing thumbnails except add button
        while (thumbnailsContainer.firstChild !== addButton) {
            thumbnailsContainer.removeChild(thumbnailsContainer.firstChild);
        }

        // Add thumbnails
        slides.forEach((slide, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.dataset.slideIndex = index;
            const slideName = slideNames[index];
            const nameDisplay = slideName && slideName !== (index + 1).toString() ? `<div class="slide-name">${slideName}</div>` : '';
            thumbnail.innerHTML = `
                <img src="${slide}" alt="Slide ${index + 1}">
                ${nameDisplay}
                <button class="remove-slide" data-index="${index}">
                    <i class='bx bxs-x-circle'></i>
                </button>
            `;
            thumbnailsContainer.insertBefore(thumbnail, addButton);
        });
    };
    
    // Create slides manager overlay
    const createSlidesManager = () => {
        const overlay = document.createElement('div');
        overlay.className = 'slides-overlay';
        
        overlay.innerHTML = `
            <div class="slides-header">
                <button class="normal-button back-button">
                    <i class='bx bx-arrow-back'></i>
                </button>
                <h2>已经上传的PPT</h2>
                <!-- 批量导入导出按钮 -->
                <div class="config-actions">
                    <div class="action-button-wrapper dropdown-container">
                        <div class="import-dropdown">
                            <button class="rect-button btn btn-import" onclick="toggleImportDropdown(); this.blur();">批量导入</button>
                            <div class="import-options" id="importOptions" style="display: none;">
                                <button onclick="batchImportSlides()">导入ZIP文件</button>
                                <button onclick="batchImportFolder()">导入文件夹</button>
                            </div>
                        </div>
                    </div>
                    <div class="action-button-wrapper">
                        <button class="rect-button btn btn-export" onclick="batchExportSlides(); this.blur();">批量导出</button>
                    </div>
                    <div class="action-button-wrapper">
                        <button class="rect-button btn btn-clear" onclick="clearAllSlides(); this.blur();">清空PPT</button>
                    </div>
                </div>
            </div>
            <div class="content-container">
                <div class="thumbnails-container purple-scrollbar" id="thumbnails-container">
                    <div class="thumbnails-container-scroll" id="thumbnails-container-scroll">
                        <div class="thumbnail add-slide">
                            <i class='bx bx-plus'></i>
                        </div>
                    </div>
                </div>
                
                <!-- 演讲内容要求输入区域 -->
                <div class="speech-requirements" id="speechRequirements">
                <div class="name-field">
                    <label for="slideName">名称</label>
                    <input type="text" id="slideName" placeholder="PPT名称（最多32个字）" maxlength="32">
                </div>
                <div class="textarea-wrapper">
                    <textarea id="speechRequirementsText" placeholder="请输入对这张PPT演讲的内容要求。例如：需要包含产品特性介绍，强调用户痛点和解决方案。越详细越好。最多4096字。AI将根据这些要求对您的演讲进行评分。" maxlength="4096" oninput="updateCharCount()"></textarea>
                    <div class="char-count" id="charCount">0/4096</div>
                </div>
                <div class="button-row">
                    <button class="rect-button btn btn-cancel" onclick="cancelSpeechRequirements()">取消</button>
                    <button class="rect-button btn btn-save" onclick="saveSpeechRequirements()">保存</button>
                </div>
            </div>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };


    // Handle slide upload
    const handleSlideUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.txt'; // 支持图片和txt文件
        input.multiple = true;

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            
            try {
                await processUploadedFiles(files, { clearExisting: false, actionName: '添加' });
            } catch (error) {
                console.error('❌ 文件上传处理失败:', error);
                showMessage('文件上传失败: ' + error.message, 'error');
            }
        };

        input.click();
    };

    // 初始化拖拽上传功能
    const initializeDragAndDrop = (overlay) => {
        // console.log('🎯 初始化拖拽上传功能');
        
        // 创建拖拽提示层
        const dragOverlay = document.createElement('div');
        dragOverlay.className = 'drag-drop-overlay';
        dragOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(102, 106, 246, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            pointer-events: none;
        `;
        
        const dragMessage = document.createElement('div');
        dragMessage.className = 'drag-message';
        dragMessage.innerHTML = `
            <i class='bx bx-upload' style="font-size: 64px; color: white; margin-bottom: 20px;"></i>
            <h2 style="color: white; margin: 0; font-size: 32px;">松开以添加PPT</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 18px;">支持 JPG、PNG、GIF、BMP、WEBP 格式</p>
        `;
        dragMessage.style.cssText = `
            text-align: center;
            padding: 40px;
            border: 3px dashed rgba(255,255,255,0.8);
            border-radius: 20px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
        `;
        
        dragOverlay.appendChild(dragMessage);
        overlay.appendChild(dragOverlay);
        
        let dragCounter = 0; // 用于跟踪dragenter/dragleave事件
        
        // 拖拽进入
        overlay.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            
            // 检查是否包含文件
            if (e.dataTransfer.types.includes('Files')) {
                // console.log('🎯 拖拽文件进入');
                dragOverlay.style.display = 'flex';
            }
        });
        
        // 拖拽悬停
        overlay.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes('Files')) {
                e.dataTransfer.dropEffect = 'copy';
            }
        });
        
        // 拖拽离开
        overlay.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            
            if (dragCounter === 0) {
                // console.log('🎯 拖拽文件离开');
                dragOverlay.style.display = 'none';
            }
        });
        
        // 放置文件
        overlay.addEventListener('drop', async (e) => {
            e.preventDefault();
            dragCounter = 0;
            dragOverlay.style.display = 'none';
            
            const files = Array.from(e.dataTransfer.files);
            // console.log(`🎯 拖拽放置了 ${files.length} 个文件`);
            
            try {
                await processUploadedFiles(files, { clearExisting: false, actionName: '添加' });
            } catch (error) {
                console.error('❌ 拖拽上传处理失败:', error);
                showMessage('拖拽上传失败: ' + error.message, 'error');
            }
        });
        
        // console.log('✅ 拖拽上传功能初始化完成');
    };


    // Upload button click handler
    uploadButton.addEventListener('click', () => {
        const overlay = createSlidesManager();
        window.renderThumbnails(overlay);

        // 初始化拖拽上传功能
        initializeDragAndDrop(overlay);

        // Back button handler
        overlay.querySelector('.back-button').addEventListener('click', () => {
            overlay.remove();
        });

        // Add slide button handler
        overlay.querySelector('.add-slide').addEventListener('click', handleSlideUpload);

        // Thumbnail click handlers
        overlay.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.remove-slide');
            if (removeButton) {
                // Remove slide
                const index = parseInt(removeButton.dataset.index);
                slides.splice(index, 1);
                // 如果删除的是当前选中的幻灯片，重置选中状态
                if (selectedSlideIndex === index) {
                    selectedSlideIndex = -1;
                    hideSpeechRequirements();
                } else if (selectedSlideIndex > index) {
                    selectedSlideIndex--; // 调整索引
                }
                // 删除对应的演讲要求和名称
                delete slideRequirements[index];
                delete slideNames[index];
                
                // 重新调整slideRequirements和slideNames的键值
                const newRequirements = {};
                const newNames = {};
                
                Object.keys(slideRequirements).forEach(key => {
                    const oldIndex = parseInt(key);
                    if (oldIndex > index) {
                        newRequirements[oldIndex - 1] = slideRequirements[key];
                    } else {
                        newRequirements[key] = slideRequirements[key];
                    }
                });
                
                Object.keys(slideNames).forEach(key => {
                    const oldIndex = parseInt(key);
                    if (oldIndex > index) {
                        newNames[oldIndex - 1] = slideNames[key];
                    } else {
                        newNames[key] = slideNames[key];
                    }
                });
                
                slideRequirements = newRequirements;
                slideNames = newNames;
                
                // 保存到session
                pptSession.saveToSession();
                
                window.renderThumbnails(overlay);
                return;
            }

            const thumbnail = e.target.closest('.thumbnail:not(.add-slide)');
            if (thumbnail) {
                // Select thumbnail
                const index = parseInt(thumbnail.dataset.slideIndex);
                selectSlide(index, overlay);
            }
        });
    });

    // Presentation management (startButton已在上面定义)
    
    const updateStartButton = () => {
        // 开始演讲按钮始终可用，没有PPT时会跳转到上传PPT
            startButton.disabled = false;
    };

    // Update start button state whenever slides change
    const originalRenderThumbnails = window.renderThumbnails;
    window.renderThumbnails = (container) => {
        originalRenderThumbnails(container);
        updateStartButton();
    };

    // Create presentation view
    const createPresentationView = () => {
        console.log('🎯 创建演讲界面，当前演讲时间:', presentationTime, '秒');
        console.log('🎯 格式化后的时间文字:', formatTimeToText(presentationTime));
        
        const overlay = document.createElement('div');
        overlay.className = 'presentation-overlay';
        overlay.innerHTML = `
            <div class="presentation-header">
                <div class="back-button-container">
                    <button class="normal-button back-button">
                        <i class='bx bx-arrow-back'></i>
                    </button>
                </div>
                <h2 id="presentationTitle">${formatTimeToText(presentationTime)}即兴演讲</h2>
                <div class="recording-status-indicators">
                    <div class="status-indicator" id="microphoneStatusIndicator">
                        <div class="status-dot" id="microphoneStatusDot"></div>
                        <span class="status-text" id="microphoneStatusText">未录音</span>
                    </div>
                    <div class="status-indicator" id="cameraStatusIndicator">
                        <div class="status-dot" id="cameraStatusDot"></div>
                        <span class="status-text" id="cameraStatusText">未录像</span>
                    </div>
                    <div class="status-indicator" id="recordingStatusIndicator">
                        <div class="status-dot" id="recordingStatusDot"></div>
                        <span class="status-text" id="recordingStatusText">未识别</span>
                    </div>
                </div>
            </div>
            
            <!-- 预加载阶段 - 纯黑屏 -->
            <div class="preload-stage" id="preloadStage">
            </div>
            
            <!-- 主演讲界面 -->
            <div class="main-presentation" id="mainPresentation" style="display: none;">
            <div class="slide-container"></div>
            <div class="timer-container">
                <div class="timer-display">00:00</div>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
            <div class="countdown-overlay"></div>
            <div class="presentation-controls"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };

    // Get random slide
    const getRandomSlide = () => {
        const randomIndex = Math.floor(Math.random() * slides.length);
        return slides[randomIndex];
    };

    // 初始化状态指示器
    const initializeStatusIndicators = async (overlay) => {
        console.log('🎯 初始化演讲状态指示器');
        
        const microphoneStatusDot = overlay.querySelector('#microphoneStatusDot');
        const microphoneStatusText = overlay.querySelector('#microphoneStatusText');
        const cameraStatusDot = overlay.querySelector('#cameraStatusDot');
        const cameraStatusText = overlay.querySelector('#cameraStatusText');
        const recordingStatusDot = overlay.querySelector('#recordingStatusDot');
        const recordingStatusText = overlay.querySelector('#recordingStatusText');
        
        // 检查录音设置状态
        const microphoneConfig = JSON.parse(localStorage.getItem('microphoneConfig') || '{}');
        const microphoneConfigured = microphoneConfig.enabled && microphoneConfig.selectedDeviceId;
        
        // 检查摄像头设置状态
        const cameraConfig = JSON.parse(localStorage.getItem('cameraConfig') || '{}');
        const cameraConfigured = cameraConfig.enabled && cameraConfig.selectedDeviceId;
        
        // 检查录音文字识别设置状态（依赖录音设备）
        const recordingConfig = simpleConfig ? simpleConfig.getAll() : {};
        const recordingConfigured = recordingConfig.recordingEnabled && microphoneConfigured;
        
        console.log('📊 设备配置状态:', {
            microphone: microphoneConfigured,
            camera: cameraConfigured,
            recording: recordingConfigured
        });
        
        // 更新录音状态指示器
        if (!microphoneConfigured) {
            microphoneStatusDot.className = 'status-dot unconfigured';
            microphoneStatusText.textContent = '未录音';
            console.log('🎤 录音设备未配置');
        } else {
            // 执行录音快测
            console.log('🎤 开始录音设备快测');
            microphoneStatusDot.className = 'status-dot testing';
            microphoneStatusText.textContent = '测试中';
            
            try {
                // 使用设置管理器的缓存快测功能
                const testResult = await window.settingsManager.performCachedTest('microphone', false);
                if (testResult.success) {
                    microphoneStatusDot.className = 'status-dot success';
                    microphoneStatusText.textContent = '录音中';
                    console.log('✅ 录音设备快测成功');
                } else {
                    microphoneStatusDot.className = 'status-dot failed';
                    microphoneStatusText.textContent = '未录音';
                    console.log('❌ 录音设备快测失败:', testResult.message);
                    
                    // 调用失败处理接口
                    if (window.settingsManager && window.settingsManager.updateMicrophoneStatusAfterFailedTest) {
                        window.settingsManager.updateMicrophoneStatusAfterFailedTest(testResult.message);
                    }
                }
            } catch (error) {
                microphoneStatusDot.className = 'status-dot failed';
                microphoneStatusText.textContent = '未录音';
                console.log('❌ 录音设备快测出错:', error);
            }
        }
        
        // 更新摄像头状态指示器
        if (!cameraConfigured) {
            cameraStatusDot.className = 'status-dot unconfigured';
            cameraStatusText.textContent = '未录像';
            console.log('📹 摄像头设备未配置');
        } else {
            // 执行摄像头快测
            console.log('📹 开始摄像头设备快测');
            cameraStatusDot.className = 'status-dot testing';
            cameraStatusText.textContent = '测试中';
            
            try {
                // 使用设置管理器的缓存快测功能
                const testResult = await window.settingsManager.performCachedTest('camera', false);
                if (testResult.success) {
                    cameraStatusDot.className = 'status-dot success';
                    cameraStatusText.textContent = '录像中';
                    console.log('✅ 摄像头设备快测成功');
                } else {
                    cameraStatusDot.className = 'status-dot failed';
                    cameraStatusText.textContent = '未录像';
                    console.log('❌ 摄像头设备快测失败:', testResult.message);
                    
                    // 调用失败处理接口
                    if (window.settingsManager && window.settingsManager.updateCameraStatusAfterFailedTest) {
                        window.settingsManager.updateCameraStatusAfterFailedTest(testResult.message);
                    }
                }
            } catch (error) {
                cameraStatusDot.className = 'status-dot failed';
                cameraStatusText.textContent = '未录像';
                console.log('❌ 摄像头设备快测出错:', error);
            }
        }
        
        // 更新录音文字识别状态指示器
        if (!recordingConfigured) {
            recordingStatusDot.className = 'status-dot unconfigured';
            recordingStatusText.textContent = '未识别';
            console.log('📝 录音文字识别未配置');
        } else {
            // 执行录音文字识别快测（依赖录音设备快测结果）
            console.log('📝 开始录音文字识别快测');
            recordingStatusDot.className = 'status-dot testing';
            recordingStatusText.textContent = '测试中';
            
            try {
                // 使用设置管理器的缓存快测功能
                const testResult = await window.settingsManager.performCachedTest('recording', false);
                if (testResult.success) {
                    recordingStatusDot.className = 'status-dot success';
                    recordingStatusText.textContent = '识别中';
                    console.log('✅ 录音文字识别快测成功');
                } else {
                    recordingStatusDot.className = 'status-dot failed';
                    recordingStatusText.textContent = '未识别';
                    console.log('❌ 录音文字识别快测失败:', testResult.message);
                    
                    // 调用失败处理接口（更新录音文字识别设置状态）
                    if (window.settingsManager && window.settingsManager.updateRecordingStatusAfterFailedTest) {
                        window.settingsManager.updateRecordingStatusAfterFailedTest(testResult.message);
                    }
                }
            } catch (error) {
                recordingStatusDot.className = 'status-dot failed';
                recordingStatusText.textContent = '未识别';
                console.log('❌ 录音文字识别快测出错:', error);
            }
        }
        
        console.log('✅ 状态指示器初始化完成');
    };
    
    // 录音设备快测
    const quickTestMicrophone = async (config) => {
        console.log('🎤 开始录音设备快速测试，设备ID:', config.selectedDeviceId);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { deviceId: config.selectedDeviceId }
            });
            
            console.log('🎤 录音设备获取成功，音轨数量:', stream.getAudioTracks().length);
            
            // 停止流
            stream.getTracks().forEach(track => track.stop());
            
            return { success: true, message: '录音设备测试成功' };
        } catch (error) {
            console.log('🎤 录音设备快测失败:', error.name, error.message);
            return { 
                success: false, 
                message: error.name === 'NotAllowedError' ? '录音权限被拒绝' : 
                        error.name === 'NotFoundError' ? '录音设备未找到' :
                        error.message || '录音设备测试失败'
            };
        }
    };
    
    // 摄像头设备快测
    const quickTestCamera = async (config) => {
        console.log('📹 开始摄像头设备快速测试，设备ID:', config.selectedDeviceId);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { deviceId: config.selectedDeviceId }
            });
            
            console.log('📹 摄像头设备获取成功，视频轨数量:', stream.getVideoTracks().length);
            
            // 停止流
            stream.getTracks().forEach(track => track.stop());
            
            return { success: true, message: '摄像头设备测试成功' };
        } catch (error) {
            console.log('📹 摄像头设备快测失败:', error.name, error.message);
            return { 
                success: false, 
                message: error.name === 'NotAllowedError' ? '摄像头权限被拒绝' : 
                        error.name === 'NotFoundError' ? '摄像头设备未找到' :
                        error.message || '摄像头设备测试失败'
            };
        }
    };

    // 预加载阶段 - 纯黑屏，快速完成
    const performPreloadSteps = async (overlay) => {
        // console.log('🎬 开始预加载阶段');
        
        // 步骤1: 请求麦克风权限
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // console.log('✅ 麦克风权限获取成功');
            // 停止流，我们只是为了获取权限
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.warn('⚠️ 麦克风权限获取失败:', error);
        }
        
        // 步骤2: 请求摄像头权限
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // console.log('✅ 摄像头权限获取成功');
            // 停止流，我们只是为了获取权限
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.warn('⚠️ 摄像头权限获取失败:', error);
        }
        
        // 步骤3: 预加载PPT图片
        try {
            const imagePromises = slides.map(slide => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = slide;
                });
            });
            
            const results = await Promise.all(imagePromises);
            const successCount = results.filter(Boolean).length;
            // console.log(`✅ PPT图片加载完成: ${successCount}/${slides.length}`);
        } catch (error) {
            console.warn('⚠️ PPT图片加载失败:', error);
        }
        
        // console.log('🎬 预加载阶段完成');
    };

    // 开始录音录像
    const startRecording = async () => {
        // console.log('🎤 开始录音录像');
        
        // 检查设置状态
        const microphoneSetupCompleted = simpleConfig ? simpleConfig.isSettingTested('microphone') : false;
        const cameraSetupCompleted = simpleConfig ? simpleConfig.isSettingTested('camera') : false;
        
        console.log('📋 录音录像设置状态:');
        console.log('  - 录音设备设置完成:', microphoneSetupCompleted);
        console.log('  - 录像设备设置完成:', cameraSetupCompleted);
        
        if (!microphoneSetupCompleted && !cameraSetupCompleted) {
            console.warn('⚠️ 录音和录像设置都未完成，无法开始录制');
            console.warn('💡 请先在设置中完成录音或录像测试');
            return;
        }
        
        // 重置之前的录制数据
        audioChunks = [];
        videoChunks = [];
        audioBlob = null;
        videoBlob = null;
        
        // 根据设置状态决定录制内容
        if (cameraSetupCompleted) {
            // 尝试录像（包含音频）
            try {
                // console.log('📹 尝试开始录像（包含音频）');
                
                const stream = await getVideoStream();
            
            // 创建视频录制器（包含音频）
            videoRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });
            
            videoRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunks.push(event.data);
                }
            };
            
            videoRecorder.onstop = () => {
                videoBlob = new Blob(videoChunks, { type: 'video/webm' });
                // console.log('📹 视频录制完成, 大小:', videoBlob.size, 'bytes');
            };
            
                videoRecorder.start();
                // console.log('✅ 视频录制（含音频）已开始');
                
            } catch (error) {
                console.warn('⚠️ 视频录制失败:', error);
                
                // 如果录像失败但录音设置完成，尝试仅录音
                if (microphoneSetupCompleted) {
                    // console.log('🎤 录像失败，尝试仅录音');
                    await startAudioOnlyRecording();
                }
            }
        } else if (microphoneSetupCompleted) {
            // 仅录音
            // console.log('🎤 开始仅录音模式');
            await startAudioOnlyRecording();
        }
    };
    
    // 仅录音功能
    const startAudioOnlyRecording = async () => {
        try {
            const audioStream = await getAudioStream();
                
            mediaRecorder = new MediaRecorder(audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                const webmBlob = new Blob(audioChunks, { type: 'audio/webm' });
                // console.log('🎤 音频录制完成，WebM大小:', webmBlob.size, 'bytes，开始转换为MP3');
                
                try {
                    audioBlob = await convertToMp3(webmBlob);
                    // console.log('✅ 音频转换为MP3成功, 大小:', audioBlob.size, 'bytes');
                } catch (error) {
                    console.warn('⚠️ MP3转换失败，使用原始格式:', error);
                    audioBlob = webmBlob;
                    // console.log('🎤 使用WebM格式, 大小:', audioBlob.size, 'bytes');
                }
            };
            
            mediaRecorder.start();
            // console.log('✅ 音频录制已开始');
            
        } catch (audioError) {
            console.error('❌ 音频录制失败:', audioError);
        }
    };

    // 停止录音录像
    const stopRecording = () => {
        // console.log('🛑 开始停止录音录像');
        // console.log('  - videoRecorder状态:', videoRecorder ? videoRecorder.state : 'null');
        // console.log('  - mediaRecorder状态:', mediaRecorder ? mediaRecorder.state : 'null');
        
        return new Promise((resolve) => {
            let completedCount = 0;
            const totalRecorders = (videoRecorder ? 1 : 0) + (mediaRecorder ? 1 : 0);
            
            if (totalRecorders === 0) {
                resolve();
                return;
            }
            
            const checkComplete = () => {
                completedCount++;
                // console.log(`🔄 录制器停止进度: ${completedCount}/${totalRecorders}`);
                if (completedCount >= totalRecorders) {
                    // console.log('✅ 所有录制器已停止，摄像头已关闭');
                    // console.log('🔍 最终录音数据状态:');
                    // console.log('  - audioBlob:', !!audioBlob, audioBlob ? `大小:${audioBlob.size}` : '');
                    // console.log('  - videoBlob:', !!videoBlob, videoBlob ? `大小:${videoBlob.size}` : '');
                    resolve();
                }
            };
            
            if (videoRecorder && videoRecorder.state !== 'inactive') {
                const originalOnStop = videoRecorder.onstop;
                videoRecorder.onstop = (event) => {
                    if (originalOnStop) originalOnStop(event);
                    
                    // 确保彻底关闭摄像头和麦克风
                    if (videoRecorder.stream) {
                        videoRecorder.stream.getTracks().forEach(track => {
                            // console.log(`🔇 停止轨道: ${track.kind} (${track.label})`);
                            track.stop();
                        });
                        videoRecorder.stream = null;
                    }
                    
                    checkComplete();
                };
                
                videoRecorder.stop();
            }
            
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                const originalOnStop = mediaRecorder.onstop;
                mediaRecorder.onstop = async (event) => {
                    if (originalOnStop) await originalOnStop(event);
                    
                    // 确保彻底关闭麦克风
                    if (mediaRecorder.stream) {
                        mediaRecorder.stream.getTracks().forEach(track => {
                            // console.log(`🔇 停止轨道: ${track.kind} (${track.label})`);
                            track.stop();
                        });
                        mediaRecorder.stream = null;
                    }
                    
                    checkComplete();
                };
                
                mediaRecorder.stop();
            }
            
            // 设置超时，防止无限等待
            setTimeout(() => {
                if (completedCount < totalRecorders) {
                    console.warn('⚠️ 录制器停止超时，强制完成');
                    resolve();
                }
            }, 3000);
        });
    };

// 将音频转换为MP3 - 全局函数供其他模块使用
const convertToMp3 = async (webmBlob) => {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result;
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    audioContext.decodeAudioData(arrayBuffer)
                        .then(audioBuffer => {
                            // 获取音频数据
                            const samples = audioBuffer.getChannelData(0);
                            const sampleRate = audioBuffer.sampleRate;
                            
                            // 转换为16位PCM
                            const buffer = new ArrayBuffer(samples.length * 2);
                            const view = new DataView(buffer);
                            for (let i = 0; i < samples.length; i++) {
                                const sample = Math.max(-1, Math.min(1, samples[i]));
                                view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                            }
                            
                            // 使用lame.js编码为MP3
                            const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
                            const mp3Data = [];
                            
                            const sampleBlockSize = 1152;
                            const samples16 = new Int16Array(buffer);
                            
                            for (let i = 0; i < samples16.length; i += sampleBlockSize) {
                                const sampleChunk = samples16.subarray(i, i + sampleBlockSize);
                                const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                                if (mp3buf.length > 0) {
                                    mp3Data.push(mp3buf);
                                }
                            }
                            
                            const mp3buf = mp3encoder.flush();
                            if (mp3buf.length > 0) {
                                mp3Data.push(mp3buf);
                            }
                            
                            const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
                            resolve(mp3Blob);
                        })
                        .catch(reject);
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(webmBlob);
            } catch (error) {
                reject(error);
            }
        });
    };

// 统一的录音接口 - 处理浏览器兼容性
const getAudioStream = async (constraints = { audio: true }) => {
    // console.log('🎤 请求麦克风权限...');
    
    // 检查浏览器支持 - 参考audio-setup.js的实现
    if (!navigator.mediaDevices) {
        // 尝试旧的API作为fallback
        if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
            const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            const stream = await new Promise((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
            // console.log('✅ 麦克风权限获取成功 (旧API)');
            return stream;
        } else {
            throw new Error('您的浏览器不支持录音功能，请使用Chrome、Firefox或Safari等现代浏览器');
        }
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持录音功能，请使用Chrome、Firefox或Safari等现代浏览器');
    }
    
    // 使用现代API，优化音频配置
    const audioConstraints = {
        audio: {
            sampleRate: { ideal: 44100 }, // 使用标准采样率，更好的兼容性
            channelCount: { ideal: 1 },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...constraints.audio
        }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    // console.log('✅ 麦克风权限获取成功');
    return stream;
};

// 统一的录像接口 - 处理浏览器兼容性
const getVideoStream = async (constraints = { audio: true, video: true }) => {
    // console.log('📹 请求摄像头和麦克风权限...');
    
    // 检查浏览器支持
    if (!navigator.mediaDevices) {
        throw new Error('您的浏览器不支持录像功能，请使用Chrome、Firefox或Safari等现代浏览器');
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持录像功能，请使用Chrome、Firefox或Safari等现代浏览器');
    }
    
    // 使用现代API，优化视频配置
    const mediaConstraints = {
        audio: {
            sampleRate: { ideal: 44100 },
            channelCount: { ideal: 1 },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
        },
        ...constraints
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    // console.log('✅ 摄像头和麦克风权限获取成功');
    return stream;
};

// 导出函数到全局作用域
window.convertToMp3 = convertToMp3;
window.getAudioStream = getAudioStream;
window.getVideoStream = getVideoStream;

    // 添加下载按钮
    const addDownloadButtons = (overlay) => {
        // console.log('📥 添加下载按钮');
        
        // 查找录音停止按钮和定时器容器
        const recordStopButton = overlay.querySelector('.stop-recording') || overlay.querySelector('.record-stop-button');
        const timerContainer = overlay.querySelector('.timer-container') || overlay.querySelector('.presentation-controls');
        
        // console.log('🔍 查找按钮结果:', {
        //     recordStopButton: recordStopButton ? '找到' : '未找到',
        //     timerContainer: timerContainer ? '找到' : '未找到',
        //     stopRecordingBtn: overlay.querySelector('.stop-recording') ? '找到.stop-recording' : '未找到.stop-recording',
        //     presentationControls: overlay.querySelector('.presentation-controls') ? '找到.presentation-controls' : '未找到.presentation-controls'
        // });
        
        if (!timerContainer || !recordStopButton) {
            console.warn('⚠️ 无法找到必要的DOM元素，跳过下载按钮添加');
            return;
        }
        
        // 修改定时器容器的布局，使按钮和下载按钮在同一行
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        buttonRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
            user-select: none;
            pointer-events: auto;
        `;
        
        // 将"已结束"按钮移到新的行容器中
        recordStopButton.parentNode.removeChild(recordStopButton);
        // 应用normal-button类样式（不可交互）
        recordStopButton.className = 'normal-button';
        recordStopButton.disabled = true;
        buttonRow.appendChild(recordStopButton);
        
        // 下载音频按钮
        if (audioBlob) {
            const downloadAudioBtn = document.createElement('button');
            downloadAudioBtn.textContent = '下载音频';
            downloadAudioBtn.className = 'normal-button download-btn audio-btn';
            
            downloadAudioBtn.onclick = () => {
                // console.log('🎤 用户点击下载音频按钮');
                // 禁用按钮
                downloadAudioBtn.disabled = true;
                downloadAudioBtn.textContent = '下载中...';
                
                downloadAudio();
                
                // 1秒后恢复按钮
                setTimeout(() => {
                    downloadAudioBtn.disabled = false;
                    downloadAudioBtn.textContent = '下载音频';
                }, 1000);
            };
            
            buttonRow.appendChild(downloadAudioBtn);
        }
        
        // 下载视频按钮
        if (videoBlob) {
            const downloadVideoBtn = document.createElement('button');
            downloadVideoBtn.textContent = '下载视频';
            downloadVideoBtn.className = 'normal-button download-btn video-btn';
            
            downloadVideoBtn.onclick = () => {
                // console.log('📹 用户点击下载视频按钮');
                // 禁用按钮
                downloadVideoBtn.disabled = true;
                downloadVideoBtn.textContent = '下载中...';
                
                downloadVideo();
                
                // 1秒后恢复按钮
                setTimeout(() => {
                    downloadVideoBtn.disabled = false;
                    downloadVideoBtn.textContent = '下载视频';
                }, 1000);
            };
            
            buttonRow.appendChild(downloadVideoBtn);
        }
        
        // 文字稿按钮（如果需要）
        if (shouldShowTranscriptButton()) {
            const transcriptBtn = document.createElement('button');
            transcriptBtn.textContent = '转译中';
            transcriptBtn.className = 'normal-button download-btn transcript-btn';
            transcriptBtn.id = 'transcriptButton';
            transcriptBtn.disabled = true;
            
            buttonRow.appendChild(transcriptBtn);
        }
        
        // 将按钮行添加到定时器容器
        timerContainer.appendChild(buttonRow);
    };

    // 下载音频（自动转换webm为mp3）
    const downloadAudio = async () => {
        console.log('🎤 开始下载音频');
        console.log('  - audioBlob可用:', !!audioBlob, audioBlob ? `大小:${audioBlob.size}` : '');
        console.log('  - videoBlob可用:', !!videoBlob, videoBlob ? `大小:${videoBlob.size}` : '');
        
        let sourceBlob = audioBlob;
        let filename = '演讲录音.mp3';
        
        // 如果有视频但没有单独的音频，从视频中提取音频
        if (!audioBlob && videoBlob) {
            console.log('🔄 没有音频blob，使用视频blob');
            sourceBlob = videoBlob;
        }
        
        if (sourceBlob) {
            try {
                // 检查是否是webm格式，需要转换为mp3
                if (sourceBlob.type.includes('webm') || filename.includes('.webm')) {
                    console.log('🔄 检测到webm格式，开始转换为mp3...');
                    
                    // 使用convertToMp3函数进行转换
                    const mp3Blob = await convertToMp3(sourceBlob);
                    
                    if (mp3Blob) {
                        console.log(`✅ webm转mp3成功，大小: ${mp3Blob.size} bytes`);
                        
                        // 下载转换后的mp3文件
                        const url = URL.createObjectURL(mp3Blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                        
                        console.log('✅ mp3文件下载完成');
                    } else {
                        throw new Error('webm转mp3失败，返回空blob');
                    }
                } else {
                    // 直接下载原始音频文件
                    console.log(`📥 直接下载原始音频文件: ${filename}, 大小: ${sourceBlob.size} bytes`);
                    const url = URL.createObjectURL(sourceBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    console.log('✅ 原始音频下载完成');
                }
            } catch (error) {
                console.error('❌ 音频下载/转换失败:', error);
                
                // 如果转换失败，尝试直接下载原始文件
                console.log('🔄 转换失败，尝试直接下载原始webm文件...');
                const fallbackFilename = '演讲录音.webm';
                const url = URL.createObjectURL(sourceBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fallbackFilename;
                a.click();
                URL.revokeObjectURL(url);
                console.log('✅ 原始webm文件下载完成（备用方案）');
            }
        } else {
            console.error('❌ 没有可下载的音频或视频数据');
        }
    };

    // 下载视频
    const downloadVideo = async () => {
        // console.log('📹 下载视频');
        
        if (!videoBlob) {
            console.error('❌ 没有视频数据可下载');
            return;
        }

        const downloadVideoBtn = document.querySelector('.download-btn.video-btn');
        if (downloadVideoBtn) {
            // 显示转码中状态
            downloadVideoBtn.textContent = '转码中';
            downloadVideoBtn.disabled = true;
        }

        try {
            // 尝试转换为MP4格式
            await convertAndDownloadVideo(videoBlob);
            
            if (downloadVideoBtn) {
                downloadVideoBtn.textContent = '已下载';
                downloadVideoBtn.disabled = true;
            }
        } catch (error) {
            console.error('❌ 视频转码失败:', error);
            
            // 转码失败，直接下载WebM格式
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '演讲录像.webm';
            a.click();
            URL.revokeObjectURL(url);
            
            if (downloadVideoBtn) {
                downloadVideoBtn.textContent = '下载视频';
                downloadVideoBtn.disabled = false;
            }
        }
    };

    // 转换并下载视频为MP4格式
    const convertAndDownloadVideo = async (webmBlob) => {
        return new Promise((resolve, reject) => {
            try {
                // 创建视频元素
                const video = document.createElement('video');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                video.src = URL.createObjectURL(webmBlob);
                video.muted = true;
                
                video.onloadedmetadata = () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    // 由于浏览器限制，我们直接下载WebM格式
                    // 在未来版本中可以集成FFmpeg.js进行真正的MP4转换
                    const url = URL.createObjectURL(webmBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = '演讲录像.mp4'; // 虽然实际是WebM，但改个扩展名
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    resolve();
                };
                
                video.onerror = () => {
                    reject(new Error('视频加载失败'));
                };
            } catch (error) {
                reject(error);
            }
        });
    };

    // Start countdown
    const startPresentation = async (overlay) => {
        // 进入演讲模式，停止背景音乐
        isPresentationMode = true;
        toggleBackgroundMusic(false);
        
        // 首先执行预加载步骤
        await performPreloadSteps(overlay);
        
        // 初始化状态指示器
        initializeStatusIndicators(overlay);
        
        // 隐藏预加载界面，显示主演讲界面
        const preloadStage = overlay.querySelector('#preloadStage');
        const mainPresentation = overlay.querySelector('#mainPresentation');
        
        preloadStage.style.display = 'none';
        mainPresentation.style.display = 'flex';
        
        const slideContainer = overlay.querySelector('.slide-container');
        const controlsContainer = overlay.querySelector('.presentation-controls');
        const countdownOverlay = overlay.querySelector('.countdown-overlay');
        const backButton = overlay.querySelector('.back-button');
        const timerDisplay = overlay.querySelector('.timer-display');
        const progressBar = overlay.querySelector('.progress');
        const startSound = new Audio('assets/effects/start.mp3');
        const halfwaySound = new Audio('assets/effects/halfway.mp3');
        const endSound = new Audio('assets/effects/end.mp3');
        let startTime;
        let timerInterval;
        let isActive = true;

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            if (h > 0) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        let halfwayWarned = false;
        let endWarned = false;
        const updateTimer = () => {
            if (!isActive) return;
            const currentTime = (Date.now() - startTime) / 1000;
            const totalTime = presentationTime; // presentationTime现在已经是秒数
            const progress = Math.min((currentTime / totalTime) * 100, 100);
            timerDisplay.textContent = formatTime(currentTime);
            progressBar.style.width = `${progress}%`;
            if (isActive) {
            if (currentTime >= totalTime && !endWarned) {
                // console.log(`⏰ 演讲时间到! 实际时长: ${totalTime}秒`);
                endWarned = true;
                    if (!effectsMuted) {
                        endSound.volume = effectsVolume * effectsVolume; // 平方权重 
                        endSound.play();
                    }
                } else if (currentTime >= totalTime / 2 && !halfwayWarned) {
                    // console.log("Presentation time is halfway!");
                    halfwayWarned = true;
                    if (!effectsMuted) {
                        halfwaySound.volume = effectsVolume * effectsVolume; // 平方权重
                        halfwaySound.play();
                    }
                }
            }
        };

        const cleanup = () => {
            isActive = false;
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            [startSound, halfwaySound, endSound].forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
            
            // 退出演讲模式，恢复背景音乐
            isPresentationMode = false;
            toggleBackgroundMusic(true);
            
            overlay.remove();
        };

        try {
            slideContainer.innerHTML = `
                <img src="${getRandomSlide()}" alt="Presentation Slide" class="presentation-slide">
            `;

            backButton.addEventListener('click', cleanup);
            controlsContainer.innerHTML = `
                <button class="normal-button stop-recording">停止</button>
            `;
            const recordStopButton = controlsContainer.querySelector('.stop-recording');
            recordStopButton.style.cursor = 'none';
            recordStopButton.style.visibility = 'hidden';
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            slideContainer.classList.add('blur');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!isActive) return;
            // console.log("Get ready for the presentation! ");
            if (!effectsMuted) {
                startSound.currentTime = 0;
                startSound.volume = effectsVolume * effectsVolume; // 平方权重
                await startSound.play();
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            // 倒计时动画配置参数
            const countdownConfig = {
                displayDuration: 800,    // 每个数字显示的总时长（毫秒）
                fadeOutTime: 600,       // 淡出动画时长（毫秒）
                offsetTime: 200         // 数字间隔时间（毫秒）
            };
            
            const countdown = ['3', '2', '1', '开始'];
            for (let i = 0; i < countdown.length; i++) {
                const text = countdown[i];
                if (!countdownOverlay) break;
                
                // 突然显示数字（无动画）
                countdownOverlay.textContent = text;
                countdownOverlay.style.transition = 'none'; // 禁用过渡动画
                countdownOverlay.style.opacity = '1';
                countdownOverlay.style.visibility = 'visible';
                
                console.log(`🎬 倒计时显示: ${text} (突然显示)`);
                
                // 等待显示时间减去淡出时间
                const waitTime = countdownConfig.displayDuration - countdownConfig.fadeOutTime;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // 开始淡出动画（除了最后一个"开始"）
                if (text !== "开始") {
                    countdownOverlay.style.transition = `opacity ${countdownConfig.fadeOutTime}ms ease-out`;
                    countdownOverlay.style.opacity = '0';
                    
                    console.log(`🎬 倒计时淡出: ${text} (${countdownConfig.fadeOutTime}ms)`);
                    
                    // 等待淡出完成 + 间隔时间
                    await new Promise(resolve => setTimeout(resolve, countdownConfig.fadeOutTime + countdownConfig.offsetTime));
                } else {
                    // "开始"文字的特殊处理
                    countdownOverlay.style.transition = `opacity ${countdownConfig.fadeOutTime}ms ease-out`;
                    countdownOverlay.style.opacity = '0';
                    
                    console.log(`🎬 倒计时结束: ${text} (${countdownConfig.fadeOutTime}ms)`);
                    
                    // 等待淡出完成
                    await new Promise(resolve => setTimeout(resolve, countdownConfig.fadeOutTime));
                    
                    // 完全隐藏
                    countdownOverlay.style.visibility = 'hidden';
                }
            }

            // Start the presentation
            if (slideContainer) {
                slideContainer.style.transition = "reset";
                slideContainer.classList.remove('blur');
            }
            if (recordStopButton) {
                recordStopButton.style.visibility = 'visible';
                recordStopButton.style.cursor = 'pointer';
            }
            // 开始录音录像
            await startRecording();
            
            startTime = Date.now();
            // console.log(`🎬 演讲开始! 预设时长: ${presentationTime}秒`);
            timerInterval = setInterval(updateTimer, 100);
            if (overlay) {
                recordStopButton.addEventListener('click', async () => {
                    clearInterval(timerInterval);
                    isActive = false;
                    [startSound, halfwaySound, endSound].forEach(sound => {
                        sound.pause();
                        sound.currentTime = 0;
                    });
                    
                    // 禁用按钮并显示停止中状态
                    recordStopButton.disabled = true;
                    recordStopButton.textContent = '停止中...';
                    recordStopButton.style.backgroundColor = '#ffc107';
                    
                    try {
                        // 等待录音录像完全停止
                        await stopRecording();
                        
                        recordStopButton.textContent = '已结束';
                    recordStopButton.style.backgroundColor = '#666';
                    timerDisplay.style.color = '#fff';
                    progressBar.style.backgroundColor = '#fff';
                        
                        // 等待一小段时间确保blob数据准备好
                        setTimeout(() => {
                            // console.log('🔍 演讲结束后检查录音数据:');
                            // console.log('  - audioBlob存在:', !!audioBlob);
                            // console.log('  - videoBlob存在:', !!videoBlob);
                            // console.log('  - audioBlob大小:', audioBlob ? audioBlob.size : 'N/A');
                            // console.log('  - videoBlob大小:', videoBlob ? videoBlob.size : 'N/A');
                            
                            // 自动下载音频（如果有音频数据）
                            if (audioBlob || videoBlob) {
                                console.log('🎤 满足自动下载条件，开始自动下载音频');
                                try {
                                    // downloadAudio现在是异步函数
                                    downloadAudio().then(() => {
                                        console.log('✅ 自动下载音频调用成功');
                                    }).catch(error => {
                                        console.error('❌ 自动下载音频调用失败:', error);
                                    });
                                } catch (error) {
                                    console.error('❌ 自动下载音频调用失败:', error);
                                }
                            } else {
                                console.warn('⚠️ 没有音频或视频数据，跳过自动下载');
                            }
                            
                            // 如果开启了录音识别功能，开始语音转文字
                            if (shouldShowTranscriptButton()) {
                                // console.log('🔊 开始语音转文字');
                                startSpeechRecognition(overlay);
                            }
                        }, 500);
                        
                    } catch (error) {
                        console.error('❌ 停止录制失败:', error);
                        recordStopButton.textContent = '停止失败';
                        recordStopButton.style.backgroundColor = '#dc3545';
                    }
                });
            }

        } catch (err) {
            console.error('Error in presentation:', err);
            cleanup();
        }
    };

    // Start button click handler
    startButton.addEventListener('click', () => {
        if (slides.length === 0) {
            // 没有PPT时，等效于点击"上传PPT"按钮
            // console.log('🎯 没有PPT，自动跳转到上传PPT界面');
            uploadButton.click();
            return;
        }
        const overlay = createPresentationView();
        startPresentation(overlay);
    });
    updateStartButton();
    const testSound = new Audio('assets/effects/end.mp3');
    const playTestSound = (stop = false) => {
        if (!effectsMuted && !stop) {
            testSound.currentTime = 0;
            testSound.volume = effectsVolume * effectsVolume; // 平方权重
            testSound.play();
        } else {
            testSound.pause();
            testSound.currentTime = 0;
        }
    };

    const createVolumeControl = async () => {
        const overlay = document.createElement('div');
        overlay.className = 'volume-overlay';
        const header = document.createElement('div');
        header.className = 'slides-header';
        header.innerHTML = `
            <button class="back-button">
                <i class='bx bx-arrow-back'></i>
            </button>
            <h2>调整音效音量</h2>
        `;
        const container = document.createElement('div');
        container.className = 'volume-control-container';
        overlay.appendChild(header);
        overlay.appendChild(container);  
        document.body.appendChild(overlay);
        const backButton = header.querySelector('.back-button');
        backButton.addEventListener('click', () => {
            playTestSound(true);
            overlay.remove();
        });

        // Detect whether the device is iOS
        if (isIOS) {
            const message = document.createElement('div');
            message.className = 'ios-volume-message';
            message.innerHTML = `
                <i class='bx ${effectsMuted ? 'bx-volume-mute' : 'bx-volume-full'}'></i>
                <p>iOS设备不支持程序调节音量<br>请使用设备音量按键调节音量<br><span id="volume-toggle-text">${effectsMuted ? '点击音量图标来解除静音' : '点击音量图标来静音'}</span></p>
            `;
            playTestSound();
            const volumeIcon = message.querySelector('i'); 
            const volumeToggleText = message.querySelector('#volume-toggle-text');
            volumeIcon.style.cursor = 'pointer';
            volumeIcon.addEventListener('click', () => {
                effectsMuted = !effectsMuted;
                volumeIcon.className = `bx ${effectsMuted ? 'bx-volume-mute' : 'bx-volume-full'}`;
                volumeToggleText.textContent = effectsMuted ? '点击音量图标来解除静音' : '点击音量图标来静音'; 
                playTestSound();
            });
            container.appendChild(message);
        } else {
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'volume-slider-container';
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'volume-slider';
            slider.min = 0;
            slider.max = 100;
            slider.value = effectsVolume * 100;
            const description = document.createElement('div');
            description.className = 'volume-description';
            description.textContent = '滑动以调整音效音量';
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(description);
            container.appendChild(sliderContainer);
            const testSound = new Audio('assets/effects/end.mp3');
            testSound.volume = effectsVolume * effectsVolume; // 平方权重
            let toggleRadius = 10;
            let sliderFullWidth = slider.offsetWidth;
            const updateVolumeUI = async () => {
                let sliderWidthPercentage = (toggleRadius + (sliderFullWidth - 2 * toggleRadius) * effectsVolume / maxEffectsVolume) / sliderFullWidth;
                slider.style.setProperty('--volume-percentage', `${sliderWidthPercentage * 100}%`);
            };
            let isEditing = false;
            playTestSound();
            await updateVolumeUI();
            
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
            
            // 滑动过程中只更新UI，不播放音效
            slider.addEventListener('input', async (e) => {
                e.preventDefault();
                const value = e.target.value;
                effectsVolume = value / 100;
                await updateVolumeUI();
                
                // 主界面的音量滑动条只控制计时音效，不再控制背景音乐
                // 背景音乐音量由设置页面独立控制
                
                // 移除了滑动时播放音效的代码
            });
        }
    };

    // 音量控制已移至设置页面
}); 

// 背景音乐控制（移到全局作用域）
let backgroundMusic = null;
let isBackgroundMusicEnabled = true;
let isPresentationMode = false;
let audioContextUnlocked = false; // 标记音频上下文是否已解锁

// 背景音乐音量倍数常数（用户要求200%，即4倍）
const BACKGROUND_MUSIC_VOLUME_MULTIPLIER = 4.0;

// 初始化背景音乐
const initBackgroundMusic = () => {
    const backgroundMusicVolume = simpleConfig.get('backgroundMusicVolume') || 0.5;
    backgroundMusic = new Audio('assets/effects/background.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = Math.min(backgroundMusicVolume * BACKGROUND_MUSIC_VOLUME_MULTIPLIER, 1.0);
    
    // 设置为全局变量，供设置页面访问
    window.backgroundMusic = backgroundMusic;
    window.effectsVolume = effectsVolume;
    window.BACKGROUND_MUSIC_VOLUME_MULTIPLIER = BACKGROUND_MUSIC_VOLUME_MULTIPLIER;
    
    // 不立即播放，等待用户首次交互
    // console.log('🎵 背景音乐已准备就绪，等待用户交互后播放');
};

// 尝试启动背景音乐（在用户交互后调用）
const tryStartBackgroundMusic = () => {
    if (backgroundMusic && isBackgroundMusicEnabled && !isPresentationMode && !audioContextUnlocked) {
        backgroundMusic.play().then(() => {
            audioContextUnlocked = true;
            // console.log('🎵 背景音乐开始播放');
        }).catch(e => {
            // console.log('🔇 背景音乐仍需要用户交互:', e.message);
        });
    }
};

// 控制背景音乐播放/停止
const toggleBackgroundMusic = (play) => {
    if (!backgroundMusic) return;
    
    if (play && isBackgroundMusicEnabled && !isPresentationMode) {
        const backgroundMusicVolume = simpleConfig.get('backgroundMusicVolume') || 0.5;
        backgroundMusic.volume = Math.min(backgroundMusicVolume * BACKGROUND_MUSIC_VOLUME_MULTIPLIER, 1.0);
        
        // 只有在音频上下文已解锁的情况下才播放
        if (audioContextUnlocked) {
            backgroundMusic.play().catch(e => console.log('背景音乐播放失败:', e));
        }
    } else {
        backgroundMusic.pause();
    }
};

// 添加用户交互监听器，用于启动背景音乐
const addUserInteractionListeners = () => {
    const events = ['click', 'touchstart', 'keydown'];
    
    const handleFirstInteraction = () => {
        tryStartBackgroundMusic();
        
        // 移除监听器，只需要首次交互
        events.forEach(event => {
            document.removeEventListener(event, handleFirstInteraction);
        });
    };
    
    events.forEach(event => {
        document.addEventListener(event, handleFirstInteraction, { once: true });
    });
};

// 确保DOM加载完成后再初始化设置页面
document.addEventListener('DOMContentLoaded', function() {
    // console.log('🚀 DOM加载完成，开始初始化');
    // console.log('🚀 当前时间:', new Date().toLocaleTimeString());
    
    // 初始化设置页面（已在后面的延迟初始化中处理）
    // initAudioSetup(); // 已移除，使用统一的设置页面初始化
    
    // 延迟初始化设置页面，确保所有脚本都已加载
    setTimeout(() => {
        if (typeof initSettingsPage === 'function') {
            initSettingsPage();
            // console.log('🚀 设置页面初始化完成');
        } else {
            console.warn('⚠️ initSettingsPage 函数未找到，可能脚本加载未完成');
        }
    }, 100);
    
    // 初始化PPT选择功能
    initSlideSelection();
    
    // 初始化默认PPT的演讲要求
    initializeDefaultSlideRequirements();
    
    // 初始化背景音乐
    initBackgroundMusic();
    
    // 添加用户交互监听器
    addUserInteractionListeners();
});

// PPT选择相关函数
const initSlideSelection = () => {
    // console.log('🎯 初始化PPT选择功能');
};

// 选择PPT幻灯片
const selectSlide = (index, overlay) => {
    // console.log(`🎯 选择PPT幻灯片: ${index}`);
    
    // 如果点击的是已经选中的幻灯片，则取消选中
    if (selectedSlideIndex === index) {
        // console.log(`🎯 取消选中PPT幻灯片: ${index}`);
        
        // 保存当前编辑内容
        autoSaveCurrentSlide();
        
        // 移除选中状态
        const allThumbnails = overlay.querySelectorAll('.thumbnail:not(.add-slide)');
        allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
        selectedSlideIndex = -1;
        
        // 隐藏演讲要求面板
        hideSpeechRequirements();
        return;
    }
    
    // 如果正在编辑另一张PPT，先保存
    if (selectedSlideIndex !== -1) {
        autoSaveCurrentSlide();
    }
    
    // 移除之前选中的状态
    const allThumbnails = overlay.querySelectorAll('.thumbnail:not(.add-slide)');
    allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
    
    // 添加选中状态到当前缩略图
    const selectedThumbnail = overlay.querySelector(`[data-slide-index="${index}"]`);
    if (selectedThumbnail) {
        selectedThumbnail.classList.add('selected');
        selectedSlideIndex = index;
        
        // 显示演讲内容要求输入界面
        showSpeechRequirements(index);
    }
};

// 显示演讲内容要求输入界面
const showSpeechRequirements = (slideIndex) => {
    const requirementsPanel = document.getElementById('speechRequirements');
    const textarea = document.getElementById('speechRequirementsText');
    const nameInput = document.getElementById('slideName');
    
    if (requirementsPanel && textarea && nameInput) {
        // 如果正在编辑另一张PPT，先自动保存
        if (selectedSlideIndex !== -1 && selectedSlideIndex !== slideIndex) {
            autoSaveCurrentSlide();
        }
        
        // 加载已有的演讲要求
        const currentRequirements = slideRequirements[slideIndex] || '';
        textarea.value = currentRequirements;
        
        // 加载已有的名称，如果没有则使用默认名称
        const currentName = slideNames[slideIndex] || (slideIndex + 1).toString();
        nameInput.value = currentName;
        
        // 更新字数统计
        updateCharCount();
        
        // 显示面板
        requirementsPanel.classList.add('show');
        
        // 设置当前选中的PPT索引
        selectedSlideIndex = slideIndex;
        
        // 不再自动聚焦，让用户主动点击时再聚焦
    }
};

// 自动保存当前编辑的PPT信息
const autoSaveCurrentSlide = () => {
    if (selectedSlideIndex === -1) return;
    
    const textarea = document.getElementById('speechRequirementsText');
    const nameInput = document.getElementById('slideName');
    
    if (textarea && nameInput) {
        const requirements = textarea.value.trim();
        const slideName = nameInput.value.trim();
        
        // 保存名称
        if (slideName) {
            slideNames[selectedSlideIndex] = slideName;
        } else {
            slideNames[selectedSlideIndex] = (selectedSlideIndex + 1).toString();
        }
        
        // 保存演讲要求
        if (requirements) {
            const truncatedRequirements = truncateText(requirements, 4096);
            slideRequirements[selectedSlideIndex] = truncatedRequirements;
        } else {
            delete slideRequirements[selectedSlideIndex];
        }
        
        // 保存到session
        pptSession.saveToSession();
        
        // 更新对应缩略图的名称显示
        const thumbnailContainer = document.querySelector('.thumbnails-container-scroll');
        if (thumbnailContainer) {
            const thumbnails = thumbnailContainer.querySelectorAll('.thumbnail:not(.add-slide)');
            const targetThumbnail = thumbnails[selectedSlideIndex];
            if (targetThumbnail) {
                const nameElement = targetThumbnail.querySelector('.slide-name');
                if (nameElement) {
                    nameElement.textContent = slideNames[selectedSlideIndex];
                    // console.log(`🔄 已更新缩略图 ${selectedSlideIndex} 的名称显示: ${slideNames[selectedSlideIndex]}`);
                }
            }
        }
        
        // console.log(`🔄 自动保存PPT ${selectedSlideIndex} 的信息`);
    }
};

// 更新字数统计
const updateCharCount = () => {
    const textarea = document.getElementById('speechRequirementsText');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        const currentLength = textarea.value.length;
        charCount.textContent = `${currentLength}/4096`;
        
        // 如果接近限制，改变颜色
        if (currentLength > 3900) {
            charCount.style.color = '#ff4444';
        } else if (currentLength > 3500) {
            charCount.style.color = '#ff8800';
        } else {
            charCount.style.color = '#ccc'; // 更亮的颜色以便在紫色背景下显示
        }
    }
};

// 隐藏演讲内容要求输入界面
const hideSpeechRequirements = () => {
    const requirementsPanel = document.getElementById('speechRequirements');
    if (requirementsPanel) {
        requirementsPanel.classList.remove('show');
    }
};

// 取消演讲内容要求输入
const cancelSpeechRequirements = () => {
    // console.log('🎯 取消演讲内容要求输入');
    
    // 保存当前编辑内容（包括名称）
    if (selectedSlideIndex !== -1) {
        autoSaveCurrentSlide();
    }
    
    // 清除选中状态
    const allThumbnails = document.querySelectorAll('.thumbnail:not(.add-slide)');
    allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
    
    selectedSlideIndex = -1;
    hideSpeechRequirements();
};

// 保存演讲内容要求
const saveSpeechRequirements = () => {
    // console.log('🎯 保存演讲内容要求');
    
    if (selectedSlideIndex === -1) {
        console.warn('⚠️ 没有选中的PPT');
        return;
    }
    
    const textarea = document.getElementById('speechRequirementsText');
    const nameInput = document.getElementById('slideName');
    
    if (textarea && nameInput) {
        const requirements = textarea.value.trim();
        const slideName = nameInput.value.trim();
        
        // 保存名称（如果为空则使用默认名称）
        if (slideName) {
            slideNames[selectedSlideIndex] = slideName;
            // console.log(`✅ 已保存PPT ${selectedSlideIndex} 的名称: ${slideName}`);
        } else {
            // 如果名称为空，使用默认名称
            slideNames[selectedSlideIndex] = (selectedSlideIndex + 1).toString();
            // console.log(`📝 PPT ${selectedSlideIndex} 使用默认名称: ${slideNames[selectedSlideIndex]}`);
        }
        
        if (requirements) {
            // 应用4096字符限制并保存演讲要求
            const truncatedRequirements = truncateText(requirements, 4096);
            slideRequirements[selectedSlideIndex] = truncatedRequirements;
            // console.log(`✅ 已保存PPT ${selectedSlideIndex} 的演讲要求:`, truncatedRequirements.substring(0, 50) + '...');
            
            // 如果文本被截断，更新textarea显示
            if (truncatedRequirements !== requirements) {
                textarea.value = truncatedRequirements;
                updateCharCount();
            }
            
            // 可以在这里添加视觉反馈，比如显示保存成功的提示
            showMessage('演讲要求已保存', 'success');
        } else {
            // 如果内容为空，删除该PPT的演讲要求
            delete slideRequirements[selectedSlideIndex];
            // console.log(`🗑️ 已删除PPT ${selectedSlideIndex} 的演讲要求`);
        }
        
        hideSpeechRequirements();
        
        // 保存到session
        pptSession.saveToSession();
        
        // 更新对应缩略图的名称显示
        const thumbnailContainer = document.querySelector('.thumbnails-container-scroll');
        if (thumbnailContainer) {
            const thumbnails = thumbnailContainer.querySelectorAll('.thumbnail:not(.add-slide)');
            const targetThumbnail = thumbnails[selectedSlideIndex];
            if (targetThumbnail) {
                const nameElement = targetThumbnail.querySelector('.slide-name');
                if (nameElement) {
                    nameElement.textContent = slideNames[selectedSlideIndex];
                    // console.log(`🔄 已更新缩略图 ${selectedSlideIndex} 的名称显示: ${slideNames[selectedSlideIndex]}`);
                }
            }
        }
        
        // 清除选中状态
        const allThumbnails = document.querySelectorAll('.thumbnail:not(.add-slide)');
        allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
        selectedSlideIndex = -1;
    }
};


// 清空所有PPT
const clearAllSlides = () => {
    // console.log('🗑️ 开始清空所有PPT');
    
    if (slides.length === 0) {
        showMessage('没有PPT需要清空', 'info');
        return;
    }
    
    // 确认对话框
    const confirmed = confirm(`确定要清空所有 ${slides.length} 张PPT吗？此操作不可撤销。`);
    
    if (!confirmed) {
        // console.log('❌ 用户取消了清空操作');
        return;
    }
    
    try {
        // 清空所有数据
        slides.length = 0;
        Object.keys(slideRequirements).forEach(key => delete slideRequirements[key]);
        Object.keys(slideNames).forEach(key => delete slideNames[key]);
        selectedSlideIndex = -1;
        
        // 隐藏演讲要求面板（如果正在显示）
        hideSpeechRequirements();
        
        // 清空session数据
        pptSession.clearSession();
        
        // 重新渲染缩略图
        const overlay = document.querySelector('.slides-overlay');
        if (overlay) {
            window.renderThumbnails(overlay);
        }
        
        // console.log('✅ 已清空所有PPT数据');
        showMessage('已清空所有PPT', 'success');
        
    } catch (error) {
        console.error('❌ 清空PPT失败:', error);
        showMessage('清空PPT失败: ' + error.message, 'error');
    }
};

// 批量导出PPT和演讲要求
const batchExportSlides = async () => {
    // console.log('📦 开始批量导出PPT和演讲要求');
    
    if (slides.length === 0) {
        showMessage('没有可导出的PPT', 'info');
        return;
    }
    
    // 禁用导出按钮
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.textContent = '导出中...';
    }
    
    try {
        const zip = new JSZip();
        
        // 处理每张PPT
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideIndex = String(i + 1).padStart(3, '0'); // 001, 002, 003...
            const slideName = slideNames[i] || (i + 1).toString();
            
            // 添加图片到zip
            if (slide.startsWith('data:')) {
                // 如果是data URL，提取图片数据
                try {
                    const response = await fetch(slide);
                    const blob = await response.blob();
                    
                    // 从data URL中提取MIME类型和扩展名
                    const mimeMatch = slide.match(/^data:([^;]+);/);
                    let extension = 'jpg'; // 默认扩展名
                    
                    if (mimeMatch) {
                        const mimeType = mimeMatch[1];
                        // console.log(`📸 PPT ${i + 1} MIME类型: ${mimeType}`);
                        
                        // 根据MIME类型确定扩展名
                        switch (mimeType) {
                            case 'image/jpeg':
                                extension = 'jpg';
                                break;
                            case 'image/png':
                                extension = 'png';
                                break;
                            case 'image/gif':
                                extension = 'gif';
                                break;
                            case 'image/bmp':
                                extension = 'bmp';
                                break;
                            case 'image/webp':
                                extension = 'webp';
                                break;
                            default:
                                // 尝试从blob.type获取
                                if (blob.type && blob.type.includes('/')) {
                                    extension = blob.type.split('/')[1] || 'jpg';
                                }
                        }
                    }
                    
                    // console.log(`📸 PPT ${i + 1} 将导出为: ${slideIndex}.${extension}`);
                    
                    // 确保blob具有正确的MIME类型
                    const correctMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                    const correctedBlob = new Blob([blob], { type: correctMimeType });
                    
                    // console.log(`📸 PPT ${i + 1} 原始blob类型: ${blob.type}, 修正后类型: ${correctedBlob.type}`);
                    zip.file(`${slideIndex}.${extension}`, correctedBlob);
                } catch (error) {
                    console.warn(`无法处理PPT ${i + 1} (data URL):`, error);
                    // 跳过这张图片
                    continue;
                }
            } else {
                // 如果是文件路径，需要获取图片数据
                try {
                    const response = await fetch(slide);
                    const blob = await response.blob();
                    const extension = slide.split('.').pop().toLowerCase() || 'jpg';
                    // console.log(`📸 PPT ${i + 1} 从文件路径导出为: ${slideIndex}.${extension}`);
                    
                    // 确保blob具有正确的MIME类型
                    const correctMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                    const correctedBlob = new Blob([blob], { type: correctMimeType });
                    
                    // console.log(`📸 PPT ${i + 1} 原始blob类型: ${blob.type}, 修正后类型: ${correctedBlob.type}`);
                    zip.file(`${slideIndex}.${extension}`, correctedBlob);
                } catch (error) {
                    console.warn(`无法获取图片 ${slide}:`, error);
                    // 跳过这张图片
                    continue;
                }
            }
            
            // 添加演讲要求txt文件
            const requirements = slideRequirements[i] || '';
            zip.file(`${slideIndex}.requirement.txt`, requirements);
            
            // 添加名称txt文件
            zip.file(`${slideIndex}.name.txt`, slideName);
        }
        
        // 输出ZIP文件内容摘要
        // console.log('📦 ZIP文件内容摘要:');
        zip.forEach((relativePath, file) => {
            // console.log(`  - ${relativePath} (${file._data ? '有数据' : '无数据'})`);
        });
        
        // 生成并下载zip文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        // console.log(`📦 生成的ZIP文件大小: ${zipBlob.size} bytes`);
        
        const url = URL.createObjectURL(zipBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `PPT演讲资料_${new Date().toISOString().slice(0, 10)}.zip`;
        link.click();
        
        URL.revokeObjectURL(url);
        // console.log('✅ 批量导出完成');
        showMessage(`成功导出 ${slides.length} 张PPT到ZIP文件`, 'success');
        
    } catch (error) {
        console.error('❌ 批量导出失败:', error);
        showMessage('批量导出失败: ' + error.message, 'error');
    } finally {
        // 1秒后恢复导出按钮
        setTimeout(() => {
            const exportBtn = document.querySelector('.btn-export');
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.textContent = '批量导出';
                exportBtn.blur(); // 移除焦点确保恢复灰色
            }
        }, 1000);
    }
};

// 批量导入PPT和演讲要求
const batchImportSlides = () => {
    // console.log('📥 开始批量导入PPT和演讲要求');
    
    // 禁用导入按钮
    const importBtn = document.querySelector('.btn-import');
    if (importBtn) {
        importBtn.disabled = true;
        importBtn.textContent = '选择文件...';
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.webkitdirectory = false; // 默认文件模式
    input.multiple = true; // 允许多选
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            // 用户取消选择，恢复按钮
            const importBtn = document.querySelector('.btn-import');
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.textContent = '批量导入';
                importBtn.blur(); // 移除焦点确保恢复灰色
            }
            return;
        }
        
        // 更新按钮状态为导入中
        const importBtn = document.querySelector('.btn-import');
        if (importBtn) {
            importBtn.textContent = '导入中...';
        }
        
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            // 收集图片、txt文件和名称文件
            const imageFiles = {};
            const textFiles = {};
            const nameFiles = {};
            
            // 首先过滤掉macOS的垃圾文件并转换为文件对象
            // console.log('📦 开始分析ZIP文件内容:');
            const files = [];
            
            for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
                const fileName = relativePath.split('/').pop().toLowerCase();
                
                // 过滤掉macOS和Windows的垃圾文件
                if (relativePath.includes('__MACOSX') || 
                    relativePath.includes('__macosx') || 
                    relativePath.startsWith('._') ||
                    relativePath.includes('/._') ||
                    fileName === 'thumbs.db' ||           // Windows缩略图缓存
                    fileName === 'desktop.ini' ||         // Windows文件夹配置
                    fileName.startsWith('~$') ||          // Office临时文件
                    fileName.endsWith('.tmp') ||          // 临时文件
                    zipEntry.dir) {
                    // console.log(`🗑️ 跳过垃圾文件/文件夹: ${relativePath}`);
                    continue;
                }
                
                // console.log(`📄 有效文件: ${relativePath}`);
                
                // 创建一个类似File对象的结构
                const fileObj = {
                    name: relativePath.split('/').pop(), // 只取文件名部分
                    zipEntry: zipEntry
                };
                
                files.push(fileObj);
            }
            
            // console.log(`📊 过滤后有效文件数量: ${files.length}`);
            // console.log('有效文件列表:', files.map(f => f.name));
            
            // 调用通用的文件处理函数（和文件夹导入相同的逻辑）
            await processZipFiles(files);
            
        } catch (error) {
            console.error('❌ 批量导入失败:', error);
            showMessage('批量导入失败: ' + error.message, 'error');
        } finally {
            // 1秒后恢复导入按钮
            setTimeout(() => {
                const importBtn = document.querySelector('.btn-import');
                if (importBtn) {
                    importBtn.disabled = false;
                    importBtn.textContent = '批量导入';
                    importBtn.blur(); // 移除焦点确保恢复灰色
                }
            }, 1000);
        }
    };
    
    input.click();
};

// 将Blob转换为Data URL
const blobToDataURL = (blob) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(blob);
    });
};


// 检查是否应该显示文字稿按钮
const shouldShowTranscriptButton = () => {
    // 检查是否开启了录音识别功能和麦克风权限
    const recordingEnabled = simpleConfig.get('recordingEnabled');
    return recordingEnabled && (audioBlob || videoBlob);
};

// 开始语音识别
const startSpeechRecognition = async (overlay) => {
    // console.log('🎤 开始语音识别');
    transcriptStatus = 'processing';
    
    try {
        // 获取音频数据
        let audioToRecognize = audioBlob;
        if (!audioToRecognize && videoBlob) {
            // 如果没有单独的音频，使用视频文件
            audioToRecognize = videoBlob;
        }
        
        if (!audioToRecognize) {
            throw new Error('没有可用的音频数据');
        }
        
        // 调用阿里云语音识别API（需要实现）
        const result = await callAliyunSpeechAPI(audioToRecognize);
        
        if (result.success) {
            transcriptText = result.text;
            transcriptStatus = 'success';
            updateTranscriptButton('success');
            // console.log('✅ 语音识别成功:', transcriptText);
        } else {
            throw new Error(result.error || '识别失败');
        }
        
    } catch (error) {
        console.error('❌ 语音识别失败:', error);
        transcriptStatus = 'failed';
        updateTranscriptButton('failed');
    }
};

// 更新文字稿按钮状态
const updateTranscriptButton = (status) => {
    const transcriptBtn = document.getElementById('transcriptButton');
    if (!transcriptBtn) return;
    
    const aiEnabled = simpleConfig.get('aiEnabled');
    
    switch (status) {
        case 'success':
            if (aiEnabled) {
                transcriptBtn.textContent = 'AI评分';
                transcriptBtn.style.background = '#666AF6';
                transcriptBtn.onclick = () => startAIScoring();
            } else {
                transcriptBtn.textContent = '文字稿';
                transcriptBtn.style.background = '#17a2b8';
                transcriptBtn.onclick = () => downloadTranscript();
            }
            transcriptBtn.style.cursor = 'pointer';
            transcriptBtn.disabled = false;
            break;
            
        case 'failed':
            transcriptBtn.textContent = '转译失败';
            transcriptBtn.style.background = '#dc3545';
            transcriptBtn.style.cursor = 'pointer';
            transcriptBtn.disabled = false;
            transcriptBtn.onclick = () => retryRecognition();
            break;
            
        case 'retry_failed':
            // 重试失败，按钮消失
            transcriptBtn.remove();
            break;
    }
};

// 重试语音识别
const retryRecognition = async () => {
    // console.log('🔄 重试语音识别');
    const transcriptBtn = document.getElementById('transcriptButton');
    
    if (transcriptBtn) {
        transcriptBtn.textContent = '转译中';
        transcriptBtn.style.background = '#6c757d';
        transcriptBtn.style.cursor = 'not-allowed';
        transcriptBtn.disabled = true;
    }
    
    try {
        let audioToRecognize = audioBlob;
        if (!audioToRecognize && videoBlob) {
            audioToRecognize = videoBlob;
        }
        
        const result = await callAliyunSpeechAPI(audioToRecognize);
        
        if (result.success) {
            transcriptText = result.text;
            transcriptStatus = 'success';
            updateTranscriptButton('success');
        } else {
            throw new Error(result.error || '重试识别失败');
        }
        
    } catch (error) {
        console.error('❌ 重试语音识别失败:', error);
        transcriptStatus = 'retry_failed';
        updateTranscriptButton('retry_failed');
    }
};

// 下载文字稿
const downloadTranscript = () => {
    // console.log('📄 下载文字稿');
    
    if (!transcriptText) {
        console.warn('没有文字稿内容');
        return;
    }
    
    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '演讲文字稿.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    // 更新按钮状态
    const transcriptBtn = document.getElementById('transcriptButton');
    if (transcriptBtn) {
        transcriptBtn.textContent = '已下载';
        transcriptBtn.style.background = '#6c757d';
        transcriptBtn.disabled = true;
        
        // 1秒后恢复
        setTimeout(() => {
            transcriptBtn.textContent = '文字稿';
            transcriptBtn.style.background = '#17a2b8';
            transcriptBtn.disabled = false;
        }, 1000);
    }
};

// 开始AI评分
const startAIScoring = () => {
    // console.log('🤖 开始AI评分');
    // TODO: 实现AI评分功能
    alert('AI评分功能开发中...');
};

// 调用阿里云语音识别API
const callAliyunSpeechAPI = async (audioBlob) => {
    // TODO: 实现阿里云语音识别API调用
    // 这里需要实现实际的API调用逻辑
    // console.log('🔄 调用阿里云语音识别API');
    
    // 模拟API调用
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                text: '这是模拟的语音识别结果文本。实际使用时需要调用阿里云API。'
            });
        }, 2000);
    });
};

// 统一的消息提示系统
const showMessage = (text, type = 'success', duration = 2000) => {
    const message = document.createElement('div');
    message.className = 'unified-message';
    message.textContent = text;
    
    // 根据类型设置不同的样式 - 统一使用紫色背景
    const typeStyles = {
        success: {
            background: '#666AF6',
            icon: '✅'
        },
        error: {
            background: '#666AF6',
            icon: '❌'
        },
        info: {
            background: '#666AF6',
            icon: '📥'
        },
        warning: {
            background: '#666AF6',
            icon: '⚠️'
        }
    };
    
    const style = typeStyles[type] || typeStyles.success;
    
    message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: ${style.background};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 80%;
        text-align: center;
        font-weight: 500;
    `;
    
    // 添加图标
    message.textContent = `${style.icon} ${text}`;
    
    document.body.appendChild(message);
    
    // 动画显示：从底部滑入
    requestAnimationFrame(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateX(-50%) translateY(-10px)';
    });
    
    // 自动消失
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, duration);
};

// 切换导入下拉菜单
const toggleImportDropdown = () => {
    const dropdown = document.getElementById('importOptions');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

// 批量导入文件夹
const batchImportFolder = () => {
    // console.log('📁 开始批量导入文件夹');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true; // 文件夹模式
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        // 隐藏下拉菜单
        toggleImportDropdown();
        
        try {
            await processFolderFiles(files);
        } catch (error) {
            console.error('❌ 文件夹导入失败:', error);
            showMessage('文件夹导入失败: ' + error.message, 'error');
        }
    };
    
    input.click();
};

// 处理ZIP中的文件（基于文件夹处理逻辑）
const processZipFiles = async (files) => {
    // ZIP文件需要特殊处理，因为需要使用zipEntry.async()来读取内容
    // 但我们可以使用统一的分类逻辑，然后特殊处理读取部分
    return await processUploadedFilesFromZip(files, { actionName: '导入' });
};

// 处理文件夹中的文件
const processFolderFiles = async (files) => {
    return await processUploadedFiles(files, { actionName: '导入' });
};

// 将File对象转换为Data URL
const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// 统一的文件处理接口
const processUploadedFiles = async (files, options = {}) => {
    // console.log(`📁 统一处理 ${files.length} 个文件`);
    
    // 收集图片、txt文件和名称文件
    const imageFiles = {};
    const textFiles = {};
    const nameFiles = {};
    
    // 支持的图片格式
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    // 分类文件
    files.forEach(file => {
        // 跳过系统文件
        if (file.name.startsWith('__MACOSX') || file.name.startsWith('.')) {
            // console.log(`⏭️ 跳过系统文件: ${file.name}`);
            return;
        }
        
        const fileName = file.name.toLowerCase();
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        
        if (imageExtensions.includes(extension)) {
            // 如果已经有同名的图片，跳过（只选择第一个）
            if (!imageFiles[nameWithoutExt]) {
                imageFiles[nameWithoutExt] = file;
                // console.log(`📸 收集图片文件: ${file.name}`);
            }
        } else if (extension === 'txt') {
            if (nameWithoutExt.endsWith('.name')) {
                // 这是名称文件 (新格式: NAME.name.txt)
                const slideBaseName = nameWithoutExt.replace('.name', '');
                nameFiles[slideBaseName] = file;
                // console.log(`📝 收集名称文件: ${file.name} -> ${slideBaseName}`);
            } else if (nameWithoutExt.endsWith('.requirement')) {
                // 这是演讲要求文件 (新格式: NAME.requirement.txt)
                const slideBaseName = nameWithoutExt.replace('.requirement', '');
                textFiles[slideBaseName] = file;
                // console.log(`📄 收集要求文件: ${file.name} -> ${slideBaseName}`);
            } else {
                // 兼容旧格式: NAME.txt (演讲要求)
                textFiles[nameWithoutExt] = file;
                // console.log(`📄 收集要求文件(旧格式): ${file.name} -> ${nameWithoutExt}`);
            }
        }
    });
    
    // 按文件名排序（保持原文件夹的排序）
    const sortedImageNames = Object.keys(imageFiles).sort();
    
    // console.log(`📊 找到 ${sortedImageNames.length} 个图片文件`);
    
    if (sortedImageNames.length === 0) {
        throw new Error('没有找到支持的图片文件');
    }
    
    // 根据选项决定是否清空现有数据
    if (options.clearExisting !== false) {
        // 清空现有的slides、requirements和names
        slides.length = 0;
        Object.keys(slideRequirements).forEach(key => delete slideRequirements[key]);
        Object.keys(slideNames).forEach(key => delete slideNames[key]);
        // console.log('🗑️ 已清空现有PPT数据');
    }
    
    const startIndex = slides.length; // 记录开始添加的位置
    
    // 导入图片和对应的演讲要求、名称
    for (let i = 0; i < sortedImageNames.length; i++) {
        const baseName = sortedImageNames[i];
        const imageFile = imageFiles[baseName];
        const textFile = textFiles[baseName];
        const nameFile = nameFiles[baseName];
        
        // 读取图片
        const imageUrl = await fileToDataURL(imageFile);
        const slideIndex = slides.length;
        slides.push(imageUrl);
        
        // 读取对应的演讲要求
        if (textFile) {
            const requirements = await readTextFile(textFile);
            // 去除前后的连续空行，然后应用4096字符限制
            const trimmedRequirements = requirements.trim();
            slideRequirements[slideIndex] = truncateText(trimmedRequirements, 4096);
        }
        
        // 读取对应的名称
        if (nameFile) {
            const name = await readTextFile(nameFile);
            // 只读取第一行作为名称
            const firstName = name.split('\n')[0].trim();
            slideNames[slideIndex] = firstName || baseName || (slideIndex + 1).toString();
        } else {
            // 如果没有名称文件，使用基础名称或默认名称
            slideNames[slideIndex] = baseName || (slideIndex + 1).toString();
        }
    }
    
    const addedCount = slides.length - startIndex;
    // console.log(`✅ 成功处理 ${addedCount} 张PPT`);
    
    // 保存到session
    pptSession.saveToSession();
    
    // 重新渲染缩略图
    const overlay = document.querySelector('.slides-overlay');
    if (overlay) {
        window.renderThumbnails(overlay);
    }
    
    // 显示成功提示
    const actionName = options.actionName || '导入';
    showMessage(`成功${actionName} ${addedCount} 张PPT`, 'info');
    
    return {
        addedCount,
        totalCount: slides.length,
        processedImages: sortedImageNames
    };
};

// 专门处理ZIP文件的统一接口
const processUploadedFilesFromZip = async (files, options = {}) => {
    // console.log(`📁 统一处理ZIP中的 ${files.length} 个文件`);
    
    // 收集图片、txt文件和名称文件
    const imageFiles = {};
    const textFiles = {};
    const nameFiles = {};
    
    // 支持的图片格式
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    // 分类文件
    files.forEach(file => {
        // 跳过系统文件
        if (file.name.startsWith('__MACOSX') || file.name.startsWith('.')) {
            // console.log(`⏭️ 跳过系统文件: ${file.name}`);
            return;
        }
        
        const fileName = file.name.toLowerCase();
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        
        if (imageExtensions.includes(extension)) {
            // 如果已经有同名的图片，跳过（只选择第一个）
            if (!imageFiles[nameWithoutExt]) {
                imageFiles[nameWithoutExt] = file;
                // console.log(`📸 收集图片文件: ${file.name}`);
            }
        } else if (extension === 'txt') {
            if (nameWithoutExt.endsWith('.name')) {
                // 这是名称文件 (新格式: NAME.name.txt)
                const slideBaseName = nameWithoutExt.replace('.name', '');
                nameFiles[slideBaseName] = file;
                // console.log(`📝 收集名称文件: ${file.name} -> ${slideBaseName}`);
            } else if (nameWithoutExt.endsWith('.requirement')) {
                // 这是演讲要求文件 (新格式: NAME.requirement.txt)
                const slideBaseName = nameWithoutExt.replace('.requirement', '');
                textFiles[slideBaseName] = file;
                // console.log(`📄 收集要求文件: ${file.name} -> ${slideBaseName}`);
            } else {
                // 兼容旧格式: NAME.txt (演讲要求)
                textFiles[nameWithoutExt] = file;
                // console.log(`📄 收集要求文件(旧格式): ${file.name} -> ${nameWithoutExt}`);
            }
        }
    });
    
    // 按文件名排序（保持原文件夹的排序）
    const sortedImageNames = Object.keys(imageFiles).sort();
    
    // console.log(`📊 找到 ${sortedImageNames.length} 个图片文件`);
    
    if (sortedImageNames.length === 0) {
        throw new Error('ZIP文件中没有找到支持的图片文件');
    }
    
    // 根据选项决定是否清空现有数据
    if (options.clearExisting !== false) {
        // 清空现有的slides、requirements和names
        slides.length = 0;
        Object.keys(slideRequirements).forEach(key => delete slideRequirements[key]);
        Object.keys(slideNames).forEach(key => delete slideNames[key]);
        // console.log('🗑️ 已清空现有PPT数据');
    }
    
    const startIndex = slides.length; // 记录开始添加的位置
    
    // 导入图片和对应的演讲要求、名称
    for (let i = 0; i < sortedImageNames.length; i++) {
        const baseName = sortedImageNames[i];
        const imageFile = imageFiles[baseName];
        const textFile = textFiles[baseName];
        const nameFile = nameFiles[baseName];
        
        // 读取图片（从ZIP使用特殊方法）
        const imageBlob = await imageFile.zipEntry.async('blob');
        const imageUrl = await blobToDataURL(imageBlob);
        const slideIndex = slides.length;
        slides.push(imageUrl);
        
        // 读取对应的演讲要求
        if (textFile) {
            const requirements = await textFile.zipEntry.async('text');
            // 去除前后的连续空行，然后应用4096字符限制
            const trimmedRequirements = requirements.trim();
            slideRequirements[slideIndex] = truncateText(trimmedRequirements, 4096);
        }
        
        // 读取对应的名称
        if (nameFile) {
            const name = await nameFile.zipEntry.async('text');
            // 只读取第一行作为名称
            const firstName = name.split('\n')[0].trim();
            slideNames[slideIndex] = firstName || baseName || (slideIndex + 1).toString();
        } else {
            // 如果没有名称文件，使用基础名称或默认名称
            slideNames[slideIndex] = baseName || (slideIndex + 1).toString();
        }
    }
    
    const addedCount = slides.length - startIndex;
    // console.log(`✅ 成功处理 ${addedCount} 张PPT`);
    
    // 保存到session
    pptSession.saveToSession();
    
    // 重新渲染缩略图
    const overlay = document.querySelector('.slides-overlay');
    if (overlay) {
        window.renderThumbnails(overlay);
    }
    
    // 显示成功提示
    const actionName = options.actionName || '导入';
    showMessage(`成功${actionName} ${addedCount} 张PPT`, 'info');
    
    return {
        addedCount,
        totalCount: slides.length,
        processedImages: sortedImageNames
    };
};

// 读取文本文件内容
const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file, 'utf-8');
    });
};

// 文本截断到指定字符数（4096字符限制）
const truncateText = (text, maxLength = 4096) => {
    if (!text || typeof text !== 'string') return '';
    
    if (text.length <= maxLength) {
        return text;
    }
    
    // console.log(`📝 文本长度 ${text.length} 超过限制，截断到 ${maxLength} 字符`);
    return text.substring(0, maxLength);
};

// 测试功能：下载第一张PPT进行验证
const testDownloadFirstSlide = async () => {
    // console.log('🧪 测试功能：开始下载第一张PPT进行验证');
    
    if (slides.length === 0) {
        console.warn('⚠️ 没有PPT可以测试下载');
        return;
    }
    
    try {
        const firstSlide = slides[0];
        const slideName = slideNames[0] || '001';
        
        // console.log('🔍 第一张PPT数据分析:');
        // console.log(`  - 数据类型: ${firstSlide.startsWith('data:') ? 'data URL' : '文件路径'}`);
        // console.log(`  - 数据长度: ${firstSlide.length} 字符`);
        // console.log(`  - 前100字符: ${firstSlide.substring(0, 100)}`);
        
        if (firstSlide.startsWith('data:')) {
            // 处理data URL
            const response = await fetch(firstSlide);
            const blob = await response.blob();
            
            // console.log('📊 Blob信息:');
            // console.log(`  - 原始blob类型: ${blob.type}`);
            // console.log(`  - 原始blob大小: ${blob.size} bytes`);
            
            // 从data URL中提取MIME类型
            const mimeMatch = firstSlide.match(/^data:([^;]+);/);
            let extension = 'jpg';
            let detectedMimeType = 'unknown';
            
            if (mimeMatch) {
                detectedMimeType = mimeMatch[1];
                // console.log(`  - 检测到的MIME类型: ${detectedMimeType}`);
                
                switch (detectedMimeType) {
                    case 'image/jpeg':
                        extension = 'jpg';
                        break;
                    case 'image/png':
                        extension = 'png';
                        break;
                    case 'image/gif':
                        extension = 'gif';
                        break;
                    case 'image/bmp':
                        extension = 'bmp';
                        break;
                    case 'image/webp':
                        extension = 'webp';
                        break;
                    default:
                        if (blob.type && blob.type.includes('/')) {
                            extension = blob.type.split('/')[1] || 'jpg';
                        }
                }
            }
            
            // console.log(`  - 确定的扩展名: ${extension}`);
            
            // 创建修正的blob
            const correctMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            const correctedBlob = new Blob([blob], { type: correctMimeType });
            
            // console.log('🔧 修正后的Blob信息:');
            // console.log(`  - 修正后blob类型: ${correctedBlob.type}`);
            // console.log(`  - 修正后blob大小: ${correctedBlob.size} bytes`);
            
            // 下载文件
            const url = URL.createObjectURL(correctedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `test_${slideName}.${extension}`;
            link.click();
            URL.revokeObjectURL(url);
            
            // console.log(`✅ 测试下载完成: test_${slideName}.${extension}`);
            showMessage(`测试下载第一张PPT: test_${slideName}.${extension}`, 'info');
            
        } else {
            // console.log('📁 处理文件路径格式的PPT');
            // 处理文件路径
            const response = await fetch(firstSlide);
            const blob = await response.blob();
            const extension = firstSlide.split('.').pop().toLowerCase() || 'jpg';
            
            // console.log('📊 文件路径Blob信息:');
            // console.log(`  - blob类型: ${blob.type}`);
            // console.log(`  - blob大小: ${blob.size} bytes`);
            // console.log(`  - 扩展名: ${extension}`);
            
            const correctMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            const correctedBlob = new Blob([blob], { type: correctMimeType });
            
            const url = URL.createObjectURL(correctedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `test_${slideName}.${extension}`;
            link.click();
            URL.revokeObjectURL(url);
            
            // console.log(`✅ 测试下载完成: test_${slideName}.${extension}`);
            showMessage(`测试下载第一张PPT: test_${slideName}.${extension}`, 'info');
        }
        
    } catch (error) {
        console.error('❌ 测试下载失败:', error);
        showMessage('测试下载失败: ' + error.message, 'error');
    }
};

// 手动触发测试下载的接口
const manualTestDownload = () => {
    // console.log('🔧 手动触发测试下载');
    testDownloadFirstSlide();
};

// 通用的图片下载API - 用于实际的打包下载
const downloadImageAsCorrectFormat = async (imageDataUrl, fileName = 'image') => {
    // console.log(`📥 开始下载图片: ${fileName}`);
    
    try {
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
            throw new Error('无效的图片数据URL');
        }
        
        // 从data URL获取图片数据
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        
        // console.log(`📊 原始图片信息:`);
        // console.log(`  - 原始blob类型: ${blob.type}`);
        // console.log(`  - 原始blob大小: ${blob.size} bytes`);
        
        // 从data URL中提取MIME类型和扩展名
        const mimeMatch = imageDataUrl.match(/^data:([^;]+);/);
        let extension = 'jpg';
        let detectedMimeType = 'unknown';
        
        if (mimeMatch) {
            detectedMimeType = mimeMatch[1];
            // console.log(`  - 检测到的MIME类型: ${detectedMimeType}`);
            
            switch (detectedMimeType) {
                case 'image/jpeg':
                    extension = 'jpg';
                    break;
                case 'image/png':
                    extension = 'png';
                    break;
                case 'image/gif':
                    extension = 'gif';
                    break;
                case 'image/bmp':
                    extension = 'bmp';
                    break;
                case 'image/webp':
                    extension = 'webp';
                    break;
                case 'image/svg+xml':
                    extension = 'svg';
                    break;
                default:
                    // 尝试从blob.type获取
                    if (blob.type && blob.type.includes('/')) {
                        const blobExtension = blob.type.split('/')[1];
                        if (blobExtension) {
                            extension = blobExtension === 'jpeg' ? 'jpg' : blobExtension;
                        }
                    }
            }
        }
        
        // console.log(`  - 确定的扩展名: ${extension}`);
        
        // 创建具有正确MIME类型的blob
        const correctMimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        const correctedBlob = new Blob([blob], { type: correctMimeType });
        
        // console.log(`🔧 修正后的图片信息:`);
        // console.log(`  - 修正后blob类型: ${correctedBlob.type}`);
        // console.log(`  - 修正后blob大小: ${correctedBlob.size} bytes`);
        
        // 创建下载链接
        const url = URL.createObjectURL(correctedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.${extension}`;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        URL.revokeObjectURL(url);
        
        // console.log(`✅ 图片下载完成: ${fileName}.${extension}`);
        return {
            success: true,
            fileName: `${fileName}.${extension}`,
            extension: extension,
            mimeType: correctMimeType,
            size: correctedBlob.size
        };
        
    } catch (error) {
        console.error(`❌ 图片下载失败 (${fileName}):`, error);
        return {
            success: false,
            error: error.message,
            fileName: fileName
        };
    }
};

// 批量下载所有PPT图片的API
const batchDownloadAllSlides = async () => {
    // console.log('📦 开始批量下载所有PPT图片');
    
    if (slides.length === 0) {
        showMessage('没有可下载的PPT', 'info');
        return { success: false, error: '没有PPT数据' };
    }
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideIndex = String(i + 1).padStart(3, '0'); // 001, 002, 003...
        const slideName = slideNames[i] || slideIndex;
        
        // console.log(`📸 处理第 ${i + 1} 张PPT: ${slideName}`);
        
        if (slide.startsWith('data:')) {
            const result = await downloadImageAsCorrectFormat(slide, slideIndex);
            results.push(result);
            
            if (result.success) {
                successCount++;
                // console.log(`✅ PPT ${i + 1} 下载成功`);
            } else {
                failCount++;
                // console.log(`❌ PPT ${i + 1} 下载失败: ${result.error}`);
            }
            
            // 添加小延迟，避免浏览器阻止多个下载
            await new Promise(resolve => setTimeout(resolve, 300));
        } else {
            // console.log(`⚠️ PPT ${i + 1} 不是data URL格式，跳过`);
            results.push({
                success: false,
                error: '不是data URL格式',
                fileName: slideIndex
            });
            failCount++;
        }
    }
    
    const summary = {
        success: successCount > 0,
        total: slides.length,
        successCount: successCount,
        failCount: failCount,
        results: results
    };
    
    // console.log('📊 批量下载结果汇总:');
    // console.log(`  - 总计: ${summary.total} 张PPT`);
    // console.log(`  - 成功: ${summary.successCount} 张`);
    // console.log(`  - 失败: ${summary.failCount} 张`);
    
    if (successCount > 0) {
        showMessage(`成功下载 ${successCount}/${slides.length} 张PPT`, 'success');
    } else {
        showMessage('所有PPT下载都失败了', 'error');
    }
    
    return summary;
};

// 导出函数供全局使用
window.cancelSpeechRequirements = cancelSpeechRequirements;
window.showMessage = showMessage;
window.saveSpeechRequirements = saveSpeechRequirements;
window.batchExportSlides = batchExportSlides;
window.batchImportSlides = batchImportSlides;
window.toggleImportDropdown = toggleImportDropdown;
window.batchImportFolder = batchImportFolder;
window.updateCharCount = updateCharCount;
window.testDownloadFirstSlide = testDownloadFirstSlide;
window.manualTestDownload = manualTestDownload;
window.downloadImageAsCorrectFormat = downloadImageAsCorrectFormat;
window.batchDownloadAllSlides = batchDownloadAllSlides;

