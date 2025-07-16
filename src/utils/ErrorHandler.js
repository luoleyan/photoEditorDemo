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
      UI: 'ui',
      STATE: 'state',
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
    this.userGuidanceCallbacks = new Set();
    this.contextualHelpCallbacks = new Set();

    // 用户友好的错误消息映射
    this.userFriendlyMessages = new Map();
    this.operationGuidance = new Map();
    this.troubleshootingSteps = new Map();

    this._setupGlobalErrorHandlers();
    this._setupRecoveryStrategies();
    this._setupUserFriendlyMessages();
    this._setupOperationGuidance();
    this._setupTroubleshootingSteps();
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

  // ========== 用户体验增强方法 ==========

  /**
   * 设置用户友好的错误消息
   * @private
   */
  _setupUserFriendlyMessages() {
    // 网络错误
    this.userFriendlyMessages.set('network_timeout', {
      title: '网络连接超时',
      message: '请检查您的网络连接，然后重试',
      icon: '🌐',
      severity: 'medium'
    });

    this.userFriendlyMessages.set('network_offline', {
      title: '网络连接断开',
      message: '您似乎已离线，请检查网络连接',
      icon: '📡',
      severity: 'high'
    });

    // 文件错误
    this.userFriendlyMessages.set('file_too_large', {
      title: '文件过大',
      message: '选择的文件太大，请选择小于10MB的图片',
      icon: '📁',
      severity: 'medium'
    });

    this.userFriendlyMessages.set('file_invalid_format', {
      title: '不支持的文件格式',
      message: '请选择JPG、PNG或GIF格式的图片',
      icon: '🖼️',
      severity: 'medium'
    });

    // 内存错误
    this.userFriendlyMessages.set('memory_insufficient', {
      title: '内存不足',
      message: '图片太大或操作过多，建议刷新页面重新开始',
      icon: '💾',
      severity: 'high'
    });

    // 适配器错误
    this.userFriendlyMessages.set('adapter_not_supported', {
      title: '功能不支持',
      message: '当前编辑器不支持此操作，请尝试其他工具',
      icon: '🔧',
      severity: 'medium'
    });

    // 权限错误
    this.userFriendlyMessages.set('permission_denied', {
      title: '权限不足',
      message: '无法访问所需资源，请检查浏览器权限设置',
      icon: '🔒',
      severity: 'high'
    });

    // UI错误
    this.userFriendlyMessages.set('ui_component_error', {
      title: '界面组件错误',
      message: '界面出现问题，正在尝试恢复',
      icon: '🖥️',
      severity: 'medium'
    });

    // 状态错误
    this.userFriendlyMessages.set('state_corruption', {
      title: '编辑状态异常',
      message: '编辑历史出现问题，建议保存当前工作并刷新',
      icon: '⚠️',
      severity: 'high'
    });
  }

  /**
   * 设置操作指导
   * @private
   */
  _setupOperationGuidance() {
    // 文件操作指导
    this.operationGuidance.set('file_upload', {
      title: '如何上传图片',
      steps: [
        '点击"选择文件"按钮或拖拽图片到编辑区域',
        '支持JPG、PNG、GIF格式，文件大小不超过10MB',
        '上传后图片会自动显示在编辑器中'
      ],
      tips: [
        '建议使用高质量的原图以获得最佳编辑效果',
        '大尺寸图片可能需要较长加载时间'
      ]
    });

    // 文本编辑指导
    this.operationGuidance.set('text_editing', {
      title: '文本编辑指南',
      steps: [
        '点击"添加文本"按钮创建文本对象',
        '双击文本进行编辑，输入您想要的内容',
        '使用工具栏调整字体、大小、颜色等样式',
        '拖拽文本到合适的位置'
      ],
      tips: [
        '按Esc键可以退出文本编辑模式',
        '可以添加多个文本对象'
      ]
    });

    // 画笔工具指导
    this.operationGuidance.set('brush_drawing', {
      title: '画笔绘制指南',
      steps: [
        '选择画笔工具并设置画笔大小和颜色',
        '在图片上按住鼠标左键并拖动进行绘制',
        '使用橡皮擦工具可以擦除绘制内容',
        '调整不透明度可以创建半透明效果'
      ],
      tips: [
        '使用较小的画笔可以绘制精细的细节',
        '按住Shift键可以绘制直线'
      ]
    });

    // 滤镜应用指导
    this.operationGuidance.set('filter_application', {
      title: '滤镜应用指南',
      steps: [
        '在滤镜面板中选择想要的滤镜效果',
        '调整滤镜强度以获得理想效果',
        '可以叠加多个滤镜创建独特效果',
        '使用"重置"按钮可以移除所有滤镜'
      ],
      tips: [
        '建议先保存原图备份',
        '某些滤镜可能会影响图片质量'
      ]
    });
  }

  /**
   * 设置故障排除步骤
   * @private
   */
  _setupTroubleshootingSteps() {
    // 网络问题排除
    this.troubleshootingSteps.set('network_issues', {
      title: '网络问题排除',
      steps: [
        {
          step: '检查网络连接',
          description: '确保设备已连接到互联网',
          action: 'check_connection'
        },
        {
          step: '刷新页面',
          description: '按F5或点击浏览器刷新按钮',
          action: 'refresh_page'
        },
        {
          step: '清除缓存',
          description: '清除浏览器缓存和Cookie',
          action: 'clear_cache'
        },
        {
          step: '尝试其他网络',
          description: '切换到其他WiFi或使用移动数据',
          action: 'switch_network'
        }
      ]
    });

    // 性能问题排除
    this.troubleshootingSteps.set('performance_issues', {
      title: '性能问题排除',
      steps: [
        {
          step: '关闭其他标签页',
          description: '关闭不必要的浏览器标签页释放内存',
          action: 'close_tabs'
        },
        {
          step: '降低图片质量',
          description: '使用较小尺寸的图片进行编辑',
          action: 'reduce_quality'
        },
        {
          step: '清理编辑历史',
          description: '清除撤销历史记录释放内存',
          action: 'clear_history'
        },
        {
          step: '重启浏览器',
          description: '完全关闭并重新打开浏览器',
          action: 'restart_browser'
        }
      ]
    });

    // 功能问题排除
    this.troubleshootingSteps.set('feature_issues', {
      title: '功能问题排除',
      steps: [
        {
          step: '检查浏览器兼容性',
          description: '确保使用现代浏览器（Chrome、Firefox、Safari、Edge）',
          action: 'check_browser'
        },
        {
          step: '启用JavaScript',
          description: '确保浏览器已启用JavaScript',
          action: 'enable_javascript'
        },
        {
          step: '禁用广告拦截器',
          description: '暂时禁用广告拦截器或将网站加入白名单',
          action: 'disable_adblocker'
        },
        {
          step: '更新浏览器',
          description: '将浏览器更新到最新版本',
          action: 'update_browser'
        }
      ]
    });
  }

  /**
   * 获取用户友好的错误消息
   * @param {string} errorKey - 错误键
   * @param {Object} context - 上下文信息
   * @returns {Object} 用户友好的错误信息
   */
  getUserFriendlyMessage(errorKey, context = {}) {
    const message = this.userFriendlyMessages.get(errorKey);
    if (message) {
      return {
        ...message,
        context,
        timestamp: Date.now()
      };
    }

    // 默认消息
    return {
      title: '出现了问题',
      message: '操作无法完成，请稍后重试',
      icon: '❌',
      severity: 'medium',
      context,
      timestamp: Date.now()
    };
  }

  /**
   * 获取操作指导
   * @param {string} operation - 操作类型
   * @returns {Object} 操作指导信息
   */
  getOperationGuidance(operation) {
    return this.operationGuidance.get(operation) || {
      title: '操作指南',
      steps: ['请参考帮助文档或联系技术支持'],
      tips: []
    };
  }

  /**
   * 获取故障排除步骤
   * @param {string} issueType - 问题类型
   * @returns {Object} 故障排除步骤
   */
  getTroubleshootingSteps(issueType) {
    return this.troubleshootingSteps.get(issueType) || {
      title: '故障排除',
      steps: [
        {
          step: '联系技术支持',
          description: '如果问题持续存在，请联系我们的技术支持团队',
          action: 'contact_support'
        }
      ]
    };
  }

  /**
   * 注册用户指导回调
   * @param {Function} callback - 回调函数
   */
  onUserGuidance(callback) {
    this.userGuidanceCallbacks.add(callback);
  }

  /**
   * 注册上下文帮助回调
   * @param {Function} callback - 回调函数
   */
  onContextualHelp(callback) {
    this.contextualHelpCallbacks.add(callback);
  }

  /**
   * 触发用户指导
   * @param {string} operation - 操作类型
   * @param {Object} context - 上下文信息
   */
  triggerUserGuidance(operation, context = {}) {
    const guidance = this.getOperationGuidance(operation);
    this.userGuidanceCallbacks.forEach(callback => {
      try {
        callback(guidance, context);
      } catch (error) {
        console.error('User guidance callback error:', error);
      }
    });
  }

  /**
   * 触发上下文帮助
   * @param {string} issueType - 问题类型
   * @param {Object} context - 上下文信息
   */
  triggerContextualHelp(issueType, context = {}) {
    const troubleshooting = this.getTroubleshootingSteps(issueType);
    this.contextualHelpCallbacks.forEach(callback => {
      try {
        callback(troubleshooting, context);
      } catch (error) {
        console.error('Contextual help callback error:', error);
      }
    });
  }
}

// 创建全局实例
const errorHandler = new ErrorHandler();

export default ErrorHandler;
export { errorHandler };
