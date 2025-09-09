# 设置步骤管理器 (SettingsStepManager)

## 概述

设置步骤管理器是一个统一的系统，用于管理所有设置用例的步骤流程。它基于阿里云语音识别设置的步骤风格，提供了通用的步骤管理功能。

## 核心特性

### 1. 统一的步骤管理
- **步骤数目管理**：自动管理设置流程中的步骤数量
- **步骤状态跟踪**：跟踪每个步骤的完成状态和成功记录
- **步骤导航**：支持前进、后退和跳转到指定步骤

### 2. 灵活的内容配置
- **内嵌内容部分**：支持描述文本、示意图、表单字段和自定义内容
- **交互按钮部分**：可配置多个按钮，支持指定核心按钮用于自动跳转
- **自动跳转条件**：每个步骤可定义自动跳转的条件

### 3. 完善的状态管理
- **完成状态持久化**：使用localStorage保存每个步骤的完成状态
- **成功记录**：记录每个步骤是否成功完成
- **时间戳**：记录步骤完成的时间

### 4. 统一的CSS管理
- **一致的视觉风格**：所有设置页面使用统一的样式
- **响应式设计**：支持桌面端和移动端
- **动画效果**：包含步骤切换动画和状态变化效果

## 文件结构

```
assets/
├── scripts/
│   ├── settings-step-manager.js      # 核心管理器类
│   ├── settings-integration.js       # 系统集成文件
│   └── setting_steps/                # 设置用例专用文件夹
│       ├── setting-steps-index.js     # 重构后的语音识别设置
│       ├── ai-setup.js        # 重构后的智谱AI设置
│       └── microphone-setup.js # 重构后的录音设备设置
└── stylesheets/
    ├── setting-steps-index.css               # 包含统一的设置样式
    └── setting_steps/                # 设置用例专用样式文件夹（如需要）
```

## 使用方法

### 基本用法

```javascript
// 1. 创建管理器实例
const manager = new SettingsStepManager({
    settingId: 'mySettings',
    title: '我的设置',
    steps: [...], // 步骤配置
    onComplete: () => console.log('设置完成'),
    onBack: () => console.log('返回上级页面')
});

// 2. 创建设置界面
const overlay = manager.createOverlay();
```

### 步骤配置结构

```javascript
{
    id: 'step1',                    // 步骤唯一标识
    title: '步骤标题',               // 步骤标题
    content: {                      // 内嵌内容部分
        description: '步骤说明',     // 描述文本（支持HTML）
        image: 'path/to/image.png', // 可选：示意图路径
        form: [                     // 可选：表单字段
            {
                type: 'text|password|select',
                id: 'fieldId',
                label: '字段标签',
                placeholder: '占位符',
                required: true,
                options: [] // select类型时的选项
            }
        ],
        custom: () => 'HTML内容'    // 可选：自定义内容生成函数
    },
    buttons: [                      // 交互按钮配置
        {
            id: 'nextBtn',
            text: '下一步',
            type: 'primary',        // back|primary|success|custom
            isPrimary: true,        // 标记为核心按钮
            onClick: () => {},      // 点击处理函数
            show: true             // 是否显示
        }
    ],
    autoJumpCondition: () => {},    // 自动跳转条件函数
    onEnter: () => {},              // 进入步骤时的回调
    onExit: () => {},               // 离开步骤时的回调
    validation: () => {}            // 步骤验证函数
}
```

## 实际应用示例

### 1. 阿里云语音识别设置 (AudioSetupManager)

```javascript
const audioManager = new AudioSetupManager();
const overlay = audioManager.createSetup();
```

**步骤流程：**
1. 启用智能语音交互服务
2. 获取并配置 AppKey
3. 创建RAM用户
4. 配置 AccessKey
5. 录音功能测试

### 2. 智谱AI设置 (AISetupManager)

```javascript
const aiManager = new AISetupManager();
const overlay = aiManager.createSetup();
```

**步骤流程：**
1. 注册智谱AI账号
2. 获取API Key
3. 测试AI对话功能

### 3. 录音设备设置 (MicrophoneSetupManager)

```javascript
const micManager = new MicrophoneSetupManager();
const overlay = micManager.createSetup();
```

**步骤流程：**
1. 请求麦克风权限
2. 录音功能测试

## 核心功能详解

### 1. 步骤状态管理

```javascript
// 标记步骤完成
manager.markStepCompleted('step1', true);

// 检查步骤状态
const isCompleted = manager.isStepCompleted('step1');
const isSuccessful = manager.isStepSuccessful('step1');
```

### 2. 表单数据管理

```javascript
// 获取步骤表单数据
const formData = manager.getStepFormData('step2');

// 设置步骤表单数据
manager.setStepFormData('step2', {
    fieldId: 'value'
});
```

### 3. 步骤导航

```javascript
// 跳转到指定步骤
manager.goToStep(2);

// 检查自动跳转条件
manager.checkAutoJump('step1');
```

### 4. 状态显示

```javascript
// 显示步骤状态信息
manager.showStepStatus('step1', '操作成功', 'success');
// 类型：info, success, error, warning
```

## 样式系统

### CSS类结构

- `.setup-container` - 主容器
- `.setup-flow` - 步骤流程容器
- `.setup-step` - 单个步骤
- `.step-circle` - 步骤圆圈
- `.step-content` - 步骤内容
- `.form-group` - 表单组
- `.normal-button` - 按钮样式

### 响应式设计

- 桌面端：显示步骤圆圈和连接线
- 移动端：隐藏圆圈，显示步骤指示器

## 集成现有系统

通过 `settings-integration.js` 文件，新的管理器系统可以无缝集成到现有项目中：

```javascript
// 自动替换旧的事件处理器
addNewSettingsHandlers();

// 创建演示设置
const demoOverlay = createDemoSetting();
```

## 扩展和自定义

### 创建新的设置管理器

```javascript
class MySettingsManager {
    constructor() {
        this.settingId = 'mySettings';
        this.initializeSteps();
    }
    
    initializeSteps() {
        this.steps = [
            // 定义步骤配置
        ];
    }
    
    createSetup() {
        this.stepManager = new SettingsStepManager({
            settingId: this.settingId,
            title: '我的设置',
            steps: this.steps,
            onComplete: () => this.handleComplete(),
            onBack: () => this.handleBack()
        });
        
        return this.stepManager.createOverlay();
    }
}
```

### 自定义样式

可以通过修改 `settings-step-manager-css.js` 中的CSS变量来自定义外观：

```css
:root {
    --primary-color: #666AF6;
    --success-color: #28a745;
    --error-color: #ff4444;
    --warning-color: #ffc107;
}
```

## 最佳实践

1. **步骤设计**：每个步骤应该有明确的目标和验证条件
2. **错误处理**：为每个步骤提供适当的错误处理和用户反馈
3. **数据持久化**：重要的配置数据应该及时保存
4. **用户体验**：提供清晰的进度指示和操作反馈
5. **测试验证**：确保每个步骤的验证逻辑正确工作

## 故障排除

### 常见问题

1. **管理器未加载**：确保所有依赖文件都已正确加载
2. **步骤跳转失败**：检查 `autoJumpCondition` 函数的返回值
3. **表单数据丢失**：确保表单字段的 `id` 属性正确设置
4. **样式显示异常**：检查CSS文件是否正确加载

### 调试技巧

```javascript
// 启用调试模式
console.log('当前步骤:', manager.currentStepIndex);
console.log('完成状态:', manager.completionStatus);
console.log('表单数据:', manager.getStepFormData('step1'));
```

## 版本历史

- **v1.0.0** - 初始版本，包含基础的步骤管理功能
- **v1.1.0** - 添加了表单数据管理和自动跳转功能
- **v1.2.0** - 完善了CSS样式系统和响应式设计

## 贡献

欢迎提交问题报告和功能建议。在贡献代码时，请确保：

1. 遵循现有的代码风格
2. 添加适当的注释和文档
3. 测试新功能的兼容性
4. 更新相关的文档

---

*最后更新：2024年12月*
