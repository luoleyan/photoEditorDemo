import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';
import { fabric } from 'fabric';

/**
 * Fabric.js适配器实现
 * 基于Fabric.js库的图像编辑适配器
 */
class FabricAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'fabric';
    this.canvas = null;
    this.currentImage = null;
    this.originalImageData = null;
    this.stateHistory = new Map();
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
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
      allowTouchScrolling: false,
      enableRetinaScaling: true
    };
  }

  /**
   * 执行初始化
   * @returns {Promise<void>}
   * @protected
   */
  async _doInitialize() {
    // 创建canvas元素
    const canvasElement = document.createElement('canvas');
    canvasElement.id = `fabric-canvas-${Date.now()}`;
    this.container.appendChild(canvasElement);

    // 初始化Fabric.js Canvas
    this.canvas = new fabric.Canvas(canvasElement, {
      width: this.options.width,
      height: this.options.height,
      backgroundColor: this.options.backgroundColor,
      selection: this.options.selection,
      preserveObjectStacking: this.options.preserveObjectStacking,
      imageSmoothingEnabled: this.options.imageSmoothingEnabled,
      allowTouchScrolling: this.options.allowTouchScrolling,
      enableRetinaScaling: this.options.enableRetinaScaling
    });

    // 设置事件监听
    this._setupEventListeners();

    // 优化性能设置
    this._optimizePerformance();
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.currentImage = null;
    this.originalImageData = null;
    this.stateHistory.clear();
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(imageData.src, (img) => {
        if (!img) {
          reject(new Error('Failed to load image'));
          return;
        }

        // 清除现有内容
        this.canvas.clear();

        // 计算适合画布的尺寸
        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        const imgWidth = img.width;
        const imgHeight = img.height;

        const scaleX = canvasWidth / imgWidth;
        const scaleY = canvasHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

        // 设置图像属性
        img.set({
          left: (canvasWidth - imgWidth * scale) / 2,
          top: (canvasHeight - imgHeight * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true
        });

        // 添加到画布
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();

        // 保存引用和原始数据
        this.currentImage = img;
        this.originalImageData = {
          src: imageData.src,
          width: imgWidth,
          height: imgHeight,
          scale: scale,
          left: img.left,
          top: img.top
        };

        // 更新性能指标
        this._updatePerformanceMetrics();

        resolve();
      }, {
        crossOrigin: 'anonymous'
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
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    const scaleX = width / this.currentImage.width;
    const scaleY = height / this.currentImage.height;

    this.currentImage.set({
      scaleX: scaleX,
      scaleY: scaleY
    });

    this.canvas.renderAll();
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
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    // 创建裁剪矩形
    const clipPath = new fabric.Rect({
      left: x,
      top: y,
      width: width,
      height: height,
      absolutePositioned: true
    });

    this.currentImage.set({
      clipPath: clipPath
    });

    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 旋转图像
   * @param {number} angle - 旋转角度（度）
   * @returns {Promise<void>}
   * @protected
   */
  async _doRotate(angle) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    this.currentImage.set({
      angle: angle
    });

    this.canvas.renderAll();
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
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    if (horizontal) {
      this.currentImage.set({
        flipX: !this.currentImage.flipX
      });
    }

    if (vertical) {
      this.currentImage.set({
        flipY: !this.currentImage.flipY
      });
    }

    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 设置亮度
   * @param {number} value - 亮度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetBrightness(value) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    // 移除现有的亮度滤镜
    this._removeFilterByType('Brightness');

    // 添加新的亮度滤镜
    if (value !== 0) {
      const brightnessFilter = new fabric.Image.filters.Brightness({
        brightness: value
      });
      this.currentImage.filters.push(brightnessFilter);
    }

    this.currentImage.applyFilters();
    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 设置对比度
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    // 移除现有的对比度滤镜
    this._removeFilterByType('Contrast');

    // 添加新的对比度滤镜
    if (value !== 0) {
      const contrastFilter = new fabric.Image.filters.Contrast({
        contrast: value
      });
      this.currentImage.filters.push(contrastFilter);
    }

    this.currentImage.applyFilters();
    this.canvas.renderAll();
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
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    // 移除现有的同类型滤镜
    this._removeFilterByType(filterType);

    // 创建新滤镜
    let filter = null;
    switch (filterType.toLowerCase()) {
      case 'grayscale':
        filter = new fabric.Image.filters.Grayscale();
        break;
      case 'sepia':
        filter = new fabric.Image.filters.Sepia();
        break;
      case 'invert':
        filter = new fabric.Image.filters.Invert();
        break;
      case 'blur':
        filter = new fabric.Image.filters.Blur({
          blur: options.blur || 0.1
        });
        break;
      case 'noise':
        filter = new fabric.Image.filters.Noise({
          noise: options.noise || 100
        });
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }

    if (filter) {
      this.currentImage.filters.push(filter);
      this.currentImage.applyFilters();
      this.canvas.renderAll();
      this._updatePerformanceMetrics();
    }
  }

  /**
   * 移除滤镜
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   * @protected
   */
  async _doRemoveFilter(filterType) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    this._removeFilterByType(filterType);
    this.currentImage.applyFilters();
    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 设置缩放
   * @param {number} scaleX - X轴缩放
   * @param {number} scaleY - Y轴缩放
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetScale(scaleX, scaleY) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    this.currentImage.set({
      scaleX: scaleX,
      scaleY: scaleY
    });

    this.canvas.renderAll();
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
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    this.currentImage.set({
      left: x,
      top: y
    });

    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 选择对象
   * @protected
   */
  _doSelect() {
    if (this.currentImage) {
      this.canvas.setActiveObject(this.currentImage);
      this.canvas.renderAll();
    }
  }

  /**
   * 取消选择
   * @protected
   */
  _doDeselect() {
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  /**
   * 保存当前状态
   * @returns {Object}
   * @protected
   */
  _doSaveState() {
    const state = {
      canvasState: JSON.stringify(this.canvas.toJSON()),
      timestamp: Date.now(),
      imageData: this.originalImageData ? { ...this.originalImageData } : null
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
    if (!state) {
      throw new Error(`State not found: ${stateId}`);
    }

    return new Promise((resolve, reject) => {
      this.canvas.loadFromJSON(state.canvasState, () => {
        this.canvas.renderAll();
        
        // 重新获取当前图像引用
        const objects = this.canvas.getObjects();
        this.currentImage = objects.find(obj => obj.type === 'image') || null;
        
        resolve();
      }, (o, object) => {
        // 对象加载完成回调
      });
    });
  }

  /**
   * 重置到初始状态
   * @returns {Promise<void>}
   * @protected
   */
  async _doReset() {
    if (this.originalImageData) {
      await this._doLoadImage(this.originalImageData);
    } else {
      this.canvas.clear();
      this.currentImage = null;
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
    return this.canvas.toDataURL({
      format: type.replace('image/', ''),
      quality: quality,
      multiplier: 1
    });
  }

  /**
   * 导出为Blob
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<Blob>}
   * @protected
   */
  async _doToBlob(type = 'image/png', quality = 0.9) {
    return new Promise((resolve) => {
      this.canvas.toCanvasElement().toBlob(resolve, type, quality);
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
      canvasObjects: this.canvas ? this.canvas.getObjects().length : 0,
      canvasSize: this.canvas ? {
        width: this.canvas.getWidth(),
        height: this.canvas.getHeight()
      } : null
    };
  }

  // ========== 私有辅助方法 ==========

  /**
   * 设置事件监听
   * @private
   */
  _setupEventListeners() {
    if (!this.canvas) return;

    // 对象修改事件
    this.canvas.on('object:modified', (e) => {
      this.emit('object-modified', { target: e.target });
      this._updatePerformanceMetrics();
    });

    // 对象选择事件
    this.canvas.on('selection:created', (e) => {
      this.emit('selection-created', { target: e.target });
    });

    this.canvas.on('selection:cleared', () => {
      this.emit('selection-cleared');
    });

    // 渲染事件
    this.canvas.on('after:render', () => {
      this._updatePerformanceMetrics();
    });
  }

  /**
   * 优化性能设置
   * @private
   */
  _optimizePerformance() {
    if (!this.canvas) return;

    // 设置渲染优化
    this.canvas.renderOnAddRemove = false;
    this.canvas.skipTargetFind = false;
    
    // 启用对象缓存
    fabric.Object.prototype.objectCaching = true;
    fabric.Object.prototype.statefullCache = true;
  }

  /**
   * 根据类型移除滤镜
   * @param {string} filterType - 滤镜类型
   * @private
   */
  _removeFilterByType(filterType) {
    if (!this.currentImage || !this.currentImage.filters) return;

    this.currentImage.filters = this.currentImage.filters.filter(filter => {
      return filter.type !== filterType;
    });
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

export default FabricAdapter;
