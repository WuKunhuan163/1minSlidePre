// 全局变量定义
let effectsVolume = simpleConfig.get('effectsVolume') || 0.5; // 从配置加载音量，默认50%
let effectsMuted = false;
let maxEffectsVolume = 1.0;

// PPT管理全局变量
let slides = [
    'assets/slides/Day2-1.JPG', 'assets/slides/Day2-2.JPG', 
    // 'assets/slides/Day3-1.JPG', 'assets/slides/Day3-2.JPG', 'assets/slides/Day3-3.JPG', 'assets/slides/Day3-4.JPG', 'assets/slides/Day3-5.JPG', 'assets/slides/Day3-6.JPG', 'assets/slides/Day3-7.JPG', 'assets/slides/Day3-8.JPG', 'assets/slides/Day3-9.JPG', 'assets/slides/Day3-10.JPG', 'assets/slides/Day3-11.JPG', 
    // 'assets/slides/Day4-1.JPG', 'assets/slides/Day4-2.JPG', 'assets/slides/Day4-3.JPG', 'assets/slides/Day4-4.JPG', 'assets/slides/Day4-5.JPG', 'assets/slides/Day4-6.JPG', 
];
let selectedSlideIndex = -1; // 当前选中的PPT索引
let slideRequirements = {}; // 存储每张PPT的演讲要求

// 初始化默认PPT的演讲要求（如果没有对应txt文件，则暂时没有要求）
const initializeDefaultSlideRequirements = () => {
    slides.forEach((slide, index) => {
        if (!slideRequirements.hasOwnProperty(index)) {
            // 默认PPT没有演讲要求，保持undefined
            // slideRequirements[index] 不设置，表示暂时没有要求
        }
    });
};

document.addEventListener('DOMContentLoaded', function() {
    const customSelect = document.querySelector('.custom-select');
    const selectHeader = customSelect.querySelector('.select-header');
    const selectedValue = customSelect.querySelector('.selected-value');
    const timeOptions = customSelect.querySelectorAll('.time-option');
    let selectedTime = 1; 

    let isIOSFunction = () => {
        const userAgent = window.navigator.userAgent;
        let result = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        console.log(result ? "The device is iOS" : "The device is not iOS");
        return result;
    };
    let isIOS = isIOSFunction();

    // Select functionality
    selectHeader.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    timeOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedTime = 1; // 固定为1分钟
            selectedValue.textContent = option.textContent;
            customSelect.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Slides management - 使用全局变量 
    const uploadButton = document.querySelector('.action-button');
    
    // Create slides manager overlay
    const createSlidesManager = () => {
        const overlay = document.createElement('div');
        overlay.className = 'slides-overlay';
        
        overlay.innerHTML = `
            <div class="slides-header">
                <button class="back-button">
                    <i class='bx bx-arrow-back'></i>
                </button>
                <h2>已经上传的PPT</h2>
                <!-- 批量导入导出按钮 -->
                <div class="config-actions">
                    <button class="btn btn-import" onclick="batchImportSlides()">批量导入</button>
                    <button class="btn btn-export" onclick="batchExportSlides()">批量导出</button>
                </div>
            </div>
            <div class="thumbnails-container">
                <div class="thumbnail add-slide">
                    <i class='bx bx-plus'></i>
                </div>
            </div>
            
            <!-- 演讲内容要求输入区域 -->
            <div class="speech-requirements" id="speechRequirements">
                <h3>
                    <i class='bx bx-edit-alt'></i>
                    演讲内容要求
                </h3>
                <textarea id="speechRequirementsText" placeholder="请输入对这张PPT演讲的具体要求，AI将根据这些要求对您的演讲进行评分...

例如：
- 需要包含产品特性介绍
- 强调用户痛点和解决方案
- 控制在1分钟内完成
- 语调要有感染力"></textarea>
                <div class="button-row">
                    <button class="btn btn-cancel" onclick="cancelSpeechRequirements()">取消</button>
                    <button class="btn btn-save" onclick="saveSpeechRequirements()">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };

    // Render thumbnails
    var renderThumbnails = (container) => {
        const thumbnailsContainer = container.querySelector('.thumbnails-container');
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
            thumbnail.innerHTML = `
                <img src="${slide}" alt="Slide ${index + 1}">
                <button class="remove-slide" data-index="${index}">
                    <i class='bx bxs-x-circle'></i>
                </button>
            `;
            thumbnailsContainer.insertBefore(thumbnail, addButton);
        });
    };

    // Handle slide upload
    const handleSlideUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newIndex = slides.length;
                    slides.push(e.target.result);
                    // 通过加号添加的图片，要求默认为空
                    // slideRequirements[newIndex] 不设置，保持undefined
                    renderThumbnails(document.querySelector('.slides-overlay'));
                };
                reader.readAsDataURL(file);
            });
        };

        input.click();
    };

    // Upload button click handler
    uploadButton.addEventListener('click', () => {
        const overlay = createSlidesManager();
        renderThumbnails(overlay);

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
                // 删除对应的演讲要求
                delete slideRequirements[index];
                // 重新调整slideRequirements的键值
                const newRequirements = {};
                Object.keys(slideRequirements).forEach(key => {
                    const oldIndex = parseInt(key);
                    if (oldIndex > index) {
                        newRequirements[oldIndex - 1] = slideRequirements[key];
                    } else {
                        newRequirements[key] = slideRequirements[key];
                    }
                });
                slideRequirements = newRequirements;
                renderThumbnails(overlay);
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

    // Presentation management
    const startButton = document.querySelectorAll('.action-button')[1]; // Second button
    
    const updateStartButton = () => {
        // 开始演讲按钮始终可用，没有PPT时会跳转到上传PPT
        startButton.disabled = false;
    };

    // Update start button state whenever slides change
    const originalRenderThumbnails = renderThumbnails;
    renderThumbnails = (container) => {
        originalRenderThumbnails(container);
        updateStartButton();
    };

    // Create presentation view
    const createPresentationView = () => {
        const overlay = document.createElement('div');
        overlay.className = 'presentation-overlay';
        overlay.innerHTML = `
            <div class="presentation-header">
                <button class="back-button">
                    <i class='bx bx-arrow-back'></i>
                </button>
                <h2>1分钟即兴演讲</h2>
            </div>
            <div class="slide-container"></div>
            <div class="timer-container">
                <div class="timer-display">00:00</div>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
            <div class="countdown-overlay"></div>
            <div class="presentation-controls"></div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };

    // Get random slide
    const getRandomSlide = () => {
        const randomIndex = Math.floor(Math.random() * slides.length);
        return slides[randomIndex];
    };

    // Start countdown
    const startPresentation = async (overlay) => {
        // 进入演讲模式，停止背景音乐
        isPresentationMode = true;
        toggleBackgroundMusic(false);
        
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
            const totalTime = selectedTime * 60;
            const progress = Math.min((currentTime / totalTime) * 100, 100);
            timerDisplay.textContent = formatTime(currentTime);
            progressBar.style.width = `${progress}%`;
            if (isActive) {
                if (currentTime >= totalTime && !endWarned) {
                    console.log("Presentation time is up!");
                    endWarned = true;
                    if (!effectsMuted) {
                        endSound.volume = effectsVolume * effectsVolume; // 平方权重 
                        endSound.play();
                    }
                } else if (currentTime >= totalTime / 2 && !halfwayWarned) {
                    console.log("Presentation time is halfway!");
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
                <button class="stop-recording">停止</button>
            `;
            const recordStopButton = controlsContainer.querySelector('.stop-recording');
            recordStopButton.style.cursor = 'none';
            recordStopButton.style.visibility = 'hidden';
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            slideContainer.classList.add('blur');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!isActive) return;
            console.log("Get ready for the presentation! ");
            if (!effectsMuted) {
                startSound.currentTime = 0;
                startSound.volume = effectsVolume * effectsVolume; // 平方权重
                await startSound.play();
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            const countdown = ['3', '2', '1', '开始'];
            for (let text of countdown) {
                if (!countdownOverlay) break;
                countdownOverlay.textContent = text;
                countdownOverlay.classList.add('show');
                await new Promise(resolve => setTimeout(resolve, 800));
                if (text != "开始") {countdownOverlay.classList.remove('show');}
                await new Promise(resolve => setTimeout(resolve, 200));
                if (text == "开始") {
                    countdownOverlay.style.transition = "reset";
                    countdownOverlay.classList.remove('show');
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
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 100);
            if (overlay) {
                recordStopButton.addEventListener('click', () => {
                    clearInterval(timerInterval);
                    isActive = false;
                    [startSound, halfwaySound, endSound].forEach(sound => {
                        sound.pause();
                        sound.currentTime = 0;
                    });
                    recordStopButton.textContent = '演讲已结束';
                    recordStopButton.style.backgroundColor = '#666';
                    timerDisplay.style.color = '#fff';
                    progressBar.style.backgroundColor = '#fff';
                    recordStopButton.disabled = true;
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
            console.log('🎯 没有PPT，自动跳转到上传PPT界面');
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
    console.log('🎵 背景音乐已准备就绪，等待用户交互后播放');
};

// 尝试启动背景音乐（在用户交互后调用）
const tryStartBackgroundMusic = () => {
    if (backgroundMusic && isBackgroundMusicEnabled && !isPresentationMode && !audioContextUnlocked) {
        backgroundMusic.play().then(() => {
            audioContextUnlocked = true;
            console.log('🎵 背景音乐开始播放');
        }).catch(e => {
            console.log('🔇 背景音乐仍需要用户交互:', e.message);
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
    console.log('🚀 DOM加载完成，开始初始化');
    console.log('🚀 当前时间:', new Date().toLocaleTimeString());
    
    // 初始化设置页面
    initAudioSetup();
    initSettingsPage();
    console.log('🚀 设置页面初始化完成');
    
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
    console.log('🎯 初始化PPT选择功能');
};

// 选择PPT幻灯片
const selectSlide = (index, overlay) => {
    console.log(`🎯 选择PPT幻灯片: ${index}`);
    
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
    
    if (requirementsPanel && textarea) {
        // 加载已有的演讲要求
        textarea.value = slideRequirements[slideIndex] || '';
        
        // 显示面板
        requirementsPanel.classList.add('show');
        
        // 聚焦到文本框
        setTimeout(() => {
            textarea.focus();
        }, 300);
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
    console.log('🎯 取消演讲内容要求输入');
    
    // 清除选中状态
    const allThumbnails = document.querySelectorAll('.thumbnail:not(.add-slide)');
    allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
    
    selectedSlideIndex = -1;
    hideSpeechRequirements();
};

// 保存演讲内容要求
const saveSpeechRequirements = () => {
    console.log('🎯 保存演讲内容要求');
    
    if (selectedSlideIndex === -1) {
        console.warn('⚠️ 没有选中的PPT');
        return;
    }
    
    const textarea = document.getElementById('speechRequirementsText');
    if (textarea) {
        const requirements = textarea.value.trim();
        
        if (requirements) {
            // 保存演讲要求
            slideRequirements[selectedSlideIndex] = requirements;
            console.log(`✅ 已保存PPT ${selectedSlideIndex} 的演讲要求:`, requirements);
            
            // 可以在这里添加视觉反馈，比如显示保存成功的提示
            showSaveSuccessMessage();
        } else {
            // 如果内容为空，删除该PPT的演讲要求
            delete slideRequirements[selectedSlideIndex];
            console.log(`🗑️ 已删除PPT ${selectedSlideIndex} 的演讲要求`);
        }
        
        hideSpeechRequirements();
        
        // 清除选中状态
        const allThumbnails = document.querySelectorAll('.thumbnail:not(.add-slide)');
        allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
        selectedSlideIndex = -1;
    }
};

// 显示保存成功消息
const showSaveSuccessMessage = () => {
    // 创建临时提示消息
    const message = document.createElement('div');
    message.textContent = '✅ 演讲要求已保存';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #666AF6;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(message);
    
    // 2秒后自动移除
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 2000);
};

// 批量导出PPT和演讲要求
const batchExportSlides = async () => {
    console.log('📦 开始批量导出PPT和演讲要求');
    
    if (slides.length === 0) {
        alert('没有可导出的PPT');
        return;
    }
    
    try {
        const zip = new JSZip();
        
        // 处理每张PPT
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideIndex = String(i + 1).padStart(3, '0'); // 001, 002, 003...
            
            // 添加图片到zip
            if (slide.startsWith('data:')) {
                // 如果是data URL，提取图片数据
                const response = await fetch(slide);
                const blob = await response.blob();
                const extension = blob.type.split('/')[1] || 'jpg';
                zip.file(`${slideIndex}.${extension}`, blob);
            } else {
                // 如果是文件路径，需要获取图片数据
                try {
                    const response = await fetch(slide);
                    const blob = await response.blob();
                    const extension = slide.split('.').pop().toLowerCase() || 'jpg';
                    zip.file(`${slideIndex}.${extension}`, blob);
                } catch (error) {
                    console.warn(`无法获取图片 ${slide}:`, error);
                    // 跳过这张图片
                    continue;
                }
            }
            
            // 添加演讲要求txt文件
            const requirements = slideRequirements[i] || '';
            zip.file(`${slideIndex}.txt`, requirements);
        }
        
        // 生成并下载zip文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `PPT演讲资料_${new Date().toISOString().slice(0, 10)}.zip`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('✅ 批量导出完成');
        
        // 显示成功提示
        showExportSuccessMessage();
        
    } catch (error) {
        console.error('❌ 批量导出失败:', error);
        alert('批量导出失败: ' + error.message);
    }
};

// 批量导入PPT和演讲要求
const batchImportSlides = () => {
    console.log('📥 开始批量导入PPT和演讲要求');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            // 收集图片和txt文件
            const imageFiles = {};
            const textFiles = {};
            
            // 遍历zip中的所有文件
            zipContent.forEach((relativePath, zipEntry) => {
                const fileName = relativePath.toLowerCase();
                const baseName = fileName.split('.')[0];
                const extension = fileName.split('.').pop();
                
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
                    // 如果已经有同名的图片，跳过（只选择第一个）
                    if (!imageFiles[baseName]) {
                        imageFiles[baseName] = zipEntry;
                    }
                } else if (extension === 'txt') {
                    textFiles[baseName] = zipEntry;
                }
            });
            
            // 按数字顺序排序
            const sortedImageNames = Object.keys(imageFiles).sort((a, b) => {
                const numA = parseInt(a) || 0;
                const numB = parseInt(b) || 0;
                return numA - numB;
            });
            
            // 清空现有的slides和requirements
            slides.length = 0;
            Object.keys(slideRequirements).forEach(key => delete slideRequirements[key]);
            
            // 导入图片和对应的演讲要求
            for (let i = 0; i < sortedImageNames.length; i++) {
                const baseName = sortedImageNames[i];
                const imageEntry = imageFiles[baseName];
                const textEntry = textFiles[baseName];
                
                // 读取图片
                const imageBlob = await imageEntry.async('blob');
                const imageUrl = await blobToDataURL(imageBlob);
                slides.push(imageUrl);
                
                // 读取对应的演讲要求
                if (textEntry) {
                    const requirements = await textEntry.async('text');
                    slideRequirements[i] = requirements;
                }
            }
            
            console.log(`✅ 成功导入 ${slides.length} 张PPT`);
            
            // 重新渲染缩略图
            const overlay = document.querySelector('.slides-overlay');
            if (overlay) {
                renderThumbnails(overlay);
            }
            
            // 显示成功提示
            showImportSuccessMessage(slides.length);
            
        } catch (error) {
            console.error('❌ 批量导入失败:', error);
            alert('批量导入失败: ' + error.message);
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

// 显示导出成功消息
const showExportSuccessMessage = () => {
    const message = document.createElement('div');
    message.textContent = '📦 批量导出成功';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #28a745;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 2000);
};

// 显示导入成功消息
const showImportSuccessMessage = (count) => {
    const message = document.createElement('div');
    message.textContent = `📥 成功导入 ${count} 张PPT`;
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #666AF6;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 2000);
};

// 导出函数供全局使用
window.cancelSpeechRequirements = cancelSpeechRequirements;
window.saveSpeechRequirements = saveSpeechRequirements;
window.batchExportSlides = batchExportSlides;
window.batchImportSlides = batchImportSlides;

