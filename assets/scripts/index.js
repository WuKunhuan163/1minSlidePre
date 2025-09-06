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
                    <div class="import-dropdown">
                        <button class="btn btn-import" onclick="toggleImportDropdown()">批量导入 ▼</button>
                        <div class="import-options" id="importOptions" style="display: none;">
                            <button onclick="batchImportSlides()">导入ZIP文件</button>
                            <button onclick="batchImportFolder()">导入文件夹</button>
                        </div>
                    </div>
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
                <h3>演讲内容要求</h3>
                <div class="textarea-wrapper">
                    <textarea id="speechRequirementsText" placeholder="请输入对这张PPT演讲的内容要求。例如：需要包含产品特性介绍，强调用户痛点和解决方案。越详细越好。最多4096字。AI将根据这些要求对您的演讲进行评分。" maxlength="4096" oninput="updateCharCount()"></textarea>
                    <div class="char-count" id="charCount">0/4096</div>
                </div>
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

    // 预加载阶段 - 纯黑屏，快速完成
    const performPreloadSteps = async (overlay) => {
        console.log('🎬 开始预加载阶段');
        
        // 步骤1: 请求麦克风权限
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ 麦克风权限获取成功');
            // 停止流，我们只是为了获取权限
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.warn('⚠️ 麦克风权限获取失败:', error);
        }
        
        // 步骤2: 请求摄像头权限
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('✅ 摄像头权限获取成功');
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
            console.log(`✅ PPT图片加载完成: ${successCount}/${slides.length}`);
        } catch (error) {
            console.warn('⚠️ PPT图片加载失败:', error);
        }
        
        console.log('🎬 预加载阶段完成');
    };

    // 开始录音录像
    const startRecording = async () => {
        console.log('🎤 开始录音录像');
        
        // 重置之前的录制数据
        audioChunks = [];
        videoChunks = [];
        audioBlob = null;
        videoBlob = null;
        
        try {
            // 尝试同时获取音频和视频
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: true 
            });
            
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
                console.log('📹 视频录制完成');
            };
            
            videoRecorder.start();
            console.log('✅ 视频录制（含音频）已开始');
            
        } catch (error) {
            console.warn('⚠️ 视频录制失败，尝试仅录音:', error);
            
            try {
                // 如果视频失败，至少尝试录音
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
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
                    console.log('🎤 音频录制完成，开始转换为MP3');
                    
                    try {
                        audioBlob = await convertToMp3(webmBlob);
                        console.log('✅ 音频转换为MP3成功');
                    } catch (error) {
                        console.warn('⚠️ MP3转换失败，使用原始格式:', error);
                        audioBlob = webmBlob;
                    }
                };
                
                mediaRecorder.start();
                console.log('✅ 音频录制已开始');
                
            } catch (audioError) {
                console.warn('⚠️ 音频录制也失败:', audioError);
            }
        }
    };

    // 停止录音录像
    const stopRecording = () => {
        console.log('🛑 停止录音录像');
        
        if (videoRecorder && videoRecorder.state !== 'inactive') {
            videoRecorder.stop();
            // 停止所有轨道
            videoRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            // 停止所有轨道
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    // 将音频转换为MP3
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

    // 添加下载按钮
    const addDownloadButtons = (overlay) => {
        console.log('📥 添加下载按钮');
        
        const timerContainer = overlay.querySelector('.timer-container');
        if (!timerContainer) return;
        
        // 创建下载按钮容器
        const downloadContainer = document.createElement('div');
        downloadContainer.className = 'download-buttons';
        downloadContainer.id = 'downloadButtonsContainer';
        downloadContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: center;
            flex-wrap: wrap;
        `;
        
        // 下载音频按钮
        if (audioBlob) {
            const downloadAudioBtn = document.createElement('button');
            downloadAudioBtn.textContent = '下载音频';
            downloadAudioBtn.className = 'download-btn audio-btn';
            downloadAudioBtn.style.cssText = `
                padding: 10px 20px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin: 5px;
            `;
            
            downloadAudioBtn.onclick = () => {
                downloadAudio();
            };
            
            downloadContainer.appendChild(downloadAudioBtn);
        }
        
        // 下载视频按钮
        if (videoBlob) {
            const downloadVideoBtn = document.createElement('button');
            downloadVideoBtn.textContent = '下载视频';
            downloadVideoBtn.className = 'download-btn video-btn';
            downloadVideoBtn.style.cssText = `
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin: 5px;
            `;
            
            downloadVideoBtn.onclick = () => {
                downloadVideo();
            };
            
            downloadContainer.appendChild(downloadVideoBtn);
        }
        
        // 文字稿按钮（如果需要）
        if (shouldShowTranscriptButton()) {
            const transcriptBtn = document.createElement('button');
            transcriptBtn.textContent = '转译中';
            transcriptBtn.className = 'download-btn transcript-btn';
            transcriptBtn.id = 'transcriptButton';
            transcriptBtn.style.cssText = `
                padding: 10px 20px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: not-allowed;
                font-size: 14px;
                margin: 5px;
            `;
            transcriptBtn.disabled = true;
            
            downloadContainer.appendChild(transcriptBtn);
        }
        
        timerContainer.appendChild(downloadContainer);
    };

    // 下载音频
    const downloadAudio = () => {
        console.log('🎤 下载音频');
        
        let blob = audioBlob;
        let filename = '演讲录音.mp3';
        
        // 如果有视频但没有单独的音频，从视频中提取音频
        if (!audioBlob && videoBlob) {
            blob = videoBlob;
            filename = '演讲录音.webm'; // 视频文件保持webm格式
        }
        
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // 下载视频
    const downloadVideo = () => {
        console.log('📹 下载视频');
        
        if (videoBlob) {
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '演讲录像.webm';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Start countdown
    const startPresentation = async (overlay) => {
        // 进入演讲模式，停止背景音乐
        isPresentationMode = true;
        toggleBackgroundMusic(false);
        
        // 首先执行预加载步骤
        await performPreloadSteps(overlay);
        
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
            // 开始录音录像
            await startRecording();
            
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
                    // 停止录音录像
                    stopRecording();
                    
                    recordStopButton.textContent = '已结束';
                    recordStopButton.style.backgroundColor = '#666';
                    timerDisplay.style.color = '#fff';
                    progressBar.style.backgroundColor = '#fff';
                    recordStopButton.disabled = true;
                    
                    // 添加下载按钮和文字稿功能
                    addDownloadButtons(overlay);
                    
                    // 如果开启了录音识别功能，开始语音转文字
                    if (shouldShowTranscriptButton()) {
                        startSpeechRecognition(overlay);
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
        const currentRequirements = slideRequirements[slideIndex] || '';
        textarea.value = currentRequirements;
        
        // 更新字数统计
        updateCharCount();
        
        // 显示面板
        requirementsPanel.classList.add('show');
        
        // 聚焦到文本框
        setTimeout(() => {
            textarea.focus();
        }, 300);
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
            charCount.style.color = '#666';
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
            // 应用4096字符限制并保存演讲要求
            const truncatedRequirements = truncateText(requirements, 4096);
            slideRequirements[selectedSlideIndex] = truncatedRequirements;
            console.log(`✅ 已保存PPT ${selectedSlideIndex} 的演讲要求:`, truncatedRequirements.substring(0, 50) + '...');
            
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
            console.log(`🗑️ 已删除PPT ${selectedSlideIndex} 的演讲要求`);
        }
        
        hideSpeechRequirements();
        
        // 清除选中状态
        const allThumbnails = document.querySelectorAll('.thumbnail:not(.add-slide)');
        allThumbnails.forEach(thumb => thumb.classList.remove('selected'));
        selectedSlideIndex = -1;
    }
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
    input.webkitdirectory = false; // 默认文件模式
    input.multiple = true; // 允许多选
    
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

// 检查是否应该显示文字稿按钮
const shouldShowTranscriptButton = () => {
    // 检查是否开启了录音识别功能和麦克风权限
    const recordingEnabled = simpleConfig.get('recordingEnabled');
    return recordingEnabled && (audioBlob || videoBlob);
};

// 开始语音识别
const startSpeechRecognition = async (overlay) => {
    console.log('🎤 开始语音识别');
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
            console.log('✅ 语音识别成功:', transcriptText);
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
    console.log('🔄 重试语音识别');
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
    console.log('📄 下载文字稿');
    
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
    console.log('🤖 开始AI评分');
    // TODO: 实现AI评分功能
    alert('AI评分功能开发中...');
};

// 调用阿里云语音识别API
const callAliyunSpeechAPI = async (audioBlob) => {
    // TODO: 实现阿里云语音识别API调用
    // 这里需要实现实际的API调用逻辑
    console.log('🔄 调用阿里云语音识别API');
    
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
    
    // 根据类型设置不同的样式
    const typeStyles = {
        success: {
            background: '#4CAF50',
            icon: '✅'
        },
        error: {
            background: '#f44336',
            icon: '❌'
        },
        info: {
            background: '#666AF6',
            icon: '📥'
        },
        warning: {
            background: '#ff9800',
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
    console.log('📁 开始批量导入文件夹');
    
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
            alert('文件夹导入失败: ' + error.message);
        }
    };
    
    input.click();
};

// 处理文件夹中的文件
const processFolderFiles = async (files) => {
    console.log(`📁 处理文件夹中的 ${files.length} 个文件`);
    
    // 收集图片和txt文件
    const imageFiles = {};
    const textFiles = {};
    
    // 支持的图片格式
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    files.forEach(file => {
        const fileName = file.name.toLowerCase();
        const baseName = fileName.split('.')[0];
        const extension = fileName.split('.').pop();
        
        if (imageExtensions.includes(extension)) {
            // 如果已经有同名的图片，跳过（只选择第一个）
            if (!imageFiles[baseName]) {
                imageFiles[baseName] = file;
            }
        } else if (extension === 'txt') {
            textFiles[baseName] = file;
        }
    });
    
    // 按文件名排序（保持原文件夹的排序）
    const sortedImageNames = Object.keys(imageFiles).sort();
    
    console.log(`📊 找到 ${sortedImageNames.length} 个图片文件`);
    
    if (sortedImageNames.length === 0) {
        throw new Error('文件夹中没有找到支持的图片文件');
    }
    
    // 清空现有的slides和requirements
    slides.length = 0;
    Object.keys(slideRequirements).forEach(key => delete slideRequirements[key]);
    
    // 导入图片和对应的演讲要求
    for (let i = 0; i < sortedImageNames.length; i++) {
        const baseName = sortedImageNames[i];
        const imageFile = imageFiles[baseName];
        const textFile = textFiles[baseName];
        
        // 读取图片
        const imageUrl = await fileToDataURL(imageFile);
        slides.push(imageUrl);
        
        // 读取对应的演讲要求
        if (textFile) {
            const requirements = await readTextFile(textFile);
            // 应用4096字符限制
            slideRequirements[i] = truncateText(requirements, 4096);
        }
    }
    
    console.log(`✅ 成功导入 ${slides.length} 张PPT`);
    
    // 重新渲染缩略图
    const overlay = document.querySelector('.slides-overlay');
    if (overlay) {
        renderThumbnails(overlay);
    }
    
    // 显示成功提示
    showMessage(`成功导入 ${slides.length} 张PPT`, 'info');
};

// 显示导入成功消息
const showImportSuccessMessage = (count) => {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = `成功导入 ${count} 张PPT`;
    message.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // 动画显示
    requestAnimationFrame(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateX(-50%) translateY(-10px)';
    });
    
    // 3秒后自动消失
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 3000);
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
    
    console.log(`📝 文本长度 ${text.length} 超过限制，截断到 ${maxLength} 字符`);
    return text.substring(0, maxLength);
};

// 导出函数供全局使用
window.cancelSpeechRequirements = cancelSpeechRequirements;
window.saveSpeechRequirements = saveSpeechRequirements;
window.batchExportSlides = batchExportSlides;
window.batchImportSlides = batchImportSlides;
window.toggleImportDropdown = toggleImportDropdown;
window.batchImportFolder = batchImportFolder;
window.updateCharCount = updateCharCount;

