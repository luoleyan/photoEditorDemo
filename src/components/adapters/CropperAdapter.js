import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';

/**
 * Cropper.js适配器实现
 * 基于Cropper.js库的图像编辑适配器，专注于专业的图像裁剪功能
 */
class CropperAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'cropper';
    this.imageElement = null;
    this.cropper = null;
    this.originalImageData = null;
    this.isCropping = false;
    this.performanceMetrics = {
      renderTime: 0,
      lastRenderTime: Date.now(),
      operationCount: 0
    };
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
    // 检查Cropper是否已加载
    if (typeof window.Cropper === 'undefined') {
      throw new Error('Cropper.js library is not loaded');
    }

    // 创建图像元素
    this.imageElement = document.createElement('img');
    this.imageElement.style.maxWidth = '100%';
    this.imageElement.style.height = 'auto';
    this.container.appendChild(this.imageElement);

    // 设置事件监听
    this._setupEventListeners();
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    if (this.imageElement && this.imageElement.parentNode) {
      this.imageElement.parentNode.removeChild(this.imageElement);
    }
    this.imageElement = null;
    this.originalImageData = null;
    this.isCropping = false;
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
   * 设置亮度（Cropper.js不支持，抛出错误）
   * @param {number} value - 亮度值
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetBrightness(value) {
    throw new Error('Brightness adjustment is not supported by Cropper.js');
  }

  /**
   * 设置对比度（Cropper.js不支持，抛出错误）
   * @param {number} value - 对比度值
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    throw new Error('Contrast adjustment is not supported by Cropper.js');
  }

  /**
   * 应用滤镜（Cropper.js不支持，抛出错误）
   * @param {string} filterType - 滤镜类型
   * @param {Object} options - 滤镜选项
   * @returns {Promise<void>}
   * @protected
   */
  async _doApplyFilter(filterType, options = {}) {
    throw new Error('Filters are not supported by Cropper.js');
  }

  /**
   * 移除滤镜（Cropper.js不支持，抛出错误）
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   * @protected
   */
  async _doRemoveFilter(filterType) {
    throw new Error('Filters are not supported by Cropper.js');
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
    if (!this.cropper) {
      return { timestamp: Date.now() };
    }

    const state = {
      cropData: this.cropper.getData(),
      imageData: this.cropper.getImageData(),
      canvasData: this.cropper.getCanvasData(),
      cropBoxData: this.cropper.getCropBoxData(),
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
    if (!state || !this.cropper) {
      throw new Error(`State not found or no cropper instance: ${stateId}`);
    }

    // 恢复各种数据
    if (state.cropData) {
      this.cropper.setData(state.cropData);
    }
    if (state.canvasData) {
      this.cropper.setCanvasData(state.canvasData);
    }
    if (state.cropBoxData) {
      this.cropper.setCropBoxData(state.cropBoxData);
    }
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
}

export default CropperAdapter;
