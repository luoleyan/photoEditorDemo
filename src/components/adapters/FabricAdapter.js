import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';
import PerformanceOptimizer from '@/utils/PerformanceOptimizer.js';
import { memoryManager } from '@/utils/MemoryManager.js';
import { mobileAdapter } from '@/utils/MobileAdapter.js';

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

    // 性能优化器
    this.performanceOptimizer = new PerformanceOptimizer();

    // 移动端适配
    this.mobileConfig = mobileAdapter.getMobileConfig();
    this.isMobile = mobileAdapter.getDeviceInfo().isMobile;
    this.touchHandler = null;

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
    return this._safeExecute(async () => {
      // 检查Fabric.js是否已加载
      if (typeof window.fabric === 'undefined') {
        throw new Error('Fabric.js library is not loaded');
      }

      // 创建canvas元素
      const canvasElement = document.createElement('canvas');
      canvasElement.id = `fabric-canvas-${Date.now()}`;
      this.container.appendChild(canvasElement);

      // 初始化Fabric.js Canvas
      this.canvas = new window.fabric.Canvas(canvasElement, {
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

      // 移动端优化
      this._setupMobileOptimizations();
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

    if (this.canvas) {
      // 释放Canvas内存
      memoryManager.deallocate(`fabric-canvas-${this.adapterType}`);
      this.canvas.dispose();
      this.canvas = null;
    }

    if (this.currentImage) {
      memoryManager.deallocate(`fabric-image-${this.adapterType}`);
      this.currentImage = null;
    }

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
    return this._safeExecute(async () => {
      // 验证图像数据
      this._validateImageData(imageData);

      // 使用性能优化器优化图像加载
      const optimizedImage = await this.performanceOptimizer.optimizeImageLoad(imageData.src, {
        maxWidth: this.canvas.getWidth() * 2, // 允许2倍画布大小
        maxHeight: this.canvas.getHeight() * 2,
        quality: 0.9
      });

      return new Promise((resolve, reject) => {
        window.fabric.Image.fromURL(optimizedImage.src, (img) => {
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
            src: optimizedImage.src,
            width: imgWidth,
            height: imgHeight,
            scale: scale,
            left: img.left,
            top: img.top,
            optimized: optimizedImage.compressionRatio ? true : false,
            originalSize: optimizedImage.originalSize,
            compressedSize: optimizedImage.size
          };

          // 注册内存使用
          const estimatedSize = imgWidth * imgHeight * 4; // RGBA
          memoryManager.allocate(`fabric-image-${this.adapterType}`, img, estimatedSize);

          // 更新性能指标
          this._updatePerformanceMetrics();

          resolve();
        }, {
          crossOrigin: 'anonymous'
        });
      });
    }, 'loadImage', {
      imageSource: imageData.src,
      canvasSize: { width: this.canvas.getWidth(), height: this.canvas.getHeight() }
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
    const clipPath = new window.fabric.Rect({
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
      const brightnessFilter = new window.fabric.Image.filters.Brightness({
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
      const contrastFilter = new window.fabric.Image.filters.Contrast({
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
        filter = new window.fabric.Image.filters.Grayscale();
        break;
      case 'sepia':
        filter = new window.fabric.Image.filters.Sepia();
        break;
      case 'invert':
        filter = new window.fabric.Image.filters.Invert();
        break;
      case 'blur':
        filter = new window.fabric.Image.filters.Blur({
          blur: options.blur || 0.1
        });
        break;
      case 'noise':
        filter = new window.fabric.Image.filters.Noise({
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

    // 基础渲染优化
    this.canvas.renderOnAddRemove = false;
    this.canvas.skipTargetFind = false;
    this.canvas.perPixelTargetFind = !this.isMobile; // 移动端禁用精确查找
    this.canvas.targetFindTolerance = this.isMobile ? 8 : 4; // 移动端增大容差

    // 移动端性能优化
    if (this.isMobile) {
      this.canvas.enableRetinaScaling = false; // 移动端禁用高分辨率
      this.canvas.imageSmoothingEnabled = false; // 移动端禁用平滑以提升性能
    } else {
      this.canvas.enableRetinaScaling = true;
      this.canvas.imageSmoothingEnabled = true;
    }

    // 设置选择样式
    this.canvas.selectionColor = 'rgba(100, 149, 237, 0.3)';
    this.canvas.selectionBorderColor = 'rgba(100, 149, 237, 0.8)';
    this.canvas.selectionLineWidth = this.isMobile ? 3 : 2; // 移动端加粗选择线

    // 禁用不需要的功能以提升性能
    this.canvas.preserveObjectStacking = true;
    this.canvas.stopContextMenu = true;
    this.canvas.fireRightClick = false;
    this.canvas.fireMiddleClick = false;

    // 启用对象缓存
    window.fabric.Object.prototype.objectCaching = !this.isMobile; // 移动端禁用缓存以节省内存
    window.fabric.Object.prototype.statefullCache = !this.isMobile;
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

  /**
   * 设置移动端优化
   * @private
   */
  _setupMobileOptimizations() {
    if (!this.isMobile || !this.canvas) return;

    // 优化Canvas尺寸
    mobileAdapter.optimizeCanvas(this.canvas.getElement());

    // 添加触摸支持
    this.touchHandler = mobileAdapter.addTouchSupport(this.canvas.getElement(), {
      enablePinch: true,
      enablePan: true,
      enableTap: true,
      enableDoubleTap: true,
      minScale: 0.1,
      maxScale: 3
    });

    // 监听触摸事件
    if (this.touchHandler) {
      this.canvas.getElement().addEventListener('touch-pinch', (e) => {
        this._handleTouchPinch(e.detail);
      });

      this.canvas.getElement().addEventListener('touch-pan', (e) => {
        this._handleTouchPan(e.detail);
      });

      this.canvas.getElement().addEventListener('touch-doubletap', (e) => {
        this._handleTouchDoubleTap(e.detail);
      });
    }

    // 移动端特定设置
    this.canvas.hoverCursor = 'default';
    this.canvas.moveCursor = 'default';
    this.canvas.defaultCursor = 'default';

    // 禁用右键菜单
    this.canvas.getElement().addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * 处理触摸缩放
   * @param {Object} detail - 触摸详情
   * @private
   */
  _handleTouchPinch(detail) {
    if (!this.currentImage) return;

    const { scale } = detail.transform;
    const currentScale = this.currentImage.scaleX;
    const newScale = Math.max(0.1, Math.min(3, currentScale * scale));

    this.currentImage.set({
      scaleX: newScale,
      scaleY: newScale
    });

    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 处理触摸平移
   * @param {Object} detail - 触摸详情
   * @private
   */
  _handleTouchPan(detail) {
    if (!this.currentImage) return;

    const { x, y } = detail.transform;
    this.currentImage.set({
      left: this.currentImage.left + x,
      top: this.currentImage.top + y
    });

    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 处理触摸双击
   * @param {Object} detail - 触摸详情
   * @private
   */
  _handleTouchDoubleTap(detail) {
    if (!this.currentImage) return;

    // 双击重置缩放和位置
    const canvasCenter = this.canvas.getCenter();
    this.currentImage.set({
      left: canvasCenter.left,
      top: canvasCenter.top,
      scaleX: 1,
      scaleY: 1
    });

    this.canvas.renderAll();
    this._updatePerformanceMetrics();
  }

  /**
   * 执行内存清理
   * @private
   */
  _performMemoryCleanup() {
    try {
      // 清理性能优化器缓存
      if (this.performanceOptimizer) {
        this.performanceOptimizer.cleanupMemory();
      }

      // 清理状态历史
      if (this.stateHistory.size > 10) {
        const entries = Array.from(this.stateHistory.entries());
        const toDelete = entries.slice(0, this.stateHistory.size - 5);
        toDelete.forEach(([key]) => {
          this.stateHistory.delete(key);
        });
      }

      // 清理Canvas缓存
      if (this.canvas) {
        // 清理未使用的对象
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
          if (obj !== this.currentImage && obj.opacity === 0) {
            this.canvas.remove(obj);
          }
        });

        // 强制重新渲染以清理缓存
        this.canvas.renderAll();
      }

      console.log('FabricAdapter 内存清理完成');
    } catch (error) {
      console.error('FabricAdapter 内存清理失败:', error);
    }
  }
}

export default FabricAdapter;
