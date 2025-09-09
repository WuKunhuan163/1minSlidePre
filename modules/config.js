/**
 * 简单配置管理 - 轻量级配置存储
 */
class SimpleConfig {
    constructor() {
        this.storageKey = 'slidePresentation_config';
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem(this.storageKey);
                    return saved ? JSON.parse(saved) : {
            recordingEnabled: false,
            aiEnabled: false,
            appKey: '',
            accessKeyId: '',
            accessKeySecret: '',
            zhipuApiKey: '',
            effectsVolume: 0.5, // 默认计时音效音量50%
            backgroundMusicVolume: 0.5, // 默认背景音乐音量50%
            // NEW状态跟踪
            settingsStatus: {
                recordingTested: false,
                aiTested: false
            }
        };
        } catch (error) {
            console.error('配置加载失败:', error);
            return {};
        }
    }

    saveConfig() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
        } catch (error) {
            console.error('❌ 配置保存失败:', error);
        }
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }

    getAll() {
        return { ...this.config };
    }

    setAll(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    // NEW状态管理方法
    hasNewSettings() {
        const status = this.config.settingsStatus || {};
        return !status.recordingTested || !status.aiTested;
    }

    markSettingTested(settingName) {
        if (!this.config.settingsStatus) {
            this.config.settingsStatus = {};
        }
        this.config.settingsStatus[settingName + 'Tested'] = true;
        this.saveConfig();
    }

    isSettingTested(settingName) {
        const status = this.config.settingsStatus || {};
        return status[settingName + 'Tested'] === true;
    }

    isSettingNew(settingName) {
        const status = this.config.settingsStatus || {};
        return !status[settingName + 'Tested'];
    }
}

// 全局实例
const simpleConfig = new SimpleConfig();
// console.log('⚙️ 简单配置管理器已加载');
