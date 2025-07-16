import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';
import { errorHandler } from '@/utils/ErrorHandler.js';
import { memoryManager } from '@/utils/MemoryManager.js';

/**
 * Jimp适配器实现
 * 基于Jimp库的图像编辑适配器，专注于纯JavaScript图像处理
 */
class JimpAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'jimp';
    this.jimpInstance = null;
    this.canvas = null;
    this.ctx = null;
    this.originalImageData = null;
    this.stateHistory = new Map();
    this.currentStateId = null;
    this.appliedOperations = []; // 跟踪应用的操作
    this.performanceMetrics = {
      renderTime: 0,
      lastRenderTime: Date.now(),
      operationCount: 0,
      processingTime: 0,
      memoryUsage: 0
    };

    // 注册内存清理回调 - 保存引用以便后续移除
    this._memoryCleanupCallback = this._performMemoryCleanup.bind(this);
    memoryManager.addCleanupCallback(this._memoryCleanupCallback);
  }

  /**
   * 获取默认选项
   * @returns {Object}
   * @protected
   */
  getDefaultOptions() {
    return {
      width: 800,
      height: 600,
      background: '#ffffff'
    };
  }

  /**
   * 执行初始化
   * @returns {Promise<void>}
   * @protected
   */
  async _doInitialize() {
    return this._safeExecute(async () => {
      // 检查Jimp是否已加载
      if (typeof window.Jimp === 'undefined') {
        throw new Error('Jimp library is not loaded');
      }

      // 创建Canvas用于显示
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height = 'auto';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      // 设置背景色
      this.ctx.fillStyle = this.options.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 注册内存使用
      const estimatedSize = 30 * 1024 * 1024; // 估算30MB
      memoryManager.allocate(`jimp-adapter-${this.adapterType}`, this, estimatedSize);

      // 创建初始状态
      this.currentStateId = this._generateStateId();
      this.stateHistory.set(this.currentStateId, this._createEmptyState());
    }, 'initialize', { containerId: this.container.id || 'unknown' });
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    try {
      console.log('JimpAdapter: Starting destruction process...');

      // 清理内存
      this._performMemoryCleanup();

      // 移除内存管理器回调 - 使用保存的引用
      try {
        if (this._memoryCleanupCallback) {
          memoryManager.removeCleanupCallback(this._memoryCleanupCallback);
          this._memoryCleanupCallback = null;
          console.log('JimpAdapter: Memory cleanup callback removed successfully');
        }
      } catch (error) {
        console.warn('JimpAdapter: Failed to remove cleanup callback:', error);
      }

      // 清理Jimp实例
      if (this.jimpInstance) {
        try {
          // 释放Jimp内存
          memoryManager.deallocate(`jimp-adapter-${this.adapterType}`);
          console.log('JimpAdapter: Jimp instance memory deallocated');
        } catch (error) {
          console.warn('JimpAdapter: Failed to deallocate Jimp memory:', error);
        }
        this.jimpInstance = null;
      }

      // 清理Canvas元素
      this._safeDOMCleanup(this.canvas, 'canvas');

      // 安全地清理所有属性
      this.canvas = null;
      this.ctx = null;
      this.originalImageData = null;
      this.currentStateId = null;

      // 安全地清理状态历史
      this._safeCollectionCleanup(this.stateHistory, 'stateHistory');
      this.stateHistory = null;

      // 安全地清理操作历史
      this._safeArrayCleanup(this.appliedOperations, 'appliedOperations');
      this.appliedOperations = null;

      console.log('JimpAdapter: Destruction completed successfully');

    } catch (error) {
      console.error('JimpAdapter: Error during destruction:', error);
      // 即使出错也要确保基本清理
      this.jimpInstance = null;
      this.canvas = null;
      this.ctx = null;
      this.originalImageData = null;
      this.stateHistory = null;
      this.currentStateId = null;
      this.appliedOperations = null;
    }
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    return this._safeExecute(async () => {
      // 验证图像数据
      this._validateImageData(imageData);

      return new Promise((resolve, reject) => {
        const startTime = Date.now();

        window.Jimp.read(imageData.src)
          .then(jimpImage => {
            this.jimpInstance = jimpImage;

            // 保存原始数据
            this.originalImageData = {
              src: imageData.src,
              type: imageData.type || 'url',
              timestamp: Date.now(),
              width: jimpImage.getWidth(),
              height: jimpImage.getHeight()
            };

            // 清空操作历史
            this.appliedOperations = [];

            // 渲染到Canvas
            this._renderToCanvas();

            // 创建新的状态
            this.currentStateId = this._generateStateId();
            const state = this._createCurrentState();
            this.stateHistory.set(this.currentStateId, state);

            this.performanceMetrics.processingTime = Date.now() - startTime;
            this._updatePerformanceMetrics();
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      });
    }, 'loadImage', { src: imageData.src });
  }

  /**
   * 调整图像大小
   * @param {number} width - 新宽度
   * @param {number} height - 新高度
   * @returns {Promise<void>}
   * @protected
   */
  async _doResize(width, height) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    this.jimpInstance.resize(width, height);
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 裁剪图像
   * @param {number} x - 裁剪起始X坐标
   * @param {number} y - 裁剪起始Y坐标
   * @param {number} width - 裁剪宽度
   * @param {number} height - 裁剪高度
   * @returns {Promise<void>}
   * @protected
   */
  async _doCrop(x, y, width, height) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    this.jimpInstance.crop(x, y, width, height);
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 旋转图像
   * @param {number} angle - 旋转角度（度）
   * @returns {Promise<void>}
   * @protected
   */
  async _doRotate(angle) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    // Jimp的旋转是顺时针的，且只支持90度的倍数
    // 这里简化处理，取最接近的90度倍数
    const normalizedAngle = Math.round(angle / 90) * 90;
    this.jimpInstance.rotate(normalizedAngle);
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 翻转图像
   * @param {boolean} horizontal - 是否水平翻转
   * @param {boolean} vertical - 是否垂直翻转
   * @returns {Promise<void>}
   * @protected
   */
  async _doFlip(horizontal, vertical) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    if (horizontal) {
      this.jimpInstance.flip(true, false);
    }
    
    if (vertical) {
      this.jimpInstance.flip(false, true);
    }
    
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 设置亮度
   * @param {number} value - 亮度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetBrightness(value) {
    return this._safeExecute(async () => {
      if (!this.jimpInstance) {
        throw new Error('No Jimp instance');
      }

      // 验证亮度值
      value = Math.max(-1, Math.min(1, value));

      const startTime = Date.now();

      // Jimp的亮度范围是-1到1
      this.jimpInstance.brightness(value);
      this._renderToCanvas();

      // 记录操作
      this._recordOperation('brightness', { value });

      this.performanceMetrics.processingTime = Date.now() - startTime;
      this._updatePerformanceMetrics();
    }, 'setBrightness', { value });
  }

  /**
   * 设置对比度
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    return this._safeExecute(async () => {
      if (!this.jimpInstance) {
        throw new Error('No Jimp instance');
      }

      // 验证对比度值
      value = Math.max(-1, Math.min(1, value));

      const startTime = Date.now();

      // Jimp的对比度范围是-1到1
      this.jimpInstance.contrast(value);
      this._renderToCanvas();

      // 记录操作
      this._recordOperation('contrast', { value });

      this.performanceMetrics.processingTime = Date.now() - startTime;
      this._updatePerformanceMetrics();
    }, 'setContrast', { value });
  }

  /**
   * 应用滤镜
   * @param {string} filterType - 滤镜类型
   * @param {Object} options - 滤镜选项
   * @returns {Promise<void>}
   * @protected
   */
  async _doApplyFilter(filterType, options = {}) {
    return this._safeExecute(async () => {
      if (!this.jimpInstance) {
        throw new Error('No Jimp instance');
      }

      const startTime = Date.now();

      switch (filterType.toLowerCase()) {
        case 'grayscale':
          this.jimpInstance.greyscale();
          break;
        case 'sepia':
          this.jimpInstance.sepia();
          break;
        case 'blur':
          const radius = options.blur || options.radius || 5;
          this.jimpInstance.blur(radius);
          break;
        case 'invert':
          this.jimpInstance.invert();
          break;
        case 'posterize':
          const levels = options.levels || 5;
          this.jimpInstance.posterize(levels);
          break;
        case 'pixelate':
          const size = options.size || 10;
          this.jimpInstance.pixelate(size);
          break;
        case 'dither':
          this.jimpInstance.dither565();
          break;
        default:
          console.warn(`Unsupported filter type: ${filterType}. Supported: grayscale, sepia, blur, invert, posterize, pixelate, dither`);
          return;
      }

      this._renderToCanvas();

      // 记录操作
      this._recordOperation('filter', { type: filterType, options });

      this.performanceMetrics.processingTime = Date.now() - startTime;
      this._updatePerformanceMetrics();
    }, 'applyFilter', { filterType, options });
  }

  /**
   * 移除滤镜（通过重新应用操作历史实现）
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   * @protected
   */
  async _doRemoveFilter(filterType) {
    return this._safeExecute(async () => {
      if (!this.jimpInstance || !this.originalImageData) {
        throw new Error('No Jimp instance or original image data');
      }

      // 从操作历史中移除指定滤镜
      this.appliedOperations = this.appliedOperations.filter(op =>
        !(op.type === 'filter' && op.params.type === filterType)
      );

      // 重新加载原始图像并重新应用操作
      await this._reapplyOperations();
    }, 'removeFilter', { filterType });
  }

  /**
   * 设置缩放（Jimp不支持直接缩放，使用resize代替）
   * @param {number} scaleX - X轴缩放
   * @param {number} scaleY - Y轴缩放
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetScale(scaleX, scaleY) {
    if (!this.jimpInstance || !this.originalImageData) {
      throw new Error('No Jimp instance or original image data');
    }

    const startTime = Date.now();
    
    const newWidth = Math.round(this.originalImageData.width * scaleX);
    const newHeight = Math.round(this.originalImageData.height * scaleY);
    
    this.jimpInstance.resize(newWidth, newHeight);
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 设置位置（Jimp不支持位置设置，这是显示层面的操作）
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetPosition(x, y) {
    // Jimp不支持位置设置，这里只更新渲染位置
    this._renderToCanvas(x, y);
    this._updatePerformanceMetrics();
  }

  /**
   * 选择对象（Jimp不支持对象操作）
   * @protected
   */
  _doSelect() {
    // Jimp不支持对象操作
  }

  /**
   * 取消选择（Jimp不支持对象操作）
   * @protected
   */
  _doDeselect() {
    // Jimp不支持对象操作
  }

  /**
   * 保存当前状态
   * @returns {Object}
   * @protected
   */
  _doSaveState() {
    return this._safeExecute(() => {
      if (!this.jimpInstance) {
        return this._createEmptyState();
      }

      const stateId = this._generateStateId();
      const state = this._createCurrentState();

      // 保存到历史记录
      this.stateHistory.set(stateId, state);
      this.currentStateId = stateId;

      // 限制历史记录数量
      this._limitStateHistory();

      return stateId;
    }, 'saveState');
  }

  /**
   * 恢复状态
   * @param {string} stateId - 状态ID
   * @returns {Promise<void>}
   * @protected
   */
  async _doRestoreState(stateId) {
    return this._safeExecute(async () => {
      const state = this.stateHistory.get(stateId);
      if (!state) {
        throw new Error(`State not found: ${stateId}`);
      }

      if (!state.buffer) {
        throw new Error(`Invalid state data: ${stateId}`);
      }

      // 创建新的Jimp实例
      const jimpImage = await window.Jimp.create(state.width, state.height);

      // 复制Buffer数据
      jimpImage.bitmap.data.set(state.buffer);

      this.jimpInstance = jimpImage;

      // 恢复其他状态信息
      if (state.originalImageData) {
        this.originalImageData = { ...state.originalImageData };
      }

      if (state.appliedOperations) {
        this.appliedOperations = [...state.appliedOperations];
      }

      this._renderToCanvas();
      this.currentStateId = stateId;
      this._updatePerformanceMetrics();
    }, 'restoreState', { stateId });
  }

  /**
   * 重置到初始状态
   * @returns {Promise<void>}
   * @protected
   */
  async _doReset() {
    if (this.originalImageData) {
      await this._doLoadImage(this.originalImageData);
    }
  }

  /**
   * 导出为DataURL
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<string>}
   * @protected
   */
  async _doToDataURL(type = 'image/png', quality = 0.9) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    // 使用Canvas导出
    return this.canvas.toDataURL(type, quality);
  }

  /**
   * 导出为Blob
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<Blob>}
   * @protected
   */
  async _doToBlob(type = 'image/png', quality = 0.9) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }

  /**
   * 获取性能指标
   * @returns {Object}
   * @protected
   */
  _doGetPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      jimpReady: !!this.jimpInstance,
      imageSize: this.jimpInstance ? {
        width: this.jimpInstance.getWidth(),
        height: this.jimpInstance.getHeight()
      } : null
    };
  }

  // ========== Jimp特有方法 ==========

  /**
   * 批量处理图像
   * @param {Array} operations - 操作数组
   * @returns {Promise<void>}
   */
  async processImage(operations) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    for (const op of operations) {
      switch (op.type) {
        case 'resize':
          this.jimpInstance.resize(op.width, op.height);
          break;
        case 'crop':
          this.jimpInstance.crop(op.x, op.y, op.width, op.height);
          break;
        case 'rotate':
          this.jimpInstance.rotate(op.angle);
          break;
        case 'brightness':
          this.jimpInstance.brightness(op.value);
          break;
        case 'contrast':
          this.jimpInstance.contrast(op.value);
          break;
        case 'greyscale':
          this.jimpInstance.greyscale();
          break;
        case 'invert':
          this.jimpInstance.invert();
          break;
        case 'blur':
          this.jimpInstance.blur(op.radius || 5);
          break;
        default:
          console.warn(`Unsupported operation: ${op.type}`);
      }
    }
    
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  // ========== 私有辅助方法 ==========

  /**
   * 渲染Jimp图像到Canvas
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @private
   */
  _renderToCanvas(x = 0, y = 0) {
    if (!this.jimpInstance || !this.canvas || !this.ctx) {
      return;
    }

    // 清除Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 获取Jimp图像数据
    const imageData = new ImageData(
      new Uint8ClampedArray(this.jimpInstance.bitmap.data),
      this.jimpInstance.getWidth(),
      this.jimpInstance.getHeight()
    );
    
    // 创建临时Canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);
    
    // 绘制到主Canvas
    this.ctx.drawImage(tempCanvas, x, y);
  }

  /**
   * 更新性能指标
   * @private
   */
  _updatePerformanceMetrics() {
    const now = Date.now();
    this.performanceMetrics.renderTime = now - this.performanceMetrics.lastRenderTime;
    this.performanceMetrics.lastRenderTime = now;
    this.performanceMetrics.operationCount++;
  }

  /**
   * 记录操作到历史
   * @param {string} type - 操作类型
   * @param {Object} params - 操作参数
   * @private
   */
  _recordOperation(type, params) {
    this.appliedOperations.push({
      type,
      params,
      timestamp: Date.now()
    });
  }

  /**
   * 重新应用所有操作
   * @returns {Promise<void>}
   * @private
   */
  async _reapplyOperations() {
    if (!this.originalImageData) {
      return;
    }

    // 重新加载原始图像
    const jimpImage = await window.Jimp.read(this.originalImageData.src);
    this.jimpInstance = jimpImage;

    // 重新应用所有操作
    for (const operation of this.appliedOperations) {
      try {
        switch (operation.type) {
          case 'brightness':
            this.jimpInstance.brightness(operation.params.value);
            break;
          case 'contrast':
            this.jimpInstance.contrast(operation.params.value);
            break;
          case 'filter':
            await this._applyFilterOperation(operation.params.type, operation.params.options);
            break;
          case 'resize':
            this.jimpInstance.resize(operation.params.width, operation.params.height);
            break;
          case 'rotate':
            this.jimpInstance.rotate(operation.params.angle);
            break;
          case 'flip':
            this.jimpInstance.flip(operation.params.horizontal, operation.params.vertical);
            break;
          default:
            console.warn(`Unknown operation type: ${operation.type}`);
        }
      } catch (error) {
        console.error(`Failed to reapply operation ${operation.type}:`, error);
      }
    }

    this._renderToCanvas();
  }

  /**
   * 应用滤镜操作（内部方法）
   * @param {string} filterType - 滤镜类型
   * @param {Object} options - 滤镜选项
   * @private
   */
  async _applyFilterOperation(filterType, options = {}) {
    switch (filterType.toLowerCase()) {
      case 'grayscale':
        this.jimpInstance.greyscale();
        break;
      case 'sepia':
        this.jimpInstance.sepia();
        break;
      case 'blur':
        const radius = options.blur || options.radius || 5;
        this.jimpInstance.blur(radius);
        break;
      case 'invert':
        this.jimpInstance.invert();
        break;
      case 'posterize':
        const levels = options.levels || 5;
        this.jimpInstance.posterize(levels);
        break;
      case 'pixelate':
        const size = options.size || 10;
        this.jimpInstance.pixelate(size);
        break;
      case 'dither':
        this.jimpInstance.dither565();
        break;
    }
  }

  /**
   * 创建空状态
   * @returns {Object}
   * @private
   */
  _createEmptyState() {
    return {
      id: this._generateStateId(),
      timestamp: Date.now(),
      buffer: null,
      width: 0,
      height: 0,
      originalImageData: null,
      appliedOperations: []
    };
  }

  /**
   * 创建当前状态
   * @returns {Object}
   * @private
   */
  _createCurrentState() {
    try {
      if (!this.jimpInstance) {
        return this._createEmptyState();
      }

      // 获取当前图像的Buffer
      const buffer = this.jimpInstance.bitmap.data;

      return {
        id: this._generateStateId(),
        timestamp: Date.now(),
        buffer: buffer.slice(0), // 复制Buffer
        width: this.jimpInstance.getWidth(),
        height: this.jimpInstance.getHeight(),
        originalImageData: this.originalImageData ? { ...this.originalImageData } : null,
        appliedOperations: [...this.appliedOperations]
      };
    } catch (error) {
      console.warn('Failed to create current state:', error);
      return this._createEmptyState();
    }
  }

  /**
   * 限制状态历史数量
   * @private
   */
  _limitStateHistory() {
    const maxStates = 20; // 最多保存20个状态（Jimp状态较大）
    if (this.stateHistory.size > maxStates) {
      const entries = Array.from(this.stateHistory.entries());
      const toDelete = entries.slice(0, this.stateHistory.size - maxStates);

      toDelete.forEach(([stateId]) => {
        this.stateHistory.delete(stateId);
      });
    }
  }

  /**
   * 执行内存清理
   * @private
   */
  _performMemoryCleanup() {
    try {
      // 检查适配器是否已被销毁
      if (!this.stateHistory || !this.appliedOperations) {
        console.log('JimpAdapter: Adapter already destroyed, skipping memory cleanup');
        return;
      }

      // 安全清理状态历史
      if (this.stateHistory && typeof this.stateHistory.size === 'number' && this.stateHistory.size > 10) {
        try {
          const entries = Array.from(this.stateHistory.entries());
          const toDelete = entries.slice(0, this.stateHistory.size - 10);

          toDelete.forEach(([stateId]) => {
            if (this.stateHistory && typeof this.stateHistory.delete === 'function') {
              this.stateHistory.delete(stateId);
            }
          });

          console.log(`JimpAdapter: Cleaned up ${toDelete.length} old state entries`);
        } catch (error) {
          console.warn('JimpAdapter: Failed to cleanup state history:', error);
        }
      }

      // 安全清理操作历史
      if (Array.isArray(this.appliedOperations) && this.appliedOperations.length > 50) {
        try {
          const originalLength = this.appliedOperations.length;
          this.appliedOperations = this.appliedOperations.slice(-30);
          console.log(`JimpAdapter: Cleaned up ${originalLength - this.appliedOperations.length} old operations`);
        } catch (error) {
          console.warn('JimpAdapter: Failed to cleanup operations history:', error);
        }
      }

      // 强制垃圾回收（如果可用）
      if (window.gc) {
        try {
          window.gc();
        } catch (error) {
          console.warn('JimpAdapter: Failed to trigger garbage collection:', error);
        }
      }

      console.log('JimpAdapter: Memory cleanup completed successfully');

    } catch (error) {
      console.error('JimpAdapter: Critical error during memory cleanup:', error);
      // 即使出错也不抛出异常，避免影响其他清理操作
    }
  }
}

export default JimpAdapter;
