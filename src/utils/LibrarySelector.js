/**
 * 智能库选择器
 * 根据操作类型和图像特征自动选择最适合的图像编辑库
 */
class LibrarySelector {
  constructor(options = {}) {
    this.adapterManager = options.adapterManager || null;
    this.preferredLibraries = options.preferredLibraries || {};
    this.performanceData = {};
    this.imageFeatures = {};
    this.operationHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 100;
  }

  /**
   * 设置适配器管理器
   * @param {AdapterManager} adapterManager - 适配器管理器实例
   */
  setAdapterManager(adapterManager) {
    this.adapterManager = adapterManager;
  }

  /**
   * 根据操作类型选择最佳库
   * @param {string} operationType - 操作类型
   * @param {Object} imageInfo - 图像信息
   * @returns {string} 最佳库类型
   */
  selectBestLibraryForOperation(operationType, imageInfo = null) {
    // 记录操作
    this._recordOperation(operationType, imageInfo);
    
    // 如果有图像信息，更新图像特征
    if (imageInfo) {
      this._updateImageFeatures(imageInfo);
    }
    
    // 根据操作类型选择库
    const libraryType = this._selectLibraryByOperationType(operationType);
    
    // 记录选择结果
    this._recordSelection(operationType, libraryType);
    
    return libraryType;
  }

  /**
   * 根据图像特征选择最佳库
   * @param {Object} imageInfo - 图像信息
   * @returns {string} 最佳库类型
   */
  selectBestLibraryForImage(imageInfo) {
    // 更新图像特征
    this._updateImageFeatures(imageInfo);
    
    // 根据图像特征选择库
    const libraryType = this._selectLibraryByImageFeatures(imageInfo);
    
    // 记录选择结果
    this._recordSelection('image-load', libraryType);
    
    return libraryType;
  }

  /**
   * 设置库偏好
   * @param {Object} preferences - 库偏好设置
   */
  setPreferences(preferences) {
    this.preferredLibraries = { ...this.preferredLibraries, ...preferences };
  }

  /**
   * 获取库偏好
   * @returns {Object} 库偏好设置
   */
  getPreferences() {
    return { ...this.preferredLibraries };
  }

  /**
   * 获取操作历史
   * @returns {Array} 操作历史
   */
  getOperationHistory() {
    return [...this.operationHistory];
  }

  /**
   * 获取性能数据
   * @returns {Object} 性能数据
   */
  getPerformanceData() {
    return { ...this.performanceData };
  }

  /**
   * 更新性能数据
   * @param {string} libraryType - 库类型
   * @param {Object} metrics - 性能指标
   */
  updatePerformanceData(libraryType, metrics) {
    if (!this.performanceData[libraryType]) {
      this.performanceData[libraryType] = {
        operationCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastUpdated: Date.now()
      };
    }
    
    const data = this.performanceData[libraryType];
    data.operationCount++;
    data.totalRenderTime += metrics.renderTime || 0;
    data.averageRenderTime = data.totalRenderTime / data.operationCount;
    data.lastUpdated = Date.now();
    
    // 添加新指标
    Object.keys(metrics).forEach(key => {
      if (key !== 'renderTime') {
        data[key] = metrics[key];
      }
    });
  }

  /**
   * 清除历史数据
   */
  clearHistory() {
    this.operationHistory = [];
  }

  // ========== 私有方法 ==========

  /**
   * 记录操作
   * @param {string} operationType - 操作类型
   * @param {Object} imageInfo - 图像信息
   * @private
   */
  _recordOperation(operationType, imageInfo) {
    this.operationHistory.push({
      operationType,
      timestamp: Date.now(),
      imageInfo: imageInfo ? { ...imageInfo } : null
    });
    
    // 限制历史记录长度
    if (this.operationHistory.length > this.maxHistoryLength) {
      this.operationHistory = this.operationHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * 更新图像特征
   * @param {Object} imageInfo - 图像信息
   * @private
   */
  _updateImageFeatures(imageInfo) {
    this.imageFeatures = {
      width: imageInfo.width || 0,
      height: imageInfo.height || 0,
      fileType: imageInfo.fileType || 'unknown',
      hasAlpha: imageInfo.hasAlpha || false,
      fileSize: imageInfo.fileSize || 0,
      lastUpdated: Date.now()
    };
  }

  /**
   * 记录选择结果
   * @param {string} operationType - 操作类型
   * @param {string} libraryType - 库类型
   * @private
   */
  _recordSelection(operationType, libraryType) {
    // 这里可以添加更多的记录逻辑，例如统计每种操作类型选择的库
    console.log(`Selected ${libraryType} for operation: ${operationType}`);
  }

  /**
   * 根据操作类型选择库
   * @param {string} operationType - 操作类型
   * @returns {string} 库类型
   * @private
   */
  _selectLibraryByOperationType(operationType) {
    // 检查用户偏好
    if (this.preferredLibraries[operationType]) {
      return this.preferredLibraries[operationType];
    }
    
    // 根据操作类型选择最佳库
    switch (operationType) {
      case 'crop':
        return 'cropper'; // Cropper.js专注于裁剪功能
        
      case 'rotate':
      case 'scale':
      case 'position':
      case 'animation':
        return 'konva'; // Konva.js在变换和动画方面表现优秀
        
      case 'filter':
      case 'brightness':
      case 'contrast':
      case 'saturation':
      case 'hue':
        return 'fabric'; // Fabric.js在滤镜方面功能丰富
        
      case 'text':
      case 'shape':
      case 'object':
        return 'fabric'; // Fabric.js在对象操作方面功能强大
        
      case 'batch-processing':
        return 'jimp'; // Jimp在批处理方面表现良好
        
      case 'full-ui':
        return 'tui'; // TUI Image Editor提供完整UI
        
      default:
        return 'fabric'; // 默认使用Fabric.js作为通用库
    }
  }

  /**
   * 根据图像特征选择库
   * @param {Object} imageInfo - 图像信息
   * @returns {string} 库类型
   * @private
   */
  _selectLibraryByImageFeatures(imageInfo) {
    const { width, height, fileType, hasAlpha, fileSize } = imageInfo;
    
    // 大图像使用性能更好的库
    if (width * height > 4000 * 3000 || fileSize > 5 * 1024 * 1024) {
      return 'konva'; // Konva.js在处理大图像时性能更好
    }
    
    // SVG图像
    if (fileType === 'svg') {
      return 'fabric'; // Fabric.js对SVG支持更好
    }
    
    // 带透明度的图像
    if (hasAlpha) {
      return 'fabric'; // Fabric.js对透明度处理更好
    }
    
    // 默认使用功能最全面的库
    return 'fabric';
  }

  /**
   * 获取库的性能评分
   * @param {string} libraryType - 库类型
   * @returns {number} 性能评分
   * @private
   */
  _getLibraryPerformanceScore(libraryType) {
    const data = this.performanceData[libraryType];
    if (!data) return 0;
    
    // 计算性能评分，可以根据需要调整权重
    const renderTimeScore = data.averageRenderTime > 0 ? 100 / data.averageRenderTime : 0;
    
    return renderTimeScore;
  }
}

export default LibrarySelector;
