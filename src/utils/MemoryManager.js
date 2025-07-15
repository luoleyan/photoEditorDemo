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
      ...options
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

    // 开始监控
    if (this.options.enableAutoCleanup) {
      this.startMonitoring();
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
    document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
    
    // 监听内存压力事件（如果支持）
    if ('memory' in performance) {
      this._monitorMemoryPressure();
    }

    console.log('内存监控已启动');
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

    document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this));

    console.log('内存监控已停止');
  }

  /**
   * 分配内存对象
   * @param {string} id - 对象ID
   * @param {Object} object - 要跟踪的对象
   * @param {number} estimatedSize - 估算大小（字节）
   */
  allocate(id, object, estimatedSize = 0) {
    if (this.allocatedObjects.has(id)) {
      console.warn(`对象 ${id} 已存在，将被替换`);
      this.deallocate(id);
    }

    const allocation = {
      object,
      size: estimatedSize,
      timestamp: Date.now(),
      type: this._getObjectType(object)
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
      warningThreshold: this.options.maxMemoryUsage * this.options.warningThreshold,
      usagePercentage: (this.memoryUsage / this.options.maxMemoryUsage) * 100,
      
      // 状态
      isNearLimit: this.memoryUsage > (this.options.maxMemoryUsage * this.options.warningThreshold),
      isOverLimit: this.memoryUsage > this.options.maxMemoryUsage
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
        timestamp: allocation.timestamp
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
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.name.includes('memory')) {
              console.log('内存性能指标:', entry);
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('无法初始化性能观察器:', error);
      }
    }
  }

  /**
   * 监控内存压力
   * @private
   */
  _monitorMemoryPressure() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memInfo = performance.memory;
        const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        if (usageRatio > 0.9) {
          console.warn('检测到高内存使用率:', usageRatio);
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
    
    // 执行注册的清理回调
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('清理回调执行失败:', error);
      }
    });

    // 清理过期对象
    this._cleanupExpiredObjects();

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }

    const afterCleanup = this.memoryUsage;
    const freed = beforeCleanup - afterCleanup;
    
    if (freed > 0) {
      console.log(`内存清理完成，释放了 ${this._formatBytes(freed)}`);
    }
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

    toDelete.forEach(id => this.deallocate(id));
  }

  /**
   * 检查内存使用情况
   * @private
   */
  _checkMemoryUsage() {
    const usage = this.getMemoryUsage();
    
    if (usage.isOverLimit) {
      console.error('内存使用超出限制!', usage);
      this._performCleanup();
    } else if (usage.isNearLimit) {
      console.warn('内存使用接近限制', usage);
    }
  }

  /**
   * 处理页面可见性变化
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      // 页面隐藏时执行清理
      this._performCleanup();
    }
  }

  /**
   * 获取对象类型
   * @param {*} object - 对象
   * @returns {string} 对象类型
   * @private
   */
  _getObjectType(object) {
    if (object instanceof HTMLCanvasElement) return 'canvas';
    if (object instanceof HTMLImageElement) return 'image';
    if (object instanceof Blob) return 'blob';
    if (object instanceof ArrayBuffer) return 'arraybuffer';
    if (Array.isArray(object)) return 'array';
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
        const ctx = object.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, object.width, object.height);
        }
        object.width = 0;
        object.height = 0;
      } else if (object instanceof HTMLImageElement) {
        object.src = '';
      } else if (typeof object === 'object' && object !== null) {
        // 清理对象属性
        Object.keys(object).forEach(key => {
          delete object[key];
        });
      }
    } catch (error) {
      console.warn('清理对象时出错:', error);
    }
  }

  /**
   * 获取浏览器内存信息
   * @returns {Object|null} 浏览器内存信息
   * @private
   */
  _getBrowserMemoryInfo() {
    if ('memory' in performance) {
      const mem = performance.memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
        usagePercentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100
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
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 创建全局实例
const memoryManager = new MemoryManager();

export default MemoryManager;
export { memoryManager };
