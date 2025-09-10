/**
 * 统一错误处理工具
 * 提供标准化的错误处理和消息格式化
 */

class ErrorHandler {
    /**
     * 格式化错误消息，确保不会出现undefined
     * @param {Error|string|any} error - 错误对象或消息
     * @param {string} defaultMessage - 默认错误消息
     * @returns {string} 格式化后的错误消息
     */
    static formatErrorMessage(error, defaultMessage = '未知错误') {
        if (!error) {
            return defaultMessage;
        }

        if (typeof error === 'string') {
            return error || defaultMessage;
        }

        if (error instanceof Error) {
            return error.message || error.toString() || defaultMessage;
        }

        if (typeof error === 'object') {
            if (error.message) {
                return error.message;
            }
            if (error.error) {
                return ErrorHandler.formatErrorMessage(error.error, defaultMessage);
            }
            try {
                return JSON.stringify(error);
            } catch (e) {
                return defaultMessage;
            }
        }

        try {
            return error.toString() || defaultMessage;
        } catch (e) {
            return defaultMessage;
        }
    }

    /**
     * 创建标准化的Worker错误消息
     * @param {string} operation - 操作名称（如'转换', '合成'）
     * @param {Error|string|any} error - 错误对象
     * @returns {object} 标准化的错误消息对象
     */
    static createWorkerError(operation, error) {
        const message = ErrorHandler.formatErrorMessage(error, `${operation}过程中发生未知错误`);
        return {
            type: 'error',
            message: `${operation}失败: ${message}`
        };
    }

    /**
     * 创建标准化的日志错误消息
     * @param {string} operation - 操作名称
     * @param {Error|string|any} error - 错误对象
     * @returns {object} 标准化的日志消息对象
     */
    static createLogError(operation, error) {
        const message = ErrorHandler.formatErrorMessage(error, `${operation}过程中发生未知错误`);
        return {
            type: 'log',
            message: `❌ ${operation}失败: ${message}`
        };
    }

    /**
     * 安全地抛出错误，确保错误消息不为undefined
     * @param {Error|string|any} error - 错误对象
     * @param {string} defaultMessage - 默认错误消息
     * @throws {Error} 格式化后的错误
     */
    static throwSafeError(error, defaultMessage = '操作失败') {
        const message = ErrorHandler.formatErrorMessage(error, defaultMessage);
        throw new Error(message);
    }

    /**
     * 处理Worker消息中的错误
     * @param {any} message - Worker消息
     * @param {string} operation - 操作名称
     * @returns {Error} 格式化后的错误对象
     */
    static handleWorkerMessage(message, operation = '操作') {
        const errorMessage = ErrorHandler.formatErrorMessage(message, `${operation}过程中发生未知错误`);
        return new Error(errorMessage);
    }
}

export default ErrorHandler;

