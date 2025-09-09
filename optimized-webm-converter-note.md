# Optimized WebM Converter 项目笔记

## 项目概览
一个高性能的Web端视频转换工具，专门优化了WebM到MP4的转换速度和用户体验。

## 核心架构

### 1. 主要类结构
- `OptimizedFFmpegConverter`: 主转换器类，支持Worker和直接模式
- `FFmpegWorker`: Web Worker实现，在后台线程执行转换
- `PathResolver`: 路径解析器，处理模块加载
- `FFmpegProgressCalculator`: 进度计算器

### 2. Worker架构优势
```javascript
// 构造函数支持Worker模式切换
const converter = new OptimizedFFmpegConverter(true);  // 启用Worker
const converter = new OptimizedFFmpegConverter(false); // 直接模式
```

**Worker模式优势：**
- 后台转换，不阻塞主线程UI
- 更好的用户体验
- 支持取消操作
- 实时进度反馈

### 3. 性能优化策略

#### 快速复制模式
```javascript
// 优先使用流复制，避免重编码
const copyCommand = [
    '-i', 'input.webm',
    '-c', 'copy',           // 复制流，不重编码
    '-movflags', 'faststart', // 快速启动
    'output.mp4'
];
```

#### 智能参数选择
```javascript
// 根据文件大小自动选择参数
const fileSizeMB = webmBlob.size / (1024 * 1024);
let config = {};

if (fileSizeMB < 1) {
    // 小文件 - 超快速模式
    config = { preset: 'ultrafast', crf: 30, audioBitrate: '64k' };
} else if (fileSizeMB < 5) {
    // 中等文件 - 平衡模式  
    config = { preset: 'veryfast', crf: 28, audioBitrate: '96k' };
} else {
    // 大文件 - 质量优先
    config = { preset: 'fast', crf: 26, audioBitrate: '128k' };
}
```

#### 多线程优化
```javascript
const command = [
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', preset,
    '-crf', crf.toString(),
    '-threads', '0',        // 使用所有可用CPU核心
    '-tune', 'zerolatency', // 零延迟调优
    '-c:a', 'aac',
    '-b:a', audioBitrate,
    'output.mp4'
];
```

## 关键实现细节

### 1. GitHub Pages兼容性
```javascript
// 不使用SharedArrayBuffer，使用标准ArrayBuffer
const arrayBuffer = new ArrayBuffer(webmBlob.size);
const uint8Array = new Uint8Array(arrayBuffer);
const blobArray = new Uint8Array(await webmBlob.arrayBuffer());
uint8Array.set(blobArray); // 复制而不是转移所有权
```

### 2. 内存管理
```javascript
class OptimizedFFmpegConverter {
    constructor(useWorker = true) {
        this.memoryPool = new Map(); // 内存池重用ArrayBuffer
        this.maxPoolSize = 5;        // 最大缓存数量
    }
    
    // 获取或创建ArrayBuffer
    getBuffer(size) {
        const key = Math.ceil(size / 1024) * 1024; // 按KB对齐
        if (this.memoryPool.has(key)) {
            return this.memoryPool.get(key);
        }
        return new ArrayBuffer(size);
    }
}
```

### 3. 进度计算
```javascript
// 从FFmpeg日志解析进度
ffmpeg.on('log', ({ message }) => {
    if (message.includes('time=') && message.includes('fps=')) {
        // 解析时间信息计算进度百分比
        const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch) {
            const [, hours, minutes, seconds] = timeMatch;
            const currentTime = parseInt(hours) * 3600 + 
                              parseInt(minutes) * 60 + 
                              parseFloat(seconds);
            const progress = (currentTime / totalDuration) * 100;
        }
    }
});
```

### 4. 错误处理和重试机制
```javascript
// PathResolver中的重试逻辑
static async loadFFmpegWithRetry(environment, logCallback, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await this.loadFFmpegModule(environment);
        } catch (error) {
            if (logCallback) {
                logCallback(`尝试 ${i + 1}/${maxRetries} 失败: ${error.message}`);
            }
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

## 集成要点

### 1. 基本使用流程
```javascript
// 1. 初始化转换器
const converter = new OptimizedFFmpegConverter(true);
await converter.init();

// 2. 设置回调
converter.onProgress = (percent) => {
    console.log(`转换进度: ${percent}%`);
};
converter.onLog = (message) => {
    console.log(`日志: ${message}`);
};

// 3. 执行转换
const mp4Blob = await converter.convertWebMToMP4(webmBlob, {
    preset: 'veryfast',
    crf: 28,
    audioBitrate: '96k',
    fastMode: true
});

// 4. 清理资源
converter.cleanup();
```

### 2. 与录制功能集成
- 录制完成后获取WebM blob
- 传递给转换器进行转换
- 提供下载链接或进一步处理

### 3. UI集成建议
- 使用Worker模式避免界面卡顿
- 显示实时进度条和日志
- 提供取消转换功能
- 处理错误情况和用户反馈

## 性能数据
- **优化前**: 15秒/秒视频，界面卡顿
- **优化后**: 
  - 重编码模式: 2-3秒/秒视频
  - 快速复制模式: 1-2秒/秒视频
  - 后台转换，界面流畅

## 浏览器兼容性
- Chrome 66+ / Firefox 60+ / Safari 12+
- 支持ES模块 (type="module")
- 支持Web Worker
- 支持WebAssembly
- 支持MediaRecorder API
