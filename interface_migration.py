#!/usr/bin/env python3
"""
WebM to MP4 接口迁移脚本
分析参考项目接口并生成迁移代码
"""

import os
import re
import json
from pathlib import Path

class InterfaceMigrator:
    def __init__(self, reference_path, target_path):
        self.reference_path = Path(reference_path)
        self.target_path = Path(target_path)
        self.interfaces = {}
        self.analysis_result = {}
    
    def analyze_reference_project(self):
        """分析参考项目的接口"""
        print("📊 分析参考项目接口...")
        
        # 分析主要的转换器类
        converter_file = self.reference_path / "modules" / "ffmpeg-converter-optimized.js"
        if converter_file.exists():
            self.analyze_converter_class(converter_file)
        
        # 分析HTML中的使用方式
        html_file = self.reference_path / "index.html"
        if html_file.exists():
            self.analyze_html_usage(html_file)
        
        # 分析Worker实现
        worker_file = self.reference_path / "modules" / "ffmpeg-worker.js"
        if worker_file.exists():
            self.analyze_worker_implementation(worker_file)
            
        return self.analysis_result
    
    def analyze_converter_class(self, file_path):
        """分析转换器类的接口"""
        print(f"🔍 分析转换器类: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取类定义
        class_match = re.search(r'class\s+(\w+)\s*\{', content)
        if class_match:
            class_name = class_match.group(1)
            self.interfaces['converter_class'] = {
                'name': class_name,
                'methods': [],
                'constructor_params': []
            }
            
            # 提取构造函数参数
            constructor_match = re.search(r'constructor\s*\(([^)]*)\)', content)
            if constructor_match:
                params = [p.strip() for p in constructor_match.group(1).split(',') if p.strip()]
                self.interfaces['converter_class']['constructor_params'] = params
            
            # 提取公共方法
            methods = re.findall(r'async\s+(\w+)\s*\([^)]*\)|(\w+)\s*\([^)]*\)\s*\{', content)
            for method_match in methods:
                method_name = method_match[0] or method_match[1]
                if not method_name.startswith('_') and method_name not in ['constructor']:
                    # 获取方法的完整签名
                    method_pattern = rf'(async\s+)?{re.escape(method_name)}\s*\([^)]*\)'
                    signature_match = re.search(method_pattern, content)
                    if signature_match:
                        self.interfaces['converter_class']['methods'].append({
                            'name': method_name,
                            'signature': signature_match.group(0),
                            'is_async': bool(method_match[0])
                        })
        
        # 提取关键的转换方法参数
        convert_match = re.search(r'convertWebMToMP4\s*\([^)]*\)\s*\{([^}]*)\}', content, re.DOTALL)
        if convert_match:
            convert_body = convert_match.group(1)
            # 提取默认参数
            options_matches = re.findall(r'(\w+)\s*=\s*([^,\n]+)', convert_body)
            self.interfaces['convert_options'] = dict(options_matches)
    
    def analyze_html_usage(self, file_path):
        """分析HTML中的使用方式"""
        print(f"🔍 分析HTML使用方式: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取初始化代码
        init_pattern = r'converter\s*=\s*new\s+(\w+)\s*\([^)]*\)'
        init_matches = re.findall(init_pattern, content)
        
        # 提取方法调用
        method_calls = re.findall(r'converter\.(\w+)\s*\([^)]*\)', content)
        
        # 提取回调设置
        callback_pattern = r'converter\.set(\w+)Callback\s*\([^)]*\)'
        callback_matches = re.findall(callback_pattern, content)
        
        self.interfaces['usage_patterns'] = {
            'initialization': init_matches,
            'method_calls': list(set(method_calls)),
            'callbacks': callback_matches
        }
    
    def analyze_worker_implementation(self, file_path):
        """分析Worker实现"""
        print(f"🔍 分析Worker实现: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取Worker消息类型
        message_types = re.findall(r'type:\s*[\'"](\w+)[\'"]', content)
        
        # 提取Worker函数
        functions = re.findall(r'async\s+function\s+(\w+)', content)
        
        self.interfaces['worker'] = {
            'message_types': list(set(message_types)),
            'functions': functions
        }
    
    def generate_migration_code(self):
        """生成迁移代码"""
        print("🚀 生成迁移代码...")
        
        # 生成简化的转换器类
        converter_code = self.generate_converter_class()
        
        # 生成使用示例
        usage_code = self.generate_usage_example()
        
        # 保存到目标项目
        self.save_migrated_files(converter_code, usage_code)
        
        return {
            'converter_code': converter_code,
            'usage_code': usage_code
        }
    
    def generate_converter_class(self):
        """生成转换器类代码"""
        converter_info = self.interfaces.get('converter_class', {})
        class_name = converter_info.get('name', 'OptimizedFFmpegConverter')
        
        code = f'''/**
 * 迁移的{class_name} - 简化版本
 * 从参考项目迁移的核心接口
 */

class Migrated{class_name} {{
    constructor(useWorker = true) {{
        this.useWorker = useWorker;
        this.worker = null;
        this.ffmpeg = null;
        this.isLoaded = false;
        this.onProgress = null;
        this.onLog = null;
        this.isCancelled = false;
        
        // 从参考项目迁移的配置
        this.defaultOptions = {{
'''

        # 添加默认选项
        convert_options = self.interfaces.get('convert_options', {})
        for key, value in convert_options.items():
            code += f'            {key}: {value},\n'
        
        code += '''        };
    }
    
    // 核心接口方法（从参考项目迁移）
    async init() {
        console.log('🔧 初始化转换器...');
        if (this.isLoaded) return;
        
        if (this.useWorker && typeof Worker !== 'undefined') {
            return this.initWorker();
        } else {
            return this.initDirect();
        }
    }
    
    async initWorker() {
        console.log('🔧 初始化Worker模式...');
        // TODO: 实现Worker初始化
        this.isLoaded = true;
        return Promise.resolve();
    }
    
    async initDirect() {
        console.log('🔧 初始化直接模式...');
        // TODO: 实现直接模式初始化
        this.isLoaded = true;
        return Promise.resolve();
    }
    
    // 主要转换接口（从参考项目迁移）
    async convertWebMToMP4(webmBlob, options = {}) {
        if (!this.isLoaded) {
            throw new Error('转换器未初始化，请先调用 init()');
        }
        
        console.log('🚀 开始WebM到MP4转换...');
        
        // 合并选项
        const finalOptions = { ...this.defaultOptions, ...options };
        
        if (this.onLog) {
            this.onLog(`转换参数: ${JSON.stringify(finalOptions)}`);
        }
        
        // TODO: 实现实际转换逻辑
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('⚠️ 这是模拟转换，需要实现真实的转换逻辑');
                resolve(webmBlob); // 暂时返回原始blob
            }, 1000);
        });
    }
    
    // 回调设置方法（从参考项目迁移）
    setLogCallback(callback) {
        this.onLog = callback;
    }
    
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
    
    // 取消转换
    cancelConversion() {
        this.isCancelled = true;
        if (this.onLog) {
            this.onLog('❌ 转换已取消');
        }
    }
    
    // 销毁资源
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isLoaded = false;
        console.log('🧹 转换器资源已清理');
    }
}

export default Migrated{class_name};
'''
        return code
    
    def generate_usage_example(self):
        """生成使用示例代码"""
        usage_patterns = self.interfaces.get('usage_patterns', {})
        
        code = '''/**
 * 使用示例 - 基于参考项目的使用模式
 */

// 初始化转换器
const converter = new MigratedOptimizedFFmpegConverter(true);

// 设置回调
converter.setLogCallback((message) => {
    console.log('转换日志:', message);
});

converter.setProgressCallback((percent) => {
    console.log('转换进度:', percent + '%');
});

// 初始化
await converter.init();

// 转换WebM到MP4
async function convertVideo(webmBlob) {
    try {
        const mp4Blob = await converter.convertWebMToMP4(webmBlob, {
            fastMode: true,
            preset: 'ultrafast',
            crf: 28
        });
        
        console.log('✅ 转换完成');
        return mp4Blob;
    } catch (error) {
        console.error('❌ 转换失败:', error);
        throw error;
    }
}

// 清理资源
function cleanup() {
    converter.destroy();
}
'''
        return code
    
    def save_migrated_files(self, converter_code, usage_code):
        """保存迁移的文件"""
        # 保存转换器类
        converter_file = self.target_path / "modules" / "migrated-ffmpeg-converter.js"
        converter_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(converter_file, 'w', encoding='utf-8') as f:
            f.write(converter_code)
        
        print(f"✅ 转换器类已保存到: {converter_file}")
        
        # 保存使用示例
        example_file = self.target_path / "migrated-converter-example.js"
        with open(example_file, 'w', encoding='utf-8') as f:
            f.write(usage_code)
        
        print(f"✅ 使用示例已保存到: {example_file}")
        
        # 保存分析结果
        analysis_file = self.target_path / "interface-analysis.json"
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump(self.interfaces, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 接口分析结果已保存到: {analysis_file}")
    
    def create_test_file(self):
        """创建测试文件"""
        test_html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>转换器接口测试</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .section {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #0056b3;
        }
        .log {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <h1>转换器接口测试</h1>
    
    <div class="section">
        <h2>参考项目接口测试</h2>
        <button onclick="testReferenceInterface()">测试参考项目接口</button>
        <button onclick="testMigratedInterface()">测试迁移后接口</button>
        <div id="testLog" class="log">等待测试...</div>
    </div>
    
    <div class="section">
        <h2>接口对比</h2>
        <div id="comparisonResult" class="log">点击上方按钮进行对比测试</div>
    </div>

    <script type="module">
        // 测试参考项目接口
        window.testReferenceInterface = async function() {
            const log = document.getElementById('testLog');
            log.innerHTML = '测试参考项目接口...\\n';
            
            try {
                // 动态导入参考项目的转换器
                const { default: OptimizedFFmpegConverter } = await import('./webm_to_mp4/modules/ffmpeg-converter-optimized.js');
                
                const converter = new OptimizedFFmpegConverter(true);
                
                converter.setLogCallback((message) => {
                    log.innerHTML += `[参考项目] ${message}\\n`;
                    log.scrollTop = log.scrollHeight;
                });
                
                await converter.init();
                log.innerHTML += '[参考项目] ✅ 初始化成功\\n';
                
                // 创建模拟WebM blob
                const mockWebmBlob = new Blob(['mock webm data'], { type: 'video/webm' });
                
                // 这里不执行实际转换，只测试接口调用
                log.innerHTML += '[参考项目] 接口调用测试完成\\n';
                
            } catch (error) {
                log.innerHTML += `[参考项目] ❌ 错误: ${error.message}\\n`;
            }
        };
        
        // 测试迁移后接口
        window.testMigratedInterface = async function() {
            const log = document.getElementById('testLog');
            log.innerHTML += '\\n测试迁移后接口...\\n';
            
            try {
                // 动态导入迁移后的转换器
                const { default: MigratedConverter } = await import('./modules/migrated-ffmpeg-converter.js');
                
                const converter = new MigratedConverter(true);
                
                converter.setLogCallback((message) => {
                    log.innerHTML += `[迁移版本] ${message}\\n`;
                    log.scrollTop = log.scrollHeight;
                });
                
                await converter.init();
                log.innerHTML += '[迁移版本] ✅ 初始化成功\\n';
                
                // 创建模拟WebM blob
                const mockWebmBlob = new Blob(['mock webm data'], { type: 'video/webm' });
                
                // 测试转换接口
                const result = await converter.convertWebMToMP4(mockWebmBlob);
                log.innerHTML += '[迁移版本] ✅ 转换接口调用成功\\n';
                
            } catch (error) {
                log.innerHTML += `[迁移版本] ❌ 错误: ${error.message}\\n`;
            }
        };
    </script>
</body>
</html>'''
        
        test_file = self.target_path / "conversion-test.html"
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_html)
        
        print(f"✅ 测试文件已创建: {test_file}")

def main():
    """主函数"""
    current_dir = Path.cwd()
    reference_path = current_dir / "webm_to_mp4"
    target_path = current_dir
    
    print("🚀 开始接口迁移...")
    print(f"参考项目路径: {reference_path}")
    print(f"目标项目路径: {target_path}")
    
    migrator = InterfaceMigrator(reference_path, target_path)
    
    # 分析参考项目
    analysis = migrator.analyze_reference_project()
    print("\n📊 接口分析完成:")
    print(json.dumps(analysis, indent=2, ensure_ascii=False))
    
    # 生成迁移代码
    migration_result = migrator.generate_migration_code()
    
    # 创建测试文件
    migrator.create_test_file()
    
    print("\n✅ 接口迁移完成！")
    print("生成的文件:")
    print("- modules/migrated-ffmpeg-converter.js (迁移的转换器类)")
    print("- migrated-converter-example.js (使用示例)")
    print("- conversion-test.html (接口测试文件)")
    print("- interface-analysis.json (接口分析结果)")

if __name__ == "__main__":
    main()
