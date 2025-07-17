/**
 * 错误恢复策略管理器
 * 提供智能的错误恢复和系统稳定性保障
 */
import { errorHandler } from "./ErrorHandler.js";
import { memoryManager } from "./MemoryManager.js";

class ErrorRecoveryManager {
  constructor() {
    this.recoveryStrategies = new Map();
    this.recoveryHistory = [];
    this.maxRecoveryAttempts = 3;
    this.recoveryTimeWindow = 5 * 60 * 1000; // 5分钟
    this.systemHealth = {
      memoryUsage: "normal",
      errorRate: "low",
      lastRecovery: null,
      consecutiveFailures: 0,
    };

    this._setupDefaultStrategies();
    this._startHealthMonitoring();
  }

  /**
   * 注册恢复策略
   * @param {string} errorType - 错误类型
   * @param {Function} strategy - 恢复策略函数
   * @param {Object} options - 策略选项
   */
  registerStrategy(errorType, strategy, options = {}) {
    this.recoveryStrategies.set(errorType, {
      strategy,
      priority: options.priority || 1,
      maxAttempts: options.maxAttempts || this.maxRecoveryAttempts,
      cooldown: options.cooldown || 30000, // 30秒冷却时间
      lastAttempt: 0,
      successCount: 0,
      failureCount: 0,
    });
  }

  /**
   * 执行错误恢复
   * @param {Object} errorInfo - 错误信息
   * @returns {Promise<Object>} 恢复结果
   */
  async executeRecovery(errorInfo) {
    const strategy = this.recoveryStrategies.get(errorInfo.type);

    if (!strategy) {
      return { success: false, message: "没有可用的恢复策略" };
    }

    // 检查是否在冷却期
    const now = Date.now();
    if (now - strategy.lastAttempt < strategy.cooldown) {
      return {
        success: false,
        message: "恢复策略在冷却期内",
        nextAttemptTime: strategy.lastAttempt + strategy.cooldown,
      };
    }

    // 检查最大尝试次数
    const recentAttempts = this._getRecentAttempts(errorInfo.type);
    if (recentAttempts >= strategy.maxAttempts) {
      return {
        success: false,
        message: "已达到最大恢复尝试次数",
        maxAttempts: strategy.maxAttempts,
      };
    }

    try {
      strategy.lastAttempt = now;

      // 执行恢复策略
      const result = await strategy.strategy(errorInfo, this.systemHealth);

      // 记录恢复历史
      this._recordRecovery(errorInfo.type, true, result);

      strategy.successCount++;
      this.systemHealth.consecutiveFailures = 0;
      this.systemHealth.lastRecovery = now;

      return {
        success: true,
        message: "错误恢复成功",
        details: result,
        strategy: errorInfo.type,
      };
    } catch (recoveryError) {
      // 记录恢复失败
      this._recordRecovery(errorInfo.type, false, recoveryError);

      strategy.failureCount++;
      this.systemHealth.consecutiveFailures++;

      return {
        success: false,
        message: "错误恢复失败",
        error: recoveryError.message,
        strategy: errorInfo.type,
      };
    }
  }

  /**
   * 获取系统健康状态
   * @returns {Object} 系统健康信息
   */
  getSystemHealth() {
    return {
      ...this.systemHealth,
      recoveryStrategies: this._getStrategyStats(),
      recentRecoveries: this.recoveryHistory.slice(-10),
    };
  }

  /**
   * 重置恢复历史
   * @param {string} errorType - 错误类型（可选）
   */
  resetRecoveryHistory(errorType = null) {
    if (errorType) {
      this.recoveryHistory = this.recoveryHistory.filter(
        (r) => r.type !== errorType
      );
      const strategy = this.recoveryStrategies.get(errorType);
      if (strategy) {
        strategy.successCount = 0;
        strategy.failureCount = 0;
        strategy.lastAttempt = 0;
      }
    } else {
      this.recoveryHistory = [];
      this.recoveryStrategies.forEach((strategy) => {
        strategy.successCount = 0;
        strategy.failureCount = 0;
        strategy.lastAttempt = 0;
      });
    }
  }

  /**
   * 执行系统自检
   * @returns {Object} 自检结果
   */
  async performSystemCheck() {
    const checks = {
      memory: await this._checkMemoryHealth(),
      adapters: await this._checkAdapterHealth(),
      performance: await this._checkPerformanceHealth(),
      errors: await this._checkErrorHealth(),
    };

    const overallHealth = this._calculateOverallHealth(checks);

    return {
      timestamp: Date.now(),
      overallHealth,
      checks,
      recommendations: this._generateRecommendations(checks),
    };
  }

  // ========== 私有方法 ==========

  /**
   * 设置默认恢复策略
   * @private
   */
  _setupDefaultStrategies() {
    // 内存错误恢复策略
    this.registerStrategy(
      "memory",
      async (errorInfo, systemHealth) => {
        // 强制内存清理
        memoryManager.forceCleanup();

        // 降低图像质量
        if (window.photoEditorApp && window.photoEditorApp.currentAdapter) {
          const adapter = window.photoEditorApp.currentAdapter;
          if (adapter.performanceOptimizer) {
            adapter.performanceOptimizer.mobileConfig.compressionQuality = 0.5;
          }
        }

        return { action: "memoryCleanup", qualityReduced: true };
      },
      { priority: 1, maxAttempts: 2 }
    );

    // 适配器错误恢复策略
    this.registerStrategy(
      "adapter",
      async (errorInfo, systemHealth) => {
        // 尝试重新初始化适配器
        if (window.photoEditorApp && window.photoEditorApp.currentAdapter) {
          const adapter = window.photoEditorApp.currentAdapter;

          try {
            await adapter.destroy();
            await adapter.initialize(adapter.container);
            return { action: "adapterReinitialized" };
          } catch (reinitError) {
            // 如果重新初始化失败，尝试切换适配器
            return {
              action: "switchAdapterRequired",
              error: reinitError.message,
            };
          }
        }

        return { action: "noAdapterAvailable" };
      },
      { priority: 2, maxAttempts: 1 }
    );

    // 网络错误恢复策略
    this.registerStrategy(
      "network",
      async (errorInfo, systemHealth) => {
        // 检查网络连接
        if (!navigator.onLine) {
          return { action: "offline", message: "设备处于离线状态" };
        }

        // 尝试重新连接
        try {
          const response = await fetch("/ping", {
            method: "HEAD",
            cache: "no-cache",
            timeout: 5000,
          });

          if (response.ok) {
            return { action: "networkRestored" };
          } else {
            return { action: "serverUnavailable", status: response.status };
          }
        } catch (error) {
          return { action: "connectionFailed", error: error.message };
        }
      },
      { priority: 3, maxAttempts: 3, cooldown: 10000 }
    );

    // 文件错误恢复策略
    this.registerStrategy(
      "file",
      async (errorInfo, systemHealth) => {
        // 尝试文件格式转换或修复
        if (errorInfo.context && errorInfo.context.fileType) {
          const supportedFormats = ["image/jpeg", "image/png", "image/webp"];
          const currentFormat = errorInfo.context.fileType;

          if (!supportedFormats.includes(currentFormat)) {
            return {
              action: "unsupportedFormat",
              supportedFormats,
              currentFormat,
            };
          }
        }

        return { action: "fileValidationFailed" };
      },
      { priority: 2, maxAttempts: 1 }
    );
  }

  /**
   * 开始健康监控
   * @private
   */
  _startHealthMonitoring() {
    // 每分钟检查一次系统健康状态
    setInterval(() => {
      this._updateSystemHealth();
    }, 60000);

    // 监听内存使用情况
    if (memoryManager) {
      memoryManager.addCleanupCallback(() => {
        this._updateMemoryHealth();
      });
    }
  }

  /**
   * 更新系统健康状态
   * @private
   */
  _updateSystemHealth() {
    // 更新内存使用状态
    this._updateMemoryHealth();

    // 更新错误率
    this._updateErrorRate();
  }

  /**
   * 更新内存健康状态
   * @private
   */
  _updateMemoryHealth() {
    const memoryUsage = memoryManager.getMemoryUsage();

    if (memoryUsage.isOverLimit) {
      this.systemHealth.memoryUsage = "critical";
    } else if (memoryUsage.isNearLimit) {
      this.systemHealth.memoryUsage = "warning";
    } else {
      this.systemHealth.memoryUsage = "normal";
    }
  }

  /**
   * 更新错误率
   * @private
   */
  _updateErrorRate() {
    const recentErrors = errorHandler.getErrorLog({
      timeRange: {
        start: Date.now() - this.recoveryTimeWindow,
        end: Date.now(),
      },
    });

    if (recentErrors.length > 10) {
      this.systemHealth.errorRate = "high";
    } else if (recentErrors.length > 5) {
      this.systemHealth.errorRate = "medium";
    } else {
      this.systemHealth.errorRate = "low";
    }
  }

  /**
   * 获取最近的恢复尝试次数
   * @param {string} errorType - 错误类型
   * @returns {number} 尝试次数
   * @private
   */
  _getRecentAttempts(errorType) {
    const cutoff = Date.now() - this.recoveryTimeWindow;
    return this.recoveryHistory.filter(
      (r) => r.type === errorType && r.timestamp > cutoff
    ).length;
  }

  /**
   * 记录恢复历史
   * @param {string} type - 错误类型
   * @param {boolean} success - 是否成功
   * @param {*} result - 结果
   * @private
   */
  _recordRecovery(type, success, result) {
    this.recoveryHistory.push({
      type,
      success,
      result,
      timestamp: Date.now(),
    });

    // 限制历史记录大小
    if (this.recoveryHistory.length > 100) {
      this.recoveryHistory = this.recoveryHistory.slice(-50);
    }
  }

  /**
   * 获取策略统计信息
   * @returns {Object} 策略统计
   * @private
   */
  _getStrategyStats() {
    const stats = {};

    this.recoveryStrategies.forEach((strategy, type) => {
      stats[type] = {
        successCount: strategy.successCount,
        failureCount: strategy.failureCount,
        successRate:
          strategy.successCount + strategy.failureCount > 0
            ? strategy.successCount /
              (strategy.successCount + strategy.failureCount)
            : 0,
        lastAttempt: strategy.lastAttempt,
      };
    });

    return stats;
  }

  /**
   * 检查内存健康状态
   * @returns {Object} 内存检查结果
   * @private
   */
  async _checkMemoryHealth() {
    const memoryUsage = memoryManager.getMemoryUsage();

    return {
      status: this.systemHealth.memoryUsage,
      usage: memoryUsage.usagePercentage,
      allocated: memoryUsage.allocated,
      peak: memoryUsage.peak,
      recommendation: memoryUsage.isNearLimit ? "cleanup" : "normal",
    };
  }

  /**
   * 检查适配器健康状态
   * @returns {Object} 适配器检查结果
   * @private
   */
  async _checkAdapterHealth() {
    // 这里可以检查适配器的状态
    return {
      status: "normal",
      activeAdapter: "unknown",
      recommendation: "normal",
    };
  }

  /**
   * 检查性能健康状态
   * @returns {Object} 性能检查结果
   * @private
   */
  async _checkPerformanceHealth() {
    return {
      status: "normal",
      recommendation: "normal",
    };
  }

  /**
   * 检查错误健康状态
   * @returns {Object} 错误检查结果
   * @private
   */
  async _checkErrorHealth() {
    return {
      status: this.systemHealth.errorRate,
      consecutiveFailures: this.systemHealth.consecutiveFailures,
      recommendation:
        this.systemHealth.consecutiveFailures > 3 ? "restart" : "normal",
    };
  }

  /**
   * 计算整体健康状态
   * @param {Object} checks - 检查结果
   * @returns {string} 整体健康状态
   * @private
   */
  _calculateOverallHealth(checks) {
    const statuses = Object.values(checks).map((check) => check.status);

    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("warning")) return "warning";
    return "normal";
  }

  /**
   * 生成建议
   * @param {Object} checks - 检查结果
   * @returns {Array} 建议列表
   * @private
   */
  _generateRecommendations(checks) {
    const recommendations = [];

    Object.entries(checks).forEach(([type, check]) => {
      if (check.recommendation && check.recommendation !== "normal") {
        recommendations.push({
          type,
          action: check.recommendation,
          priority: check.status === "critical" ? "high" : "medium",
        });
      }
    });

    return recommendations;
  }
}

// 创建全局实例
const errorRecoveryManager = new ErrorRecoveryManager();

// 注册到错误处理器
errorHandler.registerRecoveryStrategy("memory", (errorInfo) =>
  errorRecoveryManager.executeRecovery(errorInfo)
);
errorHandler.registerRecoveryStrategy("adapter", (errorInfo) =>
  errorRecoveryManager.executeRecovery(errorInfo)
);
errorHandler.registerRecoveryStrategy("network", (errorInfo) =>
  errorRecoveryManager.executeRecovery(errorInfo)
);
errorHandler.registerRecoveryStrategy("file", (errorInfo) =>
  errorRecoveryManager.executeRecovery(errorInfo)
);

export default ErrorRecoveryManager;
export { errorRecoveryManager };
