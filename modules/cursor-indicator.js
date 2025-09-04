/**
 * 自定义光标指示器 - 解决黑色背景下光标丢失问题
 */
class CursorIndicator {
    constructor() {
        this.indicator = null;
        this.isVisible = false;
        this.hideTimeout = null;
        this.init();
    }

    init() {
        this.createIndicator();
        this.bindEvents();
        console.log('🖱️ 自定义光标指示器已初始化');
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'custom-cursor-indicator';
        this.indicator.innerHTML = '<i class="bx bx-mouse"></i>';
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .custom-cursor-indicator {
                position: fixed;
                width: 24px;
                height: 24px;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.2s ease;
                transform: translate(-50%, -50%);
            }
            
            .custom-cursor-indicator.visible {
                opacity: 1;
            }
            
            .custom-cursor-indicator i {
                font-size: 20px;
                color: white;
                text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
                filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            /* 隐藏默认光标在整个页面，除了按钮区域 */
            body {
                cursor: none !important;
            }
            
            .cover-container {
                cursor: none !important;
            }
            
            .cover-image {
                cursor: none !important;
                user-select: none !important;
                -webkit-user-drag: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                pointer-events: none !important;
            }
            
            /* 在按钮区域显示正常光标 */
            .button-container,
            .button-container * {
                cursor: auto !important;
            }
            
            .action-button {
                cursor: pointer !important;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.indicator);
    }

    bindEvents() {
        let lastMoveTime = 0;
        
        document.addEventListener('mousemove', (e) => {
            const currentTime = Date.now();
            
            // 更新指示器位置
            this.updatePosition(e.clientX, e.clientY);
            
            // 始终显示自定义光标
            this.show();
            
            lastMoveTime = currentTime;
        });
        
        // 鼠标进入窗口时显示
        document.addEventListener('mouseenter', () => {
            this.show();
        });
        
        // 鼠标离开窗口时隐藏
        document.addEventListener('mouseleave', () => {
            this.hide();
        });
        
        // 点击事件（已移除特效）
    }

    updatePosition(x, y) {
        if (this.indicator) {
            this.indicator.style.left = x + 'px';
            this.indicator.style.top = y + 'px';
        }
    }

    show() {
        if (this.indicator && !this.isVisible) {
            this.indicator.classList.add('visible');
            this.isVisible = true;
        }
    }

    hide() {
        if (this.indicator && this.isVisible) {
            this.indicator.classList.remove('visible');
            this.isVisible = false;
        }
    }

    fadeOut() {
        if (this.indicator && this.isVisible) {
            this.indicator.style.opacity = '0.3';
            setTimeout(() => {
                if (this.indicator) {
                    this.indicator.style.opacity = '';
                }
            }, 1000);
        }
    }

    showClickFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border: 2px solid #666AF6;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            animation: clickRipple 0.6s ease-out forwards;
        `;
        
        // 添加点击波纹动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes clickRipple {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }
        `;
        
        if (!document.querySelector('#click-ripple-style')) {
            style.id = 'click-ripple-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 600);
    }
}

// 初始化光标指示器
const cursorIndicator = new CursorIndicator();
