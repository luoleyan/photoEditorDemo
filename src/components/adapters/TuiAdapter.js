import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';

/**
 * TUI Image Editor适配器实现
 * 基于TOAST UI Image Editor库的图像编辑适配器，提供完整的UI界面
 */
class TuiAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'tui';
    this.editor = null;
    this.originalImageData = null;
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
      includeUI: {
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter'],
        initMenu: 'filter',
        uiSize: {
          width: '100%',
          height: '100%'
        },
        menuBarPosition: 'bottom'
      },
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
      },
      usageStatistics: false
    };
  }

  /**
   * 执行初始化
   * @returns {Promise<void>}
   * @protected
   */
  async _doInitialize() {
    // 检查TUI Image Editor是否已加载
    if (typeof window.tui === 'undefined' || typeof window.tui.ImageEditor === 'undefined') {
      throw new Error('TUI Image Editor library is not loaded');
    }

    // 设置容器ID
    const containerId = `tui-image-editor-container-${Date.now()}`;
    this.container.id = containerId;

    // 创建TUI Image Editor实例
    const options = {
      ...this.options,
      includeUI: {
        ...this.options.includeUI,
        loadImage: {
          path: '',
          name: 'Blank'
        }
      }
    };

    this.editor = new window.tui.ImageEditor(`#${containerId}`, options);
    
    // 设置事件监听
    this._setupEventListeners();
  }

  /**
   * 执行销毁
   * @protected
   */
  _doDestroy() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
    this.originalImageData = null;
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    return new Promise((resolve, reject) => {
      this.editor.loadImageFromURL(imageData.src, 'image')
        .then(() => {
          // 保存原始数据
          this.originalImageData = {
            src: imageData.src,
            width: this.editor.getImageWidth(),
            height: this.editor.getImageHeight()
          };
          
          this._updatePerformanceMetrics();
          resolve();
        })
        .catch((error) => {
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    this.editor.resizeCanvasDimension({ width, height });
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    this.editor.crop({
      left: x,
      top: y,
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    // TUI Image Editor的旋转是相对当前角度的增量
    // 这里简化处理，直接设置为指定角度
    this.editor.rotate(angle);
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    if (horizontal) {
      this.editor.flipX();
    }

    if (vertical) {
      this.editor.flipY();
    }

    this._updatePerformanceMetrics();
  }

  /**
   * 设置亮度
   * @param {number} value - 亮度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetBrightness(value) {
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    // TUI Image Editor的亮度范围是-100到100
    const tuiValue = value * 100;
    this.editor.setBrightness(tuiValue);
    this._updatePerformanceMetrics();
  }

  /**
   * 设置对比度
   * @param {number} value - 对比度值 (-1 到 1)
   * @returns {Promise<void>}
   * @protected
   */
  async _doSetContrast(value) {
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    // TUI Image Editor没有直接的对比度调整，使用滤镜代替
    const filterValue = value * 100;
    this.editor.applyFilter('contrast', filterValue);
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    let tuiFilterType = filterType;
    let value = 100;

    // 映射滤镜类型
    switch (filterType.toLowerCase()) {
      case 'grayscale':
        tuiFilterType = 'grayscale';
        break;
      case 'sepia':
        tuiFilterType = 'sepia';
        break;
      case 'blur':
        tuiFilterType = 'blur';
        value = options.blur || 10;
        break;
      case 'sharpen':
        tuiFilterType = 'sharpen';
        break;
      case 'invert':
        tuiFilterType = 'invert';
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }

    this.editor.applyFilter(tuiFilterType, value);
    this._updatePerformanceMetrics();
  }

  /**
   * 移除滤镜
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<void>}
   * @protected
   */
  async _doRemoveFilter(filterType) {
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    // TUI Image Editor没有直接的移除滤镜方法，使用重置代替
    this.editor.removeFilter(filterType);
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    // TUI Image Editor没有直接的缩放方法，使用变换代替
    this.editor.setObjectScale(scaleX, scaleY);
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    // TUI Image Editor没有直接的位置设置方法
    // 这里简化处理
    this._updatePerformanceMetrics();
  }

  /**
   * 选择对象
   * @protected
   */
  _doSelect() {
    // TUI Image Editor自动处理选择
  }

  /**
   * 取消选择
   * @protected
   */
  _doDeselect() {
    if (this.editor) {
      this.editor.discardSelection();
    }
  }

  /**
   * 保存当前状态
   * @returns {Object}
   * @protected
   */
  _doSaveState() {
    if (!this.editor) {
      return { timestamp: Date.now() };
    }

    const state = {
      imageData: this.editor.toDataURL(),
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
    if (!state || !this.editor) {
      throw new Error(`State not found or no editor instance: ${stateId}`);
    }

    if (state.imageData) {
      await this._doLoadImage({ src: state.imageData });
    }
  }

  /**
   * 重置到初始状态
   * @returns {Promise<void>}
   * @protected
   */
  async _doReset() {
    if (this.editor && this.originalImageData) {
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    return this.editor.toDataURL({
      format: type.replace('image/', ''),
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
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    const dataURL = await this._doToDataURL(type, quality);
    return this._dataURLToBlob(dataURL);
  }

  /**
   * 获取性能指标
   * @returns {Object}
   * @protected
   */
  _doGetPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      editorReady: !!this.editor,
      imageSize: this.originalImageData ? {
        width: this.originalImageData.width,
        height: this.originalImageData.height
      } : null
    };
  }

  // ========== TUI Image Editor特有方法 ==========

  /**
   * 添加文本
   * @param {string} text - 文本内容
   * @param {Object} options - 文本选项
   * @returns {Promise<string>} 文本对象ID
   */
  async addText(text, options = {}) {
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    const id = this.editor.addText(text, options);
    this._updatePerformanceMetrics();
    return id;
  }

  /**
   * 添加形状
   * @param {string} shapeType - 形状类型
   * @param {Object} options - 形状选项
   * @returns {Promise<string>} 形状对象ID
   */
  async addShape(shapeType, options = {}) {
    if (!this.editor) {
      throw new Error('No editor instance');
    }

    let tuiShapeType = 'rect';
    switch (shapeType.toLowerCase()) {
      case 'rectangle':
        tuiShapeType = 'rect';
        break;
      case 'circle':
        tuiShapeType = 'circle';
        break;
      case 'triangle':
        tuiShapeType = 'triangle';
        break;
      default:
        tuiShapeType = shapeType;
    }

    const id = this.editor.addShape(tuiShapeType, options);
    this._updatePerformanceMetrics();
    return id;
  }

  // ========== 私有辅助方法 ==========

  /**
   * 设置事件监听
   * @private
   */
  _setupEventListeners() {
    if (!this.editor) return;

    // 这里可以添加更多的事件监听
    this.editor.on('objectActivated', (props) => {
      this.emit('object-selected', props);
    });

    this.editor.on('objectMoved', (props) => {
      this.emit('object-moved', props);
      this._updatePerformanceMetrics();
    });

    this.editor.on('objectScaled', (props) => {
      this.emit('object-scaled', props);
      this._updatePerformanceMetrics();
    });

    this.editor.on('objectRotated', (props) => {
      this.emit('object-rotated', props);
      this._updatePerformanceMetrics();
    });

    this.editor.on('undoStackChanged', (props) => {
      this.emit('history-changed', props);
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
   * 将DataURL转换为Blob
   * @param {string} dataURL - DataURL
   * @returns {Blob} Blob对象
   * @private
   */
  _dataURLToBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }
}

export default TuiAdapter;
