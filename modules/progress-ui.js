/**
 * 进度UI组件
 * 包含流彩特效和百分比显示的转换进度界面
 */

class ProgressUI {
    constructor(options = {}) {
        this.container = null;
        this.progressElement = null;
        this.percentElement = null;
        this.statusElement = null;
        this.logElement = null;
        this.animationId = null;
        
        // 配置选项
        this.options = {
            width: options.width || 400,
            height: options.height || 300,
            colors: options.colors || ['#8B5CF6', '#DC2626', '#F97316', '#1E40AF'], // 紫色、朱红色、橙色、深蓝色
            animationSpeed: options.animationSpeed || 0.02,
            showLogs: options.showLogs !== false,
            title: options.title || '视频转换中...'
        };
        
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.isVisible = false;
    }

    /**
     * 创建进度UI
     * @param {HTMLElement} parentElement - 父容器元素
     * @returns {HTMLElement} 创建的容器元素
     */
    create(parentElement) {
        if (this.container) {
            this.destroy();
        }
        
        // 创建主容器
        this.container = document.createElement('div');
        this.container.className = 'progress-ui-container';
        this.container.id = 'fluidProgressContainer';
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            height: ${this.options.height}px;
            border-radius: 12px;
            overflow: hidden;
            background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // 创建流体背景画布
        const canvas = document.createElement('canvas');
        // 动态设置canvas大小，基于父容器的实际宽度
        const containerWidth = parentElement ? parentElement.offsetWidth : this.options.width;
        canvas.width = Math.max(containerWidth, this.options.width) * 2; // 高分辨率
        canvas.height = this.options.height * 2;
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            opacity: 0.6;
        `;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container.appendChild(canvas);

        // 创建内容层
        const contentLayer = document.createElement('div');
        contentLayer.style.cssText = `
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
        `;

        // 创建标题
        const titleElement = document.createElement('h3');
        titleElement.textContent = this.options.title;
        titleElement.style.cssText = `
            margin: 0 0 20px 0;
            color: white;
            font-size: 18px;
            font-weight: 600;
            text-align: center;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        `;
        contentLayer.appendChild(titleElement);

        // 创建进度圆环
        const progressRing = document.createElement('div');
        progressRing.style.cssText = `
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 20px;
        `;

        // SVG 圆环
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '120');
        svg.setAttribute('height', '120');
        svg.style.cssText = `
            transform: rotate(-90deg);
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        `;

        // 背景圆环
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', '60');
        bgCircle.setAttribute('cy', '60');
        bgCircle.setAttribute('r', '50');
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
        bgCircle.setAttribute('stroke-width', '8');
        svg.appendChild(bgCircle);

        // 进度圆环
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', '60');
        progressCircle.setAttribute('cy', '60');
        progressCircle.setAttribute('r', '50');
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke', 'url(#progressGradient)');
        progressCircle.setAttribute('stroke-width', '8');
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', '314');
        progressCircle.setAttribute('stroke-dashoffset', '314');
        progressCircle.style.transition = 'stroke-dashoffset 0.3s ease';

        // 渐变定义
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'progressGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        this.options.colors.forEach((color, index) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', `${(index / (this.options.colors.length - 1)) * 100}%`);
            stop.setAttribute('stop-color', color);
            gradient.appendChild(stop);
        });

        defs.appendChild(gradient);
        svg.appendChild(defs);
        svg.appendChild(progressCircle);
        
        this.progressElement = progressCircle;
        progressRing.appendChild(svg);

        // 中心按钮/百分比文字
        const centerElement = document.createElement('div');
        centerElement.id = 'centerElement';
        centerElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: none;
        `;
        
        // 默认显示开始录制按钮
        centerElement.innerHTML = '<i class="bx bx-video" style="font-size: 28px;"></i>';
        centerElement.title = '开始录制';
        
        this.centerElement = centerElement;
        this.percentElement = centerElement; // 兼容性
        progressRing.appendChild(centerElement);

        contentLayer.appendChild(progressRing);

        // 状态文字
        const statusText = document.createElement('div');
        statusText.style.cssText = `
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            text-align: center;
            margin-bottom: 15px;
            min-height: 20px;
        `;
        statusText.textContent = '准备中...';
        this.statusElement = statusText;
        contentLayer.appendChild(statusText);

        // 日志区域（可选）
        if (this.options.showLogs) {
            const logContainer = document.createElement('div');
            logContainer.style.cssText = `
                width: 100%;
                max-height: 120px;
                overflow-y: auto;
                overflow-x: hidden;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                padding: 8px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
                font-family: 'Monaco', 'Menlo', monospace;
                border: 1px solid rgba(255, 255, 255, 0.1);
                word-wrap: break-word;
                word-break: break-all;
            `;

            const logContent = document.createElement('div');
            this.logElement = logContent;
            logContainer.appendChild(logContent);
            contentLayer.appendChild(logContainer);
        }

        this.container.appendChild(contentLayer);

        // 添加到父容器
        if (parentElement) {
            parentElement.appendChild(this.container);
        }

        // 初始化流体动画
        this.initFluidAnimation();
        
        // 确保动画立即开始
        this.isVisible = true;

        return this.container;
    }

    /**
     * 初始化流体动画
     */
    initFluidAnimation() {
        if (!this.ctx || !this.canvas) return;
        
        // 如果已经有动画在运行，先停止
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        let time = 0;
        const animate = () => {
            if (!this.isVisible || !this.ctx) return;

            time += this.options.animationSpeed;
            
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制流体效果
            this.drawFluidBackground(time);
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        // 立即开始第一帧
        animate();
    }

    /**
     * 绘制流体背景
     */
    drawFluidBackground(time) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 创建渐变
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        this.options.colors.forEach((color, index) => {
            const offset = (index / (this.options.colors.length - 1));
            gradient.addColorStop(offset, color + '40'); // 添加透明度
        });

        // 绘制波浪
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        for (let x = 0; x <= width; x += 10) {
            const y1 = height * 0.3 + Math.sin((x * 0.01) + time) * 30;
            const y2 = height * 0.7 + Math.cos((x * 0.008) + time * 1.2) * 40;
            
            if (x === 0) {
                this.ctx.moveTo(x, y1);
            } else {
                this.ctx.lineTo(x, y1);
            }
        }
        
        for (let x = width; x >= 0; x -= 10) {
            const y2 = height * 0.7 + Math.cos((x * 0.008) + time * 1.2) * 40;
            this.ctx.lineTo(x, y2);
        }
        
        this.ctx.closePath();
        this.ctx.fill();

        // 添加粒子效果
        this.drawParticles(time);
    }

    /**
     * 绘制粒子效果
     */
    drawParticles(time) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const x = (Math.sin(time * 0.5 + i) * this.canvas.width * 0.3) + this.canvas.width * 0.5;
            const y = (Math.cos(time * 0.3 + i * 0.5) * this.canvas.height * 0.3) + this.canvas.height * 0.5;
            const size = Math.sin(time + i) * 3 + 5;
            const opacity = Math.sin(time * 2 + i) * 0.3 + 0.3;
            
            const colorIndex = i % this.options.colors.length;
            this.ctx.fillStyle = this.options.colors[colorIndex] + Math.floor(opacity * 255).toString(16).padStart(2, '0');
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * 显示进度UI
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            this.isVisible = true;
            // 延迟一帧以确保DOM已渲染
            setTimeout(() => {
                this.initFluidAnimation();
            }, 16);
        }
    }

    /**
     * 隐藏进度UI
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }

    /**
     * 更新进度
     * @param {number} percent - 进度百分比 (0-100)
     * @param {string} status - 状态文字
     */
    updateProgress(percent, status = '') {
        this.targetProgress = Math.max(0, Math.min(100, percent));
        
        // 如果有进度，显示百分比；否则显示按钮
        if (this.centerElement) {
            if (this.targetProgress > 0) {
                this.centerElement.innerHTML = `${Math.round(this.targetProgress)}%`;
                this.centerElement.style.cursor = 'default';
                this.centerElement.title = '';
            } else {
                this.centerElement.innerHTML = '<i class="bx bx-video" style="font-size: 28px;"></i>';
                this.centerElement.style.cursor = 'pointer';
                this.centerElement.title = '开始录制';
            }
        }
        
        if (this.progressElement) {
            const circumference = 314; // 2 * π * 50
            const offset = circumference - (this.targetProgress / 100) * circumference;
            this.progressElement.setAttribute('stroke-dashoffset', offset);
        }
        
        if (status && this.statusElement) {
            this.statusElement.textContent = status;
        }
    }

    /**
     * 添加日志
     * @param {string} message - 日志消息
     */
    addLog(message) {
        if (!this.logElement || !this.options.showLogs) return;
        
        const logLine = document.createElement('div');
        logLine.style.cssText = `
            margin-bottom: 2px;
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
            word-wrap: break-word;
            word-break: break-all;
            white-space: pre-wrap;
        `;
        
        // 添加时间戳
        const timestamp = new Date().toLocaleTimeString();
        logLine.textContent = `[${timestamp}] ${message}`;
        
        this.logElement.appendChild(logLine);
        
        // 自动滚动到底部
        this.logElement.parentElement.scrollTop = this.logElement.parentElement.scrollHeight;
        
        // 限制日志行数
        while (this.logElement.children.length > 10) {
            this.logElement.removeChild(this.logElement.firstChild);
        }
        
        // 添加淡入动画CSS
        if (!document.getElementById('progress-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'progress-ui-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 设置按钮点击事件
     * @param {function} callback - 点击回调函数
     */
    setCenterButtonClick(callback) {
        if (this.centerElement && callback) {
            this.centerElement.addEventListener('click', (e) => {
                // 只有在显示按钮状态时才允许点击
                if (this.targetProgress === 0) {
                    callback(e);
                }
            });
        }
    }

    /**
     * 设置完成状态
     */
    setComplete() {
        this.updateProgress(100, '转换完成！');
        
        // 完成后显示完成图标
        if (this.centerElement) {
            this.centerElement.innerHTML = '<i class="bx bx-check" style="font-size: 28px;"></i>';
            this.centerElement.style.cursor = 'default';
            this.centerElement.title = '转换完成';
        }
        
        // 添加完成动画效果
        if (this.container) {
            this.container.style.animation = 'pulse 0.6s ease-in-out';
        }
        
        setTimeout(() => {
            if (this.container) {
                this.container.style.animation = '';
            }
        }, 600);
    }

    /**
     * 设置错误状态
     * @param {string} error - 错误消息
     */
    setError(error) {
        this.updateProgress(0, `错误: ${error}`);
        
        if (this.statusElement) {
            this.statusElement.style.color = '#EF4444'; // 红色
        }
    }

    /**
     * 重置状态
     */
    reset() {
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.updateProgress(0, '准备中...');
        
        if (this.statusElement) {
            this.statusElement.style.color = 'rgba(255, 255, 255, 0.8)';
        }
        
        if (this.logElement) {
            this.logElement.innerHTML = '';
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        this.isVisible = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        
        this.container = null;
        this.progressElement = null;
        this.percentElement = null;
        this.statusElement = null;
        this.logElement = null;
        this.canvas = null;
        this.ctx = null;
    }
}

export default ProgressUI;
