import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';
import PerformanceOptimizer from '@/utils/PerformanceOptimizer.js';
import { memoryManager } from '@/utils/MemoryManager.js';

/**
 * Konva.js适配器实现
 * 基于Konva.js库的图像编辑适配器，专注于高性能渲染和动画
 */
class KonvaAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'konva';
    this.stage = null;
    this.layer = null;
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
      draggable: true,
      listening: true
    };
  }

  /**
   * 执行初始化
   * @returns {Promise<void>}
   * @protected
   */
  async _doInitialize() {
    // 检查Konva是否已加载
    if (typeof window.Konva === 'undefined') {
      throw new Error('Konva.js library is not loaded');
    }

    // 创建Stage
    this.stage = new window.Konva.Stage({
      container: this.container,
      width: this.options.width,
      height: this.options.height,
      draggable: this.options.draggable,
      listening: this.options.listening
    });

    // 创建图层
    this.layer = new window.Konva.Layer();
    this.stage.add(this.layer);

    // 设置事件监听
    this._setupEventListeners();
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }
    this.layer = null;
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
      const imageObj = new Image();
      imageObj.crossOrigin = 'anonymous';
      
      imageObj.onload = () => {
        // 清除现有内容
        this.layer.destroyChildren();

        // 创建Konva图像对象
        const konvaImage = new window.Konva.Image({
          x: 0,
          y: 0,
          image: imageObj,
          draggable: true
        });

        // 计算适合舞台的尺寸
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();
        const imgWidth = imageObj.width;
        const imgHeight = imageObj.height;

        const scaleX = stageWidth / imgWidth;
        const scaleY = stageHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        // 设置图像属性
        konvaImage.setAttrs({
          x: (stageWidth - imgWidth * scale) / 2,
          y: (stageHeight - imgHeight * scale) / 2,
          scaleX: scale,
          scaleY: scale
        });

        // 添加到图层
        this.layer.add(konvaImage);
        this.layer.draw();

        // 保存引用和原始数据
        this.currentImage = konvaImage;
        this.originalImageData = {
          src: imageData.src,
          width: imgWidth,
          height: imgHeight,
          scale: scale,
          x: konvaImage.x(),
          y: konvaImage.y()
        };

        this._updatePerformanceMetrics();
        resolve();
      };

      imageObj.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      imageObj.src = imageData.src;
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

    const originalWidth = this.currentImage.image().width;
    const originalHeight = this.currentImage.image().height;

    const scaleX = width / originalWidth;
    const scaleY = height / originalHeight;

    this.currentImage.setAttrs({
      scaleX: scaleX,
      scaleY: scaleY
    });

    this.layer.draw();
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

    this.currentImage.setAttrs({
      cropX: x,
      cropY: y,
      cropWidth: width,
      cropHeight: height
    });

    this.layer.draw();
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

    // 获取图像中心点
    const centerX = this.currentImage.x() + this.currentImage.width() * this.currentImage.scaleX() / 2;
    const centerY = this.currentImage.y() + this.currentImage.height() * this.currentImage.scaleY() / 2;

    this.currentImage.setAttrs({
      rotation: angle,
      offsetX: this.currentImage.width() / 2,
      offsetY: this.currentImage.height() / 2,
      x: centerX,
      y: centerY
    });

    this.layer.draw();
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

    const currentScaleX = this.currentImage.scaleX();
    const currentScaleY = this.currentImage.scaleY();

    if (horizontal) {
      this.currentImage.scaleX(-currentScaleX);
    }

    if (vertical) {
      this.currentImage.scaleY(-currentScaleY);
    }

    this.layer.draw();
    this._updatePerformanceMetrics();
  }

  /**
   * 设置亮度（Konva.js不直接支持，使用滤镜模拟）
   * @param {number} value - 亮度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetBrightness(value) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    // 移除现有滤镜
    this.currentImage.filters([]);

    // 添加亮度滤镜
    if (value !== 0) {
      this.currentImage.filters([window.Konva.Filters.Brighten]);
      this.currentImage.brightness(value);
    }

    this.currentImage.cache();
    this.layer.draw();
    this._updatePerformanceMetrics();
  }

  /**
   * 设置对比度（Konva.js不直接支持，使用滤镜模拟）
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    if (!this.currentImage) {
      throw new Error('No image loaded');
    }

    // 移除现有滤镜
    this.currentImage.filters([]);

    // 添加对比度滤镜
    if (value !== 0) {
      this.currentImage.filters([window.Konva.Filters.Contrast]);
      this.currentImage.contrast(value * 100); // Konva使用-100到100的范围
    }

    this.currentImage.cache();
    this.layer.draw();
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

    const filters = [];
    
    switch (filterType.toLowerCase()) {
      case 'blur':
        filters.push(window.Konva.Filters.Blur);
        this.currentImage.blurRadius(options.blur || 5);
        break;
      case 'grayscale':
        filters.push(window.Konva.Filters.Grayscale);
        break;
      case 'invert':
        filters.push(window.Konva.Filters.Invert);
        break;
      case 'sepia':
        filters.push(window.Konva.Filters.Sepia);
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }

    this.currentImage.filters(filters);
    this.currentImage.cache();
    this.layer.draw();
    this._updatePerformanceMetrics();
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

    this.currentImage.filters([]);
    this.currentImage.clearCache();
    this.layer.draw();
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

    this.currentImage.setAttrs({
      scaleX: scaleX,
      scaleY: scaleY
    });

    this.layer.draw();
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

    this.currentImage.setAttrs({
      x: x,
      y: y
    });

    this.layer.draw();
    this._updatePerformanceMetrics();
  }

  /**
   * 选择对象
   * @protected
   */
  _doSelect() {
    if (this.currentImage) {
      // Konva.js中可以通过添加Transformer来实现选择效果
      // 这里简化处理
      this.currentImage.listening(true);
    }
  }

  /**
   * 取消选择
   * @protected
   */
  _doDeselect() {
    if (this.currentImage) {
      this.currentImage.listening(false);
    }
  }

  /**
   * 保存当前状态
   * @returns {Object}
   * @protected
   */
  _doSaveState() {
    const state = {
      stageState: this.stage.toJSON(),
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

    // 重新加载舞台状态
    this.stage.destroy();
    this.stage = window.Konva.Node.create(state.stageState, this.container);
    this.layer = this.stage.children[0];
    
    // 重新获取图像引用
    this.currentImage = this.layer.children[0];
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
      this.layer.destroyChildren();
      this.layer.draw();
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
    return this.stage.toDataURL({
      mimeType: type,
      quality: quality
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
      this.stage.toCanvas().toBlob(resolve, type, quality);
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
      stageObjects: this.stage ? this.stage.find('Image').length : 0,
      stageSize: this.stage ? {
        width: this.stage.width(),
        height: this.stage.height()
      } : null
    };
  }

  // ========== 私有辅助方法 ==========

  /**
   * 设置事件监听
   * @private
   */
  _setupEventListeners() {
    if (!this.stage) return;

    // 舞台事件
    this.stage.on('dragend', () => {
      this.emit('object-modified', { target: this.currentImage });
      this._updatePerformanceMetrics();
    });

    // 图层事件
    this.layer.on('draw', () => {
      this._updatePerformanceMetrics();
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
   * 执行内存清理
   * @private
   */
  _performMemoryCleanup() {
    try {
      // 清理性能优化器缓存
      if (this.performanceOptimizer) {
        this.performanceOptimizer.cleanupMemory();
      }

      // 清理图像缓存
      if (this.currentImage) {
        this.currentImage.clearCache();
      }

      // 清理图层
      if (this.layer) {
        this.layer.clearCache();
      }

      // 清理舞台
      if (this.stage) {
        this.stage.clearCache();
      }

      console.log('KonvaAdapter 内存清理完成');
    } catch (error) {
      console.error('KonvaAdapter 内存清理失败:', error);
    }
  }
}

export default KonvaAdapter;
