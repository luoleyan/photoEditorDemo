import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';
import { errorHandler } from '@/utils/ErrorHandler.js';
import { memoryManager } from '@/utils/MemoryManager.js';

/**
 * Cropper.js适配器实现
 * 基于Cropper.js库的图像编辑适配器，专注于专业的图像裁剪功能
 * 通过Canvas API扩展支持基础图像调整功能
 */
class CropperAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'cropper';
    this.imageElement = null;
    this.cropper = null;
    this.originalImageData = null;
    this.isCropping = false;
    this.stateHistory = new Map();
    this.currentStateId = null;
    this.canvasElement = null; // 用于图像处理的Canvas
    this.canvasContext = null;
    this.imageAdjustments = { // 当前图像调整参数
      brightness: 0,
      contrast: 0,
      filters: new Map()
    };
    this.performanceMetrics = {
      renderTime: 0,
      lastRenderTime: Date.now(),
      operationCount: 0,
      memoryUsage: 0
    };

    // 注册内存清理回调
    memoryManager.addCleanupCallback(() => {
      this._performMemoryCleanup();
    });
  }

  /**
   * 获取默认选项
   * @returns {Object}
   * @protected
   */
  getDefaultOptions() {
    return {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      modal: true,
      guides: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      responsive: true,
      checkCrossOrigin: true
    };
  }

  /**
   * 执行初始化
   * @returns {Promise<void>}
   * @protected
   */
  async _doInitialize() {
    return this._safeExecute(async () => {
      // 检查Cropper是否已加载
      if (typeof window.Cropper === 'undefined') {
        throw new Error('Cropper.js library is not loaded');
      }

      // 创建图像元素
      this.imageElement = document.createElement('img');
      this.imageElement.style.maxWidth = '100%';
      this.imageElement.style.height = 'auto';
      this.container.appendChild(this.imageElement);

      // 创建用于图像处理的Canvas
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.style.display = 'none';
      this.container.appendChild(this.canvasElement);
      this.canvasContext = this.canvasElement.getContext('2d');

      // 注册内存使用
      const estimatedSize = 20 * 1024 * 1024; // 估算20MB
      memoryManager.allocate(`cropper-adapter-${this.adapterType}`, this, estimatedSize);

      // 设置事件监听
      this._setupEventListeners();

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
    // 清理内存
    this._performMemoryCleanup();

    // 移除内存管理器回调
    memoryManager.removeCleanupCallback(this._performMemoryCleanup.bind(this));

    if (this.cropper) {
      // 释放Cropper内存
      memoryManager.deallocate(`cropper-adapter-${this.adapterType}`);
      this.cropper.destroy();
      this.cropper = null;
    }

    if (this.imageElement && this.imageElement.parentNode) {
      this.imageElement.parentNode.removeChild(this.imageElement);
    }
    this.imageElement = null;

    if (this.canvasElement && this.canvasElement.parentNode) {
      this.canvasElement.parentNode.removeChild(this.canvasElement);
    }
    this.canvasElement = null;
    this.canvasContext = null;

    this.originalImageData = null;
    this.isCropping = false;
    this.stateHistory.clear();
    this.currentStateId = null;
    this.imageAdjustments = {
      brightness: 0,
      contrast: 0,
      filters: new Map()
    };
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    return new Promise((resolve, reject) => {
      // 如果已有cropper实例，先销毁
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }

      // 设置图像源
      this.imageElement.src = imageData.src;
      
      this.imageElement.onload = () => {
        try {
          // 创建Cropper实例
          this.cropper = new window.Cropper(this.imageElement, {
            ...this.options,
            ready: () => {
              this.isCropping = true;
              this._updatePerformanceMetrics();
              resolve();
            },
            crop: (event) => {
              this.emit('crop-change', event.detail);
            }
          });

          // 保存原始数据
          this.originalImageData = {
            src: imageData.src,
            width: this.imageElement.naturalWidth,
            height: this.imageElement.naturalHeight
          };

        } catch (error) {
          reject(error);
        }
      };

      this.imageElement.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  }

  /**
   * 调整图像大小
   * @param {number} width - 新宽度
   * @param {number} height - 新高度
   * @returns {Promise<void>}
   * @protected
   */
  async _doResize(width, height) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    // Cropper.js通过容器大小调整来实现resize
    this.cropper.resize();
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
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    this.cropper.setData({
      x: x,
      y: y,
      width: width,
      height: height
    });

    this._updatePerformanceMetrics();
  }

  /**
   * 旋转图像
   * @param {number} angle - 旋转角度（度）
   * @returns {Promise<void>}
   * @protected
   */
  async _doRotate(angle) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    this.cropper.rotateTo(angle);
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
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    if (horizontal) {
      this.cropper.scaleX(-this.cropper.getImageData().scaleX);
    }

    if (vertical) {
      this.cropper.scaleY(-this.cropper.getImageData().scaleY);
    }

    this._updatePerformanceMetrics();
  }

  /**
   * 设置亮度（通过Canvas API实现）
   * @param {number} value - 亮度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetBrightness(value) {
    return this._safeExecute(async () => {
      if (!this.cropper || !this.canvasContext) {
        throw new Error('No cropper or canvas context available');
      }

      // 验证亮度值
      value = Math.max(-1, Math.min(1, value));
      this.imageAdjustments.brightness = value;

      // 应用图像调整
      await this._applyImageAdjustments();
      this._updatePerformanceMetrics();
    }, 'setBrightness', { value });
  }

  /**
   * 设置对比度（通过Canvas API实现）
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    return this._safeExecute(async () => {
      if (!this.cropper || !this.canvasContext) {
        throw new Error('No cropper or canvas context available');
      }

      // 验证对比度值
      value = Math.max(-1, Math.min(1, value));
      this.imageAdjustments.contrast = value;

      // 应用图像调整
      await this._applyImageAdjustments();
      this._updatePerformanceMetrics();
    }, 'setContrast', { value });
  }

  /**
   * 应用滤镜（通过Canvas API实现基础滤镜）
   * @param {string} filterType - 滤镜类型
   * @param {Object} options - 滤镜选项
   * @returns {Promise<void>}
   * @protected
   */
  async _doApplyFilter(filterType, options = {}) {
    return this._safeExecute(async () => {
      if (!this.cropper || !this.canvasContext) {
        throw new Error('No cropper or canvas context available');
      }

      // 支持的滤镜类型
      const supportedFilters = ['grayscale', 'sepia', 'blur', 'invert'];
      if (!supportedFilters.includes(filterType)) {
        console.warn(`Unsupported filter type: ${filterType}. Supported: ${supportedFilters.join(', ')}`);
        return;
      }

      // 保存滤镜设置
      this.imageAdjustments.filters.set(filterType, options);

      // 应用图像调整
      await this._applyImageAdjustments();
      this._updatePerformanceMetrics();
    }, 'applyFilter', { filterType, options });
  }

  /**
   * 移除滤镜
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   * @protected
   */
  async _doRemoveFilter(filterType) {
    return this._safeExecute(async () => {
      if (!this.cropper || !this.canvasContext) {
        throw new Error('No cropper or canvas context available');
      }

      // 移除滤镜设置
      this.imageAdjustments.filters.delete(filterType);

      // 重新应用图像调整
      await this._applyImageAdjustments();
      this._updatePerformanceMetrics();
    }, 'removeFilter', { filterType });
  }

  /**
   * 设置缩放
   * @param {number} scaleX - X轴缩放
   * @param {number} scaleY - Y轴缩放
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetScale(scaleX, scaleY) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    this.cropper.scaleX(scaleX);
    this.cropper.scaleY(scaleY);
    this._updatePerformanceMetrics();
  }

  /**
   * 设置位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetPosition(x, y) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    this.cropper.moveTo(x, y);
    this._updatePerformanceMetrics();
  }

  /**
   * 选择对象
   * @protected
   */
  _doSelect() {
    if (this.cropper) {
      this.cropper.setDragMode('move');
    }
  }

  /**
   * 取消选择
   * @protected
   */
  _doDeselect() {
    if (this.cropper) {
      this.cropper.setDragMode('none');
    }
  }

  /**
   * 保存当前状态
   * @returns {Object}
   * @protected
   */
  _doSaveState() {
    return this._safeExecute(() => {
      if (!this.cropper) {
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

      if (!this.cropper) {
        throw new Error('No cropper instance');
      }

      // 恢复Cropper数据
      if (state.cropData) {
        this.cropper.setData(state.cropData);
      }
      if (state.canvasData) {
        this.cropper.setCanvasData(state.canvasData);
      }
      if (state.cropBoxData) {
        this.cropper.setCropBoxData(state.cropBoxData);
      }

      // 恢复图像调整参数
      if (state.imageAdjustments) {
        this.imageAdjustments = { ...state.imageAdjustments };
        this.imageAdjustments.filters = new Map(state.imageAdjustments.filters || []);
        await this._applyImageAdjustments();
      }

      // 恢复其他状态信息
      if (state.originalImageData) {
        this.originalImageData = { ...state.originalImageData };
      }

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
    if (this.cropper) {
      this.cropper.reset();
      this._updatePerformanceMetrics();
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
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    const canvas = this.cropper.getCroppedCanvas();
    return canvas.toDataURL(type, quality);
  }

  /**
   * 导出为Blob
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<Blob>}
   * @protected
   */
  async _doToBlob(type = 'image/png', quality = 0.9) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    return new Promise((resolve) => {
      const canvas = this.cropper.getCroppedCanvas();
      canvas.toBlob(resolve, type, quality);
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
      isCropping: this.isCropping,
      cropperReady: !!this.cropper,
      imageSize: this.originalImageData ? {
        width: this.originalImageData.width,
        height: this.originalImageData.height
      } : null
    };
  }

  // ========== Cropper.js特有方法 ==========

  /**
   * 开始裁剪
   * @param {Object} options - 裁剪选项
   * @returns {Promise<void>}
   */
  async startCropping(options = {}) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    this.cropper.setDragMode('crop');
    this.isCropping = true;
    this.emit('crop-start', options);
  }

  /**
   * 设置裁剪宽高比
   * @param {number|null} ratio - 宽高比，null表示自由裁剪
   */
  setCropAspectRatio(ratio) {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    this.cropper.setAspectRatio(ratio || NaN);
  }

  /**
   * 获取裁剪数据
   * @returns {Object} 裁剪数据
   */
  getCropData() {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    return this.cropper.getData();
  }

  /**
   * 应用裁剪
   * @returns {Promise<void>}
   */
  async applyCrop() {
    if (!this.cropper) {
      throw new Error('No cropper instance');
    }

    const croppedCanvas = this.cropper.getCroppedCanvas();
    const dataURL = croppedCanvas.toDataURL();
    
    // 重新加载裁剪后的图像
    await this._doLoadImage({ src: dataURL });
    
    this.emit('crop-applied', { dataURL });
  }

  /**
   * 取消裁剪
   */
  cancelCrop() {
    if (this.cropper) {
      this.cropper.clear();
      this.isCropping = false;
      this.emit('crop-cancelled');
    }
  }

  // ========== 私有辅助方法 ==========

  /**
   * 设置事件监听
   * @private
   */
  _setupEventListeners() {
    // 这里可以添加更多的事件监听
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
   * 应用图像调整（通过Canvas API）
   * @returns {Promise<void>}
   * @private
   */
  async _applyImageAdjustments() {
    if (!this.cropper || !this.canvasContext || !this.originalImageData) {
      return;
    }

    try {
      // 获取当前图像
      const canvas = this.cropper.getCroppedCanvas() || this.cropper.getCanvasData();
      if (!canvas) return;

      // 设置Canvas尺寸
      const imageData = this.cropper.getImageData();
      this.canvasElement.width = imageData.naturalWidth;
      this.canvasElement.height = imageData.naturalHeight;

      // 绘制原始图像
      const img = new Image();
      img.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // 清除Canvas
            this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

            // 应用滤镜
            this._applyCanvasFilters();

            // 绘制图像
            this.canvasContext.drawImage(img, 0, 0);

            // 应用亮度和对比度调整
            this._applyBrightnessContrast();

            // 更新Cropper图像
            const adjustedDataURL = this.canvasElement.toDataURL();
            this.imageElement.src = adjustedDataURL;

            resolve();
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = reject;
        img.src = this.originalImageData.src;
      });
    } catch (error) {
      console.error('Failed to apply image adjustments:', error);
    }
  }

  /**
   * 应用Canvas滤镜
   * @private
   */
  _applyCanvasFilters() {
    const filters = [];

    // 构建滤镜字符串
    this.imageAdjustments.filters.forEach((options, filterType) => {
      switch (filterType) {
        case 'grayscale':
          filters.push('grayscale(100%)');
          break;
        case 'sepia':
          filters.push('sepia(100%)');
          break;
        case 'blur':
          const blurAmount = options.amount || 5;
          filters.push(`blur(${blurAmount}px)`);
          break;
        case 'invert':
          filters.push('invert(100%)');
          break;
      }
    });

    // 应用滤镜
    if (filters.length > 0) {
      this.canvasContext.filter = filters.join(' ');
    } else {
      this.canvasContext.filter = 'none';
    }
  }

  /**
   * 应用亮度和对比度调整
   * @private
   */
  _applyBrightnessContrast() {
    if (this.imageAdjustments.brightness === 0 && this.imageAdjustments.contrast === 0) {
      return;
    }

    const imageData = this.canvasContext.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
    const data = imageData.data;

    const brightness = this.imageAdjustments.brightness * 255;
    const contrast = (this.imageAdjustments.contrast + 1) * (this.imageAdjustments.contrast + 1);

    for (let i = 0; i < data.length; i += 4) {
      // 应用亮度
      data[i] += brightness;     // Red
      data[i + 1] += brightness; // Green
      data[i + 2] += brightness; // Blue

      // 应用对比度
      data[i] = ((data[i] / 255 - 0.5) * contrast + 0.5) * 255;
      data[i + 1] = ((data[i + 1] / 255 - 0.5) * contrast + 0.5) * 255;
      data[i + 2] = ((data[i + 2] / 255 - 0.5) * contrast + 0.5) * 255;

      // 确保值在有效范围内
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }

    this.canvasContext.putImageData(imageData, 0, 0);
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
      cropData: null,
      imageData: null,
      canvasData: null,
      cropBoxData: null,
      originalImageData: null,
      imageAdjustments: {
        brightness: 0,
        contrast: 0,
        filters: []
      }
    };
  }

  /**
   * 创建当前状态
   * @returns {Object}
   * @private
   */
  _createCurrentState() {
    try {
      return {
        id: this._generateStateId(),
        timestamp: Date.now(),
        cropData: this.cropper ? this.cropper.getData() : null,
        imageData: this.cropper ? this.cropper.getImageData() : null,
        canvasData: this.cropper ? this.cropper.getCanvasData() : null,
        cropBoxData: this.cropper ? this.cropper.getCropBoxData() : null,
        originalImageData: this.originalImageData ? { ...this.originalImageData } : null,
        imageAdjustments: {
          brightness: this.imageAdjustments.brightness,
          contrast: this.imageAdjustments.contrast,
          filters: Array.from(this.imageAdjustments.filters.entries())
        }
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
    const maxStates = 30; // 最多保存30个状态
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
    // 清理状态历史
    if (this.stateHistory.size > 15) {
      const entries = Array.from(this.stateHistory.entries());
      const toDelete = entries.slice(0, this.stateHistory.size - 15);

      toDelete.forEach(([stateId]) => {
        this.stateHistory.delete(stateId);
      });
    }

    // 清理Canvas
    if (this.canvasContext) {
      this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }
  }
}

export default CropperAdapter;
