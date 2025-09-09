/**
 * 麦克风权限助手 - 通用的麦克风权限错误诊断和解决建议
 * 根据设备类型、浏览器类型、操作系统等信息提供精准的解决方案
 */

class MicrophonePermissionHelper {
    constructor() {
        this.deviceInfo = this.detectDeviceInfo();
    }

    // 检测设备信息
    detectDeviceInfo() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        // 检测操作系统
        let os = 'unknown';
        if (/iPhone|iPad|iPod/i.test(userAgent)) {
            os = 'ios';
        } else if (/Android/i.test(userAgent)) {
            os = 'android';
        } else if (/Mac/i.test(platform)) {
            os = 'macos';
        } else if (/Win/i.test(platform)) {
            os = 'windows';
        } else if (/Linux/i.test(platform)) {
            os = 'linux';
        }

        // 检测浏览器
        let browser = 'unknown';
        if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
            browser = 'chrome';
        } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
            browser = 'safari';
        } else if (/Firefox/i.test(userAgent)) {
            browser = 'firefox';
        } else if (/Edge/i.test(userAgent)) {
            browser = 'edge';
        }

        // 检测设备类型
        let deviceType = 'desktop';
        if (/iPhone|iPad|iPod|Android/i.test(userAgent)) {
            deviceType = 'mobile';
        }

        // 检测协议
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        return {
            os,
            browser,
            deviceType,
            isHttps,
            isLocalhost,
            userAgent,
            platform
        };
    }

    // 获取麦克风权限错误的解决建议
    getMicrophonePermissionAdvice(error) {
        const { os, browser, deviceType, isHttps, isLocalhost } = this.deviceInfo;
        
        console.log('🔍 设备信息:', this.deviceInfo);
        console.log('❌ 权限错误:', error);

        let advice = {
            title: '麦克风权限被拒绝',
            icon: '🎤',
            solutions: []
        };

        // 根据错误类型提供不同建议
        if (error.name === 'NotAllowedError') {
            advice = this.getNotAllowedAdvice();
        } else if (error.name === 'NotFoundError') {
            advice = this.getNotFoundAdvice();
        } else if (error.name === 'NotSupportedError') {
            advice = this.getNotSupportedAdvice();
        } else {
            advice = this.getGenericAdvice();
        }

        return advice;
    }

    // 权限被拒绝的建议
    getNotAllowedAdvice() {
        const { os, browser, deviceType, isHttps, isLocalhost } = this.deviceInfo;
        
        let solutions = [];

        // 桌面端建议
        if (deviceType === 'desktop') {
            if (browser === 'chrome') {
                solutions.push({
                    title: 'Chrome浏览器解决方法',
                    steps: [
                        '点击地址栏左侧的🔒或ℹ️图标',
                        '找到"麦克风"选项，选择"允许"',
                        '刷新页面后重试'
                    ]
                });

                solutions.push({
                    title: '或者通过Chrome设置',
                    steps: [
                        '打开Chrome设置 → 隐私和安全 → 网站设置 → 麦克风',
                        '确保"网站可以请求使用您的麦克风"已开启',
                        '在"不允许"列表中删除本网站（如果存在）',
                        '刷新页面后重试'
                    ]
                });
            } else if (browser === 'safari') {
                solutions.push({
                    title: 'Safari浏览器解决方法',
                    steps: [
                        '点击Safari菜单 → 偏好设置 → 网站',
                        '在左侧列表中选择"麦克风"',
                        '找到当前网站，设置为"允许"',
                        '刷新页面后重试'
                    ]
                });
            } else if (browser === 'firefox') {
                solutions.push({
                    title: 'Firefox浏览器解决方法',
                    steps: [
                        '点击地址栏左侧的🔒图标',
                        '点击"连接安全"旁的箭头',
                        '找到"使用麦克风"，选择"允许"',
                        '刷新页面后重试'
                    ]
                });
            } else {
                solutions.push({
                    title: '通用解决方法',
                    steps: [
                        '检查浏览器地址栏是否有麦克风图标',
                        '点击该图标并选择"允许"',
                        '在浏览器设置中找到网站权限，允许麦克风访问',
                        '刷新页面后重试'
                    ]
                });
            }

            // macOS特殊提醒
            if (os === 'macos') {
                solutions.push({
                    title: 'macOS系统设置检查',
                    steps: [
                        '打开"系统偏好设置" → "安全性与隐私" → "隐私"',
                        '在左侧列表选择"麦克风"',
                        '确保您的浏览器已勾选并允许访问麦克风',
                        '如果没有，请点击锁图标解锁后添加浏览器'
                    ]
                });
            }

            // Windows特殊提醒
            if (os === 'windows') {
                solutions.push({
                    title: 'Windows系统设置检查',
                    steps: [
                        '打开"设置" → "隐私" → "麦克风"',
                        '确保"允许应用访问您的麦克风"已开启',
                        '确保"允许桌面应用访问您的麦克风"已开启',
                        '重启浏览器后重试'
                    ]
                });
            }
        }

        // 移动端建议
        if (deviceType === 'mobile') {
            if (os === 'ios') {
                solutions.push({
                    title: 'iPhone/iPad解决方法',
                    steps: [
                        '打开"设置" → "隐私与安全" → "麦克风"',
                        '找到您使用的浏览器（Safari/Chrome等）',
                        '确保麦克风权限已开启',
                        '返回浏览器刷新页面重试'
                    ]
                });

                if (browser === 'safari') {
                    solutions.push({
                        title: 'Safari特殊设置',
                        steps: [
                            '打开"设置" → "Safari" → "网站设置"',
                            '点击"麦克风"，设置为"询问"或"允许"',
                            '返回Safari刷新页面重试'
                        ]
                    });
                }
            } else if (os === 'android') {
                solutions.push({
                    title: 'Android手机解决方法',
                    steps: [
                        '打开"设置" → "应用" → 找到您的浏览器',
                        '点击"权限" → "麦克风"',
                        '选择"允许"',
                        '返回浏览器刷新页面重试'
                    ]
                });

                solutions.push({
                    title: '或者通过浏览器设置',
                    steps: [
                        '在浏览器中访问设置',
                        '找到"网站设置"或"权限"',
                        '允许麦克风访问',
                        '刷新页面重试'
                    ]
                });
            }
        }

        // HTTPS相关建议
        if (!isHttps && !isLocalhost) {
            solutions.push({
                title: '⚠️ 安全连接提醒',
                steps: [
                    '当前网站使用HTTP连接，某些浏览器可能限制麦克风访问',
                    '建议使用HTTPS连接访问网站',
                    '或者在浏览器设置中允许HTTP网站访问麦克风'
                ]
            });
        }

        return {
            title: '麦克风权限被拒绝',
            icon: '🚫',
            solutions
        };
    }

    // 未找到设备的建议
    getNotFoundAdvice() {
        const { os, deviceType } = this.deviceInfo;
        
        let solutions = [{
            title: '检查麦克风设备',
            steps: [
                '确保麦克风设备已正确连接到电脑',
                '检查麦克风是否被其他应用程序占用',
                '尝试重新插拔麦克风设备'
            ]
        }];

        if (deviceType === 'desktop') {
            if (os === 'macos') {
                solutions.push({
                    title: 'macOS设备检查',
                    steps: [
                        '打开"系统偏好设置" → "声音" → "输入"',
                        '确保麦克风设备出现在列表中',
                        '测试麦克风音量是否正常'
                    ]
                });
            } else if (os === 'windows') {
                solutions.push({
                    title: 'Windows设备检查',
                    steps: [
                        '右键点击任务栏音量图标 → "录音设备"',
                        '确保麦克风设备已启用',
                        '设置为默认录音设备'
                    ]
                });
            }
        }

        return {
            title: '未检测到麦克风设备',
            icon: '🔍',
            solutions
        };
    }

    // 不支持的建议
    getNotSupportedAdvice() {
        const { browser, isHttps, isLocalhost } = this.deviceInfo;
        
        let solutions = [{
            title: '浏览器兼容性',
            steps: [
                '请使用现代浏览器（Chrome、Firefox、Safari、Edge）',
                '确保浏览器版本是最新的',
                '尝试清除浏览器缓存和Cookie'
            ]
        }];

        if (!isHttps && !isLocalhost) {
            solutions.push({
                title: '安全连接要求',
                steps: [
                    '麦克风功能需要HTTPS安全连接',
                    '请通过HTTPS访问网站',
                    '或者在localhost环境下测试'
                ]
            });
        }

        return {
            title: '浏览器不支持麦克风访问',
            icon: '⚠️',
            solutions
        };
    }

    // 通用建议
    getGenericAdvice() {
        return {
            title: '麦克风访问出现问题',
            icon: '❓',
            solutions: [{
                title: '通用解决方法',
                steps: [
                    '检查麦克风设备连接',
                    '确认浏览器权限设置',
                    '尝试刷新页面',
                    '重启浏览器后重试'
                ]
            }]
        };
    }

    // 格式化建议为HTML
    formatAdviceAsHtml(advice) {
        let html = `<div class="permission-advice">`;
        html += `<h4>${advice.icon} ${advice.title}</h4>`;
        
        advice.solutions.forEach((solution, index) => {
            html += `<div class="solution-section">`;
            html += `<h5>${solution.title}</h5>`;
            html += `<ol>`;
            solution.steps.forEach(step => {
                html += `<li>${step}</li>`;
            });
            html += `</ol>`;
            html += `</div>`;
        });
        
        html += `</div>`;
        return html;
    }

    // 获取简化的建议文本
    getSimplifiedAdvice(error) {
        const advice = this.getMicrophonePermissionAdvice(error);
        const { os, browser, deviceType } = this.deviceInfo;
        
        // 选择最相关的解决方案
        let primarySolution = advice.solutions[0];
        if (advice.solutions.length > 1) {
            // 优先选择与当前环境最匹配的解决方案
            primarySolution = advice.solutions.find(solution => 
                solution.title.toLowerCase().includes(browser) || 
                solution.title.toLowerCase().includes(os)
            ) || advice.solutions[0];
        }
        
        let text = `${advice.title}\n\n${primarySolution.title}:\n`;
        primarySolution.steps.forEach((step, index) => {
            text += `${index + 1}. ${step}\n`;
        });
        
        return text;
    }
}

// 创建全局实例
window.microphonePermissionHelper = new MicrophonePermissionHelper();

// 导出给其他模块使用
window.MicrophonePermissionHelper = MicrophonePermissionHelper;

console.log('🎤 麦克风权限助手已加载');

