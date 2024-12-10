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
    let slides = [
        'assets/slides/Day2-1.JPG', 'assets/slides/Day2-2.JPG', 
        'assets/slides/Day3-1.JPG', 'assets/slides/Day3-2.JPG', 'assets/slides/Day3-3.JPG', 'assets/slides/Day3-4.JPG', 'assets/slides/Day3-5.JPG', 'assets/slides/Day3-6.JPG', 'assets/slides/Day3-7.JPG', 'assets/slides/Day3-8.JPG', 'assets/slides/Day3-9.JPG', 'assets/slides/Day3-10.JPG', 'assets/slides/Day3-11.JPG', 
        'assets/slides/Day4-1.JPG', 'assets/slides/Day4-2.JPG', 'assets/slides/Day4-3.JPG', 'assets/slides/Day4-4.JPG', 'assets/slides/Day4-5.JPG', 'assets/slides/Day4-6.JPG', 
    ]; 
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

    // Start countdown and recording
    const startPresentation = async (overlay) => {
        const slideContainer = overlay.querySelector('.slide-container');
        const controlsContainer = overlay.querySelector('.presentation-controls');
        const countdownOverlay = overlay.querySelector('.countdown-overlay');
        const backButton = overlay.querySelector('.back-button');
        const timerDisplay = overlay.querySelector('.timer-display');
        const progressBar = overlay.querySelector('.progress');
        const startSound = new Audio('assets/effects/start.mp3');
        const halfwaySound = new Audio('assets/effects/halfway.mp3');
        const endSound = new Audio('assets/effects/end.mp3');
        let isRecording = false;
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

        const updateTimer = () => {
            if (!isActive) return;
            
            const currentTime = (Date.now() - startTime) / 1000;
            const totalTime = selectedTime * 60;
            const progress = Math.min((currentTime / totalTime) * 100, 100);
            
            timerDisplay.textContent = formatTime(currentTime);
            progressBar.style.width = `${progress}%`;
            
            if (isActive) {
                if (currentTime >= totalTime && endSound.currentTime === 0) {
                    console.log("Presentation time is up!");
                    endSound.play();
                } else if (currentTime >= totalTime / 2 && halfwaySound.currentTime === 0) {
                    console.log("Presentation time is halfway!");
                    halfwaySound.play();
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
            overlay.remove();
        };

        try {
            slideContainer.innerHTML = `
                <img src="${getRandomSlide()}" alt="Presentation Slide" class="presentation-slide">
            `;

            // Setup back button handler
            backButton.addEventListener('click', cleanup);

            controlsContainer.innerHTML = `
                <button class="stop-recording">停止</button>
            `;
            const recordStopButton = controlsContainer.querySelector('.stop-recording');
            recordStopButton.style.cursor = 'none';
            recordStopButton.style.visibility = 'hidden';

            // Start countdown
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            slideContainer.classList.add('blur');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await startSound.play();
            await new Promise(resolve => setTimeout(resolve, 400));
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
            
            // Start the timer
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
        if (slides.length === 0) return;
        const overlay = createPresentationView();
        startPresentation(overlay);
    });

    // Initial button state
    updateStartButton();
}); 