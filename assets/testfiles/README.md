# 测试音频文件说明

## WebM格式支持

当前录音识别系统**完全支持WebM格式**，处理流程如下：

1. **录音阶段**：使用 `audio/webm;codecs=opus` 格式录制
2. **转换阶段**：通过 `audioContext.decodeAudioData()` 将WebM解码为PCM数据
3. **重采样**：将音频重采样到16kHz（阿里云API要求）
4. **API调用**：发送PCM数据数组到阿里云语音识别API

## 测试音频文件

请将测试用的WebM音频文件命名为：
```
webm_audio_recognition_test.webm
```

### 文件要求
- **格式**：WebM (audio/webm;codecs=opus)
- **时长**：建议3-10秒
- **内容**：清晰的中文语音
- **质量**：良好的录音质量，无明显噪音

### 获取测试音频
1. 使用项目根目录的 `temp-recording-test.html` 页面录制
2. 或使用任何支持WebM输出的录音工具
3. 确保文件路径为：`assets/testfiles/webm_audio_recognition_test.webm`

## 技术细节

### 支持的音频处理流程
```
WebM文件 → decodeAudioData() → PCM Float32Array → 重采样(16kHz) → Int16Array → Uint8Array → API调用
```

### 代码位置
- 音频处理：`modules/audio-processor.js`
- 录音设置：`assets/scripts/setting_steps/audio-setup.js`
- 快速测试：`assets/scripts/settings-manager.js`

### 快速测试验证
快速测试系统会：
1. 检查测试音频文件是否存在
2. 验证文件格式和大小
3. 模拟API调用流程（可扩展为实际API测试）
4. 返回测试结果和详细信息
