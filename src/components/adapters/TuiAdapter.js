import BaseImageEditorAdapter from './BaseImageEditorAdapter.js';
import { errorHandler } from '@/utils/ErrorHandler.js';
import { memoryManager } from '@/utils/MemoryManager.js';

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
    this.stateHistory = new Map();
    this.currentStateId = null;
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
    return this._safeExecute(async () => {
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

      // 注册内存使用
      const estimatedSize = 50 * 1024 * 1024; // 估算50MB
      memoryManager.allocate(`tui-editor-${this.adapterType}`, this.editor, estimatedSize);

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

    if (this.editor) {
      // 释放编辑器内存
      memoryManager.deallocate(`tui-editor-${this.adapterType}`);
      this.editor.destroy();
      this.editor = null;
    }

    this.originalImageData = null;
    this.stateHistory.clear();
    this.currentStateId = null;
  }

  /**
   * 执行图像加载
   * @param {Object} imageData - 图像数据
   * @returns {Promise<void>}
   * @protected
   */
  async _doLoadImage(imageData) {
    return this._safeExecute(async () => {
      if (!this.editor) {
        throw new Error('No editor instance');
      }

      // 验证图像数据
      this._validateImageData(imageData);

      return new Promise((resolve, reject) => {
        this.editor.loadImageFromURL(imageData.src, 'image')
          .then(() => {
            try {
              // 保存原始数据
              this.originalImageData = {
                src: imageData.src,
                type: imageData.type || 'url',
                timestamp: Date.now(),
                width: this.editor.getImageWidth(),
                height: this.editor.getImageHeight()
              };

              // 创建新的状态
              this.currentStateId = this._generateStateId();
              const state = this._createCurrentState();
              this.stateHistory.set(this.currentStateId, state);

              this._updatePerformanceMetrics();
              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .catch((error) => {
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
    return this._safeExecute(async () => {
      if (!this.editor) {
        throw new Error('No editor instance');
      }

      // TUI Image Editor没有直接的位置设置方法
      // 尝试通过移动活动对象来实现
      try {
        const activeObject = this.editor.getActiveObject();
        if (activeObject) {
          this.editor.setObjectPosition(activeObject.id, { x, y });
        }
      } catch (error) {
        // 如果没有活动对象或方法不存在，记录警告但不抛出错误
        console.warn('Cannot set position in TUI Image Editor:', error.message);
      }

      this._updatePerformanceMetrics();
    }, 'setPosition', { x, y });
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
    return this._safeExecute(() => {
      if (!this.editor) {
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

      if (!this.editor) {
        throw new Error('No editor instance');
      }

      // 恢复图像数据
      if (state.imageData) {
        await this.editor.loadImageFromURL(state.imageData, 'restored-image');
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
    return this._safeExecute(async () => {
      if (!this.editor) {
        throw new Error('No editor instance');
      }

      // 验证参数
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(type)) {
        console.warn(`Unsupported image type: ${type}, using image/png instead`);
        type = 'image/png';
      }

      if (quality < 0 || quality > 1) {
        console.warn(`Invalid quality value: ${quality}, using 0.9 instead`);
        quality = 0.9;
      }

      // TUI Image Editor的导出选项
      const exportOptions = {
        format: type.replace('image/', ''),
        quality: Math.round(quality * 100) // TUI使用0-100的质量范围
      };

      return this.editor.toDataURL(exportOptions);
    }, 'toDataURL', { type, quality });
  }

  /**
   * 导出为Blob
   * @param {string} type - 图像类型
   * @param {number} quality - 图像质量
   * @returns {Promise<Blob>}
   * @protected
   */
  async _doToBlob(type = 'image/png', quality = 0.9) {
    return this._safeExecute(async () => {
      if (!this.editor) {
        throw new Error('No editor instance');
      }

      const dataURL = await this._doToDataURL(type, quality);
      return this._dataURLToBlob(dataURL);
    }, 'toBlob', { type, quality });
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
    try {
      const arr = dataURL.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new Blob([u8arr], { type: mime });
    } catch (error) {
      throw new Error(`Failed to convert DataURL to Blob: ${error.message}`);
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
      imageData: null,
      originalImageData: null,
      editorState: null
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
        imageData: this.editor ? this.editor.toDataURL() : null,
        originalImageData: this.originalImageData ? { ...this.originalImageData } : null,
        editorState: this._getEditorState()
      };
    } catch (error) {
      console.warn('Failed to create current state:', error);
      return this._createEmptyState();
    }
  }

  /**
   * 获取编辑器状态
   * @returns {Object}
   * @private
   */
  _getEditorState() {
    if (!this.editor) return null;

    try {
      return {
        canvasSize: this.editor.getCanvasSize(),
        // 可以添加更多状态信息
      };
    } catch (error) {
      console.warn('Failed to get editor state:', error);
      return null;
    }
  }

  /**
   * 限制状态历史数量
   * @private
   */
  _limitStateHistory() {
    const maxStates = 50; // 最多保存50个状态
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
    if (this.stateHistory.size > 20) {
      const entries = Array.from(this.stateHistory.entries());
      const toDelete = entries.slice(0, this.stateHistory.size - 20);

      toDelete.forEach(([stateId]) => {
        this.stateHistory.delete(stateId);
      });
    }

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }
  }
}

export default TuiAdapter;
