document.addEventListener('DOMContentLoaded', function() {
    const customSelect = document.querySelector('.custom-select');
    const selectHeader = customSelect.querySelector('.select-header');
    const selectedValue = customSelect.querySelector('.selected-value');
    const timeOptions = customSelect.querySelectorAll('.time-option');
    let selectedTime = 1;

    // Select functionality
    selectHeader.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    timeOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedTime = parseInt(option.dataset.value);
            selectedValue.textContent = option.textContent;
            customSelect.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Slides management
    let slides = ['assets/slides/0.JPG', 'assets/slides/1.JPG']; // Default slides
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
            </div>
            <div class="thumbnails-container">
                <div class="thumbnail add-slide">
                    <i class='bx bx-plus'></i>
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
                    slides.push(e.target.result);
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

        // Remove slide handler
        overlay.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.remove-slide');
            if (removeButton) {
                const index = parseInt(removeButton.dataset.index);
                slides.splice(index, 1);
                renderThumbnails(overlay);
            }
        });
    });

    // Presentation management
    const startButton = document.querySelectorAll('.action-button')[1]; // Second button
    
    const updateStartButton = () => {
        if (slides.length === 0) {
            startButton.disabled = true;
        } else {
            startButton.disabled = false;
        }
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
                <h2>${selectedTime}分钟即兴演讲</h2>
            </div>
            <div class="slide-container"></div>
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

    // Start countdown and recording
    const startPresentation = async (overlay) => {
        const slideContainer = overlay.querySelector('.slide-container');
        const controlsContainer = overlay.querySelector('.presentation-controls');
        const countdownOverlay = overlay.querySelector('.countdown-overlay');
        const backButton = overlay.querySelector('.back-button');
        const startSound = new Audio('assets/effects/start.mp3');
        let mediaRecorder;
        let recordedChunks = [];
        let isRecording = false;

        try {
            // Check if it's a mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            let stream;

            if (isMobile) {
                // For mobile devices, just capture audio
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                }).catch(err => {
                    console.error('Error accessing media devices:', err);
                    return null;
                });
            } else {
                // For desktop, try screen capture with audio
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { 
                        displaySurface: "browser",
                        frameRate: 30,
                        preferCurrentTab: true
                    },
                    audio: true,
                    systemAudio: "include",
                    surfaceSwitching: "include",
                    selfBrowserSurface: "include"
                }).catch(async () => {
                    // Fallback to just audio if screen capture fails
                    return await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false
                    }).catch(() => null);
                });
            }

            slideContainer.innerHTML = `
                <img src="${getRandomSlide()}" alt="Presentation Slide" class="presentation-slide">
            `;

            if (stream) {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };
                mediaRecorder.onstop = () => {
                    if (recordedChunks.length > 0) {
                        const blob = new Blob(recordedChunks, { 
                            type: isMobile ? 'audio/webm' : 'video/webm' 
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = isMobile ? '即兴演讲.webm' : '即兴演讲.webm';
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                    stream.getTracks().forEach(track => track.stop());
                };
                isRecording = true;
            }

            // Setup back button handler
            backButton.addEventListener('click', () => {
                if (isRecording && mediaRecorder) {
                    mediaRecorder.stop();
                }
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                slideContainer = null;
                controlsContainer = null;
                mediaRecorder = null;
                countdownOverlay = null;
                overlay.remove();
            });
            controlsContainer.innerHTML = `
                <button class="stop-recording">停止录制</button>
            `;
            const recordStopButton = controlsContainer.querySelector('.stop-recording');
            recordStopButton.style.cursor = 'none';
            recordStopButton.style.visibility = 'hidden';

            // Start countdown
            slideContainer.classList.add('blur');
            await startSound.play();
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

            // Start recording
            if (slideContainer) {
                slideContainer.classList.remove('blur'); 
            }
            if (recordStopButton) {
                recordStopButton.style.visibility = 'visible';
                recordStopButton.style.cursor = 'pointer';
            }
            if (overlay) {
                if (mediaRecorder) {
                    recordStopButton.addEventListener('click', () => {
                        mediaRecorder.stop();
                        overlay.remove();
                    });
                } else {
                    recordStopButton.addEventListener('click', () => {
                        overlay.remove();
                    });
                }
            }
            if (mediaRecorder) {
                mediaRecorder.start();
            }

        } catch (err) {
            console.error('Error in presentation:', err);
            overlay.remove();
        }
    };

    // Start button click handler
    startButton.addEventListener('click', () => {
        if (slides.length === 0) return;
        const overlay = createPresentationView();
        startPresentation(overlay);
    });

    // Initial button state
    updateStartButton();
}); 