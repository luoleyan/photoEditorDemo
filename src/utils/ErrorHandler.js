/**
 * 统一错误处理管理器
 * 提供错误捕获、分类、恢复和用户友好的错误提示
 */
class ErrorHandler {
  constructor() {
    this.errorTypes = {
      NETWORK: 'network',
      VALIDATION: 'validation',
      ADAPTER: 'adapter',
      MEMORY: 'memory',
      FILE: 'file',
      PERMISSION: 'permission',
      UNKNOWN: 'unknown'
    };

    this.errorLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.errorLog = [];
    this.maxLogSize = 100;
    this.errorCallbacks = new Map();
    this.recoveryStrategies = new Map();
    this.userNotificationCallbacks = new Set();

    this._setupGlobalErrorHandlers();
    this._setupRecoveryStrategies();
  }

  /**
   * 处理错误
   * @param {Error|string} error - 错误对象或错误消息
   * @param {Object} context - 错误上下文信息
   * @param {string} type - 错误类型
   * @param {string} level - 错误级别
   * @returns {Object} 错误处理结果
   */
  handleError(error, context = {}, type = this.errorTypes.UNKNOWN, level = this.errorLevels.MEDIUM) {
    const errorInfo = this._createErrorInfo(error, context, type, level);
    
    // 记录错误
    this._logError(errorInfo);
    
    // 尝试恢复
    const recoveryResult = this._attemptRecovery(errorInfo);
    
    // 通知用户
    this._notifyUser(errorInfo, recoveryResult);
    
    // 触发回调
    this._triggerCallbacks(errorInfo, recoveryResult);
    
    return {
      errorInfo,
      recoveryResult,
      canRecover: recoveryResult.success,
      userMessage: this._getUserMessage(errorInfo, recoveryResult)
    };
  }

  /**
   * 注册错误回调
   * @param {string} type - 错误类型
   * @param {Function} callback - 回调函数
   */
  onError(type, callback) {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, new Set());
    }
    this.errorCallbacks.get(type).add(callback);
  }

  /**
   * 移除错误回调
   * @param {string} type - 错误类型
   * @param {Function} callback - 回调函数
   */
  offError(type, callback) {
    if (this.errorCallbacks.has(type)) {
      this.errorCallbacks.get(type).delete(callback);
    }
  }

  /**
   * 注册用户通知回调
   * @param {Function} callback - 通知回调函数
   */
  onUserNotification(callback) {
    this.userNotificationCallbacks.add(callback);
  }

  /**
   * 移除用户通知回调
   * @param {Function} callback - 通知回调函数
   */
  offUserNotification(callback) {
    this.userNotificationCallbacks.delete(callback);
  }

  /**
   * 注册恢复策略
   * @param {string} type - 错误类型
   * @param {Function} strategy - 恢复策略函数
   */
  registerRecoveryStrategy(type, strategy) {
    this.recoveryStrategies.set(type, strategy);
  }

  /**
   * 获取错误日志
   * @param {Object} filters - 过滤条件
   * @returns {Array} 错误日志
   */
  getErrorLog(filters = {}) {
    let logs = [...this.errorLog];
    
    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type);
    }
    
    if (filters.level) {
      logs = logs.filter(log => log.level === filters.level);
    }
    
    if (filters.timeRange) {
      const { start, end } = filters.timeRange;
      logs = logs.filter(log => log.timestamp >= start && log.timestamp <= end);
    }
    
    return logs;
  }

  /**
   * 清除错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * 获取错误统计
   * @returns {Object} 错误统计信息
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      byLevel: {},
      recent: 0 // 最近1小时的错误数
    };

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    this.errorLog.forEach(error => {
      // 按类型统计
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // 按级别统计
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
      
      // 最近错误统计
      if (error.timestamp > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  // ========== 私有方法 ==========

  /**
   * 创建错误信息对象
   * @param {Error|string} error - 错误
   * @param {Object} context - 上下文
   * @param {string} type - 类型
   * @param {string} level - 级别
   * @returns {Object} 错误信息
   * @private
   */
  _createErrorInfo(error, context, type, level) {
    const errorObj = error instanceof Error ? error : new Error(error);
    
    return {
      id: this._generateErrorId(),
      timestamp: Date.now(),
      type,
      level,
      message: errorObj.message,
      stack: errorObj.stack,
      context: { ...context },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || 'anonymous'
    };
  }

  /**
   * 记录错误
   * @param {Object} errorInfo - 错误信息
   * @private
   */
  _logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 控制台输出
    const logMethod = this._getConsoleMethod(errorInfo.level);
    console[logMethod](`[ErrorHandler] ${errorInfo.type.toUpperCase()}:`, errorInfo.message, errorInfo);
  }

  /**
   * 尝试错误恢复
   * @param {Object} errorInfo - 错误信息
   * @returns {Object} 恢复结果
   * @private
   */
  _attemptRecovery(errorInfo) {
    const strategy = this.recoveryStrategies.get(errorInfo.type);
    
    if (!strategy) {
      return { success: false, message: '没有可用的恢复策略' };
    }

    try {
      const result = strategy(errorInfo);
      return {
        success: true,
        message: '错误已自动恢复',
        details: result
      };
    } catch (recoveryError) {
      return {
        success: false,
        message: '自动恢复失败',
        error: recoveryError.message
      };
    }
  }

  /**
   * 通知用户
   * @param {Object} errorInfo - 错误信息
   * @param {Object} recoveryResult - 恢复结果
   * @private
   */
  _notifyUser(errorInfo, recoveryResult) {
    const notification = {
      type: errorInfo.type,
      level: errorInfo.level,
      message: this._getUserMessage(errorInfo, recoveryResult),
      canRecover: recoveryResult.success,
      timestamp: errorInfo.timestamp,
      actions: this._getAvailableActions(errorInfo)
    };

    this.userNotificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('用户通知回调执行失败:', error);
      }
    });
  }

  /**
   * 触发错误回调
   * @param {Object} errorInfo - 错误信息
   * @param {Object} recoveryResult - 恢复结果
   * @private
   */
  _triggerCallbacks(errorInfo, recoveryResult) {
    const callbacks = this.errorCallbacks.get(errorInfo.type) || new Set();
    
    callbacks.forEach(callback => {
      try {
        callback(errorInfo, recoveryResult);
      } catch (error) {
        console.error('错误回调执行失败:', error);
      }
    });
  }

  /**
   * 获取用户友好的错误消息
   * @param {Object} errorInfo - 错误信息
   * @param {Object} recoveryResult - 恢复结果
   * @returns {string} 用户消息
   * @private
   */
  _getUserMessage(errorInfo, recoveryResult) {
    const messages = {
      [this.errorTypes.NETWORK]: '网络连接出现问题，请检查网络设置',
      [this.errorTypes.VALIDATION]: '输入的数据格式不正确，请检查后重试',
      [this.errorTypes.ADAPTER]: '图像处理组件出现问题，正在尝试切换到备用组件',
      [this.errorTypes.MEMORY]: '内存不足，建议关闭其他应用程序或使用较小的图像',
      [this.errorTypes.FILE]: '文件处理失败，请确认文件格式正确且未损坏',
      [this.errorTypes.PERMISSION]: '缺少必要的权限，请检查浏览器设置',
      [this.errorTypes.UNKNOWN]: '发生了未知错误，我们正在努力解决'
    };

    let baseMessage = messages[errorInfo.type] || messages[this.errorTypes.UNKNOWN];
    
    if (recoveryResult.success) {
      baseMessage += '，问题已自动解决。';
    } else if (errorInfo.level === this.errorLevels.CRITICAL) {
      baseMessage += '，建议刷新页面重试。';
    }

    return baseMessage;
  }

  /**
   * 获取可用操作
   * @param {Object} errorInfo - 错误信息
   * @returns {Array} 可用操作列表
   * @private
   */
  _getAvailableActions(errorInfo) {
    const actions = [];

    switch (errorInfo.type) {
      case this.errorTypes.NETWORK:
        actions.push({ label: '重试', action: 'retry' });
        actions.push({ label: '离线模式', action: 'offline' });
        break;
      case this.errorTypes.ADAPTER:
        actions.push({ label: '切换适配器', action: 'switchAdapter' });
        actions.push({ label: '重新初始化', action: 'reinitialize' });
        break;
      case this.errorTypes.MEMORY:
        actions.push({ label: '清理内存', action: 'cleanMemory' });
        actions.push({ label: '降低质量', action: 'reduceQuality' });
        break;
      case this.errorTypes.FILE:
        actions.push({ label: '重新选择文件', action: 'selectFile' });
        actions.push({ label: '转换格式', action: 'convertFormat' });
        break;
      default:
        actions.push({ label: '刷新页面', action: 'refresh' });
    }

    return actions;
  }

  /**
   * 设置全局错误处理器
   * @private
   */
  _setupGlobalErrorHandlers() {
    // 全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, this.errorTypes.UNKNOWN, this.errorLevels.HIGH);
    });

    // Promise拒绝错误
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        promise: event.promise
      }, this.errorTypes.UNKNOWN, this.errorLevels.MEDIUM);
    });
  }

  /**
   * 设置恢复策略
   * @private
   */
  _setupRecoveryStrategies() {
    // 网络错误恢复
    this.registerRecoveryStrategy(this.errorTypes.NETWORK, (errorInfo) => {
      // 可以实现重试逻辑
      return { strategy: 'retry', attempts: 1 };
    });

    // 内存错误恢复
    this.registerRecoveryStrategy(this.errorTypes.MEMORY, (errorInfo) => {
      // 触发内存清理
      if (window.gc) {
        window.gc();
      }
      return { strategy: 'memoryCleanup', freed: true };
    });

    // 适配器错误恢复
    this.registerRecoveryStrategy(this.errorTypes.ADAPTER, (errorInfo) => {
      // 可以实现适配器切换逻辑
      return { strategy: 'switchAdapter', newAdapter: 'fallback' };
    });
  }

  /**
   * 生成错误ID
   * @returns {string} 错误ID
   * @private
   */
  _generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取控制台输出方法
   * @param {string} level - 错误级别
   * @returns {string} 控制台方法名
   * @private
   */
  _getConsoleMethod(level) {
    switch (level) {
      case this.errorLevels.LOW:
        return 'info';
      case this.errorLevels.MEDIUM:
        return 'warn';
      case this.errorLevels.HIGH:
      case this.errorLevels.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }
}

// 创建全局实例
const errorHandler = new ErrorHandler();

export default ErrorHandler;
export { errorHandler };
