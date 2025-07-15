import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';

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
    this.performanceMetrics = {
      renderTime: 0,
      lastRenderTime: Date.now(),
      operationCount: 0,
      processingTime: 0
    };
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
    // 检查Jimp是否已加载
    if (typeof window.Jimp === 'undefined') {
      throw new Error('Jimp library is not loaded');
    }

    // 创建Canvas用于显示
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // 设置背景色
    this.ctx.fillStyle = this.options.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    this.jimpInstance = null;
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.originalImageData = null;
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      window.Jimp.read(imageData.src)
        .then(jimpImage => {
          this.jimpInstance = jimpImage;
          
          // 保存原始数据
          this.originalImageData = {
            src: imageData.src,
            width: jimpImage.getWidth(),
            height: jimpImage.getHeight()
          };
          
          // 渲染到Canvas
          this._renderToCanvas();
          
          this.performanceMetrics.processingTime = Date.now() - startTime;
          this._updatePerformanceMetrics();
          resolve();
        })
        .catch(error => {
          reject(error);
        });
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
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    // Jimp的亮度范围是-1到1
    this.jimpInstance.brightness(value);
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 设置对比度
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    if (!this.jimpInstance) {
      throw new Error('No Jimp instance');
    }

    const startTime = Date.now();
    
    // Jimp的对比度范围是-1到1
    this.jimpInstance.contrast(value);
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 应用滤镜
   * @param {string} filterType - 滤镜类型
   * @param {Object} options - 滤镜选项
   * @returns {Promise<void>}
   * @protected
   */
  async _doApplyFilter(filterType, options = {}) {
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
        const radius = options.blur || 5;
        this.jimpInstance.blur(radius);
        break;
      case 'invert':
        this.jimpInstance.invert();
        break;
      case 'posterize':
        const levels = options.levels || 5;
        this.jimpInstance.posterize(levels);
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }
    
    this._renderToCanvas();
    
    this.performanceMetrics.processingTime = Date.now() - startTime;
    this._updatePerformanceMetrics();
  }

  /**
   * 移除滤镜（Jimp不支持直接移除滤镜，需要重新加载图像）
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   * @protected
   */
  async _doRemoveFilter(filterType) {
    if (!this.jimpInstance || !this.originalImageData) {
      throw new Error('No Jimp instance or original image data');
    }

    // 重新加载原始图像
    await this._doLoadImage(this.originalImageData);
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
    if (!this.jimpInstance) {
      return { timestamp: Date.now() };
    }

    // 获取当前图像的Buffer
    const buffer = this.jimpInstance.bitmap.data;
    
    const state = {
      buffer: buffer.slice(0), // 复制Buffer
      width: this.jimpInstance.getWidth(),
      height: this.jimpInstance.getHeight(),
      timestamp: Date.now(),
      originalImageData: this.originalImageData ? { ...this.originalImageData } : null
    };
    
    return state;
  }

  /**
   * 恢复状态
   * @param {string} stateId - 状态ID
   * @returns {Promise<void>}
   * @protected
   */
  async _doRestoreState(stateId) {
    const state = this.stateHistory.get(stateId);
    if (!state || !state.buffer) {
      throw new Error(`State not found or invalid: ${stateId}`);
    }

    // 创建新的Jimp实例
    const jimpImage = await window.Jimp.create(state.width, state.height);
    
    // 复制Buffer数据
    jimpImage.bitmap.data.set(state.buffer);
    
    this.jimpInstance = jimpImage;
    this._renderToCanvas();
    this._updatePerformanceMetrics();
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
}

export default JimpAdapter;
