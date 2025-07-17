/**
 * 内存管理器
 * 监控和管理应用程序的内存使用情况
 */
class MemoryManager {
  constructor(options = {}) {
    this.options = {
      maxMemoryUsage: options.maxMemoryUsage || 200 * 1024 * 1024, // 200MB
      warningThreshold: options.warningThreshold || 0.8, // 80%
      cleanupInterval: options.cleanupInterval || 30000, // 30秒
      enableAutoCleanup: options.enableAutoCleanup !== false,
      enableImageOptimization: options.enableImageOptimization !== false,
      maxImageSize: options.maxImageSize || 4096, // 最大图像尺寸
      compressionQuality: options.compressionQuality || 0.8, // 压缩质量
      enableWebWorker: options.enableWebWorker !== false,
      ...options,
    };

    this.memoryUsage = 0;
    this.peakMemoryUsage = 0;
    this.allocatedObjects = new Map();
    this.cleanupCallbacks = new Set();
    this.isMonitoring = false;
    this.cleanupTimer = null;

    // 性能观察器（如果支持）
    this.performanceObserver = null;
    this._initPerformanceObserver();

    // 图像处理缓存
    this.imageCache = new Map();
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB缓存

    // Web Worker池
    this.workerPool = [];
    this.maxWorkers = navigator.hardwareConcurrency || 4;

    // 性能监控数据
    this.performanceMetrics = {
      renderTime: [],
      memoryUsage: [],
      imageProcessingTime: [],
    };

    // 开始监控
    if (this.options.enableAutoCleanup) {
      this.startMonitoring();
    }

    // 初始化Web Worker池
    if (this.options.enableWebWorker) {
      this._initWorkerPool();
    }
  }

  /**
   * 开始内存监控
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // 定期清理
    this.cleanupTimer = setInterval(() => {
      this._performCleanup();
    }, this.options.cleanupInterval);

    // 监听页面可见性变化
    document.addEventListener(
      "visibilitychange",
      this._handleVisibilityChange.bind(this)
    );

    // 监听内存压力事件（如果支持）
    if ("memory" in performance) {
      this._monitorMemoryPressure();
    }

    console.log("内存监控已启动");
  }

  /**
   * 停止内存监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    document.removeEventListener(
      "visibilitychange",
      this._handleVisibilityChange.bind(this)
    );

    console.log("内存监控已停止");
  }

  /**
   * 分配内存对象
   * @param {string} id - 对象ID
   * @param {Object} object - 要跟踪的对象
   * @param {number} estimatedSize - 估算大小（字节）
   */
  allocate(id, object, estimatedSize = 0) {
    // 如果对象已存在，生成唯一ID避免重复分配警告
    if (this.allocatedObjects.has(id)) {
      const existingAllocation = this.allocatedObjects.get(id);
      // 如果是相同对象，直接返回现有ID
      if (existingAllocation.object === object) {
        return id;
      }
      // 如果是不同对象，先释放旧对象，然后分配新对象
      this.deallocate(id);
    }

    const allocation = {
      object,
      size: estimatedSize,
      timestamp: Date.now(),
      type: this._getObjectType(object),
    };

    this.allocatedObjects.set(id, allocation);
    this.memoryUsage += estimatedSize;

    if (this.memoryUsage > this.peakMemoryUsage) {
      this.peakMemoryUsage = this.memoryUsage;
    }

    // 检查内存使用情况
    this._checkMemoryUsage();

    return id;
  }

  /**
   * 释放内存对象
   * @param {string} id - 对象ID
   */
  deallocate(id) {
    const allocation = this.allocatedObjects.get(id);
    if (!allocation) return false;

    this.memoryUsage -= allocation.size;
    this.allocatedObjects.delete(id);

    // 清理对象引用
    this._cleanupObject(allocation.object);

    return true;
  }

  /**
   * 获取所有已分配的对象
   * @returns {Map} 已分配对象的Map
   */
  getAllocatedObjects() {
    return this.allocatedObjects;
  }

  /**
   * 获取内存使用情况
   * @returns {Object} 内存使用统计
   */
  getMemoryUsage() {
    const browserMemory = this._getBrowserMemoryInfo();

    return {
      // 应用程序内存
      allocated: this.memoryUsage,
      peak: this.peakMemoryUsage,
      objectCount: this.allocatedObjects.size,

      // 浏览器内存（如果可用）
      browser: browserMemory,

      // 阈值信息
      maxMemory: this.options.maxMemoryUsage,
      warningThreshold:
        this.options.maxMemoryUsage * this.options.warningThreshold,
      usagePercentage: (this.memoryUsage / this.options.maxMemoryUsage) * 100,

      // 状态
      isNearLimit:
        this.memoryUsage >
        this.options.maxMemoryUsage * this.options.warningThreshold,
      isOverLimit: this.memoryUsage > this.options.maxMemoryUsage,
    };
  }

  /**
   * 强制执行内存清理
   */
  forceCleanup() {
    this._performCleanup();
  }

  /**
   * 添加清理回调
   * @param {Function} callback - 清理回调函数
   */
  addCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * 移除清理回调
   * @param {Function} callback - 清理回调函数
   */
  removeCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * 获取内存使用详情
   * @returns {Array} 内存分配详情
   */
  getMemoryDetails() {
    const details = [];

    for (const [id, allocation] of this.allocatedObjects) {
      details.push({
        id,
        type: allocation.type,
        size: allocation.size,
        age: Date.now() - allocation.timestamp,
        timestamp: allocation.timestamp,
      });
    }

    return details.sort((a, b) => b.size - a.size); // 按大小排序
  }

  // ========== 私有方法 ==========

  /**
   * 初始化性能观察器
   * @private
   */
  _initPerformanceObserver() {
    if (typeof PerformanceObserver !== "undefined") {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (
              entry.entryType === "measure" &&
              entry.name.includes("memory")
            ) {
              console.log("内存性能指标:", entry);
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ["measure"] });
      } catch (error) {
        console.warn("无法初始化性能观察器:", error);
      }
    }
  }

  /**
   * 监控内存压力
   * @private
   */
  _monitorMemoryPressure() {
    if ("memory" in performance) {
      const checkMemory = () => {
        const memInfo = performance.memory;
        const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;

        if (usageRatio > 0.9) {
          console.warn("检测到高内存使用率:", usageRatio);
          this._performCleanup();
        }
      };

      setInterval(checkMemory, 5000); // 每5秒检查一次
    }
  }

  /**
   * 执行清理
   * @private
   */
  _performCleanup() {
    const beforeCleanup = this.memoryUsage;
    const startTime = Date.now();

    console.log(
      `MemoryManager: Starting cleanup cycle with ${this.cleanupCallbacks.size} callbacks`
    );

    // 执行注册的清理回调
    const failedCallbacks = [];
    let successfulCallbacks = 0;

    this.cleanupCallbacks.forEach((callback, index) => {
      try {
        const callbackStartTime = Date.now();
        callback();
        const callbackDuration = Date.now() - callbackStartTime;

        if (callbackDuration > 1000) {
          console.warn(
            `MemoryManager: Cleanup callback took ${callbackDuration}ms (slow)`
          );
        }

        successfulCallbacks++;
      } catch (error) {
        console.error("MemoryManager: Cleanup callback failed:", error);
        failedCallbacks.push({ callback, error, index });

        // 如果回调持续失败，考虑移除它
        if (!callback._failureCount) {
          callback._failureCount = 0;
        }
        callback._failureCount++;

        if (callback._failureCount >= 5) {
          console.warn(
            "MemoryManager: Removing persistently failing callback after 5 failures"
          );
          this.cleanupCallbacks.delete(callback);
        }
      }
    });

    // 清理过期对象
    try {
      this._cleanupExpiredObjects();
    } catch (error) {
      console.error("MemoryManager: Failed to cleanup expired objects:", error);
    }

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      try {
        window.gc();
      } catch (error) {
        console.warn(
          "MemoryManager: Failed to trigger garbage collection:",
          error
        );
      }
    }

    const afterCleanup = this.memoryUsage;
    const freed = beforeCleanup - afterCleanup;
    const duration = Date.now() - startTime;

    console.log(`MemoryManager: Cleanup completed in ${duration}ms`);
    console.log(
      `MemoryManager: Callbacks - ${successfulCallbacks} successful, ${failedCallbacks.length} failed`
    );

    if (freed > 0) {
      console.log(
        `MemoryManager: Released ${this._formatBytes(freed)} of memory`
      );
    }

    // 记录清理统计
    this._recordCleanupStats({
      duration,
      memoryFreed: freed,
      successfulCallbacks,
      failedCallbacks: failedCallbacks.length,
      timestamp: Date.now(),
    });
  }

  /**
   * 清理过期对象
   * @private
   */
  _cleanupExpiredObjects() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分钟
    const toDelete = [];

    for (const [id, allocation] of this.allocatedObjects) {
      if (now - allocation.timestamp > maxAge) {
        toDelete.push(id);
      }
    }

    toDelete.forEach((id) => this.deallocate(id));
  }

  /**
   * 检查内存使用情况
   * @private
   */
  _checkMemoryUsage() {
    const usage = this.getMemoryUsage();

    if (usage.isOverLimit) {
      console.error("内存使用超出限制!", usage);
      this._performCleanup();
    } else if (usage.isNearLimit) {
      console.warn("内存使用接近限制", usage);
    }
  }

  /**
   * 处理页面可见性变化
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      // 页面隐藏时执行清理
      console.log("MemoryManager: Page hidden, performing cleanup");
      this._performCleanup();
    }
  }

  /**
   * 记录清理统计信息
   * @param {Object} stats - 清理统计
   * @private
   */
  _recordCleanupStats(stats) {
    if (!this.cleanupStats) {
      this.cleanupStats = [];
    }

    this.cleanupStats.push(stats);

    // 只保留最近50次清理记录
    if (this.cleanupStats.length > 50) {
      this.cleanupStats = this.cleanupStats.slice(-50);
    }
  }

  /**
   * 获取清理统计信息
   * @returns {Array} 清理统计数组
   */
  getCleanupStats() {
    return this.cleanupStats || [];
  }

  /**
   * 获取清理性能摘要
   * @returns {Object} 性能摘要
   */
  getCleanupPerformanceSummary() {
    const stats = this.getCleanupStats();
    if (stats.length === 0) {
      return { message: "No cleanup statistics available" };
    }

    const totalCleanups = stats.length;
    const avgDuration =
      stats.reduce((sum, s) => sum + s.duration, 0) / totalCleanups;
    const totalMemoryFreed = stats.reduce((sum, s) => sum + s.memoryFreed, 0);
    const totalFailedCallbacks = stats.reduce(
      (sum, s) => sum + s.failedCallbacks,
      0
    );
    const totalSuccessfulCallbacks = stats.reduce(
      (sum, s) => sum + s.successfulCallbacks,
      0
    );

    return {
      totalCleanups,
      avgDuration: Math.round(avgDuration),
      totalMemoryFreed: this._formatBytes(totalMemoryFreed),
      callbackSuccessRate:
        (totalSuccessfulCallbacks /
          (totalSuccessfulCallbacks + totalFailedCallbacks)) *
        100,
      lastCleanup: new Date(stats[stats.length - 1].timestamp).toLocaleString(),
    };
  }

  /**
   * 获取对象类型
   * @param {*} object - 对象
   * @returns {string} 对象类型
   * @private
   */
  _getObjectType(object) {
    if (object instanceof HTMLCanvasElement) return "canvas";
    if (object instanceof HTMLImageElement) return "image";
    if (object instanceof Blob) return "blob";
    if (object instanceof ArrayBuffer) return "arraybuffer";
    if (Array.isArray(object)) return "array";
    return typeof object;
  }

  /**
   * 清理对象
   * @param {*} object - 要清理的对象
   * @private
   */
  _cleanupObject(object) {
    try {
      if (object instanceof HTMLCanvasElement) {
        const ctx = object.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, object.width, object.height);
        }
        object.width = 0;
        object.height = 0;
      } else if (object instanceof HTMLImageElement) {
        object.src = "";
      } else if (typeof object === "object" && object !== null) {
        // 清理对象属性
        Object.keys(object).forEach((key) => {
          delete object[key];
        });
      }
    } catch (error) {
      console.warn("清理对象时出错:", error);
    }
  }

  /**
   * 获取浏览器内存信息
   * @returns {Object|null} 浏览器内存信息
   * @private
   */
  _getBrowserMemoryInfo() {
    if ("memory" in performance) {
      const mem = performance.memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
        usagePercentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }

  /**
   * 格式化字节数
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // ========== 性能优化方法 ==========

  /**
   * 初始化Web Worker池
   * @private
   */
  _initWorkerPool() {
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = new Worker("/workers/image-processor.js");
        worker.isAvailable = true;
        this.workerPool.push(worker);
      } catch (error) {
        console.warn("Failed to create Web Worker:", error);
        break;
      }
    }
  }

  /**
   * 获取可用的Web Worker
   * @returns {Worker|null} 可用的Worker或null
   */
  getAvailableWorker() {
    return this.workerPool.find((worker) => worker.isAvailable) || null;
  }

  /**
   * 释放Web Worker
   * @param {Worker} worker - 要释放的Worker
   */
  releaseWorker(worker) {
    if (worker) {
      worker.isAvailable = true;
    }
  }

  /**
   * 优化图像尺寸
   * @param {HTMLImageElement|HTMLCanvasElement} image - 图像元素
   * @param {Object} options - 优化选项
   * @returns {Promise<HTMLCanvasElement>} 优化后的画布
   */
  async optimizeImageSize(image, options = {}) {
    const {
      maxWidth = this.options.maxImageSize,
      maxHeight = this.options.maxImageSize,
      quality = this.options.compressionQuality,
      format = "image/jpeg",
    } = options;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 计算优化后的尺寸
    const { width, height } = this._calculateOptimalSize(
      image.width || image.naturalWidth,
      image.height || image.naturalHeight,
      maxWidth,
      maxHeight
    );

    canvas.width = width;
    canvas.height = height;

    // 使用高质量缩放
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 绘制优化后的图像
    ctx.drawImage(image, 0, 0, width, height);

    return canvas;
  }

  /**
   * 计算最优尺寸
   * @param {number} originalWidth - 原始宽度
   * @param {number} originalHeight - 原始高度
   * @param {number} maxWidth - 最大宽度
   * @param {number} maxHeight - 最大高度
   * @returns {Object} 优化后的尺寸
   * @private
   */
  _calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // 如果图像超过最大尺寸，按比例缩放
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // 确保不超过任何一个维度的限制
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /**
   * 记录性能指标
   * @param {string} type - 指标类型
   * @param {number} value - 指标值
   */
  recordPerformanceMetric(type, value) {
    if (!this.performanceMetrics[type]) {
      this.performanceMetrics[type] = [];
    }

    this.performanceMetrics[type].push({
      value,
      timestamp: Date.now(),
    });

    // 保持最近100个记录
    if (this.performanceMetrics[type].length > 100) {
      this.performanceMetrics[type].shift();
    }
  }

  /**
   * 获取性能统计
   * @returns {Object} 性能统计信息
   */
  getPerformanceStats() {
    const stats = {};

    Object.keys(this.performanceMetrics).forEach((type) => {
      const metrics = this.performanceMetrics[type];
      if (metrics.length > 0) {
        const values = metrics.map((m) => m.value);
        stats[type] = {
          count: values.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1],
        };
      }
    });

    return stats;
  }

  /**
   * 清理图像缓存
   */
  clearImageCache() {
    this.imageCache.clear();
  }

  /**
   * 销毁内存管理器
   */
  destroy() {
    this.stopMonitoring();
    this.clearImageCache();

    // 终止所有Web Workers
    this.workerPool.forEach((worker) => {
      worker.terminate();
    });
    this.workerPool = [];
  }
}

// 创建全局实例
const memoryManager = new MemoryManager();

export default MemoryManager;
export { memoryManager };
