/**
 * 性能优化工具类
 * 专门处理大图像处理和内存管理优化
 */
class PerformanceOptimizer {
  constructor() {
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB
    this.maxImageDimension = 4096; // 最大图像尺寸
    this.compressionQuality = 0.8; // 压缩质量
    this.tileSize = 512; // 瓦片大小
    this.memoryUsage = 0;
    this.imageCache = new Map();
    this.performanceMetrics = {
      memoryUsage: 0,
      processedImages: 0,
      compressionRatio: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0
    };
  }

  /**
   * 优化图像加载
   * @param {string|File|Blob} imageSource - 图像源
   * @param {Object} options - 优化选项
   * @returns {Promise<Object>} 优化后的图像数据
   */
  async optimizeImageLoad(imageSource, options = {}) {
    const startTime = performance.now();
    
    try {
      // 检查缓存
      const cacheKey = this._generateCacheKey(imageSource, options);
      if (this.imageCache.has(cacheKey)) {
        this.performanceMetrics.cacheHitRate++;
        return this.imageCache.get(cacheKey);
      }

      // 获取图像信息
      const imageInfo = await this._getImageInfo(imageSource);
      
      // 检查是否需要优化
      const needsOptimization = this._needsOptimization(imageInfo, options);
      
      let optimizedImage;
      if (needsOptimization) {
        optimizedImage = await this._optimizeImage(imageInfo, options);
      } else {
        optimizedImage = imageInfo;
      }

      // 更新内存使用情况
      this._updateMemoryUsage(optimizedImage);
      
      // 缓存结果
      this._cacheImage(cacheKey, optimizedImage);
      
      // 更新性能指标
      const processingTime = performance.now() - startTime;
      this._updatePerformanceMetrics(processingTime, imageInfo, optimizedImage);
      
      return optimizedImage;
      
    } catch (error) {
      console.error('图像优化失败:', error);
      throw error;
    }
  }

  /**
   * 压缩图像
   * @param {HTMLImageElement|Canvas} image - 图像对象
   * @param {Object} options - 压缩选项
   * @returns {Promise<Object>} 压缩后的图像数据
   */
  async compressImage(image, options = {}) {
    const {
      maxWidth = this.maxImageDimension,
      maxHeight = this.maxImageDimension,
      quality = this.compressionQuality,
      format = 'image/jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 计算新尺寸
    const { width: newWidth, height: newHeight } = this._calculateOptimalSize(
      image.width || image.naturalWidth,
      image.height || image.naturalHeight,
      maxWidth,
      maxHeight
    );

    canvas.width = newWidth;
    canvas.height = newHeight;

    // 启用图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 绘制压缩后的图像
    ctx.drawImage(image, 0, 0, newWidth, newHeight);

    // 转换为Blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          blob,
          dataURL: canvas.toDataURL(format, quality),
          width: newWidth,
          height: newHeight,
          originalSize: this._getImageSize(image),
          compressedSize: blob.size,
          compressionRatio: blob.size / this._getImageSize(image)
        });
      }, format, quality);
    });
  }

  /**
   * 创建图像瓦片
   * @param {HTMLImageElement|Canvas} image - 图像对象
   * @param {number} tileSize - 瓦片大小
   * @returns {Array} 瓦片数组
   */
  createImageTiles(image, tileSize = this.tileSize) {
    const tiles = [];
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        const tileWidth = Math.min(tileSize, width - x);
        const tileHeight = Math.min(tileSize, height - y);

        const canvas = document.createElement('canvas');
        canvas.width = tileWidth;
        canvas.height = tileHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);

        tiles.push({
          canvas,
          x,
          y,
          width: tileWidth,
          height: tileHeight,
          row,
          col
        });
      }
    }

    return tiles;
  }

  /**
   * 内存清理
   */
  cleanupMemory() {
    // 清理图像缓存
    const cacheSize = this.imageCache.size;
    if (cacheSize > 50) { // 限制缓存大小
      const entries = Array.from(this.imageCache.entries());
      const toDelete = entries.slice(0, cacheSize - 30);
      
      toDelete.forEach(([key]) => {
        this.imageCache.delete(key);
      });
    }

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }

    // 更新内存使用情况
    this._updateMemoryUsage();
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      memoryUsage: this.memoryUsage,
      cacheSize: this.imageCache.size,
      memoryThreshold: this.memoryThreshold
    };
  }

  /**
   * 重置性能指标
   */
  resetMetrics() {
    this.performanceMetrics = {
      memoryUsage: 0,
      processedImages: 0,
      compressionRatio: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0
    };
  }

  // ========== 私有方法 ==========

  /**
   * 获取图像信息
   * @param {string|File|Blob} imageSource - 图像源
   * @returns {Promise<Object>} 图像信息
   * @private
   */
  async _getImageInfo(imageSource) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          element: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: this._getImageSize(img),
          src: img.src
        });
      };
      
      img.onerror = reject;
      
      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else if (imageSource instanceof File || imageSource instanceof Blob) {
        img.src = URL.createObjectURL(imageSource);
      } else {
        reject(new Error('不支持的图像源类型'));
      }
    });
  }

  /**
   * 检查是否需要优化
   * @param {Object} imageInfo - 图像信息
   * @param {Object} options - 选项
   * @returns {boolean} 是否需要优化
   * @private
   */
  _needsOptimization(imageInfo, options) {
    const { width, height, size } = imageInfo;
    const { forceOptimize = false } = options;
    
    return forceOptimize ||
           width > this.maxImageDimension ||
           height > this.maxImageDimension ||
           size > this.memoryThreshold / 4; // 超过阈值的1/4就优化
  }

  /**
   * 优化图像
   * @param {Object} imageInfo - 图像信息
   * @param {Object} options - 优化选项
   * @returns {Promise<Object>} 优化后的图像信息
   * @private
   */
  async _optimizeImage(imageInfo, options) {
    const compressed = await this.compressImage(imageInfo.element, options);
    
    // 创建新的图像元素
    const optimizedImg = new Image();
    optimizedImg.src = compressed.dataURL;
    
    return new Promise((resolve) => {
      optimizedImg.onload = () => {
        resolve({
          element: optimizedImg,
          width: compressed.width,
          height: compressed.height,
          size: compressed.compressedSize,
          src: compressed.dataURL,
          originalSize: imageInfo.size,
          compressionRatio: compressed.compressionRatio
        });
      };
    });
  }

  /**
   * 计算最优尺寸
   * @param {number} width - 原始宽度
   * @param {number} height - 原始高度
   * @param {number} maxWidth - 最大宽度
   * @param {number} maxHeight - 最大高度
   * @returns {Object} 新尺寸
   * @private
   */
  _calculateOptimalSize(width, height, maxWidth, maxHeight) {
    const aspectRatio = width / height;
    
    let newWidth = width;
    let newHeight = height;
    
    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
    
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  /**
   * 获取图像大小（估算）
   * @param {HTMLImageElement} img - 图像元素
   * @returns {number} 图像大小（字节）
   * @private
   */
  _getImageSize(img) {
    const width = img.width || img.naturalWidth || 0;
    const height = img.height || img.naturalHeight || 0;
    return width * height * 4; // RGBA 4字节每像素
  }

  /**
   * 生成缓存键
   * @param {*} imageSource - 图像源
   * @param {Object} options - 选项
   * @returns {string} 缓存键
   * @private
   */
  _generateCacheKey(imageSource, options) {
    const sourceKey = typeof imageSource === 'string' ? imageSource : imageSource.name || 'blob';
    const optionsKey = JSON.stringify(options);
    return `${sourceKey}_${optionsKey}`;
  }

  /**
   * 缓存图像
   * @param {string} key - 缓存键
   * @param {Object} imageData - 图像数据
   * @private
   */
  _cacheImage(key, imageData) {
    this.imageCache.set(key, imageData);
  }

  /**
   * 更新内存使用情况
   * @param {Object} imageData - 图像数据
   * @private
   */
  _updateMemoryUsage(imageData) {
    if (imageData) {
      this.memoryUsage += imageData.size || 0;
    }
    
    this.performanceMetrics.memoryUsage = this.memoryUsage;
  }

  /**
   * 更新性能指标
   * @param {number} processingTime - 处理时间
   * @param {Object} originalImage - 原始图像
   * @param {Object} optimizedImage - 优化后图像
   * @private
   */
  _updatePerformanceMetrics(processingTime, originalImage, optimizedImage) {
    this.performanceMetrics.processedImages++;
    
    // 更新平均处理时间
    const currentAvg = this.performanceMetrics.averageProcessingTime;
    const count = this.performanceMetrics.processedImages;
    this.performanceMetrics.averageProcessingTime = 
      (currentAvg * (count - 1) + processingTime) / count;
    
    // 更新压缩比
    if (optimizedImage.compressionRatio) {
      const currentRatio = this.performanceMetrics.compressionRatio;
      this.performanceMetrics.compressionRatio = 
        (currentRatio * (count - 1) + optimizedImage.compressionRatio) / count;
    }
  }
}

export default PerformanceOptimizer;
